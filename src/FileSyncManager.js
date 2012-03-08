/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileError */

/**
 * FileSyncManager is a set of utilities to help track external modifications to the files and folders
 * in the currently open project.
 *
 * Currently, we look for external changes purely by checking file timestamps against the last-sync
 * timestamp recorded on Document. Later, we will use actual native directory-watching callbacks
 * instead.
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var ProjectManager      = require("ProjectManager"),
        DocumentManager     = require("DocumentManager"),
        EditorManager       = require("EditorManager"),
        Commands            = require("Commands"),
        CommandManager      = require("CommandManager"),
        Async               = require("Async"),
        Dialogs             = require("Dialogs"),
        Strings             = require("strings"),
        FileUtils           = require("FileUtils");

    
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
     * @return {$.Deferred}  Resolved when all scanning done, or rejected immediately if there's any
     *      error while reading file timestamps. Errors are logged but no UI is shown.
     */
    function findExternalChanges(docs) {

        toReload = [];
        toClose = [];
        editConflicts = [];
        deleteConflicts = [];
    
        function checkDoc(doc) {
            var result = new $.Deferred();
            
            // Docs restored from last launch aren't really "open" yet, so skip those
            if (!doc.diskTimestamp) {
                result.resolve();
            } else {
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
            }
            return result;
        }
        
        // Check all docs in parallel
        // (fail fast b/c we won't continue syncing if there was any error fetching timestamps)
        return Async.doInParallel(docs, checkDoc, true);
    }
    
    
    /**
     * Reloads the Document's contents from disk, discarding any unsaved changes in the editor.
     *
     * @param {!Document} doc
     * @return {$.Deferred} Resolved after editor has been refreshed; rejected if unable to load the
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
     * @return {$.Deferred} Resolved/rejected after all reloads done; will be rejected if any one
     *      file's reload failed. Errors are logged (by reloadDoc()) but no UI is shown.
     */
    function reloadChangedDocs() {
        // Reload each doc in turn, and once all are (async) done, signal that we're done
        return Async.doInParallel(toReload, reloadDoc, false);
    }
    
    /**
     * @param {FileError} error
     * @param {!Document} doc
     * @return {$.Deferred}
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
            DocumentManager.closeDocument(doc);
        });
    }
    
    
    /**
     * Walks through all the documents in "editConflicts" & "deleteConflicts" and prompts the user
     * about each one. Processing is sequential: if the user chooses to reload a document, the next
     * prompt is not shown until after the reload has completed.
     *
     * @return {$.Deferred} Resolved/rejected after all documents have been prompted and (if
     *      applicable) reloaded (and any resulting error UI has been dismissed). Rejected if any
     *      one reload failed.
     */
    function presentConflicts() {
        
        var allConflicts = editConflicts.concat(deleteConflicts);
        
        function presentConflict(doc, i) {
            var result = new $.Deferred();
            
            // If window has been re-focused, skip all remaining conflicts so the sync can bail & restart
            if (_restartPending) {
                result.resolve();
                return result;
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
                            // Discard - close editor
                            DocumentManager.closeDocument(doc);
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
            
            return result;
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
        //  1) Check all files for external modifications
        //  2) Refresh all editors that are clean (if file changed on disk)
        //  3) Close all editors that are clean (if file deleted on disk)
        //  4) Prompt about any editors that are dirty (if file changed/deleted on disk)
        // Each phase fully completes (asynchronously) before the next one begins.
        
        // 1) Check for external modifications
        var allDocs = DocumentManager.getAllOpenDocuments();
        
        findExternalChanges(allDocs)
            .done(function () {
                // 2) Reload clean docs as needed
                reloadChangedDocs()
                    .always(function () {
                        // 3) Close clean docs as needed
                        // This phase completes synchronously
                        closeDeletedDocs();
                        
                        // 4) Prompt for dirty editors (conflicts)
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
