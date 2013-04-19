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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone, waitsForFail */

define(function (require, exports, module) {
    "use strict";
    
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils");

    var main                = require("main"),
        InlineDocsViewer    = require("InlineDocsViewer"),
        testCSS             = require("text!unittest-files/test1.css"),
        testHTML            = require("text!unittest-files/test1.html"),
        description         = require("text!unittest-files/description.txt");

    describe("WebPlatformDocs", function () {
            
        var testCSSInfo     = SpecRunnerUtils.parseOffsetsFromText(testCSS),
            testHTMLInfo    = SpecRunnerUtils.parseOffsetsFromText(testHTML),
            editor,
            doc,
            pos;
    
        function openInlineAtPos(info, offset, expectInline) {
            var widget = null,
                promise,
                deferred = new $.Deferred();
            
            runs(function () {
                // set cursor position in editor
                pos = info.offsets[offset];
                editor.setSelection(pos);
                
                // fetch inline editor
                promise = main._inlineProvider(editor, pos);
                
                if (promise) {
                    promise.done(function (result) {
                        widget = result;
                    });
                
                    if (expectInline) {
                        // expecting a valid CSS property
                        waitsForDone(promise, "WebPlatformDocs _inlineProvider", 1000);
                    } else {
                        // expecting an invalid css property
                        waitsForFail(promise, "WebPlatformDocs _inlineProvider", 1000);
                    }
                }
            });
            
            runs(function () {
                if (promise) {
                    if (expectInline) {
                        expect(widget).not.toBeNull();
                        expect(widget.$htmlContent.find(".css-prop-summary h1").text()).toBe("border");
                        
                        deferred.resolve(widget);
                    } else {
                        expect(widget).toBeNull();
                        
                        deferred.resolve();
                    }
                } else {
                    expect(expectInline).toBe(false);
                    expect(editor.getInlineWidgets().length).toBe(0);
                    
                    deferred.resolve();
                }
                
                deferred.reject();
            });
            
            return deferred.promise();
        }

        describe("InlineDocsProvider database", function () {
            
            it("should retrieve the CSS docs database", function () {
                var json;
                
                runs(function () {
                    main._getCSSDocs().done(function (result) {
                        json = result;
                    });
                });
                
                waitsFor(function () { return json !== undefined; }, "read css.json database", 5000);
                
                runs(function () {
                    expect(Object.keys(json.PROPERTIES).length).toBeGreaterThan(0);
                });
            });
            
        });
        
        describe("InlineDocsProvider parsing in CSS", function () {
            
            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testCSSInfo.text, "css");
                editor = mock.editor;
                doc = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor);
            });
            
            it("should open docs when the selection is on a CSS property name", function () {
                /* css property */
                openInlineAtPos(testCSSInfo, 1, true);
                
                /* css value */
                openInlineAtPos(testCSSInfo, 2, true);
            });
            
            it("should not open docs when the selection is not on a CSS property name", function () {
                /* css selector */
                openInlineAtPos(testCSSInfo, 0, false);
                
                /* css comment */
                openInlineAtPos(testCSSInfo, 5, false);
            });
            
            it("should not open docs for an invalid CSS property name", function () {
                /* css invalid property */
                openInlineAtPos(testCSSInfo, 3, false);
            });
            
        });
            
        describe("InlineDocsProvider parsing in HTML", function () {
            
            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testHTMLInfo.text, "html");
                editor = mock.editor;
                doc = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor);
            });
            
            it("should open docs for CSS in a <style> block", function () {
                openInlineAtPos(testHTMLInfo, 0, false);
            });
            
            it("should not open docs for inline style attributes", function () {
                openInlineAtPos(testHTMLInfo, 1, false);
            });
            
        });

        describe("InlineDocsViewer", function () {
            
            function createCssPropDetails(summary, url, valuesArr) {
                var values = [],
                    details = {
                        SUMMARY: summary,
                        URL: url,
                        VALUES: values
                    };
                
                valuesArr.forEach(function (value) {
                    values.push({
                        TITLE: value[0] || undefined,
                        DESCRIPTION: value[1] || undefined
                    });
                });
                
                return details;
            }

            it("should process all anchor tags", function () {
                var prop    = "my-css-prop",
                    details = createCssPropDetails(
                        prop,
                        "http://dev.brackets.io/wiki/css/properties/my-css-prop",
                        [["normal", description]]
                    ),
                    viewer = new InlineDocsViewer(prop, details),
                    $a,
                    title,
                    href;
                
                viewer.$htmlContent.find("a").each(function (i, anchor) {
                    $a = $(anchor);
                    href = $a.attr("href");
                    
                    if ($a.data("expected")) {
                        // transform all URLs, see unittest-files/description.txt
                        expect(href).toBe($a.data("expected"));
                    }
                    
                    // all links should have a title
                    expect($a.attr("title")).toBe(href);
                });
            });
            
        });

    });
});