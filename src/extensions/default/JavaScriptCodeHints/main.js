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

define(function (require, exports, module) {
    "use strict";

    var _ = brackets.getModule("thirdparty/lodash");

    var CodeHintManager      = brackets.getModule("editor/CodeHintManager"),
        EditorManager        = brackets.getModule("editor/EditorManager"),
        Commands             = brackets.getModule("command/Commands"),
        CommandManager       = brackets.getModule("command/CommandManager"),
        LanguageManager      = brackets.getModule("language/LanguageManager"),
        AppInit              = brackets.getModule("utils/AppInit"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        StringMatch          = brackets.getModule("utils/StringMatch"),
        ProjectManager       = brackets.getModule("project/ProjectManager"),
        PreferencesManager   = brackets.getModule("preferences/PreferencesManager"),
        Strings              = brackets.getModule("strings"),
        ParameterHintManager = require("ParameterHintManager"),
        HintUtils            = require("HintUtils"),
        ScopeManager         = require("ScopeManager"),
        Session              = require("Session"),
        Acorn                = require("node_modules/acorn/dist/acorn");

    var session            = null,  // object that encapsulates the current session state
        cachedCursor       = null,  // last cursor of the current hinting session
        cachedHints        = null,  // sorted hints for the current hinting session
        cachedType         = null,  // describes the lookup type and the object context
        cachedToken        = null,  // the token used in the current hinting session
        matcher            = null,  // string matcher for hints
        jsHintsEnabled     = true,  // preference setting to enable/disable the hint session
        hintDetailsEnabled = true,  // preference setting to enable/disable hint type details
        noHintsOnDot       = false, // preference setting to prevent hints on dot
        ignoreChange;           // can ignore next "change" event if true;

    // Languages that support inline JavaScript
    var _inlineScriptLanguages = ["html", "php"];

    // Define the detectedExclusions which are files that have been detected to cause Tern to run out of control.
    PreferencesManager.definePreference("jscodehints.detectedExclusions", "array", [], {
        description: Strings.DESCRIPTION_DETECTED_EXCLUSIONS
    });

    // This preference controls when Tern will time out when trying to understand files
    PreferencesManager.definePreference("jscodehints.inferenceTimeout", "number", 30000, {
        description: Strings.DESCRIPTION_INFERENCE_TIMEOUT
    });

    // This preference controls whether to prevent hints from being displayed when dot is typed
    PreferencesManager.definePreference("jscodehints.noHintsOnDot", "boolean", false, {
        description: Strings.DESCRIPTION_NO_HINTS_ON_DOT
    });

    // This preference controls whether to create a session and process all JS files or not.
    PreferencesManager.definePreference("codehint.JSHints", "boolean", true, {
        description: Strings.DESCRIPTION_JS_HINTS
    });

    // This preference controls whether detailed type metadata will be desplayed within hint list. Deafults to true.
    PreferencesManager.definePreference("jscodehints.typedetails", "boolean", true, {
        description: Strings.DESCRIPTION_JS_HINTS_TYPE_DETAILS
    });

    /**
     * Check whether any of code hints preferences for JS Code Hints is disabled
     * @return {boolean} enabled/disabled
     */
    function _areHintsEnabled() {
        return (PreferencesManager.get("codehint.JSHints") !== false) &&
            (PreferencesManager.get("showCodeHints") !== false);
    }

    PreferencesManager.on("change", "codehint.JSHints", function () {
        jsHintsEnabled = _areHintsEnabled();
    });

    PreferencesManager.on("change", "showCodeHints", function () {
        jsHintsEnabled = _areHintsEnabled();
    });

    PreferencesManager.on("change", "jscodehints.noHintsOnDot", function () {
        noHintsOnDot = !!PreferencesManager.get("jscodehints.noHintsOnDot");
    });

    PreferencesManager.on("change", "jscodehints.typedetails", function () {
        hintDetailsEnabled = PreferencesManager.get("jscodehints.typedetails");
    });

    /**
     * Sets the configuration, generally for testing/debugging use.
     * Configuration keys are merged into the current configuration.
     * The Tern worker is automatically updated to the new config as well.
     *
     * * debug: Set to true if you want verbose logging
     * * noReset: Set to true if you don't want the worker to restart periodically
     *
     * @param {Object} configUpdate keys/values to merge into the config
     */
    function setConfig(configUpdate) {
        var config = setConfig.config;
        Object.keys(configUpdate).forEach(function (key) {
            config[key] = configUpdate[key];
        });

        ScopeManager._setConfig(configUpdate);
    }

    setConfig.config = {};

    /**
     *  Get the value of current session.
     *  Used for unit testing.
     * @return {Session} - the current session.
     */
    function getSession() {
        return session;
    }

    /**
     * Creates a hint response object. Filters the hint list using the query
     * string, formats the hints for display, and returns a hint response
     * object according to the CodeHintManager's API for code hint providers.
     *
     * @param {Array.<Object>} hints - hints to be included in the response
     * @param {string} query - querystring with which to filter the hint list
     * @param {Object} type - the type of query, property vs. identifier
     * @return {Object} - hint response as defined by the CodeHintManager API
     */
    function getHintResponse(hints, query, type) {

        var trimmedQuery,
            formattedHints;

        if (setConfig.config.debug) {
            console.debug("Hints", _.pluck(hints, "label"));
        }

        function formatTypeDataForToken($hintObj, token) {

            if (!hintDetailsEnabled) {
                return;
            }

            $hintObj.addClass('brackets-js-hints-with-type-details');

            (function _appendLink() {
                if (token.url) {
                    $('<a></a>').appendTo($hintObj).addClass("jshint-link").attr('href', token.url).on("click", function (event) {
                        event.stopImmediatePropagation();
                        event.stopPropagation();
                    });
                }
            }());

            if (token.type) {
                if (token.type.trim() !== '?') {
                    if (token.type.length < 30) {
                        $('<span>' + token.type.split('->').join(':').toString().trim() + '</span>').appendTo($hintObj).addClass("brackets-js-hints-type-details");
                    }
                    $('<span>' + token.type.split('->').join(':').toString().trim() + '</span>').appendTo($hintObj).addClass("jshint-description");
                }
            } else {
                if (token.keyword) {
                    $('<span>keyword</span>').appendTo($hintObj).addClass("brackets-js-hints-keyword");
                }
            }

            if (token.doc) {
                $hintObj.attr('title', token.doc);
                $('<span></span>').text(token.doc.trim()).appendTo($hintObj).addClass("jshint-jsdoc");
            }
        }


        /*
         * Returns a formatted list of hints with the query substring
         * highlighted.
         *
         * @param {Array.<Object>} hints - the list of hints to format
         * @param {string} query - querystring used for highlighting matched
         *      poritions of each hint
         * @return {jQuery.Deferred|{
         *              hints: Array.<string|jQueryObject>,
         *              match: string,
         *              selectInitial: boolean,
         *              handleWideResults: boolean}}
         */
        function formatHints(hints, query) {
            return hints.map(function (token) {
                var $hintObj    = $("<span>").addClass("brackets-js-hints");

                // level indicates either variable scope or property confidence
                if (!type.property && !token.builtin && token.depth !== undefined) {
                    switch (token.depth) {
                    case 0:
                        $hintObj.addClass("priority-high");
                        break;
                    case 1:
                        $hintObj.addClass("priority-medium");
                        break;
                    case 2:
                        $hintObj.addClass("priority-low");
                        break;
                    default:
                        $hintObj.addClass("priority-lowest");
                        break;
                    }
                }

                if (token.guess) {
                    $hintObj.addClass("guess-hint");
                }

                // is the token a keyword?
                if (token.keyword) {
                    $hintObj.addClass("keyword-hint");
                }

                if (token.literal) {
                    $hintObj.addClass("literal-hint");
                }

                // highlight the matched portion of each hint
                if (token.stringRanges) {
                    token.stringRanges.forEach(function (item) {
                        if (item.matched) {
                            $hintObj.append($("<span>")
                                .append(_.escape(item.text))
                                .addClass("matched-hint"));
                        } else {
                            $hintObj.append(_.escape(item.text));
                        }
                    });
                } else {
                    $hintObj.text(token.value);
                }

                $hintObj.data("token", token);

                formatTypeDataForToken($hintObj, token);

                return $hintObj;
            });
        }

        // trim leading and trailing string literal delimiters from the query
        trimmedQuery = _.trim(query, HintUtils.SINGLE_QUOTE + HintUtils.DOUBLE_QUOTE);

        if (hints) {
            formattedHints = formatHints(hints, trimmedQuery);
        } else {
            formattedHints = [];
        }

        return {
            hints: formattedHints,
            match: null, // the CodeHintManager should not format the results
            selectInitial: true,
            handleWideResults: hints.handleWideResults
        };
    }

    /**
     * @constructor
     */
    function JSHints() {
    }

    /**
     * determine if the cached hint information should be invalidated and re-calculated
     *
     * @param {Session} session - the active hinting session
     * @return {boolean} - true if the hints should be recalculated
     */
    JSHints.prototype.needNewHints = function (session) {
        var cursor  = session.getCursor(),
            type    = session.getType();

        return !cachedHints || !cachedCursor || !cachedType ||
            cachedCursor.line !== cursor.line ||
            type.property !== cachedType.property ||
            type.context !== cachedType.context ||
            type.showFunctionType !== cachedType.showFunctionType ||
            (type.functionCallPos && cachedType.functionCallPos &&
            type.functionCallPos.ch !== cachedType.functionCallPos.ch);
    };

    /**
     *  Cache the hints and the hint's context.
     *
     *  @param {Array.<string>} hints - array of hints
     *  @param {{line:number, ch:number}} cursor - the location where the hints
     *  were created.
     * @param {{property: boolean,
                showFunctionType:boolean,
                context: string,
                functionCallPos: {line:number, ch:number}}} type -
     *  type information about the hints
     *  @param {Object} token - CodeMirror token
     */
    function setCachedHintContext(hints, cursor, type, token) {
        cachedHints = hints;
        cachedCursor = cursor;
        cachedType = type;
        cachedToken = token;
    }

    /**
     *  Reset cached hint context.
     */
    function resetCachedHintContext() {
        cachedHints = null;
        cachedCursor = null;
        cachedType = null;
        cachedToken =  null;
    }

    /**
     *  Have conditions have changed enough to justify closing the hints popup?
     *
     * @param {Session} session - the active hinting session
     * @return {boolean} - true if the hints popup should be closed.
     */
    JSHints.prototype.shouldCloseHints = function (session) {

        // close if the token className has changed then close the hints.
        var cursor = session.getCursor(),
            token = session.getToken(cursor),
            lastToken = cachedToken;

        // if the line has changed, then close the hints
        if (!cachedCursor || cursor.line !== cachedCursor.line) {
            return true;
        }

        if (token.type === null) {
            token = session.getNextTokenOnLine(cursor);
        }

        if (lastToken && lastToken.type === null) {
            lastToken = session.getNextTokenOnLine(cachedCursor);
        }

        // Both of the tokens should never be null (happens when token is off
        // the end of the line), so one is null then close the hints.
        if (!lastToken || !token ||
                token.type !== lastToken.type) {
            return true;
        }

        // Test if one token string is a prefix of the other.
        // If one is a prefix of the other then consider it the
        // same token and don't close the hints.
        if (token.string.length >= lastToken.string.length) {
            return token.string.indexOf(lastToken.string) !== 0;
        } else {
            return lastToken.string.indexOf(token.string) !== 0;
        }
    };

    /**
     * @return {boolean} - true if the document supports inline JavaScript
     */
    function isInlineScriptSupported(document) {
        var language = LanguageManager.getLanguageForPath(document.file.fullPath).getId();
        return _inlineScriptLanguages.indexOf(language) !== -1;
    }

    function isInlineScript(editor) {
        return editor.getModeForSelection() === "javascript";
    }

    /**
     *  Create a new StringMatcher instance, if needed.
     *
     * @return {StringMatcher} - a StringMatcher instance.
     */
    function getStringMatcher() {
        if (!matcher) {
            matcher = new StringMatch.StringMatcher({
                preferPrefixMatches: true
            });
        }

        return matcher;
    }

    /**
     *  Check if a hint response is pending.
     *
     * @param {jQuery.Deferred} deferredHints - deferred hint response
     * @return {boolean} - true if deferred hints are pending, false otherwise.
     */
    function hintsArePending(deferredHints) {
        return (deferredHints && !deferredHints.hasOwnProperty("hints") &&
            deferredHints.state() === "pending");
    }

    /**
     *  Common code to get the session hints. Will get guesses if there were
     *  no completions for the query.
     *
     * @param {string} query - user text to search hints with
     *  @param {{line:number, ch:number}} cursor - the location where the hints
     *  were created.
     * @param {{property: boolean,
                 showFunctionType:boolean,
                 context: string,
                 functionCallPos: {line:number, ch:number}}} type -
     *  type information about the hints
     *  @param {Object} token - CodeMirror token
     * @param {jQuery.Deferred=} $deferredHints - existing Deferred we need to
     * resolve (optional). If not supplied a new Deferred will be created if
     * needed.
     * @return {Object + jQuery.Deferred} - hint response (immediate or
     *     deferred) as defined by the CodeHintManager API
     */
    function getSessionHints(query, cursor, type, token, $deferredHints) {

        var hintResults = session.getHints(query, getStringMatcher());
        if (hintResults.needGuesses) {
            var guessesResponse = ScopeManager.requestGuesses(session,
                session.editor.document);

            if (!$deferredHints) {
                $deferredHints = $.Deferred();
            }

            guessesResponse.done(function () {
                if (hintsArePending($deferredHints)) {
                    hintResults = session.getHints(query, getStringMatcher());
                    setCachedHintContext(hintResults.hints, cursor, type, token);
                    var hintResponse = getHintResponse(cachedHints, query, type);
                    $deferredHints.resolveWith(null, [hintResponse]);
                }
            }).fail(function () {
                if (hintsArePending($deferredHints)) {
                    $deferredHints.reject();
                }
            });

            return $deferredHints;
        } else if (hintsArePending($deferredHints)) {
            setCachedHintContext(hintResults.hints, cursor, type, token);
            var hintResponse    = getHintResponse(cachedHints, query, type);
            $deferredHints.resolveWith(null, [hintResponse]);
            return null;
        } else {
            setCachedHintContext(hintResults.hints, cursor, type, token);
            return getHintResponse(cachedHints, query, type);
        }
    }

    /**
     * Determine whether hints are available for a given editor context
     *
     * @param {Editor} editor - the current editor context
     * @param {string} key - charCode of the last pressed key
     * @return {boolean} - can the provider provide hints for this session?
     */
    JSHints.prototype.hasHints = function (editor, key) {
        if (session && HintUtils.hintableKey(key, !noHintsOnDot)) {

            if (isInlineScriptSupported(session.editor.document)) {
                if (!isInlineScript(session.editor)) {
                    return false;
                }
            }
            var cursor  = session.getCursor(),
                token   = session.getToken(cursor);

            // don't autocomplete within strings or comments, etc.
            if (token && HintUtils.hintable(token)) {
                if (session.isFunctionName()) {
                    return false;
                }

                if (this.needNewHints(session)) {
                    resetCachedHintContext();
                    matcher = null;
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

        if (token && HintUtils.hintableKey(key, !noHintsOnDot) && HintUtils.hintable(token)) {
            var type    = session.getType(),
                query   = session.getQuery();

            // If the hint context is changed and the hints are open, then
            // close the hints by returning null;
            if (CodeHintManager.isOpen() && this.shouldCloseHints(session)) {
                return null;
            }

            // Compute fresh hints if none exist, or if the session
            // type has changed since the last hint computation
            if (this.needNewHints(session)) {
                if (key) {
                    ScopeManager.handleFileChange([{from: cursor, to: cursor, text: [key]}]);
                    ignoreChange = true;
                }

                var scopeResponse   = ScopeManager.requestHints(session, session.editor.document),
                    $deferredHints  = $.Deferred(),
                    scopeSession    = session;

                scopeResponse.done(function () {
                    if (hintsArePending($deferredHints)) {
                        // Verify we are still in same session
                        if (scopeSession === session) {
                            getSessionHints(query, cursor, type, token, $deferredHints);
                        } else {
                            $deferredHints.reject();
                        }
                    }
                    scopeSession = null;
                }).fail(function () {
                    if (hintsArePending($deferredHints)) {
                        $deferredHints.reject();
                    }
                    scopeSession = null;
                });

                return $deferredHints;
            }

            if (cachedHints) {
                return getSessionHints(query, cursor, type, token);
            }
        }

        return null;
    };

    /**
     * Inserts the hint selected by the user into the current editor.
     *
     * @param {jQuery.Object} $hintObj - hint object to insert into current editor
     * @return {boolean} - should a new hinting session be requested
     *      immediately after insertion?
     */
    JSHints.prototype.insertHint = function ($hintObj) {
        var hint        = $hintObj.data("token"),
            completion  = hint.value,
            cursor      = session.getCursor(),
            query       = session.getQuery(),
            start       = {line: cursor.line, ch: cursor.ch - query.length},
            end         = {line: cursor.line, ch: cursor.ch},
            invalidPropertyName = false;

        if (session.getType().property) {
            // if we're inserting a property name, we need to make sure the
            // hint is a valid property name.
            // to check this, run the hint through Acorns tokenizer
            // it should result in one token, and that token should either be
            // a 'name' or a 'keyword', as javascript allows keywords as property names
            var tokenizer = Acorn.tokenizer(completion);
            var currentToken = tokenizer.getToken();

            // the name is invalid if the hint is not a 'name' or 'keyword' token
            if (currentToken.type !== Acorn.tokTypes.name && !currentToken.type.keyword) {
                invalidPropertyName = true;
            } else {
                // check for a second token - if there is one (other than 'eof')
                // then the hint isn't a valid property name either
                currentToken = tokenizer.getToken();
                if (currentToken.type !== Acorn.tokTypes.eof) {
                    invalidPropertyName = true;
                }
            }

            if (invalidPropertyName) {
                // need to walk back to the '.' and replace
                // with '["<hint>"]
                var dotCursor = session.findPreviousDot();
                if (dotCursor) {
                    completion = "[\"" + completion + "\"]";
                    start.line = dotCursor.line;
                    start.ch = dotCursor.ch - 1;
                }
            }
        }

        // Replace the current token with the completion
        // HACK (tracking adobe/brackets#1688): We talk to the private CodeMirror instance
        // directly to replace the range instead of using the Document, as we should. The
        // reason is due to a flaw in our current document synchronization architecture when
        // inline editors are open.
        session.editor._codeMirror.replaceRange(completion, start, end);

        // Return false to indicate that another hinting session is not needed
        return false;
    };

    // load the extension
    AppInit.appReady(function () {

        /*
         * When the editor is changed, reset the hinting session and cached
         * information, and reject any pending deferred requests.
         *
         * @param {!Editor} editor - editor context to be initialized.
         * @param {?Editor} previousEditor - the previous editor.
         */
        function initializeSession(editor, previousEditor) {
            session = new Session(editor);
            ScopeManager.handleEditorChange(session, editor.document,
                previousEditor ? previousEditor.document : null);
            ParameterHintManager.setSession(session);
            cachedHints = null;
        }

        /*
         * Connects to the given editor, creating a new Session & adding listeners
         *
         * @param {?Editor} editor - editor context on which to listen for
         *      changes. If null, 'session' is cleared.
         * @param {?Editor} previousEditor - the previous editor
         */
        function installEditorListeners(editor, previousEditor) {
            // always clean up cached scope and hint info
            resetCachedHintContext();

            if (!jsHintsEnabled) {
                return;
            }

            if (editor && HintUtils.isSupportedLanguage(LanguageManager.getLanguageForPath(editor.document.file.fullPath).getId())) {
                initializeSession(editor, previousEditor);
                editor
                    .on(HintUtils.eventName("change"), function (event, editor, changeList) {
                        if (!ignoreChange) {
                            ScopeManager.handleFileChange(changeList);
                            ParameterHintManager.popUpHintAtOpenParen();
                        }
                        ignoreChange = false;
                    });
                ParameterHintManager.installListeners(editor);
            } else {
                session = null;
            }
        }

        /*
         * Uninstall editor change listeners
         *
         * @param {Editor} editor - editor context on which to stop listening
         *      for changes
         */
        function uninstallEditorListeners(editor) {
            if (editor) {
                editor.off(HintUtils.eventName("change"));
                ParameterHintManager.uninstallListeners(editor);
            }
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
            // Uninstall "languageChanged" event listeners on previous editor's document & put them on current editor's doc
            if (previous) {
                previous.document
                    .off(HintUtils.eventName("languageChanged"));
            }
            if (current) {
                current.document
                    .on(HintUtils.eventName("languageChanged"), function () {
                        // If current doc's language changed, reset our state by treating it as if the user switched to a
                        // different document altogether
                        uninstallEditorListeners(current);
                        installEditorListeners(current);
                    });
            }

            uninstallEditorListeners(previous);
            installEditorListeners(current, previous);
        }

        /*
         * Handle JumptoDefiniton menu/keyboard command.
         */
        function handleJumpToDefinition() {
            var offset,
                handleJumpResponse;


            // Only provide jump-to-definition results when cursor is in JavaScript content
            if (!session || session.editor.getModeForSelection() !== "javascript") {
                return null;
            }

            var result = new $.Deferred();

            /**
             * Make a jump-to-def request based on the session and offset passed in.
             * @param {Session} session - the session
             * @param {number} offset - the offset of where to jump from
             */
            function requestJumpToDef(session, offset) {
                var response = ScopeManager.requestJumptoDef(session, session.editor.document, offset);

                if (response.hasOwnProperty("promise")) {
                    response.promise.done(handleJumpResponse).fail(function () {
                        result.reject();
                    });
                }
            }


            /**
             * Sets the selection to move the cursor to the result position.
             * Assumes that the editor has already changed files, if necessary.
             *
             * Additionally, this will check to see if the selection looks like an
             * assignment to a member expression - if it is, and the type is a function,
             * then we will attempt to jump to the RHS of the expression.
             *
             * 'exports.foo = foo'
             *
             * if the selection is 'foo' in 'exports.foo', then we will attempt to jump to def
             * on the rhs of the assignment.
             *
             * @param {number} start - the start of the selection
             * @param {number} end - the end of the selection
             * @param {boolean} isFunction - true if we are jumping to the source of a function def
             */
            function setJumpSelection(start, end, isFunction) {

                /**
                 * helper function to decide if the tokens on the RHS of an assignment
                 * look like an identifier, or member expr.
                 */
                function validIdOrProp(token) {
                    if (!token) {
                        return false;
                    }
                    if (token.string === ".") {
                        return true;
                    }
                    var type = token.type;
                    if (type === "variable-2" || type === "variable" || type === "property") {
                        return true;
                    }

                    return false;
                }

                var madeNewRequest = false;

                if (isFunction) {
                    // When jumping to function defs, follow the chain back
                    // to get to the original function def
                    var cursor = {line: end.line, ch: end.ch},
                        prev = session._getPreviousToken(cursor),
                        next,
                        offset;

                    // see if the selection is preceded by a '.', indicating we're in a member expr
                    if (prev.string === ".") {
                        cursor = {line: end.line, ch: end.ch};
                        next = session.getNextToken(cursor, true);
                        // check if the next token indicates an assignment
                        if (next && next.string === "=") {
                            next = session.getNextToken(cursor, true);
                            // find the last token of the identifier, or member expr
                            while (validIdOrProp(next)) {
                                offset = session.getOffsetFromCursor({line: cursor.line, ch: next.end});
                                next = session.getNextToken(cursor, false);
                            }
                            if (offset) {
                                // trigger another jump to def based on the offset of the RHS
                                requestJumpToDef(session, offset);
                                madeNewRequest = true;
                            }
                        }
                    }
                }
                // We didn't make a new jump-to-def request, so we can resolve the promise
                // and set the selection
                if (!madeNewRequest) {
                    // set the selection
                    session.editor.setSelection(start, end, true);
                    result.resolve(true);
                }
            }

            /**
             * handle processing of the completed jump-to-def request.
             * will open the appropriate file, and set the selection based
             * on the response.
             */
            handleJumpResponse = function (jumpResp) {

                if (jumpResp.resultFile) {
                    if (jumpResp.resultFile !== jumpResp.file) {
                        var resolvedPath = ScopeManager.getResolvedPath(jumpResp.resultFile);
                        if (resolvedPath) {
                            CommandManager.execute(Commands.FILE_OPEN, {fullPath: resolvedPath})
                                .done(function () {
                                    setJumpSelection(jumpResp.start, jumpResp.end, jumpResp.isFunction);
                                });
                        }
                    } else {
                        setJumpSelection(jumpResp.start, jumpResp.end, jumpResp.isFunction);
                    }
                } else {
                    result.reject();
                }
            };

            offset = session.getOffset();
            // request a jump-to-def
            requestJumpToDef(session, offset);

            return result.promise();
        }

        /*
         * Helper for QuickEdit jump-to-definition request.
         */
        function quickEditHelper() {
            var offset     = session.getCursor(),
                response   = ScopeManager.requestJumptoDef(session, session.editor.document, offset);

            return response;
        }

        // Register quickEditHelper.
        brackets._jsCodeHintsHelper = quickEditHelper;

        // Configuration function used for debugging
        brackets._configureJSCodeHints = setConfig;

        ExtensionUtils.loadStyleSheet(module, "styles/brackets-js-hints.css");

        // uninstall/install change listener as the active editor changes
        EditorManager.on(HintUtils.eventName("activeEditorChange"),
                handleActiveEditorChange);

        ProjectManager.on("beforeProjectClose", function () {
            ScopeManager.handleProjectClose();
        });

        ProjectManager.on("projectOpen", function () {
            ScopeManager.handleProjectOpen();
        });

        // immediately install the current editor
        installEditorListeners(EditorManager.getActiveEditor());

        // init
        EditorManager.registerJumpToDefProvider(handleJumpToDefinition);

        var jsHints = new JSHints();
        CodeHintManager.registerHintProvider(jsHints, HintUtils.SUPPORTED_LANGUAGES, 0);

        ParameterHintManager.addCommands();

        // for unit testing
        exports.getSession = getSession;
        exports.jsHintProvider = jsHints;
        exports.initializeSession = initializeSession;
        exports.handleJumpToDefinition = handleJumpToDefinition;
    });
});
