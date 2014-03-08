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
     * Creates special regular expressions that matches the line prefix but not the block prefix or suffix
     * @param {!string} lineSyntax  a line comment prefix
     * @param {!string} blockSyntax  a block comment prefix or suffix
     * @return {RegExp}
     */
    function _createSpecialLineExp(lineSyntax, blockSyntax) {
        var i, character,
            subExps   = [],
            prevChars = "";
        
        for (i = lineSyntax.length; i < blockSyntax.length; i++) {
            character = blockSyntax.charAt(i);
            subExps.push(prevChars + "[^" + character + "]");
            if (prevChars) {
                subExps.push(prevChars + "$");
            }
            prevChars += character;
        }
        return new RegExp("^\\s*" + lineSyntax + "($|" + subExps.join("|") + ")");
    }
    
    /**
     * @private
     * Creates regular expressions for multiple line comment prefixes
     * @param {!Array.<string>} prefixes  the line comment prefixes
     * @param {string=} blockPrefix  the block comment prefix
     * @param {string=} blockSuffix  the block comment suffix
     * @return {Array.<RegExp>}
     */
    function _createLineExpressions(prefixes, blockPrefix, blockSuffix) {
        var lineExp = [], escapedPrefix, regExp;
        
        prefixes.forEach(function (prefix) {
            escapedPrefix = StringUtils.regexEscape(prefix);
            if (blockPrefix && blockPrefix.indexOf(prefix) === 0) {
                regExp = _createSpecialLineExp(prefix, blockPrefix);
            } else if (blockSuffix && blockSuffix.indexOf(prefix) === 0) {
                regExp = _createSpecialLineExp(prefix, blockSuffix);
            } else {
                regExp = new RegExp("^\\s*" + escapedPrefix);
            }
            lineExp.push(regExp);
        });
        return lineExp;
    }
    
    /**
     * @private
     * Returns true if any regular expression matches the given string
     * @param {!string} string - where to look
     * @param {!Array.<RegExp>} expressions - what to look
     * @return {boolean}
     */
    function _matchExpressions(string, expressions) {
        return expressions.some(function (exp) {
            return string.match(exp);
        });
    }
    
    /**
     * @private
     * Returns the line comment prefix that best matches the string. Since there might be line comment prefixes
     * that are prefixes of other line comment prefixes, it searches through all and returns the longest line
     * comment prefix that matches the string.
     * @param {!string} string  where to look
     * @param {!Array.<RegExp>} expressions  the line comment regular expressions
     * @param {!Array.<string>} prefixes  the line comment prefixes
     * @return {string}
     */
    function _getLinePrefix(string, expressions, prefixes) {
        var result = null;
        expressions.forEach(function (exp, index) {
            if (string.match(exp) && ((result && result.length < prefixes[index].length) || !result)) {
                result = prefixes[index];
            }
        });
        return result;
    }
    
    /**
     * @private
     * Searchs for an uncommented line between startLine and endLine
     * @param {!Editor} editor
     * @param {!number} startLine  valid line inside the document
     * @param {!number} endLine  valid line inside the document
     * @param {!Array.<RegExp>} lineExp  an array of line comment prefixes regular expressions
     * @return {boolean} true if there is at least one uncommented line
     */
    function _containsNotLineComment(editor, startLine, endLine, lineExp) {
        var i, line,
            containsNotLineComment = false;
        
        for (i = startLine; i <= endLine; i++) {
            line = editor.document.getLine(i);
            // A line is commented out if it starts with 0-N whitespace chars, then a line comment prefix
            if (line.match(/\S/) && !_matchExpressions(line, lineExp)) {
                containsNotLineComment = true;
                break;
            }
        }
        return containsNotLineComment;
    }
    
    /**
     * Add or remove line-comment tokens to all the lines in the selected range, preserving selection
     * and cursor position. Applies to currently focused Editor.
     * 
     * If all non-whitespace lines are already commented out, then we uncomment; otherwise we comment
     * out. Commenting out adds the prefix at column 0 of every line. Uncommenting removes the first prefix
     * on each line (if any - empty lines might not have one).
     *
     * @param {!Editor} editor
     * @param {!Array.<string>} prefixes, e.g. ["//"]
     * @param {string=} blockPrefix, e.g. "<!--"
     * @param {string=} blockSuffix, e.g. "-->"
     */
    function lineCommentPrefix(editor, prefixes, blockPrefix, blockSuffix) {
        var doc       = editor.document,
            sel       = editor.getSelection(),
            startLine = sel.start.line,
            endLine   = sel.end.line,
            lineExp   = _createLineExpressions(prefixes, blockPrefix, blockSuffix);
        
        // Is a range of text selected? (vs just an insertion pt)
        var hasSelection = (startLine !== endLine) || (sel.start.ch !== sel.end.ch);
        
        // In full-line selection, cursor pos is start of next line - but don't want to modify that line
        if (sel.end.ch === 0 && hasSelection) {
            endLine--;
        }
        
        // Decide if we're commenting vs. un-commenting
        // Are there any non-blank lines that aren't commented out? (We ignore blank lines because
        // some editors like Sublime don't comment them out)
        var i, line, prefix, commentI,
            containsNotLineComment = _containsNotLineComment(editor, startLine, endLine, lineExp),
            updateSelection        = false;
        
        // Make the edit
        doc.batchOperation(function () {
            if (containsNotLineComment) {
                // Comment out - prepend the first prefix to each line
                for (i = startLine; i <= endLine; i++) {
                    doc.replaceRange(prefixes[0], {line: i, ch: 0});
                }
                
                // Make sure selection includes the prefix that was added at start of range
                if (sel.start.ch === 0 && hasSelection) {
                    updateSelection = true;
                }
            
            } else {
                // Uncomment - remove the prefix on each line (if any)
                for (i = startLine; i <= endLine; i++) {
                    line   = doc.getLine(i);
                    prefix = _getLinePrefix(line, lineExp, prefixes);
                    
                    if (prefix) {
                        commentI = line.indexOf(prefix);
                        doc.replaceRange("", {line: i, ch: commentI}, {line: i, ch: commentI + prefix.length});
                    }
                }
            }
        });
        
        // Update the selection after the document batch so it's not blown away on resynchronization
        // if this editor is not the master editor.
        if (updateSelection) {
            // use *current* selection end, which has been updated for our text insertions
            editor.setSelection({line: startLine, ch: 0}, editor.getSelection().end);
        }
    }
    
    
    /**
     * @private
     * Given a token context it will search backwards to determine if the given token is part of a block comment
     * that doesn't start at the initial token. This is used to know if a line comment is part of a block comment
     * or if a block delimiter is the prefix or suffix, by passing a token context at that position. Since the
     * token context will be moved backwards a lot, it is better to pass a new context.
     * 
     * @param {!{editor:{CodeMirror}, pos:{ch:{number}, line:{number}}, token:{object}}} ctx  token context
     * @param {!string} prefix  the block comment prefix
     * @param {!string} suffix  the block comment suffix
     * @param {!RegExp} prefixExp  a block comment prefix regular expression
     * @param {!RegExp} suffixExp  a block comment suffix regular expression
     * @param {!Array.<RegExp>} lineExp  an array of line comment prefixes regular expressions
     * @return {boolean}
     */
    function _isPrevTokenABlockComment(ctx, prefix, suffix, prefixExp, suffixExp, lineExp) {
        // Start searching from the previous token
        var result = TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
        
        // Look backwards until we find a none line comment token
        while (result && _matchExpressions(ctx.token.string, lineExp)) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
        }
        
        // If we are now in a block comment token
        if (result && ctx.token.className === "comment") {
            // If it doesnt matches either prefix or suffix, we know is a block comment
            if (!ctx.token.string.match(prefixExp) && !ctx.token.string.match(suffixExp)) {
                return true;
            // We found a line with just a block comment delimiter, but we can't tell which one it is, so we will
            // keep searching recursively and return the opposite value
            } else if (prefix === suffix && ctx.token.string.length === prefix.length) {
                return !_isPrevTokenABlockComment(ctx, prefix, suffix, prefixExp, suffixExp, lineExp);
            // We can just now the result by checking if the string matches the prefix
            } else {
                return ctx.token.string.match(prefixExp);
            }
        }
        return false;
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
     * If a list of line comment prefixes is provided and all the lines inside the selection are line commented,
     * it will try to do a line uncomment if is not actually inside a bigger block comment.
     *
     * @param {!Editor} editor
     * @param {!string} prefix, e.g. "<!--"
     * @param {!string} suffix, e.g. "-->"
     * @param {!Array.<string>} linePrefixes, e.g. ["//"]
     */
    function blockCommentPrefixSuffix(editor, prefix, suffix, linePrefixes) {
        var doc            = editor.document,
            sel            = editor.getSelection(),
            ctx            = TokenUtils.getInitialContext(editor._codeMirror, {line: sel.start.line, ch: sel.start.ch}),
            selEndIndex    = editor.indexFromPos(sel.end),
            lineExp        = _createLineExpressions(linePrefixes, prefix, suffix),
            prefixExp      = new RegExp("^" + StringUtils.regexEscape(prefix), "g"),
            suffixExp      = new RegExp(StringUtils.regexEscape(suffix) + "$", "g"),
            prefixPos      = null,
            suffixPos      = null,
            commentAtStart = true,
            isBlockComment = false,
            canComment     = false,
            invalidComment = false,
            lineUncomment  = false,
            result         = true;
        
        var searchCtx, atSuffix, newSelection, initialPos, endLine;
        
        // First move the context to the first none white-space token
        if (!ctx.token.type && ctx.token.string.trim().length === 0) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
        }
        
        // Next, move forwards until we find a comment inside the selection
        while (result && ctx.token.className !== "comment") {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx) &&
                editor.indexFromPos(ctx.pos) <= selEndIndex;
            commentAtStart = false;
        }
        
        // We are now in a comment, lets check if it is a block or a line comment
        if (result && ctx.token.className === "comment") {
            // This token might be at a line comment, but we can't be sure yet
            if (_matchExpressions(ctx.token.string, lineExp)) {
                // If the token starts at ch 0 with no starting white spaces, then this might be a block comment or a line
                // comment over the whole line, and if we found this comment at the start of the selection, we need to search
                // backwards until we get can tell if we are in a block or a line comment
                if (ctx.token.start === 0 && !ctx.token.string.match(/^\\s*/) && commentAtStart) {
                    searchCtx      = TokenUtils.getInitialContext(editor._codeMirror, {line: ctx.pos.line, ch: ctx.token.start});
                    isBlockComment = _isPrevTokenABlockComment(searchCtx, prefix, suffix, prefixExp, suffixExp, lineExp);
                
                // If not, we already know that is a line comment
                } else {
                    isBlockComment = false;
                }
                
            // If it was not a line comment, it has to be a block comment
            } else {
                isBlockComment = true;
                
                // If we are in a line that only has a prefix or a suffix and the prefix and suffix are the same string,
                // lets find first if this is a prefix or suffix and move the token to the inside of the block comment.
                // This is required so that later we can find the prefix by moving backwards and the suffix by moving forwards.
                if (ctx.token.string === prefix && prefix === suffix) {
                    searchCtx = TokenUtils.getInitialContext(editor._codeMirror, {line: ctx.pos.line, ch: ctx.token.start});
                    atSuffix  = _isPrevTokenABlockComment(searchCtx, prefix, suffix, prefixExp, suffixExp, lineExp);
                    if (atSuffix) {
                        TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
                    } else {
                        TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
                    }
                }
            }
            
            if (isBlockComment) {
                // Save the initial position to start searching for the suffix from here
                initialPos = $.extend({}, ctx.pos);
                
                // Find the position of the start of the prefix
                result = true;
                while (result && !ctx.token.string.match(prefixExp)) {
                    result = TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
                }
                prefixPos = result && {line: ctx.pos.line, ch: ctx.token.start};
                
                // Restore the context at the initial position and find the position of the start of the suffix
                ctx = TokenUtils.getInitialContext(editor._codeMirror, {line: initialPos.line, ch: initialPos.ch});
                
                while (result && !ctx.token.string.match(suffixExp)) {
                    result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
                }
                suffixPos = result && {line: ctx.pos.line, ch: ctx.token.end - suffix.length};
                
                // Lets check if there are more comments in the selection. We do nothing if there is one
                do {
                    result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx) &&
                        editor.indexFromPos(ctx.pos) <= selEndIndex;
                } while (result && !ctx.token.string.match(prefixExp));
                invalidComment = result && !!ctx.token.string.match(prefixExp);
                
                // We moved the token at the start when it was in a whitespace, but maybe we shouldn't have done it
                if (prefixPos && editor.indexFromPos(sel.end) < editor.indexFromPos(prefixPos)) {
                    canComment = true;
                }
            
            } else {
                // In full-line selection, cursor pos is at the start of next line - but don't want to modify that line
                endLine = sel.end.line;
                if (sel.end.ch === 0 && editor.hasSelection()) {
                    endLine--;
                }
                // Find if all the lines are line-commented.
                if (!_containsNotLineComment(editor, sel.start.line, endLine, lineExp)) {
                    lineUncomment = true;
                } else {
                    canComment = true;
                }
            }
        // If not, we can comment
        } else {
            canComment = true;
        }
        
        
        // Make the edit
        if (lineUncomment) {
            lineCommentPrefix(editor, linePrefixes, prefix, suffix);
        
        } else if (!invalidComment) {
            doc.batchOperation(function () {
                
                // Comment out - add the suffix to the start and the prefix to the end of the selection.
                if (canComment) {
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
                        newSelection = {start: {line: sel.start.line + 1, ch: 0}, end: {line: sel.end.line + 1, ch: 0}};
                    } else {
                        var newSelStart = {line: sel.start.line, ch: sel.start.ch + prefix.length};
                        if (sel.start.line === sel.end.line) {
                            newSelection = {start: newSelStart, end: {line: sel.end.line, ch: sel.end.ch + prefix.length}};
                        } else {
                            newSelection = {start: newSelStart, end: {line: sel.end.line, ch: sel.end.ch}};
                        }
                    }
                
                // Uncomment - remove prefix and suffix found.
                } else {
                    // Find if the prefix and suffix are at the ch 0 and if they are the only thing in the line.
                    // If both are found we assume that a complete line selection comment added new lines, so we remove them.
                    var prefixAtStart = false, suffixAtStart = false;
                    
                    var line = doc.getLine(prefixPos.line).trim();
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
            
            // Update the selection after the document batch so it's not blown away on resynchronization
            // if this editor is not the master editor.
            if (newSelection) {
                editor.setSelection(newSelection.start, newSelection.end);
            }
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
            selEndIndex     = editor.indexFromPos(sel.end),
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
        var ctx       = TokenUtils.getInitialContext(editor._codeMirror, {line: selStart.line, ch: selStart.ch});
        var result    = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
        var className = ctx.token.type;
        
        // Search for the first block comment inside the selection
        while (result && !ctx.token.string.match(prefixExp)) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx) &&
                editor.indexFromPos(ctx.pos) <= selEndIndex;
        }
        result = result && !!ctx.token.string.match(prefixExp);
        
        if (className === "comment" || result || isLineSelection) {
            blockCommentPrefixSuffix(editor, prefix, suffix, []);
        } else {
            // Set the new selection and comment it
            editor.setSelection(selStart, selEnd);
            blockCommentPrefixSuffix(editor, prefix, suffix, []);
            
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
        
        var language = editor.getLanguageForSelection();
        
        if (language.hasBlockCommentSyntax()) {
            // getLineCommentPrefixes always return an array, and will be empty if no line comment syntax is defined
            blockCommentPrefixSuffix(editor, language.getBlockCommentPrefix(), language.getBlockCommentSuffix(), language.getLineCommentPrefixes());
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
        
        var language = editor.getLanguageForSelection();
        
        if (language.hasLineCommentSyntax()) {
            lineCommentPrefix(editor, language.getLineCommentPrefixes(), language.getBlockCommentPrefix(), language.getBlockCommentSuffix());
        } else if (language.hasBlockCommentSyntax()) {
            lineCommentPrefixSuffix(editor, language.getBlockCommentPrefix(), language.getBlockCommentSuffix());
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
            doc = editor.document,
            endLine;
        
        from = {line: sel.start.line, ch: 0};
        
        // endLine is the line after the last one we want to delete.
        endLine = sel.end.line + 1;
        if (sel.start.line < sel.end.line && sel.end.ch === 0) {
            // The selection is more than one line and ends right at the beginning
            // of a line. In this case, we don't want to delete that last line - we
            // only want to delete the one before it.
            endLine--;
        }
        
        if (endLine === editor.getLastVisibleLine() + 1) {
            // Instead of deleting the newline after the last line, delete the newline
            // before the first line--unless this is the entire visible content of the editor,
            // in which case just delete the line content.
            if (from.line > editor.getFirstVisibleLine()) {
                from.line -= 1;
                from.ch = doc.getLine(from.line).length;
            }
            to = {line: endLine - 1, ch: doc.getLine(endLine - 1).length};
        } else {
            to = {line: endLine, ch: 0};
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
            originalSel    = editor.getSelection(),
            hasSelection   = (sel.start.line !== sel.end.line) || (sel.start.ch !== sel.end.ch),
            isInlineWidget = !!EditorManager.getFocusedInlineWidget(),
            firstLine      = editor.getFirstVisibleLine(),
            lastLine       = editor.getLastVisibleLine(),
            totalLines     = editor.lineCount(),
            lineLength     = 0;
        
        sel.start.ch = 0;
        // The end of the selection becomes the start of the next line, if it isn't already
        if (!hasSelection || sel.end.ch !== 0) {
            sel.end = {line: sel.end.line + 1, ch: 0};
        }
        
        // Make the move
        switch (direction) {
        case DIRECTION_UP:
            if (sel.start.line !== firstLine) {
                doc.batchOperation(function () {
                    var prevText = doc.getRange({ line: sel.start.line - 1, ch: 0 }, sel.start);
                    
                    if (sel.end.line === lastLine + 1) {
                        if (isInlineWidget) {
                            prevText   = prevText.substring(0, prevText.length - 1);
                            lineLength = doc.getLine(sel.end.line - 1).length;
                            doc.replaceRange("\n", { line: sel.end.line - 1, ch: lineLength });
                        } else {
                            prevText = "\n" + prevText.substring(0, prevText.length - 1);
                        }
                    }
                    
                    doc.replaceRange("", { line: sel.start.line - 1, ch: 0 }, sel.start);
                    doc.replaceRange(prevText, { line: sel.end.line - 1, ch: 0 });
                    
                    // Make sure CodeMirror hasn't expanded the selection to include
                    // the line we inserted below.
                    originalSel.start.line--;
                    originalSel.end.line--;
                });
    
                // Update the selection after the document batch so it's not blown away on resynchronization
                // if this editor is not the master editor.
                editor.setSelection(originalSel.start, originalSel.end);
            }
            break;
        case DIRECTION_DOWN:
            if (sel.end.line <= lastLine) {
                doc.batchOperation(function () {
                    var nextText      = doc.getRange(sel.end, { line: sel.end.line + 1, ch: 0 }),
                        deletionStart = sel.end;
                    
                    if (sel.end.line === lastLine) {
                        if (isInlineWidget) {
                            if (sel.end.line === totalLines - 1) {
                                nextText += "\n";
                            }
                            lineLength = doc.getLine(sel.end.line - 1).length;
                            doc.replaceRange("\n", { line: sel.end.line, ch: doc.getLine(sel.end.line).length });
                        } else {
                            nextText     += "\n";
                            deletionStart = { line: sel.end.line - 1, ch: doc.getLine(sel.end.line - 1).length };
                        }
                    }
    
                    doc.replaceRange("", deletionStart, { line: sel.end.line + 1, ch: 0 });
                    if (lineLength) {
                        doc.replaceRange("", { line: sel.end.line - 1, ch: lineLength }, { line: sel.end.line, ch: 0 });
                    }
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
     * Inserts a new and smart indented line above/below the selected text, or current line if no selection.
     * The cursor is moved in the new line.
     * @param {Editor} editor - target editor
     * @param {Number} direction - direction where to place the new line (-1,+1) => (Up,Down)
     */
    function openLine(editor, direction) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }
        
        var sel            = editor.getSelection(),
            hasSelection   = (sel.start.line !== sel.end.line) || (sel.start.ch !== sel.end.ch),
            isInlineWidget = !!EditorManager.getFocusedInlineWidget(),
            lastLine       = editor.getLastVisibleLine(),
            cm             = editor._codeMirror,
            doc            = editor.document,
            line;
        
        // Insert the new line
        switch (direction) {
        case DIRECTION_UP:
            line = sel.start.line;
            break;
        case DIRECTION_DOWN:
            line = sel.end.line;
            if (!(hasSelection && sel.end.ch === 0)) {
                // If not linewise selection
                line++;
            }
            break;
        }
        
        if (line > lastLine && isInlineWidget) {
            doc.replaceRange("\n", {line: line - 1, ch: doc.getLine(line - 1).length}, null, "+input");
        } else {
            doc.replaceRange("\n", {line: line, ch: 0}, null, "+input");
        }
        cm.indentLine(line, "smart", true);
        editor.setSelection({line: line, ch: null});
    }

    /**
     * Inserts a new and smart indented line above the selected text, or current line if no selection.
     * The cursor is moved in the new line.
     * @param {Editor} editor - target editor
     */
    function openLineAbove(editor) {
        openLine(editor, DIRECTION_UP);
    }

    /**
     * Inserts a new and smart indented line below the selected text, or current line if no selection.
     * The cursor is moved in the new line.
     * @param {Editor} editor - target editor
     */
    function openLineBelow(editor) {
        openLine(editor, DIRECTION_DOWN);
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

    function handleUndoRedo(operation) {
        var editor = EditorManager.getFocusedEditor();
        var result = new $.Deferred();
        
        if (editor) {
            editor[operation]();
            result.resolve();
        } else {
            result.reject();
        }
        
        return result.promise();
    }

    function handleUndo() {
        return handleUndoRedo("undo");
    }

    function handleRedo() {
        return handleUndoRedo("redo");
    }

    /**
     * Special command handler that just ignores the command. This is used for Cut, Copy, and Paste.
     * These menu items are handled natively, but need to be registered in our JavaScript code so the 
     * menu items can be created.
     */
    function ignoreCommand() {
        // Do nothing. The shell will call the native handler for the command.
        return (new $.Deferred()).reject().promise();
    }
	
	function _handleSelectAll() {
        var result = new $.Deferred(),
            editor = EditorManager.getFocusedEditor();

        if (editor) {
            editor.selectAllNoScroll();
            result.resolve();
        } else {
            result.reject();    // command not handled
        }

        return result.promise();
    }
        
    // Register commands
    CommandManager.register(Strings.CMD_INDENT,           Commands.EDIT_INDENT,           indentText);
    CommandManager.register(Strings.CMD_UNINDENT,         Commands.EDIT_UNINDENT,         unidentText);
    CommandManager.register(Strings.CMD_COMMENT,          Commands.EDIT_LINE_COMMENT,     lineComment);
    CommandManager.register(Strings.CMD_BLOCK_COMMENT,    Commands.EDIT_BLOCK_COMMENT,    blockComment);
    CommandManager.register(Strings.CMD_DUPLICATE,        Commands.EDIT_DUPLICATE,        duplicateText);
    CommandManager.register(Strings.CMD_DELETE_LINES,     Commands.EDIT_DELETE_LINES,     deleteCurrentLines);
    CommandManager.register(Strings.CMD_LINE_UP,          Commands.EDIT_LINE_UP,          moveLineUp);
    CommandManager.register(Strings.CMD_LINE_DOWN,        Commands.EDIT_LINE_DOWN,        moveLineDown);
    CommandManager.register(Strings.CMD_OPEN_LINE_ABOVE,  Commands.EDIT_OPEN_LINE_ABOVE,  openLineAbove);
    CommandManager.register(Strings.CMD_OPEN_LINE_BELOW,  Commands.EDIT_OPEN_LINE_BELOW,  openLineBelow);
    CommandManager.register(Strings.CMD_SELECT_LINE,      Commands.EDIT_SELECT_LINE,      selectLine);

    CommandManager.register(Strings.CMD_UNDO,             Commands.EDIT_UNDO,             handleUndo);
    CommandManager.register(Strings.CMD_REDO,             Commands.EDIT_REDO,             handleRedo);
    CommandManager.register(Strings.CMD_CUT,              Commands.EDIT_CUT,              ignoreCommand);
    CommandManager.register(Strings.CMD_COPY,             Commands.EDIT_COPY,             ignoreCommand);
    CommandManager.register(Strings.CMD_PASTE,            Commands.EDIT_PASTE,            ignoreCommand);
    CommandManager.register(Strings.CMD_SELECT_ALL,       Commands.EDIT_SELECT_ALL,       _handleSelectAll);
});
