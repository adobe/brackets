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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

/**
 *  Utilities functions related to color matching
 */
define(function (require, exports, module) {
    "use strict";
    
    /**
     * Regular expression that matches CSS cubic-beziers functions (4 parameters).
     * @const @type {RegExp}
     */
    var BEZIER_CURVE_REGEX = /cubic-bezier\(\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*\)/;

    /**
     * If string is a number, then convert it.
     *
     * @param {string} str  value parsed from page.
     * @return { isNumber: boolean, value: number } 
     */
    function _convertToNumber(str) {
        if (typeof (str) !== "string") {
            return { isNumber: false };
        }

        var val = parseFloat(str, 10),
            isNum = (typeof (val) === "number") && !isNaN(val) &&
                    (val !== Infinity) && (val !== -Infinity);

        return {
            isNumber: isNum,
            value:    val
        };
    }

    /**
     * Validate cubic-bezier function parameters
     *
     * @param {RegExp.match} match  RegExp Match object with cubic-bezier function parameters
     *                              in array positions 1-4.
     * @return {boolean} true if all parameters are valid, otherwise, false
     */
    function _validateParams(match) {
        var x1 = _convertToNumber(match[1]),
            y1 = _convertToNumber(match[2]),
            x2 = _convertToNumber(match[3]),
            y2 = _convertToNumber(match[4]);

        // Verify all params are numbers
        if (!x1.isNumber || !y1.isNumber || !x2.isNumber || !y2.isNumber) {
            return false;
        }

        // Verify x params are in 0-1 range
        if (x1.value < 0 || x1.value > 1 || x2.value < 0 || x2.value > 1) {
            return false;
        }

        return true;
    }

    /**
     * Match a timing function value from a CSS Declaration or Value.
     *
     * Matches returned from this function must be handled in
     * TimingFunctionEditor._getCubicBezierCoords().
     *
     * @param {string} str  Input string.
     * @param {!boolean} lax  Parsing mode where:
     *          lax=false Input is a Full or partial line containing CSS Declaration.
     *                    This is the more strict search used for initial detection.
     *          lax=true  Input is a previously parsed value. This is the less strict search
     *                    used to convert previouslt parsed values to RegExp match format.
     * @return {!RegExpMatch}
     */
    function bezierCurveMatch(str, lax) {

        // First look for cubic-bezier(...).
        var match = str.match(BEZIER_CURVE_REGEX);
        if (match) {
            return _validateParams(match) ? match : null;
        }

        // Next look for the ease functions (which are special cases of cubic-bezier())
        if (lax) {
            // For lax parsing, just look for the keywords
            match = str.match(/ease(?:-in)?(?:-out)?/);
            if (match) {
                return match;
            }
        } else {
            // For strict parsing, start with a syntax verifying search
            match = str.match(/[: ,]ease(?:-in)?(?:-out)?[ ,;]/);
            if (match) {
                // return exact match to keyword that we need for later replacement
                return str.match(/ease(?:-in)?(?:-out)?/);
            }
        }

        // Final case is linear.
        if (lax) {
            // For lax parsing, just look for the keyword
            match = str.match(/linear/);
            if (match) {
                return match;
            }
        } else {
            // The linear keyword can occur in other values, so for strict parsing we
            // only detect when it's on same line as "transition"
            match = str.match(/transition.*?[: ,]linear[ ,;]/);
            if (match) {
                // return exact match to keyword that we need for later replacement
                return str.match(/linear/);
            }
        }

        return null;
    }

    // Define public API
    exports.bezierCurveMatch    = bezierCurveMatch;
});
