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

var fs = require("fs");

var _watcherMap = {};

function _log(level, msg) {
    process.send({
        type: "log",
        level: level,
        message: msg
    });
}

console.log     = _log.bind(undefined, "log");
console.info    = _log.bind(undefined, "info");
console.error   = _log.bind(undefined, "error");
console.warn    = _log.bind(undefined, "warn");

/**
 * Un-watch a file or directory.
 * @param {string} path File or directory to unwatch.
 */
function unwatchPath(path) {
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
 * Watch a file or directory.
 * @param {string} path File or directory to watch.
 */
function watchPath(path) {
    if (_watcherMap.hasOwnProperty(path)) {
        return;
    }
    
    try {
        var watcher = fs.watch(path, {persistent: false}, function (event, filename) {
            console.log("child change: " + path);
            process.send({
                type: "change",
                path: path,
                event: event,
                filename: filename
            });
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

process.on("message", function (msg) {
    if (msg) {
        switch (msg.command) {
        case "watchPath":
            watchPath(msg.path);
            break;
        case "unwatchPath":
            unwatchPath(msg.path);
            break;
        case "unwatchAll":
            unwatchAll();
            break;
        default:
            console.warn("Unknown command: " + msg.command);
        }
    }
});

process.stdin.resume();
