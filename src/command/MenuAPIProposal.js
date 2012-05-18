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


/*
Sprint 9 Menu and keyboard shortcuts API Proposal

For some background info here is the story card for this task:
https://trello.com/card/5-extensibility-menus-and-keyboard-shortcuts/4f90a6d98f77505d7940ce88/461

Criteria

    Current menus continue to function
    New Menu API
        Define top-level menu and items
        Way to maintain toggle state
        Insert-at command
        Plan for adding native menu support in the future
    New Keyboard API
        Define key binding for a command
        Define multiple key bindings for a single command
    Report key binding conflicts to console
    Wiki page with menu UI guidelines (draft)
    No performance tests needed for this story

Out Of Scope

    Sub-menus
    Cannot remove existing menu / items
    Cannot remove key bindings
    Enable/disable menu
    Cannot change menu label
    No Windows-style mnemonic support


*/

/***********************************************************************
 *
 * MENU API PROPOSAL
 *
 ***********************************************************************/


    /**
     * Brackets menu Constants
     */
     var FILE_MENU      = "file-menu";
     var EDIT_MENU      = "edit-menu";
     var VIEW_MENU      = "view-menu";
     var NAVIGATE_MENU  = "navigate-menu";
     var DEBUG_MENU     = "debug-menu";



    // Note, for now the functions getMenu(), getMenuItem(), and createMenu() all refer to menus in the application menu bar
    // in the future the API will be expanded to describe context menus and menus attached to other pieces of UI like popup menu buttons.

    /**
     * Retrieves the Menu object for the corresponding id. 
     * The Menu may be represented by a HTML or native menu.
     * @param {string} menuId
     * @return {Menu}
     */
    function getMenu(id)

    /**
     * Retrieves the MenuItem object for the corresponding id. 
     * The MenuItem may be represented by a HTML or native menu.
     * @param {string} menuItemId
     * @return {MenuItem}
     */
    function  getMenuItem(id)

    /**
     * @param {!string} text displayed in menu 
     * @param {!string} id
     * @param {?Object.<relativeId: string, relativePos: string>} position 
     *      relative position can be: "first", "last", "after", or "before". relativeID is required for "before" and "after"
     * 
     * @return {Menu}
     */
    function createMenu(text, id, relativeMenuID)

    // Separate creation from insertion
    // make insertion o top level menus and submodule

    /**
     * @constructor
     * @private
     *
     * Menu represents a top-level menu in the menu bar. A Menu may correspond to an HTML-based
     * menu or a native menu if Brackets is running in a native application shell. 
     * 
     * Since menus may have a native implementation clients should create Menus through 
     * createMenu() and should not construct a Menu object directly. 
     * Clients should also not access HTML content of a menu directly and instead use
     * the Menu API to query and modify menus.
     *
     * Menu dispatches the following events:
     *  show
     *  hide
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
     * createMenuItem() and should not construct a MenuITem object directly. 
     * Clients should also not access HTML content of a menu directly and instead use
     * the MenuItem API to query and modify menus items.
     *
     * Menu dispatches the following events:
     *  click
     *  rollout
     *  rollover
     *  hide
     *  show
     *
     */
    function MenuItem(id) {
        this.id = id;
    }

    /**
     * Returns id of parent MenuItem if the menu item is a sub-menu, returns null otherwise
     * @return {string} parentMenuItemId
     */
    MenuItem.prototype = getParentMenuItem()

    /**
     * Returns id of parent Menu
     * @return {string} parentMenuId
     */
    MenuItem.prototype = getParentMenu(id)


    /**
     * @param {!string} text - display text for menu item. "---" creates a menu divider
     * @param {!string} id
     * @param {?string} commandStr
     * @param {string | Array.<{key: string, platform: string}>}  keyBindings
     * @param {?Object.<
                       before:      string - menuItemID, 
                       after:       string - menuItemID,
                       selected:    boolean,
                       enabled:     boolean,
                       visible:     boolean, 
                       icon:        string>,
                       click:       function(event),
                       rollout:     function(event),
                       rollover:    function(event),
                       hide:        function(event)
                       show:        function(event)>} attributes
     *
     * @return {Menu}
     */
    Menu.prototype.createMenuItem = function (text, id, commandStr, keyBindings, attributes)

    /**
     * Alternative JSON based API to createMenuItem()
     *
     * @param { Object.<
                name: string,
     *          id: string,
     *          command: string,
     *          bindings: ({key: string, platform: string}|Array.<{key: string, platform: string}>) },
     *          selected:   boolean,
     *          enabled:     boolean,
     *          visible:     boolean, 
     *          icon:        string>,
     *          click:       function(event),
     *          rollout:     function(event),
     *          rollover:    function(event),
     *          hide:        function(event),
     *          show:        function(event)>} jsonStr
                >
     *        }
     */
    Menu.prototype.createMenuFromJSON = function (jsonStr)

    /**
     * Inserts divider item in menu
     * @param {?Object.<relativeId: string, relativePos: string>} position 
     *      relative position can be: "first", "last", "after", or "before". relativeID is required for "before" and "after"
     * 
     * @return {Menu}
     */
    Menu.prototype.createMenuDivider = function (position)

    /**
     * @param {!string} text displayed in menu item
     * @param {!string} id
     * @param {?Object.<relativeId: string, relativePos: string>} position 
     *      relative position can be: "first", "last", "after", or "before". relativeID is required for "before" and "after"
     * 
     * @return {MenuItem} newly created menuItem for sub-menu
     */
    MenuItem.prototype = function createSubMenu(text, id, relativeMenuID)

    /**
     * Used to set or get keybindings for a MenuItem
     * 
     * Replaces existing key bindings of menu with new ones when called with a keyBindings parameter.
     * Takes care of keepingKeyBindingManager in sync
     *
     * @param {?({key: string, platform: string}|Array.<{key: string, platform: string}>)} keyBindings
     * @return ({key: string, platform: string}|Array.<{key: string, platform: string}>)} keyBindings
     */


    // Getter/Setters
    MenuItem.prototype = function bindings(bindings)
    MenuItem.prototype = function name(name)
    MenuItem.prototype = function command(comand)
    MenuItem.prototype = function attributes(attributes)





