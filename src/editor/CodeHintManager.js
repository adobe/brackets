/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define */

/*
 * __CodeHintManager Overview:__
 *
 * The CodeHintManager mediates the interaction between the editor and a
 * collection of hint providers. If hints are requested explicitly by the
 * user, then the providers registered for the current language are queried
 * for their ability to provide hints in order of descending priority by
 * way their hasHints methods. Character insertions may also constitute an
 * implicit request for hints; consequently, providers for the current
 * language are also queried on character insertion for both their ability to
 * provide hints and also for the suitability of providing implicit hints
 * in the given editor context.
 *
 * Once a provider responds affirmatively to a request for hints, the
 * manager begins a hinting session with that provider, begins to query
 * that provider for hints by way of its getHints method, and opens the
 * hint list window. The hint list is kept open for the duration of the
 * current session. The manager maintains the session until either:
 *
 *  1. the provider gives a null response to a request for hints;
 *  2. a deferred response to getHints fails to resolve;
 *  3. the user explicitly dismisses the hint list window;
 *  4. the editor is closed or becomes inactive; or
 *  5. the editor undergoes a "complex" change, e.g., a multi-character
 *     insertion, deletion or navigation.
 *
 * Single-character insertions, deletions or navigations may not
 * invalidate the current session; in which case, each such change
 * precipitates a successive call to getHints.
 *
 * If the user selects a hint from the rendered hint list then the
 * provider is responsible for inserting the hint into the editor context
 * for the current session by way of its insertHint method. The provider
 * may use the return value of insertHint to request that an additional
 * explicit hint request be triggered, potentially beginning a new
 * session.
 *
 *
 * __CodeHintProvider Overview:__
 *
 * A code hint provider should implement the following three functions:
 *
 * - `CodeHintProvider.hasHints(editor, implicitChar)`
 * - `CodeHintProvider.getHints(implicitChar)`
 * - `CodeHintProvider.insertHint(hint)`
 *
 * The behavior of these three functions is described in detail below.
 *
 * __CodeHintProvider.hasHints(editor, implicitChar)__
 *
 * The method by which a provider indicates intent to provide hints for a
 * given editor. The manager calls this method both when hints are
 * explicitly requested (via, e.g., Ctrl-Space) and when they may be
 * implicitly requested as a result of character insertion in the editor.
 * If the provider responds negatively then the manager may query other
 * providers for hints. Otherwise, a new hinting session begins with this
 * provider, during which the manager may repeatedly query the provider
 * for hints via the getHints method. Note that no other providers will be
 * queried until the hinting session ends.
 *
 * The implicitChar parameter is used to determine whether the hinting
 * request is explicit or implicit. If the string is null then hints were
 * explicitly requested and the provider should reply based on whether it
 * is possible to return hints for the given editor context. Otherwise,
 * the string contains just the last character inserted into the editor's
 * document and the request for hints is implicit. In this case, the
 * provider should determine whether it is both possible and appropriate
 * to show hints. Because implicit hints can be triggered by every
 * character insertion, hasHints may be called frequently; consequently,
 * the provider should endeavor to return a value as quickly as possible.
 *
 * Because calls to hasHints imply that a hinting session is about to
 * begin, a provider may wish to clean up cached data from previous
 * sessions in this method. Similarly, if the provider returns true, it
 * may wish to prepare to cache data suitable for the current session. In
 * particular, it should keep a reference to the editor object so that it
 * can access the editor in future calls to getHints and insertHints.
 *
 * param {Editor} editor
 * A non-null editor object for the active window.
 *
 * param {string} implicitChar
 * Either null, if the hinting request was explicit, or a single character
 * that represents the last insertion and that indicates an implicit
 * hinting request.
 *
 * return {boolean}
 * Determines whether the current provider is able to provide hints for
 * the given editor context and, in case implicitChar is non- null,
 * whether it is appropriate to do so.
 *
 *
 * __CodeHintProvider.getHints(implicitChar)__
 *
 * The method by which a provider provides hints for the editor context
 * associated with the current session. The getHints method is called only
 * if the provider asserted its willingness to provide hints in an earlier
 * call to hasHints. The provider may return null or false, which indicates
 * that the manager should end the current hinting session and close the hint
 * list window; or true, which indicates that the manager should end the
 * current hinting session but immediately attempt to begin a new hinting
 * session by querying registered providers. Otherwise, the provider should
 * return a response object that contains the following properties:
 *
 *  1. hints, a sorted array hints that the provider could later insert
 *     into the editor;
 *  2. match, a string that the manager may use to emphasize substrings of
 *     hints in the hint list (case-insensitive); and
 *  3. selectInitial, a boolean that indicates whether or not the the
 *     first hint in the list should be selected by default.
 *  4. handleWideResults, a boolean (or undefined) that indicates whether
 *     to allow result string to stretch width of display.
 *
 * If the array of
 * hints is empty, then the manager will render an empty list, but the
 * hinting session will remain open and the value of the selectInitial
 * property is irrelevant.
 *
 * Alternatively, the provider may return a jQuery.Deferred object
 * that resolves with an object with the structure described above. In
 * this case, the manager will initially render the hint list window with
 * a throbber and will render the actual list once the deferred object
 * resolves to a response object. If a hint list has already been rendered
 * (from an earlier call to getHints), then the old list will continue
 * to be displayed until the new deferred has resolved.
 *
 * Both the manager and the provider can reject the deferred object. The
 * manager will reject the deferred if the editor changes state (e.g., the
 * user types a character) or if the hinting session ends (e.g., the user
 * explicitly closes the hints by pressing escape). The provider can use
 * this event to, e.g., abort an expensive computation. Consequently, the
 * provider may assume that getHints will not be called again until the
 * deferred object from the current call has resolved or been rejected. If
 * the provider rejects the deferred, the manager will end the hinting
 * session.
 *
 * The getHints method may be called by the manager repeatedly during a
 * hinting session. Providers may wish to cache information for efficiency
 * that may be useful throughout these sessions. The same editor context
 * will be used throughout a session, and will only change during the
 * session as a result of single-character insertions, deletions and
 * cursor navigations. The provider may assume that, throughout the
 * lifetime of the session, the getHints method will be called exactly
 * once for each such editor change. Consequently, the provider may also
 * assume that the document will not be changed outside of the editor
 * during a session.
 *
 * param {string} implicitChar
 * Either null, if the request to update the hint list was a result of
 * navigation, or a single character that represents the last insertion.
 *
 *     return {jQuery.Deferred|{
 *          hints: Array.<string|jQueryObject>,
 *          match: string,
 *          selectInitial: boolean,
 *          handleWideResults: boolean}}
 *
 * Null if the provider wishes to end the hinting session. Otherwise, a
 * response object, possibly deferred, that provides 1. a sorted array
 * hints that consists either of strings or jQuery objects; 2. a string
 * match, possibly null, that is used by the manager to emphasize
 * matching substrings when rendering the hint list; and 3. a boolean that
 * indicates whether the first result, if one exists, should be selected
 * by default in the hint list window. If match is non-null, then the
 * hints should be strings.
 *
 * If the match is null, the manager will not
 * attempt to emphasize any parts of the hints when rendering the hint
 * list; instead the provider may return strings or jQuery objects for
 * which emphasis is self-contained. For example, the strings may contain
 * substrings that wrapped in bold tags. In this way, the provider can
 * choose to let the manager handle emphasis for the simple and common case
 * of prefix matching, or can provide its own emphasis if it wishes to use
 * a more sophisticated matching algorithm.
 *
 *
 * __CodeHintProvider.insertHint(hint)__
 *
 * The method by which a provider inserts a hint into the editor context
 * associated with the current session. The provider may assume that the
 * given hint was returned by the provider in some previous call in the
 * current session to getHints, but not necessarily the most recent call.
 * After the insertion has been performed, the current hinting session is
 * closed. The provider should return a boolean value to indicate whether
 * or not the end of the session should be immediately followed by a new
 * explicit hinting request, which may result in a new hinting session
 * being opened with some provider, but not necessarily the current one.
 *
 * param {string} hint
 * The hint to be inserted into the editor context for the current session.
 *
 * return {boolean}
 * Indicates whether the manager should follow hint insertion with an
 * explicit hint request.
 *
 *
 * __CodeHintProvider.insertHintOnTab__
 *
 * type {?boolean} insertHintOnTab
 * Indicates whether the CodeHintManager should request that the provider of
 * the current session insert the currently selected hint on tab key events,
 * or if instead a tab character should be inserted into the editor. If omitted,
 * the fallback behavior is determined by the CodeHintManager. The default
 * behavior is to insert a tab character, but this can be changed with the
 * insertHintOnTab Preference.
 */
