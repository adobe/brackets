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

    /**
     * Brackets Application Menu Constants
     * @enum {string}
     */
    var appMenuBar = {
        FILE_MENU:     "brackets-file-menu",
        EDIT_MENU:     "brackets-edit-menu",
        VIEW_MENU :    "brackets-view-menu",
        NAVIGATE_MENU: "brackets-navigate-menu",
        DEBUG_MENU:    "brackets-debug-menu"
    };


    /**
     * Brackets Application MenuItem Groups
     * TODO
     */

    
    /**
      * Insertion position constants. Used by addMenu(), addMenuItem(), and addSubMenu() to
      * specify the relative position of a newly created menu object
      * @enum {string}
      */
    var insert = {
        BEFORE:  "before",
        AFTER:   "after",
        FIRST:   "first",
        LAST:    "last"
    };


    /**
     * @param {Command}
     */
    function createExecMenuFunc(command) {
        return function () {
            command.execute();
        };
    }

    /**
     * TODO docs
     */
    var menuMap = {};
    /**
     * TODO docs
     */
    var menuItemMap = {};


    /**
     * @constructor
     * @private
     *
     * Menu represents a top-level menu in the menu bar. A Menu may correspond to an HTML-based
     * menu or a native menu if Brackets is running in a native application shell. 
     * 
     * Since menus may have a native implementation clients should create Menus through 
     * addMenu() and should NOT construct a Menu object directly. 
     * Clients should also not access HTML content of a menu directly and instead use
     * the Menu API to query and modify menus.
     *
     * Menu dispatches the following events:
     *  open
     *  close
     *
     */
    function Menu(id) {
        this.id = id;
    }

    /**
     * @constructor
     * @private
     *
     * MenuItem represents a menu, sub-menu, or divider. A Menu may correspond to an HTML-based
     * menu item or a native menu item if Brackets is running in a native application shell
     *
     * Since menu items may have a native implementation clients should create MenuItems through 
     * addMenuItem() and should NOT construct a MenuItem object directly. 
     * Clients should also not access HTML content of a menu directly and instead use
     * the MenuItem API to query and modify menus items.
     *
     * MenuItem dispatches the following events:
     *  click
     */
    function MenuItem(id) {
        this.id = id;
    }

    /**
     * Retrieves the Menu object for the corresponding id. 
     * @param {string} id
     * @return {Menu}
     */
    function getMenu(id) {
        return menuMap[id];
    }

    /**
     * Retrieves the MenuItem object for the corresponding id. 
     * @param {string} id
     * @return {MenuItem}
     */
    function getMenuItem(id) {
        return menuItemMap[id];
    }


    function _getHTMLMenu(id) {
        return $("#main-toolbar .nav").find("#" + id).get(0);
    }

    function _getHTMLMenuItem(id) {
        return $("#main-toolbar .nav").find("#" + id).get(0);
    }


    function addMenu(name, id, relativeMenuID) {
        var $menubar = $("#main-toolbar .nav"),
            menu;

        if (!name || !id) {
            throw new Error("call to addMenu() is missing required parameters");
        }
        
        // Guard against duplicate menu ids
        if (menuMap[id]) {
            throw new Error("Menu added with same name and id of existing Menu: " + id);
        }

        menu = new Menu(id);
        menuMap[id] = menu;

        var $newMenu = $("<li class='dropdown' id='" + id + "'></li>")
            .append("<a href='#' class='dropdown-toggle'>" + name + "</a>")
            .append("<ul class='dropdown-menu'></ul>");


        // TODO: relative logic
        if (relativeMenuID) {
            var relative = _getHTMLMenu(relativeMenuID);
            // TODO: handle not found
            relative.after($newMenu);
        } else {
            $menubar.append($newMenu);
        }

        // todo error handling

        return menu;
    }

    /**
     * Inserts divider item in menu
     * @param {!string} id
     * @param {?string} relativeID - id of menuItem or menuItemGroup the new menuItem 
     *      will be positioned relative to.
     * @param {?string} position - constant defining the position of new the MenuItem relative
     *      to the item specified by relativeID (see Insertion position constants).
     *      Default is insert.LAST
     * 
     * @return {MenuItem} the newly created divider
     */
    Menu.prototype.createMenuDivider = function (id, relativeMenuItemID) {
        return this.addMenuItem("---", id, null, relativeMenuItemID);
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
     * Adds a new menu item with the specified id and display text. The insertion position is
     * specified via the relativeID and position arguments which describe a position 
     * relative to another MenuItem or MenuGroup. 
     *
     * Note, keyBindings are bound to Command objects not MenuItems. The provided keyBindings
     *      will be bound to the supplied Command object rather than the MenuItem.
     * 
     * @param {!string} name - display text for menu item. "---" creates a menu divider
     * @param {!string} id
     * @param {?(string | Command)} command - the command the menu will execute.
     * @param {?(string | Array.<{key: string, platform: string)}>}  keyBindings - register one
     *      one or more key bindings to associate with the supplied command.
     * @param {?string} relativeID - id of menuItem or menuItemGroup the new menuItem 
     *      will be positioned relative to.
     * @param {?string} position - constant defining the position of new the MenuItem relative
     *      to the item specified by relativeID (see Insertion position constants). 
    *      Default is insert.LAST
     *
     * @return {MenuItem} the newly created MenuItem
     */
    Menu.prototype.addMenuItem = function (name, id, command, keyBindings, relativeID, position) {
        var $menuItem,
            menuItem;

        if (!name || !id) {
            throw new Error("addMenItem(): missing required parameters");
        }

        // Guard against duplicate menu ids
        if (menuItemMap[id]) {
            throw new Error("MenuItem added with same name and id of existing MenuItem: " + id);
        }

        if (keyBindings && !command) {
            throw new Error("addMenItem(): keyBindings specified but missing command parameter");
        }

        if (typeof (command) === "string") {
            command = CommandManager.get(command);
        }
        
        if (name === "---") {
            $menuItem = $("<li><hr class='divider'></li>");
        } else {
            $menuItem = $("<li><a href='#' id='" + id + "'> <span class='menu-name'>" + name + "</span></a></li>");

            if (command) {
                $menuItem.click(createExecMenuFunc(command));
                $(command).on("commandEnabledStateChanged", this.handleEnabledChanged);
                $(command).on("commandCheckedStateChanged", this.handleCheckedChanged);
            }

            if (keyBindings) {
                if (!$.isArray(keyBindings)) {
                    keyBindings = [{key: keyBindings}];
                }

                var key, i, platform;
                for (i = 0; i < keyBindings.length; i++) {
                    key = keyBindings[i].key;
                    platform = keyBindings[i].platform;

                    if ($menuItem.find(".menu-shortcut").length === 0) {
                        $menuItem.find("a").append("<span class='menu-shortcut'>" + formatKeyCommand(key) + "</span>");
                    }

                    KeyBindingManager.addBinding(command.getID(), key, platform);
                }
            }
            
        }
        $("#main-toolbar #" + this.id + " .dropdown-menu").append($menuItem);

        menuItem = new MenuItem(id);
        menuItemMap[id] = menuItem;
        return menuItem;
    };

    /**
     * Alternative JSON based API to addMenuItem()
     * 
     * All properties are required unless noted as optional.
     *
     * @param { Array.<Object.<
                    name:       string,
     *              id:         string,
     *              command:    string | Command (optional),
     *              bindings:   string | Array.<{key: string, platform: string}>) } (optional),
     *          >>} jsonStr
     *
     *        }
     *
     * @return {MenuItem} the newly created MenuItem
     */
    Menu.prototype.createMenusItemFromJSON = function (jsonStr) {
        throw new Error("createMenuItemFromJSON() not implemented yet");
    };

    /**
     * @param {!string} text displayed in menu item
     * @param {!string} id
     * @param {?string} relativeID - id of menuItem or menuItemGroup the new menuItem 
     *      will be positioned relative to.
     * @param {?string} position - constant defining the position of new the MenuItem relative
     *      to the item specified by relativeID (see Insertion position constants).
     *      Default is insert.LAST
     * 
     * @return {MenuItem} newly created menuItem for sub-menu
     */
    MenuItem.prototype.createSubMenu = function (text, id, relativeMenuID) {
        throw new Error("createSubMenu() not implemented yet");
    };

    var _menuDividerIDCount = 1;
    function _getNextMenuItemDividerID() {
        return "brackets-menuDivider-" + _menuDividerIDCount++;
    }

    /**
     * Gets/sets menuItem name property
     * @param {string} newName 
     * @param {string} current name
     */
    MenuItem.prototype.name = function (newName) {
        var $menuItem = $(_getHTMLMenuItem(this.id)).find(".menu-name");
        if (newName) {
            $menuItem.text(newName);
            return newName;
        } else {
            return $menuItem.text();
        }
    };

    /**
     * Returns the parent MenuItem if the menu item is a sub-menu, returns null otherwise.
     * @return {MenuItem}
     */
    MenuItem.prototype.getParentMenuItem = function () {
        throw new Error("getParentMenuItem() not implemented yet");
    };

    /**
     * Returns the parent Menu for this MenuItem
     * @return {Menu} 
     */
    MenuItem.prototype.getParentMenu = function () {
        var parent = $(_getHTMLMenuItem(this.id)).parents(".dropdown").get(0);
        if (!parent) {
            return null;
        }

        return getMenu(parent.id);
    };
    

    MenuItem.prototype.handleCheckedChanged = function () {
        // TODO
    };

    MenuItem.prototype.handleEnabledChanged = function () {
        // TODO
    };


    function init() {

        /*
         * File menu
         */
        var menu;
        menu = addMenu("File", appMenuBar.FILE_MENU);
        menu.addMenuItem("New",                  "file-new",             Commands.FILE_NEW,         "Ctrl-N");
        menu.addMenuItem("Open",                 "file-open",            Commands.FILE_OPEN,        "Ctrl-O");
        menu.addMenuItem("Open Folder",                                  Commands.FILE_OPEN_FOLDER);
        menu.addMenuItem("Close",                "file-close",           Commands.FILE_CLOSE,       "Ctrl-W");
        menu.createMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("Save",                 "file-save",            Commands.FILE_SAVE,        "Ctrl-S");
        menu.createMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("Live File Preview",    "file-live-preview",    Commands.FILE_LIVE_FILE_PREVIEW,
                                                                                                    "Ctrl-Alt-P");
        menu.createMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("Quit",                 "file-quit",            Commands.FILE_QUIT,        "Ctrl-Q");

        /*
         * Edit  menu
         */
        menu = addMenu("Edit", appMenuBar.EDIT_MENU);
        menu.addMenuItem("Select All",           "edit-select-all",      Commands.EDIT_SELECT_ALL,   "Ctrl-A");
        menu.createMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("Find",                 "edit-find",            Commands.EDIT_FIND,         "Ctrl-F");
        menu.addMenuItem("Find in Files",        "edit-find-in-files",   Commands.EDIT_FIND_IN_FILES,
                                                                                                        "Ctrl-Shift-F");
        menu.addMenuItem("Find Next",            "edit-find-next",       Commands.EDIT_FIND_NEXT,
                                                                            [{key: "F3",     platform: "win"},
                                                                             {key: "Ctrl-G", platform: "mac"}]);

        menu.addMenuItem("Find Previous",        "edit-find-previous",   Commands.EDIT_FIND_PREVIOUS,
                                                                            [{key: "Shift-F3",      platform: "win"},
                                                                             {key:  "Ctrl-Shift-G", platform: "mac"}]);

        menu.createMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("Replace",              "edit-repace",          Commands.EDIT_REPLACE,
                                                                            [{key: "Ctrl-H",     platform: "win"},
                                                                             {key: "Ctrl-Alt-F", platform: "mac"}]);
        menu.createMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("Duplicate",            "edit-duplicate",       Commands.EDIT_DUPLICATE);
        menu.addMenuItem("Comment/Uncomment Lines",
                                                    "edit-comment",         Commands.EDIT_LINE_COMMENT, "Ctrl-/");
        /*
         * View menu
         */
        menu = addMenu("View", appMenuBar.VIEW_MENU);
        menu.addMenuItem("Show Sidebar",         "view-sidebar",         Commands.VIEW_HIDE_SIDEBAR, "Ctrl-Shift-H");

        /*
         * Navigate menu
         */
        menu = addMenu("Navigate", appMenuBar.NAVIGATE_MENU);
        menu.addMenuItem("Quick Open",           "navigate-quick-open",  Commands.NAVIGATE_QUICK_OPEN,
                                                                                                        "Ctrl-Shift-O");
        menu.addMenuItem("Go to Line",           "navigate-goto-line",   Commands.NAVIGATE_GOTO_LINE,
                                                                            [{key: "Ctrl-G", platform: "win"},
                                                                             {key: "Ctrl-L", platform: "mac"}]);

        menu.addMenuItem("Go to Symbol",         "navigate-goto-symbol", Commands.NAVIGATE_GOTO_DEFINITION,
                                                                                                        "Ctrl-T");
        menu.createMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("Quick Edit",           "navigate-quick-edit",  Commands.SHOW_INLINE_EDITOR,
                                                                                                        "Ctrl-E");
        menu.addMenuItem("Previous Match",       "navigate-prev-match",  Commands.QUICK_EDIT_PREV_MATCH,
                                                                                                        "Alt-Up");
        menu.addMenuItem("Next Match",           "navigate-next-match",  Commands.QUICK_EDIT_NEXT_MATCH,
                                                                                                        "Alt-Down");
        /*
         * Debug menu
         */
        menu = addMenu("Debug", appMenuBar.DEBUG_MENU);
        menu.addMenuItem("Reload Window",        "deubg-reload-wn",      Commands.DEBUG_REFRESH_WINDOW,
                                                                            [{key: "F5",     platform: "win"},
                                                                             {key: "Ctrl-R", platform:  "mac"}]);

        menu.addMenuItem("Show Developer Tools", "debug-dev-tools",      Commands.DEBUG_SHOW_DEVELOPER_TOOLS);
        menu.addMenuItem("Run Tests",            "debug-run-tests",      Commands.DEBUG_RUN_UNIT_TESTS);
        menu.addMenuItem("Enable JSLint",        "debug-enable-jslint",  Commands.DEBUG_JSLINT);
        menu.addMenuItem("Show Perf Data",       "debug-perf-data",      Commands.DEBUG_SHOW_PERF_DATA);
        menu.createMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("Expirimental",         "debug-experiemental");
        menu.addMenuItem("New Window",           "debug-new-window",     Commands.DEBUG_NEW_BRACKETS_WINDOW);
        menu.addMenuItem("Close Browsers",       "debug-close-browser",  Commands.DEBUG_CLOSE_ALL_LIVE_BROWSERS);
        menu.addMenuItem("Use Tab Characters",   "debug-use-tab-chars",  Commands.DEBUG_USE_TAB_CHARS);

        // TEST
        getMenuItem("navigate-prev-match").name("Meow");

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
