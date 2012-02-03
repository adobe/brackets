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
        return promise;
    }
    
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
            var doc;
            var toClose;
            
            if (i < editConflicts.length) {
                toClose = false;
                doc = editConflicts[i];
                message =  Strings.format(
                    Strings.EXT_MODIFIED_MESSAGE,
                    ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath)
                );
                // FIXME: Or "Which set of changes do you want to keep? [Keep disk changes] [Keep editor changes]"
                
            } else {
                toClose = true;
                doc = deleteConflicts[i - editConflicts.length];
                message =  Strings.format(
                    Strings.EXT_DELETED_MESSAGE,
                    ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath)
                );
            }
            
            brackets.showModalDialog(
                brackets.DIALOG_ID_EXT_CHANGES,
                Strings.EXT_MODIFIED_TITLE,
                message
            )
                .done(function (id) {
                    if (id === brackets.DIALOG_BTN_OK) {
                        // Save (overwrite disk changes)
                        // FIXME: fails if file no longer exists (deleteConflicts case) due to
                        //        brackets-app issue #42
                        CommandManager.execute(Commands.FILE_SAVE, { doc: doc })
                            .always(function () {
                                presentConflict(i + 1);
                            });
                            // TODO: if save fails, it leaves up a dialog but we don't block for it
                            
                    } else {
                        // Discard (load disk changes)
                        if (toClose) {
                            DocumentManager.closeDocument(doc);
                            presentConflict(i + 1);
                        } else {
                            refreshDoc(doc)
                                .fail(function () {
                                    result.reject();
                                })
                                .always(function () {
                                    presentConflict(i + 1);
                                });
                        }
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
                    .done(function () {
                        // 3) Close clean docs as needed
                        // This phase completes synchronously
                        closeDeletedDocs();
                        
                        // 4) Prompt for dirty editors
                        presentConflicts()
                            .done(function () {
                                _alreadyChecking = false;
                                // TODO: need EditorManager.focusEditor() ?
                            })
                            .fail(function () {
                               // FIXME: how to handle this?
                               // FIXME: currently this is called only when a (discard-&-)refresh fails;
                               // should we also call it when a save fails, and if so, how do we distinguish
                               // the two cases?
                            });
                    })
                    .fail(function () {
                        // FIXME: how to handle this?
                    });
                    
            }).fail(function () {
                // FIXME: how to handle this?
            });
        
    }
    
    
    // Define public API
    exports.syncOpenDocuments = syncOpenDocuments;
});