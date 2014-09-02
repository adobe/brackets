/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

/* unittests: ProjectModel */
/*global $, define, brackets, describe, it, xit, expect, beforeEach, waitsForDone, waitsForFail, runs, spyOn, jasmine */

define(function (require, exports, module) {
    "use strict";
    
    var ProjectModel = require("project/ProjectModel"),
        _ = require("thirdparty/lodash"),
        Immutable = require("thirdparty/immutable");
    
    describe("ProjectModel", function () {
        describe("shouldShow", function () {
            it("returns true for names that should be shown", function () {
                expect(ProjectModel.shouldShow({
                    name: "test.js"
                })).toBe(true);
            });
            
            it("returns false for names that should not be shown", function () {
                expect(ProjectModel.shouldShow({
                    name: ".git"
                })).toBe(false);
            });
        });
        
        describe("_ensureTrailingSlash", function () {
            it("adds a slash when there is none", function () {
                expect(ProjectModel._ensureTrailingSlash("/foo/bar")).toBe("/foo/bar/");
            });
            
            it("does nothing when there is already a slash", function () {
                expect(ProjectModel._ensureTrailingSlash("/foo/bar/")).toBe("/foo/bar/");
            });
        });
        
        it("should start with null projectRoot", function () {
            var pm = new ProjectModel.ProjectModel();
            expect(pm.projectRoot).toBe(null);
        });
        
        describe("with projectRoot", function () {
            var root, pm;
            
            beforeEach(function () {
                root = {
                    fullPath: "/foo/bar/project/"
                };
                
                pm = new ProjectModel.ProjectModel({
                    projectRoot: root
                });
            });

            it("allows setting projectRoot on construction", function () {
                expect(pm.projectRoot).toBe(root);
            });

            it("can tell you if a file is in a project", function () {
                var file = {
                        fullPath: "/foo/bar/project/README.md"
                    };
                expect(pm.isWithinProject(file)).toBe(true);
            });

            it("can tell you if a file is not in a project", function () {
                var file = {
                        fullPath: "/some/other/project/README.md"
                    };
                expect(pm.isWithinProject(file)).toBe(false);
            });
            
            it("can make a file project relative", function () {
                expect(pm.makeProjectRelativeIfPossible("/foo/bar/project/README.md")).toBe("README.md");
            });
            
            it("won't create a relative path to a file outside the project", function () {
                expect(pm.makeProjectRelativeIfPossible("/some/other/project/README.md")).toBe("/some/other/project/README.md");
            });
        });
        
        describe("All Files Cache", function () {
            var visited = false;
            
            function getPM(filelist, error, rootPath) {
                rootPath = rootPath || "/";
                var root = {
                    fullPath: rootPath,
                    visit: function (visitor, errorHandler) {
                        visited = true;
                        if (!filelist && error) {
                            errorHandler(error);
                        } else {
                            filelist.map(visitor);
                        }
                    }
                };
                return new ProjectModel.ProjectModel({
                    projectRoot: root
                });
            }
            
            beforeEach(function () {
                visited = false;
            });
            
            it("can create a list of all files", function () {
                var pm = getPM([{
                    fullPath: "/README.md",
                    name: "README.md",
                    isFile: true
                }, {
                    fullPath: "/other/",
                    name: "other",
                    isFile: false
                }, {
                    fullPath: "/other/test.js",
                    name: "test.js",
                    isFile: true
                }]);
                pm.getAllFiles().then(function (allFiles) {
                    expect(allFiles.length).toBe(2);
                    expect(allFiles).toContain("/README.md");
                });
            });
            
            it("filters files that don't pass shouldShow", function () {
                var pm = getPM([
                    {
                        fullPath: "/setup.pyc",
                        name: "setup.pyc",
                        isFile: true
                    }
                ]);
                pm.getAllFiles().then(function (allFiles) {
                    expect(allFiles.length).toBe(0);
                });
            });
            
            // Turned off because these promises are resolved synchronously right now
            // which causes this test to fail. The real running system would hit the error condition
            // asynchronously.
            xit("rejects the promise when there's an error", function () {
                var pm = getPM(null, "Got An Error");
                pm.getAllFiles().then(function (allFiles) {
                    expect("should not have gotten here").toBe("because there should be an error");
                }, function (error) {
                    expect(error).toBe("Got An Error");
                });
            });
            
            it("filters the file list with a function, if desired", function () {
                var pm = getPM([
                    {
                        fullPath: "/README.md",
                        name: "README.md",
                        isFile: true
                    }, {
                        fullPath: "/test.js",
                        name: "test.js",
                        isFile: true
                    }
                ]);
                
                pm.getAllFiles(function (entry) {
                    return entry.name === "test.js";
                }).then(function (allFiles) {
                    expect(allFiles.length).toBe(1);
                    expect(allFiles).toContain("/test.js");
                });
            });
            
            it("can add additional non-project files to the list", function () {
                var pm = getPM([
                    {
                        fullPath: "/project/README.md",
                        name: "README.md",
                        isFile: true
                    }
                ], null, "/project");
                pm.getAllFiles([{
                    fullPath: "/project/otherProjectFile.js"
                }, {
                    fullPath: "/RootFile.txt"
                }]).then(function (allFiles) {
                    expect(allFiles.length).toBe(2);
                    expect(allFiles).toContain("/project/README.md");
                    expect(allFiles).toContain("/RootFile.txt");
                });
            });
            
            it("caches the all files list", function () {
                var pm = getPM([
                    {
                        fullPath: "/project/README.md",
                        name: "README.md",
                        isFile: true
                    }
                ]);
                pm.getAllFiles().then(function (allFiles) {
                    expect(visited).toBe(true);
                    visited = false;
                    pm.getAllFiles().then(function (allFiles) {
                        expect(visited).toBe(false);
                    });
                });
            });
            
            it("can reset the cache", function () {
                var pm = getPM([
                    {
                        fullPath: "/project/README.md",
                        name: "README.md",
                        isFile: true
                    }
                ]);
                pm.getAllFiles().then(function (allFiles) {
                    expect(visited).toBe(true);
                    visited = false;
                    pm._resetCache();
                    pm.getAllFiles().then(function (allFiles) {
                        expect(visited).toBe(true);
                    });
                });
            });
        });
        
        describe("_getWelcomeProjectPath", function () {
            it("returns the initial directory if there's no sample URL", function () {
                expect(ProjectModel._getWelcomeProjectPath(undefined, "/Brackets/")).toBe("/Brackets/");
            });
            
            it("returns the correct sample directory", function () {
                expect(ProjectModel._getWelcomeProjectPath("root/GettingStarted/", "/Brackets/")).toBe(
                    "/Brackets/samples/root/GettingStarted/"
                );
            });
            
            it("ensures there's a trailing slash for backwards compatibility", function () {
                expect(ProjectModel._getWelcomeProjectPath("root/GettingStarted", "/Brackets/")).toBe(
                    "/Brackets/samples/root/GettingStarted/"
                );
            });
        });
        
        describe("_addWelcomeProjectPath", function () {
            it("adds the path to a new array", function () {
                var currentProjects = ["GettingStarted"];
                var newProjects = ProjectModel._addWelcomeProjectPath("NewStart/", currentProjects);
                expect(currentProjects.length).toBe(1);
                expect(newProjects).toEqual(["GettingStarted", "NewStart"]);
            });
        });
        
        describe("_isWelcomeProjectPath", function () {
            it("matches on the current welcome project", function () {
                expect(ProjectModel._isWelcomeProjectPath("/Brackets/GettingStarted/", "/Brackets/GettingStarted/")).toBe(true);
            });
            
            it("matches on previous welcome projects", function () {
                expect(ProjectModel._isWelcomeProjectPath("/Brackets/GettingStarted/", "/Brackets/NewStart/",
                                                          ["/Brackets/GettingStarted"])).toBe(true);
            });
            
            it("returns false when there's no match", function () {
                expect(ProjectModel._isWelcomeProjectPath("/Brackets/Unknown/", "/Brackets/NewStart/",
                                                          ["/Brackets/GettingStarted"])).toBe(false);
            });
            
            it("returns false when the project doesn't match and there are no known projects", function () {
                expect(ProjectModel._isWelcomeProjectPath("/Brackets/Unknown/", "/Brackets/NewStart/")).toBe(false);
            });
        });
        
        describe("isValidFilename", function () {
            it("returns true for filenames with nothing invalid", function () {
                expect(ProjectModel.isValidFilename("foo.txt", "*")).toBe(true);
            });
            
            it("returns false for filenames that match the invalid characters", function () {
                expect(ProjectModel.isValidFilename("foo*txt", "|*")).toBe(false);
            });
            
            it("returns false for filenames that match the internal list of disallowed names", function () {
                expect(ProjectModel.isValidFilename("/test/prn")).toBe(false);
            });
            
        });
        
        describe("setProjectRoot", function () {
            var subdir = {
                fullPath: "/path/to/project/subdir/",
                name: "subdir",
                isFile: false
            },
                contents = [
                    {
                        fullPath: "/path/to/project/README.md",
                        name: "README.md",
                        isFile: true
                    },
                    {
                        fullPath: "/path/to/project/afile.js",
                        name: "afile.js",
                        isFile: true
                    },
                    subdir
                ];
            
            var root = {
                fullPath: "/path/to/project/",
                getContents: function (callback) {
                    setTimeout(function () {
                        callback(null, contents);
                    }, 10);
                }
            };

            it("should initialize the treeData", function () {
                var model = new ProjectModel.ProjectModel(),
                    vm = model._viewModel;

                var changeFired = false;
                model.on(ProjectModel.EVENT_CHANGE, function () {
                    changeFired = true;
                });

                waitsForDone(model.setProjectRoot(root));

                runs(function () {
                    expect(vm.treeData.toJS()).toEqual({
                        "README.md": {},
                        "afile.js": {},
                        "subdir": {
                            children: null
                        }
                    });
                    expect(changeFired).toBe(true);
                });
            });
        });

        describe("markers", function () {
            var model = new ProjectModel.ProjectModel(),
                vm = model._viewModel,
                changesFired,
                selectionsMade;

            model.projectRoot = {
                fullPath: "/foo/"
            };

            // temporary
            vm.projectRoot = model.projectRoot;

            model.on(ProjectModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
                selectionsMade = [];
                vm.treeData = Immutable.fromJS({
                    subdir1: {
                        open: true,
                        children: {
                            "afile.js": {}
                        }
                    },
                    "afile.js": {},
                    subdir2: {
                        children: null
                    }
                });
                vm._selections = Immutable.Map({
                    selected: null,
                    context: null,
                    rename: null
                });
                
                model._selections = {};
            });

            describe("setSelected", function () {
                it("should select an unselected file", function () {
                    model.setSelected("/foo/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "selected"])).toBe(true);
                    expect(model._selections.selected).toBe("/foo/afile.js");
                    expect(changesFired).toBe(1);
                });

                it("should change the selection from the old to the new", function () {
                    model.setSelected("/foo/afile.js");
                    changesFired = 0;
                    model.setSelected("/foo/subdir1/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "selected"])).toBe(undefined);
                    expect(vm.treeData.getIn(["subdir1", "children", "afile.js", "selected"])).toBe(true);
                    expect(changesFired).toBe(1);
                });

                it("shouldn't fire a changed message if there was no change in selection", function () {
                    model.setSelected("/foo/afile.js");
                    expect(changesFired).toBe(1);
                    changesFired = 0;
                    model.setSelected("/foo/afile.js");
                    expect(changesFired).toBe(0);
                });

                it("should clear the context when there's a new selection", function () {
                    model.setContext("/foo/afile.js");
                    model.setSelected("/foo/subdir1/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "context"])).toBeUndefined();
                    expect(model._selections.context).toBeUndefined();
                });

                it("can clear the selection by passing in null", function () {
                    model.setSelected("/foo/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "selected"])).toBe(true);
                    changesFired = 0;
                    model.setSelected(null);
                    expect(vm.treeData.getIn(["afile.js", "selected"])).toBeUndefined();
                    expect(changesFired).toBe(1);
                });

                it("can select a file that is not visible", function () {
                    model.setSelected("/foo/subdir2/bar.js");
                    expect(changesFired).toBe(0);
                    expect(model._selections.selectIfVisible).toBe("/foo/subdir2/bar.js");
                    expect(model._selections.selected).toBe(null);
                });

                it("will unselect the previously selected file when selecting one that's not visible", function () {
                    model.setSelected("/foo/subdir1/afile.js");
                    model.setSelected("/foo/subdir2/bar.js");
                    expect(vm.treeData.getIn(["subdir1", "children", "afile.js", "selected"])).toBeUndefined();
                    expect(model._selections.selectIfVisible).toBe("/foo/subdir2/bar.js");
                    expect(model._selections.selected).toBe(null);
                });
                
                it("can accept a filesystem object", function () {
                    model.setSelected({
                        fullPath: "/foo/afile.js"
                    });
                    expect(model._selections.selected).toBe("/foo/afile.js");
                });
            });
            
            describe("setDirectoryOpen", function () {
                it("will clear selectIfVisible when selecting a visible item", function () {
                    model.setSelected("/foo/subdir1/afile.js");
                    model.setDirectoryOpen("/foo/subdir1/", false);
                    expect(model._selections.selectIfVisible).toBe("/foo/subdir1/afile.js");
                    expect(model._selections.selected).toBe("/foo/subdir1/");
                    expect(vm.treeData.getIn(["subdir1", "children", "afile.js", "selected"])).toBeUndefined();
                    expect(vm.treeData.getIn(["subdir1", "selected"])).toBe(true);
                    model.setSelected("/foo/afile.js");
                    expect(model._selections.selectIfVisible).toBeUndefined();
                    expect(vm.treeData.getIn(["subdir1", "selected"])).toBeUndefined();
                });
                
                it("will reselect a previously invisible item", function () {
                    model.setSelected("/foo/subdir1/afile.js");
                    model.setDirectoryOpen("/foo/subdir1/", false);
                    model.setDirectoryOpen("/foo/subdir1", true);
                    expect(model._selections.selectIfVisible).toBeUndefined();
                    expect(model._selections.selected).toBe("/foo/subdir1/afile.js");
                    expect(vm.treeData.getIn(["subdir1", "children", "afile.js", "selected"])).toBe(true);
                    expect(vm.treeData.getIn(["subdir1", "selected"])).toBeUndefined();
                });
                
                it("will load the contents of a closed directory when opened", function () {
                    spyOn(model, "_getDirectoryContents").andReturn(new $.Deferred().resolve([
                        {
                            name: "brackets.js",
                            isFile: true
                        },
                        {
                            name: "src",
                            isFile: false
                        }
                    ]).promise());
                    waitsForDone(model.setDirectoryOpen("/foo/subdir2/", true));
                    runs(function () {
                        expect(model._getDirectoryContents).toHaveBeenCalledWith("/foo/subdir2/");
                        expect(vm.treeData.get("subdir2").toJS()).toEqual({
                            open: true,
                            children: {
                                "brackets.js": {},
                                "src": {
                                    children: null
                                }
                            }
                        });
                    });
                });
            });

            describe("setContext", function () {
                it("should set the context flag on a file", function () {
                    model.setContext("/foo/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "context"])).toBe(true);
                    expect(changesFired).toBe(1);
                });
                
                it("can accept a filesystem object", function () {
                    model.setContext({
                        fullPath: "/foo/afile.js"
                    });
                    expect(model._selections.context).toBe("/foo/afile.js");
                });

                it("should change the context from the old to the new", function () {
                    model.setContext("/foo/afile.js");
                    changesFired = 0;
                    model.setContext("/foo/subdir1/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "context"])).toBe(undefined);
                    expect(vm.treeData.getIn(["subdir1", "children", "afile.js", "context"])).toBe(true);
                    expect(changesFired).toBe(1);
                });

                it("shouldn't fire a changed message if there was no change in context", function () {
                    model.setContext("/foo/afile.js");
                    expect(changesFired).toBe(1);
                    changesFired = 0;
                    model.setContext("/foo/afile.js");
                    expect(changesFired).toBe(0);
                });

                it("can clear the context by passing in null", function () {
                    model.setContext("/foo/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "context"])).toBe(true);
                    changesFired = 0;
                    model.setContext(null);
                    expect(vm.treeData.getIn(["afile.js", "context"])).toBeUndefined();
                    expect(changesFired).toBe(1);
                });
            });

            describe("startRename and friends", function () {
                it("should set the rename flag on a file", function () {
                    var promise = model.startRename("/foo/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "rename"])).toBe(true);
                    expect(vm.treeData.getIn(["afile.js", "context"])).toBe(true);
                    expect(model._selections).toEqual({
                        context: "/foo/afile.js",
                        rename: {
                            deferred: jasmine.any(Object),
                            path: "/foo/afile.js",
                            newName: "afile.js",
                            type: ProjectModel.FILE_RENAMING
                        }
                    });
                    expect(changesFired).toBe(2);
                    expect(promise.then).toEqual(jasmine.any(Function));
                });
                
                it("can take a filesystem object or string", function () {
                    var promise = model.startRename({
                        fullPath: "/foo/afile.js"
                    });
                    expect(vm.treeData.getIn(["afile.js", "rename"])).toBe(true);
                });
                
                it("can set a rename value", function () {
                    model.startRename("/foo/afile.js");
                    model.setRenameValue("bar.js");
                    expect(model._selections.rename.newName).toBe("bar.js");
                });

                it("shouldn't fire a changed message or stop the current rename if there was no change in rename", function () {
                    model.startRename("/foo/afile.js");
                    model.setRenameValue("bar.js");
                    changesFired = 0;
                    model.startRename("/foo/afile.js");
                    expect(changesFired).toBe(0);
                });

                it("can clear the rename by calling cancel rename", function () {
                    var promiseValue;
                    model.startRename("/foo/afile.js").then(function (value) {
                        promiseValue = value;
                    });
                    expect(vm.treeData.getIn(["afile.js", "rename"])).toBe(true);
                    changesFired = 0;
                    model.cancelRename();
                    expect(vm.treeData.getIn(["afile.js", "rename"])).toBeUndefined();
                    expect(model._selections.rename).toBeUndefined();
                    expect(promiseValue).toBe(ProjectModel.RENAME_CANCELLED);
                    expect(changesFired).toBeGreaterThan(0);
                });

                it("clears the rename flag when the context or selection moves", function () {
                    model.startRename("/foo/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "rename"])).toBe(true);
                    model.setSelected("/foo/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "rename"])).toBeUndefined();
                    expect(model._selections.rename).toBeUndefined();
                    model.startRename("/foo/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "rename"])).toBe(true);
                    model.setContext("/foo/subdir1/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "rename"])).toBeUndefined();
                    expect(model._selections.rename).toBeUndefined();
                });

                it("clears the context when rename is cancelled", function () {
                    model.setContext("/foo/afile.js");
                    model.startRename("/foo/afile.js");
                    expect(vm.treeData.getIn(["afile.js", "context"])).toBe(true);
                    model.cancelRename();
                    expect(vm.treeData.getIn(["afile.js", "context"])).toBeUndefined();
                });

                it("does nothing if setRenameValue is called when there's no rename in progress", function () {
                    model.setRenameValue("/foo/bar/baz");
                    expect(model._selections.rename).toBeUndefined();
                });

                it("renames the item immediately in the tree on performRename", function () {
                    spyOn(model, "_renameItem").andReturn(new $.Deferred().resolve().promise());
                    model.startRename("/foo/afile.js");
                    model.setRenameValue("bar.js");
                    model.performRename();
                    expect(vm.treeData.get("afile.js")).toBeUndefined();
                    expect(vm.treeData.get("bar.js")).toBeDefined();
                });

                it("can rename a directory", function () {
                    spyOn(model, "_renameItem").andReturn(new $.Deferred().resolve().promise());
                    model.startRename("/foo/subdir1/");
                    model.setRenameValue("somethingelse");
                    model.performRename();
                    expect(vm.treeData.get("subdir1")).toBeUndefined();
                    expect(vm.treeData.get("somethingelse")).toBeDefined();
                    expect(vm.treeData.getIn(["somethingelse", "open"])).toBe(true);
                    expect(model._renameItem).toHaveBeenCalledWith("/foo/subdir1/", "/foo/somethingelse/");
                });
            });

            describe("Item creation", function () {
                it("should open the directory, and create a new node that is marked for creating", function () {
                    model.setDirectoryOpen("/foo/subdir1/", true);
                    changesFired = 0;
                    var promise = model.startCreating("/foo/subdir1/", "Untitled");
                    expect(promise.then).toBeDefined();
                    expect(vm.treeData.getIn(["subdir1", "open"])).toBe(true);
                    expect(vm.treeData.getIn(["subdir1", "children", "Untitled"])).toBeDefined();
                    expect(vm.treeData.getIn(["subdir1", "children", "Untitled", "rename"])).toBe(true);
                    expect(vm.treeData.getIn(["subdir1", "children", "Untitled", "creating"])).toBe(true);
                    expect(model._selections.rename.type).toBe(ProjectModel.FILE_CREATING);
                    expect(model._selections.rename.newName).toBe("Untitled");
                    expect(changesFired).toBeGreaterThan(0);
                });

                it("should save the item when done creating", function () {
                    spyOn(model, "createAtPath").andReturn(new $.Deferred().resolve().promise());
                    model.startCreating("/foo/subdir1/", "Untitled");
                    expect(model._selections.rename.path).toBe("/foo/subdir1/Untitled");
                    expect(model._selections.rename.newName).toBe("Untitled");
                    changesFired = 0;
                    model.setRenameValue("newfile.js");
                    model.performRename();
                    expect(changesFired).toBeGreaterThan(0);
                    expect(model.createAtPath).toHaveBeenCalledWith("/foo/subdir1/newfile.js");
                    expect(vm.treeData.getIn(["subdir1", "children", "Untitled"])).toBeUndefined();
                    expect(vm.treeData.getIn(["subdir1", "children", "newfile.js"])).toBeDefined();
                    expect(vm.treeData.getIn(["subdir1", "children", "newfile.js", "creating"])).toBeUndefined();
                    expect(vm.treeData.getIn(["subdir1", "children", "newfile.js", "rename"])).toBeUndefined();
                    expect(model._selections.rename).toBeUndefined();
                });

                it("should do nothing if there is no creation in progress when _doneCreating is called", function () {
                    var treeData = vm.treeData;
                    model.performRename();
                    expect(changesFired).toBe(0);
                    expect(vm.treeData).toBe(treeData);
                });

                it("can cancel creation of a new file", function () {
                    model.startCreating("/foo/subdir1/", "Untitled");
                    changesFired = 0;
                    model.cancelRename();
                    expect(changesFired).toBeGreaterThan(0);
                    expect(vm.treeData.getIn(["subdir1", "children", "Untitled"])).toBeUndefined();
                    expect(model._selections.rename).toBeUndefined();
                });

                it("can create files at the root", function () {
                    model.startCreating("/foo/", "Untitled");
                    expect(vm.treeData.getIn(["Untitled", "creating"])).toBe(true);
                });

                it("can create files in a closed directory", function () {
                    spyOn(model, "_getDirectoryContents").andReturn(new $.Deferred().resolve([]).promise());
                    model.startCreating("/foo/subdir2/", "Untitled");
                    expect(model._getDirectoryContents).toHaveBeenCalledWith("/foo/subdir2/");
                    expect(vm.treeData.get("subdir2").toJS()).toEqual({
                        open: true,
                        children: {
                            Untitled: {
                                creating: true,
                                rename: true,
                                context: true
                            }
                        }
                    });
                });
                
                it("can create a directory", function () {
                    spyOn(model, "createAtPath").andReturn(new $.Deferred().resolve().promise());
                    model.startCreating("/foo/subdir1/", "Untitled", true);
                    expect(model._selections.rename.path).toBe("/foo/subdir1/Untitled");
                    expect(model._selections.rename.newName).toBe("Untitled");
                    expect(model._selections.rename.isFolder).toBe(true);
                    changesFired = 0;
                    model.setRenameValue("NewDirectory");
                    model.performRename();
                    expect(changesFired).toBeGreaterThan(0);
                    expect(model.createAtPath).toHaveBeenCalledWith("/foo/subdir1/NewDirectory/");
                    expect(vm.treeData.getIn(["subdir1", "children", "Untitled"])).toBeUndefined();
                    expect(vm.treeData.getIn(["subdir1", "children", "NewDirectory"]).toJS()).toEqual({
                        children: {}
                    });
                    expect(vm.treeData.getIn(["subdir1", "children", "newfile.js", "creating"])).toBeUndefined();
                    expect(vm.treeData.getIn(["subdir1", "children", "newfile.js", "rename"])).toBeUndefined();
                    expect(model._selections.rename).toBeUndefined();
                });
            });
        });
        
        describe("_reopenNodes and _refresh", function () {
            var model,
                vm,
                pathData,
                gdcCalls,
                changesFired,
                nodesByDepth = [
                    [
                        "/foo/subdir1/",
                        "/foo/subdir3/"
                    ],
                    [
                        "/foo/subdir1/subsubdir/"
                    ]
                ];



            beforeEach(function () {
                model = new ProjectModel.ProjectModel();
                vm = model._viewModel;
                model.projectRoot = {
                    fullPath: "/foo/",
                    getContents: function (callback) {
                        return callback(null, [
                            {
                                name: "subdir1",
                                isFile: false
                            },
                            {
                                name: "subdir2",
                                isFile: false
                            },
                            {
                                name: "subdir3",
                                isFile: false
                            }
                        ]);
                    }
                };

                pathData = {
                    "/foo/subdir1/": [
                        {
                            name: "subsubdir",
                            isFile: false
                        }
                    ],
                    "/foo/subdir1/subsubdir/": [
                        {
                            name: "interior.txt",
                            isFile: true
                        }
                    ],
                    "/foo/subdir3/": [
                        {
                            name: "higher.txt",
                            isFile: true
                        }
                    ]
                };

                vm.treeData = Immutable.fromJS({
                    subdir1: {
                        children: null
                    },
                    subdir2: {
                        children: null
                    },
                    subdir3: {
                        children: null
                    }
                });

                changesFired = 0;
                model.on(ProjectModel.EVENT_CHANGE, function () {
                    changesFired++;
                });

                gdcCalls = 0;
                spyOn(model, "_getDirectoryContents").andCallFake(function (path) {
                    gdcCalls++;
                    expect(pathData[path]).toBeDefined();
                    return new $.Deferred().resolve(pathData[path]).promise();
                });
            });

            it("should reopen previously closed nodes", function () {
                waitsForDone(model.reopenNodes(nodesByDepth));
                runs(function () {
                    var subdir1 = vm.treeData.get("subdir1");
                    expect(subdir1.get("open")).toBe(true);
                    expect(subdir1.getIn(["children", "subsubdir", "open"])).toBe(true);
                    expect(vm.treeData.getIn(["subdir3", "open"])).toBe(true);
                });
            });

            it("should refresh the whole tree", function () {
                var oldTree;
                waitsForDone(model.reopenNodes(nodesByDepth));
                runs(function () {
                    model.setSelected("/foo/subdir1/subsubdir/interior.txt");
                    model.setContext("/foo/subdir3/higher.txt");
                    gdcCalls = 0;
                    changesFired = 0;
                    oldTree = vm.treeData;
                    pathData["/foo/subdir1/subsubdir/"] = [
                        {
                            name: "newInterior.txt",
                            isFile: true
                        }
                    ];
                    waitsForDone(model.refresh());
                });
                runs(function () {
                    expect(changesFired).toBe(1);
                    expect(vm.treeData).not.toBe(oldTree);
                    expect(vm.treeData.get("subdir1")).toBeDefined();
                    expect(vm.treeData.getIn(["subdir1", "children", "subsubdir", "children", "newInterior.txt"])).toBeDefined();
                    expect(vm.treeData.getIn(["subdir1", "children", "subsubdir", "children", "interior.txt"])).toBeUndefined();
                    expect(vm.treeData.getIn(["subdir3", "children", "higher.txt", "context"])).toBe(true);
                });
            });
        });

    });
});