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
/*global $, define, require, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, waitsForDone, beforeFirst, afterLast */

define(function (require, exports, module) {
    "use strict";
    
    var ProjectManager,     // Load from brackets.test
        CommandManager,     // Load from brackets.test
        FileSystem,         // Load from brackets.test
        Dialogs             = require("widgets/Dialogs"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        Commands            = require("command/Commands"),
        Error               = require("filesystem/Error"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");


    describe("ProjectManager", function () {
        
        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/ProjectManager-test-files"),
            testWindow,
            brackets;

        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                
                // Load module instances from brackets.test
                brackets       = testWindow.brackets;
                ProjectManager = testWindow.brackets.test.ProjectManager;
                CommandManager = testWindow.brackets.test.CommandManager;
                FileSystem     = testWindow.brackets.test.FileSystem;
                
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterLast(function () {
            testWindow     = null;
            brackets       = null;
            ProjectManager = null;
            CommandManager = null;
            SpecRunnerUtils.closeTestWindow();
        });
        

        describe("createNewItem", function () {
            it("should create a new file with a given name", function () {
                var didCreate = false, gotError = false;

                runs(function () {
                    // skip rename
                    ProjectManager.createNewItem(testPath, "Untitled.js", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didCreate && !gotError; }, "ProjectManager.createNewItem() timeout", 1000);

                var error, stat, complete = false;
                var filePath = testPath + "/Untitled.js";
                var file = FileSystem.getFileForPath(filePath);
                
                runs(function () {
                    file.stat(function (err, _stat) {
                        if (!err) {
                            error = 0;
                            stat = _stat;
                            complete = true;
                        } else {
                            error = err;
                            complete = true;
                        }
                    });
                });

                waitsFor(function () { return complete; }, 1000);

                var unlinkError = brackets.fs.NO_ERROR;
                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isFile()).toBe(true);

                    // delete the new file
                    complete = false;
                    file.unlink(function (err) {
                        if (!err) {
                            unlinkError = 0;
                            complete = true;
                        } else {
                            unlinkError = err;
                            complete = true;
                        }
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
                    
                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK);
                });
            });

            it("should fail when a file name matches a directory that already exists", function () {
                var didCreate = false, gotError = false;

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
                    
                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK);
                });
            });

            it("should fail when file name contains special characters", function () {
                var chars = "/?*:;{}<>\\";
                var i = 0;
                var len = chars.length;
                var charAt, didCreate, gotError;

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
                    
                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK);
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
            it("should fail when file name is invalid", function () {
                var files = ['com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
                              'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
                              'nul', 'con', 'prn', 'aux', '.', '..', '...'];
                var i = 0;
                var len = files.length;
                var fileAt, didCreate, gotError;

                function createFile() {
                    // skip rename
                    ProjectManager.createNewItem(testPath, fileAt, true)
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
                    waitsFor(waitForFileCreate, "ProjectManager.createNewItem() timeout", 1000);
                    runs(assertFile);
                }
            });
        });
        
        describe("deleteItem", function () {
            it("should delete the selected file in the project tree", function () {
                var complete    = false,
                    newFile     = FileSystem.getFileForPath(testPath + "/delete_me.js"),
                    selectedFile,
                    error,
                    stat;

                // Make sure we don't have any test file left from previous failure 
                // by explicitly deleting the test file if it exists.
                runs(function () {
                    complete = false;
                    newFile.unlink(function (err) {
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; }, "clean up leftover files timeout", 1000);

                // Create a file and select it in the project tree.
                runs(function () {
                    complete = false;
                    ProjectManager.createNewItem(testPath, "delete_me.js", true)
                        .always(function () { complete = true; });
                });
                waitsFor(function () { return complete; }, "ProjectManager.createNewItem() timeout", 1000);

                runs(function () {
                    complete = false;
                    error = 0;
                    newFile.stat(function (err, _stat) {
                        if (!err) {
                            stat = _stat;
                            complete = true;
                        } else {
                            error = err;
                            complete = true;
                        }
                    });
                });
                waitsFor(function () { return complete; }, 1000);

                // Verify the existence of the new file and make sure it is selected in the project tree.
                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isFile()).toBe(true);
                    selectedFile = ProjectManager.getSelectedItem();
                    expect(selectedFile.fullPath).toBe(testPath + "/delete_me.js");
                });

                // Delete the selected file.
                runs(function () {
                    complete = false;
                    // delete the new file
                    ProjectManager.deleteItem(selectedFile)
                        .always(function () { complete = true; });
                });

                waitsFor(function () { return complete; }, "ProjectManager.deleteItem() timeout", 1000);

                // Verify that file no longer exists.
                runs(function () {
                    complete = false;
                    error = 0;
                    newFile.stat(function (err, _stat) {
                        if (!err) {
                            stat = _stat;
                            complete = true;
                        } else {
                            error = err;
                            complete = true;
                        }
                    });
                });
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(Error.NOT_FOUND);

                    // Verify that some other file is selected in the project tree.
                    var curSelectedFile = ProjectManager.getSelectedItem();
                    expect(curSelectedFile).not.toBe(selectedFile);
                });
            });

            // TODO: FileSystem - fix this test
            xit("should delete the selected folder and all items in it.", function () {
                var complete       = false,
                    newFolderName  = testPath + "/toDelete",
                    rootFolderName = newFolderName,
                    rootFolderEntry,
                    error,
                    stat;

                // Make sure we don't have any test files/folders left from previous failure 
                // by explicitly deleting the root test folder if it exists.
                runs(function () {
                    var rootFolder = FileSystem.getDirectoryForPath(rootFolderName);
                    complete = false;
                    rootFolder.moveToTrash(function (err) {
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; }, "clean up leftover files timeout", 1000);

                // Create a folder
                runs(function () {
                    complete = false;
                    ProjectManager.createNewItem(testPath, "toDelete", true, true)
                        .always(function () { complete = true; });
                });
                waitsFor(function () { return complete; }, "ProjectManager.createNewItem() timeout", 1000);

                runs(function () {
                    var newFolder = FileSystem.getDirectoryForPath(newFolderName);
                    complete = false;
                    newFolder.stat(function (err, _stat) {
                        if (!err) {
                            error = 0;
                            stat = _stat;
                            complete = true;
                        } else {
                            error = err;
                            complete = true;
                        }
                    });
                });
                waitsFor(function () { return complete; }, 1000);

                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isDirectory()).toBe(true);

                    rootFolderEntry = ProjectManager.getSelectedItem();
                    expect(rootFolderEntry.fullPath).toBe(testPath + "/toDelete/");
                });

                // Create a sub folder
                runs(function () {
                    complete = false;
                    ProjectManager.createNewItem(newFolderName, "toDelete1", true, true)
                        .always(function () { complete = true; });
                });
                waitsFor(function () { return complete; }, "ProjectManager.createNewItem() timeout", 1000);

                runs(function () {
                    var newFolder;
                    
                    newFolderName += "toDelete1/";
                    newFolder = FileSystem.getDirectoryForPath(newFolderName);
                    complete = false;
                    newFolder.stat(function (err, _stat) {
                        if (!err) {
                            error = 0;
                            stat = _stat;
                            complete = true;
                        } else {
                            error = err;
                            complete = true;
                        }
                    });
                });
                waitsFor(function () { return complete; }, 1000);

                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isDirectory()).toBe(true);
                });

                // Create a file in the sub folder just created.
                runs(function () {
                    complete = false;
                    ProjectManager.createNewItem(newFolderName, "toDelete2.txt", true)
                        .always(function () { complete = true; });
                });
                waitsFor(function () { return complete; }, "ProjectManager.createNewItem() timeout", 1000);

                runs(function () {
                    var file = FileSystem.getFileForPath(newFolderName + "/toDelete2.txt");
                    complete = false;
                    file.stat(function (err, _stat) {
                        if (!err) {
                            error = 0;
                            stat = _stat;
                            complete = true;
                        } else {
                            error = err;
                            complete = true;
                        }
                    });
                });
                waitsFor(function () { return complete; }, 1000);

                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isFile()).toBe(true);
                });
                
                // Delete the root folder and all files/folders in it.
                runs(function () {
                    complete = false;

                    ProjectManager.deleteItem(rootFolderEntry)
                        .always(function () { complete = true; });
                });
                waitsFor(function () { return complete; }, "ProjectManager.deleteItem() timeout", 1000);

                // Verify that the root folder no longer exists.
                runs(function () {
                    var rootFolder = FileSystem.getDirectoryForPath(rootFolderName);
                    complete = false;
                    rootFolder.stat(function (err, _stat) {
                        if (!err) {
                            error = 0;
                            stat = _stat;
                            complete = true;
                        } else {
                            error = err;
                            complete = true;
                        }
                    });
                });
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(Error.NOT_FOUND);

                    // Verify that some other file is selected in the project tree.
                    var curSelectedFile = ProjectManager.getSelectedItem();
                    expect(curSelectedFile).not.toBe(rootFolderEntry);
                });
            });
        });
        
        describe("Selection indicator", function () {
            
            function expectSelected(fullPath) {
                var $projectTreeItems = testWindow.$("#project-files-container > ul").children(),
                    $selectedItem     = $projectTreeItems.find("a.jstree-clicked");
                
                if (!fullPath) {
                    expect($selectedItem.length).toBe(0);
                } else {
                    expect($selectedItem.length).toBe(1);
                    expect($selectedItem.parent().data("entry").fullPath).toBe(fullPath);
                }
            }
            
            it("should deselect after opening file not rendered in tree", function () {
                var promise,
                    exposedFile   = testPath + "/file.js",
                    unexposedFile = testPath + "/directory/file.js";
                
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: exposedFile });
                    waitsForDone(promise);
                });
                runs(function () {
                    expectSelected(exposedFile);
                    
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: unexposedFile });
                    waitsForDone(promise);
                });
                runs(function () {
                    expectSelected(null);
                });
            });
            
            function findExtantNode(fullPath) {
                var $treeItems = testWindow.$("#project-files-container li"),
                    $result;
                
                $treeItems.is(function () {
                    var $treeNode = testWindow.$(this),
                        entry = $treeNode.data("entry");
                    if (entry && entry.fullPath === fullPath) {
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
                
                $treeNode.children("a").click();
                
                // if a folder has never been expanded before, this will be async
                waitsFor(function () {
                    return $treeNode.hasClass(expectedClass);
                }, (open ? "Open" : "Close") + " tree node", 1000);
            }
            
            it("should reselect previously selected file when made visible again", function () {
                var promise,
                    initialFile  = testPath + "/file.js",
                    folder       = testPath + "/directory/",
                    fileInFolder = testPath + "/directory/file.js";
                
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: initialFile });
                    waitsForDone(promise);
                });
                runs(function () {
                    expectSelected(initialFile);
                    toggleFolder(folder, true);     // open folder
                });
                runs(function () {                  // open file in folder
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: fileInFolder });
                    waitsForDone(promise);
                });
                runs(function () {
                    expectSelected(fileInFolder);
                    toggleFolder(folder, false);    // close folder
                });
                runs(function () {
                    expectSelected(folder);
                    toggleFolder(folder, true);     // open folder again
                });
                runs(function () {
                    expectSelected(fileInFolder);
                    toggleFolder(folder, false);    // close folder
                });
            });
            
            it("should deselect after opening file hidden in tree, but select when made visible again", function () {
                var promise,
                    initialFile  = testPath + "/file.js",
                    folder       = testPath + "/directory/",
                    fileInFolder = testPath + "/directory/file.js";
                
                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: initialFile });
                    waitsForDone(promise);
                });
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
                runs(function () {
                    expectSelected(null);
                    toggleFolder(folder, true);     // open folder again
                });
                runs(function () {
                    expectSelected(fileInFolder);
                    toggleFolder(folder, false);    // close folder
                });
            });
        });
        
        describe("File Display", function () {
            it("should not show useless directory entries", function () {
                var shouldShow = ProjectManager.shouldShow;
                
                expect(shouldShow(".git")).toBe(false);
                expect(shouldShow(".svn")).toBe(false);
                expect(shouldShow(".DS_Store")).toBe(false);
                expect(shouldShow("Thumbs.db")).toBe(false);
                expect(shouldShow(".hg")).toBe(false);
                expect(shouldShow(".gitmodules")).toBe(false);
                expect(shouldShow(".gitignore")).toBe(false);
                expect(shouldShow("foobar")).toBe(true);
                expect(shouldShow("pyc.py")).toBe(true);
                expect(shouldShow("module.pyc")).toBe(false);
                expect(shouldShow(".gitattributes")).toBe(false);
                expect(shouldShow("CVS")).toBe(false);
                expect(shouldShow(".cvsignore")).toBe(false);
                expect(shouldShow(".hgignore")).toBe(false);
                expect(shouldShow(".hgtags")).toBe(false);
                
            });
        });

    });
});
