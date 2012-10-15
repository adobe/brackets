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
/*global require, define, $, beforeEach, afterEach, jasmine, brackets */

// Set the baseUrl to brackets/src
require.config({
    baseUrl: "../src",
    paths: {
        "test": "../test",
        "perf": "../test/perf",
        "spec": "../test/spec",
        "text": "thirdparty/text",
        "i18n" : "thirdparty/i18n"
    }
});

define(function (require, exports, module) {
    'use strict';
    
    // Utility dependency
    var Global              = require("utils/Global"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils"),
        PerformanceReporter = require("perf/PerformanceReporter").PerformanceReporter,
        ExtensionLoader     = require("utils/ExtensionLoader"),
        Async               = require("utils/Async"),
        FileUtils           = require("file/FileUtils"),
        Menus               = require("command/Menus"),
        UrlParams           = require("utils/UrlParams").UrlParams;

    // Jasmine reporter UI
    require("test/BootstrapReporter");
    
    // Load modules that self-register and just need to get included in the main project
    require("document/ChangedDocumentTracker");
    
    // Load both top-level suites. Filtering is applied at the top-level as a filter to BootstrapReporter.
    require("test/UnitTestSuite");
    require("test/PerformanceTestSuite");
    
    var suite,
        params = new UrlParams();
    
    params.parse();
    
    function _loadExtensionTests(suite) {
        // augment jasmine to identify extension unit tests
        var addSuite = jasmine.Runner.prototype.addSuite;
        jasmine.Runner.prototype.addSuite = function (suite) {
            suite.category = "extension";
            addSuite.call(this, suite);
        };
        
        var bracketsPath = FileUtils.getNativeBracketsDirectoryPath(),
            paths = ["default"];
        
        // load user extensions only when running the extension test suite
        if (suite === "ExtensionTestSuite") {
            paths.push("user");
        }

        // This returns path to test folder, so convert to src
        bracketsPath = bracketsPath.replace(/\/test$/, "/src");

        return Async.doInParallel(paths, function (dir) {
            return ExtensionLoader.testAllExtensionsInNativeDirectory(
                bracketsPath + "/extensions/" + dir,
                "extensions/" + dir
            );
        });
    }
    
    function _documentReadyHandler() {
        if (brackets.app.showDeveloperTools) {
            $("#show-dev-tools").click(function () {
                brackets.app.showDeveloperTools();
            });
        } else {
            $("#show-dev-tools").remove();
        }
        
        $("#reload").click(function () {
            window.location.reload(true);
        });
        
        $("#" + suite).closest("li").toggleClass("active", true);
        
        jasmine.getEnv().execute();
    }
    
    function init() {
        suite = params.get("suite") || localStorage.getItem("SpecRunner.suite") || "UnitTestSuite";
        
        // Create a top-level filter to show/hide performance and extensions tests
        var isPerfSuite = (suite === "PerformanceTestSuite"),
            isExtSuite = (suite === "ExtensionTestSuite");
        
        var topLevelFilter = function (spec) {
            var suite = spec.suite;
            
            // unit test suites have no category
            if (!isPerfSuite && !isExtSuite) {
                if (spec.category !== undefined) {
                    // if an individualy spec has a category, filter it out
                    return false;
                }
                
                while (suite) {
                    if (suite.category !== undefined) {
                        // any suite in the hierarchy may specify a category
                        return false;
                    }
                    
                    suite = suite.parentSuite;
                }
                
                return true;
            }
            
            var category = (isPerfSuite) ? "performance" : "extension";
            
            if (spec.category === category) {
                return true;
            }
            
            while (suite) {
                if (suite.category === category) {
                    return true;
                }
                
                suite = suite.parentSuite;
            }
            
            return false;
        };
        
        /*
         * TODO (jason-sanjose): extension unit tests should only load the
         * extension and the extensions dependencies. We should not load
         * unrelated extensions. Currently, this solution is all or nothing.
         */
        
        // configure spawned test windows to load extensions
        SpecRunnerUtils.setLoadExtensionsInTestWindow(isExtSuite);
        
        _loadExtensionTests(suite).done(function () {
            var jasmineEnv = jasmine.getEnv();
    
            // Initiailize unit test preferences for each spec
            beforeEach(function () {
                // Unique key for unit testing
                localStorage.setItem("preferencesKey", SpecRunnerUtils.TEST_PREFERENCES_KEY);
            });
            
            afterEach(function () {
                // Clean up preferencesKey
                localStorage.removeItem("preferencesKey");
            });
            
            jasmineEnv.updateInterval = 1000;
            
            jasmineEnv.addReporter(new jasmine.BootstrapReporter(document, topLevelFilter));
            
            // add performance reporting
            if (isPerfSuite) {
                jasmineEnv.addReporter(new PerformanceReporter());
            }
            
            // remember the suite for the next unit test window launch
            localStorage.setItem("SpecRunner.suite", suite);
            
            $(window.document).ready(_documentReadyHandler);
        });
    }

    init();
});
