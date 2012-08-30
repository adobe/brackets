/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, XMLHttpRequest */

/**
 * RemoteAgent defines and provides an interface for custom remote functions
 * loaded from RemoteFunctions. Remote commands are executed via
 * `call(name, varargs)`.
 *
 * Remote events are dispatched as events on this object.
 */
define(function RemoteAgent(require, exports, module) {
    "use strict";

    var $exports = $(exports);

    var LiveDevelopment = require("LiveDevelopment/LiveDevelopment");
    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    var _load; // deferred load
    var _objectId; // the object id of the remote object

    // WebInspector Event: Page.loadEventFired
    function _onLoadEventFired(event, res) {
        // res = {timestamp}
        var request = new XMLHttpRequest();
        request.open("GET", "LiveDevelopment/Agents/RemoteFunctions.js");
        request.onload = function onLoad() {
            var run = "window._LD=" + request.response + "(" + LiveDevelopment.config.experimental + ")";
            Inspector.Runtime.evaluate(run, function onEvaluate(res) {
                console.assert(!res.wasThrown, res.result.description);
                _objectId = res.result.objectId;
                _load.resolve();
            });
        };
        request.send(null);
    }

    // WebInspector Event: DOM.attributeModified
    function _onAttributeModified(event, res) {
        // res = {nodeId, name, value}
        var matches = /^data-ld-(.*)/.exec(res.name);
        if (matches) {
            $exports.triggerHandler(matches[1], res);
        }
    }

    /** Call a remote function
     * The parameters are passed on to the remote functions. Nodes are resolved
     * and sent as objectIds.
     * @param {string} function name
     */
    function call(method, varargs) {
        console.assert(_objectId, "Attempted to call remote method without objectId set.");
        var args = Array.prototype.slice.call(arguments, 1);

        // if the last argument is a function it is the callback function
        var callback;
        if (typeof args[args.length - 1] === "function") {
            callback = args.pop();
        }

        // Resolve node parameters
        var i;
        for (i in args) {
            if (args[i].nodeId) {
                args[i] = args[i].resolve();
            }
        }
        $.when.apply(undefined, args).then(function onResolvedAllNodes() {
            var i, arg, params = [];
            for (i in arguments) {
                arg = args[i];
                if (arg.objectId) {
                    params.push({objectId: arg.objectId});
                } else {
                    params.push({value: arg});
                }
            }
            Inspector.Runtime.callFunctionOn(_objectId, "_LD." + method, params, undefined, callback);
        });
    }

    /** Initialize the agent */
    function load() {
        _load = new $.Deferred();
        $(Inspector.Page).on("loadEventFired.RemoteAgent", _onLoadEventFired);
        $(Inspector.DOM).on("attributeModified.RemoteAgent", _onAttributeModified);
        return _load.promise();
    }

    /** Clean up */
    function unload() {
        $(Inspector.Page).off(".RemoteAgent");
        $(Inspector.DOM).off(".RemoteAgent");
    }

    // Export public functions
    exports.call = call;
    exports.load = load;
    exports.unload = unload;
});