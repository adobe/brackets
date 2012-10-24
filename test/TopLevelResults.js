/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, forin: true */
/*global $, define */

/** 
 * A massaged version of the standard Jasmine results that:
 *  - summarizes the results for each top-level suite (instead of flattening out all suites)
 *  - counts the number of passed/failed specs instead of counting each expect()
 */

define(function (require, exports, module) {
    "use strict";
    
    var SpecRunnerUtils = require("spec/SpecRunnerUtils");
    
    /**
     * @constructor
     * Creates a TopLevelResults object. This has two public properties:
     *
     * suites - an object with entries for each top-level suite; each value is an object containing:
     *    specCount - number of specs in the suite and its descendants
     *    passedCount - number of passed specs in the suite and its descendants
     *    failedCount - number of failed specs in the suite and its descendants
     *    messages - if defined, an array of message objects for failed specs, each of which contains:
     *        spec - the name of the failing spec
     *        message - the error message for that spec's failure
     *    perf - if defined, an array of perf objects for any specs that have perf data, each of which contains:
     *        spec - the name of the spec with perf results
     *        record - the performance record for that spec
     * The suites object also contains an All property that summarizes total counts (but not messages or perf) 
     * across all suites.
     *
     * sortedNames - a sorted list of suite names (including all the keys in the suites object except All).
     *
     * @param {!jasmine.Runner} runner The Jasmine spec runner for which we're reporting results.
     * @param {Function} filter The filter being used to determine whether a given spec is run or not.
     */
    function TopLevelResults(runner, filter) {
        var self = this,
            totalSpecCount = 0;
        
        this.suites = {};
        
        function makeData(count) {
            return {
                specCount: count,
                passedCount: 0,
                failedCount: 0
            };
        }
        
        runner.topLevelSuites().forEach(function (suite) {
            var specCount = self._countSpecs(suite, filter);
            self.suites[suite.getFullName()] = makeData(specCount);
            totalSpecCount += specCount;
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
        
        this.suites.All = makeData(totalSpecCount);
    }
    
    /**
     * @private
     *
     * @param {!jasmine.Suite} suite 
     * @param {Function} filter
     * @return {Number} count The number of specs in the given suite (and its descendants) that match the filter.
     */
    TopLevelResults.prototype._countSpecs = function (suite, filter) {
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
    TopLevelResults.prototype.getTopLevelSuiteName = function (spec) {
        var topLevelSuite = spec.suite;
        
        while (topLevelSuite.parentSuite) {
            topLevelSuite = topLevelSuite.parentSuite;
        }
        
        return topLevelSuite.getFullName();
    };
    
    /**
     * Adds the passed/failed counts and failure messages for the given spec to the data for its top level suite,
     * and updates the total counts on the All record.
     * @param {!jasmine.Spec} spec The spec to record
     * @param {Object} results Jasmine result object for that spec
     */
    TopLevelResults.prototype.addSpecResults = function (spec, results) {
        var suiteData = this.suites[this.getTopLevelSuiteName(spec)],
            allData = this.suites.All;
        if (results.passed()) {
            suiteData.passedCount++;
            allData.passedCount++;
        } else {
            suiteData.failedCount++;
            allData.failedCount++;
        }
        
        results.getItems().forEach(function (item) {
            var message = SpecRunnerUtils.getResultMessage(item);
            if (message) {
                suiteData.messages = suiteData.messages || [];
                suiteData.messages.push({
                    spec: spec.getFullName(),
                    message: message
                });
            }
        });
    };
    
    /**
     * Adds the given perf data for the given spec to the data for its top level suite.
     * @param {!jasmine.Spec} spec The spec to record
     * @param {Object} results The performance record for that spec
     */
    TopLevelResults.prototype.addSpecPerf = function (spec, results) {
        var suiteData = this.suites[this.getTopLevelSuiteName(spec)];
        suiteData.perf = suiteData.perf || [];
        suiteData.perf.push({
            spec: spec.getFullName(),
            record: results
        });
    };
    
    /**
     * Returns a JSON string for the list of suites (including the "All" record).
     * @return {string} the JSON string
     */
    TopLevelResults.prototype.toJSON = function () {
        return JSON.stringify(this.suites, null, "    ");
    };
    
    exports.TopLevelResults = TopLevelResults;
});