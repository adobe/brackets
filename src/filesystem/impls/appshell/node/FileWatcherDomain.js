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

var os = require("os");
var watcherManager = require("./FileWatcherManager");
var watcherImpl;
if (process.platform === "win32") {
    watcherImpl = require("./CSharpWatcher");
} else {
    watcherImpl = require("./ChokidarWatcher");
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
        watcherManager.watchPath,
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
        watcherManager.unwatchPath,
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
        watcherManager.unwatchAll,
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

    watcherManager.setDomainManager(domainManager);
    watcherManager.setWatcherImpl(watcherImpl);

}

exports.init = init;
