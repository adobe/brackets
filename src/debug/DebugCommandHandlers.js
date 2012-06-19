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
/*global define, $, brackets, window */

define(function (require, exports, module) {
    'use strict';
    
    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        Editor                  = require("editor/Editor"),
        Strings                 = require("strings"),
        JSLintUtils             = require("language/JSLintUtils"),
        PerfUtils               = require("utils/PerfUtils"),
        NativeApp               = require("utils/NativeApp");
    
    function handleShowDeveloperTools(commandData) {
        brackets.app.showDeveloperTools();
    }
    
    function _handleEnableJSLint() {
        var enabled = !JSLintUtils.getEnabled();
        JSLintUtils.setEnabled(enabled);
        CommandManager.get(Commands.DEBUG_JSLINT).setChecked(enabled);
    }

    function _handleUseTabChars() {
        var useTabs = !Editor.getUseTabChar();
        Editor.setUseTabChar(useTabs);
        CommandManager.get(Commands.DEBUG_USE_TAB_CHARS).setChecked(useTabs);
    }
    
    
    // Implements the 'Run Tests' menu to bring up the Jasmine unit test window
    var _testWindow = null;
    function _handleRunUnitTests() {
        if (_testWindow) {
            try {
                _testWindow.location.reload();
            } catch (e) {
                _testWindow = null;  // the window was probably closed
            }
        }

        if (!_testWindow) {
            _testWindow = window.open("../test/SpecRunner.html", "brackets-test", "width=" + $(window).width() + ",height=" + $(window).height());
            _testWindow.location.reload(); // if it was opened before, we need to reload because it will be cached
        }
    }
    
    function _handleShowPerfData() {
        var $perfHeader = $("<div class='modal-header' />")
            .append("<a href='#' class='close'>&times;</a>")
            .append("<h1 class='dialog-title'>Performance Data</h1>")
            .append("<div align=right>Raw data (copy paste out): <textarea rows=1 style='width:30px; height:8px; overflow: hidden; resize: none' id='brackets-perf-raw-data'>" + PerfUtils.getDelimitedPerfData() + "</textarea></div>");
        
        var $perfBody = $("<div class='modal-body' style='padding: 0; max-height: 500px; overflow: auto;' />");

        var $data = $("<table class='zebra-striped condensed-table'>")
            .append("<thead><th>Operation</th><th>Time (ms)</th></thead>")
            .append("<tbody />")
            .appendTo($perfBody);
        
        var makeCell = function (content) {
            return $("<td/>").text(content);
        };
        
        var getValue = function (entry) {
            // entry is either an Array or a number
            if (Array.isArray(entry)) {
                // For Array of values, return: minimum/average/maximum/last
                var i, e, avg, sum = 0, min = Number.MAX_VALUE, max = 0;
                
                for (i = 0; i < entry.length; i++) {
                    e = entry[i];
                    min = Math.min(min, e);
                    sum += e;
                    max = Math.max(max, e);
                }
                avg = Math.round(sum / entry.length);
                return String(min) + "/" + String(avg) + "/" + String(max) + "/" + String(e);
            } else {
                return entry;
            }
        };
            
        var testName;
        var perfData = PerfUtils.getData();
        for (testName in perfData) {
            if (perfData.hasOwnProperty(testName)) {
                // Add row to error table
                $("<tr/>")
                    .append(makeCell(testName))
                    .append(makeCell(getValue(perfData[testName])))
                    .appendTo($data);
            }
        }
                                                     
        $("<div class='modal hide' />")
            .append($perfHeader)
            .append($perfBody)
            .appendTo(window.document.body)
            .modal({
                backdrop: "static",
                show: true
            });

        // Select the raw perf data field on click since select all doesn't 
        // work outside of the editor
        $("#brackets-perf-raw-data").click(function () {
            $(this).focus().select();
        });
    }
    
    function _handleNewBracketsWindow() {
        window.open(window.location.href);
    }
    
    function _handleCloseAllLiveBrowsers() {
        NativeApp.closeAllLiveBrowsers().always(function () {
            console.log("all live browsers closed");
        });
    }
    
    // Register all the command handlers
    CommandManager.register(Strings.CMD_SHOW_DEV_TOOLS, Commands.DEBUG_SHOW_DEVELOPER_TOOLS, handleShowDeveloperTools);
    CommandManager.register(Strings.CMD_JSLINT,         Commands.DEBUG_JSLINT,              _handleEnableJSLint)
        .setChecked(JSLintUtils.getEnabled());
    CommandManager.register(Strings.CMD_RUN_UNIT_TESTS, Commands.DEBUG_RUN_UNIT_TESTS,      _handleRunUnitTests);
    CommandManager.register(Strings.CMD_SHOW_PERF_DATA, Commands.DEBUG_SHOW_PERF_DATA,      _handleShowPerfData);
    CommandManager.register(Strings.CMD_EXPERIMENTAL,   Commands.DEBUG_EXPERIMENTAL,        function () {})
        .setEnabled(false);
    CommandManager.register(Strings.CMD_NEW_BRACKETS_WINDOW,
                                                        Commands.DEBUG_NEW_BRACKETS_WINDOW, _handleNewBracketsWindow);
    CommandManager.register(Strings.CMD_CLOSE_ALL_LIVE_BROWSERS,
                                                        Commands.DEBUG_CLOSE_ALL_LIVE_BROWSERS, _handleCloseAllLiveBrowsers);
    CommandManager.register(Strings.CMD_USE_TAB_CHARS,  Commands.DEBUG_USE_TAB_CHARS,       _handleUseTabChars)
        .setChecked(Editor.getUseTabChar());
});
