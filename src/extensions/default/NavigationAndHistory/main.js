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
        Strings                 = brackets.getModule("strings"),
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
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        Mustache                = brackets.getModule("thirdparty/mustache/mustache");

    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));
    
    // Command constants for recent files
    var PREFS_RECENT_FILES      = "recent-files.navigation",
        SHOW_RECENT_FILES       = "recent-files.show",
        NEXT_IN_RECENT_FILES    = "recent-files.next",
        PREV_IN_RECENT_FILES    = "recent-files.prev",
        OPEN_FILES_VIEW_STATE   = "openFiles";
    
    var htmlTemplate = require("text!html/recentfiles-template.html"),
        dirtyDotTemplate = "<div class='file-status-icon dirty' style='position: absolute;margin-left: -2px;'></div>";
    
    var MAX_ENTRY_COUNT    = 50;
    
    var isRecentFilesNavEnabled = true;

    /*
    * Contains list of most recently opened files and their last known cursor position
    * @private
    * @type {Array.<Object>}
    */
    var _mrofList = [],
        $mrofContainer = null;
    
    
    var $currentContext,
        activeEditor;
    
    var _hideMROFList;
    
    PreferencesManager.definePreference(PREFS_RECENT_FILES, "boolean", true, {
        description: Strings.DESCRIPTION_RECENT_FILES_NAV
    });

    /**
     * Returns a 'context' object for getting/setting project-specific preferences
     */
    function _getPrefsContext() {
        var projectRoot = ProjectManager.getProjectRoot();
        return { location : { scope: "user", layer: "project", layerID: projectRoot && projectRoot.fullPath } };
    }

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
                if (contextData.cursor) {
                    activeEditor = EditorManager.getActiveEditor();
                    activeEditor.setCursorPos(contextData.cursor);
                    activeEditor.centerOnCursor();
                }
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
        return Async.doSequentially(_mrofList, _checkExt, false);
    }
    
    function _getFileListForEntries(entries) {
        return $.map(entries, function (value, index) {
            return FileSystem.getFileForPath(value.file);
        });
    }

    function _addDirectoriesForDuplicateBaseNames() {
        var checked = {}, baseName;
        // Find duplicates first
        $.map(_mrofList, function (value, index) {
            baseName = FileUtils.getBaseName(value.file);
            if (!checked[baseName]) {
                checked[baseName] = [];
            }
            checked[baseName].push(value);
        });

        // Go through the map and solve the arrays with length over 1. Ignore the rest.
        _.forEach(checked, function (value) {
            if (value.length > 1) {
                var dirs = ViewUtils.getDirNamesForDuplicateFiles(_getFileListForEntries(value));
                $.map(value, function (value, index) {
                    // Go through recent files and add directories to appropriate entries
                    $mrofContainer.find("#mrof-list > li").each(function () {
                        var $li = $(this);
                        if ($li.data("path") === value.file) {
                            var dirSplit = dirs[index].split("/");
                            if (dirSplit.length > 3) {
                                dirs[index] = dirSplit[0] + "/\u2026/" + dirSplit[dirSplit.length - 1];
                            }
                            var $dir = $("<span class='directory'/>").html(" &mdash; " + dirs[index]);
                            $li.children("a.mroitem").find("span.directory").remove();
                            $li.children("a.mroitem").append($dir);
                        }
                    });
                });
            }
        });
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
                // Try to see if we have same doc split
                // Check existing list for this doc path and active pane entry
                var entryIndex = _.findIndex(_mrofList, function (record) {
                    return (record.file === value.file && record.paneId === MainViewManager.getActivePaneId());
                });

                // If found don't process this entry, as the document is already present in active pane
                if (entryIndex >= 0) {
                    return true;
                } else {
                    // Process this for active pane id
                    value.paneId = MainViewManager.getActivePaneId();
                }
            }

            var indxInWS = MainViewManager.findInWorkingSet(value.paneId, value.file);

            data = {fullPath: value.file,
                    name: FileUtils.getBaseName(value.file),
                    isFile: true};
            
            fileEntry = FileSystem.getFileForPath(value.file);
            
            // Create new list item with a link
            $link = $("<a href='#' class='mroitem'></a>").html(ViewUtils.getFileEntryDisplay({name: FileUtils.getBaseName(value.file)}));
            
            // Use the file icon providers
            WorkingSetView.useIconProviders(data, $link);
            
            $newItem = $("<li></li>").append($link);
            
            if (indxInWS !== -1) { // in working set show differently
                $newItem.addClass("working-set");
            }

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
        _addDirectoriesForDuplicateBaseNames();
    }
    
    /**
     * This function is used to create mrof when a project is opened for the firt time with the recent files feature
     * This routine acts as a logic to migrate existing viewlist to mrof structure
     * @private
     */
    function _createMROFList() {

        var paneList = MainViewManager.getPaneIdList(),
            mrofList = [],
            fileList,
            index;

        var pane, file, mrofEntry, paneCount, fileCount;
        // Iterate over the pane ID list
        for (paneCount = 0; paneCount < paneList.length; paneCount++) {
            pane = paneList[paneCount];
            fileList = MainViewManager.getWorkingSet(pane);
            // Iterate over the file list for this pane
            for (fileCount = 0; fileCount < fileList.length; fileCount++) {
                file = fileList[fileCount];
                mrofEntry = _makeMROFListEntry(file.fullPath, pane, null);
                // Add it in the MRU list order
                index = MainViewManager.findInGlobalMRUList(pane, file);
                mrofList[index] = mrofEntry;
            }
        }

        return mrofList;
    }
    
    function _handleArrowKeys(event) {
        var UP = 38,
            DOWN = 40;

        var $context, $nextContext;
        if ($mrofContainer && (event.which === UP || event.which === DOWN)) {
            $context = $currentContext || $("#mrof-container #mrof-list > li.highlight");
            if ($context.length > 0) {
                $nextContext = event.which === UP ? $context.prev() : $context.next();
                if ($nextContext.length > 0) {
                    $currentContext = $nextContext;
                    //_resetOpenFileTimer();
                    $nextContext.find("a.mroitem").trigger("focus");
                }
            } else {
                //WTF! (Worse than failure). We should not get here.
                $("#mrof-container #mrof-list > li > a.mroitem:visited").last().trigger("focus");
            }
            // If we don't prevent this then scrolling happens by the browser(user agent behaviour)
            // as well as a result of moving focus in the ul
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }

    function _hideMROFListOnEscape(event) {
        if ($mrofContainer && event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
            _hideMROFList();
        }
    }

    /**
     * Shows the current MROF list
     * @private
     */
    function _createMROFDisplayList(refresh) {
        var $def = $.Deferred();
        
        var $mrofList, $link, $newItem;

        /**
         * Clears the MROF list in memory and pop over but retains the working set entries
         * @private
         */
        function _purgeAllExceptWorkingSet() {
            _mrofList = _createMROFList();
            $mrofList.empty();
            _createMROFDisplayList(true);
            $currentContext = null;
            PreferencesManager.setViewState(OPEN_FILES_VIEW_STATE, _mrofList, _getPrefsContext(), true);
        }

        if (!refresh) {
            // Call hide first to make sure we are not creating duplicate lists
            _hideMROFList();
            $mrofContainer = $(Mustache.render(htmlTemplate, {Strings: Strings})).appendTo('body');
            $("#mrof-list-close").one("click", _hideMROFList);
            // Attach clear list handler to the 'Clear All' button
            $("#mrof-container .footer > div#clear-mrof-list").on("click", _purgeAllExceptWorkingSet);
            $(window).on("keydown", _handleArrowKeys);
            $(window).on("keyup", _hideMROFListOnEscape);
        }
        
        $mrofList = $mrofContainer.find("#mrof-list");
        
        /**
         * Focus handler for the link in list item 
         * @private
         */
        function _onFocus(event) {
            var $scope = $(event.target).parent();
            $("#mrof-container #mrof-list > li.highlight").removeClass("highlight");
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

        var data, fileEntry;
        
        _syncWithFileSystem().always(function () {
            _mrofList = _mrofList.filter(function (e) {return e; });
            _createFileEntries($mrofList);
            var $fileLinks = $("#mrof-container #mrof-list > li > a.mroitem");
            // Handlers for mouse events on the list items
            $fileLinks.on("focus", _onFocus);
            $fileLinks.on("click", _onClick);
            $fileLinks.on("select", _onClick);

            // Put focus on the Most recent file link in the list
            $fileLinks.first().trigger("focus");

            $def.resolve();
        });

        return $def.promise();
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

        $context = $currentContext || $("#mrof-container #mrof-list > li.highlight");
        if ($context.length > 0) {
            $next = $context.next();
            if ($next.length === 0) {
                $next = $("#mrof-container #mrof-list > li").first();
            }
            if ($next.length > 0) {
                $currentContext = $next;
                $next.find("a.mroitem").trigger("focus");
            }
        } else {
            //WTF! (Worse than failure). We should not get here.
            $("#mrof-container #mrof-list > li > a.mroitem:visited").last().trigger("focus");
        }
    }

    function _cmdMoveNext() {
        var $displayPromise;
        if (!$mrofContainer) {
            $displayPromise = _createMROFDisplayList();
            $mrofContainer.addClass("confirmation-mode");
            $(window).on("keyup", _hideMROFListOnNavigationEnd);
        }

        if ($displayPromise) {
            $displayPromise.always(function () {
                _moveNext();
            });
        } else {
            _moveNext();
        }
    }

    /**
     * Opens the previous item in MROF list if pop over is visible else displays the pop over 
     * @private
     */
    function _movePrev() {
        var $context, $prev;

        $context = $currentContext || $("#mrof-container #mrof-list > li.highlight");
        if ($context.length > 0) {
            $prev = $context.prev();
            if ($prev.length === 0) {
                $prev = $("#mrof-container #mrof-list > li").last();
            }
            if ($prev.length > 0) {
                $currentContext = $prev;
                $prev.find("a.mroitem").trigger("focus");
            }
        } else {
            //WTF! (Worse than failure). We should not get here.
            $("#mrof-container #mrof-list > li > a.mroitem:visited").last().trigger("focus");
        }
    }
    
    function _cmdMovePrev() {
        var $displayPromise;
        if (!$mrofContainer) {
            $displayPromise = _createMROFDisplayList();
            $mrofContainer.addClass("confirmation-mode");
            $(window).on("keyup", _hideMROFListOnNavigationEnd);
        }

        if ($displayPromise) {
            $displayPromise.always(function () {
                _movePrev();
            });
        } else {
            _movePrev();
        }
    }

    function _updateCursorPosition(filePath, paneId, cursorPos) {
        if (!paneId) { // Don't handle this if not a full view/editor
            return;
        }

        // Check existing list for this doc path and pane entry
        var index = _.findIndex(_mrofList, function (record) {
            return (record.file === filePath && record.paneId === paneId);
        });

        var entry;

        if (index !== -1) {
            _mrofList[index].cursor = cursorPos;
        }

        PreferencesManager.setViewState(OPEN_FILES_VIEW_STATE, _mrofList, _getPrefsContext(), true);
    }

    /**
     * Adds an entry to MROF list
     * @private
     * @param {Editor} editor - editor to extract file information
     */
    function _addToMROFList(filePath, paneId, cursorPos) {
        
        if (!paneId) { // Don't handle this if not a full view/editor
            return;
        }


        // Check existing list for this doc path and pane entry
        var index = _.findIndex(_mrofList, function (record) {
            return (record.file === filePath && record.paneId === paneId);
        });

        var entry;
        if (index !== -1) {
            entry = _mrofList[index];
            if (entry.cursor && !cursorPos) {
                cursorPos = entry.cursor;
            }
        }

        entry = _makeMROFListEntry(filePath, paneId, cursorPos);

        if (index !== -1) {
            _mrofList.splice(index, 1);
        }

        // add it to the front of the list
        _mrofList.unshift(entry);

        PreferencesManager.setViewState(OPEN_FILES_VIEW_STATE, _mrofList, _getPrefsContext(), true);
    }
    

    // To update existing entry if a move has happened
    function _handleWorkingSetMove(event, file, sourcePaneId, destinationPaneId) {
        // Check existing list for this doc path and source pane entry
        var index = _.findIndex(_mrofList, function (record) {
            return (record.file === file.fullPath && record.paneId === sourcePaneId);
        }), tIndex;
        // If an entry is found update the pane info
        if (index >= 0) {
            // But an entry with the target pane Id should not exist
            tIndex = _.findIndex(_mrofList, function (record) {
                return (record.file === file.fullPath && record.paneId === destinationPaneId);
            });
            if (tIndex === -1) {
                _mrofList[index].paneId = destinationPaneId;
            } else {
                // Remove this entry as it has been moved.
                _mrofList.splice(index, 1);
            }
        }
    }
    
    // Handle project close or app close to set view state
    function _handleAppClose() {
        PreferencesManager.setViewState(OPEN_FILES_VIEW_STATE, _mrofList, _getPrefsContext(), true);
        _mrofList = [];
    }
    
    function _initRecentFilesList() {
        _mrofList = PreferencesManager.getViewState(OPEN_FILES_VIEW_STATE, _getPrefsContext()) || [];
        // Have a check on the number of entries to fallback to working set if we detect corruption
        if (_mrofList.length < MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)) {
            _mrofList = _createMROFList();
        }
    }

    function _handleProjectOpen() {
        _mrofList = [];
        // We will do a late initialization once we get the first editor change or file open notification
    }

    ProjectManager.on("projectOpen", _handleProjectOpen);

    
    function _showRecentFileList() {
        if (isRecentFilesNavEnabled) {
            _createMROFDisplayList();
        }
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

        $(window).off("keydown", _handleArrowKeys);
        $(window).off("keyup", _hideMROFListOnNavigationEnd);
        $(window).off("keyup", _hideMROFListOnEscape);
    };

    // To take care of hiding the popover during app navigation in os using key board shortcuts
    $(window).on("blur focus", function () {
        _hideMROFList();
    });
    
    // Merges the entries to a single pane if split view have been merged
    // Then purges duplicate entries in mrof list
    function _handlePaneMerge(e, paneId) {
        var index;
        var targetPaneId = MainViewManager.FIRST_PANE;

        $.each(_mrofList, function (itrIndex, value) {
            if (value && value.paneId === paneId) { // We have got an entry which needs merge
                // Before modifying the actual pane info check if an entry exists with same target pane
                index = _.findIndex(_mrofList, function (record) {
                    return (record.file === value.file && record.paneId === targetPaneId);
                });
                if (index !== -1) { // A duplicate entry found, remove the current one instead of updating
                    _mrofList[index] = null;
                } else { // Update with merged pane info
                    _mrofList[itrIndex].paneId = targetPaneId;
                }
            }
        });

        // Clean the null/undefined entries
        _mrofList = _mrofList.filter(function (e) {return e; });

        PreferencesManager.setViewState(OPEN_FILES_VIEW_STATE, _mrofList, _getPrefsContext(), true);
    }

    function _initRecentFileMenusAndCommands() {
        // Command to show recent files list

        if (!CommandManager.get(SHOW_RECENT_FILES)) {
            CommandManager.register(Strings.CMD_RECENT_FILES_OPEN, SHOW_RECENT_FILES, _showRecentFileList);
            KeyBindingManager.addBinding(SHOW_RECENT_FILES, KeyboardPrefs[SHOW_RECENT_FILES]);
        }
        
        // Keybooard only - Navigate to the next doc in MROF list
        if (!CommandManager.get(NEXT_IN_RECENT_FILES)) {
            CommandManager.register(Strings.CMD_NEXT_DOC, NEXT_IN_RECENT_FILES, _cmdMoveNext);
        }
        KeyBindingManager.addBinding(NEXT_IN_RECENT_FILES, KeyboardPrefs[NEXT_IN_RECENT_FILES]);
       
        // Keybooard only - Navigate to the prev doc in MROF list
        if (!CommandManager.get(PREV_IN_RECENT_FILES)) {
            CommandManager.register(Strings.CMD_PREV_DOC, PREV_IN_RECENT_FILES, _cmdMovePrev);
        }
        KeyBindingManager.addBinding(PREV_IN_RECENT_FILES, KeyboardPrefs[PREV_IN_RECENT_FILES]);
        
        var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
        menu.addMenuItem(SHOW_RECENT_FILES, "", Menus.AFTER, Commands.FILE_OPEN_FOLDER);
    }

    function _initDefaultNavigationCommands() {
        KeyBindingManager.addBinding(Commands.NAVIGATE_NEXT_DOC, KeyboardPrefs[NEXT_IN_RECENT_FILES]);
        KeyBindingManager.addBinding(Commands.NAVIGATE_PREV_DOC, KeyboardPrefs[PREV_IN_RECENT_FILES]);
    }

    function _removeKeys(keys) {
        _.forEach(keys, function (config) {
            KeyBindingManager.removeBinding(config.key);
        });
    }

    function _removeNavigationKeys() {
        _removeKeys(KeyboardPrefs[NEXT_IN_RECENT_FILES]);
        _removeKeys(KeyboardPrefs[PREV_IN_RECENT_FILES]);
    }

    function _deregisterSortcutsAndMenus() {
        _removeNavigationKeys();
        Menus.getMenu(Menus.AppMenuBar.FILE_MENU).removeMenuItem(SHOW_RECENT_FILES);
    }

    // Handle current file change
    function handleCurrentFileChange(e, newFile, newPaneId, oldFile) {
        if (newFile) {
            if (_mrofList.length === 0) {
                _initRecentFilesList();
            }

            _addToMROFList(newFile.fullPath, newPaneId);
        }
    }

    // Handle Active Editor change to update mrof information
    function _handleActiveEditorChange(event, current, previous) {
        if (current) { // Handle only full editors
            if (_mrofList.length === 0) {
                _initRecentFilesList();
            }

            var filePath = current.document.file.fullPath;
            var paneId = current._paneId;
            _addToMROFList(filePath, paneId, current.getCursorPos(true, "first"));
        }

        if (previous) { // Capture the last know cursor position
            _updateCursorPosition(previous.document.file.fullPath, previous._paneId, previous.getCursorPos(true, "first"));
        }
    }

    function _attachListners() {
        MainViewManager.on("workingSetMove.pane-first-pane", _handleWorkingSetMove);
        MainViewManager.on("currentFileChange", handleCurrentFileChange);
        MainViewManager.on("paneDestroy", _handlePaneMerge);
        EditorManager.on("activeEditorChange", _handleActiveEditorChange);
        ProjectManager.on("beforeProjectClose beforeAppClose", _handleAppClose);
    }

    function _detachListners() {
        MainViewManager.off("workingSetMove.pane-first-pane", _handleWorkingSetMove);
        MainViewManager.off("currentFileChange", handleCurrentFileChange);
        MainViewManager.off("paneDestroy", _handlePaneMerge);
        EditorManager.off("activeEditorChange", _handleActiveEditorChange);
        ProjectManager.off("beforeProjectClose beforeAppClose", _handleAppClose);
    }

    PreferencesManager.on("change", PREFS_RECENT_FILES, function () {
        if (PreferencesManager.get(PREFS_RECENT_FILES)) {
            _removeNavigationKeys();
            _initRecentFileMenusAndCommands();
            _mrofList = [];
            _initRecentFilesList();
            PreferencesManager.setViewState(OPEN_FILES_VIEW_STATE, _mrofList, _getPrefsContext(), true);
            _detachListners();
            _attachListners();
            isRecentFilesNavEnabled = true;
        } else {
            // Reset the view state to empty
            _mrofList = [];
            PreferencesManager.setViewState(OPEN_FILES_VIEW_STATE, _mrofList, _getPrefsContext(), true);
            _deregisterSortcutsAndMenus();
            _initDefaultNavigationCommands();
            _detachListners();
            isRecentFilesNavEnabled = false;
        }
    });

    AppInit.appReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/recent-files.css");
    });
});
