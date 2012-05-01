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
/*global define */

/**
 * HighlightAgent dispatches events for highlight requests from in-browser
 * highlight requests, and allows highlighting nodes and rules in the browser.
 */
define(function HighlightAgent(require, exports, module) {
    'use strict';

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var RemoteAgent = require("LiveDevelopment/Agents/RemoteAgent");
    var DOMAgent = require("LiveDevelopment/Agents/DOMAgent");

    var _highlight; // active highlight

    // Remote Event: Highlight
    function _onRemoteHighlight(res) {
        var node;
        if (res.value === "1") {
            node = DOMAgent.nodeWithId(res.nodeId);
        }
        Inspector.trigger("HighlightAgent.highlight", node);
    }

    /** Hide in-browser highlighting */
    function hide() {
        switch (_highlight.type) {
        case "node":
            Inspector.DOM.hideHighlight();
            break;
        case "css":
            RemoteAgent.call("hideHighlight");
            break;
        }
        _highlight = {};
    }

    /** Highlight a single node using DOM.highlightNode
     * @param {DOMNode} node
     */
    function node(n) {
        if (!Inspector.config.highlight) {
            return;
        }

        // go to the parent of a text node
        if (n && n.type === 3) {
            n = n.parent;
        }

        // node cannot be highlighted
        if (!n || !n.nodeId || n.type !== 1) {
            return hide();
        }

        // node is already highlighted
        if (_highlight.type === "node" && _highlight.ref === n.nodeId) {
            return;
        }

        // highlight the node
        _highlight = {type: "node", ref: n.nodeId};
        Inspector.DOM.highlightNode(n.nodeId, Inspector.config.highlightConfig);
    }

    /** Highlight all nodes affected by a CSS rule
     * @param {string} rule selector
     */
    function rule(name) {
        if (_highlight.rule === name) {
            return;
        }
        hide();
        _highlight = {type: "css", ref: name};
        RemoteAgent.call("highlightRule", name);
    }

    /** Initialize the agent */
    function load() {
        _highlight = {};
        Inspector.on("RemoteAgent.highlight", _onRemoteHighlight);
    }

    /** Clean up */
    function unload() {
        Inspector.off("RemoteAgent.highlight", _onRemoteHighlight);
    }

    // Export public functions
    exports.hide = hide;
    exports.node = node;
    exports.rule = rule;
    exports.load = load;
    exports.unload = unload;
});