/*jshint globalstrict:true, node:true*/

"use strict";

var fs = require("fs-extra");
var isbinaryfile = require("isbinaryfile");
var stripBom = require("strip-bom");
var trash = require("trash");
var utils = require("../utils");
var remote = require("remote");
var dialog = remote.require("dialog");

/*
    additions to native fs provided by node
    to support functionality required by brackets
*/

var fsAdditions = module.exports = {};

fsAdditions.isBinaryFile = function (filename, callback) {
    isbinaryfile(filename, callback);
};

fsAdditions.isBinaryFileSync = function (filename) {
    return isbinaryfile(filename);
};

fsAdditions.isEncodingSupported = function (encoding) {
    return ["ascii", "utf-8", "utf8"].indexOf(encoding.toLowerCase()) !== -1;
};

fsAdditions.isNetworkDrive = function (path, callback) {
    // TODO: implement
    process.nextTick(function () {
        callback(null, false);
    });
};

fsAdditions.moveToTrash = function (path, callback) {
    fs.stat(path, function (err) {
        if (err) {
            return callback(err);
        }
        // trash expects an array of files which is inconsistent with fs-extra apis
        trash(Array.isArray(path) ? path : [path], callback);
    });
};

fsAdditions.readTextFile = function (filename, encoding, callback) {
    if (typeof encoding === "function") {
        callback = encoding;
        encoding = "utf-8";
    } else if (typeof encoding !== "string") {
        throw new TypeError("encoding must be a string");
    } else if (!fsAdditions.isEncodingSupported(encoding)) {
        throw new TypeError("encoding is not supported: " + encoding);
    }
    // isbinaryfile check first because it checks first 1000 bytes of a file
    // so we don't load whole file if it's binary
    isbinaryfile(filename, function(err, isBinary) {
        if (err) {
            return callback(err);
        }
        if (isBinary) {
            err = new Error("ECHARSET: file is a binary file: " + filename);
            err.code = "ECHARSET";
            return callback(err);
        }
        fs.readFile(filename, encoding, function (err, content) {
            if (err) {
                return callback(err);
            }

            content = stripBom(content);

            // \uFFFD is used to replace an incoming character
            // whose value is unknown or unrepresentable
            if (/\uFFFD/.test(content)) {
                err = new Error("ECHARSET: unsupported encoding in file: " + filename);
                err.code = "ECHARSET";
                return callback(err);
            }

            callback(null, content);
        });
    });
};

fsAdditions.remove = function (path, callback) {
    fs.stat(path, function (err, stats) {
        if (err) {
            return callback(err);
        }
        fs.remove(path, callback);
    });
};

fsAdditions.rename = function (oldPath, newPath, callback) {
    fs.stat(newPath, function (err, stats) {
        if (err && err.code === "ENOENT") {
            return fs.rename(oldPath, newPath, callback);
        }
        if (err) {
            return callback(err);
        }
        err = new Error("EEXIST: file already exists: " + newPath);
        err.code = "EEXIST";
        callback(err);
    });
};

fsAdditions.showOpenDialog = function (allowMultipleSelection, chooseDirectory, title, initialPath, fileTypes, callback) {
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
};

fsAdditions.showSaveDialog = function (title, initialPath, proposedNewFilename, callback) {
    // TODO: Implement proposedNewFilename
    // TODO: I don't think defaultPath works right now - we should test that
    // Also, it doesn't return an error code on failure any more (and doesn't pass one to the callback as well)
    return dialog.showSaveDialog({
        title: title,
        defaultPath: initialPath
    }, function (path) {
        callback(null, utils.convertWindowsPathToUnixPath(path));
    });
};

module.exports = fsAdditions;
