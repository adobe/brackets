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

var _setupComplete = false,
    builtInServices;

function convertArgumentsToArray(a, functionConverter) {
    var args = [];
    var i;
    for (i = 0; i < a.length; i++) {
        var obj = a[i];
        if (functionConverter && typeof obj === "function") {
            obj = functionConverter(obj);
        }
        args.push(obj);
    }
    return args;
}

function ServiceRegistry(extension) {
    this.extension = extension;
    this._definitions = [];
    this._registries = [];
}

function _installData(current, data, functionLoader) {
    Object.keys(data).forEach(function (key) {
        if (key === "__inUseBy") {
            current[key] = data[key];
            return;
        } else if (key[0] === "_") {
            return;
        }
        var obj = data[key];
        if (obj.hasOwnProperty("__function")) {
            if (current !== data) {
                obj = functionLoader(obj);
                Object.defineProperty(current, key, {
                    get: function () {
                        currentRegistry = this;
                        return obj;
                    },
                    enumerable: true,
                    configurable: true
                });
            } else {
                current[key] = functionLoader(obj);
            }
        } else {
            if (current !== data) {
                Object.defineProperty(current, key, {
                    get: function () {
                        currentRegistry = this;
                        return obj;
                    },
                    enumerable: true,
                    configurable: true
                });
            } else {
                current[key] = obj;
            }
            // the current parameter is really there just as a hack for the additions to ServiceRegistry.prototype
            _installData(obj, obj, functionLoader);
        }
    });
}


function _createListRegistry() {
    var registered = [];
    var register = function (obj) {
        this.registry._registries.push(this.name);
        registered.push({
            extension: this.extension,
            obj: obj
        });
    };
    
    register.getAll = function () {
        return registered.map(function (item) {
            return item.obj;
        });
    };
    
    register.remove = function (extension) {
        registered = registered.filter(function (item) {
            return item.extension !== extension;
        });
    };
    return register;
}

var registries = {};

function getServiceRegistry(name) {
    if (registries.hasOwnProperty(name)) {
        return registries[name];
    }
    var services = new ServiceRegistry(name);
    registries[name] = services;
    return services;
}

function _addObjectFromRemote(extension, name, registryID) {
    var services = getServiceRegistry(extension);
    if (services._registryID !== registryID) {
        getServiceRegistry(extension).addObject(name, true);
    }
}

function _addFunctionFromRemote(extension, name, options, registryID) {
    var services = getServiceRegistry(extension);
    if (services._registryID !== registryID) {
        console.log("AFFR", extension, name, registryID);
        services.addFunction(name, services._remoteFunctionWrappers[registryID](name, options),
            options, true);
    }
}

function ServiceRegistryBase() { }

