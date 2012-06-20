/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, waitsForDone, $ */

define(function (require, exports, module) {
    'use strict';

    var ExtensionUtils,
        SpecRunnerUtils     = require("./SpecRunnerUtils.js");


    describe("Extension Utils", function () {

        var testWindow;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                ExtensionUtils      = testWindow.brackets.test.ExtensionUtils;
            });
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        describe("loadStyleSheet", function () {

            // putting everything in 1 test so it runs faster
            it("should attach style sheets", function () {

                // attach style sheet
                runs(function () {
                    var promise = ExtensionUtils.loadStyleSheet(module, "ExtensionUtils-test-files/basic.css");
                    waitsForDone(promise, "loadStyleSheet: basic.css");
                });

                // placing this code in a separate closure forces styles to update
                runs(function () {
                    // basic.css
                    var $projectTitle = testWindow.$("#project-title");
                    var fontSize = $projectTitle.css("font-size");
                    expect(fontSize).toEqual("25px");

                    // second.css is imported in basic.css
                    var fontWeight = $projectTitle.css("font-weight");
                    expect(fontWeight).toEqual("500");
                });

                // attach another style sheet in a sub-directory with space and high-ascii chars in name.
                // note that git choked on double-byte chars, so those were removed.
                runs(function () {
                    var promise = ExtensionUtils.loadStyleSheet(module, "ExtensionUtils-test-files/sub dir/third.css");
                    waitsForDone(promise, "loadStyleSheet: third.css");
                });

                runs(function () {
                    // HighASCII_été.css
                    var $projectTitle = testWindow.$("#project-title");
                    var fontVariant = $projectTitle.css("font-variant");
                    expect(fontVariant).toEqual("small-caps");
                });
            });
        });
    });
});
