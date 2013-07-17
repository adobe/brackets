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
        PanelManager            = brackets.getModule("view/PanelManager"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Menus                   = brackets.getModule("command/Menus"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        EditorManager           = brackets.getModule("editor/EditorManager"),
        LanguageManager         = brackets.getModule("language/LanguageManager"),
        NativeFileSystem        = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        PerfUtils               = brackets.getModule("utils/PerfUtils"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        Strings                 = brackets.getModule("strings"),
        StringUtils             = brackets.getModule("utils/StringUtils"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        Resizer                 = brackets.getModule("utils/Resizer"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        StatusBar               = brackets.getModule("widgets/StatusBar"),
        JSLintTemplate          = require("text!htmlContent/bottom-panel.html"),
        ResultsTemplate         = require("text!htmlContent/results-table.html");
    
    var KeyboardPrefs = JSON.parse(require("text!keyboard.json")),
        JSLintOptions = JSON.parse(require("text!config.json"));
    
    var INDICATOR_ID = "jslint-status",
        defaultPrefs = {
            enabled: JSLintOptions.enabled_by_default,
            collapsed: false
        };
    
    
    /** @const {string} JSLint commands ID */
    var TOGGLE_ENABLED   = "jslint.toggleEnabled";
    var GOTO_FIRST_ERROR = "jslint.gotoFirstError";
    
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
     * @type {string}
     */
    var _configFileName = ".jslint.json";

    /**
     * @private
     * @type {object}
     */
    var _jsLintConfig = null;

    /**
     * Enable or disable the "Go to First JSLint Error" command
     * @param {boolean} gotoEnabled Whether it is enabled.
     */
    function setGotoEnabled(gotoEnabled) {
        CommandManager.get(GOTO_FIRST_ERROR).setEnabled(gotoEnabled);
        _gotoEnabled = gotoEnabled;
    }

    /**
     * Load project-wide JSLint configuration.
     *
     * Brackets JSLint configuration should be in JSON format, with all the
     * JSLint options specified according to JSLint documentation.
     * 
     * JSLint project file should be located at <Project Root>/.jslint.json . It
     * is loaded each time project is changed or the configuration file is
     * modified.
     * 
     * @return Promise to return JSLint configuration object.
     *
     * @see <a href="http://www.jslint.com/lint.html#options">JSLint option
     * reference</a>.
     */
    function _loadProjectConfig() {

        var projectRootEntry = ProjectManager.getProjectRoot(),
            result = new $.Deferred(),
            config;

        projectRootEntry.getFile(_configFileName,
                { create: false },
                function (configFileEntry) {
                var reader = new NativeFileSystem.FileReader();
                configFileEntry.file(function (file) {
                    reader.onload = function (event) {
                        try {
                            config = JSON.parse(event.target.result);
                            result.resolve(config);
                        } catch (e) {
                            result.reject(e);
                        }
                    };
                    reader.onerror = function (event) {
                        result.reject(event.target.error);
                    };
                    reader.readAsText(file);
                });
            },
            function (err) {
                result.reject(err);
            });

        return result.promise();

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
            
            var result = JSLINT(text, _jsLintConfig);

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
                
                if (!_collapsed) {
                    Resizer.show($lintResults);
                }
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
                Resizer.hide($lintResults);
                StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-valid", Strings.JSLINT_NO_ERRORS);
                setGotoEnabled(false);
            }

            PerfUtils.addMeasurement(perfTimerDOM);

        } else {
            // JSLint is disabled or does not apply to the current file, hide the results
            Resizer.hide($lintResults);
            StatusBar.updateIndicator(INDICATOR_ID, true, "jslint-disabled", Strings.JSLINT_DISABLED);
            setGotoEnabled(false);
        }
    }

    /**
     * Update DocumentManager and ProjectManager listeners.
     */
    function updateListeners() {
        if (_enabled) {
            // register our event listeners
            $(DocumentManager)
                .on("currentDocumentChange.jslint", function () {
                    run();
                })
                .on("documentSaved.jslint documentRefreshed.jslint", function (event, document) {
                    // if this project's JSLint config has been updated, reload
                    if (document.file.fullPath ===
                                ProjectManager.getProjectRoot().fullPath + _configFileName) {
                        _loadProjectConfig()
                            .done(function (config) {
                                _jsLintConfig = config;
                            })
                            .fail(function () {
                                _jsLintConfig = null;
                            });
                    }
                    if (document === DocumentManager.getCurrentDocument()) {
                        run();
                    }
                });
            $(ProjectManager)
                .on("projectOpen.jslint", function () {
                    _loadProjectConfig()
                        .done(function (config) {
                            _jsLintConfig = config;
                        })
                        .fail(function () {
                            _jsLintConfig = null;
                        });
                });
        } else {
            $(DocumentManager).off(".jslint");
            $(ProjectManager).off(".jslint");
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
            if (JSLINT.errors && JSLINT.errors.length) {
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
    CommandManager.register(Strings.CMD_JSLINT,             TOGGLE_ENABLED,   handleToggleEnabled);
    CommandManager.register(Strings.CMD_JSLINT_FIRST_ERROR, GOTO_FIRST_ERROR, handleGotoFirstError);
    
    // Add the menu items
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(TOGGLE_ENABLED, "", Menus.AFTER, Commands.FILE_LIVE_HIGHLIGHT);
    menu.addMenuDivider(Menus.AFTER, Commands.FILE_LIVE_HIGHLIGHT);
    
    menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);
    menu.addMenuItem(GOTO_FIRST_ERROR, KeyboardPrefs.gotoFirstError, Menus.AFTER, Commands.NAVIGATE_GOTO_DEFINITION);
    
    
    // Init PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(module, defaultPrefs);
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "jslint.css");
        
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
    
    // for unit tests
    exports.setEnabled = setEnabled;
});
