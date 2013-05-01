/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, Mustache */
/*unittests: JSInstrumentation */

define(function (require, exports, module) {
    "use strict";
    
    var acorn = require("extensions/default/JavaScriptCodeHints/thirdparty/acorn/acorn"),
        functionInstrText = require("text!language/js-function-instr.txt"),
        functionInstrTemplate = Mustache.compile(functionInstrText);
    
    var _nextId = 0;
    
    /**
     * Given a node, returns an array of all the children of the node that can (recursively) contain function
     * definitions, in source order. Different node types have different properties that refer to their children, 
     * so this abstracts across them. For example, a try/catch/finally statement has multiple child blocks; this 
     * sews them together into a single list. Also, expressions can contain function declarations (though this isn't 
     * common) as part of a call evaluation, so we have to recurse them too.
     * @param {Object} node The node to get the children of.
     * @return {Array.<Object>} Array of children of the node; empty if no children. Note that if the node has only 
     *     a single direct child, we still wrap it in an array for consistency. Does not try too hard to avoid
     *     nested arrays.
     */
    function getChildNodes(node) {
        var tmpResult = [];
        
        function makeResult() {
            var result = [];
            [].forEach.call(arguments, function (arg) {
                if (arg) {
                    result.push(arg);
                }
            });
            return result;
        }
        
        switch (node.type) {
        case "Program":
        case "BlockStatement":
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "LabeledStatement":
        case "CatchClause":
            return makeResult(node.body);
        
        case "ExpressionStatement":
            return makeResult(node.expression);
                
        case "IfStatement":
        case "ConditionalExpression":
        case "SwitchCase":
            return makeResult(node.test, node.consequent, node.alternate);
                
        case "WithStatement":
            return makeResult(node.object, node.body);
                
        case "SwitchStatement":
            return makeResult(node.discriminant, node.cases);
        
        case "ReturnStatement":
        case "ThrowStatement":
        case "UnaryExpression":
        case "UpdateExpression":
            return makeResult(node.argument);
        
        case "TryStatement":
            return makeResult(node.block, node.handler, node.finalizer);
        
        case "WhileStatement":
            return makeResult(node.test, node.body);
                
        case "DoWhileStatement":
            return makeResult(node.body, node.test);
            
        case "ForStatement":
            return makeResult(node.init, node.test, node.update, node.body);
                
        case "ForInStatement":
        case "ForOfStatement":
            return makeResult(node.left, node.right, node.body);
        
        case "VariableDeclaration":
            return makeResult(node.declarations);
                
        case "VariableDeclarator":
            return makeResult(node.init);
        
        case "ArrayExpression":
            return makeResult(node.elements);
                
        case "ObjectExpression":
            if (node.properties) {
                node.properties.forEach(function (prop) {
                    tmpResult.push(prop.value);
                });
            }
            return tmpResult;
        
        case "SequenceExpression":
            return makeResult(node.expressions);
        
        case "BinaryExpression":
        case "AssignmentExpression":
        case "LogicalExpression":
            return makeResult(node.left, node.right);
                
        case "NewExpression":
        case "CallExpression":
            return makeResult(node.callee, node["arguments"]);
                
        case "MemberExpression":
            return makeResult(node.object, node.property);
        }
        
        return [];
    }
    
    /**
     * Finds the first descendant node of the given root that is of one of the given types.
     * @param {Object|Array} root The root AST node to start searching from, or an array of nodes to search.
     * @param {Array} types The types of node to find.
     * @return {Object} The first descendant of the given type, or null if not found.
     */
    function findFirst(root, types) {
        var result;
        if (Array.isArray(root)) {
            var i;
            for (i = 0; i < root.length; i++) {
                result = findFirst(root[i], types);
                if (result) {
                    return result;
                }
            }
        } else if (types.indexOf(root.type) !== -1) {
            return root;
        } else {
            return findFirst(getChildNodes(root), types);
        }
        return null;
    }
    
    /**
     * Given two AST node positions, returns the source fragment between them.
     * @param {string} src The original source string the AST was generated from.
     * @param {{line: Number, column: Number}} start The start offset, with line being 1-based and column being 0-based. Inclusive.
     * @param {{line: Number, column: Number}} end The end offset, with line being 1-based and column being 0-based. Exclusive.
     * @return {string} The source fragment between those positions.
     */
    function getSourceFromRange(src, start, end) {
        // TODO: cache the split src
        var lines = src.split("\n").slice(start.line - 1, end.line);
        // Do the end first in case the start line is the same as the end line.
        lines[end.line - start.line] = lines[end.line - start.line].slice(0, end.column);
        lines[0] = lines[0].slice(start.column);
        return lines.join("\n");
    }
    
    /**
     * Instruments a function with the wrapper we need to allow hot-replacement of the function.
     * @param {string} src The source containing the function (may contain other things as well if root is specified).
     * @param {Array.<{start: {line: number, ch: number}, end: {line: number, ch: number}, data}>} rangeList
     *     An array to be filled in with offsets of each function in the *original* src string, with "data"
     *     being a unique id for each function. (line/ch are 0-based as in CodeMirror, not as in Acorn.)
     *     Ranges are not guaranteed to be sorted.
     * @param {Object=} root If specified, an already-parsed root node within the given source. If not specified, will
     *     parse the entire given src (and expect that it contains exactly one function).
     * @param {boolean=} resetId If false, will not reset the starting function ID to 0. Default true.
     * @return {string} The instrumented function.
     */
    function instrumentFunction(src, rangeList, root, resetId) {
        if (resetId !== false) {
            _nextId = 0;
        }

        root = root || acorn.parse(src, {locations: true});

        var functionNode = findFirst(root, ["FunctionDeclaration", "FunctionExpression"]),
            functionBodyNode = functionNode.body,
            id = _nextId++,
            functionBody = "",
            functionBodyStart,
            functionBodyEnd;
        // functionBodyNode should be a BlockStatement whose body is the actual list of statements.
        if (functionBodyNode.body && Array.isArray(functionBodyNode.body) && functionBodyNode.body.length) {
            functionBodyStart = functionBodyNode.body[0].loc.start;
            functionBodyEnd = functionBodyNode.body[functionBodyNode.body.length - 1].loc.end;
            functionBody = instrument(src, rangeList, functionBodyNode.body, false);
        } else {
            // empty body, assume we have to bump in from the outer body boundaries for the braces
            functionBodyStart = functionBodyNode.loc.start + 1;
            functionBodyEnd = functionBodyNode.loc.end - 1;
        }
        rangeList.push({
            start: {
                line: root.loc.start.line - 1,
                ch: root.loc.start.column
            },
            end: {
                line: root.loc.end.line - 1,
                ch: root.loc.end.column
            },
            data: id
        });
        return getSourceFromRange(src, root.loc.start, functionBodyStart) +
            functionInstrTemplate({ id: id, body: functionBody }) +
            getSourceFromRange(src, functionBodyEnd, root.loc.end);
    }
    
    // *** TODO: different files should have different IDs (disambiguate with prefix)
    /**
     * Instruments the functions in a JS file.
     * @param {string} src The source of the file.
     * @param {Array.<{start: {line: number, ch: number}, end: {line: number, ch: number}, data}>} rangeList
     *     An array to be filled in with offsets of each function in the *original* src string, with "data"
     *     being a unique id for each function. (line/ch are 0-based as in CodeMirror, not as in Acorn.)
     *     Ranges are not guaranteed to be sorted.
     * @param {Object|Array=} root If specified, an already-parsed root node or array of nodes within the given
     *     source. If not specified, will parse the entire given src.
     * @param {boolean=} resetId If false, will not reset the starting function ID to 0. Default true.
     * @return {string} The instrumented source.
     */
    
    //var _indent = 0;
    function instrument(src, rangeList, root, resetId) {
        if (resetId !== false) {
            _nextId = 0;
        }
        
        root = root || acorn.parse(src, {locations: true});
        
        // Confusing: source positions in acorn are line/column with a 1-based line, whereas positions
        // we want to output are CodeMirror-style (line/ch with a 0-based line). Need to keep straight
        // which is which.
        var srcPos = {line: 1, column: 0},
            instrumented = "";
        if (Array.isArray(root) && root.length) {
            srcPos = root[0].loc.start;
        } else {
            srcPos = root.loc.start;
        }
        
        // Walk the parse tree, instrumenting function nodes. Accumulate strings for everything in between.
        function walk(node) {
            //console.log(new Array(_indent).join("  ") + (Array.isArray(node) ? "[list]" : node.type) + " >");
            //_indent++;
            if (Array.isArray(node)) {
                node.forEach(function (child) {
                    walk(child);
                });
            } else if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
                instrumented += getSourceFromRange(src, srcPos, node.loc.start) +
                    instrumentFunction(src, rangeList, node, false);
                srcPos = node.loc.end;
            } else {
                walk(getChildNodes(node));
            }
            //_indent--;
            //console.log(new Array(_indent).join("  ") + "< " + (Array.isArray(node) ? "[list]" : node.type));
        }
        
        walk(root);
        
        // Append the source from the end of the last instrumented function to the end of the provided
        // node(s).
        var end;
        if (Array.isArray(root) && root.length) {
            end = root[root.length - 1].loc.end;
        } else {
            end = root.loc.end;
        }
        if (end) {
            instrumented += getSourceFromRange(src, srcPos, end);
        }
        return instrumented;
    }
    
    /**
     * Escapes the given JavaScript source so that it can be stored in a string which is later eval'ed.
     * @param {string} src The source to escape.
     * @return {string} The escaped source.
     */
    function escapeJS(src) {
        return src
            .replace(/\\/g, "\\\\")
            .replace(/"/g, "\\\"")
            .replace(/'/g, "\\'")
            .replace(/\n/g, "\\n");
    }
    
    /**
     * Given the source of a function, returns the function's body.
     * @param {string} src The function source.
     * @param {string} The body of the function.
     */
    function getFunctionBody(src) {
        var root = acorn.parse(src, {locations: true}),
            fn = findFirst(root, ["FunctionDeclaration", "FunctionExpression"]);
        // The "body" child of the function is a block statement; the actual statements within the block are
        // in fn.body.body.
        if (fn && fn.body && fn.body.body) {
            var statements = fn.body.body;
            if (Array.isArray(statements) && statements.length) {
                return getSourceFromRange(src, statements[0].loc.start, statements[statements.length - 1].loc.end);
            }
        }
        return "";
    }
    
    /**
     * @private
     * Gets the template used for instrumenting functions. For unit testing only.
     * @return {Function} the current compiled function template
     */
    function _getFunctionTemplate() {
        return functionInstrTemplate;
    }
    
    /**
     * @private
     * Sets the template used for instrumenting functions. For unit testing only.
     * @param {Function} template the compiled function template
     */
    function _setFunctionTemplate(template) {
        functionInstrTemplate = template;
    }
    
    exports.instrumentFunction = instrumentFunction;
    exports.instrument = instrument;
    exports.escapeJS = escapeJS;
    exports.getFunctionBody = getFunctionBody;
    
    // for unit testing
    exports.findFirst = findFirst;
    exports.getSourceFromRange = getSourceFromRange;
    exports._getFunctionTemplate = _getFunctionTemplate;
    exports._setFunctionTemplate = _setFunctionTemplate;
});