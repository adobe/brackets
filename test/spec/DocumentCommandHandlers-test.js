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
/*global define, $, describe, beforeEach, afterEach, it, runs, waits, waitsFor, expect, brackets, waitsForDone, waitsForFail, spyOn, beforeFirst, afterLast, jasmine */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CommandManager,          // loaded from brackets.test
        Commands,                // loaded from brackets.test
        DocumentCommandHandlers, // loaded from brackets.test
        DocumentManager,         // loaded from brackets.test
        Dialogs,                 // loaded from brackets.test
        FileSystem,              // loaded from brackets.test
        FileViewController,      // loaded from brackets.test
        EditorManager,           // loaded from brackets.test
        SpecRunnerUtils          = require("spec/SpecRunnerUtils"),
        FileUtils                = require("file/FileUtils"),
        StringUtils              = require("utils/StringUtils"),
        Editor                   = require("editor/Editor");
                    
    
    describe("DocumentCommandHandlers", function () {
        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/DocumentCommandHandlers-test-files"),
            testWindow,
            _$,
            promise;

        var TEST_JS_CONTENT = 'var myContent="This is awesome!";';
        var TEST_JS_NEW_CONTENT = "hello world";
        var TEST_JS_SECOND_NEW_CONTENT = "hello world 2";
        
        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                _$ = testWindow.$;

                // Load module instances from brackets.test
                CommandManager          = testWindow.brackets.test.CommandManager;
                Commands                = testWindow.brackets.test.Commands;
                DocumentCommandHandlers = testWindow.brackets.test.DocumentCommandHandlers;
                DocumentManager         = testWindow.brackets.test.DocumentManager;
                Dialogs                 = testWindow.brackets.test.Dialogs;
                FileSystem              = testWindow.brackets.test.FileSystem;
                FileViewController      = testWindow.brackets.test.FileViewController;
                EditorManager           = testWindow.brackets.test.EditorManager;
            });
        });
        
        afterLast(function () {
            testWindow              = null;
            CommandManager          = null;
            Commands                = null;
            DocumentCommandHandlers = null;
            DocumentManager         = null;
            Dialogs                 = null;
            FileViewController      = null;
            SpecRunnerUtils.closeTestWindow();
        });
        
        
        beforeEach(function () {
            // Working set behavior is sensitive to whether file lives in the project or outside it, so make
            // the project root a known quantity.
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
        });

        afterEach(function () {
            promise = null;
            
            runs(function () {
                // Call closeAll() directly. Some tests set a spy on the save as
                // dialog preventing SpecRunnerUtils.closeAllFiles() from
                // working properly.
                testWindow.brackets.test.DocumentManager.closeAll();
            });
        });


        /** Expect a file to exist (failing test if not) and then delete it */
        function expectAndDelete(fullPath) {
            runs(function () {
                var promise = SpecRunnerUtils.resolveNativeFileSystemPath(fullPath);
                waitsForDone(promise, "Verify file exists: " + fullPath);
            });
            runs(function () {
                var promise = SpecRunnerUtils.deletePath(fullPath);
                waitsForDone(promise, "Remove testfile " + fullPath);
            });
        }
        
        describe("New Untitled File", function () {
            var filePath,
                newFilename,
                newFilePath;
            
            beforeEach(function () {
                filePath    = testPath + "/test.js";
                newFilename = "testname.js";
                newFilePath = testPath + "/" + newFilename;
            });

            /** @return {Array.<Document>} */
            function getWorkingSetDocs() {
                return DocumentManager.getWorkingSet().map(function (file) {
                    return DocumentManager.getOpenDocumentForPath(file.fullPath);
                });
            }
            
            /** Creates N untitled documents with distinct content (the file's creation-order index as a string) */
            function createUntitled(count) {
                function doCreateUntitled(content) {
                    runs(function () {
                        var promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);
                        promise.done(function (untitledDoc) {
                            untitledDoc.replaceRange(content, {line: 0, ch: 0});
                        });
                        waitsForDone(promise, "FILE_NEW_UNTITLED");
                    });
                }
                
                var i;
                for (i = 0; i < count; i++) {
                    doCreateUntitled(String(i));
                }
            }
            
            
            // Single untitled documents
            
            it("should create a new untitled document in the Working Set", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    var untitledDocument = DocumentManager.getCurrentDocument();
                    expect(untitledDocument.isDirty).toBe(false);
                    expect(untitledDocument.isUntitled()).toBe(true);
                    
                    // Verify that doc is accessible through standard doc-getting APIs
                    var openDoc = DocumentManager.getOpenDocumentForPath(untitledDocument.file.fullPath);
                    expect(openDoc).toBe(untitledDocument);
                    
                    var asyncDocPromise = DocumentManager.getDocumentForPath(untitledDocument.file.fullPath);
                    asyncDocPromise.done(function (asyncDoc) {
                        expect(asyncDoc).toBe(untitledDocument);
                    });
                    waitsForDone(asyncDocPromise);
                });
            });
            
            it("should swap out untitled document in the Working Set after saving with new name", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, newFilePath);
                    });

                    promise = CommandManager.execute(Commands.FILE_SAVE);
                    waitsForDone(promise, "Provide new filename");
                });

                runs(function () {
                    var noLongerUntitledDocument = DocumentManager.getCurrentDocument();

                    expect(noLongerUntitledDocument.isDirty).toBe(false);
                    expect(noLongerUntitledDocument.isUntitled()).toBe(false);
                    expect(noLongerUntitledDocument.file.fullPath).toEqual(newFilePath);
                    expect(DocumentManager.findInWorkingSet(newFilePath)).toBeGreaterThan(-1);
                    expect(DocumentManager.getWorkingSet().length).toEqual(1);  // no remnant of untitled doc left

                    // Verify file exists, & clean up
                    expectAndDelete(newFilePath);
                });
            });

            it("should swap out untitled document from working set even when not current", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    // Select test.js in the project tree (so nothing is selected in the working set)
                    promise = FileViewController.openAndSelectDocument(testPath + "/test.js", FileViewController.PROJECT_MANAGER);

                    waitsForDone(promise, "openAndSelectDocument");
                });

                runs(function () {
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, newFilePath);
                    });

                    var promise = CommandManager.execute(Commands.FILE_SAVE_ALL);
                    waitsForDone(promise, "FILE_SAVE_ALL");
                });
                
                runs(function () {
                    var noLongerUntitledDocument = DocumentManager.getCurrentDocument();

                    expect(noLongerUntitledDocument.isDirty).toBe(false);
                    expect(noLongerUntitledDocument.isUntitled()).toBe(false);
                    expect(noLongerUntitledDocument.file.fullPath).toEqual(newFilePath);
                    expect(DocumentManager.findInWorkingSet(newFilePath)).toBeGreaterThan(-1);
                    expect(DocumentManager.getWorkingSet().length).toEqual(1);  // no remnant of untitled doc left

                    // Verify file exists, & clean up
                    expectAndDelete(newFilePath);
                });
            });
            
            it("should ask to save untitled document upon closing", function () {
                newFilename = "testname2.js";
                newFilePath = testPath + "/" + newFilename;

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    // set Dirty flag
                    var untitledDocument = DocumentManager.getCurrentDocument();
                    untitledDocument.setText(TEST_JS_NEW_CONTENT);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });

                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, newFilePath);
                    });

                    promise = CommandManager.execute(Commands.FILE_CLOSE);

                    waitsForDone(promise, "FILE_CLOSE");
                });

                runs(function () {
                    expect(DocumentManager.getWorkingSet().length).toEqual(0);
                    
                    // Verify file exists, & clean up
                    expectAndDelete(newFilePath);
                });
            });

            it("should keep dirty untitled document in Working Set when close document is canceled", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    // set Dirty flag
                    var untitledDocument = DocumentManager.getCurrentDocument();
                    untitledDocument.setText(TEST_JS_NEW_CONTENT);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_CANCEL); } };
                    });

                    promise = CommandManager.execute(Commands.FILE_CLOSE);

                    waitsForFail(promise, "FILE_CLOSE");
                });

                runs(function () {
                    var untitledDocument = DocumentManager.getCurrentDocument();
                    
                    expect(untitledDocument.isDirty).toBe(true);
                    expect(untitledDocument.isUntitled()).toBe(true);
                    expect(DocumentManager.findInWorkingSet(untitledDocument.file.fullPath)).toBeGreaterThan(-1);
                });
            });
            
            it("should keep dirty untitled document in Working Set when saving during close is canceled", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    // set Dirty flag
                    var untitledDocument = DocumentManager.getCurrentDocument();
                    untitledDocument.setText(TEST_JS_NEW_CONTENT);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });

                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, "");  // "" means cancel
                    });

                    promise = CommandManager.execute(Commands.FILE_CLOSE);

                    waitsForFail(promise, "FILE_CLOSE");
                });

                runs(function () {
                    var untitledDocument = DocumentManager.getCurrentDocument();
                    
                    expect(untitledDocument.isDirty).toBe(true);
                    expect(untitledDocument.isUntitled()).toBe(true);
                    expect(DocumentManager.findInWorkingSet(untitledDocument.file.fullPath)).toBeGreaterThan(-1);
                });
            });

            it("should remove dirty untitled Document from Working Set when closing document is not saved", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    // set Dirty flag
                    var untitledDocument = DocumentManager.getCurrentDocument();
                    untitledDocument.setText(TEST_JS_NEW_CONTENT);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_DONTSAVE); } };
                    });

                    promise = CommandManager.execute(Commands.FILE_CLOSE);

                    waitsForDone(promise, "FILE_CLOSE");
                });

                runs(function () {
                    expect(DocumentManager.getWorkingSet().length).toEqual(0);
                });
            });

            it("should remove new untitled Document from Working Set upon closing", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_CLOSE);

                    waitsForDone(promise, "FILE_CLOSE");
                });

                runs(function () {
                    expect(DocumentManager.getWorkingSet().length).toEqual(0);
                });
            });
            
            
            // Multiple untitled documents
            
            it("multiple untitled documents shouldn't conflict", function () {
                createUntitled(3);

                runs(function () {
                    var workingSetDocs = getWorkingSetDocs();
                    expect(workingSetDocs.length).toEqual(3);
                    
                    // Expect non-conflicting dummy paths
                    expect(workingSetDocs[0].file.fullPath).not.toBe(workingSetDocs[1].file.fullPath);
                    expect(workingSetDocs[0].file.fullPath).not.toBe(workingSetDocs[2].file.fullPath);
                    expect(workingSetDocs[1].file.fullPath).not.toBe(workingSetDocs[2].file.fullPath);
                    
                    // Expect separate Document objects
                    expect(workingSetDocs[0]).not.toBe(workingSetDocs[1]);
                    expect(workingSetDocs[0]).not.toBe(workingSetDocs[2]);
                    expect(workingSetDocs[1]).not.toBe(workingSetDocs[2]);
                    
                    // Expect all Documents to be untitled
                    workingSetDocs.forEach(function (doc) {
                        expect(doc.isUntitled()).toBe(true);
                    });
                    
                    // Expect separate, unique content
                    expect(workingSetDocs[0].getText()).toBe("0");
                    expect(workingSetDocs[1].getText()).toBe("1");
                    expect(workingSetDocs[2].getText()).toBe("2");
                });
            });
            
            it("should save-all multiple untitled documents", function () {
                function getFilename(i) {
                    return testPath + "/test_saveall_" + i + ".js";
                }
                
                createUntitled(3);

                runs(function () {
                    var fileI = 0;
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, getFilename(fileI));
                        fileI++;
                    });

                    var promise = CommandManager.execute(Commands.FILE_SAVE_ALL);
                    waitsForDone(promise, "FILE_SAVE_ALL");
                });

                runs(function () {
                    // Expect clean Documents with correct, unique non-dummy paths
                    var workingSetDocs = getWorkingSetDocs();
                    expect(workingSetDocs.length).toEqual(3);
                    
                    workingSetDocs.forEach(function (doc, i) {
                        expect(doc.isUntitled()).toBe(false);
                        expect(doc.isDirty).toBe(false);
                        expect(doc.file.fullPath).toBe(getFilename(i));
                    });
                    
                    // Verify files exist & clean up
                    workingSetDocs.forEach(function (doc, i) {
                        expectAndDelete(getFilename(i));
                    });
                });
            });
            
            it("close-all should save multiple untitled documents", function () {
                function getFilename(i) {
                    return testPath + "/test_closeall_cancel_" + i + ".js";
                }
                
                createUntitled(3);

                runs(function () {
                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                    
                    var fileI = 0;
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, getFilename(fileI));
                        fileI++;
                    });

                    var promise = CommandManager.execute(Commands.FILE_CLOSE_ALL);
                    waitsForDone(promise, "FILE_CLOSE_ALL");
                });

                runs(function () {
                    expect(DocumentManager.getWorkingSet().length).toEqual(0);
                    
                    // Verify files exist & clean up
                    [0, 1, 2].forEach(function (i) {
                        expectAndDelete(getFilename(i));
                    });
                });
            });
            
            it("canceling a save-all prompt should cancel remaining saves", function () {
                function getFilename(i) {
                    return testPath + "/test_saveall_" + i + ".js";
                }
                
                createUntitled(3);

                runs(function () {
                    var fileI = 0;
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        if (fileI === 0) {
                            // save first file
                            callback(undefined, getFilename(fileI));
                        } else if (fileI === 1) {
                            // cancel save dialog on second file
                            callback(undefined, "");  // "" means cancel
                        } else {
                            // shouldn't get prompted for any further files
                            expect(false).toBe(true);
                        }
                        fileI++;
                    });

                    var promise = CommandManager.execute(Commands.FILE_SAVE_ALL);
                    waitsForFail(promise, "FILE_SAVE_ALL");  // note: promise should fail due to cancellation
                });

                runs(function () {
                    // Expect *only* first Document was saved - others remain untitled & dirty
                    var workingSetDocs = getWorkingSetDocs();
                    expect(workingSetDocs.length).toEqual(3);
                    
                    workingSetDocs.forEach(function (doc, i) {
                        if (i === 0) {
                            // First file was saved when we confirmed save dialog
                            expect(doc.isUntitled()).toBe(false);
                            expect(doc.isDirty).toBe(false);
                            expect(doc.file.fullPath).toBe(getFilename(i));
                        } else {
                            // All other saves should have been canceled
                            expect(doc.isUntitled()).toBe(true);
                            expect(doc.isDirty).toBe(true);
                            expect(doc.file.fullPath).not.toBe(getFilename(i));  // should still have dummy path
                        }
                    });
                    
                    // Clean up the one file we did save
                    expectAndDelete(getFilename(0));
                });
            });
            
            it("canceling any close-all save should not close any documents", function () {
                function getFilename(i) {
                    return testPath + "/test_closeall_save_" + i + ".js";
                }
                
                createUntitled(3);

                runs(function () {
                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                    
                    var fileI = 0;
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        if (fileI === 0) {
                            // save first file
                            callback(undefined, getFilename(fileI));
                        } else if (fileI === 1) {
                            // cancel save dialog on second file
                            callback(undefined, "");  // "" means cancel
                        } else {
                            // shouldn't get prompted for any further files
                            expect(false).toBe(true);
                        }
                        fileI++;
                    });

                    var promise = CommandManager.execute(Commands.FILE_CLOSE_ALL);
                    waitsForFail(promise, "FILE_CLOSE_ALL");  // note: promise should fail due to cancellation
                });

                runs(function () {
                    // Expect *all* Documents still open, and *only* first Document was saved
                    var workingSetDocs = getWorkingSetDocs();
                    expect(workingSetDocs.length).toEqual(3);
                    
                    workingSetDocs.forEach(function (doc, i) {
                        if (i === 0) {
                            // First file was saved when we confirmed save dialog
                            expect(doc.isUntitled()).toBe(false);
                            expect(doc.isDirty).toBe(false);
                            expect(doc.file.fullPath).toBe(getFilename(i));
                        } else {
                            // All other saves should have been canceled
                            expect(doc.isUntitled()).toBe(true);
                            expect(doc.isDirty).toBe(true);
                            expect(doc.file.fullPath).not.toBe(getFilename(i));  // should still have dummy path
                        }
                    });
                    
                    // Clean up the one file we did save
                    expectAndDelete(getFilename(0));
                });
            });
            
        });

        // TODO (issue #115): test Commands.FILE_NEW. Current implementation of
        // ProjectManager.createNewItem() is tightly coupled to jstree UI and
        // events.


        describe("Close File", function () {
            it("should complete without error if no files are open", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_CLOSE);
                    waitsForDone(promise, "FILE_CLOSE");
                });
                runs(function () {
                    expect(testWindow.document.title).toBe(brackets.config.app_title);
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
                    expect(testWindow.document.title).toBe(brackets.config.app_title);
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
                    promise = FileUtils.readAsText(FileSystem.getFileForPath(filePath))
                        .done(function (actualText) {
                            expect(actualText).toBe(TEST_JS_NEW_CONTENT);
                        });
                    waitsForDone(promise, "Read test file");
                });

                // reset file contents
                runs(function () {
                    promise = FileUtils.writeText(FileSystem.getFileForPath(filePath), TEST_JS_CONTENT);
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
                    promise = FileUtils.writeText(FileSystem.getFileForPath(crlfPath), crlfText);
                    waitsForDone(promise, "Create CRLF test file");
                });
                runs(function () {
                    promise = FileUtils.writeText(FileSystem.getFileForPath(lfPath), lfText);
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
                    promise = FileUtils.readAsText(FileSystem.getFileForPath(crlfPath))
                        .done(function (actualText) {
                            expect(actualText).toBe(crlfText.replace("line2", "line2a\r\nline2b"));
                        });
                    waitsForDone(promise, "Read CRLF test file");
                });
                
                runs(function () {
                    promise = FileUtils.readAsText(FileSystem.getFileForPath(lfPath))
                        .done(function (actualText) {
                            expect(actualText).toBe(lfText.replace("line2", "line2a\nline2b"));
                        });
                    waitsForDone(promise, "Read LF test file");
                });
                
                // clean up
                runs(function () {
                    promise = SpecRunnerUtils.deletePath(crlfPath);
                    waitsForDone(promise, "Remove CRLF test file");
                });
                runs(function () {
                    promise = SpecRunnerUtils.deletePath(lfPath);
                    waitsForDone(promise, "Remove LF test file");
                });
            });
        });

        describe("Save As", function () {
            var filePath,
                newFilename,
                newFilePath;
            
            beforeEach(function () {
                filePath    = testPath + "/test.js";
                newFilename = "testname.js";
                newFilePath = testPath + "/" + newFilename;
            });
            
            it("should close the original file, reopen the saved file and add select the new file in the project tree", function () {
                runs(function () {
                    // Open the file, does not add to working set
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });

                runs(function () {
                    var currentDocument = DocumentManager.getCurrentDocument();
                    expect(currentDocument.file.fullPath).toEqual(filePath);
                });

                runs(function () {
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, newFilePath);
                    });

                    promise = CommandManager.execute(Commands.FILE_SAVE_AS);
                    waitsForDone(promise, "Provide new filename");
                });

                runs(function () {
                    var currentDocument = DocumentManager.getCurrentDocument();
                    expect(currentDocument.file.fullPath).toEqual(newFilePath);
                });

                runs(function () {
                    // New file should not appear in working set
                    expect(DocumentManager.findInWorkingSet(newFilePath)).toEqual(-1);
                    
                    // Verify file exists & clean it up
                    expectAndDelete(newFilePath);
                });
            });

            it("should close the original file, reopen the saved file outside the project and add it to the Working Set", function () {
                newFilePath = SpecRunnerUtils.getTempDirectory() + "/" + newFilename;

                SpecRunnerUtils.createTempDirectory();

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
                    waitsForDone(promise, "FILE_OPEN");
                });

                runs(function () {
                    var currentDocument = DocumentManager.getCurrentDocument();
                    expect(currentDocument.file.fullPath).toEqual(filePath);
                });

                runs(function () {
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, newFilePath);
                    });

                    promise = CommandManager.execute(Commands.FILE_SAVE_AS);
                    waitsForDone(promise, "Provide new filename");
                });

                runs(function () {
                    var currentDocument = DocumentManager.getCurrentDocument();
                    expect(currentDocument.file.fullPath).toEqual(newFilePath);
                });

                runs(function () {
                    // Only new file should appear in working set
                    expect(DocumentManager.findInWorkingSet(newFilePath)).toBeGreaterThan(-1);
                    expect(DocumentManager.findInWorkingSet(filePath)).toEqual(-1);
                    
                    // Verify file exists & clean it up
                    expectAndDelete(newFilePath);
                });
            });

            it("should leave Working Set untouched when operation is canceled", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});

                    waitsForDone(promise, "FILE_OPEN");
                });

                runs(function () {
                    var currentDocument = DocumentManager.getCurrentDocument();
                    expect(currentDocument.file.fullPath).toEqual(filePath);
                });

                runs(function () {
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback("Error", undefined);
                    });

                    promise = CommandManager.execute(Commands.FILE_SAVE_AS);
                    waitsForFail(promise, "Provide new filename");
                });

                runs(function () {
                    var currentDocument = DocumentManager.getCurrentDocument();
                    expect(currentDocument.file.fullPath).toEqual(filePath);
                });

                runs(function () {
                    expect(DocumentManager.findInWorkingSet(newFilePath)).toEqual(-1);
                });
            });
            
            it("should maintain order within Working Set after Save As", function () {
                var index,
                    targetDoc;

                runs(function () {
                    // open the target file
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});

                    waitsForDone(promise, "FILE_OPEN");
                });
                
                runs(function () {
                    index = DocumentManager.findInWorkingSet(filePath);
                    targetDoc = DocumentManager.getOpenDocumentForPath(filePath);
                });

                runs(function () {
                    // create an untitled document so that the file opened above isn't the last item in the working set list
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    // save the file opened above to a different filename
                    DocumentManager.setCurrentDocument(targetDoc);
                    
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, newFilePath);
                    });

                    promise = CommandManager.execute(Commands.FILE_SAVE_AS);
                    waitsForDone(promise, "Provide new filename");
                });

                runs(function () {
                    // New file should appear in working set at old file's index; old file shouldn't appear at all
                    expect(DocumentManager.findInWorkingSet(newFilePath)).toEqual(index);
                    expect(DocumentManager.findInWorkingSet(filePath)).toEqual(-1);

                    // Verify file exists & clean it up
                    expectAndDelete(newFilePath);
                });
            });
        });
        
        describe("Dirty File Handling", function () {

            beforeEach(function () {
                var promise;
                
                SpecRunnerUtils.loadProjectInTestWindow(testPath);

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/test.js"});
                    waitsForDone(promise, "FILE_OPEN");
                });
            });

            it("should report clean immediately after opening a file", function () {
                runs(function () {
                    // verify Document dirty status
                    expect(DocumentManager.getCurrentDocument().isDirty).toBe(false);
                    
                    // verify no dot in titlebar
                    var expectedTitle = (brackets.platform === "mac" ? ("test.js — " + brackets.config.app_title) : ("test.js - " + brackets.config.app_title));
                    expect(testWindow.document.title).toBe(expectedTitle);
                });
            });
            
            it("should report dirty when modified", function () {
                var doc = DocumentManager.getCurrentDocument();
                
                runs(function () {
                    // change editor content
                    doc.setText(TEST_JS_NEW_CONTENT);
                    
                    // verify Document dirty status
                    expect(doc.isDirty).toBe(true);
                    
                    // verify dot in titlebar
                    var expectedTitle = (brackets.platform === "mac" ? ("• test.js — " + brackets.config.app_title) : ("• test.js - " + brackets.config.app_title));
                    expect(testWindow.document.title).toBe(expectedTitle);
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
        
        describe("Decorated Path Parser", function () {
            it("should correctly parse decorated paths", function () {
                var path = testPath + "/test.js";
                
                expect(DocumentCommandHandlers._parseDecoratedPath(null)).toEqual({path: null, line: null, column: null});
                expect(DocumentCommandHandlers._parseDecoratedPath(path)).toEqual({path: path, line: null, column: null});
                expect(DocumentCommandHandlers._parseDecoratedPath(path + ":123")).toEqual({path: path, line: 123, column: null});
                expect(DocumentCommandHandlers._parseDecoratedPath(path + ":123:456")).toEqual({path: path, line: 123, column: 456});
            });
        });

        describe("Opens image file and validates EditorManager APIs", function () {
            it("should return null after opening an image", function () {
                var path = testPath + "/couz.png",
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: path }).done(function (result) {
                        expect(EditorManager.getActiveEditor()).toEqual(null);
                        expect(EditorManager.getCurrentFullEditor()).toEqual(null);
                        expect(EditorManager.getFocusedEditor()).toEqual(null);
                        expect(EditorManager.getCurrentlyViewedPath()).toEqual(path);
                        var d = DocumentManager.getCurrentDocument();
                        expect(d).toEqual(null);
                    });
                waitsForDone(promise, Commands.FILE_OPEN);
            });
        });
        
        describe("Open image file while a text file is open", function () {
            it("should fire currentDocumentChange and activeEditorChange events", function () {

                var promise,
                    docChangeListener = jasmine.createSpy(),
                    activeEditorChangeListener = jasmine.createSpy();
                docChangeListener.callCount = 0;
                activeEditorChangeListener.callCount = 0;


                runs(function () {
                    _$(DocumentManager).on("currentDocumentChange", docChangeListener);
                    _$(EditorManager).on("activeEditorChange", activeEditorChangeListener);
                    
                    
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(docChangeListener.callCount).toBe(1);
                    expect(activeEditorChangeListener.callCount).toBe(1);
                });
                
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: testPath + "/couz.png" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(docChangeListener.callCount).toBe(2);
                    expect(activeEditorChangeListener.callCount).toBe(2);
                    _$(DocumentManager).off("currentDocumentChange", docChangeListener);
                    _$(EditorManager).off("activeEditorChange", activeEditorChangeListener);
                });
            });
        });
        
        describe("Open image file while neither text editor nor image file is open", function () {
            it("should NOT fire currentDocumentChange and activeEditorChange events", function () {

                var promise,
                    docChangeListener = jasmine.createSpy(),
                    activeEditorChangeListener = jasmine.createSpy();


                runs(function () {
                    _$(DocumentManager).on("currentDocumentChange", docChangeListener);
                    _$(EditorManager).on("activeEditorChange", activeEditorChangeListener);
                    
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: testPath + "/couz.png" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(docChangeListener.callCount).toBe(0);
                    expect(activeEditorChangeListener.callCount).toBe(0);
                });
                
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: testPath + "/couz2.png" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(docChangeListener.callCount).toBe(0);
                    expect(activeEditorChangeListener.callCount).toBe(0);
                    _$(DocumentManager).off("currentDocumentChange", docChangeListener);
                    _$(EditorManager).off("activeEditorChange", activeEditorChangeListener);
                });
    
            });
        });
        
        describe("Open a text file while a text file is open", function () {
            it("should fire currentDocumentChange and activeEditorChange events", function () {

                var promise,
                    docChangeListener = jasmine.createSpy(),
                    activeEditorChangeListener = jasmine.createSpy();


                runs(function () {
                    _$(DocumentManager).on("currentDocumentChange", docChangeListener);
                    _$(EditorManager).on("activeEditorChange", activeEditorChangeListener);
                    
                    
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(docChangeListener.callCount).toBe(1);
                    expect(activeEditorChangeListener.callCount).toBe(1);
                });
                
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: testPath + "/test2.js" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(docChangeListener.callCount).toBe(2);
                    expect(activeEditorChangeListener.callCount).toBe(2);
                    _$(DocumentManager).off("currentDocumentChange", docChangeListener);
                    _$(EditorManager).off("activeEditorChange", activeEditorChangeListener);
                });
            });
        });
        
        describe("Opens text file and validates EditorManager APIs", function () {
            it("should return an editor after opening a text file", function () {
                var path = testPath + "/test.js";
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: path }).done(function (result) {
                    var e = EditorManager.getActiveEditor();
                    expect(e.document.file.fullPath).toBe(path);
                    
                    e = EditorManager.getCurrentFullEditor();
                    expect(e.document.file.fullPath).toBe(path);
     
                    e = EditorManager.getFocusedEditor();
                    expect(e.document.file.fullPath).toBe(path);
                    
                    expect(EditorManager.getCurrentlyViewedPath()).toEqual(path);
                });
            });
        });
                

    });
});
