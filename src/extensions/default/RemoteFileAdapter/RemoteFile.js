/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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


    var FileSystemError = brackets.getModule("filesystem/FileSystemError"),
        FileSystemStats = brackets.getModule("filesystem/FileSystemStats");

    var SESSION_START_TIME = new Date();

    /**
     * Create a new file stat. See the FileSystemStats class for more details.
     *
     * @param {!string} fullPath The full path for this File.
     * @return {FileSystemStats} stats.
     */
    function _getStats(uri) {
        return new FileSystemStats({
            isFile: true,
            mtime: SESSION_START_TIME.toISOString(),
            size: 0,
            realPath: uri,
            hash: uri
        });
    }

    function _getFileName(filePath) {
        var fileName = filePath.split('/').pop();

        if (!fileName.trim()) {
            fileName = filePath.trim().slice(0, -1);
            fileName = fileName.split('/').pop();
        }

        return fileName;
    }

    /**
     * Model for a RemoteFile.
     *
     * This class should *not* be instantiated directly. Use FileSystem.getFileForPath
     *
     * See the FileSystem class for more details.
     *
     * @constructor
     * @param {!string} fullPath The full path for this File.
     * @param {!FileSystem} fileSystem The file system associated with this File.
     */
    function RemoteFile(protocol, fullPath, fileSystem) {
        this._isFile = true;
        this._isDirectory = false;
        this.readOnly = true;
        this._path = fullPath;
        this._stat = _getStats(fullPath);
        this._id = fullPath;
        this._name = _getFileName(fullPath);
        this._fileSystem = fileSystem;
        this.donotWatch = true;
        this.protocol = protocol;
        this.encodedPath = fullPath;
    }

    // Add "fullPath", "name", "parent", "id", "isFile" and "isDirectory" getters
    Object.defineProperties(RemoteFile.prototype, {
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
     * Helpful toString for debugging and equality check purposes
     */
    RemoteFile.prototype.toString = function () {
        return "[RemoteFile " + this._path + "]";
    };

    /**
     * Returns the stats for the remote entry.
     *
     * @param {function (?string, FileSystemStats=)} callback Callback with a
     *      FileSystemError string or FileSystemStats object.
     */
    RemoteFile.prototype.stat = function (callback) {
        if (this._stat) {
            callback(null, this._stat);
        } else {
            callback(FileSystemError.NOT_FOUND);
        }
    };

    RemoteFile.prototype.constructor = RemoteFile;

    /**
     * Cached contents of this file. This value is nullable but should NOT be undefined.
     * @private
     * @type {?string}
     */
    RemoteFile.prototype._contents = null;


    /**
     * @private
     * @type {?string}
     */
    RemoteFile.prototype._encoding = "utf8";

    /**
     * @private
     * @type {?bool}
     */
    RemoteFile.prototype._preserveBOM = false;


    /**
     * Clear any cached data for this file. Note that this explicitly does NOT
     * clear the file's hash.
     * @private
     */
    RemoteFile.prototype._clearCachedData = function () {
        // no-op
    };

    /**
     * Reads a remote file.
     *
     * @param {Object=} options Currently unused.
     * @param {function (?string, string=, FileSystemStats=)} callback Callback that is passed the
     *              FileSystemError string or the file's contents and its stats.
     */
    RemoteFile.prototype.read = function (options, callback) {
        if (typeof (options) === "function") {
            callback = options;
        }
        this._encoding = "utf8";

        if (this._contents !== null && this._stat) {
            callback(null, this._contents, this._encoding, this._stat);
            return;
        }

        var self = this;
        $.ajax({
            url: this.fullPath
        })
        .done(function (data) {
            self._contents = data;
            callback(null, data, self._encoding, self._stat);
        })
        .fail(function (e) {
            callback(FileSystemError.NOT_FOUND);
        });
    };

    /**
     * Write a file.
     *
     * @param {string} data Data to write.
     * @param {object=} options Currently unused.
     * @param {function (?string, FileSystemStats=)=} callback Callback that is passed the
     *              FileSystemError string or the file's new stats.
     */
    RemoteFile.prototype.write = function (data, encoding, callback) {
        if (typeof (encoding) === "function") {
            callback = encoding;
        }
        callback(FileSystemError.NOT_FOUND);
    };

    RemoteFile.prototype.exists = function (callback) {
        callback(null, true);
    };

    RemoteFile.prototype.unlink = function (callback) {
        callback(FileSystemError.NOT_FOUND);
    };

    RemoteFile.prototype.rename = function (newName, callback) {
        callback(FileSystemError.NOT_FOUND);
    };

    RemoteFile.prototype.moveToTrash = function (callback) {
        callback(FileSystemError.NOT_FOUND);
    };

    // Export this class
    module.exports = RemoteFile;
});
