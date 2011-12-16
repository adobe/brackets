/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

// Define core brackets namespace
brackets = window.brackets || {};

brackets.inBrowser = !brackets.hasOwnProperty("fs");


$(document).ready(function() {

    /**
     * General purpose modal error dialog. 
     *
     * @param {string} title The title of the error dialog. Can contain HTML markup.
     * @param {string} message The message to display in the error dialog. Can contain HTML markup.
     */
    brackets.showErrorDialog = function(title, message) {
        var dlg = $("#error-dialog");
        
        // Set title and message
        $("#error-dialog-title").html(title);
        $("#error-dialog-message").html(message);
        
        // Click handler for OK button
        dlg.delegate("#error-dialog-ok", "click", function(e) {
            dlg.modal(true).hide();
        });
        
        // Run the dialog
        dlg.modal(
            { backdrop: "static" 
            , show: true
            }
        );
    }

    var editor = CodeMirror($('#editor').get(0));

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
    
    // Ty test code hooked up to "new" menu. Test reads a file and prints its constents to the log.
    // uncomment to test
    /*$("#menu-file-new").click(function(){
        var fileEntry = new NativeFileSystem.FileEntry( "/Users/tvoliter/github/brackets-app/README.md" );
        var file;
        fileEntry.file( function( file ){
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
            reader.readAsText(file, "utf8");
        
        
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
        });
    });*/

    // Utility functions
    function doOpen(fullPath) {          
        if (fullPath) {
            var reader = new NativeFileSystem.FileReader();

            // TODO: we should implement something like NativeFileSystem.resolveNativeFileSystemURL() (similar
            // to what's in the standard file API) to get a FileEntry, rather than manually constructing it
            var fileEntry = new NativeFileSystem.FileEntry(fullPath);
            
            // TODO: it's weird to have to construct a FileEntry just to get a File.
            fileEntry.file(function(file) {                
                reader.onload = function(event) {
                    // TODO: have a real controller object for the editor
                    editor.setValue(event.target.result);
                    editor.clearHistory();

                    // In the titlebar, show the project-relative path (if the file is inside the current project)
                    // or the full absolute path (if it's not in the project).
                    var projectRootPath = ProjectManager.getProjectRoot().fullPath;
                    if (projectRootPath.length > 0 && projectRootPath.charAt(projectRootPath.length - 1) != "/") {
                        projectRootPath += "/";
                    }
                    if (fullPath.indexOf(projectRootPath) == 0) {
                        fullPath = fullPath.slice(projectRootPath.length);
                        if (fullPath.charAt(0) == '/') {
                            fullPath = fullPath.slice(1);
                        }                          
                    }
                    $("#main-toolbar .title").text(fullPath);                    
                };
                reader.onerror = function(event) {
                    // TODO--display meaningful error
                }
                
                reader.readAsText(file, "utf8");
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
