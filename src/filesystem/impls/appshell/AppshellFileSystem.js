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
    
    /**
     * @private
     * @type{jQuery.Deferred.<NodeConnection>}
     * A deferred which is resolved with a NodeConnection or rejected if
     * we are unable to connect to Node.
     */
    var _nodeConnectionDeferred;
    
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
    
    /** Returns the path of the item's containing directory (item may be a file or a directory) */
    function _parentPath(path) {
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === path.length - 1) {
            lastSlash = path.lastIndexOf("/", lastSlash - 1);
        }
        return path.substr(0, lastSlash + 1);
    }
    
    
    function init(callback) {
        /* Temporarily disable file watchers
        if (!_nodeConnectionDeferred) {
            _nodeConnectionDeferred = new $.Deferred();
            
            // TODO: This code is a copy of the AppInit function in extensibility/Package.js. This should be refactored
            // into common code.
            
            
            // Start up the node connection, which is held in the
            // _nodeConnectionDeferred module variable. (Use 
            // _nodeConnectionDeferred.done() to access it.
            var connectionTimeout = window.setTimeout(function () {
                console.error("[AppshellFileSystem] Timed out while trying to connect to node");
                _nodeConnectionDeferred.reject();
            }, NODE_CONNECTION_TIMEOUT);
            
            var _nodeConnection = new NodeConnection();
            _nodeConnection.connect(true).then(function () {
                var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/node/FileWatcherDomain";
                
                _nodeConnection.loadDomains(domainPath, true)
                    .then(
                        function () {
                            window.clearTimeout(connectionTimeout);
                            _nodeConnectionDeferred.resolve(_nodeConnection);
                        },
                        function () { // Failed to connect
                            console.error("[AppshellFileSystem] Failed to connect to node", arguments);
                            window.clearTimeout(connectionTimeout);
                            _nodeConnectionDeferred.reject();
                        }
                    );
            });
        }
        */
        
        // Don't want to block on _nodeConnectionDeferred because we're needed as the 'root' fs
        // at startup -- and the Node-side stuff isn't needed for most functionality anyway.
        if (callback) {
            callback();
        }
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
        appshell.fs.stat(path, function (err, stats) {
            if (err) {
                callback(_mapError(err));
            } else {
                var options = {
                        isFile: stats.isFile(),
                        mtime: stats.mtime,
                        size: stats.size,
                        hash: stats.mtime.getTime()
                    };
                
                var fsStats = new FileSystemStats(options);
                
                callback(null, fsStats);
            }
        });
    }
    
    function exists(path, callback) {
        stat(path, function (err) {
            if (err) {
                if (err === FileSystemError.NOT_FOUND) {
                    callback(null, false);
                } else {
                    callback(err);
                }
                return;
            }

            callback(null, true);
        });
    }
    
    function readdir(path, callback) {
        appshell.fs.readdir(path, function (err, contents) {
            if (err) {
                callback(_mapError(err));
                return;
            }
            
            var count = contents.length;
            if (!count) {
                callback(null, [], []);
                return;
            }
            
            var stats = [];
            contents.forEach(function (val, idx) {
                stat(path + "/" + val, function (err, stat) {
                    stats[idx] = err || stat;
                    count--;
                    if (count <= 0) {
                        callback(null, contents, stats);
                    }
                });
            });
        });
    }
    
    function mkdir(path, mode, callback) {
        if (typeof mode === "function") {
            callback = mode;
            mode = parseInt("0755", 8);
        }
        appshell.fs.makedir(path, mode, function (err) {
            if (err) {
                callback(_mapError(err));
            } else {
                stat(path, function (err, stat) {
                    try {
                        callback(err, stat);
                    } finally {
                        // Fake a file-watcher result until real watchers respond quickly
                        _changeCallback(_parentPath(path));
                    }
                });
            }
        });
    }
    
    function rename(oldPath, newPath, callback) {
        appshell.fs.rename(oldPath, newPath, _wrap(callback));
        // No need to fake a file-watcher result here: FileSystem already updates index on rename()
    }
    
    /*
     * Note: if either the read or the stat call fails then neither the read data
     * or stat will be passed back, and the call should be considered to have failed.
     * If both calls fail, the error from the read call is passed back.
     */
    function readFile(path, options, callback) {
        var encoding = options.encoding || "utf8";
        
        // Execute the read and stat calls in parallel
        var done = false, data, stat, err;
        
        appshell.fs.readFile(path, encoding, function (_err, _data) {
            if (_err) {
                callback(_mapError(_err));
                return;
            }
            
            if (done) {
                callback(err, err ? null : _data, stat);
            } else {
                done = true;
                data = _data;
            }
        });

        exports.stat(path, function (_err, _stat) {
            if (done) {
                callback(_err, _err ? null : data, _stat);
            } else {
                done = true;
                stat = _stat;
                err = _err;
            }
        });
    }
    
    function writeFile(path, data, hash, options, callback) {
        var encoding = options.encoding || "utf8";
        
        function _finishWrite(alreadyExists) {
            appshell.fs.writeFile(path, data, encoding, function (err) {
                if (err) {
                    callback(_mapError(err));
                } else {
                    stat(path, function (err, stat) {
                        try {
                            callback(err, stat);
                        } finally {
                            // Fake a file-watcher result until real watchers respond quickly
                            if (alreadyExists) {
                                _changeCallback(path, stat);        // existing file modified
                            } else {
                                _changeCallback(_parentPath(path)); // new file created
                            }
                        }
                    });
                }
            });
        }
        
        stat(path, function (err, stats) {
            if (err) {
                switch (err) {
                case FileSystemError.NOT_FOUND:
                    _finishWrite(false);
                    break;
                default:
                    callback(err);
                }
                return;
            }
            
            if (hash !== stats._hash) {
                console.warn("Blind write attempted: ", path, stats._hash, hash);
                callback(FileSystemError.CONTENTS_MODIFIED);
                return;
            }
            
            _finishWrite(path, data, encoding, true, callback);
        });
    }
    
    function unlink(path, callback) {
        appshell.fs.unlink(path, function (err) {
            try {
                callback(_mapError(err));
            } finally {
                // Fake a file-watcher result until real watchers respond quickly
                _changeCallback(_parentPath(path));
            }
        });
    }
    
    function moveToTrash(path, callback) {
        appshell.fs.moveToTrash(path, function (err) {
            try {
                callback(_mapError(err));
            } finally {
                // Fake a file-watcher result until real watchers respond quickly
                _changeCallback(_parentPath(path));
            }
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
        _nodeConnectionDeferred.done(function (nodeConnection) {
            if (nodeConnection.connected()) {
                _fileWatcherChange.callback = callback;
                $(nodeConnection).on("fileWatcher.change", _fileWatcherChange);
            }
        });
        */
    }
    
    function watchPath(path) {
        /*
        _nodeConnectionDeferred.done(function (nodeConnection) {
            if (nodeConnection.connected()) {
                nodeConnection.domains.fileWatcher.watchPath(path);
            }
        });
        */
    }
    
    function unwatchPath(path) {
        /*
        _nodeConnectionDeferred.done(function (nodeConnection) {
            if (nodeConnection.connected()) {
                nodeConnection.domains.fileWatcher.unwatchPath(path);
            }
        });
        */
    }
    
    function unwatchAll() {
        /*
        _nodeConnectionDeferred.done(function (nodeConnection) {
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
    exports.unlink          = unlink;
    exports.moveToTrash     = moveToTrash;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;
});
