/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

/**
 * DocumentManager is the model for the set of currently 'open' files and their contents. It controls
 * which file is currently shown in the editor, the dirty bit for all files, and the list of documents
 * in the working set.
 * 
 * Each Document also encapsulates the editor widget for that file, which in turn controls each file's
 * contents and undo history. (So this is not a perfectly clean, headless model, but that's unavoidable
 * because the document state is tied up in the CodeMirror UI). We share ownership of the editor objects
 * with EditorManager, which creates, shows/hides, resizes, and disposes the editors.
 *
 * This module dispatches several events:
 *    - dirtyFlagChange -- When any Document's isDirty flag changes. The 2nd arg to the listener is the
 *      Document whose flag changed.
 *    - documentSaved -- When a Document's changes have been saved. The 2nd arg to the listener is the 
 *      Document that has been saved.
 *    - currentDocumentChange -- When the value of getCurrentDocument() changes.
 *    - workingSetAdd -- When a Document is added to the working set (see getWorkingSet()). The 2nd arg
 *      to the listener is the added Document.
 *    - workingSetRemove -- When a Document is removed from the working set (see getWorkingSet()). The
 *      2nd arg to the listener is the removed Document.
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(DocumentManager).on("eventname", handler);
 */
define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        ProjectManager      = require("ProjectManager"),
        EditorManager       = require("EditorManager"),
        PreferencesManager  = require("PreferencesManager"),
        FileUtils           = require("FileUtils"),
        CommandManager      = require("CommandManager"),
        Async               = require("Async"),
        Editor              = require("Editor").Editor,
        Commands            = require("Commands");

    /**
     * Unique PreferencesManager clientID
     */
    var PREFERENCES_CLIENT_ID = "com.adobe.brackets.DocumentManager";
    
    /**
     * @private
     * @see DocumentManager.getCurrentDocument()
     */
    var _currentDocument = null;
    
    /**
     * Returns the Document that is currently open in the editor UI. May be null.
     * When this changes, DocumentManager dispatches a "currentDocumentChange" event. The current
     * document always has a full-size editor associated with it (i.e. Document.editor != null).
     * @return {?Document}
     */
    function getCurrentDocument() {
        return _currentDocument;
    }
    
    /**
     * @private
     * @see DocumentManager.getWorkingSet()
     */
    var _workingSet = [];
    
    /**
     * Returns an ordered list of items in the working set. May be 0-length, but never null.
     *
     * When a Document is added this list, DocumentManager dispatches a "workingSetAdd" event.
     * When a Document is removed from list, DocumentManager dispatches a "workingSetRemove" event.
     * To listen for ALL changes to this list, you must listen for both events.
     *
     * Which items belong in the working set is managed entirely by DocumentManager. Callers cannot
     * (yet) change this collection on their own.
     *
     * @return {Array.<Document>}
     */
    function getWorkingSet() {
        return _workingSet;
        // TODO: (issue #297) return a clone to prevent meddling?
    }

    /** 
      * Returns the index of the file matching fullPath in the working set. 
      * Returns -1 if not found.
      * @param {!string} fullPath
      * @returns {number} index
     */
    function findInWorkingSet(fullPath) {
        var ret = -1;
        var found = _workingSet.some(function findByPath(ele, i, arr) {
                ret = i;
                return ele.file.fullPath === fullPath;
            });
            
        return (found ? ret : -1);
    }

    /**
     * Returns all documents that are open in editors: the union of the working set and the current
     * document (which may not be in the working set if it is unmodified). Files viewed in inline
     * editors are only included in this list if they've been modified.
     * @return {Array.<Document>}
     */
    function getAllOpenDocuments() {
        var allDocs = _workingSet.slice(0);  //slice() to clone
        
        if (_currentDocument && allDocs.indexOf(_currentDocument) === -1) {
            allDocs.push(_currentDocument);
        }
        
        return allDocs;
    }
    
    /**
     * Adds the given document to the end of the working set list, if it is not already in the list.
     * Does not change which document is currently open in the editor.
     * @param {!Document} document
     */
    function addToWorkingSet(document) {
        // If doc is already in working set, don't add it again
        if (findInWorkingSet(document.file.fullPath) !== -1) {
            return;
        }
        
        // Add
        _workingSet.push(document);
        
        // Dispatch event
        $(exports).triggerHandler("workingSetAdd", document);
    }
    
    /**
     * Removes the given document from the working set list, if it was in the list. Does not change
     * the editor even if this document is the one currently open;.
     * @param {!Document} document
     */
    function _removeFromWorkingSet(document) {
        // If doc isn't in working set, do nothing
        var index = findInWorkingSet(document.file.fullPath);
        if (index === -1) {
            return;
        }
        
        // Remove
        _workingSet.splice(index, 1);
        
        // Dispatch event
        $(exports).triggerHandler("workingSetRemove", document);
    }

    /**
     * If the given file is 'open' for editing, returns its Document. Else returns null. "Open for
     * editing" means either the file is in the working set, and/or the file is currently open in
     * the editor UI.
     * @param {!FileEntry} fileEntry
     * @return {?Document}
     */
    function getDocumentForFile(fileEntry) {
        if (_currentDocument && _currentDocument.file.fullPath === fileEntry.fullPath) {
            return _currentDocument;
        }

        var wsIndex = findInWorkingSet(fileEntry.fullPath);
        if (wsIndex !== -1) {
            return _workingSet[wsIndex];
        }
        
        return null;
    }

    /** If the given file is 'open' for editing, returns its Document. Else returns null. "Open for
     * editing" means either the file is in the working set, and/or the file is currently open in
     * the editor UI.
     * @param {!string} fullPath
     * @return {?Document}
    */
    function getDocumentForPath(fullPath) {
        var fileEntry = new NativeFileSystem.FileEntry(fullPath);
        return getDocumentForFile(fileEntry);
    }
    
    /** 
     * If the given file is 'open' for editing, return the contents of the editor (which could
     * be different from the contents of the file, if the editor contains unsaved changes). If
     * the given file is not open for editing, read the contents off disk.
     * @param {!string} fullPath
     * @return {Deferred} A Deferred object that will be resolved with the contents of the document,
     *      or rejected with a FileError if the file is not yet open and can't be read from disk.
     */
    function getDocumentContents(fullPath) {
        var doc = getDocumentForPath(fullPath);
        
        if (doc && doc.editor) {
            var result = new $.Deferred();
            
            result.resolve(doc.getText());
            return result;
        } else {
            var fileEntry = new NativeFileSystem.FileEntry(fullPath);
            
            return FileUtils.readAsText(fileEntry);
        }
    }
    
    
    /**
     * Displays the given file in the editor pane; this may occur asynchronously if the file has
     * not been opened before. After the file is loaded and an editor is created, the value of
     * getCurrentDocument() changes, firing currentDocumentChange and triggering listeners elsewhere
     * to update the selection in the file tree / working set UI, etc.
     * This call may also add the item to the working set list.
     * 
     * @param {!Document} document  The document whose editor should be shown. May or may not
     *      already be in the working set.
     * @return {$.Deferred}  A Deferred that is resolved once the Document is loaded and displayed
     *      in the UI, or rejected - after showing error UI - if the file could not be loaded.
     */
    function showInEditor(document) {
        
        // If this file is already in editor, do nothing
        if (_currentDocument === document) {
            return (new $.Deferred()).resolve();
        }
        
        // If file not within project tree, add it to working set right now (don't wait for it to
        // become dirty)
        if (!ProjectManager.isWithinProject(document.file.fullPath)) {
            addToWorkingSet(document);
        }
        
        // Ensure an editor exists for this document
        var result = new $.Deferred();
        if (document.editor) {
            result.resolve();
        } else {
            // Editor doesn't exist; load the file (async) and populate a new Editor with it
            EditorManager.createFullEditorForDocument(document)
                .done(function () {
                    result.resolve();
                })
                .fail(function (fileError) {
                    FileUtils.showFileOpenError(fileError.code, document.file.fullPath).done(function () {
                        _removeFromWorkingSet(document);
                        EditorManager.focusEditor();
                        result.reject(fileError);
                    });
                });
        }
        
        // Make it the current document
        result.done(function () {
            _currentDocument = document;
            $(exports).triggerHandler("currentDocumentChange");
            // (this event triggers EditorManager to actually switch editors in the UI)
        });
        
        return result;
    }
    
    /** Closes the currently visible document, if any */
    function _clearEditor() {
        // If editor already blank, do nothing
        if (!_currentDocument) {
            return;
        }
        
        // Change model & dispatch event
        _currentDocument = null;
        $(exports).triggerHandler("currentDocumentChange");
        // (this event triggers EditorManager to actually clear the editor UI)
    }
    
    /**
     * Closes the given document (which may or may not be the current document in the editor UI, and
     * may or may not be in the working set). Discards any unsaved changes if isDirty - it is
     * expected that the UI has already confirmed with the user before calling us.
     *
     * This will select a different file for editing if the document was the current one (if possible;
     * in some cases, the editor may be left blank instead). This will also remove the doc from the
     * working set if it was in the set.
     *
     * @param {!Document} document
     */
    function closeDocument(document) {
        // If this was the current document shown in the editor UI, we're going to switch to a
        // different document (or none if working set has no other options)
        if (_currentDocument === document) {
            var wsIndex = findInWorkingSet(document.file.fullPath);
            
            // Decide which doc to show in editor after this one
            var nextDocument;
            if (wsIndex === -1) {
                // If doc wasn't in working set, use bottommost working set item
                if (_workingSet.length > 0) {
                    nextDocument = _workingSet[_workingSet.length  - 1];
                }
                // else: leave nextDocument null; editor area will be blank
            } else {
                // If doc was in working set, use item next to it (below if possible)
                if (wsIndex < _workingSet.length - 1) {
                    nextDocument = _workingSet[wsIndex + 1];
                } else if (wsIndex > 0) {
                    nextDocument = _workingSet[wsIndex - 1];
                }
                // else: leave nextDocument null; editor area will be blank
            }
            
            // Switch editor to next document (or blank it out)
            if (nextDocument) {
                showInEditor(nextDocument);
            } else {
                _clearEditor();
            }
        }
        
        // (Now we're guaranteed that the current document is not the one we're closing)
        console.assert(_currentDocument !== document);
        
        // Remove closed doc from working set, if it was in there
        // This happens regardless of whether the document being closed was the current one or not
        _removeFromWorkingSet(document);
        
        // Note: EditorManager will dispose the closed document's now-unneeded editor either in
        // response to the editor-swap call above, or the _removeFromWorkingSet() call, depending on
        // circumstances. See notes in EditorManager for more.
    }

    /**
     * Equivalent to calling closeDocument() for all Documents. Same caveat: this discards any
     * unsaved changes, so the UI should confirm with the user before calling this.
     */
    function closeAll() {
        var allDocs = getAllOpenDocuments();
        
        allDocs.forEach(closeDocument);
    }
    
    
    /**
     * @constructor
     * A single editable document, e.g. an entry in the working set list. Documents are unique per
     * file, so it IS safe to compare them with '==' or '==='.
     * @param {!FileEntry} file  The file being edited. Need not lie within the project.
     */
    function Document(file) {
        if (!(this instanceof Document)) {  // error if constructor called without 'new'
            throw new Error("Document constructor must be called with 'new'");
        }
        if (getDocumentForFile(file)) {
            throw new Error("Creating a document when one already exists, for: " + file);
        }
        
        this.file = file;
    }
    
    /**
     * The FileEntry for the document being edited. Need not lie within the project.
     * @type {!FileEntry}
     */
    Document.prototype.file = null;
    
    /**
     * Whether this document has unsaved changes or not.
     * When this changes on any Document, DocumentManager dispatches a "dirtyFlagChange" event.
     * @type {boolean}
     */
    Document.prototype.isDirty = false;
    
    /**
     * What we expect the file's timestamp to be on disk. If the timestamp differs from this, then
     * it means the file was modified by an app other than Brackets.
     * @type {?Date}
     */
    Document.prototype.diskTimestamp = null;
    
    /**
     * Editor object representing the full-size editor UI for this document. Null if Document was
     * restored from persisted working set but hasn'r been opened in the UI yet.
     * Note: where Document and Editor APIs overlap, prefer Document. Only use Editor directly for
     * UI-related actions that Document does not provide any APIs for.
     * @type {?Editor}
     */
    Document.prototype.editor = null;

    /**
     * Null only of editor is not open yet. If a Document is created on empty text, or text with
     * inconsistent line endings, the Document defaults to the current platform's standard endings.
     * @type {null|FileUtils.LINE_ENDINGS_CRLF|FileUtils.LINE_ENDINGS_LF}
     */
    Document.prototype._lineEndings = null;

    /**
     * @private
     * NOTE: this is actually "semi-private"; EditorManager also accesses this method. But no one
     * other than DocumentManager and EditorManager should access it.
     *
     * Initialize the editor instance for this file.
     * @param {!Editor} editor  The editor that will maintain the document state (current text
     *          and undo stack). It is assumed that the editor text has already been initialized
     *          with the file's contents.
     * @param {!Date} initialTimestamp  Timestamp of file at the time we read its contents from disk.
     *          Required if editor is passed.
     * @perem {!string} rawText  Original text read from disk, beore handing to CodeMirror.
     */
    Document.prototype._setEditor = function (editor, initialTimestamp, rawText) {
        // Editor can only be assigned once per Document
        console.assert(!this.editor);
        
        this.editor = editor;
        this.diskTimestamp = initialTimestamp;
        
        // Dirty-bit tracking
        $(editor).on("change", this._handleEditorChange.bind(this));
        this.isDirty = false;
        
        // Sniff line-ending style
        this._lineEndings = FileUtils.sniffLineEndings(rawText);
        if (!this._lineEndings) {
            this._lineEndings = FileUtils.getPlatformLineEndings();
        }
    };
    
    /**
     * @return {string} The document's current contents; may not be saved to disk 
     *  yet. Returns null if the file was not yet read and no editor was 
     *  created.
     */
    Document.prototype.getText = function () {
        // CodeMirror.getValue() always returns text with LF line endings; fix up to match line
        // endings preferred by the document, if necessary
        var codeMirrorText = this.editor.getText();
        if (this._lineEndings === FileUtils.LINE_ENDINGS_LF) {
            return codeMirrorText;
        } else {
            return codeMirrorText.replace(/\n/g, "\r\n");
        }
    };
    
    /**
     * Sets the contents of the document. Treated as an edit. Line endings will be rewritten to
     * match the document's current line-ending style.
     * @param {!string} text The text to replace the contents of the document with.
     */
    Document.prototype.setText = function (text) {
        this.editor.setText(text);
    };
    
    /**
     * Sets the contents of the document. Treated as reloading the document from disk: the document
     * will be marked clean with a new timestamp, the undo/redo history is cleared, and we re-check
     * the text's line-ending style.
     * @param {!string} text The text to replace the contents of the document with.
     * @param {!Date} newTimestamp Timestamp of file at the time we read its new contents from disk.
     */
    Document.prototype.refreshText = function (text, newTimestamp) {
        this.editor.resetText(text);
        
        this._markClean();
        this.diskTimestamp = newTimestamp;
        
        // Re-sniff line-ending style too
        this._lineEndings = FileUtils.sniffLineEndings(text);
        if (!this._lineEndings) {
            this._lineEndings = FileUtils.getPlatformLineEndings();
        }
    };
    
    /**
     * Sets the cursor position in the document.
     * @param {number} line The 0 based line number.
     * @param {number} char The 0 based character position.
     */
    Document.prototype.setCursor = function (line, char) {
        this._editor.setCursor(line, char);
    };
  
    
    /**
     * Sets the cursor position in the document.
     * @param {number} line The 0 based line number.
     * @param {number} char The 0 based character position.
     */
    Document.prototype.setCursor = function (line, char) {
        this._editor.setCursor(line, char);
    };
    
    /**
     * @private
     */
    Document.prototype._handleEditorChange = function () {
        // On any change, mark the file dirty. In the future, we should make it so that if you
        // undo back to the last saved state, we mark the file clean.
        var wasDirty = this.isDirty;
        this.isDirty = true;

        // If file just became dirty, notify listeners, and add it to working set (if not already there)
        if (!wasDirty) {
            $(exports).triggerHandler("dirtyFlagChange", this);
            addToWorkingSet(this);
        }
    };
    
    /**
     * @private
     */
    Document.prototype._markClean = function () {
        if (!this.editor) {
            return;
        }

        this.isDirty = false;
        $(exports).triggerHandler("dirtyFlagChange", this);
    };
    
    /** 
     * Called when the document is saved (which currently happens in FileCommandHandlers). Marks the
     * document not dirty and notifies listeners of the save.
     */
    Document.prototype.notifySaved = function () {
        this._markClean();
        $(exports).triggerHandler("documentSaved", this);
        
        // TODO: (issue #295) fetching timestamp async creates race conditions (albeit unlikely ones)
        var thisDoc = this;
        this.file.getMetadata(
            function (metadata) {
                thisDoc.diskTimestamp = metadata.modificationTime;
            },
            function (error) {
                console.log("Error updating timestamp after saving file: " + thisDoc.file.fullPath);
            }
        );
    };
    
    /* (pretty toString(), to aid debugging) */
    Document.prototype.toString = function () {
        return "[Document " + this.file.fullPath + " " + (this.isDirty ? "(dirty!)" : "(clean)") + "]";
    };
    
    
    /**
     * Returns a Document for the given file: the existing Document if the given file is 'open' for
     * editing, or creates a new one otherwise. This is the preferred way to create a new Document.
     * Use getDocumentForPath() or getDocumentForFile() if you *only* care about Documents that are
     * already open.
     * @param {!string} fullPath
     * @return {!Document}
    */
    function getOrCreateDocumentForPath(fullPath) {
        var fileEntry = new NativeFileSystem.FileEntry(fullPath);
        var doc = getDocumentForFile(fileEntry);
        if (!doc) {
            doc = new Document(fileEntry);
        }
        return doc;
    }
    
    
    /**
     * @private
     * Preferences callback. Saves the document file paths for the working set.
     */
    function _savePreferences(storage) {
        // save the working set file paths
        var files       = [],
            isActive    = false,
            workingSet  = getWorkingSet(),
            currentDoc  = getCurrentDocument();

        workingSet.forEach(function (value, index) {
            // flag the currently active editor
            isActive = (value === currentDoc);

            files.push({
                file: value.file.fullPath,
                active: isActive
            });
        });

        storage.files = files;
    }

    /**
     * @private
     * Initializes the working set.
     */
    function _init() {
        var prefs       = PreferencesManager.getPreferences(PREFERENCES_CLIENT_ID);

        if (!prefs.files) {
            return;
        }

        var projectRoot = ProjectManager.getProjectRoot(),
            filesToOpen = [],
            activeFile;

        // in parallel, check if files exist
        // TODO: (issue #298) delay this check until it becomes the current document?
        function checkOneFile(value, index) {
            var oneFileResult = new $.Deferred();
            
            // check if the file still exists (not an error if it doesn't, though)
            projectRoot.getFile(value.file, {},
                function (fileEntry) {
                    // maintain original sequence
                    filesToOpen[index] = fileEntry;

                    if (value.active) {
                        activeFile = fileEntry;
                    }
                    oneFileResult.resolve();
                },
                function (error) {
                    filesToOpen[index] = null;
                    oneFileResult.resolve();
                });
            
            return oneFileResult;
        }

        var result = Async.doInParallel(prefs.files, checkOneFile, false);

        result.done(function () {
            var activeDoc,
                doc;

            // Add all existing files to the working set
            filesToOpen.forEach(function (value, index) {
                if (value) {
                    doc = new Document(value);
                    addToWorkingSet(doc);

                    if (value === activeFile) {
                        activeDoc = doc;
                    }
                }
            });

            // Initialize the active editor
            if (!activeDoc && _workingSet.length > 0) {
                activeDoc = _workingSet[0];
            }

            if (activeDoc) {
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: activeDoc.file.fullPath });
            }
        });
    }


    // Define public API
    exports.Document = Document;
    exports.getCurrentDocument = getCurrentDocument;
    exports.getOrCreateDocumentForPath = getOrCreateDocumentForPath;
    exports.getDocumentForPath = getDocumentForPath;
    exports.getDocumentForFile = getDocumentForFile;
    exports.getDocumentContents = getDocumentContents;
    exports.getWorkingSet = getWorkingSet;
    exports.findInWorkingSet = findInWorkingSet;
    exports.getAllOpenDocuments = getAllOpenDocuments;
    exports.showInEditor = showInEditor;
    exports.addToWorkingSet = addToWorkingSet;
    exports.closeDocument = closeDocument;
    exports.closeAll = closeAll;

    // Register preferences callback
    PreferencesManager.addPreferencesClient(PREFERENCES_CLIENT_ID, _savePreferences, this);

    // Initialize after ProjectManager is loaded
    $(ProjectManager).on("initializeComplete", function (event, projectRoot) {
        _init();
    });
});
