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
 * to show the current file selection at a time. Currently, only PaneViewListView and 
 * ProjectManager can show file selection. In general the PaneViewListView takes higher
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
 * - select a file in PaneViewListView > select in PaneViewListView
 * - add a file to the PaneViewListView > select in PaneViewListView
 * - select a file in ProjectManager > select in ProjectManager
 * - open a file from places other than the PaneViewListView or ProjectManager > 
 *       select file in WorkignSetView if its in the working set, otherwise select in ProjectManager
 */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var DocumentManager     = require("document/DocumentManager"),
        MainViewManager     = require("view/MainViewManager"),
        CommandManager      = require("command/CommandManager"),
        EditorManager       = require("editor/EditorManager"),
        PerfUtils           = require("utils/PerfUtils"),
        Commands            = require("command/Commands"),
        DeprecationWarning  = require("utils/DeprecationWarning");

    /** 
     * Tracks whether a "currentDocumentChange" notification occured due to a call to 
     * openAndSelectDocument.
     * @see FileviewController.openAndSelectDocument
     * @private 
     */
    var _curDocChangedDueToMe = false;
    var PANE_VIEW_LIST_VIEW = "PaneViewListView";
    var PROJECT_MANAGER = "ProjectManager";

    /**
     * @private
     * @see FileViewController.getFileSelectionFocus()
     */
    var _fileSelectionFocus = PROJECT_MANAGER;
    
    /** 
     * Change the doc selection to the working set when ever a new file is added to the working set
     */
    $(MainViewManager).on("paneViewListAdd", function (event, addedFile) {
        _fileSelectionFocus = PANE_VIEW_LIST_VIEW;
        $(exports).triggerHandler("documentSelectionFocusChange");
    });

    /** 
      * Update the file selection focus whenever the contents of the editor area change
      */
    $(MainViewManager).on("currentFileChanged", function (event, file, paneId) {
        var perfTimerName;
        if (!_curDocChangedDueToMe) {
            perfTimerName = PerfUtils.markStart("FileViewController._onCurrentFileChanged():\t" + (file ? (file.fullPath) : "(no open file)"));
            if (!file || MainViewManager.findInPaneViewList(paneId,  file.fullPath) !== -1) {
                _fileSelectionFocus = PANE_VIEW_LIST_VIEW;
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
     * @return {$.Promise}
     */
    function _selectCurrentDocument(paneId) {
        if (paneId) {
            MainViewManager.setActivePaneId(paneId);
        } else {
            MainViewManager.forceFocusToActivePaneView();
        }
        // If fullPath corresonds to the current doc being viewed then opening the file won't
        // trigger a currentDocumentChanged event, so we need to trigger a documentSelectionFocusChange 
        // in this case to signify the selection focus has changed even though the current document has not.
        $(exports).triggerHandler("documentSelectionFocusChange");
    }

    /**
     * Modifies the selection focus in the project side bar. A file can either be selected
     * in the working set (the open files) or in the file tree, but not both.
     * @param {String} fileSelectionFocus - either PROJECT_MANAGER or PANE_VIEW_LIST_VIEW
     */
    function setFileViewFocus(fileSelectionFocus) {
        if (fileSelectionFocus !== PROJECT_MANAGER && fileSelectionFocus !== PANE_VIEW_LIST_VIEW) {
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
     * @param {string} focusHint (PANE_VIEW_LIST_VIEW, PROJECT_MANAGER)
     * @param {string} paneId
     * @return {$.Promise}
     */
    function openAndSelectDocument(fullPath, fileSelectionFocus, paneId) {
        var result;

        if (fileSelectionFocus !== PROJECT_MANAGER && fileSelectionFocus !== PANE_VIEW_LIST_VIEW) {
            console.error("Bad parameter passed to FileViewController.openAndSelectDocument");
            return;
        }

        // Opening files are asynchronous and we want to know when this function caused a file
        // to open so that _fileSelectionFocus is set appropriatly. _curDocChangedDueToMe is set here
        // and checked in the currentDocumentChange handler
        _curDocChangedDueToMe = true;

        _fileSelectionFocus = fileSelectionFocus;

        paneId = (paneId || MainViewManager.FOCUSED_PANE);
        
        // If fullPath corresonds to the current doc being viewed then opening the file won't
        // trigger a currentDocumentChanged event, so we need to trigger a documentSelectionFocusChange 
        // in this case to signify the selection focus has changed even though the current document has not.
        var currentPath = MainViewManager.getCurrentlyViewedPathForPane(paneId);
        if (currentPath === fullPath) {
            _selectCurrentDocument(paneId);
            result = (new $.Deferred()).resolve().promise();
        } else {
            result = CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath,
                                                                 paneId: paneId});
        }
        
        // clear after notification is done
        result.always(function () {
            _curDocChangedDueToMe = false;
        });
        
        return result;
    }

    /** 
     * Opens the specified document if it's not already open, adds it to the working set,
     * and selects it in the PaneViewListView
     * @param {!fullPath}
     * @param {?String} selectIn - specify either WORING_SET_VIEW or PROJECT_MANAGER.
     *      Default is WORING_SET_VIEW.
     * @param {number=} index - insert into the working set list at this 0-based index
     * @param {string=} paneId - Pane in which to add the view
     * @return {!$.Promise}
     */
    function addToPaneViewAndSelect(fullPath, selectIn, index, paneId) {
        var result = new $.Deferred(),
            promise = CommandManager.execute(Commands.CMD_ADD_TO_PANE_VIEW_LIST, {fullPath: fullPath,
                                                                                  index: index,
                                                                                  paneId: paneId});

        // This properly handles sending the right nofications in cases where the document
        // is already the current one. In that case we will want to notify with
        // documentSelectionFocusChange so the views change their selection
        promise.done(function (doc) {
            // CMD_ADD_TO_PANE_VIEW_LIST command sets the current document. Update the 
            // selection focus only if doc is not null. When double-clicking on an
            // image file, we get a null doc here but we still want to keep _fileSelectionFocus
            // as PROJECT_MANAGER. Regardless of doc is null or not, call _selectCurrentDocument
            // to trigger documentSelectionFocusChange event.
            if (doc) {
                _fileSelectionFocus = selectIn || PANE_VIEW_LIST_VIEW;
            }
            _selectCurrentDocument(paneId);
            
            result.resolve(doc);
        }).fail(function (err) {
            result.reject(err);
        });

        return result.promise();
    }
    
    /** 
     * @Deprecated use FileViweController.addToPaneViewAndSelect() instead
     * Opens the specified document if it's not already open, adds it to the working set,
     * and selects it in the PaneViewListView
     * @param {!fullPath}
     * @param {?String} selectIn - specify either WORING_SET_VIEW or PROJECT_MANAGER.
     *      Default is WORING_SET_VIEW.
     * @param {number=} index - insert into the working set list at this 0-based index
     * @return {!$.Promise}
     */
    function addToWorkingSetAndSelect(fullPath, selectIn, index) {
        DeprecationWarning.deprecationWarning("Use FileViweController.addToPaneViewAndSelect() instead of FileViweController.addToWorkingSetAndSelect().", true);
        return addToPaneViewAndSelect(fullPath, selectIn, index);
    }
    
    

    /**
     * returns either PANE_VIEW_LIST_VIEW or PROJECT_MANAGER
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
    exports.PANE_VIEW_LIST_VIEW = PANE_VIEW_LIST_VIEW;
    exports.PROJECT_MANAGER = PROJECT_MANAGER;
});
