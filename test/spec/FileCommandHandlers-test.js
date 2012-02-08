/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, beforeEach: false, afterEach: false, it: false, runs: false, waitsFor: false, expect: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CommandManager,      // loaded from brackets.test
        Commands,            // loaded from brackets.test
        FileCommandHandlers, // loaded from brackets.test
        DocumentManager,     // loaded from brackets.test
        SpecRunnerUtils     = require("./SpecRunnerUtils.js");
    
    describe("FileCommandHandlers", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/FileCommandHandlers-test-files"),
            testWindow;

        var TEST_JS_CONTENT = 'var myContent="This is awesome!";';
        var TEST_JS_NEW_CONTENT = "hello world";

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                FileCommandHandlers = testWindow.brackets.test.FileCommandHandlers;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
            });
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        // TODO (jasonsj): test Commands.FILE_NEW. Current implementation of
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
                    filePath    = testPath + "/test.js",
                    editor;

                runs(function () {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: filePath})
                        .done(function () { didOpen = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didOpen && !gotError; }, "FILE_OPEN timeout", 1000);

                // modify and save
                runs(function () {
                    editor = DocumentManager.getCurrentDocument()._editor;
                    editor.setValue(TEST_JS_NEW_CONTENT);

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
                runs(function () {
                    // change editor content
                    var editor = DocumentManager.getCurrentDocument()._editor;
                    editor.setValue(TEST_JS_NEW_CONTENT);

                    // verify Document dirty status
                    expect(editor.getValue()).toBe(TEST_JS_NEW_CONTENT);
                    expect(DocumentManager.getCurrentDocument().isDirty).toBe(true);

                    // FIXME (jasonsj): Even with the main app window reloaded, and
                    // proper jasmine async handling, some state is being held.
                    // Without this undo, *any* immediate test will timeout for
                    // Commands.FILE_OPEN. I had to re-order this suite so that
                    // this bug has minimal impact. This *does not* appear to be an
                    // issue with the FileCommandHandlers module.
                    // FIXME (jasonsj): editor.clearHistory() doesn't work either.
                    editor.undo();
                });
            });

            it("should report dirty after undo and redo", function () {
                runs(function () {
                    // change editor content, followed by undo and redo
                    var editor = DocumentManager.getCurrentDocument()._editor;
                    editor.setValue(TEST_JS_NEW_CONTENT);

                    editor.undo();
                    expect(editor.getValue()).toBe(TEST_JS_CONTENT);

                    // verify Document dirty status
                    editor.redo();
                    expect(editor.getValue()).toBe(TEST_JS_NEW_CONTENT);
                    expect(DocumentManager.getCurrentDocument().isDirty).toBe(true);
                });
            });
            
            it("should report clean after being marked clean", function () {
                runs(function () {
                    var document = DocumentManager.getCurrentDocument();
                    document.setText(TEST_JS_NEW_CONTENT);
                    document._markClean();
                    expect(document.isDirty).toBe(false);
                });
            });

            // This test is not currently valid. For issue 152, we have temporarily decided to make it so
            // the file is always dirty as soon as you make a change, regardless of whether you undo back to
            // its last saved state. In the future, we might restore this behavior.
/*
            it("should report not dirty after undo", function() {
                runs(function() {
                    // change editor content, followed by undo
                    var editor = DocumentManager.getCurrentDocument()._editor;
                    editor.setValue(TEST_JS_NEW_CONTENT);
                    editor.undo();
                    
                    // verify Document dirty status
                    expect(editor.getValue()).toBe(TEST_JS_CONTENT);
                    expect(DocumentManager.getCurrentDocument().isDirty).toBe(false);
                });
            });
*/
        });

        // TODO (jasonsj): experiment with mocks instead of real UI
    });
});
