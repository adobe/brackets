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
/*global define, describe, it, expect, beforeFirst, afterLast, beforeEach, afterEach, waitsFor, waitsForDone, runs, window, jasmine */
/*unittests: FindReplace*/

define(function (require, exports, module) {
    'use strict';
    
    var Commands              = require("command/Commands"),
        FindReplace           = require("search/FindReplace"),
        KeyEvent              = require("utils/KeyEvent"),
        SpecRunnerUtils       = require("spec/SpecRunnerUtils"),
        StringUtils           = require("utils/StringUtils"),
        Strings               = require("strings");

    var defaultContent = "/* Test comment */\n" +
                         "define(function (require, exports, module) {\n" +
                         "    var Foo = require(\"modules/Foo\"),\n" +
                         "        Bar = require(\"modules/Bar\"),\n" +
                         "        Baz = require(\"modules/Baz\");\n" +
                         "    \n" +
                         "    function callFoo() {\n" +
                         "        \n" +
                         "        foo();\n" +
                         "        \n" +
                         "    }\n" +
                         "\n" +
                         "}";
        
    describe("FindReplace - Unit", function () {
        var editor, doc;
        
        beforeEach(function () {
            var mocks = SpecRunnerUtils.createMockEditor(defaultContent, "javascript");
            editor = mocks.editor;
            doc = mocks.doc;
        });
        
        afterEach(function () {
            SpecRunnerUtils.destroyMockEditor(doc);
            editor = null;
            doc = null;
        });
        
        describe("getWordAt", function () {
            it("should select a word bounded by whitespace from a pos in the middle of the word", function () {
                expect(FindReplace._getWordAt(editor, {line: 2, ch: 9}))
                    .toEqual({start: {line: 2, ch: 8}, end: {line: 2, ch: 11}, text: "Foo"});
            });
            it("should select a word bounded by whitespace from a pos at the beginning of the word", function () {
                expect(FindReplace._getWordAt(editor, {line: 2, ch: 8}))
                    .toEqual({start: {line: 2, ch: 8}, end: {line: 2, ch: 11}, text: "Foo"});
            });
            it("should select a word bounded by whitespace from a pos at the end of the word", function () {
                expect(FindReplace._getWordAt(editor, {line: 2, ch: 11}))
                    .toEqual({start: {line: 2, ch: 8}, end: {line: 2, ch: 11}, text: "Foo"});
            });
            
            it("should select a word bounded by nonword characters from a pos in the middle of the word", function () {
                expect(FindReplace._getWordAt(editor, {line: 2, ch: 26}))
                    .toEqual({start: {line: 2, ch: 23}, end: {line: 2, ch: 30}, text: "modules"});
            });
            it("should select a word bounded by nonword characters from a pos at the beginning of the word", function () {
                expect(FindReplace._getWordAt(editor, {line: 2, ch: 23}))
                    .toEqual({start: {line: 2, ch: 23}, end: {line: 2, ch: 30}, text: "modules"});
            });
            it("should select a word bounded by nonword characters from a pos at the end of the word", function () {
                expect(FindReplace._getWordAt(editor, {line: 2, ch: 23}))
                    .toEqual({start: {line: 2, ch: 23}, end: {line: 2, ch: 30}, text: "modules"});
            });
            
            it("should return an empty range in the middle of whitespace", function () {
                expect(FindReplace._getWordAt(editor, {line: 8, ch: 4}))
                    .toEqual({start: {line: 8, ch: 4}, end: {line: 8, ch: 4}, text: ""});
            });
            it("should return an empty range in the middle of non-word chars", function () {
                expect(FindReplace._getWordAt(editor, {line: 8, ch: 13}))
                    .toEqual({start: {line: 8, ch: 13}, end: {line: 8, ch: 13}, text: ""});
            });
        });
        
        describe("expandAndAddNextToSelection", function () {
            it("should do nothing if the cursor is in non-word/whitespace", function () {
                editor.setSelection({line: 8, ch: 4});
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 8, ch: 4}, end: {line: 8, ch: 4}, primary: true, reversed: false}]);
            });
            
            it("should expand a single cursor to the containing word without adding a new selection", function () {
                editor.setSelection({line: 2, ch: 26});
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 2, ch: 23}, end: {line: 2, ch: 30}, primary: true, reversed: false}]);
            });
            
            it("should add the next match for a single word selection as a new primary selection", function () {
                editor.setSelection({line: 2, ch: 23}, {line: 2, ch: 30});
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 2, ch: 23}, end: {line: 2, ch: 30}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 23}, end: {line: 3, ch: 30}, primary: true, reversed: false}]);
            });
            
            it("should add the next match for an existing range that isn't actually a word", function () {
                editor.setSelection({line: 2, ch: 14}, {line: 2, ch: 22}); // "require("
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 2, ch: 14}, end: {line: 2, ch: 22}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 22}, primary: true, reversed: false}]);
            });
            
            it("should find the next match case-insensitively", function () {
                editor.setSelection({line: 6, ch: 17}, {line: 6, ch: 20}); // "Foo" in "callFoo" - should next find "foo" in "foo()"
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 6, ch: 17}, end: {line: 6, ch: 20}, primary: false, reversed: false},
                                                        {start: {line: 8, ch: 8}, end: {line: 8, ch: 11}, primary: true, reversed: false}]);
                
            });
            
            it("should expand two cursors without adding a new selection", function () {
                editor.setSelections([{start: {line: 2, ch: 26}, end: {line: 2, ch: 26}},
                                      {start: {line: 3, ch: 16}, end: {line: 3, ch: 16}}]);
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 2, ch: 23}, end: {line: 2, ch: 30}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: true, reversed: false}]);
            });
            
            it("should, when one cursor and one range are selected, expand the cursor and add the next match for the range to the selection", function () {
                editor.setSelections([{start: {line: 2, ch: 26}, end: {line: 2, ch: 26}},
                                      {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}}]); // "require"
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 2, ch: 23}, end: {line: 2, ch: 30}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}, primary: true, reversed: false}]);
            });
            
            it("should wrap around the end of the document and add the next instance at the beginning of the document", function () {
                editor.setSelection({line: 4, ch: 14}, {line: 4, ch: 21}); // "require"
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: true, reversed: false},
                                                        {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}, primary: false, reversed: false}]);
            });
            
            it("should skip over matches that are already in the selection", function () {
                // select all instances of "require" except the second one
                editor.setSelections([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}},
                                      {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}},
                                      {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}}]);
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: false, reversed: false},
                                                        {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}, primary: true, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}, primary: false, reversed: false}]);
            });
            
            it("should do nothing if all instances are already selected", function () {
                editor.setSelections([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}},
                                      {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}},
                                      {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}},
                                      {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}}]);
                FindReplace._expandWordAndAddNextToSelection(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: false, reversed: false},
                                                        {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}, primary: true, reversed: false}]);
            });
        });
        
        describe("expandAndAddNextToSelection - with removeCurrent (for Skip Match)", function () {
            it("should remove a single range selection and select the next instance", function () {
                editor.setSelection({line: 2, ch: 23}, {line: 2, ch: 30});
                FindReplace._expandWordAndAddNextToSelection(editor, true);
                expect(editor.getSelections()).toEqual([{start: {line: 3, ch: 23}, end: {line: 3, ch: 30}, primary: true, reversed: false}]);
            });
            
            it("should expand a single cursor to a range, then change the selection to the next instance of that range", function () {
                editor.setSelection({line: 2, ch: 26}, {line: 2, ch: 26});
                FindReplace._expandWordAndAddNextToSelection(editor, true);
                expect(editor.getSelections()).toEqual([{start: {line: 3, ch: 23}, end: {line: 3, ch: 30}, primary: true, reversed: false}]);
            });
            
            it("should, when one cursor and one range are selected, expand the cursor and change the range selection to its next match", function () {
                editor.setSelections([{start: {line: 2, ch: 26}, end: {line: 2, ch: 26}},
                                      {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}}]); // "require"
                FindReplace._expandWordAndAddNextToSelection(editor, true);
                expect(editor.getSelections()).toEqual([{start: {line: 2, ch: 23}, end: {line: 2, ch: 30}, primary: false, reversed: false},
                                                        {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}, primary: true, reversed: false}]);
            });
            
            it("should wrap around the end of the document and switch to the next instance at the beginning of the document", function () {
                editor.setSelection({line: 4, ch: 14}, {line: 4, ch: 21}); // "require"
                FindReplace._expandWordAndAddNextToSelection(editor, true);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: true, reversed: false}]);
            });
            
            it("should skip over matches that are already in the selection (but still remove the current one)", function () {
                // select all instances of "require" except the second one
                editor.setSelections([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}},
                                      {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}},
                                      {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}}]);
                FindReplace._expandWordAndAddNextToSelection(editor, true);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: false, reversed: false},
                                                        {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}, primary: true, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: false, reversed: false}]);
            });

            it("should just remove the primary selection if all instances are already selected", function () {
                editor.setSelections([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}},
                                      {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}},
                                      {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}},
                                      {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}}]);
                FindReplace._expandWordAndAddNextToSelection(editor, true);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: false, reversed: false},
                                                        {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: true, reversed: false}]);
            });
        });
        
        describe("findAllAndSelect", function () {
            it("should find all instances of a selected range when first instance is selected, keeping it primary", function () {
                editor.setSelection({line: 1, ch: 17}, {line: 1, ch: 24});
                FindReplace._findAllAndSelect(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: true, reversed: false},
                                                        {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}, primary: false, reversed: false}]);
            });

            it("should find all instances of a selected range when instance other than first is selected, keeping it primary", function () {
                editor.setSelection({line: 3, ch: 14}, {line: 3, ch: 21});
                FindReplace._findAllAndSelect(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: false, reversed: false},
                                                        {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: true, reversed: false},
                                                        {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}, primary: false, reversed: false}]);
            });
            
            it("should throw away selections other than the primary selection", function () {
                editor.setSelections([{start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: true},
                                      {start: {line: 6, ch: 4}, end: {line: 6, ch: 6}}]);
                FindReplace._findAllAndSelect(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: false, reversed: false},
                                                        {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: true, reversed: false},
                                                        {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}, primary: false, reversed: false}]);
            });
            
            it("should expand cursor to range, then find other instances", function () {
                editor.setSelection({line: 3, ch: 18}, {line: 3, ch: 18});
                FindReplace._findAllAndSelect(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 17}, end: {line: 1, ch: 24}, primary: false, reversed: false},
                                                        {start: {line: 2, ch: 14}, end: {line: 2, ch: 21}, primary: false, reversed: false},
                                                        {start: {line: 3, ch: 14}, end: {line: 3, ch: 21}, primary: true, reversed: false},
                                                        {start: {line: 4, ch: 14}, end: {line: 4, ch: 21}, primary: false, reversed: false}]);
            });

            it("should find all case insensitively", function () {
                editor.setSelection({line: 8, ch: 10}, {line: 8, ch: 10}); // inside "foo", should also find "Foo"s
                FindReplace._findAllAndSelect(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 2, ch: 8}, end: {line: 2, ch: 11}, primary: false, reversed: false},
                                                        {start: {line: 2, ch: 31}, end: {line: 2, ch: 34}, primary: false, reversed: false},
                                                        {start: {line: 6, ch: 17}, end: {line: 6, ch: 20}, primary: false, reversed: false},
                                                        {start: {line: 8, ch: 8}, end: {line: 8, ch: 11}, primary: true, reversed: false}]);
            });
            
            it("should not change the selection if the primary selection is a cursor inside a non-word", function () {
                editor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 10}},
                                      {start: {line: 8, ch: 0}, end: {line: 8, ch: 0}}]);
                FindReplace._findAllAndSelect(editor);
                expect(editor.getSelections()).toEqual([{start: {line: 1, ch: 4}, end: {line: 1, ch: 10}, primary: false, reversed: false},
                                                        {start: {line: 8, ch: 0}, end: {line: 8, ch: 0}, primary: true, reversed: false}]);
            });
        });
    });
    
    describe("FindReplace - Integration", function () {
        
        this.category = "integration";
        
        var LINE_FIRST_REQUIRE = 2;
        var LINE_AFTER_REQUIRES = 5;
        var CH_REQUIRE_START = 14;
        var CH_REQUIRE_PAREN = CH_REQUIRE_START + "require".length;
        
        var fooExpectedMatches = [
            {start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}},
            {start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}},
            {start: {line: 6, ch: 17}, end: {line: 6, ch: 20}},
            {start: {line: 8, ch: 8}, end: {line: 8, ch: 11}}
        ];
        var capitalFooSelections = [
            {start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}},
            {start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}},
            {start: {line: 6, ch: 17}, end: {line: 6, ch: 20}}
        ];
        var barExpectedMatches = [
            {start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}},
            {start: {line: LINE_FIRST_REQUIRE + 1, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 34}}
        ];
        

        var testWindow, twCommandManager, twEditorManager, tw$;
        var myDocument, myEditor;
        
        // Helper functions for testing cursor position / selection range
        // TODO: duplicated from EditorCommandHandlers-test
        function expectSelection(sel) {
            if (!sel.reversed) {
                sel.reversed = false;
            }
            expect(myEditor.getSelection()).toEqual(sel);
        }
        function expectHighlightedMatches(selections, expectedDOMHighlightCount) {
            var cm = myEditor._codeMirror;
            var searchState = cm._searchState;
            
            expect(searchState).toBeDefined();
            expect(searchState.marked).toBeDefined();
            expect(searchState.marked.length).toEqual(selections.length);
            
            // Verify that searchState's marked ranges match expected ranges
            if (selections) {
                selections.forEach(function (location, index) {
                    var textMarker = searchState.marked[index];
                    var markerLocation = textMarker.find();
                    expect(markerLocation.from).toEqual(location.start);
                    expect(markerLocation.to).toEqual(location.end);
                });
            }
            
            // Verify that editor UI doesn't have extra ranges left highlighted from earlier
            // (note: this only works for text that's short enough to not get virtualized)
            var lineDiv = tw$(".CodeMirror-lines .CodeMirror-code", myEditor.getRootElement());
            var actualHighlights = tw$(".CodeMirror-searching", lineDiv);
            if (expectedDOMHighlightCount === undefined) {
                expectedDOMHighlightCount = selections.length;
            }
            expect(actualHighlights.length).toEqual(expectedDOMHighlightCount);
        }
        function expectFindNextSelections(selections) {
            var i;
            for (i = 0; i < selections.length; i++) {
                expectSelection(selections[i]);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
            }

            // next find should wraparound
            expectSelection(selections[0]);
        }
        
        
        function getSearchBar() {
            return tw$(".modal-bar");
        }
        function getSearchField() {
            return tw$("#find-what");
        }
        function getReplaceField() {
            return tw$("#replace-with");
        }
        
        function expectSearchBarOpen() {
            expect(getSearchBar()[0]).toBeDefined();
        }
        function waitsForSearchBarClose() {
            waitsFor(function () {
                return getSearchBar().length === 0;
            }, "search bar closing");
        }
        function waitsForSearchBarReopen() {
            // If Find is invoked again while a previous Find bar is already up, we want to
            // wait for the old Find bar to disappear before continuing our test, so we know
            // which modal bar to look at.
            waitsFor(function () {
                return getSearchBar().length === 1;
            }, "search bar reopening");
        }
        
        function enterSearchText(str) {
            expectSearchBarOpen();
            var $input = getSearchField();
            $input.val(str);
            $input.trigger("input");
        }
        function enterReplaceText(str) {
            expectSearchBarOpen();
            var $input = getReplaceField();
            $input.val(str);
            $input.trigger("input");
        }
        
        function pressEscape() {
            expectSearchBarOpen();
            SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keydown", getSearchField()[0]);
        }
        
        function toggleCaseSensitive(val) {
            if (tw$("#find-case-sensitive").is(".active") !== val) {
                tw$("#find-case-sensitive").click();
            }
        }
        function toggleRegexp(val) {
            if (tw$("#find-regexp").is(".active") !== val) {
                tw$("#find-regexp").click();
            }
        }
        
        
        beforeFirst(function () {
            SpecRunnerUtils.createTempDirectory();

            // Create a new window that will be shared by ALL tests in this spec.
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                twCommandManager = testWindow.brackets.test.CommandManager;
                twEditorManager  = testWindow.brackets.test.EditorManager;
                tw$              = testWindow.$;

                SpecRunnerUtils.loadProjectInTestWindow(SpecRunnerUtils.getTempDirectory());
            });
        });
        
        afterLast(function () {
            testWindow       = null;
            twCommandManager = null;
            twEditorManager  = null;
            tw$              = null;
            SpecRunnerUtils.closeTestWindow();
            
            SpecRunnerUtils.removeTempDirectory();
        });

        beforeEach(function () {
            runs(function () {
                waitsForDone(twCommandManager.execute(Commands.FILE_NEW_UNTITLED));
            });
            
            runs(function () {
                myEditor = twEditorManager.getCurrentFullEditor();
                myDocument = myEditor.document;
                myDocument.replaceRange(defaultContent, {line: 0, ch: 0});
                myEditor.centerOnCursor = jasmine.createSpy("centering");
            });
        });
        
        afterEach(function () {
            runs(function () {
                // Reset search options for next test, since these are persisted and the window is shared
                // Note: tests that explicitly close the search bar before finishing will need to reset any changed options themselves
                toggleCaseSensitive(false);
                toggleRegexp(false);
                
                waitsForDone(twCommandManager.execute(Commands.FILE_CLOSE, { _forceClose: true }));
            });
            
            waitsForSearchBarClose();
            
            runs(function () {
                myEditor = null;
                myDocument = null;
            });
        });
        
        describe("Search", function () {
            it("should find all case-insensitive matches with lowercase text", function () {
                myEditor.setCursorPos(0, 0);

                twCommandManager.execute(Commands.CMD_FIND);

                enterSearchText("foo");
                expectHighlightedMatches(fooExpectedMatches);
                expectSelection(fooExpectedMatches[0]);
                expect(myEditor.centerOnCursor.calls.length).toEqual(1);

                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[1]);
                expect(myEditor.centerOnCursor.calls.length).toEqual(2);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[2]);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[3]);
                expectHighlightedMatches(fooExpectedMatches);  // no change in highlights

                // wraparound
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[0]);
                expect(myEditor.centerOnCursor.calls.length).toEqual(5);
            });
            
            it("should find all case-insensitive matches with mixed-case text", function () {
                myEditor.setCursorPos(0, 0);

                twCommandManager.execute(Commands.CMD_FIND);

                enterSearchText("Foo");
                expectHighlightedMatches(fooExpectedMatches);
                expectSelection(fooExpectedMatches[0]);
                expect(myEditor.centerOnCursor.calls.length).toEqual(1);

                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[1]);
                expect(myEditor.centerOnCursor.calls.length).toEqual(2);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[2]);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[3]);
                expectHighlightedMatches(fooExpectedMatches);  // no change in highlights

                // wraparound
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[0]);
                expect(myEditor.centerOnCursor.calls.length).toEqual(5);
            });
            
            it("should find all case-sensitive matches with mixed-case text", function () {
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                
                toggleCaseSensitive(true);
                enterSearchText("Foo");
                expectHighlightedMatches(capitalFooSelections);
                expectSelection(capitalFooSelections[0]);
                
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(capitalFooSelections[1]);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(capitalFooSelections[2]);
                // note the lowercase "foo()" is NOT matched
                
                // wraparound
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(capitalFooSelections[0]);
            });
            
            it("should have a scroll track marker for every match", function () {
                twCommandManager.execute(Commands.EDIT_FIND);

                enterSearchText("foo");
                expectHighlightedMatches(fooExpectedMatches);

                var marks = testWindow.brackets.test.ScrollTrackMarkers._getTickmarks();
                expect(marks.length).toEqual(fooExpectedMatches.length);

                marks.forEach(function (mark, index) {
                    expect(mark.line).toEqual(fooExpectedMatches[index].start.line);
                });
            });
            
            it("toggling case-sensitive option should update results immediately", function () {
                myEditor.setCursorPos(0, 0);

                twCommandManager.execute(Commands.CMD_FIND);

                enterSearchText("Foo");
                expectHighlightedMatches(fooExpectedMatches);
                expectSelection(fooExpectedMatches[0]);
                
                toggleCaseSensitive(true);
                expectHighlightedMatches(capitalFooSelections);
                expectSelection(capitalFooSelections[0]);

                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(capitalFooSelections[1]);
            });
            
            
            it("should Find Next after search bar closed, including wraparound", function () {
                runs(function () {
                    myEditor.setCursorPos(0, 0);
                    
                    twCommandManager.execute(Commands.CMD_FIND);
                    
                    enterSearchText("foo");
                    pressEscape();
                    expectHighlightedMatches([]);
                });
                
                waitsForSearchBarClose();
                
                runs(function () {
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                    expect(myEditor.centerOnCursor.calls.length).toEqual(1);
                    
                    // Simple linear Find Next
                    twCommandManager.execute(Commands.CMD_FIND_NEXT);
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}});
                    expect(myEditor.centerOnCursor.calls.length).toEqual(2);
                    twCommandManager.execute(Commands.CMD_FIND_NEXT);
                    expectSelection({start: {line: 6, ch: 17}, end: {line: 6, ch: 20}});
                    twCommandManager.execute(Commands.CMD_FIND_NEXT);
                    expectSelection({start: {line: 8, ch: 8}, end: {line: 8, ch: 11}});
                    
                    // Wrap around to first result
                    twCommandManager.execute(Commands.CMD_FIND_NEXT);
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                });
            });
            
            it("should Find Previous after search bar closed, including wraparound", function () {
                runs(function () {
                    myEditor.setCursorPos(0, 0);
                
                    twCommandManager.execute(Commands.CMD_FIND);
                    
                    enterSearchText("foo");
                    pressEscape();
                });
                
                waitsForSearchBarClose();
                
                runs(function () {
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                    
                    // Wrap around to last result
                    twCommandManager.execute(Commands.CMD_FIND_PREVIOUS);
                    expectSelection({start: {line: 8, ch: 8}, end: {line: 8, ch: 11}});
                    
                    // Simple linear Find Previous
                    twCommandManager.execute(Commands.CMD_FIND_PREVIOUS);
                    expectSelection({start: {line: 6, ch: 17}, end: {line: 6, ch: 20}});
                    twCommandManager.execute(Commands.CMD_FIND_PREVIOUS);
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}});
                    twCommandManager.execute(Commands.CMD_FIND_PREVIOUS);
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                });
            });
            
            it("should Find Next after search bar closed, relative to cursor position", function () {
                runs(function () {
                    myEditor.setCursorPos(0, 0);
                    
                    twCommandManager.execute(Commands.CMD_FIND);
                    
                    enterSearchText("foo");
                    pressEscape();
                    expectHighlightedMatches([]);
                });
                
                waitsForSearchBarClose();
                
                runs(function () {
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                    
                    twCommandManager.execute(Commands.CMD_FIND_NEXT);
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}});
                    
                    // skip forward
                    myEditor.setCursorPos(7, 0);
                    
                    twCommandManager.execute(Commands.CMD_FIND_NEXT);
                    expectSelection({start: {line: 8, ch: 8}, end: {line: 8, ch: 11}});
                    
                    // skip backward
                    myEditor.setCursorPos(LINE_FIRST_REQUIRE, 14);
                    
                    twCommandManager.execute(Commands.CMD_FIND_NEXT);
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}});
                });
            });
            
            it("should Find Next after search bar closed, remembering case sensitivity state", function () {
                runs(function () {
                    myEditor.setCursorPos(0, 0);
                    
                    twCommandManager.execute(Commands.CMD_FIND);
                    
                    toggleCaseSensitive(true);
                    enterSearchText("Foo");
                    pressEscape();
                    expectHighlightedMatches([]);
                });
                
                waitsForSearchBarClose();
                
                runs(function () {
                    expectFindNextSelections(capitalFooSelections);
                });
            });

            it("shouldn't Find Next after search bar reopened", function () {
                runs(function () {
                    myEditor.setCursorPos(0, 0);
                    
                    twCommandManager.execute(Commands.CMD_FIND);
                    
                    enterSearchText("foo");
                    pressEscape();
                });
                
                waitsForSearchBarClose();
                
                runs(function () {
                    // Open search bar a second time
                    myEditor.setCursorPos(0, 0);
                    twCommandManager.execute(Commands.CMD_FIND);
                    
                    expectSearchBarOpen();
                    expect(myEditor).toHaveCursorPosition(0, 0);
                    
                    twCommandManager.execute(Commands.CMD_FIND_NEXT);
                    expect(myEditor).toHaveCursorPosition(0, 0);
                });
            });
            
            it("should open search bar on Find Next with no previous search", function () {
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                
                expectSearchBarOpen();
                expect(myEditor).toHaveCursorPosition(0, 0);
            });
            
            it("should select-all without affecting search state if Find invoked while search bar open", function () {  // #2478
                runs(function () {
                    myEditor.setCursorPos(0, 0);
                    
                    twCommandManager.execute(Commands.CMD_FIND);
                    
                    enterSearchText("foo");  // position cursor first
                    
                    // Search for something that doesn't exist; otherwise we can't tell whether search state is cleared or bar is reopened,
                    // since reopening the bar will just prepopulate it with selected text from first search's result
                    enterSearchText("foobar");
                    
                    expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 11);  // cursor left at end of last good match ("foo")
                    
                    // Invoke Find a 2nd time - this time while search bar is open
                    twCommandManager.execute(Commands.CMD_FIND);
                });
                
                waitsForSearchBarReopen();
                
                runs(function () {
                    expectSearchBarOpen();
                    expect(getSearchField().val()).toEqual("foobar");
                    expect(getSearchField()[0].selectionStart).toBe(0);
                    expect(getSearchField()[0].selectionEnd).toBe(6);
                    expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 11);
                });
            });
            
        });
        
        
        describe("Incremental search", function () {
            it("should re-search from original position when text changes", function () {
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                
                enterSearchText("baz");
                
                var expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 34}}
                ];
                expectSelection(expectedSelections[0]);
                expectHighlightedMatches(expectedSelections);
                
                enterSearchText("bar");
                
                expectSelection(barExpectedMatches[0]);  // selection one line earlier than previous selection
                expectHighlightedMatches(barExpectedMatches);
            });
            
            it("should re-search from original position when text changes, even after Find Next", function () {
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                
                enterSearchText("foo");
                expectSelection(fooExpectedMatches[0]);
                
                // get search highlight down below where the "bar" match will be
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[2]);
                
                enterSearchText("bar");
                expectSelection(barExpectedMatches[0]);
            });
            
            it("should use empty initial query for single cursor selection", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START});
                twCommandManager.execute(Commands.EDIT_FIND);
                expect(getSearchField().val()).toEqual("");
            });
            
            it("should use empty initial query for multiple cursor selection", function () {
                myEditor.setSelections([{start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, primary: true},
                                        {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}}]);
                twCommandManager.execute(Commands.EDIT_FIND);
                expect(getSearchField().val()).toEqual("");
            });
            
            it("should get single selection as initial query", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START},
                                      {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                twCommandManager.execute(Commands.EDIT_FIND);
                expect(getSearchField().val()).toEqual("require");
            });
            
            it("should get primary selection as initial query", function () {
                myEditor.setSelections([{start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}, primary: true},
                                        {start: {line: 1, ch: 0}, end: {line: 1, ch: 1}}]);
                twCommandManager.execute(Commands.CMD_FIND);
                expect(getSearchField().val()).toEqual("require");
            });
            
            it("should extend original selection when appending to prepopulated text", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                twCommandManager.execute(Commands.CMD_FIND);
                expect(getSearchField().val()).toEqual("require");
                
                var requireExpectedMatches = [
                    {start: {line: 1, ch: 17}, end: {line: 1, ch: 24}},
                    {start: {line: LINE_FIRST_REQUIRE,     ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE,     ch: CH_REQUIRE_PAREN}},
                    {start: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_PAREN}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 2, ch: CH_REQUIRE_PAREN}}
                ];
                expectHighlightedMatches(requireExpectedMatches);
                expectSelection(requireExpectedMatches[1]);  // cursor was below 1st match, so 2nd match is selected
                
                enterSearchText("require(");
                requireExpectedMatches.shift();  // first result no longer matches
                requireExpectedMatches[0].end.ch++;  // other results now include one more char
                requireExpectedMatches[1].end.ch++;
                requireExpectedMatches[2].end.ch++;
                expectHighlightedMatches(requireExpectedMatches, 3);  // in a new file, JS isn't color coded, so there's only one span each
                expectSelection(requireExpectedMatches[0]);
            });
            
            it("should collapse selection when appending to prepopulated text causes no result", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                twCommandManager.execute(Commands.CMD_FIND);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                enterSearchText("requireX");
                expectHighlightedMatches([]);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, CH_REQUIRE_PAREN);
            });
            
            it("should clear selection, return cursor to start after backspacing to empty query", function () {
                myEditor.setCursorPos(2, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                
                enterSearchText("require");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                enterSearchText("");
                expect(myEditor).toHaveCursorPosition(2, 0);
            });
            
            it("should incremental search & highlight from Replace mode too", function () {
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_REPLACE);
                
                enterSearchText("baz");
                var expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 34}}
                ];
                expectSelection(expectedSelections[0]);
                expectHighlightedMatches(expectedSelections);
                
                enterSearchText("baz\"");
                expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 35}}
                ];
                expectSelection(expectedSelections[0]);
                expectHighlightedMatches(expectedSelections);
            });
        });
        
        
        describe("Terminating search", function () {
            it("shouldn't change selection on Escape after typing text, no Find Nexts", function () {
                runs(function () {
                    myEditor.setCursorPos(LINE_FIRST_REQUIRE, 0);
                    
                    twCommandManager.execute(Commands.CMD_FIND);
                    expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0);
                    
                    enterSearchText("require");
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                    
                    pressEscape();
                });
                
                waitsForSearchBarClose();
                
                runs(function () {
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                });
            });
            
            it("shouldn't change selection on Escape after typing text & Find Next", function () {
                runs(function () {
                    myEditor.setCursorPos(LINE_FIRST_REQUIRE, 0);
                
                    twCommandManager.execute(Commands.CMD_FIND);
                    expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0);
                    
                    enterSearchText("require");
                    expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                    
                    twCommandManager.execute(Commands.CMD_FIND_NEXT);
                    expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_PAREN}});
                    
                    pressEscape();
                });
                
                waitsForSearchBarClose();
                
                runs(function () {
                    expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_PAREN}});
                });
            });
            
            it("should no-op on Find Next with blank search", function () {
                myEditor.setCursorPos(LINE_FIRST_REQUIRE, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0);
                
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0); // no change
                
            });
        });
        
        
        describe("RegExp Search", function () {
            it("should find based on regexp", function () {
                var expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE + 1, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 34}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 34}}
                ];
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                
                toggleRegexp(true);
                toggleCaseSensitive(true);
                enterSearchText("Ba.");
                expectHighlightedMatches(expectedSelections);
                expectSelection(expectedSelections[0]);
                
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(expectedSelections[1]);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(expectedSelections[2]);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(expectedSelections[3]);
                
                // wraparound
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(expectedSelections[0]);
            });
            
             
            it("should Find Next after search bar closed, remembering last used regexp", function () {
                var expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE + 1, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 34}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 34}}
                ];

                runs(function () {
                    myEditor.setCursorPos(0, 0);
                    
                    twCommandManager.execute(Commands.CMD_FIND);
                    
                    toggleRegexp(true);
                    enterSearchText("Ba.");
                    pressEscape();
                    expectHighlightedMatches([]);
                });
                
                waitsForSearchBarClose();
                
                runs(function () {
                    expectFindNextSelections(expectedSelections);
                    
                    // explicitly clean up since we closed the search bar
                    twCommandManager.execute(Commands.CMD_FIND);
                    toggleRegexp(false);
                });
            });

            it("toggling regexp option should update results immediately", function () {
                myEditor.setCursorPos(0, 0);

                twCommandManager.execute(Commands.CMD_FIND);

                enterSearchText("t .");
                expectHighlightedMatches([]);
                expect(myEditor).toHaveCursorPosition(0, 0);
                
                toggleRegexp(true);
                var expectedSelections = [
                    {start: {line: 0, ch: 6}, end: {line: 0, ch: 9}},
                    {start: {line: 0, ch: 14}, end: {line: 0, ch: 17}}
                ];
                expectHighlightedMatches(expectedSelections);
                expectSelection(expectedSelections[0]);
            });
            
            it("should support case-sensitive regexp", function () {
                var expectedSelections = [
                    {start: {line: 8, ch: 8}, end: {line: 8, ch: 11}}
                ];
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                
                toggleRegexp(true);
                toggleCaseSensitive(true);
                enterSearchText("foo");
                expectHighlightedMatches(expectedSelections);
                expectSelection(expectedSelections[0]);
            });
            
            it("should support case-insensitive regexp", function () {
                var expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}},
                    {start: {line: 6, ch: 17}, end: {line: 6, ch: 20}},
                    {start: {line: 8, ch: 8}, end: {line: 8, ch: 11}}
                ];
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                
                toggleRegexp(true);
                toggleCaseSensitive(false);
                enterSearchText("foo");
                expectHighlightedMatches(expectedSelections);
                expectSelection(expectedSelections[0]);
            });

            it("shouldn't choke on invalid regexp", function () {
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                
                toggleRegexp(true);
                enterSearchText("+");
                expect(tw$(".modal-bar .error").length).toBe(1);
                expectHighlightedMatches([]);
                expect(myEditor).toHaveCursorPosition(0, 0); // no change
            });
            
            it("shouldn't choke on empty regexp", function () {
                myEditor.setCursorPos(0, 0);
                
                twCommandManager.execute(Commands.CMD_FIND);
                
                toggleRegexp(true);
                enterSearchText("");
                expectHighlightedMatches([]);
                expect(myEditor).toHaveCursorPosition(0, 0); // no change
            });

            it("shouldn't freeze on /.*/ regexp", function () {
                myEditor.setCursorPos(0, 0);

                twCommandManager.execute(Commands.CMD_FIND);

                toggleRegexp(true);
                enterSearchText(".*/");
                expectSelection({start: {line: 0, ch: 0}, end: {line: 0, ch: 18}});
            });
        });

        
        describe("Search -> Replace", function () {
            it("should find and replace one string", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    enterSearchText("foo");
                    
                    expectSelection(fooExpectedMatches[0]);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);
                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    
                    enterReplaceText("bar");
                    
                    tw$("#replace-yes").click();
                    expectSelection(fooExpectedMatches[1]);
                    
                    myEditor.setSelection(fooExpectedMatches[0].start, fooExpectedMatches[0].end);
                    expect(/bar/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find and skip then replace string", function () {
                runs(function () {
                    twCommandManager.execute(Commands.EDIT_REPLACE);
                    enterSearchText("foo");
                    enterReplaceText("bar");
                    
                    expectSelection(fooExpectedMatches[0]);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    // Skip first
                    expect(tw$("#find-next").is(":enabled")).toBe(true);
                    tw$("#find-next").click();
                    
                    expectSelection(fooExpectedMatches[1]);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    // Replace second
                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    tw$("#replace-yes").click();
                    
                    expectSelection(fooExpectedMatches[2]);
                    
                    myEditor.setSelection(fooExpectedMatches[0].start, fooExpectedMatches[0].end);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection(fooExpectedMatches[1].start, fooExpectedMatches[1].end);
                    expect(/bar/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });
            
            it("should use replace keyboard shortcut for single Replace while search bar open", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    enterSearchText("foo");
                    expectSelection(fooExpectedMatches[0]);
                    
                    enterReplaceText("bar");
                    
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    expectSelection(fooExpectedMatches[1]);
                    
                    myEditor.setSelection(fooExpectedMatches[0].start, fooExpectedMatches[0].end);
                    expect(/bar/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find and replace a regexp with $n substitutions", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("$2:$1");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    tw$("#replace-yes").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/Foo:modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find a regexp and replace it with $0n (leading zero)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("$02:$01");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    tw$("#replace-yes").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/Foo:modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find a regexp and replace it with $0 (literal)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("$0_:$01");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    tw$("#replace-yes").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/\$0_:modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find a regexp and replace it with $n (empty subexpression)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)(.*)\\/(\\w+)");
                    enterReplaceText("$3$2:$1");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    tw$("#replace-yes").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/Foo:modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find a regexp and replace it with $nn (n has two digits)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("()()()()()()()()()()(modules)\\/()()()(\\w+)");
                    enterReplaceText("$15:$11");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    tw$("#replace-yes").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/Foo:modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find a regexp and replace it with $$n (not a subexpression, escaped dollar)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("$$2_$$10:$2");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    tw$("#replace-yes").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/\$2_\$10:Foo/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find a regexp and replace it with $$$n (correct subexpression)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("$2$$$1");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    tw$("#replace-yes").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/Foo\$modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find a regexp and replace it with $& (whole match)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("_$&-$2$$&");

                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-yes").is(":enabled")).toBe(true);
                    tw$("#replace-yes").click();

                    myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: 23}, {line: LINE_FIRST_REQUIRE, ch: 41});
                    expect(/_modules\/Foo-Foo\$&/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });
        });

        
        describe("Search -> Replace All", function () {
            it("should find and replace all", function () {
                runs(function () {
                    var searchText  = "require",
                        replaceText = "brackets.getModule";
                    twCommandManager.execute(Commands.EDIT_REPLACE);
                    enterSearchText(searchText);
                    enterReplaceText(replaceText);

                    expectSelection({start: {line: 1, ch: 17}, end: {line: 1, ch: 17 + searchText.length}});
                    expect(myEditor.getSelectedText()).toBe(searchText);

                    expect(tw$("#replace-all").is(":enabled")).toBe(true);
                    tw$("#replace-all").click();
                    tw$(".replace-checked").click();

                    myEditor.setSelection({line: 1, ch: 17}, {line: 1, ch: 17 + replaceText.length});
                    expect(myEditor.getSelectedText()).toBe(replaceText);

                    // Note: LINE_FIRST_REQUIRE and CH_REQUIRE_START refer to first call to "require",
                    //       but not first instance of "require" in text
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START},
                                          {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START + replaceText.length});
                    expect(myEditor.getSelectedText()).toBe(replaceText);

                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START},
                                          {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START + replaceText.length});
                    expect(myEditor.getSelectedText()).toBe(replaceText);

                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 2, ch: CH_REQUIRE_START},
                                          {line: LINE_FIRST_REQUIRE + 2, ch: CH_REQUIRE_START + replaceText.length});
                    expect(myEditor.getSelectedText()).toBe(replaceText);
                });
            });

            it("should find all regexps and replace them with $n", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("$2:$1");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-all").is(":enabled")).toBe(true);
                    tw$("#replace-all").click();
                    tw$(".replace-checked").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/Foo:modules/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 1, ch: 23}, {line: LINE_FIRST_REQUIRE + 1, ch: 34});
                    expect(/Bar:modules/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 2, ch: 23}, {line: LINE_FIRST_REQUIRE + 2, ch: 34});
                    expect(/Baz:modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find all regexps and replace them with $n (empty subexpression)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)(.*)\\/(\\w+)");
                    enterReplaceText("$3$2:$1");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-all").is(":enabled")).toBe(true);
                    tw$("#replace-all").click();
                    tw$(".replace-checked").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/Foo:modules/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 1, ch: 23}, {line: LINE_FIRST_REQUIRE + 1, ch: 34});
                    expect(/Bar:modules/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 2, ch: 23}, {line: LINE_FIRST_REQUIRE + 2, ch: 34});
                    expect(/Baz:modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find all regexps and replace them with $nn (n has two digits)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("()()()()()()()()()()(modules)\\/()()()(\\w+)");
                    enterReplaceText("$15:$11");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-all").is(":enabled")).toBe(true);
                    tw$("#replace-all").click();
                    tw$(".replace-checked").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/Foo:modules/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 1, ch: 23}, {line: LINE_FIRST_REQUIRE + 1, ch: 34});
                    expect(/Bar:modules/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 2, ch: 23}, {line: LINE_FIRST_REQUIRE + 2, ch: 34});
                    expect(/Baz:modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find all regexps and replace them with $$n (not a subexpression, escaped dollar)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("$$2_$$10:$2");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-all").is(":enabled")).toBe(true);
                    tw$("#replace-all").click();
                    tw$(".replace-checked").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/\$2_\$10:Foo/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 1, ch: 23}, {line: LINE_FIRST_REQUIRE + 1, ch: 34});
                    expect(/\$2_\$10:Bar/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 2, ch: 23}, {line: LINE_FIRST_REQUIRE + 2, ch: 34});
                    expect(/\$2_\$10:Baz/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find all regexps and replace them with $$$n (correct subexpression)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("$2$$$1");
                    
                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-all").is(":enabled")).toBe(true);
                    tw$("#replace-all").click();
                    tw$(".replace-checked").click();

                    myEditor.setSelection(expectedMatch.start, expectedMatch.end);
                    expect(/Foo\$modules/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 1, ch: 23}, {line: LINE_FIRST_REQUIRE + 1, ch: 34});
                    expect(/Bar\$modules/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 2, ch: 23}, {line: LINE_FIRST_REQUIRE + 2, ch: 34});
                    expect(/Baz\$modules/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });

            it("should find all regexps and replace them with $& (whole match)", function () {
                runs(function () {
                    twCommandManager.execute(Commands.CMD_REPLACE);
                    toggleRegexp(true);
                    enterSearchText("(modules)\\/(\\w+)");
                    enterReplaceText("_$&-$2$$&");

                    var expectedMatch = {start: {line: LINE_FIRST_REQUIRE, ch: 23}, end: {line: LINE_FIRST_REQUIRE, ch: 34}};

                    expectSelection(expectedMatch);
                    expect(/foo/i.test(myEditor.getSelectedText())).toBe(true);

                    expect(tw$("#replace-all").is(":enabled")).toBe(true);
                    tw$("#replace-all").click();
                    tw$(".replace-checked").click();

                    myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: 23}, {line: LINE_FIRST_REQUIRE, ch: 41});
                    expect(/_modules\/Foo-Foo\$&/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 1, ch: 23}, {line: LINE_FIRST_REQUIRE + 1, ch: 41});
                    expect(/_modules\/Bar-Bar\$&/i.test(myEditor.getSelectedText())).toBe(true);
                    
                    myEditor.setSelection({line: LINE_FIRST_REQUIRE + 2, ch: 23}, {line: LINE_FIRST_REQUIRE + 2, ch: 41});
                    expect(/_modules\/Baz-Baz\$&/i.test(myEditor.getSelectedText())).toBe(true);
                });
            });
        });
    });


    describe("FindInFiles", function () {

        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/FindReplace-test-files"),
            CommandManager,
            DocumentManager,
            EditorManager,
            FileSystem,
            FindInFiles,
            testWindow,
            $;

        beforeFirst(function () {
            // Create a new window that will be shared by ALL tests in this spec.
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager  = testWindow.brackets.test.CommandManager;
                DocumentManager = testWindow.brackets.test.DocumentManager;
                EditorManager   = testWindow.brackets.test.EditorManager;
                FileSystem      = testWindow.brackets.test.FileSystem;
                FindInFiles     = testWindow.brackets.test.FindInFiles;
                CommandManager  = testWindow.brackets.test.CommandManager;
                $               = testWindow.$;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterLast(function () {
            CommandManager  = null;
            DocumentManager = null;
            EditorManager   = null;
            FileSystem      = null;
            FindInFiles     = null;
            $               = null;
            testWindow      = null;
            SpecRunnerUtils.closeTestWindow();
        });

        function openSearchBar(scope) {
            // Make sure search bar from previous test has animated out fully
            runs(function () {
                waitsFor(function () {
                    return $(".modal-bar").length === 0;
                }, "search bar close");
            });
            runs(function () {
                FindInFiles._doFindInFiles(scope);
            });
        }

        function executeSearch(searchString) {
            var $searchField = $(".modal-bar #find-group input");
            $searchField.val(searchString).trigger("input");
            SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $searchField[0]);
            waitsFor(function () {
                return FindInFiles._searchResults;
            }, "Find in Files done");
        }


        it("should find all occurences in project", function () {
            openSearchBar();
            runs(function () {
                executeSearch("foo");
            });

            runs(function () {
                var fileResults = FindInFiles._searchResults[testPath + "/bar.txt"];
                expect(fileResults).toBeFalsy();

                fileResults = FindInFiles._searchResults[testPath + "/foo.html"];
                expect(fileResults).toBeTruthy();
                expect(fileResults.matches.length).toBe(7);

                fileResults = FindInFiles._searchResults[testPath + "/foo.js"];
                expect(fileResults).toBeTruthy();
                expect(fileResults.matches.length).toBe(4);

                fileResults = FindInFiles._searchResults[testPath + "/css/foo.css"];
                expect(fileResults).toBeTruthy();
                expect(fileResults.matches.length).toBe(3);
            });
        });

        it("should ignore binary files", function () {
            var $dlg, actualMessage, expectedMessage,
                exists = false,
                done = false,
                imageDirPath = testPath + "/images";

            runs(function () {
                // Set project to have only images
                SpecRunnerUtils.loadProjectInTestWindow(imageDirPath);

                // Verify an image exists in folder
                var file = FileSystem.getFileForPath(testPath + "/images/icon_twitter.png");

                file.exists(function (fileError, fileExists) {
                    exists = fileExists;
                    done = true;
                });
            });

            waitsFor(function () {
                return done;
            }, "file.exists");

            runs(function () {
                expect(exists).toBe(true);
                openSearchBar();
            });

            runs(function () {
                // Launch filter editor
                $(".filter-picker button").click();

                // Dialog should state there are 0 files in project
                $dlg = $(".modal");
                expectedMessage = StringUtils.format(Strings.FILTER_FILE_COUNT_ALL, 0, Strings.FIND_IN_FILES_NO_SCOPE);
            });

            // Message loads asynchronously, but dialog should evetually state: "Allows all 0 files in project"
            waitsFor(function () {
                actualMessage   = $dlg.find(".exclusions-filecount").text();
                return (actualMessage === expectedMessage);
            }, "display file count");

            runs(function () {
                // Dismiss filter dialog
                $dlg.find(".btn.primary").click();

                // Close search bar
                var $searchField = $(".modal-bar #find-group input");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keydown", $searchField[0]);
            });

            runs(function () {
                // Set project back to main test folder
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        it("should find all occurences in folder", function () {
            var dirEntry = FileSystem.getDirectoryForPath(testPath + "/css/");
            openSearchBar(dirEntry);
            runs(function () {
                executeSearch("foo");
            });

            runs(function () {
                var fileResults = FindInFiles._searchResults[testPath + "/bar.txt"];
                expect(fileResults).toBeFalsy();

                fileResults = FindInFiles._searchResults[testPath + "/foo.html"];
                expect(fileResults).toBeFalsy();

                fileResults = FindInFiles._searchResults[testPath + "/foo.js"];
                expect(fileResults).toBeFalsy();

                fileResults = FindInFiles._searchResults[testPath + "/css/foo.css"];
                expect(fileResults).toBeTruthy();
                expect(fileResults.matches.length).toBe(3);
            });
        });

        it("should find all occurences in single file", function () {
            var fileEntry = FileSystem.getFileForPath(testPath + "/foo.js");
            openSearchBar(fileEntry);
            runs(function () {
                executeSearch("foo");
            });

            runs(function () {
                var fileResults = FindInFiles._searchResults[testPath + "/bar.txt"];
                expect(fileResults).toBeFalsy();

                fileResults = FindInFiles._searchResults[testPath + "/foo.html"];
                expect(fileResults).toBeFalsy();

                fileResults = FindInFiles._searchResults[testPath + "/foo.js"];
                expect(fileResults).toBeTruthy();
                expect(fileResults.matches.length).toBe(4);

                fileResults = FindInFiles._searchResults[testPath + "/css/foo.css"];
                expect(fileResults).toBeFalsy();
            });
        });

        it("should find start and end positions", function () {
            var filePath = testPath + "/foo.js",
                fileEntry = FileSystem.getFileForPath(filePath);

            openSearchBar(fileEntry);
            runs(function () {
                executeSearch("callFoo");
            });

            runs(function () {
                var fileResults = FindInFiles._searchResults[filePath];
                expect(fileResults).toBeTruthy();
                expect(fileResults.matches.length).toBe(1);

                var match = fileResults.matches[0];
                expect(match.start.ch).toBe(13);
                expect(match.start.line).toBe(6);
                expect(match.end.ch).toBe(20);
                expect(match.end.line).toBe(6);
            });
        });

        it("should dismiss dialog and show panel when there are results", function () {
            var filePath = testPath + "/foo.js",
                fileEntry = FileSystem.getFileForPath(filePath);

            openSearchBar(fileEntry);
            runs(function () {
                executeSearch("callFoo");
            });

            waitsFor(function () {
                return ($(".modal-bar").length === 0);
            }, "search bar close");

            runs(function () {
                var fileResults = FindInFiles._searchResults[filePath];
                expect(fileResults).toBeTruthy();
                expect($("#search-results").is(":visible")).toBeTruthy();
                expect($(".modal-bar").length).toBe(0);
            });
        });

        it("should keep dialog and not show panel when there are no results", function () {
            var filePath = testPath + "/bar.txt",
                fileEntry = FileSystem.getFileForPath(filePath);

            openSearchBar(fileEntry);
            runs(function () {
                executeSearch("abcdefghi");
            });

            waitsFor(function () {
                return (FindInFiles._searchResults);
            }, "search complete");

            runs(function () {
                var result, resultFound = false;

                // verify _searchResults Object is empty
                for (result in FindInFiles._searchResults) {
                    if (FindInFiles._searchResults.hasOwnProperty(result)) {
                        resultFound = true;
                    }
                }
                expect(resultFound).toBe(false);

                expect($("#search-results").is(":visible")).toBeFalsy();
                expect($(".modal-bar").length).toBe(1);

                // Close search bar
                var $searchField = $(".modal-bar #find-group input");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keydown", $searchField[0]);
            });
        });

        it("should open file in editor and select text when a result is clicked", function () {
            var filePath = testPath + "/foo.html",
                fileEntry = FileSystem.getFileForPath(filePath);

            openSearchBar(fileEntry);
            runs(function () {
                executeSearch("foo");
            });

            runs(function () {
                // Verify no current document
                var editor = EditorManager.getActiveEditor();
                expect(editor).toBeFalsy();

                // Get panel
                var $searchResults = $("#search-results");
                expect($searchResults.is(":visible")).toBeTruthy();

                // Get list in panel
                var $panelResults = $searchResults.find("table.bottom-panel-table tr");
                expect($panelResults.length).toBe(8);   // 7 hits + 1 file section

                // First item in list is file section
                expect($($panelResults[0]).hasClass("file-section")).toBeTruthy();

                // Click second item which is first hit
                var $firstHit = $($panelResults[1]);
                expect($firstHit.hasClass("file-section")).toBeFalsy();
                $firstHit.click();

                // Verify current document
                editor = EditorManager.getActiveEditor();
                expect(editor.document.file.fullPath).toEqual(filePath);

                // Verify selection
                expect(editor.getSelectedText().toLowerCase() === "foo");
                CommandManager.execute(Commands.FILE_CLOSE_ALL);
            });
        });

        it("should open file in working set when a result is double-clicked", function () {
            var filePath = testPath + "/foo.js",
                fileEntry = FileSystem.getFileForPath(filePath);

            openSearchBar(fileEntry);
            runs(function () {
                executeSearch("foo");
            });

            runs(function () {
                // Verify document is not yet in working set
                expect(DocumentManager.findInWorkingSet(filePath)).toBe(-1);

                // Get list in panel
                var $panelResults = $("#search-results table.bottom-panel-table tr");
                expect($panelResults.length).toBe(5);   // 4 hits + 1 file section

                // Double-click second item which is first hit
                var $firstHit = $($panelResults[1]);
                expect($firstHit.hasClass("file-section")).toBeFalsy();
                $firstHit.dblclick();

                // Verify document is now in working set
                expect(DocumentManager.findInWorkingSet(filePath)).not.toBe(-1);
                CommandManager.execute(Commands.FILE_CLOSE_ALL);
            });
        });

        it("should update results when a result in a file is edited", function () {
            var filePath = testPath + "/foo.html",
                fileEntry = FileSystem.getFileForPath(filePath),
                panelListLen = 8,   // 7 hits + 1 file section
                $panelResults;

            openSearchBar(fileEntry);
            runs(function () {
                executeSearch("foo");
            });

            runs(function () {
                // Verify document is not yet in working set
                expect(DocumentManager.findInWorkingSet(filePath)).toBe(-1);

                // Get list in panel
                $panelResults = $("#search-results table.bottom-panel-table tr");
                expect($panelResults.length).toBe(panelListLen);

                // Double-click second item which is first hit
                var $firstHit = $($panelResults[1]);
                expect($firstHit.hasClass("file-section")).toBeFalsy();
                $firstHit.dblclick();

                // Verify current document & selection
                var editor = EditorManager.getActiveEditor();
                expect(editor.document.file.fullPath).toEqual(filePath);
                expect(editor.getSelectedText().toLowerCase() === "foo");

                // Edit text to remove hit from file
                var sel = editor.getSelection();
                editor.document.replaceRange("Bar", sel.start, sel.end);
            });

            // Panel is updated asynchronously
            waitsFor(function () {
                $panelResults = $("#search-results table.bottom-panel-table tr");
                return ($panelResults.length < panelListLen);
            }, "Results panel updated");

            runs(function () {
                // Verify list automatically updated
                expect($panelResults.length).toBe(panelListLen - 1);

                CommandManager.execute(Commands.FILE_CLOSE_ALL);
            });
        });
    });
});
