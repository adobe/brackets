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
    
    var FileSystemEntry = require("filesystem/FileSystemEntry");
    
    function File(fullPath, impl) {
        FileSystemEntry.call(this, fullPath, impl);
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
     *
     * @return {Q.Promise} Promise that is resolved with the text and stats from the file,
     *        or rejected if an error occurred.
     */
    File.prototype.readAsText = function (encoding, callback) {
        if (this._contents && this._stat) {
            callback(this._contents, this._stat);
        } else {
            if (encoding === undefined || typeof encoding === "function") {
                callback = encoding;
                encoding = {};
            } else {
                encoding = {encoding: encoding};
            }
            
            this._impl.readFile(this._path, encoding, function (err, data, stat) {
                if (err) {
                    callback(err);
                } else {
                    this._stat = stat;
                    this._contents = data;
                    callback(null, data, stat);
                }
            }.bind(this));
        }
    };
    
    /**
     * Write a file.
     *
     * @param {string} data Data to write.
     * @param {string=} encoding Encoding for data. Defaults to UTF-8.
     *
     * @return {Q.Promise} Promise that is resolved with the file's new stats when the 
     *        writing is complete, or rejected if an error occurred.
     */
    File.prototype.write = function (data, encoding, callback) {
        if (encoding === undefined || typeof encoding === "function") {
            callback = encoding;
            encoding = {};
        } else {
            encoding = {encoding: encoding};
        }
        
        this._impl.writeFile(this._path, data, encoding, function (err, stat) {
            if (err) {
                callback(err);
            } else {
                this._stat = stat;
                this._contents = data;
                callback(null, stat);
            }
        }.bind(this));
    };
    
    // Export this class
    module.exports = File;
});
