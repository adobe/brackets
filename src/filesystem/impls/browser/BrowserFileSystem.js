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
/*global define, appshell, $, window */

define(function (require, exports, module) {
    "use strict";

    var FileSystemError = require("filesystem/FileSystemError"),
        Dialogs         = require("widgets/Dialogs"),
        DefaultDialogs  = require("widgets/DefaultDialogs"),
        Filer           = require('thirdparty/filer/src/index'),
        async           = require('thirdparty/async'),
        fs              = new Filer.FileSystem(),
        fsPath          = Filer.Path;

    window.Filer = Filer;
    window.fs = fs;


    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        // FIXME: Here we need to create a new dialog that at least
        //        lists all files/folders on filesystem
        //        require("text!htmlContent/filesystem-dialog.html");
        // 17:51 pflynn: oh, you can store .html templates in your extension
        // itself... you can load them with require() and then just pass
        // them to Dialogs.showModalDialogUsingTemplate() driectly
        throw new Error();
    }

    function showSaveDialog(title, initialPath, x, callback) {
        // FIXME
        throw new Error();
    }

    /**
     * Create Getting Started directory and files. We ignore all errors here
     * the dir and files likely exist.
     */
    function _createGettingStartedEntry(file, contents, callback){
        var path = fsPath.join("/Getting Started/", file);

        if (contents){
            fs.writeFile(path, contents, function(err){
                callback();
            });

        } else {
            fs.mkdir(path, function(err){
                callback();
            });
        }
    }

    function _bootstrapGettingStarted(callback){
        _createGettingStartedEntry(null, null, function(){
            _createGettingStartedEntry(
                "index.html",
                "<html>\n<head>\n  <title>Hello, world!</title>\n</head>\n<body>\n  Welcome to Brackets Online!\n</body>\n</html>",
                function(){
                    _createGettingStartedEntry(
                        "main.css",
                        ".hello {\n  content: 'world!';\n}",
                        callback
                    );
                }
            );
        });
    }

    /**
     * Convert Filer error codes to FileSystemError values.
     *
     * @param {?number} err A Filer error code
     * @return {?string} A FileSystemError string, or null if there was no error code.
     * @private
     */
    function _mapError(err) {
        if (!err) {
            return null;
        }

        switch (err) {
        case Filer.Errors.EExists:
            return FileSystemError.ALREADY_EXISTS;
        // case Filer.Errors.EIsDirectory:
            // return FileSystemError.UNKNOWN
        case Filer.Errors.ENoEntry:
            return FileSystemError.NOT_FOUND;
        // case Filer.Errors.EBusy:
            // return FileSystemError.UNKNOWN
        case Filer.Errors.ENotEmpty:
            // return FileSystemError.UNKNOWN
        case Filer.Errors.ENotDirectory:
            return FileSystemError.INVALID_PARAMS;
        case Filer.Errors.EBadFileDescriptor:
            return FileSystemError.NOT_READABLE;
        // case Filer.Errors.ENotImplemented:
        //     return FileSystemError.UNKNOWN
        // case Filer.Errors.ENotMounted:
        //     return FileSystemError.UNKNOWN
        // case Filer.Errors.EInvalid:
        //     return FileSystemError.UNKNOWN
        // case Filer.Errors.EIO:
        //     return FileSystemError.UNKNOWN
        // case Filer.Errors.ELoop:
        //     return FileSystemError.UNKNOWN
        // case Filer.Errors.EFileSystemError:
        //     return FileSystemError.UNKNOWN
        // case Filer.Errors.ENoAttr:
        //     return FileSystemError.UNKNOWN
        }
        return FileSystemError.UNKNOWN;
    }

    /**
     * Convert a callback to one that transforms its first parameter from an
     * Filer error code to a FileSystemError string.
     *
     * @param {function(?number)} cb A callback that expects an Filer error code
     * @return {function(?string)} A callback that expects a FileSystemError string
     * @private
     */
    function _wrap(cb) {
        return function (err) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = _mapError(args[0]);
            cb.apply(null, args);
        };
    }


    function stat(path, callback) {
        // Initialize the Getting Started assets if it's hit.
        if (path === "/Getting Started/") {
            _bootstrapGettingStarted(function(){
                stat("/Getting Started", callback);
            });
        } else {
            fs.stat(path, function(err, stats){
                if (err){
                    callback(_mapError(err));
                } else {
                    callback(null, {
                        //FIXME: unsure what to do with symlinks
                        isFile: stats.type === "FILE",
                        isDirectory: stats.type === "DIRECTORY",
                        size: stats.size,
                        mtime: new Date(stats.mtime),
                        ctime: new Date(stats.ctime),
                        // realPath: ?
                        atime: new Date(stats.atime)
                    });
                }
            });
        }
    }


    function exists(path, callback) {
        stat(path, function (err) {
            if (err) {
                if (err === Filer.Errors.ENoEntry) {
                    callback(null, false);
                } else {
                    callback(err);
                }
                return;
            }

            callback(null, true);
        });
    }

    function readdir(path, callback) {
        if (path.charAt(path.length - 1) === "/"){
            path = path.substring(0, path.length - 1);
        }
        console.log('readdir:', path);

        fs.readdir(path, function(err, entries){
            console.log(entries);
            async.map(entries, function(entry, callback){
                stat(fsPath.join(path, entry), callback);
            }, function(err, stats){
                console.log(err, entries, stats);
                callback(err, entries, stats);
            });
        });
    }

    function mkdir(path, mode, callback) {
        fs.mkdir(path, mode, _wrap(callback));
    }

    function rename(oldPath, newPath, callback) {
        fs.rename(oldPath, newPath, _wrap(callback));
    }

    function readFile(path, options, callback) {
        var encoding = options.encoding || "utf8";

        if (typeof options === "function") {
            callback = options;
        }

        async.parallel(
            [
                function(callback){
                    fs.readFile(path, encoding, callback);
                },
                function(callback){
                    if (options.stat){
                        callback(null, options.stat);
                    } else {
                        stat(path, callback);
                    }
                }
            ],
            function(err, results){
                if (err){
                    callback(_mapError(err));
                }
                var data = results[0];
                var stats = results[1];
                callback(err, err ? null : data, stats);
            }
        );
    }

    function writeFile(path, data, options, callback) {
        var encoding = options.encoding || "utf8";

        if (encoding !== "utf8"){
            throw "Error, not a utf8 file";
        }

        if (typeof options === "function"){
            callback = options;
        }

        fs.unlink(path, function(err){
            fs.writeFile(path, data, function(err){
                if (err) {
                    console.log(err);
                    callback(_mapError(err));
                }

                stat(path, function(err, stats){
                    if (err){
                        console.log(err);
                        callback(_mapError(err));
                    }
                    callback(null, stats);
                });
            });
        });

    }

    /**
     * Unlink (i.e., permanently delete) the file or directory at the given path,
     * calling back asynchronously with a possibly null FileSystemError string.
     * Directories will be unlinked even when non-empty.
     *
     * @param {string} path
     * @param {function(string)=} callback
     */
    function unlink(path, callback) {
        fs.unlink(path, function(err){
            if (err){
                callback(_mapError(err));
            }
            callback();
        });
    }

    function moveToTrash(path, callback) {
        // unlink(path, callback);
        callback("Trash not implemnted in BrowserFileSystem.");
    }

    function initWatchers(changeCallback, offlineCallback) {
        // Ignore - since this FS is immutable, we're never going to call these
    }

    function watchPath(path, callback) {
        console.warn("File watching is not supported in browser.");
        callback();
    }

    function unwatchPath(path, callback) {
        callback();
    }

    function unwatchAll(callback) {
        callback();
    }

    // Export public API
    exports.showOpenDialog  = showOpenDialog;
    exports.showSaveDialog  = showSaveDialog;
    exports.exists          = exists;
    exports.readdir         = readdir;
    exports.mkdir           = mkdir;
    exports.rename          = rename;
    exports.stat            = stat;
    exports.readFile        = readFile;
    exports.writeFile       = writeFile;
    exports.unlink          = unlink;
    exports.moveToTrash     = moveToTrash;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;

    exports.recursiveWatch    = true;
    exports.normalizeUNCPaths = false;
});
