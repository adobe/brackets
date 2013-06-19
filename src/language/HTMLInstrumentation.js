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
        Tokenizer       = require("language/HTMLTokenizer").Tokenizer;
    
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
    
    function SimpleDOMBuilder(text) {
        this.stack = [];
        this.t = new Tokenizer(text);
        this.lastTag = null;
        this.currentTag = null;
    }
    
    SimpleDOMBuilder.prototype.build = function () {
        var token;
        var stack = this.stack;
        var attributeName = null;
        
        while ((token = this.t.nextToken()) !== null) {
            if (!token.contents) {
                console.error("Token has no contents: ", token);
            } else if (token.type === "opentagname") {
                var newTag = {
                    tag: token.contents,
                    children: [],
                    attributes: {},
                    parent: (stack.length ? stack[stack.length - 1] : null),
                    start: token.start - 1
                };
                newTag.tagID = this.getID(newTag);
                if (newTag.parent) {
                    newTag.parent.children.push(newTag);
                }
                this.currentTag = newTag;
                if (!voidElements.hasOwnProperty(this.currentTag.tag)) {
                    stack.push(this.currentTag);
                }
            } else if (token.type === "closetag") {
                this.lastTag = stack.pop();
                this.lastTag.end = token.end + 1;
                if (this.lastTag.tag !== token.contents) {
                    console.error("Mismatched tag: ", this.lastTag.tag, token.contents);
                }
            } else if (token.type === "attribname") {
                attributeName = token.contents;
            } else if (token.type === "attribvalue" && attributeName !== null) {
                this.currentTag.attributes[attributeName] = token.contents;
                attributeName = null;
            } else if (token.type === "text") {
                if (stack.length) {
                    stack[stack.length - 1].children.push(token.contents);
                }
            }
        }
        
        return stack.length ? stack[0] : this.lastTag;
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
            if (childNode.tagID) {
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
    
    function DOMUpdater(previousDOM, editor) {
        var text = editor.document.getText();
        this.constructor(text);
        this.editor = editor;
        this.cm = editor._codeMirror;
    }
    
    DOMUpdater.prototype = new SimpleDOMBuilder();
    
    DOMUpdater.prototype.getID = function (newTag) {
        // TODO: _getTagIDAtDocumentPos is likely a performance bottleneck
        var currentTagID = _getTagIDAtDocumentPos(this.editor, this.cm.posFromIndex(newTag.start));
        if (currentTagID === -1) {
            currentTagID = tagID++;
        }
        return currentTagID;
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
    
    function domdiff(edits, oldNode, newNode) {
        attributeCompare(edits, oldNode, newNode);
        var oldChildNum, newChildNum,
            oldChildren = oldNode.children,
            newChildren = newNode.children;
        
        if (oldChildren && newChildren) { // TODO: not sure why this wasn't failing before, so don't know how to create test for it
            for (oldChildNum = 0, newChildNum = 0; oldChildNum < oldChildren.length && newChildNum < newChildren.length; oldChildNum++, newChildNum++) {
                var oldChild = oldChildren[oldChildNum];
                var newChild = newChildren[newChildNum];
                if (newChild.tagID) {
                    domdiff(edits, oldChild, newChild);
                }
            }
        }
    }
    
    function _updateDOM(previousDOM, editor) {
        var edits = [];
        var updater = new DOMUpdater(previousDOM, editor);
        var newDOM = updater.build();
        domdiff(edits, previousDOM, newDOM);
        return {
            dom: newDOM,
            edits: edits
        };
    }
    
    function getUnappliedEditList(editor) {
        var cachedValue = _cachedValues[editor.document.file.fullPath];
        if (!cachedValue || !cachedValue.dom) {
            console.warn("No previous DOM to compare change against");
            return [];
        } else {
            var result = _updateDOM(cachedValue.dom, editor);
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
});
