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

/*jslint vars: true, plusplus: true, nomen: true, regexp: true, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";
    
    var InlineWidget         = brackets.getModule("editor/InlineWidget").InlineWidget,
        BezierCurveEditor    = require("BezierCurveEditor").BezierCurveEditor,
        BezierCurveUtils     = require("BezierCurveUtils");
        

    /** @type {number} Global var used to provide a unique ID for each bezierCurve editor instance's _origin field. */
    var lastOriginId = 1;
    
    /**
     * Constructor for inline widget containing a BezierCurveEditor control
     *
     * @param {!RegExpMatch} bezierCurve  RegExp match object of initially selected bezierCurve
     * @param {!CodeMirror.Bookmark} startBookmark
     * @param {!CodeMirror.Bookmark} endBookmark
     */
    function InlineBezierCurveEditor(bezierCurve, startBookmark, endBookmark) {
        this._bezierCurve = bezierCurve;
        this._startBookmark = startBookmark;
        this._endBookmark = endBookmark;
        this._isOwnChange = false;
        this._isHostChange = false;
        this._origin = "*InlineBezierCurveEditor_" + (lastOriginId++);

        this._handleBezierCurveChange = this._handleBezierCurveChange.bind(this);
        this._handleHostDocumentChange = this._handleHostDocumentChange.bind(this);
        
        InlineWidget.call(this);
    }
    
    InlineBezierCurveEditor.prototype = Object.create(InlineWidget.prototype);
    InlineBezierCurveEditor.prototype.constructor = InlineBezierCurveEditor;
    InlineBezierCurveEditor.prototype.parentClass = InlineWidget.prototype;
    
    /** @type {!BezierCurveEditor} BezierCurveEditor instance */
    InlineBezierCurveEditor.prototype.bezierCurveEditor = null;
    
    /** @type {!string} Current value of the bezier curve editor control */
    InlineBezierCurveEditor.prototype._bezierCurve = null;
    
    /**
     * Start of the range of code we're attached to; _startBookmark.find() may by null if sync is lost.
     * @type {!CodeMirror.Bookmark}
     */
    InlineBezierCurveEditor.prototype._startBookmark = null;
    
    /**
     * End of the range of code we're attached to; _endBookmark.find() may by null if sync is lost or even
     * in some cases when it's not. Call getCurrentRange() for the definitive text range we're attached to.
     * @type {!CodeMirror.Bookmark}
     */
    InlineBezierCurveEditor.prototype._endBookmark = null;
    
    /** @type {boolean} True while we're syncing a bezier curve editor change into the code editor */
    InlineBezierCurveEditor.prototype._isOwnChange = null;
    
    /** @type {boolean} True while we're syncing a code editor change into the bezier curve editor */
    InlineBezierCurveEditor.prototype._isHostChange = null;
    
    /** @type {number} ID used to identify edits coming from this inline widget for undo batching */
    InlineBezierCurveEditor.prototype._origin = null;
    
    
    /**
     * Returns the current text range of the bezierCurve we're attached to, or null if
     * we've lost sync with what's in the code.
     *
     * @return {?{
     *              start: {line:number, ch:number},
     *              end:   {line:number, ch:number},
     *              match: {RegExpMatch}
     *          }}
     */
    InlineBezierCurveEditor.prototype.getCurrentRange = function () {
        var start, end;
        
        start = this._startBookmark.find();
        if (!start) {
            return null;
        }
        
        end = this._endBookmark.find();
        if (!end) {
            end = { line: start.line };
        }
        
        // Even if we think we have a good end bookmark, we want to run the
        // regexp match to see if there's a valid match that extends past the bookmark.
        // This can happen if the user deletes the end of the existing bezierCurve and then
        // types some more.
        // FUTURE: when we migrate to CodeMirror v3, we might be able to use markText()
        // instead of two bookmarks to track the range. (In our current old version of
        // CodeMirror v2, markText() isn't robust enough for this case.)
        var line = this.hostEditor.document.getLine(start.line),
            matches = BezierCurveUtils.cubicBezierMatch(line.substr(start.ch), true);

        // No longer have a match
        if (!matches) {
            return null;
        }
        
        // Note that end.ch is exclusive, so we don't need to add 1 before comparing to
        // the matched length here.
        if (end.ch === undefined || (end.ch - start.ch) !== matches[0].length) {
            end.ch = start.ch + matches[0].length;
            this._endBookmark.clear();
            this._endBookmark = this.hostEditor._codeMirror.setBookmark(end);
        }
        
        if (end.ch === undefined) {
            // We were unable to resync the end bookmark.
            return null;
        } else {
            return {
                start: start,
                end:   end,
                match: matches
            };
        }
    };
        
    /**
     * When the bezier curve editor's selected bezierCurve changes, update text in code editor
     * @param {!string} bezierCurveString
     */
    InlineBezierCurveEditor.prototype._handleBezierCurveChange = function (bezierCurveString) {
        var bezierCurveMatch = BezierCurveUtils.cubicBezierMatch(bezierCurveString, true);
        if (bezierCurveMatch !== this._bezierCurve) {
            var range = this.getCurrentRange();
            if (!range) {
                return;
            }

            // Don't push the change back into the host editor if it came from the host editor.
            if (!this._isHostChange) {
                // Replace old bezierCurve in code with the editor's bezier curve, and select it
                this._isOwnChange = true;
                this.hostEditor.document.replaceRange(bezierCurveString, range.start, range.end, this._origin);
                this._isOwnChange = false;
                this.hostEditor.setSelection(range.start, {
                    line: range.start.line,
                    ch: range.start.ch + bezierCurveString.length
                });
            }
            
            this._bezierCurve = bezierCurveMatch;
        }
    };
    
    /**
     * @override
     * @param {!Editor} hostEditor
     */
    InlineBezierCurveEditor.prototype.load = function (hostEditor) {
        InlineBezierCurveEditor.prototype.parentClass.load.apply(this, arguments);
        
        // Create bezier curve editor control
        var swatchInfo = null;
        this.bezierCurveEditor = new BezierCurveEditor(this.$htmlContent, this._bezierCurve, this._handleBezierCurveChange, swatchInfo);
    };

    /**
     * @override
     * Perform sizing & focus once we've been added to Editor's DOM
     */
    InlineBezierCurveEditor.prototype.onAdded = function () {
        InlineBezierCurveEditor.prototype.parentClass.onAdded.apply(this, arguments);
        
        var doc = this.hostEditor.document;
        doc.addRef();
        $(doc).on("change", this._handleHostDocumentChange);
        
        this.hostEditor.setInlineWidgetHeight(this, this.bezierCurveEditor.getRootElement().outerHeight(), true);
        
        this.bezierCurveEditor.focus();
    };
    
    /**
     * @override
     * Called whenever the inline widget is closed, whether automatically or explicitly
     */
    InlineBezierCurveEditor.prototype.onClosed = function () {
        InlineBezierCurveEditor.prototype.parentClass.onClosed.apply(this, arguments);

        this.bezierCurveEditor.destroy();

        if (this._startBookmark) {
            this._startBookmark.clear();
        }
        if (this._endBookmark) {
            this._endBookmark.clear();
        }

        var doc = this.hostEditor.document;
        $(doc).off("change", this._handleHostDocumentChange);
        doc.releaseRef();
    };

    /**
     * When text in the code editor changes, update bezier curve editor to reflect it
     */
    InlineBezierCurveEditor.prototype._handleHostDocumentChange = function () {
        // Don't push the change into the bezierCurve editor if it came from the bezierCurve editor.
        if (this._isOwnChange) {
            return;
        }
        
        var range = this.getCurrentRange();
        if (range) {
            if (range.match !== this._bezierCurve) {
                this._isHostChange = true;
                this._isHostChange = false;
                this._bezierCurve = range.match;
                this.bezierCurveEditor.handleExternalUpdate(range.match);
            }
        } else {
            // The edit caused our range to become invalid. Close the editor.
            this.close();
        }
    };

    exports.InlineBezierCurveEditor = InlineBezierCurveEditor;
});
