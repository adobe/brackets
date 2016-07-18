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

/*global define */
/*unittests: FileTreeViewModel*/

/**
 * The view model (or a Store in the Flux terminology) used by the file tree.
 *
 * Many of the view model's methods are implemented by pure functions, which can be
 * helpful for composability. Many of the methods commit the new treeData and send a
 * change event when they're done whereas the functions do not do this.
 */
define(function (require, exports, module) {
    "use strict";

    var Immutable           = require("thirdparty/immutable"),
        _                   = require("thirdparty/lodash"),
        EventDispatcher     = require("utils/EventDispatcher"),
        FileUtils           = require("file/FileUtils");

    // Constants
    var EVENT_CHANGE = "change";

    /**
     * Determine if an entry from the treeData map is a file.
     *
     * @param {Immutable.Map} entry entry to test
     * @return {boolean} true if this is a file and not a directory
     */
    function isFile(entry) {
        return entry.get("children") === undefined;
    }

    /**
     * @constructor
     *
     * Contains the treeData used to generate the file tree and methods used to update that
     * treeData.
     *
     * Instances dispatch the following events:
     * - "change" (FileTreeViewModel.EVENT_CHANGE constant): Fired any time there's a change that should be reflected in the view.
     */
    function FileTreeViewModel() {
        // For convenience in callbacks, make a bound version of this method so that we can
        // just refer to it as this._commit when passing in a callback.
        this._commit = this._commit.bind(this);
    }
    EventDispatcher.makeEventDispatcher(FileTreeViewModel.prototype);

    /**
     * @type {boolean}
     *
     * Preference for whether directories should all be sorted to the top of listings
     */
    FileTreeViewModel.prototype.sortDirectoriesFirst = false;

    /**
     * @type {Immutable.Map}
     * @private
     *
     * The data for the tree. Some notes about its structure:
     *
     * * It starts with a Map for the project root's contents.
     * * Each directory entry has a `children` key.
     *     * `children` will be null if the directory has not been loaded
     *     * An `open` key denotes whether the directory is open
     * * Most file entries are just empty maps
     *     * They can have flags like selected, context, rename, create with state information for the tree
     */
    FileTreeViewModel.prototype._treeData = Immutable.Map();

    Object.defineProperty(FileTreeViewModel.prototype, "treeData", {
        get: function () {
            return this._treeData;
        }
    });

    /**
     * @private
     * @type {Immutable.Map}
     * Selection view information determines how the selection bar appears.
     *
     * * width: visible width of the selection area
     * * scrollTop: current scroll position.
     * * scrollLeft: current horizontal scroll position
     * * offsetTop: top of the scroller element
     * * hasSelection: is the selection bar visible?
     * * hasContext: is the context bar visible?
     */
    FileTreeViewModel.prototype._selectionViewInfo = Immutable.Map({
        width: 0,
        scrollTop: 0,
        scrollLeft: 0,
        offsetTop: 0,
        hasContext: false,
        hasSelection: false
    });

    Object.defineProperty(FileTreeViewModel.prototype, "selectionViewInfo", {
        get: function () {
            return this._selectionViewInfo;
        }
    });

    /**
     * @private
     *
     * If the project root changes, we reset the tree data so that everything will be re-read.
     */
    FileTreeViewModel.prototype._rootChanged = function () {
        this._treeData = Immutable.Map();
    };

    /**
     * @private
     *
     * The FileTreeViewModel is like a database for storing the directory contents and its
     * state moves atomically from one value to the next. This method stores the next version
     * of the state, if it has changed, and triggers a change event so that the UI can update.
     *
     * @param {?Immutable.Map} treeData new treeData state
     * @param {?Immutable.Map} selectionViewInfo updated information for the selection/context bars
     */
    FileTreeViewModel.prototype._commit = function (treeData, selectionViewInfo) {
        var changed = false;
        if (treeData && treeData !== this._treeData) {
            this._treeData = treeData;
            changed = true;
        }

        if (selectionViewInfo && selectionViewInfo !== this._selectionViewInfo) {
            this._selectionViewInfo = selectionViewInfo;
            changed = true;
        }
        if (changed) {
            this.trigger(EVENT_CHANGE);
        }
    };

    /**
     * @private
     *
     * Converts a project-relative file path into an object path array suitable for
     * `Immutable.Map.getIn` and `Immutable.Map.updateIn`.
     *
     * The root path is "".
     *
     * @param {Immutable.Map} treeData
     * @param {string} path project relative path to the file or directory. Can include trailing slash.
     * @return {Array.<string>|null} Returns null if the path can't be found in the tree, otherwise an array of strings representing the path through the object.
     */
    function _filePathToObjectPath(treeData, path) {
        if (path === null) {
            return null;
        } else if (path === "") {
            return [];
        }

        var parts = path.split("/"),
            part = parts.shift(),
            result = [],
            node;

        // Step through the parts of the path and the treeData object simultaneously
        while (part) {
            // We hit the end of the tree without finding our object, so return null
            if (!treeData) {
                return null;
            }

            node = treeData.get(part);

            // The name represented by `part` isn't in the tree, so return null.
            if (node === undefined) {
                return null;
            }

            // We've verified this part, so store it.
            result.push(part);

            // Pull the next part of the path
            part = parts.shift();

            // If we haven't passed the end of the path string, then the object we've got in hand
            // *should* be a directory. Confirm that and add `children` to the path to move down
            // to the next directory level.
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
     *
     * See `FileTreeViewModel.isFilePathVisible`
     */
    function _isFilePathVisible(treeData, path) {
        if (path === null) {
            return null;
        } else if (path === "") {
            return true;
        }

        var parts = path.split("/"),
            part = parts.shift(),
            result = [],
            node;

        while (part) {
            if (treeData === null) {
                return false;
            }
            node = treeData.get(part);
            if (node === undefined) {
                return null;
            }
            result.push(part);
            part = parts.shift();
            if (part) {
                if (!node.get("open")) {
                    return false;
                }
                treeData = node.get("children");
                if (treeData) {
                    result.push("children");
                }
            }
        }

        return true;
    }

    /**
     * Determines if a given file path is visible within the tree.
     *
     * For detailed documentation on how the loop works, see `_filePathToObjectPath` which
     * follows the same pattern. This differs from that function in that this one checks for
     * the open state of directories and has a different return value.
     *
     * @param {string} path project relative file path
     * @return {boolean|null} true if the given path is currently visible in the tree, null if the given path is not present in the tree.
     */
    FileTreeViewModel.prototype.isFilePathVisible = function (path) {
        return _isFilePathVisible(this._treeData, path);
    };

    /**
     * Determines if a given path has been loaded.
     *
     * @param {string} path project relative file or directory path
     * @return {boolean} true if the path has been loaded
     */
    FileTreeViewModel.prototype.isPathLoaded = function (path) {
        var objectPath = _filePathToObjectPath(this._treeData, path);

        if (!objectPath) {
            return false;
        }

        // If it's a directory, make sure that its children are loaded
        if (_.last(path) === "/") {
            var directory = this._treeData.getIn(objectPath);
            if (!directory.get("children") || directory.get("notFullyLoaded")) {
                return false;
            }
        }

        return true;
    };

    /**
     * @private
     *
     * See `FileTreeViewModel.getOpenNodes`.
     */
    function _getOpenNodes(treeData, projectRootPath) {
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
                    addNodesAtDepth(value.get("children"), directoryPath, depth + 1);
                }
            });
        }

        // start at the top of the tree and the first array element
        addNodesAtDepth(treeData, projectRootPath, 0);
        return openNodes;
    }

    /**
     * @private
     * TODO: merge with _getOpenNodes?!
     * See `FileTreeViewModel.getChildNodes`.
     */
    function _getChildDirectories(treeData, projectRootPath) {
        var childDirectories = [];

        function addNodesAtDepth(treeData, parent, depth) {
            if (!treeData) {
                return;
            }

            treeData.forEach(function (value, key) {
                if (!isFile(value)) {
                    var directoryPath = key + "/";

                    childDirectories.push(directoryPath);
                }
            });
        }

        // start at the top of the tree and the first array element
        addNodesAtDepth(treeData, projectRootPath, 0);
        return childDirectories;
    }

    /**
     * Creates an array of arrays where each entry of the top-level array has an array
     * of paths that are at the same depth in the tree. All of the paths are full paths.
     *
     * This is used for saving the current set of open nodes to the preferences system
     * for restoring on project open.
     *
     * @param {string} projectRootPath Full path to the project root
     * @return {Array.<Array.<string>>} Array of array of full paths, organized by depth in the tree.
     */
    FileTreeViewModel.prototype.getOpenNodes = function (projectRootPath) {
        return _getOpenNodes(this._treeData, projectRootPath);
    };

    FileTreeViewModel.prototype.getChildDirectories = function (parent) {
        var treeData = this._treeData,
            objectPath = _filePathToObjectPath(treeData, parent);

        if (!objectPath) {
            return;
        }

        var children;
        if (objectPath.length === 0) {
            // this is the root of the tree
            children = this._treeData;
        } else {
            objectPath.push("children");
            children = this._treeData.getIn(objectPath);
        }

        return _getChildDirectories(children, parent);
    };

    /**
     * @private
     *
     * The Immutable package does not have a `setIn` method, which is what this effectively
     * provides. This is a simple function that does an `updateIn` on treeData, replacing
     * the current value with the new one.
     *
     * @param {Immutable.Map} treeData
     * @param {Array.<string>} objectPath path to object that should be replaced
     * @param {Immutable.Map} newValue new value to provide at that path
     * @return {Immutable.Map} updated treeData
     */
    function _setIn(treeData, objectPath, newValue) {
        return treeData.updateIn(objectPath, function (oldValue) {
            return newValue;
        });
    }

    /**
     * @private
     *
     * See `FileTreeViewModel.moveMarker`
     */
    function _moveMarker(treeData, markerName, oldPath, newPath) {
        var objectPath;

        if (newPath) {
            objectPath = _filePathToObjectPath(treeData, newPath);
        }

        var newTreeData = treeData;

        if (oldPath && oldPath !== newPath) {
            var lastObjectPath = _filePathToObjectPath(treeData, oldPath);
            if (lastObjectPath) {
                newTreeData = newTreeData.updateIn(lastObjectPath, function (entry) {
                    return entry.delete(markerName);
                });
            }
        }

        if (newPath && objectPath && objectPath.length !== 0) {
            newTreeData = newTreeData.updateIn(objectPath, function (entry) {
                return entry.set(markerName, true);
            });
        }

        return newTreeData;
    }

    /**
     * Moves a boolean marker flag from one file path to another.
     *
     * @param {string} markerName Name of the flag to set (for example, "selected")
     * @param {string|null} oldPath Project relative file path with the location of the marker to move, or null if it's not being moved from elsewhere in the tree
     * @param {string|null} newPath Project relative file path with where to place the marker, or null if the marker is being removed from the tree
     */
    FileTreeViewModel.prototype.moveMarker = function (markerName, oldPath, newPath) {
        var newTreeData = _moveMarker(this._treeData, markerName, oldPath, newPath),
            selectionViewInfo = this._selectionViewInfo;

        if (markerName === "selected") {
            selectionViewInfo = selectionViewInfo.set("hasSelection", !!newPath);
        } else if (markerName === "context") {
            selectionViewInfo = selectionViewInfo.set("hasContext", !!newPath);
        }
        this._commit(newTreeData, selectionViewInfo);
    };

    /**
     * Changes the name of the item at the `currentPath` to `newName`.
     *
     * @param {string} currentPath project relative file path to the current item
     * @param {string} newName Name to give the item
     */
    FileTreeViewModel.prototype.renameItem = function (currentPath, newName) {
        var treeData = this._treeData,
            objectPath = _filePathToObjectPath(treeData, currentPath);

        if (!objectPath) {
            return;
        }

        var originalName = _.last(objectPath),
            currentObject = treeData.getIn(objectPath);

        // Back up to the parent directory
        objectPath.pop();

        treeData = treeData.updateIn(objectPath, function (directory) {
            directory = directory.delete(originalName);
            directory = directory.set(newName, currentObject);
            return directory;
        });

        this._commit(treeData);
    };

    /**
     * @private
     *
     * See `FileTreeViewModel.setDirectoryOpen`
     */
    function _setDirectoryOpen(treeData, path, open) {
        var objectPath = _filePathToObjectPath(treeData, path),
            directory = treeData.getIn(objectPath);

        if (!objectPath) {
            return {
                needsLoading: true,
                treeData: treeData
            };
        }

        if (isFile(directory)) {
            return;
        }

        var alreadyOpen = directory.get("open") === true;

        if ((alreadyOpen && open) || (!alreadyOpen && !open)) {
            return;
        }

        treeData = treeData.updateIn(objectPath, function (directory) {
            if (open) {
                return directory.set("open", true);
            } else {
                return directory.delete("open");
            }
        });

        if (open && (directory.get("children") === null || directory.get("notFullyLoaded"))) {
            return {
                needsLoading: true,
                treeData: treeData
            };
        }
        return {
            needsLoading: false,
            treeData: treeData
        };
    }

    /**
     * Sets the directory at the given path to open or closed. Returns true if the directory
     * contents need to be loaded.
     *
     * @param {string} path Project relative file path to the directory
     * @param {boolean} open True to open the directory
     * @return {boolean} true if the directory contents need to be loaded.
     */
    FileTreeViewModel.prototype.setDirectoryOpen = function (path, open) {
        var result = _setDirectoryOpen(this._treeData, path, open);
        if (result && result.treeData) {
            this._commit(result.treeData);
        }
        return result ? result.needsLoading : false;
    };

    /**
     * Returns the object at the given file path.
     *
     * @param {string} path Path to the object
     * @return {Immutable.Map=} directory or file object from the tree. Null if it's not found.
     */
    FileTreeViewModel.prototype._getObject = function (path) {
        var objectPath = _filePathToObjectPath(this._treeData, path);
        if (!objectPath) {
            return null;
        }
        return this._treeData.getIn(objectPath);
    };

    /**
     * Closes a subtree path, given by an object path.
     *
     * @param {Immutable.Map} directory Current directory
     * @return {Immutable.Map} new directory
     */
    function _closeSubtree(directory) {
        directory = directory.delete("open");

        var children = directory.get("children");
        if (children) {
            children.keySeq().forEach(function (name) {
                var subdir = children.get(name);
                if (!isFile(subdir)) {
                    subdir = _closeSubtree(subdir);
                    children = children.set(name, subdir);
                }
            });
        }

        directory = directory.set("children", children);
        return directory;
    }

    /**
     * Closes the directory at path and recursively closes all of its children.
     *
     * @param {string} path Path of subtree to close
     */
    FileTreeViewModel.prototype.closeSubtree = function (path) {
        var treeData = this._treeData,
            subtreePath = _filePathToObjectPath(treeData, path);

        if (!subtreePath) {
            return;
        }

        var directory = treeData.getIn(subtreePath);

        directory = _closeSubtree(directory);
        treeData = _setIn(treeData, subtreePath, directory);
        this._commit(treeData);
    };

    /**
     * @private
     *
     * Takes an array of file system entries and merges them into the children map
     * of a directory in the view model treeData.
     *
     * @param {Immutable.Map} children current children in the directory
     * @param {Array.<FileSystemEntry>} contents FileSystemEntry objects currently in the directory
     * @return {Immutable.Map} updated children
     */
    function _mergeContentsIntoChildren(children, contents) {

        // We keep track of the names we've seen among the current directory entries to make
        // it easy to spot the names that we *haven't* seen (in other words, files that have
        // been deleted).
        var keysSeen = [];

        children = children.withMutations(function (children) {

            // Loop through the directory entries
            contents.forEach(function (entry) {
                keysSeen.push(entry.name);

                var match = children.get(entry.name);
                if (match) {
                    // Confirm that a name that used to represent a file and now represents a
                    // directory (or vice versa) isn't what we've encountered here. If we have
                    // hit this situation, pretend the current child of treeData doesn't exist
                    // so we can replace it.
                    var matchIsFile = isFile(match);
                    if (matchIsFile !== entry.isFile) {
                        match = undefined;
                    }
                }

                // We've got a new entry that we need to add.
                if (!match) {
                    if (entry.isFile) {
                        children.set(entry.name, Immutable.Map());
                    } else {
                        children.set(entry.name, Immutable.Map({
                            children: null
                        }));
                    }
                }
            });

            // Look at the list of names that we currently have in the treeData that no longer
            // appear in the directory and delete those.
            var currentEntries = children.keySeq().toJS(),
                deletedEntries = _.difference(currentEntries, keysSeen);

            deletedEntries.forEach(function (name) {
                children.delete(name);
            });
        });
        return children;
    }

    /**
     * @private
     *
     * Creates a directory object (or updates an existing directory object) to look like one
     * that has not yet been loaded, but in which we want to start displaying entries.
     * @param {Immutable.Map=} directory Directory entry to update
     * @return {Immutable.Map} New or updated directory object
     */
    function _createNotFullyLoadedDirectory(directory) {
        if (!directory) {
            return Immutable.Map({
                notFullyLoaded: true,
                children: Immutable.Map()
            });
        }
        return directory.merge({
            notFullyLoaded: true,
            children: Immutable.Map()
        });
    }

    /**
     * @private
     *
     * Creates the directories necessary to display the given path, even if those directories
     * do not yet exist in the tree and have not been loaded.
     *
     * @param {Immutable.Map} treeData
     * @param {string} path Path to the final directory to be added in the tree
     * @return {{treeData: Immutable.Map, objectPath: Array.<string>}} updated treeData and object path to the created object
     */
    function _createIntermediateDirectories(treeData, path) {
        var objectPath = [],
            result = {
                objectPath: objectPath,
                treeData: treeData
            },
            treePointer = treeData;

        if (path === "") {
            return result;
        }

        var parts = path.split("/"),
            part = parts.shift(),
            node;

        while (part) {
            if (treePointer === null) {
                return null;
            }
            node = treePointer.get(part);
            objectPath.push(part);

            // This directory is missing, so create it.
            if (node === undefined) {
                treeData = treeData.updateIn(objectPath, _createNotFullyLoadedDirectory);
                node = treeData.getIn(objectPath);
            }

            part = parts.shift();
            if (part) {
                treePointer = node.get("children");

                if (treePointer) {
                    objectPath.push("children");
                } else {

                    // The directory is there, but the directory hasn't been loaded.
                    // Update the directory to be a `notFullyLoaded` directory.
                    treeData = treeData.updateIn(objectPath, _createNotFullyLoadedDirectory);
                    objectPath.push("children");
                    treePointer = treeData.getIn(objectPath);
                }
            }
        }

        result.treeData = treeData;
        return result;
    }

    /**
     * Updates the directory at the given path with the new contents. If the parent directories
     * of this directory have not been loaded yet, they will be created. This allows directories
     * to be loaded in any order.
     *
     * @param {string} Project relative path to the directory that is being updated.
     * @param {Array.<FileSystemEntry>} Current contents of the directory
     */
    FileTreeViewModel.prototype.setDirectoryContents = function (path, contents) {
        path = FileUtils.stripTrailingSlash(path);

        var intermediate = _createIntermediateDirectories(this._treeData, path),
            objectPath = intermediate.objectPath,
            treeData = intermediate.treeData;

        if (objectPath === null) {
            return;
        }

        var directory = treeData.getIn(objectPath),
            children = directory;

        // The root directory doesn't need this special handling.
        if (path !== "") {

            // The user of this API passed in a path to a file rather than a directory.
            // Perhaps this should be an exception?
            if (isFile(directory)) {
                return;
            }

            // If the directory had been created previously as `notFullyLoaded`, we can
            // remove that flag now because this is the step that is loading the directory.
            if (directory.get("notFullyLoaded")) {
                directory = directory.delete("notFullyLoaded");
            }

            if (!directory.get("children")) {
                directory = directory.set("children", Immutable.Map());
            }

            treeData = _setIn(treeData, objectPath, directory);

            objectPath.push("children");
            children = directory.get("children");
        }

        children = _mergeContentsIntoChildren(children, contents);
        treeData = _setIn(treeData, objectPath, children);
        this._commit(treeData);
    };

    /**
     * @private
     *
     * Opens the directories along the provided path.
     *
     * @param {Immutable.Map} treeData
     * @param {string} path Path to open
     */
    function _openPath(treeData, path) {
        var objectPath = _filePathToObjectPath(treeData, path);

        function setOpen(node) {
            return node.set("open", true);
        }

        while (objectPath && objectPath.length) {
            var node = treeData.getIn(objectPath);
            if (isFile(node)) {
                objectPath.pop();
            } else {
                if (!node.get("open")) {
                    treeData = treeData.updateIn(objectPath, setOpen);
                }
                objectPath.pop();
                if (objectPath.length) {
                    objectPath.pop();
                }
            }
        }

        return treeData;
    }

    /**
     * Opens the directories along the given path.
     *
     * @param {string} path Project-relative path
     */
    FileTreeViewModel.prototype.openPath = function (path) {
        this._commit(_openPath(this._treeData, path));
    };

    /**
     * @private
     *
     * See FileTreeViewModel.createPlaceholder
     */
    function _createPlaceholder(treeData, basedir, name, isFolder, options) {
        options = options || {};
        var parentPath = _filePathToObjectPath(treeData, basedir);

        if (!parentPath) {
            return;
        }

        var newObject = {
        };

        if (!options.notInCreateMode) {
            newObject.creating = true;
        }

        if (isFolder) {
            // If we're creating a folder, then we know it's empty.
            // But if we're not in create mode, (we're adding a folder based on an
            // FS event), we don't know anything about the new directory's children.
            if (options.notInCreateMode) {
                newObject.children = null;
            } else {
                newObject.children = Immutable.Map();
            }
        }

        var newFile = Immutable.Map(newObject);

        if (!options.doNotOpen) {
            treeData = _openPath(treeData, basedir);
        }
        if (parentPath.length > 0) {
            var childrenPath = _.clone(parentPath);
            childrenPath.push("children");

            treeData = treeData.updateIn(childrenPath, function (children) {
                return children.set(name, newFile);
            });
        } else {
            treeData = treeData.set(name, newFile);
        }
        return treeData;
    }

    /**
     * Creates a placeholder file or directory that appears in the tree so that the user
     * can provide a name for the new entry.
     *
     * @param {string} basedir Directory that contains the new file or folder
     * @param {string} name Initial name to give the new entry
     * @param {boolean} isFolder true if the entry being created is a folder
     */
    FileTreeViewModel.prototype.createPlaceholder = function (basedir, name, isFolder) {
        var treeData = _createPlaceholder(this._treeData, basedir, name, isFolder);
        this._commit(treeData);
    };

    /**
     * @private
     *
     * See FileTreeViewModel.deleteAtPath
     */
    function _deleteAtPath(treeData, path) {
        var objectPath = _filePathToObjectPath(treeData, path);

        if (!objectPath) {
            return;
        }

        var originalName = _.last(objectPath);

        // Back up to the parent directory
        objectPath.pop();

        treeData = treeData.updateIn(objectPath, function (directory) {
            directory = directory.delete(originalName);
            return directory;
        });

        return treeData;
    }

    /**
     * Deletes the entry at the given path.
     *
     * @param {string} path Project-relative path to delete
     */
    FileTreeViewModel.prototype.deleteAtPath = function (path) {
        var treeData = _deleteAtPath(this._treeData, path);
        if (treeData) {
            this._commit(treeData);
        }
    };

    /**
     * @private
     *
     * Adds a timestamp to an entry (much like the "touch" command) to force a given entry
     * to rerender.
     */
    function _addTimestamp(item) {
        return item.set("_timestamp", new Date().getTime());
    }

    /**
     * @private
     *
     * Sets/updates the timestamp on the file paths listed in the `changed` array.
     *
     * @param {Immutable.Map} treeData
     * @param {Array.<string>} changed list of changed project-relative file paths
     * @return {Immutable.Map} revised treeData
     */
    function _markAsChanged(treeData, changed) {
        changed.forEach(function (filePath) {
            var objectPath = _filePathToObjectPath(treeData, filePath);
            if (objectPath) {
                treeData = treeData.updateIn(objectPath, _addTimestamp);
            }
        });
        return treeData;
    }

    /**
     * @private
     *
     * Adds entries at the paths listed in the `added` array. Directories should have a trailing slash.
     *
     * @param {Immutable.Map} treeData
     * @param {Array.<string>} added list of new project-relative file paths
     * @return {Immutable.Map} revised treeData
     */
    function _addNewEntries(treeData, added) {
        added.forEach(function (filePath) {
            var isFolder = _.last(filePath) === "/";

            filePath = isFolder ? filePath.substr(0, filePath.length - 1) : filePath;

            var parentPath = FileUtils.getDirectoryPath(filePath),
                parentObjectPath = _filePathToObjectPath(treeData, parentPath),
                basename = FileUtils.getBaseName(filePath);

            if (parentObjectPath) {
                // Verify that the children are loaded
                var childrenPath = _.clone(parentObjectPath);
                childrenPath.push("children");
                if (treeData.getIn(childrenPath) === null) {
                    return;
                }

                treeData = _createPlaceholder(treeData, parentPath, basename, isFolder, {
                    notInCreateMode: true,
                    doNotOpen: true
                });
            }
        });

        return treeData;
    }

    /**
     * Applies changes to the tree. The `changes` object can have one or more of the following keys which all
     * have arrays of project-relative paths as their values:
     *
     * * `changed`: entries that have changed in some way that should be re-rendered
     * * `added`: new entries that need to appear in the tree
     * * `removed`: entries that have been deleted from the tree
     *
     * @param {{changed: Array.<string>=, added: Array.<string>=, removed: Array.<string>=}}
     */
    FileTreeViewModel.prototype.processChanges = function (changes) {
        var treeData = this._treeData;

        if (changes.changed) {
            treeData = _markAsChanged(treeData, changes.changed);
        }

        if (changes.added) {
            treeData = _addNewEntries(treeData, changes.added);
        }

        if (changes.removed) {
            changes.removed.forEach(function (path) {
                treeData = _deleteAtPath(treeData, path);
            });
        }

        this._commit(treeData);
    };

    /**
     * Makes sure that the directory exists. This will create a directory object (unloaded)
     * if the directory does not already exist. A change message is also fired in that case.
     *
     * This is useful for file system events which can refer to a directory that we don't
     * know about already.
     *
     * @param {string} path Project-relative path to the directory
     */
    FileTreeViewModel.prototype.ensureDirectoryExists = function (path) {
        var treeData          = this._treeData,
            pathWithoutSlash  = FileUtils.stripTrailingSlash(path),
            parentPath        = FileUtils.getDirectoryPath(pathWithoutSlash),
            name              = pathWithoutSlash.substr(parentPath.length),
            targetPath        = [];

        if (parentPath) {
            targetPath = _filePathToObjectPath(treeData, parentPath);
            if (!targetPath) {
                return;
            }
            targetPath.push("children");
            if (!treeData.getIn(targetPath)) {
                return;
            }
        }

        targetPath.push(name);

        if (treeData.getIn(targetPath)) {
            return;
        }

        treeData = _setIn(treeData, targetPath, Immutable.Map({
            children: null
        }));

        this._commit(treeData);
    };

    /**
     * Sets the value of the `sortDirectoriesFirst` flag which tells to view that directories
     * should be listed before the alphabetical listing of files.
     *
     * @param {boolean} sortDirectoriesFirst True if directories should be displayed first
     */
    FileTreeViewModel.prototype.setSortDirectoriesFirst = function (sortDirectoriesFirst) {
        if (sortDirectoriesFirst !== this.sortDirectoriesFirst) {
            this.sortDirectoriesFirst = sortDirectoriesFirst;
            this.trigger(EVENT_CHANGE);
        }
    };

    /**
     * Sets the width of the selection bar.
     *
     * @param {int} width New width
     */
    FileTreeViewModel.prototype.setSelectionWidth = function (width) {
        var selectionViewInfo = this._selectionViewInfo;
        selectionViewInfo = selectionViewInfo.set("width", width);
        this._commit(null, selectionViewInfo);
    };

    /**
     * Sets the scroll position of the file tree to help position the selection bar.
     * SPECIAL CASE NOTE: this does not trigger a change event because this data is
     * explicitly set in the rendering process (see ProjectManager._renderTree).
     *
     * @param {int} scrollWidth width of the tree content
     * @param {int} scrollTop Scroll position
     * @param {int=} scrollLeft Horizontal scroll position
     * @param {int=} offsetTop top of the scroller
     */
    FileTreeViewModel.prototype.setSelectionScrollerInfo = function (scrollWidth, scrollTop, scrollLeft, offsetTop) {
        this._selectionViewInfo = this._selectionViewInfo.set("scrollWidth", scrollWidth);
        this._selectionViewInfo = this._selectionViewInfo.set("scrollTop", scrollTop);

        if (scrollLeft !== undefined) {
            this._selectionViewInfo = this._selectionViewInfo.set("scrollLeft", scrollLeft);
        }

        if (offsetTop !== undefined) {
            this._selectionViewInfo = this._selectionViewInfo.set("offsetTop", offsetTop);
        }
        // Does not emit change event. See SPECIAL CASE NOTE in docstring above.
    };

    // Private API
    exports.EVENT_CHANGE          = EVENT_CHANGE;
    exports._filePathToObjectPath = _filePathToObjectPath;
    exports._isFilePathVisible    = _isFilePathVisible;
    exports._createPlaceholder    = _createPlaceholder;

    // Public API
    exports.isFile            = isFile;
    exports.FileTreeViewModel = FileTreeViewModel;
});
