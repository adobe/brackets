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

var fspath = require("path");
var fs = require("fs");
var os = require("os");
var chokidar = require('chokidar');

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
 * Transform Node's native fs.stats to a format that can be sent through domain
 * @param {stats} Node's fs.stats result
 * @return {object} Can be consumed by new FileSystemStats(object); in Brackets
 */
function normalizeStats(nodeFsStats) {
    // from shell: If "filename" is a symlink,
    // realPath should be the actual path to the linked object
    // not implemented in shell yet
    return {
        isFile: nodeFsStats.isFile(),
        isDirectory: nodeFsStats.isDirectory(),
        mtime: nodeFsStats.mtime,
        size: nodeFsStats.size,
        realPath: null,
        hash: nodeFsStats.mtime.getTime()
    };
}

/**
 * Watch a file or directory.
 * @param {string} path File or directory to watch.
 * @param {array} ignored List of File or directory to NOT watch.
 */
function watchPath(path, ignored) {
    if (_watcherMap.hasOwnProperty(path)) {
        return;
    }

    try {
        var watcher = chokidar.watch(path, {
            persistent: true,
            ignoreInitial: true,
            ignorePermissionErrors: true,
            followSymlinks: true,
            ignored: ignored,
            usePolling: process.platform === "win32"
        });

        watcher.on("all", function (type, filename, nodeFsStats) {
            var event;
            switch (type) {
            case "change":
                event = "changed";
                break;
            case "add":
            case "addDir":
                event = "created";
                break;
            case "unlink":
            case "unlinkDir":
                event = "deleted";
                break;
            default:
                event = null;
            }
            if (!event || !filename) {
                return;
            }
            // make sure stats are normalized for domain transfer
            var statsObj = nodeFsStats ? normalizeStats(nodeFsStats) : null;
            // make sure it's normalized
            filename = filename.replace(/\\/g, "/");
            var parentDirPath = fspath.dirname(filename) + "/";
            var entryName = fspath.basename(filename);
            _domainManager.emitEvent("fileWatcher", "change", [event, parentDirPath, entryName, statsObj]);
        });

        _watcherMap[path] = watcher;

        watcher.on("error", function (err) {
            console.error("Error watching file " + path + ": " + (err && err.message));
            unwatchPath(path);
        });
    } catch (err) {
        console.warn("Failed to watch file " + path + ": " + (err && err.message));
    }
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
