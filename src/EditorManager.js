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
    
    
    var _editorHolder = null;
    var _editors = [];
    var _currentEditor = null;
    var _ignoreEditorChanges = false;
    

    
    function _onCurrentDocumentChange(event) {
        console.log("Current document changed!  --> "+DocumentManager.getCurrentDocument());
    }
    
    $(DocumentManager).on("workingSetAdd", function(event, addedDoc) {
        console.log("Working set ++ " + addedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
		
		// Add new item to bottom of list
		var newItem = $("<li id='" + addedDoc.file.fullPath + "' class='working-set-list-item'><a href='#'>" + addedDoc.file.name +  "</a></li>");
		$("#open-files-container").children("ul").append(newItem);
		
		// Show close icon on hover
		newItem.hover(
                function() {
					var closeItemClass = "close-file-icon";
					if( addedDoc.isDirty )
						  closeItemClass += " dirty";
						  
					var closeItem = $("<div class= '" + closeItemClass + "'></div>");
                    $(this).prepend(closeItem);
					
					// Handle clicking on close icon
		            $(".close-file-icon").click( function() {
		                // close file
						console.log("closed clicked");
						
		            });
					
                },
                function() {
                    $(this).children(".close-file-icon").remove();
                }
            );
    });
    $(DocumentManager).on("workingSetRemove", function(event, removedDoc) {
        console.log("Working set -- " + removedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
		
		// FIXME doesn't work
		$("#" + removedDoc.file.fullPath).remove();
    });
    
    $(DocumentManager).on("dirtyFlagChange", function(event, doc ) {
        console.log("Dirty flag change: " + doc);
		
		$("#" + doc.file.fullPath).find(".close-file-icon");
    });
    
    
    
    // Temp public API - this will be removed once we're drived by DocumentManager events rather
    // than direct calls from FileCommandHandler
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
    
    function Editor(fileEntry) {
        this.file = fileEntry;
        this.editor = CodeMirror(_editorHolder.get(0));
        
        this.editor.setOption("onChange", $.proxy(this._updateDirty, this));
    }
    /** @type {CodeMirror} */
    Editor.prototype.editor = null;
    /** @type {FileEntry} */
    Editor.prototype.file = null;
    /** @type {number} */
    Editor.prototype._savedUndoPosition = 0;
    /** @type {boolean} */
    Editor.prototype._isDirty = false;  // FIXME: store only on the document?  we're maintaining this in two places right now!
    
    Editor.prototype._updateDirty = function() {
        // Don't send out spurious dirty-bit notifications while populating editor with the contents
        // of a newly-opened file, or when clearing editor while closing a file.
        if (_ignoreEditorChanges)
            return;
        
        // If we've undone past the undo position at the last save, and there is no redo stack,
        // then we can never get back to a non-dirty state.
        var historySize = this.editor.historySize();
        if (historySize.undo < this._savedUndoPosition && historySize.redo == 0) {
            this._savedUndoPosition = -1;
        }
        var newIsDirty = (this.editor.historySize().undo != this._savedUndoPosition);
        
        if (this._isDirty != newIsDirty) {
            this._isDirty = newIsDirty;
            DocumentManager.setDocumentIsDirty(this.file, this._isDirty);
        }
    }
    
    Editor.prototype.markClean = function() {
        this._savedUndoPosition = this.editor.historySize().undo;
        DocumentManager.setDocumentIsDirty(this.file, false);
    }
    
    Editor.prototype.initContent = function(text) {
            _ignoreEditorChanges = true;
            this.editor.setValue(text);
            _ignoreEditorChanges = false;
            
            // Make sure we can't undo back to the previous content.
            this.editor.clearHistory();
            
            // This should start out at 0, but just to be safe...
            this._savedUndoPosition = this.editor.historySize().undo;
            this._isDirty = false;
    }
    
    
    function showEditor(fileEntry) {
        var editorI = _findEditor(fileEntry);
        if (editorI == -1)
            throw new Error("No editor exists for "+fileEntry+". Use createEditor().");
        
        _showEditor( _editors[editorI] );
        DocumentManager.showInEditor(fileEntry);
    }
    function createEditor(fileEntry, text) {
        var editorI = _findEditor(fileEntry);
        if (editorI != -1)
            throw new Error("Editor already exists for "+fileEntry+". Use showEditor().");
            
        var newEditor = new Editor(fileEntry);
        newEditor.initContent(text);
        _editors.push(newEditor);
        
        _showEditor( newEditor );
        DocumentManager.showInEditor(fileEntry);
        
        if (DocumentManager.getCurrentDocument().isDirty) {
            console.log("#### This IS a case where we need to setDocumentIsDirty(false)");
        }
        // DocumentManager.setDocumentIsDirty(fileEntry, false);
    }
    function _showEditor(editor) {
        // Hide whatever was visible before
        if (_currentEditor == null) {
            $("#notEditor").css("display","none");
        } else {
            $(_currentEditor.editor.getWrapperElement()).css("display","none");
        }
        
        // Show new editor
        _currentEditor = editor;
        $(_currentEditor.editor.getWrapperElement()).css("display", "");
    }
    
    function showNoEditor() {
        if (_currentEditor != null) {
            $(_currentEditor.editor.getWrapperElement()).css("display","none");
            _currentEditor = null;
            $("#notEditor").css("display","");
        }
    }
    
    function destroyEditor(fileEntry) {
        var editorI = _findEditor(fileEntry);
        if (editorI == -1)
            throw new Error("No editor exists for "+fileEntry);
        
        if (_currentEditor == _editors[editorI])
            showNoEditor();
        
        // Destroy the editor itself: CodeMirror docs for getWrapperElement() say all you have to do
        // is "Remove this from your tree to delete an editor instance."
        _editorHolder.get(0).removeChild(_editors[editorI].editor.getWrapperElement());
        
        _editors.splice(editorI, 1);
    }
    
    function _findEditor(fileEntry) {
        for (var i=0; i < _editors.length; i++) {
            if (_editors[i].file.fullPath == fileEntry.fullPath)
                return i;
        }
        return -1;
    }
    
    
    function focusEditor() {
        if (_currentEditor != null)
            _currentEditor.editor.focus();
    }
    
    function hasEditorFor(fileEntry) {
        return _findEditor(fileEntry) != -1;
    }
    
    function getEditorContents(fileEntry) {
        var editorI = _findEditor(fileEntry);
        if (editorI == -1)
            throw new Error("No editor exists for "+fileEntry);
        
        return _editors[editorI].editor.getValue()
    }
    
    function isEditorDirty(fileEntry) {
        var editorI = _findEditor(fileEntry);
        if (editorI == -1)
            throw new Error("No editor exists for "+fileEntry);
        
        return _editors[editorI]._isDirty;
    }
    function markEditorClean(fileEntry) {
        var editorI = _findEditor(fileEntry);
        if (editorI == -1)
            throw new Error("No editor exists for "+fileEntry);
        
        _editors[editorI].markClean();
    }
    
    
    // Define public API
    exports.setEditorArea = setEditorArea;
    exports.hasEditorFor = hasEditorFor;
    exports.getEditorContents = getEditorContents;
    exports.showEditor = showEditor;
    exports.createEditor = createEditor;
    exports.showNoEditor = showNoEditor;
    exports.destroyEditor = destroyEditor;
    exports.isEditorDirty = isEditorDirty;
    exports.markEditorClean = markEditorClean;
    exports.focusEditor = focusEditor;
    
});
