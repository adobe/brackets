/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/**
 * EditorManager owns the UI for the editor area. This essentially mirrors the 'current document'
 * property maintained by DocumentManager's model.
 *
 * Note that there is a little bit of unusual overlap between EditorManager and DocumentManager:
 * because the Document state is actually stored in the CodeMirror editor UI, DocumentManager is
 * not a pure headless model. Each Document encapsulates an editor instance, and thus EditorManager
 * must have some knowledge about Document's internal state (we access its _editor property).
 *
 * This module dispatches the following events:
 *    - activeEditorChange --  Fires after the active editor (full or inline).
 *
 *      Doesn't fire when editor temporarily loses focus to a non-editor
 *      control (e.g. search toolbar or modal dialog, or window deactivation).
 *
 *      Does fire when focus moves between inline editor and its full-size container.
 *
 *      This event tracks `MainViewManagers's `currentFileChange` event and all editor
 *      objects "focus" event.
 *
 *          (e, editorGainingFocus:editor, editorLosingFocus:editor)
 *
 *      The 2nd arg to the listener is which Editor became active; the 3rd arg is
 *      which Editor is deactivated as a result. Either one may be null.
 *      NOTE (#1257): `getFocusedEditor()` sometimes lags behind this event. Listeners
 *      should use the arguments or call `getActiveEditor()` to reliably see which Editor
 *      just gained focus.
 */
