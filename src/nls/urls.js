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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {

    "use strict";

    // Registry for languages that have specific per-language URLs or file paths that we use
    // elsewhere in Brackets.
    //
    // TODO: dynamically populate the local prefix list below?
    module.exports = {
        root: true,
        "bg": true,
        "cs": true,
        "da": true,
        "de": true,
        "es": true,
        "fa-ir": true,
        "fi": true,
        "fr": true,
        "hr": true,
        "id": true,
        "it": true,
        "ja": true,
        "ko": true,
        "nb": true,
        "pl": true,
        "pt-br": true,
        "pt-pt": true,
        "ru": true,
        "sv": true,
        "zh-cn": true,
        "zh-tw": true,
        "tr": true
    };
});
