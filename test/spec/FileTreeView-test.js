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

/*global $, define, describe, it, expect, jasmine */
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
                expect(a.props.children[1]).toBe("afile");
                expect(a.props.children[2].props.children).toBe(".js");
                
                var ins = a.props.children[0];
                expect(ins.props.children[0]).toBe(" ");
            });
            
            it("should call icon extensions to replace the default icon", function () {
                var extensionCalls = 0,
                    rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                        name: "afile.js",
                        entry: Immutable.Map(),
                        parentPath: "/foo/",
                        extensions: Immutable.fromJS({
                            icons: [function (data) {
                                extensionCalls++;
                                expect(data.name).toBe("afile.js");
                                expect(data.isFile).toBe(true);
                                expect(data.fullPath).toBe("/foo/afile.js");
                                return React.DOM.ins({}, "ICON");
                            }]
                        })
                    }));
                
                expect(extensionCalls).toBe(1);
                
                var a = RTU.findRenderedDOMComponentWithTag(rendered, "a");
                expect(a.props.children[1]).toBe("afile");
                expect(a.props.children[2].props.children).toBe(".js");

                var ins = a.props.children[0];
                expect(ins.props.children).toBe("ICON");
            });
            
            it("should allow icon extensions to return a string for the icon", function () {
                var extensionCalls = 0,
                    rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                        name: "afile.js",
                        entry: Immutable.Map(),
                        parentPath: "/foo/",
                        extensions: Immutable.fromJS({
                            icons: [function (data) {
                                extensionCalls++;
                                return "<ins>ICON</ins>";
                            }]
                        })
                    }));

                expect(extensionCalls).toBe(1);

                var a = RTU.findRenderedDOMComponentWithTag(rendered, "a");
                expect(a.props.children[1]).toBe("afile");
                expect(a.props.children[2].props.children).toBe(".js");
                
                var $a = $(a.getDOMNode()),
                    $ins = $a.find("ins");

                expect($ins.text()).toBe("ICON");
            });
            
            it("should set context on a node by right click", function () {
                var actions = jasmine.createSpyObj("actions", ["setContext"]);
                var rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map(),
                    actions: actions,
                    parentPath: "/foo/"
                }));
                var node = rendered.getDOMNode();
                React.addons.TestUtils.Simulate.mouseDown(node, {
                    button: 2
                });
                expect(actions.setContext).toHaveBeenCalledWith("/foo/afile.js");
            });
            
            it("should set context on a node by control click on Mac", function () {
                var actions = jasmine.createSpyObj("actions", ["setContext"]);
                var rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map(),
                    actions: actions,
                    parentPath: "/foo/",
                    platform: "mac"
                }));
                var node = rendered.getDOMNode();
                React.addons.TestUtils.Simulate.mouseDown(node, {
                    button: 0,
                    ctrlKey: true
                });
                expect(actions.setContext).toHaveBeenCalledWith("/foo/afile.js");
            });

            it("should not set context on a node by control click on Windows", function () {
                var actions = jasmine.createSpyObj("actions", ["setContext"]);
                var rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map(),
                    actions: actions,
                    parentPath: "/foo/",
                    platform: "win"
                }));
                var node = rendered.getDOMNode();
                React.addons.TestUtils.Simulate.mouseDown(node, {
                    button: 0,
                    ctrlKey: true
                });
                expect(actions.setContext).not.toHaveBeenCalled();
            });

            it("should allow icon extensions to return a jQuery object for the icon", function () {
                var extensionCalls = 0,
                    rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                        name: "afile.js",
                        entry: Immutable.Map(),
                        parentPath: "/foo/",
                        extensions: Immutable.fromJS({
                            icons: [function (data) {
                                extensionCalls++;
                                return $("<ins/>").text("ICON");
                            }]
                        })
                    }));

                expect(extensionCalls).toBe(1);

                var a = RTU.findRenderedDOMComponentWithTag(rendered, "a");
                expect(a.props.children[1]).toBe("afile");
                expect(a.props.children[2].props.children).toBe(".js");

                var $a = $(a.getDOMNode()),
                    $ins = $a.find("ins");

                expect($ins.text()).toBe("ICON");
            });

            it("should call addClass extensions", function () {
                var extensionCalls = 0,
                    rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                        name: "afile.js",
                        entry: Immutable.Map(),
                        parentPath: "/foo/",
                        extensions: Immutable.fromJS({
                            addClass: [function (data) {
                                extensionCalls++;
                                expect(data.name).toBe("afile.js");
                                expect(data.isFile).toBe(true);
                                expect(data.fullPath).toBe("/foo/afile.js");
                                return "new";
                            }, function (data) {
                                return "classes are cool";
                            }]
                        })
                    }));

                expect(extensionCalls).toBe(1);

                var li = RTU.findRenderedDOMComponentWithTag(rendered, "li");
                expect(li.props.className).toBe("jstree-leaf new classes are cool");
            });
            
            it("should render a rename component", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map({
                        rename: true
                    })
                }));
                var input = RTU.findRenderedDOMComponentWithTag(rendered, "input");
                expect(input.props.defaultValue).toBe("afile.js");
            });
            
            it("should re-render as needed", function () {
                var props = {
                    name      : "afile.js",
                    entry     : Immutable.Map(),
                    parentPath: "/foo/",
                    extensions: Immutable.Map()
                };
                
                var rendered = RTU.renderIntoDocument(FileTreeView._fileNode(props));
                
                var newProps = _.clone(props);
                expect(rendered.shouldComponentUpdate(newProps)).toBe(false);
                
                newProps = _.clone(props);
                newProps.entry = Immutable.Map({
                    selected: true
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
                
                newProps = _.clone(props);
                newProps.forceRender = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.extensions = Immutable.Map({
                    addClasses: Immutable.List()
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
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
                    parentPath: "/foo/",
                    entry: Immutable.fromJS({
                        children: null
                    })
                }));
                var dirLI = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-closed"),
                    dirA = RTU.findRenderedDOMComponentWithTag(dirLI, "a");
                expect(dirA.props.children[1]).toBe("thedir");
                expect(rendered.myPath()).toBe("/foo/thedir/");
            });
            
            it("should rerender as needed", function () {
                var props = {
                    name                : "thedir",
                    parentPath          : "/foo/",
                    entry               : Immutable.fromJS({
                        children: null
                    }),
                    extensions          : Immutable.Map(),
                    sortDirectoriesFirst: false
                };
                        
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryNode(props));
                
                var newProps = _.clone(props);
                
                expect(rendered.shouldComponentUpdate(newProps)).toBe(false);
                
                newProps = _.clone(props);
                newProps.entry = Immutable.fromJS({
                    children: []
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
                
                newProps = _.clone(props);
                newProps.forceRender = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
                
                newProps = _.clone(props);
                newProps.extensions = Immutable.Map({
                    addClasses: Immutable.List()
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
                
                newProps = _.clone(props);
                newProps.sortDirectoriesFirst = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
            });

            it("should call extensions for directories", function () {
                var extensionCalled = false,
                    rendered = RTU.renderIntoDocument(FileTreeView._directoryNode({
                        name: "thedir",
                        parentPath: "/foo/",
                        entry: Immutable.fromJS({
                            children: null
                        }),
                        extensions: Immutable.fromJS({
                            icons: [function (data) {
                                return React.DOM.ins({}, "ICON");
                            }],
                            addClass: [function (data) {
                                extensionCalled = true;
                                expect(data.name).toBe("thedir");
                                expect(data.isFile).toBe(false);
                                expect(data.fullPath).toBe("/foo/thedir/");
                                return "new";
                            }, function (data) {
                                return "classes are cool";
                            }]
                        })
                    }));
                
                expect(extensionCalled).toBe(true);
                
                var dirLI = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-closed"),
                    dirA = RTU.findRenderedDOMComponentWithTag(dirLI, "a");
                expect(dirLI.props.className).toBe("jstree-closed new classes are cool");
                var icon = dirA.props.children[0];
                expect(icon.props.children).toBe("ICON");
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
                expect(input.props.defaultValue).toBe("thedir");
            });
            
            it("should be able to list files", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryContents({
                    contents: Immutable.fromJS({
                        "afile.js": {}
                    })
                }));
                var fileLI = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-leaf"),
                    fileA = RTU.findRenderedDOMComponentWithTag(fileLI, "a");
                expect(fileA.props.children[1]).toBe("afile");
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
                expect(aTags[1].props.children[1]).toBe("afile");
            });
            
            it("should sort directory contents according to the flag", function () {
                var directory = Immutable.fromJS({
                    children: {
                        "afile.js": {},
                        "subdir": {
                            children: {}
                        }
                    },
                    open: true
                });
                
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryNode({
                    name: "hasDirs",
                    entry: directory,
                    sortDirectoriesFirst: true
                }));
                var html = rendered.getDOMNode().outerHTML;
                expect(html.indexOf("subdir")).toBeLessThan(html.indexOf("afile"));
            });
            
            it("should rerender contents as needed", function () {
                var props = {
                    parentPath          : "/foo/",
                    contents            : Immutable.Map(),
                    sortDirectoriesFirst: false,
                    extensions          : Immutable.Map()
                };
                
                var rendered = RTU.renderIntoDocument(FileTreeView._directoryContents(props));

                var newProps = _.clone(props);

                expect(rendered.shouldComponentUpdate(newProps)).toBe(false);

                newProps = _.clone(props);
                newProps.contents = Immutable.fromJS({
                    somefile: {}
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.forceRender = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.extensions = Immutable.Map({
                    addClasses: Immutable.List()
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.sortDirectoriesFirst = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
            });
        });
        
        describe("_fileTreeView", function () {
            var selectionViewInfo = new Immutable.Map({
                hasSelection: true,
                width: 100,
                hasContext: false,
                scrollTop: 0,
                scrollLeft: 0,
                offsetTop: 0
            });
            
            it("should render the directory", function () {
                var rendered = RTU.renderIntoDocument(FileTreeView._fileTreeView({
                    projectRoot: {},
                    treeData: new Immutable.Map({
                        "subdir": twoLevel.getIn(["children", "subdir"])
                    }),
                    selectionViewInfo: selectionViewInfo,
                    sortDirectoriesFirst: false
                })),
                    rootNode = RTU.findRenderedDOMComponentWithClass(rendered, "jstree-no-dots"),
                    aTags = RTU.scryRenderedDOMComponentsWithTag(rootNode, "a");
                expect(aTags.length).toBe(2);
                expect(aTags[0].props.children[1]).toBe("subdir");
                expect(aTags[1].props.children[1]).toBe("afile");
            });
            
            it("should rerender contents as needed", function () {
                var props = {
                    parentPath          : "/foo/",
                    treeData            : Immutable.Map(),
                    selectionViewInfo   : selectionViewInfo,
                    sortDirectoriesFirst: false,
                    extensions          : Immutable.Map()
                };

                var rendered = RTU.renderIntoDocument(FileTreeView._fileTreeView(props));

                var newProps = _.clone(props);

                expect(rendered.shouldComponentUpdate(newProps)).toBe(false);

                newProps = _.clone(props);
                newProps.treeData = Immutable.fromJS({
                    somefile: {}
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.forceRender = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.extensions = Immutable.Map({
                    addClasses: Immutable.List()
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.sortDirectoriesFirst = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
            });
        });
        
        describe("render", function () {
            it("should render into the given element", function () {
                var el = document.createElement("div"),
                    viewModel = new FileTreeViewModel.FileTreeViewModel();
                viewModel._treeData = new Immutable.Map({
                    "subdir": twoLevel.getIn(["children", "subdir"])
                });
                FileTreeView.render(el, viewModel, {
                    fullPath: "/foo/"
                });
                expect($(".jstree-no-dots", el).length).toBe(1);
            });
        });
    });
});
