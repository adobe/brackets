/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
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
/*global describe, runs, beforeEach, it, expect, waitsFor, waitsForDone, beforeFirst, afterLast */
define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        Strings         = brackets.getModule("strings"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        StringUtils     = brackets.getModule("utils/StringUtils");

    var extensionRequire,
        phpToolingExtension,
        testWindow,
        $,
        PreferencesManager,
        CodeInspection,
        DefaultProviders,
        CodeHintsProvider,
        EditorManager,
        testEditor,
        testFolder = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files/",
        testFile1 = "test1.php",
        testFile2 =  "test2.php";

    describe("PhpTooling", function () {

        beforeFirst(function () {

            // Create a new window that will be shared by ALL tests in this spec.
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                $ = testWindow.$;
                var brackets = testWindow.brackets;
                extensionRequire = brackets.test.ExtensionLoader.getRequireContextForExtension("PhpTooling");
                phpToolingExtension = extensionRequire("main");
            });
        });

        afterLast(function () {
            waitsForDone(phpToolingExtension.getClient().stop(), "stoping php server");
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
        });


        beforeEach(function () {
            EditorManager      = testWindow.brackets.test.EditorManager;
            PreferencesManager = testWindow.brackets.test.PreferencesManager;
            CodeInspection = testWindow.brackets.test.CodeInspection;
            CodeInspection.toggleEnabled(true);
            DefaultProviders = testWindow.brackets.getModule("languageTools/DefaultProviders");
            CodeHintsProvider = extensionRequire("CodeHintsProvider");
        });

        /**
         * Does a busy wait for a given number of milliseconds
         * @param {Number} milliSeconds - number of milliSeconds to wait
         */
        function waitForMilliSeconds(milliSeconds) {
            var flag = false;

            setTimeout(function () {
                flag = true;
            }, milliSeconds);

            waitsFor(function () {
                return flag;
            }, "This should not fail. Please check the timeout values.",
                milliSeconds + 10); // We give 10 milliSeconds as grace period
        }

        /**
         * Check the presence of a Button in Error Prompt
         * @param {String} btnId - "CANCEL" or "OPEN"
         */
        function checkPopUpButton(clickbtnId) {
            var doc = $(testWindow.document),
                errorPopUp = doc.find(".error-dialog.instance"),
                btn = errorPopUp.find('.dialog-button');

            // Test if the update bar button has been displayed.
            expect(btn.length).toBe(2);
            if (clickbtnId) {
                clickButton(clickbtnId);
            }
        }

        /**
         * Check the presence of a Button in Error Prompt
         * @param {String} btnId - Button OPEN or Cancel Button
         */
        function clickButton(btnId) {
            var doc = $(testWindow.document),
                errorPopUp = doc.find(".error-dialog.instance"),
                btn = errorPopUp.find('.dialog-button'),
                openBtn,
                cancelBtn,
                clickBtn;
            if (btn[0].classList.contains("primary")) {
                openBtn = btn[0];
                cancelBtn = btn[1];
            }

            if (btn[1].classList.contains("primary")) {
                openBtn = btn[1];
                cancelBtn = btn[0];
            }
            clickBtn = cancelBtn;

            if(btnId === "OPEN") {
                clickBtn = openBtn;
            }

            if(clickBtn) {
                clickBtn.click();
                waitForMilliSeconds(3000);
                runs(function() {
                    expect(doc.find(".error-dialog.instance").length).toBe(0);
                });
            }
        }

        /**
         * Check the presence of Error Prompt String on Brackets Window
         * @param {String} title - Title String Which will be matched with Update Bar heading.
         * @param {String} description - description String Which will be matched with Update Bar description.
         */
        function checkPopUpString(title, titleDescription) {
            var doc = $(testWindow.document),
                errorPopUp = doc.find(".error-dialog.instance"),
                heading = errorPopUp.find('.dialog-title'),
                description = errorPopUp.find('.dialog-message');

            // Test if the update bar has been displayed.
            //expect(errorPopUp.length).toBe(1);
            if (title) {
                expect(heading.text()).toBe(title);
            }
            if (titleDescription) {
                expect(description.text()).toBe(titleDescription);
            }
        }

        function toggleDiagnosisResults(visible) {
            var doc = $(testWindow.document),
                problemsPanel = doc.find("#problems-panel"),
                statusInspection = $("#status-inspection");
            statusInspection.triggerHandler("click");
            expect(problemsPanel.is(":visible")).toBe(visible);
        }

        /**
         * Wait for the editor to change positions, such as after a jump to
         * definition has been triggered.  Will timeout after 3 seconds
         *
         * @param {{line:number, ch:number}} oldLocation - the original line/col
         * @param {Function} callback - the callback to apply once the editor has changed position
         */
        function _waitForJump(jumpPromise, callback) {
            var cursor = null,
                complete = false;

            jumpPromise.done(function () {
                complete = true;
            });

            waitsFor(function () {
                var activeEditor = EditorManager.getActiveEditor();
                cursor = activeEditor.getCursorPos();
                return complete;
            }, "Expected jump did not occur", 3000);

            runs(function () { callback(cursor); });
        }

        /*
         * Expect a given list of hints to be present in a given hint
         * response object
         *
         * @param {Object + jQuery.Deferred} hintObj - a hint response object,
         *      possibly deferred
         * @param {Array.<string>} expectedHints - a list of hints that should be
         *      present in the hint response
         */
        function expecthintsPresent(expectedHints) {
            var hintObj = (new CodeHintsProvider.CodeHintsProvider(phpToolingExtension.getClient())).getHints(null);
            _waitForHints(hintObj, function (hintList) {
                expect(hintList).toBeTruthy();
                expectedHints.forEach(function (expectedHint) {
                    expect(_indexOf(hintList, expectedHint)).not.toBe(-1);
                });
            });
        }

        /*
         * Return the index at which hint occurs in hintList
         *
         * @param {Array.<Object>} hintList - the list of hints
         * @param {string} hint - the hint to search for
         * @return {number} - the index into hintList at which the hint occurs,
         * or -1 if it does not
         */
        function _indexOf(hintList, hint) {
            var index = -1,
                counter = 0;

            for (counter; counter < hintList.length; counter++) {
                if (hintList[counter].data("token").label === hint) {
                    index = counter;
                    break;
                }
            }
            return index;
        }

        /*
         * Wait for a hint response object to resolve, then apply a callback
         * to the result
         *
         * @param {Object + jQuery.Deferred} hintObj - a hint response object,
         *      possibly deferred
         * @param {Function} callback - the callback to apply to the resolved
         *      hint response object
         */
        function _waitForHints(hintObj, callback) {
            var complete = false,
                hintList = null;

            if (hintObj.hasOwnProperty("hints")) {
                complete = true;
                hintList = hintObj.hints;
            } else {
                hintObj.done(function (obj) {
                    complete = true;
                    hintList = obj.hints;
                });
            }

            waitsFor(function () {
                return complete;
            }, "Expected hints did not resolve", 3000);

            runs(function () { callback(hintList); });
        }

        /**
         * Show a function hint based on the code at the cursor. Verify the
         * hint matches the passed in value.
         *
         * @param {Array<{name: string, type: string, isOptional: boolean}>}
         * expectedParams - array of records, where each element of the array
         * describes a function parameter. If null, then no hint is expected.
         * @param {number} expectedParameter - the parameter at cursor.
         */
        function expectParameterHint(expectedParams, expectedParameter) {
            var requestStatus = null;
            var request,
                complete = false;
            runs(function () {
                request = (new DefaultProviders.ParameterHintsProvider(phpToolingExtension.getClient()))
                    .getParameterHints();
                request.done(function (status) {
                    complete = true;
                    requestStatus = status;
                }).fail(function(){
                    complete = true;
                });
            });

            waitsFor(function () {
                return complete;
            }, "Expected Parameter hints did not resolve", 3000);

            if (expectedParams === null) {
                expect(requestStatus).toBe(null);
                return;
            }

            function expectHint(hint) {
                var params = hint.parameters,
                    n = params.length,
                    i;

                // compare params to expected params
                expect(params.length).toBe(expectedParams.length);
                expect(hint.currentIndex).toBe(expectedParameter);

                for (i = 0; i < n; i++) {
                    expect(params[i].label).toBe(expectedParams[i]);
                }

            }
            runs(function() {
                expectHint(requestStatus);
            });
        }

        /**
         * Trigger a jump to definition, and verify that the editor jumped to
         * the expected location. The new location is the variable definition
         * or function definition of the variable or function at the current
         * cursor location. Jumping to the new location will cause a new editor
         * to be opened or open an existing editor.
         *
         * @param {{line:number, ch:number, file:string}} expectedLocation - the
         *  line, column, and optionally the new file the editor should jump to.  If the
         *  editor is expected to stay in the same file, then file may be omitted.
         */
        function editorJumped(expectedLocation) {
            var jumpPromise = (new DefaultProviders.JumpToDefProvider(phpToolingExtension.getClient())).doJumpToDef();

            _waitForJump(jumpPromise, function (newCursor) {
                expect(newCursor.line).toBe(expectedLocation.line);
                expect(newCursor.ch).toBe(expectedLocation.ch);
                if (expectedLocation.file) {
                    var activeEditor = EditorManager.getActiveEditor();
                    expect(activeEditor.document.file.name).toBe(expectedLocation.file);
                }
            });

        }

        function expectReferences(referencesExpected) {
            var refPromise,
                results = null,
                complete = false;
            runs(function () {
                refPromise = (new DefaultProviders.ReferencesProvider(phpToolingExtension.getClient())).getReferences();
                refPromise.done(function (resp) {
                    complete = true;
                    results = resp;
                }).fail(function(){
                    complete = true;
                });
            });

            waitsFor(function () {
                return complete;
            }, "Expected Reference Promise did not resolve", 3000);

            if(referencesExpected === null) {
                expect(results).toBeNull();
                return;
            }

            runs(function() {
                expect(results.numFiles).toBe(referencesExpected.numFiles);
                expect(results.numMatches).toBe(referencesExpected.numMatches);
                expect(results.allResultsAvailable).toBe(referencesExpected.allResultsAvailable);
                expect(results.results).not.toBeNull();
                for(var key in results.keys) {
                    expect(results.results.key).toBe(referencesExpected.results.key);
                }
            });
        }

        /**
         * Check the presence of Error Prompt on Brackets Window
         */
        function checkErrorPopUp() {
            var doc = $(testWindow.document),
                errorPopUp = doc.find(".error-dialog.instance"),
                errorPopUpHeader = errorPopUp.find(".modal-header"),
                errorPopUpBody = errorPopUp.find(".modal-body"),
                errorPopUpFooter = errorPopUp.find(".modal-footer"),
                errorPopUpPresent = false;

            runs(function () {
                expect(errorPopUp.length).toBe(1);
                expect(errorPopUpHeader).not.toBeNull();
                expect(errorPopUpBody).not.toBeNull();
                expect(errorPopUpFooter).not.toBeNull();
            });

            if (errorPopUp && errorPopUp.length > 0) {
                errorPopUpPresent =  true;
            }
            return errorPopUpPresent;
        }

        it("phpTooling Exiension should be loaded Successfully", function () {
            waitForMilliSeconds(5000);
            runs(function () {
                expect(phpToolingExtension).not.toBeNull();
            });
        });

        it("should attempt to start php server and fail due to lower version of php", function () {
            var phpExecutable = testWindow.brackets.platform === "mac" ? "/mac/invalidphp" : "/win/invalidphp";
            PreferencesManager.set("php", {
                "executablePath": testFolder + phpExecutable
            }, {
                locations: {scope: "session"}
            });
            waitForMilliSeconds(5000);
            runs(function () {
                checkErrorPopUp();
                checkPopUpString(Strings.PHP_SERVER_ERROR_TITLE,
                                 StringUtils.format(Strings.PHP_UNSUPPORTED_VERSION, "5.6.30"));
                checkPopUpButton("CANCEL");
            });
        });

        it("should attempt to start php server and fail due to invaild executable", function () {
            PreferencesManager.set("php", {"executablePath": "/invalidPath/php"}, {locations: {scope: "session"}});
            waitForMilliSeconds(5000);
            runs(function () {
                checkErrorPopUp();
                checkPopUpString(Strings.PHP_SERVER_ERROR_TITLE, Strings.PHP_EXECUTABLE_NOT_FOUND);
                checkPopUpButton("CANCEL");
            });
        });

        it("should attempt to start php server and fail due to invaild memory limit in prefs settings", function () {
            PreferencesManager.set("php", {"memoryLimit": "invalidValue"}, {locations: {scope: "session"}});
            waitForMilliSeconds(5000);
            runs(function () {
                checkErrorPopUp();
                checkPopUpString(Strings.PHP_SERVER_ERROR_TITLE, Strings.PHP_SERVER_MEMORY_LIMIT_INVALID);
                checkPopUpButton("CANCEL");
            });

            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testFolder + "test");
            });
        });

        it("should attempt to start php server and success", function () {
            PreferencesManager.set("php", {"memoryLimit": "4095M"}, {locations: {scope: "session"}});

            waitsForDone(SpecRunnerUtils.openProjectFiles([testFile1]), "open test file: " + testFile1);
            waitForMilliSeconds(5000);
            runs(function () {
                toggleDiagnosisResults(false);
                toggleDiagnosisResults(true);
            });
        });

        it("should filter hints by query", function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles([testFile2]), "open test file: " + testFile2);
            runs(function() {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos({ line: 15, ch: 3 });
                expecthintsPresent(["$A11", "$A12", "$A13"]);
            });
        });

        it("should show inbuilt functions in hints", function () {
            runs(function() {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos({ line: 17, ch: 2 });
                expecthintsPresent(["fopen", "for", "foreach"]);
            });
        });

        it("should show static global variables in hints", function () {
            runs(function() {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos({ line: 20, ch: 1 });
                expecthintsPresent(["$_COOKIE", "$_ENV"]);
            });
        });

        it("should not show parameter hints", function () {
            runs(function() {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos({ line: 25, ch: 5 });
                expectParameterHint(null);
            });
        });

        it("should show no parameter as a hint", function () {
            runs(function() {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos({ line: 27, ch: 19 });
                expectParameterHint([], 0);
            });
        });

        it("should show parameters hints", function () {
            runs(function() {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos({ line: 26, ch: 9 });
                expectParameterHint([
                    "string $filename",
                    "string $mode",
                    "bool $use_include_path = null",
                    "resource $context = null"], 1);
            });
        });

        it("should not show any references", function () {
            var start = { line: 6, ch: 4 };

            runs(function () {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos(start);
                expectReferences(null);
            });
        });

        it("should  show  reference present in single file", function () {
            var start = { line: 22, ch: 18 },
                results = {};

            runs(function () {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos(start);
                results[testFolder + "test/test2.php"] = {matches: [
                    {
                        start: {line: 27, ch: 0},
                        end: {line: 27, ch: 18},
                        line: "watchparameterhint()"
                    }
                ]
                };
                expectReferences({
                    numFiles: 1,
                    numMatches: 1,
                    allResultsAvailable: true,
                    queryInfo: "watchparameterhint",
                    keys: [testFolder + "test/test2.php"],
                    results: results
                });
            });
        });

        it("should  show  references present in single file", function () {
            var start = { line: 34, ch: 8 },
                results = {};

            runs(function () {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos(start);
                results[testFolder + "test/test2.php"] = {matches: [
                    {
                        start: {line: 34, ch: 0},
                        end: {line: 34, ch: 17},
                        line: "watchReferences();"
                    },
                    {
                        start: {line: 36, ch: 0},
                        end: {line: 36, ch: 17},
                        line: "watchReferences();"
                    }
                ]
                };
                expectReferences({
                    numFiles: 1,
                    numMatches: 2,
                    allResultsAvailable: true,
                    queryInfo: "watchparameterhint",
                    keys: [testFolder + "test/test2.php"],
                    results: results
                });
            });
        });

        it("should  show  references present in multiple files", function () {
            var start = { line: 39, ch: 21 },
                results = {};

            runs(function () {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos(start);
                results[testFolder + "test/test2.php"] = {matches: [
                    {
                        start: {line: 34, ch: 0},
                        end: {line: 34, ch: 26},
                        line: "watchReferences();"
                    },
                    {
                        start: {line: 36, ch: 0},
                        end: {line: 36, ch: 26},
                        line: "watchReferences();"
                    }
                ]
                };
                results[testFolder + "test/test3.php"] = {matches: [
                    {
                        start: {line: 11, ch: 0},
                        end: {line: 11, ch: 26},
                        line: "watchReferences();"
                    }
                ]
                };
                expectReferences({
                    numFiles: 2,
                    numMatches: 3,
                    allResultsAvailable: true,
                    queryInfo: "watchparameterhint",
                    keys: [testFolder + "test/test2.php", testFolder + "test/test3.php"],
                    results: results
                });
            });
        });

        it("should jump to earlier defined variable", function () {
            var start = { line: 4, ch: 2 };

            runs(function () {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos(start);
                editorJumped({line: 2, ch: 0});
            });
        });

        it("should jump to class declared in other module file", function () {
            var start = { line: 9, ch: 11 };

            runs(function () {
                testEditor = EditorManager.getActiveEditor();
                testEditor.setCursorPos(start);
                editorJumped({line: 4, ch: 0, file: "test3.php"});
            });
        });
    });
});
