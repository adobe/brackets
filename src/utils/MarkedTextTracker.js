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
 * MarkedTextTracker
 *
 * This module contains functions for tracking ranges in a document across edits, and
 * determining which tracked range a given position cursor is in. Differs from TextRange,
 * which is a simpler mechanism that only tracks line ranges (not line/character positions)
 * and doesn't rely on CodeMirror's text marking.
 */
define(function (require, exports, module) {
    "use strict";
    
    /**
     * Mark the text with a given set of ranges that can later be queried via
     * getDataAtDocumentPos().
     *
     * @param {Editor} editor The editor whose text should be marked.
     * @param {Array.<{start: (number | {line: number, ch: number}), end: (number | {line: number, ch: number}), data: object}>} ranges 
     *     The set of ranges to mark. For each range, start and end are either simple character offsets within the entire 
     *     text or CodeMirror-style 0-based {line, ch} objects, and data is arbitrary range data to be stored
     *     with the mark.
     * @param {string} type A string identifying the type of marked range; should be unique for a given caller. Must
     *     conform to identifier syntax since this will be used as a property name.
     * @return none
     */
    function markText(editor, ranges, type) {
        var cm = editor._codeMirror;
        
        // Remove existing marks
        var marks = cm.getAllMarks();
        cm.operation(function () {
            marks.forEach(function (mark) {
                if (mark.hasOwnProperty(type)) {
                    mark.clear();
                }
            });
        });
                
        // Mark
        ranges.forEach(function (range) {
            var startPos = (typeof range.start === "number" ? cm.posFromIndex(range.start) : range.start),
                endPos = (typeof range.end === "number" ? cm.posFromIndex(range.end) : range.end),
                mark = cm.markText(startPos, endPos);
            
            mark[type] = range.data;
        });
    }
    
    /**
     * Get the data from the marked range of the given type surrounding the specified position. 
     * Returns null if there is no marked range of that type surrounding the location.
     * The markText() function must be called before calling this function.
     *
     * @param {Editor} editor The editor to scan. 
     * @param {{line: number, ch: number}} pos The position to find the range for.
     * @param {string} type The type of range to search for, as passed into markText().
     * @return {number} tagID at the specified position, or null if there is no tag
     */
    function getDataAtDocumentPos(editor, pos, type) {
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
            if (marks[i].hasOwnProperty(type)) {
                if (!match) {
                    match = marks[i];
                } else {
                    if (_distance(marks[i]) < _distance(match)) {
                        match = marks[i];
                    }
                }
            }
        }
        
        if (match) {
            return match[type];
        }
        
        return null;
    }
    
    exports.markText = markText;
    exports.getDataAtDocumentPos = getDataAtDocumentPos;
});
