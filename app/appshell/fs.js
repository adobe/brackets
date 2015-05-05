/*jshint globalstrict:true, node:true*/

// working on this file

"use strict";

var _ = require("lodash");
var fs = require("fs-extra");
var trash = require("trash");
var utils = require("../utils");

var remote = require("remote");
var dialog = remote.require("dialog");

var ERR_CONSTANTS = {
    ERR_BROWSER_NOT_INSTALLED: 11,
    ERR_CANT_READ: 4,
    ERR_CANT_WRITE: 6,
    ERR_FILE_EXISTS: 10,
    ERR_INVALID_PARAMS: 2,
    ERR_NOT_DIRECTORY: 9,
    ERR_NOT_FILE: 8,
    ERR_NOT_FOUND: 3,
    ERR_OUT_OF_SPACE: 7,
    ERR_UNKNOWN: 1,
    ERR_UNSUPPORTED_ENCODING: 5,
    NO_ERROR: 0
};

// TODO: there's a complete map of these in node
var ERR_MAP = {
    ENOENT: "ERR_NOT_FOUND",
    EPERM: "ERR_CANT_READ",
    EACCES: "ERR_CANT_READ",
    EROFS: "ERR_CANT_WRITE",
    ENOSPC: "ERR_OUT_OF_SPACE"
};

function _mapError(isWriting, callback, err, result) {
    if (err) {
        var mapping = ERR_MAP[err.code];
        if (mapping) {
            if (isWriting && mapping === "ERR_CANT_READ") {
                mapping = "ERR_CANT_WRITE";
            }
            err = ERR_CONSTANTS[mapping];
        } else {
            console.log("Unmapped error code received in fs: " + err.code + "\n" + err.stack);
        }
    }
    callback(err, result);
}

function chmod(path, mode, callback) {
    fs.chmod(path, mode, _.partial(_mapError, true, callback));
}

/*
function copyFile(src, dest, callback) {
    fs.copy(src, dest, _.partial(_mapError, true, callback));
}
*/

/*
function isNetworkDrive(path, callback) {
    // TODO: implement
    callback(null, false);
}
*/

/*
function makedir(path, mode, callback) {
    fs.ensureDir(path, function (err) {
        if (!err && mode) {
            fs.chmod(path, mode, _.partial(_mapError, true, callback));
        } else {
            _mapError(true, callback, err);
        }
    });
}
*/

/*
function moveToTrash(path, callback) {
    trash([path], _.partial(_mapError, true, callback));
}
*/

function readdir(path, callback) {
    fs.readdir(path, _.partial(_mapError, false, callback));
}

function readFile(path, encoding, callback) {
    fs.readFile(path, {
        encoding: encoding || "utf8"
    }, _.partial(_mapError, false, callback));
}

function rename(oldPath, newPath, callback) {
    fs.rename(oldPath, newPath, _.partial(_mapError, true, callback));
}

function showOpenDialog(allowMultipleSelection, chooseDirectory, title, initialPath, fileTypes, callback) {
    var properties = [];
    if (chooseDirectory) {
        properties.push("openDirectory");
    } else {
        properties.push("openFile");
    }
    if (allowMultipleSelection) {
        properties.push("multiSelections");
    }
    
    // TODO: I don't think defaultPath and filters work right now - we should test that
    // Also, it doesn't return an error code on failure any more (and doesn't pass one to the callback as well)
    return dialog.showOpenDialog({
        title: title,
        defaultPath: initialPath,
        filters: fileTypes,
        properties: properties
    }, function (paths) {
        callback(null, paths.map(utils.convertWindowsPathToUnixPath));
    });
}

function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
    // TODO: Implement proposedNewFilename
    // TODO: I don't think defaultPath works right now - we should test that
    // Also, it doesn't return an error code on failure any more (and doesn't pass one to the callback as well)
    return dialog.showSaveDialog({
        title: title,
        defaultPath: initialPath
    }, function (path) {
        callback(null, utils.convertWindowsPathToUnixPath(path));
    });
}

function stat(path, callback) {
    fs.lstat(path, function (err, stat) {
        if (stat) {
            // TODO: Implement realPath. If "filename" is a symlink,
            // realPath should be the actual path to the linked object.
            if (stat.isSymbolicLink()) {
                return callback(new Error("realPath for symbolic link is not implemented in appshell.fs.stat"));
            }
            stat.realPath = null;
        }
        _mapError(false, callback, err, stat);
    });
}

function unlink(path, callback) {
    fs.unlink(path, _.partial(_mapError, true, callback));
}

function writeFile(path, data, encoding, callback) {
    fs.writeFile(path, data, {
        encoding: encoding || "utf8"
    }, _.partial(_mapError, true, callback));
}

module.exports = _.assign({
    chmod: chmod,
    // copyFile: copyFile,
    // isNetworkDrive: isNetworkDrive,
    // makedir: makedir,
    // moveToTrash: moveToTrash,
    readdir: readdir,
    readFile: readFile,
    rename: rename,
    showOpenDialog: showOpenDialog,
    showSaveDialog: showSaveDialog,
    stat: stat,
    unlink: unlink,
    writeFile: writeFile
}, ERR_CONSTANTS);
