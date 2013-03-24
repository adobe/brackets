/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, describe, beforeEach, afterEach, it, runs, waitsFor, expect, brackets, waitsForDone */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CommandManager,      // loaded from brackets.test
        Commands,            // loaded from brackets.test
        EditorManager,       // loaded from brackets.test
        DocumentManager,     // loaded from brackets.test
        FileViewController,
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");
    
    
    describe("EditorOptionHandlers", function () {
        this.category = "integration";
        
        var testPath = SpecRunnerUtils.getTestPath("/spec/EditorOptionHandlers-test-files"),
            testWindow;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                EditorManager       = testWindow.brackets.test.EditorManager;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
                FileViewController  = testWindow.brackets.test.FileViewController;
               
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });
        
        function checkLineWrapping(firstPos, secondPos, shouldWrap, inlineEditor) {
            runs(function () {
                var firstLineBottom,
                    nextLineBottom,
                    editor = inlineEditor || EditorManager.getCurrentFullEditor();
                
                expect(editor).toBeTruthy();

                editor.setCursorPos(firstPos);
                firstLineBottom = editor._codeMirror.cursorCoords(null, "local").bottom;

                editor.setCursorPos(secondPos);
                nextLineBottom = editor._codeMirror.cursorCoords(null, "local").bottom;
                if (shouldWrap) {
                    expect(firstLineBottom).toBeLessThan(nextLineBottom);
                } else {
                    expect(firstLineBottom).toEqual(nextLineBottom);
                }
            });
        }

        var CSS_FILE  = testPath + "/test.css",
            HTML_FILE = testPath + "/test.html";

        it("should wrap long lines in main editor by default", function () {
            var promise,
                editor;
            
            runs(function () {
                promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: HTML_FILE});
                waitsForDone(promise, "Open into working set");

                // Use two cursor positions to detect line wrapping. First position at 
                // the beginning of a long line and the second position to be
                // somewhere on the long line that will be part of an extra line 
                // created by word-wrap and get its bottom coordinate.
                checkLineWrapping({line: 8, ch: 0}, {line: 8, ch: 210}, true);
            });
        });

        it("should also wrap long lines in inline editor by default", function () {
            var promise,
                inlineEditor;
                        
            runs(function () {
                promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: HTML_FILE});
                waitsForDone(promise, "Open into working set");
            });
            
            runs(function () {
                // Open inline editor onto test.css's ".testClass" rule
                promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 8, ch: 11});
                waitsForDone(promise, "Open inline editor");
            });
            
            runs(function () {
                inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editors[0];
                expect(inlineEditor).toBeTruthy();

                checkLineWrapping({line: 0, ch: 0}, {line: 0, ch: 160}, true, inlineEditor);
            });
        });
        
        it("should NOT wrap the long lines after turning off word-wrap", function () {
            var promise,
                editor;
            
            // Turn off word-wrap
            runs(function () {
                promise = CommandManager.execute(Commands.TOGGLE_WORD_WRAP);
                waitsForDone(promise, "Toggle word-wrap");
            });

            runs(function () {
                promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: CSS_FILE});
                waitsForDone(promise, "Open into working set");
                checkLineWrapping({line: 0, ch: 1}, {line: 0, ch: 180}, false);
            });
        });

        it("should NOT wrap the long lines in another document when word-wrap off", function () {
            var promise,
                editor,
                firstLineBottom,
                nextLineBottom;
            
            runs(function () {
                promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: CSS_FILE});
                waitsForDone(promise, "Open into working set");
            });

            // Turn off word-wrap
            runs(function () {
                promise = CommandManager.execute(Commands.TOGGLE_WORD_WRAP);
                waitsForDone(promise, "Toggle word-wrap");
            });
        
            runs(function () {
                // Open another document and bring it to the front
                waitsForDone(FileViewController.openAndSelectDocument(HTML_FILE, FileViewController.PROJECT_MANAGER),
                             "FILE_OPEN on file timeout", 1000);
                checkLineWrapping({line: 8, ch: 0}, {line: 8, ch: 210}, false);
            });
        });

        it("should NOT show active line in main editor by default", function () {
            var promise,
                editor,
                lineInfo;
            
            runs(function () {
                promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: HTML_FILE});
                waitsForDone(promise, "Open into working set");
            });
            
            runs(function () {
                editor = EditorManager.getCurrentFullEditor();
                expect(editor).toBeTruthy();

                editor.setCursorPos({line: 5, ch: 0});
                lineInfo = editor._codeMirror.lineInfo(5);
                expect(lineInfo.wrapClass).toBeUndefined();
            });
        });

        it("should NOT show active line in inline editor by default", function () {
            var promise,
                inlineEditor,
                lineInfo;
                        
            runs(function () {
                promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: HTML_FILE});
                waitsForDone(promise, "Open into working set");
            });
            
            runs(function () {
                // Open inline editor onto test.css's ".testClass" rule
                promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 8, ch: 11});
                waitsForDone(promise, "Open inline editor");
            });
            
            runs(function () {
                inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editors[0];
                expect(inlineEditor).toBeTruthy();

                lineInfo = inlineEditor._codeMirror.lineInfo(0);
                expect(lineInfo.wrapClass).toBeUndefined();
            });
        });
        
        it("should style active line after turning it on", function () {
            var promise,
                editor,
                lineInfo;
            
            // Turn on show active line
            runs(function () {
                promise = CommandManager.execute(Commands.TOGGLE_ACTIVE_LINE);
                waitsForDone(promise, "Toggle active line");
            });

            runs(function () {
                promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: CSS_FILE});
                waitsForDone(promise, "Open into working set");
            });

            runs(function () {
                editor = EditorManager.getCurrentFullEditor();
                expect(editor).toBeTruthy();

                lineInfo = editor._codeMirror.lineInfo(0);
                expect(lineInfo.wrapClass).toBe("CodeMirror-activeline");
            });
        });

        it("should style the active line when opening another document with show active line on", function () {
            var promise,
                editor,
                lineInfo;
            
            runs(function () {
                promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: CSS_FILE});
                waitsForDone(promise, "Open into working set");
            });

            // Turn on show active line
            runs(function () {
                promise = CommandManager.execute(Commands.TOGGLE_ACTIVE_LINE);
                waitsForDone(promise, "Toggle active line");
            });
        
            runs(function () {
                // Open another document and bring it to the front
                waitsForDone(FileViewController.openAndSelectDocument(HTML_FILE, FileViewController.PROJECT_MANAGER),
                             "FILE_OPEN on file timeout", 1000);
            });
            
            runs(function () {
                editor = EditorManager.getCurrentFullEditor();
                expect(editor).toBeTruthy();

                editor.setCursorPos({line: 3, ch: 5});
                lineInfo = editor._codeMirror.lineInfo(3);
                expect(lineInfo.wrapClass).toBe("CodeMirror-activeline");
            });
        });
    });
});
