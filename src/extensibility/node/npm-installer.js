/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/* eslint-env node */

"use strict";

var fs    = require("fs-extra"),
    path  = require("path"),
    spawn = require("child_process").spawn;

var Errors = {
    NPM_INSTALL_FAILED: "NPM_INSTALL_FAILED"
};

/**
 * Private function to run "npm install --production" command in the extension directory.
 *
 * @param {string} installDirectory Directory to remove
 * @param {function} callback NodeJS style callback to call after finish
 */
function _performNpmInstall(installDirectory, callback) {
    var npmPath = path.resolve(path.dirname(require.resolve("npm")), "..", "bin", "npm-cli.js");
    var args = [npmPath, "install", "--production"];

    console.log("running npm install --production in " + installDirectory);

    var child = spawn(process.execPath, args, { cwd: installDirectory });

    child.on("error", function (err) {
        return callback(err);
    });

    var stdout = [];
    child.stdout.addListener("data", function (buffer) {
        stdout.push(buffer);
    });

    var stderr = [];
    child.stderr.addListener("data", function (buffer) {
        stderr.push(buffer);
    });

    var exitCode = 0;
    child.addListener("exit", function (code) {
        exitCode = code;
    });

    child.addListener("close", function () {
        stderr = Buffer.concat(stderr).toString();
        stdout = Buffer.concat(stdout).toString();
        if (exitCode > 0) {
            console.error("npm-stderr: " + stderr);
            return callback(new Error(stderr));
        }
        if (stderr) {
            console.warn("npm-stderr: " + stderr);
        }
        console.log("npm-stdout: " + stdout);
        return callback();
    });

    child.stdin.end();
}

/**
 * Checks package.json of the extracted extension for npm dependencies
 * and runs npm install when required.
 * @param {Object} validationResult return value of the validation procedure
 * @param {Function} callback function to be called after the end of validation procedure
 */
function performNpmInstallIfRequired(validationResult, callback) {

    function finish() {
        callback(null, validationResult);
    }

    var installDirectory = path.join(validationResult.extractDir, validationResult.commonPrefix);
    var packageJson;

    try {
        packageJson = fs.readJsonSync(path.join(installDirectory, "package.json"));
    } catch (e) {
        packageJson = null;
    }

    if (!packageJson || !packageJson.dependencies) {
        return finish();
    }

    _performNpmInstall(installDirectory, function (err) {
        if (err) {
            validationResult.errors.push([Errors.NPM_INSTALL_FAILED, err.toString()]);
        }
        finish();
    });
}

exports.performNpmInstallIfRequired = performNpmInstallIfRequired;
