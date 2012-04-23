/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

/**
 * DocumentManager maintains a list of currently 'open' Documents. It also owns the list of files in
 * the working set, and the notion of which Document is currently shown in the main editor UI area.
 * 
 * Document is the model for a file's contents; it dispatches events whenever those contents change.
 * To transiently inspect a file's content, simply get a Document and call getText() on it. However,
 * to be notified of Document changes or to modify a Document, you MUST call addRef() to ensure the
 * Document instance 'stays alive' and is shared by all other who read/modify that file. ('Open'
 * Documents are all Documents that are 'kept alive', i.e. have ref count > 0).
 *
 * To get a Document, call getDocumentForPath(); never new up a Document yourself.
 * 
 * Secretly, a Document may use an Editor instance to act as the model for its internal state. (This
 * is unavoidable because CodeMirror does not separate its model from its UI). Documents are not
 * modifiable until they have a backing 'master Editor'. Creation of the backing Editor is owned by
 * EditorManager. A Document only gets a backing Editor if it becomes the currentDocument, or if edits
 * occur in any Editor (inline or full-sized) bound to the Document; there is currently no other way
 * to ensure a Document is modifiable.
 *
 * A non-modifiable Document may still dispatch change notifications, if the Document was changed
 * externally on disk.
 *
 * Aside from the text content, Document tracks a few pieces of metadata - notably, whether there are
 * any unsaved changes.
 *
 * This module dispatches several events:
 *    - dirtyFlagChange -- When any Document's isDirty flag changes. The 2nd arg to the listener is the
 *      Document whose flag changed.
 *    - documentSaved -- When a Document's changes have been saved. The 2nd arg to the listener is the 
 *      Document that has been saved.
 *    - currentDocumentChange -- When the value of getCurrentDocument() changes.
 *    - workingSetAdd -- When a file is added to the working set (see getWorkingSet()). The 2nd arg
 *      to the listener is the added FileEntry.
 *    - workingSetRemove -- When a file is removed from the working set (see getWorkingSet()). The
 *      2nd arg to the listener is the removed FileEntry.
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(DocumentManager).on("eventname", handler);
 */
