/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

/**
 * Responsible for coordinating file seletion between views by permitting only one view
 * to show the current file selection at a time. Currently, only WorkingSetView and 
 * ProjectManager can show file selection. In general the WorkingSetView takes higher
 * priority until the user selects a file in the ProjectManager.
 *
 * Current file selection rules in views:
 * - select a file in WorkingSetView > select in WorkingSetView
 * - add a file to the WorkingSetView > select in WorkingSetView
 * - select a file in ProjectManager > select in ProjectManager
 * - open a file from places other than the WorkingSetView or ProjectManager > 
 *       select file in WorkignSetView if its in the working set, otherwise select in ProjectManager
 */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var DocumentManager     = require("DocumentManager"),
        CommandManager      = require("CommandManager"),
        EditorManager       = require("EditorManager"),
        Commands            = require("Commands");

    /** 
     * Tracks whether a "currentDocumentChange" notification occured due to a call to 
     * openAndSelectDocument.
     * @see FileviewController.openAndSelectDocument
     * @private 
     */
    var _curDocChangedDueToMe = false;
    var WORKING_SET_VIEW = "WorkingSetView";
    var PROJECT_MANAGER = "ProjectManager";

    /**
     * @private
     * @see FileViewController.getFileSelectionFocus()
     */
    var _fileSelectionFocus = PROJECT_MANAGER;
    
    /** 
     * Change the doc selection to the working set when ever a new file is added to the working set
     */
    $(DocumentManager).on("workingSetAdd", function (event, addedDoc) {
        _fileSelectionFocus = WORKING_SET_VIEW;
        $(exports).triggerHandler("documentSelectionFocusChange");
    });

    /** 
      * Update the file selection focus when ever the current document changes
      */
    $(DocumentManager).on("currentDocumentChange", function (event) {

        // The the cause of the doc change was not openAndSelectDocument, so pick the best fileSelectionFocus
        if (!_curDocChangedDueToMe) {
            var curDoc = DocumentManager.getCurrentDocument();
            if (curDoc && DocumentManager.findInWorkingSet(curDoc.file.fullPath) !== -1) {
                _fileSelectionFocus = WORKING_SET_VIEW;
            } else {
                _fileSelectionFocus = PROJECT_MANAGER;
            }
        }

        $(exports).triggerHandler("documentSelectionFocusChange");
    });

    /** 
     * Opens a document if it's not open and selects the file in the UI corresponding to
     * fileSelectionFocus
     * @param {!fullPath}
     * @param {string} - must be either WORKING_SET_VIEW or PROJECT_MANAGER
     * @returns {!Deferred}
     */
    function openAndSelectDocument(fullPath, fileSelectionFocus) {
        var result;

        if (fileSelectionFocus !== PROJECT_MANAGER && fileSelectionFocus !== WORKING_SET_VIEW) {
            throw new Error("Bad parameter passed to FileViewController.openAndSelectDocument");
        }

        // Opening files are asynchronous and we want to know when this function caused a file
        // to open so that _fileSelectionFocus is set appropriatly. _curDocChangedDueToMe is set here
        // and checked in the cyrrentDocumentChange handler
        _curDocChangedDueToMe = true;

        _fileSelectionFocus = fileSelectionFocus;

        // If fullPath corresonds to the current doc being viewed then opening the file won't
        // trigger a currentDocumentChanged event, so we need to trigger a documentSelectionFocusChange 
        // in this case to signify the selection focus has changed even though the current document has not.
        var curDoc = DocumentManager.getCurrentDocument();
        if (curDoc && curDoc.file.fullPath === fullPath) {
            $(exports).triggerHandler("documentSelectionFocusChange");
            // Ensure the editor has focus even though we didn't open a new file.
            EditorManager.focusEditor();
            result = (new $.Deferred()).resolve();
        } else {
            result = CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath});
        }
        
        // clear after notification is done
        result.always(function () {
            _curDocChangedDueToMe = false;
        });
        
        return result;
    }

    /** 
     * Opens the specified document if it's not already open, adds it to the working set,
     * and selects it in the WorkingSetView
     * @param {!fullPath}
     */
    function addToWorkingSetAndSelect(fullPath) {
        CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: fullPath});

        // This properly handles sending the right nofications in cases where the document
        // is already the curruent one. In that case we will want to notify with
        // documentSelectionFocusChange so the views change their selection
        openAndSelectDocument(fullPath, WORKING_SET_VIEW);
    }

    /**
     * returns either WORKING_SET_VIEW or PROJECT_MANAGER
     * @return {!String}
     */
    function getFileSelectionFocus() {
        return _fileSelectionFocus;
    }



    // Define public API
    exports.getFileSelectionFocus = getFileSelectionFocus;
    exports.openAndSelectDocument = openAndSelectDocument;
    exports.addToWorkingSetAndSelect = addToWorkingSetAndSelect;
    exports.WORKING_SET_VIEW = WORKING_SET_VIEW;
    exports.PROJECT_MANAGER = PROJECT_MANAGER;


});
