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
    
    function File(fullPath, fileSystem) {
        FileSystemEntry.call(this, fullPath, fileSystem);
    }
    
    File.prototype = Object.create(FileSystemEntry.prototype);
    File.prototype.constructor = File;
    File.prototype.parentClass = FileSystemEntry.prototype;
    
    /**
     * Contents of this file.
     */
    File.prototype._contents = null;
    
    /**
     * Override to return true.
     *
     * @return {boolean} True -- this is a file
     */
    File.prototype.isFile = function () {
        return true;
    };
    
    /**
     * Read a file as text. 
     *
     * @param {string=} encoding Encoding for reading. Defaults to UTF-8.
     * @param {function (number, string, object)} callback
     */
    File.prototype.readAsText = function (encoding, callback) {
        if (typeof (encoding) === "function") {
            callback = encoding;
            encoding = null;
        }

        var getList = function (encoding) {
            if (!this._readAsTextCallbacks) {
                this._readAsTextCallbacks = {};
            }
            
            if (!this._readAsTextCallbacks[encoding]) {
                this._readAsTextCallbacks[encoding] = [];
            }
            
            return this._readAsTextCallbacks[encoding];
        }.bind(this);
        
        var getSyncValue = function (encoding) {
            if (this._contents && this._stat) {
                callback(null, this._contents, this._stat);
                return;
            }

            return this._impl.readFile.bind(null, this._path, encoding ? {encoding: encoding} : {});
        }.bind(this);
        
        var getAsyncValue = function (err, data, stat) {
            if (!err) {
                this._stat = stat;
                this._contents = data;
            }
            
            return [err, data, stat];
        }.bind(this);
        
        this._cacheCallbacks(getList, getSyncValue, getAsyncValue, "File.readAsText")(encoding, callback);
    };
    
    /**
     * Write a file.
     *
     * @param {string} data Data to write.
     * @param {string=} encoding Encoding for data. Defaults to UTF-8.
     * @param {function (err, object)=} callback Callback that is passed the
     *              error code and the file's new stats if the write is sucessful.
     */
    File.prototype.write = function (data, encoding, callback) {
        if (typeof (encoding) === "function") {
            callback = encoding;
            encoding = null;
        }
        
        var getList = function (data, encoding) {
            if (!this._writeCallbacks) {
                this._writeCallbacks = [];
            }
            
            return this._writeCallbacks;
        }.bind(this);
        
        var getSyncValue = function (data, encoding) {
            return this._impl.writeFile.bind(null, this._path, data, encoding ? {encoding: encoding} : {});
        }.bind(this);
        
        var getAsyncValue = function (err, stat) {
            if (!err) {
                this._stat = stat;
                this._contents = data;
            }
            
            return [err, stat];
        }.bind(this);
        
        this._cacheCallbacks(getList, getSyncValue, getAsyncValue, "File.write")(data, encoding, callback);
    };
    
    // Export this class
    module.exports = File;
});
