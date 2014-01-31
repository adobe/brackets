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


/*jslint vars: true, plusplus: true, devel: true, node: true, nomen: true, indent: 4, maxerr: 50 */

"use strict";

var fspath = require("path"),
    fs = require("fs"),
    fsevents;

/*
 * NOTE: The fsevents package is a temporary solution for file-watching on darwin.
 * Node's native fs.watch call would be preferable, but currently has a hard limit
 * of 451 watched directories and fails silently after that! In the next stable
 * version of Node (0.12), fs.watch on darwin will support a new "recursive" option
 * that will allow us to only request a single watched path per directory structure.
 * When that is stable, we should switch back to fs.watch for all platforms, and
 * we should use the recursive option where available. As of January 2014, the
 * current experimental Node branch (0.11) only supports the recursive option for
 * darwin.
 * 
 * In the meantime, the fsevents package makes direct use of the Mac OS fsevents
 * API to provide file watching capabilities. Its behavior is also recursive
 * (like fs.watch with the recursive option), but the events it emits are not
 * exactly the same as those emitted by Node watchers. Consequently, we require,
 * for now, dual implementations of the FileWatcher domain. 
 * 
 * ALSO NOTE: the fsevents package as installed by NPM is not suitable for
 * distribution with Brackets! The problem is that the native code embedded in
 * the fsevents module is compiled by default for x86-64, but the Brackets-node
 * process is compiled for x86-32. Consequently, the fsevents module must be
 * compiled manually, which is why it is checked into Brackets source control
 * and not managed by NPM. Changing compilation from 64- to 32-bit just requires
 * changing a couple of definitions in the .gyp file used to build fsevents.
 */
if (process.platform === "darwin") {
    fsevents = require("fsevents");
} else if (process.platform === "win32") {
    fsevents = require("fsevents_win/fsevents_win");
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
            if (fsevents) {
                watcher.stop();
            } else {
                watcher.close();
            }
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
 */
function watchPath(path) {
    if (_watcherMap.hasOwnProperty(path)) {
        return;
    }
        
    try {
        var watcher;
        
        if (fsevents) {
            watcher = fsevents(path);
            watcher.on("change", function (filename, info) {
                var parent = filename && (fspath.dirname(filename) + "/"),
                    name = filename && fspath.basename(filename),
                    type;
                
                switch (info.event) {
                case "modified":    // triggered by file content changes
                case "unknown":     // triggered by metatdata-only changes
                    type = "change";
                    break;
                default:
                    type = "rename";
                }
                
                _domainManager.emitEvent("fileWatcher", "change", [parent, type, name]);
            });
        } else {
            watcher = fs.watch(path, {persistent: false}, function (event, filename) {
                // File/directory changes are emitted as "change" events on the fileWatcher domain.
                _domainManager.emitEvent("fileWatcher", "change", [path, event, filename]);
            });
        }

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
            {name: "path", type: "string"},
            {name: "event", type: "string"},
            {name: "filename", type: "string"}
        ]
    );
    
    _domainManager = domainManager;
}

exports.init = init;
