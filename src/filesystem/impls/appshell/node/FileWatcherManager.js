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

exports.setDomainManager = setDomainManager;
exports.setWatcherImpl = setWatcherImpl;
exports.unwatchPath = unwatchPath;
exports.watchPath = watchPath;
exports.unwatchAll = unwatchAll;