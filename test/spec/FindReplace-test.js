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
/*global define, describe, it, expect, beforeFirst, afterLast, beforeEach, afterEach, waits, waitsFor, waitsForDone, runs, window, jasmine, spyOn */
/*unittests: FindReplace*/

define(function (require, exports, module) {
    'use strict';
    
    var Commands              = require("command/Commands"),
        FindReplace           = require("search/FindReplace"),
        KeyEvent              = require("utils/KeyEvent"),
        SpecRunnerUtils       = require("spec/SpecRunnerUtils"),
        FileSystem            = require("filesystem/FileSystem"),
        FileSystemError       = require("filesystem/FileSystemError"),
        FileUtils             = require("file/FileUtils"),
        Async                 = require("utils/Async"),
        Strings               = require("strings"),
        _                     = require("thirdparty/lodash");

    var promisify = Async.promisify; // for convenience
    
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
            }, 1000, "search bar closing");
        }
        function waitsForSearchBarReopen() {
            // If Find is invoked again while a previous Find bar is already up, we want to
            // wait for the old Find bar to disappear before continuing our test, so we know
            // which modal bar to look at.
            waitsFor(function () {
                return getSearchBar().length === 1;
            }, 1000, "search bar reopening");
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
                enterSearchText("f.o");
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
                enterSearchText("f.o");
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
            function expectTextAtPositions(text, posArray) {
                posArray.forEach(function (pos) {
                    expect(myEditor.document.getRange(pos, {line: pos.line, ch: pos.ch + text.length})).toEqual(text);
                });
            }
            function dontExpectTextAtPositions(text, posArray) {
                posArray.forEach(function (pos) {
                    expect(myEditor.document.getRange(pos, {line: pos.line, ch: pos.ch + text.length})).not.toEqual(text);
                });
            }
            
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

                    // Note: LINE_FIRST_REQUIRE and CH_REQUIRE_START refer to first call to "require",
                    //       but not first instance of "require" in text
                    expectTextAtPositions(replaceText, [
                        {line: 1, ch: 17},
                        {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START},
                        {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START},
                        {line: LINE_FIRST_REQUIRE + 2, ch: CH_REQUIRE_START}
                    ]);
                });
            });
            
            it("should not replace unchecked items", function () {
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
                    
                    // verify that all items are checked by default
                    var $checked = tw$(".check-one:checked");
                    expect($checked.length).toBe(4);
                    
                    // uncheck second and fourth
                    $checked.eq(1).click();
                    $checked.eq(3).click();
                    expect(tw$(".check-one:checked").length).toBe(2);
                    
                    tw$(".replace-checked").click();

                    myEditor.setSelection({line: 1, ch: 17}, {line: 1, ch: 17 + replaceText.length});
                    expect(myEditor.getSelectedText()).toBe(replaceText);

                    expectTextAtPositions(replaceText, [
                        {line: 1, ch: 17},
                        {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}
                    ]);
                    dontExpectTextAtPositions(replaceText, [
                        {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START},
                        {line: LINE_FIRST_REQUIRE + 2, ch: CH_REQUIRE_START}
                    ]);
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

        var defaultSourcePath = SpecRunnerUtils.getTestPath("/spec/FindReplace-test-files"),
            testPath,
            nextFolderIndex = 1,
            CommandManager,
            DocumentManager,
            EditorManager,
            FileSystem,
            File,
            FindInFiles,
            ProjectManager,
            testWindow,
            $;
        
        beforeFirst(function () {
            SpecRunnerUtils.createTempDirectory();

            // Create a new window that will be shared by ALL tests in this spec.
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager  = testWindow.brackets.test.CommandManager;
                DocumentManager = testWindow.brackets.test.DocumentManager;
                EditorManager   = testWindow.brackets.test.EditorManager;
                FileSystem      = testWindow.brackets.test.FileSystem;
                File            = testWindow.brackets.test.File;
                FindInFiles     = testWindow.brackets.test.FindInFiles;
                ProjectManager  = testWindow.brackets.test.ProjectManager;
                $               = testWindow.$;
            });
        });
        
        afterLast(function () {
            CommandManager  = null;
            DocumentManager = null;
            EditorManager   = null;
            FileSystem      = null;
            File            = null;
            FindInFiles     = null;
            ProjectManager  = null;
            $               = null;
            testWindow      = null;
            SpecRunnerUtils.closeTestWindow();
            SpecRunnerUtils.removeTempDirectory();
        });
        
        function openProject(sourcePath) {
            testPath = defaultSourcePath;
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
        }
        
        function waitForSearchBarClose() {
            // Make sure search bar from previous test has animated out fully
            waitsFor(function () {
                return $(".modal-bar").length === 0;
            }, "search bar close");
        }

        function openSearchBar(scope, showReplace) {
            waitForSearchBarClose();
            runs(function () {
                FindInFiles._doFindInFiles(scope, showReplace);
            });
        }
        
        function closeSearchBar() {
            runs(function () {
                FindInFiles._closeFindBar();
            });
            waitForSearchBarClose();
        }

        function executeSearch(searchString) {
            runs(function () {
                var $searchField = $("#find-what");
                $searchField.val(searchString).trigger("input");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $searchField[0]);
            });
            waitsFor(function () {
                return FindInFiles._searchResults;
            }, "Find in Files done");
        }

        describe("Find", function () {
            beforeEach(function () {
                openProject(defaultSourcePath);
            });
            
            it("should find all occurences in project", function () {
                openSearchBar();
                executeSearch("foo");

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

            it("should find all occurences in folder", function () {
                var dirEntry = FileSystem.getDirectoryForPath(testPath + "/css/");
                openSearchBar(dirEntry);
                executeSearch("foo");

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
                executeSearch("foo");

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
                executeSearch("callFoo");

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
                executeSearch("callFoo");

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
                executeSearch("abcdefghi");

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
                executeSearch("foo");

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
                    waitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL), "closing all files");
                });
            });

            it("should open file in working set when a result is double-clicked", function () {
                var filePath = testPath + "/foo.js",
                    fileEntry = FileSystem.getFileForPath(filePath);

                openSearchBar(fileEntry);
                executeSearch("foo");

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
                    waitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL), "closing all files");
                });
            });

            it("should update results when a result in a file is edited", function () {
                var filePath = testPath + "/foo.html",
                    fileEntry = FileSystem.getFileForPath(filePath),
                    panelListLen = 8,   // 7 hits + 1 file section
                    $panelResults;

                openSearchBar(fileEntry);
                executeSearch("foo");

                runs(function () {
                    // Verify document is not yet in working set
                    expect(DocumentManager.findInWorkingSet(filePath)).toBe(-1);

                    // Get list in panel
                    $panelResults = $("#search-results table.bottom-panel-table tr");
                    expect($panelResults.length).toBe(panelListLen);

                    // Click second item which is first hit
                    var $firstHit = $($panelResults[1]);
                    expect($firstHit.hasClass("file-section")).toBeFalsy();
                    $firstHit.click();
                });

                // Wait for file to open if not already open
                waitsFor(function () {
                    var editor = EditorManager.getActiveEditor();
                    return (editor.document.file.fullPath === filePath);
                }, 1000, "file open");

                // Wait for selection to change (this happens asynchronously after file opens)
                waitsFor(function () {
                    var editor = EditorManager.getActiveEditor(),
                        sel = editor.getSelection();
                    return (sel.start.line === 4 && sel.start.ch === 7);
                }, 1000, "selection change");

                runs(function () {
                    // Verify current selection
                    var editor = EditorManager.getActiveEditor();
                    expect(editor.getSelectedText().toLowerCase()).toBe("foo");

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

                    waitsForDone(CommandManager.execute(Commands.FILE_CLOSE, { _forceClose: true }), "closing file");
                });
            });
        });
        
        describe("Replace", function () {
            var searchResults;
            
            /**
             * Helper function that calls the given asynchronous processor once on each file in the given subtree
             * and returns a promise that's resolved when all files are processed.
             * @param {string} rootPath The root of the subtree to search.
             * @param {function(string, string): $.Promise} processor The function that processes each file. Args are:
             *      contents: the contents of the file
             *      fullPath: the full path to the file on disk
             * @return {$.Promise} A promise that is resolved when all files are processed, or rejected if there was
             *      an error reading one of the files or one of the process steps was rejected.
             */
            function visitAndProcessFiles(rootPath, processor) {
                var rootEntry = FileSystem.getDirectoryForPath(rootPath),
                    files = [];
                
                function visitor(file) {
                    if (!file.isDirectory) {
                        files.push(file);
                    }
                    return true;
                }
                return promisify(rootEntry, "visit", visitor).then(function () {
                    return Async.doInParallel(files, function (file) {
                        return promisify(file, "read").then(function (contents) {
                            return processor(contents, file.fullPath);
                        });
                    });
                });
            }
            
            function ensureParentExists(file) {
                var parentDir = FileSystem.getDirectoryForPath(file.parentPath);
                return promisify(parentDir, "exists").then(function (exists) {
                    if (!exists) {
                        return promisify(parentDir, "create");
                    }
                    return null;
                });
            }
            
            function copyWithLineEndings(src, dest, lineEndings) {
                function copyOneFileWithLineEndings(contents, srcPath) {
                    var destPath = dest + srcPath.slice(src.length),
                        destFile = FileSystem.getFileForPath(destPath),
                        newContents = FileUtils.translateLineEndings(contents, lineEndings);
                    return ensureParentExists(destFile).then(function () {
                        return promisify(destFile, "write", newContents);
                    });
                }
                
                return promisify(FileSystem.getDirectoryForPath(dest), "create").then(function () {
                    return visitAndProcessFiles(src, copyOneFileWithLineEndings);
                });
            }
            
            function openTestProjectCopy(sourcePath, lineEndings) {
                // Create a clean copy of the test project before each test. We don't delete the old
                // folders as we go along (to avoid problems with deleting the project out from under the
                // open test window); we just delete the whole temp folder at the end.
                testPath = SpecRunnerUtils.getTempDirectory() + "/find-in-files-test-" + (nextFolderIndex++);
                runs(function () {
                    if (lineEndings) {
                        waitsForDone(copyWithLineEndings(sourcePath, testPath, lineEndings), "copy test files with line endings");
                    } else {
                        waitsForDone(SpecRunnerUtils.copy(sourcePath, testPath), "copy test files");
                    }
                });
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            }
            
            function expectProjectToMatchKnownGood(kgFolder, lineEndings) {
                runs(function () {
                    var testRootPath = ProjectManager.getProjectRoot().fullPath,
                        kgRootPath = SpecRunnerUtils.getTestPath("/spec/FindReplace-known-goods/" + kgFolder + "/");
                    function compareKnownGoodToTestFile(kgContents, kgFilePath) {
                        var testFilePath = testRootPath + kgFilePath.slice(kgRootPath.length);
                        return promisify(FileSystem.getFileForPath(testFilePath), "read").then(function (testContents) {
                            if (lineEndings) {
                                kgContents = FileUtils.translateLineEndings(kgContents, lineEndings);
                            }
                            expect(testContents).toEqual(kgContents);
                        });
                    }
                    
                    waitsForDone(visitAndProcessFiles(kgRootPath, compareKnownGoodToTestFile), "project comparison done");
                });
            }
            
            function numMatches(results) {
                return _.reduce(_.pluck(results, "matches"), function (sum, matches) {
                    return sum + matches.length;
                }, 0);
            }
            
            function doSearch(options) {
                runs(function () {
                    FindInFiles.doSearchInScope(options.queryInfo, null, null).done(function (results) {
                        searchResults = results;
                    });
                });
                waitsFor(function () { return searchResults; }, 1000, "search completed");
                runs(function () {
                    expect(numMatches(searchResults)).toBe(options.numMatches);
                });
            }
            
            function doReplace(options) {
                return FindInFiles.doReplace(searchResults, options.replaceText, {
                    forceFilesOpen: options.forceFilesOpen,
                    isRegexp: options.queryInfo.isRegexp
                });
            }
            
            // Does a standard test for files on disk: search, replace, and check that files on disk match.
            function doBasicTest(options) {
                doSearch(options);
                
                runs(function () {
                    waitsForDone(doReplace(options), "finish replacement");
                });
                expectProjectToMatchKnownGood(options.knownGoodFolder, options.lineEndings);
            }
            
            // Like doBasicTest, but expects some files to have specific errors.
            function doTestWithErrors(options) {
                var done = false;
                
                doSearch(options);
                
                if (options.test) {
                    // The test function *must* contain one or more runs blocks.
                    options.test();
                }
                
                runs(function () {
                    doReplace(options)
                        .then(function () {
                            expect("should fail due to error").toBe(true);
                            done = true;
                        }, function (errors) {
                            expect(errors).toEqual(options.errors);
                            done = true;
                        });
                });
                waitsFor(function () { return done; }, 1000, "finish replacement");
                expectProjectToMatchKnownGood(options.knownGoodFolder, options.lineEndings);
            }
            
            function expectInMemoryFiles(options) {
                runs(function () {
                    waitsForDone(Async.doInParallel(options.inMemoryFiles, function (filePath) {
                        // Check that the document open in memory was changed and matches the expected replaced version of that file.
                        var doc = DocumentManager.getOpenDocumentForPath(testPath + filePath);
                        expect(doc).toBeTruthy();
                        expect(doc.isDirty).toBe(true);

                        var kgPath = SpecRunnerUtils.getTestPath("/spec/FindReplace-known-goods/" + options.inMemoryKGFolder + filePath),
                            kgFile = FileSystem.getFileForPath(kgPath);
                        return promisify(kgFile, "read").then(function (contents) {
                            expect(doc.getText()).toEqual(contents);
                        });
                    }), "check in memory file contents");
                });
            }
            
            // Like doBasicTest, but expects one or more files to be open in memory and the replacements to happen there.
            function doInMemoryTest(options) {
                // Like the basic test, we expect everything on disk to match the kgFolder (which means the file open in memory
                // should *not* have changed on disk yet).
                doBasicTest(options);
                expectInMemoryFiles(options);
            }
            
            beforeEach(function () {
                searchResults = null;
            });
            
            afterEach(function () {
                runs(function () {
                    waitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL, { _forceClose: true }), "close all files");
                });
            });

            it("should replace all instances of a simple string in a project on disk case-insensitively", function () {
                openTestProjectCopy(defaultSourcePath);
                doBasicTest({
                    queryInfo:       {query: "foo"},
                    numMatches:      14,
                    replaceText:     "bar",
                    knownGoodFolder: "simple-case-insensitive"
                });
            });

            it("should replace all instances of a simple string in a project on disk case-sensitively", function () {
                openTestProjectCopy(defaultSourcePath);
                doBasicTest({
                    queryInfo:       {query: "foo", isCaseSensitive: true},
                    numMatches:      9,
                    replaceText:     "bar",
                    knownGoodFolder: "simple-case-sensitive"
                });
            });
            
            it("should replace all instances of a regexp in a project on disk case-insensitively with a simple replace string", function () {
                openTestProjectCopy(defaultSourcePath);
                doBasicTest({
                    queryInfo:       {query: "\\b[a-z]{3}\\b", isRegexp: true},
                    numMatches:      33,
                    replaceText:     "CHANGED",
                    knownGoodFolder: "regexp-case-insensitive"
                });
            });
            
            it("should replace all instances of a regexp in a project on disk case-sensitively with a simple replace string", function () {
                openTestProjectCopy(defaultSourcePath);
                doBasicTest({
                    queryInfo:       {query: "\\b[a-z]{3}\\b", isRegexp: true, isCaseSensitive: true},
                    numMatches:      25,
                    replaceText:     "CHANGED",
                    knownGoodFolder: "regexp-case-sensitive"
                });
            });
            
            it("should replace instances of a regexp with a $-substitution on disk", function () {
                openTestProjectCopy(defaultSourcePath);
                doBasicTest({
                    queryInfo:       {query: "\\b([a-z]{3})\\b", isRegexp: true},
                    numMatches:      33,
                    replaceText:     "[$1]",
                    knownGoodFolder: "regexp-dollar-replace"
                });
            });
            
            it("should replace instances of a regexp with a $-substitution in in-memory files", function () {
                // This test case is necessary because the in-memory case goes through a separate code path before it deals with
                // the replace text.
                openTestProjectCopy(defaultSourcePath);

                doInMemoryTest({
                    queryInfo:       {query: "\\b([a-z]{3})\\b", isRegexp: true},
                    numMatches:      33,
                    replaceText:     "[$1]",
                    knownGoodFolder:   "unchanged",
                    forceFilesOpen:    true,
                    inMemoryFiles:     ["/css/foo.css", "/foo.html", "/foo.js"],
                    inMemoryKGFolder:  "regexp-dollar-replace"
                });
            });

            it("should replace instances of a string in a project respecting CRLF line endings", function () {
                openTestProjectCopy(defaultSourcePath, FileUtils.LINE_ENDINGS_CRLF);
                doBasicTest({
                    queryInfo:       {query: "foo"},
                    numMatches:      14,
                    replaceText:     "bar",
                    knownGoodFolder: "simple-case-insensitive",
                    lineEndings:     FileUtils.LINE_ENDINGS_CRLF
                });
            });

            it("should replace instances of a string in a project respecting LF line endings", function () {
                openTestProjectCopy(defaultSourcePath, FileUtils.LINE_ENDINGS_LF);
                doBasicTest({
                    queryInfo:       {query: "foo"},
                    numMatches:      14,
                    replaceText:     "bar",
                    knownGoodFolder: "simple-case-insensitive",
                    lineEndings:     FileUtils.LINE_ENDINGS_LF
                });
            });
            
            it("should not do the replacement in files that have changed on disk since the results list was last updated", function () {
                openTestProjectCopy(defaultSourcePath);
                doTestWithErrors({
                    queryInfo:       {query: "foo"},
                    numMatches:      14,
                    replaceText:     "bar",
                    knownGoodFolder: "changed-file",
                    test: function () {
                        // Wait for one second to make sure that the changed file gets an updated timestamp.
                        // TODO: this seems like a FileSystem issue - we don't get timestamp changes with a resolution
                        // of less than one second.
                        waits(1000);
                        
                        runs(function () {
                            // Clone the results so we don't use the version that's auto-updated by FindInFiles when we modify the file
                            // on disk. This case might not usually come up in the real UI if we always guarantee that the results list will 
                            // be auto-updated, but we want to make sure there's no edge case where we missed an update and still clobber the
                            // file on disk anyway.
                            searchResults = _.cloneDeep(searchResults);
                            waitsForDone(promisify(FileSystem.getFileForPath(testPath + "/css/foo.css"), "write", "/* changed content */"), "modify file");
                        });
                    },
                    errors:          [{item: testPath + "/css/foo.css", error: FindInFiles.ERROR_FILE_CHANGED}]
                });
            });
            
            it("should return an error if a write fails", function () {
                openTestProjectCopy(defaultSourcePath);
                
                // Return a fake error when we try to write to the CSS file. (Note that this is spying on the test window's File module.)
                var writeSpy = spyOn(File.prototype, "write").andCallFake(function (data, options, callback) {
                    if (typeof options === "function") {
                        callback = options;
                    } else {
                        callback = callback || function () {};
                    }
                    if (this.fullPath === testPath + "/css/foo.css") {
                        callback(FileSystemError.NOT_WRITABLE);
                    } else {
                        return writeSpy.originalValue.apply(this, arguments);
                    }
                });
                
                doTestWithErrors({
                    queryInfo:       {query: "foo"},
                    numMatches:      14,
                    replaceText:     "bar",
                    knownGoodFolder: "simple-case-insensitive-except-foo.css",
                    errors:          [{item: testPath + "/css/foo.css", error: FileSystemError.NOT_WRITABLE}]
                });
            });
            
            it("should do the replacement in memory for a file open in an Editor in the working set", function () {
                openTestProjectCopy(defaultSourcePath);
                
                runs(function () {
                    waitsForDone(CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: testPath + "/css/foo.css"}), "add file to working set");
                });
                
                doInMemoryTest({
                    queryInfo:        {query: "foo"},
                    numMatches:       14,
                    replaceText:      "bar",
                    knownGoodFolder:  "simple-case-insensitive-except-foo.css",
                    inMemoryFiles:    ["/css/foo.css"],
                    inMemoryKGFolder: "simple-case-insensitive"
                });
            });
            
            it("should do the replacement in memory for a file open in an Editor that's not in the working set", function () {
                openTestProjectCopy(defaultSourcePath);
                
                runs(function () {
                    waitsForDone(CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/css/foo.css"}), "open file");
                });
                
                doInMemoryTest({
                    queryInfo:        {query: "foo"},
                    numMatches:       14,
                    replaceText:      "bar",
                    knownGoodFolder:  "simple-case-insensitive-except-foo.css",
                    inMemoryFiles:    ["/css/foo.css"],
                    inMemoryKGFolder: "simple-case-insensitive"
                });
            });
            
            it("should open the document in an editor and do the replacement there if the document is open but not in an Editor", function () {
                var doc, openFilePath;
                openTestProjectCopy(defaultSourcePath);

                runs(function () {
                    openFilePath = testPath + "/css/foo.css";
                    waitsForDone(DocumentManager.getDocumentForPath(openFilePath).done(function (d) {
                        doc = d;
                        doc.addRef();
                    }), "get document");
                });
                    
                doInMemoryTest({
                    queryInfo:        {query: "foo"},
                    numMatches:       14,
                    replaceText:      "bar",
                    knownGoodFolder:  "simple-case-insensitive-except-foo.css",
                    inMemoryFiles:    ["/css/foo.css"],
                    inMemoryKGFolder: "simple-case-insensitive"
                });
                
                runs(function () {
                    var workingSet = DocumentManager.getWorkingSet();
                    expect(workingSet.some(function (file) { return file.fullPath === openFilePath; })).toBe(true);
                    doc.releaseRef();
                });
            });
            
            it("should open files and do all replacements in memory if forceFilesOpen is true", function () {
                openTestProjectCopy(defaultSourcePath);

                doInMemoryTest({
                    queryInfo:         {query: "foo"},
                    numMatches:        14,
                    replaceText:       "bar",
                    knownGoodFolder:   "unchanged",
                    forceFilesOpen:    true,
                    inMemoryFiles:     ["/css/foo.css", "/foo.html", "/foo.js"],
                    inMemoryKGFolder:  "simple-case-insensitive"
                });
            });
            
            // TODO: More things to test headlessly:
            // subtree search
            // single file search
            // filters
            // subset of matches
            // file changing on disk between search and replace when results are properly auto-updated
            // file changing in memory between search and replace (when results are/aren't auto-updated?)
            
            describe("from Find Bar", function () {
                function executeReplace(findText, replaceText) {
                    runs(function () {
                        FindInFiles._replaceDone = false;
                        $("#find-what").val(findText).trigger("input");
                        $("#replace-with").val(replaceText).trigger("input");
                        $("#replace-all").click();
                    });
                }
                
                it("should only show a Replace All button", function () {
                    openTestProjectCopy(defaultSourcePath);
                    openSearchBar(null, true);
                    runs(function () {
                        expect($("#replace-yes").length).toBe(0);
                        expect($("#replace-all").length).toBe(1);
                    });
                    closeSearchBar();
                });
                
                it("should do a simple search/replace all from find bar, opening results in memory, if the user didn't do a Find first", function () {
                    openTestProjectCopy(defaultSourcePath);
                    openSearchBar(null, true);
                    executeReplace("foo", "bar");
                    waitsFor(function () {
                        return FindInFiles._replaceDone;
                    }, "replace finished");
                    expectInMemoryFiles({
                        inMemoryFiles: ["/css/foo.css", "/foo.html", "/foo.js"],
                        inMemoryKGFolder: "simple-case-insensitive"
                    });
                });
                
                it("should warn about doing changes on disk if there are changes in >10 files", function () {
                    openTestProjectCopy(SpecRunnerUtils.getTestPath("/spec/FindReplace-test-files-large"));
                    openSearchBar(null, true);
                    executeReplace("foo", "bar");
                    runs(function () {
                        expect(FindInFiles._replaceDone).toBeFalsy();
                    });
                    
                    var $okButton;
                    waitsFor(function () {
                        $okButton = $(".dialog-button[data-button-id='ok']");
                        return !!$okButton.length;
                    }, "dialog appearing");
                    runs(function () {
                        expect($okButton.length).toBe(1);
                        expect($okButton.text()).toBe(Strings.BUTTON_REPLACE_WITHOUT_UNDO);
                        $okButton.click();
                    });
                    
                    waitsFor(function () {
                        return FindInFiles._replaceDone;
                    }, "replace finished");
                    expectProjectToMatchKnownGood("simple-case-insensitive-large");
                });
                
                it("should not do changes on disk if Cancel is clicked", function () {
                    spyOn(FindInFiles, "doReplace").andCallThrough();
                    openTestProjectCopy(SpecRunnerUtils.getTestPath("/spec/FindReplace-test-files-large"));
                    openSearchBar(null, true);
                    executeReplace("foo", "bar");
                    runs(function () {
                        expect(FindInFiles._replaceDone).toBeFalsy();
                    });
                    
                    var $cancelButton;
                    waitsFor(function () {
                        $cancelButton = $(".dialog-button[data-button-id='cancel']");
                        return !!$cancelButton.length;
                    });
                    runs(function () {
                        expect($cancelButton.length).toBe(1);
                        $cancelButton.click();
                    });
                    
                    waitsFor(function () {
                        return $(".dialog-button[data-button-id='cancel']").length === 0;
                    }, "dialog dismissed");
                    runs(function () {
                        expect(FindInFiles.doReplace).not.toHaveBeenCalled();
                    });
                });
                
                // TODO: more tests:
                // if user does Find first
            });
        });
    });
});
