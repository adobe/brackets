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
        

    var MAX_USED_COLORS = 7;
    
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

    InlineColorEditor.colorRegEx = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/gi;
    
    InlineColorEditor.prototype = new InlineWidget();
    InlineColorEditor.prototype.constructor = InlineColorEditor;
    InlineColorEditor.prototype.parentClass = InlineWidget.prototype;
    InlineColorEditor.prototype.$wrapperDiv = null;
    
    InlineColorEditor.prototype.color = null;
    InlineColorEditor.prototype.startBookmark = null;
    InlineColorEditor.prototype.endBookmark = null;
    InlineColorEditor.prototype.isOwnChange = null;
    InlineColorEditor.prototype.isHostChange = null;
    
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
            matches = line.substr(start.ch).match(InlineColorEditor.colorRegEx);
        
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
        
    InlineColorEditor.prototype.setColor = function (colorLabel) {
        if (!colorLabel) {
            return;
        }
        
        if (colorLabel !== this.color) {
            var range = this.getCurrentRange();
            if (!range) {
                return;
            }

            // Don't push the change back into the host editor if it came from the host editor.
            if (!this.isHostChange) {
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

    InlineColorEditor.prototype.load = function (hostEditor) {
        var selectedColors = [];
        this.editor = hostEditor;
        this.parentClass.load.call(this, hostEditor);
        selectedColors = this.editor.document.getText().match(InlineColorEditor.colorRegEx);
        selectedColors = this.usedColors(selectedColors, MAX_USED_COLORS);
        this.$wrapperDiv = $(Mustache.render(InlineEditorTemplate, Strings));
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
