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
/*global define, $, Mustache, brackets */

/**
 * Provides a UI and status indicator for linting errors/warnings. Extensions can register providers on a
 * per-language basis.
 *
 * Currently, linters are only invoked on the current file and only when it is opened, switched to, or saved.
 * But in the future, linters may be invoked as part of a global scan, at intervals while typing, etc.
 * Currently, linting results are only displayed in a bottom panel list and in a status bar icon. But in the
 * future, results may also be displayed inline in the editor (as gutter markers, squiggly underlines, etc.).
 * In the future, support may also be added for error/warning providers that cannot process a single file at
 * a time (e.g. a full-project compiler).
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var Commands                = require("command/Commands"),
        PanelManager            = require("view/PanelManager"),
        CommandManager          = require("command/CommandManager"),
        DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager"),
        LanguageManager         = require("language/LanguageManager"),
        PreferencesManager      = require("preferences/PreferencesManager"),
        PerfUtils               = require("utils/PerfUtils"),
        Strings                 = require("strings"),
        StringUtils             = require("utils/StringUtils"),
        AppInit                 = require("utils/AppInit"),
        Resizer                 = require("utils/Resizer"),
        StatusBar               = require("widgets/StatusBar"),
        JSLintTemplate          = require("text!htmlContent/linting-panel.html"),
        ResultsTemplate         = require("text!htmlContent/linting-results-table.html");
    
    var INDICATOR_ID = "jslint-status",
        defaultPrefs = {
            enabled: brackets.config["linting.enabled_by_default"],
            collapsed: false
        };
    
    
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
     * @type {boolean}
     */
    var _collapsed = false;
    
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
     * @private
     * @type {Object.<string, {name:string, scanFile:function(string, string):Object}>}
     */
    var _providers = {};
    
    /**
     * @private
     * @type {?Array.<Object>}
     */
    var _lastResult;
    
    /**
     * Enable or disable the "Go to First JSLint Error" command
     * @param {boolean} gotoEnabled Whether it is enabled.
     */
    function setGotoEnabled(gotoEnabled) {
        CommandManager.get(Commands.NAVIGATE_GOTO_FIRST_ERROR).setEnabled(gotoEnabled);
        _gotoEnabled = gotoEnabled;
    }
    
    
    /**
     * The provider is passed the text of the file and its fullPath. Providers should not assume
     * that the file is open (i.e. DocumentManager.getOpenDocumentForPath() may return null) or
     * that the file on disk matches the text given (file may have unsaved changes).
     *
     * @param {string} languageId
     * @param {{name:string, scanFile:function(string, string):{errors:Array, aborted:boolean}} provider
     *
     * Each error is: { pos:{line,ch}, endPos:?{line,ch}, message:string, level:?enum }
     */
    function registerLinter(languageId, provider) {
        if (_providers[languageId]) {
            console.warn("Overwriting existing linting provider for language " + languageId);
        }
        _providers[languageId] = provider;
    }
    
    /**
     * Run linter applicable to current document. Updates status bar indicator and refreshes error list in
     * bottom panel.
     */
    function run() {
        if (!_enabled) {
            Resizer.hide($lintResults);
            StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-disabled", Strings.LINT_DISABLED);
            setGotoEnabled(false);
        }
        
        var currentDoc = DocumentManager.getCurrentDocument();
        
        var perfTimerDOM,
            perfTimerLint;
        
        var language = currentDoc ? LanguageManager.getLanguageForPath(currentDoc.file.fullPath) : "";
        var languageId = language && language.getId();
        var provider = language && _providers[languageId];
        
        if (_enabled && provider) {
            perfTimerLint = PerfUtils.markStart("Linting '" + languageId + "':\t" + currentDoc.file.fullPath);
            
            var result = provider.scanFile(currentDoc.getText(), currentDoc.fullPath);
            _lastResult = result;
            
            PerfUtils.addMeasurement(perfTimerLint);
            perfTimerDOM = PerfUtils.markStart("Linting DOM:\t" + currentDoc.file.fullPath);
            
            if (result && result.errors.length) {
                // Augment error objects with additional fields needed by Mustache template
                result.errors.forEach(function (error) {
                    error.friendlyLine = error.pos.line + 1;
                    
                    error.codeSnippet = currentDoc.getLine(error.pos.line);
                    error.codeSnippet = error.codeSnippet.substr(0, Math.min(175, error.codeSnippet.length));  // limit snippet width
                });
                
                // Remove the null errors for the template
                var html   = Mustache.render(ResultsTemplate, {reportList: result.errors});
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
                        var line      = parseInt(lineTd.text(), 10) - 1;  // convert friendlyLine back to pos.line
                        var character = lineTd.data("character");
                        
                        var editor = EditorManager.getCurrentFullEditor();
                        editor.setCursorPos(line, character, true);
                        EditorManager.focusEditor();
                    });
                
                if (!_collapsed) {
                    Resizer.show($lintResults);
                    $lintResults.find(".title").text(StringUtils.format(Strings.ERRORS_PANEL_TITLE, provider.name));
                }
                if (result.errors.length === 1) {
                    StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-errors", StringUtils.format(Strings.SINGLE_ERROR, provider.name));
                } else {
                    // If linter was unable to process the whole file, number of errors is indeterminate; indicate with a "+"
                    var numberOfErrors = result.errors.length;
                    if (result.aborted) {
                        // Don't include stop notice itself in tally
                        numberOfErrors--;
                        numberOfErrors += "+";
                    }
                    StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-errors",
                        StringUtils.format(Strings.MULTIPLE_ERRORS, provider.name, numberOfErrors));
                }
                setGotoEnabled(true);
            
            } else {
                Resizer.hide($lintResults);
                StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-valid", StringUtils.format(Strings.NO_ERRORS, provider.name));
                setGotoEnabled(false);
            }

            PerfUtils.addMeasurement(perfTimerDOM);

        } else {
            // No linting provider for current file
            Resizer.hide($lintResults);
            if (language) {
                StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-disabled", StringUtils.format(Strings.NO_LINT_AVAILABLE, language.getName()));
            } else {
                StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-disabled", Strings.NOTHING_TO_LINT);
            }
            setGotoEnabled(false);
        }
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
        
        CommandManager.get(Commands.VIEW_TOGGLE_LINTING).setChecked(_enabled);
        updateListeners();
        _prefs.setValue("enabled", _enabled);
    
        // run immediately
        run();
    }
    
    
    /** 
     * Toggle the collapsed state for the panel
     * @param {?boolean} collapsed Collapsed state. If omitted, the state is toggled.
     */
    function toggleCollapsed(collapsed) {
        if (collapsed === undefined) {
            collapsed = !_collapsed;
        }
        
        _collapsed = collapsed;
        _prefs.setValue("collapsed", _collapsed);
        
        if (_collapsed) {
            Resizer.hide($lintResults);
        } else {
            if (_lastResult && _lastResult.errors.length) {
                Resizer.show($lintResults);
            }
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
    
    
    // Register command handlers
    CommandManager.register(Strings.CMD_JSLINT,             Commands.VIEW_TOGGLE_LINTING,       handleToggleEnabled);
    CommandManager.register(Strings.CMD_GOTO_FIRST_ERROR,   Commands.NAVIGATE_GOTO_FIRST_ERROR, handleGotoFirstError);
    
    // Init PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(module, defaultPrefs);
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        var jsLintHtml = Mustache.render(JSLintTemplate, Strings);
        var resultsPanel = PanelManager.createBottomPanel("jslint.results", $(jsLintHtml), 100);
        $lintResults = $("#jslint-results");
        
        var lintStatusHtml = Mustache.render("<div id=\"lint-status\" title=\"{{JSLINT_NO_ERRORS}}\">&nbsp;</div>", Strings);
        $(lintStatusHtml).insertBefore("#status-language");
        StatusBar.addIndicator(INDICATOR_ID, $("#lint-status"));
        $("#jslint-results .close").click(function () {
            toggleCollapsed(true);
        });

        $("#jslint-status").click(function () {
            toggleCollapsed();
        });
        
        
        // Called on HTML ready to trigger the initial UI state
        setEnabled(_prefs.getValue("enabled"));
        
        toggleCollapsed(_prefs.getValue("collapsed"));
                
    });
    
    
    // Public API
    exports.registerLinter = registerLinter;
    
    // for unit tests
    exports.setEnabled = setEnabled;
});
