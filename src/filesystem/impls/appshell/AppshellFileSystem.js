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
        NodeDomain          = require("utils/NodeDomain");
    
    var FILE_WATCHER_BATCH_TIMEOUT = 200;   // 200ms - granularity of file watcher changes
    
    var _changeCallback,            // Callback to notify FileSystem of watcher changes
        _offlineCallback,           // Callback to notify FileSystem that watchers are offline
        _changeTimeout,             // Timeout used to batch up file watcher changes
        _pendingChanges = {};       // Pending file watcher changes
    
    var _bracketsPath   = FileUtils.getNativeBracketsDirectoryPath(),
        _modulePath     = FileUtils.getNativeModuleDirectoryPath(module),
        _nodePath       = "node/FileWatcherDomain",
        _domainPath     = [_bracketsPath, _modulePath, _nodePath].join("/"),
        _nodeDomain     = new NodeDomain("fileWatcher", _domainPath);
    
    // If the connection closes, notify the FileSystem that watchers have gone offline.
    $(_nodeDomain.connection).on("close", function (event, promise) {
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
    $(_nodeDomain).on("change", _fileWatcherChange);

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
    
    /**
     * Display an open-files dialog to the user and call back asynchronously with
     * either a FileSystmError string or an array of path strings, which indicate
     * the entry or entries selected.
     * 
     * @param {boolean} allowMultipleSelection
     * @param {boolean} chooseDirectories
     * @param {string} title
     * @param {string} initialPath
     * @param {Array.<string>=} fileTypes
     * @param {function(?string, Array.<string>=)} callback
     */
    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        appshell.fs.showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, _wrap(callback));
    }
    
    /**
     * Display a save-file dialog and call back asynchronously with either a
     * FileSystemError string or the path to which the user has chosen to save
     * the file. If the dialog is cancelled, the path string will be empty.
     * 
     * @param {string} title
     * @param {string} initialPath
     * @param {string} proposedNewFilename
     * @param {function(?string, string=)} callback
     */
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        appshell.fs.showSaveDialog(title, initialPath, proposedNewFilename, _wrap(callback));
    }
    
    /**
     * Stat the file or directory at the given path, calling back
     * asynchronously with either a FileSystemError string or the entry's
     * associated FileSystemStats object.
     * 
     * @param {string} path
     * @param {function(?string, FileSystemStats=)} callback
     */
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
    
    /**
     * Determine whether a file or directory exists at the given path by calling
     * back asynchronously with either a FileSystemError string or a boolean,
     * which is true if the file exists and false otherwise. The error will never
     * be FileSystemError.NOT_FOUND; in that case, there will be no error and the
     * boolean parameter will be false.
     * 
     * @param {string} path
     * @param {function(?string, boolean)} callback
     */
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
    
    /**
     * Read the contents of the directory at the given path, calling back
     * asynchronously either with a FileSystemError string or an array of 
     * FileSystemEntry objects along with another consistent array, each index
     * of which either contains a FileSystemStats object for the corresponding
     * FileSystemEntry object in the second parameter or a FileSystemError
     * string describing a stat error.
     * 
     * @param {string} path
     * @param {function(?string, Array.<FileSystemEntry>=, Array.<string|FileSystemStats>=)} callback
     */
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
    
    /**
     * Create a directory at the given path, and call back asynchronously with
     * either a FileSystemError string or a stats object for the newly created
     * directory. The octal mode parameter is optional; if unspecified, the mode
     * of the created directory is implementation dependent.
     * 
     * @param {string} path
     * @param {number=} mode The base-eight mode of the newly created directory.
     * @param {function(?string, FileSystemStats=)=} callback
     */
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
    
    /**
     * Rename the file or directory at oldPath to newPath, and call back
     * asynchronously with a possibly null FileSystemError string.
     * 
     * @param {string} oldPath
     * @param {string} newPath
     * @param {function(?string)=} callback
     */
    function rename(oldPath, newPath, callback) {
        appshell.fs.rename(oldPath, newPath, _wrap(callback));
    }
    
    /**
     * Read the contents of the file at the given path, calling back
     * asynchronously with either a FileSystemError string, or with the data and
     * the FileSystemStats object associated with the read file. The options
     * parameter can be used to specify an encoding (default "utf8"), and also
     * a cached stats object that the implementation is free to use in order
     * to avoid an additional stat call.
     * 
     * Note: if either the read or the stat call fails then neither the read data
     * nor stat will be passed back, and the call should be considered to have failed.
     * If both calls fail, the error from the read call is passed back.
     * 
     * @param {string} path
     * @param {{encoding: string=, stat: FileSystemStats=}} options
     * @param {function(?string, string=, FileSystemStats=)} callback
     */
    function readFile(path, options, callback) {
        var encoding = options.encoding || "utf8";
        
        // Execute the read and stat calls in parallel. Callback early if the
        // read call completes first with an error; otherwise wait for both
        // to finish.
        var done = false, data, stat, err;

        if (options.stat) {
            done = true;
            stat = options.stat;
        } else {
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
    }
    
    /**
     * Write data to the file at the given path, calling back asynchronously with
     * either a FileSystemError string or the FileSystemStats object associated
     * with the written file and a boolean that indicates whether the file was
     * created by the write (true) or not (false). If no file exists at the
     * given path, a new file will be created. The options parameter can be used
     * to specify an encoding (default "utf8"), an octal mode (default
     * unspecified and implementation dependent), and a consistency hash, which
     * is used to the current state of the file before overwriting it. If a
     * consistency hash is provided but does not match the hash of the file on
     * disk, a FileSystemError.CONTENTS_MODIFIED error is passed to the callback.
     * 
     * @param {string} path
     * @param {string} data
     * @param {{encoding : string=, mode : number=, expectedHash : object=}} options
     * @param {function(?string, FileSystemStats=, boolean)} callback
     */
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
            
            if (options.hasOwnProperty("expectedHash") && options.expectedHash !== stats._hash) {
                console.error("Blind write attempted: ", path, stats._hash, options.expectedHash);
                callback(FileSystemError.CONTENTS_MODIFIED);
                return;
            }
            
            _finishWrite(false);
        });
    }
    
    /**
     * Unlink (i.e., permanently delete) the file or directory at the given path,
     * calling back asynchronously with a possibly null FileSystemError string.
     * Directories will be unlinked even when non-empty.
     * 
     * @param {string} path
     * @param {function(string)=} callback
     */
    function unlink(path, callback) {
        appshell.fs.unlink(path, function (err) {
            callback(_mapError(err));
        });
    }

    /**
     * Move the file or directory at the given path to a system dependent trash
     * location, calling back asynchronously with a possibly null FileSystemError
     * string. Directories will be moved even when non-empty.
     * 
     * @param {string} path
     * @param {function(string)=} callback
     */
    function moveToTrash(path, callback) {
        appshell.fs.moveToTrash(path, function (err) {
            callback(_mapError(err));
        });
    }
    
    /**
     * Initialize file watching for this filesystem, using the supplied
     * changeCallback to provide change notifications. The first parameter of
     * changeCallback specifies the changed path (either a file or a directory);
     * if this parameter is null, it indicates that the implementation cannot
     * specify a particular changed path, and so the callers should consider all
     * paths to have changed and to update their state accordingly. The second
     * parameter to changeCallback is an optional FileSystemStats object that
     * may be provided in case the changed path already exists and stats are
     * readily available. The offlineCallback will be called in case watchers
     * are no longer expected to function properly. All watched paths are
     * cleared when the offlineCallback is called.
     * 
     * @param {function(?string, FileSystemStats=)} changeCallback
     * @param {function()=} callback
     */
    function initWatchers(changeCallback, offlineCallback) {
        _changeCallback = changeCallback;
        _offlineCallback = offlineCallback;
    }
    
    /**
     * Start providing change notifications for the file or directory at the
     * given path, calling back asynchronously with a possibly null FileSystemError
     * string when the initialization is complete. Notifications are provided
     * using the changeCallback function provided by the initWatchers method.
     * Note that change notifications are only provided recursively for directories
     * when the recursiveWatch property of this module is true.
     * 
     * @param {string} path
     * @param {function(?string)=} callback
     */
    function watchPath(path, callback) {
        appshell.fs.isNetworkDrive(path, function (err, isNetworkDrive) {
            if (err || isNetworkDrive) {
                callback(FileSystemError.UNKNOWN);
                return;
            }
            
            _nodeDomain.exec("watchPath", path)
                .then(callback, callback);
        });
    }
    
    /**
     * Stop providing change notifications for the file or directory at the
     * given path, calling back asynchronously with a possibly null FileSystemError
     * string when the operation is complete.
     * 
     * @param {string} path
     * @param {function(?string)=} callback
     */
    function unwatchPath(path, callback) {
        _nodeDomain.exec("unwatchPath", path)
            .then(callback, callback);
    }
    
    /**
     * Stop providing change notifications for all previously watched files and
     * directories, optionally calling back asynchronously with a possibly null
     * FileSystemError string when the operation is complete.
     *
     * @param {function(?string)=} callback
     */
    function unwatchAll(callback) {
        _nodeDomain.exec("unwatchAll")
            .then(callback, callback);
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
    
    /**
     * Indicates whether or not recursive watching notifications are supported
     * by the watchPath call. Currently, only Darwin supports recursive watching.
     *
     * @type {boolean}
     */
    exports.recursiveWatch = appshell.platform === "mac" || appshell.platform === "win";
    
    /**
     * Indicates whether or not the filesystem should expect and normalize UNC
     * paths. If set, then //server/directory/ is a normalized path; otherwise the
     * filesystem will normalize it to /server/directory. Currently, UNC path 
     * normalization only occurs on Windows.
     *
     * @type {boolean}
     */
    exports.normalizeUNCPaths = appshell.platform === "win";
});
