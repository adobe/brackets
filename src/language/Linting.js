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
        PanelTemplate           = require("text!htmlContent/linting-panel.html"),
        ResultsTemplate         = require("text!htmlContent/linting-results-table.html");

    var INDICATOR_ID = "lint-status",
        defaultPrefs = {
            enabled: brackets.config["linting.enabled_by_default"],
            collapsed: false
        };

    /** Values for linting error's 'type' property */
    var Type = {
        /** Unambiguous error, such as a syntax error */
        ERROR: "lint_type_error",
        /** Maintainability issue, probable error / bad smell, etc. */
        WARNING: "lint_type_warning",
        /** Linter unable to continue, code too complex for static analysis, etc. Not counted in error/warning tally. */
        META: "lint_type_meta"
    };


    /**
     * @private
     * @type {PreferenceStorage}
     */
    var _prefs = null;

    /**
     * When disabled, the errors panel is closed and the status bar icon is grayed out.
     * Takes precedence over _collapsed.
     * @private
     * @type {boolean}
     */
    var _enabled = true;

    /**
     * When collapsed, the errors panel is closed but the status bar icon is kept up to date.
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
     * Enable or disable the "Go to First Error" command
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
     * Each error is: { pos:{line,ch}, endPos:?{line,ch}, message:string, type:?Type }
     * If type is unspecified, Type.WARNING is assumed.
     */
    function registerLinter(languageId, provider) {
        var providers = _providers[languageId];

        if (!providers) {
            _providers[languageId] = [];
        }

        _providers[languageId].push(provider);
    }

    /**
     * Run linter applicable to current document. Updates status bar indicator and refreshes error list in
     * bottom panel.
     */
    function run() {
        if (!_enabled) {
            Resizer.hide($lintResults);
            StatusBar.updateIndicator(INDICATOR_ID, true, "lint-disabled", Strings.LINT_DISABLED);
            setGotoEnabled(false);
            return;
        }

        var currentDoc = DocumentManager.getCurrentDocument();

        var perfTimerDOM,
            perfTimerLint;

        var language = currentDoc ? LanguageManager.getLanguageForPath(currentDoc.file.fullPath) : "";
        var languageId = language && language.getId();
        var providers = (languageId && _providers[languageId]) || [];

        providers.forEach(function (provider) {
            if (provider) {
                perfTimerLint = PerfUtils.markStart("Linting '" + languageId + "':\t" + currentDoc.file.fullPath);

                var result = provider.scanFile(currentDoc.getText(), currentDoc.file.fullPath);
                _lastResult = result;

                PerfUtils.addMeasurement(perfTimerLint);
                perfTimerDOM = PerfUtils.markStart("Linting DOM:\t" + currentDoc.file.fullPath);

                if (result && result.errors.length) {
                    // Augment error objects with additional fields needed by Mustache template
                    var numProblems = 0;
                    result.errors.forEach(function (error) {
                        error.friendlyLine = error.pos.line + 1;

                        error.codeSnippet = currentDoc.getLine(error.pos.line);
                        error.codeSnippet = error.codeSnippet.substr(0, Math.min(175, error.codeSnippet.length));  // limit snippet width

                        if (error.type !== Type.META) {
                            numProblems++;
                        }
                    });

                    // Remove the null errors for the template
                    var html   = Mustache.render(ResultsTemplate, {reportList: result.errors});
                    var $selectedRow;

                    $lintResults.find(".table-container")
                        .empty()
                        .append(html)
                        .scrollTop(0)  // otherwise scroll pos from previous contents is remembered
                        .on("click", "tr", function (e) {
                            if ($selectedRow) {
                                $selectedRow.removeClass("selected");
                            }

                            $selectedRow  = $(e.currentTarget);
                            $selectedRow.addClass("selected");
                            var lineTd    = $selectedRow.find("td.line");
                            var line      = parseInt(lineTd.text(), 10) - 1;  // convert friendlyLine back to pos.line
                            var character = lineTd.data("character");

                            var editor = EditorManager.getCurrentFullEditor();
                            editor.setCursorPos(line, character, true);
                            EditorManager.focusEditor();
                        });

                    $lintResults.find(".title").text(StringUtils.format(Strings.ERRORS_PANEL_TITLE, provider.name));
                    if (!_collapsed) {
                        Resizer.show($lintResults);
                    }

                    if (numProblems === 1) {
                        StatusBar.updateIndicator(INDICATOR_ID, true, "lint-errors", StringUtils.format(Strings.SINGLE_ERROR, provider.name));
                    } else {
                        // If linter was unable to process the whole file, number of errors is indeterminate; indicate with a "+"
                        if (result.aborted) {
                            numProblems += "+";
                        }
                        StatusBar.updateIndicator(INDICATOR_ID, true, "lint-errors",
                            StringUtils.format(Strings.MULTIPLE_ERRORS, provider.name, numProblems));
                    }
                    setGotoEnabled(true);

                } else {
                    Resizer.hide($lintResults);
                    StatusBar.updateIndicator(INDICATOR_ID, true, "lint-valid", StringUtils.format(Strings.NO_ERRORS, provider.name));
                    setGotoEnabled(false);
                }

                PerfUtils.addMeasurement(perfTimerDOM);

            } else {
                // No linting provider for current file
                Resizer.hide($lintResults);
                if (language) {
                    StatusBar.updateIndicator(INDICATOR_ID, true, "lint-disabled", StringUtils.format(Strings.NO_LINT_AVAILABLE, language.getName()));
                } else {
                    StatusBar.updateIndicator(INDICATOR_ID, true, "lint-disabled", Strings.NOTHING_TO_LINT);
                }
                setGotoEnabled(false);
            }
        });
    }

    /**
     * Update DocumentManager listeners.
     */
    function updateListeners() {
        if (_enabled) {
            // register our event listeners
            $(DocumentManager)
                .on("currentDocumentChange.linting", function () {
                    run();
                })
                .on("documentSaved.linting documentRefreshed.linting", function (event, document) {
                    if (document === DocumentManager.getCurrentDocument()) {
                        run();
                    }
                });
        } else {
            $(DocumentManager).off(".linting");
        }
    }

    /**
     * Enable or disable all linting.
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
     * Toggle the collapsed state for the panel. This explicitly collapses the panel (as opposed to
     * the auto collapse due to files with no errors & filetypes with no linter). When explicitly
     * collapsed, the panel will not reopen automatically on switch files or save.
     *
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

    /** Command to go to the first Error/Warning */
    function handleGotoFirstError() {
        run();
        if (_gotoEnabled) {
            $lintResults.find("tr:first-child").trigger("click");
        }
    }


    // Register command handlers
    CommandManager.register(Strings.CMD_TOGGLE_LINTING,     Commands.VIEW_TOGGLE_LINTING,       handleToggleEnabled);
    CommandManager.register(Strings.CMD_GOTO_FIRST_ERROR,   Commands.NAVIGATE_GOTO_FIRST_ERROR, handleGotoFirstError);

    // Init PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(module, defaultPrefs);

    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        var panelHtml = Mustache.render(PanelTemplate, Strings);
        var resultsPanel = PanelManager.createBottomPanel("errors", $(panelHtml), 100);
        $lintResults = $("#errors-panel");

        // Status bar icon - icon & tooltip updated by run()
        var lintStatusHtml = Mustache.render("<div id=\"lint-status\">&nbsp;</div>", Strings);
        $(lintStatusHtml).insertBefore("#status-language");
        StatusBar.addIndicator(INDICATOR_ID, $("#lint-status"));

        $("#errors-panel .close").click(function () {
            toggleCollapsed(true);
        });

        $("#lint-status").click(function () {
            toggleCollapsed();
        });


        // Called on HTML ready to trigger the initial UI state
        setEnabled(_prefs.getValue("enabled"));

        toggleCollapsed(_prefs.getValue("collapsed"));

    });


    // Public API
    exports.registerLinter = registerLinter;
    exports.Type           = Type;

    // for unit tests
    exports.setEnabled = setEnabled;
});
