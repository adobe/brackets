/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, require: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var ProjectManager,     // Load from brackets.test
        SpecRunnerUtils     = require("./SpecRunnerUtils.js");

    describe("ProjectManager", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/ProjectManager-test-files"),
            brackets;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                // Load module instances from brackets.test
                brackets = testWindow.brackets;
                ProjectManager = testWindow.brackets.test.ProjectManager;
            });
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        describe("createNewItem", function () {
            it("should create a new file with a given name", function () {
                var didCreate = false, gotError = false;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);

                runs(function () {
                    // skip rename
                    ProjectManager.createNewItem(testPath, "Untitled.js", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didCreate && !gotError; }, "ProjectManager.createNewItem() timeout", 1000);

                var error, stat, complete = false;
                var filePath = testPath + "/Untitled.js";
                runs(function () {
                    brackets.fs.stat(filePath, function (err, _stat) {
                        error = err;
                        stat = _stat;
                        complete = true;
                    });
                });

                waitsFor(function () { return complete; }, 1000);

                var unlinkError = brackets.fs.NO_ERROR;
                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isFile()).toBe(true);

                    // delete the new file
                    complete = false;
                    brackets.fs.unlink(filePath, function (err) {
                        unlinkError = err;
                        complete = true;
                    });
                });
                waitsFor(
                    function () {
                        return complete && (unlinkError === brackets.fs.NO_ERROR);
                    },
                    "unlink() failed to cleanup Untitled.js, err=" + unlinkError,
                    1000
                );
            });

            it("should fail when a file already exists", function () {
                var didCreate = false, gotError = false;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);

                runs(function () {
                    // skip rename
                    ProjectManager.createNewItem(testPath, "file.js", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return !didCreate && gotError; }, "ProjectManager.createNewItem() timeout", 1000);

                runs(function () {
                    expect(gotError).toBeTruthy();
                    expect(didCreate).toBeFalsy();
                });
            });

            it("should fail when a file name matches a directory that already exists", function () {
                var didCreate = false, gotError = false;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);

                runs(function () {
                    // skip rename
                    ProjectManager.createNewItem(testPath, "directory", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return !didCreate && gotError; }, "ProjectManager.createNewItem() timeout", 1000);

                runs(function () {
                    expect(gotError).toBeTruthy();
                    expect(didCreate).toBeFalsy();
                });
            });

            it("should fail when file name contains special characters", function () {
                var chars = "/?*:;{}<>\\";
                var i = 0;
                var len = chars.length;
                var charAt, didCreate, gotError;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);

                function createFile() {
                    // skip rename
                    ProjectManager.createNewItem(testPath, "file" + charAt + ".js", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                }
                
                function waitForFileCreate() {
                    return !didCreate && gotError;
                }
                
                function assertFile() {
                    expect(gotError).toBeTruthy();
                    expect(didCreate).toBeFalsy();
                }
                
                for (i = 0; i < len; i++) {
                    didCreate = false;
                    gotError = false;
                    charAt = chars.charAt(i);

                    runs(createFile);
                    waitsFor(waitForFileCreate, "ProjectManager.createNewItem() timeout", 1000);
                    runs(assertFile);
                }
            });
        });

    });
});
