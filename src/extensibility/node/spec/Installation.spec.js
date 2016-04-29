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


/*jslint vars: true, plusplus: true, devel: true, node: true, nomen: true,
indent: 4, maxerr: 50 */
/*global expect, describe, it, beforeEach, afterEach */

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

var basicValidExtension       = path.join(testFilesDirectory, "basic-valid-extension.zip"),
    basicValidExtension09     = path.join(testFilesDirectory, "basic-valid-extension-0.9.zip"),
    basicValidExtension2      = path.join(testFilesDirectory, "basic-valid-extension-2.0.zip"),
    missingMain               = path.join(testFilesDirectory, "missing-main.zip"),
    oneLevelDown              = path.join(testFilesDirectory, "one-level-extension-master.zip"),
    incompatibleVersion       = path.join(testFilesDirectory, "incompatible-version.zip"),
    invalidZip                = path.join(testFilesDirectory, "invalid-zip-file.zip"),
    missingPackageJSON        = path.join(testFilesDirectory, "missing-package-json.zip"),
    missingPackageJSONUpdate  = path.join(testFilesDirectory, "missing-package-json-update.zip"),
    missingPackageJSONRenamed = path.join(testFilesDirectory, "added-package-json-test", "missing-package-json.zip"),
    withSymlink               = path.join(testFilesDirectory, "with-symlink.zip");


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
            expect(result.installationStatus).toEqual("FAILED");
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
            expect(result.installationStatus).toEqual("INSTALLED");

            var pathsToCheck = [
                path.join(extensionDirectory, "package.json"),
                path.join(extensionDirectory, "main.js")
            ];

            checkPaths(pathsToCheck, done);
        });
    });

    it("should signal if an update installation is required", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
            var extensionDirectory = path.join(installDirectory, "basic-valid-extension");

            expect(err).toBeNull();
            expect(result.installedTo).toEqual(extensionDirectory);
            expect(result.installationStatus).toEqual("INSTALLED");
            ExtensionsDomain._cmdInstall(basicValidExtension2, installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                expect(result.installationStatus).toEqual("NEEDS_UPDATE");
                expect(result.localPath).toEqual(basicValidExtension2);
                done();
            });
        });
    });

    it("should successfully update an extension", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            ExtensionsDomain._cmdInstall(basicValidExtension2, installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                expect(result.installationStatus).toBe("NEEDS_UPDATE");
                ExtensionsDomain._cmdUpdate(basicValidExtension2, installDirectory, standardOptions, function (err, result) {
                    expect(err).toBeNull();
                    expect(result.installationStatus).toBe("INSTALLED");
                    expect(result.installedTo.substr(0, installDirectory.length)).toEqual(installDirectory);
                    expect(fs.existsSync(result.installedTo)).toBe(true);
                    var packageInfo = fs.readJsonSync(path.join(result.installedTo, "package.json"));
                    expect(packageInfo.version).toBe("2.0.0");
                    done();
                });
            });
        });
    });

    it("should signal an update if a package.json appears", function (done) {
        ExtensionsDomain._cmdInstall(missingPackageJSON, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            expect(result.installationStatus).toEqual("INSTALLED");
            ExtensionsDomain._cmdInstall(missingPackageJSONUpdate, installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                expect(result.installationStatus).toEqual("NEEDS_UPDATE");
                done();
            });
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

    it("should not install by default if the same version is already installed", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                expect(result.installationStatus).toEqual("SAME_VERSION");
                done();
            });
        });
    });

    it("should not install by default if an older version is already installed", function (done) {
        ExtensionsDomain._cmdInstall(basicValidExtension, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            ExtensionsDomain._cmdInstall(basicValidExtension09, installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                expect(result.installationStatus).toEqual("OLDER_VERSION");
                done();
            });
        });
    });

    it("should not install by default if the same legacy extension is already installed", function (done) {
        ExtensionsDomain._cmdInstall(missingPackageJSON, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            ExtensionsDomain._cmdInstall(missingPackageJSON, installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                expect(result.installationStatus).toEqual("ALREADY_INSTALLED");
                done();
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

    it("should derive the name from the zip if there's no package.json", function (done) {
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
            expect(result.installationStatus).toEqual("DISABLED");
            expect(result.disabledReason).toEqual("API_NOT_COMPATIBLE");
            var extensionDirectory = path.join(disabledDirectory, "incompatible-version");
            var pathsToCheck = [
                path.join(extensionDirectory, "main.js"),
                path.join(extensionDirectory, "package.json")
            ];
            checkPaths(pathsToCheck, done);
        });
    });

    it("should not have trouble with invalid zip files", function (done) {
        ExtensionsDomain._cmdInstall(invalidZip, installDirectory, standardOptions, function (err, result) {
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

    it("should handle a package renamed with package.json", function (done) {
        ExtensionsDomain._cmdInstall(missingPackageJSON, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            expect(fs.existsSync(result.installedTo)).toBe(true);
            var legacyDirectory = result.installedTo;
            ExtensionsDomain._cmdInstall(missingPackageJSONRenamed, installDirectory, standardOptions, function (err, result) {
                expect(err).toBeNull();
                expect(result.installationStatus).toBe("NEEDS_UPDATE");
                expect(result.name).toBe("missing-package-json");
                ExtensionsDomain._cmdUpdate(missingPackageJSONRenamed, installDirectory, standardOptions, function (err, result) {
                    expect(err).toBeNull();
                    expect(result.installationStatus).toBe("INSTALLED");
                    expect(result.name).toBe("renamed-in-package-json");
                    expect(fs.existsSync(legacyDirectory)).toBe(false);
                    done();
                });
            });
        });
    });

    it("should strip out symlinks in the zipfile", function (done) {
        ExtensionsDomain._cmdInstall(withSymlink, installDirectory, standardOptions, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            expect(fs.existsSync(result.installedTo)).toBe(true);
            expect(fs.existsSync(path.join(result.installedTo, "bin", "foo"))).toBe(false);
            done();
        });
    });
});
