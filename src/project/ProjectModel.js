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

/* unittests: ProjectModel */

/**
 * Provides the data source for a project and manages the view model for the FileTreeView.
 */
define(function (require, exports, module) {
    "use strict";

    var InMemoryFile        = require("document/InMemoryFile"),
        EventDispatcher     = require("utils/EventDispatcher"),
        FileUtils           = require("file/FileUtils"),
        _                   = require("thirdparty/lodash"),
        FileSystem          = require("filesystem/FileSystem"),
        FileSystemError     = require("filesystem/FileSystemError"),
        FileTreeViewModel   = require("project/FileTreeViewModel"),
        Async               = require("utils/Async"),
        PerfUtils           = require("utils/PerfUtils");

    // Constants
    var EVENT_CHANGE            = "change",
        EVENT_SHOULD_SELECT     = "select",
        EVENT_SHOULD_FOCUS      = "focus",
        ERROR_CREATION          = "creationError",
        ERROR_INVALID_FILENAME  = "invalidFilename",
        ERROR_NOT_IN_PROJECT    = "notInProject";

    /**
     * @private
     * File and folder names which are not displayed or searched
     * TODO: We should add the rest of the file names that TAR excludes:
     *    http://www.gnu.org/software/tar/manual/html_section/exclude.html
     * TODO: This should be user configurable
     *    https://github.com/adobe/brackets/issues/6781
     * @type {RegExp}
     */
    var _exclusionListRegEx = /\.pyc$|^\.git$|^\.gitmodules$|^\.svn$|^\.DS_Store$|^Icon\r|^Thumbs\.db$|^\.hg$|^CVS$|^\.hgtags$|^\.idea$|^\.c9revisions$|^\.SyncArchive$|^\.SyncID$|^\.SyncIgnore$|\~$/;

    /**
     * Glob definition of files and folders that should be excluded directly
     * inside node domain watching with chokidar
     */
    var defaultIgnoreGlobs = [
        "**/(.pyc|.git|.gitmodules|.svn|.DS_Store|Thumbs.db|.hg|CVS|.hgtags|.idea|.c9revisions|.SyncArchive|.SyncID|.SyncIgnore)",
        "**/bower_components",
        "**/node_modules"
    ];

    /**
     * @private
     * A string containing all invalid characters for a specific platform.
     * This will be used to construct a regular expression for checking invalid filenames.
     * When a filename with one of these invalid characters are detected, then it is
     * also used to substitute the place holder of the error message.
     */
    var _invalidChars;

    /**
     * @private
     * RegEx to validate if a filename is not allowed even if the system allows it.
     * This is done to prevent cross-platform issues.
     */

    var _illegalFilenamesRegEx = /^(\.+|com[1-9]|lpt[1-9]|nul|con|prn|aux|)$|\.+$/i;

    /**
     * Returns true if this matches valid filename specifications.
     *
     * TODO: This likely belongs in FileUtils.
     *
     * @param {string} filename to check
     * @param {string} invalidChars List of characters that are disallowed
     * @return {boolean} true if the filename is valid
     */
    function isValidFilename(filename, invalidChars) {
        // Validate file name
        // Checks for valid Windows filenames:
        // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
        return !(
            new RegExp("[" + invalidChars + "]+").test(filename) ||
            _illegalFilenamesRegEx.test(filename)
        );
    }

    /**
     * @private
     * @see #shouldShow
     */
    function _shouldShowName(name) {
        return !_exclusionListRegEx.test(name);
    }

    /**
     * Returns false for files and directories that are not commonly useful to display.
     *
     * @param {!FileSystemEntry} entry File or directory to filter
     * @return {boolean} true if the file should be displayed
     */
    function shouldShow(entry) {
        return _shouldShowName(entry.name);
    }

    // Constants used by the ProjectModel

    var FILE_RENAMING     = 0,
        FILE_CREATING     = 1,
        RENAME_CANCELLED  = 2;


    /**
     * @private
     *
     * Determines if a path string is pointing to a directory (does it have a trailing slash?)
     *
     * @param {string} path Path to test.
     */
    function _pathIsFile(path) {
        return _.last(path) !== "/";
    }

    /**
     * @private
     *
     * Gets the FileSystem object (either a File or Directory) based on the path provided.
     *
     * @param {string} path Path to retrieve
     */
    function _getFSObject(path) {
        if (!path) {
            return path;
        } else if (_pathIsFile(path)) {
            return FileSystem.getFileForPath(path);
        }
        return FileSystem.getDirectoryForPath(path);
    }

    /**
     * @private
     *
     * Given what is possible a FileSystem object, return its path (if a string path is passed in,
     * it will be returned as-is).
     *
     * @param {FileSystemEntry} fsobj Object from which the path should be extracted
     */
    function _getPathFromFSObject(fsobj) {
        if (fsobj && fsobj.fullPath) {
            return fsobj.fullPath;
        }
        return fsobj;
    }

    /**
     * Creates a new file or folder at the given path. The returned promise is rejected if the filename
     * is invalid, the new path already exists or some other filesystem error comes up.
     *
     * @param {string} path path to create
     * @param {boolean} isFolder true if the new entry is a folder
     * @return {$.Promise} resolved when the file or directory has been created.
     */
    function doCreate(path, isFolder) {
        var d = new $.Deferred();

        var name = FileUtils.getBaseName(path);
        if (!isValidFilename(name, _invalidChars)) {
            return d.reject(ERROR_INVALID_FILENAME).promise();
        }

        FileSystem.resolve(path, function (err) {
            if (!err) {
                // Item already exists, fail with error
                d.reject(FileSystemError.ALREADY_EXISTS);
            } else {
                if (isFolder) {
                    var directory = FileSystem.getDirectoryForPath(path);

                    directory.create(function (err) {
                        if (err) {
                            d.reject(err);
                        } else {
                            d.resolve(directory);
                        }
                    });
                } else {
                    // Create an empty file
                    var file = FileSystem.getFileForPath(path);

                    FileUtils.writeText(file, "").then(function () {
                        d.resolve(file);
                    }, d.reject);
                }
            }
        });

        return d.promise();
    }

    /**
     * @constructor
     *
     * The ProjectModel provides methods for accessing information about the current open project.
     * It also manages the view model to display a FileTreeView of the project.
     *
     * Events:
     * - EVENT_CHANGE (`change`) - Fired when there's a change that should refresh the UI
     * - EVENT_SHOULD_SELECT (`select`) - Fired when a selection has been made in the file tree and the file tree should be selected
     * - EVENT_SHOULD_FOCUS (`focus`)
     * - ERROR_CREATION (`creationError`) - Triggered when there's a problem creating a file
     */
    function ProjectModel(initial) {
        initial = initial || {};
        if (initial.projectRoot) {
            this.projectRoot = initial.projectRoot;
        }

        if (initial.focused !== undefined) {
            this._focused = initial.focused;
        }
        this._viewModel = new FileTreeViewModel.FileTreeViewModel();
        this._viewModel.on(FileTreeViewModel.EVENT_CHANGE, function () {
            this.trigger(EVENT_CHANGE);
        }.bind(this));
        this._selections = {};
    }
    EventDispatcher.makeEventDispatcher(ProjectModel.prototype);

    /**
     * @type {Directory}
     *
     * The root Directory object for the project.
     */
    ProjectModel.prototype.projectRoot = null;

    /**
     * @private
     * @type {FileTreeViewModel}
     *
     * The view model for this project.
     */
    ProjectModel.prototype._viewModel = null;

    /**
     * @private
     * @type {string}
     *
     * Encoded URL
     * @see {@link ProjectModel#getBaseUrl}, {@link ProjectModel#setBaseUrl}
     */
    ProjectModel.prototype._projectBaseUrl = "";

    /**
     * @private
     * @type {{selected: ?string, context: ?string, previousContext: ?string, rename: ?Object}}
     *
     * Keeps track of selected files, context, previous context and files
     * that are being renamed or created.
     */
    ProjectModel.prototype._selections = null;

    /**
     * @private
     * @type {boolean}
     *
     * Flag to store whether the file tree has focus.
     */
    ProjectModel.prototype._focused = true;

    /**
     * @private
     * @type {string}
     *
     * Current file path being viewed.
     */
    ProjectModel.prototype._currentPath = null;

    /**
     * @private
     * @type {?$.Promise.<Array<File>>}
     *
     * A promise that is resolved with an array of all project files. Used by
     * ProjectManager.getAllFiles().
     */
    ProjectModel.prototype._allFilesCachePromise = null;

    /**
     * Sets whether the file tree is focused or not.
     *
     * @param {boolean} focused True if the file tree has the focus.
     */
    ProjectModel.prototype.setFocused = function (focused) {
        this._focused = focused;
        if (!focused) {
            this.setSelected(null);
        }
    };

    /**
     * Sets the width of the selection bar.
     *
     * @param {int} width New width
     */
    ProjectModel.prototype.setSelectionWidth = function (width) {
        this._viewModel.setSelectionWidth(width);
    };

    /**
     * Tracks the scroller position.
     *
     * @param {int} scrollWidth Width of the tree container
     * @param {int} scrollTop Top of scroll position
     * @param {int} scrollLeft Left of scroll position
     * @param {int} offsetTop Top of scroller element
     */
    ProjectModel.prototype.setScrollerInfo = function (scrollWidth, scrollTop, scrollLeft, offsetTop) {
        this._viewModel.setSelectionScrollerInfo(scrollWidth, scrollTop, scrollLeft, offsetTop);
    };

    /**
     * Returns the encoded Base URL of the currently loaded project, or empty string if no project
     * is open (during startup, or running outside of app shell).
     * @return {String}
     */
    ProjectModel.prototype.getBaseUrl = function getBaseUrl() {
        return this._projectBaseUrl;
    };

    /**
     * Sets the encoded Base URL of the currently loaded project.
     * @param {String}
     */
    ProjectModel.prototype.setBaseUrl = function setBaseUrl(projectBaseUrl) {
        // Ensure trailing slash to be consistent with projectRoot.fullPath
        // so they're interchangable (i.e. easy to convert back and forth)
        if (projectBaseUrl.length > 0 && projectBaseUrl[projectBaseUrl.length - 1] !== "/") {
            projectBaseUrl += "/";
        }

        this._projectBaseUrl = projectBaseUrl;
        return projectBaseUrl;
    };

    /**
     * Returns true if absPath lies within the project, false otherwise.
     * Does not support paths containing ".."
     *
     * @param {string|FileSystemEntry} absPathOrEntry
     * @return {boolean}
     */
    ProjectModel.prototype.isWithinProject = function isWithinProject(absPathOrEntry) {
        var absPath = absPathOrEntry.fullPath || absPathOrEntry;
        return (this.projectRoot && absPath.indexOf(this.projectRoot.fullPath) === 0);
    };

    /**
     * If absPath lies within the project, returns a project-relative path. Else returns absPath
     * unmodified.
     * Does not support paths containing ".."
     *
     * @param {!string} absPath
     * @return {!string}
     */
    ProjectModel.prototype.makeProjectRelativeIfPossible = function makeProjectRelativeIfPossible(absPath) {
        if (absPath && this.isWithinProject(absPath)) {
            return absPath.slice(this.projectRoot.fullPath.length);
        }
        return absPath;
    };

    /**
     * Returns a valid directory within the project, either the path (or Directory object)
     * provided or the project root.
     *
     * @param {string|Directory} path Directory path to verify against the project
     * @return {string} A directory path within the project.
     */
    ProjectModel.prototype.getDirectoryInProject = function (path) {
        if (path && typeof path === "string") {
            if (_.last(path) !== "/") {
                path += "/";
            }
        } else if (path && path.isDirectory) {
            path = path.fullPath;
        } else {
            path = null;
        }

        if (!path || (typeof path !== "string") || !this.isWithinProject(path)) {
            path = this.projectRoot.fullPath;
        }
        return path;
    };

    /**
     * @private
     *
     * Returns a promise that resolves with a cached copy of all project files.
     * Used by ProjectManager.getAllFiles(). Ensures that at most one un-cached
     * directory traversal is active at a time, which is useful at project load
     * time when watchers (and hence filesystem-level caching) has not finished
     * starting up. The cache is cleared on every filesystem change event, and
     * also on project load and unload.
     *
     * @param {boolean} true to sort files by their paths
     * @return {$.Promise.<Array.<File>>}
     */
    ProjectModel.prototype._getAllFilesCache = function _getAllFilesCache(sort) {
        if (!this._allFilesCachePromise) {
            var deferred = new $.Deferred(),
                allFiles = [],
                allFilesVisitor = function (entry) {
                    if (shouldShow(entry)) {
                        if (entry.isFile) {
                            allFiles.push(entry);
                        }
                        return true;
                    }
                    return false;
                };

            this._allFilesCachePromise = deferred.promise();

            var projectIndexTimer = PerfUtils.markStart("Creating project files cache: " +
                                                        this.projectRoot.fullPath),
                options = {
                    sortList : sort
                };

            this.projectRoot.visit(allFilesVisitor, options, function (err) {
                if (err) {
                    PerfUtils.finalizeMeasurement(projectIndexTimer);
                    deferred.reject(err);
                } else {
                    PerfUtils.addMeasurement(projectIndexTimer);
                    deferred.resolve(allFiles);
                }
            }.bind(this));
        }

        return this._allFilesCachePromise;
    };

    /**
     * Returns an Array of all files for this project, optionally including
     * files additional files provided. Files are filtered out by shouldShow().
     *
     * @param {function (File, number):boolean=} filter Optional function to filter
     *          the file list (does not filter directory traversal). API matches Array.filter().
     * @param {Array.<File>=} additionalFiles Additional files to include (for example, the WorkingSet)
     *          Only adds files that are *not* under the project root or untitled documents.
     * @param {boolean} true to sort files by their paths
     *
     * @return {$.Promise} Promise that is resolved with an Array of File objects.
     */
    ProjectModel.prototype.getAllFiles = function getAllFiles(filter, additionalFiles, sort) {
        // The filter and includeWorkingSet params are both optional.
        // Handle the case where filter is omitted but includeWorkingSet is
        // specified.
        if (additionalFiles === undefined && typeof (filter) !== "function") {
            additionalFiles = filter;
            filter = null;
        }

        var filteredFilesDeferred = new $.Deferred();

        // First gather all files in project proper
        // Note that with proper promises we may be able to fix this so that we're not doing this
        // anti-pattern of creating a separate deferred rather than just chaining off of the promise
        // from _getAllFilesCache
        this._getAllFilesCache(sort).done(function (result) {
            // Add working set entries, if requested
            if (additionalFiles) {
                additionalFiles.forEach(function (file) {
                    if (result.indexOf(file) === -1 && !(file instanceof InMemoryFile)) {
                        result.push(file);
                    }
                });
            }

            // Filter list, if requested
            if (filter) {
                result = result.filter(filter);
            }

            // If a done handler attached to the returned filtered files promise
            // throws an exception that isn't handled here then it will leave
            // _allFilesCachePromise in an inconsistent state such that no
            // additional done handlers will ever be called!
            try {
                filteredFilesDeferred.resolve(result);
            } catch (e) {
                console.error("Unhandled exception in getAllFiles handler: " + e, e.stack);
            }
        }).fail(function (err) {
            try {
                filteredFilesDeferred.reject(err);
            } catch (e) {
                console.error("Unhandled exception in getAllFiles handler: " + e, e.stack);
            }
        });

        return filteredFilesDeferred.promise();
    };

    /**
     * @private
     *
     * Resets the all files cache.
     */
    ProjectModel.prototype._resetCache = function _resetCache() {
        this._allFilesCachePromise = null;
    };

    /**
     * Sets the project root (effectively resetting this ProjectModel).
     *
     * @param {Directory} projectRoot new project root
     * @return {$.Promise} resolved when the project root has been updated
     */
    ProjectModel.prototype.setProjectRoot = function (projectRoot) {
        this.projectRoot = projectRoot;
        this._resetCache();
        this._viewModel._rootChanged();

        var d = new $.Deferred(),
            self = this;

        projectRoot.getContents(function (err, contents) {
            if (err) {
                d.reject(err);
            } else {
                self._viewModel.setDirectoryContents("", contents);
                d.resolve();
            }
        });
        return d.promise();
    };

    /**
     * @private
     *
     * Gets the contents of a directory at the given path.
     *
     * @param {string} path path to retrieve
     * @return {$.Promise} Resolved with the directory contents.
     */
    ProjectModel.prototype._getDirectoryContents = function (path) {
        var d = new $.Deferred();
        FileSystem.getDirectoryForPath(path).getContents(function (err, contents) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve(contents);
            }
        });
        return d.promise();
    };

    /**
     * Opens or closes the given directory in the file tree.
     *
     * @param {string} path Path to open
     * @param {boolean} open `true` to open the path
     * @return {$.Promise} resolved when the path has been opened.
     */
    ProjectModel.prototype.setDirectoryOpen = function (path, open) {
        var projectRelative = this.makeProjectRelativeIfPossible(path),
            needsLoading    = !this._viewModel.isPathLoaded(projectRelative),
            d               = new $.Deferred(),
            self            = this;

        function onSuccess(contents) {
            // Update the view model
            if (contents) {
                self._viewModel.setDirectoryContents(projectRelative, contents);
            }

            if (open) {
                self._viewModel.openPath(projectRelative);
                if (self._focused) {
                    var currentPathInProject = self.makeProjectRelativeIfPossible(self._currentPath);
                    if (self._viewModel.isFilePathVisible(currentPathInProject)) {
                        self.setSelected(self._currentPath, true);
                    } else {
                        self.setSelected(null);
                    }
                }
            } else {
                self._viewModel.setDirectoryOpen(projectRelative, false);
                var selected = self._selections.selected;
                if (selected) {
                    var relativeSelected = self.makeProjectRelativeIfPossible(selected);
                    if (!self._viewModel.isFilePathVisible(relativeSelected)) {
                        self.setSelected(null);
                    }
                }
            }

            d.resolve();
        }

        // If the view model doesn't have the data it needs, we load it now, otherwise we can just
        // manage the selection and resovle the promise.
        if (open && needsLoading) {
            var parentDirectory = FileUtils.getDirectoryPath(FileUtils.stripTrailingSlash(path));
            this.setDirectoryOpen(parentDirectory, true).then(function () {
                self._getDirectoryContents(path).then(onSuccess).fail(function (err) {
                    d.reject(err);
                });
            }, function (err) {
                d.reject(err);
            });
        } else {
            onSuccess();
        }

        return d.promise();
    };

    /**
     * Shows the given path in the tree and selects it if it's a file. Any intermediate directories
     * will be opened and a promise is returned to show when the entire operation is complete.
     *
     * @param {string|File|Directory} path full path to the file or directory
     * @return {$.Promise} promise resolved when the path is shown
     */
    ProjectModel.prototype.showInTree = function (path) {
        var d = new $.Deferred();
        path = _getPathFromFSObject(path);

        if (!this.isWithinProject(path)) {
            return d.resolve().promise();
        }

        var parentDirectory = FileUtils.getDirectoryPath(path),
            self = this;
        this.setDirectoryOpen(parentDirectory, true).then(function () {
            if (_pathIsFile(path)) {
                self.setSelected(path);
            }
            d.resolve();
        }, function (err) {
            d.reject(err);
        });
        return d.promise();
    };

    /**
     * Selects the given path in the file tree and opens the file (unless doNotOpen is specified).
     * Directories will not be selected.
     *
     * When the selection changes, any rename operation that is currently underway will be completed.
     *
     * @param {string} path full path to the file being selected
     * @param {boolean} doNotOpen `true` if the file should not be opened.
     */
    ProjectModel.prototype.setSelected = function (path, doNotOpen) {
        path = _getPathFromFSObject(path);

        // Directories are not selectable
        if (!_pathIsFile(path)) {
            return;
        }

        var oldProjectPath = this.makeProjectRelativeIfPossible(this._selections.selected),
            pathInProject = this.makeProjectRelativeIfPossible(path);

        if (path && !this._viewModel.isFilePathVisible(pathInProject)) {
            path = null;
            pathInProject = null;
        }

        this.performRename();

        this._viewModel.moveMarker("selected", oldProjectPath, pathInProject);
        if (this._selections.context) {
            this._viewModel.moveMarker("context", this.makeProjectRelativeIfPossible(this._selections.context), null);
            delete this._selections.context;
        }

        var previousSelection = this._selections.selected;
        this._selections.selected = path;

        if (path) {
            if (!doNotOpen) {
                this.trigger(EVENT_SHOULD_SELECT, {
                    path: path,
                    previousPath: previousSelection,
                    hadFocus: this._focused
                });
            }

            this.trigger(EVENT_SHOULD_FOCUS);
        }
    };

    /**
     * Gets the currently selected file or directory.
     *
     * @return {FileSystemEntry} the filesystem object for the currently selected file
     */
    ProjectModel.prototype.getSelected = function () {
        return _getFSObject(this._selections.selected);
    };

    /**
     * Keeps track of which file is currently being edited.
     *
     * @param {File|string} curFile Currently edited file.
     */
    ProjectModel.prototype.setCurrentFile = function (curFile) {
        this._currentPath = _getPathFromFSObject(curFile);
    };

    /**
     * Adds the file at the given path to the Working Set and selects it there.
     *
     * @param {string} path full path of file to open in Working Set
     */
    ProjectModel.prototype.selectInWorkingSet = function (path) {
        this.performRename();
        this.trigger(EVENT_SHOULD_SELECT, {
            path: path,
            add: true
        });
    };

    /**
     * Sets the context (for context menu operations) to the given path. This is independent from the
     * open/selected file.
     *
     * @param {string} path full path of file or directory to which the context should be setBaseUrl
     * @param {boolean} _doNotRename True if this context change should not cause a rename operation to finish. This is a special case that goes with context menu handling.
     * @param {boolean} _saveContext True if the current context should be saved (see comment below)
     */
    ProjectModel.prototype.setContext = function (path, _doNotRename, _saveContext) {
        // This bit is not ideal: when the user right-clicks on an item in the file tree
        // and there is already a context menu up, the FileTreeView sends a signal to set the
        // context to the new element but the PopupManager follows that with a message that it's
        // closing the context menu (because it closes the previous one and then opens the new
        // one.) This timing means that we need to provide some special case handling here.
        if (_saveContext) {
            if (!path) {
                this._selections.previousContext = this._selections.context;
            } else {
                this._selections.previousContext = path;
            }
        } else {
            delete this._selections.previousContext;
        }

        path = _getPathFromFSObject(path);

        if (!_doNotRename) {
            this.performRename();
        }
        var currentContext = this._selections.context;
        this._selections.context = path;
        this._viewModel.moveMarker("context", this.makeProjectRelativeIfPossible(currentContext),
                                   this.makeProjectRelativeIfPossible(path));
    };

    /**
     * Restores the context to the last non-null context. This is specifically here to handle
     * the sequence of messages that we get from the project context menu.
     */
    ProjectModel.prototype.restoreContext = function () {
        if (this._selections.previousContext) {
            this.setContext(this._selections.previousContext);
        }
    };

    /**
     * Gets the currently selected context.
     *
     * @return {FileSystemEntry} filesystem object for the context file or directory
     */
    ProjectModel.prototype.getContext = function () {
        return _getFSObject(this._selections.context);
    };

    /**
     * Starts a rename operation for the file or directory at the given path. If the path is
     * not provided, the current context is used.
     *
     * If a rename operation is underway, it will be completed automatically.
     *
     * The Promise returned is resolved with an object with a `newPath` property with the renamed path. If the user cancels the operation, the promise is resolved with the value RENAME_CANCELLED.
     *
     * @param {string=} path optional path to start renaming
     * @return {$.Promise} resolved when the operation is complete.
     */
    ProjectModel.prototype.startRename = function (path) {
        var d = new $.Deferred();
        path = _getPathFromFSObject(path);
        if (!path) {
            path = this._selections.context;
            if (!path) {
                return d.resolve().promise();
            }
        }

        if (this._selections.rename && this._selections.rename.path === path) {
            return;
        }

        if (!this.isWithinProject(path)) {
            return d.reject({
                type: ERROR_NOT_IN_PROJECT,
                isFolder: !_pathIsFile(path),
                fullPath: path
            }).promise();
        }

        var projectRelativePath = this.makeProjectRelativeIfPossible(path);

        if (!this._viewModel.isFilePathVisible(projectRelativePath)) {
            this.showInTree(path);
        }

        if (path !== this._selections.context) {
            this.setContext(path);
        } else {
            this.performRename();
        }

        this._viewModel.moveMarker("rename", null,
                                   projectRelativePath);
        this._selections.rename = {
            deferred: d,
            type: FILE_RENAMING,
            path: path,
            newName: FileUtils.getBaseName(path)
        };
        return d.promise();
    };

    /**
     * Sets the new value for the rename operation that is in progress (started previously with a call
     * to `startRename`).
     *
     * @param {string} name new name for the file or directory being renamed
     */
    ProjectModel.prototype.setRenameValue = function (name) {
        if (!this._selections.rename) {
            return;
        }
        this._selections.rename.newName = name;
    };

    /**
     * Cancels the rename operation that is in progress. This resolves the original promise with
     * a RENAME_CANCELLED value.
     */
    ProjectModel.prototype.cancelRename = function () {
        var renameInfo = this._selections.rename;
        if (!renameInfo) {
            return;
        }

        // File creation is a special case.
        if (renameInfo.type === FILE_CREATING) {
            this._cancelCreating();
            return;
        }

        this._viewModel.moveMarker("rename", this.makeProjectRelativeIfPossible(renameInfo.path), null);
        renameInfo.deferred.resolve(RENAME_CANCELLED);
        delete this._selections.rename;
        this.setContext(null);
    };

    /**
     * Rename a file/folder. This will update the project tree data structures
     * and send notifications about the rename.
     *
     * @param {string} oldPath Old name of the item with the path
     * @param {string} newPath New name of the item with the path
     * @param {string} newName New name of the item
     * @param {boolean} isFolder True if item is a folder; False if it is a file.
     * @return {$.Promise} A promise object that will be resolved or rejected when
     *   the rename is finished.
     */
    function _renameItem(oldPath, newPath, newName, isFolder) {
        var result = new $.Deferred();

        if (oldPath === newPath) {
            result.resolve();
        } else if (!isValidFilename(newName, _invalidChars)) {
            result.reject(ERROR_INVALID_FILENAME);
        } else {
            var entry = isFolder ? FileSystem.getDirectoryForPath(oldPath) : FileSystem.getFileForPath(oldPath);
            entry.rename(newPath, function (err) {
                if (err) {
                    result.reject(err);
                } else {
                    result.resolve();
                }
            });
        }

        return result.promise();
    }

    /**
     * @private
     *
     * Renames the item at the old path to the new name provided.
     *
     * @param {string} oldPath full path to the current location of file or directory (should include trailing slash for directory)
     * @param {string} newPath full path to the new location of the file or directory
     * @param {string} newName new name for the file or directory
     */
    ProjectModel.prototype._renameItem = function (oldPath, newPath, newName) {
        return _renameItem(oldPath, newPath, newName, !_pathIsFile(oldPath));
    };

    /**
     * Completes the rename operation that is in progress.
     */
    ProjectModel.prototype.performRename = function () {
        var renameInfo = this._selections.rename;
        if (!renameInfo) {
            return;
        }
        var oldPath         = renameInfo.path,
            isFolder        = renameInfo.isFolder || !_pathIsFile(oldPath),
            oldProjectPath  = this.makeProjectRelativeIfPossible(oldPath),

            // To get the parent directory, we need to strip off the trailing slash on a directory name
            parentDirectory = FileUtils.getDirectoryPath(isFolder ? FileUtils.stripTrailingSlash(oldPath) : oldPath),
            oldName         = FileUtils.getBaseName(oldPath),
            newName         = renameInfo.newName,
            newPath         = parentDirectory + newName,
            viewModel       = this._viewModel,
            self            = this;

        if (renameInfo.type !== FILE_CREATING && oldName === newName) {
            this.cancelRename();
            return;
        }

        if (isFolder) {
            newPath += "/";
        }

        delete this._selections.rename;
        delete this._selections.context;

        viewModel.moveMarker("rename", oldProjectPath, null);
        viewModel.moveMarker("context", oldProjectPath, null);
        viewModel.moveMarker("creating", oldProjectPath, null);

        function finalizeRename() {
            viewModel.renameItem(oldProjectPath, newName);
            if (self._selections.selected && self._selections.selected.indexOf(oldPath) === 0) {
                self._selections.selected = newPath + self._selections.selected.slice(oldPath.length);
            }
        }

        if (renameInfo.type === FILE_CREATING) {
            this.createAtPath(newPath).done(function (entry) {
                finalizeRename();
                renameInfo.deferred.resolve(entry);
            }).fail(function (error) {
                self._viewModel.deleteAtPath(self.makeProjectRelativeIfPossible(renameInfo.path));
                renameInfo.deferred.reject(error);
            });
        } else {
            this._renameItem(oldPath, newPath, newName).then(function () {
                finalizeRename();
                renameInfo.deferred.resolve({
                    newPath: newPath
                });
            }).fail(function (errorType) {
                var errorInfo = {
                    type: errorType,
                    isFolder: isFolder,
                    fullPath: oldPath
                };
                renameInfo.deferred.reject(errorInfo);
            });
        }
    };

    /**
     * Creates a file or folder at the given path. Folder paths should have a trailing slash.
     *
     * If an error comes up during creation, the ERROR_CREATION event is triggered.
     *
     * @param {string} path full path to file or folder to create
     * @return {$.Promise} resolved when creation is complete
     */
    ProjectModel.prototype.createAtPath = function (path) {
        var isFolder  = !_pathIsFile(path),
            name      = FileUtils.getBaseName(path),
            self      = this;

        return doCreate(path, isFolder).done(function (entry) {
            if (!isFolder) {
                self.selectInWorkingSet(entry.fullPath);
            }
        }).fail(function (error) {
            self.trigger(ERROR_CREATION, {
                type: error,
                name: name,
                isFolder: isFolder
            });
        });
    };

    /**
     * Starts creating a file or folder with the given name in the given directory.
     *
     * The Promise returned is resolved with an object with a `newPath` property with the renamed path. If the user cancels the operation, the promise is resolved with the value RENAME_CANCELLED.
     *
     * @param {string} basedir directory that should contain the new entry
     * @param {string} newName initial name for the new entry (the user can rename it)
     * @param {boolean} isFolder `true` if the entry being created is a folder
     * @return {$.Promise} resolved when the user is done creating the entry.
     */
    ProjectModel.prototype.startCreating = function (basedir, newName, isFolder) {
        this.performRename();
        var d = new $.Deferred(),
            self = this;

        this.setDirectoryOpen(basedir, true).then(function () {
            self._viewModel.createPlaceholder(self.makeProjectRelativeIfPossible(basedir), newName, isFolder);
            var promise = self.startRename(basedir + newName);
            self._selections.rename.type = FILE_CREATING;
            if (isFolder) {
                self._selections.rename.isFolder = isFolder;
            }
            promise.then(d.resolve).fail(d.reject);
        }).fail(function (err) {
            d.reject(err);
        });
        return d.promise();
    };

    /**
     * Cancels the creation process that is underway. The original promise returned will be resolved with the
     * RENAME_CANCELLED value. The temporary entry added to the file tree will be deleted.
     */
    ProjectModel.prototype._cancelCreating = function () {
        var renameInfo = this._selections.rename;
        if (!renameInfo || renameInfo.type !== FILE_CREATING) {
            return;
        }
        this._viewModel.deleteAtPath(this.makeProjectRelativeIfPossible(renameInfo.path));
        renameInfo.deferred.resolve(RENAME_CANCELLED);
        delete this._selections.rename;
        this.setContext(null);
    };

    /**
     * Sets the `sortDirectoriesFirst` option for the file tree view.
     *
     * @param {boolean} True if directories should appear first
     */
    ProjectModel.prototype.setSortDirectoriesFirst = function (sortDirectoriesFirst) {
        this._viewModel.setSortDirectoriesFirst(sortDirectoriesFirst);
    };

    /**
     * Gets an array of arrays where each entry of the top-level array has an array
     * of paths that are at the same depth in the tree. All of the paths are full paths.
     *
     * @return {Array.<Array.<string>>} Array of array of full paths, organized by depth in the tree.
     */
    ProjectModel.prototype.getOpenNodes = function () {
        return this._viewModel.getOpenNodes(this.projectRoot.fullPath);
    };

    /**
     * Reopens a set of nodes in the tree by full path.
     * @param {Array.<Array.<string>>} nodesByDepth An array of arrays of node ids to reopen. The ids within
     *     each sub-array are reopened in parallel, and the sub-arrays are reopened in order, so they should
     *     be sorted by depth within the tree.
     * @return {$.Deferred} A promise that will be resolved when all nodes have been fully
     *     reopened.
     */
    ProjectModel.prototype.reopenNodes = function (nodesByDepth) {
        var deferred = new $.Deferred();

        if (!nodesByDepth || nodesByDepth.length === 0) {
            // All paths are opened and fully rendered.
            return deferred.resolve().promise();
        } else {
            var self = this;
            return Async.doSequentially(nodesByDepth, function (toOpenPaths) {
                return Async.doInParallel(
                    toOpenPaths,
                    function (path) {
                        return self._getDirectoryContents(path).then(function (contents) {
                            var relative = self.makeProjectRelativeIfPossible(path);
                            self._viewModel.setDirectoryContents(relative, contents);
                            self._viewModel.setDirectoryOpen(relative, true);
                        });
                    },
                    false
                );
            });
        }
    };

    /**
     * Clears caches and refreshes the contents of the tree.
     *
     * @return {$.Promise} resolved when the tree has been refreshed
     */
    ProjectModel.prototype.refresh = function () {
        var projectRoot = this.projectRoot,
            openNodes   = this.getOpenNodes(),
            self        = this,
            selections  = this._selections,
            viewModel   = this._viewModel,
            deferred    = new $.Deferred();

        this.setProjectRoot(projectRoot).then(function () {
            self.reopenNodes(openNodes).then(function () {
                if (selections.selected) {
                    viewModel.moveMarker("selected", null, self.makeProjectRelativeIfPossible(selections.selected));
                }

                if (selections.context) {
                    viewModel.moveMarker("context", null, self.makeProjectRelativeIfPossible(selections.context));
                }

                if (selections.rename) {
                    viewModel.moveMarker("rename", null, self.makeProjectRelativeIfPossible(selections.rename));
                }

                deferred.resolve();
            });
        });

        return deferred.promise();
    };

    /**
     * Handles filesystem change events and prepares the update for the view model.
     *
     * @param {?(File|Directory)} entry File or Directory changed
     * @param {Array.<FileSystemEntry>=} added If entry is a Directory, contains zero or more added children
     * @param {Array.<FileSystemEntry>=} removed If entry is a Directory, contains zero or more removed
     */
    ProjectModel.prototype.handleFSEvent = function (entry, added, removed) {
        this._resetCache();

        if (!entry) {
            this.refresh();
            return;
        }

        if (!this.isWithinProject(entry)) {
            return;
        }

        var changes = {},
            self = this;

        if (entry.isFile) {
            changes.changed = [
                this.makeProjectRelativeIfPossible(entry.fullPath)
            ];
        } else {
            // Special case: a directory passed in without added and removed values
            // needs to be updated.
            if (!added && !removed) {
                entry.getContents(function (err, contents) {
                    if (err) {
                        console.error("Unexpected error refreshing file tree for directory " + entry.fullPath + ": " + err, err.stack);
                        return;
                    }
                    self._viewModel.setDirectoryContents(self.makeProjectRelativeIfPossible(entry.fullPath), contents);
                });

                // Exit early because we can't update the viewModel until we get the directory contents.
                return;
            }
        }

        if (added) {
            changes.added = added.map(function (entry) {
                return self.makeProjectRelativeIfPossible(entry.fullPath);
            });
        }

        if (removed) {
            if (this._selections.selected &&
                    _.find(removed, { fullPath: this._selections.selected })) {
                this.setSelected(null);
            }

            if (this._selections.rename &&
                    _.find(removed, { fullPath: this._selections.rename.path })) {
                this.cancelRename();
            }

            if (this._selections.context &&
                    _.find(removed, { fullPath: this._selections.context })) {
                this.setContext(null);
            }
            changes.removed = removed.map(function (entry) {
                return self.makeProjectRelativeIfPossible(entry.fullPath);
            });
        }

        this._viewModel.processChanges(changes);
    };

    /**
     * Closes the directory at path and recursively closes all of its children.
     *
     * @param {string} path Path of subtree to close
     */
    ProjectModel.prototype.closeSubtree = function (path) {
        this._viewModel.closeSubtree(this.makeProjectRelativeIfPossible(path));
    };

    /**
     * Toggle the open state of subdirectories.
     * @param {!string}  path        parent directory
     * @param {boolean} openOrClose  true to open directory, false to close
     * @return {$.Promise} promise resolved when the directories are open
     */
    ProjectModel.prototype.toggleSubdirectories = function (path, openOrClose) {
        var self = this,
            d = new $.Deferred();

        this.setDirectoryOpen(path, true).then(function () {
            var projectRelativePath = self.makeProjectRelativeIfPossible(path),
                childNodes = self._viewModel.getChildDirectories(projectRelativePath);

            Async.doInParallel(childNodes, function (node) {
                return self.setDirectoryOpen(path + node, openOrClose);
            }, true).then(function () {
                d.resolve();
            }, function (err) {
                d.reject(err);
            });
        });

        return d.promise();
    };

    /**
     * Although Brackets is generally standardized on folder paths with a trailing "/", some APIs here
     * receive project paths without "/" due to legacy preference storage formats, etc.
     * @param {!string} fullPath  Path that may or may not end in "/"
     * @return {!string} Path that ends in "/"
     */
    function _ensureTrailingSlash(fullPath) {
        if (_pathIsFile(fullPath)) {
            return fullPath + "/";
        }
        return fullPath;
    }

    /**
     * @private
     *
     * Returns the full path to the welcome project, which we open on first launch.
     *
     * @param {string} sampleUrl URL for getting started project
     * @param {string} initialPath Path to Brackets directory (see {@link FileUtils::#getNativeBracketsDirectoryPath})
     * @return {!string} fullPath reference
     */
    function _getWelcomeProjectPath(sampleUrl, initialPath) {
        if (sampleUrl) {
            // Back up one more folder. The samples folder is assumed to be at the same level as
            // the src folder, and the sampleUrl is relative to the samples folder.
            initialPath = initialPath.substr(0, initialPath.lastIndexOf("/")) + "/samples/" + sampleUrl;
        }

        return _ensureTrailingSlash(initialPath); // paths above weren't canonical
    }

    /**
     * @private
     *
     * Adds the path to the list of welcome projects we've ever seen, if not on the list already.
     *
     * @param {string} path Path to possibly add
     * @param {Array.<string>=} currentProjects Array of current welcome projects
     * @return {Array.<string>} New array of welcome projects with the additional project added
     */
    function _addWelcomeProjectPath(path, currentProjects) {
        var pathNoSlash = FileUtils.stripTrailingSlash(path);  // "welcomeProjects" pref has standardized on no trailing "/"

        var newProjects;

        if (currentProjects) {
            newProjects = _.clone(currentProjects);
        } else {
            newProjects = [];
        }

        if (newProjects.indexOf(pathNoSlash) === -1) {
            newProjects.push(pathNoSlash);
        }
        return newProjects;
    }

    /**
     * Returns true if the given path is the same as one of the welcome projects we've previously opened,
     * or the one for the current build.
     *
     * @param {string} path Path to check to see if it's a welcome project
     * @param {string} welcomeProjectPath Current welcome project path
     * @param {Array.<string>=} welcomeProjects All known welcome projects
     */
    function _isWelcomeProjectPath(path, welcomeProjectPath, welcomeProjects) {
        if (path === welcomeProjectPath) {
            return true;
        }

        // No match on the current path, and it's not a match if there are no previously known projects
        if (!welcomeProjects) {
            return false;
        }

        var pathNoSlash = FileUtils.stripTrailingSlash(path);  // "welcomeProjects" pref has standardized on no trailing "/"
        return welcomeProjects.indexOf(pathNoSlash) !== -1;
    }

    // Init invalid characters string
    if (brackets.platform === "mac") {
        _invalidChars = "?*|:/";
    } else if (brackets.platform === "linux") {
        _invalidChars = "?*|/";
    } else {
        _invalidChars = "/?*:<>\\|\"";  // invalid characters on Windows
    }

    exports._getWelcomeProjectPath  = _getWelcomeProjectPath;
    exports._addWelcomeProjectPath  = _addWelcomeProjectPath;
    exports._isWelcomeProjectPath   = _isWelcomeProjectPath;
    exports._ensureTrailingSlash    = _ensureTrailingSlash;
    exports._shouldShowName         = _shouldShowName;
    exports._invalidChars           = _invalidChars;

    exports.shouldShow              = shouldShow;
    exports.defaultIgnoreGlobs      = defaultIgnoreGlobs;
    exports.isValidFilename         = isValidFilename;
    exports.EVENT_CHANGE            = EVENT_CHANGE;
    exports.EVENT_SHOULD_SELECT     = EVENT_SHOULD_SELECT;
    exports.EVENT_SHOULD_FOCUS      = EVENT_SHOULD_FOCUS;
    exports.ERROR_CREATION          = ERROR_CREATION;
    exports.ERROR_INVALID_FILENAME  = ERROR_INVALID_FILENAME;
    exports.ERROR_NOT_IN_PROJECT    = ERROR_NOT_IN_PROJECT;
    exports.FILE_RENAMING           = FILE_RENAMING;
    exports.FILE_CREATING           = FILE_CREATING;
    exports.RENAME_CANCELLED        = RENAME_CANCELLED;
    exports.doCreate                = doCreate;
    exports.ProjectModel            = ProjectModel;
});
