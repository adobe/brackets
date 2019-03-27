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
/*global describe, runs, beforeEach, it, expect, waitsFor, waitsForDone, waitsForFail, beforeFirst, afterLast */
define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        Strings         = brackets.getModule("strings"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        StringUtils     = brackets.getModule("utils/StringUtils");

    var phpToolingExtension,
        testWindow,
        $,
        _modulePath = FileUtils.getNativeModuleDirectoryPath(module),
        _unittestFilesFolderName = "unittest-files",
        _unittestFilesFolder = [_modulePath, _unittestFilesFolderName].join("/"),
        EditorManager,
        editor,
        PreferencesManager,
        CodeInspection,
        errorPopUpDismissed;

    var ERROR_POPUP = "#modal-header",
        ERROR_POPUP_STRING = "#modal-body",
        ERROR_POPUP_CANCEL_BTN = "#modal-footer",
        UERROR_POPUP_OPEN_BTN = '#update-btn-restart';

    describe("phpTooling", function () {
        var testFolder = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files/",
            testFile = "test1.php",
            oldFile;

        beforeFirst(function () {

            // Create a new window that will be shared by ALL tests in this spec.
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                $ = testWindow.$
                var brackets = testWindow.brackets;
                phpToolingExtension = brackets.test.ExtensionLoader.getRequireContextForExtension("phpTooling");
            });
        });

        afterLast(function () {
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
        });


        beforeEach(function () {
            EditorManager = testWindow.brackets.test.EditorManager;
            PreferencesManager = testWindow.brackets.test.PreferencesManager;
            CodeInspection = testWindow.brackets.test.CodeInspection;
            CodeInspection.toggleEnabled(true);
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
            if(clickbtnId) {
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
            PreferencesManager.set("php", {"executablePath": testFolder + phpExecutable}, {locations: {scope: "session"}});
            waitForMilliSeconds(5000);
            runs(function () {
                checkErrorPopUp();
                checkPopUpString(Strings.PHP_SERVER_ERROR_TITLE, StringUtils.format(Strings.PHP_UNSUPPORTED_VERSION, "5.6.30"));
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

            waitsForDone(SpecRunnerUtils.openProjectFiles([testFile]), "open test file: " + testFile);
            waitForMilliSeconds(5000);
            runs(function () {
                toggleDiagnosisResults(false);
                toggleDiagnosisResults(true);
            });
        });
    });
});
