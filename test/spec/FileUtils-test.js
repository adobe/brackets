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
/*global define, describe, it, expect, beforeEach, afterEach, brackets, spyOn */
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

        describe("convertToNativePath", function () {
            it("should convert windows URL syntax to Windows native path.", function () {
                expect(FileUtils.convertToNativePath("/C:/foo/bar/baz.txt")).toBe("C:/foo/bar/baz.txt");
            });

            it("should not modify a windows non-URL path syntax.", function () {
                expect(FileUtils.convertToNativePath("C:/foo/bar/baz.txt")).toBe("C:/foo/bar/baz.txt");
            });

            it("should not modify a posix path.", function () {
                expect(FileUtils.convertToNativePath("/foo/bar/baz.txt")).toBe("/foo/bar/baz.txt");
                expect(FileUtils.convertToNativePath("foo/bar/baz.txt")).toBe("foo/bar/baz.txt");
                expect(FileUtils.convertToNativePath("/foo/bar/")).toBe("/foo/bar/");
                expect(FileUtils.convertToNativePath("foo/bar/")).toBe("foo/bar/");
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

        describe("getBaseName", function () {

            it("should get the file name of a normalized win file path", function () {
                expect(FileUtils.getBaseName("C:/foo/bar/baz.txt")).toBe("baz.txt");
            });

            it("should get the file name of a posix file path", function () {
                expect(FileUtils.getBaseName("/foo/bar/baz.txt")).toBe("baz.txt");
            });

            it("should return the directory name of a normalized win directory path", function () {
                expect(FileUtils.getBaseName("C:/foo/bar/")).toBe("bar");
            });

            it("should return the directory name of a posix directory path", function () {
                expect(FileUtils.getBaseName("C:/foo/bar/")).toBe("bar");
            });

            it("should return the file name of a path containing #", function () {
                expect(FileUtils.getBaseName("C:/foo/bar/#baz/jaz.txt")).toBe("jaz.txt");
                expect(FileUtils.getBaseName("C:/foo/bar/baz/#jaz.txt")).toBe("#jaz.txt");
            });

            it("should return the directory name of a path containing #", function () {
                expect(FileUtils.getBaseName("C:/foo/bar/#baz/jaz/")).toBe("jaz");
                expect(FileUtils.getBaseName("C:/foo/bar/baz/#jaz/")).toBe("#jaz");
            });
        });

        describe("getFileExtension", function () {

            it("should get the extension of a normalized win file path", function () {
                expect(FileUtils.getFileExtension("C:/foo/bar/baz.txt")).toBe("txt");
            });

            it("should get the extension of a posix file path", function () {
                expect(FileUtils.getFileExtension("/foo/bar/baz.txt")).toBe("txt");
            });

            it("should return empty extension for a normalized win directory path", function () {
                expect(FileUtils.getFileExtension("C:/foo/bar/")).toBe("");
            });

            it("should return empty extension for a posix directory path", function () {
                expect(FileUtils.getFileExtension("bar")).toBe("");
            });

            it("should return the extension of a filename containing .", function () {
                expect(FileUtils.getFileExtension("C:/foo/bar/.baz/jaz.txt")).toBe("txt");
                expect(FileUtils.getFileExtension("foo/bar/baz/.jaz.txt")).toBe("txt");
                expect(FileUtils.getFileExtension("foo.bar.baz..jaz.txt")).toBe("txt");
            });
        });

        describe("getSmartFileExtension", function () {

            it("should get the extension of a normalized win file path", function () {
                expect(FileUtils.getSmartFileExtension("C:/foo/bar/baz.txt")).toBe("txt");
            });

            it("should get the extension of a posix file path", function () {
                expect(FileUtils.getSmartFileExtension("/foo/bar/baz.txt")).toBe("txt");
            });

            it("should return empty extension for a normalized win directory path", function () {
                expect(FileUtils.getSmartFileExtension("C:/foo/bar/")).toBe("");
            });

            it("should return empty extension for a posix directory path", function () {
                expect(FileUtils.getSmartFileExtension("bar")).toBe("");
            });

            it("should return the extension of a filename containing .", function () {
                expect(FileUtils.getSmartFileExtension("C:/foo/bar/.baz/jaz.txt")).toBe("txt");
                expect(FileUtils.getSmartFileExtension("foo/bar/baz/.jaz.txt")).toBe("txt");
                expect(FileUtils.getSmartFileExtension("foo.bar.baz..jaz.txt")).toBe("txt");
            });

            it("should return no extension for files with only . as a first character", function () {
                expect(FileUtils.getSmartFileExtension("C:/foo/bar/.baz/.jaz")).toBe("");
            });

            it("should return the extension containing . for known types", function () {
                expect(FileUtils.getSmartFileExtension("C:/foo/bar/.baz/jaz.scss.erb")).toBe("scss.erb");
                expect(FileUtils.getSmartFileExtension("foo/bar/baz/.jaz.js.erb")).toBe("js.erb");
            });

            it("should return the extension combined from other known extensions", function () {
                expect(FileUtils.getSmartFileExtension("foo.bar.php.js")).toBe("php.js");
                expect(FileUtils.getSmartFileExtension("foo.bar.php.html.js")).toBe("php.html.js");
                expect(FileUtils.getSmartFileExtension("foo.bar.php.scss.erb")).toBe("php.scss.erb");
            });
        });

        describe("compareFilenames", function () {

            it("should compare filenames using German rules", function () {
                spyOn(brackets, "getLocale").andReturn("de-DE");
                // Should be like this: Äckerman, Adler, Rossi, Xavier
                expect(FileUtils.compareFilenames("Äckerman", "Adler", false)).toBeLessThan(0);
                expect(FileUtils.compareFilenames("Adler", "Rossi", false)).toBeLessThan(0);
                expect(FileUtils.compareFilenames("Rossi", "Xavier", false)).toBeLessThan(0);
            });

            it("should compare filenames using Swedish rules", function () {
                spyOn(brackets, "getLocale").andReturn("sv");
                // Should be like this: Adler, Rossie, Xavier, Äckerman
                expect(FileUtils.compareFilenames("Adler", "Rossie", false)).toBeLessThan(0);
                expect(FileUtils.compareFilenames("Rossie", "Xavier", false)).toBeLessThan(0);
                expect(FileUtils.compareFilenames("Xavier", "Äckerman", false)).toBeLessThan(0);
            });
        });
    });
});
