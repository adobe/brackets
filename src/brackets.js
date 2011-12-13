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
            window.NativeFileSystem.showOpenDialog(false, true, "Choose a folder", null, null, showOpenDialogCallback);
        }
    });
    
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

    function showOpenDialogCallback( files ) {
        var folderName = files instanceof Array ? files[0] : files;
    
        if (folderName != "") {
            var rootEntry = window.NativeFileSystem.requestNativeFileSystem( folderName, null, null ); // TODO: add callbacks
                    
            var nestingLevel = 0;
                    
            if( rootEntry.isDirectory )
                readDirectory( rootEntry );
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
