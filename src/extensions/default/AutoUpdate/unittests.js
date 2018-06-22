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
        appInitDone,
        installerPath,
        errorString,
        fileCheckCompleted,
        downloadCompleted,
        updateBarPresent,
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
                testWindow.brackets.test["AutoUpdate"] = {
                    updateJsonHandler: null
                };
            });
            appInitDone = false;
        });

        afterLast(function () {
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
        });


        beforeEach(function () {
            fileCheckCompleted = false;
            updateBarPresent   = false;
            updateBarDismissed = false;
            downloadCompleted = false;
            installerPath = "";
            errorString   = "";
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
         * Check the presence of Update Bar String on Brackets Window
         * @param {String} title - Title String Which will be matched with Update Bar heading.
         * @param {String} description - description String Which will be matched with Update Bar description.
         */
        function checkUpdateBarString(title, titleDescription) {
            var doc = $(testWindow.document),
                updBar = doc.find(UPDATE_BAR),
                heading = updBar.find('#heading'),
                description = updBar.find('#description');

            // Test if the update bar has been displayed.
            expect(updBar.length).toBe(1);
            if (title) {
                expect(heading.text()).toBe(title);
            }
            if (titleDescription) {
                expect(description.text()).toBe(titleDescription);
            }
        }

        /**
         * Check the presence of Update Bar Prompt on Brackets Window
         */
        function checkUpdateBar() {
            var doc = $(testWindow.document),
                updBar = doc.find(UPDATE_BAR),
                updBarPresent = false;

            if (updBar && updBar.length > 0) {
                updBarPresent =  true;
            }
            return updBarPresent;
        }

        it("should load the AutoUpdate Exiension Successfuly", function () {
            var brackets = testWindow.brackets,
                extensionRequire = brackets.test.ExtensionLoader.getRequireContextForExtension("AutoUpdate");
            AutoUpdate = extensionRequire("main");

            waitForMilliSeconds(5000);
            runs(function () {
                expect(AutoUpdate).not.toBeNull();
                if (AutoUpdate) {
                    expect(AutoUpdate.initTestEnv).not.toBeNull();
                    AutoUpdate.initTestEnv();
                    expect(AutoUpdate._updateProcessHandler).not.toBeNull();
                    appInitDone = true;
                }
            });
        });


        it("should attempt download, fail, retry and eventually prompt for failure", downloadFailure);

        /**
         * Tests the download failure scenario for Auto Update
         * and validate download failure message in Update Bar prompt.
         */
        function downloadFailure() {
            expect(appInitDone).toBe(true);
            if (appInitDone) {
                runs(function() {
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
                });

                waitsFor(function () {
                    updateBarPresent = checkUpdateBar();
                    if (updateBarPresent) {
                        waitForMilliSeconds(3000);
                    }
                    return (updateBarPresent);
                }, "Download is taking too long to complete", 30000);

                runs(function() {
                    expect(updateBarPresent).toBe(true);
                    if (updateBarPresent) {
                        checkUpdateBarString(Strings.DOWNLOAD_FAILED);
                        checkUpdateBarButton(CLOSE_ICON, true);
                    }
                });
                waitsFor(function () {
                    return updateBarDismissed;
                }, "Dismissing popup is taking too long to complete", 5000);
            }
        }


        it("should download successfully and attempt to validate the download, but with failure and prompt for failure", validationFailure);


        /**
         * Tests the validation failure scenario for Auto Update
         * and validate validation failure message in Update Bar prompt.
         */
        function validationFailure() {
            expect(appInitDone).toBe(true);
            if (appInitDone) {
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

                    // Trigger the auto update process
                    AutoUpdate._updateProcessHandler(updates);
                });

                waitsFor(function () {
                    updateBarPresent = checkUpdateBar();
                    if (updateBarPresent) {
                        waitForMilliSeconds(3000);
                    }
                    return (updateBarPresent);
                }, "Download and Validation is taking too long to complete", 30000);

                runs(function () {
                    expect(updateBarPresent).toBe(true);
                    if (updateBarPresent) {
                        checkUpdateBarString(Strings.VALIDATION_FAILED, Strings.CHECKSUM_DID_NOT_MATCH);
                        checkUpdateBarButton(CLOSE_ICON, true);
                    }
                });

                waitsFor(function () {
                    return updateBarDismissed;
                }, "Dismissing popup is taking too long to complete", 5000);
            }
        }


        it("should download and validate successfully, prompt the user for Restart/Later buttons", downloadSuccess);

        /**
         * Tests the Auto update scenario of successful download,
         * successful validation and Update Bar prompt for Restart/Later message.
         */
        function downloadSuccess(buildNumber) {
            expect(appInitDone).toBe(true);
            if (appInitDone) {
                var currentBuildNumber = buildNumber;
                if(currentBuildNumber === undefined) {
                    currentBuildNumber = 767; // some random number
                }
                runs(function () {
                    var updates = [
                        {
                            "buildNumber": currentBuildNumber,
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
                    // Trigger the auto update process
                    AutoUpdate._updateProcessHandler(updates);
                });
                waitsFor(function () {
                    updateBarPresent = checkUpdateBar();
                    if (updateBarPresent) {
                        waitForMilliSeconds(3000);
                    }
                    return (updateBarPresent);
                }, "Download and Validation is taking too long to complete", 30000);

                runs(function () {
                    expect(updateBarPresent).toBe(true);

                    if (updateBarPresent) {
                    // Test if the file exists
                        var appSupportDirectory = brackets.app.getApplicationSupportDirectory(),
                            updateDir = appSupportDirectory + '/updateTemp',
                            OS = AutoUpdate.getPlatformInfo(),
                            installerName = validInstallerFilePaths[OS].split("/").pop();
                        installerPath = [updateDir, installerName].join("/");
                        FileSystem.resolve(installerPath, function (errString, fsEntry, fileStats) {
                            fileCheckCompleted = true;
                            errorString = errString;
                        });
                    }
                });

                waitsFor(function () {
                    return fileCheckCompleted;
                }, "File exists check is taking too long to complete", 30000);
                // Time out is 30 seconds. Try increasing this if the test fails.
                runs(function () {
                    expect(fileCheckCompleted).toBe(true);
                    if (fileCheckCompleted) {
                        expect(errorString).toBeNull();
                    }
                    checkUpdateBarString(Strings.DOWNLOAD_COMPLETE, Strings.CLICK_RESTART_TO_UPDATE);
                    checkUpdateBarButton(UPDATE_RESTART_BTN, false);
                    checkUpdateBarButton(UPDATE_LATER_BTN, true);
                });

                waitsFor(function () {
                    return updateBarDismissed;
                }, "Dismissing popup is taking too long to complete", 5000);

                downloadCompleted = true;
            }
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
            expect(appInitDone).toBe(true);
            if (appInitDone) {
                var flagSet = false;
                AutoUpdate.setUpdateStateInJson("updateInitiatedInPrevSession", true)
                    .done(function() {
                        flagSet = true;
                    });
                waitsFor(function () {
                    return flagSet;
                }, "Setting updateInitiatedInPrevSession Flag is taking too long", 3000);

                runs(function() {
                    AutoUpdate.checkUpdateStatus();
                });

                waitsFor(function () {
                    updateBarPresent = checkUpdateBar();
                    if (updateBarPresent) {
                        waitForMilliSeconds(3000);
                    }
                    return (updateBarPresent);
                }, "Download and Validation is taking too long to complete", 30000);

                runs(function() {
                    expect(updateBarPresent).toBe(true);
                    if (updateBarPresent) {
                        checkUpdateBarString(Strings.UPDATE_FAILED);
                        checkUpdateBarButton(CLOSE_ICON, true);
                    }
                });
                waitsFor(function () {
                    return updateBarDismissed;
                }, "Dismissing popup is taking too long to complete", 5000);
            }
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
            expect(appInitDone).toBe(true);
            if (appInitDone) {
                runs(function () {
                    var currentBuildNumber = Number(/-([0-9]+)/.exec(brackets.metadata.version)[1]);
                    downloadSuccess(currentBuildNumber);
                });

                waitsFor(function () {
                    if (downloadCompleted) {
                        waitForMilliSeconds(3000);
                    }
                    return (downloadCompleted);
                }, "Download and Validation is taking too long to complete", 30000);
                var flagSet = false;
                runs(function() {
                    if (downloadCompleted) {
                        AutoUpdate.setUpdateStateInJson("updateInitiatedInPrevSession", true)
                            .done(function() {
                                flagSet = true;
                            });
                    }
                });
                waitsFor(function () {
                    return flagSet;
                }, "Setting updateInitiatedInPrevSession Flag is taking too long", 3000);

                runs(function () {
                    AutoUpdate.checkUpdateStatus();
                });

                waitsFor(function () {
                    updateBarPresent = checkUpdateBar();
                    if (updateBarPresent) {
                        waitForMilliSeconds(3000);
                    }
                    return (updateBarPresent);
                }, "Download and Validation is taking too long to complete", 30000);

                runs(function() {
                    expect(updateBarPresent).toBe(true);
                    if (updateBarPresent) {
                        checkUpdateBarString(Strings.UPDATE_SUCCESSFUL);
                        checkUpdateBarButton(CLOSE_ICON, true);
                    }
                });
                waitsFor(function () {
                    return updateBarDismissed;
                }, "Dismissing popup is taking too long to complete", 5000);
            }
        }
    });

});
