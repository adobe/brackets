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

/*global describe, it, expect, beforeEach, afterEach, beforeFirst, afterLast, waitsFor, runs, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var MasterDocumentManager     = brackets.getModule("document/DocumentManager"),
        MasterMainViewManager     = brackets.getModule("view/MainViewManager"),
        FileUtils                 = brackets.getModule("file/FileUtils"),
        SpecRunnerUtils           = brackets.getModule("spec/SpecRunnerUtils"),
        UrlCodeHints              = require("main");


    describe("Url Code Hinting", function () {

        var extensionPath   = FileUtils.getNativeModuleDirectoryPath(module),
            testHtmlPath    = extensionPath + "/testfiles/test.html",
            testCssPath     = extensionPath + "/testfiles/subfolder/test.css",
            testScssPath    = extensionPath + "/testfiles/subfolder/test.scss",
            testDocument,
            testEditor,
            hintsObj;

        // IMPORTANT: By default, Mac sorts folder contents differently from other OS's,
        // so the files and folders in the "testfiles" and "subfolder" folder are named
        // strategically so that they sort the same on all OS's (i.e. folders are listed
        // first, and then files), but this is not true for UrlCodeHints folder.
        var testfilesDirHints       = [ "subfolder/", "test.html"],
            subfolderDirHints       = [ "chevron.png", "test.css", "test.js", "test.scss"],
            UrlCodeHintsDirHintsMac = [ "../data.json", "../main.js", "../testfiles/", "../unittests.js"],
            UrlCodeHintsDirHints    = [ "../testfiles/", "../data.json", "../main.js", "../unittests.js"];

        /**
         * Returns an Editor suitable for use in isolation, given a Document.
         *
         * @param {Document} doc - the document to be contained by the new Editor
         * @return {Editor} - the mock editor object
         */
        function createMockEditor(doc) {
            return SpecRunnerUtils.createMockEditorForDocument(doc);
        }

        function setupTests(testFilePath) {
            runs(function () {
                MasterDocumentManager.getDocumentForPath(testFilePath).done(function (doc) {
                    testDocument = doc;
                });
            });

            waitsFor(function () {
                return (testDocument);
            }, "Unable to open test document", 2000);

            // create Editor instance (containing a CodeMirror instance)
            runs(function () {
                testEditor = createMockEditor(testDocument);
                MasterMainViewManager._edit(MasterMainViewManager.ACTIVE_PANE, testDocument);
            });
        }

        function tearDownTests() {
            runs(function () {
                // The following call ensures that the document is reloaded
                // from disk before each test
                MasterMainViewManager._closeAll(MasterMainViewManager.ALL_PANES);
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
                hintsObj = null;
            });
        }

        // Helper method to ask provider for hints at current cursor position.
        // Provider returns either an array of hints, or a deferred promise.
        // If a promise is returned, wait for it to resolve.
        //
        // Since this may be async, it cannot return the hints list, so it depends
        // on the hintsObj variable (with module scope) to exist.
        function expectAsyncHints(provider) {
            runs(function () {
                expect(provider.hasHints(testEditor, null)).toBe(true);
                hintsObj = provider.getHints();
                expect(hintsObj).toBeTruthy();
            });

            runs(function () {
                if (hintsObj instanceof Object && hintsObj.hasOwnProperty("done")) {
                    hintsObj.done(function (resolvedHintsObj) {
                        hintsObj = resolvedHintsObj;
                    });
                }
            });

            waitsFor(function () {
                return (!hintsObj || hintsObj.hints);
            }, "Unable to resolve hints", 2000);
        }

        // Ask provider for hints at current cursor position; expect it NOT to return any
        function expectNoHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBeFalsy();
        }

        // Expect hintList to contain folder and file names.
        function verifyUrlHints(hintList, expectedHints) {
            expect(hintList).toEqual(expectedHints);
        }

        describe("HTML Url Code Hints", function () {

            beforeFirst(function () {
                setupTests(testHtmlPath);
            });

            afterLast(function () {
                tearDownTests();
            });

            it("should hint for href attribute", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 14, ch: 12 });

                    // Must reset hintsObj before every call to expectAsyncHints()
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    verifyUrlHints(hintsObj.hints, testfilesDirHints);
                });
            });

            it("should hint for src attribute", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 15, ch: 13 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    verifyUrlHints(hintsObj.hints, testfilesDirHints);
                });
            });

            it("should hint for poster attribute", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 24, ch: 17 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    verifyUrlHints(hintsObj.hints, testfilesDirHints);
                });
            });

            it("should not hint for type attribute", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 15, ch: 21 });
                    expectNoHints(UrlCodeHints.hintProvider);
                });
            });

            it("should not hint in query part of url", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 20, ch: 31 });
                    expectNoHints(UrlCodeHints.hintProvider);
                });
            });

            it("should hint up 1 folder for '../'", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 21, ch: 14 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    var expectedHints = (brackets.platform !== "win") ? UrlCodeHintsDirHintsMac : UrlCodeHintsDirHints;
                    verifyUrlHints(hintsObj.hints, expectedHints);
                });
            });
        });

        describe("CSS Url Code Hints", function () {

            beforeFirst(function () {
                setupTests(testHtmlPath);
            });

            afterLast(function () {
                tearDownTests();
            });

            it("should hint for @import url()", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 4, ch: 12 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    verifyUrlHints(hintsObj.hints, testfilesDirHints);
                });
            });

            it("should hint for background-image: url()", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 6, ch: 24 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    verifyUrlHints(hintsObj.hints, testfilesDirHints);
                });
            });

            it("should hint for border-image: url('')", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 7, ch: 21 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    verifyUrlHints(hintsObj.hints, testfilesDirHints);
                });
            });

            it("should hint for list-style-image: url(\"\")", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 8, ch: 25 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    verifyUrlHints(hintsObj.hints, testfilesDirHints);
                });
            });

            it("should not hint for @import outside of url()", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 4, ch: 15 });
                    expectNoHints(UrlCodeHints.hintProvider);
                });
            });

            it("should not hint for background-image outside of url()", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 11, ch: 20 });
                    expectNoHints(UrlCodeHints.hintProvider);
                });
            });
        });

        describe("Url Code Hints in a subfolder", function () {

            afterEach(function () {
                tearDownTests();
            });

            it("should hint for background-image: url() in CSS", function () {
                runs(function () {
                    setupTests(testCssPath);
                });

                runs(function () {
                    testEditor.setCursorPos({ line: 3, ch: 26 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    verifyUrlHints(hintsObj.hints, subfolderDirHints);
                });
            });

            it("should hint for background-image: url() in SCSS", function () {
                runs(function () {
                    setupTests(testScssPath);
                });

                runs(function () {
                    testEditor.setCursorPos({ line: 4, ch: 34 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    verifyUrlHints(hintsObj.hints, subfolderDirHints);
                });
            });
        });

        describe("Project root relative Url Code Hints", function () {

            var testWindow,
                brackets,
                workingSet = [],
                CodeHintManager,
                CommandManager,
                Commands,
                DocumentManager,
                MainViewManager,
                EditorManager;

            it("should hint site root '/'", function () {
                runs(function () {
                    SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                        testWindow      = w;
                        brackets        = testWindow.brackets;
                        CodeHintManager = brackets.test.CodeHintManager;
                        CommandManager  = brackets.test.CommandManager;
                        Commands        = brackets.test.Commands;
                        DocumentManager = brackets.test.DocumentManager;
                        EditorManager   = brackets.test.EditorManager;
                        MainViewManager = brackets.test.MainViewManager;
                    });
                });

                runs(function () {
                    SpecRunnerUtils.loadProjectInTestWindow(extensionPath);
                });

                runs(function () {
                    workingSet.push(testHtmlPath);
                    waitsForDone(SpecRunnerUtils.openProjectFiles(workingSet), "openProjectFiles");
                });

                runs(function () {
                    DocumentManager.getDocumentForPath(testHtmlPath).done(function (doc) {
                        testDocument = doc;
                    });
                });

                waitsFor(function () {
                    return (testDocument);
                }, "Unable to open test document", 2000);

                runs(function () {
                    MainViewManager._edit(MainViewManager.ACTIVE_PANE, testDocument);
                    testEditor = EditorManager.getCurrentFullEditor();
                    testEditor.setCursorPos({ line: 22, ch: 12 });
                    CommandManager.execute(Commands.SHOW_CODE_HINTS);
                });

                runs(function () {
                    var hintList = CodeHintManager._getCodeHintList();
                    expect(hintList).toBeTruthy();
                    expect(hintList.hints).toBeTruthy();
                    expect(hintList.hints).toContain("/testfiles/");
                });

                // cleanup
                runs(function () {
                    testEditor       = null;
                    testDocument     = null;
                    testWindow       = null;
                    brackets         = null;
                    CodeHintManager  = null;
                    CommandManager   = null;
                    Commands         = null;
                    DocumentManager  = null;
                    EditorManager    = null;
                    MainViewManager  = null;
                    SpecRunnerUtils.closeTestWindow();
                });
            });
        });

        describe("Url Insertion", function () {

            // These tests edit doc, so we need to setup/tear-down for each test
            beforeEach(function () {
                setupTests(testHtmlPath);
            });

            afterEach(function () {
                tearDownTests();
            });

            it("should handle unclosed url(", function () {
                var pos1    = { line: 11, ch: 20 },
                    pos2    = { line: 11, ch: 24 },
                    pos3    = { line: 11, ch: 34 };

                runs(function () {
                    testEditor.setCursorPos(pos1);
                    testDocument.replaceRange("url(", pos1, pos1);
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(2);
                    expect(hintsObj.hints[1]).toBe("test.html");
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[1])).toBe(false);

                    // hint was added with closing paren
                    expect(testDocument.getRange(pos1, pos3)).toEqual("url(test.html)");

                    // Cursor was moved past closing paren
                    expect(testEditor.getCursorPos()).toEqual(pos3);
                });
            });

            it("should handle unclosed url( with unclosed single-quote", function () {
                var pos1    = { line: 11, ch: 20 },
                    pos2    = { line: 11, ch: 25 },
                    pos3    = { line: 11, ch: 36 };

                runs(function () {
                    testEditor.setCursorPos(pos1);
                    testDocument.replaceRange("url('", pos1, pos1);
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(2);
                    expect(hintsObj.hints[1]).toBe("test.html");

                    // False indicates hints were closed after insertion
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[1])).toBe(false);

                    // Hint was added with closing single-quote and closing paren
                    expect(testDocument.getRange(pos1, pos3)).toEqual("url('test.html')");

                    // Cursor was moved past closing single-quote and closing paren
                    expect(testEditor.getCursorPos()).toEqual(pos3);
                });
            });

            it("should keep hints open after inserting folder in HTML", function () {
                var pos1    = { line: 18, ch: 12 },
                    pos2    = { line: 18, ch: 22 },
                    pos3    = { line: 18, ch: 33 },
                    pos4    = { line: 18, ch: 34 };

                runs(function () {
                    testEditor.setCursorPos(pos1);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(2);
                    expect(hintsObj.hints[0]).toBe("subfolder/");

                    // True indicates hints were remain open after insertion of folder
                    // (i.e. showing contents of inserted folder)
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(true);

                    // Hint was added with closing double-quote and closing paren
                    expect(testDocument.getRange(pos1, pos2)).toEqual("subfolder/");

                    // Cursor remains inside quote
                    expect(testEditor.getCursorPos()).toEqual(pos2);

                    // Get hints of inserted folder
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(subfolderDirHints.length);

                    // Complete path is displayed
                    expect(hintsObj.hints[0]).toBe("subfolder/chevron.png");

                    // False indicates hints were closed after insertion
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(false);

                    // Hint was added
                    expect(testDocument.getRange(pos1, pos3)).toEqual("subfolder/chevron.png");

                    // Cursor was moved past closing double-quote and closing paren
                    expect(testEditor.getCursorPos()).toEqual(pos4);
                });
            });

            it("should keep hints open after inserting folder in CSS", function () {
                var pos1    = { line: 11, ch: 20 },
                    pos2    = { line: 11, ch: 25 },
                    pos3    = { line: 11, ch: 35 },
                    pos4    = { line: 11, ch: 37 },
                    pos5    = { line: 11, ch: 48 };

                runs(function () {
                    testEditor.setCursorPos(pos1);
                    testDocument.replaceRange('url("', pos1, pos1);
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(2);
                    expect(hintsObj.hints[0]).toBe("subfolder/");

                    // True indicates hints were remain open after insertion of folder
                    // (i.e. showing contents of inserted folder)
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(true);

                    // Hint was added with closing double-quote and closing paren
                    expect(testDocument.getRange(pos1, pos4)).toEqual('url("subfolder/")');

                    // Cursor remains inside double-quote and closing paren
                    expect(testEditor.getCursorPos()).toEqual(pos3);

                    // Get hints of inserted folder
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(subfolderDirHints.length);

                    // Complete path is displayed
                    expect(hintsObj.hints[0]).toBe("subfolder/chevron.png");

                    // False indicates hints were closed after insertion
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(false);

                    // Hint was added
                    expect(testDocument.getRange(pos1, pos5)).toEqual('url("subfolder/chevron.png")');

                    // Cursor was moved past closing double-quote and closing paren
                    expect(testEditor.getCursorPos()).toEqual(pos5);
                });
            });

            it("should insert folder and replace file in HTML", function () {
                var pos1    = { line: 23, ch: 11 },
                    pos2    = { line: 23, ch: 21 },
                    pos3    = { line: 23, ch: 31 },
                    pos4    = { line: 23, ch: 32 };

                runs(function () {
                    testEditor.setCursorPos(pos1);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(2);
                    expect(hintsObj.hints[0]).toBe("subfolder/");

                    // True indicates hints were remain open after insertion of folder
                    // (i.e. showing contents of inserted folder)
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(true);

                    // Folder was inserted (i.e. filename was not removed)
                    expect(testDocument.getRange(pos1, pos3)).toEqual("subfolder/test2.html");

                    // Cursor is at end of inserted folder
                    expect(testEditor.getCursorPos()).toEqual(pos2);

                    // Get hints of inserted folder
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(subfolderDirHints.length);

                    // Complete path is displayed
                    expect(hintsObj.hints[0]).toBe("subfolder/chevron.png");

                    // False indicates hints were closed after insertion
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(false);

                    // Filename was replaced
                    expect(testDocument.getRange(pos1, pos4)).toEqual("subfolder/chevron.png");
                });
            });

            it("should completely replace file in HTML", function () {
                var pos1    = { line: 25, ch: 11 },
                    pos2    = { line: 25, ch: 27 },
                    pos3    = { line: 25, ch: 34 };

                runs(function () {
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(1);
                    expect(hintsObj.hints[0]).toBe("subfolder/chevron.png");

                    // False indicates hints were closed after insertion
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(false);

                    // File name was completely replaced, not just appended to
                    expect(testDocument.getRange(pos1, pos3)).toEqual("'subfolder/chevron.png'");

                    // Cursor was moved past closing single-quote
                    expect(testEditor.getCursorPos()).toEqual(pos3);
                });
            });

            it("should insert filtered folder in HTML", function () {
                var pos1    = { line: 23, ch: 11 },
                    pos2    = { line: 23, ch: 14 },
                    pos3    = { line: 23, ch: 31 };

                runs(function () {
                    testDocument.replaceRange("sub", pos1, pos1);
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(1);
                    expect(hintsObj.hints[0]).toBe("subfolder/");

                    // Partially existing folder was inserted correctly
                    UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0]);
                    expect(testDocument.getRange(pos1, pos3)).toEqual("subfolder/test2.html");
                });
            });

            it("should replace filtered file in HTML", function () {
                var pos1    = { line: 23, ch: 11 },
                    pos2    = { line: 23, ch: 14 },
                    pos3    = { line: 23, ch: 21 };

                runs(function () {
                    testDocument.replaceRange("tes", pos1, pos1);
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(1);
                    expect(hintsObj.hints[0]).toBe("test.html");

                    // Partially existing file was replaced correctly
                    UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0]);
                    expect(testDocument.getRange(pos1, pos3)).toEqual("test.html'");
                });
            });

            it("should insert folder and replace file in CSS", function () {
                var pos1    = { line: 10, ch: 24 },
                    pos2    = { line: 10, ch: 34 },
                    pos3    = { line: 10, ch: 43 },
                    pos4    = { line: 10, ch: 45 };

                runs(function () {
                    testEditor.setCursorPos(pos1);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(2);
                    expect(hintsObj.hints[0]).toBe("subfolder/");

                    // True indicates hints were remain open after insertion of folder
                    // (i.e. showing contents of inserted folder)
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(true);

                    // Folder was inserted (i.e. filename was not removed)
                    expect(testDocument.getRange(pos1, pos3)).toEqual("subfolder/dummy.jpg");

                    // Cursor is at end of inserted folder
                    expect(testEditor.getCursorPos()).toEqual(pos2);

                    // Get hints of inserted folder
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(subfolderDirHints.length);

                    // Complete path is displayed
                    expect(hintsObj.hints[0]).toBe("subfolder/chevron.png");

                    // False indicates hints were closed after insertion
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(false);

                    // Filename was replaced
                    expect(testDocument.getRange(pos1, pos4)).toEqual("subfolder/chevron.png");
                });
            });

            it("should insert filtered folder in CSS", function () {
                var pos1    = { line: 10, ch: 24 },
                    pos2    = { line: 10, ch: 27 },
                    pos3    = { line: 10, ch: 43 };

                runs(function () {
                    testDocument.replaceRange("sub", pos1, pos1);
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(1);
                    expect(hintsObj.hints[0]).toBe("subfolder/");

                    // Partially existing folder was inserted correctly
                    UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0]);
                    expect(testDocument.getRange(pos1, pos3)).toEqual("subfolder/dummy.jpg");
                });
            });

            it("should replace filtered file in CSS", function () {
                var pos1    = { line: 10, ch: 24 },
                    pos2    = { line: 10, ch: 27 },
                    pos3    = { line: 10, ch: 34 };

                runs(function () {
                    testDocument.replaceRange("tes", pos1, pos1);
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(1);
                    expect(hintsObj.hints[0]).toBe("test.html");

                    // Partially existing file was replaced correctly
                    UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0]);
                    expect(testDocument.getRange(pos1, pos3)).toEqual("test.html)");
                });
            });

            it("should collapse consecutive path separators when inserting folder in HTML", function () {
                var pos1    = { line: 22, ch: 11 },
                    pos2    = { line: 22, ch: 22 };

                runs(function () {
                    testEditor.setCursorPos(pos1);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(2);
                    expect(hintsObj.hints[0]).toBe("subfolder/");

                    // True indicates hints were remain open after insertion of folder
                    // (i.e. showing contents of inserted folder)
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(true);

                    // Folder was inserted and there's only 1 slash afterwards
                    expect(testDocument.getRange(pos1, pos2)).toEqual("subfolder/'");
                });
            });

            it("should collapse consecutive path separators when inserting folder in CSS", function () {
                var pos1    = { line: 9, ch: 15 },
                    pos2    = { line: 9, ch: 26 };

                runs(function () {
                    testEditor.setCursorPos(pos1);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(2);
                    expect(hintsObj.hints[0]).toBe("subfolder/");

                    // True indicates hints were remain open after insertion of folder
                    // (i.e. showing contents of inserted folder)
                    expect(UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0])).toBe(true);

                    // Folder was inserted and there's only 1 slash afterwards
                    expect(testDocument.getRange(pos1, pos2)).toEqual("subfolder/\"");
                });
            });

            it("should show & insert case insensitive hints in HTML", function () {
                var pos1    = { line: 18, ch: 12 },
                    pos2    = { line: 18, ch: 13 },
                    pos3    = { line: 18, ch: 21 };

                runs(function () {
                    // Insert letter that matches filename, but with different case
                    testDocument.replaceRange("T", pos1, pos1);
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(1);
                    expect(hintsObj.hints[0]).toBe("test.html");

                    UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0]);

                    // Filename case from list was inserted (overriding case inserted in page)
                    expect(testDocument.getRange(pos1, pos3)).toEqual("test.html");
                });
            });

            it("should show & insert case insensitive hints in CSS", function () {
                var pos1    = { line: 6, ch: 24 },
                    pos2    = { line: 6, ch: 25 },
                    pos3    = { line: 6, ch: 33 };

                runs(function () {
                    // Insert letter that matches filename, but with different case
                    testDocument.replaceRange("T", pos1, pos1);
                    testEditor.setCursorPos(pos2);
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });

                runs(function () {
                    expect(hintsObj).toBeTruthy();
                    expect(hintsObj.hints).toBeTruthy();
                    expect(hintsObj.hints.length).toBe(1);
                    expect(hintsObj.hints[0]).toBe("test.html");

                    UrlCodeHints.hintProvider.insertHint(hintsObj.hints[0]);

                    // Filename case from list was inserted (overriding case inserted in page)
                    expect(testDocument.getRange(pos1, pos3)).toEqual("test.html");
                });
            });
        });

    }); // describe("Url Code Hinting"
});
