/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/**
 * DocumentManager maintains a list of currently 'open' Documents. The DocumentManager is responsible
 * for coordinating document operations and dispatching certain document events.
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
 * EditorManager. A Document only gets a backing Editor if it opened in an editor.
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
 * NOTE: WorkingSet APIs have been deprecated and have moved to MainViewManager as WorkingSet APIs
 *       Some WorkingSet APIs that have been identified as being used by 3rd party extensions will
 *       emit deprecation warnings and call the WorkingSet APIS to maintain backwards compatibility
 *
 *    - currentDocumentChange -- Deprecated: use EditorManager activeEditorChange (which covers all editors,
 *      not just full-sized editors) or MainViewManager currentFileChange (which covers full-sized views
 *      only, but is also triggered for non-editor views e.g. image files).
 *
 *    - fileNameChange -- When the name of a file or folder has changed. The 2nd arg is the old name.
 *      The 3rd arg is the new name.  Generally, however, file objects have already been changed by the
 *      time this event is dispatched so code that relies on matching the filename to a file object
 *      will need to compare the newname.
 *
 *    - pathDeleted -- When a file or folder has been deleted. The 2nd arg is the path that was deleted.
 *
 * To listen for events, do something like this: (see EventDispatcher for details on this pattern)
 *    DocumentManager.on("eventname", handler);
 *
 * Document objects themselves also dispatch some events - see Document docs for details.
 */
