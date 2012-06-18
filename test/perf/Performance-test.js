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
/*global define, describe, beforeEach, afterEach, it, runs, waitsFor, expect, brackets */

// TODO: Eventually we should have a brackets performance test suite that is separate from the unit tests

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var CommandManager,             // loaded from brackets.test
        Commands,                   // loaded from brackets.test
        DocumentCommandHandlers,    // loaded from brackets.test
        PerfUtils,                  // loaded from brackets.test
        JSLintUtils,                // loaded from brackets.test
        DocumentManager,            // loaded from brackets.test
        SpecRunnerUtils             = require("spec/SpecRunnerUtils"),
        PerformanceReporter         = require("perf/PerformanceReporter");

    var jsLintPrevSetting;

    describe("Performance Tests", function () {
        
        this.performance = true;
        
        // Note: this tests assumes that the "brackets-scenario" repo is in the same folder
        //       as the "brackets-app"
        //
        // TODO: these tests rely on real world example files that cannot be on open source. 
        // We should replace these with test files that can be in the public repro.
        var testPath = SpecRunnerUtils.getTestPath("/../../../brackets-scenario/OpenFileTest/"),
            testWindow;
        
        function openFile(path) {
            var didOpen = false, gotError = false;
        
            runs(function () {
                CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + path})
                    .done(function () {
                        didOpen = true;
                    })
                    .fail(function () { gotError = true; });
            });
            waitsFor(function () { return didOpen && !gotError; }, 1000);
            
            runs(function () {
                PerformanceReporter.logTestWindow(PerfUtils.OPEN_FILE, path);
                PerformanceReporter.clearTestWindow();
            });
        }
        
        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
        
                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                DocumentCommandHandlers = testWindow.brackets.test.DocumentCommandHandlers;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
                PerfUtils           = testWindow.brackets.test.PerfUtils;
                JSLintUtils         = testWindow.brackets.test.JSLintUtils;
        
                jsLintPrevSetting = JSLintUtils.getEnabled();
                JSLintUtils.setEnabled(false);
            });
        });
        
        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });
        
        
        // TODO: right now these are in a single test because performance results are
        // tied to a window, so we need one window for all the tests. Need to think
        // more about how performance tests should ultimately work.
        it("File open performance", function () {
            openFile("all-classes.js");
            openFile("jquery_ui_index.html");
            openFile("blank.js");
            openFile("example-data.js");
            openFile("sink.css");
            openFile("England(Chinese).htm");
            openFile("jquery.mobile-1.1.0.css");
            openFile("jquery.mobile-1.1.0.min.css");
            openFile("jquery.mobile-1.1.0.js");
            openFile("jquery.mobile-1.1.0.min.js");
        });
    });
});