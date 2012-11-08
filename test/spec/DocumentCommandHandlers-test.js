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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, describe, beforeEach, afterEach, it, runs, waits, waitsFor, expect, brackets, waitsForDone */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CommandManager,      // loaded from brackets.test
        Commands,            // loaded from brackets.test
        DocumentCommandHandlers, // loaded from brackets.test
        DocumentManager,     // loaded from brackets.test
        SpecRunnerUtils     = require("spec/SpecRunnerUtils"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils           = require("file/FileUtils");
    
    
    describe("DocumentCommandHandlers", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/DocumentCommandHandlers-test-files"),
            testWindow;

        var TEST_JS_CONTENT = 'var myContent="This is awesome!";';
        var TEST_JS_NEW_CONTENT = "hello world";
        var TEST_JS_SECOND_NEW_CONTENT = "hello world 2";

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                DocumentCommandHandlers = testWindow.brackets.test.DocumentCommandHandlers;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
            });
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        // TODO (issue #115): test Commands.FILE_NEW. Current implementation of
        // ProjectManager.createNewItem() is tightly coupled to jstree UI and
        // events.

        describe("Close File", function () {
            it("should complete without error if no files are open", function () {
                var promise;

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_CLOSE);
                    waitsForDone(promise, "FILE_CLOSE");
                });
                runs(function () {
                    expect(testWindow.$("#main-toolbar .title").text()).toBe("");
                });
            });

            it("should close a file in the editor", function () {
                var promise;

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/test.js"});
                    waitsForDone(promise, "FILE_OPEN");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_CLOSE);
                    waitsForDone(promise, "FILE_CLOSE");
                });
                runs(function () {
                    expect(testWindow.$("#main-toolbar .title").text()).toBe("");
                });
            });
        });

        describe("Open File", function () {
            it("should open a file in the editor", function () {
                var promise;

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/test.js"});
                    waitsForDone(promise, "FILE_OPEN");
                });
                runs(function () {
                    expect(DocumentManager.getCurrentDocument().getText()).toBe(TEST_JS_CONTENT);
                });
            });
        });

        describe("Save File", function () {
            it("should save changes", function () {
                var filePath    = testPath + "/test.js",
                    promise;

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });

                // modify and save
                runs(function () {
                    DocumentManager.getCurrentDocument().setText(TEST_JS_NEW_CONTENT);

                    promise = CommandManager.execute(Commands.FILE_SAVE);
                    waitsForDone(promise, "FILE_SAVE");
                });

                // confirm file contents
                var actualContent = null, error = -1;
                runs(function () {
                    promise = FileUtils.readAsText(new NativeFileSystem.FileEntry(filePath))
                        .done(function (actualText) {
                            expect(actualText).toBe(TEST_JS_NEW_CONTENT);
                        });
                    waitsForDone(promise, "Read test file");
                });

                // reset file contents
                runs(function () {
                    promise = FileUtils.writeText(new NativeFileSystem.FileEntry(filePath), TEST_JS_CONTENT);
                    waitsForDone(promise, "Revert test file");
                });
            });
            
            // Regardless of platform, files with CRLF should be saved with CRLF and files with LF should be saved with LF
            it("should preserve line endings when saving changes", function () {
                var crlfText = "line1\r\nline2\r\nline3",
                    lfText   = "line1\nline2\nline3",
                    crlfPath = testPath + "/crlfTest.js",
                    lfPath   = testPath + "/lfTest.js",
                    promise;
                
                // create test files (Git rewrites line endings, so these can't be kept in src control)
                runs(function () {
                    promise = FileUtils.writeText(new NativeFileSystem.FileEntry(crlfPath), crlfText);
                    waitsForDone(promise, "Create CRLF test file");
                });
                runs(function () {
                    promise = FileUtils.writeText(new NativeFileSystem.FileEntry(lfPath), lfText);
                    waitsForDone(promise, "Create LF test file");
                });
                
                // open, modify, and save file (CRLF case)
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: crlfPath});
                    waitsForDone(promise, "Open CRLF test file");
                });
                
                runs(function () {
                    DocumentManager.getCurrentDocument().replaceRange("line2a\nline2b", {line: 1, ch: 0}, {line: 1, ch: 5});
                    promise = CommandManager.execute(Commands.FILE_SAVE);
                    waitsForDone(promise, "Save modified file");
                });
                
                // open, modify, and save file (LF case)
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: lfPath});
                    waitsForDone(promise, "Open LF test file");
                });
                
                runs(function () {
                    DocumentManager.getCurrentDocument().replaceRange("line2a\nline2b", {line: 1, ch: 0}, {line: 1, ch: 5});
                    promise = CommandManager.execute(Commands.FILE_SAVE);
                    waitsForDone(promise, "Save modified file");
                });
                
                // verify file contents
                runs(function () {
                    promise = FileUtils.readAsText(new NativeFileSystem.FileEntry(crlfPath))
                        .done(function (actualText) {
                            expect(actualText).toBe(crlfText.replace("line2", "line2a\r\nline2b"));
                        });
                    waitsForDone(promise, "Read CRLF test file");
                });
                
                runs(function () {
                    promise = FileUtils.readAsText(new NativeFileSystem.FileEntry(lfPath))
                        .done(function (actualText) {
                            expect(actualText).toBe(lfText.replace("line2", "line2a\nline2b"));
                        });
                    waitsForDone(promise, "Read LF test file");
                });
                
                // clean up
                runs(function () {
                    promise = SpecRunnerUtils.deleteFile(crlfPath);
                    waitsForDone(promise, "Remove CRLF test file");
                });
                runs(function () {
                    promise = SpecRunnerUtils.deleteFile(lfPath);
                    waitsForDone(promise, "Remove LF test file");
                });
            });
        });

        describe("Dirty File Handling", function () {

            beforeEach(function () {
                var promise;

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/test.js"});
                    waitsForDone(promise, "FILE_OPEN");
                });
            });

            it("should report clean immediately after opening a file", function () {
                runs(function () {
                    expect(DocumentManager.getCurrentDocument().isDirty).toBe(false);
                });
            });
            
            it("should report dirty when modified", function () {
                var doc = DocumentManager.getCurrentDocument();
                
                runs(function () {
                    // change editor content
                    doc.setText(TEST_JS_NEW_CONTENT);
                    
                    // verify Document dirty status
                    expect(doc.isDirty).toBe(true);
                });
            });

            it("should report dirty after undo and redo", function () {
                var doc = DocumentManager.getCurrentDocument();
                var editor = doc._masterEditor._codeMirror;
                
                runs(function () {
                    // change editor content, followed by undo and redo
                    doc.setText(TEST_JS_NEW_CONTENT);

                    editor.undo();
                    expect(doc.getText()).toBe(TEST_JS_CONTENT);
                    
                    editor.redo();
                    expect(doc.getText()).toBe(TEST_JS_NEW_CONTENT);
                    
                    expect(doc.isDirty).toBe(true);
                });
            });
            
            it("should report not dirty after explicit clean", function () {
                var doc = DocumentManager.getCurrentDocument();
                
                runs(function () {
                    doc.setText(TEST_JS_NEW_CONTENT);
                    doc._markClean();
                    expect(doc.isDirty).toBe(false);
                });
            });

            it("should report not dirty after undo", function () {
                runs(function () {
                    // change editor content, followed by undo
                    var doc = DocumentManager.getCurrentDocument();
                    var editor = doc._masterEditor._codeMirror;
                    
                    doc.setText(TEST_JS_NEW_CONTENT);
                    editor.undo();
                    
                    // verify Document dirty status
                    expect(doc.getText()).toBe(TEST_JS_CONTENT);
                    expect(DocumentManager.getCurrentDocument().isDirty).toBe(false);
                });
            });
            
            it("should update dirty flag with undo/redo after explicit clean", function () {
                var doc = DocumentManager.getCurrentDocument();
                var editor = doc._masterEditor._codeMirror;
                
                runs(function () {
                    // Change editor content and make that the new clean state
                    doc.setText(TEST_JS_NEW_CONTENT);
                    doc._markClean();
                    
                    // Undo past the clean state (and back to counter == 0)
                    editor.undo();
                    expect(doc.isDirty).toBe(true);
                    expect(doc.getText()).toBe(TEST_JS_CONTENT);
                    
                    // Redo: should be clean again
                    editor.redo();
                    expect(doc.isDirty).toBe(false);
                    expect(doc.getText()).toBe(TEST_JS_NEW_CONTENT);
                });
                
                // Wait > 400ms, else setText() below gets merged with earlier setText() despite intervening undo/redo
                // TODO (#1994): remove this once we're using CodeMirror v3
                waits(500);
                
                runs(function () {
                    // Add another change
                    doc.setText(TEST_JS_SECOND_NEW_CONTENT);
                    expect(doc.getText()).toBe(TEST_JS_SECOND_NEW_CONTENT);
                    expect(doc.isDirty).toBe(true);
                    
                    // Undo back to clean state
                    editor.undo();
                    expect(doc.isDirty).toBe(false);
                    expect(doc.getText()).toBe(TEST_JS_NEW_CONTENT);
                });
            });
            
            it("should report dirty after undo past clean state, followed by new change", function () {
                runs(function () {
                    // Change editor content and make that the new clean state
                    var doc = DocumentManager.getCurrentDocument();
                    var editor = doc._masterEditor._codeMirror;
                    
                    doc.setText(TEST_JS_NEW_CONTENT);
                    doc._markClean();
                    
                    // Undo past the clean state (and back to counter == 0)
                    editor.undo();
                    expect(doc.isDirty).toBe(true);
                    
                    // Make a new change - should remain dirty
                    doc.setText(TEST_JS_SECOND_NEW_CONTENT);
                    expect(doc.isDirty).toBe(true);
                    
                    // Should be impossible to get back to clean via undo/redo
                    editor.undo();
                    expect(doc.isDirty).toBe(true);
                    expect(doc.getText()).toBe(TEST_JS_CONTENT);
                    
                    editor.redo();
                    expect(doc.isDirty).toBe(true);
                    expect(doc.getText()).toBe(TEST_JS_SECOND_NEW_CONTENT);
                });
            });

        });
    });
});
