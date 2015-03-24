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
/*global define, $, brackets, window */

define(function (require, exports, module) {
    "use strict";

    var _ = require("thirdparty/lodash");

    // Load dependent modules
    var Commands            = require("command/Commands"),
        EventDispatcher     = require("utils/EventDispatcher"),
        KeyBindingManager   = require("command/KeyBindingManager"),
        StringUtils         = require("utils/StringUtils"),
        CommandManager      = require("command/CommandManager"),
        PopUpManager        = require("widgets/PopUpManager"),
        ViewUtils           = require("utils/ViewUtils"),
        DeprecationWarning  = require("utils/DeprecationWarning");

    // make sure the global brackets variable is loaded
    require("utils/Global");

    /**
     * Brackets Application Menu Constants
     * @enum {string}
     */
    var AppMenuBar = {
        FILE_MENU       : "file-menu",
        EDIT_MENU       : "edit-menu",
        FIND_MENU       : "find-menu",
        VIEW_MENU       : "view-menu",
        NAVIGATE_MENU   : "navigate-menu",
        HELP_MENU       : "help-menu"
    };

    /**
     * Brackets Context Menu Constants
     * @enum {string}
     */
    var ContextMenuIds = {
        EDITOR_MENU:                    "editor-context-menu",
        INLINE_EDITOR_MENU:             "inline-editor-context-menu",
        PROJECT_MENU:                   "project-context-menu",
        WORKING_SET_CONTEXT_MENU:       "workingset-context-menu",
        WORKING_SET_CONFIG_MENU:        "workingset-configuration-menu",
        SPLITVIEW_MENU:                 "splitview-menu"
    };

    /**
     * Brackets Application Menu Section Constants
     * It is preferred that plug-ins specify the location of new MenuItems
     * in terms of a menu section rather than a specific MenuItem. This provides
     * looser coupling to Bracket's internal MenuItems and makes menu organization
     * more semantic.
     * Use these constants as the "relativeID" parameter when calling addMenuItem() and
     * specify a position of FIRST_IN_SECTION or LAST_IN_SECTION.
     *
     * Menu sections are denoted by dividers or the beginning/end of a menu
     */
    var MenuSection = {
        // Menu Section                     Command ID to mark the section
        FILE_OPEN_CLOSE_COMMANDS:           {sectionMarker: Commands.FILE_NEW},
        FILE_SAVE_COMMANDS:                 {sectionMarker: Commands.FILE_SAVE},
        FILE_LIVE:                          {sectionMarker: Commands.FILE_LIVE_FILE_PREVIEW},
        FILE_EXTENSION_MANAGER:             {sectionMarker: Commands.FILE_EXTENSION_MANAGER},

        EDIT_UNDO_REDO_COMMANDS:            {sectionMarker: Commands.EDIT_UNDO},
        EDIT_TEXT_COMMANDS:                 {sectionMarker: Commands.EDIT_CUT},
        EDIT_SELECTION_COMMANDS:            {sectionMarker: Commands.EDIT_SELECT_ALL},
        EDIT_MODIFY_SELECTION:              {sectionMarker: Commands.EDIT_INDENT},
        EDIT_COMMENT_SELECTION:             {sectionMarker: Commands.EDIT_LINE_COMMENT},
        EDIT_CODE_HINTS_COMMANDS:           {sectionMarker: Commands.SHOW_CODE_HINTS},
        EDIT_TOGGLE_OPTIONS:                {sectionMarker: Commands.TOGGLE_CLOSE_BRACKETS},
        
        FIND_FIND_COMMANDS:                 {sectionMarker: Commands.CMD_FIND},
        FIND_FIND_IN_COMMANDS:              {sectionMarker: Commands.CMD_FIND_IN_FILES},
        FIND_REPLACE_COMMANDS:              {sectionMarker: Commands.CMD_REPLACE},
        
        VIEW_HIDESHOW_COMMANDS:             {sectionMarker: Commands.VIEW_HIDE_SIDEBAR},
        VIEW_FONTSIZE_COMMANDS:             {sectionMarker: Commands.VIEW_INCREASE_FONT_SIZE},
        VIEW_TOGGLE_OPTIONS:                {sectionMarker: Commands.TOGGLE_ACTIVE_LINE},

        NAVIGATE_GOTO_COMMANDS:             {sectionMarker: Commands.NAVIGATE_QUICK_OPEN},
        NAVIGATE_DOCUMENTS_COMMANDS:        {sectionMarker: Commands.NAVIGATE_NEXT_DOC},
        NAVIGATE_OS_COMMANDS:               {sectionMarker: Commands.NAVIGATE_SHOW_IN_FILE_TREE},
        NAVIGATE_QUICK_EDIT_COMMANDS:       {sectionMarker: Commands.TOGGLE_QUICK_EDIT},
        NAVIGATE_QUICK_DOCS_COMMANDS:       {sectionMarker: Commands.TOGGLE_QUICK_DOCS}
    };


    /**
     * Insertion position constants
     * Used by addMenu(), addMenuItem(), and addSubMenu() to
     * specify the relative position of a newly created menu object
     * @enum {string}
     */
    var BEFORE           = "before",
        AFTER            = "after",
        FIRST            = "first",
        LAST             = "last",
        FIRST_IN_SECTION = "firstInSection",
        LAST_IN_SECTION  = "lastInSection";

    /**
     * Other constants
     */
    var DIVIDER = "---";

    /**
     * Error Codes from Brackets Shell
     * @enum {number}
     */
    var NO_ERROR           = 0,
        ERR_UNKNOWN        = 1,
        ERR_INVALID_PARAMS = 2,
        ERR_NOT_FOUND      = 3;

    /**
     * Maps menuID's to Menu objects
     * @type {Object.<string, Menu>}
     */
    var menuMap = {};

    /**
     * Maps contextMenuID's to ContextMenu objects
     * @type {Object.<string, ContextMenu>}
     */
    var contextMenuMap = {};

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
     * Retrieves the map of all Menu objects.
     * @return {Object.<string, Menu>}
     */
    function getAllMenus() {
        return menuMap;
    }

    /**
     * Retrieves the ContextMenu object for the corresponding id.
     * @param {string} id
     * @return {ContextMenu}
     */
    function getContextMenu(id) {
        return contextMenuMap[id];
    }

    /**
     * Check whether a ContextMenu exists for the given id.
     * @param {string} id
     * @return {boolean}
     */
    function _isContextMenu(id) {
        return !!getContextMenu(id);
    }

    function _isHTMLMenu(id) {
        return (!brackets.nativeMenus || _isContextMenu(id));
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
        return $("#" + StringUtils.jQueryIdEscape(id)).get(0);
    }

    function _getHTMLMenuItem(id) {
        return $("#" + StringUtils.jQueryIdEscape(id)).get(0);
    }

    function _addKeyBindingToMenuItem($menuItem, key, displayKey) {
        var $shortcut = $menuItem.find(".menu-shortcut");

        if ($shortcut.length === 0) {
            $shortcut = $("<span class='menu-shortcut' />");
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

    var _menuDividerIDCount = 1;
    function _getNextMenuItemDividerID() {
        return "brackets-menuDivider-" + _menuDividerIDCount++;
    }

    // Help function for inserting elements into a list
    function _insertInList($list, $element, position, $relativeElement) {
        // Determine where to insert. Default is LAST.
        var inserted = false;
        if (position) {

            // Adjust relative position for menu section positions since $relativeElement
            // has already been resolved by _getRelativeMenuItem() to a menuItem
            if (position === FIRST_IN_SECTION) {
                position = BEFORE;
            } else if (position === LAST_IN_SECTION) {
                position = AFTER;
            }

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
     * @constructor
     * @private
     *
     * @param {string} id
     * @param {string|Command} command - the Command this MenuItem will reflect.
     *                                   Use DIVIDER to specify a menu divider
     */
    function MenuItem(id, command) {
        this.id = id;
        this.isDivider = (command === DIVIDER);
        this.isNative = false;

        if (!this.isDivider) {
            // Bind event handlers
            this._enabledChanged = this._enabledChanged.bind(this);
            this._checkedChanged = this._checkedChanged.bind(this);
            this._nameChanged = this._nameChanged.bind(this);
            this._keyBindingAdded = this._keyBindingAdded.bind(this);
            this._keyBindingRemoved = this._keyBindingRemoved.bind(this);

            this._command = command;
            this._command
                .on("enabledStateChange", this._enabledChanged)
                .on("checkedStateChange", this._checkedChanged)
                .on("nameChange", this._nameChanged)
                .on("keyBindingAdded", this._keyBindingAdded)
                .on("keyBindingRemoved", this._keyBindingRemoved);
        }
    }

    /**
     * Menu represents a top-level menu in the menu bar. A Menu may correspond to an HTML-based
     * menu or a native menu if Brackets is running in a native application shell.
     *
     * Since menus may have a native implementation clients should create Menus through
     * addMenu() and should NOT construct a Menu object directly.
     * Clients should also not access HTML content of a menu directly and instead use
     * the Menu API to query and modify menus.
     *
     * @constructor
     * @private
     *
     * @param {string} id
     */
    function Menu(id) {
        this.id = id;
    }

    Menu.prototype._getMenuItemId = function (commandId) {
        return (this.id + "-" + commandId);
    };

    /**
     * Determine MenuItem in this Menu, that has the specified command
     *
     * @param {Command} command - the command to search for.
     * @return {?HTMLLIElement} menu item list element
     */
    Menu.prototype._getMenuItemForCommand = function (command) {
        if (!command) {
            return null;
        }
        var foundMenuItem = menuItemMap[this._getMenuItemId(command.getID())];
        if (!foundMenuItem) {
            return null;
        }
        return $(_getHTMLMenuItem(foundMenuItem.id)).closest("li");
    };

    /**
     * Determine relative MenuItem
     *
     * @param {?string} relativeID - id of command (future: sub-menu).
     * @param {?string} position - only needed when relativeID is a MenuSection
     * @return {?HTMLLIElement} menu item list element
     */
    Menu.prototype._getRelativeMenuItem = function (relativeID, position) {
        var $relativeElement;
        
        if (relativeID) {
            if (position === FIRST_IN_SECTION || position === LAST_IN_SECTION) {
                if (!relativeID.hasOwnProperty("sectionMarker")) {
                    console.error("Bad Parameter in _getRelativeMenuItem(): relativeID must be a MenuSection when position refers to a menu section");
                    return null;
                }

                // Determine the $relativeElement by traversing the sibling list and
                // stop at the first divider found
                // TODO: simplify using nextUntil()/prevUntil()
                var $sectionMarker = this._getMenuItemForCommand(CommandManager.get(relativeID.sectionMarker));
                if (!$sectionMarker) {
                    console.error("_getRelativeMenuItem(): MenuSection " + relativeID.sectionMarker +
                                  " not found in Menu " + this.id);
                    return null;
                }
                var $listElem = $sectionMarker;
                $relativeElement = $listElem;
                while (true) {
                    $listElem = (position === FIRST_IN_SECTION ? $listElem.prev() : $listElem.next());
                    if ($listElem.length === 0) {
                        break;
                    } else if ($listElem.find(".divider").length > 0) {
                        break;
                    } else {
                        $relativeElement = $listElem;
                    }
                }

            } else {
                if (relativeID.hasOwnProperty("sectionMarker")) {
                    console.error("Bad Parameter in _getRelativeMenuItem(): if relativeID is a MenuSection, position must be FIRST_IN_SECTION or LAST_IN_SECTION");
                    return null;
                }

                // handle FIRST, LAST, BEFORE, & AFTER
                var command = CommandManager.get(relativeID);
                if (command) {
                    // Lookup Command for this Command id
                    // Find MenuItem that has this command
                    $relativeElement = this._getMenuItemForCommand(command);
                }
                if (!$relativeElement) {
                    console.error("_getRelativeMenuItem(): MenuItem with Command id " + relativeID +
                                  " not found in Menu " + this.id);
                    return null;
                }
            }

            return $relativeElement;

        } else if (position && position !== FIRST && position !== LAST) {
            console.error("Bad Parameter in _getRelativeMenuItem(): relative position specified with no relativeID");
            return null;
        }

        return $relativeElement;
    };

    /**
     * Removes the specified menu item from this Menu. Key bindings are unaffected; use KeyBindingManager
     * directly to remove key bindings if desired.
     *
     * @param {!string | Command} command - command the menu would execute if we weren't deleting it.
     */
    Menu.prototype.removeMenuItem = function (command) {
        var menuItemID,
            commandID;

        if (!command) {
            console.error("removeMenuItem(): missing required parameters: command");
            return;
        }

        if (typeof (command) === "string") {
            var commandObj = CommandManager.get(command);
            if (!commandObj) {
                console.error("removeMenuItem(): command not found: " + command);
                return;
            }

            commandID = command;
        } else {
            commandID = command.getID();
        }
        menuItemID = this._getMenuItemId(commandID);

        if (_isHTMLMenu(this.id)) {
            // Targeting parent to get the menu item <a> and the <li> that contains it
            $(_getHTMLMenuItem(menuItemID)).parent().remove();
        } else {
            brackets.app.removeMenuItem(commandID, function (err) {
                if (err) {
                    console.error("removeMenuItem() -- command not found: " + commandID + " (error: " + err + ")");
                }
            });
        }

        delete menuItemMap[menuItemID];
    };

    /**
     * Removes the specified menu divider from this Menu.
     *
     * @param {!string} menuItemID - the menu item id of the divider to remove.
     */
    Menu.prototype.removeMenuDivider = function (menuItemID) {
        var menuItem,
            $HTMLMenuItem;

        if (!menuItemID) {
            console.error("removeMenuDivider(): missing required parameters: menuItemID");
            return;
        }

        menuItem = getMenuItem(menuItemID);

        if (!menuItem) {
            console.error("removeMenuDivider(): parameter menuItemID: %s is not a valid menu item id", menuItemID);
            return;
        }

        if (!menuItem.isDivider) {
            console.error("removeMenuDivider(): parameter menuItemID: %s is not a menu divider", menuItemID);
            return;
        }

        if (_isHTMLMenu(this.id)) {
            // Targeting parent to get the menu divider <hr> and the <li> that contains it
            $HTMLMenuItem = $(_getHTMLMenuItem(menuItemID)).parent();
            if ($HTMLMenuItem) {
                $HTMLMenuItem.remove();
            } else {
                console.error("removeMenuDivider(): HTML menu divider not found: %s", menuItemID);
                return;
            }
        } else {
            brackets.app.removeMenuItem(menuItem.dividerId, function (err) {
                if (err) {
                    console.error("removeMenuDivider() -- divider not found: %s (error: %s)", menuItemID, err);
                }
            });
        }

        if (!menuItemMap[menuItemID]) {
            console.error("removeMenuDivider(): menu divider not found in menuItemMap: %s", menuItemID);
            return;
        }

        delete menuItemMap[menuItemID];
    };

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
     * @param {!string | Command} command - the command the menu will execute.
     *      Pass Menus.DIVIDER for a menu divider, or just call addMenuDivider() instead.
     * @param {?string | Array.<{key: string, platform: string}>}  keyBindings - register one
     *      one or more key bindings to associate with the supplied command.
     * @param {?string} position - constant defining the position of new MenuItem relative to
     *      other MenuItems. Values:
     *          - With no relativeID, use Menus.FIRST or LAST (default is LAST)
     *          - Relative to a command id, use BEFORE or AFTER (required)
     *          - Relative to a MenuSection, use FIRST_IN_SECTION or LAST_IN_SECTION (required)
     * @param {?string} relativeID - command id OR one of the MenuSection.* constants. Required
     *      for all position constants except FIRST and LAST.
     *
     * @return {MenuItem} the newly created MenuItem
     */
    Menu.prototype.addMenuItem = function (command, keyBindings, position, relativeID) {
        var menuID = this.id,
            id,
            $menuItem,
            menuItem,
            name,
            commandID;
        
        if (!command) {
            console.error("addMenuItem(): missing required parameters: command");
            return null;
        }

        if (typeof (command) === "string") {
            if (command === DIVIDER) {
                name = DIVIDER;
                commandID = _getNextMenuItemDividerID();
            } else {
                commandID = command;
                command = CommandManager.get(commandID);
                if (!command) {
                    console.error("addMenuItem(): commandID not found: " + commandID);
                    return null;
                }
                name = command.getName();
            }
        } else {
            commandID = command.getID();
            name = command.getName();
        }

        // Internal id is the a composite of the parent menu id and the command id.
        id = this._getMenuItemId(commandID);

        if (menuItemMap[id]) {
            console.log("MenuItem added with same id of existing MenuItem: " + id);
            return null;
        }

        // create MenuItem
        menuItem = new MenuItem(id, command);
        menuItemMap[id] = menuItem;

        // create MenuItem DOM
        if (_isHTMLMenu(this.id)) {
            if (name === DIVIDER) {
                $menuItem = $("<li><hr class='divider' id='" + id + "' /></li>");
            } else {
                // Create the HTML Menu
                $menuItem = $("<li><a href='#' id='" + id + "'> <span class='menu-name'></span></a></li>");

                $menuItem.on("click", function () {
                    menuItem._command.execute();
                });
            }

            // Insert menu item
            var $relativeElement = this._getRelativeMenuItem(relativeID, position);
            _insertInList($("li#" + StringUtils.jQueryIdEscape(this.id) + " > ul.dropdown-menu"),
                          $menuItem, position, $relativeElement);
        } else {
            var bindings = KeyBindingManager.getKeyBindings(commandID),
                binding,
                bindingStr = "",
                displayStr = "";

            if (bindings && bindings.length > 0) {
                binding = bindings[bindings.length - 1];
                bindingStr = binding.displayKey || binding.key;
            }

            if (bindingStr.length > 0) {
                displayStr = KeyBindingManager.formatKeyDescriptor(bindingStr);
            }

            if (position === FIRST_IN_SECTION || position === LAST_IN_SECTION) {
                if (!relativeID.hasOwnProperty("sectionMarker")) {
                    console.error("Bad Parameter in _getRelativeMenuItem(): relativeID must be a MenuSection when position refers to a menu section");
                    return null;
                }

                // For sections, pass in the marker for that section.
                relativeID = relativeID.sectionMarker;
            }

            brackets.app.addMenuItem(this.id, name, commandID, bindingStr, displayStr, position, relativeID, function (err) {
                switch (err) {
                case NO_ERROR:
                    break;
                case ERR_INVALID_PARAMS:
                    console.error("addMenuItem(): Invalid Parameters when adding the command " + commandID);
                    break;
                case ERR_NOT_FOUND:
                    console.error("_getRelativeMenuItem(): MenuItem with Command id " + relativeID + " not found in the Menu " + menuID);
                    break;
                default:
                    console.error("addMenuItem(); Unknown Error (" + err + ") when adding the command " + commandID);
                }
            });
            menuItem.isNative = true;
        }

        // Initialize MenuItem state
        if (menuItem.isDivider) {
            menuItem.dividerId = commandID;
        } else {
            if (keyBindings) {
                // Add key bindings. The MenuItem listens to the Command object to update MenuItem DOM with shortcuts.
                if (!Array.isArray(keyBindings)) {
                    keyBindings = [keyBindings];
                }
            }

            // Note that keyBindings passed during MenuItem creation take precedent over any existing key bindings
            KeyBindingManager.addBinding(commandID, keyBindings);

            // Look for existing key bindings
            _addExistingKeyBinding(menuItem, commandID);

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
     *      divider will be positioned relative to. Required for all position constants
     *      except FIRST and LAST
     *
     * @return {MenuItem} the newly created divider
     */
    Menu.prototype.addMenuDivider = function (position, relativeID) {
        return this.addMenuItem(DIVIDER, "", position, relativeID);
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
        var checked = !!this._command.getChecked();
        if (this.isNative) {
            var enabled = !!this._command.getEnabled();
            brackets.app.setMenuItemState(this._command.getID(), enabled, checked, function (err) {
                if (err) {
                    console.log("Error setting menu item state: " + err);
                }
            });
        } else {
            ViewUtils.toggleClass($(_getHTMLMenuItem(this.id)), "checked", checked);
        }
    };

    /**
     * Synchronizes MenuItem enabled state with underlying Command enabled state
     */
    MenuItem.prototype._enabledChanged = function () {
        if (this.isNative) {
            var enabled = !!this._command.getEnabled();
            var checked = !!this._command.getChecked();
            brackets.app.setMenuItemState(this._command.getID(), enabled, checked, function (err) {
                if (err) {
                    console.log("Error setting menu item state: " + err);
                }
            });
        } else {
            ViewUtils.toggleClass($(_getHTMLMenuItem(this.id)), "disabled", !this._command.getEnabled());
        }
    };

    /**
     * Synchronizes MenuItem name with underlying Command name
     */
    MenuItem.prototype._nameChanged = function () {
        if (this.isNative) {
            brackets.app.setMenuTitle(this._command.getID(), this._command.getName(), function (err) {
                if (err) {
                    console.log("Error setting menu title: " + err);
                }
            });
        } else {
            $(_getHTMLMenuItem(this.id)).find(".menu-name").text(this._command.getName());
        }
    };

    /**
     * @private
     * Updates MenuItem DOM with a keyboard shortcut label
     */
    MenuItem.prototype._keyBindingAdded = function (event, keyBinding) {
        if (this.isNative) {
            var shortcutKey = keyBinding.displayKey || keyBinding.key;
            brackets.app.setMenuItemShortcut(this._command.getID(), shortcutKey, KeyBindingManager.formatKeyDescriptor(shortcutKey), function (err) {
                if (err) {
                    console.error("Error setting menu item shortcut: " + err);
                }
            });
        } else {
            _addKeyBindingToMenuItem($(_getHTMLMenuItem(this.id)), keyBinding.key, keyBinding.displayKey);
        }
    };

    /**
     * @private
     * Updates MenuItem DOM to remove keyboard shortcut label
     */
    MenuItem.prototype._keyBindingRemoved = function (event, keyBinding) {
        if (this.isNative) {
            brackets.app.setMenuItemShortcut(this._command.getID(), "", "", function (err) {
                if (err) {
                    console.error("Error setting menu item shortcut: " + err);
                }
            });
        } else {
            var $shortcut = $(_getHTMLMenuItem(this.id)).find(".menu-shortcut");

            if ($shortcut.length > 0 && $shortcut.data("key") === keyBinding.key) {
                // check for any other bindings
                if (_addExistingKeyBinding(this) === null) {
                    $shortcut.empty();
                }
            }
        }
    };

    /**
     * Closes all menus that are open
     */
    function closeAll() {
        $(".dropdown").removeClass("open");
    }

    /**
     * Adds a top-level menu to the application menu bar which may be native or HTML-based.
     *
     * @param {!string} name - display text for menu
     * @param {!string} id - unique identifier for a menu.
     *      Core Menus in Brackets use a simple  title as an id, for example "file-menu".
     *      Extensions should use the following format: "author.myextension.mymenuname".
     * @param {?string} position - constant defining the position of new the Menu relative
     *  to other Menus. Default is LAST (see Insertion position constants).
     *
     * @param {?string} relativeID - id of Menu the new Menu will be positioned relative to. Required
     *      when position is AFTER or BEFORE, ignored when position is FIRST or LAST
     *
     * @return {?Menu} the newly created Menu
     */
    function addMenu(name, id, position, relativeID) {
        name = _.escape(name);
        var $menubar = $("#titlebar .nav"),
            menu;

        if (!name || !id) {
            console.error("call to addMenu() is missing required parameters");
            return null;
        }

        // Guard against duplicate menu ids
        if (menuMap[id]) {
            console.log("Menu added with same name and id of existing Menu: " + id);
            return null;
        }

        menu = new Menu(id);
        menuMap[id] = menu;

        if (!_isHTMLMenu(id)) {
            brackets.app.addMenu(name, id, position, relativeID, function (err) {
                switch (err) {
                case NO_ERROR:
                    // Make sure name is up to date
                    brackets.app.setMenuTitle(id, name, function (err) {
                        if (err) {
                            console.error("setMenuTitle() -- error: " + err);
                        }
                    });
                    break;
                case ERR_UNKNOWN:
                    console.error("addMenu(): Unknown Error when adding the menu " + id);
                    break;
                case ERR_INVALID_PARAMS:
                    console.error("addMenu(): Invalid Parameters when adding the menu " + id);
                    break;
                case ERR_NOT_FOUND:
                    console.error("addMenu(): Menu with command " + relativeID + " could not be found when adding the menu " + id);
                    break;
                default:
                    console.error("addMenu(): Unknown Error (" + err + ") when adding the menu " + id);
                }
            });
            return menu;
        }

        var $toggle = $("<a href='#' class='dropdown-toggle' data-toggle='dropdown'>" + name + "</a>"),
            $popUp = $("<ul class='dropdown-menu'></ul>"),
            $newMenu = $("<li class='dropdown' id='" + id + "'></li>").append($toggle).append($popUp);

        // Insert menu
        var $relativeElement = relativeID && $(_getHTMLMenu(relativeID));
        _insertInList($menubar, $newMenu, position, $relativeElement);

        // Install ESC key handling
        PopUpManager.addPopUp($popUp, closeAll, false);

        // todo error handling

        return menu;
    }

    /**
     * Removes a top-level menu from the application menu bar which may be native or HTML-based.
     *
     * @param {!string} id - unique identifier for a menu.
     *      Core Menus in Brackets use a simple title as an id, for example "file-menu".
     *      Extensions should use the following format: "author.myextension.mymenuname".
     */
    function removeMenu(id) {
        var menu,
            commandID = "";

        if (!id) {
            console.error("removeMenu(): missing required parameter: id");
            return;
        }

        if (!menuMap[id]) {
            console.error("removeMenu(): menu id not found: %s", id);
            return;
        }

        // Remove all of the menu items in the menu
        menu = getMenu(id);
        
        _.forEach(menuItemMap, function (value, key) {
            if (key.substring(0, id.length) === id) {
                if (value.isDivider) {
                    menu.removeMenuDivider(key);
                } else {
                    commandID = value.getCommand();
                    menu.removeMenuItem(commandID);
                }
            }
        });

        if (_isHTMLMenu(id)) {
            $(_getHTMLMenu(id)).remove();
        } else {
            brackets.app.removeMenu(id, function (err) {
                if (err) {
                    console.error("removeMenu() -- id not found: " + id + " (error: " + err + ")");
                }
            });
        }

        delete menuMap[id];
    }

    /**
     * Represents a context menu that can open at a specific location in the UI.
     *
     * Clients should not create this object directly and should instead use registerContextMenu()
     * to create new ContextMenu objects.
     *
     * Context menus in brackets may be HTML-based or native so clients should not reach into
     * the HTML and should instead manipulate ContextMenus through the API.
     *
     * Events:
     * - beforeContextMenuOpen
     * - beforeContextMenuClose
     *
     * @constructor
     * @extends {Menu}
     */
    function ContextMenu(id) {
        Menu.apply(this, arguments);

        var $newMenu = $("<li class='dropdown context-menu' id='" + StringUtils.jQueryIdEscape(id) + "'></li>"),
            $popUp = $("<ul class='dropdown-menu'></ul>"),
            $toggle = $("<a href='#' class='dropdown-toggle' data-toggle='dropdown'></a>").hide();

        // assemble the menu fragments
        $newMenu.append($toggle).append($popUp);

        // insert into DOM
        $("#context-menu-bar > ul").append($newMenu);

        var self = this;
        PopUpManager.addPopUp($popUp,
            function () {
                self.close();
            },
            false);

        // Listen to ContextMenu's beforeContextMenuOpen event to first close other popups
        PopUpManager.listenToContextMenu(this);
    }
    ContextMenu.prototype = Object.create(Menu.prototype);
    ContextMenu.prototype.constructor = ContextMenu;
    ContextMenu.prototype.parentClass = Menu.prototype;
    EventDispatcher.makeEventDispatcher(ContextMenu.prototype);


    /**
     * Displays the ContextMenu at the specified location and dispatches the
     * "beforeContextMenuOpen" event.The menu location may be adjusted to prevent
     * clipping by the browser window. All other menus and ContextMenus will be closed
     * bofore a new menu is shown.
     *
     * @param {MouseEvent | {pageX:number, pageY:number}} mouseOrLocation - pass a MouseEvent
     *      to display the menu near the mouse or pass in an object with page x/y coordinates
     *      for a specific location.
     */
    ContextMenu.prototype.open = function (mouseOrLocation) {

        if (!mouseOrLocation || !mouseOrLocation.hasOwnProperty("pageX") || !mouseOrLocation.hasOwnProperty("pageY")) {
            console.error("ContextMenu open(): missing required parameter");
            return;
        }

        var $window = $(window),
            escapedId = StringUtils.jQueryIdEscape(this.id),
            $menuAnchor = $("#" + escapedId),
            $menuWindow = $("#" + escapedId + " > ul"),
            posTop  = mouseOrLocation.pageY,
            posLeft = mouseOrLocation.pageX;

        // only show context menu if it has menu items
        if ($menuWindow.children().length <= 0) {
            return;
        }

        this.trigger("beforeContextMenuOpen");

        // close all other dropdowns
        closeAll();

        // adjust positioning so menu is not clipped off bottom or right
        var elementRect = {
                top:    posTop,
                left:   posLeft,
                height: $menuWindow.height() + 25,
                width:  $menuWindow.width()
            },
            clip = ViewUtils.getElementClipSize($window, elementRect);
        
        if (clip.bottom > 0) {
            posTop = Math.max(0, posTop - clip.bottom);
        }
        posTop -= 30;   // shift top for hidden parent element
        posLeft += 5;

        
        if (clip.right > 0) {
            posLeft = Math.max(0, posLeft - clip.right);
        }
        
        // open the context menu at final location
        $menuAnchor.addClass("open")
                   .css({"left": posLeft, "top": posTop});
    };


    /**
     * Closes the context menu.
     */
    ContextMenu.prototype.close = function () {
        this.trigger("beforeContextMenuClose");
        $("#" + StringUtils.jQueryIdEscape(this.id)).removeClass("open");
    };

    /**
     * Detect if current context menu is already open
     */
    ContextMenu.prototype.isOpen = function () {
        return $("#" + StringUtils.jQueryIdEscape(this.id)).hasClass("open");
    };


    /**
     * Associate a context menu to a DOM element.
     * This static function take care of registering event handlers for the click event
     * listener and passing the right "position" object to the Context#open method
     */
    ContextMenu.assignContextMenuToSelector = function (selector, cmenu) {
        $(selector).on("click", function (e) {
            var buttonOffset,
                buttonHeight;

            e.stopPropagation();

            if (cmenu.isOpen()) {
                cmenu.close();
            } else {
                buttonOffset = $(this).offset();
                buttonHeight = $(this).outerHeight();
                cmenu.open({
                    pageX: buttonOffset.left,
                    pageY: buttonOffset.top + buttonHeight
                });
            }
        });
    };


    /**
     * Registers new context menu with Brackets.

     * Extensions should generally use the predefined context menus built into Brackets. Use this
     * API to add a new context menu to UI that is specific to an extension.
     *
     * After registering  a new context menu clients should:
     *      - use addMenuItem() to add items to the context menu
     *      - call open() to show the context menu.
     *      For example:
     *      $("#my_ID").contextmenu(function (e) {
     *          if (e.which === 3) {
     *              my_cmenu.open(e);
     *          }
     *      });
     *
     * To make menu items be contextual to things like selection, listen for the "beforeContextMenuOpen"
     * to make changes to Command objects before the context menu is shown. MenuItems are views of
     * Commands, which control a MenuItem's name, enabled state, and checked state.
     *
     * @param {string} id - unique identifier for context menu.
     *      Core context menus in Brackets use a simple title as an id.
     *      Extensions should use the following format: "author.myextension.mycontextmenu name"
     * @return {?ContextMenu} the newly created context menu
     */
    function registerContextMenu(id) {
        if (!id) {
            console.error("call to registerContextMenu() is missing required parameters");
            return null;
        }

        // Guard against duplicate menu ids
        if (contextMenuMap[id]) {
            console.log("Context Menu added with same name and id of existing Context Menu: " + id);
            return null;
        }

        var cmenu = new ContextMenu(id);
        contextMenuMap[id] = cmenu;
        return cmenu;
    }

    // Deprecated menu ids
    DeprecationWarning.deprecateConstant(ContextMenuIds, "WORKING_SET_MENU", "WORKING_SET_CONTEXT_MENU");
    DeprecationWarning.deprecateConstant(ContextMenuIds, "WORKING_SET_SETTINGS_MENU", "WORKING_SET_CONFIG_MENU");
    
    // Define public API
    exports.AppMenuBar = AppMenuBar;
    exports.ContextMenuIds = ContextMenuIds;
    exports.MenuSection = MenuSection;
    exports.BEFORE = BEFORE;
    exports.AFTER = AFTER;
    exports.LAST = LAST;
    exports.FIRST = FIRST;
    exports.FIRST_IN_SECTION = FIRST_IN_SECTION;
    exports.LAST_IN_SECTION = LAST_IN_SECTION;
    exports.DIVIDER = DIVIDER;
    exports.getMenu = getMenu;
    exports.getAllMenus = getAllMenus;
    exports.getMenuItem = getMenuItem;
    exports.getContextMenu = getContextMenu;
    exports.addMenu = addMenu;
    exports.removeMenu = removeMenu;
    exports.registerContextMenu = registerContextMenu;
    exports.closeAll = closeAll;
    exports.Menu = Menu;
    exports.MenuItem = MenuItem;
    exports.ContextMenu = ContextMenu;
});
