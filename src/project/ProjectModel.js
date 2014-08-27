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

/* unittests: ProjectModel */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";
    
    var InMemoryFile        = require("document/InMemoryFile"),
        FileUtils           = require("file/FileUtils"),
        _                   = require("thirdparty/lodash"),
        FileSystem          = require("filesystem/FileSystem"),
        FileSystemError     = require("filesystem/FileSystemError"),
        FileViewController  = require("project/FileViewController"),
        FileTreeViewModel   = require("project/FileTreeViewModel"),
        Async               = require("utils/Async");
    
    // Constants
    var EVENT_CHANGE = "change",
        EVENT_SHOULD_SELECT = "select",
        ERROR_CREATION = "creationError",
        ERROR_INVALID_FILENAME = "invalidFilename";
    
    /**
     * @private
     * File and folder names which are not displayed or searched
     * TODO: We should add the rest of the file names that TAR excludes:
     *    http://www.gnu.org/software/tar/manual/html_section/exclude.html
     * TODO: This should be user configurable
     *    https://github.com/adobe/brackets/issues/6781
     * @type {RegExp}
     */
    var _exclusionListRegEx = /\.pyc$|^\.git$|^\.gitmodules$|^\.svn$|^\.DS_Store$|^Thumbs\.db$|^\.hg$|^CVS$|^\.hgtags$|^\.idea$|^\.c9revisions$|^\.SyncArchive$|^\.SyncID$|^\.SyncIgnore$|\~$/;

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
     * TODO This likely belongs in FileUtils.
     * 
     * @param {string} filename to check
     * @param {string} invalidChars List of characters that are disallowed
     * @return {boolean} true if the filename is valid
     */
    function isValidFilename(filename, invalidChars) {
        // Validate file name
        // Checks for valid Windows filenames:
        // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
        return !((filename.search(new RegExp("[" + invalidChars + "]+")) !== -1) ||
                 filename.match(_illegalFilenamesRegEx));
    }
    
    /**
     * @private
     * See shouldShow
     */
    function _shouldShowName(name) {
        return !name.match(_exclusionListRegEx);
    }

    /**
     * Returns false for files and directories that are not commonly useful to display.
     *
     * @param {FileSystemEntry} entry File or directory to filter
     * @return boolean true if the file should be displayed
     */
    function shouldShow(entry) {
        return _shouldShowName(entry.name);
    }

    // Constants used by the ProjectModel
    
    var FILE_RENAMING = 0,
        FILE_CREATING = 1,
        RENAME_CANCELLED = 3;

    
    function _pathIsFile(path) {
        return _.last(path) !== "/";
    }

    function _getFSObject(path) {
        if (!path) {
            return path;
        } else if (_pathIsFile(path)) {
            return FileSystem.getFileForPath(path);
        }
        return FileSystem.getDirectoryForPath(path);
    }

    function _getPathFromFSObject(fsobj) {
        if (fsobj && fsobj.fullPath) {
            return fsobj.fullPath;
        }
        return fsobj;
    }

    // This belongs somewhere in the filesystem...
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

                    file.write("", function (err) {
                        if (err) {
                            d.reject(err);
                        } else {
                            d.resolve(file);
                        }
                    });
                }
            }
        });

        return d.promise();
    }
    
    function ProjectModel(initial) {
        if (initial && initial.projectRoot) {
            this.projectRoot = initial.projectRoot;
        }
        this._viewModel = new FileTreeViewModel.FileTreeViewModel();
        this._viewModel.on(FileTreeViewModel.EVENT_CHANGE, function () {
            $(this).trigger(EVENT_CHANGE);
        }.bind(this));
        this._selections = {};
    }

    /**
     * @private
     * @see getProjectRoot()
     * @type {Directory}
     */
    ProjectModel.prototype.projectRoot = null;

    /**
     * @private
     * Encoded URL
     * @ see getBaseUrl(), setBaseUrl()
     */
    ProjectModel.prototype.projectBaseUrl = "";

    /**
     * @private
     * Promise for generating the cache of all files
     * @type {jQuery.Promise}
     */
    ProjectModel.prototype.projectBaseUrl = null;
    
    ProjectModel.prototype._selections = null;
    
    /**
     * @private
     * @type {?jQuery.Promise.<Array<File>>}
     * A promise that is resolved with an array of all project files. Used by 
     * ProjectManager.getAllFiles().
     */
    ProjectModel.prototype._allFilesCachePromise = null;

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
        
        this.projectBaseUrl = projectBaseUrl;
        return projectBaseUrl;
    };
    
    /**
     * Returns true if absPath lies within the project, false otherwise.
     * Does not support paths containing ".."
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
     * Returns a promise that resolves with a cached copy of all project files.
     * Used by ProjectManager.getAllFiles(). Ensures that at most one un-cached
     * directory traversal is active at a time, which is useful at project load
     * time when watchers (and hence filesystem-level caching) has not finished
     * starting up. The cache is cleared on every filesystem change event, and
     * also on project load and unload.
     * 
     * @private
     * @return {jQuery.Promise.<Array.<File>>}
     */
    ProjectModel.prototype._getAllFilesCache = function _getAllFilesCache() {
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

            this.projectRoot.visit(allFilesVisitor, function (err) {
                if (err) {
                    // TODO handle TOO_MANY_ENTRIES error
                    // Probably should move the warned flag in here and emit an error
                    // event.
                    deferred.reject(err);
                } else {
                    deferred.resolve(allFiles);
                }
            }.bind(this));
        }

        return this._allFilesCachePromise;
    };

    /**
     * Returns an Array of all files for this project, optionally including
     * files in the working set that are *not* under the project root. Files filtered
     * out by shouldShow().
     *
     * @param {function (File, number):boolean=} filter Optional function to filter
     *          the file list (does not filter directory traversal). API matches Array.filter().
     * @param {Array.<File>=} additionalFiles Additional files to include (for example, the WorkingSet)
     *          Only adds files that are *not* under the project root or untitled documents.
     *
     * @return {$.Promise} Promise that is resolved with an Array of File objects.
     */
    ProjectModel.prototype.getAllFiles = function getAllFiles(filter, additionalFiles) {
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
        this._getAllFilesCache().done(function (result) {
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
                console.warn("Unhandled exception in getAllFiles handler: ", e);
            }
        }).fail(function (err) {
            try {
                filteredFilesDeferred.resolve([]);
            } catch (e) {
                console.warn("Unhandled exception in getAllFiles handler: ", e);
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
    
    ProjectModel.prototype.on = function (event, handler) {
        $(this).on(event, handler);
    };
    
    ProjectModel.prototype.off = function (event, handler) {
        $(this).off(event, handler);
    };
    
    ProjectModel.prototype.setProjectRoot = function (projectRoot) {
        this.projectRoot = projectRoot;
        this._resetCache();
        
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
    
    ProjectModel.prototype.setDirectoryOpen = function (path, open) {
        var projectRelative = this.makeProjectRelativeIfPossible(path),
            needsLoading = this._viewModel.setDirectoryOpen(projectRelative, open),
            d = new $.Deferred(),
            self = this;
        
        function onSuccess(contents) {
            if (contents) {
                self._viewModel.setDirectoryContents(projectRelative, contents);
            }
            var currentSelection = self._selections.selected,
                invisibleSelection = self._selections.selectIfVisible;

            if (!open && currentSelection) {
                var currentSelectionInProject = self.makeProjectRelativeIfPossible(currentSelection);
                if (!self._viewModel.isFilePathVisible(currentSelectionInProject)) {
                    self.setSelected(path, true);
                    self._selections.selectIfVisible = currentSelection;
                }
            } else if (open && self._selections.selectIfVisible) {
                var invisibleSelectionInProject = self.makeProjectRelativeIfPossible(self._selections.selectIfVisible);
                if (self._viewModel.isFilePathVisible(invisibleSelectionInProject)) {
                    self.setSelected(invisibleSelection, true);
                    delete self._selections.selectIfVisible;
                }
            }
            
            d.resolve();
        }
        
        if (needsLoading) {
            this._getDirectoryContents(path).then(onSuccess).fail(function (err) {
                d.reject(err);
            });
        } else {
            onSuccess();
        }
        
        return d.promise();
    };
    
    ProjectModel.prototype.setSelected = function (path, doNotOpen) {
        path = _getPathFromFSObject(path);
        this.performRename();
        var oldProjectPath = this.makeProjectRelativeIfPossible(this._selections.selected),
            pathInProject = this.makeProjectRelativeIfPossible(path),
            newPathIsVisible = this._viewModel.isFilePathVisible(pathInProject),
            pathToSelectInTree = newPathIsVisible ? pathInProject : null;
        
        this._viewModel.moveMarker("selected", oldProjectPath, pathToSelectInTree);
        if (this._selections.context) {
            this._viewModel.moveMarker("context", this.makeProjectRelativeIfPossible(this._selections.context), null);
        }
        this._selections = {
            selected: path
        };
        if (path && !newPathIsVisible) {
            this._selections.selectIfVisible = path;
            this._selections.selected = null;
        }
        
        if (!doNotOpen && path && _.last(path) !== "/") {
            $(this).trigger(EVENT_SHOULD_SELECT, {
                path: path
            });
        }
    };
    
    ProjectModel.prototype.getSelected = function () {
        return _getFSObject(this._selections.selected);
    };
    
    ProjectModel.prototype.selectInWorkingSet = function (path) {
        this.performRename();
        FileViewController.addToWorkingSetAndSelect(path);
    };
    
    ProjectModel.prototype.setContext = function (path) {
        path = _getPathFromFSObject(path);
        this.performRename();
        var currentContext = this._selections.context;
        this._selections.context = path;
        this._viewModel.moveMarker("context", this.makeProjectRelativeIfPossible(currentContext),
                                   this.makeProjectRelativeIfPossible(path));
    };
    
    ProjectModel.prototype.getContext = function () {
        return _getFSObject(this._selections.context);
    };
    
    ProjectModel.prototype.startRename = function (path) {
        path = _getPathFromFSObject(path);
        if (!path) {
            path = this._selections.context;
            if (!path) {
                return;
            }
        }
        
        if (this._selections.rename && this._selections.rename.path === path) {
            return;
        }
        
        if (path !== this._selections.context) {
            this.setContext(path);
        } else {
            this.performRename();
        }
        
        this._viewModel.moveMarker("rename", null,
                                   this.makeProjectRelativeIfPossible(path));
        var d = new $.Deferred();
        this._selections.rename = {
            deferred: d,
            type: FILE_RENAMING,
            path: path,
            newName: _.last(path.split("/"))
        };
        return d.promise();
    };
    
    ProjectModel.prototype.setRenameValue = function (name) {
        if (!this._selections.rename) {
            return;
        }
        this._selections.rename.newName = name;
    };
    
    ProjectModel.prototype.cancelRename = function () {
        var renameInfo = this._selections.rename;
        if (!renameInfo) {
            return;
        }
        
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
     * @param {string} oldName Old item name
     * @param {string} newName New item name
     * @param {boolean} isFolder True if item is a folder; False if it is a file.
     * @return {$.Promise} A promise object that will be resolved or rejected when
     *   the rename is finished.
     */
    function _renameItem(oldName, newName, isFolder) {
        var result = new $.Deferred();

        if (oldName === newName) {
            result.resolve();
            return result.promise();
        }

        var entry = isFolder ? FileSystem.getDirectoryForPath(oldName) : FileSystem.getFileForPath(oldName);
        entry.rename(newName, function (err) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve();
            }
        });

        return result.promise();
    }
    
    ProjectModel.prototype._renameItem = function (oldPath, newName) {
        return _renameItem(oldPath, newName, !_pathIsFile(oldPath));
    };
    
    ProjectModel.prototype.performRename = function () {
        var renameInfo = this._selections.rename;
        if (!renameInfo) {
            return;
        }
        var oldPath = renameInfo.path,
            isFolder = renameInfo.isFolder || !_pathIsFile(oldPath),
            oldProjectPath = this.makeProjectRelativeIfPossible(oldPath),
            
            // To get the parent directory, we need to strip off the trailing slash on a directory name
            parentDirectory = FileUtils.getDirectoryPath(isFolder ? FileUtils.stripTrailingSlash(oldPath) : oldPath),
            oldName = FileUtils.getBaseName(oldPath),
            newName = renameInfo.newName,
            newPath = parentDirectory + newName,
            viewModel = this._viewModel,
            self = this;
        
        if (oldName === newName) {
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

        if (renameInfo.type === FILE_CREATING) {
            this.createAtPath(newPath).done(function (entry) {
                viewModel.renameItem(oldProjectPath, newName);
                renameInfo.deferred.resolve(entry);
            }).fail(function (error) {
                self.cancelCreating();
                renameInfo.deferred.reject(error);
            });
        } else {
            this._renameItem(oldPath, newPath).then(function () {
                viewModel.renameItem(oldProjectPath, newName);
                renameInfo.deferred.resolve({
                    newPath: newPath
                });
            }).fail(function (error) {
                renameInfo.deferred.reject(error);
            });
        }
    };
    
    ProjectModel.prototype.createAtPath = function (path) {
        var isFolder = _.last(path) === "/",
            name = FileUtils.getBaseName(path),
            self = this;

        return doCreate(path, isFolder).done(function (entry) {
            if (!isFolder) {
                self.setSelected(entry.fullPath);
            }
        }).fail(function (error) {
            $(self).trigger(ERROR_CREATION, {
                type: error,
                name: name,
                isFolder: isFolder
            });
        });
    };
    
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
            promise.then(d.resolve);
        }).fail(function (err) {
            d.reject(err);
        });
        return d.promise();
    };
    
    ProjectModel.prototype._cancelCreating = function () {
        var renameInfo = this._selections.rename;
        if (!renameInfo || renameInfo.type !== FILE_CREATING) {
            return;
        }
        this._viewModel.deleteAtPath(this.makeProjectRelativeIfPossible(renameInfo.path));
        renameInfo.deferred.resolve(RENAME_CANCELLED);
        delete this._selections.rename;
    };
    
    ProjectModel.prototype.setSortDirectoriesFirst = function (sortDirectoriesFirst) {
        this._viewModel.setSortDirectoriesFirst(sortDirectoriesFirst);
    };
    
    ProjectModel.prototype.getOpenNodes = function () {
        return this._viewModel.getOpenNodes(this.projectRoot.fullPath);
    };
    
    /**
     * Reopens a set of nodes in the tree by ID.
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


    ProjectModel.prototype.refresh = function () {
        var projectRoot = this.projectRoot,
            openNodes = this.getOpenNodes(),
            self = this,
            deferred = new $.Deferred();
        
        this.setProjectRoot(projectRoot).then(function () {
            self.reopenNodes(openNodes).then(function () {
                deferred.resolve();
            });
        });

        return deferred.promise();
    };


    ProjectModel.prototype.isOpen = function (path) {
        return this._viewModel.isOpen(path);
    };
    
    /**
     * Although Brackets is generally standardized on folder paths with a trailing "/", some APIs here
     * receive project paths without "/" due to legacy preference storage formats, etc.
     * @param {!string} fullPath  Path that may or may not end in "/"
     * @return {!string} Path that ends in "/"
     */
    function _ensureTrailingSlash(fullPath) {
        if (fullPath[fullPath.length - 1] !== "/") {
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
     * @param {string} initialPath Path to Brackets directory (see FileUtils.getNativeBracketsDirectoryPath())
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
     * Adds the path to the list of welcome projects we've ever seen, if not on the list already.
     * 
     * @param {string} path Path to possibly add
     * @param {=Array.<string>} currentProjects Array of current welcome projects
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
        _invalidChars = "?*|:";
    } else if (brackets.platform === "linux") {
        _invalidChars = "?*|/";
    } else {
        _invalidChars = "/?*:<>\\|\"";  // invalid characters on Windows
    }

    exports._getWelcomeProjectPath = _getWelcomeProjectPath;
    exports._addWelcomeProjectPath = _addWelcomeProjectPath;
    exports._isWelcomeProjectPath = _isWelcomeProjectPath;
    exports._ensureTrailingSlash = _ensureTrailingSlash;
    exports._shouldShowName = _shouldShowName;
    exports._invalidChars = _invalidChars;
    
    exports.shouldShow = shouldShow;
    exports.isValidFilename = isValidFilename;
    exports.EVENT_CHANGE = EVENT_CHANGE;
    exports.EVENT_SHOULD_SELECT = EVENT_SHOULD_SELECT;
    exports.ERROR_CREATION = ERROR_CREATION;
    exports.ERROR_INVALID_FILENAME = ERROR_INVALID_FILENAME;
    exports.FILE_RENAMING = FILE_RENAMING;
    exports.FILE_CREATING = FILE_CREATING;
    exports.RENAME_CANCELLED = RENAME_CANCELLED;
    exports.doCreate = doCreate;
    exports.ProjectModel = ProjectModel;
});