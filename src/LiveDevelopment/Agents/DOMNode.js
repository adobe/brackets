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

/*jslint forin: true */

/**
 * DOMNode represents a node in the DOM tree. It is constructed from a payload
 * similar to {DOM.Node} and supports all basic tree operations. If a node has
 * a nodeId it is registered with the `DOMAgent` via `addNode()`. The node's
 * sourceOffset and sourceLength is stored as its location and length. Nodes can
 * iterated using `each()` or `find()`. `dump` shows the entire tree on the console.
 */
define(function DOMNodeModule(require, exports, module) {
    "use strict";

    var DOMHelpers = require("LiveDevelopment/Agents/DOMHelpers");

    /** Fill a string to the given length (used for debug output)
     * @param {string} source string
     * @param {integer} length
     * @param {char} fill character
     */
    function _fill(string, length, c) {
        if (c === undefined) {
            c = " ";
        }
        while (string.length < length) {
            string += c;
        }
        return string;
    }

    /** Construct a find condition (used in `find` and `findParent`)
     * The match can be a callback returning true or false, the node
     * name or the node type.
     * @param {function} or {string} or {number} match criteria
     */
    function _makeFindCondition(match) {
        switch (typeof match) {
        case "function":
            return match;
        case "string":
            return function findCondition(name, node) {
                return node.name === name;
            }.bind(undefined, match.toUpperCase());
        case "number":
            return function findCondition(type, node) {
                return node.type === type;
            }.bind(undefined, match);
        default:
            console.error("Invalid find condition: " + match);
        }
    }

    /** Constructor
     * @param {DOMAgent} the agent is passed to avoid circular relationships
     * @param {DOM.Node} node payload
     */
    var DOMNode = function DOMNode(agent, payload) {
        this.agent = agent;
        this.children = [];
        this.attributes = {};

        // set the payload
        if (typeof payload === "string") {
            payload = DOMHelpers.extractPayload(payload);
        }
        if (payload) {
            this.setPayload(payload);
        }
        this.agent.addNode(this);
    };

    var TYPE_ELEMENT = DOMNode.TYPE_ELEMENT = 1; // element node
    var TYPE_ATTRIBUTE = DOMNode.TYPE_ATTRIBUTE = 2; // attribute node (unused)
    var TYPE_TEXT = DOMNode.TYPE_TEXT = 3; // text node
    var TYPE_COMMENT = DOMNode.TYPE_COMMENT = 8; // comment node <!-- -->
    var TYPE_DOCUMENT = DOMNode.TYPE_DOCUMENT = 9; // document node <!DOCUMENT>

    /** Remove a node */
    DOMNode.prototype.remove = function remove() {
        this.agent.removeNode(this);
        if (this.parent) {
            this.parent.removeChild(this);
        }
    };


    /** Node Payload ***********************************************************/

    /** Set the node payload
     * @param {DOM.Node} payload
     */
    DOMNode.prototype.setPayload = function setPayload(payload) {
        this.nodeId = payload.nodeId;
        this.type = payload.nodeType;
        if (payload.nodeName) {
            this.name = payload.nodeName;
        }
        if (payload.nodeValue) {
            this.value = payload.nodeValue;
        }
        this.attributes = {};
        if (payload.attributes) {
            var i, k, v;
            for (i = 0; i < payload.attributes.length; i += 2) {
                k = payload.attributes[i];
                v = payload.attributes[i + 1];
                this.attributes[k] = v;
            }
        }
        if (payload.sourceOffset) {
            this.location = payload.sourceOffset;
        }
        if (payload.sourceLength) {
            this.length = payload.sourceLength;
        } else {
            if (this.value) {
                this.length = this.value.length;
            } else if (this.name) {
                this.length = this.name.length + 2;
            }
        }
        if (payload.children) {
            this.setChildrenPayload(payload.children);
        } else if (payload.childNodeCount) {
            this.agent.requestChildNodes(this);
        }
    };

    /** Create child nodes from the given payload
     * @param [{DOM.Node}] payload of the children
     */
    DOMNode.prototype.setChildrenPayload = function setChildrenPayload(childrenPayload) {
        var i, payload, node;
        for (i in childrenPayload) {
            payload = childrenPayload[i];
            node = new DOMNode(this.agent, payload);
            this.appendChild(node);
        }
    };

    /** Construct the payload for this node */
    DOMNode.prototype.payload = function payload() {
        var res = { type: this.type };
        if (this.nodeType === TYPE_ELEMENT) {
            res.nodeName = this.name;
        } else {
            res.value = this.value;
        }
        return res;
    };

    /** Find the next node that matches the given payload
     * @param {DOM.Node} payload
     */
    DOMNode.prototype.findParentForNextNodeMatchingPayload = function findParentForNextNodeMatchingPayload(payload) {
        var parent = this.canHaveChildren() ? this : this.parent;
        while (parent && !parent.matchesPayload(payload)) {
            parent = parent.parent;
        }
        return parent;
    };

    /** Find the next node that matches the given payload
     * @param {DOM.Node} payload
     */
    DOMNode.prototype.findNextNodeMatchingPayload = function findNextNodeMatchingPayload(payload) {
        var next = this.nextNode();
        while (next && !next.matchesPayload(payload)) {
            next = next.nextNode();
        }
        return next;
    };

    /** Test if the node matches the given payload
     * @param {DOM.Node} payload
     */
    DOMNode.prototype.matchesPayload = function matchesPayload(payload) {
        var r = false;
        if (this.type === payload.nodeType) {
            switch (this.type) {
            case 1:
                r = this.name === payload.nodeName;
                break;
            case 3:
                // TODO payload.nodeValue's HTML Entities must be decoded
                // r = this.value === payload.nodeValue;
                r = true;
                break;
            default:
                r = true;
            }
        }
        // Useful output for debugging this - do not remove
        // console.debug(this.type + "," + this.name + "," + this.value + " = " + payload.nodeType + "," + payload.nodeName + "," + payload.value + " -> " + r);
        return r;
    };

    /** Resolve the node and retrieve its objectId from the remote debugger */
    DOMNode.prototype.resolve = function resolve() {
        var def = new $.Deferred();
        if (this.objectId) {
            def.resolve(this);
        } else if (!this.nodeId) {
            def.reject();
        } else {
            this.agent.resolveNode(this, function onResolve(res) {
                this.objectId = res.object.objectId;
                def.resolve(this);
            }.bind(this));
        }
        return def.promise();
    };


    /** Tree Operations ******************************************************/

    /** Can the node have children? */
    DOMNode.prototype.canHaveChildren = function canHaveChildren() {
        return (this.type === 1 && !this.closed && !this.closing && this.nodeName !== "LINK");
    };

    /** Remove a child
     * @param {DOMNode} child node to remove
     */
    DOMNode.prototype.removeChild = function removeChild(node) {
        this.children.splice(this.indexOfChild(node), 1);
        delete node.parent;
    };

    /** Insert a child node at the given index
     * @param {DOMNode} node to insert
     * @param {integer} optional index (node is appended if missing)
     */
    DOMNode.prototype.insertChildAt = function insertChildAt(node, index) {
        if (node.parent) {
            node.parent.removeChild(node);
        }
        if (!index || index < 0 || index > this.children.length) {
            index = this.children.length;
        }
        this.children.splice(index, 0, node);
        node.parent = this;
        return node;
    };

    /** Append a child to this node
     * @param {DOMNode} child node to append
     */
    DOMNode.prototype.appendChild = function appendChild(node) {
        return this.insertChildAt(node);
    };

    /** Insert a child node after the given node
     * @param {DOMNode} child node to insert
     * @param {DOMNode} existing child node
     */
    DOMNode.prototype.insertChildAfter = function insertChildAfter(node, sibling) {
        var index = this.indexOfChild(sibling);
        if (index >= 0) {
            index++;
        }
        return this.insertChildAt(node, index);
    };

    /** Insert a child node before the given node
     * @param {DOMNode} child node to insert
     * @param {DOMNode} existing child node
     */
    DOMNode.prototype.insertChildBefore = function insertChildBefore(node, sibling) {
        var index = this.indexOfChild(sibling);
        return this.insertChildAt(node, index);
    };

    /** Determine the index of a child node
     * @param {DOMNode} child node
     */
    DOMNode.prototype.indexOfChild = function indexOfChild(node) {
        if (!node) {
            return -1;
        }
        var i;
        for (i in this.children) {
            if (this.children[i] === node) {
                return parseInt(i, 0);
            }
        }
        return -1;
    };

    /** Get the previous sibling */
    DOMNode.prototype.previousSibling = function previousSibling() {
        if (!this.parent) {
            return null;
        }
        return this.parent.children[this.parent.indexOfChild(this) - 1];
    };

    /** Get the next sibling */
    DOMNode.prototype.nextSibling = function nextSibling() {
        if (!this.parent) {
            return null;
        }
        return this.parent.children[this.parent.indexOfChild(this) + 1];
    };

    /** Get the previous node */
    DOMNode.prototype.previousNode = function previousNode() {
        var node = this.previousSibling();
        if (node) {
            if (node.children.length > 0) {
                node = node.children[node.children.length - 1];
            }
        } else {
            node = this.parent;
        }
        return node;
    };

    /** Get the next node */
    DOMNode.prototype.nextNode = function nextNode() {
        if (this.children.length > 0) {
            // return the first child
            return this.children[0];
        }
        // return this or any ancestor's next sibling
        var node, parent = this;
        while (parent) {
            node = parent.nextSibling();
            if (node) {
                return node;
            }
            parent = parent.parent;
        }
        return null;
    };

    /** Traverse the tree
     * @param {function({DOM.Node})} called for this node and all descendants
     */
    DOMNode.prototype.each = function each(callback) {
        if (callback(this) === false) {
            return false;
        }
        var i;
        for (i in this.children) {
            if (this.children[i].each(callback) === false) {
                return false;
            }
        }
        return true;
    };

    /** Find a node in the tree
     * @param {function} or {string} or {integer} find condition
     */
    DOMNode.prototype.find = function find(match) {
        var findCondition = _makeFindCondition(match);
        var node = null;
        this.each(function each(n) {
            if (findCondition(n)) {
                node = n;
                return false;
            }
        });
        return node;
    };

    /** Find all nodes with the given find condition
     * @param {function} or {string} or {integer} find condition
     */
    DOMNode.prototype.findAll = function findAll(match) {
        var nodes = [];
        var findCondition = _makeFindCondition(match);
        this.each(function each(node) {
            if (findCondition(node)) {
                nodes.push(node);
            }
        });
        return nodes;
    };

    /** Iterate over all parent nodes
     * @param {function({DOM.Node})} called for each ancestor
     */
    DOMNode.prototype.eachParent = function eachParent(callback) {
        var node = this.parent;
        while (node) {
            if (callback(node) === false) {
                return;
            }
            node = node.parent;
        }
        return null;
    };

    /** Find a parent node that matches the find condition
     * @param {function} or {string} or {integer} find condition
     */
    DOMNode.prototype.findParent = function findParent(findCondition) {
        var theParent = null;
        this.eachParent(function each(parent) {
            if (findCondition(parent)) {
                theParent = parent;
                return false;
            }
        });
        return theParent;
    };

    /** Find the root of the tree */
    DOMNode.prototype.root = function root() {
        var node = this;
        while (node.parent) {
            node = node.parent;
        }
        return node;
    };


   /** Node Info ***********************************************************/

   /** Test if the given location is inside this node
    * @param {integer} location
    * @param {boolean} also include children
    */
    DOMNode.prototype.isAtLocation = function isAtLocation(location, includeChildren) {
        if (includeChildren === undefined) {
            includeChildren = true;
        }
        if (!this.location || location < this.location) {
            return false;
        }
        var to;
        if (includeChildren && this.closeLocation) {
            to = this.closeLocation + this.closeLength;
        } else {
            to = this.location + this.length;
        }
        if (this.type === TYPE_TEXT) {
            to += 1;
        }
        return location < to;
    };

    /** Test if this node is empty */
    DOMNode.prototype.isEmpty = function isEmpty() {
        return this.type === TYPE_TEXT && /^\s*$/.test(this.value);
    };

    /** Debug Output */
    DOMNode.prototype.toString = function toString() {
        var r;
        switch (this.type) {
        case TYPE_ELEMENT:
            r = "<" + this.name + ">";
            break;
        case TYPE_ATTRIBUTE:
            r = "[ATTRIBUTE]";
            break;
        case TYPE_TEXT:
            r = this.value.replace(/\s+/, " ").substr(0, 40);
            break;
        case TYPE_COMMENT:
            r = "<!--" + this.value.replace(/\s+/, " ").substr(0, 33) + "-->";
            break;
        case TYPE_DOCUMENT:
            r = "<!DOCTYPE>";
            break;
        }
        return r;
    };

    /** Detailed Debug Output */
    DOMNode.prototype.dump = function dump(pre) {
        if (pre === undefined) {
            pre = "";
        }
        var r = pre + this.toString();
        if (this.location) {
            r = _fill(r, 60);
            r += " (" + this.location + "," + (this.location + this.length) + ")";
            if (this.closeLocation) {
                r += " (" + this.closeLocation + "," + (this.closeLocation + this.closeLength) + ")";
            }
        }
        if (this.nodeId) {
            r = _fill(r, 80);
            r += " {" + this.nodeId + "}";
        }
        console.info(r);
        pre += ". ";
        var i;
        for (i in this.children) {
            this.children[i].dump(pre);
        }
    };

    return DOMNode;
});
