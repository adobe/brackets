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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror */

define(function (require, exports, module) {
    "use strict";

    var DOMHelpers = require("LiveDevelopment/Agents/DOMHelpers");
    
    // Unique ID assigned to every tag.
    var _tagID = 1;

    /**
     * @private
     * Returns true if the specified tag is empty. This could be an empty HTML tag like 
     * <meta> or <link>, or a closed tag like <div />
     */
    function _isEmptyTag(payload) {
        if (payload.closed) {
            return true;
        }
        
        if (!payload.nodeName) {
            return true;
        }
        
        if (/(!doctype|area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|embed)/i
                .test(payload.nodeName)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Scan a document to prepare for HTMLInstrumentation
     * @param {Document} doc The doc to scan. NOTE: The current implementation requires
     *                       that this doc has a _masterEditor. This restriction may be
     *                       lifted in the future.
     * @return none
     */
    function scanDocument(doc) {
        if (!doc._masterEditor) {
            console.error("HTMLInstrumentation.scanDocument() only works with " +
                          "documents that have a master editor.");
            return;
        }
        
        var cm = doc._masterEditor._codeMirror,
            text = doc.getText();
        
        // Remove existing marks
        var marks = cm.getAllMarks();
        cm.operation(function () {
            marks.forEach(function (mark) {
                if (mark.hasOwnProperty("tagID")) {
                    mark.clear();
                }
            });
        });
        
        // Scan 
        var tags = [];
        var tagStack = [];
        
        DOMHelpers.eachNode(text, function (payload) {
            if (payload.nodeType === 1 && payload.nodeName) {
                // Empty tag
                if (_isEmptyTag(payload)) {
                    // Only push img and input. Ignore all other empty tags
                    if (/(img|input)/i.test(payload.nodeName)) {
                        tags.push({
                            name:   payload.nodeName,
                            id:     _tagID++,
                            offset: payload.sourceOffset,
                            length: payload.sourceLength
                        });
                    }
                } else if (payload.closing) {
                    // Closing tag
                    var startTag = tagStack.pop(),
                        lastTag = payload;
                    
                    while (startTag.nodeName !== payload.nodeName) {
                        // Unclosed start tag
                        tags.push({
                            name:   startTag.nodeName,
                            id:     _tagID++,
                            offset: startTag.sourceOffset,
                            length: lastTag.sourceLength + lastTag.sourceOffset - startTag.sourceOffset
                        });
                        lastTag = startTag;
                        startTag = tagStack.pop();
                    }
                    
                    tags.push({
                        name:   startTag.nodeName,
                        id:     _tagID++,
                        offset: startTag.sourceOffset,
                        length: payload.sourceLength + payload.sourceOffset - startTag.sourceOffset
                    });
                } else {
                    // Opening tag
                    tagStack.push(payload);
                }
            }
        });
        
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
                
        // Mark
        tags.forEach(function (tag) {
            var startPos = cm.posFromIndex(tag.offset),
                endPos = cm.posFromIndex(tag.offset + tag.length),
                mark = cm.markText(startPos, endPos);
            
            mark.tagID = tag.id;
        });
    }
    
    /**
     * Generate instrumented HTML for the specified document. 
     * NOTE: The scanDocument() function MUST be called before generating instrumented HTML.
     * @param {Document} doc The doc to scan. NOTE: The current implementation requires
     *                       that this doc has a _masterEditor. This restriction may be
     *                       lifted in the future.
     * @return none
     */
    function generateInstrumentedHTML(doc) {
        if (!doc._masterEditor) {
            console.error("HTMLInstrumentation.generateInstrumentedHTML() " +
                          "only works with documents that have a master editor.");
            return;
        }
        
        var cm = doc._masterEditor._codeMirror,
            marks = cm.getAllMarks(),
            gen = doc.getText();
        
        // Only look at markers that have "tagID"
        marks = marks.filter(function (mark) {
            return mark.hasOwnProperty("tagID");
        });
        
        // Make sure markers are sorted by start pos
        marks.sort(function (a, b) {
            var posA = a.find().from,
                posB = b.find().from;
            
            if (posA.line === posB.line && posA.ch === posB.ch) {
                return 0;
            }
            
            if (posA.line < posB.line || (posA.line === posB.line && posA.ch < posB.ch)) {
                return -1;
            }
            
            return 1;
        });
        
        // Walk through the markers and insert the 'data-brackets-id' attribute at the
        // end of the open tag
        var mark, insertCount = 0;
        for (mark = marks.shift(); mark; mark = marks.shift()) {
            var attrText = " data-brackets-id='" + mark.tagID + "'";
            var offset = cm.indexFromPos(mark.find().from);

            // Find end of tag - NOTE: This does not work if an attribute value contains ">"
            var insertIndex = gen.indexOf(">", offset + insertCount);
            if (gen[insertIndex] === "/") {
                insertIndex--;
            }
            gen = gen.substr(0, insertIndex) + attrText + gen.substr(insertIndex);
            insertCount += attrText.length;
        }
        
        return gen;
    }
    
    
    /**
     * Get the instrumented tagID at the specified document position. Returns -1 if
     * there are no instrumented tags at the location.
     * NOTE: The scanDocument() function MUST be called first.
     * @param {Document} doc The doc to scan. NOTE: The current implementation requires
     *                       that this doc has a _masterEditor. This restriction may be
     *                       lifted in the future.
     * @return {number} tagID at the specified position, or -1 if there is no tag
     */
    function getTagIDAtDocumentPos(doc, pos) {
        if (!doc._masterEditor) {
            console.error("HTMLInstrumentation.getTagIDAtDocumentPos() only works with " +
                          "documents that have a master editor.");
            return -1;
        }
        
        var i,
            cm = doc._masterEditor._codeMirror,
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
    
    exports.scanDocument = scanDocument;
    exports.generateInstrumentedHTML = generateInstrumentedHTML;
    exports.getTagIDAtDocumentPos = getTagIDAtDocumentPos;
});
