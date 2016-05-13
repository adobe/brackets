/*
 * Copyright (c) 2016 - present Adobe Systems Incorporated. All rights reserved.
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

    var _                       = brackets.getModule("thirdparty/lodash"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        Async                   = brackets.getModule("utils/Async"),
        MainViewManager         = brackets.getModule("view/MainViewManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        DocumentCommandHandlers = brackets.getModule("document/DocumentCommandHandlers"),
        EditorManager           = brackets.getModule("editor/EditorManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Commands                = brackets.getModule("command/Commands"),
        Dialogs                 = brackets.getModule("widgets/Dialogs"),
        Menus                   = brackets.getModule("command/Menus"),
        FileSystem              = brackets.getModule("filesystem/FileSystem"),
        FileUtils               = brackets.getModule("file/FileUtils"),
        ViewUtils               = brackets.getModule("utils/ViewUtils"),
        KeyEvent                = brackets.getModule("utils/KeyEvent"),
        WorkingSetView          = brackets.getModule("project/WorkingSetView"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        KeyBindingManager       = brackets.getModule("command/KeyBindingManager"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils");
    
    // Command constants for recent files
    var SHOW_RECENT_FILES       = "show.recent.files",
        NEXT_IN_RECENT_FILES    = "next.recent.files",
        PREV_IN_RECENT_FILES    = "prev.recent.files";
    
    var htmlTemplate = require("text!html/recentfiles-template.html"),
        dirtyDotTemplate = "<div class='file-status-icon dirty' style='position: absolute;margin-left: -2px;'></div>";
    
    var MAX_ENTRY_COUNT    = 50;
    
    /*
    * Contains list of most recently opened files and their last known cursor position
    * @private
    * @type {Array.<Object>}
    */
    var _mrofList = [],
        $mrofContainer = null,
        _activePaneId = null;
    
    
    var $currentContext,
        hideTimeoutVar,
        openFileTimeoutVar,
        activeEditor;
    
    var _hideMROFList;
    
    /**
     * Opens a full editor for the given context
     * @private
     * @param {Object.<path, paneId, cursor>} contextData - wrapper to provide the information required to open a full editor
     * @return {$.Promise} - from the commandmanager 
     */
    function _openEditorForContext(contextData) {
        // Open the file in the current active pane to prevent unwanted scenarios if we are not in split view, fallback
        // to the persisted paneId when specified and we are in split view or unable to determine the paneid
        var activePaneId = MainViewManager.getActivePaneId(),
            targetPaneId = contextData.paneId; // Assume we are going to use the last associated paneID

        // Detect if we are not in split mode
        if (MainViewManager.getPaneCount() === 1) {
            // Override the targetPaneId with activePaneId as we are not yet in split mode
            targetPaneId = activePaneId;
        }

        // If hide of MROF list is a context parameter, hide the MROF list on successful file open
        if (contextData.hideOnOpenFile) {
            _hideMROFList();
        }

        return CommandManager
            .execute(Commands.FILE_OPEN,
                    {   fullPath: contextData.path,
                        paneId: targetPaneId
                    }
                )
            .done(function () {
                activeEditor = EditorManager.getActiveEditor();
                activeEditor.setCursorPos(contextData.cursor);
                activeEditor.centerOnCursor();
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
    
    /** 
     * Returns a 'context' object for getting/setting project-specific preferences 
     */
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
    
    function _createFileEntries($mrofList) {
        var data, fileEntry, $link, $newItem;
        // Iterate over the MROF list and create the pop over UI items

        // If we are in split view we might want to show the panes corresponding to the entries
        var isPaneLabelReqd = MainViewManager.getPaneCount() > 1;

        if (isPaneLabelReqd) {
            $mrofContainer.addClass("split-mode");
            $(".first.pane-label", $mrofContainer).text(MainViewManager.getPaneTitle("first-pane"));
            $(".second.pane-label", $mrofContainer).text(MainViewManager.getPaneTitle("second-pane"));
        }

        $.each(_mrofList, function (index, value) {
            
            if (!isPaneLabelReqd && value.paneId !== MainViewManager.getActivePaneId()) {
                return true;
            }

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
            
            if (isPaneLabelReqd && value.paneId) {
                $newItem.addClass(value.paneId);
                $newItem.css('top', ($('.' + value.paneId, $mrofList).length * 22) + 'px');
            }

            // Use the class providers(git e.t.c)
            WorkingSetView.useClassProviders(data, $newItem);
            
            // If a file is dirty , mark it in the list
            if (_isOpenAndDirty(fileEntry)) {
                $(dirtyDotTemplate).prependTo($newItem);
            }
            
            $mrofList.append($newItem);

            if (index === MAX_ENTRY_COUNT - 1) {
                // We have reached the max number of entries we can display, break out
                return false;
            }
        });
    }
    
    function _clearTimers() {
        if (openFileTimeoutVar) {
            window.clearTimeout(openFileTimeoutVar);
        }
        if (hideTimeoutVar) {
            window.clearTimeout(hideTimeoutVar);
        }
    }
    
    /**
     * Shows the current MROF list
     * @private
     */
    function _createMROFDisplayList() {
        
        // Cancel Any timer that might be active
        _clearTimers();
        
        // Call hide first to make sure we are not creating duplicate lists 
        _hideMROFList();
        
        var $link, $newItem;
        //Dialogs.showModalDialogUsingTemplate($(htmlTemplate));
        $mrofContainer = $(htmlTemplate).appendTo('body');//$("#mrof-container");
        var $mrofList = $mrofContainer.find("#mrof-list");
        
        /**
         * Focus handler for the link in list item 
         * @private
         */
        function _onFocus(event) {
            var $scope = $(event.target).parent();
            $("#mrof-container > #mrof-list > li.highlight").removeClass("highlight");
            $(event.target).parent().addClass("highlight");
            $mrofContainer.find("#recent-file-path").text($scope.data("path"));
            $mrofContainer.find("#recent-file-path").attr('title', ($scope.data("path")));
            $currentContext = $scope;
        }
        
        /**
         * Click handler for the link in list item 
         * @private
         */
        function _onClick(event) {
            var $scope = $(event.delegateTarget).parent();
            _openEditorForContext({
                path: $scope.data("path"),
                paneId: $scope.data("paneId"),
                cursor: $scope.data("cursor"),
                hideOnOpenFile: true
            });
        }
        
        /**
         * Clears the MROF list in memory and pop over
         * @private
         */
        function _clearMROFList() {
            _mrofList = [];
            $mrofList.empty();
            $currentContext = null;
            PreferencesManager.setViewState("openFiles", _mrofList, _getPrefsContext(), true);
        }
        
        $("#mrof-list-close").one("click", _hideMROFList);
        
        var data, fileEntry;
        
        _syncWithFileSystem();
        
        _createFileEntries($mrofList);
        
        var $fileLinks = $("#mrof-container > #mrof-list > li > a.mroitem");
        // Handlers for mouse events on the list items
        $fileLinks.on("focus", _onFocus);
        $fileLinks.on("click", _onClick);
        $fileLinks.on("select", _onClick);
        
        // Put focus on the Most recent file link in the list
        $fileLinks.first().trigger("focus");
        
        // Attach clear list handler to the 'Clear All' button
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
    
    function _hideMROFListOnNavigationEnd(event) {
        if ($mrofContainer && event.keyCode === KeyEvent.DOM_VK_CONTROL) {
            _openFile();
            _hideMROFList();
        }
    }
    
    /**
     * Opens the next item in MROF list if pop over is visible else displays the pop over 
     * @private
     */
    function _moveNext() {
        var $context, $next;

        if (!$mrofContainer) {
            _createMROFDisplayList();
            $mrofContainer.addClass("confirmation-mode");
            $(window).on("keyup", _hideMROFListOnNavigationEnd);
        }

        $context = $currentContext || $("#mrof-container > #mrof-list > li.highlight");
        if ($context.length > 0) {
            $next = $context.next();
            if ($next.length === 0) {
                $next = $("#mrof-container > #mrof-list > li").first();
            }
            if ($next.length > 0) {
                $currentContext = $next;
                $next.find("a.mroitem").trigger("focus");
            }
        } else {
            //WTF! (Worse than failure). We should not get here.
            $("#mrof-container > #mrof-list > li > a.mroitem:visited").last().trigger("focus");
        }
    }

    /**
     * Opens the previous item in MROF list if pop over is visible else displays the pop over 
     * @private
     */
    function _movePrev() {
        var $context, $prev;

        if (!$mrofContainer) {
            _createMROFDisplayList();
            $mrofContainer.addClass("confirmation-mode");
            $(window).on("keyup", _hideMROFListOnNavigationEnd);
        }

        $context = $currentContext || $("#mrof-container > #mrof-list > li.highlight");
        if ($context.length > 0) {
            $prev = $context.prev();
            if ($prev.length === 0) {
                $prev = $("#mrof-container > #mrof-list > li").last();
            }
            if ($prev.length > 0) {
                $currentContext = $prev;
                $prev.find("a.mroitem").trigger("focus");
            }
        } else {
            //WTF! (Worse than failure). We should not get here.
            $("#mrof-container > #mrof-list > li > a.mroitem:visited").last().trigger("focus");
        }
    }
    
    /**
     * Adds an entry to MROF list
     * @private
     * @param {Editor} editor - editor to extract file information
     */
    function _addToMROFList(editor) {
        
        var filePath = editor.document.file.fullPath;
        var paneId = editor._paneId;
        
        // Check existing list for this doc path and pane entry
        var index = _.findIndex(_mrofList, function (record) {
            return (record.file === filePath && record.paneId === paneId);
        });

        var entry = _makeMROFListEntry(filePath, editor._paneId, editor.getCursorPos(true, "first"));

        if (index !== -1) {
            _mrofList.splice(index, 1);
        }

        // add it to the front of the list
        _mrofList.unshift(entry);
    }
    
    /**
     * This function is used to create mrof when a project is opened for the firt time with the recent files feature
     * This routine acts as a logic to migrate existing viewlist to mrof structure
     * @private
     */
    function _createMROFList() {

        var docList = DocumentManager.getAllOpenDocuments(),
            mrofList = [];

        var doc, editor, mrofEntry;
        // Iterate over the open documents
        for (doc in docList) {
            if (docList.hasOwnProperty(doc)) {
                editor = doc._masterEditor;
                // We will add an mrof entry only if there is a full editor created and attached to a pane
                if (editor && editor._paneId) {
                    mrofEntry = _makeMROFListEntry(doc.file.fullPath, editor._paneId, editor.getCursorPos(true, "first"));
                    // Append it in the begining of the list
                    mrofList.unshift(mrofEntry);
                }
            }
        }

        return mrofList;
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
        _mrofList = PreferencesManager.getViewState("openFiles", _getPrefsContext()) || _createMROFList();
        _syncWithFileSystem();
    });
    
    function _handleArrowKeys(event) {
        var LEFT = 37,
            RIGHT = 39;
        
        var $context, $nextContext;
        if ($mrofContainer && (event.which === LEFT || event.which === RIGHT)) {
            $context = $currentContext || $("#mrof-container > #mrof-list > li.highlight");
            if ($context.length > 0) {
                $nextContext = event.which === LEFT ? $context.prev() : $context.next();
                if ($nextContext.length > 0) {
                    $currentContext = $nextContext;
                    //_resetOpenFileTimer();
                    $nextContext.find("a.mroitem").trigger("focus");
                }
            } else {
                //WTF! (Worse than failure). We should not get here.
                $("#mrof-container > #mrof-list > li > a.mroitem:visited").last().trigger("focus");
            }
        }
    }
    
    function _showRecentFileList() {
        _createMROFDisplayList();
        $(window).on("keyup", _handleArrowKeys);
    }
    
    /**
     * Hides the current MROF list if visible
     * @private
     */
    _hideMROFList = function () {

        if ($mrofContainer) {
            $mrofContainer.remove();
            $mrofContainer = null;
            $currentContext = null;
            activeEditor = EditorManager.getActiveEditor();
            if (activeEditor) {
                activeEditor.focus();
            }
        }

        $(window).off("keyup", _handleArrowKeys);
        $(window).off("keyup", _hideMROFListOnNavigationEnd);
    };

    var MRUListNavigationProvider = {
        handleNext: _moveNext,
        handlePrev: _movePrev
    };
    
    //DocumentCommandHandlers.registerMRUListNavigator(MRUListNavigationProvider);

    AppInit.appReady(function () {
        
        ExtensionUtils.loadStyleSheet(module, "styles/recent-files.css");
        
        // Command to show recent files list
        CommandManager.register("Open Recent", SHOW_RECENT_FILES, _showRecentFileList);
        
        // Keybooard only - Navigate to the next doc in MROF list
        CommandManager.register("Next in Recent", NEXT_IN_RECENT_FILES, _moveNext);
       
        // Keybooard only - Navigate to the prev doc in MROF list
        CommandManager.register("Prev in Recent", PREV_IN_RECENT_FILES, _movePrev);
        
        var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
        menu.addMenuItem(SHOW_RECENT_FILES, "", Menus.AFTER, Commands.FILE_OPEN_FOLDER);
    });
});
