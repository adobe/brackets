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
/*global define, $, jasmine, describe, beforeFirst, afterLast, afterEach, it, runs, waitsFor, expect, waitsForDone */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CommandManager,      // loaded from brackets.test
        Commands,            // loaded from brackets.test
        EditorManager,       // loaded from brackets.test
        DocumentManager,     // loaded from brackets.test
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");
    
    
    describe("Document", function () {
        this.category = "integration";
        
        var testPath = SpecRunnerUtils.getTestPath("/spec/Document-test-files"),
            testWindow,
            $;

        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                $ = testWindow.$;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                EditorManager       = testWindow.brackets.test.EditorManager;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
                
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterLast(function () {
            testWindow      = null;
            CommandManager  = null;
            Commands        = null;
            EditorManager   = null;
            DocumentManager = null;
            SpecRunnerUtils.closeTestWindow();
        });

        afterEach(function () {
            testWindow.closeAllFiles();

            runs(function () {
                expect(DocumentManager.getAllOpenDocuments().length).toBe(0);
            });
        });
        
        var JS_FILE   = testPath + "/test.js",
            CSS_FILE  = testPath + "/test.css",
            HTML_FILE = testPath + "/test.html";


        describe("Dirty flag and undo", function () {
            var promise, doc;
            
            it("should not fire dirtyFlagChange when created", function () {
                var dirtyFlagListener = jasmine.createSpy();
                
                runs(function () {
                    $(DocumentManager).on("dirtyFlagChange", dirtyFlagListener);
                    
                    promise = DocumentManager.getDocumentForPath(JS_FILE);
                    waitsForDone(promise, "Create Document");
                });
                runs(function () {
                    expect(dirtyFlagListener.callCount).toBe(0);
                    $(DocumentManager).off("dirtyFlagChange", dirtyFlagListener);
                });
            });
            
            it("should clear dirty flag, preserve undo when marked saved", function () {
                var dirtyFlagListener = jasmine.createSpy();
                
                runs(function () {
                    $(DocumentManager).on("dirtyFlagChange", dirtyFlagListener);
                    
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                    waitsForDone(promise, "Open file");
                });
                runs(function () {
                    var doc = DocumentManager.getOpenDocumentForPath(JS_FILE);
                    expect(doc.isDirty).toBe(false);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0);
                    
                    // Make an edit (make dirty)
                    doc.replaceRange("Foo", {line: 0, ch: 0});
                    expect(doc.isDirty).toBe(true);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1);
                    expect(dirtyFlagListener.callCount).toBe(1);
                    
                    // Mark saved (e.g. called by Save command)
                    doc.notifySaved();
                    expect(doc.isDirty).toBe(false);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1); // still has undo history
                    expect(dirtyFlagListener.callCount).toBe(2);
                    
                    $(DocumentManager).off("dirtyFlagChange", dirtyFlagListener);
                });
            });
            
            it("should clear dirty flag AND undo when text reset", function () {
                var dirtyFlagListener = jasmine.createSpy(),
                    changeListener    = jasmine.createSpy();
                
                runs(function () {
                    $(DocumentManager).on("dirtyFlagChange", dirtyFlagListener);
                    
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                    waitsForDone(promise, "Open file");
                });
                runs(function () {
                    var doc = DocumentManager.getOpenDocumentForPath(JS_FILE);
                    $(doc).on("change", changeListener);
                    
                    expect(doc.isDirty).toBe(false);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0);
                    
                    // Make an edit (make dirty)
                    doc.replaceRange("Foo", {line: 0, ch: 0});
                    expect(doc.isDirty).toBe(true);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1);
                    expect(dirtyFlagListener.callCount).toBe(1);
                    expect(changeListener.callCount).toBe(1);
                    
                    // Reset text (e.g. called by Revert command, or syncing external changes)
                    doc.refreshText("New content", Date.now());
                    expect(doc.isDirty).toBe(false);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0); // undo history GONE
                    expect(dirtyFlagListener.callCount).toBe(2);
                    expect(changeListener.callCount).toBe(2);
                    
                    $(doc).off("change", changeListener);
                    $(DocumentManager).off("dirtyFlagChange", dirtyFlagListener);
                });
            });
            
            it("should fire change but not dirtyFlagChange when clean text reset, with editor", function () {  // bug #502
                var dirtyFlagListener = jasmine.createSpy(),
                    changeListener    = jasmine.createSpy();
                
                runs(function () {
                    $(DocumentManager).on("dirtyFlagChange", dirtyFlagListener);
                    
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                    waitsForDone(promise, "Open file");
                });
                runs(function () {
                    var doc = DocumentManager.getOpenDocumentForPath(JS_FILE);
                    $(doc).on("change", changeListener);
                    
                    expect(doc.isDirty).toBe(false);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0);
                    
                    doc.refreshText("New content", Date.now());  // e.g. syncing external changes
                    expect(doc.isDirty).toBe(false);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0); // still no undo history
                    expect(dirtyFlagListener.callCount).toBe(0);  // isDirty hasn't changed
                    expect(changeListener.callCount).toBe(1);     // but still counts as a content change
                    
                    $(doc).off("change", changeListener);
                    $(DocumentManager).off("dirtyFlagChange", dirtyFlagListener);
                });
            });
            
            it("should fire change but not dirtyFlagChange when clean text reset, without editor", function () {
                var dirtyFlagListener = jasmine.createSpy(),
                    changeListener    = jasmine.createSpy(),
                    doc;
                
                runs(function () {
                    $(DocumentManager).on("dirtyFlagChange", dirtyFlagListener);
                    
                    promise = DocumentManager.getDocumentForPath(JS_FILE)
                        .done(function (result) { doc = result; });
                    waitsForDone(promise, "Create Document");
                });
                runs(function () {
                    $(doc).on("change", changeListener);
                    
                    expect(doc._masterEditor).toBeFalsy();
                    expect(doc.isDirty).toBe(false);
                    
                    doc.refreshText("New content", Date.now());  // e.g. syncing external changes
                    expect(doc.isDirty).toBe(false);
                    expect(dirtyFlagListener.callCount).toBe(0);
                    expect(changeListener.callCount).toBe(1);   // resetting text is still a content change
                    
                    $(doc).off("change", changeListener);
                    $(DocumentManager).off("dirtyFlagChange", dirtyFlagListener);
                });
            });
        });
        
        
        describe("Ref counting", function () {
            
            // TODO: additional, simpler ref counting test cases such as Live Development, open/close inline editor (refs from
            //  both editor & rule list TextRanges), navigate files w/o adding to working set, etc.
            
            it("should clean up (later) a master Editor auto-created by calling read-only Document API, if Editor not used by UI", function () {
                var promise,
                    cssDoc,
                    cssMasterEditor;
                
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: HTML_FILE});
                    waitsForDone(promise, "Open into working set");
                });
                runs(function () {
                    // Open inline editor onto test.css's ".testClass" rule
                    promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 8, ch: 4});
                    waitsForDone(promise, "Open inline editor");
                });
                runs(function () {
                    expect(DocumentManager.findInWorkingSet(CSS_FILE)).toBe(-1);
                    expect(DocumentManager.getOpenDocumentForPath(CSS_FILE)).toBeTruthy();
                    
                    // Force creation of master editor for CSS file
                    cssDoc = DocumentManager.getOpenDocumentForPath(CSS_FILE);
                    expect(cssDoc._masterEditor).toBeFalsy();
                    DocumentManager.getOpenDocumentForPath(CSS_FILE).getLine(0);
                    expect(cssDoc._masterEditor).toBeTruthy();
                    
                    // Close inline editor
                    var hostEditor = EditorManager.getCurrentFullEditor();
                    var inlineWidget = hostEditor.getInlineWidgets()[0];
                    waitsForDone(EditorManager.closeInlineWidget(hostEditor, inlineWidget), "close inline editor");
                });
                runs(function () {
                    // Now there are no parts of Brackets that need to keep the CSS Document alive (its only ref is its own master
                    // Editor and that Editor isn't accessible in the UI anywhere). It's ready to get "GCed" by DocumentManager as
                    // soon as it hits a trigger point for doing so.
                    expect(DocumentManager.getOpenDocumentForPath(CSS_FILE)).toBeTruthy();
                    expect(cssDoc._refCount).toBe(1);
                    expect(cssDoc._masterEditor).toBeTruthy();
                    expect(testWindow.$(".CodeMirror").length).toBe(2);   // HTML editor (current) & CSS editor (dangling)
                    
                    // Switch to a third file - trigger point for cleanup
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                    waitsForDone(promise, "Switch to other file");
                });
                runs(function () {
                    // Creation of that third file's Document should have triggered cleanup of CSS Document and its master Editor
                    expect(DocumentManager.getOpenDocumentForPath(CSS_FILE)).toBeFalsy();
                    expect(cssDoc._refCount).toBe(0);
                    expect(cssDoc._masterEditor).toBeFalsy();
                    expect(testWindow.$(".CodeMirror").length).toBe(2);   // HTML editor (working set) & JS editor (current)
                });

                cssDoc = cssMasterEditor = null;
            });
        });
    });
});
