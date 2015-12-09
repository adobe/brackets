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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true, regexp: true */

(function () {
    "use strict";
    
    var fs = require("fs"),
        _dirtyFilesCache = [];
    
    function _clearDirtyFilesCache() {
        _dirtyFilesCache = [];
    }
    
    function _updateDirtyFilesCache(name, action) {
        if (action) {
            _dirtyFilesCache.push(name);
        } else {
            var index = _dirtyFilesCache.indexOf(name);
            if (index >= 0) {
                _dirtyFilesCache.splice(index, 1);
            }
        }
    }
    
    function _readFile(fileName, callback) {
        fs.readFile(fileName, 'utf8', function (err, data) {
            var content = "";
            if (!err) {
                content = data;
            }
            console.log("File read ", fileName);
            callback.apply(null, [fileName, content]);
        });
    }
    
    function extractContent(fileName, callback, extractFromMainContext) {
        if (_dirtyFilesCache.indexOf(fileName) !== -1) {
            // Ask the main thread context to provide the updated file content
            extractFromMainContext.apply(null, [fileName]);
            console.log("File read from main thread ", fileName);
        } else {
            _readFile(fileName, callback);
        }
    }
    
    exports.extractContent = extractContent;
    exports.clearFilesCache = _clearDirtyFilesCache;
    exports.updateFilesCache = _updateDirtyFilesCache;
    
}());
