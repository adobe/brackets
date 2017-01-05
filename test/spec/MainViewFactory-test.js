/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, beforeEach, afterEach, it, runs, expect, waitsForDone */

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = require("spec/SpecRunnerUtils");

    describe("MainViewFactory", function () {
        this.category = "mainview";

        var CommandManager,          // loaded from brackets.test
            Commands,                // loaded from brackets.test
            DocumentManager,         // loaded from brackets.test
            EditorManager,           // loaded from brackets.test
            MainViewManager,         // loaded from brackets.test
            ProjectManager,          // loaded from brackets.test
            FileSystem,              // loaded from brackets.test
            Dialogs;                 // loaded from brackets.test

        var testPath = SpecRunnerUtils.getTestPath("/spec/MainViewFactory-test-files"),
            testWindow,
            _$,
            promise;

        var getFileObject = function (name) {
            return FileSystem.getFileForPath(testPath + "/" + name);
        };

        beforeEach(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                    testWindow = w;
                    _$ = testWindow.$;

                    // Load module instances from brackets.test
                    CommandManager  = testWindow.brackets.test.CommandManager;
                    Commands        = testWindow.brackets.test.Commands;
                    DocumentManager = testWindow.brackets.test.DocumentManager;
                    EditorManager   = testWindow.brackets.test.EditorManager;
                    MainViewManager = testWindow.brackets.test.MainViewManager;
                    ProjectManager  = testWindow.brackets.test.ProjectManager;
                    FileSystem      = testWindow.brackets.test.FileSystem;
                    Dialogs         = testWindow.brackets.test.Dialogs;
                });
            });
            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterEach(function () {
            MainViewManager._closeAll(MainViewManager.ALL_PANES);
            testWindow      = null;
            CommandManager  = null;
            Commands        = null;
            DocumentManager = null;
            EditorManager   = null;
            ProjectManager  = null;
            FileSystem      = null;
            SpecRunnerUtils.closeTestWindow();
        });

        describe("Opening and closing Images", function () {
            it("should open an image", function () {
                runs(function () {
                    promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, getFileObject("/images/events.jpg"));
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("events.jpg");
                    // should not have been added to the working set
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should close an image", function () {
                runs(function () {
                    promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, getFileObject("/images/events.jpg"));
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    MainViewManager._close(MainViewManager.ACTIVE_PANE, getFileObject("/images/events.jpg"));
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should add an image to the working set", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/images/events.jpg" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("events.jpg");
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(1);
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ACTIVE_PANE, testPath + "/images/events.jpg")).not.toEqual(-1);
                });
            });
        });
        describe("Managing Image Views", function () {
            it("Image Views should Reparent", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/images/events.jpg",
                                                                                            paneId: "first-pane"});
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/images/lrg_logo.png",
                                                                                            paneId: "second-pane"});
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/images/specials.jpg",
                                                                                            paneId: "second-pane"});
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/images/lrg_hero.jpg",
                                                                                            paneId: "second-pane"});
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 1);
                    expect(MainViewManager._getPaneIdForPath(testPath + "/images/events.jpg")).toEqual("first-pane");
                    expect(MainViewManager._getPaneIdForPath(testPath + "/images/lrg_logo.png")).toEqual("first-pane");
                    expect(MainViewManager._getPaneIdForPath(testPath + "/images/specials.jpg")).toEqual("first-pane");
                    expect(MainViewManager._getPaneIdForPath(testPath + "/images/lrg_hero.jpg")).toEqual("first-pane");
                });
            });
        });
    });
});
