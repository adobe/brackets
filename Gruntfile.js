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

// Brackets specific config vars
var habitat = require('habitat');
habitat.load();
var env = new habitat();

var GIT_BRANCH = env.get("BRAMBLE_MAIN_BRANCH") || "bramble";
var GIT_REMOTE = env.get("BRAMBLE_MAIN_REMOTE") || "upstream";

module.exports = function (grunt) {
    'use strict';

    // load dependencies
    require('load-grunt-tasks')(grunt, {pattern: ['grunt-contrib-*', 'grunt-targethtml', 'grunt-usemin', 'grunt-cleanempty', 'grunt-npm', 'grunt-git', 'grunt-update-submodules']});
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
            }
        },
        uglify: {
            options: {
                mangle: false,
                compress: false
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: [
                        /* static files */
                        'nls/{,*/}*.js',
                        'xorigin.js',
                        'dependencies.js',
                        'thirdparty/requirejs/require.js',
                        'LiveDevelopment/MultiBrowserImpl/transports/**/*.js',
                        'LiveDevelopment/MultiBrowserImpl/launchers/**/*.js',

                        /* extensions and CodeMirror modes */
                        '!extensions/default/*/unittests.js',
                        'extensions/default/*/**/*.js',
                        '!**/unittest-files/**',
                        '!extensions/default/JavaScriptCodeHints/thirdparty/*/test/**/*',
                        '!extensions/default/**/node_modules/**/*',
                        'thirdparty/CodeMirror2/addon/{,*/}*.js',
                        'thirdparty/CodeMirror2/keymap/{,*/}*.js',
                        'thirdparty/CodeMirror2/lib/{,*/}*.js',
                        'thirdparty/CodeMirror2/mode/{,*/}*.js',
                        'thirdparty/CodeMirror2/theme/{,*/}*.js',
                        'thirdparty/i18n/*.js',
                        'thirdparty/text/*.js'
                    ],
                    dest: 'dist/'
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
                            'LiveDevelopment/MultiBrowserImpl/transports/**',
                            'LiveDevelopment/MultiBrowserImpl/launchers/**'
                        ]
                    },
                    /* extensions and CodeMirror modes */
                    {
                        expand: true,
                        dest: 'dist/',
                        cwd: 'src/',
                        src: [
                            'extensions/default/**/*',
                            '!extensibility/node/spec/**',
                            '!extensibility/node/node_modules/**/{test,tst}/**/*',
                            '!extensibility/node/node_modules/**/examples/**/*',
                            '!filesystem/impls/appshell/**/*',
                            '!extensions/default/*/unittest-files/**/*',
                            '!extensions/default/*/unittests.js',
                            '!extensions/default/{*/thirdparty,**/node_modules}/**/test/**/*',
                            '!extensions/default/{*/thirdparty,**/node_modules}/**/doc/**/*',
                            '!extensions/default/{*/thirdparty,**/node_modules}/**/examples/**/*',
                            '!extensions/default/*/thirdparty/**/*.htm{,l}',
                            'extensions/dev/*',
                            'extensions/samples/**/*',
                            'thirdparty/CodeMirror/addon/{,*/}*',
                            'thirdparty/CodeMirror/keymap/{,*/}*',
                            'thirdparty/CodeMirror/lib/{,*/}*',
                            'thirdparty/CodeMirror/mode/{,*/}*',
                            '!thirdparty/CodeMirror/mode/**/*.html',
                            '!thirdparty/CodeMirror/**/*test.js',
                            'thirdparty/CodeMirror/theme/{,*/}*',
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
            }
        },
        cleanempty: {
            options: {
                force: true,
                files: false
            },
            src: ['dist/**/*'],
        },
        less: {
            dist: {
                files: {
                    "src/styles/brackets.min.css": "src/styles/brackets.less"
                },
                options: {
                    compress: true
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
                    'test/polyfills.js', /* For reference to why this polyfill is needed see Issue #7951. The need for this should go away once the version of phantomjs gets upgraded to 2.0 */
                    'src/thirdparty/jquery-2.1.3.min.js',
                    'src/thirdparty/CodeMirror/lib/codemirror.js',
                    'src/thirdparty/CodeMirror/lib/util/dialog.js',
                    'src/thirdparty/CodeMirror/lib/util/searchcursor.js',
                    'src/thirdparty/CodeMirror/addon/edit/closetag.js',
                    'src/thirdparty/CodeMirror/addon/selection/active-line.js',
                    'src/thirdparty/mustache/mustache.js',
                    'src/thirdparty/path-utils/path-utils.min',
                    'src/thirdparty/less-1.7.5.min.js'
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
        jshint: {
            all: [
                '<%= meta.grunt %>',
                '<%= meta.src %>',
                '<%= meta.test %>',
                // These modules include lots of third-party code, so we skip them
                '!src/extensions/default/HTMLHinter/slowparse/**',
                '!src/extensions/default/HTMLHinter/tooltipsy.source.js',
                '!src/extensions/default/brackets-browser-livedev/nohost/**',
                //With Previous skip statement, this file was ignored, so we specify it directly for jshinting
                'src/extensions/default/brackets-browser-livedev/nohost/src/NoHostServer.js'
            ],
            grunt:  '<%= meta.grunt %>',
            src:    [
                '<%= meta.src %>',
                // These modules include lots of third-party code, so we skip them
                '!src/extensions/default/HTMLHinter/slowparse/**',
                '!src/extensions/default/HTMLHinter/tooltipsy.source.js',
                '!src/extensions/default/brackets-browser-livedev/nohost/**',
                //With Previous skip statement, this file was ignored, so we specify it directly for jshinting
                'src/extensions/default/brackets-browser-livedev/nohost/src/NoHostServer.js'
            ],
            test:   '<%= meta.test %>',
            /* use strict options to mimic JSLINT until we migrate to JSHINT in Brackets */
            options: {
                jshintrc: '.jshintrc'
            }
        },
        shell: {
            repo: grunt.option("shell-repo") || "../brackets-shell",
            mac: "<%= shell.repo %>/installer/mac/staging/<%= pkg.name %>.app",
            win: "<%= shell.repo %>/installer/win/staging/<%= pkg.name %>.exe",
            linux: "<%= shell.repo %>/installer/linux/debian/package-root/opt/brackets/brackets"
        },

        // Brackets specific tasks
        'npm-checkBranch': {
            options: {
                branch: GIT_BRANCH
            }
        },
        gitcheckout: {
            smart: {
                options: {
                    branch: 'gh-pages',
                    overwrite: false
                }
            },
        },
        gitfetch: {
            smart: {
                options: {}
            }
        },
        "update_submodules": {
            publish: {
                options: {
                    params: "--remote -- src/extensions/default/brackets-browser-livedev src/extensions/default/HTMLHinter"
                }
            }
        },
        gitcommit: {
            module: {
                options: {
                    // This is replaced during the 'publish' task
                    message: "Placeholder"
                }
            },
            publish: {
                options: {
                    noStatus: true,
                    allowEmpty: true,
                    message: "Latest distribution version of Bramble."
                }
            }
        },
        gitadd: {
            publish: {
                files: {
                    src: ['./dist/*']
                },
                options: {
                    force: true
                }
            },
            modules: {
                files: {
                    src: ['./src/extensions/default/brackets-browser-livedev', './src/extensions/default/HTMLHinter']
                }
            }
        },
        gitpush: {
            smart: {
                options: {
                    remote: GIT_REMOTE,
                    // These options are left in for
                    // clarity. Their actual values
                    // will be set by the `publish` task.
                    branch: 'gh-pages',
                    force: true
                },
            }
        }
    });

    // Bramble-task: smartCheckout
    //   Checks out to the branch provided as a target.
    //   Takes:
    //    [branch] - The branch to checkout to
    //    [overwrite] - If true, resets the target branch to the
    //                  value of the starting branch
    grunt.registerTask('smartCheckout', function(branch, overwrite) {
        overwrite = overwrite === "true" ? true : false;

        grunt.config('gitcheckout.smart.options.branch', branch);
        grunt.config('gitcheckout.smart.options.overwrite', overwrite);
        grunt.task.run('gitcheckout:smart');
    });

    // Bramble-task: smartPush
    //   Checks out to the branch provided as a target.
    //   Takes:
    //    [branch] - The branch to push to
    //    [force] - If true, forces a push
    grunt.registerTask('smartPush', function(branch, force) {
        force = force === "true" ? true : false;

        grunt.config('gitpush.smart.options.branch', branch);
        grunt.config('gitpush.smart.options.force', force);
        grunt.task.run('gitpush:smart');
    });

    // Bramble-task: publish-submodules
    //  Updates submodules, committing and pushing
    //  the result upstream, and also builds and pushes the
    //  dist version for use in thimble.
    grunt.registerTask('publish-submodules', 'Update submodules and the gh-pages branch with the latest built version of bramble.', function(patchLevel) {
        var date = new Date(Date.now()).toString();
        grunt.config("gitcommit.module.options.message", "Submodule update on " + date);

        grunt.task.run([
            // Confirm we're ready to start
            'checkBranch',

            // Update submodules, commit and push to "master"
            'update_submodules:publish',
            'gitadd:modules',
            'gitcommit:module',
            'smartPush:' + GIT_BRANCH + ":false",
        ]);
    });

    // task: install
    grunt.registerTask('install', ['write-config', 'less']);

    // task: test
    grunt.registerTask('test', ['jshint:all', 'jasmine']);
//    grunt.registerTask('test', ['jshint:all', 'jasmine', 'jasmine_node']);

    // task: set-release
    // Update version number in package.json and rewrite src/config.json
    grunt.registerTask('set-release', ['update-release-number', 'write-config']);

    // task: build
    grunt.registerTask('build', [
        'jshint:src',
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
        'copy',
        'cleanempty',
        'usemin',
        'build-config'
    ]);

    // task: build dist/ for browser
    grunt.registerTask('build-browser', ['build', 'uglify']);

    // Default task.
    grunt.registerTask('default', ['test']);
};
