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

/* TODO: Document this class/module. */

define(function (require, exports, module) {
    "use strict";
    
    /* Counter to give every entry a unique id */
    var nextId = 0;
    
    /**
     * Constructor
     * @param {string} path The path for this entry
     */
    function FileSystemEntry(path, fileSystem) {
        this._path = path;
        this._fileSystem = fileSystem;
        this._id = nextId++;
    }
        
    // Add "fullPath", "name", and "id" getters
    Object.defineProperties(FileSystemEntry.prototype, {
        "fullPath": {
            get: function () { return this._path; },
            set: function (val) { throw new Error("Cannot set fullPath"); }
        },
        "name": {
            get: function () {
                var parts = this._path.split("/");
                if (this.isDirectory()) {
                    return parts[parts.length - 2];
                } else {
                    return parts[parts.length - 1];
                }
            },
            set: function (val) { throw new Error("Cannot set name"); }
        },
        "id": {
            get: function () { return this._id; },
            set: function (val) { throw new Error("Cannot set id"); }
        },
        "_impl": {
            get: function () { return this._fileSystem._impl; },
            set: function (val) { throw new Error("Cannot set _impl"); }
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
     * Returns true if this entry is a file.
     * @return {boolean}
     */
    FileSystemEntry.prototype.isFile = function () {
        return false;
    };
    
    /**
     * Returns true if this entry is a directory.
     * @return {boolean}
     */
    FileSystemEntry.prototype.isDirectory = function () {
        return false;
    };
    
    /**
     * Helpful toString for debugging purposes
     */
    FileSystemEntry.prototype.toString = function () {
        return "[" + (this.isDirectory() ? "Directory " : "File ") + this._path + "]";
    };
    
    /**
     * Check to see if the entry exists on disk.
     *
     * @param {function (boolean)} callback Callback with a single parameter.
     */
    FileSystemEntry.prototype.exists = function (callback) {
        // If we have _stat, the entry must exist
        if (this._stat) {
            callback(true);
        } else {
            // No _stat object yet, query the system
            this._impl.exists(this._path, function (val) {
                callback(val);
            });
        }
    };
    
    /**
     * Returns the stats for the entry.
     *
     * @param {function (err, object)} callback Callback that is resolved with the entry's
     * stats.
     */
    FileSystemEntry.prototype.stat = function (callback) {
        if (this._stat) {
            callback(null, this._stat);
        } else {
            this._impl.stat(this._path, function (err, stat) {
                if (!err) {
                    this._stat = stat;
                }
                callback(err, stat);
            }.bind(this));
        }
    };
    
    /**
     * Rename this entry.
     *
     * @param {string} newFullPath New path & name for this entry.
     * @param {function (number)} callback  
     */
    FileSystemEntry.prototype.rename = function (newFullPath, callback) {
        this._fileSystem._beginWrite();
        this._impl.rename(this._path, newFullPath, function (err) {
            try {
                if (!err) {
                    // Notify the file system of the name change
                    this._fileSystem._entryRenamed(this._path, newFullPath, this.isDirectory());
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
     * @param {function (number)} callback
     */
    FileSystemEntry.prototype.unlink = function (callback) {
        this._stat = null;
        this._impl.unlink(this._path, callback || function () {});
    };
        
    /**
     * Move this entry to the trash. If the underlying file system doesn't support move
     * to trash, the item is permanently deleted.
     *
     * @param {function (number)} callback
     */
    FileSystemEntry.prototype.moveToTrash = function (callback) {
        if (!this._impl.moveToTrash) {
            this.unlink(callback);
            return;
        }
        
        this._stat = null;
        this._impl.moveToTrash(this._path, callback || function () {});
    };
    
    /**
     * Visit this entry and its descendents with the supplied visitor function.
     *
     * @param {function(FileSystemEntry): boolean} visitor - A visitor function, which is
     *      applied to descendent FileSystemEntry objects. If the function returns false for
     *      a particular Directory entry, that directory's descendents will not be visited.
     * @param {{failFast: boolean=, maxDepth: number=}=} options - An optional set of options.
     * @param {function(string)} callback
     */
    FileSystemEntry.prototype.visit = function (visitor, options, callback) {
        var DEFAULT_MAX_DEPTH = 100;
        
        if (typeof options === "function") {
            callback = options;
            options = {};
        }

        var maxDepth = typeof options.maxDepth === "number" ? options.maxDepth : DEFAULT_MAX_DEPTH,
            continueTraversal = visitor(this) && maxDepth-- > 0;
        
        if (this.isFile() || !continueTraversal) {
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
