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
        InlineEditorTemplate = require("text!InlineColorEditorTemplate.html");

    var MAX_USED_COLORS = 7;
    
    function InlineColorEditor(color, startBookmark, endBookmark) {
        this.color = color;
        this.startBookmark = startBookmark;
        this.endBookmark = endBookmark;
        this.setColor = this.setColor.bind(this);
        this.handleHostDocumentChange = this.handleHostDocumentChange.bind(this);
        this.isOwnChange = false;
        this.isHostChange = false;

        InlineWidget.call(this);
    }

    InlineColorEditor.colorRegEx = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/gi;
    
    InlineColorEditor.prototype = new InlineWidget();
    InlineColorEditor.prototype.constructor = InlineColorEditor;
    InlineColorEditor.prototype.parentClass = InlineWidget.prototype;
    InlineColorEditor.prototype.$wrapperDiv = null;
    
    InlineColorEditor.prototype.getCurrentRange = function () {
        var start, end;
        
        start = this.startBookmark.find();
        if (!start) {
            return null;
        }
        
        end = this.endBookmark.find();
        if (!end || start.ch === end.ch) {
            // Try to re-locate the end by matching the color regex.
            var endCh,
                matches = this.editor.document.getLine(start.line).slice(start.ch).match(InlineColorEditor.colorRegEx);
            if (matches) {
                endCh = start.ch + matches[0].length;
            } else {
                // Couldn't match a color. Assume our current color length.
                endCh = start.ch + (this.color ? this.color.length : 0);
            }
            end = { line: start.line, ch: endCh };
            
            // Update our end bookmark.
            this.endBookmark.clear();
            this.endBookmark = this.editor._codeMirror.setBookmark(end);
        }
        
        return {start: start, end: end};
    };
        
    InlineColorEditor.prototype.setColor = function (colorLabel) {
        if (this.isHostChange || !colorLabel) {
            return;
        }
        
        if (colorLabel !== this.color) {
            var range = this.getCurrentRange();
            if (!range) {
                return;
            }
            
            this.isOwnChange = true;
            this.editor.document.replaceRange(colorLabel, range.start, range.end);
            this.isOwnChange = false;
            this.editor.setSelection(range.start, {
                line: range.start.line,
                ch: range.start.ch + colorLabel.length
            });
            this.color = colorLabel;
        }
    };

    InlineColorEditor.prototype.load = function (hostEditor) {
        var selectedColors = [];
        this.editor = hostEditor;
        this.parentClass.load.call(this, hostEditor);
        selectedColors = this.editor.document.getText().match(InlineColorEditor.colorRegEx);
        selectedColors = this.usedColors(selectedColors, MAX_USED_COLORS);
        this.$wrapperDiv = $(InlineEditorTemplate);
        this.colorEditor = new ColorEditor(this.$wrapperDiv, this.color, this.setColor, selectedColors);
        this.$htmlContent.append(this.$wrapperDiv);
    };

    InlineColorEditor.prototype._editorHasFocus = function () {
        return true;
    };
        
    InlineColorEditor.prototype.onAdded = function () {
        this.parentClass.onAdded.call(this);
        
        var doc = this.editor.document;
        doc.addRef();
        $(doc).on("change", this.handleHostDocumentChange);
        
        window.setTimeout(this._sizeEditorToContent.bind(this));
        this.colorEditor.focus();
    };
    
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
    
    InlineColorEditor.prototype.handleHostDocumentChange = function () {
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
        }
    };

    module.exports.InlineColorEditor = InlineColorEditor;
});
