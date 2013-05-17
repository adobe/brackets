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
/*global define, describe, it, xit, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn, jasmine */
/*unittests: Install Extension Dialog*/

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        KeyEvent        = require("utils/KeyEvent"),
        NativeApp       = require("utils/NativeApp");

    describe("Install Extension Dialog", function () {
        var testWindow, dialog, fields, goodInstaller, badInstaller, InstallExtensionDialog, closed,
            url = "http://brackets.io/extensions/myextension.zip";
        
        beforeEach(function () {
            if (!testWindow) {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                });
            }
        });

        afterEach(function () {
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
            dialog._installer = installer;
            return installer;
        }
        
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
                expect(fields.$dlg[0]).not.toBeNull();
            });
            
            it("should have the install button disabled when dialog is first open due to empty url field", function () {
                expect(fields.$okButton.attr("disabled")).toBeTruthy();
            });
            
            it("should not start install if enter hit while url field is empty", function () {
                var installer = makeInstaller(true);
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(installer.install).not.toHaveBeenCalled();
            });
            
            it("should close the dialog when Cancel button clicked before entering url", function () {
                fields.$cancelButton.click();
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
            
            // bootstrap-modal handles Esc on keyup
            it("should close the dialog when Esc pressed before entering url", function () {
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
            
            it("should enable the install button when the url field is nonempty", function () {
                setUrl();
                expect(fields.$okButton.attr("disabled")).toBeFalsy();
            });
            
            it("should re-disable the install button if the url field becomes nonempty and then empty", function () {
                setUrl();
                fields.$url
                    .val("")
                    .trigger("input");
                expect(fields.$okButton.attr("disabled")).toBeTruthy();
            });
            
            it("should close the dialog when Cancel button clicked after entering url", function () {
                setUrl();
                fields.$cancelButton.click();
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
            
            it("should close the dialog when Esc pressed after entering url", function () {
                setUrl();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
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
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                expect(fields.$okButton.attr("disabled")).toBeTruthy();
                deferred.resolve();
            });
            
            it("should hide the url field and 'browse extensions' button while installing", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                expect(fields.$url.is(":visible")).toBeFalsy();
                expect(fields.$browseExtensionsButton.is(":visible")).toBeFalsy();
                deferred.resolve();
            });
    
            it("should do nothing if Enter pressed while installing", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                installer.install.reset();
                
                var modSpy = jasmine.createSpy("modSpy");
                fields.$dlg.on("DOMSubtreeModified", modSpy);
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(modSpy).not.toHaveBeenCalled();
                expect(installer.install).not.toHaveBeenCalled();
                expect(installer.cancel).not.toHaveBeenCalled();
                
                deferred.resolve();
            });
            
            it("should cancel installation if cancel clicked while installing", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                expect(installer.cancel).toHaveBeenCalled();
                deferred.resolve();
            });
    
            it("should cancel installation if Esc pressed while installing", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(installer.cancel).toHaveBeenCalled();
                deferred.resolve();
            });
            
            it("should disable the cancel button while cancellation is processed", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                expect(fields.$cancelButton.attr("disabled")).toBeTruthy();
                deferred.reject("CANCELED");
            });
            
            it("should ignore the Esc key while cancellation is processed", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeTruthy();
                deferred.reject("CANCELED");
            });
    
            it("should ignore the Enter key while cancellation is processed", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeTruthy();
                deferred.reject("CANCELED");
            });
    
            it("should re-enable the ok button and hide cancel button after install succeeds", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve();
                expect(fields.$okButton.attr("disabled")).toBeFalsy();
                expect(fields.$cancelButton.is(":visible")).toBeFalsy();
            });
    
            it("should re-enable the ok button and hide cancel button after install succeeds synchronously", function () {
                var installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                expect(fields.$okButton.attr("disabled")).toBeFalsy();
                expect(fields.$cancelButton.is(":visible")).toBeFalsy();
            });
    
            it("should re-enable the ok button and hide cancel button after install fails", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.reject();
                expect(fields.$okButton.attr("disabled")).toBeFalsy();
                expect(fields.$cancelButton.is(":visible")).toBeFalsy();
            });
            
            it("should re-enable the ok button and hide cancel button after install fails synchronously", function () {
                var installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                expect(fields.$okButton.attr("disabled")).toBeFalsy();
                expect(fields.$cancelButton.is(":visible")).toBeFalsy();
            });
            
            it("should re-enable the ok button and hide cancel button after install finishes canceling", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                deferred.reject("CANCELED");
                expect(fields.$okButton.attr("disabled")).toBeFalsy();
                expect(fields.$cancelButton.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if ok button clicked after install succeeds", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve();
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if ok button clicked after install succeeds synchronously", function () {
                var installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if Enter pressed after install succeeds", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if Enter pressed after install succeeds synchronously", function () {
                var installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if Esc pressed after install succeeds", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.resolve();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if Esc pressed after install succeeds synchronously", function () {
                var installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if ok button clicked after install fails", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.reject();
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if ok button clicked after install fails synchronously", function () {
                var installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if Enter pressed after install fails", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.reject();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if Enter pressed after install fails synchronously", function () {
                var installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if Esc pressed after install fails", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                deferred.reject();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
            
            it("should close the dialog if Esc pressed after install fails synchronously", function () {
                var installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });

            it("should close the dialog if ok button clicked after install finishes canceling", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                deferred.reject("CANCELED");
                fields.$okButton.click();
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if Enter pressed after install finishes canceling", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                deferred.reject("CANCELED");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
    
            it("should close the dialog if Esc pressed after install finishes canceling", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(true);
                setUrl();
                fields.$okButton.click();
                fields.$cancelButton.click();
                deferred.reject("CANCELED");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keyup", fields.$dlg[0]);
                expect(fields.$dlg.is(":visible")).toBeFalsy();
            });
                
            it("should time out and re-enable close button if cancel doesn't complete quickly", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    expect(fields.$okButton.attr("disabled")).toBeFalsy();
                    deferred.reject("CANCELED");
                });
            });
            
            it("should close when clicking Close button after timing out if cancel doesn't complete quickly", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    fields.$okButton.click();
                    expect(fields.$dlg.is(":visible")).toBeFalsy();
                    deferred.reject("CANCELED");
                });
            });
            
            it("should close when hitting Enter after timing out if cancel doesn't complete quickly", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
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
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
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

            it("should keep close button enabled and not throw an exception if install succeeds after cancelation", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    deferred.resolve();
                    expect(fields.$okButton.attr("disabled")).toBeFalsy();
                });
            });

            it("should keep close button enabled and not throw an exception if install fails after cancelation", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    deferred.reject();
                    expect(fields.$okButton.attr("disabled")).toBeFalsy();
                });
            });
            
            it("should keep close button enabled and not throw an exception if install cancelation completes after cancelation", function () {
                var deferred = new $.Deferred(),
                    installer = makeInstaller(null, deferred);
                runs(function () {
                    setUrl();
                    dialog._cancelTimeout = 50;
                    fields.$okButton.click();
                    fields.$cancelButton.click();
                });
                waits(100);
                runs(function () {
                    deferred.reject("CANCELED");
                    expect(fields.$okButton.attr("disabled")).toBeFalsy();
                });
            });
            
            it("should open the extension list wiki page when the user clicks on the Browse Extensions button", function () {
                var NativeApp = testWindow.brackets.getModule("utils/NativeApp");
                spyOn(NativeApp, "openURLInDefaultBrowser");
                fields.$browseExtensionsButton.click();
                expect(NativeApp.openURLInDefaultBrowser).toHaveBeenCalledWith("https://github.com/adobe/brackets/wiki/Brackets-Extensions");
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
                expect(fields.$okButton.attr("disabled")).toBeTruthy();
                expect(fields.$url.is(":visible")).toBeFalsy();
                deferred.resolve();
            });
        });
        
        // THIS MUST BE THE LAST SPEC IN THE SUITE
        it("should close the test window", function () {
            SpecRunnerUtils.closeTestWindow();
        });
    });
});
