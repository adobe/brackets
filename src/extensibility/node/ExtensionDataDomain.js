
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

/*jslint vars: true, plusplus: true, devel: true, node: true, nomen: true,
indent: 4, maxerr: 50, evil: true */

"use strict";

var fs            = require("fs"),
    ExtensionData = require("../ExtensionData");

var DOMAIN_NAME = "extensionData",
    _emitEvent  = null;

function _createFunction(obj) {
    if (obj.options.runLocal) {
        console.log("local: ", obj.__function, obj.args, obj.body);
        var localFn = new Function(obj.args, obj.body);
        return function () {
            var registry = ExtensionData._getCurrentRegistry();
            localFn.apply({
                extension: registry.extension,
                registry: registry,
                name: obj.__function
            }, arguments);
        };
    }
    return function () {
        var args = [];
        var i;
        for (i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        
        var extension = ExtensionData._getCurrentRegistry();
        console.log("Calling ", obj.__function, " with this ", extension);
        _emitEvent(DOMAIN_NAME, "callFunction", [extension, obj.__function, args]);
    };
}

console.log("Setting up remote function 2");

ExtensionData._ServiceRegistryBase.prototype._addRemoteFunction = function (name, options) {
    var extension = this.extension;
    this.addFunction(name, function () {
        var args = [];
        var i;
        for (i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        _emitEvent(DOMAIN_NAME, "callFunction", [extension, name, args]);
    }.bind(this), options, true);
};

function _cmdInitialize(data) {
    ExtensionData._brackets._initialize(data, _createFunction);
    ExtensionData._brackets.channels.brackets.serviceRegistry.addObject.subscribe(ExtensionData._addObjectFromRemote);
    ExtensionData._brackets.channels.brackets.serviceRegistry.addFunction.subscribe(ExtensionData._addFunctionFromRemote);
}

function _cmdLoadExtension(name, baseUrl) {
    var nodeMainPath = baseUrl + "/node-main";
    if (fs.existsSync(nodeMainPath + ".js")) {
        var nodeMain = require(nodeMainPath);
        if (nodeMain.init) {
            nodeMain.init(ExtensionData.getServiceRegistry(name));
        }
    }
}

function _cmdCallFunction(extension, name, args) {
    var services = ExtensionData.getServiceRegistry(extension);
    var segments = name.split(".");
    var current = services;
    segments.forEach(function (segment) {
        current = current[segment];
    });
    return current.apply({
        extension: extension,
        registry: services,
        name: name
    }, args);
}

console.log("Got farther along");

function init(domainManager) {
    console.log("Domain init");
    _emitEvent = domainManager.emitEvent;
    if (!domainManager.hasDomain(DOMAIN_NAME)) {
        domainManager.registerDomain(DOMAIN_NAME, {major: 0, minor: 1});
    }
    domainManager.registerCommand(
        DOMAIN_NAME,
        "initialize",
        _cmdInitialize,
        false,
        "Initializes the extension data.",
        [{
            name: "data",
            type: "Object",
            description: "all the info"
        }]
    );
    domainManager.registerEvent(
        DOMAIN_NAME,
        "callFunction",
        [{
            name: "extension",
            type: "string",
            description: "name of the extension making the call"
        }, {
            name: "name",
            type: "string",
            description: "dotted name of function to call"
        }, {
            name: "args",
            type: "array",
            description: "Function arguments"
        }]
    );
    domainManager.registerCommand(
        DOMAIN_NAME,
        "loadExtension",
        _cmdLoadExtension,
        false,
        "Loads an extension's node side",
        [{
            name: "name",
            type: "string",
            description: "name of the extension"
        }, {
            name: "baseUrl",
            type: "string",
            description: "path of the extension"
        }]
    );
    domainManager.registerCommand(
        DOMAIN_NAME,
        "callFunction",
        _cmdCallFunction,
        false,
        "Remote function call",
        [{
            name: "extension",
            type: "string",
            description: "name of extension making the call"
        }, {
            name: "name",
            type: "string",
            description: "name of the function to call"
        }, {
            name: "args",
            type: "array",
            description: "array of arguments for the call"
        }]
    );
}


exports.init = init;
