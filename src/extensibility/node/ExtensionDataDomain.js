
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

function createWrapper(name, options) {
    return function () {
        var root = this.__meta.root;
        var args = ExtensionData.convertArgumentsToArray(arguments, root.__addCallback.bind(root));
        
        var extension = this.__meta.extension.name;
        _emitEvent(DOMAIN_NAME, "callFunction", [extension, name, args]);
    };
}

function clearRequireCache(base) {
    base = fs.realpathSync(base);
    Object.keys(require.cache).forEach(function (module) {
        if (module.indexOf(base) === 0) {
            delete require.cache[module];
        }
    });
}

function _cmdInitialize(registryID, data) {
    ExtensionData._brackets.__initialize(registryID, JSON.parse(data), createWrapper);
    ExtensionData._brackets.channels.brackets.extension.disabled.subscribe(function (e) {
        var services = ExtensionData.getServices(e.name);
        services.__removeAll();
        clearRequireCache(services.__meta.extension.baseUrl);
    });
}

function _cmdLoadExtension(name, baseUrl, callback) {
    var nodeMainPath = baseUrl + "/node-main";
    if (fs.existsSync(nodeMainPath + ".js")) {
        var nodeMain = require(nodeMainPath);
        if (nodeMain.load) {
            var services = ExtensionData.getServices(name);
            services.__meta.extension.baseUrl = baseUrl;
            var promise = nodeMain.load(services);
            if (promise) {
                promise.done(callback);
            } else {
                callback();
            }
        } else {
            callback();
        }
    } else {
        callback();
    }
}

function _cmdCallFunction(extension, name, args) {
    var services = ExtensionData.getServices(extension);
    var fn = services.getObject(name);
    fn.apply(fn, args);
}

function init(domainManager) {
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
            name: "registryID",
            type: "int",
            description: "ID for this registry"
        }, {
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
        true,
        "Loads an extension's node side",
        [{
            name: "name",
            type: "string",
            description: "name of the extension"
        }, {
            name: "baseUrl",
            type: "string",
            description: "path of the extension"
        }],
        {
            type: "boolean",
            description: "returns true when ready"
        }
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
