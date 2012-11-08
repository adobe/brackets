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
        StringUtils        = require("utils/StringUtils");
    
    
    /**
     * List of constants
     */
    var DIRECTION_UP    = -1;
    var DIRECTION_DOWN  = +1;
    
    
    /**
     * @private
     * Searchs for an uncomented line in between sartLine and endLine
     * @param {!Editor} editor
     * @param {!number} startLine - valid line inside the document
     * @param {!number} endLine - valid line inside the document
     * @return {boolean} true if there is at least one uncomented line
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
        }
    }
    
    
    /**
     * @private
     * Returns the position of the block-comment starting prefix for the block-comment passed.
     * @param {!Editor} editor
     * @param {!{line: number, ch: number}} start - must be a position inside a block-comment
     * @param {!RegExp} prefixExp - a valid regular expression
     * @return {{line: number, ch: number}}
     */
    function _findCommentStart(editor, start, prefixExp) {
        var pos   = {line: start.line, ch: start.ch},
            token = editor._codeMirror.getTokenAt(pos),
            line  = "";
        
        while (!token.string.match(prefixExp)) {
            pos.line--;
            line   = editor.document.getLine(pos.line);
            pos.ch = line.length - 1;
            token  = editor._codeMirror.getTokenAt(pos);
        }
        return {line: pos.line, ch: token.start};
    }
    
    /**
     * @private
     * Returns the position of the block-comment ending suffix for the block-comment passed.
     * Returns null if gets to the end of the document and didn't found it.
     * @param {Editor} editor
     * @param {!{line: number, ch: number}} start - must be a position inside a block-comment
     * @param {!RegExp} suffixExp - a valid regular expression
     * @param {!number} suffixLen - length of the suffix
     * @return {?{line: number, ch: number}}
     */
    function _findCommentEnd(editor, start, suffixExp, suffixLen) {
        var pos   = {line: start.line, ch: start.ch},
            token = editor._codeMirror.getTokenAt(pos),
            total = editor.lineCount() - 1,
            line  = "";
        
        while (pos.line < total && !token.string.match(suffixExp)) {
            pos.line++;
            line   = editor.document.getLine(pos.line);
            pos.ch = line.indexOf(line.trim().charAt(0)) + 1;
            token  = editor._codeMirror.getTokenAt(pos);
        }
        return (pos.line === total) ? null : {line: pos.line, ch: token.end - suffixLen};
    }
    
    /**
     * @private
     * Returns the position position of the next block-comment (the character position will be
     * inside a block-comment and not necessarily at the start character).
     * Returns null if there isn't one in between start and end.
     * @param {!Editor} editor
     * @param {!{line: number, ch: number}} start - from where to start searching
     * @param {!{line: number, ch: number}} end - where to stop searching
     * @param {!RegExp} prefixExp - a valid regular expression
     * @return {?{line: number, ch: number}}
     */
    function _findNextCommentToken(editor, start, end, prefixExp) {
        var pos   = {line: start.line, ch: start.ch + 1},
            token = editor._codeMirror.getTokenAt(pos),
            line  = editor.document.getLine(pos.line);
        
        while (token.className !== "comment" || token.string.match(/^\/\//)) {
            pos.ch++;
            if (pos.line === end.line && (pos.ch > end.ch || pos.ch >= line.length)) {
                break;
            } else if (pos.ch >= line.length) {
                pos.line++;
                line   = editor.document.getLine(pos.line);
                pos.ch = line.indexOf(line.trim().charAt(0)) + 1;
            }
            token = editor._codeMirror.getTokenAt(pos);
        }
        return token.className !== "comment" || token.string.match(/^\/\//) ? null : pos;
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
     * @param {?boolean} slashComment - if the mode also supports "//" comments
     */
    function blockCommentPrefixSuffix(editor, prefix, suffix, slashComment) {
        
        var doc         = editor.document,
            sel         = editor.getSelection(),
            lineCount   = editor.lineCount(),
            startToken  = editor._codeMirror.getTokenAt(sel.start),
            endToken    = editor._codeMirror.getTokenAt(sel.end),
            prefixExp   = new RegExp("^" + StringUtils.regexEscape(prefix), "g"),
            suffixExp   = new RegExp(StringUtils.regexEscape(suffix) + "$", "g"),
            prefixPos   = null,
            suffixPos   = null,
            canComment  = false;
        
        var i, pos, line, token, start;
        
        // Check if we should just do a line uncomment (if all lines in the selection are commented)
        if (slashComment && (startToken.string.match(/^\/\//) || endToken.string.match(/^\/\//))) {
            // Check if the line-comment is actually inside a block-comment
            line  = editor.document.getLine(sel.start.line - 1);
            token = editor._codeMirror.getTokenAt({line: sel.start.line - 1, ch: line.length - 1});
            
            if (!token.string.match(prefixExp)) {
                if (!_containsUncommented(editor, sel.start.line, sel.end.line)) {
                    lineCommentSlashSlash(editor);
                    return;
                // If can't uncomment then let the user comment even if it will be an invalid block-comment
                } else {
                    canComment = true;
                }
            } else {
                start     = line.indexOf(line.trim().charAt(0)) + 1;
                prefixPos = _findCommentStart(editor, {line: sel.start.line - 1, ch: line.length - 1}, prefixExp);
                suffixPos = _findCommentEnd(editor, {line: sel.start.line + 1, ch: start}, suffixExp, suffix.length);
            }
        
        // If the start of the selection is inside a comment, find the start
        } else if (startToken.className === "comment" && startToken.end > sel.start.ch) {
            prefixPos = _findCommentStart(editor, sel.start, prefixExp);
            suffixPos = _findCommentEnd(editor, sel.start, suffixExp, suffix.length);
        
        // If this is a one line selection and is before the text or in an "empty" line
        } else if (sel.start.line === sel.end.line && endToken.className === null) {
            // Find the first not empty line
            i = sel.start.line;
            do {
                line = doc.getLine(i);
                i--;
            } while (line.trim().length === 0 && i >= 0);
            
            // Get the token at the first character after the spaces
            pos   = {line: i, ch: line.indexOf(line.trim().charAt(0)) + 1};
            token = editor._codeMirror.getTokenAt(pos);
            
            if (token.className === "comment") {
                prefixPos = _findCommentStart(editor, pos, prefixExp);
                suffixPos = _findCommentEnd(editor, pos, suffixExp, suffix.length);
            } else {
                canComment = true;
            }
            
        // If not try to find the first comment inside the selection
        } else {
            pos = _findNextCommentToken(editor, sel.start, sel.end, prefixExp);
            
            // If nothing was found is ok to comment
            if (pos === null) {
                canComment = true;
            } else {
                token = editor._codeMirror.getTokenAt(pos);
                
                if (!token.string.match(prefixExp)) {
                    prefixPos = _findCommentStart(editor, pos, prefixExp);
                } else {
                    prefixPos = {line: pos.line, ch: token.start};
                }
                suffixPos = _findCommentEnd(editor, pos, suffixExp, suffix.length);
            }
        }
        
        // Search if there is another comment in the selection. Let the user comment if there is.
        if (!canComment && suffixPos) {
            start = {line: suffixPos.line, ch: suffixPos.ch + suffix.length + 1};
            if (editor.posWithinRange(start, sel.start, sel.end)) {
                pos = _findNextCommentToken(editor, start, sel.end, prefixExp);
                
                if (pos !== null) {
                    canComment = true;
                }
            }
        }
        
        // Make the edit
        doc.batchOperation(function () {
            
            if (canComment) {
                // Comment out - add the suffix to the start and the prefix to the end
                doc.replaceRange(prefix + editor.getSelectedText() + suffix, sel.start, sel.end);
                
                // Correct the selection by prefix length
                var newSelStart = {line: sel.start.line, ch: sel.start.ch + prefix.length};
                if (sel.start.line === sel.end.line) {
                    editor.setSelection(newSelStart, {line: sel.end.line, ch: sel.end.ch + prefix.length});
                } else {
                    editor.setSelection(newSelStart, {line: sel.end.line, ch: sel.end.ch});
                }
            
            } else {
                // Uncomment - remove prefix and suffix
                if (suffixPos) {
                    doc.replaceRange("", suffixPos, {line: suffixPos.line, ch: suffixPos.ch + suffix.length});
                }
                doc.replaceRange("", prefixPos, {line: prefixPos.line, ch: prefixPos.ch + prefix.length});
            }
        });
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
            blockCommentPrefixSuffix(editor, "/*", "*/");
        } else if (mode === "html") {
            blockCommentPrefixSuffix(editor, "<!--", "-->");
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
