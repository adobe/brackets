/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, brackets: false, PathUtils: false */

define(function (require, exports, module) {
    'use strict';
    
    require("thirdparty/path-utils/path-utils.min");
    
    // Load dependent modules
    var CommandManager      = require("CommandManager"),
        Commands            = require("Commands"),
        NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        ProjectManager      = require("ProjectManager"),
        DocumentManager     = require("DocumentManager"),
        EditorManager       = require("EditorManager"),
        EditorUtils         = require("EditorUtils"),
        Strings             = require("strings");
    
    /**
     * Handlers for commands related to file handling (opening, saving, etc.)
     */
    
    /** @type {jQueryObject} */
    var _title;
    /** @type {string} */
    var _currentFilePath;  // TODO: eliminate this and just use getCurrentDocument().file.fullPath
    /** @type {string} */
    var _currentTitlePath;
    
    function updateTitle() {
        var currentDoc = DocumentManager.getCurrentDocument();
        if (currentDoc) {
            _title.text(_currentTitlePath + (currentDoc.isDirty ? " \u2022" : ""));
        } else {
            _title.text("");
        }
    }
    
    function handleCurrentDocumentChange() {
        var newDocument = DocumentManager.getCurrentDocument();
        
        if (newDocument) {
            var fullPath = newDocument.file.fullPath;
    
            _currentFilePath = _currentTitlePath = fullPath;

            // In the main toolbar, show the project-relative path (if the file is inside the current project)
            // or the full absolute path (if it's not in the project).
            _currentTitlePath = ProjectManager.makeProjectRelativeIfPossible(fullPath);
            
        } else {
            _currentFilePath = _currentTitlePath = null;
        }
        
        // Update title text & "dirty dot" display
        updateTitle();
    }
    
    function handleDirtyChange(event, changedDoc) {
        if (changedDoc.file.fullPath === _currentFilePath) {
            updateTitle();
        }
    }

    /**
     * @private
     * Creates a document and displays an editor for the specified file path.
     * @return {Deferred} a jQuery Deferred that will be resolved with a new 
     *  document for the specified file path, or rejected if the file can not be read.
     */
    function doOpen(fullPath) {
        
        var result = new $.Deferred();
        if (!fullPath) {
            console.log("doOpen() called without fullPath");
            return result.reject();
        }
        
        var doc = DocumentManager.getDocumentForPath(fullPath);
        if (doc) {
            // File already open - don't need to load it, just switch to it in the UI
            DocumentManager.showInEditor(doc);
            result.resolve(doc);
            
        } else {
            // File wasn't open before, so we must create a new document for it
            var fileEntry = new NativeFileSystem.FileEntry(fullPath);
            var docResult = EditorManager.createDocumentAndEditor(fileEntry);

            docResult.done(function (doc) {
                DocumentManager.showInEditor(doc);
                result.resolve(doc);
            });
            
            docResult.fail(function (error) {
                EditorUtils.showFileOpenError(error.code, fullPath);
                result.reject();
            });
        }

        return result;
    }
    
    /**
     * @private
     * Creates a document and displays an editor for the specified file path. 
     * If no path is specified, a file prompt is provided for input.
     * @return {Deferred} a jQuery Deferred that will be resolved with a new 
     *  document for the specified file path, or rejected if the file can not be read.
     */
    function doOpenWithOptionalPath(fullPath) {
        var result;
        if (!fullPath) {
            // Prompt the user with a dialog
            // TODO: we're relying on this to not be asynchronous--is that safe?
            NativeFileSystem.showOpenDialog(false, false, Strings.OPEN_FILE, ProjectManager.getProjectRoot().fullPath,
                ["htm", "html", "js", "css"], function (files) {
                    if (files.length > 0) {
                        result = doOpen(files[0]);
                        return;
                    }
                });
        } else {
            result = doOpen(fullPath);
        }
        if (!result) {
            result = (new $.Deferred()).reject();
        }
        return result;
    }

    function handleFileOpen(commandData) {
        var fullPath = null;
        if (commandData) {
            fullPath = commandData.fullPath;
        }
        
        var result = doOpenWithOptionalPath(fullPath);
        result.always(function () {
            EditorManager.focusEditor();
        });
        return result;
    }

    function handleFileAddToWorkingSet(commandData) {
        handleFileOpen(commandData).done(function (doc) {
            DocumentManager.addToWorkingSet(doc);
        });
    }

    /**
     * @private
     * Ensures the suggested file name doesn't already exit.
     * @param {string} dir  The directory to use
     * @param {string} baseFileName  The base to start with, "-n" will get appened to make unique
     * @param {string} fileExt  The file extension
     */
    function _getUntitledFileSuggestion(dir, baseFileName, fileExt) {
        var result = new $.Deferred();
        var suggestedName = baseFileName + fileExt;
        var dirEntry = new NativeFileSystem.DirectoryEntry(dir);

        result.progress(function attemptNewName(suggestedName, nextIndexToUse) {
            if (nextIndexToUse > 99) {
                //we've tried this enough
                result.reject();
                return;
            }

            //check this name
            dirEntry.getFile(
                suggestedName,
                {},
                function successCallback(entry) {
                    //file exists, notify to the next progress
                    result.notify(baseFileName + "-" + nextIndexToUse + fileExt, nextIndexToUse + 1);
                },
                function errorCallback(error) {
                    //most likely error is FNF, user is better equiped to handle the rest
                    result.resolve(suggestedName);
                }
            );
        });

        //kick it off
        result.notify(baseFileName + fileExt, 1);

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
        if (selected.isFile) {
            baseDir = baseDir.substr(0, baseDir.lastIndexOf("/"));
        }
        
        // Create the new node. The createNewItem function does all the heavy work
        // of validating file name, creating the new file and selecting.
        var deferred = _getUntitledFileSuggestion(baseDir, "Untitled", ".js");
        var createWithSuggestedName = function (suggestedName) {
            ProjectManager.createNewItem(baseDir, suggestedName, false).pipe(deferred.resolve, deferred.reject, deferred.notify);
        };

        deferred.done(createWithSuggestedName);
        deferred.fail(function createWithDefault() { createWithSuggestedName("Untitled.js"); });
        return deferred;
    }
    
    function showSaveFileError(code, path) {
        return brackets.showModalDialog(
            brackets.DIALOG_ID_ERROR,
            Strings.ERROR_SAVING_FILE_TITLE,
            Strings.format(
                Strings.ERROR_SAVING_FILE,
                path,
                EditorUtils.getFileErrorString(code)
            )
        );
    }
    
    function doSave(docToSave) {
        var result = new $.Deferred();
        
        if (docToSave && docToSave.isDirty) {
            var fileEntry = docToSave.file;
            
            //setup our resolve and reject handlers
            result.done(function fileSaved() {
                docToSave.notifySaved();
            });

            result.fail(function fileError(error) {
                showSaveFileError(error.code, fileEntry.fullPath);
            });

            fileEntry.createWriter(
                function (writer) {
                    writer.onwriteend = function () {
                        result.resolve();
                    };
                    writer.onerror = function (error) {
                        result.reject(error);
                    };

                    // TODO (jasonsj): Blob instead of string
                    writer.write(docToSave.getText());
                },
                function (error) {
                    result.reject(error);
                }
            );
        } else {
            result.resolve();
        }
        result.always(function () {
            EditorManager.focusEditor();
        });
        return result;
    }
    
    /**
     * Saves the given file. If no file specified, assumes the current document.
     * @param {?{doc: Document}} commandData  Document to close, or null
     * @return {$.Deferred}
     */
    function handleFileSave(commandData) {
        // Default to current document if doc is null
        var doc = null;
        if (commandData) {
            doc = commandData.doc;
        }
        if (!doc) {
            doc = DocumentManager.getCurrentDocument();
        }
        
        return doSave(doc);
    }
    
    /**
     * Saves all unsaved documents. Returns a Promise that will be resolved once ALL the save
     * operations have been completed. If any ONE save operation fails, an error dialog is immediately
     * shown and the promise fails.
     * TODO: But subsequent save operations continue in the background, and if more fail the error
     * dialogs will stack up on top of the old one.
     *
     * @return {$.Promise}
     */
    function saveAll() {
        var saveResults = [];
        
        DocumentManager.getWorkingSet().forEach(function (doc) {
            saveResults.push(doSave(doc));
        });
        
        // Aggregate all the file-save Deferreds into one master
        // (p.s., it would be nice if $.when() accepted an array instead of varargs, but oh well...)
        var overallResult = $.when.apply($, saveResults);
        
        return overallResult;
    }
    

    /**
     * Closes the specified document. Prompts user about saving file if document is dirty.
     *
     * @param {?{doc: Document}} commandData  Document to close; assumes the current document if null.
     * @param {boolean} promptOnly  If true, only displays the relevant confirmation UI and does NOT
     *          actually close the document. This is useful when chaining file-close together with
     *          other user prompts that may be cancelable.
     * @return {$.Deferred}
     */
    function handleFileClose(commandData) {
        var doc = null;
        if (commandData) {
            doc = commandData.doc;
        }
        
        // utility function for handleFileClose: closes document & removes from working set
        function doClose(doc) {
            if (!commandData || !commandData.promptOnly) {
                // This selects a different document if the working set has any other options
                DocumentManager.closeDocument(doc);
            
                EditorManager.focusEditor();
            }
        }
        
        
        var result = new $.Deferred();
        
        // Default to current document if doc is null
        if (!doc) {
            doc = DocumentManager.getCurrentDocument();
        }
        
        // No-op if called when nothing is open; TODO: should command be grayed out instead?
        if (!doc) {
            return;
        }
        
        if (doc.isDirty) {
            var filename = PathUtils.parseUrl(doc.file.fullPath).filename;
            
            brackets.showModalDialog(
                brackets.DIALOG_ID_SAVE_CLOSE,
                Strings.SAVE_CLOSE_TITLE,
                Strings.format(Strings.SAVE_CLOSE_MESSAGE, filename)
            ).done(function (id) {
                if (id === brackets.DIALOG_BTN_CANCEL) {
                    result.reject();
                } else if (id === brackets.DIALOG_BTN_OK) {
                    doSave(doc)
                        .done(function () {
                            doClose(doc);
                            result.resolve();
                        })
                        .fail(function () {
                            result.reject();
                        });
                } else {
                    // This is the "Don't Save" case--we can just go ahead and close the file.
                    doClose(doc);
                    result.resolve();
                }
            });
            result.always(function () {
                EditorManager.focusEditor();
            });
        } else {
            // Doc is not dirty, just close
            doClose(doc);
            EditorManager.focusEditor();
            result.resolve();
        }
        return result;
    }
    
    /**
     * Closes all open documents; equivalent to calling handleFileClose() for each document, except
     * that unsaved changes are confirmed once, in bulk.
     * @param {?{promptOnly: boolean}}  If true, only displays the relevant confirmation UI and does NOT
     *          actually close any documents. This is useful when chaining close-all together with
     *          other user prompts that may be cancelable.
     * @return {$.Deferred}
     */
    function handleFileCloseAll(commandData) {
        var result = new $.Deferred();
        
        var unsavedDocs = DocumentManager.getWorkingSet().filter(function (doc) {
            return doc.isDirty;
        });
        
        if (unsavedDocs.length === 0) {
            // No unsaved changes, so we can proceed without a prompt
            result.resolve();
            
        } else if (unsavedDocs.length === 1) {
            // Only one unsaved file: show the usual single-file-close confirmation UI
            var fileCloseArgs = { doc: unsavedDocs[0], promptOnly: commandData.promptOnly };
            handleFileClose(fileCloseArgs).done(function () {
                // still need to close any other, non-unsaved documents
                result.resolve();
            }).fail(function () {
                result.reject();
            });
            
        } else {
            // Multiple unsaved files: show a single bulk prompt listing all files
            var message = Strings.SAVE_CLOSE_MULTI_MESSAGE;
            
            message += "<ul>";
            unsavedDocs.forEach(function (doc) {
                message += "<li>" + ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath) + "</li>";
            });
            message += "</ul>";
            
            brackets.showModalDialog(
                brackets.DIALOG_ID_SAVE_CLOSE,
                Strings.SAVE_CLOSE_TITLE,
                message
            ).done(function (id) {
                if (id === brackets.DIALOG_BTN_CANCEL) {
                    result.reject();
                } else if (id === brackets.DIALOG_BTN_OK) {
                    // Save all unsaved files, then if that succeeds, close all
                    saveAll().done(function () {
                        result.resolve();
                    }).fail(function () {
                        result.reject();
                    });
                } else {
                    // "Don't Save" case--we can just go ahead and close all  files.
                    result.resolve();
                }
            });
        }
        
        // If all the unsaved-changes confirmations pan out above, then go ahead & close all editors
        // NOTE: this still happens before any done() handlers added by our caller, because jQ
        // guarantees that handlers run in the order they are added.
        result.done(function () {
            if (!commandData || !commandData.promptOnly) {
                DocumentManager.closeAll();
            }
        });
        
        return result;
    }
    
    
    /** Confirms any unsaved changes, then exits Brackets */
    function handleFileQuit() {
        var closeAllArgs = { promptOnly: false };
        handleFileCloseAll(closeAllArgs)
            .done(function () {
                window.close();  // TODO: call a native API to quit the whole app
            });
        // if fail, don't exit: user canceled (or asked us to save changes first, but we failed to do so)
    }

    function init(title) {
        _title = title;

        // Register global commands
        CommandManager.register(Commands.FILE_OPEN, handleFileOpen);
        CommandManager.register(Commands.FILE_ADD_TO_WORKING_SET, handleFileAddToWorkingSet);
        // TODO: For now, hook up File > New to the "new in project" handler. Eventually
        // File > New should open a new blank tab, and handleFileNewInProject should
        // be called from a "+" button in the project
        CommandManager.register(Commands.FILE_NEW, handleFileNewInProject);
        CommandManager.register(Commands.FILE_SAVE, handleFileSave);
        CommandManager.register(Commands.FILE_CLOSE, handleFileClose);
        CommandManager.register(Commands.FILE_CLOSE_ALL, handleFileCloseAll);
        CommandManager.register(Commands.FILE_QUIT, handleFileQuit);
        
        
        $(DocumentManager).on("dirtyFlagChange", handleDirtyChange);
        $(DocumentManager).on("currentDocumentChange", handleCurrentDocumentChange);
    }

    // Define public API
    exports.init = init;
});

