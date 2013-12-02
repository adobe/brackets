/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4 */
/*global define, $, Mustache, brackets */

/**
 * Manages linters and other code inspections on a per-language basis. Provides a UI and status indicator for
 * the resulting errors/warnings.
 *
 * Currently, inspection providers are only invoked on the current file and only when it is opened, switched to,
 * or saved. But in the future, inspectors may be invoked as part of a global scan, at intervals while typing, etc.
 * Currently, results are only displayed in a bottom panel list and in a status bar icon. But in the future,
 * results may also be displayed inline in the editor (as gutter markers, squiggly underlines, etc.).
 * In the future, support may also be added for error/warning providers that cannot process a single file at a time
 * (e.g. a full-project compiler).
 */
define(function (require, exports, module) {
    "use strict";

    var _ = require("thirdparty/lodash");

    // Load dependent modules
    var Commands                = require("command/Commands"),
        PanelManager            = require("view/PanelManager"),
        CommandManager          = require("command/CommandManager"),
        DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager"),
        FileUtils               = require("file/FileUtils"),
        LanguageManager         = require("language/LanguageManager"),
        PreferencesManager      = require("preferences/PreferencesManager"),
        PerfUtils               = require("utils/PerfUtils"),
        Strings                 = require("strings"),
        StringUtils             = require("utils/StringUtils"),
        AppInit                 = require("utils/AppInit"),
        Resizer                 = require("utils/Resizer"),
        StatusBar               = require("widgets/StatusBar"),
        Async                   = require("utils/Async"),
        PanelTemplate           = require("text!htmlContent/problems-panel.html"),
        ResultsTemplate         = require("text!htmlContent/problems-panel-table.html");

    var INDICATOR_ID = "status-inspection",
        defaultPrefs = {
            enabled: brackets.config["linting.enabled_by_default"],
            collapsed: false
        };

    /** Values for problem's 'type' property */
    var Type = {
        /** Unambiguous error, such as a syntax error */
        ERROR: "problem_type_error",
        /** Maintainability issue, probable error / bad smell, etc. */
        WARNING: "problem_type_warning",
        /** Inspector unable to continue, code too complex for static analysis, etc. Not counted in error/warning tally. */
        META: "problem_type_meta"
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
    var $problemsPanel;

    /**
     * @private
     * @type {$.Element}
     */
    var $problemsPanelTable;

    /**
     * @private
     * @type {boolean}
     */
    var _gotoEnabled = false;

    /**
     * @private
     * @type {Object.<string, Array.<{name:string, scanFile:function(string, string>):Object}>>}
     */
    var _providers = {};

    /**
     * @private
     * @type {?Array.<Object>}
     */
    var _lastResult;

    /**
     * @private
     * @type {boolean}
     */
    var _hasErrors;

    /**
     * Enable or disable the "Go to First Error" command
     * @param {boolean} gotoEnabled Whether it is enabled.
     */
    function setGotoEnabled(gotoEnabled) {
        CommandManager.get(Commands.NAVIGATE_GOTO_FIRST_PROBLEM).setEnabled(gotoEnabled);
        _gotoEnabled = gotoEnabled;
    }

    /**
     * The provider is passed the text of the file and its fullPath. Providers should not assume
     * that the file is open (i.e. DocumentManager.getOpenDocumentForPath() may return null) or
     * that the file on disk matches the text given (file may have unsaved changes).
     *
     * @param {string} languageId
     * @param {{name:string, scanFile:function(string, string):?{!errors:Array, aborted:boolean}} provider
     *
     * Each error is: { pos:{line,ch}, endPos:?{line,ch}, message:string, type:?Type }
     * If type is unspecified, Type.WARNING is assumed.
     */
    function register(languageId, provider) {
        if (!_providers[languageId]) {
            _providers[languageId] = [];
        }

        _providers[languageId].push(provider);
    }

    function _unregisterAll() {
        _providers = {};
    }

    /**
     * Returns a list of provider for given file path, if available.
     * Decision is made depending on the file extension.
     *
     * @param {!string} filePath
     * @return ?{Array.<{name:string, scanFile:function(string, string):?{!errors:Array, aborted:boolean}}>} provider
     */
    function getProvidersForPath(filePath) {
        return _providers[LanguageManager.getLanguageForPath(filePath).getId()];
    }

    /**
     * Runs a file inspection over passed file, specifying a provider is optional.
     * This method doesn't update the Brackets UI, just provides inspection results.
     * These results will reflect any unsaved changes present in the file that is currently opened.
     *
     * @param {!File} file File that will be inspected for errors.
     * @param ?{{name:string, scanFile:function(string, string):?{!errors:Array, aborted:boolean}} provider
     * @return {$.Promise} a jQuery promise that will be resolved with Array.<{ item: string, results: ?{!errors:Array, aborted:boolean}}>
     */
    function inspectFile(file, provider) {
        var response = new $.Deferred();
        var providerList = (provider || getProvidersForPath(file.fullPath)) || [];
        var results = [];

        if (!providerList.length) {
            response.resolve(null);
            return response.promise();
        }
        
        DocumentManager.getDocumentText(file)
            .done(function (fileText) {
                var perfTimerInspector = PerfUtils.markStart("CodeInspection:\t" + file.fullPath),
                    masterPromise;

                masterPromise = Async.doInParallel(providerList, function (provider) {
                    var configurePromise,
                        runPromise = new $.Deferred();
                    
                    if (provider.configure) {
                        configurePromise = provider.configure(file.fullPath);
                    } else {
                        configurePromise = new $.Deferred().resolve().promise();
                    }
                    
                    configurePromise
                        .then(function () {
                            var perfTimerProvider = PerfUtils.markStart("CodeInspection '" + provider.name + "':\t" + file.fullPath);
                            try {
                                var scanResult = provider.scanFile(fileText, file.fullPath);
                                results.push({ item: provider, results: scanResult });
                            } catch (err) {
                                console.error("[CodeInspection] Provider " + provider.name + " threw an error: " + err);
                                PerfUtils.finalizeMeasurement(perfTimerInspector);
                                results.push({ item: provider, err: err });
                                runPromise.resolve();
                                return;
                            }
                            PerfUtils.addMeasurement(perfTimerProvider);
                            runPromise.resolve();
                        })
                        .fail(function (reason) {
                            console.error("[CodeInspection] Provider " + provider.name + " failed to configure: " + reason);
                            PerfUtils.finalizeMeasurement(perfTimerInspector);
                            results.push({item: provider, err: reason});
                            runPromise.resolve();
                        });
                    return runPromise.promise();
                }, false);
                
                masterPromise
                    .then(function () {
                        PerfUtils.addMeasurement(perfTimerInspector);
                        response.resolve(results);
                    });

            })
            .fail(function (err) {
                console.error("[CodeInspection] Could not read file for inspection: " + file.fullPath);
                response.reject(err);
            });

        return response.promise();
    }

    /**
     * Run inspector applicable to current document. Updates status bar indicator and refreshes error list in
     * bottom panel.
     */
    function run() {
        if (!_enabled) {
            _lastResult = null;
            Resizer.hide($problemsPanel);
            StatusBar.updateIndicator(INDICATOR_ID, true, "inspection-disabled", Strings.LINT_DISABLED);
            setGotoEnabled(false);
            return;
        }

        var currentDoc = DocumentManager.getCurrentDocument(),
            providerList = currentDoc && getProvidersForPath(currentDoc.file.fullPath);

        if (providerList && providerList.length) {
            var numProblems = 0;
            var aborted = false;
            var numProblemsReportedByProvider = 0;
            var allErrors = [];
            var html;

            // run all the provider in parallel
            inspectFile(currentDoc.file, providerList).then(function (results) {
                // check if current document wasn't changed while inspectFile was running
                if (currentDoc !== DocumentManager.getCurrentDocument()) {
                    return;
                }

                // how many errors in total?
                var errors = results.reduce(function (a, item) { return a + (item.results ? item.results.errors.length : 0) + (item.err ? 1 : 0); }, 0);

                // save for later and make the amount of errors easily available
                _lastResult = results;
                _hasErrors = errors;

                if (!results || !errors) {
                    _lastResult = null;
                    Resizer.hide($problemsPanel);
                    StatusBar.updateIndicator(INDICATOR_ID, true, "inspection-valid", StringUtils.format(Strings.NO_ERRORS, Strings.CODE_INSPECTION_PANEL_TITLE));
                    setGotoEnabled(false);
                    return;
                }
                
                // Augment error objects with additional fields needed by Mustache template
                results.forEach(function (result) {
                    numProblemsReportedByProvider = 0;
                    var provider = result.item;
                    
                    if (result.err) {
                        numProblems++;
                        numProblemsReportedByProvider++;
                        aborted = true;
                        allErrors.push({
                            providerName: provider.name,
                            results: [{ pos: {line: undefined, ch: undefined}, endPos: undefined,
                                       message: provider.name + " aborted with error: " + result.err, type: Type.ERROR }],
                            numProblems: numProblemsReportedByProvider
                        });
                        return;
                    }

                    if (result.results) {
                        result.results.errors.forEach(function (error) {
                            error.friendlyLine = error.pos.line + 1;
                            if (error.pos.line < 0) {
                                error.pos = undefined;
                            } else {
                                error.codeSnippet = currentDoc.getLine(error.pos.line);
                                error.codeSnippet = error.codeSnippet.substr(0, Math.min(175, error.codeSnippet.length));  // limit snippet width
                            }

                            if (error.type !== Type.META) {
                                numProblems++;
                                numProblemsReportedByProvider++;
                            }
                            // if the code inspector was unable to process the whole file, we keep track to show a different status
                            if (error.aborted) {
                                aborted = true;
                            }
                        });

                        allErrors.push({
                            providerName: provider.name,
                            results:      result.results.errors,
                            numProblems:  numProblemsReportedByProvider
                        });
                    }
                });
                
                html = Mustache.render(ResultsTemplate, {reportList: allErrors});
                // Update results table
                var perfTimerDOM = PerfUtils.markStart("ProblemsPanel render:\t" + currentDoc.file.fullPath);
        
                if (numProblems) {
                    $problemsPanelTable
                        .empty()
                        .append(html)
                        .scrollTop(0);  // otherwise scroll pos from previous contents is remembered
        
                    // Update the title
                    $problemsPanel.find(".title").text(StringUtils.format(Strings.ERRORS_PANEL_TITLE, Strings.CODE_INSPECTION_PANEL_TITLE));
        
                    if (!_collapsed) {
                        Resizer.show($problemsPanel);
                    }
        
                    if (numProblems === 1 && !aborted) {
                        StatusBar.updateIndicator(INDICATOR_ID, true, "inspection-errors", StringUtils.format(Strings.SINGLE_ERROR, Strings.CODE_INSPECTION_PANEL_TITLE));
                    } else {
                        // If inspector was unable to process the whole file, number of errors is indeterminate; indicate with a "+"
                        if (aborted) {
                            numProblems += "+";
                        }
                        StatusBar.updateIndicator(INDICATOR_ID, true, "inspection-errors",
                            StringUtils.format(Strings.MULTIPLE_ERRORS, Strings.CODE_INSPECTION_PANEL_TITLE, numProblems));
                    }
                    setGotoEnabled(true);
                }
        
                PerfUtils.addMeasurement(perfTimerDOM);
                
                // don't show a header if there is only one provider available for this file type
                if (providerList.length === 1) {
                    $problemsPanelTable.find(".inspector-section").hide();
                } else {
                    $problemsPanelTable.find(".inspector-section").show();
                }
            });

        } else {
            // No provider for current file
            _lastResult = null;
            Resizer.hide($problemsPanel);
            var language = currentDoc && LanguageManager.getLanguageForPath(currentDoc.file.fullPath);
            if (language) {
                StatusBar.updateIndicator(INDICATOR_ID, true, "inspection-disabled", StringUtils.format(Strings.NO_LINT_AVAILABLE, language.getName()));
            } else {
                StatusBar.updateIndicator(INDICATOR_ID, true, "inspection-disabled", Strings.NOTHING_TO_LINT);
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
                .on("currentDocumentChange.codeInspection", function () {
                    run();
                })
                .on("documentSaved.codeInspection documentRefreshed.codeInspection", function (event, document) {
                    if (document === DocumentManager.getCurrentDocument()) {
                        run();
                    }
                });
        } else {
            $(DocumentManager).off(".codeInspection");
        }
    }

    /**
     * Enable or disable all inspection.
     * @param {?boolean} enabled Enabled state. If omitted, the state is toggled.
     */
    function toggleEnabled(enabled) {
        if (enabled === undefined) {
            enabled = !_enabled;
        }
        _enabled = enabled;

        CommandManager.get(Commands.VIEW_TOGGLE_INSPECTION).setChecked(_enabled);
        updateListeners();
        _prefs.setValue("enabled", _enabled);

        // run immediately
        run();
    }

    /**
     * Toggle the collapsed state for the panel. This explicitly collapses the panel (as opposed to
     * the auto collapse due to files with no errors & filetypes with no provider). When explicitly
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
            Resizer.hide($problemsPanel);
        } else {
            if (_lastResult && _hasErrors) {
                Resizer.show($problemsPanel);
            }
        }
    }

    /** Command to go to the first Error/Warning */
    function handleGotoFirstProblem() {
        run();
        if (_gotoEnabled) {
            $problemsPanel.find("tr:first-child").trigger("click");
        }
    }


    // Register command handlers
    CommandManager.register(Strings.CMD_VIEW_TOGGLE_INSPECTION, Commands.VIEW_TOGGLE_INSPECTION,        toggleEnabled);
    CommandManager.register(Strings.CMD_GOTO_FIRST_PROBLEM,     Commands.NAVIGATE_GOTO_FIRST_PROBLEM,   handleGotoFirstProblem);

    // Init PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(module, defaultPrefs);

    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        // Create bottom panel to list error details
        var panelHtml = Mustache.render(PanelTemplate, Strings);
        var resultsPanel = PanelManager.createBottomPanel("errors", $(panelHtml), 100);
        $problemsPanel = $("#problems-panel");

        var $selectedRow;
        $problemsPanelTable = $problemsPanel.find(".table-container")
            .on("click", "tr", function (e) {
                if ($selectedRow) {
                    $selectedRow.removeClass("selected");
                }

                $selectedRow  = $(e.currentTarget);
                $selectedRow.addClass("selected");

                // This is a inspector title row, expand/collapse on click
                if ($selectedRow.hasClass("inspector-section")) {
                    // Clicking the inspector title section header collapses/expands result rows
                    $selectedRow.nextUntil(".inspector-section").toggle();

                    var $triangle = $(".disclosure-triangle", $selectedRow);
                    $triangle.toggleClass("expanded").toggleClass("collapsed");
                } else {
                    // This is a problem marker row, show the result on click
                    // Grab the required position data
                    var lineTd    = $selectedRow.find(".line-number");
                    var line      = parseInt(lineTd.text(), 10) - 1;  // convert friendlyLine back to pos.line
                    var character = lineTd.data("character");

                    var editor = EditorManager.getCurrentFullEditor();
                    editor.setCursorPos(line, character, true);
                    EditorManager.focusEditor();
                }
            });

        $("#problems-panel .close").click(function () {
            toggleCollapsed(true);
        });

        // Status bar indicator - icon & tooltip updated by run()
        var statusIconHtml = Mustache.render("<div id=\"status-inspection\">&nbsp;</div>", Strings);
        $(statusIconHtml).insertBefore("#status-language");
        StatusBar.addIndicator(INDICATOR_ID, $("#status-inspection"));

        $("#status-inspection").click(function () {
            // Clicking indicator toggles error panel, if any errors in current file
            if (_lastResult && _hasErrors) {
                toggleCollapsed();
            }
        });

        // Set initial UI state
        toggleEnabled(_prefs.getValue("enabled"));
        toggleCollapsed(_prefs.getValue("collapsed"));
    });

    // Testing
    exports.unregisterAll = _unregisterAll;

    // Public API
    exports.register      = register;
    exports.Type          = Type;
    exports.toggleEnabled = toggleEnabled;
    exports.inspectFile   = inspectFile;
});
