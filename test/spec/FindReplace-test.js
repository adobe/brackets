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
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, window, $ */

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
        

        var myDocument, myEditor, $myToolbar;
        
        function setupFullEditor() {
            // create dummy Document and Editor
            var mocks = SpecRunnerUtils.createMockEditor(defaultContent, "javascript");
            myDocument = mocks.doc;
            myEditor = mocks.editor;
            
            myEditor.focus();
        }
        
        beforeEach(function () {
            $myToolbar = $("<div id='main-toolbar'/>").appendTo(window.document.body);
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
        function expectCursorAt(pos) {
            var selection = myEditor.getSelection();
            expect(selection.start).toEqual(selection.end);
            expect(selection.start).toEqual(pos);
        }
        function expectSelection(sel) {
            expect(myEditor.getSelection()).toEqual(sel);
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
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}});
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: 6, ch: 17}, end: {line: 6, ch: 20}});
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: 8, ch: 8}, end: {line: 8, ch: 11}});
                
                // wraparound
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
            });
            
            it("should find all case-sensitive matches", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("Foo");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}});
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: 6, ch: 17}, end: {line: 6, ch: 20}});
                // note the lowercase "foo()" is NOT matched
                
                // wraparound
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
            });
            
            it("should Find Next after search bar closed, including wraparound", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("foo");
                pressEnter();
                expectSearchBarClosed();
                
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                
                // Simple linear Find Next
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}});
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
                expectCursorAt({line: 0, ch: 0});
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectCursorAt({line: 0, ch: 0});
            });
            
            it("should open search bar on Find Next with no previous search", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                
                expectSearchBarOpen();
                expectCursorAt({line: 0, ch: 0});
            });
            
        });
        
        
        describe("Incremental search", function () {
            beforeEach(setupFullEditor);
            
            it("should re-search from original position when text changes", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("baz");
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 2, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 11}});
                
                enterSearchText("bar");
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}});
            });
            
            it("should re-search from original position when text changes, even after Find Next", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("foo");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
                
                // get search highlight down below where the "bar" match will be
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: 6, ch: 17}, end: {line: 6, ch: 20}});
                
                enterSearchText("bar");
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}});
            });
            
            it("should extend original selection when appending to prepopulated text", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                CommandManager.execute(Commands.EDIT_FIND);
                expect(getSearchField().val()).toEqual("require");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                enterSearchText("require(");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN + 1}});
            });
            
            it("should clear selection when appending to prepopulated text causes no result", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                CommandManager.execute(Commands.EDIT_FIND);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                enterSearchText("requireX");
                expectCursorAt({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
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
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE + 1, ch: CH_REQUIRE_PAREN}});
            });
            
            it("shouldn't change selection on Esc with prepopulated text & no Find Nexts", function () {
                myEditor.setSelection({line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN});
                
                CommandManager.execute(Commands.EDIT_FIND);
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                pressEscape();
                
                expectSearchBarClosed();
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
                expectCursorAt({line: LINE_FIRST_REQUIRE, ch: 0});
                
                enterSearchText("require");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
                
                pressEnter();
                
                expectSearchBarClosed();
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_START}, end: {line: LINE_FIRST_REQUIRE, ch: CH_REQUIRE_PAREN}});
            });
            
            it("shouldn't change selection on Enter after typing text & Find Next", function () {
                myEditor.setCursorPos(LINE_FIRST_REQUIRE, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                expectCursorAt({line: LINE_FIRST_REQUIRE, ch: 0});
                
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
                expectCursorAt({line: LINE_FIRST_REQUIRE, ch: 0});
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectCursorAt({line: LINE_FIRST_REQUIRE, ch: 0}); // no change
                
            });
            
            it("should no-op on Enter with blank search", function () {
                myEditor.setCursorPos(LINE_FIRST_REQUIRE, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                expectCursorAt({line: LINE_FIRST_REQUIRE, ch: 0});

                pressEnter();
                
                expectSearchBarClosed();
                expectCursorAt({line: LINE_FIRST_REQUIRE, ch: 0}); // no change
            });
        });
        
        
        describe("RegExp Search", function () {
            beforeEach(setupFullEditor);
            
            it("should find based on regexp", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("/Ba./");
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}});
                
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 34}});
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 2, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 11}});
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 2, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 2, ch: 34}});
                
                // wraparound
                CommandManager.execute(Commands.EDIT_FIND_NEXT);
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}});
            });
            
            it("should be a case-sensitive regexp by default", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("/foo/");
                expectSelection({start: {line: 8, ch: 8}, end: {line: 8, ch: 11}});
            });
            
            it("should support case-insensitive regexps via /.../i", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("/foo/i");
                expectSelection({start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}});
            });
            
            it("shouldn't choke on partial regexp", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                // This should be interpreted as a non-RegExp search, which actually does have a result thanks to "modules/Bar"
                enterSearchText("/Ba");
                expectSelection({start: {line: LINE_FIRST_REQUIRE + 1, ch: 30}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 33}});
            });
            
            it("shouldn't choke on invalid regexp", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                // This is interpreted as a regexp (has both "/"es) but is invalid; should show error message
                enterSearchText("/+/");
                expect($(".modal-bar .error").length).toBe(1);
                expectCursorAt({line: 0, ch: 0}); // no change
            });
            
            it("shouldn't choke on empty regexp", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_FIND);
                
                enterSearchText("//");
                expectCursorAt({line: 0, ch: 0}); // no change
            });
        });
    });
    
});