/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    
    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
	, CommandManager        = require("CommandManager")
	, Commands              = require("Commands")
	,	EditorManager		= require("EditorManager")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ;

    // Initialize: register listeners
	$(DocumentManager).on("currentDocumentChange", function(event) {
		console.log("Current document changed!  --> "+DocumentManager.getCurrentDocument());
		
		_currentDocumentChange();
	});
    
    $(DocumentManager).on("workingSetAdd", function(event, addedDoc) {
        //console.log("Working set ++ " + addedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
		
		_addDoc( addedDoc )	
    });
    $(DocumentManager).on("workingSetRemove", function(event, removedDoc) {
        console.log("Working set -- " + removedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
		
		_removeDoc( removedDoc );
    });
    
    $(DocumentManager).on("dirtyFlagChange", function(event, doc ) {
        console.log("Dirty flag change: " + doc);
		
		_dirtyFlagChanged( doc );
    });
	
	
	
	
	
	/** Each list item in the working set stores a references to the related document in the list item's data.  
	 *  Use listIem.data( _DOCUMENT_KEY ) to get the document reference
	 */
	var _DOCUMENT_KEY = "document";
	
	function _addDoc( doc ) {
		var curDoc = DocumentManager.getCurrentDocument();
		
		// Add new item to bottom of list
		var link = $("<a></a>").attr( "href", "#" ).text( doc.file.name );
		var newItem = $("<li></li>").append( link );
		
		// TODO: Ask NJ which way is better
		//var newItem = $("<li class='working-set-list-item'><a href='#'>" + doc.file.name +  "</a></li>");
		
		
		newItem.data( _DOCUMENT_KEY, doc );

		$("#open-files-container").children("ul").append(newItem);
		
		newItem.click( function() { 
			_openDoc( doc );
		});
		
		_updateFileStatusIcon( newItem, doc.isDirty, false);
		_updateListItemSelection(newItem, curDoc);
				
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
			   
		   fileStatusIcon.click( function() {
			   var doc = listElement.data( _DOCUMENT_KEY )
			   CommandManager.execute(Commands.FILE_CLOSE, doc );
		   });
       }

       // Set icon's class
       if (fileStatusIcon) {
           fileStatusIcon.toggleClass("dirty", isDirty);
           fileStatusIcon.toggleClass("canClose", canClose);
       }
   }
   
   function _currentDocumentChange(){
 	   var listItem = _findListItemFromDocument(  );
 	   if(listItem){
 		   listItem.addClass("selected");
 	   }
   	
	   var curDoc = DocumentManager.getCurrentDocument();
	   if( curDoc ){
		   var items = $("#open-files-container").children("ul").children();
		   items.each( function( i ){
			   var listItem = $(this);
			   
			   _updateListItemSelection(listItem, curDoc );
		   }); 
	   }
	
   }
   
   function _updateListItemSelection(listItem, curDoc ){
	   if(listItem.data( _DOCUMENT_KEY ) === curDoc)
		   listItem.addClass("selected");
	    else
		   listItem.removeClass("selected");
   }
   
   function _openDoc( doc ) {
	   CommandManager.execute(Commands.FILE_OPEN, doc.file.fullPath);
          
    }
	  
   function _closeDoc( doc ) {
	   CommandManager.execute(Commands.FILE_CLOSE, doc.file.fullPath );
   }
	   
   function _findListItemFromDocument( doc ) {
	   var result = null;
	   
	   if( doc ){
		   var items = $("#open-files-container").children("ul").children();
		   items.each( function( i ){
			   var listItem = $(this);
			   if(listItem.data( _DOCUMENT_KEY ) === doc){
				   result = listItem;
				   return false; // breaks each
			   }
		   }); 
	   }
	   
	   return result;
   }
	
	function _removeDoc( doc ) {		
 	   var listItem = _findListItemFromDocument( doc );
 	   if(listItem){
 		   listItem.remove();
 	   }
	}
	
	function _dirtyFlagChanged( doc ){
		$("#" + doc.file.fullPath).find(".file-status-icon");
	}
	
	function _rebuild() {
	
	}
	
	
	

});