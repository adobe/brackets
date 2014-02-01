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

    var common          = require("./lib/common")(grunt),
        child_process   = require("child_process"),
        q               = require("q"),
        qexec           = q.denodeify(child_process.exec);
    
    // task: test-integration
    grunt.registerTask("test-integration", "Run tests in brackets-shell. Requires 'grunt full-build' in shell.", function () {
        var done            = this.async(),
            platform        = common.platform(),
            opts            = { cwd: process.cwd() },
            cmd             = common.resolve(grunt.option("shell") || grunt.config("shell." + platform)),
            spec            = grunt.option("spec") || "all",
            suite           = grunt.option("suite") || "all",
            results         = grunt.option("results") || process.cwd() + "/results.xml",
            resultsPath     = common.resolve(results).replace(/\\/g, "/"),
            specRunnerPath  = common.resolve("test/SpecRunner.html"),
            args            = " --startup-path=\"" + specRunnerPath + "?suite=" + encodeURIComponent(suite) + "&spec=" + encodeURIComponent(spec) + "&resultsPath=" + encodeURIComponent(resultsPath) + "\"";

        if (platform === "mac") {
            cmd = "open \"" + cmd + "\" -W --args " + args;
        } else {
            cmd += args;
        }
        
        grunt.log.writeln(cmd);

        qexec(cmd, opts).then(function (stdout, stderr) {
            done();
        }, function (err) {
            grunt.log.writeln(err);
            done(false);
        });
    });
    
};