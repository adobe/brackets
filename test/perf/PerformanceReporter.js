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
    
    var records = {},
        currentSpec = null,
        currentPerfUtils;
    
    function _getTestWindowPerf() {
        return SpecRunnerUtils.getTestWindow().brackets.test.PerfUtils;
    }
    
    function _logTestWindowMeasurement(measureInfo) {
        var value,
            printName = measureInfo.measure.name || measureInfo.name,
            record = {};
        
        if (measureInfo.measure instanceof RegExp) {
            value = currentPerfUtils.searchData(measureInfo.measure);
        } else {
            value = currentPerfUtils.getData(measureInfo.measure.id);
        }
        
        if (value === undefined) {
            value = "(None)";
        }
        
        if (measureInfo.measure.name && measureInfo.name) {
            printName = measureInfo.measure.name + " - " + measureInfo.name;
        }
        
        if (measureInfo.operation === "sum") {
            if (Array.isArray(value)) {
                value = value.reduce(function (a, b) { return a + b; });
            }
            
            printName = "Sum of all " + printName;
        }
        
        record.name = printName;
        record.value = value;
        
        if (measureInfo.children) {
            record.children = [];
            measureInfo.children.forEach(function (child) {
                record.children.push(_logTestWindowMeasurement(child));
            });
        }
        
        return record;
    }
    
    /**
     * Records a performance measurement from the test window for the current running spec.
     * @param {!(PerfMeasurement|string)} measure A PerfMeasurement or string key to query PerfUtils for metrics.
     * @param {string} name An optional name or description to print with the measurement name
     * @param {string} operation An optional operation to perform on the measurement data. Currently supports sum.
     */
    function logTestWindow(measures, name, operation) {
        if (!currentSpec) {
            return;
        }
        
        currentPerfUtils = _getTestWindowPerf();
        
        if (!Array.isArray(measures)) {
            measures = [{measure: measures, name: name, operation: operation}];
        }
        
        measures.forEach(function (measure) {
            records[currentSpec].push(_logTestWindowMeasurement(measure));
        });
        
        currentPerfUtils = null;
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
    
    function _createRows(record, level) {
        var rows = [],
            $row,
            indent = "",
            i;
        
        level = (level || 0);
        
        for (i = 0; i < level; i++) {
            indent = indent.concat("&nbsp;&nbsp;&nbsp;");
        }
        
        if (level > 0) {
            indent = indent.concat("•&nbsp;");
        } else if (record.children) {
            indent = "»&nbsp;".concat(indent);
        }
        
        $row = $("<tr/>");
        $row.append($("<td>" + indent + record.name + "</td><td>" + record.value + "</td>"));
        
        rows.push($row);
        
        if (record.children) {
            level++;
            record.children.forEach(function (child) {
                Array.prototype.push.apply(rows, _createRows(child, level));
            });
        }
        
        return rows;
    }
    
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
            rows,
            specRecords = records[spec];
        
        $container.append($table);
        
        specRecords.forEach(function (record) {
            rows = _createRows(record);
            
            rows.forEach(function (row) {
                $tbody.append(row);
            });
        });
        
        delete records[spec];
    };
    
    exports.PerformanceReporter = PerformanceReporter;
    exports.logTestWindow = logTestWindow;
    exports.clearTestWindow = clearTestWindow;
});