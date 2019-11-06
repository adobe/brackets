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
/*jslint node: true */
'use strict';

module.exports = function (grunt) {
    // load dependencies
    require('load-grunt-tasks')(grunt, {
        pattern: [
            'grunt-*',
            '!grunt-cli',
            '!grunt-lib-phantomjs',
            '!grunt-template-jasmine-requirejs'
        ]
    });
    grunt.loadTasks('tasks');

    // Project configuration.
    grunt.initConfig({
        pkg  : grunt.file.readJSON("package.json"),
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        'dist',
                        'src/.index.html',
                        'src/styles/brackets.css'
                    ]
                }]
            },
            node_modules_test_dir : {
                files: [{
                    dot: true,
                    src: [
                        'dist/node_modules/npm/test/fixtures',
                        'dist/node_modules/npm/node_modules/tar/test',
                        'dist/node_modules/npm/node_modules/npm-registry-client/test'
                    ]
                }]
            }
        },
        copy: {
            dist: {
                files: [
                    {
                        'dist/index.html': 'src/.index.html'
                    },
                    /* static files */
                    {
                        expand: true,
                        dest: 'dist/',
                        cwd: 'src/',
                        src: [
                            'nls/{,*/}*.js',
                            'xorigin.js',
                            'dependencies.js',
                            'thirdparty/requirejs/require.js',
                            'LiveDevelopment/launch.html',
                            'LiveDevelopment/transports/**',
                            'LiveDevelopment/MultiBrowserImpl/transports/**',
                            'LiveDevelopment/MultiBrowserImpl/launchers/**'
                        ]
                    },
                    /* node domains are not minified and must be copied to dist */
                    {
                        expand: true,
                        dest: 'dist/',
                        cwd: 'src/',
                        src: [
                            'extensibility/node/**',
                            'JSUtils/node/**',
                            'languageTools/node/**',
                            'languageTools/styles/**',
                            'languageTools/LanguageClient/**',
                            '!extensibility/node/spec/**',
                            '!extensibility/node/node_modules/**/{test,tst}/**/*',
                            '!extensibility/node/node_modules/**/examples/**/*',
                            'filesystem/impls/appshell/node/**',
                            '!filesystem/impls/appshell/node/spec/**',
                            'search/node/**'
                        ]
                    },
                    /* extensions and CodeMirror modes */
                    {
                        expand: true,
                        dest: 'dist/',
                        cwd: 'src/',
                        src: [
                            'extensions/default/**/*',
                            '!extensions/default/*/unittest-files/**/*',
                            '!extensions/default/*/unittests.js',
                            '!extensions/default/{*/thirdparty,**/node_modules}/**/test/**/*',
                            '!extensions/default/{*/thirdparty,**/node_modules}/**/doc/**/*',
                            '!extensions/default/{*/thirdparty,**/node_modules}/**/examples/**/*',
                            '!extensions/default/*/thirdparty/**/*.htm{,l}',
                            'extensions/dev/*',
                            'extensions/samples/**/*',
                            'thirdparty/CodeMirror/**',
                            'thirdparty/i18n/*.js',
                            'thirdparty/text/*.js'
                        ]
                    },
                    /* styles, fonts and images */
                    {
                        expand: true,
                        dest: 'dist/styles',
                        cwd: 'src/styles',
                        src: ['jsTreeTheme.css', 'fonts/{,*/}*.*', 'images/*', 'brackets.min.css*']
                    }
                ]
            },
            thirdparty: {
                files: [
                    {
                        expand: true,
                        dest: 'src/thirdparty/CodeMirror',
                        cwd: 'src/node_modules/codemirror',
                        src: [
                            'addon/{,*/}*',
                            'keymap/{,*/}*',
                            'lib/{,*/}*',
                            'mode/{,*/}*',
                            'theme/{,*/}*'
                        ]
                    },
                    {
                        expand: true,
                        flatten: true,
                        dest: 'src/thirdparty',
                        cwd: 'src/node_modules',
                        src: [
                            'less/dist/less.min.js'
                        ]
                    },
                    {
                        expand: true,
                        flatten: true,
                        dest: 'src/thirdparty/preact-compat',
                        cwd: 'src/node_modules/preact-compat',
                        src: [
                            'dist/preact-compat.min.js'
                        ]
                    },
                    {
                        expand: true,
                        flatten: true,
                        dest: 'src/thirdparty/simulate-event',
                        cwd: 'src/node_modules/simulate-event',
                        src: [
                            'simulate-event.js'
                        ]
                    },
                    {
                        expand: true,
                        flatten: true,
                        dest: 'src/thirdparty/xtend',
                        cwd: 'src/node_modules/xtend',
                        src: [
                            'mutable.js',
                            'immutable.js'
                        ]
                    },
                    {
                        expand: true,
                        dest: 'src/thirdparty/acorn',
                        cwd: 'src/node_modules/acorn',
                        src: [
                            'dist/{,*/}*'
                          ]
                    }
                ]
            }
        },
        cleanempty: {
            options: {
                force: true,
                files: false
            },
            src: ['dist/**/*']
        },
        less: {
            dist: {
                files: {
                    "src/styles/brackets.min.css": "src/styles/brackets.less"
                },
                options: {
                    compress: true,
                    sourceMap: true,
                    sourceMapFilename: 'src/styles/brackets.min.css.map',
                    outputSourceFiles: true,
                    sourceMapRootpath: '',
                    sourceMapBasepath: 'src/styles'
                }
            }
        },
        requirejs: {
            dist: {
                // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
                options: {
                    // `name` and `out` is set by grunt-usemin
                    baseUrl: 'src',
                    optimize: 'uglify2',
                    // brackets.js should not be loaded until after polyfills defined in "utils/Compatibility"
                    // so explicitly include it in main.js
                    include: ["utils/Compatibility", "brackets"],
                    // TODO: Figure out how to make sourcemaps work with grunt-usemin
                    // https://github.com/yeoman/grunt-usemin/issues/30
                    generateSourceMaps: true,
                    useSourceUrl: true,
                    // required to support SourceMaps
                    // http://requirejs.org/docs/errors.html#sourcemapcomments
                    preserveLicenseComments: false,
                    useStrict: true,
                    // Disable closure, we want define/require to be globals
                    wrap: false,
                    exclude: ["text!config.json"],
                    uglify2: {} // https://github.com/mishoo/UglifyJS2
                }
            }
        },
        targethtml: {
            dist: {
                files: {
                    'src/.index.html': 'src/index.html'
                }
            }
        },
        useminPrepare: {
            options: {
                dest: 'dist'
            },
            html: 'src/.index.html'
        },
        usemin: {
            options: {
                dirs: ['dist']
            },
            html: ['dist/{,*/}*.html']
        },
        htmlmin: {
            dist: {
                options: {
                    /*removeCommentsFromCDATA: true,
                    // https://github.com/yeoman/grunt-usemin/issues/44
                    //collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true*/
                },
                files: [{
                    expand: true,
                    cwd: 'src',
                    src: '*.html',
                    dest: 'dist'
                }]
            }
        },
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
                '!test/spec/*-known-goods/**/*.js',
                '!test/spec/FindReplace-test-files-*/**/*.js',
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
            grunt: {
                files: ['<%= meta.grunt %>'],
                tasks: ['eslint:grunt']
            },
            src: {
                files: ['<%= meta.src %>'],
                tasks: ['eslint:src']
            },
            test: {
                files: ['<%= meta.test %>'],
                tasks: ['eslint:test']
            },
            options: {
                spawn: false
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
                    // For reference to why this polyfill is needed see Issue #7951.
                    // The need for this should go away once the version of phantomjs gets upgraded to 2.0
                    'test/polyfills.js',

                    'src/thirdparty/jquery-2.1.3.min.js',
                    'src/thirdparty/less.min.js'
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
        'jasmine_node': {
            projectRoot: 'src/extensibility/node/spec/'
        },
        eslint: {
            grunt:  '<%= meta.grunt %>',
            src:    '<%= meta.src %>',
            test:   '<%= meta.test %>',
            options: {
                quiet: true
            }
        },
        shell: {
            repo: grunt.option("shell-repo") || "../brackets-shell",
            mac: "<%= shell.repo %>/installer/mac/staging/<%= pkg.name %>.app",
            win: "<%= shell.repo %>/installer/win/staging/<%= pkg.name %>.exe",
            linux: "<%= shell.repo %>/installer/linux/debian/package-root/opt/brackets/brackets"
        }
    });

    // task: install
    grunt.registerTask('install', [
        'write-config:dev',
        'less',
        'npm-download-default-extensions',
        'npm-install-source',
        'pack-web-dependencies'
    ]);

    // task: test
    grunt.registerTask('test', ['eslint', 'jasmine', 'nls-check']);
//    grunt.registerTask('test', ['eslint', 'jasmine', 'jasmine_node', 'nls-check']);

    // task: set-release
    // Update version number in package.json and rewrite src/config.json
    grunt.registerTask('set-release', ['update-release-number', 'write-config:dev']);

    grunt.registerTask('build-common', [
        'eslint:src',
        'jasmine',
        'clean',
        'less',
        'targethtml',
        'useminPrepare',
        'htmlmin',
        'requirejs',
        'concat',
        /*'cssmin',*/
        /*'uglify',*/
        'copy:dist',
        'npm-install',
        'cleanempty',
        'usemin',
        'build-config',
        'clean:node_modules_test_dir'
    ]);

    // task: build
    grunt.registerTask('build', [
        'write-config:dist',
        'build-common'
    ]);

    // task: build
    grunt.registerTask('build-prerelease', [
        'write-config:prerelease',
        'build-common'
    ]);

    // Default task.
    grunt.registerTask('default', ['test']);
};

