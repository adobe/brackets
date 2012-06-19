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

/**
 */
define(function (require, exports, module) {
    'use strict';
    
    /**
     * @constructor
     *
     * Stores a range of lines that is automatically maintained as the Document changes. The range
     * MAY drop out of sync with the Document in certain edge cases; startLine & endLine will become
     * null when that happens.
     *
     * Important: you must dispose() a TextRange when you're done with it. Because TextRange addRef()s
     * the Document (in order to listen to it), you will leak Documents otherwise.
     *
     * TextRange dispatches two events:
     *  - change -- When the range changes (due to a Document change)
     *  - lostSync -- When the backing Document changes in such a way that the range can no longer
     *          accurately be maintained. Generally, occurs whenever an edit spans a range boundary.
     *          After this, startLine & endLine will be unusable (set to null).
     * These events only ever occur in response to Document changes, so if you are already listening
     * to the Document, you could ignore the TextRange events and just read its updated value in your
     * own Document change handler.
     *
     * @param {!Document} document
     * @param {number} startLine First line in range (0-based, inclusive)
     * @param {number} endLine   Last line in range (0-based, inclusive)
     */
    function TextRange(document, startLine, endLine) {
        this.startLine = startLine;
        this.endLine = endLine;
        
        this.document = document;
        document.addRef();
        // store this-bound version of listener so we can remove them later
        this._handleDocumentChange = this._handleDocumentChange.bind(this);
        $(document).on("change", this._handleDocumentChange);
    }
    
    /** Detaches from the Document. The TextRange will no longer update or send change events */
    TextRange.prototype.dispose = function (editor, change) {
        // Disconnect from Document
        this.document.releaseRef();
        $(this.document).off("change", this._handleDocumentChange);
    };
    
    
    /** @type {!Document} */
    TextRange.prototype.document = null;
    /** @type {?number} Null after "lostSync" is dispatched */
    TextRange.prototype.startLine = null;
    /** @type {?number} Null after "lostSync" is dispatched */
    TextRange.prototype.endLine = null;
    
    
    /**
     * Applies a single Document change object (out of the linked list of multiple such objects)
     * to this range. Returns true if the range was changed as a result.
     */
    TextRange.prototype._applySingleChangeToRange = function (change) {
        // console.log(this + " applying change to (" +
        //         (change.from && (change.from.line+","+change.from.ch)) + " - " +
        //         (change.to && (change.to.line+","+change.to.ch)) + ")");
        
        // Special case: the range is no longer meaningful since the entire text was replaced
        if (!change.from || !change.to) {
            this.startLine = null;
            this.endLine = null;
            return true;
            
        // Special case: certain changes around the edges of the range are problematic, because
        // if they're undone, we'll be unable to determine how to fix up the range to include the
        // undone content. (The "undo" will just look like an insertion outside our bounds.) So
        // in those cases, we destroy the range instead of fixing it up incorrectly. The specific
        // cases are:
        // 1. Edit crosses the start boundary of the inline editor (defined as character 0 
        //    of the first line).
        // 2. Edit crosses the end boundary of the inline editor (defined as the newline at
        //    the end of the last line).
        // Note: we also used to disallow edits that start at the beginning of the range (character 0
        //    of the first line) if they crossed a newline. This was a vestige from before case #1
        //    was added; now that edits crossing the top boundary (actually, undos of such edits) are
        //    out of the picture, edits on the first line of the range unambiguously belong inside it.
        } else if ((change.from.line < this.startLine && change.to.line >= this.startLine) ||
                   (change.from.line <= this.endLine && change.to.line > this.endLine)) {
            this.startLine = null;
            this.endLine = null;
            return true;
            
        // Normal case: update the range end points if any content was added before them. Note that
        // we don't rely on line handles for this since we want to gracefully handle cases where the
        // start or end line was deleted during a change.
        } else {
            var numAdded = change.text.length - (change.to.line - change.from.line + 1);
            var hasChanged = false;
            
            // This logic is so simple because we've already excluded all cases where the change
            // crosses the range boundaries
            if (change.to.line < this.startLine) {
                this.startLine += numAdded;
                hasChanged = true;
            }
            if (change.to.line <= this.endLine) {
                this.endLine += numAdded;
                hasChanged = true;
            }
            
            // console.log("Now " + this);
            
            return hasChanged;
        }
    };
    
    /**
     * Updates the range based on the changeList from a Document "change" event. Dispatches a
     * "change" event if the range was adjusted at all. Dispatches a "lostSync" event instead if the
     * range can no longer be accurately maintained.
     */
    TextRange.prototype._applyChangesToRange = function (changeList) {
        var hasChanged = false;
        var change;
        for (change = changeList; change; change = change.next) {
            // Apply this step of the change list
            var result = this._applySingleChangeToRange(change);
            hasChanged = hasChanged || result;
            
            // If we lost sync with the range, just bail now
            if (this.startLine === null || this.endLine === null) {
                $(this).triggerHandler("lostSync");
                break;
            }
        }
        
        if (hasChanged) {
            $(this).triggerHandler("change");
        }
    };
    
    TextRange.prototype._handleDocumentChange = function (event, doc, changeList) {
        this._applyChangesToRange(changeList);
    };
    
    
    /* (pretty toString(), to aid debugging) */
    TextRange.prototype.toString = function () {
        return "[TextRange " + this.startLine + "-" + this.endLine + " in " + this.document + "]";
    };
    
    
    // Define public API
    module.exports = TextRange;
});
