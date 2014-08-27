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
/*unittests: FileTreeView*/

define(function (require, exports, module) {
    "use strict";
    
    var FileTreeView      = require("project/FileTreeView"),
        FileTreeViewModel = require("project/FileTreeViewModel"),
        React             = require("thirdparty/react"),
        Immutable         = require("thirdparty/immutable"),
        RTU               = React.addons.TestUtils,
        _                 = require("thirdparty/lodash");

    describe("FileTreeView", function () {
        
        describe("_fileNode", function () {
            it("should create a component with the right information", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map()
                }));
                var a = RTU.findRenderedDOMComponentWithTag(rendered, "a");
                expect(a.props.children[0]).toBe("afile");
                expect(a.props.children[1].props.children).toBe(".js");
            });
            
            it("should render a rename component", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map({
                        rename: true
                    })
                }));
                var input = RTU.findRenderedDOMComponentWithTag(rendered, "input");
                expect(input.props.value).toBe("afile.js");
            });
        });
        
        describe("_sortFormattedDirectory", function () {
            it("should sort alphabetically", function () {
                var formatted = Immutable.fromJS({
                    "README.md": {},
                    "afile.js": {},
                    subdir: {
                        children: null
                    }
                });
                expect(FileTreeView._sortFormattedDirectory(formatted).toJS()).toEqual([
                    "afile.js", "README.md", "subdir"
                ]);
            });

            it("should include the extension in the sort", function () {
                var formatted = Immutable.fromJS({
                    "README.txt": {},
                    "README.md": {},
                    "README": {}
                });
                expect(FileTreeView._sortFormattedDirectory(formatted).toJS()).toEqual([
                    "README", "README.md", "README.txt"
                ]);
            });

            it("can sort by directories first", function () {
                var formatted = Immutable.fromJS({
                    "README.md": {},
                    "afile.js": {},
                    subdir: {
                        children: null
                    }
                });
                expect(FileTreeView._sortFormattedDirectory(formatted, true).toJS()).toEqual([
                    "subdir", "afile.js", "README.md"
                ]);
            });
        });

        var twoLevel = Immutable.fromJS({
            open: true,
            children: {
                subdir: {
                    open: true,
                    children: {
                        "afile.js": {}
                    }
                }
            }
        });

        describe("_directoryNode and _directoryContents", function () {
            it("should format a closed directory", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryNode({
                    name: "thedir",
                    entry: Immutable.fromJS({
                        children: null
                    })
                }));
                var dirLI = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-closed"),
                    dirA = RTU.findRenderedDOMComponentWithTag(dirLI, "a");
                expect(dirA.props.children[1]).toBe("thedir");
            });
            
            it("should allow renaming a closed directory", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryNode({
                    name: "thedir",
                    entry: Immutable.fromJS({
                        children: null,
                        rename: true
                    })
                }));
                var input = RTU.findRenderedDOMComponentWithTag(rendered, "input");
                expect(input.props.value).toBe("thedir");
            });
            
            it("should be able to list files", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryContents({
                    contents: Immutable.fromJS({
                        "afile.js": {}
                    })
                }));
                var fileLI = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-leaf"),
                    fileA = RTU.findRenderedDOMComponentWithTag(fileLI, "a");
                expect(fileA.props.children[0]).toBe("afile");
            });
            
            it("should be able to list closed directories", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryNode({
                    name: "thedir",
                    entry: Immutable.fromJS({
                        open: true,
                        children: {
                            "subdir": {
                                children: null
                            }
                        }
                    })
                }));
                
                var subdirLI = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-closed"),
                    subdirA = RTU.findRenderedDOMComponentWithTag(subdirLI, "a");
                expect(subdirA.props.children[1]).toBe("subdir");
            });
            
            it("should be able to list open subdirectories", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryNode({
                    name: "twoLevel",
                    entry: twoLevel
                }));
                var dirLIs = RTU.scryRenderedDOMComponentsWithClass(rendered, "jstree-open");
                expect(dirLIs.length).toBe(2);
                var subdirLI = dirLIs[1],
                    aTags = RTU.scryRenderedDOMComponentsWithTag(subdirLI, "a");
                expect(aTags.length).toBe(2);
                expect(aTags[0].props.children[1]).toBe("subdir");
                expect(aTags[1].props.children[0]).toBe("afile");
            });
        });
        
        describe("_fileTreeView", function () {
            it("should render the directory", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._fileTreeView({
                    projectRoot: {},
                    treeData: new Immutable.Map({
                        "subdir": twoLevel.getIn(["children", "subdir"])
                    }),
                    sortDirectoriesFirst: false
                })),
                    rootNode = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-no-dots"),
                    aTags = RTU.scryRenderedDOMComponentsWithTag(rootNode, "a");
                expect(aTags.length).toBe(2);
                expect(aTags[0].props.children[1]).toBe("subdir");
                expect(aTags[1].props.children[0]).toBe("afile");
            });
        });
        
        describe("render", function () {
            it("should render into the given element", function () {
                var el = document.createElement("div"),
                    viewModel = new FileTreeViewModel.FileTreeViewModel();
                viewModel.treeData = new Immutable.Map({
                    "subdir": twoLevel.getIn(["children", "subdir"])
                });
                FileTreeView.render(el, viewModel, {
                    fullPath: "/foo/"
                });
                expect($(el).hasClass("jstree")).toBe(true);
                expect($(".jstree-no-dots", el).length).toBe(1);
            });
        });
    });
});