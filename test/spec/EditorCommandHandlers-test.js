/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, expect, beforeEach, afterEach, runs, waitsForDone, beforeFirst, afterLast */

define(function (require, exports, module) {
    'use strict';

    var EditorManager   = require("editor/EditorManager"),
        Commands        = require("command/Commands"),
        CommandManager  = require("command/CommandManager"),
        LanguageManager = require("language/LanguageManager"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        _               = require("thirdparty/lodash");

    require("editor/EditorCommandHandlers");

    describe("EditorCommandHandlers", function () {

        var defaultContent = "function foo() {\n" +
                             "    function bar() {\n" +
                             "        \n" +
                             "        a();\n" +
                             "        \n" +
                             "    }\n" +
                             "\n" +
                             "}";

        var tabbedContent =    "function funcWithTabs() {\n" +
                               "	var i		= 0;\n" +
                               "	var	offset	= 0;\n" +
                               "}";

        var myDocument, myEditor;

        var testPath = SpecRunnerUtils.getTestPath("/spec/EditorCommandHandlers-test-files"),
            testWindow;

        function setupFullEditor(content, languageId) {
            content = content || defaultContent;
            languageId = languageId || "javascript";

            // create dummy Document and Editor
            var mocks = SpecRunnerUtils.createMockEditor(content, languageId);
            myDocument = mocks.doc;
            myEditor = mocks.editor;

            myEditor.focus();
        }

        function makeEditorWithRange(range, content) {
            content = content || defaultContent;

            // create editor with a visible range
            var mocks = SpecRunnerUtils.createMockEditor(content, "javascript", range);
            myDocument = mocks.doc;
            myEditor = mocks.editor;

            myEditor.focus();
        }

        afterEach(function () {
            if (myDocument) {
                SpecRunnerUtils.destroyMockEditor(myDocument);
                myEditor = null;
                myDocument = null;
            }
        });


        // Helper functions for testing cursor position / selection range
        function expectCursorAt(pos) {
            var selection = myEditor.getSelection();
            expect(selection.start).toEqual(selection.end);
            expect(selection.start).toEqual(pos);
        }
        function expectSelection(sel) {
            if (!sel.reversed) {
                sel.reversed = false;
            }
            expect(myEditor.getSelection()).toEqual(sel);
        }
        function expectSelections(sels) {
            expect(myEditor.getSelections()).toEqual(sels);
        }
        function contentWithDeletedLines(lineNums) {
            var lines = defaultContent.split("\n");
            _.forEachRight(lineNums, function (num) {
                lines.splice(num, 1);
            });
            return lines.join("\n");
        }

        // Helper function for creating a test window
        function createTestWindow(spec) {
            SpecRunnerUtils.createTestWindowAndRun(spec, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                EditorManager       = testWindow.brackets.test.EditorManager;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        }

        // Helper function to open a new inline editor
        function openInlineEditor(spec) {
            var promise;

            runs(function () {
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: testPath + "/test.html"});
                waitsForDone(promise, "Open into working set");
            });

            runs(function () {
                // Open inline editor onto test.css's ".testClass" rule
                promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 8, ch: 11});
                waitsForDone(promise, "Open inline editor");
            });

            runs(function () {
                myEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editor;
            });
        }

        // Helper function for closing open files in the test window
        function closeFilesInTestWindow() {
            runs(function () {
                var promise = CommandManager.execute(Commands.FILE_CLOSE_ALL);
                waitsForDone(promise, "Close all open files in working set");

                // Close the save dialog without saving the changes
                var $dlg = testWindow.$(".modal.instance");
                if ($dlg.length) {
                    SpecRunnerUtils.clickDialogButton("dontsave");
                }
                $dlg = null;
            });
        }

        // Helper function for closing the test window
        function closeTestWindow() {
            testWindow      = null;
            CommandManager  = null;
            Commands        = null;
            EditorManager   = null;
            SpecRunnerUtils.closeTestWindow();
        }

        /**
         * Invokes Toggle Line or Block Comment, expects the given selection/cursor & document text, invokes
         * it a 2nd time, and then expects the original selection/cursor & document text again.
         * @param {!string} expectedCommentedText
         * @param {!{ch:number,line:number}|{start:{ch:number,line:number},end:{ch:number,line:number}}} expectedCommentedSel
         * @param {?string} expectedSelText If provided, the text that should be selected after the first comment operation.
         * @param {!string} type Either "block" or "line".
         */
        function testToggleComment(expectedCommentedText, expectedCommentedSel, expectedSelText, type) {
            var command = (type === "block" ? Commands.EDIT_BLOCK_COMMENT : Commands.EDIT_LINE_COMMENT);

            function expectSel(sel) {
                if (Array.isArray(sel)) {
                    expectSelections(sel);
                } else if (sel.start) {
                    expectSelection(sel);
                } else {
                    expectCursorAt(sel);
                }
            }

            var startingContent = myDocument.getText();
            var startingSel = myEditor.getSelections();

            // Toggle comment on
            CommandManager.execute(command, myEditor);
            expect(myDocument.getText()).toEqual(expectedCommentedText);
            expectSel(expectedCommentedSel);
            if (expectedSelText) {
                expect(myEditor.getSelectedText()).toEqual(expectedSelText);
            }

            runs(function () {
                CommandManager.execute(command, myEditor);
                expect(myDocument.getText()).toEqual(startingContent);
                expectSel(startingSel);
            });
        }

        function testToggleLine(expectedCommentedText, expectedCommentedSel, expectedSelText) {
            testToggleComment(expectedCommentedText, expectedCommentedSel, expectedSelText, "line");
        }

        function testToggleBlock(expectedCommentedText, expectedCommentedSel, expectedSelText) {
            testToggleComment(expectedCommentedText, expectedCommentedSel, expectedSelText, "block");
        }

        describe("Line comment/uncomment", function () {
            beforeEach(setupFullEditor);

            it("should comment/uncomment a single line, cursor at start", function () {
                myEditor.setCursorPos(3, 0);

                var lines = defaultContent.split("\n");
                lines[3] = "//        a();";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {line: 3, ch: 2});
            });

            it("should comment/uncomment a single line, cursor at end", function () {
                myEditor.setCursorPos(3, 12);

                var lines = defaultContent.split("\n");
                lines[3] = "//        a();";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {line: 3, ch: 14});
            });

            it("should comment/uncomment first line in file", function () {
                myEditor.setCursorPos(0, 0);

                var lines = defaultContent.split("\n");
                lines[0] = "//function foo() {";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {line: 0, ch: 2});
            });

            it("should comment/uncomment a single partly-selected line", function () {
                // select "function" on line 1
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 12});

                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {start: {line: 1, ch: 6}, end: {line: 1, ch: 14}});
            });

            it("should comment/uncomment a single selected line", function () {
                // selection covers all of line's text, but not \n at end
                myEditor.setSelection({line: 1, ch: 0}, {line: 1, ch: 20});

                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {start: {line: 1, ch: 0}, end: {line: 1, ch: 22}});
            });

            it("should comment/uncomment a single fully-selected line (including LF)", function () {
                // selection including \n at end of line
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});

                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {start: {line: 1, ch: 0}, end: {line: 2, ch: 0}});
            });

            it("should comment/uncomment multiple selected lines", function () {
                // selection including \n at end of line
                myEditor.setSelection({line: 1, ch: 0}, {line: 6, ch: 0});

                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "//        ";
                lines[3] = "//        a();";
                lines[4] = "//        ";
                lines[5] = "//    }";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {start: {line: 1, ch: 0}, end: {line: 6, ch: 0}});
            });

            it("should comment/uncomment ragged multi-line selection", function () {
                myEditor.setSelection({line: 1, ch: 6}, {line: 3, ch: 9});

                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "//        ";
                lines[3] = "//        a();";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {start: {line: 1, ch: 8}, end: {line: 3, ch: 11}}, "nction bar() {\n//        \n//        a");
            });

            it("should comment/uncomment when selection starts & ends on whitespace lines", function () {
                myEditor.setSelection({line: 2, ch: 0}, {line: 4, ch: 8});

                var lines = defaultContent.split("\n");
                lines[2] = "//        ";
                lines[3] = "//        a();";
                lines[4] = "//        ";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {start: {line: 2, ch: 0}, end: {line: 4, ch: 10}});
            });

            it("should do nothing on whitespace line", function () {
                myEditor.setCursorPos(2, 8);

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectCursorAt({line: 2, ch: 8});
            });

            it("should do nothing when only whitespace lines selected", function () {
                // Start with line 2 duplicated twice (3 copies total)
                var lines = defaultContent.split("\n");
                lines.splice(2, 0, lines[2], lines[2]);
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                myEditor.setSelection({line: 2, ch: 4}, {line: 4, ch: 4});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(startingContent);
                myEditor.setSelection({line: 2, ch: 4}, {line: 4, ch: 4});
            });

            it("should comment/uncomment after select all", function () {
                myEditor.setSelection({line: 0, ch: 0}, {line: 7, ch: 1});

                var expectedText = "//function foo() {\n" +
                                   "//    function bar() {\n" +
                                   "//        \n" +
                                   "//        a();\n" +
                                   "//        \n" +
                                   "//    }\n" +
                                   "//\n" +
                                   "//}";

                testToggleLine(expectedText, {start: {line: 0, ch: 0}, end: {line: 7, ch: 3}});
            });

            it("should comment/uncomment lines that were partially commented out already, our style", function () {
                // Start with line 3 commented out, with "//" at column 0
                var lines = defaultContent.split("\n");
                lines[3] = "//        a();";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select lines 1-3
                myEditor.setSelection({line: 1, ch: 0}, {line: 4, ch: 0});

                lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "//        ";
                lines[3] = "////        a();";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {start: {line: 1, ch: 0}, end: {line: 4, ch: 0}});
            });

            it("should comment/uncomment lines that were partially commented out already, comment closer to code", function () {
                // Start with line 3 commented out, with "//" snug against the code
                var lines = defaultContent.split("\n");
                lines[3] = "        //a();";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select lines 1-3
                myEditor.setSelection({line: 1, ch: 0}, {line: 4, ch: 0});

                lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "//        ";
                lines[3] = "//        //a();";
                var expectedText = lines.join("\n");

                testToggleLine(expectedText, {start: {line: 1, ch: 0}, end: {line: 4, ch: 0}});
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

            it("should uncomment ragged partial comments with empty lines in-between", function () {
                // Start with lines 1-5 commented out, with "//" snug up against each non-blank line's code
                var lines = defaultContent.split("\n");
                lines[1] = "    //function bar() {";
                lines[2] = "";
                lines[3] = "        //a();";
                lines[4] = "";
                lines[5] = "    //}";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select lines 1-5
                myEditor.setSelection({line: 1, ch: 0}, {line: 6, ch: 0});

                lines = defaultContent.split("\n");
                lines[2] = "";
                lines[4] = "";
                var expectedText = lines.join("\n");

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText);
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

            describe("with multiple selections", function () {
                it("should toggle comments on separate lines with cursor selections", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}}]);

                    var lines = defaultContent.split("\n");
                    lines[1] = "//    function bar() {";
                    lines[3] = "//        a();";
                    var expectedText = lines.join("\n");

                    testToggleLine(expectedText, [{start: {line: 1, ch: 6}, end: {line: 1, ch: 6}, primary: false, reversed: false},
                                                  {start: {line: 3, ch: 6}, end: {line: 3, ch: 6}, primary: true, reversed: false}]);
                });

                it("should toggle comments on separate lines with range selections", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 6}},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 6}}]);

                    var lines = defaultContent.split("\n");
                    lines[1] = "//    function bar() {";
                    lines[3] = "//        a();";
                    var expectedText = lines.join("\n");

                    testToggleLine(expectedText, [{start: {line: 1, ch: 6}, end: {line: 1, ch: 8}, primary: false, reversed: false},
                                                  {start: {line: 3, ch: 6}, end: {line: 3, ch: 8}, primary: true, reversed: false}]);
                });

                it("should toggle comments on separate lines with multiline selections", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 2, ch: 6}},
                                            {start: {line: 3, ch: 4}, end: {line: 4, ch: 6}}]);

                    var lines = defaultContent.split("\n"), i;
                    for (i = 1; i <= 4; i++) {
                        lines[i] = "//" + lines[i];
                    }
                    var expectedText = lines.join("\n");

                    testToggleLine(expectedText, [{start: {line: 1, ch: 6}, end: {line: 2, ch: 8}, primary: false, reversed: false},
                                                  {start: {line: 3, ch: 6}, end: {line: 4, ch: 8}, primary: true, reversed: false}]);
                });

                it("should adjust selections appropriately at start of line", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 0}, end: {line: 1, ch: 0}},
                                            {start: {line: 3, ch: 0}, end: {line: 3, ch: 6}}]);

                    var lines = defaultContent.split("\n");
                    lines[1] = "//    function bar() {";
                    lines[3] = "//        a();";
                    var expectedText = lines.join("\n");

                    testToggleLine(expectedText, [{start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: false, reversed: false},
                                                  {start: {line: 3, ch: 0}, end: {line: 3, ch: 8}, primary: true, reversed: false}]);
                });

                it("should only handle each line once, but preserve primary/reversed flags on ignored selections", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 1, ch: 6}, end: {line: 2, ch: 4}, primary: true},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}},
                                            {start: {line: 3, ch: 6}, end: {line: 3, ch: 8}, reversed: true}]);

                    var lines = defaultContent.split("\n"), i;
                    for (i = 1; i <= 3; i++) {
                        lines[i] = "//" + lines[i];
                    }
                    var expectedText = lines.join("\n");

                    testToggleLine(expectedText, [{start: {line: 1, ch: 6}, end: {line: 1, ch: 6}, primary: false, reversed: false},
                                                  {start: {line: 1, ch: 8}, end: {line: 2, ch: 6}, primary: true, reversed: false},
                                                  {start: {line: 3, ch: 6}, end: {line: 3, ch: 6}, primary: false, reversed: false},
                                                  {start: {line: 3, ch: 8}, end: {line: 3, ch: 10}, primary: false, reversed: true}]);

                });

                it("should properly toggle when some selections are already commented but others aren't", function () {
                    var lines = defaultContent.split("\n");
                    lines[1] = "//" + lines[1];
                    lines[5] = "//" + lines[5];
                    var startingContent = lines.join("\n");
                    myDocument.setText(startingContent);

                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}},
                                            {start: {line: 5, ch: 4}, end: {line: 5, ch: 4}}]);

                    lines[1] = lines[1].slice(2);
                    lines[3] = "//" + lines[3];
                    lines[5] = lines[5].slice(2);
                    var expectedText = lines.join("\n");

                    testToggleLine(expectedText, [{start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: false, reversed: false},
                                                  {start: {line: 3, ch: 6}, end: {line: 3, ch: 6}, primary: false, reversed: false},
                                                  {start: {line: 5, ch: 2}, end: {line: 5, ch: 2}, primary: true, reversed: false}]);
                });

                it("should properly toggle adjacent lines (not coalescing them) if there are cursors on each line", function () {
                    var lines = defaultContent.split("\n");
                    lines[1] = "//" + lines[1];
                    lines[2] = "    foo();"; // make this line non-blank so it will get commented
                    lines[3] = "//" + lines[3];
                    var startingContent = lines.join("\n");
                    myDocument.setText(startingContent);

                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}}]);

                    lines[1] = lines[1].slice(2);
                    lines[2] = "//" + lines[2];
                    lines[3] = lines[3].slice(2);
                    var expectedText = lines.join("\n");

                    testToggleLine(expectedText, [{start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: false, reversed: false},
                                                  {start: {line: 2, ch: 6}, end: {line: 2, ch: 6}, primary: false, reversed: false},
                                                  {start: {line: 3, ch: 2}, end: {line: 3, ch: 2}, primary: true, reversed: false}]);

                });
            });
        });

        describe("Line comment in languages with mutiple line comment prefixes", function () {
            // Define a special version of JavaScript for testing purposes
            LanguageManager.defineLanguage("javascript2", {
                "name": "JavaScript2",
                "mode": "javascript",
                "fileExtensions": ["js2"],
                "lineComment": ["//", "////", "#"]
            });

            beforeEach(function () {
                setupFullEditor(null, "javascript2");
            });

            it("should comment using the first prefix", function () {
                // select first 2 lines
                myEditor.setSelection({line: 0, ch: 4}, {line: 1, ch: 12});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = defaultContent.split("\n");
                lines[0] = "//function foo() {";
                lines[1] = "//    function bar() {";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 0, ch: 6}, end: {line: 1, ch: 14}});
            });

            it("should uncomment every prefix", function () {
                // Start with lines 1-5 commented out, with multiple line comment variations
                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "    //    ";
                lines[3] = "    ////    a();";
                lines[4] = "        ";
                lines[5] = "#    }";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select lines 1-5
                myEditor.setSelection({line: 1, ch: 0}, {line: 6, ch: 0});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 6, ch: 0}});
            });

            it("should only uncomment the first prefix", function () {
                // Start with lines 1-3 commented out, with multiple line comment variations
                var lines = defaultContent.split("\n");
                lines[1] = "//#    function bar() {";
                lines[2] = "//        ";
                lines[3] = "//////        a();";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                lines = defaultContent.split("\n");
                lines[1] = "#    function bar() {";
                lines[2] = "        ";
                lines[3] = "//        a();";
                var expectedContent = lines.join("\n");

                // select lines 1-3
                myEditor.setSelection({line: 1, ch: 0}, {line: 4, ch: 0});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 4, ch: 0}});
            });
        });

        describe("Line comment in languages with no given line comment prefix", function () {
            beforeEach(function () {
                setupFullEditor(null, "unknown");
            });

            it("should properly restore the cursor", function () {
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 4});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 4}, end: {line: 1, ch: 4}});
            });

            it("should properly restore the range selection", function () {
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 6});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 4}, end: {line: 1, ch: 6}});
            });

            it("should properly restore the cursors", function () {
                myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                        {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}}]);

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, reversed: false, primary: false},
                                                          {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}, reversed: false, primary: true}]);
            });

            it("should properly restore the range selections", function () {
                myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 6}},
                                        {start: {line: 3, ch: 4}, end: {line: 3, ch: 6}}]);

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 4}, end: {line: 1, ch: 6}, reversed: false, primary: false},
                                                          {start: {line: 3, ch: 4}, end: {line: 3, ch: 6}, reversed: false, primary: true}]);
            });

            it("should properly restore primary/reversed range selections", function () {
                myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: true},
                                        {start: {line: 3, ch: 4}, end: {line: 3, ch: 12}, reversed: true}]);

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, reversed: false, primary: true},
                                                          {start: {line: 3, ch: 4}, end: {line: 3, ch: 12}, reversed: true, primary: false}]);
            });
        });

        describe("Block comment/uncomment", function () {
            beforeEach(setupFullEditor);

            it("should block comment/uncomment, cursor at start of line", function () {
                myEditor.setCursorPos(0, 0);

                var lines = defaultContent.split("\n");
                lines[0] = "/**/function foo() {";
                var expectedText = lines.join("\n");

                testToggleBlock(expectedText, {line: 0, ch: 2});
            });

            it("should block comment/uncomment, cursor to left of existing block comment", function () {
                // Start with part of line 3 wrapped in a block comment
                var lines = defaultContent.split("\n");
                lines[3] = "        /*a();*/";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // put cursor to left of block
                myEditor.setCursorPos(3, 4);

                lines[3] = "    /**/    /*a();*/";
                var expectedText = lines.join("\n");

                testToggleBlock(expectedText, {line: 3, ch: 6});
            });

            it("should block comment/uncomment, subset of line selected", function () {
                myEditor.setSelection({line: 1, ch: 13}, {line: 1, ch: 18}); // select "bar()"

                var lines = defaultContent.split("\n");
                lines[1] = "    function /*bar()*/ {";
                var expectedText = lines.join("\n");

                // Selects just text within block
                testToggleBlock(expectedText, {start: {line: 1, ch: 15}, end: {line: 1, ch: 20}});
            });

            it("should block uncomment, cursor within existing sub-line block comment", function () {
                // Start with part of line 1 wrapped in a block comment
                var lines = defaultContent.split("\n");
                lines[1] = "    function /*bar()*/ {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // put cursor within block
                myEditor.setCursorPos(1, 18);

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectCursorAt({line: 1, ch: 16});
            });

            it("should block uncomment, cursor within existing block comment suffix", function () {
                // Start with part of line 1 wrapped in a block comment
                var lines = defaultContent.split("\n");
                lines[1] = "    function /*bar()*/ {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // put cursor within block
                myEditor.setCursorPos(1, 21);

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectCursorAt({line: 1, ch: 18});
            });

            it("should block uncomment, selection covering whole sub-line block comment", function () {
                // Start with part of line 1 wrapped in a block comment
                var lines = defaultContent.split("\n");
                lines[1] = "    function /*bar()*/ {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select whole comment
                myEditor.setSelection({line: 1, ch: 13}, {line: 1, ch: 22});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 13}, end: {line: 1, ch: 18}}); // just text that was uncommented
            });

            it("should block comment/uncomment, selection from mid-line end of line", function () {
                myEditor.setSelection({line: 3, ch: 8}, {line: 3, ch: 12});

                var lines = defaultContent.split("\n");
                lines[3] = "        /*a();*/";
                var expectedText = lines.join("\n");

                // Selects just text within block
                testToggleBlock(expectedText, {start: {line: 3, ch: 10}, end: {line: 3, ch: 14}});
            });

            it("should block comment/uncomment, all of line selected but not newline", function () {
                myEditor.setSelection({line: 3, ch: 0}, {line: 3, ch: 12});

                var lines = defaultContent.split("\n");
                lines[3] = "/*        a();*/";
                var expectedText = lines.join("\n");

                // Selects just text within block
                testToggleBlock(expectedText, {start: {line: 3, ch: 2}, end: {line: 3, ch: 14}});
            });


            it("should block comment/uncomment, all of line selected including newline", function () {
                myEditor.setSelection({line: 3, ch: 0}, {line: 4, ch: 0});

                var lines = defaultContent.split("\n");
                lines.splice(3, 1, "/*", lines[3], "*/");   // inserts new delimiter lines
                var expectedText = lines.join("\n");

                // Selects original line, but not block-delimiter lines
                testToggleBlock(expectedText, {start: {line: 4, ch: 0}, end: {line: 5, ch: 0}});
            });

            it("should block comment/uncomment, multiple lines selected", function () {
                myEditor.setSelection({line: 1, ch: 0}, {line: 6, ch: 0});

                var lines = defaultContent.split("\n");
                lines.splice(6, 0, "*/");   // inserts new delimiter lines
                lines.splice(1, 0, "/*");
                var expectedText = lines.join("\n");

                // Selects original lines, but not block-delimiter lines
                testToggleBlock(expectedText, {start: {line: 2, ch: 0}, end: {line: 7, ch: 0}});
            });

            it("should block comment/uncomment, multiple partial lines selected", function () {
                myEditor.setSelection({line: 1, ch: 13}, {line: 3, ch: 9});

                var lines = defaultContent.split("\n");
                lines[1] = "    function /*bar() {";
                lines[3] = "        a*/();";
                var expectedText = lines.join("\n");

                // Selects just text within block
                testToggleBlock(expectedText, {start: {line: 1, ch: 15}, end: {line: 3, ch: 9}});
            });

            // Whitespace within block comments

            var BLOCK_CONTAINING_WS = "function foo()\n" +
                                      "/*\n" +
                                      "    a();\n" +
                                      "    \n" +
                                      "    b();\n" +
                                      "*/\n" +
                                      "}";

            it("should block uncomment, cursor in whitespace within block comment", function () {
                myDocument.setText(BLOCK_CONTAINING_WS);

                myEditor.setCursorPos(3, 2); // middle of blank line

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = BLOCK_CONTAINING_WS.split("\n");
                lines.splice(5, 1);  // removes delimiter lines
                lines.splice(1, 1);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 2, ch: 2});
            });

            it("should block uncomment, selection in whitespace within block comment", function () {
                myDocument.setText(BLOCK_CONTAINING_WS);

                myEditor.setSelection({line: 3, ch: 0}, {line: 3, ch: 4});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = BLOCK_CONTAINING_WS.split("\n");
                lines.splice(5, 1);  // removes delimiter lines
                lines.splice(1, 1);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 0}, end: {line: 2, ch: 4}});
            });

            // Selections mixing whitespace and existing block comments

            var WS_SURROUNDING_BLOCK = "function foo()\n" +
                                       "    \n" +
                                       "    /*a();\n" +
                                       "    \n" +
                                       "    b();*/\n" +
                                       "    \n" +
                                       "}";

            it("should block uncomment, selection covers block comment plus whitespace before", function () {
                myDocument.setText(WS_SURROUNDING_BLOCK);

                myEditor.setSelection({line: 1, ch: 0}, {line: 4, ch: 10});  // start of blank line to end of block comment

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = WS_SURROUNDING_BLOCK.split("\n");
                lines[2] = "    a();";
                lines[4] = "    b();";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 4, ch: 8}});
            });

            it("should block uncomment, selection covers block comment plus whitespace after", function () {
                myDocument.setText(WS_SURROUNDING_BLOCK);

                myEditor.setSelection({line: 2, ch: 4}, {line: 5, ch: 4});  // start of block comment to end of blank line

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = WS_SURROUNDING_BLOCK.split("\n");
                lines[2] = "    a();";
                lines[4] = "    b();";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 4}, end: {line: 5, ch: 4}});
            });

            it("should block uncomment, selection covers part of block comment plus whitespace before", function () {
                myDocument.setText(WS_SURROUNDING_BLOCK);

                myEditor.setSelection({line: 1, ch: 0}, {line: 3, ch: 4});  // start of blank line to middle of block comment

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = WS_SURROUNDING_BLOCK.split("\n");
                lines[2] = "    a();";
                lines[4] = "    b();";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 3, ch: 4}});
            });

            it("should block uncomment, selection covers part of block comment plus whitespace after", function () {
                myDocument.setText(WS_SURROUNDING_BLOCK);

                myEditor.setSelection({line: 3, ch: 4}, {line: 5, ch: 4});  // middle of block comment to end of blank line

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = WS_SURROUNDING_BLOCK.split("\n");
                lines[2] = "    a();";
                lines[4] = "    b();";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 3, ch: 4}, end: {line: 5, ch: 4}});
            });

            it("should block uncomment, selection covers block comment plus whitespace on both sides", function () {
                myDocument.setText(WS_SURROUNDING_BLOCK);

                myEditor.setSelection({line: 1, ch: 0}, {line: 5, ch: 4});  // start of first blank line to end of last blank line

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = WS_SURROUNDING_BLOCK.split("\n");
                lines[2] = "    a();";
                lines[4] = "    b();";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 5, ch: 4}});
            });

            // Selections mixing uncommented text and existing block comments

            it("should block uncomment, selection covers block comment plus other text", function () {
                // Start with part of line 1 wrapped in a block comment
                var lines = defaultContent.split("\n");
                lines[1] = "    function /*bar()*/ {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select more of line 1
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 24});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 4}, end: {line: 1, ch: 20}}); // range endpoints still align with same text
            });

            it("should block uncomment, selection covers multi-line block comment plus other text", function () {
                var content = "function foo()\n" +
                              "    \n" +
                              "    /*a();\n" +
                              "    \n" +
                              "    b();*/\n" +
                              "    c();\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 0, ch: 5}, {line: 5, ch: 5});  // middle of first line of code to middle of line following comment

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[2] = "    a();";
                lines[4] = "    b();";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 0, ch: 5}, end: {line: 5, ch: 5}});
            });

            // Selections including multiple separate block comments
            // We no-op in these cases since it's ambiguous - can't nest block comments, but was multiple independent uncomments intended?

            it("should do nothing, selection covers parts of multiple block comments", function () {
                // Start with part of line 1 wrapped in a block comment
                var lines = defaultContent.split("\n");
                lines[1] = "    /*function*/ /*bar()*/ {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select end of 1st comment, start of 2nd comment, and the space between them
                myEditor.setSelection({line: 1, ch: 9}, {line: 1, ch: 22});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(startingContent);
                expectSelection({start: {line: 1, ch: 9}, end: {line: 1, ch: 22}}); // no change
            });

            it("should do nothing, selection covers all of multiple block comments", function () {
                // Start with part of line 1 wrapped in a block comment
                var lines = defaultContent.split("\n");
                lines[1] = "    /*function*/ /*bar()*/ {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select both block comments and the space between them, but nothing else
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 26});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(startingContent);
                expectSelection({start: {line: 1, ch: 4}, end: {line: 1, ch: 26}}); // no change
            });

            it("should do nothing, selection covers multiple block comments & nothing else", function () {
                // Start with part of line 1 wrapped in a block comment
                var lines = defaultContent.split("\n");
                lines[1] = "    /*function*//*bar()*/ {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select both block comments, but nothing else
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 25});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(startingContent);
                expectSelection({start: {line: 1, ch: 4}, end: {line: 1, ch: 25}}); // no change
            });

            it("should do nothing, selection covers multiple block comments plus other text", function () {
                // Start with part of line 1 wrapped in a block comment
                var lines = defaultContent.split("\n");
                lines[1] = "    /*function*/ /*bar()*/ {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                // select all of line 1 (but not newline)
                myEditor.setSelection({line: 1, ch: 0}, {line: 1, ch: 28});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(startingContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 1, ch: 28}}); // no change
            });

            describe("with multiple selections", function () {
                it("should comment out multiple selections/cursors, preserving primary/reversed selections", function () {
                    var lines = defaultContent.split("\n");
                    lines[1] = lines[1].substr(0, 4) + "/**/" + lines[1].substr(4);
                    lines[3] = lines[3].substr(0, 4) + "/*" + lines[3].substr(4, 8) + "*/" + lines[3].substr(12);

                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: true},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 12}, reversed: true}]);
                    testToggleBlock(lines.join("\n"), [{start: {line: 1, ch: 6}, end: {line: 1, ch: 6}, primary: true, reversed: false},
                                                       {start: {line: 3, ch: 6}, end: {line: 3, ch: 14}, primary: false, reversed: true}]);
                });

                it("should skip the case where a selection covers multiple block comments, but still track it and handle other selections", function () {
                    var lines = defaultContent.split("\n");
                    lines[4] = "    /*a*/ /*()*/ {";
                    var startingContent = lines.join("\n");
                    myDocument.setText(startingContent);

                    myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}},
                                            {start: {line: 4, ch: 0}, end: {line: 4, ch: 18}, reversed: true}]);
                    CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                    lines.splice(1, 0, "*/");
                    lines.splice(0, 0, "/*");
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 0}, end: {line: 2, ch: 0}, primary: false, reversed: false},
                                                              {start: {line: 6, ch: 0}, end: {line: 6, ch: 18}, primary: true, reversed: true}]);
                });
            });
        });

        // If the cursor's/selection's lines contain nothing but line comments and whitespace, we assume the user
        // meant line-uncomment (i.e. delegate to Toggle Line Comment). In all other cases, we ignore the line comment
        // and create a new block comment.
        describe("Block comment around line comments", function () {
            beforeEach(setupFullEditor);

            // Selections including existing line comments (and possibly whitespace)

            it("should switch to line uncomment mode, cursor inside line comment (with only whitespace to left)", function () {
                // Start with part of line 1 line-commented
                var lines = defaultContent.split("\n");
                lines[1] = "    //function bar() {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                myEditor.setCursorPos(1, 18);

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectCursorAt({line: 1, ch: 16});
            });

            it("should switch to line uncomment, cursor in whitespace to left of line comment", function () { // #2342
                // Start with part of line 1 line-commented
                var lines = defaultContent.split("\n");
                lines[1] = "    //function bar() {";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                myEditor.setCursorPos(1, 0);

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectCursorAt({line: 1, ch: 0});
            });

            it("should switch to line uncomment, some of line-comment selected (only whitespace to left)", function () {
                var content = "function foo()\n" +
                              "    // Comment\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 6}, {line: 1, ch: 13}); // just " Commen"

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "     Comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 4}, end: {line: 1, ch: 11}});
            });

            it("should switch to line uncomment, some of line-comment selected including last char (only whitespace to left)", function () { // #2337
                var content = "function foo()\n" +
                              "    // Comment\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 6}, {line: 1, ch: 14}); // everything but leading "//"

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "     Comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 4}, end: {line: 1, ch: 12}});
            });

            it("should switch to line uncomment, all of line-comment selected (only whitespace to left)", function () { // #2342
                var content = "function foo()\n" +
                              "    // Comment\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 14}); // include "//"

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "     Comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 4}, end: {line: 1, ch: 12}});
            });

            // Selections that don't mix code & line-comment, but are on a line that does contain both

            it("should insert block comment, cursor inside line comment (with code to left)", function () {
                // Start with comment ending line 1
                var lines = defaultContent.split("\n");
                lines[1] = "    function bar() { // comment";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                myEditor.setCursorPos(1, 24); // between space and "c"

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                lines = defaultContent.split("\n");
                lines[1] = "    function bar() { // /**/comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: 26});
            });

            it("should insert block comment, cursor in code to left of line comment", function () {
                // Start with comment ending line 1
                var lines = defaultContent.split("\n");
                lines[1] = "    function bar() { // comment";
                var startingContent = lines.join("\n");
                myDocument.setText(startingContent);

                myEditor.setCursorPos(1, 12);

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                lines[1] = "    function/**/ bar() { // comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: 14});
            });

            it("should block comment, some of line-comment selected (with code to left)", function () {
                var content = "function foo()\n" +
                              "    f(); // Comment\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 11}, {line: 1, ch: 18}); // just " Commen"

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "    f(); ///* Commen*/t";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 13}, end: {line: 1, ch: 20}});
            });

            it("should block comment, some of line-comment selected including last char (with code to left)", function () { // #2337
                var content = "function foo()\n" +
                              "    f(); // Comment\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 11}, {line: 1, ch: 19}); // everything but leading "//"

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "    f(); ///* Comment*/";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 13}, end: {line: 1, ch: 21}});
            });

            it("should block comment, all of line-comment selected (with code to left)", function () { // #2342
                var content = "function foo()\n" +
                              "    f(); // Comment\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 9}, {line: 1, ch: 19}); // include "//"

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "    f(); /*// Comment*/";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 11}, end: {line: 1, ch: 21}});
            });

            // Full-line/multiline selections containing only line comments and whitespace

            it("should switch to line uncomment, all of line-comment line selected (following line is code)", function () {
                var content = "function foo()\n" +
                              "    // Comment\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "     Comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 2, ch: 0}});
            });

            it("should switch to line uncomment, all of line-comment line selected (following line is whitespace)", function () {
                var content = "function foo()\n" +
                              "    // Comment\n" +
                              "    \n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "     Comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 2, ch: 0}});
            });

            it("should switch to line uncomment, all of line-comment line selected (following line is line comment)", function () {
                var content = "function foo()\n" +
                              "    // Comment\n" +
                              "    // Comment 2\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "     Comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 2, ch: 0}});
            });

            it("should switch to line uncomment, all of line-comment line selected (following line is block comment)", function () {
                var content = "function foo()\n" +
                              "    // Comment\n" +
                              "    /* Comment 2 */\n" +
                              "}";
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[1] = "     Comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 2, ch: 0}});
            });

            it("should line uncomment, multiple line comments selected", function () {
                // Start with all of lines 1-5 line-commented
                var lines = defaultContent.split("\n");
                lines[1] = "//    function bar() {";
                lines[2] = "//        ";
                lines[3] = "//        a();";
                lines[4] = "//        ";
                lines[5] = "//    }";
                var content = lines.join("\n");
                myDocument.setText(content);

                myEditor.setSelection({line: 1, ch: 0}, {line: 6, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(defaultContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 6, ch: 0}});
            });

            // Selections mixing uncommented code & line comments

            var lineCommentCode = "function foo() {\n" +
                                  "    \n" +
                                  "    // Floating comment\n" +
                                  "    \n" +
                                  "    // Attached comment\n" +
                                  "    function bar() {\n" +
                                  "        a();\n" +
                                  "        b(); // post comment\n" +
                                  "    }\n" +
                                  "    \n" +
                                  "    bar();\n" +
                                  "    // Attached above\n" +
                                  "    \n" +
                                  "    // Final floating comment\n" +
                                  "    \n" +
                                  "}";

            it("should line uncomment, multiline selection covers line comment plus whitespace", function () {
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 1, ch: 0}, {line: 3, ch: 4});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines[2] = "     Floating comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 3, ch: 4}});
            });

            it("should switch to line uncomment mode, selection starts in whitespace & ends in middle of line comment", function () { // #2342
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 2, ch: 2}, {line: 2, ch: 10}); // stops with "Flo"

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines[2] = "     Floating comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 2}, end: {line: 2, ch: 8}});
            });

            it("should switch to line uncomment mode, selection starts in whitespace & ends at end of line comment", function () { // #2337, #2342
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 2, ch: 2}, {line: 2, ch: 23});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines[2] = "     Floating comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 2}, end: {line: 2, ch: 21}});
            });

            it("should block comment, selection starts in code & ends in middle of line comment", function () { // #2342
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 7, ch: 8}, {line: 7, ch: 20}); // stops at end of "post"

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines[7] = "        /*b(); // post*/ comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 7, ch: 10}, end: {line: 7, ch: 22}});
            });

            it("should block comment, selection starts in middle of code & ends at end of line comment", function () { // #2342
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 7, ch: 9}, {line: 7, ch: 28});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines[7] = "        b/*(); // post comment*/";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 7, ch: 11}, end: {line: 7, ch: 30}});
            });

            it("should block comment, selection starts in code & ends at end of line comment", function () { // #2337
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 7, ch: 8}, {line: 7, ch: 28});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines[7] = "        /*b(); // post comment*/";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 7, ch: 10}, end: {line: 7, ch: 30}});
            });

            it("should block comment, selection starts at col 0 of code & ends at end of line comment", function () {
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 7, ch: 0}, {line: 7, ch: 28});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines[7] = "/*        b(); // post comment*/";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 7, ch: 2}, end: {line: 7, ch: 30}});
            });

            it("should block comment, selection starts on line with line comment", function () {
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 4, ch: 0}, {line: 9, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines.splice(9, 0, "*/");
                lines.splice(4, 0, "/*");
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 5, ch: 0}, end: {line: 10, ch: 0}});
            });

            it("should block comment, selection ends on line with line comment", function () {
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 10, ch: 0}, {line: 12, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines.splice(12, 0, "*/");
                lines.splice(10, 0, "/*");
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 11, ch: 0}, end: {line: 13, ch: 0}});
            });

            it("should line uncomment, selection covers several line comments separated by whitespace", function () {
                myDocument.setText(lineCommentCode);
                myEditor.setSelection({line: 11, ch: 0}, {line: 14, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                var lines = lineCommentCode.split("\n");
                lines[11] = "     Attached above";
                lines[13] = "     Final floating comment";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 11, ch: 0}, end: {line: 14, ch: 0}});
            });

            describe("with multiple selections", function () {
                it("should handle multiple selections where one of them is in a line comment", function () {
                    // Add a line comment to line 1
                    var lines = defaultContent.split("\n");
                    lines[1] = "//" + lines[1];
                    myDocument.setText(lines.join("\n"));

                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: true},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 12}}]);

                    CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                    // Line 1 should no longer have a line comment, and line 3 should have a block comment.
                    lines[1] = lines[1].substr(2);
                    lines[3] = lines[3].substr(0, 4) + "/*" + lines[3].substr(4, 8) + "*/" + lines[3].substr(12);

                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: true, reversed: false},
                                      {start: {line: 3, ch: 6}, end: {line: 3, ch: 14}, primary: false, reversed: false}]);
                });

                it("should handle multiple selections where several of them are in the same line comment, preserving the ignored selections", function () {
                    // Add a line comment to line 1
                    var lines = defaultContent.split("\n");
                    lines[1] = "//" + lines[1];
                    myDocument.setText(lines.join("\n"));

                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: true},
                                            {start: {line: 1, ch: 6}, end: {line: 1, ch: 6}}]);

                    CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                    // Line 1 should no longer have a line comment
                    lines[1] = lines[1].substr(2);

                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: true, reversed: false},
                                      {start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: false, reversed: false}]);
                });
            });
        });

        // In cases where the language only supports block comments, the line comment/uncomment command may perform block comment/uncomment instead
        describe("Line comment auto-switching to block comment", function () {
            var cssContent = "div {\n" +
                             "    color: red;\n" +
                             "}\n" +
                             "\n" +
                             "/*span {\n" +
                             "    color: blue;\n" +
                             "}*/\n";

            beforeEach(function () {
                setupFullEditor(cssContent, "css");
            });

            it("should block-comment entire line that cursor is in", function () {
                myEditor.setCursorPos(1, 4);

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines[1] = "/*    color: red;*/";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: 6});
            });

            it("should block-comment entire line that sub-line selection is in", function () {
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 9});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines[1] = "/*    color: red;*/";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 6}, end: {line: 1, ch: 11}});
            });

            it("should block-comment full multi-line selection", function () {
                myEditor.setSelection({line: 0, ch: 0}, {line: 3, ch: 0});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines.splice(3, 0, "*/");
                lines.splice(0, 0, "/*");
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 4, ch: 0}});
            });

            it("should block-comment partial multi-line selection as if it were full", function () {
                myEditor.setSelection({line: 0, ch: 3}, {line: 1, ch: 10});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines.splice(2, 0, "*/");
                lines.splice(0, 0, "/*");
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 3}, end: {line: 2, ch: 10}});  // range endpoints still align with same text
            });

            it("should uncomment multi-line block comment selection, selected exactly", function () {
                myEditor.setSelection({line: 4, ch: 0}, {line: 6, ch: 3});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines[4] = "span {";
                lines[6] = "}";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 4, ch: 0}, end: {line: 6, ch: 1}});
            });

            it("should uncomment multi-line block comment selection, selected including trailing newline", function () { // #2339
                myEditor.setSelection({line: 4, ch: 0}, {line: 7, ch: 0});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines[4] = "span {";
                lines[6] = "}";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 4, ch: 0}, end: {line: 7, ch: 0}});
            });

            it("should uncomment multi-line block comment selection, only start selected", function () {
                myEditor.setSelection({line: 4, ch: 0}, {line: 5, ch: 8});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines[4] = "span {";
                lines[6] = "}";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 4, ch: 0}, end: {line: 5, ch: 8}});
            });

            it("should uncomment multi-line block comment selection, only middle selected", function () {
                myEditor.setSelection({line: 5, ch: 0}, {line: 5, ch: 8});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines[4] = "span {";
                lines[6] = "}";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 5, ch: 0}, end: {line: 5, ch: 8}});
            });

            it("should uncomment multi-line block comment selection, only end selected", function () { // #2339
                myEditor.setSelection({line: 5, ch: 8}, {line: 6, ch: 3});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines[4] = "span {";
                lines[6] = "}";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 5, ch: 8}, end: {line: 6, ch: 1}});
            });

            it("should uncomment multi-line block comment selection, only end selected, ends at EOF", function () {
                // remove trailing blank line, so end of "*/" is EOF (no newline afterward)
                myDocument.replaceRange("", {line: 6, ch: 3}, {line: 7, ch: 0});
                var content = myDocument.getText();

                myEditor.setSelection({line: 5, ch: 8}, {line: 6, ch: 3});

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = content.split("\n");
                lines[4] = "span {";
                lines[6] = "}";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 5, ch: 8}, end: {line: 6, ch: 1}});
            });

            it("should uncomment multi-line block comment that cursor is in", function () {
                myEditor.setCursorPos(5, 4);

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = cssContent.split("\n");
                lines[4] = "span {";
                lines[6] = "}";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 5, ch: 4});
            });
        });

        describe("Comment/uncomment with mixed syntax modes", function () {

            var htmlContent = "<html>\n" +
                              "    <head>\n" +
                              "        <style type='text/css'>\n" +
                              "            body {\n" +
                              "                font-size: 15px;\n" +
                              "            }\n" +
                              "        </style>\n" +
                              "        <script type='text/javascript'>\n" +
                              "            function foo() {\n" +
                              "                function bar() {\n" +
                              "                    a();\n" +
                              "                }\n" +
                              "            }\n" +
                              "        </script>\n" +
                              "    </head>\n" +
                              "    <body>\n" +
                              "        <p>Hello</p>\n" +
                              "        <p>World</p>\n" +
                              "    </body>\n" +
                              "</html>";

            beforeEach(function () {
                setupFullEditor(htmlContent, "html");
            });

            // Correct behavior for line and block comment commands

            it("should block comment/uncomment generic HTML code", function () {
                myEditor.setSelection({line: 1, ch: 4}, {line: 1, ch: 10});

                var lines = htmlContent.split("\n");
                lines[1] = "    <!--<head>-->";
                var expectedText = lines.join("\n");

                testToggleBlock(expectedText, {start: { line: 1, ch: 8 }, end: {line: 1, ch: 14}});
            });

            it("should block comment/uncomment generic CSS code", function () {
                myEditor.setSelection({line: 4, ch: 16}, {line: 4, ch: 32});

                var lines = htmlContent.split("\n");
                lines[4] = "                /*font-size: 15px;*/";
                var expectedText = lines.join("\n");

                testToggleBlock(expectedText, {start: {line: 4, ch: 18}, end: {line: 4, ch: 34}});
            });

            it("should line comment/uncomment generic JS code", function () {
                myEditor.setCursorPos(10, 0);

                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                var lines = htmlContent.split("\n");
                lines[10] = "//                    a();";
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 10, ch: 2});

                // Uncomment
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);
                expect(myDocument.getText()).toEqual(htmlContent);
                expectCursorAt({line: 10, ch: 0});
            });

            it("should block comment/uncomment generic JS code", function () {
                myEditor.setSelection({line: 8, ch: 0}, {line: 13, ch: 0});

                var lines = htmlContent.split("\n");
                lines.splice(13, 0, "*/");
                lines.splice(8, 0, "/*");
                var expectedText = lines.join("\n");

                testToggleBlock(expectedText, {start: {line: 9, ch: 0}, end: {line: 14, ch: 0}});
            });

            it("should HTML comment/uncomment around outside of <style> block", function () {
                myEditor.setSelection({line: 2, ch: 0}, {line: 7, ch: 0});

                var lines = htmlContent.split("\n");
                lines.splice(7, 0, "-->");
                lines.splice(2, 0, "<!--");
                var expectedText = lines.join("\n");

                testToggleBlock(expectedText, {start: {line: 3, ch: 0}, end: {line: 8, ch: 0}});
            });

            it("shouldn't comment anything when selection mixes modes", function () {
                myEditor.setSelection({line: 3, ch: 0}, {line: 11, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(htmlContent);
                expectSelection({start: {line: 3, ch: 0}, end: {line: 11, ch: 0}});
            });

            describe("with multiple selections", function () {
                it("should handle multiple selections in different regions, toggling block selection in each", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 10}},
                                            {start: {line: 4, ch: 16}, end: {line: 4, ch: 32}},
                                            {start: {line: 8, ch: 0}, end: {line: 13, ch: 0}}]);

                    var lines = htmlContent.split("\n");
                    lines[1] = "    <!--<head>-->";
                    lines[4] = "                /*font-size: 15px;*/";
                    lines.splice(13, 0, "*/");
                    lines.splice(8, 0, "/*");

                    testToggleBlock(lines.join("\n"), [{start: {line: 1, ch: 8}, end: {line: 1, ch: 14}, primary: false, reversed: false},
                                                       {start: {line: 4, ch: 18}, end: {line: 4, ch: 34}, primary: false, reversed: false},
                                                       {start: {line: 9, ch: 0}, end: {line: 14, ch: 0}, primary: true, reversed: false}]);
                });

                it("should handle multiple selections in different regions, toggling line selection (but falling back to block selection in HTML/CSS)", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 10}},
                                            {start: {line: 4, ch: 16}, end: {line: 4, ch: 32}},
                                            {start: {line: 10, ch: 0}, end: {line: 10, ch: 0}}]);

                    var lines = htmlContent.split("\n");
                    lines[1] = "<!--    <head>-->";
                    lines[4] = "/*                font-size: 15px;*/";
                    lines[10] = "//                    a();";

                    testToggleLine(lines.join("\n"), [{start: {line: 1, ch: 8}, end: {line: 1, ch: 14}, primary: false, reversed: false},
                                                      {start: {line: 4, ch: 18}, end: {line: 4, ch: 34}, primary: false, reversed: false},
                                                      {start: {line: 10, ch: 2}, end: {line: 10, ch: 2}, primary: true, reversed: false}]);
                });

                it("shouldn't comment anything in a mixed-mode selection, but should track it properly and comment the other selections", function () {
                    // Select the whole HTML tag so it will actually insert a line, causing other selections to get fixed up.
                    myEditor.setSelections([{start: {line: 1, ch: 0}, end: {line: 2, ch: 0}},
                                            {start: {line: 5, ch: 0}, end: {line: 7, ch: 0}, reversed: true, primary: true},
                                            {start: {line: 8, ch: 0}, end: {line: 13, ch: 0}}]);

                    var lines = htmlContent.split("\n");
                    lines.splice(13, 0, "*/");
                    lines.splice(8, 0, "/*");
                    lines.splice(2, 0, "-->");
                    lines.splice(1, 0, "<!--");

                    testToggleBlock(lines.join("\n"), [{start: {line: 2, ch: 0}, end: {line: 3, ch: 0}, primary: false, reversed: false},
                                                       {start: {line: 7, ch: 0}, end: {line: 9, ch: 0}, primary: true, reversed: true},
                                                       {start: {line: 11, ch: 0}, end: {line: 16, ch: 0}, primary: false, reversed: false}]);
                });
            });

        });


        describe("Comment/uncomment on languages with equal prefix and suffix and a line prefix being prefix of a block prefix/suffix", function () {
            // Define a new CoffeeScript language for testing purposes
            LanguageManager.defineLanguage("coffeescript2", {
                "name": "CoffeeScript2",
                "mode": "coffeescript",
                "fileExtensions": ["coffee2"],
                "blockComment": ["###", "###"],
                "lineComment": ["#"]
            });

            var coffeeContent = "foo = 42\n" +
                                "bar = true\n" +
                                "baz = \"hello\"\n" +
                                "number = -42\n" +
                                "if bar square = (x) -> x * x";

            function getContentCommented(startLine, endLine, content) {
                var lines = (content || coffeeContent).split("\n");
                lines.splice(endLine, 0, "###");
                lines.splice(startLine, 0, "###");
                return lines.join("\n");
            }

            beforeEach(function () {
                setupFullEditor(coffeeContent, "coffeescript2");
            });

            it("should block comment/uncomment selecting part of lines", function () {
                myEditor.setSelection({line: 2, ch: 2}, {line: 3, ch: 5});

                var lines = coffeeContent.split("\n");
                lines[2] = "ba###z = \"hello\"";
                lines[3] = "numbe###r = -42";
                var expectedText = lines.join("\n");

                testToggleBlock(expectedText, {start: {line: 2, ch: 5}, end: {line: 3, ch: 5}});
            });

            it("should block comment/uncomment selecting full lines", function () {
                myEditor.setSelection({line: 1, ch: 0}, {line: 3, ch: 0});
                var expectedText = getContentCommented(1, 3);

                testToggleBlock(expectedText, {start: {line: 2, ch: 0}, end: {line: 4, ch: 0}});
            });

            it("should block uncomment when selecting the prefix and suffix", function () {
                myDocument.setText(getContentCommented(1, 3));
                myEditor.setSelection({line: 1, ch: 0}, {line: 5, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(coffeeContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 3, ch: 0}});
            });

            it("should block uncomment when selecting only the prefix", function () {
                myDocument.setText(getContentCommented(1, 3));
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(coffeeContent);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 1, ch: 0}});
            });

            it("should block uncomment when selecting only the suffix", function () {
                myDocument.setText(getContentCommented(1, 3));
                myEditor.setSelection({line: 4, ch: 0}, {line: 5, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(coffeeContent);
                expectSelection({start: {line: 3, ch: 0}, end: {line: 3, ch: 0}});
            });

            it("should do nothing when selecting from a suffix to a prefix", function () {
                var expectedText = getContentCommented(0, 1, getContentCommented(4, 5));
                myDocument.setText(expectedText);
                myEditor.setSelection({line: 2, ch: 0}, {line: 7, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 0}, end: {line: 7, ch: 0}});
            });

            it("should block uncomment with line comments around the block comment", function () {
                var lines = coffeeContent.split("\n");
                lines[0] = "#foo = 42";
                lines[3] = "#number = -42";
                var expectedText = lines.join("\n");

                myDocument.setText(getContentCommented(1, 3, expectedText));
                myEditor.setSelection({line: 1, ch: 0}, {line: 3, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 2, ch: 0}});
            });

            it("should block uncomment when the lines inside the block comment are line commented", function () {
                var lines = coffeeContent.split("\n");
                lines[2] = "#baz = \"hello\"";
                var expectedText = lines.join("\n");

                myDocument.setText(getContentCommented(1, 3, expectedText));
                myEditor.setSelection({line: 3, ch: 0}, {line: 4, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 0}, end: {line: 3, ch: 0}});
            });

            it("should block uncomment a second block comment", function () {
                var expectedText = getContentCommented(0, 1);
                myDocument.setText(getContentCommented(6, 7, expectedText));
                myEditor.setSelection({line: 7, ch: 0}, {line: 8, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText + "\n");
                expectSelection({start: {line: 6, ch: 0}, end: {line: 7, ch: 0}});
            });

            it("should block uncomment with line comments in between the block comments", function () {
                var lines = coffeeContent.split("\n");
                lines[1] = "#bar = true";
                lines[2] = "#baz = \"hello\"";
                lines[3] = "#number = -42";
                var expectedText = getContentCommented(0, 1, lines.join("\n"));

                myDocument.setText(getContentCommented(6, 7, expectedText));
                myEditor.setSelection({line: 7, ch: 0}, {line: 8, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText + "\n");
                expectSelection({start: {line: 6, ch: 0}, end: {line: 7, ch: 0}});
            });

            it("should block comment on an empty line around comments", function () {
                var lines = coffeeContent.split("\n");
                lines[2] = "###baz = \"hello\"###";
                lines[3] = "";
                lines[4] = "#number = -42";
                var text = lines.join("\n");

                lines[3] = "######";
                var expectedText = lines.join("\n");

                myDocument.setText(text);
                myEditor.setCursorPos(3, 0);

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 3, ch: 3});
            });

            it("should block uncomment on an empty line inside a block comment", function () {
                var lines = coffeeContent.split("\n");
                lines[1] = "###bar = true";
                lines[2] = "";
                lines[3] = "number = -42###";
                var text = lines.join("\n");

                lines = coffeeContent.split("\n");
                lines[2] = "";
                var expectedText = lines.join("\n");

                myDocument.setText(text);
                myEditor.setCursorPos(2, 0);

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 2, ch: 0});
            });

            it("should line uncomment on line comments around a block comment", function () {
                var lines = getContentCommented(1, 3).split("\n");
                lines[5] = "#number = -42";
                var text = lines.join("\n");

                lines = text.split("\n");
                lines[5] = "number = -42";
                var expectedText = lines.join("\n");

                myDocument.setText(text);
                myEditor.setSelection({line: 5, ch: 0}, {line: 6, ch: 0});

                CommandManager.execute(Commands.EDIT_BLOCK_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 5, ch: 0}, end: {line: 6, ch: 0}});
            });

            it("should line comment block commented lines", function () {
                var lines = coffeeContent.split("\n");
                lines[2] = "###baz = \"hello\"###";
                var text = lines.join("\n");

                lines = text.split("\n");
                lines[2] = "####baz = \"hello\"###";
                var expectedText = lines.join("\n");

                myDocument.setText(text);
                myEditor.setSelection({line: 2, ch: 0}, {line: 2, ch: 5});
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 0}, end: {line: 2, ch: 6}});
            });

            it("should line comment in block comment prefix or sufix starting lines", function () {
                var lines = coffeeContent.split("\n");
                lines[0] = "#foo = 42";
                lines[3] = "#number = -42";
                var text = getContentCommented(1, 3, lines.join("\n"));

                lines = text.split("\n");
                lines[0] = "##foo = 42";
                lines[1] = "####";
                lines[4] = "####";
                lines[5] = "##number = -42";
                var expectedText = lines.join("\n");

                myDocument.setText(text);
                myEditor.setSelection({line: 0, ch: 0}, {line: 2, ch: 0});
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                myEditor.setSelection({line: 4, ch: 0}, {line: 6, ch: 0});
                CommandManager.execute(Commands.EDIT_LINE_COMMENT, myEditor);

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 4, ch: 0}, end: {line: 6, ch: 0}});
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

            describe("with multiple selections", function () {
                it("should duplicate multiple lines containing cursors", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 3}, end: {line: 1, ch: 3}},
                                            {start: {line: 3, ch: 3}, end: {line: 3, ch: 3}}]);

                    CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);

                    var lines = defaultContent.split("\n");
                    lines.splice(4, 0, lines[3]);
                    lines.splice(2, 0, lines[1]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 3}, end: {line: 2, ch: 3}, primary: false, reversed: false},
                                      {start: {line: 5, ch: 3}, end: {line: 5, ch: 3}, primary: true, reversed: false}]);
                });

                it("should not duplicate the same line multiple times", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 3}, end: {line: 1, ch: 3}},
                                            {start: {line: 1, ch: 6}, end: {line: 1, ch: 6}},
                                            {start: {line: 3, ch: 3}, end: {line: 3, ch: 3}}]);

                    CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);

                    var lines = defaultContent.split("\n");
                    lines.splice(4, 0, lines[3]);
                    lines.splice(2, 0, lines[1]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 3}, end: {line: 2, ch: 3}, primary: false, reversed: false},
                                      {start: {line: 2, ch: 6}, end: {line: 2, ch: 6}, primary: false, reversed: false},
                                      {start: {line: 5, ch: 3}, end: {line: 5, ch: 3}, primary: true, reversed: false}]);
                });

                it("should duplicate multiple range selections", function () {
                    // select "bar" on line 1, cursor on line 2, and "a()" on line 3
                    myEditor.setSelections([{start: {line: 1, ch: 13}, end: {line: 1, ch: 16}},
                                            {start: {line: 3, ch: 8}, end: {line: 3, ch: 11}}]);

                    CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);

                    var lines = defaultContent.split("\n");
                    lines[1] = "    function barbar() {";
                    lines[3] = "        a()a();";
                    var expectedText = lines.join("\n");

                    expect(myDocument.getText()).toEqual(expectedText);
                    expectSelections([{start: {line: 1, ch: 16}, end: {line: 1, ch: 19}, primary: false, reversed: false},
                                      {start: {line: 3, ch: 11}, end: {line: 3, ch: 14}, primary: true, reversed: false}]);
                });

                it("should duplicate a mix of cursors and ranges", function () {
                    // select "bar" on line 1, cursor on line 2, and "a()" on line 3
                    myEditor.setSelections([{start: {line: 1, ch: 13}, end: {line: 1, ch: 16}},
                                            {start: {line: 2, ch: 3}, end: {line: 2, ch: 3}},
                                            {start: {line: 3, ch: 8}, end: {line: 3, ch: 11}}]);

                    CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);

                    var lines = defaultContent.split("\n");
                    lines[1] = "    function barbar() {";
                    lines[3] = "        a()a();";
                    lines.splice(3, 0, lines[2]);
                    var expectedText = lines.join("\n");

                    expect(myDocument.getText()).toEqual(expectedText);
                    expectSelections([{start: {line: 1, ch: 16}, end: {line: 1, ch: 19}, primary: false, reversed: false},
                                      {start: {line: 3, ch: 3}, end: {line: 3, ch: 3}, primary: false, reversed: false},
                                      {start: {line: 4, ch: 11}, end: {line: 4, ch: 14}, primary: true, reversed: false}]);
                });

                it("should duplicate line first, then range, if both a cursor and range are on the same line", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 3}, end: {line: 1, ch: 3}},
                                            {start: {line: 1, ch: 13}, end: {line: 1, ch: 16}}]);
                    CommandManager.execute(Commands.EDIT_DUPLICATE, myEditor);

                    var lines = defaultContent.split("\n");
                    lines.splice(2, 0, "    function barbar() {");
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 3}, end: {line: 2, ch: 3}, primary: false, reversed: false},
                                      {start: {line: 2, ch: 16}, end: {line: 2, ch: 19}, primary: true, reversed: false}]);
                });
            });
        });


        describe("Move Lines Up/Down", function () {
            function swapLines(lines, swaps) {
                _.each(swaps, function (swap) {
                    var temp = lines[swap[0]], i;
                    for (i = 0; i < swap.length - 1; i++) {
                        lines[swap[i]] = lines[swap[i + 1]];
                    }
                    lines[swap[swap.length - 1]] = temp;
                });
            }

            beforeEach(setupFullEditor);

            it("should move whole line up if no selection", function () {
                // place cursor in middle of line 1
                myEditor.setCursorPos(1, 10);

                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[0, 1]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 0, ch: 10});
            });

            it("should move whole line down if no selection", function () {
                // place cursor in middle of line 1
                myEditor.setCursorPos(1, 10);

                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[2, 1]]);
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
                swapLines(lines, [[5, 6]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 5, ch: 0});
            });

            it("should move down empty line", function () {
                // place cursor on line 6
                myEditor.setCursorPos(6, 0);

                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[7, 6]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 7, ch: 0});
            });

            it("should move up when entire line selected, excluding newline", function () {
                // select all of line 1, EXcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 1, ch: 20});

                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[0, 1]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 0, ch: 0}, end: {line: 0, ch: 20}});
            });

            it("should move down when entire line selected, excluding newline", function () {
                // select all of line 1, EXcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 1, ch: 20});

                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[2, 1]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 0}, end: {line: 2, ch: 20}});
            });

            it("should move up when entire line selected, including newline", function () {
                // select all of line 1, INcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});

                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[0, 1]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 0, ch: 0}, end: {line: 1, ch: 0}});
            });

            it("should move down when entire line selected, including newline", function () {
                // select all of line 1, INcluding trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});

                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[2, 1]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 2, ch: 0}, end: {line: 3, ch: 0}});
            });

            it("should move up when multiple lines selected", function () {
                // select lines 2-3
                myEditor.setSelection({line: 2, ch: 0}, {line: 4, ch: 0});

                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[1, 2, 3]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 0}, end: {line: 3, ch: 0}});
            });

            it("should move down when multiple lines selected", function () {
                // select lines 2-3
                myEditor.setSelection({line: 2, ch: 0}, {line: 4, ch: 0});

                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[4, 3, 2]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 3, ch: 0}, end: {line: 5, ch: 0}});
            });

            it("should move up selection crossing line boundary", function () {
                // select from middle of line 2 to middle of line 3
                myEditor.setSelection({line: 2, ch: 8}, {line: 3, ch: 11});

                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[1, 2, 3]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 1, ch: 8}, end: {line: 2, ch: 11}});
            });

            it("should move down selection crossing line boundary", function () {
                // select from middle of line 2 to middle of line 3
                myEditor.setSelection({line: 2, ch: 8}, {line: 3, ch: 11});

                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[4, 3, 2]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 3, ch: 8}, end: {line: 4, ch: 11}});
            });

            it("should move the last line up", function () {
                // place cursor in last line
                myEditor.setCursorPos(7, 0);

                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[6, 7]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 6, ch: 0});
            });

            it("should move the first line down", function () {
                // place cursor in first line
                myEditor.setCursorPos(0, 0);

                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[1, 0]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: 0});
            });

            it("should move the last lines up", function () {
                // select lines 6-7
                myEditor.setSelection({line: 6, ch: 0}, {line: 7, ch: 1});

                CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[5, 6, 7]]);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectSelection({start: {line: 5, ch: 0}, end: {line: 6, ch: 1}});
            });

            it("should move the first lines down", function () {
                // select lines 0-1
                myEditor.setSelection({line: 0, ch: 0}, {line: 2, ch: 0});

                CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                var lines = defaultContent.split("\n");
                swapLines(lines, [[2, 1, 0]]);
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

            describe("with multiple selections", function () {
                it("should move discontiguous lines up", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}},
                                            {start: {line: 5, ch: 4}, end: {line: 5, ch: 4}}]);

                    CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[0, 1], [2, 3], [4, 5]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 4, ch: 4}, end: {line: 4, ch: 4}, primary: true, reversed: false}]);
                });

                it("should move discontiguous lines down", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}},
                                            {start: {line: 5, ch: 4}, end: {line: 5, ch: 4}}]);

                    CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[2, 1], [4, 3], [6, 5]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 4, ch: 4}, end: {line: 4, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 6, ch: 4}, end: {line: 6, ch: 4}, primary: true, reversed: false}]);
                });

                it("should move adjacent single lines with multiple selections up together", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}}]);

                    CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[0, 1, 2]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: true, reversed: false}]);
                });

                it("should move adjacent single lines with multiple selections down together", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}}]);

                    CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[3, 2, 1]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}, primary: true, reversed: false}]);
                });

                it("should move adjacent blocks of lines with multiple selections up together", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 5}, end: {line: 2, ch: 6}},
                                            {start: {line: 3, ch: 3}, end: {line: 3, ch: 3}}]);

                    CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[0, 1, 2, 3]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 0, ch: 5}, end: {line: 1, ch: 6}, primary: false, reversed: false},
                                      {start: {line: 2, ch: 3}, end: {line: 2, ch: 3}, primary: true, reversed: false}]);
                });

                it("should move adjacent blocks of lines with multiple selections down together", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 5}, end: {line: 2, ch: 6}},
                                            {start: {line: 3, ch: 3}, end: {line: 3, ch: 3}}]);

                    CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[4, 3, 2, 1]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 5}, end: {line: 3, ch: 6}, primary: false, reversed: false},
                                      {start: {line: 4, ch: 3}, end: {line: 4, ch: 3}, primary: true, reversed: false}]);
                });

                it("should move each line up only once if there are multiple cursors/selections on the same line, but preserve the selections", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 1, ch: 6}, end: {line: 1, ch: 6}, primary: true},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}},
                                            {start: {line: 3, ch: 5}, end: {line: 3, ch: 6}, reversed: true}]);

                    CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[0, 1], [2, 3]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 0, ch: 6}, end: {line: 0, ch: 6}, primary: true, reversed: false},
                                      {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 2, ch: 5}, end: {line: 2, ch: 6}, primary: false, reversed: true}]);
                });

                it("should move each line down only once if there are multiple cursors/selections on the same line, but preserve the selections", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 1, ch: 6}, end: {line: 1, ch: 6}, primary: true},
                                            {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}},
                                            {start: {line: 3, ch: 5}, end: {line: 3, ch: 6}, reversed: true}]);

                    CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[2, 1], [4, 3]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 2, ch: 6}, end: {line: 2, ch: 6}, primary: true, reversed: false},
                                      {start: {line: 4, ch: 4}, end: {line: 4, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 4, ch: 5}, end: {line: 4, ch: 6}, primary: false, reversed: true}]);
                });

                it("should properly coalesce selections that end/start on the same line when moving up", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 2, ch: 4}},
                                            {start: {line: 2, ch: 6}, end: {line: 2, ch: 6}}]);

                    CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[0, 1, 2]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 0, ch: 4}, end: {line: 1, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 1, ch: 6}, end: {line: 1, ch: 6}, primary: true, reversed: false}]);
                });

                it("should properly coalesce selections that end/start on the same line when moving down", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 2, ch: 4}},
                                            {start: {line: 2, ch: 6}, end: {line: 2, ch: 6}}]);

                    CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                    var lines = defaultContent.split("\n");
                    swapLines(lines, [[3, 2, 1]]);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 4}, end: {line: 3, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 3, ch: 6}, end: {line: 3, ch: 6}, primary: true, reversed: false}]);
                });
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

            it("should not delete an extra line after a whole selected line", function () {
                myEditor.setSelection({line: 1, ch: 0}, {line: 2, ch: 0});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                var expectedText = defaultContent.split("\n");
                expectedText.splice(1, 1);
                expect(myDocument.getText()).toEqual(expectedText.join("\n"));
            });

            it("should not delete an extra line at the end of the document after a whole selected line", function () {
                myEditor.setSelection({line: 5, ch: 5}, {line: 7, ch: 0});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                var expectedText = defaultContent.split("\n");
                expectedText.splice(5, 2);
                expect(myDocument.getText()).toEqual(expectedText.join("\n"));
            });

            it("should not delete an extra line after several whole lines that are selected", function () {
                myEditor.setSelection({line: 0, ch: 0}, {line: 3, ch: 0});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                var expectedText = defaultContent.split("\n").slice(3).join("\n");
                expect(myDocument.getText()).toEqual(expectedText);
            });

            it("should delete multiple lines ending at the bottom when selection spans them", function () {
                myEditor.setSelection({line: 5, ch: 5}, {line: 7, ch: 1});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                var expectedText = defaultContent.split("\n").slice(0, 5).join("\n");
                expect(myDocument.getText()).toEqual(expectedText);
            });

            it("should leave empty text when all lines are selected", function () {
                myEditor.setSelection({line: 0, ch: 4}, {line: 7, ch: 1});
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);
                expect(myDocument.getText()).toEqual("");
            });

            describe("with multiple selections", function () {
                it("should delete lines containing any cursor in a multiple selection", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                            {start: {line: 2, ch: 5}, end: {line: 2, ch: 5}},
                                            {start: {line: 6, ch: 0}, end: {line: 6, ch: 0}}]);
                    CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                    expect(myDocument.getText()).toEqual(contentWithDeletedLines([0, 2, 6]));
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}, primary: false, reversed: false},
                                                             {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                                             {start: {line: 4, ch: 0}, end: {line: 4, ch: 0}, primary: true, reversed: false}]);
                });

                it("should delete lines containing any range in a multiple selection", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 3}, end: {line: 0, ch: 5}},
                                            {start: {line: 2, ch: 2}, end: {line: 2, ch: 5}},
                                            {start: {line: 6, ch: 0}, end: {line: 6, ch: 1}}]);
                    CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                    expect(myDocument.getText()).toEqual(contentWithDeletedLines([0, 2, 6]));
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}, primary: false, reversed: false},
                                                             {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                                             {start: {line: 4, ch: 0}, end: {line: 4, ch: 0}, primary: true, reversed: false}]);
                });

                it("should handle multiple cursors/selections on the same line (only deleting the line once)", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                            {start: {line: 2, ch: 3}, end: {line: 2, ch: 5}},
                                            {start: {line: 2, ch: 7}, end: {line: 2, ch: 7}},
                                            {start: {line: 6, ch: 0}, end: {line: 6, ch: 0}}]);
                    CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                    expect(myDocument.getText()).toEqual(contentWithDeletedLines([0, 2, 6]));
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}, primary: false, reversed: false},
                                                             {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                                             {start: {line: 4, ch: 0}, end: {line: 4, ch: 0}, primary: true, reversed: false}]);
                });

                it("should handle multiple selections that span multiple lines", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 5}, end: {line: 1, ch: 5}},
                                            {start: {line: 3, ch: 4}, end: {line: 4, ch: 5}}]);
                    CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                    expect(myDocument.getText()).toEqual(contentWithDeletedLines([0, 1, 3, 4]));
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}, primary: false, reversed: false},
                                                             {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: true, reversed: false}]);
                });

                it("should delete the rest of a selection that starts on a line previously deleted", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 5}, end: {line: 1, ch: 3}},
                                            {start: {line: 1, ch: 5}, end: {line: 3, ch: 5}}]);
                    CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                    expect(myDocument.getText()).toEqual(contentWithDeletedLines([0, 1, 2, 3]));
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}, primary: true, reversed: false}]);
                });

                it("should merge the primary selection into another selection on the same line", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                            {start: {line: 2, ch: 5}, end: {line: 2, ch: 5}},
                                            {start: {line: 2, ch: 7}, end: {line: 2, ch: 7}, primary: true},
                                            {start: {line: 6, ch: 0}, end: {line: 6, ch: 0}}]);
                    CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                    expect(myDocument.getText()).toEqual(contentWithDeletedLines([0, 2, 6]));
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}, primary: false, reversed: false},
                                                             {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: true, reversed: false},
                                                             {start: {line: 4, ch: 0}, end: {line: 4, ch: 0}, primary: false, reversed: false}]);
                });
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

            it("should properly handle multiple selection, including first and last line deletion", function () {
                makeEditorWithRange({startLine: 1, endLine: 6});
                myEditor.setSelections([{start: {line: 1, ch: 5}, end: {line: 1, ch: 5}},
                                        {start: {line: 3, ch: 5}, end: {line: 3, ch: 5}},
                                        {start: {line: 6, ch: 0}, end: {line: 6, ch: 0}}]);
                CommandManager.execute(Commands.EDIT_DELETE_LINES, myEditor);

                expect(myDocument.getText()).toEqual(contentWithDeletedLines([1, 3, 6]));
                expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                                         {start: {line: 2, ch: 0}, end: {line: 2, ch: 0}, primary: false, reversed: false},
                                                         {start: {line: 3, ch: 5}, end: {line: 3, ch: 5}, primary: true, reversed: false}]);
            });
        });


        describe("Select Line", function () {
            // Note that these indirectly test Editor.expandSelectionsToLines() as well.
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

            describe("with multiple selections", function () {
                it("should extend multiple cursors to multiple lines", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                            {start: {line: 3, ch: 9}, end: {line: 3, ch: 9}},
                                            {start: {line: 7, ch: 0}, end: {line: 7, ch: 0}}]);
                    CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);

                    expectSelections([{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 3, ch: 0}, end: {line: 4, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 7, ch: 0}, end: {line: 7, ch: 1}, reversed: false, primary: true}]);
                });

                it("should extend multiple selections to multiple lines", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 0, ch: 5}},
                                            {start: {line: 3, ch: 0}, end: {line: 3, ch: 9}},
                                            {start: {line: 7, ch: 0}, end: {line: 7, ch: 1}}]);
                    CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);

                    expectSelections([{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 3, ch: 0}, end: {line: 4, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 7, ch: 0}, end: {line: 7, ch: 1}, reversed: false, primary: true}]);
                });

                it("should extend multiple multi-line selections to whole lines, and handle end properly", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 2}, end: {line: 1, ch: 3}},
                                            {start: {line: 3, ch: 2}, end: {line: 4, ch: 3}},
                                            {start: {line: 6, ch: 2}, end: {line: 7, ch: 0}}]);
                    CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);

                    expectSelections([{start: {line: 0, ch: 0}, end: {line: 2, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 3, ch: 0}, end: {line: 5, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 6, ch: 0}, end: {line: 7, ch: 1}, reversed: false, primary: true}]);
                });

                it("should extend whole lines in multiple selection to next line, except at end", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}},
                                            {start: {line: 3, ch: 0}, end: {line: 4, ch: 0}},
                                            {start: {line: 7, ch: 0}, end: {line: 7, ch: 1}}]);
                    CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);

                    expectSelections([{start: {line: 0, ch: 0}, end: {line: 2, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 3, ch: 0}, end: {line: 5, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 7, ch: 0}, end: {line: 7, ch: 1}, reversed: false, primary: true}]);
                });

                it("should extend multiple lines in multiple selection to additional line, and handle end properly", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 2, ch: 0}},
                                            {start: {line: 4, ch: 0}, end: {line: 7, ch: 0}}]);
                    CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);

                    expectSelections([{start: {line: 0, ch: 0}, end: {line: 3, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 4, ch: 0}, end: {line: 7, ch: 1}, reversed: false, primary: true}]);
                });

                it("should merge selections that collide", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 3}, end: {line: 1, ch: 3}},
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}}]);
                    CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);

                    expectSelections([{start: {line: 1, ch: 0}, end: {line: 3, ch: 0}, reversed: false, primary: true}]);
                });

                it("should track a non-default primary selection", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}},
                                            {start: {line: 3, ch: 0}, end: {line: 4, ch: 0}, primary: true},
                                            {start: {line: 7, ch: 0}, end: {line: 7, ch: 1}}]);
                    CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);

                    expectSelection({start: {line: 3, ch: 0}, end: {line: 5, ch: 0}});
                });

                it("should track a reversed selection", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}},
                                            {start: {line: 3, ch: 0}, end: {line: 4, ch: 0}, reversed: true},
                                            {start: {line: 7, ch: 0}, end: {line: 7, ch: 1}}]);
                    CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);

                    expectSelections([{start: {line: 0, ch: 0}, end: {line: 2, ch: 0}, reversed: false, primary: false},
                                      {start: {line: 3, ch: 0}, end: {line: 5, ch: 0}, reversed: true, primary: false},
                                      {start: {line: 7, ch: 0}, end: {line: 7, ch: 1}, reversed: false, primary: true}]);
                });
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

            it("should properly expand multiselection at start and end", function () {
                makeEditorWithRange({startLine: 1, endLine: 5});
                myEditor.setSelections([{start: {line: 1, ch: 5}, end: {line: 1, ch: 5}},
                                        {start: {line: 5, ch: 0}, end: {line: 5, ch: 0}}]);
                CommandManager.execute(Commands.EDIT_SELECT_LINE, myEditor);

                expectSelections([{start: {line: 1, ch: 0}, end: {line: 2, ch: 0}, reversed: false, primary: false},
                                  {start: {line: 5, ch: 0}, end: {line: 5, ch: 5}, reversed: false, primary: true}]);
            });
        });

        describe("Open Line Above and Below", function () {
            var indentUnit  = SpecRunnerUtils.EDITOR_USE_TABS ? 1 : SpecRunnerUtils.EDITOR_SPACE_UNITS,
                indentation = (function () {
                    // generate indent string once
                    if (SpecRunnerUtils.EDITOR_USE_TABS) {
                        return "\t";
                    }
                    var spaces = [];
                    spaces.length = indentUnit + 1;
                    return spaces.join(" ");
                }());

            beforeEach(setupFullEditor);

            it("should insert new line above if no selection", function () {
                // place cursor in line 1
                myEditor.setCursorPos(1, 10);

                CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(1, 0, indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: indentUnit});
            });

            it("should insert new line above the first line if no selection", function () {
                // place cursor in the first line
                myEditor.setCursorPos(0, 0);

                CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(0, 0, "");
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 0, ch: 0});
            });

            it("should insert new line above the last line if no selection", function () {
                // place cursor in the last line
                myEditor.setCursorPos(7, 0);

                CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(7, 0, indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 7, ch: indentUnit});
            });

            it("should insert new line above with no indentation if no selection", function () {
                // place cursor in the middle of line 0
                myEditor.setCursorPos(0, 10);

                CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(0, 0, "");
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 0, ch: 0});
            });

            it("should insert new line above when characters selected", function () {
                // select characters 0-10 in line 1
                myEditor.setSelection({line: 1, ch: 0}, {line: 1, ch: 10});

                CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(1, 0, indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: indentUnit});
            });

            it("should insert new line above when linewise selection", function () {
                // select all of line 1 and 2, Including trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 3, ch: 0});

                CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(1, 0, indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: indentUnit});
            });

            it("should insert new line above when multiple line selection", function () {
                // selection from line 2 character 6 to line 5 character 2
                myEditor.setSelection({line: 2, ch: 6}, {line: 5, ch: 2});

                CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(2, 0, indentation + indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 2, ch: indentUnit * 2});
            });

            it("should insert new line below when no selection", function () {
                // place cursor in line 0
                myEditor.setCursorPos(0, 10);

                CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(1, 0, indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: indentUnit});
            });

            it("should insert new line below the first line if no selection", function () {
                // place cursor in the first line
                myEditor.setCursorPos(0, 0);

                CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(1, 0, indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: indentUnit});
            });

            it("should insert new line below the last line if no selection", function () {
                // place cursor in the last line
                myEditor.setCursorPos(7, 0);

                CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(8, 0, "");
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 8, ch: 0});
            });

            it("should insert new line below with no indentation if no selection", function () {
                // place cursor in line 7 character 1
                myEditor.setCursorPos(7, 1);

                CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(8, 0, "");
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 8, ch: 0});
            });

            it("should insert new line below when characters selected", function () {
                // select characters 0-10 in line 0
                myEditor.setSelection({line: 0, ch: 0}, {line: 0, ch: 10});

                CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(1, 0, indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 1, ch: indentUnit});
            });

            it("should insert new line below when linewise selection", function () {
                // select all of line 1 and 2, Including trailing \n
                myEditor.setSelection({line: 1, ch: 0}, {line: 3, ch: 0});

                CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(3, 0, indentation + indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 3, ch: indentUnit * 2});
            });

            it("should insert new line below when multiple line selection", function () {
                // selection from line 1 character 4 to line 4 character 2
                myEditor.setSelection({line: 1, ch: 4}, {line: 4, ch: 2});

                CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                var lines = defaultContent.split("\n");
                lines.splice(5, 0, indentation + indentation);
                var expectedText = lines.join("\n");

                expect(myDocument.getText()).toEqual(expectedText);
                expectCursorAt({line: 5, ch: indentUnit * 2});
            });

            describe("with multiple selections", function () {
                it("should insert new line above each selection cursor/range", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 6}},
                                            {start: {line: 4, ch: 5}, end: {line: 5, ch: 8}}]);
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                    var lines = defaultContent.split("\n");
                    lines.splice(4, 0, indentation + indentation);
                    lines.splice(2, 0, indentation + indentation);
                    lines.splice(1, 0, indentation);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 3, ch: 8}, end: {line: 3, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 6, ch: 8}, end: {line: 6, ch: 8}, primary: true, reversed: false}]);
                });

                it("should ignore multiple selections on same line when inserting above", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 6}},
                                            {start: {line: 2, ch: 7}, end: {line: 2, ch: 7}},
                                            {start: {line: 4, ch: 5}, end: {line: 5, ch: 8}}]);
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                    var lines = defaultContent.split("\n");
                    lines.splice(4, 0, indentation + indentation);
                    lines.splice(2, 0, indentation + indentation);
                    lines.splice(1, 0, indentation);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 3, ch: 8}, end: {line: 3, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 6, ch: 8}, end: {line: 6, ch: 8}, primary: true, reversed: false}]);
                });

                it("should not ignore multiple selections that end on the same line if the second one starts on a different line when inserting above", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                            {start: {line: 2, ch: 4}, end: {line: 4, ch: 2}},
                                            {start: {line: 4, ch: 6}, end: {line: 4, ch: 6}},
                                            {start: {line: 5, ch: 5}, end: {line: 5, ch: 8}}]);
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                    var lines = defaultContent.split("\n");
                    lines.splice(5, 0, indentation + indentation);
                    lines.splice(4, 0, indentation + indentation);
                    lines.splice(2, 0, indentation + indentation);
                    lines.splice(1, 0, indentation);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: false, reversed: false},
                                      {start: {line: 3, ch: 8}, end: {line: 3, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 6, ch: 8}, end: {line: 6, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 8, ch: 8}, end: {line: 8, ch: 8}, primary: true, reversed: false}]);
                });
                it("should insert new line below each selection cursor/range", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 6}},
                                            {start: {line: 4, ch: 5}, end: {line: 5, ch: 8}}]);
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                    var lines = defaultContent.split("\n");
                    lines.splice(6, 0, indentation);
                    lines.splice(3, 0, indentation + indentation);
                    lines.splice(2, 0, indentation + indentation);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 4, ch: 8}, end: {line: 4, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 8, ch: 4}, end: {line: 8, ch: 4}, primary: true, reversed: false}]);
                });

                it("should ignore multiple selections on same line when inserting below", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 6}},
                                            {start: {line: 2, ch: 7}, end: {line: 2, ch: 7}},
                                            {start: {line: 4, ch: 5}, end: {line: 5, ch: 8}}]);
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                    var lines = defaultContent.split("\n");
                    lines.splice(6, 0, indentation);
                    lines.splice(3, 0, indentation + indentation);
                    lines.splice(2, 0, indentation + indentation);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 4, ch: 8}, end: {line: 4, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 8, ch: 4}, end: {line: 8, ch: 4}, primary: true, reversed: false}]);
                });

                it("should not ignore multiple selections that start on the same line if the second one ends on a different line when inserting below", function () {
                    myEditor.setSelections([{start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 6}},
                                            {start: {line: 4, ch: 2}, end: {line: 4, ch: 2}},
                                            {start: {line: 4, ch: 5}, end: {line: 5, ch: 8}}]);
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                    var lines = defaultContent.split("\n");
                    lines.splice(6, 0, indentation);
                    lines.splice(5, 0, indentation + indentation);
                    lines.splice(3, 0, indentation + indentation);
                    lines.splice(2, 0, indentation + indentation);
                    expect(myDocument.getText()).toEqual(lines.join("\n"));
                    expectSelections([{start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 4, ch: 8}, end: {line: 4, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 7, ch: 8}, end: {line: 7, ch: 8}, primary: false, reversed: false},
                                      {start: {line: 9, ch: 4}, end: {line: 9, ch: 4}, primary: true, reversed: false}]);
                });
            });
        });

        describe("Add Line to Selection", function () {
            beforeEach(setupFullEditor);

            it("should add a cursor on the next line after a single cursor selection and make it primary", function () {
                myEditor.setSelection({line: 1, ch: 5}, {line: 1, ch: 5});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_NEXT_LINE, myEditor);
                expectSelections([{start: {line: 1, ch: 5}, end: {line: 1, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 5}, end: {line: 2, ch: 5}, primary: true, reversed: false}]);
            });

            it("should add a cursor on the previous line before a single cursor selection and make it primary", function () {
                myEditor.setSelection({line: 1, ch: 5}, {line: 1, ch: 5});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_PREV_LINE, myEditor);
                expectSelections([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: true, reversed: false},
                                  {start: {line: 1, ch: 5}, end: {line: 1, ch: 5}, primary: false, reversed: false}]);
            });

            it("should add a cursor on the next line after a single-line range selection, below the end pos of the range", function () {
                myEditor.setSelection({line: 1, ch: 5}, {line: 1, ch: 8});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_NEXT_LINE, myEditor);
                expectSelections([{start: {line: 1, ch: 5}, end: {line: 1, ch: 8}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: true, reversed: false}]);
            });

            it("should add a cursor on the previous line after a single-line range selection, above the start pos of the range", function () {
                myEditor.setSelection({line: 1, ch: 5}, {line: 1, ch: 8});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_PREV_LINE, myEditor);
                expectSelections([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: true, reversed: false},
                                  {start: {line: 1, ch: 5}, end: {line: 1, ch: 8}, primary: false, reversed: false}]);
            });

            it("should add a cursor on the next line after a multi-line range selection, below the end pos of the range", function () {
                myEditor.setSelection({line: 1, ch: 5}, {line: 2, ch: 8});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_NEXT_LINE, myEditor);
                expectSelections([{start: {line: 1, ch: 5}, end: {line: 2, ch: 8}, primary: false, reversed: false},
                                  {start: {line: 3, ch: 8}, end: {line: 3, ch: 8}, primary: true, reversed: false}]);
            });

            it("should add a cursor on the previous line before a multi-line range selection, above the start pos of the range", function () {
                myEditor.setSelection({line: 1, ch: 5}, {line: 2, ch: 8});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_PREV_LINE, myEditor);
                expectSelections([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: true, reversed: false},
                                  {start: {line: 1, ch: 5}, end: {line: 2, ch: 8}, primary: false, reversed: false}]);
            });

            it("should do nothing if trying to add selection down at last line", function () {
                myEditor.setSelection({line: 7, ch: 0}, {line: 7, ch: 0});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_NEXT_LINE, myEditor);
                expectSelections([{start: {line: 7, ch: 0}, end: {line: 7, ch: 0}, primary: true, reversed: false}]);
            });

            it("should do nothing if trying to add selection up at first line", function () {
                myEditor.setSelection({line: 0, ch: 5}, {line: 0, ch: 5});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_PREV_LINE, myEditor);
                expectSelections([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: true, reversed: false}]);
            });

            it("should add cursors below each range in a multiple selection, making the correct one primary", function () {
                myEditor.setSelections([{start: {line: 1, ch: 5}, end: {line: 1, ch: 5}},
                                        {start: {line: 3, ch: 2}, end: {line: 3, ch: 8}}]);
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_NEXT_LINE, myEditor);
                expectSelections([{start: {line: 1, ch: 5}, end: {line: 1, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 5}, end: {line: 2, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 3, ch: 2}, end: {line: 3, ch: 8}, primary: false, reversed: false},
                                  {start: {line: 4, ch: 8}, end: {line: 4, ch: 8}, primary: true, reversed: false}]);
            });

            it("should add cursors above each range in a multiple selection, making the correct one primary", function () {
                myEditor.setSelections([{start: {line: 1, ch: 5}, end: {line: 1, ch: 5}},
                                        {start: {line: 3, ch: 2}, end: {line: 3, ch: 8}}]);
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_PREV_LINE, myEditor);
                expectSelections([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 5}, end: {line: 1, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 2}, end: {line: 2, ch: 2}, primary: true, reversed: false},
                                  {start: {line: 3, ch: 2}, end: {line: 3, ch: 8}, primary: false, reversed: false}]);
            });

            it("should not add cursors downward that overlap another selection", function () {
                myEditor.setSelections([{start: {line: 1, ch: 5}, end: {line: 1, ch: 5}},
                                        {start: {line: 2, ch: 2}, end: {line: 2, ch: 8}}]);
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_NEXT_LINE, myEditor);
                expectSelections([{start: {line: 1, ch: 5}, end: {line: 1, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 2}, end: {line: 2, ch: 8}, primary: false, reversed: false},
                                  {start: {line: 3, ch: 8}, end: {line: 3, ch: 8}, primary: true, reversed: false}]);
            });

            it("should not add cursors upward that overlap another selection", function () {
                myEditor.setSelections([{start: {line: 1, ch: 2}, end: {line: 1, ch: 8}},
                                        {start: {line: 2, ch: 5}, end: {line: 2, ch: 5}}]);
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_PREV_LINE, myEditor);
                expectSelections([{start: {line: 0, ch: 2}, end: {line: 0, ch: 2}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 2}, end: {line: 1, ch: 8}, primary: true, reversed: false},
                                  {start: {line: 2, ch: 5}, end: {line: 2, ch: 5}, primary: false, reversed: false}]);
            });

        });

        describe("Add Line to Selection with Tabs", function () {
            beforeEach(function () {
                setupFullEditor(tabbedContent);
            });

            it("should add a cursor on the next line before a single cursor in same visual position", function () {
                myEditor.setSelection({line: 1, ch: 8}, {line: 1, ch: 8});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_NEXT_LINE, myEditor);
                expectSelections([{start: {line: 1, ch:  8}, end: {line: 1, ch:  8}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 12}, end: {line: 2, ch: 12}, primary: true,  reversed: false}]);
            });

            it("should add a cursor on the previous line before a single cursor selection in same visual position", function () {
                myEditor.setSelection({line: 2, ch: 12}, {line: 2, ch: 12});
                CommandManager.execute(Commands.EDIT_ADD_CUR_TO_PREV_LINE, myEditor);
                expectSelections([{start: {line: 1, ch:  8}, end: {line: 1, ch:  8}, primary: true,  reversed: false},
                                  {start: {line: 2, ch: 12}, end: {line: 2, ch: 12}, primary: false, reversed: false}]);
            });
        });

        describe("EditorCommandHandlers Integration", function () {
            this.category = "integration";

            beforeFirst(function () {
                createTestWindow(this);
            });

            afterLast(function () {
                closeTestWindow();
            });


            describe("Move Lines Up/Down - inline editor", function () {

                var moveContent = ".testClass {\n" +
                                  "    color: red;\n" +
                                  "}";

                beforeEach(function () {
                    openInlineEditor(this);
                });

                afterEach(function () {
                    closeFilesInTestWindow();
                });


                it("should not move the first line of the inline editor up", function () {
                    myEditor.setCursorPos({line: 0, ch: 5});
                    CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                    expect(myEditor.document.getText()).toEqual(moveContent);
                    expect(myEditor._codeMirror.doc.historySize().undo).toBe(0);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(2);
                });

                it("should not move the last line of the inline editor down", function () {
                    myEditor.setCursorPos({line: 2, ch: 5});
                    CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                    expect(myEditor.document.getText()).toEqual(moveContent);
                    expect(myEditor._codeMirror.doc.historySize().undo).toBe(0);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(2);
                });

                it("should be able to move the second to last line of the inline editor down", function () {
                    myEditor.setCursorPos({line: 1, ch: 5});
                    CommandManager.execute(Commands.EDIT_LINE_DOWN, myEditor);

                    var lines = moveContent.split("\n");
                    var temp = lines[1];
                    lines[1] = lines[2];
                    lines[2] = temp;
                    var expectedText = lines.join("\n");

                    expect(myEditor.document.getText()).toEqual(expectedText);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(2);
                });

                it("should be able to move the last line of the inline editor up", function () {
                    myEditor.setCursorPos({line: 2, ch: 0});
                    CommandManager.execute(Commands.EDIT_LINE_UP, myEditor);

                    var lines = moveContent.split("\n");
                    var temp = lines[1];
                    lines[1] = lines[2];
                    lines[2] = temp;
                    var expectedText = lines.join("\n");

                    expect(myEditor.document.getText()).toEqual(expectedText);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(2);
                });
            });

            describe("Editor Navigation Commands", function () {
                it("should jump to definition", function () {
                    var promise,
                        selection;
                    runs(function () {
                        promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: testPath + "/test.js"});
                        waitsForDone(promise, "Open into working set");
                    });
                    runs(function () {
                        myEditor = EditorManager.getCurrentFullEditor();
                        myEditor.setCursorPos({line: 5, ch: 8});
                        promise = CommandManager.execute(Commands.NAVIGATE_JUMPTO_DEFINITION);
                        waitsForDone(promise, "Jump To Definition");
                    });
                    runs(function () {
                        selection = myEditor.getSelection();
                        expect(selection).toEqual({start: {line: 0, ch: 9},
                                                   end: {line: 0, ch: 15},
                                                   reversed: false});
                    });
                });
            });


            describe("Open Line Above and Below - inline editor", function () {

                var content = ".testClass {\n" +
                              "    color: red;\n" +
                              "}";

                beforeEach(function () {
                    openInlineEditor(this);
                });

                afterEach(function () {
                    closeFilesInTestWindow();
                });


                it("should insert new line above the first line of the inline editor", function () {
                    myEditor.setSelection({line: 0, ch: 4}, {line: 0, ch: 6});
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                    var lines = content.split("\n");
                    lines.splice(0, 0, "");
                    var expectedText = lines.join("\n");

                    expect(myEditor.document.getText()).toEqual(expectedText);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(3);
                });

                it("should insert new line below the first line of the inline editor", function () {
                    myEditor.setCursorPos({line: 0, ch: 3});
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                    var lines = content.split("\n");
                    lines.splice(1, 0, "    ");
                    var expectedText = lines.join("\n");

                    expect(myEditor.document.getText()).toEqual(expectedText);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(3);
                });

                it("should insert new line above the last line of the inline editor", function () {
                    myEditor.setSelection({line: 2, ch: 0}, {line: 2, ch: 1});
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                    var lines = content.split("\n");
                    lines.splice(2, 0, "    ");
                    var expectedText = lines.join("\n");

                    expect(myEditor.document.getText()).toEqual(expectedText);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(3);
                });

                it("should insert new line below the last line of the inline editor", function () {
                    myEditor.setCursorPos({line: 3, ch: 0});
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                    var lines = content.split("\n");
                    lines.splice(3, 0, "");
                    var expectedText = lines.join("\n");

                    expect(myEditor.document.getText()).toEqual(expectedText);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(3);
                });

                it("should insert new indented line above the second line of the inline editor", function () {
                    myEditor.setCursorPos({line: 1, ch: 5});
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_ABOVE, myEditor);

                    var lines = content.split("\n");
                    lines.splice(1, 0, "    ");
                    var expectedText = lines.join("\n");

                    expect(myEditor.document.getText()).toEqual(expectedText);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(3);
                });

                it("should insert new indented line below the second line of the inline editor", function () {
                    myEditor.setCursorPos({line: 1, ch: 5});
                    CommandManager.execute(Commands.EDIT_OPEN_LINE_BELOW, myEditor);

                    var lines = content.split("\n");
                    lines.splice(2, 0, "    ");
                    var expectedText = lines.join("\n");

                    expect(myEditor.document.getText()).toEqual(expectedText);
                    expect(myEditor.getFirstVisibleLine()).toBe(0);
                    expect(myEditor.getLastVisibleLine()).toBe(3);
                });
            });
        });
    });
});
