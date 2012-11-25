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
/*global define, Mustache, brackets, $, window */

define(function (require, exports, module) {
    "use strict";
    
    var InlineWidget         = brackets.getModule("editor/InlineWidget").InlineWidget,
        Strings              = brackets.getModule("strings"),
        ColorEditor          = require("ColorEditor").ColorEditor,
        InlineEditorTemplate = require("text!InlineColorEditorTemplate.html");
        

    /** @const @type {number} */
    var MAX_USED_COLORS = 7;
    
    
    /**
     * Inline widget containing a ColorEditor control
     * @param {!string} color  Initially selected color
     * @param {!CodeMirror.Bookmark} startBookmark
     * @param {!CodeMirror.Bookmark} endBookmark
     */
    function InlineColorEditor(color, startBookmark, endBookmark) {
        this.color = color;
        this.startBookmark = startBookmark;
        this.endBookmark = endBookmark;
        this.isOwnChange = false;
        this.isHostChange = false;

        this.setColor = this.setColor.bind(this);
        this.handleHostDocumentChange = this.handleHostDocumentChange.bind(this);

        InlineWidget.call(this);
    }

    /**
     * Regular expression that matches reasonably well-formed colors in hex format (3 or 6 digits),
     * rgb()/rgba() function format, or hsl()/hsla() function format.
     * @const @type {RegExp}
     */
    InlineColorEditor.COLOR_REGEX = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/gi;
    
    InlineColorEditor.prototype = new InlineWidget();
    InlineColorEditor.prototype.constructor = InlineColorEditor;
    InlineColorEditor.prototype.parentClass = InlineWidget.prototype;
    InlineColorEditor.prototype.$wrapperDiv = null;
    
    /** @type {!string} Current value of the color picker control */
    InlineColorEditor.prototype.color = null;
    
    /**
     * Start of the range of code we're attached to; startBookmark.find() may by null if sync is lost.
     * @type {!CodeMirror.Bookmark}
     */
    InlineColorEditor.prototype.startBookmark = null;
    
    /**
     * End of the range of code we're attached to; endBookmark.find() may by null if sync is lost or even
     * in some cases when it's not. Call getCurrentRange() for the definitive text range we're attached to.
     * @type {!CodeMirror.Bookmark}
     */
    InlineColorEditor.prototype.endBookmark = null;
    
    /** @type {boolean} True while we're syncing a color picker change into the code editor */
    InlineColorEditor.prototype.isOwnChange = null;
    
    /** @type {boolean} True while we're syncing a code editor change into the color picker */
    InlineColorEditor.prototype.isHostChange = null;
    
    
    /**
     * Returns the current text range of the color we're attached to, or null if
     * we've lost sync with what's in the code.
     * @return {?{start:{line:number, ch:number}, end:{line:number, ch:number}}}
     */
    InlineColorEditor.prototype.getCurrentRange = function () {
        var start, end;
        
        start = this.startBookmark.find();
        if (!start) {
            return null;
        }
        
        end = this.endBookmark.find();
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
        
        var line = this.editor.document.getLine(start.line),
            matches = line.substr(start.ch).match(InlineColorEditor.COLOR_REGEX);
        
        // Note that end.ch is exclusive, so we don't need to add 1 before comparing to
        // the matched length here.
        if (matches && (end.ch === undefined || end.ch - start.ch < matches[0].length)) {
            end.ch = start.ch + matches[0].length;
            this.endBookmark.clear();
            this.endBookmark = this.editor._codeMirror.setBookmark(end);
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
     * @param {!string} colorLabel
     */
    InlineColorEditor.prototype.setColor = function (colorLabel) {
        if (colorLabel !== this.color) {
            var range = this.getCurrentRange();
            if (!range) {
                return;
            }

            // Don't push the change back into the host editor if it came from the host editor.
            if (!this.isHostChange) {
                // Replace old color in code with the picker's color, and select it
                this.isOwnChange = true;
                this.editor.document.replaceRange(colorLabel, range.start, range.end);
                this.isOwnChange = false;
                this.editor.setSelection(range.start, {
                    line: range.start.line,
                    ch: range.start.ch + colorLabel.length
                });
            }
            
            this.color = colorLabel;
        }
    };

    /**
     * @override
     * @param {!Editor} hostEditor
     */
    InlineColorEditor.prototype.load = function (hostEditor) {
        this.editor = hostEditor;
        this.parentClass.load.call(this, hostEditor);
        
        // Build the main UI
        this.$wrapperDiv = $(Mustache.render(InlineEditorTemplate, Strings));
        
        // Create color picker control
        var allColorsInDoc = this.editor.document.getText().match(InlineColorEditor.COLOR_REGEX);
        var swatchInfo = this.usedColors(allColorsInDoc, MAX_USED_COLORS);
        this.colorEditor = new ColorEditor(this.$wrapperDiv, this.color, this.setColor, swatchInfo);
        this.$htmlContent.append(this.$wrapperDiv);
    };

    /** @override */
    InlineColorEditor.prototype._editorHasFocus = function () {
        return true;
    };
        
    /**
     * @override
     * Perform sizing & focus once we've been added to Editor's DOM
     */
    InlineColorEditor.prototype.onAdded = function () {
        this.parentClass.onAdded.call(this);
        
        var doc = this.editor.document;
        doc.addRef();
        $(doc).on("change", this.handleHostDocumentChange);
        
        window.setTimeout(this._sizeEditorToContent.bind(this), 0);
        this.colorEditor.focus();
    };
    
    /**
     * @override
     * Called whenever the inline widget is closed, whether automatically or explicitly
     */
    InlineColorEditor.prototype.onClosed = function () {
        if (this.startBookmark) {
            this.startBookmark.clear();
        }
        if (this.endBookmark) {
            this.endBookmark.clear();
        }

        var doc = this.editor.document;
        $(doc).off("change", this.handleHostDocumentChange);
        doc.releaseRef();

        this.parentClass.onClosed.call(this);
    };

    InlineColorEditor.prototype._sizeEditorToContent = function () {
        this.hostEditor.setInlineWidgetHeight(this, this.$wrapperDiv.outerHeight(), true);
    };

    /** Sorts by which colors are used the most */
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
    InlineColorEditor.prototype.usedColors = function (originalArray, maxLength) {
        var copyArray,
            compressed = [];
        
        copyArray = $.map(originalArray, function (color) {
            return color.toLowerCase();
        });
                          
        compressed = $.map(originalArray, function (originalColor) {
            var a = {},
                lastIndex = 0,
                colorCount = 0,
                colorCopy = originalColor.toLowerCase();
            
            do {
                lastIndex = copyArray.indexOf(colorCopy, lastIndex);
                if (lastIndex !== -1) {
                    colorCount++;
                    copyArray.splice(lastIndex, 1);
                }
            } while (lastIndex !== -1 && copyArray.length);
            
            if (colorCount > 0) {
                a.value = originalColor;
                a.count = colorCount;
                return a;
            }
        }).sort(_colorSort);

        return compressed.slice(0, maxLength);
    };
    
    /**
     * When text in the code editor changes, update color picker to reflect it
     */
    InlineColorEditor.prototype.handleHostDocumentChange = function () {
        // Don't push the change into the color editor if it came from the color editor.
        if (this.isOwnChange) {
            return;
        }
        
        var range = this.getCurrentRange();
        if (range) {
            var newColor = this.editor.document.getRange(range.start, range.end);
            if (newColor !== this.color) {
                this.isHostChange = true;
                this.colorEditor.commitColor(newColor, true);
                this.isHostChange = false;
            }
        } else {
            // The edit caused our range to become invalid. Close the editor.
            this.close();
        }
    };

    module.exports.InlineColorEditor = InlineColorEditor;
});
