/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
   
    var SpecRunnerUtils                 = brackets.getModule("spec/SpecRunnerUtils"),
        ColorAndGradientPreviewProvider = require("main").colorAndGradientPreviewProvider,
        ImagePreviewProvider            = require("main").imagePreviewProvider,
        fileContent                     = require("text!unittest-files/test.css");
    
    describe("Hover Preview", function () {

        var testDocument, testEditor;

        describe("CSS attribute insertHint", function () {
            beforeEach(function () {
                // create Editor instance (containing a CodeMirror instance)
                var mock = SpecRunnerUtils.createMockEditor(fileContent, "css");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            it("should insert colon prop-name selected", function () {
                testEditor.setCursorPos({ line: 7, ch: 5 });   // cursor after 'bord'
            });
            
            it("should not insert semicolon after prop-value selected", function () {
                testEditor.setCursorPos({ line: 13, ch: 10 });   // cursor after 'display: '
            });
        });
            
    });
});