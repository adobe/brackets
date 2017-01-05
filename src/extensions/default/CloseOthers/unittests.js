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

/*global describe, it, expect, beforeEach, afterEach, runs, waitsForDone, spyOn */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        FileUtils		= brackets.getModule("file/FileUtils"),
        CommandManager,
        Commands,
        Dialogs,
        EditorManager,
        DocumentManager,
        MainViewManager,
        FileSystem;

    describe("CloseOthers", function () {
        var extensionPath = FileUtils.getNativeModuleDirectoryPath(module),
            testPath      = extensionPath + "/unittest-files/",
            testWindow,
            $,
            docSelectIndex,
            cmdToRun,
            brackets;

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

        function getFilename(i) {
            return testPath + "test_closeothers" + i + ".js";
        }

        beforeEach(function () {

            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    $ = testWindow.$;
                    brackets		= testWindow.brackets;
                    DocumentManager = testWindow.brackets.test.DocumentManager;
                    MainViewManager = testWindow.brackets.test.MainViewManager;
                    CommandManager  = testWindow.brackets.test.CommandManager;
                    EditorManager   = testWindow.brackets.test.EditorManager;
                    Dialogs			= testWindow.brackets.test.Dialogs;
                    Commands        = testWindow.brackets.test.Commands;
                    FileSystem      = testWindow.brackets.test.FileSystem;
                });
            });

            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });

            createUntitled(5);

            runs(function () {
                var fileI = 0;
                spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                    callback(undefined, getFilename(fileI));
                    fileI++;
                });

                var promise = CommandManager.execute(Commands.FILE_SAVE_ALL);
                waitsForDone(promise, "FILE_SAVE_ALL", 5000);
            });
        });

        afterEach(function () {
            // Verify files exist & clean up
            [0, 1, 2, 3, 4].forEach(function (i) {
                expectAndDelete(getFilename(i));
            });

            testWindow    = null;
            $             = null;
            brackets      = null;
            EditorManager = null;
            SpecRunnerUtils.closeTestWindow();
        });


        function runCloseOthers() {
            var ws = MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE),
                promise;

            if (ws.length > docSelectIndex) {
                DocumentManager.getDocumentForPath(ws[docSelectIndex].fullPath).done(function (doc) {
                    MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                });

                runs(function () {
                    promise = CommandManager.execute(cmdToRun);
                    waitsForDone(promise, cmdToRun);
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(ws[docSelectIndex].fullPath, "Path of document in editor after close others command should be the document that was selected");
                });
            }
        }

        it("Close others", function () {
            docSelectIndex = 2;
            cmdToRun       = "file.close_others";

            runCloseOthers();

            runs(function () {
                expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(1);
            });
        });

        it("Close others above", function () {
            docSelectIndex = 2;
            cmdToRun       = "file.close_above";

            runCloseOthers();

            runs(function () {
                expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(3);
            });
        });

        it("Close others below", function () {
            docSelectIndex = 1;
            cmdToRun       = "file.close_below";

            runCloseOthers();

            runs(function () {
                expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(2);
            });
        });
    });
});
