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
        os = require("os"),
        EOL = os.EOL,
        less = require("less"),
        Q = require("q"),
        amdrequire = require("amdrequire");

    grunt.registerTask("samples", "Generate the samples", function () {
        var done = this.async(),
            i;

        var SAMPLES_DIR = "samples";

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

        function warn(msg) {
            grunt.log.writeln(msg["yellow"]);
        }

        // Non-fatal error
        function error(msg) {
            grunt.log.writeln(msg["magenta"]);
        }

        var COMMON_LESS_NAME = "common.less";
        var commonFilePath = path.join(SAMPLES_DIR, COMMON_LESS_NAME);
        var commonFile = grunt.file.read(commonFilePath);
        var NLS_FOLDERS = "src/nls";
        var URLS_NAME = "urls.js";
        var SCREENSHOT_NAME_FROM = "screenshot-quick-edit.png";
        var SCREENSHOT_NAME_TO = "quick-edit.png";
        var STRINGS_SAMPLE_NAME = "strings-sample.js";

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
                error("No urls file or GETTING_STARTED entry for " + nlsFolder);
                continue;
            }

            var stringsSampleFilePath = path.join(NLS_FOLDERS, nlsFolder, STRINGS_SAMPLE_NAME);
            var stringsSample = getDefines(stringsSampleFilePath);
            if (!stringsSample) {
                error("No samples strings file for " + nlsFolder);
                continue;
            }

            var gettingStarted = path.join(SAMPLES_DIR, urls.GETTING_STARTED);
            grunt.file.mkdir(gettingStarted);

            // If there is not a screenshot let still generate the sample.
            // Otherwise, how can be done the screenshot?!
            var screenshotNlsFilePath = path.join(NLS_FOLDERS, nlsFolder, "images", SCREENSHOT_NAME_FROM);
            if (!grunt.file.isFile(screenshotNlsFilePath)) {
                warn("No screenshot file for " + nlsFolder);
            } else {
                var screenshotsFilePath = path.join(gettingStarted, "screenshots");
                grunt.file.copy(screenshotNlsFilePath,
                                path.join(screenshotsFilePath, SCREENSHOT_NAME_TO),
                                { encoding: null });
            }

            var sampleStylesFolder = path.join(NLS_FOLDERS, nlsFolder, "styles");
            if (grunt.file.isDir(sampleStylesFolder)) {
                varsFolder = sampleStylesFolder;
            }

            var deferred = Q.defer();
            less.render(commonFile,
                {
                    paths: [varsFolder],  // Specify search paths for @import directives
                    filename: "samples_variables.less", // Specify a filename, for better error messages
                    //compress: true          // Minify CSS output
                },
                deferred.makeNodeResolver());
            promises.push(deferred.promise);
            gettingStarteds.push({path: gettingStarted, strings: stringsSample});
        }

        var INDEX_HTML_NAME = "index.html";
        var indexFilePath = path.join(SAMPLES_DIR, INDEX_HTML_NAME);
        var indexFile = grunt.file.read(indexFilePath);

        function generateIndexHtml(data) {
            var destFile = path.join(data.path, INDEX_HTML_NAME),
                indexHtml = indexFile,
                prop;

            for (prop in data.strings) {
                if (data.strings.hasOwnProperty(prop)) {
                    var string = data.strings[prop]
                        // Awful hack to indent properly the HTML.
                        .replace(/\n/g, EOL + "            ");
                    indexHtml = indexHtml.replace("{{" + prop + "}}", string);
                }
            }
            var header =
                "<!-- FILE AUTO-GENERATED. DO NOT EDIT! -->" + EOL + EOL;
            indexHtml = header + indexHtml;
            grunt.file.write(destFile, indexHtml);
        }

        var MAIN_CSS_NAME = "main.css";

        function generateMainCss(data, css) {
            var destFile = path.join(data.path, MAIN_CSS_NAME);
            var header =
                "/* FILE AUTO-GENERATED. DO NOT EDIT! */" + EOL + EOL;
            var mainCss = header + css;
            grunt.file.write(destFile, mainCss);
        }

        Q.all(promises)
            .done(
                function (results) {
                    results.forEach(function (output, index) {
                        generateMainCss(gettingStarteds[index], output.css);

                        generateIndexHtml(gettingStarteds[index]);
                    });
                    grunt.log.writeln(results.length + " samples were created out of " + nlsFolders.length + " languages.");
                    done();
                },
                function (err) {
                    grunt.fatal(err);
                    done(false);
                }
            );
    });
};
