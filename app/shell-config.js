/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
_.mixin(require("lodash-deep"));
var app = require("app");
var fs = require("fs-extra");
var path = require("path");
var utils = require("./utils");
var os = require("os");

var CONFIG_PATH = path.resolve(utils.convertWindowsPathToUnixPath(app.getPath("userData")), "shell-config.json");
var config;

if (!process.env["TMPDIR"] && !process.env["TMP"] && !process.env["TEMP"]) {
    process.env["TMPDIR"] = process.env["TMP"] = process.env["TEMP"] = os.tmpdir();
}

try {
    config = fs.readJsonSync(CONFIG_PATH);
} catch (err) {
    if (err.code === "ENOENT") {
        config = fs.readJsonSync(path.resolve(__dirname, "default-shell-config.json"));
        fs.writeJsonSync(CONFIG_PATH, config);
    } else if (err.name === "SyntaxError") {
        throw new Error("File is not a valid json: " + CONFIG_PATH);
    } else {
        throw err;
    }
}

function save() {
    fs.writeJson(CONFIG_PATH, config);
}

function saveSync() {
    fs.writeJsonSync(CONFIG_PATH, config);
}

module.exports = {
    get: function (key) { return _.deepGet(config, key); },
    set: function (key, value) { return _.deepSet(config, key, value); },
    save: save,
    saveSync: saveSync
};
