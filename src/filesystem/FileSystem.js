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
    
    var FileIndex       = require("file/FileIndex");
    
    // FileSystemImpl 
    var _impl;
    
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
     * TODO: @param options. At least create. Probably permissions. Possibly others.
     *
     * @return {$.Promise} Promise that will be resolved with the File object, 
     *                     or rejected if an error occurred.
     */
    function getFileForPath(path, options) {
        var cachedEntry = FileIndex.getEntryForPath(path);
        
        if (cachedEntry) {
            return new $.Deferred().resolve(cachedEntry).promise();
        }
        
        return _impl.getFileForPath(path, options);
    }
     
    /**
     * Return an File object that does *not* exist on disk. Any attempts to write to this
     * file will result in a Save As dialog.
     *
     * TODO: @param options. Mode? Others?
     *
     * @return {$.Promise} Promise that will be resolved with the File object, 
     *                     or rejected if an error occurred.
     */
    function newUnsavedFile(options) {
        return _impl.newUnsavedFile(options);
    }
    
    /**
     * Return a Directory object for the specified path.
     *
     * @param {string} path Path of directory. Pass NULL to get the root directory.
     * TODO: @param options. At least create. Probably permissions. Possibly others.
     *
     * @return {$.Promise} Promise that will be resolved with the Directory object, 
     *                     or rejected if an error occurred.
     */
    function getDirectoryForPath(path, options) {
        var cachedEntry = FileIndex.getEntryForPath(path);
        
        if (cachedEntry) {
            return new $.Deferred().resolve(cachedEntry).promise();
        }

        return _impl.getDirectoryForPath(path, options);
    }
    
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
});

