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
/*global define, $ */

/**
 * FileSystem is a model object representing a complete file system. This object creates
 * and manages File and Directory instances, dispatches events when the file system changes,
 * and provides methods for showing 'open' and 'save' dialogs.
 *
 * The FileSystem must be initialized very early during application startup. 
 *
 * There are three ways to get File or Directory instances:
 *    * Use FileSystem.resolve() to convert a path to a File/Directory object. This will only
 *      succeed if the file/directory already exists.
 *    * Use FileSystem.getFileForPath()/FileSystem.getDirectoryForPath() if you know the
 *      file/directory already exists, or if you want to create a new entry.
 *    * Use Directory.getContents() to return all entries for the specified Directory.
 *
 * FileSystem dispatches the following events:
 *    change - Sent whenever there is a change in the file system. The handler
 *          is passed one argument -- entry. This argument can be...
 *          *  a File - the contents of the file have changed, and should be reloaded.
 *          *  a Directory - an immediate child of the directory has been added, removed,
 *             or renamed/moved. Not triggered for "grandchildren".
 *          *  null - a 'wholesale' change happened, and you should assume everything may
 *             have changed.
 *          For changes made externally, there may be a significant delay before a "change" event
 *          is dispatched.
 *    rename - Sent whenever a File or Directory is renamed. All affected File and Directory
 *          objects have been updated to reflect the new path by the time this event is dispatched.
 *          This event should be used to trigger any UI updates that may need to occur when a path
 *          has changed.
 * 
 * FileSystem may perform caching. But it guarantees:
 *    * File contents & metadata - reads are guaranteed to be up to date (cached data is not used
 *      without first veryifying it is up to date).
 *    * Directory structure / file listing - reads may return cached data immediately, which may not
 *      reflect external changes made recently. (However, changes made via FileSystem itself are always
 *      reflected immediately, as soon as the change operation's callback signals success).
 *
 * The FileSystem doesn't directly read or write contents--this work is done by a low-level
 * implementation object. This allows client code to use the FileSystem API without having to
 * worry about the underlying storage, which could be a local filesystem or a remote server.
 */
