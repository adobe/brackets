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
        "test"      : "../test",
        "perf"      : "../test/perf",
        "spec"      : "../test/spec",
        "text"      : "thirdparty/text",
        "i18n"      : "thirdparty/i18n"
    }
});

define(function (require, exports, module) {
    'use strict';
    
    // Utility dependency
    var AppInit                 = require("utils/AppInit"),
        Global                  = require("utils/Global"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        ExtensionLoader         = require("utils/ExtensionLoader"),
        Async                   = require("utils/Async"),
        FileUtils               = require("file/FileUtils"),
        Menus                   = require("command/Menus"),
        NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
        UrlParams               = require("utils/UrlParams").UrlParams,
        UnitTestReporter        = require("test/UnitTestReporter").UnitTestReporter,
        NodeConnection          = require("utils/NodeConnection"),
        BootstrapReporterView   = require("test/BootstrapReporterView").BootstrapReporterView;

    // Load modules that self-register and just need to get included in the main project
    require("document/ChangedDocumentTracker");
    
    
    // TODO (#2155): These are used by extensions via brackets.getModule(), so tests that run those
    // extensions need these to be required up front. We need a better solution for this eventually.
    require("utils/ExtensionUtils");
    
    // Load both top-level suites. Filtering is applied at the top-level as a filter to BootstrapReporter.
    require("test/UnitTestSuite");
    require("test/PerformanceTestSuite");
    
    var selectedSuite,
        params = new UrlParams(),
        reporter,
        _nodeConnectionDeferred = new $.Deferred(),
        reporterView;
    
    /**
     * @const
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the installer in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 30000; // 30 seconds - TODO: share with StaticServer?

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
        
        $("#" + selectedSuite).closest("li").toggleClass("active", true);
        
        AppInit._dispatchReady(AppInit.APP_READY);
        
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
        // Start up the node connection, which is held in the
        // _nodeConnectionDeferred module variable. (Use 
        // _nodeConnectionDeferred.done() to access it.
        
        // This is in SpecRunner rather than SpecRunnerUtils because the hope
        // is to hook up jasmine-node tests in this test runner.
        
        // TODO: duplicates code from StaticServer
        // TODO: can this be done lazily?
        
        var connectionTimeout = setTimeout(function () {
            console.error("[SpecRunner] Timed out while trying to connect to node");
            _nodeConnectionDeferred.reject();
        }, NODE_CONNECTION_TIMEOUT);
        
        var _nodeConnection = new NodeConnection();
        _nodeConnection.connect(true).then(function () {
            var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/../test/node/TestingDomain";
            
            _nodeConnection.loadDomains(domainPath, true)
                .then(
                    function () {
                        clearTimeout(connectionTimeout);
                        _nodeConnectionDeferred.resolve(_nodeConnection);
                    },
                    function () { // Failed to connect
                        console.error("[SpecRunner] Failed to connect to node", arguments);
                        clearTimeout(connectionTimeout);
                        _nodeConnectionDeferred.reject();
                    }
                );
        });

        selectedSuite = params.get("suite") || localStorage.getItem("SpecRunner.suite") || "UnitTestSuite";
        
        // Create a top-level filter to show/hide performance and extensions tests
        var runAll = (selectedSuite === "all"),
            isPerfSuite = (selectedSuite === "PerformanceTestSuite"),
            isExtSuite = (selectedSuite === "ExtensionTestSuite"),
            isIntegrationSuite = (selectedSuite === "IntegrationTestSuite"),
            category;
            
        if (isPerfSuite) {
            category = "performance";
        } else if (isIntegrationSuite) {
            category = "integration";
        } else if (isExtSuite) {
            category = "extension";
        }
        
        var topLevelFilter = function (spec) {
            // special case "all" suite to run unit, perf, extension, and integration tests
            if (runAll) {
                return true;
            }

            var currentSuite = spec.suite;
            
            // unit test suites have no category
            if (!isPerfSuite && !isExtSuite && !isIntegrationSuite) {
                if (spec.category !== undefined) {
                    // if an individualy spec has a category, filter it out
                    return false;
                }
                
                while (currentSuite) {
                    if (currentSuite.category !== undefined) {
                        // any suite in the hierarchy may specify a category
                        return false;
                    }
                    
                    currentSuite = currentSuite.parentSuite;
                }
                
                return true;
            }
            
            if (spec.category === category) {
                return true;
            }
            
            while (currentSuite) {
                if (currentSuite.category === category) {
                    return true;
                }
                
                currentSuite = currentSuite.parentSuite;
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
        
        _loadExtensionTests(selectedSuite).done(function () {
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
            localStorage.setItem("SpecRunner.suite", selectedSuite);
            
            $(window.document).ready(_documentReadyHandler);
        });
    }

    /**
     * Allows access to the deferred that manages the node connection for tests.
     *
     * @return {jQuery.Deferred} The deferred that manages the node connection
     */
    function getNodeConnectionDeferred() {
        return _nodeConnectionDeferred;
    }
    
    // this is used by SpecRunnerUtils
    brackets.testing = {
        getNodeConnectionDeferred: getNodeConnectionDeferred
    };

    init();
});
