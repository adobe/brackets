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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    'use strict';
    
    // Brackets modules
    var MultiRangeInlineEditor  = brackets.getModule("editor/MultiRangeInlineEditor").MultiRangeInlineEditor,
        EditorManager           = brackets.getModule("editor/EditorManager");
    
    // Local modules
    var JSUtils         = require("JSUtils");
    
    /**
     * Return the token string that is at the specified position.
     *
     * @param hostEditor {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {String} token string at the specified position
     */
    function _getFunctionName(hostEditor, pos) {
        var token = hostEditor._codeMirror.getTokenAt(pos);
        
        // If the pos is at the beginning of a name, token will be the 
        // preceding whitespace or dot. In that case, try the next pos.
        if (token.string.trim().length === 0 || token.string === ".") {
            token = hostEditor._codeMirror.getTokenAt({line: pos.line, ch: pos.ch + 1});
        }
        
        return token.string;
    }
    
    /**
     * This function is registered with EditManager as an inline editor provider. It creates an inline editor
     * when cursor is on a JavaScript function name, find all functions that match the name
     * and show (one/all of them) in an inline editor.
     *
     * @param {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {$.Promise} a promise that will be resolved with an InlineWidget
     *      or null if we're not going to provide anything.
     */
    function javaScriptFunctionProvider(hostEditor, pos) {
        // Only provide a JavaScript editor when cursor is in JavaScript content
        if (hostEditor._codeMirror.getOption("mode") !== "javascript") {
            return null;
        }
        
        // Only provide JavaScript editor if the selection is within a single line
        var sel = hostEditor.getSelection(false);
        if (sel.start.line !== sel.end.line) {
            return null;
        }
        
        // Always use the selection start for determining the function name. The pos
        // parameter is usually the selection end.        
        var functionName = _getFunctionName(hostEditor, hostEditor.getSelection(false).start);
        if (functionName === "") {
            return null;
        }

        var result = new $.Deferred();

        JSUtils.findMatchingFunctions(functionName)
            .done(function (functions) {
                if (functions && functions.length > 0) {
                    var jsInlineEditor = new MultiRangeInlineEditor(functions);
                    jsInlineEditor.load(hostEditor);
                    
                    result.resolve(jsInlineEditor);
                } else {
                    // No matching functions were found
                    result.reject();
                }
            })
            .fail(function () {
                result.reject();
            });
        
        return result.promise();
    }

    EditorManager.registerInlineEditProvider(javaScriptFunctionProvider);
});
