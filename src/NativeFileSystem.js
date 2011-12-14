window.NativeFileSystem = {


    /** showOpenDialog
     *
     * @param {bool} allowMultipleSelection
     * @param {bool} chooseDirectories
     * @param {string} title
     * @param {string} initialPath
     * @param {string[]} fileTypes
     * @param {function} resultCallback
     * @constructor
     */ 
    showOpenDialog: function (   allowMultipleSelection,
                                chooseDirectories, 
                                title,
                                initialPath,
                                fileTypes,
                                successCallback,
                                errorCallback ) {
                                            
       
        if( !successCallback )
            return null;
            
        if( !errorCallback )
            return null;
            
        var files = brackets.fs.showOpenDialog(   allowMultipleSelection,
                                                    chooseDirectories, 
                                                    title,
                                                    initialPath,
                                                    fileTypes,
                                                    showOpenDialogCB );
                                                    
        function showOpenDialogCB( err, data ){
            if( ! err )
                successCallback( data );
            else
                errorCallback( err );
        }
    },


    /** requestNativeFileSystem
     *
     * @param {string} path
     * @param {function} successCallback
     * @param {function} errorCallback
     */
    requestNativeFileSystem: function( path, successCallback, errorCallback ){
    
        // TODO: use stat instead to verify directory exists
        brackets.fs.readdir(path, readdirCB); 
        
        function readdirCB( err, data ){
            if( !err ){
                var root = new DirectoryEntry( path );
                successCallback( root );
            }
            else{
                // TODO NJ: error translation
                // errorCallback( error );
            }
        }
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
        
    // IMPLEMENT LATER var filesystem;
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
    
};


/** readEntires
 *
 * @param {function} successCallback
 * @param {function} errorCallback
 * @returns {Entry[]}
 */ 
DirectoryReader.prototype.readEntries = function( successCallback, errorCallback ){
    var rootPath = this._directory.fullPath;
    var jsonList = brackets.fs.readdir( rootPath, readEntriesCB );
        

    function readEntriesCB( err, filelist ) {
        if( ! err ){
            
            // Create entries for each name
            var entries = [];
            filelist.forEach(function(item){
                // Ignore names starting with "."
                if (item.indexOf(".") != 0) {
                    var itemFullPath = rootPath + "/" + item;
                    
                    brackets.fs.stat( item, function( err, data) {
                        }
                    )
                    
                    if( brackets.fs.isDirectory( itemFullPath ) ) {
                        entries.push( new DirectoryEntry( itemFullPath ) );
                    } 
                    else {
                        entries.push( new FileEntry( itemFullPath ) );
                    }
                }
             });

            successCallback( entries );        
        }
        else{
            // TODO NJ: error translation
            // errorCallback( error );
        }
    }
        
    
    
    // TODO: error handling
};

/*
interface FileReader: EventTarget {

    // async read methods
    // IMPLEMENT LATER void readAsArrayBuffer(Blob blob);
    // IMPLEMENT LATER void readAsBinaryString(Blob blob);
    void readAsText(Blob blob, optional DOMString encoding);
    // IMPLEMENT LATER void readAsDataURL(Blob blob);

  // IMPLEMENT LATER void abort();

  // states constants
  var EMPTY = 0; 
  var LOADING = 1;
  var DONE = 2;


  var readyState;
  get readyState() { return readyState; }

  // File or Blob data
  var result;
  get result() { return result; }
  
  var error;
  get result() { return error; }


  // event handler attributes
  [TreatNonCallableAsNull] attribute Function? onloadstart;
  [TreatNonCallableAsNull] attribute Function? onprogress;
  [TreatNonCallableAsNull] attribute Function? onload;
  [TreatNonCallableAsNull] attribute Function? onabort;
  [TreatNonCallableAsNull] attribute Function? onerror;
  [TreatNonCallableAsNull] attribute Function? onloadend;

};

FileReader.prototype.readAsText = function(blob, encoding ){

}

*/


