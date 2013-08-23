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
        MurmurHash3     = require("thirdparty/murmurhash3_gc"),
        PerfUtils       = require("utils/PerfUtils");
    
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
    
    function _getMarkerAtDocumentPos(editor, pos, preferParent) {
        var i,
            cm = editor._codeMirror,
            marks = cm.findMarksAt(pos),
            match,
            range;
        
        function posEq(pos1, pos2) {
            return pos1.line === pos2.line && pos1.ch === pos2.ch;
        }
        
        if (!marks.length) {
            return null;
        }
        
        marks.sort(function (mark1, mark2) {
            // All marks should exist since we just got them from CodeMirror.
            var mark1From = mark1.find().from, mark2From = mark2.find().from;
            return (mark1From.line === mark2From.line ? mark1From.ch - mark2From.ch : mark1From.line - mark2From.line);
        });
        
        // The mark with the latest start is the innermost one.
        match = marks[marks.length - 1];
        if (preferParent) {
            // If the match is exactly at the edge of the range and preferParent is set,
            // we want to pop upwards.
            range = match.find();
            if (posEq(range.from, pos) || posEq(range.to, pos)) {
                if (marks.length > 1) {
                    match = marks[marks.length - 2];
                } else {
                    // We must be outside the root, so there's no containing tag.
                    match = null;
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
                weight = 1,
                subtreeHashes = "",
                childHashes = "",
                child;
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                weight += child.weight;
                if (child.children) {
                    childHashes += child.tagID;
                    subtreeHashes += child.attributeSignature + child.subtreeSignature;
                } else {
                    childHashes += child.textSignature;
                    subtreeHashes += child.textSignature;
                }
            }
            node.weight = weight;
            node.childSignature = MurmurHash3.hashString(childHashes, childHashes.length, seed);
            node.subtreeSignature = MurmurHash3.hashString(subtreeHashes, subtreeHashes.length, seed);
        } else {
            node.textSignature = MurmurHash3.hashString(node.content, node.content.length, seed);
        }
    }
    
    function _updateAttributeHash(node) {
        var attributeString = JSON.stringify(node.attributes);
        node.attributeSignature = MurmurHash3.hashString(attributeString, attributeString.length, seed);
    }
    
    /**
     * Generates a synthetic ID for text nodes. These IDs are only used
     * for comparison purposes in the SimpleDOM structure, since we can't
     * apply IDs to text nodes in the browser.
     *
     * TODO/Note: When generating a diff, the decision to do a textReplace 
     * edit rather than a textDelete/textInsert hinges on how this ID
     * is treated (because it is currently based on the previous or
     * parent node).
     *
     * @param {Object} textNode new node for which we are generating an ID
     * @return {string} ID for the node
     */
    function getTextNodeID(textNode) {
        var childIndex = textNode.parent.children.indexOf(textNode);
        if (childIndex === 0) {
            return textNode.parent.tagID + ".0";
        }
        return textNode.parent.children[childIndex - 1].tagID + "t";
    }
    

    SimpleDOMBuilder.prototype.build = function (strict) {
        var self = this;
        var token, tagLabel, lastClosedTag, lastTextNode, lastIndex = 0;
        var stack = this.stack;
        var attributeName = null;
        var nodeMap = {};
        
        // Start timers for building full and partial DOMs.
        // Appropriate timer is used, and the other is discarded.
        var timerBuildFull = "HTMLInstr. Build DOM Full";
        var timerBuildPart = "HTMLInstr. Build DOM Partial";
        PerfUtils.markStart([timerBuildFull, timerBuildPart]);
        
        function closeTag(endIndex) {
            lastClosedTag = stack[stack.length - 1];
            stack.pop();
            _updateHash(lastClosedTag);
            
            lastClosedTag.end = self.startOffset + endIndex;
        }
        
        while ((token = this.t.nextToken()) !== null) {
            // lastTextNode is used to glue text nodes together
            // If the last node we saw was text but this one is not, then we're done gluing.
            // If this node is a comment, we might still encounter more text.
            if (token.type !== "text" && token.type !== "comment" && lastTextNode) {
                lastTextNode = null;
            }
            
            if (token.type === "error") {
                PerfUtils.finalizeMeasurement(timerBuildFull);  // discard
                PerfUtils.addMeasurement(timerBuildPart);       // use
                return null;
            } else if (token.type === "opentagname") {
                var newTagName = token.contents.toLowerCase(),
                    newTag;
                
                if (openImpliesClose.hasOwnProperty(newTagName)) {
                    var closable = openImpliesClose[newTagName];
                    while (stack.length > 0 && closable.hasOwnProperty(stack[stack.length - 1].tag)) {
                        // Close the previous tag at the start of this tag.
                        // Adjust backwards for the < before the tag name.
                        closeTag(token.start - 1);
                    }
                }
                
                newTag = {
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
                
                if (voidElements.hasOwnProperty(newTag.tag)) {
                    // This is a self-closing element.
                    tagLabel = newTag.tag + newTag.tagID;
                    _updateHash(newTag);
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
                    _updateAttributeHash(this.currentTag);
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
                        PerfUtils.finalizeMeasurement(timerBuildFull);
                        PerfUtils.addMeasurement(timerBuildPart);
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
                            PerfUtils.finalizeMeasurement(timerBuildFull);
                            PerfUtils.addMeasurement(timerBuildPart);
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
                    var newNode;
                    
                    // Check to see if we're continuing a previous text.
                    if (lastTextNode) {
                        newNode = lastTextNode;
                        newNode.content += token.contents;
                    } else {
                        newNode = {
                            parent: stack[stack.length - 1],
                            content: token.contents
                        };
                        parent.children.push(newNode);
                        newNode.tagID = getTextNodeID(newNode);
                        nodeMap[newNode.tagID] = newNode;
                        lastTextNode = newNode;
                    }
                    
                    // TODO is there any performance impact of using a floating point
                    // number vs. integer here?
                    newNode.weight = 1 + Math.log(newNode.content.length);
                    _updateHash(newNode);
                }
            }
            lastIndex = token.end;
        }
        
        // If we have any tags hanging open (e.g. html or body), fail the parse if we're in strict mode,
        // otherwise close them at the end of the document.
        if (strict && stack.length) {
            PerfUtils.finalizeMeasurement(timerBuildFull);
            PerfUtils.addMeasurement(timerBuildPart);
            return null;
        }
        while (stack.length) {
            closeTag(this.text.length - this.startOffset);
        }
        
        var dom = lastClosedTag;
        dom.nodeMap = nodeMap;
        PerfUtils.addMeasurement(timerBuildFull);       // use
        PerfUtils.finalizeMeasurement(timerBuildPart);  // discard
        
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
        
        function isDangerousEdit(text) {
            // We don't consider & dangerous since entities only affect text content, not
            // overall DOM structure.
            return (/[<>\/=\"\']/).test(text);
        }
        
        // If there's more than one change, be conservative and assume we have to do a full reparse.
        if (changeList && !changeList.next) {
            // If the inserted or removed text doesn't have any characters that could change the
            // structure of the DOM (e.g. by adding or removing a tag boundary), then we can do
            // an incremental reparse of just the parent tag containing the edit. This should just
            // be the marked range that contains the beginning of the edit range, since that position
            // isn't changed by the edit.
            if (!isDangerousEdit(changeList.text) && !isDangerousEdit(changeList.removed)) {
                // If the edit is right at the beginning or end of a tag, we want to be conservative
                // and use the parent as the edit range.
                var startMark = _getMarkerAtDocumentPos(editor, changeList.from, true);
                if (startMark) {
                    var range = startMark.find();
                    if (range) {
                        text = editor._codeMirror.getRange(range.from, range.to);
                        //console.log("incremental update: " + text);
                        this.changedTagID = startMark.tagID;
                        startOffset = editor._codeMirror.indexFromPos(range.from);
                        this.isIncremental = true;
                    }
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
    
    function hasAncestorWithID(tag, id) {
        var ancestor = tag.parent;
        while (ancestor && ancestor.tagID !== id) {
            ancestor = ancestor.parent;
        }
        return !!ancestor;
    }
    
    DOMUpdater.prototype.getID = function (newTag) {
        // TODO: _getTagIDAtDocumentPos is likely a performance bottleneck
        // Get the mark at the start of the tagname (not before the beginning of the tag, because that's
        // actually inside the parent).
        var currentTagID = _getTagIDAtDocumentPos(this.editor, this.cm.posFromIndex(newTag.start + 1));
        
        // If the new tag is in an unmarked range, or the marked range actually corresponds to an
        // ancestor tag, then this must be a newly inserted tag, so give it a new tag ID.
        if (currentTagID === -1 || hasAncestorWithID(newTag, currentTagID)) {
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
            mark.tagID = Number(id);
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
        var newSubtree = this.build(true),
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
        var queue = [],
            edits = [],
            matches = {},
            elementInserts = {},
            textInserts = {},
            textChanges = {},
            elementsWithTextChanges = {},
            currentElement,
            oldElement,
            elementDeletes = {};
        
        var generateChildEdits = function (currentElement, oldElement) {
            var i = 0,
                j = 0,
                currentChildren = currentElement.children,
                oldChildren = oldElement ? oldElement.children : [],
                currentChild,
                oldChild,
                newEdits = [],
                newEdit,
                textAfterID = null;
            
            var addBeforeID = function (beforeID) {
                newEdits.forEach(function (edit) {
                    edit.beforeID = beforeID;
                });
                edits.push.apply(edits, newEdits);
                newEdits = [];
                textAfterID = beforeID;
            };
            
            var addElementInsert = function () {
                if (!oldNode.nodeMap[currentChild.tagID]) {
                    newEdit = {
                        type: "elementInsert",
                        tag: currentChild.tag,
                        tagID: currentChild.tagID,
                        parentID: currentChild.parent.tagID,
                        attributes: currentChild.attributes
                    };
                    newEdits.push(newEdit);
                    queue.push(currentChild);
                    textAfterID = currentChild.tagID;
                    // new element means we need to move on to compare the next
                    // of the current tree with the one from the old tree that we
                    // just compared
                    i += 1;
                    return true;
                }
                return false;
            };
            
            var addElementDelete = function () {
                if (!newNode.nodeMap[oldChild.tagID]) {
                    newEdit = {
                        type: "elementDelete",
                        tagID: oldChild.tagID
                    };
                    edits.push(newEdit);
                    j += 1;
                    return true;
                }
                return false;
            };
            
            var addTextInsert = function () {
                newEdit = {
                    type: "textInsert",
                    content: currentChild.content
                };
                i += 1;
                newEdit.parentID = currentChild.parent.tagID;
                if (textAfterID) {
                    newEdit.afterID = textAfterID;
                } else {
                    newEdit.firstChild = true;
                }
                newEdits.push(newEdit);
            };
            var addTextDelete = function () {
                newEdit = {
                    type: "textDelete"
                };
                j += 1;
                newEdit.parentID = oldChild.parent.tagID;
                if (oldChild.parent.children.length === 1) {
                    edits.push(newEdit);
                } else {
                    if (textAfterID) {
                        newEdit.afterID = textAfterID;
                    }
                    newEdits.push(newEdit);
                }
            };
            
            console.log("cur elem", _dumpDOM(currentElement));
            if (oldElement) {
                console.log("old elem", _dumpDOM(oldElement));
            }
            while (i < currentChildren.length && j < oldChildren.length) {
                currentChild = currentChildren[i];
                oldChild = oldChildren[j];
                if (currentChild.children || oldChild.children) {
                    if (currentChild.children && !oldChild.children) {
                        addTextDelete();
                        addElementInsert();
                    } else if (oldChild.children && !currentChild.children) {
                        if (!addElementDelete()) {
                            addTextInsert();
                        }
                    } else {
                        if (currentChild.tagID !== oldChild.tagID) {
                            if (!addElementInsert() && !addElementDelete()) {
                                i += 1;
                                j += 1;
                            }
                        } else {
                            addBeforeID(oldChild.tagID);
                            i += 1;
                            j += 1;
                        }
                    }
                } else if (currentChild.textSignature !== oldChild.textSignature) {
                    if (currentChild.textSignature && !oldChild.textSignature) {
                        addTextInsert();
                    } else if (oldChild.textSignature && !currentChild.textSignature) {
                        addTextDelete();
                    } else {
                        newEdit = {
                            type: "textReplace",
                            content: currentChild.content,
                            parentID: currentChild.parent.tagID
                        };
                        if (textAfterID) {
                            newEdit.afterID = textAfterID;
                        }
                        newEdits.push(newEdit);
                        i += 1;
                        j += 1;
                    }
                } else {
                    i += 1;
                    j += 1;
                }
            }
            
            while (j < oldChildren.length) {
                oldChild = oldChildren[i];
                if (oldChild.children) {
                    addElementDelete();
                } else {
                    addTextDelete();
                }
            }
            
            while (i < currentChildren.length) {
                currentChild = currentChildren[i];
                if (currentChild.children) {
                    addElementInsert();
                } else {
                    addTextInsert();
                }
            }
            
            newEdits.forEach(function (edit) {
                if (edit.type === "textInsert" || edit.type === "elementInsert") {
                    edit.lastChild = true;
                    delete edit.firstChild;
                    delete edit.afterID;
                }
            });
            edits.push.apply(edits, newEdits);
            console.log("edits", edits);
        };
        
        var queuePush = function (node) {
            if (node.children && oldNode.nodeMap[node.tagID]) {
                queue.push(node);
            }
        };
        
        queue.push(newNode);
        
        do {
            currentElement = queue.pop();
            oldElement = oldNode.nodeMap[currentElement.tagID];
            
            if (oldElement) {
                if (currentElement.attributeSignature !== oldElement.attributeSignature) {
                    attributeCompare(edits, oldElement, currentElement);
                }
                
                if (currentElement.childSignature !== oldElement.childSignature) {
                    generateChildEdits(currentElement, oldElement);
                }
                
                if (currentElement.subtreeSignature !== oldElement.subtreeSignature) {
                    currentElement.children.forEach(queuePush);
                }
            } else {
                generateChildEdits(currentElement, null);
            }
        } while (queue.length);
        
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
        
        // We're done with the nodeMap that was added to the subtree by the updater.
        if (result.newSubtree !== result.newDOM) {
            delete result.newSubtree.nodeMap;
        }
        
        return {
            dom: result.newDOM,
            edits: edits,
            _wasIncremental: updater.isIncremental // for unit tests only
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
                    _updateHash(child);
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
        if (!doc.isDirty && cachedValue && !cachedValue.dirty && cachedValue.timestamp === doc.diskTimestamp) {
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
     * Generate instrumented HTML for the specified editor's document, and mark the associated tag 
     * ranges in the editor. Each tag has a "data-brackets-id" attribute with a unique ID for its 
     * value. For example, "<div>" becomes something like "<div data-brackets-id='45'>". The attribute 
     * value is just a number that is guaranteed to be unique. 
     * @param {Editor} editor The editor whose document we're instrumenting, and which we should
     *     mark ranges in.
     * @return {string} instrumented html content
     */
    function generateInstrumentedHTML(editor) {
        var doc = editor.document,
            dom = scanDocument(doc),
            orig = doc.getText(),
            gen = "",
            lastIndex = 0;
        
        if (!dom) {
            return null;
        }
        
        // Ensure that the marks in the editor are up to date with respect to the given DOM.
        _markTextFromDOM(editor, dom);
        
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
    
    /**
     * @private
     * Clear the DOM cache. For unit testing only.
     */
    function _resetCache() {
        _cachedValues = {};
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
    exports._resetCache                 = _resetCache;
    
    // public API
    exports.scanDocument                = scanDocument;
    exports.generateInstrumentedHTML    = generateInstrumentedHTML;
    exports.getUnappliedEditList        = getUnappliedEditList;
});
