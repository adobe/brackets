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
//                w.brackets.app.showDeveloperTools();    /*** TODO: remove ***/
                testWindow = w;

                // Load module instances from brackets.test
                ExtensionUtils      = testWindow.brackets.test.ExtensionUtils;
            });
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        describe("loadStyleSheet", function () {
            it("should attach a style sheet", function () {
                runs(function () {
                    // attach style sheet
                    var promise = ExtensionUtils.loadStyleSheet(module, "ExtensionUtils-test-files/basic.css");
                    waitsForDone(promise, "loadStyleSheet");
                });
                    
                runs(function () {
                    // placing this code in a separate closure forces styles to update
                    var $projectTitle = testWindow.$("#project-title");
                    var fontSize = $projectTitle.css("font-size");
                    expect(fontSize).toEqual("25px");
                });
            });


            // should attach multiple style sheets

            // should allow references to other resources

            // should accept name with a space, high-ascii, & multi-byte chars

            // should attach style sheet in a subdir

            // should import style sheet in a subdir

            // should not loop infinitely with recursive style sheet reference

        });
    });
});
