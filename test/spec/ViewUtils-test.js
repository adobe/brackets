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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, $, beforeEach, afterEach, it, expect */
/*unittests: ViewUtils*/

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var ViewUtils = require("utils/ViewUtils");

    describe("ViewUtils", function () {

        /*
         * Note: This suite uses ViewUtils to apply the .scroller-shadow class to the fixture.
         * However, the brackets.less file is not part of the SpecRunner. Therefore, no background-image
         * is displayed or animated. These tests simply validate that the correct
         * background-position value is written to the scrolling DOMElement.
         */
        describe("Scroller Shadows", function () {

            var $fixture,
                fixture;

            beforeEach(function () {
                /* 100% x 100px scroller with 100px x 1000px content */
                $fixture = $("<div style='overflow:auto;height:100px'><div id='content' style='width:100px;height:1000px'></div></div>");
                fixture = $fixture[0];
                $(document.body).append($fixture);
            });

            afterEach(function () {
                $fixture.remove();
            });

            function scrollTop(val) {
                fixture.scrollTop = val;

                // scrollTop does not trigger scroll event, fire manually.
                $fixture.trigger("scroll");
            }

            function backgroundY(position) {
                return parseInt($fixture.find(".scroller-shadow." + position).css("background-position").split(" ")[1], 10);
            }

            it("should not show the top shadow when no scrolling is available", function () {
                $fixture.find("#content").height(50); // make height shorter than the viewport
                ViewUtils.addScrollerShadow(fixture, null, true);

                expect(fixture.scrollTop).toEqual(0);
                expect(backgroundY("top")).toEqual(-ViewUtils.SCROLL_SHADOW_HEIGHT);
                expect(backgroundY("bottom")).toEqual(ViewUtils.SCROLL_SHADOW_HEIGHT);
            });

            it("should partially reveal the shadow", function () {
                ViewUtils.addScrollerShadow(fixture, null, true);
                scrollTop(3);
                expect(backgroundY("top")).toEqual(3 - ViewUtils.SCROLL_SHADOW_HEIGHT);
                expect(backgroundY("bottom")).toEqual(0);

                scrollTop(899);
                expect(backgroundY("top")).toEqual(0);
                expect(backgroundY("bottom")).toEqual(4);
            });

            it("should update shadow position when installed", function () {
                scrollTop(100);
                ViewUtils.addScrollerShadow(fixture, null, true);

                expect(backgroundY("top")).toEqual(0);
            });

            it("should fully reveal the shadow at the bottommost scroll position", function () {
                ViewUtils.addScrollerShadow(fixture, null, true);
                scrollTop(900);

                expect(backgroundY("top")).toEqual(0);
                expect(backgroundY("bottom")).toEqual(ViewUtils.SCROLL_SHADOW_HEIGHT);
            });

        });

        describe("getFileEntryDisplay", function () {
            function makeFile(name) {
                return {
                    name: name
                };
            }

            it("should do nothing if there's no extension", function () {
                expect(ViewUtils.getFileEntryDisplay(makeFile("README"))).toBe("README");
            });

            it("should add markup for the file extension", function () {
                expect(ViewUtils.getFileEntryDisplay(makeFile("README.md"))).toBe("README<span class='extension'>.md</span>");
            });

            // see https://github.com/adobe/brackets/issues/7905
            it("should not mark up dot files as being an extension", function () {
                expect(ViewUtils.getFileEntryDisplay(makeFile(".gitignore"))).toBe(".gitignore");
            });
        });
    });
});
