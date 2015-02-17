/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

/**
 * Limited subset of a file system impl used for reading from core extensions folder (part of the src code
 * served up from the server)
 */
define(function (require, exports, module) {
    "use strict";
    
    var FileSystemError = require("filesystem/FileSystemError"),
        FileSystemStats = require("filesystem/FileSystemStats");
    
    
    /**
     * To avoid spamming console with 404s, we hardcode a few known non-existent files
     */
    function _exists(path) {
        if (path.match(/Theme\/main.js$/) || path.match(/\/requirejs-config.json$/) || (path.match(/\/package.json$/) && !path.match(/Theme\/package.json$/))) {
//            console.log("Assuming " + path + " does not exist");
            return false;
        }
        
        return true;  // TODO: use $.get(HEAD) to check if it really exists?
    }
    
    
    function stat(path, callback) {
        if (!_exists(path)) {
            callback(FileSystemError.NOT_FOUND);
        } else {
//            console.log("Assuming " + path + " exists");
            var stats = new FileSystemStats({
                isFile: true,
                mtime: new Date(0),
                hash: 0
            });
            callback(null, stats);
        }
    }
    
    function readFile(path, callback) {
        if (!_exists(path)) {
            callback(FileSystemError.NOT_FOUND);
        } else {
            $.ajax(path, { dataType: "text" }).done(function (text) {
                var stats = new FileSystemStats({
                    isFile: true,
                    mtime: new Date(0),
                    hash: 0
                });
                callback(null, text, stats);
            }).fail(function (jqXHR, errorCode, httpError) {
                callback(errorCode + ": " + httpError);
            });
        }
    }
    
    // Export public API
    exports.stat        = stat;
    exports.readFile    = readFile;
});