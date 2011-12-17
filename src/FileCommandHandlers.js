/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * Handlers for commands related to file handling (opening, saving, etc.)
 */
var FileCommandHandlers = (function() {
    // TODO: remove this and use the real exports variable when we switch to modules.
    var exports = {};
    
    var _editor, _title, _currentFilePath, _currentTitlePath,
        _isDirty = false,
        _savedUndoPosition = 0;
    
    exports.init = function init(editor, title) {
        _editor = editor;
        _title = title;
        
        _editor.setOption("onChange", function() {
            updateDirty();
        });
    
        // Register global commands
        CommandManager.register(Commands.FILE_OPEN, handleFileOpen);
        CommandManager.register(Commands.FILE_SAVE, handleFileSave);
        CommandManager.register(Commands.FILE_CLOSE, handleFileClose);
    };
    
    exports.getEditor = function getEditor() {
        return _editor;
    };

    function updateDirty() {
        // If we've undone past the undo position at the last save, and there is no redo stack,
        // then we can never get back to a non-dirty state.
        var historySize = _editor.historySize();
        if (historySize.undo < _savedUndoPosition && historySize.redo == 0) {
            _savedUndoPosition = -1;
        }
        var newIsDirty = (_editor.historySize().undo != _savedUndoPosition);
        if (_isDirty != newIsDirty) {
            _isDirty = newIsDirty;
            updateTitle();
        }        
    }
    
    function updateTitle() {
        _title.text(
            _currentTitlePath 
                ? (_currentTitlePath + (_isDirty ? " \u2022" : "")) 
                : "Untitled"
        );
    }
    
    function handleFileOpen(fullPath) {
        // TODO: In the future, when we implement multiple open files, we won't close the previous file when opening
        // a new one. However, for now, since we only support a single open document, I'm pretending as if we're 
        // closing the existing file first. This is so that I can put the code that checks for an unsaved file and 
        // prompts the user to save it in the close command, where it belongs. When we implement multiple open files,
        // we can remove this here.
        var result; 
        if (_currentFilePath) {
            result = new $.Deferred();
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
        }
        else {
            result = doOpenWithOptionalPath(fullPath);
        }
        result.always(function() { 
            _editor.focus(); 
        });
        return result;
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
        var result = new $.Deferred();         
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
                    _editor.setValue(event.target.result);
                    _editor.clearHistory();

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
                    _editor.clearHistory();
                    
                    // This should be 0, but just to be safe...
                    _savedUndoPosition = _editor.historySize().undo;
                    updateDirty();

                    _editor.focus();
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
    
    function handleFileSave() {
        var result = new $.Deferred();
        if (_currentFilePath && _isDirty) {
            // TODO: we should implement something like NativeFileSystem.resolveNativeFileSystemURL() (similar
            // to what's in the standard file API) to get a FileEntry, rather than manually constructing it
            var fileEntry = new NativeFileSystem.FileEntry(_currentFilePath);
        
            fileEntry.createWriter(
                function(writer) {
                    writer.onwrite = function() {
                        _savedUndoPosition = _editor.historySize().undo;
                        updateDirty();
                        result.resolve();
                    }
                    writer.onerror = function() {
                        result.reject();
                    }
                    writer.write(_editor.getValue());
                },
                function(error) {
                    // TODO: display meaningful error
                    result.reject();
                }
            );
        }
        else {
            result.resolve();
        }
        result.always(function() { 
            _editor.focus(); 
        });
        return result;
    }
    
    function handleFileClose() {
        if (_currentFilePath && _isDirty) {
            var result = new $.Deferred();
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
            result.always(function() { 
                _editor.focus(); 
            });
            return result;
        }
        else {
            doClose();
            _editor.focus();
        }
    }
    
    function doClose() {
        // TODO: When we implement multiple files being open, this will probably change to just
        // dispose of the editor for the current file (and will later change again if we choose to
        // limit the number of open editors).
        _editor.setValue("");
        _editor.clearHistory();
        _currentFilePath = _currentTitlePath = null;
        _savedUndoPosition = 0;
        _isDirty = false;
        updateTitle();
        _editor.focus();
    }
    
    return exports;
})();

