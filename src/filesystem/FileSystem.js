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
    
    var appshellFileSystem  = require("filesystem/impls/appshell/AppshellFileSystem"),
        dropboxFileSystem   = require("filesystem/impls/dropbox/DropboxFileSystem");
    
    // FileSystemImpl 
    var _impl;
    
    /**
     * Set the low-level implementation for file i/o
     *
     * @param {FileSystemImpl} impl File system implementation
     */
    function setFileSystemImpl(impl) {
        // Clear old watchers
        if (_impl) {
            _impl.unwatchAll();
        }
        
        _impl = impl;
        _impl.init();
        
        FileIndex.clear();
    }
    
    /**
     * Set the file system to use.
     * @param {string} system The system to use. Supported values are "dropbox" and "appshell".
     */
    function setFileSystem(system) {
        // TODO: Allow extensions to add new file systems.
        if (system === "dropbox") {
            setFileSystemImpl(dropboxFileSystem);
        } else {
            setFileSystemImpl(appshellFileSystem);
        }
    }
    
    /**
     * Returns false for files and directories that are not commonly useful to display.
     *
     * @param {string} path File or directory to filter
     * @return boolean true if the file should be displayed
     */
    var _exclusionListRegEx = /\.pyc$|^\.git$|^\.gitignore$|^\.gitmodules$|^\.svn$|^\.DS_Store$|^Thumbs\.db$|^\.hg$|^CVS$|^\.cvsignore$|^\.gitattributes$|^\.hgtags$|^\.hgignore$/;
    function shouldShow(path) {
        var name = path.substr(path.lastIndexOf("/") + 1);
        
        return !name.match(_exclusionListRegEx);
    }
    
    /**
     * Return a File object for the specified path.
     *
     * @param {string} path Path of file. 
     *
     * @return {File} The File object. This file may not yet exist on disk.
     */
    function getFileForPath(path) {
        var file = FileIndex.getEntry(path);
        
        if (!file) {
            file = new File(path, _impl);
            FileIndex.addEntry(file);
        }
                
        return file;
    }
     
    /**
     * Return an File object that does *not* exist on disk. Any attempts to write to this
     * file will result in a Save As dialog.
     *
     * @return {File} The File object.
     */
    function newUnsavedFile(options) {
        // TODO: Implement me
        
        // return _impl.newUnsavedFile(options);
    }
    
    /**
     * Return a Directory object for the specified path.
     *
     * @param {string} path Path of directory. Pass NULL to get the root directory.
     *
     * @return {Directory} The Directory object. This directory may not yet exist on disk.
     */
    function getDirectoryForPath(path) {
        var directory = FileIndex.getEntry(path);
        
        if (!directory) {
            directory = new Directory(path, _impl);
            FileIndex.addEntry(directory);
        }
        
        return directory;
    }
    
    /**
     * Check if the specified path exists.
     *
     * @param {string} path The path to test
     * @return {$.Promise} Promise that is resolved if the path exists, or rejected if it doesn't.
     */
    function pathExists(path) {
        var result = new $.Deferred();
        
        if (_impl) {
            _impl.exists(path, function (exists) {
                if (exists) {
                    result.resolve();
                } else {
                    result.reject();
                }
            });
        } else {
            // No impl...
            result.reject(); /* TODO: not found error*/
        }
        
        return result.promise();
    }
    
    /**
     * Read the contents of a Directory. 
     *
     * @param {Directory} directory Directory whose contents you want to get
     *
     * @return {$.Promise} Promise that is resolved with the contents of the directory.
     *         Contents is an Array of File and Directory objects.
     */
    function getDirectoryContents(directory) {
        var i, entryPath, entry, result = new $.Deferred();
        
        if (directory._contentsPromise) {
            // Existing promise for this directory's contents. Return it.
            return directory._contentsPromise;
        }
        
        if (directory._contents) {
            // Return cached directory contents
            result.resolve(directory._contents);
            return result.promise();
        }
        
        _impl.readdir(directory.getPath(), function (err, contents, stats) {
            directory._contents = [];
            
            // Instantiate content objects
            for (i = 0; i < stats.length; i++) {
                entryPath = directory.getPath() + "/" + contents[i];
                
                if (shouldShow(entryPath)) {
                    if (stats[i].isFile()) {
                        entry = getFileForPath(entryPath);
                    } else {
                        entry = getDirectoryForPath(entryPath);
                    }
                    
                    directory._contents.push(entry);
                }
            }
            
            directory._contentsPromise = null;
            result.resolve(directory._contents);
        });
        
        directory._contentsPromise = result.promise();
        
        return result.promise();
    }
    
    /**
     * Return all indexed files, with optional filtering
     *
     * @param {=function (entry):boolean} filterFunc Optional filter function. If supplied,
     *         this function is called for all entries. Return true to keep this entry,
     *         or false to omit it.
     *
     * @return {Array<File>} Array containing all indexed files.
     */
    function getFileList(filterFunc) {
        var result = FileIndex.getAllFiles();
        
        if (filterFunc) {
            return result.filter(filterFunc);
        }
        
        return result;
    }
    
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
     *
     * @return {$.Promise} Promise that will be resolved with the selected file(s)/directories, 
     *                     or rejected if an error occurred.
     */
    function showOpenDialog(allowMultipleSelection,
                            chooseDirectories,
                            title,
                            initialPath,
                            fileTypes) {
        
        var result = new $.Deferred();
        
        _impl.showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, function (err, data) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve(data);
            }
        });
        
        return result.promise();
    }
    
    /**
     * Show a "Save" dialog and return the path of the file to save.
     *
     * @param {string} title The title of the dialog.
     * @param {string} initialPath The folder opened inside the window initially. If initialPath
     *                          is not set, or it doesn't exist, the window would show the last
     *                          browsed folder depending on the OS preferences.
     * @param {string} proposedNewFilename Provide a new file name for the user. This could be based on
     *                          on the current file name plus an additional suffix
     *
     * @return {$.Promise} Promise that will be resolved with the name of the file to save,
     *                     or rejected if an error occurred.
     */
    function showSaveDialog(title, initialPath, proposedNewFilename) {
        var result = new $.Deferred();
        
        _impl.showSaveDialog(title, initialPath, proposedNewFilename, function (err, selection) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve(selection);
            }
        });
        
        return result.promise();
    }
    
    /**
     * @private
     * Recursively scan and index all entries in a directory
     */
    function _scanDirectory(directoryPath) {
        var directory = getDirectoryForPath(directoryPath);
        
        getDirectoryContents(directory).done(function (entries) {
            var i;
            
            for (i = 0; i < entries.length; i++) {
                if (entries[i].isDirectory()) {
                    _scanDirectory(entries[i].getPath());
                }
            }
        });
        _impl.watchPath(directoryPath);
    }
    
    /**
     * @private
     * Callback for file/directory watchers. This is called by the low-level implementation
     * whenever a directory or file is changed. 
     *
     * @param {string} path The path that changed. This could be a file or a directory.
     * @param {stat=} stat Optional stat for the item that changed. This param is not always
     *         passed. 
     */
    function _watcherCallback(path, stat) {
        var entry = FileIndex.getEntry(path);
        
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
                entry._contents = entry._contentsPromise = undefined;
                
                // Read new contents
                getDirectoryContents(entry)
                    .done(function (contents) {
                        var i, len, item, path;
                        
                        function _isInPath(item) {
                            return item.getPath().indexOf(path) === 0;
                        }
                        
                        // Check for deleted entries 
                        len = oldContents ? oldContents.length : 0;
                        for (i = 0; i < len; i++) {
                            item = oldContents[i];
                            if (contents.indexOf(item) === -1) {
                                if (item.isFile()) {
                                    // File removed, just remove from index.
                                    FileIndex.removeEntry(item);
                                } else {
                                    // Remove the directory and all entries under it
                                    path = item.getPath();
                                    var j, itemsToDelete = getFileList(_isInPath);
                                    
                                    for (j = 0; j < itemsToDelete.length; j++) {
                                        FileIndex.removeEntry(itemsToDelete[j]);
                                    }
                                    
                                    FileIndex.removeEntry(item);
                                    _impl.unwatchPath(item.getPath());
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
                                    _scanDirectory(item.getPath());
                                }
                            }
                        }
                    });
            }
            
            // Trigger a change event
            $(exports).trigger("change", entry);
        }
        // console.log("File/directory change: " + path + ", stat: " + stat);
    }
    
    /**
     * Set the root directory for the project. This clears any existing file cache
     * and starts indexing on a new worker.
     *
     * @param {string} rootPath The new project root.
     */
    function setProjectRoot(rootPath) {
        // !!HACK FOR DEMO - if rootPath === "/Stuff", switch to the dropbox file system
        if (rootPath === "/Stuff") {
            setFileSystem("dropbox");
        } else {
            setFileSystem("appshell");
        }
        
        if (rootPath && rootPath.length > 1) {
            if (rootPath[rootPath.length - 1] === "/") {
                rootPath = rootPath.substr(0, rootPath.length - 1);
            }
        }
        
        // Clear file index
        FileIndex.clear();
        
        // Initialize watchers
        _impl.unwatchAll();
        _impl.initWatchers(_watcherCallback);
        
        // Start indexing from the new root path
        _scanDirectory(rootPath);
    }
    
    // Set initial file system
    setFileSystem("appshell");
    
    // Export public API
    exports.setFileSystemImpl       = setFileSystemImpl;
    exports.shouldShow              = shouldShow;
    exports.getFileForPath          = getFileForPath;
    exports.newUnsavedFile          = newUnsavedFile;
    exports.getDirectoryForPath     = getDirectoryForPath;
    exports.pathExists              = pathExists;
    exports.getDirectoryContents    = getDirectoryContents;
    exports.getFileList             = getFileList;
    exports.showOpenDialog          = showOpenDialog;
    exports.showSaveDialog          = showSaveDialog;
    exports.setProjectRoot          = setProjectRoot;
});

