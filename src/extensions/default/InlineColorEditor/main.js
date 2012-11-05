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
/*global define, brackets, $, document */

define(function (require, exports, module) {
    "use strict";
    
    var EditorManager       = brackets.getModule("editor/EditorManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        InlineColorEditor   = require("InlineColorEditor").InlineColorEditor;
    
    var _colorPickers = {};

    function _onClosed(colorPicker) {
        return delete _colorPickers[colorPicker.pos.line];
    }
    
    function inlineColorEditorProvider(hostEditor, pos) {
        var colorPicker, colorRegEx, cursorLine, end, inlineColorEditor, match, result, sel, start;
        sel = hostEditor.getSelection();
        if (sel.start.line !== sel.end.line) {
            return null;
        }
        
        colorRegEx = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/i;
        cursorLine = hostEditor.document.getLine(pos.line);
        match = cursorLine.match(colorRegEx);
        
        if (!match) {
            return null;
        } else {
            start = match.index;
            end = start + match[0].length;
            if (pos.ch < start || pos.ch > end) {
                return null;
            }
        }
        
        pos.ch = start;
        colorPicker = _colorPickers[pos.line];
        if (colorPicker) {
            colorPicker.close();
            if (match[0] === colorPicker.color) {
                return null;
            }
        }
        
        hostEditor.setSelection({ line: pos.line, ch: start },
                                { line: pos.line, ch: end });
        
        result = new $.Deferred();
        inlineColorEditor = new InlineColorEditor(match[0], pos);
        inlineColorEditor.onClosed = _onClosed;
        inlineColorEditor.load(hostEditor);
        _colorPickers[pos.line] = inlineColorEditor;
        result.resolve(inlineColorEditor);
        return result.promise();
    }
    
    // Initialize extension
    ExtensionUtils.loadStyleSheet(module, "css/main.css");
    
    EditorManager.registerInlineEditProvider(inlineColorEditorProvider);
    
    // for unit tests only
    exports.inlineColorEditorProvider = inlineColorEditorProvider;
});
