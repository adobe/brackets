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
/*global define, Dropbox */

define(function (require, exports, module) {
    "use strict";

    require("filesystem/impls/dropbox/dropbox.min");
    
    var client;
    
    function init(callback) {
        if (!client) {
            client = new Dropbox.Client({
                key: "sWR9wXcpXIA=|c5GZu+WL9XhxhReZMsg7QvspGpVZ80iF+Cin/xbKrQ==",
                sandbox: false
            });
            client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true}));
            client.authenticate(function (err, client) {
                // TODO: Handle errors?
                callback(err);
            });
        }
    }
    
    function showOpenDialog() {
        // TODO
    }
    
    function showSaveDialog() {
        // TODO
    }
    
    function _convertStat(stat) {
        return {
            isFile: function () {
                return stat.isFile;
            },
            isDirectory: function () {
                return stat.isDirectory;
            },
            mtime: stat && stat.modifiedAt
        };
    }
    
    function stat(path, callback) {
        client.stat(path, function (error, data) {
            callback(error, _convertStat(data));
        });
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
        
        client.readdir(path, function (err, contents, dirStat, stats) {
            var i, convertedStats = [];
            
            if (!err) {
                for (i = 0; i < stats.length; i++) {
                    convertedStats[i] = _convertStat(stats[i]);
                }
            }
            
            callback(err, contents, convertedStats);
        });
    }
    
    function mkdir(path, mode, callback) {
        if (typeof mode === "function") {
            callback = mode;
        }
        client.mkdir(path, function (err, stat) {
            callback(err, stat);
        });
    }
    
    function rename(oldPath, newPath, callback) {
        client.move(oldPath, newPath, callback);
    }
    
    function readFile(path, options, callback) {
        if (typeof options === "function") {
            callback = options;
        }
        
        client.readFile(path, function (err, data, stat) {
            callback(err, data, stat);
        });
    }
    
    function writeFile(path, data, options, callback) {
        if (typeof options === "function") {
            callback = options;
        }
        
        client.writeFile(path, data, function (err, stat) {
            callback(err, stat);
        });
    }
    
    function chmod(path, mode, callback) {
        // TODO: IMPLEMENT ME
    }
    
    function unlink(path, callback) {
        client.unlink(path, callback);
    }
    
    function initWatchers(callback) {
    }
    
    function watchPath(path) {
    }
    
    function unwatchPath(path) {
    }
    
    function unwatchAll() {
    }
    
    // TEMP - REMOVE ME!!
    /*
    exports.pullChanges = function (cursor, callback) {
        client.pullChanges(cursor, callback);
    };
    */
    
    // Export public API
    exports.init            = init;
    exports.showOpenDialog  = showOpenDialog;
    exports.showSavedialog  = showSaveDialog;
    exports.exists          = exists;
    exports.readdir         = readdir;
    exports.mkdir           = mkdir;
    exports.rename          = rename;
    exports.stat            = stat;
    exports.readFile        = readFile;
    exports.writeFile       = writeFile;
    exports.chmod           = chmod;
    exports.unlink          = unlink;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;
});