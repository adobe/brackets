/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

// Define core brackets namespace
brackets = window.brackets || {};

brackets.inBrowser = !brackets.hasOwnProperty("fs");


$(document).ready(function() {

    var editor = CodeMirror($('#editor').get(0));

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
    
    // Implements the "Open File" menu
    $("#menu-file-open").click(function() {
        CommandManager.execute(Commands.FILE_OPEN);
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

    // Utility functions
    function doOpen(fullPath) {          
        if (fullPath) {
            // TODO: use higher-level file API instead of raw API
            brackets.fs.readFile(fullPath, "utf8", function(err, content) {
                if (err) {
                    // TODO--this will change with the real file API implementation
                }
                else {
                    // TODO: have a real controller object for the editor
                    editor.setValue(content);

                    // In the titlebar, show the project-relative path (if the file is inside the current project)
                    // or the full absolute path (if it's not in the project).
                    var projectRootPath = ProjectManager.getProjectRoot().fullPath;
                    if (projectRootPath.length > 1 && projectRootPath.charAt(projectRootPath.length - 1) != "/") {
                        projectRootPath += "/";
                    }
                    if (fullPath.indexOf(projectRootPath) == 0) {
                        fullPath = fullPath.slice(projectRootPath.length);
                        if (fullPath.charAt(0) == '/') {
                            fullPath = fullPath.slice(1);
                        }                          
                    }
                    $("#main-toolbar .title").text(fullPath);
                }
            });
        }
    }
    
    // Register global commands
    CommandManager.register(Commands.FILE_OPEN, function(fullPath) {
        if (!fullPath) {
            // Prompt the user with a dialog
            NativeFileSystem.showOpenDialog(false, false, "Open File", ProjectManager.getProjectRoot().fullPath, 
                ["htm", "html", "js", "css"], function(files) {
                    if (files.length > 0) {
                        doOpen(files[0]);
                    }
                });
        }
        else {
            doOpen(fullPath);
        }
    });

});
