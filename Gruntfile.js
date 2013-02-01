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
                '!src/extensions/dev/**',
                '!src/extensions/disabled/**',
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
                    'src/thirdparty/mustache/mustache.js'
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
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // task: install
    grunt.registerTask('install', ['write-config']);

    // task: write-config
    // merge package.json and src/brackets.config.json into src/config.json
    grunt.registerTask('write-config', function () {
        var packageJSON = grunt.file.readJSON("package.json"),
            appConfigJSON = grunt.file.readJSON("src/brackets.config.json");

        Object.keys(packageJSON).forEach(function (key) {
            if (appConfigJSON[key] === undefined) {
                appConfigJSON[key] = packageJSON[key];
            }
        });

        grunt.file.write("src/config.json", JSON.stringify(appConfigJSON, null, "    "));
    });

    // task: test
    grunt.registerTask('test', ['jshint', 'jasmine']);

    // Default task.
    grunt.registerTask('default', ['test']);
};
