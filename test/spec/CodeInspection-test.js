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
/*global define, describe, it, expect, beforeEach, beforeFirst, afterEach, afterLast, waitsFor, waits, runs, brackets, waitsForDone, spyOn, xit, jasmine */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils  = require("spec/SpecRunnerUtils"),
        FileSystem       = require("filesystem/FileSystem"),
        StringUtils      = require("utils/StringUtils"),
        Strings;

    describe("Code Inspection", function () {
        this.category = "integration";

        var testFolder = SpecRunnerUtils.getTestPath("/spec/CodeInspection-test-files/"),
            testWindow,
            $,
            brackets,
            CodeInspection,
            CommandManager,
            Commands  = require("command/Commands"),
            EditorManager,
            prefs;

        var toggleJSLintResults = function (visible) {
            $("#status-inspection").triggerHandler("click");
            expect($("#problems-panel").is(":visible")).toBe(visible);
        };

        function createCodeInspector(name, result) {
            var provider = {
                name: name,
                // arguments to this function: text, fullPath
                // omit the warning
                scanFile: function () { return result; }
            };

            spyOn(provider, "scanFile").andCallThrough();

            return provider;
        }
        
        function createAsyncCodeInspector(name, result, scanTime, syncImpl) {
            var provider = {
                name: name,
                scanFileAsync: function () {
                    var deferred = new $.Deferred();
                    setTimeout(function () {
                        deferred.resolve(result);
                    }, scanTime);
                    return deferred.promise();
                }
            };
            spyOn(provider, "scanFileAsync").andCallThrough();
            
            if (syncImpl) {
                provider.scanFile = function () {
                    return result;
                };
                spyOn(provider, "scanFile").andCallThrough();
            }
            
            return provider;
        }

        function successfulLintResult() {
            return {errors: []};
        }

        function failLintResult() {
            return {
                errors: [
                    {
                        pos: { line: 1, ch: 3 },
                        message: "Some errors here and there",
                        type: CodeInspection.Type.WARNING
                    }
                ]
            };
        }

        beforeFirst(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    // Load module instances from brackets.test
                    $ = testWindow.$;
                    brackets = testWindow.brackets;
                    Strings = testWindow.require("strings");
                    CommandManager = brackets.test.CommandManager;
                    EditorManager = brackets.test.EditorManager;
                    prefs = brackets.test.PreferencesManager.getExtensionPrefs("linting");
                    CodeInspection = brackets.test.CodeInspection;
                    CodeInspection.toggleEnabled(true);
                });
            });

            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testFolder);
            });
        });
        
        beforeEach(function () {
            // this is to make the tests run faster
            prefs.set(CodeInspection._PREF_ASYNC_TIMEOUT, 500);
        });

        afterEach(function () {
            testWindow.closeAllFiles();
        });

        afterLast(function () {
            testWindow    = null;
            $             = null;
            brackets      = null;
            CommandManager = null;
            EditorManager = null;
            SpecRunnerUtils.closeTestWindow();
        });

        describe("Unit level tests", function () {
            var simpleJavascriptFileEntry;

            beforeEach(function () {
                CodeInspection._unregisterAll();
                simpleJavascriptFileEntry = new FileSystem.getFileForPath(testFolder + "/errors.js");
            });

            it("should run a single registered linter", function () {
                var codeInspector = createCodeInspector("text linter", successfulLintResult());
                CodeInspection.register("javascript", codeInspector);

                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);

                    waitsForDone(promise, "file linting", 5000);
                });

                runs(function () {
                    expect(codeInspector.scanFile).toHaveBeenCalled();
                });
            });

            it("should run two linters", function () {
                var codeInspector1 = createCodeInspector("text linter 1", successfulLintResult());
                var codeInspector2 = createCodeInspector("text linter 2", successfulLintResult());

                CodeInspection.register("javascript", codeInspector1);
                CodeInspection.register("javascript", codeInspector2);

                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);

                    waitsForDone(promise, "file linting", 5000);
                });

                runs(function () {
                    expect(codeInspector1.scanFile).toHaveBeenCalled();
                    expect(codeInspector2.scanFile).toHaveBeenCalled();
                });
            });

            it("should run one linter return some errors", function () {
                var result;

                var codeInspector1 = createCodeInspector("javascript linter", failLintResult());
                CodeInspection.register("javascript", codeInspector1);

                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);
                    promise.done(function (lintingResult) {
                        result = lintingResult;
                    });

                    waitsForDone(promise, "file linting", 5000);
                });

                runs(function () {
                    expect(codeInspector1.scanFile).toHaveBeenCalled();
                    expect(result.length).toEqual(1);
                    expect(result[0].provider.name).toEqual("javascript linter");
                    expect(result[0].result.errors.length).toEqual(1);
                });
            });

            it("should run two linter and return some errors", function () {
                var result;

                var codeInspector1 = createCodeInspector("javascript linter 1", failLintResult());
                var codeInspector2 = createCodeInspector("javascript linter 2", failLintResult());
                CodeInspection.register("javascript", codeInspector1);
                CodeInspection.register("javascript", codeInspector2);

                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);
                    promise.done(function (lintingResult) {
                        result = lintingResult;
                    });

                    waitsForDone(promise, "file linting", 5000);
                });

                runs(function () {
                    expect(result.length).toEqual(2);
                    expect(result[0].result.errors.length).toEqual(1);
                    expect(result[1].result.errors.length).toEqual(1);
                });
            });

            it("should not call any other linter for javascript document", function () {
                var codeInspector1 = createCodeInspector("any other linter linter 1", successfulLintResult());
                CodeInspection.register("whatever", codeInspector1);

                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);

                    waitsForDone(promise, "file linting", 5000);
                });

                runs(function () {
                    expect(codeInspector1.scanFile).not.toHaveBeenCalled();
                });
            });

            it("should call linter even if linting on save is disabled", function () {
                var codeInspector1 = createCodeInspector("javascript linter 1", successfulLintResult());
                CodeInspection.register("javascript", codeInspector1);

                CodeInspection.toggleEnabled(false);

                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);

                    waitsForDone(promise, "file linting", 5000);
                });

                runs(function () {
                    expect(codeInspector1.scanFile).toHaveBeenCalled();

                    CodeInspection.toggleEnabled(true);
                });
            });

            it("should return no result if there is no linter registered", function () {
                var expectedResult;

                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);
                    promise.done(function (result) {
                        expectedResult = result;
                    });

                    waitsForDone(promise, "file linting", 5000);
                });

                runs(function () {
                    expect(expectedResult).toBeNull();
                });
            });
            
            it("should run asynchoronous implementation when both available in the provider", function () {
                var provider = createAsyncCodeInspector("javascript async linter with sync impl", failLintResult(), 200, true);
                CodeInspection.register("javascript", provider);
                
                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);
                                        
                    waitsForDone(promise, "file linting", 5000);
                });
                
                runs(function () {
                    expect(provider.scanFileAsync).toHaveBeenCalled();
                    expect(provider.scanFile).not.toHaveBeenCalled();
                });
                
            });

            it("should timeout on a provider that takes too long", function () {
                var provider = createAsyncCodeInspector("javascript async linter with sync impl", failLintResult(), 1500, true),
                    result;
                CodeInspection.register("javascript", provider);
                
                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);
                    promise.done(function (r) {
                        result = r;
                    });
                    
                    waitsForDone(promise, "file linting", 5000);
                });
                
                runs(function () {
                    expect(provider.scanFileAsync).toHaveBeenCalled();
                    expect(result).toBeDefined();
                    expect(result[0].provider).toEqual(provider);
                    expect(result[0].errors).toBeFalsy();
                });
                
            });
            
            it("should run two asynchronous providers and a synchronous one", function () {
                var asyncProvider1 = createAsyncCodeInspector("javascript async linter 1", failLintResult(), 200, true),
                    asyncProvider2 = createAsyncCodeInspector("javascript async linter 2", successfulLintResult(), 300, false),
                    syncProvider3 = createCodeInspector("javascript sync linter 3", failLintResult()),
                    result;
                CodeInspection.register("javascript", asyncProvider1);
                CodeInspection.register("javascript", asyncProvider2);
                CodeInspection.register("javascript", syncProvider3);
                
                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);
                    promise.done(function (r) {
                        result = r;
                    });
                    
                    waitsForDone(promise, "file linting", 5000);
                });
                
                runs(function () {
                    var i;
                    expect(result.length).toEqual(3);
                    
                    for (i = 0; i < result.length; i++) {
                        switch (result[i].provider.name) {
                        case asyncProvider1.name:
                            expect(asyncProvider1.scanFile).not.toHaveBeenCalled();
                            expect(asyncProvider2.scanFileAsync).toHaveBeenCalled();
                            break;
                        case asyncProvider2.name:
                            expect(asyncProvider2.scanFileAsync).toHaveBeenCalled();
                            break;
                        case syncProvider3.name:
                            expect(syncProvider3.scanFile).toHaveBeenCalled();
                            break;
                        default:
                            expect(true).toBe(false);
                            break;
                        }
                    }
                });
                
            });
            
            it("should return results for 3 providers when 2 completes and 1 times out", function () {
                var timeout         = prefs.get(CodeInspection._PREF_ASYNC_TIMEOUT),
                    asyncProvider1  = createAsyncCodeInspector("javascript async linter 1", failLintResult(), 200, true),
                    asyncProvider2  = createAsyncCodeInspector("javascript async linter 2", failLintResult(), timeout + 10, false),
                    syncProvider3   = createCodeInspector("javascript sync linter 3", failLintResult()),
                    result;
                CodeInspection.register("javascript", asyncProvider1);
                CodeInspection.register("javascript", asyncProvider2);
                CodeInspection.register("javascript", syncProvider3);

                runs(function () {
                    var promise = CodeInspection.inspectFile(simpleJavascriptFileEntry);
                    promise.done(function (r) {
                        result = r;
                    });
                    
                    waitsForDone(promise, "file linting", timeout + 10);
                });
                
                runs(function () {
                    var i;
                    expect(result.length).toEqual(3);
                    
                    for (i = 0; i < result.length; i++) {
                        switch (result[i].provider.name) {
                        case asyncProvider1.name:
                        case syncProvider3.name:
                            expect(result[i].result).toBeDefined();
                            expect(result[i].result).not.toBeNull();
                            break;
                        case asyncProvider2.name:
                            expect(result[i].result).toBeDefined();
                            expect(result[i].result.errors.length).toBe(1);
                            expect(result[i].result.errors[0].pos).toEqual({line: -1, col: 0});
                            expect(result[i].result.errors[0].message).toBe(StringUtils.format(Strings.LINTER_TIMED_OUT, "javascript async linter 2", prefs.get(CodeInspection._PREF_ASYNC_TIMEOUT)));
                            break;
                        default:
                            expect(true).toBe(false);
                            break;
                        }
                    }
                });
            });

        });

        describe("Code Inspection UI", function () {
            beforeEach(function () {
                CodeInspection._unregisterAll();
            });

            it("should run test linter when a JavaScript document opens and indicate errors in the panel", function () {
                var codeInspector = createCodeInspector("javascript linter", failLintResult());
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(true);
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);
                });
            });

            it("should show only warnings for the current file", function () {
                CodeInspection.toggleEnabled(false);
 
                var firstTime = true,
                    deferred1 = new $.Deferred(),
                    deferred2 = new $.Deferred();
 
                var asyncProvider = {
                    name: "Test Async Linter",
                    scanFileAsync: function () {
                        if (firstTime) {
                            firstTime = false;
                            return deferred1.promise();
                        } else {
                            return deferred2.promise();
                        }
                    }
                };

                CodeInspection.register("javascript", asyncProvider);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js", "errors.js"], "open test files"));

                runs(function () {
                    CodeInspection.toggleEnabled(true);
                    CommandManager.execute(Commands.FILE_CLOSE);
                });
                
                // Close the file which was started to lint
                runs(function () {
                    // let the linter finish
                    deferred1.resolve(failLintResult());
                    expect($("#problems-panel").is(":visible")).toBe(false);
                    deferred2.resolve(successfulLintResult());
                    expect($("#problems-panel").is(":visible")).toBe(false);
                });
            });

            it("should show problems panel after too many errors", function () {
                var lintResult = {
                    errors: [
                        {
                            pos: { line: 1, ch: 3 },
                            message: "Some errors here and there",
                            type: CodeInspection.Type.WARNING
                        },
                        {
                            pos: { line: 1, ch: 5 },
                            message: "Stopping. (33% scanned).",
                            type: CodeInspection.Type.META
                        }
                    ],
                    aborted: true
                };

                var codeInspector = createCodeInspector("javascript linter", lintResult);
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(true);
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);

                    var tooltip = $statusBar.attr("title");
                    // tooltip will contain + in the title if the inspection was aborted
                    expect(tooltip.lastIndexOf("+")).not.toBe(-1);
                });
            });

            it("should not run test linter when a JavaScript document opens and linting is disabled", function () {
                CodeInspection.toggleEnabled(false);

                var codeInspector = createCodeInspector("javascript linter", failLintResult());
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect(codeInspector.scanFile).not.toHaveBeenCalled();
                    expect($("#problems-panel").is(":visible")).toBe(false);
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);

                    CodeInspection.toggleEnabled(true);
                });
            });

            it("should not show the problems panel when there is no linting error", function () {
                var codeInspector = createCodeInspector("javascript linter", successfulLintResult());
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(false);
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);
                });
            });

            it("status icon should toggle Errors panel when errors present", function () {
                var codeInspector = createCodeInspector("javascript linter", failLintResult());
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    toggleJSLintResults(false);
                    toggleJSLintResults(true);
                });
            });

            it("should run two linters and display two expanded collapsible sections in the errors panel", function () {
                var codeInspector1 = createCodeInspector("javascript linter 1", failLintResult());
                var codeInspector2 = createCodeInspector("javascript linter 2", failLintResult());
                CodeInspection.register("javascript", codeInspector1);
                CodeInspection.register("javascript", codeInspector2);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    var $inspectorSections = $(".inspector-section td");
                    expect($inspectorSections.length).toEqual(2);
                    expect($inspectorSections[0].innerHTML.lastIndexOf("javascript linter 1 (1)")).not.toBe(-1);
                    expect($inspectorSections[1].innerHTML.lastIndexOf("javascript linter 2 (1)")).not.toBe(-1);

                    var $expandedInspectorSections = $inspectorSections.find(".expanded");
                    expect($expandedInspectorSections.length).toEqual(2);
                });
            });

            it("should run the linter and display no collapsible header section in the errors panel", function () {
                var codeInspector1 = createCodeInspector("javascript linter 1", failLintResult());
                CodeInspection.register("javascript", codeInspector1);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($(".inspector-section").is(":visible")).toBeFalsy();
                });
            });

            it("status icon should not toggle Errors panel when no errors present", function () {
                var codeInspector = createCodeInspector("javascript linter", successfulLintResult());
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test file");

                runs(function () {
                    toggleJSLintResults(false);
                    toggleJSLintResults(false);
                });
            });
            
            it("should show the error count and the name of the linter in the panel title for one error", function () {
                var codeInspector = createCodeInspector("JavaScript Linter", failLintResult());
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    var $problemPanelTitle = $("#problems-panel .title").text();
                    expect($problemPanelTitle).toBe(StringUtils.format(Strings.SINGLE_ERROR, "JavaScript Linter"));

                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);

                    var tooltip = $statusBar.attr("title");
                    expect(tooltip).toBe(StringUtils.format(Strings.SINGLE_ERROR, "JavaScript Linter"));
                });
            });

            it("should show the error count and the name of the linter in the panel title and tooltip for multiple errors", function () {
                var lintResult = {
                    errors: [
                        {
                            pos: { line: 1, ch: 3 },
                            message: "Some errors here and there",
                            type: CodeInspection.Type.WARNING
                        },
                        {
                            pos: { line: 1, ch: 5 },
                            message: "Some errors there and there and over there",
                            type: CodeInspection.Type.WARNING
                        }
                    ]
                };

                var codeInspector = createCodeInspector("JavaScript Linter", lintResult);
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    var $problemPanelTitle = $("#problems-panel .title").text();
                    expect($problemPanelTitle).toBe(StringUtils.format(Strings.MULTIPLE_ERRORS, "JavaScript Linter", 2));

                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);

                    var tooltip = $statusBar.attr("title");
                    expect(tooltip).toBe(StringUtils.format(Strings.MULTIPLE_ERRORS, "JavaScript Linter", 2));
                });
            });

            it("should show the generic panel title if more than one inspector reported problems", function () {
                var lintResult = failLintResult();

                var codeInspector1 = createCodeInspector("JavaScript Linter1", lintResult);
                CodeInspection.register("javascript", codeInspector1);
                var codeInspector2 = createCodeInspector("JavaScript Linter2", lintResult);
                CodeInspection.register("javascript", codeInspector2);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    var $problemPanelTitle = $("#problems-panel .title").text();
                    expect($problemPanelTitle).toBe(StringUtils.format(Strings.ERRORS_PANEL_TITLE_MULTIPLE, 2));

                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);

                    var tooltip = $statusBar.attr("title");
                    // tooltip will contain + in the title if the inspection was aborted
                    expect(tooltip).toBe(StringUtils.format(Strings.ERRORS_PANEL_TITLE_MULTIPLE, 2));
                });
            });

            it("should show no problems tooltip in status bar for multiple inspectors", function () {
                var codeInspector = createCodeInspector("JavaScript Linter1", successfulLintResult());
                CodeInspection.register("javascript", codeInspector);
                codeInspector = createCodeInspector("JavaScript Linter2", successfulLintResult());
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);

                    var tooltip = $statusBar.attr("title");
                    expect(tooltip).toBe(Strings.NO_ERRORS_MULTIPLE_PROVIDER);
                });
            });

            it("should show no problems tooltip in status bar for 1 inspector", function () {
                var codeInspector = createCodeInspector("JavaScript Linter1", successfulLintResult());
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);

                    var tooltip = $statusBar.attr("title");
                    expect(tooltip).toBe(StringUtils.format(Strings.NO_ERRORS, "JavaScript Linter1"));
                });
            });
            
            it("should Go to First Error with errors from only one provider", function () {
                var codeInspector = createCodeInspector("javascript linter", failLintResult());
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    CommandManager.execute(Commands.NAVIGATE_GOTO_FIRST_PROBLEM);
                    
                    expect(EditorManager.getActiveEditor().getCursorPos()).toEqual({line: 1, ch: 3});
                });
            });

            it("should Go to First Error with errors from two providers", function () {
                var codeInspector1 = createCodeInspector("javascript linter 1", {
                    errors: [
                        {
                            pos: { line: 1, ch: 3 },
                            message: "Some errors here and there",
                            type: CodeInspection.Type.WARNING
                        }
                    ]
                });
                var codeInspector2 = createCodeInspector("javascript linter 2", {
                    errors: [
                        {
                            pos: { line: 0, ch: 2 },
                            message: "Different error",
                            type: CodeInspection.Type.WARNING
                        }
                    ]
                });
                CodeInspection.register("javascript", codeInspector1);
                CodeInspection.register("javascript", codeInspector2);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    CommandManager.execute(Commands.NAVIGATE_GOTO_FIRST_PROBLEM);
                    
                    // 'first' error is in order of linter registration, not in line number order
                    expect(EditorManager.getActiveEditor().getCursorPos()).toEqual({line: 1, ch: 3});
                });
            });

            it("should handle missing or negative line numbers gracefully (https://github.com/adobe/brackets/issues/6441)", function () {
                var codeInspector1 = createCodeInspector("NoLineNumberLinter", {
                    errors: [
                        {
                            pos: { line: -1, ch: 0 },
                            message: "Some errors here and there",
                            type: CodeInspection.Type.WARNING
                        }
                    ]
                });

                var codeInspector2 = createCodeInspector("NoLineNumberLinter2", {
                    errors: [
                        {
                            pos: { line: "all", ch: 0 },
                            message: "Some errors here and there",
                            type: CodeInspection.Type.WARNING
                        }
                    ]
                });
                CodeInspection.register("javascript", codeInspector1);
                CodeInspection.register("javascript", codeInspector2);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    var $problemPanelTitle = $("#problems-panel .title").text();
                    expect($problemPanelTitle).toBe(StringUtils.format(Strings.ERRORS_PANEL_TITLE_MULTIPLE, 2));

                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);

                    var tooltip = $statusBar.attr("title");
                    expect(tooltip).toBe(StringUtils.format(Strings.ERRORS_PANEL_TITLE_MULTIPLE, 2));
                });
            });
            
            it("should report an async linter which has timed out", function () {
                var codeInspectorToTimeout = createAsyncCodeInspector("SlowAsyncLinter", {
                    errors: [
                        {
                            pos: { line: 1, ch: 0 },
                            message: "SlowAsyncLinter was here",
                            type: CodeInspection.Type.WARNING
                        },
                        {
                            pos: { line: 2, ch: 0 },
                            message: "SlowAsyncLinter was here as well",
                            type: CodeInspection.Type.WARNING
                        }
                    ]
                }, prefs.get(CodeInspection._PREF_ASYNC_TIMEOUT) + 10, false);
                
                CodeInspection.register("javascript", codeInspectorToTimeout);
                
                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                waits(prefs.get(CodeInspection._PREF_ASYNC_TIMEOUT) + 20);
                
                runs(function () {
                    var $problemsPanel = $("#problems-panel");
                    expect($problemsPanel.is(":visible")).toBe(true);
                    
                    var $problemsPanelTitle = $("#problems-panel .title").text();
                    expect($problemsPanelTitle).toBe(StringUtils.format(Strings.SINGLE_ERROR, "SlowAsyncLinter"));
                    
                    var $problemsReported = $("#problems-panel .bottom-panel-table .line-text");
                    expect($problemsReported.length).toBe(1);
                    expect($problemsReported.text())
                        .toBe(
                            StringUtils.format(Strings.LINTER_TIMED_OUT, "SlowAsyncLinter", prefs.get(CodeInspection._PREF_ASYNC_TIMEOUT))
                        );
                });
            });
            
            it("should report an async linter which throws an exception", function () {
                var errorMessage = "I'm full of bugs on purpose",
                    providerName = "Buggy Async Linter",
                    buggyAsyncProvider = {
                        name: providerName,
                        scanFileAsync: function () {
                            var deferred = new $.Deferred();
                            deferred.reject(errorMessage);
                            return deferred.promise();
                        }
                    };
                
                CodeInspection.register("javascript", buggyAsyncProvider);
                
                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    var $problemsPanel = $("#problems-panel");
                    expect($problemsPanel.is(":visible")).toBe(true);
                    
                    var $problemsPanelTitle = $("#problems-panel .title").text();
                    expect($problemsPanelTitle).toBe(StringUtils.format(Strings.SINGLE_ERROR, providerName));
                    
                    var $problemsReported = $("#problems-panel .bottom-panel-table .line-text");
                    expect($problemsReported.length).toBe(1);
                    expect($problemsReported.text())
                        .toBe(StringUtils.format(Strings.LINTER_FAILED, providerName, errorMessage));
                });
            });

            it("should report a sync linter which throws an exception", function () {
                var errorMessage = "I'm synchronous, but still full of bugs",
                    providerName = "Buggy Sync Linter",
                    buggySyncProvider = {
                        name: providerName,
                        scanFile: function () {
                            throw new Error(errorMessage);
                        }
                    };
                
                CodeInspection.register("javascript", buggySyncProvider);
                
                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    var $problemsPanel = $("#problems-panel");
                    expect($problemsPanel.is(":visible")).toBe(true);
                    
                    var $problemsPanelTitle = $("#problems-panel .title").text();
                    expect($problemsPanelTitle).toBe(StringUtils.format(Strings.SINGLE_ERROR, providerName));
                    
                    var $problemsReported = $("#problems-panel .bottom-panel-table .line-text");
                    expect($problemsReported.length).toBe(1);
                    expect($problemsReported.text())
                        .toBe(StringUtils.format(Strings.LINTER_FAILED, providerName, new Error(errorMessage)));
                });
            });
            
            it("should keep the order as per registration", function () {
                var asyncProvider1 = createAsyncCodeInspector("javascript async linter 1", failLintResult(), 400, true),
                    asyncProvider2 = createAsyncCodeInspector("javascript async linter 2", failLintResult(), 300, false),
                    syncProvider3 = createCodeInspector("javascript sync linter 3", failLintResult()),
                    registrationOrder = [asyncProvider1, asyncProvider2, syncProvider3],
                    i,
                    expected = "";
                
                for (i = 0; i < registrationOrder.length; i++) {
                    CodeInspection.register("javascript", registrationOrder[i]);
                    expected += registrationOrder[i].name + " " + "(1) ";
                }
                
                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");
                
                waits(410);

                runs(function () {
                    expect($("#problems-panel .inspector-section").text().trim().replace(/\s+/g, " "))
                        // actual string expected:
                        //.toBe("javascript async linter 1 (1) javascript async linter 2 (1) javascript sync linter 3 (1)");
                        .toBe(expected.trim());
                });
            });
        });
        
        describe("Code Inspector Registration", function () {
            beforeEach(function () {
                CodeInspection._unregisterAll();
            });

            it("should unregister JSLint linter if a new javascript linter is registered", function () {
                var codeInspector1 = createCodeInspector("JSLint", successfulLintResult());
                CodeInspection.register("javascript", codeInspector1);
                var codeInspector2 = createCodeInspector("javascript inspector", successfulLintResult());
                CodeInspection.register("javascript", codeInspector2, true);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test file", 5000);

                runs(function () {
                    expect(codeInspector1.scanFile).not.toHaveBeenCalled();
                    expect(codeInspector2.scanFile).toHaveBeenCalled();
                });
            });

            it("should call inspector 1 and inspector 2", function () {
                var codeInspector1 = createCodeInspector("javascript inspector 1", successfulLintResult());
                CodeInspection.register("javascript", codeInspector1);
                var codeInspector2 = createCodeInspector("javascript inspector 2", successfulLintResult());
                CodeInspection.register("javascript", codeInspector2);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test file", 5000);

                runs(function () {
                    expect(codeInspector1.scanFile).toHaveBeenCalled();
                    expect(codeInspector2.scanFile).toHaveBeenCalled();
                });
            });

            it("should keep inspector 1 because the name of inspector 2 is different", function () {
                var codeInspector1 = createCodeInspector("javascript inspector 1", successfulLintResult());
                CodeInspection.register("javascript", codeInspector1);
                var codeInspector2 = createCodeInspector("javascript inspector 2", successfulLintResult());
                CodeInspection.register("javascript", codeInspector2, true);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test file", 5000);

                runs(function () {
                    expect(codeInspector1.scanFile).toHaveBeenCalled();
                    expect(codeInspector2.scanFile).toHaveBeenCalled();
                });
            });
        });
    });
});
