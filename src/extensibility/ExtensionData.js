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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, brackets, window, setTimeout, clearTimeout */


    "use strict";
    
    var AppInit = require("utils/AppInit"),
        FileUtils = require("file/FileUtils"),
        NodeConnection = require("utils/NodeConnection");
    
    
    var currentRegistry         = null,
        _nodeConnectionDeferred = new $.Deferred(),
        NODE_CONNECTION_TIMEOUT = 30000; // 30 seconds - TODO: share with StaticServer?
    
    function ServiceRegistry(extension) {
        this.extension = extension;
        this._definitions = [];
    }
    
    ServiceRegistry.prototype.addObject = function (name) {
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
    };
    
    ServiceRegistry.prototype.addFunction = function (name, fn, options) {
        this._definitions.push(name);
        var dot = name.lastIndexOf(".");
        var target;
        
        var wrapped = function () {
            fn.apply({
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
    };
    
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
    
    ServiceRegistry.prototype.removeAll = function () {
        var extension = this.extension;
        this._definitions.forEach(function (name) {
            _removeDefinition(extension, name);
        });
        this._definitions = [];
    };
    
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
    
    function _callFunctionFromNode(e, name, args) {
        var segments = name.split(".");
        var current = ServiceRegistry.prototype;
        var i;
        for (i = 0; i < segments.length; i++) {
            current = current[segments[i]];
            if (!current) {
                console.error("Unknown function called from node: ", name);
                return;
            }
        }
        current.apply(ServiceRegistry.prototype, args);
    }
    
    AppInit.appReady(function () {
        // Start up the node connection, which is held in the
        // _nodeConnectionDeferred module variable. (Use 
        // _nodeConnectionDeferred.done() to access it.
        var connectionTimeout = setTimeout(function () {
            console.error("[ExtensionData] Timed out while trying to connect to node");
            _nodeConnectionDeferred.reject();
        }, NODE_CONNECTION_TIMEOUT);
        
        var _nodeConnection = new NodeConnection();
        _nodeConnection.connect(true).then(function () {
            var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/node/ExtensionDataDomain";
            
            _nodeConnection.loadDomains(domainPath, true)
                .then(
                    function () {
                        if (_nodeConnection.connected()) {
                            $(_nodeConnection).on("extensionData.callFunction", _callFunctionFromNode);
                            _nodeConnection.domains.extensionData.initialize(ServiceRegistry.prototype);
                        }
                        clearTimeout(connectionTimeout);
                        _nodeConnectionDeferred.resolve(_nodeConnection);
                    },
                    function () { // Failed to connect
                        console.error("[ExtensionData] Failed to connect to node", arguments);
                        clearTimeout(connectionTimeout);
                        _nodeConnectionDeferred.reject();
                    }
                );
        });
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
