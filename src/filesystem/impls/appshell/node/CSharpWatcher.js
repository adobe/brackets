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

/*
 * Code for working with CodeHelper.exe was inspired by:
 * https://github.com/Microsoft/vscode/blob/314e122b16c5c1ca0288c8006e9c9c3039a51cd7/src/vs/workbench/services/files/node/watcher/win32/csharpWatcherService.ts
 */

/*eslint-env node */
/*jslint node: true */

"use strict";

var fs = require("fs");
var fspath = require("path");
var cp = require("child_process");
var anymatch = require('anymatch');
var FileWatcherManager = require("./FileWatcherManager");

function buildMatcher(ignored) {
    // in case of a glob like **/.git we want also to ignore its contents **/.git/**
    return anymatch(ignored.concat(ignored.map(function (glob) {
        return glob + "/**";
    })));
}

function watchPath(path, ignored, _watcherMap) {

    var ignoreMatcher = buildMatcher(ignored);
    var closing = false;

    function processLine(line) {
        if (line === "") {
            return;
        }

        var parts = line.split("|");
        if (parts.length !== 2) {
            console.warn("CSharpWatcher unexpected line: '" + line + "'");
            return;
        }

        var type = parseInt(parts[0], 10);
        // convert it back to unix path and clear trailing whitespace
        var absolutePath = parts[1].replace(/\\/g, "/").replace(/\s+$/g, "");

        // convert type to an event
        var event;
        switch (type) {
        case 0:
            event = "changed";
            break;
        case 1:
            event = "created";
            break;
        case 2:
            event = "deleted";
            break;
        default:
            console.warn("CSharpWatcher event type: " + type);
            return;
        }

        // make sure ignored events are not emitted
        if (ignoreMatcher(absolutePath)) {
            return;
        }

        var parentDirPath = fspath.dirname(absolutePath) + "/";
        var entryName = fspath.basename(absolutePath);

        // we need stats object for changed event
        if (event === "changed") {
            fs.stat(absolutePath, function (err, nodeFsStats) {
                if (err) {
                    console.warn("CSharpWatcher err getting stats: " + err.toString());
                }
                FileWatcherManager.emitChange(event, parentDirPath, entryName, nodeFsStats);
            });
        } else {
            FileWatcherManager.emitChange(event, parentDirPath, entryName, null);
        }
    }

    function onError(err) {
        console.warn("CSharpWatcher process error: " + err.toString());
        FileWatcherManager.unwatchPath(path);
    }

    function onExit(code, signal) {
        if (!closing || signal !== "SIGTERM") {
            console.warn("CSharpWatcher terminated unexpectedly with code: " + code + ", signal: " + signal);
        }
        FileWatcherManager.unwatchPath(path);
    }

    try {

        var args = [
            // fspath.resolve will normalize slashes to windows format
            fspath.resolve(path)
        ];
        var handle = cp.spawn(fspath.resolve(__dirname, "win32", "CodeHelper.exe"), args);

        // Events over stdout
        handle.stdout.on("data", function (buffer) {
            var lines = buffer.toString("utf8").split("\n");
            while (lines.length > 0) {
                processLine(lines.shift());
            }
        });

        // Errors
        handle.on("error", onError);
        handle.stderr.on("data", onError);

        // Exit
        handle.on("exit", onExit);

        // Add handler for closing to the _watcherMap
        _watcherMap[path] = {
            close: function () {
                closing = true;
                handle.kill();
            }
        };

    } catch (err) {
        console.warn("Failed to watch file " + path + ": " + (err && err.message));
    }
}

exports.watchPath = watchPath;
