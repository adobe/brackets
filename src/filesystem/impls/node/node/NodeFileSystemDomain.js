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
/*global unescape*/

"use strict";

var Promise = require("bluebird"),
    callbackfs = require("fs-extra"),
    fs = Promise.promisifyAll(callbackfs),
    isBinaryFile = require("isbinaryfile");

var _domainManager,
    _watcherMap = {};

function _addStats(obj, stats) {
    obj.isFile = !stats.isDirectory();
    obj.mtime = stats.mtime.getTime();
    obj.size = stats.size;
    return obj;
}

function readdirCmd(path, callback) {
    fs.readdirAsync(path)
        .then(function (names) {
            var statPromises = names.map(function (name) {
                return fs.statAsync([path, name].join(""));
            });
            
            return Promise.settle(statPromises)
                .then(function (inspectors) {
                    return inspectors.reduce(function (total, inspector, index) {
                        if (inspector.isFulfilled()) {
                            total.push(_addStats({name: names[index]}, inspector.value()));
                        }
                        return total;
                    }, []);
                });
        })
        .nodeify(callback);
}

function strencode(data) {
    return unescape(encodeURIComponent(JSON.stringify(data)));
}

function readFileCmd(path, encoding, callback) {
    var readPromise = fs.readFileAsync(path),
        statPromise = fs.statAsync(path);
    
    Promise.join(readPromise, statPromise)
        .spread(function (data, stats) {
            if (isBinaryFile(data, stats.size)) {
                return Promise.rejected("Binary file");
            } else {
                var utf8Data = data.toString(encoding),
                    encodedData = strencode(utf8Data);
                return _addStats({data: encodedData}, stats);
            }
        })
        .nodeify(callback);
}

function statCmd(path, callback) {
    fs.statAsync(path)
        .then(function (stats) {
            return _addStats({}, stats);
        })
        .nodeify(callback);
}

function existsCmd(path, callback) {
    callbackfs.exists(path, callback);
}

function writeFileCmd(path, data, encoding, callback) {
    existsCmd(path, function (exists) {
        fs.writeFileAsync(path, data, {encoding: encoding})
            .then(function () {
                return fs.statAsync(path).then(function (stats) {
                    return _addStats({created: !exists}, stats);
                });
            })
            .nodeify(callback);
    });
}

function mkdirCmd(path, mode, callback) {
    fs.mkdirAsync(path, mode)
        .then(function () {
            return fs.statAsync(path).then(function (stats) {
                return _addStats({}, stats);
            });
        })
        .nodeify(callback);
}

function renameCmd(oldPath, newPath, callback) {
    fs.renameAsync(oldPath, newPath)
        .nodeify(callback);
}

function chmodCmd(path, mode, callback) {
    fs.chmodAsync(path, mode)
        .nodeify(callback);
}

function unlinkCmd(path, callback) {
    fs.removeAsync(path)
        .nodeify(callback);
}

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
            // File/directory changes are emitted as "change" events on the fileSystem domain.
            _domainManager.emitEvent("fileSystem", "change", [path, event, filename]);
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

/**
 * Initialize the "fileSystem" domain.
 */
function init(domainManager) {
    if (!domainManager.hasDomain("fileSystem")) {
        domainManager.registerDomain("fileSystem", {major: 0, minor: 1});
    }
    
    domainManager.registerCommand(
        "fileSystem",
        "readdir",
        readdirCmd,
        true,
        "Read the contents of a directory",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the directory to read"
        }],
        [{
            name: "statObjs",
            type: "Array.<{name: string, isFile: boolean, mtime: number, size: number}>",
            description: "An array of objects, each of which contains a name and stat information"
        }]
    );
    domainManager.registerCommand(
        "fileSystem",
        "readFile",
        readFileCmd,
        true,
        "Read the contents of a file",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the file to read"
        }, {
            name: "encoding",
            type: "string",
            description: "encoding with which to read the file"
        }],
        [{
            name: "statObjs",
            type: "{data: string, isFile: boolean, mtime: number, size: number}",
            description: "An object that contains data and stat information"
        }]
    );
    domainManager.registerCommand(
        "fileSystem",
        "stat",
        statCmd,
        true,
        "Stat a file or directory",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the file or directory to stat"
        }],
        [{
            name: "statObj",
            type: "{isFile: boolean, mtime: number, size: number}",
            description: "An object that contains stat information"
        }]
    );
    domainManager.registerCommand(
        "fileSystem",
        "exists",
        statCmd,
        true,
        "Determine whether a file or directory exists",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the file or directory"
        }],
        [{
            name: "exists",
            type: "boolean",
            description: "A boolean that indicates whether or not the file or directory exists"
        }]
    );
    domainManager.registerCommand(
        "fileSystem",
        "writeFile",
        writeFileCmd,
        true,
        "Write data to a file with a given encoding",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the file or directory"
        }, {
            name: "data",
            type: "string",
            description: "data to write"
        }, {
            name: "encoding",
            type: "string",
            description: "encoding with which to write the data"
        }],
        [{
            name: "statObj",
            type: "{isFile: boolean, mtime: number, size: number}",
            description: "An object that contains stat information"
        }]
    );
    domainManager.registerCommand(
        "fileSystem",
        "mkdir",
        mkdirCmd,
        true,
        "Create a new directory with a given mode",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the directory to create"
        }, {
            name: "mode",
            type: "number",
            description: "mode with which to create the directory"
        }],
        [{
            name: "statObj",
            type: "{isFile: boolean, mtime: number, size: number}",
            description: "An object that contains stat information for the new directory"
        }]
    );
    domainManager.registerCommand(
        "fileSystem",
        "chmod",
        chmodCmd,
        true,
        "Chnage the mode of the given file",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the file or directory"
        }, {
            name: "mode",
            type: "number",
            description: "mode to which the file or directory should be changed"
        }]
    );
    domainManager.registerCommand(
        "fileSystem",
        "rename",
        renameCmd,
        true,
        "Rename a file or directory",
        [{
            name: "oldPath",
            type: "string",
            description: "absolute filesystem path of the directory to rename"
        }, {
            name: "newPath",
            type: "string",
            description: "new absolute filesystem path"
        }]
    );
    domainManager.registerCommand(
        "fileSystem",
        "unlink",
        unlinkCmd,
        true,
        "Delete a file or directory",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the directory to delete"
        }]
    );
    domainManager.registerCommand(
        "fileSystem",
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
        "fileSystem",
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
        "fileSystem",
        "unwatchAll",
        unwatchAll,
        false,
        "Stop watching all files and directories"
    );
    domainManager.registerEvent(
        "fileSystem",
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

