/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
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
        "menu-view-hide-sidebar": Commands.DEBUG_HIDE_SIDEBAR,

        // Navigate
        "menu-navigate-quick-open": Commands.NAVIGATE_QUICK_OPEN,

        // Debug
        "menu-debug-refresh-window": Commands.VIEW_REFRESH_WINDOW,
        "menu-debug-show-developer-tools": Commands.DEBUG_SHOW_DEVELOPER_TOOLS,
        "menu-debug-jslint": Commands.DEBUG_JSLINT,
        "menu-debug-runtests": Commands.DEBUG_RUN_UNIT_TESTS,
        "menu-debug-show-perf": Commands.DEBUG_SHOW_PERF_DATA,


        // Experimental
        "menu-experimental-new-brackets-window": Commands.DEBUG_NEW_BRACKETS_WINDOW,
        "menu-experimental-close-all-live-browsers": Commands.DEBUG_CLOSE_ALL_LIVE_BROWSERS
    };

    var _codeMirrorInternal = [Commands.EDIT_SELECT_ALL, Commands.EDIT_UNDO];

    function init() {
        var cmdToIdMap = {}; // used to swap the values and keys for fast look up

        function createExecFunc(commandStr) {
            return function () {
                // TODO TY: should flash menu here
                //console.log(commandStr);

                EditorManager.focusEditor();
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

                    $("#" + menuID).append("<span class='menu-shortcut'>" + shortcut + "</span>");
                }
            }
        }

        
// Other debug menu items
//            $("#menu-debug-wordwrap").click(function() {
//                editor.setOption("lineWrapping", !(editor.getOption("lineWrapping")));
//            });     
        
                
   
    }

    // Define public API
    exports.init = init;
});
