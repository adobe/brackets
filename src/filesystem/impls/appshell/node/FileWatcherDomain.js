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

var fs = require("fs"),
    child_process = require("child_process");

var MAX_PATHS_PER_CHILD = 256;

var _domainManager,
    _childMap = {}, // maps pids to {child, paths} pairs
    _pathMap = {};  // maps paths to pids

function emitChangeEvent(path, event, filename) {
    // File/directory changes are emitted as "change" events on the fileWatcher domain.
    _domainManager.emitEvent("fileWatcher", "change", [path, event, filename]);
}

function handleMessage(pid, msg) {
    switch (msg.type) {
    case "change":
        emitChangeEvent(msg.path, msg.event, msg.filename);
        break;
    case "log":
        console[msg.level]("Child " + pid + ": " + msg.message);
        break;
    default:
        console.warn("Received unknown message from child: ", msg);
    }
}

function getChildForPath(path) {
    var child;
    
    if (!_pathMap.hasOwnProperty(path)) {
        // try to find an available child
        var foundChild = Object.keys(_childMap).some(function (pid) {
            var childObj = _childMap[pid];
            
            if (Object.keys(childObj.paths).length < MAX_PATHS_PER_CHILD) {
                childObj.paths.push(path);
                _pathMap[path] = pid;
                child = childObj.child;
                return true;
            }
            return false;
        });
        
        // no child was available; create a new one
        if (!foundChild) {
            child = child_process.fork(__dirname + "/ChildWatcher.js", [], {silent: true});
            console.log("Forked child process: " + child.pid);
            
            child.on("message", function (msg) {
                handleMessage(child.pid, msg);
            });
            
            child.on("error", function (msg) {
                console.log("Child " + child.pid + " error: ", msg);
            });
            
            child.on("disconnect", function () {
                console.log("Child " + child.pid + " disconnect");
            });
            
            child.on("exit", function (code, signal) {
                console.log("Child " + child.pid + " exited: ", code, signal);
            });
            
            _childMap[child.pid] = {
                child: child,
                paths: [path]
            };
            
            _pathMap[path] = child.pid;
        }
    } else {
        child = _childMap[_pathMap[path]].child;
    }
    
    return child;
}

/**
 * Un-watch a file or directory.
 * @param {string} path File or directory to unwatch.
 */
function unwatchPath(path) {
    var child = getChildForPath(path);
    
    child.send({
        command: "unwatchPath",
        path: path
    });
    
}

/**
 * Watch a file or directory.
 * @param {string} path File or directory to watch.
 */
function watchPath(path) {
    var child = getChildForPath(path);
    
    child.send({
        command: "watchPath",
        path: path
    });
}

/**
 * Un-watch all files and directories.
 */
function unwatchAll() {
    Object.keys(_childMap).forEach(function (pid) {
        _childMap[pid].child.send({
            command: "unwatchAll"
        });
        
        _childMap[pid].paths = [];
    });
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
        "Stop watching a file or directory",
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

process.on("exit", function () {
    Object.keys(_childMap).forEach(function (pid) {
        _childMap[pid].child.kill();
    });
});

exports.init = init;

