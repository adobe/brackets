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

        if (completion !== tagInfo.tagName) {
            if (start.ch !== end.ch) {
                editor.document.replaceRange(completion, start, end);
            } else {
                editor.document.replaceRange(completion, start);
            }
        }
    };

    /**
     * Check whether to show hints on a specific key.
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    TagHints.prototype.shouldShowHintsOnKey = function (key) {
        return key === "<";
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
            tokenType = tagInfo.position.tokenType,
            charCount = 0,
            insertedName = false,
            replaceExistingOne = tagInfo.attr.valueAssigned,
            endQuote = "",
            shouldReplace = true;

        if (tokenType === HTMLUtils.ATTR_NAME) {
            charCount = tagInfo.attr.name.length;
            // Append an equal sign and two double quotes if the current attr is not an empty attr
            // and then adjust cursor location before the last quote that we just inserted.
            if (!replaceExistingOne && attributes && attributes[completion] &&
                    attributes[completion].type !== "flag") {
                completion += "=\"\"";
                insertedName = true;
            } else if (completion === tagInfo.attr.name) {
                shouldReplace = false;
            }
        } else if (tokenType === HTMLUtils.ATTR_VALUE) {
            charCount = tagInfo.attr.value.length;
            if (!tagInfo.attr.hasEndQuote) {
                endQuote = tagInfo.attr.quoteChar;
                if (endQuote) {
                    completion += endQuote;
                } else if (tagInfo.position.offset === 0) {
                    completion = "\"" + completion + "\"";
                }
            } else if (completion === tagInfo.attr.value) {
                shouldReplace = false;
            }
        }

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - tagInfo.position.offset;
        end.ch = start.ch + charCount;

        if (shouldReplace) {
            if (start.ch !== end.ch) {
                editor.document.replaceRange(completion, start, end);
            } else {
                editor.document.replaceRange(completion, start);
            }
        }

        if (insertedName) {
            editor.setCursorPos(start.line, start.ch + completion.length - 1);
            
            // Since we're now inside the double-quotes we just inserted,
            // mmediately pop up the attribute value hint.
            CodeHintManager.showHint(editor);
        } else if (tokenType === HTMLUtils.ATTR_VALUE && tagInfo.attr.hasEndQuote) {
            // Move the cursor to the right of the existing end quote after value insertion.
            editor.setCursorPos(start.line, start.ch + completion.length + 1);
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
            query = {queryStr: null},
            tokenType = tagInfo.position.tokenType;
 
        if (tokenType === HTMLUtils.ATTR_NAME || tokenType === HTMLUtils.ATTR_VALUE) {
            query.tag = tagInfo.tagName;
            
            if (tagInfo.position.offset >= 0) {
                if (tokenType === HTMLUtils.ATTR_NAME) {
                    query.queryStr = tagInfo.attr.name.slice(0, tagInfo.position.offset);
                } else {
                    query.queryStr = tagInfo.attr.value.slice(0, tagInfo.position.offset);
                    query.attrName = tagInfo.attr.name;
                }
            } else if (tokenType === HTMLUtils.ATTR_VALUE) {
                // We get negative offset for a quoted attribute value with some leading whitespaces 
                // as in <a rel= "rtl" where the cursor is just to the right of the "=".
                // So just set the queryStr to an empty string. 
                query.queryStr = "";
                query.attrName = tagInfo.attr.name;
            }

            // TODO: get existing attributes for the current tag and add them to query.usedAttr
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
                attrName = query.attrName,
                filter = query.queryStr,
                unfiltered = [];

            if (attrName) {
                // We look up attribute values with tagName plus a slash and attrName first.  
                // If the lookup fails, then we fall back to look up with attrName only. Most 
                // of the attributes in JSON are using attribute name only as their properties, 
                // but in some cases like "type" attribute, we have different properties like 
                // "script/type", "link/type" and "button/type".
                var tagPlusAttr = tagName + "/" + attrName,
                    attrInfo = attributes[tagPlusAttr] || attributes[attrName];
                
                if (attrInfo) {
                    if (attrInfo.type === "boolean") {
                        unfiltered = ["false", "true"];
                    } else if (attrInfo.attribOption) {
                        unfiltered = attrInfo.attribOption;
                    }
                }
            } else if (tags && tags[tagName] && tags[tagName].attributes) {
                unfiltered = tags[tagName].attributes.concat(this.globalAttributes);

                // TODO: exclude existing attributes from unfiltered array
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
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    AttrHints.prototype.shouldShowHintsOnKey = function (key) {
        return (key === " " || key === "'" || key === "\"" || key === "=");
    };

    var tagHints = new TagHints();
    var attrHints = new AttrHints();
    CodeHintManager.registerHintProvider(tagHints);
    CodeHintManager.registerHintProvider(attrHints);
    
    // For unit testing
    exports.tagHintProvider = tagHints;
    exports.attrHintProvider = attrHints;
});