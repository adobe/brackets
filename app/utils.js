/*jshint globalstrict:true, node:true*/

"use strict";

function convertWindowsPathToUnixPath(path) {
    if (process.platform === "win32") {
        path = path.replace(/\\/g, "/");
    }
    return path;
}

module.exports = {
    convertWindowsPathToUnixPath: convertWindowsPathToUnixPath
};
