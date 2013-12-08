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
 *
 *    - dirtyFlagChange -- When any Document's isDirty flag changes. The 2nd arg to the listener is the
 *      Document whose flag changed.
 *    - documentSaved -- When a Document's changes have been saved. The 2nd arg to the listener is the
 *      Document that has been saved.
 *    - documentRefreshed -- When a Document's contents have been reloaded from disk. The 2nd arg to the
 *      listener is the Document that has been refreshed.
 *
 *    - currentDocumentChange -- When the value of getCurrentDocument() changes.
 *
 *    To listen for working set changes, you must listen to *all* of these events:
 *    - workingSetAdd -- When a file is added to the working set (see getWorkingSet()). The 2nd arg
 *      to the listener is the added File, and the 3rd arg is the index it was inserted at.
 *    - workingSetAddList -- When multiple files are added to the working set (e.g. project open, multiple file open).
 *      The 2nd arg to the listener is the array of added File objects.
 *    - workingSetRemove -- When a file is removed from the working set (see getWorkingSet()). The
 *      2nd arg to the listener is the removed File.
 *    - workingSetRemoveList -- When multiple files are removed from the working set (e.g. project close).
 *      The 2nd arg to the listener is the array of removed File objects.
 *    - workingSetSort -- When the workingSet array is reordered without additions or removals.
 *      Listener receives no arguments.
 *
 *    - workingSetDisableAutoSorting -- Dispatched in addition to workingSetSort when the reorder was caused
 *      by manual dragging and dropping. Listener receives no arguments.
 *
 *    - fileNameChange -- When the name of a file or folder has changed. The 2nd arg is the old name.
 *      The 3rd arg is the new name.
 *    - pathDeleted -- When a file or folder has been deleted. The 2nd arg is the path that was deleted.
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(DocumentManager).on("eventname", handler);
 *
 * Document objects themselves also dispatch some events - see Document docs for details.
 */
