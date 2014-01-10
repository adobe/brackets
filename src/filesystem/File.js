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
    
    var FileSystemEntry = require("filesystem/FileSystemEntry"),
        FileSystemError = require("filesystem/FileSystemError");
    
    
    /*
     * @constructor
     * Model for a File.
     *
     * This class should *not* be instantiated directly. Use FileSystem.getFileForPath,
     * FileSystem.resolve, or Directory.getContents to create an instance of this class.
     *
     * See the FileSystem class for more details.
     *
     * @param {!string} fullPath The full path for this File.
     * @param {!FileSystem} fileSystem The file system associated with this File.
     */
    function File(fullPath, fileSystem) {
        this._isFile = true;
        this._readWriteQueue = [];
        FileSystemEntry.call(this, fullPath, fileSystem);
    }
    
    File.prototype = Object.create(FileSystemEntry.prototype);
    File.prototype.constructor = File;
    File.prototype.parentClass = FileSystemEntry.prototype;
    
    /**
     * Cached contents of this file. This value is nullable but should NOT be undefined.
     * @private
     * @type {?string}
     */
    File.prototype._contents = null;
    
    /**
     * Consistency hash for this file. Reads and writes update this value, and
     * writes confirm the hash before overwriting existing files. The type of
     * this object is dependent on the FileSystemImpl; the only constraint is
     * that === can be used as an equality relation on hashes.
     * @private
     * @type {?object}
     */
    File.prototype._hash = null;
    
    /**
     * The queue of read-write operations to be processed serially.
     * @private
     * @type {Array.<method: string, args: Array, cb: function()>}
     */
    File.prototype._readWriteQueue = null;
    
    /**
     * Dequeue a read-write operation from the queue, execute it, and continue
     * processing the queue afterwards if necessary. Assumes the read-write queue
     * is non-empty. 
     * @private
     */
    File.prototype._dequeueReadWriteOperation = function () {
        var queue = this._readWriteQueue,
            op = queue[0],
            method = this[op.method],
            args = op.args,
            cb = op.cb;

        // Create a new callback for the read or write operation that will
        // dequeue the next operation upon completion
        var callback = function () {
            var callbackArgs = arguments;
            try {
                cb.apply(null, callbackArgs);
            } finally {
                queue.shift();
                if (queue.length > 0) {
                    this._dequeueReadWriteOperation();
                }
            }
        }.bind(this);

        // Add the new callback in the argument list
        args.push(callback);
        
        // Apply the read or write method
        method.apply(this, args);
    };
    
    /**
     * Enqueue a read-write operation for serial, possibly later execution.
     * @private
     * @param {boolean} isWrite Indicates whether this is a read or a write
     * @param {Array} args The arguments to the read or write operation
     */
    File.prototype._enqueueReadWriteOperation = function (isWrite, args, cb) {
        var queue = this._readWriteQueue,
            method = isWrite ? "_write" : "_read";
        
        queue.push({method: method, args: args, cb: cb});
        if (queue.length === 1) {
            this._dequeueReadWriteOperation();
        }
    };
    
    /**
     * Clear any cached data for this file. Note that this explicitly does NOT
     * clear the file's hash.
     * @private
     */
    File.prototype._clearCachedData = function () {
        FileSystemEntry.prototype._clearCachedData.apply(this);
        this._contents = null;
    };
    
    /**
     * Internal read file operation. Only called by _dequeueReadWriteOperation.
     *
     * @private
     * @param {Object} options Currently unused.
     * @param {function (?string, string=, FileSystemStats=)} callback Callback that is passed the
     *              FileSystemError string or the file's contents and its stats.
     */
    File.prototype._read = function (options, callback) {
        var watched = this._isWatched();
        if (watched) {
            options.stat = this._stat;
        }
        
        this._impl.readFile(this._path, options, function (err, data, stat) {
            if (err) {
                this._clearCachedData();
                callback(err);
                return;
            }
            
            // Always store the hash
            this._hash = stat._hash;
            
            // Only cache data for watched files
            if (watched) {
                this._stat = stat;
                this._contents = data;
            }
            
            callback(err, data, stat);
        }.bind(this));
    };
    
    /**
     * Read a file.
     *
     * @param {Object=} options Currently unused.
     * @param {function (?string, string=, FileSystemStats=)} callback Callback that is passed the
     *              FileSystemError string or the file's contents and its stats.
     */
    File.prototype.read = function (options, callback) {
        if (typeof (options) === "function") {
            callback = options;
            options = {};
        }
        
        // We don't need to check isWatched() here because contents are only saved
        // for watched files. Note that we need to explicitly test this._contents
        // for a default value; otherwise it could be the empty string, which is
        // falsey.
        if (this._contents !== null && this._stat) {
            callback(null, this._contents, this._stat);
            return;
        }
        
        this._enqueueReadWriteOperation(false, [options], callback);
    };
    
    /**
     * Internal write file operation. Only called by _dequeueReadWriteOperation.
     *
     * @private
     * @param {string} data Data to write.
     * @param {object} options Currently unused.
     * @param {function (?string, FileSystemStats=)} callback Callback that is passed the
     *              FileSystemError string or the file's new stats.
     */
    File.prototype._write = function (data, options, callback) {
        // Request a consistency check if the write is not blind
        if (!options.blind) {
            options.expectedHash = this._hash;
        }
        
        // Block external change events until after the write has finished
        this._fileSystem._beginChange();
        
        this._impl.writeFile(this._path, data, options, function (err, stat, created) {
            if (err) {
                this._clearCachedData();
                try {
                    callback(err);
                    return;
                } finally {
                    // Always unblock external change events
                    this._fileSystem._endChange();
                }
            }
            
            // Always store the hash
            this._hash = stat._hash;
            
            // Only cache data for watched files
            if (this._isWatched()) {
                this._stat = stat;
                this._contents = data;
            }
            
            if (created) {
                var parent = this._fileSystem.getDirectoryForPath(this.parentPath);
                this._fileSystem._handleDirectoryChange(parent, function (added, removed) {
                    try {
                        // Notify the caller
                        callback(null, stat);
                    } finally {
                        // If the write succeeded, fire a synthetic change event
                        this._fileSystem._fireChangeEvent(parent, added, removed);
                        
                        // Always unblock external change events
                        this._fileSystem._endChange();
                    }
                }.bind(this));
            } else {
                try {
                    // Notify the caller
                    callback(null, stat);
                } finally {
                    // existing file modified
                    this._fileSystem._fireChangeEvent(this);
                    
                    // Always unblock external change events
                    this._fileSystem._endChange();
                }
            }
        }.bind(this));
    };
    
    /**
     * Write a file.
     *
     * @param {string} data Data to write.
     * @param {object=} options Currently unused.
     * @param {function (?string, FileSystemStats=)=} callback Callback that is passed the
     *              FileSystemError string or the file's new stats.
     */
    File.prototype.write = function (data, options, callback) {
        if (typeof options === "function") {
            callback = options;
            options = {};
        } else {
            if (options === undefined) {
                options = {};
            }
            
            callback = callback || function () {};
        }
        
        this._enqueueReadWriteOperation(true, [data, options], callback);
    };
    
    // Export this class
    module.exports = File;
});
