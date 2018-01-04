/*
* Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/*
 * Utilities functions related to refactoring
 */
define(function (require, exports, module) {
    'use strict';

    var Acorn         = brackets.getModule("thirdparty/acorn/dist/acorn"),
        ASTWalker     = brackets.getModule("thirdparty/acorn/dist/walk"),
        MessageIds    = brackets.getModule("JSUtils/MessageIds"),
        _             = brackets.getModule("thirdparty/lodash"),
        ScopeManager  = brackets.getModule("JSUtils/ScopeManager");

    // Length of the function body used as function name for nameless functions
    var FUNCTION_BODY_PREFIX_LENGTH = 30;

    /**
     * Checks whether two ast nodes are equal
     * @param {!ASTNode} a
     * @param {!ASTNode} b
     * @return {boolean}
     */
    function isEqual(a, b) {
        return a.start === b.start && a.end === b.end;
    }

    /**
     * Gets a expression surrounding start and end (if any)
     * @param {!ASTNode} ast - the ast of the complete file
     * @param {!number} start - the start offset
     * @param {!number} end - the end offset
     * @param {!string} fileText - the entire file text
     * @return {ASTNode|boolean}
     */
    function getExpression(ast, start, end, fileText) {
        var expn = findSurroundASTNode(ast, {start: start, end: end}, ["Expression"]);
        if (!expn) {
             return false;
        }

        // Class Expression also includes the trailing semicolon
        // Add special case for it
        if (expn.type === "ClassExpression" && expn.start === start && expn.end - end <= 1) {
            expn.end = end;
            return expn;
        }
        else if (expn.start === start && expn.end === end) {
            return expn;
        }

        // Subexpressions are possible only for BinaryExpression, LogicalExpression and SequenceExpression
        if (!(["BinaryExpression", "LogicalExpression", "SequenceExpression"].includes(expn.type))) {
            return false;
        }

        // Check subexpression
        var parentExpn = expn;
        var parentExpStr = fileText.substr(parentExpn.start, parentExpn.end - parentExpn.start);

        // Check whether the parentExpn forms a valid expression after replacing the sub expression
        var str = parentExpStr.substr(0, start - parentExpn.start) + "placeHolder" + parentExpStr.substr(end - parentExpn.start);
        var node = isStandAloneExpression(str);
        if (node && node.type === parentExpn.type) {
            return parentExpn;
        }

        return false;
    }

    function getAST(text) {
        var ast;
        try {
            ast = Acorn.parse(text, {ecmaVersion: 9});
        } catch(e) {
            ast = Acorn.parse_dammit(text, {ecmaVersion: 9});
        }
        return ast;
    }

    /**
     * Checks whether the text between start and end offsets form a valid set of statements
     * @param {!ASTNode} ast - the ast of the complete file
     * @param {!number} start - the start offset
     * @param {!number} end - the end offset
     * @param {!string} fileText - the entire file text
     * @return {boolean}
     */
    function checkStatement(ast, start, end, fileText) {
        // Do not allow function or class nodes
        var notStatement = false;
        ASTWalker.simple(getAST(fileText.substr(start, end - start)), {
            FunctionDeclaration: function (node) {
                notStatement = true;
            },
            ClassDeclaration: function (node) {
                notStatement = true;
            }
        });

        if (notStatement) {
             return false;
        }

        var startStatement = findSurroundASTNode(ast, {start: start}, ["Statement"]);
        var endStatement   = findSurroundASTNode(ast, {start: end}, ["Statement"]);

        return startStatement && endStatement && startStatement.start === start &&
            startStatement.end <= end && endStatement.start >= start &&
            endStatement.end === end;
    }

    /**
     * Gets a unique identifier name in the scope that starts with prefix
     * @param {!Scope} scopes - an array of all scopes returned from tern (each element contains 'props' with identifiers
     *  in that scope)
     * @param {!string} prefix - prefix of the identifier
     * @param {number} num - number to start checking for
     * @return {!string} identifier name
     */
    function getUniqueIdentifierName(scopes, prefix, num) {
        if (!scopes) {
            return prefix;
        }

        var props = scopes.reduce(function(props, scope) {
            return _.union(props, _.keys(scope.props));
        }, []);

        if (!props) {
            return prefix;
        }

        num = num || "1";
        var name;
        while (num < 100) { // limit search length
            name = prefix + num;
            if (props.indexOf(name) === -1) {
                break;
            }
            ++num;
        }
        return name;
    }

    /**
     * Returns the no of lines in the text
     * @param {!string} text
     * @return {number}
     */
    function numLines(text) {
        return text.split("\n").length;
    }

    /**
     * Checks whether the text forms a stand alone expression without considering the context of text
     * @param {!string} text
     * @return {boolean}
     */
    function isStandAloneExpression(text) {
        var found = ASTWalker.findNodeAt(getAST(text), 0, text.length, function (nodeType, node) {
            if (nodeType === "Expression") {
                return true;
            }
            return false;
        });
        return found && found.node;
    }

    /**
     * Requests scope data from tern
     * @param {!Session} session
     * @param {!{line: number, ch: number}} offset
     * @return {!$.Promise} a jQuery promise that will be resolved with the scope data
     */
    function getScopeData(session, offset) {
        var path = session.path,
            fileInfo = {
                type: MessageIds.TERN_FILE_INFO_TYPE_FULL,
                name: path,
                offsetLines: 0,
                text: ScopeManager.filterText(session.getJavascriptText())
            };

        ScopeManager.postMessage({
            type: MessageIds.TERN_SCOPEDATA_MSG,
            fileInfo: fileInfo,
            offset: offset
        });

        var ternPromise = ScopeManager.addPendingRequest(fileInfo.name, offset, MessageIds.TERN_SCOPEDATA_MSG);

        var result = new $.Deferred();

        ternPromise.done(function (response) {
            result.resolveWith(null, [response.scope]);
        }).fail(function () {
            result.reject();
        });

        return result;
    }


    /**
     * Normalize text by removing leading and trailing whitespace characters
     * and moves the start and end offset to reflect the new offset
     * @param {!string} text
     * @param {!number} start - the start offset of the text
     * @param {!number} end - the end offset of the text
     * @param {!boolean} removeTrailingSemiColons - removes trailing semicolons also if true
     * @return {!{text: string, start: number, end: number}}
     */
    function normalizeText(text, start, end, removeTrailingSemiColons) {
        var trimmedText;

        // Remove leading spaces
        trimmedText = _.trimLeft(text);

        if (trimmedText.length < text.length) {
            start += (text.length - trimmedText.length);
        }

        text = trimmedText;

        // Remove trailing spaces
        trimmedText = _.trimRight(text);

        if (trimmedText.length < text.length) {
            end -= (text.length - trimmedText.length);
        }

        text = trimmedText;

        // Remove trailing semicolons
        if (removeTrailingSemiColons) {
            trimmedText = _.trimRight(text, ';');

            if (trimmedText.length < text.length) {
                end -= (text.length - trimmedText.length);
            }
        }

        return {
            text: trimmedText,
            start: start,
            end: end
        };
    }

    /**
     * Checks whether the scope is a function scope
     */
    function isFnScope(scope) {
        return !scope.isBlock && !scope.isCatch;
    }

    /**
     * Finds the surrounding ast node of the given expression of any of the given types
     * @param {!ASTNode} ast
     * @param {!{start: number, end: number}} expn - contains start and end offsets of expn
     * @param {!Array.<string>} types
     * @return {?ASTNode}
     */
    function findSurroundASTNode(ast, expn, types) {
        var foundNode = ASTWalker.findNodeAround(ast, expn.start, function (nodeType, node) {
            if (expn.end) {
                return types.includes(nodeType) && node.end >= expn.end;
            } else {
                return types.includes(nodeType);
            }
        });
        return foundNode && _.clone(foundNode.node);
    }

    /**
     * Converts the scopes returned from tern to an array of scopes and adds id and name to the scope
     * Also checks for class scopes
     * @param {!ASTNode} ast - ast of the complete file
     * @param {!Scope} scope - scope returned from tern
     * @param {!string} fullText - the complete text of a file
     * @return {!Array.<Scope>}
     */
    function getAllScopes(ast, scope, fullText) {
        var curScope = scope;
        var cnt = 0;
        var scopes = [];

        while (curScope) {
            curScope.id = cnt++;
            scopes.push(curScope);

            if (curScope.fnType) {
                // Check for class scopes surrounding the function
                if (curScope.fnType === "FunctionExpression") {
                    var methodDefinitionNode = findSurroundASTNode(ast, curScope.originNode, ["MethodDefinition"]);
                    // class scope found
                    if (methodDefinitionNode && isEqual(methodDefinitionNode.value, curScope.originNode)) {
                        // Change curScope name and originNode to that of methodDefinitionNode
                        curScope.name = methodDefinitionNode.key.name;
                        curScope.originNode = methodDefinitionNode;

                        var classNode = findSurroundASTNode(ast, methodDefinitionNode, ["ClassDeclaration", "ClassExpression"]);

                        if (classNode) {
                            // Class Declaration found add it to scopes
                            var temp = curScope.prev;
                            var newScope = {};
                            newScope.isClass = true;

                            // if the class is class expression, check if it has a name
                            if (classNode.type === "ClassExpression") {
                                var assignmentExpNode = findSurroundASTNode(ast, classNode, ["AssignmentExpression"]);
                                if (assignmentExpNode && assignmentExpNode.left && assignmentExpNode.left.name) {
                                    newScope.name = "class " + assignmentExpNode.left.name;
                                } else {
                                    newScope.name = "class null";
                                }
                            } else {
                                newScope.name = "class " + (classNode.id && classNode.id.name);
                            }
                            newScope.originNode = classNode;
                            curScope.prev = newScope;
                            newScope.prev = temp;
                        }
                    } else {
                        // For function expressions, assign name to prefix of the function body
                        curScope.name = "function starting with " +
                            fullText.substr(
                                curScope.originNode.body.start,
                                Math.min(
                                    FUNCTION_BODY_PREFIX_LENGTH,
                                    curScope.originNode.body.end - curScope.originNode.body.start
                                )
                            );
                    }
                } else {
                    // Acorn parse_dammit marks name with '✖' under erroneous declarations, check it
                    if (curScope.fnType === "✖") {
                        curScope.name = "function starting with " +
                            fullText.substr(
                                curScope.originNode.body.start,
                                Math.min(
                                    FUNCTION_BODY_PREFIX_LENGTH,
                                    curScope.originNode.body.end - curScope.originNode.body.start
                                )
                            );
                    } else {
                        curScope.name = curScope.fnType;
                    }
                }
            } else if (!curScope.originNode) {
                curScope.name = "global";
            }

            curScope = curScope.prev;
        }
        return scopes;
    }

    // Define public api
    exports.isEqual = isEqual;
    exports.getUniqueIdentifierName = getUniqueIdentifierName;
    exports.isStandAloneExpression = isStandAloneExpression;
    exports.numLines = numLines;
    exports.getScopeData = getScopeData;
    exports.normalizeText = normalizeText;
    exports.getExpression = getExpression;
    exports.isFnScope = isFnScope;
    exports.getAllScopes = getAllScopes;
    exports.checkStatement = checkStatement;
    exports.findSurroundASTNode = findSurroundASTNode;
    exports.getAST = getAST;
});
