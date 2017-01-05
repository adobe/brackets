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

/*global describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, spyOn, beforeFirst, afterLast */
/*unittests: Install Extension Dialog*/

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        KeyEvent        = require("utils/KeyEvent"),
        FileSystem,
        Strings         = require("strings");

    describe("Install Extension Dialog", function () {
        var testWindow, dialog, fields, closed,
            url = "http://brackets.io/extensions/myextension.zip";

        this.category = "integration";

        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                FileSystem = testWindow.brackets.test.FileSystem;
            });
        });

        afterLast(function () {
            testWindow = null;
            SpecRunnerUtils.closeTestWindow();
        });

        afterEach(function () {
            testWindow.brackets.config.extension_listing_url = brackets.config.extension_listing_url;
            runs(function () {
                if (dialog) {
                    dialog._close();
                } else {
                    closed = true;
                }
            });
            waitsFor(function () { return closed; }, "dialog closing");
            runs(function () {
                fields = null;
                closed = false;
                dialog = null;
            });
        });

        var successfulResult = {
            installationStatus: "INSTALLED"
        };

        function makeInstaller(succeed, deferred) {
            var installer = {
                install: function () {
                    if (!deferred) {
                        deferred = new $.Deferred();
                        if (succeed) {
                            deferred.resolve(successfulResult);
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
            dialog._installer = installer;
            return installer;
        }

        describe("with Browse Extensions enabled", function () {
            it("should open the extension list wiki page when the user clicks on the Browse Extensions button", function () {
                // Set the extension_listing_url in the configuration so that the button will
                // show up.
                var extensionListingURL = "https://github.com/adobe/brackets/wiki/Brackets-Extensions";
                testWindow.brackets.config.extension_listing_url = extensionListingURL;

                dialog = new testWindow.brackets.test.InstallExtensionDialog._Dialog();
                dialog.show()
                    .always(function () {
                        closed = true;
                    });

                fields = {
                    $browseExtensionsButton: dialog.$browseExtensionsButton
                };

                var NativeApp = testWindow.brackets.getModule("utils/NativeApp");
                spyOn(NativeApp, "openURLInDefaultBrowser");
                fields.$browseExtensionsButton.click();
                expect(NativeApp.openURLInDefaultBrowser).toHaveBeenCalledWith(extensionListingURL);
            });
        });

        describe("when user-initiated", function () {

            beforeEach(function () {
                closed = false;
                dialog = new testWindow.brackets.test.InstallExtensionDialog._Dialog();
                dialog.show()
                    .always(function () {
                        closed = true;
                    });
                fields = {
                    $dlg: dialog.$dlg,
                    $okButton: dialog.$okButton,
                    $cancelButton: dialog.$cancelButton,
                    $url: dialog.$url,
                    $browseExtensionsButton: dialog.$browseExtensionsButton
                };
            });

            function setUrl() {
                fields.$url
                    .val(url)
                    .trigger("input");
            }

            it("should open the dialog", function () {
                expect(fields.$dlg[0]).toBeTruthy();
            });

            it("should have the install button disabled when dialog is first open due to empty url field", function () {
                expect(fields.$okButton.prop("disabled")).toBe(true);
            });

            it("should not start install if enter hit while url field is empty", function () {
                var installer = makeInstaller(true);
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(installer.install).not.toHaveBeenCalled();
            });

            it("should close the dialog when Cancel button clicked before entering url", function () {
                fields.$cancelButton.click();
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            // bootstrap-modal handles Esc on keyup
            it("should close the dialog when Esc pressed before entering url", function () {
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should enable the install button when the url field is nonempty", function () {
                setUrl();
                expect(fields.$okButton.prop("disabled")).toBe(false);
            });

            it("should re-disable the install button if the url field becomes nonempty and then empty", function () {
                setUrl();
                fields.$url
                    .val("")
                    .trigger("input");
                expect(fields.$okButton.prop("disabled")).toBe(true);
            });

            it("should close the dialog when Cancel button clicked after entering url", function () {
                setUrl();
                fields.$cancelButton.click();
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog when Esc pressed after entering url", function () {
                setUrl();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should start the installer with the given URL when Install button clicked", function () {
                var installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                expect(installer.install).toHaveBeenCalledWith(url);
            });

            it("should start the installer with the given URL when Enter is pressed", function () {
                var installer = makeInstaller(true);
                setUrl();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(installer.install).toHaveBeenCalledWith(url);
            });

            it("should disable the ok button while installing", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                expect(fields.$okButton.prop("disabled")).toBe(true);
                deferred.resolve(successfulResult);
            });

            it("should hide the url field and 'browse extensions' button while installing", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                expect(fields.$url.is(":visible")).toBe(false);
                expect(fields.$browseExtensionsButton.is(":visible")).toBe(false);
                deferred.resolve(successfulResult);
            });

            it("should do nothing if Enter pressed while installing", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                installer.install.reset();

                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(installer.install).not.toHaveBeenCalled();
                expect(installer.cancel).not.toHaveBeenCalled();

                deferred.resolve(successfulResult);
            });

            it("should cancel installation if cancel clicked while installing", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                expect(installer.cancel).toHaveBeenCalled();
                deferred.resolve(successfulResult);
            });

            it("should cancel installation if Esc pressed while installing", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(installer.cancel).toHaveBeenCalled();
                deferred.resolve(successfulResult);
            });

            it("should disable the cancel button while cancellation is processed", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                expect(fields.$cancelButton.prop("disabled")).toBe(true);
                deferred.reject("CANCELED");
            });

            it("should ignore the Esc key while cancellation is processed", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(true);
                deferred.reject("CANCELED");
            });

            it("should ignore the Enter key while cancellation is processed", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(true);
                deferred.reject("CANCELED");
            });

            it("should re-enable the ok button and hide cancel button after install succeeds", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve(successfulResult);
                expect(fields.$okButton.prop("disabled")).toBe(false);
                expect(fields.$cancelButton.is(":visible")).toBe(false);
            });

            it("should re-enable the ok button and hide cancel button after install succeeds synchronously", function () {
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                expect(fields.$okButton.prop("disabled")).toBe(false);
                expect(fields.$cancelButton.is(":visible")).toBe(false);
            });

            it("should re-enable the ok button and hide cancel button after install fails", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.reject();
                expect(fields.$okButton.prop("disabled")).toBe(false);
                expect(fields.$cancelButton.is(":visible")).toBe(false);
            });

            it("should re-enable the ok button and hide cancel button after install fails synchronously", function () {
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                expect(fields.$okButton.prop("disabled")).toBe(false);
                expect(fields.$cancelButton.is(":visible")).toBe(false);
            });

            it("should re-enable the ok button and hide cancel button after install finishes canceling", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                deferred.reject("CANCELED");
                expect(fields.$okButton.prop("disabled")).toBe(false);
                expect(fields.$cancelButton.is(":visible")).toBe(false);
            });

            it("should close the dialog if ok button clicked after install succeeds", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve(successfulResult);
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if ok button clicked after install succeeds synchronously", function () {
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Enter pressed after install succeeds", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve(successfulResult);
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Enter pressed after install succeeds synchronously", function () {
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Esc pressed after install succeeds", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve(successfulResult);
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Esc pressed after install succeeds synchronously", function () {
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if ok button clicked after install fails", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.reject();
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if ok button clicked after install fails synchronously", function () {
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Enter pressed after install fails", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.reject();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Enter pressed after install fails synchronously", function () {
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Esc pressed after install fails", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.reject();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Esc pressed after install fails synchronously", function () {
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if ok button clicked after install finishes canceling", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                deferred.reject("CANCELED");
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Enter pressed after install finishes canceling", function () {
                var deferred = new $.Deferred();
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                deferred.reject("CANCELED");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should close the dialog if Esc pressed after install finishes canceling", function () {
                var deferred = new $.Deferred();
                makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                deferred.reject("CANCELED");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBe(false);
            });


            // Cancellation timing

            it("should time out and re-enable close button if cancel doesn't complete quickly", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    expect(fields.$okButton.prop("disabled")).toBe(false);
                    deferred.reject("CANCELED");
                });
            });

            it("should close when clicking Close button after timing out if cancel doesn't complete quickly", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    fields.$okButton.click();
                    expect(fields.$dlg.is(":visible")).toBe(false);
                    deferred.reject("CANCELED");
                });
            });

            it("should close when hitting Enter after timing out if cancel doesn't complete quickly", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    fields.$okButton.click();
                    SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                    deferred.reject("CANCELED");
                });
            });

            it("should close when hitting Esc after timing out if cancel doesn't complete quickly", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    fields.$okButton.click();
                    SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                    deferred.reject("CANCELED");
                });
            });

            // Cancelation vs. successful install race conditions
            it("should keep close button enabled and not throw an exception if install succeeds quickly after cancelation", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                    deferred.resolve(successfulResult);
                    expect(fields.$okButton.prop("disabled")).toBe(false);
                });
            });
            it("should keep close button enabled and not throw an exception if install succeeds slowly after cancelation", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    deferred.resolve(successfulResult);
                    expect(fields.$okButton.prop("disabled")).toBe(false);
                });
            });
            it("should stay closed and not throw an exception if install succeeds after cancelation & force close", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    fields.$okButton.click();  // force close
                    deferred.resolve(successfulResult);
                    expect(fields.$dlg.is(":visible")).toBe(false);
                });
            });

            // Cancelation vs. failed install race conditions
            it("should keep close button enabled and not throw an exception if install fails quickly after cancelation", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                    deferred.reject();
                    expect(fields.$okButton.prop("disabled")).toBe(false);
                });
            });
            it("should keep close button enabled and not throw an exception if install fails slowly after cancelation", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    deferred.reject();
                    expect(fields.$okButton.prop("disabled")).toBe(false);
                });
            });
            it("should stay closed and not throw an exception if install fails after cancelation & force close", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    fields.$okButton.click();  // force close
                    deferred.reject();
                    expect(fields.$dlg.is(":visible")).toBe(false);
                });
            });

            // Cancelation actually suceeding
            it("should keep close button enabled and not throw an exception if install cancelation completes quickly after cancelation", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                    deferred.reject("CANCELED");
                    expect(fields.$okButton.prop("disabled")).toBe(false);
                });
            });
            it("should keep close button enabled and not throw an exception if install cancelation completes slowly after cancelation", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    deferred.reject("CANCELED");
                    expect(fields.$okButton.prop("disabled")).toBe(false);
                });
            });
            it("should stay closed and not throw an exception if install cancelation completes after cancelation & force close", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    fields.$okButton.click();  // force close
                    deferred.reject("CANCELED");
                    expect(fields.$dlg.is(":visible")).toBe(false);
                });
            });


            it("should not display the Browse Extensions button in the default configuration", function () {
                expect(fields.$browseExtensionsButton.length).toBe(0);
            });

            it("should display a warning message if the extension is already installed", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve({
                    installationStatus: "ALREADY_INSTALLED"
                });
                expect(fields.$okButton.text()).toEqual(Strings.OVERWRITE);
                expect(fields.$okButton.prop("disabled")).toBe(false);
                expect(fields.$cancelButton.text()).toEqual(Strings.CANCEL);
                expect(fields.$cancelButton.prop("disabled")).toBe(false);
                expect(fields.$browseExtensionsButton.is(":visible")).toBe(false);
                expect(fields.$dlg.find(".message").text()).toBe(Strings.EXTENSION_ALREADY_INSTALLED);
            });

            it("should display a warning message if the same version is already installed", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve({
                    installationStatus: "SAME_VERSION"
                });
                expect(fields.$okButton.text()).toEqual(Strings.OVERWRITE);
                expect(fields.$okButton.prop("disabled")).toBe(false);
                expect(fields.$cancelButton.text()).toEqual(Strings.CANCEL);
                expect(fields.$cancelButton.prop("disabled")).toBe(false);
                expect(fields.$browseExtensionsButton.is(":visible")).toBe(false);
                expect(fields.$dlg.find(".message").text()).toBe(Strings.EXTENSION_SAME_VERSION);
            });

            it("should display a warning message if an older version is already installed", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve({
                    installationStatus: "OLDER_VERSION",
                    installedVersion: "1.0.0",
                    metadata: {
                        version: "0.9.0"
                    }
                });
                expect(fields.$okButton.text()).toEqual(Strings.OVERWRITE);
                expect(fields.$okButton.prop("disabled")).toBe(false);
                expect(fields.$cancelButton.text()).toEqual(Strings.CANCEL);
                expect(fields.$cancelButton.prop("disabled")).toBe(false);
                expect(fields.$browseExtensionsButton.is(":visible")).toBe(false);
                expect(fields.$dlg.find(".message").text().indexOf("0.9.0")).not.toEqual(-1);
            });

            it("should delete the downloaded file if the warning message is cancelled", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                var packageFilename = "/path/to/downloaded/package.zip",
                    file = FileSystem.getFileForPath(packageFilename);
                deferred.resolve({
                    installationStatus: "ALREADY_INSTALLED",
                    localPath: packageFilename
                });
                spyOn(file, "unlink");
                fields.$cancelButton.click();
                expect(file.unlink).toHaveBeenCalled();
                expect(fields.$dlg.is(":visible")).toBe(false);
            });

            it("should pass the installation result if the warning message is confirmed", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                var packageFilename = "/path/to/downloaded/package.zip",
                    file = FileSystem.getFileForPath(packageFilename);
                deferred.resolve({
                    installationStatus: "ALREADY_INSTALLED",
                    localPath: packageFilename
                });
                spyOn(file, "unlink");
                var dialogDone = false;
                dialog._dialogDeferred.done(function (result) {
                    dialogDone = true;
                    expect(result.installationStatus).toBe("ALREADY_INSTALLED");
                });
                fields.$okButton.click();
                expect(file.unlink).not.toHaveBeenCalled();
                expect(fields.$dlg.is(":visible")).toBe(false);
                expect(dialogDone).toBe(true);
            });

            it("should pass installation result when update is needed", function () {
                var deferred = new $.Deferred();
                makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                var packageFilename = "/path/to/downloaded/package.zip";
                deferred.resolve({
                    installationStatus: "NEEDS_UPDATE",
                    localPath: packageFilename
                });
                expect(fields.$dlg.is(":visible")).toBe(true);
                expect(fields.$dlg.find(".message").text()).toBe(Strings.EXTENSION_UPDATE_INSTALLED);
                expect(fields.$okButton.text()).toBe(Strings.CLOSE);
                expect(fields.$cancelButton.is(":visible")).toBe(false);
                fields.$okButton.click();
                var dialogDone = false;
                dialog._dialogDeferred.done(function (result) {
                    dialogDone = true;
                    expect(result.installationStatus).toBe("NEEDS_UPDATE");
                });
                expect(dialogDone).toBe(true);
            });
        });

        describe("when initiated from Extension Manager", function () {
            var url = "https://my.repository.io/my-extension.zip", installer;
            beforeEach(function () {
                closed = false;
            });

            it("should immediately start installing from the given url, and in the correct UI state", function () {
                var deferred = new $.Deferred();
                dialog = new testWindow.brackets.test.InstallExtensionDialog._Dialog();
                installer = makeInstaller(null, deferred);
                dialog.show(url)
                    .always(function () {
                        closed = true;
                    });
                fields = {
                    $dlg: dialog.$dlg,
                    $okButton: dialog.$okButton,
                    $cancelButton: dialog.$cancelButton,
                    $url: dialog.$url
                };
                expect(installer.install).toHaveBeenCalledWith(url);
                expect(fields.$okButton.prop("disabled")).toBe(true);
                expect(fields.$url.is(":visible")).toBe(false);
                deferred.resolve(successfulResult);
            });
        });
    });
});
