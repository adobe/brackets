/*
 * Copyright (c) 2017 - present Adobe Systems Incorporated. All rights reserved.
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

    var SpecRunnerUtils             = brackets.getModule("spec/SpecRunnerUtils"),
        CSSPseudoSelectorCodeHints  = require("main"),
        PseudoStaticDataRaw         = require("text!PseudoSelectors.json"),
        PseudoStaticData            = JSON.parse(PseudoStaticDataRaw);

    describe("CSS Pseudo selector/element Code Hinting", function () {

        var defaultContent = ".selector1: { \n" +
                             "} \n" +
                             ".selector2:: { \n" +
                             "} \n" +
                             ".selector3:n { \n" +
                             "} \n" +
                             ".selector4::f { \n" +
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

        // Ask provider for hints at current cursor position; expect it to return some
        function expectHints(provider, implicitChar, returnWholeObj) {
            expect(provider.hasHints(testEditor, implicitChar)).toBe(true);
            var hintsObj = provider.getHints();
            expect(hintsObj).toBeTruthy();
            // return just the array of hints if returnWholeObj is falsy
            return returnWholeObj ? hintsObj : hintsObj.hints;
        }

        // Ask provider for hints at current cursor position; expect it NOT to return any
        function expectNoHints(provider, implicitChar) {
            expect(provider.hasHints(testEditor, implicitChar)).toBe(false);
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
        function fixPos(pos) {
            if (!("sticky" in pos)) {
                pos.sticky = null;
            }
            return pos;
        }
        function expectCursorAt(pos) {
            var selection = testEditor.getSelection();
            expect(fixPos(selection.start)).toEqual(fixPos(selection.end));
            expect(fixPos(selection.start)).toEqual(fixPos(pos));
        }
        
        function verifyFirstEntry(hintList, expectedFirstHint) {
            expect(hintList[0]).toBe(expectedFirstHint);
        }

        // Helper function to
        // a) ensure the hintList and the list with the available values have the same size
        // b) ensure that all possible values are mentioned in the hintList
        function verifyAllValues(hintList, values) {
            expect(hintList.length).toBe(values.length);
            expect(hintList.sort().toString()).toBe(values.sort().toString());
        }
        
        var modesToTest = ['css', 'scss', 'less'],
            modeCounter;
        
        
        var selectMode = function () {
            return modesToTest[modeCounter];
        };

        describe("Pseudo selectors in different style modes", function () {
            beforeEach(function () {
                // create Editor instance (containing a CodeMirror instance)
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, selectMode());
                testEditor = mock.editor;
                testDocument = mock.doc;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            var testAllHints = function () {
                    testEditor.setCursorPos({ line: 0, ch: 11 });    // after :
                    var hintList = expectHints(CSSPseudoSelectorCodeHints.pseudoSelectorHints);
                    console.log(JSON.stringify(hintList));
                    verifyFirstEntry(hintList, "active");  // filtered on "empty string"
                    verifyListsAreIdentical(hintList, Object.keys(PseudoStaticData.selectors).sort());
                },
                testFilteredHints = function () {
                    testEditor.setCursorPos({ line: 4, ch: 12 });    // after :n
                    var hintList = expectHints(CSSPseudoSelectorCodeHints.pseudoSelectorHints);
                    console.log(JSON.stringify(hintList));
                    verifyFirstEntry(hintList, "not(selector)");  // filtered on "n"
                    verifyListsAreIdentical(hintList, ["not(selector)",
                                                       "nth-child(n)",
                                                       "nth-last-child(n)",
                                                       "nth-last-of-type(n)",
                                                       "nth-of-type(n)"]);
                },
                testNoHints = function () {
                    testEditor.setCursorPos({ line: 0, ch: 10 });    // after {
                    expect(CSSPseudoSelectorCodeHints.pseudoSelectorHints.hasHints(testEditor, 'a')).toBe(false);
                };
            
            for (modeCounter in modesToTest) {
                it("should list all Pseudo selectors right after :", testAllHints);
                it("should list filtered pseudo selectors right after :n", testFilteredHints);
                it("should not list rule hints if the cursor is before :", testNoHints);
            }
        });


        describe("Pseudo elements in various style modes", function () {

            beforeEach(function () {
                // create Editor instance (containing a CodeMirror instance)
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, selectMode());
                testEditor = mock.editor;
                testDocument = mock.doc;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            var testAllHints = function () {
                    testEditor.setCursorPos({ line: 2, ch: 12 });    // after ::
                    var hintList = expectHints(CSSPseudoSelectorCodeHints.pseudoSelectorHints);
                    console.log(JSON.stringify(hintList));
                    verifyFirstEntry(hintList, "after");  // filtered on "empty string"
                    verifyListsAreIdentical(hintList, Object.keys(PseudoStaticData.elements).sort());
                },
                testFilteredHints = function () {
                    testEditor.setCursorPos({ line: 6, ch: 13 });    // after ::f
                    var hintList = expectHints(CSSPseudoSelectorCodeHints.pseudoSelectorHints);
                    console.log(JSON.stringify(hintList));
                    verifyFirstEntry(hintList, "first-letter");  // filtered on "f"
                    verifyListsAreIdentical(hintList, ["first-letter",
                                                       "first-line"]);
                },
                testNoHints = function () {
                    testEditor.setCursorPos({ line: 2, ch: 10 });    // after ::f
                    expect(CSSPseudoSelectorCodeHints.pseudoSelectorHints.hasHints(testEditor, 'c')).toBe(false);
                };
            
            for (modeCounter in modesToTest) {
                it("should list all Pseudo selectors right after :", testAllHints);
                it("should list filtered pseudo selectors right after ::f", testFilteredHints);
                it("should not list rule hints if the cursor is before :", testNoHints);
            }

        });

    });
});