define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var Commands            = require("command/Commands"),
        CommandManager      = require("command/CommandManager"),
        EditorManager       = require("editor/EditorManager"),
        Strings             = require("strings"),
        KeyEvent            = require("utils/KeyEvent"),
        CodeHintList        = require("editor/CodeHintList").CodeHintList,
        PreferencesManager  = require("preferences/PreferencesManager");

    var hintProviders    = { "all" : [] },
        lastChar         = null,
        sessionProvider  = null,
        sessionEditor    = null,
        hintList         = null,
        deferredHints    = null,
        keyDownEditor    = null,
        codeHintsEnabled = true;


    PreferencesManager.definePreference("showCodeHints", "boolean", true);
    PreferencesManager.definePreference("insertHintOnTab", "boolean", false);
    PreferencesManager.definePreference("maxCodeHints", "integer", 50);

    PreferencesManager.on("change", "showCodeHints", function () {
        codeHintsEnabled = PreferencesManager.get("showCodeHints");
    });
    
    /**
     * Comparator to sort providers from high to low priority
     */
    function _providerSort(a, b) {
        return b.priority - a.priority;
    }

    /**
     * The method by which a CodeHintProvider registers its willingness to
     * providing hints for editors in a given language.
     *
     * @param {!CodeHintProvider} provider
     * The hint provider to be registered, described below.
     *
     * @param {!Array.<string>} languageIds
     * The set of language ids for which the provider is capable of
     * providing hints. If the special language id name "all" is included then
     * the provider may be called for any language.
     *
     * @param {?number} priority
     * Used to break ties among hint providers for a particular language.
     * Providers with a higher number will be asked for hints before those
     * with a lower priority value. Defaults to zero.
     */
    function registerHintProvider(providerInfo, languageIds, priority) {
        var providerObj = { provider: providerInfo,
                            priority: priority || 0 };

        if (languageIds.indexOf("all") !== -1) {
            // Ignore anything else in languageIds and just register for every language. This includes
            // the special "all" language since its key is in the hintProviders map from the beginning.
            var languageId;
            for (languageId in hintProviders) {
                if (hintProviders.hasOwnProperty(languageId)) {
                    hintProviders[languageId].push(providerObj);
                    hintProviders[languageId].sort(_providerSort);
                }
            }
        } else {
            languageIds.forEach(function (languageId) {
                if (!hintProviders[languageId]) {
                    // Initialize provider list with any existing all-language providers
                    hintProviders[languageId] = Array.prototype.concat(hintProviders.all);
                }
                hintProviders[languageId].push(providerObj);
                hintProviders[languageId].sort(_providerSort);
            });
        }
    }

    /**
     * @private
     * Remove a code hint provider
     * @param {!CodeHintProvider} provider Code hint provider to remove
     * @param {(string|Array.<string>)=} targetLanguageId Optional set of
     *     language IDs for languages to remove the provider for. Defaults
     *     to all languages.
     */
    function _removeHintProvider(provider, targetLanguageId) {
        var index,
            providers,
            targetLanguageIdArr;

        if (Array.isArray(targetLanguageId)) {
            targetLanguageIdArr = targetLanguageId;
        } else if (targetLanguageId) {
            targetLanguageIdArr = [targetLanguageId];
        } else {
            targetLanguageIdArr = Object.keys(hintProviders);
        }

        targetLanguageIdArr.forEach(function (languageId) {
            providers = hintProviders[languageId];

            for (index = 0; index < providers.length; index++) {
                if (providers[index].provider === provider) {
                    providers.splice(index, 1);
                    break;
                }
            }
        });
    }

    /**
     *  Return the array of hint providers for the given language id.
     *  This gets called (potentially) on every keypress. So, it should be fast.
     *
     * @param {!string} languageId
     * @return {?Array.<{provider: Object, priority: number}>}
     */
    function _getProvidersForLanguageId(languageId) {
        var providers = hintProviders[languageId] || hintProviders.all;
        
        // Exclude providers that are explicitly disabled in the preferences.
        // All code hint providers that do not have their constructor
        // names listed in the preferences are enabled by default.
        return providers.filter(function (provider) {
            var prefKey = "codehint." + provider.provider.constructor.name;
            return PreferencesManager.get(prefKey) !== false;
        });
    }

    var _beginSession;

    /**
     * End the current hinting session
     */
    function _endSession() {
        if (!hintList) {
            return;
        }
        hintList.close();
        hintList = null;
        keyDownEditor = null;
        sessionProvider = null;
        sessionEditor = null;
        if (deferredHints) {
            deferredHints.reject();
            deferredHints = null;
        }
    }

    /**
     * Is there a hinting session active for a given editor?
     *
     * NOTE: the sessionEditor, sessionProvider and hintList objects are
     * only guaranteed to be initialized during an active session.
     *
     * @param {Editor} editor
     * @return boolean
     */
    function _inSession(editor) {
        if (sessionEditor) {
            if (sessionEditor === editor &&
                    (hintList.isOpen() ||
                     (deferredHints && deferredHints.state() === "pending"))) {
                return true;
            } else {
                // the editor has changed
                _endSession();
            }
        }
        return false;
    }

    /**
     * From an active hinting session, get hints from the current provider and
     * render the hint list window.
     *
     * Assumes that it is called when a session is active (i.e. sessionProvider is not null).
     */
    function _updateHintList() {
        if (deferredHints) {
            deferredHints.reject();
            deferredHints = null;
        }

        var response = sessionProvider.getHints(lastChar);
        lastChar = null;

        if (!response) {
            // the provider wishes to close the session
            _endSession();
        } else {
            // if the response is true, end the session and begin another
            if (response === true) {
                var previousEditor = sessionEditor;
                _endSession();
                _beginSession(previousEditor);
            } else if (response.hasOwnProperty("hints")) { // a synchronous response
                if (hintList.isOpen()) {
                    // the session is open
                    hintList.update(response);
                } else {
                    hintList.open(response);
                }
            } else { // response is a deferred
                deferredHints = response;
                response.done(function (hints) {
                    // Guard against timing issues where the session ends before the
                    // response gets a chance to execute the callback.  If the session
                    // ends first while still waiting on the response, then hintList
                    // will get cleared up.
                    if (!hintList) {
                        return;
                    }

                    if (hintList.isOpen()) {
                        // the session is open
                        hintList.update(hints);
                    } else {
                        hintList.open(hints);
                    }
                });
            }
        }
    }

    /**
     * Try to begin a new hinting session.
     * @param {Editor} editor
     */
    _beginSession = function (editor) {
        if (!codeHintsEnabled) {
            return;
        }

        // Don't start a session if we have a multiple selection.
        if (editor.getSelections().length > 1) {
            return;
        }
        
        // Find a suitable provider, if any
        var language = editor.getLanguageForSelection(),
            enabledProviders = _getProvidersForLanguageId(language.getId());

        enabledProviders.some(function (item, index) {
            if (item.provider.hasHints(editor, lastChar)) {
                sessionProvider = item.provider;
                return true;
            }
        });

        // If a provider is found, initialize the hint list and update it
        if (sessionProvider) {
            var insertHintOnTab,
                maxCodeHints = PreferencesManager.get("maxCodeHints");
            if (sessionProvider.insertHintOnTab !== undefined) {
                insertHintOnTab = sessionProvider.insertHintOnTab;
            } else {
                insertHintOnTab = PreferencesManager.get("insertHintOnTab");
            }

            sessionEditor = editor;

            hintList = new CodeHintList(sessionEditor, insertHintOnTab, maxCodeHints);
            hintList.onSelect(function (hint) {
                var restart = sessionProvider.insertHint(hint),
                    previousEditor = sessionEditor;
                _endSession();
                if (restart) {
                    _beginSession(previousEditor);
                }
            });
            hintList.onClose(_endSession);

            _updateHintList();
        } else {
            lastChar = null;
        }
    };

    /**
     * Explicitly start a new session. If we have an existing session,
     * then close the current one and restart a new one.
     * @param {Editor} editor
     */
    function _startNewSession(editor) {
        if (!editor) {
            editor = EditorManager.getFocusedEditor();
        }

        if (editor) {
            lastChar = null;
            if (_inSession(editor)) {
                _endSession();
            }
            // Begin a new explicit session
            _beginSession(editor);
        }
    }

    /**
     * Handles keys related to displaying, searching, and navigating the hint list.
     * This gets called before handleChange.
     *
     * TODO: Ideally, we'd get a more semantic event from the editor that told us
     * what changed so that we could do all of this logic without looking at
     * key events. Then, the purposes of handleKeyEvent and handleChange could be
     * combined. Doing this well requires changing CodeMirror.
     *
     * @param {Event} jqEvent
     * @param {Editor} editor
     * @param {KeyboardEvent} event
     */
    function _handleKeydownEvent(jqEvent, editor, event) {
        keyDownEditor = editor;
        if (!(event.ctrlKey || event.altKey || event.metaKey) &&
                (event.keyCode === KeyEvent.DOM_VK_ENTER ||
                 event.keyCode === KeyEvent.DOM_VK_RETURN ||
                 event.keyCode === KeyEvent.DOM_VK_TAB)) {
            lastChar = String.fromCharCode(event.keyCode);
        }
    }
    function _handleKeypressEvent(jqEvent, editor, event) {
        keyDownEditor = editor;

        // Last inserted character, used later by handleChange
        lastChar = String.fromCharCode(event.charCode);

        // Pending Text is used in hintList._keydownHook()
        if (hintList) {
            hintList.addPendingText(lastChar);
        }
    }
    function _handleKeyupEvent(jqEvent, editor, event) {
        keyDownEditor = editor;
        if (_inSession(editor)) {
            if (event.keyCode === KeyEvent.DOM_VK_HOME || event.keyCode === KeyEvent.DOM_VK_END) {
                _endSession();
            } else if (event.keyCode === KeyEvent.DOM_VK_LEFT ||
                       event.keyCode === KeyEvent.DOM_VK_RIGHT ||
                       event.keyCode === KeyEvent.DOM_VK_BACK_SPACE) {
                // Update the list after a simple navigation.
                // We do this in "keyup" because we want the cursor position to be updated before
                // we redraw the list.
                _updateHintList();
            }
        }
    }
    
    /**
     * Handle a selection change event in the editor. If the selection becomes a
     * multiple selection, end our current session.
     * @param {BracketsEvent} event
     * @param {Editor} editor
     */
    function _handleCursorActivity(event, editor) {
        if (_inSession(editor)) {
            if (editor.getSelections().length > 1) {
                _endSession();
            }
        }
    }

    /**
     * Start a new implicit hinting session, or update the existing hint list.
     * Called by the editor after handleKeyEvent, which is responsible for setting
     * the lastChar.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {{from: Pos, to: Pos, text: Array, origin: string}} changeList
     */
    function _handleChange(event, editor, changeList) {
        if (lastChar && editor === keyDownEditor) {
            keyDownEditor = null;
            if (_inSession(editor)) {
                var charToRetest = lastChar;
                _updateHintList();

                // _updateHintList() may end a hinting session and clear lastChar, but a
                // different provider may want to start a new session with the same character.
                // So check whether current provider terminates the current hinting
                // session. If so, then restore lastChar and restart a new session.
                if (!_inSession(editor)) {
                    lastChar = charToRetest;
                    _beginSession(editor);
                }
            } else {
                _beginSession(editor);
            }

            // Pending Text is used in hintList._keydownHook()
            if (hintList && changeList[0] && changeList[0].text.length && changeList[0].text[0].length) {
                var expectedLength = editor.getCursorPos().ch - changeList[0].from.ch,
                    newText = changeList[0].text[0];
                // We may get extra text in newText since some features like auto
                // close braces can append some text automatically.
                // See https://github.com/adobe/brackets/issues/6345#issuecomment-32548064
                // as an example of this scenario.
                if (newText.length > expectedLength) {
                    // Strip off the extra text before calling removePendingText.
                    newText = newText.substr(0, expectedLength);
                }
                hintList.removePendingText(newText);
            }
        }
    }

    /**
     * Test whether the provider has an exclusion that is still the same as text after the cursor.
     *
     * @param {string} exclusion - Text not to be overwritten when the provider inserts the selected hint.
     * @param {string} textAfterCursor - Text that is immediately after the cursor position.
     * @return {boolean} true if the exclusion is not null and is exactly the same as textAfterCursor,
     * false otherwise.
     */
    function hasValidExclusion(exclusion, textAfterCursor) {
        return (exclusion && exclusion === textAfterCursor);
    }

    /**
     *  Test if a hint popup is open.
     *
     * @return {boolean} - true if the hints are open, false otherwise.
     */
    function isOpen() {
        return (hintList && hintList.isOpen());
    }

    /**
     * Expose CodeHintList for unit testing
     */
    function _getCodeHintList() {
        return hintList;
    }

    function activeEditorChangeHandler(event, current, previous) {
        if (current) {
            current.on("editorChange", _handleChange);
            current.on("keydown",  _handleKeydownEvent);
            current.on("keypress", _handleKeypressEvent);
            current.on("keyup",    _handleKeyupEvent);
            current.on("cursorActivity", _handleCursorActivity);
        }

        if (previous) {
            //Removing all old Handlers
            previous.off("editorChange", _handleChange);
            previous.off("keydown",  _handleKeydownEvent);
            previous.off("keypress", _handleKeypressEvent);
            previous.off("keyup",    _handleKeyupEvent);
            previous.off("cursorActivity", _handleCursorActivity);
        }
    }

    activeEditorChangeHandler(null, EditorManager.getActiveEditor(), null);

    EditorManager.on("activeEditorChange", activeEditorChangeHandler);

    // Dismiss code hints before executing any command since the command
    // may make the current hinting session irrevalent after execution.
    // For example, when the user hits Ctrl+K to open Quick Doc, it is
    // pointless to keep the hint list since the user wants to view the Quick Doc.
    CommandManager.on("beforeExecuteCommand", _endSession);

    CommandManager.register(Strings.CMD_SHOW_CODE_HINTS, Commands.SHOW_CODE_HINTS, _startNewSession);

    exports._getCodeHintList        = _getCodeHintList;
    exports._removeHintProvider     = _removeHintProvider;

    // Define public API
    exports.isOpen                  = isOpen;
    exports.registerHintProvider    = registerHintProvider;
    exports.hasValidExclusion       = hasValidExclusion;
});
