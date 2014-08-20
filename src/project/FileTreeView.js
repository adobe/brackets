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
    
    ViewModel.prototype._renameTo = null;
    
    ViewModel.prototype.sortDirectoriesFirst = false;
    
    ViewModel.prototype.treeData = null;
    
    ViewModel.prototype._notificationsPaused = false;
    
    ViewModel.prototype.pauseNotifications = function () {
        this._notificationsPaused = true;
        this._lastNotifiedTree = this.treeData;
    };
    
    ViewModel.prototype.resumeNotifications = function () {
        this._notificationsPaused = false;
        if (this._lastNotifiedTree !== this.treeData) {
            $(this).trigger(CHANGE);
        }
        delete this._lastNotifiedTree;
    };
    
    ViewModel.prototype._commitTreeData = function (treeData) {
        if (treeData !== this.treeData) {
            this.treeData = treeData;
            if (!this._notificationsPaused) {
                $(this).trigger(CHANGE);
            }
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
    
    ViewModel.prototype._refresh = function () {
        // This could be made a bit faster/more seamless by comparing the new contents and old contents
        // and just replacing the parts of treeData that actually change.
        
        var projectRoot = this.projectRoot,
            selected = this._lastSelected,
            context = this._lastContext,
            rename = this._lastRename,
            openNodes = this._getOpenNodes(),
            self = this,
            deferred = new $.Deferred();
        
        this.pauseNotifications();
        this.setProjectRoot(projectRoot)
            .then(function () {
                self._reopenNodes(openNodes).then(function () {
                    self._lastSelected = null;
                    self._lastContext = null;
                    self._lastRename = null;
                    
                    self._setSelected(selected);
                    self._setContext(context);
                    self._setRename(rename);
                    self.resumeNotifications();
                    deferred.resolve();
                });
            });
        
        return deferred.promise();
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
    
    function _pathIsFile(path) {
        return path[path.length - 1] !== "/";
    }
    
    function _getFSObject(path) {
        if (!path) {
            return path;
        } else if (_pathIsFile(path)) {
            return FileSystem.getFileForPath(path);
        }
        return FileSystem.getDirectoryForPath(path);
    }
    
    ViewModel.prototype.getSelected = function () {
        return _getFSObject(this._lastSelected);
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
    
    ViewModel.prototype.getContext = function () {
        return _getFSObject(this._lastContext);
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
            this._renameTo = path;
            this._commitTreeData(newTreeData);
        }
    };
    
    ViewModel.prototype._setRenameValue = function (path) {
        if (this._lastRename) {
            this._renameTo = path;
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
    
    function _getName(fullname, extension) {
        return extension !== "" ? fullname.substring(0, fullname.length - extension.length - 1) : fullname;
    }
    
    var renameBehavior = {
        handleKeyDown: function (e) {
            if (e.keyCode === 27) {
                this.props.dispatcher.cancelRename();
            } else if (e.keyCode === 13) {
                this.props.dispatcher.performRename();
            }
        },

        handleKeyUp: function () {
            this.props.dispatcher.setRenameValue(this.props.parentPath + this.refs.name.getDOMNode().value.trim());
        }
    };

    var fileRenameInput = React.createClass({
        mixins: [renameBehavior],

        myPath: function () {
            return this.props.parentPath + this.props.name;
        },

        componentDidMount: function () {
            var fullname = this.props.name,
                extension = FileUtils.getSmartFileExtension(fullname);

            this.refs.name.getDOMNode().setSelectionRange(0, _getName(fullname, extension).length);
        },

        render: function () {
            return DOM.input({
                className: "rename-input",
                type: "text",
                defaultValue: this.props.name,
                autoFocus: true,
                onKeyDown: this.handleKeyDown,
                onKeyUp: this.handleKeyUp,
                ref: "name"
            });
        }
    });
    
    var contextSettable = {
        handleMouseDown: function (e) {
            if (e.button === 2) {
                this.props.dispatcher.setContext(this.myPath());
            }
            return true;
        }
    };

    var fileNode = React.createClass({
        mixins: [contextSettable],
        
        shouldComponentUpdate: function (nextProps, nextState) {
            return this.props.entry !== nextProps.entry;
        },
        
        myPath: function () {
            return this.props.parentPath + this.props.name;
        },
        
        handleClick: function (e) {
            // If the user clicks twice within 500ms, that will be picked up by the double click handler
            // If they click on the node twice with a pause, we'll start a rename.
            if (this.props.entry.get("selected")) {
                if (!this.props.entry.get("rename") && this.state.clickTime && (new Date().getTime() - this.state.clickTime > 500)) {
                    this.props.dispatcher.startRename(this.myPath());
                    this.setState({
                        clickTime: 0
                    });
                }
            } else {
                this.props.dispatcher.setSelected(this.myPath());
                this.setState({
                    clickTime: new Date().getTime()
                });
            }
            return false;
        },
        
        handleDoubleClick: function () {
            if (!this.props.entry.get("rename")) {
                this.props.dispatcher.selectInWorkingSet(this.myPath());
                this.setState({
                    clickTime: 0
                });
            }
        },
        
        render: function () {
            var fullname = this.props.name,
                extension = FileUtils.getSmartFileExtension(fullname),
                name = _getName(fullname, extension);
            
            if (extension) {
                extension = DOM.span({
                    className: "extension"
                }, "." + extension);
            }
            
            var fileClasses = "";
            if (this.props.entry.get("selected")) {
                fileClasses = "jstree-clicked jstree-hovered sidebar-selection";
            }
            if (this.props.entry.get("context")) {
                fileClasses += " sidebar-context";
            }
            
            var nameDisplay;
            
            if (this.props.entry.get("rename")) {
                nameDisplay = fileRenameInput({
                    dispatcher: this.props.dispatcher,
                    entry: this.props.entry,
                    name: this.props.name,
                    parentPath: this.props.parentPath
                });
            } else {
                nameDisplay = DOM.a({
                    href: "#",
                    className: fileClasses
                }, name, extension);
            }
            
            return DOM.li({
                className: "jstree-leaf",
                onClick: this.handleClick,
                onMouseDown: this.handleMouseDown,
                onDoubleClick: this.handleDoubleClick
            },
                DOM.ins({
                    className: "jstree-icon"
                }, " "),
                nameDisplay);
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
    
    var directoryRenameInput = React.createClass({
        mixins: [renameBehavior],

        myPath: function () {
            return this.props.parentPath + this.props.name;
        },

        render: function () {
            return DOM.input({
                className: "rename-input",
                type: "text",
                defaultValue: this.props.name,
                autoFocus: true,
                onKeyDown: this.handleKeyDown,
                onKeyUp: this.handleKeyUp,
                ref: "name"
            });
        }
    });

    directoryNode = React.createClass({
        mixins: [contextSettable],
        
        shouldComponentUpdate: function (nextProps, nextState) {
            return this.props.entry !== nextProps.entry ||
                this.props.sortDirectoriesFirst !== nextProps.sortDirectoriesFirst;
        },
        
        myPath: function () {
            return this.props.parentPath + this.props.name + "/";
        },
        
        handleClick: function () {
            this.props.dispatcher.toggleDirectory(this.myPath());
            this.props.dispatcher.setSelected(this.myPath());
            return false;
        },
        
        render: function () {
            var entry = this.props.entry,
                nodeClass,
                childNodes,
                children = entry.get("children"),
                isOpen = entry.get("open"),
                directoryClasses = "";
            
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
            
            var nameDisplay;
            if (entry.get("rename")) {
                nameDisplay = directoryRenameInput({
                    dispatcher: this.props.dispatcher,
                    entry: this.props.entry,
                    name: this.props.name,
                    parentPath: this.props.parentPath
                });
            } else {
                nameDisplay = this.props.name;
            }
            
            if (this.props.entry.get("selected")) {
                directoryClasses += " sidebar-selection";
            }
            
            if (entry.get("context")) {
                directoryClasses += " sidebar-context";
            }

            return DOM.li({
                className: "jstree-" + nodeClass + directoryClasses,
                onClick: this.handleClick,
                onMouseDown: this.handleMouseDown
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
                      nameDisplay),
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
                    return fileNode({
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
    
    exports._formatDirectoryContents = _formatDirectoryContents;
    exports._sortFormattedDirectory = _sortFormattedDirectory;
    exports._getDirectoryContents = _getDirectoryContents;
    exports._fileNode = fileNode;
    exports._directoryNode = directoryNode;
    exports._directoryContents = directoryContents;
    exports._fileTreeView = fileTreeView;
    exports._filePathToObjectPath = _filePathToObjectPath;
    
    exports.CHANGE = CHANGE;
    exports.render = render;
    exports.ViewModel = ViewModel;
});
