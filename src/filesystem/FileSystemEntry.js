/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";
    
    var FileSystemError = require("filesystem/FileSystemError");
    
    var VISIT_DEFAULT_MAX_DEPTH = 100,
        VISIT_DEFAULT_MAX_ENTRIES = 30000;
    
    /* Counter to give every entry a unique id */
    var nextId = 0;
    
    /**
     * @constructor
     * Model for a file system entry. This is the base class for File and Directory,
     * and is never used directly.
     *
     * See the File, Directory, and FileSystem classes for more details.
     *
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
        this._impl.exists(this._path, callback);
    };
    
    /**
     * Returns the stats for the entry.
     *
     * @param {function (?string, FileSystemStats=)} callback Callback with a
     *      FileSystemError string or FileSystemStats object.
     */
    FileSystemEntry.prototype.stat = function (callback) {
        this._impl.stat(this._path, function (err, stat) {
            if (!err) {
                this._stat = stat;
            }
            callback(err, stat);
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
        this._fileSystem._beginWrite();
        this._impl.rename(this._path, newFullPath, function (err) {
            try {
                if (!err) {
                    // Notify the file system of the name change
                    this._fileSystem._entryRenamed(this._path, newFullPath, this.isDirectory);
                }
                callback(err);  // notify caller
            } finally {
                this._fileSystem._endWrite();  // unblock generic change events
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
        
        this._clearCachedData();
        
        this._impl.unlink(this._path, function (err) {
            if (!err) {
                this._fileSystem._index.removeEntry(this);
            }
            
            callback.apply(undefined, arguments);
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
        callback = callback || function () {};
        if (!this._impl.moveToTrash) {
            this.unlink(callback);
            return;
        }
        
        this._clearCachedData();
        
        this._impl.moveToTrash(this._path, function (err) {
            if (!err) {
                this._fileSystem._index.removeEntry(this);
            }
            
            callback.apply(undefined, arguments);
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
     * @param {{maxDepth: number, maxEntriesCounter: {value: number}}} options
     * @param {function(?string)=} callback Callback with single FileSystemError string parameter.
     */
    FileSystemEntry.prototype._visitHelper = function (stats, visitedPaths, visitor, options, callback) {
        var maxDepth = options.maxDepth,
            maxEntriesCounter = options.maxEntriesCounter;
        
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
                maxEntriesCounter: maxEntriesCounter
            };
            
            entries.forEach(function (entry, index) {
                var stats = entriesStats[index];
                entry._visitHelper(stats, visitedPaths, visitor, nextOptions, helperCallback);
            });
        }.bind(this));
    };
    
    /**
     * Visit this entry and its descendents with the supplied visitor function.
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
        } else if (options === undefined) {
            options = {};
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