ServiceRegistryBase.prototype = {
    addObject: function (name, _noNotification) {
        this._definitions.push(name);
        var segments = name.split(".");
        var initial = segments.shift();
        var current;
        var proto = Object.getPrototypeOf(this);
        if (!proto.hasOwnProperty(initial)) {
            var val = {
                __inUseBy: {}
            };
            Object.defineProperty(proto, initial, {
                get: function () {
                    currentRegistry = this;
                    return val;
                },
                configurable: true,
                enumerable: true
            });
            current = val;
        } else {
            current = proto[initial];
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
        
        if (_setupComplete && !_noNotification) {
            this.channels.brackets.serviceRegistry.addObject.publish(this.extension, name, this._registryID);
        }
        return current;
    },
    addFunction: function (name, fn, options, _noNotification) {
        options = options || {};
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
            var simplified = {
                "__function": name,
                options: options
            };
            if (options.runLocal) {
                var functionStr = fn.toString(),
                    argsStart   = functionStr.indexOf("(") + 1,
                    argsEnd     = functionStr.indexOf(")"),
                    bodyStart   = functionStr.indexOf("{") + 1,
                    bodyEnd     = functionStr.lastIndexOf("}");
                simplified.args = functionStr.substring(argsStart, argsEnd);
                simplified.body = functionStr.substring(bodyStart, bodyEnd);
            }
            return simplified;
        };
        
        if (dot > -1) {
            var fnName = name.substring(dot + 1);
            var containerName = name.substring(0, dot);
            var container = this.addObject(containerName, true);
            container[fnName] = wrapped;
        } else {
            Object.defineProperty(Object.getPrototypeOf(this), name, {
                get: function () {
                    currentRegistry = this;
                    return wrapped;
                },
                configurable: true,
                enumerable: true
            });
        }
        if (_setupComplete && !_noNotification) {
            this.channels.brackets.serviceRegistry.addFunction.publish(this.extension, name, options, this._registryID);
        }
        return wrapped;
    },
    addRegistry: function (name, options) {
        var listRegistry = _createListRegistry();
        var wrapped = this.addFunction(name, listRegistry);
        wrapped.getAll = listRegistry.getAll;
        wrapped.remove = listRegistry.remove;
        return wrapped;
    },
    _removeDefinition: function (extension, name) {
        name = "ServiceRegistry." + name;
        var segments = name.split(".");
        var proto = Object.getPrototypeOf(this);
        var objects = [proto];
        var current = proto;
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
    },
    removeAll: function () {
        var extension = this.extension;
        this._definitions.forEach(function (name) {
            this._removeDefinition(extension, name);
        }.bind(this));
        this._registries.forEach(function (name) {
            var r = this.getObject(name);
            if (r) {
                r.remove(extension);
            }
        }.bind(this));
        this._definitions = [];
        this._registries = [];
    },
    getObject: function (name) {
        var segments = name.split(".");
        var current = this;
        var i;
        for (i = 0; i < segments.length; i++) {
            current = current[segments[i]];
            if (current === undefined) {
                return current;
            }
        }
        return current;
    },
    _addCallback: function (fn) {
        var proto = Object.getPrototypeOf(this);
        var callbackID = proto._nextCallbackID++;
        return this.addFunction("_callbacks." + callbackID, fn, {}, true);
    },
    _initialize: function (registryID, data, functionLoader, masterRemoteWrapper) {
        var proto = Object.getPrototypeOf(this);
        Object.keys(proto).forEach(function (key) {
            delete proto[key];
        });
        _installData(proto, data, functionLoader.bind(this));
        proto._remoteFunctionWrappers = {
            0: masterRemoteWrapper
        };
        proto._registryID = registryID;
        proto._nextCallbackID = 0;
        builtInServices.channels.brackets.serviceRegistry.addObject.subscribe(_addObjectFromRemote);
        builtInServices.channels.brackets.serviceRegistry.addFunction.subscribe(_addFunctionFromRemote);
        _setupComplete = true;
    },
    _initializeMaster: function () {
        var proto = Object.getPrototypeOf(this);
        proto._registryID = 0;
        proto._nextRegistryID = 1;
        proto._nextCallbackID = 0;
        proto._remoteFunctionWrappers = {};
        proto._getRemoteRegistryConfig = function (remoteFunctionWrapper) {
            var proto = Object.getPrototypeOf(this);
            var remoteRegistryID = proto._nextRegistryID++;
            proto._remoteFunctionWrappers[remoteRegistryID] = remoteFunctionWrapper;
            var data = JSON.stringify(proto, function (key, value) {
                if (key[0] === "_" && key[1] !== "_") {
                    return;
                } else {
                    return value;
                }
            });
            return {
                data: JSON.stringify(proto),
                registryID: remoteRegistryID
            };
        };
        
        builtInServices.addFunction("log", function (message) {
            console.log(message);
        });
        
        builtInServices.channels.add("brackets.serviceRegistry.addObject");
        builtInServices.channels.add("brackets.serviceRegistry.addFunction");
        builtInServices.channels.brackets.serviceRegistry.addObject.subscribe(_addObjectFromRemote);
        builtInServices.channels.brackets.serviceRegistry.addFunction.subscribe(_addFunctionFromRemote);
        _setupComplete = true;
    }
};

ServiceRegistry.prototype = new ServiceRegistryBase();

builtInServices = new ServiceRegistry("brackets");

builtInServices.addFunction("channels.add", function (name, options) {
    var registry = this.registry;
    registry.addObject("channels." + name);
    registry.addRegistry("channels." + name + ".subscribe");
    
    registry.addFunction("channels." + name + ".publish", function () {
        var args = arguments;
        this.registry.getObject("channels." + name + ".subscribe").getAll().forEach(function (fn) {
            fn.apply(this, args);
        }.bind(this));
    });
}, {}, true);

exports._getCurrentRegistry = function () {
    return currentRegistry;
};

exports._brackets = builtInServices;
exports.ServiceRegistry = ServiceRegistry;
exports._ServiceRegistryBase = ServiceRegistryBase;
exports._addObjectFromRemote = _addObjectFromRemote;
exports._addFunctionFromRemote = _addFunctionFromRemote;
exports.getServiceRegistry = getServiceRegistry;
exports.convertArgumentsToArray = convertArgumentsToArray;