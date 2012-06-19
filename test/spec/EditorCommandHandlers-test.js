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
    
    var Editor                = require("editor/Editor"),
        EditorCommandHandlers = require("editor/EditorCommandHandlers"),
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
        beforeEach(function () {
            // create dummy Document for the Editor
            myDocument = SpecRunnerUtils.createMockDocument(defaultContent);
            
            // create Editor instance (containing a CodeMirror instance)
            $("body").append("<div id='editor'/>");
            myEditor = new Editor(myDocument, true, "javascript", $("#editor").get(0), {});
            
            // Must be focused so editor commands target it
            myEditor.focus();
        });

        afterEach(function () {
            myEditor.destroy();
            myEditor = null;
            $("#editor").remove();
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
        
        
    });
});
