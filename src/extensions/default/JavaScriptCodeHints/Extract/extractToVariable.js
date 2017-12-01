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
        _                   = brackets.getModule("thirdparty/lodash"),
        DefaultDialogs      = brackets.getModule("widgets/DefaultDialogs"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        StringUtils         = brackets.getModule("utils/StringUtils"),
        ScopeManager        = require("../ScopeManager");


    var session, doc, text, start, end, data = {},
        parentBlockStatement, parentStatement, parentExpn;

    // Error messages
    var TERN_FAILED = "Unable to get data from Tern";

    // Utility functions
    function indexFromPos(pos) {
        return session.editor.indexFromPos(pos);
    }

    function posFromIndex(index) {
        return session.editor._codeMirror.posFromIndex(index);
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
            if (nodeType === "Expression"){
                return true;
            }
            return false;
        });
        return found;
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

    function findAllExpressions() {
        var str = doc.getText().substr(parentBlockStatement.start, parentBlockStatement.end - parentBlockStatement.start + 1);
        console.log(str);
        console.log(text);

        function allIndexOf(str, toSearch) {
            var indices = [];
            for(var pos = str.indexOf(toSearch); pos !== -1; pos = str.indexOf(toSearch, pos + 1)) {
                indices.push(pos);
            }
            return indices;
        }

        console.log(allIndexOf(str, text));
    }

    function findParentBlockStatement() {
        var ast =  data.ast,
            expFound = false,
            self = this,
            startPos = parentExpn.start,
            endPos = parentExpn.end;

        ASTWalker.ancestor(ast, {
            Expression: function(node, ancestors) {
                if (expFound) {
                    return;
                }
                if (node.start === startPos && node.end === endPos) {
                    expFound = true;
                    for (var i = ancestors.length - 1; i >= 0 ; --i) {
                        if (ancestors[i].type === "BlockStatement" || ancestors[i].type === "Program") {
                            parentBlockStatement = ancestors[i];
                            break;
                        }
                    }
                }
            }
        });

        return expFound;
    }

    function getExpressions() {
        var expns = [];
        var pos = indexFromPos(start);
        var noSelection = start.line === end.line && start.ch === end.ch;
        if (!noSelection && !isStandAloneExpression(text)) {
            return [];
        }
        while (true) {
            var foundNode = ASTWalker.findNodeAround(data.ast, pos, function(nodeType, node) {
                return nodeType === "Expression" && node.end >= indexFromPos(end);
            });
            if (!foundNode) break;
            var expn = foundNode.node;
            expns.push(expn);
            if (!noSelection) {
                break;
            }
            pos = expn.start - 1;
        }

        return expns;
    }

    function getAllIdentifiers() {
        var identifiers = {};
        var inThisScope = {};
        var ast = Acorn.parse_dammit(text, {ecmaVersion: 9});
        ASTWalker.simple(ast, {
            Expression: function(node) {
                if (node.type === "Identifier") {
                    if (!identifiers.hasOwnProperty(node.name)) {
                        identifiers[node.name] = true;
                    }
                }
            },
            VariableDeclarator: function(node) {
                if (!inThisScope.hasOwnProperty(node.name)) {
                    inThisScope[node.id.name] = true;
                }
            },
            FunctionDeclaration: function(node) {
                if (!inThisScope.hasOwnProperty(node.name)) {
                    inThisScope[node.id.name] = true;
                }
            }
        });
        var ret = [];
        for (var identifier in identifiers) {
            if (identifiers.hasOwnProperty(identifier) && !inThisScope.hasOwnProperty(identifier)) {
                ret.push(identifier);
            }
        }
        return ret;
    }

    function findPassParams(identifiers, srcScope, destScope) {
        var params = [];
        identifiers.forEach(function(identifier){
            var passParam = false;
            while (srcScope.id !== destScope.id) {
                if (srcScope.props.hasOwnProperty(identifier)) {
                    passParam = true;
                    break;
                }
                srcScope = srcScope.prev;
            }
            if (passParam) {
                console.log(identifier)
            }
        });
    }

    function findScopes() {
        var curScope = data.scope;
        var cnt = 0;
        console.log(curScope);
        var scopeNames = [];
        while (curScope) {
            curScope.id = cnt++;
            if (curScope.fnType) {
                scopeNames.push(curScope.fnType);
            }
            else {
                scopeNames.push("global");
            }
            curScope = curScope.prev;
        }
        console.log(scopeNames);
    }

    function getExtractData() {
        var response = ScopeManager.requestExtractData(session, start, end);

        var result = new $.Deferred;

        if (response.hasOwnProperty("promise")) {
            response.promise.done(function(response) {
                data = response;
                data.ast = Acorn.parse_dammit(doc.getText(), {ecmaVersion: 9});
                console.log(data);
                result.resolve();
            }).fail(function() {
                result.reject();
            })
        }

        return result;
    }

    function init() {
        var selection = session.editor.getSelection();

        doc = session.editor.document;
        text = session.editor.getSelectedText();
        start = selection.start;
        end = selection.end;

        // normalizeSelection(true);
        getExtractData().done(function() {
            findScopes();
            findPassParams(getAllIdentifiers(), data.scope, data.scope.prev);
            /*findScopes();
            var expns = getExpressions();
            if (expns.length === 0) {
                displayErrorMessage("No Expression");
            }
            else if (expns.length === 1) {
                parentExpn = expns[0];
                findParentBlockStatement();
                findAllExpressions();
            } else {
                console.log(expns);
            }*/
            /*console.log(start);
            console.log(end);
            console.log(parentBlockStatement);
            console.log(parentStatement);*/
        }).fail(function() {
            displayErrorMessage(TERN_FAILED);
        });
    }

    function displayErrorMessage(errMsg) {
        session.editor.displayErrorMessageAtCursor(errMsg);
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
