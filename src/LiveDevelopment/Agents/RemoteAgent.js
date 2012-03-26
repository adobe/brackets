/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 * @author Jonathan Diehl <jdiehl@adobe.com>
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $ */

/**
 * RemoteAgent defines and provides an interface for custom remote functions
 * loaded from RemoteFunctions. Remote commands are executed via
 * `call(name, varargs)`. Remote events are dispatched as events on the
 * Inspector named "Remote.EVENT".
 */
define(function RemoteAgent(require, exports, module) {
    'use strict';

    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    var _load; // deferred load
    var _objectId; // the object id of the remote object

    // WebInspector Event: Page.loadEventFired
    function _onLoadEventFired(res) {
        // res = {timestamp}
        var request = new XMLHttpRequest();
        request.open("GET", "LiveDevelopment/Agents/RemoteFunctions.js");
        request.onload = function onLoad() {
            var run = "window._LD=" + request.response + "()";
            Inspector.Runtime.evaluate(run, function onEvaluate(res) {
                console.assert(!res.wasThrown, res.result.description);
                _objectId = res.result.objectId;
                _load.resolve();
            });
        };
        request.send(null);
    }

    // WebInspector Event: DOM.attributeModified
    function _onAttributeModified(res) {
        // res = {nodeId, name, value}
        var matches = /^data-ld-(.*)/.exec(res.name);
        if (matches) {
            Inspector.trigger("RemoteAgent." + matches[1], res);
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
        Inspector.on("Page.loadEventFired", _onLoadEventFired);
        Inspector.on("DOM.attributeModified", _onAttributeModified);
        return _load.promise();
    }

    /** Clean up */
    function unload() {
        Inspector.off("Page.loadEventFired", _onLoadEventFired);
        Inspector.off("DOM.attributeModified", _onAttributeModified);
    }

    // Export public functions
    exports.call = call;
    exports.load = load;
    exports.unload = unload;
});