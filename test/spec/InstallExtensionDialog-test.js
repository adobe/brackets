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
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, waitsForDone, spyOn */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = require("spec/SpecRunnerUtils");

    describe("Install Extension Dialog", function () {
        // Kind of a bummer that we have to run this in a test window, but the dialogs
        // don't seem to work if we run them in the SpecRunner window. This might be because
        // we include the Bootstrap 2 JS in the SpecRunner.
        this.category = "integration";
        
        var fields,
            goodInstaller,
            badInstaller,
            InstallExtensionDialog,
            closed,
            url = "http://brackets.io/extensions/myextension.zip";
        
        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                closed = false;
                InstallExtensionDialog = w.brackets.test.InstallExtensionDialog;
                InstallExtensionDialog._showDialog()
                    .always(function () {
                        closed = true;
                    });
                fields = InstallExtensionDialog._getDialogFields();
            });
        });
        
        afterEach(function () {
            runs(function () {
                InstallExtensionDialog._closeDialog();
            });
            waitsFor(function () { return closed; }, "dialog closing");
            runs(function () {
                fields = null;
                closed = false;
                SpecRunnerUtils.closeTestWindow();
            });
        });
        
        function makeInstaller(succeed, deferred) {
            var installer = {
                install: function () {
                    if (!deferred) {
                        deferred = new $.Deferred();
                        if (succeed) {
                            deferred.resolve();
                        } else {
                            deferred.reject();
                        }
                    }
                    return deferred.promise();
                },
                cancel: function () {
                }
            };
            spyOn(installer, "install").andCallThrough();
            spyOn(installer, "cancel");
            InstallExtensionDialog._setInstaller(installer);
            return installer;
        }
        
        it("should open the dialog", function () {
            expect(fields.$dlg[0]).not.toBeNull();
        });
        
        it("should close the dialog when Cancel button clicked before installation", function () {
            fields.$cancelButton.click();
            expect(fields.$dlg.is(":visible")).toBeFalsy();
        });
        
        // TODO: add case for Install button being disabled when no url entered yet
        
        it("should start the installer with the given URL when Install button clicked", function () {
            var installer = makeInstaller(true);
            fields.$url.val(url);
            fields.$okButton.click();
            expect(installer.install).toHaveBeenCalledWith(url);
        });
        
        it("should disable the ok button while installing", function () {
            var deferred = new $.Deferred(),
                installer = makeInstaller(null, deferred);
            fields.$url.val(url);
            fields.$okButton.click();
            expect(fields.$okButton.attr("disabled")).toBeTruthy();
            deferred.resolve();
        });
        
        it("should cancel installation if cancel clicked while installing", function () {
            var deferred = new $.Deferred(),
                installer = makeInstaller(null, deferred);
            fields.$url.val(url);
            fields.$okButton.click();
            fields.$cancelButton.click();
            expect(installer.cancel).toHaveBeenCalled();
            deferred.resolve();
        });

        it("should re-enable the ok button and hide cancel button after install succeeds", function () {
            var deferred = new $.Deferred(),
                installer = makeInstaller(null, deferred);
            fields.$url.val(url);
            fields.$okButton.click();
            deferred.resolve();
            expect(fields.$okButton.attr("disabled")).toBeFalsy();
            expect(fields.$cancelButton.is(":visible")).toBeFalsy();
        });

        it("should re-enable the ok button and hide cancel button after install fails", function () {
            var deferred = new $.Deferred(),
                installer = makeInstaller(null, deferred);
            fields.$url.val(url);
            fields.$okButton.click();
            deferred.reject();
            expect(fields.$okButton.attr("disabled")).toBeFalsy();
            expect(fields.$cancelButton.is(":visible")).toBeFalsy();
        });
        
        it("should close the dialog if ok button clicked after install succeeds", function () {
            var deferred = new $.Deferred(),
                installer = makeInstaller(null, deferred);
            fields.$url.val(url);
            fields.$okButton.click();
            deferred.resolve();
            fields.$okButton.click();
            expect(fields.$dlg.is(":visible")).toBeFalsy();
        });

        it("should close the dialog if ok button clicked after install fails", function () {
            var deferred = new $.Deferred(),
                installer = makeInstaller(null, deferred);
            fields.$url.val(url);
            fields.$okButton.click();
            deferred.reject();
            fields.$okButton.click();
            expect(fields.$dlg.is(":visible")).toBeFalsy();
        });
    });
});
