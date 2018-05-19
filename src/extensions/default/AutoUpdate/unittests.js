/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, runs, beforeEach, it, expect, waitsFor, beforeFirst, afterLast */
/*unittests: AutoUpdate*/

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        Strings = brackets.getModule("strings"),
        FileUtils = brackets.getModule("file/FileUtils");

    var AutoUpdate;

    var testWindow,
        laterBtn,
        closeBtn;

    var downloadCompleted,
        downloadFailed,
        validationCompleted,
        validationFailed,
        appInitDone,
        installerPath,
        errorString,
        fileCheckCompleted,
        updateBarDismissed;


    var UPDATE_BAR = "#update-bar",
        UPDATE_LATER_BTN = "#update-btn-later",
        CLOSE_ICON = "#close-icon";

    var _modulePath = FileUtils.getNativeModuleDirectoryPath(module),
        _unittestFilesFolderName = "unittest-files",
        _unittestFilesFolder = [_modulePath, _unittestFilesFolderName].join("/");

    var validInstallerFilePaths = {
        "WIN": [_unittestFilesFolder, "Brackets.test.msi"].join("/"),
        "OSX": [_unittestFilesFolder, "Brackets.test.dmg"].join("/")
    };

    var invalidInstallerFilePaths = {
        "WIN": [_unittestFilesFolder, "Brackets.Release.msi"].join("/"),
        "OSX": [_unittestFilesFolder, "Brackets.Release.dmg"].join("/")
    };


    describe("AutoUpdate", function () {

        beforeFirst(function () {

            // Create a new window that will be shared by ALL tests in this spec.
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                var brackets = testWindow.brackets,
                    extensionRequire = brackets.test.ExtensionLoader.getRequireContextForExtension("AutoUpdate");
                AutoUpdate = extensionRequire("main");

                appInitDone = false;
                testWindow.brackets.test["AutoUpdate"] = {
                    appInitDone: false
                };
            });
        });

        afterLast(function () {
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
            laterBtn = null;
            closeBtn = null;
        });


        beforeEach(function () {
            downloadCompleted = false;
            downloadFailed = false;
            validationCompleted = false;
            validationFailed = false;
            fileCheckCompleted = false;
            updateBarDismissed = false;
            installerPath = "";

            laterBtn = null;
            closeBtn = null;

            // These flags will be set to true by Brackets, in multiple scenarios.
            // That is how unittest will come to know of the update process state.
            testWindow.brackets.test.AutoUpdate["downloadCompleted"] = false;
            testWindow.brackets.test.AutoUpdate["validationCompleted"] = false;
            testWindow.brackets.test.AutoUpdate["downloadFailed"] = false;
            testWindow.brackets.test.AutoUpdate["validationFailed"] = false;
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


        it("should attempt download, fail, retry and eventually prompt for failure", downloadFailure);

        /**
         * Tests the download failure scenario for Auto Update
         */
        function downloadFailure() {

            runs(function () {

                expect(testWindow.brackets.test).toBeTruthy();
                expect(testWindow.brackets.test.AutoUpdate.downloadCompleted).toBe(false);
                expect(testWindow.brackets.test.AutoUpdate.validationCompleted).toBe(false);
                expect(AutoUpdate._updateProcessHandler).not.toBeNull();
            });


            waitsFor(function () {
                appInitDone = testWindow.brackets.test.AutoUpdate.appInitDone;
                if(appInitDone) {
                    waitForMilliSeconds(3000);
                }
                return appInitDone;
            }, "App Init is taking too long to complete", 30000);


            runs(function () {

                expect(appInitDone).toBe(true);

                if (appInitDone) {
                    var OS = AutoUpdate.getPlatformInfo();
                    var updates = [
                        {
                            "buildNumber": 17622,
                            "platforms": {
                                "WIN": {
                                    "checksum": "444e49b46ec8e9ec0823516c7213ef610e3e6bf33691a2488b7ddd2561e40eec",
                                    "downloadURL": invalidInstallerFilePaths[OS]
                                },
                                "OSX": {
                                    "checksum": "10d8328fda10697a5e340dcaffc103675c51c63313ca7057e0426cff6378596d",
                                    "downloadURL": invalidInstallerFilePaths[OS]
                                }
                            }
                        }
                    ];

                    // Trigger the auto update process
                    AutoUpdate._updateProcessHandler(updates, true);
                }

            });

            waitsFor(function () {
                downloadFailed = testWindow.brackets.test.AutoUpdate.downloadFailed;
                if(downloadFailed) {
                    waitForMilliSeconds(3000);
                }
                return downloadFailed;
            }, "Download is taking too long to complete", 30000);


            runs(function () {
                expect(downloadFailed).toBe(true);

                if (downloadFailed) {
                    var doc = $(testWindow.document);
                    // Test if the update bar has been displayed.
                    expect(doc.find(UPDATE_BAR).length).toBe(1);
                    closeBtn = doc.find(CLOSE_ICON);
                    expect(closeBtn.length).toBe(1);
                }
            });


            runs(function () {

                if (closeBtn) {
                    // We will wait for 3 seconds so that the Update Bar is visible to the tester.
                    waitForMilliSeconds(3000);
                    closeBtn.click();
                    setTimeout(function () {
                        // We will wait for 1 second for the click action to take effect
                        expect($(testWindow.document).find(UPDATE_BAR).length).toBe(0);
                        updateBarDismissed = true;
                    }, 5000);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);

        }


        it("should download successfully and attempt to validate the download, but with failure and prompt for failure", validationFailure);


        /**
         * Tests the validation failure scenario for Auto Update
         */
        function validationFailure() {

            runs(function () {
                expect(testWindow.brackets.test).toBeTruthy();
                expect(testWindow.brackets.test.AutoUpdate.downloadCompleted).toBe(false);
                expect(testWindow.brackets.test.AutoUpdate.validationCompleted).toBe(false);

            });

            runs(function () {

                var OS = AutoUpdate.getPlatformInfo();
                var updates = [
                    {
                        "buildNumber": 17622,

                        "platforms": {
                            "WIN": {
                                "checksum": "0",
                                "downloadURL": validInstallerFilePaths[OS]
                            },
                            "OSX": {
                                "checksum": "0",
                                "downloadURL": validInstallerFilePaths[OS]
                            }
                        }
                    }
                ];

                //Trigger the auto update process
                AutoUpdate._updateProcessHandler(updates, true);

            });

            waitsFor(function () {

                downloadCompleted = testWindow.brackets.test.AutoUpdate.downloadCompleted;
                validationFailed = testWindow.brackets.test.AutoUpdate.validationFailed;

                if(downloadCompleted && validationFailed) {
                    waitForMilliSeconds(3000);
                }
                return (downloadCompleted && validationFailed);
            }, "Download and Validation is taking too long to complete", 30000);


            runs(function () {
                expect(downloadCompleted && validationFailed).toBe(true);

                if (downloadCompleted && validationFailed) {
                    // Test if the update bar has been displayed.
                    var doc = $(testWindow.document);
                    expect(doc.find(UPDATE_BAR).length).toBe(1);
                    closeBtn = doc.find(CLOSE_ICON);
                    expect(closeBtn.length).toBe(1);
                }
            });


            runs(function () {

                if (closeBtn) {
                    // We will wait for 3 seconds so that the Update Bar is visible to the tester.
                    waitForMilliSeconds(3000);
                    closeBtn.click();
                    setTimeout(function () {
                        // We will wait for 1 second for the click action to take effect
                        expect($(testWindow.document).find(UPDATE_BAR).length).toBe(0);
                        updateBarDismissed = true;
                    }, 5000);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);
        }


        it("should download and validate successfully, prompt the user for Restart/Later buttons and show Update Success/Failure UI", runUpdate);

        /**
         * Tests the Auto update scenario of successful download,
         * successful validation and Update Bar prompt for Restart/Later message.
         * It also imitates Update Successful and Update Failure scenarios,
         * by showing the corresponding messages in Update Bar.
         * This imitation is needed as the actual update process(running of installer/script)
         * cannot be achieved in the same session of app, and hence, cannot be tested by unit tests.
         */
        function runUpdate() {

            runs(function () {
                expect(testWindow.brackets.test).toBeTruthy();
                expect(testWindow.brackets.test.AutoUpdate.downloadCompleted).toBe(false);
                expect(testWindow.brackets.test.AutoUpdate.validationCompleted).toBe(false);

            });

            runs(function () {
                var OS = AutoUpdate.getPlatformInfo();
                var updates = [
                    {
                        "buildNumber": 17622,

                        "platforms": {
                            "WIN": {
                                "checksum": "444e49b46ec8e9ec0823516c7213ef610e3e6bf33691a2488b7ddd2561e40eec",
                                "downloadURL": validInstallerFilePaths[OS]
                            },
                            "OSX": {
                                "checksum": "10d8328fda10697a5e340dcaffc103675c51c63313ca7057e0426cff6378596d",
                                "downloadURL": validInstallerFilePaths[OS]
                            }
                        }
                    }
                ];

                // Trigger the auto update workflow
                AutoUpdate._updateProcessHandler(updates, true);

            });

            waitsFor(function () {

                downloadCompleted = testWindow.brackets.test.AutoUpdate.downloadCompleted;
                validationCompleted = testWindow.brackets.test.AutoUpdate.validationCompleted;
                if (downloadCompleted && validationCompleted) {
                    installerPath = testWindow.brackets.test.AutoUpdate.installerPath;
                }
                return (downloadCompleted && validationCompleted);
            }, "Download is taking too long to complete", 30000);
            // Time out is 30 seconds. Try increasing this if the test fails.

            runs(function () {
                expect(downloadCompleted && validationCompleted).toBe(true);
                expect(installerPath).toBeTruthy();
                expect(installerPath.length).toBeGreaterThan(0);

                // Test if the file exists
                fileCheckCompleted = false;
                FileSystem.resolve(installerPath, function (errString, fsEntry, fileStats) {
                    fileCheckCompleted = true;
                    errorString = errString;
                });
            });

            waitsFor(function () {
                return fileCheckCompleted;
            }, "File exists check is taking too long to complete", 30000);
            // Time out is 30 seconds. Try increasing this if the test fails.

            runs(function () {
                if (fileCheckCompleted) {
                    expect(errorString.not_defined).toBeUndefined();
                    // We will wait for 3 seconds before testing for popup.
                    waitForMilliSeconds(3000);
                }
            });

            runs(function () {

                if (downloadCompleted && validationCompleted) {

                    // Test if the update bar has been displayed.
                    var doc = $(testWindow.document);
                    expect(doc.find(UPDATE_BAR).length).toBe(1);

                    var btnsList = doc.find(UPDATE_LATER_BTN);
                    var numBtns = btnsList.length;
                    expect(numBtns).toBe(1);
                    if (numBtns === 1) {
                        laterBtn = btnsList[0];
                    }
                }
            });

            runs(function () {
                if (laterBtn) {
                    // Test the functionality of Update Later button
                    // We will wait for 3 seconds so that the pop up is visible to the tester.
                    waitForMilliSeconds(3000);
                    laterBtn.click();
                    setTimeout(function () {
                        // We will wait for 1 second for the click action to take effect
                        expect($(testWindow.document).find(UPDATE_BAR).length).toBe(0);
                        updateBarDismissed = true;
                    }, 5000);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);


            runs(function () {

                waitForMilliSeconds(3000);
                AutoUpdate.showUpdateBar(Strings.UPDATE_SUCCESSFUL, "", "success");

                // Test if the update bar has been displayed.
                var doc = $(testWindow.document);
                expect(doc.find(UPDATE_BAR).length).toBe(1);

                closeBtn = doc.find(CLOSE_ICON);
                expect(closeBtn.length).toBe(1);

            });


            runs(function () {

                if (closeBtn) {
                    // We will wait for 3 seconds so that the Update Bar is visible to the tester.
                    waitForMilliSeconds(3000);
                    closeBtn.click();
                    setTimeout(function () {
                        // We will wait for 1 second for the click action to take effect
                        expect($(testWindow.document).find(UPDATE_BAR).length).toBe(0);
                        updateBarDismissed = true;
                    }, 10000);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);


            runs(function () {

                waitForMilliSeconds(3000);

                AutoUpdate.showUpdateBar(Strings.UPDATE_FAILED, Strings.GO_TO_SITE, "error");

                // Test if the update bar has been displayed.
                var doc = $(testWindow.document);
                expect(doc.find(UPDATE_BAR).length).toBe(1);
                closeBtn = doc.find(CLOSE_ICON);
                expect(closeBtn.length).toBe(1);

            });


            runs(function () {

                if (closeBtn) {
                    // We will wait for 3 seconds so that the Update Bar is visible to the tester.
                    waitForMilliSeconds(3000);
                    closeBtn.click();
                    setTimeout(function () {
                        // We will wait for 1 second for the click action to take effect
                        expect($(testWindow.document).find(UPDATE_BAR).length).toBe(0);
                        updateBarDismissed = true;
                    }, 5000);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);

        }
    });

});
