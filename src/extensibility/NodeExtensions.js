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
/*global define, $, CodeMirror, brackets, window, setTimeout, clearTimeout */


"use strict";

var AppInit = require("utils/AppInit"),
    FileUtils = require("file/FileUtils"),
    NodeConnection = require("utils/NodeConnection"),
    ExtensionData = require("extensibility/ExtensionData");

var _nodeConnectionDeferred = new $.Deferred(),
    _nodeConnection = null,
    NODE_CONNECTION_TIMEOUT = 30000; // 30 seconds - TODO: share with StaticServer?

function loadNodeExtension(name, baseUrl, mainModule, services) {
    var deferred = new $.Deferred();
    _nodeConnectionDeferred.done(function () {
        if (_nodeConnection && _nodeConnection.connected()) {
            _nodeConnection.domains.extensionData.loadExtension(name, baseUrl).done(function () {
                if (mainModule.nodeReady) {
                    mainModule.nodeReady(services);
                    deferred.resolve();
                } else {
                    deferred.resolve();
                }
            });
            
        } else {
            deferred.reject("Tried to load node extension", name, "but node is not connected");
        }
    }).fail(function () {
        deferred.reject("Tried to load node extension", name, "but node is not connected");
    });
    return deferred.promise();
}

var callNodeFunction = function (name, options) {
    return function () {
        if (_nodeConnection && _nodeConnection.connected()) {
            var root = this.__meta.root;
            var args = ExtensionData.convertArgumentsToArray(arguments, root.__addCallback.bind(root));
            _nodeConnection.domains.extensionData.callFunction(this.__meta.extension.name, name, args);
        } else {
            console.error("Tried to call node function", name, "but node is not connected");
        }
    };
};

function _callFunctionFromNode(e, extension, name, args) {
    var segments = name.split(".");
    var services = ExtensionData.getServices(extension);
    var current = services;
    var i;
    for (i = 0; i < segments.length; i++) {
        current = current[segments[i]];
        if (!current) {
            console.error("Unknown function called from node: ", name);
            return;
        }
    }
    for (i = 0; i < args.length; i++) {
        if (args[i] && typeof args[i] === "object" && args[i].__function) {
            args[i] = callNodeFunction(args[i].__function);
        }
    }
    current.apply({
        extension: extension,
        registry: services,
        name: name
    }, args);
}

AppInit.appReady(function () {
    // Start up the node connection, which is held in the
    // _nodeConnectionDeferred module variable. (Use 
    // _nodeConnectionDeferred.done() to access it.
    var connectionTimeout = setTimeout(function () {
        console.error("[ExtensionData] Timed out while trying to connect to node");
        _nodeConnectionDeferred.reject();
    }, NODE_CONNECTION_TIMEOUT);
    
    _nodeConnection = new NodeConnection();
    _nodeConnection.connect(true).then(function () {
        var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/node/ExtensionDataDomain";
        
        _nodeConnection.loadDomains(domainPath, true)
            .then(
                function () {
                    if (_nodeConnection.connected()) {
                        $(_nodeConnection).on("extensionData.callFunction", _callFunctionFromNode);
                        var remoteConfig = ExtensionData._brackets.__getRemoteRegistryConfig(callNodeFunction);
                        _nodeConnection.domains.extensionData.initialize(remoteConfig.registryID, remoteConfig.data);
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

exports.loadNodeExtension = loadNodeExtension;
