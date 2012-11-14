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
/*global define, brackets, $, window */

/**
 * GotoAgent constructs and responds to the in-browser goto dialog.
 */
define(function GotoAgent(require, exports, module) {
    "use strict";

    require("utils/Global");

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var DOMAgent = require("LiveDevelopment/Agents/DOMAgent");
    var ScriptAgent = require("LiveDevelopment/Agents/ScriptAgent");
    var RemoteAgent = require("LiveDevelopment/Agents/RemoteAgent");

    var DocumentManager = require("document/DocumentManager");
    var EditorManager = require("editor/EditorManager");

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

    /** Get the file component of the given url
     * @param {string} URL
     */
    function _fileFromURL(url) {
        var comp = url.split("/");
        return comp[comp.length - 1];
    }

    /** Make the given node a target for goto
     * @param [] targets array
     * @param {DOMNode} node
     */
    function _makeHTMLTarget(targets, node) {
        if (node.location) {
            var target = {};
            var url = DOMAgent.url;
            var location = node.location;
            if (node.canHaveChildren()) {
                location += node.length;
            }
            url += ":" + location;
            var name = "&lt;" + node.name + "&gt;";
            var file = _fileFromURL(url);
            targets.push({"type": "html", "url": url, "name": name, "file": file});
        }
    }

    /** Make the given css rule a target for goto
     * @param [] targets array
     * @param {CSS.Rule} node
     */
    function _makeCSSTarget(targets, rule) {
        if (rule.sourceURL) {
            var target = {};
            var url = rule.sourceURL;
            url += ":" + rule.style.range.start;
            var name = rule.selectorText;
            var file = _fileFromURL(url);
            targets.push({"type": "css", "url": url, "name": name, "file": file});
        }
    }

    /** Make the given javascript callFrame the target for goto
     * @param [] targets array
     * @param {Debugger.CallFrame} node
     */
    function _makeJSTarget(targets, callFrame) {
        var script = ScriptAgent.scriptWithId(callFrame.location.scriptId);
        if (script && script.url) {
            var target = {};
            var url = script.url;
            url += ":" + callFrame.location.lineNumber + "," + callFrame.location.columnNumber;
            var name = callFrame.functionName;
            if (name === "") {
                name = "anonymous function";
            }
            var file = _fileFromURL(url);
            targets.push({"type": "js", "url": url, "name": name, "file": file});
        }
    }

    /** Gather options where to go to from the given source node */
    function _onRemoteShowGoto(event, res) {
        // res = {nodeId, name, value}
        var node = DOMAgent.nodeWithId(res.nodeId);

        // get all css rules that apply to the given node
        Inspector.CSS.getMatchedStylesForNode(node.nodeId, function onMatchedStyles(res) {
            var i, callFrame, name, script, url, rule, targets = [];
            _makeHTMLTarget(targets, node);
            for (i in node.trace) {
                _makeJSTarget(targets, node.trace[i]);
            }
            for (i in node.events) {
                var trace = node.events[i];
                _makeJSTarget(targets, trace.callFrames[0]);
            }
            for (i in res.matchedCSSRules.reverse()) {
                _makeCSSTarget(targets, res.matchedCSSRules[i]);
            }
            RemoteAgent.call("showGoto", targets);
        });
    }

    /** Point the master editor to the given location
     * @param {integer} location in file
     */
    function openLocation(location, noFlash) {
        var editor = EditorManager.getCurrentFullEditor();
        var codeMirror = editor._codeMirror;
        if (typeof location === "number") {
            location = codeMirror.posFromIndex(location);
        }
        codeMirror.setCursor(location);
        editor.focus();

        if (!noFlash) {
            codeMirror.setLineClass(location.line, "flash");
            window.setTimeout(codeMirror.setLineClass.bind(codeMirror, location.line), 1000);
        }
    }

    /** Open the editor at the given url and editor location
     * @param {string} url
     * @param {integer} optional location in file
     */
    function open(url, location, noFlash) {
        console.assert(url.substr(0, 7) === "file://", "Cannot open non-file URLs");

        var result = new $.Deferred();

        url = _urlWithoutQueryString(url);
        // Extract the path, also strip the third slash when on Windows
        var path = url.slice(brackets.platform === "win" ? 8 : 7);
        // URL-decode the path ('%20' => ' ')
        path = decodeURI(path);
        var promise = DocumentManager.getDocumentForPath(path);
        promise.done(function onDone(doc) {
            DocumentManager.setCurrentDocument(doc);
            if (location) {
                openLocation(location, noFlash);
            }
            result.resolve();
        });
        promise.fail(function onErr(err) {
            console.error(err);
            result.reject(err);
        });

        return result.promise();
    }

    /** Go to the given source node */
    function _onRemoteGoto(event, res) {
        // res = {nodeId, name, value}
        var location, url = res.value;
        var matches = /^(.*):([^:]+)$/.exec(url);
        if (matches) {
            url = matches[1];
            location = matches[2].split(",");
            if (location.length === 1) {
                location = parseInt(location[0], 10);
            } else {
                location = { line: parseInt(location[0], 10), ch: parseInt(location[1], 10) };
            }
        }
        open(url, location);
    }

    /** Initialize the agent */
    function load() {
        $(RemoteAgent)
            .on("showgoto.GotoAgent", _onRemoteShowGoto)
            .on("goto.GotoAgent", _onRemoteGoto);
    }

    /** Initialize the agent */
    function unload() {
        $(RemoteAgent).off(".GotoAgent");
    }

    // Export public functions
    exports.openLocation = openLocation;
    exports.open = open;
    exports.load = load;
    exports.unload = unload;
});