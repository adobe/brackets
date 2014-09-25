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

    var React             = require("thirdparty/react"),
        Immutable         = require("thirdparty/immutable"),
        _                 = require("thirdparty/lodash"),
        FileUtils         = require("file/FileUtils"),
        FileTreeViewModel = require("project/FileTreeViewModel"),
        ViewUtils         = require("utils/ViewUtils"),
        KeyEvent          = require("utils/KeyEvent");

    var DOM = React.DOM;

    /**
     * @private
     * @type {Immutable.Map}
     * 
     * Stores the file tree extensions for adding classes and icons. The keys of the map
     * are the "categories" of the extensions and values are vectors of the callback functions.
     */
    var _extensions = Immutable.Map();

    // Constants

    // Time range from first click to second click to invoke renaming.
    var CLICK_RENAME_MINIMUM = 500,
        LEFT_MOUSE_BUTTON = 0;

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
            var result = this.props.parentPath + this.props.name;

            // Add trailing slash for directories
            if (!FileTreeViewModel.isFile(this.props.entry) && _.last(result) !== "/") {
                result += "/";
            }

            return result;
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
            if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                this.props.actions.cancelRename();
            } else if (e.keyCode === KeyEvent.DOM_VK_RETURN) {
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
            var measuringElement = $("<div />", { css : { "position" : "absolute", "top" : "-200px", "left" : ("-1000px"), "visibility" : "hidden" } }).appendTo("body");
            measuringElement.text("pW" + this.props.name);
            var width = measuringElement.width();
            measuringElement.remove();

            return DOM.input({
                className: "jstree-rename-input",
                type: "text",
                defaultValue: this.props.name,
                autoFocus: true,
                onKeyDown: this.handleKeyDown,
                onKeyUp: this.handleKeyUp,
                style: {
                    width: width
                },
                ref: "name"
            });
        }
    });

    /**
     * @private
     *
     * This mixin handles middle click action to make a file the "context" object for performing
     * operations like rename.
     */
    var contextSettable = {

        /**
         * Send middle click to the action creator as a setContext action.
         */
        handleMouseDown: function (e) {
            if (e.button === 2) {
                this.props.actions.setContext(this.myPath());
            }
            return false;
        }
    };

    /**
     * @private
     *
     * Returns true if the value is defined (used in `.filter`)
     *
     * @param {Object} value value to test
     * @return {boolean} true if value is defined
     */
    function isDefined(value) {
        return value !== undefined;
    }

    /**
     * Mixin for components that support the "icons" and "addClass" extension points.
     * `fileNode` and `directoryNode` support this.
     */
    var extendable = {

        /**
         * Calls the icon providers to get the collection of icons (most likely just one) for
         * the current file or directory.
         *
         * @return {Array.<ReactComponent>} icon components to render
         */
        getIcons: function () {
            var result,
                extensions = this.props.extensions;

            if (extensions && extensions.get("icons")) {
                var data = this.getDataForExtension();
                result = extensions.get("icons").map(function (callback) {
                    try {
                        var result = callback(data);
                        if (!React.isValidComponent(result)) {
                            result = React.DOM.span({
                                dangerouslySetInnerHTML: {
                                    __html: $(result)[0].outerHTML
                                }
                            });
                        }
                        return result;
                    } catch (e) {
                        console.warn("Exception thrown in FileTreeView icon provider:", e);
                    }
                }).filter(isDefined).toArray();
            }

            if (!result || result.length === 0) {
                result = [DOM.ins({
                    className: "jstree-icon"
                }, " ")];
            }
            return result;
        },

        /**
         * Calls the addClass providers to get the classes (in string form) to add for the current
         * file or directory.
         *
         * @param {string} classes Initial classes for this node
         * @return {string} classes for the current node
         */
        getClasses: function (classes) {
            var extensions = this.props.extensions;

            if (extensions && extensions.get("addClass")) {
                var data = this.getDataForExtension();
                classes = classes + " " + extensions.get("addClass").map(function (callback) {
                    try {
                        return callback(data);
                    } catch (e) {
                        console.warn("Exception thrown in FileTreeView addClass provider:", e);
                    }
                }).filter(isDefined).toArray().join(" ");
            }

            return classes;
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
     * * extensions: registered extensions for the file tree
     * * forceRender: causes the component to run render
     */
    var fileNode = React.createClass({
        mixins: [contextSettable, pathComputer, extendable],

        /**
         * Ensures that we always have a state object.
         */
        getInitialState: function () {
            return {
            };
        },

        /**
         * Thanks to immutable objects, we can just do a start object identity check to know
         * whether or not we need to re-render.
         */
        shouldComponentUpdate: function (nextProps, nextState) {
            return nextProps.forceRender ||
                this.props.entry !== nextProps.entry ||
                this.props.extensions !== nextProps.extensions;
        },

        /**
         * If this node is newly selected, scroll it into view. Also, move the selection or
         * context boxes as appropriate.
         */
        componentDidUpdate: function (prevProps, prevState) {
            if (this.props.entry.get("selected") && !prevProps.entry.get("selected")) {
                // TODO: This shouldn't really know about project-files-container
                // directly. It is probably the case that our React tree should actually
                // start with project-files-container instead of just the interior of
                // project-files-container and then the file tree will be one self-contained
                // functional unit.
                ViewUtils.scrollElementIntoView($("#project-files-container"), $(this.getDOMNode()), true);
            }
        },

        /**
         * When the user clicks on the node, we'll either select it or, if they've clicked twice
         * with a bit of delay in between, we'll invoke the `startRename` action.
         */
        handleClick: function (e) {
            if (e.button !== LEFT_MOUSE_BUTTON) {
                return;
            }
            
            // If the user clicks twice within 500ms, that will be picked up by the double click handler
            // If they click on the node twice with a pause, we'll start a rename.
            if (this.props.entry.get("selected") && this.state.clickTime) {
                var timeSincePreviousClick = new Date().getTime() - this.state.clickTime;
                if (!this.props.entry.get("rename") && (timeSincePreviousClick > CLICK_RENAME_MINIMUM)) {
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

        /**
         * Create the data object to pass to extensions.
         *
         * @return {{name: {string}, isFile: {boolean}, fullPath: {string}}} Data for extensions
         */
        getDataForExtension: function () {
            return {
                name: this.props.name,
                isFile: true,
                fullPath: this.myPath()
            };
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
                fileClasses += "jstree-clicked selected-node";
            }
            
            if (this.props.entry.get("context")) {
                fileClasses += "context-node";
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
                // Need to flatten the argument list because getIcons returns an array
                var aArgs = _.flatten([{
                    href: "#",
                    className: fileClasses
                }, this.getIcons(), name, extension], true);
                nameDisplay = DOM.a.apply(DOM.a, aArgs);
            }

            return DOM.li({
                className: this.getClasses("jstree-leaf"),
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
            return contents.keySeq().sort(_buildDirsFirstComparator(contents));
        } else {
            return contents.keySeq().sort(FileUtils.compareFilenames);
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
     * * name: the name of the directory
     * * entry: the object with the relevant metadata for the file (whether it's selected or is the context file)
     * * actions: the action creator responsible for communicating actions the user has taken
     * * sortDirectoriesFirst: whether the directories should be displayed first when listing the contents of a directory
     * * extensions: registered extensions for the file tree
     * * forceRender: causes the component to run render
     */
    directoryNode = React.createClass({
        mixins: [contextSettable, pathComputer, extendable],

        /**
         * We need to update this component if the sort order changes or our entry object
         * changes. Thanks to immutability, if any of the directory contents change, our
         * entry object will change.
         */
        shouldComponentUpdate: function (nextProps, nextState) {
            return nextProps.forceRender ||
                this.props.entry !== nextProps.entry ||
                this.props.sortDirectoriesFirst !== nextProps.sortDirectoriesFirst ||
                this.props.extensions !== nextProps.extensions;
        },

        /**
         * If you click on a directory, it will toggle between open and closed.
         */
        handleClick: function (event) {
            if (event.button !== LEFT_MOUSE_BUTTON) {
                return;
            }
            
            var isOpen = this.props.entry.get("open"),
                setOpen = isOpen ? false : true;
            
            if (event.metaKey || event.ctrlKey) {
                // ctrl-alt-click toggles this directory and its children
                if (event.altKey) {
                    if (setOpen) {
                        // when opening, we only open the immediate children because
                        // opening a whole subtree could be really slow (consider
                        // a `node_modules` directory, for example).
                        this.props.actions.toggleSubdirectories(this.myPath(), setOpen);
                        this.props.actions.setDirectoryOpen(this.myPath(), setOpen);
                    } else {
                        // When closing, we recursively close the whole subtree.
                        this.props.actions.closeSubtree(this.myPath());
                    }
                } else {
                    // ctrl-click toggles the sibling directories
                    this.props.actions.toggleSubdirectories(this.props.parentPath, setOpen);
                }
            } else {
                // directory toggle with no modifier
                this.props.actions.setDirectoryOpen(this.myPath(), setOpen);
            }
            return false;
        },

        /**
         * Create the data object to pass to extensions.
         *
         * @return {{name: {string}, isFile: {boolean}, fullPath: {string}}} Data for extensions
         */
        getDataForExtension: function () {
            return {
                name: this.props.name,
                isFile: false,
                fullPath: this.myPath()
            };
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
                    extensions: this.props.extensions,
                    actions: this.props.actions,
                    forceRender: this.props.forceRender,
                    sortDirectoriesFirst: this.props.sortDirectoriesFirst
                });
            } else {
                nodeClass = "closed";
            }

            if (this.props.entry.get("selected")) {
                directoryClasses += " jstree-clicked sidebar-selection";
            }

            if (entry.get("context")) {
                directoryClasses += " context-node";
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
                // Need to flatten the arguments because getIcons returns an array
                var aArgs = _.flatten([{
                    href: "#",
                    className: directoryClasses
                }, this.getIcons(), this.props.name], true);
                nameDisplay = DOM.a.apply(DOM.a, aArgs);
            }

            return DOM.li({
                className: this.getClasses("jstree-" + nodeClass),
                onClick: this.handleClick,
                onMouseDown: this.handleMouseDown
            },
                DOM.ins({
                    className: "jstree-icon"
                }, " "),
                nameDisplay,
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
     * * extensions: registered extensions for the file tree
     * * forceRender: causes the component to run render
     */
    directoryContents = React.createClass({

        /**
         * Need to re-render if the sort order or the contents change.
         */
        shouldComponentUpdate: function (nextProps, nextState) {
            return nextProps.forceRender ||
                this.props.contents !== nextProps.contents ||
                this.props.sortDirectoriesFirst !== nextProps.sortDirectoriesFirst ||
                this.props.extensions !== nextProps.extensions;
        },

        render: function () {
            var extensions = this.props.extensions,
                iconClass = extensions && extensions.get("icons") ? "jstree-icons" : "jstree-no-icons",
                ulProps = this.props.isRoot ? {
                    className: "jstree-no-dots " + iconClass
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
                        extensions: this.props.extensions,
                        forceRender: this.props.forceRender,
                        key: name
                    });
                } else {
                    return directoryNode({
                        parentPath: this.props.parentPath,
                        name: name,
                        entry: entry,
                        actions: this.props.actions,
                        extensions: this.props.extensions,
                        sortDirectoriesFirst: this.props.sortDirectoriesFirst,
                        forceRender: this.props.forceRender,
                        key: name
                    });
                }
            }.bind(this)).toArray());
        }
    });

    /**
     * Displays the absolutely positioned box for the selection or context in the
     * file tree. Its position is determined by passed-in info about the scroller in which
     * the tree resides and the top of the selected node (as reported by the node itself).
     * 
     * Props:
     * * selectionViewInfo: Immutable.Map with width, scrollTop, scrollLeft and offsetTop for the tree container
     * * visible: should this be visible now
     * * widthAdjustment: if this box should not fill the entire width, pass in a positive number here which is subtracted from the width in selectionViewInfo
     */
    var fileSelectionBox = React.createClass({
        
        /**
         * Sets up initial state.
         */
        getInitialState: function () {
            return {
                initialScroll: 0
            };
        },
        
        /**
         * When the component has updated in the DOM, reposition it to where the currently
         * selected node is located now.
         */
        componentDidUpdate: function () {
            if (!this.props.visible) {
                return;
            }
            
            var node = this.getDOMNode(),
                selectedNode = $(node.parentNode).find(this.props.selectedClassName),
                selectionViewInfo = this.props.selectionViewInfo;

            if (selectedNode.length === 0) {
                return;
            }
            
            node.style.top = selectedNode.offset().top - selectionViewInfo.get("offsetTop") + selectionViewInfo.get("scrollTop") + "px";
        },
        
        render: function () {
            var selectionViewInfo = this.props.selectionViewInfo,
                style = {
                    overflow: "auto",
                    left: selectionViewInfo.get("scrollLeft"),
                    width: selectionViewInfo.get("width") - this.props.widthAdjustment,
                    visibility: this.props.visible ? "visible" : "hidden"
                };
            
            if (!this.props.visible) {
                style.width = 0;
                style.top = 0;
            }
            
            return DOM.div({
                style: style,
                className: this.props.className
            });
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
     * * extensions: registered extensions for the file tree
     * * forceRender: causes the component to run render
     */
    var fileTreeView = React.createClass({

        /**
         * Update for any change in the tree data or directory sorting preference.
         */
        shouldComponentUpdate: function (nextProps, nextState) {
            return nextProps.forceRender ||
                this.props.treeData !== nextProps.treeData ||
                this.props.sortDirectoriesFirst !== nextProps.sortDirectoriesFirst ||
                this.props.extensions !== nextProps.extensions ||
                this.props.selectionViewInfo !== nextProps.selectionViewInfo;
        },
        
        render: function () {
            var selectionBackground = fileSelectionBox({
                ref: "selectionBackground",
                selectionViewInfo: this.props.selectionViewInfo,
                className: "filetree-selection",
                visible: this.props.selectionViewInfo.get("hasSelection"),
                widthAdjustment: 0,
                selectedClassName: ".selected-node",
                forceUpdate: true
            }),
                contextBackground = fileSelectionBox({
                    ref: "contextBackground",
                    selectionViewInfo: this.props.selectionViewInfo,
                    className: "filetree-context",
                    visible: this.props.selectionViewInfo.get("hasContext"),
                    widthAdjustment: 2,
                    selectedClassName: ".context-node",
                    forceUpdate: true
                });
            
            return DOM.div(
                null,
                selectionBackground,
                contextBackground,
                directoryContents({
                    isRoot: true,
                    parentPath: this.props.parentPath,
                    sortDirectoriesFirst: this.props.sortDirectoriesFirst,
                    contents: this.props.treeData,
                    extensions: this.props.extensions,
                    actions: this.props.actions,
                    forceRender: this.props.forceRender
                })
            );
        }
    });

    /**
     * Renders the file tree to the given element.
     *
     * @param {DOMNode|jQuery} element Element in which to render this file tree
     * @param {FileTreeViewModel} viewModel the data container
     * @param {Directory} projectRoot Directory object from which the fullPath of the project root is extracted
     * @param {ActionCreator} actions object with methods used to communicate events that originate from the user
     * @param {boolean} forceRender Run render on the entire tree (useful if an extension has new data that it needs rendered)
     */
    function render(element, viewModel, projectRoot, actions, forceRender) {
        if (!projectRoot) {
            return;
        }

        React.renderComponent(fileTreeView({
            treeData: viewModel.treeData,
            selectionViewInfo: viewModel.selectionViewInfo,
            sortDirectoriesFirst: viewModel.sortDirectoriesFirst,
            parentPath: projectRoot.fullPath,
            actions: actions,
            extensions: _extensions,
            forceRender: forceRender
        }),
              element);
    }

    /**
     * @private
     *
     * Add an extension for the given category (icons, addClass).
     *
     * @param {string} category Category to which the extension is being added
     * @param {function} callback The extension function itself
     */
    function _addExtension(category, callback) {
        if (!callback || typeof callback !== "function") {
            console.error("Attempt to add FileTreeView", category, "extension without a callback function");
            return;
        }
        var callbackList = _extensions.get(category);
        if (!callbackList) {
            callbackList = Immutable.Vector();
        }
        callbackList = callbackList.push(callback);
        _extensions = _extensions.set(category, callbackList);
    }

    /**
     * Adds an icon provider. The icon provider is a function which takes a data object and
     * returns a React.DOM.ins instance for the icons within the tree. The callback can
     * alternatively return a string, DOM node or a jQuery object for the ins node to be added.
     *
     * The data object contains:
     *
     * * `name`: the file or directory name
     * * `fullPath`: full path to the file or directory
     * * `isFile`: true if it's a file, false if it's a directory
     */
    function addIconProvider(callback) {
        _addExtension("icons", callback);
    }

    /**
     * Adds an additional classes provider which can return classes that should be added to a
     * given file or directory in the tree.
     *
     * The data object contains:
     *
     * * `name`: the file or directory name
     * * `fullPath`: full path to the file or directory
     * * `isFile`: true if it's a file, false if it's a directory
     */
    function addClassesProvider(callback) {
        _addExtension("addClass", callback);
    }

    // Private API for testing
    exports._sortFormattedDirectory = _sortDirectoryContents;
    exports._fileNode = fileNode;
    exports._directoryNode = directoryNode;
    exports._directoryContents = directoryContents;
    exports._fileTreeView = fileTreeView;

    // Public API
    exports.addIconProvider = addIconProvider;
    exports.addClassesProvider = addClassesProvider;
    exports.render = render;
});
