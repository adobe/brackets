describe("ProjectManager", function() {

    beforeEach(function() {
        this.app = window.opener;
        this.app.location.reload();
        this.testPath = SpecRunnerUtils.getTestPath("/spec/ProjectManager-test-files");
        var isReady = false;
        $(this.app.document).ready(function() {
            isReady = true;
        });
        waitsFor(function() { return isReady; }, 5000);
    });

    describe("createNewItem", function() {
        // TODO (jasonsj): test Commands.FILE_NEW
        it("should create a new file with a given name", function() {
            var didCreate = false, gotError = false;

            runs(function() {
                this.app.ProjectManager.loadProject(this.testPath);
            });
            waitsFor(function() { return this.app.ProjectManager.getProjectRoot() }, "loadProject() timeout", 1000);

            runs(function() {
                // skip rename
                this.app.ProjectManager.createNewItem(this.testPath, "Untitled.js", true)
                    .done(function() { didCreate = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return didCreate && !gotError; }, "ProjectManager.createNewItem() timeout", 1000);

            var error, stat, complete = false;
            var filePath = this.testPath + "/Untitled.js";
            runs(function() {
                brackets.fs.stat(filePath, function(err, _stat) {
                    error = err;
                    stat = _stat;
                    complete = true;
                });
            });

            waitsFor(function() { return complete; }, 1000);

            var unlinkError = brackets.fs.NO_ERROR;
            runs(function() {
                expect(error).toBeFalsy();
                expect(stat.isFile()).toBe(true);

                // delete the new file
                complete = false;
                brackets.fs.unlink(filePath, function(err) {
                    unlinkError = err;
                    complete = true;
                });
            });
            waitsFor(function() {
                    return complete && unlinkError == brackets.fs.NO_ERROR;
                }
                , "unlink() failed to cleanup Untitled.js, err=" + unlinkError
                , 1000
            );
        });

        it("should fail when a file already exists", function() {
            var didCreate = false, gotError = false;

            runs(function() {
                this.app.ProjectManager.loadProject(this.testPath);
            });
            waitsFor(function() { return this.app.ProjectManager.getProjectRoot() }, "loadProject() timeout", 1000);

            runs(function() {
                // skip rename
                this.app.ProjectManager.createNewItem(this.testPath, "file.js", true)
                    .done(function() { didCreate = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return !didCreate && gotError; }, "ProjectManager.createNewItem() timeout", 1000);

            runs(function() {
                expect(gotError).toBeTruthy();
                expect(didCreate).toBeFalsy();
            });
        });

        it("should fail when a file name matches a directory that already exists", function() {
            var didCreate = false, gotError = false;

            runs(function() {
                this.app.ProjectManager.loadProject(this.testPath);
            });
            waitsFor(function() { return this.app.ProjectManager.getProjectRoot() }, "loadProject() timeout", 1000);

            runs(function() {
                // skip rename
                this.app.ProjectManager.createNewItem(this.testPath, "directory", true)
                    .done(function() { didCreate = true; })
                    .fail(function() { gotError = true; });
            });
            waitsFor(function() { return !didCreate && gotError; }, "ProjectManager.createNewItem() timeout", 1000);

            runs(function() {
                expect(gotError).toBeTruthy();
                expect(didCreate).toBeFalsy();
            });
        });

        it("should fail when file name contains special characters", function() {
            var chars = "/?*:;{}<>\\";
            var i = 0;
            var len = chars.length;
            var charAt, didCreate, gotError;

            runs(function() {
                this.app.ProjectManager.loadProject(this.testPath);
            });
            waitsFor(function() { return this.app.ProjectManager.getProjectRoot() }, "loadProject() timeout", 1000);

            for (i = 0; i < len; i++) {
                didCreate = false;
                gotError = false;
                charAt = chars.charAt(i);

                runs(function() {
                    // skip rename
                    this.app.ProjectManager.createNewItem(this.testPath, "file" + charAt + ".js", true)
                        .done(function() { didCreate = true; })
                        .fail(function() { gotError = true; });
                });
                waitsFor(function() { return !didCreate && gotError; }, "ProjectManager.createNewItem() timeout", 1000);

                runs(function() {
                    expect(gotError).toBeTruthy();
                    expect(didCreate).toBeFalsy();
                });
            }
        });
    });

});