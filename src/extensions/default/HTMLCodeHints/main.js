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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var HTMLUtils       = brackets.getModule("language/HTMLUtils"),
        HTMLTags        = require("text!HtmlTags.json"),
        HTMLAttributes  = require("text!HtmlAttributes.json"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        tags            = JSON.parse(HTMLTags),
        attributes      = JSON.parse(HTMLAttributes);

    /**
     * @constructor
     */
    function TagHints() {}

    /**
     * Filters the source list by query and returns the result
     * @param {Object.<queryStr: string, ...} query -- a query object with a required property queryStr 
     *     that will be used to filter out code hints
     * @return {Array.<string>}
     */
    TagHints.prototype.search = function (query) {
        var result = $.map(tags, function (value, key) {
            if (key.indexOf(query.queryStr) === 0) {
                return key;
            }
        }).sort();

        return result;
        // TODO: better sorting. Should rank tags based on portion of query that is present in tag
    };


    /**
     * Figures out the text to use for the hint list query based on the text
     * around the cursor
     * Query is the text from the start of a tag to the current cursor position
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     * @return {Object.<queryStr: string, ...} search query results will be filtered by.
     *      Return empty queryStr string to indicate code hinting should not filter and show all results.
     *      Return null in queryStr to indicate NO hints can be provided.
     */
    TagHints.prototype.getQueryInfo = function (editor, cursor) {
        var tagInfo = HTMLUtils.getTagInfo(editor, cursor),
            query = {queryStr: null};

        if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
            if (tagInfo.position.offset >= 0) {
                query.queryStr = tagInfo.tagName.slice(0, tagInfo.position.offset);
            }

        }

        return query;
    };

    /**
     * Enters the code completion text into the editor
     * @param {string} completion - text to insert into current code editor
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     */
    TagHints.prototype.handleSelect = function (completion, editor, cursor) {
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            tagInfo = HTMLUtils.getTagInfo(editor, cursor),
            charCount = 0;

        if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
            charCount = tagInfo.tagName.length;
        }

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - tagInfo.position.offset;
        end.ch = start.ch + charCount;

        if (start.ch !== end.ch) {
            editor.document.replaceRange(completion, start, end);
        } else {
            editor.document.replaceRange(completion, start);
        }
    };

    /**
     * Check whether to show hints on a specific key.
     * @param {number} keyCode -- the key code for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    TagHints.prototype.shouldShowHintsOnKey = function (keyCode) {
        return keyCode === 188; // keyCode for "<"
    };

    /**
     * @constructor
     */
    function AttrHints() {
        this.globalAttributes = this.readGlobalAttrHints();
    }

    /**
     * @private
     * Parse the code hints from JSON data and extract all hints from property names.
     * @return {!Array.<string>} An array of code hints read from the JSON data source.
     */
    AttrHints.prototype.readGlobalAttrHints = function () {
        return $.map(attributes, function (value, key) {
            if (value.global === "true") {
                return key;
            }
        });
    };

    /**
     * Enters the code completion text into the editor
     * @param {string} completion - text to insert into current code editor
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     */
    AttrHints.prototype.handleSelect = function (completion, editor, cursor) {
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            tagInfo = HTMLUtils.getTagInfo(editor, cursor),
            charCount = 0,
            adjustCursor = false;

        if (tagInfo.position.tokenType === HTMLUtils.ATTR_NAME) {
            charCount = tagInfo.attr.name.length;
        } else if (tagInfo.position.tokenType === HTMLUtils.ATTR_VALUE) {
            charCount = tagInfo.attr.value.length;
        }

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - tagInfo.position.offset;
        end.ch = start.ch + charCount;

        // Append an equal sign and two double quotes if the current attr is not an empty attr
        // and then adjust cursor location before the last quote that we just inserted.
        if (attributes && attributes[completion] && attributes[completion].type !== "flag") {
            completion += "=\"\"";
            adjustCursor = true;
        }

        if (start.ch !== end.ch) {
            editor.document.replaceRange(completion, start, end);
        } else {
            editor.document.replaceRange(completion, start);
        }

        if (adjustCursor) {
            editor.setCursorPos(start.line, start.ch + completion.length - 1);
        }
    };

    /**
     * Figures out the text to use for the hint list query based on the text
     * around the cursor
     * Query is the text from the start of an attribute to the current cursor position
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     * @return {Object.<queryStr: string, ...} search query results will be filtered by.
     *      Return empty queryStr string to indicate code hinting should not filter and show all results.
     *      Return null in queryStr to indicate NO hints can be provided.
     */
    AttrHints.prototype.getQueryInfo = function (editor, cursor) {
        var tagInfo = HTMLUtils.getTagInfo(editor, cursor),
            query = {queryStr: null};

        if (tagInfo.position.tokenType === HTMLUtils.ATTR_NAME) {
            query.tag = tagInfo.tagName;
            if (tagInfo.position.offset >= 0) {
                query.queryStr = tagInfo.attr.name.slice(0, tagInfo.position.offset);
            }

            // TODO: Peter -- get existing attributes for the current tag and add them to query.usedAttr
        }

        return query;
    };

    /**
     * Create a complete list of attributes for the tag in the query. Then filter 
     * the list by attrName in the query and return the result.
     * @param {Object.<queryStr: string, ...} query -- a query object with a required property queryStr 
     *     that will be used to filter out code hints
     * @return {Array.<string>}
     */
    AttrHints.prototype.search = function (query) {
        var result = [];

        if (query.tag && query.queryStr !== null) {
            var tagName = query.tag,
                filter = query.queryStr,
                unfiltered = [];

            if (tags && tags[tagName]) {
                unfiltered = tags[tagName].attributes.concat(this.globalAttributes);

                // TODO: Peter -- exclude existing attributes from unfiltered array

            }

            if (unfiltered.length) {
                result = $.map(unfiltered, function (item) {
                    if (item.indexOf(filter) === 0) {
                        return item;
                    }
                }).sort();
            }
        }

        return result;
    };

    /**
     * Check whether to show hints on a specific key.
     * @param {number} keyCode -- the key code for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    AttrHints.prototype.shouldShowHintsOnKey = function (keyCode) {
        return keyCode === 32; // keyCode for space character
    };

    var tagHints = new TagHints();
    var attrHints = new AttrHints();
    CodeHintManager.registerHintProvider(tagHints);
    CodeHintManager.registerHintProvider(attrHints);
});