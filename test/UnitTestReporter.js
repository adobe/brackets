/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/**
 * A Jasmine reporter that summarizes test results data:
 *  - summarizes the results for each top-level suite (instead of flattening out all suites)
 *  - counts the number of passed/failed specs instead of counting each expect()
 *  - tracks performance data for tests that want to log it
 * and rebroadcasts the summarized results to the reporter view, as well as serializing the data
 * to JSON.
 */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        BuildInfoUtils = require("utils/BuildInfoUtils");

    // make sure the global brackets variable is loaded
    require("utils/Global");

    var activeReporter;

    /**
     * @constructor
     * Creates a UnitTestReporter object. This has a number public properties:
     *
     * suites - an object with entries for each top-level suite; each value is an object containing:
     *    name - the full name of the suite
     *    specCount - number of specs in the suite and its descendants
     *    passedCount - number of passed specs in the suite and its descendants
     *    failedCount - number of failed specs in the suite and its descendants
     *    specs - an array of results for each spec; each result is an object containing:
     *        name - the full name of the spec
     *        passed - true if the spec passed, false otherwise
     *        messages - if defined, an array of message objects for the failed spec
     *        perf - if defined, the performance record for the spec
     *
     * passed - true if all specs passed, false otherwise
     * sortedNames - a sorted list of suite names (including all the keys in the suites object except All).
     * activeSuite - the suite currently selected in the URL params, "all" if all are being run, and null if no tests are being run.
     * activeSpecCount - the number of specs that will actually be run given the current filter
     * activeSpecCompleteCount - the number of specs that have been run so far
     * totalSpecCount - the total number of specs (ignoring filter)
     * totalPassedCount - the total number of specs passed across all suites
     * totalFailedCount - the total number of specs failed across all suites
     *
     * runInfo - an object containing info about the current run:
     *     app - name of the app
     *     version - version number
     *     branch - branch the current build is running on
     *     sha - sha of the current build
     *     platform - platform of the current run
     *     startTime - time the run was started
     *     endTime - time the run finished
     *
     * @param {!Object} env The Jasmine environment we're running in.
     * @param {Function} filter The filter being used to determine whether a given spec is run or not.
     * @param {string} activeSuite The suite currently selected in the URL params, or null if all are being run.
     */
    function UnitTestReporter(env, filter, activeSuite) {
        var self = this;

        this.activeSuite = activeSuite;

        this.runInfo = {
            app: brackets.metadata.name,
            version: brackets.metadata.version,
            platform: brackets.platform
        };
        BuildInfoUtils.getBracketsSHA().done(function (branch, sha) {
            self.runInfo.branch = branch;
            self.runInfo.sha = sha;
        });

        // _topLevelFilter is applied first - selects Performance vs. Unit test suites
        this._topLevelFilter = filter;

        // Jasmine's runner uses the specFilter to choose which tests to run.
        // If you selected an option other than "All" this will be a subset of all tests loaded.
        env.specFilter = this._createSpecFilter(this.activeSuite);

        this.suites = {};
        this.passed = false;

        this.totalSpecCount = 0;
        this.totalPassedCount = 0;
        this.totalFailedCount = 0;
        env.currentRunner().topLevelSuites().forEach(function (suite) {
            var specCount = self._countSpecs(suite, filter);
            self.suites[suite.getFullName()] = {
                id: suite.id,
                name: suite.getFullName(),
                specCount: specCount,
                passedCount: 0,
                failedCount: 0,
                specs: []
            };
            self.totalSpecCount += specCount;
        });

        this.sortedNames = Object.keys(this.suites).sort(function (a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });

        this.activeSpecCount = 0;
        this.activeSpecCompleteCount = 0;

        env.currentRunner().specs().forEach(function (spec, index) {
            if (env.specFilter(spec)) {
                self.activeSpecCount++;
            }
        });
    }

    /**
     * @private
     * Filters specs by full name. Applies _topLevelFilter first before checking
     * for a matching starting substring.
     */
    UnitTestReporter.prototype._createSpecFilter = function (filterString) {
        var self = this,
            filter = filterString ? filterString.toLowerCase() : undefined;

        return function (spec) {
            // filterString is undefined when no top-level suite is active (e.g. "All", "HTMLUtils", etc.)
            // When undefined, all specs fail this filter and no tests are ran. This is by design.
            // This setup allows the SpecRunner to load initially without automatically running all tests.
            if (filter === undefined) {
                return false;
            }

            if (!self._topLevelFilter(spec)) {
                return false;
            }

            if (filter === "all") {
                return true;
            }

            if (filter === spec.getFullName().toLowerCase()) {
                return true;
            }

            // spec.getFullName() concatenates the names of all containing describe()s. We want to filter
            // on just the outermost suite's name (i.e., the item that was selected in the spec list UI)
            // to avoid ambiguity when suite names share the same prefix.
            var topLevelSuite = spec.suite;
            while (topLevelSuite.parentSuite) {
                topLevelSuite = topLevelSuite.parentSuite;
            }

            return filter === topLevelSuite.description.toLowerCase();
        };
    };

    /**
     * @private
     *
     * @param {!jasmine.Suite} suite
     * @param {Function} filter
     * @return {Number} count The number of specs in the given suite (and its descendants) that match the filter.
     */
    UnitTestReporter.prototype._countSpecs = function (suite, filter) {
        var count = 0,
            self = this;

        // count specs attached directly to this suite
        suite.specs().forEach(function (spec) {
            if (!filter || filter(spec)) {
                count++;
            }
        });

        // recursively count child suites
        suite.suites().forEach(function (child) {
            count += self._countSpecs(child, filter);
        });

        return count;
    };

    /**
     * Returns the name of the top-level suite containing the given spec.
     * @param {!jasmine.Spec} spec
     * @return {string} the top level suite name
     */
    UnitTestReporter.prototype.getTopLevelSuiteName = function (spec) {
        var topLevelSuite = spec.suite;

        while (topLevelSuite.parentSuite) {
            topLevelSuite = topLevelSuite.parentSuite;
        }

        return topLevelSuite.getFullName();
    };

    /**
     * @private
     * Adds the passed/failed counts and failure messages for the given spec to the data for its top level suite,
     * and updates the total counts on the All record.
     * @param {!jasmine.Spec} spec The spec to record
     * @param {Object} results Jasmine result object for that spec
     * @return {Object} the spec data for the given spec, listing whether it passed and any
     * messages/perf data
     */
    UnitTestReporter.prototype._addSpecResults = function (spec, results, perfRecord) {
        var suiteData = this.suites[this.getTopLevelSuiteName(spec)],
            specData = {
                name: spec.getFullName(),
                description: spec.description,
                passed: results.passed()
            };

        this.activeSpecCompleteCount++;

        if (specData.passed) {
            suiteData.passedCount++;
            this.totalPassedCount++;
        } else {
            suiteData.failedCount++;
            this.totalFailedCount++;
        }

        results.getItems().forEach(function (item) {
            var message = SpecRunnerUtils.getResultMessage(item);
            if (message) {
                specData.messages = specData.messages || [];
                specData.messages.push(message);
            }
        });

        if (perfRecord && perfRecord.length) {
            specData.perf = perfRecord;
        }

        suiteData.specs.push(specData);
        return specData;
    };

    /**
     * Returns a JSON string containing all our public data. See the constructor
     * docs for a list.
     * @return {string} the JSON string
     */
    UnitTestReporter.prototype.toJSON = function () {
        var data = {}, prop;
        for (prop in this) {
            if (this.hasOwnProperty(prop) && prop.charAt(0) !== "_") {
                data[prop] = this[prop];
            }
        }
        return JSON.stringify(data, null, "    ");
    };

    // Handlers for Jasmine callback functions

    UnitTestReporter.prototype.reportRunnerStarting = function (runner) {
        activeReporter = this;
        this.runInfo.startTime = new Date().toString();
        $(this).triggerHandler("runnerStart", [this]);
    };

    UnitTestReporter.prototype.reportRunnerResults = function (runner) {
        this.passed = runner.results().passed();
        this.runInfo.endTime = new Date().toString();
        $(this).triggerHandler("runnerEnd", [this]);
        activeReporter = null;
    };

    UnitTestReporter.prototype.reportSuiteResults = function (suite) {
        if (suite.parentSuite === null) {
            $(this).triggerHandler("suiteEnd", [this, this.suites[suite.getFullName()]]);
        }
    };

    /**
     * @private
     * @param {!Object} spec the Jasmine spec to find the category for
     * @return {string} the category for the given spec, or null if it has no category
     */
    UnitTestReporter.prototype._getCategory = function (spec) {
        if (spec.category) {
            return spec.category;
        } else {
            var suite = spec.suite;
            while (suite) {
                if (suite.category) {
                    return suite.category;
                }
                suite = suite.parentSuite;
            }
        }
        return null;
    };

    UnitTestReporter.prototype.reportSpecStarting = function (spec) {
        if (this._getCategory(spec) === "performance") {
            this._currentPerfRecord = [];
        }
        $(this).triggerHandler("specStart", [this, spec.getFullName()]);
    };

    UnitTestReporter.prototype.reportSpecResults = function (spec) {
        if (!spec.results().skipped) {
            var specData = this._addSpecResults(spec, spec.results(), this._currentPerfRecord);
            $(this).triggerHandler("specEnd", [this, specData, this.suites[this.getTopLevelSuiteName(spec)]]);
        }
        this._currentPerfRecord = null;
    };

    // Performance tracking

    UnitTestReporter.prototype._getTestWindowPerf = function () {
        return SpecRunnerUtils.getTestWindow().brackets.test.PerfUtils;
    };

    UnitTestReporter.prototype._logTestWindowMeasurement = function (measureInfo) {
        var value,
            printName = measureInfo.measure.name || measureInfo.name,
            record = {},
            self = this;

        if (measureInfo.measure instanceof RegExp) {
            value = this._currentPerfUtils.searchData(measureInfo.measure);
        } else {
            value = this._currentPerfUtils.getData(measureInfo.measure.id);
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
                record.children.push(self._logTestWindowMeasurement(child));
            });
        }

        return record;
    };

    /**
     * Records a performance measurement from the test window for the current running spec.
     * @param {!(PerfMeasurement|string)} measure A PerfMeasurement or string key to query PerfUtils for metrics.
     * @param {string} name An optional name or description to print with the measurement name
     * @param {string} operation An optional operation to perform on the measurement data. Currently supports sum.
     */
    UnitTestReporter.prototype.logTestWindow = function (measures, name, operation) {
        var self = this;

        if (!this._currentPerfRecord) {
            return;
        }

        this._currentPerfUtils = this._getTestWindowPerf();

        if (!Array.isArray(measures)) {
            measures = [{measure: measures, name: name, operation: operation}];
        }

        measures.forEach(function (measure) {
            self._currentPerfRecord.push(self._logTestWindowMeasurement(measure));
        });

        this._currentPerfUtils = null;
    };

    /**
     * Clears the current set of performance measurements.
     */
    UnitTestReporter.prototype.clearTestWindow = function () {
        this._getTestWindowPerf().clear();
    };

    /**
     * @return The active unit test reporter, or null if no unit test is running.
     */
    function getActiveReporter() {
        return activeReporter;
    }

    // Exports

    exports.UnitTestReporter = UnitTestReporter;
    exports.getActiveReporter = getActiveReporter;
});
