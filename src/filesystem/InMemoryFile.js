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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50, newcap: true */
/*global define*/

define(function (require, exports, module) {
    "use strict";
    
    var Q                   = require("Q");
    
    var FileSystemEntry     = require("filesystem/FileSystemEntry");
    
    function InMemoryFile(fullPath, impl) {
        FileSystemEntry.call(this, fullPath, impl);
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
     * @param {string=} encoding Encoding for reading. Defaults to UTF-8.
     *
     * @return {Q.Promise} Promise that is always rejected.
     */
    InMemoryFile.prototype.readAsText = function (encoding) {
        return Q.reject(); // TODO: Error code?
    };
    
    /**
     * Rejects any attempts to write the file.
     *
     * @param {string} data Data to write.
     * @param {string=} encoding Encoding for data. Defaults to UTF-8.
     *
     * @return {Q.Promise} Promise that is always rejected.
     */
    InMemoryFile.prototype.write = function (data, encoding) {
        return Q.reject();  // TODO: Error code?
    };
    
    // Stub out invalid calls inherited from FileSystemEntry
    InMemoryFile.prototype.exists = function () {
        return Q(false);
    };
    
    InMemoryFile.prototype.stat = function () {
        return Q.reject(); // TODO: Error
    };
    
    InMemoryFile.prototype.unlink = function () {
        return Q.reject(); // TODO: Error
    };
    
    InMemoryFile.prototype.rename = function (newName) {
        return Q.reject(); // TODO: Error
    };
    
    InMemoryFile.prototype.moveToTrash = function () {
        return Q.reject(); // TODO: Error
    };
    
    // Export this class
    module.exports = InMemoryFile;
});
