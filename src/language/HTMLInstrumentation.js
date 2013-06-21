/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror */
/*unittests: HTML Instrumentation*/

/**
 * HTMLInstrumentation
 *
 * This module contains functions for "instrumenting" html code. Instrumented code
 * adds a "data-brackets-id" attribute to every tag in the code. The value of this
 * tag is guaranteed to be unique.
 *
 * The primary function is generateInstrumentedHTML(). This does just what it says -
 * it will read the HTML content in the doc and generate instrumented code by injecting
 * "data-brackets-id" attributes.
 *
 * There are also helper functions for returning the tagID associated with a specified
 * position in the document.
 */
define(function (require, exports, module) {
    "use strict";

    var DocumentManager = require("document/DocumentManager"),
        Tokenizer       = require("language/HTMLTokenizer").Tokenizer,
        PriorityQueue   = require("thirdparty/priority_queue").PriorityQueue,
        MurmurHash3     = require("thirdparty/murmurhash3_gc");
    
    var seed = Math.floor(Math.random() * 65535);
    
    // Hash of scanned documents. Key is the full path of the doc. Value is an object
    // with two properties: timestamp and dom. Timestamp is the document timestamp,
    // dom is the root node of a simple DOM tree.
    var _cachedValues = {};

    /**
     * @private
     * Returns true if the specified tag is empty. This could be an empty HTML tag like 
     * <meta> or <link>, or a closed tag like <div />
     */
    function _isEmptyTag(payload) {
        if (payload.closed || !payload.nodeName) {
            return true;
        }
        
        if (/(!doctype|area|base|basefont|br|wbr|col|frame|hr|img|input|isindex|link|meta|param|embed)/i
                .test(payload.nodeName)) {
            return true;
        }
        
        return false;
    }
    
    /** 
     * Remove a document from the cache
     */
    function _removeDocFromCache(evt, document) {
        if (_cachedValues.hasOwnProperty(document.file.fullPath)) {
            delete _cachedValues[document.file.fullPath];
            $(document).off(".htmlInstrumentation");
        }
    }
    
    var tagID = 1;
    
    /**
     * Scan a document to prepare for HTMLInstrumentation
     * @param {Document} doc The doc to scan. 
     * @return {Object} Root DOM node of the scanned document.
     */
    function scanDocument(doc) {
        if (!_cachedValues.hasOwnProperty(doc.file.fullPath)) {
            $(doc).on("change.htmlInstrumentation", function () {
                if (_cachedValues[doc.file.fullPath]) {
                    _cachedValues[doc.file.fullPath].dirty = true;
                }
            });
            
            // Assign to cache, but don't set a value yet
            _cachedValues[doc.file.fullPath] = null;
        }
        
        var cachedValue = _cachedValues[doc.file.fullPath];
        if (cachedValue && !cachedValue.dirty && cachedValue.timestamp === doc.diskTimestamp) {
            return cachedValue.dom;
        }
        
        var text = doc.getText(),
            dom = _buildSimpleDOM(text);
        
        // Cache results
        _cachedValues[doc.file.fullPath] = {
            timestamp: doc.diskTimestamp,
            dom: dom,
            dirty: false
        };
        
        return dom;
    }
    
    /**
     * Generate instrumented HTML for the specified document. Each tag has a "data-brackets-id"
     * attribute with a unique ID for its value. For example, "<div>" becomes something like
     * "<div data-brackets-id='45'>". The attribute value is just a number that is guaranteed
     * to be unique. 
     * @param {Document} doc The doc to scan. 
     * @return {string} instrumented html content
     */
    function generateInstrumentedHTML(doc) {
        var dom = scanDocument(doc),
            gen = doc.getText();
        
        // Walk through the dom nodes and insert the 'data-brackets-id' attribute at the
        // end of the open tag
        var insertCount = 0;
        
        function walk(node) {
            if (node.tag) {
                var attrText = " data-brackets-id='" + node.tagID + "'";
                
                // Insert the attribute as the first attribute in the tag.
                var insertIndex = node.start + node.tag.length + 1 + insertCount;
                gen = gen.substr(0, insertIndex) + attrText + gen.substr(insertIndex);
                insertCount += attrText.length;
            }
            
            if (node.children) {
                node.children.forEach(function (child) {
                    walk(child);
                });
            }
        }
        
        walk(dom);
        return gen;
    }
    
    /**
     * Mark the text for the specified editor. Either the scanDocument() or 
     * the generateInstrumentedHTML() function must be called before this function
     * is called.
     *
     * NOTE: This function is "private" for now (has a leading underscore), since
     * the API is likely to change in the future.
     *
     * @param {Editor} editor The editor whose text should be marked.
     * @return none
     */
    function _markText(editor) {
        var cache = _cachedValues[editor.document.file.fullPath],
            dom = cache && cache.dom;
        
        if (!dom) {
            console.error("Couldn't find the dom for " + editor.document.file.fullPath);
            return;
        }
        
        _markTextFromDOM(editor, dom);
    }

    function _getMarkerAtDocumentPos(editor, pos) {
        var i,
            cm = editor._codeMirror,
            marks = cm.findMarksAt(pos),
            match;
        
        var _distance = function (mark) {
            var markerLoc = mark.find();
            if (markerLoc) {
                var markPos = markerLoc.from;
                return (cm.indexFromPos(pos) - cm.indexFromPos(markPos));
            } else {
                return Number.MAX_VALUE;
            }
        };
        
        for (i = 0; i < marks.length; i++) {
            if (!match) {
                match = marks[i];
            } else {
                if (_distance(marks[i]) < _distance(match)) {
                    match = marks[i];
                }
            }
        }
        
        return match;
    }
    
    /**
     * Get the instrumented tagID at the specified position. Returns -1 if
     * there are no instrumented tags at the location.
     * The _markText() function must be called before calling this function.
     *
     * NOTE: This function is "private" for now (has a leading underscore), since
     * the API is likely to change in the future.
     *
     * @param {Editor} editor The editor to scan. 
     * @return {number} tagID at the specified position, or -1 if there is no tag
     */
    function _getTagIDAtDocumentPos(editor, pos) {
        var match = _getMarkerAtDocumentPos(editor, pos);

        return (match) ? match.tagID : -1;
    }
    
    var voidElements = {
        area: true,
        base: true,
        basefont: true,
        br: true,
        col: true,
        command: true,
        embed: true,
        frame: true,
        hr: true,
        img: true,
        input: true,
        isindex: true,
        keygen: true,
        link: true,
        meta: true,
        param: true,
        source: true,
        track: true,
        wbr: true
    };
    
    function SimpleDOMBuilder(text, startOffset) {
        this.stack = [];
        this.t = new Tokenizer(text, {}, {
            onopentagend: this._handleOpenTagEnd.bind(this),
            onselfclosingtag: function () { },
            oncomment: function () { },
            ontext: function () { }
        });
        this.lastTag = null;
        this.currentTag = null;
        this.startOffset = startOffset || 0;
    }
    
    function _updateHash(node) {
        if (node.children) {
            var i,
                weight = 0,
                hashes = "";
            for (i = 0; i < node.children.length; i++) {
                weight += node.children[i].weight;
                hashes += node.children[i].signature;
            }
            node.weight = weight;
            node.signature = MurmurHash3.hashString(hashes, hashes.length, seed);
        } else {
            var tagLabel = node.tag + node.tagID;
            node.signature = MurmurHash3.hashString(tagLabel, tagLabel.length, seed);
        }
    }
    
    SimpleDOMBuilder.prototype._handleOpenTagEnd = function () {
        if (this.currentTag) {
            // We're closing an open tag. Record the end of the open tag as the end of the
            // range. (If we later find a close tag for this tag, the end will get overwritten
            // with the end of the close tag.)
            // TODO: current index is private in the tokenizer right now
            this.currentTag.end = this.startOffset + this.t._index + 1;
            this.lastTag = this.currentTag;
            this.currentTag = null;
        }
    };
    
    function getTextNodeID(textNode) {
        var childIndex = textNode.parent.children.indexOf(textNode);
        if (childIndex === 0) {
            return textNode.parent.tagID + ".0";
        }
        return textNode.parent.children[childIndex - 1] + "t";
    }
    
    SimpleDOMBuilder.prototype.build = function () {
        var token, tagLabel;
        var stack = this.stack;
        var attributeName = null;
        var nodeMap = {};
        var signatureMap = {};
        
        while ((token = this.t.nextToken()) !== null) {
            if (!token.contents) {
                console.error("Token has no contents: ", token);
            } else if (token.type === "opentagname") {
                var newTag = {
                    tag: token.contents,
                    children: [],
                    attributes: {},
                    parent: (stack.length ? stack[stack.length - 1] : null),
                    start: this.startOffset + token.start - 1,
                    weight: 0
                };
                newTag.tagID = this.getID(newTag);
                nodeMap[newTag.tagID] = newTag;
                if (newTag.parent) {
                    newTag.parent.children.push(newTag);
                }
                this.currentTag = newTag;
                if (voidElements.hasOwnProperty(newTag.tag)) {
                    tagLabel = newTag.tag + newTag.tagID;
                    newTag.weight = 0;
                    newTag.signature = MurmurHash3.hashString(tagLabel, tagLabel.length, seed);
                    signatureMap[newTag.signature] = newTag;
                } else {
                    stack.push(newTag);
                }
            } else if (token.type === "closetag") {
                this.lastTag = stack.pop();
                _updateHash(this.lastTag);
                this.lastTag.end = this.startOffset + token.end + 1;
                signatureMap[this.lastTag.signature] = this.lastTag;
                if (this.lastTag.tag !== token.contents) {
                    console.error("Mismatched tag: ", this.lastTag.tag, token.contents);
                }
            } else if (token.type === "attribname") {
                attributeName = token.contents;
            } else if (token.type === "attribvalue" && attributeName !== null) {
                this.currentTag.attributes[attributeName] = token.contents;
                attributeName = null;
            } else if (token.type === "text") {
                // TODO: Not clear why we need this since it should already have been nulled out in
                // _handleOpenTagEnd, but that doesn't seem to be sufficient for some reason.
                this.currentTag = null;
                if (stack.length) {
                    var parent = stack[stack.length - 1];
                    var newNode = {
                        parent: stack[stack.length - 1],
                        content: token.contents,
                        weight: token.contents.length,
                        signature: MurmurHash3.hashString(token.contents, token.contents.length, seed)
                    };
                    parent.children.push(newNode);
                    newNode.tagID = getTextNodeID(newNode);
                    nodeMap[newNode.tagID] = newNode;
                    signatureMap[newNode.signature] = newNode;
                }
            }
        }
        
        var dom = (stack.length ? stack[0] : this.lastTag);
        dom.nodeMap = nodeMap;
        dom.signatureMap = signatureMap;
        return dom;
    };
    
    SimpleDOMBuilder.prototype.getID = function () {
        return tagID++;
    };
    
    function _buildSimpleDOM(text) {
        var builder = new SimpleDOMBuilder(text);
        return builder.build();
    }
    
    // TODO: I'd be worried about stack overflows here
    function _markTags(cm, node) {
        node.children.forEach(function (childNode) {
            if (childNode.tag) {
                _markTags(cm, childNode);
            }
        });
        var mark = cm.markText(cm.posFromIndex(node.start), cm.posFromIndex(node.end));
        mark.tagID = node.tagID;
    }
    
    function _markTextFromDOM(editor, dom) {
        var cm = editor._codeMirror;
        
        // Remove existing marks
        var marks = cm.getAllMarks();
        cm.operation(function () {
            marks.forEach(function (mark) {
                if (mark.hasOwnProperty("tagID")) {
                    mark.clear();
                }
            });
        });
                
        // Mark
        _markTags(cm, dom);
    }
    
    function DOMUpdater(previousDOM, editor, changeList) {
        var text, startOffset = 0;

        // TODO: if there's more than one change in the changelist, we need to figure out how
        // to find all the affected ranges since we can't directly map the ranges of intermediate
        // changes to marked ranges after the fact. 
        //
        // Probably the best we can do is try to determine what the first and last affected positions
        // are in the whole changelist, then figure out what marks those positions are in, and walk
        // up the tree to the common parent. However, that's not trivial since each change's position
        // is specified in terms of the document's state after the previous change. It's probably easy
        // to find the first affected position, but harder to find the last. Perhaps we could just
        // dirty the whole doc after the first affected position.
        //
        // For now, just punt and redo the whole doc if there's more than one change.
        if (changeList && !changeList.next) {
            // If both the beginning and end of the change are still within the same marked
            // range after the change, then assume we can just dirty the tag containing them,
            // otherwise punt. (TODO: We could chase upward in the tree to find the common parent if
            // the tags for the beginning and end of the change are different.)
            var startMark = _getMarkerAtDocumentPos(editor, changeList.from),
                endMark = _getMarkerAtDocumentPos(editor, changeList.to);
            if (startMark && startMark === endMark) {
                var newMarkRange = startMark.find();
                if (newMarkRange) {
                    text = editor._codeMirror.getRange(newMarkRange.from, newMarkRange.to);
                    console.log("incremental update: " + text);
                    this.changedTagID = startMark.tagID;
                    startOffset = editor._codeMirror.indexFromPos(newMarkRange.from);
                }
            }
        }
        
        if (!this.changedTagID) {
            // We weren't able to incrementally update, so just rebuild and diff everything.
            text = editor.document.getText();
        }
        
        this.constructor(text, startOffset);
        this.editor = editor;
        this.cm = editor._codeMirror;
        this.previousDOM = previousDOM;
    }
    
    DOMUpdater.prototype = new SimpleDOMBuilder();
    
    DOMUpdater.prototype.getID = function (newTag) {
        // TODO: _getTagIDAtDocumentPos is likely a performance bottleneck
        // Get the mark at the start of the tagname (not before the beginning of the tag, because that's
        // actually inside the parent).
        var currentTagID = _getTagIDAtDocumentPos(this.editor, this.cm.posFromIndex(newTag.start + 1));
        if (currentTagID === -1 || (newTag.parent && currentTagID === newTag.parent.tagID)) {
            currentTagID = tagID++;
        }
        return currentTagID;
    };
    
    DOMUpdater.prototype.update = function () {
        var newSubtree = this.build(),
            result = {
                // default result if we didn't identify a changed portion
                newDOM: newSubtree,
                oldSubtree: this.previousDOM,
                newSubtree: newSubtree
            };

        if (this.changedTagID) {
            // Find the old subtree that's going to get swapped out.
            var oldSubtree = this.previousDOM.nodeMap[this.changedTagID],
                parent = oldSubtree.parent;
            
            // If we didn't have a parent, then the whole tree changed anyway, so
            // we'll just return the default result.
            if (parent) {
                var childIndex = parent.children.indexOf(oldSubtree);
                if (childIndex === -1) {
                    // This should never happen...
                    console.error("DOMUpdater.update(): couldn't locate old subtree in tree");
                } else {
                    // Swap the new subtree in place of the old subtree.
                    oldSubtree.parent = null;
                    newSubtree.parent = parent;
                    parent.children[childIndex] = newSubtree;
                    
                    // Overwrite any node mappings in the parent DOM with the
                    // mappings for the new subtree.
                    // TODO: this leaves garbage around if nodes are deleted in
                    // newSubtree
                    $.extend(this.previousDOM.nodeMap, newSubtree.nodeMap);
                    newSubtree.nodeMap = null;
                    
                    // Update the signatures for all parents of the new subtree.
                    var curParent = parent;
                    while (curParent) {
                        _updateHash(curParent);
                        curParent = curParent.parent;
                    }
                    
                    // TODO: add/update marked ranges for any nodes inside subtree
                    // (will need to offset the start/end of each node by the offset
                    // of the beginning of the changed range)
                    
                    result.newDOM = this.previousDOM;
                    result.oldSubtree = oldSubtree;
                }
            }
        }
        
        return result;
    };
    
    function attributeCompare(edits, oldNode, newNode) {
        // shallow copy the old attributes object so that we can modify it
        var oldAttributes = $.extend({}, oldNode.attributes),
            newAttributes = newNode.attributes;
        Object.keys(newAttributes).forEach(function (attributeName) {
            if (oldAttributes[attributeName] !== newAttributes[attributeName]) {
                var type = oldAttributes.hasOwnProperty(attributeName) ? "attrChange" : "attrAdd";
                edits.push({
                    type: type,
                    tagID: oldNode.tagID,
                    attribute: attributeName,
                    value: newAttributes[attributeName]
                });
            }
            delete oldAttributes[attributeName];
        });
        Object.keys(oldAttributes).forEach(function (attributeName) {
            edits.push({
                type: "attrDel",
                tagID: oldNode.tagID,
                attribute: attributeName
            });
        });
    }
    
    function NodeState(node) {
        this.node = node;
        this.childPointer = 0;
    }
    
    NodeState.prototype.toJSON = function () {
        return {
            tagID: this.node.tagID,
            childPointer: this.childPointer
        };
    };
    
    function DOMNavigator(root) {
        this.stack = [new NodeState(root)];
    }
    
    DOMNavigator.prototype.next = function () {
        var parentState = this.stack[this.stack.length - 1];
        var children = parentState.node.children;
        if (parentState.childPointer > children.length - 1) {
            this.stack.pop();
            if (this.stack.length === 0) {
                return null;
            }
            this.stack[this.stack.length - 1].childPointer++;
            return this.next();
        }
        var child = children[parentState.childPointer];
        if (child.children) {
            this.stack.push(new NodeState(child));
            return child;
        } else {
            parentState.childPointer++;
            return child;
        }
    };
    
    DOMNavigator.prototype.getPosition = function () {
        var parentState = this.stack[this.stack.length - 1];
        return {
            tagID: parentState.node.tagID,
            child: parentState.childPointer - 1
        };
    };
    
    function domdiffOld(edits, oldNode, newNode) {
        var oldNav = new DOMNavigator(oldNode),
            newNav = new DOMNavigator(newNode);
        
        attributeCompare(edits, oldNode, newNode);
        
        var oldChild = oldNav.next(),
            newChild = newNav.next();
        
        while (oldChild && newChild) {
            if (oldChild.tag && newChild.tag) {
                attributeCompare(edits, oldChild, newChild);
            
            // Check to see if they're both text nodes
            } else if (!oldChild.tag && !newChild.tag) {
                if (oldChild.content !== newChild.content) {
                    var position = oldNav.getPosition();
                    edits.push({
                        type: "textReplace",
                        tagID: position.tagID,
                        child: position.child,
                        content: newChild.content
                    });
                }
            }
            oldChild = oldNav.next();
            newChild = newNav.next();
        }
    }
    
    function compareByWeight(a, b) {
        return b.weight - a.weight;
    }
    
    function domdiff(oldNode, newNode) {
        var queue = new PriorityQueue(compareByWeight),
            edits = [],
            matches = {},
            elementInserts = {},
            textInserts = {},
            textChanges = {},
            currentElement,
            oldElement,
            elementDeletes = {};
        
        queue.push(newNode);
        
        while (currentElement = queue.shift()) {
            oldElement = oldNode.nodeMap[currentElement.tagID];
            if (oldElement) {
                matches[currentElement.tagID] = true;
                if (oldElement.children) {
                    if (oldElement.signature !== currentElement.signature) {
                        if (currentElement.children) {
                            currentElement.children.forEach(function (child) {
                                queue.push(child);
                            });
                        }
                    }
                } else {
                    if (oldElement.signature !== currentElement.signature) {
                        textChanges[currentElement.tagID] = true;
                    }
                }
            } else {
                if (currentElement.children) {
                    elementInserts[currentElement.tagID] = true;
                } else {
                    textInserts[currentElement.tagID] = true;
                }
                if (currentElement.children) {
                    currentElement.children.forEach(function (child) {
                        queue.push(child);
                    });
                }
            }
        }
        
        Object.keys(matches).forEach(function (tagID) {
            var currentElement;
            var subtreeRoot = newNode.nodeMap[tagID];
            if (subtreeRoot.children) {
                attributeCompare(edits, oldNode.nodeMap[tagID], subtreeRoot);
                var nav = new DOMNavigator(subtreeRoot);
                while (currentElement = nav.next()) {
                    var currentTagID = currentElement.tagID;
                    if (!oldNode.nodeMap[currentTagID]) {
                        // this condition can happen for new elements
                        continue;
                    }
                    matches[currentTagID] = true;
                    if (currentElement.children) {
                        attributeCompare(edits, oldNode.nodeMap[currentTagID], currentElement);
                    }
                }
            }
        });
        
        var initializeTextEdit = function (element) {
            var edit = {
                parentID: element.parent.tagID
            };
            
            var match = /(\d+)t/.exec(element.tagID);
            if (match) {
                edit.afterID = match[1];
            } else {
                edit.firstChild = true;
            }
            return edit;
        }
        
        var findDeletions = function (element) {
            if (!matches[element.tagID]) {
                if (element.children) {
                    edits.push({
                        type: "elementDelete",
                        tagID: element.tagID
                    });
                } else {
                    var edit = initializeTextEdit(element);
                    edit.type = "textDelete";
                    edits.push(edit);
                }
            } else if (element.children) {
                var i;
                for (i = 0; i < element.children.length; i++) {
                    findDeletions(element.children[i]);
                }
            }
        };
        
        findDeletions(oldNode);
        
        Object.keys(elementInserts).forEach(function (nonMatchingID) {
            var newElement = newNode.nodeMap[nonMatchingID];
            var childIndex = newElement.parent.children.indexOf(newElement);
            edits.push({
                type: "elementInsert",
                tagID: newElement.tagID,
                tag: newElement.tag,
                attributes: newElement.attributes,
                parentID: newElement.parent.tagID,
                child: childIndex
            });
        });
        
        Object.keys(textInserts).forEach(function (nonMatchingID) {
            var newElement = newNode.nodeMap[nonMatchingID];
            edits.push({
                type: "textInsert",
                tagID: newElement.parent.tagID,
                child: newElement.parent.children.indexOf(newElement),
                content: newElement.content
            });
        });
        
        Object.keys(textChanges).forEach(function (changedID) {
            var changedElement = newNode.nodeMap[changedID];
            var edit = initializeTextEdit(changedElement);
            edit.type = "textReplace";
            edit.content = changedElement.content;            
            edits.push(edit);
        });
        return edits;
    }
    
    function _updateDOM(previousDOM, editor, changeList) {
        var updater = new DOMUpdater(previousDOM, editor, changeList);
        var result = updater.update();
        var edits = domdiff(result.oldSubtree, result.newSubtree);
        return {
            dom: result.newDOM,
            edits: edits
        };
    }
    
    function getUnappliedEditList(editor, changeList) {
        var cachedValue = _cachedValues[editor.document.file.fullPath];
        if (!cachedValue || !cachedValue.dom) {
            console.warn("No previous DOM to compare change against");
            return [];
        } else {
            var result = _updateDOM(cachedValue.dom, editor, changeList);
            _cachedValues[editor.document.file.fullPath] = {
                timestamp: editor.document.diskTimestamp, // TODO: update?
                dom: result.dom
            };
            return result.edits;
        }
    }
    
    $(DocumentManager).on("beforeDocumentDelete", _removeDocFromCache);
    
    exports.scanDocument = scanDocument;
    exports.generateInstrumentedHTML = generateInstrumentedHTML;
    exports.getUnappliedEditList = getUnappliedEditList;
    exports._markText = _markText;
    exports._getMarkerAtDocumentPos = _getMarkerAtDocumentPos;
    exports._getTagIDAtDocumentPos = _getTagIDAtDocumentPos;
    exports._buildSimpleDOM = _buildSimpleDOM;
    exports._markTextFromDOM = _markTextFromDOM;
    exports._updateDOM = _updateDOM;
    exports._DOMNavigator = DOMNavigator;
    exports._seed = seed;
});
