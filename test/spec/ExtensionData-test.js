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
/*global define, describe, it, spyOn, expect, beforeEach, afterEach, waitsFor, runs, $, CodeMirror */

define(function (require, exports, module) {
    'use strict';
    var ExtensionData = require("extensibility/ExtensionData");
    
    describe("Extension Data", function () {
        var services, services2;
        
        beforeEach(function () {
            services = new ExtensionData.ServiceRegistry("test");
            services2 = new ExtensionData.ServiceRegistry("test2");
        });
        
        afterEach(function () {
            services.removeAll();
            services2.removeAll();
        });
        
        it("should allow object addition", function () {
            expect(services.foo).toBeUndefined();
            services.addObject("foo");
            expect(services.foo).toBeDefined();
            services.addObject("bar.baz");
            expect(services.bar.baz).toBeDefined();
            services.addObject("foo.bar");
            services.addObject("foo.baz");
            expect(services.foo.bar).toBeDefined();
            expect(services.foo.baz).toBeDefined();
            
            expect(services2.foo).toBeDefined();
        });
        
        it("should allow function addition", function () {
            // this line makes sure that cleanup has been done after the last test
            expect(services.foo).toBeUndefined();
            
            var extension = "test";
            var called = false;
            services.addFunction("doFoo", function () {
                expect(this.extension).toEqual(extension);
                expect(this.name).toEqual("doFoo");
                called = true;
            });
            services.doFoo();
            expect(called).toBe(true);
            
            extension = "test2";
            services2.doFoo();
        });
        
        it("should allow nested function addition", function () {
            var extension = "test";
            var called = false;
            services.addFunction("nested.doFoo", function () {
                expect(this.extension).toEqual(extension);
                expect(this.name).toEqual("nested.doFoo");
                called = true;
            });
            services.nested.doFoo();
            expect(called).toBe(true);
            
            extension = "test2";
            services2.nested.doFoo();
        });
        
        it("should be able to remove added items", function () {
            var s = new ExtensionData.ServiceRegistry("newRegistry");
            s.addObject("newObject");
            expect(s.newObject).toBeDefined();
            s.removeAll();
            expect(s.newObject).toBeUndefined();
        });
        
        it("supports pubsub out of the box", function () {
            expect(services.channels).toBeDefined();
            services.channels.add("test.message");
            expect(services.channels.test.message).toBeDefined();
            
            var info = null;
            services2.channels.test.message.subscribe(function (msg) {
                info = msg;
            });
            
            services.channels.test.message.publish("hi");
            expect(info).toEqual("hi");
            
            info = null;
            services2.removeAll();
            expect(services2.channels.test.message.subscribers[0]).toBeUndefined();
            services.channels.test.message.publish("second message");
            expect(info).toBeNull();
        });
        
        it("allows the registry to be JSONified", function () {
            services.addFunction("foo", function () {
            });
            var result = JSON.stringify(ExtensionData.ServiceRegistry.prototype);
            var reparsed = JSON.parse(result);
            expect(reparsed.foo.__function).toEqual("foo");
        });
        
        it("should initialize the registry from JSON data", function () {
            services.addFunction("foo", function () { });
            var result = JSON.stringify(ExtensionData.ServiceRegistry.prototype);
            var reparsed = JSON.parse(result);
            delete ExtensionData.ServiceRegistry.prototype.foo;
            services._initialize(reparsed, function (obj) {
                return true;
            });
            expect(services.foo).toBeDefined();
            // test to make sure that addFunction still works as well
            services.addFunction("bar", function () { });
            expect(services.bar).toBeDefined();
        });
    });
});