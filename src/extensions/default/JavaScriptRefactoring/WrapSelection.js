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

    var EditorManager        = brackets.getModule("editor/EditorManager"),
        ScopeManager         = brackets.getModule("JSUtils/ScopeManager"),
        Session              = brackets.getModule("JSUtils/Session"),
        MessageIds           = brackets.getModule("JSUtils/MessageIds");
    
    
    var session             = null;  // object that encapsulates the current session state

    // Removes the leading and trailing spaces from selection and the trailing semicolons
    function normalizeSelection() {
        var selection   = this.editor.getSelection(),
            text        = this.editor.getSelectedText(),
            trimmedText;

        // Remove leading spaces
        trimmedText = text.trim();


    };
    
    function getTextWrapedInTryCatch(text) {
        var trytext = "try {\n \t",
            catchText = "}\ catch (e) {\n \t console.log(e) }";
        var formattedText = trytext + text + catchText;
        return formattedText;
    }
        
    function wrapInTryCatch() {
        var editor = EditorManager.getActiveEditor(),
            selection   = editor.getSelection(),
            text        = editor.getSelectedText();
        
        var newText = getTextWrapedInTryCatch(text);
    }
    
    exports.wrapInTryCatch = wrapInTryCatch;
});
