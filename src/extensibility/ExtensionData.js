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
/*unittests: Extension Data*/

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

function ExtensionData(name) {
    this.name = name;
    this.definitions = [];
    this.registrations = [];
}

function createAPIObject(obj, meta) {
    return Object.create(obj, {
        __meta: {
            value: meta,
            enumerable: false,
            configurable: false
        },
        toJSON: {
            value: function () {
                return Object.getPrototypeOf(this);
            },
            enumerable: false,
            configurable: false
        }
    });
}

function RegistryBase() {
    Object.defineProperties(this, {
        __addChild: {
            value: function (name) {
                var child = this[name];
                if (child) {
                    return child;
                }
                child = Object.create(new RegistryBase());
                child.__inUseBy[this.__meta.extension.name] = true;
                Object.defineProperty(Object.getPrototypeOf(this), name, {
                    get: function () {
                        return createAPIObject(child, this.__meta);
                    },
                    enumerable: true,
                    configurable: true
                });
                return createAPIObject(child, this.__meta);
            },
            enumerable: false,
            configurable: false
        },
        
        // TODO this is only going to be needed on the master ultimately
        // The idea is to have removeAll on the master propagate to the
        // others as a list of keys to remove, rather than doing this
        // bookkeeping everywhere.
        __inUseBy: {
            value: {},
            enumerable: false,
            configurable: false
        }
    });
}

function ListRegistry(name, options) {
    var properties = {
        name: {
            value: name,
            enumerable: false,
            configurable: false
        },
        registered: {
            value: [],
            enumerable: false,
            configurable: true
        }
    };
    
    Object.defineProperties(this, properties);
}

Object.defineProperties(ListRegistry.prototype, {
    getAll: {
        value: function () {
            return this.registered.map(function (item) {
                return item.obj;
            });
        },
        enumerable: false,
        configurable: false
    },
    remove: {
        value: function (extension) {
            var registered = this.registered;
            var i;
            for (i = registered.length - 1; i >= 0; i--) {
                if (registered[i].extension === extension.name) {
                    registered.splice(i, 1);
                }
            }
        },
        enumerable: false,
        configurable: false
    }
});

var extensions = {};

var registryRoot = null;

function getServices(extension, rootObject) {
    if (!rootObject) {
        rootObject = registryRoot;
    }
    if (!extensions.hasOwnProperty(extension)) {
        extensions[extension] = new ExtensionData(extension);
    }
    var extensionData = extensions[extension];
    var meta = {
        extension: extensionData
    };
    var root = createAPIObject(rootObject, meta);
    meta.root = root;
    return root;
}

function getBuiltinServices(rootObject) {
    if (!rootObject) {
        rootObject = registryRoot;
    }
    
    var builtInServices = getServices("brackets", rootObject);

    builtInServices.addFunction("channels.add", function (name, options) {
        var root = this.__meta.root;
        root.addRegistry("channels." + name, {
            registerName: "subscribe"
        });
        
        root.addFunction("channels." + name + ".publish", function () {
            var args = arguments;
            root.getObject("channels." + name).getAll().forEach(function (fn) {
                fn.apply(this, args);
            }.bind(this));
        });
    }, {}, true);
    
    return builtInServices;
}

var addObjectFromRemote = function (extension, name, registryID) {
    if (this.__registryInfo.id !== registryID) {
        var services = getServices(extension, Object.getPrototypeOf(this));
        services.addObject(name, true);
    }
};

var addFunctionFromRemote = function (extension, name, options, registryID) {
    if (this.__registryInfo.id !== registryID) {
        var services = getServices(extension, Object.getPrototypeOf(this));
        services.addFunction(name, services.__registryInfo.remoteFunctionWrappers[registryID](name, options),
            options, true);
    }
};

