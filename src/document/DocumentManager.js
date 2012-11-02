/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

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
 *    - workingSetAddList -- When a list of files are added to the working set (e.g. project open, multiple file open).
 *      The 2nd arg to the listener is the array of added FileEntry objects.
 *    - workingSetRemove -- When a file is removed from the working set (see getWorkingSet()). The
 *      2nd arg to the listener is the removed FileEntry.
 *    - workingSetRemoveList -- When a list of files is to be removed from the working set (e.g. project close).
 *      The 2nd arg to the listener is the array of removed FileEntry objects.
 *    - fileNameChange -- When the name of a file or folder has changed. The 2nd arg is the old name.
 *      The 3rd arg is the new name.
 *    - workingSetReorder -- When the indexes of 2 files are swapped during a drag and drop order.
 *    - workingSetSort -- When the workingSet array is sorted.
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(DocumentManager).on("eventname", handler);
 */
define(function (require, exports, module) {
    "use strict";
    
    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        ProjectManager      = require("project/ProjectManager"),
        EditorManager       = require("editor/EditorManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        FileUtils           = require("file/FileUtils"),
        CommandManager      = require("command/CommandManager"),
        Async               = require("utils/Async"),
        CollectionUtils     = require("utils/CollectionUtils"),
        PerfUtils           = require("utils/PerfUtils"),
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
     * @private
     * Contains the same set of items as _workingSet, but ordered by how recently they were _currentDocument (0 = most recent).
     * @type {Array.<FileEntry>}
     */
    var _workingSetMRUOrder = [];
    
    /**
     * @private
     * Contains the same set of items as _workingSet, but ordered in the way they where added to _workingSet (0 = last added).
     * @type {Array.<FileEntry>}
     */
    var _workingSetAddedOrder = [];
    
    /**
     * While true, the MRU order is frozen
     * @type {boolean}
     */
    var _documentNavPending = false;
    
    /**
     * While true, allow preferences to be saved
     * @type {boolean}
     */
    var _isProjectChanging = false;
    
    /**
     * All documents with refCount > 0. Maps Document.file.fullPath -> Document.
     * @private
     * @type {Object.<string, Document>}
     */
    var _openDocuments = {};
    
    /**
     * Returns a list of items in the working set in UI list order. May be 0-length, but never null.
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
     * @param {Array.<FileEntry>=} list Pass this arg to search a different array of files. Internal
     *          use only.
     * @returns {number} index
     */
    function findInWorkingSet(fullPath, list) {
        list = list || _workingSet;
        
        return CollectionUtils.indexOf(list, function (file, i) {
            return file.fullPath === fullPath;
        });
    }
    
    /** 
     * Returns the index of the file matching fullPath in _workingSetAddedOrder.
     * Returns -1 if not found.
     * @param {!string} fullPath
     * @returns {number} index
     */
    function findInWorkingSetAddedOrder(fullPath) {
        return findInWorkingSet(fullPath, _workingSetAddedOrder);
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
     * Does not change which document is currently open in the editor. Completes synchronously.
     * @param {!FileEntry} file
     */
    function addToWorkingSet(file) {
        // If doc is already in working set, don't add it again
        if (findInWorkingSet(file.fullPath) !== -1) {
            return;
        }
        
        // Add to _workingSet making sure we store a different instance from the
        // one in the Document. See issue #1971 for more details.        
        file = new NativeFileSystem.FileEntry(file.fullPath);
        _workingSet.push(file);
        
        // Add to MRU order: either first or last, depending on whether it's already the current doc or not
        if (_currentDocument && _currentDocument.file.fullPath === file.fullPath) {
            _workingSetMRUOrder.unshift(file);
        } else {
            _workingSetMRUOrder.push(file);
        }
        
        // Add first to Added order
        _workingSetAddedOrder.unshift(file);
        
        // Dispatch event
        $(exports).triggerHandler("workingSetAdd", file);
    }

    /**
     * Adds the given file list to the end of the working set list.
     * Does not change which document is currently open in the editor.
     * More efficient than calling addToWorkingSet() (in a loop) for
     * a list of files because there's only 1 redraw at the end
     * @param {!FileEntryArray} fileList
     */
    function addListToWorkingSet(fileList) {
        var uniqueFileList = [];

        // Process only files not already in working set
        fileList.forEach(function (file, index) {
            // If doc is already in working set, don't add it again
            if (findInWorkingSet(file.fullPath) === -1) {
                uniqueFileList.push(file);

                // Add
                _workingSet.push(file);

                // Add to MRU order: either first or last, depending on whether it's already the current doc or not
                if (_currentDocument && _currentDocument.file.fullPath === file.fullPath) {
                    _workingSetMRUOrder.unshift(file);
                } else {
                    _workingSetMRUOrder.push(file);
                }
                
                // Add first to Added order
                _workingSetAddedOrder.splice(index, 1, file);
            }
        });
        

        // Dispatch event
        $(exports).triggerHandler("workingSetAddList", [uniqueFileList]);
    }

    /**
     * Removes the given file from the working set list, if it was in the list. Does not change
     * the current editor even if it's for this file.
     * @param {!FileEntry} file
     */
    function removeFromWorkingSet(file) {
        // If doc isn't in working set, do nothing
        var index = findInWorkingSet(file.fullPath);
        if (index === -1) {
            return;
        }
        
        // Remove
        _workingSet.splice(index, 1);
        _workingSetMRUOrder.splice(findInWorkingSet(file.fullPath, _workingSetMRUOrder), 1);
        _workingSetAddedOrder.splice(findInWorkingSet(file.fullPath, _workingSetAddedOrder), 1);
        
        // Dispatch event
        $(exports).triggerHandler("workingSetRemove", file);
    }

    /**
     * Removes all files from the working set list.
     */
    function _removeAllFromWorkingSet() {
        var fileList = _workingSet;

        // Remove all
        _workingSet = [];
        _workingSetMRUOrder = [];
        _workingSetAddedOrder = [];

        // Dispatch event
        $(exports).triggerHandler("workingSetRemoveList", [fileList]);
    }

    /**
     * Moves document to the front of the MRU list, IF it's in the working set; no-op otherwise.
     * @param {!Document}
     */
    function _markMostRecent(doc) {
        var mruI = findInWorkingSet(doc.file.fullPath, _workingSetMRUOrder);
        if (mruI !== -1) {
            _workingSetMRUOrder.splice(mruI, 1);
            _workingSetMRUOrder.unshift(doc.file);
        }
    }
    
    
    /**
     * Mutually exchanges the files at the indexes passed by parameters.
     * @param {!number} index - old file index
     * @param {!number} index - new file index
     */
    function swapWorkingSetIndexes(index1, index2) {
        var length = _workingSet.length - 1;
        var temp;
        
        if (index1 >= 0 && index2 <= length && index1 >= 0 && index2 <= length) {
            temp = _workingSet[index1];
            _workingSet[index1] = _workingSet[index2];
            _workingSet[index2] = temp;
            
            // Dispatch event
            $(exports).triggerHandler("workingSetReorder");
        }
    }
    
    /**
     * Sorts _workingSet using the compare function
     * @param {!function(FileEntry, FileEntry)} compareFn - the function that will be used inside JavaScript's
     *      sort function. The return a value should be >0 (sort a to a lower index than b), =0 (leaves a and b
     *      unchanged with respect to each other) or <0 (sort b to a lower index than a) and must always returns
     *      the same value when given a specific pair of elements a and b as its two arguments.
     *      Documentation: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
     */
    function sortWorkingSet(compareFn) {
        _workingSet.sort(compareFn);
        $(exports).triggerHandler("workingSetSort");
    }
    
    /**
     * Indicate that changes to currentDocument are temporary for now, and should not update the MRU
     * ordering of the working set. Useful for next/previous keyboard navigation (until Ctrl is released)
     * or for incremental-search style document preview like Quick Open will eventually have.
     * Can be called any number of times, and ended by a single finalizeDocumentNavigation() call.
     */
    function beginDocumentNavigation() {
        _documentNavPending = true;
    }
    
    /**
     * Un-freezes the MRU list after one or more beginDocumentNavigation() calls. Whatever document is
     * current is bumped to the front of the MRU list.
     */
    function finalizeDocumentNavigation() {
        if (_documentNavPending) {
            _documentNavPending = false;
            
            _markMostRecent(_currentDocument);
        }
    }
    
    
    /**
     * Changes currentDocument to the given Document, firing currentDocumentChange, which in turn
     * causes this Document's main editor UI to be shown in the editor pane, updates the selection
     * in the file tree / working set UI, etc. This call may also add the item to the working set.
     * 
     * @param {!Document} document  The Document to make current. May or may not already be in the
     *      working set.
     */
    function setCurrentDocument(doc) {
        
        // If this doc is already current, do nothing
        if (_currentDocument === doc) {
            return;
        }

        var perfTimerName = PerfUtils.markStart("setCurrentDocument:\t" + doc.file.fullPath);
        
        // If file not within project tree, add it to working set right now (don't wait for it to
        // become dirty)
        if (!ProjectManager.isWithinProject(doc.file.fullPath)) {
            addToWorkingSet(doc.file);
        }
        
        // Adjust MRU working set ordering (except while in the middle of a Ctrl+Tab sequence)
        if (!_documentNavPending) {
            _markMostRecent(doc);
        }
        
        // Make it the current document
        _currentDocument = doc;
        $(exports).triggerHandler("currentDocumentChange");
        // (this event triggers EditorManager to actually switch editors in the UI)

        PerfUtils.addMeasurement(perfTimerName);
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
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: nextFile.fullPath })
                    .done(function () {
                        // (Now we're guaranteed that the current document is not the one we're closing)
                        console.assert(!(_currentDocument && _currentDocument.file.fullPath === file.fullPath));
                    })
                    .fail(function () {
                        // File chosen to be switched to could not be opened, and the original file
                        // is still in editor. Close it again so code will try to open the next file,
                        // or empty the editor if there are no other files. 
                        closeFullEditor(file);
                    });
            } else {
                _clearCurrentDocument();
            }
        }
        
        // Remove closed doc from working set, if it was in there
        // This happens regardless of whether the document being closed was the current one or not
        removeFromWorkingSet(file);
        
        // Note: EditorManager will dispose the closed document's now-unneeded editor either in
        // response to the editor-swap call above, or the removeFromWorkingSet() call, depending on
        // circumstances. See notes in EditorManager for more.
    }

    /**
     * Equivalent to calling closeFullEditor() for all Documents. Same caveat: this discards any
     * unsaved changes, so the UI should confirm with the user before calling this.
     */
    function closeAll() {
        _clearCurrentDocument();
        _removeAllFromWorkingSet();
    }
    
    
    /**
     * Cleans up any loose Documents whose only ref is its own master Editor, and that Editor is not
     * rooted in the UI anywhere. This can happen if the Editor is auto-created via Document APIs that
     * trigger _ensureMasterEditor() without making it dirty. E.g. a command invoked on the focused
     * inline editor makes no-op edits or does a read-only operation.
     */
    function _gcDocuments() {
        getAllOpenDocuments().forEach(function (doc) {
            // Is the only ref to this document its own master Editor?
            if (doc._refCount === 1 && doc._masterEditor) {
                // Destroy the Editor if it's not being kept alive by the UI
                EditorManager._destroyEditorIfUnneeded(doc);
            }
        });
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
        
        // This is a good point to clean up any old dangling Documents
        _gcDocuments();
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
            $(exports).triggerHandler("afterDocumentCreate", this);
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

            $(exports).triggerHandler("beforeDocumentDelete", this);
            delete _openDocuments[this.file.fullPath];
        }
    };
    
    /**
     * Attach a backing Editor to the Document, enabling setText() to be called. Assumes Editor has
     * already been initialized with the value of getText(). ONLY Editor should call this (and only
     * when EditorManager has told it to act as the master editor).
     * @param {!Editor} masterEditor
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
            // _text represents the raw text, so fetch without normalized line endings
            this._text = this.getText(true);
            this._masterEditor = null;
        }
    };
    
    /**
     * Guarantees that _masterEditor is non-null. If needed, asks EditorManager to create a new master
     * editor bound to this Document (which in turn causes Document._makeEditable() to be called).
     * Should ONLY be called by Editor and Document.
     */
    Document.prototype._ensureMasterEditor = function () {
        if (!this._masterEditor) {
            EditorManager._createFullEditorForDocument(this);
        }
    };
    
    /**
     * Returns the document's current contents; may not be saved to disk yet. Whenever this
     * value changes, the Document dispatches a "change" event.
     *
     * @param {boolean=} useOriginalLineEndings If true, line endings in the result depend on the
     *      Document's line endings setting (based on OS & the original text loaded from disk).
     *      If false, line endings are always \n (like all the other Document text getter methods).
     * @return {string}
     */
    Document.prototype.getText = function (useOriginalLineEndings) {
        if (this._masterEditor) {
            // CodeMirror.getValue() always returns text with LF line endings; fix up to match line
            // endings preferred by the document, if necessary
            var codeMirrorText = this._masterEditor._codeMirror.getValue();
            if (useOriginalLineEndings) {
                if (this._lineEndings === FileUtils.LINE_ENDINGS_CRLF) {
                    return codeMirrorText.replace(/\n/g, "\r\n");
                }
            }
            return codeMirrorText;
            
        } else {
            // Optimized path that doesn't require creating master editor
            if (useOriginalLineEndings) {
                return this._text;
            } else {
                return this._text.replace(/\r\n/g, "\n");
            }
        }
    };
    
    /**
     * Sets the contents of the document. Treated as an edit. Line endings will be rewritten to
     * match the document's current line-ending style.
     * @param {!string} text The text to replace the contents of the document with.
     */
    Document.prototype.setText = function (text) {
        this._ensureMasterEditor();
        this._masterEditor._codeMirror.setValue(text);
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
        var perfTimerName = PerfUtils.markStart("refreshText:\t" + (!this.file || this.file.fullPath));

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

        PerfUtils.addMeasurement(perfTimerName);
    };
    
    /**
     * Adds, replaces, or removes text. If a range is given, the text at that range is replaced with the
     * given new text; if text == "", then the entire range is effectively deleted. If 'end' is omitted,
     * then the new text is inserted at that point and all existing text is preserved. Line endings will
     * be rewritten to match the document's current line-ending style.
     * @param {!string} text  Text to insert or replace the range with
     * @param {!{line:number, ch:number}} start  Start of range, inclusive (if 'to' specified) or insertion point (if not)
     * @param {?{line:number, ch:number}} end  End of range, exclusive; optional
     */
    Document.prototype.replaceRange = function (text, start, end) {
        this._ensureMasterEditor();
        this._masterEditor._codeMirror.replaceRange(text, start, end);
        // _handleEditorChange() triggers "change" event
    };
    
    /**
     * Returns the characters in the given range. Line endings are normalized to '\n'.
     * @param {!{line:number, ch:number}} start  Start of range, inclusive
     * @param {!{line:number, ch:number}} end  End of range, exclusive
     * @return {!string}
     */
    Document.prototype.getRange = function (start, end) {
        this._ensureMasterEditor();
        return this._masterEditor._codeMirror.getRange(start, end);
    };
    
    /**
     * Returns the text of the given line (excluding any line ending characters)
     * @param {number} Zero-based line number
     * @return {!string}
     */
    Document.prototype.getLine = function (lineNum) {
        this._ensureMasterEditor();
        return this._masterEditor._codeMirror.getLine(lineNum);
    };
    
    /**
     * Batches a series of related Document changes. Repeated calls to replaceRange() should be wrapped in a
     * batch for efficiency. Begins the batch, calls doOperation(), ends the batch, and then returns.
     * @param {function()} doOperation
     */
    Document.prototype.batchOperation = function (doOperation) {
        this._ensureMasterEditor();
        this._masterEditor._codeMirror.operation(doOperation);
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
        this.isDirty = editor._codeMirror.isDirty();
        
        // If file just became dirty, notify listeners, and add it to working set (if not already there)
        if (wasDirty !== this.isDirty) {
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
        if (this._masterEditor) {
            this._masterEditor._codeMirror.markClean();
        }
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
     * get Documents; do not call the Document constructor directly. This method is safe to call
     * in parallel.
     *
     * If you are going to hang onto the Document for more than just the duration of a command - e.g.
     * if you are going to display its contents in a piece of UI - then you must addRef() the Document
     * and listen for changes on it. (Note: opening the Document in an Editor automatically manages
     * refs and listeners for that Editor UI).
     *
     * @param {!string} fullPath
     * @return {$.Promise} A promise object that will be resolved with the Document, or rejected
     *      with a FileError if the file is not yet open and can't be read from disk.
     */
    function getDocumentForPath(fullPath) {
        var doc             = _openDocuments[fullPath],
            pendingPromise  = getDocumentForPath._pendingDocumentPromises[fullPath];

        if (doc) {
            // use existing document
            return new $.Deferred().resolve(doc).promise();
        } else if (pendingPromise) {
            // wait for the result of a previous request
            return pendingPromise;
        } else {
            var result = new $.Deferred(),
                promise = result.promise();
            
            // log this document's Promise as pending
            getDocumentForPath._pendingDocumentPromises[fullPath] = promise;

            // create a new document
            var fileEntry = new NativeFileSystem.FileEntry(fullPath),
                perfTimerName = PerfUtils.markStart("getDocumentForPath:\t" + fullPath);

            result.done(function () {
                PerfUtils.addMeasurement(perfTimerName);
            }).fail(function () {
                PerfUtils.finalizeMeasurement(perfTimerName);
            });

            FileUtils.readAsText(fileEntry)
                .always(function () {
                    // document is no longer pending
                    delete getDocumentForPath._pendingDocumentPromises[fullPath];
                })
                .done(function (rawText, readTimestamp) {
                    doc = new Document(fileEntry, readTimestamp, rawText);
                    result.resolve(doc);
                })
                .fail(function (fileError) {
                    result.reject(fileError);
                });
            
            return promise;
        }
    }
    
    /**
     * Document promises that are waiting to be resolved. It is possible for multiple clients
     * to request the same document simultaneously before the initial request has completed.
     * In particular, this happens at app startup where the working set is created and the
     * intial active document is opened in an editor. This is essential to ensure that only
     * 1 Document exists for any FileEntry.
     * @private
     * @type {Object.<string, $.Promise>}
     */
    getDocumentForPath._pendingDocumentPromises = {};
    
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
     * Get the next or previous file in the working set, in MRU order (relative to currentDocument).
     * @param {Number} inc  -1 for previous, +1 for next; no other values allowed
     * @return {?FileEntry}  null if working set empty
     */
    function getNextPrevFile(inc) {
        if (inc !== -1 && inc !== +1) {
            throw new Error("Illegal argument: inc = " + inc);
        }
        
        if (_currentDocument) {
            var mruI = findInWorkingSet(_currentDocument.file.fullPath, _workingSetMRUOrder);
            if (mruI === -1) {
                // If doc not in working set, return most recent working set item
                if (_workingSetMRUOrder.length > 0) {
                    return _workingSetMRUOrder[0];
                }
            } else {
                // If doc is in working set, return next/prev item with wrap-around
                var newI = mruI + inc;
                if (newI >= _workingSetMRUOrder.length) {
                    newI = 0;
                } else if (newI < 0) {
                    newI = _workingSetMRUOrder.length - 1;
                }
                
                return _workingSetMRUOrder[newI];
            }
        }
        
        // If no doc open or working set empty, there is no "next" file
        return null;
    }
    
    
    /**
     * @private
     * Preferences callback. Saves the document file paths for the working set.
     */
    function _savePreferences() {

        if (_isProjectChanging) {
            return;
        }
        
        // save the working set file paths
        var files       = [],
            isActive    = false,
            workingSet  = getWorkingSet(),
            currentDoc  = getCurrentDocument(),
            projectRoot = ProjectManager.getProjectRoot();

        if (!projectRoot) {
            return;
        }

        workingSet.forEach(function (file, index) {
            // flag the currently active editor
            isActive = currentDoc && (file.fullPath === currentDoc.file.fullPath);

            files.push({
                file: file.fullPath,
                active: isActive
            });
        });

        // append file root to make file list unique for each project
        _prefs.setValue("files_" + projectRoot.fullPath, files);
    }

    /**
     * @private
     * Handle beforeProjectClose event
     */
    function _beforeProjectClose() {
        _savePreferences();

        // When app is shutdown via shortcut key, the command goes directly to the
        // app shell, so we can't reliably fire the beforeProjectClose event on
        // app shutdown. To compensate, we listen for currentDocumentChange,
        // workingSetAdd, and workingSetRemove events so that the prefs for
        // last project used get updated. But when switching projects, after
        // the beforeProjectChange event gets fired, DocumentManager.closeAll()
        // causes workingSetRemove event to get fired and update the prefs to an empty
        // list. So, temporarily (until projectOpen event) disallow saving prefs.
        _isProjectChanging = true;
    }

    /**
     * @private
     * Initializes the working set.
     */
    function _projectOpen() {
        _isProjectChanging = false;
        
        // file root is appended for each project
        var projectRoot = ProjectManager.getProjectRoot(),
            files = _prefs.getValue("files_" + projectRoot.fullPath);

        if (!files) {
            return;
        }

        var filesToOpen = [],
            activeFile;

        // Add all files to the working set without verifying that
        // they still exist on disk (for faster project switching)
        files.forEach(function (value, index) {
            filesToOpen.push(new NativeFileSystem.FileEntry(value.file));
            if (value.active) {
                activeFile = value.file;
            }
        });
        addListToWorkingSet(filesToOpen);

        // Initialize the active editor
        if (!activeFile && _workingSet.length > 0) {
            activeFile = _workingSet[0].fullPath;
        }

        if (activeFile) {
            CommandManager.execute(Commands.FILE_OPEN, { fullPath: activeFile });
        }
    }

    /**
     * Called after a file or folder name has changed. This function is responsible
     * for updating underlying model data and notifying all views of the change.
     *
     * @param {string} oldName The old name of the file/folder
     * @param {string} newName The new name of the file/folder
     * @param {boolean} isFolder True if path is a folder; False if it is a file.
     */
    function notifyPathNameChanged(oldName, newName, isFolder) {
        var i, path;
        
        // Update open documents. This will update _currentDocument too, since 
        // the current document is always open.
        var keysToDelete = [];
        for (path in _openDocuments) {
            if (_openDocuments.hasOwnProperty(path)) {
                if (path.indexOf(oldName) === 0) {
                    // Copy value to new key
                    var newKey = path.replace(oldName, newName);
                    
                    _openDocuments[newKey] = _openDocuments[path];
                    keysToDelete.push(path);
                    
                    // Update document file
                    FileUtils.updateFileEntryPath(_openDocuments[newKey].file, oldName, newName);
                        
                    if (!isFolder) {
                        // If the path name is a file, there can only be one matched entry in the open document
                        // list, which we just updated. Break out of the for .. in loop. 
                        break;
                    }
                }
            }
        }
        // Delete the old keys
        for (i = 0; i < keysToDelete.length; i++) {
            delete _openDocuments[keysToDelete[i]];
        }
        
        // Update working set
        for (i = 0; i < _workingSet.length; i++) {
            FileUtils.updateFileEntryPath(_workingSet[i], oldName, newName);
        }
        
        // Send a "fileNameChanged" event. This will trigger the views to update.
        $(exports).triggerHandler("fileNameChange", [oldName, newName]);
    }
    
    // Define public API
    exports.Document                    = Document;
    exports.getCurrentDocument          = getCurrentDocument;
    exports.getDocumentForPath          = getDocumentForPath;
    exports.getOpenDocumentForPath      = getOpenDocumentForPath;
    exports.getWorkingSet               = getWorkingSet;
    exports.findInWorkingSet            = findInWorkingSet;
    exports.findInWorkingSetAddedOrder  = findInWorkingSetAddedOrder;
    exports.getAllOpenDocuments         = getAllOpenDocuments;
    exports.setCurrentDocument          = setCurrentDocument;
    exports.addToWorkingSet             = addToWorkingSet;
    exports.addListToWorkingSet         = addListToWorkingSet;
    exports.removeFromWorkingSet        = removeFromWorkingSet;
    exports.getNextPrevFile             = getNextPrevFile;
    exports.swapWorkingSetIndexes       = swapWorkingSetIndexes;
    exports.sortWorkingSet              = sortWorkingSet;
    exports.beginDocumentNavigation     = beginDocumentNavigation;
    exports.finalizeDocumentNavigation  = finalizeDocumentNavigation;
    exports.closeFullEditor             = closeFullEditor;
    exports.closeAll                    = closeAll;
    exports.notifyFileDeleted           = notifyFileDeleted;
    exports.notifyPathNameChanged       = notifyPathNameChanged;

    // Setup preferences
    _prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID);
    $(exports).bind("currentDocumentChange workingSetAdd workingSetAddList workingSetRemove workingSetRemoveList fileNameChange workingSetReorder workingSetSort", _savePreferences);
    
    // Performance measurements
    PerfUtils.createPerfMeasurement("DOCUMENT_MANAGER_GET_DOCUMENT_FOR_PATH", "DocumentManager.getDocumentForPath()");

    // Handle project change events
    $(ProjectManager).on("projectOpen", _projectOpen);
    $(ProjectManager).on("beforeProjectClose", _beforeProjectClose);
});
