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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, brackets, window, WebSocket */

define(function (require, exports, module) {
    "use strict";
    
    var _ = require("thirdparty/lodash");
    
    // Load dependent modules
    var AppInit             = require("utils/AppInit"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        ProjectManager      = require("project/ProjectManager"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        FileSystem          = require("filesystem/FileSystem"),
        FileSystemError     = require("filesystem/FileSystemError"),
        FileUtils           = require("file/FileUtils"),
        FileViewController  = require("project/FileViewController"),
        InMemoryFile        = require("document/InMemoryFile"),
        StringUtils         = require("utils/StringUtils"),
        Async               = require("utils/Async"),
        Dialogs             = require("widgets/Dialogs"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        Strings             = require("strings"),
        PopUpManager        = require("widgets/PopUpManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        DragAndDrop         = require("utils/DragAndDrop"),
        PerfUtils           = require("utils/PerfUtils"),
        KeyEvent            = require("utils/KeyEvent"),
        LanguageManager     = require("language/LanguageManager"),
        Inspector           = require("LiveDevelopment/Inspector/Inspector"),
        Menus               = require("command/Menus"),
        UrlParams           = require("utils/UrlParams").UrlParams,
        StatusBar           = require("widgets/StatusBar");
    
    /**
     * Handlers for commands related to document handling (opening, saving, etc.)
     */
    
    /** @type {jQueryObject} Container for label shown above editor; must be an inline element */
    var _$title = null;
    /** @type {jQueryObject} Container for dirty dot; must be an inline element */
    var _$dirtydot = null;
    /** @type {jQueryObject} Container for _$title; need not be an inline element */
    var _$titleWrapper = null;
    /** @type {string} Label shown above editor for current document: filename and potentially some of its path */
    var _currentTitlePath = null;
    /** @type {string} String template for window title. Use emdash on mac only. */
    var WINDOW_TITLE_STRING = (brackets.platform !== "mac") ? "{0} - {1}" : "{0} \u2014 {1}";
    
    /** @type {jQueryObject} Container for _$titleWrapper; if changing title changes this element's height, must kick editor to resize */
    var _$titleContainerToolbar = null;
    /** @type {Number} Last known height of _$titleContainerToolbar */
    var _lastToolbarHeight = null;
    
    /** @type {Number} index to use for next, new Untitled document */
    var _nextUntitledIndexToUse = 1;
    
    /** Unique token used to indicate user-driven cancellation of Save As (as opposed to file IO error) */
    var USER_CANCELED = { userCanceled: true };
    
    PreferencesManager.definePreference("defaultExtension", "string", "");
    
    /** @type {function} JSLint workaround for circular dependency */
    var handleFileSaveAs;

    function updateTitle() {
        var currentDoc = DocumentManager.getCurrentDocument(),
            currentlyViewedPath = EditorManager.getCurrentlyViewedPath(),
            windowTitle = brackets.config.app_title;

        if (!brackets.nativeMenus) {
            if (currentlyViewedPath) {
                _$title.text(_currentTitlePath);
                _$title.attr("title", currentlyViewedPath);
                if (currentDoc) {
                    // dirty dot is always in DOM so layout doesn't change, and visibility is toggled
                    _$dirtydot.css("visibility", (currentDoc.isDirty) ? "visible" : "hidden");
                } else {
                    // hide dirty dot if there is no document
                    _$dirtydot.css("visibility", "hidden");
                }
            } else {
                _$title.text("");
                _$title.attr("title", "");
                _$dirtydot.css("visibility", "hidden");
            }
        
            // Set _$titleWrapper to a fixed width just large enough to accomodate _$title. This seems equivalent to what
            // the browser would do automatically, but the CSS trick we use for layout requires _$titleWrapper to have a
            // fixed width set on it (see the "#titlebar" CSS rule for details).
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

        // build shell/browser window title, e.g. "• file.html — Brackets"
        if (currentlyViewedPath) {
            windowTitle = StringUtils.format(WINDOW_TITLE_STRING, _currentTitlePath, windowTitle);
        }
        
        if (currentDoc) {
            windowTitle = (currentDoc.isDirty) ? "• " + windowTitle : windowTitle;
        } else {
            // hide dirty dot if there is no document
            _$dirtydot.css("visibility", "hidden");
        }

        // update shell/browser window title
        window.document.title = windowTitle;
    }
    
    /**
     * Returns a short title for a given document.
     *
     * @param {Document} doc
     * @return {string} - a short title for doc.
     */
    function _shortTitleForDocument(doc) {
        var fullPath = doc.file.fullPath;
        
        // If the document is untitled then return the filename, ("Untitled-n.ext");
        // otherwise show the project-relative path if the file is inside the
        // current project or the full absolute path if it's not in the project.
        if (doc.isUntitled()) {
            return fullPath.substring(fullPath.lastIndexOf("/") + 1);
        } else {
            return ProjectManager.makeProjectRelativeIfPossible(fullPath);
        }
    }
    
    function updateDocumentTitle() {
        var newDocument = DocumentManager.getCurrentDocument();

        // TODO: This timer is causing a "Recursive tests with the same name are not supporte"
        // exception. This code should be removed (if not needed), or updated with a unique
        // timer name (if needed).
        // var perfTimerName = PerfUtils.markStart("DocumentCommandHandlers._onCurrentDocumentChange():\t" + (!newDocument || newDocument.file.fullPath));
        
        if (newDocument) {
            _currentTitlePath = _shortTitleForDocument(newDocument);
        } else {
            var currentlyViewedFilePath = EditorManager.getCurrentlyViewedPath();
            if (currentlyViewedFilePath) {
                _currentTitlePath = ProjectManager.makeProjectRelativeIfPossible(currentlyViewedFilePath);
            } else {
                _currentTitlePath = null;
            }
        }
        
        // Update title text & "dirty dot" display
        updateTitle();

        // PerfUtils.addMeasurement(perfTimerName);
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
     * @param {boolean=} silent If true, don't show error message
     * @return {$.Promise} a jQuery promise that will either
     * - be resolved with a document for the specified file path or
     * - be resolved without document, i.e. when an image is displayed or
     * - be rejected if the file can not be read.
     */
    function doOpen(fullPath, silent) {
        var result = new $.Deferred();
        
        // workaround for https://github.com/adobe/brackets/issues/6001
        // TODO should be removed once bug is closed.
        // if we are already displaying a file do nothing but resolve immediately.
        // this fixes timing issues in test cases.
        if (EditorManager.getCurrentlyViewedPath() === fullPath) {
            result.resolve(DocumentManager.getCurrentDocument());
            return result.promise();
        }
        
        function _cleanup(fullFilePath) {
            if (!fullFilePath || EditorManager.showingCustomViewerForPath(fullFilePath)) {
                // We get here only after the user renames a file that makes it no longer belong to a
                // custom viewer but the file is still showing in the current custom viewer. This only
                // occurs on Mac since opening a non-text file always fails on Mac and triggers an error
                // message that in turn calls _cleanup() after the user clicks OK in the message box.
                // So we need to explicitly close the currently viewing image file whose filename is  
                // no longer valid. Calling notifyPathDeleted will close the image vieer and then select 
                // the previously opened text file or show no-editor if none exists.
                EditorManager.notifyPathDeleted(fullFilePath);
            } else {
                // For performance, we do lazy checking of file existence, so it may be in working set
                DocumentManager.removeFromWorkingSet(FileSystem.getFileForPath(fullFilePath));
                EditorManager.focusEditor();
            }
            result.reject();
        }
        function _showErrorAndCleanUp(fileError, fullFilePath) {
            if (silent) {
                _cleanup(fullFilePath);
            } else {
                FileUtils.showFileOpenError(fileError, fullFilePath).done(function () {
                    _cleanup(fullFilePath);
                });
            }
        }
        
        if (!fullPath) {
            console.error("doOpen() called without fullPath");
            result.reject();
        } else {
            var perfTimerName = PerfUtils.markStart("Open File:\t" + fullPath);
            result.always(function () {
                PerfUtils.addMeasurement(perfTimerName);
            });

            var viewProvider = EditorManager.getCustomViewerForPath(fullPath);
            if (viewProvider) {
                var file = FileSystem.getFileForPath(fullPath);
                file.exists(function (fileError, fileExists) {
                    if (fileExists) {
                        EditorManager.showCustomViewer(viewProvider, fullPath);
                        result.resolve();
                    } else {
                        fileError = fileError || FileSystemError.NOT_FOUND;
                        _showErrorAndCleanUp(fileError);
                    }
                });
                
            } else {
                // Load the file if it was never open before, and then switch to it in the UI
                DocumentManager.getDocumentForPath(fullPath)
                    .done(function (doc) {
                        DocumentManager.setCurrentDocument(doc);
                        result.resolve(doc);
                    })
                    .fail(function (fileError) {
                        _showErrorAndCleanUp(fileError, fullPath);
                    });
            }
        }

        return result.promise();
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
     * @param {boolean=} silent - If true, don't show error message
     * @return {$.Promise} a jQuery promise that will be resolved with a new
     * document for the specified file path or be resolved without document, i.e. when an image is displayed, 
     * or rejected if the file can not be read.
     */
    function _doOpenWithOptionalPath(fullPath, silent) {
        var result;
        if (!fullPath) {
            // Create placeholder deferred
            result = new $.Deferred();
            
            //first time through, default to the current project path
            if (!_defaultOpenDialogFullPath) {
                _defaultOpenDialogFullPath = ProjectManager.getProjectRoot().fullPath;
            }
            // Prompt the user with a dialog
            FileSystem.showOpenDialog(true, false, Strings.OPEN_FILE, _defaultOpenDialogFullPath, null, function (err, paths) {
                if (!err) {
                    if (paths.length > 0) {
                        // Add all files to the working set without verifying that
                        // they still exist on disk (for faster opening)
                        var filesToOpen = [],
                            filteredPaths = DragAndDrop.filterFilesToOpen(paths);
                        
                        filteredPaths.forEach(function (file) {
                            filesToOpen.push(FileSystem.getFileForPath(file));
                        });
                        DocumentManager.addListToWorkingSet(filesToOpen);
                        
                        doOpen(filteredPaths[filteredPaths.length - 1], silent)
                            .done(function (doc) {
                                //  doc may be null, i.e. if an image has been opened.
                                // Then we do not add the opened file to the working set.
                                if (doc) {
                                    DocumentManager.addToWorkingSet(doc.file);
                                }
                                _defaultOpenDialogFullPath = FileUtils.getDirectoryPath(EditorManager.getCurrentlyViewedPath());
                            })
                            // Send the resulting document that was opened
                            .then(result.resolve, result.reject);
                    } else {
                        // Reject if the user canceled the dialog
                        result.reject();
                    }
                }
            });
        } else {
            result = doOpen(fullPath, silent);
        }
        
        return result.promise();
    }

    /**
     * @private
     * Splits a decorated file path into its parts.
     * @param {?string} path - a string of the form "fullpath[:lineNumber[:columnNumber]]"
     * @return {{path: string, line: ?number, column: ?number}}
     */
    function _parseDecoratedPath(path) {
        var result = {path: path, line: null, column: null};
        if (path) {
            // If the path has a trailing :lineNumber and :columnNumber, strip
            // these off and assign to result.line and result.column.
            var matchResult = /(.+?):([0-9]+)(:([0-9]+))?$/.exec(path);
            if (matchResult) {
                result.path = matchResult[1];
                if (matchResult[2]) {
                    result.line = parseInt(matchResult[2], 10);
                }
                if (matchResult[4]) {
                    result.column = parseInt(matchResult[4], 10);
                }
            }
        }
        return result;
    }

    /**
     * Opens the given file and makes it the current document. Does NOT add it to the working set.
     * @param {!{fullPath:string}} Params for FILE_OPEN command;
     * the fullPath string is of the form "path[:lineNumber[:columnNumber]]"
     * lineNumber and columnNumber are 1-origin: the very first line is line 1, and the very first column is column 1.
     */
    function handleFileOpen(commandData) {
        var fileInfo = _parseDecoratedPath(commandData ? commandData.fullPath : null),
            silent = commandData ? commandData.silent : false;
        return _doOpenWithOptionalPath(fileInfo.path, silent)
            .always(function () {
                // If a line and column number were given, position the editor accordingly.
                if (fileInfo.line !== null) {
                    if (fileInfo.column === null || (fileInfo.column <= 0)) {
                        fileInfo.column = 1;
                    }
                    // setCursorPos expects line/column numbers as 0-origin, so we subtract 1
                    EditorManager.getCurrentFullEditor().setCursorPos(fileInfo.line - 1, fileInfo.column - 1, true);
                }
                
                // Give the editor focus
                EditorManager.focusEditor();
            });
        // Testing notes: here are some recommended manual tests for handleFileOpen, on macintosh.
        // Do all tests with brackets already running, and also with brackets not already running.
        //
        // drag a file onto brackets icon in desktop (this uses undecorated paths)
        // drag a file onto brackets icon in taskbar (this uses undecorated paths)
        // open a file from brackets sidebar (this uses undecorated paths)
        // from command line: ...../Brackets.app/Contents path         - where 'path' is undecorated
        // from command line: ...../Brackets.app path                  - where 'path' has the form "path:line"
        // from command line: ...../Brackets.app path                  - where 'path' has the form "path:line:column"
        // from command line: open -a ...../Brackets.app path          - where 'path' is undecorated
        // do "View Source" from Adobe Scout version 1.2 or newer (this will use decorated paths of the form "path:line:column")
    }

    /**
     * Opens the given file, makes it the current document, AND adds it to the working set 
     * only if the file does not have a custom viewer.
     * @param {!{fullPath:string, index:number=, forceRedraw:boolean}} commandData  File to open; optional position in
     *   working set list (defaults to last); optional flag to force working set redraw
     */
    function handleFileAddToWorkingSet(commandData) {
        return handleFileOpen(commandData).done(function (doc) {
            // addToWorkingSet is synchronous
            // When opening a file with a custom viewer, we get a null doc.
            // So check it before we add it to the working set.
            if (doc) {
                DocumentManager.addToWorkingSet(doc.file, commandData.index, commandData.forceRedraw);
            }
        });
    }

    /**
     * @private
     * Ensures the suggested file name doesn't already exit.
     * @param {Directory} dir  The directory to use
     * @param {string} baseFileName  The base to start with, "-n" will get appened to make unique
     * @param {boolean} isFolder True if the suggestion is for a folder name
     * @return {$.Promise} a jQuery promise that will be resolved with a unique name starting with
     *   the given base name
     */
    function _getUntitledFileSuggestion(dir, baseFileName, isFolder) {
        var suggestedName   = baseFileName + "-" + _nextUntitledIndexToUse++,
            deferred        = $.Deferred();
        
        if (_nextUntitledIndexToUse > 9999) {
            //we've tried this enough            
            deferred.reject();
        } else {
            var path = dir.fullPath + suggestedName,
                entry = isFolder ? FileSystem.getDirectoryForPath(path)
                                 : FileSystem.getFileForPath(path);
            
            entry.exists(function (err, exists) {
                if (err || exists) {
                    _getUntitledFileSuggestion(dir, baseFileName, isFolder)
                        .then(deferred.resolve, deferred.reject);
                } else {
                    deferred.resolve(suggestedName);
                }
            });
        }

        return deferred.promise();
    }

    /**
     * Prevents re-entrancy into handleFileNewInProject()
     *
     * handleFileNewInProject() first prompts the user to name a file and then asynchronously writes the file when the
     * filename field loses focus. This boolean prevent additional calls to handleFileNewInProject() when an existing
     * file creation call is outstanding
     */
    var fileNewInProgress = false;
    
    /**
     * Bottleneck function for creating new files and folders in the project tree.
     */
    function _handleNewItemInProject(isFolder) {
        if (fileNewInProgress) {
            ProjectManager.forceFinishRename();
            return;
        }
        fileNewInProgress = true;

        // Determine the directory to put the new file
        // If a file is currently selected in the tree, put it next to it.
        // If a directory is currently selected in the tree, put it in it.
        // If an Untitled document is selected or nothing is selected in the tree, put it at the root of the project.
        // (Note: 'selected' may be an item that's selected in the working set and not the tree; but in that case
        // ProjectManager.createNewItem() ignores the baseDir we give it and falls back to the project root on its own)
        var baseDirEntry,
            selected = ProjectManager.getSelectedItem();
        if ((!selected) || (selected instanceof InMemoryFile)) {
            selected = ProjectManager.getProjectRoot();
        }
        
        if (selected.isFile) {
            baseDirEntry = FileSystem.getDirectoryForPath(selected.parentPath);
        }
        
        baseDirEntry = baseDirEntry || selected;
        
        // Create the new node. The createNewItem function does all the heavy work
        // of validating file name, creating the new file and selecting.
        function createWithSuggestedName(suggestedName) {
            return ProjectManager.createNewItem(baseDirEntry, suggestedName, false, isFolder)
                .always(function () { fileNewInProgress = false; });
        }
        
        return _getUntitledFileSuggestion(baseDirEntry, Strings.UNTITLED, isFolder)
            .then(createWithSuggestedName, createWithSuggestedName.bind(undefined, Strings.UNTITLED));
    }

    /**
     * Create a new untitled document in the working set, and make it the current document.
     * Promise is resolved (synchronously) with the newly-created Document.
     */
    function handleFileNew() {
        //var defaultExtension = PreferencesManager.get("defaultExtension");
        //if (defaultExtension) {
        //    defaultExtension = "." + defaultExtension;
        //}
        var defaultExtension = "";  // disable preference setting for now 
        
        var doc = DocumentManager.createUntitledDocument(_nextUntitledIndexToUse++, defaultExtension);
        DocumentManager.setCurrentDocument(doc);
        EditorManager.focusEditor();
        
        return new $.Deferred().resolve(doc).promise();
    }
    
    /**
     * Create a new file in the project tree.
     */
    function handleFileNewInProject() {
        _handleNewItemInProject(false);
    }
    
    /**
     * Create a new folder in the project tree.
     */
    function handleNewFolderInProject() {
        _handleNewItemInProject(true);
    }

    /**
     * @private
     * Shows an Error modal dialog
     * @param {string} name
     * @param {string} path
     * @return {Dialog}
     */
    function _showSaveFileError(name, path) {
        return Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.ERROR_SAVING_FILE_TITLE,
            StringUtils.format(
                Strings.ERROR_SAVING_FILE,
                StringUtils.breakableUrl(path),
                FileUtils.getFileErrorString(name)
            )
        );
    }
    
    /**
     * Saves a document to its existing path. Does NOT support untitled documents.
     * @param {!Document} docToSave
     * @param {boolean=} force Ignore CONTENTS_MODIFIED errors from the FileSystem
     * @return {$.Promise} a promise that is resolved with the File of docToSave (to mirror
     *   the API of _doSaveAs()). Rejected in case of IO error (after error dialog dismissed).
     */
    function doSave(docToSave, force) {
        var result = new $.Deferred(),
            file = docToSave.file;
        
        function handleError(error) {
            _showSaveFileError(error, file.fullPath)
                .done(function () {
                    result.reject(error);
                });
        }
        
        function handleContentsModified() {
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_ERROR,
                Strings.EXT_MODIFIED_TITLE,
                StringUtils.format(
                    Strings.EXT_MODIFIED_WARNING,
                    StringUtils.breakableUrl(docToSave.file.fullPath)
                ),
                [
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_LEFT,
                        id        : Dialogs.DIALOG_BTN_SAVE_AS,
                        text      : Strings.SAVE_AS
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id        : Dialogs.DIALOG_BTN_CANCEL,
                        text      : Strings.CANCEL
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id        : Dialogs.DIALOG_BTN_OK,
                        text      : Strings.SAVE_AND_OVERWRITE
                    }
                ]
            )
                .done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_CANCEL) {
                        result.reject();
                    } else if (id === Dialogs.DIALOG_BTN_OK) {
                        // Re-do the save, ignoring any CONTENTS_MODIFIED errors
                        doSave(docToSave, true).then(result.resolve, result.reject);
                    } else if (id === Dialogs.DIALOG_BTN_SAVE_AS) {
                        // Let the user choose a different path at which to write the file
                        handleFileSaveAs({doc: docToSave}).then(result.resolve, result.reject);
                    }
                });
        }
            
        function trySave() {
            // We don't want normalized line endings, so it's important to pass true to getText()
            FileUtils.writeText(file, docToSave.getText(true), force)
                .done(function () {
                    docToSave.notifySaved();
                    result.resolve(file);
                })
                .fail(function (err) {
                    if (err === FileSystemError.CONTENTS_MODIFIED) {
                        handleContentsModified();
                    } else {
                        handleError(err);
                    }
                });
        }

        if (docToSave.isDirty) {
            var writeError = false;
            
            if (docToSave.keepChangesTime) {
                // The user has decided to keep conflicting changes in the editor. Check to make sure
                // the file hasn't changed since they last decided to do that.
                docToSave.file.stat(function (err, stat) {
                    // If the file has been deleted on disk, the stat will return an error, but that's fine since 
                    // that means there's no file to overwrite anyway, so the save will succeed without us having
                    // to set force = true.
                    if (!err && docToSave.keepChangesTime === stat.mtime.getTime()) {
                        // OK, it's safe to overwrite the file even though we never reloaded the latest version,
                        // since the user already said s/he wanted to ignore the disk version.
                        force = true;
                    }
                    trySave();
                });
            } else {
                trySave();
            }
        } else {
            result.resolve(file);
        }
        result.always(function () {
            EditorManager.focusEditor();
        });
        return result.promise();
    }
    
    /**
     * Reverts the Document to the current contents of its file on disk. Discards any unsaved changes
     * in the Document.
     * @param {Document} doc
     * @return {$.Promise} a Promise that's resolved when done, or rejected with a FileSystemError if the
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
                FileUtils.showFileOpenError(error, doc.file.fullPath)
                    .done(function () {
                        result.reject(error);
                    });
            });
        
        return result.promise();
    }
    
    /**
     * Opens the native OS save as dialog and saves document.
     * The original document is reverted in case it was dirty.
     * Text selection and cursor position from the original document
     * are preserved in the new document.
     * When saving to the original document the document is saved as if save was called.
     * @param {Document} doc
     * @param {?{cursorPos:!Object, selection:!Object, scrollPos:!Object}} settings - properties of
     *      the original document's editor that need to be carried over to the new document
     *      i.e. scrollPos, cursorPos and text selection
     * @return {$.Promise} a promise that is resolved with the saved document's File. Rejected in
     *   case of IO error (after error dialog dismissed), or if the Save dialog was canceled.
     */
    function _doSaveAs(doc, settings) {
        var origPath,
            saveAsDefaultPath,
            defaultName,
            result = new $.Deferred();
        
        function _doSaveAfterSaveDialog(path) {
            var newFile;
            
            // Reconstruct old doc's editor's view state, & finally resolve overall promise
            function _configureEditorAndResolve() {
                var editor = EditorManager.getActiveEditor();
                if (editor) {
                    if (settings) {
                        editor.setCursorPos(settings.cursorPos);
                        editor.setSelection(settings.selection.start, settings.selection.end);
                        editor.setScrollPos(settings.scrollPos.x, settings.scrollPos.y);
                    }
                }
                result.resolve(newFile);
            }
            
            // Replace old document with new one in open editor & working set
            function openNewFile() {
                var fileOpenPromise;

                if (FileViewController.getFileSelectionFocus() === FileViewController.PROJECT_MANAGER) {
                    // If selection is in the tree, leave working set unchanged - even if orig file is in the list
                    fileOpenPromise = FileViewController
                        .openAndSelectDocument(path, FileViewController.PROJECT_MANAGER);
                } else {
                    // If selection is in working set, replace orig item in place with the new file
                    var index = DocumentManager.findInWorkingSet(doc.file.fullPath);
                    // Remove old file from working set; no redraw yet since there's a pause before the new file is opened
                    DocumentManager.removeFromWorkingSet(doc.file, true);
                    // Add new file to working set, and ensure we now redraw (even if index hasn't changed)
                    fileOpenPromise = handleFileAddToWorkingSet({fullPath: path, index: index, forceRedraw: true});
                }

                // always configure editor after file is opened
                fileOpenPromise.always(function () {
                    _configureEditorAndResolve();
                });
            }
            
            // Same name as before - just do a regular Save
            if (path === origPath) {
                doSave(doc).then(result.resolve, result.reject);
                return;
            }
            
            // First, write document's current text to new file
            newFile = FileSystem.getFileForPath(path);
            
            // Save as warns you when you're about to overwrite a file, so we
            // explictly allow "blind" writes to the filesystem in this case,
            // ignoring warnings about the contents being modified outside of
            // the editor.
            FileUtils.writeText(newFile, doc.getText(), true).done(function () {
                // If there were unsaved changes before Save As, they don't stay with the old
                // file anymore - so must revert the old doc to match disk content.
                // Only do this if the doc was dirty: doRevert on a file that is not dirty and
                // not in the working set has the side effect of adding it to the working set.
                if (doc.isDirty && !(doc.isUntitled())) {
                    // if the file is dirty it must be in the working set
                    // doRevert is side effect free in this case
                    doRevert(doc).always(openNewFile);
                } else {
                    openNewFile();
                }
            }).fail(function (error) {
                _showSaveFileError(error, path)
                    .done(function () {
                        result.reject(error);
                    });
            });
        }
        
        if (doc) {
            origPath = doc.file.fullPath;
            // If the document is an untitled document, we should default to project root.
            if (doc.isUntitled()) {
                // (Issue #4489) if we're saving an untitled document, go ahead and switch to this document
                //   in the editor, so that if we're, for example, saving several files (ie. Save All),
                //   then the user can visually tell which document we're currently prompting them to save.
                DocumentManager.setCurrentDocument(doc);

                // If the document is untitled, default to project root.
                saveAsDefaultPath = ProjectManager.getProjectRoot().fullPath;
            } else {
                saveAsDefaultPath = FileUtils.getDirectoryPath(origPath);
            }
            defaultName = FileUtils.getBaseName(origPath);
            FileSystem.showSaveDialog(Strings.SAVE_FILE_AS, saveAsDefaultPath, defaultName, function (err, selectedPath) {
                if (!err) {
                    if (selectedPath) {
                        _doSaveAfterSaveDialog(selectedPath);
                    } else {
                        result.reject(USER_CANCELED);
                    }
                } else {
                    result.reject(err);
                }
            });
        } else {
            result.reject();
        }
        return result.promise();
    }
    
    /**
     * Saves the given file. If no file specified, assumes the current document.
     * @param {?{doc: ?Document}} commandData  Document to close, or null
     * @return {$.Promise} resolved with the saved document's File (which MAY DIFFER from the doc
     *   passed in, if the doc was untitled). Rejected in case of IO error (after error dialog
     *   dismissed), or if doc was untitled and the Save dialog was canceled (will be rejected with
     *   USER_CANCELED object).
     */
    function handleFileSave(commandData) {
        var activeEditor = EditorManager.getActiveEditor(),
            activeDoc = activeEditor && activeEditor.document,
            doc = (commandData && commandData.doc) || activeDoc,
            settings;
        
        if (doc) {
            if (doc.isUntitled()) {
                if (doc === activeDoc) {
                    settings = {
                        selection: activeEditor.getSelection(),
                        cursorPos: activeEditor.getCursorPos(),
                        scrollPos: activeEditor.getScrollPos()
                    };
                }
                
                return _doSaveAs(doc, settings);
            } else {
                return doSave(doc);
            }
        }
        
        return $.Deferred().reject().promise();
    }
    
    /**
     * Saves all unsaved documents corresponding to 'fileList'. Returns a Promise that will be resolved
     * once ALL the save operations have been completed. If ANY save operation fails, an error dialog is
     * immediately shown but after dismissing we continue saving the other files; after all files have
     * been processed, the Promise is rejected if any ONE save operation failed (the error given is the
     * first one encountered). If the user cancels any Save As dialog (for untitled files), the
     * Promise is immediately rejected.
     *
     * @param {!Array.<File>} fileList
     * @return {!$.Promise} Resolved with {!Array.<File>}, which may differ from 'fileList'
     *      if any of the files were Unsaved documents. Or rejected with {?FileSystemError}.
     */
    function _saveFileList(fileList) {
        // Do in serial because doSave shows error UI for each file, and we don't want to stack
        // multiple dialogs on top of each other
        var userCanceled = false,
            filesAfterSave = [];
            
        return Async.doSequentially(
            fileList,
            function (file) {
                // Abort remaining saves if user canceled any Save As dialog
                if (userCanceled) {
                    return (new $.Deferred()).reject().promise();
                }
                
                var doc = DocumentManager.getOpenDocumentForPath(file.fullPath);
                if (doc) {
                    var savePromise = handleFileSave({doc: doc});
                    savePromise
                        .done(function (newFile) {
                            filesAfterSave.push(newFile);
                        })
                        .fail(function (error) {
                            if (error === USER_CANCELED) {
                                userCanceled = true;
                            }
                        });
                    return savePromise;
                } else {
                    // working set entry that was never actually opened - ignore
                    filesAfterSave.push(file);
                    return (new $.Deferred()).resolve().promise();
                }
            },
            false  // if any save fails, continue trying to save other files anyway; then reject at end
        ).then(function () {
            return filesAfterSave;
        });
    }
    
    /**
     * Saves all unsaved documents. See _saveFileList() for details on the semantics.
     * @return {$.Promise}
     */
    function saveAll() {
        return _saveFileList(DocumentManager.getWorkingSet());
    }
    
    /**
     * Prompts user with save as dialog and saves document.
     * @return {$.Promise} a promise that is resolved once the save has been completed
     */
    handleFileSaveAs = function (commandData) {
        // Default to current document if doc is null
        var doc = null,
            settings;
        
        if (commandData) {
            doc = commandData.doc;
        } else {
            var activeEditor = EditorManager.getActiveEditor();
            if (activeEditor) {
                doc = activeEditor.document;
                settings = {};
                settings.selection = activeEditor.getSelection();
                settings.cursorPos = activeEditor.getCursorPos();
                settings.scrollPos = activeEditor.getScrollPos();
            }
        }
            
        // doc may still be null, e.g. if no editors are open, but _doSaveAs() does a null check on
        // doc.
        return _doSaveAs(doc, settings);
    };

    /**
     * Saves all unsaved documents.
     * @return {$.Promise} a promise that is resolved once ALL the saves have been completed; or rejected
     *      after all operations completed if any ONE of them failed.
     */
    function handleFileSaveAll() {
        return saveAll();
    }
    
    /**
     * Closes the specified file: removes it from the working set, and closes the main editor if one
     * is open. Prompts user about saving changes first, if document is dirty.
     *
     * @param {?{file: File, promptOnly:boolean}} commandData  Optional bag of arguments:
     *      file - File to close; assumes the current document if not specified.
     *      promptOnly - If true, only displays the relevant confirmation UI and does NOT actually
     *          close the document. This is useful when chaining file-close together with other user
     *          prompts that may be cancelable.
     *      _forceClose - If true, closes the document without prompting even if there are unsaved 
     *          changes. Only for use in unit tests.
     * @return {$.Promise} a promise that is resolved when the file is closed, or if no file is open.
     *      FUTURE: should we reject the promise if no file is open?
     */
    function handleFileClose(commandData) {
        var file,
            promptOnly,
            _forceClose;
        
        if (commandData) {
            file        = commandData.file;
            promptOnly  = commandData.promptOnly;
            _forceClose = commandData._forceClose;
        }
        
        // utility function for handleFileClose: closes document & removes from working set
        function doClose(file) {
            if (!promptOnly) {
                // This selects a different document if the working set has any other options
                DocumentManager.closeFullEditor(file);
                
                EditorManager.focusEditor();
            }
        }

        var result = new $.Deferred(), promise = result.promise();
        
        function doCloseCustomViewer() {
            if (!promptOnly) {
                var nextFile = DocumentManager.getNextPrevFile(1);
                if (nextFile) {
                    // opening a text file will automatically close the custom viewer.
                    // This is done in the currentDocumentChange handler in EditorManager
                    doOpen(nextFile.fullPath).always(function () {
                        EditorManager.focusEditor();
                        result.resolve();
                    });
                } else {
                    EditorManager.closeCustomViewer();
                    result.resolve();
                }
            }
        }

        // Close custom viewer if, either
        // - a custom viewer is currently displayed and no file specified in command data
        // - a custom viewer is currently displayed and the file specified in command data 
        //   is the file in the custom viewer
        if (!DocumentManager.getCurrentDocument()) {
            if ((EditorManager.getCurrentlyViewedPath() && !file) ||
                    (file && file.fullPath === EditorManager.getCurrentlyViewedPath())) {
                doCloseCustomViewer();
                return promise;
            }
        }
        
        // Default to current document if doc is null
        if (!file && DocumentManager.getCurrentDocument()) {
            file = DocumentManager.getCurrentDocument().file;
        }
        
        // No-op if called when nothing is open; TODO: (issue #273) should command be grayed out instead?
        if (!file) {
            result.resolve();
            return promise;
        }
        
        var doc = DocumentManager.getOpenDocumentForPath(file.fullPath);
        
        if (doc && doc.isDirty && !_forceClose) {
            // Document is dirty: prompt to save changes before closing
            var filename = FileUtils.getBaseName(doc.file.fullPath);
            
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_SAVE_CLOSE,
                Strings.SAVE_CLOSE_TITLE,
                StringUtils.format(
                    Strings.SAVE_CLOSE_MESSAGE,
                    StringUtils.breakableUrl(filename)
                ),
                [
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_LEFT,
                        id        : Dialogs.DIALOG_BTN_DONTSAVE,
                        text      : Strings.DONT_SAVE
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id        : Dialogs.DIALOG_BTN_CANCEL,
                        text      : Strings.CANCEL
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id        : Dialogs.DIALOG_BTN_OK,
                        text      : Strings.SAVE
                    }
                ]
            )
                .done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_CANCEL) {
                        result.reject();
                    } else if (id === Dialogs.DIALOG_BTN_OK) {
                        // "Save" case: wait until we confirm save has succeeded before closing
                        handleFileSave({doc: doc})
                            .done(function (newFile) {
                                doClose(newFile);
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
                                .then(result.resolve, result.reject);
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
     * @return {!Array.<Document>} All Documents with unsaved changes whose files are in the given list. Empty array if no
     * unsaved changes anywhere
     */
    function _getUnsavedDocs(fileList) {
        var unsavedDocs = [];
        fileList.forEach(function (file) {
            var doc = DocumentManager.getOpenDocumentForPath(file.fullPath);
            if (doc && doc.isDirty) {
                unsavedDocs.push(doc);
            }
        });
        return unsavedDocs;
    }
    
    /**
     * @param {!Array.<FileEntry>} list
     * @param {boolean} promptOnly
     * @param {boolean} clearCurrentDoc
     */
    function _closeList(list, promptOnly, clearCurrentDoc) {
        var result      = new $.Deferred(),
            unsavedDocs = _getUnsavedDocs(list);
        
        if (unsavedDocs.length === 0) {
            // No unsaved changes, so we can proceed without a prompt
            result.resolve();
            
        } else if (unsavedDocs.length === 1) {
            // Only one unsaved file: show the usual single-file-close confirmation UI
            var fileCloseArgs = { file: unsavedDocs[0].file, promptOnly: promptOnly };

            handleFileClose(fileCloseArgs).done(function () {
                // still need to close any other, non-unsaved documents
                result.resolve();
            }).fail(function () {
                result.reject();
            });
            
        } else {
            // Multiple unsaved files: show a single bulk prompt listing all files
            var message = Strings.SAVE_CLOSE_MULTI_MESSAGE;
            
            message += "<ul class='dialog-list'>";
            unsavedDocs.forEach(function (doc) {
                var fullPath = doc.file.fullPath;
                
                message += "<li><span class='dialog-filename'>";
                message += StringUtils.breakableUrl(_shortTitleForDocument(doc));
                message += "</span></li>";
            });
            message += "</ul>";
            
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_SAVE_CLOSE,
                Strings.SAVE_CLOSE_TITLE,
                message,
                [
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_LEFT,
                        id        : Dialogs.DIALOG_BTN_DONTSAVE,
                        text      : Strings.DONT_SAVE
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id        : Dialogs.DIALOG_BTN_CANCEL,
                        text      : Strings.CANCEL
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id        : Dialogs.DIALOG_BTN_OK,
                        text      : Strings.SAVE
                    }
                ]
            )
                .done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_CANCEL) {
                        result.reject();
                    } else if (id === Dialogs.DIALOG_BTN_OK) {
                        // Save all unsaved files, then if that succeeds, close all
                        _saveFileList(list).done(function (listAfterSave) {
                            // List of files after save may be different, if any were Untitled
                            result.resolve(listAfterSave);
                        }).fail(function () {
                            result.reject();
                        });
                    } else {
                        // "Don't Save" case--we can just go ahead and close all files.
                        result.resolve();
                    }
                });
        }
        
        // If all the unsaved-changes confirmations pan out above, then go ahead & close all editors
        // NOTE: this still happens before any done() handlers added by our caller, because jQ
        // guarantees that handlers run in the order they are added.
        result.done(function (listAfterSave) {
            listAfterSave = listAfterSave || list;
            if (!promptOnly) {
                DocumentManager.removeListFromWorkingSet(listAfterSave, clearCurrentDoc);
            }
        });
        
        return result.promise();
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
        return _closeList(DocumentManager.getWorkingSet(),
                                    (commandData && commandData.promptOnly), true).done(function () {
            if (!DocumentManager.getCurrentDocument()) {
                EditorManager.closeCustomViewer();
            }
        });
    }
    
    function handleFileCloseList(commandData) {
        return _closeList(commandData.fileList, false, false).done(function () {
            if (!DocumentManager.getCurrentDocument()) {
                EditorManager.closeCustomViewer();
            }
        });
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
    function _handleWindowGoingAway(commandData, postCloseHandler, failHandler) {
        if (_windowGoingAway) {
            //if we get called back while we're closing, then just return
            return (new $.Deferred()).reject().promise();
        }

        return CommandManager.execute(Commands.FILE_CLOSE_ALL, { promptOnly: true })
            .done(function () {
                _windowGoingAway = true;
                
                // Give everyone a chance to save their state - but don't let any problems block
                // us from quitting
                try {
                    $(ProjectManager).triggerHandler("beforeAppClose");
                } catch (ex) {
                    console.error(ex);
                }
                
                PreferencesManager.savePreferences();
                
                postCloseHandler();
            })
            .fail(function () {
                _windowGoingAway = false;
                if (failHandler) {
                    failHandler();
                }
            });
    }
    
    /**
     * @private
     * Implementation for abortQuit callback to reset quit sequence settings
     */
    function handleAbortQuit() {
        _windowGoingAway = false;
    }
    
    /**
     * @private
     * Implementation for native APP_BEFORE_MENUPOPUP callback to trigger beforeMenuPopup event
     */
    function handleBeforeMenuPopup() {
        $(PopUpManager).triggerHandler("beforeMenuPopup");
    }
    
    /** Confirms any unsaved changes, then closes the window */
    function handleFileCloseWindow(commandData) {
        return _handleWindowGoingAway(
            commandData,
            function () {
                window.close();
            },
            function () {
                // if fail, tell the app to abort any pending quit operation.
                // TODO: remove this if statement when we move to the new CEF3 shell
                if (brackets.app.abortQuit) {
                    brackets.app.abortQuit();
                }
            }
        );
    }
    
    /** In-browser equivalent to handleFileCloseWindow(), much more constrained */
    function handleBeforeUnload() {
        var unsavedDocs = _getUnsavedDocs(DocumentManager.getWorkingSet());
        if (unsavedDocs.length) {
            var message = Strings.UNLOAD_WITH_UNSAVED + "\n";
            unsavedDocs.forEach(function (doc) {
                message += "\n    " + _shortTitleForDocument(doc);
            });
            return message;
        }
        
        // TODO: Do we want a message even when not unsaved? Easy to hit Ctrl+W via muscle memory right now...
//        } else {
//            return Strings.UNLOAD_NO_UNSAVED;
//        }
    }
    
    /** Show a textfield to rename whatever is currently selected in the sidebar (or current doc if nothing else selected) */
    function handleFileRename() {
        // Prefer selected sidebar item (which could be a folder)
        var entry = ProjectManager.getSelectedItem();
        if (!entry) {
            // Else use current file (not selected in ProjectManager if not visible in tree or working set)
            var doc = DocumentManager.getCurrentDocument();
            entry = doc && doc.file;
        }
        if (entry) {
            ProjectManager.renameItemInline(entry);
        }
    }

    /** Closes the window, then quits the app */
    function handleFileQuit(commandData) {
        if (brackets.unsupportedInBrowser()) {
            return;
        }
        
        return _handleWindowGoingAway(
            commandData,
            function () {
                brackets.app.quit();
            },
            function () {
                // if fail, don't exit: user canceled (or asked us to save changes first, but we failed to do so)
                // TODO: remove this if statement when we move to the new CEF3 shell
                if (brackets.app.abortQuit) {
                    brackets.app.abortQuit();
                }
            }
        );
    }

    
    /** Are we already listening for a keyup to call detectDocumentNavEnd()? */
    var _addedNavKeyHandler = false;
    
    /**
     * When the Ctrl key is released, if we were in the middle of a next/prev document navigation
     * sequence, now is the time to end it and update the MRU order. If we allowed the order to update
     * on every next/prev increment, the 1st & 2nd entries would just switch places forever and we'd
     * never get further down the list.
     * @param {jQueryEvent} event Key-up event
     */
    function detectDocumentNavEnd(event) {
        if (event.keyCode === KeyEvent.DOM_VK_CONTROL) {  // Ctrl key
            DocumentManager.finalizeDocumentNavigation();
            
            _addedNavKeyHandler = false;
            $(window.document.body).off("keyup", detectDocumentNavEnd);
        }
    }
    
    /** Navigate to the next/previous (MRU) document. Don't update MRU order yet */
    function goNextPrevDoc(inc) {
        var file = DocumentManager.getNextPrevFile(inc);
        if (file) {
            DocumentManager.beginDocumentNavigation();
            CommandManager.execute(Commands.FILE_OPEN, { fullPath: file.fullPath });
            
            // Listen for ending of Ctrl+Tab sequence
            if (!_addedNavKeyHandler) {
                _addedNavKeyHandler = true;
                $(window.document.body).keyup(detectDocumentNavEnd);
            }
        }
    }
    
    function handleGoNextDoc() {
        goNextPrevDoc(+1);
    }
    function handleGoPrevDoc() {
        goNextPrevDoc(-1);
    }
    
    function handleShowInTree() {
        ProjectManager.showInTree(DocumentManager.getCurrentDocument().file);
    }
    
    function handleFileDelete() {
        if (brackets.unsupportedInBrowser()) {
            return;
        }
        
        var entry = ProjectManager.getSelectedItem();
        if (entry.isDirectory) {
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_EXT_DELETED,
                Strings.CONFIRM_FOLDER_DELETE_TITLE,
                StringUtils.format(
                    Strings.CONFIRM_FOLDER_DELETE,
                    StringUtils.breakableUrl(entry.name)
                ),
                [
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id        : Dialogs.DIALOG_BTN_CANCEL,
                        text      : Strings.CANCEL
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id        : Dialogs.DIALOG_BTN_OK,
                        text      : Strings.DELETE
                    }
                ]
            )
                .done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_OK) {
                        ProjectManager.deleteItem(entry);
                    }
                });
        } else {
            ProjectManager.deleteItem(entry);
        }
    }

    /** Show the selected sidebar (tree or working set) item in Finder/Explorer */
    function handleShowInOS() {
        if (brackets.unsupportedInBrowser()) {
            return;
        }
        
        var entry = ProjectManager.getSelectedItem();
        if (entry) {
            brackets.app.showOSFolder(entry.fullPath, function (err) {
                if (err) {
                    console.error("Error showing '" + entry.fullPath + "' in OS folder:", err);
                }
            });
        }
    }
    
    /**
     * Disables Brackets' cache via the remote debugging protocol.
     * @return {$.Promise} A jQuery promise that will be resolved when the cache is disabled and be rejected in any other case
     */
    function _disableCache() {
        var result = new $.Deferred();
        
        if (brackets.inBrowser) {
            result.resolve();
        } else {
            var port = brackets.app.getRemoteDebuggingPort ? brackets.app.getRemoteDebuggingPort() : 9234;
            Inspector.getDebuggableWindows("127.0.0.1", port)
                .fail(result.reject)
                .done(function (response) {
                    var page = response[0];
                    if (!page || !page.webSocketDebuggerUrl) {
                        result.reject();
                        return;
                    }
                    var _socket = new WebSocket(page.webSocketDebuggerUrl);
                    // Disable the cache
                    _socket.onopen = function _onConnect() {
                        _socket.send(JSON.stringify({ id: 1, method: "Network.setCacheDisabled", params: { "cacheDisabled": true } }));
                    };
                    // The first message will be the confirmation => disconnected to allow remote debugging of Brackets
                    _socket.onmessage = function _onMessage(e) {
                        _socket.close();
                        result.resolve();
                    };
                    // In case of an error
                    _socket.onerror = result.reject;
                });
        }
         
        return result.promise();
    }
        
    /**
    * Does a full reload of the browser window
    * @param {string} href The url to reload into the window
    */
    function browserReload(href) {
        return CommandManager.execute(Commands.FILE_CLOSE_ALL, { promptOnly: true }).done(function () {
            // Give everyone a chance to save their state - but don't let any problems block
            // us from quitting
            try {
                $(ProjectManager).triggerHandler("beforeAppClose");
            } catch (ex) {
                console.error(ex);
            }
           
            // Disable the cache to make reloads work
            _disableCache().always(function () {
                // Remove all menus to assure every part of Brackets is reloaded
                _.forEach(Menus.getAllMenus(), function (value, key) {
                    Menus.removeMenu(key);
                });
                
                window.location.href = href;
            });
        });
    }
    
    function handleReload() {
        var href    = window.location.href,
            params  = new UrlParams();
        
        // Make sure the Reload Without User Extensions parameter is removed
        params.parse();
        
        if (params.get("reloadWithoutUserExts")) {
            params.remove("reloadWithoutUserExts");
        }
        
        if (href.indexOf("?") !== -1) {
            href = href.substring(0, href.indexOf("?"));
        }
        
        if (!params.isEmpty()) {
            href += "?" + params.toString();
        }
        
        // Give Mac native menus extra time to update shortcut highlighting.
        // Prevents the menu highlighting from getting messed up after reload.
        window.setTimeout(function () {
            browserReload(href);
        }, 100);
    }
    
    function handleReloadWithoutExts() {
        var href    = window.location.href,
            params  = new UrlParams();
        
        params.parse();
        
        if (!params.get("reloadWithoutUserExts")) {
            params.put("reloadWithoutUserExts", true);
        }
        
        if (href.indexOf("?") !== -1) {
            href = href.substring(0, href.indexOf("?"));
        }
        
        href += "?" + params.toString();
        
        // Give Mac native menus extra time to update shortcut highlighting.
        // Prevents the menu highlighting from getting messed up after reload.
        window.setTimeout(function () {
            browserReload(href);
        }, 100);
    }
    
    AppInit.htmlReady(function () {
        // If in Reload Without User Extensions mode, update UI and log console message
        var params      = new UrlParams(),
            $icon       = $("#toolbar-extension-manager"),
            $indicator  = $("<div>" + Strings.STATUSBAR_USER_EXTENSIONS_DISABLED + "</div>");
        
        params.parse();
        
        if (params.get("reloadWithoutUserExts") === "true") {
            CommandManager.get(Commands.FILE_EXTENSION_MANAGER).setEnabled(false);
            $icon.css({display: "none"});
            StatusBar.addIndicator("status-user-exts", $indicator, true);
            console.log("Brackets reloaded with extensions disabled");
        }
        
        // Init DOM elements
        _$titleContainerToolbar = $("#titlebar");
        _$titleWrapper = $(".title-wrapper", _$titleContainerToolbar);
        _$title = $(".title", _$titleWrapper);
        _$dirtydot = $(".dirty-dot", _$titleWrapper);
    });

    // Exported for unit testing only
    exports._parseDecoratedPath = _parseDecoratedPath;

    // Register global commands
    CommandManager.register(Strings.CMD_FILE_OPEN,          Commands.FILE_OPEN, handleFileOpen);
    CommandManager.register(Strings.CMD_ADD_TO_WORKING_SET, Commands.FILE_ADD_TO_WORKING_SET, handleFileAddToWorkingSet);
    // TODO: (issue #274) For now, hook up File > New to the "new in project" handler. Eventually
    // File > New should open a new blank tab, and handleFileNewInProject should
    // be called from a "+" button in the project
    CommandManager.register(Strings.CMD_FILE_NEW_UNTITLED,  Commands.FILE_NEW_UNTITLED, handleFileNew);
    CommandManager.register(Strings.CMD_FILE_NEW,           Commands.FILE_NEW, handleFileNewInProject);
    CommandManager.register(Strings.CMD_FILE_NEW_FOLDER,    Commands.FILE_NEW_FOLDER, handleNewFolderInProject);
    CommandManager.register(Strings.CMD_FILE_SAVE,          Commands.FILE_SAVE, handleFileSave);
    CommandManager.register(Strings.CMD_FILE_SAVE_ALL,      Commands.FILE_SAVE_ALL, handleFileSaveAll);
    CommandManager.register(Strings.CMD_FILE_SAVE_AS,       Commands.FILE_SAVE_AS, handleFileSaveAs);
    CommandManager.register(Strings.CMD_FILE_RENAME,        Commands.FILE_RENAME, handleFileRename);
    CommandManager.register(Strings.CMD_FILE_DELETE,        Commands.FILE_DELETE, handleFileDelete);
    
    CommandManager.register(Strings.CMD_FILE_CLOSE,         Commands.FILE_CLOSE, handleFileClose);
    CommandManager.register(Strings.CMD_FILE_CLOSE_ALL,     Commands.FILE_CLOSE_ALL, handleFileCloseAll);
    CommandManager.register(Strings.CMD_FILE_CLOSE_LIST,    Commands.FILE_CLOSE_LIST, handleFileCloseList);

    if (brackets.platform === "win") {
        CommandManager.register(Strings.CMD_EXIT,           Commands.FILE_QUIT, handleFileQuit);
    } else {
        CommandManager.register(Strings.CMD_QUIT,           Commands.FILE_QUIT, handleFileQuit);
    }
    
    // In-browser, we can't veto closing the way we do in-shell. Best we can do is ugly confirmation dialog via beforeunload
    if (brackets.inBrowser) {
        $(window).on("beforeunload", handleBeforeUnload);
    }

    CommandManager.register(Strings.CMD_NEXT_DOC,           Commands.NAVIGATE_NEXT_DOC, handleGoNextDoc);
    CommandManager.register(Strings.CMD_PREV_DOC,           Commands.NAVIGATE_PREV_DOC, handleGoPrevDoc);
    CommandManager.register(Strings.CMD_SHOW_IN_TREE,       Commands.NAVIGATE_SHOW_IN_FILE_TREE, handleShowInTree);
    CommandManager.register(Strings.CMD_SHOW_IN_OS,         Commands.NAVIGATE_SHOW_IN_OS, handleShowInOS);
    
    // These commands have no UI representation and are only used internally
    CommandManager.registerInternal(Commands.APP_ABORT_QUIT,            handleAbortQuit);
    CommandManager.registerInternal(Commands.APP_BEFORE_MENUPOPUP,      handleBeforeMenuPopup);
    CommandManager.registerInternal(Commands.FILE_CLOSE_WINDOW,         handleFileCloseWindow);
    CommandManager.registerInternal(Commands.APP_RELOAD,                handleReload);
    CommandManager.registerInternal(Commands.APP_RELOAD_WITHOUT_EXTS,   handleReloadWithoutExts);
    
    // Listen for changes that require updating the editor titlebar
    $(DocumentManager).on("dirtyFlagChange", handleDirtyChange);
    $(DocumentManager).on("fileNameChange", updateDocumentTitle);
    $(EditorManager).on("currentlyViewedFileChange", updateDocumentTitle);

    // Reset the untitled document counter before changing projects
    $(ProjectManager).on("beforeProjectClose", function () { _nextUntitledIndexToUse = 1; });
});
