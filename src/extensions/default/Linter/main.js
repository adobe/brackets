/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, JSLINT, Handlebars, AppInit, StatusBar, PathUtils */

define(function (require, exports, module) {
    'use strict';

    var CommandManager  = brackets.getModule("command/CommandManager");
    var DocumentManager = brackets.getModule("document/DocumentManager");
    var Menus           = brackets.getModule("command/Menus");
    var EditorManager   = brackets.getModule("editor/EditorManager");
    var Strings         = brackets.getModule("strings");
    var BottomPanel     = brackets.getModule("widgets/BottomPanel");
    var AppInit         = brackets.getModule("utils/AppInit");
    var StatusBar       = brackets.getModule("widgets/StatusBar");
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager");

    //todo: readd scrolling code
    //todo: save enabled settings and update menu

    //todo: move jslint source to Linter extension
    require("../../../thirdparty/jslint/jslint");

    var DOCUMENT_SAVED = "documentSaved";
    var CURRENT_DOCUMENT_CHANGED = "currentDocumentChange";

    var id = "brackets.linter";

    var LINTER = "LINTER";

    var _prefs;
    var command;

    //whether or not linting is enabled
    var enabled = true;

    //whether or not empty lines should be ignore. If false
    //linting will report errors for empty lines
    var ignoreEmptyLines = false;

    //whether errors should be written to the console, in addition to
    //the error panel
    var outputErrorsToConsole = false;

    var statusIcon = $("#gold-star");

    var outputTemplate;
    var currentErrors;

    //precompile the regex.
    var extRegEx = /^(\.js|\.json\.css\.htm|\.html)$/i;

    function _isSupportedExtension(document) {
        var ext = document ? PathUtils.filenameExtension(document.file.fullPath) : "";

        return extRegEx.test(ext);
    }

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

    function _lintRowClickHandler(e) {
        var index = parseInt($(e.currentTarget).data("index"), 10);
        var error = currentErrors[index];

        var editor = EditorManager.getCurrentFullEditor();
        editor.setCursorPos(error.line - 1, error.character - 1);

        EditorManager.focusEditor();
    }

    function _displayLintErrors(errors) {

        currentErrors = errors;

        if (!errors) {

            statusIcon.hide();
            $(".lint-error-row").off("click", _lintRowClickHandler);
            BottomPanel.clearContent();
            //BottomPanel.close();
            return;
        }

        var len = errors.length;

        var i;
        if (outputErrorsToConsole) {
            var error;

            for (i = 0; i < len; i++) {
                error = errors[i];
                console.log(error.line + "\t" + error.reason + "\t" + error.evidence);
            }
        }

        var errorData = [];
        for (i = 0; i < len; i++) {
            errorData.push({error: errors[i], index: i});
        }


        var context = {
            errors: errorData,
            JSLINT_ERRORS: Strings.JSLINT_ERRORS
        };

        if (!outputTemplate) {
            //if the Handlebars template hasnt been compiled yet, compile it
            //and then cache it for future use (for performance).
            require("Handlebars/handlebars");
            var outputTemplateSource = require("text!erroroutput.template");
            outputTemplate = Handlebars.compile(outputTemplateSource);
        }

        var output = $(outputTemplate(context));

        BottomPanel.loadContent(output);
        statusIcon.show();
        $(".lint-error-row").on("click", _lintRowClickHandler);
    }

    /* Runs linting on the specified document, and returns an array of errors found
        by the linter
    */
    function lintDocument(document) {

        if (!_isSupportedExtension(document)) {
            return;
        }

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

    function _initPrefs() {
        _prefs = PreferencesManager.getPreferenceStorage(id, { enabled: true });
        enabled = _prefs.getValue("enabled");
        command.setChecked(enabled);
    }

    function _initMenu() {
        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        menu.addMenuDivider();
        menu.addMenuItem(LINTER);
    }


    function _toggleLinting() {
        enabled = !enabled;

        command.setChecked(enabled);

        _prefs.setValue("enabled", enabled);

        if (enabled) {
            $(DocumentManager).on(DOCUMENT_SAVED + " " + CURRENT_DOCUMENT_CHANGED, _onDocumentUpdated);
        } else {
            $(DocumentManager).off(DOCUMENT_SAVED + " " + CURRENT_DOCUMENT_CHANGED, _onDocumentUpdated);
        }
    }

    //todo: externalize this for localization?
    //todo: What tense should the menu item be?
    command = CommandManager.register("Enable Linting", LINTER, _toggleLinting);

    _initMenu();
    _initPrefs();

    //todo: need to pull preference on whether linting is enabled, and only
    //register for this if it is enabled
    //todo: can we do this on a module loaded event? and not on initialization?
    //do we know document has loaded yet?
    if (enabled) {
        $(DocumentManager).on(DOCUMENT_SAVED + " " + CURRENT_DOCUMENT_CHANGED, _onDocumentUpdated);
        _lintCurrentDocument();
    }

    AppInit.htmlReady(function () {
        StatusBar.addIndicator(id, $("#gold-star"), false);
    });

    exports.lintDocument = lintDocument;
});