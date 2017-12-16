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

define(function (require, exports, module) {
    "use strict";

    var _ = brackets.getModule("thirdparty/lodash");

    var EditorManager        = brackets.getModule("editor/EditorManager"),
        TokenUtils           = brackets.getModule("utils/TokenUtils"),
        StringUtils          = brackets.getModule("utils/StringUtils"),
        AcornLoose           = brackets.getModule("thirdparty/acorn/dist/acorn_loose"),
        ASTWalker            = brackets.getModule("thirdparty/acorn/dist/walk");

    var templates = JSON.parse(require("text!Templates.json"));

    var WRAP_IN_CONDITION       = "wrapCondition",
        ARROW_FUNCTION          = "arrowFunction",
        GETTERS_SETTERS         = "gettersSetters",
        TRY_CATCH               = "tryCatch";


    var current = null;
    
    /**
     * Current objects encapsulate state associated with a refactoring session
     * and This will help finding information around documents, selection,
     * Position details, ast, and queries around AST nodes
     *
     * @constructor
     * @param {Editor} editor - the editor context for the session
     */
    function Current(editor) {
        this.editor = editor;
        this.document = editor.document;
        this.selection = editor.getSelection();
        this.text = this.document.getText();
        this.selectedText = editor.getSelectedText();
        this.cm = editor._codeMirror;
        this.startIndex = editor.indexFromPos(this.selection.start);
        this.endIndex = editor.indexFromPos(this.selection.end);
        this.startPos = this.selection.start;
        this.endPos = this.selection.end;
        this.ast = this.createAstOfCurrentDoc();
    }

    /**
     * Get the end position of given line
     *
     * @param {number} line - line number
     * @return {{line: number, ch: number}} - line end position
     */
    Current.prototype.lineEndPosition = function (line) {
        var lineText = this.document.getLine(line);

        return {
            line: line,
            ch: lineText.length
        };
    };

    /**
     * Get the ast of current opened document in focused editor
     *
     * @return {Object} - Ast of current opened doc
     */
    Current.prototype.createAstOfCurrentDoc = function () {
        return AcornLoose.parse_dammit(this.document.getText());
    }

    /**
     * Initialize session 
     */
    function initializeRefactoringSession() {
        current = new Current(EditorManager.getActiveEditor());
    }
    
    /**
     * This will add template at given position/selection
     *
     * @param {string} template - name of templated defined in templates.json
     * @param {Array} args- Check all arguments that exist in defined templated pass all that args as array
     * @param {{line: number, ch: number}} rangeToReplace - Range which we want to rreplace
     * @param {string} subTemplate - If template written under some category
     */
    function replaceTextFromTemplate(template, args, rangeToReplace, subTemplate) {
        var editor = EditorManager.getActiveEditor();
        
        var templateText = templates[template];

        if (subTemplate) {
            templateText = templateText[subTemplate];
        }

        var compiled = _.template(templateText);
        var formattedText = compiled(args);

        if (!rangeToReplace) {
            rangeToReplace = editor.getSelection();
        }
        
        editor.document.replaceRange(formattedText, rangeToReplace.start, rangeToReplace.end);

        var startLine = rangeToReplace.start.line,
        endLine = startLine + formattedText.split("\n").length;

        for (var i = startLine + 1; i < endLine; i++) {
            editor._codeMirror.indentLine(i);
        }
    }

    
    /*
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
        return foundNode && foundNode.node;
    }

    /*
     * Checks whether the text between start and end offsets form a valid set of statements
     * @param {!ASTNode} ast - the ast of the complete file
     * @param {!number} start - the start offset
     * @param {!number} end - the end offset
     * @param {!string} fileText - selected text
     * @return {boolean}
     */
    function checkStatement(ast, start, end, selectedText, id) {
        // Do not allow function or class nodes
        var notStatement = false;
        ASTWalker.simple(AcornLoose.parse_dammit(selectedText), {
            Function: function (node) {
                if (node.type === "FunctionDeclaration") {
                    notStatement = true;
                }
            },
            Class: function (node) {
                notStatement = true;
            }
        });

        if (notStatement) return false;

        var startStatement = findSurroundASTNode(ast, {start: start}, ["Statement"]);
        var endStatement   = findSurroundASTNode(ast, {start: end}, ["Statement"]);

        return startStatement && endStatement && startStatement.start === start &&
            startStatement.end <= end && endStatement.start >= start &&
            endStatement.end === end;
    }

    /**
     * Get Params of selected function
     *
     * @param {Object} ast - ast of whole file
     * @param {number} start- start offset
     * @param {number} end - end offset
     * @param {string} selectedText - Create ast for only selected node
     * @return {Array} param - Array of all parameters in function
     */
    function getParamsOfFunction(ast, start, end, selectedText) {
        var param = [];
        ASTWalker.simple(AcornLoose.parse_dammit(selectedText), {
            Function: function (node) {
                if (node.type === "FunctionDeclaration") {
                    node.params.forEach(function (item) {
                        param.push(item.name);
                    });
                }
            }
        });

        return param;
    }

    /**
     * Wrap selected statements 
     *
     * @param {string} wrapperName - template name where we want wrap selected statements
     * @param {string} err- error message
     */
    Current.prototype.wrapSelectedStatements =  function (wrapperName, err) {
        initializeRefactoringSession();
        var selectedText;

        var startIndex,
            endIndex,
            statementNode,
            isStatements,
            pos;

        if (this.selectedText.length === 0) {
            statementNode = findSurroundASTNode(this.ast, {start: this.startIndex}, ["Statement"]);
            selectedText = this.text.substr(statementNode.start, statementNode.end - statementNode.start);
            startIndex = statementNode.start;
            endIndex = statementNode.end;
        }

        if (!checkStatement(this.ast, startIndex, endIndex, selectedText)) {
            this.editor.displayErrorMessageAtCursor(err);
            return;
        }

        pos = {
            "start": this.cm.posFromIndex(startIndex),
            "end": this.cm.posFromIndex(endIndex)
        };

        this.document.batchOperation(function() {
            replaceTextFromTemplate(wrapperName, {body: selectedText}, pos);
        });
    }


     //Wrap selected statements in try catch block   
    function wrapInTryCatch() {
        initializeRefactoringSession();
        current.wrapSelectedStatements(TRY_CATCH, "Please select valid statements to wrap them in try catch block");
    }

    //Wrap selected statements in try condition  
    function wrapInCondition() {
        initializeRefactoringSession();
        current.wrapSelectedStatements(WRAP_IN_CONDITION, "Please select valid statements to wrap them in condition");
    }

    //Convert function to arrow function
    function convertToArrowFunction() {
        initializeRefactoringSession();
        //Handle when there is no selected line
        var funcExprNode = findSurroundASTNode(current.ast, {start: current.startIndex}, ["FunctionExpression"])

        if (!funcExprNode || funcExprNode.type !== "FunctionExpression" || funcExprNode.id) {
            current.editor.displayErrorMessageAtCursor("Cursor is not inside function expression");
            return;
        }
        var noOfStatements = funcExprNode.body.body.length,
            selectedText = current.text.substr(funcExprNode.start, funcExprNode.end - funcExprNode.start),
            param = getParamsOfFunction(current.ast, funcExprNode.start, funcExprNode.end, selectedText),
            loc = {
                "fullFunctionScope" : {
                    start: funcExprNode.start,
                    end: funcExprNode.end
                },
                "functionsDeclOnly": {
                    start: funcExprNode.start,
                    end: funcExprNode.body.start
                }
            },
            locPos = {
                "fullFunctionScope": {
                    "start": current.cm.posFromIndex(loc.fullFunctionScope.start),
                    "end": current.cm.posFromIndex(loc.fullFunctionScope.end)
                },
                "functionsDeclOnly": {
                    "start": current.cm.posFromIndex(loc.functionsDeclOnly.start),
                    "end": current.cm.posFromIndex(loc.functionsDeclOnly.end)
                }
            },
            isReturnStatement = funcExprNode.body.body[0].type === "ReturnStatement",
            bodyStatements = funcExprNode.body.body[0],
            params = {
                "params": param.join(", "),
                "statement": _.trimRight(current.text.substr(bodyStatements.start, bodyStatements.end - bodyStatements.start), ";")
            };

        if (isReturnStatement) {
            params.statement = params.statement.substr(7).trim();
        }

        if (noOfStatements === 1) {
            current.document.batchOperation(function() {
                funcExprNode.params.length === 1 ?  replaceTextFromTemplate(ARROW_FUNCTION, params, locPos.fullFunctionScope, "oneParamOneStament") :
                replaceTextFromTemplate(ARROW_FUNCTION, params, locPos.fullFunctionScope, "manyParamOneStament");

            });
        } else {
            current.document.batchOperation(function() {
                funcExprNode.params.length === 1 ?  replaceTextFromTemplate(ARROW_FUNCTION, {params: param},
                locPos.functionsDeclOnly, "oneParamManyStament") :
                replaceTextFromTemplate(ARROW_FUNCTION, {params: param.join(", ")}, locPos.functionsDeclOnly, "manyParamManyStament");
            });
        }

        current.editor.setCursorPos(locPos.functionsDeclOnly.end.line, locPos.functionsDeclOnly.end.ch, false);
    }

    function _findParentNode(ast, start) {
        var foundNode = ASTWalker.findNodeAround(ast, start, function(nodeType, node) {
            return (nodeType === "ObjectExpression");
        });
        return foundNode && foundNode.node;
    }

    function _isLastNodeInScope(ast, start) {
        var currentNodeStart;
        var node = _findParentNode (ast, start);
        var childNode = ASTWalker.simple(node, {
            Property: function (node) {
                currentNodeStart = node.start;
            }
        });

        return start >= currentNodeStart;
    }

    //Create gtteres and setters for a property
    function createGettersAndSetters() {
        initializeRefactoringSession();
            
        var token = TokenUtils.getTokenAt(current.cm, current.cm.getCursor()),
            isLastNode,
            lineEndPos,
            templateParams;

        //Create getters and setters only if selected reference is a property
        if (token.type !== "property") {
            current.editor.displayErrorMessageAtCursor("Cursor is not at property.");
            return;
        }
   
        if (!_findParentNode (current.ast, current.startIndex)) {
            current.editor.displayErrorMessageAtCursor("This property is not part of object expression");
            return;
        }

        //We have to add ',' so we need to find position of current property selected
        isLastNode = _isLastNodeInScope(current.ast, current.startIndex);
        lineEndPos = current.lineEndPosition(current.startPos.line);
        templateParams = {
            "getName": "get" + token.string,
            "setName": "set" + token.string,
            "tokenName": token.string
        };

        // Replace, setSelection, IndentLine
        // We need this as indentLine don't have option to add origin as like replaceRange
        current.editor.document.batchOperation(function() {
            if (isLastNode) {
                //Add ',' in the end of current line
                current.editor.document.replaceRange(",", lineEndPos, lineEndPos);

                // We can use getLineEnding defined in FileUtils but i feel this better, If we will do that way then we need to call indent code manually
                // Sometime that doesn't work properly
                lineEndPos.ch++;
            }

            current.editor.setSelection(lineEndPos); //Selection on line end

            //Add getters and setters for given token using template at current cursor position
            replaceTextFromTemplate(GETTERS_SETTERS, templateParams);

            if (!isLastNode) {
                current.editor.document.replaceRange(",", current.editor.getSelection().start, current.editor.getSelection().start);
            }
        });
    }
    
    exports.wrapInTryCatch = wrapInTryCatch;
    exports.wrapInCondition = wrapInCondition;
    exports.convertToArrowFunction = convertToArrowFunction;
    exports.createGettersAndSetters = createGettersAndSetters;
});
