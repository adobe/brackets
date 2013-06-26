/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, brackets, describe, it, expect, beforeEach, afterEach, waitsFor, waits, waitsForDone, runs */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var UpdateNotification, // Load from brackets.test
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    describe("UpdateNotification", function () {
        
        this.category = "integration";

        var updateInfoURL = "file://" + SpecRunnerUtils.getTestPath("/spec/UpdateNotification-test-files") + "/versionInfo.json",
            maliciousInfoURL = "file://" + SpecRunnerUtils.getTestPath("/spec/UpdateNotification-test-files") + "/versionInfoXSS.json",
            testWindow;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                // Load module instances from brackets.test
                UpdateNotification = testWindow.brackets.test.UpdateNotification;
            });
        });

        afterEach(function () {
            testWindow         = null;
            UpdateNotification = null;
            SpecRunnerUtils.closeTestWindow();
        });

        it("should show a notification if an update is available", function () {
            var updateInfo = {
                _buildNumber: 72,
                _lastNotifiedBuildNumber: 0,
                _versionInfoURL: updateInfoURL
            };
            
            runs(function () {
                var promise = UpdateNotification.checkForUpdate(false, updateInfo);
                waitsForDone(promise, "Check for updates");
            });
            
            runs(function () {
                expect($(testWindow.document).find(".update-dialog.instance").length).toBe(1);
            });
        });
        
        it("should show update information for all available updates", function () {
            var updateInfo = {
                _buildNumber: 10,
                _lastNotifiedBuildNumber: 0,
                _versionInfoURL: updateInfoURL
            };
            
            runs(function () {
                var promise = UpdateNotification.checkForUpdate(false, updateInfo);
                waitsForDone(promise, "Check for updates");
            });
            
            runs(function () {
                var $doc = $(testWindow.document);
                expect($doc.find(".update-dialog.instance").length).toBe(1);
                expect($doc.find(".update-dialog.instance .update-info li").length).toBe(9);
            });
        });
        
        it("should not show dialog if user has already been notified", function () {
            var updateInfo = {
                _buildNumber: 10,
                _lastNotifiedBuildNumber: 93,
                _versionInfoURL: updateInfoURL
            };
            
            runs(function () {
                var promise = UpdateNotification.checkForUpdate(false, updateInfo);
                waitsForDone(promise, "Check for updates");
            });
            
            runs(function () {
                var $doc = $(testWindow.document);
                expect($doc.find(".update-dialog.instance").length).toBe(0);
            });
        });
        
        it("should not show dialog if app is up to date", function () {
            var updateInfo = {
                _buildNumber: 93,
                _lastNotifiedBuildNumber: 0,
                _versionInfoURL: updateInfoURL
            };
            
            runs(function () {
                var promise = UpdateNotification.checkForUpdate(false, updateInfo);
                waitsForDone(promise, "Check for updates");
            });
            
            runs(function () {
                var $doc = $(testWindow.document);
                expect($doc.find(".update-dialog.instance").length).toBe(0);
            });
        });
        
        it("should show an 'up to date' alert if no updates are available and the user manually checks for updates", function () {
            var updateInfo = {
                _buildNumber: 93,
                _lastNotifiedBuildNumber: 93,
                _versionInfoURL: updateInfoURL
            };
            
            runs(function () {
                var promise = UpdateNotification.checkForUpdate(true, updateInfo);
                waitsForDone(promise, "Check for updates");
            });
            
            runs(function () {
                var $doc = $(testWindow.document);
                // The "No Updates Found" dialog is actually an instance of error-dialog
                expect($doc.find(".error-dialog.instance").length).toBe(1);
            });
        });
        
        it("should sanitize text returned from server", function () {
            var updateInfo = {
                _buildNumber: 72,
                _lastNotifiedBuildNumber: 0,
                _versionInfoURL: maliciousInfoURL
            };
            
            runs(function () {
                var promise = UpdateNotification.checkForUpdate(true, updateInfo);
                waitsForDone(promise, "Check for updates");
            });
            
            runs(function () {
                var $doc = $(testWindow.document);
                expect($doc.find(".update-dialog.instance").length).toBe(1);
                // Check for "<script>" in the text. This means it wasn't stripped
                // out and run as a script.
                var txt = $doc.find(".update-dialog.instance .update-info li").text();
                expect(txt.indexOf("<script>")).toNotEqual(-1);
            });
        });
    });
});
