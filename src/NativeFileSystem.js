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
                                errorCallback )
    {
        if( !successCallback )
            return;

        var files = brackets.fs.showOpenDialog( allowMultipleSelection,
            chooseDirectories,
            title,
            initialPath,
            fileTypes,
            function( err, data ) {
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

/** createWriter
 *
 * Creates a new FileWriter associated with the file that this FileEntry represents.
 *
 * @param {function} successCallback
 * @param {function} errorCallback
 */
NativeFileSystem.FileEntry.prototype.createWriter = function( successCallback, errorCallback ) {
    var fileEntry = this;

    // [NoInterfaceObject]
    // interface FileWriter : FileSaver
    var _FileWriter = function( data ) {
        NativeFileSystem.FileSaver.call(this, data);

        // _FileWriter private memeber vars
        this._length = 0;
        this._position = 0;

        // initialize file length
        // TODO (jasonsj): handle async
        brackets.fs.readFile( fileEntry.fullPath, "utf8", function(err, contents) {
            if ( contents )
                this._length = contents.length;
        });
    };

    _FileWriter.prototype.length = function( ) {
        return this._length;
    };

    _FileWriter.prototype.position = function( ) {
        return this._position;
    };

    // TODO (jasonsj): handle Blob data instead of string
    _FileWriter.prototype.write = function( data ) {
        if ( !data )
            throw new Error();

        if ( this.readyState === NativeFileSystem.FileSaver.WRITING )
            throw new NativeFileSystem.FileException( NativeFileSystem.FileException.INVALID_STATE_ERR );

        this.readyState = NativeFileSystem.FileSaver.WRITING;

        if ( this.onwritestart ) {
            // TODO (jasonsj): progressevent
            this.onwritestart();
        }

        var self = this;

        brackets.fs.writeFile( fileEntry.fullPath, data, "utf8", function( err ) {
            if ( self.onerror ) {
                self.onerror ( NativeFileSystem._nativeToFileError( err ) );

                // TODO (jasonsj): partial write, update length and position
            }
            else {
                // successful completion of a write
                self.position += data.size;
            }

            // DONE is set regardless of error
            this.readyState = NativeFileSystem.FileSaver.DONE;

            if ( self.onwrite ) {
                // TODO (jasonsj): progressevent
                self.onwrite();
            }

            if ( this.onwriteend ) {
                // TODO (jasonsj): progressevent
                self.onwriteend();
            }
        });
    };

    _FileWriter.prototype.seek = function( offset ) {
    };

    _FileWriter.prototype.truncate = function( size ) {
    };

    successCallback( new _FileWriter() );
};


NativeFileSystem.FileException = function ( code ){
    this.code = code || 0;
};

// FileException constants
Object.defineProperties(NativeFileSystem.FileException,
    { NOT_FOUND_ERR:                { value: 1 }
    , SECURITY_ERR:                 { value: 2 }
    , ABORT_ERR:                    { value: 3 }
    , NOT_READABLE_ERR:             { value: 4 }
    , ENCODING_ERR:                 { value: 5 }
    , NO_MODIFICATION_ALLOWED_ERR:  { value: 6 }
    , INVALID_STATE_ERR:            { value: 7 }
    , SYNTAX_ERR:                   { value: 8 }
    , QUOTA_EXCEEDED_ERR:           { value: 10 }
});

/** class: FileSaver
 *
 * @param {Blob} data
 * @constructor
 */
NativeFileSystem.FileSaver = function( data ) {
    // FileSaver private member vars
    this._data = data;
    this._readyState = NativeFileSystem.FileSaver.INIT;
    this._error = null;
};

// FileSaver constants
Object.defineProperties(NativeFileSystem.FileSaver,
    { INIT:     { value: 1 }
    , WRITING:  { value: 2 }
    , DONE:     { value: 3 }
});

// FileSaver methods

// TODO (jasonsj): http://dev.w3.org/2009/dap/file-system/file-writer.html#widl-FileSaver-abort-void
NativeFileSystem.FileSaver.prototype.abort = function() {
    // If readyState is DONE or INIT, terminate this overall series of steps without doing anything else..
    if (_readyState == FileSaver.INIT || _readyState == FileSaver.DONE)
    return;

    // Terminate any steps having to do with writing a file.

    // Set the error attribute to a FileError object with the code ABORT_ERR.
    _error = new NativeFileSystem.FileError(FileError.ABORT_ERR);

    // Set readyState to DONE.
    _readyState = FileSaver.DONE;

    // Dispatch a progress event called abort
    // Dispatch a progress event called writeend
    // Stop dispatching any further progress events.
    // Terminate this overall set of steps.

    return err;
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
};
*/

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

NativeFileSystem.DirectoryEntry.prototype.getFile = function( path, options, successCallback, errorCallback ) {
    // TODO (jasonsj): handle absolute paths
    var fileFullPath = this.fullPath + "/" + path;

    // Use stat() to check if file exists
    brackets.fs.stat( fileFullPath, function( err, stats ) {
        if ( options.create ) {
            if ( options.exclusive && ( err !== brackets.fs.ERR_NOT_FOUND ) ) {
                // throw error if file already exists
                errorCallback( NativeFileSystem._nativeToFileError( brackets.fs.PATH_EXISTS_ERR ) );
                return;
            }
            if ( err === brackets.fs.ERR_NOT_FOUND ) {
                brackets.fs.writeFile( fileFullPath, "", "utf8", function( err ) {
                    if ( err )
                        errorCallback( NativeFileSystem._nativeToFileError( err ) );
                    else
                        successCallback( new NativeFileSystem.FileEntry( fileFullPath ) );
                });

                return;
            }
        }
        else {
            // file does not exist
            if ( err === brackets.fs.ERR_NOT_FOUND )
                errorCallback( NativeFileSystem._nativeToFileError( err ) );
            // path is a directory and not a file
            else if ( stats.isDirectory() )
                errorCallback( NativeFileSystem._nativeToFileError( err ) );
            else
                successCallback( new NativeFileSystem.FileEntry( fileFullPath ) );
        }
    });
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
        encoding = "utf-8";

    if( this.readyState == this.LOADING )
        throw new InvalidateStateError();

    this.readyState = this.LOADING;

    if( this.onloadstart )
        this.onloadstart(); // todo params

    brackets.fs.readFile( blob._fullPath, encoding, function( err, data) {

        // TODO: the event objects passed to these event handlers is fake and incomplete right now
        var fakeEvent =
            { loaded: 0
            , total: 0
            };

        // The target for this event is the FileReader and the data/err result is stored in the FileReader
        fakeEvent.target = this;
        this.result = data;
        this.error = NativeFileSystem._nativeToFileError(err);;

        if( err ){
            this.readyState = this.DONE;
            if( self.onerror ){
                self.onerror(fakeEvent);
            }
        }
        else{
            this.readyState = this.DONE;

            // TODO: this should be the file/blob size, but we don't have code to get that yet, so for know assume a file size of 1
            // and since we read the file in one go, assume 100% after the first read
            fakeEvent.loaded = 1;
            fakeEvent.total = 1;

            if( self.onprogress )
                self.onprogress(fakeEvent);

            // TODO: this.onabort not currently supported since our native implementation doesn't support it
            // if( self.onabort )
            //    self.onabort(fakeEvent);

            if( self.onload )
                self.onload( fakeEvent );

            if( self.onloadend )
                self.onloadend();
        }

    });
};

/** class: Blob
 *
 * @constructor
 * param {Entry} entry
 */
NativeFileSystem.Blob = function ( fullPath ){
    this._fullPath = fullPath;

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

    // IMPLEMENT LATER get name() { return this.entry.name; }
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
NativeFileSystem.FileError = function( code ) {
    this.code = code || 0;
};