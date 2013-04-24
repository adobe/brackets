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
/*global $, define, require, describe, it, expect, beforeEach, afterEach, waitsFor, runs, waitsForDone */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var ProjectManager,     // Load from brackets.test
        CommandManager,     // Load from brackets.test
        Commands            = require("command/Commands"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    describe("ProjectManager", function () {
        
        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/ProjectManager-test-files"),
            testWindow,
            brackets;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                
                // Load module instances from brackets.test
                brackets = testWindow.brackets;
                ProjectManager = testWindow.brackets.test.ProjectManager;
                CommandManager = testWindow.brackets.test.CommandManager;
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
        
        describe("Selection indicator", function () {
            
            function expectSelected(fullPath) {
                var $projectTreeItems = testWindow.$("#project-files-container > ul").children();
                var $selectedItem = $projectTreeItems.find("a.jstree-clicked");
                if (!fullPath) {
                    expect($selectedItem.length).toBe(0);
                } else {
                    expect($selectedItem.length).toBe(1);
                    expect($selectedItem.parent().data("entry").fullPath).toBe(fullPath);
                }
            }
            
            it("should deselect after opening file not rendered in tree", function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
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
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
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
                });
            });
            
            it("should deselect after opening file hidden in tree, but select when made visible again", function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
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
                });
            });
        });
        
        describe("File Display", function () {
            it("should not show useless directory entries", function () {
                var shouldShow = ProjectManager.shouldShow;
                var makeEntry = function (name) {
                    return { name: name };
                };
                
                expect(shouldShow(makeEntry(".gitmodules"))).toBe(false);
                expect(shouldShow(makeEntry("foobar"))).toBe(true);
                expect(shouldShow(makeEntry("pyc.py"))).toBe(true);
                expect(shouldShow(makeEntry("module.pyc"))).toBe(false);
            });
        });

    });
});
