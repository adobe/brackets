/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    // Load dependent modules
    var CommandManager      = require("CommandManager")
    ,   Commands            = require("Commands")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ,   ProjectManager      = require("ProjectManager")
    ,   Strings             = require("strings")
    ,   EditorUtils         = require("EditorUtils")
    ;
     
    /**
     * Handlers for commands related to file handling (opening, saving, etc.)
     */
      
    var _editor, _title, _currentFilePath, _currentTitlePath,
        _isDirty = false,
        _savedUndoPosition = 0;

    function init(editor, title) {
        _editor = editor;
        _title = title;

        _editor.setOption("onChange", function() {
            updateDirty();
        });

        // Register global commands
        CommandManager.register(Commands.FILE_OPEN, handleFileOpen);
        // TODO: For now, hook up File > New to the "new in project" handler. Eventually
        // File > New should open a new blank tab, and handleFileNewInProject should
        // be called from a "+" button in the project
        CommandManager.register(Commands.FILE_NEW, handleFileNewInProject);
        CommandManager.register(Commands.FILE_SAVE, handleFileSave);
        CommandManager.register(Commands.FILE_CLOSE, handleFileClose);
    };

    exports.getEditor = function getEditor() {
        return _editor;
    };

    exports.isDirty = function isDirty() {
        return _isDirty;
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
        var result;
        if (!fullPath) {
            // Prompt the user with a dialog
            // TODO: we're relying on this to not be asynchronous--is that safe?
            NativeFileSystem.showOpenDialog(false, false, Strings.OPEN_FILE, ProjectManager.getProjectRoot().fullPath,
                ["htm", "html", "js", "css"], function(files) {
                    if (files.length > 0) {
                        result = doOpen(files[0]);
                        return;
                    }
                });
        }
        else {
            result = doOpen(fullPath);
        }
        if (!result)
            result = (new $.Deferred()).reject();
        return result;
    }

    function doOpen(fullPath) {
        var result = new $.Deferred();
        if (!fullPath) {
            console.log("doOpen() called without fullPath");
            return result.reject();
        }

        var reader = new NativeFileSystem.FileReader();

        // TODO: we should implement something like NativeFileSystem.resolveNativeFileSystemURL() (similar
        // to what's in the standard file API) to get a FileEntry, rather than manually constructing it
        var fileEntry = new NativeFileSystem.FileEntry(fullPath);

        // TODO: it's weird to have to construct a FileEntry just to get a File.
        fileEntry.file(function(file) {
            reader.onload = function(event) {
                _currentFilePath = _currentTitlePath = fullPath;

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

                EditorUtils.setModeFromFileExtension(_editor, _currentFilePath);

                // TODO: have a real controller object for the editor
                _editor.setValue(event.target.result);

                // Make sure we can't undo back to the previous content.
                _editor.clearHistory();

                // This should be 0, but just to be safe...
                _savedUndoPosition = _editor.historySize().undo;
                updateDirty();

                result.resolve();
            };

            reader.onerror = function(event) {
                showFileOpenError(event.target.error.code, fullPath);
                result.reject();
            }

            reader.readAsText(file, "utf8");
        },
        function fileEntry_onerror(event) {
            showFileOpenError(event.target.error.code, fullPath);
            result.reject();
        });

        return result;
    }
    
    function handleFileNewInProject() {
        // Determine the directory to put the new file
        // If a file is currently selected, put it next to it.
        // If a directory is currently selected, put it in it.
        // If nothing is selected, put it at the root of the project
        var baseDir, 
            selected = ProjectManager.getSelectedItem() || ProjectManager.getProjectRoot();
        
        baseDir = selected.fullPath;
        if (selected.isFile) 
            baseDir = baseDir.substr(0, baseDir.lastIndexOf("/"));
        
        // Create the new node. The createNewItem function does all the heavy work
        // of validating file name, creating the new file and selecting.
        var deferred = _getUntitledFileSuggestion(baseDir, "Untitled", ".js");
		var createWithSuggestedName = function ( suggestedName ) {
			ProjectManager.createNewItem(baseDir, suggestedName, false).pipe( deferred.resolve, deferred.reject, deferred.notify );
		};
		
		deferred.done( createWithSuggestedName );
		deferred.fail( function createWithDefault() { createWithSuggestedName( "Untitled.js" ); } );
        return deferred;
    }
    
    function handleFileSave() {
        var result = new $.Deferred();
        if (_currentFilePath && _isDirty) {
            // TODO: we should implement something like NativeFileSystem.resolveNativeFileSystemURL() (similar
            // to what's in the standard file API) to get a FileEntry, rather than manually constructing it
            var fileEntry = new NativeFileSystem.FileEntry(_currentFilePath);

            fileEntry.createWriter(
                function(writer) {
                    writer.onwriteend = function() {
                        _savedUndoPosition = _editor.historySize().undo;
                        updateDirty();
                        result.resolve();
                    }
                    writer.onerror = function(event) {
                        showSaveFileError(event.target.error.code, _currentFilePath);
                        result.reject();
                    }

                    // TODO (jasonsj): Blob instead of string
                    writer.write(_editor.getValue());
                },
                function(event) {
                    showSaveFileError(event.target.error.code, _currentFilePath);
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
        var result = new $.Deferred();
        if (_currentFilePath && _isDirty) {
            brackets.showModalDialog(
                  brackets.DIALOG_ID_SAVE_CLOSE
                , Strings.SAVE_CLOSE_TITLE
                , Strings.format(Strings.SAVE_CLOSE_MESSAGE, _currentTitlePath)
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
        }
        else {
            doClose();
            _editor.focus();
            result.resolve();
        }
        return result;
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

    function showFileOpenError(code, path) {
        brackets.showModalDialog(
              brackets.DIALOG_ID_ERROR
            , Strings.ERROR_OPENING_FILE_TITLE
            , Strings.format(
                    Strings.ERROR_OPENING_FILE
                  , path
                  , getErrorString(code))
        );
    }

    function showSaveFileError(code, path) {
        brackets.showModalDialog(
              brackets.DIALOG_ID_ERROR
            , Strings.ERROR_SAVING_FILE_TITLE
            , Strings.format(
                    Strings.ERROR_SAVING_FILE
                  , path
                  , getErrorString(code))
        );
    }

    function getErrorString(code) {
        // There are a few error codes that we have specific error messages for. The rest are
        // displayed with a generic "(error N)" message.
        var result;

        if (code == FileError.NOT_FOUND_ERR)
            result = Strings.NOT_FOUND_ERR;
        else if (code == FileError.NOT_READABLE_ERR)
            result = Strings.NOT_READABLE_ERR;
        else if (code == FileError.NO_MODIFICATION_ALLOWED_ERR)
            result = Strings.NO_MODIFICATION_ALLOWED_ERR;
        else
            result = Strings.format(Strings.GENERIC_ERROR, code);

        return result;
    }

    /**
     * @private
     * Ensures the suggested file name doesn't already exit.
     * @param {string} dir  The directory to use
     * @param {string} baseFileName  The base to start with, "-n" will get appened to make unique
     * @param {string} fileExt  The file extension
     */
    function _getUntitledFileSuggestion( dir, baseFileName, fileExt ) {
        var result = new $.Deferred();
        var suggestedName = baseFileName + fileExt;
        var dirEntry = new NativeFileSystem.DirectoryEntry(dir);

        result.progress( function attemptNewName( suggestedName, nextIndexToUse ) {
            if( nextIndexToUse > 99 ) {
                //we've tried this enough
                result.reject();
                return;
            }

            //check this name
            dirEntry.getFile( suggestedName
                            , {}
                            , function successCallback(entry){
                                //file exists, notify to the next progress
                                result.notify(baseFileName + "-" + nextIndexToUse + fileExt , nextIndexToUse + 1);
                                }
                             , function errorCallback(error) {
                                //most likely error is FNF, user is better equiped to handle the rest
                                result.resolve(suggestedName);
                                }
                            );
        });

        //kick it off
        result.notify(fileName, 1);

        return result;
    }

    // Define public API
    exports.init = init;
});

