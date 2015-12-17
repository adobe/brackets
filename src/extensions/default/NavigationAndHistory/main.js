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

/*jslint vars: true, plusplus: true, devel: true, regexp: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, brackets */



define(function (require, exports, module) {
    "use strict";

    var _                   = brackets.getModule("thirdparty/lodash"),
        AppInit             = brackets.getModule("utils/AppInit"),
        Async               = brackets.getModule("utils/Async"),
        MainViewManager     = brackets.getModule("view/MainViewManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Commands            = brackets.getModule("command/Commands"),
        Menus               = brackets.getModule("command/Menus"),
        FileSystem          = brackets.getModule("filesystem/FileSystem"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        ViewUtils           = brackets.getModule("utils/ViewUtils"),
        WorkingSetView      = brackets.getModule("project/WorkingSetView"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager");
    
    // Command constants for recent files
    var SHOW_RECENT_FILES       = "show.recent.files",
        NEXT_IN_RECENT_FILES    = "next.recent.files",
        PREV_IN_RECENT_FILES    = "prev.recent.files";
    
    var htmlTemplate = require("text!html/recentfiles-template.html");
    
    var $currentContext,
        hideTimeoutVar,
        openFileTimeoutVar;
    
    // Delay in ms for hide timer when open recent files dialog shown from keyborad only commands
    var HIDE_TIMEOUT_DELAY = 1500,
        OPEN_FILE_DELAY    = 600;
    
    /*
    * Contains list of most recently opened files and their last known cursor position
    * @private
    * @type {Array.<Object>}
    */
    var _mrofList = [],
        $mrofContainer,
        _activePaneId = null;
    
    /**
     * Opens a full editor for the given context
     * @private
     * @param {Object.<path, paneId, cursor>} contextData - wrapper to provide the information required to open a full editor
     * @return {$.Promise} - from the commandmanager 
     */
    function _openEditorForContext(contextData) {
        return CommandManager.execute(Commands.FILE_OPEN, {fullPath: contextData.path,
                                                    paneId: contextData.paneId }).done(function () {
            EditorManager.getActiveEditor().setCursorPos(contextData.cursor);
            EditorManager.getActiveEditor().centerOnCursor();
        });
    }
    
    /**
     * Creates an entry for MROF list
     * @private
     * @param {String} path - full path of a doc
     * @param {String} pane - the pane holding the editor for the doc
     * @param {Object} cursorPos - current cursor position
     * @return {Object} a frame containing file path, pane and last known cursor
     */
    function _makeMROFListEntry(path, pane, cursorPos) {
        return {
            file: path,
            paneId: pane,
            cursor: cursorPos
        };
    }
    
    /**
     * Determines if a file is dirty
     * @private
     * @param {!File} file - file to test
     * @return {boolean} true if the file is dirty, false otherwise
     */
    function _isOpenAndDirty(file) {
        // working set item might never have been opened; if so, then it's definitely not dirty
        var docIfOpen = DocumentManager.getOpenDocumentForPath(file.fullPath);
        return (docIfOpen && docIfOpen.isDirty);
    }
    
    /** Returns a 'context' object for getting/setting project-specific preferences */
    function _getPrefsContext() {
        var projectRoot = ProjectManager.getProjectRoot();
        return { location : { scope: "user", layer: "project", layerID: projectRoot && projectRoot.fullPath } };
    }
    
    
    function _checkExt(entry, index) {
        var deferred = new $.Deferred(),
            fileEntry = FileSystem.getFileForPath(entry.file);

        fileEntry.exists(function (err, exists) {
            if (!err && exists) {
                deferred.resolve();
            } else {
                _mrofList[index] = null;
                deferred.reject();
            }
        });

        return deferred.promise();
    }
    
    /**
     * Checks whether entries in MROF list actually exists in fileSystem to prevent access to deleted files 
     * @private
     */
    function _syncWithFileSystem() {
        _mrofList = _mrofList.filter(function (e) {return e; });
        Async.doSequentially(_mrofList, _checkExt, false);
        _mrofList = _mrofList.filter(function (e) {return e; });
    }
    
    /**
     * Hides the current MROF list if visible
     * @private
     */
    function _hideMROFList() {
        if ($mrofContainer) {
            $mrofContainer.remove();
            $mrofContainer = null;
            $currentContext = null;
            if (EditorManager.getActiveEditor()) {
                EditorManager.getActiveEditor().focus();
            }
            hideTimeoutVar = null;
        }
    }
    
    /**
     * Shows the current MROF list
     * @private
     */
    function _createMROFDisplayList() {
        var $link, $newItem;
        $mrofContainer = $(htmlTemplate).appendTo("#editor-holder");
        var $mrofList = $mrofContainer.find("#mrof-list");
        
        /**
         * Focus handler for the link in list item 
         * @private
         */
        function _onFocus(event) {
            $("#mrof-container > #mrof-list > li.highlight").removeClass("highlight");
            $(event.target).parent().addClass("highlight");
            $mrofContainer.find("#recent-file-path").text($(event.target).parent().data("path"));
            $currentContext = $(event.target).parent();
        }
        
        /**
         * Click handler for the link in list item 
         * @private
         */
        function _onClick(event) {
            var $context = $(event.target).parent();
            _openEditorForContext({
                path: $context.data("path"),
                paneId: $context.data("paneId"),
                cursor: $context.data("cursor")
            });
        }
        
        /**
         * Clears the MROF list in memory and pop over
         * @private
         */
        function _clearMROFList() {
            _mrofList = [];
            $mrofList.empty();
        }
        
        $("#mrof-list-close").one("click", _hideMROFList);
        
        var data, fileEntry;
        
        _syncWithFileSystem();
        
        // Iterate over the MROF list and create the pop over UI items
        $.each(_mrofList, function (index, value) {
            
            data = {fullPath: value.file,
                    name: FileUtils.getBaseName(value.file),
                    isFile: true};
            
            fileEntry = FileSystem.getFileForPath(value.file);
            
            // Create new list item with a link
            $link = $("<a href='#' class='mroitem'></a>").html(ViewUtils.getFileEntryDisplay({name: FileUtils.getBaseName(value.file)}));
            
            // Use the file icon providers
            WorkingSetView.useIconProviders(data, $link);
            
            $newItem = $("<li></li>").append($link);
            
            $newItem.data("path", value.file);
            $newItem.data("paneId", value.paneId);
            $newItem.data("cursor", value.cursor);
            $newItem.data("file", fileEntry);
            $newItem.attr("title", value.file);
            
            // Use the class providers(git e.t.c)
            WorkingSetView.useClassProviders(data, $newItem);
            
            if (_isOpenAndDirty(fileEntry)) {
                $("<div class='file-status-icon dirty' style='position: static;float:left;margin-left: -5px;'></div>").prependTo($newItem);
            }
            
            $mrofList.append($newItem);
        });
        
        // Handlers for mouse events on the list items
        $("#mrof-container > #mrof-list > li > a.mroitem").on("focus", _onFocus);
        $("#mrof-container > #mrof-list > li > a.mroitem").on("click", _onClick);
        $("#mrof-container > #mrof-list > li > a.mroitem").on("select", _onClick);
        $("#mrof-container > #mrof-list > li > a.mroitem").first().trigger("focus");
        $("#mrof-container > .footer > div#clear-mrof-list").on("click", _clearMROFList);
    }
    
    function _openFile() {
        if ($currentContext) {
            _openEditorForContext({
                path: $currentContext.data("path"),
                paneId: $currentContext.data("paneId"),
                cursor: $currentContext.data("cursor")
            });
        }
    }
    
    function _startHideTimer() {
        hideTimeoutVar = setTimeout(_hideMROFList, HIDE_TIMEOUT_DELAY);
    }
    
    function _resetHideTimer() {
        if (hideTimeoutVar) {
            window.clearTimeout(hideTimeoutVar);
        }
        _startHideTimer();
    }
    
    function _startOpenFileTimer() {
        openFileTimeoutVar =  setTimeout(_openFile, OPEN_FILE_DELAY);
    }
    
    function _resetOpenFileTimer() {
        if (openFileTimeoutVar) {
            window.clearTimeout(openFileTimeoutVar);
        }
        _startOpenFileTimer();
    }
    
    /**
     * Opens the next item in MROF list if pop over is visible else displays the pop over 
     * @private
     */
    function _moveNext() {
        var $context, $next;
        if ($mrofContainer) {
            $context = $currentContext || $("#mrof-container > #mrof-list > li.highlight");
            if ($context.length > 0) {
                $next = $context.next();
                if ($next.length > 0) {
                    $currentContext = $next;
                    _resetOpenFileTimer();
                    $next.find("a.mroitem").trigger("focus");
                }
            } else {
                //WTF! (Worse than failure). We should not get here.
                $("#mrof-container > #mrof-list > li > a.mroitem:visited").last().trigger("focus");
            }
            _resetHideTimer();
        } else {
            _createMROFDisplayList();
            $mrofContainer.addClass("confirmation-mode");
            _startHideTimer();
        }
    }

    /**
     * Opens the previous item in MROF list if pop over is visible else displays the pop over 
     * @private
     */
    function _movePrev() {
        var $context, $prev;
        if ($mrofContainer) {
            $context = $currentContext || $("#mrof-container > #mrof-list > li.highlight");
            if ($context.length > 0) {
                $prev = $context.prev();
                if ($prev.length > 0) {
                    $currentContext = $prev;
                    _resetOpenFileTimer();
                    $prev.find("a.mroitem").trigger("focus");
                }
            } else {
                //WTF! (Worse than failure). We should not get here.
                $("#mrof-container > #mrof-list > li > a.mroitem:visited").last().trigger("focus");
            }
            _resetHideTimer();
        } else {
            _createMROFDisplayList();
            $mrofContainer.addClass("confirmation-mode");
            _startHideTimer();
        }
    }
    
    /**
     * Adds an entry to MROF list
     * @private
     * @param {Editor} editor - editor to extract file information
     */
    function _addToMROFList(editor) {
        
        var filePath = editor.document.file.fullPath;
        
        // Check existing list for this doc path and pane entry
        var index = _.findIndex(_mrofList, function (record) {
            return (record.file === filePath && record.paneId === editor._paneId);
        });

        var entry = _makeMROFListEntry(filePath, editor._paneId, editor.getCursorPos(true, "first"));

        if (index !== -1) {
            _mrofList.splice(index, 1);
        }

        // add it to the front of the list
        _mrofList.unshift(entry);
    }
    
    EditorManager.on("activeEditorChange", function (event, current, previous) {
        if (previous) {
            _addToMROFList(previous);
        }
        
        if (current) {
            _addToMROFList(current);
            _activePaneId = MainViewManager.getActivePaneId();
        }
    });
    
    ProjectManager.on("beforeProjectClose beforeAppClose", function () {
        PreferencesManager.setViewState("openFiles", _mrofList, _getPrefsContext(), true);
        _mrofList = [];
    });
    
    ProjectManager.on("projectOpen", function () {
        _mrofList = PreferencesManager.getViewState("openFiles", _getPrefsContext()) || [];
        _syncWithFileSystem();
    });
    
    AppInit.appReady(function () {
        // Command to show recent files list
        CommandManager.register("Open Recent", SHOW_RECENT_FILES, _createMROFDisplayList);
        
        // Keybooard only - Navigate to the next doc in MROF list
        CommandManager.register("Next in Recent", NEXT_IN_RECENT_FILES, _moveNext);
       
        // Keybooard only - Navigate to the prev doc in MROF list
        CommandManager.register("Prev in Recent", PREV_IN_RECENT_FILES, _movePrev);
        
        var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
        menu.addMenuItem(SHOW_RECENT_FILES, "", Menus.AFTER, Commands.FILE_OPEN_FOLDER);
    });
});