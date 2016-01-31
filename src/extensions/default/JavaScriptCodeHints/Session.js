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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var StringMatch     = brackets.getModule("utils/StringMatch"),
        TokenUtils      = brackets.getModule("utils/TokenUtils"),
        LanguageManager = brackets.getModule("language/LanguageManager"),
        HTMLUtils       = brackets.getModule("language/HTMLUtils"),
        HintUtils       = require("HintUtils"),
        ScopeManager    = require("ScopeManager"),
        Acorn           = require("thirdparty/acorn/acorn"),
        Acorn_Loose     = require("thirdparty/acorn/acorn_loose");

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
        this.ternGuesses = null;
        this.fnType = null;
        this.builtins = null;
    }

    /**
     *  Get the builtin libraries tern is using.
     *
     * @return {Array.<string>} - array of library names.
     * @private
     */
    Session.prototype._getBuiltins = function () {
        if (!this.builtins) {
            this.builtins = ScopeManager.getBuiltins();
            this.builtins.push("requirejs.js");     // consider these globals as well.
        }

        return this.builtins;
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

        return this.getOffsetFromCursor(cursor);
    };

    /**
     * Get the offset of a cursor position
     *
     * @param {{line: number, ch: number}} the line/col info
     * @return {number} - the offset into the current document of the cursor
     */
    Session.prototype.getOffsetFromCursor = function (cursor) {
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
            return TokenUtils.getTokenAt(cm, cursor);
        } else {
            return TokenUtils.getTokenAt(cm, this.getCursor());
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
        } while (!/\S/.test(prev.string));

        return prev;
    };

    /**
     * Get the token after the one at the given cursor position
     *
     * @param {{line: number, ch: number}} cursor - cursor position after
     *      which a token should be retrieved
     * @param {boolean} skipWhitespace - true if this should skip over whitespace tokens
     * @return {Object} - the CodeMirror token after the one at the given
     *      cursor position
     */
    Session.prototype.getNextToken = function (cursor, skipWhitespace) {
        var token   = this.getToken(cursor),
            next    = token,
            doc     = this.editor.document;

        do {
            if (next.end > cursor.ch) {
                cursor.ch = next.end;
            } else if (next.end < doc.getLine(cursor.line).length) {
                cursor.ch = next.end + 1;
            } else if (doc.getLine(cursor.line + 1)) {
                cursor.ch = 0;
                cursor.line++;
            } else {
                next = null;
                break;
            }
            next = this.getToken(cursor);
        } while (skipWhitespace && !/\S/.test(next.string));

        return next;
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
            query   = "",
            start   = cursor.ch,
            end     = start;

        if (token) {
            var line = this.getLine(cursor.line);
            while (start > 0) {
                if (HintUtils.maybeIdentifier(line[start - 1])) {
                    start--;
                } else {
                    break;
                }
            }

            query = line.substring(start, end);
        }

        return query;
    };

    /**
     * Find the context of a property lookup. For example, for a lookup
     * foo(bar, baz(quux)).prop, foo is the context.
     *
     * @param {{line: number, ch: number}} cursor - the cursor position
     *      at which context information is to be retrieved
     * @param {number=} depth - the current depth of the parenthesis stack, or
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
     *
     * @param {Object} token - a CodeMirror token
     * @return {*} - the lexical state of the token
     */
    function getLexicalState(token) {
        if (token.state.lexical) {
            // in a javascript file this is just in the state field
            return token.state.lexical;
        } else if (token.state.localState && token.state.localState.lexical) {
            // inline javascript in an html file will have this in
            // the localState field
            return token.state.localState.lexical;
        }
    }


    /**
     * Determine if the caret is either within a function call or on the function call itself.
     *
     * @return {{inFunctionCall: boolean, functionCallPos: {line: number, ch: number}}}
     * inFunctionCall - true if the caret if either within a function call or on the
     * function call itself.
     * functionCallPos - the offset of the '(' character of the function call if inFunctionCall
     * is true, otherwise undefined.
     */
    Session.prototype.getFunctionInfo = function () {
        var inFunctionCall   = false,
            cursor           = this.getCursor(),
            functionCallPos,
            token            = this.getToken(cursor),
            lexical,
            self = this,
            foundCall = false;

        /**
         * Test if the cursor is on a function identifier
         *
         * @return {Object} - lexical state if on a function identifier, null otherwise.
         */
        function isOnFunctionIdentifier() {

            // Check if we might be on function identifier of the function call.
            var type = token.type,
                nextToken,
                localLexical,
                localCursor = {line: cursor.line, ch: token.end};

            if (type === "variable-2" || type === "variable" || type === "property") {
                nextToken = self.getNextToken(localCursor, true);
                if (nextToken && nextToken.string === "(") {
                    localLexical = getLexicalState(nextToken);
                    return localLexical;
                }
            }

            return null;
        }

        /**
         * Test is a lexical state is in a function call.
         *
         * @param {Object} lex - lexical state.
         * @return {Object | boolean}
         *
         */
        function isInFunctionalCall(lex) {
            // in a call, or inside array or object brackets that are inside a function.
            return (lex && (lex.info === "call" ||
                (lex.info === undefined && (lex.type === "]" || lex.type === "}") &&
                    lex.prev.info === "call")));
        }

        if (token) {
            // if this token is part of a function call, then the tokens lexical info
            // will be annotated with "call".
            // If the cursor is inside an array, "[]", or object, "{}", the lexical state
            // will be undefined, not "call". lexical.prev will be the function state.
            // Handle this case and then set "lexical" to lexical.prev.
            // Also test if the cursor is on a function identifier of a function call.
            lexical = getLexicalState(token);
            foundCall = isInFunctionalCall(lexical);

            if (!foundCall) {
                lexical = isOnFunctionIdentifier();
                foundCall = isInFunctionalCall(lexical);
            }

            if (foundCall) {
                // we need to find the location of the called function so that we can request the functions type.
                // the token's lexical info will contain the column where the open "(" for the
                // function call occurs, but for whatever reason it does not have the line, so
                // we have to walk back and try to find the correct location.  We do this by walking
                // up the lines starting with the line the token is on, and seeing if any of the lines
                // have "(" at the column indicated by the tokens lexical state.
                // We walk back 9 lines, as that should be far enough to find most function calls,
                // and it will prevent us from walking back thousands of lines if something went wrong.
                // there is nothing magical about 9 lines, and it can be adjusted if it doesn't seem to be
                // working well
                if (lexical.info === undefined) {
                    lexical = lexical.prev;
                }

                var col = lexical.info === "call" ? lexical.column : lexical.prev.column,
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
                    inFunctionCall = true;
                    functionCallPos = {line: line, ch: col};
                }
            }
        }

        return {
            inFunctionCall: inFunctionCall,
            functionCallPos: functionCallPos
        };
    };

    /**
     * Get the type of the current session, i.e., whether it is a property
     * lookup and, if so, what the context of the lookup is.
     *
     * @return {{property: boolean,
                 context: string} - an Object consisting
     *      of a {boolean} "property" that indicates whether or not the type of
     *      the session is a property lookup, and a {string} "context" that
     *      indicates the object context (as described in getContext above) of
     *      the property lookup, or null if there is none. The context is
     *      always null for non-property lookups.
     */
    Session.prototype.getType = function () {
        var propertyLookup   = false,
            context          = null,
            cursor           = this.getCursor(),
            token            = this.getToken(cursor),
            lexical;

        if (token) {
            // if this token is part of a function call, then the tokens lexical info
            // will be annotated with "call"
            lexical = getLexicalState(token);
            if (token.type === "property") {
                propertyLookup = true;
            }

            cursor = this.findPreviousDot();
            if (cursor) {
                propertyLookup = true;
                context = this.getContext(cursor);
            }
        }

        return {
            property: propertyLookup,
            context: context
        };
    };

    // Comparison function used for sorting that does a case-insensitive string
    // comparison on the "value" field of both objects. Unlike a normal string
    // comparison, however, this sorts leading "_" to the bottom, given that a
    // leading "_" usually denotes a private value.
    function penalizeUnderscoreValueCompare(a, b) {
        var aName = a.value.toLowerCase(), bName = b.value.toLowerCase();
        // this sort function will cause _ to sort lower than lower case
        // alphabetical letters
        if (aName[0] === "_" && bName[0] !== "_") {
            return 1;
        } else if (bName[0] === "_" && aName[0] !== "_") {
            return -1;
        }
        if (aName < bName) {
            return -1;
        } else if (aName > bName) {
            return 1;
        }
        return 0;
    }

    /**
     * Get a list of hints for the current session using the current scope
     * information.
     *
     * @param {string} query - the query prefix
     * @param {StringMatcher} matcher - the class to find query matches and sort the results
     * @return {hints: Array.<string>, needGuesses: boolean} - array of
     * matching hints. If needGuesses is true, then the caller needs to
     * request guesses and call getHints again.
     */
    Session.prototype.getHints = function (query, matcher) {

        if (query === undefined) {
            query = "";
        }

        var MAX_DISPLAYED_HINTS = 500,
            type                = this.getType(),
            builtins            = this._getBuiltins(),
            needGuesses         = false,
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
         * @return {Array} - array of matching hints.
         */
        function filterWithQueryAndMatcher(hints, matcher) {
            var matchResults = $.map(hints, function (hint) {
                var searchResult = matcher.match(hint.value, query);
                if (searchResult) {
                    searchResult.value = hint.value;
                    searchResult.guess = hint.guess;
                    searchResult.type = hint.type;

                    if (hint.keyword !== undefined) {
                        searchResult.keyword = hint.keyword;
                    }

                    if (hint.literal !== undefined) {
                        searchResult.literal = hint.literal;
                    }

                    if (hint.depth !== undefined) {
                        searchResult.depth = hint.depth;
                    }

                    if (hint.doc) {
                        searchResult.doc = hint.doc;
                    }

                    if (hint.url) {
                        searchResult.url = hint.url;
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
                if (this.ternGuesses) {
                    hints = filterWithQueryAndMatcher(this.ternGuesses, matcher);
                } else {
                    needGuesses = true;
                }
            }

            StringMatch.multiFieldSort(hints, [ "matchGoodness", penalizeUnderscoreValueCompare ]);
        } else {     // identifiers, literals, and keywords
            hints = this.ternHints || [];
            hints = hints.concat(HintUtils.LITERALS);
            hints = hints.concat(HintUtils.KEYWORDS);
            hints = filterWithQueryAndMatcher(hints, matcher);
            StringMatch.multiFieldSort(hints, [ "matchGoodness", "depth", "builtin", penalizeUnderscoreValueCompare ]);
        }

        if (hints.length > MAX_DISPLAYED_HINTS) {
            hints = hints.slice(0, MAX_DISPLAYED_HINTS);
        }

        return {hints: hints, needGuesses: needGuesses};
    };

    Session.prototype.setTernHints = function (newHints) {
        this.ternHints = newHints;
    };

    Session.prototype.setGuesses = function (newGuesses) {
        this.ternGuesses = newGuesses;
    };

    /**
     * Set a new function type hint.
     *
     * @param {Array<{name: string, type: string, isOptional: boolean}>} newFnType -
     * Array of function hints.
     */
    Session.prototype.setFnType = function (newFnType) {
        this.fnType = newFnType;
    };

    /**
     * The position of the function call for the current fnType.
     *
     * @param {{line:number, ch:number}} functionCallPos - the offset of the function call.
     */
    Session.prototype.setFunctionCallPos = function (functionCallPos) {
        this.functionCallPos = functionCallPos;
    };

    /**
     * Get the function type hint.  This will format the hint, showing the
     * parameter at the cursor in bold.
     *
     * @return {{parameters: Array<{name: string, type: string, isOptional: boolean}>,
     * currentIndex: number}} An Object where the
     * "parameters" property is an array of parameter objects;
     * the "currentIndex" property index of the hint the cursor is on, may be
     * -1 if the cursor is on the function identifier.
     */
    Session.prototype.getParameterHint = function () {
        var fnHint = this.fnType,
            cursor = this.getCursor(),
            token = this.getToken(this.functionCallPos),
            start = {line: this.functionCallPos.line, ch: token.start},
            fragment = this.editor.document.getRange(start,
                {line: this.functionCallPos.line + 10, ch: 0});

        var ast;
        try {
            ast = Acorn.parse(fragment);
        } catch (e) { ast = Acorn_Loose.parse_dammit(fragment); }

        // find argument as cursor location and bold it.
        var startOffset = this.getOffsetFromCursor(start),
            cursorOffset = this.getOffsetFromCursor(cursor),
            offset = cursorOffset - startOffset,
            node = ast.body[0],
            currentArg = -1;

        if (node.type === "ExpressionStatement") {
            node = node.expression;
            if (node.type === "SequenceExpression") {
                node = node.expressions[0];
            }
            if (node.type === "BinaryExpression") {
                if (node.left.type === "CallExpression") {
                    node = node.left;
                } else if (node.right.type === "CallExpression") {
                    node = node.right;
                }
            }
            if (node.type === "CallExpression") {
                var args = node["arguments"],
                    i,
                    n = args.length,
                    lastEnd = offset,
                    text;
                for (i = 0; i < n; i++) {
                    node = args[i];
                    if (offset >= node.start && offset <= node.end) {
                        currentArg = i;
                        break;
                    } else if (offset < node.start) {
                        // The range of nodes can be disjoint so see i f we
                        // passed the node. If we passed the node look at the
                        // text between the nodes to figure out which
                        // arg we are on.
                        text = fragment.substring(lastEnd, node.start);

                        // test if comma is before or after the offset
                        if (text.indexOf(",") >= (offset - lastEnd)) {
                            // comma is after the offset so the current arg is the
                            // previous arg node.
                            i--;
                        } else if (i === 0 && text.indexOf("(") !== -1) {
                            // the cursor is on the function identifier
                            currentArg = -1;
                            break;
                        }

                        currentArg = Math.max(0, i);
                        break;
                    } else if (i + 1 === n) {
                        // look for a comma after the node.end. This will tell us we
                        // are on the next argument, even there is no text, and therefore no node,
                        // for the next argument.
                        text = fragment.substring(node.end, offset);
                        if (text.indexOf(",") !== -1) {
                            currentArg = i + 1; // we know we are after the current arg, but keep looking
                        }
                    }

                    lastEnd = node.end;
                }

                // if there are no args, then figure out if we are on the function identifier
                if (n === 0 && cursorOffset > this.getOffsetFromCursor(this.functionCallPos)) {
                    currentArg = 0;
                }
            }
        }

        return {parameters: fnHint, currentIndex: currentArg};
    };

    /**
     * Get the javascript text of the file open in the editor for this Session.
     * For a javascript file, this is just the text of the file.  For an HTML file,
     * this will be only the text in the <script> tags.  This is so that we can pass
     * just the javascript text to tern, and avoid confusing it with HTML tags, since it
     * only knows how to parse javascript.
     * @return {string} - the "javascript" text that can be sent to Tern.
     */
    Session.prototype.getJavascriptText = function () {
        if (LanguageManager.getLanguageForPath(this.editor.document.file.fullPath).getId() === "html") {
            // HTML file - need to send back only the bodies of the
            // <script> tags
            var text = "",
                editor = this.editor,
                scriptBlocks = HTMLUtils.findBlocks(editor, "javascript");

            // Add all the javascript text
            // For non-javascript blocks we replace everything except for newlines
            // with whitespace.  This is so that the offset and cursor positions
            // we get from the document still work.
            // Alternatively we could strip the non-javascript text, and modify the offset,
            // and/or cursor, but then we have to remember how to reverse the translation
            // to support jump-to-definition
            var htmlStart = {line: 0, ch: 0};
            scriptBlocks.forEach(function (scriptBlock) {
                var start = scriptBlock.start,
                    end = scriptBlock.end;

                // get the preceding html text, and replace it with whitespace
                var htmlText = editor.document.getRange(htmlStart, start);
                htmlText = htmlText.replace(/./g, " ");

                htmlStart = end;
                text += htmlText + scriptBlock.text;
            });

            return text;
        } else {
            // Javascript file, just return the text
            return this.editor.document.getText();
        }
    };

    /**
     * Determine if the cursor is located in the name of a function declaration.
     * This is so we can suppress hints when in a function name, as we do for variable and
     * parameter declarations, but we can tell those from the token itself rather than having
     * to look at previous tokens.
     *
     * @return {boolean} - true if the current cursor position is in the name of a function
     * declaration.
     */
    Session.prototype.isFunctionName = function () {
        var cursor = this.getCursor(),
            prevToken = this._getPreviousToken(cursor);

        return prevToken.string === "function";
    };

    module.exports = Session;
});
