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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true,
indent: 4, maxerr: 50, regexp: true */
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone, spyOn, jasmine */
/*unittests: ExtensionManager*/

define(function (require, exports, module) {
    "use strict";

    require("thirdparty/jquery.mockjax.js");

    var _ = require("thirdparty/lodash");

    var ExtensionManager          = require("extensibility/ExtensionManager"),
        ExtensionManagerView      = require("extensibility/ExtensionManagerView").ExtensionManagerView,
        ExtensionManagerViewModel = require("extensibility/ExtensionManagerViewModel"),
        ExtensionManagerDialog    = require("extensibility/ExtensionManagerDialog"),
        InstallExtensionDialog    = require("extensibility/InstallExtensionDialog"),
        Package                   = require("extensibility/Package"),
        ExtensionLoader           = require("utils/ExtensionLoader"),
        SpecRunnerUtils           = require("spec/SpecRunnerUtils"),
        NativeApp                 = require("utils/NativeApp"),
        Dialogs                   = require("widgets/Dialogs"),
        CommandManager            = require("command/CommandManager"),
        Commands                  = require("command/Commands"),
        FileSystem                = require("filesystem/FileSystem"),
        Strings                   = require("strings"),
        StringUtils               = require("utils/StringUtils"),
        LocalizationUtils         = require("utils/LocalizationUtils"),
        mockRegistryText          = require("text!spec/ExtensionManager-test-files/mockRegistry.json"),
        mockRegistryThemesText    = require("text!spec/ExtensionManager-test-files/mockRegistryThemes.json"),
        mockRegistryForSearch     = require("text!spec/ExtensionManager-test-files/mockRegistryForSearch.json"),
        mockExtensionList         = require("text!spec/ExtensionManager-test-files/mockExtensionList.json"),
        mockRegistry;

    describe("ExtensionManager", function () {
        var mockId, mockSettings, origRegistryURL, origExtensionUrl, removedPath,
            view, model, fakeLoadDeferred, modelDisposed, disabledFilePath;

        beforeEach(function () {
            // Use fake URLs for the registry (useful if the registry isn't actually currently
            // configured).
            origRegistryURL = brackets.config.extension_registry;
            origExtensionUrl = brackets.config.extension_url;
            brackets.config.extension_registry = "http://fake-registry.com/registry.json";
            brackets.config.extension_url = "http://fake-repository.com/{0}/{0}-{1}.zip";

            // Return a canned registry when requested. Individual tests can override this
            // at any point before the request is actually made.
            mockRegistry = JSON.parse(mockRegistryText);
            mockSettings = {
                url: brackets.config.extension_registry,
                dataType: "json",
                contentType: "application/json",
                response: function () {
                    this.responseText = mockRegistry;
                }
            };
            spyOn(mockSettings, "response").andCallThrough();
            mockId = $.mockjax(mockSettings);

            // Set a fake path for user extensions.
            var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
            spyOn(ExtensionLoader, "getUserExtensionPath").andCallFake(function () {
                return mockPath + "/user";
            });

            // Fake package removal.
            removedPath = null;
            spyOn(Package, "remove").andCallFake(function (path) {
                removedPath = path;
                return new $.Deferred().resolve().promise();
            });

            // Fake enabling/disabling
            disabledFilePath = null;
            spyOn(Package, "disable").andCallFake(function (path) {
                disabledFilePath = path + "/.disabled";
                return new $.Deferred().resolve().promise();
            });
            spyOn(Package, "enable").andCallFake(function (path) {
                disabledFilePath = path + "/.disabled";
                return new $.Deferred().resolve().promise();
            });
        });

        afterEach(function () {
            $.mockjaxClear(mockId);
            ExtensionManager._reset();
            ExtensionManager.off(".unit-test");
            brackets.config.extension_registry = origRegistryURL;
            brackets.config.extension_url = origExtensionUrl;
        });

        function mockLoadExtensions(names, fail) {
            var numStatusChanges = 0,
                shouldFail = false,
                shouldDisable = false;
            if (typeof fail === "boolean") {
                shouldFail = true;
            } else if (typeof fail === "string") {
                shouldDisable = true;
            }
            runs(function () {
                ExtensionManager.on("statusChange.mock-load", function () {
                    numStatusChanges++;
                });
                var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                names = names || ["default/mock-extension-1", "dev/mock-extension-2", "user/mock-legacy-extension"];
                names.forEach(function (name) {
                    ExtensionLoader.trigger(shouldFail ? "loadFailed" : (shouldDisable ? "disabled" : "load"), mockPath + "/" + name);
                });
            });

            // Make sure the ExtensionManager has finished reading all the package.jsons before continuing.
            waitsFor(function () { return numStatusChanges === names.length; }, "ExtensionManager status changes");

            runs(function () {
                ExtensionManager.off(".mock-load");
            });
        }

        function makeMockInstalledVersion(mockRegistryExtension, installedVersion) {
            var ref = _.find(mockRegistryExtension.versions, { version: installedVersion });
            return {
                locationType: ExtensionManager.LOCATION_USER,
                metadata: {
                    name: mockRegistryExtension.metadata.name,
                    title: mockRegistryExtension.metadata.title,
                    version: ref.version,
                    engines: { brackets: ref.brackets }
                },
                owner: mockRegistryExtension.owner
            };
        }

        function makeMockExtension(versionRequirements) {
            var FAKE_DATE = "2013-04-10T18:28:20.530Z",
                versions = [];
            versionRequirements.forEach(function (verReq, i) {
                versions.push({ version: (i + 1) + ".0.0", brackets: verReq, published: FAKE_DATE });
            });
            var latestVer = versions[versions.length - 1];
            return {
                metadata: {
                    name: "mock-extension",
                    title: "Mock Extension",
                    version: latestVer.version,
                    engines: { brackets: latestVer.brackets }
                },
                owner: "github:someuser",
                versions: versions
            };
        }

        function setupExtensionManagerViewTests(context) {
            context.addMatchers({
                toHaveText: function (expected) {
                    var notText = this.isNot ? " not" : "";
                    this.message = function () {
                        return "Expected view" + notText + " to contain text " + expected;
                    };
                    return SpecRunnerUtils.findDOMText(this.actual.$el, expected);
                },
                toHaveLink: function (expected) {
                    var notText = this.isNot ? " not" : "";
                    this.message = function () {
                        return "Expected view" + notText + " to contain link " + expected;
                    };
                    return SpecRunnerUtils.findDOMText(this.actual.$el, expected, true);
                }
            });
            spyOn(InstallExtensionDialog, "installUsingDialog").andCallFake(function (url) {
                var id = url.match(/fake-repository\.com\/([^\/]+)/)[1];
                mockLoadExtensions(["user/" + id]);
            });
        }

        function cleanupExtensionManagerViewTests() {
            if (view) {
                view.$el.remove();
                view = null;
            }
            if (model) {
                model.dispose();
            }
        }

        // Sets up the view using the normal (mock) ExtensionManager data.
        function setupViewWithMockData(ModelClass) {
            runs(function () {
                view = new ExtensionManagerView();
                model = new ModelClass();
                modelDisposed = false;
                waitsForDone(view.initialize(model), "view initializing");
                view.$el.appendTo(document.body);
            });
            runs(function () {
                spyOn(view.model, "dispose").andCallThrough();
            });
        }

        describe("ExtensionManager", function () {
            it("should download the extension list from the registry", function () {
                runs(function () {
                    waitsForDone(ExtensionManager.downloadRegistry(), "fetching registry");
                });

                runs(function () {
                    expect(mockSettings.response).toHaveBeenCalled();
                    Object.keys(ExtensionManager.extensions).forEach(function (id) {
                        expect(ExtensionManager.extensions[id].registryInfo).toEqual(mockRegistry[id]);
                    });
                });
            });

            it("should trigger a registryUpdate event when updating the extension list from the registry", function () {
                var registryUpdateSpy;
                runs(function () {
                    registryUpdateSpy = jasmine.createSpy();
                    ExtensionManager.on("registryUpdate", registryUpdateSpy);
                    waitsForDone(ExtensionManager.downloadRegistry(), "fetching registry");
                });
                mockLoadExtensions();
                runs(function () {
                    expect(registryUpdateSpy).toHaveBeenCalled();
                });
            });

            it("should fail if it can't access the registry", function () {
                var gotDone = false, gotFail = false;
                runs(function () {
                    $.mockjaxClear(mockId);
                    mockId = $.mockjax({
                        url: brackets.config.extension_registry,
                        isTimeout: true
                    });
                    ExtensionManager.downloadRegistry()
                        .done(function () {
                            gotDone = true;
                        })
                        .fail(function () {
                            gotFail = true;
                        });
                });
                waitsFor(function () { return gotDone || gotFail; }, "mock failure");

                runs(function () {
                    expect(gotFail).toBe(true);
                    expect(gotDone).toBe(false);
                });
            });

            it("should fail if registry content is malformed", function () {
                var gotDone = false, gotFail = false;
                runs(function () {
                    mockRegistry = "{malformed json";
                    ExtensionManager.downloadRegistry()
                        .done(function () {
                            gotDone = true;
                        })
                        .fail(function () {
                            gotFail = true;
                        });
                });
                waitsFor(function () { return gotDone || gotFail; }, "bad mock data");

                runs(function () {
                    expect(gotFail).toBe(true);
                    expect(gotDone).toBe(false);
                });
            });

            it("should correctly list which extensions are installed", function () {
                runs(function () {
                    waitsForDone(ExtensionManager.downloadRegistry(), "loading registry");
                });
                mockLoadExtensions();
                runs(function () {
                    Object.keys(mockRegistry).forEach(function (extId) {
                        if (extId === "mock-extension-1" || extId === "mock-extension-2") {
                            expect(ExtensionManager.extensions[extId].installInfo.status).toEqual(ExtensionManager.ENABLED);
                        } else {
                            expect(ExtensionManager.extensions[extId].installInfo).toBeUndefined();
                        }
                    });
                });
            });

            it("should list an extension that is installed but failed to load", function () {
                runs(function () {
                    waitsForDone(ExtensionManager.downloadRegistry(), "loading registry");
                });
                mockLoadExtensions(["user/mock-extension-3"], true);
                runs(function () {
                    expect(ExtensionManager.extensions["mock-extension-3"].installInfo.status).toEqual(ExtensionManager.START_FAILED);
                });
            });

            it("should list an extension that is installed but disabled", function () {
                runs(function () {
                    waitsForDone(ExtensionManager.downloadRegistry(), "loading registry");
                });
                mockLoadExtensions(["user/mock-extension-3"], "disabled");
                runs(function () {
                    expect(ExtensionManager.extensions["mock-extension-3"].installInfo.status).toEqual(ExtensionManager.DISABLED);
                });
            });

            it("should set the title for a legacy extension based on its folder name", function () {
                mockLoadExtensions();
                runs(function () {
                    expect(ExtensionManager.extensions["mock-legacy-extension"].installInfo.metadata.title).toEqual("mock-legacy-extension");
                });
            });

            it("should determine the location type for installed extensions", function () {
                mockLoadExtensions();
                runs(function () {
                    expect(ExtensionManager.extensions["mock-extension-1"].installInfo.locationType).toEqual(ExtensionManager.LOCATION_DEFAULT);
                    expect(ExtensionManager.extensions["mock-extension-2"].installInfo.locationType).toEqual(ExtensionManager.LOCATION_DEV);
                    expect(ExtensionManager.extensions["mock-legacy-extension"].installInfo.locationType).toEqual(ExtensionManager.LOCATION_USER);
                });
            });

            it("should raise a statusChange event when an extension is loaded", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    ExtensionManager.on("statusChange.unit-test", spy);
                    mockLoadExtensions(["default/mock-extension-1"]);
                });
                runs(function () {
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), "mock-extension-1");
                });
            });

            it("should raise a statusChange event when a legacy extension is loaded, with its path as the id", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    ExtensionManager.on("statusChange.unit-test", spy);
                    mockLoadExtensions(["user/mock-legacy-extension"]);
                });
                runs(function () {
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), "mock-legacy-extension");
                });
            });

            it("should remove an extension and raise a statusChange event", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                });
                runs(function () {
                    ExtensionManager.on("statusChange.unit-test", spy);
                    waitsForDone(ExtensionManager.remove("mock-extension-3"));
                });
                runs(function () {
                    var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                    expect(removedPath).toBe(mockPath + "/user/mock-extension-3");
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), "mock-extension-3");
                    expect(ExtensionManager.extensions["mock-extension-3"].installInfo).toBeFalsy();
                });
            });

            it("should disable an extension and raise a statusChange event", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                });
                runs(function () {
                    ExtensionManager.on("statusChange.unit-test", spy);
                    waitsForDone(ExtensionManager.disable("mock-extension-3"));
                });
                runs(function () {
                    var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                    expect(disabledFilePath).toBe(mockPath + "/user/mock-extension-3" + "/.disabled");
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), "mock-extension-3");
                    expect(ExtensionManager.extensions["mock-extension-3"].installInfo.status).toEqual(ExtensionManager.DISABLED);
                });
            });

            it("should enable an extension and raise a statusChange event", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    mockLoadExtensions(["user/mock-extension-2"], "disable");
                });
                runs(function () {
                    ExtensionManager.on("statusChange.unit-test", spy);
                    waitsForDone(ExtensionManager.enable("mock-extension-2"));
                });
                runs(function () {
                    var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                    expect(disabledFilePath).toBe(mockPath + "/user/mock-extension-2" + "/.disabled");
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), "mock-extension-2");
                    expect(ExtensionManager.extensions["mock-extension-2"].installInfo.status).toEqual(ExtensionManager.ENABLED);
                });
            });

            it("should fail when trying to remove an extension that's not installed", function () {
                var finished = false;
                runs(function () {
                    ExtensionManager.remove("mock-extension-3")
                        .done(function () {
                            finished = true;
                            expect("tried to remove a nonexistent extension").toBe(false);
                        })
                        .fail(function () {
                            finished = true;
                        });
                });
                waitsFor(function () { return finished; }, "finish removal");
            });

            it("should fail when trying to disable an extension that's not installed", function () {
                var finished = false;
                runs(function () {
                    ExtensionManager.disable("mock-extension-3")
                        .done(function () {
                            finished = true;
                            expect("tried to disable a nonexistent extension").toBe(false);
                        })
                        .fail(function () {
                            finished = true;
                        });
                });
                waitsFor(function () { return finished; }, "finish disabling");
            });

            it("should fail when trying to enable an extension that's not installed", function () {
                var finished = false;
                runs(function () {
                    ExtensionManager.enable("mock-extension-3")
                        .done(function () {
                            finished = true;
                            expect("tried to enable a nonexistent extension").toBe(false);
                        })
                        .fail(function () {
                            finished = true;
                        });
                });
                waitsFor(function () { return finished; }, "finish enabling");
            });

            it("should calculate compatibility info for installed extensions", function () {
                function fakeEntry(version) {
                    return { metadata: { engines: { brackets: version } } };
                }

                // Missing version requirement data
                expect(ExtensionManager.getCompatibilityInfo({ metadata: {} }, "1.0.0"))
                    .toEqual({isCompatible: true, isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(null), "1.0.0"))
                    .toEqual({isCompatible: true, isLatestVersion: true});

                // With version requirement data
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(">0.5.0"), "0.6.0"))
                    .toEqual({isCompatible: true, isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(">0.6.0"), "0.6.0"))
                    .toEqual({isCompatible: false, requiresNewer: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(">0.7.0"), "0.6.0"))
                    .toEqual({isCompatible: false, requiresNewer: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("<0.5.0"), "0.4.0"))
                    .toEqual({isCompatible: true, isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("<0.4.0"), "0.4.0"))
                    .toEqual({isCompatible: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("<0.3.0"), "0.4.0"))
                    .toEqual({isCompatible: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.2.0"))
                    .toEqual({isCompatible: true, isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.2.1"))
                    .toEqual({isCompatible: true, isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.3.0"))
                    .toEqual({isCompatible: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.3.1"))
                    .toEqual({isCompatible: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.1.0"))
                    .toEqual({isCompatible: false, requiresNewer: true});
            });

            it("should calculate compatibility info for registry extensions", function () {
                // Use the fakeEntry name for consistency with the tests above
                var fakeEntry = makeMockExtension;

                var curVer = "0.33.0";
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.24"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "1.0.0", isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.24", ">=0.33"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "2.0.0", isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(["<=0.24", "<=0.29", ">=0.30"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "3.0.0", isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.40", ">=0.50", ">=0.30"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "3.0.0", isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(["<=0.29", "<=0.29"]), curVer))
                    .toEqual({isCompatible: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.40", ">=0.50"]), curVer))
                    .toEqual({isCompatible: false, requiresNewer: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.15", ">=0.17", "<=0.20"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "2.0.0", isLatestVersion: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.24", ">=0.29", ">=0.50"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "2.0.0", isLatestVersion: false, requiresNewer: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(["<=0.20", ">=0.30", ">=0.50"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "2.0.0", isLatestVersion: false, requiresNewer: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.50", ">=0.30", "<=0.20"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "2.0.0", isLatestVersion: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.25", "<=0.40", ">=0.40", "<=0.40", ">=0.42"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "4.0.0", isLatestVersion: false, requiresNewer: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.25", "<=0.30", ">=0.30", "<=0.40", ">=0.32"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "5.0.0", isLatestVersion: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry([">=0.25", ">=0.26", ">=0.30", ">=0.32", ">=0.40", ">=0.50"]), curVer))
                    .toEqual({isCompatible: true, compatibleVersion: "4.0.0", isLatestVersion: false, requiresNewer: true});
            });

            it("should return the correct download URL for an extension", function () {
                expect(ExtensionManager.getExtensionURL("my-cool-extension", "1.2.3"))
                    .toBe("http://fake-repository.com/my-cool-extension/my-cool-extension-1.2.3.zip");
            });
        });

        describe("Auto-Install Extensions", function () {

            function lookupFileName(zipArray, fileName) {
                return zipArray.some(function (zip) {
                    return (zip.file.name === fileName);
                });
            }

            function addZipFilesToArray(array, result) {
                result.installZips.every(function (zip) {
                    array[zip.info.metadata.name] = zip.info.metadata.version;
                });
                result.updateZips.every(function (zip) {
                    array[zip.info.metadata.name] = zip.info.metadata.version;
                });
            }

            it("should correctly handle auto-install extension zip files", function () {
                var promiseFail    = false,
                    promiseResult  = null,
                    autoExtensions = {},
                    dirPath        = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files/auto-install-extensions1");

                // Should find 1 install zip
                runs(function () {
                    ExtensionManager._getAutoInstallFiles(dirPath, autoExtensions)
                        .done(function (result) {
                            addZipFilesToArray(autoExtensions, result);
                            promiseResult = result;
                        })
                        .fail(function (err) {
                            promiseFail = true;
                            expect("[_getAutoInstallFiles] promise rejected with: " + err).toBe("(expected resolved instead)");
                        });
                });

                waitsFor(function () {
                    return promiseResult || promiseFail;
                }, "_getAutoInstallFiles success [_getAutoInstallFiles]", 1000);

                runs(function () {
                    expect(promiseResult).toBeTruthy();
                    if (promiseResult) {
                        expect(promiseResult.installZips.length).toBe(1);
                        expect(promiseResult.updateZips.length).toBe(0);

                        // Extension
                        expect(lookupFileName(promiseResult.installZips, "mock-extension-v1.0.0.zip")).toBeTruthy();

                        // Not extensions
                        expect(lookupFileName(promiseResult.installZips, "ignore-this-folder")).toBeFalsy();
                        expect(lookupFileName(promiseResult.installZips, "not-an-extension.zip")).toBeFalsy();
                        expect(lookupFileName(promiseResult.installZips, "should-be-ignored.txt")).toBeFalsy();
                    }
                });

                // Subsequent run of first folder should find 0 install zips
                runs(function () {
                    promiseFail   = false;
                    promiseResult = null;
                    ExtensionManager._getAutoInstallFiles(dirPath, autoExtensions)
                        .done(function (result) {
                            addZipFilesToArray(autoExtensions, result);
                            promiseResult = result;
                        })
                        .fail(function (err) {
                            promiseFail = true;
                            expect("[_getAutoInstallFiles] promise rejected with: " + err).toBe("(expected resolved instead)");
                        });
                });

                waitsFor(function () {
                    return promiseResult || promiseFail;
                }, "_getAutoInstallFiles success [_getAutoInstallFiles]", 1000);

                runs(function () {
                    expect(promiseResult).toBeTruthy();
                    if (promiseResult) {
                        expect(promiseResult.installZips.length).toBe(0);
                        expect(promiseResult.updateZips.length).toBe(0);

                        // Extension already installed
                        expect(lookupFileName(promiseResult.installZips, "mock-extension-v1.0.0.zip")).toBeFalsy();

                        // Not extensions
                        expect(lookupFileName(promiseResult.installZips, "ignore-this-folder")).toBeFalsy();
                        expect(lookupFileName(promiseResult.installZips, "not-an-extension.zip")).toBeFalsy();
                        expect(lookupFileName(promiseResult.installZips, "should-be-ignored.txt")).toBeFalsy();
                    }
                });

            });

            it("should detect auto-install extension is an update", function () {
                var promiseFail    = false,
                    promiseResult  = null,
                    autoExtensions = {},
                    dirPath        = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files/auto-install-extensions2");

                runs(function () {
                    mockRegistry = { "mock-extension": makeMockExtension([">0.1", ">0.1"]) };
                    var mockInstallInfo = { "mock-extension": { installInfo: makeMockInstalledVersion(mockRegistry["mock-extension"], "1.0.0") } };
                    ExtensionManager._setExtensions(mockInstallInfo);

                    ExtensionManager._getAutoInstallFiles(dirPath, autoExtensions)
                        .done(function (result) {
                            addZipFilesToArray(autoExtensions, result);
                            promiseResult = result;
                        })
                        .fail(function (err) {
                            promiseFail = true;
                            expect("[_getAutoInstallFiles] promise rejected with: " + err).toBe("(expected resolved instead)");
                        });
                });

                waitsFor(function () {
                    return promiseResult || promiseFail;
                }, "_getAutoInstallFiles success [_getAutoInstallFiles]", 1000);

                runs(function () {
                    expect(promiseResult).toBeTruthy();
                    if (promiseResult) {
                        expect(promiseResult.installZips.length).toBe(0);
                        expect(promiseResult.updateZips.length).toBe(1);

                        // Extension
                        expect(lookupFileName(promiseResult.updateZips, "mock-extension-v1.1.1.zip")).toBeTruthy();
                    }
                });
            });

            it("should correctly handle multiple auto-install extension zip files of same extension", function () {
                var promiseFail    = false,
                    promiseResult  = null,
                    autoExtensions = {},
                    dirPath        = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files/auto-install-extensions3");

                // There are 3 zips of same extension using 3 different versions. Only the latest should be returned.
                runs(function () {
                    ExtensionManager._getAutoInstallFiles(dirPath, autoExtensions)
                        .done(function (result) {
                            addZipFilesToArray(autoExtensions, result);
                            promiseResult = result;
                        })
                        .fail(function (err) {
                            promiseFail = true;
                            expect("[_getAutoInstallFiles] promise rejected with: " + err).toBe("(expected resolved instead)");
                        });
                });

                waitsFor(function () {
                    return promiseResult || promiseFail;
                }, "_getAutoInstallFiles success [_getAutoInstallFiles]", 1000);

                runs(function () {
                    expect(promiseResult).toBeTruthy();
                    if (promiseResult) {
                        expect(promiseResult.installZips.length).toBe(1);
                        expect(promiseResult.updateZips.length).toBe(0);

                        // Latest version
                        // Note that files are named to try to force code to hit desired branches, but order is arbitrary.
                        expect(lookupFileName(promiseResult.installZips, "b-mock-extension-v1.1.1.zip")).toBeTruthy();

                        // Older versions
                        expect(lookupFileName(promiseResult.installZips, "a-mock-extension-v1.0.0.zip")).toBeFalsy();
                        expect(lookupFileName(promiseResult.installZips, "c-mock-extension-v1.1.0.zip")).toBeFalsy();
                    }
                });
            });
        });

        describe("ExtensionManagerView Model", function () {
            describe("when initialized from registry", function () {
                var model;

                beforeEach(function () {
                    runs(function () {
                        mockRegistry = JSON.parse(mockRegistryForSearch);
                        model = new ExtensionManagerViewModel.RegistryViewModel();
                        waitsForDone(model.initialize(), "model initialization");
                    });
                    runs(function () {
                        // Mock load some extensions, so we can make sure they don't show up in the filtered model in this case.
                        mockLoadExtensions();
                    });
                });

                afterEach(function () {
                    model.dispose();
                    model = null;
                });

                it("should initialize itself from the extension list", function () {
                    expect(model.extensions).toEqual(ExtensionManager.extensions);
                });

                it("should start with the full set sorted in reverse publish date order", function () {
                    expect(model.filterSet).toEqual(["item-5", "item-6", "item-2", "find-uniq1-in-name", "item-4", "item-3"]);
                });

                it("should search case-insensitively for a keyword in the metadata for a given list of registry ids", function () {
                    model.filter("uniq1");
                    expect(model.filterSet).toEqual(["find-uniq1-in-name"]);
                    model.filter("uniq2");
                    expect(model.filterSet).toEqual(["item-2"]);
                    model.filter("uniq3");
                    expect(model.filterSet).toEqual(["item-3"]);
                    model.filter("uniq4");
                    expect(model.filterSet).toEqual(["item-4"]);
                    model.filter("uniq5");
                    expect(model.filterSet).toEqual(["item-5"]);
                    model.filter("uniq6");
                    expect(model.filterSet).toEqual(["item-6"]);
                    model.filter("uniqin1and5");
                    expect(model.filterSet).toEqual(["item-5", "find-uniq1-in-name"]); // sorted in reverse publish date order
                });

                it("should 'AND' space-separated search terms", function () {
                    model.filter("UNIQ2 in author name");
                    expect(model.filterSet).toEqual(["item-2"]);
                    model.filter("UNIQ2 name");
                    expect(model.filterSet).toEqual(["item-2"]);
                    model.filter("UNIQ2 name author");
                    expect(model.filterSet).toEqual(["item-2"]);
                    model.filter("UNIQ2 uniq3");
                    expect(model.filterSet).toEqual([]);
                });

                it("should return correct results when subsequent queries are longer versions of previous queries", function () {
                    model.filter("uniqin1and5");
                    model.filter("uniqin1and5-2");
                    expect(model.filterSet).toEqual(["item-5"]);
                });

                it("should go back to the full sorted set when cleared", function () {
                    model.filter("uniq1");
                    model.filter("");
                    expect(model.filterSet).toEqual(["item-5", "item-6", "item-2", "find-uniq1-in-name", "item-4", "item-3"]);
                });

                it("longer versions of previous queries, and not, should also work with spaces", function () {
                    model.filter("name");
                    expect(model.filterSet).toEqual(["item-2", "find-uniq1-in-name"]);
                    model.filter("name uniq");
                    expect(model.filterSet).toEqual(["item-2", "find-uniq1-in-name"]);
                    model.filter("name uniq2");
                    expect(model.filterSet).toEqual(["item-2"]);
                    model.filter("name uniq");
                    expect(model.filterSet).toEqual(["item-2", "find-uniq1-in-name"]);
                    model.filter("name");
                    expect(model.filterSet).toEqual(["item-2", "find-uniq1-in-name"]);
                });

                it("should trigger filter event when filter changes", function () {
                    var gotEvent = false;
                    model.on("filter", function () {
                        gotEvent = true;
                    });
                    model.filter("uniq1");
                    expect(gotEvent).toBe(true);
                });
            });


            describe("when initialized themes from registry", function () {
                var model;

                beforeEach(function () {
                    runs(function () {
                        mockRegistry = JSON.parse(mockRegistryThemesText);
                        model = new ExtensionManagerViewModel.ThemesViewModel();
                        waitsForDone(model.initialize(), "model initialization");
                    });
                    runs(function () {
                        // Mock load some extensions, so we can make sure they don't show up in the filtered model in this case.
                        mockLoadExtensions();
                    });
                });

                afterEach(function () {
                    model.dispose();
                    model = null;
                });

                it("should initialize itself from the extension list", function () {
                    expect(model.extensions).toEqual(ExtensionManager.extensions);
                });

                it("should start with the full set sorted in reverse publish date order", function () {
                    expect(model.filterSet).toEqual(["theme-1", "theme-2"]);
                });
            });


            describe("when initialized from local extension list", function () {
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

                it("should initialize itself from the extension list", function () {
                    expect(model.extensions).toEqual(ExtensionManager.extensions);
                });

                it("should only contain dev and user extensions, sorted case-insensitively on the extension title or name (or last segment of path name for legacy extensions)", function () {
                    expect(model.filterSet).toEqual(["registered-extension", "dev-extension", "/path/to/extensions/user/legacy-extension", "unregistered-extension", "Z-capital-extension"]);
                });

                it("should include a newly-installed extension", function () {
                    mockLoadExtensions(["user/install-later-extension"]);
                    runs(function () {
                        expect(model.filterSet.indexOf("install-later-extension")).toBe(2);
                    });
                });

                it("should include a newly-installed disabled extension", function () {
                    mockLoadExtensions(["user/another-great-extension"], "disabled");
                    runs(function () {
                        expect(model.filterSet.indexOf("another-great-extension")).toBe(1);
                    });
                });

                it("should raise an event when an extension is installed", function () {
                    var calledId;
                    runs(function () {
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                    });
                    mockLoadExtensions(["user/install-later-extension"]);
                    runs(function () {
                        expect(calledId).toBe("install-later-extension");
                    });
                });

                it("should raise an event when an extension is disabled", function () {
                    var calledId;
                    runs(function () {
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                    });
                    mockLoadExtensions(["user/another-great-extension"], "disabled");
                    runs(function () {
                        expect(calledId).toBe("another-great-extension");
                    });
                });

                it("should not include a removed extension", function () {
                    runs(function () {
                        waitsForDone(ExtensionManager.remove("registered-extension"));
                    });
                    runs(function () {
                        expect(model.filterSet.indexOf("registered-extension")).toBe(-1);
                    });
                });

                it("should raise an event when an extension is removed", function () {
                    var calledId;
                    runs(function () {
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                        waitsForDone(ExtensionManager.remove("registered-extension"));
                    });
                    runs(function () {
                        expect(calledId).toBe("registered-extension");
                    });
                });

                it("should mark an extension for removal and raise an event without actually removing it", function () {
                    var id = "registered-extension", calledId;
                    runs(function () {
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                        ExtensionManager.markForRemoval(id, true);
                        expect(calledId).toBe(id);
                        expect(ExtensionManager.isMarkedForRemoval(id)).toBe(true);
                        expect(model.filterSet.indexOf(id)).not.toBe(-1);
                        expect(ExtensionManager.hasExtensionsToRemove()).toBe(true);
                    });
                });

                it("should unmark an extension previously marked for removal and raise an event", function () {
                    var id = "registered-extension", calledId;
                    runs(function () {
                        ExtensionManager.markForRemoval(id, true);
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                        ExtensionManager.markForRemoval(id, false);
                        expect(calledId).toBe(id);
                        expect(ExtensionManager.isMarkedForRemoval(id)).toBe(false);
                        expect(ExtensionManager.hasExtensionsToRemove()).toBe(false);
                    });
                });

                it("should remove extensions previously marked for removal", function () {
                    var removedIds = {}, removedPaths = {};
                    runs(function () {
                        ExtensionManager.markForRemoval("registered-extension", true);
                        ExtensionManager.markForRemoval("Z-capital-extension", false);
                        model.on("change", function (e, id) {
                            removedIds[id] = true;
                            removedPaths[removedPath] = true;
                        });
                        waitsForDone(ExtensionManager.removeMarkedExtensions());
                    });
                    runs(function () {
                        // Test a removed extension, an extension that was unmarked for removal, and an extension that was never marked.
                        expect(removedIds["registered-extension"]).toBe(true);
                        expect(removedPaths["/path/to/extensions/user/registered-extension"]).toBe(true);
                        expect(removedIds["Z-capital-extension"]).toBeUndefined();
                        expect(removedPaths["/path/to/extensions/user/Z-capital-extension"]).toBeUndefined();
                        expect(removedIds["unregistered-extension"]).toBeUndefined();
                        expect(removedPaths["/path/to/extensions/user/unregistered-extension"]).toBeUndefined();
                    });
                });

                it("should mark an extension for disabling and raise an event", function () {
                    var id = "registered-extension", calledId;
                    runs(function () {
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                        ExtensionManager.markForDisabling(id, true);
                        expect(calledId).toBe(id);
                        expect(ExtensionManager.isMarkedForDisabling(id)).toBe(true);
                        expect(model.filterSet.indexOf(id)).not.toBe(-1);
                        expect(ExtensionManager.hasExtensionsToDisable()).toBe(true);
                    });
                });

                it("should unmark an extension previously marked for disabling and raise an event", function () {
                    var id = "registered-extension", calledId;
                    runs(function () {
                        ExtensionManager.markForDisabling(id, true);
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                        ExtensionManager.markForDisabling(id, false);
                        expect(calledId).toBe(id);
                        expect(ExtensionManager.isMarkedForRemoval(id)).toBe(false);
                        expect(ExtensionManager.hasExtensionsToRemove()).toBe(false);
                    });
                });

                it("should disable extensions previously marked for disabling and not remove them from the model", function () {
                    var disabledIds = {}, disabledPaths = {};
                    runs(function () {
                        ExtensionManager.markForDisabling("registered-extension", true);
                        ExtensionManager.markForDisabling("Z-capital-extension", false);
                        model.on("change", function (e, id) {
                            disabledIds[id] = true;
                            disabledPaths[disabledFilePath] = true;
                        });
                        waitsForDone(ExtensionManager.disableMarkedExtensions());
                    });
                    runs(function () {
                        // Test the enabled extension, the extension that was unmarked for disabling, and an extension that was never marked.
                        expect(disabledIds["registered-extension"]).toBe(true);
                        expect(disabledPaths["/path/to/extensions/user/registered-extension/.disabled"]).toBe(true);
                        expect(model.filterSet.indexOf("registered-extension")).toBe(0);
                        expect(disabledIds["Z-capital-extension"]).toBeUndefined();
                        expect(disabledPaths["/path/to/extensions/user/Z-capital-extension/.disabled"]).toBeUndefined();
                        expect(disabledIds["unregistered-extension"]).toBeUndefined();
                        expect(disabledPaths["/path/to/extensions/user/unregistered-extension/.disabled"]).toBeUndefined();
                    });
                });

                it("should delete the .disabled file, enable the extension and raise an event", function () {
                    var extension = "registered-extension",
                        calledId;
                    runs(function () {
                        mockLoadExtensions(["registered-extension"], "disabled");
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                    });
                    runs(function () {
                        waitsForDone(ExtensionManager.enable(extension));
                    });
                    runs(function () {
                        expect(calledId).toBe(extension);
                    });
                });

                it("should mark an extension for update and raise an event", function () {
                    var id = "registered-extension", calledId;
                    runs(function () {
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                        ExtensionManager.updateFromDownload({
                            localPath: "/path/to/downloaded/file.zip",
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        expect(calledId).toBe(id);
                        expect(ExtensionManager.isMarkedForUpdate(id)).toBe(true);
                        expect(ExtensionManager.hasExtensionsToUpdate()).toBe(true);
                    });
                });

                it("should unmark an extension for update, deleting the package and raising an event", function () {
                    var id = "registered-extension",
                        filename = "/path/to/downloaded/file.zip",
                        file = FileSystem.getFileForPath(filename),
                        calledId;
                    runs(function () {
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                        ExtensionManager.updateFromDownload({
                            localPath: filename,
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        calledId = null;
                        spyOn(file, "unlink");
                        ExtensionManager.removeUpdate(id);
                        expect(calledId).toBe(id);
                        expect(file.unlink).toHaveBeenCalled();
                        expect(ExtensionManager.isMarkedForUpdate()).toBe(false);
                    });
                });

                it("should change an extension marked for removal to update raise an event", function () {
                    var id = "registered-extension", calledId;
                    runs(function () {
                        model.on("change", function (e, id) {
                            calledId = id;
                        });
                        ExtensionManager.markForRemoval(id, true);
                        expect(calledId).toBe(id);
                        calledId = null;
                        ExtensionManager.updateFromDownload({
                            localPath: "/path/to/downloaded/file.zip",
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        expect(calledId).toBe(id);
                        expect(ExtensionManager.isMarkedForRemoval()).toBe(false);
                        expect(ExtensionManager.hasExtensionsToRemove()).toBe(false);
                        expect(ExtensionManager.isMarkedForUpdate(id)).toBe(true);
                        expect(ExtensionManager.hasExtensionsToUpdate()).toBe(true);
                    });
                });

                it("should update extensions marked for update", function () {
                    var id = "registered-extension",
                        filename = "/path/to/downloaded/file.zip",
                        file = FileSystem.getFileForPath("/path/to/downloaded/file.zip");
                    runs(function () {
                        ExtensionManager.updateFromDownload({
                            localPath: filename,
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        expect(ExtensionManager.isMarkedForUpdate()).toBe(false);
                        spyOn(file, "unlink");
                        var d = $.Deferred();
                        spyOn(Package, "installUpdate").andReturn(d.promise());
                        d.resolve();
                        waitsForDone(ExtensionManager.updateExtensions());
                    });
                    runs(function () {
                        expect(file.unlink).toHaveBeenCalled();
                        expect(Package.installUpdate).toHaveBeenCalledWith(filename, id);
                    });
                });

                it("should recognize when an update is available", function () {
                    var id = "registered-extension";
                    runs(function () {
                        console.log(model.extensions[id]);
                        expect(model._getEntry(id).updateAvailable).toBe(true);
                    });
                });
            });
        });

        describe("Local File Install", function () {
            var didReload;

            function clickOk() {
                var $okBtn = $(".install-extension-dialog.instance .dialog-button[data-button-id='ok']");
                $okBtn.click();
            }

            beforeEach(function () {
                // Mock reloading the app so we don't actually reload :)
                didReload = false;
                spyOn(CommandManager, "execute").andCallFake(function (id) {
                    if (id === Commands.APP_RELOAD) {
                        didReload = true;
                    } else {
                        CommandManager.execute.apply(this, arguments);
                    }
                });
            });

            it("should set flag to keep local files for new installs", function () {
                var filename = "/path/to/downloaded/file.zip",
                    file = FileSystem.getFileForPath(filename),
                    result;

                runs(function () {
                    spyOn(file, "unlink");

                    // Mock install
                    var d = $.Deferred().resolve({});
                    spyOn(Package, "installFromPath").andReturn(d.promise());

                    var promise = InstallExtensionDialog.installUsingDialog(file);
                    promise.done(function (_result) {
                        result = _result;
                    });

                    clickOk();
                    waitsForDone(promise);
                });

                runs(function () {
                    expect(Package.installFromPath).toHaveBeenCalledWith(filename);
                    expect(result.keepFile).toBe(true);
                    expect(file.unlink).not.toHaveBeenCalled();
                });
            });

            it("should set flag to keep local files for updates", function () {
                var id = "mock-extension",
                    filename = "/path/to/downloaded/file.zip",
                    file = FileSystem.getFileForPath(filename),
                    result,
                    dialogDeferred = new $.Deferred(),
                    $mockDlg,
                    didClose;

                // Mock update
                var installResult = {
                    installationStatus: Package.InstallationStatuses.NEEDS_UPDATE,
                    name: id,
                    localPath: filename
                };

                // Mock dialog
                spyOn(Dialogs, "showModalDialog").andCallFake(function () {
                    $mockDlg = $("<div/>");
                    didClose = false;

                    return {
                        getElement: function () { return $mockDlg; },
                        close: function () { didClose = true; }
                    };
                });

                spyOn(file, "unlink");

                // Mock installs to avoid calling into node ExtensionManagerDomain
                spyOn(Package, "installFromPath").andCallFake(function () {
                    return new $.Deferred().resolve(installResult).promise();
                });
                spyOn(Package, "installUpdate").andCallFake(function () {
                    return new $.Deferred().resolve(installResult).promise();
                });

                runs(function () {
                    // Mimic drag and drop
                    InstallExtensionDialog.updateUsingDialog(file)
                        .done(function (_result) {
                            result = _result;

                            // Mark for update
                            ExtensionManager.updateFromDownload(result);

                            dialogDeferred.resolve();
                        })
                        .fail(dialogDeferred.reject);

                    clickOk();
                    waitsForDone(dialogDeferred.promise(), "InstallExtensionDialog.updateUsingDialog");
                });

                runs(function () {
                    // InstallExtensionDialog should set keepFile=true
                    expect(result.keepFile).toBe(true);

                    // Run update, creates dialog DIALOG_ID_CHANGE_EXTENSIONS
                    ExtensionManagerDialog._performChanges();
                    $mockDlg.triggerHandler("buttonClick", Dialogs.DIALOG_BTN_OK);
                });

                waitsFor(function () {
                    return didClose;
                }, "DIALOG_ID_CHANGE_EXTENSIONS closed");

                runs(function () {
                    expect(file.unlink).not.toHaveBeenCalled();
                    expect(didReload).toBe(true);
                });
            });

        });

        describe("ExtensionManagerView", function () {

            beforeEach(function () {
                setupExtensionManagerViewTests(this);
                spyOn(brackets, "getLocale").andReturn("en");
            });


            afterEach(function () {
                cleanupExtensionManagerViewTests();
            });

            describe("when showing registry entries", function () {
                it("should populate itself with registry entries and display their fields when created", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    runs(function () {
                        _.forEach(mockRegistry, function (item) {
                            // Should show the title if specified, otherwise the bare name.
                            if (item.metadata.title) {
                                expect(view).toHaveText(item.metadata.title);
                            } else {
                                expect(view).toHaveText(item.metadata.name);
                            }

                            // Simple fields
                            [item.metadata.version,
                                item.metadata.author && item.metadata.author.name]
                                .forEach(function (value) {
                                    if (value) {
                                        expect(view).toHaveText(value);
                                    }
                                });
                            if (item.metadata.homepage) {
                                expect(view).toHaveLink(item.metadata.homepage);
                            }

                            // Array-valued fields
                            [item.metadata.categories].forEach(function (arr) {
                                if (arr) {
                                    arr.forEach(function (value) {
                                        expect(view).toHaveText(value);
                                    });
                                }
                            });
                        });
                    });
                });

                it("should display original description", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    runs(function () {
                        _.forEach(mockRegistry, function (item) {
                            if (item.metadata.description) {
                                if (StringUtils.truncate(item.metadata.description, 200) === undefined) {
                                    expect(view).toHaveText(item.metadata.description);
                                }
                            }
                        });
                    });
                });

                it("should display shortened description", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    runs(function () {
                        _.forEach(mockRegistry, function (item) {
                            if (item.metadata.description) {
                                var shortDescription = StringUtils.truncate(item.metadata.description, 200);
                                if (shortDescription !== undefined) {
                                    expect(view).toHaveText(shortDescription);
                                }
                            }
                        });
                    });
                });

                it("should display owner even for installed items", function () {
                    ExtensionManager._setExtensions(JSON.parse(mockExtensionList));
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        console.log(view);
                        _.forEach(JSON.parse(mockExtensionList), function (item) {
                            if (item.installInfo && item.registryInfo) {
                                // Owner--should show only the owner name, not the authenticator
                                expect(view).toHaveText(item.registryInfo.owner.split(":")[1]);
                            }
                        });
                    });
                });

                it("should show an install button for each item", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    runs(function () {
                        _.forEach(mockRegistry, function (item) {
                            var $button = $("button.install[data-extension-id=" + item.metadata.name + "]", view.$el);
                            expect($button.length).toBe(1);
                        });
                    });
                });

                // 'Install' button state
                it("should show disabled install buttons for items that are already installed", function () {
                    mockLoadExtensions(["user/mock-extension-3", "user/mock-extension-4"]);
                    setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    runs(function () {
                        _.forEach(mockRegistry, function (item) {
                            var $button = $("button.install[data-extension-id=" + item.metadata.name + "]", view.$el);
                            if (item.metadata.name === "mock-extension-3" || item.metadata.name === "mock-extension-4") {
                                expect($button.prop("disabled")).toBeTruthy();
                            } else {
                                expect($button.prop("disabled")).toBeFalsy();
                            }
                        });
                    });
                });

                it("should show disabled install button if requires newer API version", function () {   // isCompatible: false, requiresNewer: true
                    runs(function () {
                        mockRegistry = { "mock-extension": makeMockExtension([">100.0"]) };
                        setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    });
                    runs(function () {
                        var $button = $("button.install[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeTruthy();
                        expect($("button.update[data-extension-id=mock-extension]", view.$el).length).toBe(0);

                        var $warning = $(".alert.warning", view.$el);
                        expect($warning.length).toBe(1);
                        expect($warning.text().trim()).toBe(Strings.EXTENSION_INCOMPATIBLE_NEWER);
                    });
                });

                it("should show disabled install button if requires older API version", function () {   // isCompatible: false, requiresNewer: false
                    runs(function () {
                        mockRegistry = { "mock-extension": makeMockExtension(["<0.1"]) };
                        setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    });
                    runs(function () {
                        var $button = $("button.install[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeTruthy();
                        expect($("button.update[data-extension-id=mock-extension]", view.$el).length).toBe(0);

                        var $warning = $(".alert.warning", view.$el);
                        expect($warning.length).toBe(1);
                        expect($warning.text().trim()).toBe(Strings.EXTENSION_INCOMPATIBLE_OLDER);
                    });
                });

                it("should show enabled install button if latest requires newer API version", function () { // isCompatible: true, isLatestVersion: false, requiresNewer: true
                    runs(function () {
                        mockRegistry = { "mock-extension": makeMockExtension([">0.1", ">100.0"]) };
                        setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    });
                    runs(function () {
                        var $button = $("button.install[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeFalsy();
                        expect($("button.update[data-extension-id=mock-extension]", view.$el).length).toBe(0);

                        var $warning = $(".alert.warning", view.$el);
                        expect($warning.length).toBe(1);
                        expect($warning.text().trim()).toBe(StringUtils.format(Strings.EXTENSION_LATEST_INCOMPATIBLE_NEWER, "2.0.0", "1.0.0"));
                    });
                });

                it("should show enabled install button if latest requires older API version", function () { // isCompatible: true, isLatestVersion: false, requiresNewer: false
                    runs(function () {
                        mockRegistry = { "mock-extension": makeMockExtension([">0.1", "<0.2"]) };
                        setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    });
                    runs(function () {
                        var $button = $("button.install[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeFalsy();
                        expect($("button.update[data-extension-id=mock-extension]", view.$el).length).toBe(0);

                        var $warning = $(".alert.warning", view.$el);
                        expect($warning.length).toBe(1);
                        expect($warning.text().trim()).toBe(StringUtils.format(Strings.EXTENSION_LATEST_INCOMPATIBLE_OLDER, "2.0.0", "1.0.0"));
                    });
                });

                // 'Install' button action
                it("should bring up the install dialog and install an item when install button is clicked", function () {
                    runs(function () {
                        setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    });
                    runs(function () {
                        var $button = $("button.install[data-extension-id=mock-extension-3]", view.$el);
                        expect($button.length).toBe(1);
                        $button.click();
                        expect(InstallExtensionDialog.installUsingDialog)
                            .toHaveBeenCalledWith("http://fake-repository.com/mock-extension-3/mock-extension-3-1.0.0.zip");
                    });
                });

                it("should install latest compatible version", function () {
                    runs(function () {
                        mockRegistry = { "mock-extension": makeMockExtension([">0.1", ">0.2", ">100.0"]) };
                        setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    });
                    runs(function () {
                        var $button = $("button.install[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        $button.click();
                        expect(InstallExtensionDialog.installUsingDialog)
                            .toHaveBeenCalledWith("http://fake-repository.com/mock-extension/mock-extension-2.0.0.zip");
                    });
                });

                it("should disable the install button for an item immediately after installing it", function () {
                    var $button;
                    runs(function () {
                        setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    });
                    runs(function () {
                        $button = $("button.install[data-extension-id=mock-extension-3]", view.$el);
                        $button.click();
                    });
                    runs(function () {
                        // Have to get the button again since the view may have created a new button when re-rendering.
                        $button = $("button.install[data-extension-id=mock-extension-3]", view.$el);
                        expect($button.prop("disabled")).toBeTruthy();
                    });

                });

                // 'Update' button state (see also similar tests for InstalledViewModel below)
                it("should show enabled update button for items that have a compatible update available", function () {
                    mockRegistry = { "mock-extension": makeMockExtension([">0.1", ">0.1"]) };
                    var mockInstallInfo = { "mock-extension": { installInfo: makeMockInstalledVersion(mockRegistry["mock-extension"], "1.0.0") } };
                    ExtensionManager._setExtensions(mockInstallInfo);
                    setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);

                    runs(function () {
                        var $button = $("button.update[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeFalsy();

                        expect($("button.install[data-extension-id=mock-extension]", view.$el).length).toBe(0);
                        expect($(".alert.warning", view.$el).length).toBe(0);
                    });
                });

                it("should show disabled update button for items whose available update requires newer API version", function () {   // isLatestVersion: false, requiresNewer: true
                    mockRegistry = { "mock-extension": makeMockExtension([">0.1", ">100.0"]) };
                    var mockInstallInfo = { "mock-extension": { installInfo: makeMockInstalledVersion(mockRegistry["mock-extension"], "1.0.0") } };
                    ExtensionManager._setExtensions(mockInstallInfo);
                    setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);

                    runs(function () {
                        var $button = $("button.update[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeTruthy();

                        expect($("button.install[data-extension-id=mock-extension]", view.$el).length).toBe(0);
                        expect($(".alert.warning", view.$el).length).toBe(0);
                    });
                });

                it("should show disabled update button for items whose available update requires older API version", function () {   // isLatestVersion: false, requiresNewer: false
                    mockRegistry = { "mock-extension": makeMockExtension([">0.1", "<0.2"]) };
                    var mockInstallInfo = { "mock-extension": { installInfo: makeMockInstalledVersion(mockRegistry["mock-extension"], "1.0.0") } };
                    ExtensionManager._setExtensions(mockInstallInfo);
                    setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);

                    runs(function () {
                        var $button = $("button.update[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeTruthy();

                        expect($("button.install[data-extension-id=mock-extension]", view.$el).length).toBe(0);
                        expect($(".alert.warning", view.$el).length).toBe(0);
                    });
                });

                it("should show disabled update button for items that are in dev folder and have a compatible update available", function () {
                    mockRegistry = { "mock-extension": makeMockExtension([">0.1", ">0.1"]) };
                    var mockInfo = makeMockInstalledVersion(mockRegistry["mock-extension"], "1.0.0");
                    mockInfo.locationType = ExtensionManager.LOCATION_DEV;
                    ExtensionManager._setExtensions({
                        "mock-extension": {
                            installInfo: mockInfo
                        }
                    });
                    setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);

                    runs(function () {
                        var $button = $("button.update[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeTruthy();
                    });
                });

                // Info links action
                it("should open links in the native browser instead of in Brackets", function () {
                    runs(function () {
                        mockRegistry = {
                            "basic-valid-extension": {
                                "metadata": {
                                    "name": "basic-valid-extension",
                                    "title": "Basic Valid Extension",
                                    "version": "1.0.0"
                                },
                                "owner": "github:someuser",
                                "versions": [
                                    {
                                        "version": "1.0.0",
                                        "published": "2013-04-10T18:28:20.530Z"
                                    }
                                ]
                            }
                        };
                        setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                    });
                    runs(function () {
                        var origHref = window.location.href;
                        spyOn(NativeApp, "openURLInDefaultBrowser");

                        var event = new window.Event("click", { bubbles: false, cancelable: true });
                        document.querySelector("a[href='https://github.com/someuser']").dispatchEvent(event);

                        expect(NativeApp.openURLInDefaultBrowser).toHaveBeenCalledWith("https://github.com/someuser");
                        expect(window.location.href).toBe(origHref);
                    });
                });
            });

            describe("when showing installed extensions", function () {

                it("should show the 'no extensions' message when there are no extensions installed", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        expect($(".empty-message", view.$el).css("display")).not.toBe("none");
                        expect($(".empty-message", view.$el).html()).toEqual(Strings.NO_EXTENSIONS);
                        expect($("table", view.$el).css("display")).toBe("none");
                    });
                });

                it("should show the 'no extensions match' message when there are extensions installed but none match the search query", function () {
                    mockLoadExtensions(["user/mock-extension-3", "user/mock-extension-4", "user/mock-legacy-extension"]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        view.filter("DON'T_FIND_ME_IN_THE_EXTENSION_LIST");
                        expect($(".empty-message", view.$el).css("display")).not.toBe("none");
                        expect($(".empty-message", view.$el).html()).toEqual(Strings.NO_EXTENSION_MATCHES);
                        expect($("table", view.$el).css("display")).toBe("none");
                    });
                });

                it("should show only items that are already installed and have remove and disable/enable buttons for each", function () {
                    mockLoadExtensions(["user/mock-extension-3", "user/mock-extension-4", "user/mock-legacy-extension"]);
                    mockLoadExtensions(["user/mock-extension-5"], "disabled");
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        expect($(".empty-message", view.$el).css("display")).toBe("none");
                        expect($("table", view.$el).css("display")).not.toBe("none");
                        _.forEach(mockRegistry, function (item) {
                            var $removeButton = $("button.remove[data-extension-id=" + item.metadata.name + "]", view.$el);
                            if (item.metadata.name === "mock-extension-3" ||
                                    item.metadata.name === "mock-extension-4" ||
                                    item.metadata.name === "mock-legacy-extension" ||
                                    item.metadata.name === "mock-extension-5") {
                                expect(view).toHaveText(item.metadata.name);
                                expect($removeButton.length).toBe(1);

                                // should also have disable/enable button
                                var isDisable = item.metadata.name === "mock-extension-5" ? false : true,
                                    $disableButton = $("button." + (isDisable ? "disable" : "enable") + "[data-extension-id=" +
                                                       item.metadata.name + "]", view.$el);

                                expect($disableButton.length).toBe(1);

                                // But no update button
                                var $updateButton = $("button.update[data-extension-id=" + item.metadata.name + "]", view.$el);
                                expect($updateButton.length).toBe(0);
                            } else {
                                expect(view).not.toHaveText(item.metadata.name);
                                expect($removeButton.length).toBe(0);
                            }
                        });

                        // And no overall update icon overlay
                        expect(model.notifyCount).toBe(0);
                    });
                });

                it("should show a newly installed extension", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        expect(view).not.toHaveText("mock-extension-3");
                        mockLoadExtensions(["user/mock-extension-3"]);
                    });
                    runs(function () {
                        expect(view).toHaveText("mock-extension-3");
                    });
                });

                it("should not show extensions in the default folder", function () {
                    mockLoadExtensions(["default/mock-extension-1"]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        expect(view).not.toHaveText("mock-extension-1");
                    });
                });

                // 'Remove' button state
                it("should show extensions that failed to load with a 'remove' link", function () {
                    mockLoadExtensions(["user/mock-extension-3"], true);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        expect(view).toHaveText("mock-extension-3");
                        var $removeLink = $("a.remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($removeLink.length).toBe(1);
                        expect($removeLink.prop("disabled")).toBeFalsy();

                        $removeLink.click();
                        expect(ExtensionManager.isMarkedForRemoval("mock-extension-3")).toBe(true);
                        var $undoLink = $("a.undo-remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($undoLink.length).toBe(1);
                        $removeLink = $("a.remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($removeLink.length).toBe(0);
                    });
                });

                it("should not have a 'remove' link for extensions in the dev folder that failed to load", function () {
                    mockLoadExtensions(["dev/mock-failed-in-dev-folder"], true);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        expect(view).toHaveText("mock-failed-in-dev-folder");
                        var $removeLink = $("a.remove[data-extension-id=mock-failed-in-dev-folder]", view.$el);
                        expect($removeLink.length).toBe(0);
                    });
                });

                it("should disable the Remove button for extensions in the dev folder", function () {
                    mockLoadExtensions(["dev/mock-extension-2"]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id=mock-extension-2]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeTruthy();
                    });
                });

                // Disable button action
                it("should mark the given extension for disabling, hide the buttons and show the undo link", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $disableButton = $("button.disable[data-extension-id=mock-extension-3]", view.$el),
                            $removeButton,
                            $undoLink;
                        $disableButton.click();
                        $removeButton = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        $undoLink = $("a.undo-disable[data-extension-id=mock-extension-3]", view.$el);
                        $disableButton = $("button.disable[data-extension-id=mock-extension-3]", view.$el);
                        expect($removeButton.length).toBe(0);
                        expect($undoLink.length).toBe(1);
                        expect($disableButton.length).toBe(0);
                        expect(ExtensionManager.isMarkedForDisabling("mock-extension-3")).toBe(true);
                    });
                });

                it("should undo mark for disabling and make the buttons available again", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $disableButton = $("button.disable[data-extension-id=mock-extension-3]", view.$el),
                            $removeButton,
                            $undoLink;
                        $disableButton.click();
                        $undoLink = $("a.undo-disable[data-extension-id=mock-extension-3]", view.$el);
                        $undoLink.click();
                        $removeButton = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        $disableButton = $("button.disable[data-extension-id=mock-extension-3]", view.$el);
                        $undoLink = $("a.undo-disable[data-extension-id=mock-extension-3]", view.$el);
                        expect($removeButton.length).toBe(1);
                        expect($undoLink.length).toBe(0);
                        expect($disableButton.length).toBe(1);
                        expect(ExtensionManager.isMarkedForDisabling("mock-extension-3")).toBe(false);
                    });
                });

                it("should be able to disable an extension from the dev folder", function () {
                    mockLoadExtensions(["dev/mock-extension-6"]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $disableButton = $("button.disable[data-extension-id=mock-extension-6]", view.$el);
                        expect($disableButton.prop("disabled")).toBeFalsy();
                        $disableButton.click();
                        expect(ExtensionManager.isMarkedForDisabling("mock-extension-6")).toBe(true);
                    });
                });

                // 'Remove' button action
                it("should mark the given extension for removal, hide the remove button, and show an undo link", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $removeButton = $("button.remove[data-extension-id=mock-extension-3]", view.$el),
                            $disableButton;
                        $removeButton.click();
                        $disableButton = $("button.disable[data-extension-id=mock-extension-3]", view.$el);
                        expect(ExtensionManager.isMarkedForRemoval("mock-extension-3")).toBe(true);
                        expect($disableButton.length).toBe(0);
                        var $undoLink = $("a.undo-remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($undoLink.length).toBe(1);
                        $removeButton = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($removeButton.length).toBe(0);
                    });
                });

                it("should undo marking an extension for removal", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        $button.click();
                        var $undoLink = $("a.undo-remove[data-extension-id=mock-extension-3]", view.$el);
                        $undoLink.click();
                        expect(ExtensionManager.isMarkedForRemoval("mock-extension-3")).toBe(false);
                        $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($button.length).toBe(1);
                    });
                });

                it("should mark a legacy extension for removal", function () {
                    var id = "mock-legacy-extension";
                    mockLoadExtensions(["user/" + id]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id='" + id + "']", view.$el);
                        $button.click();
                        expect(ExtensionManager.isMarkedForRemoval(id)).toBe(true);
                    });
                });

                it("should no longer show a fully removed extension", function () {
                    mockLoadExtensions(["user/mock-extension-3", "user/mock-extension-4", "user/mock-legacy-extension"]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        expect(view).toHaveText("mock-extension-3");
                        waitsForDone(ExtensionManager.remove("mock-extension-3"));
                    });
                    runs(function () {
                        expect(view).not.toHaveText("mock-extension-3");
                    });
                });

                // 'Update' button state (see also similar tests for RegistryViewModel above)
                it("should show enabled update button for items that have a compatible update available", function () {
                    mockRegistry = { "mock-extension": makeMockExtension([">0.1", ">0.1"]) };
                    var mockInstallInfo = { "mock-extension": { installInfo: makeMockInstalledVersion(mockRegistry["mock-extension"], "1.0.0") } };
                    ExtensionManager._setExtensions(mockInstallInfo);
                    waitsForDone(ExtensionManager.downloadRegistry()); // ensure mockRegistry integrated in
                    runs(function () {
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    });
                    runs(function () {
                        var $button = $("button.update[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeFalsy();
                        expect(model.notifyCount).toBe(1);
                        expect($("button.install[data-extension-id=mock-extension]", view.$el).length).toBe(0);
                    });
                });

                it("should show disabled update button for items whose available update requires newer API version", function () {   // isLatestVersion: false, requiresNewer: true
                    mockRegistry = { "mock-extension": makeMockExtension([">0.1", ">100.0"]) };
                    var mockInstallInfo = { "mock-extension": { installInfo: makeMockInstalledVersion(mockRegistry["mock-extension"], "1.0.0") } };
                    ExtensionManager._setExtensions(mockInstallInfo);
                    waitsForDone(ExtensionManager.downloadRegistry()); // ensure mockRegistry integrated in
                    runs(function () {
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    });
                    runs(function () {
                        var $button = $("button.update[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeTruthy();

                        // notify count doesn't show extensions that cannot be updated
                        expect(model.notifyCount).toBe(0);

                        expect($("button.install[data-extension-id=mock-extension]", view.$el).length).toBe(0);
                        expect($(".alert.warning", view.$el).length).toBe(0);
                    });
                });
                it("should show disabled update button for items whose available update requires older API version", function () {   // isLatestVersion: false, requiresNewer: false
                    mockRegistry = { "mock-extension": makeMockExtension([">0.1", "<0.2"]) };
                    var mockInstallInfo = { "mock-extension": { installInfo: makeMockInstalledVersion(mockRegistry["mock-extension"], "1.0.0") } };
                    ExtensionManager._setExtensions(mockInstallInfo);
                    waitsForDone(ExtensionManager.downloadRegistry()); // ensure mockRegistry integrated in
                    runs(function () {
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    });
                    runs(function () {
                        var $button = $("button.update[data-extension-id=mock-extension]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeTruthy();

                        // notify count doesn't show extensions that cannot be updated
                        expect(model.notifyCount).toBe(0);

                        expect($("button.install[data-extension-id=mock-extension]", view.$el).length).toBe(0);
                        expect($(".alert.warning", view.$el).length).toBe(0);
                    });
                });

                // 'Update' button action
                it("should mark the given extension for update, hide the remove button, and show an undo link", function () {
                    var id = "mock-extension-3";
                    mockLoadExtensions(["user/" + id]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        ExtensionManager.updateFromDownload({
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        expect(ExtensionManager.isMarkedForUpdate(id)).toBe(true);
                        var $undoLink = $("a.undo-update[data-extension-id=" + id + "]", view.$el);
                        expect($undoLink.length).toBe(1);
                        var $button = $("button.remove[data-extension-id=" + id + "]", view.$el);
                        expect($button.length).toBe(0);
                    });
                });

                it("should undo marking an extension for update", function () {
                    var id = "mock-extension-3",
                        filename = "/path/to/downloaded/file.zip",
                        file = FileSystem.getFileForPath(filename);
                    mockLoadExtensions(["user/" + id]);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        ExtensionManager.updateFromDownload({
                            name: id,
                            installationStatus: "NEEDS_UPDATE",
                            localPath: filename
                        });
                        spyOn(file, "unlink");
                        var $undoLink = $("a.undo-update[data-extension-id=" + id + "]", view.$el);
                        $undoLink.click();
                        expect(ExtensionManager.isMarkedForUpdate(id)).toBe(false);
                        expect(file.unlink).toHaveBeenCalled();
                        var $button = $("button.remove[data-extension-id=" + id + "]", view.$el);
                        expect($button.length).toBe(1);
                    });
                });

                it("should properly return information about available updates and clean it after updates are installed", function () {
                    mockRegistry = { "mock-extension": makeMockExtension([">0.1", ">0.1"]) };
                    var mockInstallInfo = { "mock-extension": { installInfo: makeMockInstalledVersion(mockRegistry["mock-extension"], "1.0.0") } };
                    ExtensionManager._setExtensions(mockInstallInfo);
                    waitsForDone(ExtensionManager.downloadRegistry()); // ensure mockRegistry integrated in
                    runs(function () {
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    });
                    runs(function () {
                        var availableUpdates = ExtensionManager.getAvailableUpdates();
                        expect(availableUpdates.length).toBe(1);
                        // cleanAvailableUpdates shouldn't clean the array
                        expect(ExtensionManager.cleanAvailableUpdates(availableUpdates).length).toBe(1);
                        // now simulate that update is installed and see if cleanAvailableUpdates() method will work
                        ExtensionManager.extensions["mock-extension"].installInfo.metadata.version =
                            ExtensionManager.extensions["mock-extension"].registryInfo.metadata.version;
                        expect(ExtensionManager.cleanAvailableUpdates(availableUpdates).length).toBe(0);
                    });
                });

                // i18n info
                it("should show correct i18n info if the extension is translated in user's lang", function () {
                    var mockInstallInfo = { "mock-extension-4": { installInfo: mockRegistry["mock-extension-4"] } };
                    mockInstallInfo["mock-extension-4"].installInfo.metadata.i18n = ["zh-cn", "foo", "en"];
                    ExtensionManager._setExtensions(mockInstallInfo);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $extTranslated  = $(".ext-translated", view.$el),
                            languages       = [LocalizationUtils.getLocalizedLabel("en"), "foo",  LocalizationUtils.getLocalizedLabel("zh-cn")];
                        expect($extTranslated.length).toBe(1);
                        expect($extTranslated.text()).toBe(StringUtils.format(Strings.EXTENSION_TRANSLATED_USER_LANG, languages.length));
                        expect($extTranslated.attr("title")).toBe(StringUtils.format(Strings.EXTENSION_TRANSLATED_LANGS, languages.join(", ")));
                    });
                });
                it("should show correct i18n info if the extension is translated in some other languages", function () {
                    var mockInstallInfo = { "mock-extension-4": { installInfo: mockRegistry["mock-extension-4"] } };
                    mockInstallInfo["mock-extension-4"].installInfo.metadata.i18n = ["zh-cn"];
                    ExtensionManager._setExtensions(mockInstallInfo);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $extTranslated  = $(".ext-translated", view.$el),
                            languages       = [LocalizationUtils.getLocalizedLabel("zh-cn")];
                        expect($extTranslated.length).toBe(1);
                        expect($extTranslated.text()).toBe(StringUtils.format(Strings.EXTENSION_TRANSLATED_GENERAL, languages.length));
                        expect($extTranslated.attr("title")).toBe(StringUtils.format(Strings.EXTENSION_TRANSLATED_LANGS, languages.join(", ")));
                    });
                });
                it("should not show i18n info if the extension isn't translated", function () {
                    var mockInstallInfo = { "mock-extension-4": { installInfo: mockRegistry["mock-extension-4"] } };
                    mockInstallInfo["mock-extension-4"].installInfo.metadata.i18n = [];
                    ExtensionManager._setExtensions(mockInstallInfo);
                    setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                    runs(function () {
                        var $extTranslated  = $(".ext-translated", view.$el);
                        expect($extTranslated.length).toBe(0);
                        expect($extTranslated.attr("title")).toBe(undefined);
                    });
                });

            });


            describe("ExtensionManagerDialog", function () {
                var dialogClassShown, didReload, didClose, $mockDlg;

                describe("_performChanges", function () {

                    beforeEach(function () {
                        // Mock popping up dialogs
                        dialogClassShown = null;
                        didClose = false;
                        spyOn(Dialogs, "showModalDialog").andCallFake(function (dlgClass, title, message) {
                            dialogClassShown = dlgClass;
                            $mockDlg = $("<div/>").addClass(dlgClass);
                            // The test will resolve the promise.
                            return {
                                getElement: function () { return $mockDlg; },
                                close: function () { didClose = true; }
                            };
                        });

                        // Mock reloading the app so we don't actually reload :)
                        didReload = false;
                        spyOn(CommandManager, "execute").andCallFake(function (id) {
                            if (id === Commands.APP_RELOAD) {
                                didReload = true;
                            } else {
                                CommandManager.execute.apply(this, arguments);
                            }
                        });
                    });

                    afterEach(function () {
                        ExtensionManager._reset();
                    });

                    it("should not show a removal confirmation dialog if no extensions were removed", function () {
                        mockLoadExtensions(["user/mock-extension-3"]);
                        runs(function () {
                            ExtensionManagerDialog._performChanges();
                            expect(dialogClassShown).toBeFalsy();
                        });
                    });

                    it("should not show a removal confirmation dialog if an extension was marked for removal and then unmarked", function () {
                        mockLoadExtensions(["user/mock-extension-3"]);
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                        runs(function () {
                            var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                            $button.click();
                            var $undoLink = $("a.undo-remove[data-extension-id=mock-extension-3]", view.$el);
                            $undoLink.click();
                            ExtensionManagerDialog._performChanges();
                            expect(dialogClassShown).toBeFalsy();
                        });
                    });

                    it("should show a removal confirmation dialog if an extension was removed", function () {
                        mockLoadExtensions(["user/mock-extension-3"]);
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                        runs(function () {
                            var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                            $button.click();
                        });
                        runs(function () {
                            // Don't expect the model to be disposed until after the dialog is dismissed.
                            ExtensionManagerDialog._performChanges();
                            expect(dialogClassShown).toBe("change-marked-extensions");
                            $mockDlg.triggerHandler("buttonClick", Dialogs.DIALOG_BTN_CANCEL);
                        });
                    });

                    it("should remove extensions and quit if the user hits Remove and Quit on the removal confirmation dialog", function () {
                        mockLoadExtensions(["user/mock-extension-3"]);
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                        runs(function () {
                            var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                            $button.click();
                        });
                        runs(function () {
                            // Don't expect the model to be disposed until after the dialog is dismissed.
                            ExtensionManagerDialog._performChanges();
                            $mockDlg.triggerHandler("buttonClick", Dialogs.DIALOG_BTN_OK);
                        });
                        waitsFor(function () { return didReload; }, "mock reload");
                        runs(function () {
                            var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                            expect(removedPath).toBe(mockPath + "/user/mock-extension-3");
                            expect(didClose).toBe(true);
                            expect(didReload).toBe(true);
                        });
                    });

                    it("should not remove extensions or quit if the user hits Cancel on the removal confirmation dialog", function () {
                        mockLoadExtensions(["user/mock-extension-3"]);
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                        runs(function () {
                            var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                            $button.click();
                        });
                        runs(function () {
                            // Don't expect the model to be disposed until after the dialog is dismissed.
                            ExtensionManagerDialog._performChanges();
                            $mockDlg.triggerHandler("buttonClick", Dialogs.DIALOG_BTN_CANCEL);
                            expect(removedPath).toBeFalsy();
                            expect(ExtensionManager.isMarkedForRemoval("mock-extension-3")).toBe(false);
                            expect(didClose).toBe(true);
                            expect(didReload).toBe(false);
                        });
                    });

                    it("should not show a disabling confirmation dialog if an extension was marked and then unmarked", function () {
                        mockLoadExtensions(["user/mock-extension-3"]);
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                        runs(function () {
                            var $button = $("button.disable[data-extension-id=mock-extension-3]", view.$el),
                                $undoLink;
                            $button.click();
                            $undoLink = $("a.undo-disable[data-extension-id=mock-extension-3]");
                            $undoLink.click();
                            ExtensionManagerDialog._performChanges();
                            expect(dialogClassShown).toBeFalsy();
                        });
                    });

                    it("should show a disabling confirmation dialog if an extension was marked for disabling", function () {
                        mockLoadExtensions(["user/mock-extension-3"]);
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                        runs(function () {
                            var $button = $("button.disable[data-extension-id=mock-extension-3]", view.$el);
                            $button.click();
                        });
                        runs(function () {
                            ExtensionManagerDialog._performChanges();
                            expect(dialogClassShown).toBe("change-marked-extensions");
                            $mockDlg.triggerHandler("buttonClick", Dialogs.DIALOG_BTN_CANCEL);
                        });
                    });

                    it("should update extensions and quit if the user hits Update and Quit on the removal confirmation dialog", function () {
                        var id = "mock-extension-3",
                            filename = "/path/to/downloaded/mock-extension-3.zip";
                        mockLoadExtensions(["user/" + id]);
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                        var installDeferred = $.Deferred();
                        spyOn(Package, "installUpdate").andReturn(installDeferred.promise());
                        runs(function () {
                            ExtensionManager.updateFromDownload({
                                installationStatus: Package.InstallationStatuses.NEEDS_UPDATE,
                                localPath: filename,
                                name: id
                            });
                            // Don't expect the model to be disposed until after the dialog is dismissed.
                            ExtensionManagerDialog._performChanges();
                            $mockDlg.triggerHandler("buttonClick", Dialogs.DIALOG_BTN_OK);
                            installDeferred.resolve({
                                installationStatus: "INSTALLED"
                            });
                        });
                        waitsFor(function () { return didReload; }, "mock reload");
                        runs(function () {
                            expect(Package.installUpdate).toHaveBeenCalledWith(filename, id);
                            expect(didClose).toBe(true);
                            expect(didReload).toBe(true);
                        });
                    });

                    it("should not update extensions or quit if the user hits Cancel on the confirmation dialog", function () {
                        var id = "mock-extension-3",
                            filename = "/path/to/downloaded/file.zip",
                            file = FileSystem.getFileForPath(filename);
                        mockLoadExtensions(["user/" + id]);
                        setupViewWithMockData(ExtensionManagerViewModel.InstalledViewModel);
                        runs(function () {
                            ExtensionManager.updateFromDownload({
                                name: id,
                                localPath: filename,
                                installationStatus: Package.InstallationStatuses.NEEDS_UPDATE
                            });
                            expect(ExtensionManager.isMarkedForUpdate(id)).toBe(true);
                            spyOn(file, "unlink");
                            // Don't expect the model to be disposed until after the dialog is dismissed.
                            ExtensionManagerDialog._performChanges();
                            $mockDlg.triggerHandler("buttonClick", Dialogs.DIALOG_BTN_CANCEL);
                            expect(removedPath).toBeFalsy();
                            expect(ExtensionManager.isMarkedForUpdate("mock-extension-3")).toBe(false);
                            expect(didClose).toBe(true);
                            expect(didReload).toBe(false);
                            expect(file.unlink).toHaveBeenCalled();
                        });
                    });

                });

                describe("initialization", function () {

                    var dialog, $dlg, originalRegistry;

                    // Sets up a view without actually loading any data--just for testing how we
                    // respond to the notifications.
                    beforeEach(function () {
                        runs(function () {
                            fakeLoadDeferred = new $.Deferred();
                            spyOn(ExtensionManager, "downloadRegistry").andCallFake(function () {
                                return fakeLoadDeferred.promise();
                            });
                        });
                    });

                    afterEach(function () {
                        runs(function () {
                            dialog.close();
                            waitsForDone(dialog.getPromise(), "ExtensionManagerDialog.close");
                        });

                        runs(function () {
                            brackets.config.extension_registry = originalRegistry;
                            dialog = null;
                            $dlg = null;
                        });
                    });

                    function openDialog() {
                        // this command is synchronous
                        CommandManager.execute(Commands.FILE_EXTENSION_MANAGER)
                            .done(function (dialogResult) {
                                dialog = dialogResult;
                                $dlg = dialog.getElement();
                            });
                    }

                    function setRegistryURL(url) {
                        originalRegistry = brackets.config.extension_registry;
                        brackets.config.extension_registry = url;
                    }

                    it("should show the spinner before the registry appears successfully and hide it after", function () {
                        runs(function () {
                            openDialog();
                            expect($(".spinner", $dlg).length).toBe(1);
                            fakeLoadDeferred.resolve();
                            expect($(".spinner", $dlg).length).toBe(0);
                        });
                    });

                    it("should show an error and remove the spinner if there is an error fetching the registry", function () {
                        runs(function () {
                            openDialog();
                            fakeLoadDeferred.reject();
                            expect($(".spinner", $dlg).length).toBe(0);
                            expect($("#registry .empty-message").text()).toBe(Strings.EXTENSION_MANAGER_ERROR_LOAD);
                        });
                    });

                    it("should hide the registry tab when no URL is specified", function () {
                        runs(function () {
                            setRegistryURL(null);
                            openDialog();
                            fakeLoadDeferred.resolve();
                            expect($(".registry", $dlg).length).toBe(0);
                        });
                    });

                    it("should show the registry tab when a URL is specified", function () {
                        runs(function () {
                            setRegistryURL("not null");
                            openDialog();
                            fakeLoadDeferred.resolve();
                            expect($(".registry", $dlg).length).toBe(1);
                        });
                    });
                });
            });
        });

        describe("ExtensionManagerView-i18n", function () {

            beforeEach(function () {
                setupExtensionManagerViewTests(this);
                spyOn(brackets, "getLocale").andReturn("fr");
            });

            afterEach(function () {
                cleanupExtensionManagerViewTests();
            });

            it("should display localized description", function () {
                setupViewWithMockData(ExtensionManagerViewModel.RegistryViewModel);
                runs(function () {
                    _.forEach(mockRegistry, function (item) {
                        if (item.metadata["package-i18n"] &&
                                item.metadata["package-i18n"].hasOwnProperty("fr") &&
                                item.metadata["package-i18n"].fr.hasOwnProperty("description")) {
                            expect(view).toHaveText(item.metadata["package-i18n"].fr.description);
                            expect(view).toHaveText(item.metadata["package-i18n"].fr.title);
                            expect(view).not.toHaveText(item.metadata["package-i18n"].fr.warnings);
                        }
                    });
                });
            });
        });
    });
});
