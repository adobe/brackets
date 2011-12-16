/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

var NativeFileSystem = {


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
    showOpenDialog: function (  allowMultipleSelection,
                                chooseDirectories, 
                                title,
                                initialPath,
                                fileTypes,
                                successCallback,
                                errorCallback ) {
        if( !successCallback )
            return;
            
        var files = brackets.fs.showOpenDialog( allowMultipleSelection,
            chooseDirectories, 
            title,
            initialPath,
            fileTypes,
            function( err, data ){
                if( ! err )
                    successCallback( data );
                else if (errorCallback)
                    errorCallback(NativeFileSystem._nativeToFileError(err));
            });                                                   
        
    },

    /** requestNativeFileSystem
     *
     * @param {string} path
     * @param {function} successCallback
     * @param {function} errorCallback
     */
    requestNativeFileSystem: function( path, successCallback, errorCallback ){
        brackets.fs.stat(path, function( err, data ){
            if( !err ){
                var root = new NativeFileSystem.DirectoryEntry( path );
                successCallback( root );
            }
            else if (errorCallback) {
                errorCallback(NativeFileSystem._nativeToFileError(err));
            }
        }); 
    },
     
    _nativeToFileError: function(nativeErr) {
        // The HTML file spec says SECURITY_ERR is a catch-all to be used in situations
        // not covered by other error codes.
        var error = FileError.SECURITY_ERR;
        
        switch (nativeErr) {
            // We map ERR_UNKNOWN and ERR_INVALID_PARAMS to SECURITY_ERR,
            // since there aren't specific mappings for these.
            case brackets.fs.ERR_UNKNOWN:
            case brackets.fs.ERR_INVALID_PARAMS:
                error = FileError.SECURITY_ERR;
                break;
                
            case brackets.fs.ERR_NOT_FOUND:
                error = FileError.NOT_FOUND_ERR;
                break;
            case brackets.fs.ERR_CANT_READ:
                error = FileError.NOT_READABLE_ERR;
                break;
                
            // It might seem like you should use FileError.ENCODING_ERR for this,
            // but according to the spec that's for malformed URLs.            
            case brackets.fs.ERR_UNSUPPORTED_ENCODING:
                error = FileError.SECURITY_ERR;
                break;
                
            case brackets.fs.ERR_CANT_WRITE:
                error = FileError.NO_MODIFICATION_ALLOWED_ERR;
                break;
            case brackets.fs.ERR_OUT_OF_SPACE:
                error = FileError.QUOTA_EXCEEDED_ERR;
                break;
        }
        
        return new NativeFileSystem.FileError(error);
    }
};

/** class: Entry
 *
 * @param {string} name
 * @param {string} isFile
 * @constructor
 */
