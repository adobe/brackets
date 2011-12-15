/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

// Define core brackets namespace
brackets = window.brackets || {};

brackets.inBrowser = !brackets.hasOwnProperty("fs");


$(document).ready(function() {

    var myCodeMirror = CodeMirror($('#editor').get(0), {
        value: 'var myResponse="Yes, it will be!"\n'
    });

	// Load a default project into the tree
	if (brackets.inBrowser) {
	    // In browser: dummy folder tree (hardcoded in ProjectManager)
		ProjectManager.loadProject("DummyProject");
	} else {
	    // In app shell: load Brackets itself
	    var loadedPath = window.location.pathname;
	    var bracketsSrc = loadedPath.substr(0, loadedPath.lastIndexOf("/"));
	    ProjectManager.loadProject(bracketsSrc);
	}
	
	// Open project button
	$("#btn-open-project").click(function() {
		ProjectManager.openProject();
	});
    
    
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
    
        // Ty test code hooked up to "new" menu. Test reads a file and prints its constents to the log.
    // uncomment to test
    /*$("#menu-file-new").click(function(){
        var fileEntry = new NativeFileSystem.FileEntry( "/Users/tvoliter/github/brackets-app/README.md" );
        var file;
        fileEntry.file( function( f ){
                file = f;
            });

        var reader = new NativeFileSystem.FileReader();
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

});