function createRootObject() {
    var root = Object.create(new RegistryBase(), {
        addObject: {
            value: function (name, _noNotification) {
                this.__meta.extension.definitions.push(name);
                var segments = name.split(".");
                var current = this;
                segments.forEach(function (segment) {
                    current = current.__addChild(segment);
                }.bind(this));
                if (this.__registryInfo && !_noNotification) {
                    this.channels.brackets.serviceRegistry.addObject.publish(this.__meta.extension.name, name, this.__registryInfo.id);
                }
                return current;
            },
            enumerable: false,
            configurable: false
        },
        __getContainerAndObjectName: {
            value: function (name) {
                var container = this;
                var dot = name.lastIndexOf(".");
                var objectName = name;
                if (dot > -1) {
                    objectName = name.substring(dot + 1);
                    var containerName = name.substring(0, dot);
                    container = this.addObject(containerName, true);
                }
                return {
                    container: container,
                    name: objectName
                };
            },
            enumerable: false,
            configurable: false
        },
        addFunction: {
            value: function (name, fn, options, _noNotification) {
                options = options || {};
                this.__meta.extension.definitions.push(name);
                
                var info = this.__getContainerAndObjectName(name);
                Object.defineProperty(Object.getPrototypeOf(info.container), info.name, {
                    get: function () {
                        var wrapped = fn.bind(this);
                        wrapped.toJSON = function () {
                            return {
                                __function: name,
                                options: options
                            };
                        };
                        return wrapped;
                    },
                    configurable: true,
                    enumerable: !options.hidden
                });
                if (this.__registryInfo && !_noNotification) {
                    this.channels.brackets.serviceRegistry.addFunction.publish(this.__meta.extension.name, name, options, this.__registryInfo.id);
                }
                return info.container[info.name];
            },
            enumerable: false,
            configurable: false
        },
        __removeAll: {
            value: function () {
                var extension = this.__meta.extension;
                extension.definitions.forEach(function (name) {
                    this.__removeDefinition(extension, name);
                }.bind(this));
                extension.registrations.forEach(function (name) {
                    var r = this.getObject(name);
                    if (r) {
                        r.remove(extension);
                    }
                }.bind(this));
                extension.definitions = [];
                extension.registrations = [];
            },
            configurable: false,
            enumerable: false
        },
        __removeDefinition: {
            value: function (extension, name) {
                var extensionName = extension.name;
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
                        delete obj.__inUseBy[extensionName];
                        if (Object.keys(obj.__inUseBy).length === 0) {
                            delete container[segment];
                        }
                    } else {
                        delete container[segment];
                    }
                }
            },
            configurable: false,
            enumerable: false
        },
        getObject: {
            value: function (name) {
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
            enumerable: false,
            configurable: false
        },
        addRegistry: {
            value: function (name, options) {
                var info = this.__getContainerAndObjectName(name);
                var listRegistry = new ListRegistry(name, options);
                Object.defineProperty(Object.getPrototypeOf(info.container), info.name, {
                    get: function () {
                        return createAPIObject(listRegistry, this.__meta);
                    },
                    enumerable: true,
                    configurable: true
                });
                var registerName = options.registerName || "register";
                this.addFunction(name + "." + registerName, function (obj) {
                    this.__meta.extension.registrations.push(this.name);
                    this.registered.push({
                        extension: this.__meta.extension.name,
                        obj: obj
                    });
                });
            },
            enumerable: false,
            configurable: false
        },
        __initializeMaster: {
            value: function () {
                var registryInfo = {
                    id: 0,
                    nextRegistryID: 1,
                    nextCallbackID: 0,
                    remoteFunctionWrappers: {}
                };
                this.addFunction("log", function (message) {
                    console.log(message);
                });
                
                this.addObject("brackets.ready");
                this.channels.add("brackets.core.ready");
                this.channels.add("brackets.serviceRegistry.addObject");
                this.channels.add("brackets.serviceRegistry.addFunction");
                this.channels.brackets.serviceRegistry.addObject.subscribe(addObjectFromRemote.bind(this));
                this.channels.brackets.serviceRegistry.addFunction.subscribe(addFunctionFromRemote.bind(this));
                Object.defineProperties(Object.getPrototypeOf(this), {
                    __registryInfo: {
                        value: registryInfo,
                        enumerable: false,
                        configurable: false
                    },
                    __getRemoteRegistryConfig: {
                        value: function (remoteFunctionWrapper) {
                            var remoteRegistryID = this.__registryInfo.nextRegistryID++;
                            this.__registryInfo.remoteFunctionWrappers[remoteRegistryID] = remoteFunctionWrapper;
                            return {
                                data: JSON.stringify(this),
                                registryID: remoteRegistryID
                            };
                        },
                        enumerable: false,
                        configurable: false
                    }
                });
                
            },
            enumerable: false,
            configurable: false
        },
        __initialize: {
            value: function (registryID, data, masterRemoteWrapper) {
                var proto = Object.getPrototypeOf(this);
                Object.keys(proto).forEach(function (key) {
                    delete proto[key];
                });
                var registryInfo = {
                    id: registryID,
                    remoteFunctionWrappers: {
                        0: masterRemoteWrapper
                    },
                    nextCallbackID: 0
                };
                Object.defineProperties(Object.getPrototypeOf(this), {
                    __registryInfo: {
                        value: registryInfo,
                        enumerable: false,
                        configurable: false
                    }
                });
                
                var addData = function (name, data) {
                    if (data.__function) {
                        this.addFunction(name, masterRemoteWrapper.call(this, data.__function, data.__options), data.options, true);
                        return;
                    }
                    
                    var keys = Object.keys(data);
                    if (keys.length === 0) {
                        this.addObject(name, true);
                        return;
                    }
                    
                    keys.forEach(function (key) {
                        if (name) {
                            addData(name + "." + key, data[key]);
                        } else {
                            addData(key, data[key]);
                        }
                    }.bind(this));
                }.bind(this);
                
                addData("", data);
                this.channels.brackets.serviceRegistry.addObject.subscribe(addObjectFromRemote.bind(this));
                this.channels.brackets.serviceRegistry.addFunction.subscribe(addFunctionFromRemote.bind(this));
            },
            enumerable: false,
            configurable: false
        },
        __addCallback: {
            value: function (fn) {
                var callbackID = this.__registryInfo.nextCallbackID++;
                return this.addFunction("__callbacks." + callbackID, fn, {
                    hidden: true
                }, true);
            },
            enumerable: false,
            configurable: false
        }
    });
    return root;
}

function getHints(root) {
    if (!root) {
        root = registryRoot;
    }
    
    var hints = {
        "!name": "services",
        "ServiceRegistry": {
            "addObject": {
                "!type": "fn()"
            },
            "addRegistry": {
                "!type": "fn()"
            },
            "addFunction": {
                "!type": "fn()"
            }
        }
    };
    var defs = {};
    var generateHints = function (hintLevel, registryLevel) {
        if (typeof registryLevel === "function") {
            hintLevel["!type"] = "fn()";
        } else if (registryLevel) {
            Object.keys(registryLevel).forEach(function (key) {
                hintLevel[key] = {};
                generateHints(hintLevel[key], Object.getPrototypeOf(registryLevel[key]));
            });
        }
    };
    
    generateHints(hints.ServiceRegistry, root);
    return hints;
}

registryRoot = createRootObject();
exports._brackets = getBuiltinServices();
exports._createRootObject = createRootObject;
exports._getBuiltinServices = getBuiltinServices;

exports.getServices = getServices;
exports.getHints = getHints;
exports.convertArgumentsToArray = convertArgumentsToArray;