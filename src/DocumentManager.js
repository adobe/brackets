/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * DocumentManager controls which file is currently shown in the editor, the dirty bit for all
 * files, and the list of documents in the working set.
 */
define(function(require, exports, module) {

    var ProjectManager     = require("ProjectManager")
    ;

    /**
     * @constructor
     * A single editable document, e.g. an entry in the working set list.
     * @param {!FileEntry} file  The file being edited.
     */
    function Document(file) {
        if (!(this instanceof Document)) { // ERROR: constructor called without 'new'
            throw new Error("Document constructor must be called with 'new'");
        }
        
        this.file = file;
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
    
    function _addToWorkingSet(document) {
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
     * @param {FileEntry} fileEntry  The file to open. Need not lie within the project. May or may
     *      not already be in the working set.
     */
    function showInEditor(fileEntry) {
        // If this file is already in editor, do nothing
        if (_currentDocument && _currentDocument.file.fullPath == fileEntry.fullPath)
            return;
        
        var newDocument = new Document(fileEntry);
        
        // If file not within project tree, add it to working set right now (don't wait for it to
        // become dirty)
        if (! ProjectManager.isWithinProject(fileEntry.fullPath)) {
           _addToWorkingSet(newDocument);
        }
        
        // Make it the current document
        _currentDocument = newDocument;
        $(exports).triggerHandler("currentDocumentChange");
        // this event triggers EditorManager to actually show the document in the UI
        // FIXME: but that won't happen until someone has loaded its content, so there is an async
        // delay where _currentDocument reflects the new doc while the editor shows the old one
        // (and scarily, where user input is possible)... problem?
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
        // this event triggers EditorManager to actually clear the editor UI
    }
    
    
    /**
     * Closes the file currently shown in the editor pane. This removes it from the working set (if
     * it was in the set), and selects a different file for editing (if possible; if the working set
     * is empty after closing this file, then the editor will be blank instead).
     */
    function closeCurrentDocument() {
        var wsIndex = _findInWorkingSet(_currentDocument.file);
        
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
        
        // Remove closed doc from working set, if it was in there
        _removeFromWorkingSet(_currentDocument);
        
        // Switch editor to next document (or blank it out)
        if (nextDocument)
            showInEditor(nextDocument.file);
        else
            _clearEditor();
    }
    
    
    function setDocumentIsDirty(fileEntry, isDirty) {
        var doc;
        if (_currentDocument && _currentDocument.file.fullPath == fileEntry.fullPath) {
            doc = _currentDocument;
        } else {
            var wsIndex = _findInWorkingSet(fileEntry);
            if (wsIndex != -1)
                doc = _workingSet[wsIndex];
        }
        
        if (!doc)
            throw new Error("Cannot set dirty bit for document that is not open: " + fileEntry);
        
        // Change dirty bit & dispatch event
        doc.isDirty = isDirty;
        $(exports).triggerHandler("dirtyFlagChange", doc);
        
        // If file just became dirty, add it to working set (if not already there)
        _addToWorkingSet(doc);
    }
    
    
    
    // Define public API
    exports.Document = Document;
    exports.getCurrentDocument = getCurrentDocument;
    exports.getWorkingSet = getWorkingSet;
    exports.showInEditor = showInEditor;
    exports.closeCurrentDocument = closeCurrentDocument;
    exports.setDocumentIsDirty = setDocumentIsDirty;
    
});