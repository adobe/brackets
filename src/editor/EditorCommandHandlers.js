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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, continue: true */
/*global define: false, $: false, CodeMirror: false */


/**
 * Text-editing commands that apply to whichever Editor is currently focused
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var Commands           = require("command/Commands"),
        CommandManager     = require("command/CommandManager"),
        EditorManager      = require("editor/EditorManager");

    /**
     * Gets the selection from the editor and does a little clean up on it by removing leading
     * and trailing empty lines.
     */
    function _getSelectionInfo(editor) {
        var sel = editor.getSelection();
        var startLine = sel.start.line;
        var endLine = sel.end.line;
        var line;
        var i;

        if (startLine !== endLine && sel.end.ch === 0) {
            --endLine;
        }
        
        // Ignore leading empty lines.
        for (i = startLine; i <= endLine; i++) {
            line = editor.getLineText(i);
            if (line.match(/\S/)) {
                startLine = i;
                break;
            }
        }

        // Ignore trailing empty lines.
        for (i = endLine; i >= startLine; i--) {
            line = editor.getLineText(i);
            if (line.match(/\S/)) {
                endLine = i;
                break;
            }
        }
                
        return {"startLine": startLine, "endLine": endLine, startCh: sel.start.ch, endCh: sel.end.ch};
    }

    /**
     * Turns a comment into a regular expression with optional leading and trailing spaces.
     */
    function _commentToRegExp(comment, includeLeadingWhitespace, includeTrailingWhitespace) {
        var commentStr = "";
        var i;
        for (i = 0; i < comment.length; ++i) {
            commentStr += "\\";
            commentStr += comment.charAt(i);
        }
        if (includeLeadingWhitespace) {
            commentStr = "^\\s*" + commentStr;
        }
        if (includeTrailingWhitespace) {
            commentStr = commentStr + "\\s?";
        }
        return new RegExp(commentStr);
    }
    
    /**
     * Adds or removes block or line comments.
     */
    function _toggleComments(editor, type, startComment, endComment) {
        var selectionInfo = _getSelectionInfo(editor),
            origSel = editor.getSelection();
        var addComments = true;
        var cm = editor._codeMirror;
        var i;
        var startCommentIndex,
            endCommentIndex,
            leftmostColumn;
        var line,
            firstLine = editor.getLineText(selectionInfo.startLine),
            lastLine = editor.getLineText(selectionInfo.endLine);
        var startCommentRE = _commentToRegExp(startComment, false, false),
            endCommentRE;
        
        if (endComment) { // In other words, if the comment type is "block"
            endCommentRE = _commentToRegExp(endComment, false, false);
        }

        // Are we adding or removing comments?
        if (firstLine.match(_commentToRegExp(startComment, (type === "line"), false))) {
            addComments = false;
        }
                
        // TODO (#803): should go through Document, not editor._codeMirror
        
        if (type === "block") {
            if (addComments) { // Adding block comments.
                cm.operation(function () {
                    if (selectionInfo.endCh === 0 || selectionInfo.endCh === selectionInfo.startCh) {
                        endCommentIndex = lastLine.length;
                    } else {
                        endCommentIndex = selectionInfo.endCh;
                    }
                    cm.replaceRange(endComment, {line: selectionInfo.endLine, ch: endCommentIndex});
                    if (selectionInfo.startCh === 0 || selectionInfo.endCh === selectionInfo.startCh) {
                        startCommentIndex = firstLine.search(/\S/);
                    } else {
                        startCommentIndex = selectionInfo.startCh;
                    }
                    cm.replaceRange(startComment, {line: selectionInfo.startLine, ch: startCommentIndex});
                });
                

                // Position the cursor or move the selection.
                
                // If text is selected.
                if (origSel.start.ch !== origSel.end.ch || origSel.start.line !== origSel.end.line) {
                    if (startCommentIndex === origSel.start.ch) {
                        origSel.start.ch += startComment.length;
                    }
                    if (origSel.start.line === origSel.end.line) {
                        origSel.end.ch += startComment.length;
                    }
                } else { // If text is not selected.
                    if (origSel.start.ch > endCommentIndex) {
                        origSel.start.ch += (startComment.length + endComment.length);
                        origSel.end.ch += (startComment.length + endComment.length);
                    } else if (origSel.start.ch >= startCommentIndex) {
                        origSel.start.ch += startComment.length;
                        origSel.end.ch += startComment.length;
                    }
                }
                
                editor.setSelection(origSel.start, origSel.end);
            } else { // Removing block comments.
                cm.operation(function () {
                    endCommentIndex = lastLine.search(endCommentRE);
                    cm.replaceRange("", {line: selectionInfo.endLine, ch: endCommentIndex},
                                        {line: selectionInfo.endLine, ch: (endCommentIndex + endComment.length)});
                    startCommentIndex = firstLine.search(startCommentRE);
                    cm.replaceRange("", {line: selectionInfo.startLine, ch: startCommentIndex},
                                        {line: selectionInfo.startLine, ch: (startCommentIndex + startComment.length)});
                });
            }
        } else { // Handle line comments
            // Comments must begin at the left-most column of the entire selection.
            if (addComments) {
                leftmostColumn = firstLine.search(/\S/);
                for (i = selectionInfo.startLine; i <= selectionInfo.endLine; i++) {
                    line = editor.getLineText(i);
                    if (!line.match(/\S/)) { // Blank line. SKip.
                        continue;
                    }
                    leftmostColumn = Math.min(leftmostColumn, line.search(/\S/));
                }
            }
            
            // Start adding or removing line comments.
            for (i = selectionInfo.startLine; i <= selectionInfo.endLine; i++) {
                line = editor.getLineText(i);
                if (!line.match(/\S/)) { // Blank line. Skip.
                    continue;
                }
                if (addComments) { // Adding line comments.
                    cm.replaceRange(startComment + " ", {line: i, ch: leftmostColumn});
                } else { // Removing line comments.
                    startCommentIndex = line.search(startCommentRE);
                    endCommentIndex = startCommentIndex + line.match(_commentToRegExp(startComment, false, true))[0].length;
                    cm.replaceRange("", {line: i, ch: startCommentIndex},
                                        {line: i, ch: endCommentIndex});
                }
            }
        }
    }

    /**
     * Figures out if line or block comments should be used, and defines the open and close comment
     * strings. If line comments are requested but not supported, it falls back on block.
     * 
     * To support additional languages, just add the mode and comment strings here. Be sure to take
     * into consideration whether the language only supports block comments.
     */
    function _defineCommentData(editor, type) {
        var mode = editor.getModeForSelection();
        if (mode === null) {
            return;
        }
        if (mode === "javascript" || mode === "less") {
            if (type === "block") {
                _toggleComments(editor, "block", "/*", "*/");
            } else {
                _toggleComments(editor, "line", "//");
            }
        } else if (mode === "html") {
            _toggleComments(editor, "block", "<!--", "-->");
        } else if (mode === "css") {
            _toggleComments(editor, "block", "/*", "*/");
        }
    }
    
    /**
     * Starts the process of either line or block commenting or uncommenting.
     */
    function _comment(editor, type) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }
        _defineCommentData(editor, type);
    }
    
    /**
     * Invokes a language-specific line-comment/uncomment handler.
     * @param {?Editor} editor If unspecified, applies to the currently focused editor.
     */
    function lineComment(editor) {
        _comment(editor, "line");
    }
        
    /**
     * Invokes a language-specific block-comment/uncomment handler.
     * @param {?Editor} editor If unspecified, applies to the currently focused editor.
     */
    function blockComment(editor) {
        _comment(editor, "block");
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
        
        var sel = editor.getSelection();
        
        var hasSelection = (sel.start.line !== sel.end.line) || (sel.start.ch !== sel.end.ch);
        
        if (!hasSelection) {
            sel.start.ch = 0;
            sel.end = {line: sel.start.line + 1, ch: 0};
        }
        
        // Make the edit
        // TODO (#803): should go through Document, not Editor._codeMirror
        var cm = editor._codeMirror;
        
        var selectedText = cm.getRange(sel.start, sel.end);
        cm.replaceRange(selectedText, sel.start);
    }
    
    
    // Register commands
    CommandManager.register(Commands.EDIT_LINE_COMMENT,  lineComment);
    CommandManager.register(Commands.EDIT_BLOCK_COMMENT, blockComment);
    CommandManager.register(Commands.EDIT_DUPLICATE,     duplicateText);
});
