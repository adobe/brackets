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

/*jslint node: true */

"use strict";

var os = require("os");
var watcherImpl;
if (process.platform === "win32") {
    watcherImpl = require("./ChokidarWatcher"); // TODO: "./CSharpWatcher"
} else {
    watcherImpl = require("./ChokidarWatcher");
}

var _domainManager,
    _watcherMap = {};

/**
 * @private
 * Un-watch a file or directory.
 * @param {string} path File or directory to unwatch.
 */
function _unwatchPath(path) {
    var watcher = _watcherMap[path];

    if (watcher) {
        try {
            watcher.close();
        } catch (err) {
            console.warn("Failed to unwatch file " + path + ": " + (err && err.message));
        } finally {
            delete _watcherMap[path];
        }
    }
}

/**
 * Un-watch a file or directory. For directories, unwatch all descendants.
 * @param {string} path File or directory to unwatch.
 */
function unwatchPath(path) {
    Object.keys(_watcherMap).forEach(function (keyPath) {
        if (keyPath.indexOf(path) === 0) {
            _unwatchPath(keyPath);
        }
    });
}

/**
 * Watch a file or directory.
 * @param {string} path File or directory to watch.
 * @param {array} ignored List of entries to ignore during watching.
 */
function watchPath(path, ignored) {
    return watcherImpl.watchPath(path, ignored, _watcherMap);
}

/**
 * Un-watch all files and directories.
 */
function unwatchAll() {
    var path;

    for (path in _watcherMap) {
        if (_watcherMap.hasOwnProperty(path)) {
            unwatchPath(path);
        }
    }
}

/**
 * Initialize the "fileWatcher" domain.
 * The fileWatcher domain handles watching and un-watching directories.
 */
function init(domainManager) {
    if (!domainManager.hasDomain("fileWatcher")) {
        domainManager.registerDomain("fileWatcher", {major: 0, minor: 1});
    }

    domainManager.registerCommand(
        "fileWatcher",
        "watchPath",
        watchPath,
        false,
        "Start watching a file or directory",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the file or directory to watch"
        }, {
            name: "ignored",
            type: "array",
            description: "list of path to ignore"
        }]
    );
    domainManager.registerCommand(
        "fileWatcher",
        "unwatchPath",
        unwatchPath,
        false,
        "Stop watching a single file or a directory and it's descendants",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the file or directory to unwatch"
        }]
    );
    domainManager.registerCommand(
        "fileWatcher",
        "unwatchAll",
        unwatchAll,
        false,
        "Stop watching all files and directories"
    );
    domainManager.registerEvent(
        "fileWatcher",
        "change",
        [
            {name: "event", type: "string"},
            {name: "parentDirPath", type: "string"},
            {name: "entryName", type: "string"},
            {name: "statsObj", type: "object"}
        ]
    );

    _domainManager = domainManager;
}

exports.init = init;
