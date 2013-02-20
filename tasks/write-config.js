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

    var common = require("./lib/common");

    // task: write-config
    grunt.registerTask("write-config", "Merge package.json and src/brackets.config.json into src/config.json", function () {
        var packageJSON = grunt.file.readJSON("package.json"),
            appConfigJSON = grunt.file.readJSON("src/brackets.config.json");

        Object.keys(packageJSON).forEach(function (key) {
            if (appConfigJSON[key] === undefined) {
                appConfigJSON[key] = packageJSON[key];
            }
        });

        common.writeJSON(grunt, "src/config.json", appConfigJSON);
    });
};
