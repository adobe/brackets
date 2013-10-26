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
/*global define, $ */

define(function (require, exports, module) {
    "use strict";
    
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
        
    // Add "fullPath", "name", "id", "isFile" and "isDirectory" getters
    Object.defineProperties(FileSystemEntry.prototype, {
        "fullPath": {
            get: function () { return this._path; },
            set: function () { throw new Error("Cannot set fullPath"); }
        },
        "name": {
            get: function () { return this._name; },
            set: function () { throw new Error("Cannot set name"); }
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
     */
    FileSystemEntry.prototype._stat = null;

    /**
     * Parent file system.
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
            this._name = parts[parts.length - 2];
        } else {
            this._name = parts[parts.length - 1];
        }

        this._path = newPath;
    };
    
    /**
     * Helpful toString for debugging purposes
     */
    FileSystemEntry.prototype.toString = function () {
        return "[" + (this.isDirectory ? "Directory " : "File ") + this._path + "]";
    };
    
    /**
     * Check to see if the entry exists on disk.
     *
     * @param {function (boolean)} callback Callback with a single parameter.
     */
    FileSystemEntry.prototype.exists = function (callback) {
        this._impl.exists(this._path, callback);
    };
    
    /**
     * Returns the stats for the entry.
     *
     * @param {function (?string, FileSystemStats=)} callback Callback with "error" and "stat" 
     *     parameters.
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
     * Changes the mode of the entry. 
     *
     * @param {number} mode The desired mode of the entry as a number (e.g., 0777)
     * @param {function (?string)=} callback Callback with a single "error" parameter.
     */
    FileSystemEntry.prototype.chmod = function (mode, callback) {
        callback = callback || function () {};
        this._impl.chmod(this._path, mode, callback);
    };
    
    /**
     * Rename this entry.
     *
     * @param {string} newFullPath New path & name for this entry.
     * @param {function (?string)=} callback Callback with a single "error" parameter.
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
     * Unlink (delete) this entry.
     *
     * @param {function (?string)=} callback Callback with a single "error" parameter.
     */
    FileSystemEntry.prototype.unlink = function (callback) {
        callback = callback || function () {};
        this._stat = null;
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
     * @param {function (?string)=} callback Callback with a single "error" parameter.
     */
    FileSystemEntry.prototype.moveToTrash = function (callback) {
        callback = callback || function () {};
        if (!this._impl.moveToTrash) {
            this.unlink(callback);
            return;
        }
        
        this._stat = null;
        this._impl.moveToTrash(this._path, function (err) {
            if (!err) {
                this._fileSystem._index.removeEntry(this);
            }
            
            callback.apply(undefined, arguments);
        }.bind(this));
    };
    
    /**
     * Visit this entry and its descendents with the supplied visitor function.
     *
     * @param {function(FileSystemEntry): boolean} visitor - A visitor function, which is
     *      applied to descendent FileSystemEntry objects. If the function returns false for
     *      a particular Directory entry, that directory's descendents will not be visited.
     * @param {{failFast: boolean=, maxDepth: number=}=} options - An optional set of options.
     * @param {function(?string)=} callback Callback with single "error" parameter.
     */
    FileSystemEntry.prototype.visit = function (visitor, options, callback) {
        var DEFAULT_MAX_DEPTH = 100;
        
        if (typeof options === "function") {
            callback = options;
            options = {};
        } else if (options === undefined) {
            options = {};
        }
        
        callback = callback || function () {};

        var maxDepth = typeof options.maxDepth === "number" ? options.maxDepth : DEFAULT_MAX_DEPTH,
            continueTraversal = visitor(this) && maxDepth-- > 0;
        
        if (this.isFile || !continueTraversal) {
            callback(null);
            return;
        }
        
        this.getContents(function (err, entries) {
            var counter = entries ? entries.length : 0,
                newOptions = {
                    maxDepth: maxDepth,
                    failFast: options.maxDepth
                };

            if (err || counter === 0) {
                callback(err);
                return;
            }
            
            entries.forEach(function (entry) {
                entry.visit(visitor, newOptions, function (err) {
                    if (err && options.failFast) {
                        counter = 0;
                        callback(err);
                        return;
                    }
                    
                    if (--counter === 0) {
                        callback(options.failFast ? err : null);
                    }
                });
            });
        }.bind(this));
    };
    
    // Export this class
    module.exports = FileSystemEntry;
});
