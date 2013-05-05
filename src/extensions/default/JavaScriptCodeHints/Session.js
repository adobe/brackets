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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var StringMatch     = brackets.getModule("utils/StringMatch"),
        HintUtils       = require("HintUtils"),
        ScopeManager    = require("ScopeManager");

    /**
     * Session objects encapsulate state associated with a hinting session
     * and provide methods for updating and querying the session.
     *
     * @constructor
     * @param {Editor} editor - the editor context for the session
     */
    function Session(editor) {
        this.editor = editor;
        this.path = editor.document.file.fullPath;
        this.ternHints = [];
        this.ternProperties = [];
        this.fnType = null;
        this.builtins = ScopeManager.getBuiltins();
        this.builtins.push("requirejs.js");     // consider these globals as well.
    }

    /**
     * Get the name of the file associated with the current session
     * 
     * @return {string} - the full pathname of the file associated with the
     *      current session
     */
    Session.prototype.getPath = function () {
        return this.path;
    };

    /**
     * Get the current cursor position.
     *
     * @return {{line: number, ch: number}} - the current cursor position
     */
    Session.prototype.getCursor = function () {
        return this.editor.getCursorPos();
    };

    /**
     * Get the text of a line.
     *
     * @param {number} line - the line number     
     * @return {string} - the text of the line
     */
    Session.prototype.getLine = function (line) {
        var doc = this.editor.document;
        return doc.getLine(line);
    };
    
    /**
     * Get the offset of the current cursor position
     *
     * @return {number} - the offset into the current document of the current
     *      cursor
     */
    Session.prototype.getOffset = function () {
        var cursor = this.getCursor();
        
        return this.editor.indexFromPos(cursor);
    };

    /**
     * Get the token at the given cursor position, or at the current cursor
     * if none is given.
     * 
     * @param {?{line: number, ch: number}} cursor - the cursor position
     *      at which to retrieve a token
     * @return {Object} - the CodeMirror token at the given cursor position
     */
    Session.prototype.getToken = function (cursor) {
        var cm = this.editor._codeMirror;

        if (cursor) {
            return cm.getTokenAt(cursor);
        } else {
            return cm.getTokenAt(this.getCursor());
        }
    };

    /**
     * Get the token after the one at the given cursor position
     *
     * @param {{line: number, ch: number}} cursor - cursor position before
     *      which a token should be retrieved
     * @return {Object} - the CodeMirror token after the one at the given
     *      cursor position
     */
    Session.prototype.getNextTokenOnLine = function (cursor) {
        cursor = this.getNextCursorOnLine(cursor);
        if (cursor) {
            return this.getToken(cursor);
        }

        return null;
    };

    /**
     * Get the next cursor position on the line, or null if there isn't one.
     * 
     * @return {?{line: number, ch: number}} - the cursor position
     *      immediately following the current cursor position, or null if
     *      none exists.
     */
    Session.prototype.getNextCursorOnLine = function (cursor) {
        var doc     = this.editor.document,
            line    = doc.getLine(cursor.line);

        if (cursor.ch < line.length) {
            return {
                ch  : cursor.ch + 1,
                line: cursor.line
            };
        } else {
            return null;
        }
    };
    
    /**
     * Get the token before the one at the given cursor position
     * 
     * @param {{line: number, ch: number}} cursor - cursor position after
     *      which a token should be retrieved
     * @return {Object} - the CodeMirror token before the one at the given
     *      cursor position
     */
    Session.prototype._getPreviousToken = function (cursor) {
        var token   = this.getToken(cursor),
            prev    = token,
            doc     = this.editor.document;

        do {
            if (prev.start < cursor.ch) {
                cursor.ch = prev.start;
            } else if (prev.start > 0) {
                cursor.ch = prev.start - 1;
            } else if (cursor.line > 0) {
                cursor.ch = doc.getLine(cursor.line - 1).length;
                cursor.line--;
            } else {
                break;
            }
            prev = this.getToken(cursor);
        } while (prev.string.trim() === "");
        
        return prev;
    };
    
    /**
     * Calculate a query string relative to the current cursor position
     * and token. E.g., from a state "identi<cursor>er", the query string is
     * "identi".
     * 
     * @return {string} - the query string for the current cursor position
     */
    Session.prototype.getQuery = function () {
        var cursor  = this.getCursor(),
            token   = this.getToken(cursor),
            query   = "";
        
        if (token) {
            // If the token string is not an identifier, then the query string
            // is empty.
            if (HintUtils.maybeIdentifier(token.string)) {
                query = token.string.substring(0, token.string.length - (token.end - cursor.ch));
                query = query.trim();
            }
        }
        return query;
    };

    /**
     * Find the context of a property lookup. For example, for a lookup 
     * foo(bar, baz(quux)).prop, foo is the context.
     * 
     * @param {{line: number, ch: number}} cursor - the cursor position
     *      at which context information is to be retrieved
     * @param {number} depth - the current depth of the parenthesis stack, or
     *      undefined if the depth is 0.
     * @return {string} - the context for the property that was looked up
     */
    Session.prototype.getContext = function (cursor, depth) {
        var token = this.getToken(cursor);

        if (depth === undefined) {
            depth = 0;
        }

        if (token.string === ")") {
            this._getPreviousToken(cursor);
            return this.getContext(cursor, ++depth);
        } else if (token.string === "(") {
            this._getPreviousToken(cursor);
            return this.getContext(cursor, --depth);
        } else {
            if (depth > 0 || token.string === ".") {
                this._getPreviousToken(cursor);
                return this.getContext(cursor, depth);
            } else {
                return token.string;
            }
        }
    };

    /**
     * @return {{line:number, ch:number}} - the line, col info for where the previous "."
     *      in a property lookup occurred, or undefined if no previous "." was found.
     */
    Session.prototype.findPreviousDot = function () {
        var cursor = this.getCursor(),
            token = this.getToken(cursor);
        
        // If the cursor is right after the dot, then the current token will be "."
        if (token && token.string === ".") {
            return cursor;
        } else {
            // If something has been typed like 'foo.b' then we have to look back 2 tokens
            // to get past the 'b' token
            token = this._getPreviousToken(cursor);
            if (token && token.string === ".") {
                return cursor;
            }
        }
        return undefined;
    };
    
    /**
     * Get the type of the current session, i.e., whether it is a property
     * lookup and, if so, what the context of the lookup is.
     * 
     * @return {{property: boolean, 
                 showFunctionType:boolean, 
                 context: string,
                 functionCallPos: {line:number, ch:number}}} - an Object consisting
     *      of a {boolean} "property" that indicates whether or not the type of
     *      the session is a property lookup, and a {string} "context" that
     *      indicates the object context (as described in getContext above) of
     *      the property lookup, or null if there is none. The context is
     *      always null for non-property lookups.
     *      a {boolean} "showFunctionType" indicating if the function type should
     *      be displayed instead of normal hints.  If "showFunctionType" is true, then
     *      then "functionCallPos" will be an object with line & col information of the
     *      function being called     
     */
    Session.prototype.getType = function () {
        var propertyLookup   = false,
            inFunctionCall   = false,
            showFunctionType = false,
            context          = null,
            cursor           = this.getCursor(),
            functionCallPos,
            token            = this.getToken(cursor);

        if (token) {
            // if this token is part of a function call, then the tokens lexical info
            // will be annotated with "call"
            if (token.state.lexical.info === "call") {
                inFunctionCall = true;
                if (this.getQuery().length > 0) {
                    inFunctionCall = false;
                    showFunctionType = false;
                } else {
                    showFunctionType = true;
                    // we need to find the location of the called function so that we can request the functions type.
                    // the token's lexical info will contain the column where the open "(" for the
                    // function call occurrs, but for whatever reason it does not have the line, so 
                    // we have to walk back and try to find the correct location.  We do this by walking
                    // up the lines starting with the line the token is on, and seeing if any of the lines
                    // have "(" at the column indicated by the tokens lexical state.  
                    // We walk back 9 lines, as that should be far enough to find most function calls,
                    // and it will prevent us from walking back thousands of lines if something went wrong.
                    // there is nothing magical about 9 lines, and it can be adjusted if it doesn't seem to be
                    // working well
                    var col = token.state.lexical.column,
                        line,
                        e,
                        found;
                    for (line = this.getCursor().line, e = Math.max(0, line - 9), found = false; line >= e; --line) {
                        if (this.getLine(line).charAt(col) === "(") {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        functionCallPos = {line: line, ch: col};
                    }
                }
            }
            if (token.className === "property") {
                propertyLookup = true;
            }
            if (this.findPreviousDot()) {
                propertyLookup = true;
                context = this.getContext(cursor);
            }
            if (propertyLookup) { showFunctionType = false; }
        }
        
        return {
            property: propertyLookup,
            inFunctionCall: inFunctionCall,
            showFunctionType: showFunctionType,
            functionCallPos: functionCallPos,
            context: context
        };
    };

    /**
     * Get a list of hints for the current session using the current scope
     * information. 
     *
     * @param {string} query - the query prefix
     * @param {StringMatcher} matcher - the class to find query matches and sort the results
     * @return {Array.<Object>} - the sorted list of hints for the current 
     *      session.
     */
    Session.prototype.getHints = function (query, matcher) {

        if (query === undefined) {
            query = "";
        }

        var MAX_DISPLAYED_HINTS = 500,
            type = this.getType(),
            builtins = this.builtins,
            hints;

        /**
         *  Is the origin one of the builtin files.
         *
         * @param {string} origin
         */
        function isBuiltin(origin) {
            return builtins.indexOf(origin) !== -1;
        }

        /**
         *  Filter an array hints using a given query and matcher.
         *  The hints are returned in the format of the matcher.
         *  The matcher returns the value in the "label" property,
         *  the match score in "matchGoodness" property.
         *
         * @param {Array} hints - array of hints
         * @param {StringMatcher} matcher
         * @returns {Array} - array of matching hints.
         */
        function filterWithQueryAndMatcher(hints, matcher) {
            var matchResults = $.map(hints, function (hint) {
                var searchResult = matcher.match(hint.value, query);
                if (searchResult) {
                    searchResult.value = hint.value;
                    searchResult.guess = hint.guess;

                    if (hint.keyword !== undefined) {
                        searchResult.keyword = hint.keyword;
                    }

                    if (hint.literal !== undefined) {
                        searchResult.literal = hint.literal;
                    }

                    if (hint.depth !== undefined) {
                        searchResult.depth = hint.depth;
                    }

                    if (!type.property && !type.showFunctionType && hint.origin &&
                            isBuiltin(hint.origin)) {
                        searchResult.builtin = 1;
                    } else {
                        searchResult.builtin = 0;
                    }
                }

                return searchResult;
            });

            return matchResults;
        }

        if (type.property) {
            hints = this.ternHints || [];
            hints = filterWithQueryAndMatcher(hints, matcher);

            // If there are no hints then switch over to guesses.
            if (hints.length === 0) {
                hints = filterWithQueryAndMatcher(this.ternProperties, matcher);
            }

            StringMatch.multiFieldSort(hints, { matchGoodness: 0, value: 1 });
        } else if (type.showFunctionType) {
            hints = this.getFunctionTypeHint();
        } else {     // identifiers, literals, and keywords
            hints = this.ternHints || [];
            hints = hints.concat(HintUtils.LITERALS);
            hints = hints.concat(HintUtils.KEYWORDS);
            hints = filterWithQueryAndMatcher(hints, matcher);
            StringMatch.multiFieldSort(hints, { matchGoodness: 0, depth: 1, builtin: 2, value: 3 });
        }

        if (hints.length > MAX_DISPLAYED_HINTS) {
            hints = hints.slice(0, MAX_DISPLAYED_HINTS);
        }
        return hints;
    };
    
    Session.prototype.setTernHints = function (newHints) {
        this.ternHints = newHints;
    };
    Session.prototype.setTernProperties = function (newProperties) {
        this.ternProperties = newProperties;
    };
    Session.prototype.setFnType = function (newFnType) {
        this.fnType = newFnType;
    };
    
    /**
     * Get the function type hint.  This will format the hint so
     * that it has the called variable name instead of just "fn()".
     */
    Session.prototype.getFunctionTypeHint = function () {
        var fnHint = this.fnType,
            hints = [];
        
        if (fnHint && (fnHint.substring(0, 3) === "fn(")) {
            var sessionType = this.getType(),
                cursor = sessionType.functionCallPos,
                token = cursor ? this.getToken(cursor) : undefined,
                varName;
            if (token) {
                varName = token.string;
                if (varName) {
                    fnHint = varName + fnHint.substr(2);
                }
            }
            hints[0] = {value: fnHint, positions: []};
        }
        return hints;
    };
    
    module.exports = Session;
});
