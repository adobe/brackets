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

/*global Promise */
/*eslint-env node */
/*jslint node: true */
"use strict";

module.exports = function (grunt) {

    var _       = require("lodash"),
        build   = require("./build")(grunt),
        common  = require("./lib/common")(grunt),        
        exec    = require("child_process").exec,
        fs      = require("fs-extra"),
        glob    = require("glob"),
        https   = require("https"),
        path    = require("path"),
        tar     = require("tar"),
        temp    = require("temp"),        
        zlib    = require("zlib");
    
    temp.track();
    
    function runNpmInstall(where, callback, includeDevDependencies) {
        var envFlag = includeDevDependencies ? "" : " --production";
        grunt.log.writeln("running npm install" + envFlag + " in " + where);
        exec('npm install' + envFlag, { cwd: './' + where }, function (err, stdout, stderr) {
            if (err) {
                grunt.log.error(stderr);
                console.log("Error running npm install" + envFlag + " in " + where);
            } else {
                grunt.log.writeln(stdout || "finished npm install in " + where);
            }
            return err ? callback(stderr) : callback(null, stdout);
        });
    }

    grunt.registerTask("npm-install", "Install node_modules to the dist folder so it gets bundled with release", function () {
        var npmShrinkwrapJSON = grunt.file.readJSON("npm-shrinkwrap.json");
        common.writeJSON(grunt, "dist/npm-shrinkwrap.json", npmShrinkwrapJSON);

        var packageJSON = grunt.file.readJSON("package.json");
        delete packageJSON.devDependencies;
        delete packageJSON.scripts; // we don't want to run post-install scripts in dist folder
        common.writeJSON(grunt, "dist/package.json", packageJSON);

        var done = this.async();
        runNpmInstall("dist", function (err) {
            return err ? done(false) : done();
        });
    });

    grunt.registerTask("npm-install-src", "Install node_modules to the src folder", function () {
        var _done = this.async(),
            dirs = ["src", "src/JSUtils", "src/JSUtils/node", "src/languageTools/LanguageClient"],
            done = _.after(dirs.length, _done);
        dirs.forEach(function (dir) {
            runNpmInstall(dir, function (err) {
                return err ? _done(false) : done();
            });
        });
    });
    
    grunt.registerTask("npm-install-extensions", "Install node_modules for default extensions which have package.json defined", function () {
        var _done = this.async();
        glob("src/extensions/**/package.json", function (err, files) {
            if (err) {
                grunt.log.error(err);
                return _done(false);
            }
            files = files.filter(function (path) {
                return path.indexOf("node_modules") === -1;
            });
            var done = _.after(files.length, _done);
            files.forEach(function (file) {
                runNpmInstall(path.dirname(file), function (err) {
                    return err ? _done(false) : done();
                });
            });
        });
    });

    grunt.registerTask("npm-install-test", "Install node_modules for tests", function () {
        var _done = this.async();
        var testDirs = [
            "spec/LanguageTools-test-files"
        ];
        testDirs.forEach(function (dir) {
            glob("test/" + dir + "/**/package.json", function (err, files) {
                if (err) {
                    grunt.log.error(err);
                    return _done(false);
                }
                files = files.filter(function (path) {
                    return path.indexOf("node_modules") === -1;
                });
                var done = _.after(files.length, _done);
                files.forEach(function (file) {
                    runNpmInstall(path.dirname(file), function (err) {
                        return err ? _done(false) : done();
                    }, true);
                });
            });
        });
    });

    grunt.registerTask(
        "npm-install-source",
        "Install node_modules for src folder and default extensions which have package.json defined",
        ["npm-install-src", "copy:thirdparty", "npm-install-extensions", "npm-install-test"]
    );
    
    function getNodeModulePackageUrl(extensionName) {
        return new Promise(function (resolve, reject) {
            exec("npm view " + extensionName + " dist.tarball", {}, function (err, stdout, stderr) {
                if (err) {
                    grunt.log.error(stderr);
                }
                return err ? reject(stderr) : resolve(stdout.toString("utf8").trim());
            });
        });
    }
    
    function getTempDirectory(tempName) {
        return new Promise(function (resolve, reject) {
            temp.mkdir(tempName, function(err, dirPath) {
                return err ? reject(err) : resolve(dirPath);
            });
        });
    }
    
    function downloadUrlToFolder(url, dirPath) {
        return new Promise(function (resolve, reject) {
            grunt.log.writeln(url + " downloading...");            
            https.get(url, function (res) {
                
                if (res.statusCode !== 200) {
                    return reject(new Error("Request failed: " + res.statusCode));
                }
                
                var unzipStream = zlib.createGunzip();
                res.pipe(unzipStream);
                
                var extractStream = tar.Extract({ path: dirPath, strip: 0 });
                unzipStream.pipe(extractStream);
                
                extractStream.on('finish', function() {
                    grunt.log.writeln(url + " successfully downloaded");
                    resolve(path.resolve(dirPath, "package"));
                });
                
            }).on('error', function(err) {
                reject(err);
            });
        });
    }
    
    function move(from, to) {
        return new Promise(function (resolve, reject) {
            fs.remove(to, function (err) {
                if (err) {
                    return reject(err);
                }
                fs.move(from, to, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            });
        });
    }
    
    function downloadAndInstallExtensionFromNpm(obj) {
        var extensionName = obj.name;            
        var extensionVersion = obj.version ? "@" + obj.version : "";
        var data = {};
        return getNodeModulePackageUrl(extensionName + extensionVersion)
            .then(function (urlToDownload) {
                data.urlToDownload = urlToDownload;
                return getTempDirectory(extensionName);
            })
            .then(function (tempDirPath) {
                data.tempDirPath = tempDirPath;                
                return downloadUrlToFolder(data.urlToDownload, data.tempDirPath);
            })
            .then(function (extensionPath) {
                var target = path.resolve(__dirname, '..', 'src', 'extensions', 'default', extensionName);
                return move(extensionPath, target);
            });
    }
    
    grunt.registerTask("npm-download-default-extensions",
                       "Downloads extensions from npm and puts them to the src/extensions/default folder",
                       function () {
        
        var packageJSON = grunt.file.readJSON("package.json");
        var extensionsToDownload = Object.keys(packageJSON.defaultExtensions).map(function (name) {
            return {
                name: name,
                version: packageJSON.defaultExtensions[name]
            };
        });
        
        var done = this.async();
        Promise.all(extensionsToDownload.map(function (extension) {
            return downloadAndInstallExtensionFromNpm(extension);
        })).then(function () {
            return done();
        }).catch(function (err) {
            grunt.log.error(err);
            return done(false);
        });
        
    });

};
