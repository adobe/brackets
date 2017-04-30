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

define(function (require, exports, module) {
    "use strict";

    var FileSystemEntry = require("filesystem/FileSystemEntry");


    /*
     * Model for a File.
     *
     * This class should *not* be instantiated directly. Use FileSystem.getFileForPath,
     * FileSystem.resolve, or Directory.getContents to create an instance of this class.
     *
     * See the FileSystem class for more details.
     *
     * @constructor
     * @param {!string} fullPath The full path for this File.
     * @param {!FileSystem} fileSystem The file system associated with this File.
     */
    function File(fullPath, fileSystem) {
        this._isFile = true;
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
     * Clear any cached data for this file. Note that this explicitly does NOT
     * clear the file's hash.
     * @private
     */
    File.prototype._clearCachedData = function () {
        FileSystemEntry.prototype._clearCachedData.apply(this);
        this._contents = null;
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

        // Request a consistency check if the write is not blind
        if (!options.blind) {
            options.expectedHash = this._hash;
            options.expectedContents = this._contents;
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
                        if (parent._isWatched()) {
                            // If the write succeeded and the parent directory is watched,
                            // fire a synthetic change event
                            this._fileSystem._fireChangeEvent(parent, added, removed);

                        }
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

    // Export this class
    module.exports = File;
});
