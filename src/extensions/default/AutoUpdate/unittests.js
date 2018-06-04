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

    var AutoUpdate,

        testWindow,

        downloadCompleted,
        downloadFailed,
        validationCompleted,
        validationFailed,
        updateCheckCompleted,
        appInitDone,
        installerPath,
        errorString,
        fileCheckCompleted,
        updateBarDismissed,

        UPDATE_BAR = "#update-bar",
        UPDATE_LATER_BTN = "#update-btn-later",
        UPDATE_RESTART_BTN = '#update-btn-restart',
        CLOSE_ICON = "#close-icon",

        _modulePath = FileUtils.getNativeModuleDirectoryPath(module),
        _unittestFilesFolderName = "unittest-files",
        _unittestFilesFolder = [_modulePath, _unittestFilesFolderName].join("/"),

        validInstallerFilePaths = {
            "WIN": [_unittestFilesFolder, "Brackets.test.msi"].join("/"),
            "OSX": [_unittestFilesFolder, "Brackets.test.dmg"].join("/")
        },
        invalidInstallerFilePaths = {
            "WIN": [_unittestFilesFolder, "Brackets.Release.msi"].join("/"),
            "OSX": [_unittestFilesFolder, "Brackets.Release.dmg"].join("/")
        };


    describe("AutoUpdate", function () {

        beforeFirst(function () {

            // Create a new window that will be shared by ALL tests in this spec.
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                appInitDone = false;
                testWindow.brackets.test["AutoUpdate"] = {
                    appInitDone: false
                };

            });
        });

        afterLast(function () {
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
        });


        beforeEach(function () {
            downloadCompleted = false;
            downloadFailed = false;
            validationCompleted = false;
            validationFailed = false;
            updateCheckCompleted = false;
            fileCheckCompleted = false;
            updateBarDismissed = false;
            installerPath = "";


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

        /**
         * Check the presence of a Button in Update Bar Prompt
         * @param {String} btnId - Button Div Id
         * @param {boolean} click - Should be true If Button need to be clicked else false
         */
        function checkUpdateBarButton(btnId, click) {
            var doc = $(testWindow.document),
                btn;

            // Test if the update bar button has been displayed.
            expect(doc.find(UPDATE_BAR).length).toBe(1);
            btn = doc.find(btnId);
            expect(btn.length).toBe(1);

            if (btn && click) {
                // We will wait for 3 seconds so that the Update Bar is visible to the tester.
                waitForMilliSeconds(3000);
                btn.click();
                setTimeout(function () {
                    // We will wait for 1 second for the click action to take effect
                    expect(doc.find(UPDATE_BAR).length).toBe(0);
                    updateBarDismissed = true;
                }, 5000);
            }
        }

        /**
         * Check the presence of Update Bar Prompt on Brackets Window
         * @param {String} title - Title String Which will be matched with Update Bar heading.
         */
        function checkUpdateBar(title) {
            var doc = $(testWindow.document),
                updBar = doc.find(UPDATE_BAR),
                heading = updBar.find('#heading');

            // Test if the update bar has been displayed.
            expect(updBar.length).toBe(1);
            if(title) {
                expect(heading.text()).toBe(title);
            }
        }

        it("should load the AutoUpdate Exiension Successfuly", function() {
            var brackets = testWindow.brackets,
                extensionRequire = brackets.test.ExtensionLoader.getRequireContextForExtension("AutoUpdate");
            AutoUpdate = extensionRequire("main");

            waitsFor(function () {
                appInitDone = testWindow.brackets.test.AutoUpdate.appInitDone;
                return appInitDone;
            }, "App Init is taking too long to complete", 30000);

            runs(function () {
                expect(appInitDone).toBe(true);
            });

        });


        it("should attempt download, fail, retry and eventually prompt for failure", downloadFailure);

        /**
         * Tests the download failure scenario for Auto Update
         * and validate download failure message in Update Bar prompt.
         */
        function downloadFailure() {

            runs(function () {
                expect(testWindow.brackets.test).toBeTruthy();
                expect(testWindow.brackets.test.AutoUpdate.appInitDone).toBe(true);
                expect(AutoUpdate._updateProcessHandler).not.toBeNull();
            });

            runs(function () {
                if (appInitDone) {
                    var updates = [
                        {
                            "buildNumber": 17622,
                            "platforms": {
                                "WIN": {
                                    "checksum": "444e49b46ec8e9ec0823516c7213ef610e3e6bf33691a2488b7ddd2561e40eec",
                                    "downloadURL": invalidInstallerFilePaths["WIN"]
                                },
                                "OSX": {
                                    "checksum": "10d8328fda10697a5e340dcaffc103675c51c63313ca7057e0426cff6378596d",
                                    "downloadURL": invalidInstallerFilePaths["OSX"]
                                }
                            }
                        }
                    ];

                    // Trigger the auto update process
                    AutoUpdate._updateProcessHandler(updates);
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
                    checkUpdateBar(Strings.DOWNLOAD_FAILED);
                    checkUpdateBarButton(CLOSE_ICON, true);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);

        }


        it("should download successfully and attempt to validate the download, but with failure and prompt for failure", validationFailure);


        /**
         * Tests the validation failure scenario for Auto Update
         * and validate validation failure message in Update Bar prompt.
         */
        function validationFailure() {

            runs(function () {
                expect(testWindow.brackets.test).toBeTruthy();
            });

            runs(function () {

                var updates = [
                    {
                        "buildNumber": 17622,

                        "platforms": {
                            "WIN": {
                                "checksum": "0",
                                "downloadURL": validInstallerFilePaths["WIN"]
                            },
                            "OSX": {
                                "checksum": "0",
                                "downloadURL": validInstallerFilePaths["OSX"]
                            }
                        }
                    }
                ];

                //Trigger the auto update process
                AutoUpdate._updateProcessHandler(updates);

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
                    checkUpdateBar(Strings.VALIDATION_FAILED);
                    checkUpdateBarButton(CLOSE_ICON, true);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);
        }


        it("should download and validate successfully, prompt the user for Restart/Later buttons", downloadSuccess);

        /**
         * Tests the Auto update scenario of successful download,
         * successful validation and Update Bar prompt for Restart/Later message.
         */
        function downloadSuccess() {

            runs(function () {
                expect(testWindow.brackets.test).toBeTruthy();
            });

            runs(function () {
                var updates = [
                    {
                        "buildNumber": 17622,

                        "platforms": {
                            "WIN": {
                                "checksum": "444e49b46ec8e9ec0823516c7213ef610e3e6bf33691a2488b7ddd2561e40eec",
                                "downloadURL": validInstallerFilePaths["WIN"]
                            },
                            "OSX": {
                                "checksum": "10d8328fda10697a5e340dcaffc103675c51c63313ca7057e0426cff6378596d",
                                "downloadURL": validInstallerFilePaths["OSX"]
                            }
                        }
                    }
                ];

                // Trigger the auto update workflow
                AutoUpdate._updateProcessHandler(updates);

            });

            waitsFor(function () {

                downloadCompleted = testWindow.brackets.test.AutoUpdate.downloadCompleted;
                validationCompleted = testWindow.brackets.test.AutoUpdate.validationCompleted;
                if (downloadCompleted && validationCompleted) {
                    installerPath = testWindow.brackets.test.AutoUpdate.installerPath;
                    installerPath = installerPath.replace("\"", "");
                    installerPath = installerPath.replace("\"", "");
                    installerPath = installerPath.split("\\");
                    installerPath = installerPath.join("/");
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
                    expect(errorString).toBeNull();
                    // We will wait for 3 seconds before testing for popup.
                    waitForMilliSeconds(3000);
                }
            });

            runs(function () {

                if (downloadCompleted && validationCompleted) {

                    // Test if the update bar has been displayed.
                    checkUpdateBar(Strings.DOWNLOAD_COMPLETE);
                    checkUpdateBarButton(UPDATE_RESTART_BTN, false);
                    checkUpdateBarButton(UPDATE_LATER_BTN, true);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);

        }

        it("should check Update Status and Promt to User for Update Failure", updateFail);

        /**
         * Tests the Auto update scenario of Update Failure,
         * and validate Update Success message in Update Bar prompt.
         * It imitates Update Failure scenarios
         * This imitation is needed as the actual update process(running of installer/script)
         * cannot be achieved in the same session of app, and hence, cannot be tested by unit tests.
         */
        function updateFail() {

            runs(function () {
                expect(testWindow.brackets.test).toBeTruthy();
            });

            runs(function () {
                waitForMilliSeconds(3000);
                AutoUpdate.setUpdateStateInJson("updateInitiatedInPrevSession", true)
                   .done(function () {
                       AutoUpdate.checkUpdateStatus(true);
                       updateCheckCompleted = true;
                   });
            });

            waitsFor(function () {
                if(updateCheckCompleted) {
                    waitForMilliSeconds(3000);
                }
                return updateCheckCompleted;
            }, "Checking Update Status is taking too long to complete", 30000);

            runs(function() {
                // Test if the update bar has been displayed.
                if(updateCheckCompleted) {
                    // Test if the update bar has been displayed.
                    checkUpdateBar(Strings.UPDATE_FAILED);
                    checkUpdateBarButton(CLOSE_ICON, true);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);
        }

        it("should check Update Status and Promt to User for Update Success", updateSuccess);

        /**
         * Tests the Auto update scenario of Update Success,
         * and validate Update Success message in Update Bar prompt.
         * It imitates Update Success scenarios,
         * This imitation is needed as the actual update process(running of installer/script)
         * cannot be achieved in the same session of app, and hence, cannot be tested by unit tests.
         */
        function updateSuccess() {

            runs(function () {
                expect(testWindow.brackets.test).toBeTruthy();
            });

            runs(function () {
                waitForMilliSeconds(3000);
                var currentBuildNumber = Number(/-([0-9]+)/.exec(brackets.metadata.version)[1]);
                AutoUpdate.setUpdateStateInJson("latestBuildNumber", currentBuildNumber)
                   .done(function () {
                       AutoUpdate.checkUpdateStatus();
                       updateCheckCompleted = true;
                   });
            });


            waitsFor(function () {
                if(updateCheckCompleted) {
                    waitForMilliSeconds(3000);
                }
                return updateCheckCompleted;
            }, "Checking Update Status is taking too long to complete", 30000);

            runs(function() {
                if(updateCheckCompleted) {
                    // Test if the update bar has been displayed.
                    checkUpdateBar(Strings.UPDATE_SUCCESSFUL);
                    checkUpdateBarButton(CLOSE_ICON, true);
                }
            });

            waitsFor(function () {
                return updateBarDismissed;
            }, "Dismissing popup is taking too long to complete", 5000);

        }
    });

});
