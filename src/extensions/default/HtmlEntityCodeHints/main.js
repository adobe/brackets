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
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        Strings             = brackets.getModule("strings"),
        HtmlSpecialChars    = require("text!SpecialChars.json"),
        specialChars;


    PreferencesManager.definePreference("codehint.SpecialCharHints", "boolean", true, {
        description: Strings.DESCRIPTION_SPECIAL_CHAR_HINTS
    });

    /**
     * Encodes the special Char value given.
     *
     * @param {string} value
     * The value to encode
     *
     * @return {string}
     * The encoded string
     */
    function _encodeValue(value) {
        return value.replace("&", "&amp;").replace("#", "&#35;");
    }

    /**
     * Decodes the special Char value given.
     *
     * @param {string} value
     * The value to decode
     *
     * @return {string}
     * The decoded string
     */
    function _decodeValue(value) {
        return value.replace("&amp;", "&").replace("&#35;", "#");
    }

    /**
     * @constructor
     */
    function SpecialCharHints() {
        this.primaryTriggerKeys = "&ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#0123456789";
        this.currentQuery = "";
    }

    /**
     * Determines whether HtmlSpecialChar hints are available in the current editor
     * context.
     *
     * @param {Editor} editor
     * A non-null editor object for the active window.
     *
     * @param {string} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {boolean}
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non- null,
     * whether it is appropriate to do so.
     */
    SpecialCharHints.prototype.hasHints = function (editor, implicitChar) {
        this.editor = editor;

        return this._getQuery() !== null;
    };

    /**
     * Returns a list of avaliable HtmlSpecialChar hints if possible for the current
     * editor context.
     *
     * @param {string} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {jQuery.Deferred|{
     *              hints: Array.<string|jQueryObject>,
     *              match: string,
     *              selectInitial: boolean,
     *              handleWideResults: boolean}}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides:
     * 1. a sorted array hints that consists of strings
     * 2. a string match that is used by the manager to emphasize matching
     *    substrings when rendering the hint list
     * 3. a boolean that indicates whether the first result, if one exists,
     *    should be selected by default in the hint list window.
     * 4. handleWideResults, a boolean (or undefined) that indicates whether
     *    to allow result string to stretch width of display.
     */
    SpecialCharHints.prototype.getHints = function (implicitChar) {
        var query,
            result;

        if (implicitChar === null || this.primaryTriggerKeys.indexOf(implicitChar) !== -1) {
            this.currentQuery = query = this._getQuery();
            result = $.map(specialChars, function (value, index) {
                if (value.indexOf(query) === 0) {
                    var shownValue = _encodeValue(value);
                    return shownValue  + "; <span class='entity-display-character'>" + value + ";</span>";
                }
            }).sort(this._internalSort);

            if (query !== null) {
                query = _encodeValue(query);
            }

            return {
                hints: result,
                match: query,
                selectInitial: true,
                handleWideResults: false
            };
        }

        return null;
    };

    /**
     * Sort function used internally when sorting the Hints
     *
     * @param {string} value
     * The value to decode
     *
     * @return {string}
     * The decoded string
     */
    SpecialCharHints.prototype._internalSort = function (a, b) {
        a = _decodeValue(a.slice(0, a.indexOf(" "))).toLowerCase();
        b = _decodeValue(b.slice(0, b.indexOf(" "))).toLowerCase();

        if (a.indexOf("#") !== -1 && b.indexOf("#") !== -1) {
            var num1 = parseInt(a.slice(a.indexOf("#") + 1, a.length - 1), 10),
                num2 = parseInt(b.slice(b.indexOf("#") + 1, b.length - 1), 10);

            return (num1 - num2);
        }

        return a.localeCompare(b);
    };

    /**
     * Returns a query for the Hints
     *
     * @return {string}
     * The Query for which to search
     */
    SpecialCharHints.prototype._getQuery = function () {
        var query,
            lineContentBeforeCursor,
            startChar,
            endChar,
            cursor = this.editor.getCursorPos();

        if (HTMLUtils.getTagInfo(this.editor, cursor).tagName !== "") {
            return null;
        }

        lineContentBeforeCursor = this.editor.document.getRange({
            line: cursor.line,
            ch: 0
        }, cursor);

        startChar = lineContentBeforeCursor.lastIndexOf("&");
        endChar = lineContentBeforeCursor.lastIndexOf(";");

        // If no startChar was found or the endChar is greater than the startChar then it is no entity
        if (startChar === -1 || endChar > startChar) {
            return null;
        }

        query = this.editor.document.getRange({
            line: cursor.line,
            ch: startChar
        }, cursor);

        return query;
    };

    /**
     * Inserts a given HtmlSpecialChar hint into the current editor context.
     *
     * @param {string} completition
     * The hint to be inserted into the editor context.
     *
     * @return {boolean}
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    SpecialCharHints.prototype.insertHint = function (completion) {
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            cursor = this.editor.getCursorPos(),
            line = this.editor.document.getLine(cursor.line),
            subLine,
            ampersandPos,
            semicolonPos,
            entityMatch;

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - this.currentQuery.length;
        subLine = line.slice(cursor.ch);
        ampersandPos = subLine.indexOf("&");
        semicolonPos = subLine.indexOf(";");
        end.ch = start.ch + this.currentQuery.length;

        // We're looking for ';' in line before next '&'
        if (semicolonPos !== -1 && (ampersandPos === -1 || ampersandPos > semicolonPos)) {

            subLine = subLine.slice(0, semicolonPos);

            // regexp must match entire subLine string
            entityMatch = subLine.match(/^(#?[0-9]+)|([a-zA-Z]+)$/);
            if (entityMatch && entityMatch.length > 0 && entityMatch.index === 0 &&
                    entityMatch[0].length === subLine.length) {
                // replace entity
                end.ch = line.indexOf(";", start.ch) + 1;
            }
        }

        completion = completion.slice(0, completion.indexOf(" "));
        completion = _decodeValue(completion);
        if (start.ch !== end.ch) {
            this.editor.document.replaceRange(completion, start, end);
        } else {
            this.editor.document.replaceRange(completion, start);
        }

        return false;
    };

    AppInit.appReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles.css");
        // Parse JSON files
        specialChars = JSON.parse(HtmlSpecialChars);

        // Register code hint providers
        var specialCharHints = new SpecialCharHints();

        CodeHintManager.registerHintProvider(specialCharHints, ["html"], 1);
    });

    //Export Hints for Unit Tests
    exports.SpecialCharHints = SpecialCharHints;
});
