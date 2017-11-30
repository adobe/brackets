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

define(function(require, exports, module) {
    'use strict';

    var Acorn               = brackets.getModule("thirdparty/acorn/dist/acorn"),
        ASTWalker           = brackets.getModule("thirdparty/acorn/dist/walk"),
        Menus               = brackets.getModule("command/Menus"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        KeyBindingManager   =  brackets.getModule("command/KeyBindingManager"),
        _                   =  brackets.getModule("thirdparty/lodash"),
        DefaultDialogs      = brackets.getModule("widgets/DefaultDialogs"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        ScopeManager        = require("../ScopeManager");


    var session, text, start, end, data;

    // Utility functions
    function indexFromPos(pos) {
        session.editor.indexFromPos(pos);
    }

    function posFromIndex(index) {
        session.editor._codeMirror.posFromIndex(index);
    }

    // Removes the leading and trailing spaces from selection and the trailing semicolons
    function normalizeSelection(removeTrailingSemiColons) {
        var trimmedText;

        start = indexFromPos(start);
        end = indexFromPos(end);

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

        // Remove trailing semicolons
        if (removeTrailingSemiColons) {
            trimmedText = _.trimRight(text, ';');

            if (trimmedText.length < text.length) {
                end -= (text.length - trimmedText.length);
            }
        }

        text = trimmedText;
        start = posFromIndex(start);
        end = posFromIndex(end);
    }

    function isStandAloneExpression(text) {
        var found = ASTWalker.findNodeAt(Acorn.parse_dammit(text, {ecmaVersion: 9}), 0, text.length, function(nodeType, node) {
            if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
                return true;
            }
            return false;
        });
        if (found) {
            return true;
        }
        return false;
    }

    function numLines(text) {
        return text.split("\n").length;
    }


    function extract() {
        var varType = "var",
            varDeclaration,
            insertStartIndex = this.parentExp.start,
            insertEndIndex,
            insertStartPos,
            insertEndPos ,
            startPos = this.posFromIndex(this.start),
            endPos = this.posFromIndex(this.end),
            self = this;

        // Display Dialog for type
        var $template = $(require("text!./dialog.html"));
        Dialogs.showModalDialogUsingTemplate($template).done(function(id) {
            if (id === "extract") {
                varType = $template.find('input:radio[name=var-type]:checked').val();

                // Var initializations
                varDeclaration = varType + " test = " + self.text + ";\n";
                insertEndIndex = insertStartIndex + varDeclaration.length;
                insertStartPos = self.posFromIndex(insertStartIndex);
                insertEndPos   = self.posFromIndex(insertEndIndex);

                // Check if the expression is the only thing on this line.
                // If it is, then append variable declaration to it.
                if (self.parentExp.type === "ExpressionStatement" &&
                // abs for semicolons TODO: change this
                    self.parentExp.start === self.start && Math.abs(self.parentExp.end - self.end) <= 1) {
                    self.doc.replaceRange(varType + " test = ", insertStartPos);
                    self.editor.setSelection(
                        {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 1},
                        {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 5}
                    );
                    return;
                }


                startPos = self.doc.adjustPosForChange(startPos, varDeclaration.split("\n"), insertStartPos, insertStartPos);
                endPos = self.doc.adjustPosForChange(endPos, varDeclaration.split("\n"), insertStartPos, insertStartPos);

                var posToIndent = self.doc.adjustPosForChange(insertStartPos, varDeclaration.split("\n"), insertStartPos, insertStartPos);
                self.doc.batchOperation(function() {
                    self.doc.replaceRange(varDeclaration, insertStartPos);
                    self.doc.replaceRange("test", startPos, endPos);

                    // Set the multi selections for editing variable name
                    self.editor.setSelections([
                        {
                            start: {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 1},
                            end: {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 5},
                            primary: true
                        },
                        {
                            start: startPos,
                            end: {line: startPos.line, ch: startPos.ch + 4}
                        }
                    ]);

                    self.editor._codeMirror.indentLine(posToIndent.line, "prev");
                });
            }
        });
    }

    function checkExpression() {
        var response = ScopeManager.requestExprType(session, this.doc, this.posFromIndex(this.start), this.posFromIndex(this.end));
        if (response.hasOwnProperty("promise")) {
            response.promise.done(function(response) {
               console.log(response);
            }).fail(function () {
                // result.reject();
            });
        }
        var ast = Acorn.parse_dammit(this.doc.getText(), {ecmaVersion: 9}),
            expFound = false,
            self = this;

        var found = ASTWalker.findNodeAround(ast, self.start, function(nodeType, node) {
            return node.start <= self.start && node.end >= self.end &&
             (node.type === "BinaryExpression" || node.type === "LogicalExpression");
        });
        var foundNode;
        if (found) {
            foundNode = found.node;
        }

        ASTWalker.ancestor(ast, {
            Expression: function(node, ancestors) {
                if (expFound) {
                    return;
                }
                // Insightful comment
                if ((isStandAloneExpression(self.text) && foundNode && node.start === foundNode.start && node.end === foundNode.end) ||
                    (node.start === self.start && node.end === self.end)) {
                    expFound = true;
                    var temp = node;
                    for (var i = ancestors.length - 1; i >= 0 ; --i) {
                        if (ancestors[i].type === "BlockStatement" || ancestors[i].type === "Program") {
                            self.parentExp = temp;
                            break;
                        }
                        temp = ancestors[i];
                    }
                }
            }
        });


        return expFound;
    }

    function getExtractData() {
        var response = ScopeManager.requestExtractData(session, start, end);

        if (response.hasOwnProperty("promise")) {
            response.promise.done(function(response) {
                console.log(response);
            }).fail(function () {
                // result.reject();
            });
        }
    }

    function init() {
        var selection = session.editor.getSelection();

        text = session.editor.getSelectedText();
        start = selection.start;
        end = selection.end;

        // normalizeSelection(true);
        getExtractData();
    }

    function displayErrorMessage() {
        session.editor.displayErrorMessageAtCursor("Cannot extract variable.The selection does not form a expression");
    }

    function setSession(s) {
        session = s;
    }

    function addCommands() {
        // Extract To Variable
        CommandManager.register("Extract To Variable", "refactoring.extractToVariable", function () {
            init();
        });

        KeyBindingManager.addBinding("refactoring.extractToVariable", "Ctrl-Alt-V");
        Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem("refactoring.extractToVariable");

        // Extract To Function
        CommandManager.register("Extract To Function", "refactoring.extractToFunction", function () {
            init();
        });

        KeyBindingManager.addBinding("refactoring.extractToFunction", "Ctrl-Alt-M");
        Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem("refactoring.extractToFunction");
    }

    exports.setSession = setSession;
    exports.addCommands = addCommands;
});
