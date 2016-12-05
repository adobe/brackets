/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, beforeEach, expect */
/*unittests: FileTreeViewModel*/

define(function (require, exports, module) {
    "use strict";
    var FileTreeViewModel = require("project/FileTreeViewModel"),
        _ = require("thirdparty/lodash"),
        Immutable = require("thirdparty/immutable");

    describe("FileTreeViewModel", function () {
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

            it("returns undefined for a file in a path that mistakenly includes a file", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "subdir/afile.js/nofile.js")).toBeNull();
            });

            it("can return if an a path is visible or not", function () {
                var isFilePathVisible = _.partial(FileTreeViewModel._isFilePathVisible, treeData);
                expect(isFilePathVisible("subdir/afile.js")).toBe(true);
                expect(isFilePathVisible("aclosedsub/hiddenfile.js")).toBe(false);
                expect(isFilePathVisible("DOESNOTEXIST")).toBe(null);
                expect(isFilePathVisible("")).toBe(true);
            });

            it("can return whether a given path is loaded (in the tree)", function () {
                var vm = new FileTreeViewModel.FileTreeViewModel();
                vm._treeData = treeData;
                expect(vm.isPathLoaded("subdir/afile.js")).toBe(true);
                expect(vm.isPathLoaded("anothersub/")).toBe(true);
                expect(vm.isPathLoaded("aclosedsub/")).toBe(false);
            });

            it("can return whether a given path is loaded even when directories and files are added", function () {
                var vm = new FileTreeViewModel.FileTreeViewModel();
                vm._treeData = treeData;
                vm.setDirectoryContents("aclosedsub/newdir/", [
                    {
                        name: "newfile",
                        isFile: true
                    }
                ]);
                expect(vm.isPathLoaded("aclosedsub/")).toBe(false);
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
                vm._treeData = Immutable.fromJS({
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
                expect(vm._treeData.getIn(["closedDir", "open"])).toBe(true);
                expect(changesFired).toBe(1);
            });

            it("can unmark an open directory", function () {
                expect(vm.setDirectoryOpen("subdir", false)).toBe(false);
                expect(vm._treeData.getIn(["subdir", "open"])).toBeUndefined();
                expect(changesFired).toBe(1);
            });

            it("won't change a file", function () {
                expect(vm.setDirectoryOpen("subdir/afile.js", true)).toBe(false);
                expect(changesFired).toBe(0);
                expect(vm._treeData.getIn(["subdir", "children", "afile.js", "open"])).toBeUndefined();
            });

            it("doesn't signal a change when there is none", function () {
                expect(vm.setDirectoryOpen("subdir", true)).toBe(false);
                expect(vm.setDirectoryOpen("closedDir", false)).toBe(false);
                expect(changesFired).toBe(0);
            });
        });

        describe("closeSubtree", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changesFired;

            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
                vm._treeData = Immutable.fromJS({
                    "subdir": {
                        open: true,
                        children: {
                            "afile.js": {},
                            "subsubdir": {
                                open: true,
                                children: {
                                    "evensubbersubdir": {
                                        open: true,
                                        children: {
                                            waydownhere: {
                                                children: null
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            });

            it("closes the top dir and its children without clearing the children", function () {
                vm.closeSubtree("subdir/");
                expect(changesFired).toBe(1);
                expect(vm._getObject("subdir/subsubdir/evensubbersubdir/").get("open")).toBeUndefined();
                expect(vm._getObject("subdir/subsubdir/").get("open")).toBeUndefined();
                expect(vm._getObject("subdir/").get("open")).toBeUndefined();
            });

            it("doesn't fail on an unknown path", function () {
                vm.closeSubtree("foo");
            });

            it("will close a directory that's already hidden", function () {
                vm.setDirectoryOpen("subdir/subsubdir/", false);
                expect(vm._getObject("subdir/subsubdir/evensubbersubdir/").get("open")).toBe(true);
                vm.closeSubtree("subdir/");
                expect(vm._getObject("subdir/subsubdir/evensubbersubdir/").get("open")).toBeUndefined();
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
                vm._treeData = Immutable.Map({
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
                expect(vm._treeData.toJS()).toEqual({
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
                expect(vm._treeData.toJS()).toEqual({
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
                expect(vm._treeData.toJS()).toEqual({
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
                var firstTreeData = vm._treeData;
                vm.setDirectoryContents("afile.js", sampleData);
                expect(vm._treeData).toBe(firstTreeData);
            });

            it("will remove a file or subdirectory that has gone away", function () {
                vm.setDirectoryContents("", sampleData);
                changesFired = 0;
                vm.setDirectoryContents("", []);
                expect(vm._treeData.toJS()).toEqual({});
                expect(changesFired).toBe(1);
            });

            it("can save directory contents before it gets intermediate directories", function () {
                vm.setDirectoryContents("foo/bar", sampleData);
                expect(vm._treeData.toJS()).toEqual({
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
                var subdirObject = vm._treeData.getIn(["foo", "children", "subdir"]);
                expect(vm._treeData.getIn(["foo", "notFullyLoaded"])).toBe(true);

                vm.setDirectoryContents("foo", sampleData);

                expect(vm._treeData.toJS()).toEqual({
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
                expect(vm._treeData.getIn(["foo", "children", "subdir"])).toBe(subdirObject);
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
                vm._treeData = Immutable.fromJS({
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
                expect(vm._treeData.get("topfile.js")).toBeUndefined();
                expect(vm._treeData.get("newname.js")).toBeDefined();
                expect(changeFired).toBe(true);
            });

            it("should be able to change the name of a top level directory", function () {
                var originalDirectory = vm._treeData.get("subdir");
                vm.renameItem("subdir/", "myNewSubDir");
                expect(vm._treeData.get("subdir")).toBeUndefined();
                expect(vm._treeData.get("myNewSubDir")).toBe(originalDirectory);
                expect(changeFired).toBe(true);
            });

            it("should be able to change the name of a file in a subdirectory", function () {
                vm.renameItem("subdir/childfile.js", "newname.js");
                expect(vm._treeData.getIn(["subdir", "children", "childfile.js"])).toBeUndefined();
                expect(vm._treeData.getIn(["subdir", "children", "newname.js"])).toBeDefined();
                expect(changeFired).toBe(true);
            });

            it("should be able to change the name of a directory in a subdirectory", function () {
                vm.renameItem("subdir/subsubdir", "newsubdir");
                expect(vm._treeData.getIn(["subdir", "children", "subsubdir"])).toBeUndefined();
                expect(vm._treeData.getIn(["subdir", "children", "newsubdir"])).toBeDefined();
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
                vm._treeData = Immutable.fromJS({
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
                expect(vm._treeData.getIn(["subdir", "open"])).toBe(true);
                expect(changesFired).toBe(1);
            });

            it("should open all of the directories leading up to a file", function () {
                vm.openPath("subdir/subsubdir/afile.js");
                expect(vm._treeData.getIn(["subdir", "open"])).toBe(true);
                expect(vm._treeData.getIn(["subdir", "children", "open"])).toBeUndefined();
                expect(vm._treeData.getIn(["subdir", "children", "subsubdir", "open"])).toBe(true);
                expect(vm._treeData.getIn(["subdir", "children", "subsubdir", "children", "open"])).toBeUndefined();
                expect(vm._treeData.getIn(["subdir", "children", "subsubdir", "children", "afile.js", "open"])).toBeUndefined();
                expect(changesFired).toBe(1);
            });

            it("should not make any change if the path is already open", function () {
                vm.setDirectoryOpen("subdir/", true);
                changesFired = 0;
                var currentTreeData = vm._treeData;
                vm.openPath("subdir/");
                expect(changesFired).toBe(0);
                expect(vm._treeData).toBe(currentTreeData);
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
                vm._treeData = Immutable.fromJS({
                    file: {},
                    subdir: {
                        children: null
                    }
                });
                expect(vm.getOpenNodes("/foo/bar/")).toEqual([]);
            });

            it("should return open directories grouped by level", function () {
                vm._treeData = Immutable.fromJS({
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

            it("should not return an open child node of a closed parent", function () {
                vm._treeData = Immutable.fromJS({
                    subdir1: {
                        children: {
                            subsubdir: {
                                children: {},
                                open: true
                            }
                        }
                    }
                });
                expect(vm.getOpenNodes("/foo/bar/")).toEqual([]);
            });
        });


        describe("getChildNodes", function () {
            var vm;

            beforeEach(function () {
                vm = new FileTreeViewModel.FileTreeViewModel();
            });

            it("should return an empty list when there are no child nodes", function () {
                vm._treeData = Immutable.fromJS({
                    file: {},
                    subdir: {
                    }
                });
                expect(vm.getChildDirectories("/foo/bar/")).toEqual([]);
            });

            it("should return all child directories", function () {
                vm._treeData = Immutable.fromJS({
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
                        children: {}
                    },
                    subdir3: {
                        open: true,
                        children: null
                    },
                    subdir4: {
                        open: true,
                        children: {}
                    },
                    filea: {},
                    fileb: {}
                });

                expect(vm.getChildDirectories("")).toEqual([
                    "subdir1/",
                    "subdir2/",
                    "subdir3/",
                    "subdir4/"
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
                vm._treeData = Immutable.fromJS({
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
                expect(vm._treeData.getIn(["subdir1", "selected"])).toBe(true);
                expect(changesFired).toBe(1);
            });

            it("should move a marker from one place to another", function () {
                vm.moveMarker("context", null, "subdir1");
                vm.moveMarker("context", "subdir1", "subdir1/afile.js");
                expect(changesFired).toBe(2);
                expect(vm._treeData.getIn(["subdir1", "context"])).toBeUndefined();
                expect(vm._treeData.getIn(["subdir1", "children", "afile.js", "context"])).toBe(true);
            });

            it("should not have an error for an unknown location", function () {
                vm.moveMarker("selected", null, "huh?");
                expect(changesFired).toBe(0);
            });

            it("should not put a marker on the root", function () {
                vm.moveMarker("selected", null, "");
                expect(vm._treeData.get("selected")).toBeUndefined();
            });

            it("should do nothing if the marker is moving to the same location", function () {
                vm.moveMarker("selected", null, "subdir1/afile.js");
                changesFired = 0;
                var originalTreeData = vm._treeData;
                vm.moveMarker("selected", "subdir1/afile.js", "subdir1/afile.js");
                expect(changesFired).toBe(0);
                expect(vm._treeData).toBe(originalTreeData);
            });

            it("should make sure that the marker is actually present at the new location", function () {
                vm.moveMarker("selected", "subdir1/afile.js", "subdir1/afile.js");
                expect(changesFired).toBe(1);
                expect(vm._treeData.getIn(["subdir1", "children", "afile.js", "selected"])).toBe(true);
            });

            it("should update selectionViewInfo for selections", function () {
                vm.moveMarker("selected", null, "subdir1/afile.js");
                expect(vm._selectionViewInfo.get("hasSelection")).toBe(true);
                vm.moveMarker("selected", "subdir1/afile.js", null);
                expect(vm._selectionViewInfo.get("hasSelection")).toBe(false);
            });

            it("should update selectionViewInfo for context", function () {
                vm.moveMarker("context", null, "subdir1/afile.js");
                expect(vm._selectionViewInfo.get("hasContext")).toBe(true);
                vm.moveMarker("context", "subdir1/afile.js", null);
                expect(vm._selectionViewInfo.get("hasContext")).toBe(false);
            });

            it("should signal a change when just selectionViewInfo changes", function () {
                vm.moveMarker("context", null, "subdir1/afile.js");
                vm.deleteAtPath("subdir1/afile.js");
                changesFired = 0;
                vm.moveMarker("context", "subdir1/afile.js", null);
                expect(vm._selectionViewInfo.get("hasContext")).toBe(false);
                expect(changesFired).toBe(1);
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
                vm._treeData = Immutable.fromJS({
                    subdir1: {
                        children: {
                        }
                    }
                });
            });

            it("can create a file placeholder", function () {
                vm.createPlaceholder("", "afile.js");
                expect(vm._treeData.get("afile.js").toJS()).toEqual({
                    creating: true
                });
            });

            it("can create a placeholder in a subdirectory", function () {
                vm.createPlaceholder("subdir1", "Untitled");
                expect(vm._treeData.getIn(["subdir1", "children", "Untitled"]).toJS()).toEqual({
                    creating: true
                });
                expect(vm._treeData.getIn(["subdir1", "open"])).toBe(true);
            });

            it("can create a folder", function () {
                vm.createPlaceholder("", "Untitled", true);
                expect(vm._treeData.get("Untitled").toJS()).toEqual({
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
                vm._treeData = Immutable.fromJS({
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
                originalTreeData = vm._treeData;
            });

            it("should update an entry when a file changes", function () {
                vm.processChanges({
                    changed: [
                        "topfile.js"
                    ]
                });
                expect(changesFired).toBe(1);
                expect(vm._treeData).not.toBe(originalTreeData);
                expect(vm._treeData.getIn(["topfile.js", "_timestamp"])).toBeGreaterThan(0);
            });

            it("can update multiple file entries", function () {
                vm.processChanges({
                    changed: [
                        "topfile.js",
                        "subdir/subchild.js"
                    ]
                });
                expect(changesFired).toBe(1);
                expect(vm._treeData.getIn(["topfile.js", "_timestamp"])).toBeGreaterThan(0);
                expect(vm._treeData.getIn(["subdir", "children", "subchild.js", "_timestamp"])).toBeGreaterThan(0);
            });

            it("should add an entry when there's a new entry", function () {
                vm.processChanges({
                    added: [
                        "newfile.js",
                        "subdir/innerdir/anotherdeepone.js"
                    ]
                });
                expect(changesFired).toBe(1);
                expect(vm._treeData).not.toBe(originalTreeData);
                expect(vm._treeData.get("newfile.js").toJS()).toEqual({});
                expect(vm._treeData.getIn(["subdir", "children", "innerdir", "children", "anotherdeepone.js"]).toJS()).toEqual({});
            });

            it("should add new directories as well", function () {
                vm.processChanges({
                    added: [
                        "topdir/",
                        "subdir/anotherdir/"
                    ]
                });

                expect(changesFired).toBe(1);
                expect(vm._treeData).not.toBe(originalTreeData);
                expect(vm._treeData.getIn(["topdir", "children"])).toEqual(null);
                expect(vm._treeData.getIn(["subdir", "children", "anotherdir", "children"])).toEqual(null);
            });

            it("should remove an entry that's been deleted", function () {
                vm.processChanges({
                    removed: [
                        "subdir/subchild.js",
                        "topfile.js"
                    ]
                });
                expect(changesFired).toBe(1);
                expect(vm._treeData).not.toBe(originalTreeData);
                expect(vm._treeData.get("topfile.js")).toBeUndefined();
            });

            it("shouldn't make changes for a new file in a directory that hasn't been loaded", function () {
                vm._treeData = vm._treeData.set("unloaded", Immutable.Map({
                    children: null
                }));
                vm.processChanges({
                    added: [
                        "unloaded/file.txt"
                    ]
                });
                expect(changesFired).toBe(0);
                expect(vm._treeData.get("unloaded").toJS()).toEqual({
                    children: null
                });
            });
        });

        describe("ensureDirectoryExists", function () {
            var vm,
                changesFired;

            beforeEach(function () {
                vm = new FileTreeViewModel.FileTreeViewModel();
                vm._treeData = Immutable.fromJS({
                    subdir: {
                        children: null
                    }
                });
                changesFired = 0;

                vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                    changesFired++;
                });
            });

            it("should do nothing for a directory that already exists", function () {
                vm.ensureDirectoryExists("subdir/");
                expect(changesFired).toBe(0);
            });

            it("should create a top-level directory", function () {
                vm.ensureDirectoryExists("newdir/");
                expect(changesFired).toBe(1);
                expect(vm._treeData.get("newdir").toJS()).toEqual({
                    children: null
                });
            });

            it("should do nothing within a subdirectory that doesn't exist", function () {
                vm.ensureDirectoryExists("newdir/bar/");
                expect(changesFired).toBe(0);
                expect(vm._treeData.get("newdir")).toBeUndefined();
            });

            it("should create a directory within a directory", function () {
                vm._treeData = Immutable.fromJS({
                    subdir: {
                        children: {}
                    }
                });
                vm.ensureDirectoryExists("subdir/newdir/");
                expect(changesFired).toBe(1);
                expect(vm._getObject("subdir/newdir/").toJS()).toEqual({
                    children: null
                });
            });

            it("should do nothing in a directory that is not loaded", function () {
                vm.ensureDirectoryExists("subdir/newdir/");
                expect(changesFired).toBe(0);
                expect(vm._getObject("subdir/newdir/")).toBeNull();
            });
        });
    });
});
