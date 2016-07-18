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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, brackets */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        HTMLEntityHints = require("main").SpecialCharHints,
        defaultContent  = require("text!unittest-files/default.html");

    describe("HTML Entity Hinting", function () {

        var testEditorAndDoc,
            hintProvider = new HTMLEntityHints();

        beforeEach(function () {
            testEditorAndDoc = SpecRunnerUtils.createMockEditor(defaultContent, "html");
        });

        afterEach(function () {
            SpecRunnerUtils.destroyMockEditor(testEditorAndDoc.doc);
        });

        // Ask provider for hints at current cursor position; expect it to return some
        function expectHints(provider) {
            expect(provider.hasHints(testEditorAndDoc.editor, null)).toBe(true);
            var hintsObj = provider.getHints(null);
            expect(hintsObj).toBeTruthy();
            return hintsObj.hints; // return just the array of hints
        }

        // Ask provider for hints at current cursor position
        function expectNoHints(provider) {
            expect(provider.hasHints(testEditorAndDoc.editor, null)).toBe(false);
        }

        it("should show hints when in Text in paragraph", function () {
            testEditorAndDoc.editor.setCursorPos({line: 7, ch: 17});

            expectHints(hintProvider);
        });

        it("should show hints when another entity is in the same line", function () {
            testEditorAndDoc.editor.setCursorPos({line: 12, ch: 23});

            expectHints(hintProvider);
        });

        it("should show hints when cursor inside entity", function () {
            testEditorAndDoc.editor.setCursorPos({line: 17, ch: 19});

            var hints = expectHints(hintProvider);
            expect(hints).toEqual(["&amp;acirc; <span class='entity-display-character'>&acirc;</span>",
                                   "&amp;acute; <span class='entity-display-character'>&acute;</span>"]);
        });

        it("shouldn't show hints when inside an opening tag", function () {
            testEditorAndDoc.editor.setCursorPos({line: 21, ch: 11});

            expectNoHints(hintProvider);
        });

        it("shouldn't show hints when inside a closing tag", function () {
            testEditorAndDoc.editor.setCursorPos({line: 24, ch: 15});

            expectNoHints(hintProvider);
        });

        it("should show hints when semi-colon on the same line", function () {
            testEditorAndDoc.editor.setCursorPos({line: 28, ch: 21});

            expectHints(hintProvider);
        });

        it("shouldn't show hints in attribute name", function () {
            testEditorAndDoc.editor.setCursorPos({line: 32, ch: 12});

            expectNoHints(hintProvider);
        });

        it("shouldn't show hints in attribute value", function () {
            testEditorAndDoc.editor.setCursorPos({line: 35, ch: 19});

            expectNoHints(hintProvider);
        });

        it("shouldn't show hints in url", function () {
            testEditorAndDoc.editor.setCursorPos({line: 38, ch: 78});

            expectNoHints(hintProvider);
        });

        it("should show multiple hints in the same line", function () {
            testEditorAndDoc.editor.setCursorPos({line: 41, ch: 17});

            expectHints(hintProvider);

            testEditorAndDoc.editor.setCursorPos({line: 41, ch: 29});

            expectHints(hintProvider);
        });

        it("should sort &#xxxx hints numerically not alphabetically", function () {
            testEditorAndDoc.editor.setCursorPos({line: 45, ch: 14});

            var hints = expectHints(hintProvider);
            hintProvider.insertHint(hints[0]);
            expect(testEditorAndDoc.editor.document.getRange({line: 45, ch: 12}, {line: 45, ch: 17})).toEqual("&#33;");

            testEditorAndDoc.editor.setCursorPos({line: 45, ch: 14});
            hintProvider.insertHint(hints[23]);
            expect(testEditorAndDoc.editor.document.getRange({line: 45, ch: 12}, {line: 45, ch: 18})).toEqual("&#123;");
        });

        describe("Inserting Tests", function () {

            it("should replace entity with hint if inside entity", function () {
                testEditorAndDoc.editor.setCursorPos({line: 17, ch: 19});

                var hints = expectHints(hintProvider);
                hintProvider.insertHint(hints[0]);
                expect(testEditorAndDoc.editor.document.getRange({line: 17, ch: 16}, {line: 17, ch: 23})).toEqual("&acirc;");
            });

            it("should place cursor at the end of the replaced entity", function () {
                testEditorAndDoc.editor.setCursorPos({line: 17, ch: 19});

                var hints = expectHints(hintProvider);
                hintProvider.insertHint(hints[0]);
                expect(testEditorAndDoc.editor.getCursorPos()).toEqual({line: 17, ch: 23});
            });
        });
    });
});
