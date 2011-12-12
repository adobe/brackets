
    
window.ProjectManager = {


	/** 
	 * TODO: param docs
     */
	showOpenDialog: function ( 	allowMultipleSelection,
								chooseDirectories, 
								title,
								initialPath,
								fileTypes,
								resultCallback ) {
								
		var showOpenDialogCallback = resultCallback;
								
		// Default parameter values
		if( allowMultipleSelection == undefined )
			allowMultipleSelection = false;
		if( chooseDirectories == undefined )
			chooseDirectories = false;
		if( title == undefined )
			title = "Choose File";
		if( initialPath == undefined )
			initialPath = null;
		if( fileTypes == undefined || fileTypes.length == 0 )
			fileTypes = ["*"];
			
		// TODO: errow when callback is null
		if( resultCallback )
			return null;
			
		var files = brackets.file.showOpenDialog( 	allowMultipleSelection,
												  	chooseDirectories, 
													title,
													initialPath,
													fileTypes );
		
		
		// native implemenation of brackets.file.showOpenDialog should asynchronously
		// call back showOpenDialogCallback						
								
	},

	/** 
	 * TODO: param docs
     */
	showOpenDialogCallback: function( files ){
		showOpenDialogCallback( files );
	},
	
	/** 
	 * TODO: param docs
     */
	requestNativeFileSystem: function( path, successCallback, errorCallback ){
	
		// TODO: assumes path is a directory right now. Need to error check
		// TODO: don't actually need to get the listing here, but should verify the directory exists
		var entryList = brackets.file.getDirectoryListing(path); 
	    var files = JSON.parse(entryList);
	    
	    
	    var root = new DirectoryEntry( path );
	   
	    
	    return root;
	 }
};


/** class: Entry
 *
 * @param {string} name
 * @param {string} isFile
 * @constructor
 */
Entry = function( fullPath, isDirectory) {
    this.isDirectory = isDirectory;
    this.isFile = !isDirectory;
    // IMPLEMENT LATER void      getMetadata (MetadataCallback successCallback, optional ErrorCallback errorCallback);
    this.fullPath = fullPath;
    
    // Extract name from fullPath
    this.name = null; // default if extraction fails
    if( fullPath ){
	    var pathParts = fullPath.split( "/" );
	    if( pathParts.length > 0 )
	        this.name = pathParts.pop();
    }
    	
    // IMPLEMENT LATERvar filesystem;
    // IMPLEMENT LATER void      moveTo (DirectoryEntry parent, optional DOMString newName, optional EntryCallback successCallback, optional ErrorCallback errorCallback);
    // IMPLEMENT LATER void      copyTo (DirectoryEntry parent, optional DOMString newName, optional EntryCallback successCallback, optional ErrorCallback errorCallback);
    // IMPLEMENT LATER DOMString toURL (optional DOMString mimeType);
    // IMPLEMENT LATER void      remove (VoidCallback successCallback, optional ErrorCallback errorCallback);
    // IMPLEMENT LATER void      getParent (EntryCallback successCallback, optional ErrorCallback errorCallback);
};



/** class: FileEntry
 *
 * @param {string} name
 * @constructor
 * @extends {Entry}
 */	
FileEntry = function( name ) {
	Entry.call(this, name, false);
	
	// TODO: make FileEntry actually inherit from Entry by modifying prototype. I don't know how to do this yet.
	
    // IMPLEMENT LATER void createWriter (FileWriterCallback successCallback, optional ErrorCallback errorCallback);
    // IMPLEMENT LATER void file (FileCallback successCallback, optional ErrorCallback errorCallback);
};


/** class: DirectoryEntry
 *
 * @param {string} name
 * @constructor
 * @extends {Entry}
 */	
DirectoryEntry = function( name ) {
	Entry.call(this, name, true);
	
	// TODO: make DirectoryEntry actually inherit from Entry by modifying prototype. I don't know how to do this yet.

    // IMPLEMENT LATERvoid            getFile (DOMString path, optional Flags options, optional EntryCallback successCallback, optional ErrorCallback errorCallback);
    // IMPLEMENT LATERvoid            getDirectory (DOMString path, optional Flags options, optional EntryCallback successCallback, optional ErrorCallback errorCallback);
    // IMPLEMENT LATERvoid            removeRecursively (VoidCallback successCallback, optional ErrorCallback errorCallback);
};


DirectoryEntry.prototype.createReader = function() {
	var dirReader = new DirectoryReader();
	dirReader._directory = this;
	
	return dirReader;
};


/** class: DirectoryReader
 */	
DirectoryReader = function() {
	this._directory = null;
	this._successCallback = null;
	this._successCallback = null;
};


/** readEntires
 *
 * @param successCallback
 * @param errorCallback
 * @returns {Entry[]}
 */	
DirectoryReader.prototype.readEntries = function( successCallback, errorCallback ){
    this._successCallback = successCallback;
    this._errorCallback = errorCallback;
    
    var jsonList = brackets.file.getDirectoryListing( this._directory.fullPath);
	var nameList = JSON.parse(jsonList);
	var entries = [];
	var rootPath = this._directory.fullPath;
	
	 $(nameList).each(function(index, item){
        // Ignore names starting with "."
     	if (item.indexOf(".") != 0) {
	    	var itemFullPath = rootPath + "/" + item;
	    	
	    	if( brackets.file.isDirectory( itemFullPath ) ) {
				entries.push( new DirectoryEntry( itemFullPath ) );
			} 
			else {
				entries.push( new FileEntry( itemFullPath ) );
			}
	    }
     });
	

		
	successCallback( entries );
	
	// TODO: error handling
};



