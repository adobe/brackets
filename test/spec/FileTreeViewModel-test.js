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

/*global $, define, brackets, describe, xdescribe, it, xit, beforeEach, expect, setTimeout, waitsForDone, waitsForFail, runs, spyOn */
/*unittests: FileTreeViewModel*/

define(function (require, exports, module) {
    "use strict";
    var FileTreeViewModel = require("project/FileTreeViewModel"),
        _ = require("thirdparty/lodash"),
        Immutable = require("thirdparty/immutable");

    describe("FileTreeViewModel", function () {
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

        describe("_filePathToObjectPath", function () {
            var treeData;
            beforeEach(function () {
                treeData = Immutable.fromJS({
                    "subdir": {
                        open: true,
                        children: {
                            "afile.js": {},
                            "subsubdir": {
                                children: {
                                    "thirdsub": {
                                        children: {}
                                    }
                                }
                            }
                        }
                    },
                    "anothersub": {
                        children: {}
                    },
                    "aclosedsub": {
                        children: null
                    }
                });
            });

            it("should find items at the root", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "subdir/")).toEqual(["subdir"]);
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "anothersub/")).toEqual(["anothersub"]);
            });

            it("can refer to the root", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "")).toEqual([]);
            });

            it("should find nested files", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "subdir/afile.js")).toEqual(["subdir", "children", "afile.js"]);
            });

            it("should find nested directories", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "subdir/subsubdir/thirdsub/")).toEqual(
                    ["subdir", "children", "subsubdir", "children", "thirdsub"]
                );
            });

            it("can return if an a path is visible or not", function () {
                var isFilePathVisible = _.partial(FileTreeViewModel._isFilePathVisible, treeData);
                expect(isFilePathVisible("subdir/afile.js")).toBe(true);
                expect(isFilePathVisible("aclosedsub/hiddenfile.js")).toBe(false);
                expect(isFilePathVisible("DOESNOTEXIST")).toBe(null);
                expect(isFilePathVisible("")).toBe(true);
            });
        });

        describe("setDirectoryOpen", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changesFired;

            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
                vm.treeData = Immutable.fromJS({
                    "subdir": {
                        open: true,
                        children: {
                            "afile.js": {}
                        }
                    },
                    "closedDir": {
                        children: null
                    }
                });
            });

            it("can mark a directory as open", function () {
                expect(vm.setDirectoryOpen("closedDir", true)).toBe(true);
                expect(vm.treeData.getIn(["closedDir", "open"])).toBe(true);
                expect(changesFired).toBe(1);
            });

            it("can unmark an open directory", function () {
                expect(vm.setDirectoryOpen("subdir", false)).toBe(false);
                expect(vm.treeData.getIn(["subdir", "open"])).toBeUndefined();
                expect(changesFired).toBe(1);
            });

            it("won't change a file", function () {
                expect(vm.setDirectoryOpen("subdir/afile.js", true)).toBe(false);
                expect(changesFired).toBe(0);
                expect(vm.treeData.getIn(["subdir", "children", "afile.js", "open"])).toBeUndefined();
            });

            it("doesn't signal a change when there is none", function () {
                expect(vm.setDirectoryOpen("subdir", true)).toBe(false);
                expect(vm.setDirectoryOpen("closedDir", false)).toBe(false);
                expect(changesFired).toBe(0);
            });
        });

        describe("setDirectoryContents", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changesFired;

            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
                vm.treeData = Immutable.Map({
                });
            });

            var sampleData = [
                {
                    name: "afile.js",
                    isFile: true
                }, {
                    name: "subdir",
                    isFile: false
                }
            ];

            it("can set the root contents", function () {
                vm.setDirectoryContents("", sampleData);
                expect(vm.treeData.toJS()).toEqual({
                    "afile.js": {},
                    "subdir": {
                        children: null
                    }
                });
                expect(changesFired).toBe(1);
            });

            it("can replace the root contents without replacing subdirectories", function () {
                vm.setDirectoryContents("", sampleData);
                vm.setDirectoryContents("subdir", sampleData);
                vm.setDirectoryContents("", sampleData);
                expect(vm.treeData.toJS()).toEqual({
                    "afile.js": {},
                    "subdir": {
                        children: {
                            "afile.js": {},
                            subdir: {
                                children: null
                            }
                        }
                    }
                });
            });

            it("doesn't fire a change message with no change", function () {
                vm.setDirectoryContents("", sampleData);
                changesFired = 0;
                vm.setDirectoryContents("", sampleData);
                expect(changesFired).toBe(0);
            });

            it("can set a subdirectory's contents", function () {
                vm.setDirectoryContents("", sampleData);
                changesFired = 0;
                vm.setDirectoryContents("subdir", sampleData);
                expect(changesFired).toBe(1);
                expect(vm.treeData.toJS()).toEqual({
                    "afile.js": {},
                    subdir: {
                        children: {
                            "afile.js": {},
                            subdir: {
                                children: null
                            }
                        }
                    }
                });
            });

            it("does nothing if you point to a file", function () {
                vm.setDirectoryContents("", sampleData);
                var firstTreeData = vm.treeData;
                vm.setDirectoryContents("afile.js", sampleData);
                expect(vm.treeData).toBe(firstTreeData);
            });

            it("will remove a file or subdirectory that has gone away", function () {
                vm.setDirectoryContents("", sampleData);
                changesFired = 0;
                vm.setDirectoryContents("", []);
                expect(vm.treeData.toJS()).toEqual({});
                expect(changesFired).toBe(1);
            });

            it("can save directory contents before it gets intermediate directories", function () {
                vm.setDirectoryContents("foo/bar", sampleData);
                expect(vm.treeData.toJS()).toEqual({
                    foo: {
                        notFullyLoaded: true,
                        children: {
                            bar: {
                                children: {
                                    "afile.js": {},
                                    subdir: {
                                        children: null
                                    }
                                }
                            }
                        }
                    }
                });
            });

            it("will mark a directory loaded once its contents have been set", function () {
                vm.setDirectoryContents("foo/subdir", sampleData);
                var subdirObject = vm.treeData.getIn(["foo", "children", "subdir"]);
                expect(vm.treeData.getIn(["foo", "notFullyLoaded"])).toBe(true);

                vm.setDirectoryContents("foo", sampleData);

                expect(vm.treeData.toJS()).toEqual({
                    foo: {
                        children: {
                            "afile.js": {},
                            "subdir": {
                                children: {
                                    "afile.js": {},
                                    subdir: {
                                        children: null
                                    }
                                }
                            }
                        }
                    }
                });
                expect(vm.treeData.getIn(["foo", "children", "subdir"])).toBe(subdirObject);
            });
        });

        describe("renameItem", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changeFired;
            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changeFired = true;
            });

            beforeEach(function () {
                changeFired = false;
                vm.treeData = Immutable.fromJS({
                    "subdir": {
                        open: true,
                        children: {
                            subsubdir: {
                                children: null
                            },
                            "childfile.js": {}
                        }
                    },
                    "topfile.js": {}
                });
            });

            it("should be able to change the name of a top level file", function () {
                vm.renameItem("topfile.js", "newname.js");
                expect(vm.treeData.get("topfile.js")).toBeUndefined();
                expect(vm.treeData.get("newname.js")).toBeDefined();
                expect(changeFired).toBe(true);
            });

            it("should be able to change the name of a top level directory", function () {
                var originalDirectory = vm.treeData.get("subdir");
                vm.renameItem("subdir/", "myNewSubDir");
                expect(vm.treeData.get("subdir")).toBeUndefined();
                expect(vm.treeData.get("myNewSubDir")).toBe(originalDirectory);
                expect(changeFired).toBe(true);
            });

            it("should be able to change the name of a file in a subdirectory", function () {
                vm.renameItem("subdir/childfile.js", "newname.js");
                expect(vm.treeData.getIn(["subdir", "children", "childfile.js"])).toBeUndefined();
                expect(vm.treeData.getIn(["subdir", "children", "newname.js"])).toBeDefined();
                expect(changeFired).toBe(true);
            });

            it("should be able to change the name of a directory in a subdirectory", function () {
                vm.renameItem("subdir/subsubdir", "newsubdir");
                expect(vm.treeData.getIn(["subdir", "children", "subsubdir"])).toBeUndefined();
                expect(vm.treeData.getIn(["subdir", "children", "newsubdir"])).toBeDefined();
                expect(changeFired).toBe(true);
            });
        });

        describe("openPath", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changesFired;

            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
                vm.treeData = Immutable.fromJS({
                    "subdir": {
                        children: {
                            "subsubdir": {
                                children: {
                                    "afile.js": {}
                                }
                            }
                        }
                    }
                });
            });

            it("should open a top level directory", function () {
                vm.openPath("subdir/");
                expect(vm.treeData.getIn(["subdir", "open"])).toBe(true);
                expect(changesFired).toBe(1);
            });

            it("should open all of the directories leading up to a file", function () {
                vm.openPath("subdir/subsubdir/afile.js");
                expect(vm.treeData.getIn(["subdir", "open"])).toBe(true);
                expect(vm.treeData.getIn(["subdir", "children", "open"])).toBeUndefined();
                expect(vm.treeData.getIn(["subdir", "children", "subsubdir", "open"])).toBe(true);
                expect(vm.treeData.getIn(["subdir", "children", "subsubdir", "children", "open"])).toBeUndefined();
                expect(vm.treeData.getIn(["subdir", "children", "subsubdir", "children", "afile.js", "open"])).toBeUndefined();
                expect(changesFired).toBe(1);
            });

            it("should not make any change if the path is already open", function () {
                vm.setDirectoryOpen("subdir/", true);
                changesFired = 0;
                var currentTreeData = vm.treeData;
                vm.openPath("subdir/");
                expect(changesFired).toBe(0);
                expect(vm.treeData).toBe(currentTreeData);
            });

            it("should do nothing for a non-existent path", function () {
                vm.openPath("nope/");
                expect(changesFired).toBe(0);
            });
        });

        describe("getOpenNodes", function () {
            var vm;

            beforeEach(function () {
                vm = new FileTreeViewModel.FileTreeViewModel();
            });

            it("should return an empty list when there are no open nodes", function () {
                vm.treeData = Immutable.fromJS({
                    file: {},
                    subdir: {
                        children: null
                    }
                });
                expect(vm.getOpenNodes("/foo/bar/")).toEqual([]);
            });

            it("should return open directories grouped by level", function () {
                vm.treeData = Immutable.fromJS({
                    subdir1: {
                        open: true,
                        children: {
                            subsubdir: {
                                children: {},
                                open: true
                            }
                        }
                    },
                    subdir2: {
                        children: null
                    },
                    subdir3: {
                        open: true,
                        children: {}
                    }
                });
                expect(vm.getOpenNodes("/foo/bar/")).toEqual([
                    [
                        "/foo/bar/subdir1/",
                        "/foo/bar/subdir3/"
                    ],
                    [
                        "/foo/bar/subdir1/subsubdir/"
                    ]
                ]);
            });
        });


        describe("moveMarker", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changesFired;

            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
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
            });

            it("should add a marker", function () {
                vm.moveMarker("selected", null, "subdir1");
                expect(vm.treeData.getIn(["subdir1", "selected"])).toBe(true);
                expect(changesFired).toBe(1);
            });

            it("should move a marker from one place to another", function () {
                vm.moveMarker("context", null, "subdir1");
                vm.moveMarker("context", "subdir1", "subdir1/afile.js");
                expect(changesFired).toBe(2);
                expect(vm.treeData.getIn(["subdir1", "context"])).toBeUndefined();
                expect(vm.treeData.getIn(["subdir1", "children", "afile.js", "context"])).toBe(true);
            });

            it("should not have an error for an unknown location", function () {
                vm.moveMarker("selected", null, "huh?");
                expect(changesFired).toBe(0);
            });
        });
        
        describe("createPlaceholder", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changesFired;

            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
                vm.treeData = Immutable.fromJS({
                    subdir1: {
                        children: {
                        }
                    }
                });
            });
            
            it("can create a file placeholder", function () {
                vm.createPlaceholder("", "afile.js");
                expect(vm.treeData.get("afile.js").toJS()).toEqual({
                    creating: true
                });
            });
            
            it("can create a placeholder in a subdirectory", function () {
                vm.createPlaceholder("subdir1", "Untitled");
                expect(vm.treeData.getIn(["subdir1", "children", "Untitled"]).toJS()).toEqual({
                    creating: true
                });
                expect(vm.treeData.getIn(["subdir1", "open"])).toBe(true);
            });
            
            it("can create a folder", function () {
                vm.createPlaceholder("", "Untitled", true);
                expect(vm.treeData.get("Untitled").toJS()).toEqual({
                    creating: true,
                    children: {}
                });
            });
        });
        
        describe("processChanges", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                originalTreeData,
                changesFired;
            
            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });
            
            beforeEach(function () {
                changesFired = 0;
                vm.treeData = Immutable.fromJS({
                    "topfile.js": {},
                    subdir: {
                        open: true,
                        children: {
                            innerdir: {
                                children: {
                                    "deepfile.js": {}
                                }
                            },
                            "subchild.js": {}
                        }
                    }
                });
                originalTreeData = vm.treeData;
            });
            
            it("should update an entry when a file changes", function () {
                vm.processChanges({
                    changed: [
                        "topfile.js"
                    ]
                });
                expect(changesFired).toBe(1);
                expect(vm.treeData).not.toBe(originalTreeData);
                expect(vm.treeData.getIn(["topfile.js", "_timestamp"])).toBeGreaterThan(0);
            });
            
            it("can update multiple file entries", function () {
                vm.processChanges({
                    changed: [
                        "topfile.js",
                        "subdir/subchild.js"
                    ]
                });
                expect(changesFired).toBe(1);
                expect(vm.treeData.getIn(["topfile.js", "_timestamp"])).toBeGreaterThan(0);
                expect(vm.treeData.getIn(["subdir", "children", "subchild.js", "_timestamp"])).toBeGreaterThan(0);
            });
            
            it("should add an entry when there's a new entry", function () {
                vm.processChanges({
                    added: [
                        "newfile.js",
                        "subdir/innerdir/anotherdeepone.js"
                    ]
                });
                expect(changesFired).toBe(1);
                expect(vm.treeData).not.toBe(originalTreeData);
                expect(vm.treeData.get("newfile.js").toJS()).toEqual({});
                expect(vm.treeData.getIn(["subdir", "children", "innerdir", "children", "anotherdeepone.js"]).toJS()).toEqual({});
            });
            
            it("should add new directories as well", function () {
                vm.processChanges({
                    added: [
                        "topdir/",
                        "subdir/anotherdir/"
                    ]
                });
                
                expect(changesFired).toBe(1);
                expect(vm.treeData).not.toBe(originalTreeData);
                expect(vm.treeData.getIn(["topdir", "children"]).toJS()).toEqual({});
                expect(vm.treeData.getIn(["subdir", "children", "anotherdir", "children"]).toJS()).toEqual({});
            });
            
            it("should remove an entry that's been deleted", function () {
                vm.processChanges({
                    removed: [
                        "subdir/subchild.js",
                        "topfile.js"
                    ]
                });
                expect(changesFired).toBe(1);
                expect(vm.treeData).not.toBe(originalTreeData);
                expect(vm.treeData.get("topfile.js")).toBeUndefined();
            });
        });
    });
});