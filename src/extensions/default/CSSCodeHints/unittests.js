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
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
   
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        CSSCodeHints    = require("main");
       
    describe("CSS Code Hinting", function () {

        var defaultContent = "@media screen { \n" +
                             " body { \n" +
                             " }\n" +
                             "} \n" +
                             ".selector { \n" +
                             " \n" +
                             " b\n" +
                             " bord\n" +
                             " border-\n" +
                             " border-colo\n" +
                             " border-color: red;\n" +      // line: 10
                             " d\n" +
                             " disp\n" +
                             " display: \n" +
                             " display: in\n" +
                             " bordborder: \n" +
                             " color\n" +
                             "} \n";
        
        var testDocument, testEditor;
    
        // Ask provider for hints at current cursor position; expect it to return some
        function expectHints(provider, implicitChar) {
            expect(provider.hasHints(testEditor, implicitChar)).toBe(true);
            var hintsObj = provider.getHints();
            expect(hintsObj).not.toBeNull();
            return hintsObj.hints; // return just the array of hints
        }
        
        // Ask provider for hints at current cursor position; expect it NOT to return any
        function expectNoHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(false);
        }
    
        function verifyAttrHints(hintList, expectedFirstHint) {
            expect(hintList.indexOf("div")).toBe(-1);
            expect(hintList[0]).toBe(expectedFirstHint);
        }
            
        function selectHint(provider, expectedHint, implicitChar) {
            var hintList = expectHints(provider, implicitChar);
            expect(hintList.indexOf(expectedHint)).not.toBe(-1);
            return provider.insertHint(expectedHint);
        }
        
        // Helper function for testing cursor position
        function expectCursorAt(pos) {
            var selection = testEditor.getSelection();
            expect(selection.start).toEqual(selection.end);
            expect(selection.start).toEqual(pos);
        }

        // Helper function to
        // a) ensure the hintList and the list with the available values have the same size
        // b) ensure that all possible values are mentioned in the hintList
        function verifyAllValues(hintList, values) {
            expect(hintList.length).toBe(values.length);
            expect(hintList.sort().toString()).toBe(values.sort().toString());
        }

        describe("CSS properties in general (selection of correct property based on input)", function () {
    
            beforeEach(function () {
                // create Editor instance (containing a CodeMirror instance)
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "css");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            it("should list all prop-name hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 4, ch: 11 });    // after {
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"
            });
            
            it("should list all prop-namehints in new line", function () {
                testEditor.setCursorPos({ line: 5, ch: 1 });
                
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"
            });

            it("should list all prop-name hints starting with 'b' in new line", function () {
                testEditor.setCursorPos({ line: 6, ch: 2 });
                
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "backface-visibility");  // filtered on "b"
            });

            it("should list all prop-name hints starting with 'bord' ", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 6, ch: 2 });

                testEditor.setCursorPos({ line: 7, ch: 5 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "border");  // filtered on "bord"
            });

            it("should list all prop-name hints starting with 'border-' ", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 7, ch: 5 });
                
                testEditor.setCursorPos({ line: 8, ch: 8 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "border-bottom");  // filtered on "border-"
            });

            it("should list only prop-name hint border-color", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 8, ch: 8 });

                testEditor.setCursorPos({ line: 9, ch: 12 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "border-color");  // filtered on "border-color"  
                expect(hintList.length).toBe(1);
            });
            
            it("should list prop-name hints at end of property-value finished by ;", function () {
                testEditor.setCursorPos({ line: 10, ch: 19 });    // after ;
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"    
            });
            
            it("should NOT list prop-name hints right before curly bracket", function () {
                testEditor.setCursorPos({ line: 4, ch: 10 });    // inside .selector, before {
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
            it("should NOT list prop-name hints after declaration of mediatype", function () {
                testEditor.setCursorPos({ line: 0, ch: 15 });    // after {
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
            it("should NOT list prop-name hints if previous property is not closed properly", function () {
                testEditor.setCursorPos({ line: 16, ch: 6 });   // cursor directly after color
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            it("should NOT list prop-name hints in media type declaration", function () {
                testEditor.setCursorPos({ line: 0, ch: 1 });
                expect(CSSCodeHints.cssPropHintProvider.hasHints(testEditor, 'm')).toBe(false);
            });
        });

        describe("CSS property hint insertion", function () {
            beforeEach(function () {
                // create Editor instance (containing a CodeMirror instance)
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "css");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            it("should insert colon prop-name selected", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 6, ch: 2 });
                
                testEditor.setCursorPos({ line: 7, ch: 5 });   // cursor after 'bord'
                selectHint(CSSCodeHints.cssPropHintProvider, "border");
                expect(testDocument.getLine(7)).toBe(" border:");
                expectCursorAt({ line: 7, ch: 8 });
            });
            
            it("should not insert semicolon after prop-value selected", function () {
                testDocument.replaceRange(";", { line: 12, ch: 5 });
                testEditor.setCursorPos({ line: 13, ch: 10 });   // cursor after 'display: '
                selectHint(CSSCodeHints.cssPropHintProvider, "block");
                expect(testDocument.getLine(13)).toBe(" display: block");
            });
            
            it("should insert prop-name directly after semicolon", function () {
                testEditor.setCursorPos({ line: 10, ch: 19 });   // cursor after red;
                selectHint(CSSCodeHints.cssPropHintProvider, "align-content");
                expect(testDocument.getLine(10)).toBe(" border-color: red;align-content:");
            });
            
            it("should insert nothing but the closure(semicolon) if prop-value is fully written", function () {
                testDocument.replaceRange(";", { line: 15, ch: 13 }); // insert text ;
                testEditor.setCursorPos({ line: 16, ch: 6 });   // cursor directly after color
                selectHint(CSSCodeHints.cssPropHintProvider, "color");
                expect(testDocument.getLine(16)).toBe(" color:");
                expectCursorAt({ line: 16, ch: 7 });
            });
            
            it("should insert prop-name before an existing one", function () {
                testEditor.setCursorPos({ line: 10, ch: 1 });   // cursor before border-color:
                selectHint(CSSCodeHints.cssPropHintProvider, "float");
                expect(testDocument.getLine(10)).toBe(" float: border-color: red;");
                expectCursorAt({ line: 10, ch: 7 });
            });
            
            it("should insert prop-name before an existing one when invoked with an implicit character", function () {
                testDocument.replaceRange("f", { line: 10, ch: 1 }); // insert "f" before border-color:
                testEditor.setCursorPos({ line: 10, ch: 2 });        // set cursor before border-color:
                selectHint(CSSCodeHints.cssPropHintProvider, "float", "f");
                expect(testDocument.getLine(10)).toBe(" float: border-color: red;");
                expectCursorAt({ line: 10, ch: 7 });
            });
            
            it("should replace the existing prop-value with the new selection", function () {
                testDocument.replaceRange(";", { line: 12, ch: 5 });
                testDocument.replaceRange("block", { line: 13, ch: 10 });
                testEditor.setCursorPos({ line: 13, ch: 10 });   // cursor before block
                selectHint(CSSCodeHints.cssPropHintProvider, "none");
                expect(testDocument.getLine(13)).toBe(" display: none");
                expectCursorAt({ line: 13, ch: 14 });
            });

            xit("should start new hinting whenever there is a whitespace last stringliteral", function () {
                // topic: multi-value properties
                // this needs to be discussed, whether or not this behaviour is aimed for
                // if so, changes to CSSUtils.getInfoAt need to be done imho to classify this 
                testDocument.replaceRange(" ", { line: 16, ch: 6 }); // insert whitespace after color
                testEditor.setCursorPos({ line: 16, ch: 7 });   // cursor one whitespace after color
                selectHint(CSSCodeHints.cssPropHintProvider, "color");
                expect(testDocument.getLine(16)).toBe(" color color:");
                expectCursorAt({ line: 16, ch: 13 });
            });
        });

        describe("CSS prop-value hints", function () {
            beforeEach(function () {
                // create Editor instance (containing a CodeMirror instance)
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "css");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            it("should list all prop-values for 'display' after colon", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 12, ch: 5 });
                
                testEditor.setCursorPos({ line: 13, ch: 9 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "block");  // filtered after "display:"
            });

            it("should list all prop-values for 'display' after colon and whitespace", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 12, ch: 5 });
                
                testEditor.setCursorPos({ line: 13, ch: 10 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "block");  // filtered after "display: "
            });

            it("should list all prop-values starting with 'in' for 'display' after colon and whitespace", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 13, ch: 10 });
                
                testEditor.setCursorPos({ line: 14, ch: 12 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "inherit");  // filtered after "display: in"
            });
            
            it("should NOT list prop-value hints for unknown prop-name", function () {
                testEditor.setCursorPos({ line: 15, ch: 12 });  // at bordborder:
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
        });
        
        describe("CSS hint provider inside mixed htmlfiles", function () {
            var defaultContent = "<html> \n" +
                                 "<head><style>.selector{display: none;}</style></head> \n" +
                                 "<body> <style> \n" +
                                 " body { \n" +
                                 "    background-color: red; \n" +
                                 " \n" +
                                 "} \n" +
                                 "</style>\n" +
                                 "<div class='selector'></div>\n" +
                                 "<style> .foobar { \n" +
                                 " colo </style>\n" +
                                 "</body></html>";
                    
            beforeEach(function () {
                // create dummy Document for the Editor
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "html");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
                
            it("should list prop-name hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 3, ch: 7 });  // inside body-selector, after {
                expectHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should list prop-name hints inside single-line styletags at start", function () {
                testEditor.setCursorPos({ line: 1, ch: 23 });  // inside style, after {
                expectHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should list prop-name hints inside single-line styletags after semicolon", function () {
                testEditor.setCursorPos({ line: 1, ch: 37 });  // inside style, after ;
                expectHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should list prop-name hints inside multi-line styletags with cursor in first line", function () {
                testEditor.setCursorPos({ line: 9, ch: 18 });   // inside style, after {
                expectHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should list prop-name hints inside multi-line styletags with cursor in last line", function () {
                testEditor.setCursorPos({ line: 10, ch: 5 });    // inside style, after colo
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "color");  // filtered on "colo"
                expect(hintList.length).toBe(1);
            });
            
            it("should NOT list prop-name hints between closed styletag and new opening styletag", function () {
                testEditor.setCursorPos({ line: 8, ch: 0 });    // right before <div
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
            it("should NOT list hints right before curly bracket", function () {
                testEditor.setCursorPos({ line: 3, ch: 6 });    // inside body-selector, before {
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should NOT list hints inside head-tag", function () {
                testEditor.setCursorPos({ line: 1, ch: 6 });    // between <head> and </head> {
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
        });
          
        describe("CSS hint provider in other filecontext (e.g. javascript)", function () {
            var defaultContent = "function foobar (args) { \n " +
                                 "    /* do sth */ \n" +
                                 "    return 1; \n" +
                                 "} \n";
            beforeEach(function () {
                // create dummy Document for the Editor
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "javascript");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            it("should NOT list hints after function declaration", function () {
                testEditor.setCursorPos({ line: 0, ch: 24 });    // after {  after function declaration
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
        });

        describe("CSS hint provider cursor placement inside value functions", function () {
            var defaultContent = ".selector { \n" + // line 0
                                 "shape-inside:\n" + // line 1
                                 "}\n"; // line 2

            beforeEach(function () {
                // create dummy Document for the Editor
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "css");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });

            it("should should place the cursor between the parens of the value function", function () {
                var expectedString = "shape-inside:polygon()";

                testEditor.setCursorPos({ line: 1, ch: 15 });    // after shape-inside
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                selectHint(CSSCodeHints.cssPropHintProvider, "polygon()");
                expect(testDocument.getLine(1).length).toBe(expectedString.length);
                expect(testDocument.getLine(1)).toBe(expectedString);
                expectCursorAt({ line: 1, ch: expectedString.length - 1 });
            });
        });

        describe("CSS hint provider for regions and exclusions", function () {
            var defaultContent = ".selector { \n" + // line 0
                                 " shape-inside: \n;" + // line 1
                                 " shape-outside: \n;" + // line 2
                                 " region-fragment: \n;" + // line 3
                                 " region-break-after: \n;" + // line 4
                                 " region-break-inside: \n;" + // line 5
                                 " region-break-before: \n;" + // line 6
                                 " -ms-region\n;" + // line 7
                                 " -webkit-region\n;" + // line 8
                                 " flow-from: \n;" + // line 9
                                 " flow-into: \n;" + // line 10
                                 "}\n"; // line 11

            beforeEach(function () {
                // create dummy Document for the Editor
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "css");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });

            it("should list 7 value-name hints for shape-inside", function () {
                testEditor.setCursorPos({ line: 1, ch: 15 });    // after shape-inside
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "auto");  // first hint should be auto
                verifyAllValues(hintList, ["auto", "circle()", "ellipse()", "inherit", "outside-shape", "polygon()", "rectangle()"]);
            });

            it("should list 6 value-name hints for shape-outside", function () {
                testEditor.setCursorPos({ line: 2, ch: 16 });    // after shape-outside
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "auto");  // first hint should be auto
                verifyAllValues(hintList, ["auto", "rectangle()", "circle()", "ellipse()", "polygon()", "inherit"]);
            });

            it("should list 2 value-name hints for region-fragment", function () {
                testEditor.setCursorPos({ line: 3, ch: 18 });    // after region-fragment
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "auto");  // first hint should be auto
                verifyAllValues(hintList, ["auto", "break"]);
            });

            it("should list 11 value-name hints for region-break-after", function () {
                testEditor.setCursorPos({ line: 4, ch: 21 });    // after region-break-after
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "always");  // first hint should be always
                verifyAllValues(hintList, ["always", "auto", "avoid", "avoid-column", "avoid-page", "avoid-region", "column", "left", "page", "region", "right"]);
            });

            it("should list 5 value-name hints for region-break-inside", function () {
                testEditor.setCursorPos({ line: 5, ch: 22 });    // after region-break-inside
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "auto");  // first hint should be auto
                verifyAllValues(hintList, ["auto", "avoid", "avoid-column", "avoid-page", "avoid-region"]);
            });

            it("should list 11 value-name hints for region-break-before", function () {
                testEditor.setCursorPos({ line: 6, ch: 23 });    // after region-break-before
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "always");  // first hint should be always
                verifyAllValues(hintList, ["always", "auto", "avoid", "avoid-column", "avoid-page", "avoid-region", "column", "left", "page", "region", "right"]);
            });

            it("should list 4 value-name hints for vendor prefixed region-* properties", function () {
                testEditor.setCursorPos({ line: 7, ch: 16 });    // after -ms-region
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "region-break-after");  // first hint should be region-break-after
                verifyAllValues(hintList, ["region-break-after", "region-break-before", "region-break-inside", "region-fragment"]);

                testEditor.setCursorPos({ line: 8, ch: 20 });    // after -webkit-region
                hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "region-break-after");  // first hint should be region-break-after
                verifyAllValues(hintList, ["region-break-after", "region-break-before", "region-break-inside", "region-fragment"]);
            });
            
            it("should list 2 value-name hints for flow-from", function () {
                testEditor.setCursorPos({ line: 9, ch: 12 });    // after flow-from
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "inherit");  // first hint should be inherit
                verifyAllValues(hintList, ["inherit", "none"]);
            });

            it("should list 1 value-name hint for flow-into", function () {
                testEditor.setCursorPos({ line: 10, ch: 12 });    // after flow-into
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "none");  // first hint should be none
                verifyAllValues(hintList, ["none"]);
            });
        });
    });
});

