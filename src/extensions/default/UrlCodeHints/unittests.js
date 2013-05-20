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
    var CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
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
         * Returns an Editor suitable for use in isolation, given a Document. (Unlike
         * SpecRunnerUtils.createMockEditor(), which is given text and creates the Document
         * for you).
         *
         * @param {Document} doc - the document to be contained by the new Editor
         * @return {Editor} - the mock editor object
         */
        function createMockEditor(doc) {
            // Initialize EditorManager
            var $editorHolder = $("<div id='mock-editor-holder'/>");
            EditorManager.setEditorHolder($editorHolder);
            $("body").append($editorHolder);
            
            // create Editor instance
            var editor = new Editor(doc, true, $editorHolder.get(0));
            EditorManager._notifyActiveEditorChanged(editor);
            
            return editor;
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
                // Mac and Windows sort folder and file names differently
                expectedFirstHint = (brackets.platform === "win") ? "subfolder/" : "data.json";
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
                    hintsObj = null;
                    testEditor.setCursorPos({ line: 12, ch: 12 });
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });

            it("should hint for src attribute", function () {
                runs(function () {
                    hintsObj = null;
                    testEditor.setCursorPos({ line: 13, ch: 13 });
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
            
            it("should not hint in query part of url ", function () {
                runs(function () {
                    testEditor.setCursorPos({ line: 18, ch: 31 });
                    expectNoHints(UrlCodeHints.hintProvider);
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
                    hintsObj = null;
                    testEditor.setCursorPos({ line: 4, ch: 12 });
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });

            it("should hint for background-image: url()", function () {
                runs(function () {
                    hintsObj = null;
                    testEditor.setCursorPos({ line: 6, ch: 24 });
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });

            it("should hint for border-image: url('')", function () {
                runs(function () {
                    hintsObj = null;
                    testEditor.setCursorPos({ line: 7, ch: 21 });
                    expectAsyncHints(UrlCodeHints.hintProvider);
                });
                
                runs(function () {
                    verifyUrlHints(hintsObj.hints);
                });
            });
            
            it("should hint for list-style-image: url(\"\")", function () {
                runs(function () {
                    hintsObj = null;
                    testEditor.setCursorPos({ line: 8, ch: 25 });
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
            
        describe("Url Insertion", function () {

            // These tests edit doc, so we need to setup/tear-down for each test
            beforeEach(function () {
                setupTests();
            });
            
            afterEach(function () {
                tearDownTests();
            });

/*
        * no closing single quote
          - closing single quote added
          
        * no closing doubl equote
          - closing double quote added
          
        * no closing paren
          - closing paren added
          
        * hints stay open after selecting folder
          - cursor is not moved outside of url()
          
        * hints close after selecting file
          - cursor is moved outside of url()
*/
            
            
        });
        
    }); // describe("Url Code Hinting"
});
