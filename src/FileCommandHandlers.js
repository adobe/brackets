/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
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
		CommandManager.register(Commands.FILE_ADD_TO_WORKING_SET, handleFileAddToWoringSet);
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
	
	function handleFileAddToWoringSet(fullPath){
		handleFileOpen(fullPath);
		DocumentManager.addToWorkingSet(fullPath);
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
            
            fileEntry.createWriter(
                function(writer) {
                    writer.onwriteend = function() {
                        docToSave.markClean();
                        result.resolve();
                    }
                    writer.onerror = function(event) {
                        showSaveFileError(event.target.error.code, fileEntry.fullPath);
                        result.reject();
                    }

                    // TODO (jasonsj): Blob instead of string
                    writer.write( docToSave.getText() );
                },
                function(event) {
                    showSaveFileError(event.target.error.code, fileEntry.fullPath);
                    result.reject();
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
    
    function saveAll() {
        var saveResults = [];
        
        DocumentManager.getWorkingSet().forEach(function(doc) {  //TODO: or just use for..in?
            saveResults.push( doSave(doc) );
        });
        
        // $.when() is sort of crappy: it won't accept an array as an arg, and it seems to insist
        // on receiving Deferreds even though it should work fine given Promises too... ugh
        var overallResult = $.when.apply($, saveResults);
        
        return overallResult; //NOTE: this returns a Promise, NOT a Deferred (which is actually more correct)
    }
    

	/** Closes the specified document. Assumes the current document if doc is null. 
	 * Prompts user about saving file if document is dirty
	 * @param {?Document} doc 
	 */
    function handleFileClose( doc ) {
        var result = new $.Deferred();
        
		// Default to current document if doc is null
        if (!doc)
            doc =  DocumentManager.getCurrentDocument();
        // No-op if called when nothing is open; TODO: should command be grayed out instead?
        if (!doc)
            return;
        
		if (doc.isDirty) {
            brackets.showModalDialog(
                  brackets.DIALOG_ID_SAVE_CLOSE
                , Strings.SAVE_CLOSE_TITLE
                , Strings.format(Strings.SAVE_CLOSE_MESSAGE, ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath) )
            ).done(function(id) {
                if (id === brackets.DIALOG_BTN_CANCEL) {
                    result.reject();
                }
                else {
                    if (id === brackets.DIALOG_BTN_OK) {
                        doSave(doc)
                            .done(function() {
                                _doClose(doc);
                                result.resolve();
                            })
                            .fail(function() {
                                result.reject();
                            });
                    }
                    else {
                        // This is the "Don't Save" case--we can just go ahead and close the file.
                        _doClose(doc);
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
            _doClose(doc);
            EditorManager.focusEditor();
            result.resolve();
        }
        return result;
    }
    
    /** Closes the given document, removing it from working set & editor UI */
    function _doClose(doc) {      
        // altho old doc is going away, we should fix its dirty bit in case anyone hangs onto a ref to it
        // TODO: can this be removed?
        doc.markClean();
    
        // This selects a different document if the working set has any other options
        DocumentManager.closeDocument(doc);
    
        EditorManager.focusEditor();
    }
    
    
    function handleFileCloseAll() {
        
        function doCloseAll() {
            // FIXME: inefficient, lots of UI churn for individual notifications!
            var allDocs = DocumentManager.getWorkingSet().slice(0);
            if (allDocs.indexOf(DocumentManager.getCurrentDocument()) == -1)
                allDocs.push(DocumentManager.getCurrentDocument());
            
            for (var i=0; i < allDocs.length; i++) {
                _doClose( allDocs[i] );
            }
        }
        
        var result = new $.Deferred();
        
        var unsavedDocs = DocumentManager.getWorkingSet().filter( function(doc) {
            return doc.isDirty;
        } );
        
        if (unsavedDocs.length == 0) {
            console.log("ZERO UNSAVED...");
            
            doCloseAll();
            result.resolve();
            
        } else if (unsavedDocs.length == 1) {
            console.log("SINGLE UNSAVED...");
            
            handleFileClose( unsavedDocs[0] ).done( function() {
                doCloseAll();
                result.resolve();
            }).fail( function() {
                result.reject();
            });
            
        } else {
            console.log("MULTIPLE UNSAVED...");
            var message = Strings.SAVE_CLOSE_MULTI_MESSAGE;
            
            message += "<ul>";
            unsavedDocs.forEach(function(doc) {  //TODO: or just use for..in?
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
                        console.log("SAVE ALL, then CLOSE ALL");
                        saveAll().done( function() {
                            doCloseAll();
                            result.resolve();
                        }).fail( function() {
                            result.reject();
                        });
                    }
                    else {
                        // This is the "Don't Save" case--we can just go ahead and close the file.
                        console.log("DISCARD ALL, then CLOSE ALL");
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
            result = Strings.NO_MODIFICATION_ALLOWED_ERR;
        else
            result = Strings.format(Strings.GENERIC_ERROR, code);

        return result;
    }

    // Define public API
    exports.init = init;
});

