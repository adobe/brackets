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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, Dropbox */
define(function (require, exports, module) {
    "use strict";

    require("thirdparty/dropbox.min.js");
    
    var client;
    
    function mapError(error) {
        if (!error) {
            return brackets.fs.NO_ERROR;
        }
        
        switch (error.status) {
        case Dropbox.ApiError.INVALID_TOKEN:
            // If you're using dropbox.js, the only cause behind this error is that
            // the user token expired.
            // Get the user through the authentication flow again.
            break;
        
        case Dropbox.ApiError.NOT_FOUND:
            // The file or folder you tried to access is not in the user's Dropbox.
            // Handling this error is specific to your application.
            return brackets.fs.ERR_NOT_FOUND;
        
        case Dropbox.ApiError.OVER_QUOTA:
            // The user is over their Dropbox quota.
            // Tell them their Dropbox is full. Refreshing the page won't help.
            break;
        
        case Dropbox.ApiError.RATE_LIMITED:
            // Too many API requests. Tell the user to try again later.
            // Long-term, optimize your code to use fewer API calls.
            break;
        
        case Dropbox.ApiError.NETWORK_ERROR:
            // An error occurred at the XMLHttpRequest layer.
            // Most likely, the user's network connection is down.
            // API calls will not succeed until the user gets back online.
            break;
        
        case Dropbox.ApiError.INVALID_PARAM:
        case Dropbox.ApiError.OAUTH_ERROR:
        case Dropbox.ApiError.INVALID_METHOD:
            // Caused by a bug in dropbox.js, in your application, or in Dropbox.
            // Tell the user an error occurred, ask them to refresh the page.
            break;
        }
        
        return brackets.fs.ERR_UNKNOWN;
    }
    
    function readdir(path, callback) {
        client.readdir(path, function (error, entries) {
            callback(mapError(error), entries);
        });
    }
    
    function makedir(path, mode, callback) {
        client.mkdir(path, function (error) {
            callback(mapError(error));
        });
    }
    
    function stat(path, callback) {
        client.stat(path, function (error, data) {
            callback(mapError(error), {
                isFile: function () {
                    return data.isFile;
                },
                isDirectory: function () {
                    return data.isFolder;
                },
                mtime: data && data.modifiedAt
            });
        });
    }
    
    function readFile(path, encoding, callback) {
        client.readFile(path, function (error, data) {
            callback(mapError(error), data);
        });
    }
    
    function writeFile(path, data, encoding, callback) {
        client.writeFile(path, data, function (error) {
            callback(mapError(error));
        });
    }
    
    function rename(oldPath, newPath, callback) {
        client.move(oldPath, newPath, function (error) {
            callback(mapError(error));
        });
    }
    
    function showOpenDialog(allowMultipleSelection, chooseDirectory, title, initialPath, fileTypes, callback) {
        alert("File/directory chooser not implemented yet");
        if (chooseDirectory) {
            callback(0, "/");
        } else {
            callback(1);
        }
    }
    
    function init() {
        client = new Dropbox.Client({
            key: "sWR9wXcpXIA=|c5GZu+WL9XhxhReZMsg7QvspGpVZ80iF+Cin/xbKrQ==",
            sandbox: false
        });
        client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true}));
        client.authenticate(function (error, client) {
            if (error) {
                return mapError(error);
            }
        });
        
        brackets.fs = {};
        brackets.fs.readdir = readdir;
        brackets.fs.makedir = makedir;
        brackets.fs.stat = stat;
        brackets.fs.readFile = readFile;
        brackets.fs.writeFile = writeFile;
        brackets.fs.rename = rename;
        brackets.fs.showOpenDialog = showOpenDialog;
        
        // Error codes
        brackets.fs.NO_ERROR                    = 0;
        brackets.fs.ERR_UNKNOWN                 = 1;
        brackets.fs.ERR_INVALID_PARAMS          = 2;
        brackets.fs.ERR_NOT_FOUND               = 3;
        brackets.fs.ERR_CANT_READ               = 4;
        brackets.fs.ERR_UNSUPPORTED_ENCODING    = 5;
        brackets.fs.ERR_CANT_WRITE              = 6;
        brackets.fs.ERR_OUT_OF_SPACE            = 7;
        brackets.fs.ERR_NOT_FILE                = 8;
        brackets.fs.ERR_NOT_DIRECTORY           = 9;
        brackets.fs.ERR_FILE_EXISTS             = 10;
    }
    
    exports.init = init;
});
