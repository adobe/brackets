/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * Responsible for coordinating file seletion between views by permitting only one view
 * to show the current file selection at a time. Currently, only WorkingSetView and 
 * ProjectManager can show file selection and in general the WorkingSetView takes higher
 * priority until the user selects a file in the ProjectManager.
 *
 * - if user selects a file in WorkingSetView > select in WorkingSetView
 * - if user adds a file to the WorkingSetView > select in WorkingSetView
 * - if user selects a file in ProjectManager > select in ProjectManager
 * - if user opens a file from places other than the WorkingSetView or ProjectManager > 
 *       select file in WorkignSetView if it is open, otherwise select in ProjectManager
 */

 define(function(require, exports, module) {

    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    ,   CommandManager      = require("CommandManager")
    ,   Commands            = require("Commands")
    ;

    /* Change the doc selection to the workign set when ever a new file
     * is added to the working set
     */
    $(DocumentManager).on("workingSetAdd", function(event, addedDoc) {
        _fileSelectionFocus = "WorkingSetView";
        $(exports).triggerHandler("documentSelectionFocusChange"); 
    });


    $(DocumentManager).on("currentDocumentChange",
    function(event) {

        // if the cause of the doc chagne didn't come through 
        // openAndSelectDocument, so pick the best fileSelectionFocus
        if(!_curDocChangedDueToMe){
            var curDoc = DocumentManager.getCurrentDocument();
            if(curDoc !== null && DocumentManager.findInWorkingSet(curDoc.file.fullPath) != -1)
                _fileSelectionFocus = "WorkingSetView";
            else
                _fileSelectionFocus = "ProjectManager";
        }
        
        // reset since we have handled the doc change
        _curDocChangedDueToMe = false;

        $(exports).triggerHandler("documentSelectionFocusChange"); 
    });

    /** Opens the specified document if it's not already open, adds it to the working set,
     * and selects it in the WorkingSetView
     * @param {!fullPath}
     */
    function addToWorkingSetAndSelect(fullPath) {
        CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: fullPath});

        // This properly handles sending the right nofications in cases where the document
        // is already the curruent one. In that case we will want to notify with
        // documentSelectionFocusChange so the views change their selection
        openAndSelectDocument(fullPath, "WorkingSetView");
    }

    var _curDocChangedDueToMe = false;

    /** Opens a document if not open and selects the file in the UI corresponding to
     * fileSelectionFocus
     * @param {!fullPath}
     * @param {string} - must be either "WorkingSetView" or "ProjectManager"
     * @returns {!Deferred}
     */
    function openAndSelectDocument(fullPath, fileSelectionFocus) {
        var result;
        // Opening files are asynchronous and we want to know when this function caused a file
        // to open in order to properly set the fileSelectionFocus, so _curDocChangedDueToMe is
        // set to true here. The handler for currentDocumentChange well check this and reset it.
        _curDocChangedDueToMe = true;

        _fileSelectionFocus = fileSelectionFocus;

        // If fullPath corresonds to the current doc being viewed then opening the file won't
        // trigger a currentDocumentChanged event, so we need to trigger a documentSelectionFocusChange 
        // in this case to signify the selection focus has changed even though the current document has not.
        if(DocumentManager.getCurrentDocument() == DocumentManager.getDocumentForPath(fullPath)) {
            $(exports).triggerHandler("documentSelectionFocusChange");  
            DocumentManager.showInEditor(doc);
            result = (new $.Deferred()).resolve();
        }  
        else {
            result = CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath});
                
        }
        
        // clear after notification is done
        result.always(_curDocChangedDueToMe = false);
        
        return result;
    }


    /**
     * @private
     * @see FileViewController.getFileSelectionFocus()
     */
    var _fileSelectionFocus = "ProjectManager";
    
    /**
     * returns either "WorkingSetView" or "ProjectManager"
     * @return {!String}
     */
    function getFileSelectionFocus() {
        return _fileSelectionFocus;
    }



        // Define public API
    exports.getFileSelectionFocus = getFileSelectionFocus;
    exports.openAndSelectDocument = openAndSelectDocument;
    exports.addToWorkingSetAndSelect = addToWorkingSetAndSelect;


});
