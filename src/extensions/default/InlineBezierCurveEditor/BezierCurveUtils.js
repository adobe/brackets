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
     * Match a bezier curve value from a CSS Declaration or Value.
     *
     * Matches returned from this function must be handled in
     * BezierCurveEditor._getCubicBezierCoords().
     *
     * @param {string} str  Input string.
     * @param {!boolean} lax  Parsing mode where:
     *          lax=false Input is a Full or partial line containing CSS Declaration.
     *                    This is the more strict search used for initial detection.
     *          lax=true  Input is a previously parsed value. This is the less strict search
     *                    used to convert previouslt parsed values to RegExp match format.
     * @return {!RegExpMatch}
     */
    function cubicBezierMatch(str, lax) {

        // First look for cubic-bezier(...).
        var match = str.match(BEZIER_CURVE_REGEX);
        if (match) {
            return match;
        }

        // Next look for the ease functions (which are special cases of cubic-bezier())
        if (lax) {
            // For lax parsing, just look for the keywords
            match = str.match(/ease(-in)?(-out)?/);
            if (match) {
                return match;
            }
        } else {
            // For strict parsing, start with a syntax verifying search
            match = str.match(/[: ,]ease(-in)?(-out)?[ ,;]/);
            if (match) {
                // return exact match to keyword that we need for later replacement
                return str.match(/ease(-in)?(-out)?/);
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
    exports.cubicBezierMatch    = cubicBezierMatch;
});
