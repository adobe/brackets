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

/**
 * This is the view layer (template) for the file tree in the sidebar. It takes a FileTreeViewModel
 * and renders it to the given element using React. User actions are signaled via an ActionCreator
 * (in the Flux sense).
 */
define(function (require, exports, module) {
    "use strict";
    
    var React     = require("thirdparty/react"),
        _         = require("thirdparty/lodash"),
        FileUtils = require("file/FileUtils"),
        FileTreeViewModel = require("project/FileTreeViewModel"),
        ViewUtils = require("utils/ViewUtils");
    
    var DOM = React.DOM;
    
    /**
     * @private
     * 
     * Returns the name of a file without its extension.
     * 
     * @param {string} fullname The complete name of the file (not including the rest of the path)
     * @param {string} extension The file extension
     * @return {string} The fullname without the extension
     */
    function _getName(fullname, extension) {
        return extension !== "" ? fullname.substring(0, fullname.length - extension.length - 1) : fullname;
    }
    
    /**
     * Mixin that allows a component to compute the full path to its directory entry.
     */
    var pathComputer = {
        /**
         * Computes the full path of the file represented by this input.
         */
        myPath: function () {
            return this.props.parentPath + this.props.name;
        }
    };
    
    /**
     * This is a mixin that provides rename input behavior. It is responsible for taking keyboard input
     * and invoking the correct action based on that input.
     */
    var renameBehavior = {
        /**
         * If the user presses enter or escape, we either successfully complete or cancel, respectively,
         * the rename or create operation that is underway.
         */
        handleKeyDown: function (e) {
            // Escape
            if (e.keyCode === 27) {
                this.props.actions.cancelRename();
            
            // Enter
            } else if (e.keyCode === 13) {
                this.props.actions.performRename();
            }
        },

        /**
         * The rename or create operation can be completed or canceled by actions outside of 
         * this component, so we keep the model up to date by sending every update via an action.
         */
        handleKeyUp: function () {
            this.props.actions.setRenameValue(this.refs.name.getDOMNode().value.trim());
        }
    };
    
    /**
     * @private
     * 
     * This component presents an input field to the user for renaming a file.
     * 
     * Props:
     * * parentPath: the full path of the directory containing this file
     * * name: the name of the file, including the extension
     * * actions: the action creator responsible for communicating actions the user has taken
     */
    var fileRenameInput = React.createClass({
        mixins: [renameBehavior],
        
        /**
         * When this component is displayed, we scroll it into view and select the portion 
         * of the filename that excludes the extension.
         */
        componentDidMount: function () {
            var fullname = this.props.name,
                extension = FileUtils.getSmartFileExtension(fullname);

            var node = this.refs.name.getDOMNode();
            node.setSelectionRange(0, _getName(fullname, extension).length);
            ViewUtils.scrollElementIntoView($("#project-files-container"), $(node), true);
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
    
    /**
     * @private
     * 
     * This mixin handles middle click action to make a file the "context" object for performing
     * operations like reanme.
     */
    var contextSettable = {
        
        /**
         * Send middle click to the action creator as a setContext action.
         */
        handleMouseDown: function (e) {
            if (e.button === 2) {
                this.props.actions.setContext(this.myPath());
            }
            return true;
        }
    };

    /**
     * @private
     * 
     * Component to display a file in the tree.
     * 
     * Props:
     * * parentPath: the full path of the directory containing this file
     * * name: the name of the file, including the extension
     * * entry: the object with the relevant metadata for the file (whether it's selected or is the context file)
     * * actions: the action creator responsible for communicating actions the user has taken
     */
    var fileNode = React.createClass({
        mixins: [contextSettable, pathComputer],
        
        /**
         * Thanks to immutable objects, we can just do a start object identity check to know
         * whether or not we need to re-render.
         */
        shouldComponentUpdate: function (nextProps, nextState) {
            return this.props.entry !== nextProps.entry;
        },
        
        /**
         * When the user clicks on the node, we'll either select it or, if they've clicked twice
         * with a bit of delay in between, we'll invoke the `startRename` action.
         */
        handleClick: function (e) {
            // If the user clicks twice within 500ms, that will be picked up by the double click handler
            // If they click on the node twice with a pause, we'll start a rename.
            if (this.props.entry.get("selected")) {
                if (!this.props.entry.get("rename") && this.state.clickTime && (new Date().getTime() - this.state.clickTime > 500)) {
                    this.props.actions.startRename(this.myPath());
                    this.setState({
                        clickTime: 0
                    });
                }
            } else {
                this.props.actions.setSelected(this.myPath());
                this.setState({
                    clickTime: new Date().getTime()
                });
            }
            return false;
        },
        
        /**
         * When the user double clicks, we will select this file and add it to the working
         * set (via the `selectInWorkingSet` action.)
         */
        handleDoubleClick: function () {
            if (!this.props.entry.get("rename")) {
                this.props.actions.selectInWorkingSet(this.myPath());
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
                    actions: this.props.actions,
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

    /**
     * @private
     * 
     * Creates a comparison function for sorting a directory's contents with directories
     * appearing before files.
     * 
     * We're sorting the keys of the directory (the names) based partly on the values,
     * so we use a closure to capture the map itself so that we can look up the
     * values as needed.
     * 
     * @param {Immutable.Map} contents The directory's contents
     * @return {function(string,string)} Comparator that sorts directories first.
     */
    function _buildDirsFirstComparator(contents) {
        function _dirsFirstCompare(a, b) {
            var aIsFile = FileTreeViewModel.isFile(contents.get(a)),
                bIsFile = FileTreeViewModel.isFile(contents.get(b));

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
    
    /**
     * @private
     * 
     * Sort a directory either alphabetically or with subdirectories listed first.
     * 
     * @param {Immutable.Map} contents the directory's contents
     * @param {boolean} dirsFirst true to sort subdirectories first
     * @return {Immutable.Map} sorted mapping
     */
    function _sortDirectoryContents(contents, dirsFirst) {
        if (dirsFirst) {
            return contents.keys().sort(_buildDirsFirstComparator(contents));
        } else {
            return contents.keys().sort(FileUtils.compareFilenames);
        }
    }
    
    // Forward references to keep JSLint happy.
    var directoryNode, directoryContents;
    
    /**
     * @private
     * 
     * Component that provides the input for renaming a directory.
     * 
     * Props:
     * * parentPath: the full path of the directory containing this file
     * * name: the name of the file, including the extension
     * * actions: the action creator responsible for communicating actions the user has taken
     */
    var directoryRenameInput = React.createClass({
        mixins: [renameBehavior],

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
    
    /**
     * @private
     * 
     * Displays a directory (but not its contents) in the tree.
     * 
     * Props:
     * * parentPath: the full path of the directory containing this file
     * * name: the name of the file, including the extension
     * * entry: the object with the relevant metadata for the file (whether it's selected or is the context file)
     * * actions: the action creator responsible for communicating actions the user has taken
     * * sortDirectoriesFirst: whether the directories should be displayed first when listing the contents of a directory
     */
    directoryNode = React.createClass({
        mixins: [contextSettable, pathComputer],
        
        /**
         * We need to update this component if the sort order changes or our entry object
         * changes. Thanks to immutability, if any of the directory contents change, our
         * entry object will change.
         */
        shouldComponentUpdate: function (nextProps, nextState) {
            return this.props.entry !== nextProps.entry ||
                this.props.sortDirectoriesFirst !== nextProps.sortDirectoriesFirst;
        },
        
        /**
         * If you click on a directory, it will toggle between open and closed.
         */
        handleClick: function () {
            var setOpen = this.props.entry.get("open") ? false : true;
            this.props.actions.setDirectoryOpen(this.myPath(), setOpen);
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
                    actions: this.props.actions
                });
            } else {
                nodeClass = "closed";
            }
            
            var nameDisplay;
            if (entry.get("rename")) {
                nameDisplay = directoryRenameInput({
                    actions: this.props.actions,
                    entry: this.props.entry,
                    name: this.props.name,
                    parentPath: this.props.parentPath
                });
            } else {
                nameDisplay = this.props.name;
            }
            
            if (this.props.entry.get("selected")) {
                directoryClasses += " jstree-clicked sidebar-selection";
            }
            
            if (entry.get("context")) {
                directoryClasses += " sidebar-context";
            }

            return DOM.li({
                className: "jstree-" + nodeClass,
                onClick: this.handleClick,
                onMouseDown: this.handleMouseDown
            },
                DOM.ins({
                    className: "jstree-icon"
                }, " "),
                DOM.a({
                    href: "#",
                    className: directoryClasses
                },
                      DOM.ins({
                        className: "jstree-icon"
                    }, " "),
                      nameDisplay),
                childNodes);
        }
    });
    
    /**
     * @private
     * 
     * Displays the contents of a directory.
     * 
     * Props:
     * * isRoot: whether this directory is the root of the tree
     * * parentPath: the full path of the directory containing this file
     * * contents: the map of name/child entry pairs for this directory
     * * actions: the action creator responsible for communicating actions the user has taken
     * * sortDirectoriesFirst: whether the directories should be displayed first when listing the contents of a directory
     */
    directoryContents = React.createClass({
        
        /**
         * Need to re-render if the sort order or the contents change.
         */
        shouldComponentUpdate: function (nextProps, nextState) {
            return this.props.contents !== nextProps.contents ||
                this.props.sortDirectoriesFirst !== nextProps.sortDirectoriesFirst;
        },
        
        render: function () {
            var ulProps = this.props.isRoot ? {
                className: "jstree-no-dots jstree-no-icons"
            } : null;
            
            var contents = this.props.contents,
                namesInOrder = _sortDirectoryContents(contents, this.props.sortDirectoriesFirst);
            
            return DOM.ul(ulProps, namesInOrder.map(function (name) {
                var entry = contents.get(name);

                if (FileTreeViewModel.isFile(entry)) {
                    return fileNode({
                        parentPath: this.props.parentPath,
                        name: name,
                        entry: entry,
                        actions: this.props.actions,
                        key: name
                    });
                } else {
                    return directoryNode({
                        parentPath: this.props.parentPath,
                        name: name,
                        entry: entry,
                        actions: this.props.actions,
                        sortDirectoriesFirst: this.props.sortDirectoriesFirst,
                        key: name
                    });
                }
            }.bind(this)).toArray());
        }
    });
    
    /**
     * @private
     * 
     * This is the root component of the file tree.
     * 
     * Props:
     * * treeData: the root of the tree (an Immutable.Map with the contents of the project root)
     * * sortDirectoriesFirst: whether the directories should be displayed first when listing the contents of a directory
     * * parentPath: the full path of the directory containing this file
     * * actions: the action creator responsible for communicating actions the user has taken
     */
    var fileTreeView = React.createClass({
        
        /**
         * Update for any change in the tree data or directory sorting preference.
         */
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
                actions: this.props.actions
            });
        }
        
    });
    
    /**
     * Renders the file tree to the given element.
     * 
     * @param {DOMNode|jQuery} element Element in which to render this file tree
     * @param {FileTreeViewModel} viewModel the data container
     * @param {Directory} projectRoot Directory object from which the fullPath of the project root is extracted
     * @param {ActionCreator} actions object with methods used to communicate events that originate from the user
     */
    function render(element, viewModel, projectRoot, actions) {
        $(element).addClass("jstree jstree-brackets");
        $(element).css("overflow", "auto");
        if (!projectRoot) {
            return;
        }
        
        React.renderComponent(fileTreeView({
            treeData: viewModel.treeData,
            sortDirectoriesFirst: viewModel.sortDirectoriesFirst,
            parentPath: projectRoot.fullPath,
            actions: actions
        }),
              element);
    }
    
    // Private API for testing
    exports._sortFormattedDirectory = _sortDirectoryContents;
    exports._fileNode = fileNode;
    exports._directoryNode = directoryNode;
    exports._directoryContents = directoryContents;
    exports._fileTreeView = fileTreeView;
    
    // Public API
    exports.render = render;
});
