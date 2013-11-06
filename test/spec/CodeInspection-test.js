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
   
    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem;

    describe("Code Inspection", function () {
        this.category = "integration";

        var testFolder = SpecRunnerUtils.getTestPath("/spec/CodeInspection-test-files/"),
            testWindow,
            $,
            brackets,
            CodeInspection,
            EditorManager,
            previousState;

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
                    EditorManager = brackets.test.EditorManager;
                    CodeInspection = brackets.test.CodeInspection;
                    CodeInspection.toggleEnabled(true);
                    // enable JSLint and preserve the previous state before we enable it for testing
//                    previousState = CodeInspection._getProviderState({name: "JSLint"});
//                    CodeInspection._setProviderState({name: "JSLint"}, true);
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

            // revert to previous state
//            CodeInspection._setProviderState({name: 'JSLint'}, previousState);
        });
        
        it("should run one linter when a javascript document opens", function () {
            var called = false,
                promise;
            
            CodeInspection.unregisterAll();
            CodeInspection.register("javascript", {
                name: "text linter",
                scanFile: function (text, fullPath) { called = true; return {errors: []}; }
            });

            runs(function () {
                var simpleTextFileEntry = new NativeFileSystem.FileEntry(testFolder + "/errors.js");
                promise = CodeInspection.inspectFile(simpleTextFileEntry);
                
                waitsForDone(promise, "file linting", 5000);
            });
            
            runs(function () {
                expect(called).toBeTruthy();
            });
        });
        
        it("should run two linters when a javascript document opens", function () {
            var linterOneCalled = false,
                linterTwoCalled = false,
                promise;
            
            CodeInspection.unregisterAll();
            CodeInspection.register("javascript", {
                name: "text linter 1",
                scanFile: function (text, fullPath) { linterOneCalled = true; return {errors: []}; }
            });
            CodeInspection.register("javascript", {
                name: "text linter 2",
                scanFile: function (text, fullPath) { linterTwoCalled = true; return {errors: []}; }
            });

            runs(function () {
                var simpleTextFileEntry = new NativeFileSystem.FileEntry(testFolder + "/errors.js");
                promise = CodeInspection.inspectFile(simpleTextFileEntry);
                
                waitsForDone(promise, "file linting", 5000);
            });
            
            runs(function () {
                expect(linterOneCalled).toBeTruthy();
                expect(linterTwoCalled).toBeTruthy();
            });
        });

        it("should run one linter when a javascript document opens and return some errors", function () {
            var called = false,
                result,
                promise;

            var lintResult = {
                pos: { line: 2, ch: 3 },
                message: "Some errors here and there",
                type: CodeInspection.Type.WARNING
            };

            CodeInspection.unregisterAll();
            CodeInspection.register("javascript", {
                name: "text linter",
                scanFile: function (text, fullPath) {
                    called = true;
                    return {
                        errors: [lintResult]
                    };
                }
            });

            runs(function () {
                var simpleTextFileEntry = new NativeFileSystem.FileEntry(testFolder + "/errors.js");
                promise = CodeInspection.inspectFile(simpleTextFileEntry);
                promise.done(function (lintingResult) {
                    result = lintingResult;
                });
                
                waitsForDone(promise, "file linting", 5000);
            });
            
            runs(function () {
                expect(called).toBeTruthy();
                expect(result.length).toEqual(1);
                expect(result[0].item.name).toEqual("text linter");
                expect(result[0].results.errors.length).toEqual(1);
            });
        });
        
        it("should run two linter when a javascript document opens and return some errors", function () {
            var result,
                promise;

            var lintResult = {
                pos: { line: 2, ch: 3 },
                message: "Some errors here and there",
                type: CodeInspection.Type.WARNING
            };

            CodeInspection.unregisterAll();
            CodeInspection.register("javascript", {
                name: "text linter 1",
                scanFile: function (text, fullPath) {
                    return {
                        errors: [lintResult]
                    };
                }
            });

            CodeInspection.register("javascript", {
                name: "text linter 2",
                scanFile: function (text, fullPath) {
                    return {
                        errors: [lintResult]
                    };
                }
            });

            runs(function () {
                var simpleTextFileEntry = new NativeFileSystem.FileEntry(testFolder + "/errors.js");
                promise = CodeInspection.inspectFile(simpleTextFileEntry);
                promise.done(function (lintingResult) {
                    result = lintingResult;
                });
                
                waitsForDone(promise, "file linting", 5000);
            });
            
            runs(function () {
                expect(result.length).toEqual(2);
                expect(result[0].results.errors.length).toEqual(1);
                expect(result[1].results.errors.length).toEqual(1);
            });
        });
        
        describe("Check the Code Inspection UI", function () {
            beforeEach(function () {
                CodeInspection.unregisterAll();
                
                var lintResult = {
                    pos: { line: 1, ch: 3 },
                    message: "Some errors here and there",
                    type: CodeInspection.Type.WARNING
                };

                CodeInspection.register("javascript", {
                    name: "text linter 1",
                    scanFile: function (text, fullPath) {
                        return {
                            errors: [lintResult]
                        };
                    }
                });
            });
            
            it("should run test linter when a JavaScript document opens and indicate errors in panel", function () {
                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);
                
                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(true);
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);
                });
            });
        });
        
        
        xit("status icon should toggle Errors panel when errors present", function () {
//            waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");
            runs(function () {
                var promise = SpecRunnerUtils.openProjectFiles(["errors.js"]);
                waitsForDone(promise);
            });
            
            runs(function () {
                toggleJSLintResults(false);
                toggleJSLintResults(true);
            });
        });
        
        xit("status icon should not toggle Errors panel when no errors present", function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test file");
            
            runs(function () {
                toggleJSLintResults(false);
                toggleJSLintResults(false);
            });
        });
    });
});
