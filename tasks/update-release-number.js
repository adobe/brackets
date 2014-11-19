/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global module, require*/

module.exports = function (grunt) {
    "use strict";

    var common = require("./lib/common")(grunt),
        semver = require("semver");

    // task: update-release-number
    // Updates the version property in package.json
    grunt.registerTask('update-release-number', function () {
        var path        = "package.json",
            packageJSON = grunt.file.readJSON(path),
            release     = grunt.option("release") || "";

        if (!release || !semver.valid(release)) {
            grunt.fail.fatal("Please specify a release. e.g. grunt update-release-number --release=1.1.0");
        }

        packageJSON.version = release + "-0";
        packageJSON.apiVersion = release;

        common.writeJSON(grunt, path, packageJSON);
    });
};
