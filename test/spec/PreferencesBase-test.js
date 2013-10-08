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
/*global $, define, describe, it, expect, beforeEach, afterEach, waitsFor, waitsForDone, runs, beforeFirst, afterLast, spyOn, brackets */
/*unittests: Preferences Base*/

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var PreferencesBase         = require("preferences/PreferencesBase"),
        NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils               = require("file/FileUtils"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils");
    
    var testPath = SpecRunnerUtils.getTestPath("/spec/PreferencesBase-test-files");

    describe("Preferences Base", function () {
        describe("Memory Storage", function () {
            it("should support get and save operations", function () {
                var sampleData = {
                    foo: 1,
                    bar: 2
                };
                
                var storage = new PreferencesBase.MemoryStorage(sampleData);
                
                // This storage is synchronous
                storage.load().then(function (data) {
                    expect(data).toEqual(sampleData);
                });
                
                storage.save({
                    foo: 3
                }).then(function () {
                    expect(storage.data).not.toEqual(sampleData);
                    expect(storage.data.foo).toEqual(3);
                    expect(storage.data.bar).not.toBeDefined();
                });
            });
        });
        
        describe("Preferences Manager", function () {
            it("should yield an error if a preference is redefined", function () {
                var pm = new PreferencesBase.PreferencesManager();
                pm.definePreference("foo.bar", "string");
                try {
                    pm.definePreference("foo.bar", "string");
                    expect("We should have gotten an exception").toEqual("but we didn't");
                } catch (e) {
                }
            });
            
            it("should find the default values", function () {
                var pm = new PreferencesBase.PreferencesManager();
                pm.definePreference("foo.bar", "number", 0);
                expect(pm.getValue("nonexistent")).not.toBeDefined();
                expect(pm.getValue("foo.bar")).toBe(0);
            });
            
            it("should produce an error for setValue on undefined scope", function () {
                var pm = new PreferencesBase.PreferencesManager();
                try {
                    pm.setValue("nonscope", "foo", false);
                    expect("Should have gotten an error for nonexistent scope").toBe("but didn't");
                } catch (e) {
                    expect(e.toString().indexOf("scope")).toBeGreaterThan(-1);
                }
            });
            
            it("supports nested scopes", function () {
                var pm = new PreferencesBase.PreferencesManager();
                pm.definePreference("useTabChar", "boolean", false);
                pm.definePreference("tabSize", "number", 4);
                pm.definePreference("spaceUnits", "number", 4);
                var userScope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage());
                var projectScope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage());
                pm.addScope("user", userScope, "default");
                pm.addScope("project", projectScope, "user");
                
                expect(pm.getValue("spaceUnits")).toEqual(4);
                
                pm.setValue("user", "useTabChar", true);
                pm.setValue("user", "tabSize", 8);
                pm.setValue("user", "spaceUnits", 8);
                pm.setValue("project", "spaceUnits", 2);
                
                expect(pm.getValue("spaceUnits")).toBe(2);
                expect(pm.getValue("useTabChar")).toBe(true);
                expect(pm.getValue("tabSize")).toBe(8);
                
                // Test the default for the addBefore argument.
                pm = new PreferencesBase.PreferencesManager();
                pm.definePreference("spaceUnits", "number", 4);
                
                pm.addScope("user", userScope);
                pm.addScope("project", projectScope);
                expect(pm.getValue("spaceUnits")).toBe(2);
                pm.removeScope("project");
                expect(pm.getValue("spaceUnits")).toBe(8);
            });
            
            it("handles asynchronously loaded scopes", function () {
                // This test will mark storage1's prefs as higher precedence
                // than storage2's prefs, but it will pretend to load storage1's
                // prefs after storage2's to trigger a possible race.
                
                // Adding scopes is something that is not likely to happen much
                // in extensions... the race is much more possible within
                // Brackets itself depending on when the preferences load.
                // Within Brackets itself, the order of scopes is very well defined.
                var storage1 = new PreferencesBase.MemoryStorage({
                    testKey: 1
                });
                
                var deferred1 = $.Deferred();
                storage1.load = function () {
                    return deferred1;
                };
                
                var storage2 = new PreferencesBase.MemoryStorage({
                    testKey: 2
                });
                
                var deferred2 = $.Deferred();
                storage2.load = function () {
                    return deferred2;
                };
                
                var pm = new PreferencesBase.PreferencesManager();
                pm.definePreference("testKey", "number", 0);
                pm.addScope("storage1", new PreferencesBase.Scope(storage1), "storage2");
                pm.addScope("storage2", new PreferencesBase.Scope(storage2), "default");
                
                expect(pm.getValue("testKey")).toBe(0);
                
                deferred1.resolve(storage1.data);
                expect(pm.getValue("testKey")).toBe(0);
                
                deferred2.resolve(storage2.data);
                expect(pm.getValue("testKey")).toBe(1);
            });
            
            it("supports layers over the nested scopes", function () {
                var pm = new PreferencesBase.PreferencesManager();
                var userScope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage({
                    "spaceUnits": 4,
                    "language": {
                        "html": {
                            "spaceUnits": 2
                        },
                        "css": {
                            "spaceUnits": 8
                        }
                    }
                }));
                pm.addScope("user", userScope);
                var layer = new PreferencesBase.LanguageLayer();
                pm.addLayer("language", layer);
                
                expect(pm.getValue("spaceUnits")).toBe(4);
                
                layer.setLanguage("html");
                expect(pm.getValue("spaceUnits")).toBe(2);
                
                layer.setLanguage("css");
                expect(pm.getValue("spaceUnits")).toBe(8);
                
                layer.setLanguage("python");
                expect(pm.getValue("spaceUnits")).toBe(4);
            });
        });
        
        describe("File Storage", function () {
            var settingsFile = testPath + "/brackets.settings.json",
                newSettingsFile = testPath + "/new.settings.json",
                filestorage,
                originalText;
            
            beforeFirst(function () {
                var deferred = $.Deferred();
                NativeFileSystem.resolveNativeFileSystemPath(settingsFile, function (entry) {
                    FileUtils.readAsText(entry)
                        .then(function (text) {
                            originalText = text;
                            deferred.resolve();
                        })
                        .fail(function (error) {
                            deferred.reject(error);
                        });
                }, function (error) {
                    deferred.reject(error);
                });
                waitsForDone(deferred.promise());
            });
            
            beforeEach(function () {
                filestorage = new PreferencesBase.FileStorage(settingsFile);
            });
            
            afterEach(function () {
                var deferred = $.Deferred();
                NativeFileSystem.resolveNativeFileSystemPath(settingsFile, function (entry) {
                    FileUtils.writeText(entry, originalText)
                        .then(function () {
                            deferred.resolve();
                        })
                        .fail(function (error) {
                            deferred.reject(error);
                        });
                }, function (error) {
                    deferred.reject(error);
                });
                waitsForDone(deferred.promise());
                runs(function () {
                    brackets.fs.unlink(newSettingsFile);
                });
            });
            
            it("can load preferences from disk", function () {
                var filestorage = new PreferencesBase.FileStorage(testPath + "/brackets.settings.json");
                var pm = new PreferencesBase.PreferencesManager();
                var projectScope = new PreferencesBase.Scope(filestorage);
                waitsForDone(pm.addScope("project", projectScope));
                runs(function () {
                    expect(pm.getValue("spaceUnits")).toBe(92);
                    
                    var layer = new PreferencesBase.LanguageLayer();
                    layer.setLanguage("go");
                    pm.addLayer("language", layer);
                    expect(pm.getValue("spaceUnits")).toBe(27);
                });
            });
            
            it("can save preferences", function () {
                var filestorage = new PreferencesBase.FileStorage(testPath + "/brackets.settings.json");
                var pm = new PreferencesBase.PreferencesManager();
                var projectScope = new PreferencesBase.Scope(filestorage);
                waitsForDone(pm.addScope("project", projectScope));
                runs(function () {
                    var memstorage = new PreferencesBase.MemoryStorage();
                    pm.addScope("session", new PreferencesBase.Scope(memstorage));
                    pm.setValue("session", "unicorn-filled", true);
                    pm.setValue("project", "unicorn-filled", false);
                    pm.save();
                    expect(memstorage.data["unicorn-filled"]).toBe(true);
                });
            });
            
            it("can create a new pref file", function () {
                var filestorage = new PreferencesBase.FileStorage(newSettingsFile, true);
                var pm = new PreferencesBase.PreferencesManager();
                var newScope = new PreferencesBase.Scope(filestorage);
                waitsForDone(pm.addScope("new", newScope), "adding scope");
                runs(function () {
                    expect(pm._scopes["new"]).toBeDefined();
                    expect(pm._scopeOrder.indexOf("new")).toBeGreaterThan(-1);
                    pm.setValue("new", "unicorn-filled", true);
                    expect(pm.getValue("unicorn-filled")).toBe(true);
                    
                    waitsForDone(pm.save(), "saving prefs");
                    
                    var deferred = $.Deferred();
                    runs(function () {
                        brackets.fs.stat(newSettingsFile, function (err, stats) {
                            if (err) {
                                deferred.reject();
                            } else {
                                deferred.resolve();
                            }
                        });
                    });
                    
                    waitsForDone(deferred.promise(), "checking file");
                });
                
            });
        });
    });
});
