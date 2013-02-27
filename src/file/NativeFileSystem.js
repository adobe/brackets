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
/*global $, define, brackets, InvalidateStateError, window */

/**
 * Generally NativeFileSystem mimics the File-System API working draft:
 *  http://www.w3.org/TR/2011/WD-file-system-api-20110419
 *
 * A more recent version of the specs can be found at:
 *  http://www.w3.org/TR/2012/WD-file-system-api-20120417
 *
 * Other relevant w3 specs related to this API are:
 *  http://www.w3.org/TR/2011/WD-FileAPI-20111020
 *  http://www.w3.org/TR/2011/WD-file-writer-api-20110419
 *  http://www.w3.org/TR/progress-events
 *
 * The w3 entry point requestFileSystem is replaced with our own requestNativeFileSystem.
 *
 * The current implementation is incomplete and notably does not
 * support the Blob data type and synchronous APIs. DirectoryEntry
 * and FileEntry read/write capabilities are mostly implemented, but
 * delete is not. File writing is limited to UTF-8 text.
 *
 *
 * Basic usage examples:
 *
 *  - CREATE A DIRECTORY
 *      var directoryEntry = ... // NativeFileSystem.DirectoryEntry
 *      directoryEntry.getDirectory(path, {create: true});
 *
 *
 *  - CHECK IF A FILE OR FOLDER EXISTS
 *      NativeFileSystem.resolveNativeFileSystemPath(path 
 *                                  , function(entry) { console.log("Path for " + entry.name + " resolved"); }
 *                                  , function(err) { console.log("Error resolving path: " + err.name); });
 *
 *
 *  - READ A FILE
 *
 *      (Using file/NativeFileSystem)
 *          reader = new NativeFileSystem.FileReader();
 *          fileEntry.file(function (file) {
 *              reader.onload = function (event) {
 *                  var text = event.target.result;
 *              };
 *              
 *              reader.onerror = function (event) {
 *              };
 *              
 *              reader.readAsText(file, Encodings.UTF8);
 *          });
 *
 *      (Using file/FileUtils)
 *          FileUtils.readAsText(fileEntry).done(function (rawText, readTimestamp) {
 *              console.log(rawText);
 *          }).fail(function (err) {
 *              console.log("Error reading text: " + err.name);
 *          });
 *
 *
 *  - WRITE TO A FILE 
 *
 *      (Using file/NativeFileSystem)
 *          writer = fileEntry.createWriter(function (fileWriter) {
 *              fileWriter.onwriteend = function (e) {
 *              };
 *              
 *              fileWriter.onerror = function (err) {
 *              };
 *              
 *              fileWriter.write(text);
 *          });
 *
 *      (Using file/FileUtils)
 *          FileUtils.writeText(text, fileEntry).done(function () {
 *              console.log("Text successfully updated");
 *          }).fail(function (err) {
 *              console.log("Error writing text: " + err.name);
 *          ]);
 *
 *
 *  - PROMPT THE USER TO SELECT FILES OR FOLDERS WITH OPERATING SYSTEM'S FILE OPEN DIALOG
 *      NativeFileSystem.showOpenDialog(true, true, "Choose a file...", null, function(files) {}, function(err) {});
 */

