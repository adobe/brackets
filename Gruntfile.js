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
    'use strict';

    // Project configuration.
    grunt.initConfig({
        meta : {
            src   : [
                'src/**/*.js',
                '!src/thirdparty/**',
                '!src/widgets/bootstrap-*.js',
                '!src/extensions/**/unittest-files/**/*.js',
                '!src/extensions/**/thirdparty/**/*.js',
                '!src/extensions/dev/**',
                '!src/extensions/disabled/**',
                '!src/extensions/**/node_modules/**/*.js',
                '!src/**/*-min.js',
                '!src/**/*.min.js'
            ],
            test : [
                'test/**/*.js',
                '!test/perf/*-files/**/*.js',
                '!test/spec/*-files/**/*.js',
                '!test/smokes/**',
                '!test/temp/**',
                '!test/thirdparty/**'
            ],
            /* specs that can run in phantom.js */
            specs : [
                'test/spec/CommandManager-test.js',
                'test/spec/LanguageManager-test.js',
                'test/spec/PreferencesManager-test.js',
                'test/spec/ViewUtils-test.js'
            ]
        },
        watch: {
            test : {
                files: ['Gruntfile.js', '<%= meta.src %>', '<%= meta.test %>'],
                tasks: 'test'
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
                    'src/thirdparty/jquery-1.7.js',
                    'src/thirdparty/CodeMirror2/lib/codemirror.js',
                    'src/thirdparty/CodeMirror2/lib/util/dialog.js',
                    'src/thirdparty/CodeMirror2/lib/util/searchcursor.js',
                    'src/thirdparty/mustache/mustache.js',
                    'src/thirdparty/path-utils/path-utils.min'
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
                            'text' : 'thirdparty/text',
                            'i18n' : 'thirdparty/i18n'
                        }
                    }
                }
            }
        },
        jshint: {
            all: [
                'Gruntfile.js',
                '<%= meta.src %>',
                '<%= meta.test %>'
            ],
            /* use strict options to mimic JSLINT until we migrate to JSHINT in Brackets */
            options: {
                jshintrc: '.jshintrc'
            }
        }
    });

    // load dependencies
    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // task: install
    grunt.registerTask('install', ['write-config']);

    // task: test
    grunt.registerTask('test', ['jshint', 'jasmine']);

    // task: set-sprint
    // Update sprint number in package.json and rewrite src/config.json
    grunt.registerTask('set-sprint', ['update-sprint-number', 'write-config']);

    // Default task.
    grunt.registerTask('default', ['test']);
};
