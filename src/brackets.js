/* TODO: copyright notice, etc. */

// Define core brackets namespace
brackets = {};

brackets.inBrowser = true;	// FIXME: check for Brackets API availability


$(document).ready(function() {

	var myCodeMirror = CodeMirror($('#editor').get(0), {
		value: 'var myResponse="Yes, it will be!"\n'
	});

	ProjectManager.loadProject("DummyProject");

	
	// Temporary button to test file directory traversal
	$("#open-folder").click(function(){
		if (!inBrowser) {
			var foldername = "/Users/tvoliter/github/brackets-app/brackets"; // brackets.file.showOpenPanel(false, true, "Choose a folder");
			
			if (foldername != "")
				var rootEntry = window.ProjectManager.requestNativeFileSystem( foldername, null, null ); // TODO: add callbacks
						
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
	
});
