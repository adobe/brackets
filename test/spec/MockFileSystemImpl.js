/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var FileSystemError     = require("filesystem/FileSystemError"),
        MockFileSystemModel = require("./MockFileSystemModel");

    // A sychronous model of a file system
    var _model;

    // Watcher change callback function
    var _changeCallback;

    // Watcher offline callback function
    var _offlineCallback;

    // Indicates whether, by default, the FS should perform UNC Path normalization
    var _normalizeUNCPathsDefault = false;

    // Indicates whether, by default, the FS should perform watch and unwatch recursively
    var _recursiveWatchDefault = true;

    // Callback hooks, set in when(). See when() for more details.
    var _hooks;

    function _getHookEntry(method, path) {
        return _hooks[method] && _hooks[method][path];
    }

    function _getCallback(method, path, cb) {
        var entry = _getHookEntry(method, path),
            result = entry && entry(cb);

        if (!result) {
            result = cb;
        }
        return result;
    }

    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        // Not implemented
        callback(null, null);
    }

    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        // Not implemented
        callback(null, null);
    }

    function exists(path, callback) {
        var cb = _getCallback("exists", path, callback);
        cb(null, _model.exists(path));
    }

    function readdir(path, callback) {
        var cb = _getCallback("readdir", path, callback);

        if (!_model.exists(path)) {
            cb(FileSystemError.NOT_FOUND);
            return;
        }

        var contents = _model.readdir(path),
            trimmedPath = path.substring(0, path.length - 1),
            stats = contents.map(function (name) {
                return _model.stat(trimmedPath + name);
            });

        cb(null, contents, stats, []);
    }

    function mkdir(path, mode, callback) {
        if (typeof (mode) === "function") {
            callback = mode;
            mode = null;
        }

        var cb = _getCallback("mkdir", path, callback);

        if (_model.exists(path)) {
            cb(FileSystemError.ALREADY_EXISTS);
        } else {
            _model.mkdir(path);
            cb(null, _model.stat(path));
        }
    }

    function rename(oldPath, newPath, callback) {
        var cb = _getCallback("rename", oldPath, callback);

        if (_model.exists(newPath)) {
            cb(FileSystemError.ALREADY_EXISTS);
        } else if (!_model.exists(oldPath)) {
            cb(FileSystemError.NOT_FOUND);
        } else {
            _model.rename(oldPath, newPath);
            cb(null);
        }
    }

    function stat(path, callback) {
        var cb = _getCallback("stat", path, callback);

        if (!_model.exists(path)) {
            cb(FileSystemError.NOT_FOUND);
        } else {
            cb(null, _model.stat(path));
        }
    }

    function readFile(path, options, callback) {
        if (typeof (options) === "function") {
            callback = options;
            options = null;
        }

        var cb = _getCallback("readFile", path, callback);

        if (!_model.exists(path)) {
            cb(FileSystemError.NOT_FOUND);
        } else {
            cb(null, _model.readFile(path), _model.stat(path));
        }
    }

    function writeFile(path, data, options, callback) {
        if (typeof (options) === "function") {
            callback = options;
            options = null;
        }

        var cb = _getCallback("writeFile", path, callback);

        if (_model.exists(path) && options.hasOwnProperty("expectedHash") && options.expectedHash !== _model.stat(path)._hash) {
            if (options.hasOwnProperty("expectedContents")) {
                if (options.expectedContents !== _model.readFile(path)) {
                    cb(FileSystemError.CONTENTS_MODIFIED);
                    return;
                }
            } else {
                cb(FileSystemError.CONTENTS_MODIFIED);
                return;
            }
        }

        _model.writeFile(path, data);
        cb(null, _model.stat(path));
    }

    function unlink(path, callback) {
        var cb = _getCallback("unlink", path, callback);

        if (!_model.exists(path)) {
            cb(FileSystemError.NOT_FOUND);
        } else {
            _model.unlink(path);
            cb(null);
        }
    }

    function initWatchers(changeCallback, offlineCallback) {
        _changeCallback = changeCallback;
        _offlineCallback = offlineCallback;
    }

    function watchPath(path, ignored, callback) {
        var cb = _getCallback("watchPath", path, callback);

        _model.watchPath(path);
        cb(null);
    }

    function unwatchPath(path, ignored, callback) {
        var cb = _getCallback("unwatchPath", path, callback);
        _model.unwatchPath(path);
        cb(null);
    }

    function unwatchAll(callback) {
        var cb = _getCallback("unwatchAll", null, callback);
        _model.unwatchAll();
        cb(null);
    }


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
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;

    exports.normalizeUNCPaths = _normalizeUNCPathsDefault;
    exports.recursiveWatch = _recursiveWatchDefault;

    // Test methods
    exports.reset = function () {
        _model = new MockFileSystemModel();
        _hooks = {};
        _changeCallback = null;
        _offlineCallback = null;

        _model.on("change", function (event, path) {
            if (_changeCallback) {
                var cb = _getCallback("change", path, _changeCallback);
                cb(path, _model.stat(path));
            }
        });

        exports.normalizeUNCPaths = _normalizeUNCPathsDefault;
        exports.recursiveWatch = _recursiveWatchDefault;

        // Allows unit tests to manipulate the filesystem directly in order to
        // simulate external change events
        exports._model = _model;
    };

    // Simulate file watchers going offline
    exports.goOffline = function () {
        if (_offlineCallback) {
            _offlineCallback();
        }
    };

    /**
     * Add callback hooks to be used when specific methods are called with a
     * specific path.
     *
     * @param {string} method The name of the method. The special name "change"
     *          may be used to hook the "change" event handler as well.
     * @param {string} path The path that must be matched
     * @param {function} getCallback A function that has one parameter and
     *           must return a callback function.
     *
     * Here is an example that delays the callback by 300ms when writing a file
     * named "/foo.txt".
     *
     * function delayedCallback(cb) {
     *     return function () {
     *         var args = arguments;
     *         setTimeout(function () {
     *             cb.apply(null, args);
     *         }, 300);
     *     };
     * }
     *
     * MockFileSystem.when("writeFile", "/foo.txt", delayedCallback);
     */
    exports.when = function (method, path, getCallback) {
        if (!_hooks[method]) {
            _hooks[method] = {};
        }
        _hooks[method][path] = getCallback;
    };
});
