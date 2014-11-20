/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

/**
 * This is a compatibility shim for legacy Brackets APIs that will be removed soon.
 * Use ProjectManager.getAllFiles() instead.
 * @deprecated
 */
define(function (require, exports, module) {
    "use strict";
    
    var ProjectManager  = require("project/ProjectManager");
    
    function _warn() {
        console.error("Warning: FileIndexManager is deprecated. Use ProjectManager.getAllFiles() instead");
    }


    function _getFilter(indexName) {
        if (indexName === "css") {
            return ProjectManager.getLanguageFilter("css");
        } else if (indexName === "all") {
            return null;
        } else {
            throw new Error("Invalid index name:", indexName);
        }
    }
    
    /**
     * @deprecated
     * @param {!string} indexname
     * @return {$.Promise} a promise that is resolved with an Array of File objects
     */
    function getFileInfoList(indexName) {
        _warn();
        return ProjectManager.getAllFiles(_getFilter(indexName));
    }
    
    /**
     * @deprecated
     * @param {!string} indexName
     * @param {!string} filename
     * @return {$.Promise} a promise that is resolved with an Array of File objects
     */
    function getFilenameMatches(indexName, filename) {
        _warn();
        
        var indexFilter = _getFilter(indexName);
        
        return ProjectManager.getAllFiles(function (file) {
            if (indexFilter && !indexFilter(file)) {
                return false;
            }
            return file.name === filename;
        });
    }
    
    exports.getFileInfoList = getFileInfoList;
    exports.getFilenameMatches = getFilenameMatches;
});
