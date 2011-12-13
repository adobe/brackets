/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

// Define core brackets namespace
brackets = window.brackets || {};

brackets.inBrowser = !brackets.hasOwnProperty("file");


$(document).ready(function() {

    var myCodeMirror = CodeMirror($('#editor').get(0), {
        value: 'var myResponse="Yes, it will be!"\n'
    });

	if (brackets.inBrowser) {
		ProjectManager.loadProject("DummyProject");
	} else {
		// TODO: what is default project when in app shell ??
	}
	
	$("#btn-open-project").click(function() {
		ProjectManager.openProject();
	});

    // Temporary button to test file directory traversal
    $("#menu-file-open").click(function(){
        if (!brackets.inBrowser) {
            window.NativeFileSystem.showOpenDialog(false, true, "Choose a folder", null, null, showOpenDialogCallback);
        }
    });
    
    function showOpenDialogCallback( files ) {
        var folderName = files instanceof Array ? files[0] : files;
    
    }

});
