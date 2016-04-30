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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, beforeEach, afterEach, it, runs, expect, brackets, waitsForDone, waitsForFail, spyOn, beforeFirst, afterLast, jasmine, xit */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var CommandManager,         // loaded from brackets.test
        Commands,               // loaded from brackets.test
        DocumentCommandHandlers, // loaded from brackets.test
        DocumentManager,        // loaded from brackets.test
        MainViewManager,        // loaded from brackets.test
        Dialogs,                // loaded from brackets.test
        FileSystem,             // loaded from brackets.test
        FileViewController,     // loaded from brackets.test
        EditorManager,          // loaded from brackets.test
        SpecRunnerUtils          = require("spec/SpecRunnerUtils"),
        FileUtils                = require("file/FileUtils"),
        FileSystemError          = require("filesystem/FileSystemError");

    describe("DocumentCommandHandlers", function () {
        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/DocumentCommandHandlers-test-files"),
            testWindow,
            _$,
            promise;

        var TEST_JS_CONTENT = 'var myContent="This is awesome!";';
        var TEST_JS_NEW_CONTENT = "hello world";
        var TEST_JS_SECOND_NEW_CONTENT = "hello world 2";
        var WINDOW_TITLE_DOT = brackets.platform === "mac" ? "\u2014" : "-";

        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                _$ = testWindow.$;

                // Load module instances from brackets.test
                CommandManager          = testWindow.brackets.test.CommandManager;
                Commands                = testWindow.brackets.test.Commands;
                DocumentCommandHandlers = testWindow.brackets.test.DocumentCommandHandlers;
                DocumentManager         = testWindow.brackets.test.DocumentManager;
                MainViewManager         = testWindow.brackets.test.MainViewManager;
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
            MainViewManager         = null;
            Dialogs                 = null;
            FileViewController      = null;
            EditorManager           = null;
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
                testWindow.brackets.test.MainViewManager._closeAll(testWindow.brackets.test.MainViewManager.ALL_PANES);
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
                waitsForDone(promise, "Remove testfile " + fullPath, 5000);
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
            function getOpenDocsFromWorkingSet() {
                return MainViewManager.getWorkingSet(MainViewManager.ALL_PANES).map(function (file) {
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
                    waitsForDone(promise, "Provide new filename", 5000);
                });

                runs(function () {
                    var noLongerUntitledDocument = DocumentManager.getCurrentDocument();

                    expect(noLongerUntitledDocument.isDirty).toBe(false);
                    expect(noLongerUntitledDocument.isUntitled()).toBe(false);
                    expect(noLongerUntitledDocument.file.fullPath).toEqual(newFilePath);
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, newFilePath)).toNotEqual(-1);
                    expect(MainViewManager.getWorkingSet(MainViewManager.ALL_PANES).length).toEqual(1);  // no remnant of untitled doc left

                    // Verify file exists, & clean up
                    expectAndDelete(newFilePath);
                });
            });

            // from Issue #6121
            it("should recognize that a previously untitled, but now saved, document can be saved without prompting for a filename", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, newFilePath);
                    });

                    promise = CommandManager.execute(Commands.FILE_SAVE);

                    waitsForDone(promise, "FILE_SAVE");

                    expect(FileSystem.showSaveDialog).toHaveBeenCalled();   // first save should prompt user for filename
                });

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_SAVE);

                    waitsForDone(promise, "FILE_SAVE");

                    expect(FileSystem.showSaveDialog.callCount).toEqual(1); // second save should not prompt
                });
            });

            xit("should swap out untitled document from working set even when not current", function () {
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
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, newFilePath)).toNotEqual(-1);
                    expect(MainViewManager.getWorkingSet(MainViewManager.ALL_PANES).length).toEqual(1);  // no remnant of untitled doc left

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
                    expect(MainViewManager.getWorkingSet(MainViewManager.ALL_PANES).length).toEqual(0);

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
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, untitledDocument.file.fullPath)).toNotEqual(-1);
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
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, untitledDocument.file.fullPath)).toNotEqual(-1);
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
                    expect(MainViewManager.getWorkingSet(MainViewManager.ALL_PANES).length).toEqual(0);
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
                    expect(MainViewManager.getWorkingSet(MainViewManager.ALL_PANES).length).toEqual(0);
                });
            });


            // Multiple untitled documents

            it("multiple untitled documents shouldn't conflict", function () {
                createUntitled(3);

                runs(function () {
                    var workingSetListDocs = getOpenDocsFromWorkingSet();
                    expect(workingSetListDocs.length).toEqual(3);

                    // Expect non-conflicting dummy paths
                    expect(workingSetListDocs[0].file.fullPath).not.toBe(workingSetListDocs[1].file.fullPath);
                    expect(workingSetListDocs[0].file.fullPath).not.toBe(workingSetListDocs[2].file.fullPath);
                    expect(workingSetListDocs[1].file.fullPath).not.toBe(workingSetListDocs[2].file.fullPath);

                    // Expect separate Document objects
                    expect(workingSetListDocs[0]).not.toBe(workingSetListDocs[1]);
                    expect(workingSetListDocs[0]).not.toBe(workingSetListDocs[2]);
                    expect(workingSetListDocs[1]).not.toBe(workingSetListDocs[2]);

                    // Expect all Documents to be untitled
                    workingSetListDocs.forEach(function (doc) {
                        expect(doc.isUntitled()).toBe(true);
                    });

                    // Expect separate, unique content
                    expect(workingSetListDocs[0].getText()).toBe("0");
                    expect(workingSetListDocs[1].getText()).toBe("1");
                    expect(workingSetListDocs[2].getText()).toBe("2");
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
                    waitsForDone(promise, "FILE_SAVE_ALL", 5000);
                });

                runs(function () {
                    // Expect clean Documents with correct, unique non-dummy paths
                    var workingSetListDocs = getOpenDocsFromWorkingSet();
                    expect(workingSetListDocs.length).toEqual(3);

                    workingSetListDocs.forEach(function (doc, i) {
                        expect(doc.isUntitled()).toBe(false);
                        expect(doc.isDirty).toBe(false);
                        expect(doc.file.fullPath).toBe(getFilename(i));
                    });

                    // Verify files exist & clean up
                    workingSetListDocs.forEach(function (doc, i) {
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
                    waitsForDone(promise, "FILE_CLOSE_ALL", 5000);
                });

                runs(function () {
                    expect(MainViewManager.getWorkingSet(MainViewManager.ALL_PANES).length).toEqual(0);

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
                    var workingSetListDocs = getOpenDocsFromWorkingSet();
                    expect(workingSetListDocs.length).toEqual(3);

                    workingSetListDocs.forEach(function (doc, i) {
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
                    var workingSetListDocs = getOpenDocsFromWorkingSet();
                    expect(workingSetListDocs.length).toEqual(3);

                    workingSetListDocs.forEach(function (doc, i) {
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
                    expect(testWindow.document.title).toBe("DocumentCommandHandlers-test-files " + WINDOW_TITLE_DOT + " " + brackets.config.app_title);
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
                    expect(testWindow.document.title).toBe("DocumentCommandHandlers-test-files " + WINDOW_TITLE_DOT + " " + brackets.config.app_title);
                });
            });
        });


        describe("Close List", function () {
            beforeEach(function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: testPath + "/test.js"});
                    waitsForDone(promise, "CMD_ADD_TO_WORKINGSET_AND_OPEN");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: testPath + "/test2.js"});
                    waitsForDone(promise, "CMD_ADD_TO_WORKINGSET_AND_OPEN");
                });
            });
            it("should not close the current view", function () {
                var currentPath,
                    docsToClose;
                runs(function () {
                    currentPath = MainViewManager.getCurrentlyViewedPath();
                    docsToClose = DocumentManager.getAllOpenDocuments().filter(function (doc) {
                        return (doc !== DocumentManager.getCurrentDocument());
                    });
                    promise = CommandManager.execute(Commands.FILE_CLOSE_LIST, {fileList: docsToClose.map(function (doc) {
                        return doc.file;
                    })});
                    waitsForDone(promise, "FILE_CLOSE_LIST");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedPath()).toBe(currentPath);
                });
            });
            it("should close all views", function () {
                var docsToClose;
                runs(function () {
                    docsToClose = DocumentManager.getAllOpenDocuments();
                    promise = CommandManager.execute(Commands.FILE_CLOSE_LIST, {fileList: docsToClose.map(function (doc) {
                        return doc.file;
                    })});
                    waitsForDone(promise, "FILE_CLOSE_LIST");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile()).toBeFalsy();
                });
            });
            it("should open the next view when the current view is closed", function () {
                var currentPath,
                    docsToClose;
                runs(function () {
                    currentPath = MainViewManager.getCurrentlyViewedPath();
                    docsToClose = DocumentManager.getAllOpenDocuments().filter(function (doc) {
                        return (doc === DocumentManager.getCurrentDocument());
                    });
                    promise = CommandManager.execute(Commands.FILE_CLOSE_LIST, {fileList: docsToClose.map(function (doc) {
                        return doc.file;
                    })});
                    waitsForDone(promise, "FILE_CLOSE_LIST");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedPath()).not.toBe(currentPath);
                    expect(MainViewManager.getCurrentlyViewedPath()).toBeTruthy();
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

            it("should resolve with FileSystemError when opening fails", function () {
                runs(function () {
                    // Dismiss expected error dialog instantly so promise completes & test can proceed
                    spyOn(Dialogs, "showModalDialog").andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });

                    // Open nonexistent file to trigger error result
                    var promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/doesNotExist.js"});
                    waitsForFail(promise, "FILE_OPEN");
                    promise.fail(function (err) {
                        expect(err).toEqual(FileSystemError.NOT_FOUND);
                    });
                });
                runs(function () {
                    expect(DocumentManager.getCurrentDocument()).toBeFalsy();
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
            it("should preserve line endings after Save", function () {
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

                // verify files' contents
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
                    waitsForDone(SpecRunnerUtils.deletePath(crlfPath), "Remove CRLF test file");
                    waitsForDone(SpecRunnerUtils.deletePath(lfPath),   "Remove LF test file");
                });
            });

            it("should preserve line endings after Save As", function () {  // bug #9179
                var crlfText = "line1\r\nline2\r\nline3",
                    lfText   = "line1\nline2\nline3",
                    crlfPath = testPath + "/crlfTest.js",
                    lfPath   = testPath + "/lfTest.js",
                    crlfNewPath = testPath + "/saveAsCRLF.js",
                    lfNewPath = testPath + "/saveAsLF.js",
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

                // open, modify, and Save As (CRLF case)
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: crlfPath});
                    waitsForDone(promise, "Open CRLF test file");
                });
                runs(function () {
                    DocumentManager.getCurrentDocument().replaceRange("line2a\nline2b", {line: 1, ch: 0}, {line: 1, ch: 5});

                    spyOn(FileSystem, "showSaveDialog").andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, crlfNewPath);
                    });
                    promise = CommandManager.execute(Commands.FILE_SAVE_AS);
                    waitsForDone(promise, "Save As modified file");
                });

                // open, modify, and Save As (LF case)
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: lfPath});
                    waitsForDone(promise, "Open LF test file");
                });
                runs(function () {
                    DocumentManager.getCurrentDocument().replaceRange("line2a\nline2b", {line: 1, ch: 0}, {line: 1, ch: 5});

                    FileSystem.showSaveDialog.andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, lfNewPath);
                    });
                    promise = CommandManager.execute(Commands.FILE_SAVE_AS);
                    waitsForDone(promise, "Save As modified file");
                });

                // verify files' contents
                runs(function () {
                    promise = FileUtils.readAsText(FileSystem.getFileForPath(crlfNewPath))
                        .done(function (actualText) {
                            expect(actualText).toBe(crlfText.replace("line2", "line2a\r\nline2b"));
                        });
                    waitsForDone(promise, "Read CRLF save-as file");
                });

                runs(function () {
                    promise = FileUtils.readAsText(FileSystem.getFileForPath(lfNewPath))
                        .done(function (actualText) {
                            expect(actualText).toBe(lfText.replace("line2", "line2a\nline2b"));
                        });
                    waitsForDone(promise, "Read LF save-as file");
                });

                // clean up
                runs(function () {
                    waitsForDone(SpecRunnerUtils.deletePath(crlfPath),    "Remove CRLF test file");
                    waitsForDone(SpecRunnerUtils.deletePath(lfPath),      "Remove LF test file");
                    waitsForDone(SpecRunnerUtils.deletePath(crlfNewPath), "Remove CRLF save-as file");
                    waitsForDone(SpecRunnerUtils.deletePath(lfNewPath),   "Remove LF save-as file");
                });
            });

        });


        describe("Save As", function () {
            var filePath,
                newFilename,
                newFilePath,
                selections = [{start: {line: 0, ch: 1}, end: {line: 0, ch: 3}, primary: false, reversed: false},
                              {start: {line: 0, ch: 6}, end: {line: 0, ch: 6}, primary: true, reversed: false},
                              {start: {line: 0, ch: 9}, end: {line: 0, ch: 12}, primary: false, reversed: true}];

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
                    var currentDocument = DocumentManager.getCurrentDocument(),
                        currentEditor = EditorManager.getActiveEditor();
                    expect(currentDocument.file.fullPath).toEqual(filePath);
                    currentEditor.setSelections(selections);
                });

                runs(function () {
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, newFilePath);
                    });

                    promise = CommandManager.execute(Commands.FILE_SAVE_AS);
                    waitsForDone(promise, "Provide new filename");
                });

                runs(function () {
                    var currentDocument = DocumentManager.getCurrentDocument(),
                        currentEditor = EditorManager.getActiveEditor();
                    expect(currentDocument.file.fullPath).toEqual(newFilePath);
                    expect(currentEditor.getSelections()).toEqual(selections);
                });

                runs(function () {
                    // New file should not appear in working set
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, newFilePath)).toEqual(-1);

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
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, newFilePath)).toNotEqual(-1);
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, filePath)).toEqual(-1);

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
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, newFilePath)).toEqual(-1);
                });
            });

            it("should maintain order within Working Set after Save As", function () {
                var views,
                    targetDoc;

                runs(function () {
                    // open the target file
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});

                    waitsForDone(promise, "FILE_OPEN");
                });

                runs(function () {
                    views = MainViewManager.findInAllWorkingSets(filePath);
                    targetDoc = DocumentManager.getOpenDocumentForPath(filePath);
                });

                runs(function () {
                    // create an untitled document so that the file opened above isn't the last item in the working set list
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);

                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });

                runs(function () {
                    // save the file opened above to a different filename
                    MainViewManager._edit(MainViewManager.ACTIVE_PANE, targetDoc);
                    spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                        callback(undefined, newFilePath);
                    });

                    promise = CommandManager.execute(Commands.FILE_SAVE_AS);
                    waitsForDone(promise, "Provide new filename");
                });

                runs(function () {
                    // New file should appear in working set at old file's index; old file shouldn't appear at all
                    expect(MainViewManager.findInAllWorkingSets(newFilePath)).toEqual(views);
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, filePath)).toEqual(-1);

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
                    expect(testWindow.document.title).toBe("test.js (DocumentCommandHandlers-test-files) " + WINDOW_TITLE_DOT + " " + brackets.config.app_title);
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
                    expect(testWindow.document.title).toBe("• test.js (DocumentCommandHandlers-test-files) " + WINDOW_TITLE_DOT + " " + brackets.config.app_title);

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


        describe("Open image files", function () {
            it("document & editor should be null after opening an image", function () {
                var path = testPath + "/couz.png",
                    promise;
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: path });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });

                runs(function () {
                    expect(EditorManager.getActiveEditor()).toBeFalsy();
                    expect(EditorManager.getCurrentFullEditor()).toBeFalsy();
                    expect(EditorManager.getFocusedEditor()).toBeFalsy();
                    expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(path);
                    var d = DocumentManager.getCurrentDocument();
                    expect(d).toBeFalsy();
                });
            });

            it("opening image while text file open should fire currentDocumentChange and activeEditorChange events", function () {
                var promise,
                    docChangeListener = jasmine.createSpy(),
                    activeEditorChangeListener = jasmine.createSpy();

                runs(function () {
                    DocumentManager.on("currentDocumentChange", docChangeListener);
                    EditorManager.on("activeEditorChange", activeEditorChangeListener);


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
                    DocumentManager.off("currentDocumentChange", docChangeListener);
                    EditorManager.off("activeEditorChange", activeEditorChangeListener);
                });
            });

            it("opening image while nothing open should NOT fire currentDocumentChange and activeEditorChange events", function () {
                var promise,
                    docChangeListener = jasmine.createSpy(),
                    activeEditorChangeListener = jasmine.createSpy();

                runs(function () {
                    DocumentManager.on("currentDocumentChange", docChangeListener);
                    EditorManager.on("activeEditorChange", activeEditorChangeListener);

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
                    DocumentManager.off("currentDocumentChange", docChangeListener);
                    EditorManager.off("activeEditorChange", activeEditorChangeListener);
                });

            });

            it("opening text file while other text open should fire currentDocumentChange and activeEditorChange events", function () {
                var promise,
                    docChangeListener = jasmine.createSpy(),
                    activeEditorChangeListener = jasmine.createSpy();

                runs(function () {
                    DocumentManager.on("currentDocumentChange", docChangeListener);
                    EditorManager.on("activeEditorChange", activeEditorChangeListener);


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
                    DocumentManager.off("currentDocumentChange", docChangeListener);
                    EditorManager.off("activeEditorChange", activeEditorChangeListener);
                });
            });

            it("should return an editor after opening a text file", function () {
                var path = testPath + "/test.js",
                    promise;
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: path });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });

                runs(function () {
                    var e = EditorManager.getActiveEditor();
                    expect(e.document.file.fullPath).toBe(path);

                    e = EditorManager.getCurrentFullEditor();
                    expect(e.document.file.fullPath).toBe(path);

                    e = EditorManager.getFocusedEditor();
                    expect(e.document.file.fullPath).toBe(path);

                    expect(MainViewManager.getCurrentlyViewedPath()).toEqual(path);
                });
            });
        });


        describe("Scrolling", function () {
            it("should scroll when moving the cursor to the end of a really long line", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);
                    waitsForDone(promise, Commands.FILE_NEW_UNTITLED);
                });

                runs(function () {
                    var myEditor = EditorManager.getActiveEditor();
                    // turn off word-wrap
                    myEditor._codeMirror.setOption("lineWrapping", false);
                    myEditor.document.setText("ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd some really long line");
                    myEditor.setCursorPos(1, 1);
                    myEditor._codeMirror.execCommand("goLineEnd");

                    var se = myEditor.getScrollerElement(),
                        sp = se.scrollLeft,
                        $se = _$(se);

                    // really big number -- will scroll to the end of the line
                    $se.scrollLeft(99999999);
                    expect(sp).toEqual(se.scrollLeft);
                });
            });
        });

    });
});
