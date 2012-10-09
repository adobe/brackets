/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, JSLINT, Handlebars */

define(function (require, exports, module) {
    'use strict';
    
    var CommandManager  = brackets.getModule("command/CommandManager");
    var DocumentManager = brackets.getModule("document/DocumentManager");
    var Menus           = brackets.getModule("command/Menus");
    var EditorManager   = brackets.getModule("editor/EditorManager");
    var Strings         = brackets.getModule("strings");
    var BottomPanel     = brackets.getModule("widgets/BottomPanel");
    
    //todo: should this both run the linter and display results?
    //todo: remove JSLintUtils.js
    
    //todo: move jslint source to Linter extension
    require("../../../thirdparty/jslint/jslint");

    var DOCUMENT_SAVED = "documentSaved";
    var CURRENT_DOCUMENT_CHANGED = "currentDocumentChange";
     
    var LINTER = "LINTER";
    var enabled = true;
    var ignoreEmptyLines = true;
    var outputErrorsToConsole = false;
    
    var outputTemplate;

    function _stripEmptyLines(text) {
        //todo: precompile this regex
        //todo: check this works with multiple line endings
        //return text.replace(/^\s*$[\n\r]{1,}/gm, "");

        //todo: need to find more optimal way to do this. if we use
        //regex above, it works, but then line numbers are off.

        var i, arr = text.split("\n");
        for (i = 0; i < arr.length; i++) {
            if (!arr[i].match(/\S/)) {
                arr[i] = "";
            }
        }
        return arr.join("\n");
    }
    
    function _displayLintErrors(errors) {
        
        if (!errors) {
            BottomPanel.clearContent();
            BottomPanel.close();
            return;
        }
        
        var len = errors.length;

        if (outputErrorsToConsole) {
            var error;
            var i;
            for (i = 0; i < len; i++) {
                error = errors[i];
                console.log(error.line + "\t" + error.reason + "\t" + error.evidence);
            }
        }
        
        var context = {
            errors: errors,
            JSLINT_ERRORS: Strings.JSLINT_ERRORS
        };
    
        if (!outputTemplate) {
            //if the Handlebars template hasnt been compiled yet, compile it
            //and then cache it for future use.
            require("Handlebars/handlebars");
            var outputTemplateSource = require("text!erroroutput.template");
            outputTemplate = Handlebars.compile(outputTemplateSource);
        }
        
        var output = $(outputTemplate(context));
        
        BottomPanel.loadContent(output);
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
    
    function _lintCurrentDocument() {
        var errors = lintDocument(DocumentManager.getCurrentDocument());
        
        _displayLintErrors(errors);
    }
    
    function _onDocumentUpdated(event) {
        _lintCurrentDocument();
    }
    
    function _toggleLinting() {
        enabled = !enabled;
        
        if (enabled) {
            $(DocumentManager).on(DOCUMENT_SAVED + " " + CURRENT_DOCUMENT_CHANGED, _onDocumentUpdated);
        } else {
            $(DocumentManager).off(DOCUMENT_SAVED + " " + CURRENT_DOCUMENT_CHANGED, _onDocumentUpdated);
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
        $(DocumentManager).on(DOCUMENT_SAVED + " " + CURRENT_DOCUMENT_CHANGED, _onDocumentUpdated);
        _lintCurrentDocument();
    }
});