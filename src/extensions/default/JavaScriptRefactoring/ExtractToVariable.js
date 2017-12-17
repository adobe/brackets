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
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager"),
        Session             = brackets.getModule("JSUtils/Session"),
        RefactoringUtils    = require("RefactoringUtils"),
        InlineMenu          = require("InlineMenu").InlineMenu;

    var session = null;

    // Error messages
    var TERN_FAILED             = "Unable to get data from Tern",
        EXTRACTVARIABLE_ERR_MSG = "Selection does not form an expression";

    /**
     * Does the actual extraction. i.e Replacing the text, Creating a variable
     * and multi select variable names
     */
    function extract(scope, parentStatement, expns, text) {
        var varType          = "var",
            varName          = RefactoringUtils.getUniqueIdentifierName(scope, "extracted"),
            varDeclaration   = varType + " " + varName + " = " + text + ";\n",
            insertStartPos   = session.editor.posFromIndex(parentStatement.start),
            selections       = [],
            doc              = session.editor.document,
            replaceExpnIndex = 0,
            posToIndent;

        // If parent statement is expression statement, then just append var declaration
        // Ex: "add(1, 2)" will become "var extracted = add(1, 2)"
        if (parentStatement.type === "ExpressionStatement" && RefactoringUtils.isEqual(parentStatement.expression, expns[0])) {
            varDeclaration = varType + " " + varName + " = ";
            replaceExpnIndex = 1;
        }

        posToIndent = doc.adjustPosForChange(insertStartPos, varDeclaration.split("\n"), insertStartPos, insertStartPos);

        // adjust pos for change
        for (var i = replaceExpnIndex; i < expns.length; ++i) {
            expns[i].start  = session.editor.posFromIndex(expns[i].start);
            expns[i].end    = session.editor.posFromIndex(expns[i].end);
            expns[i].start  = doc.adjustPosForChange(expns[i].start, varDeclaration.split("\n"), insertStartPos, insertStartPos);
            expns[i].end    = doc.adjustPosForChange(expns[i].end, varDeclaration.split("\n"), insertStartPos, insertStartPos);

            selections.push({
                start: expns[i].start,
                end: {line: expns[i].start.line, ch: expns[i].start.ch + varName.length}
            });
        }

        // Replace and multi-select
        doc.batchOperation(function() {
            doc.replaceRange(varDeclaration, insertStartPos);

            for (var i = replaceExpnIndex; i < expns.length; ++i) {
                doc.replaceRange(varName, expns[i].start, expns[i].end);
            }
            selections.push({
                start: {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 1},
                end:   {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + varName.length + 1},
                primary: true
            });

            session.editor.setSelections(selections);
            session.editor._codeMirror.indentLine(posToIndent.line, "smart");
        });
    }

    /**
     * Find all expressions in the parentBlockStatement that are same as expn
     * @param {!ASTNode} parentBlockStatement
     * @param {!ASTNode} expn
     * @param {!string} text - text of the expression
     * @return {!Array.<ASTNode>}
     */
    function findAllExpressions(parentBlockStatement, expn, text) {
        var doc   = session.editor.document,
            obj   = {},
            expns = [];

        // find all references of the expression
        obj[expn.type] = function(node) {
            if (text === doc.getText().substr(node.start, node.end - node.start)) {
                expns.push(node);
            }
        };
        ASTWalker.simple(parentBlockStatement, obj);

        return expns;
    }

    /**
     * Gets the surrounding expressions of start and end offset
     * @param {!ASTNode} ast - the ast of the complete file
     * @param {!number} start - the start offset
     * @param {!number} end - the end offset
     * @return {!Array.<ASTNode>}
     */
    function getExpressions(ast, start, end) {
        var expns = [],
            s     = start,
            e     = end,
            expn;

        while (true) {
            expn = RefactoringUtils.findSurroundASTNode(ast, {start: s, end: e}, ["Expression"]);
            if (!expn) {
                break;
            }
            expns.push(expn);
            s = expn.start - 1;
        }

        s = start;
        e = end;

        function checkExpnEquality(e) {
            return e.start === expn.start && e.end === expn.end;
        }

        while (true) {
            expn = RefactoringUtils.findSurroundASTNode(ast, {start: s, end: e}, ["Expression"]);
            if (!expn) {
                break;
            }
            e = expn.end + 1;

            // if expn already added, continue
            if (expns.find(checkExpnEquality)) {
                 continue;
            }

            expns.push(expn);
        }

        return expns;
    }

    /**
     * Creates params needed for extraction and calls extract
     * extract() does the actual extraction
     */
    function extractToVariable(ast, start, end, text, scope) {
        var doc                   = session.editor.document,
            parentExpn            = RefactoringUtils.getExpression(ast, start, end, doc.getText()),
            expns                 = [],
            parentBlockStatement,
            parentStatement;

        if (!parentExpn) {
            session.editor.displayErrorMessageAtCursor(EXTRACTVARIABLE_ERR_MSG);
            return;
        }

        // Find all expressions only if selected expn is not a subexpression
        // In case of subexpressions, ast cannot be used to find all expressions
        if (doc.getText().substr(parentExpn.start, parentExpn.end - parentExpn.start) === text) {
            parentBlockStatement = RefactoringUtils.findSurroundASTNode(ast, parentExpn, ["BlockStatement", "Program"]);
            expns                = findAllExpressions(parentBlockStatement, parentExpn, text);
            parentStatement      = RefactoringUtils.findSurroundASTNode(ast, expns[0], ["Statement"]);
            extract(scope, parentStatement, expns, text);
        } else {
            parentStatement = RefactoringUtils.findSurroundASTNode(ast, parentExpn, ["Statement"]);
            extract(scope, parentStatement, [{ start: start, end: end }], text);
        }
    }


    /**
     * Main function that handles extract to variable
     */
    function handleExtractToVariable() {
        var editor = EditorManager.getActiveEditor();

        if (editor.getSelections().length > 1) {
            editor.displayErrorMessageAtCursor("Extract to variable does not work in multicursors");
            return;
        }

        initializeSession(editor);

        var selection = editor.getSelection(),
            doc       = editor.document,
            retObj    = RefactoringUtils.normalizeText(editor.getSelectedText(), editor.indexFromPos(selection.start),
                        editor.indexFromPos(selection.end), true),
            text      = retObj.text,
            start     = retObj.start,
            end       = retObj.end,
            ast,
            expns,
            inlineMenu;

        RefactoringUtils.getScopeData(session, editor.posFromIndex(start)).done(function(scope) {
            ast = Acorn.parse_dammit(doc.getText(), {ecmaVersion: 9});

            if (editor.hasSelection()) {
                extractToVariable(ast, start, end, text, scope);
            } else {
                expns = getExpressions(ast, start, end);

                expns.forEach(function(expn, index) {
                    expn.name = doc.getText().substr(expn.start, expn.end - expn.start);
                });

                // Filter expns which span multiple lines and sort expressions by their length
                expns = expns.filter(function(expn) {
                    return RefactoringUtils.numLines(expn.name) === 1;
                }).sort(function(a, b) {
                    return a.name.length >= b.name.length;
                });

                expns.forEach(function(expn, index) {
                    expn.id = index;
                });

                if (!expns || !expns.length) {
                    session.editor.displayErrorMessageAtCursor(EXTRACTVARIABLE_ERR_MSG);
                    return;
                }

                // UI for extract to variable
                inlineMenu = new InlineMenu(session.editor, "Select expresion");

                inlineMenu.onHover(function (expnId) {
                    editor.setSelection(editor.posFromIndex(expns[expnId].start), editor.posFromIndex(expns[expnId].end));
                });

                inlineMenu.open(expns);

                inlineMenu.onSelect(function (expnId) {
                    extractToVariable(ast, expns[expnId].start, expns[expnId].end, expns[expnId].name, scope);
                    inlineMenu.close();
                });

                inlineMenu.onClose(function () { });
            }
        }).fail(function() {
            editor.displayErrorMessageAtCursor(TERN_FAILED);
        });
    }

    /**
     * Creates a new session from editor and stores it in session global variable
     */
    function initializeSession(editor) {
        session = new Session(editor);
    }

    /**
     * Adds the commands for extract to variable
     */
    function addCommands() {
        CommandManager.register("Extract To Variable", "refactoring.extractToVariable", handleExtractToVariable);
        KeyBindingManager.addBinding("refactoring.extractToVariable", "Ctrl-Shift-V");
        Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem("refactoring.extractToVariable");
    }

    exports.addCommands = addCommands;
});
