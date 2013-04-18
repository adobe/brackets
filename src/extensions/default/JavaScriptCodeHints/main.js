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
        HintUtils       = require("HintUtils"),
        ScopeManager    = require("ScopeManager"),
        Session         = require("Session");

    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));

    var JUMPTO_DEFINITION = "navigate.jumptoDefinition";

    var session     = null,  // object that encapsulates the current session state
        cachedHints = null,  // sorted hints for the current hinting session
        cachedType  = null,  // describes the lookup type and the object context
        cachedLine  = null,  // the line number for the cached scope
        matcher     = null;  // string matcher for hints

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
                if (!type.property && token.depth !== undefined) {
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
     * Determine whether hints are available for a given editor context
     * 
     * @param {Editor} editor - the current editor context
     * @param {string} key - charCode of the last pressed key
     * @return {boolean} - can the provider provide hints for this session?
     */
    JSHints.prototype.hasHints = function (editor, key) {
        if (session && HintUtils.hintableKey(key)) {
            var cursor  = session.getCursor(),
                token   = session.getToken(cursor);

            // don't autocomplete within strings or comments, etc.
            if (token && HintUtils.hintable(token)) {
                var offset = session.getOffset(),
                    type    = session.getType(),
                    query   = session.getQuery();

                // Invalidate cached information if: 1) no scope exists; 2) the
                // cursor has moved a line; 3) the scope is dirty; or 4) if the
                // cursor has moved into a different scope. Cached information
                // is also reset on editor change.
                if (!cachedHints ||
                        cachedLine !== cursor.line ||
                        type.property !== cachedType.property ||
                        type.context !== cachedType.context ||
                        type.showFunctionType !== cachedType.showFunctionType) {
                    //console.log("clear hints");
                    cachedLine = null;
                    cachedHints = null;
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

            // Compute fresh hints if none exist, or if the session
            // type has changed since the last hint computation
            if (!cachedHints ||
                    type.property !== cachedType.property ||
                    type.context !== cachedType.context ||
                    type.showFunctionType !== cachedType.showFunctionType ||                                               query.length === 0) {
                var offset          = session.getOffset(),
                    scopeResponse   = ScopeManager.requestHints(session, session.editor.document, offset),
                    self            = this;

                if (scopeResponse.hasOwnProperty("promise")) {
                    var $deferredHints = $.Deferred();
                    scopeResponse.promise.done(function () {
                        cachedLine = cursor.line;
                        cachedType = session.getType();
                        matcher = new StringMatch.StringMatcher();
                        cachedHints = session.getHints(query, matcher);

                        $(self).triggerHandler("resolvedResponse", [cachedHints, cachedType]);

                        if ($deferredHints.state() === "pending") {
                            query = session.getQuery();
                            var hintResponse    = getHintResponse(cachedHints, query, type);

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
                    cachedLine = cursor.line;
                }
            }

            if (cachedHints) {
                cachedHints = session.getHints(session.getQuery(), matcher);
                return getHintResponse(cachedHints, query, type);
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
            delimiter;

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
            cachedHints = null;
        }

        /*
         * Install editor change listeners
         * 
         * @param {Editor} editor - editor context on which to listen for
         *      changes
         */
        function installEditorListeners(editor) {
            // always clean up cached scope and hint info
            cachedLine = null;
            cachedHints = null;
            cachedType = null;

            if (editor && editor.getLanguageForSelection().getId() === HintUtils.LANGUAGE_ID) {
                initializeSession(editor);
                $(editor)
                    .on(HintUtils.eventName("change"), function () {
                        ScopeManager.handleFileChange(editor.document);
                    });
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
                                        session.editor.setCursorPos(jumpResp.start);
                                        session.editor.setSelection(jumpResp.start, jumpResp.end);
                                        session.editor.centerOnCursor();
                                    });
                            }
                        } else {
                            session.editor.setCursorPos(jumpResp.start);
                            session.editor.setSelection(jumpResp.start, jumpResp.end);
                            session.editor.centerOnCursor();
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
            menu.addMenuItem(JUMPTO_DEFINITION, KeyboardPrefs.jumptoDefinition, Menus.BEFORE, Commands.NAVIGATE_GOTO_DEFINITION);
        }
        
        ExtensionUtils.loadStyleSheet(module, "styles/brackets-js-hints.css");
        
        // uninstall/install change listener as the active editor changes
        $(EditorManager)
            .on(HintUtils.eventName("activeEditorChange"),
                handleActiveEditorChange);
        
        // immediately install the current editor
        installEditorListeners(EditorManager.getActiveEditor());

        var jsHints = new JSHints();
        CodeHintManager.registerHintProvider(jsHints, [HintUtils.LANGUAGE_ID], 0);

        // for unit testing
        exports.jsHintProvider = jsHints;
        exports.initializeSession = initializeSession;
        exports.handleJumpToDefinition = handleJumpToDefinition;
    });
});
