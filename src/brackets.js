/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

// TODO: break out the definition of brackets into a separate module from the application controller logic

// Define core brackets namespace
brackets = window.brackets || {};

brackets.inBrowser = !brackets.hasOwnProperty("fs");

brackets.DIALOG_BTN_CANCEL = "cancel";
brackets.DIALOG_BTN_OK = "ok";
brackets.DIALOG_BTN_DONTSAVE = "dontsave";

brackets.DIALOG_ID_ERROR = "error-dialog";
brackets.DIALOG_ID_SAVE_CLOSE = "save-close-dialog";

/**
 * General purpose modal dialog. Assumes that the HTML for the dialog contains elements with "title"
 * and "message" classes, as well as a number of elements with "dialog-button" class, each of which has
 * a "data-button-id".
 *
 * @param {string} id The ID of the dialog node in the HTML.
 * @param {string} title The title of the error dialog. Can contain HTML markup.
 * @param {string} message The message to display in the error dialog. Can contain HTML markup.
 * @return {Deferred} a $.Deferred() that will be resolved with the ID of the clicked button when the dialog
 *     is dismissed.
 */
brackets.showModalDialog = function(id, title, message, callback) {
    var result = $.Deferred();
    var dlg = $("#" + id);
    
    // Set title and message
    $(".dialog-title", dlg).html(title);
    $(".dialog-message", dlg).html(message);
    
    // Click handler for buttons
    dlg.on("click", ".dialog-button", function(e) {
        result.resolve($(this).attr("data-button-id"));
        dlg.modal(true).hide();
    });
    
    // Run the dialog
    dlg.modal(
        { backdrop: "static" 
        , show: true
        }
    );
    return result;
};

$(document).ready(function() {

    var editor = CodeMirror($('#editor').get(0));
    
    initProject();
    initMenus();
    initCommandHandlers();
    initKeyBindings();
    
    function initProject() {    
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
    }
 
    function initMenus() {
        // Implements the File menu items
        $("#menu-file-new").click(function() {
            CommandManager.execute(Commands.FILE_NEW);
        });
        $("#menu-file-open").click(function() {
            CommandManager.execute(Commands.FILE_OPEN);
        });
        $("#menu-file-close").click(function() {
            CommandManager.execute(Commands.FILE_CLOSE);
        });
        $("#menu-file-save").click(function() {
            CommandManager.execute(Commands.FILE_SAVE);
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
    }
    
    function initCommandHandlers() {    
        FileCommandHandlers.init(editor, $("#main-toolbar .title"));
    }
    
    function initKeyBindings() {
        // Register keymaps and install the keyboard handler
        // TODO: show keyboard equivalents in the menus
        var _globalKeymap = new KeyMap(
            { "Ctrl-O": Commands.FILE_OPEN
            , "Ctrl-S": Commands.FILE_SAVE
            , "Ctrl-W": Commands.FILE_CLOSE
            }
        );
        KeyBindingManager.installKeymap(_globalKeymap);
    
        $(document.body).keydown(function(event) {
            var keyDescriptor = [];
            if (event.metaKey || event.ctrlKey) {
                keyDescriptor.push("Ctrl");
            }
            if (event.altKey) {
                keyDescriptor.push("Alt");
            }
            if (event.shiftKey) {
                keyDescriptor.push("Shift");
            }
            keyDescriptor.push(String.fromCharCode(event.keyCode).toUpperCase());
            if (KeyBindingManager.handleKey(keyDescriptor.join("-"))) {
                event.preventDefault();
            }
        });
    }
});
