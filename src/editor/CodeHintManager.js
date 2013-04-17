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

/*
 * CodeHintManager Overview:
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
 * CodeHintProvider Overview:
 *
 * A code hint provider should implement the following three functions:
 *
 * CodeHintProvider.hasHints(editor, implicitChar)
 * CodeHintProvider.getHints(implicitChar)
 * CodeHintProvider.insertHint(hint)
 *
 * The behavior of these three functions is described in detail below.
 *
 * # CodeHintProvider.hasHints(editor, implicitChar)
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
 * param {String} implicitChar 
 * Either null, if the hinting request was explicit, or a single character
 * that represents the last insertion and that indicates an implicit
 * hinting request.
 *
 * return {Boolean} 
 * Determines whether the current provider is able to provide hints for
 * the given editor context and, in case implicitChar is non- null,
 * whether it is appropriate to do so.
 * 
 * 
 * # CodeHintProvider.getHints(implicitChar)
 * 
 * The method by which a provider provides hints for the editor context
 * associated with the current session. The getHints method is called only
 * if the provider asserted its willingness to provide hints in an earlier
 * call to hasHints. The provider may return null, which indicates that
 * the manager should end the current hinting session and close the hint
 * list window. Otherwise, the provider should return a response object
 * that contains three properties: 
 *
 *  1. hints, a sorted array hints that the provider could later insert
 *     into the editor;
 *  2. match, a string that the manager may use to emphasize substrings of
 *     hints in the hint list; and
 *  3. selectInitial, a boolean that indicates whether or not the the
 *     first hint in the list should be selected by default.
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
 * param {String} implicitChar
 * Either null, if the request to update the hint list was a result of
 * navigation, or a single character that represents the last insertion.
 *
 * return {(Object + jQuery.Deferred)<
 *      hints: Array<(String + jQuery.Obj)>,
 *      match: String,
 *      selectInitial: Boolean>}
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
 * TODO - NOT YET IMPLEMENTED: If the match is null, the manager will not 
 * attempt to emphasize any parts of the hints when rendering the hint 
 * list; instead the provider may return strings or jQuery objects for 
 * which emphasis is self-contained. For example, the strings may contain
 * substrings that wrapped in bold tags. In this way, the provider can 
 * choose to let the manager handle emphasis for the simple and common case
 * of prefix matching, or can provide its own emphasis if it wishes to use 
 * a more sophisticated matching algorithm.
 * 
 *
 * # CodeHintProvider.insertHint(hint)
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
 * param {String} hint 
 * The hint to be inserted into the editor context for the current session.
 * 
 * return {Boolean} 
 * Indicates whether the manager should follow hint insertion with an
 * explicit hint request.
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var KeyEvent        = require("utils/KeyEvent"),
        CodeHintList    = require("editor/CodeHintList").CodeHintList;

    var hintProviders   = { "all" : [] },
        lastChar        = null,
        sessionProvider = null,
        sessionEditor   = null,
        hintList        = null,
        deferredHints   = null,
        keyDownEditor   = null;

    /**
     * Comparator to sort providers based on their priority
     */
    function _providerSort(a, b) {
        return b.priority - a.priority;
    }
    
    /**    
     * The method by which a CodeHintProvider registers its willingness to
     * providing hints for editors in a given language.
     *
     * @param {CodeHintProvider} provider
     * The hint provider to be registered, described below. 
     *
     * @param {Array[(string|Object<name: string>)]} languageIDs
     * The set of language ids for which the provider is capable of
     * providing hints. If the special language id name "all" is included then
     * the provider may be called upon to provide hints for any language.
     *
     * @param {Integer} priority
     * A non-negative number used to break ties among hint providers for a
     * particular language. Providers that register with a higher priority
     * will have the opportunity to provide hints at a given language before
     * those with a lower priority. Brackets default providers have
     * priority zero.
     */
    function registerHintProvider(providerInfo, languageIDs, priority) {
        var providerObj = { provider: providerInfo,
                            priority: priority || 0 };
                
        if (languageIDs) {
            var languageIdNames = [], registerForAllLanguages = false;
            var i, currentLanguageID;
            for (i = 0; i < languageIDs.length; i++) {
                currentLanguageID = languageIDs[i];
                if (currentLanguageID) {
                    if (currentLanguageID === "all") {
                        registerForAllLanguages = true;
                        break;
                    } else {
                        languageIdNames.push(currentLanguageID);
                    }
                }
            }

            if (registerForAllLanguages) {
                // if we're registering in all, then we ignore the languageIdNames array
                // so that we avoid registering a provider twice
                var languageId;
                for (languageId in hintProviders) {
                    if (hintProviders.hasOwnProperty(languageId)) {
                        hintProviders[languageId].push(providerObj);
                        hintProviders[languageId].sort(_providerSort);
                    }
                }
            } else {
                languageIdNames.forEach(function (languageId) {
                    if (languageId) {
                        if (!hintProviders[languageId]) {
                            // initialize a new language id with all providers
                            hintProviders[languageId] = Array.prototype.concat(hintProviders.all);
                        }
                        hintProviders[languageId].push(providerObj);
                        hintProviders[languageId].sort(_providerSort);
                    }
                });
            }
        }
    }

    /** 
     *  Return the array of hint providers for the given language id.
     *  This gets called (potentially) on every keypress. So, it should be fast.
     *
     * @param {(string|Object<name: string>)} languageID
     * @return {Array.<{provider: Object, languageIDs: Array.<string>, priority: number}>}
     */
    function _getProvidersForLanguageID(languageID) {
        return hintProviders[languageID] || hintProviders.all;
    }

    /**
     * End the current hinting session
     */
    function _endSession() {
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
                     (deferredHints && !deferredHints.isResolved() && !deferredHints.isRejected()))) {
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
                if (hintList.isOpen()) {
                    // the session is open 
                    hintList.update(hints);
                } else {
                    hintList.open(hints);
                }
            });
        }
    }
    
    /**
     * Try to begin a new hinting session. 
     * @param {Editor} editor
     */
    function _beginSession(editor) {
        // Find a suitable provider, if any
        var language = editor.getLanguageForSelection(),
            enabledProviders = _getProvidersForLanguageID(language.getId());
        
        enabledProviders.some(function (item, index) {
            if (item.provider.hasHints(editor, lastChar)) {
                sessionProvider = item.provider;
                return true;
            }
        });

        // If a provider is found, initialize the hint list and update it
        if (sessionProvider) {
            sessionEditor = editor;

            hintList = new CodeHintList(sessionEditor);
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
     * @param {Editor} editor
     * @param {KeyboardEvent} event
     */
    function handleKeyEvent(editor, event) {
        keyDownEditor = editor;
        if (event.type === "keydown") {
            if (event.keyCode === 32 && event.ctrlKey) { // User pressed Ctrl+Space
                event.preventDefault();
                lastChar = null;
                if (_inSession(editor)) {
                    _endSession();
                }
                // Begin a new explicit session
                _beginSession(editor);
            } else if (_inSession(editor) && hintList.isOpen()) {
                // Pass event to the hint list, if it's open
                hintList.handleKeyEvent(event);
            }
            if (!(event.ctrlKey || event.altKey || event.metaKey) &&
                    (event.keyCode === KeyEvent.DOM_VK_ENTER ||
                     event.keyCode === KeyEvent.DOM_VK_RETURN ||
                     event.keyCode === KeyEvent.DOM_VK_TAB)) {
                lastChar = String.fromCharCode(event.keyCode);
            }
        } else if (event.type === "keypress") {
            // Last inserted character, used later by handleChange
            lastChar = String.fromCharCode(event.charCode);
        } else if (event.type === "keyup" && _inSession(editor)) {
            if ((event.keyCode !== 32 && event.ctrlKey) || event.altKey || event.metaKey) {
                // End the session if the user presses any key with a modifier (other than Ctrl+Space).
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
     * Start a new implicit hinting session, or update the existing hint list. 
     * Called by the editor after handleKeyEvent, which is responsible for setting
     * the lastChar.
     */
    function handleChange(editor) {
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
        }
    }

    /**
     * Expose CodeHintList for unit testing
     */
    function _getCodeHintList() {
        return hintList;
    }
    exports._getCodeHintList        = _getCodeHintList;
    
    // Define public API
    exports.handleKeyEvent          = handleKeyEvent;
    exports.handleChange            = handleChange;
    exports.registerHintProvider    = registerHintProvider;
});
