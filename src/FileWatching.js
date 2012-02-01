/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

/**
 * FileWatching is a set of utilities to help track external modifications to the files and folders
 * in Brackets' currently open project.
 */
define(function(require, exports, module) {
    
    // Load dependent modules
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        ProjectManager      = require("ProjectManager"),
        DocumentManager     = require("DocumentManager"),
        Strings             = require("strings");

    
    var _alreadyChecking = false;
    
    
    /**
     * Check to see whether any open files have been modified by an external app since the last time
     * Brackets synced up with the copy on disk (either by loading or saving the file). For clean
     * files, we silently upate the editor automatically. For files with unsaved changes, we prompt
     * the user.
     */
    function checkOpenDocuments() {
        
        // We can become "re-entrant" if the user leaves & then returns to Brackets before we're
        // done -- easy if a confirmation dialog is open. This can cause various problems (including
        // the dialog disappearing, due to a Bootstrap bug/quirk), so we want to avoid it.
        // Downside: if we ever crash, flag will stay true and we'll never check again.
        if (_alreadyChecking) {
            return;
        }
        
        console.log("-------------- CHECKING... -----------------");
        
        _alreadyChecking = true;
        
        // This function proceeds in four phases:
        //  1) Check all files for modifications
        //  2) Refresh all editors that are clean (if file changed on disk)
        //  3) Close all editors that are clean (if file deleted on disk)
        //  4) Prompt about any editors that are dirty (if file changed/deleted on disk)
        // Each phase fully completes (asynchronously) before the next one begins.
        
        // FIXME: like most of our file operations, this is probably full of race conditions where
        // the user can go into the UI and break our state while we're still in mid-operation. We
        // need a way to block user input while this is going on, at least in the browser-hosted
        // version where APIs are truly aync.
        
        // FIXME: this can get essentially re-entered if the user leaves & returns to Brackets e.g.
        // while a confirmation dialog is still open.

        var allDocs = DocumentManager.getAllOpenDocuments();
        
        var toRefresh = [];
        var toClose = [];
        var editConflicts = [];
        var deleteConflicts = [];
        
        var nDocsChecked = 0;
        
        allDocs.forEach(function (doc) {
            doc.file.getMetadata(
                function (metadata) {
                    if (metadata.modificationTime > doc.diskTimestamp) {
                        console.log("Modified externally: "+doc.file.name);
                        console.log("("+metadata.modificationTime+" vs our "+doc.diskTimestamp+")");
                        if (doc.isDirty) {
                            console.log("   CONFLICT!");
                            editConflicts.push(doc);
                        } else {
                            toRefresh.push(doc);
                        }
                    }
                    
                    nDocsChecked++;
                    if (nDocsChecked == allDocs.length)
                        processResult();
                },
                function (error) {
                    if (error == brackets.fs.ERR_NOT_FOUND) {
                        console.log("Deleted externally: "+doc.file.name);
                        if (doc.isDirty) {
                            console.log("   CONFLICT!");
                            deleteConflicts.push(doc);
                        } else {
                            toClose.push(doc);
                        }
                    } else {
                        console.log("ERROR getting timestamp for "+doc.file.name);
                        console.log(error);
                        // FIXME: how to handle this?
                    }
                    
                    nDocsChecked++;
                    if (nDocsChecked == allDocs.length) {
                        processResult();
                    }
                }
            );
        });
        
        function processResult() {
            if (toRefresh.length == 0) {
                // If no docs to refresh, move right on to the next phase
                closeDeletedDocs();
                
            } else {
                // Refresh each doc in turn, and once all are (async) done, proceed to next phase
                var nDocsRefreshed = 0;
                
                toRefresh.forEach(function (doc) {
                    DocumentManager.readAsText(doc.file)
                    .done(function (text, readTimestamp) {
                    
                        doc.refreshText(text, readTimestamp);
                        nDocsChecked++;
                    })
                    .fail(function () {
                       // FIXME: how to handle this?
                    })
                    .always(function() {
                        nDocsChecked++;
                        
                        // Once we're done refreshing all the editors, move on
                        if (nDocsChecked == toRefresh.length) {
                            closeDeletedDocs();
                        }
                    });
                });
            }
        }
        
        function closeDeletedDocs() {
            toClose.forEach(function (doc) {
                DocumentManager.closeDocument(doc);
                // FIXME: remove from file tree view also
            });
            
            // Closing editors is sync, so we can immediately move on to the final step
            presentConflicts();
        }
        
        function presentConflicts() {
            if (editConflicts.length > 0 || deleteConflicts.length > 0) {
                // FIXME: move strings to strings.js
                // TODO: prompt once per file
                showError("Some files with unsaved changes were modified outside of Brackets:"
                    + formatFileList(editConflicts.concat(deleteConflicts))
                    + "<br>To save your changes and overwrite the changes on disk, save each file."
                    + "<br>To discard your changes and load the changes from disk, refresh Brackets."
                )
                .always(function () {
                   _alreadyChecking = false; 
                });
                
            } else {
                _alreadyChecking = false;
            }
        }
    }
    
    
    function formatFileList(docs) {
        // TODO: duplicates code in FileCommandHandlers.handleFileCloseAll()
        var str = "<ul>";
        docs.forEach(function(doc) {
            str += "<li>" + ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath) + "</li>";
        });
        str += "</ul>";
        return str;
    }
    function showError(message) {
        return brackets.showModalDialog(
            brackets.DIALOG_ID_ERROR,
            "External Changes", message);
    }

    

    // Define public API
    exports.checkOpenDocuments = checkOpenDocuments;
});