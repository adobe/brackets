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
        // If we've undone past the undo position at the last save, and there is no redo stack,
        // then we can never get back to a non-dirty state.
        var historySize = editor.historySize();
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
        $("#main-toolbar .title").text(_currentTitlePath ? (_currentTitlePath + (_isDirty ? " \u2022" : "")) : "Untitled");
    }
    
    function doOpenWithOptionalPath(fullPath) {     
        if (!fullPath) {
            // Prompt the user with a dialog
            // TODO: we're relying on this to not be asynchronous--is that safe?
            NativeFileSystem.showOpenDialog(false, false, "Open File", ProjectManager.getProjectRoot().fullPath, 
                ["htm", "html", "js", "css"], function(files) {
                    if (files.length > 0) {
                        return doOpen(files[0]);
                    }
                });
        }
        else {
            return doOpen(fullPath);
        }
    }
    
    function doOpen(fullPath) { 
        var result = $.Deferred();         
        if (fullPath) {
            var reader = new NativeFileSystem.FileReader();

            // TODO: we should implement something like NativeFileSystem.resolveNativeFileSystemURL() (similar
            // to what's in the standard file API) to get a FileEntry, rather than manually constructing it
            var fileEntry = new NativeFileSystem.FileEntry(fullPath);
            
            // TODO: it's weird to have to construct a FileEntry just to get a File.
            fileEntry.file(function(file) {                
                reader.onload = function(event) {
                    _currentFilePath = _currentTitlePath = fullPath;
                    
                    // TODO: have a real controller object for the editor
                    editor.setValue(event.target.result);
                    editor.clearHistory();

                    // In the main toolbar, show the project-relative path (if the file is inside the current project)
                    // or the full absolute path (if it's not in the project).
                    var projectRootPath = ProjectManager.getProjectRoot().fullPath;
                    if (projectRootPath.length > 0 && projectRootPath.charAt(projectRootPath.length - 1) != "/") {
                        projectRootPath += "/";
                    }
                    if (fullPath.indexOf(projectRootPath) == 0) {
                        _currentTitlePath = fullPath.slice(projectRootPath.length);
                        if (_currentTitlePath.charAt(0) == '/') {
                            _currentTitlePath = _currentTitlePath.slice(1);
                        }                          
                    }
                    
                    // Make sure we can't undo back to the previous content.
                    editor.clearHistory();
                    
                    // This should be 0, but just to be safe...
                    _savedUndoPosition = editor.historySize().undo;
                    updateDirty();

                    editor.focus();
                    result.resolve();
                };
                
                reader.onerror = function(event) {
                    // TODO: display meaningful error
                    result.reject();
                }
                
                reader.readAsText(file, "utf8");
            },
            function (error) {
                // TODO: display meaningful error
                result.reject();
            });
        }
        return result;
    }
    
    function doClose() {
        // TODO: When we implement multiple files being open, this will probably change to just
        // dispose of the editor for the current file (and will later change again if we choose to
        // limit the number of open editors).
        editor.setValue("");
        editor.clearHistory();
        _currentFilePath = _currentTitlePath = null;
        _savedUndoPosition = 0;
        _isDirty = false;
        updateTitle();
        editor.focus();
    }
    
    // Register global commands
    CommandManager.register(Commands.FILE_OPEN, function(fullPath) {
        // TODO: In the future, when we implement multiple open files, we won't close the previous file when opening
        // a new one. However, for now, since we only support a single open document, I'm pretending as if we're 
        // closing the existing file first. This is so that I can put the code that checks for an unsaved file and 
        // prompts the user to save it in the close command, where it belongs. When we implement multiple open files,
        // we can remove this here.
        if (_currentFilePath) {
            var result = $.Deferred();
            CommandManager
                .execute(Commands.FILE_CLOSE)
                .done(function() {
                    doOpenWithOptionalPath(fullPath)
                        .done(function() {
                            result.resolve();
                        })
                        .fail(function() {
                            result.reject();
                        });
                })
                .fail(function() {
                    result.reject();
                });
            return result;
        }
        else {
            return doOpenWithOptionalPath(fullPath);
        }
    });

    CommandManager.register(Commands.FILE_SAVE, function() {
        var result = $.Deferred();
        if (_currentFilePath && _isDirty) {
            // TODO: we should implement something like NativeFileSystem.resolveNativeFileSystemURL() (similar
            // to what's in the standard file API) to get a FileEntry, rather than manually constructing it
            var fileEntry = new NativeFileSystem.FileEntry(_currentFilePath);
            
            fileEntry.createWriter(function(writer) {
                writer.onwrite = function() {
                    _savedUndoPosition = editor.historySize().undo;
                    updateDirty();
                    result.resolve();
                }
                writer.onerror = function() {
                    result.reject();
                }
                writer.write(editor.getValue());
            },
            function(error) {
                // TODO: display meaningful error
                result.reject();
            });
        }
        else {
            result.resolve();
        }
        result.always(function() { 
            editor.focus(); 
        });
        return result;
    });
    
    CommandManager.register(Commands.FILE_CLOSE, function() {
        if (_currentFilePath && _isDirty) {
            var result = $.Deferred();
            brackets.showModalDialog(
                  brackets.DIALOG_ID_SAVE_CLOSE
                , brackets.strings.SAVE_CLOSE_TITLE
                , brackets.strings.format(brackets.strings.SAVE_CLOSE_MESSAGE, _currentTitlePath)
            ).done(function(id) {
                if (id === brackets.DIALOG_BTN_CANCEL) {
                    result.reject();
                }
                else {
                    if (id === brackets.DIALOG_BTN_OK) {
                        CommandManager
                            .execute(Commands.FILE_SAVE)
                            .done(function() {
                                doClose();
                                result.resolve();
                            })
                            .fail(function() {
                                result.reject();
                            });
                    }   
                    else {
                        // This is the "Don't Save" case--we can just go ahead and close the file.
                        doClose();
                        result.resolve();
                    }
                }
            });
            return result;
        }
        else {
            doClose();
        }
    });
    
    // Register keymaps and install the keyboard handler
    // TODO: show keyboard equivalents in the menus
    var KEYMAP_GLOBAL = "global";
    KeyBindingManager.registerKeymap(new KeyMap(KEYMAP_GLOBAL, 0, 
        { "Ctrl-O": Commands.FILE_OPEN
        , "Ctrl-S": Commands.FILE_SAVE
        , "Ctrl-W": Commands.FILE_CLOSE
        }));
    KeyBindingManager.activateKeymap(KEYMAP_GLOBAL);
    
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
});
