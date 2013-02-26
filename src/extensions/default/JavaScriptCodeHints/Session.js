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

    var HintUtils       = require("HintUtils"),
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
    }

    /**
     * Update the scope information assocated with the current session
     * 
     * @param {Object} scopeInfo - scope information, including the scope and
     *      lists of identifiers, globals, literals and properties, and a set
     *      of associations
     */
    Session.prototype.setScopeInfo = function (scopeInfo) {
        this.scope = scopeInfo.scope;
        this.identifiers = scopeInfo.identifiers;
        this.globals = scopeInfo.globals;
        this.literals = scopeInfo.literals;
        this.properties = scopeInfo.properties;
        this.associations = scopeInfo.associations;
    };

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
            if (token.string !== ".") {
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
     * @return {{property: boolean, context: string}} - a pair consisting
     *      of a {boolean} "property" that indicates whether or not the type of
     *      the session is a property lookup, and a {string} "context" that
     *      indicates the object context (as described in getContext above) of
     *      the property lookup, or null if there is none. The context is
     *      always null for non-property lookups.
     */
    Session.prototype.getType = function () {
        var propertyLookup  = false,
            context         = null,
            cursor          = this.getCursor(),
            token           = this.getToken(cursor);

        if (token) {
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
        }

        return {
            property: propertyLookup,
            context: context
        };
    };

    /**
     * Get a list of hints for the current session using the current scope
     * information. 
     * 
     * @return {Array.<Object>} - the sorted list of hints for the current 
     *      session.
     */
    Session.prototype.getHints = function () {
        
        /*
         * Comparator for sorting tokens according to minimum distance from
         * a given position
         * 
         * @param {number} pos - the position to which a token's occurrences
         *      are compared
         * @param {Function} - the comparator function
         */
        function compareByPosition(pos) {
            
            /*
             * Compute the minimum distance between a token, with which is 
             * associated a sorted list of positions, and a given offset.
             *
             * @param {number} pos - the position to which a token's occurrences
             *      are compared.
             * @param {Object} token - a hint token, annotated with a list of
             *      occurrence positions
             * @return number - the least distance of an occurrence of token to
             *      pos, or Infinity if there are no occurrences
             */
            function minDistToPos(pos, token) {
                var arr     = token.positions,
                    low     = 0,
                    high    = arr.length,
                    middle  = Math.floor(high / 2),
                    dist;

                if (high === 0) {
                    return Infinity;
                } else {
                    // binary search for the position
                    while (low < middle && middle < high) {
                        if (arr[middle] < pos) {
                            low = middle;
                            middle += Math.floor((high - middle) / 2);
                        } else if (arr[middle] > pos) {
                            high = middle;
                            middle = low + Math.floor((middle - low) / 2);
                        } else {
                            break;
                        }
                    }

                    // the closest position is off by no more than one
                    dist = Math.abs(arr[middle] - pos);
                    if (middle > 0) {
                        dist = Math.min(dist, Math.abs(arr[middle - 1] - pos));
                    }
                    if (middle + 1 < arr.length) {
                        dist = Math.min(dist, Math.abs(arr[middle + 1] - pos));
                    }
                    return dist;
                }
            }

            return function (a, b) {
                
                /*
                 * Look up the cached minimum distance from an occurrence of
                 * the token to the given position, calculating and storing it
                 * if needed.
                 * 
                 * @param {Object} token - the token from which the minimum
                 *      distance to position pos is required
                 * @return {number} - the least distance of an occurrence of
                 *      token to position pos
                 */
                function getDistToPos(token) {
                    var dist;

                    if (token.distToPos >= 0) {
                        dist = token.distToPos;
                    } else {
                        dist = minDistToPos(pos, token);
                        token.distToPos = dist;
                    }
                    return dist;
                }

                var aDist = getDistToPos(a),
                    bDist = getDistToPos(b);

                if (aDist === Infinity) {
                    if (bDist === Infinity) {
                        return 0;
                    } else {
                        return 1;
                    }
                } else {
                    if (bDist === Infinity) {
                        return -1;
                    } else {
                        return aDist - bDist;
                    }
                }
            };
        }

        /*
         * Comparator for sorting tokens lexicographically according to scope,
         * assuming the scope level has already been annotated.
         * 
         * @param {Object} a - a token
         * @param {Object} b - another token
         * @param {number} - comparator value that indicates whether a is more
         *      tightly scoped than b
         */
        function compareByScope(a, b) {
            var adepth = a.level;
            var bdepth = b.level;

            if (adepth >= 0) {
                if (bdepth >= 0) {
                    return adepth - bdepth;
                } else {
                    return -1;
                }
            } else {
                if (bdepth >= 0) {
                    return 1;
                } else {
                    return 0;
                }
            }
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
            if (a.value === b.value) {
                return 0;
            } else if (a.value < b.value) {
                return -1;
            } else {
                return 1;
            }
        }
        
        /*
         * Comparator for sorting tokens by path, such that a <= b if
         * a.path === path
         *
         * @param {string} path - the target path name
         * @return {Function} - the comparator function
         */
        function compareByPath(path) {
            return function (a, b) {
                if (a.path === path) {
                    if (b.path === path) {
                        return 0;
                    } else {
                        return -1;
                    }
                } else {
                    if (b.path === path) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            };
        }
        
        /*
         * Comparator for sorting properties w.r.t. an association object.
         * 
         * @param {Object} assoc - an association object
         * @return {Function} - the comparator function
         */
        function compareByAssociation(assoc) {
            return function (a, b) {
                if (Object.prototype.hasOwnProperty.call(assoc, a.value)) {
                    if (Object.prototype.hasOwnProperty.call(assoc, b.value)) {
                        return assoc[a.value] - assoc[b.value];
                    } else {
                        return -1;
                    }
                } else {
                    if (Object.prototype.hasOwnProperty.call(assoc, b.value)) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            };
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
         * scope, position and name.
         * 
         * @param {number} pos - the target position by which identifiers are
         *      compared
         * @return {Function} - the comparator function
         */
        function compareIdentifiers(pos) {
            return lexicographic(compareByScope,
                        lexicographic(compareByPosition(pos),
                            compareByName));
        }
        
        /*
         * A comparator for properties: the lexicographic combination of
         * association, path name, position, and name.
         * 
         * @param {Object} assoc - the association by which properties are
         *      compared
         * @param {string} path - the path name by which properties are
         *      compared
         * @param {number} pos - the target position by which properties are
         *      compared
         * @return {Function} - the comparator function
         */
        function compareProperties(assoc, path, pos) {
            return lexicographic(compareByAssociation(assoc),
                        lexicographic(compareByPath(path),
                            lexicographic(compareByPosition(pos),
                                compareByName)));
        }
        
        /*
         * Clone a list of hints. (Used so that later annotations are not 
         * preserved when scope information changes.)
         * 
         * @param {Array.<Object>} hints - an array of hint tokens
         * @return {Array.<Object>} - a new array of objects that are clones of
         *      the objects in the input array
         */
        function copyHints(hints) {
            function cloneToken(token) {
                var copy = {},
                    prop;
                for (prop in token) {
                    if (Object.prototype.hasOwnProperty.call(token, prop)) {
                        copy[prop] = token[prop];
                    }
                }
                return copy;
            }
            return hints.map(cloneToken);
        }

        var cursor = this.editor.getCursorPos(),
            offset = this.editor.indexFromPos(cursor),
            type = this.getType(),
            association,
            hints;

        if (type.property) {
            hints = copyHints(this.properties);
            if (type.context &&
                    Object.prototype.hasOwnProperty.call(this.associations, type.context)) {
                association = this.associations[type.context];
                hints = HintUtils.annotateWithAssociation(hints, association);
                hints.sort(compareProperties(association, this.path, offset));
            } else {
                hints.sort(compareProperties({}, this.path, offset));
            }
        } else {
            hints = copyHints(this.identifiers);
            hints = HintUtils.annotateWithScope(hints, this.scope);
            hints = hints.concat(this.literals);
            hints.sort(compareIdentifiers(offset));
            hints = hints.concat(this.globals);
            hints = hints.concat(HintUtils.LITERALS);
            hints = hints.concat(HintUtils.KEYWORDS);
        }

        return hints;
    };

    module.exports = Session;
});
