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

/*global describe, beforeEach, afterEach, it, runs, waitsForDone */

// TODO: Eventually we should have a brackets performance test suite that is separate from the unit tests

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var CommandManager,             // loaded from brackets.test
        Commands,                   // loaded from brackets.test
        DocumentCommandHandlers,    // loaded from brackets.test
        PerfUtils,                  // loaded from brackets.test
        DocumentManager,            // loaded from brackets.test
        SpecRunnerUtils             = require("spec/SpecRunnerUtils"),
        UnitTestReporter            = require("test/UnitTestReporter");

    var jsLintCommand, jsLintPrevSetting;

    describe("Performance Tests", function () {

        this.category = "performance";

        // Note: this tests assumes that the "brackets-scenario" repo is in the same folder
        //       as the "brackets-app"
        //
        // TODO: these tests rely on real world example files that cannot be on open source.
        // We should replace these with test files that can be in the public repro.
        var testPath = SpecRunnerUtils.getTestPath("/perf/OpenFile-perf-files/"),
            testWindow;

        function openFile(path) {
            var fullPath = testPath + path;
            runs(function () {
                var promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath});
                waitsForDone(promise);
            });

            runs(function () {
                var reporter = UnitTestReporter.getActiveReporter();
                reporter.logTestWindow(/Open File:\t,*/, path);
                reporter.clearTestWindow();
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

                jsLintCommand = CommandManager.get("jslint.toggleEnabled");
                if (jsLintCommand) {
                    jsLintPrevSetting = jsLintCommand.getChecked();
                    if (jsLintPrevSetting) {
                        jsLintCommand.execute();
                    }
                }
            });
        });

        afterEach(function () {
            testWindow              = null;
            CommandManager          = null;
            Commands                = null;
            DocumentCommandHandlers = null;
            DocumentManager         = null;
            PerfUtils               = null;
            SpecRunnerUtils.closeTestWindow();
        });


        // TODO: right now these are in a single test because performance results are
        // tied to a window, so we need one window for all the tests. Need to think
        // more about how performance tests should ultimately work.
        it("File open performance", function () {
            openFile("brackets-concat.js"); // 3.4MB
            openFile("jquery_ui_index.html");
            openFile("blank.js");
            openFile("InlineWidget.js");
            openFile("quiet-scrollbars.css");
            openFile("England(Chinese).htm");
            openFile("jquery.mobile-1.1.0.css");
            openFile("jquery.mobile-1.1.0.min.css");
            openFile("jquery.mobile-1.1.0.js");
            openFile("jquery.mobile-1.1.0.min.js");
        });
    });
});
