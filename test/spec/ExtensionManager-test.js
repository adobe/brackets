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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true,
indent: 4, maxerr: 50, regexp: true */
/*global define, describe, it, xit, expect, beforeEach, afterEach,
waitsFor, runs, $, brackets, waitsForDone, spyOn, jasmine */
/*unittests: ExtensionManager*/

define(function (require, exports, module) {
    "use strict";
    
    require("thirdparty/jquery.mockjax.js");
    
    var ExtensionManager          = require("extensibility/ExtensionManager"),
        ExtensionManagerView      = require("extensibility/ExtensionManagerView").ExtensionManagerView,
        ExtensionManagerViewModel = require("extensibility/ExtensionManagerViewModel").ExtensionManagerViewModel,
        InstallExtensionDialog    = require("extensibility/InstallExtensionDialog"),
        Package                   = require("extensibility/Package"),
        ExtensionLoader           = require("utils/ExtensionLoader"),
        NativeFileSystem          = require("file/NativeFileSystem").NativeFileSystem,
        NativeFileError           = require("file/NativeFileError"),
        SpecRunnerUtils           = require("spec/SpecRunnerUtils"),
        CollectionUtils           = require("utils/CollectionUtils"),
        NativeApp                 = require("utils/NativeApp"),
        Dialogs                   = require("widgets/Dialogs"),
        CommandManager            = require("command/CommandManager"),
        Commands                  = require("command/Commands"),
        mockRegistryText          = require("text!spec/ExtensionManager-test-files/mockRegistry.json"),
        mockRegistryForSearch     = require("text!spec/ExtensionManager-test-files/mockRegistryForSearch.json"),
        mockExtensionList         = require("text!spec/ExtensionManager-test-files/mockExtensionList.json"),
        mockRegistry;
    
    describe("ExtensionManager", function () {
        var mockId, mockSettings, origRegistryURL, origExtensionUrl, removedPath;
        
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
        });
        
        afterEach(function () {
            $.mockjaxClear(mockId);
            ExtensionManager._reset();
            $(ExtensionManager).off(".unit-test");
            brackets.config.extension_registry = origRegistryURL;
            brackets.config.extension_url = origExtensionUrl;
        });
        
        function mockLoadExtensions(names, fail) {
            var numStatusChanges = 0;
            runs(function () {
                $(ExtensionManager).on("statusChange.mock-load", function () {
                    numStatusChanges++;
                });
                var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                names = names || ["default/mock-extension-1", "dev/mock-extension-2", "user/mock-legacy-extension"];
                names.forEach(function (name) {
                    $(ExtensionLoader).triggerHandler(fail ? "loadFailed" : "load", mockPath + "/" + name);
                });
            });
            
            // Make sure the ExtensionManager has finished reading all the package.jsons before continuing.
            waitsFor(function () { return numStatusChanges === names.length; }, "ExtensionManager status changes");
            
            runs(function () {
                $(ExtensionManager).off(".mock-load");
            });
        }
        
        describe("ExtensionManager", function () {
            it("should download the extension list from the registry", function () {
                var registry;
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
            
            it("should set the title for a legacy extension based on its folder name", function () {
                mockLoadExtensions();
                runs(function () {
                    var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                    expect(ExtensionManager.extensions["mock-legacy-extension"].installInfo.metadata.title).toEqual("mock-legacy-extension");
                });
            });
            
            it("should determine the location type for installed extensions", function () {
                mockLoadExtensions();
                runs(function () {
                    expect(ExtensionManager.extensions["mock-extension-1"].installInfo.locationType).toEqual(ExtensionManager.LOCATION_DEFAULT);
                    expect(ExtensionManager.extensions["mock-extension-2"].installInfo.locationType).toEqual(ExtensionManager.LOCATION_DEV);
                    var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                    expect(ExtensionManager.extensions["mock-legacy-extension"].installInfo.locationType).toEqual(ExtensionManager.LOCATION_USER);
                });
            });
            
            it("should raise a statusChange event when an extension is loaded", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    $(ExtensionManager).on("statusChange.unit-test", spy);
                    mockLoadExtensions(["default/mock-extension-1"]);
                });
                runs(function () {
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), "mock-extension-1");
                });
            });
            
            it("should raise a statusChange event when a legacy extension is loaded, with its path as the id", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    $(ExtensionManager).on("statusChange.unit-test", spy);
                    mockLoadExtensions(["user/mock-legacy-extension"]);
                });
                runs(function () {
                    var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), "mock-legacy-extension");
                });
            });
            
            it("should remove an extension and raise a statusChange event", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                });
                runs(function () {
                    $(ExtensionManager).on("statusChange.unit-test", spy);
                    waitsForDone(ExtensionManager.remove("mock-extension-3"));
                });
                runs(function () {
                    var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                    expect(removedPath).toBe(mockPath + "/user/mock-extension-3");
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), "mock-extension-3");
                    expect(ExtensionManager.extensions["mock-extension-3"].installInfo).toBeFalsy();
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
            
            it("should calculate compatibility info correctly", function () {
                function fakeEntry(version) {
                    return { metadata: { engines: { brackets: version } } };
                }
                
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(null), "1.0.0"))
                    .toEqual({isCompatible: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(">0.5.0"), "0.6.0"))
                    .toEqual({isCompatible: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(">0.6.0"), "0.6.0"))
                    .toEqual({isCompatible: false, requiresNewer: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry(">0.7.0"), "0.6.0"))
                    .toEqual({isCompatible: false, requiresNewer: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("<0.5.0"), "0.4.0"))
                    .toEqual({isCompatible: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("<0.4.0"), "0.4.0"))
                    .toEqual({isCompatible: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("<0.3.0"), "0.4.0"))
                    .toEqual({isCompatible: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.2.0"))
                    .toEqual({isCompatible: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.2.1"))
                    .toEqual({isCompatible: true});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.3.0"))
                    .toEqual({isCompatible: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.3.1"))
                    .toEqual({isCompatible: false, requiresNewer: false});
                expect(ExtensionManager.getCompatibilityInfo(fakeEntry("~1.2"), "1.1.0"))
                    .toEqual({isCompatible: false, requiresNewer: true});
            });
            
            it("should return the correct download URL for an extension", function () {
                expect(ExtensionManager.getExtensionURL("my-cool-extension", "1.2.3"))
                    .toBe("http://fake-repository.com/my-cool-extension/my-cool-extension-1.2.3.zip");
            });
        });

        describe("ExtensionManagerView Model", function () {
            describe("when initialized from registry", function () {
                var model;
                
                beforeEach(function () {
                    runs(function () {
                        mockRegistry = JSON.parse(mockRegistryForSearch);
                        model = new ExtensionManagerViewModel();
                        waitsForDone(model.initialize(ExtensionManagerViewModel.SOURCE_REGISTRY), "model initialization");
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
                
                it("should trigger filter event when filter changes", function () {
                    var gotEvent = false;
                    $(model).on("filter", function () {
                        gotEvent = true;
                    });
                    model.filter("uniq1");
                    expect(gotEvent).toBe(true);
                });
            });
            
            describe("when initialized from local extension list", function () {
                var model, origExtensions;
                
                beforeEach(function () {
                    runs(function () {
                        origExtensions = ExtensionManager.extensions;
                        ExtensionManager._setExtensions(JSON.parse(mockExtensionList));
                        model = new ExtensionManagerViewModel();
                        waitsForDone(model.initialize(ExtensionManagerViewModel.SOURCE_INSTALLED));
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
                
                it("should raise an event when an extension is installed", function () {
                    var calledId;
                    runs(function () {
                        $(model).on("change", function (e, id) {
                            calledId = id;
                        });
                    });
                    mockLoadExtensions(["user/install-later-extension"]);
                    runs(function () {
                        expect(calledId).toBe("install-later-extension");
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
                        $(model).on("change", function (e, id) {
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
                        $(model).on("change", function (e, id) {
                            calledId = id;
                        });
                        model.markForRemoval(id, true);
                        expect(calledId).toBe(id);
                        expect(model.isMarkedForRemoval(id)).toBe(true);
                        expect(model.filterSet.indexOf(id)).not.toBe(-1);
                        expect(model.hasExtensionsToRemove()).toBe(true);
                    });
                });
                
                it("should unmark an extension previously marked for removal and raise an event", function () {
                    var id = "registered-extension", calledId;
                    runs(function () {
                        model.markForRemoval(id, true);
                        $(model).on("change", function (e, id) {
                            calledId = id;
                        });
                        model.markForRemoval(id, false);
                        expect(calledId).toBe(id);
                        expect(model.isMarkedForRemoval(id)).toBe(false);
                        expect(model.hasExtensionsToRemove()).toBe(false);
                    });
                });

                it("should remove extensions previously marked for removal", function () {
                    var removedIds = {}, removedPaths = {};
                    runs(function () {
                        model.markForRemoval("registered-extension", true);
                        model.markForRemoval("Z-capital-extension", false);
                        $(model).on("change", function (e, id) {
                            removedIds[id] = true;
                            removedPaths[removedPath] = true;
                        });
                        waitsForDone(model.removeMarkedExtensions());
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
                
                it("should mark an extension for update and raise an event", function () {
                    var id = "registered-extension", calledId;
                    runs(function () {
                        $(model).on("change", function (e, id) {
                            calledId = id;
                        });
                        model.updateFromDownload({
                            localPath: "/path/to/downloaded/file.zip",
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        expect(calledId).toBe(id);
                        expect(model.isMarkedForUpdate(id)).toBe(true);
                        expect(model.hasExtensionsToUpdate()).toBe(true);
                    });
                });
                
                it("should unmark an extension for update, deleting the package and raising an event", function () {
                    var id = "registered-extension",
                        filename = "/path/to/downloaded/file.zip",
                        calledId;
                    runs(function () {
                        $(model).on("change", function (e, id) {
                            calledId = id;
                        });
                        model.updateFromDownload({
                            localPath: filename,
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        calledId = null;
                        spyOn(brackets.fs, "unlink");
                        model.removeUpdate(id);
                        expect(calledId).toBe(id);
                        expect(brackets.fs.unlink).toHaveBeenCalledWith(filename, jasmine.any(Function));
                        expect(model.isMarkedForUpdate()).toBe(false);
                    });
                });
                
                it("should change an extension marked for removal to update raise an event", function () {
                    var id = "registered-extension", calledId;
                    runs(function () {
                        $(model).on("change", function (e, id) {
                            calledId = id;
                        });
                        model.markForRemoval(id, true);
                        expect(calledId).toBe(id);
                        calledId = null;
                        model.updateFromDownload({
                            localPath: "/path/to/downloaded/file.zip",
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        expect(calledId).toBe(id);
                        expect(model.isMarkedForRemoval()).toBe(false);
                        expect(model.hasExtensionsToRemove()).toBe(false);
                        expect(model.isMarkedForUpdate(id)).toBe(true);
                        expect(model.hasExtensionsToUpdate()).toBe(true);
                    });
                });
                
                it("should update extensions marked for update", function () {
                    var id = "registered-extension",
                        filename = "/path/to/downloaded/file.zip";
                    runs(function () {
                        model.updateFromDownload({
                            localPath: filename,
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        expect(model.isMarkedForUpdate()).toBe(false);
                        spyOn(brackets.fs, "unlink");
                        var d = $.Deferred();
                        spyOn(Package, "installUpdate").andReturn(d.promise());
                        d.resolve();
                        waitsForDone(model.updateExtensions());
                    });
                    runs(function () {
                        expect(brackets.fs.unlink).not.toHaveBeenCalled();
                        expect(Package.installUpdate).toHaveBeenCalledWith(filename, id);
                    });
                });
            });
        });
        
        describe("ExtensionManagerView", function () {
            var testWindow, view, fakeLoadDeferred, modelDisposed;
            
            // Sets up the view using the normal (mock) ExtensionManager data.
            function setupViewWithMockData(source) {
                runs(function () {
                    view = new ExtensionManagerView();
                    modelDisposed = false;
                    waitsForDone(view.initialize(source), "view initializing");
                });
                runs(function () {
                    spyOn(view.model, "dispose").andCallThrough();
                });
            }
            
            // Sets up a view without actually loading any data--just for testing how we
            // respond to the notifications.
            function setupViewWithFakeLoad() {
                fakeLoadDeferred = new $.Deferred();
                spyOn(ExtensionManager, "downloadRegistry").andCallFake(function () {
                    return fakeLoadDeferred.promise();
                });
                view = new ExtensionManagerView();
                // We don't wait for this to finish since the tests that use this will
                // be manipulating the load promise.
                view.initialize(ExtensionManagerViewModel.SOURCE_REGISTRY);
                modelDisposed = false;
                spyOn(view.model, "dispose").andCallThrough();
            }
            
            function cleanupView(skipRemoval, expectModelDispose) {
                if (view) {
                    view.dispose(skipRemoval);
                    if (expectModelDispose !== false) {
                        expect(view.model.dispose).toHaveBeenCalled();
                    }
                    view = null;
                }
            }
            
            beforeEach(function () {
                this.addMatchers({
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
            });
                
            
            afterEach(function () {
                cleanupView(true);
            });
            
            describe("when showing registry entries", function () {
                it("should populate itself with registry entries and display their fields when created", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_REGISTRY);
                    runs(function () {
                        CollectionUtils.forEach(mockRegistry, function (item) {
                            // Should show the title if specified, otherwise the bare name.
                            if (item.metadata.title) {
                                expect(view).toHaveText(item.metadata.title);
                            } else {
                                expect(view).toHaveText(item.metadata.name);
                            }
                            
                            // Simple fields
                            [item.metadata.version,
                                item.metadata.author && item.metadata.author.name,
                                item.metadata.description]
                                .forEach(function (value) {
                                    if (value) {
                                        expect(view).toHaveText(value);
                                    }
                                });
                            if (item.metadata.homepage) {
                                expect(view).toHaveLink(item.metadata.homepage);
                            }
                            
                            // Array-valued fields
                            [item.metadata.keywords, item.metadata.categories].forEach(function (arr) {
                                if (arr) {
                                    arr.forEach(function (value) {
                                        expect(view).toHaveText(value);
                                    });
                                }
                            });
                            
                            // Owner--should show the parts, but might format them separately
                            item.owner.split(":").forEach(function (part) {
                                expect(view).toHaveText(part);
                            });
                        });
                    });
                });
                
                it("should show an install button for each item", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_REGISTRY);
                    runs(function () {
                        CollectionUtils.forEach(mockRegistry, function (item) {
                            var $button = $("button.install[data-extension-id=" + item.metadata.name + "]", view.$el);
                            expect($button.length).toBe(1);
                        });
                    });
                });
                
                it("should show disabled install buttons for items that are already installed", function () {
                    mockLoadExtensions(["user/mock-extension-3", "user/mock-extension-4"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_REGISTRY);
                    runs(function () {
                        CollectionUtils.forEach(mockRegistry, function (item) {
                            var $button = $("button.install[data-extension-id=" + item.metadata.name + "]", view.$el);
                            if (item.metadata.name === "mock-extension-3" || item.metadata.name === "mock-extension-4") {
                                expect($button.prop("disabled")).toBeTruthy();
                            } else {
                                expect($button.prop("disabled")).toBeFalsy();
                            }
                        });
                    });
                });
    
                it("should show disabled install buttons for items that have incompatible versions", function () {
                    runs(function () {
                        mockRegistry = {
                            "incompatible-extension": {
                                "metadata": {
                                    "name": "incompatible-extension",
                                    "title": "Incompatible Extension",
                                    "version": "1.0.0",
                                    "engines": {
                                        "brackets": "<0.1"
                                    }
                                },
                                "owner": "github:someuser",
                                "versions": [
                                    {
                                        "version": "1.0.0",
                                        "published": "2013-04-10T18:28:20.530Z",
                                        "brackets": "<0.1"
                                    }
                                ]
                            }
                        };
                        setupViewWithMockData(ExtensionManagerViewModel.SOURCE_REGISTRY);
                    });
                    runs(function () {
                        var $button = $("button.install[data-extension-id=incompatible-extension]", view.$el);
                        expect($button.prop("disabled")).toBeTruthy();
                    });
                });
                
                it("should bring up the install dialog and install an item when install button is clicked", function () {
                    runs(function () {
                        setupViewWithMockData(ExtensionManagerViewModel.SOURCE_REGISTRY);
                    });
                    runs(function () {
                        var $button = $("button.install[data-extension-id=mock-extension-3]", view.$el);
                        expect($button.length).toBe(1);
                        $button.click();
                        expect(InstallExtensionDialog.installUsingDialog)
                            .toHaveBeenCalledWith("http://fake-repository.com/mock-extension-3/mock-extension-3-1.0.0.zip");
                    });
                });
                
                it("should disable the install button for an item immediately after installing it", function () {
                    var $button;
                    runs(function () {
                        setupViewWithMockData(ExtensionManagerViewModel.SOURCE_REGISTRY);
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
                            
                it("should show the spinner before the registry appears successfully and hide it after", function () {
                    setupViewWithFakeLoad();
                    expect($(".spinner", view.$el).length).toBe(1);
                    fakeLoadDeferred.resolve();
                    expect($(".spinner", view.$el).length).toBe(0);
                });
                
                it("should show an error and remove the spinner if there is an error fetching the registry", function () {
                    setupViewWithFakeLoad();
                    fakeLoadDeferred.reject();
                    expect($(".spinner", view.$el).length).toBe(0);
                    expect($(".error", view.$el).length).toBe(1);
                });
                
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
                        setupViewWithMockData(ExtensionManagerViewModel.SOURCE_REGISTRY);
                    });
                    runs(function () {
                        var origHref = window.location.href;
                        spyOn(NativeApp, "openURLInDefaultBrowser");
                        $("a", view.$el).first().click();
                        expect(NativeApp.openURLInDefaultBrowser).toHaveBeenCalledWith("https://github.com/someuser");
                        expect(window.location.href).toBe(origHref);
                    });
                });
            });
            
            describe("when showing installed extensions", function () {
                var dialogClassShown, dialogDeferred, didQuit;
                
                beforeEach(function () {
                    // Mock popping up dialogs
                    dialogClassShown = null;
                    dialogDeferred = new $.Deferred();
                    spyOn(Dialogs, "showModalDialog").andCallFake(function (dlgClass, title, message) {
                        dialogClassShown = dlgClass;
                        // The test will resolve the promise.
                        return dialogDeferred.promise();
                    });
                    
                    // Mock quitting the app so we don't actually quit :)
                    didQuit = false;
                    spyOn(CommandManager, "execute").andCallFake(function (id) {
                        if (id === Commands.FILE_QUIT) {
                            didQuit = true;
                        } else {
                            CommandManager.execute.apply(this, arguments);
                        }
                    });
                });
                
                it("should show the 'no extensions' message when there are no extensions installed", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        expect($(".empty-message", view.$el).css("display")).not.toBe("none");
                        expect($("table", view.$el).css("display")).toBe("none");
                    });
                });
                           
                it("should show only items that are already installed and have a remove button for each", function () {
                    mockLoadExtensions(["user/mock-extension-3", "user/mock-extension-4", "user/mock-legacy-extension"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        expect($(".empty-message", view.$el).css("display")).toBe("none");
                        expect($("table", view.$el).css("display")).not.toBe("none");
                        CollectionUtils.forEach(mockRegistry, function (item) {
                            var $button = $("button.remove[data-extension-id=" + item.metadata.name + "]", view.$el);
                            if (item.metadata.name === "mock-extension-3" ||
                                    item.metadata.name === "mock-extension-4" ||
                                    item.metadata.name === "mock-legacy-extension") {
                                expect(view).toHaveText(item.metadata.name);
                                expect($button.length).toBe(1);
                            } else {
                                expect(view).not.toHaveText(item.metadata.name);
                                expect($button.length).toBe(0);
                            }
                        });
                    });
                });
                
                it("should show a newly installed extension", function () {
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
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
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        expect(view).not.toHaveText("mock-extension-1");
                    });
                });
                
                it("should show extensions that failed to load with a 'remove' link", function () {
                    mockLoadExtensions(["user/mock-extension-3"], true);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        expect(view).toHaveText("mock-extension-3");
                        var $removeLink = $("a.remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($removeLink.length).toBe(1);
                        expect($removeLink.prop("disabled")).toBeFalsy();
                        
                        $removeLink.click();
                        expect(view.model.isMarkedForRemoval("mock-extension-3")).toBe(true);
                        var $undoLink = $("a.undo-remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($undoLink.length).toBe(1);
                        $removeLink = $("a.remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($removeLink.length).toBe(0);
                    });
                });
                
                it("should disable the Remove button for extensions in the dev folder", function () {
                    mockLoadExtensions(["dev/mock-extension-2"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id=mock-extension-2]", view.$el);
                        expect($button.length).toBe(1);
                        expect($button.prop("disabled")).toBeTruthy();
                    });
                });
                
                it("should mark the given extension for removal, hide the remove button, and show an undo link", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        $button.click();
                        expect(view.model.isMarkedForRemoval("mock-extension-3")).toBe(true);
                        var $undoLink = $("a.undo-remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($undoLink.length).toBe(1);
                        $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($button.length).toBe(0);
                    });
                });
                
                it("should undo marking an extension for removal", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        $button.click();
                        var $undoLink = $("a.undo-remove[data-extension-id=mock-extension-3]", view.$el);
                        $undoLink.click();
                        expect(view.model.isMarkedForRemoval("mock-extension-3")).toBe(false);
                        $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        expect($button.length).toBe(1);
                    });
                });
                
                it("should mark a legacy extension for removal", function () {
                    var id = "mock-legacy-extension";
                    mockLoadExtensions(["user/" + id]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files/user/" + id),
                            $button = $("button.remove[data-extension-id='" + id + "']", view.$el);
                        $button.click();
                        expect(view.model.isMarkedForRemoval(id)).toBe(true);
                    });
                });
                
                it("should no longer show a fully removed extension", function () {
                    mockLoadExtensions(["user/mock-extension-3", "user/mock-extension-4", "user/mock-legacy-extension"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        expect(view).toHaveText("mock-extension-3");
                        waitsForDone(ExtensionManager.remove("mock-extension-3"));
                    });
                    runs(function () {
                        expect(view).not.toHaveText("mock-extension-3");
                    });
                });
                
                it("should not show a removal confirmation dialog if no extensions were removed", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        cleanupView(false);
                        expect(dialogClassShown).toBeFalsy();
                    });
                });
                
                it("should not show a removal confirmation dialog if an extension was marked for removal and then unmarked", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        $button.click();
                        var $undoLink = $("a.undo-remove[data-extension-id=mock-extension-3]", view.$el);
                        $undoLink.click();
                        cleanupView(false);
                        expect(dialogClassShown).toBeFalsy();
                    });
                });
                
                it("should show a removal confirmation dialog if an extension was removed", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        $button.click();
                    });
                    runs(function () {
                        var model = view.model;
                        // Don't expect the model to be disposed until after the dialog is dismissed.
                        cleanupView(false, false);
                        expect(dialogClassShown).toBe("change-marked-extensions");
                        dialogDeferred.resolve("cancel");
                        expect(model.dispose).toHaveBeenCalled();
                    });
                });
                
                it("should remove extensions and quit if the user hits Remove and Quit on the removal confirmation dialog", function () {
                    var model;
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        $button.click();
                    });
                    runs(function () {
                        model = view.model;
                        // Don't expect the model to be disposed until after the dialog is dismissed.
                        cleanupView(false, false);
                        dialogDeferred.resolve("ok");
                    });
                    waitsFor(function () { return didQuit; }, "mock quit");
                    runs(function () {
                        var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                        expect(removedPath).toBe(mockPath + "/user/mock-extension-3");
                        expect(didQuit).toBe(true);
                        expect(model.dispose).toHaveBeenCalled();
                    });
                });
                
                it("should not remove extensions or quit if the user hits Cancel on the removal confirmation dialog", function () {
                    mockLoadExtensions(["user/mock-extension-3"]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        var $button = $("button.remove[data-extension-id=mock-extension-3]", view.$el);
                        $button.click();
                    });
                    runs(function () {
                        var model = view.model;
                        // Don't expect the model to be disposed until after the dialog is dismissed.
                        cleanupView(false, false);
                        dialogDeferred.resolve("cancel");
                        expect(removedPath).toBeFalsy();
                        expect(didQuit).toBe(false);
                        expect(model.dispose).toHaveBeenCalled();
                    });
                });
                
                it("should update extensions and quit if the user hits Update and Quit on the removal confirmation dialog", function () {
                    var model,
                        id = "mock-extension-3",
                        filename = "/path/to/downloaded/mock-extension-3.zip";
                    mockLoadExtensions(["user/" + id]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    var installDeferred = $.Deferred();
                    spyOn(Package, "installUpdate").andReturn(installDeferred.promise());
                    runs(function () {
                        view.model.updateFromDownload({
                            installationStatus: Package.InstallationStatuses.NEEDS_UPDATE,
                            localPath: filename,
                            name: id
                        });
                        model = view.model;
                        // Don't expect the model to be disposed until after the dialog is dismissed.
                        cleanupView(false, false);
                        dialogDeferred.resolve("ok");
                        installDeferred.resolve({
                            installationStatus: "INSTALLED"
                        });
                    });
                    waitsFor(function () { return didQuit; }, "mock quit");
                    runs(function () {
                        expect(Package.installUpdate).toHaveBeenCalledWith(filename, id);
                        expect(didQuit).toBe(true);
                        expect(model.dispose).toHaveBeenCalled();
                    });
                });
                
                it("should not update extensions or quit if the user hits Cancel on the confirmation dialog", function () {
                    var id = "mock-extension-3",
                        filename = "/path/to/downloaded/file.zip";
                    mockLoadExtensions(["user/" + id]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        view.model.updateFromDownload({
                            name: id,
                            localPath: filename,
                            installationStatus: Package.InstallationStatuses.NEEDS_UPDATE
                        });
                        var model = view.model;
                        expect(model.isMarkedForUpdate(id)).toBe(true);
                        spyOn(brackets.fs, "unlink");
                        // Don't expect the model to be disposed until after the dialog is dismissed.
                        cleanupView(false, false);
                        dialogDeferred.resolve("cancel");
                        expect(removedPath).toBeFalsy();
                        expect(didQuit).toBe(false);
                        expect(model.dispose).toHaveBeenCalled();
                        expect(brackets.fs.unlink).toHaveBeenCalledWith(filename, jasmine.any(Function));
                    });
                });
                
                it("should mark the given extension for update, hide the remove button, and show an undo link", function () {
                    var id = "mock-extension-3";
                    mockLoadExtensions(["user/" + id]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        view.model.updateFromDownload({
                            name: id,
                            installationStatus: "NEEDS_UPDATE"
                        });
                        expect(view.model.isMarkedForUpdate(id)).toBe(true);
                        var $undoLink = $("a.undo-update[data-extension-id=" + id + "]", view.$el);
                        expect($undoLink.length).toBe(1);
                        var $button = $("button.remove[data-extension-id=" + id + "]", view.$el);
                        expect($button.length).toBe(0);
                    });
                });
                
                it("should undo marking an extension for update", function () {
                    var id = "mock-extension-3",
                        filename = "/path/to/downloaded/file.zip";
                    mockLoadExtensions(["user/" + id]);
                    setupViewWithMockData(ExtensionManagerViewModel.SOURCE_INSTALLED);
                    runs(function () {
                        view.model.updateFromDownload({
                            name: id,
                            installationStatus: "NEEDS_UPDATE",
                            localPath: filename
                        });
                        spyOn(brackets.fs, "unlink");
                        var $undoLink = $("a.undo-update[data-extension-id=" + id + "]", view.$el);
                        $undoLink.click();
                        expect(view.model.isMarkedForUpdate(id)).toBe(false);
                        expect(brackets.fs.unlink).toHaveBeenCalledWith(filename, jasmine.any(Function));
                        var $button = $("button.remove[data-extension-id=" + id + "]", view.$el);
                        expect($button.length).toBe(1);
                    });
                });
            });
        });
    });
});