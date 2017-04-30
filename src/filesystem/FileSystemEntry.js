/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/*
 * To ensure cache coherence, current and future asynchronous state-changing
 * operations of FileSystemEntry and its subclasses should implement the
 * following high-level sequence of steps:
 *
 * 1. Block external filesystem change events;
 * 2. Execute the low-level state-changing operation;
 * 3. Update the internal filesystem state, including caches;
 * 4. Apply the callback;
 * 5. Fire an appropriate internal change notification; and
 * 6. Unblock external change events.
 *
 * Note that because internal filesystem state is updated first, both the original
 * caller and the change notification listeners observe filesystem state that is
 * current w.r.t. the operation. Furthermore, because external change events are
 * blocked before the operation begins, listeners will only receive the internal
 * change event for the operation and not additional (or possibly inconsistent)
 * external change events.
 *
 * State-changing operations that block external filesystem change events must
 * take care to always subsequently unblock the external change events in all
 * control paths. It is safe to assume, however, that the underlying impl will
 * always apply the callback with some value.

 * Caches should be conservative. Consequently, the entry's cached data should
 * always be cleared if the underlying impl's operation fails. This is the case
 * event for read-only operations because an unexpected failure implies that the
 * system is in an unknown state. The entry should communicate this by failing
 * where appropriate, and should not use the cache to hide failure.
 *
 * Only watched entries should make use of cached data because change events are
 * only expected for such entries, and change events are used to granularly
 * invalidate out-of-date caches.
 *
 * By convention, callbacks are optional for asynchronous, state-changing
 * operations, but required for read-only operations. The first argument to the
 * callback should always be a nullable error string from FileSystemError.
 */
