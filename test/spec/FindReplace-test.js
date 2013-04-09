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
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, window, $, jasmine */
/*unittests: FindReplace*/

define(function (require, exports, module) {
    'use strict';
    
    var Editor                = require("editor/Editor").Editor,
        FindReplace           = require("search/FindReplace"),
        Commands              = require("command/Commands"),
        CommandManager        = require("command/CommandManager"),
        KeyEvent              = require("utils/KeyEvent"),
        SpecRunnerUtils       = require("spec/SpecRunnerUtils");

    describe("FindReplace", function () {
        
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
        var barExpectedMatches = [
            {start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}},
            {start: {line: LINE_FIRST_REQUIRE + 1, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 34}}
        ];
        

        var myDocument, myEditor, $myToolbar;
        
        function setupFullEditor() {
            // create dummy Document and Editor
            var mocks = SpecRunnerUtils.createMockEditor(defaultContent, "javascript");
            myDocument = mocks.doc;
            myEditor = mocks.editor;
            myEditor.centerOnCursor = jasmine.createSpy("centering");
            
            myEditor.focus();
        }
        
        beforeEach(function () {
            // Dummy version of anchor that ModalBar inserts itself relative to. Must exist in DOM somewhere.
            $myToolbar = $("<div id='editor-holder'/>").appendTo(window.document.body);
        });
        
        afterEach(function () {
            SpecRunnerUtils.destroyMockEditor(myDocument);
            $myToolbar.remove();
            $myToolbar = null;
            myEditor = null;
            myDocument = null;
        });
        
        
        // Helper functions for testing cursor position / selection range
        // TODO: duplicated from EditorCommandHandlers-test
        function expectSelection(sel) {
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
            var lineDiv = $(".CodeMirror-lines > div").children()[2];
            var actualHighlights = $(".CodeMirror-searching", lineDiv);
            if (expectedDOMHighlightCount === undefined) {
                expectedDOMHighlightCount = selections.length;
            }
            expect(actualHighlights.length).toEqual(expectedDOMHighlightCount);
        }
        
        
        function getSearchBar() {
            return $(".modal-bar");
        }
        function getSearchField() {
            return $(".modal-bar input[type='text']");
        }
        
        function expectSearchBarOpen() {
            expect(getSearchBar()[0]).toBeDefined();
        }
        function expectSearchBarClosed() {
            expect(getSearchBar()[0]).not.toBeDefined();
        }
        
        function enterSearchText(str) {
            expectSearchBarOpen();
            var $input = getSearchField();
            $input.val(str);
            $input.trigger("input");
        }
        
        function pressEnter() {
            expectSearchBarOpen();
            SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", getSearchField()[0]);
        }
        function pressEscape() {
            expectSearchBarOpen();
            SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keydown", getSearchField()[0]);
        }
        

        
        describe("Search", function () {
            beforeEach(setupFullEditor);
            
            it("should find all case-insensitive matches", function () {
                myEditor.setCursorPos(0, 0);

                CommandManager.execute(Commands.EDIT_FIND);

                enterSearchText("foo");
                expectHighlightedMatches(fooExpectedMatches);
                expectSelection(fooExpectedMatches[0]);
                expect(myEditor.centerOnCursor.calls.length).toEqual(1);

                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(fooExpectedMatches[1]);
                expect(myEditor.centerOnCursor.calls.length).toEqual(2);
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(fooExpectedMatches[2]);
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(fooExpectedMatches[3]);
                expectHighlightedMatches(fooExpectedMatches);  // no change in highlights

                // wraparound
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(fooExpectedMatches[0]);
                expect(myEditor.centerOnCursor.calls.length).toEqual(5);
            });
            
            it("should find all case-sensitive matches", function () {
                var expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}},
                    {start: {line: 6, ch: 17}, end: {line: 6, ch: 20}}
                ];
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("Foo");
                expectHighlightedMatches(expectedSelections);
                expectSelection(expectedSelections[0]);
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(expectedSelections[1]);
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(expectedSelections[2]);
                // note the lowercase "foo()" is NOT matched
                
                // wraparound
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(expectedSelections[0]);
            });
            
            it("should Find Next after search bar closed, including wraparound", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("foo");
                pressEnter();
                expectHighlightedMatches([]);
                expectSearchBarClosed();
                
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                expect(myEditor.centerOnCursor.calls.length).toEqual(1);
                
                // Simple linear Find Next
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}});
                expect(myEditor.centerOnCursor.calls.length).toEqual(2);
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: 6, ch: 17}, end: {line: 6, ch: 20}});
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: 8, ch: 8}, end: {line: 8, ch: 11}});
                
                // Wrap around to first result
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
            });
            
            it("should Find Previous after search bar closed, including wraparound", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("foo");
                pressEnter();
                expectSearchBarClosed();
                
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                
                // Wrap around to last result
                CommandManager.execute(Commands.EDIT_FIND_PREVIOUS);
                expectSelection({start: {line: 8, ch: 8}, end: {line: 8, ch: 11}});
                
                // Simple linear Find Previous
                CommandManager.execute(Commands.EDIT_FIND_PREVIOUS);
                expectSelection({start: {line: 6, ch: 17}, end: {line: 6, ch: 20}});
                CommandManager.execute(Commands.EDIT_FIND_PREVIOUS);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}});
                CommandManager.execute(Commands.EDIT_FIND_PREVIOUS);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
            });
            
            it("shouldn't Find Next after search bar reopened", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("foo");
                pressEnter();
                expectSearchBarClosed();
                
                // Open search bar a second time
                myEditor.setCursorPos(0, 0);
                CommandManager.execute(Commands.EDIT_FIND);
                
                expectSearchBarOpen();
                expect(myEditor).toHaveCursorPosition(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expect(myEditor).toHaveCursorPosition(0, 0);
            });
            
            it("should open search bar on Find Next with no previous search", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                
                expectSearchBarOpen();
                expect(myEditor).toHaveCursorPosition(0, 0);
            });
            
            it("should select-all without affecting search state if Find invoked while search bar open", function () {  // #2478
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("foo");  // position cursor first
                
                // Search for something that doesn't exist; otherwise we can't tell whether search state is cleared or bar is reopened,
                // since reopening the bar will just prepopulate it with selected text from first search's result
                enterSearchText("foobar");
                
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 11);  // cursor left at end of last good match ("foo")
                
                // Invoke Find a 2nd time - this time while search bar is open
                CommandManager.execute(Commands.EDIT_FIND);
                
                expectSearchBarOpen();
                expect(getSearchField().val()).toEqual("foobar");
                expect(getSearchField()[0].selectionStart).toBe(0);
                expect(getSearchField()[0].selectionEnd).toBe(6);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 11);
            });
            
        });
        
        
        describe("Incremental search", function () {
            beforeEach(setupFullEditor);
            
            it("should re-search from original position when text changes", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
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
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("foo");
                expectSelection(fooExpectedMatches[0]);
                
                // get search highlight down below where the "bar" match will be
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(fooExpectedMatches[2]);
                
                enterSearchText("bar");
                expectSelection(barExpectedMatches[0]);
            });
            
            it("should extend original selection when appending to prepopulated text", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                CommandManager.execute(Commands.EDIT_FIND);
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
                expectHighlightedMatches(requireExpectedMatches, 6);  // expect 2x DOM highlights because each match spans 2 tokens
                expectSelection(requireExpectedMatches[0]);
            });
            
            it("should collapse selection when appending to prepopulated text causes no result", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                CommandManager.execute(Commands.EDIT_FIND);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                enterSearchText("requireX");
                expectHighlightedMatches([]);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, CH_REQUIRE_PAREN);
            });
            
            it("should clear selection, return cursor to start after backspacing to empty query", function () {
                myEditor.setCursorPos(2, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("require");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                enterSearchText("");
                expect(myEditor).toHaveCursorPosition(2, 0);
            });
        });
        
        
        describe("Terminating search", function () {
            beforeEach(setupFullEditor);
            
            it("should go to next on Enter with prepopulated text & no Find Nexts", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                CommandManager.execute(Commands.EDIT_FIND);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                pressEnter();
                
                expectSearchBarClosed();
                expectHighlightedMatches([]);
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_PAREN}});
            });
            
            it("shouldn't change selection on Esc with prepopulated text & no Find Nexts", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                CommandManager.execute(Commands.EDIT_FIND);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                pressEscape();
                
                expectSearchBarClosed();
                expectHighlightedMatches([]);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
            });
            
            it("shouldn't change selection on Enter with prepopulated text & after Find Next", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                CommandManager.execute(Commands.EDIT_FIND);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_PAREN}});
                
                pressEnter();
                
                expectSearchBarClosed();
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_PAREN}});
            });
            
            it("shouldn't change selection on Enter after typing text, no Find Nexts", function () {
                myEditor.setCursorPos(LINE_FIRST_REQUIRE, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0);
                
                enterSearchText("require");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                pressEnter();
                
                expectSearchBarClosed();
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
            });
            
            it("shouldn't change selection on Enter after typing text & Find Next", function () {
                myEditor.setCursorPos(LINE_FIRST_REQUIRE, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0);
                
                enterSearchText("require");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_PAREN}});
                
                pressEnter();
                
                expectSearchBarClosed();
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_PAREN}});
            });
            
            it("should no-op on Find Next with blank search", function () {
                myEditor.setCursorPos(LINE_FIRST_REQUIRE, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0);
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0); // no change
                
            });
            
            it("should no-op on Enter with blank search", function () {
                myEditor.setCursorPos(LINE_FIRST_REQUIRE, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0);

                pressEnter();
                
                expectSearchBarClosed();
                expect(myEditor).toHaveCursorPosition(LINE_FIRST_REQUIRE, 0); // no change
            });
        });
        
        
        describe("RegExp Search", function () {
            beforeEach(setupFullEditor);
            
            it("should find based on regexp", function () {
                var expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE + 1, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 34}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 34}}
                ];
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("/Ba./");
                expectHighlightedMatches(expectedSelections);
                expectSelection(expectedSelections[0]);
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(expectedSelections[1]);
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(expectedSelections[2]);
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(expectedSelections[3]);
                
                // wraparound
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection(expectedSelections[0]);
            });
            
            it("should be a case-sensitive regexp by default", function () {
                var expectedSelections = [
                    {start: {line: 8, ch: 8}, end: {line: 8, ch: 11}}
                ];
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("/foo/");
                expectHighlightedMatches(expectedSelections);
                expectSelection(expectedSelections[0]);
            });
            
            it("should support case-insensitive regexps via /.../i", function () {
                var expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}},
                    {start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}},
                    {start: {line: 6, ch: 17}, end: {line: 6, ch: 20}},
                    {start: {line: 8, ch: 8}, end: {line: 8, ch: 11}}
                ];
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("/foo/i");
                expectHighlightedMatches(expectedSelections);
                expectSelection(expectedSelections[0]);
            });
            
            it("shouldn't choke on partial regexp", function () {
                var expectedSelections = [
                    {start: {line: LINE_FIRST_REQUIRE + 1, ch: 30}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 33}},
                    {start: {line: LINE_FIRST_REQUIRE + 2, ch: 30}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 33}}
                ];
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                // This should be interpreted as a non-RegExp search, which actually does have a result thanks to "modules/Bar"
                enterSearchText("/Ba");
                expectHighlightedMatches(expectedSelections);
                expectSelection(expectedSelections[0]);
            });
            
            it("shouldn't choke on invalid regexp", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                // This is interpreted as a regexp (has both "/"es) but is invalid; should show error message
                enterSearchText("/+/");
                expect($(".modal-bar .error").length).toBe(1);
                expectHighlightedMatches([]);
                expect(myEditor).toHaveCursorPosition(0, 0); // no change
            });
            
            it("shouldn't choke on empty regexp", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("//");
                expectHighlightedMatches([]);
                expect(myEditor).toHaveCursorPosition(0, 0); // no change
            });

            it("shouldn't freeze on /.*/ regexp", function () {
                myEditor.setCursorPos(0, 0);

                CommandManager.execute(Commands.EDIT_FIND);

                enterSearchText("/.*/");
                pressEnter();
                expectSelection({start: {line: 0, ch: 0}, end: {line: 0, ch: 18}});
            });
        });
    });
    
});
