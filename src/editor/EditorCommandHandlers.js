/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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


define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var Commands           = require("command/Commands"),
        Strings            = require("strings"),
        Editor              = require("editor/Editor").Editor,
        CommandManager     = require("command/CommandManager"),
        EditorManager      = require("editor/EditorManager"),
        StringUtils        = require("utils/StringUtils"),
        TokenUtils         = require("utils/TokenUtils"),
        CodeMirror         = require("thirdparty/CodeMirror/lib/codemirror"),
        _                  = require("thirdparty/lodash");

    /**
     * List of constants
     */
    var DIRECTION_UP    = -1;
    var DIRECTION_DOWN  = +1;

 
    function _createSpecialLineExp(lineSyntax, blockSyntax) {
        var i, character, escapedCharacter,
            subExps   = [],
            prevChars = "";

        for (i = lineSyntax.length; i < blockSyntax.length; i++) {
            character = blockSyntax.charAt(i);
            escapedCharacter = StringUtils.regexEscape(character);
            subExps.push(prevChars + "[^" + escapedCharacter + "]");
            if (prevChars) {
                subExps.push(prevChars + "$");
            }
            prevChars += escapedCharacter;
        }
        return new RegExp("^\\s*" + StringUtils.regexEscape(lineSyntax) + "($|" + subExps.join("|") + ")");
    }

    
    function _createLineExpressions(prefixes, blockPrefix, blockSuffix) {
        var lineExp = [], escapedPrefix, nothingPushed;

        prefixes.forEach(function (prefix) {
            escapedPrefix = StringUtils.regexEscape(prefix);
            nothingPushed = true;

            if (blockPrefix && blockPrefix.indexOf(prefix) === 0) {
                lineExp.push(_createSpecialLineExp(prefix, blockPrefix));
                nothingPushed = false;
            }
            if (blockSuffix && blockPrefix !== blockSuffix && blockSuffix.indexOf(prefix) === 0) {
                lineExp.push(_createSpecialLineExp(prefix, blockSuffix));
                nothingPushed = false;
            }
            if (nothingPushed) {
                lineExp.push(new RegExp("^\\s*" + escapedPrefix));
            }
        });
        return lineExp;
    }

   
    function _matchExpressions(string, expressions) {
        return expressions.some(function (exp) {
            return string.match(exp);
        });
    }

   
    function _getLinePrefix(string, expressions, prefixes) {
        var result = null;
        expressions.forEach(function (exp, index) {
            if (string.match(exp) && ((result && result.length < prefixes[index].length) || !result)) {
                result = prefixes[index];
            }
        });
        return result;
    }

   
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

   
    function _getLineCommentPrefixEdit(editor, prefixes, blockPrefix, blockSuffix, lineSel) {
        var doc         = editor.document,
            sel         = lineSel.selectionForEdit,
            trackedSels = lineSel.selectionsToTrack,
            lineExp     = _createLineExpressions(prefixes, blockPrefix, blockSuffix),
            startLine   = sel.start.line,
            endLine     = sel.end.line,
            editGroup   = [];

        // In full-line selection, cursor pos is start of next line - but don't want to modify that line
        if (sel.end.ch === 0) {
            endLine--;
        }

        // Decide if we're commenting vs. un-commenting
        // Are there any non-blank lines that aren't commented out? (We ignore blank lines because
        // some editors like Sublime don't comment them out)
        var i, line, prefix, commentI,
            containsNotLineComment = _containsNotLineComment(editor, startLine, endLine, lineExp);

        if (containsNotLineComment) {
            // Comment out - prepend the first prefix to each line
            line = doc.getLine(startLine);
            var originalCursorPosition = line.search(/\S|$/);
            
            var firstCharPosition, cursorPosition = originalCursorPosition;
            
            for (i = startLine; i <= endLine; i++) {
                //check if preference for indent line comment is available otherwise go back to default indentation
                if (Editor.getIndentLineComment()) {
                    //ignore the first line and recalculate cursor position for first non white space char of every line
                    if (i !== startLine) {
                        line = doc.getLine(i);
                        firstCharPosition = line.search(/\S|$/);
                    }
                    //if the non space first character position is before original start position , put comment at the new position otherwise older pos
                    if (firstCharPosition < originalCursorPosition) {
                        cursorPosition = firstCharPosition;
                    } else {
                        cursorPosition = originalCursorPosition;
                    }
                    
                    editGroup.push({text: prefixes[0], start: {line: i, ch: cursorPosition}});
                } else {
                    editGroup.push({text: prefixes[0], start: {line: i, ch: 0}});
                }
            }

            // Make sure tracked selections include the prefix that was added at start of range
            _.each(trackedSels, function (trackedSel) {
                if (trackedSel.start.ch === 0 && CodeMirror.cmpPos(trackedSel.start, trackedSel.end) !== 0) {
                    trackedSel.start = {line: trackedSel.start.line, ch: 0};
                    trackedSel.end = {line: trackedSel.end.line, ch: (trackedSel.end.line === endLine ? trackedSel.end.ch + prefixes[0].length : 0)};
                } else {
                    trackedSel.isBeforeEdit = true;
                }
            });
        } else {
            // Uncomment - remove the prefix on each line (if any)
            for (i = startLine; i <= endLine; i++) {
                line   = doc.getLine(i);
                prefix = _getLinePrefix(line, lineExp, prefixes);

                if (prefix) {
                    commentI = line.indexOf(prefix);
                    editGroup.push({text: "", start: {line: i, ch: commentI}, end: {line: i, ch: commentI + prefix.length}});
                }
            }
            _.each(trackedSels, function (trackedSel) {
                trackedSel.isBeforeEdit = true;
            });
        }
        return {edit: editGroup, selection: trackedSels};
    }

    function _isPrevTokenABlockComment(ctx, prefix, suffix, prefixExp, suffixExp, lineExp) {
        // Start searching from the previous token
        var result = TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);

        // Look backwards until we find a none line comment token
        while (result && _matchExpressions(ctx.token.string, lineExp)) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
        }

        // If we are now in a block comment token
        if (result && ctx.token.type === "comment") {
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

    
    function _firstNotWs(doc, lineNum) {
        var text = doc.getLine(lineNum);
        if (text === null || text === undefined) {
            return 0;
        }

        return text.search(/\S|$/);
    }

    
    function _getBlockCommentPrefixSuffixEdit(editor, prefix, suffix, linePrefixes, sel, selectionsToTrack, command) {
        var doc            = editor.document,
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
            result         = true,
            editGroup      = [],
            edit;

        var searchCtx, atSuffix, suffixEnd, initialPos, endLine;

        var indentLineComment = Editor.getIndentLineComment();

        function isIndentLineCommand() {
            return indentLineComment && command === "line";
        }

        if (!selectionsToTrack) {
            // Track the original selection.
            selectionsToTrack = [_.cloneDeep(sel)];
        }

        // First move the context to the first none white-space token
        if (!ctx.token.type && !/\S/.test(ctx.token.string)) {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
        }

        // Next, move forwards until we find a comment inside the selection
        while (result && ctx.token.type !== "comment") {
            result = TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx) && editor.indexFromPos(ctx.pos) <= selEndIndex;
            commentAtStart = false;
        }

        // We are now in a comment, lets check if it is a block or a line comment
        if (result && ctx.token.type === "comment") {
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
                // lets find first if this is a prefix or suffix and move the context position to the inside of the block comment.
                // This means that the token will be anywere inside the block comment, including the lines with the delimiters.
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
                initialPos = _.cloneDeep(ctx.pos);

                // Find the position of the start of the prefix
                result = true;
                while (result && !ctx.token.string.match(prefixExp)) {
                    result = TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
                }
                prefixPos = result && {line: ctx.pos.line, ch: ctx.token.start};

                // Restore the context at the initial position to find the position of the start of the suffix,
                // but only when we found the prefix alone in one line
                if (ctx.token.string === prefix && prefix === suffix) {
                    ctx = TokenUtils.getInitialContext(editor._codeMirror, _.cloneDeep(initialPos));
                }

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

                // Make sure we didn't search so far backward or forward that we actually found a block comment
                // that's entirely before or after the selection.
                suffixEnd = suffixPos && { line: suffixPos.line, ch: suffixPos.ch + suffix.length };
                if ((suffixEnd && CodeMirror.cmpPos(sel.start, suffixEnd) > 0) || (prefixPos && CodeMirror.cmpPos(sel.end, prefixPos) < 0)) {
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
        if (invalidComment) {
            // We don't want to do an edit, but we still want to track selections associated with it.
            edit = {edit: [], selection: selectionsToTrack};

        } else if (lineUncomment) {
            // Return a null edit. This is a signal to the caller that we should delegate to the
            // line commenting code. We don't want to just generate the edit here, because the edit
            // might need to be coalesced with other line-uncomment edits generated by cursors on the
            // same line.
            edit = null;

        } else {
            // Comment out - add the suffix to the start and the prefix to the end.
            if (canComment) {
                var completeLineSel = sel.start.ch === 0 && sel.end.ch === 0 && sel.start.line < sel.end.line;
                var startCh = _firstNotWs(doc, sel.start.line);
                if (completeLineSel) {
                    if (isIndentLineCommand()) {
                        var endCh = _firstNotWs(doc, sel.end.line - 1);
                        var useTabChar = Editor.getUseTabChar(editor.document.file.fullPath);
                        var indentChar = useTabChar ? "\t" : " ";
                        editGroup.push({
                            text: _.repeat(indentChar, endCh) + suffix + "\n",
                            start: {line: sel.end.line, ch: 0}
                        });
                        editGroup.push({
                            text: prefix + "\n" + _.repeat(indentChar, startCh),
                            start: {line: sel.start.line, ch: startCh}
                        });
                    } else {
                        editGroup.push({text: suffix + "\n", start: sel.end});
                        editGroup.push({text: prefix + "\n", start: sel.start});
                    }
                } else {
                    editGroup.push({text: suffix, start: sel.end});
                    if (isIndentLineCommand()) {
                        editGroup.push({text: prefix, start: { line: sel.start.line, ch: startCh }});
                    } else {
                        editGroup.push({text: prefix, start: sel.start});
                    }
                }

                // Correct the tracked selections. We can't just use the default selection fixup,
                // because it will push the end of the selection past the inserted content. Also,
                // it's possible that we have to deal with tracked selections that might be outside
                // the bounds of the edit.
                _.each(selectionsToTrack, function (trackedSel) {
                    function updatePosForEdit(pos) {
                        // First adjust for the suffix insertion. Don't adjust
                        // positions that are exactly at the suffix insertion point.
                        if (CodeMirror.cmpPos(pos, sel.end) > 0) {
                            if (completeLineSel) {
                                pos.line++;
                            } else if (pos.line === sel.end.line) {
                                pos.ch += suffix.length;
                            }
                        }
                        // Now adjust for the prefix insertion. In this case, we do
                        // want to adjust positions that are exactly at the insertion
                        // point.
                        if (CodeMirror.cmpPos(pos, sel.start) >= 0) {
                            if (completeLineSel) {
                                // Just move the line down.
                                pos.line++;
                            } else if (pos.line === sel.start.line && !(isIndentLineCommand() && pos.ch < startCh)) {
                                pos.ch += prefix.length;
                            }
                        }
                    }

                    updatePosForEdit(trackedSel.start);
                    updatePosForEdit(trackedSel.end);
                });

            // Uncomment - remove prefix and suffix.
            } else {
                // Find if the prefix and suffix are at the ch 0 and if they are the only thing in the line.
                // If both are found we assume that a complete line selection comment added new lines, so we remove them.
                var line          = doc.getLine(prefixPos.line).trim(),
                    prefixAtStart = prefixPos.ch === 0 && prefix.length === line.length,
                    prefixIndented = indentLineComment && prefix.length === line.length,
                    suffixAtStart = false,
                    suffixIndented = false;

                if (suffixPos) {
                    line = doc.getLine(suffixPos.line).trim();
                    suffixAtStart = suffixPos.ch === 0 && suffix.length === line.length;
                    suffixIndented = indentLineComment && suffix.length === line.length;
                }

                // Remove the suffix if there is one
                if (suffixPos) {
                    if (suffixIndented) {
                        editGroup.push({text: "", start: {line: suffixPos.line, ch: 0}, end: {line: suffixPos.line + 1, ch: 0}});
                    } else if (prefixAtStart && suffixAtStart) {
                        editGroup.push({text: "", start: suffixPos, end: {line: suffixPos.line + 1, ch: 0}});
                    } else {
                        editGroup.push({text: "", start: suffixPos, end: {line: suffixPos.line, ch: suffixPos.ch + suffix.length}});
                    }
                }

                // Remove the prefix
                if (prefixIndented) {
                    editGroup.push({text: "", start: {line: prefixPos.line, ch: 0}, end: {line: prefixPos.line + 1, ch: 0}});
                } else if (prefixAtStart && suffixAtStart) {
                    editGroup.push({text: "", start: prefixPos, end: {line: prefixPos.line + 1, ch: 0}});
                } else {
                    editGroup.push({text: "", start: prefixPos, end: {line: prefixPos.line, ch: prefixPos.ch + prefix.length}});
                }

                // Don't fix up the tracked selections here - let the edit fix them up.
                _.each(selectionsToTrack, function (trackedSel) {
                    trackedSel.isBeforeEdit = true;
                });
            }

            edit = {edit: editGroup, selection: selectionsToTrack};
        }

        return edit;
    }


   
    function _getLineCommentPrefixSuffixEdit(editor, prefix, suffix, lineSel, command) {
        var sel = lineSel.selectionForEdit;

        // For one-line selections, we shrink the selection to exclude the trailing newline.
        if (sel.end.line === sel.start.line + 1 && sel.end.ch === 0) {
            sel.end = {line: sel.start.line, ch: editor.document.getLine(sel.start.line).length};
        }

        // Now just run the standard block comment code, but make sure to track any associated selections
        // that were subsumed into this line selection.
        return _getBlockCommentPrefixSuffixEdit(editor, prefix, suffix, [], sel, lineSel.selectionsToTrack, command);
    }

    
    function _getLineCommentEdits(editor, selections, command) {
        // We need to expand line selections in order to coalesce cursors on the same line, but we
        // don't want to merge adjacent line selections.
        var lineSelections = editor.convertToLineSelections(selections, { mergeAdjacent: false }),
            edits = [];
        _.each(lineSelections, function (lineSel) {
            var sel = lineSel.selectionForEdit,
                mode = editor.getModeForRange(sel.start, sel.end),
                edit;
            if (mode) {
                var language = editor.document.getLanguage().getLanguageForMode(mode.name || mode);

                if (language.hasLineCommentSyntax()) {
                    edit = _getLineCommentPrefixEdit(editor, language.getLineCommentPrefixes(), language.getBlockCommentPrefix(), language.getBlockCommentSuffix(), lineSel);
                } else if (language.hasBlockCommentSyntax()) {
                    edit = _getLineCommentPrefixSuffixEdit(editor, language.getBlockCommentPrefix(), language.getBlockCommentSuffix(), lineSel, command);
                }
            }
            if (!edit) {
                // Even if we didn't want to do an edit, we still need to track the selection.
                edit = {selection: lineSel.selectionsToTrack};
            }
            edits.push(edit);
        });
        return edits;
    }

   
    function lineComment(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        editor.setSelections(editor.document.doMultipleEdits(_getLineCommentEdits(editor, editor.getSelections(), "line")));
    }

   
    function blockComment(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        var edits = [],
            lineCommentSels = [];
        _.each(editor.getSelections(), function (sel) {
            var mode = editor.getModeForRange(sel.start, sel.end),
                edit = {edit: [], selection: [sel]}; // default edit in case we don't have a mode for this selection
            if (mode) {
                var language = editor.document.getLanguage().getLanguageForMode(mode.name || mode);

                if (language.hasBlockCommentSyntax()) {
                    // getLineCommentPrefixes always return an array, and will be empty if no line comment syntax is defined
                    edit = _getBlockCommentPrefixSuffixEdit(editor, language.getBlockCommentPrefix(), language.getBlockCommentSuffix(),
                                                            language.getLineCommentPrefixes(), sel);
                    if (!edit) {
                        // This is only null if the block comment code found that the selection is within a line-commented line.
                        // Add this to the list of line-comment selections we need to handle. Since edit is null, we'll skip
                        // pushing anything onto the edit list for this selection.
                        lineCommentSels.push(sel);
                    }
                }
            }
            if (edit) {
                edits.push(edit);
            }
        });

        // Handle any line-comment edits. It's okay if these are out-of-order with the other edits, since
        // they shouldn't overlap, and `doMultipleEdits()` will take care of sorting the edits so the
        // selections can be tracked appropriately.
        edits.push.apply(edits, _getLineCommentEdits(editor, lineCommentSels, "block"));

        editor.setSelections(editor.document.doMultipleEdits(edits));
    }

   
    function duplicateText(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        var selections = editor.getSelections(),
            delimiter = "",
            edits = [],
            rangeSels = [],
            cursorSels = [],
            doc = editor.document;

        // When there are multiple selections, we want to handle all the cursors first (duplicating
        // their lines), then all the ranges (duplicating the ranges).
        _.each(selections, function (sel) {
            if (CodeMirror.cmpPos(sel.start, sel.end) === 0) {
                cursorSels.push(sel);
            } else {
                rangeSels.push(sel);
            }
        });

        var cursorLineSels = editor.convertToLineSelections(cursorSels);
        _.each(cursorLineSels, function (lineSel, index) {
            var sel = lineSel.selectionForEdit;
            if (sel.end.line === editor.lineCount()) {
                delimiter = "\n";
            }
            // Don't need to explicitly track selections since we are doing the edits in such a way that
            // the existing selections will get appropriately updated.
            edits.push({edit: {text: doc.getRange(sel.start, sel.end) + delimiter, start: sel.start }});
        });
        _.each(rangeSels, function (sel) {
            edits.push({edit: {text: doc.getRange(sel.start, sel.end), start: sel.start }});
        });

        doc.doMultipleEdits(edits);
    }

 
    function deleteCurrentLines(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        // Walk the selections, calculating the deletion edits we need to do as we go;
        // document.doMultipleEdits() will take care of adjusting the edit locations when
        // it actually performs the edits.
        var doc = editor.document,
            from,
            to,
            lineSelections = editor.convertToLineSelections(editor.getSelections()),
            edits = [];

        _.each(lineSelections, function (lineSel, index) {
            var sel = lineSel.selectionForEdit;

            from = sel.start;
            to = sel.end; // this is already at the beginning of the line after the last selected line
            if (to.line === editor.getLastVisibleLine() + 1) {
                // Instead of deleting the newline after the last line, delete the newline
                // before the beginning of the line--unless this is the entire visible content
                // of the editor, in which case just delete the line content.
                if (from.line > editor.getFirstVisibleLine()) {
                    from.line -= 1;
                    from.ch = doc.getLine(from.line).length;
                }
                to.line -= 1;
                to.ch = doc.getLine(to.line).length;
            }

            // We don't need to track the original selections, since they'll get collapsed as
            // part of the various deletions that occur.
            edits.push({edit: {text: "", start: from, end: to}});
        });
        doc.doMultipleEdits(edits);
    }

   
    function moveLine(editor, direction) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        var doc             = editor.document,
            lineSelections  = editor.convertToLineSelections(editor.getSelections()),
            isInlineWidget  = !!EditorManager.getFocusedInlineWidget(),
            firstLine       = editor.getFirstVisibleLine(),
            lastLine        = editor.getLastVisibleLine(),
            totalLines      = editor.lineCount(),
            lineLength      = 0,
            edits           = [],
            newSels         = [],
            pos             = {};

        _.each(lineSelections, function (lineSel) {
            var sel = lineSel.selectionForEdit,
                editGroup = [];

            // Make the move
            switch (direction) {
            case DIRECTION_UP:
                if (sel.start.line !== firstLine) {
                    var prevText = doc.getRange({ line: sel.start.line - 1, ch: 0 }, sel.start);

                    if (sel.end.line === lastLine + 1) {
                        if (isInlineWidget) {
                            prevText   = prevText.substring(0, prevText.length - 1);
                            lineLength = doc.getLine(sel.end.line - 1).length;
                            editGroup.push({text: "\n", start: { line: sel.end.line - 1, ch: lineLength }});
                        } else {
                            prevText = "\n" + prevText.substring(0, prevText.length - 1);
                        }
                    }

                    editGroup.push({text: "", start: { line: sel.start.line - 1, ch: 0 }, end: sel.start});
                    editGroup.push({text: prevText, start: { line: sel.end.line - 1, ch: 0 }});

                    // Make sure CodeMirror hasn't expanded the selection to include
                    // the line we inserted below.
                    _.each(lineSel.selectionsToTrack, function (originalSel) {
                        originalSel.start.line--;
                        originalSel.end.line--;
                    });

                    edits.push({edit: editGroup, selection: lineSel.selectionsToTrack});
                }
                break;
            case DIRECTION_DOWN:
                if (sel.end.line <= lastLine) {
                    var nextText      = doc.getRange(sel.end, { line: sel.end.line + 1, ch: 0 }),
                        deletionStart = sel.end;

                    if (sel.end.line === lastLine) {
                        if (isInlineWidget) {
                            if (sel.end.line === totalLines - 1) {
                                nextText += "\n";
                            }
                            lineLength = doc.getLine(sel.end.line - 1).length;
                            editGroup.push({text: "\n", start: { line: sel.end.line, ch: doc.getLine(sel.end.line).length }});
                        } else {
                            nextText     += "\n";
                            deletionStart = { line: sel.end.line - 1, ch: doc.getLine(sel.end.line - 1).length };
                        }
                    }

                    editGroup.push({text: "", start: deletionStart, end: { line: sel.end.line + 1, ch: 0 }});
                    if (lineLength) {
                        editGroup.push({text: "", start: { line: sel.end.line - 1, ch: lineLength }, end: { line: sel.end.line, ch: 0 }});
                    }
                    editGroup.push({text: nextText, start: { line: sel.start.line, ch: 0 }});

                    // In this case, we don't need to track selections, because the edits are done in such a way that
                    // the existing selections will automatically be updated properly by CodeMirror as it does the edits.
                    edits.push({edit: editGroup});
                }
                break;
            }
        });

        // Make sure selections are correct and primary selection is scrolled into view
        if (edits.length) {
            newSels = doc.doMultipleEdits(edits);

            pos.ch = 0;

            if (direction === DIRECTION_UP) {
                editor.setSelections(newSels);
                pos.line = editor.getSelection().start.line;
            } else if (direction === DIRECTION_DOWN) {
                pos.line = editor.getSelection().end.line;
            } else {
                console.error("EditorCommandHandler.moveLine() called with invalid argument 'direction' = %d", direction);
                pos = null;
            }

            editor._codeMirror.scrollIntoView(pos);
        }
    }

   
    function moveLineUp(editor) {
        moveLine(editor, DIRECTION_UP);
    }

   
    function moveLineDown(editor) {
        moveLine(editor, DIRECTION_DOWN);
    }

    
    function openLine(editor, direction) {
        editor = editor || EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        var selections     = editor.getSelections(),
            isInlineWidget = !!EditorManager.getFocusedInlineWidget(),
            lastLine       = editor.getLastVisibleLine(),
            doc            = editor.document,
            edits          = [],
            newSelections,
            line;

        // First, insert all the newlines (skipping multiple selections on the same line),
        // then indent them all. (We can't easily do them all at once, because doMultipleEdits()
        // won't do the indentation for us, but we want its help tracking any selection changes
        // as the result of the edits.)

        // Note that we don't just use `editor.getLineSelections()` here because we don't actually want
        // to coalesce adjacent selections - we just want to ignore dupes.

        doc.batchOperation(function () {
            _.each(selections, function (sel, index) {
                if (index === 0 ||
                        (direction === DIRECTION_UP && sel.start.line > selections[index - 1].start.line) ||
                        (direction === DIRECTION_DOWN && sel.end.line > selections[index - 1].end.line)) {
                    // Insert the new line
                    switch (direction) {
                    case DIRECTION_UP:
                        line = sel.start.line;
                        break;
                    case DIRECTION_DOWN:
                        line = sel.end.line;
                        if (!(CodeMirror.cmpPos(sel.start, sel.end) !== 0 && sel.end.ch === 0)) {
                            // If not linewise selection
                            line++;
                        }
                        break;
                    }

                    var insertPos;
                    if (line > lastLine && isInlineWidget) {
                        insertPos = {line: line - 1, ch: doc.getLine(line - 1).length};
                    } else {
                        insertPos = {line: line, ch: 0};
                    }
                    // We want the selection after this edit to be right before the \n we just inserted.
                    edits.push({edit: {text: "\n", start: insertPos}, selection: {start: insertPos, end: insertPos, primary: sel.primary}});
                } else {
                    // We just want to discard this selection, since we've already operated on the
                    // same line and it would just collapse to the same location. But if this was
                    // primary, make sure the last selection we did operate on ends up as primary.
                    if (sel.primary) {
                        edits[edits.length - 1].selections[0].primary = true;
                    }
                }
            });
            newSelections = doc.doMultipleEdits(edits, "+input");

            // Now indent each added line (which doesn't mess up any line numbers, and
            // we're going to set the character offset to the last position on each line anyway).
            _.each(newSelections, function (sel) {
                // This is a bit of a hack. The document is the one that batches operations, but we want
                // to use CodeMirror's "smart indent" operation. So we need to use the document's own backing editor's
                // CodeMirror to do the indentation. A better way to fix this would be to expose this
                // operation on Document, but I'm not sure we want to sign up for that as a public API.
                doc._masterEditor._codeMirror.indentLine(sel.start.line, "smart", true);
                sel.start.ch = null; // last character on line
                sel.end = sel.start;
            });
        });
        editor.setSelections(newSelections);
    }

   
    function openLineAbove(editor) {
        openLine(editor, DIRECTION_UP);
    }

   
    function openLineBelow(editor) {
        openLine(editor, DIRECTION_DOWN);
    }

   
    function indentText() {
        var editor = EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        editor._codeMirror.execCommand("indentMore");
    }

   
    function unindentText() {
        var editor = EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }

        editor._codeMirror.execCommand("indentLess");
    }

    function selectLine(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (editor) {
            // We can just use `convertToLineSelections`, but throw away the original tracked selections and just use the
            // coalesced selections.
            editor.setSelections(_.pluck(editor.convertToLineSelections(editor.getSelections(), { expandEndAtStartOfLine: true }), "selectionForEdit"));
        }
    }

   
    function splitSelIntoLines(editor) {
        editor = editor || EditorManager.getFocusedEditor();
        if (editor) {
            editor._codeMirror.execCommand("splitSelectionByLine");
        }
    }

    function addCursorToSelection(editor, dir) {
        editor = editor || EditorManager.getFocusedEditor();
        if (editor) {
            var origSels = editor.getSelections(),
                newSels = [];
            _.each(origSels, function (sel) {
                var pos, colOffset;
                if ((dir === -1 && sel.start.line > editor.getFirstVisibleLine()) || (dir === 1 && sel.end.line < editor.getLastVisibleLine())) {
                    // Add a new cursor on the next line up/down. It's okay if it overlaps another selection, because CM
                    // will take care of throwing it away in that case. It will also take care of clipping the char position
                    // to the end of the new line if the line is shorter.
                    pos = _.clone(dir === -1 ? sel.start : sel.end);

                    // get sel column of current selection
                    colOffset = editor.getColOffset(pos);

                    pos.line += dir;

                    // translate column to ch in line of new selection
                    pos.ch = editor.getCharIndexForColumn(pos.line, colOffset);


                    // If this is the primary selection, we want the new cursor we're adding to become the
                    // primary selection.
                    newSels.push({start: pos, end: pos, primary: sel.primary});
                    sel.primary = false;
                }
            });
            // CM will take care of sorting the selections.
            editor.setSelections(origSels.concat(newSels));
        }
    }

   
    function addCursorToPrevLine(editor) {
        addCursorToSelection(editor, -1);
    }

   
    function addCursorToNextLine(editor) {
        addCursorToSelection(editor, 1);
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

    function _execCommand(cmd) {
        window.document.execCommand(cmd);
    }
    function _execCommandCut() {
        _execCommand("cut");
    }
    function _execCommandCopy() {
        _execCommand("copy");
    }
    function _execCommandPaste() {
        _execCommand("paste");
    }

    // Register commands
    CommandManager.register(Strings.CMD_INDENT,                 Commands.EDIT_INDENT,                 indentText);
    CommandManager.register(Strings.CMD_UNINDENT,               Commands.EDIT_UNINDENT,               unindentText);
    CommandManager.register(Strings.CMD_COMMENT,                Commands.EDIT_LINE_COMMENT,           lineComment);
    CommandManager.register(Strings.CMD_BLOCK_COMMENT,          Commands.EDIT_BLOCK_COMMENT,          blockComment);
    CommandManager.register(Strings.CMD_DUPLICATE,              Commands.EDIT_DUPLICATE,              duplicateText);
    CommandManager.register(Strings.CMD_DELETE_LINES,           Commands.EDIT_DELETE_LINES,           deleteCurrentLines);
    CommandManager.register(Strings.CMD_LINE_UP,                Commands.EDIT_LINE_UP,                moveLineUp);
    CommandManager.register(Strings.CMD_LINE_DOWN,              Commands.EDIT_LINE_DOWN,              moveLineDown);
    CommandManager.register(Strings.CMD_OPEN_LINE_ABOVE,        Commands.EDIT_OPEN_LINE_ABOVE,        openLineAbove);
    CommandManager.register(Strings.CMD_OPEN_LINE_BELOW,        Commands.EDIT_OPEN_LINE_BELOW,        openLineBelow);
    CommandManager.register(Strings.CMD_SELECT_LINE,            Commands.EDIT_SELECT_LINE,            selectLine);
    CommandManager.register(Strings.CMD_SPLIT_SEL_INTO_LINES,   Commands.EDIT_SPLIT_SEL_INTO_LINES,   splitSelIntoLines);
    CommandManager.register(Strings.CMD_ADD_CUR_TO_NEXT_LINE,   Commands.EDIT_ADD_CUR_TO_NEXT_LINE,   addCursorToNextLine);
    CommandManager.register(Strings.CMD_ADD_CUR_TO_PREV_LINE,   Commands.EDIT_ADD_CUR_TO_PREV_LINE,   addCursorToPrevLine);

    CommandManager.register(Strings.CMD_UNDO,                   Commands.EDIT_UNDO,                   handleUndo);
    CommandManager.register(Strings.CMD_REDO,                   Commands.EDIT_REDO,                   handleRedo);
    CommandManager.register(Strings.CMD_CUT,                    Commands.EDIT_CUT,                    _execCommandCut);
    CommandManager.register(Strings.CMD_COPY,                   Commands.EDIT_COPY,                   _execCommandCopy);
    CommandManager.register(Strings.CMD_PASTE,                  Commands.EDIT_PASTE,                  _execCommandPaste);
    CommandManager.register(Strings.CMD_SELECT_ALL,             Commands.EDIT_SELECT_ALL,             _handleSelectAll);
});
