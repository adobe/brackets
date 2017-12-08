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

    var EditorManager        = brackets.getModule("editor/EditorManager"),
        CommandManager       = brackets.getModule("command/CommandManager"),
        TokenUtils           = brackets.getModule("utils/TokenUtils"),
        Menus                = brackets.getModule("command/Menus");
        

    var MessageIds           = brackets.getModule("JSUtils/MessageIds"),
        RenameIdentifier     = require("RenameIdentifier"),
        WrapSelection        = require("WrapSelection");
    
    
    var refactorRename          = "javascript.renamereference",
        refactorWrapInTryCatch  = "refactoring.wrapintrycatch",
        editor;


    CommandManager.register("Rename", refactorRename, RenameIdentifier.handleRename);

    CommandManager.register("Wrap in Try Catch", refactorWrapInTryCatch, WrapSelection.wrapInTryCatch)
    
    var menuLocation = Menus.AppMenuBar.NAVIGATE_MENU;
    
    var keysRename = [
        {key: "Ctrl-R", platform:"mac"}, // don't translate to Cmd-R on mac
        {key: "Ctrl-R", platform:"win"},
        {key: "Ctrl-R", platform:"linux"}
    ];

    var editorCmenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
    if (editorCmenu) {
        editorCmenu.on("beforeContextMenuOpen", function (e) {
            
            editor = EditorManager.getActiveEditor();
            var cm = editor._codeMirror,
            tokenType = TokenUtils.getTokenAt(cm, cm.getCursor()).type,
            renameInJSFile = CommandManager.get(refactorRename);

            if (editor.getSelections().length > 1) {
                editorCmenu.removeMenuItem(refactorRename);
                editorCmenu.removeMenuItem(refactorWrapInTryCatch);
            }

            var sel = editor.getSelection();
            if ((editor.getModeForSelection() === "javascript") && (sel.start.line !== sel.end.line || sel.start.ch !== sel.end.ch)) {
                editorCmenu.addMenuItem(refactorWrapInTryCatch);
            } else {
                editorCmenu.removeMenuItem(refactorWrapInTryCatch);
            }
            
            if (editor.getModeForSelection() === "javascript" && (tokenType === "variable-2" || tokenType === "variable" || tokenType === "property" || tokenType === "def")) {
                editorCmenu.addMenuItem(refactorRename);
            } else {
                editorCmenu.removeMenuItem(refactorRename);
                
            }
        });
    }

    
    Menus.getMenu(menuLocation).addMenuItem(refactorRename, keysRename);
    Menus.getMenu(menuLocation).addMenuItem(refactorWrapInTryCatch);
});
