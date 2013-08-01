/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

// Tokenizer adapted from https://github.com/fb55/htmlparser2
// (MIT-licensed)

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, continue: true */
/*global define, $, CodeMirror */
/*unittests: HTML Tokenizer*/

// TODO: add comments/jsdoc

define(function (require, exports, module) {
    
    "use strict";
    var i = 0,
    
        TEXT = i++,
        BEFORE_TAG_NAME = i++, //after <
        IN_TAG_NAME = i++,
        BEFORE_CLOSING_TAG_NAME = i++,
        IN_CLOSING_TAG_NAME = i++,
        AFTER_CLOSING_TAG_NAME = i++,
    
        //attributes
        BEFORE_ATTRIBUTE_NAME = i++,
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

    function whitespace(c) {
        return c === " " || c === "\t" || c === "\r" || c === "\n";
    }
    
    function Tokenizer(text, options) {
        this._state = TEXT;
        this._buffer = text;
        this._sectionStart = 0;
        this._index = 0;
        this._options = options || {};
        this._special = 0; // 1 for script, 2 for style
        this._token = null;
        this._nextToken = null;
    }
    
    //TODO make events conditional
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
                    this._sectionStart = this._index;
                }
            } else if (this._state === BEFORE_TAG_NAME) {
                if (c === "/") {
                    this._state = BEFORE_CLOSING_TAG_NAME;
                } else if (c === ">" || this._special > 0) {
                    this._state = TEXT;
                } else {
                    if (whitespace(c)) {
                    } else if (c === "!") {
                        this._state = BEFORE_DECLARATION;
                        this._sectionStart = this._index + 1;
                    } else if (c === "?") {
                        this._state = IN_PROCESSING_INSTRUCTION;
                        this._sectionStart = this._index + 1;
                    } else if (!(this._options && this._options.xmlMode) && (c === "s" || c === "S")) {
                        this._state = BEFORE_SPECIAL;
                        this._sectionStart = this._index;
                    } else {
                        this._state = IN_TAG_NAME;
                        this._sectionStart = this._index;
                    }
                }
            } else if (this._state === IN_TAG_NAME) {
                if (c === "/") {
                    this._emitToken("opentagname");
                    // Bit of a hack: assume that this will be followed by the ">".
                    this._emitSpecialToken("selfclosingtag", this._index + 2);
                    this._state = AFTER_CLOSING_TAG_NAME;
                } else if (c === ">") {
                    this._emitToken("opentagname");
                    this._emitSpecialToken("opentagend", this._index + 1);
                    this._state = TEXT;
                    this._sectionStart = this._index + 1;
                } else if (whitespace(c)) {
                    this._emitToken("opentagname");
                    this._state = BEFORE_ATTRIBUTE_NAME;
                }
            } else if (this._state === BEFORE_CLOSING_TAG_NAME) {
                if (whitespace(c)) {
                } else if (c === ">") {
                    this._state = TEXT;
                } else if (this._special > 0) {
                    if (c === "s" || c === "S") {
                        this._state = BEFORE_SPECIAL_END;
                    } else {
                        this._state = TEXT;
                        continue;
                    }
                } else {
                    this._state = IN_CLOSING_TAG_NAME;
                    this._sectionStart = this._index;
                }
            } else if (this._state === IN_CLOSING_TAG_NAME) {
                if (c === ">") {
                    this._emitToken("closetag");
                    this._state = TEXT;
                    this._sectionStart = this._index + 1;
                    this._special = 0;
                } else if (whitespace(c)) {
                    this._emitToken("closetag");
                    this._state = AFTER_CLOSING_TAG_NAME;
                    this._special = 0;
                }
            } else if (this._state === AFTER_CLOSING_TAG_NAME) {
                //skip everything until ">"
                if (c === ">") {
                    this._state = TEXT;
                    this._sectionStart = this._index + 1;
                }
    
            /*
            *	attributes
            */
            } else if (this._state === BEFORE_ATTRIBUTE_NAME) {
                if (c === ">") {
                    this._state = TEXT;
                    this._emitSpecialToken("opentagend", this._index + 1);
                    this._sectionStart = this._index + 1;
                } else if (c === "/") {
                    // Bit of a hack: assume that this will be followed by the ">".
                    this._emitSpecialToken("selfclosingtag", this._index + 2);
                    this._state = AFTER_CLOSING_TAG_NAME;
                } else if (!whitespace(c)) {
                    this._state = IN_ATTRIBUTE_NAME;
                    this._sectionStart = this._index;
                }
            } else if (this._state === IN_ATTRIBUTE_NAME) {
                if (c === "=") {
                    this._emitTokenIfNonempty("attribname");
                    this._state = BEFORE_ATTRIBUTE_VALUE;
                } else if (whitespace(c)) {
                    this._emitTokenIfNonempty("attribname");
                    this._state = AFTER_ATTRIBUTE_NAME;
                } else if (c === "/" || c === ">") {
                    this._emitTokenIfNonempty("attribname");
                    this._state = BEFORE_ATTRIBUTE_NAME;
                    continue;
                }
            } else if (this._state === AFTER_ATTRIBUTE_NAME) {
                if (c === "=") {
                    this._state = BEFORE_ATTRIBUTE_VALUE;
                } else if (c === "/" || c === ">") {
                    this._state = BEFORE_ATTRIBUTE_NAME;
                    continue;
                } else if (!whitespace(c)) {
                    this._state = IN_ATTRIBUTE_NAME;
                    this._sectionStart = this._index;
                }
            } else if (this._state === BEFORE_ATTRIBUTE_VALUE) {
                if (c === "\"") {
                    this._state = IN_ATTRIBUTE_VALUE_DOUBLE_QUOTES;
                    this._sectionStart = this._index + 1;
                } else if (c === "'") {
                    this._state = IN_ATTRIBUTE_VALUE_SINGLE_QUOTES;
                    this._sectionStart = this._index + 1;
                } else if (!whitespace(c)) {
                    this._state = IN_ATTRIBUTE_VALUE_NO_QUOTES;
                    this._sectionStart = this._index;
                }
            } else if (this._state === IN_ATTRIBUTE_VALUE_DOUBLE_QUOTES) {
                if (c === "\"") {
                    this._emitToken("attribvalue");
                    this._state = BEFORE_ATTRIBUTE_NAME;
                }
            } else if (this._state === IN_ATTRIBUTE_VALUE_SINGLE_QUOTES) {
                if (c === "'") {
                    this._state = BEFORE_ATTRIBUTE_NAME;
                    this._emitToken("attribvalue");
                }
            } else if (this._state === IN_ATTRIBUTE_VALUE_NO_QUOTES) {
                if (c === ">") {
                    this._emitToken("attribvalue");
                    this._emitSpecialToken("opentagend", this._index + 1);
                    this._state = TEXT;
                    this._sectionStart = this._index + 1;
                } else if (whitespace(c)) {
                    this._emitToken("attribvalue");
                    this._state = BEFORE_ATTRIBUTE_NAME;
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
                    this._sectionStart = this._index + 1;
                }
            
    
            /*
            *	processing instructions
            */
            } else if (this._state === IN_PROCESSING_INSTRUCTION) {
                if (c === ">") {
                    this._emitToken("processinginstruction");
                    this._state = TEXT;
                    this._sectionStart = this._index + 1;
                }
            
    
            /*
            *	comments
            */
            } else if (this._state === BEFORE_COMMENT) {
                if (c === "-") {
                    this._state = IN_COMMENT;
                    this._sectionStart = this._index + 1;
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
                    this._emitToken("comment");
                    this._state = TEXT;
                    this._sectionStart = this._index + 1;
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
                    this._sectionStart = this._index + 1;
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
                    this._emitToken("cdata");
                    this._state = TEXT;
                    this._sectionStart = this._index + 1;
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
                if (c === "/" || c === ">" || whitespace(c)) {
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
                if (c === ">" || whitespace(c)) {
                    this._state = IN_CLOSING_TAG_NAME;
                    this._sectionStart = this._index - 6;
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
                if (c === "/" || c === ">" || whitespace(c)) {
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
                if (c === ">" || whitespace(c)) {
                    this._state = IN_CLOSING_TAG_NAME;
                    this._sectionStart = this._index - 5;
                    continue; //reconsume the token
                } else {
                    this._state = TEXT;
                }
            } else {
                console.error("HTMLTokenizer: Encountered unknown state");
                return null;
            }
    
            this._index++;
        }
        return this._token;
    };
    
    Tokenizer.prototype.reset = function () {
        Tokenizer.call(this, this._options);
    };
    
    Tokenizer.prototype._setToken = function (name, index) {
        if (index === undefined) {
            index = this._index;
        }
        var token = {
            type: name,
            contents: this._sectionStart === -1 ? "" : this._buffer.substring(this._sectionStart, this._index),
            start: this._sectionStart,
            end: index
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

    Tokenizer.prototype._emitToken = function (name, index) {
        this._setToken(name, index);
        this._sectionStart = -1;
    };
    
    Tokenizer.prototype._emitSpecialToken = function (name, index) {
        // Force the section start to be -1, since these tokens don't have meaningful content--they're
        // just marking particular boundaries we care about (end of an open tag or a self-closing tag).
        this._sectionStart = -1;
        this._emitToken(name, index);
    };
    
    Tokenizer.prototype._emitTokenIfNonempty = function (name) {
        if (this._index > this._sectionStart) {
            this._setToken(name);
        }
        this._sectionStart = -1;
    };
    
    exports.Tokenizer = Tokenizer;
});