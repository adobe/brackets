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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define */

/**
 * DOMHelpers is a collection of functions used by the DOMAgent exports `eachNode(src, callback)`
 */
define(function DOMHelpersModule(require, exports, module) {
    "use strict";

    /** Test if the given character is a quote character
     * {char} source character
     * {char} escape (previous) character
     * {char} quote character
     */
    function _isQuote(c, escape, quote) {
        if (escape === "\\") {
            return false;
        }
        if (quote !== undefined) {
            return c === quote;
        }
        return c === "\"" || c === "'";
    }

    /** Remove quotes from the string and adjust escaped quotes
     * @param {string} source string
     */
    function _removeQuotes(src) {
        if (_isQuote(src[0]) && src[src.length - 1] === src[0]) {
            var q = src[0];
            src = src.substr(1, src.length - 2);
            src = src.replace("\\" + q, q);
        }
        return src;
    }

    /** Find the next match using several constraints
     * @param {string} source string
     * @param {string} or [{regex}, {length}] the match definition
     * @param {integer} ignore characters before this offset
     * @param {boolean} watch for quotes
     * @param [{string},{string}] watch for comments
     */
    function _find(src, match, skip, quotes, comments) {
        if (typeof match === "string") {
            match = [match, match.length];
        }
        if (skip === undefined) {
            skip = 0;
        }
        var i, activeQuote, isComment = false;
        for (i = skip; i < src.length; i++) {
            if (quotes && _isQuote(src[i], src[i - 1], activeQuote)) {
                // starting quote
                activeQuote = activeQuote ? undefined : src[i];
            } else if (!activeQuote) {
                if (comments && !isComment && src.substr(i, comments[0].length) === comments[0]) {
                    // opening comment
                    isComment = true;
                    i += comments[0].length - 1;
                } else if (isComment) {
                    // we are commented
                    if (src.substr(i, comments[1].length) === comments[1]) {
                        isComment = false;
                        i += comments[1].length - 1;
                    }
                } else if (src.substr(i, match[1]).search(match[0]) === 0) {
                    // match
                    return i;
                }
            }
        }
        return -1;
    }

    /** Callback iterator using `_find` */
    function _findEach(src, match, quotes, comments, callback) {
        var from = 0;
        var to;
        while (from < src.length) {
            to = _find(src, match, from, quotes, comments);
            if (to < 0) {
                to = src.length;
            }
            callback(src.substr(from, to - from));
            from = to + 1;
        }
    }

    /** Find the next tag
     * @param {string} source string
     * @param {integer} ignore characters before this offset
     */
    function _findTag(src, skip) {
        var from, to, inc;
        from = _find(src, [/<[a-z!\/]/i, 2], skip);
        if (from < 0) {
            return null;
        }
        if (src.substr(from, 4) === "<!--") {
            // html comments
            to = _find(src, "-->", from + 4);
            inc = 3;
        } else if (src.substr(from, 7).toLowerCase() === "<script") {
            // script tag
            to = _find(src.toLowerCase(), "</script>", from + 7);
            inc = 9;
        } else if (src.substr(from, 6).toLowerCase() === "<style") {
            // style tag
            to = _find(src.toLowerCase(), "</style>", from + 6);
            inc = 8;
        } else {
            to = _find(src, ">", from + 1, true);
            inc = 1;
        }
        if (to < 0) {
            return null;
        }
        return {from: from, length: to + inc - from};
    }

    /** Extract tag attributes from the given source of a single tag
     * @param {string} source content
     */
    function _extractAttributes(content) {

        // remove the node name and the closing bracket and optional slash
        content = content.replace(/^<\S+\s*/, "");
        content = content.replace(/\s*\/?>$/, "");
        if (content.length === 0) {
            return;
        }

        // go through the items and identify key value pairs split by =
        var index, key, value;
        var attributes = {};
        _findEach(content, [/\s/, 1], true, undefined, function each(item) {
            index = item.search("=");
            if (index < 0) {
                return;
            }

            // get the key
            key = item.substr(0, index).trim();
            if (key.length === 0) {
                return;
            }

            // get the value
            value = item.substr(index + 1).trim();
            value = _removeQuotes(value);
            attributes[key] = value;
        });

        return attributes;
    }

    /** Extract the node payload
     * @param {string} source content
     */
    function extractPayload(content) {
        var payload = {};

        if (content[0] !== "<") {
            // text
            payload.nodeType = 3;
            payload.nodeValue = content;
        } else if (content.substr(0, 4) === "<!--") {
            // comment
            payload.nodeType = 8;
            payload.nodeValue = content.substr(4, content.length - 7);
        } else if (content[1] === "!") {
            // doctype
            payload.nodeType = 10;
        } else {
            // regular element
            payload.nodeType = 1;
            payload.nodeName = /^<([^>\s]+)/.exec(content)[1].toUpperCase();
            payload.attributes = _extractAttributes(content);

            // closing node (/ at the beginning)
            if (payload.nodeName[0] === "/") {
                payload.nodeName = payload.nodeName.substr(1);
                payload.closing = true;
            }

            // closed node (/ at the end)
            if (content[content.length - 2] === "/") {
                payload.closed = true;
            }

            // Special handling for script/style tag since we've already collected
            // everything up to the end tag.
            if (payload.nodeName === "SCRIPT" || payload.nodeName === "STYLE") {
                payload.closed = true;
            }
        }
        return payload;
    }

    /** Split the source string into payloads representing individual nodes
     * @param {string} source
     * @param {function(payload)} callback
     */
    // split a string into individual node contents
    function eachNode(src, callback) {
        var index = 0;
        var text, range, length, payload;
        while (index < src.length) {

            // find the next tag
            range = _findTag(src, index);
            if (!range) {
                range = { from: src.length, length: 0 };
            }

            // add the text before the tag
            length = range.from - index;
            if (length > 0) {
                text = src.substr(index, length);
                if (/\S/.test(text)) {
                    payload = extractPayload(text);
                    payload.sourceOffset = index;
                    payload.sourceLength = length;
                    callback(payload);
                }
            }

            // add the tag
            if (range.length > 0) {
                payload = extractPayload(src.substr(range.from, range.length));
                payload.sourceOffset = range.from;
                payload.sourceLength = range.length;
                callback(payload);
            }

            // advance
            index = range.from + range.length;
        }
    }

    // Export public functions
    exports.extractPayload = extractPayload;
    exports.eachNode = eachNode;
});
