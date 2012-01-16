/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
  
 /**
 * WorkingSetView generates the UI for the list of the files user is editing based on the model provided by EditorManager.
 * The UI allows the user to see what files are open/dirty and allows them to close files and specify the current editor.
 */
define(function(require, exports, module) {
     
    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    , CommandManager        = require("CommandManager")
    , Commands              = require("Commands")
    , EditorManager         = require("EditorManager")
    , NativeFileSystem      = require("NativeFileSystem").NativeFileSystem
    ;
 
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", function(event) {
        //console.log("Current document changed!  --> "+DocumentManager.getCurrentDocument());
         
        _handleDocumentChanged();
    });
     
    $(DocumentManager).on("workingSetAdd", function(event, addedDoc) {
        //console.log("Working set ++ " + addedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
         
        _handleDocumentAdded( addedDoc );       
    });
     
    $(DocumentManager).on("workingSetRemove", function(event, removedDoc) {
        //console.log("Working set -- " + removedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
         
        _handleDocumentRemoved( removedDoc );
    });
     
    $(DocumentManager).on("dirtyFlagChange", function(event, doc ) {
        //console.log("Dirty flag change: " + doc);
         
        _handleDirtyFlagChanged( doc );
    });
    
    _hideShowOpenFileHeader();
     
 
    /** Each list item in the working set stores a references to the related document in the list item's data.  
     *  Use listIem.data( _DOCUMENT_KEY ) to get the document reference
     */
    var _DOCUMENT_KEY = "document";
     

    function _handleDocumentAdded(doc) {
        _createNewListItem(doc);
        _hideShowOpenFileHeader();   
    }
    
    function _hideShowOpenFileHeader(){
        if( DocumentManager.getWorkingSet().length == 0 ){
            $("#open-files-header").hide();
            $("#open-files-divider").hide();
        }
        else {
            $("#open-files-header").show();
            $("#open-files-divider").show();            
        }
    }
    
    /** Deletes all the list items in the view and rebuilds them from the working set model
     * @private
     */
    function _rebuildWorkingSet(){
        $("#open-files-container > ul").empty();
        
        documentManager.getWorkingSet().forEach( function(item){
            _createNewListItem(item);
        });
        
        _hideShowOpenFileHeader();   
    }
    
    /** Builds the UI for a new list item and inserts in into the end of the list
     * @private
     * @param {Document} document
     * @return {HTMLLIElement} newListItem
     */
    function _createNewListItem(doc){
        var curDoc = DocumentManager.getCurrentDocument();
         
        // Create new list item with a link
        var link = $("<a href='#'></a>").text(doc.file.name);
        var newItem = $("<li></li>")
            .append(link)
            .data( _DOCUMENT_KEY, doc );
         
        $("#open-files-container > ul").append(newItem);
         
        // Update the listItem's apperance
        _updateFileStatusIcon(newItem, doc.isDirty, false);
        _updateListItemSelection(newItem, curDoc);
         
        newItem.click( function() { 
            _openDoc( doc );
        });
             
        newItem.hover(
            function() { _updateFileStatusIcon($(this), doc.isDirty, true); },
            function() { _updateFileStatusIcon($(this), doc.isDirty, false); }
        );
    }
    

     
    /** Updates the appearance of the list element based on the parameters provided
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {bool} isDirty 
     * @param {bool} canClose
     */
    function _updateFileStatusIcon(listElement, isDirty, canClose) {
       var fileStatusIcon = listElement.find(".file-status-icon");
       var showIcon = isDirty || canClose;
 
       // remove icon if its not needed
       if (!showIcon && fileStatusIcon.length != 0) {
           fileStatusIcon.remove();
           fileStatusIcon = null;
       } 
       // create icon if its needed and doesn't exist
       else if (showIcon && fileStatusIcon.length == 0) {
           fileStatusIcon = $("<div></div>")
               .addClass("file-status-icon");
           listElement.prepend(fileStatusIcon);
               
            // Icon click handler
            fileStatusIcon.click( function() {
                var doc = listElement.data(_DOCUMENT_KEY)
                CommandManager.execute(Commands.FILE_CLOSE, doc);
            });
       }
 
       // Set icon's class
       if (fileStatusIcon) {
           fileStatusIcon.toggleClass("dirty", isDirty);
           fileStatusIcon.toggleClass("canClose", canClose);
           
           
 
       }
   }
    
   /** 
    * @private
    */
   function _handleDocumentChanged(){
       _updateListSelection( DocumentManager.getCurrentDocument() );
   }
    
 
   function _updateListSelection(curDoc){
       // Iterate through working set list and update the selection on each
       if(curDoc){
           var items = $("#open-files-container > ul").children();
           items.get().forEach( function(listItem){
               _updateListItemSelection(listItem, curDoc);
           }); 
       }
   }
    
   /** Updates the appearance of the list element based on the parameters provided.
    * @private
    * @param {HTMLLIElement} listElement
    * @param {Document} curDoc 
    */
   function _updateListItemSelection(listItem, curDoc){
       $(listItem).toggleClass("selected", ($(listItem).data(_DOCUMENT_KEY) === curDoc));
   }
   
   /** 
    * @private
    * @param {Document} curDoc 
    */
   function _openDoc(doc) {
       CommandManager.execute(Commands.FILE_OPEN, doc.file.fullPath);
    }
      
    /** 
     * @private
     * @param {Document} curDoc 
     */ 
     function _closeDoc(doc) {
         CommandManager.execute(Commands.FILE_CLOSE, doc.file.fullPath);
     }
        
        
   /** Finds the listItem item assocated with the doc. Returns null if not found.
    * @private
    * @param {Document} curDoc 
    * @return {HTMLLIItem}
    */
   function _findListItemFromDocument(doc) {
       var result = null;
        
       if(doc){
           var items = $("#open-files-container > ul").children();
           items.each( function(){
               var listItem = $(this);
               if(listItem.data( _DOCUMENT_KEY ) === doc){
                   result = listItem;
                   return false; // breaks each
               }
           }); 
       }
        
       return result;      
   }

   /** 
    * @private
    * @param {Document} curDoc 
    */
    function _handleDocumentRemoved(doc) {        
        var listItem = _findListItemFromDocument(doc);
        if(listItem){
            listItem.remove();
        }
        
        _hideShowOpenFileHeader();   
    }
    
    /** 
     * @private
     * @param {Document} curDoc 
     */
    function _handleDirtyFlagChanged(doc){
        var listItem = _findListItemFromDocument(doc);
        if(listItem){
            var canClose = $(listItem).find("canClose").length == 1;
            _updateFileStatusIcon(listItem, doc.isDirty, canClose);
        }
        
    }
     
     
});
