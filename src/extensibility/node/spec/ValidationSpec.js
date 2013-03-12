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

var ExtensionsDomain = require("../ExtensionsDomain"),
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
    missingNameVersion  = path.join(testFilesDirectory, "missing-name-version.zip");

describe("Package Validation", function () {
    it("should handle a good package", function (done) {
        ExtensionsDomain._cmdValidate(basicValidExtension, function (err, result) {
            expect(err).toBeNull();
            expect(result.errors.length).toEqual(0);
            var metadata = result.metadata;
            expect(metadata.name).toEqual("basic-valid-extension");
            expect(metadata.version).toEqual("1.0");
            expect(metadata.title).toEqual("Basic Valid Extension");
            done();
        });
    });
    
    it("should complain about missing package.json", function (done) {
        ExtensionsDomain._cmdValidate(missingPackageJSON, function (err, result) {
            expect(err).toBeNull();
            var errors = result.errors;
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual("MISSING_PACKAGE_JSON");
            expect(errors[0][1]).toEqual(missingPackageJSON);
            expect(result.metadata).toBeUndefined();
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
});