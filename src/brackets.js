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
});
