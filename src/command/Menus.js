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
/*global define, $, brackets, document */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var Commands                = require("command/Commands"),
        KeyBindingManager       = require("command/KeyBindingManager"),
        Strings                 = require("strings"),
        StringUtils             = require("utils/StringUtils"),
        CommandManager          = require("command/CommandManager");

    /**
     * Brackets Application Menu Constants
     * @enum {string}
     */
    var AppMenuBar = {
        FILE_MENU:     "file-menu",
        EDIT_MENU:     "edit-menu",
        VIEW_MENU :    "view-menu",
        NAVIGATE_MENU: "navigate-menu",
        DEBUG_MENU:    "debug-menu"
    };


    /**
     * Brackets Application Menu Section Constants
     * It is preferred that plug-ins specify the location of new MenuItems
     * in terms of a menu section rather than a specific MenuItem. This provides
     * looser coupling to Bracket's internal MenuItems and makes menu organization
     * more semantic. 
     * Use these constants as the "relativeID" parameter when calling addMenuItem() and
     * specify a position of FIRST or LAST.
     */
    var MenuSection = {
        FILE_OPEN_CLOSE_MENU:       "file-open-close-menu-section",
        FILE_SAVE_MENU:             "file-save-menu-section",
        FILE_LIVE_MENU:             "file-live-menu-section",

        EDIT_MODIFY_SELECTION_MENU: "edit-modify-selection-menu-section",
        EDIT_FIND_MENU:             "find-menu-section",
        EDIT_REPLACE_MENU:          "replace-menu-section",
        EDIT_SELECTED_TEXT_COMMANDS: "selected-text-commands-menu-group",

        NAVIGATE_GOTO_MENU:         "goto-menu-section",
        NAVIGATE_QUICK_EDIT_MENU:   "quick-edit-menu-section"
    };
    
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
      * Other constants
      */
    var DIVIDER = "---";

    /**
     * Maps menuID's to Menu objects
     * @type {Object.<string, Menu>}
     */
    var menuMap = {};

    /**
     * Maps menuItemID's to MenuItem objects
     * @type {Object.<string, MenuItem>}
     */
    var menuItemMap = {};
    
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
        return $("#" + id).get(0);
    }

    function _getHTMLMenuItem(id) {
        return $("#" + id).get(0);
    }
    
    function _addKeyBindingToMenuItem($menuItem, key, displayKey) {
        var $shortcut = $menuItem.find(".menu-shortcut");
        
        if ($shortcut.length === 0) {
            $shortcut = $("<span class='menu-shortcut'/>");
            $menuItem.append($shortcut);
        }
        
        $shortcut.data("key", key);
        $shortcut.text(KeyBindingManager.formatKeyDescriptor(displayKey));
    }
    
    function _addExistingKeyBinding(menuItem) {
        var bindings = KeyBindingManager.getKeyBindings(menuItem.getCommand().getID()),
            binding = null;
        
        if (bindings.length > 0) {
            // add the latest key binding
            binding = bindings[bindings.length - 1];
            _addKeyBindingToMenuItem($(_getHTMLMenuItem(menuItem.id)), binding.key, binding.displayKey);
        }
        
        return binding;
    }
    
    /** NOT IMPLEMENTED
     * Removes MenuItem
     * 
     * TODO Question: for convenience should API provide a way to remove related
     * keybindings and Command object?
     */
    // function removeMenuItem(id) {
    //    NOT IMPLEMENTED
    // }

    var _menuDividerIDCount = 1;
    function _getNextMenuItemDividerID() {
        return "brackets-menuDivider-" + _menuDividerIDCount++;
    }

    // Help function for inserting elements into a list
    function _insertInList($list, $element, position, $relativeElement) {
        // Determine where to insert. Default is LAST.
        var inserted = false;
        if (position) {
            if (position === FIRST) {
                $list.prepend($element);
                inserted = true;
            } else if ($relativeElement && $relativeElement.length > 0) {
                if (position === AFTER) {
                    $relativeElement.after($element);
                    inserted = true;
                } else if (position === BEFORE) {
                    $relativeElement.before($element);
                    inserted = true;
                }
            }
        }

        // Default to LAST
        if (!inserted) {
            $list.append($element);
        }
    }

    /**
     * @constructor
     * @private
     *
     * MenuItem represents a single menu item that executes a Command or a menu divider. MenuItems
     * may have a sub-menu. A MenuItem may correspond to an HTML-based
     * menu item or a native menu item if Brackets is running in a native application shell
     *
     * Since MenuItems may have a native implementation clients should create MenuItems through 
     * addMenuItem() and should NOT construct a MenuItem object directly. 
     * Clients should also not access HTML content of a menu directly and instead use
     * the MenuItem API to query and modify menus items.
     *
     * MenuItems are views on to Command objects so modify the underlying Command to modify the
     * name, enabled, and checked state of a MenuItem. The MenuItem will update automatically
     *
     * @param {string} id
     * @param {string|Command} command - the Command this MenuItem will reflect.
     *                                   Use DIVIDER to specify a menu divider
     */
    function MenuItem(id, command) {
        this.id = id;
        this.isDivider = (command === DIVIDER);

        if (!this.isDivider) {
            // Bind event handlers
            this._enabledChanged = this._enabledChanged.bind(this);
            this._checkedChanged = this._checkedChanged.bind(this);
            this._nameChanged = this._nameChanged.bind(this);
            this._keyBindingAdded = this._keyBindingAdded.bind(this);
            this._keyBindingRemoved = this._keyBindingRemoved.bind(this);

            this._command = command;
            $(this._command)
                .on("enabledStateChange", this._enabledChanged)
                .on("checkedStateChange", this._checkedChanged)
                .on("nameChange", this._nameChanged)
                .on("keyBindingAdded", this._keyBindingAdded)
                .on("keyBindingRemoved", this._keyBindingRemoved);
        }
    }

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
     * @param {!string | Command} command - the command the menu will execute.
     *      Use DIVIDER for a menu divider
     * @param {?string | Array.<{key: string, platform: string}>}  keyBindings - register one
     *      one or more key bindings to associate with the supplied command.
     * @param {?string} position - constant defining the position of new the MenuItem relative
     *      to other MenuItems. Default is LAST.  (see Insertion position constants). 
     * @param {?string} relativeID - id of menuItem, sub-menu, or menu section that the new 
     *      menuItem will be positioned relative to. Required when position is 
     *      AFTER or BEFORE, ignored when position is FIRST or LAST
     *
     * @return {MenuItem} the newly created MenuItem
     */
    Menu.prototype.addMenuItem = function (id, command, keyBindings, position, relativeID) {
        var $menuItem,
            $link,
            menuItem,
            name,
            commandID;

        if (!id || !command) {
            throw new Error("addMenuItem(): missing required parameters. id: " + id);
        }

        if (menuItemMap[id]) {
            throw new Error("MenuItem added with same id of existing MenuItem: " + id);
        }

        if (typeof (command) === "string") {
            if (command === DIVIDER) {
                name = DIVIDER;
            } else {
                commandID = command;
                command = CommandManager.get(commandID);
                if (!command) {
                    throw new Error("addMenuItem(): commandID not found: " + commandID);
                }
                name = command.getName();
            }
        }

        // create MenuItem
        menuItem = new MenuItem(id, command);
        menuItemMap[id] = menuItem;

        // create MenuItem DOM
        if (name === DIVIDER) {
            $menuItem = $("<li><hr class='divider'></li>");
        } else {
            // Create the HTML Menu
            $menuItem = $("<li><a href='#' id='" + id + "'> <span class='menu-name'></span></a></li>");

            $menuItem.on("click", function () {
                menuItem._command.execute();
            });
        }

        // Insert menu item
        var $relativeElement = relativeID && $(_getHTMLMenuItem(relativeID)).closest("li");
        _insertInList($("#main-toolbar li#" + this.id + " > ul.dropdown-menu"), $menuItem, position, $relativeElement);

        // Initialize MenuItem state
        if (!menuItem.isDivider) {
            if (keyBindings) {
                // Add key bindings. The MenuItem listens to the Command object to update MenuItem DOM with shortcuts.
                if (!$.isArray(keyBindings)) {
                    keyBindings = [keyBindings];
                }
                
                // Note that keyBindings passed during MenuItem creation take precedent over any existing key bindings
                KeyBindingManager.addBinding(commandID, keyBindings);
            } else {
                // Look for existing key bindings
                _addExistingKeyBinding(menuItem, commandID);
            }

            menuItem._checkedChanged();
            menuItem._enabledChanged();
            menuItem._nameChanged();
        }

        return menuItem;
    };

    /**
     * Inserts divider item in menu.
     * @param {?string} position - constant defining the position of new the divider relative
     *      to other MenuItems. Default is LAST.  (see Insertion position constants). 
     * @param {?string} relativeID - id of menuItem, sub-menu, or menu section that the new 
     *      divider will be positioned relative to. Required when position is 
     *      AFTER or BEFORE, ignored when position is FIRST or LAST.
     * 
     * @return {MenuItem} the newly created divider
     */
    Menu.prototype.addMenuDivider = function (position, relativeID) {
        return this.addMenuItem(_getNextMenuItemDividerID(), DIVIDER, position, relativeID);
    };

    /**
     * NOT IMPLEMENTED
     * Alternative JSON based API to addMenuItem()
     * 
     * All properties are required unless noted as optional.
     *
     * @param { Array.<{
     *              id:         string,
     *              command:    string | Command,
     *              ?bindings:   string | Array.<{key: string, platform: string}>,
     *          }>} jsonStr
     *        }
     * @param {?string} position - constant defining the position of new the MenuItem relative
     *      to other MenuItems. Default is LAST.  (see Insertion position constants). 
     * @param {?string} relativeID - id of menuItem, sub-menu, or menu section that the new 
     *      menuItem will be positioned relative to. Required when position is 
     *      AFTER or BEFORE, ignored when position is FIRST or LAST.
     *
     * @return {MenuItem} the newly created MenuItem
     */
    // Menu.prototype.createMenuItemsFromJSON = function (jsonStr, position, relativeID) {
    //     NOT IMPLEMENTED
    // };


    /**
     * NOT IMPLEMENTED
     * @param {!string} text displayed in menu item
     * @param {!string} id
     * @param {?string} position - constant defining the position of new the MenuItem relative
     *      to other MenuItems. Default is LAST.  (see Insertion position constants) 
     * @param {?string} relativeID - id of menuItem, sub-menu, or menu section that the new 
     *      menuItem will be positioned relative to. Required when position is 
     *      AFTER or BEFORE, ignored when position is FIRST or LAST.
     * 
     * @return {MenuItem} newly created menuItem for sub-menu
     */
    // MenuItem.prototype.createSubMenu = function (text, id, position, relativeID) {
    //     NOT IMPLEMENTED
    // };

    /**
     * Gets the Command associated with a MenuItem
     * @return {Command}
     */
    MenuItem.prototype.getCommand = function () {
        return this._command;
    };

    /**
     * NOT IMPLEMENTED
     * Returns the parent MenuItem if the menu item is a sub-menu, returns null otherwise.
     * @return {MenuItem}
     */
    // MenuItem.prototype.getParentMenuItem = function () {
    //     NOT IMPLEMENTED;
    // };

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
    
    /**
     * Synchronizes MenuItem checked state with underlying Command checked state
     */
    MenuItem.prototype._checkedChanged = function () {
        var checked = this._command.getChecked();
        // Note, checked can also be undefined, so we explicitly check
        // for truthiness and don't use toggleClass().
        if (checked) {
            $(_getHTMLMenuItem(this.id)).addClass("checked");
        } else {
            $(_getHTMLMenuItem(this.id)).removeClass("checked");
        }
    };

    /**
     * Synchronizes MenuItem enabled state with underlying Command enabled state
     */
    MenuItem.prototype._enabledChanged = function () {
        $(_getHTMLMenuItem(this.id)).toggleClass("disabled", !this._command.getEnabled());
    };

    /**
     * Synchronizes MenuItem name with underlying Command name
     */
    MenuItem.prototype._nameChanged = function () {
        $(_getHTMLMenuItem(this.id)).find(".menu-name").text(this._command.getName());
    };
    
    /**
     * @private
     * Updates MenuItem DOM with a keyboard shortcut label
     */
    MenuItem.prototype._keyBindingAdded = function (event, keyBinding) {
        _addKeyBindingToMenuItem($(_getHTMLMenuItem(this.id)), keyBinding.key, keyBinding.displayKey);
    };
    
    /**
     * @private
     * Updates MenuItem DOM to remove keyboard shortcut label
     */
    MenuItem.prototype._keyBindingRemoved = function (event, keyBinding) {
        var $shortcut = $(_getHTMLMenuItem(this.id)).find(".menu-shortcut");
        
        if ($shortcut.length > 0 && $shortcut.data("key") === keyBinding.key) {
            // check for any other bindings
            if (_addExistingKeyBinding(this) === null) {
                $shortcut.empty();
            }
        }
    };
    
    /**
     * Adds a top-level menu to the application menu bar which may be native or HTML-based.
     *
     * @param {!string} name - display text for menu 
     * @param {!string} id
     * @param {?string} position - constant defining the position of new the Menu relative
     *  to other Menus. Default is LAST (see Insertion position constants).
     *      
     * @param {?string} relativeID - id of Menu the new Menu will be positioned relative to. Required
     *      when position is AFTER or BEFORE, ignored when position is FIRST or LAST
     * 
     * @return {Menu} the newly created Menu
     */
    function addMenu(name, id, position, relativeID) {
        name = StringUtils.htmlEscape(name);
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

        // Insert menu
        var $relativeElement = relativeID && $(_getHTMLMenu(relativeID));
        _insertInList($menubar, $newMenu, position, $relativeElement);

        // todo error handling

        return menu;
    }

    /** NOT IMPLEMENTED
     * Removes Menu
     */
    // function removeMenu(id) {
    //     NOT IMPLEMENTED
    // }


    function init() {

        /*
         * File menu
         */
        var menu;
        menu = addMenu(Strings.FILE_MENU, AppMenuBar.FILE_MENU);
        menu.addMenuItem("menu-file-new",                Commands.FILE_NEW,         "Ctrl-N");
        menu.addMenuItem("menu-file-open",               Commands.FILE_OPEN,        "Ctrl-O");
        menu.addMenuItem("menu-file-open-folder",        Commands.FILE_OPEN_FOLDER);
        menu.addMenuItem("menu-file-close",              Commands.FILE_CLOSE,       "Ctrl-W");
        menu.addMenuDivider();
        menu.addMenuItem("menu-file-save",               Commands.FILE_SAVE,        "Ctrl-S");
        menu.addMenuDivider();
        menu.addMenuItem("menu-file-live-preview",       Commands.FILE_LIVE_FILE_PREVIEW,
                                                                                                    "Ctrl-Alt-P");
        menu.addMenuDivider();
        menu.addMenuItem("menu-file-quit",               Commands.FILE_QUIT,        "Ctrl-Q");

        /*
         * Edit  menu
         */
        menu = addMenu(Strings.EDIT_MENU, AppMenuBar.EDIT_MENU);
        menu.addMenuItem("menu-edit-select-all",         Commands.EDIT_SELECT_ALL,   "Ctrl-A");
        menu.addMenuDivider();
        menu.addMenuItem("menu-edit-find",               Commands.EDIT_FIND,         "Ctrl-F");
        menu.addMenuItem("menu-edit-find-in-files",      Commands.EDIT_FIND_IN_FILES,
                                                                                                     "Ctrl-Shift-F");
        menu.addMenuItem("menu-edit-find-next",          Commands.EDIT_FIND_NEXT,
                                                                            [{key: "F3",     platform: "win"},
                                                                             {key: "Ctrl-G", platform: "mac"}]);

        menu.addMenuItem("menu-edit-find-previous",      Commands.EDIT_FIND_PREVIOUS,
                                                                            [{key: "Shift-F3",      platform: "win"},
                                                                             {key:  "Ctrl-Shift-G", platform: "mac"}]);

        menu.addMenuDivider();
        menu.addMenuItem("menu-edit-replace",             Commands.EDIT_REPLACE,
                                                                            [{key: "Ctrl-H",     platform: "win"},
                                                                             {key: "Ctrl-Alt-F", platform: "mac"}]);
        menu.addMenuDivider();
        menu.addMenuItem("menu-edit-duplicate",          Commands.EDIT_DUPLICATE, "Ctrl-D");
        menu.addMenuItem("menu-edit-comment",            Commands.EDIT_LINE_COMMENT, "Ctrl-/");

        /*
         * View menu
         */
        menu = addMenu(Strings.VIEW_MENU, AppMenuBar.VIEW_MENU);
        menu.addMenuItem("menu-view-sidebar",            Commands.VIEW_HIDE_SIDEBAR, "Ctrl-Shift-H");
        menu.addMenuDivider();
        menu.addMenuItem("menu-view-increase-font",      Commands.VIEW_INCREASE_FONT_SIZE, [{key: "Ctrl-=", displayKey: "Ctrl-+"}]);
        menu.addMenuItem("menu-view-decrease-font",      Commands.VIEW_DECREASE_FONT_SIZE, [{key: "Ctrl--", displayKey: "Ctrl-\u2212"}]);

        /*
         * Navigate menu
         */
        menu = addMenu(Strings.NAVIGATE_MENU, AppMenuBar.NAVIGATE_MENU);
        menu.addMenuItem("menu-navigate-quick-open",  Commands.NAVIGATE_QUICK_OPEN,
                                                                                                        "Ctrl-Shift-O");
        menu.addMenuItem("menu-navigate-goto-line",   Commands.NAVIGATE_GOTO_LINE,
                                                                            [{key: "Ctrl-G", platform: "win"},
                                                                             {key: "Ctrl-L", platform: "mac"}]);

        menu.addMenuItem("menu-navigate-goto-symbol", Commands.NAVIGATE_GOTO_DEFINITION,
                                                                                                        "Ctrl-T");
        menu.addMenuDivider();
        menu.addMenuItem("menu-navigate-quick-edit",  Commands.SHOW_INLINE_EDITOR,
                                                                                                        "Ctrl-E");
        menu.addMenuItem("menu-navigate-prev-match",  Commands.QUICK_EDIT_PREV_MATCH,
                                                                                                        {key: "Alt-Up", displayKey: "Alt-\u2191"});
        menu.addMenuItem("menu-navigate-next-match",  Commands.QUICK_EDIT_NEXT_MATCH,
                                                                                                        {key: "Alt-Down", displayKey: "Alt-\u2193"});
        /*
         * Debug menu
         */
        menu = addMenu(Strings.DEBUG_MENU, AppMenuBar.DEBUG_MENU);
        menu.addMenuItem("menu-debug-reload-wn",      Commands.DEBUG_REFRESH_WINDOW,
                                                                            [{key: "F5",     platform: "win"},
                                                                             {key: "Ctrl-R", platform:  "mac"}]);

        menu.addMenuItem("menu-debug-dev-tools",      Commands.DEBUG_SHOW_DEVELOPER_TOOLS);
        menu.addMenuItem("menu-debug-run-tests",      Commands.DEBUG_RUN_UNIT_TESTS);
        menu.addMenuItem("menu-debug-enable-jslint",  Commands.DEBUG_JSLINT);
        menu.addMenuItem("menu-debug-perf-data",      Commands.DEBUG_SHOW_PERF_DATA);
        menu.addMenuDivider();
        menu.addMenuItem("menu-debug-experiemental",  Commands.DEBUG_EXPERIMENTAL);
        menu.addMenuItem("menu-debug-new-window",     Commands.DEBUG_NEW_BRACKETS_WINDOW);
        menu.addMenuItem("menu-debug-close-browser",  Commands.DEBUG_CLOSE_ALL_LIVE_BROWSERS);
        menu.addMenuItem("menu-debug-use-tab-chars",  Commands.DEBUG_USE_TAB_CHARS);
        
        // Prevent clicks on the top-level menu bar from taking focus
        // Note, bootstrap handles this already for the menu drop downs 
        $(document).on("mousedown", "#main-toolbar .dropdown", function (e) {
            e.preventDefault();
        });
        
        // Switch menus when the mouse enters an adjacent menu
        // Only open the menu if another one has already been opened
        // by clicking
        $(document).on("mouseenter", "#main-toolbar .dropdown", function (e) {
            var open = $(this).siblings(".open");
            if (open.length > 0) {
                open.removeClass("open");
                $(this).addClass("open");
            }
        });
    }

    // Define public API
    exports.init = init;
    exports.AppMenuBar = AppMenuBar;
    exports.MenuSection = MenuSection;
    exports.BEFORE = BEFORE;
    exports.AFTER = AFTER;
    exports.LAST = LAST;
    exports.FIRST = FIRST;
    exports.DIVIDER = DIVIDER;
    exports.getMenu = getMenu;
    exports.getMenuItem = getMenuItem;
    exports.addMenu = addMenu;
    exports.Menu = Menu;
    exports.MenuItem = MenuItem;
});
