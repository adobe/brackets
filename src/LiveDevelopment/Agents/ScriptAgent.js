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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $ */

/**
 * ScriptAgent tracks all executed scripts, defines internal breakpoints, and
 * interfaces with the remote debugger.
 */
define(function ScriptAgent(require, exports, module) {
    'use strict';

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var DOMAgent = require("LiveDevelopment/Agents/DOMAgent");

    var _load; // the load promise
    var _urlToScript; // url -> script info
    var _idToScript; // id -> script info
    var _insertTrace; // the last recorded trace of a DOM insertion

    /** Add a call stack trace to a node
     * @param {integer} node id
     * @param [{Debugger.CallFrame}] call stack
     */
    function _addTraceToNode(nodeId, trace) {
        var node = DOMAgent.nodeWithId(nodeId);
        node.trace = trace;
    }

    /** Get the script information for a given url
     * @param {string} url
     */
    function scriptWithId(url) {
        return _idToScript[url];
    }

    /** Get the script information for a given url
     * @param {string} url
     */
    function scriptForURL(url) {
        return _urlToScript[url];
    }

    // DOMAgent Event: Document root loaded
    function _onGetDocument(res) {
        Inspector.DOMDebugger.setDOMBreakpoint(res.root.nodeId, "subtree-modified");
        _load.resolve();
    }

    // WebInspector Event: DOM.childNodeInserted
    function _onChildNodeInserted(res) {
        // res = {parentNodeId, previousNodeId, node}
        if (_insertTrace) {
            var node = DOMAgent.nodeWithId(res.node.nodeId);
            node.trace = _insertTrace;
            _insertTrace = undefined;
        }
    }

    // WebInspector Event: Debugger.scriptParsed
    function _onScriptParsed(res) {
        // res = {scriptId, url, startLine, startColumn, endLine, endColumn, isContentScript, sourceMapURL}
        _idToScript[res.scriptId] = res;
        _urlToScript[res.url] = res;
    }

    // WebInspector Event: Debugger.scriptFailedToParse
    function _onScriptFailedToParse(res) {
        // res = {url, scriptSource, startLine, errorLine, errorMessage}
    }

    // WebInspector Event: Debugger.paused
    function _onPaused(res) {
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

    /** Initialize the agent */
    function load() {
        _urlToScript = {};
        _idToScript = {};
        _load = new $.Deferred();
        Inspector.Debugger.enable();
        Inspector.Debugger.setPauseOnExceptions("uncaught");
        Inspector.on("DOMAgent.getDocument", _onGetDocument);
        Inspector.on("Debugger.scriptParsed", _onScriptParsed);
        Inspector.on("Debugger.scriptFailedToParse", _onScriptFailedToParse);
        Inspector.on("Debugger.paused", _onPaused);
        Inspector.on("DOM.childNodeInserted", _onChildNodeInserted);
        return _load;
    }

    /** Clean up */
    function unload() {
        Inspector.off("DOMAgent.getDocument", _onGetDocument);
        Inspector.off("Debugger.scriptParsed", _onScriptParsed);
        Inspector.off("Debugger.scriptFailedToParse", _onScriptFailedToParse);
        Inspector.off("Debugger.paused", _onPaused);
        Inspector.off("DOM.childNodeInserted", _onChildNodeInserted);
    }

    // Export public functions
    exports.scriptWithId = scriptWithId;
    exports.scriptForURL = scriptForURL;
    exports.load = load;
    exports.unload = unload;
});