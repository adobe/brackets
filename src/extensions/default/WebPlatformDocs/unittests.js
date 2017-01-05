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

/*global describe, it, expect, beforeEach, afterEach, waitsFor, runs, waitsForDone, waitsForFail */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils");

    var main                = require("main"),
        InlineDocsViewer    = require("InlineDocsViewer"),
        testCSS             = require("text!unittest-files/test1.css"),
        testHTML            = require("text!unittest-files/test1.html");

    describe("WebPlatformDocs", function () {

        var testCSSInfo     = SpecRunnerUtils.parseOffsetsFromText(testCSS),
            testHTMLInfo    = SpecRunnerUtils.parseOffsetsFromText(testHTML),
            editor,
            doc,
            pos;

        function queryInlineAtPos(info, offset, expectInline, expectedProperty) {
            var widget = null,
                promise;

            runs(function () {
                // set cursor position in editor
                pos = info.offsets[offset];
                editor.setSelection(pos);

                // fetch inline editor
                promise = main._inlineProvider(editor, pos);

                if (expectInline) {
                    expect(promise).toBeTruthy();
                }

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
                        expect(widget).toBeTruthy();
                        expect(widget.$htmlContent.find(".css-prop-summary h1").text()).toBe(expectedProperty);
                    } else {
                        expect(widget).toBeNull();
                    }
                }
            });
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
                SpecRunnerUtils.destroyMockEditor(doc);
            });

            it("should open docs when the selection is on a CSS property", function () {
                /* css property */
                queryInlineAtPos(testCSSInfo, 1, true, "border");

                /* css value */
                queryInlineAtPos(testCSSInfo, 2, true, "border");
            });

            it("should not open docs when the selection is not on a CSS property", function () {
                /* css selector */
                queryInlineAtPos(testCSSInfo, 0, false);

                /* css comment */
                queryInlineAtPos(testCSSInfo, 5, false);
            });

            it("should not open docs for an invalid CSS property", function () {
                /* css invalid property */
                queryInlineAtPos(testCSSInfo, 3, false);
            });

            it("should open docs for a vendor-prefixed CSS property", function () {
                /* css -webkit- prefixed property */
                queryInlineAtPos(testCSSInfo, 6, true, "animation");
            });

            it("should not open docs for an invalid CSS property (looking like a vendor-prefixed one)", function () {
                /* css property invalidly prefixed */
                queryInlineAtPos(testCSSInfo, 7, false);
            });

        });

        describe("InlineDocsProvider parsing in HTML", function () {

            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testHTMLInfo.text, "html");
                editor = mock.editor;
                doc = mock.doc;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(doc);
            });

            it("should open docs for CSS in a <style> block", function () {
                queryInlineAtPos(testHTMLInfo, 0, true, "border");
            });

            it("should not open docs for inline style attributes", function () {
                queryInlineAtPos(testHTMLInfo, 1, false);
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
                        title: value[0] || undefined,
                        description: value[1] || undefined
                    });
                });

                return details;
            }

            it("should add titles to all links", function () {
                var prop    = "my-css-prop",
                    url     = "http://dev.brackets.io/wiki/css/properties/my-css-prop",
                    details = createCssPropDetails(
                        prop,
                        url,
                        [["normal", "See <a href='http://dev.brackets.io/wiki/css/properties/foo-css-prop'>foo-css-prop</a>"]]
                    ),
                    viewer = new InlineDocsViewer(prop, details),
                    $a,
                    $links = viewer.$htmlContent.find("a:not(.close)");

                // 1 link in the description, 1 "more info" link in template
                expect($links.length).toBe(2);

                $links.each(function (i, anchor) {
                    $a = $(anchor);

                    // all links should have a title
                    expect($a.attr("title")).toBe($a.attr("href"));
                });
            });

        });

    });
});
