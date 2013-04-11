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

    var HintUtils       = require("HintUtils");

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
     * Get the next cursor position on the line, or null if there isn't one.
     * 
     * @return {?{line: number, ch: number}} - the cursor position
     *      immediately following the current cursor position, or null if
     *      none exists.
     */
    Session.prototype.getNextCursorOnLine = function () {
        var cursor  = this.getCursor(),
            doc     = this.editor.document,
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
            if (token.string !== "." && token.string !== "(" && token.string !== ',') {
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
            if (token.state.lexical.info === "call") {
                inFunctionCall = true;
                if (this.getQuery().length > 0) {
                    inFunctionCall = false;
                    showFunctionType = false;
                } else {
                    showFunctionType = true;
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
                    if ( found ) {
                        functionCallPos = {line:line, ch:col};                    
                    }   
                }                    
            }
            if (token.string === ".") {
                propertyLookup = true;
                context = this.getContext(cursor);
            } else {
                if (token.className === "property") {
                    propertyLookup = true;
                }

                token = this._getPreviousToken(cursor);
                if (token && token.string === ".") {
                    propertyLookup = true;
                    context = this.getContext(cursor);
                }
            }
            if( propertyLookup ) { showFunctionType = false; }            
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
     * @param {string} query - the query prefix (optional)
     * @return {Array.<Object>} - the sorted list of hints for the current 
     *      session.
     */
    Session.prototype.getHints = function (query) {

        if (query === undefined) {
            query = "";
        }

        var MAX_DISPLAYED_HINTS = 500,
            QUERY_PREFIX_LENGTH = 1;    // Any query of this size or less is matched as a prefix of a hint.

        /*
         * Filter a list of tokens using the query string in the closure.
         *
         * @param {Array.<Object>} tokens - list of hints to filter
         * @param {number} limit - maximum numberof tokens to return
         * @return {Array.<Object>} - filtered list of hints
         */
        function filterWithQuery(tokens, limit) {

            /*
             * Filter arr using test, returning at most limit results from the
             * front of the array.
             *
             * @param {Array} arr - array to filter
             * @param {Function} test - test to determine if an element should
             *      be included in the results
             * @param {number} limit - the maximum number of elements to return
             * @return {Array.<Object>} - new array of filtered elements
             */
            function filterArrayPrefix(arr, test, limit) {
                var i = 0,
                    results = [],
                    elem;

                for (i; i < arr.length && results.length <= limit; i++) {
                    elem = arr[i];
                    if (test(elem)) {
                        results.push(elem);
                    }
                }

                return results;
            }

            if (query.length > 0) {
                return filterArrayPrefix(tokens, function (token) {
                    if (token.literal && token.kind === "string") {
                        return false;
                    } else {
                        if (query.length > QUERY_PREFIX_LENGTH) {
                            return (token.value.toLowerCase().indexOf(query.toLowerCase()) !== -1);
                        } else {
                            return (token.value.toLowerCase().indexOf(query.toLowerCase()) === 0);
                        }
                    }
                }, limit);
            } else {
                return tokens.slice(0, limit);
            }
        }

        /**
         * Sort the better matching items to the top.
         * Prefix matches are considered the best and all others are equal.
         * @param a
         * @param b
         */
        function compareByBestMatch(a, b) {
            var index1 = a.value.toLowerCase().indexOf(query.toLowerCase()),
                index2 = b.value.toLowerCase().indexOf(query.toLowerCase());

            if (index1 === 0 && index2 !== 0) {
                return -1;
            } else if (index1 !== 0 && index2 === 0) {
                return 1;
            }

            return 0;
        }

        /*
         * Comparator for sorting tokens by name
         *
         * @param {Object} a - a token
         * @param {Object} b - another token
         * @return {number} - comparator value that indicates whether the name
         *      of token a is lexicographically lower than the name of token b
         */
        function compareByName(a, b) {
            var aLowerCase = a.value.toLowerCase();
            var bLowerCase = b.value.toLowerCase();

            if (aLowerCase === bLowerCase) {
                return 0;
            } else if (aLowerCase < bLowerCase) {
                return -1;
            } else {
                return 1;
            }
        }
        /**
         * sort by scope depth.
         *
         * @param a
         * @param b
         * @return {*}
         */
        function compareByScopeDepth(a, b) {
            var adepth = a.depth;
            var bdepth = b.depth;

            if (adepth >= 0) {
                if (bdepth >= 0) {
                    return adepth - bdepth;
                } else {
                    return -1;
                }
            } else if (bdepth >= 0) {
                return 1;
            } else {
                return 0;
            }
        }

        /*
         * Forms the lexicographical composition of comparators, i.e., 
         * "a lex(c1,c2) b" iff "a c1 b or (a = b and a c2 b)"
         * 
         * @param {Function} compare1 - a comparator
         * @param {Function} compare2 - another comparator
         * @return {Function} - the lexicographic composition of comparator1
         *      and comparator2
         */
        function lexicographic(compare1, compare2) {
            return function (a, b) {
                var result = compare1(a, b);
                if (result === 0) {
                    return compare2(a, b);
                } else {
                    return result;
                }
            };
        }

        /*
         * A comparator for identifiers: the lexicographic combination of
         * scope and name.
         *
         * @return {Function} - the comparator function
         */
        function compareProperties() {
            return (query.length > QUERY_PREFIX_LENGTH) ?
                       lexicographic(compareByBestMatch, compareByName) :
                       compareByName;
        }

        /*
         * A comparator for identifiers: the lexicographic combination of
         * scope and name.
         *
         * @return {Function} - the comparator function
         */
        function compareIdentifiers() {
            return (query.length > QUERY_PREFIX_LENGTH) ?
                       lexicographic(compareByBestMatch,
                           lexicographic(compareByScopeDepth, compareByName)) :
                       lexicographic(compareByScopeDepth, compareByName);
        }

        /*
         *  Determine if guesses should be added to the hints.
         *
         *  @param {Array} hints - current filtered hints
         *  @return true if guesses should be added, false otherwise.
         */
        function shouldAddGuesses(hints) {
            return (hints.length === 0);
        }

        /*
         *  Remove the special "<i>" property from the hints.
         *
         *  @param {Array} hints - sorted hints
         */
        function removeArrayIndexProperty(hints) {
            var n = hints.length,
                i;
            for (i = 0; i < n; i++) {
                var value = hints[i].value;
                if (value === "<i>") {
                    hints.splice(i, 1);
                    return;
                } else if (value > "<i>") {
                    return;
                }
            }
        }

        var type = this.getType(),
            hints;

        var ternHints = this.ternHints;
        if (type.property) {
            if (ternHints && ternHints.length > 0) {
                hints = ternHints;
                hints = filterWithQuery(hints, MAX_DISPLAYED_HINTS);
            } else {
                hints = [];
            }

            hints.sort(compareProperties());

            // Add guesses if appropriate. If guesses and hints are
            // mixed guesses are kept below the hints.
            if (shouldAddGuesses(hints)) {
                var guesses = filterWithQuery(this.ternProperties, MAX_DISPLAYED_HINTS - hints.length);
                guesses.sort(compareProperties());
                removeArrayIndexProperty(guesses);
                hints = hints.concat(guesses);
            }

        } else if ( type.showFunctionType ) {
            hints = this.getFunctionTypeHint();            
        } else {
            hints = ternHints || [];
            hints.sort(compareIdentifiers());
            hints = hints.concat(HintUtils.LITERALS);
            hints = hints.concat(HintUtils.KEYWORDS);
            hints = filterWithQuery(hints, MAX_DISPLAYED_HINTS);
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
    Session.prototype.getFunctionTypeHint = function() {
        var fnHint = this.fnType,
            hints = [];
        
        if (fnHint && (fnHint.substring(0,3) === "fn(")) {
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
            hints[0] = {value:fnHint, positions:[]};
        } 
        return hints;
    };
    
    module.exports = Session;
});
