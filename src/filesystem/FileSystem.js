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
    
    // FileSystemImpl 
    var _impl = require("filesystem/impls/AppshellFileSystem");  // Temp - force appshell impl for now
    
    function setFileSystemImpl(impl) {
        _impl = impl;
    }
    
    /**
     * Set the root directory for the project. This clears any existing file cache
     * and starts indexing on a new worker.
     *
     * @param {string} rootPath The new project root.
     */
    function setProjectRoot(rootPath) {
        FileIndex.setRoot(rootPath);
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
        
        if (directory._contents) {
            result.resolve(directory._contents);
            return;
        }
        
        _impl.readdir(directory.getPath(), function (err, contents, stats) {
            directory._contents = [];
            
            // Instantiate content objects
            for (i = 0; i < stats.length; i++) {
                entryPath = directory.getPath() + "/" + contents[i];
                
                if (stats[i].isFile()) {
                    entry = getFileForPath(entryPath);
                } else {
                    entry = getDirectoryForPath(entryPath);
                }
                
                directory._contents.push(entry);
            }
            
            result.resolve(directory._contents);
        }.bind(this));
        
        return result.promise();
    };
    
    /**
     * Show an "Open" dialog and return the file(s)/directories selected by the user.
     *
     * TODO: args. See NativeFileSystem.showOpenDialog for examples
     *
     * @return {$.Promise} Promise that will be resolved with the selected file(s)/directories, 
     *                     or rejected if an error occurred.
     */
    function showOpenDialog(options) {
        return _impl.showOpenDialog(options);
    }
    
    /**
     * Show a "Save" dialog and return the path of the file to save.
     *
     * TODO: args. See NativeFileSystem.showSaveDialog for examples
     *
     * @return {$.Promise} Promise that will be resolved with the name of the file to save,
     *                     or rejected if an error occurred.
     */
    function showSaveDialog(options) {
        return _impl.showSaveDialog(options);
    }
    
    // Export public API
    exports.setFileSystemImpl       = setFileSystemImpl;
    exports.setProjectRoot          = setProjectRoot;
    exports.getFileForPath          = getFileForPath;
    exports.newUnsavedFile          = newUnsavedFile;
    exports.getDirectoryForPath     = getDirectoryForPath;
    exports.getDirectoryContents    = getDirectoryContents;
    exports.showOpenDialog          = showOpenDialog;
    exports.showSaveDialog          = showSaveDialog;
});

