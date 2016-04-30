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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define */

/**
 * HintUtils2 was created as a place to put utilities that do not require third party dependencies so
 * they can be used by tern-worker.js and other JS files.
 * This is done because of the require config in tern-worker.js needed to load tern libraries. Libraries
 * that include, say "acorn", will fail to load.
 */
define(function (require, exports, module) {
    "use strict";

    /**
     * Format the given parameter array. Handles separators between
     * parameters, syntax for optional parameters, and the order of the
     * parameter type and parameter name.
     *
     * @param {!Array.<{name: string, type: string, isOptional: boolean}>} params -
     * array of parameter descriptors
     * @param {function(string)=} appendSeparators - callback function to append separators.
     * The separator is passed to the callback.
     * @param {function(string, number)=} appendParameter - callback function to append parameter.
     * The formatted parameter type and name is passed to the callback along with the
     * current index of the parameter.
     * @param {boolean=} typesOnly - only show parameter types. The
     * default behavior is to include both parameter names and types.
     * @return {string} - formatted parameter hint
     */
    function formatParameterHint(params, appendSeparators, appendParameter, typesOnly) {
        var result = "",
            pendingOptional = false;

        params.forEach(function (value, i) {
            var param = value.type,
                separators = "";

            if (value.isOptional) {
                // if an optional param is following by an optional parameter, then
                // terminate the bracket. Otherwise enclose a required parameter
                // in the same bracket.
                if (pendingOptional) {
                    separators += "]";
                }

                pendingOptional = true;
            }

            if (i > 0) {
                separators += ", ";
            }

            if (value.isOptional) {
                separators += "[";
            }

            if (appendSeparators) {
                appendSeparators(separators);
            }

            result += separators;

            if (!typesOnly) {
                param += " " + value.name;
            }

            if (appendParameter) {
                appendParameter(param, i);
            }

            result += param;

        });

        if (pendingOptional) {
            if (appendSeparators) {
                appendSeparators("]");
            }

            result += "]";
        }

        return result;
    }

    exports.formatParameterHint = formatParameterHint;
});
