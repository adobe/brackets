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


    var ASTWalker           = brackets.getModule("thirdparty/acorn/dist/walk"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        Session             = brackets.getModule("JSUtils/Session"),
        RefactoringUtils    = require("RefactoringUtils"),
        Strings             = brackets.getModule("strings"),
        InlineMenu          = brackets.getModule("widgets/InlineMenu").InlineMenu;

    var session = null;

    /**
     * Does the actual extraction. i.e Replacing the text, Creating a variable
     * and multi select variable names
     */
    function extract(scopes, parentStatement, expns, text, insertPosition) {
        var varType          = "var",
            varName          = RefactoringUtils.getUniqueIdentifierName(scopes, "extracted"),
            varDeclaration   = varType + " " + varName + " = " + text + ";\n",
            parentStatementStartPos = session.editor.posFromIndex(parentStatement.start),
            insertStartPos   = insertPosition || parentStatementStartPos,
            selections       = [],
            doc              = session.editor.document,
            replaceExpnIndex = 0,
            posToIndent,
            edits            = [];

        // If parent statement is expression statement, then just append var declaration
        // Ex: "add(1, 2)" will become "var extracted = add(1, 2)"
        if (parentStatement.type === "ExpressionStatement" &&
                RefactoringUtils.isEqual(parentStatement.expression, expns[0]) &&
                insertStartPos.line === parentStatementStartPos.line &&
                insertStartPos.ch === parentStatementStartPos.ch) {
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

            edits.push({
                edit: {
                    text: varName,
                    start: expns[i].start,
                    end: expns[i].end
                },
                selection: {
                    start: expns[i].start,
                    end: {line: expns[i].start.line, ch: expns[i].start.ch + varName.length}
                }
            });
        }

        // Replace and multi-select
        doc.batchOperation(function() {
            doc.replaceRange(varDeclaration, insertStartPos);

            selections = doc.doMultipleEdits(edits);
            selections.push({
                start: {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + 1},
                end: {line: insertStartPos.line, ch: insertStartPos.ch + varType.length + varName.length + 1},
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
            expn = RefactoringUtils.findSurroundExpression(ast, {start: s, end: e});
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
            expn = RefactoringUtils.findSurroundExpression(ast, {start: s, end: e});
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
    function extractToVariable(ast, start, end, text, scopes) {
        var doc                   = session.editor.document,
            editor = EditorManager.getActiveEditor(),
            parentExpn            = RefactoringUtils.getExpression(ast, start, end, doc.getText()),
            expns                 = [],
            parentBlockStatement,
            parentStatement;

        if (!parentExpn) {
            session.editor.displayErrorMessageAtCursor(Strings.ERROR_EXTRACTTO_VARIABLE_NOT_VALID);
            return;
        }

        // Find all expressions only if selected expn is not a subexpression
        // In case of subexpressions, ast cannot be used to find all expressions
        if (doc.getText().substr(parentExpn.start, parentExpn.end - parentExpn.start) === text) {
            parentBlockStatement = RefactoringUtils.findSurroundASTNode(ast, parentExpn, ["BlockStatement", "Program"]);
            expns                = findAllExpressions(parentBlockStatement, parentExpn, text);

            RefactoringUtils.getScopeData(session, editor.posFromIndex(expns[0].start)).done(function(scope) {
                var firstExpnsScopes = RefactoringUtils.getAllScopes(ast, scope, doc.getText()),
                    insertPostion;
                parentStatement = RefactoringUtils.findSurroundASTNode(ast, expns[0], ["Statement"]);
                if (scopes.length < firstExpnsScopes.length) {
                    var parentScope;
                    if (expns[0].body && expns[0].body.type === "BlockStatement") {
                        parentScope = firstExpnsScopes[firstExpnsScopes.length - scopes.length];
                    } else {
                        parentScope = firstExpnsScopes[firstExpnsScopes.length - scopes.length - 1];
                    }

                    var insertNode = RefactoringUtils.findSurroundASTNode(ast, parentScope.originNode, ["Statement"]);
                    if (insertNode) {
                        insertPostion = session.editor.posFromIndex(insertNode.start);
                    }
                }
                extract(scopes, parentStatement, expns, text, insertPostion);
            });
        } else {
            parentStatement = RefactoringUtils.findSurroundASTNode(ast, parentExpn, ["Statement"]);
            extract(scopes, parentStatement, [{ start: start, end: end }], text);
        }
    }


    /**
     * Main function that handles extract to variable
     */
    function handleExtractToVariable() {
        var editor = EditorManager.getActiveEditor();

        if (editor.getSelections().length > 1) {
            editor.displayErrorMessageAtCursor(Strings.ERROR_EXTRACTTO_VARIABLE_MULTICURSORS);
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
            scopes,
            expns,
            inlineMenu;

        function callExtractToVariable(startPos, endPos, value) {
            RefactoringUtils.getScopeData(session, editor.posFromIndex(startPos))
                .done(function(expnscope) {
                    scopes = RefactoringUtils.getAllScopes(ast, expnscope, doc.getText());
                    extractToVariable(ast, startPos, endPos, value, scopes);
                }).fail(function() {
                    editor.displayErrorMessageAtCursor(Strings.ERROR_TERN_FAILED);
                });
        }

        RefactoringUtils.getScopeData(session, editor.posFromIndex(start)).done(function(scope) {
            ast = RefactoringUtils.getAST(doc.getText());
            scopes = RefactoringUtils.getAllScopes(ast, scope, doc.getText());

            if (editor.hasSelection()) {
                extractToVariable(ast, start, end, text, scopes);
            } else {
                expns = getExpressions(ast, start, end);

                expns.forEach(function(expn, index) {
                    expn.value = doc.getText().substr(expn.start, expn.end - expn.start);
                });

                // Sort expressions by their length
                expns.sort(function(a, b) {
                    return a.value.length - b.value.length;
                });

                if (!expns || !expns.length) {
                    session.editor.displayErrorMessageAtCursor(Strings.ERROR_EXTRACTTO_VARIABLE_NOT_VALID);
                    return;
                }

                // Filter expns based on length of first surrounding expression
                var firstExpnLength = RefactoringUtils.numLines(expns[0].value);
                expns = expns.filter(function(expn) {
                    return RefactoringUtils.numLines(expn.value) === firstExpnLength;
                });

                // Add name for the expression based on its value
                expns.forEach(function(expn, index) {
                    // If expn name is multi-line, display only first line
                    if (RefactoringUtils.numLines(expn.value) > 1) {
                        expn.name = expn.value.substr(0, expn.value.indexOf("\n")) + "...";
                    } else {
                        expn.name = expn.value;
                    }
                });

                // If only one surround expression, extract
                if (expns.length === 1) {
                    callExtractToVariable(expns[0].start, expns[0].end, expns[0].value);
                    return;
                }

                expns.forEach(function(expn, index) {
                    expn.id = index;
                });

                // UI for extract to variable
                inlineMenu = new InlineMenu(session.editor, Strings.EXTRACTTO_VARIABLE_SELECT_EXPRESSION);

                inlineMenu.onHover(function (expnId) {
                    // Remove the scroll Handlers If already Attached.
                    editor.off("scroll.inlinemenu");
                    // Add a scroll handler If Selection Range is not View.
                    // This is Added for a Bug, where Menu used not to open for the first Time
                    if(!editor.isLineVisible(editor.posFromIndex(expns[expnId].end).line)) {
                        editor.on("scroll.inlinemenu", function() {
                            // Remove the Handlers so that If scroll event is triggerd again by any other operation
                            // Menu should not be reopened.
                            // Menu Should be reopened only if Scroll event is triggered by onHover.
                            editor.off("scroll.inlinemenu");
                            inlineMenu.openRemovedMenu();
                        });
                    }
                    editor.setSelection(editor.posFromIndex(expns[expnId].start), editor.posFromIndex(expns[expnId].end));
                });

                inlineMenu.open(expns);

                inlineMenu.onSelect(function (expnId) {
                    callExtractToVariable(expns[expnId].start, expns[expnId].end, expns[expnId].value);
                    inlineMenu.close();
                });

                inlineMenu.onClose(function () {
                    inlineMenu.close();
                });
            }
        }).fail(function() {
            editor.displayErrorMessageAtCursor(Strings.ERROR_TERN_FAILED);
        });
    }

    /**
     * Creates a new session from editor and stores it in session global variable
     */
    function initializeSession(editor) {
        session = new Session(editor);
    }

    exports.handleExtractToVariable = handleExtractToVariable;
});
