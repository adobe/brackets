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
/*global $, define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, waitsForDone, waitsForFail */

define(function (require, exports, module) {
    'use strict';

    var ExtensionUtils,
        FileUtils           = require("file/FileUtils"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils"),
        LESS_RESULT         = require("text!spec/ExtensionUtils-test-files/less.text");


    describe("Extension Utils", function () {
        this.category = "integration";

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

            function loadStyleSheet(doc, path) {
                var deferred = new $.Deferred();

                // attach style sheet
                runs(function () {
                    var promise = ExtensionUtils.loadStyleSheet(module, path);
                    promise.then(deferred.resolve, deferred.reject);
                    waitsForDone(promise, "loadStyleSheet: " + path);
                });
                
                return deferred.promise();
            }

            it("should load CSS style sheets with imports", function () {
                runs(function () {
                    loadStyleSheet(testWindow.document, "ExtensionUtils-test-files/basic.css");
                });

                runs(function () {
                    // basic.css
                    var $projectTitle = testWindow.$("#project-title");
                    var fontSize = $projectTitle.css("font-size");
                    expect(fontSize).toEqual("25px");

                    // second.css is imported in basic.css
                    var fontWeight = $projectTitle.css("font-weight");
                    expect(fontWeight).toEqual("500");
                    
                    // third.css is imported in second.css
                    var fontVariant = $projectTitle.css("font-variant");
                    expect(fontVariant).toEqual("small-caps");
                    
                    // fourth.css is imported in basic.css
                    var fontFamily = $projectTitle.css("font-family");
                    expect(fontFamily).toEqual("serif");
                });
            });
            
            it("should detect errors loading the initial path", function () {
                runs(function () {
                    var path    = "ExtensionUtils-test-files/does-not-exist.css",
                        promise = ExtensionUtils.loadStyleSheet(module, path);
                    
                    waitsForFail(promise, "loadStyleSheet: " + path);
                });
            });
            
            it("should detect errors loading imports", function () {
                runs(function () {
                    var path    = "ExtensionUtils-test-files/bad-import.css",
                        promise = ExtensionUtils.loadStyleSheet(module, path);
                    
                    waitsForFail(promise, "loadStyleSheet: " + path);
                });
            });
            
            // putting everything LESS related in 1 test so it runs faster
            it("should attach LESS style sheets", function () {
                var promise, result;
                
                runs(function () {
                    promise = loadStyleSheet(testWindow.document, "ExtensionUtils-test-files/basic.less");
                    promise.done(function (style) {
                        result = style;
                    });
                    
                    waitsForDone(promise);
                });
                
                runs(function () {
                    // convert all line endings to platform default
                    var windowText = FileUtils.translateLineEndings(testWindow.$(result).text()),
                        lessText   = FileUtils.translateLineEndings(LESS_RESULT);
                    
                    // confirm style sheet contents
                    expect(windowText).toBe(lessText);
                    
                    // confirm style is attached to document
                    expect(testWindow.$.contains(testWindow.document, result)).toBeTruthy();
                });
            });
        });
    });
});
