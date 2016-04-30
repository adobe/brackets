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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

/**
 * Represents a file that will never exist on disk - a placeholder backing file for untitled Documents. NO ONE
 * other than DocumentManager should create instances of InMemoryFile. It is valid to test for one (`instanceof
 * InMemoryFile`), but it's better to check `doc.isUntitled` where possible.
 *
 * Attempts to read/write an InMemoryFile will always fail, and exists() always yields false. InMemoryFile.fullPath
 * is just a placeholder, and should not be displayed anywhere in the UI; fullPath IS guaranteed to be unique, however.
 *
 * An InMemoryFile is not added to the filesystem index, so if you ask the the filesystem anything about this
 * object, it won't know what you're talking about (`filesystem.getFileForPath(someInMemFile.fullPath)` will not
 * return someInMemFile).
 */
define(function (require, exports, module) {
    "use strict";

    var File            = require("filesystem/File"),
        FileSystemError = require("filesystem/FileSystemError");

    function InMemoryFile(fullPath, fileSystem) {
        File.call(this, fullPath, fileSystem);
    }

    InMemoryFile.prototype = Object.create(File.prototype);
    InMemoryFile.prototype.constructor = InMemoryFile;
    InMemoryFile.prototype.parentClass = File.prototype;

    // Stub out invalid calls inherited from File

    /**
     * Reject any attempts to read the file.
     *
     * Read a file as text.
     *
     * @param {Object=} options Currently unused.
     * @param {function (number, string, object)} callback
     */
    InMemoryFile.prototype.read = function (options, callback) {
        if (typeof (options) === "function") {
            callback = options;
        }
        callback(FileSystemError.NOT_FOUND);
    };

    /**
     * Rejects any attempts to write the file.
     *
     * @param {string} data Data to write.
     * @param {string=} encoding Encoding for data. Defaults to UTF-8.
     * @param {!function (err, object)} callback Callback that is passed the
     *              error code and the file's new stats if the write is sucessful.
     */
    InMemoryFile.prototype.write = function (data, encoding, callback) {
        if (typeof (encoding) === "function") {
            callback = encoding;
        }
        callback(FileSystemError.NOT_FOUND);
    };


    // Stub out invalid calls inherited from FileSystemEntry

    InMemoryFile.prototype.exists = function (callback) {
        callback(null, false);
    };

    InMemoryFile.prototype.stat = function (callback) {
        callback(FileSystemError.NOT_FOUND);
    };

    InMemoryFile.prototype.unlink = function (callback) {
        callback(FileSystemError.NOT_FOUND);
    };

    InMemoryFile.prototype.rename = function (newName, callback) {
        callback(FileSystemError.NOT_FOUND);
    };

    InMemoryFile.prototype.moveToTrash = function (callback) {
        callback(FileSystemError.NOT_FOUND);
    };

    // Export this class
    module.exports = InMemoryFile;
});
