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
        console.log("  set: " + DocumentManager.getWorkingSet().join());
		
		// Add new item to bottom of list
		var newItem = $("<li id='" + addedDoc.file.fullPath + "' class='working-set-list-item'><a href='#'>" + addedDoc.file.name +  "</a></li>");
		$("#open-files-container").children("ul").append(newItem);
		
		
		// Show close icon on hover
		newItem.hover(
                function() {
					var closeItem = $("<div class=\"close-file-icon\"></div>");
                    $(this).prepend(closeItem);
					
					// Handle clicking on close icon
		            $(".close-file-icon").click( function() {
		                // close file
						console.log("closed clicked");
						
		            });
					
                },
                function() {
                    $(this).children(".close-file-icon").remove();
                }
            );
			
            
		
		
    });
    $(DocumentManager).on("workingSetRemove", function(event, removedDoc) {
        console.log("Working set -- " + removedDoc);
        console.log("  set: " + DocumentManager.getWorkingSet().join());
		
		
		$("#" + removedDoc.file.fullPath).remove();
    });
    
    $(DocumentManager).on("dirtyFlagChange", function(event, doc ) {
        console.log("Dirty flag change: " + doc);
    });
    
    // No public API for now
    //exports.foo = foo;
    
});