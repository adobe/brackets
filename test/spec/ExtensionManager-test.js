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
    
    var ExtensionManager       = require("extensibility/ExtensionManager"),
        ExtensionManagerView   = require("extensibility/ExtensionManagerView").ExtensionManagerView,
        InstallExtensionDialog = require("extensibility/InstallExtensionDialog"),
        ExtensionLoader        = require("utils/ExtensionLoader"),
        NativeFileSystem       = require("file/NativeFileSystem").NativeFileSystem,
        NativeFileError        = require("file/NativeFileError"),
        SpecRunnerUtils        = require("spec/SpecRunnerUtils"),
        CollectionUtils        = require("utils/CollectionUtils"),
        NativeApp              = require("utils/NativeApp"),
        mockRegistryText       = require("text!spec/ExtensionManager-test-files/mockRegistry.json"),
        mockRegistry;
    
    describe("ExtensionManager", function () {
        var mockId, mockSettings;
        
        beforeEach(function () {
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
        });
        
        afterEach(function () {
            $.mockjaxClear(mockId);
            ExtensionManager._reset();
            $(ExtensionManager).off(".unit-test");
        });
        
        describe("ExtensionManager", function () {
            function mockLoadExtensions(names) {
                var numLoaded = 0, numStatusChanges = 0;
                runs(function () {
                    $(ExtensionManager).on("statusChange.unit-test", function () {
                        numStatusChanges++;
                    });
                    var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                    names = names || ["mock-extension-1", "mock-extension-2", "mock-legacy-extension"];
                    names.forEach(function (name) {
                        numLoaded++;
                        $(ExtensionLoader).triggerHandler("load", mockPath + "/" + name);
                    });
                });
                
                // Make sure the ExtensionManager has finished reading all the package.jsons before continuing.
                waitsFor(function () { return numStatusChanges === numLoaded; }, "ExtensionManager status changes");
            }
            
            it("should download the extension list from the registry", function () {
                var registry;
                runs(function () {
                    ExtensionManager.getRegistry()
                        .done(function (result) {
                            registry = result;
                        });
                });
                waitsFor(function () { return registry; }, "fetching registry");
    
                runs(function () {
                    expect(mockSettings.response).toHaveBeenCalled();
                    expect(registry).toEqual(mockRegistry);
                });
            });
    
            it("should return the registry but not re-download it if called twice without forceDownload", function () {
                var registry;
                runs(function () {
                    waitsForDone(ExtensionManager.getRegistry(), "fetching registry");
                });
    
                runs(function () {
                    expect(mockSettings.response.callCount).toBe(1);
                    ExtensionManager.getRegistry()
                        .done(function (result) {
                            registry = result;
                        });
                });
                waitsFor(function () { return registry; }, "re-getting registry");
                
                runs(function () {
                    expect(mockSettings.response.callCount).toBe(1);
                    expect(registry).toEqual(mockRegistry);
                });
            });
    
            it("should re-download the registry if called twice with forceDownload", function () {
                var registry;
                runs(function () {
                    waitsForDone(ExtensionManager.getRegistry(), "fetching registry");
                });
    
                runs(function () {
                    expect(mockSettings.response.callCount).toBe(1);
                    ExtensionManager.getRegistry(true)
                        .done(function (result) {
                            registry = result;
                        });
                });
                waitsFor(function () { return registry; }, "re-getting registry");
                
                runs(function () {
                    expect(mockSettings.response.callCount).toBe(2);
                    expect(registry).toEqual(mockRegistry);
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
                    ExtensionManager.getRegistry(true)
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
                    ExtensionManager.getRegistry()
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
                mockLoadExtensions();
                runs(function () {
                    Object.keys(mockRegistry).forEach(function (extId) {
                        var status = (extId === "mock-extension-1" || extId === "mock-extension-2") ?
                                ExtensionManager.ENABLED : ExtensionManager.NOT_INSTALLED;
                        expect(ExtensionManager.getStatus(extId)).toBe(status);
                    });
                });
            });
            
            it("should raise a statusChange event when an extension is loaded", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    $(ExtensionManager).on("statusChange.unit-test", spy);
                    mockLoadExtensions(["mock-extension-1"]);
                });
                runs(function () {
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), "mock-extension-1", ExtensionManager.ENABLED);
                });
            });
            
            it("should raise a statusChange event when a legacy extension is loaded, with its path as the id", function () {
                var spy = jasmine.createSpy();
                runs(function () {
                    $(ExtensionManager).on("statusChange.unit-test", spy);
                    mockLoadExtensions(["mock-legacy-extension"]);
                });
                runs(function () {
                    var mockPath = SpecRunnerUtils.getTestPath("/spec/ExtensionManager-test-files");
                    expect(spy).toHaveBeenCalledWith(jasmine.any(Object), mockPath + "/mock-legacy-extension", ExtensionManager.ENABLED);
                });
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
        });
        
        describe("ExtensionManagerView", function () {
            var testWindow, view, fakeLoadDeferred, installerDeferred, mockInstalledExtensions;
            
            // Sets up a real registry (with mock data).
            function setupRegistryWithMockLoad() {
                var rendered = false;
                runs(function () {
                    view = new ExtensionManagerView();
                    $(view).on("render", function () {
                        rendered = true;
                    });
                });
                waitsFor(function () { return rendered; }, "view rendering");
            }
            
            // Sets up a mock registry (with no data).
            function setupRegistryWithNoLoad() {
                fakeLoadDeferred = new $.Deferred();
                spyOn(ExtensionManager, "getRegistry").andCallFake(function () {
                    return fakeLoadDeferred.promise();
                });
                view = new ExtensionManagerView();
            }
            
            function mockInstallExtension(url) {
                // Pretend that the extension was installed.
                var id = url.match(/repository\.brackets\.io\/([^\/]+)/)[1];
                mockInstalledExtensions[id] = true;
                $(ExtensionManager).triggerHandler("statusChange", [id, ExtensionManager.ENABLED]);
            }
            
            beforeEach(function () {
                this.addMatchers({
                    toHaveText: function (expected) {
                        var notText = this.isNot ? " not" : "";
                        this.message = function () {
                            return "Expected view" + notText + " to contain text " + expected;
                        };
                        return SpecRunnerUtils.findDOMText(this.actual.$el, expected);
                    }
                });
                installerDeferred = new $.Deferred();
                mockInstalledExtensions = {};
                spyOn(InstallExtensionDialog, "installUsingDialog").andCallFake(function (url) {
                    mockInstallExtension(url);
                    return installerDeferred.promise();
                });
                spyOn(ExtensionManager, "getStatus").andCallFake(function (id) {
                    return (mockInstalledExtensions[id] ? ExtensionManager.ENABLED : ExtensionManager.NOT_INSTALLED);
                });
            });
                
            
            afterEach(function () {
                view = null;
            });
            
            it("should populate itself with registry entries and display their fields when created", function () {
                setupRegistryWithMockLoad();
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
                setupRegistryWithMockLoad();
                runs(function () {
                    CollectionUtils.forEach(mockRegistry, function (item) {
                        var $button = $("button.install[data-extension-id=" + item.metadata.name + "]", view.$el);
                        expect($button.length).toBe(1);
                    });
                });
            });
            
            // TODO: reinstate actual repository URLs
//            it("should show disabled install buttons for items that are already installed", function () {
//                runs(function () {
//                    mockInstallExtension("[repository-url]/mock-extension-1/mock-extension-1-1.0.0.zip");
//                    mockInstallExtension("[repository-url]/mock-extension-2/mock-extension-2-1.0.0.zip");
//                    setupRegistryWithMockLoad();
//                });
//                runs(function () {
//                    CollectionUtils.forEach(mockRegistry, function (item) {
//                        var $button = $("button.install[data-extension-id=" + item.metadata.name + "]", view.$el);
//                        if (item.metadata.name === "mock-extension-1" || item.metadata.name === "mock-extension-2") {
//                            expect($button.attr("disabled")).toBeTruthy();
//                        } else {
//                            expect($button.attr("disabled")).toBeFalsy();
//                        }
//                    });
//                });
//            });

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
                    setupRegistryWithMockLoad();
                });
                runs(function () {
                    var $button = $("button.install[data-extension-id=incompatible-extension]", view.$el);
                    expect($button.attr("disabled")).toBeTruthy();
                });
            });
            
            // TODO: reinstate repository URL
