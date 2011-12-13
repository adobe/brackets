/* TODO: copyright notice, etc. */

// Define core brackets namespace
brackets = {};

brackets.inBrowser = false;	// FIXME: check for Brackets API availability


$(document).ready(function() {

    var myCodeMirror = CodeMirror($('#editor').get(0), {
        value: 'var myResponse="Yes, it will be!"\n'
    });

	ProjectManager.loadProject("DummyProject");


    // Temporary button to test file directory traversal
    $("#menu-file-open").click(function(){
        if (!brackets.inBrowser) {
            window.ProjectManager.showOpenDialog(false, true, "Choose a folder", null, null,showOpenDialogCallback);
        }
    });
    
    function showOpenDialogCallback( files ) {
    
    
        var folderName = files instanceof Array ? files[0] : files;
    
        if (folderName != "")
            var rootEntry = window.ProjectManager.requestNativeFileSystem( folderName, null, null ); // TODO: add callbacks
                    
        var nestingLevel = 0;
                    
        if( rootEntry.isDirectory )
            readDirectory( rootEntry )
        
        
        
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
