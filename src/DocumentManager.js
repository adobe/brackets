/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * DocumentManager is the model for the set of currently 'open' files and their contents. It controls
 * which file is currently shown in the editor, the dirty bit for all files, and the list of documents
 * in the working set. It also encapsulates the editor widget for each file, which in turn controls
 * each file's contents and undo history. (This it is not a perfectly clean, headless model, but that's
 * unavoidable because the document state is tied up in the CodeMirror UI).
 */
define(function(require, exports, module) {

    var ProjectManager     = require("ProjectManager")
    ,   EditorManager      = require("EditorManager")
    ;

    /**
     * @constructor
     * A single editable document, e.g. an entry in the working set list.
     * Documents are unique per file, so it is safe to compare them with '=='.
     * @param {!FileEntry} file  The file being edited. Need not lie within the project.
     * @param {!CodeMirror} editor  The editor that will maintain the document state (current text
     *          and undo stack). It is assumed that the editor text has already been initialized
     *          with the file's contents.
     */
    function Document(file, editor) {
        if (!(this instanceof Document)) { // ERROR: constructor called without 'new'
            throw new Error("Document constructor must be called with 'new'");
        }
        if (getDocument(file) != null) {
            throw new Error("Creating a document + editor when one already exists, for: " + file);
        }
        
        this.file = file;
        this._editor = editor;
        
        // Dirty-bit tracking
        editor.setOption("onChange", $.proxy(this._updateDirty, this));
        this._savedUndoPosition = editor.historySize().undo;   // should always be 0, but just to be safe...
    }
    
    /**
     * @return {string}
     */
    Document.prototype.getText = function() {
        return this._editor.getValue();
    }
    
    /**
     * The FileEntry for the document being edited.
     * @type {!FileEntry}
     */
    Document.prototype.file = null;
    
    /**
     * Whether this document has unsaved changes or not.
     *
     * To listen for changes to this flag, in *ANY* document: $(DocumentManager).on("dirtyFlagChange", handler);
     * The 2nd arg to the listener is the Document whose isDirty flag changed.
     *
     * @type {boolean}
     */
    Document.prototype.isDirty = false;
    
    /**
     * @private
     * @type {!CodeMirror}
     */
    Document.prototype._editor = null;
    
    /**
     * @private
     * @type {number}
     */
    Document.prototype._savedUndoPosition = 0;
    
    /**
     * @private
     */
    Document.prototype._updateDirty = function() {
        // If we've undone past the undo position at the last save, and there is no redo stack,
        // then we can never get back to a non-dirty state.
        var historySize = this._editor.historySize();
        if (historySize.undo < this._savedUndoPosition && historySize.redo == 0) {
            this._savedUndoPosition = -1;
        }
        var newIsDirty = (this._editor.historySize().undo != this._savedUndoPosition);
        
        if (this.isDirty != newIsDirty) {
            this.isDirty = newIsDirty;
            _documentDirtyChanged(this);
        }
    }
    
    Document.prototype.markClean = function() {
        this._savedUndoPosition = this._editor.historySize().undo;
        this._updateDirty();
    }
    
    /* (to help debugging) */
    Document.prototype.toString = function() {
        return "[Document " + this.file.fullPath + " " + (this.isDirty ? "(dirty!)" : "(clean)") + "]";
    }
    
    
    
    /**
     * @private
     * @see DocumentManager.getCurrentDocument()
     */
    var _currentDocument = null;
    
    /**
     * Returns the Document that is currently open in the editor UI. May be null.
     * To listen for changes: $(DocumentManager).on("currentDocumentChange", handler);
     * @return {?Document}
     */
    function getCurrentDocument() {
        return _currentDocument;
    }
    // FIXME: tree & working set selection must also listen to this!!
    
    /**
     * If the given file is 'open' for editing, returns its Document. Else returns null. "Open for
     * editing" means either the file is in the working set, and/or the file is currently open in
     * the editor UI.
     * @param {!FileEntry} fileEntry
     * @return {?Document}
     */
    function getDocument(fileEntry) {
        if (_currentDocument && _currentDocument.file.fullPath == fileEntry.fullPath)
            return _currentDocument;
        
        var wsIndex = _findInWorkingSet(fileEntry);
        if (wsIndex != -1)
            return _workingSet[wsIndex];
        
        return null;
    }
    
    
    /**
     * @private
     * @see DocumentManager.getWorkingSet()
     */
    var _workingSet = [];
    
    /**
     * Returns an ordered list of items in the working set. May be 0-length, but never null.
     *
     * To listen for additions to this list: $(DocumentManager).on("workingSetAdd", handler);
     * To listen for removals from this list: $(DocumentManager).on("workingSetRemove", handler);
     * In both cases, the 2nd arg to the listener is the Document that was added/removed.
     *
     * Which items belong in the working set is managed entirely by DocumentManager. Callers cannot
     * (yet) change this collection on their own.
     *
     * @return {Array.<Document>}
     */
    function getWorkingSet() {
        return _workingSet;
        // TODO: return a clone to prevent meddling?
    }
    
    function addToWorkingSet(document) {
        // If doc is already in working set, do nothing
        if (_findInWorkingSet(document.file) != -1)
            return;
        
        // Add
        _workingSet.push(document);
        
        // Dispatch event
        $(exports).triggerHandler("workingSetAdd", document);
    }
    
    function _removeFromWorkingSet(document) {
        // If doc isn't in working set, do nothing
        var index = _findInWorkingSet(document.file);
        if (index == -1)
            return;
        
        // Remove
        _workingSet.splice(index, 1);
        
        // Dispatch event
        $(exports).triggerHandler("workingSetRemove", document);
    }
    
    function _findInWorkingSet(fileEntry) {
        for (var i = 0; i < _workingSet.length; i++) {
            if (_workingSet[i].file.fullPath == fileEntry.fullPath)
                return i;
        }
        return -1;
    }
    
    
    /**
     * Displays the given file in the editor pane. May also add the item to the working set model.
     * This changes the value of getCurrentDocument(), which will trigger listeners elsewhere in the
     * UI that in turn do things like update the selection in the file tree / working set UI.
     * 
     * @param {!Document} document  The document whose editor should be shown. May or may not
     *      already be in the working set.
     */
    function showInEditor(document) {
        // If this file is already in editor, do nothing
        if (_currentDocument && _currentDocument == document)
            return;
        
        // If file not within project tree, add it to working set right now (don't wait for it to
        // become dirty)

        if (! ProjectManager.isWithinProject(document.file.fullPath)) {
           addToWorkingSet(document);
        }
        
        // Make it the current document
        _currentDocument = document;
        $(exports).triggerHandler("currentDocumentChange");
        // (this event triggers EditorManager to actually switch editors in the UI)
    }
    
    
    /**
     * 
     */
    function _clearEditor() {
        // If editor already blank, do nothing
        if (_currentDocument == null)
            return;
        
        // Change model & dispatch event
        _currentDocument = null;
        $(exports).triggerHandler("currentDocumentChange");
        // (this event triggers EditorManager to actually clear the editor UI)
    }
    
    
    /**
     * Closes the given document (which may or may not be the current document in the editor UI, and
     * may or may not be in the working set). Discards any unsaved changes if isDirty - it is
     * expected that the UI has already confirmed with the user before calling us.
     * This will remove the doc from the working set if it was in the set, and will select a
     * different file for editing if this document was the current one (if possible; if the working
     * set is empty after closing this file, then the editor area will go blank instead).
     */
    function closeDocument(document) {
        // If this was the current document shown in the editor UI, switch to a different
        // document (or none if working set has no other options)
        if (_currentDocument && _currentDocument == document) {
            var wsIndex = _findInWorkingSet(document.file);
            
            // Decide which doc to show in editor after this one
            var nextDocument;
            if (wsIndex == -1) {
                // If doc wasn't in working set, use bottommost working set item
                if (_workingSet.length > 0) {
                    nextDocument = _workingSet[ _workingSet.length  - 1 ];
                }
                // else: leave nextDocument null; editor will be blank
            } else {
                // If doc was in working set, use item next to it (below if possible)
                if (wsIndex < _workingSet.length - 1) {
                    nextDocument = _workingSet[wsIndex + 1];
                } else if (wsIndex > 0) {
                    nextDocument = _workingSet[wsIndex - 1];
                }
                // else: leave nextDocument null; editor will be blank
            }
        
            // Switch editor to next document (or blank it out)
            if (nextDocument)
                showInEditor(nextDocument);
            else
                _clearEditor();
        }
        // (Now we're guaranteed that the current document is not the one we're closing)
        
        // Remove closed doc from working set, if it was in there
        _removeFromWorkingSet(document);
        
        // Clean up the UI
        // TODO: it'd be cleaner to decouple this so we just dispatch a 'documentDisposed' event
        // that EditorManager listens for...
        EditorManager.destroyEditor(document._editor);
    }
	
	function closeDocument(fileEntry){
		// TODO TY: does this work?
		if( _currentDocument.file == fileEntry){
			closeCurrentDocument();
		}
		else {
			var wsIndex = _findInWorkingSet(_currentDocument.file);
			 _removeFromWorkingSet(_currentDocument);
		}
		
	}
    
    function _documentDirtyChanged(doc) {
        // Dispatch event
        $(exports).triggerHandler("dirtyFlagChange", doc);
        
        // If file just became dirty, add it to working set (if not already there)
        addToWorkingSet(doc);
    }
    
    
    
    // Define public API
    exports.Document = Document;
    exports.getCurrentDocument = getCurrentDocument;
    exports.getDocument = getDocument;
    exports.getWorkingSet = getWorkingSet;
    exports.showInEditor = showInEditor;
	exports.addToWorkingSet = addToWorkingSet;
    exports.closeDocument = closeDocument;
    
});
