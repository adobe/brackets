/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, brackets, window */

define(function (require, exports, module) {
    "use strict";

    var InlineWidget         = brackets.getModule("editor/InlineWidget").InlineWidget,
        BezierCurveEditor    = require("BezierCurveEditor").BezierCurveEditor,
        StepEditor           = require("StepEditor").StepEditor,
        TimingFunctionUtils  = require("TimingFunctionUtils");


    /** @type {number} Global var used to provide a unique ID for each timingFunction editor instance's _origin field. */
    var lastOriginId = 1;

    /**
     * Constructor for inline widget containing a BezierCurveEditor control
     *
     * @param {!RegExpMatch} timingFunction  RegExp match object of initially selected timingFunction
     * @param {!CodeMirror.Bookmark} startBookmark
     * @param {!CodeMirror.Bookmark} endBookmark
     */
    function InlineTimingFunctionEditor(timingFunction, startBookmark, endBookmark) {
        this._timingFunction = timingFunction;
        this._startBookmark = startBookmark;
        this._endBookmark = endBookmark;
        this._isOwnChange = false;
        this._isHostChange = false;
        this._origin = "+InlineTimingFunctionEditor_" + (lastOriginId++);

        this._handleTimingFunctionChange = this._handleTimingFunctionChange.bind(this);
        this._handleHostDocumentChange = this._handleHostDocumentChange.bind(this);

        InlineWidget.call(this);
    }

    InlineTimingFunctionEditor.prototype = Object.create(InlineWidget.prototype);
    InlineTimingFunctionEditor.prototype.constructor = InlineTimingFunctionEditor;
    InlineTimingFunctionEditor.prototype.parentClass = InlineWidget.prototype;

    /** @type {!BezierCurveEditor} BezierCurveEditor instance */
    InlineTimingFunctionEditor.prototype.timingFunctionEditor = null;

    /** @type {!string} Current value of the timing function editor control */
    InlineTimingFunctionEditor.prototype._timingFunction = null;

    /**
     * Start of the range of code we're attached to; _startBookmark.find() may by null if sync is lost.
     * @type {!CodeMirror.Bookmark}
     */
    InlineTimingFunctionEditor.prototype._startBookmark = null;

    /**
     * End of the range of code we're attached to; _endBookmark.find() may by null if sync is lost or even
     * in some cases when it's not. Call getCurrentRange() for the definitive text range we're attached to.
     * @type {!CodeMirror.Bookmark}
     */
    InlineTimingFunctionEditor.prototype._endBookmark = null;

    /** @type {boolean} True while we're syncing a timing function editor change into the code editor */
    InlineTimingFunctionEditor.prototype._isOwnChange = null;

    /** @type {boolean} True while we're syncing a code editor change into the timing function editor */
    InlineTimingFunctionEditor.prototype._isHostChange = null;

    /** @type {number} ID used to identify edits coming from this inline widget for undo batching */
    InlineTimingFunctionEditor.prototype._origin = null;


    /**
     * Returns the current text range of the timingFunction we're attached to, or null if
     * we've lost sync with what's in the code.
     *
     * @return {?{
     *              start: {line:number, ch:number},
     *              end:   {line:number, ch:number},
     *              match: {RegExpMatch}
     *          }}
     */
    InlineTimingFunctionEditor.prototype.getCurrentRange = function () {
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
        // This can happen if the user deletes the end of the existing timingFunction and then
        // types some more.
        // FUTURE: when we migrate to CodeMirror v3, we might be able to use markText()
        // instead of two bookmarks to track the range. (In our current old version of
        // CodeMirror v2, markText() isn't robust enough for this case.)
        var line = this.hostEditor.document.getLine(start.line),
            matches = TimingFunctionUtils.timingFunctionMatch(line.substr(start.ch), true),
            originalLength;

        // No longer have a match
        if (!matches) {
            return null;
        }

        originalLength = ((matches.originalString && matches.originalString.length) || matches[0].length);
        // Note that end.ch is exclusive, so we don't need to add 1 before comparing to
        // the matched length here.
        if (end.ch === undefined || (end.ch - start.ch) !== originalLength) {
            end.ch = start.ch + originalLength;
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
                match: matches,
                originalLength: originalLength
            };
        }
    };

    /**
     * When the timing function editor's selected timingFunction changes, update text in code editor
     * @param {!string} timingFunctionString
     */
    InlineTimingFunctionEditor.prototype._handleTimingFunctionChange = function (timingFunctionString) {
        var self                = this,
            timingFunctionMatch = TimingFunctionUtils.timingFunctionMatch(timingFunctionString, true);
        if (timingFunctionMatch !== this._timingFunction) {
            var range = this.getCurrentRange();
            if (!range) {
                return;
            }

            // Don't push the change back into the host editor if it came from the host editor.
            if (!this._isHostChange) {
                this._isOwnChange = true;
                this.hostEditor.document.batchOperation(function () {
                    // Replace old timingFunction in code with the editor's timing function, and select it
                    self.hostEditor.document.replaceRange(timingFunctionString, range.start, range.end, self._origin);
                    var newEnd = { line: range.start.line, ch: range.start.ch + timingFunctionString.length };
                    self.hostEditor.setSelection(range.start, newEnd, false, 0, self._origin);
                });
                this._isOwnChange = false;
            }

            this._timingFunction = timingFunctionMatch;
        }
    };

    /**
     * @override
     * @param {!Editor} hostEditor
     */
    InlineTimingFunctionEditor.prototype.load = function (hostEditor) {
        InlineTimingFunctionEditor.prototype.parentClass.load.apply(this, arguments);

        // Create appropriate timing function editor control
        if (this._timingFunction.isBezier) {
            this.timingFunctionEditor = new BezierCurveEditor(this.$htmlContent, this._timingFunction, this._handleTimingFunctionChange);
        } else if (this._timingFunction.isStep) {
            this.timingFunctionEditor = new StepEditor(this.$htmlContent, this._timingFunction, this._handleTimingFunctionChange);
        } else {
            window.console.log("InlineTimingFunctionEditor.load tried to load an unkown timing function type");
        }
    };

    /**
     * @override
     * Perform sizing & focus once we've been added to Editor's DOM
     */
    InlineTimingFunctionEditor.prototype.onAdded = function () {
        InlineTimingFunctionEditor.prototype.parentClass.onAdded.apply(this, arguments);

        var doc = this.hostEditor.document;
        doc.addRef();
        doc.on("change", this._handleHostDocumentChange);

        this.hostEditor.setInlineWidgetHeight(this, this.timingFunctionEditor.getRootElement().outerHeight(), true);

        this.timingFunctionEditor.focus();
    };

    /**
     * @override
     * Called whenever the inline widget is closed, whether automatically or explicitly
     */
    InlineTimingFunctionEditor.prototype.onClosed = function () {
        InlineTimingFunctionEditor.prototype.parentClass.onClosed.apply(this, arguments);

        this.timingFunctionEditor.destroy();

        if (this._startBookmark) {
            this._startBookmark.clear();
        }
        if (this._endBookmark) {
            this._endBookmark.clear();
        }

        var doc = this.hostEditor.document;
        doc.off("change", this._handleHostDocumentChange);
        doc.releaseRef();
    };

    /**
     * When text in the code editor changes, update timing function editor to reflect it
     */
    InlineTimingFunctionEditor.prototype._handleHostDocumentChange = function () {
        // Don't push the change into the timingFunction editor if it came from the timingFunction editor.
        if (this._isOwnChange) {
            return;
        }

        var range = this.getCurrentRange();
        if (range) {
            if (range.match !== this._timingFunction) {
                this._isHostChange = true;
                this._isHostChange = false;
                this._timingFunction = range.match;
                this.timingFunctionEditor.handleExternalUpdate(range.match);
            }
        } else {
            // The edit caused our range to become invalid. Close the editor.
            this.close();
        }
    };

    exports.InlineTimingFunctionEditor = InlineTimingFunctionEditor;
});
