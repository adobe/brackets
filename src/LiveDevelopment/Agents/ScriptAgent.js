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
/*global define, $ */

/**
 * ScriptAgent tracks all executed scripts, defines internal breakpoints, and
 * interfaces with the remote debugger.
 */
define(function ScriptAgent(require, exports, module) {
    "use strict";

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var DOMAgent = require("LiveDevelopment/Agents/DOMAgent");

    var _load; // the load promise
    var _urlToScript; // url -> script info
    var _idToScript; // id -> script info
    var _insertTrace; // the last recorded trace of a DOM insertion

    // TODO: should the parameter to this be an ID rather than a URL?
    /** Get the script information for a given url
     * @param {string} url
     */
    function scriptWithId(url) {
        return _idToScript[url];
    }

    // TODO: Strip off query/hash strings from URL (see CSSAgent._canonicalize())
    /** Get the script information for a given url
     * @param {string} url
     */
    function scriptForURL(url) {
        return _urlToScript[url];
    }

    // DOMAgent Event: Document root loaded
    function _onGetDocument(event, res) {
        Inspector.DOMDebugger.setDOMBreakpoint(res.root.nodeId, "subtree-modified");
        _load.resolve();
    }

    // WebInspector Event: DOM.childNodeInserted
    function _onChildNodeInserted(event, res) {
        // res = {parentNodeId, previousNodeId, node}
        if (_insertTrace) {
            var node = DOMAgent.nodeWithId(res.node.nodeId);
            node.trace = _insertTrace;
            _insertTrace = undefined;
        }
    }

    // TODO: Strip off query/hash strings from URL (see CSSAgent._canonicalize())
    // WebInspector Event: Debugger.scriptParsed
    function _onScriptParsed(event, res) {
        // res = {scriptId, url, startLine, startColumn, endLine, endColumn, isContentScript, sourceMapURL}
        _idToScript[res.scriptId] = res;
        _urlToScript[res.url] = res;
    }

    // WebInspector Event: Debugger.scriptFailedToParse
    function _onScriptFailedToParse(event, res) {
        // res = {url, scriptSource, startLine, errorLine, errorMessage}
    }

    // WebInspector Event: Debugger.paused
    function _onPaused(event, res) {
        // res = {callFrames, reason, data}
        switch (res.reason) {

        // Exception
        case "exception":
            Inspector.Debugger.resume();
            // var callFrame = res.callFrames[0];
            // var script = scriptWithId(callFrame.location.scriptId);
            break;

        // DOMBreakpoint
        case "DOM":
            Inspector.Debugger.resume();
            if (res.data.type === "subtree-modified" && res.data.insertion === true) {
                _insertTrace = res.callFrames;
            }
            break;
        }

    }

    function _reset() {
        _urlToScript = {};
        _idToScript = {};
    }

    /**
     * @private
     * WebInspector Event: Page.frameNavigated
     * @param {jQuery.Event} event
     * @param {frame: Frame} res
     */
    function _onFrameNavigated(event, res) {
        // Clear maps when navigating to a new page, but not if an iframe was loaded
        if (!res.frame.parentId) {
            _reset();
        }
    }

    /** Initialize the agent */
    function load() {
        _reset();
        _load = new $.Deferred();

        var enableResult = new $.Deferred();

        Inspector.Debugger.enable().done(function () {
            Inspector.Debugger.setPauseOnExceptions("uncaught").done(function () {
                enableResult.resolve();
            });
        });

        Inspector.Page.on("frameNavigated.ScriptAgent", _onFrameNavigated);
        DOMAgent.on("getDocument.ScriptAgent", _onGetDocument);
        Inspector.Debugger
            .on("scriptParsed.ScriptAgent", _onScriptParsed)
            .on("scriptFailedToParse.ScriptAgent", _onScriptFailedToParse)
            .on("paused.ScriptAgent", _onPaused);
        Inspector.DOM.on("childNodeInserted.ScriptAgent", _onChildNodeInserted);

        return $.when(_load.promise(), enableResult.promise());
    }

    /** Clean up */
    function unload() {
        _reset();
        Inspector.Page.off(".ScriptAgent");
        DOMAgent.off(".ScriptAgent");
        Inspector.Debugger.off(".ScriptAgent");
        Inspector.DOM.off(".ScriptAgent");
    }

    // Export public functions
    exports.scriptWithId = scriptWithId;
    exports.scriptForURL = scriptForURL;
    exports.load = load;
    exports.unload = unload;
});
