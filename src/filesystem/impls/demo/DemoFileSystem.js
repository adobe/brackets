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
/*global define, appshell, $, window */

define(function (require, exports, module) {
    "use strict";
    
    var FileSystemError = require("filesystem/FileSystemError");
    
    
    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        // FIXME
        throw new Error();
    }
    
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        // FIXME
        throw new Error();
    }
    
    function _makeFakeStat(file) {
        return {
            isFile: function () {
                return file;
            },
            isDirectory: function () {
                return !file;
            },
            mtime: new Date(0)
        };
    }
    
    function stat(path, callback) {
        if (path === "/Getting Started/index.html" || path === "/Getting Started/main.css") {
            callback(null, _makeFakeStat(true));
        } else if (path === "/Getting Started/") {
            callback(null, _makeFakeStat(false));
        } else {
            callback(FileSystemError.NOT_FOUND);
        }
    }
    
    function exists(path, callback) {
        stat(path, function (err) {
            if (err) {
                callback(null, false);
            } else {
                callback(null, true);
            }
        });
    }
    
    function readdir(path, callback) {
        if (path === "/Getting Started/") {
            callback(null,
                     ["index.html", "main.css"],
                     [_makeFakeStat(), _makeFakeStat()]);
        } else {
            callback(FileSystemError.NOT_FOUND);
        }
    }
    
    function mkdir(path, mode, callback) {
        callback("Cannot modify folders on HTTP demo server");
    }
    
    function rename(oldPath, newPath, callback) {
        callback("Cannot modify files on HTTP demo server");
    }
    
    function readFile(path, options, callback) {
        console.log("Reading 'file': " + path);
        
        if (typeof options === "function") {
            callback = options;
        }
        
        if (path === "/Getting Started/index.html") {
            callback(null, "<html>\n<head>\n  <title>Hello, world!</title>\n</head>\n<body>\n  Welcome to Brackets!\n</body>\n</html>", _makeFakeStat());
        } else if (path === "/Getting Started/main.css") {
            callback(null, ".hello {\n  content: 'world!';\n}", _makeFakeStat());
        } else {
            callback(FileSystemError.NOT_FOUND);
        }
    }
    
    function writeFile(path, data, options, callback) {
        callback("Cannot save to HTTP demo server");
    }
    
    function unlink(path, callback) {
        callback("Cannot modify files on HTTP demo server");
    }
    
    function moveToTrash(path, callback) {
        callback("Cannot delete files on HTTP demo server");
    }
    
    function initWatchers(changeCallback, offlineCallback) {
        // Ignore - since this FS is immutable, we're never going to call these
    }
    
    function watchPath(path, callback) {
        console.warn("File watching is not supported on immutable HTTP demo server");
        callback();
    }
    
    function unwatchPath(path, callback) {
        callback();
    }
    
    function unwatchAll(callback) {
        callback();
    }
    
    // Export public API
    exports.showOpenDialog  = showOpenDialog;
    exports.showSaveDialog  = showSaveDialog;
    exports.exists          = exists;
    exports.readdir         = readdir;
    exports.mkdir           = mkdir;
    exports.rename          = rename;
    exports.stat            = stat;
    exports.readFile        = readFile;
    exports.writeFile       = writeFile;
    exports.unlink          = unlink;
    exports.moveToTrash     = moveToTrash;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;
    
    exports.recursiveWatch    = true;
    exports.normalizeUNCPaths = false;
});