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
    "use strict";
    
    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        Editor                  = require("editor/Editor").Editor,
        FileUtils               = require("file/FileUtils"),
        Strings                 = require("strings"),
        PerfUtils               = require("utils/PerfUtils"),
        NativeApp               = require("utils/NativeApp"),
        NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
        NodeDebugUtils          = require("debug/NodeDebugUtils");
    
    function handleShowDeveloperTools(commandData) {
        brackets.app.showDeveloperTools();
    }
    
    // Implements the 'Run Tests' menu to bring up the Jasmine unit test window
    var _testWindow = null;
    function _runUnitTests(spec) {
        var queryString = spec ? "?spec=" + spec : "";
        if (_testWindow) {
            try {
                if (_testWindow.location.search !== queryString) {
                    _testWindow.location.href = "../test/SpecRunner.html" + queryString;
                } else {
                    _testWindow.location.reload(true);
                }
            } catch (e) {
                _testWindow = null;  // the window was probably closed
            }
        }

        if (!_testWindow) {
            _testWindow = window.open("../test/SpecRunner.html" + queryString, "brackets-test", "width=" + $(window).width() + ",height=" + $(window).height());
            _testWindow.location.reload(true); // if it was opened before, we need to reload because it will be cached
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

    function _handleSwitchLanguage() {
        var stringsPath = FileUtils.getNativeBracketsDirectoryPath() + "/nls";
        NativeFileSystem.requestNativeFileSystem(stringsPath, function (fs) {
            fs.root.createReader().readEntries(function (entries) {

                var $activeLanguage,
                    $submit,
                    locale;
                
                function setLanguage(event) {
                    if ($activeLanguage) {
                        $activeLanguage.css("font-weight", "normal");
                    }
                    $activeLanguage = $(event.currentTarget);
                    locale = $activeLanguage.data("locale");
                    
                    $activeLanguage.css("font-weight", "bold");
                    $submit.attr("disabled", false);
                }
    
                var $modal = $("<div class='modal hide' />");
    
                var $header = $("<div class='modal-header' />")
                    .append("<a href='#' class='close'>&times;</a>")
                    .append("<h1 class='dialog-title'>" + Strings.LANGUAGE_TITLE + "</h1>")
                    .appendTo($modal);
                  
                var $body = $("<div class='modal-body' style='max-height: 500px; overflow: auto;' />")
                    .appendTo($modal);

                var $p = $("<p class='dialog-message'>")
                    .text(Strings.LANGUAGE_MESSAGE)
                    .appendTo($body);

                var $ul = $("<ul>")
                    .on("click", "li", setLanguage)
                    .appendTo($p);
                
                var $footer = $("<div class='modal-footer' />")
                    .appendTo($modal);
                
                var $cancel = $("<button class='dialog-button btn left'>")
                    .on("click", function () {
                        $modal.modal('hide');
                    })
                    .text(Strings.LANGUAGE_CANCEL)
                    .appendTo($footer);
                
                $submit = $("<button class='dialog-button btn primary'>")
                    .text(Strings.LANGUAGE_SUBMIT)
                    .on("click", function () {
                        if (!$activeLanguage) {
                            return;
                        }
                        brackets.setLocale(locale);
                        
                        CommandManager.execute(Commands.DEBUG_REFRESH_WINDOW);
                    })
                    .attr("disabled", "disabled")
                    .appendTo($footer);
                
                $modal
                    .appendTo(window.document.body)
                    .modal({
                        backdrop: "static",
                        show: true
                    })
                    .on("hidden", function () {
                        $(this).remove();
                    });

                // add system default
                var $li = $("<li>")
                    .text("system default")
                    .data("locale", null)
                    .appendTo($ul);
                
                // add english
                $li = $("<li>")
                    .text("en")
                    .data("locale", "en")
                    .appendTo($ul);
                
                // inspect all children of dirEntry
                entries.forEach(function (entry) {
                    if (entry.isDirectory) {
                        var match = entry.name.match(/^([a-z]{2})(-[a-z]{2})?$/);
                        
                        if (match) {
                            var language = entry.name,
                                label = match[1];
                            
                            if (match[2]) {
                                label += match[2].toUpperCase();
                            }
                            
                            var $li = $("<li>")
                                .text(label)
                                .data("locale", language)
                                .appendTo($ul);
                        }
                    }
                });
            });
        });
    }
    
    function _enableRunTestsMenuItem() {
        if (brackets.inBrowser) {
            return;
        }

        // Check for the SpecRunner.html file
        var fileEntry = new NativeFileSystem.FileEntry(
            FileUtils.getNativeBracketsDirectoryPath() + "/../test/SpecRunner.html"
        );
        
        fileEntry.getMetadata(
            function (metadata) {
                // If we sucessfully got the metadata for the SpecRunner.html file, 
                // enable the menu item
                CommandManager.get(Commands.DEBUG_RUN_UNIT_TESTS).setEnabled(true);
            },
            function (error) {} /* menu already disabled, ignore errors */
        );
    }
    
    /* Register all the command handlers */
    
    // Show Developer Tools (optionally enabled)
    CommandManager.register(Strings.CMD_SHOW_DEV_TOOLS,      Commands.DEBUG_SHOW_DEVELOPER_TOOLS,   handleShowDeveloperTools)
        .setEnabled(!!brackets.app.showDeveloperTools);
    CommandManager.register(Strings.CMD_NEW_BRACKETS_WINDOW, Commands.DEBUG_NEW_BRACKETS_WINDOW,    _handleNewBracketsWindow);
    
    // Start with the "Run Tests" item disabled. It will be enabled later if the test file can be found.
    CommandManager.register(Strings.CMD_RUN_UNIT_TESTS,      Commands.DEBUG_RUN_UNIT_TESTS,         _runUnitTests)
        .setEnabled(false);
    
    CommandManager.register(Strings.CMD_SHOW_PERF_DATA,      Commands.DEBUG_SHOW_PERF_DATA,         _handleShowPerfData);
    CommandManager.register(Strings.CMD_SWITCH_LANGUAGE,     Commands.DEBUG_SWITCH_LANGUAGE,        _handleSwitchLanguage);
    
    
    // Node-related Commands
    CommandManager.register(Strings.CMD_ENABLE_NODE_DEBUGGER, Commands.DEBUG_ENABLE_NODE_DEBUGGER, NodeDebugUtils.enableDebugger);
    CommandManager.register(Strings.CMD_LOG_NODE_STATE, Commands.DEBUG_LOG_NODE_STATE, NodeDebugUtils.logNodeState);
    CommandManager.register(Strings.CMD_RESTART_NODE, Commands.DEBUG_RESTART_NODE, NodeDebugUtils.restartNode);
    
    _enableRunTestsMenuItem();
    
    // exposed for convenience, but not official API
    exports._runUnitTests = _runUnitTests;
});
