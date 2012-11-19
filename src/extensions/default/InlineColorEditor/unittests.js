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
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone, spyOn */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        Editor          = brackets.getModule("editor/Editor").Editor,
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        DocumentManager = brackets.getModule("editor/DocumentManager"),
        testContent     = require("text!unittests.css"),
        tinycolor       = require("thirdparty/tinycolor-min"),
        provider        = require("main").inlineColorEditorProvider;

    describe("Inline Color Editor", function () {

        var defaultContent = "";
        
        var testWindow;
        var testDocument, testEditor;
        
        function makeColorEditor(cursor) {
            var result = new $.Deferred(), editorPromise, inline;
            runs(function () {
                editorPromise = provider(this.editor, {line: 1, ch: 18})
                    .done(function (result) {
                        inline = result;
                    });
            });
            waitsForDone(editorPromise, "open color editor", 500);
            runs(function () {
                result.resolve(inline);
            });
            return result;
        }
        
        beforeEach(function () {
            // create dummy Document for the Editor
            testDocument = SpecRunnerUtils.createMockDocument(testContent);
            
            // create Editor instance (containing a CodeMirror instance)
            $("body").append("<div id='editor'/>");
            testEditor = new Editor(testDocument, true, "css", $("#editor").get(0), {});
        });
        
        afterEach(function () {
            testEditor.destroy();
            testEditor = null;
            $("#editor").remove();
            testDocument = null;
        });
 
        it("should show the correct color when opened on an #rrggbb color", function () {
            makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                expect(inline).toBeTruthy();
                expect(inline.color).toBe("#abcdef");
            });
        });
        
        it("should properly add/remove ref to document when opened/closed", function () {
            runs(function () {
                spyOn(this.testDocument, "addRef").andCallThrough();
                spyOn(this.testDocument, "releaseRef").andCallThrough();
            });
            makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                expect(this.testDocument.addRef).toHaveBeenCalled();
                expect(this.testDocument.addRef.callCount).toBe(1);
                
                inline.onClosed();
                expect(this.testDocument.releaseRef).toHaveBeenCalled();
                expect(this.testDocument.releaseRef.callCount).toBe(1);
            });
        });
        
        it("should update when edit is made to color range in host editor", function () {
            makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                this.testDocument.replaceRange("0", {line: 1, ch: 18}, {line: 1, ch: 19});
                expect(inline.color).toBe("#ab0def");
                expect(inline.colorEditor.color.toHexString().toLowerCase()).toEqual("#ab0def");
            });
        });
    });
});