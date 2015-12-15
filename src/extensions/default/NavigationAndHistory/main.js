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
/*global define, brackets */



define(function (require, exports, module) {
    "use strict";

    var _                   = brackets.getModule("thirdparty/lodash"),
        AppInit             = brackets.getModule("utils/AppInit"),
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
    
    var htmlTemplate = require("text!html/recentfiles-template.html");
    
    var _nextCmd, _prevCmd;
    
    /*
    * Contains list of most recently opened files and their last known cursor position
    */
    var _mrofList = [],
        _mrofLastPos = [];

    var _currentFrame = null,
        _currentEditor = null,
        _activePaneId = "",
        _inTransientState = false;
    
    function _synchCommands() {
        _prevCmd.setEnabled(_currentFrame && _currentFrame.prevFrame);
        _nextCmd.setEnabled(_currentFrame && _currentFrame.nextFrame);
    }
    
    function _restoreFromHistory(frame) {
        _inTransientState = true;
        CommandManager.execute(Commands.FILE_OPEN, {fullPath: frame.path,
                                                        paneId: frame.paneId }).done(function () {
            EditorManager.getActiveEditor().setCursorPos(frame.cursorPos);
            EditorManager.getActiveEditor().centerOnCursor();
        }).always(function () {
            _inTransientState = false;
            _currentFrame = frame;
            _synchCommands();
        });
    }
    
    function _createHistoryFrame(editor, cPos, currentFrame) {
        return {
            path: editor.document.file.fullPath,
            cursorPos: cPos || editor.getCursorPos(true, "start"),
            paneId: _activePaneId,
            prevFrame: currentFrame,
            nextFrame: null
        };
    }
    
    function _addHistoryFrame(editor, cPos) {
        var newFrame = _createHistoryFrame(editor, cPos, _currentFrame);
        if (_currentFrame) {
            _currentFrame.nextFrame = newFrame;
        }
        if (_currentFrame && _currentFrame.cursorPos === newFrame.cursorPos) {
            _currentFrame.nextFrame = null;
        } else {
            _currentFrame = newFrame;
        }
        _synchCommands();
    }
    
    function _navigateNext() {
        if (_currentFrame && _currentFrame.nextFrame) {
            _restoreFromHistory(_currentFrame.nextFrame);
        }
        _synchCommands();
    }
    
    function _navigatePrev() {
        if (_currentFrame && _currentFrame.prevFrame) {
            _restoreFromHistory(_currentFrame.prevFrame);
        }
        _synchCommands();
    }
    
    function _recordCursorPosChange(event, current, previous) {
        if (!_inTransientState && previous) {
            _addHistoryFrame(_currentEditor, previous);
        }
        if (!_inTransientState && current) {
            _addHistoryFrame(_currentEditor, current);
        }
    }
    
    function _makeMROFListEntry(path, pane, cursorPos) {
        return {
            file: path,
            paneId: pane,
            cursor: cursorPos
        }
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
    
    function _createMROFDisplayList() {
        var $link;
        var $mrofContainer = $(htmlTemplate).appendTo("#editor-holder"),
            $mrofList = $mrofContainer.find("#mrof-list");
        
        /*$(document).one("click","#mrof-container-close",function(){
            $mrofContainer.remove();
        });*/
        
        function _onFocus() {
            $mrofContainer.find("#recent-file-path").text($(this).parent().data("path"));
        }
        
        function _onClick() {
            var context = this;
            CommandManager.execute(Commands.FILE_OPEN, {fullPath: $(this).parent().data("path"),
                                                        paneId: $(this).parent().data("paneId") }).done(function () {
                EditorManager.getActiveEditor().setCursorPos($(context).parent().data("cursor"));
                EditorManager.getActiveEditor().centerOnCursor();
                $(context).trigger("focus");
            });
        }
        
        var data, fileEntry; 

        $.each(_mrofList, function( index, value ) {
            
            data = {fullPath: value.file,
                    name: FileUtils.getBaseName(value.file),
                    isFile: true};
            
            fileEntry = FileSystem.getFileForPath(value.file);
            
            // Create new list item with a link
            $link = $("<a href='#'></a>").html(ViewUtils.getFileEntryDisplay({name: FileUtils.getBaseName(value.file)}));            
            WorkingSetView.useIconProviders(data, $link);
            
            var $newItem = $("<li></li>").append($link);
            
            $newItem.data("path", value.file);
            $newItem.data("paneId", value.paneId);
            $newItem.data("cursor", value.cursor);
            $newItem.data("file", fileEntry);
            
            WorkingSetView.useClassProviders(data, $newItem);
            
            if (_isOpenAndDirty(fileEntry)) {
                $("<div class='file-status-icon dirty' style='position: static;float:left;margin-left: -6px;'></div>").prependTo($newItem);
            }
            
            $mrofList.append($newItem);
        });
        
        function _hideListOnCtrlUp(event) {
            if (event.keyCode === 17) {
                $mrofContainer.remove();
                EditorManager.getActiveEditor().focus();
            }
        }
        
        $(window).off('keyup', _hideListOnCtrlUp);
        $(window).on('keyup', _hideListOnCtrlUp);
        
        $("#mrof-container > #mrof-list > li > a").on("focus", _onFocus);
        $("#mrof-container > #mrof-list > li > a").on("click", _onClick);
        $("#mrof-container > #mrof-list > li > a").on("select", _onClick);
        
        $("#mrof-container > #mrof-list > li > a").first().trigger("focus");    
    }
    
    function _addToMROFList(current) {
        
        var filePath = current.document.file.fullPath;
        
        var index = _.findIndex(_mrofList, function (record) {
            return (record.file === filePath && record.paneId === current._paneId);
        });

        var entry = _makeMROFListEntry(filePath, current._paneId, current.getCursorPos(true, "first"));

        if (index !== -1) {
            _mrofList.splice(index, 1);
        }

        // add it to the front of the list
        _mrofList.unshift(entry);        
    }
    
    EditorManager.on("activeEditorChange", function (event, current, previous) {
        if (!_inTransientState && previous) {
            _addHistoryFrame(previous, null);
            _addToMROFList(previous);
        }
        
        if (!_inTransientState && current) {
            _addHistoryFrame(current, null);
        }
        
        if (previous) {
            previous.off("cursorPositionChange", _recordCursorPosChange);
        }
        
        if (current) {
            _addToMROFList(current);
            _currentEditor = current;
            _activePaneId = MainViewManager.getActivePaneId();
            current.on("cursorPositionChange", _recordCursorPosChange);
        }
    });
    
    ProjectManager.on("beforeProjectClose", function () {
        PreferencesManager.setViewState("openFiles", _mrofList, _getPrefsContext(), true);
        _currentFrame = null;
        _inTransientState = false;
        _synchCommands();
        _mrofList = [];
    });
    
    ProjectManager.on("projectOpen", function () {
        _mrofList = PreferencesManager.getViewState("openFiles", _getPrefsContext()) || [];
    });
    
    AppInit.appReady(function () {
        CommandManager.register("Next Context", "Commands.NAVIGATE_NEXT_DOC", _navigateNext);
        CommandManager.register("Previous Context", "Commands.NAVIGATE_PREV_DOC", _navigatePrev);
        var menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);
        menu.addMenuItem("Commands.NAVIGATE_NEXT_DOC", "", Menus.BEFORE, Commands.NAVIGATE_NEXT_DOC);
        menu.addMenuItem("Commands.NAVIGATE_PREV_DOC", "", Menus.BEFORE, Commands.NAVIGATE_NEXT_DOC);

        KeyBindingManager.addBinding("Commands.NAVIGATE_NEXT_DOC", [{key: "Alt-N",   platform: "win"},
                                                                        {key: "Alt-N",  platform:  "mac"}]);
        KeyBindingManager.addBinding("Commands.NAVIGATE_PREV_DOC", [{key: "Alt-P",   platform: "win"},
                                                                        {key: "Alt-P",  platform:  "mac"}]);
        _prevCmd = CommandManager.get("Commands.NAVIGATE_PREV_DOC");
        _nextCmd = CommandManager.get("Commands.NAVIGATE_NEXT_DOC");
        _prevCmd.setEnabled(false);
        _nextCmd.setEnabled(false);
        
        CommandManager.register("Next Context", "Commands.SHOW_HISTORY", _createMROFDisplayList);
        KeyBindingManager.addBinding("Commands.SHOW_HISTORY", [{key: "Ctrl-R",   platform: "win"},
                                                                        {key: "Alt-N",  platform:  "mac"}]);
    });
});