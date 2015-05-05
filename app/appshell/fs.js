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
    stat: stat,
    unlink: unlink,
    writeFile: writeFile
}, ERR_CONSTANTS);
