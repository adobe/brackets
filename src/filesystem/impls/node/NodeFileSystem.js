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
/*global define, appshell, $, window, escape */

define(function (require, exports, module) {
    "use strict";
    
    var FileUtils           = require("file/FileUtils"),
        FileSystemStats     = require("filesystem/FileSystemStats"),
        FileSystemError     = require("filesystem/FileSystemError"),
        NodeConnection      = require("utils/NodeConnection");
    
    /**
     * @const
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the file watcher in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 30000,    // 30 seconds - TODO: share with StaticServer & Package?
        FILE_WATCHER_BATCH_TIMEOUT = 200;   // 200ms - granularity of file watcher changes
    
    var _changeCallback,            // Callback to notify FileSystem of watcher changes
        _changeTimeout,             // Timeout used to batch up file watcher changes
        _pendingChanges = {};       // Pending file watcher changes

    function _mapError(err) {
        if (!err) {
            return null;
        }
        
        switch (err) {
        case appshell.fs.ERR_INVALID_PARAMS:
            return FileSystemError.INVALID_PARAMS;
        case appshell.fs.ERR_NOT_FOUND:
            return FileSystemError.NOT_FOUND;
        case appshell.fs.ERR_CANT_READ:
            return FileSystemError.NOT_READABLE;
        case appshell.fs.ERR_CANT_WRITE:
            return FileSystemError.NOT_WRITABLE;
        case appshell.fs.ERR_UNSUPPORTED_ENCODING:
            return FileSystemError.NOT_READABLE;
        case appshell.fs.ERR_OUT_OF_SPACE:
            return FileSystemError.OUT_OF_SPACE;
        case appshell.fs.ERR_FILE_EXISTS:
            return FileSystemError.ALREADY_EXISTS;
        }
        return FileSystemError.UNKNOWN;
    }
    
    function _mapNodeError(err) {
        if (!err) {
            return FileSystemError.UNKNOWN;
        }
        
        switch (err.cause && err.cause.code) {
        case "ENOENT":
            return FileSystemError.NOT_FOUND;
        case "EEXIST":
            return FileSystemError.ALREADY_EXISTS;
        case "EPERM":
            return FileSystemError.NOT_READABLE; // ???
        default:
            console.log("Unknown node error: ", err);
            return FileSystemError.UNKNOWN;
        }
    }

    function _mapNodeStats(stats) {
        var options = {
            isFile: stats.isFile,
            mtime: new Date(stats.mtime),
            size: stats.size
        };

        return new FileSystemStats(options);
    }
    
    /** Returns the path of the item's containing directory (item may be a file or a directory) */
    function _parentPath(path) {
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === path.length - 1) {
            lastSlash = path.lastIndexOf("/", lastSlash - 1);
        }
        return path.substr(0, lastSlash + 1);
    }
    
    var _bracketsPath = FileUtils.getNativeBracketsDirectoryPath(),
        _modulePath = FileUtils.getNativeModuleDirectoryPath(module),
        _nodePath = "node/NodeFileSystemDomain",
        _domainPath = [_bracketsPath, _modulePath, _nodePath].join("/");
    
    var _nodeConnection = new NodeConnection(),
        _nodeConnectionPromise = null;
    
    function _connectToNode() {
        return _nodeConnection
            .connect(true)
            .then(_nodeConnection.loadDomains.bind(_nodeConnection, _domainPath, true));
    }

    $(_nodeConnection).on("close", function (promise) {
        _nodeConnectionPromise = _connectToNode();
    });

    function _execWhenConnected(name, args, callback, errback) {
        function execConnected() {
            var domain = _nodeConnection.domains.fileSystem,
                fn = domain[name];

            fn.apply(domain, args)
                .done(callback)
                .fail(errback);
        }

        if (_nodeConnection.connected()) {
            execConnected();
        } else {
            _nodeConnectionPromise
                .done(execConnected)
                .fail(errback);
        }
    }
    
    function init(callback) {
        _nodeConnectionPromise = _connectToNode().done(callback);
    }
    
    function _wrap(cb) {
        return function (err) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = _mapError(args[0]);
            cb.apply(null, args);
        };
    }
    
    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        appshell.fs.showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, _wrap(callback));
    }
    
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        appshell.fs.showSaveDialog(title, initialPath, proposedNewFilename, _wrap(callback));
    }
    
    function stat(path, callback) {
        _execWhenConnected("stat", [path],
            function (statObj) {
                callback(null, _mapNodeStats(statObj));
            }, function (err) {
                callback(_mapNodeError(err));
            });
    }
    
    function exists(path, callback) {
        _execWhenConnected("exists", [path],
            callback,
            callback.bind(undefined, false));
    }
    
    function readdir(path, callback) {
        _execWhenConnected("readdir", [path],
            function (statObjs) {
                var names = [],
                    stats = statObjs.map(function (statObj) {
                        names.push(statObj.name);
                        return _mapNodeStats(statObj);
                    });
                callback(null, names, stats);
            }, function (err) {
                callback(_mapNodeError(err));
            });
    }
    
    function mkdir(path, mode, callback) {
        if (typeof mode === "function") {
            callback = mode;
            mode = parseInt("0755", 8);
        }

        _execWhenConnected("mkdir", [path, mode],
            function (statObj) {
                callback(null, _mapNodeStats(statObj));
                
                 // Fake a file-watcher result until real watchers respond quickly
                _changeCallback(_parentPath(path));
            }, function (err) {
                callback(_mapNodeError(err));
            });
    }
    
    function rename(oldPath, newPath, callback) {
        _execWhenConnected("rename", [oldPath, newPath],
            function () {
                callback(null);
                // No need to fake a file-watcher result here: FileSystem already updates index on rename()                
            }, function (err) {
                callback(_mapNodeError(err));
            });
    }
    
    function strdecode(data) {
        return JSON.parse(decodeURIComponent(escape(data)));
    }

    function readFile(path, options, callback) {
        var encoding = "utf8";
        
        if (typeof options === "function") {
            callback = options;
        } else {
            encoding = options.encoding || "utf8";
        }

        _execWhenConnected("readFile", [path, encoding],
            function (statObj) {
                var data = statObj.data,
                    stat = _mapNodeStats(statObj);
                
                callback(null, strdecode(data), stat);
            }, function (err) {
                callback(_mapNodeError(err));
            });
    }
    
    function writeFile(path, data, options, callback) {
        var encoding = "utf8";
        
        if (typeof options === "function") {
            callback = options;
        } else {
            encoding = options.encoding || "utf8";
        }

        _execWhenConnected("writeFile", [path, data, encoding],
            function (statObj) {
                var created = statObj.created,
                    stat = _mapNodeStats(statObj);
                
                callback(null, stat);
                
                // Fake a file-watcher result until real watchers respond quickly
                if (!created) {
                    _changeCallback(path, stat);        // existing file modified
                } else {
                    _changeCallback(_parentPath(path)); // new file created
                }
            }, function (err) {
                callback(_mapNodeError(err));
            });
    }
    
    function chmod(path, mode, callback) {
        _execWhenConnected("chmod", [path, mode],
            callback.bind(undefined, null),
            function (err) {
                callback(_mapNodeError(err));
            });
    }
    
    function unlink(path, callback) {
        _execWhenConnected("unlink", [path],
            function () {
                callback(null);
                
                // Fake a file-watcher result until real watchers respond quickly
                _changeCallback(_parentPath(path));
            }, function (err) {
                callback(_mapNodeError(err));
            });
    }
    
    /* File watchers are temporarily disabled
    function _notifyChanges(callback) {
        var change;
        
        for (change in _pendingChanges) {
            if (_pendingChanges.hasOwnProperty(change)) {
                callback(change);
                delete _pendingChanges[change];
            }
        }
    }
    
    function _fileWatcherChange(evt, path, event, filename) {
        var change;
        
        if (event === "change") {
            // Only register change events if filename is passed
            if (filename) {
                change = path + "/" + filename;
            }
        } else if (event === "rename") {
            change = path;
        }
        if (change && !_pendingChanges.hasOwnProperty(change)) {
            if (!_changeTimeout) {
                _changeTimeout = window.setTimeout(function () {
                    _changeTimeout = null;
                    _notifyChanges(_fileWatcherChange.callback);
                }, FILE_WATCHER_BATCH_TIMEOUT);
            }
            
            _pendingChanges[change] = true;
        }
    }
    */
    
    function initWatchers(callback) {
        _changeCallback = callback;
        
        /* File watchers are temporarily disabled. For now, send
           a "wholesale" change when the window is focused. */
        $(window).on("focus", function () {
            callback(null);
        });
        
        /*
        _nodeConnectionPromise.done(function (nodeConnection) {
            if (nodeConnection.connected()) {
                _fileWatcherChange.callback = callback;
                $(nodeConnection).on("fileWatcher.change", _fileWatcherChange);
            }
        });
        */
    }
    
    function watchPath(path) {
        /*
        _nodeConnectionPromise.done(function (nodeConnection) {
            if (nodeConnection.connected()) {
                nodeConnection.domains.fileWatcher.watchPath(path);
            }
        });
        */
    }
    
    function unwatchPath(path) {
        /*
        _nodeConnectionPromise.done(function (nodeConnection) {
            if (nodeConnection.connected()) {
                nodeConnection.domains.fileWatcher.unwatchPath(path);
            }
        });
        */
    }
    
    function unwatchAll() {
        /*
        _nodeConnectionPromise.done(function (nodeConnection) {
            if (nodeConnection.connected()) {
                nodeConnection.domains.fileWatcher.unwatchAll();
            }
        });
        */
    }
    
    // Export public API
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
});
