/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var DocumentManager     = brackets.getModule("document/DocumentManager"),
        Editor              = brackets.getModule("editor/Editor").Editor,
        EditorManager       = brackets.getModule("editor/EditorManager"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        UrlCodeHints        = require("main");


    describe("Url Code Hinting", function () {
        
        var extensionPath   = FileUtils.getNativeModuleDirectoryPath(module),
            testHtmlPath    = extensionPath + "/testfiles/test.html",
            testWindow,
            testDocument,
            testEditor,
            hintsObj;
        
        /**
         * Returns an Editor suitable for use in isolation, given a Document.
         *
         * @param {Document} doc - the document to be contained by the new Editor
         * @return {Editor} - the mock editor object
         */
        function createMockEditor(doc) {
            return SpecRunnerUtils.createMockEditorForDocument(doc);
        }

        function setupTests() {
            runs(function () {
                DocumentManager.getDocumentForPath(testHtmlPath).done(function (doc) {
                    testDocument = doc;
                });
            });
    
            waitsFor(function () {
                return (testDocument);
            }, "Unable to open test document", 2000);

            // create Editor instance (containing a CodeMirror instance)
            runs(function () {
                testEditor = createMockEditor(testDocument);
                DocumentManager.setCurrentDocument(testDocument);
            });
        }
        
        function tearDownTests() {
            runs(function () {
                // The following call ensures that the document is reloaded
                // from disk before each test
                DocumentManager.closeAll();
                
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
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
        
        // Expect hintList to contain folder and file names, starting with given value.
        // If unspecified, expects the default unfiltered list.
        function verifyUrlHints(hintList, expectedFirstHint) {
            if (!expectedFirstHint) {
                // IMPORTANT: Mac and Windows sort folder contents differently,
                // so the files and folders in the "testfiles" folder are named
                // strategically so that they sort the same on both Mac and Windows
                // (i.e. folders are listed first, and then files).
                expectedFirstHint = "subfolder/";
            }
            expect(hintList[0]).toBe(expectedFirstHint);
        }

        describe("HTML Url Code Hints", function () {

            // This MUST be the FIRST "test"
            it("should setup before tests", function () {
                setupTests();
            });
            
            it("should hint for href attribute", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 12, ch: 12 });

                    // Must reset hintsObj before every call to expectAsyncHints()
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });

            it("should hint for src attribute", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 13, ch: 13 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });
            
            it("should not hint for type attribute", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 13, ch: 21 });
                    expectNoHints(UrlCodeHints.hintProvider);
                });
            });
            
            it("should not hint in query part of url", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 18, ch: 31 });
                    expectNoHints(UrlCodeHints.hintProvider);
                });
            });
            
            it("should hint up 1 folder for '../'", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 19, ch: 14 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    var expectedFirstItem = (brackets.platform === "mac") ? "../data.json" : "../testfiles/";
                    verifyUrlHints(hintsObj.hints, expectedFirstItem);
                });
            });
            
            // This MUST be the LAST "test"
            it("should cleanup after tests", function () {
                tearDownTests();
            });
        });
        
        describe("CSS Url Code Hints", function () {
            
            // This MUST be the FIRST "test"
            it("should setup before tests", function () {
                setupTests();
            });
            
            it("should hint for @import url()", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 4, ch: 12 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });

            it("should hint for background-image: url()", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 6, ch: 24 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });

            it("should hint for border-image: url('')", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 7, ch: 21 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });
            
            it("should hint for list-style-image: url(\"\")", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 8, ch: 25 });
                    hintsObj = null;
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });

            it("should not hint for @import outside of url()", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 4, ch: 15 });
                    expectNoHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });

            it("should not hint for background-image outside of url()", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 9, ch: 20 });
                    expectNoHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });
            
            // This MUST be the LAST "test"
            it("should cleanup after tests", function () {
                tearDownTests();
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
                    DocumentManager.setCurrentDocument(testDocument);
                    testEditor = EditorManager.getCurrentFullEditor();
                    testEditor.setCursorPos({ line: 20, ch: 12 });
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
                    SpecRunnerUtils.closeTestWindow();
                });
            });
        });
        
        describe("Url Insertion", function () {

            // These tests edit doc, so we need to setup/tear-down for each test
            beforeEach(function () {
                setupTests();
            });
            
            afterEach(function () {
                tearDownTests();
            });

            it("should handle unclosed url(", function () {
                var pos1    = { line: 9, ch: 20 },
                    pos2    = { line: 9, ch: 24 },
                    pos3    = { line: 9, ch: 34 };

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
                var pos1    = { line: 9, ch: 20 },
                    pos2    = { line: 9, ch: 25 },
                    pos3    = { line: 9, ch: 36 };

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

            it("should keep hints open after inserting folder", function () {
                var pos1    = { line: 9, ch: 20 },
                    pos2    = { line: 9, ch: 25 },
                    pos3    = { line: 9, ch: 35 },
                    pos4    = { line: 9, ch: 37 },
                    pos5    = { line: 9, ch: 48 };

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
                    expect(hintsObj.hints.length).toBe(3);
                    
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
        });
        
    }); // describe("Url Code Hinting"
});
