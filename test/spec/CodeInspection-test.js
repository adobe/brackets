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
/*global define, describe, it, expect, beforeEach, beforeFirst, afterEach, afterLast, waitsFor, runs, brackets, waitsForDone, spyOn, xit, jasmine */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils  = require("spec/SpecRunnerUtils"),
        FileSystem       = require("filesystem/FileSystem");

    describe("Code Inspection", function () {
        this.category = "integration";

        var testFolder = SpecRunnerUtils.getTestPath("/spec/CodeInspection-test-files/"),
            testWindow,
            $,
            brackets,
            CodeInspection,
            EditorManager;

        var toggleJSLintResults = function (visible) {
            $("#status-inspection").triggerHandler("click");
            expect($("#problems-panel").is(":visible")).toBe(visible);
        };

        function createCodeInspector(name, result) {
            var provider = {
                name: name,
                // arguments to this function: text, fullPath
                // omit the warning
                scanFile: function () { return {errors: result}; }
            };

            spyOn(provider, "scanFile").andCallThrough();

            return provider;
        }

        beforeFirst(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    // Load module instances from brackets.test
                    $ = testWindow.$;
                    brackets = testWindow.brackets;
                    EditorManager = brackets.test.EditorManager;
                    CodeInspection = brackets.test.CodeInspection;
                    CodeInspection.toggleEnabled(true);
                });
            });

            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testFolder);
            });
        });

        afterEach(function () {
            testWindow.closeAllFiles();
        });

        afterLast(function () {
            testWindow    = null;
            $             = null;
            brackets      = null;
            EditorManager = null;
            SpecRunnerUtils.closeTestWindow();
        });

        describe("Unit level tests", function () {
            var simpleJavascriptFileEntry;

            beforeEach(function () {
                CodeInspection.unregisterAll();
                simpleJavascriptFileEntry = new FileSystem.getFileForPath(testFolder + "/errors.js");
            });

            it("should run a single registered linter", function () {
                var codeInspector = createCodeInspector("text linter", []);
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
                var codeInspector1 = createCodeInspector("text linter 1", []);
                var codeInspector2 = createCodeInspector("text linter 2", []);

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

                var lintResult = {
                    pos: { line: 2, ch: 3 },
                    message: "Some errors here and there",
                    type: CodeInspection.Type.WARNING
                };

                var codeInspector1 = createCodeInspector("javascript linter", [lintResult]);
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
                    expect(result[0].item.name).toEqual("javascript linter");
                    expect(result[0].results.errors.length).toEqual(1);
                });
            });

            it("should run two linter and return some errors", function () {
                var result;

                var lintResult = {
                    pos: { line: 2, ch: 3 },
                    message: "Some errors here and there",
                    type: CodeInspection.Type.WARNING
                };

                var codeInspector1 = createCodeInspector("javascript linter 1", [lintResult]);
                var codeInspector2 = createCodeInspector("javascript linter 2", [lintResult]);
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
                    expect(result[0].results.errors.length).toEqual(1);
                    expect(result[1].results.errors.length).toEqual(1);
                });
            });

            it("should not call any other linter for javascript document", function () {
                var codeInspector1 = createCodeInspector("any other linter linter 1", []);
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
                var codeInspector1 = createCodeInspector("javascript linter 1", []);
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
        });

        describe("Code Inspection UI", function () {
            beforeEach(function () {
                CodeInspection.unregisterAll();
            });

            it("should run test linter when a JavaScript document opens and indicate errors in the panel", function () {
                var lintResult = {
                    pos: { line: 1, ch: 3 },
                    message: "Some errors here and there",
                    type: CodeInspection.Type.WARNING
                };

                var codeInspector = createCodeInspector("javascript linter", [lintResult]);
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(true);
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);
                });
            });

            it("should show problems panel after too many errors", function () {
                var lintResult = [
                    {
                        pos: { line: 1, ch: 3 },
                        message: "Some errors here and there",
                        type: CodeInspection.Type.WARNING
                    },
                    {
                        pos: { line: 1, ch: 5 },
                        message: "Stopping. (33% scanned).",
                        type: CodeInspection.Type.META,
                        aborted: true
                    }
                ];

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
                var lintResult = {
                    pos: { line: 1, ch: 3 },
                    message: "Some errors here and there",
                    type: CodeInspection.Type.WARNING
                };

                CodeInspection.toggleEnabled(false);

                var codeInspector = createCodeInspector("javascript linter", [lintResult]);
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
                var codeInspector = createCodeInspector("javascript linter", []);
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(false);
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);
                });
            });

            it("status icon should toggle Errors panel when errors present", function () {
                var lintResult = {
                    pos: { line: 1, ch: 3 },
                    message: "Some errors here and there",
                    type: CodeInspection.Type.WARNING
                };

                var codeInspector = createCodeInspector("javascript linter", [lintResult]);
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file");

                runs(function () {
                    toggleJSLintResults(false);
                    toggleJSLintResults(true);
                });
            });

            it("status icon should not toggle Errors panel when no errors present", function () {
                var codeInspector = createCodeInspector("javascript linter", []);
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test file");

                runs(function () {
                    toggleJSLintResults(false);
                    toggleJSLintResults(false);
                });
            });
        });
    });
});
