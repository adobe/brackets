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
        Strings                 = require("strings"),
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
     * Brackets Application Menu Section Constants
     * It is preferred that plug-ins specify the location of new MenuItems
     * in terms of a menu section rather than a specific MenuItem. This provides
     * looser coupling to Bracket's internal MenuItems and makes menu organization
     * more semantic. 
     * Use these constas as the "relativeID" parameter when calling AddMenuItem() and
     * specify a position of FIRST or LAST.
     */
    var FILE_OPEN_CLOSE_MENU_SECTION         = "brackets-file-open-close-menu-group";
    var FILE_SAVE_MENU_SECTION               = "brackets-file-save-menu-group";
    var FILE_LIVE_MENU_SECTION               = "brackets-file-live-menu-group";

    var EDIT_MODIFY_SELECTION_MENU_SECTION   = "brackets-edit-modify-selection-menu-group";
    var EDIT_FIND_MENU_SECTION               = "brackets-find-menu-group";
    var EDIT_REPLACE_MENU_SECTION            = "brackets-replace-menu-group";
    var EDIT_SELECTED_TEXT_COMMANDS          = "brackets-selected-text-commands";

    // View menu edit group placeholder

    var NAVIGATE_GOTO_MENU_SECTION           = "brackets-goto-menu-group";
    var NAVIGATE_QUICK_EDIT_MENU_SECTION     = "brackets-quick-edit-menu-group";
    
    /**
      * Insertion position constants
      * Used by addMenu(), addMenuItem(), and addSubMenu() to
      * specify the relative position of a newly created menu object
      * @enum {string}
      */
    var BEFORE =  "before";
    var AFTER =   "after";
    var FIRST =   "first";
    var LAST =    "last";


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

    var cmdToMenuMap = {};

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

    /**
     * Adds a top-level menu to the application menu bar which may be native or HTML-based.
     *
     * @param {!string} name - display text for menu 
     * @param {!string} id
     * @param {?string} relativeID - id of Menu the new Menu will be positioned relative to
     * @param {?string} position - constant defining the position of new the Menu relative
     *      to the item specified by relativeID (see Insertion position constants).
     *      Default is LAST
     * 
     * @return {Menu} the newly created Menu
     */
    function addMenu(name, id, relativeID, position) {
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
        if (relativeID) {
            var relative = _getHTMLMenu(relativeID);
            // TODO: handle not found
            relative.after($newMenu);
        } else {
            $menubar.append($newMenu);
        }

        // todo error handling

        return menu;
    }

    /**
     * Removes Menu
     */
    function removeMenu(id) {
        // TODO
    }

    /**
     * Inserts divider item in menu
     * @param {!string} id
     * @param {?string} relativeID - id of menuItem or menuItemGroup the new menuItem 
     *      will be positioned relative to.
     * @param {?string} position - constant defining the position of new the MenuItem relative
     *      to the item specified by relativeID (see Insertion position constants).
     *      Default is LAST
     * 
     * @return {MenuItem} the newly created divider
     */
    Menu.prototype.addMenuDivider = function (id, relativeMenuItemID) {
        return this.addMenuItem(id, "---", relativeMenuItemID);
    };

    // TODO: should this live in Commands?
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
     * relative to another MenuItem or MenuGroup. It is preferred that plug-ins 
     * insert new  MenuItems relative to a menu section rather than a specific 
     * MenuItem (see Menu Section Constants).
     *
     * TODO: Sub-menus are not yet supported, but when they are implemented this API will
     * allow adding new MenuItems to sub-menus as well.
     *
     * Note, keyBindings are bound to Command objects not MenuItems. The provided keyBindings
     *      will be bound to the supplied Command object rather than the MenuItem.
     * 
     * @param {!string} id
     * @param {(string | Command)} command - the command the menu will execute. Use "---" for a menu divider
     * @param {?(string | Array.<{key: string, platform: string)}>}  keyBindings - register one
     *      one or more key bindings to associate with the supplied command.
     * @param {?string} relativeID - id of menuItem, sub-menu, or menu section that the new 
     *      menuItem will be positioned relative to.
     * @param {?string} position - constant defining the position of new the MenuItem relative
     *      to the item specified by relativeID (see Insertion position constants). 
    *      Default is LAST
     *
     * @return {MenuItem} the newly created MenuItem
     */
    Menu.prototype.addMenuItem = function (id, command, keyBindings, relativeID, position) {
        var $menuItem,
            menuItem;

        if (!id || !command) {
            throw new Error("addMenItem(): missing required parameters");
        }

        if (menuItemMap[id]) {
            throw new Error("MenuItem added with same name and id of existing MenuItem: " + id);
        }

        if (keyBindings && !command) {
            throw new Error("addMenItem(): keyBindings specified but missing command parameter");
        }

        var name;
        if (typeof (command) === "string") {
            if (command === "---") {
                name = "---";
            } else {
                command = CommandManager.get(command);
                if (!command) {
                    throw new Error("addMenItem(): commandID not found");
                }
                name = command.getName();
            }
        }

        if (name === "---") {
            $menuItem = $("<li><hr class='divider'></li>");
        } else {
            cmdToMenuMap[command.getID()] = id;

            $menuItem = $("<li><a href='#' id='" + id + "'> <span class='menu-name'>" + name + "</span></a></li>");
            $menuItem.click(createExecMenuFunc(command));
            $(command).on("enabledStateChange", this.handleEnabledChanged)
                .on("checkedStateChange", this.handleCheckedChanged)
                .data("command", command);


            if (keyBindings) {
                if (!$.isArray(keyBindings)) {
                    keyBindings = [{key: keyBindings}];
                }

                var key, i, platform;
                for (i = 0; i < keyBindings.length; i++) {
                    key = keyBindings[i].key;
                    platform = keyBindings[i].platform;

                    // TODO: handle insertion position as specified by relativeID, position
                    // also support inserting into Menu Sections

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
     * Removes MenuItem
     * 
     * TODO Question: for convenience should API provide a way to remove related
     * keybindings and Command object?
     */
    function removeMenuItem(id) {
        // TODO
    }

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
     *      Default is LAST
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
     * Sets the Command that will be execited when the MenuItem is clicked
     * @param {Command}
     */
    MenuItem.prototype.setCommand = function (command) {
        $(_getHTMLMenuItem(this.id)).click(createExecMenuFunc(command));
    };

    /**
     * Returns true if this menuItem is a menu divider
     * @return {boolean}
     */
    MenuItem.prototype.isDivider = function () {
        return this.name === "---";
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


    $(CommandManager).on("nameChange", function (e, command) {
        var id = cmdToMenuMap[command.getID()];
        var $menuItem = $(_getHTMLMenuItem(id)).find(".menu-name").text(command.getName());
    });

    $(CommandManager).on("enabledStateChange", function (e, command) {
        var id = cmdToMenuMap[command.getID()];
        // TODO IMPL
    });

    $(CommandManager).on("checkedStateChange", function (e, command) {
        var id = cmdToMenuMap[command.getID()];
        // TODO IMPL
    });

    function init() {

        /*
         * File menu
         */
        var menu;
        menu = addMenu(Strings.FILE_MENU, appMenuBar.FILE_MENU);
        menu.addMenuItem("file-new",                Commands.FILE_NEW,         "Ctrl-N");
        menu.addMenuItem("file-open",               Commands.FILE_OPEN,        "Ctrl-O");
        menu.addMenuItem("file-open-folder",        Commands.FILE_OPEN_FOLDER);
        menu.addMenuItem("file-close",              Commands.FILE_CLOSE,       "Ctrl-W");
        menu.addMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("file-save",               Commands.FILE_SAVE,        "Ctrl-S");
        menu.addMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("file-live-preview",       Commands.FILE_LIVE_FILE_PREVIEW,
                                                                                                    "Ctrl-Alt-P");
        menu.addMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("file-quit",               Commands.FILE_QUIT,        "Ctrl-Q");

        /*
         * Edit  menu
         */
        menu = addMenu(Strings.EDIT_MENU, appMenuBar.EDIT_MENU);
        menu.addMenuItem("edit-select-all",         Commands.EDIT_SELECT_ALL,   "Ctrl-A");
        menu.addMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("edit-find",               Commands.EDIT_FIND,         "Ctrl-F");
        menu.addMenuItem("edit-find-in-files",      Commands.EDIT_FIND_IN_FILES,
                                                                                                     "Ctrl-Shift-F");
        menu.addMenuItem("edit-find-next",          Commands.EDIT_FIND_NEXT,
                                                                            [{key: "F3",     platform: "win"},
                                                                             {key: "Ctrl-G", platform: "mac"}]);

        menu.addMenuItem("edit-find-previous",      Commands.EDIT_FIND_PREVIOUS,
                                                                            [{key: "Shift-F3",      platform: "win"},
                                                                             {key:  "Ctrl-Shift-G", platform: "mac"}]);

        menu.addMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("edit-repace",             Commands.EDIT_REPLACE,
                                                                            [{key: "Ctrl-H",     platform: "win"},
                                                                             {key: "Ctrl-Alt-F", platform: "mac"}]);
        menu.addMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("edit-duplicate",          Commands.EDIT_DUPLICATE);
        menu.addMenuItem("edit-comment",            Commands.EDIT_LINE_COMMENT, "Ctrl-/");

        /*
         * View menu
         */
        menu = addMenu(Strings.VIEW_MENU, appMenuBar.VIEW_MENU);
        menu.addMenuItem("view-sidebar",            Commands.VIEW_HIDE_SIDEBAR, "Ctrl-Shift-H");
        menu.addMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("view-increase-font",      Commands.VIEW_INCREASE_FONT_SIZE, "Ctrl-=");
        menu.addMenuItem("view-decrease-font",      Commands.VIEW_DECREASE_FONT_SIZE, "Ctrl--");

        /*
         * Navigate menu
         */
        menu = addMenu(Strings.NAVIGATE_MENU, appMenuBar.NAVIGATE_MENU);
        menu.addMenuItem("navigate-quick-open",  Commands.NAVIGATE_QUICK_OPEN,
                                                                                                        "Ctrl-Shift-O");
        menu.addMenuItem("navigate-goto-line",   Commands.NAVIGATE_GOTO_LINE,
                                                                            [{key: "Ctrl-G", platform: "win"},
                                                                             {key: "Ctrl-L", platform: "mac"}]);

        menu.addMenuItem("navigate-goto-symbol", Commands.NAVIGATE_GOTO_DEFINITION,
                                                                                                        "Ctrl-T");
        menu.addMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("navigate-quick-edit",  Commands.SHOW_INLINE_EDITOR,
                                                                                                        "Ctrl-E");
        menu.addMenuItem("navigate-prev-match",  Commands.QUICK_EDIT_PREV_MATCH,
                                                                                                        "Alt-Up");
        menu.addMenuItem("navigate-next-match",  Commands.QUICK_EDIT_NEXT_MATCH,
                                                                                                        "Alt-Down");
        /*
         * Debug menu
         */
        menu = addMenu(Strings.DEBUG_MENU, appMenuBar.DEBUG_MENU);
        menu.addMenuItem("debug-reload-wn",      Commands.DEBUG_REFRESH_WINDOW,
                                                                            [{key: "F5",     platform: "win"},
                                                                             {key: "Ctrl-R", platform:  "mac"}]);

        menu.addMenuItem("debug-dev-tools",      Commands.DEBUG_SHOW_DEVELOPER_TOOLS);
        menu.addMenuItem("debug-run-tests",      Commands.DEBUG_RUN_UNIT_TESTS);
        menu.addMenuItem("debug-enable-jslint",  Commands.DEBUG_JSLINT);
        menu.addMenuItem("debug-perf-data",      Commands.DEBUG_SHOW_PERF_DATA);
        menu.addMenuDivider(_getNextMenuItemDividerID());
        menu.addMenuItem("debug-experiemental",  Commands.NO_OP);
        menu.addMenuItem("debug-new-window",     Commands.DEBUG_NEW_BRACKETS_WINDOW);
        menu.addMenuItem("debug-close-browser",  Commands.DEBUG_CLOSE_ALL_LIVE_BROWSERS);
        menu.addMenuItem("debug-use-tab-chars",  Commands.DEBUG_USE_TAB_CHARS);

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
