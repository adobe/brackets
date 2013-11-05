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
/*jslint regexp:true*/
/*global module, require, process*/

module.exports = function (grunt) {
    "use strict";

    var child_process   = require("child_process"),
        http            = require("http"),
        https           = require("https"),
        q               = require("q"),
        querystring     = require("querystring"),
        qexec           = q.denodeify(child_process.exec);
    
    // task: build-num
    grunt.registerTask("build-prop", "Write build.prop properties file for Jenkins", function () {
        var done = this.async(),
            out  = "",
            num,
            branch,
            sha,
            opts = { cwd: process.cwd(), maxBuffer: 1024 * 1024 },
            version = grunt.config("pkg").version;
        
        qexec("git log --format=%h", opts).then(function (stdout, stderr) {
            num = stdout.toString().match(/[0-9a-f]\n/g).length;
            return qexec("git status", opts);
        }).then(function (stdout, stderr) {
            branch = /On branch (.*)/.exec(stdout.toString().trim())[1];
            return qexec("git log -1", opts);
        }).then(function (stdout, stderr) {
            sha = /commit (.*)/.exec(stdout.toString().trim())[1];

            out += "build.version=" + version.substr(0, version.lastIndexOf("-") + 1) + num + "\n";
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
    
    // task: cla-check-pull
    grunt.registerTask("cla-check-pull", "Check if a given GitHub user has signed the CLA", function () {
        var done    = this.async(),
            body    = "",
            travis  = process.env.TRAVIS === true,
            pull    = travis ? process.env.TRAVIS_PULL_REQUEST : (grunt.option("pull") || false),
            url     = "https://api.github.com/repos/adobe/brackets/issues/" + pull;
        
        if (travis && !pull) {
            // Kicked off a travis build without a pull request, skip CLA check
            grunt.log.writeln("Travis build without pull request");
            done();
            return;
        } else if (!pull) {
            // Grunt command-line option missing, fail CLA check
            grunt.log.writeln("Missing pull request number. Use 'grunt cla-check-pull --pull=<NUMBER>'.");
            done(false);
            return;
        }
            
        https.get(url, function (res) {
            res.on("data", function (chunk) {
                body += chunk;
            });
            
            res.on("end", function () {
                var json = JSON.parse(body);
                grunt.log.write(body);
                grunt.option("user", json.user.login);
                grunt.task.run("cla-check");
                done();
            });
            
            res.on("error", function (err) {
                grunt.log.writeln(err);
                done(false);
            });
        });
    });

    // task: cla-check
    grunt.registerTask("cla-check", "Check if a given GitHub user has signed the CLA", function () {
        var done    = this.async(),
            user    = grunt.option("user") || "",
            body    = "",
            options = {},
            postdata = querystring.stringify({contributor: user}),
            request;
        
        if (!user) {
            grunt.log.writeln("Missing user name. Use 'grunt cla-check --user=<GITHUB USER NAME>'.");
            done(false);
            return;
        }
        
        options.host    = "dev.brackets.io";
        options.path    = "/cla/brackets/check.cfm";
        options.method  = "POST";
        options.headers = {
            "Content-Type"      : "application/x-www-form-urlencoded",
            "Content-Length"    : postdata.length
        };
        
        request = http.request(options, function (res) {
            res.on("data", function (chunk) {
                body += chunk;
            });
            
            res.on("end", function () {
                if (body.match(/.*REJECTED.*/)) {
                    grunt.log.error(user + " has NOT submitted the contributor license agreement");
                    done(false);
                } else {
                    grunt.log.writeln(user + " has submitted the contributor license agreement");
                    done();
                }
            });
            
            res.on("error", function (err) {
                grunt.log.writeln(err);
                done(false);
            });
        });
        
        request.write(postdata);
    });
};