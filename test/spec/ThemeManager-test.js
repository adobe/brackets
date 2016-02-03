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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    var ThemeManager     = require("view/ThemeManager"),
        FileSystem       = require("filesystem/FileSystem"),
        FileUtils        = require("file/FileUtils"),
        SpecRunnerUtils  = require("spec/SpecRunnerUtils");

    var testFilePath = SpecRunnerUtils.getTestPath("/spec/Theme-test-files");

    function superTrim(text) {
        return text.replace(/\s/g, '');
    }


    describe("ThemeManager", function () {

        describe("toDisplayName", function () {
            it("should format a name with no extension", function () {
                expect(ThemeManager._toDisplayName("this file")).toEqual("This File");
            });

            it("should format a short filename", function () {
                expect(ThemeManager._toDisplayName("this file.css")).toEqual("This File");
            });

            it("should format a longer filename", function () {
                expect(ThemeManager._toDisplayName("this is a simple file.css")).toEqual("This Is A Simple File");
            });

            it("should handle a name with dashes", function () {
                expect(ThemeManager._toDisplayName("this-is a simple-file.css")).toEqual("This Is A Simple File");
            });
        });


        describe("Extract Scrollbar", function () {
            it("should extract scrollbars from a theme with other css", function () {
                var themeFile = FileSystem.getFileForPath(testFilePath + "/scrollbars.css");
                var promise = FileUtils.readAsText(themeFile).done(function (content) {
                    var themeScrollbars = ThemeManager._extractScrollbars(content);
                    expect(themeScrollbars.scrollbar.length).toEqual(4);
                    expect(superTrim(themeScrollbars.content)).toEqual("span{}");
                });

                waitsForDone(promise, "theme with scrollbar and other css", 5000);
            });

            it("should extract scrollbars from a theme with only scrollbars", function () {
                var themeFile = FileSystem.getFileForPath(testFilePath + "/simple-scrollbars.css");
                var promise = FileUtils.readAsText(themeFile).done(function (content) {
                    var themeScrollbars = ThemeManager._extractScrollbars(content);
                    expect(themeScrollbars.scrollbar.length).toEqual(3);
                    expect(superTrim(themeScrollbars.scrollbar.join(""))).toEqual("::-webkit-scrollbar{width:12px;}::-webkit-scrollbar-thumb:window-inactive{background:white;}::-webkit-scrollbar-thumb{background:white;}");
                    expect(superTrim(themeScrollbars.content)).toEqual("");
                });

                waitsForDone(promise, "theme with only scrollbars", 5000);
            });

            it("should be fine with an empty theme", function () {
                var themeFile = FileSystem.getFileForPath(testFilePath + "/empty.css");
                var promise = FileUtils.readAsText(themeFile).done(function (content) {
                    var themeScrollbars = ThemeManager._extractScrollbars(content);
                    expect(themeScrollbars.scrollbar.length).toEqual(0);
                    expect(superTrim(themeScrollbars.content)).toEqual("");
                });

                waitsForDone(promise, "empty theme", 5000);
            });
        });


        describe("Load themes", function () {
            it("should load a theme from a single CSS file", function () {
                var promise = ThemeManager.loadFile(testFilePath + "/scrollbars.css").done(function (theme) {
                    expect(theme.name).toEqual("scrollbars");
                    expect(theme.displayName).toEqual("Scrollbars");
                });

                waitsForDone(promise, "theme file", 5000);
            });
        });
    });

});
