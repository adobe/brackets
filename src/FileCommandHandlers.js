/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    require("thirdparty/path-utils/path-utils.min");
    
    // Load dependent modules
    var CommandManager      = require("CommandManager")
    ,   Commands            = require("Commands")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ,   ProjectManager      = require("ProjectManager")
    ,   DocumentManager     = require("DocumentManager")
    ,   EditorManager       = require("EditorManager")
    ,   Strings             = require("strings");
    ;
     
    /**
     * Handlers for commands related to file handling (opening, saving, etc.)
     */
    
    /** @type {jQueryObject} */
    var _title;
    /** @type {string} */
    var _currentFilePath;  // TODO: eliminate this and just use getCurrentDocument().file.fullPath
    /** @type {string} */
    var _currentTitlePath;
    
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
        
        
        $(DocumentManager).on("dirtyFlagChange", handleDirtyChange);
        $(DocumentManager).on("currentDocumentChange", handleCurrentDocumentChange);
    };

    function handleCurrentDocumentChange(event) {
        var newDocument = DocumentManager.getCurrentDocument();
        
        if (newDocument != null) {
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
        if (changedDoc.file.fullPath == _currentFilePath) {
            updateTitle();
        }
    }

    function updateTitle() {
        var currentDoc = DocumentManager.getCurrentDocument();
        if (currentDoc) {
            _title.text( _currentTitlePath + (currentDoc.isDirty ? " \u2022" : "") );
        } else {
            _title.text("");
        }
    }
    
    function handleFileAddToWorkingSet(fullPath){
        handleFileOpen(fullPath);
        DocumentManager.addToWorkingSet(DocumentManager.getCurrentDocument());
    }

    function handleFileOpen(fullPath) {
        var result = doOpenWithOptionalPath(fullPath);
        result.always(function() {
            EditorManager.focusEditor();
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
        
        // TODO: we should implement something like NativeFileSystem.resolveNativeFileSystemURL() (similar
        // to what's in the standard file API) to get a FileEntry, rather than manually constructing it
        var fileEntry = new NativeFileSystem.FileEntry(fullPath);

        var document = DocumentManager.getDocumentForFile(fileEntry);
        if (document != null) {
            // File already open - don't need to load it, just switch to it in the UI
            DocumentManager.showInEditor(document);
            result.resolve();
            
        } else {
            // File wasn't open before, so we must load its contents into a new document
            var reader = new NativeFileSystem.FileReader();

            fileEntry.file(function(file) {
                reader.onload = function(event) {
                    // Create a new editor initialized with the file's content, and bind it to a Document
                    document = EditorManager.createDocumentAndEditor(fileEntry, event.target.result);
                    
                    // Switch to new document in the UI
                    DocumentManager.showInEditor(document);
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
        }

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
        // TODO: Use a unique name like Untitled-1, Untitled-2, etc.
        return ProjectManager.createNewItem(baseDir, "Untitled.js", false);
    }
    
    function handleFileSave() {
        return doSave( DocumentManager.getCurrentDocument() );
    }
    function doSave(docToSave) {
        var result = new $.Deferred();
        
        if (docToSave && docToSave.isDirty) {
            var fileEntry = docToSave.file;
            
            //setup our resolve and reject handlers
            result.done( function fileSaved() { 
                docToSave.markClean();
            });

            result.fail( function fileError(error) { 
                showSaveFileError(error.code, fileEntry.fullPath);
            });

            fileEntry.createWriter(
                function(writer) {
                    writer.onwriteend = function() {
                        result.resolve();
                    }
                    writer.onerror = function(error) {
                        result.reject(error);
                    }

                    // TODO (jasonsj): Blob instead of string
                    writer.write( docToSave.getText() );
                },
                function(error) {
                    result.reject(error);
                }
            );
        }
        else {
            result.resolve();
        }
        result.always(function() {
            EditorManager.focusEditor();
        });
        return result;
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
        
        DocumentManager.getWorkingSet().forEach(function(doc) {  //TODO: or just use for..in?
            saveResults.push( doSave(doc) );
        });
        
        // Aggregate all the file-save Deferreds into one master
        // (p.s., it would be nice if $.when() accepted an array instead of varargs, but oh well...)
        var overallResult = $.when.apply($, saveResults);
        
        return overallResult;
    }
    

    /**
     * Closes the specified document. Prompts user about saving file if document is dirty.
     *
     * @param {?Document} doc  Document to close; assumes the current document if null.
     * @param {boolean} promptOnly  If true, only displays the relevant confirmation UI and does NOT
     *          actually close the document. This is useful when chaining file-close together with
     *          other user prompts that may be cancelable.
     * @return {$.Deferred}
     */
    function handleFileClose( doc, promptOnly ) {
        
        // utility function for handleFileClose: closes document & removes from working set
        function doClose(doc) {
            if (!promptOnly) {
                // This selects a different document if the working set has any other options
                DocumentManager.closeDocument(doc);
            
                EditorManager.focusEditor();
            }
        }
        
        
        var result = new $.Deferred();
        
        // Default to current document if doc is null
        if (!doc)
            doc =  DocumentManager.getCurrentDocument();
        // No-op if called when nothing is open; TODO: should command be grayed out instead?
        if (!doc)
            return;
        
        if (doc.isDirty) {
            var filename = PathUtils.parseUrl(doc.file.fullPath).filename;
            
            brackets.showModalDialog(
                  brackets.DIALOG_ID_SAVE_CLOSE
                , Strings.SAVE_CLOSE_TITLE
                , Strings.format(Strings.SAVE_CLOSE_MESSAGE, filename )
            ).done(function(id) {
                if (id === brackets.DIALOG_BTN_CANCEL) {
                    result.reject();
                }
                else {
                    if (id === brackets.DIALOG_BTN_OK) {
                        doSave(doc)
                            .done(function() {
                                doClose(doc);
                                result.resolve();
                            })
                            .fail(function() {
                                result.reject();
                            });
                    }
                    else {
                        // This is the "Don't Save" case--we can just go ahead and close the file.
                        doClose(doc);
                        result.resolve();
                    }
                }
            });
            result.always(function() {
                EditorManager.focusEditor();
            });
        }
        else {
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
     * @param {boolean} promptOnly  If true, only displays the relevant confirmation UI and does NOT
     *          actually close any documents. This is useful when chaining close-all together with
     *          other user prompts that may be cancelable.
     * @return {$.Deferred}
     */
    function handleFileCloseAll(promptOnly) {
        // utility function: if we're not in promptOnly mode, close all open documents
        function doCloseAll() {
            if (!promptOnly)
                DocumentManager.closeAll();
        }
        
        var result = new $.Deferred();
        
        var unsavedDocs = DocumentManager.getWorkingSet().filter( function(doc) {
            return doc.isDirty;
        } );
        
        if (unsavedDocs.length == 0) {
            // No unsaved changes, so we can proceed without a prompt
            doCloseAll();
            result.resolve();
            
        } else if (unsavedDocs.length == 1) {
            // Only one unsaved file: show the usual single-file-close confirmation UI
            handleFileClose( unsavedDocs[0], promptOnly ).done( function() {
                // still need to close any other, non-unsaved documents
                doCloseAll();
                result.resolve();
            }).fail( function() {
                result.reject();
            });
            
        } else {
            // Multiple unsaved files: show a single bulk prompt listing all files
            var message = Strings.SAVE_CLOSE_MULTI_MESSAGE;
            
            message += "<ul>";
            unsavedDocs.forEach(function(doc) {
                message += "<li>" + ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath) + "</li>";
            });
            message += "</ul>";
            
            brackets.showModalDialog(
                  brackets.DIALOG_ID_SAVE_CLOSE
                , Strings.SAVE_CLOSE_TITLE
                , message
            ).done(function(id) {
                if (id === brackets.DIALOG_BTN_CANCEL) {
                    result.reject();
                }
                else {
                    if (id === brackets.DIALOG_BTN_OK) {
                        // Save all unsaved files, then if that succeeds, close all
                        saveAll().done( function() {
                            doCloseAll();
                            result.resolve();
                        }).fail( function() {
                            result.reject();
                        });
                    }
                    else {
                        // "Don't Save" case--we can just go ahead and close all  files.
                        doCloseAll();
                        result.resolve();
                    }
                }
            });
        }
        
        return result;
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
            result = Strings.NO_MODIFICATION_ALLOWED_ERR_FILE;
        else
            result = Strings.format(Strings.GENERIC_ERROR, code);

        return result;
    }

    // Define public API
    exports.init = init;
});

