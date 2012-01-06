/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    
    console.log("Begin initializing EditorManager");
    
    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ;
    
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    
    
    function _onCurrentDocumentChange(event) {
        console.log("Current document changed!  --> "+DocumentManager.getCurrentDocument());
        console.log("file is: "+DocumentManager.getCurrentDocument().file);
        console.log("dirty?: "+DocumentManager.getCurrentDocument().isDirty);
    }
    
    // DEBUG
    setTimeout(function() {
        //var toOpen = NativeFileSystem.FileEntry("");
        //DocumentManager.showInEditor();
    }, 10000);
    
    // No public API for now
    //exports.foo = foo;
    
    console.log("Done initializing EditorManager");
    
});