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

/*eslint-env node */
/*jslint node: true */

"use strict";

var _watcherMap = {};
var _domainManager = null;
var _watcherImpl = null;

function setDomainManager(dm) {
    _domainManager = dm;
}

function setWatcherImpl(impl) {
    _watcherImpl = impl;
}

/**
 * Transform Node's native fs.stats to a format that can be sent through domain
 * @param {stats} nodeFsStats Node's fs.stats result
 * @return {object} Can be consumed by new FileSystemStats(object); in Brackets
 */
function normalizeStats(nodeFsStats) {
    // current shell's stat method floors the mtime to the nearest thousand
    // which causes problems when comparing timestamps
    // so we have to round mtime to the nearest thousand too
    var mtime = Math.floor(nodeFsStats.mtime.getTime() / 1000) * 1000;

    // from shell: If "filename" is a symlink,
    // realPath should be the actual path to the linked object
    // not implemented in shell yet
    return {
        isFile: nodeFsStats.isFile(),
        isDirectory: nodeFsStats.isDirectory(),
        mtime: mtime,
        size: nodeFsStats.size,
        realPath: null,
        hash: mtime
    };
}

/**
 * Un-watch a file or directory.
 * @private
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
 * @param {Array<string>} ignored List of entries to ignore during watching.
 */
function watchPath(path, ignored) {
    if (_watcherMap.hasOwnProperty(path)) {
        return;
    }
    return _watcherImpl.watchPath(path, ignored, _watcherMap, _domainManager);
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

function emitChange(event, parentDirPath, entryName, nodeFsStats) {
    // make sure stats are normalized for domain transfer
    var statsObj = nodeFsStats ? normalizeStats(nodeFsStats) : null;
    _domainManager.emitEvent("fileWatcher", "change", [event, parentDirPath, entryName, statsObj]);
}

exports.setDomainManager = setDomainManager;
exports.setWatcherImpl = setWatcherImpl;
exports.unwatchPath = unwatchPath;
exports.watchPath = watchPath;
exports.unwatchAll = unwatchAll;
exports.emitChange = emitChange;
