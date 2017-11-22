define(function(require, exports, module) {
    'use strict';
    var Acorn           = brackets.getModule("thirdparty/acorn/dist/acorn"),
        ASTWalker       = brackets.getModule("thirdparty/acorn/dist/walk"),
        Menus           = brackets.getModule("command/Menus"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        KeyBindingManager =  brackets.getModule("command/KeyBindingManager"),
        DefaultDialogs = brackets.getModule("widgets/DefaultDialogs"),
        Dialogs = brackets.getModule("widgets/Dialogs");

    function ExtractToVariable() {
        this.editor = null;
        this.doc = null;
        this.text = null;
        this.start = null;
        this.end = null;
        this.parentExp = null;
    }

    ExtractToVariable.prototype.hasHandlers = function() {
        return true;
    };

    ExtractToVariable.prototype.getHandlers = function() {
        return [];
    };

    // Removes the leading and trailing spaces from selection and the trailing semicolons
    ExtractToVariable.prototype.normalizeSelection = function() {
        var selection   = this.editor.getSelection(),
            text        = this.editor.getSelectedText(),
            trimmedText,
            start       = this.indexFromPos(selection.start),
            end         = this.indexFromPos(selection.end);

        // Remove leading spaces
        trimmedText = text.trimLeft();

        if (trimmedText.length < text.length) {
            start += (text.length - trimmedText.length);
        }

        text = trimmedText;

        // Remove trailing spaces
        trimmedText = text.trimRight();

        if (trimmedText.length < text.length) {
            end -= (text.length - trimmedText.length);
        }

        text = trimmedText;

        // Remove trailing semicolons from selection
        var i;
        for (i = text.length - 1; i >= 0; --i) {
            if (text[i] !== ";") {
                break;
            }
        }
        end -= text.length - i - 1;
        text = text.substr(0, i + 1);

        this.text = text;
        this.start = start;
        this.end = end;
    };

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

    ExtractToVariable.prototype.indexFromPos = function(pos) {
        return this.editor.indexFromPos(pos);
    };

    ExtractToVariable.prototype.posFromIndex = function(index) {
        return this.editor._codeMirror.posFromIndex(index);
    };

    ExtractToVariable.prototype.extract = function () {
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
        var $template = $(require("text!dialog.html"));
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

                    self.editor._codeMirror.indentLine(startPos.line, "prev");
                });
            }
        });
    };

    ExtractToVariable.prototype.checkExpression = function() {
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
                            console.log(node);
                            console.log(temp);
                            self.parentExp = temp;
                            break;
                        }
                        temp = ancestors[i];
                    }
                }
            }
        });


        return expFound;
    };

    ExtractToVariable.prototype.init = function() {
        this.editor = EditorManager.getActiveEditor();
        this.doc = this.editor.document;
        this.normalizeSelection();
    };

    ExtractToVariable.prototype.displayErrorMessage = function() {
        this.editor.displayErrorMessageAtCursor("Cannot extract variable.The selection does not form a expression");
    };

    CommandManager.register("Extract variable", "refactoring.extract", function() {
        var extractToVariable = new ExtractToVariable();
        extractToVariable.init();
        if (extractToVariable.checkExpression()) {
            extractToVariable.extract();
        }
        else {
            extractToVariable.displayErrorMessage();
        }
    });

    KeyBindingManager.addBinding("refactoring.extract", "Ctrl-Alt-V");

    Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem("refactoring.extract");
});

/* Commented blocks
// if (!isExpression(selectedText)) {
//     editor.displayErrorMessageAtCursor("Cannot extract variable.The selection does not form a expression");
//     return;
// }
//
// var x1 = editor._codeMirror.posFromIndex(start);
// var x2 = Object.assign({}, x1);
// x2.line = x1.line = x1.line + numLines(text);
// x2.ch += 4;
//
// var y1 = Object.assign({}, pos);
// y1.ch += 4;
// var y2 = Object.assign({}, pos);
// y2.ch += 8;
//
// editor.setSelections([
//     {
//         start: y1,
//         end: y2
//     },
//     {
//         start: x1,
//         end: x2
//     }
// ]);
*/
