/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/* The hash code routne is taken from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
   @CC wiki attribution: esmiralha
*/

/*eslint no-bitwise: off */
/*jslint bitwise: true */

/**
 *  Utilities functions related to string manipulation
 *
 */
define(function (require, exports, module) {
    "use strict";

    var _ = require("thirdparty/lodash");

    /**
     * Format a string by replacing placeholder symbols with passed in arguments.
     *
     * Example: var formatted = StringUtils.format("Hello {0}", "World");
     *
     * @param {string} str The base string
     * @param {...} Arguments to be substituted into the string
     *
     * @return {string} Formatted string
     */
    function format(str) {
        // arguments[0] is the base string, so we need to adjust index values here
        var args = [].slice.call(arguments, 1);
        return str.replace(/\{(\d+)\}/g, function (match, num) {
            return typeof args[num] !== "undefined" ? args[num] : match;
        });
    }

    function regexEscape(str) {
        return str.replace(/([.?*+\^$\[\]\\(){}|\-])/g, "\\$1");
    }

    // Periods (aka "dots") are allowed in HTML identifiers, but jQuery interprets
    // them as the start of a class selector, so they need to be escaped
    function jQueryIdEscape(str) {
        return str.replace(/\./g, "\\.");
    }

    /**
     * Splits the text by new line characters and returns an array of lines
     * @param {string} text
     * @return {Array.<string>} lines
     */
    function getLines(text) {
        return text.split("\n");
    }

    /**
     * Returns a line number corresponding to an offset in some text. The text can
     * be specified as a single string or as an array of strings that correspond to
     * the lines of the string.
     *
     * Specify the text in lines when repeatedly calling the function on the same
     * text in a loop. Use getLines() to divide the text into lines, then repeatedly call
     * this function to compute a line number from the offset.
     *
     * @param {string | Array.<string>} textOrLines - string or array of lines from which
     *      to compute the line number from the offset
     * @param {number} offset
     * @return {number} line number
     */
    function offsetToLineNum(textOrLines, offset) {
        if (Array.isArray(textOrLines)) {
            var lines = textOrLines,
                total = 0,
                line;
            for (line = 0; line < lines.length; line++) {
                if (total < offset) {
                    // add 1 per line since /n were removed by splitting, but they needed to
                    // contribute to the total offset count
                    total += lines[line].length + 1;
                } else if (total === offset) {
                    return line;
                } else {
                    return line - 1;
                }
            }

            // if offset is NOT over the total then offset is in the last line
            if (offset <= total) {
                return line - 1;
            } else {
                return undefined;
            }
        } else {
            return textOrLines.substr(0, offset).split("\n").length - 1;
        }
    }

    /**
     * Returns true if the given string starts with the given prefix.
     * @param   {String} str
     * @param   {String} prefix
     * @return {Boolean}
     */
    function startsWith(str, prefix) {
        return str.slice(0, prefix.length) === prefix;
    }

    /**
     * Returns true if the given string ends with the given suffix.
     *
     * @param {string} str
     * @param {string} suffix
     */
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function urlSort(a, b) {
        var a2, b2;
        function isFile(s) {
            return ((s.lastIndexOf("/") + 1) < s.length);
        }

        if (brackets.platform === "win") {
            // Windows: prepend folder names with a '0' and file names with a '1' so folders are listed first
            a2 = ((isFile(a)) ? "1" : "0") + a.toLowerCase();
            b2 = ((isFile(b)) ? "1" : "0") + b.toLowerCase();
        } else {
            a2 = a.toLowerCase();
            b2 = b.toLowerCase();
        }

        if (a2 === b2) {
            return 0;
        } else {
            return (a2 > b2) ? 1 : -1;
        }
    }

    /**
     * Return an escaped path or URL string that can be broken near path separators.
     * @param {string} url the path or URL to format
     * @return {string} the formatted path or URL
     */
    function breakableUrl(url) {
        // This is for displaying in UI, so always want it escaped
        var escUrl = _.escape(url);

        // Inject zero-width space character (U+200B) near path separators (/) to allow line breaking there
        return escUrl.replace(
            new RegExp(regexEscape("/"), "g"),
            "/" + "&#8203;"
        );
    }

    /**
     * Converts number of bytes into human readable format.
     * If param bytes is negative it returns the number without any changes.
     *
     * @param {number} bytes     Number of bytes to convert
     * @param {number} precision Number of digits after the decimal separator
     * @return {string}
     */
    function prettyPrintBytes(bytes, precision) {
        var kilobyte = 1024,
            megabyte = kilobyte * 1024,
            gigabyte = megabyte * 1024,
            terabyte = gigabyte * 1024,
            returnVal = bytes;

        if ((bytes >= 0) && (bytes < kilobyte)) {
            returnVal = bytes + " B";
        } else if (bytes < megabyte) {
            returnVal = (bytes / kilobyte).toFixed(precision) + " KB";
        } else if (bytes < gigabyte) {
            returnVal = (bytes / megabyte).toFixed(precision) + " MB";
        } else if (bytes < terabyte) {
            returnVal = (bytes / gigabyte).toFixed(precision) + " GB";
        } else if (bytes >= terabyte) {
            return (bytes / terabyte).toFixed(precision) + " TB";
        }

        return returnVal;
    }

    /**
     * Truncate text to specified length.
     * @param {string} str Text to be truncated.
     * @param {number} len Length to which text should be truncated
     * @return {?string} Returns truncated text only if it was changed
     */
    function truncate(str, len) {
        // Truncate text to specified length
        if (str.length > len) {
            str = str.substr(0, len);

            // To prevent awkwardly truncating in the middle of a word,
            // attempt to truncate at the end of the last whole word
            var lastSpaceChar = str.lastIndexOf(" ");
            if (lastSpaceChar < len && lastSpaceChar > -1) {
                str = str.substr(0, lastSpaceChar);
            }
            return str;
        }
    }

    /**
     * Computes a 32bit hash from the given string
     * Taken from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
     * @CC wiki attribution: esmiralha
     * @param   {string}   str The string for which hash is to be computed
     * @return {number} The 32-bit hash
     */
    function hashCode(str) {
        var hash = 0, i, chr, len;
        if (str.length === 0) {
            return hash;
        }
        for (i = 0, len = str.length; i < len; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    // Define public API
    exports.format              = format;
    exports.regexEscape         = regexEscape;
    exports.jQueryIdEscape      = jQueryIdEscape;
    exports.getLines            = getLines;
    exports.offsetToLineNum     = offsetToLineNum;
    exports.urlSort             = urlSort;
    exports.breakableUrl        = breakableUrl;
    exports.startsWith          = startsWith;
    exports.endsWith            = endsWith;
    exports.prettyPrintBytes    = prettyPrintBytes;
    exports.truncate            = truncate;
    exports.hashCode            = hashCode;
});
