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
        PanelManager        = require("view/PanelManager"),
        CommandManager      = require("command/CommandManager"),
        DocumentManager     = require("document/DocumentManager"),
        PerfUtils           = require("utils/PerfUtils"),
        Editor              = require("editor/Editor").Editor,
        InlineTextEditor    = require("editor/InlineTextEditor").InlineTextEditor,
        ImageViewer         = require("editor/ImageViewer"),
        Strings             = require("strings"),
        LanguageManager     = require("language/LanguageManager"),
        FileSystem          = require("filesystem/FileSystem"),
        FileSystemError     = require("filesystem/FileSystemError"),
        FileUtils           = require("file/FileUtils");
    
    /** @type {jQueryObject} DOM node that contains all editors (visible and hidden alike) */
    var _editorHolder = null;
    
    /**
     * Currently visible full-size Editor, or null if no editors open
     * @type {?Editor}
     */
    var _currentEditor = null;
    /** @type {?Document} */
    var _currentEditorsDocument = null;
    /** @type {?string} full path to file */
    var _currentlyViewedPath = null;
    /** @type {?JQuery} DOM node representing UI of custom view   */
    var _$currentCustomViewer = null;
    /** @type {?Object} view provider */
    var _currentViewProvider = null;
    /** Helper function defined as var to satisfy JSLint order constraints */
    var _checkFileExists;
    
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
     * Registered inline-editor widget providers sorted descending by priority. 
     * See {@link #registerInlineEditProvider()}.
     * @type {Array.<{priority:number, provider:function(...)}>}
     */
    var _inlineEditProviders = [];
    
    /**
     * Registered inline documentation widget providers sorted descending by priority.
     * See {@link #registerInlineDocsProvider()}.
     * @type {Array.<{priority:number, provider:function(...)}>}
     */
    var _inlineDocsProviders = [];
    
    /**
     * Registered jump-to-definition providers. See {@link #registerJumpToDefProvider()}.
     * @type {Array.<function(...)>}
     */
    var _jumpToDefProviders = [];
    
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
     * Finds an inline widget provider from the given list that can offer a widget for the current cursor
     * position, and once the widget has been created inserts it into the editor.
     * @param {!Editor} editor The host editor
     * @param {!Array.<{priority:number, provider:function(!Editor, !{line:number, ch:number}):?$.Promise}>} prioritized providers
     * @return {$.Promise} a promise that will be resolved when an InlineWidget 
     *      is created or rejected if no inline providers have offered one.
     */
    function _openInlineWidget(editor, providers) {
        PerfUtils.markStart(PerfUtils.INLINE_WIDGET_OPEN);
        
        // Run through inline-editor providers until one responds
        var pos = editor.getCursorPos(),
            inlinePromise,
            i,
            result = new $.Deferred();
        
        for (i = 0; i < providers.length && !inlinePromise; i++) {
            var provider = providers[i].provider;
            inlinePromise = provider(editor, pos);
        }
        
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
                result.reject();
            });
        } else {
            // terminate timer that was started above
            PerfUtils.finalizeMeasurement(PerfUtils.INLINE_WIDGET_OPEN);
            result.reject();
        }
        
        return result.promise();
    }
    
    /**
     * Inserts a prioritized provider object into the array in sorted (descending) order.
     *
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
     * @param {function(!Editor, !{line:number, ch:number}):?$.Promise} provider
     * @param {number=} priority 
     * The provider returns a promise that will be resolved with an InlineWidget, or returns null
     * to indicate the provider doesn't want to respond to this case.
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
     * @param {function(!Editor, !{line:number, ch:number}):?$.Promise} provider
     * @param {number=} priority 
     * The provider returns a promise that will be resolved with an InlineWidget, or returns null
     * to indicate the provider doesn't want to respond to this case.
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
     * @param {function(!Editor, !{line:number, ch:number}):?$.Promise} provider
     * The provider returns a promise that will be resolved with jump-to-definition results, or
     * returns null to indicate the provider doesn't want to respond to this case.
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
        // Hide the container for the editor before creating it so that CodeMirror doesn't do extra work
        // when initializing the document. When we construct the editor, we have to set its text and then
        // set the (small) visible range that we show in the editor. If the editor is visible, CM has to
        // render a large portion of the document before setting the visible range. By hiding the editor
        // first and showing it after the visible range is set, we avoid that initial render.
        $(inlineContent).hide();
        var inlineEditor = _createEditorForDocument(doc, false, inlineContent, range);
        $(inlineContent).show();
        
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
            if (!(document instanceof DocumentManager.Document)) {
                throw new Error("_destroyEditorIfUnneeded() should be passed a Document");
            }
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
     * Flag for _onEditorAreaResize() to always force refresh.
     * @const
     * @type {string}
     */
    var REFRESH_FORCE = "force";
    
    /**
     * Flag for _onEditorAreaResize() to never refresh.
     * @const
     * @type {string}
     */
    var REFRESH_SKIP = "skip";

    /**
     * Must be called whenever the size/visibility of editor area siblings is changed without going through
     * PanelManager or Resizer. Resizable panels created via PanelManager do not require this manual call.
     */
    function resizeEditor() {
        if (!_editorHolder) {
            return;  // still too early during init
        }
        // PanelManager computes the correct editor-holder size & calls us back with it, via _onEditorAreaResize()
        PanelManager._notifyLayoutChange();
    }
    
    /**
     * Update the current CodeMirror editor's size. Must be called any time the contents of the editor area
     * are swapped or any time the editor-holder area has changed height. EditorManager calls us in the swap
     * case. PanelManager calls us in the most common height-change cases (panel and/or window resize), but
     * some other cases are handled by external code calling resizeEditor() (e.g. ModalBar hide/show).
     * 
     * @param {number} editorAreaHt
     * @param {string=} refreshFlag For internal use. Set to "force" to ensure the editor will refresh, 
     *    "skip" to ensure the editor does not refresh, or leave undefined to let _onEditorAreaResize()
     *    determine whether it needs to refresh.
     */
    function _onEditorAreaResize(event, editorAreaHt, refreshFlag) {
        if (_currentEditor) {
            var curRoot = _currentEditor.getRootElement(),
                curWidth = $(curRoot).width();
            if (!curRoot.style.height || $(curRoot).height() !== editorAreaHt) {
                // Call setSize() instead of $.height() to allow CodeMirror to
                // check for options like line wrapping
                _currentEditor.setSize(null, editorAreaHt);
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
        
        // Skip refreshing the editor since we're going to refresh it more explicitly below
        _currentEditor.setVisible(true, false);
        _currentEditor.focus();
        
        // Resize and refresh the editor, since it might have changed size or had other edits applied
        // since it was last visible.
        PanelManager._notifyLayoutChange(REFRESH_FORCE);
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

            // Performance (see #4757) Chrome wastes time messing with selection
            // that will just be changed at end, so clear it for now
            if (window.getSelection && window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            }
            
            // Editor doesn't exist: populate a new Editor with the text
            _createFullEditorForDocument(document);
        }
        
        _doShow(document);
        
        if (createdNewEditor) {
            _restoreEditorViewState(document._masterEditor);
        }
    }
    
    /**
     * resets editor state to make sure getFocusedEditor(), getActiveEditor() 
     * and getCurrentFullEditor() return null when an image or the NoEditor 
     * placeholder is displayed.
     */
    function _nullifyEditor() {
        if (_currentEditor) {
            _saveEditorViewState(_currentEditor);
            
            // This is a hack to deal with #5589. The issue is that CodeMirror's logic for polling its
            // hidden input field relies on whether there's a selection in the input field or not. When
            // we hide the editor, the input field loses its selection. Somehow, CodeMirror's readInput()
            // poll can get called before the resulting blur event is asynchronously sent. (Our guess is
            // that if the setTimeout() that the poll is on is overdue, it gets serviced before the backlog
            // of asynchronous events is flushed.) That means that readInput() thinks CM still has focus,
            // but that the hidden input has lost its selection, meaning the user has typed something, which
            // causes it to replace the editor selection (with the same text), leading to the erroneous
            // change event and selection change. To work around this, we simply blur CM's input field
            // before hiding the editor, which forces the blur event to be sent synchronously, before the
            // next readInput() triggers.
            //
            // Note that we only need to do this here, not in _showEditor(), because _showEditor()
            // ends up synchronously setting focus to another editor, which has the effect of
            // forcing a synchronous blur event as well.
            _currentEditor._codeMirror.getInputField().blur();
            
            _currentEditor.setVisible(false);
            _destroyEditorIfUnneeded(_currentEditorsDocument);
            
            _currentEditorsDocument = null;
            _currentEditor = null;
            _currentlyViewedPath = null;
            
            // No other Editor is gaining focus, so in this one special case we must trigger event manually
            _notifyActiveEditorChanged(null);
        }
    }
    
    /** Hide the currently visible editor and show a placeholder UI in its place */
    function _showNoEditor() {
        $("#not-editor").css("display", "");
        _nullifyEditor();
    }
    
    function getCurrentlyViewedPath() {
        return _currentlyViewedPath;
    }
    
    function _clearCurrentlyViewedPath() {
        _currentlyViewedPath = null;
        $(exports).triggerHandler("currentlyViewedFileChange");
    }
    
    function _setCurrentlyViewedPath(fullPath) {
        _currentlyViewedPath = fullPath;
        $(exports).triggerHandler("currentlyViewedFileChange");
    }
    
    /** Remove existing custom view if present */
    function _removeCustomViewer() {
        window.removeEventListener("focus", _checkFileExists);
        $(exports).triggerHandler("removeCustomViewer");
        if (_$currentCustomViewer) {
            _$currentCustomViewer.remove();
        }
        _$currentCustomViewer = null;
        _currentViewProvider = null;
    }

    /** 
     * Clears custom viewer for a file with a given path and displays 
     * an alternate file or the no editor view. 
     * If no param fullpath is passed an alternate file will be opened 
     * regardless of the current value of _currentlyViewedPath.
     * If param fullpath is provided then only if fullpath matches 
     * the currently viewed file an alternate file will be opened.
     * @param {?string} fullPath - file path of deleted file.
     */
    function notifyPathDeleted(fullPath) {
        function openAlternateFile() {
            var fileToOpen = DocumentManager.getNextPrevFile(1);
            if (fileToOpen) {
                CommandManager.execute(Commands.FILE_OPEN, {fullPath: fileToOpen.fullPath});
            } else {
                _removeCustomViewer();
                _showNoEditor();
                _setCurrentlyViewedPath();
            }
        }
        if (!fullPath || _currentlyViewedPath === fullPath) {
            openAlternateFile();
        }
    }
    
    /*
     * show a generic error or File Not Found in modal error dialog
     */
    function _showErrorAndNotify(err, fullPath) {
        var errorToShow = err || FileSystemError.NOT_FOUND;
        FileUtils.showFileOpenError(errorToShow, fullPath).done(
            function () {
                notifyPathDeleted();
            }
        );
    }

    /*
     * callback function passed to file.exists. If file in view does
     * not exist the current view will be replaced.
     */
    function _removeViewIfFileDeleted(err, fileExists) {
        if (!fileExists) {
            notifyPathDeleted();
        }
    }
    
    /** 
     * Makes sure that the file in view is present in the file system
     * Close and warn if file is gone.
     */
    _checkFileExists = function () {
        var file = FileSystem.getFileForPath(getCurrentlyViewedPath());
        file.exists(_removeViewIfFileDeleted);
    };
    
    /** 
     * Closes the customViewer currently displayed, shows the NoEditor view
     * and notifies the ProjectManager to update the file selection
     */
    function closeCustomViewer() {
        _removeCustomViewer();
        _currentlyViewedPath = "";
        _showNoEditor();
    }
    
    /** 
     * Append custom view to editor-holder
     * @param {!Object} provider  custom view provider
     * @param {!string} fullPath  path to the file displayed in the custom view
     * @return {!Promise} A promise resolved after image is displayed, rejected when 
     *   image file not found.
     */
    function showCustomViewer(provider, fullPath) {
        var result = new $.Deferred();
        function _doShow(err, fileExists) {
            if (!fileExists) {
                _showErrorAndNotify(err, fullPath);
                result.reject();
            } else {
                // Don't show the same custom view again if file path
                // and view provider are still the same.
                if (_currentlyViewedPath === fullPath &&
                        _currentViewProvider === provider) {
                    result.resolve();
                    return;
                }
                
                // Clean up currently viewing document or custom viewer
                DocumentManager._clearCurrentDocument();
                _removeCustomViewer();
            
                // Hide the not-editor or reset current editor
                $("#not-editor").css("display", "none");
                _nullifyEditor();
        
                _currentViewProvider = provider;
                _$currentCustomViewer = provider.getCustomViewHolder(fullPath);
        
                // place in window
                $("#editor-holder").append(_$currentCustomViewer);
                
                // add path, dimensions and file size to the view after loading image
                provider.render(fullPath);
                // make sure the file in display is still there when window gets focus.
                // close and warn if the file is gone.
                window.addEventListener("focus", _checkFileExists);
                _setCurrentlyViewedPath(fullPath);
                result.resolve();
            }
        }
        var file = FileSystem.getFileForPath(fullPath);
        file.exists(_doShow);
        
        return result.promise();
    }
               

    /**
     * Check whether the given file is currently open in a custom viewer.
     *
     * @param {!string} fullPath  file path to check
     * @return {boolean} true if we have a custom viewer showing and the given file
     *     path matches the one in the custom viewer, false otherwise.
     */
    function showingCustomViewerForPath(fullPath) {
        return (_currentViewProvider && _currentlyViewedPath === fullPath);
    }
    
    /**
     * Update file name if necessary
     */
    function _onFileNameChange(e, oldName, newName) {
        if (_currentlyViewedPath === oldName) {
            _setCurrentlyViewedPath(newName);
        }
    }

    /** 
     * Return the provider of a custom viewer for the given path if one exists.
     * Otherwise, return null.
     *
     * @param {!string} fullPath - file path to be checked for a custom viewer
     * @return {?Object}
     */
    function getCustomViewerForPath(fullPath) {
        var lang = LanguageManager.getLanguageForPath(fullPath);
        if (lang.getId() === "image") {
            // TODO: Extensibility
            // For now we only have the image viewer, so just return ImageViewer object.
            // Once we have each viewer registers with EditorManager as a provider,
            // then we return the provider registered with the language id.
            return ImageViewer;
        }
        
        return null;
    }
    
    /** Handles changes to DocumentManager.getCurrentDocument() */
    function _onCurrentDocumentChange() {
        var doc = DocumentManager.getCurrentDocument(),
            container = _editorHolder.get(0);
        
        var perfTimerName = PerfUtils.markStart("EditorManager._onCurrentDocumentChange():\t" + (!doc || doc.file.fullPath));
        
        // When the document or file in view changes clean up.
        _removeCustomViewer();
        // Update the UI to show the right editor (or nothing), and also dispose old editor if no
        // longer needed.
        if (doc) {
            _showEditor(doc);
            _setCurrentlyViewedPath(doc.file.fullPath);
        } else {
            _clearCurrentlyViewedPath();
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
     * Closes any focused inline widget. Else, asynchronously asks providers to create one.
     *
     * @param {Array.<{priority:number, provider:function(...)}>} prioritized providers
     * @return {!Promise} A promise resolved with true if an inline widget is opened or false
     *   when closed. Rejected if there is neither an existing widget to close nor a provider
     *   willing to create a widget (or if no editor is open).
     */
    function _toggleInlineWidget(providers) {
        var result = new $.Deferred();
        
        if (_currentEditor) {
            var inlineWidget = getFocusedInlineWidget();
            
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
                _openInlineWidget(_currentEditor, providers).done(function () {
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
     * Asynchronously asks providers to handle jump-to-definition.
     * @return {!Promise} null if no appropriate provider exists. Else, returns a promise
     *  which is resolved by adjusting the editor selection to the requested definition.
     */
    function _doJumpToDef() {
        var providers = _jumpToDefProviders;
        var promise,
            i,
            result = new $.Deferred();
        
        if (_currentEditor) {
            // main editor has focus

            PerfUtils.markStart(PerfUtils.JUMP_TO_DEFINITION);
            
            // Run through providers until one responds
            for (i = 0; i < providers.length && !promise; i++) {
                var provider = providers[i];
                promise = provider();
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
    
    // Initialize: command handlers
    CommandManager.register(Strings.CMD_TOGGLE_QUICK_EDIT, Commands.TOGGLE_QUICK_EDIT, function () {
        return _toggleInlineWidget(_inlineEditProviders);
    });
    CommandManager.register(Strings.CMD_TOGGLE_QUICK_DOCS, Commands.TOGGLE_QUICK_DOCS, function () {
        return _toggleInlineWidget(_inlineDocsProviders);
    });
    CommandManager.register(Strings.CMD_JUMPTO_DEFINITION, Commands.NAVIGATE_JUMPTO_DEFINITION, _doJumpToDef);
    
    // Create PerfUtils measurement
    PerfUtils.createPerfMeasurement("JUMP_TO_DEFINITION", "Jump-To-Definiiton");

    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    $(DocumentManager).on("workingSetRemove",      _onWorkingSetRemove);
    $(DocumentManager).on("workingSetRemoveList",  _onWorkingSetRemoveList);
    $(DocumentManager).on("fileNameChange",        _onFileNameChange);
    $(PanelManager).on("editorAreaResize",         _onEditorAreaResize);


    // For unit tests and internal use only
    exports._openInlineWidget             = _openInlineWidget;
    exports._createFullEditorForDocument  = _createFullEditorForDocument;
    exports._destroyEditorIfUnneeded      = _destroyEditorIfUnneeded;
    exports._getViewState                 = _getViewState;
    exports._resetViewStates              = _resetViewStates;
    exports._doShow                       = _doShow;
    exports._notifyActiveEditorChanged    = _notifyActiveEditorChanged;
    
    exports.REFRESH_FORCE = REFRESH_FORCE;
    exports.REFRESH_SKIP  = REFRESH_SKIP;
    
    // Define public API
    exports.setEditorHolder               = setEditorHolder;
    exports.getCurrentFullEditor          = getCurrentFullEditor;
    exports.createInlineEditorForDocument = createInlineEditorForDocument;
    exports.focusEditor                   = focusEditor;
    exports.getFocusedEditor              = getFocusedEditor;
    exports.getActiveEditor               = getActiveEditor;
    exports.getCurrentlyViewedPath        = getCurrentlyViewedPath;
    exports.getFocusedInlineWidget        = getFocusedInlineWidget;
    exports.resizeEditor                  = resizeEditor;
    exports.registerInlineEditProvider    = registerInlineEditProvider;
    exports.registerInlineDocsProvider    = registerInlineDocsProvider;
    exports.registerJumpToDefProvider     = registerJumpToDefProvider;
    exports.getInlineEditors              = getInlineEditors;
    exports.closeInlineWidget             = closeInlineWidget;
    exports.showCustomViewer              = showCustomViewer;
    exports.getCustomViewerForPath        = getCustomViewerForPath;
    exports.notifyPathDeleted             = notifyPathDeleted;
    exports.closeCustomViewer             = closeCustomViewer;
    exports.showingCustomViewerForPath    = showingCustomViewerForPath;
});
