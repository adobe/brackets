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
     * Creates a new CodeMirror editor instance containing the given text. The editor's mode is set
     * based on the given filename's extension (the actual file on disk is never examined). The
     * editor is appended to the given container as a visible child.
     * @param {!string} text  The text content of the editor.
     * @param {!string} fileNameToSelectMode  A filename from which to infer the editor's mode. May
     *          include path too.
     * @param {!jQueryObject} container  Container to add the editor to.
     * @param {!function} onInlineGesture  Handler for Ctrl+E command (open/close inline, depending
                on context)
     * @return {Editor} the newly created editor.
     */
    function _createEditorFromText(text, fileNameToSelectMode, container, onInlineGesture) {
        var mode = EditorUtils.getModeFromFileExtension(fileNameToSelectMode);
        
        var extraKeys = {
            "Ctrl-E" : function (editor) {
                onInlineGesture(editor);
            },
            "Cmd-E" : function (editor) {
                onInlineGesture(editor);
            }
        };

        return new Editor(text, mode, container, extraKeys);
    }
    
    /** Bound to Ctrl+E on outermost editors */
    function _openInlineWidget(editor) {
        // Run through inline-editor providers until one responds
        var pos = editor.getCursorPos();
        var inlinePromise;
        var i;
        for (i = 0; i < _inlineEditProviders.length && !inlinePromise; i++) {
            var provider = _inlineEditProviders[i];
            inlinePromise = provider(editor, pos);
        }
        
        // If one of them will provide a widget, show it inline once ready
        if (inlinePromise) {
            inlinePromise.done(function (inlineContent) {
                var inlineId = editor.addInlineWidget(pos, inlineContent.content, inlineContent.height, inlineContent);
                inlineContent.onAdded(inlineId);
            });
        }
    }
    
    function _closeInlineWidget(hostEditor, inlineId) {
        // Place cursor back on the line just above the inline (the line from which it was opened)
        // If cursor's already on that line, leave it be to preserve column position
        var widgetLine = hostEditor._codeMirror.getInlineWidgetInfo(inlineId).line;
        var cursorLine = hostEditor.getCursorPos().line;
        if (cursorLine !== widgetLine) {
            hostEditor.setCursorPos({ line: widgetLine, pos: 0 });
        }
        
        hostEditor.removeInlineWidget(inlineId);
        
        hostEditor.focus();
    }
    
    function registerInlineEditProvider(provider) {
        _inlineEditProviders.push(provider);
    }
    
    /**
     * @private
     * Given a host editor, return a list of all its open inline editors. (Ignoring any other
     * inline widgets that might be open).
     * @param {!Editor} hostEditor
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
     * Creates a new "full-size" (not inline) Editor from the Document's file, and sets it as the
     * Document's main editor. The editor is not yet visible; to show it, call
     * DocumentManager.showInEditor().
     * @param {!Document} document  Document whose main/full Editor to create
     * @return {Deferred} a jQuery Deferred that will be resolved once Document.editor is populated,
     *      or rejected with a FileError if the file cannot be read. Does not show any error UI.
     */
    function createFullEditorForDocument(document) {
        var result = new $.Deferred(),
            reader = FileUtils.readAsText(document.file);
            
        reader.done(function (text, readTimestamp) {
            // Create editor; make it initially invisible
            var container = _editorHolder.get(0);
            var editor = _createEditorFromText(text, document.file.fullPath, container, _openInlineWidget);
            $(editor._codeMirror.getWrapperElement()).css("display", "none");
            
            document._setEditor(editor, readTimestamp, text);
            result.resolve();
        });
        reader.fail(function (error) {
            result.reject(error);
        });
        
        return result;
    }

    
    /**
     * Creates a new inline CodeMirror editor instance containing the given text. The editor's mode
     * is set based on the given filename's extension (the actual file on disk is never examined).
     * The editor is not yet visible.
     * @param {!Editor} hostEditor  Outer Editor instance that inline editor will sit within.
     * @param {!string} text  The text content of the editor.
     * @param {?{startLine:Number, endLine:Number}} range  If specified, all lines outside the given
     *      range are hidden from the editor. Range is inclusive. Line numbers start at 0.
     * @param {!FileEntry} sourceFile  The file from which the text was drawn. Ties the inline editor
     *      back to the full editor from which edits can be saved; also determines the editor's mode.
     *
     * @returns {{content:DOMElement, editor:Editor, source: FileEntry, height:Number, onAdded:function(inlineId:Number)}}
     */
    function createInlineEditorFromText(hostEditor, text, range, sourceFile) {
        // Container to hold editor & render its stylized frame
        var inlineContent = document.createElement('div');
        $(inlineContent).addClass("inlineCodeEditor");
        
        var myInlineId;  // id is set when afterAdded() runs
        function closeThisInline() {
            _closeInlineWidget(hostEditor, myInlineId);
            _syncGutterWidths(hostEditor);
        }
        
        var inlineEditor = _createEditorFromText(text, sourceFile.fullPath, inlineContent, closeThisInline);

        // Update the inline editor's height when the number of lines change
        var prevLineCount;
        function sizeInlineEditorToContents() {
            var lineCount = inlineEditor.lineCount();
            if (lineCount !== prevLineCount) {
                prevLineCount = lineCount;
                var widgetHeight = inlineEditor.totalHeight(true);
                hostEditor.setInlineWidgetHeight(myInlineId, widgetHeight, true);
                $(inlineEditor.getScrollerElement()).height(widgetHeight);
                inlineEditor.refresh();
            }
        }
        
        // When text is edited, auto-resize UI and sync changes to a backing full-size editor
        $(inlineEditor).on("change", function () {
            // Size editor to current contents
            sizeInlineEditorToContents();
            
            // Wire up to Document and its main full-size editor
            var doc = DocumentManager.getOrCreateDocumentForPath(sourceFile.fullPath);
            
            if (doc.editor) {
                // Full editor already open: sync change now
                doc.editor.syncFrom(inlineEditor);
            } else {
                // Full editor not yet open: load & open it, then sync this change once done
                createFullEditorForDocument(doc)
                    .done(function () {
                        // Begin syncing from inline to full editor
                        doc.editor.syncFrom(inlineEditor);
                    })
                    .fail(function (fileError) {
                        FileUtils.showFileOpenError(fileError.code, doc.file.fullPath).done(function () {
                            closeThisInline();
                        });
                    });
            }
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
        
        return { content: inlineContent, editor: inlineEditor, source: sourceFile, height: 0, onAdded: afterAdded };
    }
    
    
    /**
     * Disposes the given document's editor if the doc is no longer "open" in the UI (visible or in
     * the working set). Otherwise does nothing.
     * @param {!Document} document
     */
    function _destroyEditorIfUnneeded(document) {
        var editor = document.editor;

        if (!editor) {
            return;
        }
        
        // If outgoing editor is no longer needed, dispose it
        if (!DocumentManager.getDocumentForFile(document.file)) {
            
            // Destroy the editor widget: CodeMirror docs for getWrapperElement() say all you have to do
            // is "Remove this from your tree to delete an editor instance."
            $(editor._codeMirror.getWrapperElement()).remove();
            
            // Our callers should really ensure this, but just for safety...
            if (_currentEditor === editor) {
                _currentEditorsDocument = null;
                _currentEditor = null;
            }
        }
    }

    /** Focus the currently visible editor. If no editor visible, does nothing. */
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
        _currentEditor = document.editor;
        
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

        // DocumentManager should have already ensured that we've created an Editor
        if (!document.editor) {
            throw new Error("Trying to show a currentDocument without an Editor!");
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
    function _onWorkingSetRemove(event, removedDoc) {
        // There's one case where an editor should be disposed even though the current document
        // didn't change: removing a document from the working set (via the "X" button). (This may
        // also cover the case where the document WAS current, if the editor-swap happens before the
        // removal from the working set.
        _destroyEditorIfUnneeded(removedDoc);
    }
    // Note: there are several paths that can lead to an editor getting destroyed
    //  - file was in working set, but not open; then closed (via working set "X" button)
    //      --> handled by _onWorkingSetRemove()
    //  - file was open, but not in working set; then navigated away from
    //      --> handled by _onCurrentDocumentChange()
    //  - file was open, but not in working set; then closed (via File > Close) (and thus implicitly
    //    navigated away from)
    //      --> handled by _onCurrentDocumentChange()
    //  - file was open AND in working set; then closed (via File > Close OR working set "X" button)
    //    (and thus implicitly navigated away from)
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
     * @returns {{editor:Editor, source:FileEntry}}
     */
    function getFocusedEditor() {
        if (_currentEditor) {
            var focusedInline;
            
            // See if any inlines have focus
            _currentEditor.getInlineWidgets().forEach(function (widget) {
                if (widget.data.editor.hasFocus()) {
                    focusedInline = { editor: widget.data.editor, source: widget.data.source };
                }
            });
            
            if (focusedInline) {
                return focusedInline;
            }
            
            if (_currentEditor.hasFocus()) {
                return { editor: _currentEditor, source: _currentEditorsDocument.file };
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
    
    // Define public API
    exports.setEditorHolder = setEditorHolder;
    exports.createFullEditorForDocument = createFullEditorForDocument;
    exports.createInlineEditorFromText = createInlineEditorFromText;
    exports.focusEditor = focusEditor;
    exports.getFocusedEditor = getFocusedEditor;
    exports.resizeEditor = resizeEditor;
    exports.registerInlineEditProvider = registerInlineEditProvider;
});
