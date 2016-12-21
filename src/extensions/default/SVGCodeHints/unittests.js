/*
 * Copyright (c) 2015 Adobe Systems Incorporated. All rights reserved.
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
/*global define, brackets, $, describe, beforeEach, afterEach, it, expect */

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules.
    var SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        SVGCodeHints        = require("./main");
    
    describe("SVG Code Hints", function () {
        var testContent, testDocument, testEditor;
        
        // SVG Content that we will be using to run tests against.
        testContent =   "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n" +
                        "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
                        "     width=\"200\" height=\"200\" preserveAspectRatio=\"xMinYMin meet\">\n" +
                        "    <title>Brackets SVG Code Hints</title>\n" +
                        "    <rect width=\"200\" height=\"200\" baseline-shift=\"baseline\" alignment-baseline=\"alphabetic\" stroke-width=\"1\" color=\"\"></rect>\n" +
                        "    <rect width='160' height='160' x='20' y='20' baseline-shift='super' alignment-baseline='baseline' color='rent' fill='transparent' />\n" +
                        "    <g>\n" +
                        "        \n" +
                        "    </g>\n" +
                        "</svg>\n";
        
        beforeEach(function () {
            // Create a mock svg document to run tests against.
            var mockEditor = SpecRunnerUtils.createMockEditor(testContent, "svg", {
                startLine: 0,
                endLine: 10
            });
            testEditor = mockEditor.editor;
            testDocument = mockEditor.doc;
        });
        
        afterEach(function () {
            testEditor.destroy();
            testEditor = null;
        });
        
        // Returns a list of hints.
        function extractHintList(hints) {
            return $.map(hints, function ($node) {
                return $node.text();
            });
        }
        
        // Verifies the availability of hints.
        function expectHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(true);
            var hintObj = provider.getHints();
            expect(hintObj).toBeTruthy();
            return hintObj.hints;
        }

        // Verifies the non-availability of hints.
        function expectNoHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(false);
        }

        // Verifies the presence of a hint.
        function verifyHints(hintList, expectedHint) {
            var hints = extractHintList(hintList);
            expect(hints[0]).toBe(expectedHint);
        }
        
        // Verifies the exclution of an unexpected hint.
        function verifyHintsExcluded(hintList, unexpectedHint) {
            var hints = extractHintList(hintList);
            expect(hints.indexOf(unexpectedHint)).toBe(-1);
        }
        
        // Inserts the hint in document.
        function selectHint(provider, expectedHint) {
            var hintList = expectHints(provider),
                hints = extractHintList(hintList);
            expect(hints.indexOf(expectedHint)).not.toBe(-1);
            return provider.insertHint(expectedHint);
        }
        
        // Used to test token at given positions.
        function expectTokenAt(pos, string, type) {
            var token = testEditor._codeMirror.getTokenAt(pos);
            expect(token.string).toBe(string);
            expect(token.type).toBe(type);
        }
        
        // Used to test cursor position.
        function expectCursorAt(pos) {
            var selection = testEditor.getSelection();
            expect(selection.start).toEqual(selection.end);
            expect(selection.start).toEqual(pos);
        }
        
        describe("Tag Hinting", function () {
            it("should hint at < before tag name", function () {
                // After < in <svg
                testEditor.setCursorPos({line: 1, ch: 1});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "a");
            });

            it("should hint inside the tag name", function () {
                // After <sv in <svg
                testEditor.setCursorPos({line: 1, ch: 3});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "svg");
            });

            it("should hint at the end of the tag", function () {
                // After <svg in <svg
                testEditor.setCursorPos({line: 1, ch: 4});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "svg");
            });
            
            it("should NOT hint in closing tag between < and /", function () {
                // Between < and / in </title>
                testEditor.setCursorPos({line: 3, ch: 35});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // In case we have space between < and /
                testDocument.replaceRange(" ", {line: 3, ch: 35});
                testEditor.setCursorPos({line: 3, ch: 36});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            it("should NOT hint in closing tag after </", function () {
                // After </ in </title>
                testEditor.setCursorPos({line: 3, ch: 36});
                expectNoHints(SVGCodeHints.hintProvider);
            });

            it("should NOT hint in the middle of closing tag", function () {
                // After </tit in </title>
                testEditor.setCursorPos({line: 3, ch: 39});
                expectNoHints(SVGCodeHints.hintProvider);
            });

            it("should NOT hint at the end of closing tag", function () {
                // Before > in </title>
                testEditor.setCursorPos({line: 3, ch: 41});
                expectNoHints(SVGCodeHints.hintProvider);
            });

            it("should NOT hint after the first space in closing tag", function () {
                // Before > in </title >
                testDocument.replaceRange(" ", {line: 3, ch: 41});
                testEditor.setCursorPos({line: 3, ch: 42});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            // A whitespace between < and tag name makes xml invalid.
            it("should NOT hint in case there is a whitespace between < and tag name", function () {
                // After < in first < rect
                testDocument.replaceRange(" ", {line: 4, ch: 5});
                testEditor.setCursorPos({line: 4, ch: 6});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            it("should NOT hint after first character in an invalid tag", function () {
                // After < r in first < rect
                testDocument.replaceRange(" ", {line: 4, ch: 5});
                testEditor.setCursorPos({line: 4, ch: 7});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            it("should NOT hint in the middle of invalid tag", function () {
                // After < rec in < rect
                testDocument.replaceRange(" ", {line: 4, ch: 5});
                testEditor.setCursorPos({line: 4, ch: 9});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            it("should NOT hint inside the content of a tag", function () {
                // After > in <title>
                testEditor.setCursorPos({line: 3, ch: 11});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // After Brackets in <title>Brackets
                testEditor.setCursorPos({line: 3, ch: 20});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // Between <rect></rect>
                testEditor.setCursorPos({line: 4, ch: 119});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // After <title>+space in <title> Brackets
                testDocument.replaceRange(" ", {line: 3, ch: 11});
                testEditor.setCursorPos({line: 3, ch: 12});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            it("should not hint after the closed tag", function () {
                // After </rect>
                testEditor.setCursorPos({line: 4, ch: 126});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // After space at </rect>+space
                testDocument.replaceRange(" ", {line: 4, ch: 126});
                testEditor.setCursorPos({line: 4, ch: 127});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // After />
                testEditor.setCursorPos({line: 5, ch: 136});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // After space in />+space
                testDocument.replaceRange(" ", {line: 5, ch: 136});
                testEditor.setCursorPos({line: 5, ch: 137});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // After </g>
                testEditor.setCursorPos({line: 8, ch: 8});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // After space in </g>+space
                testDocument.replaceRange(" ", {line: 8, ch: 8});
                testEditor.setCursorPos({line: 8, ch: 9});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            it("should hint inside XML declaration", function () {
                // After < in <?xml
                testEditor.setCursorPos({line: 0, ch: 1});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // After <?xm
                testEditor.setCursorPos({line: 0, ch: 4});
                expectNoHints(SVGCodeHints.hintProvider);
                
                // After <?xml+space
                testEditor.setCursorPos({line: 0, ch: 6});
                expectNoHints(SVGCodeHints.hintProvider);
            });
        });
        
        describe("Attribute Hinting", function () {
            
            it("should hint after first space after tag", function () {
                // After <rect
                testEditor.setCursorPos({line: 4, ch: 10});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "class");
            });
            
            it("should hint after first character of the attribute", function () {
                // After <rect w
                testEditor.setCursorPos({line: 4, ch: 11});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "width");
            });
            
            it("should hint in the middle of the attribute", function () {
                // After <rect wid
                testEditor.setCursorPos({line: 4, ch: 13});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "width");
            });
            
            it("should hint at the end of the attribute", function () {
                // After <rect width
                testEditor.setCursorPos({line: 4, ch: 15});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "width");
            });
            
            it("should NOT hint if we have whitespace between attribute and =", function () {
                // Before = in <rect width =
                testDocument.replaceRange("  ", {line: 4, ch: 15});
                testEditor.setCursorPos({line: 4, ch: 16});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            it("should NOT hint in case there is a space between < and tag name", function () {
                // After space in < rect
                testDocument.replaceRange(" ", {line: 4, ch: 5});
                testEditor.setCursorPos({line: 4, ch: 11});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            it("should exclude hints if they have already been used", function () {
                // In first <rect, after <rect+space
                testEditor.setCursorPos({line: 4, ch: 10});
                var hintLint = expectHints(SVGCodeHints.hintProvider);
                verifyHintsExcluded(hintLint, "width");
                verifyHintsExcluded(hintLint, "height");
                verifyHintsExcluded(hintLint, "baseline-shift");
                verifyHintsExcluded(hintLint, "alignment-baseline");
                verifyHintsExcluded(hintLint, "stroke-width");
                
                // In the second <rect, after <rect+space
                testEditor.setCursorPos({line: 5, ch: 10});
                hintLint = expectHints(SVGCodeHints.hintProvider);
                verifyHintsExcluded(hintLint, "width");
                verifyHintsExcluded(hintLint, "height");
                verifyHintsExcluded(hintLint, "x");
                verifyHintsExcluded(hintLint, "y");
                verifyHintsExcluded(hintLint, "baseline-shift");
                verifyHintsExcluded(hintLint, "alignment-baseline");
            });
            
            it("should NOT exclude current token from hints", function () {
                var hintList, hints;
                
                // After <rect w
                testEditor.setCursorPos({line: 4, ch: 11});
                hintList = expectHints(SVGCodeHints.hintProvider);
                hints    = extractHintList(hintList);
                expect(hints.indexOf("width")).not.toBe(-1);
                
                // After <rect widt
                testEditor.setCursorPos({line: 4, ch: 14});
                hintList = expectHints(SVGCodeHints.hintProvider);
                hints = extractHintList(hintList);
                expect(hints.indexOf("width")).not.toBe(-1);
                
                // After <rect width
                testEditor.setCursorPos({line: 5, ch: 15});
                hintList = expectHints(SVGCodeHints.hintProvider);
                hints = extractHintList(hintList);
                expect(hints.indexOf("width")).not.toBe(-1);
            });
        });
        
        describe("Value Hinting", function () {
            it("should hint after =", function () {
                // After baseline-shift= in second rect.
                testEditor.setCursorPos({line: 5, ch: 64});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "baseline");
            });
            
            it("should hint after ='", function () {
                // After baseline-shift='
                testEditor.setCursorPos({line: 5, ch: 65});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "baseline");
            });
            
            it("should hint after =\"", function () {
                // After baseline-shift="
                testEditor.setCursorPos({line: 4, ch: 51});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "baseline");
            });
            
            it("should hint after first character", function () {
                // After baseline-shift="b
                testEditor.setCursorPos({line: 4, ch: 52});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "baseline");
            });
            
            it("should hint in the middle of value", function () {
                // After baseline-shift="base
                testEditor.setCursorPos({line: 4, ch: 55});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "baseline");
            });
            
            it("should hint at the end of the value", function () {
                // After baseline-shift="baseline
                testEditor.setCursorPos({line: 4, ch: 59});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "baseline");
            });
            
            it("should hint for first attribute in multiple options", function () {
                // After preserveAspectRatio="x
                testEditor.setCursorPos({line: 2, ch: 52});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "xMaxYMax");
            });
            
            it("should hint for second value in multiple options", function () {
                // After m in meet
                testEditor.setCursorPos({line: 2, ch: 61});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "meet");
            });
            
            it("should hint in middle of value in muliple options with empty query", function () {
                // Between xMinYMid and meet
                testDocument.replaceRange(" ", {line: 2, ch: 59});
                testEditor.setCursorPos({ line: 2, ch: 60});
                var hintLint = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintLint, "none");
            });
            
            it("should hint in middle of value in multiple options with a query", function () {
                // Between xMinYMid and meet
                testDocument.replaceRange(" sli", {line: 2, ch: 59});
                testEditor.setCursorPos({line: 2, ch: 63});
                var hintLint = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintLint, "slice");
            });
            
            it("should NOT hint in case cursor is out of right quote", function () {
                // After meet"
                testEditor.setCursorPos({line: 2, ch: 65});
                expectNoHints(SVGCodeHints.hintProvider);
            });
    
            it("should NOT hint in an invalid tag", function () {
                // After fill=" in < rect
                testDocument.replaceRange(" ", {line: 4, ch: 5});
                testEditor.setCursorPos({line: 4, ch: 42});
                expectNoHints(SVGCodeHints.hintProvider);
            });
            
            it("should exclude a value if it is already been used", function () {
                // Between xMinYMid and meet
                testDocument.replaceRange(" ", {line: 2, ch: 59});
                testEditor.setCursorPos({ line: 2, ch: 60});
                var hintLint = expectHints(SVGCodeHints.hintProvider);
                verifyHintsExcluded(hintLint, "xMinYMin");
                verifyHintsExcluded(hintLint, "meet");
            });
            
            it("should NOT exclude current query from hints", function () {
                var hintList, hints;
                
                // After xMinYMid
                testDocument.replaceRange(" xMax", {line: 2, ch: 59});
                testEditor.setCursorPos({line: 2, ch: 64});
                hintList = expectHints(SVGCodeHints.hintProvider);
                hints = extractHintList(hintList);
                expect(hints.indexOf("xMaxYMax")).not.toBe(-1);
            });
        });
        
        describe("Color names and swatches", function () {
            it("should show color swatches", function () {
                // After color="
                testEditor.setCursorPos({line: 4, ch: 117});
                var hints = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hints, "aliceblue"); // first hint should be aliceblue
                expect(hints[0].find(".color-swatch").length).toBe(1);
                expect(hints[0].find(".color-swatch").css("backgroundColor")).toBe("rgb(240, 248, 255)");
            });

            it("should always include transparent and currentColor and they should not have a swatch, but class no-swatch-margin", function () {
                // After color='rent
                testEditor.setCursorPos({line: 5, ch: 113});
                var hints = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hints, "currentColor"); // first hint should be currentColor
                expect(hints[0].find(".color-swatch").length).toBe(0); // no swatch for currentColor
                expect(hints[2].find(".color-swatch").length).toBe(0); // no swatch for transparent
                expect(hints[0].hasClass("no-swatch-margin")).toBeTruthy(); // no-swatch-margin applied to currentColor
                expect(hints[2].hasClass("no-swatch-margin")).toBeTruthy(); // no-swatch-margin applied to transparent
            });

            it("should remove class no-swatch-margin from transparent if it's the only one in the list", function () {
                // After fill='transparent
                testEditor.setCursorPos({line: 5, ch: 132});
                var hints = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hints, "transparent");
                expect(hints.length).toBe(1); // transparent should be the only hint
                expect(hints[0].find(".color-swatch").length).toBe(0); // no swatch for transparent
                expect(hints[0].hasClass("no-swatch-margin")).toBeFalsy(); // no-swatch-margin not applied to transparent
            });
        });

        describe("Tag Insertion", function () {
            it("should insert if query is empty", function () {
                // After < inside <g>
                testDocument.replaceRange("<", { line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 9});
                selectHint(SVGCodeHints.hintProvider, "a");
                expectTokenAt({line: 7, ch: 10}, "a", "tag");
                expectCursorAt({line: 7, ch: 10});
            });
            
            it("should insert if query is one character long", function () {
                // After <d inside <g>
                testDocument.replaceRange("<d", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 10});
                selectHint(SVGCodeHints.hintProvider, "defs");
                expectTokenAt({line: 7, ch: 11}, "defs", "tag");
                expectCursorAt({line: 7, ch: 13});
            });
            
            it("should insert if query is complete", function () {
                // After <defs inside <g>
                testDocument.replaceRange("<defs", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 13});
                selectHint(SVGCodeHints.hintProvider, "defs");
                expectTokenAt({line: 7, ch: 13}, "defs", "tag");
                expectCursorAt({line: 7, ch: 13});
            });
        });
        
        describe("Attribute Insertion", function () {
            it("should insert if query is empty", function () {
                // After <defs+space inside <g>
                testDocument.replaceRange("<defs ", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 14});
                selectHint(SVGCodeHints.hintProvider, "alignment-baseline");
                expectTokenAt({line: 7, ch: 32}, "alignment-baseline", "attribute");
                expectTokenAt({line: 7, ch: 33}, "=", null);
                expectTokenAt({line: 7, ch: 35}, "\"\"", "string");
                expectCursorAt({line: 7, ch: 34});
            });
            
            it("should insert if query is one character long", function () {
                // After <defs b inside <g>
                testDocument.replaceRange("<defs b", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 15});
                selectHint(SVGCodeHints.hintProvider, "baseline-shift");
                expectTokenAt({line: 7, ch: 28}, "baseline-shift", "attribute");
                expectTokenAt({line: 7, ch: 29}, "=", null);
                expectTokenAt({line: 7, ch: 31}, "\"\"", "string");
                expectCursorAt({line: 7, ch: 30});
            });
            
            it("should insert if query is complete", function () {
                // After <defs clip-path inside <g>
                testDocument.replaceRange("<defs clip-path", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 23});
                selectHint(SVGCodeHints.hintProvider, "clip-path");
                expectTokenAt({line: 7, ch: 23}, "clip-path", "attribute");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 26}, "\"\"", "string");
                expectCursorAt({line: 7, ch: 25});
            });
            
            it("should NOT overide =", function () {
                // Between clip-path and "inherit" in <g>
                testDocument.replaceRange("<defs clip-path=\"inherit\"", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 18});
                expectTokenAt({line: 7, ch: 24}, "=", null);
                selectHint(SVGCodeHints.hintProvider, "clip-rule");
                expectTokenAt({line: 7, ch: 23}, "clip-rule", "attribute");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectCursorAt({line: 7, ch: 23});
            });
        });
        
        describe("Value Insertion", function () {
            it("should insert if = is typed after an attribute", function () {
                // after clip-path= inside <g>
                testDocument.replaceRange("<defs clip-path=", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 24});
                selectHint(SVGCodeHints.hintProvider, "inherit");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 33}, "\"inherit\"", "string");
                expectCursorAt({line: 7, ch: 33});
            });
            
            it("should insert if =\" is typed after an attribute", function () {
                // After clip-path=" inside <g>
                testDocument.replaceRange("<defs clip-path=\"", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 25});
                selectHint(SVGCodeHints.hintProvider, "inherit");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 33}, "\"inherit\"", "string");
                expectCursorAt({line: 7, ch: 33});
            });
            
            it("should insert if =' is typed after an attribute", function () {
                // After =' inside <g>
                testDocument.replaceRange("<defs clip-path='", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 25});
                selectHint(SVGCodeHints.hintProvider, "inherit");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 33}, "'inherit'", "string");
                expectCursorAt({line: 7, ch: 33});
            });
            
            it("should insert if first character is typed after =\"", function () {
                // After clip-path="i inside <g>
                testDocument.replaceRange("<defs clip-path=\"i", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 26});
                selectHint(SVGCodeHints.hintProvider, "inherit");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 33}, "\"inherit\"", "string");
                expectCursorAt({line: 7, ch: 33});
            });
            
            it("should insert if first character is typed after ='", function () {
                // After clip-path='i inside <g>
                testDocument.replaceRange("<defs clip-path='i", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 26});
                selectHint(SVGCodeHints.hintProvider, "inherit");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 33}, "'inherit'", "string");
                expectCursorAt({line: 7, ch: 33});
            });
            
            it("should insert if we are in middle of query after =\"", function () {
                // After clip-path="inhe inside <g>
                testDocument.replaceRange("<defs clip-path=\"inhe", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 29});
                selectHint(SVGCodeHints.hintProvider, "inherit");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 33}, "\"inherit\"", "string");
                expectCursorAt({line: 7, ch: 33});
            });
            
            it("should insert if we are in middle of query after ='", function () {
                // After clip-path='inhe inside <g>
                testDocument.replaceRange("<defs clip-path='inhe", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 29});
                selectHint(SVGCodeHints.hintProvider, "inherit");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 33}, "'inherit'", "string");
                expectCursorAt({line: 7, ch: 33});
            });
            
            it("should insert if we are in the end of value after ='", function () {
                // Before last ' in clip-path='inherit' inside <g>
                testDocument.replaceRange("<defs clip-path='inherit'", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 32});
                selectHint(SVGCodeHints.hintProvider, "inherit");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 33}, "'inherit'", "string");
                expectCursorAt({line: 7, ch: 33});
            });
            
            it("should insert if we are in the end of value after =\"", function () {
                // Before last " in clip-path="inherit" inside <g>
                testDocument.replaceRange("<defs clip-path=\"inherit\"", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 32});
                selectHint(SVGCodeHints.hintProvider, "inherit");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 33}, "\"inherit\"", "string");
                expectCursorAt({line: 7, ch: 33});
            });
            
            it("should insert value to left in a multiple options attribute", function () {
                // Between "" in transform="" inside <g>
                testDocument.replaceRange("<rect transform=\"\"", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 25});
                selectHint(SVGCodeHints.hintProvider, "matrix()");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 34}, "\"matrix()\"", "string");
                expectCursorAt({line: 7, ch: 34});
            });
            
            it("should insert value to the right in a multiple options attribute", function () {
                // After "matrix() " inside <g>
                testDocument.replaceRange("<rect transform=\"matrix() \"", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 34});
                selectHint(SVGCodeHints.hintProvider, "rotate()");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 34}, "\"matrix() rotate()\"", "string");
                expectCursorAt({line: 7, ch: 43});
            });
            
            it("should insert value in the middle in a multiple options attribute", function () {
                // Between matrix() and rotate() in "matrix()  rotate()"
                testDocument.replaceRange("<rect transform=\"matrix()  rotate()\"", {line: 7, ch: 8});
                testEditor.setCursorPos({line: 7, ch: 34});
                selectHint(SVGCodeHints.hintProvider, "scale()");
                expectTokenAt({line: 7, ch: 24}, "=", null);
                expectTokenAt({line: 7, ch: 34}, "\"matrix() scale() rotate()\"", "string");
                expectCursorAt({line: 7, ch: 41});
            });
        });
    });
});
