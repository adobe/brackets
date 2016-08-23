/*jslint node: true */

"use strict";

var fspath = require("path");
var chokidar = require("chokidar");
var fwm = require("./FileWatcherManager");

function watchPath(path, ignored, _watcherMap) {
    try {
        var watcher = chokidar.watch(path, {
            persistent: true,
            ignoreInitial: true,
            ignorePermissionErrors: true,
            followSymlinks: true,
            ignored: ignored,
            interval: 1000, // while not used in normal cases, if any error causes chokidar to fallback to polling, increase its intervals
            binaryInterval: 1000
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
            // make sure it's normalized
            filename = filename.replace(/\\/g, "/");
            var parentDirPath = fspath.dirname(filename) + "/";
            var entryName = fspath.basename(filename);
            fwm.emitChange(event, parentDirPath, entryName, nodeFsStats);
        });

        _watcherMap[path] = watcher;

        watcher.on("error", function (err) {
            console.error("Error watching file " + path + ": " + (err && err.message));
            fwm.unwatchPath(path);
        });
    } catch (err) {
        console.warn("Failed to watch file " + path + ": " + (err && err.message));
    }
}

exports.watchPath = watchPath;
