/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, expect */

define(function (require, exports, module) {
    'use strict';

    var ValidationUtils    = require("utils/ValidationUtils");

    describe("ValidationUtils", function () {
        it("should accept valid integers as integer", function () {
            expect(ValidationUtils.isInteger(0)).toBe(true);
            expect(ValidationUtils.isInteger(12)).toBe(true);
            expect(ValidationUtils.isInteger(+2)).toBe(true);
            expect(ValidationUtils.isInteger(-5)).toBe(true);
            expect(ValidationUtils.isInteger(3e07)).toBe(true);
            expect(ValidationUtils.isInteger(5.28e04)).toBe(true);
        });

        it("should not accept non-numbers as integer", function () {
            expect(ValidationUtils.isInteger(NaN)).toBe(false);
            expect(ValidationUtils.isInteger(null)).toBe(false);
            expect(ValidationUtils.isInteger(undefined)).toBe(false);
            expect(ValidationUtils.isInteger("4")).toBe(false);
            expect(ValidationUtils.isInteger(false)).toBe(false);
            expect(ValidationUtils.isInteger([0, 1, 2])).toBe(false);
            expect(ValidationUtils.isInteger({ch: 0, line: 0})).toBe(false);
        });

        it("should not accept non-integer numbers as integer", function () {
            expect(ValidationUtils.isInteger(-Infinity)).toBe(false);
            expect(ValidationUtils.isInteger(Math.PI)).toBe(false);
            expect(ValidationUtils.isInteger(0.375)).toBe(false);
            expect(ValidationUtils.isInteger(5e-1)).toBe(false);
            expect(ValidationUtils.isInteger(3.29834e-02)).toBe(false);
        });

        // ValidationUtils.isIntegerInRange() uses ValidationUtils.isInteger() to
        // validate value which is tested above, so no need to test non-integers
        it("should accept integers in range", function () {
            // Range limits are optional
            expect(ValidationUtils.isIntegerInRange(1)).toBe(true);
            expect(ValidationUtils.isIntegerInRange(3, 0)).toBe(true);
            expect(ValidationUtils.isIntegerInRange(12, null, 100)).toBe(true);
            expect(ValidationUtils.isIntegerInRange(-2, -10, +10)).toBe(true);
            expect(ValidationUtils.isIntegerInRange(13, -Infinity, Infinity)).toBe(true);
        });

        // Range limits are optional, so they can be specified as null or undefined to
        // indicate that end of range should not be enforced, so verify a value of 0
        // (which evaluates to falsey) can be enforced.
        it("should accept optional range limit of zero", function () {
            expect(ValidationUtils.isIntegerInRange(2, 0, 10)).toBe(true);
            expect(ValidationUtils.isIntegerInRange(-2, 0, 10)).toBe(false);
            expect(ValidationUtils.isIntegerInRange(-62, -100, 0)).toBe(true);
            expect(ValidationUtils.isIntegerInRange(62, -100, 0)).toBe(false);
        });

        it("should not accept integers out of range", function () {
            expect(ValidationUtils.isIntegerInRange(21, null, 20)).toBe(false);
            expect(ValidationUtils.isIntegerInRange(4, 5)).toBe(false);
            expect(ValidationUtils.isIntegerInRange(12, 1, 10)).toBe(false);
            expect(ValidationUtils.isIntegerInRange(-1000, -100, 100)).toBe(false);
        });
    });
});
