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
/*global define, appshell */

define(function (require, exports, module) {
    "use strict";

    function init() {
        // Nothing to do...
    }
    
    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        appshell.fs.showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback);
    }
    
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        appshell.fs.showSaveDialog(title, initialPath, proposedNewFilename, callback);
    }
    
    function stat(path, callback) {
        appshell.fs.stat(path, callback);
    }
    
    function isNetworkDrive(path, callback) {
        appshell.fs.isNetworkDrive(path, callback);
    }
    
    function exists(path, callback) {
        stat(path, function (err) {
            if (err) {
                callback(false);
            } else {
                callback(true);
            }
        });
    }
    
    function readdir(path, callback) {
        var stats = [];
        
        appshell.fs.readdir(path, function (err, contents) {
            var i, count = contents.length;
            
            if (err) {
                callback(err);
                return;
            }
            
            contents.forEach(function (val, idx) {
                stat(path + "/" + val, function (err, stat) {
                    if (!err) {
                        stats[idx] = stat;
                    }
                    count--;
                    if (count <= 0) {
                        callback(err, contents, stats);
                    }
                });
            });
        });
    }
    
    function mkdir(path, mode, callback) {
        if (typeof mode === "function") {
            callback = mode;
            mode = parseInt("0777", 8);
        }
        appshell.fs.makedir(path, mode, function (err) {
            if (err) {
                callback(err);
            } else {
                stat(path, function (err, stat) {
                    callback(err, stat);
                });
            }
        });
    }
    
    function rename(oldPath, newPath, callback) {
        appshell.fs.rename(oldPath, newPath, callback);
    }
    
    function readFile(path, options, callback) {
        var encoding = "utf8";
        
        if (typeof options === "function") {
            callback = options;
        } else {
            encoding = options.encoding || "utf8";
        }
        
        appshell.fs.readFile(path, encoding, function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                stat(path, function (err, stat) {
                    callback(err, data, stat);
                });
            }
        });
    }
    
    function writeFile(path, data, options, callback) {
        var encoding = "utf8";
        
        if (typeof options === "function") {
            callback = options;
        } else {
            encoding = options.encoding || "utf8";
        }
        
        appshell.fs.writeFile(path, data, encoding, function (err) {
            if (err) {
                callback(err);
            } else {
                stat(path, function (err, stat) {
                    callback(err, stat);
                });
            }
        });
    }
    
    function chmod(path, mode, callback) {
        appshell.fs.chmod(path, mode, callback);
    }
    
    function unlink(path, callback) {
        appshell.fs.unlink(path, callback);
    }
    
    function moveToTrash(path, callback) {
        appshell.fs.moveToTrash(path, callback);
    }
    
    // Export public API
    exports.init            = init;
    exports.showOpenDialog  = showOpenDialog;
    exports.showSaveDialog  = showSaveDialog;
    exports.isNetworkDrive  = isNetworkDrive;
    exports.exists          = exists;
    exports.readdir         = readdir;
    exports.mkdir           = mkdir;
    exports.rename          = rename;
    exports.stat            = stat;
    exports.readFile        = readFile;
    exports.writeFile       = writeFile;
    exports.chmod           = chmod;
    exports.unlink          = unlink;
    exports.moveToTrash     = moveToTrash;
});