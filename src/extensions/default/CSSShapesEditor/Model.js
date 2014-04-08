/*
 * Copyright (c) 2013 Adobe Systems Incorporated.
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
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";

    var _ = brackets.getModule("thirdparty/lodash");

    /**
     * @constructor
     * Lightweight model to set and get data from.
     *
     * Dispatches events on change and reset, if not explicitly asked to be silent:
     *   change -- when the properties in the model are changed with the setter.
     *
     * @param {Object=} properties Object literal with key/values to store as default; optional
     */
    function Model(properties) {

        if (!(this instanceof Model)) {
            return new Model(properties);
        }

        var _initial = properties || {},
            _props = {},
            _events = {};

        /**
         * Sets or updates properties on the model.
         *
         * @throws {TypeError} if input is falsy or not object
         * @param {!Object} obj Object literal with key/value pairs
         * @param {boolean=} silent set true to avoid triggering "change" event
         */
        var _set = function (obj, silent) {
            var hasChanged = false,
                k;

            if (!obj || typeof obj !== "object") {
                throw new TypeError("Invalid input. Expected object with properties, got: " + obj);
            }

            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    if (!_.isEqual(_props[k], obj[k])) {
                        _props[k] = obj[k];
                        hasChanged = true;
                    }
                }
            }

            if (!silent && hasChanged) {
                $(this).triggerHandler("change", [_props]);
            }
        };

        if (typeof properties === "object") {
            _set(properties, true);
        }

        return {
            set: _set,

            /**
             * Get a property value from the model
             * @param {!string} key
             * @return {undefined|*}
             */
            get: function (key) {
                return _props[key];
            },

            /**
             * Reset the model to its initial contents
             * @param {boolean=} silent; if true, will not trigger "change" event
             */
            reset: function (silent) {

                // assign a clone of the initial properties
                _props = JSON.parse(JSON.stringify(_initial));

                if (!silent) {
                    $(this).triggerHandler("change", [_props]);
                }
            }
        };
    }

    return Model;
});
