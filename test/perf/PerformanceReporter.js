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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

define(function (require, exports, module) {
    'use strict';
    
    var SpecRunnerUtils = require("spec/SpecRunnerUtils");
    
    var records = {};
    
    var currentSpec = null;
    
    function _getTestWindowPerf() {
        return SpecRunnerUtils.getTestWindow().brackets.test.PerfUtils;
    }
    
    function logTestWindow(measure, name) {
        if (!currentSpec) {
            return;
        }
        
        var PerfUtils = _getTestWindowPerf(),
            value = PerfUtils.getData(measure.id);
        
        if (!value) {
            throw new Error(measure.id + " measurement not found");
        }
        
        var printName = measure.name;
        
        if (name) {
            printName = printName + " - " + name;
        }
        
        records[currentSpec].push({ name: printName, value: value });
    }
    
    function clearTestWindow() {
        _getTestWindowPerf().clear();
    }
    
    // a minimal reporter implementation to listen for completion
    function PerformanceReporter() {
    }
    
    PerformanceReporter.prototype.reportSpecStarting = function (spec) {
        currentSpec = spec;
        records[spec] = [];
    };
    
    PerformanceReporter.prototype.reportSpecResults = function (spec) {
        if (spec.results().skipped || (records[spec] && records[spec].length === 0)) {
            return;
        }
        
        var $container = $("#results-container");
        
        // add spec name
        var $specLink = $('<a href="?spec=' + encodeURIComponent(spec.getFullName()) + '"/>').text(spec.getFullName());
        $container.append($('<div class="alert alert-info"/>').append($specLink));
        
        // add table
        var $table = $('<table class="table table-striped table-bordered table-condensed"><thead><tr><th>Measurement</th><th>Value</th></tr></thead></table>'),
            $tbody = $table.append($('<tbody/>')),
            $tr;
        
        $container.append($table);
        
        $.each(records[spec], function (index, item) {
            $tr = $("<tr/>");
            $tr.append($("<td>" + item.name + "</td><td>" + item.value + "</td>"));
            $tbody.append($tr);
        });
    };
    
    exports.PerformanceReporter = PerformanceReporter;
    exports.logTestWindow = logTestWindow;
    exports.clearTestWindow = clearTestWindow;
});