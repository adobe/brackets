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
    
    require("../../../thirdparty/jslint/jslint");
    
    //todo: do this on first use
    require("Handlebars/handlebars");
    var outputTemplateSource = require("text!erroroutput.template");
    var outputTemplate = Handlebars.compile(outputTemplateSource);

    var LINTER = "LINTER";
    var enabled = true;
    var ignoreEmptyLines = true;
    var outputErrorsToConsole = false;
    
    
    //todo: should this both run the linter and display results?
    //todo: need to lint file on startup
    //todo: need to lint file on document change
    //todo: move jslint source to Linter extension
    //todo: remove JSLintUtils.js

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
    
        var output = $(outputTemplate(context));
        
        /*
        $("#bottom-panel").empty();
        $("#bottom-panel").append(output);
        $("#bottom-panel").show();
        */
        
        BottomPanel.loadContent(output);
    }
    
    function _lintCurrentDocument() {
        var errors = lintDocument(DocumentManager.getCurrentDocument());
        
        if (!errors) {
            console.log("no errors clearing content");
            BottomPanel.clearContent();
            BottomPanel.close();
            return;
        }
        
        _displayLintErrors(errors);
    }
    
    function _onDocumentUpdated(event) {
        console.log("updated");
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
        $(DocumentManager).on("documentSaved currentDocumentChange", _onDocumentUpdated);
        _lintCurrentDocument();
    }
});