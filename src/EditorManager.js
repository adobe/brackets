/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    
    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ;
    
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    
    
    function _onCurrentDocumentChange(event) {
        console.log("Current document changed!  --> "+DocumentManager.getCurrentDocument());
    }
    
    // DEBUG
    setTimeout(function() {
        //var toOpen = NativeFileSystem.FileEntry("");
        //DocumentManager.showInEditor();
    }, 10000);
    
    $(DocumentManager).on("workingSetAdd", function(event, addedDoc) {
        console.log("Working set ++ " + addedDoc);
    });
    $(DocumentManager).on("workingSetRemove", function(event, removedDoc) {
        console.log("Working set -- " + removedDoc);
    });
    
    $(DocumentManager).on("dirtyFlagChange", function(event, removedDoc) {
        console.log("Dirty flag change: " + removedDoc);
    });
    
    // No public API for now
    //exports.foo = foo;
    
});