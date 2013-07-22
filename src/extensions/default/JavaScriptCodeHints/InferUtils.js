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

/*jslint undef: true, vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils      = brackets.getModule("utils/ExtensionUtils");

    var Infer,
        cx,
        thirdPartyPath = ExtensionUtils.getModulePath(module, "thirdparty");

    brackets.libRequire.config({baseUrl: thirdPartyPath})(["tern/lib/infer"], function (infer) {
        Infer = infer;

        cx = new infer.Context([], null);

        /**
         *  Given a Tern formatted function type string, convert it to an array of Objects, where each object describes
         *  a parameter.
         *
         * @param {String} newFnType - Tern formatted function type string.
         * @returns {Array<{name: string, type: string, isOptional: boolean}>} where each entry in the array is a parameter.
         */
        function getParameters(newFnType) {

            /**
             *
             * @param {!Array.<name: {string}, type: {string},
             * isOptional: {boolean}>} params - array of parameter descriptors
             * @returns {string} parameters formatted as a string
             */
            function formatParams(params) {
                var result = "";

                params.forEach(function (value, i) {

                    if (value.isOptional) {
                        if (i > 0) {
                            result += " ";
                        }
                        result += "[";
                    }

                    if (i > 0) {
                        result += ", ";
                    }

                    var type = value.type;

                    result += type;
                    result += " " + value.name;

                    if (value.isOptional) {
                        result += "]";
                    }
                });

                return result;
            }

            /**
             *  Convert an infer array type to a string.
             *
             *  Formatted using google closure style. For example:
             *
             *  "Array.<string, number>"
             *
             * @param {Infer.Arr} inferArrType
             *
             * @return {String} - array formatted in google closure style.
             *
             */
            function inferArrTypeToString(inferArrType) {
                var result = "Array.<";

                inferArrType.props["<i>"].types.forEach(function (value, i) {
                    if (i > 0) {
                        result += ", ";
                    }
                    result += inferTypeToString(value);
                });

                // workaround case where types is zero length
                if (inferArrType.props["<i>"].types.length === 0) {
                    result += "Object";
                }
                result += ">";

                return result;
            }

            /**
             *  Convert an infer type to a string.
             *
             * @param {*} inferType - one of the Infer's types; infer.Prim, infer.Arr, infer.ANull. infer.Fn functions are
             * not handled here.
             *
             * @return {String}
             *
             */
            function inferTypeToString(inferType) {
                var result;

                if (inferType instanceof infer.Prim) {
                    result = inferType.toString();
                } else if (inferType instanceof infer.Arr) {
                    result = inferArrTypeToString(inferType);
                } else {
                    result = "Object";
                }

                return result;
            }

            /**
             * Convert an infer function type to a Google closure type string.
             *
             * @param {Infer.Fn} inferType - type to convert.
             * @return {string} - function type as a string.
             */
            function inferFnTypeToString(inferType) {
                var result = "function(",
                    params = processInferFnTypeParameters(inferType);

                result += formatParams(params);
                result += "):";
                result += inferTypeToString(inferType.retval);
                return result;
            }

            /**
             * Convert an infer function type to string.
             *
             * @param {*} inferType - one of the Infer's types; infer.Fn, infer.Prim, infer.Arr, infer.ANull
             * @returns {Array<{name: string, type: string, isOptional: boolean}>} where each entry in the array is a parameter.
             */
            function processInferFnTypeParameters(inferType) {
                var params = [],
                    i;

                for (i = 0; i < inferType.args.length; i++) {
                    var param = {},
                        name = inferType.argNames[i],
                        type = inferType.args[i];

                    if (name[name.length - 1] === "?") {
                        name = name.substring(0, name.length - 1);
                        param.isOptional = true;
                    }

                    param.name = name;

                    if (type instanceof Infer.Fn) {
                        param.type = inferFnTypeToString(type);
                    } else {
                        param.type = inferTypeToString(type);
                    }

                    params.push(param);
                }

                return params;
            }

            if (newFnType && newFnType.indexOf("fn(") === 0) {
                var params = Infer.withContext(cx, function () {
                    var typeParser = new Infer.def.TypeParser(newFnType, null, null, true),
                        inferType = typeParser.parseType("", true);

                    return processInferFnTypeParameters(inferType);
                });

                return params;
            } else {
                return [];
            }

        }

        exports.getParameters = getParameters;
    });

});


