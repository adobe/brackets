/*jshint globalstrict:true, node:true*/

"use strict";

function errToString(err) {
    if (err.stack) {
        return err.stack;
    }
    if (err.name && err.message) {
        return err.name + ": " + err.message;
    }
    return err.toString();
}

function convertWindowsPathToUnixPath(path) {
    if (process.platform === "win32") {
        path = path.replace(/\\/g, "/");
    }
    return path;
}

module.exports = {
    errToString: errToString,
    convertWindowsPathToUnixPath: convertWindowsPathToUnixPath
};
