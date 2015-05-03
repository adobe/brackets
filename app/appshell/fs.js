/*jshint globalstrict:true, node:true*/

"use strict";

var fs = require("fs");
var trash = require("trash");

function moveToTrash(path, callback) {
    trash([path], callback);
}

function readFile(path, encoding, callback) {
    fs.readFile(path, {
        encoding: encoding || "utf8"
    }, callback);
}

function stat(path, callback) {
    fs.lstat(path, function (err, stat) {
        if (stat) {
            // TODO: Implement realPath. If "filename" is a symlink,
            // realPath should be the actual path to the linked object.
            if (stat.isSymbolicLink()) {
                throw new Error("realPath for symbolic link is not implemented in appshell.fs.stat");
            }
            stat.realPath = null;
        }
        callback(err, stat);
    });
}

module.exports = {
    moveToTrash: moveToTrash,
    readFile: readFile,
    stat: stat
};
