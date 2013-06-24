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

    // Root path
    var _rootPath;
    
    // Master index
    var _index = {};
    
    /**
     * Clear the file index cache.
     */
    function clear() {
        _index = {};
    }
    
    /**
     * Set the root for the file index cache. This clears the current cache
     * and starts a new indexing worker thread.
     *
     * @param {string} rootPath The new root path.
     */
    function setRoot(rootPath) {
        // Clear existing index 
        clear();
        
        // Set root
        _rootPath = rootPath;
        
        // TODO: Start indexing on worker thread
    }
    
    function addEntry(entry) {
        _index[entry.getPath()] = entry;
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
    
    // Export public API
    exports.clear       = clear;
    exports.setRoot     = setRoot;
    exports.addEntry    = addEntry;
    exports.getEntry    = getEntry;
});
