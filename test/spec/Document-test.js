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
/*global define, $, describe, beforeEach, afterEach, it, runs, waitsFor, expect, brackets, waitsForDone */

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
            testWindow;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                EditorManager       = testWindow.brackets.test.EditorManager;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
                
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterEach(function () {
            testWindow      = null;
            CommandManager  = null;
            Commands        = null;
            EditorManager   = null;
            DocumentManager = null;
            SpecRunnerUtils.closeTestWindow();
        });
        
        var JS_FILE   = testPath + "/test.js",
            CSS_FILE  = testPath + "/test.css",
            HTML_FILE = testPath + "/test.html";


        describe("ref counting", function () {
            
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
                    EditorManager.closeInlineWidget(hostEditor, inlineWidget);
                    
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