define(function (require, exports, module) {
    "use strict";
    
    var Directory       = require("filesystem/Directory"),
        File            = require("filesystem/File"),
        FileIndex       = require("filesystem/FileIndex");
    
    /**
     * @constructor
     * The FileSystem is not usable until init() signals its callback.
     */
    function FileSystem() {
        // Create a file index
        this._index = new FileIndex();
        
        // Initialize the set of watched roots
        this._watchedRoots = {};

        // Initialize the watch/unwatch request queue
        this._watchRequests = [];
        
        this._watchResults = [];
    }
    
    /**
     * The low-level file system implementation used by this object. 
     * This is set in the init() function and cannot be changed.
     */
    FileSystem.prototype._impl = null;
    
    /**
     * The FileIndex used by this object. This is initialized in the constructor.
     */
    FileSystem.prototype._index = null;

    /**
     * Refcount of any pending write operations. Used to guarantee file-watcher callbacks don't
     * run until after operation-specific callbacks & index fixups complete (this is important for
     * distinguishing rename from an unrelated delete-add pair).
     * @type {number}
     */
    FileSystem.prototype._writeCount = 0;
    
    /**
     * The queue of pending watch/unwatch requests.
     * @type {Array.<{fn: function(), cb: function()}>}
     */
    FileSystem.prototype._watchRequests = null;
    
    /**
     * Queue of arguments to invoke _handleWatchResult() with; triggered once _writeCount drops to zero
     * @type {!Array.<{path:string, stat:Object}>}
     */
    FileSystem.prototype._watchResults = null;
    
    /** Process all queued watcher results, by calling _handleWatchResult() on each */
    FileSystem.prototype._triggerWatchCallbacksNow = function () {
        this._watchResults.forEach(function (info) {
            this._handleWatchResult(info.path, info.stat);
        }, this);
        this._watchResults.length = 0;
    };
    
    /**
     * Receives a result from the impl's watcher callback, and either processes it immediately (if
     * _writeCount is 0) or stores it for later processing (if _writeCount > 0).
     */
    FileSystem.prototype._enqueueWatchResult = function (path, stat) {
        this._watchResults.push({path: path, stat: stat});
        if (!this._writeCount) {
            this._triggerWatchCallbacksNow();
        }
    };
    

    /**
     * Dequeue and process all pending watch/unwatch requests
     */
    FileSystem.prototype._dequeueWatchRequest = function () {
        if (this._watchRequests.length > 0) {
            var request = this._watchRequests[0];
            
            request.fn.call(null, function () {
                // Apply the given callback
                var callbackArgs = arguments;
                try {
                    request.cb.apply(null, callbackArgs);
                } finally {
                    // Process the remaining watch/unwatch requests
                    this._watchRequests.shift();
                    this._dequeueWatchRequest();
                }
            }.bind(this));
        }
    };
    
    /**
     * Enqueue a new watch/unwatch request.
     *
     * @param {function()} fn - The watch/unwatch request function.
     * @param {callback()} cb - The callback for the provided watch/unwatch
     *      request function.
     */
    FileSystem.prototype._enqueueWatchRequest = function (fn, cb) {
        // Enqueue the given watch/unwatch request
        this._watchRequests.push({fn: fn, cb: cb});

        // Begin processing the queue if it is not already being processed
        if (this._watchRequests.length === 1) {
            this._dequeueWatchRequest();
        }
    };

    /**
     * The set of watched roots, encoded as a mapping from full paths to objects
     * which contain a file entry, filter function, and change handler function.
     * 
     * @type{Object.<string, {entry: FileSystemEntry,
     *                        filter: function(string): boolean} >}
     */
    FileSystem.prototype._watchedRoots = null;
    
    /**
     * Finds a parent watched root for a given path, or returns null if a parent
     * watched root does not exist.
     * 
     * @param{string} fullPath The child path for which a parent watched root is to be found
     * @return{?{entry: FileSystemEntry, filter: function(string) boolean}} The parent
     *      watched root, if it exists, or null.
     */
    FileSystem.prototype._findWatchedRootForPath = function (fullPath) {
        var watchedRoot = null;
        
        Object.keys(this._watchedRoots).some(function (watchedPath) {
            if (fullPath.indexOf(watchedPath) === 0) {
                watchedRoot = this._watchedRoots[watchedPath];
                return true;
            }
        }, this);
        
        return watchedRoot;
    };
    
    /**
     * Helper function to watch or unwatch a filesystem entry beneath a given
     * watchedRoot.
     * 
     * @private
     * @param {FileSystemEntry} entry - The FileSystemEntry to watch. Must be a
     *      non-strict descendent of watchedRoot.entry.
     * @param {Object} watchedRoot - See FileSystem._watchedRoots.
     * @param {function(?string)} callback - A function that is called once the
     *      watch is complete, possibly with a FileSystemError string.
     * @param {boolean} shouldWatch - Whether the entry should be watched (true)
     *      or unwatched (false).
     */
    FileSystem.prototype._watchOrUnwatchEntry = function (entry, watchedRoot, callback, shouldWatch) {
        var watchPaths = [],
            allChildren;
        
        if (!shouldWatch) {
            allChildren = [];
        }
        
        var visitor = function (child) {
            if (watchedRoot.filter(child.name)) {
                if (child.isDirectory || child === watchedRoot.entry) {
                    watchPaths.push(child.fullPath);
                }
                
                if (!shouldWatch) {
                    allChildren.push(child);
                }
            
                return true;
            }
            return false;
        }.bind(this);
        
        entry.visit(visitor, function (err) {
            if (err) {
                callback(err);
                return;
            }
            
            // sort paths by max depth for a breadth-first traversal
            var dirCount = {};
            watchPaths.forEach(function (path) {
                dirCount[path] = path.split("/").length;
            });
            
            watchPaths.sort(function (path1, path2) {
                var dirCount1 = dirCount[path1],
                    dirCount2 = dirCount[path2];
                
                return dirCount1 - dirCount2;
            });
            
            this._enqueueWatchRequest(function (callback) {
                if (shouldWatch) {
                    watchPaths.forEach(function (path, index) {
                        this._impl.watchPath(path);
                    }, this);
                } else {
                    watchPaths.forEach(function (path, index) {
                        this._impl.unwatchPath(path);
                    }, this);
                    allChildren.forEach(function (child) {
                        this._index.removeEntry(child);
                    }, this);
                }
                
                callback(null);
            }.bind(this), callback);
        }.bind(this));
    };
    
    /**
     * Watch a filesystem entry beneath a given watchedRoot.
     * 
     * @private
     * @param {FileSystemEntry} entry - The FileSystemEntry to watch. Must be a
     *      non-strict descendent of watchedRoot.entry.
     * @param {Object} watchedRoot - See FileSystem._watchedRoots.
     * @param {function(?string)} callback - A function that is called once the
     *      watch is complete, possibly with a FileSystemError string.
     */
    FileSystem.prototype._watchEntry = function (entry, watchedRoot, callback) {
        this._watchOrUnwatchEntry(entry, watchedRoot, callback, true);
    };

    /**
     * Unwatch a filesystem entry beneath a given watchedRoot.
     * 
     * @private
     * @param {FileSystemEntry} entry - The FileSystemEntry to watch. Must be a
     *      non-strict descendent of watchedRoot.entry.
     * @param {Object} watchedRoot - See FileSystem._watchedRoots.
     * @param {function(?string)} callback - A function that is called once the
     *      watch is complete, possibly with a FileSystemError string.
     */
    FileSystem.prototype._unwatchEntry = function (entry, watchedRoot, callback) {
        this._watchOrUnwatchEntry(entry, watchedRoot, callback, false);
    };
    
    /**
     * @param {function(?string)=} callback Callback resolved, possibly with a
     *      FileSystemError string.
     */
    FileSystem.prototype.init = function (impl, callback) {
        console.assert(!this._impl, "This FileSystem has already been initialized!");
        
        callback = callback || function () {};
        
        this._impl = impl;
        this._impl.init(function (err) {
            if (err) {
                callback(err);
                return;
            }
            
            // Initialize watchers
            this._impl.initWatchers(this._enqueueWatchResult.bind(this));
            callback(null);
        }.bind(this));
    };
    
    /**
     * Close a file system. Clear all caches, indexes, and file watchers.
     */
    FileSystem.prototype.close = function () {
        this._impl.unwatchAll();
        this._index.clear();
    };
    
    /**
     * Returns true if the given path should be automatically added to the index & watch list when one of its ancestors
     * is a watch-root. (Files are added automatically when the watch-root is first established, or later when a new
     * directory is created and its children enumerated).
     * 
     * Entries explicitly created via FileSystem.getFile/DirectoryForPath() are *always* added to the index regardless
     * of this filtering - but they will not be watched if the watch-root's filter excludes them.
     */
    FileSystem.prototype._indexFilter = function (path, name) {
        var parentRoot = this._findWatchedRootForPath(path);
                
        if (parentRoot) {
            return parentRoot.filter(name);
        }
        
        // It might seem more sensible to return false (exclude) for files outside the watch roots, but
        // that would break usage of appFileSystem for 'system'-level things like enumerating extensions.
        // (Or in general, Directory.getContents() for any Directory outside the watch roots).
        return true;
    };
    
    FileSystem.prototype._beginWrite = function () {
        this._writeCount++;
        //console.log("> beginWrite  -> " + this._writeCount);
    };
    
    FileSystem.prototype._endWrite = function () {
        this._writeCount--;
        //console.log("< endWrite    -> " + this._writeCount);
        
        if (this._writeCount < 0) {
            console.error("FileSystem _writeCount has fallen below zero!");
        }
        
        if (!this._writeCount) {
            this._triggerWatchCallbacksNow();
        }
    };
    
    /**
     * Determines whether or not the supplied path is absolute, as opposed to relative.
     *
     * @param {!string} fullPath
     * @return {boolean} True if the fullPath is absolute and false otherwise.
     */
    FileSystem.isAbsolutePath = function (fullPath) {
        return (fullPath[0] === "/" || fullPath[1] === ":");
    };
    
    /*
     * Matches continguous groups of forward slashes
     * @const
     */
    var _DUPLICATED_SLASH_RE = /\/{2,}/g;
    
    /**
     * Returns a canonical version of the path: no duplicated "/"es, no ".."s,
     * and directories guaranteed to end in a trailing "/"
     * @param {!string} path  Absolute path, using "/" as path separator
     * @param {boolean=} isDirectory
     * @return {!string}
     */
    FileSystem.prototype._normalizePath = function (path, isDirectory) {
        
        if (!FileSystem.isAbsolutePath(path)) {
            throw new Error("Paths must be absolute: '" + path + "'");  // expect only absolute paths
        }
        
        var isUNCPath = this._impl.normalizeUNCPaths && path.search(_DUPLICATED_SLASH_RE) === 0;
        
        // Remove duplicated "/"es
        path = path.replace(_DUPLICATED_SLASH_RE, "/");
        
        // Remove ".." segments
        if (path.indexOf("..") !== -1) {
            var segments = path.split("/"),
                i;
            for (i = 1; i < segments.length; i++) {
                if (segments[i] === "..") {
                    if (i < 2) {
                        throw new Error("Invalid absolute path: '" + path + "'");
                    }
                    segments.splice(i - 1, 2);
                    i -= 2; // compensate so we start on the right index next iteration
                }
            }
            path = segments.join("/");
        }
        
        if (isDirectory) {
            // Make sure path DOES include trailing slash
            if (path[path.length - 1] !== "/") {
                path += "/";
            }
        }
        
        if (isUNCPath) {
            // Restore the leading double slash that was removed previously
            path = "/" + path;
        }
        
        return path;
    };
    
    /**
     * Return a File object for the specified path.
     *
     * @param {string} path Absolute path of file. 
     *
     * @return {File} The File object. This file may not yet exist on disk.
     */
    FileSystem.prototype.getFileForPath = function (path) {
        path = this._normalizePath(path, false);
        var file = this._index.getEntry(path);
        
        if (!file) {
            file = new File(path, this);
            this._index.addEntry(file);
        }
                
        return file;
    };
     
    /**
     * Return a Directory object for the specified path.
     *
     * @param {string} path Absolute path of directory.
     *
     * @return {Directory} The Directory object. This directory may not yet exist on disk.
     */
    FileSystem.prototype.getDirectoryForPath = function (path) {
        path = this._normalizePath(path, true);
        var directory = this._index.getEntry(path);
        
        if (!directory) {
            directory = new Directory(path, this);
            this._index.addEntry(directory);
        }
        
        return directory;
    };
    
    /**
     * Resolve a path.
     *
     * @param {string} path The path to resolve
     * @param {function (?string, FileSystemEntry=, FileSystemStats=)} callback Callback resolved
     *      with a FileSystemError string or with the entry for the provided path.
     */
    FileSystem.prototype.resolve = function (path, callback) {
        // No need to normalize path here: assume underlying stat() does it internally,
        // and it will be normalized anyway when ingested by get*ForPath() afterward
        
        this._impl.stat(path, function (err, stat) {
            var item;
            
            if (!err) {
                if (stat.isFile) {
                    item = this.getFileForPath(path);
                } else {
                    item = this.getDirectoryForPath(path);
                }
            }
            callback(err, item, stat);
        }.bind(this));
    };
    
    /**
     * @private
     * Notify the system when an entry name has changed.
     *
     * @param {string} oldName 
     * @param {string} newName
     * @param {boolean} isDirectory
     */
    FileSystem.prototype._entryRenamed = function (oldName, newName, isDirectory) {
        // Update all affected entries in the index
        this._index.entryRenamed(oldName, newName, isDirectory);
        $(this).trigger("rename", [oldName, newName]);
    };
    
    /**
     * Show an "Open" dialog and return the file(s)/directories selected by the user.
     *
     * @param {boolean} allowMultipleSelection Allows selecting more than one file at a time
     * @param {boolean} chooseDirectories Allows directories to be opened
     * @param {string} title The title of the dialog
     * @param {string} initialPath The folder opened inside the window initially. If initialPath
     *                          is not set, or it doesn't exist, the window would show the last
     *                          browsed folder depending on the OS preferences
     * @param {Array.<string>} fileTypes List of extensions that are allowed to be opened. A null value
     *                          allows any extension to be selected.
     * @param {function (?string, Array.<string>=)} callback Callback resolved with a FileSystemError
     *                          string or the selected file(s)/directories. If the user cancels the
     *                          open dialog, the error will be falsy and the file/directory array will
     *                          be empty.
     */
    FileSystem.prototype.showOpenDialog = function (allowMultipleSelection,
                            chooseDirectories,
                            title,
                            initialPath,
                            fileTypes,
                            callback) {
        
        this._impl.showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback);
    };
    
    /**
     * Show a "Save" dialog and return the path of the file to save.
     *
     * @param {string} title The title of the dialog.
     * @param {string} initialPath The folder opened inside the window initially. If initialPath
     *                          is not set, or it doesn't exist, the window would show the last
     *                          browsed folder depending on the OS preferences.
     * @param {string} proposedNewFilename Provide a new file name for the user. This could be based on
     *                          on the current file name plus an additional suffix
     * @param {function (?string, string=)} callback Callback that is resolved with a FileSystemError
     *                          string or the name of the file to save. If the user cancels the save,
     *                          the error will be falsy and the name will be empty.
     */
    FileSystem.prototype.showSaveDialog = function (title, initialPath, proposedNewFilename, callback) {
        this._impl.showSaveDialog(title, initialPath, proposedNewFilename, callback);
    };
    
    /**
     * @private
     * Processes a result from the file/directory watchers. Watch results are sent from the low-level implementation
     * whenever a directory or file is changed. 
     *
     * @param {string} path The path that changed. This could be a file or a directory.
     * @param {FileSystemStats=} stat Optional stat for the item that changed. This param is not always
     *         passed. 
     */
    FileSystem.prototype._handleWatchResult = function (path, stat) {
        
        var fireChangeEvent = function (entry) {
            // Trigger a change event
            $(this).trigger("change", entry);
        }.bind(this);

        if (!path) {
            // This is a "wholesale" change event
            // Clear all caches (at least those that won't do a stat() double-check before getting used)
            this._index.visitAll(function (entry) {
                if (entry.isDirectory) {
                    entry._clearCachedData();
                }
            });
            
            fireChangeEvent(null);
            return;
        }
        
        path = this._normalizePath(path, false);
        var entry = this._index.getEntry(path);
        
        if (entry) {
            if (entry.isFile) {
                // Update stat and clear contents, but only if out of date
                if (!stat || !entry._stat || (stat.mtime.getTime() !== entry._stat.mtime.getTime())) {
                    entry._clearCachedData();
                    entry._stat = stat;
                }
                
                fireChangeEvent(entry);
            } else {
                var oldContents = entry._contents || [];
                
                // Clear out old contents
                entry._clearCachedData();
                entry._stat = stat;
                
                var watchedRoot = this._findWatchedRootForPath(entry.fullPath);
                if (!watchedRoot) {
                    console.warn("Received change notification for unwatched path: ", path);
                    return;
                }
                
                // Update changed entries
                entry.getContents(function (err, contents) {
                    
                    var addNewEntries = function (callback) {
                        // Check for added directories and scan to add to index
                        // Re-scan this directory to add any new contents
                        var entriesToAdd = contents.filter(function (entry) {
                            return oldContents.indexOf(entry) === -1;
                        });
                        
                        var addCounter = entriesToAdd.length;
                        
                        if (addCounter === 0) {
                            callback();
                        } else {
                            entriesToAdd.forEach(function (entry) {
                                this._watchEntry(entry, watchedRoot, function (err) {
                                    if (--addCounter === 0) {
                                        callback();
                                    }
                                });
                            }, this);
                        }
                    }.bind(this);
                    
                    var removeOldEntries = function (callback) {
                        var entriesToRemove = oldContents.filter(function (entry) {
                            return contents.indexOf(entry) === -1;
                        });
    
                        var removeCounter = entriesToRemove.length;
                        
                        if (removeCounter === 0) {
                            callback();
                        } else {
                            entriesToRemove.forEach(function (entry) {
                                this._unwatchEntry(entry, watchedRoot, function (err) {
                                    if (--removeCounter === 0) {
                                        callback();
                                    }
                                });
                            }, this);
                        }
                    }.bind(this);

                    if (err) {
                        console.warn("Unable to get contents of changed directory: ", path, err);
                    } else {
                        removeOldEntries(function () {
                            addNewEntries(function () {
                                fireChangeEvent(entry);
                            });
                        });
                    }

                }.bind(this));
            }
        }
    };
    
    /**
     * Start watching a filesystem root entry.
     * 
     * @param {FileSystemEntry} entry - The root entry to watch. If entry is a directory,
     *      all subdirectories that aren't explicitly filtered will also be watched.
     * @param {function(string): boolean} filter - A function to determine whether
     *      a particular name should be watched or ignored. Paths that are ignored are also
     *      filtered from Directory.getContents() results within this subtree.
     * @param {function(?string)=} callback - A function that is called when the watch has
     *      completed. If the watch fails, the function will have a non-null FileSystemError
     *      string parametr.
     */
    FileSystem.prototype.watch = function (entry, filter, callback) {
        var fullPath = entry.fullPath,
            watchedRoot = {
                entry: entry,
                filter: filter
            };
        
        callback = callback || function () {};
        
        var watchingParentRoot = this._findWatchedRootForPath(fullPath);
        if (watchingParentRoot) {
            callback("A parent of this root is already watched");
            return;
        }

        var watchingChildRoot = Object.keys(this._watchedRoots).some(function (path) {
            var watchedRoot = this._watchedRoots[path],
                watchedPath = watchedRoot.entry.fullPath;
            
            return watchedPath.indexOf(fullPath) === 0;
        }, this);
        
        if (watchingChildRoot) {
            callback("A child of this root is already watched");
            return;
        }
        
        this._watchedRoots[fullPath] = watchedRoot;
        
        this._watchEntry(entry, watchedRoot, function (err) {
            if (err) {
                console.warn("Failed to watch root: ", entry.fullPath, err);
                callback(err);
                return;
            }
            
            callback(null);
        }.bind(this));
    };

    /**
     * Stop watching a filesystem root entry.
     * 
     * @param {FileSystemEntry} entry - The root entry to stop watching. The unwatch will
     *      if the entry is not currently being watched.
     * @param {function(?string)=} callback - A function that is called when the unwatch has
     *      completed. If the unwatch fails, the function will have a non-null FileSystemError
     *      string parameter.
     */
    FileSystem.prototype.unwatch = function (entry, callback) {
        var fullPath = entry.fullPath,
            watchedRoot = this._watchedRoots[fullPath];
        
        callback = callback || function () {};
        
        if (!watchedRoot) {
            callback("Root is not watched.");
            return;
        }

        delete this._watchedRoots[fullPath];
        
        this._unwatchEntry(entry, watchedRoot, function (err) {
            if (err) {
                console.warn("Failed to unwatch root: ", entry.fullPath, err);
                callback(err);
                return;
            }
            
            callback(null);
        }.bind(this));
    };
    
    // The singleton instance
    var _instance;

    function _wrap(func) {
        return function () {
            return func.apply(_instance, arguments);
        };
    }
    
    // Export public methods as proxies to the singleton instance
    exports.init = _wrap(FileSystem.prototype.init);
    exports.close = _wrap(FileSystem.prototype.close);
    exports.shouldShow = _wrap(FileSystem.prototype.shouldShow);
    exports.getFileForPath = _wrap(FileSystem.prototype.getFileForPath);
    exports.getDirectoryForPath = _wrap(FileSystem.prototype.getDirectoryForPath);
    exports.resolve = _wrap(FileSystem.prototype.resolve);
    exports.showOpenDialog = _wrap(FileSystem.prototype.showOpenDialog);
    exports.showSaveDialog = _wrap(FileSystem.prototype.showSaveDialog);
    exports.watch = _wrap(FileSystem.prototype.watch);
    exports.unwatch = _wrap(FileSystem.prototype.unwatch);
    
    // Static public utility methods
    exports.isAbsolutePath = FileSystem.isAbsolutePath;
    
    // Export "on" and "off" methods
    
    /**
     * Add an event listener for a FileSystem event.
     *
     * @param {string} event The name of the event
     * @param {function} handler The handler for the event
     */
    exports.on = function (event, handler) {
        $(_instance).on(event, handler);
    };
    
    /**
     * Remove an event listener for a FileSystem event.
     *
     * @param {string} event The name of the event
     * @param {function} handler The handler for the event
     */
    exports.off = function (event, handler) {
        $(_instance).off(event, handler);
    };
    
    // Export the FileSystem class as "private" for unit testing only.
    exports._FileSystem = FileSystem;
    
    // Create the singleton instance
    _instance = new FileSystem();
    
    // Initialize the singleton instance
    _instance.init(require("fileSystemImpl"));
});
