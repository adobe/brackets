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
        DOMHelpers      = require("LiveDevelopment/Agents/DOMHelpers");
    
    // Hash of scanned documents. Key is the full path of the doc. Value is an object
    // with two properties: timestamp and tags. Timestamp is the document timestamp,
    // tags is an array of tag info with start, length, and tagID properties.
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
    
    /**
     * Scan a document to prepare for HTMLInstrumentation
     * @param {Document} doc The doc to scan. 
     * @return {Array} Array of tag info, or null if no tags were found
     */
    function scanDocument(doc) {
        if (!_cachedValues.hasOwnProperty(doc.file.fullPath)) {
            $(doc).on("change.htmlInstrumentation", function () {
                // Clear cached values on doc change, but keep the entry
                // in the _cachedValues hash. Keeping the entry means
                // the event handlers (like this one) won't be added again.
                _cachedValues[doc.file.fullPath] = null;
            });
            
            // Assign to cache, but don't set a value yet
            _cachedValues[doc.file.fullPath] = null;
        }
        
        if (_cachedValues[doc.file.fullPath]) {
            var cachedValue = _cachedValues[doc.file.fullPath];
            
            if (cachedValue.timestamp === doc.diskTimestamp) {
                return cachedValue.tags;
            }
        }
        
        var text = doc.getText(),
            tagID = 1;
        
        // Scan 
        var tags = [];
        var tagStack = [];
        var tag;
        
        DOMHelpers.eachNode(text, function (payload) {
            // Ignore closing empty tags like </input> since they're invalid.
            if (payload.closing && _isEmptyTag(payload)) {
                return;
            }
            if (payload.nodeType === 1 && payload.nodeName) {
                // Set unclosedLength for the last tag
                if (tagStack.length > 0) {
                    tag = tagStack[tagStack.length - 1];
                    
                    if (!tag.unclosedLength) {
                        if (tag.nodeName === "HTML" || tag.nodeName === "BODY") {
                            tag.unclosedLength = text.length - tag.sourceOffset;
                        } else {
                            tag.unclosedLength = payload.sourceOffset - tag.sourceOffset;
                        }
                    }
                }
                
                // Empty tag
                if (_isEmptyTag(payload)) {
                    tags.push({
                        name:   payload.nodeName,
                        tagID:  tagID++,
                        offset: payload.sourceOffset,
                        length: payload.sourceLength
                    });
                } else if (payload.closing) {
                    // Closing tag
                    var i,
                        startTag;
                    
                    for (i = tagStack.length - 1; i >= 0; i--) {
                        if (tagStack[i].nodeName === payload.nodeName) {
                            startTag = tagStack[i];
                            tagStack.splice(i, 1);
                            break;
                        }
                    }
                    
                    if (startTag) {
                        tags.push({
                            name:   startTag.nodeName,
                            tagID:  tagID++,
                            offset: startTag.sourceOffset,
                            length: payload.sourceLength + payload.sourceOffset - startTag.sourceOffset
                        });
                    } else {
                        console.error("Unmatched end tag: " + payload.nodeName);
                    }
                } else {
                    // Opening tag
                    tagStack.push(payload);
                }
            }
        });
        
        // Remaining tags in tagStack are unclosed.
        while (tagStack.length) {
            tag = tagStack.pop();
            // Push the unclosed tag with the "unclosed" length. 
            tags.push({
                name:   tag.nodeName,
                tagID:  tagID++,
                offset: tag.sourceOffset,
                length: tag.unclosedLength || tag.sourceLength
            });
        }
        
        // Sort by initial offset
        tags.sort(function (a, b) {
            if (a.offset < b.offset) {
                return -1;
            }
            if (a.offset === b.offset) {
                return 0;
            }
            return 1;
        });
        
        // Cache results
        _cachedValues[doc.file.fullPath] = {
            timestamp: doc.diskTimestamp,
            tags: tags
        };
        
        return tags;
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
        var tags = scanDocument(doc).slice(),
            gen = doc.getText();
        
        // Walk through the tags and insert the 'data-brackets-id' attribute at the
        // end of the open tag
        var i, insertCount = 0;
        tags.forEach(function (tag) {
            var attrText = " data-brackets-id='" + tag.tagID + "'";

            // Insert the attribute as the first attribute in the tag.
            var insertIndex = tag.offset + tag.name.length + 1 + insertCount;
            gen = gen.substr(0, insertIndex) + attrText + gen.substr(insertIndex);
            insertCount += attrText.length;
        });
        
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
        var cache = _cachedValues[editor.document.file.fullPath];
        
        var cm = editor._codeMirror,
            tags = cache && cache.tags;
        
        if (!tags) {
            console.error("Couldn't find the tag information for " + editor.document.file.fullPath);
            return;
        }
        
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
        tags.forEach(function (tag) {
            var startPos = cm.posFromIndex(tag.offset),
                endPos = cm.posFromIndex(tag.offset + tag.length),
                mark = cm.markText(startPos, endPos);
            
            mark.tagID = tag.tagID;
        });
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
        
        if (match) {
            return match.tagID;
        }
        
        return -1;
    }
    
    $(DocumentManager).on("beforeDocumentDelete", _removeDocFromCache);
    
    exports.scanDocument = scanDocument;
    exports.generateInstrumentedHTML = generateInstrumentedHTML;
    exports._markText = _markText;
    exports._getTagIDAtDocumentPos = _getTagIDAtDocumentPos;
});