//            it("should bring up the install dialog and install an item when install button is clicked", function () {
//                runs(function () {
//                    mockRegistry = {
//                        "basic-valid-extension": {
//                            "metadata": {
//                                "name": "basic-valid-extension",
//                                "title": "Basic Valid Extension",
//                                "version": "1.0.0"
//                            },
//                            "owner": "github:someuser",
//                            "versions": [
//                                {
//                                    "version": "1.0.0",
//                                    "published": "2013-04-10T18:28:20.530Z"
//                                }
//                            ]
//                        }
//                    };
//                    setupRegistryWithMockLoad();
//                });
//                runs(function () {
//                    var $button = $("button.install[data-extension-id=basic-valid-extension]", view.$el);
//                    expect($button.length).toBe(1);
//                    $button.click();
//                    expect(InstallExtensionDialog.installUsingDialog)
//                        .toHaveBeenCalledWith("[repository_url]/basic-valid-extension/basic-valid-extension-1.0.0.zip");
//                });
//            });
            
            it("should disable the install button for an item immediately after installing it", function () {
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
                    setupRegistryWithMockLoad();
                });
                runs(function () {
                    var $button = $("button.install[data-extension-id=basic-valid-extension]", view.$el);
                    $button.click();
                    installerDeferred.resolve();
                    // Have to get the button again since the view may have created a new button when re-rendering.
                    $button = $("button.install[data-extension-id=basic-valid-extension]", view.$el);
                    expect($button.attr("disabled")).toBeTruthy();
                });
               
            });
                        
            it("should show the spinner before the registry appears successfully and hide it after", function () {
                setupRegistryWithNoLoad();
                expect($(".spinner", view.$el).length).toBe(1);
                fakeLoadDeferred.resolve({});
                expect($(".spinner", view.$el).length).toBe(0);
            });
            
            it("should show an error and remove the spinner if there is an error fetching the registry", function () {
                setupRegistryWithNoLoad();
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
                    setupRegistryWithMockLoad();
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
    });
});