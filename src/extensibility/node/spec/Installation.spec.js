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


/*jslint vars: true, plusplus: true, devel: true, node: true, nomen: true,
indent: 4, maxerr: 50 */
/*global expect, describe, it, xit, beforeEach, afterEach */

"use strict";

var ExtensionsDomain = require("../ExtensionManagerDomain"),
    fs               = require("fs-extra"),
    async            = require("async"),
    path             = require("path");

var testFilesDirectory = path.join(path.dirname(module.filename),
                                    "..",   // node
                                    "..",   // extensibility
                                    "..",   // src
                                    "..",   // brackets
                                    "test",
                                    "spec",
                                    "extension-test-files"),
    installParent      = path.join(path.dirname(module.filename), "extensions"),
    installDirectory   = path.join(installParent, "good"),
    disabledDirectory  = path.join(installParent, "disabled"),
    systemExtensionDirectory = path.join(installParent, "system");

var basicValidExtension  = path.join(testFilesDirectory, "basic-valid-extension.tgz"),
    basicValidExtension2 = path.join(testFilesDirectory, "basic-valid-extension-2.0.tgz"),
    missingMain          = path.join(testFilesDirectory, "missing-main.tgz"),
    oneLevelDown         = path.join(testFilesDirectory, "one-level-extension-master.tgz"),
    incompatibleVersion  = path.join(testFilesDirectory, "incompatible-version.tgz"),
    invalidTar           = path.join(testFilesDirectory, "invalid-tar-file.tgz"),
    missingPackageJSON   = path.join(testFilesDirectory, "missing-package-json.tgz");

describe("Package Installation", function () {
    
    var standardOptions = {
        disabledDirectory: disabledDirectory,
        systemExtensionDirectory: systemExtensionDirectory,
        apiVersion: "0.22.0"
    };
    
    beforeEach(function (done) {
        fs.mkdirs(installDirectory, function (err) {
            fs.mkdirs(disabledDirectory, function (err) {
                done();
            });
        });
    });
    
    afterEach(function (done) {
        fs.remove(installParent, function (err) {
            done();
        });
    });
    
    function checkPaths(pathsToCheck, callback) {
        var existsCalls = [];
        pathsToCheck.forEach(function (path) {
            existsCalls.push(function (callback) {
                fs.exists(path, async.apply(callback, null));
            });
        });
        
        async.parallel(existsCalls, function (err, results) {
            expect(err).toBeNull();
            results.forEach(function (result, num) {
                expect(result ? "" : pathsToCheck[num] + " does not exist").toEqual("");
            });
            callback();
        });
    }
    
    it("should validate the package", function (done) {
        ExtensionsDomain._cmdInstall(missingMain, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            done();
        });
    });
    
    it("should work fine if all is well", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
            var extensionDirectory = path.join(installDirectory, "basic-valid-extension");
            
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(0);
            expect(result.metadata.name).toEqual("basic-valid-extension");
            expect(result.name).toEqual("basic-valid-extension");
            expect(result.installedTo).toEqual(extensionDirectory);
            
            var pathsToCheck = [
                path.join(extensionDirectory, "package.json"),
                path.join(extensionDirectory, "main.js")
            ];
            
            checkPaths(pathsToCheck, done);
        });
    });
    
    // This is mildly redundant. the validation check should catch this.
    // But, I wanted to be sure that the install function doesn't try to
    // do anything with the file before validation.
    it("should fail for missing package", function (done) {
        ExtensionsDomain._cmdInstall(path.join(testFilesDirectory, "NOT A PACKAGE"),
                                     installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                var errors = result.errors;
                expect(errors.length).toEqual(1);
                expect(errors[0][0]).toEqual("NOT_FOUND_ERR");
                done();
            });
    });
    
    it("should install to the disabled directory if it's already installed", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            expect(result.disabledReason).toBeNull();
            ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                expect(result.disabledReason).toEqual("ALREADY_INSTALLED");
                var extensionDirectory = path.join(disabledDirectory, "basic-valid-extension");
                var pathsToCheck = [
                    path.join(extensionDirectory, "package.json"),
                    path.join(extensionDirectory, "main.js")
                ];
                
                checkPaths(pathsToCheck, done);
            });
        });
    });
    
    it("should yield an error if there's no disabled directory set", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, { apiVersion: "0.22.0" }, function (err, result) {
            expect(err.message).toEqual("MISSING_REQUIRED_OPTIONS");
            done();
        });
    });
    
    it("should yield an error if there's no apiVersion set", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, { disabledDirectory: disabledDirectory }, function (err, result) {
            expect(err.message).toEqual("MISSING_REQUIRED_OPTIONS");
            done();
        });
    });
    
    it("should overwrite the disabled directory copy if there's already one", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            expect(result.disabledReason).toBeNull();
            ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                expect(result.disabledReason).toEqual("ALREADY_INSTALLED");
                ExtensionsDomain._cmdInstall(basicValidExtension2, installDirectory, standardOptions, function (err, result) {
                    expect(err).toBeNull();
                    expect(result.disabledReason).toEqual("ALREADY_INSTALLED");
                    var extensionDirectory = path.join(disabledDirectory, "basic-valid-extension");
                    fs.readJson(path.join(extensionDirectory, "package.json"), function (err, packageObj) {
                        expect(err).toBeNull();
                        expect(packageObj.version).toEqual("2.0.0");
                        done();
                    });
                });
            });
        });
    });
    
    it("should derive the name from the package name if there's no package.json", function (done) {
        ExtensionsDomain._cmdInstall(missingPackageJSON, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            expect(result.disabledReason).toBeNull();
            var extensionDirectory = path.join(installDirectory, "missing-package-json");
            var pathsToCheck = [
                path.join(extensionDirectory, "main.js")
            ];
            checkPaths(pathsToCheck, done);
        });
    });
    
    it("should install with the common prefix removed", function (done) {
        ExtensionsDomain._cmdInstall(oneLevelDown, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            var extensionDirectory = path.join(installDirectory, "one-level-extension");
            var pathsToCheck = [
                path.join(extensionDirectory, "main.js"),
                path.join(extensionDirectory, "package.json"),
                path.join(extensionDirectory, "lib", "foo.js")
            ];
            checkPaths(pathsToCheck, done);
        });
    });
    
    it("should disable extensions that are not compatible with the current Brackets API", function (done) {
        ExtensionsDomain._cmdInstall(incompatibleVersion, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            expect(result.disabledReason).toEqual("API_NOT_COMPATIBLE");
            var extensionDirectory = path.join(disabledDirectory, "incompatible-version");
            var pathsToCheck = [
                path.join(extensionDirectory, "main.js"),
                path.join(extensionDirectory, "package.json")
            ];
            checkPaths(pathsToCheck, done);
        });
    });
    
    it("should not have trouble with invalid tar files", function (done) {
        ExtensionsDomain._cmdInstall(invalidTar, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(1);
            done();
        });
    });
    
    it("should remove an installed package", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            expect(fs.existsSync(result.installedTo)).toBe(true);
            ExtensionsDomain._cmdRemove(result.installedTo, function (err) {
                expect(err).toBeNull();
                expect(fs.existsSync(result.installedTo)).toBe(false);
                done();
            });
        });
    });
});