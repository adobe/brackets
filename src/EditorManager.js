/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

/**
 * EditorManager owns the UI for the editor area. This essentially mirrors the 'current document'
 * property maintained by DocumentManager's model.
 *
 * Note that there is a little bit of unusual overlap between EditorManager and DocumentManager:
 * because the Document state is actually stored in the CodeMirror editor UI, DocumentManager is
 * not a pure headless model. Each Document encapsulates an editor instance, and thus EditorManager
 * must have some knowledge about Document's internal state (we access its _editor property).
 *
 * This module does not dispatch any events.
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var FileUtils           = require("FileUtils"),
        DocumentManager     = require("DocumentManager"),
        Editor              = require("Editor").Editor,
        EditorUtils         = require("EditorUtils"),
        Strings             = require("strings");
    
    /** @type {jQueryObject} DOM node that contains all editors (visible and hidden alike) */
    var _editorHolder = null;
    
    /** @type {Editor} */
    var _currentEditor = null;
    /** @type {Document} */
    var _currentEditorsDocument = null;
    
    /** @type {number} Used by {@link #_updateEditorSize()} */
    var _resizeTimeout = null;
    
    /**
     * Registered inline-editor widget providers. See {@link #registerInlineEditProvider()}.
     * @type {Array.<function(...)>}
     */
    var _inlineEditProviders = [];
    
    /**
     * Creates a new Editor bound to the given Document. The editor's mode is inferred based on the
     * file extension. The editor is appended to the given container as a visible child.
     * @param {!Document} doc  Document for the Editor's content
     * @param {!boolean} makeMasterEditor  If true, the Editor will set itself as the private "master"
     *          Editor for the Document. If false, the Editor will attach to the Document as a "slave."
     * @param {!jQueryObject} container  Container to add the editor to.
     * @param {!function} onInlineGesture  Handler for Ctrl+E command (open/close inline, depending
                on context)
     * @return {Editor} the newly created editor.
     */
    function _createEditorForDocument(doc, makeMasterEditor, container, onInlineGesture) {
        var mode = EditorUtils.getModeFromFileExtension(doc.file.fullPath);
        
        var extraKeys = {
            "Ctrl-E" : function (editor) {
                onInlineGesture(editor);
            },
            "Cmd-E" : function (editor) {
                onInlineGesture(editor);
            },
            "Shift-Ctrl-F" : function () {
                // No-op, handled in FindInFiles.js
            },
            "Shift-Cmd-F" : function () {
                // No-op, handled in FindInFiles.js
            }
        };

        return new Editor(doc, makeMasterEditor, mode, container, extraKeys);
    }
    
    /**
     * @private
     * Bound to Ctrl+E on outermost editors.
     * @return {$.Promise} a promise that will be resolved when an inline 
     *  editor is created or rejected when no inline editors are available.
     */
    function _openInlineWidget(editor) {
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
            inlinePromise.done(function (inlineContent) {
                var inlineId = editor.addInlineWidget(pos, inlineContent.content, inlineContent.height,
                                            inlineContent.onClosed, inlineContent);
                inlineContent.onAdded(inlineId);
                result.resolve();
            }).fail(function () {
                result.reject();
            });
        } else {
            result.reject();
        }
        
        return result.promise();
    }
    
    /**
     * Removes the given widget UI from the given hostEdtior (agnostic of what the widget's content
     * is). The widget's onClosed() callback will be run as a result.
     * @param {!Editor} hostEditor
     * @param {!number} inlineId
     * @param {!boolean} moveFocus  If true, focuses hostEditor and ensures the cursor position lies
     *      near the inline's location.
     */
    function _closeInlineWidget(hostEditor, inlineId, moveFocus) {
        if (moveFocus) {
            // Place cursor back on the line just above the inline (the line from which it was opened)
            // If cursor's already on that line, leave it be to preserve column position
            var widgetLine = hostEditor._codeMirror.getInlineWidgetInfo(inlineId).line;
            var cursorLine = hostEditor.getCursorPos().line;
            if (cursorLine !== widgetLine) {
                hostEditor.setCursorPos({ line: widgetLine, pos: 0 });
            }
            
            hostEditor.focus();
        }
        
        hostEditor.removeInlineWidget(inlineId);
        
    }
    
    function registerInlineEditProvider(provider) {
        _inlineEditProviders.push(provider);
    }
    
    /**
     * @private
     * Given a host editor, return a list of all its open inline Editors. (Ignoring any other
     * inline widgets that might be open).
     * @param {!Editor} hostEditor
     * @return {Array.<Editor>}
     */
    function _getInlineEditors(hostEditor) {
        var inlineEditors = [];
        hostEditor.getInlineWidgets().forEach(function (widget) {
            if (widget.data.editor) {
                inlineEditors.push(widget.data.editor);
            }
        });
        return inlineEditors;
    }
    
    /**
     * @private
     * Given a host editor and its inline editors, find the widest gutter and make all the others match
     * @param {!Editor} hostEditor Host editor containing all the inline editors to sync
     */
    function _syncGutterWidths(hostEditor) {
        var editors = _getInlineEditors(hostEditor);
        // add the host to the list and go through them all
        editors.push(hostEditor);
        
        var maxWidth = 0;
        editors.forEach(function (editor) {
            var gutter = $(editor._codeMirror.getGutterElement());
            gutter.css("min-width", "");
            var curWidth = gutter.width();
            if (curWidth > maxWidth) {
                maxWidth = curWidth;
            }
        });
        
        if (editors.length === 1) {
            //There's only the host, just bail
            editors[0]._codeMirror.setOption("gutter", true);
            return;
        }
        
        maxWidth = maxWidth + "px";
        editors.forEach(function (editor) {
            $(editor._codeMirror.getGutterElement()).css("min-width", maxWidth);
            editor._codeMirror.setOption("gutter", true);
        });
    }
    
    
    /**
     * @private
     * Creates a new "full-size" (not inline) Editor for the given Document, and sets it as the
     * Document's master backing editor. The editor is not yet visible; to show it, use
     * DocumentManager.setCurrentDocument().
     * Semi-private: should not be called outside this module other than by Editor.
     * @param {!Document} document  Document whose main/full Editor to create
     */
    function _createFullEditorForDocument(document) {
        // Create editor; make it initially invisible
        var container = _editorHolder.get(0);
        var editor = _createEditorForDocument(document, true, container, _openInlineWidget);
        $(editor._codeMirror.getWrapperElement()).css("display", "none");
    }
    
    /** Returns the visible full-size Editor corresponding to DocumentManager.getCurrentDocument() */
    function getCurrentFullEditor() {
        // This *should* always be equivalent to DocumentManager.getCurrentDocument()._masterEditor
        return _currentEditor;
    }

    
    /**
     * Creates a new inline Editor instance for the given Document. The editor's mode is inferred
     * based on the file extension. The editor is not yet visible or attached to a host editor.
     * @param {!Editor} hostEditor  Outer Editor instance that inline editor will sit within.
     * @param {!Document} doc  Document for the Editor's content
     * @param {?{startLine:Number, endLine:Number}} range  If specified, all lines outside the given
     *      range are hidden from the editor. Range is inclusive. Line numbers start at 0.
     *
     * @return {{content:DOMElement, editor:Editor, height:Number, onAdded:function(inlineId:Number), onClosed:function()}}
     * FUTURE: we should really make the bag that _openInlineWidget() expects into an interface that's
     * also understood by Editor.addInlineWidget()... since it now contains methods & such.
     */
    function createInlineEditorForDocument(hostEditor, doc, range) {
        // Container to hold editor & render its stylized frame
        var inlineContent = document.createElement('div');
        $(inlineContent).addClass("inlineCodeEditor");
        
        var myInlineId;   // (id is set when afterAdded() runs)
        
        // Used to manually trigger closing this inline
        function closeThisInline(inlineEditor) {
            var shouldMoveFocus = inlineEditor.hasFocus();
            _closeInlineWidget(hostEditor, myInlineId, shouldMoveFocus);
            // _closeInlineWidget() causes afterClosed() to get run
        }
        
        // Create the Editor
        var inlineEditor = _createEditorForDocument(doc, false, inlineContent, closeThisInline);
        
        // Update the inline editor's height when the number of lines change
        var prevHeight;
        function sizeInlineEditorToContents() {
            var height = inlineEditor.totalHeight(true);
            if (height !== prevHeight) {
                prevHeight = height;
                hostEditor.setInlineWidgetHeight(myInlineId, height, true);
                $(inlineEditor.getScrollerElement()).height(height);
                inlineEditor.refresh();
            }
        }
        
        // When text is edited, auto-resize UI and sync changes to a backing full-size editor
        $(inlineEditor).on("change", function () {
            // Size editor to current contents
            sizeInlineEditorToContents();
        });
        
        // If anyone else touches the Document, close this editor since it has fallen out of date
        $(inlineEditor).on("lostSync", function () {
            closeThisInline(inlineEditor);
        });
        
        // Some tasks have to wait until we've been parented into the outer editor
        function afterAdded(inlineId) {
            myInlineId = inlineId;
            
            // Hide all lines other than those we want to show. We do this rather than trimming the
            // text itself so that the editor still shows accurate line numbers.
            var didHideLines  = false;
            if (range) {
                inlineEditor._codeMirror.operation(function () {
                    var i;
                    for (i = 0; i < range.startLine; i++) {
                        didHideLines  = true;
                        inlineEditor.hideLine(i);
                    }
                    var lineCount = inlineEditor.lineCount();
                    for (i = range.endLine + 1; i < lineCount; i++) {
                        didHideLines  = true;
                        inlineEditor.hideLine(i);
                    }
                });
                inlineEditor.setCursorPos(range.startLine, 0);
                _syncGutterWidths(hostEditor);
            }
            
            // If we haven't hidden any lines (which would have caused an update already), 
            // force the editor to update its display so we measure the correct height below
            // when sizeInlineEditorToContents() calls totalHeight().
            if (!didHideLines) {
                inlineEditor.refresh();
            }
            
            // Set initial size
            sizeInlineEditorToContents();
            
            inlineEditor.focus();
        }
        
        // Called any time inline was closed, whether manually (via closeThisInline()) or automatically
        function afterClosed() {
            _syncGutterWidths(hostEditor);
            inlineEditor.destroy(); //release ref on Document
        }
        
        return { content: inlineContent, editor: inlineEditor, height: 0, onAdded: afterAdded, onClosed: afterClosed };
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

    /** Focus the currently visible full-size editor. If no editor visible, does nothing. */
    function focusEditor() {
        if (_currentEditor) {
            _currentEditor.focus();
        }
    }
    
    
    /** 
     * Resize the editor. This should only be called if the contents of the editor holder are changed
     * or if the height of the editor holder changes (except for overall window resizes, which are
     * already taken care of automatically).
     * @see #_updateEditorSize()
     */
    function resizeEditor() {
        if (_currentEditor) {
            $(_currentEditor.getScrollerElement()).height(_editorHolder.height());
            _currentEditor.refresh();
        }
    }
    
    /**
     * NJ's editor-resizing fix. Whenever the window resizes, we immediately adjust the editor's
     * height.
     * @see #resizeEditor()
     */
    function _updateEditorSize() {
        // The editor itself will call refresh() when it gets the window resize event.
        if (_currentEditor) {
            $(_currentEditor.getScrollerElement()).height(_editorHolder.height());
        }
    }
    
    
    /**
     * @private
     */
    function _doShow(document) {
        // Show new editor
        _currentEditorsDocument = document;
        _currentEditor = document._masterEditor;
        
        $(_currentEditor._codeMirror.getWrapperElement()).css("display", "");
        
        // Window may have been resized since last time editor was visible, so kick it now
        resizeEditor();
    }

    /**
     * Make the given document's editor visible in the UI, hiding whatever was
     * visible before. Creates a new editor if none is assigned.
     * @param {!Document} document
     */
    function _showEditor(document) {
        // Hide whatever was visible before
        if (!_currentEditor) {
            $("#notEditor").css("display", "none");
        } else {
            $(_currentEditor._codeMirror.getWrapperElement()).css("display", "none");
            _destroyEditorIfUnneeded(_currentEditorsDocument);
        }
        
        // Ensure a main editor exists for this document to show in the UI
        if (!document._masterEditor) {
            // Editor doesn't exist: populate a new Editor with the text
            _createFullEditorForDocument(document);
        }
        
        _doShow(document);
    }
    

    /** Hide the currently visible editor and show a placeholder UI in its place */
    function _showNoEditor() {
        if (_currentEditor) {
            $(_currentEditor._codeMirror.getWrapperElement()).css("display", "none");
            _destroyEditorIfUnneeded(_currentEditorsDocument);
            
            _currentEditorsDocument = null;
            _currentEditor = null;
            
            $("#notEditor").css("display", "");
        }
    }

    /** Handles changes to DocumentManager.getCurrentDocument() */
    function _onCurrentDocumentChange() {
        var doc = DocumentManager.getCurrentDocument();
        
        // Update the UI to show the right editor (or nothing), and also dispose old editor if no
        // longer needed.
        if (doc) {
            _showEditor(doc);
        } else {
            _showNoEditor();
        }
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
            throw new Error("Cannot change editor area after an editor has already been created!");
        }
        
        _editorHolder = holder;
    }
    
    /**
     * Returns the currently focused editor instance.
     * @returns {Editor}
     */
    function getFocusedEditor() {
        if (_currentEditor) {
            var focusedInline;
            
            // See if any inlines have focus
            _currentEditor.getInlineWidgets().forEach(function (widget) {
                if (widget.data.editor && widget.data.editor.hasFocus()) {
                    focusedInline = widget.data.editor;
                }
            });
            
            if (focusedInline) {
                return focusedInline;
            }
            
            if (_currentEditor.hasFocus()) {
                return _currentEditor;
            }
        }
        
        return null;
    }
    
    
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    $(DocumentManager).on("workingSetRemove", _onWorkingSetRemove);
    // Add this as a capture handler so we're guaranteed to run it before the editor does its own
    // refresh on resize.
    window.addEventListener("resize", _updateEditorSize, true);
    
    // For unit tests
    exports._openInlineWidget = _openInlineWidget;
    exports._closeInlineWidget = _closeInlineWidget;
    
    // Define public API
    exports.setEditorHolder = setEditorHolder;
    exports.getCurrentFullEditor = getCurrentFullEditor;
    exports.createInlineEditorForDocument = createInlineEditorForDocument;
    exports._createFullEditorForDocument = _createFullEditorForDocument;
    exports.focusEditor = focusEditor;
    exports.getFocusedEditor = getFocusedEditor;
    exports.resizeEditor = resizeEditor;
    exports.registerInlineEditProvider = registerInlineEditProvider;
});
