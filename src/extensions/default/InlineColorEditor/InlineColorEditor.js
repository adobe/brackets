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

        InlineWidget.call(this);
    }

    InlineColorEditor.colorRegEx = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/gi;
    
    InlineColorEditor.prototype = new InlineWidget();
    InlineColorEditor.prototype.constructor = InlineColorEditor;
    InlineColorEditor.prototype.parentClass = InlineWidget.prototype;
    InlineColorEditor.prototype.$wrapperDiv = null;
    
    InlineColorEditor.prototype.setColor = function (colorLabel) {
        var start, end;
        if (!colorLabel) {
            return;
        }
        
        if (colorLabel !== this.color) {
            start = this.startBookmark.find();
            if (!start) {
                return;
            }
            
            end = this.endBookmark.find();
            if (!end || start.ch === end.ch) {
                end = { line: start.line,
                        ch: start.ch + (this.color ? this.color.length : 0) };
            }
            
            this.editor.document.replaceRange(colorLabel, start, end);
            this.editor.setSelection(start, {
                line: start.line,
                ch: start.ch + colorLabel.length
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
        
    InlineColorEditor.prototype.clearBookmarks = function () {
        this.startBookmark.clear();
        this.endBookmark.clear();
    };
        
    InlineColorEditor.prototype.onAdded = function () {
        window.setTimeout(this._sizeEditorToContent.bind(this));
        this.colorEditor.focus();
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

    InlineColorEditor.prototype.usedColors = function (originalArray, length) {
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

        return compressed;
    };

    module.exports.InlineColorEditor = InlineColorEditor;
});