define(function (require, exports, module) {
    "use strict";

    var _ = require("thirdparty/lodash");

    var AppInit             = require("utils/AppInit"),
        EventDispatcher     = require("utils/EventDispatcher"),
        DocumentModule      = require("document/Document"),
        DeprecationWarning  = require("utils/DeprecationWarning"),
        MainViewManager     = require("view/MainViewManager"),
        MainViewFactory     = require("view/MainViewFactory"),
        FileSyncManager     = require("project/FileSyncManager"),
        FileSystem          = require("filesystem/FileSystem"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        FileUtils           = require("file/FileUtils"),
        InMemoryFile        = require("document/InMemoryFile"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        PerfUtils           = require("utils/PerfUtils"),
        LanguageManager     = require("language/LanguageManager"),
        Strings             = require("strings");


    /**
     * @private
     * Random path prefix for untitled documents
     */
    var _untitledDocumentPath = "/_brackets_" + _.random(10000000, 99999999);

    /**
     * All documents with refCount > 0. Maps Document.file.id -> Document.
     * @private
     * @type {Object.<string, Document>}
     */
    var _openDocuments = {};

    /**
     * Returns the existing open Document for the given file, or null if the file is not open ('open'
     * means referenced by the UI somewhere). If you will hang onto the Document, you must addRef()
     * it; see {@link #getDocumentForPath} for details.
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
     * Returns the Document that is currently open in the editor UI. May be null.
     * @return {?Document}
     */
    function getCurrentDocument() {
        var file = MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE);

        if (file) {
            return getOpenDocumentForPath(file.fullPath);
        }

        return null;
    }


    /**
     * Returns a list of items in the working set in UI list order. May be 0-length, but never null.
     * @deprecated Use MainViewManager.getWorkingSet() instead
     * @return {Array.<File>}
     */
    function getWorkingSet() {
        DeprecationWarning.deprecationWarning("Use MainViewManager.getWorkingSet() instead of DocumentManager.getWorkingSet()", true);
        return MainViewManager.getWorkingSet(MainViewManager.ALL_PANES)
            .filter(function (file) {
                // Legacy didn't allow for files with custom viewers
                return !MainViewFactory.findSuitableFactoryForPath(file.fullPath);
            });
    }

    /**
     * Returns the index of the file matching fullPath in the working set.
     * @deprecated Use MainViewManager.findInWorkingSet() instead
     * @param {!string} fullPath
     * @return {number} index, -1 if not found
     */
    function findInWorkingSet(fullPath) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.findInWorkingSet() instead of DocumentManager.findInWorkingSet()", true);
        return MainViewManager.findInWorkingSet(MainViewManager.ACTIVE_PANE, fullPath);
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
     * Adds the given file to the end of the working set list.
     * @deprecated Use MainViewManager.addToWorkingSet() instead
     * @param {!File} file
     * @param {number=} index  Position to add to list (defaults to last); -1 is ignored
     * @param {boolean=} forceRedraw  If true, a working set change notification is always sent
     *    (useful if suppressRedraw was used with removeFromWorkingSet() earlier)
     */
    function addToWorkingSet(file, index, forceRedraw) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.addToWorkingSet() instead of DocumentManager.addToWorkingSet()", true);
        MainViewManager.addToWorkingSet(MainViewManager.ACTIVE_PANE, file, index, forceRedraw);
    }

    /**
     * @deprecated Use MainViewManager.addListToWorkingSet() instead
     * Adds the given file list to the end of the working set list.
     * If a file in the list has its own custom viewer, then it
     * is not added into the working set.
     * Does not change which document is currently open in the editor.
     * More efficient than calling addToWorkingSet() (in a loop) for
     * a list of files because there's only 1 redraw at the end
     * @param {!Array.<File>} fileList
     */
    function addListToWorkingSet(fileList) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.addListToWorkingSet() instead of DocumentManager.addListToWorkingSet()", true);
        MainViewManager.addListToWorkingSet(MainViewManager.ACTIVE_PANE, fileList);
    }


    /**
     * closes a list of files
     * @deprecated Use CommandManager.execute(Commands.FILE_CLOSE_LIST) instead
     * @param {!Array.<File>} list - list of File objectgs to close
     */
    function removeListFromWorkingSet(list) {
        DeprecationWarning.deprecationWarning("Use CommandManager.execute(Commands.FILE_CLOSE_LIST, {PaneId: MainViewManager.ALL_PANES, fileList: list}) instead of DocumentManager.removeListFromWorkingSet()", true);
        CommandManager.execute(Commands.FILE_CLOSE_LIST, {PaneId: MainViewManager.ALL_PANES, fileList: list});
    }

    /**
     * closes all open files
     * @deprecated CommandManager.execute(Commands.FILE_CLOSE_ALL) instead
     */
    function closeAll() {
        DeprecationWarning.deprecationWarning("Use CommandManager.execute(Commands.FILE_CLOSE_ALL,{PaneId: MainViewManager.ALL_PANES}) instead of DocumentManager.closeAll()", true);
        CommandManager.execute(Commands.FILE_CLOSE_ALL, {PaneId: MainViewManager.ALL_PANES});
    }

    /**
     * closes the specified file file
     * @deprecated use CommandManager.execute(Commands.FILE_CLOSE, {File: file}) instead
     * @param {!File} file - the file to close
     */
    function closeFullEditor(file) {
        DeprecationWarning.deprecationWarning("Use CommandManager.execute(Commands.FILE_CLOSE, {File: file} instead of DocumentManager.closeFullEditor()", true);
        CommandManager.execute(Commands.FILE_CLOSE, {File: file});
    }

    /**
     * opens the specified document for editing in the currently active pane
     * @deprecated use CommandManager.execute(Commands.CMD_OPEN, {fullPath: doc.file.fullPath}) instead
     * @param {!Document} document  The Document to make current.
     */
    function setCurrentDocument(doc) {
        DeprecationWarning.deprecationWarning("Use CommandManager.execute(Commands.CMD_OPEN) instead of DocumentManager.setCurrentDocument()", true);
        CommandManager.execute(Commands.CMD_OPEN, {fullPath: doc.file.fullPath});
    }


    /**
     * freezes the Working Set MRU list
     * @deprecated use MainViewManager.beginTraversal() instead
     */
    function beginDocumentNavigation() {
        DeprecationWarning.deprecationWarning("Use MainViewManager.beginTraversal() instead of DocumentManager.beginDocumentNavigation()", true);
        MainViewManager.beginTraversal();
    }

    /**
     * ends document navigation and moves the current file to the front of the MRU list in the Working Set
     * @deprecated use MainViewManager.endTraversal() instead
     */
    function finalizeDocumentNavigation() {
        DeprecationWarning.deprecationWarning("Use MainViewManager.endTraversal() instead of DocumentManager.finalizeDocumentNavigation()", true);
        MainViewManager.endTraversal();
    }

    /**
     * Get the next or previous file in the working set, in MRU order (relative to currentDocument). May
     * return currentDocument itself if working set is length 1.
     * @deprecated use MainViewManager.traverseToNextViewByMRU() instead
     */
    function getNextPrevFile(inc) {
        DeprecationWarning.deprecationWarning("Use MainViewManager.traverseToNextViewByMRU() instead of DocumentManager.getNextPrevFile()", true);
        var result = MainViewManager.traverseToNextViewByMRU(inc);
        if (result) {
            return result.file;
        }
        return null;
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
                MainViewManager._destroyEditorIfNotNeeded(doc);
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
     * @param {!File} file The file to get the text for.
     * @param {boolean=} checkLineEndings Whether to return line ending information. Default false (slightly more efficient).
     * @return {$.Promise}
     *     A promise that is resolved with three parameters:
     *          contents - string: the document's text
     *          timestamp - Date: the last time the document was changed on disk (might not be the same as the last time it was changed in memory)
     *          lineEndings - string: the original line endings of the file, one of the FileUtils.LINE_ENDINGS_* constants;
     *              will be null if checkLineEndings was false.
     *     or rejected with a filesystem error.
     */
    function getDocumentText(file, checkLineEndings) {
        var result = new $.Deferred(),
            doc = getOpenDocumentForPath(file.fullPath);
        if (doc) {
            result.resolve(doc.getText(), doc.diskTimestamp, checkLineEndings ? doc._lineEndings : null);
        } else {
            file.read(function (err, contents, stat) {
                if (err) {
                    result.reject(err);
                } else {
                    // Normalize line endings the same way Document would, but don't actually
                    // new up a Document (which entails a bunch of object churn).
                    var originalLineEndings = checkLineEndings ? FileUtils.sniffLineEndings(contents) : null;
                    contents = DocumentModule.Document.normalizeText(contents);
                    result.resolve(contents, stat.mtime, originalLineEndings);
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

        FileSystem.addEntryForPathIfRequired(file, fullPath);

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
     * NOTE: This function is not for general consumption, is considered private and may be deprecated
     *        without warning in a future release.
     *
     * @param {!File} file
     */
    function notifyFileDeleted(file) {
        // Notify all editors to close as well
        exports.trigger("pathDeleted", file.fullPath);

        var doc = getOpenDocumentForPath(file.fullPath);

        if (doc) {
            doc.trigger("deleted");
        }

        // At this point, all those other views SHOULD have released the Doc
        if (doc && doc._refCount > 0) {
            console.warn("Deleted " + file.fullPath + " Document still has " + doc._refCount + " references. Did someone addRef() without listening for 'deleted'?");
        }
    }

    /**
     * Called after a file or folder has been deleted. This function is responsible
     * for updating underlying model data and notifying all views of the change.
     *
     * @param {string} fullPath The path of the file/folder that has been deleted
     */
    function notifyPathDeleted(fullPath) {
        // FileSyncManager.syncOpenDocuments() does all the work prompting
        //  the user to save any unsaved changes and then calls us back
        //  via notifyFileDeleted
        FileSyncManager.syncOpenDocuments(Strings.FILE_DELETED_TITLE);

        if (!getOpenDocumentForPath(fullPath) &&
                !MainViewManager.findInAllWorkingSets(fullPath).length) {
            // For images not open in the workingset,
            // FileSyncManager.syncOpenDocuments() will
            //  not tell us to close those views
            exports.trigger("pathDeleted", fullPath);
        }
    }

    /**
     * Called after a file or folder name has changed. This function is responsible
     * for updating underlying model data and notifying all views of the change.
     *
     * @param {string} oldName The old name of the file/folder
     * @param {string} newName The new name of the file/folder
     */
    function notifyPathNameChanged(oldName, newName) {
        // Notify all open documents
        _.forEach(_openDocuments, function (doc) {
            // TODO: Only notify affected documents? For now _notifyFilePathChange
            // just updates the language if the extension changed, so it's fine
            // to call for all open docs.
            doc._notifyFilePathChanged();
        });

        // Send a "fileNameChange" event. This will trigger the views to update.
        exports.trigger("fileNameChange", oldName, newName);
    }


    /**
     * @private
     * Update document
     */
    function _handleLanguageAdded() {
        _.forEach(_openDocuments, function (doc) {
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
        _.forEach(_openDocuments, function (doc) {
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
    DocumentModule
        .on("_afterDocumentCreate", function (event, doc) {
            if (_openDocuments[doc.file.id]) {
                console.error("Document for this path already in _openDocuments!");
                return true;
            }

            _openDocuments[doc.file.id] = doc;
            exports.trigger("afterDocumentCreate", doc);
        })
        .on("_beforeDocumentDelete", function (event, doc) {
            if (!_openDocuments[doc.file.id]) {
                console.error("Document with references was not in _openDocuments!");
                return true;
            }

            exports.trigger("beforeDocumentDelete", doc);
            delete _openDocuments[doc.file.id];
        })
        .on("_documentRefreshed", function (event, doc) {
            exports.trigger("documentRefreshed", doc);
        })
        .on("_dirtyFlagChange", function (event, doc) {
            // Modules listening on the doc instance notified about dirtyflag change
            // To be used internally by Editor
            doc.trigger("_dirtyFlagChange", doc);
            exports.trigger("dirtyFlagChange", doc);
            if (doc.isDirty) {
                MainViewManager.addToWorkingSet(MainViewManager.ACTIVE_PANE, doc.file);

                // We just dirtied a doc and added it to the active working set
                //  this may have come from an internal dirtying so if it was
                //  added to a working set that had no active document then
                //  open the document
                //
                // See: https://github.com/adobe/brackets/issues/9569
                //
                // NOTE: Adding a file to the active working set may not actually add
                //       it to the active working set (e.g. the document was already
                //       opened to the inactive working set.)
                //
                //       Check that it was actually added to the active working set

                if (!MainViewManager.getCurrentlyViewedFile() &&
                        MainViewManager.findInWorkingSet(MainViewManager.ACTIVE_PANE, doc.file.fullPath) !== -1) {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: doc.file.fullPath});
                }
            }
        })
        .on("_documentSaved", function (event, doc) {
            exports.trigger("documentSaved", doc);
        });

    // Set up event dispatch
    EventDispatcher.makeEventDispatcher(exports);

    // This deprecated event is dispatched manually from "currentFileChange" below
    EventDispatcher.markDeprecated(exports, "currentDocumentChange", "MainViewManager.currentFileChange");

    // These deprecated events are automatically dispatched by DeprecationWarning, set up in AppInit.extensionsLoaded()
    EventDispatcher.markDeprecated(exports, "workingSetAdd",        "MainViewManager.workingSetAdd");
    EventDispatcher.markDeprecated(exports, "workingSetAddList",    "MainViewManager.workingSetAddList");
    EventDispatcher.markDeprecated(exports, "workingSetRemove",     "MainViewManager.workingSetRemove");
    EventDispatcher.markDeprecated(exports, "workingSetRemoveList", "MainViewManager.workingSetRemoveList");
    EventDispatcher.markDeprecated(exports, "workingSetSort",       "MainViewManager.workingSetSort");

    /*
     * After extensionsLoaded, register the proxying listeners that convert newer events to
     * deprecated events. This ensures that extension listeners still run later than core
     * listeners. If we registered these proxies earlier, extensions would get the deprecated
     * event before some core listeners may have run, which could cause bugs (e.g. WorkingSetView
     * needs to process these events before the Extension Highlighter extension).
     */
    AppInit.extensionsLoaded(function () {
        // Listens for the given event on MainViewManager, and triggers a copy of the event
        // on DocumentManager whenever it occurs
        function _proxyDeprecatedEvent(eventName) {
            DeprecationWarning.deprecateEvent(exports,
                                              MainViewManager,
                                              eventName,
                                              eventName,
                                              "DocumentManager." + eventName,
                                              "MainViewManager." + eventName);
        }
        _proxyDeprecatedEvent("workingSetAdd");
        _proxyDeprecatedEvent("workingSetAddList");
        _proxyDeprecatedEvent("workingSetRemove");
        _proxyDeprecatedEvent("workingSetRemoveList");
        _proxyDeprecatedEvent("workingSetSort");
    });

    // Handle file saves that may affect preferences
    exports.on("documentSaved", function (e, doc) {
        PreferencesManager.fileChanged(doc.file.fullPath);
    });

    MainViewManager.on("currentFileChange", function (e, newFile, newPaneId, oldFile) {
        var newDoc = null,
            oldDoc = null;

        if (newFile) {
            newDoc = getOpenDocumentForPath(newFile.fullPath);
        }

        if (oldFile) {
            oldDoc = getOpenDocumentForPath(oldFile.fullPath);
        }

        if (oldDoc) {
            oldDoc.off("languageChanged.DocumentManager");
        }

        if (newDoc) {
            PreferencesManager._setCurrentLanguage(newDoc.getLanguage().getId());
            newDoc.on("languageChanged.DocumentManager", function (e, oldLang, newLang) {
                PreferencesManager._setCurrentLanguage(newLang.getId());
                exports.trigger("currentDocumentLanguageChanged", [oldLang, newLang]);
            });
        } else {
            PreferencesManager._setCurrentLanguage(undefined);
        }

        if (newDoc !== oldDoc) {
            // Dispatch deprecated event with doc args (not File args as the new event uses)
            exports.trigger("currentDocumentChange", newDoc, oldDoc);
        }

    });

    // Deprecated APIs
    exports.getWorkingSet                  = getWorkingSet;
    exports.findInWorkingSet               = findInWorkingSet;
    exports.addToWorkingSet                = addToWorkingSet;
    exports.addListToWorkingSet            = addListToWorkingSet;
    exports.removeListFromWorkingSet       = removeListFromWorkingSet;
    exports.getCurrentDocument             = getCurrentDocument;
    exports.beginDocumentNavigation        = beginDocumentNavigation;
    exports.finalizeDocumentNavigation     = finalizeDocumentNavigation;
    exports.getNextPrevFile                = getNextPrevFile;
    exports.setCurrentDocument             = setCurrentDocument;
    exports.closeFullEditor                = closeFullEditor;
    exports.closeAll                       = closeAll;

    // Define public API
    exports.Document                    = DocumentModule.Document;
    exports.getDocumentForPath          = getDocumentForPath;
    exports.getOpenDocumentForPath      = getOpenDocumentForPath;
    exports.getDocumentText             = getDocumentText;
    exports.createUntitledDocument      = createUntitledDocument;
    exports.getAllOpenDocuments         = getAllOpenDocuments;

    // For internal use only
    exports.notifyPathNameChanged       = notifyPathNameChanged;
    exports.notifyPathDeleted           = notifyPathDeleted;
    exports.notifyFileDeleted           = notifyFileDeleted;

    // Performance measurements
    PerfUtils.createPerfMeasurement("DOCUMENT_MANAGER_GET_DOCUMENT_FOR_PATH", "DocumentManager.getDocumentForPath()");

    // Handle Language change events
    LanguageManager.on("languageAdded", _handleLanguageAdded);
    LanguageManager.on("languageModified", _handleLanguageModified);
});
