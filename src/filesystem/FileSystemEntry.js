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
     * @return {$.Promise} Promise that is resolved with true if the entry exists, 
     *        or false if it doesn't.
     */
    FileSystemEntry.prototype.exists = function () {
        var result = new $.Deferred();
        
        // If we have _stat, the entry must exist
        if (this._stat) {
            result.resolve(true);
        } else {
            // No _stat object yet, query the system
            this._impl.exists(this._path, function (val) {
                result.resolve(val);
            });
        }
        
        return result.promise();
    };
    
    /**
     * Returns the stats for the entry.
     *
     * @return {$.Promise} Promise that is resolved with the entries stats, or rejected
     *        if an error occurred.
     */
    FileSystemEntry.prototype.stat = function () {
        var result = new $.Deferred();
        
        if (this._stat) {
            result.resolve(this._stat);
        } else {
            this._impl.stat(this._path, function (err, stat) {
                if (err) {
                    result.reject(err);
                } else {
                    this._stat = stat;
                    result.resolve(this._stat);
                }
            }.bind(this));
        }
        
        return result.promise();
    };
    
    /**
     * Rename this entry.
     *
     * @param {String} newName New name for this entry.
     *
     * @return {$.Promise} Promise that is resolved with the entries stats, or rejected
     *        if an error occurred.
     */
    FileSystemEntry.prototype.rename = function (newName) {
        var result = new $.Deferred();
        
        this._impl.rename(this._path, newName, function (err) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve();
            }
        });
        
        return result.promise();
    };
        
    /**
     * Unlink (delete) this entry.
     *
     * @return {$.Promise} Promise that is resolved if the unlink succeeded, or rejected
     *        if an error occurred.
     */
    FileSystemEntry.prototype.unlink = function () {
        var result = new $.Deferred();
        
        this._stat = null;
        this._impl.unlink(this._path, function (err) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve();
            }
        });
        
        return result.promise();
    };
        
    /**
     * Move this entry to the trash. If the underlying file system doesn't support move
     * to trash, the item is permanently deleted.
     *
     * @return {$.Promise} Promise that is resolved if the moveToTrash succeeded, or rejected
     *        if an error occurred.
     */
    FileSystemEntry.prototype.moveToTrash = function () {
        if (!this._impl.moveToTrash) {
            return this.unlink();
        }
        
        var result = new $.Deferred();
        
        this._stat = null;
        this._impl.moveToTrash(this._path, function (err) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve();
            }
        });
        
        return result.promise();
    };
        
    // Export this class
    module.exports = FileSystemEntry;
});
