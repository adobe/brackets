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

    var REMOTE_FILE_PATH = "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css",
        INVALID_REMOTE_FILE_PATH = "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/invalid.min.css";



    describe("RemoteFileAdapter", function () {
        var testWindow,
            $,
            brackets;

        function createRemoteFile(filePath) {
            return CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath});
        }

        function deleteCurrentRemoteFile() {
            CommandManager.execute(Commands.FILE_DELETE);
        }

        function saveRemoteFile() {
            CommandManager.execute(Commands.FILE_SAVE);
        }

        function renameRemoteFile(filePath) {
            CommandManager.execute(Commands.FILE_RENAME);
        }

        function closeRemoteFile(filePath) {
            CommandManager.execute(Commands.FILE_CLOSE, {fullPath: filePath});
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
        });

        afterEach(function () {
            testWindow    = null;
            $             = null;
            brackets      = null;
            EditorManager = null;
            SpecRunnerUtils.closeTestWindow();
        });


        it("Open/close remote https file", function () {
            createRemoteFile(REMOTE_FILE_PATH).done(function () {
                expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(1);
                closeRemoteFile(REMOTE_FILE_PATH).done(function () {
                    expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(0);
                });
            });
        });

        it("Open invalid remote file", function () {
            spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                console.warn(title, message);
                return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
            });
            createRemoteFile(INVALID_REMOTE_FILE_PATH).always(function () {
                expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(0);
                expect(Dialogs.showModalDialog).toHaveBeenCalled();
                expect(Dialogs.showModalDialog.callCount).toBe(1);
            });
        });

        it("Save remote file", function () {
            createRemoteFile(REMOTE_FILE_PATH).done(function () {
                spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                    console.warn(title, message);
                    return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                });
                saveRemoteFile();
                expect(Dialogs.showModalDialog).toHaveBeenCalled();
                expect(Dialogs.showModalDialog.callCount).toBe(1);
                closeRemoteFile(REMOTE_FILE_PATH).done(function () {
                    expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(0);
                });
            });
        });

        it("Delete remote file", function () {
            createRemoteFile(REMOTE_FILE_PATH).done(function () {
                expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(1);
                spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                    console.warn(title, message);
                    return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                });
                deleteCurrentRemoteFile();
                expect(Dialogs.showModalDialog).toHaveBeenCalled();
                expect(Dialogs.showModalDialog.callCount).toBe(1);
                expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(1);
                closeRemoteFile(REMOTE_FILE_PATH).done(function () {
                    expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(0);
                });
            });
        });

        it("Rename remote file", function () {
            createRemoteFile(REMOTE_FILE_PATH).done(function () {
                expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(1);
                spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                    console.warn(title, message);
                    return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                });
                renameRemoteFile();
                expect(Dialogs.showModalDialog).toHaveBeenCalled();
                expect(Dialogs.showModalDialog.callCount).toBe(1);
                expect(MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE).length).toEqual(1);
            });
        });
    });
});
