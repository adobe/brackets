/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var fs = require("fs-extra");
var trash = require("trash");
var utils = require("../utils");
var remote = require("remote");
var dialog = remote.require("dialog");

var fsAdditions = {
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
