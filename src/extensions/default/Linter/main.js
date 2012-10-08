/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, JSLINT */

define(function (require, exports, module) {
    'use strict';
    
    require("../../../thirdparty/jslint/jslint");
    
    var CommandManager  = brackets.getModule("command/CommandManager");
    var DocumentManager = brackets.getModule("document/DocumentManager");
    var Menus           = brackets.getModule("command/Menus");
    
    var LINTER = "LINTER";
    var enabled = true;
    
    //todo: should this both run the linter and display results?
    //todo: need to lint file on startup
    //todo: need to lint file on document change
    
    function _onDocumentSaved(event) {
        var text = DocumentManager.getCurrentDocument().getText();
        
        var hasErrors = !JSLINT(text, null);
        
        if (!hasErrors) {
            return;
        }
 
        var errors = JSLINT.errors;
        var len = errors.length;

        var error;
        var i;
        for (i = 0; i < len; i++) {
            error = errors[i];
            console.log(error.line + "\t" + error.reason + "\t" + error.evidence);
        }
    }
    
    function _toggleLinting() {
        enabled = !enabled;
        
        if (enabled) {
            $(DocumentManager).on("documentSaved", _onDocumentSaved);
        } else {
            $(DocumentManager).off("documentSaved", _onDocumentSaved);
        }
    }
    
    //todo: externalize this for localization?
    //todo: What tense should the menu item be?
    CommandManager.register("Enable Linting", LINTER, _toggleLinting);
    
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuDivider();
    menu.addMenuItem(LINTER);

    //todo: need to pull preference on whether linting is enabled, and only
    //register for this if it is enabled
    $(DocumentManager).on("documentSaved", _onDocumentSaved);
});