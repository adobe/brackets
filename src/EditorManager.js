/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    
    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ;
    
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    
    
    var _currentEditor = null;
    var _isCurrentEditorDirty = false;
    var _savedUndoPosition = null;
    var _ignoreEditorChanges = false;
    

    
    function _onCurrentDocumentChange(event) {
        console.log("Current document changed!  --> "+DocumentManager.getCurrentDocument());
    }
    
    // DEBUG
    setTimeout(function() {
        //var toOpen = NativeFileSystem.FileEntry("");
        //DocumentManager.showInEditor();
    }, 10000);
    
    $(DocumentManager).on("workingSetAdd", function(event, addedDoc) {
        console.log("Working set ++ " + addedDoc);
        // console.log("  set: " + DocumentManager.getWorkingSet().join());
    });
    $(DocumentManager).on("workingSetRemove", function(event, removedDoc) {
        console.log("Working set -- " + removedDoc);
        // console.log("  set: " + DocumentManager.getWorkingSet().join());
    });
    
    $(DocumentManager).on("dirtyFlagChange", function(event, changedDoc) {
        console.log("Dirty flag change: " + changedDoc);
    });
    
    
    
    // Temp public API - this will be removed once we're drived by DocumentManager events rather
    // than direct calls from FileCommandHandler
    /**
     * @param {jQueryObject} holder
     */
    function _constructEditor(holder) {
        _currentEditor = CodeMirror(holder.get(0));
        
        _currentEditor.setOption("onChange", function() {
            _updateDirty();
        });
        
        return _currentEditor;
    }
    
    function _updateDirty() {
        // Don't send out spurious dirty-bit notifications while populating editor with the contents
        // of a newly-opened file, or when clearing editor while closing a file.
        if (_ignoreEditorChanges)
            return;
        
        // If we've undone past the undo position at the last save, and there is no redo stack,
        // then we can never get back to a non-dirty state.
        var historySize = _currentEditor.historySize();
        if (historySize.undo < _savedUndoPosition && historySize.redo == 0) {
            _savedUndoPosition = -1;
        }
        var newIsDirty = (_currentEditor.historySize().undo != _savedUndoPosition);
        
        if (_isCurrentEditorDirty != newIsDirty) {
            _isCurrentEditorDirty = newIsDirty;
            DocumentManager.setDocumentIsDirty(_isCurrentEditorDirty);
        }
    }
    
    function markCurrentEditorClean() {
        _savedUndoPosition = _currentEditor.historySize().undo;
        DocumentManager.setDocumentIsDirty(false);
    }
    
    function showOrCreateEditor(fileEntry, text) {
        _ignoreEditorChanges = true;
        _currentEditor.setValue(text);
        _ignoreEditorChanges = false;
        
        // Make sure we can't undo back to the previous content.
        _currentEditor.clearHistory();
        
        // This should start out at 0, but just to be safe...
        _savedUndoPosition = _currentEditor.historySize().undo;
        _isCurrentEditorDirty = false;
    }
    
    function showNoEditor() {
        _ignoreEditorChanges = true;
        _currentEditor.setValue("");
        _ignoreEditorChanges = false;
        
        // Make sure we can't undo back to the previous content.
        _currentEditor.clearHistory();
        _savedUndoPosition = 0;
        _isCurrentEditorDirty = false;
    }
    
    function focusEditor() {
        _currentEditor.focus();
    }
    
    function getEditorContents() {
        return _currentEditor.getValue()
    }
    
    
    // Define public API
    exports.markCurrentEditorClean = markCurrentEditorClean;
    exports.getEditorContents = getEditorContents;
    exports._constructEditor = _constructEditor;    // FIXME: TEMP
    exports.showOrCreateEditor = showOrCreateEditor;
    exports.showNoEditor = showNoEditor;
    exports.focusEditor = focusEditor;
    exports._currentEditor = _currentEditor;    // FIXME: TEMP
    
});