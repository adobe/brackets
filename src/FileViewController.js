/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
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
        $(exports).triggerHandler("documentSelectionChange"); 
    });


    $(DocumentManager).on("currentDocumentChange",
    function(event) {
        $(exports).triggerHandler("documentSelectionChange"); 
    });

    function addToWorkingSetAndSelect(fullPath) {
        CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: fullPath});
        openAndSelectDocument(fullPath, "WorkingSetView");
    }

    /* Opens a document if not open and selects the file in the UI corresponding to
     * fileSelectionFocus
     *
     */
    function openAndSelectDocument(fullPath, fileSelectionFocus) {
        
        _fileSelectionFocus = fileSelectionFocus;

        var doc = DocumentManager.getDocumentForPath(fullPath);
        if(doc != null ) {
            $(exports).triggerHandler("documentSelectionChange");  
            DocumentManager.showInEditor(doc);

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