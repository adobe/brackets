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

/*global describe, it, xit, expect, beforeEach, afterEach */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        testContentCSS  = require("text!unittest-files/regions.css"),
        testContentHTML = require("text!unittest-files/region-template.html"),
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

        /*
         * Create a mockup editor with the given content and language id.
         *
         * @param {string} content - content for test window
         * @param {string} languageId
         */
        function setupTest(content, languageId) {
            var mock = SpecRunnerUtils.createMockEditor(content, languageId);
            testDocument = mock.doc;
            testEditor = mock.editor;
        }

        function tearDownTest() {
            SpecRunnerUtils.destroyMockEditor(testDocument);
            testEditor = null;
            testDocument = null;
        }

        function extractHintList(hints) {
            return $.map(hints, function ($node) {
                return $node.text();
            });
        }

        // Ask provider for hints at current cursor position; expect it to return some
        function expectHints(provider, implicitChar, returnWholeObj) {
            expect(provider.hasHints(testEditor, implicitChar)).toBe(true);
            var hintsObj = provider.getHints();
            expect(hintsObj).toBeTruthy();
            // return just the array of hints if returnWholeObj is falsy
            return returnWholeObj ? hintsObj : extractHintList(hintsObj.hints);
        }

        // Ask provider for hints at current cursor position; expect it NOT to return any
        function expectNoHints(provider, implicitChar) {
            expect(provider.hasHints(testEditor, implicitChar)).toBe(false);
        }

        function verifyAttrHints(hintList, expectedFirstHint) {
            expect(hintList.indexOf("div")).toBe(-1);
            expect(hintList[0]).toBe(expectedFirstHint);
        }

        // compares lists to ensure they are the same
        function verifyListsAreIdentical(hintList, values) {
            var i;
            expect(hintList.length).toBe(values.length);
            for (i = 0; i < values.length; i++) {
                expect(hintList[i]).toBe(values[i]);
            }
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

            it("should list all prop-name hints in new line", function () {
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
                verifyListsAreIdentical(hintList, ["border-color",
                                                   "border-left-color",
                                                   "border-top-color",
                                                   "border-bottom-color",
                                                   "border-right-color"]);
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
                expect(testDocument.getLine(7)).toBe(" border: ");
                expectCursorAt({ line: 7, ch: 9 });
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
                expect(testDocument.getLine(10)).toBe(" border-color: red;align-content: ");
            });

            it("should insert nothing but the closure(semicolon) if prop-value is fully written", function () {
                testDocument.replaceRange(";", { line: 15, ch: 13 }); // insert text ;
                testEditor.setCursorPos({ line: 16, ch: 6 });   // cursor directly after color
                selectHint(CSSCodeHints.cssPropHintProvider, "color");
                expect(testDocument.getLine(16)).toBe(" color: ");
                expectCursorAt({ line: 16, ch: 8 });
            });

            it("should insert prop-name before an existing one", function () {
                testEditor.setCursorPos({ line: 10, ch: 1 });   // cursor before border-color:
                selectHint(CSSCodeHints.cssPropHintProvider, "float");
                expect(testDocument.getLine(10)).toBe(" float:  border-color: red;");
                expectCursorAt({ line: 10, ch: 8 });
            });

            it("should insert prop-name before an existing one when invoked with an implicit character", function () {
                testDocument.replaceRange("f", { line: 10, ch: 1 }); // insert "f" before border-color:
                testEditor.setCursorPos({ line: 10, ch: 2 });        // set cursor before border-color:
                selectHint(CSSCodeHints.cssPropHintProvider, "float", "f");
                expect(testDocument.getLine(10)).toBe(" float:  border-color: red;");
                expectCursorAt({ line: 10, ch: 8 });
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
                verifyListsAreIdentical(hintList, ["color",
                                                   "border-color",
                                                   "background-color",
                                                   "border-left-color",
                                                   "border-top-color",
                                                   "outline-color",
                                                   "border-bottom-color",
                                                   "border-right-color",
                                                   "text-decoration-color",
                                                   "text-emphasis-color",
                                                   "column-count",
                                                   "column-rule-color",
                                                   "background-blend-mode"]);
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
                expectHints(CSSCodeHints.cssPropHintProvider);
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

            it("should list 16 value-name hints for shape-outside", function () {
                testEditor.setCursorPos({ line: 2, ch: 16 });    // after shape-outside
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "border-box");  // first hint should be border-box
                verifyAllValues(hintList, ["none", "inherit", "circle()", "ellipse()", "polygon()", "inset()", "margin-box", "border-box", "padding-box", "content-box", "url()", "image()", "linear-gradient()", "radial-gradient()", "repeating-linear-gradient()", "repeating-radial-gradient()"]);
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

            // TODO: Need to add vendor prefixed properties for CSS code hint provider.
            xit("should list 4 value-name hints for vendor prefixed region-* properties", function () {
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

        describe("Named flow hints for flow-into and flow-from properties in a CSS file", function () {
            beforeEach(function () {
                setupTest(testContentCSS, "css");
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should list more than 2 value hints for flow-from", function () {
                testEditor.setCursorPos({ line: 66, ch: 15 });    // after flow-from
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "edge-code_now_shipping");  // first hint should be edge-code_now_shipping
                verifyAllValues(hintList, ["edge-code_now_shipping", "inherit", "jeff", "lim", "main", "none", "randy"]);
            });

            it("should list more than 1 value hint for flow-into", function () {
                testEditor.setCursorPos({ line: 77, ch: 4 });
                selectHint(CSSCodeHints.cssPropHintProvider, "flow-into");
                expect(testDocument.getLine(77)).toBe("    flow-into: ");
                expectCursorAt({ line: 77, ch: 15 });

                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "edge-code_now_shipping");  // first hint should be edge-code_now_shipping
                verifyAllValues(hintList, ["edge-code_now_shipping", "jeff", "lim", "main", "none", "randy"]);
            });

            it("should NOT include partially entered named flow value in hint list", function () {
                // Insert a letter for a new named flow after flow-from: on line 66
                testDocument.replaceRange("m", { line: 66, ch: 15 });

                testEditor.setCursorPos({ line: 66, ch: 16 });    // after flow-from: m
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyListsAreIdentical(hintList, ["main", "lim"]);
            });

        });

        describe("Named flow hints inside a style block of an HTML", function () {
            beforeEach(function () {
                setupTest(testContentHTML, "html");
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should include only 2 named flows available in the style block for flow-from", function () {
                testEditor.setCursorPos({ line: 28, ch: 21 });    // after flow-from
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "article");  // first hint should be article
                verifyAllValues(hintList, ["article", "inherit", "none", "regionC"]);
            });

            it("should include only 2 named flows available in the style block for flow-into", function () {
                testEditor.setCursorPos({ line: 34, ch: 21 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "article");  // first hint should be article
                verifyAllValues(hintList, ["article", "none", "regionC"]);
            });

            it("should NOT include partially entered named flow value in hint list", function () {
                // Insert a letter for a new named flow after flow-from: on line 28
                testDocument.replaceRange("m", { line: 28, ch: 21 });

                testEditor.setCursorPos({ line: 28, ch: 22 });    // after flow-from: m
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAllValues(hintList, []);
            });

            it("should NOT show named flow available inisde HTML text", function () {
                // Insert a letter for a new named flow after flow-from: on line 28
                testDocument.replaceRange("some", { line: 28, ch: 21 });

                testEditor.setCursorPos({ line: 28, ch: 25 });    // after flow-from: some
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                // some-named-flow should not be in the hint list since it is inside HTML text
                verifyAllValues(hintList, []);
            });
        });

        describe("Color names and swatches in a CSS file", function () {
            beforeEach(function () {
                setupTest(testContentCSS, "css");
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should list color names for color", function () {
                testEditor.setCursorPos({ line: 98, ch: 11 }); // after color
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "aliceblue"); // first hint should be aliceblue
            });

            it("should show color swatches for background-color", function () {
                testEditor.setCursorPos({ line: 99, ch: 22 }); // after background-color
                var hints = expectHints(CSSCodeHints.cssPropHintProvider, undefined, true).hints;
                expect(hints[0].text()).toBe("aliceblue"); // first hint should be aliceblue
                expect(hints[0].find(".color-swatch").length).toBe(1);
                // CEF 2623 will output "aliceblue" whereas earlier versions give "rgb(240, 248, 255)",
                // so we need this ugly hack to make sure this test passes on both
                expect(hints[0].find(".color-swatch").css("backgroundColor")).toMatch(/^rgb\(240, 248, 255\)$|aliceblue/);
            });

            it("should filter out color names appropriately", function () {
                testEditor.setCursorPos({ line: 100, ch: 27 }); // after border-left-color
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "deeppink"); // first hint should be deeppink
                verifyAllValues(hintList, ["deeppink", "deepskyblue"]);
            });

            it("should always include transparent and currentColor and they should not have a swatch, but class no-swatch-margin", function () {
                testEditor.setCursorPos({ line: 101, ch: 22 }); // after border-color
                var hints = expectHints(CSSCodeHints.cssPropHintProvider, undefined, true).hints,
                    hintList = extractHintList(hints);
                verifyAttrHints(hintList, "currentColor"); // first hint should be currentColor
                verifyAllValues(hintList, ["currentColor", "darkmagenta", "transparent"]);
                expect(hints[0].find(".color-swatch").length).toBe(0); // no swatch for currentColor
                expect(hints[2].find(".color-swatch").length).toBe(0); // no swatch for transparent
                expect(hints[0].hasClass("no-swatch-margin")).toBeTruthy(); // no-swatch-margin applied to currentColor
                expect(hints[2].hasClass("no-swatch-margin")).toBeTruthy(); // no-swatch-margin applied to transparent
            });

            it("should remove class no-swatch-margin from transparent if it's the only one in the list", function () {
                testEditor.setCursorPos({ line: 103, ch: 22 }); // after color
                var hints = expectHints(CSSCodeHints.cssPropHintProvider, undefined, true).hints,
                    hintList = extractHintList(hints);
                verifyAllValues(hintList, ["transparent"]);
                expect(hints[0].find(".color-swatch").length).toBe(0); // no swatch for transparent
                expect(hints[0].hasClass("no-swatch-margin")).toBeFalsy(); // no-swatch-margin not applied to transparent
            });

            it("should insert color names correctly", function () {
                var expectedString  = "    border-left-color: deeppink;",
                    line            = 100;

                testEditor.setCursorPos({ line: line, ch: 27 }); // after border-left-color
                expectHints(CSSCodeHints.cssPropHintProvider);
                selectHint(CSSCodeHints.cssPropHintProvider, "deeppink");
                expect(testDocument.getLine(line).length).toBe(expectedString.length);
                expect(testDocument.getLine(line)).toBe(expectedString);
                expectCursorAt({ line: line, ch: expectedString.length - 1 });
            });


            it("should not display color names for unrelated properties", function () {
                testEditor.setCursorPos({ line: 102, ch: 12 }); // after height
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                expect(hintList.indexOf("aliceblue")).toBe(-1);
            });
        });

        describe("Should not invoke CSS hints on space key", function () {
            beforeEach(function () {
                setupTest(testContentHTML, "html");
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should not trigger CSS property name hints with space key", function () {
                testEditor.setCursorPos({ line: 25, ch: 11 });    // after {
                expectNoHints(CSSCodeHints.cssPropHintProvider, " ");
            });

            it("should not trigger CSS property value hints with space key", function () {
                testEditor.setCursorPos({ line: 28, ch: 21 });    // after flow-from
                expectNoHints(CSSCodeHints.cssPropHintProvider, " ");
            });
        });
    });
});

