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

    var fs = require("fs"),
        path = require("path");

    grunt.registerTask("generate-samples", "Generate the css content that is common used for the samples", function () {
        var SAMPLES_DIR = "samples";
        var MAIN_CSS_NAME = "main.css";

        var header =
            '/* FILE AUTO-GENERATED. DO NOT EDIT! */\r\n' +
            '/* See samples/main.css */\r\n\r\n';
        var mainCss = grunt.file.read(path.join(SAMPLES_DIR, MAIN_CSS_NAME));
        var autoMainCss = header + mainCss;

        function getDirectories(srcpath) {
            return fs.readdirSync(srcpath).filter(function (file) {
                return fs.statSync(path.join(srcpath, file)).isDirectory();
            });
        }

        var directories = getDirectories(SAMPLES_DIR);
        directories.forEach(function (dir) {
            var langPath = path.join(SAMPLES_DIR, dir);
            var gettingStartedDir = getDirectories(langPath)[0];
            var destFile = path.join(SAMPLES_DIR, dir, gettingStartedDir, MAIN_CSS_NAME);
            grunt.file.write(destFile, autoMainCss);
        });
    });
};
