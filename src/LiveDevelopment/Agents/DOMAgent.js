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
 * DOMAgent constructs and maintains a tree of {DOMNode}s that represents the
 * rendered DOM tree in the remote browser. Nodes can be accessed by id or
 * location (source offset). To update the DOM tree in response to a change of
 * the source document (replace [from,to] with text) call
 * `applyChange(from, to, text)`.
 *
 * The DOMAgent triggers `getDocument` once it has loaded
 * the document.
 */
define(function DOMAgent(require, exports, module) {
    "use strict";

    var $exports = $(exports);

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var RemoteAgent = require("LiveDevelopment/Agents/RemoteAgent");
    var DOMNode = require("LiveDevelopment/Agents/DOMNode");
    var DOMHelpers = require("LiveDevelopment/Agents/DOMHelpers");

    var _load; // {$.Deferred} load promise
    var _idToNode; // {nodeId -> node}
    var _pendingRequests; // {integer} number of pending requests before initial loading is complete

    /** Get the last node before the given location
     * @param {integer} location
     */
    function nodeBeforeLocation(location) {
        var node;
        exports.root.each(function each(n) {
            if (!n.location || location < n.location) {
                return true;
            }
            if (!node || node.location < n.location) {
                node = n;
            }
        });
        return node;
    }

    /** Get the element node that encloses the given location
     * @param {location}
     */
    function allNodesAtLocation(location) {
        var nodes = [];
        exports.root.each(function each(n) {
            if (n.type === DOMNode.TYPE_ELEMENT && n.isAtLocation(location)) {
                nodes.push(n);
            }
        });
        return nodes;
    }

    /** Get the node at the given location
     * @param {location}
     */
    function nodeAtLocation(location) {
        return exports.root.find(function each(n) {
            return n.isAtLocation(location, false);
        });
    }

    /** Find the node for the given id
     * @param {DOMNode} node
     */
    function nodeWithId(nodeId) {
        return _idToNode[nodeId];
    }

    /** Update the node index
     * @param {DOMNode} node
     */
    function removeNode(node) {
        if (node.nodeId) {
            delete _idToNode[node.nodeId];
        }
    }

    /** Update the node index
     * @param {DOMNode} node
     */
    function addNode(node) {
        if (node.nodeId) {
            _idToNode[node.nodeId] = node;
        }
    }

    /** Request the child nodes for a node
     * @param {DOMNode} node
     */
    function requestChildNodes(node) {
        if (_pendingRequests >= 0) {
            _pendingRequests++;
        }
        Inspector.DOM.requestChildNodes(node.nodeId);
    }

    /** Resolve a node
     * @param {DOMNode} node
     */
    function resolveNode(node, callback) {
        console.assert(node.nodeId, "Attempted to resolve node without id");
        Inspector.DOM.resolveNode(node.nodeId, callback);
    }

    /** Eliminate the query string from a URL
     * @param {string} URL
     */
    function _cleanURL(url) {
        var index = url.search(/[#\?]/);
        if (index >= 0) {
            url = url.substr(0, index);
        }
        return url;
    }

    /** Map the DOM document to the source text
     * @param {string} source
     */
    function _mapDocumentToSource(source) {
        var node = exports.root;
        DOMHelpers.eachNode(source, function each(payload) {
            if (!node) {
                return true;
            }
            if (payload.closing) {
                var parent = node.findParentForNextNodeMatchingPayload(payload);
                if (!parent) {
                    return console.warn("Matching Parent not at " + payload.sourceOffset + " (" + payload.nodeName + ")");
                }
                parent.closeLocation = payload.sourceOffset;
                parent.closeLength = payload.sourceLength;
            } else {
                var next = node.findNextNodeMatchingPayload(payload);
                if (!next) {
                    return console.warn("Skipping Source Node at " + payload.sourceOffset);
                }
                node = next;
                node.location = payload.sourceOffset;
                node.length = payload.sourceLength;
                if (payload.closed) {
                    node.closed = payload.closed;
                }
            }
        });
    }

    /** Load the source document and match it with the DOM tree*/
    function _onFinishedLoadingDOM() {
        var request = new XMLHttpRequest();
        request.open("GET", exports.url);
        request.onload = function onLoad() {
            if ((request.status >= 200 && request.status < 300) ||
                    request.status === 304 || request.status === 0) {
                _mapDocumentToSource(request.response);
                _load.resolve();
            } else {
                var msg = "Received status " + request.status + " from XMLHttpRequest while attempting to load source file at " + exports.url;
                _load.reject(msg, { message: msg });
            }
        };
        request.onerror = function onError() {
            _load.reject("Could not load source file at " + exports.url);
        };
        request.send(null);
    }

    // WebInspector Event: Page.loadEventFired
    function _onLoadEventFired(event, res) {
        // res = {timestamp}
        Inspector.DOM.getDocument(function onGetDocument(res) {
            $exports.triggerHandler("getDocument", res);
            // res = {root}
            _idToNode = {};
            _pendingRequests = 0;
            exports.root = new DOMNode(exports, res.root);
        });
    }

    // WebInspector Event: Page.frameNavigated
    function _onFrameNavigated(event, res) {
        // res = {frame}
        exports.url = _cleanURL(res.frame.url);
    }

     // WebInspector Event: DOM.documentUpdated
    function _onDocumentUpdated(event, res) {
        // res = {}
    }

    // WebInspector Event: DOM.setChildNodes
    function _onSetChildNodes(event, res) {
        // res = {parentId, nodes}
        var node = nodeWithId(res.parentId);
        node.setChildrenPayload(res.nodes);
        if (_pendingRequests > 0 && --_pendingRequests === 0) {
            _onFinishedLoadingDOM();
        }
    }

    // WebInspector Event: DOM.childNodeCountUpdated
    function _onChildNodeCountUpdated(event, res) {
        // res = {nodeId, childNodeCount}
        if (res.nodeId > 0) {
            Inspector.DOM.requestChildNodes(res.nodeId);
        }
    }

    // WebInspector Event: DOM.childNodeInserted
    function _onChildNodeInserted(event, res) {
        // res = {parentNodeId, previousNodeId, node}
        if (res.node.nodeId > 0) {
            var parent = nodeWithId(res.parentNodeId);
            var previousNode = nodeWithId(res.previousNodeId);
            var node = new DOMNode(exports, res.node);
            parent.insertChildAfter(node, previousNode);
        }
    }

    // WebInspector Event: DOM.childNodeRemoved
    function _onChildNodeRemoved(event, res) {
        // res = {parentNodeId, nodeId}
        if (res.nodeId > 0) {
            var node = nodeWithId(res.nodeId);
            node.remove();
        }
    }

    /** Apply a change
     * @param {integer} start offset of the change
     * @param {integer} end offset of the change
     * @param {string} change text
     */
    function applyChange(from, to, text) {
        var delta = from - to + text.length;
        var node = nodeAtLocation(from);

        // insert a text node
        if (!node) {
            if (!(/^\s*$/).test(text)) {
                console.warn("Inserting nodes not supported.");
                node = nodeBeforeLocation(from);
            }
        } else if (node.type === 3) {
            // update a text node
            var value = node.value.substr(0, from - node.location);
            value += text;
            value += node.value.substr(to - node.location);
            node.value = value;
            Inspector.DOM.setNodeValue(node.nodeId, node.value);
        } else {
            console.warn("Changing non-text nodes not supported.");
        }

        // adjust the location of all nodes after the change
        if (node) {
            node.length += delta;
            exports.root.each(function each(n) {
                if (n.location > node.location) {
                    n.location += delta;
                }
            });
        }
    }

    /** Initialize the agent */
    function load() {
        _load = new $.Deferred();
        $(Inspector.Page)
            .on("frameNavigated.DOMAgent", _onFrameNavigated)
            .on("loadEventFired.DOMAgent", _onLoadEventFired);
        $(Inspector.DOM)
            .on("documentUpdated.DOMAgent", _onDocumentUpdated)
            .on("setChildNodes.DOMAgent", _onSetChildNodes)
            .on("childNodeCountUpdated.DOMAgent", _onChildNodeCountUpdated)
            .on("childNodeInserted.DOMAgent", _onChildNodeInserted)
            .on("childNodeRemoved.DOMAgent", _onChildNodeRemoved);
        Inspector.Page.enable();
        Inspector.Page.reload();
        return _load.promise();
    }

    /** Clean up */
    function unload() {
        $(Inspector.Page).off(".DOMAgent");
        $(Inspector.DOM).off(".DOMAgent");
    }

    // Export private functions
    exports.nodeBeforeLocation = nodeBeforeLocation;
    exports.allNodesAtLocation = allNodesAtLocation;
    exports.nodeAtLocation = nodeAtLocation;
    exports.nodeWithId = nodeWithId;
    exports.removeNode = removeNode;
    exports.addNode = addNode;
    exports.requestChildNodes = requestChildNodes;
    exports.applyChange = applyChange;
    exports.load = load;
    exports.unload = unload;
});