/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    
    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
	,	EditorManager		= require("EditorManager")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ;

    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
	
	
    function _onCurrentDocumentChange(event) {
        console.log("Current document changed!  --> "+DocumentManager.getCurrentDocument());
    }
    
    $(DocumentManager).on("workingSetAdd", function(event, addedDoc) {
        console.log("Working set ++ " + addedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
		
		_addDoc( addedDoc )
		
		
    });
    $(DocumentManager).on("workingSetRemove", function(event, removedDoc) {
        console.log("Working set -- " + removedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
		
		_removedoc( removedDoc );
    });
    
    $(DocumentManager).on("dirtyFlagChange", function(event, doc ) {
        console.log("Dirty flag change: " + doc);
		
		_dirtyFlagChanged( doc );
    });
	
	function _addDoc( doc ) {
		// Add new item to bottom of list
		var newItem = $("<li id='" + doc.file.fullPath + "' class='working-set-list-item'><a href='#'>" + doc.file.name +  "</a></li>");
		$("#open-files-container").children("ul").append(newItem);
		
		_updateFileStatusIcon( newItem, doc.isDirty, false)
				
		newItem.hover(
			// hover in
	        function() {
				_updateFileStatusIcon( $(this), doc.isDirty, true);	
	        },
			// hover out
	        function() {
				_updateFileStatusIcon( $(this), doc.isDirty, false);    
	        }
	    );
	}
	
    function _updateFileStatusIcon(listElement, isDirty, canClose) {
           var found = listElement.find(".file-status-icon");
        
           var fileStatusIcon = found.length != 0 ? $(found[0]) : null;
           var showIcon = isDirty || canClose;


           // remove icon if its not needed
           if (!showIcon && fileStatusIcon) {
               fileStatusIcon.remove();
               fileStatusIcon = null;
           } 
           // create icon if its needed and doesn't exist
           else if (showIcon && !fileStatusIcon) {
               fileStatusIcon = $("<div></div>");
               fileStatusIcon.addClass("file-status-icon");
               listElement.prepend(fileStatusIcon);
           }

           // Set icon's class
           if (fileStatusIcon) {
               fileStatusIcon.toggleClass("dirty", isDirty);
               fileStatusIcon.toggleClass("canClose", canClose);
           }
    
    
       }
	
	function _removeDoc( doc ) {
		// FIXME doesn't work
		$("#" + removedDoc.file.fullPath).remove();
		
	}
	
	function _dirtyFlagChanged( doc ){
		$("#" + doc.file.fullPath).find(".file-status-icon");
	}
	
	function _rebuild() {
	
	}
	
	
	

});