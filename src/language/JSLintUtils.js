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
/*global define, $, JSLINT, PathUtils, brackets */

/**
 * Allows JSLint to run on the current document and report results in a UI panel.
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent non-module scripts
    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/jslint/jslint");
    
    // Load dependent modules
    var Global                  = require("utils/Global"),
        Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager"),
        PreferencesManager      = require("preferences/PreferencesManager"),
        PerfUtils               = require("utils/PerfUtils"),
        Strings                 = require("strings"),
        StringUtils             = require("utils/StringUtils"),
        AppInit                 = require("utils/AppInit"),
        StatusBar               = require("widgets/StatusBar");
        
    var PREFERENCES_CLIENT_ID = module.id,
        defaultPrefs = { enabled: !!brackets.config.enable_jslint };
    
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
     * @return {boolean} Enabled state of JSLint.
     */
    function getEnabled() {
        return _enabled;
    }
    
    /**
     * @private
     * @type {function()}
     * Holds a pointer to the function that selects the first error in the 
     * list. Stored when running JSLint and used by the "Go to First JSLint
     * Error" command
     */
    var _gotoFirstErrorFunction = null;
    
    /**
     * @private
     * Enable or disable the "Go to First JSLint Error" command
     * @param {boolean} gotoEnabled Whether it is enabled.
     */
    function _setGotoEnabled(gotoEnabled) {
        CommandManager.get(Commands.NAVIGATE_GOTO_JSLINT_ERROR).setEnabled(gotoEnabled);
        if (!gotoEnabled) {
            _gotoFirstErrorFunction = null;
        }
    }
    
    /**
     * Run JSLint on the current document. Reports results to the main UI. Displays
     * a gold star when no errors are found.
     */
    function run() {
        var currentDoc = DocumentManager.getCurrentDocument();
        
        var perfTimerDOM,
            perfTimerLint;

        var ext = currentDoc ? PathUtils.filenameExtension(currentDoc.file.fullPath) : "";
        var $lintResults = $("#jslint-results");
        var $goldStar = $("#gold-star");
        
        if (getEnabled() && /^(\.js|\.htm|\.html)$/i.test(ext)) {
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
            
            var result = JSLINT(text, null);

            PerfUtils.addMeasurement(perfTimerLint);
            perfTimerDOM = PerfUtils.markStart("JSLint DOM:\t" + (!currentDoc || currentDoc.file.fullPath));
            
            if (!result) {
                var $errorTable = $("<table class='zebra-striped condensed-table' />")
                                   .append("<tbody>");
                var $selectedRow;
                
                JSLINT.errors.forEach(function (item, i) {
                    if (item) {
                        var makeCell = function (content) {
                            return $("<td/>").text(content);
                        };
                        
                        // Add row to error table
                        var $row = $("<tr/>")
                            .append(makeCell(item.line))
                            .append(makeCell(item.reason))
                            .append(makeCell(item.evidence || ""))
                            .appendTo($errorTable);
                        
                        var clickCallback = function () {
                            if ($selectedRow) {
                                $selectedRow.removeClass("selected");
                            }
                            $row.addClass("selected");
                            $selectedRow = $row;
                            
                            var editor = EditorManager.getCurrentFullEditor();
                            editor.setCursorPos(item.line - 1, item.character - 1, true);
                            EditorManager.focusEditor();
                        };
                        $row.click(clickCallback);
                        if (i === 0) { // first result, so store callback for goto command
                            _gotoFirstErrorFunction = clickCallback;
                        }
                    }
                });

                $("#jslint-results .table-container")
                    .empty()
                    .append($errorTable)
                    .scrollTop(0);  // otherwise scroll pos from previous contents is remembered
                
                $lintResults.show();
                $goldStar.hide();
                if (JSLINT.errors.length === 1) {
                    StatusBar.updateIndicator(module.id, true, "jslint-errors", Strings.JSLINT_ERROR_INFORMATION);
                } else {
                    //return the number of non-null errors
                    var numberOfErrors = JSLINT.errors.filter(function (err) { return err !== null; }).length;
                    //if there was a null value it means there was a stop notice and an indertiminate
                    //upper bound on the number of JSLint errors, which we'll represent by appending a '+'
                    if (numberOfErrors !== JSLINT.errors.length) {
                        //first discard the stop notice
                        numberOfErrors -= 1;
                        numberOfErrors += "+";
                    }
                    StatusBar.updateIndicator(module.id, true, "jslint-errors", StringUtils.format(Strings.JSLINT_ERRORS_INFORMATION, numberOfErrors));
                }
                _setGotoEnabled(true);
            } else {
                $lintResults.hide();
                $goldStar.show();
                StatusBar.updateIndicator(module.id, true, "jslint-valid", Strings.JSLINT_NO_ERRORS);
                _setGotoEnabled(false);
            }

            PerfUtils.addMeasurement(perfTimerDOM);

        } else {
            // JSLint is disabled or does not apply to the current file, hide
            // both the results and the gold star
            $lintResults.hide();
            $goldStar.hide();
            StatusBar.updateIndicator(module.id, true, "jslint-disabled", Strings.JSLINT_DISABLED);
            _setGotoEnabled(false);
        }
        
        EditorManager.resizeEditor();
    }
    
    /**
     * @private
     * Update DocumentManager listeners.
     */
    function _updateListeners() {
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
    
    function _setEnabled(enabled) {
        _enabled = enabled;
        
        CommandManager.get(Commands.TOGGLE_JSLINT).setChecked(_enabled);
        _updateListeners();
        _prefs.setValue("enabled", _enabled);
    
        // run immediately
        run();
    }
    
    /**
     * Enable or disable JSLint.
     * @param {boolean} enabled Enabled state.
     */
    function setEnabled(enabled) {
        if (_enabled !== enabled) {
            _setEnabled(enabled);
        }
    }
    
    /** Command to toggle enablement */
    function _handleToggleJSLint() {
        setEnabled(!getEnabled());
    }
    
    /** Command to go to the first JSLint Error */
    function _handleGotoJSLintError() {
        run();
        if (_gotoFirstErrorFunction) {
            _gotoFirstErrorFunction();
        }
    }
    
    // Register command handlers
    CommandManager.register(Strings.CMD_JSLINT, Commands.TOGGLE_JSLINT, _handleToggleJSLint);
    CommandManager.register(Strings.CMD_JSLINT_FIRST_ERROR, Commands.NAVIGATE_GOTO_JSLINT_ERROR, _handleGotoJSLintError);
    
    // Init PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs);
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        var $jslintResults  = $("#jslint-results"),
            $jslintContent  = $("#jslint-results .table-container");
        
        StatusBar.addIndicator(module.id, $("#gold-star"));
        
        // Called on HTML ready to trigger the initial UI state
        _setEnabled(_prefs.getValue("enabled"));
    });

    // Define public API
    exports.run = run;
    exports.getEnabled = getEnabled;
    exports.setEnabled = setEnabled;
});
