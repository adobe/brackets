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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */

/**
 *  Utilities functions related to color matching
 */
define(function (require, exports, module) {
    "use strict";

    var Strings         = brackets.getModule("strings"),
        StringUtils     = brackets.getModule("utils/StringUtils"),
        AnimationUtils  = brackets.getModule("utils/AnimationUtils");

    /**
     * Regular expressions for matching timing functions
     * @const @type {RegExp}
     */
    var BEZIER_CURVE_VALID_REGEX        = /cubic-bezier\(\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*\)/,
        BEZIER_CURVE_GENERAL_REGEX      = /cubic-bezier\((.*)\)/,
        EASE_STRICT_REGEX               = /[: ,]ease(?:-in)?(?:-out)?[ ,;]/,
        EASE_LAX_REGEX                  = /ease(?:-in)?(?:-out)?/,
        LINEAR_STRICT_REGEX             = /(transition|animation).*?[: ,]linear[ ,;]/,
        LINEAR_LAX_REGEX                = /linear/,
        STEPS_VALID_REGEX               = /steps\(\s*(\d+)\s*(?:,\s*(\w+)\s*)?\)/,
        STEPS_GENERAL_REGEX             = /steps\((.*)\)/,
        STEP_STRICT_REGEX               = /[: ,](?:step-start|step-end)[ ,;]/,
        STEP_LAX_REGEX                  = /step-start|step-end/;

    /**
     * Type constants
     * @const @type {number}
     */
    var BEZIER  = 1,
        STEP    = 2;

    /**
     * If string is a number, then convert it.
     *
     * @param {string} str  value parsed from page.
     * @return { isNumber: boolean, value: ?number }
     */
    function _convertToNumber(str) {
        if (typeof str !== "string") {
            return { isNumber: false, value: null };
        }

        var val = parseFloat(+str, 10),
            isNum = (typeof val === "number") && !isNaN(val) &&
                    (val !== Infinity) && (val !== -Infinity);

        return {
            isNumber: isNum,
            value:    val
        };
    }

    /**
     * Get valid params for an invalid cubic-bezier.
     *
     * @param {RegExp.match} match (Invalid) matches from cubicBezierMatch()
     * @return {?RegExp.match} Valid match or null if the output is not valid
     */
    function _getValidBezierParams(match) {
        var param,
            // take ease-in-out as default value in case there are no params yet (or they are invalid)
            def = [ ".42", "0", ".58", "1" ],
            oldIndex = match.index, // we need to store the old match.index to re-set the index afterwards
            originalString = match[0],
            i;

        if (match) {
            match = match[1].split(",");
        }

        if (match) {
            for (i = 0; i <= 3; i++) {
                if (match[i]) {
                    match[i] = match[i].trim();
                    param = _convertToNumber(match[i]);

                    // Verify the param is a number
                    // If not, replace it with the default value
                    if (!param.isNumber) {
                        match[i] = undefined;

                    // Verify x coordinates are in 0-1 range
                    // If not, set them to the closest value in range
                    } else if (i === 0 || i === 2) {
                        if (param.value < 0) {
                            match[i] = "0";
                        } else if (param.value > 1) {
                            match[i] = "1";
                        }
                    }
                }

                if (!match[i]) {
                    match[i] = def[i];
                }
            }
        } else {
            match = def;
        }
        match = match.splice(0, 4); // make sure there are only 4 params
        match = "cubic-bezier(" + match.join(", ") + ")";
        match = match.match(BEZIER_CURVE_VALID_REGEX);

        if (match) {
            match.index = oldIndex; // re-set the index here to get the right context
            match.originalString = originalString;
            return match;
        }
        return null;
    }

    /**
     * Validate cubic-bezier function parameters that are not already validated by regex:
     *
     * @param {RegExp.match} match  RegExp Match object with cubic-bezier function parameters
     *                              in array positions 1-4.
     * @return {boolean} true if all parameters are valid, otherwise, false
     */
    function _validateCubicBezierParams(match) {
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
     * Get valid params for an invalid steps function.
     *
     * @param {RegExp.match} match (Invalid) matches from stepsMatch()
     * @return {?RegExp.match} Valid match or null if the output is not valid
     */
    function _getValidStepsParams(match) {
        var param,
            def = [ "5", "end" ],
            params = def,
            oldIndex = match.index, // we need to store the old match.index to re-set the index afterwards
            originalString = match[0];

        if (match) {
            match = match[1].split(",");
        }

        if (match) {
            if (match[0]) {
                param = match[0].replace(/[\s\"']/g, ""); // replace possible trailing whitespace or leading quotes
                param = _convertToNumber(param);

                // Verify number_of_params is a number
                // If not, replace it with the default value
                if (!param.isNumber) {
                    param.value = def[0];

                // Round number_of_params to an integer
                } else if (param.value) {
                    param.value = Math.floor(param.value);
                }

                // Verify number_of_steps is >= 1
                // If not, set them to the default value
                if (param.value < 1) {
                    param.value = def[0];
                }
                params[0] = param.value;
            }
            if (match[1]) {
                // little autocorrect feature: leading s gets 'start', everything else gets 'end'
                param = match[1].replace(/[\s\"']/g, ""); // replace possible trailing whitespace or leading quotes
                param = param.substr(0, 1);
                if (param === "s") {
                    params[1] = "start";
                } else {
                    params[1] = "end";
                }
            }
        }
        params = "steps(" + params.join(", ") + ")";
        params = params.match(STEPS_VALID_REGEX);

        if (params) {
            params.index = oldIndex; // re-set the index here to get the right context
            params.originalString = originalString;
            return params;
        }
        return null;
    }

    /**
     * Validate steps function parameters that are not already validated by regex:
     *
     * @param {RegExp.match} match  RegExp Match object with steps function parameters
     *                              in array position 1 (and optionally 2).
     * @return {boolean} true if all parameters are valid, otherwise, false
     */
    function _validateStepsParams(match) {
        var count = _convertToNumber(match[1]);

        if (!count.isNumber || count.value < 1 || Math.floor(count.value) !== count.value) {
            return false;
        }

        if (match[2] && match[2] !== "start" && match[2] !== "end") {
            return false;
        }

        return true;
    }

    /**
     * Show, hide or update the hint text
     *
     * @param {object} hint Editor.hint object of the current InlineTimingFunctionEditor
     * @param {boolean} show Whether the hint should be shown or hidden
     * @param {string=} documentCode The invalid code from the document (can be omitted when hiding)
     * @param {string=} editorCode The valid code that is shown in the Inline Editor (can be omitted when hiding)
     */
    function showHideHint(hint, show, documentCode, editorCode) {
        if (!hint || !hint.elem) {
            return;
        }

        if (show) {
            hint.shown = true;
            hint.animationInProgress = false;
            hint.elem.removeClass("fadeout");
            hint.elem.html(StringUtils.format(Strings.INLINE_TIMING_EDITOR_INVALID, documentCode, editorCode));
            hint.elem.css("display", "block");
        } else if (hint.shown) {
            hint.animationInProgress = true;
            AnimationUtils.animateUsingClass(hint.elem[0], "fadeout", 750)
                .done(function () {
                    if (hint.animationInProgress) { // do this only if the animation was not cancelled
                        hint.elem.hide();
                    }
                    hint.shown = false;
                    hint.animationInProgress = false;
                });
        } else {
            hint.elem.hide();
        }
    }

    /**
     * Tag this match with type and return it for chaining
     *
     * @param {!RegExp.match} match  RegExp Match object with steps function parameters
     *                              in array position 1 (and optionally 2).
     * @param {number} type Either BEZIER or STEP
     * @return {RegExp.match} Same object that was passed in.
     */
    function _tagMatch(match, type) {
        switch (type) {
        case BEZIER:
            match.isBezier = true;
            break;
        case STEP:
            match.isStep = true;
            break;
        }

        return match;
    }

    /**
     * Match a bezier curve function value from a CSS Declaration or Value.
     *
     * Matches returned from this function must be handled in
     * BezierCurveEditor._getCubicBezierCoords().
     *
     * @param {string} str  Input string.
     * @param {!boolean} lax  Parsing mode where:
     *          lax=false Input is a Full or partial line containing CSS Declaration.
     *                    This is the more strict search used for initial detection.
     *          lax=true  Input is a previously parsed value. This is the less strict search
     *                    used to convert previously parsed values to RegExp match format.
     * @return {!RegExpMatch}
     */
    function bezierCurveMatch(str, lax) {
        var match;

        // First look for any cubic-bezier().
        match = str.match(BEZIER_CURVE_VALID_REGEX);
        if (match && _validateCubicBezierParams(match)) { // cubic-bezier() with valid params
            return _tagMatch(match, BEZIER);
        }

        match = str.match(BEZIER_CURVE_GENERAL_REGEX);
        if (match) {
            match = _getValidBezierParams(match);
            if (match && _validateCubicBezierParams(match)) {
                return _tagMatch(match, BEZIER);
            } else { // this should not happen!
                window.console.log("brackets-cubic-bezier: TimingFunctionUtils._getValidBezierParams created invalid code");
            }
        }

        // Next look for the ease functions (which are special cases of cubic-bezier())
        if (lax) {
            // For lax parsing, just look for the keywords
            match = str.match(EASE_LAX_REGEX);
            if (match) {
                return _tagMatch(match, BEZIER);
            }
        } else {
            // For strict parsing, start with a syntax verifying search
            match = str.match(EASE_STRICT_REGEX);
            if (match) {
                // return exact match to keyword that we need for later replacement
                return _tagMatch(str.match(EASE_LAX_REGEX), BEZIER);
            }
        }

        // Final case is linear.
        if (lax) {
            // For lax parsing, just look for the keyword
            match = str.match(LINEAR_LAX_REGEX);
            if (match) {
                return _tagMatch(match, BEZIER);
            }
        } else {
            // The linear keyword can occur in other values, so for strict parsing we
            // only detect when it's on same line as "transition" or "animation"
            match = str.match(LINEAR_STRICT_REGEX);
            if (match) {
                // return exact match to keyword that we need for later replacement
                return _tagMatch(str.match(LINEAR_LAX_REGEX), BEZIER);
            }
        }

        return null;
    }

    /**
     * Match a steps function value from a CSS Declaration or Value.
     *
     * Matches returned from this function must be handled in
     * BezierCurveEditor._getCubicBezierCoords().
     *
     * @param {string} str  Input string.
     * @param {!boolean} lax  Parsing mode where:
     *          lax=false Input is a Full or partial line containing CSS Declaration.
     *                    This is the more strict search used for initial detection.
     *          lax=true  Input is a previously parsed value. This is the less strict search
     *                    used to convert previously parsed values to RegExp match format.
     * @return {!RegExpMatch}
     */
    function stepsMatch(str, lax) {
        var match;

        // First look for any steps().
        match = str.match(STEPS_VALID_REGEX);
        if (match && _validateStepsParams(match)) { // cubic-bezier() with valid params
            return _tagMatch(match, STEP);
        }

        match = str.match(STEPS_GENERAL_REGEX);
        if (match) {
            match = _getValidStepsParams(match);
            if (match && _validateStepsParams(match)) {
                return _tagMatch(match, STEP);
            } else { // this should not happen!
                window.console.log("brackets-steps: TimingFunctionUtils._getValidStepsParams created invalid code");
            }
        }

        // Next look for the step functions (which are special cases of steps())
        if (lax) {
            // For lax parsing, just look for the keywords
            match = str.match(STEP_LAX_REGEX);
            if (match) {
                return _tagMatch(match, STEP);
            }
        } else {
            // For strict parsing, start with a syntax verifying search
            match = str.match(STEP_STRICT_REGEX);
            if (match) {
                // return exact match to keyword that we need for later replacement
                return _tagMatch(str.match(STEP_LAX_REGEX), STEP);
            }
        }

        return null;
    }

    /**
     * Match a timing function value from a CSS Declaration or Value.
     *
     * Matches returned from this function must be handled in
     * BezierCurveEditor._getCubicBezierCoords().
     *
     * @param {string} str  Input string.
     * @param {!boolean} lax  Parsing mode where:
     *          lax=false Input is a Full or partial line containing CSS Declaration.
     *                    This is the more strict search used for initial detection.
     *          lax=true  Input is a previously parsed value. This is the less strict search
     *                    used to convert previously parsed values to RegExp match format.
     * @return {!RegExpMatch}
     */
    function timingFunctionMatch(str, lax) {
        return bezierCurveMatch(str, lax) || stepsMatch(str, lax);
    }

    // Define public API
    exports.timingFunctionMatch = timingFunctionMatch;
    exports.bezierCurveMatch    = bezierCurveMatch;
    exports.stepsMatch          = stepsMatch;
    exports.showHideHint        = showHideHint;
});
