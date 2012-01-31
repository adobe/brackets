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

    
    // cases:
    //  - file modified on disk, clean in editor -> silently refresh
    //  - file modified on disk, dirty in editor -> prompt to reload(lose editor changes)/save(lose disk changes)
    //  - file deleted on disk, clean in editor  -> silently close tab
    //  - file deleted on disk, dirty in editor  -> prompt to close tab(lose editor changes)/save(recreate file on disk)
    function checkWorkingSet() {
        
        console.log("-------------- CHECKING... -----------------")
        
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
                        presentResult();
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
                    if (nDocsChecked == allDocs.length)
                        presentResult();
                }
            );
        });
        
        function presentResult() {
            if (editConflicts.length > 0 || deleteConflicts.length > 0) {
                // TODO: list files and tell user to save or discard, then refresh
                showError("Some files were changed outside of Brackets, <b>and also have unsaved changes</b> in Brackets. If you save "
                    + "these files you will overwrite the changes on disk:<br><i>(Note: other files may be modified on disk but do not "
                    + "have unsaved changes in Brackets. Refresh Brackets to see all changes).</i>",
                    editConflicts.concat(deleteConflicts));
                
            } else if (toRefresh.length > 0 || toClose.length > 0) {
                // Tell user to refresh
                showError("Some open (but unmodified) files were changed outside of Brackets. Refresh Brackets or close and "
                    + "reopen these files to see the changes:",
                    toRefresh.concat(toClose));
            }
        }
    }
    
    
    function showError(message, docs) {
        
        message += "<ul>";
        docs.forEach(function(doc) {
            message += "<li>" + ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath) + "</li>";
        });
        message += "</ul>";
        
        return brackets.showModalDialog(
            brackets.DIALOG_ID_ERROR,
            "External Changes", message);
    }

    

    // Define public API
    exports.checkWorkingSet  = checkWorkingSet;
});