define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        ProjectManager      = require("project/ProjectManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        FileUtils           = require("file/FileUtils"),
        CommandManager      = require("command/CommandManager"),
        Async               = require("utils/Async"),
        Commands            = require("command/Commands");
    
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
     * @private
     * @type {PreferenceStorage}
     */
    var _prefs = {};
    
    /**
     * Returns the Document that is currently open in the editor UI. May be null.
     * When this changes, DocumentManager dispatches a "currentDocumentChange" event. The current
     * document always has a backing Editor (Document._masterEditor != null) and is thus modifiable.
     * @return {?Document}
     */
    function getCurrentDocument() {
        return _currentDocument;
    }
    
    /**
     * @private
     * @type {Array.<FileEntry>}
     * @see DocumentManager.getWorkingSet()
     */
    var _workingSet = [];
    
    /**
     * All documents with refCount > 0. Maps Document.file.fullPath -> Document.
     * @private
     * @type {Object.<string, Document>}
     */
    var _openDocuments = {};
    
    /**
     * Returns an ordered list of items in the working set. May be 0-length, but never null.
     *
     * When a file is added this list, DocumentManager dispatches a "workingSetAdd" event.
     * When a file is removed from list, DocumentManager dispatches a "workingSetRemove" event.
     * To listen for ALL changes to this list, you must listen for both events.
     *
     * Which items belong in the working set is managed entirely by DocumentManager. Callers cannot
     * (yet) change this collection on their own.
     *
     * @return {Array.<FileEntry>}
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
        var found = _workingSet.some(function findByPath(file, i) {
                ret = i;
                return file.fullPath === fullPath;
            });
            
        return (found ? ret : -1);
    }

    /**
     * Returns all Documents that are 'open' in the UI somewhere (for now, this means open in an
     * inline editor and/or a full-size editor). Only these Documents can be modified, and only
     * these Documents are synced with external changes on disk.
     * @return {Array.<Document>}
     */
    function getAllOpenDocuments() {
        var result = [];
        var path;
        for (path in _openDocuments) {
            if (_openDocuments.hasOwnProperty(path)) {
                result.push(_openDocuments[path]);
            }
        }
        return result;
    }
    
    
    /**
     * Adds the given file to the end of the working set list, if it is not already in the list.
     * Does not change which document is currently open in the editor.
     * @param {!FileEntry} file
     */
    function addToWorkingSet(file) {
        // If doc is already in working set, don't add it again
        if (findInWorkingSet(file.fullPath) !== -1) {
            return;
        }
        
        // Add
        _workingSet.push(file);
        
        // Dispatch event
        $(exports).triggerHandler("workingSetAdd", file);
    }
    
    /**
     * Removes the given file from the working set list, if it was in the list. Does not change
     * the current editor even if it's for this file.
     * @param {!FileEntry} file
     */
    function _removeFromWorkingSet(file) {
        // If doc isn't in working set, do nothing
        var index = findInWorkingSet(file.fullPath);
        if (index === -1) {
            return;
        }
        
        // Remove
        _workingSet.splice(index, 1);
        
        // Dispatch event
        $(exports).triggerHandler("workingSetRemove", file);
    }

    
    /**
     * Changes currentDocument to the given Document, firing currentDocumentChange, which in turn
     * causes this Document's main editor UI to be shown in the editor pane, updates the selection
     * in the file tree / working set UI, etc. This call may also add the item to the working set.
     * 
     * @param {!Document} document  The Document to make current. May or may not already be in the
     *      working set.
     */
    function setCurrentDocument(document) {
        
        // If this doc is already current, do nothing
        if (_currentDocument === document) {
            return;
        }
        
        // If file not within project tree, add it to working set right now (don't wait for it to
        // become dirty)
        if (!ProjectManager.isWithinProject(document.file.fullPath)) {
            addToWorkingSet(document.file);
        }
        
        // Make it the current document
        _currentDocument = document;
        $(exports).triggerHandler("currentDocumentChange");
        // (this event triggers EditorManager to actually switch editors in the UI)
    }
    
    /** Changes currentDocument to null, causing no full Editor to be shown in the UI */
    function _clearCurrentDocument() {
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
     * Closes the full editor for the given file (if there is one), and removes it from the working
     * set. Any other editors for this Document remain open. Discards any unsaved changes - it is
     * expected that the UI has already confirmed with the user before calling this.
     *
     * Changes currentDocument if this file was the current document (may change to null).
     *
     * This is a subset of notifyFileDeleted(). Use this for the user-facing Close command.
     *
     * @param {!FileEntry} file
     */
    function closeFullEditor(file) {
        // If this was the current document shown in the editor UI, we're going to switch to a
        // different document (or none if working set has no other options)
        if (_currentDocument && _currentDocument.file.fullPath === file.fullPath) {
            var wsIndex = findInWorkingSet(file.fullPath);
            
            // Decide which doc to show in editor after this one
            var nextFile;
            if (wsIndex === -1) {
                // If doc wasn't in working set, use bottommost working set item
                if (_workingSet.length > 0) {
                    nextFile = _workingSet[_workingSet.length  - 1];
                }
                // else: leave nextDocument null; editor area will be blank
            } else {
                // If doc was in working set, use item next to it (below if possible)
                if (wsIndex < _workingSet.length - 1) {
                    nextFile = _workingSet[wsIndex + 1];
                } else if (wsIndex > 0) {
                    nextFile = _workingSet[wsIndex - 1];
                }
                // else: leave nextDocument null; editor area will be blank
            }
            
            // Switch editor to next document (or blank it out)
            if (nextFile) {
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: nextFile.fullPath });
            } else {
                _clearCurrentDocument();
            }
        }
        
        // (Now we're guaranteed that the current document is not the one we're closing)
        console.assert(!(_currentDocument && _currentDocument.file.fullPath === file.fullPath));
        
        // Remove closed doc from working set, if it was in there
        // This happens regardless of whether the document being closed was the current one or not
        _removeFromWorkingSet(file);
        
        // Note: EditorManager will dispose the closed document's now-unneeded editor either in
        // response to the editor-swap call above, or the _removeFromWorkingSet() call, depending on
        // circumstances. See notes in EditorManager for more.
    }

    /**
     * Equivalent to calling closeFullEditor() for all Documents. Same caveat: this discards any
     * unsaved changes, so the UI should confirm with the user before calling this.
     */
    function closeAll() {
        _clearCurrentDocument();
        
        var wsClone = _workingSet.slice(0);  // can't delete from the same array we're iterating
        wsClone.forEach(_removeFromWorkingSet);
    }
    
    
    /**
     * @constructor
     * Model for the contents of a single file and its current modification state.
     * See DocumentManager documentation for important usage notes.
     *
     * Document dispatches these events:
     *
     * change -- When the text of the editor changes (including due to undo/redo). 
     *
     *        Passes ({Document}, {ChangeList}), where ChangeList is a linked list (NOT an array)
     *        of change record objects. Each change record looks like:
     *
     *            { from: start of change, expressed as {line: <line number>, ch: <character offset>},
     *              to: end of change, expressed as {line: <line number>, ch: <chracter offset>},
     *              text: array of lines of text to replace existing text,
     *              next: next change record in the linked list, or undefined if this is the last record }
     *      
     *        The line and ch offsets are both 0-based.
     *
     *        The ch offset in "from" is inclusive, but the ch offset in "to" is exclusive. For example,
     *        an insertion of new content (without replacing existing content) is expressed by a range
     *        where from and to are the same.
     *
     *        If "from" and "to" are undefined, then this is a replacement of the entire text content.
     *
     *        IMPORTANT: If you listen for the "change" event, you MUST also addRef() the document 
     *        (and releaseRef() it whenever you stop listening). You should also listen to the "deleted"
     *        event.
     *  
     *        (FUTURE: this is a modified version of the raw CodeMirror change event format; may want to make 
     *        it an ordinary array)
     *
     * deleted -- When the file for this document has been deleted. All views onto the document should
     *      be closed. The document will no longer be editable or dispatch "change" events.
     *
     * @param {!FileEntry} file  Need not lie within the project.
     * @param {!Date} initialTimestamp  File's timestamp when we read it off disk.
     * @param {!string} rawText  Text content of the file.
     */
    function Document(file, initialTimestamp, rawText) {
        if (!(this instanceof Document)) {  // error if constructor called without 'new'
            throw new Error("Document constructor must be called with 'new'");
        }
        if (_openDocuments[file.fullPath]) {
            throw new Error("Creating a document when one already exists, for: " + file);
        }
        
        this.file = file;
        this.refreshText(rawText, initialTimestamp);
    }
    
    /**
     * Number of clients who want this Document to stay alive. The Document is listed in
     * DocumentManager._openDocuments whenever refCount > 0.
     */
    Document.prototype._refCount = 0;
    
    /**
     * The FileEntry for this document. Need not lie within the project.
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
     * @type {!Date}
     */
    Document.prototype.diskTimestamp = null;
    
    /**
     * The text contents of the file, or null if our backing model is _masterEditor.
     * @type {?string}
     */
    Document.prototype._text = null;
    
    /**
     * Editor object representing the full-size editor UI for this document. May be null if Document
     * has not yet been modified or been the currentDocument; in that case, our backing model is the
     * string _text.
     * @type {?Editor}
     */
    Document.prototype._masterEditor = null;
    
    /**
     * The content's line-endings style. If a Document is created on empty text, or text with
     * inconsistent line endings, defaults to the current platform's standard endings.
     * @type {FileUtils.LINE_ENDINGS_CRLF|FileUtils.LINE_ENDINGS_LF}
     */
    Document.prototype._lineEndings = null;

    /** Add a ref to keep this Document alive */
    Document.prototype.addRef = function () {
        //console.log("+++REF+++ "+this);
        
        if (this._refCount === 0) {
            //console.log("+++ adding to open list");
            if (_openDocuments[this.file.fullPath]) {
                throw new Error("Document for this path already in _openDocuments!");
            }
            _openDocuments[this.file.fullPath] = this;
        }
        this._refCount++;
    };
    /** Remove a ref that was keeping this Document alive */
    Document.prototype.releaseRef = function () {
        //console.log("---REF--- "+this);
        
        this._refCount--;
        if (this._refCount < 0) {
            throw new Error("Document ref count has fallen below zero!");
        }
        if (this._refCount === 0) {
            //console.log("--- removing from open list");
            if (!_openDocuments[this.file.fullPath]) {
                throw new Error("Document with references was not in _openDocuments!");
            }
            delete _openDocuments[this.file.fullPath];
        }
    };
    
    /**
     * Attach a backing Editor to the Document, enabling setText() to be called. Assumes Editor has
     * already been initialized with the value of getText(). ONLY Editor should call this (and only
     * when EditorManager has told it to act as the master editor).
     */
    Document.prototype._makeEditable = function (masterEditor) {
        if (this._masterEditor) {
            throw new Error("Document is already editable");
        } else {
            this._text = null;
            this._masterEditor = masterEditor;
            $(masterEditor).on("change", this._handleEditorChange.bind(this));
        }
    };
    
    /**
     * Detach the backing Editor from the Document, disallowing setText(). The text content is
     * stored back onto _text so other Document clients continue to have read-only access. ONLY
     * Editor.destroy() should call this.
     */
    Document.prototype._makeNonEditable = function () {
        if (!this._masterEditor) {
            throw new Error("Document is already non-editable");
        } else {
            this._text = this.getText();
            this._masterEditor = null;
        }
    };
    
    /**
     * @return {string} The document's current contents; may not be saved to disk yet. Whenever this
     * value changes, the Document dispatches a "change" event.
     */
    Document.prototype.getText = function () {
        if (this._masterEditor) {
            // CodeMirror.getValue() always returns text with LF line endings; fix up to match line
            // endings preferred by the document, if necessary
            var codeMirrorText = this._masterEditor._getText();
            if (this._lineEndings === FileUtils.LINE_ENDINGS_LF) {
                return codeMirrorText;
            } else {
                return codeMirrorText.replace(/\n/g, "\r\n");
            }
        } else {
            return this._text;
        }
    };
    
    /**
     * Sets the contents of the document. Treated as an edit. Line endings will be rewritten to
     * match the document's current line-ending style. CANNOT be called unless the Document has a
     * backing editor. Only Editor can ensure that is true; from anywhere else, it's unsafe to call
     * setText() unless this is the currentDocument.
     * @param {!string} text The text to replace the contents of the document with.
     */
    Document.prototype.setText = function (text) {
        if (!this._masterEditor) {
            throw new Error("Cannot mutate a Document before it has been assigned a master Editor");
        }
        this._masterEditor._setText(text);
        // _handleEditorChange() triggers "change" event
    };
    
    /**
     * Sets the contents of the document. Treated as reloading the document from disk: the document
     * will be marked clean with a new timestamp, the undo/redo history is cleared, and we re-check
     * the text's line-ending style. CAN be called even if there is no backing editor.
     * @param {!string} text The text to replace the contents of the document with.
     * @param {!Date} newTimestamp Timestamp of file at the time we read its new contents from disk.
     */
    Document.prototype.refreshText = function (text, newTimestamp) {
        if (this._masterEditor) {
            this._masterEditor._resetText(text);
            // _handleEditorChange() triggers "change" event for us
        } else {
            this._text = text;
            // We fake a change record here that looks like CodeMirror's text change records, but
            // omits "from" and "to", by which we mean the entire text has changed.
            // TODO: Dumb to split it here just to join it again in the change handler, but this is
            // the CodeMirror change format. Should we document our change format to allow this to
            // either be an array of lines or a single string?
            $(this).triggerHandler("change", [this, {text: text.split(/\r?\n/)}]);
        }
        this._markClean();
        this.diskTimestamp = newTimestamp;
        
        // Sniff line-ending style
        this._lineEndings = FileUtils.sniffLineEndings(text);
        if (!this._lineEndings) {
            this._lineEndings = FileUtils.getPlatformLineEndings();
        }
    };
    
    /**
     * Handles changes from the master backing Editor. Changes are triggered either by direct edits
     * to that Editor's UI, OR by our setText()/refreshText() methods.
     * @private
     */
    Document.prototype._handleEditorChange = function (event, editor, changeList) {
        // On any change, mark the file dirty. In the future, we should make it so that if you
        // undo back to the last saved state, we mark the file clean.
        var wasDirty = this.isDirty;
        this.isDirty = true;

        // If file just became dirty, notify listeners, and add it to working set (if not already there)
        if (!wasDirty) {
            $(exports).triggerHandler("dirtyFlagChange", [this]);
            addToWorkingSet(this.file);
        }
        
        // Notify that Document's text has changed
        // TODO: This needs to be kept in sync with SpecRunnerUtils.createMockDocument(). In the
        // future, we should fix things so that we either don't need mock documents or that this
        // is factored so it will just run in both.
        $(this).triggerHandler("change", [this, changeList]);
    };
    
    /**
     * @private
     */
    Document.prototype._markClean = function () {
        this.isDirty = false;
        $(exports).triggerHandler("dirtyFlagChange", this);
    };
    
    /** 
     * Called when the document is saved (which currently happens in DocumentCommandHandlers). Marks the
     * document not dirty and notifies listeners of the save.
     */
    Document.prototype.notifySaved = function () {
        if (!this._masterEditor) {
            console.log("### Warning: saving a Document that is not modifiable!");
        }
        
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
        var dirtyInfo = (this.isDirty ? " (dirty!)" : " (clean)");
        var editorInfo = (this._masterEditor ? " (Editable)" : " (Non-editable)");
        var refInfo = " refs:" + this._refCount;
        return "[Document " + this.file.fullPath + dirtyInfo + editorInfo + refInfo + "]";
    };
    
    
    /**
     * Gets an existing open Document for the given file, or creates a new one if the Document is
     * not currently open ('open' means referenced by the UI somewhere). Always use this method to
     * get Documents; do not call the Document constructor directly.
     *
     * If you are going to hang onto the Document for more than just the duration of a command - e.g.
     * if you are going to display its contents in a piece of UI - then you must addRef() the Document
     * and listen for changes on it. (Note: opening the Document in an Editor automatically manages
     * refs and listeners for that Editor UI).
     *
     * @param {!string} fullPath
     * @return {Deferred} A Deferred object that will be resolved with the Document, or rejected
     *      with a FileError if the file is not yet open and can't be read from disk.
     */
    function getDocumentForPath(fullPath) {
        var result = new $.Deferred();
        var doc = _openDocuments[fullPath];
        if (doc) {
            result.resolve(doc);
        } else {
            var fileEntry = new NativeFileSystem.FileEntry(fullPath);
            FileUtils.readAsText(fileEntry)
                .done(function (rawText, readTimestamp) {
                    doc = new Document(fileEntry, readTimestamp, rawText);
                    result.resolve(doc);
                })
                .fail(function (fileError) {
                    result.reject(fileError);
                });
        }
        return result;
    }
    
    /**
     * Returns the existing open Document for the given file, or null if the file is not open ('open'
     * means referenced by the UI somewhere). If you will hang onto the Document, you must addRef()
     * it; see {@link getDocumentForPath()} for details.
     */
    function getOpenDocumentForPath(fullPath) {
        return _openDocuments[fullPath];
    }
    
    
    /**
     * Reacts to a file being deleted: if there is a Document for this file, causes it to dispatch a
     * "deleted" event; ensures it's not the currentDocument; and removes this file from the working
     * set. These actions in turn cause all open editors for this file to close. Discards any unsaved
     * changes - it is expected that the UI has already confirmed with the user before calling.
     *
     * To simply close a main editor when the file hasn't been deleted, use closeFullEditor() or FILE_CLOSE.
     *
     * FUTURE: Instead of an explicit notify, we should eventually listen for deletion events on some
     * sort of "project file model," making this just a private event handler.
     */
    function notifyFileDeleted(file) {
        // First ensure it's not currentDocument, and remove from working set
        closeFullEditor(file);
        
        // Notify all other editors to close as well
        var doc = getOpenDocumentForPath(file.fullPath);
        if (doc) {
            $(doc).triggerHandler("deleted");
        }
        
        // At this point, all those other views SHOULD have released the Doc
        if (doc && doc._refCount > 0) {
            console.log("WARNING: deleted Document still has " + doc._refCount + " references. Did someone addRef() without listening for 'deleted'?");
        }
    }
    
    
    /**
     * @private
     * Preferences callback. Saves the document file paths for the working set.
     */
    function _savePreferences() {
        // save the working set file paths
        var files       = [],
            isActive    = false,
            workingSet  = getWorkingSet(),
            currentDoc  = getCurrentDocument();

        workingSet.forEach(function (file, index) {
            // flag the currently active editor
            isActive = currentDoc && (file.fullPath === currentDoc.file.fullPath);

            files.push({
                file: file.fullPath,
                active: isActive
            });
        });

        _prefs.setValue("files", files);
    }

    /**
     * @private
     * Initializes the working set.
     */
    function _init() {
        var prefs = _prefs.getAllValues();

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
            
            // check if the file still exists; silently drop from working set if it doesn't
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
            // Add all existing files to the working set
            filesToOpen.forEach(function (file, index) {
                if (file) {
                    addToWorkingSet(file);
                }
            });

            // Initialize the active editor
            if (!activeFile && _workingSet.length > 0) {
                activeFile = _workingSet[0];
            }

            if (activeFile) {
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: activeFile.fullPath });
            }
        });
    }


    // Define public API
    exports.Document = Document;
    exports.getCurrentDocument = getCurrentDocument;
    exports.getDocumentForPath = getDocumentForPath;
    exports.getOpenDocumentForPath = getOpenDocumentForPath;
    exports.getWorkingSet = getWorkingSet;
    exports.findInWorkingSet = findInWorkingSet;
    exports.getAllOpenDocuments = getAllOpenDocuments;
    exports.setCurrentDocument = setCurrentDocument;
    exports.addToWorkingSet = addToWorkingSet;
    exports.closeFullEditor = closeFullEditor;
    exports.closeAll = closeAll;
    exports.notifyFileDeleted = notifyFileDeleted;

    // Setup preferences
    _prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID);
    $(exports).bind("currentDocumentChange workingSetAdd workingSetRemove", _savePreferences);

    // Initialize after ProjectManager is loaded
    $(ProjectManager).on("initializeComplete", function (event, projectRoot) {
        _init();
    });
});
