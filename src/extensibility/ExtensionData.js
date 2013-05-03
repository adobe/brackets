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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global window*/

"use strict";

var currentRegistry = null;

var NODE = typeof window === "undefined";

function ServiceRegistry(extension) {
    this.extension = extension;
    this._definitions = [];
}

function _installData(current, data, functionLoader) {
    Object.keys(data).forEach(function (key) {
        if (key === "__inUseBy") {
            current[key] = data[key];
            return;
        }
        var obj = data[key];
        if (obj.hasOwnProperty("__function")) {
            current[key] = functionLoader(obj);
        } else {
            current[key] = obj;
            // the current parameter is really there just as a hack for the additions to ServiceRegistry.prototype
            _installData(obj, obj, functionLoader);
        }
    });
}

function _removeDefinition(extension, name) {
    name = "ServiceRegistry." + name;
    var segments = name.split(".");
    var objects = [ServiceRegistry.prototype];
    var current = ServiceRegistry.prototype;
    var i, segment;
    
    for (i = 1; i < segments.length; i++) {
        segment = segments[i];
        if (current.hasOwnProperty(segment)) {
            current = current[segment];
            objects.push(current);
        } else {
            break;
        }
    }
    
    // We may have already removed some items
    segments.splice(i, segments.length - i);
    
    for (i = segments.length - 1; i > 0; i--) {
        segment = segments[i];
        var container = objects[i - 1];
        var obj = container[segment];
        if (obj.__inUseBy) {
            delete obj.__inUseBy[extension];
            if (Object.keys(obj.__inUseBy).length === 0) {
                delete container[segment];
            }
        } else {
            delete container[segment];
        }
    }
}


function ServiceRegistryBase() { }

ServiceRegistryBase.prototype = {
    addObject: function (name) {
        this._definitions.push(name);
        var segments = name.split(".");
        var initial = segments.shift();
        var current;
        if (!ServiceRegistry.prototype.hasOwnProperty(initial)) {
            var val = {
                __inUseBy: {}
            };
            Object.defineProperty(ServiceRegistry.prototype, initial, {
                get: function () {
                    currentRegistry = this;
                    return val;
                },
                configurable: true,
                enumerable: true
            });
            current = val;
        } else {
            current = ServiceRegistry.prototype[initial];
        }
        
        var extension = this.extension;
        current.__inUseBy[extension] = true;
        
        segments.forEach(function (segment) {
            if (!current.hasOwnProperty(segment)) {
                current = current[segment] = {
                    __inUseBy: {}
                };
            } else {
                current = current[segment];
            }
            
            current.__inUseBy[extension] = true;
        });
        
        return current;
    },
    addFunction: function (name, fn, options) {
        this._definitions.push(name);
        var dot = name.lastIndexOf(".");
        var target;
        
        var wrapped = function () {
            return fn.apply({
                extension: currentRegistry.extension,
                registry: currentRegistry,
                name: name
            }, arguments);
        };
        wrapped.toJSON = function () {
            return {
                "__function": name,
                options: options
            };
        };
        
        if (dot > -1) {
            var fnName = name.substring(dot + 1);
            var containerName = name.substring(0, dot);
            var container = this.addObject(containerName);
            container[fnName] = wrapped;
        } else {
            Object.defineProperty(ServiceRegistry.prototype, name, {
                get: function () {
                    currentRegistry = this;
                    return wrapped;
                },
                configurable: true,
                enumerable: true
            });
        }
    },
    removeAll: function () {
        var extension = this.extension;
        this._definitions.forEach(function (name) {
            _removeDefinition(extension, name);
        });
        this._definitions = [];
    },
    _initialize: function (data, functionLoader) {
        Object.keys(ServiceRegistry.prototype).forEach(function (key) {
            delete ServiceRegistry.prototype[key];
        });
        _installData(ServiceRegistry.prototype, data, functionLoader);
    }
};

ServiceRegistry.prototype = new ServiceRegistryBase();

var builtInServices = new ServiceRegistry("brackets");

builtInServices.addFunction("channels.add", function (name, options) {
    var registry = this.registry;
    registry.addObject("channels." + name);
    var subscribers = registry.addObject("channels." + name + ".subscribers");
    var subscriberCount = 0;
    registry.addFunction("channels." + name + ".subscribe", function (fn) {
        this.registry.addFunction("channels." + name + ".subscribers." + subscriberCount++, fn);
    });
    
    registry.addFunction("channels." + name + ".publish", function (message) {
        Object.keys(subscribers).forEach(function (key) {
            if (key.substr(0, 1) === "_") {
                return;
            }
            subscribers[key](message);
        });
    });
});

builtInServices.addFunction("log", function (message) {
    console.log(message);
});

var registries = {};

function getServiceRegistry(name) {
    if (registries.hasOwnProperty(name)) {
        return registries[name];
    }
    var services = new ServiceRegistry(name);
    registries[name] = services;
    return services;
}

exports._brackets = builtInServices;
exports.ServiceRegistry = ServiceRegistry;
exports.getServiceRegistry = getServiceRegistry;
