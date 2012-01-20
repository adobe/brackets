/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */



 define(function(require, exports, module) {

    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
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

    /* Opens a document if not open and selects the file in the UI corresponding to
     * fileSelectionFocus
     *
     */
    function openAndSelectDocument( fullPath, fileSelectionFocus ){

        var changedDoc = !DocumentManager.getCurrentDocument() || DocumentManager.getCurrentDocument().file.fullPath != fullPath;
        
        // chanage context before calling open so listeners to open can access the new context
        _fileSelectionFocus = fileSelectionFocus;

        CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath})
            .done(function() {
                 
                // FileViewController broadcasts documentSelectionChange on documentChanged.
                // To avoid sending two messages, we only need to broadcast here when the
                // document changes.
                //if(!changedDoc)
                    $(exports).triggerHandler("documentSelectionChange");    
                
            });
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


    function hold (){
        // If doc is already in working set, don't add it again, but change document
        // selection context to the WorkingSetView if necessary
        if (_findInWorkingSet(document.file) != -1){
            if( _fileSelectionFocus != "WorkingSetView" ){
                _fileSelectionFocus = "WorkingSetView";
                $(exports).triggerHandler("currentDocumentSelectionContextChanged");    
            }
            return;
        }
    }

        // Define public API
    exports.getFileSelectionFocus = getFileSelectionFocus;
    exports.openAndSelectDocument = openAndSelectDocument;


});