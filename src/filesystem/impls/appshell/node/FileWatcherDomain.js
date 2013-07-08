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

var _domainManager,
    _watcherMap = {};

function watchPath(path) {
    _watcherMap[path] = fs.watch(path, function (event, filename) {
        _domainManager.emitEvent("fileWatcher", "change", [path, event, filename]);
    });
}

function unwatchPath(path) {
    var watcher = _watcherMap[path];
    
    if (watcher) {
        watcher.close();
        delete _watcherMap[path];
    }
}

function unwatchAll() {
    var path;
    
    for (path in _watcherMap) {
        if (_watcherMap.hasOwnProperty(path)) {
            unwatchPath(path);
        }
    }
}

/**
 * Initialize the "extensions" domain.
 * The extensions domain handles downloading, unpacking/verifying, and installing extensions.
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

exports.init = init;

