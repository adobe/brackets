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
    
    // Implements the File menu items
    $("#menu-file-open").click(function() {
        CommandManager.execute(Commands.FILE_OPEN);
    });
    $("#menu-file-save").click(function() {
        CommandManager.execute(Commands.FILE_SAVE);
    })
    
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
    
    // Application state
    // TODO: factor this stuff out into a real app controller
    var _currentFilePath = null;
    var _currentTitlePath = null;
    var _isDirty = false;
    var _savedUndoPosition = 0;
    
    editor.setOption("onChange", function() {
        updateDirty();
    });

    // Utility functions
    function updateDirty() {
        // TODO: This doesn't currently work properly with undo because of brackets-app issue #9.
        // So files get dirty, but they never get un-dirty.
        
        // If we've undone past the undo position at the last save, and there is no redo stack,
        // then we can never get back to non-dirty state.
        var historySize = editor.historySize();
        var historyInfo = editor.historyInfo();
        console.log(JSON.stringify(historyInfo));
        if (historySize.undo < _savedUndoPosition && historySize.redo == 0) {
            _savedUndoPosition = -1;
        }
        var newIsDirty = (editor.historySize().undo != _savedUndoPosition);
        if (_isDirty != newIsDirty) {
            _isDirty = newIsDirty;
            updateTitle();
        }        
    }
    
    function updateTitle() {
        $("#main-toolbar .title").text(_currentTitlePath + (_isDirty ? " \u2022" : ""));
    }
    
    function doOpen(fullPath) {          
        if (fullPath) {
            // TODO: use higher-level file API instead of raw API
            brackets.fs.readFile(fullPath, "utf8", function(err, content) {
                if (err) {
                    // TODO--this will change with the real file API implementation
                }
                else {
                    _currentFilePath = _currentTitlePath = fullPath;
                    
                    // TODO: have a real controller object for the editor
                    editor.setValue(content);

                    var projectRootPath = ProjectManager.getProjectRoot().fullPath;
                    if (fullPath.indexOf(projectRootPath) == 0) {
                        fullPath = fullPath.slice(projectRootPath.length);
                        if (fullPath.charAt(0) == '/') {
                            _currentTitlePath = fullPath.slice(1);
                        }                          
                    }
                    editor.clearHistory();
                    _savedUndoPosition = editor.historySize().undo;
                    updateDirty();
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

    CommandManager.register(Commands.FILE_SAVE, function() {
        if (_currentFilePath && _isDirty) {
            brackets.fs.writeFile(_currentFilePath, editor.getValue(), "utf8", function(err) {
                if (err) {
                    // TODO--this will change with the real file API implementation
                }
                else {
                    _savedUndoPosition = editor.historySize().undo;
                    updateDirty();
                }
            });
        }
    });
});
