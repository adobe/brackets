/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, describe, beforeEach, afterEach, it, runs, waits, waitsFor, expect, brackets, waitsForDone, spyOn, beforeFirst, afterLast, jasmine */

define(function (require, exports, module) {
    'use strict';
    
    var CommandManager,          // loaded from brackets.test
        Commands,                // loaded from brackets.test
        DocumentManager,         // loaded from brackets.test
        EditorManager,           // loaded from brackets.test
        MainViewManager,         // loaded from brackets.test
        ProjectManager,          // loaded from brackets.test
        SpecRunnerUtils          = require("spec/SpecRunnerUtils");

    describe("MainViewManager", function () {
        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/MainViewManager-test-files"),
            testFile = testPath + "/test.js",
            testWindow,
            _$,
            promise;

        
        beforeEach(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                    testWindow = w;
                    _$ = testWindow.$;

                    // Load module instances from brackets.test
                    CommandManager          = testWindow.brackets.test.CommandManager;
                    Commands                = testWindow.brackets.test.Commands;
                    DocumentManager         = testWindow.brackets.test.DocumentManager;
                    EditorManager           = testWindow.brackets.test.EditorManager;
                    MainViewManager         = testWindow.brackets.test.MainViewManager;
                    ProjectManager          = testWindow.brackets.test.ProjectManager;
                });
            });
            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });
        
        afterEach(function () {
            MainViewManager.doCloseAll();
            testWindow              = null;
            CommandManager          = null;
            Commands                = null;
            DocumentManager         = null;
            EditorManager           = null;
            ProjectManager          = null;
            SpecRunnerUtils.closeTestWindow();
        });
    
        describe("basic attributes", function () {
            it("should have an active pane id", function () {
                runs(function () {
                    expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
                });
            });
            it("should have only one pane", function () {
                runs(function () {
                    expect(MainViewManager.getPaneCount()).toEqual(1);
                    expect(MainViewManager.getPaneIdList().length).toEqual(1);
                    expect(MainViewManager.getPaneIdList()[0]).toEqual("first-pane");
                });
            });
            it("should not be viewing anything", function () {
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile()).toEqual(null);
                    expect(MainViewManager.getCurrentlyViewedPath()).toEqual(null);
                    expect(MainViewManager.getCurrentlyViewedFileForPane("first-pane")).toEqual(null);
                    expect(MainViewManager.getCurrentlyViewedPathForPane("first-pane")).toEqual(null);
                });
            });
            it("Pane should not have a title", function () {
                runs(function () {
                    expect(MainViewManager.getPaneTitle("first-pane")).toBeFalsy();
                });
            });
        });
        
        describe("open and close", function () {
            it("should open a file", function () {
                runs(function () {
                    promise = MainViewManager.doOpen(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath()).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getCurrentlyViewedFileForPane("first-pane").name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPathForPane("first-pane")).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getPaneViewListSize(MainViewManager.ALL_PANES)).toEqual(0);

                    MainViewManager.doClose(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getCurrentlyViewedFile()).toEqual(null);
                    expect(MainViewManager.getPaneViewListSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should add file to working-set when outside the project", function () {
                ProjectManager.isWithinProject = function () {
                    return false;
                };
                runs(function () {
                    promise = MainViewManager.doOpen(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath()).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getCurrentlyViewedFileForPane("first-pane").name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPathForPane("first-pane")).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getPaneViewListSize(MainViewManager.ALL_PANES)).toEqual(1);

                    MainViewManager.doClose(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getCurrentlyViewedFile()).toEqual(null);
                    expect(MainViewManager.getPaneViewListSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should edit a document", function () {
                runs(function () {
                    promise = new $.Deferred();
                    DocumentManager.getDocumentForPath(testPath + "/test.js")
                        .done(function (doc) {
                            MainViewManager.doEdit(MainViewManager.FOCUSED_PANE, doc);
                            promise.resolve();
                        });
                    
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath()).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getCurrentlyViewedFileForPane("first-pane").name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPathForPane("first-pane")).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getPaneViewListSize(MainViewManager.ALL_PANES)).toEqual(0);

                    MainViewManager.doClose(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getCurrentlyViewedFile()).toEqual(null);
                    expect(MainViewManager.getPaneViewListSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should not automatically be added to the working set when opening a file", function () {
                runs(function () {
                    promise = MainViewManager.doOpen(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.js");
                    expect(MainViewManager.getPaneViewListSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
        });
        
        describe("currentFileChanged", function () {
            it("should fire currentFileChanged event", function () {
                var currentFileChangedListener = jasmine.createSpy();

                runs(function () {
                    _$(MainViewManager).on("currentFileChanged", currentFileChangedListener);
                    expect(currentFileChangedListener.callCount).toBe(0);
                    promise = MainViewManager.doOpen(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(currentFileChangedListener.callCount).toBe(1);
                    expect(currentFileChangedListener.calls[0].args[1].name).toEqual("test.js");
                    expect(currentFileChangedListener.calls[0].args[2]).toEqual("first-pane");
                    MainViewManager.doCloseAll(MainViewManager.ALL_PANES);
                    expect(currentFileChangedListener.callCount).toBe(2);
                    expect(currentFileChangedListener.calls[1].args[1]).toEqual(null);
                    _$(MainViewManager).off("currentFileChanged", currentFileChangedListener);
                });
            });
            it("DocumentManager should listen to currentFileChanged events", function () {
                runs(function () {
                    promise = MainViewManager.doOpen(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(DocumentManager.getCurrentDocument()).toBeTruthy();
                    expect(DocumentManager.getCurrentDocument().file.name).toEqual("test.js");
                    MainViewManager.doCloseAll(MainViewManager.ALL_PANES);
                    expect(DocumentManager.getCurrentDocument()).toBe(null);
                });
            });
            it("EditorManager should listen to currentFileChanged events", function () {
                runs(function () {
                    promise = MainViewManager.doOpen(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(EditorManager.getCurrentFullEditor()).toBeTruthy();
                    expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.js");
                    MainViewManager.doCloseAll(MainViewManager.ALL_PANES);
                    expect(EditorManager.getCurrentFullEditor()).toBe(null);
                });
            });
        });
        describe("splitView", function () {
            it("should create a new pane", function () {
                var paneCreatedListener = jasmine.createSpy(),
                    paneLayoutChangedListener = jasmine.createSpy();
                    
                runs(function () {
                    _$(MainViewManager).on("paneCreated", paneCreatedListener);
                    _$(MainViewManager).on("paneLayoutChanged", paneLayoutChangedListener);
                });
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    expect(MainViewManager.getPaneCount()).toEqual(2);
                    expect(MainViewManager.getPaneIdList().length).toEqual(2);
                    expect(MainViewManager.getPaneIdList()[1]).toEqual("second-pane");
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(0);
                    
                    expect(paneCreatedListener.callCount).toBe(1);
                    expect(paneLayoutChangedListener.callCount).toBe(1);
                    
                    expect(paneCreatedListener.calls[0].args[1]).toEqual("second-pane");
                    expect(paneLayoutChangedListener.calls[0].args[1]).toEqual("VERTICAL");
                });
                runs(function () {
                    _$(MainViewManager).off("paneCreated", paneCreatedListener);
                    _$(MainViewManager).off("paneLayoutChanged", paneLayoutChangedListener);
                });
            });
            it("should should show interstitial page", function () {
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    var interstitials = _$(".not-editor");
                    expect(interstitials.length).toEqual(2);
                    expect(_$(interstitials[0]).css("display")).toNotEqual("none");
                    expect(_$(interstitials[1]).css("display")).toNotEqual("none");
                });
            });
            it("should destroy a pane", function () {
                var paneDestroyedListener = jasmine.createSpy(),
                    paneLayoutChangedListener = jasmine.createSpy();
                    
                runs(function () {
                    _$(MainViewManager).on("paneDestroyed", paneDestroyedListener);
                    _$(MainViewManager).on("paneLayoutChanged", paneLayoutChangedListener);
                });
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    expect(MainViewManager.getPaneCount()).toEqual(2);
                    expect(MainViewManager.getPaneIdList().length).toEqual(2);
                    expect(MainViewManager.getPaneIdList()[1]).toEqual("second-pane");
                });
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    expect(MainViewManager.getPaneCount()).toEqual(1);
                    expect(MainViewManager.getPaneIdList().length).toEqual(1);
                    expect(MainViewManager.getPaneIdList()[0]).toEqual("first-pane");

                    expect(paneDestroyedListener.callCount).toBe(1);
                    expect(paneLayoutChangedListener.callCount).toBe(2);
                    
                    expect(paneDestroyedListener.calls[0].args[1]).toEqual("second-pane");
                    expect(paneLayoutChangedListener.calls[1].args[1]).toBeFalsy();
                });
                runs(function () {
                    _$(MainViewManager).off("paneDestroyed", paneDestroyedListener);
                    _$(MainViewManager).off("paneLayoutChanged", paneLayoutChangedListener);
                });
            });
            it("should show two files", function () {
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.css")).toEqual("second-pane");
                });
                runs(function () {
                    expect(MainViewManager.getPaneViewListSize("first-pane")).toEqual(0);
                    expect(MainViewManager.getPaneViewListSize("second-pane")).toEqual(0);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.js");
                    expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.js");
                    MainViewManager.setActivePaneId("second-pane");
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.css");
                    expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.css");
                });
            });
            it("should merge two panes to the right", function () {
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getPaneViewListSize("first-pane")).toEqual(0);
                    expect(MainViewManager.getPaneViewListSize("second-pane")).toEqual(0);
                });
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.js")).toEqual(null);
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.css")).toEqual("first-pane");
                });
            });
            it("should merge two panes to the left", function () {
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getPaneViewListSize("first-pane")).toEqual(0);
                    expect(MainViewManager.getPaneViewListSize("second-pane")).toEqual(0);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.css")).toEqual(null);
                });
            });
            it("should activate pane when editor gains focus", function () {
                var editors = {
                    },
                    handler = function (e, doc, editor, paneId) {
                        editors[doc.file.name] = editor;
                    };
                
                runs(function () {
                    _$(EditorManager).on("fullEditorCreatedForDocument", handler);
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    editors["test.css"].focus();
                    expect(MainViewManager.getActivePaneId()).toEqual("second-pane");
                    editors["test.js"].focus();
                    expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
                });
                runs(function () {
                    editors = null;
                    _$(EditorManager).off("fullEditorCreatedForDocument", handler);
                });
            });
            it("should activate pane when pane is clicked", function () {
                var activePaneChangedListener = jasmine.createSpy();
                
                runs(function () {
                    _$(MainViewManager).on("activePaneChanged", activePaneChangedListener);
                });
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    _$("#second-pane").click();
                    expect(MainViewManager.getActivePaneId()).toEqual("second-pane");
                    _$("#first-pane").click();
                    expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
                });
                runs(function () {
                    expect(activePaneChangedListener.callCount).toBe(2);
                });
                _$(MainViewManager).off("activePaneChanged", activePaneChangedListener);
            });

        
        });
        describe("pane targeting", function () {
            it("should count open views", function () {
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_VIEW_LIST,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_VIEW_LIST,  { fullPath: testPath + "/test.css",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getPaneViewListSize(MainViewManager.ALL_PANES)).toEqual(2);
                    expect(MainViewManager.getPaneViewListSize(MainViewManager.FOCUSED_PANE)).toEqual(1);
                });
            });
            it("should find file in view", function () {
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_VIEW_LIST,  { fullPath: testPath + "/test.js",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.findInPaneViewList(MainViewManager.ALL_PANES, testPath + "/test.js").paneId).toEqual("second-pane");
                });
            });
            it("should reopen file in view", function () {
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_VIEW_LIST,  { fullPath: testPath + "/test.js",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_VIEW_LIST,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.js")).toEqual("second-pane");
                });
            });
            it("should close all files in pane", function () {
                runs(function () {
                    promise = CommandManager.execute("cmd.splitVertically");
                    waitsForDone(promise, "cmd.splitVertically");
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_VIEW_LIST,  { fullPath: testPath + "/test.js",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_VIEW_LIST,  { fullPath: testPath + "/test.css",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    MainViewManager.doCloseAll("second-pane");
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(1);
                });
                runs(function () {
                    MainViewManager.doCloseAll("first-pane");
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(0);
                });
            });
                        
        });
    });
});
