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

/* eslint-env node */
"use strict";

module.exports = function (grunt) {

    var _       = require("lodash"),
        path    = require("path"),
        fs      = require("fs-extra");

    grunt.registerTask(
        "copy-browser-dependencies",
        "Moves dependencies installed through npm into src/thirdparty folder so they can be accessed from browser",
        function () {
            var toCopy = [
                {
                    from: "../node_modules/codemirror",
                    to: "../src/thirdparty/CodeMirror"
                }
            ];
            var done = this.async();
            var afterMove = _.after(toCopy.length, done);
            toCopy.forEach(function (obj) {
                fs.copy(path.resolve(__dirname, obj.from), path.resolve(__dirname, obj.to), function (err) {
                    if (err) {
                        grunt.log.error(err);
                        done(false);
                        return;
                    }
                    afterMove();
                });
            });
        });

};
