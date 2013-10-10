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
    
    /**
     * Constructor
     * @param {string} path The path for this entry
     */
    function FileSystemEntry(path, fileSystem) {
        this._path = path;
        this._fileSystem = fileSystem;
        this._impl = fileSystem._impl;
    }
        
    // Add "fullPath" and "name" getters
    Object.defineProperties(FileSystemEntry.prototype, {
        "fullPath": {
            get: function () { return this._path; },
            set: function (val) { throw new Error("Cannot set fullPath"); }
        },
        "name": {
            get: function () { return this._path.split("/").pop(); },
            set: function (val) { throw new Error("Cannot set name"); }
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
     * Low level file system implementation.
     */
    FileSystemEntry.prototype._impl = null;

    /**
     * The path of this entry.
     * @type {string}
     */
    FileSystemEntry.prototype._path = null;
    
    FileSystemEntry.prototype._cacheCallbacks = function (getList, getSyncValue, getAsyncValue, name) {
        var fullPath = this.fullPath;
        
        return function () {
            var params = Array.prototype.slice.call(arguments, 0),
                callback = params.pop(),
                currentCallbacks = getList.apply(null, params);
            
            if (currentCallbacks && currentCallbacks.length > 0) {
                currentCallbacks.push(callback);
                console.log("Concurrent filesystem I/O operation: ", name, fullPath);
                return;
            }
            
            var syncResult = getSyncValue.apply(null, params);
            
            if (typeof syncResult === "function") {
                syncResult(function () {
                    var valueArray = getAsyncValue.apply(null, arguments),
                        savedCallbacks = currentCallbacks.slice(0);
                    
                    currentCallbacks.splice(0);
                    
                    // Invoke all saved callbacks
                    savedCallbacks.forEach(function (cb) {
                        cb.apply(null, valueArray);
                    }.bind(this));
                });
                
                if (callback) {
                    currentCallbacks.push(callback);
                }
            }
        };
    };
        
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
        
        var getList = function () {
            if (!this._existsCallbacks) {
                this._existsCallbacks = [];
            }
            
            return this._existsCallbacks;
        }.bind(this);
        
        var getSyncValue = function () {
            if (this._stat) {
                callback(true);
                return;
            }
            
            return this._impl.exists.bind(null, this._path);
        }.bind(this);
        
        var getAsyncValue = function (val) {
            return [val];
        }.bind(this);
        
        this._cacheCallbacks(getList, getSyncValue, getAsyncValue, "FileSystemEntry.exists").apply(null, arguments);
    };
    
    /**
     * Returns the stats for the entry.
     *
     * @param {function (err, object)} callback Callback that is resolved with the entries 
     * stats.
     */
    FileSystemEntry.prototype.stat = function (callback) {
        var getList = function () {
            if (!this._statCallbacks) {
                this._statCallbacks = [];
            }
            
            return this._statCallbacks;
        }.bind(this);
        
        var getSyncValue = function () {
            if (this._stat) {
                callback(null, this._stat);
                return;
            }
            
            return this._impl.stat.bind(null, this._path);
        }.bind(this);
        
        var getAsyncValue = function (err, stat) {
            if (!err) {
                this._stat = stat;
            }
            
            return [err, stat];
        }.bind(this);
        
        this._cacheCallbacks(getList, getSyncValue, getAsyncValue, "FileSystemEntry.stat").apply(null, arguments);
    };
    
    /**
     * Rename this entry.
     *
     * @param {String} newName New name for this entry.
     * @param {function (number)} callback  
     */
    FileSystemEntry.prototype.rename = function (newName, callback) {
        this._impl.rename(this._path, newName, callback);
        
        var getList = function () {
            if (!this._renameCallbacks) {
                this._renameCallbacks = [];
            }
            
            return this._renameCallbacks;
        }.bind(this);
        
        var getSyncValue = this._impl.rename.bind(null, this._path, newName);
        
        var getAsyncValue = function (err, stat) {
            return [err, stat];
        }.bind(this);
        
        this._cacheCallbacks(getList, getSyncValue, getAsyncValue, "FileSystemEntry.rename").apply(null, arguments);
    };
        
    /**
     * Unlink (delete) this entry.
     *
     * @param {function (number)} callback
     */
    FileSystemEntry.prototype.unlink = function (callback) {
        callback = callback || function () {};
        
        var getList = function () {
            if (!this._unlinkCallbacks) {
                this._unlinkCallbacks = [];
            }
            
            return this._unlinkCallbacks;
        }.bind(this);
        
        var getSyncValue = function () {
            this._stat = null;
            
            return this._impl.unlink.bind(null, this._path);
        }.bind(this);
        
        var getAsyncValue = function (err) {
            return [err];
        }.bind(this);
        
        this._cacheCallbacks(getList, getSyncValue, getAsyncValue, "FileSystemEntry.unlink")(callback);
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
        
        callback = callback || function () {};
        
        var getList = function () {
            if (!this._moveToTrashCallbacks) {
                this._moveToTrashCallbacks = [];
            }
            
            return this._moveToTrashCallbacks;
        }.bind(this);
        
        var getSyncValue = function () {
            this._stat = null;
            
            return this._impl.moveToTrash.bind(null, this._path);
        }.bind(this);
        
        var getAsyncValue = function (err) {
            return [err];
        }.bind(this);
        
        this._cacheCallbacks(getList, getSyncValue, getAsyncValue, "FileSystemEntry.moveToTrash")(callback);
    };
        
    // Export this class
    module.exports = FileSystemEntry;
});
