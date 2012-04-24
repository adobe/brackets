/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var PreferencesManager      = require("preferences/PreferencesManager"),
        PreferenceStorage       = require("preferences/PreferenceStorage").PreferenceStorage,
        SpecRunnerUtils         = require("./SpecRunnerUtils.js");

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
            var store = new PreferenceStorage(CLIENT_ID, {});
            var error = null;
            
            try {
                // function data is not valid JSON
                store.setValue("foo", function () {});
            } catch (err1) {
                error = err1;
            }
            
            expect(error).not.toBeNull();
            expect(error.message).toBe("Value 'function () {}' for key 'foo' must be a valid JSON value");
            
            try {
                // number key is not valid JSON
                store.setValue(42, "bar");
            } catch (err2) {
                error = err2;
            }
            
            expect(error).not.toBeNull();
            expect(error.message).toBe("Preference key '42' must be a string");
        });
        
    });

    describe("PreferencesManager", function () {

        beforeEach(function () {
            // SpecRunner.js already initializes the unit test instance of
            // PreferencesManager to use the unit test key. All we need to do
            // here is reset to clear callbacks and in-memory preferences.
            PreferencesManager._reset();
        });

        it("should use default preferences", function () {
            var store = PreferencesManager.getPreferenceStorage(CLIENT_ID, {foo: "default"});
            expect(store.getValue("foo")).toEqual("default");
        });
    });
});