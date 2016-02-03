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

// A simple HTML tokenizer, originally adapted from https://github.com/fb55/htmlparser2
// (MIT-licensed), but with significant customizations for use in HTML live development.

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, continue: true */
/*global define */
/*unittests: HTML Tokenizer*/

define(function (require, exports, module) {

    "use strict";
    var i = 0,

        TEXT = i++,
        BEFORE_TAG_NAME = i++, //after <
        IN_TAG_NAME = i++,
        BEFORE_CLOSING_TAG_NAME = i++,
        IN_CLOSING_TAG_NAME = i++,
        AFTER_CLOSING_TAG_NAME = i++,
        AFTER_SELFCLOSE_SLASH = i++,

        //attributes
        BEFORE_ATTRIBUTE_NAME = i++,
        AFTER_QUOTED_ATTRIBUTE_VALUE = i++,
        IN_ATTRIBUTE_NAME = i++,
        AFTER_ATTRIBUTE_NAME = i++,
        BEFORE_ATTRIBUTE_VALUE = i++,
        IN_ATTRIBUTE_VALUE_DOUBLE_QUOTES = i++, // "
        IN_ATTRIBUTE_VALUE_SINGLE_QUOTES = i++, // '
        IN_ATTRIBUTE_VALUE_NO_QUOTES = i++,

        //declarations
        BEFORE_DECLARATION = i++, // !
        IN_DECLARATION = i++,

        //processing instructions
        IN_PROCESSING_INSTRUCTION = i++, // ?

        //comments
        BEFORE_COMMENT = i++,
        IN_COMMENT = i++,
        AFTER_COMMENT_1 = i++,
        AFTER_COMMENT_2 = i++,

        //cdata
        BEFORE_CDATA_1 = i++, // [
        BEFORE_CDATA_2 = i++, // C
        BEFORE_CDATA_3 = i++, // D
        BEFORE_CDATA_4 = i++, // A
        BEFORE_CDATA_5 = i++, // T
        BEFORE_CDATA_6 = i++, // A
        IN_CDATA = i++,// [
        AFTER_CDATA_1 = i++, // ]
        AFTER_CDATA_2 = i++, // ]

        //special tags
        BEFORE_SPECIAL = i++, //S
        BEFORE_SPECIAL_END = i++,   //S

        BEFORE_SCRIPT_1 = i++, //C
        BEFORE_SCRIPT_2 = i++, //R
        BEFORE_SCRIPT_3 = i++, //I
        BEFORE_SCRIPT_4 = i++, //P
        BEFORE_SCRIPT_5 = i++, //T
        AFTER_SCRIPT_1 = i++, //C
        AFTER_SCRIPT_2 = i++, //R
        AFTER_SCRIPT_3 = i++, //I
        AFTER_SCRIPT_4 = i++, //P
        AFTER_SCRIPT_5 = i++, //T

        BEFORE_STYLE_1 = i++, //T
        BEFORE_STYLE_2 = i++, //Y
        BEFORE_STYLE_3 = i++, //L
        BEFORE_STYLE_4 = i++, //E
        AFTER_STYLE_1 = i++, //T
        AFTER_STYLE_2 = i++, //Y
        AFTER_STYLE_3 = i++, //L
        AFTER_STYLE_4 = i++; //E

    /**
     * @private
     * @param {string} c the character to test
     * @return {boolean} true if c is whitespace
     */
    function isWhitespace(c) {
        return c === " " || c === "\t" || c === "\r" || c === "\n";
    }

    /**
     * @private
     * @param {string} c the character to test
     * @return {boolean} true if c is legal in an HTML tag name
     */
    function isLegalInTagName(c) {
        // We allow "-" in tag names since they're popular in Angular custom tag names
        // and will be legal in the web components spec.
        return (/[A-Za-z0-9\-]/).test(c);
    }

    /**
     * @private
     * @param {string} c the character to test
     * @return {boolean} true if c is legal in an HTML attribute name
     */
    function isLegalInAttributeName(c) {
        return c !== '"' && c !== "'" && c !== "<" && c !== "=";
    }

    /**
     * @private
     * @param {string} c the character to test
     * @return {boolean} true if c is legal in an unquoted attribute value
     */
    function isLegalInUnquotedAttributeValue(c) {
        return c !== "<" && c !== "=";
    }

    function _clonePos(pos, offset) {
        return pos ? { line: pos.line, ch: pos.ch + (offset || 0)} : null;
    }

    /**
     * A simple HTML tokenizer. See the description of nextToken() for usage details.
     * @constructor
     * @param {string} text The HTML document to tokenize.
     */
    function Tokenizer(text) {
        this._state = TEXT;
        this._buffer = text;
        this._sectionStart = 0;
        this._sectionStartPos = {line: 0, ch: 0};
        this._index = 0;
        this._indexPos = {line: 0, ch: 0};
        this._special = 0; // 1 for script, 2 for style
        this._token = null;
        this._nextToken = null;
    }

    /**
     * Returns the next token in the HTML document, or null if we're at the end of the document.
     * @return {?{type: string, contents: string, start: number, end: number}} token The next token, with the following fields:
     *    type: The type of token, one of:
     *          "error" - invalid syntax was found, tokenization aborted. Calling nextToken() again will produce undefined results.
     *          "text" - contents contains the text
     *          "opentagname" - an open tag was started; contents contains the tag name
     *          "attribname" - an attribute was encountered; contents contains the attribute name
     *          "attribvalue" - the value for the previous attribname was encountered; contents contains the (unquoted) value
     *              (Note that attributes like checked and disabled might not have values.)
     *          "opentagend" - the end of an open tag was encountered; contents is unspecified
     *          "selfclosingtag" - a "/>" was encountered indicating that a void element was self-closed; contents is unspecified
     *              (Note that this is optional in HTML; void elements like <img> will end with "opentagend", not "selfclosingtag")
     *          "closetag" - a close tag was encountered; contents contains the tag name
     *          "comment" - a comment was encountered; contents contains the body of the comment
     *          "cdata" - a CDATA block was encountered; contents contains the text inside the block
     *    contents: the contents of the token, as specified above. Note that "opentagend" and "selfclosingtag" really specify positions,
     *          not tokens, and so have no contents.
     *    start: the start index of the token contents within the text, or -1 for "opentagend" and "selfclosingtag"
     *    end: the end index of the token contents within the text, or the position of the boundary for "opentagend" and "selfclosingtag"
     */
    Tokenizer.prototype.nextToken = function () {
        this._token = null;

        if (this._nextToken) {
            var result = this._nextToken;
            this._nextToken = null;
            return result;
        }

        while (this._index < this._buffer.length && !this._token) {
            var c = this._buffer.charAt(this._index);
            if (this._state === TEXT) {
                if (c === "<") {
                    this._emitTokenIfNonempty("text");
                    this._state = BEFORE_TAG_NAME;
                    this._startSection();
                }
            } else if (this._state === BEFORE_TAG_NAME) {
                if (c === "/") {
                    this._state = BEFORE_CLOSING_TAG_NAME;
                } else if (c === ">" || this._special > 0) {
                    this._state = TEXT;
                } else {
                    if (c === "!") {
                        this._state = BEFORE_DECLARATION;
                        this._startSection(1);
                    } else if (c === "?") {
                        this._state = IN_PROCESSING_INSTRUCTION;
                        this._startSection(1);
                    } else if (c === "s" || c === "S") {
                        this._state = BEFORE_SPECIAL;
                        this._startSection();
                    } else if (!isLegalInTagName(c)) {
                        this._emitSpecialToken("error");
                        break;
                    } else if (!isWhitespace(c)) {
                        this._state = IN_TAG_NAME;
                        this._startSection();
                    }
                }
            } else if (this._state === IN_TAG_NAME) {
                if (c === "/") {
                    this._emitToken("opentagname");
                    this._emitSpecialToken("selfclosingtag", this._index + 2, _clonePos(this._indexPos, 2));
                    this._state = AFTER_SELFCLOSE_SLASH;
                } else if (c === ">") {
                    this._emitToken("opentagname");
                    this._emitSpecialToken("opentagend", this._index + 1, _clonePos(this._indexPos, 1));
                    this._state = TEXT;
                    this._startSection(1);
                } else if (isWhitespace(c)) {
                    this._emitToken("opentagname");
                    this._state = BEFORE_ATTRIBUTE_NAME;
                } else if (!isLegalInTagName(c)) {
                    this._emitSpecialToken("error");
                    break;
                }
            } else if (this._state === BEFORE_CLOSING_TAG_NAME) {
                if (c === ">") {
                    this._state = TEXT;
                } else if (this._special > 0) {
                    if (c === "s" || c === "S") {
                        this._state = BEFORE_SPECIAL_END;
                    } else {
                        this._state = TEXT;
                        continue;
                    }
                } else if (!isLegalInTagName(c)) {
                    this._emitSpecialToken("error");
                    break;
                } else if (!isWhitespace(c)) {
                    this._state = IN_CLOSING_TAG_NAME;
                    this._startSection();
                }
            } else if (this._state === IN_CLOSING_TAG_NAME) {
                if (c === ">") {
                    this._emitToken("closetag");
                    this._state = TEXT;
                    this._startSection(1);
                    this._special = 0;
                } else if (isWhitespace(c)) {
                    this._emitToken("closetag");
                    this._state = AFTER_CLOSING_TAG_NAME;
                    this._special = 0;
                } else if (!isLegalInTagName(c)) {
                    this._emitSpecialToken("error");
                    break;
                }
            } else if (this._state === AFTER_CLOSING_TAG_NAME) {
                if (c === ">") {
                    this._state = TEXT;
                    this._startSection(1);
                } else if (!isWhitespace(c)) {
                    // There must be only whitespace in the closing tag after the name until the ">".
                    this._emitSpecialToken("error");
                    break;
                }
            } else if (this._state === AFTER_SELFCLOSE_SLASH) {
                // Nothing (even whitespace) can come between the / and > of a self-close.
                if (c === ">") {
                    this._state = TEXT;
                    this._startSection(1);
                } else {
                    this._emitSpecialToken("error");
                    break;
                }

            /*
            *	attributes
            */
            } else if (this._state === BEFORE_ATTRIBUTE_NAME) {
                if (c === ">") {
                    this._state = TEXT;
                    this._emitSpecialToken("opentagend", this._index + 1, _clonePos(this._indexPos, 1));
                    this._startSection(1);
                } else if (c === "/") {
                    this._emitSpecialToken("selfclosingtag", this._index + 2, _clonePos(this._indexPos, 2));
                    this._state = AFTER_SELFCLOSE_SLASH;
                } else if (!isLegalInAttributeName(c)) {
                    this._emitSpecialToken("error");
                    break;
                } else if (!isWhitespace(c)) {
                    this._state = IN_ATTRIBUTE_NAME;
                    this._startSection();
                }
            } else if (this._state === IN_ATTRIBUTE_NAME) {
                if (c === "=") {
                    this._emitTokenIfNonempty("attribname");
                    this._state = BEFORE_ATTRIBUTE_VALUE;
                } else if (isWhitespace(c)) {
                    this._emitTokenIfNonempty("attribname");
                    this._state = AFTER_ATTRIBUTE_NAME;
                } else if (c === "/" || c === ">") {
                    this._emitTokenIfNonempty("attribname");
                    this._state = BEFORE_ATTRIBUTE_NAME;
                    continue;
                } else if (!isLegalInAttributeName(c)) {
                    this._emitSpecialToken("error");
                    break;
                }
            } else if (this._state === AFTER_ATTRIBUTE_NAME) {
                if (c === "=") {
                    this._state = BEFORE_ATTRIBUTE_VALUE;
                } else if (c === "/" || c === ">") {
                    this._state = BEFORE_ATTRIBUTE_NAME;
                    continue;
                } else if (!isLegalInAttributeName(c)) {
                    this._emitSpecialToken("error");
                    break;
                } else if (!isWhitespace(c)) {
                    this._state = IN_ATTRIBUTE_NAME;
                    this._startSection();
                }
            } else if (this._state === BEFORE_ATTRIBUTE_VALUE) {
                if (c === "\"") {
                    this._state = IN_ATTRIBUTE_VALUE_DOUBLE_QUOTES;
                    this._startSection(1);
                } else if (c === "'") {
                    this._state = IN_ATTRIBUTE_VALUE_SINGLE_QUOTES;
                    this._startSection(1);
                } else if (!isLegalInUnquotedAttributeValue(c)) {
                    this._emitSpecialToken("error");
                    break;
                } else if (!isWhitespace(c)) {
                    this._state = IN_ATTRIBUTE_VALUE_NO_QUOTES;
                    this._startSection();
                }
            } else if (this._state === IN_ATTRIBUTE_VALUE_DOUBLE_QUOTES) {
                if (c === "\"") {
                    this._emitToken("attribvalue");
                    this._state = AFTER_QUOTED_ATTRIBUTE_VALUE;
                }
            } else if (this._state === IN_ATTRIBUTE_VALUE_SINGLE_QUOTES) {
                if (c === "'") {
                    this._state = AFTER_QUOTED_ATTRIBUTE_VALUE;
                    this._emitToken("attribvalue");
                }
            } else if (this._state === IN_ATTRIBUTE_VALUE_NO_QUOTES) {
                if (c === ">") {
                    this._emitToken("attribvalue");
                    this._emitSpecialToken("opentagend", this._index + 1, _clonePos(this._indexPos, 1));
                    this._state = TEXT;
                    this._startSection(1);
                } else if (isWhitespace(c)) {
                    this._emitToken("attribvalue");
                    this._state = BEFORE_ATTRIBUTE_NAME;
                } else if (!isLegalInUnquotedAttributeValue(c)) {
                    this._emitSpecialToken("error");
                    break;
                }
            } else if (this._state === AFTER_QUOTED_ATTRIBUTE_VALUE) {
                // There must be at least one whitespace between the end of a quoted
                // attribute value and the next attribute, if any.
                if (c === ">") {
                    this._state = TEXT;
                    this._emitSpecialToken("opentagend", this._index + 1, _clonePos(this._indexPos, 1));
                    this._startSection(1);
                } else if (c === "/") {
                    this._emitSpecialToken("selfclosingtag", this._index + 2, _clonePos(this._indexPos, 2));
                    this._state = AFTER_SELFCLOSE_SLASH;
                } else if (isWhitespace(c)) {
                    this._state = BEFORE_ATTRIBUTE_NAME;
                } else {
                    this._emitSpecialToken("error");
                    break;
                }

            /*
            *	declarations
            */
            } else if (this._state === BEFORE_DECLARATION) {
                if (c === "[") {
                    this._state = BEFORE_CDATA_1;
                } else if (c === "-") {
                    this._state = BEFORE_COMMENT;
                } else {
                    this._state = IN_DECLARATION;
                }
            } else if (this._state === IN_DECLARATION) {
                if (c === ">") {
                    this._emitToken("declaration");
                    this._state = TEXT;
                    this._startSection(1);
                }


            /*
            *	processing instructions
            */
            } else if (this._state === IN_PROCESSING_INSTRUCTION) {
                if (c === ">") {
                    this._emitToken("processinginstruction");
                    this._state = TEXT;
                    this._startSection(1);
                }


            /*
            *	comments
            */
            } else if (this._state === BEFORE_COMMENT) {
                if (c === "-") {
                    this._state = IN_COMMENT;
                    this._startSection(1);
                } else {
                    this._state = IN_DECLARATION;
                }
            } else if (this._state === IN_COMMENT) {
                if (c === "-") {
                    this._state = AFTER_COMMENT_1;
                }
            } else if (this._state === AFTER_COMMENT_1) {
                if (c === "-") {
                    this._state = AFTER_COMMENT_2;
                } else {
                    this._state = IN_COMMENT;
                }
            } else if (this._state === AFTER_COMMENT_2) {
                if (c === ">") {
                    //remove 2 trailing chars
                    // It should be okay to just decrement the char position by 2 because we know neither of the previous
                    // characters is a newline.
                    this._emitToken("comment", this._index - 2, _clonePos(this._indexPos, -2));
                    this._state = TEXT;
                    this._startSection(1);
                } else if (c !== "-") {
                    this._state = IN_COMMENT;
                }
                // else: stay in AFTER_COMMENT_2 (`--->`)


            /*
            *	cdata
            */
            } else if (this._state === BEFORE_CDATA_1) {
                if (c === "C") {
                    this._state = BEFORE_CDATA_2;
                } else {
                    this._state = IN_DECLARATION;
                }
            } else if (this._state === BEFORE_CDATA_2) {
                if (c === "D") {
                    this._state = BEFORE_CDATA_3;
                } else {
                    this._state = IN_DECLARATION;
                }
            } else if (this._state === BEFORE_CDATA_3) {
                if (c === "A") {
                    this._state = BEFORE_CDATA_4;
                } else {
                    this._state = IN_DECLARATION;
                }
            } else if (this._state === BEFORE_CDATA_4) {
                if (c === "T") {
                    this._state = BEFORE_CDATA_5;
                } else {
                    this._state = IN_DECLARATION;
                }
            } else if (this._state === BEFORE_CDATA_5) {
                if (c === "A") {
                    this._state = BEFORE_CDATA_6;
                } else {
                    this._state = IN_DECLARATION;
                }
            } else if (this._state === BEFORE_CDATA_6) {
                if (c === "[") {
                    this._state = IN_CDATA;
                    this._startSection(1);
                } else {
                    this._state = IN_DECLARATION;
                }
            } else if (this._state === IN_CDATA) {
                if (c === "]") {
                    this._state = AFTER_CDATA_1;
                }
            } else if (this._state === AFTER_CDATA_1) {
                if (c === "]") {
                    this._state = AFTER_CDATA_2;
                } else {
                    this._state = IN_CDATA;
                }
            } else if (this._state === AFTER_CDATA_2) {
                if (c === ">") {
                    //remove 2 trailing chars
                    // It should be okay to just decrement the char position by 2 because we know neither of the previous
                    // characters is a newline.
                    this._emitToken("cdata", this._index - 2, _clonePos(this._indexPos, -2));
                    this._state = TEXT;
                    this._startSection(1);
                } else if (c !== "]") {
                    this._state = IN_CDATA;
                }
                //else: stay in AFTER_CDATA_2 (`]]]>`)


            /*
            * special tags
            */
            } else if (this._state === BEFORE_SPECIAL) {
                if (c === "c" || c === "C") {
                    this._state = BEFORE_SCRIPT_1;
                } else if (c === "t" || c === "T") {
                    this._state = BEFORE_STYLE_1;
                } else {
                    this._state = IN_TAG_NAME;
                    continue; //consume the token again
                }
            } else if (this._state === BEFORE_SPECIAL_END) {
                if (this._special === 1 && (c === "c" || c === "C")) {
                    this._state = AFTER_SCRIPT_1;
                } else if (this._special === 2 && (c === "t" || c === "T")) {
                    this._state = AFTER_STYLE_1;
                } else {
                    this._state = TEXT;
                }


            /*
            * script
            */
            } else if (this._state === BEFORE_SCRIPT_1) {
                if (c === "r" || c === "R") {
                    this._state = BEFORE_SCRIPT_2;
                } else {
                    this._state = IN_TAG_NAME;
                    continue; //consume the token again
                }
            } else if (this._state === BEFORE_SCRIPT_2) {
                if (c === "i" || c === "I") {
                    this._state = BEFORE_SCRIPT_3;
                } else {
                    this._state = IN_TAG_NAME;
                    continue; //consume the token again
                }
            } else if (this._state === BEFORE_SCRIPT_3) {
                if (c === "p" || c === "P") {
                    this._state = BEFORE_SCRIPT_4;
                } else {
                    this._state = IN_TAG_NAME;
                    continue; //consume the token again
                }
            } else if (this._state === BEFORE_SCRIPT_4) {
                if (c === "t" || c === "T") {
                    this._state = BEFORE_SCRIPT_5;
                } else {
                    this._state = IN_TAG_NAME;
                    continue; //consume the token again
                }
            } else if (this._state === BEFORE_SCRIPT_5) {
                if (c === "/" || c === ">" || isWhitespace(c)) {
                    this._special = 1;
                }
                this._state = IN_TAG_NAME;
                continue; //consume the token again
            } else if (this._state === AFTER_SCRIPT_1) {
                if (c === "r" || c === "R") {
                    this._state = AFTER_SCRIPT_2;
                } else {
                    this._state = TEXT;
                }
            } else if (this._state === AFTER_SCRIPT_2) {
                if (c === "i" || c === "I") {
                    this._state = AFTER_SCRIPT_3;
                } else {
                    this._state = TEXT;
                }
            } else if (this._state === AFTER_SCRIPT_3) {
                if (c === "p" || c === "P") {
                    this._state = AFTER_SCRIPT_4;
                } else {
                    this._state = TEXT;
                }
            } else if (this._state === AFTER_SCRIPT_4) {
                if (c === "t" || c === "T") {
                    this._state = AFTER_SCRIPT_5;
                } else {
                    this._state = TEXT;
                }
            } else if (this._state === AFTER_SCRIPT_5) {
                if (c === ">" || isWhitespace(c)) {
                    this._state = IN_CLOSING_TAG_NAME;
                    this._startSection(-6);
                    continue; //reconsume the token
                } else {
                    this._state = TEXT;
                }


            /*
            * style
            */
            } else if (this._state === BEFORE_STYLE_1) {
                if (c === "y" || c === "Y") {
                    this._state = BEFORE_STYLE_2;
                } else {
                    this._state = IN_TAG_NAME;
                    continue; //consume the token again
                }
            } else if (this._state === BEFORE_STYLE_2) {
                if (c === "l" || c === "L") {
                    this._state = BEFORE_STYLE_3;
                } else {
                    this._state = IN_TAG_NAME;
                    continue; //consume the token again
                }
            } else if (this._state === BEFORE_STYLE_3) {
                if (c === "e" || c === "E") {
                    this._state = BEFORE_STYLE_4;
                } else {
                    this._state = IN_TAG_NAME;
                    continue; //consume the token again
                }
            } else if (this._state === BEFORE_STYLE_4) {
                if (c === "/" || c === ">" || isWhitespace(c)) {
                    this._special = 2;
                }
                this._state = IN_TAG_NAME;
                continue; //consume the token again
            } else if (this._state === AFTER_STYLE_1) {
                if (c === "y" || c === "Y") {
                    this._state = AFTER_STYLE_2;
                } else {
                    this._state = TEXT;
                }
            } else if (this._state === AFTER_STYLE_2) {
                if (c === "l" || c === "L") {
                    this._state = AFTER_STYLE_3;
                } else {
                    this._state = TEXT;
                }
            } else if (this._state === AFTER_STYLE_3) {
                if (c === "e" || c === "E") {
                    this._state = AFTER_STYLE_4;
                } else {
                    this._state = TEXT;
                }
            } else if (this._state === AFTER_STYLE_4) {
                if (c === ">" || isWhitespace(c)) {
                    this._state = IN_CLOSING_TAG_NAME;
                    this._startSection(-5);
                    continue; //reconsume the token
                } else {
                    this._state = TEXT;
                }
            } else {
                console.error("HTMLTokenizer: Encountered unknown state");
                this._emitSpecialToken("error");
                break;
            }

            if (c === "\n") {
                this._indexPos.line++;
                this._indexPos.ch = 0;
            } else {
                this._indexPos.ch++;
            }
            this._index++;
        }

        if (this._index === this._buffer.length && this._state !== TEXT) {
            // We hit EOF in the middle of processing something else.
            this._emitSpecialToken("error");
        }
        return this._token;
    };

    Tokenizer.prototype._startSection = function (offset) {
        offset = offset || 0;
        this._sectionStart = this._index + offset;

        // Normally it wouldn't be safe to assume that we can just add the offset to the
        // character position, because there might be a newline, which would require us to
        // move to the next line. However, in all the cases where this is called, we are
        // adjusting for characters that we know are not newlines.
        this._sectionStartPos = _clonePos(this._indexPos, offset);
    };

    /**
     * @private
     * Extract the portion of the buffer since _sectionStart and set it to be the next token we return
     * from `nextToken()`. If there's already a _token, we stuff it in _nextToken instead.
     * @param {string} type The token's type (see documentation for `nextToken()`)
     * @param {number} index If specified, the index to use as the end of the token; uses this._index if not specified
     */
    Tokenizer.prototype._setToken = function (type, index, indexPos) {
        if (index === undefined) {
            index = this._index;
        }
        if (indexPos === undefined) {
            indexPos = this._indexPos;
        }
        var token = {
            type: type,
            contents: this._sectionStart === -1 ? "" : this._buffer.substring(this._sectionStart, index),
            start: this._sectionStart,
            end: index,
            startPos: _clonePos(this._sectionStartPos),
            endPos: _clonePos(indexPos)
        };
        if (this._token) {
            // Queue this token to be emitted next. In theory it would be more general to have
            // an arbitrary-length queue, but currently we only ever emit at most two tokens in a
            // single pass through the tokenization loop.
            if (this._nextToken) {
                console.error("HTMLTokenizer: Tried to emit more than two tokens in a single call");
            }
            this._nextToken = token;
        } else {
            this._token = token;
        }
    };

    /**
     * @private
     * Sets the token to be returned from `nextToken()` and resets the section start to an invalid value.
     * this._sectionStart should be set to a valid value before the next call to one of the `_emit` methods.
     * @param {string} type The token's type (see documentation for `nextToken()`)
     * @param {number} index If specified, the index to use as the end of the token; uses this._index if not specified
     */
    Tokenizer.prototype._emitToken = function (type, index, indexPos) {
        this._setToken(type, index, indexPos);
        this._sectionStart = -1;
        this._sectionStartPos = null;
    };

    /**
     * @private
     * Like `_emitToken()`, but used for special tokens that don't have real content (like opentagend and selfclosingtag).
     * @param {string} type The token's type (see documentation for `nextToken()`)
     * @param {number} index If specified, the index to use as the end of the token; uses this._index if not specified
     */
    Tokenizer.prototype._emitSpecialToken = function (type, index, indexPos) {
        // Force the section start to be -1, since these tokens don't have meaningful content--they're
        // just marking particular boundaries we care about (end of an open tag or a self-closing tag).
        this._sectionStart = -1;
        this._sectionStartPos = null;
        this._emitToken(type, index, indexPos);
    };

    /**
     * @private
     * Like `_emitToken()`, but only emits a token if there is actually content in it. Note that this still
     * resets this._sectionStart to an invalid value even if there is no content, so a new section must be
     * started before the next `_emit`.
     * @param {string} type The token's type (see documentation for `nextToken()`)
     */
    Tokenizer.prototype._emitTokenIfNonempty = function (type) {
        if (this._index > this._sectionStart) {
            this._setToken(type);
        }
        this._sectionStart = -1;
        this._sectionStartPos = null;
    };

    exports.Tokenizer = Tokenizer;
});
