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

    var AcornLoose           = brackets.getModule("thirdparty/acorn/dist/acorn_loose"),
        ASTWalker            = brackets.getModule("thirdparty/acorn/dist/walk");

    var templates = JSON.parse(require("text!Templates.json"));

    /**
     * Note - To use these state defined in Refactoring Session,
     * Please reinitialize this RefactoringSession after performing any of the below operations
     * (i.e. replaceRange, setSelection or indentLine) 
     * 
     * RefactoringSession objects encapsulate state associated with a refactoring session
     * and This will help finding information around documents, selection,
     * position, ast, and queries around AST nodes
     *
     * @constructor
     * @param {Editor} editor - the editor context for the session
     */
    function RefactoringSession(editor) {
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
    RefactoringSession.prototype.lineEndPosition = function (line) {
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
    RefactoringSession.prototype.createAstOfCurrentDoc = function () {
        return AcornLoose.parse_dammit(this.document.getText());
    };

    /**
     * This will add template at given position/selection
     *
     * @param {string} template - name of the template defined in templates.json
     * @param {Array} args- Check all arguments that exist in defined templated pass all that args as array
     * @param {{line: number, ch: number}} rangeToReplace - Range which we want to replace
     * @param {string} subTemplate - If template written under some category
     */
    RefactoringSession.prototype.replaceTextFromTemplate = function (template, args, rangeToReplace, subTemplate) {
        var templateText = templates[template];

        if (subTemplate) {
            templateText = templateText[subTemplate];
        }

        var compiled = _.template(templateText),
            formattedText = compiled(args);

        if (!rangeToReplace) {
            rangeToReplace = this.editor.getSelection();
        }

        this.document.replaceRange(formattedText, rangeToReplace.start, rangeToReplace.end);

        var startLine = rangeToReplace.start.line,
            endLine = startLine + formattedText.split("\n").length;

        for (var i = startLine + 1; i < endLine; i++) {
            this.cm.indentLine(i);
        }
    };


    /*
     * Finds the surrounding ast node of the given expression of any of the given types
     * @param {!ASTNode} ast
     * @param {!{start: number, end: number}} expn - contains start and end offsets of expn
     * @param {!Array.<string>} types
     * @return {?ASTNode}
     */
    RefactoringSession.prototype.findSurroundASTNode = function (ast, expn, types) {
        var foundNode = ASTWalker.findNodeAround(ast, expn.start, function (nodeType, node) {
            if (expn.end) {
                return types.includes(nodeType) && node.end >= expn.end;
            }
            return types.includes(nodeType);
        });
        return foundNode && foundNode.node;
    };

    /*
     * Checks whether the text between start and end offsets form a valid set of statements
     * @param {!ASTNode} ast - the ast of the complete file
     * @param {!number} start - the start offset
     * @param {!number} end - the end offset
     * @param {!string} fileText - selected text
     * @return {boolean}
     */
    RefactoringSession.prototype.checkStatement = function (ast, start, end, selectedText, id) {
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

        if (notStatement) {
            return false;
        }

        var startStatement = this.findSurroundASTNode(ast, {start: start}, ["Statement"]);
        var endStatement   = this.findSurroundASTNode(ast, {start: end}, ["Statement"]);

        return startStatement && endStatement && startStatement.start === start &&
            startStatement.end <= end && endStatement.start >= start &&
            endStatement.end === end;
    };

    /**
     * Get Params of selected function
     *
     * @param {number} start- start offset
     * @param {number} end - end offset
     * @param {string} selectedText - Create ast for only selected node
     * @return {Array} param - Array of all parameters in function
     */
    RefactoringSession.prototype.getParamsOfFunction = function getParamsOfFunction(start, end, selectedText) {
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
    };

    /**
     * Get the Parent node
     *
     * @param {Object} ast - ast of full document
     * @param {number} start - start Offset
     * @return {Object} node - Returns the parent node of node which is at offset start
     */
    RefactoringSession.prototype.getParentNode = function (ast, start) {
        var foundNode = ASTWalker.findNodeAround(ast, start, function(nodeType, node) {
            return (nodeType === "ObjectExpression");
        });
        return foundNode && foundNode.node;
    };

    /**
     * Checks weather the node at start is last in that scope or not
     *
     * @param {Object} ast - ast of full document
     * @param {number} start - start Offset
     * @return {boolean} - is last node in that scope
     */
    RefactoringSession.prototype.isLastNodeInScope = function (ast, start) {
        var parentNode = this.getParentNode(ast, start),
            currentNodeStart;

        ASTWalker.simple(parentNode, {
            Property: function (node) {
                currentNodeStart = node.start;
            }
        });

        return start >= currentNodeStart;
    };

    /**
    * Normalize text by removing leading and trailing whitespace characters
    * and moves the start and end offset to reflect the new offset
    * @param {!string} text - selected text
    * @param {!number} start - the start offset of the text
    * @param {!number} end - the end offset of the text
    * @return {!{text: string, start: number, end: number}}
    */
    RefactoringSession.prototype.normalizeText = function normalizeText(text, start, end) {
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


        return {
            text: trimmedText,
            start: start,
            end: end
        };
    };

    module.exports = RefactoringSession;
});
