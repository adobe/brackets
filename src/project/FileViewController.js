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
 * Responsible for coordinating file selection between views by permitting only one view
 * to show the current file selection at a time. Currently, only WorkingSetView and 
 * ProjectManager can show file selection. In general the WorkingSetView takes higher
 * priority until the user selects a file in the ProjectManager.
 *
 * Events dispatched:
 * - documentSelectionFocusChange - indicates a document change has caused the focus to 
 *   change between the working set and file tree.
 *
 * - fileViewFocusChange - indicates the selection focus has changed between the working
 *   set and the project tree, but the document selection has NOT changed
 *
 * Current file selection rules in views:
 * - select a file in WorkingSetView > select in WorkingSetView
 * - add a file to the WorkingSetView > select in WorkingSetView
 * - select a file in ProjectManager > select in ProjectManager
 * - open a file from places other than the WorkingSetView or ProjectManager > 
 *       select file in WorkignSetView if its in the working set, otherwise select in ProjectManager
 */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var DocumentManager     = require("document/DocumentManager"),
        CommandManager      = require("command/CommandManager"),
        EditorManager       = require("editor/EditorManager"),
        PerfUtils           = require("utils/PerfUtils"),
        Commands            = require("command/Commands");

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
    $(DocumentManager).on("workingSetAdd", function (event, addedFile) {
        _fileSelectionFocus = WORKING_SET_VIEW;
        $(exports).triggerHandler("documentSelectionFocusChange");
    });

    /** 
      * Update the file selection focus whenever the contents of the editor area change
      */
    $(EditorManager).on("currentlyViewedFileChange", function (event) {
        var perfTimerName;
        // The the cause of the doc change was not openAndSelectDocument, so pick the best fileSelectionFocus
        if (!_curDocChangedDueToMe) {
            var curDoc = DocumentManager.getCurrentDocument();
            perfTimerName = PerfUtils.markStart("FileViewController._onCurrentDocumentChange():\t" + (!curDoc || curDoc.file.fullPath));
            if (curDoc && DocumentManager.findInWorkingSet(curDoc.file.fullPath) !== -1) {
                _fileSelectionFocus = WORKING_SET_VIEW;
            } else {
                _fileSelectionFocus = PROJECT_MANAGER;
            }
        }

        $(exports).triggerHandler("documentSelectionFocusChange");

        if (!_curDocChangedDueToMe) {
            PerfUtils.addMeasurement(perfTimerName);
        }
    });
    
    /** 
     * @private
     * @returns {$.Promise}
     */
    function _selectCurrentDocument() {
        // If fullPath corresonds to the current doc being viewed then opening the file won't
        // trigger a currentDocumentChanged event, so we need to trigger a documentSelectionFocusChange 
        // in this case to signify the selection focus has changed even though the current document has not.
        $(exports).triggerHandler("documentSelectionFocusChange");
        
        // Ensure the editor has focus even though we didn't open a new file.
        EditorManager.focusEditor();
    }

    /**
     * Modifies the selection focus in the project side bar. A file can either be selected
     * in the working set (the open files) or in the file tree, but not both.
     * @param {String} fileSelectionFocus - either PROJECT_MANAGER or WORKING_SET_VIEW
     */
    function setFileViewFocus(fileSelectionFocus) {
        if (fileSelectionFocus !== PROJECT_MANAGER && fileSelectionFocus !== WORKING_SET_VIEW) {
            console.error("Bad parameter passed to FileViewController.setFileViewFocus");
            return;
        }

        _fileSelectionFocus = fileSelectionFocus;
        $(exports).triggerHandler("fileViewFocusChange");
    }

    /** 
     * Opens a document if it's not open and selects the file in the UI corresponding to
     * fileSelectionFocus
     * @param {!fullPath}
     * @param {string} - must be either WORKING_SET_VIEW or PROJECT_MANAGER
     * @returns {$.Promise}
     */
    function openAndSelectDocument(fullPath, fileSelectionFocus) {
        var result;

        if (fileSelectionFocus !== PROJECT_MANAGER && fileSelectionFocus !== WORKING_SET_VIEW) {
            console.error("Bad parameter passed to FileViewController.openAndSelectDocument");
            return;
        }

        // Opening files are asynchronous and we want to know when this function caused a file
        // to open so that _fileSelectionFocus is set appropriatly. _curDocChangedDueToMe is set here
        // and checked in the currentDocumentChange handler
        _curDocChangedDueToMe = true;

        _fileSelectionFocus = fileSelectionFocus;

        // If fullPath corresonds to the current doc being viewed then opening the file won't
        // trigger a currentDocumentChanged event, so we need to trigger a documentSelectionFocusChange 
        // in this case to signify the selection focus has changed even though the current document has not.
        var curDoc = DocumentManager.getCurrentDocument();
        if (curDoc && curDoc.file.fullPath === fullPath &&
                !EditorManager.getCustomViewerForPath(fullPath)) {
            _selectCurrentDocument();
            result = (new $.Deferred()).resolve().promise();
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
     * @param {?String} selectIn - specify either WORING_SET_VIEW or PROJECT_MANAGER.
     *      Default is WORING_SET_VIEW.
     * @param {number=} index - insert into the working set list at this 0-based index
     * @return {!$.Promise}
     */
    function addToWorkingSetAndSelect(fullPath, selectIn, index) {
        var result = new $.Deferred(),
            promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: fullPath, index: index});

        // This properly handles sending the right nofications in cases where the document
        // is already the current one. In that case we will want to notify with
        // documentSelectionFocusChange so the views change their selection
        promise.done(function (doc) {
            // FILE_ADD_TO_WORKING_SET command sets the current document. Update the 
            // selection focus only if doc is not null. When double-clicking on an
            // image file, we get a null doc here but we still want to keep _fileSelectionFocus
            // as PROJECT_MANAGER. Regardless of doc is null or not, call _selectCurrentDocument
            // to trigger documentSelectionFocusChange event.
            if (doc) {
                _fileSelectionFocus = selectIn || WORKING_SET_VIEW;
            }
            _selectCurrentDocument();
            
            result.resolve(doc);
        }).fail(function (err) {
            result.reject(err);
        });

        return result.promise();
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
    exports.setFileViewFocus = setFileViewFocus;
    exports.WORKING_SET_VIEW = WORKING_SET_VIEW;
    exports.PROJECT_MANAGER = PROJECT_MANAGER;
});
