/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global define */

/**
 * @deprecated
 * This is a compatibility shim for legacy Brackets APIs that will be removed soon.
 * Use APIs in the FileSystem module instead.
 */
define(function (require, exports, module) {
    "use strict";

    var FileSystem      = require("filesystem/FileSystem"),
        File            = require("filesystem/File"),
        Directory       = require("filesystem/Directory"),
        NativeFileError = require("file/NativeFileError");
    
    
    function _warn(oldAPI, newAPI) {
        console.error("Warning: '" + oldAPI + "' is deprecated. Use '" + newAPI + "' instead");
    }
    
    
    // Shims for static APIs on NativeFileSystem itself
    
    var NativeFileSystem = {
        /**
         * @deprecated
         * @param {boolean} allowMultipleSelection
         * @param {boolean} chooseDirectories
         * @param {string} title
         * @param {string} initialPath
         * @param {Array.<string>} fileTypes
         * @param {!function(Array.<string>)} successCallback
         * @param {!function(string)} errorCallback
         */
        showOpenDialog: function (allowMultipleSelection,
                                  chooseDirectories,
                                  title,
                                  initialPath,
                                  fileTypes,
                                  successCallback,
                                  errorCallback) {
            _warn("NativeFileSystem.showOpenDialog()", "FileSystem.showOpenDialog()");
            
            FileSystem.showOpenDialog(
                allowMultipleSelection,
                chooseDirectories,
                title,
                initialPath,
                fileTypes,
                function (err, data) {
                    if (!err) {
                        successCallback(data);
                    } else if (errorCallback) {
                        errorCallback(err);
                    }
                }
            );
        },

        /**
         * @deprecated
         * @param {string} title
         * @param {string} initialPath
         * @param {string} proposedNewFilename
         * @param {!function(string)} successCallback
         * @param {!function(string)} errorCallback
         */
        showSaveDialog: function (title,
                                    initialPath,
                                    proposedNewFilename,
                                    successCallback,
                                    errorCallback) {
            _warn("NativeFileSystem.showSaveDialog()", "FileSystem.showSaveDialog()");
            
            FileSystem.showSaveDialog(
                title,
                initialPath,
                proposedNewFilename,
                function (err, data) {
                    if (!err) {
                        successCallback(data);
                    } else if (errorCallback) {
                        errorCallback(err);
                    }
                }
            );
        },

        /**
         * @deprecated
         * @param {string} path
         * @param {!function(!{ root: !Directory })} successCallback
         * @param {!function(string)} errorCallback
         */
        requestNativeFileSystem: function (path, successCallback, errorCallback) {
            _warn("NativeFileSystem.requestNativeFileSystem()", "FileSystem.resolve()");
            
            FileSystem.resolve(path, function (err, entry) {
                if (err) {
                    errorCallback(err);
                } else {
                    var fakeNativeFileSystem = { root: entry };
                    successCallback(fakeNativeFileSystem);
                }
            });
        },
        
        /**
         * @deprecated
         * @param {string} path
         * @param {!function(!FileSystemEntry)} successCallback
         * @param {!function(string)} errorCallback
         */
        resolveNativeFileSystemPath: function (path, successCallback, errorCallback) {
            _warn("NativeFileSystem.resolveNativeFileSystemPath()", "FileSystem.resolve()");
            
            FileSystem.resolve(path, function (err, entry) {
                if (err) {
                    errorCallback(err);
                } else {
                    successCallback(entry);
                }
            });
        }
        
    };
    
    
    // Shims for constructors - return new File/Directory object instead
    
    /**
     * @deprecated
     * @param {string} fullPath
     * @return {!File}
     */
    NativeFileSystem.FileEntry = function (fullPath) {
        _warn("new NativeFileSystem.FileEntry()", "FileSystem.getFileForPath()");
        return FileSystem.getFileForPath(fullPath);
    };
    
    /**
     * @deprecated
     * @param {string} fullPath
     * @return {!Directory}
     */
    NativeFileSystem.DirectoryEntry = function (fullPath) {
        _warn("new NativeFileSystem.DirectoryEntry()", "FileSystem.getDirectoryForPath()");
        return FileSystem.getDirectoryForPath(fullPath);
    };
    
    
    // Shims for members of File/Directory - monkey-patch the prototype to make them available
    // without polluting the new filesystem code
    
    /**
     * @deprecated
     * @param {!function()} callback
     */
    File.prototype.createWriter = function (callback) {
        _warn("File.createWriter()", "File.write()");
        
        var file = this;
        
        // Return fake FileWriter object
        // (Unlike the original impl, we don't read the file's old contents first)
        callback({
            write: function (data) {
                var fileWriter = this;
                
                if (fileWriter.onwritestart) {
                    fileWriter.onwritestart();
                }
                
                file.write(data, function (err) {
                    if (err) {
                        if (fileWriter.onerror) {
                            fileWriter.onerror(err);
                        }
                    } else {
                        if (fileWriter.onwrite) {
                            fileWriter.onwrite();
                        }
                        if (fileWriter.onwriteend) {
                            fileWriter.onwriteend();
                        }
                    }
                });
            }
        });
    };
    
    /**
     * @deprecated
     * @return {!{readEntries: !function()}}
     */
    Directory.prototype.createReader = function () {
        _warn("Directory.createReader()", "Directory.getContents()");
        
        var dir = this;
        
        // Return fake DirectoryReader object
        return {
            readEntries: function (successCallback, errorCallback) {
                dir.getContents(function (err, entries) {
                    if (err) {
                        errorCallback(err);
                    } else {
                        successCallback(entries);
                    }
                });
            }
        };
    };
    
    /**
     * @deprecated
     * @param {string} path
     * @param {?Object} options
     * @param {!function(!FileSystemEntry)} successCallback
     * @param {!function(string)} errorCallback
     */
    Directory.prototype.getFile = function (path, options, successCallback, errorCallback) {
        if (options && options.create) {
            throw new Error("Directory.getFile() is deprecated and no longer supports 'create: true'. Use File.write(\"\") instead.");
        } else {
            _warn("Directory.getFile()", "FileSystem.resolve()");
        }
        
        // Is it a relative path?
        if (path[0] !== "/" && path[1] !== ":") {
            path = this.fullPath + path;
        }
        
        FileSystem.resolve(path, function (err, entry) {
            if (err) {
                errorCallback(err);
            } else {
                if (entry.isDirectory) {
                    errorCallback(NativeFileError.TYPE_MISMATCH_ERR);
                } else {
                    successCallback(entry);
                }
            }
        });
    };
    
    
    // Fail-fast stubs for key methods that are not shimmed -- callers will break but with clear guidance in the exception message
    
    /**
     * @deprecated
     */
    Directory.prototype.getDirectory = function () {
        throw new Error("Directory.getDirectory() has been removed. Use FileSystem.getDirectoryForPath() and/or Directory.create() instead.");
    };
    
    
    // Define public API
    exports.NativeFileSystem    = NativeFileSystem;
});
