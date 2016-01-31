/*
 * Copyright (c) 2015 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    // Load dependencies.
    var TokenUtils  = require("utils/TokenUtils");

    // Enums of token types.
    var TOKEN_TAG    = 1,
        TOKEN_ATTR   = 2,
        TOKEN_VALUE  = 3;

    // Regex to find whitespace.
    var regexWhitespace = /^\s+$/;

    /**
     * Returns an object that represents all its params.
     *
     * @param {!Token} token CodeMirror token at the current pos
     * @param {number} tokenType Type of current token
     * @param {number} offset Offset in current token
     * @param {Array.<string>} exclusionList List of attributes of a tag or attribute options used by an attribute
     * @param {string} tagName Name of the current tag
     * @param {string} attrName Name of the curent attribute
     * @param {boolean} shouldReplace true if we don't want to append ="" to an attribute
     * @return {!{token: Token, tokenType: int, offset: int, exclusionList: Array.<string>, tagName: string, attrName: string, shouldReplace: boolean}}
     */
    function _createTagInfo(token, tokenType, offset, exclusionList, tagName, attrName, shouldReplace) {
        return {
            token: token || null,
            tokenType: tokenType || null,
            offset: offset || 0,
            exclusionList: exclusionList || [],
            tagName: tagName || "",
            attrName: attrName || "",
            shouldReplace: shouldReplace || false
        };
    }

    /**
     * Return the tagName and a list of attributes used by the tag.
     *
     * @param {!Editor} editor An instance of active editor
     * @param {!{line: number, ch: number}} constPos The position of cursor in the active editor
     * @return {!{tagName: string, exclusionList: Array.<string>, shouldReplace: boolean}}
     */
    function _getTagAttributes(editor, constPos) {
        var pos, ctx, ctxPrev, ctxNext, ctxTemp, tagName, exclusionList = [], shouldReplace;

        pos = $.extend({}, constPos);
        ctx = TokenUtils.getInitialContext(editor._codeMirror, pos);

        // Stop if the cursor is before = or an attribute value.
        ctxTemp = $.extend(true, {}, ctx);
        if (ctxTemp.token.type === null && regexWhitespace.test(ctxTemp.token.string)) {
            if (TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctxTemp)) {
                if ((ctxTemp.token.type === null && ctxTemp.token.string === "=") ||
                        ctxTemp.token.type === "string") {
                    return null;
                }
                TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctxTemp);
            }
        }

        // Incase an attribute is followed by an equal sign, shouldReplace will be used
        // to prevent from appending ="" again.
        if (ctxTemp.token.type === "attribute") {
            if (TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctxTemp)) {
                if (ctxTemp.token.type === null && ctxTemp.token.string === "=") {
                    shouldReplace = true;
                }
            }
        }

        // Look-Back and get the attributes and tag name.
        pos = $.extend({}, constPos);
        ctxPrev = TokenUtils.getInitialContext(editor._codeMirror, pos);
        while (TokenUtils.movePrevToken(ctxPrev)) {
            if (ctxPrev.token.type && ctxPrev.token.type.indexOf("tag bracket") >= 0) {
                // Disallow hints in closed tag and inside tag content
                if (ctxPrev.token.string === "</" || ctxPrev.token.string.indexOf(">") !== -1) {
                    return null;
                }
            }

            // Get attributes.
            if (ctxPrev.token.type === "attribute") {
                exclusionList.push(ctxPrev.token.string);
            }

            // Get tag.
            if (ctxPrev.token.type === "tag") {
                tagName = ctxPrev.token.string;
                if (TokenUtils.movePrevToken(ctxPrev)) {
                    if (ctxPrev.token.type === "tag bracket" && ctxPrev.token.string === "<") {
                        break;
                    }
                    return null;
                }
            }
        }

        // Look-Ahead and find rest of the attributes.
        pos = $.extend({}, constPos);
        ctxNext = TokenUtils.getInitialContext(editor._codeMirror, pos);
        while (TokenUtils.moveNextToken(ctxNext)) {
            if (ctxNext.token.type === "string" && ctxNext.token.string === "\"") {
                return null;
            }

            // Stop on closing bracket of its own tag or opening bracket of next tag.
            if (ctxNext.token.type === "tag bracket" &&
                    (ctxNext.token.string.indexOf(">") >= 0 || ctxNext.token.string === "<")) {
                break;
            }
            if (ctxNext.token.type === "attribute" && exclusionList.indexOf(ctxNext.token.string) === -1) {
                exclusionList.push(ctxNext.token.string);
            }
        }
        return {
            tagName: tagName,
            exclusionList: exclusionList,
            shouldReplace: shouldReplace
        };
    }

    /**
     * Return the tag name, attribute name and a list of options used by the attribute
     *
     * @param {!Editor} editor An instance of active editor
     * @param {!{line: number, ch: number}} pos Position of cursor in the editor
     * @return {!{tagName: string, attrName: string, exclusionList: Array.<string>}}
     */
    function _getTagAttributeValue(editor, pos) {
        var ctx, tagName, attrName, exclusionList = [], offset, textBefore, textAfter;

        ctx = TokenUtils.getInitialContext(editor._codeMirror, pos);
        offset = TokenUtils.offsetInToken(ctx);

        // To support multiple options on the same attribute, we have
        // to break the value, these values will not be available then.
        if (ctx.token.type === "string" && /\s+/.test(ctx.token.string)) {
            textBefore = ctx.token.string.substr(1, offset);
            textAfter = ctx.token.string.substr(offset);

            // Remove quote from end of the string.
            if (/^['"]$/.test(ctx.token.string.substr(-1, 1))) {
                textAfter = textAfter.substr(0, textAfter.length - 1);
            }

            // Split the text before and after the offset, skipping the current query.
            exclusionList = exclusionList.concat(textBefore.split(/\s+/).slice(0, -1));
            exclusionList = exclusionList.concat(textAfter.split(/\s+/));

            // Filter through the list removing empty strings.
            exclusionList = exclusionList.filter(function (value) {
                if (value.length > 0) {
                    return true;
                }
            });
        }

        // Look-back and find tag and attributes.
        while (TokenUtils.movePrevToken(ctx)) {
            if (ctx.token.type === "tag bracket") {
                // Disallow hints in closing tags.
                if (ctx.token.string === "</") {
                    return null;
                }
                // Stop when closing bracket of another tag or opening bracket of its own in encountered.
                if (ctx.token.string.indexOf(">") >= 0 || ctx.token.string === "<") {
                    break;
                }
            }

            // Get the first previous attribute.
            if (ctx.token.type === "attribute" && !attrName) {
                attrName = ctx.token.string;
            }

            // Stop if we get a bracket after tag.
            if (ctx.token.type === "tag") {
                tagName = ctx.token.string;
                if (TokenUtils.movePrevToken(ctx)) {
                    if (ctx.token.type === "tag bracket" && ctx.token.string === "<") {
                        break;
                    }
                    return null;
                }
            }
        }

        return {
            tagName: tagName,
            attrName: attrName,
            exclusionList: exclusionList
        };
    }

    /**
     * Return the tag info at a given position in the active editor
     *
     * @param {!Editor} editor Instance of active editor
     * @param {!{line: number, ch: number}} pos Position of cursor in the editor
     * @return {!{token: Object, tokenType: number, offset: number, exclusionList: Array.<string>, tagName: string, attrName: string, shouldReplace: boolean}}
     */
    function getTagInfo(editor, pos) {
        var ctx, offset, tagAttrs, tagAttrValue;

        ctx = TokenUtils.getInitialContext(editor._codeMirror, pos);
        offset = TokenUtils.offsetInToken(ctx);

        if (ctx.token && ctx.token.type === "tag bracket" && ctx.token.string === "<") {
            // Returns tagInfo when an angle bracket is created.
            return _createTagInfo(ctx.token, TOKEN_TAG);
        } else if (ctx.token && ctx.token.type === "tag") {
            // Return tagInfo when a tag is created.
            if (TokenUtils.movePrevToken(ctx)) {
                if (ctx.token.type === "tag bracket" && ctx.token.string === "<") {
                    TokenUtils.moveNextToken(ctx);
                    return _createTagInfo(ctx.token, TOKEN_TAG, offset);
                }
            }
        } else if (ctx.token && (ctx.token.type === "attribute" ||
                                 (ctx.token.type === null && regexWhitespace.test(ctx.token.string)))) {
            // Return tagInfo when an attribute is created.
            tagAttrs = _getTagAttributes(editor, pos);
            if (tagAttrs && tagAttrs.tagName) {
                return _createTagInfo(ctx.token, TOKEN_ATTR, offset, tagAttrs.exclusionList, tagAttrs.tagName, null, tagAttrs.shouldReplace);
            }
        } else if (ctx.token && ((ctx.token.type === null && ctx.token.string === "=") ||
                                 (ctx.token.type === "string" && /^['"]$/.test(ctx.token.string.charAt(0))))) {
            // Return tag info when an attribute value is created.
            // Allow no hints if the cursor is outside the value.
            if (ctx.token.type === "string" &&
                    /^['"]$/.test(ctx.token.string.substr(-1, 1)) &&
                    ctx.token.string.length !== 1 &&
                    ctx.token.end === pos.ch) {
                return _createTagInfo();
            }

            tagAttrValue = _getTagAttributeValue(editor, pos);
            if (tagAttrValue && tagAttrValue.tagName && tagAttrValue.attrName) {
                return _createTagInfo(ctx.token, TOKEN_VALUE, offset, tagAttrValue.exclusionList, tagAttrValue.tagName, tagAttrValue.attrName);
            }
        }
        return _createTagInfo();
    }

    /**
     * Return the query text of a value.
     *
     * @param {!{token: Object, tokenType: number, offset: number, exclusionList: Array.<string>, tagName: string, attrName: string, shouldReplace: boolean}}
     * @return {string}  The query to use to matching hints.
     */
    function getValueQuery(tagInfo) {
        var query;
        if (tagInfo.token.string === "=") {
            return "";
        }
        // Remove quotation marks in query.
        query = tagInfo.token.string.substr(1, tagInfo.offset - 1);

        // Get the last option to use as a query to support multiple options.
        return query.split(/\s+/).slice(-1)[0];
    }

    // Expose public API.
    exports.getTagInfo      = getTagInfo;
    exports.getValueQuery   = getValueQuery;
    exports.regexWhitespace = regexWhitespace;
    exports.TOKEN_TAG       = TOKEN_TAG;
    exports.TOKEN_ATTR      = TOKEN_ATTR;
    exports.TOKEN_VALUE     = TOKEN_VALUE;
});
