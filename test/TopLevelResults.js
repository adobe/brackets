/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, forin: true */
/*global $, define */

// A massaged version of the standard Jasmine results that:
// -- summarizes the results for each top-level suite (instead of flattening out all suites)
// -- counts the number of passed/failed specs instead of counting each expect()

define(function (require, exports, module) {
    "use strict";
    
    function TopLevelResults(runner, filter) {
        var self = this,
            totalSpecCount = 0;
        
        this.suites = {};
        
        runner.topLevelSuites().forEach(function (suite) {
            var specCount = self._countSpecs(suite, filter);
            self.suites[suite.getFullName()] = {
                specCount: specCount,
                passedCount: 0,
                failedCount: 0
            };
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
        
        this.suites.All = {
            specCount: totalSpecCount,
            passedCount: 0,
            failedCount: 0
        };
    }
    
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
            count += self._countSpecs(child);
        });
        
        return count;
    };
    
    TopLevelResults.prototype.getTopLevelSuiteName = function (spec) {
        var topLevelSuite = spec.suite;
        
        while (topLevelSuite.parentSuite) {
            topLevelSuite = topLevelSuite.parentSuite;
        }
        
        return topLevelSuite.getFullName();
    };
    
    TopLevelResults.prototype.addSpecResults = function (spec) {
        var suiteData = this.suites[this.getTopLevelSuiteName(spec)],
            allData = this.suites.All,
            results = spec.results();
        
        if (results.passed()) {
            suiteData.passedCount++;
            allData.passedCount++;
        } else {
            suiteData.failedCount++;
            allData.failedCount++;
        }
    };
    
    exports.TopLevelResults = TopLevelResults;
});