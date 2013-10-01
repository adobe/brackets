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
    
    var Q = require("Q");
    
    /**
     * Constructor
     * @param {string} path The path for this entry
     */
    function QFileSystemEntry(entry) {
        this._cbEntry = entry;
    }
    
    /**
     * Returns true if this entry is a file.
     * @return {boolean}
     */
    QFileSystemEntry.prototype.isFile = function () {
        return this._cbEntry.isFile();
    };
    
    /**
     * Returns true if this entry is a directory.
     * @return {boolean}
     */
    QFileSystemEntry.prototype.isDirectory = function () {
        return this._cbEntry.isDirectory();
    };
    
    /**
     * Returns true if the entry exists on disk.
     *
     * @return {Q.Promise} Promise that is resolved with true if the entry exists, 
     *        or false if it doesn't.
     */
    QFileSystemEntry.prototype.exists = function () {
        var result = Q.defer();
        
        this._cbEntry.exists.call(this, function (err, exists) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve(exists);
            }
        });
        
        return result.promise;
    };
    
    /**
     * Returns the stats for the entry.
     *
     * @return {Q.Promise} Promise that is resolved with the entries stats, or rejected
     *        if an error occurred.
     */
    QFileSystemEntry.prototype.stat = function () {
        var result = Q.defer();
        
        this._cbEntry.stat.call(this, function (err, stat) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve(stat);
            }
        });
        
        return result.promise;
    };
    
    /**
     * Rename this entry.
     *
     * @param {String} newName New name for this entry.
     *
     * @return {Q.Promise} Promise that is resolved with the entries stats, or rejected
     *        if an error occurred.
     */
    QFileSystemEntry.prototype.rename = function (newName) {
        var result = Q.defer();
        
        this._cbEntry.rename.call(this, newName, function (err, stat) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve();
            }
        });
        
        return result.promise;
    };
        
    /**
     * Unlink (delete) this entry.
     *
     * @return {Q.Promise} Promise that is resolved if the unlink succeeded, or rejected
     *        if an error occurred.
     */
    QFileSystemEntry.prototype.unlink = function (callback) {
        var result = Q.defer();
        
        this._cbEntry.unlink.call(this, function (err) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve();
            }
        });
        
        return result.promise;
    };
        
    /**
     * Move this entry to the trash. If the underlying file system doesn't support move
     * to trash, the item is permanently deleted.
     *
     * @return {Q.Promise} Promise that is resolved if the moveToTrash succeeded, or rejected
     *        if an error occurred.
     */
    QFileSystemEntry.prototype.moveToTrash = function (callback) {
        var result = Q.defer();
        
        this._cbEntry.moveToTrash.call(this, function (err) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve();
            }
        });
        
        return result.promise;
    };
        
    // Export this class
    module.exports = QFileSystemEntry;
});
