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
/*global define, $, describe, beforeEach, afterEach, it, runs, waits, waitsFor, expect, brackets, waitsForDone, waitsForFail, spyOn, beforeFirst, afterLast, jasmine */

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
            testFile = testPath + "/test.js",
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
            MainViewManager.closeAll();
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
        
        describe("opening and closing files", function () {
            it("should open a file", function () {
                runs(function () {
                    promise = MainViewManager.open(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath()).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getCurrentlyViewedFileForPane("first-pane").name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPathForPane("first-pane")).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getViewCount(MainViewManager.ALL_PANES)).toEqual(0);

                    MainViewManager.close(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getCurrentlyViewedFile()).toEqual(null);
                    expect(MainViewManager.getViewCount(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should add file to working-set when opening files that are outside of the project", function () {
                ProjectManager.isWithinProject = function () {
                    return false;
                };
                runs(function () {
                    promise = MainViewManager.open(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath()).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getCurrentlyViewedFileForPane("first-pane").name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPathForPane("first-pane")).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getViewCount(MainViewManager.ALL_PANES)).toEqual(1);

                    MainViewManager.close(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getCurrentlyViewedFile()).toEqual(null);
                    expect(MainViewManager.getViewCount(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should edit a document", function () {
                runs(function () {
                    promise = new $.Deferred();
                    DocumentManager.getDocumentForPath(testPath + "/test.js")
                        .done(function (doc) {
                            MainViewManager.edit(MainViewManager.FOCUSED_PANE, doc);
                            promise.resolve();
                        });
                    
                    waitsForDone(promise, "MainViewManager.doEdit");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPath()).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getCurrentlyViewedFileForPane("first-pane").name).toEqual("test.js");
                    expect(MainViewManager.getCurrentlyViewedPathForPane("first-pane")).toEqual(testPath + "/test.js");
                    expect(MainViewManager.getViewCount(MainViewManager.ALL_PANES)).toEqual(0);

                    MainViewManager.close(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getCurrentlyViewedFile()).toEqual(null);
                    expect(MainViewManager.getViewCount(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should not automatically be added to the working set when opening a file", function () {
                runs(function () {
                    promise = MainViewManager.open(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile().name).toEqual("test.js");
                    expect(MainViewManager.getViewCount(MainViewManager.ALL_PANES)).toEqual(0);
                });
            });
            it("should fail when operating on an invalid pane id", function () {
                runs(function () {
                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "second-pane" });
                    waitsForFail(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getCurrentlyViewedFile()).toBeFalsy();
                });
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    expect(MainViewManager.getActivePaneId()).toNotEqual("second-pane");
                });
                runs(function () {
                    MainViewManager.addView("second-pane", getFileObject("test.js"));
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, testPath + "/test.js")).toEqual(-1);
                    expect(MainViewManager.findViewOf("second-pane", testPath + "/test.js")).toEqual(-1);
                });
                runs(function () {
                    MainViewManager.addViews("second-pane", [getFileObject("test.js")]);
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, testPath + "/test.js")).toEqual(-1);
                    expect(MainViewManager.findViewOf("second-pane", testPath + "/test.js")).toEqual(-1);
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
                            MainViewManager.edit(MainViewManager.FOCUSED_PANE, doc);
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
                    _$(DocumentManager).on("currentDocumentChange", docChangeListener);
                    _$(EditorManager).on("activeEditorChange", activeEditorChangeListener);
                });
                runs(function () {
                    promise = new $.Deferred();
                    DocumentManager.getDocumentForPath(testPath + "/test.js")
                        .done(function (doc) {
                            MainViewManager.edit(MainViewManager.FOCUSED_PANE, doc);
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
        describe("currentFileChanged event handlers", function () {
            it("should fire currentFileChanged event", function () {
                var currentFileChangedListener = jasmine.createSpy();

                runs(function () {
                    _$(MainViewManager).on("currentFileChanged", currentFileChangedListener);
                    expect(currentFileChangedListener.callCount).toBe(0);
                    promise = MainViewManager.open(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(currentFileChangedListener.callCount).toBe(1);
                    expect(currentFileChangedListener.calls[0].args[1].name).toEqual("test.js");
                    expect(currentFileChangedListener.calls[0].args[2]).toEqual("first-pane");
                    MainViewManager.closeAll(MainViewManager.ALL_PANES);
                    expect(currentFileChangedListener.callCount).toBe(2);
                    expect(currentFileChangedListener.calls[1].args[1]).toEqual(null);
                    _$(MainViewManager).off("currentFileChanged", currentFileChangedListener);
                });
            });
            it("DocumentManager should listen to currentFileChanged events", function () {
                runs(function () {
                    promise = MainViewManager.open(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(DocumentManager.getCurrentDocument()).toBeTruthy();
                    expect(DocumentManager.getCurrentDocument().file.name).toEqual("test.js");
                    MainViewManager.closeAll(MainViewManager.ALL_PANES);
                    expect(DocumentManager.getCurrentDocument()).toBe(null);
                });
            });
            it("EditorManager should listen to currentFileChanged events", function () {
                runs(function () {
                    promise = MainViewManager.open(MainViewManager.FOCUSED_PANE, { fullPath: testPath + "/test.js" });
                    waitsForDone(promise, "MainViewManager.doOpen");
                });
                runs(function () {
                    expect(EditorManager.getCurrentFullEditor()).toBeTruthy();
                    expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.js");
                    MainViewManager.closeAll(MainViewManager.ALL_PANES);
                    expect(EditorManager.getCurrentFullEditor()).toBe(null);
                });
            });
        });
        describe("Splitting Views", function () {
            it("should create a new pane", function () {
                var paneCreatedListener = jasmine.createSpy(),
                    paneLayoutChangedListener = jasmine.createSpy();
                    
                runs(function () {
                    _$(MainViewManager).on("paneCreated", paneCreatedListener);
                    _$(MainViewManager).on("paneLayoutChanged", paneLayoutChangedListener);
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
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
                var paneDestroyedListener = jasmine.createSpy(),
                    paneLayoutChangedListener = jasmine.createSpy();
                    
                runs(function () {
                    _$(MainViewManager).on("paneDestroyed", paneDestroyedListener);
                    _$(MainViewManager).on("paneLayoutChanged", paneLayoutChangedListener);
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
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.css")).toEqual("second-pane");
                });
                runs(function () {
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                    expect(MainViewManager.getViewCount("second-pane")).toEqual(0);
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
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                    expect(MainViewManager.getViewCount("second-pane")).toEqual(0);
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 1);
                });
                runs(function () {
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.js")).toEqual(null);
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.css")).toEqual("first-pane");
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
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                    expect(MainViewManager.getViewCount("second-pane")).toEqual(0);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.setLayoutScheme(1, 1);
                });
                runs(function () {
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.css")).toEqual(null);
                });
            });
            it("should activate pane when editor gains focus", function () {
                var editors = {},
                    handler = function (e, doc, editor, paneId) {
                        editors[doc.file.name] = editor;
                    };
                
                runs(function () {
                    _$(EditorManager).on("_fullEditorCreatedForDocument", handler);
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
                    _$(EditorManager).off("_fullEditorCreatedForDocument", handler);
                });
            });
            it("should activate pane when inline editor gains focus", function () {
                var editor,
                    inlineEditor,
                    editors = {},
                    handler = function (e, doc, editor, paneId) {
                        editors[doc.file.name] = editor;
                    };
                
                runs(function () {
                    _$(EditorManager).on("_fullEditorCreatedForDocument", handler);
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
                var activePaneChangedListener = jasmine.createSpy();
                
                runs(function () {
                    _$(MainViewManager).on("activePaneChanged", activePaneChangedListener);
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
                    expect(activePaneChangedListener.callCount).toBe(2);
                });
                _$(MainViewManager).off("activePaneChanged", activePaneChangedListener);
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
                var paneLayoutChangedListener = jasmine.createSpy();
                
                runs(function () {
                    _$(MainViewManager).on("paneLayoutChanged", paneLayoutChangedListener);
                });
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                    expect(MainViewManager.getLayoutScheme()).toEqual({rows: 1, columns: 2});
                    expect(paneLayoutChangedListener.calls[0].args[1]).toEqual("VERTICAL");
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
                    expect(paneLayoutChangedListener.calls[1].args[1]).toEqual("HORIZONTAL");
                });
                runs(function () {
                    expect(paneLayoutChangedListener.callCount).toBe(2);
                });
                _$(MainViewManager).off("paneLayoutChanged", paneLayoutChangedListener);
            });
        });
        describe("Targeted Pane API tests", function () {
            it("should count open views", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getViewCount(MainViewManager.ALL_PANES)).toEqual(2);
                    expect(MainViewManager.getViewCount(MainViewManager.FOCUSED_PANE)).toEqual(1);
                });
            });
            it("should find file in view", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, testPath + "/test.js").paneId).toEqual("second-pane");
                });
            });
            it("should reopen file in view", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getPaneIdForPath(testPath + "/test.js")).toEqual("second-pane");
                });
            });
            it("should close all files in pane", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    MainViewManager.closeAll("second-pane");
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(1);
                });
                runs(function () {
                    MainViewManager.closeAll("first-pane");
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(0);
                });
            });
            it("should allow closed files to reopen in new pane", function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "second-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    MainViewManager.close("second-pane", { fullPath: testPath + "/test.js" });
                    expect(MainViewManager.getAllOpenFiles().length).toEqual(1);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                });
            });
            it("should add to the appropriate pane view list", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addView(MainViewManager.FOCUSED_PANE, getFileObject("test.js"));
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, testPath + "/test.js").paneId).toEqual("first-pane");
                });
            });
            it("should add list to the appropriate pane view list", function () {
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
                    MainViewManager.addViews(MainViewManager.FOCUSED_PANE, [getFileObject("test.js"),
                                                                                         getFileObject("test.css"),
                                                                                         getFileObject("test.html")]);
                    // test.js gets added to the second pane because it was closed in the first-pane when test.css was opened
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, testPath + "/test.js").paneId).toEqual("second-pane");
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, testPath + "/test.css").paneId).toEqual("first-pane");
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, testPath + "/test.html").paneId).toEqual("second-pane");
                });
            });
        });
        describe("paneViewList Management tests", function () {
            beforeEach(function () {
                runs(function () {
                    MainViewManager.setLayoutScheme(1, 2);
                });
            });
            it("should add file to FOCUSED pane", function () {
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.addView(MainViewManager.FOCUSED_PANE, getFileObject("test.js"));
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addView(MainViewManager.FOCUSED_PANE, getFileObject("test.css"));
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.css").fullPath)).toEqual("second-pane");
                });
            });
            it("should add files to FOCUSED pane", function () {
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.addViews(MainViewManager.FOCUSED_PANE, [getFileObject("test.js"),
                                                                                         getFileObject("test.css")]);
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.css").fullPath)).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addViews(MainViewManager.FOCUSED_PANE, [getFileObject("test.txt"),
                                                                                         getFileObject("test.html")]);
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.txt").fullPath)).toEqual("second-pane");
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.html").fullPath)).toEqual("second-pane");
                });
            });
            it("should add file to appropriate pane", function () {
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addView("first-pane", getFileObject("test.js"));
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.addView("second-pane", getFileObject("test.css"));
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.css").fullPath)).toEqual("second-pane");
                });
            });
            it("should add files to appropriate pane", function () {
                runs(function () {
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.css").fullPath)).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.addViews("second-pane", [getFileObject("test.txt"),
                                                                         getFileObject("test.html")]);
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.txt").fullPath)).toEqual("second-pane");
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.html").fullPath)).toEqual("second-pane");
                });
            });
            it("should not add files if they exist in other panes", function () {
                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.addViews("second-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.js").fullPath)).toEqual("first-pane");
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.css").fullPath)).toEqual("first-pane");
                });
                runs(function () {
                    MainViewManager.addViews("second-pane", [getFileObject("test.txt"),
                                                                         getFileObject("test.html")]);
                    MainViewManager.addViews("first-pane", [getFileObject("test.txt"),
                                                                         getFileObject("test.html")]);
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.txt").fullPath)).toEqual("second-pane");
                    expect(MainViewManager.getPaneIdForPath(getFileObject("test.html").fullPath)).toEqual("second-pane");
                });
            });
            it("should not add a files to ALL_PANES ", function () {
                runs(function () {
                    MainViewManager.addViews(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, getFileObject("test.js").fullPath)).toEqual(-1);
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, getFileObject("test.css").fullPath)).toEqual(-1);
                });
            });
            it("should not add a file to ALL_PANES ", function () {
                runs(function () {
                    MainViewManager.addView(MainViewManager.ALL_PANES, getFileObject("test.css"));
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, getFileObject("test.css").fullPath)).toEqual(-1);
                });
            });
            it("should remove all from FOCUSED pane only", function () {
                runs(function () {
                    MainViewManager.addView("first-pane", getFileObject("test.js"));
                    MainViewManager.addView("second-pane", getFileObject("test.css"));
                    MainViewManager.setActivePaneId("second-pane");
                    MainViewManager.removeAllFromPaneViewList(MainViewManager.FOCUSED_PANE);
                    expect(MainViewManager.getViewCount("second-pane")).toEqual(0);
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(1);
                });
            });
            it("should remove all from the appropriate pane only", function () {
                runs(function () {
                    MainViewManager.addView("first-pane", getFileObject("test.js"));
                    MainViewManager.addView("second-pane", getFileObject("test.css"));
                    MainViewManager.removeAllFromPaneViewList("first-pane");
                    expect(MainViewManager.getViewCount("second-pane")).toEqual(1);
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                });
            });
            it("should remove all from ALL_PANES", function () {
                runs(function () {
                    MainViewManager.addView("first-pane", getFileObject("test.js"));
                    MainViewManager.addView("second-pane", getFileObject("test.css"));
                    MainViewManager.removeAllFromPaneViewList(MainViewManager.ALL_PANES);
                    expect(MainViewManager.getViewCount("second-pane")).toEqual(0);
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                });
            });
            it("should remove the view when removing a file from pane view list", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });

                runs(function () {
                    MainViewManager.addView("first-pane", getFileObject("test.js"));
                    MainViewManager.removeAllFromPaneViewList(MainViewManager.ALL_PANES);
                    expect(MainViewManager.getCurrentlyViewedPathForPane("first-pane")).toEqual(null);
                });
            });
            it("should remove the view when removing a file from a pane view list", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });

                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.removeFromPaneViewList(MainViewManager.ALL_PANES, getFileObject("test.css"));
                    expect(MainViewManager.getCurrentlyViewedPathForPane("first-pane")).toEqual(null);
                });
            });
            it("should remove the file when removing from a targeted pane", function () {
                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.removeFromPaneViewList("first-pane", getFileObject("test.css"));
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, getFileObject("test.css").fullPath)).toEqual(-1);
                });
            });
            it("should remove the file when removing from the FOCUSED pane", function () {
                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.removeFromPaneViewList(MainViewManager.FOCUSED_PANE, getFileObject("test.js"));
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, getFileObject("test.js").fullPath)).toEqual(-1);
                });
            });
            it("should remove the file when removing from ALL_PANES", function () {
                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.removeFromPaneViewList(MainViewManager.ALL_PANES, getFileObject("test.js"));
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, getFileObject("test.js").fullPath)).toEqual(-1);
                });
            });
            //
            
            it("should remove the view when removing files from a pane view list", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.js",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });
                runs(function () {
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_AND_OPEN,  { fullPath: testPath + "/test.css",
                                                                                            paneId: "first-pane" });
                    waitsForDone(promise, Commands.CMD_ADD_TO_PANE_AND_OPEN);
                });

                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.removeListFromPaneViewList(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                                            getFileObject("test.css")]);
                    expect(Object.keys(MainViewManager._getPaneFromPaneId("first-pane")._views).length).toEqual(0);
                });
            });
            it("should remove files from the pane view list", function () {
                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.removeListFromPaneViewList(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                                           getFileObject("test.css")]);
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                });
            });
            it("should remove files from the pane view list", function () {
                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.removeListFromPaneViewList(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                                           getFileObject("test.css")]);
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                });
            });
            it("should remove files when removing from a targeted pane", function () {
                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.removeListFromPaneViewList("first-pane", [getFileObject("test.js"),
                                                                              getFileObject("test.css")]);
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                });
            });
            it("should remove the file when removing from the FOCUSED pane", function () {
                runs(function () {
                    MainViewManager.addViews("first-pane", [getFileObject("test.js"),
                                                                         getFileObject("test.css")]);
                    MainViewManager.setActivePaneId("first-pane");
                    MainViewManager.removeListFromPaneViewList(MainViewManager.FOCUSED_PANE, [getFileObject("test.js"),
                                                                                              getFileObject("test.css")]);
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                });
            });
            it("should remove the file when removing from ALL_PANES", function () {
                runs(function () {
                    MainViewManager.addView("first-pane", getFileObject("test.js"));
                    MainViewManager.addView("second-pane", getFileObject("test.css"));
                    MainViewManager.removeListFromPaneViewList(MainViewManager.ALL_PANES, [getFileObject("test.js"),
                                                                                           getFileObject("test.css")]);
                    expect(MainViewManager.getViewCount("first-pane")).toEqual(0);
                    expect(MainViewManager.getViewCount("second-pane")).toEqual(0);
                });
            });
            it("should find file in view", function () {
                runs(function () {
                    MainViewManager.addView("second-pane", getFileObject("test.js"));
                });
                runs(function () {
                    MainViewManager.setActivePaneId("first-pane");
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, getFileObject("test.js").fullPath).paneId).toEqual("second-pane");
                    expect(MainViewManager.findViewOf(MainViewManager.FOCUSED_PANE, getFileObject("test.js").fullPath)).toEqual(-1);
                    expect(MainViewManager.findViewOf("second-pane", getFileObject("test.js").fullPath)).toNotEqual(-1);
                    expect(MainViewManager.findViewOf("first-pane", getFileObject("test.js").fullPath)).toEqual(-1);
                    expect(MainViewManager.findViewOf(MainViewManager.ALL_PANES, getFileObject("test.css").fullPath)).toEqual(-1);
                });
            });
        });
    });
});
