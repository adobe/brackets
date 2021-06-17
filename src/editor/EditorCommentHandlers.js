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

/** 
 * Text-editing commands that apply to whichever Editor is currently focused
 */
/* define(function (require, exports, module) */

   
    /**
     * @private
     * Creates special regular expressions that matches the line prefix but not the block prefix or suffix
     * @param {!string} lineSyntax  a line comment prefix
     * @param {!string} blockSyntax  a block comment prefix or suffix
     * @return {RegExp}
     */
    /*function _createSpecialLineExp(lineSyntax, blockSyntax) */



    /**
     * @private
     * Creates regular expressions for multiple line comment prefixes
     * @param {!Array.<string>} prefixes  the line comment prefixes
     * @param {string=} blockPrefix  the block comment prefix
     * @param {string=} blockSuffix  the block comment suffix
     * @return {Array.<RegExp>}
     */
  /*  function _createLineExpressions(prefixes, blockPrefix, blockSuffix)*/ 


    /**
     * @private
     * Returns true if any regular expression matches the given string
     * @param {!string} string  where to look
     * @param {!Array.<RegExp>} expressions  what to look
     * @return {boolean}
     */
   /* function _matchExpressions(string, expressions)*/



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
   /* function _getLinePrefix(string, expressions, prefixes) */



    /**
     * @private
     * Searches between startLine and endLine to check if there is at least one line commented with a line comment, and
     * skips all the block comments.
     * @param {!Editor} editor
     * @param {!number} startLine  valid line inside the document
     * @param {!number} endLine  valid line inside the document
     * @param {!Array.<RegExp>} lineExp  an array of line comment prefixes regular expressions
     * @return {boolean} true if there is at least one uncommented line
     */
 /*   function _containsNotLineComment(editor, startLine, endLine, lineExp) */




    /**
     * @private
     * Generates an edit that adds or removes line-comment tokens to all the lines in the selected range,
     * preserving selection and cursor position. Applies to currently focused Editor. The given selection
     * must already be a line selection in the form returned by `Editor.convertToLineSelections()`.
     *
     * If all non-whitespace lines are already commented out, then we uncomment; otherwise we comment
     * out. Commenting out adds the prefix at column 0 of every line. Uncommenting removes the first prefix
     * on each line (if any - empty lines might not have one).
     *
     * @param {!Editor} editor
     * @param {!Array.<string>} prefixes, e.g. ["//"]
     * @param {string=} blockPrefix, e.g. "<!--"
     * @param {string=} blockSuffix, e.g. "-->"
     * @param {!Editor} editor The editor to edit within.
     * @param {!{selectionForEdit: {start:{line:number, ch:number}, end:{line:number, ch:number}, reversed:boolean, primary:boolean},
     *           selectionsToTrack: Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, reversed:boolean, primary:boolean}>}}
     *      lineSel A line selection as returned from `Editor.convertToLineSelections()`. `selectionForEdit` is the selection to perform
     *      the line comment operation on, and `selectionsToTrack` are a set of selections associated with this line that need to be
     *      tracked through the edit.
     * @return {{edit: {text: string, start:{line: number, ch: number}, end:?{line: number, ch: number}}|Array.<{text: string, start:{line: number, ch: number}, end:?{line: number, ch: number}}>,
     *                  selection: {start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean, isBeforeEdit: boolean}>}|
     *                  Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean, isBeforeEdit: boolean}>}}
     *      An edit description suitable for including in the edits array passed to `Document.doMultipleEdits()`.
     */
    //function _getLineCommentPrefixEdit(editor, prefixes, blockPrefix, blockSuffix, lineSel) 



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
    //function _isPrevTokenABlockComment(ctx, prefix, suffix, prefixExp, suffixExp, lineExp) 
        


    /**
     * Return the column of the first non whitespace char in the given line.
     *
     * @private
     * @param {!Document} doc
     * @param {number} lineNum
     * @returns {number} the column index or null
     */
    //function _firstNotWs(doc, lineNum) 


       
    /**
     * Generates an edit that adds or removes block-comment tokens to the selection, preserving selection
     * and cursor position. Applies to the currently focused Editor.
     *
     * If the selection is inside a block-comment or one block-comment is inside or partially inside the selection
     * it will uncomment, otherwise it will comment out, unless if there are multiple block comments inside the selection,
     * where it does nothing.
     * Commenting out adds the prefix before the selection and the suffix after.
     * Uncommenting removes them.
     *
     * If all the lines inside the selection are line-comment and if the selection is not inside a block-comment, it will
     * line uncomment all the lines, otherwise it will block comment/uncomment. In the first case, we return null to
     * indicate to the caller that it needs to handle this selection as a line comment.
     *
     * @param {!Editor} editor
     * @param {!string} prefix, e.g. "<!--"
     * @param {!string} suffix, e.g. "-->"
     * @param {!Array.<string>} linePrefixes, e.g. ["//"]
     * @param {!{start:{line:number, ch:number}, end:{line:number, ch:number}, reversed:boolean, primary:boolean}} sel
     *      The selection to block comment/uncomment.
     * @param {?Array.<{!{start:{line:number, ch:number}, end:{line:number, ch:number}, reversed:boolean, primary:boolean}}>} selectionsToTrack
     *      An array of selections that should be tracked through this edit.
     * @param {String} command The command callee. It cans be "line" or "block".
     * @return {{edit: {text: string, start:{line: number, ch: number}, end:?{line: number, ch: number}}|Array.<{text: string, start:{line: number, ch: number}, end:?{line: number, ch: number}}>,
     *                  selection: {start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean, isBeforeEdit: boolean}>}|
     *                  Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean, isBeforeEdit: boolean}>}}
     *      An edit description suitable for including in the edits array passed to `Document.doMultipleEdits()`.
     */
   // function _getBlockCommentPrefixSuffixEdit(editor, prefix, suffix, linePrefixes, sel, selectionsToTrack, command) 


    /**
     * Generates an edit that adds or removes block-comment tokens to the selection, preserving selection
     * and cursor position. Applies to the currently focused Editor. The selection must already be a
     * line selection in the form returned by `Editor.convertToLineSelections()`.
     *
     * The implementation uses blockCommentPrefixSuffix, with the exception of the case where
     * there is no selection on a uncommented and not empty line. In this case the whole lines gets
     * commented in a block-comment.
     *
     * @param {!Editor} editor
     * @param {!String} prefix
     * @param {!String} suffix
     * @param {!{selectionForEdit: {start:{line:number, ch:number}, end:{line:number, ch:number}, reversed:boolean, primary:boolean},
     *           selectionsToTrack: Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, reversed:boolean, primary:boolean}>}}
     *      lineSel A line selection as returned from `Editor.convertToLineSelections()`. `selectionForEdit` is the selection to perform
     *      the line comment operation on, and `selectionsToTrack` are a set of selections associated with this line that need to be
     *      tracked through the edit.
     * @param {String} command The command callee. It cans be "line" or "block".
     * @return {{edit: {text: string, start:{line: number, ch: number}, end:?{line: number, ch: number}}|Array.<{text: string, start:{line: number, ch: number}, end:?{line: number, ch: number}}>,
     *                  selection: {start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean, isBeforeEdit: boolean}>}|
     *                  Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean, isBeforeEdit: boolean}>}}
     *      An edit description suitable for including in the edits array passed to `Document.doMultipleEdits()`.
     */
   // function _getLineCommentPrefixSuffixEdit(editor, prefix, suffix, lineSel, command) 
        

    /**
     * @private
     * Generates an array of edits for toggling line comments on the given selections.
     *
     * @param {!Editor} editor The editor to edit within.
     * @param {Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean, isBeforeEdit: boolean}>}
     *      selections The selections we want to line-comment.
     * @param {String} command The command callee. It cans be "line" or "block".
     * @return {Array.<{edit: {text: string, start:{line: number, ch: number}, end:?{line: number, ch: number}}|Array.<{text: string, start:{line: number, ch: number}, end:?{line: number, ch: number}}>,
     *                  selection: {start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean, isBeforeEdit: boolean}>}|
     *                  Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean, isBeforeEdit: boolean}>}>}
     *      An array of edit descriptions suitable for including in the edits array passed to `Document.doMultipleEdits()`.
     */
  
    //function _getLineCommentEdits(editor, selections, command) 

    /**
     * Invokes a language-specific line-comment/uncomment handler
     * @param {?Editor} editor If unspecified, applies to the currently focused editor
     */
   // function lineComment(editor) 

    /**
     * Invokes a language-specific block-comment/uncomment handler
     * @param {?Editor} editor If unspecified, applies to the currently focused editor
     */
    //function blockComment(editor)


    /**
     * Duplicates the selected text, or current line if no selection. The cursor/selection is left
     * on the second copy.
     */
    //function duplicateText(editor) 
    /**
     * Deletes the current line if there is no selection or the lines for the selection
     * (removing the end of line too)
     */
    //function deleteCurrentLines(editor)


    /**
     * Moves the selected text, or current line if no selection. The cursor/selection
     * moves with the line/lines.
     * @param {Editor} editor - target editor
     * @param {Number} direction - direction of the move (-1,+1) => (Up,Down)
     */
    //function moveLine(editor, direction)

    /**
     * Moves the selected text, or current line if no selection, one line up. The cursor/selection
     * moves with the line/lines.
     */
    //function moveLineUp(editor)

    /**
     * Moves the selected text, or current line if no selection, one line down. The cursor/selection
     * moves with the line/lines.
     */
    //function moveLineDown(editor) 

    /**
     * Inserts a new and smart indented line above/below the selected text, or current line if no selection.
     * The cursor is moved in the new line.
     * @param {Editor} editor - target editor
     * @param {Number} direction - direction where to place the new line (-1,+1) => (Up,Down)
     */
    //function openLine(editor, direction) 

    /**
     * Inserts a new and smart indented line above the selected text, or current line if no selection.
     * The cursor is moved in the new line.
     * @param {Editor} editor - target editor
     */
    //function openLineAbove(editor)
    /**
     * Inserts a new and smart indented line below the selected text, or current line if no selection.
     * The cursor is moved in the new line.
     * @param {Editor} editor - target editor
     */
    //function openLineBelow(editor)
    /**
     * Indent a line of text if no selection. Otherwise, indent all lines in selection.
     */
   // function indentText()
    /**
     * Unindent a line of text if no selection. Otherwise, unindent all lines in selection.
     */
    //function unindentText() 
    /**
     * @private
     * Takes the current selection and splits each range into separate selections, one per line.
     * @param {!Editor} editor The editor to operate on.
     */
    //function splitSelIntoLines(editor) 
    /**
     * @private
     * Adds a cursor on the next/previous line after/before each selected range to the selection.
     * @param {!Editor} editor The editor to operate on.
     * @param {number} dir The direction to add - 1 is down, -1 is up.
     */
    //function addCursorToSelection(editor, dir) 
    /**
     * @private
     * Adds a cursor on the previous line before each selected range to the selection.
     * @param {!Editor} editor The editor to operate on.
     */
    //function addCursorToPrevLine(editor)

    /**
     * @private
     * Adds a cursor on the next line after each selected range to the selection.
     * @param {!Editor} editor The editor to operate on.
     */
    //function addCursorToNextLine(editor)
   