define(function (require, exports, module) {
    "use strict";

    var Async           = require("utils/Async"),
        NativeFileError = require("file/NativeFileError");
    
    var NativeFileSystem = {
        
        /** 
         * Amount of time we wait for async calls to return (in milliseconds)
         * Not all async calls are wrapped with something that times out and 
         * calls the error callback. Timeouts are not specified in the W3C spec.
         * @const
         * @type {number}
         */
        ASYNC_TIMEOUT: 2000,
        
        /**
         * Shows a modal dialog for selecting and opening files
         *
         * @param {boolean} allowMultipleSelection Allows selecting more than one file at a time
         * @param {boolean} chooseDirectories Allows directories to be opened
         * @param {string} title The title of the dialog
         * @param {string} initialPath The folder opened inside the window initially. If initialPath
         *                          is not set, or it doesn't exist, the window would show the last
         *                          browsed folder depending on the OS preferences
         * @param {Array.<string>} fileTypes List of extensions that are allowed to be opened. A null value
         *                          allows any extension to be selected.
         * @param {function(Array.<string>)} successCallback Callback function for successful operations.
                                    Receives an array with the selected paths as first parameter.
         * @param {function(DOMError)=} errorCallback Callback function for error operations. 
         */
        showOpenDialog: function (allowMultipleSelection,
                                  chooseDirectories,
                                  title,
                                  initialPath,
                                  fileTypes,
                                  successCallback,
                                  errorCallback) {
            if (!successCallback) {
                return;
            }

            var files = brackets.fs.showOpenDialog(
                allowMultipleSelection,
                chooseDirectories,
                title,
                initialPath,
                fileTypes,
                function (err, data) {
                    if (!err) {
                        successCallback(data);
                    } else if (errorCallback) {
                        errorCallback(new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err)));
                    }
                }
            );
        },

        /**
         * Implementation of w3 requestFileSystem entry point
         * @param {string} path Path to a directory. This directory will serve as the root of the 
         *                          FileSystem instance.
         * @param {function(DirectoryEntry)} successCallback Callback function for successful operations.
         *                          Receives a DirectoryEntry pointing to the path
         * @param {function(DOMError)=} errorCallback Callback function for errors, including permission errors.
         */
        requestNativeFileSystem: function (path, successCallback, errorCallback) {
            brackets.fs.stat(path, function (err, data) {
                if (!err) {
                    successCallback(new NativeFileSystem.FileSystem(path));
                } else if (errorCallback) {
                    errorCallback(new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err)));
                }
            });
        },
        
        /**
         * NativeFileSystem implementation of LocalFileSystem.resolveLocalFileSystemURL()
         *
         * @param {string} path A URL referring to a local file in a filesystem accessable via this API.
         * @param {function(Entry)} successCallback Callback function for successful operations.
         * @param {function(DOMError)=} errorCallback Callback function for error operations.
         */
        resolveNativeFileSystemPath: function (path, successCallback, errorCallback) {
            brackets.fs.stat(path, function (err, stats) {
                if (!err) {
                    var entry;
                    
                    if (stats.isDirectory()) {
                        entry = new NativeFileSystem.DirectoryEntry(path);
                    } else {
                        entry = new NativeFileSystem.FileEntry(path);
                    }
                    
                    successCallback(entry);
                } else if (errorCallback) {
                    errorCallback(new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err)));
                }
            });
        },

        /**
         * Converts a brackets.fs.ERR_* error code to a NativeFileError.* error name
         * @param {number} fsErr A brackets.fs error code
         * @return {string} An error name out of the possible NativeFileError.* names
         */
        _fsErrorToDOMErrorName: function (fsErr) {
            var error;

            switch (fsErr) {
                // We map ERR_UNKNOWN and ERR_INVALID_PARAMS to SECURITY_ERR,
                // since there aren't specific mappings for these.
            case brackets.fs.ERR_UNKNOWN:
            case brackets.fs.ERR_INVALID_PARAMS:
                error = NativeFileError.SECURITY_ERR;
                break;
            case brackets.fs.ERR_NOT_FOUND:
                error = NativeFileError.NOT_FOUND_ERR;
                break;
            case brackets.fs.ERR_CANT_READ:
                error = NativeFileError.NOT_READABLE_ERR;
                break;
            case brackets.fs.ERR_UNSUPPORTED_ENCODING:
                error = NativeFileError.NOT_READABLE_ERR;
                break;
            case brackets.fs.ERR_CANT_WRITE:
                error = NativeFileError.NO_MODIFICATION_ALLOWED_ERR;
                break;
            case brackets.fs.ERR_OUT_OF_SPACE:
                error = NativeFileError.QUOTA_EXCEEDED_ERR;
                break;
            case brackets.fs.PATH_EXISTS_ERR:
                error = NativeFileError.PATH_EXISTS_ERR;
                break;
            default:
                // The HTML file spec says SECURITY_ERR is a catch-all to be used in situations
                // not covered by other error codes. 
                error = NativeFileError.SECURITY_ERR;
            }
            return error;
        }
    };
    
    /**
     * Static class that contains constants for file
     * encoding types.
     */
    NativeFileSystem.Encodings = {};
    NativeFileSystem.Encodings.UTF8 = "UTF-8";
    NativeFileSystem.Encodings.UTF16 = "UTF-16";
    
    /**
     * Internal static class that contains constants for file
     * encoding types to be used by internal file system
     * implementation.
    */
    NativeFileSystem._FSEncodings = {};
    NativeFileSystem._FSEncodings.UTF8 = "utf8";
    NativeFileSystem._FSEncodings.UTF16 = "utf16";
    
    /**
     * Converts an IANA encoding name to internal encoding name.
     * http://www.iana.org/assignments/character-sets
     *
     * @param {string} encoding The IANA encoding string.
     */
    NativeFileSystem.Encodings._IANAToFS = function (encoding) {
        //IANA names are case-insensitive
        encoding = encoding.toUpperCase();

        switch (encoding) {
        case (NativeFileSystem.Encodings.UTF8):
            return NativeFileSystem._FSEncodings.UTF8;
        case (NativeFileSystem.Encodings.UTF16):
            return NativeFileSystem._FSEncodings.UTF16;
        default:
            return undefined;
        }
    };
    
    var Encodings = NativeFileSystem.Encodings;
    var _FSEncodings = NativeFileSystem._FSEncodings;
    
    /**
     * Implementation of w3 Entry interface:
     *  http://www.w3.org/TR/2011/WD-file-system-api-20110419/#the-entry-interface
     *
     * Base class for representing entries in a file system (FileEntry or DirectoryEntry)
     *
     * @constructor
     * @param {string} fullPath The full absolute path from the root to the entry
     * @param {boolean} isDirectory Indicates that the entry is a directory
     * @param {FileSystem} fs File system that contains this entry
     */
    NativeFileSystem.Entry = function (fullPath, isDirectory, fs) {
        this.isDirectory = isDirectory;
        this.isFile = !isDirectory;
        
        if (fullPath) {
            // add trailing "/" to directory paths
            if (isDirectory && (fullPath.charAt(fullPath.length - 1) !== "/")) {
                fullPath = fullPath.concat("/");
            }
        }
        
        this.fullPath = fullPath;

        this.name = null; // default if extraction fails
        if (fullPath) {
            var pathParts = fullPath.split("/");
            
            // Extract name from the end of the fullPath (account for trailing slash(es))
            while (!this.name && pathParts.length) {
                this.name = pathParts.pop();
            }
        }

        this.filesystem = fs;
    };
    
    /**
     * Moves this Entry to a different location on the file system.
     * @param {!DirectoryEntry} parent The directory to move the entry to
     * @param {string=} newName The new name of the entry. If not specified, defaults to the current name
     * @param {function(Array.<Entry>)=} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
        // TODO (issue #241)
        // http://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-Entry-moveTo
    };
    
    /**
     * Copies this Entry to a different location on the file system.
     * @param {!DirectoryEntry} parent The directory to copy the entry to
     * @param {string=} newName The new name of the entry. If not specified, defaults to the current name
     * @param {function(Array.<Entry>)=} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
        // TODO (issue #241)
        // http://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-Entry-copyTo
    };
    
    /**
     * Generates a URL that can be used to identify this Entry
     * @param {string=} mimeType The mime type to be used to interpret the file for a FileEntry
     * @returns {string} A usable URL to identify this Entry in the current filesystem
     */
    NativeFileSystem.Entry.prototype.toURL = function (mimeType) {
        // TODO (issue #241)
        // http://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-Entry-toURL
        
        // Check updated definition at 
        // http://www.w3.org/TR/2012/WD-file-system-api-20120417/#widl-Entry-toURL-DOMString
    };
    
    /**
     * Deletes a file or directory
     * @param {function()} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.Entry.prototype.remove = function (successCallback, errorCallback) {
        // TODO (issue #241)
        // http://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-Entry-remove
    };
    
    /**
     * Look up the parent DirectoryEntry that contains this Entry
     * @param {function(Array.<Entry>)} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.Entry.prototype.getParent = function (successCallback, errorCallback) {
        // TODO (issue #241)
        // http://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-Entry-remove
    };
    
    /**
     * Look up metadata about this Entry
     * @param {function(Metadata)} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.Entry.prototype.getMetadata = function (successCallBack, errorCallback) {
        brackets.fs.stat(this.fullPath, function (err, stat) {
            if (err === brackets.fs.NO_ERROR) {
                var metadata = new NativeFileSystem.Metadata(stat.mtime);
                successCallBack(metadata);
            } else {
                errorCallback(new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err)));
            }
        });
    };


    /**
     * Implementation of w3 Metadata interface:
     *  http://www.w3.org/TR/2011/WD-file-system-api-20110419/#the-metadata-interface
     *
     * Supplies information about the state of a file or directory
     * @constructor
     * @param {Date} modificationTime Time at which the file or directory was last modified
     */
    NativeFileSystem.Metadata = function (modificationTime) {
        // modificationTime is read only
        this.modificationTime = modificationTime;
    };

    /**
     * Implementation of w3 FileEntry interface:
     *  http://www.w3.org/TR/2011/WD-file-system-api-20110419/#the-fileentry-interface
     *
     * A FileEntry represents a file on a file system.
     *
     * @constructor
     * @param {string} name Full path of the file in the file system
     * @param {FileSystem} fs File system that contains this entry
     * @extends {Entry}
     */
    NativeFileSystem.FileEntry = function (name, fs) {
        NativeFileSystem.Entry.call(this, name, false, fs);
    };
    NativeFileSystem.FileEntry.prototype = Object.create(NativeFileSystem.Entry.prototype);
    NativeFileSystem.FileEntry.prototype.constructor = NativeFileSystem.FileEntry;
    NativeFileSystem.FileEntry.prototype.parentClass = NativeFileSystem.Entry.prototype;

    NativeFileSystem.FileEntry.prototype.toString = function () {
        return "[FileEntry " + this.fullPath + "]";
    };
    
    /**
     * Creates a new FileWriter associated with the file that this FileEntry represents.
     * @param {function(FileWriter)} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
        var fileEntry = this;

        /**
         * Implementation of w3 FileWriter interface:
         *  http://www.w3.org/TR/2011/WD-file-writer-api-20110419/#the-filewriter-interface
         * 
         * A FileWriter expands on the FileSaver interface to allow for multiple write actions,
         * rather than just saving a single Blob.
         * 
         * @constructor
         * @param {Blob} data The Blob of data to be saved to a file
         * @extends {FileSaver}
         */
        var FileWriter = function (data) {
            NativeFileSystem.FileSaver.call(this, data);

            // FileWriter private memeber vars
            this._length = 0;
            this._position = 0;
        };

        /**
         * The length of the file
         */
        FileWriter.prototype.length = function () {
            return this._length;
        };

        /**
         * The byte offset at which the next write to the file will occur.
         */
        FileWriter.prototype.position = function () {
            return this._position;
        };

        /**
         * Write the supplied data to the file at position
         * @param {string} data The data to write
         */
        FileWriter.prototype.write = function (data) {
            // TODO (issue #241): handle Blob data instead of string
            // http://www.w3.org/TR/2011/WD-file-writer-api-20110419/#widl-FileWriter-write
            
            if (data === null || data === undefined) {
                console.error("FileWriter.write() called with null or undefined data.");
            }

            if (this.readyState === NativeFileSystem.FileSaver.WRITING) {
                throw new NativeFileSystem.FileException(NativeFileSystem.FileException.INVALID_STATE_ERR);
            }

            this._readyState = NativeFileSystem.FileSaver.WRITING;

            if (this.onwritestart) {
                // TODO (issue #241): progressevent
                this.onwritestart();
            }

            var self = this;

            brackets.fs.writeFile(fileEntry.fullPath, data, _FSEncodings.UTF8, function (err) {

                if ((err !== brackets.fs.NO_ERROR) && self.onerror) {
                    var fileError = new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err));

                    // TODO (issue #241): set readonly FileSaver.error attribute
                    // self._error = fileError;
                    self.onerror(fileError);

                    // TODO (issue #241): partial write, update length and position
                }
                // else {
                    // TODO (issue #241): After changing data argument to Blob, use
                    // Blob.size to update position and length upon successful
                    // completion of a write.

                    // self.position = ;
                    // self.length = ;
                // }

                // DONE is set regardless of error
                self._readyState = NativeFileSystem.FileSaver.DONE;
                
                if (self.onwrite) {
                    // TODO (issue #241): progressevent
                    self.onwrite();
                }

                if (self.onwriteend) {
                    // TODO (issue #241): progressevent
                    self.onwriteend();
                }
            });
        };

        /**
         * Seek sets the file position at which the next write will occur
         * @param {number} offset An absolute byte offset into the file. If offset is greater than
         *                      length, length is used instead. If offset is less than zero, length
         *                      is added to it, so that it is treated as an offset back from the end 
         *                      of the file. If it is still less than zero, zero is used
         */
        FileWriter.prototype.seek = function (offset) {
            // TODO (issue #241)
            // http://www.w3.org/TR/2011/WD-file-writer-api-20110419/#widl-FileWriter-seek
        };

        /**
         * Changes the length of the file to that specified
         * @param {number} size The size to which the length of the file is to be adjusted, 
         *                      measured in bytes
         */
        FileWriter.prototype.truncate = function (size) {
            // TODO (issue #241)
            // http://www.w3.org/TR/2011/WD-file-writer-api-20110419/#widl-FileWriter-truncate
        };

        var fileWriter = new FileWriter();

        // initialize file length
        var result = new $.Deferred();
        brackets.fs.readFile(fileEntry.fullPath, _FSEncodings.UTF8, function (err, contents) {
            // Ignore "file not found" errors. It's okay if the file doesn't exist yet.
            if (err !== brackets.fs.ERR_NOT_FOUND) {
                fileWriter._err = err;
            }
            
            if (contents) {
                fileWriter._length = contents.length;
            }
            
            result.resolve();
        });

        result.done(function () {
            if (fileWriter._err && (errorCallback !== undefined)) {
                errorCallback(new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(fileWriter._err)));
            } else if (successCallback !== undefined) {
                successCallback(fileWriter);
            }
        });
    };

    /**
     * Returns a File that represents the current state of the file that this FileEntry represents
     * @param {function(File)} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.FileEntry.prototype.file = function (successCallback, errorCallback) {
        var newFile = new NativeFileSystem.File(this);
        successCallback(newFile);

        // TODO (issue #241): errorCallback
    };

    /**
     * This class extends the FileException interface described in to add
     * several new error codes. Any errors that need to be reported synchronously,
     * including all that occur during use of the synchronous filesystem methods,
     * are reported using the FileException exception.
     *
     * @param {?number=} code The code attribute, on getting, must return one of the
     * constants of the FileException exception, which must be the most appropriate
     * code from the table below.
     */
    NativeFileSystem.FileException = function (code) {
        this.code = code || 0;
    };

    // FileException constants
    Object.defineProperties(
        NativeFileSystem.FileException,
        {
            NOT_FOUND_ERR:                { value: 1, writable: false },
            SECURITY_ERR:                 { value: 2, writable: false },
            ABORT_ERR:                    { value: 3, writable: false },
            NOT_READABLE_ERR:             { value: 4, writable: false },
            ENCODING_ERR:                 { value: 5, writable: false },
            NO_MODIFICATION_ALLOWED_ERR:  { value: 6, writable: false },
            INVALID_STATE_ERR:            { value: 7, writable: false },
            SYNTAX_ERR:                   { value: 8, writable: false },
            QUOTA_EXCEEDED_ERR:           { value: 10, writable: false }
        }
    );

    /**
     * Implementation of w3 FileSaver interface
     *  http://www.w3.org/TR/2011/WD-file-writer-api-20110419/#the-filesaver-interface
     *
     * FileSaver provides methods to monitor the asynchronous writing of blobs
     * to disk using progress events and event handler attributes.
     *
     * @constructor
     * @param {Blob} data The Blob of data to be saved to a file
     */
    NativeFileSystem.FileSaver = function (data) {
        // FileSaver private member vars
        this._data = data;
        this._readyState = NativeFileSystem.FileSaver.INIT;
        this._error = null;
    };

    // FileSaver constants
    Object.defineProperties(
        NativeFileSystem.FileSaver,
        {
            INIT:     { value: 1, writable: false },
            WRITING:  { value: 2, writable: false },
            DONE:     { value: 3, writable: false }
        }
    );
    
    /**
     * The state the FileSaver object is at the moment (INIT, WRITING, DONE)
     */
    NativeFileSystem.FileSaver.prototype.readyState = function () {
        return this._readyState;
    };
    
    /**
     * Aborts a saving operation
     */
    NativeFileSystem.FileSaver.prototype.abort = function () {
        // TODO (issue #241): http://dev.w3.org/2009/dap/file-system/file-writer.html#widl-FileSaver-abort-void

        // If readyState is DONE or INIT, terminate this overall series of steps without doing anything else..
        if (this._readyState === NativeFileSystem.FileSaver.INIT || this._readyState === NativeFileSystem.FileSaver.DONE) {
            return;
        }

        // TODO (issue #241): Terminate any steps having to do with writing a file.

        // Set the error attribute to a FileError object with the code ABORT_ERR.
        this._error = new NativeFileError(NativeFileError.ABORT_ERR);

        // Set readyState to DONE.
        this._readyState = NativeFileSystem.FileSaver.DONE;

        /*
        TODO (issue #241): 
        Dispatch a progress event called abort
        Dispatch a progress event called writeend
        Stop dispatching any further progress events.
        Terminate this overall set of steps.
        */
    };

    /**
     * Implementation of w3 DirectoryEntry interface:
     *  http://www.w3.org/TR/2011/WD-file-system-api-20110419/#the-directoryentry-interface
     *
     * The DirectoryEntry class represents a directory on a file system.
     *
     * @constructor
     * @param {string} name Full path of the directory in the file system
     * @param {FileSystem} fs File system that contains this entry
     * @extends {Entry}
     */
    NativeFileSystem.DirectoryEntry = function (name, fs) {
        NativeFileSystem.Entry.call(this, name, true, fs);

        // TODO (issue #241): void removeRecursively (VoidCallback successCallback, optional ErrorCallback errorCallback);
    };
    NativeFileSystem.DirectoryEntry.prototype = Object.create(NativeFileSystem.Entry.prototype);
    NativeFileSystem.DirectoryEntry.prototype.constructor = NativeFileSystem.DirectoryEntry;
    NativeFileSystem.DirectoryEntry.prototype.parentClass = NativeFileSystem.Entry.prototype;
    
    NativeFileSystem.DirectoryEntry.prototype.toString = function () {
        return "[DirectoryEntry " + this.fullPath + "]";
    };
    
    /**
     * Creates or looks up a directory
     * @param {string} path Either an absolute path or a relative path from this DirectoryEntry
     *                      to the directory to be looked up or created
     * @param {{create:?boolean, exclusive:?boolean}=} options Object with the flags "create" 
     *                      and "exclusive" to modify the method behavior based on 
     *                      http://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-DirectoryEntry-getDirectory
     * @param {function(Entry)=} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
        var directoryFullPath = path,
            filesystem = this.filesystem;
        
        function isRelativePath(path) {
            // If the path contains a colons it must be a full path on Windows (colons are
            // not valid path characters on mac or in URIs)
            if (path.indexOf(":") !== -1) {
                return false;
            }
            
            // For everyone else, absolute paths start with a "/"
            return path[0] !== "/";
        }

        // resolve relative paths relative to the DirectoryEntry
        if (isRelativePath(path)) {
            directoryFullPath = this.fullPath + path;
        }

        var createDirectoryEntry = function () {
            if (successCallback) {
                successCallback(new NativeFileSystem.DirectoryEntry(directoryFullPath, filesystem));
            }
        };

        var createDirectoryError = function (err) {
            if (errorCallback) {
                errorCallback(new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err)));
            }
        };

        // Use stat() to check if file exists
        brackets.fs.stat(directoryFullPath, function (err, stats) {
            if ((err === brackets.fs.NO_ERROR)) {
                // NO_ERROR implies the path already exists

                // throw error if the file the path is not a directory
                if (!stats.isDirectory()) {
                    if (errorCallback) {
                        errorCallback(new NativeFileError(NativeFileError.TYPE_MISMATCH_ERR));
                    }

                    return;
                }

                // throw error if the file exists but create is exclusive
                if (options.create && options.exclusive) {
                    if (errorCallback) {
                        errorCallback(new NativeFileError(NativeFileError.PATH_EXISTS_ERR));
                    }

                    return;
                }

                // Create a file entry for the existing directory. If create == true,
                // a file entry is created without error.
                createDirectoryEntry();
            } else if (err === brackets.fs.ERR_NOT_FOUND) {
                // ERR_NOT_FOUND implies we write a new, empty file

                // create the file
                if (options.create) {
                    // TODO: Pass permissions. The current implementation of fs.makedir() always 
                    // creates the directory with the full permissions available to the current user. 
                    brackets.fs.makedir(directoryFullPath, 0, function (err) {
                        if (err) {
                            createDirectoryError(err);
                        } else {
                            createDirectoryEntry();
                        }
                    });
                    return;
                }

                // throw error if file not found and the create == false
                if (errorCallback) {
                    errorCallback(new NativeFileError(NativeFileError.NOT_FOUND_ERR));
                }
            } else {
                // all other brackets.fs.stat() errors
                createDirectoryError(err);
            }
        });
    };
    
    /**
     * Deletes a directory and all of its contents, if any
     * @param {function()} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
        // TODO (issue #241)
        // http://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-DirectoryEntry-removeRecursively
    };

    /**
     * Creates a new DirectoryReader to read Entries from this Directory
     * @returns {DirectoryReader} A DirectoryReader instance to read the Directory's entries
     */
    NativeFileSystem.DirectoryEntry.prototype.createReader = function () {
        var dirReader = new NativeFileSystem.DirectoryReader();
        dirReader._directory = this;

        return dirReader;
    };

    /**
     * Creates or looks up a file.
     *
     * @param {string} path Either an absolute path or a relative path from this
     *                      DirectoryEntry to the file to be looked up or created. It is an error
     *                      to attempt to create a file whose immediate parent does not yet
     *                      exist.
     * @param {{create:?boolean, exclusive:?boolean}=} options Object with the flags "create" 
     *                      and "exclusive" to modify the method behavior based on 
     *                      http://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-DirectoryEntry-getFile
     * @param {function(FileEntry)=} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
        var fileFullPath = path,
            filesystem = this.filesystem;
        
        function isRelativePath(path) {
            // If the path contains a colons it must be a full path on Windows (colons are
            // not valid path characters on mac or in URIs)
            if (path.indexOf(":") !== -1) {
                return false;
            }
            
            // For everyone else, absolute paths start with a "/"
            return path[0] !== "/";
        }

        // resolve relative paths relative to the DirectoryEntry
        if (isRelativePath(path)) {
            fileFullPath = this.fullPath + path;
        }

        var createFileEntry = function () {
            if (successCallback) {
                successCallback(new NativeFileSystem.FileEntry(fileFullPath, filesystem));
            }
        };

        var createFileError = function (err) {
            if (errorCallback) {
                errorCallback(new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err)));
            }
        };

        // Use stat() to check if file exists
        brackets.fs.stat(fileFullPath, function (err, stats) {
            if ((err === brackets.fs.NO_ERROR)) {
                // NO_ERROR implies the path already exists

                // throw error if the file the path is a directory
                if (stats.isDirectory()) {
                    if (errorCallback) {
                        errorCallback(new NativeFileError(NativeFileError.TYPE_MISMATCH_ERR));
                    }

                    return;
                }

                // throw error if the file exists but create is exclusive
                if (options.create && options.exclusive) {
                    if (errorCallback) {
                        errorCallback(new NativeFileError(NativeFileError.PATH_EXISTS_ERR));
                    }

                    return;
                }

                // Create a file entry for the existing file. If create == true,
                // a file entry is created without error.
                createFileEntry();
            } else if (err === brackets.fs.ERR_NOT_FOUND) {
                // ERR_NOT_FOUND implies we write a new, empty file

                // create the file
                if (options.create) {
                    brackets.fs.writeFile(fileFullPath, "", _FSEncodings.UTF8, function (err) {
                        if (err) {
                            createFileError(err);
                        } else {
                            createFileEntry();
                        }
                    });

                    return;
                }

                // throw error if file not found and the create == false
                if (errorCallback) {
                    errorCallback(new NativeFileError(NativeFileError.NOT_FOUND_ERR));
                }
            } else {
                // all other brackets.fs.stat() errors
                createFileError(err);
            }
        });
    };

    /**
     * Implementation of w3 DirectoryReader interface:
     *  http://www.w3.org/TR/2011/WD-file-system-api-20110419/#the-directoryreader-interface
     *
     * A DirectoryReader lets a user list files and directories in a directory
     *
     * @constructor
     */
    NativeFileSystem.DirectoryReader = function () {

    };

    /**
     * Read the next block of entries from this directory
     * @param {function(Array.<Entry>)} successCallback Callback function for successful operations
     * @param {function(DOMError)=} errorCallback Callback function for error operations
     */
    NativeFileSystem.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
        var rootPath = this._directory.fullPath,
            filesystem = this.filesystem;
        
        brackets.fs.readdir(rootPath, function (err, filelist) {
            if (!err) {
                var entries = [];
                var lastError = null;

                // call success immediately if this directory has no files
                if (filelist.length === 0) {
                    successCallback(entries);
                    return;
                }

                // stat() to determine type of each entry, then populare entries array with objects
                var masterPromise = Async.doInParallel(filelist, function (filename, index) {
                    
                    var deferred = new $.Deferred();
                    var itemFullPath = rootPath + filelist[index];
                    
                    brackets.fs.stat(itemFullPath, function (statErr, statData) {
                        if (!statErr) {
                            if (statData.isDirectory()) {
                                entries[index] = new NativeFileSystem.DirectoryEntry(itemFullPath, filesystem);
                            } else if (statData.isFile()) {
                                entries[index] = new NativeFileSystem.FileEntry(itemFullPath, filesystem);
                            } else {
                                entries[index] = null;  // neither a file nor a dir, so don't include it
                            }
                            deferred.resolve();
                        } else {
                            lastError = new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(statErr));
                            deferred.reject(lastError);
                        }
                    });
                    
                    return deferred.promise();
                }, true);

                // We want the error callback to get called after some timeout (in case some deferreds don't return).
                // So, we need to wrap masterPromise in another deferred that has this timeout functionality    
                var timeoutWrapper = Async.withTimeout(masterPromise, NativeFileSystem.ASYNC_TIMEOUT);

                // Add the callbacks to this top-level Promise, which wraps all the individual deferred objects
                timeoutWrapper.done(function () { // success
                    // The entries array may have null values if stat returned things that were
                    // neither a file nor a dir. So, we need to clean those out.
                    var cleanedEntries = [], i;
                    for (i = 0; i < entries.length; i++) {
                        if (entries[i]) {
                            cleanedEntries.push(entries[i]);
                        }
                    }
                    successCallback(cleanedEntries);
                }).fail(function (err) { // error
                    if (err === Async.ERROR_TIMEOUT) {
                        // SECURITY_ERR is the HTML5 File catch-all error, and there isn't anything
                        // more fitting for a timeout.
                        err = new NativeFileError(NativeFileError.SECURITY_ERR);
                    } else {
                        err = lastError;
                    }
                    
                    if (errorCallback) {
                        errorCallback(err);
                    }
                });

            } else { // There was an error reading the initial directory.
                errorCallback(new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err)));
            }
        });
    };

    /**
     * Implementation of w3 FileReader interface:
     *  http://www.w3.org/TR/2011/WD-FileAPI-20111020/#FileReader-interface
     *
     * A FileReader provides methods to read File objects or Blob objects into memory, and to
     * access the data from those Files or Blobs using progress events and event handler attributes
     *
     * @constructor
     */
    NativeFileSystem.FileReader = function () {
        // TODO (issue #241): this classes should extend EventTarget

        // states
        this.EMPTY = 0;
        this.LOADING = 1;
        this.DONE = 2;

        // readyState is read only
        this.readyState = this.EMPTY;

        // File or Blob data
        // TODO (issue #241): readonly attribute any result;
        // TODO (issue #241): readonly attribute DOMError error;

        // event handler attributes
        this.onloadstart = null;
        this.onprogress = null;
        this.onload = null;
        this.onabort = null;
        this.onerror = null;
        this.onloadend = null;
    };
    // TODO (issue #241): extend EventTarget (draft status, not implememnted in webkit)
    // NativeFileSystem.FileReader.prototype = Object.create(NativeFileSystem.EventTarget.prototype);
    
    /**
     * Reads a Blob as an array buffer
     * @param {Blob} blob The data to read
     */
    NativeFileSystem.FileReader.prototype.readAsArrayBuffer = function (blob) {
        // TODO (issue #241): implement
        // http://www.w3.org/TR/2011/WD-FileAPI-20111020/#dfn-readAsArrayBuffer
    };
    
    /**
     * Reads a Blob as a binary string
     * @param {Blob} blob The data to read
     */
    NativeFileSystem.FileReader.prototype.readAsBinaryString = function (blob) {
        // TODO (issue #241): implement
        // http://www.w3.org/TR/2011/WD-FileAPI-20111020/#dfn-readAsBinaryStringAsync
    };
    
    /**
     * Reads a Blob as a data url
     * @param {Blob} blob The data to read
     */
    NativeFileSystem.FileReader.prototype.readAsDataURL = function (blob) {
        // TODO (issue #241): implement
        // http://www.w3.org/TR/2011/WD-FileAPI-20111020/#dfn-readAsDataURL
    };
    
    /**
     * Aborts a File reading operation
     */
    NativeFileSystem.FileReader.prototype.abort = function () {
        // TODO (issue #241): implement
        // http://www.w3.org/TR/2011/WD-FileAPI-20111020/#dfn-abort
    };
    
    /**
     * Reads a Blob as text
     * @param {Blob} blob The data to read
     * @param {string=} encoding (IANA Encoding Name)
     */
    NativeFileSystem.FileReader.prototype.readAsText = function (blob, encoding) {
        var self = this;

        if (!encoding) {
            encoding = Encodings.UTF8;
        }
        
        var internalEncoding  = Encodings._IANAToFS(encoding);

        if (this.readyState === this.LOADING) {
            throw new InvalidateStateError();
        }

        this.readyState = this.LOADING;

        if (this.onloadstart) {
            this.onloadstart(); // TODO (issue #241): progressevent
        }

        brackets.fs.readFile(blob._fullPath, internalEncoding, function (err, data) {

            // TODO (issue #241): the event objects passed to these event handlers is fake and incomplete right now
            var fakeEvent = {
                loaded: 0,
                total: 0
            };

            // The target for this event is the FileReader and the data/err result is stored in the FileReader
            fakeEvent.target = self;
            self.result = data;
            self.error = new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err));

            if (err) {
                self.readyState = self.DONE;
                if (self.onerror) {
                    self.onerror(fakeEvent);
                }
            } else {
                self.readyState = self.DONE;

                // TODO (issue #241): this should be the file/blob size, but we don't have code to get that yet, so for know assume a file size of 1
                // and since we read the file in one go, assume 100% after the first read
                fakeEvent.loaded = 1;
                fakeEvent.total = 1;

                if (self.onprogress) {
                    self.onprogress(fakeEvent);
                }

                // TODO (issue #241): onabort not currently supported since our native implementation doesn't support it
                // if (self.onabort)
                //    self.onabort(fakeEvent);

                if (self.onload) {
                    self.onload(fakeEvent);
                }

                if (self.onloadend) {
                    self.onloadend();
                }
            }

        });
    };

    /**
     * Implementation of w3 Blob interface:
     *  http://www.w3.org/TR/2011/WD-FileAPI-20111020/#blob
     *
     * A Blob represents immutable raw data. 
     *
     * @constructor
     * @param {string} fullPath Absolute path of the Blob
     */
    NativeFileSystem.Blob = function (fullPath) {
        this._fullPath = fullPath;
        
        // TODO (issue #241): implement, readonly
        this.size = 0;
        
        // TODO (issue #241): implement, readonly
        this.type = null;
    };
    
    /**
     * Returns a new Blob object with bytes ranging from the optional start parameter 
     * up to but not including the optional end parameter
     * @param {number=} start Start point of a slice treated as a byte-order position
     * @param {number=} end End point of a slice. If end is undefined, size will be used. If 
     *                      end is negative, max(size+end, 0) will be used. In any other case,
     *                      the slice will finish at min(end, size)
     * @param {string=} contentType HTTP/1.1 Content-Type header on the Blob
     * @returns {Blob} 
     */
    NativeFileSystem.Blob.prototype.slice = function (start, end, contentType) {
        // TODO (issue #241): implement
        // http://www.w3.org/TR/2011/WD-FileAPI-20111020/#dfn-slice
    };
    
    /**
     * Implementation of w3 File interface:
     *  http://www.w3.org/TR/2011/WD-FileAPI-20111020/#file
     *
     * @constructor
     * @param {Entry} entry The Entry pointing to the File
     * @extends {Blob}
     */
    NativeFileSystem.File = function (entry) {
        NativeFileSystem.Blob.call(this, entry.fullPath);
        
        // TODO (issue #241): implement, readonly
        this.name = "";
        
        // TODO (issue #241): implement, readonly
        this.lastModifiedDate = null;
    };
    
    /**
     * Implementation of w3 FileSystem interface
     *  http://www.w3.org/TR/file-system-api/#the-filesystem-interface
     *
     * FileSystem represents a file system
     */
    NativeFileSystem.FileSystem = function (path) {

        /**
         * This is the name of the file system and must be unique across the list
         * of exposed file systems.
         * @const
         * @type {string}
         */
        Object.defineProperty(this, "name", {
            value: path,
            writable: false
        });
        
        /**
         * The root directory of the file system.
         * @const
         * @type {DirectoryEntry}
         */
        Object.defineProperty(this, "root", {
            value: new NativeFileSystem.DirectoryEntry(path, this),
            writable: false
        });
    };

    // Define public API
    exports.NativeFileSystem    = NativeFileSystem;
});
