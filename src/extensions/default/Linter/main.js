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
    var ignoreEmptyLines = true;
    
    //todo: should this both run the linter and display results?
    //todo: need to lint file on startup
    //todo: need to lint file on document change
    
    function _stripEmptyLines(text) {
        //todo: precompile this regex
        //todo: check this works with multiple line endings
        return text.replace(/^\s*$[\n\r]{1,}/gm, "");
    }
    
    function lintDocument(document) {
        var text = document.getText();
        
        if (ignoreEmptyLines) {
            text = _stripEmptyLines(text);
        }
        
        var hasErrors = !JSLINT(text, null);
        
        if (!hasErrors) {
            return;
        }
        
        return JSLINT.errors;
    }
    
    function _displayLintErrors(errors) {
        var len = errors.length;

        var error;
        var i;
        for (i = 0; i < len; i++) {
            error = errors[i];
            console.log(error.line + "\t" + error.reason + "\t" + error.evidence);
        }
    }
    
    function _lintCurrentDocument() {
        var errors = lintDocument(DocumentManager.getCurrentDocument());
        
        if (!errors) {
            return;
        }
        
        _displayLintErrors(errors);
    }
    
    function _onDocumentUpdated(event) {
        _lintCurrentDocument();
    }
    
    function _toggleLinting() {
        enabled = !enabled;
        
        if (enabled) {
            $(DocumentManager).on("documentSaved documentChanged", _onDocumentUpdated);
        } else {
            $(DocumentManager).off("documentSaved documentChanged", _onDocumentUpdated);
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
    //todo: can we do this on a module loaded event? and not on initialization?
    //do we know document has loaded yet?
    if (enabled) {
        $(DocumentManager).on("documentSaved documentChanged", _onDocumentUpdated);
        _lintCurrentDocument();
    }
});