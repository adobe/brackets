/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var fs = require("fs-extra");
var isbinaryfile = require("isbinaryfile");
var jschardet = require("jschardet");
var stripBom = require("strip-bom");
var trash = require("trash");
var utils = require("../utils");
var remote = require("remote");
var dialog = remote.require("dialog");

var fsAdditions = {
    isBinaryFile: function (filename, callback) {
        isbinaryfile(filename , callback);
    },
    isBinaryFileSync: function (filename) {
        return isbinaryfile(filename);
    },
    isEncodingSupported: function (encoding) {
        return ["ascii", "utf-8", "utf8"].indexOf(encoding.toLowerCase()) !== -1;
    },
    isNetworkDrive: function (path, callback) {
        // TODO: implement
        process.nextTick(function () {
            callback(null, false);
        });
    },
    moveToTrash: function (path, callback) {
        // trash expects an array of files which is inconsistent with fs-extra apis
        trash(Array.isArray(path) ? path : [path], callback);
    },
    readTextFile: function (filename, encoding, callback) {
        if (typeof encoding === "function") {
            callback = encoding;
            encoding = "utf-8";
        }
        if (typeof encoding !== "string") {
            throw new TypeError("encoding must be a string");
        } else if (!fsAdditions.isEncodingSupported(encoding)) {
            throw new TypeError("encoding is not supported: " + encoding);
        }
        isbinaryfile(filename, function(err, isBinary) {
            if (err) {
                return callback(err);
            }
            if (isBinary) {
                err = new Error("ECHARSET: file is a binary file");
                err.code = "ECHARSET";
                return callback(err);
            }
            fs.readFile(filename, function (err, buffer) {
                if (err) {
                    return callback(err);
                }
                if (buffer.length) {
                    var chardet = jschardet.detect(buffer);
                    if (!fsAdditions.isEncodingSupported(chardet.encoding)) {
                        err = new Error("ECHARSET: unsupported encoding: " + chardet.encoding);
                        err.code = "ECHARSET";
                        return callback(err);
                    }
                }
                callback(null, stripBom(buffer.toString(encoding)));
            });
        });
    },
    readTextFileSync: function (filename, encoding) {
        var err;
        var isBinary = isbinaryfile(filename);
        if (isBinary) {
            err = new Error("ECHARSET: file is a binary file");
            err.code = "ECHARSET";
            throw err;
        }
        var buffer = fs.readFileSync(filename);
        if (buffer.length) {
            var chardet = jschardet.detect(buffer);
            if (["ascii", "utf-8"].indexOf(chardet.encoding.toLowerCase()) === -1) {
                err = new Error("ECHARSET: unsupported encoding: " + chardet.encoding);
                err.code = "ECHARSET";
                throw err;
            }
        }
        return stripBom(buffer.toString(encoding));
    },
    showOpenDialog: function (allowMultipleSelection, chooseDirectory, title, initialPath, fileTypes, callback) {
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
    },
    showSaveDialog: function (title, initialPath, proposedNewFilename, callback) {
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
};

module.exports = {
    app: require("./app"),
    fs: _.extend({}, fs, fsAdditions)
};
