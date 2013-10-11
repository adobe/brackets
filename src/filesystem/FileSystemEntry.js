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
            get: function () {
                // TODO: cache this result in a member?
                var parts = this._path.split("/");
                if (this.isDirectory()) {
                    return parts[parts.length - 2];
                } else {
                    return parts[parts.length - 1];
                }
            },
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
    };
    
    /**
     * Returns the stats for the entry.
     *
     * @param {function (err, object)} callback Callback that is resolved with the entries 
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
     * @param {String} newName New name for this entry.
     * @param {function (number)} callback  
     */
    FileSystemEntry.prototype.rename = function (newName, callback) {
        this._impl.rename(this._path, newName, callback);
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
        
    // Export this class
    module.exports = FileSystemEntry;
});
