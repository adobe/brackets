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
    
    var FILE_WATCHER_BATCH_TIMEOUT = 200;   // 200ms - granularity of file watcher changes
    
    var _changeCallback,            // Callback to notify FileSystem of watcher changes
        _offlineCallback,           // Callback to notify FileSystem that watchers are offline
        _changeTimeout,             // Timeout used to batch up file watcher changes
        _pendingChanges = {};       // Pending file watcher changes
    
    var _bracketsPath   = FileUtils.getNativeBracketsDirectoryPath(),
        _modulePath     = FileUtils.getNativeModuleDirectoryPath(module),
        _nodePath       = "node/FileWatcherDomain",
        _domainPath     = [_bracketsPath, _modulePath, _nodePath].join("/"),
        _nodeConnection = new NodeConnection(),
        _domainLoaded   = false;    // Whether the fileWatcher domain has been loaded
    
    /**
     * A promise that resolves when the NodeConnection object is connected and
     * the fileWatcher domain has been loaded.
     *
     * @type {?jQuery.Promise}
     */
    var _nodeConnectionPromise;
    
    /**
     * Load the fileWatcher domain on the assumed-open NodeConnection object
     *
     * @private
     */
    function _loadDomains() {
        return _nodeConnection
            .loadDomains(_domainPath, true)
            .done(function () {
                _domainLoaded = true;
                _nodeConnectionPromise = null;
            });
    }
        
    // Initialize the connection and connection promise
    _nodeConnectionPromise = _nodeConnection.connect(true).then(_loadDomains);
    
    // Setup the close handler. Re-initializes the connection promise and
    // notifies the FileSystem that watchers have gone offline.
    $(_nodeConnection).on("close", function (event, promise) {
        _domainLoaded = false;
        _nodeConnectionPromise = promise.then(_loadDomains);
        
        if (_offlineCallback) {
            _offlineCallback();
        }
    });
    
    /**
     * Enqueue a file change event for eventual reporting back to the FileSystem.
     * 
     * @param {string} changedPath The path that was changed
     * @param {boolean} needsStats Whether or not the eventual change event should include stats
     * @private
     */
    function _enqueueChange(changedPath, needsStats) {
        _pendingChanges[changedPath] = _pendingChanges[changedPath] || needsStats;

        if (!_changeTimeout) {
            _changeTimeout = window.setTimeout(function () {
                if (_changeCallback) {
                    Object.keys(_pendingChanges).forEach(function (path) {
                        var needsStats = _pendingChanges[path];
                        if (needsStats) {
                            exports.stat(path, function (err, stats) {
                                if (err) {
                                    console.warn("Unable to stat changed path: ", path, err);
                                    return;
                                }
                                _changeCallback(path, stats);
                            });
                        } else {
                            _changeCallback(path);
                        }
                    });
                }
                
                _changeTimeout = null;
                _pendingChanges = {};
            }, FILE_WATCHER_BATCH_TIMEOUT);
        }
    }
    
    /**
     * Event handler for the Node fileWatcher domain's change event.
     * 
     * @param {jQuery.Event} The underlying change event
     * @param {string} path The path that is reported to have changed
     * @param {string} event The type of the event: either "change" or "rename"
     * @param {string=} filename The name of the file that changed.
     * @private
     */
    function _fileWatcherChange(evt, path, event, filename) {
        var change;

        if (event === "change") {
            // Only register change events if filename is passed
            if (filename) {
                // an existing file was created; stats are needed
                change = path + filename;
                _enqueueChange(change, true);
            }
        } else if (event === "rename") {
            // a new file was created; no stats are needed
            change = path;
            _enqueueChange(change, false);
        }
    }

    // Setup the change handler. This only needs to happen once.
    $(_nodeConnection).on("fileWatcher.change", _fileWatcherChange);
    
    /**
     * Execute the named function from the fileWatcher domain when the
     * NodeConnection is connected and the domain has been loaded. Additional
     * parameters are passed as arguments to the command.
     * 
     * @param {string} name The name of the command to execute
     * @return {jQuery.Promise} Resolves with the results of the command.
     * @private
     */
    function _execWhenConnected(name) {
        var params = Array.prototype.slice.call(arguments, 1);
        
        function execConnected() {
            var domains = _nodeConnection.domains,
                domain = domains && domains.fileWatcher,
                fn = domain && domain[name];
            
            if (fn) {
                return fn.apply(domain, params);
            } else {
                return $.Deferred().reject().promise();
            }
        }
        
        if (_domainLoaded && _nodeConnection.connected()) {
            return execConnected();
        } else if (_nodeConnectionPromise) {
            return _nodeConnectionPromise.then(execConnected);
        } else {
            return $.Deferred().reject().promise();   
        }
    }

    /**
     * Convert appshell error codes to FileSystemError values.
     * 
     * @param {?number} err An appshell error code
     * @return {?string} A FileSystemError string, or null if there was no error code.
     * @private
     */
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
    
    /**
     * Convert a callback to one that transforms its first parameter from an
     * appshell error code to a FileSystemError string.
     * 
     * @param {function(?number)} cb A callback that expects an appshell error code
     * @return {function(?string)} A callback that expects a FileSystemError string
     * @private
     */
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
                    realPath: stats.realPath,
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
                    callback(err, stat);
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
    
    function writeFile(path, data, options, callback) {
        var encoding = options.encoding || "utf8";
        
        function _finishWrite(created) {
            appshell.fs.writeFile(path, data, encoding, function (err) {
                if (err) {
                    callback(_mapError(err));
                } else {
                    stat(path, function (err, stat) {
                        callback(err, stat, created);
                    });
                }
            });
        }
        
        stat(path, function (err, stats) {
            if (err) {
                switch (err) {
                case FileSystemError.NOT_FOUND:
                    _finishWrite(true);
                    break;
                default:
                    callback(err);
                }
                return;
            }
            
            if (options.hasOwnProperty("hash") && options.hash !== stats._hash) {
                console.warn("Blind write attempted: ", path, stats._hash, options.hash);
                callback(FileSystemError.CONTENTS_MODIFIED);
                return;
            }
            
            _finishWrite(false);
        });
    }
    
    function unlink(path, callback) {
        appshell.fs.unlink(path, function (err) {
            callback(_mapError(err));
        });
    }
    
    function moveToTrash(path, callback) {
        appshell.fs.moveToTrash(path, function (err) {
            callback(_mapError(err));
        });
    }
    
    function initWatchers(changeCallback, offlineCallback) {
        _changeCallback = changeCallback;
        _offlineCallback = offlineCallback;
    }
    
    function watchPath(path, callback) {
        appshell.fs.isNetworkDrive(path, function (err, isNetworkDrive) {
            if (err || isNetworkDrive) {
                callback(FileSystemError.UNKNOWN);
                return;
            }
            
            _execWhenConnected("watchPath", path)
                .done(callback.bind(undefined, null))
                .fail(callback);
        });
    }
    
    function unwatchPath(path, callback) {
        appshell.fs.isNetworkDrive(path, function (err, isNetworkDrive) {
            if (err || isNetworkDrive) {
                callback(FileSystemError.UNKNOWN);
                return;
            }
            
            _execWhenConnected("unwatchPath", path)
                .done(callback.bind(undefined, null))
                .fail(callback);
        });
    }
    
    function unwatchAll(callback) {
        appshell.fs.isNetworkDrive(path, function (err, isNetworkDrive) {
            if (err || isNetworkDrive) {
                callback(FileSystemError.UNKNOWN);
                return;
            }
            
            _execWhenConnected("unwatchAll")
                .done(callback.bind(undefined, null))
                .fail(callback);
        });
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
    
    // Node only supports recursive file watching on the Darwin
    exports.recursiveWatch = appshell.platform === "mac";
    
    // Only perform UNC path normalization on Windows
    exports.normalizeUNCPaths = appshell.platform === "win";
});
