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
    baseUrl: "../src"/*,
    urlArgs: "bust=" + (new Date()).getTime() // cache busting */
});

define(function (require, exports, module) {
    'use strict';
    
    // Utility dependency
    var SpecRunnerUtils = require("spec/SpecRunnerUtils.js"),
        PerformanceReporter = require("perf/PerformanceReporter.js").PerformanceReporter;
    
    var suite;
    
    beforeEach(function () {
        // Unique key for unit testing
        localStorage.setItem("preferencesKey", SpecRunnerUtils.TEST_PREFERENCES_KEY);
    });
    
    afterEach(function () {
        // Clean up preferencesKey
        localStorage.removeItem("preferencesKey");
    });
        
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
        
        jasmineEnv.updateInterval = 1000;
        
        window.onload = function () {
            if (currentWindowOnload) {
                currentWindowOnload();
            }
            
            jasmineEnv.addReporter(new jasmine.BootstrapReporter(document));
            
            $("#show-dev-tools").click(function () {
                brackets.app.showDeveloperTools();
            });
            $("#reload").click(function () {
                window.location.reload(true);
            });
            
            suite = getParamMap().suite || localStorage.getItem("SpecRunner.suite") || "UnitTestSuite";
            
            // add performance reporting
            if (suite === "PerformanceTestSuite") {
                jasmineEnv.addReporter(new PerformanceReporter());
            }
            
            localStorage.setItem("SpecRunner.suite", suite);
            
            $("#" + suite).closest("li").toggleClass("active", true);
            
            var jsonResult = $.getJSON(suite + ".json");
            
            jsonResult.done(function (data) {
                // load specs and run jasmine
                require(data.specs, function () {
                    jasmineEnv.execute();
                });
            });
        };
    }

    init();
});
