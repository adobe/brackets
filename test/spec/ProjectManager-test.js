/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, expect, afterEach, waitsFor, runs, waitsForDone, beforeFirst, afterLast, waits */

define(function (require, exports, module) {
    "use strict";

    var ProjectManager,     // Load from brackets.test
        CommandManager,     // Load from brackets.test
        FileSystem,         // Load from brackets.test
        Dialogs             = require("widgets/Dialogs"),
        Commands            = require("command/Commands"),
        FileSystemError     = require("filesystem/FileSystemError"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils"),
        _                   = require("thirdparty/lodash");


    describe("ProjectManager", function () {

        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/ProjectManager-test-files"),
            tempDir  = SpecRunnerUtils.getTempDirectory(),
            testWindow,
            brackets;

        beforeFirst(function () {
            SpecRunnerUtils.createTempDirectory();

            // copy files to temp directory
            runs(function () {
                waitsForDone(SpecRunnerUtils.copy(testPath, tempDir), "copy temp files");
            });

            runs(function () {
                waitsForDone(SpecRunnerUtils.rename(tempDir + "/git/", tempDir + "/.git/"), "move files");
            });

            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                brackets       = testWindow.brackets;
                ProjectManager = testWindow.brackets.test.ProjectManager;
                CommandManager = testWindow.brackets.test.CommandManager;
                FileSystem     = testWindow.brackets.test.FileSystem;

                SpecRunnerUtils.loadProjectInTestWindow(tempDir);
            });
        });

        afterLast(function () {
            testWindow     = null;
            brackets       = null;
            ProjectManager = null;
            CommandManager = null;
            SpecRunnerUtils.closeTestWindow();
            SpecRunnerUtils.removeTempDirectory();
        });

        afterEach(function () {
            testWindow.closeAllFiles();
        });

        function waitForDialog() {
            var $dlg;
            waitsFor(function () {
                $dlg = testWindow.$(".modal.instance");
                return $dlg.length > 0;
            }, 300, "dialog to appear");
        }

        describe("createNewItem", function () {
            it("should create a new file with a given name", function () {
                var didCreate = false, gotError = false;

                runs(function () {
                    // skip rename
                    ProjectManager.createNewItem(tempDir, "Untitled.js", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didCreate && !gotError; }, "ProjectManager.createNewItem() timeout", 5000);

                var error, stat, complete = false;
                var filePath = tempDir + "/Untitled.js";
                var file = FileSystem.getFileForPath(filePath);

                runs(function () {
                    file.stat(function (err, _stat) {
                        error = err;
                        stat = _stat;
                        complete = true;
                    });
                });

                waitsFor(function () { return complete; }, 1000);

                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isFile).toBe(true);
                });
            });

            it("should fail when a file already exists", function () {
                var didCreate = false, gotError = false;

                runs(function () {
                    // skip rename
                    ProjectManager.createNewItem(tempDir, "file.js", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return !didCreate && gotError; }, "ProjectManager.createNewItem() timeout", 5000);
                waitForDialog();

                runs(function () {
                    expect(gotError).toBeTruthy();
                    expect(didCreate).toBeFalsy();

                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK);
                });
            });

            it("should fail when a file name matches a directory that already exists", function () {
                var didCreate = false, gotError = false;

                runs(function () {
                    // skip rename
                    ProjectManager.createNewItem(tempDir, "directory", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return !didCreate && gotError; }, "ProjectManager.createNewItem() timeout", 5000);
                waitForDialog();

                runs(function () {
                    expect(gotError).toBeTruthy();
                    expect(didCreate).toBeFalsy();

                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK);
                });
            });

            it("should fail when file name contains special characters", function () {
                var chars = "/?*:<>\\|\"";  // invalid characters on Windows
                var i = 0;
                var len = 0;
                var charAt, didCreate, gotError;

                if (brackets.platform === "mac") {
                    chars = "?*|:";
                } else if (brackets.platform === "linux") {
                    chars = "?*|/";
                }
                len = chars.length;

                function createFile() {
                    // skip rename
                    ProjectManager.createNewItem(tempDir, "file" + charAt + ".js", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                }

                function waitForFileCreate() {
                    return !didCreate && gotError;
                }

                function assertFile() {
                    expect(gotError).toBeTruthy();
                    expect(didCreate).toBeFalsy();

                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK);
                }

                for (i = 0; i < len; i++) {
                    didCreate = false;
                    gotError = false;
                    charAt = chars.charAt(i);

                    runs(createFile);
                    waitsFor(waitForFileCreate, "ProjectManager.createNewItem() timeout", 5000);
                    waitForDialog();

                    runs(assertFile);
                }
            });

            it("should fail when file name is invalid", function () {
                var files = ['com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
                              'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
                              'nul', 'con', 'prn', 'aux', '.', '..', '...'];
                var i = 0;
                var len = files.length;
                var fileAt, didCreate, gotError;

                function createFile() {
                    // skip rename
                    ProjectManager.createNewItem(tempDir, fileAt, true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                }

                function waitForFileCreate() {
                    return didCreate || gotError;
                }

                function assertFile() {
                    expect(gotError).toBeTruthy();
                    expect(didCreate).toBeFalsy();

                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK);
                }

                for (i = 0; i < len; i++) {
                    didCreate = false;
                    gotError = false;
                    fileAt = files[i];

                    runs(createFile);
                    waitsFor(waitForFileCreate, "ProjectManager.createNewItem() timeout", 5000);
                    waitForDialog();

                    runs(assertFile);
                }
            });

            // Issue #10183 -- Brackets writing to filtered directories could cause them to appear
            // in the file tree
            it("should not display excluded entry when resolved and written to", function () {
                var opFailed = false,
                    doneResolving = false,
                    doneWriting = false,
                    entry;

                runs(function () {
                    var found = testWindow.$(".jstree-brackets span:contains(\".git\")").length;
                    expect(found).toBe(0);
                });

                runs(function () {
                    FileSystem.resolve(ProjectManager.getProjectRoot().fullPath + ".git/", function (err, e, stat) {
                        if (err) {
                            opFailed = true;
                            return;
                        }
                        entry = e;
                        doneResolving = true;
                    });
                });

                waitsFor(function () {
                    return !opFailed && doneResolving;
                }, "FileSystem.resolve()", 500);

                runs(function () {
                    var file = FileSystem.getFileForPath(entry.fullPath + "test");
                    file.write("hi there!", function (err) {
                        if (err) {
                            opFailed = true;
                            return;
                        }
                        doneWriting = true;
                    });
                });

                waitsFor(function () {
                    return !opFailed && doneWriting;
                }, "create a file under .git", 500);

                // wait for the fs event to propagate to the project model
                waits(500);

                runs(function () {
                    var found = testWindow.$(".jstree-brackets span:contains(\".git\")").length,
                        sanity = testWindow.$(".jstree-brackets span:contains(\"file\") + span:contains(\".js\")").length;
                    expect(sanity).toBe(1);
                    expect(found).toBe(0);
                });

            });

        });

        describe("deleteItem", function () {
            it("should delete the selected file in the project tree", function () {
                var complete    = false,
                    newFile     = FileSystem.getFileForPath(tempDir + "/brackets_unittests_delete_me.js"),
                    selectedFile,
                    error,
                    stat;

                // Create a file and select it in the project tree.
                runs(function () {
                    complete = false;
                    ProjectManager.createNewItem(tempDir, "brackets_unittests_delete_me.js", true)
                        .always(function () { complete = true; });
                });
                waitsFor(function () { return complete; }, "ProjectManager.createNewItem() timeout", 5000);

                runs(function () {
                    complete = false;
                    newFile.stat(function (err, _stat) {
                        error = err;
                        stat = _stat;
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; }, 1000);

                // Verify the existence of the new file and make sure it is selected in the project tree.
                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isFile).toBe(true);
                    selectedFile = ProjectManager.getSelectedItem();
                    expect(selectedFile.fullPath).toBe(tempDir + "/brackets_unittests_delete_me.js");
                });

                runs(function () {
                    // delete the new file
                    var promise = ProjectManager.deleteItem(selectedFile);
                    waitsForDone(promise, "ProjectManager.deleteItem() timeout", 5000);
                });

                // Verify that file no longer exists.
                runs(function () {
                    complete = false;
                    newFile.stat(function (err, _stat) {
                        error = err;
                        stat = _stat;
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; }, 1000);

                runs(function () {
                    expect(error).toBe(FileSystemError.NOT_FOUND);

                    // Verify that some other file is selected in the project tree.
                    var curSelectedFile = ProjectManager.getSelectedItem();
                    expect(curSelectedFile).not.toBe(selectedFile);
                });
            });

            it("should delete the selected folder and all items in it.", function () {
                var complete        = false,
                    rootFolderName  = tempDir + "/toDelete1/",
                    rootFolderEntry = FileSystem.getDirectoryForPath(rootFolderName),
                    error,
                    stat,
                    promise;

                // Delete the root folder and all files/folders in it.
                runs(function () {
                    promise = ProjectManager.deleteItem(rootFolderEntry);
                    waitsForDone(promise, "ProjectManager.deleteItem() timeout", 5000);
                });

                // Verify that the root folder no longer exists.
                runs(function () {
                    var rootFolder = FileSystem.getDirectoryForPath(rootFolderName);
                    complete = false;
                    rootFolder.stat(function (err, _stat) {
                        error = err;
                        stat = _stat;
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; }, 1000);

                runs(function () {
                    expect(error).toBe(FileSystemError.NOT_FOUND);

                    // Verify that some other file is selected in the project tree.
                    var curSelectedFile = ProjectManager.getSelectedItem();
                    expect(curSelectedFile).not.toBe(rootFolderEntry);
                });
            });
        });

        describe("Selection indicator", function () {

            function getItemName(fullPath) {
                if (fullPath === null) {
                    return null;
                }

                var isFolder      = _.last(fullPath) === "/",
                    withoutSlash  = isFolder ? fullPath.substr(0, fullPath.length - 1) : fullPath;

                return _.last(withoutSlash.split("/"));
            }

            function expectSelected(fullPath) {
                var $projectTreeItems = testWindow.$("#project-files-container > div > div > ul").children(),
                    $selectedItem     = $projectTreeItems.find("a.jstree-clicked");

                var name = getItemName(fullPath);

                if (!name) {
                    expect($selectedItem.length).toBe(0);
                } else {
                    expect($selectedItem.length).toBe(1);
                    expect($selectedItem.text().trim()).toBe(name);
                }
            }

            /**
             * ProjectManager pauses between renders for performance reasons. For some tests,
             * we'll need to wait for the next render.
             */
            function waitForRenderDebounce() {
                waits(ProjectManager._RENDER_DEBOUNCE_TIME);
            }

            it("should deselect after opening file not rendered in tree", function () {
                var promise,
                    exposedFile   = tempDir + "/file.js",
                    unexposedFile = tempDir + "/directory/interiorfile.js";

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: exposedFile });
                    waitsForDone(promise);
                });
                waitForRenderDebounce();
                runs(function () {
                    expectSelected(exposedFile);

                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: unexposedFile });
                    waitsForDone(promise);
                });
                waitForRenderDebounce();
                runs(function () {
                    expectSelected(null);
                });
            });

            function findExtantNode(fullPath) {
                var $treeItems = testWindow.$("#project-files-container li"),
                    $result;

                var name = getItemName(fullPath);

                $treeItems.is(function () {
                    var $treeNode = testWindow.$(this);
                    if ($treeNode.children("a").text().trim() === name) {
                        $result = $treeNode;
                        return true;
                    }
                    return false;
                });
                return $result;
            }

            function toggleFolder(fullPath, open) {
                var $treeNode = findExtantNode(fullPath);

                var expectedClass = open ? "jstree-open" : "jstree-closed";
                expect($treeNode.hasClass(expectedClass)).toBe(false);

                $treeNode.children("a").children("span").click();

                // if a folder has never been expanded before, this will be async
                waitsFor(function () {
                    return $treeNode.hasClass(expectedClass);
                }, (open ? "Open" : "Close") + " tree node", 1000);
            }

            it("should reselect previously selected file when made visible again", function () {
                var promise,
                    initialFile  = tempDir + "/file.js",
                    folder       = tempDir + "/directory/",
                    fileInFolder = tempDir + "/directory/interiorfile.js";

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: initialFile });
                    waitsForDone(promise);
                });
                waitForRenderDebounce();
                runs(function () {
                    expectSelected(initialFile);
                    toggleFolder(folder, true);     // open folder
                });
                runs(function () {                  // open file in folder
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: fileInFolder });
                    waitsForDone(promise);
                });
                waitForRenderDebounce();
                runs(function () {
                    expectSelected(fileInFolder);
                    toggleFolder(folder, false);    // close folder
                });
                runs(function () {
                    toggleFolder(folder, true);     // open folder again
                });
                waitForRenderDebounce();
                runs(function () {
                    expectSelected(fileInFolder);
                    toggleFolder(folder, false);    // close folder
                });
            });

            it("should deselect after opening file hidden in tree, but select when made visible again", function () {
                var promise,
                    initialFile  = tempDir + "/file.js",
                    folder       = tempDir + "/directory/",
                    fileInFolder = tempDir + "/directory/interiorfile.js";

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: initialFile });
                    waitsForDone(promise);
                });
                waitForRenderDebounce();
                runs(function () {
                    expectSelected(initialFile);
                    toggleFolder(folder, true);     // open folder
                });
                runs(function () {
                    toggleFolder(folder, false);    // close folder
                });
                runs(function () {                  // open file in folder
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: fileInFolder });
                    waitsForDone(promise);
                });
                waitForRenderDebounce();
                runs(function () {
                    expectSelected(null);
                    toggleFolder(folder, true);     // open folder again
                });
                waitForRenderDebounce();
                runs(function () {
                    expectSelected(fileInFolder);
                    toggleFolder(folder, false);    // close folder
                });
            });
        });

        describe("File Display", function () {
            it("should not show useless directory entries", function () {
                var shouldShow = ProjectManager.shouldShow;
                var makeEntry = function (name) {
                    return { name: name };
                };

                expect(shouldShow(makeEntry(".git"))).toBe(false);
                expect(shouldShow(makeEntry(".svn"))).toBe(false);
                expect(shouldShow(makeEntry(".DS_Store"))).toBe(false);
                expect(shouldShow(makeEntry("Thumbs.db"))).toBe(false);
                expect(shouldShow(makeEntry(".hg"))).toBe(false);
                expect(shouldShow(makeEntry(".gitmodules"))).toBe(false);
                expect(shouldShow(makeEntry(".gitignore"))).toBe(true);
                expect(shouldShow(makeEntry("foobar"))).toBe(true);
                expect(shouldShow(makeEntry("pyc.py"))).toBe(true);
                expect(shouldShow(makeEntry("module.pyc"))).toBe(false);
                expect(shouldShow(makeEntry(".gitattributes"))).toBe(true);
                expect(shouldShow(makeEntry("CVS"))).toBe(false);
                expect(shouldShow(makeEntry(".cvsignore"))).toBe(true);
                expect(shouldShow(makeEntry(".hgignore"))).toBe(true);
                expect(shouldShow(makeEntry(".hgtags"))).toBe(false);

            });
        });

    });
});
