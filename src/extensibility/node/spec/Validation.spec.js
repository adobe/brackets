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
/*global expect, describe, it, afterEach */

"use strict";

var rewire           = require("rewire"),
    packageValidator = rewire("../package-validator"),
    path             = require("path"),
    temp             = require("temp");

var testFilesDirectory = path.join(path.dirname(module.filename),
                                    "..",   // node
                                    "..",   // extensibility
                                    "..",   // src
                                    "..",   // brackets
                                    "test",
                                    "spec",
                                    "extension-test-files");

var basicValidExtension    = path.join(testFilesDirectory, "basic-valid-extension.zip"),
    basicValidExtension2   = path.join(testFilesDirectory, "basic-valid-extension-2.0.zip"),
    basicValidTheme        = path.join(testFilesDirectory, "basic-valid-theme-1.0.zip"),
    missingPackageJSON     = path.join(testFilesDirectory, "missing-package-json.zip"),
    invalidJSON            = path.join(testFilesDirectory, "invalid-json.zip"),
    invalidZip             = path.join(testFilesDirectory, "invalid-zip-file.zip"),
    missingNameVersion     = path.join(testFilesDirectory, "missing-name-version.zip"),
    missingMain            = path.join(testFilesDirectory, "missing-main.zip"),
    oneLevelDown           = path.join(testFilesDirectory, "one-level-extension-master.zip"),
    bogusTopDir            = path.join(testFilesDirectory, "bogus-top-dir.zip"),
    badname                = path.join(testFilesDirectory, "badname.zip"),
    mainInDirectory        = path.join(testFilesDirectory, "main-in-directory.zip"),
    invalidVersion         = path.join(testFilesDirectory, "invalid-version.zip"),
    invalidBracketsVersion = path.join(testFilesDirectory, "invalid-brackets-version.zip"),
    ignoredFolder          = path.join(testFilesDirectory, "has-macosx.zip");

