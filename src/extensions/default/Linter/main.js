/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window, brackets, Element, document */

define(function (require, exports, module) {
    'use strict';
    
    var CommandManager  = brackets.getModule("command/CommandManager");
    var Menus           = brackets.getModule("command/Menus");
    
    var LINTER = "LINTER";
    
    //todo: should this both run the linter and display results?
    
    function run() {
        //todo: should this return?
    }
    
    function _toggleLinting() {
    }
    
    CommandManager.register("Enable Linting", LINTER, _toggleLinting);
    
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuDivider();
    menu.addMenuItem(LINTER);
    
    exports.run = run;
});