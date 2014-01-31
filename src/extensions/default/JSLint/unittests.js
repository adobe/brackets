/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, brackets, waitsForDone, spyOn */

define(function (require, exports, module) {
    "use strict";
   
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        FileUtils       = brackets.getModule("file/FileUtils");

    describe("JSLint", function () {
        var testFolder = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files/",
            testWindow,
            $,
            brackets,
            CodeInspection,
            EditorManager;
        
        var toggleJSLintResults = function (visible) {
            $("#status-inspection").triggerHandler("click");
            expect($("#problems-panel").is(":visible")).toBe(visible);
        };

        beforeEach(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    // Load module instances from brackets.test
                    $ = testWindow.$;
                    brackets = testWindow.brackets;
                    EditorManager = testWindow.brackets.test.EditorManager;
                    CodeInspection = testWindow.brackets.test.CodeInspection;
                    CodeInspection.toggleEnabled(true);
                });
            });
            
            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testFolder);
            });
        });
        
        afterEach(function () {
            testWindow    = null;
            $             = null;
            brackets      = null;
            EditorManager = null;
            SpecRunnerUtils.closeTestWindow();
        });
        
        it("should run JSLint linter when a JavaScript document opens", function () {
            runs(function () {
                spyOn(testWindow, "JSLINT").andCallThrough();
            });
            
            waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");
            
            runs(function () {
                expect(testWindow.JSLINT).toHaveBeenCalled();
            });
        });
        
        it("status icon should toggle Errors panel when errors present", function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");
            
            runs(function () {
                toggleJSLintResults(false);
                toggleJSLintResults(true);
            });
        });
        
        it("status icon should not toggle Errors panel when no errors present", function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test file");
            
            runs(function () {
                toggleJSLintResults(false);
                toggleJSLintResults(false);
            });
        });
        
        it("should default to the editor's indent", function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles(["different-indent.js"]), "open test file");
            
            runs(function () {
                toggleJSLintResults(false);
                toggleJSLintResults(false);
            });
        });
    });
});
