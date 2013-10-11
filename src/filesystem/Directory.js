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
    
    function Directory(fullPath, fileSystem) {
        FileSystemEntry.call(this, fullPath, fileSystem);
    }
    
    Directory.prototype = Object.create(FileSystemEntry.prototype);
    Directory.prototype.constructor = Directory;
    Directory.prototype.parentClass = FileSystemEntry.prototype;
    
    /**
     * The contents of this directory. This "private" property is used by FileSystem.
     * @type {Array<FileSystemEntry>}
     */
    Directory.prototype._contents = null;
    
    Directory.prototype.isDirectory = function () {
        return true;
    };
    
    /**
     * Read the contents of a Directory. 
     *
     * @param {Directory} directory Directory whose contents you want to get
     * @param {function (number, array)} callback Callback that is passed
     *          and error code and the contents of the directory.
     */
    Directory.prototype.getContents = function (callback) {
        var i, entryPath, entry;
        
        if (this._contentsCallbacks) {
            // There is already a pending call for this directory's contents.
            // Push the new callback onto the stack and return.
            this._contentsCallbacks.push(callback);
            return;
        }
        
        if (this._contents) {
            // Return cached contents
            callback(null, this._contents);
            return;
        }
                
        this._contentsCallbacks = [callback];
        
        this._impl.readdir(this.fullPath, function (err, contents, stats) {
            this._contents = [];
            
            // Instantiate content objects
            var len = stats ? stats.length : 0;
            
            for (i = 0; i < len; i++) {
                entryPath = this.fullPath + contents[i];
                
                // Note: not all entries necessarily have associated stats.
                // For now, silently ignore such entries.
                if (stats[i] && this._fileSystem.shouldShow(entryPath)) {
                    if (stats[i].isFile()) {
                        entry = this._fileSystem.getFileForPath(entryPath);
                    } else {
                        entry = this._fileSystem.getDirectoryForPath(entryPath);
                    }
                    
                    this._contents.push(entry);
                }
            }
            
            // Reset the callback list before we begin calling back so that
            // synchronous reentrant calls are handled correctly.
            var currentCallbacks = this._contentsCallbacks;
            
            this._contentsCallbacks = null;
            
            // Invoke all saved callbacks
            currentCallbacks.forEach(function (cb) {
                cb(err, this._contents);
            }.bind(this));
        }.bind(this));
    };
    
    /**
     * Create a directory
     *
     * @param {number=} mode The mode for the directory.
     * @param {function (number, object)=} callback 
     */
    Directory.prototype.create = function (mode, callback) {
        if (typeof (mode) === "function") {
            callback = mode;
        }
        
        // TODO: support mode
        
        this._impl.mkdir(this._path, function (err, stat) {
            if (!err) {
                this._stat = stat;
            }
            if (callback) {
                callback(err, stat);
            }
        }.bind(this));
    };
    
    // Export this class
    module.exports = Directory;
});
