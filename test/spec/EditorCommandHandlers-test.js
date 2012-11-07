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
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, $ */

define(function (require, exports, module) {
    'use strict';
    
    var Editor                = require("editor/Editor").Editor,
        EditorCommandHandlers = require("editor/EditorCommandHandlers"),
        EditorManager         = require("editor/EditorManager"),
        Commands              = require("command/Commands"),
        CommandManager        = require("command/CommandManager"),
        SpecRunnerUtils       = require("spec/SpecRunnerUtils"),
        EditorUtils           = require("editor/EditorUtils");

    describe("EditorCommandHandlers", function () {
        
        var defaultContent = "function foo() {\n" +
                             "    function bar() {\n" +
                             "        \n" +
                             "        a();\n" +
                             "        \n" +
                             "    }\n" +
                             "\n" +
                             "}";

        var myDocument, myEditor;
        
        function setupFullEditor() {
            // create dummy Document and Editor
            var mocks = SpecRunnerUtils.createMockEditor(defaultContent, "javascript");
            myDocument = mocks.doc;
            myEditor = mocks.editor;
            
            myEditor.focus();
        }
        
        function makeEditorWithRange(range) {
            // create editor with a visible range
            var mocks = SpecRunnerUtils.createMockEditor(defaultContent, "javascript", range);
            myDocument = mocks.doc;
            myEditor = mocks.editor;
            
            myEditor.focus();
        }
        
        afterEach(function () {
            SpecRunnerUtils.destroyMockEditor(myDocument);
            myEditor = null;
            myDocument = null;
        });
        
        
        // Helper functions for testing cursor position / selection range
        function expectCursorAt(pos) {
            var selection = myEditor.getSelection();
            expect(selection.start).toEqual(selection.end);
            expect(selection.start).toEqual(pos);
        }
        function expectSelection(sel) {
            expect(myEditor.getSelection()).toEqual(sel);
        }
        

        describe("Line comment/uncomment", function () {
            beforeEach(setupFullEditor);
            
            it("should comment/uncomment a single line, cursor at start", function () {
                myEditor.setCursorPos(3, 0);
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[3] = "//        a();";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 3, ch: 2});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectCursorAt({line: 3, ch: 0});
            });
            
            it("should comment/uncomment a single line, cursor at end", function () {
                myEditor.setCursorPos(3, 12);
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[3] = "//        a();";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 3, ch: 14});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectCursorAt({line: 3, ch: 12});
            });
            
            it("should comment/uncomment first line in file", function () {
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[0] = "//function foo() {";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 0, ch: 2});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectCursorAt({line: 0, ch: 0});
            });
            
            it("should comment/uncomment a single partly-selected line", function () {
                // select "function" on line 1
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 12});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 6}, end: {line: 1, ch: 14}});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 4}, end: {line: 1, ch: 12}});
            });
            
            it("should comment/uncomment a single selected line", function () {
                // selection covers all of line's text, but not \n at end
                myEditor.setSelection({line: 1, ch: 0}, {line: 1, ch: 20});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 1, ch: 22}});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 1, ch: 20}});
            });
            
            it("should comment/uncomment a single fully-selected line (including LF)", function () {
                // selection including \n at end of line
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 2, ch: 0}});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 2, ch: 0}});
            });
            
            it("should comment/uncomment multiple selected lines", function () {
                // selection including \n at end of line
                myEditor.setSelection({line: 1, ch: 0}, {line: 6, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "//        ";
                lines[3] = "//        a();";
                lines[4] = "//        ";
                lines[5] = "//    }";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 6, ch: 0}});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 6, ch: 0}});
            });
            
            it("should comment/uncomment ragged multi-line selection", function () {
                myEditor.setSelection({line: 1, ch: 6}, {line: 3, ch: 9});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "//        ";
                lines[3] = "//        a();";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 8}, end: {line: 3, ch: 11}});
                
                expect(myEditor.getSelectedText()).toEqual("nction bar() {\n//        \n//        a");
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 6}, end: {line: 3, ch: 9}});
            });
            
            it("should comment/uncomment after select all", function () {
                myEditor.setSelection({line: 0, ch: 0}, {line: 7, ch: 1});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                var expectedText = "//function foo() {\n" +
                                   "//    function bar() {\n" +
                                   "//        \n" +
                                   "//        a();\n" +
                                   "//        \n" +
                                   "//    }\n" +
                                   "//\n" +
                                   "//}";
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 0, ch: 0}, end: {line: 7, ch: 3}});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 0, ch: 0}, end: {line: 7, ch: 1}});
            });
            
            it("should comment/uncomment lines that were partially commented out already, our style", function () {
                // Start with line 3 commented out, with "//" at column 0
                var lines = defaultContent.split("\n");
                lines[3] = "//        a();";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);
                
                // select lines 1-3
                myEditor.setSelection({line: 1, ch: 0}, {line: 4, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "//        ";
                lines[3] = "////        a();";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 4, ch: 0}});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(startingContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 4, ch: 0}});
            });
            
            it("should comment/uncomment lines that were partially commented out already, comment closer to code", function () {
                // Start with line 3 commented out, with "//" snug against the code
                var lines = defaultContent.split("\n");
                lines[3] = "        //a();";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);
                
                // select lines 1-3
                myEditor.setSelection({line: 1, ch: 0}, {line: 4, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "//        ";
                lines[3] = "//        //a();";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 4, ch: 0}});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(startingContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 4, ch: 0}});
            });
            
            it("should uncomment indented, aligned comments", function () {
                // Start with lines 1-5 commented out, with "//" all aligned at column 4
                var lines = defaultContent.split("\n");
                lines[1] = "    //function bar() {";
                lines[2] = "    //    ";
                lines[3] = "    //    a();";
                lines[4] = "    //    ";
                lines[5] = "    //}";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);
                
                // select lines 1-5
                myEditor.setSelection({line: 1, ch: 0}, {line: 6, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 6, ch: 0}});
            });
            
            it("should uncomment ragged partial comments", function () {
                // Start with lines 1-5 commented out, with "//" snug up against each non-blank line's code
                var lines = defaultContent.split("\n");
                lines[1] = "    //function bar() {";
                lines[2] = "        ";
                lines[3] = "        //a();";
                lines[4] = "        ";
                lines[5] = "    //}";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);
                
                // select lines 1-5
                myEditor.setSelection({line: 1, ch: 0}, {line: 6, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 6, ch: 0}});
            });
            
        });
        
        
        describe("Duplicate", function () {
            beforeEach(setupFullEditor);

            it("should duplicate whole line if no selection", function () {
                // place cursor in middle of line 1
                myEditor.setCursorPos(1, 10);
                
                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(1, 0, "    function bar() {");
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 2, ch: 10});
            });

            it("should duplicate line + \n if selected line is at end of file", function () {
                var lines = defaultContent.split("\n"),
                    len = lines.length;

                // place cursor at the beginning of the last line
                myEditor.setCursorPos(len - 1, 0);

                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);

                lines.push("}");
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: len, ch: 0});
            });
            
            it("should duplicate first line", function () {
                // place cursor at start of line 0
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(0, 0, "function foo() {");
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: 0});
            });
            
            it("should duplicate empty line", function () {
                // place cursor on line 6
                myEditor.setCursorPos(6, 0);
                
                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(6, 0, "");
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 7, ch: 0});
            });
            
            it("should duplicate selection within a line", function () {
                // select "bar" on line 1
                myEditor.setSelection({line: 1, ch: 13}, {line: 1, ch: 16});
                
                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[1] = "    function barbar() {";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 16}, end: {line: 1, ch: 19}});
            });
            
            it("should duplicate when entire line selected, excluding newline", function () {
                // select all of line 1, EXcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 1, ch: 20});
                
                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);
                
                var lines = defaultContent.split("\n");
                lines[1] = "    function bar() {    function bar() {";
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 20}, end: {line: 1, ch: 40}});
            });
            it("should duplicate when entire line selected, including newline", function () {
                // select all of line 1, INcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});
                
                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(1, 0, "    function bar() {");
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 0}, end: {line: 3, ch: 0}});
            });
            
            it("should duplicate when multiple lines selected", function () {
                // select lines 1-3
                myEditor.setSelection({line: 1, ch: 0}, {line: 4, ch: 0});
                
                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(1, 0, "    function bar() {",
                                   "        ",
                                   "        a();");
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 4, ch: 0}, end: {line: 7, ch: 0}});
            });
            
            it("should duplicate selection crossing line boundary", function () {
                // select from middle of line 1 to middle of line 3
                myEditor.setSelection({line: 1, ch: 13}, {line: 3, ch: 11});
                
                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(1, 3, "    function bar() {",
                                   "        ",
                                   "        a()bar() {",
                                   "        ",
                                   "        a();");
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 3, ch: 11}, end: {line: 5, ch: 11}});
            });
            
            it("should duplicate after select all", function () {
                myEditor.setSelection({line: 0, ch: 0}, {line: 7, ch: 1});
                
                CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);
                
                var expectedText = defaultContent + defaultContent;
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 7, ch: 1}, end: {line: 14, ch: 1}});
            });
        });
        
        
        describe("Move Lines Up/Down", function () {
            beforeEach(setupFullEditor);
            
            it("should move whole line up if no selection", function () {
                // place cursor in middle of line 1
                myEditor.setCursorPos(1, 10);
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[0];
                lines[0] = lines[1];
                lines[1] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 0, ch: 10});
            });
            
            it("should move whole line down if no selection", function () {
                // place cursor in middle of line 1
                myEditor.setCursorPos(1, 10);
                
                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[2];
                lines[2] = lines[1];
                lines[1] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 2, ch: 10});
            });
            
            it("shouldn't move up first line", function () {
                // place cursor at start of line 0
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectCursorAt({line: 0, ch: 0});
            });

            it("shouldn't move down last line", function () {
                var lines = defaultContent.split("\n"),
                    len = lines.length;

                // place cursor at the beginning of the last line
                myEditor.setCursorPos(len - 1, 0);

                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: len - 1, ch: 0});
            });
            
            it("should move up empty line", function () {
                // place cursor on line 6
                myEditor.setCursorPos(6, 0);
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[5];
                lines[5] = lines[6];
                lines[6] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 5, ch: 0});
            });
            
            it("should move down empty line", function () {
                // place cursor on line 6
                myEditor.setCursorPos(6, 0);
                
                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[7];
                lines[7] = lines[6];
                lines[6] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 7, ch: 0});
            });
            
            it("should move up when entire line selected, excluding newline", function () {
                // select all of line 1, EXcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 1, ch: 20});
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[0];
                lines[0] = lines[1];
                lines[1] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 0, ch: 0}, end: {line: 0, ch: 20}});
            });
            
            it("should move down when entire line selected, excluding newline", function () {
                // select all of line 1, EXcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 1, ch: 20});
                
                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[2];
                lines[2] = lines[1];
                lines[1] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 0}, end: {line: 2, ch: 20}});
            });
            
            it("should move up when entire line selected, including newline", function () {
                // select all of line 1, INcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[0];
                lines[0] = lines[1];
                lines[1] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 0, ch: 0}, end: {line: 1, ch: 0}});
            });
            
            it("should move down when entire line selected, including newline", function () {
                // select all of line 1, INcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[2];
                lines[2] = lines[1];
                lines[1] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 0}, end: {line: 3, ch: 0}});
            });
            
            it("should move up when multiple lines selected", function () {
                // select lines 2-3
                myEditor.setSelection({line: 2, ch: 0}, {line: 4, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[1];
                lines[1] = lines[2];
                lines[2] = lines[3];
                lines[3] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 3, ch: 0}});
            });
            
            it("should move down when multiple lines selected", function () {
                // select lines 2-3
                myEditor.setSelection({line: 2, ch: 0}, {line: 4, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[4];
                lines[4] = lines[3];
                lines[3] = lines[2];
                lines[2] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 3, ch: 0}, end: {line: 5, ch: 0}});
            });
            
            it("should move up selection crossing line boundary", function () {
                // select from middle of line 2 to middle of line 3
                myEditor.setSelection({line: 2, ch: 8}, {line: 3, ch: 11});
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[1];
                lines[1] = lines[2];
                lines[2] = lines[3];
                lines[3] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 8}, end: {line: 2, ch: 11}});
            });
            
            it("should move down selection crossing line boundary", function () {
                // select from middle of line 2 to middle of line 3
                myEditor.setSelection({line: 2, ch: 8}, {line: 3, ch: 11});
                
                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[4];
                lines[4] = lines[3];
                lines[3] = lines[2];
                lines[2] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 3, ch: 8}, end: {line: 4, ch: 11}});
            });
            
            it("should move the last line up", function () {
                // place cursor in last line
                myEditor.setCursorPos(7, 0);
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[6];
                lines[6] = lines[7];
                lines[7] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 6, ch: 0});
            });
            
            it("should move the first line down", function () {
                // place cursor in first line
                myEditor.setCursorPos(0, 0);
                
                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[1];
                lines[1] = lines[0];
                lines[0] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: 0});
            });
            
            it("should move the last lines up", function () {
                // select lines 6-7
                myEditor.setSelection({line: 6, ch: 0}, {line: 7, ch: 1});
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[5];
                lines[5] = lines[6];
                lines[6] = lines[7];
                lines[7] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 5, ch: 0}, end: {line: 6, ch: 1}});
            });
            
            it("should move the first lines down", function () {
                // select lines 0-1
                myEditor.setSelection({line: 0, ch: 0}, {line: 2, ch: 0});
                
                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                var lines = defaultContent.split("\n");
                var temp = lines[2];
                lines[2] = lines[1];
                lines[1] = lines[0];
                lines[0] = temp;
                var expectedText = lines.join("\n");
                
                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 3, ch: 0}});
            });
            
            it("shouldn't move up after select all", function () {
                myEditor.setSelection({line: 0, ch: 0}, {line: 7, ch: 1});
                
                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 0, ch: 0}, end: {line: 7, ch: 1}});
            });
            
            it("shouldn't move down after select all", function () {
                myEditor.setSelection({line: 0, ch: 0}, {line: 7, ch: 1});
                
                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);
                
                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 0, ch: 0}, end: {line: 7, ch: 1}});
            });
        });
        
        
        describe("Delete Line", function () {
            beforeEach(setupFullEditor);
            
            it("should delete the first line when selection is an IP in that line", function () {
                myEditor.setSelection({line: 0, ch: 5}, {line: 0, ch: 5});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var expectedText = defaultContent.split("\n").slice(1).join("\n");
                expect(myDocument.getText()).toEqual(expectedText);
            });
            
            it("should delete the first line when selection is a range in that line", function () {
                myEditor.setSelection({line: 0, ch: 5}, {line: 0, ch: 8});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var expectedText = defaultContent.split("\n").slice(1).join("\n");
                expect(myDocument.getText()).toEqual(expectedText);
            });
            
            it("should delete a middle line when selection is an IP in that line", function () {
                myEditor.setSelection({line: 2, ch: 5}, {line: 2, ch: 5});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(2, 1);
                expect(myDocument.getText()).toEqual(lines.join("\n"));
            });
            
            it("should delete a middle line when selection is a range in that line", function () {
                myEditor.setSelection({line: 2, ch: 5}, {line: 2, ch: 8});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(2, 1);
                expect(myDocument.getText()).toEqual(lines.join("\n"));
            });
            
            it("should delete the last line when selection is an IP in that line", function () {
                myEditor.setSelection({line: 7, ch: 0}, {line: 7, ch: 0});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var expectedText = defaultContent.split("\n").slice(0, 7).join("\n");
                expect(myDocument.getText()).toEqual(expectedText);
            });
            
            it("should delete the last line when selection is a range in that line", function () {
                myEditor.setSelection({line: 7, ch: 0}, {line: 7, ch: 1});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var expectedText = defaultContent.split("\n").slice(0, 7).join("\n");
                expect(myDocument.getText()).toEqual(expectedText);
            });
            
            it("should delete multiple lines starting at the top when selection spans them", function () {
                myEditor.setSelection({line: 0, ch: 5}, {line: 2, ch: 4});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var expectedText = defaultContent.split("\n").slice(3).join("\n");
                expect(myDocument.getText()).toEqual(expectedText);
            });

            it("should delete multiple lines ending at the bottom when selection spans them", function () {
                myEditor.setSelection({line: 5, ch: 5}, {line: 7, ch: 0});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var expectedText = defaultContent.split("\n").slice(0, 5).join("\n");
                expect(myDocument.getText()).toEqual(expectedText);
            });
            
            it("should leave empty text when all lines are selected", function () {
                myEditor.setSelection({line: 0, ch: 4}, {line: 7, ch: 1});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                expect(myDocument.getText()).toEqual("");
            });
        });
        
        describe("Delete Line - editor with visible range", function () {

            it("should delete the top line of the visible range", function () {
                makeEditorWithRange({startLine: 1, endLine: 5});
                myEditor.setSelection({line: 1, ch: 5}, {line: 1, ch: 5});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(1, 1);
                expect(myDocument.getText()).toEqual(lines.join("\n"));
                expect(myEditor._visibleRange.startLine).toNotBe(null);
                expect(myEditor._visibleRange.endLine).toNotBe(null);
            });

            it("should delete the bottom line of the visible range", function () {
                makeEditorWithRange({startLine: 1, endLine: 5});
                myEditor.setSelection({line: 5, ch: 2}, {line: 5, ch: 2});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(5, 1);
                expect(myDocument.getText()).toEqual(lines.join("\n"));
                expect(myEditor._visibleRange.startLine).toNotBe(null);
                expect(myEditor._visibleRange.endLine).toNotBe(null);
            });
            
            it("should leave a single newline when all visible lines are selected", function () {
                makeEditorWithRange({startLine: 1, endLine: 5});
                myEditor.setSelection({line: 1, ch: 5}, {line: 5, ch: 2});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(1, 5, "");
                expect(myDocument.getText()).toEqual(lines.join("\n"));
                expect(myEditor._visibleRange.startLine).toNotBe(null);
                expect(myEditor._visibleRange.endLine).toNotBe(null);
            });
            
            it("should leave a single newline when only one line is visible", function () {
                makeEditorWithRange({startLine: 3, endLine: 3});
                myEditor.setSelection({line: 3, ch: 4}, {line: 3, ch: 4});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                
                var lines = defaultContent.split("\n");
                lines.splice(3, 1, "");
                expect(myDocument.getText()).toEqual(lines.join("\n"));
                expect(myEditor._visibleRange.startLine).toNotBe(null);
                expect(myEditor._visibleRange.endLine).toNotBe(null);
            });
        });
        
        
        describe("Select Line", function () {
            beforeEach(setupFullEditor);
            
            it("should select the first line with IP in that line", function () {
                myEditor.setSelection({line: 0, ch: 5}, {line: 0, ch: 5});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 0, ch: 0}, end: {line: 1, ch: 0}});
            });
            
            it("should select the last line with IP in that line", function () {
                myEditor.setSelection({line: 7, ch: 0}, {line: 7, ch: 0});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 7, ch: 0}, end: {line: 7, ch: 1}});
            });
            
            it("should select all in one-line file", function () {
                myDocument.setText("// x");
                myEditor.setSelection({line: 0, ch: 0}, {line: 0, ch: 0});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 0, ch: 0}, end: {line: 0, ch: 4}});
            });
            
            it("should extend selection to whole line", function () {
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 8});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 1, ch: 0}, end: {line: 2, ch: 0}});
            });
            
            it("should extend whole line selection to next line", function () {
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 1, ch: 0}, end: {line: 3, ch: 0}});
            });
            
            it("should extend multi-line selection to full lines", function () {
                myEditor.setSelection({line: 1, ch: 4}, {line: 3, ch: 9});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 1, ch: 0}, end: {line: 4, ch: 0}});
            });
            
            it("should extend full multi-line selection to one more line", function () {
                myEditor.setSelection({line: 1, ch: 0}, {line: 4, ch: 0});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 1, ch: 0}, end: {line: 5, ch: 0}});
            });
            
        });
        
        describe("Select Line - editor with visible range", function () {

            it("shouldn't select past end of visible range, IP in middle of last visible line", function () {
                makeEditorWithRange({startLine: 1, endLine: 5});
                myEditor.setSelection({line: 5, ch: 4}, {line: 5, ch: 4});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 5, ch: 0}, end: {line: 5, ch: 5}});
            });
            
            it("shouldn't select past end of visible range, IP at start of last visible line", function () {
                makeEditorWithRange({startLine: 1, endLine: 5});
                myEditor.setSelection({line: 5, ch: 0}, {line: 5, ch: 0});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 5, ch: 0}, end: {line: 5, ch: 5}});
            });
            
            it("should extend selection to include last line of visible range", function () {
                makeEditorWithRange({startLine: 1, endLine: 5});
                myEditor.setSelection({line: 4, ch: 4}, {line: 4, ch: 4});
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);
                
                expectSelection({start: {line: 4, ch: 0}, end: {line: 5, ch: 0}});
            });
        });
        
    });
});
