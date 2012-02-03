/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileError */

/**
 * FileWatching is a set of utilities to help track external modifications to the files and folders
 * in Brackets' currently open project.
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        ProjectManager      = require("ProjectManager"),
        DocumentManager     = require("DocumentManager"),
        EditorManager       = require("EditorManager"),
        EditorUtils         = require("EditorUtils"),
        Commands            = require("Commands"),
        CommandManager      = require("CommandManager"),
        Strings             = require("strings");

    
    var _alreadyChecking = false;
    var toRefresh;
    var toClose;
    var editConflicts;
    var deleteConflicts;
    
    
    function findExternalChanges(docs) {

        toRefresh = [];
        toClose = [];
        editConflicts = [];
        deleteConflicts = [];
    
        var nDocsChecked = 0;
        
        var result = new $.Deferred();
        
        docs.forEach(function (doc) {
            doc.file.getMetadata(
                function (metadata) {
                    if (metadata.modificationTime > doc.diskTimestamp) {
                        if (doc.isDirty) {
                            editConflicts.push(doc);
                        } else {
                            toRefresh.push(doc);
                        }
                    }
                    
                    nDocsChecked++;
                    if (nDocsChecked === docs.length) {
                        result.resolve();
                    }
                },
                function (error) {
                    // File has been deleted externally
                    if (error.code === FileError.NOT_FOUND_ERR) {
                        if (doc.isDirty) {
                            deleteConflicts.push(doc);
                        } else {
                            toClose.push(doc);
                        }
                    } else {
                        // Some other error fetching metadata: treat as a real error
                        console.log("Error checking modification status of " + doc.file.fullPath, error.code);
                        result.reject();
                    }
                    
                    nDocsChecked++;
                    if (nDocsChecked === docs.length) {
                        result.resolve();
                    }
                }
            );
        });
        
        return result;
    }
    
    // TODO: move this into FileCommandHandlers as the impl of a Revert command?
    function refreshDoc(doc) {
        
        var promise = DocumentManager.readAsText(doc.file);
        
        promise.done(function (text, readTimestamp) {
            doc.refreshText(text, readTimestamp);
        });
        promise.fail(function (error) {
            console.log("Error reloading contents of " + doc.file.fullPath, error.code);
            result.reject(error);
        });
        return promise;
    }
    
    // Runs all in parallel; rejects master Deferred as soon as any one fails, but others will
    // continue running to completion.
    function refreshChangedDocs() {
        
        var result = new $.Deferred();
        
        if (toRefresh.length === 0) {
            // If no docs to refresh, move right on to the next phase
            result.resolve();
            
        } else {
            // Refresh each doc in turn, and once all are (async) done, proceed to next phase
            var nDocsRefreshed = 0;
            
            toRefresh.forEach(function (doc) {
                refreshDoc(doc)
                    .fail(function () {
                        // One or more files failed to refresh; so far we've logged each error
                        // but not shown UI for it yet
                        result.reject();
                    })
                    .always(function () {
                        nDocsRefreshed++;
                        
                        // Once we're done refreshing all the editors, move on
                        if (nDocsRefreshed === toRefresh.length) {
                            result.resolve();
                        }
                    });
            });
        }
        
        return result;
    }
    
    function showRefreshError(error, doc) {
        return brackets.showModalDialog(
            brackets.DIALOG_ID_ERROR,
            Strings.ERROR_RELOADING_FILE_TITLE,
            Strings.format(
                Strings.ERROR_RELOADING_FILE,
                doc.file.fullPath,
                EditorUtils.getFileErrorString(error.code)
            )
        );
    }
    
    
    function closeDeletedDocs() {
        toClose.forEach(function (doc) {
            DocumentManager.closeDocument(doc);
            // TODO: remove from file tree view also
        });
    }
    
    
    function presentConflicts() {
        
        var result = new $.Deferred();
        
        function presentConflict(i) {
            if (i >= editConflicts.length + deleteConflicts.length) {
                result.resolve();
                return;
            }
            
            var message;
            var dialogId;
            var doc;
            var toClose;
            
            if (i < editConflicts.length) {
                toClose = false;
                doc = editConflicts[i];
                dialogId = brackets.DIALOG_ID_EXT_CHANGED;
                message = Strings.format(
                    Strings.EXT_MODIFIED_MESSAGE,
                    ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath)
                );
                
            } else {
                toClose = true;
                doc = deleteConflicts[i - editConflicts.length];
                dialogId = brackets.DIALOG_ID_EXT_DELETED;
                message = Strings.format(
                    Strings.EXT_DELETED_MESSAGE,
                    ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath)
                );
            }
            
            brackets.showModalDialog(dialogId, Strings.EXT_MODIFIED_TITLE, message)
                .done(function (id) {
                    if (id === brackets.DIALOG_BTN_DONTSAVE) {
                        if (toClose) {
                            // Discard = close editor
                            DocumentManager.closeDocument(doc);
                            presentConflict(i + 1);
                        } else {
                            // Discard = load changes from disk
                            refreshDoc(doc)
                                .done(function () {
                                    presentConflict(i + 1);
                                })
                                .fail(function (error) {
                                    // Unable to load changed version from disk - show error UI
                                    showRefreshError(error, doc)
                                        .always(function () {
                                            // After user dismisses, move on to next conflict prompt
                                            // (hence no result.reject() here - we're still going)
                                            presentConflict(i + 1);
                                        });
                                });
                        }
                        
                    } else {
                        // Cancel - if user doesn't save or close, we'll prompt again next time
                        // window is reactivated.
                        presentConflict(i + 1);
                    }
                });
            
        }
        
        // Begin walking through the conflicts, one at a time
        presentConflict(0);
        
        return result;
    }
    
    
    
    /**
     * Check to see whether any open files have been modified by an external app since the last time
     * Brackets synced up with the copy on disk (either by loading or saving the file). For clean
     * files, we silently upate the editor automatically. For files with unsaved changes, we prompt
     * the user.
     */
    function syncOpenDocuments() {
        
        // We can become "re-entrant" if the user leaves & then returns to Brackets before we're
        // done -- easy if a confirmation dialog is open. This can cause various problems (including
        // the dialog disappearing, due to a Bootstrap bug/quirk), so we want to avoid it.
        // Downside: if we ever crash, flag will stay true and we'll never check again.
        if (_alreadyChecking) {
            return;
        }
        
        var allDocs = DocumentManager.getAllOpenDocuments();
        if (allDocs.length === 0) {
            return;
        }
        
        _alreadyChecking = true;
        
        
        // This function proceeds in four phases:
        //  1) Check all files for external modifications
        //  2) Refresh all editors that are clean (if file changed on disk)
        //  3) Close all editors that are clean (if file deleted on disk)
        //  4) Prompt about any editors that are dirty (if file changed/deleted on disk)
        // Each phase fully completes (asynchronously) before the next one begins.
        
        // TODO: like most of our file operations, this is probably full of race conditions where
        // the user can go into the UI and break our state while we're still in mid-operation. We
        // need a way to block user input while this is going on, at least in the browser-hosted
        // version where APIs are truly aync.

        // 1) Check for external modifications
        findExternalChanges(allDocs)
            .done(function () {
                // 2) Refresh clean docs as needed
                refreshChangedDocs()
                    .always(function () {
                        // 3) Close clean docs as needed
                        // This phase completes synchronously
                        closeDeletedDocs();
                        
                        // 4) Prompt for dirty editors (conflicts)
                        presentConflicts()
                            .always(function () {
                                // And we're done!
                                _alreadyChecking = false;
                                EditorManager.focusEditor();
                                
                                // (Any errors that ocurred during presentConflicts() show UI
                                // immediately and then wait for dismissal, so there's no fail()
                                // case to account for here)
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