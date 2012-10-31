/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        Menus               = brackets.getModule("command/Menus");

    // Define the functions that Commands will execute
    function TestCommand1() {
        var command1 = CommandManager.get("extensionTest.command1");
        if (!command1) {
            return;
        }
        var command2 = CommandManager.get("extensionTest.command2");
        if (!command2) {
            return;
        }

        var checked = command1.getChecked();
        if (checked) {
            alert("Unchecking self. Disabling next.");
            command2.setEnabled(false);
        } else {
            alert("Checking self. Enabling next.");
            command2.setEnabled(true);
        }
        command1.setChecked(!checked);
    }
    
    function TestCommand2() {
        alert("Executing command 2");
    }

    function TestCommand3() {
        alert("Executing command 3");
    }
    
    // Register the functions as commands
    var command1 = CommandManager.register("Toggle Checkmark", "extensionTest.command1", TestCommand1);
    var command2 = CommandManager.register("Enabled when previous is Checked", "extensionTest.command2", TestCommand2);
    var command3 = CommandManager.register("Enabled when text selected", "extensionTest.command3", TestCommand3);

    // Set the Command initial state
    command1.setChecked(true);
    command2.setEnabled(true);
    command3.setEnabled(false);

    // Update the MenuItem by changing the underlying command
    var updateEnabledState = function () {
        var editor = EditorManager.getFocusedEditor();
        command3.setEnabled(editor && editor.getSelectedText() !== "");
    };
    var editor_cmenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
    $(editor_cmenu).on("beforeContextMenuOpen", updateEnabledState);

    
    // Add the Commands as MenuItems of the Editor context menu
    if (editor_cmenu) {
        editor_cmenu.addMenuDivider();
        editor_cmenu.addMenuItem("extensionTest.command1");
        editor_cmenu.addMenuItem("extensionTest.command2");
        editor_cmenu.addMenuItem("extensionTest.command3");
    }
});
