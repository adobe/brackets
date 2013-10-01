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
        demoFileSystem      = require("filesystem/impls/demo/DemoFileSystem"),
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
    registerFileSystemImpl("hardcoded_demo", demoFileSystem);
    registerFileSystemImpl("dropbox", dropboxFileSystem);
    
    // Set default file system
    if (appshell.inBrowser) {
        setDefaultFileSystem("hardcoded_demo"); // this is ONLY used for the 'demo' project; extension loading etc. just use require() - so default can be the real server fs once it's working w/ a clean login workflow
        
        if (!appshell.fs) {
            appshell.fs = {};
        }
        // Copied from appshell_extensions.js -------------------------------------------------------------------------
        /**
         * @constant No error.
         */
        appshell.fs.NO_ERROR                    = 0;
        
        /**
         * @constant Unknown error occurred.
         */
        appshell.fs.ERR_UNKNOWN                 = 1;
        
        /**
         * @constant Invalid parameters passed to function.
         */
        appshell.fs.ERR_INVALID_PARAMS          = 2;
        
        /**
         * @constant File or directory was not found.
         */
        appshell.fs.ERR_NOT_FOUND               = 3;
        
        /**
         * @constant File or directory could not be read.
         */
        appshell.fs.ERR_CANT_READ               = 4;
        
        /**
         * @constant An unsupported encoding value was specified.
         */
        appshell.fs.ERR_UNSUPPORTED_ENCODING    = 5;
        
        /**
         * @constant File could not be written.
         */
        appshell.fs.ERR_CANT_WRITE              = 6;
        
        /**
         * @constant Target directory is out of space. File could not be written.
         */
        appshell.fs.ERR_OUT_OF_SPACE            = 7;
        
        /**
         * @constant Specified path does not point to a file.
         */
        appshell.fs.ERR_NOT_FILE                = 8;
        
        /**
         * @constant Specified path does not point to a directory.
         */
        appshell.fs.ERR_NOT_DIRECTORY           = 9;
     
        /**
         * @constant Specified file already exists.
         */
        appshell.fs.ERR_FILE_EXISTS             = 10;
    
        /**
         * @constant The required browser is not installed
         */
        appshell.fs.ERR_BROWSER_NOT_INSTALLED   = 11;
        // End --------------------------------------------------------------------------------------------------------
        
    } else {
        setDefaultFileSystem("appshell");
    }
    
    // Initialze the app file system. This is used to load application files like
    // extensions and config.json. (TODO: not really, require() owns that)
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
