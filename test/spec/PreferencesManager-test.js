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

/*global describe, it, expect, beforeEach, runs, beforeFirst, afterLast, spyOn, waitsForDone */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var PreferenceStorage       = require("preferences/PreferenceStorage").PreferenceStorage,
        SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        testPath                = SpecRunnerUtils.getTestPath("/spec/PreferencesBase-test-files"),
        nonProjectFile          = SpecRunnerUtils.getTestPath("/spec/PreferencesBase-test.js"),
        PreferencesManager,
        testWindow;

    var CLIENT_ID = "PreferencesManager-test";

    describe("PreferenceStorage", function () {

        it("should read initial preferences from JSON", function () {
            var store = new PreferenceStorage(CLIENT_ID, {"foo": "bar", hello: "world"});
            expect(store.getValue("foo")).toBe("bar");
            expect(store.getValue("hello")).toBe("world");
        });

        it("should store values as JSON", function () {
            var json = {};
            var store = new PreferenceStorage(CLIENT_ID, json);
            store.setValue("foo", 42);

            expect(json.foo).toEqual(42);
            expect(store.getValue("foo")).toBe(42);
        });

        it("should output preferences as JSON", function () {
            var store = new PreferenceStorage(CLIENT_ID, {});
            store.setValue("foo", 42);
            var json = store.getAllValues();

            expect(json.foo).toEqual(42);
        });

        it("should remove values", function () {
            var store = new PreferenceStorage(CLIENT_ID, {"foo": "bar"});
            expect(store.getValue("foo")).toBe("bar");

            store.remove("foo");
            expect(store.getValue("foo")).toBe(undefined);
        });

        it("should use setAllValues to append multiple new name/value pairs", function () {
            var initial = {"foo": "bar"};
            var store = new PreferenceStorage(CLIENT_ID, initial);

            // append
            store.setAllValues({"hello": ["world", "!"], "goodbye": 42}, true);
            expect(store.getValue("foo")).toBe("bar");
            expect(store.getValue("hello")).toEqual(["world", "!"]);
            expect(store.getValue("goodbye")).toBe(42);

            // overwrite
            store.setAllValues({"winning": false}, false);
            expect(store.getValue("foo")).toBe(undefined);
            expect(store.getValue("hello")).toBe(undefined);
            expect(store.getValue("goodbye")).toBe(undefined);
            expect(store.getValue("winning")).toBe(false);
        });

        it("should throw errors for invalid values", function () {
            var store = new PreferenceStorage(CLIENT_ID, {"foo": 42});

            expect(store.getValue("foo")).toBe(42);
            // function data is not valid JSON
            store.setValue("foo", function () {});
            expect(store.getValue("foo")).toBe(42);

            // number key is not valid JSON
            store.setValue(42, "bar");
            expect(store.getValue(42)).toBe(undefined);
        });

    });

    describe("PreferencesManager", function () {
        this.category = "integration";

        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                PreferencesManager = testWindow.brackets.test.PreferencesManager;
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterLast(function () {
            PreferencesManager = null;
            SpecRunnerUtils.closeTestWindow();
        });

        beforeEach(function () {
            // SpecRunner.js already initializes the unit test instance of
            // PreferencesManager to use the unit test key. All we need to do
            // here is reset to clear callbacks and in-memory preferences.
            PreferencesManager._reset();
        });

        it("should find preferences in the project", function () {
            var projectWithoutSettings = SpecRunnerUtils.getTestPath("/spec/WorkingSetView-test-files"),
                FileViewController = testWindow.brackets.test.FileViewController;
            waitsForDone(SpecRunnerUtils.openProjectFiles(".brackets.json"));

            runs(function () {
                expect(PreferencesManager.get("spaceUnits")).toBe(9);
                waitsForDone(FileViewController.openAndSelectDocument(nonProjectFile,
                             FileViewController.WORKING_SET_VIEW));

            });

            runs(function () {
                expect(PreferencesManager.get("spaceUnits")).not.toBe(9);

                // Changing projects will force a change in the project scope.
                SpecRunnerUtils.loadProjectInTestWindow(projectWithoutSettings);
            });
            runs(function () {
                waitsForDone(SpecRunnerUtils.openProjectFiles("file_one.js"));
            });
            runs(function () {
                expect(PreferencesManager.get("spaceUnits")).not.toBe(9);
            });
        });


        // Old tests follow
        it("should use default preferences", function () {
            var store = PreferencesManager.getPreferenceStorage(CLIENT_ID, {foo: "default"});
            expect(store.getValue("foo")).toEqual("default");
        });

        describe("Create clientID for preference store", function () {
            it("should return clientID for module that exists in extension directories", function () {
                spyOn(PreferencesManager, "_getExtensionPaths").andCallFake(function () {
                    return ['/local/Extension/Folder/Extensions/',
                            '/User/test/Library/Application Support/Brackets/extensions/user/',
                            'c:/Program Files (x86)/Brackets/wwww/extensions/default/'];
                });

                var module = {id: 'utils/Resizer', uri: '/local/Extension/Folder/Extensions/utils/Resizer.js'};

                var clientID = PreferencesManager.getClientID(module);
                expect(clientID).toBe("com.adobe.brackets.utils/Resizer.js");

                clientID = PreferencesManager.getClientID({id: 'main', uri: '/User/test/Library/Application Support/Brackets/extensions/user/HelloWorld/main.js'});
                expect(clientID).toBe("com.adobe.brackets.HelloWorld/main.js");

                clientID = PreferencesManager.getClientID({id: 'main', uri: 'c:/Program Files (x86)/Brackets/wwww/extensions/default/JSLint/main.js'});
                expect(clientID).toBe("com.adobe.brackets.JSLint/main.js");
            });

            it("should always return a clientID for a module that doesn't exist in extension directories", function () {
                spyOn(PreferencesManager, "_getExtensionPaths").andCallFake(function () {
                    return []; // no extension directories
                });

                var clientID = PreferencesManager.getClientID({id: 'main', uri: '/path/is/not/an/Extension/directory/someExtension/main.js'});
                expect(clientID).toBe("com.adobe.brackets.main");
            });
        });

    });
});
