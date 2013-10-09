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

define(function (require, exports, module) {
    "use strict";
    
    var FileSystemEntry     = require("filesystem/FileSystemEntry");
    
    function InMemoryFile(fullPath, fileSystem) {
        FileSystemEntry.call(this, fullPath, fileSystem);
    }
    
    InMemoryFile.prototype = Object.create(FileSystemEntry.prototype);
    InMemoryFile.prototype.constructor = InMemoryFile;
    InMemoryFile.prototype.parentClass = FileSystemEntry.prototype;
    
    /**
     * Override to return true.
     *
     * @return {boolean} True -- this is a file
     */
    InMemoryFile.prototype.isFile = function () {
        return true;
    };
    
    /**
     * Reject any attempts to read the file.
     *
     * Read a file as text. 
     *
     * @param {string=} encoding Encoding for reading. Defaults to UTF-8.
     * @param {function (number, string, object)} callback
     */
    InMemoryFile.prototype.readAsText = function (encoding, callback) {
        if (typeof (encoding) === "function") {
            callback = encoding;
        }
        callback(1); // TODO: Error code
    };
    
    /**
     * Rejects any attempts to write the file.
     *
     * @param {string} data Data to write.
     * @param {string=} encoding Encoding for data. Defaults to UTF-8.
     * @param {function (err, object)=} callback Callback that is passed the
     *              error code and the file's new stats if the write is sucessful.
     */
    InMemoryFile.prototype.write = function (data, encoding, callback) {
        if (typeof (encoding) === "function") {
            callback = encoding;
        }
        callback(1);    // TODO: Error code
    };
    
    // Stub out invalid calls inherited from FileSystemEntry
    InMemoryFile.prototype.exists = function (callback) {
        callback(false);
    };
    
    InMemoryFile.prototype.stat = function (callback) {
        callback(1); // TODO: Error
    };
    
    InMemoryFile.prototype.unlink = function (callback) {
        callback(1); // TODO: Error
    };
    
    InMemoryFile.prototype.rename = function (newName, callback) {
        callback(1); // TODO: Error
    };
    
    InMemoryFile.prototype.moveToTrash = function (callback) {
        callback(1); // TODO: Error
    };
    
    // Export this class
    module.exports = InMemoryFile;
});
