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

    var FileSystemError     = require("filesystem/FileSystemError"),
        FileSystemStats     = require("filesystem/FileSystemStats");
    
    // Watcher callback function
    var _watcherCallback;
    
    // Initial file system data. 
    var _initialData = {
        "/": {
            isFile: false,
            mtime: new Date()
        },
        "/file1.txt": {
            isFile: true,
            mtime: new Date(),
            contents: "File 1 Contents"
        },
        "/file2.txt": {
            isFile: true,
            mtime: new Date(),
            contents: "File 2 Contents"
        },
        "/subdir/": {
            isFile: false,
            mtime: new Date()
        },
        "/subdir/file3.txt": {
            isFile: true,
            mtime: new Date(),
            contents: "File 3 Contents"
        },
        "/subdir/file4.txt": {
            isFile: true,
            mtime: new Date(),
            contents: "File 4 Contents"
        }
    };
    
    // "Live" data for this instance of the file system. Use reset() to 
    // initialize with _initialData
    var _data;
    
    // Callback hooks, set in when(). See when() for more details.
    var _hooks;
    
    function _getHookEntry(method, path) {
        return _hooks[method] && _hooks[method][path];
    }
    
    function _getCallback(method, path, cb) {
        var entry = _getHookEntry(method, path),
            result = entry && entry.callback && entry.callback(cb);
        
        if (!result) {
            result = cb;
        }
        return result;
    }
    
    function _getNotification(method, path, cb) {
        var entry = _getHookEntry(method, path),
            result = entry && entry.notify && entry.notify(cb);
        
        if (!result) {
            result = cb;
        }
        return result;
    }
    
    function _getStat(path) {
        var entry = _data[path],
            stat = null;
        
        if (entry) {
            stat = new FileSystemStats({
                isFile: entry.isFile,
                mtime: entry.mtime,
                size: entry.contents ? entry.contents.length : 0,
                hash: entry.mtime.getTime()
            });
        }
        
        return stat;
    }
    
    function _sendWatcherNotification(path) {
        if (_watcherCallback) {
            _watcherCallback(path);
        }
    }
    
    function _sendDirectoryWatcherNotification(path) {
        // Path may be a file or a directory. If it's a file,
        // strip the file name off
        if (path[path.length - 1] !== "/") {
            path = path.substr(0, path.lastIndexOf("/") + 1);
        }
        _sendWatcherNotification(path);
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
        var cb = _getCallback("exists", path, callback);
        cb(null, !!_data[path]);
    }
    
    function readdir(path, callback) {
        var cb = _getCallback("readdir", path, callback),
            entry,
            contents = [],
            stats = [];
        
        if (!_data[path]) {
            cb(FileSystemError.NOT_FOUND);
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
        cb(null, contents, stats);
    }
    
    function mkdir(path, mode, callback) {
        if (typeof (mode) === "function") {
            callback = mode;
            mode = null;
        }
        var cb = _getCallback("mkdir", path, callback),
            notify = _getNotification("mkdir", path, _sendDirectoryWatcherNotification);
        
        if (_data[path]) {
            cb(FileSystemError.ALREADY_EXISTS);
        } else {
            var entry = {
                isFile: false,
                mtime: new Date()
            };
            _data[path] = entry;
            cb(null, _getStat(path));
            
            // Strip the trailing slash off the directory name so the
            // notification gets sent to the parent
            var notifyPath = path.substr(0, path.length - 1);
            notify(notifyPath);
        }
    }
    
    function rename(oldPath, newPath, callback) {
        var cb = _getCallback("rename", oldPath, callback),
            notify = _getNotification("rename", oldPath, _sendDirectoryWatcherNotification);
        
        if (_data[newPath]) {
            cb(FileSystemError.ALREADY_EXISTS);
        } else if (!_data[oldPath]) {
            cb(FileSystemError.NOT_FOUND);
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
            cb(null);
            
            // If renaming a Directory, remove the slash from the notification
            // name so the *parent* directory is notified of the change
            var notifyPath;
            
            if (oldPath[oldPath.length - 1] === "/") {
                notifyPath = oldPath.substr(0, oldPath.length - 1);
            } else {
                notifyPath = oldPath;
            }
            notify(notifyPath);
        }
    }
    
    function stat(path, callback) {
        var cb = _getCallback("stat", path, callback);
        if (!_data[path]) {
            cb(FileSystemError.NOT_FOUND);
        } else {
            cb(null, _getStat(path));
        }
    }
    
    function readFile(path, options, callback) {
        if (typeof (options) === "function") {
            callback = options;
            options = null;
        }
        
        var cb = _getCallback("readFile", path, callback);
        
        if (!_data[path]) {
            cb(FileSystemError.NOT_FOUND);
        } else {
            cb(null, _data[path].contents, _getStat(path));
        }
    }
    
    function writeFile(path, data, options, callback) {
        if (typeof (options) === "function") {
            callback = options;
            options = null;
        }
        
        stat(path, function (err, stats) {
            var cb = _getCallback("writeFile", path, callback);
            
            if (err && err !== FileSystemError.NOT_FOUND) {
                cb(err);
                return;
            }
            
            var exists = !!stats;
            if (exists && options.hasOwnProperty("hash") && options.hash !== stats._hash) {
                cb(FileSystemError.CONTENTS_MODIFIED);
                return;
            }

            var notification = exists ? _sendWatcherNotification : _sendDirectoryWatcherNotification,
                notify = _getNotification("writeFile", path, notification);

            if (!exists) {
                if (!_data[path]) {
                    _data[path] = {
                        isFile: true
                    };
                }
            }
            
            _data[path].contents = data;
            _data[path].mtime = new Date();
            cb(null, _getStat(path));
            notify(path);
        });
    }
    
    function unlink(path, callback) {
        var cb = _getCallback("unlink", path, callback),
            notify = _getNotification("unlink", path, _sendDirectoryWatcherNotification);
        
        if (!_data[path]) {
            cb(FileSystemError.NOT_FOUND);
        } else {
            delete _data[path];
            cb(null);
            notify(path);
        }
    }
    
    function initWatchers(callback) {
        _watcherCallback = callback;
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
    exports.unlink          = unlink;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;
    
    // Test methods
    exports.reset = function () {
        _data = {};
        $.extend(_data, _initialData);
        _hooks = {};
    };
    
    /**
     * Add a callback and notification hooks to be used when specific
     * methods are called with a specific path.
     *
     * @param {string} method The name of the method
     * @param {string} path The path that must be matched
     * @param {object} callbacks Object with optional 'callback' and 'notify'
     *           fields. These are functions that have one parameter and
     *           must return a function.
     *
     * Here is an example that delays the callback and change notifications by 300ms when
     * writing a file named "/foo.txt".
     *
     * function delayedCallback(cb) {
     *     return function () {
     *         var args = arguments;
     *         setTimeout(function () {
     *             cb.apply(null, args);
     *         }, 300);
     *     };
     * }
     *
     * MockFileSystem.when("writeFile", "/foo.txt", {callback: delayedCallback, notify: delayedCallback});
     */
    exports.when = function (method, path, callbacks) {
        if (!_hooks[method]) {
            _hooks[method] = {};
        }
        _hooks[method][path] = callbacks;
    };
});
