/*jshint globalstrict:true, node:true*/

"use strict";

process.on("uncaughtException", function (err) {
    process.send({msg: "log", data: "uncaughtException in FileWatcherWorker: " + err.stack});
    process.exit(1);
});

function send(msg, data) {
    process.send({msg: msg, data: data});
}

var fspath = require("path");
var watch = require("watch");
var fsevents = null;

if (process.platform === "darwin") {
    // TODO: build this automatically for electron
    // fsevents = require("fsevents");
} else if (process.platform === "win32") {
    // https://github.com/adobe/brackets/wiki/Working-with-fsevents_win.node
    // TODO: build this automatically for electron
    // fsevents = require("fsevents_win/fsevents_win");
}

var _watcherMap = {};

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
                watcher.stop();
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
function unwatchPath(path, callback) {
    Object.keys(_watcherMap).forEach(function (keyPath) {
        if (keyPath.indexOf(path) === 0) {
            _unwatchPath(keyPath);
        }
    });
    callback(null, true);
}

/**
 * Watch a file or directory.
 * @param {string} path File or directory to watch.
 */
function watchPath(path, callback) {
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
                    type = "changed";
                    break;
                default:
                    type = "renamed";
                }

                send("change", [parent, type, name]);
            });
            watcher.on("error", function (err) {
                console.error("Error watching file " + path + ": " + (err && err.message));
                unwatchPath(path);
            });
            return callback(null, true);
        }

        // use watch module by default, it wraps fs.watch to make it consistent across platforms
        // TODO: make use of supported options
        // - ignoreDotFiles
        // - filter
        // - ignoreUnreadableDir
        // - ignoreNotPermitted
        // - ignoreDirectoryPattern
        watch.createMonitor(path, function (monitor) {
            // monitor.files['/home/mikeal/.zshrc'] // Stat object for my zshrc.
            // monitor.stop(); // Stop watching
            monitor.on("created", function (filename, stat) {
                var parent = filename && (fspath.dirname(filename) + "/"),
                    name = filename && fspath.basename(filename);
                send("change", [stat, parent, "created", name]);
            });
            monitor.on("changed", function (filename, curr, prev) {
                var parent = filename && (fspath.dirname(filename) + "/"),
                    name = filename && fspath.basename(filename);
                send("change", [curr, parent, "changed", name]);
            });
            monitor.on("removed", function (filename, stat) {
                var parent = filename && (fspath.dirname(filename) + "/"),
                    name = filename && fspath.basename(filename);
                send("change", [stat, parent, "removed", name]);
            });
            _watcherMap[path] = monitor;
            callback(null, true);
        });

    } catch (err) {
        callback(new Error("Failed to watch file " + path + ": " + (err && err.message)));
    }
}

/**
 * Un-watch all files and directories.
 */
function unwatchAll(callback) {
    var path;

    for (path in _watcherMap) {
        if (_watcherMap.hasOwnProperty(path)) {
            unwatchPath(path);
        }
    }

    callback(null, true);
}

// process communication implementation

process.on("message", function (obj) {
    var callbackId;
    var msg = obj.msg;
    var data = obj.data;

    if (msg.indexOf("!") !== -1) {
        var spl = msg.split("!");
        msg = spl[0];
        callbackId = parseInt(spl[1], 10);
    }

    if (msg === "watchPath") {
        watchPath(data, function () {
            if (callbackId != null) {
                send("callback!" + callbackId, arguments);
            }
        });
    } else if (msg === "unwatchPath") {
        unwatchPath(data, function () {
            if (callbackId != null) {
                send("callback!" + callbackId, arguments);
            }
        });
    } else if (msg === "unwatchAll") {
        unwatchAll(function () {
            if (callbackId != null) {
                send("callback!" + callbackId, arguments);
            }
        });
    } else {
        send("log", "FileWatcherWorker got unsupported message: " + msg);
    }
});
