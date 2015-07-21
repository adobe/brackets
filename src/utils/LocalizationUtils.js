/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
 *  Utilities functions related to localization/i18n
 */
define(function (require, exports, module) {
    "use strict";

    var _       = require("thirdparty/lodash"),
        Strings = require("strings");

    /*
     * Converts a language code to its written name, if possible.
     * If not possible, the language code is simply returned.
     *
     * @param {string} locale The two-char language code
     * @return {string} The language's name or the given language code
     */
    function getLocalizedLabel(locale) {
        var key  = "LOCALE_" + locale.toUpperCase().replace("-", "_"),
            i18n = Strings[key];

        return i18n === undefined ? locale : i18n;
    }

    /*
     * Returns the locale with the country part removed.
     * Example: en-US -> en
     *
     * @param {string} locale  The five-char or two-char language code. Defaults to brackets.getLocale()
     * @return {string} The two-char language code with the country part removed
     */
    function shortLang(locale) {
        locale = locale || brackets.getLocale();
        return locale.split("-")[0];
    }

    /*
     * @return {Array} The users preferred languages, in order of priority
     */
    function userLanguages() {
        var locale = brackets.getLocale();
        return _.uniq([locale, shortLang(locale)]);
    }

    /*
     * @return {Array} The users preferred languages including English, in order of priority
     */
    function languages() {
        var locale = brackets.getLocale();
        return _.uniq([locale, shortLang(locale), "en"]);
    }


    // Define public API
    exports.shortLang           = shortLang;
    exports.userLanguages       = userLanguages;
    exports.languages           = languages;

    exports.getLocalizedLabel   = getLocalizedLabel;
});
