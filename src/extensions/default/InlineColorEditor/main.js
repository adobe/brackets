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
/*global define, brackets, $, document, tinycolor */

define(function (require, exports, module) {
    "use strict";
    
    var EditorManager       = brackets.getModule("editor/EditorManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        TokenUtils          = brackets.getModule("utils/TokenUtils"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        InlineColorEditor   = require("InlineColorEditor").InlineColorEditor;
    
    function _isValidColorName(colorString) {
        return (colorString && tinycolor.names[colorString]);
    }
    
    function _findMatchAtPos(regEx, searchInText, pos) {
        var match, start, end;
        
        if (!regEx.global) {
            return null;
        }
        
        // Loop through each match of regEx and stop when the one that contains pos is found.
        do {
            match = regEx.exec(searchInText);
            if (match) {
                start = match.index;
                end = start + match[0].length;
            }
        } while (match && (pos < start || pos > end));
        
        return match;
    }

    function _canAddColorAtPos(editor, ctx, pos) {
        var mode, tagInfo;
        
        if (!editor || !ctx || !pos) {
            return false;
        }
        
        mode = editor.getModeForSelection();
        if (mode === "html") {
            tagInfo = HTMLUtils.getTagInfo(editor, pos);
            if (tagInfo && tagInfo.attr && tagInfo.attr.value && tagInfo.position) {
                if (tagInfo.position.tokenType === HTMLUtils.ATTR_VALUE && tagInfo.attr.name !== "style") {
                    return false;
                }
                if (!tagInfo.attr.value.substring(0, tagInfo.position.offset).match(/color\s*\:\s*$/)) {
                    return false;
                }
            }
        } else if (mode === "css") {
            if (ctx.token.string !== ":" && !TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx)) {
                return false;
            } else if (ctx.token.string !== ":" || !TokenUtils.movePrevToken(ctx) || !ctx.token.string.match(/color\s*$/)) {
                return false;
            }
        } else {
            return false;
        }
        return true;
    }
    
    /**
     * Registered as an inline editor provider: creates an InlineEditorColor when the cursor
     * is on a color value (in any flavor of code).
     *
     * @param {!Editor} hostEditor
     * @param {!{line:Number, ch:Number}} pos
     * @return {?$.Promise} synchronously resolved with an InlineWidget, or null if there's
     *      no color at pos.
     */
    function inlineColorEditorProvider(hostEditor, pos) {
        var colorPicker, colorRegEx, cursorLine, inlineColorEditor, match, result,
            sel, start, end, startBookmark, endBookmark, curPos, ctx;
        
        sel = hostEditor.getSelection();
        if (sel.start.line !== sel.end.line) {
            return null;
        }
        
        colorRegEx = new RegExp(InlineColorEditor.COLOR_REGEX);
        cursorLine = hostEditor.document.getLine(pos.line);
        
        match = _findMatchAtPos(colorRegEx, cursorLine, pos.ch);
        
        if (!match) {
            curPos = $.extend({}, sel.end);
            ctx = TokenUtils.getInitialContext(hostEditor._codeMirror, curPos);
            
            // In case cursor is at the beginning of the color string, then we need to get 
            // the next token for the actual color string.
            if (ctx.token.string.length > 0 && ctx.token.string.trim().length === 0) {
                TokenUtils.moveNextToken(ctx);
            }
            if (_isValidColorName(ctx.token.string)) {
                colorRegEx = new RegExp("\\b" + ctx.token.string + "\\b", "g");
                match = _findMatchAtPos(colorRegEx, cursorLine, pos.ch);
            } else {
                // Find any invalid or incomplete rgb/hsl/hex color string to edit
                colorRegEx = new RegExp(/(rgb|hsl)a?\(.*\)|#[0-9a-zA-Z]+/g);
                match = _findMatchAtPos(colorRegEx, cursorLine, pos.ch);
                if (!match) {
                    // Find any incomplete rgb or hsl color string to edit
                    colorRegEx = new RegExp(/(rgb|hsl)a?\(?/g);
                    match = _findMatchAtPos(colorRegEx, cursorLine, pos.ch);
                }
            }
            if (!match) {
                // See we can add a new color at current cursor location or context.
                if (_canAddColorAtPos(hostEditor, ctx, curPos)) {
                    start = end = pos.ch;
                } else {
                    return null;
                }
            }
        }
        
        if (match) {
            start = match.index;
            end = start + match[0].length;
        }
        
        // Adjust pos to the beginning of the match so that the inline editor won't get 
        // dismissed while we're updating the color with the new values from user's inline editing.
        pos.ch = start;
        
        startBookmark = hostEditor._codeMirror.setBookmark(pos);
        endBookmark = hostEditor._codeMirror.setBookmark({ line: pos.line, ch: end });
        
        hostEditor.setSelection(pos, { line: pos.line, ch: end });
        
        inlineColorEditor = new InlineColorEditor(match ? match[0] : null, startBookmark, endBookmark);
        inlineColorEditor.load(hostEditor);

        result = new $.Deferred();
        result.resolve(inlineColorEditor);
        return result.promise();
    }
    
    
    // Initialize extension
    ExtensionUtils.loadStyleSheet(module, "css/main.css");
    
    EditorManager.registerInlineEditProvider(inlineColorEditorProvider);
    
    
    // for unit tests only
    exports.inlineColorEditorProvider = inlineColorEditorProvider;
});
