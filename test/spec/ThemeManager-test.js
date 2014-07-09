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
/*global define, describe, beforeEach, it, runs, expect, waitsForDone, beforeFirst, afterLast */

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

        describe("toDisplayName", function() {
            it("Name with no extension", function() {
                expect(ThemeManager._toDisplayName("this file")).toEqual("This File");
            });

            it("Short name", function() {
                expect(ThemeManager._toDisplayName("this file.css")).toEqual("This File");
            });

            it("Long name", function() {
                expect(ThemeManager._toDisplayName("this is a simple file.css")).toEqual("This Is A Simple File");
            });

            it("Name with dashes", function() {
                expect(ThemeManager._toDisplayName("this-is a simple-file.css")).toEqual("This Is A Simple File");
            });
        });


        describe("Extract Scrollbar", function() {
            runs(function() {
                var themeFile = FileSystem.getFileForPath(testFilePath + "/scrollbars.css");
                var promise = FileUtils.readAsText(themeFile).done(function(content) {
                    var themeScrollbars = ThemeManager._extractScrollbars(content);
                    expect(themeScrollbars.scrollbar.length).toEqual(4);
                    expect(superTrim(themeScrollbars.content)).toEqual("span{}");
                });

                waitsForDone(promise, "theme with scrollbar and other css", 5000);
            });

            runs(function() {
                var themeFile = FileSystem.getFileForPath(testFilePath + "/simple-scrollbars.css");
                var promise = FileUtils.readAsText(themeFile).done(function(content) {
                    var themeScrollbars = ThemeManager._extractScrollbars(content);
                    expect(themeScrollbars.scrollbar.length).toEqual(3);
                    expect(superTrim(themeScrollbars.scrollbar.join(""))).toEqual("::-webkit-scrollbar{width:12px;}::-webkit-scrollbar-thumb:window-inactive{background:white;}::-webkit-scrollbar-thumb{background:white;}");
                    expect(superTrim(themeScrollbars.content)).toEqual("");
                });

                waitsForDone(promise, "theme with only scrollbars", 5000);
            });

            runs(function() {
                var themeFile = FileSystem.getFileForPath(testFilePath + "/empty.css");
                var promise = FileUtils.readAsText(themeFile).done(function(content) {
                    var themeScrollbars = ThemeManager._extractScrollbars(content);
                    expect(themeScrollbars.scrollbar.length).toEqual(0);
                    expect(superTrim(themeScrollbars.content)).toEqual("");
                });

                waitsForDone(promise, "empty theme", 5000);
            });
        });


        describe("Load themes", function() {
            runs(function () {
                var promise = ThemeManager.loadFile(testFilePath + "/scrollbars.css").done(function(theme) {
                    expect(theme.name).toEqual("scrollbars");
                    expect(theme.displayName).toEqual("Scrollbars");
                    expect(theme.className).toEqual("theme-scrollbars");
                });

                waitsForDone(promise, "theme file", 5000);
            });

            runs(function () {
                var promise = ThemeManager.loadDirectory(testFilePath).done(function() {
                    var themes = Array.prototype.slice.call(arguments);
                    expect(themes.length).toEqual(4);
                });

                waitsForDone(promise, "theme directory - skips invalid extensions", 5000);
            });
        });


        describe("Theme selection", function() {
            it("Get current theme", function() {
                expect(ThemeManager.getCurrentThemes().length).toEqual(1);
                expect(ThemeManager.getCurrentThemes()[0]).toBeUndefined();
            });
        });

    });

});
