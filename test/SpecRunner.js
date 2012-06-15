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
        "spec": "../test/spec"
    }
});

define(function (require, exports, module) {
    'use strict';
    
    // Utility dependency
    var SpecRunnerUtils     = require("spec/SpecRunnerUtils"),
        PerformanceReporter = require("perf/PerformanceReporter").PerformanceReporter,
        ExtensionLoader     = require("utils/ExtensionLoader"),
        FileUtils           = require("file/FileUtils"),
        Menus               = require("command/Menus");
    
    // Load both top-level suites. Filtering is applied at the top-level as a filter to BootstrapReporter.
    require("test/UnitTestSuite");
    require("test/PerformanceTestSuite");
    
    var suite;
        
    function getParamMap() {
        var params = document.location.search.substring(1).split('&'),
            paramMap = {},
            i,
            p;
    
        for (i = 0; i < params.length; i++) {
            p = params[i].split('=');
            paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
        }
        
        return paramMap;
    }
    
    function init() {
        var jasmineEnv = jasmine.getEnv(),
            runner = jasmineEnv.currentRunner(),
            currentWindowOnload = window.onload;
        
        // TODO: Issue 949 - the following code should be shared

        // Define core brackets namespace if it isn't already defined
        //
        // We can't simply do 'brackets = {}' to define it in the global namespace because
        // we're in "use strict" mode. Most likely, 'window' will always point to the global
        // object when this code is running. However, in case it isn't (e.g. if we're running 
        // inside Node for CI testing) we use this trick to get the global object.
        //
        // Taken from:
        //   http://stackoverflow.com/questions/3277182/how-to-get-the-global-object-in-javascript
        var Fn = Function, global = (new Fn('return this'))();
        if (!global.brackets) {
            global.brackets = {};
        }

        // Loading extensions requires creating new require.js contexts, which requires access to the global 'require' object
        // that always gets hidden by the 'require' in the AMD wrapper. We store this in the brackets object here so that 
        // the ExtensionLoader doesn't have to have access to the global object.
        brackets.libRequire = global.require;

        // Also store our current require.js context (the one that loads brackets core modules) so that extensions can use it
        // Note: we change the name to "getModule" because this won't do exactly the same thing as 'require' in AMD-wrapped
        // modules. The extension will only be able to load modules that have already been loaded once.
        brackets.getModule = require;

        var bracketsPath = FileUtils.getNativeBracketsDirectoryPath();

        // This returns path to test folder, so convert to src
        bracketsPath = bracketsPath.replace("brackets/test", "brackets/src");

        ExtensionLoader.testAllExtensionsInNativeDirectory(
            bracketsPath + "/extensions/default",
            "extensions/default"
        );
        ExtensionLoader.testAllExtensionsInNativeDirectory(
            bracketsPath + "/extensions/user",
            "extensions/user"
        );

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
        
        window.onload = function () {
            if (currentWindowOnload) {
                currentWindowOnload();
            }
            
            $("#show-dev-tools").click(function () {
                brackets.app.showDeveloperTools();
            });
            $("#reload").click(function () {
                window.location.reload(true);
            });
            
            suite = getParamMap().suite || localStorage.getItem("SpecRunner.suite") || "UnitTestSuite";
            
            // Create a top-level filter to show/hide performance tests
            var isPerfSuite = (suite === "PerformanceTestSuite"),
                performanceFilter = function (spec) {
                    if (spec.performance === true) {
                        return isPerfSuite;
                    }
                    
                    var suite = spec.suite;
                    
                    while (suite) {
                        if (suite.performance === true) {
                            return isPerfSuite;
                        }
                        
                        suite = suite.parentSuite;
                    }
                    
                    return !isPerfSuite;
                };
            
            jasmineEnv.addReporter(new jasmine.BootstrapReporter(document, performanceFilter));
            
            // add performance reporting
            if (isPerfSuite) {
                jasmineEnv.addReporter(new PerformanceReporter());
            }
            
            localStorage.setItem("SpecRunner.suite", suite);
            
            $("#" + suite).closest("li").toggleClass("active", true);
            
            jasmineEnv.execute();
        };
    }

    init();
});
