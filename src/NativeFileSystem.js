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
                var root = new DirectoryEntry( path );
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

        return new FileError(error);
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

    // IMPLEMENT LATER void file (FileCallback successCallback, optional ErrorCallback errorCallback);
};

/** createWriter
 *
   Creates a new FileWriter associated with the file that this FileEntry represents.
 *
 * @param {function} successCallback
 * @param {function} errorCallback
 */
FileEntry.prototype.createWriter = function( successCallback, errorCallback ) {
    _FileWriter = function( data ) {
        FileSaver.call(this, data);
    };

    // FileWriter private memeber vars
    _FileWriter.prototype._length = 0;
    _FileWriter.prototype._position = 0;

    _FileWriter.prototype.length = function( ) {
        return this._length;
    };

    _FileWriter.prototype.position = function( ) {
        return this._position;
    };

    _FileWriter.prototype.write = function( data ) {
        brackets.fs.writeFile(baseDir + "write_test.txt", contents, "utf8", function(err) {
            expect(err).toBeFalsy();

            // Read contents to verify
            brackets.fs.readFile(baseDir + "write_test.txt", "utf8", function(err, data) {
                expect(err).toBeFalsy();
                expect(data).toBe(contents);
            });
        });
    };

    _FileWriter.prototype.seek = function( offset ) {
    };

    _FileWriter.prototype.truncate = function( size ) {
    };

    var fileWriter = new _FileWriter();
    successCallback( fileWriter );
};

/** class: FileSaver
 *
 * @param {Blob} data
 * @constructor
 */
FileSaver = function( data ) {
    _data = data;
};

// FileSaver constants
Object.defineProperties(FileSaver,
    { INIT:     { value: 1 }
    , WRITING:  { value: 2 }
    , DONE:     { value: 3 }
});

// FileSaver private memeber vars
FileSaver.prototype._data = null;
FileSaver.prototype._readyState = FileSaver.INIT;
FileSaver.prototype._error = null;

// FileSaver methods

// TODO (jasonsj): http://dev.w3.org/2009/dap/file-system/file-writer.html#widl-FileSaver-abort-void
FileSaver.prototype.abort = function() {
    // If readyState is DONE or INIT, terminate this overall series of steps without doing anything else..
    if (_readyState == FileSaver.INIT || _readyState == FileSaver.DONE)
        return;

    // Terminate any steps having to do with writing a file.

    // Set the error attribute to a FileError object with the code ABORT_ERR.
    _error = new FileError(FileError.ABORT_ERR);

    // Set readyState to DONE.
    _readyState = FileSaver.DONE;

    // Dispatch a progress event called abort
    // Dispatch a progress event called writeend
    // Stop dispatching any further progress events.
    // Terminate this overall set of steps.

    return err;
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

    // IMPLEMENT LATERvoid            getDirectory (DOMString path, optional Flags options, optional EntryCallback successCallback, optional ErrorCallback errorCallback);
    // IMPLEMENT LATERvoid            removeRecursively (VoidCallback successCallback, optional ErrorCallback errorCallback);
};


DirectoryEntry.prototype.createReader = function() {
    var dirReader = new DirectoryReader();
    dirReader._directory = this;

    return dirReader;
};

DirectoryEntry.prototype.getFile = function( path, options, successCallback, errorCallback ) {
    // TODO (jasonsj): handle absolute paths
    var fileFullPath = this.fullPath + "/" + path;

    // Use stat() to check if file exists
    brackets.fs.stat( fileFullPath, function( err, stats ) {
        if ( options.create ) {
            if ( ( options.exclusive && ( err !== FileError.ERR_NOT_FOUND ) ) {
                // throw error if file already exists
                errorCallback( new FileError( FileError.PATH_EXISTS_ERR ) );
                return;
            }
            if ( err === FileError.ERR_NOT_FOUND ) {
                brackets.fs.writeFile( fileFullPath, "utf8", "", function( err ) {
                    if ( err )
                        errorCallback( new FileError( err ) );
                    else
                        successCallback( new FileEntry( fileFullPath ) );
                });

                return;
            }
        }
        else {
            // file does not exist
            if ( err === FileError.ERR_NOT_FOUND )
                errorCallback( new FileError( FileError.ERR_NOT_FOUND ) );
            // path is a directory and not a file
            else if ( stats.isDirectory )
                errorCallback( new FileError( FileError.TYPE_MISMATCH_ERR ) );
            else
                successCallback( new FileEntry( fileFullPath ) );
        }
    });
};


/** class: DirectoryReader
 */
DirectoryReader = function() {

};


/** readEntries
 *
 * @param {function} successCallback
 * @param {function} errorCallback
 * @returns {Entry[]}
 */
DirectoryReader.prototype.readEntries = function( successCallback, errorCallback ){
    var rootPath = this._directory.fullPath;
    var jsonList = brackets.fs.readdir( rootPath, function( err, filelist ) {
        if( ! err ){
            // Create entries for each name
            var entries = [];
            filelist.forEach(function(item){
                var itemFullPath = rootPath + "/" + item;

                brackets.fs.stat( itemFullPath, function( err, statData) {

                    if( !err ){
                        if( statData.isDirectory( itemFullPath ) )
                            entries.push( new DirectoryEntry( itemFullPath ) );
                        else if( statData.isFile( itemFullPath ) )
                            entries.push( new FileEntry( itemFullPath ) );
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

/** class: FileError
 *
 * Implementation of HTML file API error code return class. Note that the
 * various HTML file API specs are not consistent in their definition of
 * some error code values like ABORT_ERR; I'm using the definitions from
 * the Directories and System spec since it seems to be the most
 * comprehensive.
 *
 * @constructor
 * @param {number} code The error code to return with this FileError. Must be
 * one of the codes defined in the FileError class.
 */
FileError = function(code) {
    this.code = code || 0;
};

// FileSaver constants
Object.defineProperties(FileError,
    { NOT_FOUND_ERR:                { value: 1 }
    , SECURITY_ERR:                 { value: 2 }
    , ABORT_ERR:                    { value: 3 }
    , NOT_READABLE_ERR:             { value: 4 }
    , ENCODING_ERR:                 { value: 5 }
    , NO_MODIFICATION_ALLOWED_ERR:  { value: 6 }
    , INVALID_STATE_ERR:            { value: 7 }
    , SYNTAX_ERR:                   { value: 8 }
    , INVALID_MODIFICATION_ERR:     { value: 9 }
    , QUOTA_EXCEEDED_ERR:           { value: 10 }
    , TYPE_MISMATCH_ERR:            { value: 11 }
    , PATH_EXISTS_ERR:              { value: 12 }
});