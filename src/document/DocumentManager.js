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
 * DocumentManager maintains a list of currently 'open' Documents. The DocumentManager is responsible 
 * manifesting documents into the editor, closing documents and coordinating document operations and 
 * dispatching certain document events.
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
 * NOTE: WorkingSet APIs have been deprecated and have moved to MainViewManager as PaneViewList APIs
 *       Some WorkingSet APIs that have been identified as being used by 3rd party extensions will
 *       emit deprecation warnings and call the PaneViewList APIS to maintain backwards compatibility
 *
 *    - currentDocumentChange -- This is being deprecated and is currently ony used as a shim to assist 
 *      the document open process so that the editor will actually open or close the desired document. 
 *      This will change accordingly once work begins to refactor EditorManager to be a view provider
 *      and open documents directly.
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
    
    var AppInit                 = require("utils/AppInit"),
        DocumentModule      = require("document/Document"),
        DeprecationWarning  = require("utils/DeprecationWarning"),
        MainViewManager     = require("view/MainViewManager"),
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
     * Random path prefix for untitled documents
     */
    var _untitledDocumentPath = "/_brackets_" + _.random(10000000, 99999999);

  
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
     * Creates a deprecation warning event handler
     * @param {!string} the event being deprecated
     * @param {!string} the new event to use
     */
    function _deprecateEvent(oldEventName, newEventName) {
        DeprecationWarning.deprecateEvent(exports,
                                          MainViewManager,
                                          oldEventName,
                                          newEventName,
                                          "DocumentManager." + oldEventName,
                                          "MainViewManager." + newEventName);
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
        
        if (!fullPath) {
            return null;
        }
        
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
     * [shim] Returns a document open for the currently focused pane's editor
     * @return {?Document}
     */
    function _getCurrentDocument() {
        // using getCurrentFullEditor() will return the editor whether it has focus or not
        //      this doesn't work in scenarios where you want the active editor's document
        //      even though it does not have focus (such as when clicking on another element (toolbar, menu, etc...)
        //      So we'll have to do revise this to call
        //          MainViewManager.getTargetPane().getCurrentFullEditor().getDocument()
        return getOpenDocumentForPath(EditorManager.getCurrentlyViewedPath());
    }

    /**
     * Returns the Document that is currently open in the editor UI. May be null.
     * @return {?Document}
     */
    function getCurrentDocument() {
        // NOTE: This will eventually be deprecated and a deprecation warning will be added here
        //          the shim _getCurrentDocument() is being used because the MainViewManager has
        //          not been fully fleshed out to support a method for getting the current
        //          editor. Once that has been done then the instances of getCurrentDocument in
        //          Brackets will change to use that API and this function will emit a deprecation
        //          warning for extensions still using DocumentManager.getCurrentDocument();
        return _getCurrentDocument();
    }

    
    
    /**
     * [shim] Clears the current document.  This is usually in response to a close all command
     *         or close current document when there are no other documents left to open. This
     */
    function clearCurrentDocument() {
        // Change model & dispatch event
        var previousDocument = _getCurrentDocument();

        if (!previousDocument) {
            return;
        }
        
        // (this event triggers EditorManager to actually clear the editor UI)
        $(exports).triggerHandler("currentDocumentChange", [null, previousDocument]);
    }
    
    /**
     * deprecated Use MainViewManager.getPaneViewList() instead
     * Returns a list of items in the working set in UI list order. May be 0-length, but never null.
     * @return {Array.<File>}
     */
    function getWorkingSet() {
        DeprecationWarning.deprecationWarning("Use MainViewManager.getPaneViewList() instead of DocumentManager.getWorkingSet()", true);
        return MainViewManager.getPaneViewList(MainViewManager.FOCUSED_PANE);
    }

    /**
     * deprecated Use MainViewManager.findInPaneViewList() instead
     * Returns the index of the file matching fullPath in the working set.
     * Returns -1 if not found.
     * @param {!string} fullPath
     * @param {Array.<File>=} list Pass this arg to search a different array of files. Internal
     *          use only.
     * @return {number} index
     */
    function findInWorkingSet(fullPath, list) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.findInPaneViewList() instead of DocumentManager.findInWorkingSet()", true);
        if (list) {
            DeprecationWarning.deprecationWarning("DocumentManager.findInWorkingSet() no longer supports an arbitrary array", true);
            return [];
        }
        return MainViewManager.findInPaneViewList(MainViewManager.ALL_PANES, fullPath);
    }
    
    /**
     * deprecated Use MainViewManager.removeListFromPaneViewList() instead
     * Removes a list of files from the working set
     * @param {Array.<File>=} list Pass this arg to search a different array of files. Internal
     *          use only.
     * @param {boolean=} true to close the current document too [deprecated]
     */
    function removeListFromWorkingSet(list, clearCurrentDocument) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.removeListFromPaneViewList() instead of DocumentManager.removeListFromWorkingSet()", true);

        if (!list) {
            return;
        }
        
        if (clearCurrentDocument) {
            DeprecationWarning.deprecationWarning("clearCurrentDocument is not a supported option for MainViewManager.removeListFromPaneViewList() Use DocumentManager.clearCurrentDocument() instead", true);
            clearCurrentDocument();
        }
        
        MainViewManager.removeListFromPaneViewList(MainViewManager.FOCUSED_PANE, list);
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
     * deprecated Use MainViewManager.addToPaneViewList() instead 
     * Adds the given file to the end of the working set list, if it is not 
     * already in the list and it does not have a custom viewer.
     * Does not change which document is currently open in the editor. Completes synchronously.
     * @param {!File} file
     * @param {number=} index  Position to add to list (defaults to last); -1 is ignored
     * @param {boolean=} forceRedraw  If true, a working set change notification is always sent
     *    (useful if suppressRedraw was used with removeFromWorkingSet() earlier)
     */
    function addToWorkingSet(file, index, forceRedraw) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.addToPaneViewList() instead of DocumentManager.addToWorkingSet()", true);
        MainViewManager.addToPaneViewList(MainViewManager.FOCUSED_PANE, file, index, forceRedraw);
    }
    
    /**
     * deprecated Use MainViewManager.addListToPaneViewList() instead 
     * Adds the given file list to the end of the working set list.
     * If a file in the list has its own custom viewer, then it 
     * is not added into the working set.
     * Does not change which document is currently open in the editor.
     * More efficient than calling addToWorkingSet() (in a loop) for
     * a list of files because there's only 1 redraw at the end
     * @param {!Array.<File>} fileList
     */
    function addListToWorkingSet(fileList) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.addListToPaneViewList() instead of DocumentManager.addListToWorkingSet()", true);
        MainViewManager.addListToPaneViewList(MainViewManager.FOCUSED_PANE, fileList);
    }

    /**
     * deprecated Use MainViewManager.removeFromPaneViewList() instead 
     * Warning: low level API - use FILE_CLOSE command in most cases.
     * Removes the given file from the working set list, if it was in the list. Does not change
     * the current editor even if it's for this file. Does not prompt for unsaved changes.
     * @param {!File} file
     * @param {boolean=} true to suppress redraw after removal
     */
    function removeFromWorkingSet(file, suppressRedraw) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.removeFromPaneViewList() instead of DocumentManager.removeFromWorkingSet()", true);
        MainViewManager.removeFromPaneViewList(MainViewManager.FOCUSED_PANE, file, suppressRedraw);
    }
    

    /**
     * Moves document to the front of the MRU list, IF it's in the working set; no-op otherwise.
     * @param {!Document}
     */
    function _markMostRecent(doc) {
        MainViewManager.makePaneViewMostRecent(MainViewManager.FOCUSED_PANE, doc.file);
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
            
            _markMostRecent(_getCurrentDocument());
        }
    }
    
    
    /**
     * Get the next or previous file in the working set, in MRU order (relative to currentDocument). May
     * return currentDocument itself if working set is length 1.
     * @param {number} inc  -1 for previous, +1 for next; no other values allowed
     * @return {?File}  null if working set empty
     */
    function getNextPrevFile(inc) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.traversePaneViewListByMRU() instead of DocumentManager.getNextPrevFile()", true);
        return MainViewManager.traversePaneViewListByMRU(MainViewManager.FOCUSED_PANE, inc);
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
        var currentDocument = _getCurrentDocument();
        
        // If this doc is already current, do nothing
        if (currentDocument === doc) {
            return;
        }

        var perfTimerName = PerfUtils.markStart("setCurrentDocument:\t" + doc.file.fullPath);
        
        // If file is untitled or otherwise not within project tree, add it to
        // working set right now (don't wait for it to become dirty)
        if (doc.isUntitled() || !ProjectManager.isWithinProject(doc.file.fullPath)) {
            MainViewManager.addToPaneViewList(MainViewManager.FOCUSED_PANE, doc.file);
        }
        
        
        // (this event triggers EditorManager to actually switch editors in the UI)
        $(exports).triggerHandler("currentDocumentChange", [doc, currentDocument]);

        // Adjust MRU working set ordering (except while in the middle of a Ctrl+Tab sequence)
        if (!_documentNavPending) {
            _markMostRecent(doc);
        }
        PerfUtils.addMeasurement(perfTimerName);
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
        var currentDocument = _getCurrentDocument();
        if (currentDocument && currentDocument.file.fullPath === file.fullPath) {
            // Get next most recent doc in the MRU order
            var nextFile = MainViewManager.traversePaneViewListByMRU(MainViewManager.FOCUSED_PANE, 1);
            if (nextFile && nextFile.fullPath === currentDocument.file.fullPath) {
                // getNextPrevFile() might return the file we're about to close if it's the only one open (due to wraparound)
                nextFile = null;
            }
            
            // Switch editor to next document (or blank it out)
            if (nextFile && !skipAutoSelect) {
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: nextFile.fullPath })
                    .fail(function () {
                        // File chosen to be switched to could not be opened, and the original file
                        // is still in editor. Close it again so code will try to open the next file,
                        // or empty the editor if there are no other files.
                        closeFullEditor(file);
                    });
            } else {
                clearCurrentDocument();
            }
        }
        
        // Remove closed doc from working set, if it was in there
        // This happens regardless of whether the document being closed was the current one or not
        MainViewManager.removeFromPaneViewList(MainViewManager.FOCUSED_PANE, file);
        
        // Note: EditorManager will dispose the closed document's now-unneeded editor either in
        // response to the editor-swap call above, or the removeFromWorkingSet() call, depending on
        // circumstances. See notes in EditorManager for more.
    }

    /**
     * Equivalent to calling closeFullEditor() for all Documents. Same caveat: this discards any
     * unsaved changes, so the UI should confirm with the user before calling this.
     */
    function closeAll() {
        clearCurrentDocument();
        MainViewManager.removeAllFromPaneViewList(MainViewManager.ALL_PANES);
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
        if (getCurrentDocument()) {
            /* FileSyncManager.syncOpenDocuments() does all the work of closing files
               in the working set and notifying the user of any unsaved changes. */
            FileSyncManager.syncOpenDocuments(Strings.FILE_DELETED_TITLE);

            // Send a "pathDeleted" event. This will trigger the views to update.
            $(exports).triggerHandler("pathDeleted", path);
        } else {
            MainViewManager.notifyPathDeleted(path);
        }
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
                MainViewManager.addToPaneViewList(MainViewManager.FOCUSED_PANE, doc.file);
            }
        })
        .on("_documentSaved", function (event, doc) {
            $(exports).triggerHandler("documentSaved", doc);
        });
    
    /**
     * @private
     * Examine each preference key for migration of the working set files.
     * If the key has a prefix of "files_/", then it is a working set files 
     * preference from old preference model.
     *
     * @param {string} key The key of the preference to be examined
     *      for migration of working set files.
     * @return {?string} - the scope to which the preference is to be migrated
     */
    function _checkPreferencePrefix(key) {
        var pathPrefix = "files_";
        if (key.indexOf(pathPrefix) === 0) {
            // Get the project path from the old preference key by stripping "files_".
            var projectPath = key.substr(pathPrefix.length);
            return "user project.files " + projectPath;
        }
        
        return null;
    }

    /* 
     * Setup an appReady handler to register deprecated events.  
     * We do this so these events are added to the end of the event
     * handler chain which gives the system a chance to process them
     * before they are dispatched to extensions.  
     * 
     * Extensions that listen to the new event (paneViewXXX events) are 
     * always added to the end so this effectively puts the legacy events 
     * at the end of the event list. This prevents extensiosn from 
     * handling the event too soon. (e.g.  paneViewListView needs to 
     * process these events before the Extension Highlighter extension)
     */
    AppInit.appReady(function () {
        _deprecateEvent("workingSetAdd",         "paneViewListAdd");
        _deprecateEvent("workingSetAddList",     "paneViewListAddList");
        _deprecateEvent("workingSetRemove",      "paneViewListRemove");
        _deprecateEvent("workingSetRemoveList",  "paneViewListRemoveList");
        _deprecateEvent("workingSetSort",        "paneViewListSort");
    });
    
    PreferencesManager.convertPreferences(module, {"files_": "user"}, true, _checkPreferencePrefix);

    // Handle file saves that may affect preferences
    $(exports).on("documentSaved", function (e, doc) {
        PreferencesManager.fileChanged(doc.file.fullPath);
    });
    
    // For unit tests and internal use only
    exports.clearCurrentDocument           = clearCurrentDocument;
   
    // Deprecated APIs   
    exports.getWorkingSet                  = getWorkingSet;
    exports.findInWorkingSet               = findInWorkingSet;
    exports.addListToWorkingSet            = addListToWorkingSet;
    exports.removeFromWorkingSet           = removeFromWorkingSet;
    exports.removeListFromWorkingSet       = removeListFromWorkingSet;
    exports.getNextPrevFile                = getNextPrevFile;
    exports.getCurrentDocument             = getCurrentDocument;
       
   
    // Define public API   
    exports.Document                       = DocumentModule.Document;
    exports.getDocumentForPath             = getDocumentForPath;
    exports.getOpenDocumentForPath         = getOpenDocumentForPath;
    exports.getDocumentText                = getDocumentText;
    exports.createUntitledDocument         = createUntitledDocument;
    exports.getAllOpenDocuments            = getAllOpenDocuments;
    exports.setCurrentDocument             = setCurrentDocument;
    exports.beginDocumentNavigation        = beginDocumentNavigation;
    exports.finalizeDocumentNavigation     = finalizeDocumentNavigation;
    exports.closeFullEditor                = closeFullEditor;
    exports.closeAll                       = closeAll;
    exports.notifyFileDeleted              = notifyFileDeleted;
    exports.notifyPathNameChanged          = notifyPathNameChanged;
    exports.notifyPathDeleted              = notifyPathDeleted;

    // Performance measurements
    PerfUtils.createPerfMeasurement("DOCUMENT_MANAGER_GET_DOCUMENT_FOR_PATH", "DocumentManager.getDocumentForPath()");

    // Handle Language change events
    $(LanguageManager).on("languageAdded", _handleLanguageAdded);
    $(LanguageManager).on("languageModified", _handleLanguageModified);
});
