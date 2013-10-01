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
    
    function Directory(fullPath, fileSystem) {
        FileSystemEntry.call(this, fullPath, fileSystem._impl);
        this._fileSystem = fileSystem;
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
     * Create a directory
     *
     * @param {int=} mode The mode for the directory.
     *
     * @return {Q.Promise} Promise that is resolved with the stat from the new directory.
     */
    Directory.prototype.create = function (mode, callback) {
        // TODO: support mode
        
        this._fileSystem._impl.mkdir(this._path, function (err, stat) {
            if (err) {
                callback(err);
            } else {
                this._stat = stat;
                callback(null, stat);
            }
        }.bind(this));
    };
    
    /**
     * Read the contents of a Directory. 
     *
     * @param {Directory} directory Directory whose contents you want to get
     *
     * @return {Q.Promise} Promise that is resolved with the contents of the directory.
     *         Contents is an Array of File and Directory objects.
     */
    Directory.prototype.getContents = function (callback) {
        var i, entryPath, entry;
        
        if (this._contents) {
            // Return cached directory contents
            callback(null, this._contents);
            return;
        }
        
        this._fileSystem._impl.readdir(this.fullPath, function (err, contents, stats) {
            this._contents = [];
            
            // Instantiate content objects
            var len = stats ? stats.length : 0;
            
            for (i = 0; i < len; i++) {
                entryPath = this.fullPath + "/" + contents[i];
                
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
            
            callback(null, this._contents);
        }.bind(this));
    };
    
    // Export this class
    module.exports = Directory;
});
