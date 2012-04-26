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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, brackets */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var Commands                = require("command/Commands"),
        KeyBindingManager       = require("command/KeyBindingManager"),
        EditorManager           = require("editor/EditorManager"),
        CommandManager          = require("command/CommandManager");
    
    /**
     * Maps the dom id's of menus to command strings in Commands.js 
     * @type {Object.<string, string>}
     */
    var menuMap = {
        // File
        "menu-file-new": Commands.FILE_NEW,
        "menu-file-open": Commands.FILE_OPEN,
        "menu-file-open-folder": Commands.FILE_OPEN_FOLDER,
        "menu-file-close": Commands.FILE_CLOSE,
        "menu-file-save": Commands.FILE_SAVE,
        "menu-file-live-file-preview": Commands.FILE_LIVE_FILE_PREVIEW,
        "menu-file-quit": Commands.FILE_QUIT,

        // Edit
        "menu-edit-undo": Commands.EDIT_UNDO,
        "menu-edit-redo": Commands.EDIT_REDO,
        "menu-edit-cut": Commands.EDIT_CUT,
        "menu-edit-copy": Commands.EDIT_COPY,
        "menu-edit-paste": Commands.EDIT_PASTE,

        "menu-edit-select-all": Commands.EDIT_SELECT_ALL,
        "menu-edit-find": Commands.EDIT_FIND,
        "menu-edit-find-in-files": Commands.EDIT_FIND_IN_FILES,
        "menu-edit-find-next": Commands.EDIT_FIND_NEXT,
        "menu-edit-find-previous": Commands.EDIT_FIND_PREVIOUS,
        "menu-edit-replace": Commands.EDIT_REPLACE,

        // View
        "menu-view-hide-sidebar": Commands.VIEW_HIDE_SIDEBAR,

        // Navigate
        "menu-navigate-quick-open": Commands.NAVIGATE_QUICK_OPEN,
        "menu-navigate-quick-edit": Commands.SHOW_INLINE_EDITOR,
        "menu-navigate-next-css-rule": Commands.NEXT_CSS_RULE,
        "menu-navigate-previous-css-rule": Commands.PREVIOUS_CSS_RULE,

        // Debug
        "menu-debug-refresh-window": Commands.DEBUG_REFRESH_WINDOW,
        "menu-debug-show-developer-tools": Commands.DEBUG_SHOW_DEVELOPER_TOOLS,
        "menu-debug-jslint": Commands.DEBUG_JSLINT,
        "menu-debug-runtests": Commands.DEBUG_RUN_UNIT_TESTS,
        "menu-debug-show-perf": Commands.DEBUG_SHOW_PERF_DATA,


        // Experimental
        "menu-experimental-new-brackets-window": Commands.DEBUG_NEW_BRACKETS_WINDOW,
        "menu-experimental-close-all-live-browsers": Commands.DEBUG_CLOSE_ALL_LIVE_BROWSERS,
        "menu-experimental-usetab": Commands.DEBUG_USE_TAB_CHARS
    };


    function init() {
        var cmdToIdMap = {}; // used to swap the values and keys for fast look up

        function createExecFunc(commandStr) {
            return function () {
                // TODO TY: should flash menu here on Mac
                //console.log(commandStr);
                CommandManager.execute(commandStr);
            };
        }

        // create click handlers and populate cmdToIdMap
        var menuID;
        var commandStr;
        for (menuID in menuMap) {
            if (menuMap.hasOwnProperty(menuID)) {
                commandStr = menuMap[menuID];
                $("#" + menuID).click(createExecFunc(commandStr));
                cmdToIdMap[commandStr] = menuID;
            }
        }

        // Add shortcut key text to menu items in UI
        var menuBindings = KeyBindingManager.getKeymap();
        var keyCmd, shortcut;
        for (keyCmd in menuBindings) {
            if (menuBindings.hasOwnProperty(keyCmd)) {
                commandStr = menuBindings[keyCmd];
                menuID = cmdToIdMap[commandStr];
                if (menuID) {
                    // Convert normalized key representation to display appropriate for platform
                    if (brackets.platform === "mac") {
                        shortcut = keyCmd.replace(/-/g, "");        // remove dashes
                        shortcut = shortcut.replace("Ctrl", "&#8984");  // Ctrl > command symbol
                        shortcut = shortcut.replace("Shift", "&#8679"); // Shift > shift symbol
                        shortcut = shortcut.replace("Alt", "&#8997");   // Alt > option symbol
                    } else {
                        shortcut = keyCmd.replace(/-/g, "+");
                    }

                    var $menu = $("#" + menuID);
                    // Some commands have multiple key commands. Only add the first one.
                    if ($menu.find(".menu-shortcut").length === 0) {
                        $menu.append("<span class='menu-shortcut'>" + shortcut + "</span>");
                    }
                }
            }
        }

        // Prevent clicks on the top-level menu bar from taking focus
        // Note, bootstrap handles this already for the menu drop downs 
        $("#main-toolbar .dropdown").mousedown(function (e) {
            e.preventDefault();
        });

// Other debug menu items
//            $("#menu-debug-wordwrap").click(function() {
//                editor.setOption("lineWrapping", !(editor.getOption("lineWrapping")));
//            });     
        
                
   
    }

    // Define public API
    exports.init = init;
});
