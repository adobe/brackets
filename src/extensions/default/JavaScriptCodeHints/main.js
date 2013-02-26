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

    var CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        AppInit         = brackets.getModule("utils/AppInit"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        StringUtils     = brackets.getModule("utils/StringUtils"),
        HintUtils       = require("HintUtils"),
        ScopeManager    = require("ScopeManager"),
        Session         = require("Session");

    var session     = null,  // object that encapsulates the current session state
        cachedHints = null,  // sorted hints for the current hinting session
        cachedType  = null,  // describes the lookup type and the object context
        cachedScope = null,  // the inner-most scope returned by the query worker
        cachedLine  = null;  // the line number for the cached scope

    var MAX_DISPLAYED_HINTS = 100;

    /**
     * Creates a hint response object. Filters the hint list using the query
     * string, formats the hints for display, and returns a hint response
     * object according to the CodeHintManager's API for code hint providers.
     *
     * @param {Array.<Object>} hints - hints to be included in the response
     * @param {string} query - querystring with which to filter the hint list
     * @return {Object} - hint response as defined by the CodeHintManager API 
     */
    function getHintResponse(hints, query) {

        var trimmedQuery,
            filteredHints,
            formattedHints;

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

            // If the query is a string literal (i.e., if it starts with a
            // string literal delimiter, and hence if trimmedQuery !== query)
            // then only string literal hints should be returned, and matching
            // should be performed w.r.t. trimmedQuery. If the query is 
            // otherwise non-empty, no string literals should match. If the
            // query is empty then no hints are filtered.
            if (trimmedQuery !== query) {
                return filterArrayPrefix(tokens, function (token) {
                    if (token.literal && token.kind === "string") {
                        return (token.value.indexOf(trimmedQuery) === 0);
                    } else {
                        return false;
                    }
                }, limit);
            } else if (query.length > 0) {
                return filterArrayPrefix(tokens, function (token) {
                    if (token.literal && token.kind === "string") {
                        return false;
                    } else {
                        return (token.value.indexOf(query) === 0);
                    }
                }, limit);
            } else {
                return tokens.slice(0, limit);
            }
        }

        /*
         * Returns a formatted list of hints with the query substring
         * highlighted.
         * 
         * @param {Array.<Object>} hints - the list of hints to format
         * @param {string} query - querystring used for highlighting matched
         *      poritions of each hint
         * @param {Array.<jQuery.Object>} - array of hints formatted as jQuery
         *      objects
         */
        function formatHints(hints, query) {
            return hints.map(function (token) {
                var hint        = token.value,
                    index       = hint.indexOf(query),
                    $hintObj    = $("<span>").addClass("brackets-js-hints"),
                    delimiter   = "";

                // level indicates either variable scope or property confidence
                switch (token.level) {
                case 0:
                    $hintObj.addClass("priority-high");
                    break;
                case 1:
                    $hintObj.addClass("priority-medium");
                    break;
                case 2:
                    $hintObj.addClass("priority-low");
                    break;
                }

                // is the token a global variable?
                if (token.global) {
                    $hintObj.addClass("global-hint");
                }
                
                // is the token a literal?
                if (token.literal) {
                    $hintObj.addClass("literal-hint");
                    if (token.kind === "string") {
                        delimiter = HintUtils.DOUBLE_QUOTE;
                    }
                }
                
                // is the token a keyword?
                if (token.keyword) {
                    $hintObj.addClass("keyword-hint");
                }
             
                // higlight the matched portion of each hint
                if (index >= 0) {
                    var prefix  = StringUtils.htmlEscape(hint.slice(0, index)),
                        match   = StringUtils.htmlEscape(hint.slice(index, index + query.length)),
                        suffix  = StringUtils.htmlEscape(hint.slice(index + query.length));

                    $hintObj.append(delimiter + prefix)
                        .append($("<span>")
                                .append(match)
                                .addClass("matched-hint"))
                        .append(suffix + delimiter);
                } else {
                    $hintObj.text(delimiter + hint + delimiter);
                }
                $hintObj.data("token", token);
                
                return $hintObj;
            });
        }

        // trim leading and trailing string literal delimiters from the query
        if (query.indexOf(HintUtils.SINGLE_QUOTE) === 0 ||
                query.indexOf(HintUtils.DOUBLE_QUOTE) === 0) {
            trimmedQuery = query.substring(1);
            if (trimmedQuery.lastIndexOf(HintUtils.DOUBLE_QUOTE) === trimmedQuery.length - 1 ||
                    trimmedQuery.lastIndexOf(HintUtils.SINGLE_QUOTE) === trimmedQuery.length - 1) {
                trimmedQuery = trimmedQuery.substring(0, trimmedQuery.length - 1);
            }
        } else {
            trimmedQuery = query;
        }

        filteredHints = filterWithQuery(hints, MAX_DISPLAYED_HINTS);
        formattedHints = formatHints(filteredHints, trimmedQuery);

        return {
            hints: formattedHints,
            match: null, // the CodeHintManager should not format the results
            selectInitial: true
        };
    }

    /**
     * @constructor
     */
    function JSHints() {
    }

    /**
     * Determine whether hints are available for a given editor context
     * 
     * @param {Editor} editor - the current editor context
     * @param {string} key - charCode of the last pressed key
     * @return {boolean} - can the provider provide hints for this session?
     */
    JSHints.prototype.hasHints = function (editor, key) {
        if ((key === null) || HintUtils.maybeIdentifier(key)) {
            var cursor  = session.getCursor(),
                token   = session.getToken(cursor);

            // don't autocomplete within strings or comments, etc.
            if (token && HintUtils.hintable(token)) {
                var offset = session.getOffset();
                
                // Invalidate cached information if: 1) no scope exists; 2) the
                // cursor has moved a line; 3) the scope is dirty; or 4) if the
                // cursor has moved into a different scope. Cached information
                // is also reset on editor change.
                if (!cachedScope ||
                        cachedLine !== cursor.line ||
                        ScopeManager.isScopeDirty(session.editor.document) ||
                        !cachedScope.containsPositionImmediate(offset)) {
                    cachedScope = null;
                    cachedLine = null;
                    cachedHints = null;
                }
                return true;
            }
        }
        return false;
    };

    /** 
      * Return a list of hints, possibly deferred, for the current editor 
      * context
      * 
      * @param {string} key - charCode of the last pressed key
      * @return {Object + jQuery.Deferred} - hint response (immediate or
      *     deferred) as defined by the CodeHintManager API
      */
    JSHints.prototype.getHints = function (key) {
        var cursor = session.getCursor(),
            token = session.getToken(cursor);
        if ((key === null) || HintUtils.hintable(token)) {
            if (token) {
                if (!cachedScope) {
                    var offset          = session.getOffset(),
                        scopeResponse   = ScopeManager.getScopeInfo(session.editor.document, offset),
                        self            = this;

                    if (scopeResponse.hasOwnProperty("promise")) {
                        var $deferredHints = $.Deferred();
                        scopeResponse.promise.done(function (scopeInfo) {
                            session.setScopeInfo(scopeInfo);
                            cachedScope = scopeInfo.scope;
                            cachedLine = cursor.line;
                            cachedType = session.getType();
                            cachedHints = session.getHints();

                            $(self).triggerHandler("resolvedResponse", [cachedHints, cachedType]);

                            if ($deferredHints.state() === "pending") {
                                var query           = session.getQuery(),
                                    hintResponse    = getHintResponse(cachedHints, query);

                                $deferredHints.resolveWith(null, [hintResponse]);
                                $(self).triggerHandler("hintResponse", [query]);
                            }
                        }).fail(function () {
                            if ($deferredHints.state() === "pending") {
                                $deferredHints.reject();
                            }
                        });

                        $(this).triggerHandler("deferredResponse");
                        return $deferredHints;
                    } else {
                        session.setScopeInfo(scopeResponse);
                        cachedScope = scopeResponse.scope;
                        cachedLine = cursor.line;
                    }
                }

                if (cachedScope) {
                    var type    = session.getType(),
                        query   = session.getQuery();

                    // Compute fresh hints if none exist, or if the session
                    // type has changed since the last hint computation
                    if (!cachedHints ||
                            type.property !== cachedType.property ||
                            type.context !== cachedType.context) {
                        cachedType = type;
                        cachedHints = session.getHints();
                    }
                    return getHintResponse(cachedHints, query);
                }
            }
        }

        return null;
    };

    /**
     * Inserts the hint selected by the user into the current editor.
     * 
     * @param {jQuery.Object} hint - hint object to insert into current editor
     * @return {boolean} - should a new hinting session be requested 
     *      immediately after insertion?
     */
    JSHints.prototype.insertHint = function ($hintObj) {
        var hint        = $hintObj.data("token"),
            completion  = hint.value,
            cursor      = session.getCursor(),
            token       = session.getToken(cursor),
            query       = session.getQuery(),
            start       = {line: cursor.line, ch: cursor.ch - query.length},
            end         = {line: cursor.line, ch: (token ? token.end : cursor.ch)},
            delimeter;

        if (token && token.string === ".") {
            var nextCursor  = session.getNextCursorOnLine(),
                nextToken   = nextCursor ? session.getToken(nextCursor) : null;

            if (nextToken && // don't replace delimiters, etc.
                    HintUtils.maybeIdentifier(nextToken.string) &&
                    HintUtils.hintable(nextToken)) {
                end.ch = nextToken.end;
            }
        }

        // If the hint is a string literal, choose a delimiter in which
        // to wrap it, preserving the existing delimiter if possible.
        if (hint.literal && hint.kind === "string") {
            if (token.string.indexOf(HintUtils.DOUBLE_QUOTE) === 0) {
                delimeter = HintUtils.DOUBLE_QUOTE;
            } else if (token.string.indexOf(HintUtils.SINGLE_QUOTE) === 0) {
                delimeter = HintUtils.SINGLE_QUOTE;
            } else {
                delimeter = hint.delimeter;
            }

            completion = completion.replace("\\", "\\\\");
            completion = completion.replace(delimeter, "\\" + delimeter);
            completion = delimeter + completion + delimeter;
        }

        // Replace the current token with the completion
        session.editor.document.replaceRange(completion, start, end);

        // Return false to indicate that another hinting session is not needed
        return false;
    };


    // load the extension
    AppInit.appReady(function () {

        /*
         * When the editor is changed, reset the hinting session and cached 
         * information, and reject any pending deferred requests.
         * 
         * @param {Editor} editor - editor context to be initialized.
         */
        function initializeSession(editor) {
            ScopeManager.handleEditorChange(editor.document);
            session = new Session(editor);
            cachedScope = null;
            cachedLine = null;
            cachedHints = null;
            cachedType = null;
        }

        /*
         * Install editor change listeners
         * 
         * @param {Editor} editor - editor context on which to listen for
         *      changes
         */
        function installEditorListeners(editor) {
            if (!editor) {
                return;
            }
            
            if (editor.getModeForSelection() === HintUtils.MODE_NAME) {
                initializeSession(editor);
                $(editor)
                    .on(HintUtils.eventName("change"), function () {
                        ScopeManager.handleFileChange(editor.document);
                    });
            }
        }

        /*
         * Uninstall editor change listeners
         * 
         * @param {Editor} editor - editor context on which to stop listening
         *      for changes
         */
        function uninstallEditorListeners(editor) {
            $(editor)
                .off(HintUtils.eventName("change"));
        }

        /*
         * Handle the activeEditorChange event fired by EditorManager.
         * Uninstalls the change listener on the previous editor
         * and installs a change listener on the new editor.
         * 
         * @param {Event} event - editor change event (ignored)
         * @param {Editor} current - the new current editor context
         * @param {Editor} previous - the previous editor context
         */
        function handleActiveEditorChange(event, current, previous) {
            uninstallEditorListeners(previous);
            installEditorListeners(current);
        }
        
        ExtensionUtils.loadStyleSheet(module, "styles/brackets-js-hints.css");
        
        // uninstall/install change listener as the active editor changes
        $(EditorManager)
            .on(HintUtils.eventName("activeEditorChange"),
                handleActiveEditorChange);
        
        // immediately install the current editor
        installEditorListeners(EditorManager.getActiveEditor());

        var jsHints = new JSHints();
        CodeHintManager.registerHintProvider(jsHints, [HintUtils.MODE_NAME], 0);

        // for unit testing
        exports.jsHintProvider = jsHints;
        exports.initializeSession = initializeSession;
    });
});
