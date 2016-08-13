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

/*global describe, beforeEach, afterEach, it, runs, expect, waitsForDone, spyOn, jasmine */

define(function (require, exports, module) {
    'use strict';

    var CommandManager,          // loaded from brackets.test
        Commands,                // loaded from brackets.test
        DocumentManager,         // loaded from brackets.test
        EditorManager,           // loaded from brackets.test
        MainViewManager,         // loaded from brackets.test
        ProjectManager,          // loaded from brackets.test
        FileSystem,              // loaded from brackets.test
        Dialogs,                 // loaded from brackets.test
        SpecRunnerUtils          = require("spec/SpecRunnerUtils");

    describe("MainViewManager", function () {
        this.category = "mainview";

        var testPath = SpecRunnerUtils.getTestPath("/spec/MainViewManager-test-files"),
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
                    CommandManager          = testWindow.brackets.test.CommandManager;
                    Commands                = testWindow.brackets.test.Commands;
                    DocumentManager         = testWindow.brackets.test.DocumentManager;
                    EditorManager           = testWindow.brackets.test.EditorManager;
                    MainViewManager         = testWindow.brackets.test.MainViewManager;
                    ProjectManager          = testWindow.brackets.test.ProjectManager;
                    FileSystem              = testWindow.brackets.test.FileSystem;
                    Dialogs                 = testWindow.brackets.test.Dialogs;
                });
            });
            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterEach(function () {
            MainViewManager._closeAll(MainViewManager.ALL_PANES);
            testWindow              = null;
            CommandManager          = null;
            Commands                = null;
            DocumentManager         = null;
            EditorManager           = null;
            ProjectManager          = null;
            FileSystem              = null;
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
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                    expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(null);
                    expect(MainViewManager.getCurrentlyViewedFile("first-pane")).toEqual(null);
                    expect(MainViewManager.getCurrentlyViewedPath("first-pane")).toEqual(null);
                });
            });
            it("Pane should not have a title", function () {
                runs(function () {
                    expect(MainViewManager.getPaneTitle("first-pane")).toBeFalsy();
                });
            });
        });

        describe("opening and closing files", function () {
            it("should open a file", function () {
                runs(function () {
                    promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getCurrentlyViewedFile("first-pane").name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath("first-pane")).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);

                    MainViewManager._close(MainViewManager.ACTIVE_PANE, { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should add file to working-set when opening files that are outside of the project", function () {
                ProjectManager.isWithinProject = function () {
                    return false;
                };
                runs(function () {
                    promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getCurrentlyViewedFile("first-pane").name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath("first-pane")).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(1);

                    MainViewManager._close(MainViewManager.ACTIVE_PANE, { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should edit a document", function () {
                runs(function () {
                    promise = new $.Deferred();
                    DocumentManager.getDocumentForPath(testPath + "/test.js")
                        .done(function (doc) {
                            MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                            promise.resolve();
                        });

                    waitsForDone(promise, "MainViewManager.doEdit");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getCurrentlyViewedFile("first-pane").name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath("first-pane")).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);

                    MainViewManager._close(MainViewManager.ACTIVE_PANE, { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should not automatically be added to the working set when opening a file", function () {
                runs(function () {
                    promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should fail when operating on an invalid pane id", function () {
                runs(function () {
                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    var testme = function () {
                        CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                                paneId: "second-pane" });
                    };
                    expect(testme).toThrow();
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toBeFalsy();
                });
                runs(function () {
                    expect(function () {MainViewManager.setActivePaneId("second-pane"); }).toThrow();
                    expect(MainViewManager.getActivePaneId()).toNotEqual("second-pane");
                });
                runs(function () {
                    expect(function () {MainViewManager.addToWorkingSet("second-pane", getFileObject("test.js")); }).toThrow();
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, testPath + "/test.js")).toEqual(-1);
                    expect(function () {MainViewManager.findInWorkingSet("second-pane", testPath + "/test.js"); }).toThrow();
                });
                runs(function () {
                    expect(function () {MainViewManager.addListToWorkingSet("second-pane", [getFileObject("test.js")]); }).toThrow();
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, testPath + "/test.js")).toEqual(-1);
                    expect(function () {MainViewManager.findInWorkingSet("second-pane", testPath + "/test.js"); }).toThrow();
                });
            });
        });
        describe("editor manager integration", function () {

            beforeEach(function () {
            });

            it("should report the existing editor as the current full editor", function () {
                var promise,
                    testDoc;
                runs(function () {
                    promise = new $.Deferred();
                    DocumentManager.getDocumentForPath(testPath + "/test.js")
                        .done(function (doc) {
                            testDoc = doc;
                            MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                            promise.resolve();
                        });

                    waitsForDone(promise, "MainViewManager.doEdit");
                });
                runs(function () {
                    expect(EditorManager.getCurrentFullEditor()).toEqual(testDoc._masterEditor);
                });
            });
            it("should notify when active editor changes", function () {
                var promise,
                    docChangeListener = jasmine.createSpy(),
                    activeEditorChangeListener = jasmine.createSpy();

                runs(function () {
                    DocumentManager.on("currentDocumentChange", docChangeListener);
                    EditorManager.on("activeEditorChange", activeEditorChangeListener);
                });
                runs(function () {
                    promise = new $.Deferred();
                    DocumentManager.getDocumentForPath(testPath + "/test.js")
                        .done(function (doc) {
                            MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                            promise.resolve();
                        });

                    waitsForDone(promise, "MainViewManager.doEdit");
                });
                runs(function () {
                    expect(docChangeListener).toHaveBeenCalled();
                    expect(activeEditorChangeListener).toHaveBeenCalled();
                });
            });
        });
        describe("currentFileChange event handlers", function () {
            it("should fire currentFileChange event", function () {
                var currentFileChangeListener = jasmine.createSpy();

                runs(function () {
                    MainViewManager.on("currentFileChange", currentFileChangeListener);
                    expect(currentFileChangeListener.callCount).toBe(0);
                    promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(currentFileChangeListener.callCount).toBe(1);
                    expect(currentFileChangeListener.calls[0].args[1].name).toEqual("test.js");
                    expect(currentFileChangeListener.calls[0].args[2]).toEqual("first-pane");
                    MainViewManager._closeAll(MainViewManager.ALL_PANES);
                    expect(currentFileChangeListener.callCount).toBe(2);
                    expect(currentFileChangeListener.calls[1].args[1]).toEqual(null);
                    MainViewManager.off("currentFileChange", currentFileChangeListener);
                });
            });
            it("DocumentManager should listen to currentFileChange events", function () {
                runs(function () {
                    promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(DocumentManager.getCurrentDocument()).toBeTruthy();
                    expect(DocumentManager.getCurrentDocument().file.name).toEqual("test.js");
                    MainViewManager._closeAll(MainViewManager.ALL_PANES);
                    expect(DocumentManager.getCurrentDocument()).toBe(null);
                });
            });
            it("EditorManager should listen to currentFileChange events", function () {
                runs(function () {
                    promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(EditorManager.getCurrentFullEditor()).toBeTruthy();
                    expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.js");
                    MainViewManager._closeAll(MainViewManager.ALL_PANES);
                    expect(EditorManager.getCurrentFullEditor()).toBe(null);
                });
            });
        });
        describe("Splitting Views", function () {
            it("should create a new pane", function () {
                var paneCreateListener = jasmine.createSpy(),
                    paneLayoutChangeListener = jasmine.createSpy();

                runs(function () {
                    MainViewManager.on("paneCreate", paneCreateListener);
                    MainViewManager.on("paneLayoutChange", paneLayoutChangeListener);
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    expect(MainViewManager.getPaneCount()).toEqual(2);
                    expect(MainViewManager.getPaneIdList().length).toEqual(2);
                    expect(MainViewManager.getPaneIdList()[1]).toEqual("second-pane");
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(0);

                    expect(paneCreateListener.callCount).toBe(1);
                    expect(paneLayoutChangeListener.callCount).toBe(1);

                    expect(paneCreateListener.calls[0].args[1]).toEqual("second-pane");
                    expect(paneLayoutChangeListener.calls[0].args[1]).toEqual("VERTICAL");
                });
                runs(function () {
                    MainViewManager.off("paneCreate", paneCreateListener);
                    MainViewManager.off("paneLayoutChange", paneLayoutChangeListener);
                });
            });
            it("should should show interstitial page", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    var interstitials = _$(".not-editor");
                    expect(interstitials.length).toEqual(2);
                    expect(_$(interstitials[0]).css("display")).toNotEqual("none");
                    expect(_$(interstitials[1]).css("display")).toNotEqual("none");
                });
            });
            it("should destroy a pane", function () {
                var paneDestroyListener = jasmine.createSpy(),
                    paneLayoutChangeListener = jasmine.createSpy();

                runs(function () {
                    MainViewManager.on("paneDestroy", paneDestroyListener);
                    MainViewManager.on("paneLayoutChange", paneLayoutChangeListener);
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    expect(MainViewManager.getPaneCount()).toEqual(2);
                    expect(MainViewManager.getPaneIdList().length).toEqual(2);
                    expect(MainViewManager.getPaneIdList()[1]).toEqual("second-pane");
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 1);
                });
                runs(function () {
                    expect(MainViewManager.getPaneCount()).toEqual(1);
                    expect(MainViewManager.getPaneIdList().length).toEqual(1);
                    expect(MainViewManager.getPaneIdList()[0]).toEqual("first-pane");

                    expect(paneDestroyListener.callCount).toBe(1);
                    expect(paneLayoutChangeListener.callCount).toBe(2);

                    expect(paneDestroyListener.calls[0].args[1]).toEqual("second-pane");
                    expect(paneLayoutChangeListener.calls[1].args[1]).toBeFalsy();
                });
                runs(function () {
                    MainViewManager.off("paneDestroy", paneDestroyListener);
                    MainViewManager.off("paneLayoutChange", paneLayoutChangeListener);
                });
            });
            it("should show two files", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
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
                    expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                    expect(MainViewManager._getPaneIdForPath(testPath + "/test.css")).toEqual("second-pane");
                });
                runs(function () {
                    expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(0);
                    expect(MainViewManager.getWorkingSetSize("second-pane")).toEqual(0);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                    expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.js");
                    MainViewManager.setActivePaneId("second-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.css");
                    expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.css");
                });
            });
            it("should flip the view to the other pane", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                    MainViewManager.setActivePaneId("second-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                });
                runs(function () {
                    MainViewManager._getPane("first-pane").$headerFlipViewBtn.trigger("click");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                    MainViewManager.setActivePaneId("second-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                });
                runs(function () {
                    MainViewManager._getPane("second-pane").$headerFlipViewBtn.trigger("click");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                    MainViewManager.setActivePaneId("second-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                });
            });
            it("should merge two panes to the right", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
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
                    expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(0);
                    expect(MainViewManager.getWorkingSetSize("second-pane")).toEqual(0);
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 1);
                });
                runs(function () {
                    expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual(null);
                    expect(MainViewManager._getPaneIdForPath(testPath + "/test.css")).toEqual("first-pane");
                });
            });
            it("should merge two panes to the left", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
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
                    expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(0);
                    expect(MainViewManager.getWorkingSetSize("second-pane")).toEqual(0);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.setLayoutScheme(1, 1);
                });
                runs(function () {
                    expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                    expect(MainViewManager._getPaneIdForPath(testPath + "/test.css")).toEqual(null);
                });
            });
            it("should close the view when clicked", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                });
                runs(function () {
                    MainViewManager._getPane("first-pane").$headerCloseBtn.trigger("click");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                });
            });
            it("should collapse the panes when close button is clicked on a pane with no files", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    MainViewManager._getPane("first-pane").$headerCloseBtn.trigger("click");
                });
                runs(function () {
                    expect(MainViewManager.getLayoutScheme()).toEqual({rows: 1, columns: 1});
                });
            });
            it("should activate pane when editor gains focus", function () {
                var editors = {},
                    handler = function (e, doc, editor, paneId) {
                        editors[doc.file.name] = editor;
                    };

                runs(function () {
                    EditorManager.on("_fullEditorCreatedForDocument", handler);
                    MainViewManager.setLayoutScheme(1, 2);
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
                    EditorManager.off("_fullEditorCreatedForDocument", handler);
                });
            });
            it("should activate pane when inline editor gains focus", function () {
                var inlineEditor,
                    editors = {},
                    handler = function (e, doc, editor, paneId) {
                        editors[doc.file.name] = editor;
                    };

                runs(function () {
                    EditorManager.on("_fullEditorCreatedForDocument", handler);
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.html",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");

                    // open inline editor at specified offset index
                    var inlineEditorResult = SpecRunnerUtils.toggleQuickEditAtOffset(editors["test.html"], {line: 8, ch: 14});
                    waitsForDone(inlineEditorResult, "inline editor opened", 1000);
                });

                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    inlineEditor = EditorManager.getInlineEditors(editors["test.html"])[0];
                    inlineEditor.focus();
                    expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
                });
            });
            it("should activate pane when pane is clicked", function () {
                var activePaneChangeListener = jasmine.createSpy();

                runs(function () {
                    MainViewManager.on("activePaneChange", activePaneChangeListener);
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    _$("#second-pane").click();
                    expect(MainViewManager.getActivePaneId()).toEqual("second-pane");
                    _$("#first-pane").click();
                    expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
                });
                runs(function () {
                    expect(activePaneChangeListener.callCount).toBe(2);
                });
                MainViewManager.off("activePaneChange", activePaneChangeListener);
            });
            it("should enforce bounds", function () {
                runs(function () {
                    expect(MainViewManager.setLayoutScheme(1, 4)).toBeFalsy();
                    expect(MainViewManager.setLayoutScheme(4, -2)).toBeFalsy();
                    expect(MainViewManager.setLayoutScheme(0, 0)).toBeFalsy();
                    expect(MainViewManager.setLayoutScheme(-1, -1)).toBeFalsy();
                    expect(MainViewManager.setLayoutScheme(4, 1)).toBeFalsy();
                    expect(MainViewManager.setLayoutScheme(1, 1)).toBeTruthy();
                    expect(MainViewManager.setLayoutScheme(1, 2)).toBeTruthy();
                    expect(MainViewManager.setLayoutScheme(2, 1)).toBeTruthy();
                });
            });
            it("should toggle layout", function () {
                var paneLayoutChangeListener = jasmine.createSpy();

                runs(function () {
                    MainViewManager.on("paneLayoutChange", paneLayoutChangeListener);
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                    expect(MainViewManager.getLayoutScheme()).toEqual({rows: 1, columns: 2});
                    expect(paneLayoutChangeListener.calls[0].args[1]).toEqual("VERTICAL");
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
                    MainViewManager.setLayoutScheme(2, 1);
                    expect(MainViewManager.getLayoutScheme()).toEqual({rows: 2, columns: 1});
                    expect(paneLayoutChangeListener.calls[1].args[1]).toEqual("HORIZONTAL");
                });
                runs(function () {
                    expect(paneLayoutChangeListener.callCount).toBe(2);
                });
                MainViewManager.off("paneLayoutChange", paneLayoutChangeListener);
            });
        });
        describe("Targeted Pane API tests", function () {
            it("should count open views", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(2);
                    expect(MainViewManager.getWorkingSetSize(MainViewManager.ACTIVE_PANE)).toEqual(1);
                });
            });
            it("should find file in view", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.findInAllWorkingSets(testPath + "/test.js").shift().paneId).toEqual("second-pane");
                });
            });
            it("should reopen file in view", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                // With same doc split doc should be opened in first pane as well
                runs(function () {
                    expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                });
            });
            it("should close all files in pane", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    MainViewManager._closeAll("second-pane");
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(1);
                });
                runs(function () {
                    MainViewManager._closeAll("first-pane");
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(0);
                });
            });
            it("should allow closed files to reopen in new pane", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    MainViewManager._close("second-pane", { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(1);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                });
            });
            it("should add to the appropriate workingset", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addToWorkingSet(MainViewManager.ACTIVE_PANE, getFileObject("test.js"));
                    expect(MainViewManager.findInAllWorkingSets(testPath + "/test.js").shift().paneId).toEqual("second-pane");
                });
            });
            it("should add list to the appropriate workingset", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.html",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addListToWorkingSet(MainViewManager.ACTIVE_PANE, [getFileObject("test.js"),
                                                                                         getFileObject("test.css"),
                                                                                         getFileObject("test.html")]);
                    // test.js gets added to the second pane because it was closed in the first-pane when test.css was opened
                    expect(MainViewManager.findInAllWorkingSets(testPath + "/test.js").shift().paneId).toEqual("second-pane");

                    // test.css will be opened in second pane as well and in mru list will be ahead of the first pane entry
                    expect(MainViewManager.findInAllWorkingSets(testPath + "/test.css").shift().paneId).toEqual("second-pane");
                    expect(MainViewManager.findInAllWorkingSets(testPath + "/test.html").shift().paneId).toEqual("second-pane");
                });
            });
        });
        describe("workingSetList Management tests", function () {
            beforeEach(function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
            });
            it("should add file to FOCUSED pane", function () {
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.addToWorkingSet(MainViewManager.ACTIVE_PANE, getFileObject("test.js"));
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addToWorkingSet(MainViewManager.ACTIVE_PANE, getFileObject("test.css"));
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.css").fullPath)).toEqual("second-pane");
                });
            });
            it("should add files to FOCUSED pane", function () {
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.addListToWorkingSet(MainViewManager.ACTIVE_PANE, [getFileObject("test.js"),
                                                                                         getFileObject("test.css")]);
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.css").fullPath)).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addListToWorkingSet(MainViewManager.ACTIVE_PANE, [getFileObject("test.txt"),
                                                                                         getFileObject("test.html")]);
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.txt").fullPath)).toEqual("second-pane");
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.html").fullPath)).toEqual("second-pane");
                });
            });
            it("should add file to appropriate pane", function () {
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addToWorkingSet("first-pane", getFileObject("test.js"));
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.addToWorkingSet("second-pane", getFileObject("test.css"));
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.css").fullPath)).toEqual("second-pane");
                });
            });
            it("should add files to appropriate pane", function () {
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.css").fullPath)).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.addListToWorkingSet("second-pane", [getFileObject("test.txt"),
                                                                         getFileObject("test.html")]);
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.txt").fullPath)).toEqual("second-pane");
                    expect(MainViewManager._getPaneIdForPath(getFileObject("test.html").fullPath)).toEqual("second-pane");
                });
            });
            it("should not add list of files to ALL_PANES ", function () {
                runs(function () {
                    expect(function () {
                        MainViewManager.addListToWorkingSet(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    }).toThrow();
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, getFileObject("test.js").fullPath)).toEqual(-1);
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, getFileObject("test.css").fullPath)).toEqual(-1);
                });
            });
            it("should not add a file to ALL_PANES ", function () {
                runs(function () {
                    expect(function () {
                        MainViewManager.addToWorkingSet(MainViewManager.ALL_PANES, getFileObject("test.css"));
                    }).toThrow();
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, getFileObject("test.css").fullPath)).toEqual(-1);
                });
            });
            it("should remove the view when removing a file from a workingset", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });

                runs(function () {
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager._close(MainViewManager.ALL_PANES, getFileObject("test.css"));
                    expect(MainViewManager.getCurrentlyViewedFile("first-pane").name).toEqual("test.js");
                });
            });
            it("should remove the file when removing from a targeted pane", function () {
                runs(function () {
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager._close("first-pane", getFileObject("test.css"));
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, getFileObject("test.css").fullPath)).toEqual(-1);
                });
            });
            it("should remove the file when removing from the FOCUSED pane", function () {
                runs(function () {
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager._close(MainViewManager.ACTIVE_PANE, getFileObject("test.js"));
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, getFileObject("test.js").fullPath)).toEqual(-1);
                });
            });
            it("should remove the file when removing from ALL_PANES", function () {
                runs(function () {
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager._close(MainViewManager.ALL_PANES, getFileObject("test.js"));
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, getFileObject("test.js").fullPath)).toEqual(-1);
                });
            });
            //

            it("should remove the view when removing files from a workingset", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                });

                runs(function () {
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager._closeList(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                                            getFileObject("test.css")]);
                    expect(Object.keys(MainViewManager._getPane("first-pane")._views).length).toEqual(0);
                });
            });
            it("should remove files from the workingset", function () {
                runs(function () {
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager._closeList(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                                           getFileObject("test.css")]);
                    expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(0);
                });
            });
            it("should remove files from the workingset", function () {
                runs(function () {
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager._closeList(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                                           getFileObject("test.css")]);
                    expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(0);
                });
            });
            it("should remove files when removing from a targeted pane", function () {
                runs(function () {
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager._closeList("first-pane", [getFileObject("test.js"),
                                                                              getFileObject("test.css")]);
                    expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(0);
                });
            });
            it("should remove the file when removing from the FOCUSED pane", function () {
                runs(function () {
                    MainViewManager.addListToWorkingSet("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager._closeList(MainViewManager.ACTIVE_PANE, [getFileObject("test.js"),
                                                                                              getFileObject("test.css")]);
                    expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(0);
                });
            });
            it("should remove the file when removing from ALL_PANES", function () {
                runs(function () {
                    MainViewManager.addToWorkingSet("first-pane", getFileObject("test.js"));
                    MainViewManager.addToWorkingSet("second-pane", getFileObject("test.css"));
                    MainViewManager._closeList(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                                           getFileObject("test.css")]);
                    expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(0);
                    expect(MainViewManager.getWorkingSetSize("second-pane")).toEqual(0);
                });
            });
            it("should find file in view", function () {
                runs(function () {
                    MainViewManager.addToWorkingSet("second-pane", getFileObject("test.js"));
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    expect(MainViewManager.findInAllWorkingSets(getFileObject("test.js").fullPath).shift().paneId).toEqual("second-pane");
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ACTIVE_PANE, getFileObject("test.js").fullPath)).toEqual(-1);
                    expect(MainViewManager.findInWorkingSet("second-pane", getFileObject("test.js").fullPath)).toNotEqual(-1);
                    expect(MainViewManager.findInWorkingSet("first-pane", getFileObject("test.js").fullPath)).toEqual(-1);
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, getFileObject("test.css").fullPath)).toEqual(-1);
                });
            });
        });

        describe("Traversing Files", function () {
            beforeEach(function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.html",
                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    MainViewManager.addToWorkingSet("first-pane", getFileObject("test.js"));
                    MainViewManager.addToWorkingSet("first-pane", getFileObject("test.css"));
                    MainViewManager.addToWorkingSet("second-pane", getFileObject("test.html"));
                });
            });

            it("should traverse in list order", function () {
                runs(function () {
                    // Make test.js the active file
                    promise = new $.Deferred();
                    DocumentManager.getDocumentForPath(testPath + "/test.js")
                        .done(function (doc) {
                            MainViewManager._edit("first-pane", doc);
                            promise.resolve();
                        });
                    waitsForDone(promise, "MainViewManager._edit");
                });
                runs(function () {
                    var traverseResult = MainViewManager.traverseToNextViewInListOrder(1);

                    expect(traverseResult.file).toEqual(getFileObject("test.css"));
                    expect(traverseResult.pane).toEqual("first-pane");
                });
            });

            it("should traverse between panes in list order", function () {
                runs(function () {
                    var traverseResult = MainViewManager.traverseToNextViewInListOrder(1);

                    expect(traverseResult.file).toEqual(getFileObject("test.js"));
                    expect(traverseResult.pane).toEqual("first-pane");
                });
            });

            it("should traverse to the first Working Set item if a file not in the Working Set is being viewed", function () {
                runs(function () {
                    // Close test.js to then reopen it without being in the Working Set
                    CommandManager.execute(Commands.FILE_CLOSE, { file: getFileObject("test.js") });
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");

                    var traverseResult = MainViewManager.traverseToNextViewInListOrder(1);

                    expect(traverseResult.file).toEqual(getFileObject("test.css"));
                    expect(traverseResult.pane).toEqual("first-pane");
                });
            });

            it("should traverse between panes in reverse list order", function () {
                runs(function () {
                    // Make test.js the active file
                    promise = new $.Deferred();
                    DocumentManager.getDocumentForPath(testPath + "/test.js")
                        .done(function (doc) {
                            MainViewManager._edit("first-pane", doc);
                            promise.resolve();
                        });
                    waitsForDone(promise, "MainViewManager._edit");
                });
                runs(function () {
                    var traverseResult = MainViewManager.traverseToNextViewInListOrder(-1);

                    expect(traverseResult.file).toEqual(getFileObject("test.html"));
                    expect(traverseResult.pane).toEqual("second-pane");
                });
            });
        });
    });
});
