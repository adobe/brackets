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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define */

/**
 * HighlightAgent dispatches events for highlight requests from in-browser
 * highlight requests, and allows highlighting nodes and rules in the browser.
 *
 * Trigger "highlight" when a node should be highlighted
 */
define(function HighlightAgent(require, exports, module) {
    "use strict";

    var DOMAgent        = require("LiveDevelopment/Agents/DOMAgent"),
        EventDispatcher = require("utils/EventDispatcher"),
        Inspector       = require("LiveDevelopment/Inspector/Inspector"),
        LiveDevelopment = require("LiveDevelopment/LiveDevelopment"),
        RemoteAgent     = require("LiveDevelopment/Agents/RemoteAgent"),
        _               = require("thirdparty/lodash");

    var _highlight = {}; // active highlight

    // Remote Event: Highlight
    function _onRemoteHighlight(event, res) {
        var node;
        if (res.value === "1") {
            node = DOMAgent.nodeWithId(res.nodeId);
        }
        exports.trigger("highlight", node);
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
        if (!LiveDevelopment.config.experimental) {
            return;
        }

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
        if (_highlight.ref === name) {
            return;
        }
        hide();
        _highlight = {type: "css", ref: name};
        RemoteAgent.call("highlightRule", name);
    }

    /** Highlight all nodes with 'data-brackets-id' value
     * that matches id, or if id is an array, matches any of the given ids.
     * @param {string|Array<string>} value of the 'data-brackets-id' to match,
     * or an array of such.
     */
    function domElement(ids) {
        var selector = "";
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        _.each(ids, function (id) {
            if (selector !== "") {
                selector += ",";
            }
            selector += "[data-brackets-id='" + id + "']";
        });
        rule(selector);
    }

    /**
     * Redraw active highlights
     */
    function redraw() {
        RemoteAgent.call("redrawHighlights");
    }

    /** Initialize the agent */
    function load() {
        if (LiveDevelopment.config.experimental) {
            RemoteAgent.on("highlight.HighlightAgent", _onRemoteHighlight);
        }
    }

    /** Clean up */
    function unload() {
        if (LiveDevelopment.config.experimental) {
            RemoteAgent.off(".HighlightAgent");
        }
    }


    EventDispatcher.makeEventDispatcher(exports);

    // Export public functions
    exports.hide = hide;
    exports.node = node;
    exports.rule = rule;
    exports.domElement = domElement;
    exports.redraw = redraw;
    exports.load = load;
    exports.unload = unload;
});
