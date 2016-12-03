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

/*global jasmine, describe, beforeFirst, afterLast, beforeEach, afterEach, it, runs, expect, waitsForDone */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var CommandManager,      // loaded from brackets.test
        Commands,            // loaded from brackets.test
        EditorManager,       // loaded from brackets.test
        DocumentModule,      // loaded from brackets.test
        DocumentManager,     // loaded from brackets.test
        MainViewManager,     // loaded from brackets.test
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");


    describe("Document", function () {
        describe("doMultipleEdits", function () {
            // Even though these are Document unit tests, we need to create an editor in order to
            // be able to test actual edit ops.
            var myEditor, myDocument, initialContentLines;

            function makeDummyLines(num) {
                var content = [], i;
                for (i = 0; i < num; i++) {
                    content.push("this is line " + i);
                }
                return content;
            }

            beforeEach(function () {
                // Each line from 0-9 is 14 chars long, each line from 10-19 is 15 chars long
                initialContentLines = makeDummyLines(20);
                var mocks = SpecRunnerUtils.createMockEditor(initialContentLines.join("\n"), "unknown");
                myDocument = mocks.doc;
                myEditor = mocks.editor;
            });

            afterEach(function () {
                if (myEditor) {
                    SpecRunnerUtils.destroyMockEditor(myDocument);
                    myEditor = null;
                    myDocument = null;
                }
            });

            it("should do a single edit, tracking a beforeEdit selection and preserving reversed flag", function () {
                var result = myDocument.doMultipleEdits([{edit: {text: "new content", start: {line: 2, ch: 0}, end: {line: 2, ch: 14}},
                                                        selection: {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, reversed: true, isBeforeEdit: true}}]);
                initialContentLines[2] = "new content";
                expect(myDocument.getText()).toEqual(initialContentLines.join("\n"));
                expect(result.length).toBe(1);
                expect(result[0].start).toEqual({line: 2, ch: 11}); // end of "new content"
                expect(result[0].end).toEqual({line: 2, ch: 11});
                expect(result[0].reversed).toBe(true);
            });

            it("should do a single edit, leaving a non-beforeEdit selection untouched and preserving reversed flag", function () {
                var result = myDocument.doMultipleEdits([{edit: {text: "new content", start: {line: 2, ch: 0}, end: {line: 2, ch: 14}},
                                                        selection: {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, reversed: true}}]);
                initialContentLines[2] = "new content";
                expect(myDocument.getText()).toEqual(initialContentLines.join("\n"));
                expect(result.length).toBe(1);
                expect(result[0].start).toEqual({line: 2, ch: 4});
                expect(result[0].end).toEqual({line: 2, ch: 4});
                expect(result[0].reversed).toBe(true);
            });

            it("should do multiple edits, fixing up isBeforeEdit selections with respect to both edits and preserving other selection attributes", function () {
                var result = myDocument.doMultipleEdits([
                    {edit: {text: "modified line 2\n", start: {line: 2, ch: 0}, end: {line: 2, ch: 14}},
                         selection: {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, isBeforeEdit: true, primary: true}},
                    {edit: {text: "modified line 4\n", start: {line: 4, ch: 0}, end: {line: 4, ch: 14}},
                         selection: {start: {line: 4, ch: 4}, end: {line: 4, ch: 4}, isBeforeEdit: true, reversed: true}}
                ]);
                initialContentLines[2] = "modified line 2";
                initialContentLines[4] = "modified line 4";
                initialContentLines.splice(5, 0, "");
                initialContentLines.splice(3, 0, "");
                expect(myDocument.getText()).toEqual(initialContentLines.join("\n"));
                expect(result.length).toBe(2);
                expect(result[0].start).toEqual({line: 3, ch: 0}); // pushed to end of modified text
                expect(result[0].end).toEqual({line: 3, ch: 0});
                expect(result[0].primary).toBe(true);
                expect(result[1].start).toEqual({line: 6, ch: 0}); // pushed to end of modified text and updated for both edits
                expect(result[1].end).toEqual({line: 6, ch: 0});
                expect(result[1].reversed).toBe(true);
            });

            it("should do multiple edits, fixing up non-isBeforeEdit selections only with respect to other edits", function () {
                var result = myDocument.doMultipleEdits([
                    {edit: {text: "modified line 2\n", start: {line: 2, ch: 0}, end: {line: 2, ch: 14}},
                         selection: {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, primary: true}},
                    {edit: {text: "modified line 4\n", start: {line: 4, ch: 0}, end: {line: 4, ch: 14}},
                         selection: {start: {line: 4, ch: 4}, end: {line: 4, ch: 4}, reversed: true}}
                ]);
                initialContentLines[2] = "modified line 2";
                initialContentLines[4] = "modified line 4";
                initialContentLines.splice(5, 0, "");
                initialContentLines.splice(3, 0, "");
                expect(myDocument.getText()).toEqual(initialContentLines.join("\n"));
                expect(result.length).toBe(2);
                expect(result[0].start).toEqual({line: 2, ch: 4}); // not modified since it's above the other edit
                expect(result[0].end).toEqual({line: 2, ch: 4});
                expect(result[0].primary).toBe(true);
                expect(result[1].start).toEqual({line: 5, ch: 4}); // not pushed to end of modified text, but updated for previous edit
                expect(result[1].end).toEqual({line: 5, ch: 4});
                expect(result[1].reversed).toBe(true);
            });

            it("should perform multiple changes/track multiple selections within a single edit, selections specified as isBeforeEdit", function () {
                var result = myDocument.doMultipleEdits([
                    {edit: [{text: "modified line 1", start: {line: 1, ch: 0}, end: {line: 1, ch: 14}},
                            {text: "modified line 2\n", start: {line: 2, ch: 0}, end: {line: 2, ch: 14}}],
                         selection: [{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, isBeforeEdit: true},
                                     {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, isBeforeEdit: true, primary: true}]},
                    {edit: {text: "modified line 4\n", start: {line: 4, ch: 0}, end: {line: 4, ch: 14}},
                         selection: {start: {line: 4, ch: 4}, end: {line: 4, ch: 4}, isBeforeEdit: true, reversed: true}}
                ]);
                initialContentLines[1] = "modified line 1"; // no extra newline inserted here
                initialContentLines[2] = "modified line 2";
                initialContentLines[4] = "modified line 4";
                initialContentLines.splice(5, 0, "");
                initialContentLines.splice(3, 0, "");
                expect(myDocument.getText()).toEqual(initialContentLines.join("\n"));
                expect(result.length).toBe(3);
                expect(result[0].start).toEqual({line: 1, ch: 15}); // pushed to end of first modified text
                expect(result[0].end).toEqual({line: 1, ch: 15});
                expect(result[0].primary).toBeFalsy();
                expect(result[1].start).toEqual({line: 3, ch: 0}); // pushed to end of second modified text
                expect(result[1].end).toEqual({line: 3, ch: 0});
                expect(result[1].primary).toBe(true);
                expect(result[2].start).toEqual({line: 6, ch: 0}); // pushed to end of third modified text and updated for both edits
                expect(result[2].end).toEqual({line: 6, ch: 0});
                expect(result[2].reversed).toBe(true);
            });

            it("should perform multiple changes/track multiple selections within a single edit, selections not specified as isBeforeEdit", function () {
                var result = myDocument.doMultipleEdits([
                    {edit: [{text: "modified line 1", start: {line: 1, ch: 0}, end: {line: 1, ch: 14}},
                            {text: "modified line 2\n", start: {line: 2, ch: 0}, end: {line: 2, ch: 14}}],
                         selection: [{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                     {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, primary: true}]},
                    {edit: {text: "modified line 4\n", start: {line: 4, ch: 0}, end: {line: 4, ch: 14}},
                         selection: {start: {line: 4, ch: 4}, end: {line: 4, ch: 4}, reversed: true}}
                ]);
                initialContentLines[1] = "modified line 1"; // no extra newline inserted here
                initialContentLines[2] = "modified line 2";
                initialContentLines[4] = "modified line 4";
                initialContentLines.splice(5, 0, "");
                initialContentLines.splice(3, 0, "");
                expect(myDocument.getText()).toEqual(initialContentLines.join("\n"));
                expect(result.length).toBe(3);
                expect(result[0].start).toEqual({line: 1, ch: 4}); // not fixed up
                expect(result[0].end).toEqual({line: 1, ch: 4});
                expect(result[0].primary).toBeFalsy();
                expect(result[1].start).toEqual({line: 2, ch: 4}); // not fixed up, no need to adjust for first edit
                expect(result[1].end).toEqual({line: 2, ch: 4});
                expect(result[1].primary).toBe(true);
                expect(result[2].start).toEqual({line: 5, ch: 4}); // not pushed to end of modified text, but updated for previous edit
                expect(result[2].end).toEqual({line: 5, ch: 4});
                expect(result[2].reversed).toBe(true);
            });

            it("should throw an error if edits overlap", function () {
                function shouldDie() {
                    myDocument.doMultipleEdits([
                        {edit: {text: "modified line 3", start: {line: 3, ch: 0}, end: {line: 3, ch: 5}}},
                        {edit: {text: "modified line 3 again", start: {line: 3, ch: 3}, end: {line: 3, ch: 8}}}
                    ]);
                }

                expect(shouldDie).toThrow();
            });

            it("should throw an error if multiple edits in one group surround an edit in another group, even if they don't directly overlap", function () {
                function shouldDie() {
                    myDocument.doMultipleEdits([
                        {edit: [{text: "modified line 2", start: {line: 2, ch: 0}, end: {line: 2, ch: 0}},
                                {text: "modified line 4", start: {line: 4, ch: 0}, end: {line: 4, ch: 0}}]},
                        {edit: {text: "modified line 3", start: {line: 3, ch: 0}, end: {line: 3, ch: 0}}}
                    ]);
                }

                expect(shouldDie).toThrow();
            });

        });
    });

    describe("Document Integration", function () {
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
                DocumentModule      = testWindow.brackets.test.DocumentModule;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
                MainViewManager     = testWindow.brackets.test.MainViewManager;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterLast(function () {
            testWindow      = null;
            CommandManager  = null;
            Commands        = null;
            EditorManager   = null;
            DocumentModule  = null;
            DocumentManager = null;
            MainViewManager = null;
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
        });

        afterEach(function () {
            testWindow.closeAllFiles();

            runs(function () {
                expect(DocumentManager.getAllOpenDocuments().length).toBe(0);
                DocumentModule.off(".docTest");
            });
        });

        var JS_FILE   = testPath + "/test.js",
            CSS_FILE  = testPath + "/test.css",
            HTML_FILE = testPath + "/test.html";


        describe("Dirty flag and undo", function () {
            var promise;

            it("should not fire dirtyFlagChange when created", function () {
                var dirtyFlagListener = jasmine.createSpy();

                runs(function () {
                    DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

                    promise = DocumentManager.getDocumentForPath(JS_FILE);
                    waitsForDone(promise, "Create Document");
                });
                runs(function () {
                    expect(dirtyFlagListener.callCount).toBe(0);
                    DocumentManager.off("dirtyFlagChange", dirtyFlagListener);
                });
            });

            it("should clear dirty flag, preserve undo when marked saved", function () {
                var dirtyFlagListener = jasmine.createSpy();

                runs(function () {
                    DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

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

                    DocumentManager.off("dirtyFlagChange", dirtyFlagListener);
                });
            });

            it("should clear dirty flag AND undo when text reset", function () {
                var dirtyFlagListener = jasmine.createSpy(),
                    changeListener    = jasmine.createSpy();

                runs(function () {
                    DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                    waitsForDone(promise, "Open file");
                });
                runs(function () {
                    var doc = DocumentManager.getOpenDocumentForPath(JS_FILE);
                    doc.on("change", changeListener);

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

                    doc.off("change", changeListener);
                    DocumentManager.off("dirtyFlagChange", dirtyFlagListener);
                });
            });

            it("should fire change but not dirtyFlagChange when clean text reset, with editor", function () {  // bug #502
                var dirtyFlagListener = jasmine.createSpy(),
                    changeListener    = jasmine.createSpy();

                runs(function () {
                    DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                    waitsForDone(promise, "Open file");
                });
                runs(function () {
                    var doc = DocumentManager.getOpenDocumentForPath(JS_FILE);
                    doc.on("change", changeListener);

                    expect(doc.isDirty).toBe(false);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0);

                    doc.refreshText("New content", Date.now());  // e.g. syncing external changes
                    expect(doc.isDirty).toBe(false);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0); // still no undo history
                    expect(dirtyFlagListener.callCount).toBe(0);  // isDirty hasn't changed
                    expect(changeListener.callCount).toBe(1);     // but still counts as a content change

                    doc.off("change", changeListener);
                    DocumentManager.off("dirtyFlagChange", dirtyFlagListener);
                });
            });

            it("should fire change but not dirtyFlagChange when clean text reset, without editor", function () {
                var dirtyFlagListener = jasmine.createSpy(),
                    changeListener    = jasmine.createSpy(),
                    doc;

                runs(function () {
                    DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

                    promise = DocumentManager.getDocumentForPath(JS_FILE)
                        .done(function (result) { doc = result; });
                    waitsForDone(promise, "Create Document");
                });
                runs(function () {
                    doc.on("change", changeListener);

                    expect(doc._masterEditor).toBeFalsy();
                    expect(doc.isDirty).toBe(false);

                    doc.refreshText("New content", Date.now());  // e.g. syncing external changes
                    expect(doc.isDirty).toBe(false);
                    expect(dirtyFlagListener.callCount).toBe(0);
                    expect(changeListener.callCount).toBe(1);   // resetting text is still a content change

                    doc.off("change", changeListener);
                    DocumentManager.off("dirtyFlagChange", dirtyFlagListener);
                    doc = null;
                });
            });

            it("should not clean history when reset is called with the same text as in the editor", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                    waitsForDone(promise, "Open file");
                });
                runs(function () {
                    var doc = DocumentManager.getOpenDocumentForPath(JS_FILE);

                    // Put some text into editor
                    doc.setText("Foo");
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1);

                    // Reset text with the same value, expect history not to change
                    doc.refreshText("Foo", Date.now());
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1);
                });
            });

            it("should not clean history when reset is called with the same text with different line-endings", function () {
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                    waitsForDone(promise, "Open file");
                });
                runs(function () {
                    var doc = DocumentManager.getOpenDocumentForPath(JS_FILE);
                    var crlf = "a\r\nb\r\nc";
                    var lf = "a\nb\nc";

                    // Put some text into editor
                    doc.setText(crlf);
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1);

                    // Reset text with the same value, expect history not to change
                    doc.refreshText(lf, Date.now());
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1);

                    // Reset text with the same value, expect history not to change
                    doc.refreshText(crlf, Date.now());
                    expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1);
                });
            });
        });

        describe("Refresh and change events", function () {
            var promise, changeListener, docChangeListener, doc;

            beforeEach(function () {
                changeListener = jasmine.createSpy();
                docChangeListener = jasmine.createSpy();
            });

            afterEach(function () {
                promise = null;
                changeListener = null;
                docChangeListener = null;
                doc = null;
            });

            it("should fire both change and documentChange when text is refreshed if doc does not have masterEditor", function () {
                runs(function () {
                    promise = DocumentManager.getDocumentForPath(JS_FILE)
                        .done(function (result) { doc = result; });
                    waitsForDone(promise, "Create Document");
                });

                runs(function () {
                    DocumentModule.on("documentChange.docTest", docChangeListener);
                    doc.on("change", changeListener);

                    expect(doc._masterEditor).toBeFalsy();

                    doc.refreshText("New content", Date.now());

                    expect(doc._masterEditor).toBeFalsy();
                    expect(docChangeListener.callCount).toBe(1);
                    expect(changeListener.callCount).toBe(1);
                });
            });

            it("should fire both change and documentChange when text is refreshed if doc has masterEditor", function () {
                runs(function () {
                    promise = DocumentManager.getDocumentForPath(JS_FILE)
                        .done(function (result) { doc = result; });
                    waitsForDone(promise, "Create Document");
                });

                runs(function () {
                    expect(doc._masterEditor).toBeFalsy();
                    doc.setText("first edit");
                    expect(doc._masterEditor).toBeTruthy();

                    DocumentModule.on("documentChange.docTest", docChangeListener);
                    doc.on("change", changeListener);

                    doc.refreshText("New content", Date.now());

                    expect(docChangeListener.callCount).toBe(1);
                    expect(changeListener.callCount).toBe(1);
                });
            });

            it("should *not* fire documentChange when a document is first created", function () {
                runs(function () {
                    DocumentModule.on("documentChange.docTest", docChangeListener);
                    waitsForDone(DocumentManager.getDocumentForPath(JS_FILE));
                });

                runs(function () {
                    expect(docChangeListener.callCount).toBe(0);
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
                    promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: HTML_FILE});
                    waitsForDone(promise, "Open into working set");
                });
                runs(function () {
                    // Open inline editor onto test.css's ".testClass" rule
                    promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 8, ch: 4});
                    waitsForDone(promise, "Open inline editor");
                });
                runs(function () {
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ACTIVE_PANE, CSS_FILE)).toBe(-1);
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
