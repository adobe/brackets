/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, PathUtils, window */

define(function (require, exports, module) {
    'use strict';
    
    require("thirdparty/path-utils/path-utils.min");
    
    // Load dependent modules
    var CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        ProjectManager      = require("project/ProjectManager"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        FileUtils           = require("file/FileUtils"),
        Async               = require("utils/Async"),
        Dialogs             = require("widgets/Dialogs"),
        Strings             = require("strings"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        PerfUtils           = require("utils/PerfUtils");
    
    /**
     * Handlers for commands related to document handling (opening, saving, etc.)
     */
    
    /** @type {jQueryObject} Container for label shown above editor; must be an inline element */
    var _$title = null;
    /** @type {jQueryObject} Container for _$title; need not be an inline element */
    var _$titleWrapper = null;
    /** @type {string} Label shown above editor for current document: filename and potentially some of its path */
    var _currentTitlePath = null;
    
    /** @type {jQueryObject} Container for _$titleWrapper; if changing title changes this element's height, must kick editor to resize */
    var _$titleContainerToolbar = null;
    /** @type {Number} Last known height of _$titleContainerToolbar */
    var _lastToolbarHeight = null;
    
    var DIRTY_INDICATOR = " <span class='dirty-dot'>\u2022</span>";
    
    function updateTitle() {
        var currentDoc = DocumentManager.getCurrentDocument();
        if (currentDoc) {
            _$title.text(_currentTitlePath);
            _$title.attr("title", currentDoc.file.fullPath);
            if (currentDoc.isDirty) {
                _$title.append(DIRTY_INDICATOR);
            }
        } else {
            _$title.text("");
            _$title.attr("title", "");
        }
        
        // Set _$titleWrapper to a fixed width just large enough to accomodate _$title. This seems equivalent to what
        // the browser would do automatically, but the CSS trick we use for layout requires _$titleWrapper to have a
        // fixed width set on it (see the "#main-toolbar.toolbar" CSS rule for details).
        _$titleWrapper.css("width", "");
        var newWidth = _$title.width();
        _$titleWrapper.css("width", newWidth);
        
        // Changing the width of the title may cause the toolbar layout to change height, which needs to resize the
        // editor beneath it (toolbar changing height due to window resize is already caught by EditorManager).
        var newToolbarHeight = _$titleContainerToolbar.height();
        if (_lastToolbarHeight !== newToolbarHeight) {
            _lastToolbarHeight = newToolbarHeight;
            EditorManager.resizeEditor();
        }
    }
    
    function handleCurrentDocumentChange() {
        var newDocument = DocumentManager.getCurrentDocument();
        
        if (newDocument) {
            var fullPath = newDocument.file.fullPath;
    
            // In the main toolbar, show the project-relative path (if the file is inside the current project)
            // or the full absolute path (if it's not in the project).
            _currentTitlePath = ProjectManager.makeProjectRelativeIfPossible(fullPath);
            
        } else {
            _currentTitlePath = null;
        }
        
        // Update title text & "dirty dot" display
        updateTitle();
    }
    
    function handleDirtyChange(event, changedDoc) {
        var currentDoc = DocumentManager.getCurrentDocument();
        
        if (currentDoc && changedDoc.file.fullPath === currentDoc.file.fullPath) {
            updateTitle();
        }
    }

    /**
     * @private
     * Creates a document and displays an editor for the specified file path.
     * @param {!string} fullPath
     * @return {$.Promise} a jQuery promise that will be resolved with a
     *  document for the specified file path, or rejected if the file can not be read.
     */
    function doOpen(fullPath) {
        
        var result = new $.Deferred(), promise = result.promise();
        if (!fullPath) {
            console.log("doOpen() called without fullPath");
            result.reject();
            return promise;
        }
        
        PerfUtils.markStart("Open File: " + fullPath);
        result.always(function () {
            PerfUtils.addMeasurement("Open File: " + fullPath);
        });
        
        // Load the file if it was never open before, and then switch to it in the UI
        DocumentManager.getDocumentForPath(fullPath)
            .done(function (doc) {
                DocumentManager.setCurrentDocument(doc);
                result.resolve(doc);
            })
            .fail(function (fileError) {
                FileUtils.showFileOpenError(fileError.code, fullPath).done(function () {
                    EditorManager.focusEditor();
                    result.reject();
                });
            });

        return promise;
    }
    
    /**
     * @private
     * Used to track the default directory for the file open dialog
     */
    var _defaultOpenDialogFullPath = null;
    
    /**
     * @private
     * Creates a document and displays an editor for the specified file path. 
     * If no path is specified, a file prompt is provided for input.
     * @param {?string} fullPath - The path of the file to open; if it's null we'll prompt for it
     * @return {$.Promise} a jQuery promise that will be resolved with a new 
     *  document for the specified file path, or rejected if the file can not be read.
     */
    function _doOpenWithOptionalPath(fullPath) {
        var result;
        if (!fullPath) {
            //first time through, default to the current project path
            if (!_defaultOpenDialogFullPath) {
                _defaultOpenDialogFullPath = ProjectManager.getProjectRoot().fullPath;
            }
            // Prompt the user with a dialog
            // TODO (issue #117): we're relying on this to not be asynchronous ('result' not set until
            // dialog is dismissed); won't work in a browser-based version
            NativeFileSystem.showOpenDialog(false, false, Strings.OPEN_FILE, _defaultOpenDialogFullPath,
                null, function (files) {
                    if (files.length > 0) {
                        result = doOpen(files[0])
                            .always(function updateDefualtOpenDialogFullPath(doc) {
                                var url = PathUtils.parseUrl(doc.file.fullPath);
                                //reconstruct the url but use the directory and stop there
                                _defaultOpenDialogFullPath = url.protocol + url.doubleSlash + url.authority + url.directory;
                            });
                        return;
                    }
                });
        } else {
            result = doOpen(fullPath);
        }
        if (!result) {
            result = (new $.Deferred()).reject().promise();
        }
        return result;
    }

    function handleFileOpen(commandData) {
        var fullPath = null;
        if (commandData) {
            fullPath = commandData.fullPath;
        }
        
        return _doOpenWithOptionalPath(fullPath)
            .always(EditorManager.focusEditor);
    }

    function handleFileAddToWorkingSet(commandData) {
        handleFileOpen(commandData).done(function (doc) {
            DocumentManager.addToWorkingSet(doc.file);
        });
    }

    /**
     * @private
     * Ensures the suggested file name doesn't already exit.
     * @param {string} dir  The directory to use
     * @param {string} baseFileName  The base to start with, "-n" will get appened to make unique
     * @param {string} fileExt  The file extension
     * @return {$.Promise} a jQuery promise that will be resolved with a unique name starting with 
     *   the given base name
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

        return result.promise();
    }

    /**
     * Prevents re-entrancy into handleFileNewInProject()
     *
     * handleFileNewInProject() first prompts the user to name a file and then asynchronously writes the file when the
     * filename field loses focus. This boolean prevent additional calls to handleFileNewInProject() when an existing
     * file creation call is outstanding
     */
    var fileNewInProgress = false;

    function handleFileNewInProject() {

        if (fileNewInProgress) {
            ProjectManager.forceFinishRename();
            return;
        }
        fileNewInProgress = true;

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
            ProjectManager.createNewItem(baseDir, suggestedName, false)
                .pipe(deferred.resolve, deferred.reject, deferred.notify)
                .always(function () { fileNewInProgress = false; });
        };

        deferred.done(createWithSuggestedName);
        deferred.fail(function createWithDefault() { createWithSuggestedName("Untitled.js"); });
        return deferred;
    }
    
    function showSaveFileError(code, path) {
        return Dialogs.showModalDialog(
            Dialogs.DIALOG_ID_ERROR,
            Strings.ERROR_SAVING_FILE_TITLE,
            Strings.format(
                Strings.ERROR_SAVING_FILE,
                path,
                FileUtils.getFileErrorString(code)
            )
        );
    }
    
    /** Note: if there is an error, the promise is not rejected until the user has dimissed the dialog */
    function doSave(docToSave) {
        var result = new $.Deferred();
        
        function handleError(error, fileEntry) {
            showSaveFileError(error.code, fileEntry.fullPath)
                .always(function () {
                    result.reject(error);
                });
        }
            
        if (docToSave && docToSave.isDirty) {
            var fileEntry = docToSave.file;
            var writeError = false;
            
            fileEntry.createWriter(
                function (writer) {
                    writer.onwriteend = function () {
                        // Per spec, onwriteend is called after onerror too
                        if (!writeError) {
                            docToSave.notifySaved();
                            result.resolve();
                        }
                    };
                    writer.onerror = function (error) {
                        writeError = true;
                        handleError(error, fileEntry);
                    };

                    // TODO (issue #241): Blob instead of string
                    writer.write(docToSave.getText());
                },
                function (error) {
                    handleError(error, fileEntry);
                }
            );
        } else {
            result.resolve();
        }
        result.always(function () {
            EditorManager.focusEditor();
        });
        return result.promise();
    }
    
    /**
     * Saves the given file. If no file specified, assumes the current document.
     * @param {?{doc: Document}} commandData  Document to close, or null
     * @return {$.Promise} a promise that is resolved after the save completes
     */
    function handleFileSave(commandData) {
        // Default to current document if doc is null
        var doc = null;
        if (commandData) {
            doc = commandData.doc;
        }
        if (!doc) {
            var focusedEditor = EditorManager.getFocusedEditor();
            
            if (focusedEditor) {
                doc = focusedEditor.document;
            }
            
            // doc may still be null, e.g. if no editors are open, but doSave() does a null check on
            // doc and makes sure the document is dirty before saving.
        }
        
        return doSave(doc);
    }
    
    /**
     * Saves all unsaved documents. Returns a Promise that will be resolved once ALL the save
     * operations have been completed. If ANY save operation fails, an error dialog is immediately
     * shown and the other files wait to save until it is dismissed; after all files have been
     * processed, the Promise is rejected if any ONE save operation failed.
     *
     * @return {$.Promise}
     */
    function saveAll() {
        // Do in serial because doSave shows error UI for each file, and we don't want to stack
        // multiple dialogs on top of each other
        return Async.doSequentially(
            DocumentManager.getWorkingSet(),
            function (file) {
                var doc = DocumentManager.getOpenDocumentForPath(file.fullPath);
                if (doc) {
                    return doSave(doc);
                } else {
                    // working set entry that was never actually opened - ignore
                    return (new $.Deferred()).resolve().promise();
                }
            },
            false
        );
    }
    
    /**
     * Reverts the Document to the current contents of its file on disk. Discards any unsaved changes
     * in the Document.
     * @param {Document} doc
     * @return {$.Promise} a Promise that's resolved when done, or rejected with a FileError if the
     *      file cannot be read (after showing an error dialog to the user).
     */
    function doRevert(doc) {
        var result = new $.Deferred();
        
        FileUtils.readAsText(doc.file)
            .done(function (text, readTimestamp) {
                doc.refreshText(text, readTimestamp);
                result.resolve();
            })
            .fail(function (error) {
                FileUtils.showFileOpenError(error.code, doc.file.fullPath)
                    .always(function () {
                        result.reject(error);
                    });
            });
        
        return result.promise();
    }
    

    /**
     * Closes the specified file: removes it from the working set, and closes the main editor if one
     * is open. Prompts user about saving changes first, if document is dirty.
     *
     * @param {?{file: FileEntry, promptOnly:boolean}} commandData  Optional bag of arguments:
     *      file - File to close; assumes the current document if not specified.
     *      promptOnly - If true, only displays the relevant confirmation UI and does NOT actually
     *          close the document. This is useful when chaining file-close together with other user
     *          prompts that may be cancelable.
     * @return {$.Promise} a promise that is resolved when the file is closed, or if no file is open.
     *      FUTURE: should we reject the promise if no file is open?
     */
    function handleFileClose(commandData) {
        // If not specified, file defaults to null; promptOnly defaults to falsy
        var file       = commandData && commandData.file,
            promptOnly = commandData && commandData.promptOnly;
        
        // utility function for handleFileClose: closes document & removes from working set
        function doClose(file) {
            if (!promptOnly) {
                // This selects a different document if the working set has any other options
                DocumentManager.closeFullEditor(file);
            
                EditorManager.focusEditor();
            }
        }
        
        
        var result = new $.Deferred(), promise = result.promise();
        
        // Default to current document if doc is null
        if (!file) {
            if (DocumentManager.getCurrentDocument()) {
                file = DocumentManager.getCurrentDocument().file;
            }
        }
        
        // No-op if called when nothing is open; TODO: (issue #273) should command be grayed out instead?
        if (!file) {
            result.resolve();
            return promise;
        }
        
        var doc = DocumentManager.getOpenDocumentForPath(file.fullPath);
        
        if (doc && doc.isDirty) {
            // Document is dirty: prompt to save changes before closing
            var filename = PathUtils.parseUrl(doc.file.fullPath).filename;
            
            Dialogs.showModalDialog(
                Dialogs.DIALOG_ID_SAVE_CLOSE,
                Strings.SAVE_CLOSE_TITLE,
                Strings.format(Strings.SAVE_CLOSE_MESSAGE, filename)
            ).done(function (id) {
                if (id === Dialogs.DIALOG_BTN_CANCEL) {
                    result.reject();
                } else if (id === Dialogs.DIALOG_BTN_OK) {
                    // "Save" case: wait until we confirm save has succeeded before closing
                    doSave(doc)
                        .done(function () {
                            doClose(file);
                            result.resolve();
                        })
                        .fail(function () {
                            result.reject();
                        });
                } else {
                    // "Don't Save" case: even though we're closing the main editor, other views of
                    // the Document may remain in the UI. So we need to revert the Document to a clean
                    // copy of whatever's on disk.
                    doClose(file);
                    
                    // Only reload from disk if we've executed the Close for real,
                    // *and* if at least one other view still exists
                    if (!promptOnly && DocumentManager.getOpenDocumentForPath(file.fullPath)) {
                        doRevert(doc)
                            .pipe(result.resolve, result.reject);
                    } else {
                        result.resolve();
                    }
                }
            });
            result.always(function () {
                EditorManager.focusEditor();
            });
        } else {
            // File is not open, or IS open but Document not dirty: close immediately
            doClose(file);
            EditorManager.focusEditor();
            result.resolve();
        }
        return promise;
    }
    
    /**
     * Closes all open documents; equivalent to calling handleFileClose() for each document, except
     * that unsaved changes are confirmed once, in bulk.
     * @param {?{promptOnly: boolean}}  If true, only displays the relevant confirmation UI and does NOT
     *          actually close any documents. This is useful when chaining close-all together with
     *          other user prompts that may be cancelable.
     * @return {$.Promise} a promise that is resolved when all files are closed
     */
    function handleFileCloseAll(commandData) {
        var result = new $.Deferred();
        
        var unsavedDocs = [];
        DocumentManager.getWorkingSet().forEach(function (file) {
            var doc = DocumentManager.getOpenDocumentForPath(file.fullPath);
            if (doc && doc.isDirty) {
                unsavedDocs.push(doc);
            }
        });
        
        if (unsavedDocs.length === 0) {
            // No unsaved changes, so we can proceed without a prompt
            result.resolve();
            
        } else if (unsavedDocs.length === 1) {
            // Only one unsaved file: show the usual single-file-close confirmation UI
            var fileCloseArgs = { file: unsavedDocs[0].file, promptOnly: commandData.promptOnly };

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
                message += "<li><span class='dialog-filename'>" + ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath) + "</span></li>";
            });
            message += "</ul>";
            
            Dialogs.showModalDialog(
                Dialogs.DIALOG_ID_SAVE_CLOSE,
                Strings.SAVE_CLOSE_TITLE,
                message
            ).done(function (id) {
                if (id === Dialogs.DIALOG_BTN_CANCEL) {
                    result.reject();
                } else if (id === Dialogs.DIALOG_BTN_OK) {
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
        
        return result.promise();
    }
    
    /**
    * @private - tracks our closing state if we get called again
    */
    var _windowGoingAway = false;
    
    /**
    * @private
    * Common implementation for close/quit/reload which all mostly
    * the same except for the final step
    */
    function _handleWindowGoingAway(commandData, postCloseHandler) {
        if (_windowGoingAway) {
            //if we get called back while we're closing, then just return
            return (new $.Deferred()).resolve().promise();
        }
        
        //prevent the default action of closing the window until we can save all the files
        if (commandData && commandData.evt && commandData.evt.cancelable) {
            commandData.evt.preventDefault();
        }

        return CommandManager.execute(Commands.FILE_CLOSE_ALL, { promptOnly: true })
            .done(function () {
                _windowGoingAway = true;
                PreferencesManager.savePreferences();
                postCloseHandler();
            });
    }
    
    /** Confirms any unsaved changes, then closes the window */
    function handleFileCloseWindow(commandData) {
        return _handleWindowGoingAway(commandData, function () {
            window.close();
        });
    }
    
    /** Closes the window, then quits the app */
    function handleFileQuit(commandData) {
        return _handleWindowGoingAway(commandData, function () {
            brackets.app.quit();
        });
        // if fail, don't exit: user canceled (or asked us to save changes first, but we failed to do so)
    }

    function handleShowDeveloperTools(commandData) {
        brackets.app.showDeveloperTools();
    }
    
     /** Does a full reload of the browser window */
    function handleFileReload(commandData) {
        return _handleWindowGoingAway(commandData, function () {
            window.location.reload();
        });
    }

    function init($titleContainerToolbar) {
        _$titleContainerToolbar = $titleContainerToolbar;
        _$titleWrapper = $(".title-wrapper", _$titleContainerToolbar);
        _$title = $(".title", _$titleWrapper);

        // Register global commands
        CommandManager.register(Commands.FILE_OPEN, handleFileOpen);
        CommandManager.register(Commands.FILE_ADD_TO_WORKING_SET, handleFileAddToWorkingSet);
        // TODO: (issue #274) For now, hook up File > New to the "new in project" handler. Eventually
        // File > New should open a new blank tab, and handleFileNewInProject should
        // be called from a "+" button in the project
        CommandManager.register(Commands.FILE_NEW, handleFileNewInProject);
        CommandManager.register(Commands.FILE_SAVE, handleFileSave);
        CommandManager.register(Commands.FILE_CLOSE, handleFileClose);
        CommandManager.register(Commands.FILE_CLOSE_ALL, handleFileCloseAll);
        CommandManager.register(Commands.FILE_CLOSE_WINDOW, handleFileCloseWindow);
        CommandManager.register(Commands.FILE_QUIT, handleFileQuit);
        CommandManager.register(Commands.DEBUG_REFRESH_WINDOW, handleFileReload);
        CommandManager.register(Commands.DEBUG_SHOW_DEVELOPER_TOOLS, handleShowDeveloperTools);
        
        
        $(DocumentManager).on("dirtyFlagChange", handleDirtyChange);
        $(DocumentManager).on("currentDocumentChange", handleCurrentDocumentChange);
    }

    // Define public API
    exports.init = init;
});

