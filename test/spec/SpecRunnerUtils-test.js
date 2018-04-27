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

/*global describe, it, expect, beforeEach, afterEach */

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = require("spec/SpecRunnerUtils");

    describe("SpecRunnerUtils", function () {
        describe("simulateKeyEvent", function () {
            var mockElement, capturedEvent;

            beforeEach(function () {
                mockElement = SpecRunnerUtils.createMockElement();
                mockElement.on("keydown", function(event) {
                    capturedEvent = event;
                });
            });

            afterEach(function () {
                mockElement.remove();
                capturedEvent = null;
            });

            it("should create and dispatch a key event to an element", function () {
                SpecRunnerUtils.simulateKeyEvent(82, "keydown", mockElement[0]);
                expect(capturedEvent.keyCode).toEqual(82);
                expect(capturedEvent.which).toEqual(82);
                expect(capturedEvent.charCode).toEqual(82);
            });            

            it("should create and dispatch a key event with modifiers to an element", function () {
                var modifiers = {
                    ctrlKey: true,
                    altKey: true
                };
                SpecRunnerUtils.simulateKeyEvent(82, "keydown", mockElement[0], modifiers);
                expect(capturedEvent.keyCode).toEqual(82);
                expect(capturedEvent.which).toEqual(82);
                expect(capturedEvent.charCode).toEqual(82);
                expect(capturedEvent.ctrlKey).toEqual(true);
                expect(capturedEvent.altKey).toEqual(true);
            });
        });
    });
});
