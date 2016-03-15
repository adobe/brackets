/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, expect, beforeEach, beforeFirst, afterEach, afterLast, waits, runs, waitsForDone, spyOn */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils  = require("spec/SpecRunnerUtils"),
        FileSystem       = require("filesystem/FileSystem"),
        StringUtils      = require("utils/StringUtils"),
        Strings          = require("strings"),
        _                = require("thirdparty/lodash");

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
            DocumentManager,
            PreferencesManager,
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
                    CommandManager = brackets.test.CommandManager;
                    DocumentManager = brackets.test.DocumentManager;
                    EditorManager = brackets.test.EditorManager;
                    prefs = brackets.test.PreferencesManager.getExtensionPrefs("linting");
                    CodeInspection = brackets.test.CodeInspection;
                    PreferencesManager = brackets.test.PreferencesManager;
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
            DocumentManager = null;
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

            it("should get the correct linter given a file path", function () {
                var codeInspector1 = createCodeInspector("text linter 1", successfulLintResult());
                var codeInspector2 = createCodeInspector("text linter 2", successfulLintResult());

                CodeInspection.register("javascript", codeInspector1);
                CodeInspection.register("javascript", codeInspector2);

                var providers = CodeInspection.getProvidersForPath("test.js");
                expect(providers.length).toBe(2);
                expect(providers[0]).toBe(codeInspector1);
                expect(providers[1]).toBe(codeInspector2);
            });

            it("should return an empty array if no providers are registered", function () {
                expect(CodeInspection.getProvidersForPath("test.js").length).toBe(0);
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

            it("should use preferences for providers lookup", function () {
                var pm = PreferencesManager.getExtensionPrefs("linting"),
                    codeInspector1 = createCodeInspector("html1", failLintResult),
                    codeInspector2 = createCodeInspector("html2", successfulLintResult),
                    codeInspector3 = createCodeInspector("html3", successfulLintResult),
                    codeInspector4 = createCodeInspector("html4", successfulLintResult),
                    codeInspector5 = createCodeInspector("html5", failLintResult);

                CodeInspection.register("html", codeInspector1);
                CodeInspection.register("html", codeInspector2);
                CodeInspection.register("html", codeInspector3);
                CodeInspection.register("html", codeInspector4);
                CodeInspection.register("html", codeInspector5);

                function setAtLocation(name, value) {
                    pm.set(name, value, {location: {layer: "language", layerID: "html", scope: "user"}});
                }

                runs(function () {
                    var providers;

                    setAtLocation(CodeInspection._PREF_PREFER_PROVIDERS, ["html3", "html4"]);
                    providers = CodeInspection.getProvidersForPath("my/index.html");
                    expect(providers).toNotBe(null);
                    expect(_.pluck(providers, "name")).toEqual(["html3", "html4", "html1", "html2", "html5"]);

                    setAtLocation(CodeInspection._PREF_PREFER_PROVIDERS, ["html5", "html6"]);
                    providers = CodeInspection.getProvidersForPath("index.html");
                    expect(providers).toNotBe(null);
                    expect(_.pluck(providers, "name")).toEqual(["html5", "html1", "html2", "html3", "html4"]);

                    setAtLocation(CodeInspection._PREF_PREFER_PROVIDERS, ["html19", "html100"]);
                    providers = CodeInspection.getProvidersForPath("index.html");
                    expect(providers).toNotBe(null);
                    expect(_.pluck(providers, "name")).toEqual(["html1", "html2", "html3", "html4", "html5"]);

                    setAtLocation(CodeInspection._PREF_PREFERRED_ONLY, true);
                    providers = CodeInspection.getProvidersForPath("test.html");
                    expect(providers).toEqual([]);

                    setAtLocation(CodeInspection._PREF_PREFER_PROVIDERS, ["html2", "html1"]);
                    setAtLocation(CodeInspection._PREF_PREFERRED_ONLY, true);
                    providers = CodeInspection.getProvidersForPath("c:/temp/another.html");
                    expect(providers).toNotBe(null);
                    expect(_.pluck(providers, "name")).toEqual(["html2", "html1"]);

                    setAtLocation(CodeInspection._PREF_PREFER_PROVIDERS, undefined);
                    setAtLocation(CodeInspection._PREF_PREFERRED_ONLY, undefined);
                    providers = CodeInspection.getProvidersForPath("index.html");
                    expect(providers).toNotBe(null);
                    expect(_.pluck(providers, "name")).toEqual(["html1", "html2", "html3", "html4", "html5"]);
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
                CodeInspection.toggleEnabled(true);
            });

            // Utility to create an async provider where the testcase can control when each async result resolves
            function makeAsyncLinter() {
                return {
                    name: "Test Async Linter",
                    scanFileAsync: function (text, fullPath) {
                        if (!this.futures[fullPath]) {
                            this.futures[fullPath] = [];
                            this.filesCalledOn.push(fullPath);
                        }

                        var result = new $.Deferred();
                        this.futures[fullPath].push(result);
                        return result.promise();
                    },
                    futures: {},      // map from full path to array of Deferreds (in call order)
                    filesCalledOn: [] // in order of first call for each path
                };
            }

            // Tooltip is panel title, plus an informational message when there are problems.
            function buildTooltip(title, count) {
                if (count === 0) {
                    return title;
                }
                return StringUtils.format(Strings.STATUSBAR_CODE_INSPECTION_TOOLTIP, title);
            }

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

            it("should ignore async results from previous file", function () {
                CodeInspection.toggleEnabled(false);

                var asyncProvider = makeAsyncLinter();
                CodeInspection.register("javascript", asyncProvider);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js", "errors.js"]), "open test files");

                var errorsJS   = SpecRunnerUtils.makeAbsolute("errors.js"),
                    noErrorsJS = SpecRunnerUtils.makeAbsolute("no-errors.js");

                runs(function () {
                    // Start linting the first file
                    CodeInspection.toggleEnabled(true);
                    expect(asyncProvider.filesCalledOn).toEqual([errorsJS]);

                    // Close that file, switching to the 2nd one
                    waitsForDone(CommandManager.execute(Commands.FILE_CLOSE));
                });

                runs(function () {
                    // Verify that we started linting the 2nd file
                    expect(DocumentManager.getCurrentDocument().file.fullPath).toBe(noErrorsJS);
                    expect(asyncProvider.filesCalledOn).toEqual([errorsJS, noErrorsJS]);

                    // Finish old (stale) linting session - verify results not shown
                    asyncProvider.futures[errorsJS][0].resolve(failLintResult());
                    expect($("#problems-panel").is(":visible")).toBe(false);

                    // Finish new (current) linting session
                    asyncProvider.futures[noErrorsJS][0].resolve(successfulLintResult());
                    expect($("#problems-panel").is(":visible")).toBe(false);
                });
            });

            it("should ignore async results from previous run in same file - finishing in order", function () {
                CodeInspection.toggleEnabled(false);

                var asyncProvider = makeAsyncLinter();
                CodeInspection.register("javascript", asyncProvider);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test files");

                var noErrorsJS = SpecRunnerUtils.makeAbsolute("no-errors.js");

                runs(function () {
                    // Start linting the file
                    CodeInspection.toggleEnabled(true);
                    expect(asyncProvider.filesCalledOn).toEqual([noErrorsJS]);

                    // "Modify" the file
                    DocumentManager.trigger("documentSaved", DocumentManager.getCurrentDocument());
                    expect(asyncProvider.futures[noErrorsJS].length).toBe(2);

                    // Finish old (stale) linting session - verify results not shown
                    asyncProvider.futures[noErrorsJS][0].resolve(failLintResult());
                    expect($("#problems-panel").is(":visible")).toBe(false);

                    // Finish new (current) linting session - verify results are shown
                    asyncProvider.futures[noErrorsJS][1].resolve(failLintResult());
                    expect($("#problems-panel").is(":visible")).toBe(true);
                });
            });

            it("should ignore async results from previous run in same file - finishing reverse order", function () {
                CodeInspection.toggleEnabled(false);

                var asyncProvider = makeAsyncLinter();
                CodeInspection.register("javascript", asyncProvider);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test files");

                var noErrorsJS = SpecRunnerUtils.makeAbsolute("no-errors.js");

                runs(function () {
                    // Start linting the file
                    CodeInspection.toggleEnabled(true);
                    expect(asyncProvider.filesCalledOn).toEqual([noErrorsJS]);

                    // "Modify" the file
                    DocumentManager.trigger("documentSaved", DocumentManager.getCurrentDocument());
                    expect(asyncProvider.futures[noErrorsJS].length).toBe(2);

                    // Finish new (current) linting session - verify results are shown
                    asyncProvider.futures[noErrorsJS][1].resolve(failLintResult());
                    expect($("#problems-panel").is(":visible")).toBe(true);

                    // Finish old (stale) linting session - verify results don't replace current results
                    asyncProvider.futures[noErrorsJS][0].resolve(successfulLintResult());
                    expect($("#problems-panel").is(":visible")).toBe(true);
                });
            });

            it("should ignore async results after linting disabled", function () {
                CodeInspection.toggleEnabled(false);

                var asyncProvider = makeAsyncLinter();
                CodeInspection.register("javascript", asyncProvider);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["no-errors.js"]), "open test files");

                var noErrorsJS = SpecRunnerUtils.makeAbsolute("no-errors.js");

                runs(function () {
                    // Start linting the file
                    CodeInspection.toggleEnabled(true);
                    expect(asyncProvider.filesCalledOn).toEqual([noErrorsJS]);

                    // Disable linting
                    CodeInspection.toggleEnabled(false);

                    // Finish old (stale) linting session - verify results not shown
                    asyncProvider.futures[noErrorsJS][0].resolve(failLintResult());
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

            it("should not show the problems panel when there is no linting error - empty errors array", function () {
                var codeInspector = createCodeInspector("javascript linter", {errors: []});
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(false);
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);
                });
            });

            it("should not show the problems panel when there is no linting error - null result", function () {
                var codeInspector = createCodeInspector("javascript linter", null);
                CodeInspection.register("javascript", codeInspector);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(false);
                    var $statusBar = $("#status-inspection");
                    expect($statusBar.is(":visible")).toBe(true);
                });
            });

            it("should display two expanded, collapsible sections in the errors panel when two linters have errors", function () {
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

            it("should display no header section when only one linter has errors", function () {
                var codeInspector1 = createCodeInspector("javascript linter 1", failLintResult()),
                    codeInspector2 = createCodeInspector("javascript linter 2", {errors: []}),  // 1st way of reporting 0 errors
                    codeInspector3 = createCodeInspector("javascript linter 3", null);          // 2nd way of reporting 0 errors
                CodeInspection.register("javascript", codeInspector1);
                CodeInspection.register("javascript", codeInspector2);
                CodeInspection.register("javascript", codeInspector3);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(true);
                    expect($(".inspector-section").is(":visible")).toBeFalsy();
                });
            });

            it("should only display header sections for linters with errors", function () {
                var codeInspector1 = createCodeInspector("javascript linter 1", failLintResult()),
                    codeInspector2 = createCodeInspector("javascript linter 2", {errors: []}),  // 1st way of reporting 0 errors
                    codeInspector3 = createCodeInspector("javascript linter 3", null),          // 2nd way of reporting 0 errors
                    codeInspector4 = createCodeInspector("javascript linter 4", failLintResult());
                CodeInspection.register("javascript", codeInspector1);
                CodeInspection.register("javascript", codeInspector2);
                CodeInspection.register("javascript", codeInspector3);
                CodeInspection.register("javascript", codeInspector4);

                waitsForDone(SpecRunnerUtils.openProjectFiles(["errors.js"]), "open test file", 5000);

                runs(function () {
                    expect($("#problems-panel").is(":visible")).toBe(true);

                    var $inspectorSections = $(".inspector-section td");
                    expect($inspectorSections.length).toEqual(2);
                    expect($inspectorSections[0].innerHTML.indexOf("javascript linter 1 (1)")).not.toBe(-1);
                    expect($inspectorSections[1].innerHTML.indexOf("javascript linter 4 (1)")).not.toBe(-1);
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
                    var expectedTooltip = buildTooltip(StringUtils.format(Strings.SINGLE_ERROR, "JavaScript Linter"), 1);
                    expect(tooltip).toBe(expectedTooltip);
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
                    var expectedTooltip = buildTooltip(StringUtils.format(Strings.MULTIPLE_ERRORS, "JavaScript Linter", 2), 2);
                    expect(tooltip).toBe(expectedTooltip);
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
                    var expectedTooltip = buildTooltip(StringUtils.format(Strings.ERRORS_PANEL_TITLE_MULTIPLE, 2), 2);
                    expect(tooltip).toBe(expectedTooltip);
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
                    var expectedTooltip = buildTooltip(Strings.NO_ERRORS_MULTIPLE_PROVIDER, 0);
                    expect(tooltip).toBe(expectedTooltip);
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
                    var expectedTooltip = buildTooltip(StringUtils.format(Strings.NO_ERRORS, "JavaScript Linter1"), 0);
                    expect(tooltip).toBe(expectedTooltip);
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
                    var expectedTooltip = buildTooltip(StringUtils.format(Strings.ERRORS_PANEL_TITLE_MULTIPLE, 2), 2);
                    expect(tooltip).toBe(expectedTooltip);
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

            it("should report an async linter which rejects", function () {
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
