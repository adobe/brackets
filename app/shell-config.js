/*jshint globalstrict:true, node:true*/

"use strict";

var app = require("app");
var fs = require("fs-extra");
var path = require("path");
var utils = require("./utils");

var SHELL_CONFIG = path.resolve(utils.convertWindowsPathToUnixPath(app.getPath("userData")), "shell-config.json");
console.log(SHELL_CONFIG);
var shellConfig;

try {
    shellConfig = fs.readJsonSync(SHELL_CONFIG);
} catch (err) {
    if (err.code === "ENOENT") {
        shellConfig = fs.readJsonSync(path.resolve(__dirname, "default-shell-config.json"));
        fs.writeJsonSync(SHELL_CONFIG, shellConfig);
    } else if (err.name === "SyntaxError") {
        throw new Error("File is not a valid json: " + SHELL_CONFIG);
    } else {
        throw err;
    }
}

shellConfig.save = function () {
    fs.writeJson(SHELL_CONFIG, shellConfig);
};

shellConfig.saveSync = function () {
    fs.writeJsonSync(SHELL_CONFIG, shellConfig);
};

module.exports = shellConfig;
