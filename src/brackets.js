/* TODO: copyright notice, etc. */

$(document).ready(function() {

    var myCodeMirror = CodeMirror($('#editor').get(0), {
        value: 'var myResponse="Yes, it will be!"\n'
    });

    // Set the "inBrowser" flag
    var inBrowser = !window.hasOwnProperty("brackets");


    // Temporary button to test file directory traversa;
    $("#menu-file-open").click(function(){
        if (!inBrowser) {
            window.NativeFileSystem.showOpenDialog( false, true, "Choose a folder",
                                                    null, null,
                                                    showOpenDialogSuccessCallback,
                                                    showOpenDialogErrorCallback);
        }
    });
    
    
    // Ty test code hooked up to "new" menu. Test reads a file and prints its constents to the log.
    // uncomment to test
    /*$("#menu-file-new").click(function(){
        var fileEntry = new brackets.fs.FileEntry( "/Users/tvoliter/github/brackets-app/README.md" );
        var file;
        fileEntry.file( function( f ){
                file = f;
            });

        var reader = new brackets.fs.FileReader();
        reader.onerror = errorHandler;
        
        reader.onabort = function(e) {
          alert('File read cancelled');
        };
                    
        reader.onloadstart = function(e) {
          console.log( "loading" );
        };
        
        reader.onload = function ( event ){
            console.log( event.target.result );
        };
        
    
        // Read in the image file as a binary string.
        reader.readAsText(file);
        
        
        function errorHandler(evt) {
            switch(evt.target.error.code) {
              case evt.target.error.NOT_FOUND_ERR:
                alert('File Not Found!');
                break;
              case evt.target.error.NOT_READABLE_ERR:
                alert('File is not readable');
                break;
              case evt.target.error.ABORT_ERR:
                break; // noop
              default:
                alert('An error occurred reading this file.');
            };
        }
    });*/
    
    
    // Implements the 'Run Tests' menu to bring up the Jasmine unit test window
    var testWindow = null;
    $("#menu-runtests").click(function(){
        if (!(testWindow === null)) {
            try {
                testWindow.location.reload();
            } catch(e) {
                testWindow = null;  // the window was probably closed
            } 
        }
        
        if (testWindow === null) {
            testWindow = window.open("../test/SpecRunner.html");
            testWindow.location.reload(); // if it was opened before, we need to reload because it will be cached
        }
    });

    function showOpenDialogErrorCallback( err ){
        console.log( err )
    }

    function showOpenDialogSuccessCallback( files ) {
        var folderName = files instanceof Array ? files[0] : files;
        var nestingLevel = 0;
    
        if (folderName != "") {
            window.NativeFileSystem.requestNativeFileSystem( folderName, 
                                                                             requestNativeFileSystemSuccessCB, requestNativeFileSystemErrorCB ); 
                    
            
        }
        
        function requestNativeFileSystemSuccessCB( rootEntry ){
            var nestingLevel = 0;
                    
            if( rootEntry && rootEntry.isDirectory )
                readDirectory( rootEntry );
        }
        
        function requestNativeFileSystemErrorCB( err){
            console.log( err );
        }
        
        
        // Test directory traversal
        function readDirectory( entry ){
            
            var reader = entry.createReader();
            reader.readEntries( dirReaderSuccessCB, dirReaderErrorCB);
        }
        
        function dirReaderSuccessCB( entries ){
            var tabs = "";
            for( i = 0; i < nestingLevel; i++ ){
                tabs += "  ";
            }
        
            for ( var entryI in entries ){
                var entry = entries[entryI];
                if( entry.isFile ){
                    // create leaf tree node using entry.name
                    console.log( tabs+ entry.name );
                }
                else if ( entry.isDirectory ){
                    // create branch tree node using entry.name
                    console.log( tabs + entry.name );
                    
                    nestingLevel++;
                    readDirectory( entry )
                }
            }
        }
        
        function dirReaderErrorCB() {
            // handle error
        }
    }
            
});
