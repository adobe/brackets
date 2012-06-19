/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var PreferencesManager      = require("preferences/PreferencesManager"),
        PreferenceStorage       = require("preferences/PreferenceStorage"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils");

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