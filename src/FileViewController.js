/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */



 define(function(require, exports, module) {

    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    ,   Commands            = require("Commands")
    ;


    $(DocumentManager).on("workingSetAdd", function(event, addedDoc) {
        _currentDocumentSelectionContext = "WorkingSetView";
        $(exports).triggerHandler("documentSelectionChange"); 
    });

    $(DocumentManager).on("currentDocumentChange",
    function(event) {
        $(exports).triggerHandler("documentSelectionChange"); 
    });

    function openDocument( fullPath, callee ){

        var changedDoc = !DocumentManager.getCurrentDocument() || DocumentManager.getCurrentDocument().file.fullPath != fullPath;
        
        // chanage context before calling open so listeners to open can access the new context
        _currentDocumentSelectionContext = callee;

        CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath})
            .done(function() {
                 
                // FileViewController broadcasts documentSelectionChange on documentChanged.
                // To avoid sending two messages, we only need to broadcast here when the
                // document changes.
                if(!changedDoc)
                    $(exports).triggerHandler("documentSelectionChange");    
                
            });
    }


    /**
     * @private
     * @see DocumentManager.currentDocumentSelectionContext()
     */
    var _currentDocumentSelectionContext = "ProjectManager";
    
    /**
     * TODO Ty
     * returns either "WorkingSetView" or "ProjectManager"
     * @return {!String}
     */
    function getCurrentDocumentSelectionContext() {
        return _currentDocumentSelectionContext;
    }


    function hold (){
        // If doc is already in working set, don't add it again, but change document
        // selection context to the WorkingSetView if necessary
        if (_findInWorkingSet(document.file) != -1){
            if( _currentDocumentSelectionContext != "WorkingSetView" ){
                _currentDocumentSelectionContext = "WorkingSetView";
                $(exports).triggerHandler("currentDocumentSelectionContextChanged");    
            }
            return;
        }
    }

        // Define public API
    exports.getCurrentDocumentSelectionContext = getCurrentDocumentSelectionContext;
    exports.openDocument = openDocument;


});