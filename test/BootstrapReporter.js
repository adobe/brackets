/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, forin: true */
/*global jasmine, $, define, document, require */
define(function (require, exports, module) {
    'use strict';
    
    var UrlParams = require("utils/UrlParams").UrlParams,
        SpecRunnerUtils = require("spec/SpecRunnerUtils");

    jasmine.BootstrapReporter = function (doc, filter, topLevelResults) {
        this.document = doc || document;
        this._env = jasmine.getEnv();
        this.params = new UrlParams();
        this.params.parse();
        
        // parse querystring
        var self = this,
            i,
            p;
        
        this._runAll = this.params.get("spec") === "All";
        
        // _topLevelFilter is applied first - selects Performance vs. Unit test suites
        this._topLevelFilter = filter;
        
        // Jasmine's runner uses the specFilter to choose which tests to run.
        // If you selected an option other than "All" this will be a subset of all tests loaded.
        this._env.specFilter = this.createSpecFilter(this.params.get("spec"));
        this._runner = this._env.currentRunner();
        this._topLevelResults = topLevelResults;
        
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

    /**
     * @private
     * Filters specs by full name. Applies _topLevelFilter first before checking
     * for a matching starting substring.
     */
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

            if (spec.getFullName() === filterString) {
                return true;
            }
            
            // spec.getFullName() concatenates the names of all containing describe()s. We want to filter
            // on just the outermost suite's name (i.e., the item that was selected in the spec list UI)
            // to avoid ambiguity when suite names share the same prefix.
            var topLevelSuite = spec.suite;
            while (topLevelSuite.parentSuite) {
                topLevelSuite = topLevelSuite.parentSuite;
            }
            
            return topLevelSuite.description === filterString;
        };
    };
        
    jasmine.BootstrapReporter.prototype._createSuiteListItem = function (suiteName, specCount) {
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
        
    jasmine.BootstrapReporter.prototype._createSuiteList = function () {
        var suites = this._topLevelResults.suites,
            sortedNames = this._topLevelResults.sortedNames,
            self = this;
       
        sortedNames.forEach(function (name, index) {
            var count = suites[name].specCount;
            if (count > 0) {
                self.$suiteList.append(self._createSuiteListItem(name, count));
            }
        });
        
        // add an "all" top-level suite
        this.$suiteList.prepend(this._createSuiteListItem("All", suites.All.specCount));
    };
    
    jasmine.BootstrapReporter.prototype._showProgressBar = function (spec) {
        if (!this.$progressBar) {
            this.$progress = $('<div class="bar"/>');
            this.$progressBar = $('<div class="progress progress-striped"/>').append(this.$progress);
        }
        
        this.$resultsContainer.append(this.$progressBar);
    };
    
    jasmine.BootstrapReporter.prototype.reportRunnerStarting = function (runner) {
        var specs = runner.specs(),
            topLevelData,
            self = this;

        // create top level suite list navigation
        this._createSuiteList();
        
        // highlight the current suite
        topLevelData = (this.params.get("spec")) ? this._topLevelSuiteMap[this.params.get("spec")] : null;
        
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
        
        if ((suite.getFullName() === this.params.get("spec")) && data) {
            passed = results.passed();
                               
            data.$badgeAll.hide();
        }
    };
    
    jasmine.BootstrapReporter.prototype.reportSpecStarting = function (spec) {
        this.$info.text("Running " + spec.getFullName());
    };
    
    jasmine.BootstrapReporter.prototype._updateSuiteStatus = function (suiteName) {
        var suiteResults = this._topLevelResults.suites[suiteName],
            data = this._topLevelSuiteMap[suiteName];
        
        if (!data) {
            return;
        }
        
        // update status badges
        if (suiteResults.passedCount) {
            data.$badgePassed.show().text(suiteResults.passedCount);
        } else {
            data.$badgePassed.hide();
        }
        
        if (suiteResults.failedCount) {
            data.$badgeFailed.show().text(suiteResults.failedCount);
        } else {
            data.$badgeFailed.hide();
        }
        
        var specsRemaining = suiteResults.specCount - suiteResults.passedCount - suiteResults.failedCount;
        
        if (specsRemaining === 0) {
            data.$badgeAll.hide();
        } else {
            data.$badgeAll.text(specsRemaining);
        }
    };
    
    // Jasmine calls this function for all specs, not just filtered specs.
    jasmine.BootstrapReporter.prototype.reportSpecResults = function (spec) {
        var results = spec.results(),
            $specLink,
            $resultDisplay,
            suiteName;
        
        if (!results.skipped) {
            this._topLevelResults.addSpecResults(spec, spec.results());
            this._updateSuiteStatus(this._topLevelResults.getTopLevelSuiteName(spec));
            this._updateSuiteStatus("All");
            
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
                    $message = $('<pre/>').text(SpecRunnerUtils.getResultMessage(result));
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
});