/***********************************************************************
 *
 * Menu API Example Usage
 *
 ***********************************************************************/

    // 1) Brackets core creating internal File menu, and menu items, and divider
     Menus.createMenu("File", Menus.FILE_MENU)
            .createMenuItem("New",          "file-new-menu"         Commands.FILE_NEW,          "Ctrl-N")
            .createMenuItem("Open",         "file-open-menu"        Commands.FILE_OPEN,         "Ctrl-O")
            .createMenuItem("Open Folder",  "file-open-folder-menu" Commands.FILE_OPEN_FOLDER)
            .createMenuDivider()
            .createMenuItem("Save",         "file-save-menu"        Commands.FILE_SAVE,         "Ctrl-S");

    // 2) Same menu being constructed with JSON API alternative
    Menus.createMenu("File", Menus.FILE_MENU)
        .createMenuFromJSON(
            {
                { name: "New",          id: "file-new-menu",     command: Commands.FILE_NEW,        bindings: "Ctrl-N" },
                { name: "Open",         id: "file-new-menu",     command: Commands.FILE_OPEN,       bindings: "Ctrl-O" },
                { name: "Open Folder",  id: "file-new-menu",     command: Commands.FILE_OPEN_FOLDER,
                { name: "---"}
                { name: "Save",         id: "file-new-menu",     command: Commands.FILE_SAVE,       bindings: "Ctrl-S" }
            }
        );

    // 3) Plugin adding new top level menu after Brackets Edit menu
    Menus.createMenu("MyCustomMenu", myplugin.MY_CUSTOM_MENU, Menus.EDIT_MENU);


    // 4) Examples showing how to position new menus
    // new menuItem is inserted at the end of the Edit menu
    Menus.getMenu(EDIT_MENU)
            createMenuItem("my Menu",   "mymenuid"         myplugin.MY_NEW_COMMAND );

    // new menuItem is inserted BEFORE menuXXX
    Menus.getMenu(EDIT_MENU)
            createMenuItem("my Menu",   "mymenuid"         myplugin.MY_NEW_COMMAND, { before: menuXXX } );

    // new menuItem is inserted AFTER menuXXX
    Menus.getMenu(EDIT_MENU)
            createMenuItem("my Menu",   "mymenuid"         myplugin.MY_NEW_COMMAND, { after: menuXXX } );
   



    // 5) Adding menu with platform specific key bindings
    Menus.getMenu(Menus.EDIT_MENU)
        .createMenuItem("Find Next", "find-next-menu-id",           Commands.EDIT_FIND_NEXT),
                            [{key: "F3",     platform: "win"},
                             {key: "Ctrl-G", platform: "mac"}]);


    // 6) Plugin adding menu item to existing Brackets menu
    //
    // Note, there are two mays to make clicking a menu do something in Brackets. The menu can be bound to
    // a commmand via a command string constant, or a "click" event listener can be added that calls a function
    // directly. It is generally recommend to use the command string approach since loosely couples the menu
    // with the command it calls.

    // Preferred Method of binding functionality to a menu command. Menu and command are loosely coupled
    CommandManager.register(myplugin.MY_NEW_COMMAND, myNewCommandFunc );
    Menus.getMenu("Menus.FILE_MENU")
        .createMenuItem("MyNewCommand",  "mypluginname-my-new-command-menu"  myplugin.MY_NEW_COMMAND, "Ctrl-Shift-X");

    // Binding functionality to a menu command through events. Menu and command are tightly coupled
    Menus.getMenu("Menus.FILE_MENU")
        .createMenuItem("MyNewCommand",  "mypluginname-my-new-command-menu", null, "Ctrl-Shift-X",
                {
                    click: function () { myNewCommandFunc() }
                });

    // 7) Managing selection state of a menu
    // assigns event listener via "attributes" object
    Menus.createMenu("MyCustomMenu", myplugin.MY_CUSTOM_MENU, Menus.EDIT_MENU,
        {
            selected: true,
            show: function () { this.attributes{selected: computeMySelectedState() }
        });
    // ALTERNATIVE: add event listener directly to menu
    Menus.getMenu(myplugin.MY_CUSTOM_MENU).on("show", function () {
        this.attributes{selected: computeMySelectedState()
    });



    // 8) Set menu attributes
    menuItem.attributes( {selected: true} );
    menuItem.name("New Name");

    // 9) Get attributes
    var selectedState = menuItem.attributes().selected;


    // 10) Key binding examples
    // Adding binding to command after menu creation
    KeyBindingManager.addBinding(myplugin.MY_COMMAND, "Cmd-[" );

    // Adding multiple bindings
    KeyBindingManager.addBinding(myplugin.MY_COMMAND, ["Cmd-[", "Cmd-LeftArrow"] );

    // Adding platform specific key bindings
    KeyBindingManager.addBinding( myplugin.MY_COMMAND,
                                    [{key: "F5",     platform: "win"},
                                    {key: "Cmd-R",   platform: "mac"}]));

    // Get all key bindings
    var keyMap = KeyBindingManager.getKeymap();

    // Change all key bindings
    KeyBindingManager.installKeymap(keymap);