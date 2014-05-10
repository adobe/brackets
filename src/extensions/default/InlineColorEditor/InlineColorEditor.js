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

/*jslint vars: true, plusplus: true, nomen: true, regexp: true, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";
    
    var InlineWidget         = brackets.getModule("editor/InlineWidget").InlineWidget,
        ColorEditor          = require("ColorEditor").ColorEditor,
        ColorUtils           = brackets.getModule("utils/ColorUtils");
        

    /** @const @type {number} */
    var MAX_USED_COLORS = 7;
    
    /** @type {number} Global var used to provide a unique ID for each color editor instance's _origin field. */
    var lastOriginId = 1;
    
    /**
     * Inline widget containing a ColorEditor control
     * @param {!string} color  Initially selected color
     * @param {!CodeMirror.Bookmark} startBookmark
     * @param {!CodeMirror.Bookmark} endBookmark
     */
    function InlineColorEditor(color, startBookmark, endBookmark) {
        this._color = color;
        this._startBookmark = startBookmark;
        this._endBookmark = endBookmark;
        this._isOwnChange = false;
        this._isHostChange = false;
        this._origin = "+InlineColorEditor_" + (lastOriginId++);

        this._handleColorChange = this._handleColorChange.bind(this);
        this._handleHostDocumentChange = this._handleHostDocumentChange.bind(this);
        
        InlineWidget.call(this);
    }
    
    InlineColorEditor.prototype = Object.create(InlineWidget.prototype);
    InlineColorEditor.prototype.constructor = InlineColorEditor;
    InlineColorEditor.prototype.parentClass = InlineWidget.prototype;
    
    /** @type {!ColorPicker} ColorPicker instance */
    InlineColorEditor.prototype.colorEditor = null;
    
    /** @type {!string} Current value of the color picker control */
    InlineColorEditor.prototype._color = null;
    
    /**
     * Start of the range of code we're attached to; _startBookmark.find() may by null if sync is lost.
     * @type {!CodeMirror.Bookmark}
     */
    InlineColorEditor.prototype._startBookmark = null;
    
    /**
     * End of the range of code we're attached to; _endBookmark.find() may by null if sync is lost or even
     * in some cases when it's not. Call getCurrentRange() for the definitive text range we're attached to.
     * @type {!CodeMirror.Bookmark}
     */
    InlineColorEditor.prototype._endBookmark = null;
    
    /** @type {boolean} True while we're syncing a color picker change into the code editor */
    InlineColorEditor.prototype._isOwnChange = null;
    
    /** @type {boolean} True while we're syncing a code editor change into the color picker */
    InlineColorEditor.prototype._isHostChange = null;
    
    /** @type {number} ID used to identify edits coming from this inline widget for undo batching */
    InlineColorEditor.prototype._origin = null;
    
    
    /**
     * Returns the current text range of the color we're attached to, or null if
     * we've lost sync with what's in the code.
     * @return {?{start:{line:number, ch:number}, end:{line:number, ch:number}}}
     */
    InlineColorEditor.prototype.getCurrentRange = function () {
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
        // This can happen if the user deletes the end of the existing color and then
        // types some more.
        // TODO: when we migrate to CodeMirror v3, we might be able to use markText()
        // instead of two bookmarks to track the range. (In our current old version of
        // CodeMirror v2, markText() isn't robust enough for this case.)
        
        var line = this.hostEditor.document.getLine(start.line),
            matches = line.substr(start.ch).match(ColorUtils.COLOR_REGEX);
        
        // Note that end.ch is exclusive, so we don't need to add 1 before comparing to
        // the matched length here.
        if (matches && (end.ch === undefined || end.ch - start.ch < matches[0].length)) {
            end.ch = start.ch + matches[0].length;
            this._endBookmark.clear();
            this._endBookmark = this.hostEditor._codeMirror.setBookmark(end);
        }
        
        if (end.ch === undefined) {
            // We were unable to resync the end bookmark.
            return null;
        } else {
            return {start: start, end: end};
        }
    };
        
    /**
     * When the color picker's selected color changes, update text in code editor
     * @param {!string} colorString
     */
    InlineColorEditor.prototype._handleColorChange = function (colorString) {
        var self = this;
        if (colorString !== this._color) {
            var range = this.getCurrentRange();
            if (!range) {
                return;
            }

            // Don't push the change back into the host editor if it came from the host editor.
            if (!this._isHostChange) {
                this.hostEditor.document.batchOperation(function () {
                    // Replace old color in code with the picker's color, and select it
                    self._isOwnChange = true;
                    self.hostEditor.document.replaceRange(colorString, range.start, range.end, self._origin);
                    self._isOwnChange = false;
                    self.hostEditor.setSelection(range.start, {
                        line: range.start.line,
                        ch: range.start.ch + colorString.length
                    });
                });
            }
            
            this._color = colorString;
        }
    };
    
    /**
     * @override
     * @param {!Editor} hostEditor
     */
    InlineColorEditor.prototype.load = function (hostEditor) {
        InlineColorEditor.prototype.parentClass.load.apply(this, arguments);
        
        // Create color picker control
        var allColorsInDoc = this.hostEditor.document.getText().match(ColorUtils.COLOR_REGEX);
        var swatchInfo = this._collateColors(allColorsInDoc, MAX_USED_COLORS);
        this.colorEditor = new ColorEditor(this.$htmlContent, this._color, this._handleColorChange, swatchInfo);
    };

    /**
     * @override
     * Perform sizing & focus once we've been added to Editor's DOM
     */
    InlineColorEditor.prototype.onAdded = function () {
        InlineColorEditor.prototype.parentClass.onAdded.apply(this, arguments);
        
        var doc = this.hostEditor.document;
        doc.addRef();
        $(doc).on("change", this._handleHostDocumentChange);
        
        this.hostEditor.setInlineWidgetHeight(this, this.colorEditor.getRootElement().outerHeight(), true);
        
        this.colorEditor.focus();
    };
    
    /**
     * @override
     * Called whenever the inline widget is closed, whether automatically or explicitly
     */
    InlineColorEditor.prototype.onClosed = function () {
        InlineColorEditor.prototype.parentClass.onClosed.apply(this, arguments);

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

    /** Comparator to sort by which colors are used the most */
    function _colorSort(a, b) {
        if (a.count === b.count) {
            return 0;
        }
        if (a.count > b.count) {
            return -1;
        }
        if (a.count < b.count) {
            return 1;
        }
    }

    /**
     * Counts how many times each color in originalArray occurs (ignoring case) and
     * retuns the top 'maxLength' number of unique colors.
     * @param {!Array.<string>} originalArray
     * @param {number} maxLength
     * @return {!Array.<{value:string, count:number}>}
     */
    InlineColorEditor.prototype._collateColors = function (originalArray, maxLength) {
        // Maps from lowercase color name to swatch info (user-case color name & occurrence count)
        /* @type {Object.<string, {value:string, count:number}>} */
        var colorInfo = {};
        
        // Count how many times each color is used
        originalArray.forEach(function (originalColor) {
            var key = originalColor.toLowerCase();
            if (colorInfo[key]) {
                colorInfo[key].count++;
            } else {
                colorInfo[key] = { value: originalColor, count: 1 };
            }
        });
        
        // Convert to an array
        var uniqueColors = $.map(colorInfo, function (info) {
            return info;
        });
        
        // Sort by most-used and return the top N
        uniqueColors.sort(_colorSort);
        return uniqueColors.slice(0, maxLength);
    };
    
    /**
     * When text in the code editor changes, update color picker to reflect it
     */
    InlineColorEditor.prototype._handleHostDocumentChange = function () {
        // Don't push the change into the color editor if it came from the color editor.
        if (this._isOwnChange) {
            return;
        }
        
        var range = this.getCurrentRange();
        if (range) {
            var newColor = this.hostEditor.document.getRange(range.start, range.end);
            if (newColor !== this._color) {
                this._isHostChange = true;
                this.colorEditor.setColorFromString(newColor);
                this._isHostChange = false;
            }
        } else {
            // The edit caused our range to become invalid. Close the editor.
            this.close();
        }
    };

    module.exports.InlineColorEditor = InlineColorEditor;
});
