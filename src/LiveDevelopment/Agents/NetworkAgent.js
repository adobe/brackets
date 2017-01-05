/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/**
 * NetworkAgent tracks all resources loaded by the remote debugger. Use
 * `wasURLRequested(url)` to query whether a resource was loaded.
 */
define(function NetworkAgent(require, exports, module) {
    "use strict";

    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    var _urlRequested = {}; // url -> request info

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
        return _urlRequested && _urlRequested[url];
    }

    function _logURL(url) {
        _urlRequested[_urlWithoutQueryString(url)] = true;
    }

    // WebInspector Event: Network.requestWillBeSent
    function _onRequestWillBeSent(event, res) {
        // res = {requestId, frameId, loaderId, documentURL, request, timestamp, initiator, stackTrace, redirectResponse}
        _logURL(res.request.url);
    }

    function _reset() {
        _urlRequested = {};
    }

    // WebInspector Event: Page.frameNavigated
    function _onFrameNavigated(event, res) {
        // res = {frame}
        // Clear log when navigating to a new page, but not if an iframe was loaded
        if (!res.frame.parentId) {
            _reset();
        }
        _logURL(res.frame.url);
    }

    /**
     * Enable the inspector Network domain
     * @return {jQuery.Promise} A promise resolved when the Network.enable() command is successful.
     */
    function enable() {
        return Inspector.Network.enable();
    }

    /** Initialize the agent */
    function load() {
        Inspector.Page.on("frameNavigated.NetworkAgent", _onFrameNavigated);
        Inspector.Network.on("requestWillBeSent.NetworkAgent", _onRequestWillBeSent);
    }

    /** Unload the agent */
    function unload() {
        _reset();
        Inspector.Page.off(".NetworkAgent");
        Inspector.Network.off(".NetworkAgent");
    }

    // Export public functions
    exports.wasURLRequested = wasURLRequested;
    exports.enable = enable;
    exports.load = load;
    exports.unload = unload;
});
