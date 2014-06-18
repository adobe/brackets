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
        return contents.map(function (entry) {
            if (entry.isFile) {
                // if the name starts with a dot, treat the whole name as the filename not an extension
                var i = entry.name.lastIndexOf(".");
                if (i === 0) {
                    i = entry.name.length;
                }
                return {
                    name: entry.name.substr(0, i > -1 ? i : entry.name.length),
                    extension: entry.name.substring(i)
                };
            } else {
                return {
                    name: entry.name,
                    children: null,
                    directory: entry
                };
            }
        });
    }
    
    function _nameCompare(a, b) {
        var result = FileUtils.compareFilenames(a.name, b.name, false);
        if (result === 0) {
            if (a.extension && b.extension === "") {
                return 1;
            } else if (b.extension && a.extension === "") {
                return -1;
            } else {
                return FileUtils.compareFilenames(a.extension, b.extension, false);
            }
        }
        return result;
    }
    
    function _dirsFirstCompare(a, b) {
        if (a.children !== undefined && b.children === undefined) {
            return -1;
        } else if (a.children === undefined && b.children !== undefined) {
            return 1;
        } else {
            return _nameCompare(a, b);
        }
    }
    
    function _sortFormattedDirectory(contents, dirsFirst) {
        return contents.sort(dirsFirst ? _dirsFirstCompare : _nameCompare);
    }
    
    function ViewModel() {
        this.setProjectRoot(null);
    }
    
    /**
     * Reference to the currently selected file.
     * @type {?(File|Directory)}
     */
    ViewModel.prototype.selected = null;
    
    /**
     * Reference to previous selected file when ProjectManager had
     * selection focus from FileViewController.
     * @type {?(File|Directory)}
     */
    ViewModel.prototype.lastSelected = null;
    
    ViewModel.prototype.sortDirsFirst = false;
    
    ViewModel.prototype.treeData = null;
    
    ViewModel.prototype.updateContents = function updateContents(directory, treeData) {
        var deferred = new $.Deferred();
        directory.getContents(function (err, contents) {
            if (err) {
                deferred.reject(err);
                return;
            }
            var sorted = _sortFormattedDirectory(_formatDirectoryContents(contents), this.sortDirsFirst);
            // TODO: this is not going to work for actually updating
            sorted.forEach(function (item) {
                treeData.push(item);
            });
            deferred.resolve();
            $(this).trigger(CHANGE);
        }.bind(this));
        return deferred.promise();
    };
    
    ViewModel.prototype.setProjectRoot = function (root) {
        this.projectRoot = root;
        this.treeData = [];
        if (!root) {
            return new $.Deferred().resolve().promise();
        }
        return this.updateContents(this.projectRoot, this.treeData);
    };
    
    /**
     * Removes the project root.
     */
    ViewModel.prototype.getTreeDataForPath = function (path) {
        var projectRoot = this.projectRoot;
        
        if (path.substr(0, projectRoot.length) !== projectRoot) {
            return undefined;
        }
        
        path = path.substring(projectRoot.length);
        var parts = path.split("/"),
            part = parts.shift(),
            treeData = this.treeData,
            node;
        
        while (part) {
            if (treeData === null) {
                return null;
            }
            node = _.find(treeData, { name : part });
            if (!node) {
                return;
            }
            treeData = node.children;
            part = parts.shift();
        }
        
        return node;
    };
    
    /**
     * @private
     * Save ProjectManager project path and tree state.
     */
    ViewModel.prototype.getOpenNodes = function _getOpenNodes() {
        var openNodes = [];
        
        function addNodesAtDepth(treeList, parent, depth) {
            treeList.forEach(function (treeDataEntry) {
                // is it a file or closed? (undefined or null)
                if (!treeDataEntry.children) {
                    return;
                }
                var nodeList = openNodes[depth];
                if (!nodeList) {
                    nodeList = openNodes[depth] = [];
                }
                
                var directoryPath = parent + treeDataEntry.name + "/";
                nodeList.push(directoryPath);
                addNodesAtDepth(treeDataEntry.children, directoryPath, depth + 1);
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
    
    ViewModel.prototype.toggleDirectory = function (treeDataEntry) {
        if (treeDataEntry.children === undefined) {
            throw new Error("toggleDirectory was called with a file treeDataEntry");
        }
        if (treeDataEntry.children === null) {
            treeDataEntry.children = [];
            return this.updateContents(treeDataEntry.directory, treeDataEntry.children);
        } else {
            treeDataEntry.children = null;
            $(this).trigger(CHANGE);
            return new $.Deferred().resolve().promise();
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
    
    var fileNode = React.createClass({
        handleClick: function (e) {
            console.log("file clicked", e, e.button);
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
            var entry = this.props.entry,
                name = entry.name,
                extension = entry.extension;
            
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
    
    var directoryNode, directoryContents;
    
    directoryNode = React.createClass({
        handleClick: function () {
            this.props.dispatcher.toggleDirectory(this.props.entry);
            return false;
        },
        
        render: function () {
            var entry = this.props.entry,
                nodeClass,
                childNodes;
            
            if (entry.children) {
                nodeClass = "open";
                childNodes = directoryContents({
                    contents: entry.children,
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
                      entry.name),
                childNodes);
        }
    });

    directoryContents = React.createClass({
        render: function () {
            var ulProps = this.props.isRoot ? {
                className: "jstree-no-dots jstree-no-icons"
            } : null;
            
            return DOM.ul(ulProps, this.props.contents.map(function (entry) {
                // TODO: set keys
                if (entry.children !== undefined) {
                    return directoryNode({
                        entry: entry,
                        dispatcher: this.props.dispatcher
                    });
                } else {
                    return fileNode({
                        entry: entry,
                        dispatcher: this.props.dispatcher
                    });
                }
            }.bind(this)));
        }
    });
    
    var fileTreeView = React.createClass({
        render: function () {
            return directoryContents({
                isRoot: true,
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
    
    exports._formatDirectoryContents = _formatDirectoryContents;
    exports._sortFormattedDirectory = _sortFormattedDirectory;
    exports._fileNode = fileNode;
    exports._directoryNode = directoryNode;
    exports._directoryContents = directoryContents;
    exports._fileTreeView = fileTreeView;
    
    exports.CHANGE = CHANGE;
    exports.render = render;
    exports.ViewModel = ViewModel;
});
