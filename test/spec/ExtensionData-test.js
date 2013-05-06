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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, evil: true */
/*global define, describe, it, spyOn, expect, beforeEach, afterEach, waitsFor, runs, $, CodeMirror */

define(function (require, exports, module) {
    'use strict';
    var ExtensionData = require("extensibility/ExtensionData");
    
    describe("Extension Data", function () {
        describe("Simple", function () {
            var services, services2;
            
            beforeEach(function () {
                services = new ExtensionData.ServiceRegistry("test");
                if (services._registryID === undefined) {
                    services._initializeMaster();
                }
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
            
            it("provides the ability to register things", function () {
                services.addRegistry("brackets.users", {
                    type: "list"
                });
                services2.brackets.users("Smart Person");
                services2.brackets.users("Good-Looking Person");
                services2.brackets.users("Clever Person");
                var result = services.brackets.users.getAll();
                expect(result.length).toBe(3);
                
                services2.removeAll();
                result = services.brackets.users.getAll();
                expect(result.length).toBe(0);
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
                var subscribers = services.channels.test.message.subscribe.getAll();
                expect(subscribers.length).toBe(0);
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
        });
        
        describe("Remote", function () {
            var localServices, remoteServices, remoteFunctionCalled, preInitResult, callbackCalled;

            function TestServiceRegistry(extension) {
                this.extension = extension;
                this._definitions = [];
                this._registries = [];
            }
            
            function generateRemoteCallback(name) {
                return function () {
                    callbackCalled = name;
                    var args = ExtensionData.convertArgumentsToArray(arguments);
                    args = JSON.parse(JSON.stringify(args));
                    remoteServices.getObject(name).apply(ExtensionData._getCurrentRegistry(), args);
                };
            }
            
            function remoteFunctionDefiner(obj) {
                var remote = function () {
                    remoteFunctionCalled = obj.__function;
                    var registry = ExtensionData._getCurrentRegistry();
                    var args = ExtensionData.convertArgumentsToArray(arguments, registry._addCallback.bind(registry));
                    args = JSON.parse(JSON.stringify(args));
                    
                    var i;
                    for (i = 0; i < args.length; i++) {
                        if (args[i].hasOwnProperty("__function")) {
                            var name = args[i].__function;
                            args[i] = generateRemoteCallback(name);
                        }
                    }
                    localServices.getObject(obj.__function).apply(this, args);
                };
                return remote;
            }
            
            function remoteCallbackWrapper(obj) {
                return function () {
                    
                };
            }
            
            beforeEach(function () {
                remoteFunctionCalled = null;
                preInitResult = null;
                callbackCalled = null;
                localServices = new ExtensionData.ServiceRegistry("local");
                if (localServices._registryID === undefined) {
                    localServices._initializeMaster();
                }
                localServices.addFunction("preInitFunction", function (value) {
                    preInitResult = value;
                });
                TestServiceRegistry.prototype = new ExtensionData._ServiceRegistryBase();
                var remoteConfig = localServices._getRemoteRegistryConfig(remoteCallbackWrapper);
                remoteServices = new TestServiceRegistry("remote");
                var data = JSON.parse(remoteConfig.data);
                remoteServices._initialize(remoteConfig.registryID, data, remoteFunctionDefiner);
            });
            
            afterEach(function () {
                localServices.removeAll();
            });
            
            it("should be able to make a remote function call", function () {
                expect(remoteServices.preInitFunction).toBeDefined();
                remoteServices.preInitFunction("testvalue");
                expect(remoteFunctionCalled).toEqual("preInitFunction");
                expect(preInitResult).toEqual("testvalue");
            });
            
            it("should handle remote callbacks", function () {
                var givenID   = null,
                    givenName = null;
                    
                var addObjectListener = function (extension, name, registryID) {
                    givenID = registryID;
                    givenName = name;
                };
                var test = remoteServices.channels;
                expect(ExtensionData._getCurrentRegistry().extension).toEqual("remote");
                remoteServices.channels.brackets.serviceRegistry.addObject.subscribe(addObjectListener);
                localServices.addObject("foo.bar");
                expect(callbackCalled).toEqual("_callbacks." + (remoteServices._nextCallbackID - 1));
                expect(givenID).toEqual(localServices._registryID);
                expect(givenName).toEqual("foo.bar");
            });
        });
    });
});