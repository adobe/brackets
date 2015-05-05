/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var fs = require("fs-extra");
var trash = require("trash");
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
    }
};

module.exports = {
    app: require("./app"),
    fs: _.extend({}, fs, fsAdditions)
};
