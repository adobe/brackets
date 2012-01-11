define(function(require, exports, module) {
    // Load dependent modules
    var ProjectManager      // Load from brackets.test
    ,   PreferencesManager  // Load from brackets.test
    ,   SpecRunnerUtils     = require("./SpecRunnerUtils.js")
    ;

    // FIXME (jasonsj): these tests are ommitted when launching in the main app window
    if (window.opener) { // (function(){

    describe("ProjectManager", function() {

        beforeEach(function() {
            this.app = window.opener;

            // Load module instances from brackets.test
            ProjectManager = this.app.brackets.test.ProjectManager;
            PreferencesManager = this.app.brackets.test.PreferencesManager;

            // Temporarily use test key in the main app window
            PreferencesManager._setStorageKey( PreferencesManager._TEST_PREFERENCES_KEY );

            this.app.location.reload();
            this.testPath = SpecRunnerUtils.getTestPath("/spec/ProjectManager-test-files");
            var isReady = false;
            $(this.app.document).ready(function() {
                isReady = true;
            });
            waitsFor(function() { return isReady; }, 5000);
        });

        afterEach(function() {
            // restore main app window preferences key
            PreferencesManager._setStorageKey( PreferencesManager.PREFERENCES_KEY );
        });

        describe("createNewItem", function() {
            // TODO (jasonsj): test Commands.FILE_NEW
            it("should create a new file with a given name", function() {
                var didCreate = false, gotError = false;

                runs(function() {
                    ProjectManager.loadProject(this.testPath);
                });
                waitsFor(function() { return ProjectManager.getProjectRoot() }, "loadProject() timeout", 1000);

                runs(function() {
                    // skip rename
                    ProjectManager.createNewItem(this.testPath, "Untitled.js", true)
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
                    ProjectManager.loadProject(this.testPath);
                });
                waitsFor(function() { return ProjectManager.getProjectRoot() }, "loadProject() timeout", 1000);

                runs(function() {
                    // skip rename
                    ProjectManager.createNewItem(this.testPath, "file.js", true)
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
                    ProjectManager.loadProject(this.testPath);
                });
                waitsFor(function() { return ProjectManager.getProjectRoot() }, "loadProject() timeout", 1000);

                runs(function() {
                    // skip rename
                    ProjectManager.createNewItem(this.testPath, "directory", true)
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
                    ProjectManager.loadProject(this.testPath);
                });
                waitsFor(function() { return ProjectManager.getProjectRoot() }, "loadProject() timeout", 1000);

                for (i = 0; i < len; i++) {
                    didCreate = false;
                    gotError = false;
                    charAt = chars.charAt(i);

                    runs(function() {
                        // skip rename
                        ProjectManager.createNewItem(this.testPath, "file" + charAt + ".js", true)
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

    }
});
