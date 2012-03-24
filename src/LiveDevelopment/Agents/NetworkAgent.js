/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 * @author Jonathan Diehl <jdiehl@adobe.com>
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $ */

/**
 * NetworkAgent tracks all resources loaded by the remote debugger. Use
 * `wasURLRequested(url)` to query whether a resource was loaded.
 */
define(function NetworkAgent(require, exports, module) {
    'use strict';

    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    var _urlRequested; // url -> request info

    /** Return the URL without the query string
     * @param {string} URL
     */
    function _urlWithoutQueryString(url) {
        var index = url.search(/[#\?]/);
        if (index >= 0) {
            url = url.substr(0, index);
        }
        return url;
    }

    /** Return the resource information for a given URL
     * @param {string} url
     */
    function wasURLRequested(url) {
        return _urlRequested[url];
    }

    // WebInspector Event: Network.requestWillBeSent
    function _onRequestWillBeSent(res) {
        // res = {requestId, frameId, loaderId, documentURL, request, timestamp, initiator, stackTrace, redirectResponse}
        var url = _urlWithoutQueryString(res.request.url);
        _urlRequested[url] = true;
    }

    /** Initialize the agent */
    function load() {
        _urlRequested = {};
        Inspector.Network.enable();
        Inspector.on("Network.requestWillBeSent", _onRequestWillBeSent);
    }

    /** Unload the agent */
    function unload() {
        Inspector.off("Network.requestWillBeSent", _onRequestWillBeSent);
    }

    // Export public functions
    exports.wasURLRequested = wasURLRequested;
    exports.load = load;
    exports.unload = unload;
});