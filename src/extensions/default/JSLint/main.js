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
/*global define, $, JSLINT, Mustache, brackets */

/**
 * Allows JSLint to run on the current document and report results in a UI panel.
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent non-module scripts
    require("thirdparty/jslint/jslint");
    
    // Load dependent modules
    var Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Menus                   = brackets.getModule("command/Menus"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        EditorManager           = brackets.getModule("editor/EditorManager"),
        LanguageManager         = brackets.getModule("language/LanguageManager"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        PerfUtils               = brackets.getModule("utils/PerfUtils"),
        Strings                 = brackets.getModule("strings"),
        StringUtils             = brackets.getModule("utils/StringUtils"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        Resizer                 = brackets.getModule("utils/Resizer"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        StatusBar               = brackets.getModule("widgets/StatusBar"),
        Dialogs                 = brackets.getModule("widgets/Dialogs"),
        JSLintTemplate          = require("text!htmlContent/bottom-panel.html"),
        ResultsTemplate         = require("text!htmlContent/results-table.html");
    
    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));
    
    var INDICATOR_ID = "JSLintStatus",
        defaultPrefs = { enabled: true, directive: "" },
        lintPrefs = "";

    
    /** @const {string} JSLint commands ID */
    var TOGGLE_ENABLED   = "jslint.toggleEnabled";
    var GOTO_FIRST_ERROR = "jslint.gotoFirstError";
    var DEFAULT_PREFS    = "jslint.defaultPrefs";
    
    /**
     * @private
     * @type {PreferenceStorage}
     */
    var _prefs = null;
    
    /**
     * @private
     * @type {boolean}
     */
    var _enabled = true;
    
    /**
     * @private
     * @type {$.Element}
     */
    var $lintResults;
    
    /**
     * @private
     * @type {boolean}
     */
    var _gotoEnabled = false;
    
    /**
     * Enable or disable the "Go to First JSLint Error" command
     * @param {boolean} gotoEnabled Whether it is enabled.
     */
    function setGotoEnabled(gotoEnabled) {
        CommandManager.get(GOTO_FIRST_ERROR).setEnabled(gotoEnabled);
        _gotoEnabled = gotoEnabled;
    }
    
    /**
     * Run JSLint on the current document. Reports results to the main UI. Displays
     * a gold star when no errors are found.
     */
    function run() {
        var currentDoc = DocumentManager.getCurrentDocument();
        
        var perfTimerDOM,
            perfTimerLint;
        
        var language = currentDoc ? LanguageManager.getLanguageForPath(currentDoc.file.fullPath) : "";
        
        if (_enabled && language && language.getId() === "javascript") {
            perfTimerLint = PerfUtils.markStart("JSLint linting:\t" + (!currentDoc || currentDoc.file.fullPath));
            var text = currentDoc.getText();
            
            // If a line contains only whitespace, remove the whitespace
            // This should be doable with a regexp: text.replace(/\r[\x20|\t]+\r/g, "\r\r");,
            // but that doesn't work.
            var i, arr = text.split("\n");
            for (i = 0; i < arr.length; i++) {
                if (!arr[i].match(/\S/)) {
                    arr[i] = "";
                }
            }
            text = arr.join("\n");
            
            var result = JSLINT(text, lintPrefs); // Set browser:true by default

            PerfUtils.addMeasurement(perfTimerLint);
            perfTimerDOM = PerfUtils.markStart("JSLint DOM:\t" + (!currentDoc || currentDoc.file.fullPath));
            
            if (!result) {
                // Remove the null errors for the template
                var errors = JSLINT.errors.filter(function (err) { return err !== null; });
                var html   = Mustache.render(ResultsTemplate, {reportList: errors});
                var $selectedRow;

                $lintResults.find(".table-container")
                    .empty()
                    .append(html)
                    .scrollTop(0)  // otherwise scroll pos from previous contents is remembered
                    .on("click", function (e) {
                        if ($selectedRow) {
                            $selectedRow.removeClass("selected");
                        }
        
                        $selectedRow  = $(e.target).closest("tr");
                        $selectedRow.addClass("selected");
                        var lineTd    = $selectedRow.find("td.line");
                        var line      = lineTd.text();
                        var character = lineTd.data("character");
        
                        var editor = EditorManager.getCurrentFullEditor();
                        editor.setCursorPos(line - 1, character - 1, true);
                        EditorManager.focusEditor();
                    });
                
                $lintResults.show();
                if (JSLINT.errors.length === 1) {
                    StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-errors", Strings.JSLINT_ERROR_INFORMATION);
                } else {
                    // Return the number of non-null errors
                    var numberOfErrors = errors.length;
                    // If there was a null value it means there was a stop notice and an indeterminate
                    // upper bound on the number of JSLint errors, which we'll represent by appending a '+'
                    if (numberOfErrors !== JSLINT.errors.length) {
                        // First discard the stop notice
                        numberOfErrors -= 1;
                        numberOfErrors += "+";
                    }
                    StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-errors",
                        StringUtils.format(Strings.JSLINT_ERRORS_INFORMATION, numberOfErrors));
                }
                setGotoEnabled(true);
            
            } else {
                $lintResults.hide();
                StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-valid", Strings.JSLINT_NO_ERRORS);
                setGotoEnabled(false);
            }

            PerfUtils.addMeasurement(perfTimerDOM);

        } else {
            // JSLint is disabled or does not apply to the current file, hide the results
            $lintResults.hide();
            StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-disabled", Strings.JSLINT_DISABLED);
            setGotoEnabled(false);
        }
        
        EditorManager.resizeEditor();
    }
    
    /**
     * Update DocumentManager listeners.
     */
    function updateListeners() {
        if (_enabled) {
            // register our event listeners
            $(DocumentManager)
                .on("currentDocumentChange.jslint", function () {
                    run();
                })
                .on("documentSaved.jslint documentRefreshed.jslint", function (event, document) {
                    if (document === DocumentManager.getCurrentDocument()) {
                        run();
                    }
                });
        } else {
            $(DocumentManager).off(".jslint");
        }
    }
    
    /**
     * Enable or disable JSLint.
     * @param {boolean} enabled Enabled state.
     */
    function setEnabled(enabled) {
        _enabled = enabled;
        
        CommandManager.get(TOGGLE_ENABLED).setChecked(_enabled);
        updateListeners();
        _prefs.setValue("enabled", _enabled);
    
        // run immediately
        run();
    }
    
    /**
     * Save global JSLint directive.
     * @param {string} prefs Inputted directive.
     * @param {string} response User action in dialog.
     */
    function _savePrefs(prefs, response) {
        if (response === "ok" && typeof prefs !== "undefined") {
            _prefs.setValue("directive", prefs);
            var _obj = {};
            var _props = prefs.replace(/^\s*\/\*\s*jslint\s*/, "").replace(/\/\s*\*\/\s*$/, "").split(/\s*,\s*/);
            _props.forEach(function (setting) {
                var _kv = setting.split(/\s*:\s*/);
                _obj[_kv[0]] = _kv[1];
            });
            lintPrefs = _obj;
            _prefs.setValue("lint", JSON.stringify(lintPrefs));
        } else {
            return;
        }
    }
    
    
    /** Command to toggle enablement */
    function handleToggleEnabled() {
        setEnabled(!_enabled);
    }
    
    /** Command to go to the first JSLint Error */
    function handleGotoFirstError() {
        run();
        if (_gotoEnabled) {
            $lintResults.find("tr:first-child").trigger("click");
        }
    }
    
    /** Command to open global directive dialog */
    function handlePromptPrefs() {
        var _lintString;
        Dialogs.showModalDialog("save-close-dialog", "JSLint Global Directive", "<textarea id='jslint-options' placeholder='Paste default JSLint directive here'>" + _prefs.getValue("directive") + "</textarea>").done(function (e) {
            _savePrefs(_lintString, e);
        });
        $("#jslint-options").keyup(function () { _lintString = this.value; });
    }
    
    
    // Register command handlers
    CommandManager.register(Strings.CMD_JSLINT,              TOGGLE_ENABLED,   handleToggleEnabled);
    CommandManager.register(Strings.CMD_JSLINT_FIRST_ERROR,  GOTO_FIRST_ERROR, handleGotoFirstError);
    CommandManager.register("Set JSLint Global Directive...", DEFAULT_PREFS,    handlePromptPrefs);
    
    // Add the menu items
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(TOGGLE_ENABLED, "", Menus.AFTER, Commands.TOGGLE_WORD_WRAP);
    menu.addMenuDivider(Menus.AFTER, Commands.TOGGLE_WORD_WRAP);
    
    menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);
    menu.addMenuItem(GOTO_FIRST_ERROR, KeyboardPrefs.gotoFirstError, Menus.AFTER, Commands.NAVIGATE_GOTO_DEFINITION);
    
    menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    menu.addMenuItem(DEFAULT_PREFS, "", Menus.AFTER, Commands.FILE_PROJECT_SETTINGS);
    menu.addMenuDivider(Menus.AFTER, Commands.FILE_PROJECT_SETTINGS);
    
    
    // Init PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(module, defaultPrefs);
    
    // Get JSLint preferences
    if (typeof (_prefs.getValue("lint")) !== "undefined") {
        lintPrefs = JSON.parse(_prefs.getValue("lint"));
    }
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "jslint.css");
        
        var jsLintHtml = Mustache.render(JSLintTemplate, Strings);
        $(jsLintHtml).insertBefore("#status-bar");
        
        var goldStarHtml = Mustache.render("<div id=\"gold-star\" title=\"{{JSLINT_NO_ERRORS}}\">&#9733;</div>", Strings);
        $(goldStarHtml).insertBefore("#status-file");
        
        $lintResults = $("#jslint-results");
        
        StatusBar.addIndicator(INDICATOR_ID, $("#gold-star"));
        
        // Called on HTML ready to trigger the initial UI state
        setEnabled(_prefs.getValue("enabled"));
        
        // AppInit.htmlReady() has already executed before extensions are loaded
        // so, for now, we need to call this ourself
        Resizer.makeResizable($lintResults.get(0), "vert", "top", 100);
    });
});
