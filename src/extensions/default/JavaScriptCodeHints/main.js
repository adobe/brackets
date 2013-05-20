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
        DocumentManager = brackets.getModule("document/DocumentManager"),
        Commands        = brackets.getModule("command/Commands"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        Menus           = brackets.getModule("command/Menus"),
        Strings         = brackets.getModule("strings"),
        AppInit         = brackets.getModule("utils/AppInit"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        StringUtils     = brackets.getModule("utils/StringUtils"),
        StringMatch     = brackets.getModule("utils/StringMatch"),
        LanguageManager = brackets.getModule("language/LanguageManager"),
        ExtensionData   = brackets.getModule("extensibility/ExtensionData"),
        HintUtils       = require("HintUtils"),
        ScopeManager    = require("ScopeManager"),
        Session         = require("Session"),
        Acorn           = require("thirdparty/acorn/acorn");

    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));

    var JUMPTO_DEFINITION = "navigate.jumptoDefinition";

    var session      = null,  // object that encapsulates the current session state
        cachedCursor = null,  // last cursor of the current hinting session
        cachedHints  = null,  // sorted hints for the current hinting session
        cachedType   = null,  // describes the lookup type and the object context
        cachedToken  = null,  // the token used in the current hinting session
        matcher      = null;  // string matcher for hints

    /**
     *  Get the value of current session.
     *  Used for unit testing.
     * @returns {Session} - the current session.
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

        /*
         * Returns a formatted list of hints with the query substring
         * highlighted.
         * 
         * @param {Array.<Object>} hints - the list of hints to format
         * @param {string} query - querystring used for highlighting matched
         *      poritions of each hint
         * @return {Array.<jQuery.Object>} - array of hints formatted as jQuery
         *      objects
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
                                .append(StringUtils.htmlEscape(item.text))
                                .addClass("matched-hint"));
                        } else {
                            $hintObj.append(StringUtils.htmlEscape(item.text));
                        }
                    });
                } else {
                    $hintObj.text(token.value);
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

        if (hints) {
            formattedHints = formatHints(hints, trimmedQuery);
        } else {
            formattedHints = [];
        }

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
     * determine if the cached hint information should be invalidated and re-calculated
     *
     * @param {Session} session - the active hinting session
     * @return {boolean} - true if the hints should be recalculated
     */
    JSHints.prototype.needNewHints = function (session) {
        var cursor  = session.getCursor(),
            type    = session.getType();

        return !cachedHints ||
                cachedCursor.line !== cursor.line ||
                type.property !== cachedType.property ||
                type.context !== cachedType.context ||
                type.showFunctionType !== cachedType.showFunctionType;
    };

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
     * @return {boolean} - true if the document is a html file
     */
    function isHTMLFile(document) {
        var languageID = LanguageManager.getLanguageForPath(document.file.fullPath).getId();
        return languageID === "html";
    }
    
    function isInlineScript(editor) {
        return editor.getModeForSelection() === "javascript";
    }


    /**
     *  Common code to get the session hints. Will get guesses if there were
     *  no completions for the query.
     *
     * @param {string} query - user text to search hints with
     * @param {Object} type - the type of query, property vs. identifier
     * @param {jQuery.Deferred=} $deferredHints - existing Deferred we need to
     * resolve (optional). If not supplied a new Deferred will be created if
     * needed.
     * @return {Object + jQuery.Deferred} - hint response (immediate or
     *     deferred) as defined by the CodeHintManager API
     */
    function getSessionHints(query, type, $deferredHints) {

        var hintResults = session.getHints(query, matcher);
        if (hintResults.needGuesses) {
            var guessesResponse = ScopeManager.requestGuesses(session,
                session.editor.document);

            if (!$deferredHints) {
                $deferredHints = $.Deferred();
            }

            guessesResponse.done(function () {
                query = session.getQuery();
                hintResults = session.getHints(query, matcher);
                cachedHints = hintResults.hints;
                var hintResponse = getHintResponse(cachedHints, query, type);

                $deferredHints.resolveWith(null, [hintResponse]);
            });

            return $deferredHints;
        } else if ($deferredHints && $deferredHints.state() === "pending") {
            cachedHints = hintResults.hints;
            var hintResponse    = getHintResponse(cachedHints, query, type);

            $deferredHints.resolveWith(null, [hintResponse]);
            return null;
        } else {
            cachedHints = hintResults.hints;
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
        if (session && HintUtils.hintableKey(key)) {
            
            if (isHTMLFile(session.editor.document)) {
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
                var offset = session.getOffset(),
                    type    = session.getType(),
                    query   = session.getQuery();

                if (this.needNewHints(session)) {
                    cachedCursor = null;
                    cachedHints = null;
                    cachedToken = null;
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

        if (token && HintUtils.hintableKey(key) && HintUtils.hintable(token)) {
            var type    = session.getType(),
                query   = session.getQuery();

            // If the hint context is changed and the hints are open, then
            // close the hints by returning null;
            if (CodeHintManager.isOpen() && this.shouldCloseHints(session)) {
                return null;
            }

            cachedCursor = cursor;
            cachedToken = token;

            // Compute fresh hints if none exist, or if the session
            // type has changed since the last hint computation
            if (this.needNewHints(session)) {
                var scopeResponse   = ScopeManager.requestHints(session, session.editor.document);

                if (scopeResponse.hasOwnProperty("promise")) {
                    var $deferredHints = $.Deferred();
                    scopeResponse.promise.done(function () {
                        cachedType = session.getType();
                        matcher = new StringMatch.StringMatcher({
                            preferPrefixMatches: true
                        });

                        getSessionHints(session.getQuery(), type, $deferredHints);
                    }).fail(function () {
                        if ($deferredHints.state() === "pending") {
                            $deferredHints.reject();
                        }
                    });

                    return $deferredHints;
                }
            }

            if (cachedHints) {
                return getSessionHints(query, type);
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
            token       = session.getToken(cursor),
            query       = session.getQuery(),
            start       = {line: cursor.line, ch: cursor.ch - query.length},
            end         = {line: cursor.line, ch: (token ? token.end : cursor.ch)},
            delimiter;

        if (token && token.string === ".") {
            var nextToken  = session.getNextTokenOnLine(cursor);

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
                delimiter = HintUtils.DOUBLE_QUOTE;
            } else if (token.string.indexOf(HintUtils.SINGLE_QUOTE) === 0) {
                delimiter = HintUtils.SINGLE_QUOTE;
            } else {
                delimiter = hint.delimiter;
            }

            completion = completion.replace("\\", "\\\\");
            completion = completion.replace(delimiter, "\\" + delimiter);
            completion = delimiter + completion + delimiter;
        }

        if (session.getType().showFunctionType) {
            // function types show up as hints, so don't insert anything
            // if we were displaying a function type            
            return false;
        }
        
        if (session.getType().property) {
            // if we're inserting a property name, we need to make sure the 
            // hint is a valid property name.  
            // to check this, run the hint through Acorns tokenizer
            // it should result in one token, and that token should either be 
            // a 'name' or a 'keyword', as javascript allows keywords as property names
            var tokenizer = Acorn.tokenize(completion);
            var currentToken = tokenizer(),
                invalidPropertyName = false;
            
            // the name is invalid if the hint is not a 'name' or 'keyword' token
            if (currentToken.type !== Acorn.tokTypes.name && !currentToken.type.keyword) {
                invalidPropertyName = true;
            } else {
                // check for a second token - if there is one (other than 'eof')
                // then the hint isn't a valid property name either
                currentToken = tokenizer();
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
         * @param {Editor} editor - editor context to be initialized.
         * @param {boolean} primePump - true if the pump should be primed.
         * @param {boolean} forceInitialization - true if initialization should always occur
         */
        function initializeSession(editor, primePump, forceInitialization) {
            session = new Session(editor);
            ScopeManager.handleEditorChange(session, editor.document, primePump, forceInitialization);
            cachedHints = null;
        }

        var services = ExtensionData.getServices("JavaScriptCodeHints");
        services.channels.brackets.extension.loaded.subscribe(function (e) {
            ScopeManager.initTernEnv();
            initializeSession(EditorManager.getActiveEditor(), false, true);
        });
        
        /*
         * Install editor change listeners
         * 
         * @param {Editor} editor - editor context on which to listen for
         *      changes
         */
        function installEditorListeners(editor) {
            // always clean up cached scope and hint info
            cachedCursor = null;
            cachedHints = null;
            cachedType = null;

            if (editor && HintUtils.isSupportedLanguage(LanguageManager.getLanguageForPath(editor.document.file.fullPath).getId())) {
                initializeSession(editor, true);
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
        
        /*
         * Handle JumptoDefiniton menu/keyboard command.
         */
        function handleJumpToDefinition() {
            var offset     = session.getOffset(),
                response   = ScopeManager.requestJumptoDef(session, session.editor.document, offset);

            if (response.hasOwnProperty("promise")) {
                response.promise.done(function (jumpResp) {

                    if (jumpResp.resultFile) {
                        if (jumpResp.resultFile !== jumpResp.file) {
                            var resolvedPath = ScopeManager.getResolvedPath(jumpResp.resultFile);
                            if (resolvedPath) {
                                CommandManager.execute(Commands.FILE_OPEN, {fullPath: resolvedPath})
                                    .done(function () {
                                        session.editor.setSelection(jumpResp.start, jumpResp.end, true);
                                    });
                            }
                        } else {
                            session.editor.setSelection(jumpResp.start, jumpResp.end, true);
                        }
                    }

                }).fail(function () {
                    response.reject();
                });
            }
        }
        
        // Register command handler
        CommandManager.register(Strings.CMD_JUMPTO_DEFINITION, JUMPTO_DEFINITION, handleJumpToDefinition);
        
        // Add the menu item
        var menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);
        if (menu) {
            menu.addMenuItem(JUMPTO_DEFINITION, KeyboardPrefs.jumptoDefinition, Menus.AFTER, Commands.NAVIGATE_GOTO_DEFINITION);
        }
        
        ExtensionUtils.loadStyleSheet(module, "styles/brackets-js-hints.css");
        
        // uninstall/install change listener as the active editor changes
        $(EditorManager)
            .on(HintUtils.eventName("activeEditorChange"),
                handleActiveEditorChange);
        
        // immediately install the current editor
        installEditorListeners(EditorManager.getActiveEditor());

        var jsHints = new JSHints();
        CodeHintManager.registerHintProvider(jsHints, HintUtils.SUPPORTED_LANGUAGES, 0);

        // for unit testing
        exports.getSession = getSession;
        exports.jsHintProvider = jsHints;
        exports.initializeSession = initializeSession;
        exports.handleJumpToDefinition = handleJumpToDefinition;
    });
});
