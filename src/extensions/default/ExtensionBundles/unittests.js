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
/*global define, describe, it, expect, beforeEach, afterEach, runs, brackets, waitsForDone, waitsFor, xit */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils  = brackets.getModule("spec/SpecRunnerUtils"),
        ExtensionManager = brackets.getModule("extensibility/ExtensionManager"),
        ExtensionManagerViewModel = brackets.getModule("extensibility/ExtensionManagerViewModel"),
        mockExtensionList   = require("text!unittest-files/mockExtensionList.json");

    describe("Extension Bundles", function () {
        describe("Load", function () {
            it("should not return anything from non existing directory", function () {
                var _err,
                    promiseRejected = false;

                runs(function () {
                    ExtensionManager._getExtensionBundles("/doesnexist").done(function (err) {
                        _err = err;
                        promiseRejected = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseRejected === false; }, "Get Extension Bundles");
                });

                runs(function () {
                    expect(_err).toBeUndefined();
                });
            });

            it("should not return anything from empty directory", function () {
                var _bundleFiles,
                    promiseResolved = false;

                runs(function () {
                    var emptyDir = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files/extension-bundles");
                    ExtensionManager._getExtensionBundles(emptyDir).done(function (bundleFiles) {
                        _bundleFiles = bundleFiles;
                        promiseResolved = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseResolved; }, "Get Extension Bundles");
                });

                runs(function () {
                    expect(_bundleFiles.length).toBe(0);
                });
            });

            it("should return one extension bundle file", function () {
                var _bundleFiles,
                    promiseResolved = false;

                runs(function () {
                    var oneBundle = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files/extension-bundles-1");
                    ExtensionManager._getExtensionBundles(oneBundle).done(function (bundleFiles) {
                        _bundleFiles = bundleFiles;
                        promiseResolved = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseResolved; }, "Get Extension Bundles");
                });

                runs(function () {
                    expect(_bundleFiles.length).toBe(1);
                    expect(_bundleFiles[0].name).toBe("test-bundle.json");
                });
            });

            it("should return two extension bundle files", function () {
                var _bundleFiles,
                    promiseResolved = false;

                runs(function () {
                    var twoBundles = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files/extension-bundles-2");
                    ExtensionManager._getExtensionBundles(twoBundles).done(function (bundleFiles) {
                        _bundleFiles = bundleFiles;
                        promiseResolved = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseResolved; }, "Get Extension Bundles");
                });

                runs(function () {
                    expect(_bundleFiles.length).toBe(2);
                    expect(_bundleFiles[0].name).toBe("test-bundle-1.json");
                    expect(_bundleFiles[1].name).toBe("test-bundle-2.json");
                });
            });
        });

        describe("Validate", function () {
            var _err,
                promiseRejected = false;

            it("should fail validating empty object", function () {
                runs(function () {
                    ExtensionManager._validateExtensionBundle({}).fail(function (err) {
                        _err = err;
                        promiseRejected = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseRejected; }, "Validate Extension Bundle");

                });

                runs(function () {
                    expect(_err).toBe("This is an empty object");
                });
            });

            it("should fail validating bundle object with missing name attribute", function () {
                runs(function () {
                    ExtensionManager._validateExtensionBundle({extensions: []}).fail(function (err) {
                        _err = err;
                        promiseRejected = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseRejected; }, "Validate Extension Bundle");

                });

                runs(function () {
                    expect(_err).toBe("bundle format is wrong: name attribute missing");
                });
            });

            it("should fail validating bundle object with missing extensions attribute", function () {
                runs(function () {
                    ExtensionManager._validateExtensionBundle({name: "Test"}).fail(function (err) {
                        _err = err;
                        promiseRejected = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseRejected; }, "Validate Extension Bundle");

                });

                runs(function () {
                    expect(_err).toBe("bundle format is wrong: no extensions attribute defined");
                });
            });

            it("should fail validating bundle object with empty extensions attribute", function () {
                runs(function () {
                    ExtensionManager._validateExtensionBundle({name: "Test", extensions: []}).fail(function (err) {
                        _err = err;
                        promiseRejected = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseRejected; }, "Validate Extension Bundle");

                });

                runs(function () {
                    expect(_err).toBe("bundle format is wrong: no extensions defined");
                });
            });

            it("should sucessfully validate bundle", function () {
                var promiseResolved = false;
                var bundle = {
                    "name": "test bundle",
                    "extensions" : [
                        {
                            "name": "JSHint",
                            "url": "http://zauderhaft.com/jshint-1.0.zip"
                        }
                    ]
                };

                runs(function () {
                    ExtensionManager._validateExtensionBundle(bundle).done(function () {
                        promiseResolved = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseResolved; }, "Validate Extension Bundle");

                });
            });

            it("should sucessfully validate bundle without url attribute", function () {
                var promiseResolved = false;
                var testBundleInfo = {
                    "name": "test bundle",
                    "extensions" : [
                        {
                            "name": "JSHint"
                        }
                    ]
                };

                runs(function () {
                    ExtensionManager._validateExtensionBundle(testBundleInfo).done(function () {
                        promiseResolved = true;
                    });
                });

                runs(function () {
                    waitsFor(function () { return promiseResolved; }, "Validate Extension Bundle");
                });
            });

            describe("Existence in Registry", function () {
                var model, origExtensions;

                beforeEach(function () {
                    runs(function () {
                        origExtensions = ExtensionManager.extensions;
                        ExtensionManager._setExtensions(JSON.parse(mockExtensionList));
                        model = new ExtensionManagerViewModel.InstalledViewModel();
                        waitsForDone(model.initialize());
                    });
                });

                afterEach(function () {
                    model.dispose();
                    model = null;
                    ExtensionManager._setExtensions(origExtensions);
                });

                it("should fail if extension doesn't exist in registry", function () {
                    var bundledExtension = { name: "DoesntExist", url: "http://no/man/land.zip" };
                    expect(ExtensionManager._extensionExistsInRegistry(bundledExtension)).toBe(false);
                });

                it("should succeed if extension exists in registry", function () {
                    var bundledExtension = { name: "install-later-extension", url: "https://s3.amazonaws.com/extend.brackets/install-later-extension/install-later-extension-1.0.0.zip" };
                    expect(ExtensionManager._extensionExistsInRegistry(bundledExtension)).toBe(true);
                });

                xit("should succeed if extension exists in registry and but URL doesn't match because of nocheck preference", function () {
                    var bundledExtension = { name: "install-later-extension", url: "http://no/man/land.zip" };
                    expect(ExtensionManager._extensionExistsInRegistry(bundledExtension)).toBe(true);
                });
            });
        });

        describe("Fix download URLs", function () {
            var model, origExtensions;

            beforeEach(function () {
                runs(function () {
                    origExtensions = ExtensionManager.extensions;
                    ExtensionManager._setExtensions(JSON.parse(mockExtensionList));
                    model = new ExtensionManagerViewModel.InstalledViewModel();
                    waitsForDone(model.initialize());
                });
            });

            afterEach(function () {
                model.dispose();
                model = null;
                ExtensionManager._setExtensions(origExtensions);
            });

            it("should not fix existing URLS", function () {
                var result = ExtensionManager._validateAndFixDownloadURLForExtensionBundle({extensions: [{"name": "test", "url": "http://www.downloads.com"}]});

                expect(result.length).toBe(1);
                expect(result[0]).toBe("http://www.downloads.com");
            });

            it("should fix missing URLs", function () {
                var result = ExtensionManager._validateAndFixDownloadURLForExtensionBundle({extensions: [{"name": "install-later-extension"}]});

                expect(result.length).toBe(1);
                expect(result[0]).toBe("https://s3.amazonaws.com/extend.brackets/install-later-extension/install-later-extension-1.0.0.zip");
            });

            it("should fix missing URL using the given version", function () {
                var result = ExtensionManager._validateAndFixDownloadURLForExtensionBundle({extensions: [{"name": "install-later-extension", "version": "1.2.3"}]});

                expect(result.length).toBe(1);
                expect(result[0]).toBe("https://s3.amazonaws.com/extend.brackets/install-later-extension/install-later-extension-1.2.3.zip");
            });
        });
    });
});
