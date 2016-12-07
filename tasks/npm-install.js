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

/*eslint-env node */
/*jslint node: true */
"use strict";

module.exports = function (grunt) {

    var _       = require("lodash"),
        common  = require("./lib/common")(grunt),
        build   = require("./build")(grunt),
        glob    = require("glob"),
        path    = require("path"),
        exec    = require("child_process").exec;
    
    function runNpmInstall(where, callback) {
        grunt.log.writeln("running npm install --production in " + where);
        exec('npm install --production', { cwd: './' + where }, function (err, stdout, stderr) {
            if (err) {
                grunt.log.error(stderr);
            } else {
                grunt.log.writeln(stdout || "finished npm install in " + where);
            }
            return err ? callback(stderr) : callback(null, stdout);
        });
    }

    grunt.registerTask("npm-install", "Install node_modules to the dist folder so it gets bundled with release", function () {
        var done = this.async();
        runNpmInstall("dist", function (err) {
            return err ? done(false) : done();
        });
    });

    grunt.registerTask("npm-install-src", "Install node_modules to the src folder", function () {
        var done = this.async();
        runNpmInstall("src", function (err) {
            return err ? done(false) : done();
        });
    });
    
    grunt.registerTask("npm-install-extensions", "Install node_modules for default extensions which have package.json defined", function () {
        var _done = this.async();
        glob("src/extensions/**/package.json", function (err, files) {
            if (err) {
                grunt.log.error(err);
                return _done(false);
            }
            files = files.filter(function (path) {
                return path.indexOf("node_modules") === -1;
            });
            var done = _.after(files.length, _done);
            files.forEach(function (file) {
                runNpmInstall(path.dirname(file), function (err) {
                    return err ? _done(false) : done();
                });
            });
        });
    });

    grunt.registerTask(
        "npm-install-source",
        "Install node_modules for src folder and default extensions which have package.json defined",
        ["npm-install-src", "npm-install-extensions"]
    );

};
