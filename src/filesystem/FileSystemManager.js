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
/*global define, $, appshell */

define(function (require, exports, module) {
    "use strict";
    
    var FileSystem          = require("filesystem/FileSystem");
    
    // File system impls. These should be mixed in instead of being hard-coded here.
    var appshellFileSystem  = require("filesystem/impls/appshell/AppshellFileSystem"),
        dropboxFileSystem   = require("filesystem/impls/dropbox/DropboxFileSystem");
    
    var _defaultFileSystem,
        _impls = {};    // File system implementations. Key is the string name, value is the _impl obj

    /**
     * Register a file system implementation
     * @param {string} name Name of the implementation
     * @param {object} impl File system implementation. Must implement the methods 
     *          described in FileSystemImpl. 
     */
    function registerFileSystemImpl(name, impl) {
        _impls[name] = impl;
    }
    
    /**
     * Sets the default file system implementation to use.
     * @param {!string} system The name of the default file system implementation. This
     *          system must be registered by calling registerFileSystemImpl
     */
    function setDefaultFileSystem(system) {
        _defaultFileSystem = system;
    }
    
    /**
     * Create a new FileSystem object. This should only be done by the application (to create
     * the global brackets.fileSystem) or the ProjectManager (to create the file system for a
     * project).
     *
     * @param {string=} system The name of the low-level file system implementation. If omitted,
     *                      the default system is used.
     * @return {FileSystem} A FileSystem object.
     */
    function createFileSystem(system) {
        var impl = _impls[system || _defaultFileSystem];
        
        console.assert(impl, "File System implementation not found: " + (system || _defaultFileSystem));
        
        return new FileSystem(impl, system);
    }
    
    // TODO: Registration and assigning default should be done in brackets.js or globals.js
    
    // Register built-in file systems
    registerFileSystemImpl("appshell", appshellFileSystem);
    registerFileSystemImpl("dropbox", dropboxFileSystem);
    
    // Set default file system
    setDefaultFileSystem("appshell");
    
    // Initialze the app file system. This is used to load application files like
    // extensions and config.json.
    // This file system is created with the "default" file system implementation,
    // which is different when running in the shell and in browsers.
    if (!appshell.appFileSystem) {
        appshell.appFileSystem = createFileSystem();
    }
    
    // Export public API
    exports.registerFileSystemImpl  = registerFileSystemImpl;
    exports.setDefaultFileSystem    = setDefaultFileSystem;
    exports.createFileSystem        = createFileSystem;
});
