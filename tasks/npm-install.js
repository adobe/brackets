/*
 * Copyright (c) 2016 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint node: true */

module.exports = function (grunt) {
    "use strict";

    var exec    = require('child_process').exec,
        common  = require("./lib/common")(grunt),
        build   = require("./build")(grunt);

    grunt.registerTask("npm-install", "Install node_modules to the dist folder so it gets bundled with release", function () {
        var npmShrinkwrapJSON = grunt.file.readJSON("npm-shrinkwrap.json");
        common.writeJSON(grunt, "dist/npm-shrinkwrap.json", npmShrinkwrapJSON);
        
        var packageJSON = grunt.file.readJSON("package.json");
        delete packageJSON.devDependencies;
        delete packageJSON.scripts; // we don't want to run post-install scripts in dist folder
        common.writeJSON(grunt, "dist/package.json", packageJSON);

        var done = this.async();
        exec('npm install --production', { cwd: './dist' }, function (err, stdout, stderr) {
            if (err) {
                grunt.log.error(stderr);
                done(false);
            } else {
                grunt.log.writeln(stdout);
                done();
            }
        });
    });

};
