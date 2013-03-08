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

var basicValidExtension = path.join(testFilesDirectory, "basic-valid-extension.zip");
var missingPackageJSON = path.join(testFilesDirectory, "missing-package-json.zip");

describe("Package Validation", function () {
    it("should handle a good package", function (done) {
        ExtensionsDomain._cmdValidate(basicValidExtension, function (err, result) {
            expect(result[0]).toEqual(null);
            var metadata = result[1];
            expect(metadata.name).toEqual("basic-valid-extension");
            expect(metadata.version).toEqual("1.0");
            expect(metadata.title).toEqual("Basic Valid Extension");
            done();
        });
    });
    
    it("should complain about missing package.json", function (done) {
        ExtensionsDomain._cmdValidate(missingPackageJSON, function (err, result) {
            expect(result[0]).toEqual("Missing package.json");
            done();
        });
    });
});