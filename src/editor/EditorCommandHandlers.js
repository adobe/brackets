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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */


/**
 * Text-editing commands that apply to whichever Editor is currently focused
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var Commands           = require("command/Commands"),
        Strings            = require("strings"),
        CommandManager     = require("command/CommandManager"),
        EditorManager      = require("editor/EditorManager"),
        StringUtils        = require("utils/StringUtils"),
        TokenUtils         = require("utils/TokenUtils");
    
    
    /**
     * List of constants
     */
    var DIRECTION_UP    = -1;
    var DIRECTION_DOWN  = +1;
    
    
    /**
     * @private
     * Searchs for an uncommented line between startLine and endLine
     * @param {!Editor} editor
     * @param {!number} startLine - valid line inside the document
     * @param {!number} endLine - valid line inside the document
     * @return {boolean} true if there is at least one uncommented line
     */
    function _containsUncommented(editor, startLine, endLine) {
        var containsUncommented = false;
        var i;
        var line;
        for (i = startLine; i <= endLine; i++) {
            line = editor.document.getLine(i);
            // A line is commented out if it starts with 0-N whitespace chars, then "//"
            if (!line.match(/^\s*\/\//) && line.match(/\S/)) {
                containsUncommented = true;
                break;
            }
        }
        return containsUncommented;
    }
    
    /**
     * Add or remove line-comment tokens to all the lines in the selected range, preserving selection
     * and cursor position. Applies to currently focused Editor.
     * 
     * If all non-whitespace lines are already commented out, then we uncomment; otherwise we comment
     * out. Commenting out adds "//" to at column 0 of every line. Uncommenting removes the first "//"
     * on each line (if any - empty lines might not have one).
     */
    function lineCommentSlashSlash(editor) {
        
        var doc = editor.document;
        var sel = editor.getSelection();
        var startLine = sel.start.line;
        var endLine = sel.end.line;
        
        // Is a range of text selected? (vs just an insertion pt)
        var hasSelection = (startLine !== endLine) || (sel.start.ch !== sel.end.ch);
        
        // In full-line selection, cursor pos is start of next line - but don't want to modify that line
        if (sel.end.ch === 0 && hasSelection) {
            endLine--;
        }
        
        // Decide if we're commenting vs. un-commenting
        // Are there any non-blank lines that aren't commented out? (We ignore blank lines because
        // some editors like Sublime don't comment them out)
        var containsUncommented = _containsUncommented(editor, startLine, endLine);
        var i;
        var line;
        
        // Make the edit
        doc.batchOperation(function () {
            
            if (containsUncommented) {
                // Comment out - prepend "//" to each line
                for (i = startLine; i <= endLine; i++) {
                    doc.replaceRange("//", {line: i, ch: 0});
                }
                
                // Make sure selection includes "//" that was added at start of range
                if (sel.start.ch === 0 && hasSelection) {
                    // use *current* selection end, which has been updated for our text insertions
                    editor.setSelection({line: startLine, ch: 0}, editor.getSelection().end);
                }
                
            } else {
                // Uncomment - remove first "//" on each line (if any)
                for (i = startLine; i <= endLine; i++) {
                    line = doc.getLine(i);
                    var commentI = line.indexOf("//");
                    if (commentI !== -1) {
                        doc.replaceRange("", {line: i, ch: commentI}, {line: i, ch: commentI + 2});
                    }
                }
            }
        });
        
    }
    
    
    /**
     * @private
     * Moves the token context to the token that starts the block-comment. Ctx starts in a block-comment.
     * Returns the position of the prefix or null if gets to the start of the document and didn't found it.
     * @param {!{editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}}} ctx - token context
     * @param {!RegExp} prefixExp - a valid regular expression
     * @return {?{line: number, ch: number}}
     */
    function _findCommentStart(ctx, prefixExp) {
        var result = true;
        
        while (result && !ctx.token.string.match(prefixExp)) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
        }
        return result ? {line: ctx.pos.line, ch: ctx.token.start} : null;
    }
    
    /**
     * @private
     * Moves the token context to the token that ends the block-comment. Ctx starts in a block-comment.
     * Returns the position of the sufix or null if gets to the end of the document and didn't found it.
     * @param {!{editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}}} ctx - token context
     * @param {!RegExp} suffixExp - a valid regular expression
     * @param {!number} suffixLen - length of the suffix
     * @return {?{line: number, ch: number}}
     */
    function _findCommentEnd(ctx, suffixExp, suffixLen) {
        var result = true;
        
        while (result && !ctx.token.string.match(suffixExp)) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
        }
        return result ? {line: ctx.pos.line, ch: ctx.token.end - suffixLen} : null;
    }
    
    /**
     * @private
     * Moves the token context to the next block-comment if there is one before end.
     * @param {!{editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}}} ctx - token context
     * @param {!{line: number, ch: number}} end - where to stop searching
     * @param {!RegExp} prefixExp - a valid regular expression
     * @return {boolean} - true if it found a block-comment
     */
    function _findNextBlockComment(ctx, end, prefixExp) {
        var index  = ctx.editor.indexFromPos(end),
            inside = ctx.editor.indexFromPos(ctx.pos) <= index,
            result = true;
        
        while (result && inside && !ctx.token.string.match(prefixExp)) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
            inside = ctx.editor.indexFromPos(ctx.pos) <= index;
        }
        return result && inside && !!ctx.token.string.match(prefixExp);
    }
    
    /**
     * Add or remove block-comment tokens to the selection, preserving selection
     * and cursor position. Applies to the currently focused Editor.
     * 
     * If the selection is inside a block-comment or one block-comment is inside or partially
     * inside the selection we uncomment; otherwise we comment out.
     * Commenting out adds the prefix before the selection and the suffix after.
     * Uncommenting removes them.
     * 
     * If slashComment is true and the start or end of the selection is inside a line-comment it 
     * will try to do a line uncomment if is not actually inside a bigger block comment and all
     * the lines in the selection are line-commented.
     *
     * @param {!Editor} editor
     * @param {!String} prefix
     * @param {!String} suffix
     * @param {boolean=} slashComment - true if the mode also supports "//" comments
     */
    function blockCommentPrefixSuffix(editor, prefix, suffix, slashComment) {
        
        var doc            = editor.document,
            sel            = editor.getSelection(),
            ctx            = TokenUtils.getInitialContext(editor._codeMirror, {line: sel.start.line, ch: sel.start.ch}),
            startCtx       = TokenUtils.getInitialContext(editor._codeMirror, {line: sel.start.line, ch: sel.start.ch}),
            endCtx         = TokenUtils.getInitialContext(editor._codeMirror, {line: sel.end.line, ch: sel.end.ch}),
            prefixExp      = new RegExp("^" + StringUtils.regexEscape(prefix), "g"),
            suffixExp      = new RegExp(StringUtils.regexEscape(suffix) + "$", "g"),
            lineExp        = new RegExp("^\/\/"),
            prefixPos      = null,
            suffixPos      = null,
            canComment     = false,
            invalidComment = false,
            lineUncomment  = false;
        
        var result, text, line;
        
        // Move the context to the first non-empty token.
        if (ctx.token.className === null) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
        }
        
        // Check if we should just do a line uncomment (if all lines in the selection are commented).
        if (slashComment && (ctx.token.string.match(lineExp) || endCtx.token.string.match(lineExp))) {
            // Find if we aren't actually inside a block-comment
            result = true;
            while (result && ctx.token.string.match(lineExp)) {
                result = TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
            }
            
            if (!result || ctx.token.className !== "comment" || ctx.token.string.match(suffixExp)) {
                // We aren't in an block-comment. Find if all the lines are line-commented.
                if (!_containsUncommented(editor, sel.start.line, sel.end.line)) {
                    lineUncomment = true;
                
                // If can't uncomment then do nothing, since it would create an invalid comment.
                } else {
                    invalidComment = true;
                }
            } else {
                prefixPos = _findCommentStart(startCtx, prefixExp);
                suffixPos = _findCommentEnd(startCtx, suffixExp, suffix.length);
            }
            
        // If we are in a selection starting and ending in invalid tokens and with no content (not considering spaces),
        // find if we are inside a block-comment.
        } else if (startCtx.token.className === null && endCtx.token.className === null &&
                !editor.posWithinRange(ctx.pos, startCtx.pos, endCtx.pos)) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, startCtx);
            
            // We found a comment, find the start and end and check if the selection is inside the block-comment.
            if (startCtx.token.className === "comment") {
                prefixPos = _findCommentStart(startCtx, prefixExp);
                suffixPos = _findCommentEnd(startCtx, suffixExp, suffix.length);
                
                if (prefixPos !== null && suffix !== null && !editor.posWithinRange(sel.start, prefixPos, suffixPos)) {
                    canComment = true;
                }
            } else {
                canComment = true;
            }
        
        // If the start is inside a comment, find the prefix and suffix positions.
        } else if (ctx.token.className === "comment") {
            prefixPos = _findCommentStart(ctx, prefixExp);
            suffixPos = _findCommentEnd(ctx, suffixExp, suffix.length);
            
        // If not try to find the first comment inside the selection.
        } else {
            result = _findNextBlockComment(ctx, sel.end, prefixExp);
            
            // If nothing was found is ok to comment.
            if (!result) {
                canComment = true;
            } else {
                if (!ctx.token.string.match(prefixExp)) {
                    prefixPos = _findCommentStart(ctx, prefixExp);
                } else {
                    prefixPos = {line: ctx.pos.line, ch: ctx.token.start};
                }
                suffixPos = _findCommentEnd(ctx, suffixExp, suffix.length);
            }
        }
        
        // Search if there is another comment in the selection. Do nothing if there is one.
        if (!canComment && !invalidComment && !lineUncomment && suffixPos) {
            var start = {line: suffixPos.line, ch: suffixPos.ch + suffix.length + 1};
            if (editor.posWithinRange(start, sel.start, sel.end)) {
                // Start searching at the next token, if there is one.
                result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
                result = !result || _findNextBlockComment(ctx, sel.end, prefixExp);
                
                if (result) {
                    invalidComment = true;
                }
            }
        }
        
        
        // Make the edit
        if (invalidComment) {
            return;
        
        } else if (lineUncomment) {
            lineCommentSlashSlash(editor);
        
        } else {
            doc.batchOperation(function () {
                
                if (canComment) {
                    // Comment out - add the suffix to the start and the prefix to the end.
                    var completeLineSel = sel.start.ch === 0 && sel.end.ch === 0 && sel.start.line < sel.end.line;
                    if (completeLineSel) {
                        doc.replaceRange(suffix + "\n", sel.end);
                        doc.replaceRange(prefix + "\n", sel.start);
                    } else {
                        doc.replaceRange(suffix, sel.end);
                        doc.replaceRange(prefix, sel.start);
                    }
                    
                    // Correct the selection.
                    if (completeLineSel) {
                        editor.setSelection({line: sel.start.line + 1, ch: 0}, {line: sel.end.line + 1, ch: 0});
                    } else {
                        var newSelStart = {line: sel.start.line, ch: sel.start.ch + prefix.length};
                        if (sel.start.line === sel.end.line) {
                            editor.setSelection(newSelStart, {line: sel.end.line, ch: sel.end.ch + prefix.length});
                        } else {
                            editor.setSelection(newSelStart, {line: sel.end.line, ch: sel.end.ch});
                        }
                    }
                
                // Uncomment - remove prefix and suffix.
                } else {
                    // Find if the prefix and suffix are at the ch 0 and if they are the only thing in the line.
                    // If both are found we assume that a complete line selection comment added new lines, so we remove them.
                    var prefixAtStart = false, suffixAtStart = false;
                    
                    line = doc.getLine(prefixPos.line).trim();
                    prefixAtStart = prefixPos.ch === 0 && prefix.length === line.length;
                    if (suffixPos) {
                        line = doc.getLine(suffixPos.line).trim();
                        suffixAtStart = suffixPos.ch === 0 && suffix.length === line.length;
                    }
                    
                    // Remove the suffix if there is one
                    if (suffixPos) {
                        if (prefixAtStart && suffixAtStart) {
                            doc.replaceRange("", suffixPos, {line: suffixPos.line + 1, ch: 0});
                        } else {
                            doc.replaceRange("", suffixPos, {line: suffixPos.line, ch: suffixPos.ch + suffix.length});
                        }
                    }
                    
                    // Remove the prefix
                    if (prefixAtStart && suffixAtStart) {
                        doc.replaceRange("", prefixPos, {line: prefixPos.line + 1, ch: 0});
                    } else {
                        doc.replaceRange("", prefixPos, {line: prefixPos.line, ch: prefixPos.ch + prefix.length});
                    }
                }
            });
        }
    }
    
    
    /**
     * Add or remove block-comment tokens to the selection, preserving selection
     * and cursor position. Applies to the currently focused Editor.
     * 
     * The implementation uses blockCommentPrefixSuffix, with the exception of the case where
     * there is no selection on a uncommented and not empty line. In this case the whole lines gets
     * commented in a block-comment.
     *
     * @param {!Editor} editor
     * @param {!String} prefix
     * @param {!String} suffix
     */
    function lineCommentPrefixSuffix(editor, prefix, suffix) {
        var sel             = editor.getSelection(),
            selStart        = sel.start,
            selEnd          = sel.end,
            prefixExp       = new RegExp("^" + StringUtils.regexEscape(prefix), "g"),
            isLineSelection = sel.start.ch === 0 && sel.end.ch === 0 && sel.start.line !== sel.end.line,
            isMultipleLine  = sel.start.line !== sel.end.line,
            lineLength      = editor.document.getLine(sel.start.line).length;
        
        // Line selections already behave like we want to
        if (!isLineSelection) {
            // For a multiple line selection transform it to a multiple whole line selection
            if (isMultipleLine) {
                selStart = {line: sel.start.line, ch: 0};
                selEnd   = {line: sel.end.line + 1, ch: 0};
            
            // For one line selections, just start at column 0 and end at the end of the line
            } else {
                selStart = {line: sel.start.line, ch: 0};
                selEnd   = {line: sel.end.line, ch: lineLength};
            }
        }
        
        // If the selection includes a comment or is already a line selection, delegate to Block-Comment
        var ctx     = TokenUtils.getInitialContext(editor._codeMirror, {line: selStart.line, ch: selStart.ch});
        var hasNext = _findNextBlockComment(ctx, selEnd, prefixExp);
        if (ctx.token.className === "comment" || hasNext || isLineSelection) {
            blockCommentPrefixSuffix(editor, prefix, suffix, false);
        
        } else {
            // Set the new selection and comment it
            editor.setSelection(selStart, selEnd);
            blockCommentPrefixSuffix(editor, prefix, suffix, false);
            
            // Restore the old selection taking into account the prefix change
            if (isMultipleLine) {
                sel.start.line++;
                sel.end.line++;
            } else {
                sel.start.ch += prefix.length;
                sel.end.ch += prefix.length;
            }
            editor.setSelection(sel.start, sel.end);
        }
    }
    
    
    /**
     * Invokes a language-specific block-comment/uncomment handler
     * @param {?Editor} editor If unspecified, applies to the currently focused editor
     */
    function blockComment(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }
        
        var mode = editor.getModeForSelection();
        
        if (mode === "javascript" || mode === "less") {
            blockCommentPrefixSuffix(editor, "/*", "*/", true);
        } else if (mode === "css") {
            blockCommentPrefixSuffix(editor, "/*", "*/", false);
        } else if (mode === "html") {
            blockCommentPrefixSuffix(editor, "<!--", "-->", false);
        }
    }
    
    /**
     * Invokes a language-specific line-comment/uncomment handler
     * @param {?Editor} editor If unspecified, applies to the currently focused editor
     */
    function lineComment(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }
        
        var mode = editor.getModeForSelection();
        
        // Currently we only support languages with "//" commenting
        if (mode === "javascript" || mode === "less") {
            lineCommentSlashSlash(editor);
        } else if (mode === "css") {
            lineCommentPrefixSuffix(editor, "/*", "*/");
        } else if (mode === "html") {
            lineCommentPrefixSuffix(editor, "<!--", "-->");
        }
    }
    
    
    /**
     * Duplicates the selected text, or current line if no selection. The cursor/selection is left
     * on the second copy.
     */
    function duplicateText(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        var sel = editor.getSelection(),
            hasSelection = (sel.start.line !== sel.end.line) || (sel.start.ch !== sel.end.ch),
            delimiter = "";

        if (!hasSelection) {
            sel.start.ch = 0;
            sel.end = {line: sel.start.line + 1, ch: 0};
            if (sel.end.line === editor.lineCount()) {
                delimiter = "\n";
            }
        }

        // Make the edit
        var doc = editor.document;

        var selectedText = doc.getRange(sel.start, sel.end) + delimiter;
        doc.replaceRange(selectedText, sel.start);
    }

    /**
     * Deletes the current line if there is no selection or the lines for the selection
     * (removing the end of line too)
     */
    function deleteCurrentLines(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        var from,
            to,
            sel = editor.getSelection(),
            doc = editor.document;

        from = {line: sel.start.line, ch: 0};
        to = {line: sel.end.line + 1, ch: 0};
        if (to.line === editor.getLastVisibleLine() + 1) {
            // Instead of deleting the newline after the last line, delete the newline
            // before the first line--unless this is the entire visible content of the editor,
            // in which case just delete the line content.
            if (from.line > editor.getFirstVisibleLine()) {
                from.line -= 1;
                from.ch = doc.getLine(from.line).length;
            }
            to.line -= 1;
            to.ch = doc.getLine(to.line).length;
        }
        
        doc.replaceRange("", from, to);
    }
    
    /**
     * Moves the selected text, or current line if no selection. The cursor/selection 
     * moves with the line/lines.
     * @param {Editor} editor - target editor
     * @param {Number} direction - direction of the move (-1,+1) => (Up,Down)
     */
    function moveLine(editor, direction) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }
        
        var doc = editor.document,
            sel = editor.getSelection(),
            originalSel = editor.getSelection(),
            hasSelection = (sel.start.line !== sel.end.line) || (sel.start.ch !== sel.end.ch);
        
        sel.start.ch = 0;
        // The end of the selection becomes the start of the next line, if it isn't already
        if (!hasSelection || sel.end.ch !== 0) {
            sel.end = {line: sel.end.line + 1, ch: 0};
        }
        
        // Make the move
        switch (direction) {
        case DIRECTION_UP:
            if (sel.start.line !== 0) {
                doc.batchOperation(function () {
                    var prevText = doc.getRange({ line: sel.start.line - 1, ch: 0 }, sel.start);
                    
                    if (sel.end.line === editor.lineCount()) {
                        prevText = "\n" + prevText.substring(0, prevText.length - 1);
                    }
                    
                    doc.replaceRange("", { line: sel.start.line - 1, ch: 0 }, sel.start);
                    doc.replaceRange(prevText, { line: sel.end.line - 1, ch: 0 });
                    
                    // Make sure CodeMirror hasn't expanded the selection to include
                    // the line we inserted below.
                    originalSel.start.line--;
                    originalSel.end.line--;
                    editor.setSelection(originalSel.start, originalSel.end);
                });
            }
            break;
        case DIRECTION_DOWN:
            if (sel.end.line < editor.lineCount()) {
                doc.batchOperation(function () {
                    var nextText = doc.getRange(sel.end, { line: sel.end.line + 1, ch: 0 });
                    
                    var deletionStart = sel.end;
                    if (sel.end.line === editor.lineCount() - 1) {
                        nextText += "\n";
                        deletionStart = { line: sel.end.line - 1, ch: doc.getLine(sel.end.line - 1).length };
                    }
    
                    doc.replaceRange("", deletionStart, { line: sel.end.line + 1, ch: 0 });
                    doc.replaceRange(nextText, { line: sel.start.line, ch: 0 });
                });
            }
            break;
        }
    }
    
    /**
     * Moves the selected text, or current line if no selection, one line up. The cursor/selection 
     * moves with the line/lines.
     */
    function moveLineUp(editor) {
        moveLine(editor, DIRECTION_UP);
    }
    
    /**
     * Moves the selected text, or current line if no selection, one line down. The cursor/selection 
     * moves with the line/lines.
     */
    function moveLineDown(editor) {
        moveLine(editor, DIRECTION_DOWN);
    }

    /**
     * Indent a line of text if no selection. Otherwise, indent all lines in selection.
     */
    function indentText() {
        var editor = EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }
        
        editor._codeMirror.execCommand("indentMore");
    }
    
    /**
     * Unindent a line of text if no selection. Otherwise, unindent all lines in selection.
     */
    function unidentText() {
        var editor = EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }
        
        editor._codeMirror.execCommand("indentLess");
    }

    function selectLine(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (editor) {
            var sel  = editor.getSelection();
            var from = {line: sel.start.line, ch: 0};
            var to   = {line: sel.end.line + 1, ch: 0};
            
            if (to.line === editor.getLastVisibleLine() + 1) {
                // Last line: select to end of line instead of start of (hidden/nonexistent) following line,
                // which due to how CM clips coords would only work some of the time
                to.line -= 1;
                to.ch = editor.document.getLine(to.line).length;
            }
            
            editor.setSelection(from, to);
        }
    }
        
    // Register commands
    CommandManager.register(Strings.CMD_INDENT,         Commands.EDIT_INDENT,           indentText);
    CommandManager.register(Strings.CMD_UNINDENT,       Commands.EDIT_UNINDENT,         unidentText);
    CommandManager.register(Strings.CMD_COMMENT,        Commands.EDIT_LINE_COMMENT,     lineComment);
    CommandManager.register(Strings.CMD_BLOCK_COMMENT,  Commands.EDIT_BLOCK_COMMENT,    blockComment);
    CommandManager.register(Strings.CMD_DUPLICATE,      Commands.EDIT_DUPLICATE,        duplicateText);
    CommandManager.register(Strings.CMD_DELETE_LINES,   Commands.EDIT_DELETE_LINES,     deleteCurrentLines);
    CommandManager.register(Strings.CMD_LINE_UP,        Commands.EDIT_LINE_UP,          moveLineUp);
    CommandManager.register(Strings.CMD_LINE_DOWN,      Commands.EDIT_LINE_DOWN,        moveLineDown);
    CommandManager.register(Strings.CMD_SELECT_LINE,    Commands.EDIT_SELECT_LINE,      selectLine);
});
