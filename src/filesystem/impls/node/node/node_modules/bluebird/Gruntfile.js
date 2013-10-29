"use strict";
Error.stackTraceLimit = 100;
var astPasses = require("./ast_passes.js");
var cc = require("closure-compiler");
var node11 = parseInt(process.versions.node.split(".")[1], 10) >= 11;
var Q = require("q");
Q.longStackSupport = true;

module.exports = function( grunt ) {

    var optionalModuleDependencyMap = {
        "any.js": ['Promise', 'Promise$_All', 'PromiseArray'],
        "call_get.js": ['Promise'],
        "filter.js": ['Promise', 'Promise$_All', 'PromiseArray', 'apiRejection'],
        "generators.js": ['Promise', 'apiRejection'],
        "map.js": ['Promise', 'Promise$_All', 'PromiseArray', 'apiRejection'],
        "nodeify.js": ['Promise'],
        "promisify.js": ['Promise'],
        "props.js": ['Promise', 'PromiseArray'],
        "reduce.js": ['Promise', 'Promise$_All', 'PromiseArray', 'apiRejection'],
        "settle.js": ['Promise', 'Promise$_All', 'PromiseArray'],
        "some.js": ['Promise', 'Promise$_All', 'PromiseArray', 'apiRejection'],
        "progress.js": ['Promise'],
        "cancel.js": ['Promise'],
        "simple_thenables.js": ['Promise'],
        "complex_thenables.js": ['Promise'],
        "synchronous_inspection.js": ['Promise']

    };

    var optionalModuleRequireMap = {
        "any.js": true,
        "call_get.js": true,
        "filter.js": true,
        "generators.js": true,
        "map.js": true,
        "nodeify.js": true,
        "promisify.js": true,
        "props.js": true,
        "reduce.js": true,
        "settle.js": true,
        "some.js": true,
        "progress.js": true,
        "cancel.js": true,
        "simple_thenables.js": true,
        "complex_thenables.js": true,
        "synchronous_inspection.js": true

    };

    function getOptionalRequireCode( srcs ) {
        return srcs.reduce(function(ret, cur, i){
            if( optionalModuleRequireMap[cur] ) {
                ret += "require('./"+cur+"')("+ optionalModuleDependencyMap[cur] +");\n";
            }
            return ret;
        }, "") + "\nPromise.prototype = Promise.prototype;\nreturn Promise;\n";
    }

    function getBrowserBuildHeader( sources ) {
        var header = "/**\n * bluebird build version " + gruntConfig.pkg.version + "\n";
        var enabledFeatures = ["core"];
        var disabledFeatures = [];
        featureLoop: for( var key in optionalModuleRequireMap ) {
            for( var i = 0, len = sources.length; i < len; ++i ) {
                var source = sources[i];
                if( source.fileName === key ) {
                    enabledFeatures.push( key.replace( ".js", "") );
                    continue featureLoop;
                }
            }
            disabledFeatures.push( key.replace( ".js", "") );
        }

        header += ( " * Features enabled: " + enabledFeatures.join(", ") + "\n" );

        if( disabledFeatures.length ) {
            header += " * Features disabled: " + disabledFeatures.join(", ") + "\n";
        }
        header += "*/\n";
        return header;
    }

    function applyOptionalRequires( src, optionalRequireCode ) {
        return src.replace( /};([^}]*)$/, optionalRequireCode + "\n};$1");
    }

    var CONSTANTS_FILE = './src/constants.js';
    var BUILD_DEBUG_DEST = "./js/main/bluebird.js";

    var license;
    function getLicense() {
        if( !license ) {
            var fs = require("fs");
            var text = fs.readFileSync("LICENSE", "utf8");
            text = text.split("\n").map(function(line, index){
                return " * " + line;
            }).join("\n")
            license = "/**\n" + text + "\n */\n";
        }
        return license
    }

    var preserved;
    function getLicensePreserve() {
        if( !preserved ) {
            var fs = require("fs");
            var text = fs.readFileSync("LICENSE", "utf8");
            text = text.split("\n").map(function(line, index){
                if( index === 0 ) {
                    return " * @preserve " + line;
                }
                return " * " + line;
            }).join("\n")
            preserved = "/**\n" + text + "\n */\n";
        }
        return preserved;
    }

    function writeFile( dest, content ) {
        grunt.file.write( dest, content );
        grunt.log.writeln('File "' + dest + '" created.');
    }

    function writeFileAsync( dest, content ) {
        var fs = require("fs");
        return Q.nfcall(fs.writeFile, dest, content).then(function(){
            grunt.log.writeln('File "' + dest + '" created.');
        });
    }

    var gruntConfig = {};

    var getGlobals = function() {
        var fs = require("fs");
        var file = "./src/constants.js";
        var contents = fs.readFileSync(file, "utf8");
        var rconstantname = /CONSTANT\(\s*([^,]+)/g;
        var m;
        var globals = {
            Error: true,
            TypeError: true,
            __DEBUG__: false,
            __BROWSER__: false,
            process: false,
            "console": false,
            "require": false,
            "module": false,
            "define": false
        };
        while( ( m = rconstantname.exec( contents ) ) ) {
            globals[m[1]] = false;
        }
        return globals;
    }

    gruntConfig.pkg = grunt.file.readJSON("package.json");

    gruntConfig.jshint = {
        all: {
            options: {
                globals: getGlobals(),

                "bitwise": false,
                "camelcase": true,
                "curly": true,
                "eqeqeq": true,
                "es3": true,
                "forin": true,
                "immed": true,
                "latedef": false,
                "newcap": true,
                "noarg": true,
                "noempty": true,
                "nonew": true,
                "plusplus": false,
                "quotmark": "double",
                "undef": true,
                "unused": true,
                "strict": false,
                "trailing": true,
                "maxparams": 6,
                "maxlen": 80,

                "asi": false,
                "boss": true,
                "eqnull": true,
                "evil": true,
                "expr": false,
                "funcscope": false,
                "globalstrict": false,
                "lastsemic": false,
                "laxcomma": false,
                "laxbreak": false,
                "loopfunc": true,
                "multistr": true,
                "proto": false,
                "scripturl": true,
                "smarttabs": false,
                "shadow": true,
                "sub": true,
                "supernew": false,
                "validthis": true,

                "browser": true,
                "jquery": true,
                "devel": true,


                '-W014': true,
                '-W116': true,
                '-W106': true,
                '-W064': true,
                '-W097': true
            },

            files: {
                src: [
                    "./src/synchronous_inspection.js",
                    "./src/simple_thenables.js",
                    "./src/complex_thenables.js",
                    "./src/progress.js",
                    "./src/cancel.js",
                    "./src/any.js",
                    "./src/call_get.js",
                    "./src/filter.js",
                    "./src/generators.js",
                    "./src/map.js",
                    "./src/nodeify.js",
                    "./src/promisify.js",
                    "./src/props.js",
                    "./src/reduce.js",
                    "./src/settle.js",
                    "./src/some.js",
                    "./src/util.js",
                    "./src/schedule.js",
                    "./src/queue.js",
                    "./src/errors.js",
                    "./src/captured_trace.js",
                    "./src/async.js",
                    "./src/catch_filter.js",
                    "./src/promise.js",
                    "./src/promise_array.js",
                    "./src/settled_promise_array.js",
                    "./src/any_promise_array.js",
                    "./src/some_promise_array.js",
                    "./src/properties_promise_array.js",
                    "./src/promise_inspection.js",
                    "./src/promise_resolver.js",
                    "./src/promise_spawn.js"
                ]
            }
        }
    };

    gruntConfig.bump = {
      options: {
        files: ['package.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['-a'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        false: true,
        pushTo: 'master',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
      }
    };

    grunt.initConfig(gruntConfig);
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-bump');

    function runIndependentTest( file, cb , env) {
        var fs = require("fs");
        var path = require("path");
        var sys = require('sys');
        var spawn = require('child_process').spawn;
        var p = path.join(process.cwd(), "test");

        var stdio = [
            'ignore',
            grunt.option("verbose")
                ? process.stdout
                : 'ignore',
            process.stderr
        ];
        var flags = node11 ? ["--harmony-generators"] : [];
        if( file.indexOf( "mocha/") > -1 || file === "aplus.js" ) {
            var node = spawn('node', flags.concat(["../mocharun.js", file]),
                             {cwd: p, stdio: stdio, env: env});
        }
        else {
            var node = spawn('node', flags.concat(["./"+file]),
                             {cwd: p, stdio: stdio, env:env});
        }
        node.on('exit', exit );

        function exit( code ) {
            if( code !== 0 ) {
                cb(new Error("process didn't exit normally. Code: " + code));
            }
            else {
                cb(null);
            }
        }


    }

    function buildMain( sources, optionalRequireCode ) {
        var fs = require("fs");
        var Q = require("q");
        var root = "./js/main/";


        return Q.all(sources.map(function( source ) {
            var src = astPasses.removeAsserts( source.sourceCode, source.fileName );
            src = astPasses.expandConstants( src, source.fileName );
            src = src.replace( /__DEBUG__/g, "false" );
            src = src.replace( /__BROWSER__/g, "false" );
            if( source.fileName === "promise.js" ) {
                src = applyOptionalRequires( src, optionalRequireCode );
            }
            var path = root + source.fileName;
            return writeFileAsync(path, src);
        }));
    }

    function buildDebug( sources, optionalRequireCode ) {
        var fs = require("fs");
        var Q = require("q");
        var root = "./js/debug/";

        return Q.all(sources.map(function( source ) {
            var src = astPasses.expandAsserts( source.sourceCode, source.fileName );
            src = astPasses.expandConstants( src, source.fileName );
            src = src.replace( /__DEBUG__/g, "true" );
            src = src.replace( /__BROWSER__/g, "false" );
            if( source.fileName === "promise.js" ) {
                src = applyOptionalRequires( src, optionalRequireCode );
            }
            var path = root + source.fileName;
            return writeFileAsync(path, src);
        }));
    }

    function buildZalgo( sources, optionalRequireCode ) {
        var fs = require("fs");
        var Q = require("q");
        var root = "./js/zalgo/";

        return Q.all(sources.map(function( source ) {
            var src = astPasses.removeAsserts( source.sourceCode, source.fileName );
            src = astPasses.expandConstants( src, source.fileName );
            src = astPasses.asyncConvert( src, "async", "invoke", source.fileName);
            src = src.replace( /__DEBUG__/g, "false" );
            src = src.replace( /__BROWSER__/g, "false" );
            if( source.fileName === "promise.js" ) {
                src = applyOptionalRequires( src, optionalRequireCode );
            }
            var path = root + source.fileName;
            return writeFileAsync(path, src);
        }));
    }

    function buildBrowser( sources ) {
        var fs = require("fs");
        var browserify = require("browserify");
        var b = browserify("./js/main/bluebird.js");
        var dest = "./js/browser/bluebird.js";

        var header = getBrowserBuildHeader( sources );

        return Q.nbind(b.bundle, b)({
                detectGlobals: false,
                standalone: "Promise"
        }).then(function(src) {
            return writeFileAsync( dest,
                getLicensePreserve() + src )
        }).then(function() {
            return Q.nfcall(fs.readFile, dest, "utf8" );
        }).then(function( src ) {
            src = header + src;
            src = src.replace( "longStackTraces = false", "longStackTraces = true" );
            return Q.nfcall(fs.writeFile, dest, src );
        });
    }

    function getOptionalPathsFromOption( opt ) {
        opt = (opt + "").toLowerCase().split(/\s+/g);
        return optionalPaths.filter(function(v){
            v = v.replace("./src/", "").replace( ".js", "" ).toLowerCase();
            return opt.indexOf(v) > -1;
        });
    }

    var optionalPaths = [
        "./src/synchronous_inspection.js",
        "./src/any.js",
        "./src/call_get.js",
        "./src/filter.js",
        "./src/generators.js",
        "./src/map.js",
        "./src/nodeify.js",
        "./src/promisify.js",
        "./src/props.js",
        "./src/reduce.js",
        "./src/settle.js",
        "./src/some.js",
        "./src/progress.js",
        "./src/cancel.js"
    ];

    var mandatoryPaths = [
        "./src/bluebird.js",
        "./src/assert.js",
        "./src/global.js",
        "./src/util.js",
        "./src/schedule.js",
        "./src/queue.js",
        "./src/errors.js",
        "./src/errors_api_rejection.js",
        "./src/captured_trace.js",
        "./src/async.js",
        "./src/catch_filter.js",
        "./src/promise.js",
        "./src/promise_array.js",
        "./src/settled_promise_array.js",
        "./src/any_promise_array.js",
        "./src/some_promise_array.js",
        "./src/properties_promise_array.js",
        "./src/promise_inspection.js",
        "./src/promise_resolver.js",
        "./src/promise_spawn.js"
    ];

    var mutExPaths = [
        {
            feature: "simple_thenables",
            featureDisabled: "./src/complex_thenables.js",
            featureEnabled: "./src/simple_thenables.js"
        }
    ];

    function applyMutExPaths( paths, features ) {
        if( !Array.isArray( features ) ) {
            features = features.toLowerCase().split( /\s+/g );
        }
        mutExPaths.forEach(function( mutExPath ){
            if( features.indexOf( mutExPath.feature ) > -1 ) {
                paths.push( mutExPath.featureEnabled );
            }
            else {
                paths.push( mutExPath.featureDisabled );
            }
        });
        return paths;
    }

    function build( paths ) {
        var fs = require("fs");
        astPasses.readConstants(fs.readFileSync(CONSTANTS_FILE, "utf8"), CONSTANTS_FILE);
        if( !paths ) {
            paths = applyMutExPaths( optionalPaths.concat(mandatoryPaths), [] );
        }
        var optionalRequireCode = getOptionalRequireCode(paths.map(function(v) {
            return v.replace("./src/", "");
        }));

        var Q = require("q");

        var promises = [];
        var sources = paths.map(function(v){
            var promise = Q.nfcall(fs.readFile, v, "utf8");
            promises.push(promise);
            var ret = {};

            ret.fileName = v.replace("./src/", "");
            ret.sourceCode = promise.then(function(v){
                ret.sourceCode = v;
            });
            return ret;
        });

        //Perform common AST passes on all builds
        return Q.all(promises.slice()).then(function(){
            sources.forEach( function( source ) {
                var src = source.sourceCode
                src = astPasses.removeComments(src, source.fileName);
                src = getLicense() + src;
                source.sourceCode = src;
            });

            return Q.all([
                buildMain( sources, optionalRequireCode ).then( function() {
                    return buildBrowser( sources );
                }),
                buildDebug( sources, optionalRequireCode ),
                buildZalgo( sources, optionalRequireCode )
            ]);
        });
    }

    String.prototype.contains = function String$contains( str ) {
        return this.indexOf( str ) >= 0;
    };

    function isSlowTest( file ) {
        return file.contains("2.3.3") ||
            file.contains("bind") ||
            file.contains("unhandled_rejections");
    }

    function testRun( testOption ) {
        var fs = require("fs");
        var path = require("path");
        var done = this.async();
        var adapter = global.adapter = require(BUILD_DEBUG_DEST);

        var totalTests = 0;
        var testsDone = 0;
        function testDone() {
            testsDone++;
            if( testsDone >= totalTests ) {
                done();
            }
        }
        var files;
        if( testOption === "aplus" ) {
            files = fs.readdirSync("test/mocha").filter(function(f){
                return /^\d+\.\d+\.\d+/.test(f);
            }).map(function( f ){
                return "mocha/" + f;
            });
        }
        else {
            files = testOption === "all"
                ? fs.readdirSync('test')
                    .concat(fs.readdirSync('test/mocha')
                        .map(function(fileName){
                            return "mocha/" + fileName
                        })
                    )
                : [testOption + ".js" ];


            if( testOption !== "all" &&
                !fs.existsSync( "./test/" + files[0] ) ) {
                files[0] = "mocha/" + files[0];
            }
        }
        files = files.filter(function(fileName){
            if( !node11 && fileName.indexOf("generator") > -1 ) {
                return false;
            }
            return /\.js$/.test(fileName);
        }).map(function(f){
            return f.replace( /(\d)(\d)(\d)/, "$1.$2.$3" );
        });


        var slowTests = files.filter(isSlowTest);
        files = files.filter(function(file){
            return !isSlowTest(file);
        });

        function runFile(file) {
            totalTests++;
            grunt.log.writeln("Running test " + file );
            var env = undefined;
            if (file.indexOf("bluebird-debug-env-flag") >= 0) {
                env = Object.create(process.env);
                env["BLUEBIRD_DEBUG"] = true;
            }
            runIndependentTest(file, function(err) {
                if( err ) throw new Error(err + " " + file + " failed");
                grunt.log.writeln("Test " + file + " succeeded");
                testDone();
                if( files.length > 0 ) {
                    runFile( files.shift() );
                }
            }, env);
        }

        slowTests.forEach(runFile);

        var maxParallelProcesses = 10;
        var len = Math.min( files.length, maxParallelProcesses );
        for( var i = 0; i < len; ++i ) {
            runFile( files.shift() );
        }
    }

    grunt.registerTask( "build", function() {
        var done = this.async();

        var features = grunt.option("features");
        var paths = null;
        if( features ) {
            paths = getOptionalPathsFromOption( features ).concat( mandatoryPaths );
            applyMutExPaths( paths, features );
        }

        build( paths ).then(function() {
            done();
        }).catch(function(e) {
            if( e.fileName && e.stack ) {
                var stack = e.stack.split("\n");
                stack[0] = stack[0] + " " + e.fileName;
                console.error(stack.join("\n"));
            }
            else {
                console.error(e.stack);
            }
            done(false);
        });
    });

    grunt.registerTask( "testrun", function(){
        var testOption = grunt.option("run");
        if( !testOption ) testOption = "all";
        else {
            testOption = ("" + testOption);
            testOption = testOption
                .replace( /\.js$/, "" )
                .replace( /[^a-zA-Z0-9_-]/g, "" );
        }
        testRun.call( this, testOption );
    });

    grunt.registerTask( "test", ["jshint", "build", "testrun"] );
    grunt.registerTask( "default", ["jshint", "build"] );

};
