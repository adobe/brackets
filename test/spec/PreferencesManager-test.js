/*
 *  Modified Work Copyright (c) 2021 - present core.ai . All rights reserved.
 *  Original work Copyright (c) 2017 - 2021 Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, expect, beforeEach, runs, beforeFirst, afterLast, spyOn, waitsForDone */

define(function (require, exports, module) {


    // Load dependent modules
    var SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        testPath                = SpecRunnerUtils.getTestPath("/spec/PreferencesBase-test-files"),
        nonProjectFile          = SpecRunnerUtils.getTestPath("/spec/PreferencesBase-test.js"),
        PreferencesManager,
        testWindow;

    describe("PreferencesManager", function () {
        this.category = "integration";

        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                PreferencesManager = testWindow.brackets.test.PreferencesManager;
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterLast(function () {
            PreferencesManager = null;
            SpecRunnerUtils.closeTestWindow();
        });

        it("should find preferences in the project", function () {
            var projectWithoutSettings = SpecRunnerUtils.getTestPath("/spec/WorkingSetView-test-files"),
                FileViewController = testWindow.brackets.test.FileViewController;
            waitsForDone(SpecRunnerUtils.openProjectFiles(".brackets.json"));

            runs(function () {
                expect(PreferencesManager.get("spaceUnits")).toBe(9);
                waitsForDone(FileViewController.openAndSelectDocument(nonProjectFile,
                             FileViewController.WORKING_SET_VIEW));

            });

            runs(function () {
                expect(PreferencesManager.get("spaceUnits")).not.toBe(9);

                // Changing projects will force a change in the project scope.
                SpecRunnerUtils.loadProjectInTestWindow(projectWithoutSettings);
            });
            runs(function () {
                waitsForDone(SpecRunnerUtils.openProjectFiles("file_one.js"));
            });
            runs(function () {
                expect(PreferencesManager.get("spaceUnits")).not.toBe(9);
            });
        });
    });
});
