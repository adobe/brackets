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
    
    var allowIncremental = true;
    
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
    
    /**
     * A list of tags whose start causes any of a given set of immediate parent
     * tags to close. This mostly comes from the HTML5 spec section on omitted close tags:
     * http://www.w3.org/html/wg/drafts/html/master/syntax.html#optional-tags
     * This doesn't handle general content model violations.
     */
    var openImpliesClose = {
        li      : { li: true },
        dt      : { dd: true, dt: true },
        dd      : { dd: true, dt: true },
        address : { p: true },
        article : { p: true },
        aside   : { p: true },
        blockquote : { p: true },
        dir     : { p: true },
        div     : { p: true },
        dl      : { p: true },
        fieldset: { p: true },
        footer  : { p: true },
        form    : { p: true },
        h1      : { p: true },
        h2      : { p: true },
        h3      : { p: true },
        h4      : { p: true },
        h5      : { p: true },
        h6      : { p: true },
        header  : { p: true },
        hgroup  : { p: true },
        hr      : { p: true },
        main    : { p: true },
        menu    : { p: true },
        nav     : { p: true },
        ol      : { p: true },
        p       : { p: true },
        pre     : { p: true },
        section : { p: true },
        table   : { p: true },
        ul      : { p: true },
        rt      : { rp: true, rt: true },
        rp      : { rp: true, rt: true },
        optgroup: { optgroup: true, option: true },
        option  : { option: true },
        tbody   : { thead: true, tbody: true, tfoot: true },
        tfoot   : { tbody: true },
        tr      : { tr: true, th: true, td: true },
        th      : { th: true, td: true },
        td      : { thead: true, th: true, td: true },
        body    : { head: true, link: true, script: true }
    };

    /**
     * A list of tags that are self-closing (do not contain other elements).
     * Mostly taken from http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
     */
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
        menuitem: true,
        meta: true,
        param: true,
        source: true,
        track: true,
        wbr: true
    };
    
    function SimpleDOMBuilder(text, startOffset) {
        this.stack = [];
        this.text = text;
        this.t = new Tokenizer(text);
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
    
    function getTextNodeID(textNode) {
        var childIndex = textNode.parent.children.indexOf(textNode);
        if (childIndex === 0) {
            return textNode.parent.tagID + ".0";
        }
        return textNode.parent.children[childIndex - 1].tagID + "t";
    }
    

    function _getTextNodeHash(text) {
        return MurmurHash3.hashString(text, text.length, seed);
    }
    
    SimpleDOMBuilder.prototype.build = function (strict) {
        var self = this;
        var token, tagLabel, lastClosedTag, lastIndex = 0;
        var stack = this.stack;
        var attributeName = null;
        var nodeMap = {};
        // TODO: remove the signatureMap, it's no longer needed
        var signatureMap = {};
        
        function closeTag(endIndex) {
            lastClosedTag = stack[stack.length - 1];
            stack.pop();
            _updateHash(lastClosedTag);
            
            lastClosedTag.end = self.startOffset + endIndex;
            signatureMap[lastClosedTag.signature] = lastClosedTag;
        }
        
        while ((token = this.t.nextToken()) !== null) {
            if (token.type === "error") {
                return null;
            } else if (token.type === "opentagname") {
                var newTag = {
                    tag: token.contents.toLowerCase(),
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
                
                if (openImpliesClose.hasOwnProperty(newTag.tag)) {
                    var closable = openImpliesClose[newTag.tag];
                    while (stack.length > 0 && closable.hasOwnProperty(stack[stack.length - 1].tag)) {
                        // Close the previous tag at the start of this tag.
                        // Adjust backwards for the < before the tag name.
                        closeTag(token.start - 1);
                    }
                }
                
                if (voidElements.hasOwnProperty(newTag.tag)) {
                    // This is a self-closing element.
                    tagLabel = newTag.tag + newTag.tagID;
                    newTag.weight = 0;
                    newTag.signature = MurmurHash3.hashString(tagLabel, tagLabel.length, seed);
                    signatureMap[newTag.signature] = newTag;
                } else {
                    stack.push(newTag);
                }
            } else if (token.type === "opentagend" || token.type === "selfclosingtag") {
                // TODO: disallow <p/>?
                if (this.currentTag) {
                    // We're closing an open tag. Record the end of the open tag as the end of the
                    // range. (If we later find a close tag for this tag, the end will get overwritten
                    // with the end of the close tag. In the case of a self-closing tag, we should never
                    // encounter that.)
                    // Note that we don't need to update the signature here because the signature only
                    // relies on the tag name and ID, and isn't affected by the tag's attributes, so
                    // the signature we calculated when creating the tag is still the same. If we later
                    // find a close tag for this tag, we'll update the signature to account for its
                    // children at that point (in the next "else" case).
                    this.currentTag.end = this.startOffset + token.end;
                    lastClosedTag = this.currentTag;
                    this.currentTag = null;
                }
            } else if (token.type === "closetag") {
                // If this is a self-closing element, ignore the close tag.
                var closeTagName = token.contents.toLowerCase();
                if (!voidElements.hasOwnProperty(closeTagName)) {
                    // Find the topmost item on the stack that matches. If we can't find one, assume
                    // this is just a dangling closing tag and ignore it.
                    var i;
                    for (i = stack.length - 1; i >= 0; i--) {
                        if (stack[i].tag === closeTagName) {
                            break;
                        }
                    }
                    if (strict && i !== stack.length - 1) {
                        // If we're in strict mode, treat unbalanced tags as invalid.
                        return null;
                    }
                    if (i >= 0) {
                        do {
                            // For all tags we're implicitly closing (before we hit the matching tag), we want the
                            // implied end to be the beginning of the close tag (which is two characters, "</", before
                            // the start of the tagname). For the actual tag we're explicitly closing, we want the
                            // implied end to be the end of the close tag (which is one character, ">", after the end of
                            // the tagname).
                            closeTag(stack.length === i + 1 ? token.end + 1 : token.start - 2);
                        } while (stack.length > i);
                    } else {
                        // If we're in strict mode, treat unmatched close tags as invalid. Otherwise
                        // we just silently ignore them.
                        if (strict) {
                            return null;
                        }
                    }
                }
            } else if (token.type === "attribname") {
                attributeName = token.contents.toLowerCase();
                // Set the value to the empty string in case this is an empty attribute. If it's not,
                // it will get overwritten by the attribvalue later.
                this.currentTag.attributes[attributeName] = "";
            } else if (token.type === "attribvalue" && attributeName !== null) {
                this.currentTag.attributes[attributeName] = token.contents;
                attributeName = null;
            } else if (token.type === "text") {
                if (stack.length) {
                    var parent = stack[stack.length - 1];
                    var newNode = {
                        parent: stack[stack.length - 1],
                        content: token.contents,
                        weight: token.contents.length
                    };
                    newNode.signature = _getTextNodeHash(newNode.content);
                    parent.children.push(newNode);
                    newNode.tagID = getTextNodeID(newNode);
                    nodeMap[newNode.tagID] = newNode;
                    signatureMap[newNode.signature] = newNode;
                }
            }
            lastIndex = token.end;
        }
        
        // If we have any tags hanging open (e.g. html or body), fail the parse if we're in strict mode,
        // otherwise close them at the end of the document.
        if (strict && stack.length) {
            return null;
        }
        while (stack.length) {
            closeTag(this.text.length - this.startOffset);
        }
        
        var dom = lastClosedTag;
        dom.nodeMap = nodeMap;
        dom.signatureMap = signatureMap;
        return dom;
    };
    
    SimpleDOMBuilder.prototype.getID = function () {
        return tagID++;
    };
    
    function _buildSimpleDOM(text, strict) {
        var builder = new SimpleDOMBuilder(text);
        return builder.build(strict);
    }
    
    function _dumpDOM(root) {
        var result = "",
            indent = "";
        
        function walk(node) {
            if (node.tag) {
                result += indent + "TAG " + node.tagID + " " + node.tag + " " + JSON.stringify(node.attributes) + "\n";
            } else {
                result += indent + "TEXT " + node.tagID + " " + node.content + "\n";
            }
            if (node.children) {
                indent += "  ";
                node.children.forEach(walk);
                indent = indent.slice(2);
            }
        }
        walk(root);
        
        return result;
    }
    
    /**
     * Recursively walks the SimpleDOM starting at node and marking
     * all tags in the CodeMirror instance. The more useful interface
     * is the _markTextFromDOM function which clears existing marks
     * before calling this function to create new ones.
     *
     * @param {CodeMirror} cm CodeMirror instance in which to mark tags
     * @param {Object} node SimpleDOM node to use as the root for marking
     */
    function _markTags(cm, node) {
        node.children.forEach(function (childNode) {
            if (childNode.tag) {
                _markTags(cm, childNode);
            }
        });
        var mark = cm.markText(cm.posFromIndex(node.start), cm.posFromIndex(node.end));
        mark.tagID = node.tagID;
    }
    
    /**
     * Clears the marks from the document and creates new ones.
     *
     * @param {Editor} editor Editor object holding this document
     * @param {Object} dom SimpleDOM root object that contains the parsed structure
     */
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

        this.isIncremental = false;
        
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
                    //console.log("incremental update: " + text);
                    this.changedTagID = startMark.tagID;
                    startOffset = editor._codeMirror.indexFromPos(newMarkRange.from);
                    this.isIncremental = true;
                }
            }
        }
        
        if (!this.changedTagID) {
            // We weren't able to incrementally update, so just rebuild and diff everything.
            text = editor.document.getText();
        }
        
        SimpleDOMBuilder.call(this, text, startOffset);
        this.editor = editor;
        this.cm = editor._codeMirror;
        this.previousDOM = previousDOM;
    }
    
    DOMUpdater.prototype = Object.create(SimpleDOMBuilder.prototype);
    
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
    
    DOMUpdater.prototype._updateMarkedRanges = function (nodeMap) {
        // TODO: this is really inefficient - should we cache the mark for each node?
        var updateIDs = Object.keys(nodeMap),
            cm = this.cm,
            marks = cm.getAllMarks();
        marks.forEach(function (mark) {
            if (mark.hasOwnProperty("tagID") && nodeMap[mark.tagID]) {
                var node = nodeMap[mark.tagID];
                mark.clear();
                mark = cm.markText(cm.posFromIndex(node.start), cm.posFromIndex(node.end));
                mark.tagID = node.tagID;
                updateIDs.splice(updateIDs.indexOf(node.tagID), 1);
            }
        });
        
        // Any remaining updateIDs are new.
        updateIDs.forEach(function (id) {
            var node = nodeMap[id],
                mark = cm.markText(cm.posFromIndex(node.start), cm.posFromIndex(node.end));
            mark.tagID = id;
        });
    };
    
    DOMUpdater.prototype._buildNodeMap = function (root) {
        var nodeMap = {};
        
        function walk(node) {
            if (node.tagID) {
                nodeMap[node.tagID] = node;
            }
            if (node.children) {
                node.children.forEach(walk);
            }
        }
        
        walk(root);
        root.nodeMap = nodeMap;
    };
    
    DOMUpdater.prototype._handleDeletions = function (nodeMap, oldSubtreeMap, newSubtreeMap) {
        var deletedIDs = [];
        Object.keys(oldSubtreeMap).forEach(function (key) {
            if (!newSubtreeMap.hasOwnProperty(key)) {
                deletedIDs.push(key);
                delete nodeMap[key];
            }
        });
        
        // TODO: again, really inefficient - should we cache the mark for each node?
        var marks = this.cm.getAllMarks();
        marks.forEach(function (mark) {
            if (mark.hasOwnProperty("tagID") && deletedIDs.indexOf(mark.tagID) !== -1) {
                mark.clear();
            }
        });
    };
    
    DOMUpdater.prototype.update = function () {
        // If we're doing an incremental update, we want to do a stricter parse, and fail
        // if there are any unbalanced tags.
        var newSubtree = this.build(this.isIncremental),
            result = {
                // default result if we didn't identify a changed portion
                newDOM: newSubtree,
                oldSubtree: this.previousDOM,
                newSubtree: newSubtree
            };
        
        if (!newSubtree) {
            return null;
        }

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
                    // mappings for the new subtree. We keep the nodeMap around
                    // on the new subtree so that the differ can use it later.
                    // TODO: should we ever null out the nodeMap on the subtree?
                    $.extend(this.previousDOM.nodeMap, newSubtree.nodeMap);
                    
                    // Update marked ranges for all items in the new subtree.
                    this._updateMarkedRanges(newSubtree.nodeMap);
                    
                    // Build a local nodeMap for the old subtree so the differ can
                    // use it.
                    this._buildNodeMap(oldSubtree);
                    
                    // Clean up the info for any deleted nodes that are no longer in
                    // the new tree.
                    this._handleDeletions(this.previousDOM.nodeMap, oldSubtree.nodeMap, newSubtree.nodeMap);
                    
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
        } else {
            _markTextFromDOM(this.editor, result.newDOM);
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
    
    /**
     * The position of text nodes and elements are determined by their
     * surroundings. For a given node, which is provided to this function
     * as siblings[index], this function will look left or right
     * through the list of siblings starting at the given index. It
     * will look for either an element immediately in the chosen direction
     * or a text node and then, optionally, an element.
     *
     * Note that this function assumes that there are no comment nodes
     * and no runs of multiple text nodes.
     *
     * @param {Array} siblings List of nodes that are siblings to the target node
     * @param {integer} index Index into the siblings list for the target node
     * @param {boolean} left True to look left, falsy value to look right
     * @return {Object} each field of the return is optional. `element` contains the next element found if there was one, `text` contains the text node in between if there was one. If there is only a text node in the given direction, then just `text` will be set. `firstChild` and `lastChild` reflect if the index is at the beginning or end of the list.
     */
    function _findElementAndText(siblings, index, left) {
        var step = left ? -1 : 1,
            guard = left ? -1 : siblings.length,
            result = {};
        
        var nextToCheck = index + step;
        
        // if there are no more elements in the direction we're going
        // then we are done looking
        if (nextToCheck === guard) {
            if (left) {
                result.firstChild = true;
            } else {
                result.lastChild = true;
            }
            return result;
        }
        
        var elementOrText = siblings[nextToCheck];
        if (elementOrText.children) {
            result.element = elementOrText;
        } else {
            result.text = elementOrText;
            nextToCheck += step;
            if (nextToCheck !== guard) {
                result.element = siblings[nextToCheck];
            }
        }
        return result;
    }
    
    /**
     * Finds the neighbors around the given SimpleDOM node. The return
     * value has what it saw to the left and to the right. See
     * the return value of _findElementAndText to see what left and right
     * contain.
     *
     * @param {Object} node SimpleDOM node for which to find the neighbors
     * @return {Object} object with left and right neighbors, each with element/text/firstChild/lastChild.
     */
    function findNeighbors(node) {
        var siblings = node.parent.children;
        var childIndex = siblings.indexOf(node);
        var neighbors = {};
        neighbors.left = _findElementAndText(siblings, childIndex, true);
        neighbors.right = _findElementAndText(siblings, childIndex, false);
        return neighbors;
    }
    
    /**
     * Comparison function that compares based on the weight property
     * of the given objects.
     *
     * @param {Object} a first for comparison
     * @param {Object} b second for comparison
     * @return {integer} negative number if A > B, 0 if equal, positive if B > A
     */
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
        
        // extract forEach iterator callback
        var queuePush = function (child) { queue.push(child); };
        
        do {
            // we can assume queue is non-empty for the first loop iteration
            currentElement = queue.shift();
            
            oldElement = oldNode.nodeMap[currentElement.tagID];
            if (oldElement) {
                matches[currentElement.tagID] = true;
                if (oldElement.children) {
                    if (oldElement.signature !== currentElement.signature) {
                        if (currentElement.children) {
                            currentElement.children.forEach(queuePush);
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
                    currentElement.children.forEach(queuePush);
                }
            }
        } while (queue.length);
        
        Object.keys(matches).forEach(function (tagID) {
            var subtreeRoot = newNode.nodeMap[tagID];
            if (subtreeRoot.children) {
                attributeCompare(edits, oldNode.nodeMap[tagID], subtreeRoot);
                var nav = new DOMNavigator(subtreeRoot),
                    currentElement;
                
                // breadth-first traversal of DOM tree to diff attributes and match up the old and new nodes
                while (true) {
                    currentElement = nav.next();
                    
                    if (!currentElement) {
                        break;
                    }
                    
                    var currentTagID = currentElement.tagID;
                    
                    if (oldNode.nodeMap[currentTagID]) {
                        matches[currentTagID] = true;
                        if (currentElement.children) {
                            attributeCompare(edits, oldNode.nodeMap[currentTagID], currentElement);
                        }
                    }
                }
            }
        });
        
        /**
         * The position of a text node is given by its parent
         * and, more importantly, the elements immediately surrounding it.
         * This function will add position information to the given edit as
         * afterID and beforeID, along with the parentID. If afterID and
         * beforeID are missing, that means that the text node is the only
         * child of the parent.
         * 
         * @param {Object} edit The edit object to augment with position
         * @param {Object} node The SimpleDOM node that is the target of the edit
         */
        function addPositionToTextEdit(edit, node) {
            edit.parentID = node.parent.tagID;
            var neighbors = findNeighbors(node);
            if (neighbors.left.element) {
                edit.afterID = neighbors.left.element.tagID;
            }
            var text = neighbors.left.text;
            if (neighbors.right.element) {
                edit.beforeID = neighbors.right.element.tagID;
            }
        }
        
        /**
         * Describing the position of an element insertion follows these
         * heuristics:
         *
         * 1. If the element comes at the beginning or end of the list of
         *    the parent's children, firstChild or lastChild is set on the edit
         * 2. If there is an element after the element that is being inserted,
         *    beforeID is set and the element should be inserted immediately
         *    before the element with the given ID.
         * 3. If there is no element after the given one, then afterID is
         *    given and the new element is inserted immediately after that
         *    one.
         * 
         */
        function addPositionToEdit(edit, element) {
            edit.parentID = element.parent.tagID;
            var neighbors = findNeighbors(element);
            if (neighbors.left.firstChild) {
                edit.firstChild = true;
            } else if (neighbors.right.lastChild) {
                edit.lastChild = true;
            } else {
                if (neighbors.right.element) {
                    edit.beforeID = neighbors.right.element.tagID;
                } else if (neighbors.left.element) {
                    edit.afterID = neighbors.left.element.tagID;
                }
            }
        }
        
        var findDeletions = function (element) {
            if (!matches[element.tagID]) {
                if (element.children) {
                    edits.push({
                        type: "elementDelete",
                        tagID: element.tagID
                    });
                } else {
                    var edit = {
                        type: "textDelete"
                    };
                    addPositionToTextEdit(edit, element);
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
            var edit = {
                type: "elementInsert",
                tagID: newElement.tagID,
                tag: newElement.tag,
                attributes: newElement.attributes
            };
            addPositionToEdit(edit, newElement);
            edits.push(edit);
        });
        
        Object.keys(textInserts).forEach(function (nonMatchingID) {
            var newElement = newNode.nodeMap[nonMatchingID];
            var edit = {
                type: "textInsert",
                content: newElement.content
            };
            addPositionToTextEdit(edit, newElement);
            edits.push(edit);
        });
        
        Object.keys(textChanges).forEach(function (changedID) {
            var changedElement = newNode.nodeMap[changedID];
            var edit = {
                type: "textReplace",
                content: changedElement.content
            };
            addPositionToTextEdit(edit, changedElement);
            edits.push(edit);
        });
        return edits;
    }
    
    function _updateDOM(previousDOM, editor, changeList) {
        if (!allowIncremental) {
            changeList = undefined;
        }
        var updater = new DOMUpdater(previousDOM, editor, changeList);
        var result = updater.update();
        if (!result) {
            return null;
        }
        
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
            if (_cachedValues[editor.document.file.fullPath].invalid) {
                // We were in an invalid state, so do a full rebuild.
                changeList = null;
            }
            var result = _updateDOM(cachedValue.dom, editor, changeList);
            if (result) {
                _cachedValues[editor.document.file.fullPath] = {
                    timestamp: editor.document.diskTimestamp, // TODO: update?
                    dom: result.dom
                };
                return result.edits;
            } else {
                _cachedValues[editor.document.file.fullPath].invalid = true;
                return [];
            }
        }
    }
    
    /**
     * @private
     * Add SimpleDOMBuilder metadata to browser DOM tree JSON representation
     * @param {Object} root
     */
    function _processBrowserSimpleDOM(browserRoot, editorRootTagID) {
        var nodeMap         = {},
            signatureMap    = {},
            root;
        
        function _processElement(elem) {
            elem.tagID = elem.attributes["data-brackets-id"];
            elem.weight = 0;
            
            // remove data-brackets-id attribute for diff
            delete elem.attributes["data-brackets-id"];
            
            elem.children.forEach(function (child) {
                // set parent
                child.parent = elem;
                
                if (child.children) {
                    _processElement(child);
                } else if (child.content) {
                    child.weight = child.content.length;
                    child.signature = _getTextNodeHash(child.content);
                    child.tagID = getTextNodeID(child);
                    
                    nodeMap[child.tagID] = child;
                    signatureMap[child.signature] = child;
                }
            });
            
            elem.signature = _updateHash(elem);
            
            nodeMap[elem.tagID] = elem;
            signatureMap[elem.signature] = elem;

            // Choose the root element based on the root tag in the editor.
            // The browser may insert html, head and body elements if missing.
            if (elem.tagID === editorRootTagID) {
                root = elem;
            }
        }
        
        _processElement(browserRoot);

        root = root || browserRoot;
        root.nodeMap = nodeMap;
        root.signatureMap = signatureMap;

        return root;
    }
    
    /**
     * @private
     * Diff the browser DOM with the in-editor DOM
     * @param {Editor} editor
     * @param {Object} browserSimpleDOM
     */
    function _getBrowserDiff(editor, browserSimpleDOM) {
        var cachedValue = _cachedValues[editor.document.file.fullPath],
            editorRoot  = cachedValue.dom,
            browserRoot;
        
        browserRoot = _processBrowserSimpleDOM(browserSimpleDOM, editorRoot.tagID);
        
        return {
            diff    : domdiff(editorRoot, browserRoot),
            browser : browserRoot,
            editor  : editorRoot
        };
    }
    
    $(DocumentManager).on("beforeDocumentDelete", _removeDocFromCache);
    
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
        
        if (dom) {
            // Cache results
            _cachedValues[doc.file.fullPath] = {
                timestamp: doc.diskTimestamp,
                dom: dom,
                dirty: false
            };
        }
        
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
            orig = doc.getText(),
            gen = "",
            lastIndex = 0;
        
        if (!dom) {
            return null;
        }
        
        // Walk through the dom nodes and insert the 'data-brackets-id' attribute at the
        // end of the open tag        
        function walk(node) {
            if (node.tag) {
                var attrText = " data-brackets-id='" + node.tagID + "'";
                
                // Insert the attribute as the first attribute in the tag.
                var insertIndex = node.start + node.tag.length + 1;
                gen += orig.substr(lastIndex, insertIndex - lastIndex) + attrText;
                lastIndex = insertIndex;
            }
            
            if (node.children) {
                node.children.forEach(walk);
            }
        }
        
        walk(dom);
        gen += orig.substr(lastIndex);
        
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

    // private methods
    exports._markText                   = _markText;
    exports._getMarkerAtDocumentPos     = _getMarkerAtDocumentPos;
    exports._getTagIDAtDocumentPos      = _getTagIDAtDocumentPos;
    exports._buildSimpleDOM             = _buildSimpleDOM;
    exports._markTextFromDOM            = _markTextFromDOM;
    exports._updateDOM                  = _updateDOM;
    exports._DOMNavigator               = DOMNavigator;
    exports._seed                       = seed;
    exports._allowIncremental           = allowIncremental;
    exports._dumpDOM                    = _dumpDOM;
    exports._getBrowserDiff             = _getBrowserDiff;
    exports._findElementAndText         = _findElementAndText;
    
    // public API
    exports.scanDocument                = scanDocument;
    exports.generateInstrumentedHTML    = generateInstrumentedHTML;
    exports.getUnappliedEditList        = getUnappliedEditList;
});
