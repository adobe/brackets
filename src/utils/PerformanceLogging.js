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
/*global define, $, CodeMirror, brackets, window */

/**
 * ExtensionLoader searches the filesystem for extensions, then creates a new context for each one and loads it
 */

define(function (require, exports, module) {
    'use strict';

    var EditorManager = require("editor/EditorManager");
    
    function _getInputField(editor) {
        return editor._codeMirror.getInputField();
    }
    
    function initKeystrokePerfTiming() {
        var editor = null,
            inputField = null,
            inputValue;
        
        var inputChangedHandler = function () {
            inputValue = inputField.value;
            
            console.markTimeline("input: '" + inputValue + "'");
            console.time(inputValue);
        };
        
        var onUpdateHandler = function () {
            console.markTimeline("update");
            
            window.webkitRequestAnimationFrame(function () {
                console.markTimeline("paint: '" + inputValue + "'");
            });
        };
        
        $(EditorManager).on("currentEditorChange", function (event, currentEditor) {
            if (editor) {
                inputField.removeEventListener("input", inputChangedHandler, true);
                $(editor).off("updateDisplay", onUpdateHandler);
            }
            
            if (currentEditor) {
                editor = currentEditor;
                inputField = _getInputField(currentEditor);
                inputField.addEventListener("input", inputChangedHandler, true);
                $(currentEditor).on("updateDisplay", onUpdateHandler);
            }
        });
    }
    
    (function () {
        initKeystrokePerfTiming();
    }());
});
