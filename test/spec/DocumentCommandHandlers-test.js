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
/*global define: false, describe: false, beforeEach: false, afterEach: false, it: false, runs: false, waitsFor: false, expect: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CommandManager,      // loaded from brackets.test
        Commands,            // loaded from brackets.test
        DocumentCommandHandlers, // loaded from brackets.test
        DocumentManager,     // loaded from brackets.test
        SpecRunnerUtils     = require("./SpecRunnerUtils.js");
    
    describe("DocumentCommandHandlers", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/DocumentCommandHandlers-test-files"),
            testWindow;

        var TEST_JS_CONTENT = 'var myContent="This is awesome!";';
        var TEST_JS_NEW_CONTENT = "hello world";

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                DocumentCommandHandlers = testWindow.brackets.test.DocumentCommandHandlers;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
            });
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        // TODO (issue #115): test Commands.FILE_NEW. Current implementation of
        // ProjectManager.createNewItem() is tightly coupled to jstree UI and
        // events.

        describe("Close File", function () {
            it("should complete without error if no files are open", function () {
                var didClose = false, gotError = false;

                runs(function () {
                    CommandManager.execute(Commands.FILE_CLOSE)
                        .done(function () { didClose = true; })
                        .fail(function () { gotError = true; });
                });

                waitsFor(function () { return didClose && !gotError; }, 1000);

                runs(function () {
                    expect(testWindow.$("#main-toolbar .title").text()).toBe("");
                });
            });

            it("should close a file in the editor", function () {
                var didOpen = false, didClose = false, gotError = false;

                runs(function () {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/test.js"})
                        .done(function () { didOpen = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didOpen && !gotError; }, 1000);

                runs(function () {
                    gotError = false;
                    CommandManager.execute(Commands.FILE_CLOSE)
                        .done(function () { didClose = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didClose && !gotError; }, 1000);

                runs(function () {
                    expect(testWindow.$("#main-toolbar .title").text()).toBe("");
                });
            });
        });

        describe("Open File", function () {
            it("should open a file in the editor", function () {
                var didOpen = false, gotError = false;

                runs(function () {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/test.js"})
                        .done(function () { didOpen = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didOpen && !gotError; }, 1000);

                runs(function () {
                    expect(DocumentManager.getCurrentDocument().getText()).toBe(TEST_JS_CONTENT);
                });
            });
        });

        describe("Save File", function () {
            it("should save changes", function () {
                var didOpen     = false,
                    didSave     = false,
                    gotError    = false,
                    filePath    = testPath + "/test.js";

                runs(function () {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath})
                        .done(function () { didOpen = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didOpen && !gotError; }, "FILE_OPEN timeout", 1000);

                // modify and save
                runs(function () {
                    DocumentManager.getCurrentDocument().setText(TEST_JS_NEW_CONTENT);

                    CommandManager.execute(Commands.FILE_SAVE)
                        .done(function () { didSave = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didSave && !gotError; }, "FILE_SAVE timeout", 1000);

                // confirm file contents
                var actualContent = null, error = -1;
                runs(function () {
                    brackets.fs.readFile(filePath, "utf8", function (err, contents) {
                        error = err;
                        actualContent = contents;
                    });
                });
                waitsFor(function () { return error >= 0; }, "readFile timeout", 1000);

                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                    expect(actualContent).toBe(TEST_JS_NEW_CONTENT);
                });

                // reset file contents
                runs(function () {
                    brackets.fs.writeFile(filePath, TEST_JS_CONTENT, "utf8");
                });
            });
        });

        describe("Dirty File Handling", function () {

            beforeEach(function () {
                var didOpen = false, gotError = false;

                runs(function () {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/test.js"})
                        .done(function () { didOpen = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didOpen && !gotError; }, "FILE_OPEN timeout", 1000);
            });

            it("should report clean immediately after opening a file", function () {
                runs(function () {
                    expect(DocumentManager.getCurrentDocument().isDirty).toBe(false);
                });
            });
            
            it("should report dirty when modified", function () {
                var doc = DocumentManager.getCurrentDocument();
                
                runs(function () {
                    // change editor content
                    doc.setText(TEST_JS_NEW_CONTENT);
                    
                    // verify Document dirty status
                    expect(doc.isDirty).toBe(true);
                });
            });

            it("should report dirty after undo and redo", function () {
                var doc = DocumentManager.getCurrentDocument();
                var editor = doc._masterEditor._codeMirror;
                
                runs(function () {
                    // change editor content, followed by undo and redo
                    doc.setText(TEST_JS_NEW_CONTENT);

                    editor.undo();
                    expect(doc.getText()).toBe(TEST_JS_CONTENT);
                    
                    editor.redo();
                    expect(doc.getText()).toBe(TEST_JS_NEW_CONTENT);
                    
                    expect(doc.isDirty).toBe(true);
                });
            });
            
            it("should report not dirty after explicit clean", function () {
                var doc = DocumentManager.getCurrentDocument();
                
                runs(function () {
                    doc.setText(TEST_JS_NEW_CONTENT);
                    doc._markClean();
                    expect(doc.isDirty).toBe(false);
                });
            });

            // This test is not currently valid. For issue 152, we have temporarily decided to make it so
            // the file is always dirty as soon as you make a change, regardless of whether you undo back to
            // its last saved state. In the future, we might restore this behavior.
/*
            it("should report not dirty after undo", function() {
                runs(function() {
                    // change editor content, followed by undo
                    var doc = DocumentManager.getCurrentDocument();
                    var editor = doc._masterEditor._codeMirror;
                    
                    doc.getText(TEST_JS_NEW_CONTENT);
                    editor.undo();
                    
                    // verify Document dirty status
                    expect(doc.getText()).toBe(TEST_JS_CONTENT);
                    expect(DocumentManager.getCurrentDocument().isDirty).toBe(false);
                });
            });
*/
        });
    });
});
