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
    Menu.prototype.createMenuItem = function (name, keyCmds, commandStr, relativeMenuItemID) {
        var newItem;

        if (name === "---") {
            newItem = $("<li><hr class='divider'></li>");
        } else {
            newItem = $("<li><a href='#' id='" + name.toLowerCase() + "-menu-item'>" + name + "</a></li>")
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
        .createMenuItem("New",                      "Ctrl-N",       Commands.FILE_NEW)
        .createMenuItem("Open",                     "Ctrl-O",       Commands.FILE_OPEN)
        .createMenuItem("Open Folder",              null,           Commands.FILE_OPEN_FOLDER)
        .createMenuItem("Close",                    "Ctrl-W",       Commands.FILE_CLOSE)
        .createMenuDivider()
        .createMenuItem("Save",                     "Ctrl-S",       Commands.FILE_SAVE)
        .createMenuDivider()
        .createMenuItem("Live File Preview",        "Ctrl-Alt-P",   Commands.FILE_LIVE_FILE_PREVIEW)
        .createMenuDivider()
        .createMenuItem("Quit",                     "Ctrl-Q",       Commands.FILE_QUIT);

    createMenu("Edit")
        .createMenuItem("Select All",               "Ctrl-A",       Commands.EDIT_SELECT_ALL)
        .createMenuDivider()
        .createMenuItem("Find",                     "Ctrl-F",       Commands.EDIT_FIND)
        .createMenuItem("Find in Files",            "Ctrl-Shift-F", Commands.EDIT_FIND_IN_FILES)
        .createMenuItem("Find Next",                [{key: "F3",    platform: "win"},
                                                    {key: "Ctrl-G", platform: "mac"}],
                                                                    Commands.EDIT_FIND_NEXT)

        .createMenuItem("Find Previous",            [{key: "Shift-F3",     platform: "win"},
                                                    {key:  "Ctrl-Shift-G", platform: "mac"}],
                                                                    Commands.EDIT_FIND_PREVIOUS)

        .createMenuDivider()
        .createMenuItem("Replace",                  [{key: "Ctrl-H",    platform: "win"},
                                                    {key: "Ctrl-Alt-F", platform: "mac"}],
                                                                    Commands.EDIT_REPLACE)
        .createMenuDivider()
        .createMenuItem("Duplicate",                null,           Commands.EDIT_DUPLICATE)
        .createMenuItem("Comment/Uncomment Lines",  "Ctrl-/",       Commands.EDIT_LINE_COMMENT);

    createMenu("View")
        .createMenuItem("Show Sidebar",             "Ctrl-Shift-H", Commands.VIEW_HIDE_SIDEBAR);

    createMenu("Navigate")
        .createMenuItem("Quick Open",               "Ctrl-Shift-O", Commands.NAVIGATE_QUICK_OPEN)
        .createMenuItem("Go to Line",               [{key: "Ctrl-G", platform: "win"},
                                                    {key: "Ctrl-L", platform: "mac"}],
                                                            Commands.NAVIGATE_GOTO_LINE)

        .createMenuItem("Go to Symbol",             "Ctrl-T",       Commands.NAVIGATE_GOTO_DEFINITION)
        .createMenuDivider()
        .createMenuItem("Quick Edit",               "Ctrl-E",       Commands.SHOW_INLINE_EDITOR)
        .createMenuItem("Previous Match",           "Alt-Up",       Commands.QUICK_EDIT_PREV_MATCH)
        .createMenuItem("Next Match",               "Alt-Down",     Commands.QUICK_EDIT_NEXT_MATCH);

    createMenu("Debug")
        .createMenuItem("Reload Window",            [{key: "F5",    platform: "win"},
                                                    {key: "Ctrl-R", platform:  "mac"}],
                                                                    Commands.DEBUG_REFRESH_WINDOW)

        .createMenuItem("Show Developer Tools",     null,           Commands.DEBUG_SHOW_DEVELOPER_TOOLS)
        .createMenuItem("Run Tests",                null,           Commands.DEBUG_RUN_UNIT_TESTS)
        .createMenuItem("Enable JSLint",            null,           Commands.DEBUG_JSLINT)
        .createMenuItem("Show Perf Data",           null,           Commands.DEBUG_SHOW_PERF_DATA)
        .createMenuDivider()
        .createMenuItem("Expirimental",             null)
        .createMenuItem("New Window",               null,           Commands.DEBUG_NEW_BRACKETS_WINDOW)
        .createMenuItem("Close Browsers",           null,           Commands.DEBUG_CLOSE_ALL_LIVE_BROWSERS)
        .createMenuItem("Use Tab Characters",       null,           Commands.DEBUG_USE_TAB_CHARS);

    
    


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
