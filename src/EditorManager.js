/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * EditorManager owns the UI for the editor area. This essentially mirrors the 'current document'
 * property maintained by DocumentManager's model.
 *
 * Note that there is a little bit of unusual overlap between EditorManager and DocumentManager:
 * because the Document state is actually stored in the CodeMirror editor UI, DocumentManager is
 * not a pure headless model. Each Document encapsulates an editor instance, and thus EditorManager
 * must have some knowledge about Document's internal state (we access its _editor property).
 */
define(function(require, exports, module) {
    
    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    ,   EditorUtils         = require("EditorUtils")
    ;
    
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    $(DocumentManager).on("workingSetRemove", _onWorkingSetRemove);
    $(window).resize(_updateEditorSize);
    
    
    /** @type {jQueryObject} DOM node that contains all editors (visible and hidden alike) */
    var _editorHolder = null;
    
    /** @type {CodeMirror} */
    var _currentEditor = null;
    /** @type {Document} */
    var _currentEditorsDocument = null;
    
    /** @type {number} Used by {@link _updateEditorSize()} */
    var _resizeTimeout = null;

    
    /** Handles changes to DocumentManager.getCurrentDocument() */
    function _onCurrentDocumentChange(event) {
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
        if (_currentEditor)
            throw new Error("Cannot change editor area after an editor has already been created!");
        
        _editorHolder = holder;
    }
    
    
    /**
     * Creates a new CodeMirror editor instance containing text from the 
     * specified fileEntry and wraps it in a new Document tied to the given 
     * file. The editor is not yet visible; to display it in the main
     * editor UI area, ask DocumentManager to make this the current document.
     * @param {!FileEntry} file  The file being edited. Need not lie within the project.
     * @return {Deferred} a jQuery Deferred that will be resolved with a new 
     *  document for the fileEntry, or rejected if the file can not be read.
     */
    function createDocumentAndEditor(fileEntry) {
        var result          = new $.Deferred()
        ,   editorResult    = _createEditor(fileEntry);

        editorResult.done(function(editor) {
            // Create the Document wrapping editor & binding it to a file
            var doc = new DocumentManager.Document(fileEntry, editor);
            result.resolve(doc);
        });

        editorResult.fail(function(error) {
            result.reject(error);
        });

        return result;
    }

    /**
     * Creates a new CodeMirror editor instance containing text from the 
     * specified fileEntry and wraps it in a new Document tied to the given 
     * file. The editor is not yet visible; to display it in the main
     * editor UI area, ask DocumentManager to make this the current document.
     * @param {!FileEntry} file  The file being edited. Need not lie within the project.
     * @return {Deferred} a jQuery Deferred that will be resolved with a new 
     *  editor for the fileEntry, or rejected if the file can not be read.
     */
    function _createEditor(fileEntry) {
        var result = new $.Deferred()
        ,   reader = DocumentManager.readAsText(fileEntry);

        reader.done(function(text) {
            var editor = CodeMirror(_editorHolder.get(0), {
                indentUnit : 4,
                extraKeys: {
                    "Tab" : function(instance) {
                         if (instance.somethingSelected())
                            CodeMirror.commands.indentMore(instance);
                         else
                            CodeMirror.commands.insertTab(instance);
                    }
                }
            });
            
            // Set code-coloring mode
            EditorUtils.setModeFromFileExtension(editor, fileEntry.fullPath);
            
            // Initially populate with text. This will send a spurious change event, but that's ok
            // because no one's listening yet (and we clear the undo stack below)
            editor.setValue(text);
            
            // Make sure we can't undo back to the empty state before setValue()
            editor.clearHistory();

            result.resolve(editor);
        });
        reader.fail(function(error) {
            result.reject(error);
        });

        return result;
    }
    
    /**
     * Disposes the given document's editor if the doc is no longer "open" in the UI (visible or in
     * the working set). Otherwise does nothing.
     * @param {!Document} document
     */
    function _destroyEditorIfUnneeded(document) {
        var editor = document._editor;

        if (editor === null) {
            return;
        }
        
        // If outgoing editor is no longer needed, dispose it
        if (! DocumentManager.getDocumentForFile(document.file)) {
            
            // Destroy the editor widget: CodeMirror docs for getWrapperElement() say all you have to do
            // is "Remove this from your tree to delete an editor instance."
            $(editor.getWrapperElement()).remove();
            
            // Our callers should really ensure this, but just for safety...
            if (_currentEditor == editor) {
                _currentEditorsDocument = null;
                _currentEditor = null;
            }
        }
    }
    
    
    /**
     * Make the given document's editor visible in the UI, hiding whatever was
     * visible before. Creates a new editor if none is assigned.
     * @param {!Document} document
     */
    function _showEditor(document) {
        // Hide whatever was visible before
        if (_currentEditor == null) {
            $("#notEditor").css("display","none");
        } else {
            $(_currentEditor.getWrapperElement()).css("display","none");
            _destroyEditorIfUnneeded(_currentEditorsDocument);
        }

        // Lazily create editor for Documents that were restored on-init
        if (document._editor === null) {
            var editorResult = _createEditor(document.file);

            editorResult.done(function(editor) {
                document._editor = editor;
                _doShow(document);
            });
            editorResult.fail(function(error) {
                // TODO (jasonsj): error dialog
            });
        }
        else {
            _doShow(document);
        }
    }

    /**
     * @private
     */
    function _doShow(document) {
        // Show new editor
        _currentEditorsDocument = document;
        _currentEditor = document._editor;

        $(_currentEditor.getWrapperElement()).css("display", "");
        
        // Window may have been resized since last time editor was visible, so kick it now
        // (see _updateEditorSize() handler below)
        $('.CodeMirror-scroll', _editorHolder).height(_editorHolder.height());
        _currentEditor.refresh();
    }

    /** Hide the currently visible editor and show a placeholder UI in its place */
    function _showNoEditor() {
        if (_currentEditor != null) {
            $(_currentEditor.getWrapperElement()).css("display","none");
            _destroyEditorIfUnneeded(_currentEditorsDocument);
            
            _currentEditorsDocument = null;
            _currentEditor = null;
            
            $("#notEditor").css("display","");
        }
    }
    
    
    /**
     * NJ's editor-resizing fix. Whenever the window resizes, we immediately adjust the editor's
     * height; somewhat less than once per resize event, we also kick it to do a full re-layout.
     */
    function _updateEditorSize() {
        // Don't refresh every single time
        if (!_resizeTimeout) {
            _resizeTimeout = setTimeout(function() {
                _currentEditor.refresh();
                _resizeTimeout = null;
            }, 100);
        }
        $('.CodeMirror-scroll', _editorHolder).height(_editorHolder.height());
        
        // (see also force-resize code in _showEditor() )
    }
    
    
    /** Focus the currently visible editor. If no editor visible, does nothing. */
    function focusEditor() {
        if (_currentEditor != null)
            _currentEditor.focus();
    }
    
    
    // Define public API
    exports.setEditorHolder = setEditorHolder;
    exports.createDocumentAndEditor = createDocumentAndEditor;
    exports.focusEditor = focusEditor;
    
});