define(function (require, exports, module) {
    "use strict";
    
    var _ = require("thirdparty/lodash");
    
    var DocumentModule      = require("document/Document"),
        ProjectManager      = require("project/ProjectManager"),
        EditorManager       = require("editor/EditorManager"),
        FileSyncManager     = require("project/FileSyncManager"),
        FileSystem          = require("filesystem/FileSystem"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        FileUtils           = require("file/FileUtils"),
        InMemoryFile        = require("document/InMemoryFile"),
        CommandManager      = require("command/CommandManager"),
        Async               = require("utils/Async"),
        PerfUtils           = require("utils/PerfUtils"),
        Commands            = require("command/Commands"),
        LanguageManager     = require("language/LanguageManager"),
        Strings             = require("strings");

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
     * Random path prefix for untitled documents
     */
    var _untitledDocumentPath = "/_brackets_" + _.random(10000000, 99999999);

    /**
     * @private
     * @type {Array.<File>}
     * @see DocumentManager.getWorkingSet()
     */
    var _workingSet = [];
    
    /**
     * @private
     * Contains the same set of items as _workingSet, but ordered by how recently they were _currentDocument (0 = most recent).
     * @type {Array.<File>}
     */
    var _workingSetMRUOrder = [];
    
    /**
     * @private
     * Contains the same set of items as _workingSet, but ordered in the way they where added to _workingSet (0 = last added).
     * @type {Array.<File>}
     */
    var _workingSetAddedOrder = [];
    
    /**
     * While true, the MRU order is frozen
     * @type {boolean}
     */
    var _documentNavPending = false;
    
    /**
     * All documents with refCount > 0. Maps Document.file.id -> Document.
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
     * @return {Array.<File>}
     */
    function getWorkingSet() {
        return _.clone(_workingSet);
    }

    /**
     * Returns the index of the file matching fullPath in the working set.
     * Returns -1 if not found.
     * @param {!string} fullPath
     * @param {Array.<File>=} list Pass this arg to search a different array of files. Internal
     *          use only.
     * @returns {number} index
     */
    function findInWorkingSet(fullPath, list) {
        list = list || _workingSet;
        
        return _.findIndex(list, function (file, i) {
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
        var id;
        for (id in _openDocuments) {
            if (_openDocuments.hasOwnProperty(id)) {
                result.push(_openDocuments[id]);
            }
        }
        return result;
    }
    
    
    /**
     * Adds the given file to the end of the working set list, if it is not already in the list
     * and it does not have a custom viewer.
     * Does not change which document is currently open in the editor. Completes synchronously.
     * @param {!File} file
     * @param {number=} index  Position to add to list (defaults to last); -1 is ignored
     * @param {boolean=} forceRedraw  If true, a working set change notification is always sent
     *    (useful if suppressRedraw was used with removeFromWorkingSet() earlier)
     */
    function addToWorkingSet(file, index, forceRedraw) {
        var indexRequested = (index !== undefined && index !== null && index !== -1);
        
        // If the file has a custom viewer, then don't add it to the working set.
        if (EditorManager.getCustomViewerForPath(file.fullPath)) {
            return;
        }
            
        // If doc is already in working set, don't add it again
        var curIndex = findInWorkingSet(file.fullPath);
        if (curIndex !== -1) {
            // File is in working set, but not at the specifically requested index - only need to reorder
            if (forceRedraw || (indexRequested && curIndex !== index)) {
                var entry = _workingSet.splice(curIndex, 1)[0];
                _workingSet.splice(index, 0, entry);
                $(exports).triggerHandler("workingSetSort");
            }
            return;
        }

        if (!indexRequested) {
            // If no index is specified, just add the file to the end of the working set.
            _workingSet.push(file);
        } else {
            // If specified, insert into the working set list at this 0-based index
            _workingSet.splice(index, 0, file);
        }
        
        // Add to MRU order: either first or last, depending on whether it's already the current doc or not
        if (_currentDocument && _currentDocument.file.fullPath === file.fullPath) {
            _workingSetMRUOrder.unshift(file);
        } else {
            _workingSetMRUOrder.push(file);
        }
        
        // Add first to Added order
        _workingSetAddedOrder.unshift(file);
        
        // Dispatch event
        if (!indexRequested) {
            index = _workingSet.length - 1;
        }
        $(exports).triggerHandler("workingSetAdd", [file, index]);
    }
    
    /**
     * Adds the given file list to the end of the working set list.
     * If a file in the list has its own custom viewer, then it 
     * is not added into the working set.
     * Does not change which document is currently open in the editor.
     * More efficient than calling addToWorkingSet() (in a loop) for
     * a list of files because there's only 1 redraw at the end
     * @param {!Array.<File>} fileList
     */
    function addListToWorkingSet(fileList) {
        var uniqueFileList = [];

        // Process only files not already in working set
        fileList.forEach(function (file, index) {
            // If doc has a custom viewer, then don't add it to the working set.
            // Or if doc is already in working set, don't add it again.
            if (!EditorManager.getCustomViewerForPath(file.fullPath) &&
                    findInWorkingSet(file.fullPath) === -1) {
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
     * Warning: low level API - use FILE_CLOSE command in most cases.
     * Removes the given file from the working set list, if it was in the list. Does not change
     * the current editor even if it's for this file. Does not prompt for unsaved changes.
     * @param {!File} file
     * @param {boolean=} true to suppress redraw after removal
     */
    function removeFromWorkingSet(file, suppressRedraw) {
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
        $(exports).triggerHandler("workingSetRemove", [file, suppressRedraw]);
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
     * @param {number} index  Old file index
     * @param {number} index  New file index
     */
    function swapWorkingSetIndexes(index1, index2) {
        var length = _workingSet.length - 1;
        var temp;
        
        if (index1 >= 0 && index2 <= length && index1 >= 0 && index2 <= length) {
            temp = _workingSet[index1];
            _workingSet[index1] = _workingSet[index2];
            _workingSet[index2] = temp;
            
            $(exports).triggerHandler("workingSetSort");
            $(exports).triggerHandler("workingSetDisableAutoSorting");
        }
    }
    
    /**
     * Sorts _workingSet using the compare function
     * @param {function(File, File): number} compareFn  The function that will be used inside JavaScript's
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
     * Get the next or previous file in the working set, in MRU order (relative to currentDocument). May
     * return currentDocument itself if working set is length 1.
     * @param {number} inc  -1 for previous, +1 for next; no other values allowed
     * @return {?File}  null if working set empty
     */
    function getNextPrevFile(inc) {
        if (inc !== -1 && inc !== +1) {
            console.error("Illegal argument: inc = " + inc);
            return null;
        }
        
        if (EditorManager.getCurrentlyViewedPath()) {
            var mruI = findInWorkingSet(EditorManager.getCurrentlyViewedPath(), _workingSetMRUOrder);
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
        
        // If file is untitled or otherwise not within project tree, add it to
        // working set right now (don't wait for it to become dirty)
        if (doc.isUntitled() || !ProjectManager.isWithinProject(doc.file.fullPath)) {
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
        } else {
            // Change model & dispatch event
            _currentDocument = null;
            // (this event triggers EditorManager to actually clear the editor UI)
            $(exports).triggerHandler("currentDocumentChange");
        }
    }
    

    
    /**
     * Warning: low level API - use FILE_CLOSE command in most cases.
     * Closes the full editor for the given file (if there is one), and removes it from the working
     * set. Any other editors for this Document remain open. Discards any unsaved changes without prompting.
     *
     * Changes currentDocument if this file was the current document (may change to null).
     *
     * This is a subset of notifyFileDeleted(). Use this for the user-facing Close command.
     *
     * @param {!File} file
     * @param {boolean} skipAutoSelect - if true, don't automatically open and select the next document
     */
    function closeFullEditor(file, skipAutoSelect) {
        // If this was the current document shown in the editor UI, we're going to switch to a
        // different document (or none if working set has no other options)
        if (_currentDocument && _currentDocument.file.fullPath === file.fullPath) {
            // Get next most recent doc in the MRU order
            var nextFile = getNextPrevFile(1);
            if (nextFile && nextFile.fullPath === _currentDocument.file.fullPath) {
                // getNextPrevFile() might return the file we're about to close if it's the only one open (due to wraparound)
                nextFile = null;
            }
            
            // Switch editor to next document (or blank it out)
            if (nextFile && !skipAutoSelect) {
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
        
    function removeListFromWorkingSet(list, clearCurrentDocument) {
        var fileList = [], index;
        
        if (!list) {
            return;
        }
        
        if (clearCurrentDocument) {
            _clearCurrentDocument();
        }
        
        list.forEach(function (file) {
            index = findInWorkingSet(file.fullPath);
            
            if (index !== -1) {
                fileList.push(_workingSet[index]);
                
                _workingSet.splice(index, 1);
                _workingSetMRUOrder.splice(findInWorkingSet(file.fullPath, _workingSetMRUOrder), 1);
                _workingSetAddedOrder.splice(findInWorkingSet(file.fullPath, _workingSetAddedOrder), 1);
            }
        });
        
        $(exports).triggerHandler("workingSetRemoveList", [fileList]);
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
     * Returns the existing open Document for the given file, or null if the file is not open ('open'
     * means referenced by the UI somewhere). If you will hang onto the Document, you must addRef()
     * it; see {@link getDocumentForPath()} for details.
     * @param {!string} fullPath
     * @return {?Document}
     */
    function getOpenDocumentForPath(fullPath) {
        var id;
        
        // Need to walk all open documents and check for matching path. We can't
        // use getFileForPath(fullPath).id since the file it returns won't match
        // an Untitled document's InMemoryFile.
        for (id in _openDocuments) {
            if (_openDocuments.hasOwnProperty(id)) {
                if (_openDocuments[id].file.fullPath === fullPath) {
                    return _openDocuments[id];
                }
            }
        }
        return null;
    }
    
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
     * If all you need is the Document's getText() value, use the faster getDocumentText() instead.
     *
     * @param {!string} fullPath
     * @return {$.Promise} A promise object that will be resolved with the Document, or rejected
     *      with a FileSystemError if the file is not yet open and can't be read from disk.
     */
    function getDocumentForPath(fullPath) {
        var doc = getOpenDocumentForPath(fullPath);

        if (doc) {
            // use existing document
            return new $.Deferred().resolve(doc).promise();
        } else {
            
            // Should never get here if the fullPath refers to an Untitled document
            if (fullPath.indexOf(_untitledDocumentPath) === 0) {
                console.error("getDocumentForPath called for non-open untitled document: " + fullPath);
                return new $.Deferred().reject().promise();
            }
            
            var file            = FileSystem.getFileForPath(fullPath),
                pendingPromise  = getDocumentForPath._pendingDocumentPromises[file.id];
            
            if (pendingPromise) {
                // wait for the result of a previous request
                return pendingPromise;
            } else {
                var result = new $.Deferred(),
                    promise = result.promise();
                
                // log this document's Promise as pending
                getDocumentForPath._pendingDocumentPromises[file.id] = promise;
    
                // create a new document
                var perfTimerName = PerfUtils.markStart("getDocumentForPath:\t" + fullPath);
    
                result.done(function () {
                    PerfUtils.addMeasurement(perfTimerName);
                }).fail(function () {
                    PerfUtils.finalizeMeasurement(perfTimerName);
                });
    
                FileUtils.readAsText(file)
                    .always(function () {
                        // document is no longer pending
                        delete getDocumentForPath._pendingDocumentPromises[file.id];
                    })
                    .done(function (rawText, readTimestamp) {
                        doc = new DocumentModule.Document(file, readTimestamp, rawText);
                                
                        // This is a good point to clean up any old dangling Documents
                        _gcDocuments();
                        
                        result.resolve(doc);
                    })
                    .fail(function (fileError) {
                        result.reject(fileError);
                    });
                
                return promise;
            }
        }
    }
    
    /**
     * Document promises that are waiting to be resolved. It is possible for multiple clients
     * to request the same document simultaneously before the initial request has completed.
     * In particular, this happens at app startup where the working set is created and the
     * intial active document is opened in an editor. This is essential to ensure that only
     * one Document exists for any File.
     * @private
     * @type {Object.<string, $.Promise>}
     */
    getDocumentForPath._pendingDocumentPromises = {};
    
    /**
     * Gets the text of a Document (including any unsaved changes), or would-be Document if the
     * file is not actually open. More efficient than getDocumentForPath(). Use when you're reading
     * document(s) but don't need to hang onto a Document object.
     * 
     * If the file is open this is equivalent to calling getOpenDocumentForPath().getText(). If the
     * file is NOT open, this is like calling getDocumentForPath()...getText() but more efficient.
     * Differs from plain FileUtils.readAsText() in two ways: (a) line endings are still normalized
     * as in Document.getText(); (b) unsaved changes are returned if there are any.
     * 
     * @param {!File} file
     * @return {!string}
     */
    function getDocumentText(file) {
        var result = new $.Deferred(),
            doc = getOpenDocumentForPath(file.fullPath);
        if (doc) {
            result.resolve(doc.getText());
        } else {
            file.read(function (err, contents) {
                if (err) {
                    result.reject(err);
                } else {
                    // Normalize line endings the same way Document would, but don't actually
                    // new up a Document (which entails a bunch of object churn).
                    contents = DocumentModule.Document.normalizeText(contents);
                    result.resolve(contents);
                }
            });
        }
        return result.promise();
    }
    
    
    /**
     * Creates an untitled document. The associated File has a fullPath that
     * looks like /some-random-string/Untitled-counter.fileExt.
     *
     * @param {number} counter - used in the name of the new Document's File
     * @param {string} fileExt - file extension of the new Document's File, including "."
     * @return {Document} - a new untitled Document
     */
    function createUntitledDocument(counter, fileExt) {
        var filename = Strings.UNTITLED + "-" + counter + fileExt,
            fullPath = _untitledDocumentPath + "/" + filename,
            now = new Date(),
            file = new InMemoryFile(fullPath, FileSystem);
        
        return new DocumentModule.Document(file, now, "");
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
     *
     * @param {!File} file
     * @param {boolean} skipAutoSelect - if true, don't automatically open/select the next document
     */
    function notifyFileDeleted(file, skipAutoSelect) {
        // First ensure it's not currentDocument, and remove from working set
        closeFullEditor(file, skipAutoSelect);
        
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
     * Preferences callback. Saves the state of the working set.
     */
    function _savePreferences() {
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
            // Do not persist untitled document paths
            if (!(file instanceof InMemoryFile)) {
                // flag the currently active editor
                isActive = currentDoc && (file.fullPath === currentDoc.file.fullPath);
                
                // save editor UI state for just the working set
                var viewState = EditorManager._getViewState(file.fullPath);
                
                files.push({
                    file: file.fullPath,
                    active: isActive,
                    viewState: viewState
                });
            }
        });

        // append file root to make file list unique for each project
        _prefs.setValue("files_" + projectRoot.fullPath, files);
    }

    /**
     * @private
     * Initializes the working set.
     */
    function _projectOpen(e) {
        // file root is appended for each project
        var projectRoot = ProjectManager.getProjectRoot(),
            files = _prefs.getValue("files_" + projectRoot.fullPath);
        
        console.assert(Object.keys(_openDocuments).length === 0);  // no files leftover from prev proj

        if (!files) {
            return;
        }

        var filesToOpen = [],
            viewStates = {},
            activeFile;

        // Add all files to the working set without verifying that
        // they still exist on disk (for faster project switching)
        files.forEach(function (value, index) {
            filesToOpen.push(FileSystem.getFileForPath(value.file));
            if (value.active) {
                activeFile = value.file;
            }
            if (value.viewState) {
                viewStates[value.file] = value.viewState;
            }
        });
        addListToWorkingSet(filesToOpen);
        
        // Allow for restoring saved editor UI state
        EditorManager._resetViewStates(viewStates);

        // Initialize the active editor
        if (!activeFile && _workingSet.length > 0) {
            activeFile = _workingSet[0].fullPath;
        }

        if (activeFile) {
            var promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: activeFile });
            // Add this promise to the event's promises to signal that this handler isn't done yet
            e.promises.push(promise);
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
        // Notify all open documents 
        _.forEach(_openDocuments, function (doc, id) {
            // TODO: Only notify affected documents? For now _notifyFilePathChange 
            // just updates the language if the extension changed, so it's fine
            // to call for all open docs.
            doc._notifyFilePathChanged();
        });
        
        // Send a "fileNameChanged" event. This will trigger the views to update.
        $(exports).triggerHandler("fileNameChange", [oldName, newName]);
    }
    
    /**
     * Called after a file or folder has been deleted. This function is responsible
     * for updating underlying model data and notifying all views of the change.
     *
     * @param {string} path The path of the file/folder that has been deleted
     */
    function notifyPathDeleted(path) {
        /* FileSyncManager.syncOpenDocuments() does all the work of closing files
           in the working set and notifying the user of any unsaved changes. */
        FileSyncManager.syncOpenDocuments(Strings.FILE_DELETED_TITLE);
        
        // Send a "pathDeleted" event. This will trigger the views to update.
        $(exports).triggerHandler("pathDeleted", path);
    }
    
    /**
     * @private
     * Update document
     */
    function _handleLanguageAdded(event, language) {
        _.forEach(_openDocuments, function (doc, key) {
            // No need to look at the new language if this document has one already
            if (doc.getLanguage().isFallbackLanguage()) {
                doc._updateLanguage();
            }
        });
    }

    /**
     * @private
     * Update document
     */
    function _handleLanguageModified(event, language) {
        _.forEach(_openDocuments, function (doc, key) {
            var docLanguage = doc.getLanguage();
            // A modified language can affect a document
            // - if its language was modified
            // - if the document doesn't have a language yet and its file extension was added to the modified language
            if (docLanguage === language || docLanguage.isFallbackLanguage()) {
                doc._updateLanguage();
            }
        });
    }
    
    // For compatibility
    $(DocumentModule)
        .on("_afterDocumentCreate", function (event, doc) {
            if (_openDocuments[doc.file.id]) {
                console.error("Document for this path already in _openDocuments!");
                return true;
            }

            _openDocuments[doc.file.id] = doc;
            $(exports).triggerHandler("afterDocumentCreate", doc);
        })
        .on("_beforeDocumentDelete", function (event, doc) {
            if (!_openDocuments[doc.file.id]) {
                console.error("Document with references was not in _openDocuments!");
                return true;
            }

            $(exports).triggerHandler("beforeDocumentDelete", doc);
            delete _openDocuments[doc.file.id];
        })
        .on("_documentRefreshed", function (event, doc) {
            $(exports).triggerHandler("documentRefreshed", doc);
        })
        .on("_dirtyFlagChange", function (event, doc) {
            $(exports).triggerHandler("dirtyFlagChange", doc);
            if (doc.isDirty) {
                addToWorkingSet(doc.file);
            }
        })
        .on("_documentSaved", function (event, doc) {
            $(exports).triggerHandler("documentSaved", doc);
        });
    
    // For unit tests and internal use only
    exports._clearCurrentDocument       = _clearCurrentDocument;
    
    // Define public API
    exports.Document                    = DocumentModule.Document;
    exports.getCurrentDocument          = getCurrentDocument;
    exports._clearCurrentDocument        = _clearCurrentDocument;
    exports.getDocumentForPath          = getDocumentForPath;
    exports.getOpenDocumentForPath      = getOpenDocumentForPath;
    exports.getDocumentText             = getDocumentText;
    exports.createUntitledDocument      = createUntitledDocument;
    exports.getWorkingSet               = getWorkingSet;
    exports.findInWorkingSet            = findInWorkingSet;
    exports.findInWorkingSetAddedOrder  = findInWorkingSetAddedOrder;
    exports.getAllOpenDocuments         = getAllOpenDocuments;
    exports.setCurrentDocument          = setCurrentDocument;
    exports.addToWorkingSet             = addToWorkingSet;
    exports.addListToWorkingSet         = addListToWorkingSet;
    exports.removeFromWorkingSet        = removeFromWorkingSet;
    exports.removeListFromWorkingSet    = removeListFromWorkingSet;
    exports.getNextPrevFile             = getNextPrevFile;
    exports.swapWorkingSetIndexes       = swapWorkingSetIndexes;
    exports.sortWorkingSet              = sortWorkingSet;
    exports.beginDocumentNavigation     = beginDocumentNavigation;
    exports.finalizeDocumentNavigation  = finalizeDocumentNavigation;
    exports.closeFullEditor             = closeFullEditor;
    exports.closeAll                    = closeAll;
    exports.notifyFileDeleted           = notifyFileDeleted;
    exports.notifyPathNameChanged       = notifyPathNameChanged;
    exports.notifyPathDeleted           = notifyPathDeleted;

    // Setup preferences
    _prefs = PreferencesManager.getPreferenceStorage(module);
    
    // Performance measurements
    PerfUtils.createPerfMeasurement("DOCUMENT_MANAGER_GET_DOCUMENT_FOR_PATH", "DocumentManager.getDocumentForPath()");

    // Handle project change events
    var $ProjectManager = $(ProjectManager);
    $ProjectManager.on("projectOpen", _projectOpen);
    $ProjectManager.on("beforeProjectClose beforeAppClose", _savePreferences);
    
    // Handle Language change events
    $(LanguageManager).on("languageAdded", _handleLanguageAdded);
    $(LanguageManager).on("languageModified", _handleLanguageModified);
});