define(function (require, exports, module) {
    "use strict";

    var FileSystemError = require("filesystem/FileSystemError"),
        WatchedRoot     = require("filesystem/WatchedRoot");

    var VISIT_DEFAULT_MAX_DEPTH = 100,
        VISIT_DEFAULT_MAX_ENTRIES = 30000;

    /* Counter to give every entry a unique id */
    var nextId = 0;

    /**
     * Model for a file system entry. This is the base class for File and Directory,
     * and is never used directly.
     *
     * See the File, Directory, and FileSystem classes for more details.
     *
     * @constructor
     * @param {string} path The path for this entry.
     * @param {FileSystem} fileSystem The file system associated with this entry.
     */
    function FileSystemEntry(path, fileSystem) {
        this._setPath(path);
        this._fileSystem = fileSystem;
        this._id = nextId++;
    }

    // Add "fullPath", "name", "parent", "id", "isFile" and "isDirectory" getters
    Object.defineProperties(FileSystemEntry.prototype, {
        "fullPath": {
            get: function () { return this._path; },
            set: function () { throw new Error("Cannot set fullPath"); }
        },
        "name": {
            get: function () { return this._name; },
            set: function () { throw new Error("Cannot set name"); }
        },
        "parentPath": {
            get: function () { return this._parentPath; },
            set: function () { throw new Error("Cannot set parentPath"); }
        },
        "id": {
            get: function () { return this._id; },
            set: function () { throw new Error("Cannot set id"); }
        },
        "isFile": {
            get: function () { return this._isFile; },
            set: function () { throw new Error("Cannot set isFile"); }
        },
        "isDirectory": {
            get: function () { return this._isDirectory; },
            set: function () { throw new Error("Cannot set isDirectory"); }
        },
        "_impl": {
            get: function () { return this._fileSystem._impl; },
            set: function () { throw new Error("Cannot set _impl"); }
        }
    });

    /**
     * Cached stat object for this file.
     * @type {?FileSystemStats}
     */
    FileSystemEntry.prototype._stat = null;

    /**
     * Parent file system.
     * @type {!FileSystem}
     */
    FileSystemEntry.prototype._fileSystem = null;

    /**
     * The path of this entry.
     * @type {string}
     */
    FileSystemEntry.prototype._path = null;

    /**
     * The name of this entry.
     * @type {string}
     */
    FileSystemEntry.prototype._name = null;

    /**
     * The parent of this entry.
     * @type {string}
     */
    FileSystemEntry.prototype._parentPath = null;

    /**
     * Whether or not the entry is a file
     * @type {boolean}
     */
    FileSystemEntry.prototype._isFile = false;

    /**
     * Whether or not the entry is a directory
     * @type {boolean}
     */
    FileSystemEntry.prototype._isDirectory = false;

    /**
     * Cached copy of this entry's watched root
     * @type {entry: File|Directory, filter: function(FileSystemEntry):boolean, active: boolean}
     */
    FileSystemEntry.prototype._watchedRoot = undefined;

    /**
     * Cached result of _watchedRoot.filter(this.name, this.parentPath).
     * @type {boolean}
     */
    FileSystemEntry.prototype._watchedRootFilterResult = undefined;

    /**
     * Determines whether or not the entry is watched.
     * @param {boolean=} relaxed If falsey, the method will only return true if
     *      the watched root is fully active. If true, the method will return
     *      true if the watched root is either starting up or fully active.
     * @return {boolean}
     */
    FileSystemEntry.prototype._isWatched = function (relaxed) {
        var watchedRoot = this._watchedRoot,
            filterResult = this._watchedRootFilterResult;

        if (!watchedRoot) {
            watchedRoot = this._fileSystem._findWatchedRootForPath(this._path);

            if (watchedRoot) {
                this._watchedRoot = watchedRoot;
                if (watchedRoot.entry !== this) { // avoid creating entries for root's parent
                    var parentEntry = this._fileSystem.getDirectoryForPath(this._parentPath);
                    if (parentEntry._isWatched() === false) {
                        filterResult = false;
                    } else {
                        filterResult = watchedRoot.filter(this._name, this._parentPath);
                    }
                } else { // root itself is watched
                    filterResult = true;
                }
                this._watchedRootFilterResult = filterResult;
            }
        }

        if (watchedRoot) {
            if (watchedRoot.status === WatchedRoot.ACTIVE ||
                    (relaxed && watchedRoot.status === WatchedRoot.STARTING)) {
                return filterResult;
            } else {
                // We had a watched root, but it's no longer active, so it must now be invalid.
                this._watchedRoot = undefined;
                this._watchedRootFilterResult = false;
                this._clearCachedData();
            }
        }
        return false;
    };

    /**
     * Update the path for this entry
     * @private
     * @param {String} newPath
     */
    FileSystemEntry.prototype._setPath = function (newPath) {
        var parts = newPath.split("/");
        if (this.isDirectory) {
            parts.pop(); // Remove the empty string after last trailing "/"
        }
        this._name = parts[parts.length - 1];
        parts.pop(); // Remove name

        if (parts.length > 0) {
            this._parentPath = parts.join("/") + "/";
        } else {
            // root directories have no parent path
            this._parentPath = null;
        }

        this._path = newPath;

        var watchedRoot = this._watchedRoot;
        if (watchedRoot) {
            if (newPath.indexOf(watchedRoot.entry.fullPath) === 0) {
                // Update watchedRootFilterResult
                this._watchedRootFilterResult = watchedRoot.filter(this._name, this._parentPath);
            } else {
                // The entry was moved outside of the watched root
                this._watchedRoot = null;
                this._watchedRootFilterResult = false;
            }
        }
    };

    /**
     * Clear any cached data for this entry
     * @private
     */
    FileSystemEntry.prototype._clearCachedData = function () {
        this._stat = undefined;
    };

    /**
     * Helpful toString for debugging purposes
     */
    FileSystemEntry.prototype.toString = function () {
        return "[" + (this.isDirectory ? "Directory " : "File ") + this._path + "]";
    };

    /**
     * Check to see if the entry exists on disk. Note that there will NOT be an
     * error returned if the file does not exist on the disk; in that case the
     * error parameter will be null and the boolean will be false. The error
     * parameter will only be truthy when an unexpected error was encountered
     * during the test, in which case the state of the entry should be considered
     * unknown.
     *
     * @param {function (?string, boolean)} callback Callback with a FileSystemError
     *      string or a boolean indicating whether or not the file exists.
     */
    FileSystemEntry.prototype.exists = function (callback) {
        if (this._stat) {
            callback(null, true);
            return;
        }

        this._impl.exists(this._path, function (err, exists) {
            if (err) {
                this._clearCachedData();
                callback(err);
                return;
            }

            if (!exists) {
                this._clearCachedData();
            }

            callback(null, exists);
        }.bind(this));
    };

    /**
     * Returns the stats for the entry.
     *
     * @param {function (?string, FileSystemStats=)} callback Callback with a
     *      FileSystemError string or FileSystemStats object.
     */
    FileSystemEntry.prototype.stat = function (callback) {
        if (this._stat) {
            callback(null, this._stat);
            return;
        }

        this._impl.stat(this._path, function (err, stat) {
            if (err) {
                this._clearCachedData();
                callback(err);
                return;
            }

            if (this._isWatched()) {
                this._stat = stat;
            }

            callback(null, stat);
        }.bind(this));
    };

    /**
     * Rename this entry.
     *
     * @param {string} newFullPath New path & name for this entry.
     * @param {function (?string)=} callback Callback with a single FileSystemError
     *      string parameter.
     */
    FileSystemEntry.prototype.rename = function (newFullPath, callback) {
        callback = callback || function () {};

        // Block external change events until after the write has finished
        this._fileSystem._beginChange();

        this._impl.rename(this._path, newFullPath, function (err) {
            var oldFullPath = this._path;

            try {
                if (err) {
                    this._clearCachedData();
                    callback(err);
                    return;
                }

                // Update internal filesystem state
                this._fileSystem._handleRename(this._path, newFullPath, this.isDirectory);

                try {
                    // Notify the caller
                    callback(null);
                } finally {
                    // Notify rename listeners
                    this._fileSystem._fireRenameEvent(oldFullPath, newFullPath);
                }
            } finally {
                // Unblock external change events
                this._fileSystem._endChange();
            }
        }.bind(this));
    };

    /**
     * Permanently delete this entry. For Directories, this will delete the directory
     * and all of its contents. For reversible delete, see moveToTrash().
     *
     * @param {function (?string)=} callback Callback with a single FileSystemError
     *      string parameter.
     */
    FileSystemEntry.prototype.unlink = function (callback) {
        callback = callback || function () {};

        // Block external change events until after the write has finished
        this._fileSystem._beginChange();

        this._clearCachedData();
        this._impl.unlink(this._path, function (err) {
            var parent = this._fileSystem.getDirectoryForPath(this.parentPath);

            // Update internal filesystem state
            this._fileSystem._handleDirectoryChange(parent, function (added, removed) {
                try {
                    // Notify the caller
                    callback(err);
                } finally {
                    if (parent._isWatched()) {
                        // Notify change listeners
                        this._fileSystem._fireChangeEvent(parent, added, removed);
                    }

                    // Unblock external change events
                    this._fileSystem._endChange();
                }
            }.bind(this));
        }.bind(this));
    };

    /**
     * Move this entry to the trash. If the underlying file system doesn't support move
     * to trash, the item is permanently deleted.
     *
     * @param {function (?string)=} callback Callback with a single FileSystemError
     *      string parameter.
     */
    FileSystemEntry.prototype.moveToTrash = function (callback) {
        if (!this._impl.moveToTrash) {
            this.unlink(callback);
            return;
        }

        callback = callback || function () {};

        // Block external change events until after the write has finished
        this._fileSystem._beginChange();

        this._clearCachedData();
        this._impl.moveToTrash(this._path, function (err) {
            var parent = this._fileSystem.getDirectoryForPath(this.parentPath);

            // Update internal filesystem state
            this._fileSystem._handleDirectoryChange(parent, function (added, removed) {
                try {
                    // Notify the caller
                    callback(err);
                } finally {
                    if (parent._isWatched()) {
                        // Notify change listeners
                        this._fileSystem._fireChangeEvent(parent, added, removed);
                    }

                    // Unblock external change events
                    this._fileSystem._endChange();
                }
            }.bind(this));
        }.bind(this));
    };

    /**
     * Private helper function for FileSystemEntry.visit that requires sanitized options.
     *
     * @private
     * @param {FileSystemStats} stats - the stats for this entry
     * @param {{string: boolean}} visitedPaths - the set of fullPaths that have already been visited
     * @param {function(FileSystemEntry): boolean} visitor - A visitor function, which is
     *      applied to descendent FileSystemEntry objects. If the function returns false for
     *      a particular Directory entry, that directory's descendents will not be visited.
     * @param {{maxDepth: number, maxEntriesCounter: {value: number}, sortList: boolean}} options
     * @param {function(?string)=} callback Callback with single FileSystemError string parameter.
     */
    FileSystemEntry.prototype._visitHelper = function (stats, visitedPaths, visitor, options, callback) {
        var maxDepth = options.maxDepth,
            maxEntriesCounter = options.maxEntriesCounter,
            sortList = options.sortList;

        if (maxEntriesCounter.value-- <= 0 || maxDepth-- < 0) {
            // The outer FileSystemEntry.visit call is responsible for applying
            // the main callback to FileSystemError.TOO_MANY_FILES in this case
            callback(null);
            return;
        }

        if (this.isDirectory) {
            var visitedPath = stats.realPath || this.fullPath;

            if (visitedPaths.hasOwnProperty(visitedPath)) {
                // Link cycle detected
                callback(null);
                return;
            }

            visitedPaths[visitedPath] = true;
        }

        if (!visitor(this) || this.isFile) {
            callback(null);
            return;
        }

        this.getContents(function (err, entries, entriesStats) {
            if (err) {
                callback(err);
                return;
            }

            var counter = entries.length;
            if (counter === 0) {
                callback(null);
                return;
            }

            function helperCallback(err) {
                if (--counter === 0) {
                    callback(null);
                }
            }

            var nextOptions = {
                maxDepth: maxDepth,
                maxEntriesCounter: maxEntriesCounter,
                sortList : sortList
            };

            //sort entries if required
            function compareFilesWithIndices(index1, index2) {
                return entries[index1]._name.toLocaleLowerCase().localeCompare(entries[index2]._name.toLocaleLowerCase());
            }
            if (sortList) {
                var fileIndexes = [], i = 0;
                for (i = 0; i < entries.length; i++) {
                    fileIndexes[i] = i;
                }
                fileIndexes.sort(compareFilesWithIndices);
                fileIndexes.forEach(function (fileIndex) {
                    var stats = entriesStats[fileIndexes[fileIndex]];
                    entries[fileIndexes[fileIndex]]._visitHelper(stats, visitedPaths, visitor, nextOptions, helperCallback);
                });
            } else {
                entries.forEach(function (entry, index) {
                    var stats = entriesStats[index];
                    entry._visitHelper(stats, visitedPaths, visitor, nextOptions, helperCallback);
                });
            }
        }.bind(this));
    };

    /**
     * Visit this entry and its descendents with the supplied visitor function.
     * Correctly handles symbolic link cycles and options can be provided to limit
     * search depth and total number of entries visited. No particular traversal
     * order is guaranteed; instead of relying on such an order, it is preferable
     * to use the visit function to build a list of visited entries, sort those
     * entries as desired, and then process them. Whenever possible, deep
     * filesystem traversals should use this method.
     *
     * @param {function(FileSystemEntry): boolean} visitor - A visitor function, which is
     *      applied to this entry and all descendent FileSystemEntry objects. If the function returns
     *      false for a particular Directory entry, that directory's descendents will not be visited.
     * @param {{maxDepth: number=, maxEntries: number=}=} options
     * @param {function(?string)=} callback Callback with single FileSystemError string parameter.
     */
    FileSystemEntry.prototype.visit = function (visitor, options, callback) {
        if (typeof options === "function") {
            callback = options;
            options = {};
        } else {
            if (options === undefined) {
                options = {};
            }

            callback = callback || function () {};
        }

        if (options.maxDepth === undefined) {
            options.maxDepth = VISIT_DEFAULT_MAX_DEPTH;
        }

        if (options.maxEntries === undefined) {
            options.maxEntries = VISIT_DEFAULT_MAX_ENTRIES;
        }

        options.maxEntriesCounter = { value: options.maxEntries };

        this.stat(function (err, stats) {
            if (err) {
                callback(err);
                return;
            }

            this._visitHelper(stats, {}, visitor, options, function (err) {
                if (callback) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    if (options.maxEntriesCounter.value < 0) {
                        callback(FileSystemError.TOO_MANY_ENTRIES);
                        return;
                    }

                    callback(null);
                }
            }.bind(this));
        }.bind(this));
    };

    // Export this class
    module.exports = FileSystemEntry;
});
