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
/*global expect, describe, it */

"use strict";

var ExtensionsDomain = require("../ExtensionManagerDomain"),
    path             = require("path");

var testFilesDirectory = path.join(path.dirname(module.filename),
                                    "..",   // node
                                    "..",   // extensibility
                                    "..",   // src
                                    "..",   // brackets
                                    "test",
                                    "spec",
                                    "extension-test-files");

var basicValidExtension = path.join(testFilesDirectory, "basic-valid-extension.zip"),
    missingPackageJSON  = path.join(testFilesDirectory, "missing-package-json.zip"),
    invalidJSON         = path.join(testFilesDirectory, "invalid-json.zip"),
    invalidZip          = path.join(testFilesDirectory, "invalid-zip-file.zip"),
    missingNameVersion  = path.join(testFilesDirectory, "missing-name-version.zip"),
    missingMain         = path.join(testFilesDirectory, "missing-main.zip"),
    oneLevelDown        = path.join(testFilesDirectory, "one-level-extension-master.zip"),
    bogusTopDir         = path.join(testFilesDirectory, "bogus-top-dir.zip"),
    badname             = path.join(testFilesDirectory, "badname.zip"),
    invalidVersion      = path.join(testFilesDirectory, "invalid-version.zip");

describe("Package Validation", function () {
    it("should handle a good package", function (done) {
        ExtensionsDomain._cmdValidate(basicValidExtension, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            var metadata = result.metadata;
            expect(metadata.name).toEqual("basic-valid-extension");
            expect(metadata.version).toEqual("1.0.0");
            expect(metadata.title).toEqual("Basic Valid Extension");
            done();
        });
    });
    
    it("should NOT complain about missing package.json", function (done) {
        ExtensionsDomain._cmdValidate(missingPackageJSON, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(0);
            expect(result.metadata).toBeNull();
            done();
        });
    });
    
    it("should complain about illegal path", function (done) {
        ExtensionsDomain._cmdValidate(path.join(testFilesDirectory, "NO_FILE_HERE"), function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("NOT_FOUND_ERR");
            expect(result.metadata).toBeUndefined();
            done();
        });
    });
    
    it("should complain about invalid JSON", function (done) {
        ExtensionsDomain._cmdValidate(invalidJSON, function (err, result) {
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
        ExtensionsDomain._cmdValidate(invalidZip, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("INVALID_ZIP_FILE");
            done();
        });
    });
    
    it("should require name and version in the metadata", function (done) {
        ExtensionsDomain._cmdValidate(missingNameVersion, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(2);
            expect(errors[0][0]).toEqual("MISSING_PACKAGE_NAME");
            expect(errors[1][0]).toEqual("MISSING_PACKAGE_VERSION");
            done();
        });
    });
    
    it("should validate the version number", function (done) {
        ExtensionsDomain._cmdValidate(invalidVersion, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("INVALID_VERSION_NUMBER");
            expect(errors[0][1]).toEqual("NOT A VERSION");
            done();
        });
    });
    
    it("should require a main.js in the zip file", function (done) {
        ExtensionsDomain._cmdValidate(missingMain, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("MISSING_MAIN");
            done();
        });
    });
    
    it("should determine the common prefix if there is one", function (done) {
        ExtensionsDomain._cmdValidate(oneLevelDown, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            expect(result.metadata.name).toEqual("one-level-extension");
            expect(result.commonPrefix).toEqual("one-level-extension-master");
            done();
        });
    });
    
    it("should not be fooled by bogus top directories", function (done) {
        ExtensionsDomain._cmdValidate(bogusTopDir, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            expect(result.metadata.name).toEqual("bogus-top-dir");
            expect(result.commonPrefix).toEqual("");
            done();
        });
    });
    
    it("should not allow names that contain disallowed characters", function (done) {
        ExtensionsDomain._cmdValidate(badname, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(1);
            expect(result.errors[0][0]).toEqual("BAD_PACKAGE_NAME");
            done();
        });
    });
});