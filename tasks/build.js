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
/*global module, require, process*/

module.exports = function (grunt) {
    "use strict";

    var child_process   = require("child_process"),
        q               = require("q"),
        qexec           = q.denodeify(child_process.exec);
    
    // task: build-num
    grunt.registerTask("build-prop", "Write build.prop properties file for Jenkins", function () {
        var done = this.async(),
            out  = "",
            num,
            branch,
            sha,
            opts = { cwd: process.cwd(), maxBuffer: 1024*1024 };
        
        qexec("git log --format=%h", opts).then(function (stdout, stderr) {
            num = stdout.toString().match(/[0-9a-f]\n/g).length;
            return qexec("git status", opts);
        }).then(function (stdout, stderr) {
            branch = /On branch (.*)/.exec(stdout.toString().trim())[1];
            return qexec("git log -1", opts);
        }).then(function (stdout, stderr) {
            sha = /commit (.*)/.exec(stdout.toString().trim())[1];

            out += "build.number=" + num + "\n";
            out += "build.branch=" + branch + "\n";
            out += "build.sha=" + sha + "\n";

            grunt.log.write(out);
            grunt.file.write("build.prop", out);

            done();
        }, function (err) {
            grunt.log.writeln(err);
            done(false);
        });
    });
};