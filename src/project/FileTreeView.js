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

/*global define, $*/
/*unittests: FileTreeView*/

define(function (require, exports, module) {
    "use strict";
    
    var React = require("thirdparty/react"),
        Immutable = require("thirdparty/immutable"),
        _ = require("thirdparty/lodash"),
        FileUtils = require("file/FileUtils"),
        FileSystem = require("filesystem/FileSystem"),
        Async = require("utils/Async"),
        FileViewController = require("project/FileViewController");
    
    var DOM = React.DOM;
    
    // Constants
    var CHANGE = "change";

    function _formatDirectoryContents(contents) {
        return Immutable.fromJS(_.zipObject(contents.map(function (entry) {
            if (entry.isFile) {
                return [entry.name, {}];
            } else {
                return [entry.name, {children: null}];
            }
        })));
    }
    
    function _getDirectoryContents(directory) {
        if (typeof directory === "string") {
            directory = FileSystem.getDirectoryForPath(directory);
        }
        var deferred = new $.Deferred();
        directory.getContents(function (err, contents) {
            if (err) {
                deferred.reject(err);
                return;
            }
            deferred.resolve(_formatDirectoryContents(contents));
        });
        return deferred.promise();
    }
    
    function isFile(entry) {
        return entry.get("children") === undefined;
    }

    function ViewModel() {
        this.setProjectRoot(null);
        this._commitTreeData = this._commitTreeData.bind(this);
    }
    
    /**
     * Reference to previous selected file when ProjectManager had
     * selection focus from FileViewController.
     * @type {string}
     */
    ViewModel.prototype._lastSelected = null;
    
    ViewModel.prototype._lastContext = null;
    
    ViewModel.prototype._lastRename = null;
    
    ViewModel.prototype.sortDirectoriesFirst = false;
    
    ViewModel.prototype.treeData = null;
    
    ViewModel.prototype._commitTreeData = function (treeData) {
        if (treeData !== this.treeData) {
            this.treeData = treeData;
            $(this).trigger(CHANGE);
        }
    };
    
    ViewModel.prototype.setProjectRoot = function (root) {
        this.projectRoot = root;
        if (!root) {
            this.treeData = new Immutable.Vector();
            return new $.Deferred().resolve().promise();
        }
        return _getDirectoryContents(this.projectRoot).then(this._commitTreeData);
    };
    
    function _filePathToObjectPath(projectRoot, treeData, path) {
        if (!projectRoot) {
            return null;
        }

        var projectRootPath = projectRoot.fullPath;

        if (path.substr(0, projectRootPath.length) !== projectRootPath) {
            return null;
        }
        
        path = path.substring(projectRootPath.length);

        var parts = path.split("/"),
            part = parts.shift(),
            result = [],
            node;
        
        while (part) {
            if (treeData === null) {
                return null;
            }
            node = treeData.get(part);
            if (node === undefined) {
                return null;
            }
            result.push(part);
            part = parts.shift();
            if (part) {
                treeData = node.get("children");
                if (treeData) {
                    result.push("children");
                }
            }
        }
        
        return result;
    }
    
    /**
     * @private
     * Save ProjectManager project path and tree state.
     */
    ViewModel.prototype._getOpenNodes = function _getOpenNodes() {
        var openNodes = [];
        
        function addNodesAtDepth(treeData, parent, depth) {
            if (!treeData) {
                return;
            }
            
            treeData.forEach(function (value, key) {
                if (isFile(value)) {
                    return;
                }
                
                var directoryPath = parent + key + "/";
                
                if (value.get("open")) {
                    var nodeList = openNodes[depth];
                    if (!nodeList) {
                        nodeList = openNodes[depth] = [];
                    }
                    nodeList.push(directoryPath);
                }
                addNodesAtDepth(value.get("children"), directoryPath, depth + 1);
            });
        }
        
        addNodesAtDepth(this.treeData, this.projectRoot.fullPath, 0);
        return openNodes;
    };
    
    /**
     * @private
     * Reopens a set of nodes in the tree by ID.
     * @param {Array.<Array.<string>>} nodesByDepth An array of arrays of node ids to reopen. The ids within
     *     each sub-array are reopened in parallel, and the sub-arrays are reopened in order, so they should
     *     be sorted by depth within the tree.
     * @return {$.Deferred} A promise that will be resolved when all nodes have been fully
     *     reopened.
     */
    ViewModel.prototype._reopenNodes = function _reopenNodes(nodesByDepth) {
        var deferred = new $.Deferred();
        
        if (nodesByDepth.length === 0) {
            // All paths are opened and fully rendered.
            return deferred.resolve().promise();
        } else {
            var self = this;
            return Async.doSequentially(nodesByDepth, function (toOpenPaths) {
                return Async.doInParallel(
                    toOpenPaths,
                    function (path) {
                        return self.toggleDirectory(path, true);
                    },
                    false
                );
            });
        }
    };
    
    ViewModel.prototype.toggleDirectory = function (path, shouldOpen) {
        var objectPath = _filePathToObjectPath(this.projectRoot, this.treeData, path);
        if (!objectPath) {
            return new $.Deferred().reject(new Error("Cannot find directory in project: " + path)).promise();
        }
        
        var directory = this.treeData.getIn(objectPath),
            newTreeData = this.treeData;
        
        if (isFile(directory)) {
            return new $.Deferred().reject(new Error("toggleDirectory called with a file: " + path)).promise();
        }
        
        var isOpen = directory.get("open");
        
        if ((isOpen && shouldOpen) || (!isOpen && shouldOpen === false)) {
            return new $.Deferred().resolve().promise();
        }
        
        if (isOpen || directory.get("children")) {
            newTreeData = newTreeData.updateIn(objectPath, function (directory) {
                if (isOpen) {
                    return directory["delete"]("open");
                } else {
                    return directory.set("open", true);
                }
            });
            this._commitTreeData(newTreeData);
            return new $.Deferred().resolve().promise();
        } else {
            return exports._getDirectoryContents(path).then(function (contents) {
                var newTreeData = this.treeData.updateIn(objectPath, function (directory) {
                    return directory.merge({
                        children: contents,
                        open: true
                    });
                });
                this._commitTreeData(newTreeData);
            }.bind(this));
        }
    };
    
    function _moveMarker(projectRoot, treeData, markerName, oldPath, newPath) {
        if (newPath === oldPath) {
            return;
        }
        
        var objectPath;
        
        if (newPath !== null) {
            objectPath = _filePathToObjectPath(projectRoot, treeData, newPath);
            if (!objectPath) {
                return;
            }
        }

        var newTreeData = treeData;

        if (oldPath) {
            var lastObjectPath = _filePathToObjectPath(projectRoot, treeData, oldPath);
            if (lastObjectPath) {
                newTreeData = newTreeData.updateIn(lastObjectPath, function (entry) {
                    return entry["delete"](markerName);
                });
            }
        }
        
        if (newPath !== null) {
            newTreeData = newTreeData.updateIn(objectPath, function (entry) {
                return entry.set(markerName, true);
            });
        }
        
        return newTreeData;
    }
    
    ViewModel.prototype._setSelected = function (path) {
        var newTreeData = _moveMarker(this.projectRoot, this.treeData, "selected", this._lastSelected, path);
        
        if (newTreeData) {
            // Clear the context flag automatically when you change the selection
            newTreeData = _moveMarker(this.projectRoot, newTreeData, "context", this._lastContext, null) || newTreeData;
            this._lastContext = null;
            
            // Stop renaming when you change the selection
            newTreeData = _moveMarker(this.projectRoot, newTreeData, "rename", this._lastRename, null) || newTreeData;
            this._lastRename = null;
            
            this._lastSelected = path;
            this._commitTreeData(newTreeData);
        }
    };
    
    ViewModel.prototype._setContext = function (path) {
        var newTreeData = _moveMarker(this.projectRoot, this.treeData, "context", this._lastContext, path);

        if (newTreeData) {
            // Stop renaming when you move the context
            newTreeData = _moveMarker(this.projectRoot, newTreeData, "rename", this._lastRename, null) || newTreeData;
            this._lastRename = null;
            
            this._lastContext = path;
            this._commitTreeData(newTreeData);
        }
    };
    
    ViewModel.prototype._setRename = function (path) {
        var newTreeData = _moveMarker(this.projectRoot, this.treeData, "rename", this._lastRename, path);

        if (newTreeData) {
            if (path === null) {
                // Clear the context when you finish renaming
                newTreeData = _moveMarker(this.projectRoot, newTreeData, "context", this._lastContext, null) || newTreeData;
                this._lastContext = null;
            }
            
            this._lastRename = path;
            this._commitTreeData(newTreeData);
        }
    };
    
    ViewModel.prototype.setSortDirectoriesFirst = function (sortDirectoriesFirst) {
        if (sortDirectoriesFirst !== this.sortDirectoriesFirst) {
            this.sortDirectoriesFirst = sortDirectoriesFirst;
            $(this).trigger(CHANGE);
        }
    };
    
    ViewModel.prototype.on = function (event, handler) {
        $(this).on(event, handler);
    };
    
    ViewModel.prototype.off = function (event, handler) {
        $(this).off(event, handler);
    };
    
    var openPaths = {},
        fileContext = null,
        rename = null,
        _renderTree;

    function _togglePath(path, open) {
        if (open) {
            openPaths[path] = true;
        } else {
            delete openPaths[path];
        }
        _renderTree();
    }

    function _setSelected(path) {
        fileContext = null;
        var openResult = FileViewController.openAndSelectDocument(path, FileViewController.PROJECT_MANAGER);

        openResult.done(function () {
            _renderTree();
        });
    }

    function _setContext(path) {
        fileContext = path;
        _renderTree();
    }

    function getContext() {
        return fileContext;
    }

    /**
     * @private
     */
    function _hasFileSelectionFocus() {
        return FileViewController.getFileSelectionFocus() === FileViewController.PROJECT_MANAGER;
    }
    
    function _splitExtension(name) {
        // if the name starts with a dot, treat the whole name as the filename not an extension
        var i = name.lastIndexOf(".");
        if (i === -1) {
            return {
                name: name,
                extension: ""
            };
        } else if (i === 0) {
            i = name.length;
        }
        return {
            name: name.substr(0, i > -1 ? i : name.length),
            extension: name.substring(i)
        };
    }

    var fileNode = React.createClass({
        shouldComponentUpdate: function (nextProps, nextState) {
            return this.props.entry !== nextProps.entry;
        },
        
        myPath: function () {
            return this.props.parentPath + this.props.name;
        },
        
        handleClick: function (e) {
            this.props.dispatcher.setSelected(this.myPath());
            return false;
        },
        
        handleMouseDown: function (e) {
            if (e.button === 2) {
                this.props.dispatcher.setContext(this.myPath());
            }
            return true;
        },
        render: function () {
            var fullname = this.props.name,
                splitname = _splitExtension(fullname),
                name = splitname.name,
                extension = splitname.extension;
            
            if (extension) {
                extension = DOM.span({
                    className: "extension"
                }, extension);
            }
            
            var fileClasses = "";
            if (this.props.entry.get("selected")) {
                fileClasses = "jstree-clicked jstree-hovered sidebar-selection";
            }
            if (this.props.entry.get("context")) {
                fileClasses += " sidebar-context";
            }
            return DOM.li({
                className: "jstree-leaf",
                onClick: this.handleClick,
                onMouseDown: this.handleMouseDown
            },
                DOM.ins({
                    className: "jstree-icon"
                }, " "),
                DOM.a({
                    href: "#",
                    className: fileClasses
                }, name, extension));
        }
    });

    var fileRename = React.createClass({
        myPath: function () {
            return this.props.parentPath + this.props.name;
        },

        handleKeyDown: function (e) {
            if (e.keyCode === 27) {
                this.props.dispatcher.cancelRename();
            } else if (e.keyCode === 13) {
                this.props.dispatcher.performRename(this.myPath(), this.props.parentPath + this.refs.name.getDOMNode().value.trim());
            }
        },
        render: function () {
            return DOM.li({
                className: "jstree-leaf"
            },
                DOM.ins({
                    className: "jstree-icon"
                }, " "),
                DOM.input({
                    className: "sidebar-context jstree-clicked",
                    type: "text",
                    defaultValue: this.props.name,
                    autoFocus: true,
                    onKeyDown: this.handleKeyDown,
                    ref: "name"
                }));
        }
    });
    
    function _buildDirsFirstComparator(contents) {
        function _dirsFirstCompare(a, b) {
            var aIsFile = isFile(contents.get(a)),
                bIsFile = isFile(contents.get(b));

            if (!aIsFile && bIsFile) {
                return -1;
            } else if (aIsFile && !bIsFile) {
                return 1;
            } else {
                return FileUtils.compareFilenames(a, b);
            }
        }
        return _dirsFirstCompare;
    }
    
    function _sortFormattedDirectory(contents, dirsFirst) {
        if (dirsFirst) {
            return contents.keys().sort(_buildDirsFirstComparator(contents));
        } else {
            return contents.keys().sort(FileUtils.compareFilenames);
        }
    }

    var directoryNode, directoryContents;
    
    directoryNode = React.createClass({
        shouldComponentUpdate: function (nextProps, nextState) {
            return this.props.entry !== nextProps.entry ||
                this.props.sortDirectoriesFirst !== nextProps.sortDirectoriesFirst;
        },
        
        myPath: function () {
            return this.props.parentPath + this.props.name + "/";
        },
        
        handleClick: function () {
            this.props.dispatcher.toggleDirectory(this.myPath());
            return false;
        },
        
        render: function () {
            var entry = this.props.entry,
                nodeClass,
                childNodes,
                children = entry.get("children"),
                isOpen = entry.get("open");
            
            if (isOpen && children) {
                nodeClass = "open";
                childNodes = directoryContents({
                    parentPath: this.myPath(),
                    contents: children,
                    dispatcher: this.props.dispatcher
                });
            } else {
                nodeClass = "closed";
            }
            
            return DOM.li({
                className: "jstree-" + nodeClass,
                onClick: this.handleClick
            },
                DOM.ins({
                    className: "jstree-icon"
                }, " "),
                DOM.a({
                    href: "#"
                },
                      DOM.ins({
                        className: "jstree-icon"
                    }, " "),
                      this.props.name),
                childNodes);
        }
    });

    directoryContents = React.createClass({
        shouldComponentUpdate: function (nextProps, nextState) {
            return this.props.contents !== nextProps.contents ||
                this.props.sortDirectoriesFirst !== nextProps.sortDirectoriesFirst;
        },
        
        render: function () {
            var ulProps = this.props.isRoot ? {
                className: "jstree-no-dots jstree-no-icons"
            } : null;
            
            var contents = this.props.contents,
                namesInOrder = _sortFormattedDirectory(contents, this.props.sortDirectoriesFirst);
            
            return DOM.ul(ulProps, namesInOrder.map(function (name) {
                var entry = contents.get(name);

                if (isFile(entry)) {
                    var component = fileNode;
                    if (entry.get("rename")) {
                        component = fileRename;
                    }
                    return component({
                        parentPath: this.props.parentPath,
                        name: name,
                        entry: entry,
                        dispatcher: this.props.dispatcher,
                        key: name
                    });
                } else {
                    return directoryNode({
                        parentPath: this.props.parentPath,
                        name: name,
                        entry: entry,
                        dispatcher: this.props.dispatcher,
                        sortDirectoriesFirst: this.props.sortDirectoriesFirst,
                        key: name
                    });
                }
            }.bind(this)).toArray());
        }
    });
    
    var fileTreeView = React.createClass({
        shouldComponentUpdate: function (nextProps, nextState) {
            return this.props.treeData !== nextProps.treeData ||
                this.props.sortDirectoriesFirst !== nextProps.sortDirectoriesFirst;
        },
        
        render: function () {
            return directoryContents({
                isRoot: true,
                parentPath: this.props.parentPath,
                sortDirectoriesFirst: this.props.sortDirectoriesFirst,
                contents: this.props.treeData,
                dispatcher: this.props.dispatcher
            });
//            return DOM.ul({
//                className: "jstree-no-dots jstree-no-icons"
//            },
//                directoryContents({
//                    key: this.props.viewModel.projectRoot.fullPath,
//                    entry: this.props.viewModel.treeData,
//                    skipRoot: true,
//                }));
        }
        
    });
    
    function render(element, viewModel, dispatcher) {
        $(element).addClass("jstree jstree-brackets");
        $(element).css("overflow", "auto");
        if (!viewModel.projectRoot) {
            return;
        }
        React.renderComponent(fileTreeView({
            treeData: viewModel.treeData,
            sortDirectoriesFirst: viewModel.sortDirectoriesFirst,
            parentPath: viewModel.projectRoot.fullPath,
            dispatcher: dispatcher
        }),
            element);
    }
    
    exports._splitExtension = _splitExtension;
    exports._formatDirectoryContents = _formatDirectoryContents;
    exports._sortFormattedDirectory = _sortFormattedDirectory;
    exports._getDirectoryContents = _getDirectoryContents;
    exports._fileNode = fileNode;
    exports._fileRename = fileRename;
    exports._directoryNode = directoryNode;
    exports._directoryContents = directoryContents;
    exports._fileTreeView = fileTreeView;
    exports._filePathToObjectPath = _filePathToObjectPath;
    
    exports.CHANGE = CHANGE;
    exports.render = render;
    exports.ViewModel = ViewModel;
});
