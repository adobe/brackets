/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, forin: true */
/*global jasmine, document */
(function ($) {
    'use strict';

    jasmine.BootstrapReporter = function (doc, filter) {
        this._paramMap = {};
        this.document = doc || document;
        this._env = jasmine.getEnv();
        
        // parse querystring
        var self = this,
            params = this.document.location.search.substring(1).split('&'),
            i,
            p;
        
        for (i = 0; i < params.length; i++) {
            p = params[i].split('=');
            this._paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
        }
        
        this._runAll = this._paramMap.spec === "All";
        this._topLevelFilter = filter;
        this._env.specFilter = this.createSpecFilter(this._paramMap.spec);
        this._runner = this._env.currentRunner();
        
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
        
        $(this.document.body).append(container);
        
        this._topLevelSuiteMap = {};
        this.$suiteList = $("#suite-list");
        this.$resultsContainer = $("#results-container");
    };

    jasmine.BootstrapReporter.prototype.createSpecFilter = function (filterString) {
        var self = this;
        
        return function (spec) {
            // filterString is undefined when no top-level suite is active (e.g. "All", "HTMLUtils", etc.)
            // When undefined, all specs fail this filter and no tests are ran. This is by design.
            // This setup allows the SpecRunner to load initially without automatically running all tests.
            if (filterString === undefined) {
                return false;
            }
            
            if (!self._topLevelFilter(spec)) {
                return false;
            }
            
            if (filterString === "All") {
                return true;
            }
            
            return (spec.getFullName().indexOf(filterString) === 0);
        };
    };
        
    jasmine.BootstrapReporter.prototype._createSuiteListItem = function (suite, specCount) {
        var suiteName = (suite === null) ? "All" : suite.getFullName(),
            $badgeAll = $('<span class="badge">' + specCount + "</span>"),
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
            $listItem: $listItem,
            specCount: specCount,
            passedCount: 0,
            failedCount: 0
        };
        
        return $listItem;
    };
        
    jasmine.BootstrapReporter.prototype._countSpecs = function (suite) {
        var count = 0,
            self = this;
        
        // count specs attached directly to this suite
        suite.specs().forEach(function (spec, index) {
            if (self._topLevelFilter(spec)) {
                count++;
            }
        });
        
        // recursively count child suites
        suite.suites().forEach(function (child, index) {
            count += self._countSpecs(child);
        });
        
        return count;
    };
    
    jasmine.BootstrapReporter.prototype._createSuiteList = function () {
        var topLevel = [].concat(this._runner.topLevelSuites()),
            childSuites,
            self = this;
        
        topLevel.sort(function compareFullName(a, b) {
            var aName = a.getFullName().toLowerCase(),
                bName = b.getFullName().toLowerCase();
            
            if (aName < bName) {
                return -1;
            } else if (aName > bName) {
                return 1;
            }
            
            return 0;
        });
        
        topLevel.forEach(function (suite, index) {
            var count = self._countSpecs(suite);
            
            if (count > 0) {
                self.$suiteList.append(self._createSuiteListItem(suite, count));
            }
        });
        
        // count all speces
        var allSpecsCount = 0;
        $.each(this._topLevelSuiteMap, function (index, value) {
            allSpecsCount += value.specCount;
        });
        
        // add an "all" top-level suite
        this.$suiteList.prepend(this._createSuiteListItem(null, allSpecsCount));
    };
    
    jasmine.BootstrapReporter.prototype._showProgressBar = function (spec) {
        if (!this.$progressBar) {
            this.$progress = $('<div class="bar"/>');
            this.$progressBar = $('<div class="progress progress-striped"/>').append(this.$progress);
        }
        
        this.$resultsContainer.append(this.$progressBar);
    };
    
    jasmine.BootstrapReporter.prototype.reportRunnerStarting = function (runner) {
        var i,
            specs = runner.specs(),
            topLevelData,
            self = this;
    
        // create top level suite list navigation
        this._createSuiteList();
        
        // highlight the current suite
        topLevelData = (this._paramMap.spec) ? this._topLevelSuiteMap[this._paramMap.spec] : null;
        
        if (topLevelData) {
            topLevelData.$listItem.toggleClass("active", true);
        }
        
        this._specCount = 0;
        this._specCompleteCount = 0;
        
        specs.forEach(function (spec, index) {
            if (self._env.specFilter(spec)) {
                self._specCount++;
            }
        });
        
        if (this._specCount) {
            this._showProgressBar();
        
            // display current running test
            this.$info = $('<div class="alert alert-info"/>');
            this.$resultsContainer.append(this.$info);
            this.$resultsContainer.append($('<hr/>'));
        }
    };
    
    jasmine.BootstrapReporter.prototype.reportRunnerResults = function (runner) {
        if (this.$info) {
            this.$info.toggleClass("alert-info", false);
            
            if (runner.results().passed()) {
                this.$info.toggleClass("alert-success", true).text("Complete. No failures.");
            } else {
                this.$info.toggleClass("alert-error", true).text("Complete. See failures.");
            }
        }
    };
    
    jasmine.BootstrapReporter.prototype.reportSuiteResults = function (suite) {
        var results = suite.results(),
            passed,
            data = this._topLevelSuiteMap[suite.getFullName()];
        
        if ((suite.getFullName() === this._paramMap.spec) && data) {
            passed = results.passed();
                               
            data.$badgeAll.hide();
        }
    };
    
    jasmine.BootstrapReporter.prototype.reportSpecStarting = function (spec) {
        this.$info.text("Running " + spec.getFullName());
    };
    
    jasmine.BootstrapReporter.prototype._getTopLevelSuiteData = function (spec) {
        var topLevelSuite = spec.suite;
        
        while (topLevelSuite.parentSuite) {
            topLevelSuite = topLevelSuite.parentSuite;
        }
        
        return this._topLevelSuiteMap[topLevelSuite.getFullName()];
    };
    
    jasmine.BootstrapReporter.prototype._updateSuiteStatus = function (data, results) {
        // update pass/fail totals
        if (results.passed()) {
            data.passedCount++;
        } else {
            data.failedCount++;
        }
        
        // update status badges
        if (data.passedCount) {
            data.$badgePassed.show().text(data.passedCount);
        } else {
            data.$badgePassed.hide();
        }
        
        if (data.failedCount) {
            data.$badgeFailed.show().text(data.failedCount);
        } else {
            data.$badgeFailed.hide();
        }
        
        var specsRemaining = data.specCount - data.passedCount - data.failedCount;
        
        if (specsRemaining === 0) {
            data.$badgeAll.hide();
        } else {
            data.$badgeAll.text(specsRemaining);
        }
    };
    
    jasmine.BootstrapReporter.prototype._updateStatus = function (spec) {
        var data = this._getTopLevelSuiteData(spec),
            allData,
            results;
        
        // Top-level suite data will not exist if filtered
        if (!data) {
            return;
        }
        
        allData = this._topLevelSuiteMap.All;
        results = spec.results();
        
        this._updateSuiteStatus(data, results);
        this._updateSuiteStatus(allData, results);
    };
    
    jasmine.BootstrapReporter.prototype.reportSpecResults = function (spec) {
        var results = spec.results(),
            $specLink,
            $resultDisplay;
        
        if (!results.skipped) {
            this._updateStatus(spec);
            
            // update progress
            this._specCompleteCount++;
            this.$progress.css("width", Math.round((this._specCompleteCount / this._specCount) * 100) + "%");
            
            if (!results.passed()) {
                // print suite name if not present
                var $suiteHeader = $("#suite-results-" + spec.suite.id);
                
                if ($suiteHeader.length === 0) {
                    this.$resultsContainer.append($('<div id="suite-results-' + spec.suite.id + '" class="alert alert-info"/>').text(spec.suite.getFullName()));
                }
                
                // print spec name
                $specLink = $('<a href="?spec=' + encodeURIComponent(spec.getFullName()) + '"/>').text(spec.description);
                $resultDisplay = $('<div class="alert alert-error"/>').append($specLink);
                
                // print failure details
                var resultItems = results.getItems(),
                    $message,
                    i;
            
                for (i = 0; i < resultItems.length; i++) {
                    var result = resultItems[i];
                    
                    $message = null;
                    
                    if (result.type === 'log') {
                        $message = $('<pre/>').text(result.toString());
                    } else if (result.type === 'expect' && result.passed && !result.passed()) {
                        $message = $('<pre/>').text(result.message);
                        
                        if (result.trace.stack) {
                            $message = $('<pre/>').text(result.trace.stack);
                        }
                    }
                    
                    if ($message) {
                        $resultDisplay.append($message);
                    }
                }
            
                this.$resultsContainer.append($resultDisplay);
            }
        }
    };
    
    jasmine.BootstrapReporter.prototype.log = function (str) {
    };
}(window.jQuery));