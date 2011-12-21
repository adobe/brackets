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
    });

});