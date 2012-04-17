/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false*/

define(function (require, exports, module) {
    'use strict';
    
    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        JSLintUtils             = require("language/JSLintUtils"),
        PerfUtils               = require("utils/PerfUtils"),
        NativeApp               = require("utils/NativeApp");
    
    function _handleEnableJSLint() {
        JSLintUtils.setEnabled(!JSLintUtils.getEnabled());
        JSLintUtils.run();
        $("#menu-debug-jslint").toggleClass("selected", JSLintUtils.getEnabled());
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
            _testWindow = window.open("../test/SpecRunner.html");
            _testWindow.location.reload(); // if it was opened before, we need to reload because it will be cached
        }
    }
    
    function _handleShowPerfData() {
        var perfHeader = $("<div class='modal-header' />")
            .append("<a href='#' class='close'>&times;</a>")
            .append("<h3 class='dialog-title'>Performance Data</h3>");
        
        var perfBody = $("<div class='modal-body' style='padding: 0' />");

        var data = $("<table class='zebra-striped condensed-table' style='max-height: 600px; overflow: auto;'>")
            .append("<thead><th>Operation</th><th>Time (ms)</th></thead>")
            .append("<tbody />")
            .appendTo(perfBody);
        
        var makeCell = function (content) {
            return $("<td/>").text(content);
        };
        
        var getValue = function (entry) {
            // entry is either an Array or a number
            // If it is an Array, return the average value
            if (Array.isArray(entry)) {
                var i, sum = 0;
                
                for (i = 0; i < entry.length; i++) {
                    sum += entry[i];
                }
                return String(Math.floor(sum / entry.length)) + " (avg)";
            } else {
                return entry;
            }
        };
            
        var testName;
        var perfData = PerfUtils.perfData;
        for (testName in perfData) {
            if (perfData.hasOwnProperty(testName)) {
                // Add row to error table
                var row = $("<tr/>")
                    .append(makeCell(testName))
                    .append(makeCell(getValue(perfData[testName])))
                    .appendTo(data);
            }
        }
                                                     
        var perfDlog = $("<div class='modal hide' />")
            .append(perfHeader)
            .append(perfBody)
            .appendTo(document.body)
            .modal({
                backdrop: "static",
                show: true
            });
    }
    
    function _handleNewBracketsWindow() {
        window.open(window.location.href);
    }
    
    /* TODO: Support arbitrary widths with grabber
        When the new theme lands with the CSS, potentially
        adjust how this is done. */
    function _handleHideSidebar() {
        var currentWidth = $(".sidebar").width();
        if (currentWidth > 0) {
            $(".sidebar").width(0);
            $("#menu-view-hide-sidebar span").first().text("Show Sidebar");
        } else {
            $(".sidebar").width(200);
            $("#menu-view-hide-sidebar span").first().text("Hide Sidebar");
        }
        
    }
    
    function _handleCloseAllLiveBrowsers() {
        NativeApp.closeAllLiveBrowsers().always(function () {
            console.log("all live browsers closed");
        });
    }
    
    CommandManager.register(Commands.DEBUG_JSLINT, _handleEnableJSLint);
    CommandManager.register(Commands.DEBUG_RUN_UNIT_TESTS, _handleRunUnitTests);
    CommandManager.register(Commands.DEBUG_SHOW_PERF_DATA, _handleShowPerfData);
    CommandManager.register(Commands.DEBUG_NEW_BRACKETS_WINDOW, _handleNewBracketsWindow);
    CommandManager.register(Commands.DEBUG_HIDE_SIDEBAR, _handleHideSidebar);
    CommandManager.register(Commands.DEBUG_CLOSE_ALL_LIVE_BROWSERS, _handleCloseAllLiveBrowsers);
});
