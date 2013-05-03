
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
indent: 4, maxerr: 50 */

"use strict";

var DOMAIN_NAME = "extensionData",
    registry    = {},
    _emitEvent  = null;

function _createFunction(obj) {
    return function () {
        var args = [];
        var i;
        for (i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        
        _emitEvent(DOMAIN_NAME, "callFunction", [obj.__function, args]);
    };
}

function _upgradeData(data) {
    Object.keys(data).forEach(function (key) {
        if (key.substr(0, 1) === "_") {
            return;
        }
        var obj = data[key];
        if (obj.hasOwnProperty("__function")) {
            data[key] = _createFunction(obj);
        } else {
            _upgradeData(obj);
        }
    });
}

function _cmdInitialize(data) {
    console.log("initializing ExtensionData");
    _upgradeData(data);
    registry = data;
    registry.log("All systems go!");
}

function _cmdLoadNodeMain() {
}

function init(domainManager) {
    console.log("Setting up ExtensionData Domain");
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
            name: "name",
            type: "string",
            description: "dotted name of function to call"
        }, {
            name: "args",
            type: "array",
            description: "Function arguments"
        }]
    );
}


exports.init = init;
