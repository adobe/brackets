if (window.opener) { // (function(){

describe("FileCommandHandlers", function() {

    var TEST_JS_CONTENT = 'var myContent="This is awesome!";';
    var TEST_JS_NEW_CONTENT = "hello world";

    beforeEach(function() {
//        this.app = window.open(SpecRunnerUtils.getBracketsSourceRoot() + "/index.html");
        // TODO: this will only work if run from the main Brackets window (not from jasmine.sh)
        this.app = window.opener;
        this.app.location.reload();
        this.testPath = SpecRunnerUtils.getTestPath("/spec/FileCommandHandlers-test-files");
        var isReady = false;
        $(this.app.document).ready(function() {
            isReady = true;
        });
        waitsFor(function() { return isReady; }, 5000);
        runs(function() {
            this.app.ProjectManager.loadProject(this.testPath);
        });
        waitsFor(function() { return this.app.ProjectManager.getProjectRoot(); } , 1000);
    });

    describe("Close File", function() {
        it("should complete without error if no files are open", function() {
            var didClose = false, gotError = false;

            runs(function() {
                this.app.CommandManager.execute(this.app.Commands.FILE_CLOSE)
                .done(function() { didClose = true; })
                .fail(function() { gotError = true; });
            });

            waitsFor(function() { return didClose || gotError; }, 1000);

            runs(function() {
                expect(this.app.$("#main-toolbar .title").text()).toBe("Untitled");
            });
        });

        it("should close a file in the editor", function() {
            var didOpen = false, didClose = false, gotError = false;

            runs(function() {
                this.app.CommandManager.execute(this.app.Commands.FILE_OPEN, this.testPath + "/test.js")
                    .done(function() { didOpen = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return didOpen || gotError; }, 1000);

            runs(function() {
                gotError = false;
                this.app.CommandManager.execute(this.app.Commands.FILE_CLOSE)
                .done(function() { didClose = true; })
                .fail(function() { gotError = true; });
            });
            waitsFor(function() { return didClose || gotError; }, 1000);

            runs(function() {
                expect(this.app.$("#main-toolbar .title").text()).toBe("Untitled");
            });
        });
    });

    describe("Open File", function() {
        it("should open a file in the editor", function() {
            var didOpen = false, gotError = false;

            runs(function() {
                this.app.CommandManager.execute(this.app.Commands.FILE_OPEN, this.testPath + "/test.js")
                    .done(function() { didOpen = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return didOpen || gotError; }, 1000);

            runs(function() {
                expect(this.app.FileCommandHandlers.getEditor().getValue()).toBe(TEST_JS_CONTENT);
            });
        });
    });

    describe("Save File", function() {
        it("should save changes", function() {
            var didOpen = false, didSave = false, gotError = false;
            var filePath = this.testPath + "/test.js";
            var editor = this.app.FileCommandHandlers.getEditor();

            runs(function() {
                this.app.CommandManager.execute(this.app.Commands.FILE_OPEN, filePath)
                    .done(function() { didOpen = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return didOpen || gotError; }, "FILE_OPEN timeout", 1000);

            // modify and save
            runs(function() {
                editor.setValue(TEST_JS_NEW_CONTENT);

                this.app.CommandManager.execute(this.app.Commands.FILE_SAVE, filePath)
                    .done(function() { didSave = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return didSave || gotError; }, "FILE_SAVE timeout", 1000);

            // confirm file contents
            var actualContent = null, error = -1;
            runs(function() {
                brackets.fs.readFile(filePath, "utf8", function(err, contents) {
                    error = err;
                    actualContent = contents;
                });
            });
            waitsFor(function() { return error >=0 }, "readFile timeout", 1000);

            runs(function() {
                expect(error).toBe(0);
                expect(actualContent).toBe(TEST_JS_NEW_CONTENT);
            });

            // reset file contents
            runs(function() {
                brackets.fs.writeFile(filePath, TEST_JS_CONTENT, "utf8");
            });
        });
    });

    describe("Dirty File Handling", function() {

        it("should report not dirty after undo", function() {
            var didOpen = false, gotError = false;

            runs(function() {
                this.app.CommandManager.execute(this.app.Commands.FILE_OPEN, this.testPath + "/test.js")
                    .done(function() { didOpen = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return didOpen || gotError; }, "FILE_OPEN timeout", 1000);

            runs(function() {
                // change editor content, followed by undo
                var editor = this.app.FileCommandHandlers.getEditor();
                editor.setValue(TEST_JS_NEW_CONTENT);
                editor.undo();

                // verify FileCommandHandler dirty status
                expect(editor.getValue()).toBe(TEST_JS_CONTENT);
                expect(this.app.FileCommandHandlers.isDirty()).toBe(false);
            });
        });

        it("should report dirty when modified", function() {
            var didOpen = false, gotError = false;

            runs(function() {
                this.app.CommandManager.execute(this.app.Commands.FILE_OPEN, this.testPath + "/test.js")
                    .done(function() { didOpen = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return didOpen || gotError; }, "FILE_OPEN timeout", 1000);

            runs(function() {
                // change editor content
                var editor = this.app.FileCommandHandlers.getEditor();
                editor.setValue(TEST_JS_NEW_CONTENT);

                // verify FileCommandHandler dirty status
                expect(editor.getValue()).toBe(TEST_JS_NEW_CONTENT);
                expect(this.app.FileCommandHandlers.isDirty()).toBe(true);

                // FIXME (jasonsj): Even with the main app window reloaded, and
                // proper jasmine async handling, some state is being held.
                // Without this undo, *any* immediate test will timeout for
                // Commands.FILE_OPEN. I had to re-order this suite so that
                // this bug has minimal impact. This *does not* appear to be an
                // issue with the FileCommandHandlers module.
                editor.undo();
            });
        });

        it("should report dirty after undo and redo", function() {
            var didOpen = false, gotError = false;

            runs(function() {
                this.app.CommandManager.execute(this.app.Commands.FILE_OPEN, this.testPath + "/test.js")
                    .done(function() { didOpen = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return didOpen || gotError; }, "FILE_OPEN timeout", 1000);

            runs(function() {
                // change editor content, followed by undo and redo
                var editor = this.app.FileCommandHandlers.getEditor();
                editor.setValue(TEST_JS_NEW_CONTENT);
                editor.undo();
                editor.redo();

                // verify FileCommandHandler dirty status
                expect(editor.getValue()).toBe(TEST_JS_NEW_CONTENT);
                expect(this.app.FileCommandHandlers.isDirty()).toBe(true);
            });
        });
    });

    // TODO (jasonsj): experiment with mocks instead of real UI
});
} // })();