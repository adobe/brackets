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

/*jslint continue:true, sub:true*/
/*global module, require*/

module.exports = function (grunt) {
    "use strict";

    var fs = require("fs"),
        path = require("path"),
        less = require("less"),
        Q = require("q"),
        amdrequire = require("amdrequire");

    Q.longStackSupport = true;


    grunt.registerTask("generate-samples", "Generate the samples", function () {
        var done = this.async(),
            i;

        var SAMPLES_DIR = "samples";
        var MAIN_CSS_NAME = "main.css";

        function isFile(srcPath) {
            try {
                return fs.statSync(srcPath).isFile();
            } catch (err) {
                return false;
            }
        }

        function isDirectory(srcPath) {
            try {
                return fs.statSync(srcPath).isDirectory();
            } catch (err) {
                return false;
            }
        }

        function getDirectories(srcpath) {
            return fs.readdirSync(srcpath).filter(function (file) {
                return fs.statSync(path.join(srcpath, file)).isDirectory();
            });
        }

        function getDefines(path) {
            var defines = false;
            try {
                amdrequire([path], function (obj) {
                    defines = obj;
                });
            } catch (e) {
                // The file do not exists: do nothing.
            }
            return defines;
        }

        function mkdirSync(path) {
            try {
                fs.mkdirSync(path);
            } catch (e) {
                if (e.code !== 'EEXIST') {
                    throw e;
                }
            }
        }

        function copyFile(source, target) {
            fs.writeFileSync(target, fs.readFileSync(source));
        }

        function warn(msg) {
            grunt.log.writeln(msg["yellow"]);
        }

        var COMMON_LESS_NAME = "common.less";
        var commonFilePath = path.join(SAMPLES_DIR, COMMON_LESS_NAME);
        var commonFile = grunt.file.read(commonFilePath);
        var NLS_FOLDERS = "src/nls";
        var URLS_NAME = "urls.js";
        var SCREENSHOT_NAME = "screenshot-quick-edit.png";
        var SAMPLE_STRINGS_NAME = "sample.js";

        var promises = [];
        var gettingStarteds = [];

        // Read all nls folders.
        var nlsFolders = getDirectories(NLS_FOLDERS);
        for (i = 0; i < nlsFolders.length; i++) {
            var nlsFolder = nlsFolders[i];

            var varsFolder = SAMPLES_DIR;

            var urlsFilePath = path.join(NLS_FOLDERS, nlsFolder, URLS_NAME);
            var urls = getDefines(urlsFilePath);
            if (!urls || !urls.GETTING_STARTED) {
                warn("No urls file or GETTING_STARTED entry for " + nlsFolder);
                continue;
            }

            var sampleStringFilePath = path.join(NLS_FOLDERS, nlsFolder, SAMPLE_STRINGS_NAME);
            var sampleString = getDefines(sampleStringFilePath);
            if (!sampleString) {
                warn("No samples strings file entry for " + nlsFolder);
                continue;
            }

            var screenshotNlsFilePath = path.join(NLS_FOLDERS, nlsFolder, "images", SCREENSHOT_NAME);
            if (!isFile(screenshotNlsFilePath)) {
                warn("No screenshot file for " + nlsFolder);
                continue;
            }

            var screenshotsFilePath = path.join(SAMPLES_DIR, urls.GETTING_STARTED, "screenshots");
            var gettingStarted = path.join(SAMPLES_DIR, urls.GETTING_STARTED);

            try {
                mkdirSync(gettingStarted);
                mkdirSync(screenshotsFilePath);
            } catch (e) {
                grunt.log.error(e);
                return done(false);
            }

            copyFile(screenshotNlsFilePath, path.join(screenshotsFilePath, SCREENSHOT_NAME));

            var sampleStylesFolder = path.join(NLS_FOLDERS, nlsFolder, "styles");
            if (isDirectory(sampleStylesFolder)) {
                varsFolder = sampleStylesFolder;
            }
            grunt.log.writeln("varsFolder = " + varsFolder);

            var deferred = Q.defer();
            less.render(commonFile,
                {
                    paths: [varsFolder],  // Specify search paths for @import directives
                    filename: 'samples_variables.less', // Specify a filename, for better error messages
                    //compress: true          // Minify CSS output
                },
                deferred.makeNodeResolver());
            promises.push(deferred.promise);
            gettingStarteds.push(gettingStarted);
        }

        Q.all(promises)
            .done(
                function (results) {
                    var header =
                        '/* FILE AUTO-GENERATED. DO NOT EDIT! */\r\n';
                    results.forEach(function (output, index) {
                        var destFile = path.join(gettingStarteds[index], MAIN_CSS_NAME);
                        var mainCss = header + output.css;
                        console.log(destFile);
                        console.log(mainCss);
                        grunt.file.write(destFile, mainCss);
                    });
                    grunt.log.writeln(results.length + " samples were created from " + nlsFolders.length + " languages.");
                    done();
                },
                function (err) {
                    grunt.log.error(err);
                    done(false);
                }
            );
    });
};
