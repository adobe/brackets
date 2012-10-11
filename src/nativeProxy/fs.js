/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var NativeProxy = require("nativeProxy/NativeProxy");

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

    function readdir(path, callback) {
        return NativeProxy.send("fs", "readdir", path, callback);
    }

    function stat(path, callback) {
        NativeProxy.send("fs", "stat", path, function (err, statData) {
            if (statData && callback) {
                statData.isFile = function () { return statData._isFile; };
                statData.isDirectory = function () { return statData._isDirectory; };
                statData.isBlockDevice = function () { return statData._isBlockDevice; };
                statData.isCharacterDevice = function () { return statData._isCharacterDevice; };
                statData.isFIFO = function () { return statData._isFIFO; };
                statData.isSocket = function () { return statData._isSocket; };
                statData.atime = new Date(statData.atime);
                statData.mtime = new Date(statData.mtime);
                statData.ctime = new Date(statData.ctime);
            }
            if (callback) {
                callback(err, statData);
            }
        });
    }

    function readFile(path, encoding, callback) {
        return NativeProxy.send("fs", "readFile", path, encoding, callback);
    }

    function writeFile(path, data, encoding, callback) {
        return NativeProxy.send("fs", "writeFile", path, data, encoding, callback);
    }

    function chmod(path, mode, callback) {
        return NativeProxy.send("fs", "chmod", path, mode, callback);
    }

    function unlink(path, callback) {
        return NativeProxy.send("fs", "unlink", path, callback);
    }

    function cwd(callback) {
        return NativeProxy.send("fs", "cwd", callback);
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

    exports.readdir = readdir;
    exports.stat = stat;
    exports.readFile = readFile;
    exports.writeFile = writeFile;
    exports.chmod = chmod;
    exports.unlink = unlink;
    exports.cwd = cwd;
});
