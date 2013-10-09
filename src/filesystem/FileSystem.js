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
        FileIndex       = require("filesystem/FileIndex"),
        InMemoryFile    = require("filesystem/InMemoryFile");
    
    
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
     * @param {function(?err)} callback
     */
    FileSystem.prototype.init = function (callback) {
        this._impl.init(callback);
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
     * Return a File object for the specified path.
     *
     * @param {string} path Path of file. 
     *
     * @return {File} The File object. This file may not yet exist on disk.
     */
    FileSystem.prototype.getFileForPath = function (path) {
        var file = this._index.getEntry(path);
        
        if (!file) {
            file = new File(path, this);
            this._index.addEntry(file);
        }
                
        return file;
    };
     
    /**
     * Return an File object that does *not* exist on disk. Any attempts to write to this
     * file will result in a Save As dialog. Any attempt to read will fail.
     *
     * @return {File} The File object.
     */
    FileSystem.prototype.getInMemoryFile = function (path) {
        var file = new InMemoryFile(path, this);
        
        // TODO: Add to index?
        
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
        // Make sure path doesn't include trailing slash
        if (path[path.length - 1] === "/") {
            path = path.substr(0, path.length - 1);
        }
        
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
     * Return all indexed files, with optional filtering
     *
     * @param {=function (entry):boolean} filterFunc Optional filter function. If supplied,
     *         this function is called for all entries. Return true to keep this entry,
     *         or false to omit it.
     *
     * @return {Array<File>} Array containing all indexed files.
     */
    FileSystem.prototype.getFileList = function (filterFunc) {
        var result = this._index.getAllFiles();
        
        if (filterFunc) {
            return result.filter(filterFunc);
        }
        
        return result;
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
     * Recursively scan and index all entries in a directory
     */
    FileSystem.prototype._scanDirectory = function (directoryPath) {
        var directory = this.getDirectoryForPath(directoryPath);
        
        directory.getContents(function (err, entries) {
            if (!err) {
                var i;
                
                for (i = 0; i < entries.length; i++) {
                    if (entries[i].isDirectory()) {
                        this._scanDirectory(entries[i].fullPath);
                    }
                }
            }
        }.bind(this));
        this._impl.watchPath(directoryPath);
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
        
        if (entry) {
            if (entry.isFile()) {
                // Update stat and clear contents, but only if out of date
                if (!stat || !entry._stat || (stat.mtime !== entry._stat.mtime)) {
                    entry._stat = stat;
                    entry._contents = undefined;
                }
            } else {
                var oldContents = entry._contents;  // TODO: Handle pending content promise
                
                // Clear out old contents
                entry._contents = undefined;
                
                // Read new contents
                entry.getContents(function (err, contents) {
                    if (!err) {
                        var i, len, item, path;
                        
                        var _isInPath = function (item) {
                            return item.fullPath.indexOf(path) === 0;
                        };
                        
                        // Check for deleted entries 
                        len = oldContents ? oldContents.length : 0;
                        for (i = 0; i < len; i++) {
                            item = oldContents[i];
                            if (contents.indexOf(item) === -1) {
                                if (item.isFile()) {
                                    // File removed, just remove from index.
                                    this._index.removeEntry(item);
                                } else {
                                    // Remove the directory and all entries under it
                                    path = item.fullPath;
                                    var j, itemsToDelete = this.getFileList(_isInPath);
                                    
                                    for (j = 0; j < itemsToDelete.length; j++) {
                                        this._index.removeEntry(itemsToDelete[j]);
                                    }
                                    
                                    this._index.removeEntry(item);
                                    this._impl.unwatchPath(item.fullPath);
                                    // TODO: Remove and unwatch other directories contained within this directory.
                                    // getFileList() only returns files, and ignores directories.
                                }
                            }
                        }
                        
                        // Check for added directories and scan to add to index
                        // Re-scan this directory to add any new contents
                        len = contents ? contents.length : 0;
                        for (i = 0; i < len; i++) {
                            item = contents[i];
                            if (!oldContents || oldContents.indexOf(item) === -1) {
                                if (item.isDirectory()) {
                                    this._scanDirectory(item.fullPath);
                                }
                            }
                        }
                    }
                }.bind(this));
            }
            
            // Trigger a change event
            $(this).trigger("change", entry);
        }
        // console.log("File/directory change: " + path + ", stat: " + stat);
    };
    
    /**
     * Set the root directory for the project. This clears any existing file cache
     * and starts indexing on a new worker.
     *
     * @param {string} rootPath The new project root.
     */
    FileSystem.prototype.setProjectRoot = function (rootPath) {
        
        // Remove trailing "/" from path
        if (rootPath && rootPath.length > 1) {
            if (rootPath[rootPath.length - 1] === "/") {
                rootPath = rootPath.substr(0, rootPath.length - 1);
            }
        }
        
        // Clear file index
        this._index.clear();
        
        // Initialize watchers
        this._impl.unwatchAll();
        this._impl.initWatchers(this._watcherCallback.bind(this));
        
        // Start indexing from the new root path
        this._scanDirectory(rootPath);
    };
    
    // Export the FileSystem class
    module.exports = FileSystem;
});