NativeFileSystem.Entry = function( fullPath, isDirectory) {
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
NativeFileSystem.FileEntry = function( name ) {
    NativeFileSystem.Entry.call(this, name, false);
    
    // TODO: make FileEntry actually inherit from Entry by modifying prototype. I don't know how to do this yet.
    
};

/** file
 *
 * Obtains the File objecte for a FileEntry object
 *
 * @param {function} successCallback
 * @param {function} errorCallback
 */
NativeFileSystem.FileEntry.prototype.file = function( successCallback, errorCallback ){
    var newFile = new NativeFileSystem.File( this );    
    successCallback( newFile );
    
    // TODO Ty: error handling
    // errorCallback
};

/*
TODO Jason
NativeFileSystem.FileEntry.prototype.createfileerror = function( successCallback, errorCallback ){

}; */

/** class: DirectoryEntry
 *
 * @constructor
 * @param {string} name
 * @extends {Entry}
 */ 
NativeFileSystem.DirectoryEntry = function( name ) {
    NativeFileSystem.Entry.call(this, name, true);
    
    // TODO: make DirectoryEntry actually inherit from Entry by modifying prototype. I don't know how to do this yet.

    // IMPLEMENT LATERvoid            getFile (DOMString path, optional Flags options, optional EntryCallback successCallback, optional ErrorCallback errorCallback);
    // IMPLEMENT LATERvoid            getDirectory (DOMString path, optional Flags options, optional EntryCallback successCallback, optional ErrorCallback errorCallback);
    // IMPLEMENT LATERvoid            removeRecursively (VoidCallback successCallback, optional ErrorCallback errorCallback);
};


NativeFileSystem.DirectoryEntry.prototype.createReader = function() {
    var dirReader = new NativeFileSystem.DirectoryReader();
    dirReader._directory = this;
    
    return dirReader;
};


/** class: DirectoryReader
 */ 
NativeFileSystem.DirectoryReader = function() {
    
};


/** readEntries
 *
 * @param {function} successCallback
 * @param {function} errorCallback
 * @returns {Entry[]}
 */ 
NativeFileSystem.DirectoryReader.prototype.readEntries = function( successCallback, errorCallback ){
    var rootPath = this._directory.fullPath;
    var jsonList = brackets.fs.readdir( rootPath, function( err, filelist ) {
        if( ! err ){
            // Create entries for each name
            var entries = [];
            filelist.forEach(function(item){
                var itemFullPath = rootPath + "/" + item;
                
                brackets.fs.stat( itemFullPath, function( err, statData) {
                
                    if( !err ){
                        if( statData.isDirectory() )
                            entries.push( new NativeFileSystem.DirectoryEntry( itemFullPath ) );
                        else if( statData.isFile() ) 
                            entries.push( new NativeFileSystem.FileEntry( itemFullPath ) );
                    }
                    else if (errorCallback) {
                        errorCallback(NativeFileSystem._nativeToFileError(err));
                    }
                    
                })    
            });

            successCallback( entries );        
        }
        else if (errorCallback) {
            errorCallback(NativeFileSystem._nativeToFileError(err));
        }
    });    
};


/** class: FileReader
 *
 * @extends {EventTarget}
 */ 
NativeFileSystem.FileReader = function() {
    // Todo Ty: this classes should extend EventTarget
    
    // async read methods
    // IMPLEMENT LATER void readAsArrayBuffer(Blob blob);
    // IMPLEMENT LATER void readAsBinaryString(Blob blob);
    // IMPLEMENT LATER void readAsDataURL(Blob blob);
    
    // IMPLEMENT LATER void abort();
    
    // states
    this.EMPTY = 0;
    this.LOADING = 1;
    this.DONE = 2;
    
    // readyState is read only
    this.readyState = this.EMPTY;
    
    // File or Blob data
    // IMPLEMENT LATER readonly attribute any result;
    // IMPLEMENT LATER readonly attribute DOMError error;
    
    // event handler attributes
    this.onloadstart = null;
    this.onprogress = null;
    this.onload = null;
    this.onabort = null;
    this.onerror = null;
    this.onloadend = null;

      
};

/** readAsText
 *
 * @param {Blob} blob
 * @param {string} encoding
 */ 
NativeFileSystem.FileReader.prototype.readAsText = function( blob, encoding) {
    var self = this;

    if( !encoding )
        encoding = "";
        
    if( this.readyState == this.LOADING )
        throw new InvalidateStateError();
        
    this.readyState = this.LOADING;
        
    if( this.onloadstart )
        this.onloadstart(); // todo params
    
    brackets.fs.readFile( blob.fullPath, encoding, function( err, data) {
    
        // TODO: the event objects passed to these event handlers is fake and incomplete right now
        var fakeEvent = {
            target: { result: null
                      ,error: null }
            ,loaded: 0
            ,total: 0
        };
    
        if( err ){
            if( self.onerror ){
                this.readyState = this.DONE;
                
                fakeEvent.target.error = NativeFileSystem._nativeToFileError(err);
                self.onerror(fakeEvent);
            }
        }
        else{
        
        // TODO: this should be the file/blob size, but we don't have code to get that yet, so for know assume a file size of 1
        // and since we read the file in one go, assume 100% after the first read
        fakeEvent.loaded = 1;
        fakeEvent.total = 1;
        
            if( self.onprogress )
                self.onprogress(fakeEvent); 
                
            // TODO: this.onabort not currently supported since our native implementation doesn't support it
            //if( self.onabort )
            //    self.onabort(fakeEvent); 
            
            if( self.onload ){
                fakeEvent.target.result = data;
                self.onload( fakeEvent );
            }
                
            if( self.onloadend ){
                this.readyState = this.DONE;
                self.onloadend();
            }
        }
    
    });
};

/** class: Blob
 *
 * @constructor
 * param {Entry} entry
 */ 
NativeFileSystem.Blob = function ( fullPath ){
    this.fullPath = fullPath;

    // IMPLEMENT LATER readonly attribute unsigned long long size;
    // IMPLEMENT LATER readonly attribute DOMString type;
  
    //slice Blob into byte-ranged chunks
  
    // IMPLEMENT LATER Blob slice(optional long long start,
    //           optional long long end,
    //           optional DOMString contentType); 
};

/** class: File
 *
 * @constructor
 * param {Entry} entry
 * @extends {Blob}
 */ 
NativeFileSystem.File = function ( entry ){
    NativeFileSystem.Blob.call( this, entry.fullPath );

    //IMPLEMENT LATER get name() { return this.entry.name; }
    // IMPLEMENT LATER get lastModifiedDate() { return } use stat to get mod date
};


/** class: FileError
 *
 * Implementation of HTML file API error code return class. Note that we don't
 * actually define the error codes here--we rely on the browser's built-in FileError
 * class's constants. In other words, external clients of this API should always
 * use FileError.<constant-name>, not NativeFileSystem.FileError.<constant-name>.
 *
 * @constructor
 * @param {number} code The error code to return with this FileError. Must be
 * one of the codes defined in the FileError class.
 */
NativeFileSystem.FileError = function(code) {
    this.code = code || 0;
};

