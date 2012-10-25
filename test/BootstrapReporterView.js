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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, forin: true */
/*global jasmine, $, define, document, require */
define(function (require, exports, module) {
    'use strict';
    
    var UrlParams = require("utils/UrlParams").UrlParams,
        SpecRunnerUtils = require("spec/SpecRunnerUtils");

    var BootstrapReporterView = function (doc, reporter) {
        doc = doc || document;
        
        $(reporter)
            .on("runnerStart", this._handleRunnerStart.bind(this))
            .on("runnerEnd", this._handleRunnerEnd.bind(this))
            .on("suiteEnd", this._handleSuiteEnd.bind(this))
            .on("specStart", this._handleSpecStart.bind(this))
            .on("specEnd", this._handleSpecEnd.bind(this));

        // build DOM immediately
        var container = $(
            '<div class="container-fluid">' +
                '<div class="row-fluid">' +
                    '<div class="span4">' +
                        '<ul id="suite-list" class="nav nav-pills nav-stacked">' +
                        '</ul>' +
                    '</div>' +
                    '<div id="results-container" class="span8">' +
                    '</div>' +
                '</div>' +
                '</div>'
        );
        
        $(doc.body).append(container);
        
        this._topLevelSuiteMap = {};
        this.$suiteList = $("#suite-list");
        this.$resultsContainer = $("#results-container");
    };
        
    BootstrapReporterView.prototype._createSuiteListItem = function (suiteName, specCount) {
        var $badgeAll = $('<span class="badge">' + specCount + "</span>"),
            $badgePassed = $('<span class="badge badge-success" style="display:none"/>'),
            $badgeFailed = $('<span class="badge badge-important" style="display:none"/>'),
            $anchor = $('<a href="?spec=' + encodeURIComponent(suiteName) + '">' + suiteName + '</a>').append($badgeAll).append($badgePassed).append($badgeFailed),
            $listItem = $('<li/>').append($anchor),
            self = this,
            active;
        
        this._topLevelSuiteMap[suiteName] = {
            $badgeAll: $badgeAll,
            $badgePassed: $badgePassed,
            $badgeFailed: $badgeFailed,
            $anchor: $anchor,
            $listItem: $listItem
        };
        
        return $listItem;
    };
        
    BootstrapReporterView.prototype._createSuiteList = function (suites, sortedNames, totalSpecCount) {
        var self = this;
       
        sortedNames.forEach(function (name, index) {
            var count = suites[name].specCount;
            if (count > 0) {
                self.$suiteList.append(self._createSuiteListItem(name, count));
            }
        });
        
        // add an "all" top-level suite
        this.$suiteList.prepend(this._createSuiteListItem("All", totalSpecCount));
    };
    
    BootstrapReporterView.prototype._showProgressBar = function (spec) {
        if (!this.$progressBar) {
            this.$progress = $('<div class="bar"/>');
            this.$progressBar = $('<div class="progress progress-striped"/>').append(this.$progress);
        }
        
        this.$resultsContainer.append(this.$progressBar);
    };
    
    BootstrapReporterView.prototype._handleRunnerStart = function (event, reporter) {
        var topLevelData,
            self = this;

        // create top level suite list navigation
        this._createSuiteList(reporter.suites, reporter.sortedNames, reporter.totalSpecCount);
        
        // highlight the current suite
        topLevelData = reporter.activeSuite ? this._topLevelSuiteMap[reporter.activeSuite] : null;
        
        if (topLevelData) {
            topLevelData.$listItem.toggleClass("active", true);
        }
        
        if (reporter.activeSpecCount) {
            this._showProgressBar();
        
            // display current running test
            this.$info = $('<div class="alert alert-info"/>');
            this.$resultsContainer.append(this.$info);
            this.$resultsContainer.append($('<hr/>'));
        }
    };
    
    BootstrapReporterView.prototype._handleRunnerEnd = function (event, reporter) {
        if (this.$info) {
            this.$info.toggleClass("alert-info", false);
            
            if (reporter.passed) {
                this.$info.toggleClass("alert-success", true).text("Complete. No failures.");
            } else {
                this.$info.toggleClass("alert-error", true).text("Complete. See failures.");
            }
        }
    };
    
    BootstrapReporterView.prototype._handleSuiteEnd = function (event, reporter, suiteData) {
        var data = this._topLevelSuiteMap[suiteData.name];
        if ((suiteData.name === reporter.activeSuite) && data) {
            data.$badgeAll.hide();
        }
    };
    
    BootstrapReporterView.prototype._handleSpecStart = function (event, reporter, specName) {
        this.$info.text("Running " + specName);
    };
    
    BootstrapReporterView.prototype._updateSuiteStatus = function (name, specCount, passedCount, failedCount) {
        var data = this._topLevelSuiteMap[name];
        
        if (!data) {
            return;
        }
        
        // update status badges
        if (passedCount) {
            data.$badgePassed.show().text(passedCount);
        } else {
            data.$badgePassed.hide();
        }
        
        if (failedCount) {
            data.$badgeFailed.show().text(failedCount);
        } else {
            data.$badgeFailed.hide();
        }
        
        var specsRemaining = specCount - passedCount - failedCount;
        
        if (specsRemaining === 0) {
            data.$badgeAll.hide();
        } else {
            data.$badgeAll.text(specsRemaining);
        }
    };
    
    BootstrapReporterView.prototype._createRows = function (record, level) {
        var rows = [],
            $row,
            indent = "",
            i,
            self = this;
        
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
                Array.prototype.push.apply(rows, self._createRows(child, level));
            });
        }
        
        return rows;
    };
    
    BootstrapReporterView.prototype._handleSpecEnd = function (event, reporter, specData, suiteData) {
        var $specLink,
            $resultDisplay,
            self = this;
        
        this._updateSuiteStatus(suiteData.name, suiteData.specCount, suiteData.passedCount, suiteData.failedCount);
        this._updateSuiteStatus("All", reporter.totalSpecCount, reporter.totalPassedCount, reporter.totalFailedCount);
        
        this.$progress.css("width", Math.round((reporter.activeSpecCompleteCount / reporter.activeSpecCount) * 100) + "%");
        
        if (!specData.passed) {
            // print suite name if not present
            var $suiteHeader = $("#suite-results-" + suiteData.id);
            
            if ($suiteHeader.length === 0) {
                this.$resultsContainer.append($('<div id="suite-results-' + suiteData.id + '" class="alert alert-info"/>').text(suiteData.name));
            }
            
            // print spec name
            $specLink = $('<a href="?spec=' + encodeURIComponent(specData.name) + '"/>').text(specData.description);
            $resultDisplay = $('<div class="alert alert-error"/>').append($specLink);
            
            // print failure details
            if (specData.messages) {
                specData.messages.forEach(function (message) {
                    $resultDisplay.append($('<pre/>').text(message));
                });
            }
        
            this.$resultsContainer.append($resultDisplay);
        }
        
        if (specData.passed && specData.perf) {
            // add spec name
            $specLink = $('<a href="?spec=' + encodeURIComponent(specData.name) + '"/>').text(specData.name);
            this.$resultsContainer.append($('<div class="alert alert-info"/>').append($specLink));
            
            // add table
            var $table = $('<table class="table table-striped table-bordered table-condensed"><thead><tr><th>Measurement</th><th>Value</th></tr></thead></table>'),
                $tbody = $table.append($('<tbody/>')),
                rows,
                specRecords = specData.perf;
            
            this.$resultsContainer.append($table);
            
            specRecords.forEach(function (record) {
                rows = self._createRows(record);
                
                rows.forEach(function (row) {
                    $tbody.append(row);
                });
            });
        }
    };
    
    BootstrapReporterView.prototype.log = function (str) {
    };
    
    exports.BootstrapReporterView = BootstrapReporterView;
});
