/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, brackets */

/**
 *  Utilities functions related to string manipulation
 *
 */
define(function (require, exports, module) {
    "use strict";

    var colorRegExParts = [
        "#[a-f0-9]{6}\b|#[a-f0-9]{3}\b",
        "rgb\(\s*\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*\)",
        "rgb\(\s*\b([0-9]{1,2}%|100%)\s*,\s*\b([0-9]{1,2}%|100%)\s*,\s*\b([0-9]{1,2}%|100%)\s*\)",
        "rgba\(\s*\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*(1|1\.0|0|0?\.[0-9]{1,3})\s*\)",
        "rgba\(\s*\b([0-9]{1,2}%|100%)\s*,\s*\b([0-9]{1,2}%|100%)\s*,\s*\b([0-9]{1,2}%|100%)\s*,\s*(1|1\.0|0|0?\.[0-9]{1,3})\s*\)",
        "hsl\(\s*\b([0-9]{1,3})\b\s*,\s*\b([0-9]{1,2}|100)\b%\s*,\s*\b([0-9]{1,2}|100)\b%\s*\)",
        "hsla\(\s*\b([0-9]{1,3})\b\s*,\s*\b([0-9]{1,2}|100)\b%\s*,\s*\b([0-9]{1,2}|100)\b%\s*,\s*(1|1\.0|0|0?\.[0-9]{1,3})\s*\)",
        "\baliceblue\b|\bantiquewhite\b|\baqua\b|\baquamarine\b|\bazure\b|\bbeige\b|\bbisque\b|\bblack\b|\bblanchedalmond\b",
        "\bblue\b|\bblueviolet\b|\bbrown\b|\bburlywood\b|\bcadetblue\b|\bchartreuse\b|\bchocolate\b|\bcoral\b|\bcornflowerblue\b",
        "\bcornsilk\b|\bcrimson\b|\bcyan\b|\bdarkblue\b|\bdarkcyan\b|\bdarkgoldenrod\b|\bdarkgray\b|\bdarkgreen\b|\bdarkgrey\b",
        "\bdarkkhaki\b|\bdarkmagenta\b|\bdarkolivegreen\b|\bdarkorange\b|\bdarkorchid\b|\bdarkred\b|\bdarksalmon\b|\bdarkseagreen\b",
        "\bdarkslateblue\b|\bdarkslategray\b|\bdarkslategrey\b|\bdarkturquoise\b|\bdarkviolet\b|\bdeeppink\b|\bdeepskyblue\b|\bdimgray\b",
        "\bdimgrey\b|\bdodgerblue\b|\bfirebrick\b|\bfloralwhite\b|\bforestgreen\b|\bfuchsia\b|\bgainsboro\b|\bghostwhite\b|\bgold\b",
        "\bgoldenrod\b|\bgray\b|\bgreen\b|\bgreenyellow\b|\bgrey\b|\bhoneydew\b|\bhotpink\b|\bindianred\b|\bindigo\b|\bivory\b|\bkhaki\b",
        "\blavender\b|\blavenderblush\b|\blawngreen\b|\blemonchiffon\b|\blightblue\b|\blightcoral\b|\blightcyan\b|\blightgoldenrodyellow\b",
        "\blightgray\b|\blightgreen\b|\blightgrey\b|\blightpink\b|\blightsalmon\b|\blightseagreen\b|\blightskyblue\b|\blightslategray\b",
        "\blightslategrey\b|\blightsteelblue\b|\blightyellow\b|\blime\b|\blimegreen\b|\blinen\b|\bmagenta\b|\bmaroon\b",
        "\bmediumaquamarine\b|\bmediumblue\b|\bmediumorchid\b|\bmediumpurple\b|\bmediumseagreen\b|\bmediumslateblue\b",
        "\bmediumspringgreen\b|\bmediumturquoise\b|\bmediumvioletred\b|\bmidnightblue\b|\bmintcream\b|\bmistyrose\b|\bmoccasin\b",
        "\bnavajowhite\b|\bnavy\b|\boldlace\b|\bolive\b|\bolivedrab\b|\borange\b|\borangered\b|\borchid\b|\bpalegoldenrod\b|\bpalegreen\b",
        "\bpaleturquoise\b|\bpalevioletred\b|\bpapayawhip\b|\bpeachpuff\b|\bperu\b|\bpink\b|\bplum\b|\bpowderblue\b|\bpurple\b|\bred\b",
        "\brosybrown\b|\broyalblue\b|\bsaddlebrown\b|\bsalmon\b|\bsandybrown\b|\bseagreen\b|\bseashell\b|\bsienna\b|\bsilver\b",
        "\bskyblue\b|\bslateblue\b|\bslategray\b|\bslategrey\b|\bsnow\b|\bspringgreen\b|\bsteelblue\b|\btan\b|\bteal\b|\bthistle\b",
        "\btomato\b|\bturquoise\b|\bviolet\b|\bwheat\b|\bwhite\b|\bwhitesmoke\b|\byellow\b|\byellowgreen\b"
    ];
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

    function htmlEscape(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
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
        var escUrl = htmlEscape(url);

        // Inject zero-width space character (U+200B) near path separators (/) to allow line breaking there
        return escUrl.replace(
            new RegExp(regexEscape("/"), "g"),
            "/" + "&#8203;"
        );
    }

    function getColorRegEx() {
        return (new RegExp(colorRegExParts.join("|"), "gi"));
    }

    // Define public API
    exports.breakableUrl    = breakableUrl;
    exports.endsWith        = endsWith;
    exports.format          = format;
    exports.getColorRegEx   = getColorRegEx;
    exports.getLines        = getLines;
    exports.htmlEscape      = htmlEscape;
    exports.jQueryIdEscape  = jQueryIdEscape;
    exports.offsetToLineNum = offsetToLineNum;
    exports.regexEscape     = regexEscape;
    exports.urlSort         = urlSort;
});
