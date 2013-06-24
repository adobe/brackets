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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, window, $, jasmine, brackets */
/*unittests: FileUtils*/

define(function (require, exports, module) {
    "use strict";
    
    var FileUtils = require("file/FileUtils");
    
    describe("FileUtils", function () {
        describe("convertWindowsPathToUnixPath", function () {
            var origPlatform;
            
            beforeEach(function () {
                origPlatform = brackets.platform;
            });
            
            afterEach(function () {
                brackets.platform = origPlatform;
            });
            
            it("should convert a Windows path to a Unix-style path when on Windows", function () {
                brackets.platform = "win";
                expect(FileUtils.convertWindowsPathToUnixPath("C:\\foo\\bar\\baz.txt")).toBe("C:/foo/bar/baz.txt");
            });
            
            it("should not modify a native path when on Mac, even if it has backslashes", function () {
                brackets.platform = "mac";
                expect(FileUtils.convertWindowsPathToUnixPath("/some/back\\slash/path.txt")).toBe("/some/back\\slash/path.txt");
            });
        });

        describe("getDirectoryPath", function () {
            
            it("should get the parent directory of a normalized win file path", function () {
                expect(FileUtils.getDirectoryPath("C:/foo/bar/baz.txt")).toBe("C:/foo/bar/");
            });
            
            it("should get the parent directory of a posix file path", function () {
                expect(FileUtils.getDirectoryPath("/foo/bar/baz.txt")).toBe("/foo/bar/");
            });
            
            it("should return the unchanged directory of a normalized win directory path", function () {
                expect(FileUtils.getDirectoryPath("C:/foo/bar/")).toBe("C:/foo/bar/");
            });
            
            it("should return the unchanged directory of a posix directory path", function () {
                expect(FileUtils.getDirectoryPath("C:/foo/bar/")).toBe("C:/foo/bar/");
            });
        });
    });
});