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

define(function (require, exports, module) {
    "use strict";
    
    var Directory       = require("filesystem/Directory"),
        File            = require("filesystem/File"),
        FileIndex       = require("filesystem/FileIndex");
    
    
    /**
     * Constructor. FileSystem objects should not be constructed directly.
     * Use FileSystemManager.createFileSystem() instead.
     * The FileSystem is not usable until init() signals its callback.
     * @param {!FileSystemImpl} impl Low-level file system implementation to use.
     */
    function FileSystem(impl, system) {
        this._impl = impl;
        this._system = system;
        
        // Create a file index
        this._index = new FileIndex();
        
        // Initialize the set of watched roots
        this._watchedRoots = {};
    }
    
    /**
     * The low-level file system implementation used by this object. 
     * This is set in the constructor and cannot be changed.
     */
    FileSystem.prototype._impl = null;
    
    /**
     * The name of the low-level file system implementation used by this object.
     * This is set in the constructor and cannot be changed.
     */
    FileSystem.prototype._system = null;
    
    /**
     * The FileIndex used by this object. This is initialized in the constructor.
     */
    FileSystem.prototype._index = null;

    /**
     * The set of watched roots, encoded as a mapping from full paths to objects
     * which contain a file entry, filter function, and change handler function.
     * 
     * @type{Object.<string, Object.<entry: FileSystemEntry,
     *      filter: function(entry): boolean,
     *      handleChange: function(entry)>>}
     */
    FileSystem.prototype._watchedRoots = null;
    
    /**
     * Watch a filesystem entry beneath a given watchedRoot.
     * 
     * @param {FileSystemEntry} entry - The FileSystemEntry to watch. Must be a
     *      non-strict descendent of watchedRoot.entry.
     * @param {Object} watchedRoot - See FileSystem._watchedRoots.
     * @param {function(?string)} callback - A function that is called once the
     *      watch is complete.
     */
    FileSystem.prototype._watchEntry = function (entry, watchedRoot, callback) {
        entry.visit(function (child) {
            if (child.isDirectory() || child === watchedRoot.entry) {
                this._impl.watchPath(child.fullPath);
            }
            
            return watchedRoot.filter(child);
        }.bind(this), callback);
    };

    /**
     * Unwatch a filesystem entry beneath a given watchedRoot.
     * 
     * @param {FileSystemEntry} entry - The FileSystemEntry to watch. Must be a
     *      non-strict descendent of watchedRoot.entry.
     * @param {Object} watchedRoot - See FileSystem._watchedRoots.
     * @param {function(?string)} callback - A function that is called once the
     *      watch is complete.
     */
    FileSystem.prototype._unwatchEntry = function (entry, watchedRoot, callback) {
        entry.visit(function (child) {
            if (child.isDirectory() || child === watchedRoot.entry) {
                this._impl.unwatchPath(child.fullPath);
            }
            this._index.removeEntry(child);
            
            return watchedRoot.filter(child);
        }.bind(this), callback);
    };
    
    /**
     * @param {function(?err)} callback
     */
    FileSystem.prototype.init = function (callback) {
        this._impl.init(callback);

        // Initialize watchers
        this._impl.initWatchers(this._watcherCallback.bind(this));
    };

    /**
     * The name of the low-level file system implementation used by this object.
     */
    FileSystem.prototype.getSystemName = function () {
        return this._system;
    };
    
    /**
     * Close a file system. Clear all caches, indexes, and file watchers.
     */
    FileSystem.prototype.close = function () {
        this._impl.unwatchAll();
        this._index.clear();
    };
    
    /**
     * Returns false for files and directories that are not commonly useful to display.
     *
     * @param {string} path File or directory to filter
     * @return boolean true if the file should be displayed
     */
    var _exclusionListRegEx = /\.pyc$|^\.git$|^\.gitignore$|^\.gitmodules$|^\.svn$|^\.DS_Store$|^Thumbs\.db$|^\.hg$|^CVS$|^\.cvsignore$|^\.gitattributes$|^\.hgtags$|^\.hgignore$/;
    FileSystem.prototype.shouldShow = function (path) {
        var name = path.substr(path.lastIndexOf("/") + 1);
        
        return !name.match(_exclusionListRegEx);
    };
    
    /**
     * Returns a canonical version of the path, with no duplicated /es and with
     * directories guaranteed to end in a trailing /.
     * @param {!string} path
     * @param {boolean=} isDirectory
     * @return {!string}
     */
    function _normalizePath(path, isDirectory) {
        var segments = path.split("/");
        if (segments.indexOf(".") !== -1 || segments.indexOf("..") !== -1) {
            console.error("Warning: non-normalized path " + path);
        }
        
        if (isDirectory) {
            // Make sure path DOES include trailing slash
            if (path[path.length - 1] !== "/") {
                path += "/";
            }
        }
        
        // Remove duplicated "/"es
        path = path.replace(/\/{2,}/, "/");
        
        // TODO: normalize out ".."s ?
        return path;
    }
    
    /**
     * Return a File object for the specified path.
     *
     * @param {string} path Path of file. 
     *
     * @return {File} The File object. This file may not yet exist on disk.
     */
    FileSystem.prototype.getFileForPath = function (path) {
        path = _normalizePath(path, false);
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
     * @param {string} path Path of directory. Pass NULL to get the root directory.
     *
     * @return {Directory} The Directory object. This directory may not yet exist on disk.
     */
    FileSystem.prototype.getDirectoryForPath = function (path) {
        path = _normalizePath(path, true);
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
     * @param {function (err, object)} callback
     */
    FileSystem.prototype.resolve = function (path, callback) {
        // No need to normalize path here: assume underlying stat() does it internally,
        // and it will be normalized anyway when ingested by get*ForPath() afterward
        
        this._impl.stat(path, function (err, stat) {
            var item;
            
            if (!err) {
                if (stat.isFile()) {
                    item = this.getFileForPath(path);
                } else {
                    item = this.getDirectoryForPath(path);
                }
            }
            callback(err, item);
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
        console.log("rename: ", oldName, newName);
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
     * @param {function (number, array)} callback Callback resolved with the selected file(s)/directories.
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
     * @param {function (number, string)} callback Callback that is called with the name of the file to save.
     */
    FileSystem.prototype.showSaveDialog = function (title, initialPath, proposedNewFilename, callback) {
        this._impl.showSaveDialog(title, initialPath, proposedNewFilename, callback);
    };
    
    /**
     * @private
     * Callback for file/directory watchers. This is called by the low-level implementation
     * whenever a directory or file is changed. 
     *
     * @param {string} path The path that changed. This could be a file or a directory.
     * @param {stat=} stat Optional stat for the item that changed. This param is not always
     *         passed. 
     */
    FileSystem.prototype._watcherCallback = function (path, stat) {
        if (!this._index) {
            return;
        }

        var entry = this._index.getEntry(path);
        
        var fireChangeEvent = function () {
            // Trigger a change event
            $(this).trigger("change", entry);
            console.log("change: ", entry);
        }.bind(this);

        if (entry) {
            if (entry.isFile()) {
                // Update stat and clear contents, but only if out of date
                if (!stat || !entry._stat || (stat.mtime !== entry._stat.mtime)) {
                    entry._stat = stat;
                    entry._contents = undefined;
                }
                
                fireChangeEvent();
            } else {
                var oldContents = entry._contents || [];  // TODO: Handle pending content promise
                
                // Clear out old contents
                entry._contents = undefined;
                
                var watchedRootPath = null,
                    allWatchedRootPaths = Object.keys(this._watchedRoots),
                    isRootWatched = allWatchedRootPaths.some(function (rootPath) {
                        if (entry.fullPath.indexOf(rootPath) === 0) {
                            watchedRootPath = rootPath;
                            return true;
                        }
                    }),
                    watchedRoot = isRootWatched ? this._watchedRoots[watchedRootPath] : null;
                
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
                            addNewEntries(fireChangeEvent);
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
     * @param {function(FileSystemEntry): boolean} filter - A function to determine whether
     *      a particular FileSystemEntry should be watched or ignored. 
     * @param {function(FileSystemEntry)} handleChange - A function that is called whenever
     *      a particular FileSystemEntry is changed.
     * @param {function(?string)} callback - A function that is called when the watch has
     *      completed. If the watch fails, the function will have a non-null parameter
     *      that describes the error.
     */
    FileSystem.prototype.watch = function (entry, filter, handleChange, callback) {
        var fullPath = entry.fullPath,
            watchedRoot = {
                entry: entry,
                filter: filter,
                handleChange: handleChange
            };
        
        var watchingParentRoot = Object.keys(this._watchedRoots).some(function (path) {
            var watchedRoot = this._watchedRoots[path],
                watchedPath = watchedRoot.entry.fullPath;
            
            return fullPath.indexOf(watchedPath) === 0;
        }, this);
        
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
        
        this._watchEntry(entry, watchedRoot, function (err) {
            if (err) {
                console.warn("Failed to watch root: ", entry.fullPath, err);
                // Try to clean up after failing to watch
                this._unwatchEntry(entry, watchedRoot, function () {
                    console.log("Finished cleaning up after failed watch.");
                    callback(err);
                });
                return;
            }
        
            this._watchedRoots[fullPath] = watchedRoot;
            callback(null);
        }.bind(this));
    };

    /**
     * Stop watching a filesystem root entry.
     * 
     * @param {FileSystemEntry} entry - The root entry to stop watching. The unwatch will
     *      if the entry is not currently being watched.
     * @param {function(?string)} callback - A function that is called when the unwatch has
     *      completed. If the unwatch fails, the function will have a non-null parameter
     *      that describes the error.
     */
    FileSystem.prototype.unwatch = function (entry, callback) {
        var fullPath = entry.fullPath,
            watchedRoot = this._watchedRoots[fullPath];
        
        if (!watchedRoot) {
            callback("Root is not watched.");
            return;
        }
        
        this._unwatchEntry(entry, watchedRoot, function (err) {
            delete this._watchedRoots[fullPath];

            if (err) {
                console.warn("Failed to unwatch root: ", entry.fullPath, err);
                callback(err);
                return;
            }
            
            callback(null);
        }.bind(this));
    };
    
    // Export the FileSystem class
    module.exports = FileSystem;
});
