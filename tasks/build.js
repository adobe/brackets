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
        path            = require("path"),
        q               = require("q"),
        qexec           = q.denodeify(child_process.exec);

    function getGitInfo(cwd) {
        var opts = { cwd: cwd, maxBuffer: 1024 * 1024 },
            json = {};

        return qexec("git log --format=%h", opts).then(function (stdout) {
            json.commits = stdout.toString().match(/[0-9a-f]\n/g).length;
            return qexec("git rev-parse HEAD", opts);
        }).then(function (stdout) {
            json.sha = /([a-f0-9]+)/.exec(stdout.toString())[1];
            return qexec("git reflog show --no-abbrev-commit --all", opts);
        }).then(function (stdout) {
            var log = stdout.toString(),
                re = new RegExp(json.sha + " refs/heads/(.+)@");

            json.branch = re.exec(log)[1];

            return json;
        });
    }

    function toProperties(prefix, json) {
        var out = "";

        Object.keys(json).forEach(function (key) {
            out += prefix + key + "=" + json[key] + "\n";
        });

        return out;
    }
    
    // task: build-num
    grunt.registerTask("build-prop", "Write build.prop properties file for Jenkins", function () {
        var done        = this.async(),
            json        = {},
            out         = "",
            opts        = { cwd: process.cwd(), maxBuffer: 1024 * 1024 },
            version     = grunt.config("pkg").version,
            www_repo    = process.cwd(),
            shell_repo  = path.resolve(www_repo, grunt.config("shell.repo")),
            www_git,
            shell_git;

        getGitInfo(www_repo).then(function (json) {
            www_git = json;
            return getGitInfo(shell_repo);
        }).then(function (json) {
            shell_git = json;

            out += "brackets_build_version=" + version.substr(0, version.lastIndexOf("-") + 1) + www_git.commits + "\n";
            out += toProperties("brackets_www_", www_git);
            out += toProperties("brackets_shell_", shell_git);

            grunt.log.write(out);
            grunt.file.write("build.prop", out);

            done();
        }, function (err) {
            grunt.log.writeln(err);
            done(false);
        });
    });
};