define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var Commands            = require("command/Commands"),
        EventDispatcher     = require("utils/EventDispatcher"),
        WorkspaceManager    = require("view/WorkspaceManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        CommandManager      = require("command/CommandManager"),
        DocumentManager     = require("document/DocumentManager"),
        MainViewManager     = require("view/MainViewManager"),
        ViewStateManager    = require("view/ViewStateManager"),
        PerfUtils           = require("utils/PerfUtils"),
        Editor              = require("editor/Editor").Editor,
        InlineTextEditor    = require("editor/InlineTextEditor").InlineTextEditor,
        Strings             = require("strings"),
        LanguageManager     = require("language/LanguageManager"),
        DeprecationWarning  = require("utils/DeprecationWarning");


    /**
     * Currently focused Editor (full-size, inline, or otherwise)
     * @type {?Editor}
     * @private
     */
    var _lastFocusedEditor = null;

    /**
     * Registered inline-editor widget providers sorted descending by priority.
     * @see {@link #registerInlineEditProvider}.
     * @type {Array.<{priority:number, provider:function(...)}>}
     * @private
     */
    var _inlineEditProviders = [];

    /**
     * Registered inline documentation widget providers sorted descending by priority.
     * @see {@link #registerInlineDocsProvider}.
     * @type {Array.<{priority:number, provider:function(...)}>}
     * @private
     */
    var _inlineDocsProviders = [];

    /**
     * Registered jump-to-definition providers.
     * @see {@link #registerJumpToDefProvider}.
     * @private
     * @type {Array.<function(...)>}
     */
    var _jumpToDefProviders = [];


    /**
     * DOM element to house any hidden editors created soley for inline widgets
     * @private
     * @type {jQuery}
     */
    var _$hiddenEditorsContainer;


    /**
     * Retrieves the visible full-size Editor for the currently opened file in the ACTIVE_PANE
     * @return {?Editor} editor of the current view or null
     */
    function getCurrentFullEditor() {
        var currentPath = MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE),
            doc = currentPath && DocumentManager.getOpenDocumentForPath(currentPath);
        return doc && doc._masterEditor;
    }



    /**
     * Updates _viewStateCache from the given editor's actual current state
     * @private
     * @param {!Editor} editor - editor to cache data for
     */
    function _saveEditorViewState(editor) {
        ViewStateManager.updateViewState(editor);
    }

    /**
     * Updates _viewStateCache from the given editor's actual current state
     * @param {!Editor} editor - editor restore cached data
     * @private
     */
    function _restoreEditorViewState(editor) {
        // We want to ignore the current state of the editor, so don't call __getViewState()
        var viewState = ViewStateManager.getViewState(editor.document.file);
        if (viewState) {
            editor.restoreViewState(viewState);
        }
    }


	/**
     * Editor focus handler to change the currently active editor
     * @private
     * @param {?Editor} current - the editor that will be the active editor
     */
    function _notifyActiveEditorChanged(current) {
        // Skip if the Editor that gained focus was already the most recently focused editor.
        // This may happen e.g. if the window loses then regains focus.
        if (_lastFocusedEditor === current) {
            return;
        }
        var previous = _lastFocusedEditor;
        _lastFocusedEditor = current;

        exports.trigger("activeEditorChange", current, previous);
    }

    /**
     * Current File Changed handler
     * MainViewManager dispatches a "currentFileChange" event whenever the currently viewed
     * file changes.  Which could mean that the previously viewed file has been closed or a
     * non-editor view (image) has been given focus.  _notifyAcitveEditorChanged is also hooked
     * up to editor.focus to handle focus events for editors which handles changing focus between
     * two editors but, because editormanager maintains  a "_lastFocusedEditor" state, we have to
     * "nullify" that state whenever the focus goes to a non-editor or when the current editor is closed
     * @private
     * @param {!jQuery.Event} e - event
     * @param {?File} file - current file (can be null)
     */
    function _handleCurrentFileChange(e, file) {
        var doc = file && DocumentManager.getOpenDocumentForPath(file.fullPath);
        _notifyActiveEditorChanged(doc && doc._masterEditor);
    }

    /**
     * Creates a new Editor bound to the given Document.
     * The editor is appended to the given container as a visible child.
     * @private
     * @param {!Document} doc  Document for the Editor's content
     * @param {!boolean} makeMasterEditor  If true, the Editor will set itself as the private "master"
     *          Editor for the Document. If false, the Editor will attach to the Document as a "slave."
     * @param {!jQueryObject} container  Container to add the editor to.
     * @param {{startLine: number, endLine: number}=} range If specified, range of lines within the document
     *          to display in this editor. Inclusive.
     * @param {!Object} editorOptions If specified, contains editor options that can be passed to CodeMirror
     * @return {Editor} the newly created editor.
     */
    function _createEditorForDocument(doc, makeMasterEditor, container, range, editorOptions) {
        var editor = new Editor(doc, makeMasterEditor, container, range, editorOptions);

        editor.on("focus", function () {
            _notifyActiveEditorChanged(editor);
        });

        editor.on("beforeDestroy", function () {
            if (editor.$el.is(":visible")) {
                _saveEditorViewState(editor);
            }
        });

        return editor;
    }

    /**
     * @private
     * Finds an inline widget provider from the given list that can offer a widget for the current cursor
     * position, and once the widget has been created inserts it into the editor.
     *
     * @param {!Editor} editor The host editor
     * @param {Array.<{priority:number, provider:function(...)}>} providers
     *      prioritized list of providers
     * @param {string=} defaultErrorMsg Default message to display if no providers return non-null
     * @return {$.Promise} a promise that will be resolved when an InlineWidget
     *      is created or rejected if no inline providers have offered one.
     */
    function _openInlineWidget(editor, providers, defaultErrorMsg) {
        PerfUtils.markStart(PerfUtils.INLINE_WIDGET_OPEN);

        // Run through inline-editor providers until one responds
        var pos = editor.getCursorPos(),
            inlinePromise,
            i,
            result = new $.Deferred(),
            errorMsg,
            providerRet;

        // Query each provider in priority order. Provider may return:
        // 1. `null` to indicate it does not apply to current cursor position
        // 2. promise that should resolve to an InlineWidget
        // 3. string which indicates provider does apply to current cursor position,
        //    but reason it could not create InlineWidget
        //
        // Keep looping until a provider is found. If a provider is not found,
        // display highest priority error message that was found, otherwise display
        // default error message
        for (i = 0; i < providers.length && !inlinePromise; i++) {
            var provider = providers[i].provider;
            providerRet = provider(editor, pos);
            if (providerRet) {
                if (providerRet.hasOwnProperty("done")) {
                    inlinePromise = providerRet;
                } else if (!errorMsg && typeof (providerRet) === "string") {
                    errorMsg = providerRet;
                }
            }
        }

        // Use default error message if none other provided
        errorMsg = errorMsg || defaultErrorMsg;

        // If one of them will provide a widget, show it inline once ready
        if (inlinePromise) {
            inlinePromise.done(function (inlineWidget) {
                editor.addInlineWidget(pos, inlineWidget).done(function () {
                    PerfUtils.addMeasurement(PerfUtils.INLINE_WIDGET_OPEN);
                    result.resolve();
                });
            }).fail(function () {
                // terminate timer that was started above
                PerfUtils.finalizeMeasurement(PerfUtils.INLINE_WIDGET_OPEN);
                editor.displayErrorMessageAtCursor(errorMsg);
                result.reject();
            });
        } else {
            // terminate timer that was started above
            PerfUtils.finalizeMeasurement(PerfUtils.INLINE_WIDGET_OPEN);
            editor.displayErrorMessageAtCursor(errorMsg);
            result.reject();
        }

        return result.promise();
    }


    /**
     * Closes any focused inline widget. Else, asynchronously asks providers to create one.
     *
     * @param {Array.<{priority:number, provider:function(...)}>} providers
     *   prioritized list of providers
     * @param {string=} errorMsg Default message to display if no providers return non-null
     * @return {!Promise} A promise resolved with true if an inline widget is opened or false
     *   when closed. Rejected if there is neither an existing widget to close nor a provider
     *   willing to create a widget (or if no editor is open).
     */
    function _toggleInlineWidget(providers, errorMsg) {
        var result = new $.Deferred();

        var currentEditor = getCurrentFullEditor();

        if (currentEditor) {
            var inlineWidget = currentEditor.getFocusedInlineWidget();

            if (inlineWidget) {
                // an inline widget's editor has focus, so close it
                PerfUtils.markStart(PerfUtils.INLINE_WIDGET_CLOSE);
                inlineWidget.close().done(function () {
                    PerfUtils.addMeasurement(PerfUtils.INLINE_WIDGET_CLOSE);
                    // return a resolved promise to CommandManager
                    result.resolve(false);
                });
            } else {
                // main editor has focus, so create an inline editor
                _openInlineWidget(currentEditor, providers, errorMsg).done(function () {
                    result.resolve(true);
                }).fail(function () {
                    result.reject();
                });
            }
        } else {
            // Can not open an inline editor without a host editor
            result.reject();
        }

        return result.promise();
    }

    /**
     * Inserts a prioritized provider object into the array in sorted (descending) order.
     * @private
     * @param {Array.<{priority:number, provider:function(...)}>} array
     * @param {number} priority
     * @param {function(...)} provider
     */
    function _insertProviderSorted(array, provider, priority) {
        var index,
            prioritizedProvider = {
                priority: priority,
                provider: provider
            };

        for (index = 0; index < array.length; index++) {
            if (array[index].priority < priority) {
                break;
            }
        }

        array.splice(index, 0, prioritizedProvider);
    }


    /**
     * Creates a hidden, unattached master editor that is needed when a document is created for the
     * sole purpose of creating an inline editor so operations that require a master editor can be performed
     * Only called from Document._ensureMasterEditor()
     * The editor view is placed in a hidden part of the DOM but can later be moved to a visible pane
     * when the document is opened using pane.addView()
     * @param {!Document} doc - document to create a hidden editor for
     */
    function _createUnattachedMasterEditor(doc) {
        // attach to the hidden containers DOM node if necessary
        if (!_$hiddenEditorsContainer) {
            _$hiddenEditorsContainer = $("#hidden-editors");
        }
        // Create an editor
        var editor = _createEditorForDocument(doc, true, _$hiddenEditorsContainer);
        // and hide it
        editor.setVisible(false);
    }

    /**
     * Removes the given widget UI from the given hostEditor (agnostic of what the widget's content
     * is). The widget's onClosed() callback will be run as a result.
     * @param {!Editor} hostEditor The editor containing the widget.
     * @param {!InlineWidget} inlineWidget The inline widget to close.
     * @return {$.Promise} A promise that's resolved when the widget is fully closed.
     */
    function closeInlineWidget(hostEditor, inlineWidget) {
        // If widget has focus, return it to the hostEditor & move the cursor to where the inline used to be
        if (inlineWidget.hasFocus()) {
            // Place cursor back on the line just above the inline (the line from which it was opened)
            // If cursor's already on that line, leave it be to preserve column position
            var widgetLine = hostEditor._codeMirror.getLineNumber(inlineWidget.info.line);
            var cursorLine = hostEditor.getCursorPos().line;
            if (cursorLine !== widgetLine) {
                hostEditor.setCursorPos({ line: widgetLine, pos: 0 });
            }

            hostEditor.focus();
        }

        return hostEditor.removeInlineWidget(inlineWidget);
    }

    /**
     * Registers a new inline editor provider. When Quick Edit is invoked each registered provider is
     * asked if it wants to provide an inline editor given the current editor and cursor location.
     * An optional priority parameter is used to give providers with higher priority an opportunity
     * to provide an inline editor before providers with lower priority.
     *
     * @param {function(!Editor, !{line:number, ch:number}):?($.Promise|string)} provider
     * @param {number=} priority
     * The provider returns a promise that will be resolved with an InlineWidget, or returns a string
     * indicating why the provider cannot respond to this case (or returns null to indicate no reason).
     */
    function registerInlineEditProvider(provider, priority) {
        if (priority === undefined) {
            priority = 0;
        }
        _insertProviderSorted(_inlineEditProviders, provider, priority);
    }

    /**
     * Registers a new inline docs provider. When Quick Docs is invoked each registered provider is
     * asked if it wants to provide inline docs given the current editor and cursor location.
     * An optional priority parameter is used to give providers with higher priority an opportunity
     * to provide an inline editor before providers with lower priority.
     *
     * @param {function(!Editor, !{line:number, ch:number}):?($.Promise|string)} provider
     * @param {number=} priority
     * The provider returns a promise that will be resolved with an InlineWidget, or returns a string
     * indicating why the provider cannot respond to this case (or returns null to indicate no reason).
     */
    function registerInlineDocsProvider(provider, priority) {
        if (priority === undefined) {
            priority = 0;
        }
        _insertProviderSorted(_inlineDocsProviders, provider, priority);
    }

    /**
     * Registers a new jump-to-definition provider. When jump-to-definition is invoked each
     * registered provider is asked if it wants to provide jump-to-definition results, given
     * the current editor and cursor location.
     *
     * @param {function(!Editor, !{line:number, ch:number}):?$.Promise} provider
     * The provider returns a promise that is resolved whenever it's done handling the operation,
     * or returns null to indicate the provider doesn't want to respond to this case. It is entirely
     * up to the provider to open the file containing the definition, select the appropriate text, etc.
     */
    function registerJumpToDefProvider(provider) {
        _jumpToDefProviders.push(provider);
    }

    /**
     * @private
     * Given a host editor, return a list of all Editors in all its open inline widgets. (Ignoring
     * any other inline widgets that might be open but don't contain Editors).
     * @param {!Editor} hostEditor
     * @return {Array.<Editor>}
     *
     */
    function getInlineEditors(hostEditor) {
        var inlineEditors = [];

        if (hostEditor) {
            hostEditor.getInlineWidgets().forEach(function (widget) {
                if (widget instanceof InlineTextEditor && widget.editor) {
                    inlineEditors.push(widget.editor);
                }
            });
        }

        return inlineEditors;
    }



    /**
     * @private
     * Creates a new "full-size" (not inline) Editor for the given Document, and sets it as the
     * Document's master backing editor. The editor is not yet visible;
     * Semi-private: should only be called within this module or by Document.
     * @param {!Document} document  Document whose main/full Editor to create
     * @param {!Pane} pane  Pane in which the editor will be hosted
     * @param {!Object} editorOptions If specified, contains editor options that
     * can be passed to CodeMirror
     * @return {!Editor}
     */
    function _createFullEditorForDocument(document, pane, editorOptions) {
        // Create editor; make it initially invisible
        var editor = _createEditorForDocument(document, true, pane.$content, undefined, editorOptions);
        editor.setVisible(false);
        pane.addView(editor);
        exports.trigger("_fullEditorCreatedForDocument", document, editor, pane.id);
        return editor;
    }


    /**
     * Creates a new inline Editor instance for the given Document.
     * The editor is not yet visible or attached to a host editor.
     * @param {!Document} doc  Document for the Editor's content
     * @param {?{startLine:Number, endLine:Number}} range  If specified, all lines outside the given
     *      range are hidden from the editor. Range is inclusive. Line numbers start at 0.
     * @param {HTMLDivContainer} inlineContent
     * @param  {function(inlineWidget)} closeThisInline
     *
     * @return {{content:DOMElement, editor:Editor}}
     */
    function createInlineEditorForDocument(doc, range, inlineContent) {
        // Hide the container for the editor before creating it so that CodeMirror doesn't do extra work
        // when initializing the document. When we construct the editor, we have to set its text and then
        // set the (small) visible range that we show in the editor. If the editor is visible, CM has to
        // render a large portion of the document before setting the visible range. By hiding the editor
        // first and showing it after the visible range is set, we avoid that initial render.
        $(inlineContent).hide();
        var inlineEditor = _createEditorForDocument(doc, false, inlineContent, range);
        inlineEditor._hostEditor = getCurrentFullEditor();
        $(inlineContent).show();

        return { content: inlineContent, editor: inlineEditor };
    }

    /**
     * Returns focus to the last visible editor that had focus. If no editor visible, does nothing.
     * This function should be called to restore editor focus after it has been temporarily
     * removed. For example, after a dialog with editable text is closed.
     */
    function focusEditor() {
        DeprecationWarning.deprecationWarning("Use MainViewManager.focusActivePane() instead of EditorManager.focusEditor().", true);
        MainViewManager.focusActivePane();
    }

    /**
     * @deprecated
     * resizes the editor
     */
    function resizeEditor() {
        DeprecationWarning.deprecationWarning("Use WorkspaceManager.recomputeLayout() instead of EditorManager.resizeEditor().", true);
        WorkspaceManager.recomputeLayout();
    }

    /**
     * Create and/or show the editor for the specified document
     * @param {!Document} document - document to edit
     * @param {!Pane} pane - pane to show it in
     * @param {!Object} editorOptions - If specified, contains
     * editor options that can be passed to CodeMirror
     * @private
     */
    function _showEditor(document, pane, editorOptions) {
        // Ensure a main editor exists for this document to show in the UI
        var createdNewEditor = false,
            editor = document._masterEditor;

        // Check if a master editor is not set already or the current master editor doesn't belong
        // to the pane container requested - to support creation of multiple full editors
        // This check is required as _masterEditor is the active full editor for the document
        // and there can be existing full editor created for other panes
        if (editor && editor._paneId && editor._paneId !== pane.id) {
            editor = document._checkAssociatedEditorForPane(pane.id);
        }

        if (!editor) {
            // Performance (see #4757) Chrome wastes time messing with selection
            // that will just be changed at end, so clear it for now
            if (window.getSelection && window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            }

            // Editor doesn't exist: populate a new Editor with the text
            editor = _createFullEditorForDocument(document, pane, editorOptions);
            createdNewEditor = true;
        } else if (editor.$el.parent()[0] !== pane.$content[0]) {
            // editor does exist but is not a child of the pane so add it to the
            //  pane (which will switch the view's container as well)
            pane.addView(editor);
        }

        // show the view
        pane.showView(editor);

        if (MainViewManager.getActivePaneId() === pane.id) {
            // give it focus
            editor.focus();
        }

        if (createdNewEditor) {
            _restoreEditorViewState(editor);
        }
    }

    /**
     * @deprecated use MainViewManager.getCurrentlyViewedFile() instead
     * @return {string=} path of the file currently viewed in the active, full sized editor or null when there is no active editor
     */
    function getCurrentlyViewedPath() {
        DeprecationWarning.deprecationWarning("Use MainViewManager.getCurrentlyViewedFile() instead of EditorManager.getCurrentlyViewedPath().", true);

        // We only want to return a path of a document object
        // not other things like images, etc...
        var currentPath = MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE),
            doc;

        if (currentPath) {
            doc = DocumentManager.getOpenDocumentForPath(currentPath);
        }

        if (doc) {
            return currentPath;
        }

        return null;
    }

    /**
     * @deprecated There is no equivelent API moving forward.
     * Use MainViewManager._initialize() from a unit test to create a Main View attached to a specific DOM element
     */
    function setEditorHolder() {
        throw new Error("EditorManager.setEditorHolder() has been removed.");
    }

    /**
     * @deprecated Register a View Factory instead
     * @see MainViewFactory::#registerViewFactory
     */
    function registerCustomViewer() {
        throw new Error("EditorManager.registerCustomViewer() has been removed.");
    }

    /**
     * Determines if the file can be opened in an editor
     * @param {!string} fullPath - file to be opened
     * @return {boolean} true if the file can be opened in an editor, false if not
     */
    function canOpenPath(fullPath) {
        return !LanguageManager.getLanguageForPath(fullPath).isBinary();
    }

    /**
     * Opens the specified document in the given pane
     * @param {!Document} doc - the document to open
     * @param {!Pane} pane - the pane to open the document in
     * @param {!Object} editorOptions - If specified, contains
     * editor options that can be passed to CodeMirror
     * @return {boolean} true if the file can be opened, false if not
     */
    function openDocument(doc, pane, editorOptions) {
        var perfTimerName = PerfUtils.markStart("EditorManager.openDocument():\t" + (!doc || doc.file.fullPath));

        if (doc && pane) {
            _showEditor(doc, pane, editorOptions);
        }

        PerfUtils.addMeasurement(perfTimerName);
    }

    /**
     * Returns the currently focused inline widget, if any.
     * @return {?InlineWidget}
     */
    function getFocusedInlineWidget() {
        var currentEditor = getCurrentFullEditor();
        if (currentEditor) {
            return currentEditor.getFocusedInlineWidget();
        }
        return null;
    }

    /**
     * Returns the focused Editor within an inline text editor, or null if something else has focus
     * @return {?Editor}
     */
    function _getFocusedInlineEditor() {
        var focusedWidget = getFocusedInlineWidget();
        if (focusedWidget instanceof InlineTextEditor) {
            return focusedWidget.getFocusedEditor();
        }
        return null;
    }

    /**
     * Returns the currently focused editor instance (full-sized OR inline editor).
     * This function is similar to getActiveEditor(), with one main difference: this
     * function will only return editors that currently have focus, whereas
     * getActiveEditor() will return the last visible editor that was given focus (but
     * may not currently have focus because, for example, a dialog with editable text
     * is open).
     * @return {?Editor}
     */
    function getFocusedEditor() {
        var currentEditor = getCurrentFullEditor();
        if (currentEditor) {

            // See if any inlines have focus
            var focusedInline = _getFocusedInlineEditor();
            if (focusedInline) {
                return focusedInline;
            }

            // otherwise, see if full-sized editor has focus
            if (currentEditor.hasFocus()) {
                return currentEditor;
            }
        }

        return null;
    }

    /**
     * Returns the current active editor (full-sized OR inline editor). This editor may not
     * have focus at the moment, but it is visible and was the last editor that was given
     * focus. Returns null if no editors are active.
     * @see #getFocusedEditor
     * @return {?Editor}
     */
    function getActiveEditor() {
        return _lastFocusedEditor;
    }


  /**
     * Asynchronously asks providers to handle jump-to-definition.
     * @return {!Promise} Resolved when the provider signals that it's done; rejected if no
     *      provider responded or the provider that responded failed.
     */
    function _doJumpToDef() {
        var providers = _jumpToDefProviders;
        var promise,
            i,
            result = new $.Deferred();

        var editor = getActiveEditor();

        if (editor) {
            var pos = editor.getCursorPos();

            PerfUtils.markStart(PerfUtils.JUMP_TO_DEFINITION);

            // Run through providers until one responds
            for (i = 0; i < providers.length && !promise; i++) {
                var provider = providers[i];
                promise = provider(editor, pos);
            }

            // Will one of them will provide a result?
            if (promise) {
                promise.done(function () {
                    PerfUtils.addMeasurement(PerfUtils.JUMP_TO_DEFINITION);
                    result.resolve();
                }).fail(function () {
                    // terminate timer that was started above
                    PerfUtils.finalizeMeasurement(PerfUtils.JUMP_TO_DEFINITION);
                    result.reject();
                });
            } else {
                // terminate timer that was started above
                PerfUtils.finalizeMeasurement(PerfUtils.JUMP_TO_DEFINITION);
                result.reject();
            }

        } else {
            result.reject();
        }

        return result.promise();
    }


    /**
     * file removed from pane handler.
     * @param {jQuery.Event} e
     * @param {File|Array.<File>} removedFiles - file, path or array of files or paths that are being removed
     */
    function _handleRemoveFromPaneView(e, removedFiles) {
        var handleFileRemoved = function (file) {
            var doc = DocumentManager.getOpenDocumentForPath(file.fullPath);

            if (doc) {
                MainViewManager._destroyEditorIfNotNeeded(doc);
            }
        };

        // when files are removed from a pane then
        //    we should destroy any unnecssary views
        if ($.isArray(removedFiles)) {
            removedFiles.forEach(function (removedFile) {
                handleFileRemoved(removedFile);
            });
        } else {
            handleFileRemoved(removedFiles);
        }
    }


    // Set up event dispatching
    EventDispatcher.makeEventDispatcher(exports);

    // File-based preferences handling
    exports.on("activeEditorChange", function (e, current) {
        if (current && current.document && current.document.file) {
            PreferencesManager._setCurrentFile(current.document.file.fullPath);
        }
    });

    // Initialize: command handlers
    CommandManager.register(Strings.CMD_TOGGLE_QUICK_EDIT, Commands.TOGGLE_QUICK_EDIT, function () {
        return _toggleInlineWidget(_inlineEditProviders, Strings.ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND);
    });
    CommandManager.register(Strings.CMD_TOGGLE_QUICK_DOCS, Commands.TOGGLE_QUICK_DOCS, function () {
        return _toggleInlineWidget(_inlineDocsProviders, Strings.ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND);
    });
    CommandManager.register(Strings.CMD_JUMPTO_DEFINITION, Commands.NAVIGATE_JUMPTO_DEFINITION, _doJumpToDef);

    // Create PerfUtils measurement
    PerfUtils.createPerfMeasurement("JUMP_TO_DEFINITION", "Jump-To-Definiiton");

    MainViewManager.on("currentFileChange", _handleCurrentFileChange);
    MainViewManager.on("workingSetRemove workingSetRemoveList", _handleRemoveFromPaneView);


    // For unit tests and internal use only
    exports._createFullEditorForDocument  = _createFullEditorForDocument;
    exports._notifyActiveEditorChanged    = _notifyActiveEditorChanged;

    // Internal Use only
    exports._saveEditorViewState          = _saveEditorViewState;
    exports._createUnattachedMasterEditor = _createUnattachedMasterEditor;

    // Define public API
    exports.createInlineEditorForDocument = createInlineEditorForDocument;
    exports.getFocusedInlineWidget        = getFocusedInlineWidget;
    exports.getInlineEditors              = getInlineEditors;
    exports.closeInlineWidget             = closeInlineWidget;
    exports.openDocument                  = openDocument;
    exports.canOpenPath                   = canOpenPath;

    // Convenience Methods
    exports.getActiveEditor               = getActiveEditor;
    exports.getCurrentFullEditor          = getCurrentFullEditor;
    exports.getFocusedEditor              = getFocusedEditor;


    exports.registerInlineEditProvider    = registerInlineEditProvider;
    exports.registerInlineDocsProvider    = registerInlineDocsProvider;
    exports.registerJumpToDefProvider     = registerJumpToDefProvider;

    // Deprecated
    exports.registerCustomViewer          = registerCustomViewer;
    exports.resizeEditor                  = resizeEditor;
    exports.focusEditor                   = focusEditor;
    exports.getCurrentlyViewedPath        = getCurrentlyViewedPath;
    exports.setEditorHolder               = setEditorHolder;
});
