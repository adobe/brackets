/*
 * This copies the implementation of VSCode
 * https://github.com/Microsoft/vscode/blob/master/src/vs/workbench/services/files/node/watcher/win32/csharpWatcherService.ts
 */

/*jslint node: true */

"use strict";

var fs = require("fs");
var fspath = require("path");
var cp = require("child_process");
var anymatch = require('anymatch');
var unwatchPath = require("./FileWatcherManager").unwatchPath;

function buildMatcher(ignored) {
    // in case of a glob like **/.git we want also to ignore its contents **/.git/**
    return anymatch(ignored.concat(ignored.map(function (glob) {
        return glob + "/**";
    })));
}

function watchPath(path, ignored, _watcherMap, _domainManager) {

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
            fs.stat(absolutePath, function (err, stats) {
                if (err) {
                    console.warn("CSharpWatcher err getting stats: " + err.toString());
                }
                _domainManager.emitEvent("fileWatcher", "change", [event, parentDirPath, entryName, stats]);
            });
        } else {
            _domainManager.emitEvent("fileWatcher", "change", [event, parentDirPath, entryName, null]);
        }
    }

    function onError(err) {
        console.warn("CSharpWatcher process error: " + err.toString());
        unwatchPath(path);
    }

    function onExit(code, signal) {
        if (!closing || signal !== "SIGTERM") {
            console.warn("CSharpWatcher terminated unexpectedly with code: " + code + ", signal: " + signal);
        }
        unwatchPath(path);
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
