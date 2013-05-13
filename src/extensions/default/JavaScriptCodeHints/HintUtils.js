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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var LANGUAGE_ID                 = "javascript",
        SINGLE_QUOTE                = "'",
        DOUBLE_QUOTE                = "\"",
        TERN_INIT_MSG               = "Init",
        TERN_JUMPTODEF_MSG          = "JumptoDef",
        TERN_COMPLETIONS_MSG        = "Completions",
        TERN_GET_FILE_MSG           = "GetFile",
        TERN_GET_PROPERTIES_MSG     = "Properties",
        TERN_CALLED_FUNC_TYPE_MSG   = "FunctionType";

    /**
     * Create a hint token with name value that occurs at the given list of
     * positions.
     * 
     * @param {string} value - name of the new hint token
     * @param {?Array.<number>=} positions - optional list of positions at which
     *      the token occurs
     * @return {Object} - a new hint token
     */
    function makeToken(value, positions) {
        positions = positions || [];

        return {
            value: value,
            positions: positions
        };
    }

    /**
     * Is the string key perhaps a valid JavaScript identifier?
     * 
     * @param {string} key - the string to test
     * @return {boolean} - could key be a valid identifier?
     */
    function maybeIdentifier(key) {
        return (/[0-9a-z_\$]/i).test(key);
    }

    /**
     * Is the token's class hintable? (A very conservative test.) 
     * 
     * @param {Object} token - the token to test for hintability
     * @return {boolean} - could the token be hintable?
     */
    function hintable(token) {
        switch (token.type) {
        case "comment":
        case "number":
        case "regexp":
        // exclude variable & param decls
        case "def":
            return false;
        default:
            return true;
        }
    }

    /**
     *  Determine if hints should be displayed for the given key.
     *
     * @param {string} key - key entered by the user
     * @return {boolean} true if the hints should be shown for the key,
     * false otherwise.
     */
    function hintableKey(key) {
        return (key === null || key === "." || maybeIdentifier(key));
    }

    /**
     * Divide a path into directory and filename parts
     * 
     * @param {string} path - a URI with directories separated by /
     * @return {{dir: string, file: string}} - a pair of strings that
     *      correspond to the directory and filename of the given path.
     */
    function splitPath(path) {
        var index   = path.lastIndexOf("/"),
            dir     = (index === -1) ? "" : path.substring(0, index),
            file    = path.substring(index + 1, path.length);
        
        return {dir: dir, file: file };
    }
    
    /*
     * Get a JS-hints-specific event name. Used to prevent event namespace
     * pollution.
     * 
     * @param {string} name - the unqualified event name
     * @return {string} - the qualified event name
     */
    function eventName(name) {
        var EVENT_TAG = "brackets-js-hints";
        return name + "." + EVENT_TAG;
    }

    /*
     * Annotate a list of tokens as literals of a particular kind;
     * if string literals, annotate with an appropriate delimiter.
     *
     * @param {Array.<Object>} literals - list of hint tokens
     * @param {string} kind - the kind of literals in the list (e.g., "string")
     * @return {Array.<Object>} - the input array; to each object in the array a
     *      new literal {boolean} property has been added to indicate that it
     *      is a literal hint, and also a new kind {string} property to indicate
     *      the literal kind. For string literals, a delimiter property is also
     *      added to indicate what the default delimiter should be (viz. a
     *      single or double quotation mark).
     */
    function annotateLiterals(literals, kind) {
        return literals.map(function (t) {
            t.literal = true;
            t.kind = kind;
            t.origin = "ecma5";
            if (kind === "string") {
                if (/[\\\\]*[^\\]"/.test(t.value)) {
                    t.delimiter = SINGLE_QUOTE;
                } else {
                    t.delimiter = DOUBLE_QUOTE;
                }
            }
            return t;
        });
    }

    /*
     * Annotate a list of tokens as keywords
     * 
     * @param {Array.<Object>} keyword - list of keyword tokens
     * @return {Array.<Object>} - the input array; to each object in the array a
     *      new keyword {boolean} property has been added to indicate that the
     *      hint is a keyword.
     */
    function annotateKeywords(keywords) {
        return keywords.map(function (t) {
            t.keyword = true;
            t.origin = "ecma5";
            return t;
        });
    }

    var KEYWORD_NAMES   = [
        "break", "case", "catch", "continue", "debugger", "default", "delete",
        "do", "else", "finally", "for", "function", "if", "in", "instanceof",
        "new", "return", "switch", "this", "throw", "try", "typeof", "var",
        "void", "while", "with"
    ],
        KEYWORD_TOKENS  = KEYWORD_NAMES.map(function (t) {
            return makeToken(t, []);
        }),
        KEYWORDS        = annotateKeywords(KEYWORD_TOKENS);
    
    var LITERAL_NAMES   = [
        "true", "false", "null"
    ],
        LITERAL_TOKENS  = LITERAL_NAMES.map(function (t) {
            return makeToken(t, []);
        }),
        LITERALS        = annotateLiterals(LITERAL_TOKENS);

    exports.makeToken               = makeToken;
    exports.hintable                = hintable;
    exports.hintableKey             = hintableKey;
    exports.maybeIdentifier         = maybeIdentifier;
    exports.splitPath               = splitPath;
    exports.eventName               = eventName;
    exports.annotateLiterals        = annotateLiterals;
    exports.KEYWORDS                = KEYWORDS;
    exports.LITERALS                = LITERALS;
    exports.LANGUAGE_ID             = LANGUAGE_ID;
    exports.SINGLE_QUOTE            = SINGLE_QUOTE;
    exports.DOUBLE_QUOTE            = DOUBLE_QUOTE;
    exports.TERN_JUMPTODEF_MSG      = TERN_JUMPTODEF_MSG;
    exports.TERN_COMPLETIONS_MSG    = TERN_COMPLETIONS_MSG;
    exports.TERN_INIT_MSG           = TERN_INIT_MSG;
    exports.TERN_GET_FILE_MSG       = TERN_GET_FILE_MSG;
    exports.TERN_GET_PROPERTIES_MSG = TERN_GET_PROPERTIES_MSG;
    exports.TERN_CALLED_FUNC_TYPE_MSG   = TERN_CALLED_FUNC_TYPE_MSG;
});