describe("Package Validation", function () {

    afterEach(function () {
        temp.cleanup();
    });

    it("should handle a good package", function (done) {
        packageValidator.validate(basicValidExtension, {}, function (err, result) {
            expect(err).toBeNull();
            expect(result.extractDir).toBeDefined();
            expect(result.errors.length).toEqual(0);
            var metadata = result.metadata;
            expect(metadata.name).toEqual("basic-valid-extension");
            expect(metadata.version).toEqual("1.0.0");
            expect(metadata.title).toEqual("Basic Valid Extension");
            expect(metadata.author.name).toEqual("Alfred Einstein");
            expect(metadata.author.email).toEqual("alfred_not_albert@thoseeinsteins.org");
            expect(metadata.author.url).toBeUndefined();
            done();
        });
    });

    it("should NOT complain about missing package.json", function (done) {
        packageValidator.validate(missingPackageJSON, {}, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(0);
            expect(result.metadata).toBeNull();
            done();
        });
    });

    it("should complain about missing package.json if you tell it to", function (done) {
        packageValidator.validate(missingPackageJSON, {
            requirePackageJSON: true
        }, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("MISSING_PACKAGE_JSON");
            done();
        });
    });

    it("should complain about illegal path", function (done) {
        packageValidator.validate(path.join(testFilesDirectory, "NO_FILE_HERE"), {}, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("NOT_FOUND_ERR");
            expect(result.metadata).toBeUndefined();
            done();
        });
    });

    it("should complain about invalid JSON", function (done) {
        packageValidator.validate(invalidJSON, {}, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("INVALID_PACKAGE_JSON");
            expect(errors[0][1]).toEqual("SyntaxError: Unexpected token I");
            expect(errors[0][2]).toEqual(invalidJSON);
            expect(result.metadata).toBeUndefined();
            done();
        });
    });

    it("should complain about an invalid zip file", function (done) {
        packageValidator.validate(invalidZip, {}, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("INVALID_ZIP_FILE");
            done();
        });
    });

    it("should require name and version in the metadata", function (done) {
        packageValidator.validate(missingNameVersion, {}, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(2);
            expect(errors[0][0]).toEqual("MISSING_PACKAGE_NAME");
            expect(errors[1][0]).toEqual("MISSING_PACKAGE_VERSION");
            done();
        });
    });

    it("should validate the version number", function (done) {
        packageValidator.validate(invalidVersion, {}, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("INVALID_VERSION_NUMBER");
            expect(errors[0][1]).toEqual("NOT A VERSION");
            done();
        });
    });

    it("should require a main.js in the zip file", function (done) {
        packageValidator.validate(missingMain, {}, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("MISSING_MAIN");
            done();
        });
    });

    it("should NOT require a main.js in the zip file for a theme", function (done) {
        packageValidator.validate(basicValidTheme, {}, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            expect(result.metadata.theme).toBeDefined();
            done();
        });
    });

    it("should determine the common prefix if there is one", function (done) {
        packageValidator.validate(oneLevelDown, {}, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            expect(result.metadata.name).toEqual("one-level-extension");
            expect(result.commonPrefix).toEqual("one-level-extension-master");
            expect(result.metadata.author.name).toEqual("A Person");
            done();
        });
    });

    it("should not be fooled by bogus top directories", function (done) {
        packageValidator.validate(bogusTopDir, {}, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            expect(result.metadata.name).toEqual("bogus-top-dir");
            expect(result.commonPrefix).toEqual("");
            done();
        });
    });

    it("should not allow names that contain disallowed characters", function (done) {
        packageValidator.validate(badname, {}, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(1);
            expect(result.errors[0][0]).toEqual("BAD_PACKAGE_NAME");
            done();
        });
    });

    it("should complain about files that don't have main in the top dir", function (done) {
        packageValidator.validate(mainInDirectory, {}, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("MISSING_MAIN");
            done();
        });
    });

    it("should handle a variety of person forms", function () {
        var parse = packageValidator._parsePersonString;
        expect(parse("A Person")).toEqual({
            name: "A Person"
        });
        expect(parse({
            name: "A Person"
        })).toEqual({
            name: "A Person"
        });
        expect(parse("A Person (http://foo.bar)")).toEqual({
            name: "A Person",
            url: "http://foo.bar"
        });
        expect(parse("A Person <foo@bar>")).toEqual({
            name: "A Person",
            email: "foo@bar"
        });
        expect(parse("A Person <foo@bar> (http://foo.bar)")).toEqual({
            name: "A Person",
            email: "foo@bar",
            url: "http://foo.bar"
        });
    });

    it("should handle contributors", function (done) {
        packageValidator.validate(basicValidExtension2, {}, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            var contrib = result.metadata.contributors;
            expect(contrib.length).toEqual(3);
            expect(contrib[0]).toEqual({
                name: "Johan Einstein"
            });
            expect(contrib[1]).toEqual({
                name: "Albert Einstein Jr.",
                email: "not_that_albert@thoseeinsteins.org"
            });
            expect(contrib[2]).toEqual({
                name: "Jens Einstein",
                email: "jens@thoseeinsteins.org"
            });
            done();
        });
    });

    it("should validate the Brackets version", function (done) {
        packageValidator.validate(invalidBracketsVersion, {}, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(1);
            expect(result.errors[0][0]).toEqual("INVALID_BRACKETS_VERSION");
            expect(result.errors[0][1]).toEqual("foo");
            done();
        });
    });

    it("should reject a package with rejected words in title or description", function (done) {
        packageValidator.validate(basicValidExtension, {
            disallowedWords: ["valid"]
        }, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(2);
            expect(result.errors[0][0]).toEqual("DISALLOWED_WORDS");
            expect(result.errors[0][1]).toEqual("title");
            expect(result.errors[0][2]).toEqual("valid");
            expect(result.errors[1][0]).toEqual("DISALLOWED_WORDS");
            expect(result.errors[1][1]).toEqual("name");
            expect(result.errors[1][2]).toEqual("valid");
            done();
        });
    });

    it("should only allow certain characters in the name", function () {
        var validateName = packageValidator.__get__("validateName");
        expect(validateName("Foo")).toEqual(false);
        expect(validateName("foo")).toEqual(true);
        expect(validateName("foo2")).toEqual(true);
        expect(validateName("foo.bar")).toEqual(true);
        expect(validateName("foo-bar")).toEqual(true);
        expect(validateName("foo_bar")).toEqual(true);
        expect(validateName("foo&bar")).toEqual(false);
        expect(validateName("foo/bar")).toEqual(false);
        expect(validateName("..")).toEqual(false);
        expect(validateName(".")).toEqual(false);
    });

    it("should ignore the __MACOSX folder when looking for a single subfolder", function (done) {
        packageValidator.validate(ignoredFolder, {}, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            done();
        });
    });
});
