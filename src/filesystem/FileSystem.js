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
    
    var appshellFileSystem  = require("filesystem/impls/AppshellFileSystem"),
        dropboxFileSystem   = require("filesystem/impls/DropboxFileSystem");
    
    // FileSystemImpl 
    var _impl;
    
    /**
     * Set the low-level implementation for file i/o
     *
     * @param {FileSystemImpl} impl File system implementation
     */
    function setFileSystemImpl(impl) {
        _impl = impl;
        _impl.init();
        
        FileIndex.clear();
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
            return;
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
     * Return all indexed files
     *
     * @return {Array<File>} Array containing all indexed files.
     */
    function getFileList() {
        return FileIndex.getAllFiles();
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
    }
    
    /**
     * Set the root directory for the project. This clears any existing file cache
     * and starts indexing on a new worker.
     *
     * @param {string} rootPath The new project root.
     */
    function setProjectRoot(rootPath) {
        if (rootPath && rootPath.length > 1) {
            if (rootPath[rootPath.length - 1] === "/") {
                rootPath = rootPath.substr(0, rootPath.length - 1);
            }
        }
        
        // Clear file index
        FileIndex.clear();
        
        // Start indexing from the new root path
        _scanDirectory(rootPath);
    }
    
    // Set initial file system
    setFileSystemImpl(appshellFileSystem);
    
    // Export public API
    exports.setFileSystemImpl       = setFileSystemImpl;
    exports.shouldShow              = shouldShow;
    exports.getFileForPath          = getFileForPath;
    exports.newUnsavedFile          = newUnsavedFile;
    exports.getDirectoryForPath     = getDirectoryForPath;
    exports.getDirectoryContents    = getDirectoryContents;
    exports.getFileList             = getFileList;
    exports.showOpenDialog          = showOpenDialog;
    exports.showSaveDialog          = showSaveDialog;
    exports.setProjectRoot          = setProjectRoot;
});

