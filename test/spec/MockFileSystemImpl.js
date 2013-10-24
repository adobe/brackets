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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    var FileSystemError     = require("filesystem/FileSystemError");
    
    // Initial file system data. 
    var _initialData = {
        "/": {
            isFile: false,
            mtime: Date.now()
        },
        "/file1.txt": {
            isFile: true,
            mtime: Date.now(),
            contents: "File 1 Contents"
        },
        "/file2.txt": {
            isFile: true,
            mtime: Date.now(),
            contents: "File 2 Contents"
        },
        "/subdir/": {
            isFile: false,
            mtime: Date.now()
        },
        "/subdir/file3.txt": {
            isFile: true,
            mtime: Date.now(),
            contents: "File 3 Contents"
        },
        "/subdir/file4.txt": {
            isFile: true,
            mtime: Date.now(),
            contents: "File 4 Contents"
        }
    };
    
    // "Live" data for this instance of the file system. Use reset() to 
    // initialize with _initialData
    var _data;
    
    function _getStat(path) {
        var entry = _data[path],
            stat = null;
        
        if (entry) {
            stat = {
                isDirectory: function () {
                    return !entry.isFile;
                },
                isFile: function () {
                    return entry.isFile;
                },
                mtime: entry.mtime
            };
        }
        
        return stat;
    }
    
    function init(callback) {
        if (callback) {
            callback();
        }
    }

    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        // Not implemented
        callback(null, null);
    }
    
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        // Not implemented
        callback(null, null);
    }

    function exists(path, callback) {
        callback(!!_data[path]);
    }
    
    function readdir(path, callback) {
        var entry,
            contents = [],
            stats = [];
        
        if (!_data[path]) {
            callback(FileSystemError.NOT_FOUND);
            return;
        }
        
        for (entry in _data) {
            if (_data.hasOwnProperty(entry)) {
                var isDir = false;
                if (entry[entry.length - 1] === "/") {
                    entry = entry.substr(0, entry.length - 1);
                    isDir = true;
                }
                if (entry !== path &&
                        entry.indexOf(path) === 0 &&
                        entry.lastIndexOf("/") === path.lastIndexOf("/")) {
                    contents.push(entry.substr(entry.lastIndexOf("/")) + (isDir ? "/" : ""));
                    stats.push(_getStat(entry + (isDir ? "/" : "")));
                }
            }
        }
        callback(null, contents, stats);
    }
    
    function mkdir(path, mode, callback) {
        if (typeof (mode) === "function") {
            callback = mode;
            mode = null;
        }
        
        if (_data[path]) {
            callback(FileSystemError.ALREADY_EXISTS);
        } else {
            var entry = {
                isFile: false,
                mtime: Date.now()
            };
            _data[path] = entry;
            callback(null, _getStat(path));
        }
    }
    
    function rename(oldPath, newPath, callback) {
        if (_data[newPath]) {
            callback(FileSystemError.ALREADY_EXISTS);
        } else if (!_data[oldPath]) {
            callback(FileSystemError.NOT_FOUND);
        } else {
            _data[newPath] = _data[oldPath];
            delete _data[oldPath];
            if (!_data[newPath].isFile) {
                var entry, i,
                    toDelete = [];
                
                for (entry in _data) {
                    if (_data.hasOwnProperty(entry)) {
                        if (entry.indexOf(oldPath) === 0) {
                            _data[newPath + entry.substr(oldPath.length)] = _data[entry];
                            toDelete.push(entry);
                        }
                    }
                }
                for (i = toDelete.length; i; i--) {
                    delete _data[toDelete.pop()];
                }
            }
            callback(null);
        }
    }
    
    function stat(path, callback) {
        if (!_data[path]) {
            callback(FileSystemError.NOT_FOUND);
        } else {
            callback(null, _getStat(path));
        }
    }
    
    function readFile(path, options, callback) {
        if (typeof (options) === "function") {
            callback = options;
            options = null;
        }
        
        if (!_data[path]) {
            callback(FileSystemError.NOT_FOUND);
        } else {
            callback(null, _data[path].contents);
        }
    }
    
    function writeFile(path, data, options, callback) {
        if (typeof (options) === "function") {
            callback = options;
            options = null;
        }
        
        if (!_data[path]) {
            _data[path] = {
                isFile: true
            };
        }
        _data[path].contents = data;
        _data[path].mtime = Date.now();
        callback(null);
    }
    
    function chmod(path, mode, callback) {
        // Not implemented
        callback(null);
    }
    
    function unlink(path, callback) {
        if (!_data[path]) {
            callback(FileSystemError.NOT_FOUND);
        } else {
            delete _data[path];
            callback(null);
        }
    }
    
    function initWatchers(callback) {
        // Not implemeneted
        callback(null);
    }
    
    function watchPath(path) {
    }
    
    function unwatchPath(path) {
    }
    
    function unwatchAll() {
    }

    
    exports.init            = init;
    exports.showOpenDialog  = showOpenDialog;
    exports.showSaveDialog  = showSaveDialog;
    exports.exists          = exists;
    exports.readdir         = readdir;
    exports.mkdir           = mkdir;
    exports.rename          = rename;
    exports.stat            = stat;
    exports.readFile        = readFile;
    exports.writeFile       = writeFile;
    exports.chmod           = chmod;
    exports.unlink          = unlink;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;
    
    // Test methods
    exports.reset = function () {
        _data = {};
        $.extend(_data, _initialData);
    };
});
