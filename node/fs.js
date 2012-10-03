/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */

var fs = require("fs");
var promise = require("node-promise/promise");

var NO_ERROR = 0;
var ERR_UNKNOWN = 1;
var ERR_INVALID_PARAMS = 2;
var ERR_NOT_FOUND = 3;
var ERR_CANT_READ = 4;
var ERR_UNSUPPORTED_ENCODING = 5;
var ERR_CANT_WRITE = 6;
var ERR_OUT_OF_SPACE = 7;
var ERR_NOT_FILE = 8;
var ERR_NOT_DIRECTORY = 9;

function _wrap(method) {
    return function () {
        var r = promise.defer();
        var args = Array.prototype.slice.call(arguments, 0);
        args.push(function () {
            var response = Array.prototype.slice.call(arguments, 0);
            // convert undefined/null error to 0
            if (response[0] === undefined || response[0] === null) {
                response[0] = NO_ERROR;
            }
            r.resolve(response);
        });
        method.apply(undefined, args);
        return r;
    };
}

function showOpenDialog(allowMultipleSelection, chooseDirectory, title, initialPath, fileTypes, callback) {
    console.log("PROXY: fs.showOpenDialog()", arguments);
}

function stat(path, callback) {
    fs.stat(path, function (err, statData) {
        if (statData && callback) {
            statData._isFile = statData.isFile();
            statData._isDirectory = statData.isDirectory();
            statData._isBlockDevice = statData.isBlockDevice();
            statData._isCharacterDevice = statData.isCharacterDevice();
            statData._isFIFO = statData.isFIFO();
            statData._isSocket = statData.isSocket();
            callback(err, statData);
        }
    });
}

exports.NO_ERROR = NO_ERROR;
exports.ERR_UNKNOWN = ERR_UNKNOWN;
exports.ERR_INVALID_PARAMS = ERR_INVALID_PARAMS;
exports.ERR_NOT_FOUND = ERR_NOT_FOUND;
exports.ERR_CANT_READ = ERR_CANT_READ;
exports.ERR_UNSUPPORTED_ENCODING = ERR_UNSUPPORTED_ENCODING;
exports.ERR_CANT_WRITE = ERR_CANT_WRITE;
exports.ERR_OUT_OF_SPACE = ERR_OUT_OF_SPACE;
exports.ERR_NOT_FILE = ERR_NOT_FILE;
exports.ERR_NOT_DIRECTORY = ERR_NOT_DIRECTORY;

exports.showOpenDialog = _wrap(fs.showOpenDialog);
exports.readdir = _wrap(fs.readdir);
exports.stat = _wrap(stat);
exports.readFile = _wrap(fs.readFile);
exports.writeFile = _wrap(fs.writeFile);
exports.chmod = _wrap(fs.chmod);
exports.unlink = _wrap(fs.unlink);
