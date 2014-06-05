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

/*global $, define, brackets, describe, it, xit, expect, setTimeout, waitsForDone, runs */
/*unittests: FileTreeView*/

define(function (require, exports, module) {
    "use strict";
    
    var FileTreeView = require("project/FileTreeView"),
        React = require("thirdparty/React"),
        RTU = React.addons.TestUtils;

    describe("FileTreeView", function () {
        describe("ViewModel", function () {
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
            
            describe("_formatDirectoryContents", function () {
                it("should convert file and directory objects for display", function () {
                    var result = FileTreeView._formatDirectoryContents(contents);
                    expect(result).toEqual([
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "afile",
                            extension: ".js"
                        },
                        {
                            name: "subdir",
                            children: null,
                            directory: subdir
                        }
                    ]);
                });
                
                it("should treat dotfiles as filenames and not extensions", function () {
                    var result = FileTreeView._formatDirectoryContents([
                        {
                            fullPath: "/path/to/.dotfile",
                            name: ".dotfile",
                            isFile: true
                        }
                    ]);
                    expect(result).toEqual([
                        {
                            name: ".dotfile",
                            extension: ""
                        }
                    ]);
                });
            });
            
            describe("_sortFormattedDirectory", function () {
                it("should sort alphabetically", function () {
                    var formatted = [
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "afile",
                            extension: ".js"
                        },
                        {
                            name: "subdir",
                            children: null,
                            directory: subdir
                        }
                    ];
                    expect(FileTreeView._sortFormattedDirectory(formatted)).toEqual([
                        {
                            name: "afile",
                            extension: ".js"
                        },
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "subdir",
                            children: null,
                            directory: subdir
                        }
                    ]);
                });
                
                it("should include the extension in the sort", function () {
                    var formatted = [
                        {
                            name: "README",
                            extension: ".txt"
                        },
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "README",
                            extension: ""
                        }
                    ];
                    expect(FileTreeView._sortFormattedDirectory(formatted)).toEqual([
                        {
                            name: "README",
                            extension: ""
                        },
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "README",
                            extension: ".txt"
                        }
                    ]);
                });
                
                it("can sort by directories first", function () {
                    var formatted = [
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "afile",
                            extension: ".js"
                        },
                        {
                            name: "subdir",
                            children: null,
                            directory: subdir
                        }
                    ];
                    expect(FileTreeView._sortFormattedDirectory(formatted, true)).toEqual([
                        {
                            name: "subdir",
                            children: null,
                            directory: subdir
                        },
                        {
                            name: "afile",
                            extension: ".js"
                        },
                        {
                            name: "README",
                            extension: ".md"
                        }
                    ]);
                });
            });
            
            describe("updateContents", function () {
                var root = {
                    fullPath: "/path/to/project/",
                    getContents: function (callback) {
                        setTimeout(function () {
                            callback(null, contents);
                        }, 10);
                    }
                };
                
                it("should create a formatted, sorted list of objects", function () {
                    var vm = new FileTreeView.ViewModel();
                    
                    var receivedChange = false;
                    vm.on(FileTreeView.CHANGE, function () {
                        receivedChange = true;
                    });
                    
                    waitsForDone(vm.setProjectRoot(root));
                    
                    runs(function () {
                        expect(vm.treeData).toEqual([
                            {
                                name: "afile",
                                extension: ".js"
                            },
                            {
                                name: "README",
                                extension: ".md"
                            },
                            {
                                name: "subdir",
                                children: null,
                                directory: subdir
                            }
                        ]);
                        expect(receivedChange).toBe(true);
                    });
                });
                
                it("should reset the treeData if the project root changes", function () {
                    var vm = new FileTreeView.ViewModel();
                    waitsForDone(vm.setProjectRoot(root));
                    waitsForDone(vm.setProjectRoot(root));
                    runs(function () {
                        expect(vm.treeData.length).toBe(3);
                    });
                });
            });
        });
        
        describe("_fileNode", function () {
            it("should create a component with the right information", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                    entry: {
                        name: "afile",
                        extension: ".js"
                    }
                }));
                var a = RTU.findRenderedDOMComponentWithTag(rendered, "a");
                expect(a.props.children[0]).toBe("afile");
                expect(a.props.children[1].props.children).toBe(".js");
            });
        });
        
        var twoLevel = {
            name: "thedir",
            children: [
                {
                    name: "subdir",
                    children: [
                        {
                            name: "afile",
                            extension: ".js"
                        }
                    ]
                }
            ]
        };
        
        describe("_directoryNode and _directoryContents", function () {
            it("should format a closed directory", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryNode({
                    entry: {
                        name: "thedir",
                        children: null
                    }
                }));
                var dirLI = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-closed"),
                    dirA = RTU.findRenderedDOMComponentWithTag(dirLI, "a");
                expect(dirA.props.children[1]).toBe("thedir");
            });
            
            it("should be able to list files", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryContents({
                    contents: [
                        {
                            name: "afile",
                            extension: ".js"
                        }
                    ]
                }));
                var fileLI = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-leaf"),
                    fileA = RTU.findRenderedDOMComponentWithTag(fileLI, "a");
                expect(fileA.props.children[0]).toBe("afile");
            });
            
            it("should be able to list closed directories", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryNode({
                    entry: {
                        name: "thedir",
                        children: [
                            {
                                name: "subdir",
                                children: null
                            }
                        ]
                    }
                }));
                
                var subdirLI = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-closed"),
                    subdirA = RTU.findRenderedDOMComponentWithTag(subdirLI, "a");
                expect(subdirA.props.children[1]).toBe("subdir");
            });
            
            it("should be able to list open subdirectories", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryNode({
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
                    viewModel: {
                        projectRoot: {},
                        treeData: twoLevel.children
                    }
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
                    viewModel = new FileTreeView.ViewModel();
                viewModel.treeData = twoLevel.children;
                viewModel.projectRoot = {};
                FileTreeView.render(el, viewModel);
                expect($(el).hasClass("jstree")).toBe(true);
                expect($(".jstree-no-dots", el).length).toBe(1);
            });
        });
    });
});