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
 * 
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
        if(!_openAndSelectDocCalled){
            // open file didn't come through openAndSelectDocument, so pick the best fileSelectionFocus
            var curDoc = DocumentManager.getCurrentDocument();
            if(DocumentManager.findInWorkingSet(curDoc) != -1)
                _fileSelectionFocus = "WorkingSetView";
            else
                _fileSelectionFocus = "ProjectManager";
        }
        

        _openAndSelectDocCalled = false;

        $(exports).triggerHandler("documentSelectionFocusChange"); 
    });

    function addToWorkingSetAndSelect(fullPath) {
        CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: fullPath});
        openAndSelectDocument(fullPath, "WorkingSetView");
    }

    var _openAndSelectDocCalled = false;

    /* Opens a document if not open and selects the file in the UI corresponding to
     * fileSelectionFocus
     * @param {!fullPath}
     * @param {string} - must be either "WorkingSetView" or "ProjectManager"
     * @returns {!Deferred}
     */
    function openAndSelectDocument(fullPath, fileSelectionFocus) {
        _openAndSelectDocCalled = true;
        _fileSelectionFocus = fileSelectionFocus;

        var doc = DocumentManager.getDocumentForPath(fullPath);
        if(doc != null ) {
            $(exports).triggerHandler("documentSelectionFocusChange");  
            DocumentManager.showInEditor(doc);
            _openAndSelectDocCalled = false;
            return (new $.Deferred()).resolve();
        }  
        else {
            return CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath})
        }
        
 
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