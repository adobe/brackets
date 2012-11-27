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
/*global require, define, $, beforeEach, afterEach, jasmine, brackets, PathUtils */

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
    var Global                  = require("utils/Global"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        ExtensionLoader         = require("utils/ExtensionLoader"),
        Async                   = require("utils/Async"),
        FileUtils               = require("file/FileUtils"),
        Menus                   = require("command/Menus"),
        NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
        UrlParams               = require("utils/UrlParams").UrlParams,
        UnitTestReporter        = require("test/UnitTestReporter").UnitTestReporter,
        BootstrapReporterView   = require("test/BootstrapReporterView").BootstrapReporterView;

    // Load modules that self-register and just need to get included in the main project
    require("document/ChangedDocumentTracker");
    
    // TODO (#2155): These are used by extensions via brackets.getModule(), so tests that run those
    // extensions need these to be required up front. We need a better solution for this eventually.
    require("utils/ExtensionUtils");
    
    // Load both top-level suites. Filtering is applied at the top-level as a filter to BootstrapReporter.
    require("test/UnitTestSuite");
    require("test/PerformanceTestSuite");
    
    var suite,
        params = new UrlParams(),
        reporter,
        reporterView;
    
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
        
        // load dev and user extensions only when running the extension test suite
        if (suite === "ExtensionTestSuite") {
            paths.push("dev");
            paths.push(ExtensionLoader.getUserExtensionPath());
        }
        
        // This returns path to test folder, so convert to src
        bracketsPath = bracketsPath.replace(/\/test$/, "/src");

        return Async.doInParallel(paths, function (dir) {
            var extensionPath = dir;
            
            // If the item has "/" in it, assume it is a full path. Otherwise, load
            // from our source path + "/extensions/".
            if (dir.indexOf("/") === -1) {
                extensionPath = bracketsPath + "/extensions/" + dir;
            }
            
            return ExtensionLoader.testAllExtensionsInNativeDirectory(extensionPath);
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
    
    /**
     * Listener for UnitTestReporter "runnerEnd" event. Attached only if
     * "resultsPath" URL parameter exists. Does not overwrite existing file.
     * Writes UnitTestReporter spec results as formatted JSON.
     * @param {!$.Event} event
     * @param {!UnitTestReporter} reporter
     */
    function _runnerEndHandler(event, reporter) {
        var resultsPath = params.get("resultsPath"),
            json = reporter.toJSON(),
            deferred = new $.Deferred();
        
        // check if the file already exists
        brackets.fs.stat(resultsPath, function (err, stat) {
            if (err === brackets.fs.ERR_NOT_FOUND) {
                // file not found, write the new file with JSON content
                brackets.fs.writeFile(resultsPath, json, NativeFileSystem._FSEncodings.UTF8, function (err) {
                    if (err) {
                        deferred.reject();
                    } else {
                        deferred.resolve();
                    }
                });
            } else {
                // file exists, do not overwrite
                deferred.reject();
            }
        });
        
        deferred.always(function () { window.close(); });
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
            
            // Create the reporter, which is really a model class that just gathers
            // spec and performance data.
            reporter = new UnitTestReporter(jasmineEnv, topLevelFilter, params.get("spec"));
            
            // Optionally emit JSON for automated runs
            if (params.get("resultsPath")) {
                $(reporter).on("runnerEnd", _runnerEndHandler);
            }
            
            jasmineEnv.addReporter(reporter);
            
            // Create the view that displays the data from the reporter. (Usually in
            // Jasmine this is part of the reporter, but we separate them out so that
            // we can more easily grab just the model data for output during automatic
            // testing.)
            reporterView = new BootstrapReporterView(document, reporter);
            
            // remember the suite for the next unit test window launch
            localStorage.setItem("SpecRunner.suite", suite);
            
            $(window.document).ready(_documentReadyHandler);
        });
    }

    init();
});
