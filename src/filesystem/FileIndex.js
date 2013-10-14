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
    
    /**
     * Constructor
     */
    function FileIndex() {
        this._index = {};
    }
    
    /**
     * Master index
     */
    FileIndex.prototype._index = {};
    
    /**
     * Clear the file index cache.
     */
    FileIndex.prototype.clear = function () {
        this._index = {};
    };
    
    /**
     * Add an entry.
     *
     * @param {FileSystemEntry} entry The entry to add.
     */
    FileIndex.prototype.addEntry = function (entry) {
        this._index[entry.fullPath] = entry;
    };
    
    /**
     * Remove an entry.
     * 
     * @param {FileSystemEntry} entry The entry to remove.
     */
    FileIndex.prototype.removeEntry = function (entry) {
        var path = entry.fullPath;
        
        delete this._index[path];
    };
    
    /**
     * Notify the index that an entry has been renamed. This updates
     * all affected entries in the index.
     *
     * @param {string} oldName
     * @param {string} newName
     * @param {boolean} isDirectory
     */
    FileIndex.prototype.entryRenamed = function (oldName, newName, isDirectory) {
        var path,
            splitName = oldName.split("/"),
            finalPart = splitName.length - 1,
            renameMap = {};
        
        // Find all entries affected by the rename and put into a separate map.
        for (path in this._index) {
            if (this._index.hasOwnProperty(path)) {
                // See if we have a match. For directories, see if the path
                // starts with the old name. This is safe since paths always end
                // with '/'. For files, see if there is an exact match between
                // the path and the old name.
                if (isDirectory ? path.indexOf(oldName) === 0 : path === oldName) {
                    renameMap[path] = newName + path.substr(oldName.length);
                }
            }
        }
        
        // Do the rename. 
        for (path in renameMap) {
            if (renameMap.hasOwnProperty(path)) {
                var item = this._index[path];
                
                // Sanity check to make sure the item and path still match
                console.assert(item.fullPath === path);
                
                delete this._index[path];
                this._index[renameMap[path]] = item;
                item._path = renameMap[path];
            }
        }
    };
    
    /**
     * Returns the cached entry for the specified path, or undefined
     * if the path has not been cached.
     * 
     * @param {string} path The path of the entry to return.
     * @return {File|Directory} The entry for the path, or undefined if it hasn't 
     *              been cached yet.
     */
    FileIndex.prototype.getEntry = function (path) {
        return this._index[path];
    };
    
    // Export public API
    module.exports = FileIndex;
});
