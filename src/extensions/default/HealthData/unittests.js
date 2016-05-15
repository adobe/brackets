/*
 * Copyright (c) 2015 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, describe, runs, beforeEach, it, afterEach, expect, waitsForDone, waitsForFail */
/*unittests: HealthData*/

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils");

    var testWindow,
        PreferencesManager;

    describe("HealthData", function () {

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
            });

        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
        });


        describe("Data Send to Server", function () {
            var ONE_DAY = 24 * 60 * 60 * 1000,
                FIRST_LAUNCH_SEND_DELAY = 30 * 60 * 1000,
                prefs,
                HealthDataManager;

            beforeEach(function () {
                PreferencesManager = testWindow.brackets.test.PreferencesManager;
                prefs = PreferencesManager.getExtensionPrefs("healthData");
                HealthDataManager = testWindow.brackets.test.HealthDataManager;

                this.addMatchers({
                    // Oddly, Jasmine has expect().toBeGreaterThan() built in, but not greater-or-equal
                    toBeGreaterOrEqualTo: function (expected) {
                        this.message = function () {
                            return "Expected " + this.actual + " to be >= " + expected;
                        };
                        return this.actual >= expected;
                    }
                });
            });

            afterEach(function () {
                HealthDataManager = null;
                prefs = null;
                PreferencesManager = null;
            });

            it("should send data to server when opted in", function () {
                var baseTime = Date.now();
                PreferencesManager.setViewState("nextHealthDataSendTime", baseTime);
                PreferencesManager.setViewState("healthDataNotificationShown", true);
                var promise = HealthDataManager.checkHealthDataSend();
                waitsForDone(promise, "Send Data to Server", 4000);
                expect(PreferencesManager.getViewState("nextHealthDataSendTime")).toBeGreaterOrEqualTo(baseTime + ONE_DAY);
            });

            it("should not send data right away on first launch", function () {
                var baseTime = Date.now();
                PreferencesManager.setViewState("nextHealthDataSendTime", null);
                PreferencesManager.setViewState("healthDataNotificationShown", true);
                var promise = HealthDataManager.checkHealthDataSend();
                waitsForFail(promise, "Send Data to Server", 4000);
                expect(PreferencesManager.getViewState("nextHealthDataSendTime")).toBeGreaterOrEqualTo(baseTime + FIRST_LAUNCH_SEND_DELAY);
            });

            it("should not send data to server when opted out", function () {
                PreferencesManager.setViewState("nextHealthDataSendTime", Date.now());
                prefs.set("healthDataTracking", false);
                var promise = HealthDataManager.checkHealthDataSend();
                waitsForFail(promise, "Send Data to Server", 4000);
            });

        });

        describe("Notification popup", function () {
            var HealthDataPopup;

            beforeEach(function () {
                HealthDataPopup = testWindow.brackets.test.HealthDataPopup;
            });

            afterEach(function () {
                HealthDataPopup = null;
            });

            it("should show notification popup", function () {
                // TODO: write a test that verifies this actually shows *on a clean launch*, not just when API called...
                HealthDataPopup.showFirstLaunchTooltip();
                expect($(testWindow.document).find("#healthdata-firstlaunch-popup").length).toBe(1);
            });
        });

        describe("Health Data Statistics is displayed", function () {
            var HealthDataPreview;

            beforeEach(function () {
                HealthDataPreview = testWindow.brackets.test.HealthDataPreview;
            });

            afterEach(function () {
                HealthDataPreview = null;
            });

            it("should show file preview dialog", function () {

                runs(function () {
                    var promise = HealthDataPreview.previewHealthData();
                    waitsForDone(promise, "Health Data File Preview", 4000);
                });

                runs(function () {
                    expect($(testWindow.document).find(".health-data-preview.instance").length).toBe(1);
                });

            });
        });
    });

});
