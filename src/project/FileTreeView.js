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
        FileViewController = require("project/FileViewController");
    
    var DOM = React.DOM;
    
    // Constants
    var CHANGE = "change";

    /**
     * Name of the preferences for sorting directories first
     * 
     * @type {string}
     */
    var SORT_DIRECTORIES_FIRST = "sortDirectoriesFirst";
    
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
     * Reference to the currently selected file.
     * @type {?(File|Directory)}
     */
    ViewModel.prototype.selected = null;
    
    /**
     * Reference to previous selected file when ProjectManager had
     * selection focus from FileViewController.
     * @type {string}
     */
    ViewModel.prototype._lastSelected = null;
    
    ViewModel.prototype.sortDirsFirst = false;
    
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
    
    /**
     * Removes the project root.
     */
    ViewModel.prototype._filePathToObjectPath = function (path) {
        if (!this.projectRoot) {
            return null;
        }
        
        var projectRoot = this.projectRoot.fullPath;
        
        if (path.substr(0, projectRoot.length) !== projectRoot) {
            return null;
        }
        
        path = path.substring(projectRoot.length);
        var parts = path.split("/"),
            part = parts.shift(),
            treeData = this.treeData,
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
    };
    
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
     * @param {$.Deferred} resultDeferred A Deferred that will be resolved when all nodes have been fully
     *     reopened.
     */
    ViewModel.prototype.reopenNodes = function reopenNodes(nodesByDepth, resultDeferred) {
        if (nodesByDepth.length === 0) {
            // All paths are opened and fully rendered.
            resultDeferred.resolve();
        } else {
            var toOpenPaths = nodesByDepth.shift(),
                toOpenIds   = [],
                node        = null;

            // use path to lookup ID
            toOpenPaths.forEach(function (value, index) {
                node = _projectInitialLoad.fullPathToIdMap[value];

                if (node) {
                    toOpenIds.push(node);
                }
            });

            Async.doInParallel(
                toOpenIds,
                function (id) {
                    var result = new $.Deferred();
                    _projectTree.jstree("open_node", "#" + id, function () {
                        result.resolve();
                    }, true);
                    return result.promise();
                },
                false
            ).always(function () {
                _reopenNodes(nodesByDepth, resultDeferred);
            });
        }
    };
    
    ViewModel.prototype.toggleDirectory = function (path) {
        var objectPath = this._filePathToObjectPath(path);
        if (!objectPath) {
            throw new Error("Cannot find directory in project: " + path);
        }
        
        var directory = this.treeData.getIn(objectPath);
        if (directory.get("open")) {
            var newTreeData = this.treeData.updateIn(objectPath, function (directory) {
                return directory["delete"]("open");
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
    
    ViewModel.prototype._setSelected = function (path) {
        if (path === this._lastSelected) {
            return;
        }
        
        var objectPath = this._filePathToObjectPath(path);
        if (!objectPath) {
            return;
        }
        
        var newTreeData = this.treeData;
        
        if (this._lastSelected) {
            var lastSelectedPath = this._filePathToObjectPath(this._lastSelected);
            if (lastSelectedPath) {
                newTreeData = newTreeData.updateIn(lastSelectedPath, function (entry) {
                    return entry["delete"]("selected");
                });
            }
        }
        
        newTreeData = newTreeData.updateIn(objectPath, function (entry) {
            return entry.set("selected", true);
        });
        
        this._lastSelected = path;
        
        this._commitTreeData(newTreeData);
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
        if (i === 0) {
            i = name.length;
        }
        return {
            name: name.substr(0, i > -1 ? i : name.length),
            extension: name.substring(i)
        };
    }

    var fileNode = React.createClass({
        handleClick: function (e) {
            if (this.props.setSelected) {
                this.props.setSelected(this.props.file.fullPath);
            }
            return false;
        },
        handleMouseDown: function (e) {
            if (e.button === 2 && this.props.setContext) {
                this.props.setContext(this.props.file.fullPath);
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
            if (this.props.selected) {
                fileClasses = "jstree-clicked jstree-hovered sidebar-selection";
            }
            if (this.props.context) {
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
        handleKeyDown: function (e) {
            if (e.keyCode === 27) {
                this.props.cancel();
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
                    defaultValue: this.props.file.name,
                    autoFocus: true,
                    onKeyDown: this.handleKeyDown
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
        handleClick: function () {
            this.props.dispatcher.toggleDirectory(this.props.entry);
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
        render: function () {
            var ulProps = this.props.isRoot ? {
                className: "jstree-no-dots jstree-no-icons"
            } : null;
            
            return DOM.ul(ulProps, this.props.contents.map(function (entry, name) {
                // TODO: set keys
                if (isFile(entry)) {
                    return fileNode({
                        parentPath: this.props.parentPath,
                        name: name,
                        entry: entry,
                        dispatcher: this.props.dispatcher
                    });
                } else {
                    return directoryNode({
                        parentPath: this.props.parentPath,
                        name: name,
                        entry: entry,
                        dispatcher: this.props.dispatcher
                    });
                }
            }.bind(this)).toArray());
        }
    });
    
    var fileTreeView = React.createClass({
        // TODO: Add shouldComponentUpdate
        // TODO: pass dirsFirst flag
        render: function () {
            return directoryContents({
                isRoot: true,
                parentPath: this.props.parentPath,
                contents: this.props.viewModel.treeData,
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
            viewModel: viewModel,
            parentPath: viewModel.projectRoot.fullPath,
            dispatcher: dispatcher
        }),
            element);
    }
    
    function renameItemInline(entry) {
        rename = {
            path: entry,
            cancel: _cancelRename
        };
        fileContext = entry;
        _renderTree();
    }

    function _cancelRename() {
        fileContext = null;
        rename = null;
        _renderTree();
    }
    
    exports._splitExtension = _splitExtension;
    exports._formatDirectoryContents = _formatDirectoryContents;
    exports._sortFormattedDirectory = _sortFormattedDirectory;
    exports._getDirectoryContents = _getDirectoryContents;
    exports._fileNode = fileNode;
    exports._directoryNode = directoryNode;
    exports._directoryContents = directoryContents;
    exports._fileTreeView = fileTreeView;
    
    exports.CHANGE = CHANGE;
    exports.render = render;
    exports.ViewModel = ViewModel;
});
