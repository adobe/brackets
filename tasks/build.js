/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/*eslint-env node */
/*jslint node: true, regexp: true */
"use strict";

module.exports = function (grunt) {
    var child_process   = require("child_process"),
        http            = require("http"),
        https           = require("https"),
        build           = {},
        path            = require("path"),
        q               = require("q"),
        querystring     = require("querystring"),
        qexec           = q.denodeify(child_process.exec);

    function getGitInfo(cwd) {
        var opts = { cwd: cwd, maxBuffer: 1024 * 1024 },
            json = {};

        // count the number of commits for our version number
        //     <major>.<minor>.<patch>-<number of commits>
        return qexec("git log --format=%h", opts).then(function (stdout) {
            json.commits = stdout.toString().match(/[0-9a-f]\n/g).length;

            // get the hash for the current commit (HEAD)
            return qexec("git rev-parse HEAD", opts);
        }).then(function (stdout) {
            json.sha = /([a-f0-9]+)/.exec(stdout.toString())[1];

            // compare HEAD to the HEADs on the remote
            return qexec("git ls-remote --heads origin", opts);
        }).then(function (stdout) {
            var log = stdout.toString(),
                re = new RegExp(json.sha + "\\srefs/heads/(\\S+)\\s"),
                match = re.exec(log),
                reflog;

            // if HEAD matches to a remote branch HEAD, grab the branch name
            if (match) {
                json.branch = match[1];
                return json;
            }

            // else, try match HEAD using reflog
            reflog = qexec("git reflog show --no-abbrev-commit --all", opts);

            return reflog.then(function (stdout) {
                var log = stdout.toString(),
                    re = new RegExp(json.sha + "\\srefs/(remotes/origin|heads)/(\\S+)@"),
                    match = re.exec(log);

                json.branch = (match && match[2]) || "(no branch)";

                return json;
            });
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
            out         = "",
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
        }, function (err) {
            // shell git info is optional
            grunt.log.writeln(err);
        }).finally(function () {
            out += "brackets_build_version=" + version.substr(0, version.lastIndexOf("-") + 1) + www_git.commits + "\n";
            out += toProperties("brackets_www_", www_git);

            if (shell_git) {
                out += toProperties("brackets_shell_", shell_git);
            }

            grunt.log.write(out);
            grunt.file.write("build.prop", out);

            done();
        });
    });

    // task: cla-check-pull
    grunt.registerTask("cla-check-pull", "Check if a given GitHub user has signed the CLA", function () {
        var done    = this.async(),
            body    = "",
            options = {},
            travis  = process.env.TRAVIS === "true",
            pull    = travis ? process.env.TRAVIS_PULL_REQUEST : (grunt.option("pull") || false),
            request;

        pull = parseInt(pull, 10);

        if (isNaN(pull)) {
            grunt.log.writeln(JSON.stringify(process.env));

            if (travis) {
                // Kicked off a travis build without a pull request, skip CLA check
                grunt.log.writeln("Travis build without pull request");
                done();
            } else {
                // Grunt command-line option missing, fail CLA check
                grunt.log.writeln("Missing pull request number. Use 'grunt cla-check-pull --pull=<NUMBER>'.");
                done(false);
            }

            return;
        }

        options.host    = "api.github.com";
        options.path    = "/repos/adobe/brackets/issues/" + pull;
        options.method  = "GET";
        options.headers = {
            "User-Agent" : "Node.js"
        };

        request = https.request(options, function (res) {
            res.on("data", function (chunk) {
                body += chunk;
            });

            res.on("end", function () {
                var json    = JSON.parse(body),
                    login   = json.user && json.user.login;

                if (login) {
                    grunt.option("user", login);
                    grunt.task.run("cla-check");

                    done();
                } else {
                    grunt.log.writeln("Unexpected response from api.github.com");
                    grunt.log.writeln("statusCode: " + res.statusCode);
                    grunt.log.writeln("headers: " + JSON.stringify(res.headers));
                    grunt.log.writeln("data: " + body);

                    done(false);
                }
            });

            res.on("error", function (err) {
                grunt.log.writeln(err);
                done(false);
            });
        });

        request.end();
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

        // Check CLA exceptions first
        var exceptions = grunt.file.readJSON("tasks/cla-exceptions.json");

        if (exceptions[user]) {
            grunt.log.writeln(user + " exempt from the standard contributor license agreement");
            done();
            return;
        }

        // Query dev.brackets.io for CLA status
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
                    grunt.log.error(user + " has NOT submitted the contributor license agreement. See http://dev.brackets.io/brackets-contributor-license-agreement.html.");
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
        request.end();
    });

    grunt.registerTask("nls-check", "Checks if all the keys in nls files are defined in root", function () {
        var done = this.async(),
            PATH = "src/nls",
            ROOT_LANG = "root",
            encounteredErrors = false,
            rootDefinitions = {},
            definitions,
            unknownKeys;

        function getDefinitions(abspath) {
            var fileContent,
                definitions = [];

            fileContent = grunt.file.read(abspath);
            fileContent.split("\n").forEach(function (line) {
                var match = line.match(/^\s*"(\S+)"\s*:/);
                if (match && match[1]) {
                    definitions.push(match[1]);
                }
            });
            return definitions;
        }

        // Extracts all nls keys from nls/root
        grunt.file.recurse(PATH + "/" + ROOT_LANG, function (abspath, rootdir, subdir, filename) {
            rootDefinitions[filename] = getDefinitions(abspath);
        });

        // Compares nls keys in translations with root ones
        grunt.file.recurse(PATH, function (abspath, rootdir, subdir, filename) {
            if (!subdir || subdir === ROOT_LANG) {
                return;
            }
            definitions = getDefinitions(abspath);
            unknownKeys = [];

            unknownKeys = definitions.filter(function (key) {
                return rootDefinitions[filename].indexOf(key) < 0;
            });

            if (unknownKeys.length) {
                grunt.log.writeln("There are unknown keys included in " + PATH + "/" + subdir + "/" + filename + ":", unknownKeys);
                encounteredErrors = true;
            }
        });

        done(!encounteredErrors);
    });

    build.getGitInfo = getGitInfo;

    return build;
};
