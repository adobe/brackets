/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * EditorManager owns the UI for the editor area and working set list. This essentially mirrors
 * the model in DocumentManager, which maintains a list of 'open' documents  (the working set) and
 * a 'current document' (what is shown in the editor area).
 */
define(function(require, exports, module) {
    
    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ;
    
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    $(DocumentManager).on("workingSetRemove", _onWorkingSetRemove);
    $(window).resize(_updateEditorSize);
    
    var _editorHolder = null;
    var _currentEditor = null;
    var _currentEditorsDocument = null;
    
    var _resizeTimeout = null;
    var _resizeCount = 0;

    
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
     * @param {jQueryObject} holder
     */
    function setEditorArea(holder) {
        if (_currentEditor)
            throw new Error("Cannot change editor area after an editor has already been created!");
        
        _editorHolder = holder;
    }
    
    
    function createEditor(text) {
        var editor = CodeMirror(_editorHolder.get(0));
        
        // Initially populate with text. This will send a spurious change event, but that's ok
        // because no one's listening yet (and we clear the undo stack below)
        editor.setValue(text);
        
        // Make sure we can't undo back to the empty state before setValue()
        editor.clearHistory();
        
        return editor;
    }
    
    function _destroyEditorIfUnneeded(document) {
        var editor = document._editor;
        
        // If outgoing editor is no longer needed, dispose it
        if (! DocumentManager.getDocument(document.file)) {
            console.log("DESTROYING editor for "+document);
        
            // Destroy the editor widget: CodeMirror docs for getWrapperElement() say all you have to do
            // is "Remove this from your tree to delete an editor instance."
            _editorHolder.get(0).removeChild( editor.getWrapperElement() );
            
            // Our callers should really ensure this, but just for safety...
            if (_currentEditor == editor) {
                _currentEditorsDocument = null;
                _currentEditor = null;
            }
        }
    }
    
    
    function _showEditor(document) {
        // Hide whatever was visible before
        if (_currentEditor == null) {
            $("#notEditor").css("display","none");
        } else {
            $(_currentEditor.getWrapperElement()).css("display","none");
            _destroyEditorIfUnneeded(_currentEditorsDocument);
        }
        
        // Show new editor
        _currentEditorsDocument = document;
        _currentEditor = document._editor;
        $(_currentEditor.getWrapperElement()).css("display", "");
        
        // If window has been resized since last time editor was visible, kick it now
        var editorResizeCount = $(_currentEditor.getWrapperElement()).data("resizeCount");
        if (isNaN(editorResizeCount) || editorResizeCount < _resizeCount) {
            $('.CodeMirror-scroll', _editorHolder).height(_editorHolder.height());
            _currentEditor.refresh();
            $(_currentEditor.getWrapperElement()).data("resizeCount", _resizeCount);
        }
    }
    function _showNoEditor() {
        if (_currentEditor != null) {
            $(_currentEditor.getWrapperElement()).css("display","none");
            _destroyEditorIfUnneeded(_currentEditorsDocument);
            
            _currentEditorsDocument = null;
            _currentEditor = null;
            
            $("#notEditor").css("display","");
        }
    }
    
    
    // NJ's editor-resizing fix
    function _updateEditorSize() {
        // Make sure we know to resize other (hidden) editors when swapping them in
        _resizeCount++;
        
        // Don't refresh every single time.
        if (!_resizeTimeout) {
            _resizeTimeout = setTimeout(function() {
                _currentEditor.refresh();
                $(_currentEditor.getWrapperElement()).data("resizeCount", _resizeCount);
                _resizeTimeout = null;
            }, 100);
        }
        $('.CodeMirror-scroll', _editorHolder)
            .height(_editorHolder.height());
    }
    
    
    function focusEditor() {
        if (_currentEditor != null)
            _currentEditor.focus();
    }
    
    
    // Define public API
    exports.setEditorArea = setEditorArea;
    exports.createEditor = createEditor;
    exports.focusEditor = focusEditor;
    
});
