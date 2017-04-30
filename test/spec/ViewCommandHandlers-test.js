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

/*global describe, it, runs, expect, waitsForDone, beforeFirst, afterLast */

define(function (require, exports, module) {
    "use strict";

    var CommandManager,      // loaded from brackets.test
        Commands,            // loaded from brackets.test
        EditorManager,       // loaded from brackets.test
        FileViewController,
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    describe("ViewCommandHandlers", function () {
        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/ViewCommandHandlers-test-files"),
            testWindow;

        var CSS_FILE  = testPath + "/test.css",
            HTML_FILE = testPath + "/test.html";

        beforeFirst(function () {
            var promise;

            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                EditorManager       = testWindow.brackets.test.EditorManager;
                FileViewController  = testWindow.brackets.test.FileViewController;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });

            runs(function () {
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: HTML_FILE});
                waitsForDone(promise, "Open into working set");
            });

            runs(function () {
                // Open inline editor onto test.css's ".testClass" rule
                promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 8, ch: 11});
                waitsForDone(promise, "Open inline editor");
            });
        });

        afterLast(function () {
            testWindow          = null;
            CommandManager      = null;
            Commands            = null;
            EditorManager       = null;
            FileViewController  = null;
            SpecRunnerUtils.closeTestWindow();
        });


        function getEditors() {
            var editor = EditorManager.getCurrentFullEditor();
            return {
                editor: editor,
                inline: editor.getInlineWidgets()[0].editor
            };
        }


        describe("Adjust the Font Size", function () {
            it("should increase the font size in both editor and inline editor", function () {
                runs(function () {
                    var editors      = getEditors(),
                        originalSize = editors.editor.getTextHeight();

                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);

                    expect(editors.editor.getTextHeight()).toBeGreaterThan(originalSize);
                    expect(editors.inline.getTextHeight()).toBeGreaterThan(originalSize);
                });
            });

            it("should decrease the font size in both editor and inline editor", function () {
                runs(function () {
                    var editors      = getEditors(),
                        originalSize = editors.editor.getTextHeight();

                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);

                    expect(editors.editor.getTextHeight()).toBeLessThan(originalSize);
                    expect(editors.inline.getTextHeight()).toBeLessThan(originalSize);
                });
            });

            it("should restore the font size in both editor and inline editor", function () {
                runs(function () {
                    var editors      = getEditors();
                    var expectedSize = editors.editor.getTextHeight();

                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    CommandManager.execute(Commands.VIEW_RESTORE_FONT_SIZE);

                    expect(editors.editor.getTextHeight()).toBe(expectedSize);
                    expect(editors.inline.getTextHeight()).toBe(expectedSize);
                });
            });

            it("should keep the same font size when opening another document", function () {
                var promise, originalSize, editor;

                runs(function () {
                    editor       = EditorManager.getCurrentFullEditor();
                    originalSize = editor.getTextHeight();

                    promise = CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                    waitsForDone(promise, "Increase font size");
                });

                runs(function () {
                    // Open another document and bring it to the front
                    waitsForDone(FileViewController.openAndSelectDocument(CSS_FILE, FileViewController.PROJECT_MANAGER),
                                 "FILE_OPEN on file timeout", 1000);
                });

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor.getTextHeight()).toBeGreaterThan(originalSize);
                });
            });
        });
    });
});
