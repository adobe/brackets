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

/* TODO: Document this class/module. */

define(function (require, exports, module) {
    "use strict";
    
    /**
     * Constructor
     * @param {string} path The path for this entry
     */
    function FileSystemEntry(path, impl) {
        this._path = path;
        this._impl = impl;
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
     * Returns true if the entry exists on disk.
     *
     * @return {Q.Promise} Promise that is resolved with true if the entry exists, 
     *        or false if it doesn't.
     */
    FileSystemEntry.prototype.exists = function (callback) {
        // If we have _stat, the entry must exist
        if (this._stat) {
            callback(true);
        } else {
            // No _stat object yet, query the system
            this._impl.exists(this._path, callback);
        }
    };
    
    /**
     * Returns the stats for the entry.
     *
     * @return {Q.Promise} Promise that is resolved with the entries stats, or rejected
     *        if an error occurred.
     */
    FileSystemEntry.prototype.stat = function (callback) {
        if (this._stat) {
            callback(null, this._stat);
        } else {
            this._impl.stat(this._path, function (err, stat) {
                if (err) {
                    callback(err);
                } else {
                    this._stat = stat;
                    callback(null, stat);
                }
            }.bind(this));
        }
    };
    
    /**
     * Rename this entry.
     *
     * @param {String} newName New name for this entry.
     *
     * @return {Q.Promise} Promise that is resolved with the entries stats, or rejected
     *        if an error occurred.
     */
    FileSystemEntry.prototype.rename = function (newName, callback) {
        this._impl.rename(this._path, newName, callback);
    };
        
    /**
     * Unlink (delete) this entry.
     *
     * @return {Q.Promise} Promise that is resolved if the unlink succeeded, or rejected
     *        if an error occurred.
     */
    FileSystemEntry.prototype.unlink = function (callback) {
        this._stat = null;
        this._impl.unlink(this._path, callback);
    };
        
    /**
     * Move this entry to the trash. If the underlying file system doesn't support move
     * to trash, the item is permanently deleted.
     *
     * @return {Q.Promise} Promise that is resolved if the moveToTrash succeeded, or rejected
     *        if an error occurred.
     */
    FileSystemEntry.prototype.moveToTrash = function (callback) {
        if (!this._impl.moveToTrash) {
            this.unlink(callback);
            return;
        }
        
        this._stat = null;
        this._impl.moveToTrash(this._path, callback);
    };
        
    // Export this class
    module.exports = FileSystemEntry;
});
