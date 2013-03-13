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
/*global define, $, window */

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
 *    - activeEditorChange --  Fires after the active editor (full or inline) changes and size/visibility
 *                             are complete. Doesn't fire when editor temporarily loses focus to a non-editor
 *                             control (e.g. search toolbar or modal dialog, or window deactivation). Does
 *                             fire when focus moves between inline editor and its full-size container.
 *                             This event tracks getActiveEditor() changes, while DocumentManager's
 *                             currentDocumentChange tracks getCurrentFullEditor() changes.
 *                             The 2nd arg to the listener is which Editor became active; the 3rd arg is
 *                             which Editor is deactivated as a result. Either one may be null.
 *                             NOTE (#1257): getFocusedEditor() sometimes lags behind this event. Listeners
 *                             should use the arguments or call getActiveEditor() to reliably see which Editor 
 *                             just gained focus.
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var Commands            = require("command/Commands"),
        CommandManager      = require("command/CommandManager"),
        DocumentManager     = require("document/DocumentManager"),
        PerfUtils           = require("utils/PerfUtils"),
        Editor              = require("editor/Editor").Editor,
        InlineTextEditor    = require("editor/InlineTextEditor").InlineTextEditor,
        ViewUtils           = require("utils/ViewUtils"),
        Strings             = require("strings");
    
    /** @type {jQueryObject} DOM node that contains all editors (visible and hidden alike) */
    var _editorHolder = null;
    
    /**
     * Currently visible full-size Editor, or null if no editors open
     * @type {?Editor}
     */
    var _currentEditor = null;
    /** @type {?Document} */
    var _currentEditorsDocument = null;
    
    /**
     * Currently focused Editor (full-size, inline, or otherwise)
     * @type {?Editor}
     */
    var _lastFocusedEditor = null;
    
    /**
     * Maps full path to scroll pos & cursor/selection info. Not kept up to date while an editor is current.
     * Only updated when switching / closing editor, or when requested explicitly via _getViewState().
     * @type {Object<string, {scrollPos:{x:number, y:number}, selection:{start:{line:number, ch:number}, end:{line:number, ch:number}}}>}
     */
    var _viewStateCache = {};
    
    /**
     * Last known editor area width, used to detect when the window is resized horizontally.
     */
    var _lastEditorWidth = null;
    
    /**
     * Registered inline-editor widget providers. See {@link #registerInlineEditProvider()}.
     * @type {Array.<function(...)>}
     */
    var _inlineEditProviders = [];
    
	/**
     * @private
     * @param {?Editor} current
     */
    function _notifyActiveEditorChanged(current) {
        // Skip if the Editor that gained focus was already the most recently focused editor.
        // This may happen e.g. if the window loses then regains focus.
        if (_lastFocusedEditor === current) {
            return;
        }
        var previous = _lastFocusedEditor;
        _lastFocusedEditor = current;
        
        $(exports).triggerHandler("activeEditorChange", [current, previous]);
    }
	
    /**
     * Creates a new Editor bound to the given Document.
     * The editor is appended to the given container as a visible child.
     * @param {!Document} doc  Document for the Editor's content
     * @param {!boolean} makeMasterEditor  If true, the Editor will set itself as the private "master"
     *          Editor for the Document. If false, the Editor will attach to the Document as a "slave."
     * @param {!jQueryObject} container  Container to add the editor to.
     * @param {{startLine: number, endLine: number}=} range If specified, range of lines within the document
     *          to display in this editor. Inclusive.
     * @return {Editor} the newly created editor.
     */
    function _createEditorForDocument(doc, makeMasterEditor, container, range) {
        var editor = new Editor(doc, makeMasterEditor, container, range);

        $(editor).on("focus", function () {
            _notifyActiveEditorChanged(this);
        });
        
        return editor;
    }
    
    /**
     * @private
     * Bound to Ctrl+E on outermost editors.
     * @param {!Editor} editor the candidate host editor
     * @return {$.Promise} a promise that will be resolved when an InlineWidget 
     *      is created or rejected when no inline editors are available.
     */
    function _openInlineWidget(editor) {
        PerfUtils.markStart(PerfUtils.INLINE_EDITOR_OPEN);
        
        // Run through inline-editor providers until one responds
        var pos = editor.getCursorPos(),
            inlinePromise,
            i,
            result = new $.Deferred();
        
        for (i = 0; i < _inlineEditProviders.length && !inlinePromise; i++) {
            var provider = _inlineEditProviders[i];
            inlinePromise = provider(editor, pos);
        }
        
        // If one of them will provide a widget, show it inline once ready
        if (inlinePromise) {
            inlinePromise.done(function (inlineWidget) {
                editor.addInlineWidget(pos, inlineWidget);
                PerfUtils.addMeasurement(PerfUtils.INLINE_EDITOR_OPEN);
                result.resolve();
            }).fail(function () {
                // terminate timer that was started above
                PerfUtils.finalizeMeasurement(PerfUtils.INLINE_EDITOR_OPEN);
                result.reject();
            });
        } else {
            // terminate timer that was started above
            PerfUtils.finalizeMeasurement(PerfUtils.INLINE_EDITOR_OPEN);
            result.reject();
        }
        
        return result.promise();
    }
    
    /**
     * Removes the given widget UI from the given hostEditor (agnostic of what the widget's content
     * is). The widget's onClosed() callback will be run as a result.
     * @param {!Editor} hostEditor The editor containing the widget.
     * @param {!InlineWidget} inlineWidget The inline widget to close.
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
        
        hostEditor.removeInlineWidget(inlineWidget);
    }
    
    /**
     * Registers a new inline provider. When _openInlineWidget() is called each registered inline
     * widget is called and asked if it wants to provide an inline widget given the current cursor
     * location and document.
     * @param {function} provider 
     *      Parameters: 
     *      {!Editor} editor, {!{line:Number, ch:Number}} pos
     *      
     *      Returns:
     *      {$.Promise} a promise that will be resolved with an inlineWidget
     *      or null to indicate the provider doesn't create an editor in this case
     */
    function registerInlineEditProvider(provider) {
        _inlineEditProviders.push(provider);
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
                if (widget instanceof InlineTextEditor) {
                    inlineEditors = inlineEditors.concat(widget.editors);
                }
            });
        }

        return inlineEditors;
    }
    
    
    
    /**
     * @private
     * Creates a new "full-size" (not inline) Editor for the given Document, and sets it as the
     * Document's master backing editor. The editor is not yet visible; to show it, use
     * DocumentManager.setCurrentDocument().
     * Semi-private: should only be called within this module or by Document.
     * @param {!Document} document  Document whose main/full Editor to create
     */
    function _createFullEditorForDocument(document) {
        // Create editor; make it initially invisible
        var container = _editorHolder.get(0);
        var editor = _createEditorForDocument(document, true, container);
        editor.setVisible(false);
    }
    
    /** Returns the visible full-size Editor corresponding to DocumentManager.getCurrentDocument() */
    function getCurrentFullEditor() {
        // This *should* always be equivalent to DocumentManager.getCurrentDocument()._masterEditor
        return _currentEditor;
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
        // Create the Editor
        var inlineEditor = _createEditorForDocument(doc, false, inlineContent, range);
        
        return { content: inlineContent, editor: inlineEditor };
    }
    
    
    /**
     * Disposes the given Document's full-size editor if the doc is no longer "open" from the user's
     * standpoint - not in the working set and not currentDocument).
     * 
     * Destroying the full-size editor releases ONE ref to the Document; if inline editors or other
     * UI elements are still referencing the Document it will still be 'open' (kept alive) from
     * DocumentManager's standpoint. However, destroying the full-size editor does remove the backing
     * "master" editor from the Document, rendering it immutable until either inline-editor edits or
     * currentDocument change triggers _createFullEditorForDocument() full-size editor again.
     *
     * In certain edge cases, this is called directly by DocumentManager; see _gcDocuments() for details.
     *
     * @param {!Document} document Document whose "master" editor we may destroy
     */
    function _destroyEditorIfUnneeded(document) {
        var editor = document._masterEditor;

        if (!editor) {
            return;
        }
        
        // If outgoing editor is no longer needed, dispose it
        var isCurrentDocument = (DocumentManager.getCurrentDocument() === document);
        var isInWorkingSet = (DocumentManager.findInWorkingSet(document.file.fullPath) !== -1);
        if (!isCurrentDocument && !isInWorkingSet) {
            // Destroy the editor widget (which un-refs the Document and reverts it to read-only mode)
            editor.destroy();
            
            // Our callers should really ensure this, but just for safety...
            if (_currentEditor === editor) {
                _currentEditorsDocument = null;
                _currentEditor = null;
            }
        }
    }

    /** 
     * Returns focus to the last visible editor that had focus. If no editor visible, does nothing.
     * This function should be called to restore editor focus after it has been temporarily
     * removed. For example, after a dialog with editable text is closed.
     */
    function focusEditor() {
        if (_lastFocusedEditor) {
            _lastFocusedEditor.focus();
        }
    }
    
    
    /**
     * Calculates the available height for the full-size Editor (or the no-editor placeholder),
     * accounting for the current size of all visible panels, toolbar, & status bar.
     * @return {number}
     */
    function _calcEditorHeight() {
        var availableHt = $(".content").height();
        
        _editorHolder.siblings().each(function (i, elem) {
            var $elem = $(elem);
            if ($elem.css("display") !== "none") {
                availableHt -= $elem.outerHeight();
            }
        });
        
        // Clip value to 0 (it could be negative if a panel wants more space than we have)
        return Math.max(availableHt, 0);
    }
    
    /**
     * Flag for resizeEditor() to always force refresh.
     * @const
     * @type {string}
     */
    var REFRESH_FORCE = "force";
    
    /**
     * Flag for resizeEditor() to never refresh.
     * @const
     * @type {string}
     */
    var REFRESH_SKIP = "skip";

    /** 
     * Resize the editor. This must be called any time the contents of the editor area are swapped
     * or any time the editor area might change height. EditorManager takes care of calling this when
     * the Editor is swapped, and on window resize. But anyone who changes size/visiblity of editor
     * area siblings (toolbar, status bar, bottom panels) *must* manually call resizeEditor().
     *
     * @param {string=} refreshFlag For internal use. Set to "force" to ensure the editor will refresh, 
     *    "skip" to ensure the editor does not refresh, or leave undefined to let resizeEditor() determine 
     *    whether it needs to refresh.
     */
    function resizeEditor(refreshFlag) {
        if (!_editorHolder) {
            return;  // still too early during init
        }
        
        var editorAreaHt = _calcEditorHeight();
        _editorHolder.height(editorAreaHt);    // affects size of "not-editor" placeholder as well
        
        if (_currentEditor) {
            var curRoot = _currentEditor.getRootElement(),
                curWidth = $(curRoot).width();
            if (!curRoot.style.height || $(curRoot).height() !== editorAreaHt) {
                $(curRoot).height(editorAreaHt);
                if (refreshFlag === undefined) {
                    refreshFlag = REFRESH_FORCE;
                }
            } else if (curWidth !== _lastEditorWidth) {
                if (refreshFlag === undefined) {
                    refreshFlag = REFRESH_FORCE;
                }
            }
            _lastEditorWidth = curWidth;

            if (refreshFlag === REFRESH_FORCE) {
                _currentEditor.refreshAll(true);
            }
        }
    }
    
    /**
     * NJ's editor-resizing fix. Whenever the window resizes, we immediately adjust the editor's
     * height.
     */
    function _updateEditorDuringResize() {
        // always skip the refresh since CodeMirror will call refresh() itself when it sees the resize event
        resizeEditor(REFRESH_SKIP);
    }
    
    
    /** Updates _viewStateCache from the given editor's actual current state */
    function _saveEditorViewState(editor) {
        _viewStateCache[editor.document.file.fullPath] = {
            selection: editor.getSelection(),
            scrollPos: editor.getScrollPos()
        };
    }
    
    /** Updates the given editor's actual state from _viewStateCache, if any state stored */
    function _restoreEditorViewState(editor) {
        // We want to ignore the current state of the editor, so don't call _getViewState()
        var viewState = _viewStateCache[editor.document.file.fullPath];
        if (viewState) {
            if (viewState.selection) {
                editor.setSelection(viewState.selection.start, viewState.selection.end);
            }
            if (viewState.scrollPos) {
                editor.setScrollPos(viewState.scrollPos.x, viewState.scrollPos.y);
            }
        }
    }
    
    /** Returns up-to-date view state for the given file, or null if file not open and no state cached */
    function _getViewState(fullPath) {
        if (_currentEditorsDocument && _currentEditorsDocument.file.fullPath === fullPath) {
            _saveEditorViewState(_currentEditor);
        }
        return _viewStateCache[fullPath];
    }
    
    /** Removes all cached view state info and replaces it with the given mapping */
    function _resetViewStates(viewStates) {
        _viewStateCache = viewStates;
    }

    /**
     * @private
     */
    function _doShow(document) {
        // Show new editor
        _currentEditorsDocument = document;
        _currentEditor = document._masterEditor;
        
        // Skip refreshing the editor since we're going to refresh it in resizeEditor() later.
        _currentEditor.setVisible(true, false);
        _currentEditor.focus();
        
        // Resize and refresh the editor, since it might have changed size or had other edits applied
        // since it was last visible.
        resizeEditor(REFRESH_FORCE);
    }

    /**
     * Make the given document's editor visible in the UI, hiding whatever was
     * visible before. Creates a new editor if none is assigned.
     * @param {!Document} document
     */
    function _showEditor(document) {
        // Hide whatever was visible before
        if (!_currentEditor) {
            $("#not-editor").css("display", "none");
        } else {
            _saveEditorViewState(_currentEditor);
            _currentEditor.setVisible(false);
            _destroyEditorIfUnneeded(_currentEditorsDocument);
        }
        
        // Ensure a main editor exists for this document to show in the UI
        var createdNewEditor = false;
        if (!document._masterEditor) {
            createdNewEditor = true;
            // Editor doesn't exist: populate a new Editor with the text
            _createFullEditorForDocument(document);
        }
        
        _doShow(document);
        
        if (createdNewEditor) {
            _restoreEditorViewState(document._masterEditor);
        }
    }
    

    /** Hide the currently visible editor and show a placeholder UI in its place */
    function _showNoEditor() {
        if (_currentEditor) {
            _saveEditorViewState(_currentEditor);
            _currentEditor.setVisible(false);
            _destroyEditorIfUnneeded(_currentEditorsDocument);
            
            _currentEditorsDocument = null;
            _currentEditor = null;
            
            $("#not-editor").css("display", "");
            
            // No other Editor is gaining focus, so in this one special case we must trigger event manually
            _notifyActiveEditorChanged(null);
        }
    }

    /** Handles changes to DocumentManager.getCurrentDocument() */
    function _onCurrentDocumentChange() {
        var doc = DocumentManager.getCurrentDocument(),
            container = _editorHolder.get(0);
        
        var perfTimerName = PerfUtils.markStart("EditorManager._onCurrentDocumentChange():\t" + (!doc || doc.file.fullPath));

        // Remove scroller-shadow from the current editor
        if (_currentEditor) {
            ViewUtils.removeScrollerShadow(container, _currentEditor);
        }
        
        // Update the UI to show the right editor (or nothing), and also dispose old editor if no
        // longer needed.
        if (doc) {
            _showEditor(doc);
            ViewUtils.addScrollerShadow(container, _currentEditor);
        } else {
            _showNoEditor();
        }

        PerfUtils.addMeasurement(perfTimerName);
    }
    
    /** Handles removals from DocumentManager's working set list */
    function _onWorkingSetRemove(event, removedFile) {
        // There's one case where an editor should be disposed even though the current document
        // didn't change: removing a document from the working set (via the "X" button). (This may
        // also cover the case where the document WAS current, if the editor-swap happens before the
        // removal from the working set.
        var doc = DocumentManager.getOpenDocumentForPath(removedFile.fullPath);
        if (doc) {
            _destroyEditorIfUnneeded(doc);
        }
        // else, file was listed in working set but never shown in the editor - ignore
    }

    function _onWorkingSetRemoveList(event, removedFiles) {
        removedFiles.forEach(function (removedFile) {
            _onWorkingSetRemove(event, removedFile);
        });
    }

    // Note: there are several paths that can lead to an editor getting destroyed
    //  - file was in working set, but not in current editor; then closed (via working set "X" button)
    //      --> handled by _onWorkingSetRemove()
    //  - file was in current editor, but not in working set; then navigated away from
    //      --> handled by _onCurrentDocumentChange()
    //  - file was in current editor, but not in working set; then closed (via File > Close) (and thus
    //    implicitly navigated away from)
    //      --> handled by _onCurrentDocumentChange()
    //  - file was in current editor AND in working set; then closed (via File > Close OR working set
    //    "X" button) (and thus implicitly navigated away from)
    //      --> handled by _onWorkingSetRemove() currently, but could be _onCurrentDocumentChange()
    //      just as easily (depends on the order of events coming from DocumentManager)
    
    /**
     * Designates the DOM node that will contain the currently active editor instance. EditorManager
     * will own the content of this DOM node.
     * @param {!jQueryObject} holder
     */
    function setEditorHolder(holder) {
        if (_currentEditor) {
            console.error("Cannot change editor area after an editor has already been created!");
            return;
        }
        
        _editorHolder = holder;
        
        resizeEditor();  // if no files open at startup, we won't get called back later to resize the "no-editor" placeholder
    }
    
    /**
     * Returns the currently focused inline widget, if any.
     * @return {?InlineWidget}
     */
    function getFocusedInlineWidget() {
        var result = null;
        
        if (_currentEditor) {
            _currentEditor.getInlineWidgets().forEach(function (widget) {
                if (widget.hasFocus()) {
                    result = widget;
                }
            });
        }
        
        return result;
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
     * @returns {?Editor}
     */
    function getFocusedEditor() {
        if (_currentEditor) {
            
            // See if any inlines have focus
            var focusedInline = _getFocusedInlineEditor();
            if (focusedInline) {
                return focusedInline;
            }

            // otherwise, see if full-sized editor has focus
            if (_currentEditor.hasFocus()) {
                return _currentEditor;
            }
        }
        
        return null;
    }
 
    /**
     * Returns the current active editor (full-sized OR inline editor). This editor may not 
     * have focus at the moment, but it is visible and was the last editor that was given 
     * focus. Returns null if no editors are active.
     * @see getFocusedEditor()
     * @returns {?Editor}
     */
    function getActiveEditor() {
        return _lastFocusedEditor;
    }
    
    
    /**
     * Toggle Quick Edit command handler
     * @return {!Promise} A promise resolved with true if an inline editor
     *   is opened or false when closed. The promise is rejected if there
     *   is no current editor or an inline editor is not created.
     */
    function _toggleQuickEdit() {
        var result = new $.Deferred();
        
        if (_currentEditor) {
            var inlineWidget = getFocusedInlineWidget();
            
            if (inlineWidget) {
                // an inline widget's editor has focus, so close it
                PerfUtils.markStart(PerfUtils.INLINE_EDITOR_CLOSE);
                inlineWidget.close();
                PerfUtils.addMeasurement(PerfUtils.INLINE_EDITOR_CLOSE);
        
                // return a resolved promise to CommandManager
                result.resolve(false);
            } else {
                // main editor has focus, so create an inline editor
                _openInlineWidget(_currentEditor).done(function () {
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
     * @private
     * Activates/Deactivates the automatic close brackets option
     */
    function _toggleCloseBrackets() {
        Editor.setCloseBrackets(!Editor.getCloseBrackets());
        CommandManager.get(Commands.TOGGLE_CLOSE_BRACKETS).setChecked(Editor.getCloseBrackets());
    }
    
    
    // Initialize: command handlers
    CommandManager.register(Strings.CMD_TOGGLE_QUICK_EDIT, Commands.TOGGLE_QUICK_EDIT, _toggleQuickEdit);
    CommandManager.register(Strings.CMD_TOGGLE_CLOSE_BRACKETS, Commands.TOGGLE_CLOSE_BRACKETS, _toggleCloseBrackets)
        .setChecked(Editor.getCloseBrackets());
    
    
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    $(DocumentManager).on("workingSetRemove", _onWorkingSetRemove);
    $(DocumentManager).on("workingSetRemoveList", _onWorkingSetRemoveList);

    // Add this as a capture handler so we're guaranteed to run it before the editor does its own
    // refresh on resize.
    window.addEventListener("resize", _updateEditorDuringResize, true);
    
    // For unit tests and internal use only
    exports._openInlineWidget = _openInlineWidget;
    exports._createFullEditorForDocument = _createFullEditorForDocument;
    exports._destroyEditorIfUnneeded = _destroyEditorIfUnneeded;
    exports._getViewState = _getViewState;
    exports._resetViewStates = _resetViewStates;
    exports._doShow = _doShow;
    exports._notifyActiveEditorChanged = _notifyActiveEditorChanged;
    
    exports.REFRESH_FORCE = REFRESH_FORCE;
    exports.REFRESH_SKIP = REFRESH_SKIP;
    
    // Define public API
    exports.setEditorHolder = setEditorHolder;
    exports.getCurrentFullEditor = getCurrentFullEditor;
    exports.createInlineEditorForDocument = createInlineEditorForDocument;
    exports.focusEditor = focusEditor;
    exports.getFocusedEditor = getFocusedEditor;
    exports.getActiveEditor = getActiveEditor;
    exports.getFocusedInlineWidget = getFocusedInlineWidget;
    exports.resizeEditor = resizeEditor;
    exports.registerInlineEditProvider = registerInlineEditProvider;
    exports.getInlineEditors = getInlineEditors;
    exports.closeInlineWidget = closeInlineWidget;
});
