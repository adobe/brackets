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
/*jslint vars:true, nomen:true*/
/*global module, require, process*/
module.exports = function (grunt) {
    'use strict';

    var common  = require("./tasks/lib/common")(grunt),
        path    = require("path"),
        q       = require("q");
    
    // Project configuration.
    grunt.initConfig({
        pkg  : grunt.file.readJSON("package.json"),
        meta : {
            src   : [
                'src/**/*.js',
                '!src/thirdparty/**',
                '!src/widgets/bootstrap-*.js',
                '!src/extensions/**/unittest-files/**/*.js',
                '!src/extensions/**/thirdparty/**/*.js',
                '!src/extensions/dev/**',
                '!src/extensions/disabled/**',
                '!**/node_modules/**/*.js',
                '!src/**/*-min.js',
                '!src/**/*.min.js'
            ],
            test : [
                'test/**/*.js',
                '!test/perf/*-files/**/*.js',
                '!test/spec/*-files/**/*.js',
                '!test/smokes/**',
                '!test/temp/**',
                '!test/thirdparty/**',
                '!test/**/node_modules/**/*.js'
            ],
            grunt: [
                'Gruntfile.js',
                'tasks/**/*.js'
            ],
            /* specs that can run in phantom.js */
            specs : [
                'test/spec/CommandManager-test.js',
                //'test/spec/LanguageManager-test.js',
                //'test/spec/PreferencesManager-test.js',
                'test/spec/ViewUtils-test.js'
            ]
        },
        watch: {
            all : {
                files: ['**/*', '!**/node_modules/**'],
                tasks: ['jshint']
            },
            grunt : {
                files: ['<%= meta.grunt %>', 'tasks/**/*'],
                tasks: ['jshint:grunt']
            },
            src : {
                files: ['<%= meta.src %>', 'src/**/*'],
                tasks: ['jshint:src']
            },
            test : {
                files: ['<%= meta.test %>', 'test/**/*'],
                tasks: ['jshint:test']
            }
        },
        /* FIXME (jasonsanjose): how to handle extension tests */
        jasmine : {
            src : 'undefined.js', /* trick the default runner to run without importing src files */
            options : {
                junit : {
                    path: 'test/results',
                    consolidate: true
                },
                specs : '<%= meta.specs %>',
                /* Keep in sync with test/SpecRunner.html dependencies */
                vendor : [
                    'src/thirdparty/jquery-2.0.1.min.js',
                    'src/thirdparty/CodeMirror2/lib/codemirror.js',
                    'src/thirdparty/CodeMirror2/lib/util/dialog.js',
                    'src/thirdparty/CodeMirror2/lib/util/searchcursor.js',
                    'src/thirdparty/CodeMirror2/addon/edit/closetag.js',
                    'src/thirdparty/CodeMirror2/addon/selection/active-line.js',
                    'src/thirdparty/mustache/mustache.js',
                    'src/thirdparty/path-utils/path-utils.min',
                    'src/thirdparty/less-1.3.3.min.js'
                ],
                helpers : [
                    'test/spec/PhantomHelper.js'
                ],
                template : require('grunt-template-jasmine-requirejs'),
                templateOptions: {
                    requireConfig : {
                        baseUrl: 'src',
                        paths: {
                            'test' : '../test',
                            'perf' : '../test/perf',
                            'spec' : '../test/spec',
                            'text' : 'thirdparty/text/text',
                            'i18n' : 'thirdparty/i18n/i18n'
                        }
                    }
                }
            }
        },
        'jasmine-node': {
            run: {
                spec: 'src/extensibility/node/spec/'
            }
        },
        jshint: {
            all: [
                '<%= meta.grunt %>',
                '<%= meta.src %>',
                '<%= meta.test %>'
            ],
            grunt:  '<%= meta.grunt %>',
            src:    '<%= meta.src %>',
            test:   '<%= meta.test %>',
            /* use strict options to mimic JSLINT until we migrate to JSHINT in Brackets */
            options: {
                jshintrc: '.jshintrc'
            }
        },
        shell: {
            repo: grunt.option("shell-repo") || "../brackets-shell",
            mac: "<%= shell.repo %>/installer/mac/staging/<%= pkg.name %>.app",
            win: "<%= shell.repo %>/installer/win/staging/<%= pkg.name %>.exe"
        }
    });

    // load dependencies
    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine-node');
    
    // task: install
    grunt.registerTask('install', ['write-config']);

    // task: test
    grunt.registerTask('test', ['jshint:all', 'jasmine']);
    //grunt.registerTask('test', ['jshint:all', 'jasmine', jasmine-node']);

    // task: set-sprint
    // Update sprint number in package.json and rewrite src/config.json
    grunt.registerTask('set-sprint', ['update-sprint-number', 'write-config']);
    
    /**
     * @private
     * Validate path to a Brackets install. Optionally print usage
     * @param {string} bracketsAppPath
     */
    function _validateInstallPath(taskName, bracketsAppPath) {
        var platform = common.platform(),
            sample,
            bracketsAppPathExists = grunt.file.exists(bracketsAppPath);
        
        if (!bracketsAppPath || !bracketsAppPathExists) {
            if (platform === "mac") {
                sample = "/Applications/Brackets Sprint 28.app";
            } else if (platform === "win") {
                sample = "C:\\Program Files (x86)\\Brackets Sprint 28";
            } else {
                sample = "/usr/lib/brackets";
            }
            
            if (!bracketsAppPathExists) {
                grunt.log.error("Path does not exist: " + bracketsAppPath);
            }
            
            grunt.log.error("Usage: grunt " + taskName + ":" + sample);
            
            return;
        }
        
        if (common.platform() === "mac") {
            return path.join(bracketsAppPath, "Contents", "dev");
        } else {
            return path.join(bracketsAppPath, "dev");
        }
    }
    
    // task: dev-install
    grunt.registerTask("dev-install", "Direct brackets-shell installation to point to brackets git repository for development", function (bracketsAppPath) {
        var done = this.async,
            destPath = _validateInstallPath(this.name, bracketsAppPath);
        
        if (destPath) {
            var promise,
                errBack = function (err) {
                    grunt.log.error(err);
                    done(false);
                };
            
            if (grunt.file.exists(destPath)) {
                // remove old symlink if it exists
                promise = common.unlink(destPath);
            } else {
                // standalone promise
                promise = q();
            }
            
            promise.then(common.link(process.cwd(), destPath).then(done, errBack), errBack);
        } else {
            done(false);
        }
    });
    
    // task: dev-uninstall
    grunt.registerTask("dev-uninstall", "Remove symlink to brackets git repository", function (bracketsAppPath) {
        var done = this.async(),
            destPath = _validateInstallPath(this.name, bracketsAppPath);
        
        if (destPath) {
            if (grunt.file.exists(destPath)) {
                common.unlink(destPath).then(done, function (err) {
                    grunt.log.error(err);
                    done(false);
                });
            } else {
                grunt.log.error("Path does not exist: " + destPath);
                done(false);
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['test']);
};
