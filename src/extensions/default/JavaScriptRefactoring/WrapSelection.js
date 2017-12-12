/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

    var EditorManager        = brackets.getModule("editor/EditorManager");

    function _getPositionOfSelectedText() {
        var editor = EditorManager.getActiveEditor(),
            selection   = editor.getSelection();
          
        if (editor.getSelections().length > 1) {
            editor.displayErrorMessageAtCursor("Wrap Selection doesn't work in case of multicursor");
            return;
        }

        var start = editor.indexFromPos(selection.start),
            end = editor.indexFromPos(selection.end),
            startPos = editor._codeMirror.posFromIndex(start),
            endPos = editor._codeMirror.posFromIndex(end);

        return {
            start: startPos,
            end: endPos
        };
    }
    
    function _getTextWrapedInTryCatch(text) {
        var trytext = "try {\n",
            catchText = "\n} catch (e) {\nconsole.log(e.message);\n}",
            formattedText = trytext + text + catchText;

        return formattedText;
    }
        
    function wrapInTryCatch() {

        var editor = EditorManager.getActiveEditor(),
            newText = _getTextWrapedInTryCatch(editor.getSelectedText().trim()),
            pos = _getPositionOfSelectedText();
        
        if (!pos) {
            return;
        }

        editor.document.replaceRange(newText, pos.start, pos.end);
        
        var startLine = pos.start.line,
            endLine = startLine + newText.split("\n").length;

        for (var i = startLine + 1; i < endLine; i++) {
            editor._codeMirror.indentLine(i);
        }

        //Place cursor or selection
    }

    function _getTextWrapedInCondition(text) {
        var ifText = "if () {\n",
            closeIf = "\n}",
            formattedText = ifText + text + closeIf;

        return formattedText;
    }


    function wrapInCondition() {

        var editor = EditorManager.getActiveEditor(),
            newText = _getTextWrapedInCondition(editor.getSelectedText().trim()),
            pos = _getPositionOfSelectedText();

        if (!pos) {
            return;
        }

        editor.document.replaceRange(newText, pos.start, pos.end);
        
        var startLine = pos.start.line,
        endLine = startLine + newText.split("\n").length;
        for (var i = startLine + 1; i < endLine; i++) {
            editor._codeMirror.indentLine(i);
        }

        //Place cursor at if
    }
    
    exports.wrapInTryCatch = wrapInTryCatch;
    exports.wrapInCondition = wrapInCondition;
});
