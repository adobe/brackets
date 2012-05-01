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
/*global define, $, brackets, FileError */

/**
 * FileSyncManager is a set of utilities to help track external modifications to the files and folders
 * in the currently open project.
 *
 * Currently, we look for external changes purely by checking file timestamps against the last-sync
 * timestamp recorded on Document. Later, we will use actual native directory-watching callbacks
 * instead.
 *
 * FUTURE: Whenever we have a 'project file tree model,' we should manipulate that instead of notifying
 * DocumentManager directly. DocumentManager, the tree UI, etc. then all listen to that model for changes.
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var ProjectManager      = require("project/ProjectManager"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        Commands            = require("command/Commands"),
        CommandManager      = require("command/CommandManager"),
        Async               = require("utils/Async"),
        Dialogs             = require("widgets/Dialogs"),
        Strings             = require("strings"),
        FileUtils           = require("file/FileUtils");

    
    /**
     * Guard to spot re-entrancy while syncOpenDocuments() is still in progress
     * @type {boolean}
     */
    var _alreadyChecking = false;
    
    /**
     * If true, we should bail from the syncOpenDocuments() process and then re-run it. See
     * comments in syncOpenDocuments() for how this works.
     * @type {boolean}
     */
    var _restartPending = false;
    
    /** @type {Array.<Document>} */
    var toReload;
    /** @type {Array.<Document>} */
    var toClose;
    /** @type {Array.<Document>} */
    var editConflicts;
    /** @type {Array.<Document>} */
    var deleteConflicts;
    
    
    /**
     * Scans all the given Documents for changes on disk, and sorts them into four buckets,
     * populating the corresponding arrays:
     *  toReload        - changed on disk; unchanged within Brackets
     *  toClose         - deleted on disk; unchanged within Brackets
     *  editConflicts   - changed on disk; also dirty in Brackets
     *  deleteConflicts - deleted on disk; also dirty in Brackets
     *
     * @param {!Array.<Document>} docs
     * @return {$.Promise}  Resolved when all scanning done, or rejected immediately if there's any
     *      error while reading file timestamps. Errors are logged but no UI is shown.
     */
    function findExternalChanges(docs) {

        toReload = [];
        toClose = [];
        editConflicts = [];
        deleteConflicts = [];
    
        function checkDoc(doc) {
            var result = new $.Deferred();
            
            // Check file timestamp / existence
            doc.file.getMetadata(
                function (metadata) {
                    // Does file's timestamp differ from last sync time on the Document?
                    if (metadata.modificationTime.getTime() !== doc.diskTimestamp.getTime()) {
                        if (doc.isDirty) {
                            editConflicts.push(doc);
                        } else {
                            toReload.push(doc);
                        }
                    }
                    result.resolve();
                },
                function (error) {
                    // File has been deleted externally
                    if (error.code === FileError.NOT_FOUND_ERR) {
                        if (doc.isDirty) {
                            deleteConflicts.push(doc);
                        } else {
                            toClose.push(doc);
                        }
                        result.resolve();
                    } else {
                        // Some other error fetching metadata: treat as a real error
                        console.log("Error checking modification status of " + doc.file.fullPath, error.code);
                        result.reject();
                    }
                }
            );
            return result.promise();
        }
        
        // Check all docs in parallel
        // (fail fast b/c we won't continue syncing if there was any error fetching timestamps)
        return Async.doInParallel(docs, checkDoc, true);
    }
    
    /**
     * Scans all the files in the working set that do not have Documents (and thus were not scanned
     * by findExternalChanges()). If any were deleted on disk, removes them from the working set.
     */
    function syncUnopenWorkingSet() {
        // We only care about working set entries that have never been open (have no Document).
        var unopenWorkingSetFiles = DocumentManager.getWorkingSet().filter(function (wsFile) {
            return !DocumentManager.getOpenDocumentForPath(wsFile.fullPath);
        });
        
        function checkWorkingSetFile(file) {
            var result = new $.Deferred();
            
            file.getMetadata(
                function (metadata) {
                    // File still exists
                    result.resolve();
                },
                function (error) {
                    // File has been deleted externally
                    if (error.code === FileError.NOT_FOUND_ERR) {
                        DocumentManager.notifyFileDeleted(file);
                        result.resolve();
                    } else {
                        // Some other error fetching metadata: treat as a real error
                        console.log("Error checking for deletion of " + file.fullPath, error.code);
                        result.reject();
                    }
                }
            );
            return result.promise();
        }
        
        // Check all these files in parallel
        return Async.doInParallel(unopenWorkingSetFiles, checkWorkingSetFile, false);
    }
    
    
    /**
     * Reloads the Document's contents from disk, discarding any unsaved changes in the editor.
     *
     * @param {!Document} doc
     * @return {$.Promise} Resolved after editor has been refreshed; rejected if unable to load the
     *      file's new content. Errors are logged but no UI is shown.
     */
    function reloadDoc(doc) {
        
        var promise = FileUtils.readAsText(doc.file);
        
        promise.done(function (text, readTimestamp) {
            doc.refreshText(text, readTimestamp);
        });
        promise.fail(function (error) {
            console.log("Error reloading contents of " + doc.file.fullPath, error.code);
        });
        return promise;
    }
    
    /**
     * Reloads all the documents in "toReload" silently (no prompts). The operations are all run
     * in parallel.
     * @return {$.Promise} Resolved/rejected after all reloads done; will be rejected if any one
     *      file's reload failed. Errors are logged (by reloadDoc()) but no UI is shown.
     */
    function reloadChangedDocs() {
        // Reload each doc in turn, and once all are (async) done, signal that we're done
        return Async.doInParallel(toReload, reloadDoc, false);
    }
    
    /**
     * @param {FileError} error
     * @param {!Document} doc
     * @return {$.Promise}
     */
    function showReloadError(error, doc) {
        return Dialogs.showModalDialog(
            Dialogs.DIALOG_ID_ERROR,
            Strings.ERROR_RELOADING_FILE_TITLE,
            Strings.format(
                Strings.ERROR_RELOADING_FILE,
                doc.file.fullPath,
                FileUtils.getFileErrorString(error.code)
            )
        );
    }
    
    
    /**
     * Closes all the documents in "toClose" silently (no prompts). Completes synchronously.
     */
    function closeDeletedDocs() {
        toClose.forEach(function (doc) {
            DocumentManager.notifyFileDeleted(doc.file);
        });
    }
    
    
    /**
     * Walks through all the documents in "editConflicts" & "deleteConflicts" and prompts the user
     * about each one. Processing is sequential: if the user chooses to reload a document, the next
     * prompt is not shown until after the reload has completed.
     *
     * @return {$.Promise} Resolved/rejected after all documents have been prompted and (if
     *      applicable) reloaded (and any resulting error UI has been dismissed). Rejected if any
     *      one reload failed.
     */
    function presentConflicts() {
        
        var allConflicts = editConflicts.concat(deleteConflicts);
        
        function presentConflict(doc, i) {
            var result = new $.Deferred(), promise = result.promise();
            
            // If window has been re-focused, skip all remaining conflicts so the sync can bail & restart
            if (_restartPending) {
                result.resolve();
                return promise;
            }
            
            var message;
            var dialogId;
            var toClose;
            
            // Prompt UI varies depending on whether the file on disk was modified vs. deleted
            if (i < editConflicts.length) {
                toClose = false;
                dialogId = Dialogs.DIALOG_ID_EXT_CHANGED;
                message = Strings.format(
                    Strings.EXT_MODIFIED_MESSAGE,
                    ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath)
                );
                
            } else {
                toClose = true;
                dialogId = Dialogs.DIALOG_ID_EXT_DELETED;
                message = Strings.format(
                    Strings.EXT_DELETED_MESSAGE,
                    ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath)
                );
            }
            
            Dialogs.showModalDialog(dialogId, Strings.EXT_MODIFIED_TITLE, message)
                .done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_DONTSAVE) {
                        if (toClose) {
                            // Discard - close all editors
                            DocumentManager.notifyFileDeleted(doc.file);
                            result.resolve();
                        } else {
                            // Discard - load changes from disk
                            reloadDoc(doc)
                                .done(function () {
                                    result.resolve();
                                })
                                .fail(function (error) {
                                    // Unable to load changed version from disk - show error UI
                                    showReloadError(error, doc)
                                        .always(function () {
                                            // After user dismisses, move on to next conflict prompt
                                            result.reject();
                                        });
                                });
                        }
                        
                    } else {
                        // Cancel - if user doesn't manually save or close, we'll prompt again next
                        // time window is reactivated;
                        // OR programmatically canceled due to _resetPending - we'll skip all
                        // remaining files in the conflicts list (see above)
                        result.resolve();
                    }
                });
            
            return promise;
        }
        
        // Begin walking through the conflicts, one at a time
        return Async.doSequentially(allConflicts, presentConflict, false);
    }
    
    
    
    /**
     * Check to see whether any open files have been modified by an external app since the last time
     * Brackets synced up with the copy on disk (either by loading or saving the file). For clean
     * files, we silently upate the editor automatically. For files with unsaved changes, we prompt
     * the user.
     */
    function syncOpenDocuments() {
        
        // We can become "re-entrant" if the user leaves & then returns to Brackets before we're
        // done -- easy if a prompt dialog is left open. Since the user may have left Brackets to
        // revert some of the disk changes, etc. we want to cancel the current sync and immediately
        // begin a new one. We let the orig sync run until the user-visible dialog phase, then
        // bail; if we're already there we programmatically close the dialog to bail right away.
        if (_alreadyChecking) {
            _restartPending = true;
            
            // Close dialog if it was open. This will 'unblock' presentConflict(), which bails back
            // to us immediately upon seeing _restartPending. We then restart the sync - see below
            Dialogs.cancelModalDialogIfOpen(Dialogs.DIALOG_ID_EXT_CHANGED);
            Dialogs.cancelModalDialogIfOpen(Dialogs.DIALOG_ID_EXT_DELETED);
            
            return;
        }
        
        _alreadyChecking = true;
        
        
        // Syncing proceeds in four phases:
        //  1) Check all open files for external modifications
        //  2) Check any other working set entries (that are not open) for deletion, and remove
        //     from working set if deleted
        //  3) Refresh all Documents that are clean (if file changed on disk)
        //  4) Close all Documents that are clean (if file deleted on disk)
        //  5) Prompt about any Documents that are dirty (if file changed/deleted on disk)
        // Each phase fully completes (asynchronously) before the next one begins.
        
        
        // 1) Check for external modifications
        var allDocs = DocumentManager.getAllOpenDocuments();
        
        findExternalChanges(allDocs)
            .done(function () {
                // 2) Check un-open working set entries for deletion (& "close" if needed)
                syncUnopenWorkingSet()
                    .always(function () {
                        // If we were unable to check any un-open files for deletion, silently ignore
                        // (after logging to console). This doesn't have any bearing on syncing truly
                        // open Documents (which we've already successfully checked).
                        
                        // 3) Reload clean docs as needed
                        reloadChangedDocs()
                            .always(function () {
                                // 4) Close clean docs as needed
                                // This phase completes synchronously
                                closeDeletedDocs();
                                
                                // 5) Prompt for dirty editors (conflicts)
                                presentConflicts()
                                    .always(function () {
                                        if (_restartPending) {
                                            // Restart the sync if needed
                                            _restartPending = false;
                                            _alreadyChecking = false;
                                            syncOpenDocuments();
                                        } else {
                                            // We're really done!
                                            _alreadyChecking = false;
                                            
                                            // If we showed a dialog, restore focus to editor
                                            if (editConflicts.length > 0 || deleteConflicts.length > 0) {
                                                EditorManager.focusEditor();
                                            }
                                            
                                            // (Any errors that ocurred during presentConflicts() have already
                                            // shown UI & been dismissed, so there's no fail() handler here)
                                        }
                                    });
                            });
                            // Note: if any auto-reloads failed, we silently ignore (after logging to console)
                            // and we still continue onto phase 4 and try to process those files anyway.
                            // (We'll retry the auto-reloads next time window is activated... and evenually
                            // we'll also be double checking before each Save).
                    });
            }).fail(function () {
                // Unable to fetch timestamps for some reason - silently ignore (after logging to console)
                // (We'll retry next time window is activated... and evenually we'll also be double
                // checking before each Save).
                
                // We can't go on without knowing which files are dirty, so bail now
                _alreadyChecking = false;
            });
        
    }
    
    
    // Define public API
    exports.syncOpenDocuments = syncOpenDocuments;
});
