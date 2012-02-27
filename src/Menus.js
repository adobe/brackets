/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var Commands                = require("Commands"),
        CommandManager          = require("CommandManager"),
        PerfUtils               = require("PerfUtils");
    
    function init() {
        // Implements the File menu items
        $("#menu-file-new").click(function () {
            CommandManager.execute(Commands.FILE_NEW);
        });
        $("#menu-file-open").click(function () {
            CommandManager.execute(Commands.FILE_OPEN);
        });
        $("#menu-file-close").click(function () {
            CommandManager.execute(Commands.FILE_CLOSE);
        });
        $("#menu-file-save").click(function () {
            CommandManager.execute(Commands.FILE_SAVE);
        });
        $("#menu-file-quit").click(function () {
            CommandManager.execute(Commands.FILE_QUIT);
        });

        // Implements the 'Run Tests' menu to bring up the Jasmine unit test window
        var testWindow = null;
        $("#menu-debug-runtests").click(function () {
            if (testWindow) {
                try {
                    testWindow.location.reload();
                } catch (e) {
                    testWindow = null;  // the window was probably closed
                }
            }

            if (!testWindow) {
                testWindow = window.open("../test/SpecRunner.html");
                testWindow.location.reload(); // if it was opened before, we need to reload because it will be cached
            }
        });
        
        // Other debug menu items
//            $("#menu-debug-wordwrap").click(function() {
//                editor.setOption("lineWrapping", !(editor.getOption("lineWrapping")));
//            });     
        
        $("#menu-debug-jslint").click(function () {
            CommandManager.execute(Commands.DEBUG_JSLINT);
        });
        
        $("#menu-debug-show-perf").click(function () {
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
        });
    }

    // Define public API
    exports.init = init;
});
