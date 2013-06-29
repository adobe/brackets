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
    
    // Master index
    var _index = {};
    
    // Array of all files in the index
    var _allFiles = [];
    
    /**
     * Clear the file index cache.
     */
    function clear() {
        _index = {};
        _allFiles = [];
    }
    
    /**
     * Add an entry.
     *
     * @param {FileSystemEntry} entry The entry to add.
     */
    function addEntry(entry) {
        _index[entry.getPath()] = entry;
        
        if (entry.isFile()) {
            _allFiles.push(entry);
        }
    }
    
    /**
     * Returns the cached entry for the specified path, or undefined
     * if the path has not been cached.
     * 
     * @param {string} path The path of the entry to return.
     * @return {File|Directory} The entry for the path, or undefined if it hasn't 
     *              been cached yet.
     */
    function getEntry(path) {
        return _index[path];
    }
    
    function getAllFiles() {
        return _allFiles;   // TODO: Return a copy?
    }
    
    // Export public API
    exports.clear       = clear;
    exports.addEntry    = addEntry;
    exports.getEntry    = getEntry;
    exports.getAllFiles = getAllFiles;
});
