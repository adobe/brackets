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
/*global define, $, brackets */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var Commands                = require("command/Commands"),
        KeyBindingManager       = require("command/KeyBindingManager"),
        EditorManager           = require("editor/EditorManager"),
        CommandManager          = require("command/CommandManager");

    function createExecMenuFunc(commandStr) {
        return function () {
            // TODO TY: should flash menu here on Mac
            //console.log(commandStr);
            CommandManager.execute(commandStr);
        };
    }


    function Menu(id) {
        this.id = id;
    }

    function MenuItem(id) {
        this.id = id;
    }

    function getMenuByName(name) {
        // TODO
    }

    function getMenuByID(id) {
        return $("#main-toolbar .nav").find("#" + id).get(0);
    }

    /**
     * @param {string} name
     * @param {string }relativeMenu
     * @returns {Menu}
     */
    function createMenu(name, relativeMenuID) {
        var $menubar = $("#main-toolbar .nav");
        var newMenuID = name.toLowerCase() + "-menu";
        
        // Guard against duplicate menu ids
        if (getMenuByID(newMenuID)) {
            throw new Error("Menu added with same name and id of existing menu: " + newMenuID);
        }

        var $newMenu = $("<li class='dropdown' id='" + newMenuID + "'></li>")
            .append("<a href='#' class='dropdown-toggle'>" + name + "</a>")
            .append("<ul class='dropdown-menu'></ul>");

        if (relativeMenuID) {
            var relative = getMenuByID(relativeMenuID);
            // TODO: handle not found
            relative.after($newMenu);
        } else {
            $menubar.append($newMenu);
        }

        // todo error handling

        return new Menu(newMenuID);
    }

    Menu.prototype.createMenuDivider = function (relativeMenuItemID) {
        return this.createMenuItem("---", null, null, relativeMenuItemID);
    };

    // Convert normalized key representation to display appropriate for platform
    function formatKeyCommand(keyCmd) {
        var displayStr;
        if (brackets.platform === "mac") {
            displayStr = keyCmd.replace(/-/g, "");        // remove dashes
            displayStr = displayStr.replace("Ctrl", "&#8984");  // Ctrl > command symbol
            displayStr = displayStr.replace("Shift", "&#8679"); // Shift > shift symbol
            displayStr = displayStr.replace("Alt", "&#8997");   // Alt > option symbol
        } else {
            displayStr = keyCmd.replace(/-/g, "+");
        }

        return displayStr;
    }

    /**
     * @param {string} name
     * @param {position}
     * @param TODO
     * @param {string} commandStr
     */
    Menu.prototype.createMenuItem = function (name, id, commandStr, keyCmds) {
        var newItem;

        if (name === "---") {
            newItem = $("<li><hr class='divider'></li>");
        } else {
            newItem = $("<li><a href='#' id='" + id + "-menu-item'>" + name + "</a></li>")
                .click(createExecMenuFunc(commandStr));

            if (keyCmds) {
                if (!$.isArray(keyCmds)) {
                    keyCmds = [{key: keyCmds}];
                }

                var key, i;
                for (i = 0; i < keyCmds.length; i++) {
                    key = keyCmds[i].key;

                    if (newItem.find(".menu-shortcut").length === 0) {
                        newItem.find("a").append("<span class='menu-shortcut'>" + formatKeyCommand(key) + "</span>");
                    }

                    // Todo: Ray
                    //KeyBindingManager.addKey(keyStr, commandStr);
                }
            }
            
        }
        $("#main-toolbar #" + this.id + " .dropdown-menu").append(newItem);

        return this;
    };

    createMenu("File")
        .createMenuItem("New",                  "file-new",             Commands.FILE_NEW,         "Ctrl-N")
        .createMenuItem("Open",                 "file-open",            Commands.FILE_OPEN,        "Ctrl-O")
        .createMenuItem("Open Folder",                                  Commands.FILE_OPEN_FOLDER)
        .createMenuItem("Close",                "file-close",           Commands.FILE_CLOSE,        "Ctrl-W")
        .createMenuDivider()
        .createMenuItem("Save",                 "file-save",            Commands.FILE_SAVE,         "Ctrl-S")
        .createMenuDivider()
        .createMenuItem("Live File Preview",    "file-live-preview",    Commands.FILE_LIVE_FILE_PREVIEW,
                                                                                                    "Ctrl-Alt-P")
        .createMenuDivider()
        .createMenuItem("Quit",                 "file-quit",            Commands.FILE_QUIT,         "Ctrl-Q");

    createMenu("Edit")
        .createMenuItem("Select All",           "edit-select-all",      Commands.EDIT_SELECT_ALL,   "Ctrl-A")
        .createMenuDivider()
        .createMenuItem("Find",                 "edit-find",            Commands.EDIT_FIND,         "Ctrl-F")
        .createMenuItem("Find in Files",        "edit-find-in-files",   Commands.EDIT_FIND_IN_FILES,
                                                                                                    "Ctrl-Shift-F")
        .createMenuItem("Find Next",            "edit-find-next",       Commands.EDIT_FIND_NEXT,
                                                                        [{key: "F3",     platform: "win"},
                                                                         {key: "Ctrl-G", platform: "mac"}])

        .createMenuItem("Find Previous",        "edit-find-previous",   Commands.EDIT_FIND_PREVIOUS,
                                                                        [{key: "Shift-F3",      platform: "win"},
                                                                         {key:  "Ctrl-Shift-G", platform: "mac"}])

        .createMenuDivider()
        .createMenuItem("Replace",              "edit-repace",          Commands.EDIT_REPLACE,
                                                                        [{key: "Ctrl-H",     platform: "win"},
                                                                         {key: "Ctrl-Alt-F", platform: "mac"}])
        .createMenuDivider()
        .createMenuItem("Duplicate",            "edit-duplicate",       Commands.EDIT_DUPLICATE)
        .createMenuItem("Comment/Uncomment Lines",
                                                "edit-comment",         Commands.EDIT_LINE_COMMENT, "Ctrl-/");

    createMenu("View")
        .createMenuItem("Show Sidebar",         "view-sidebar",         Commands.VIEW_HIDE_SIDEBAR, "Ctrl-Shift-H");

    createMenu("Navigate")
        .createMenuItem("Quick Open",           "navigate-quick-open",  Commands.NAVIGATE_QUICK_OPEN,
                                                                                                    "Ctrl-Shift-O")
        .createMenuItem("Go to Line",           "navigate-goto-line",   Commands.NAVIGATE_GOTO_LINE,
                                                                        [{key: "Ctrl-G", platform: "win"},
                                                                         {key: "Ctrl-L", platform: "mac"}])

        .createMenuItem("Go to Symbol",         "navigate-goto-symbol", Commands.NAVIGATE_GOTO_DEFINITION,
                                                                                                    "Ctrl-T")
        .createMenuDivider()
        .createMenuItem("Quick Edit",           "navigate-quick-edit",  Commands.SHOW_INLINE_EDITOR,
                                                                                                    "Ctrl-E")
        .createMenuItem("Previous Match",       "navigate-prev-match",  Commands.QUICK_EDIT_PREV_MATCH,
                                                                                                    "Alt-Up")
        .createMenuItem("Next Match",           "navigate-next-match",  Commands.QUICK_EDIT_NEXT_MATCH,
                                                                                                    "Alt-Down");

    createMenu("Debug")
        .createMenuItem("Reload Window",        "deubg-reload-wn",      Commands.DEBUG_REFRESH_WINDOW,
                                                                        [{key: "F5",     platform: "win"},
                                                                         {key: "Ctrl-R", platform:  "mac"}])

        .createMenuItem("Show Developer Tools", "debug-dev-tools",      Commands.DEBUG_SHOW_DEVELOPER_TOOLS)
        .createMenuItem("Run Tests",            "debug-run-tests",      Commands.DEBUG_RUN_UNIT_TESTS)
        .createMenuItem("Enable JSLint",        "debug-enable-jslint",  Commands.DEBUG_JSLINT)
        .createMenuItem("Show Perf Data",       "debug-perf-data",      Commands.DEBUG_SHOW_PERF_DATA)
        .createMenuDivider()
        .createMenuItem("Expirimental",         "debug-experiemental")
        .createMenuItem("New Window",           "debug-new-window",     Commands.DEBUG_NEW_BRACKETS_WINDOW)
        .createMenuItem("Close Browsers",       "debug-close-browser",  Commands.DEBUG_CLOSE_ALL_LIVE_BROWSERS)
        .createMenuItem("Use Tab Characters",   "debug-use-tab-chars",  Commands.DEBUG_USE_TAB_CHARS);

    
    


    function init() {

        $("#main-toolbar .dropdown")
            // Prevent clicks on the top-level menu bar from taking focus
            // Note, bootstrap handles this already for the menu drop downs 
            .mousedown(function (e) {
                e.preventDefault();
            })
            // Switch menus when the mouse enters an adjacent menu
            // Only open the menu if another one has already been opened
            // by clicking
            .mouseenter(function (e) {
                var open = $(this).siblings(".open");
                if (open.length > 0) {
                    open.removeClass("open");
                    $(this).addClass("open");
                }
            });

// Other debug menu items
//            $("#menu-debug-wordwrap").click(function() {
//                editor.setOption("lineWrapping", !(editor.getOption("lineWrapping")));
//            });     
        
                
   
    }

    // Define public API
    exports.init = init;
});
