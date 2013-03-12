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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true,
indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waits,
waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
    
    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        Package         = require("extensibility/Package");
    
    var testFilePath = SpecRunnerUtils.getTestPath("/spec/extension-test-files");
    
    var basicValid = testFilePath + "/basic-valid-extension.zip";
    var missingPackageJSON = testFilePath + "/missing-package-json.zip";
    var missingNameVersion = testFilePath + "/missing-name-version.zip";
    
    var packageData;
    
    function validatePackage(packagePath) {
        var promise;
        
        packageData = undefined;
        
        runs(function () {
            promise = Package.validate(packagePath);
            promise.then(function (pd) {
                // perform checks outside of this function to avoid
                // getting caught by NodeConnection's error catcher
                packageData = pd;
            });
            
            waitsForDone(promise, "package validation", 1000);
        });
    }
    
    describe("Extension Validator", function () {
        it("should return information about a valid file", function () {
            validatePackage(basicValid);
            
            runs(function () {
                expect(packageData.errors.length).toEqual(0);
                expect(packageData.metadata.name).toEqual("basic-valid-extension");
                expect(packageData.metadata.title).toEqual("Basic Valid Extension");
                expect(packageData.metadata.version).toEqual("1.0.0");
            });
        });
        
        it("should format errors for failures", function () {
            validatePackage(missingPackageJSON);
            
            runs(function () {
                expect(packageData.errors.length).toEqual(1);
                expect(packageData.errors[0]).toEqual("No package.json found in " + missingPackageJSON);
            });
        });
        
        it("should detect missing metadata", function () {
            validatePackage(missingNameVersion);
            
            runs(function () {
                expect(packageData.errors.length).toEqual(2);
                expect(packageData.errors[0]).toEqual("Missing package name in " + missingNameVersion);
                expect(packageData.errors[1]).toEqual("Missing package version in " + missingNameVersion);
            });
        });
            
    });
});