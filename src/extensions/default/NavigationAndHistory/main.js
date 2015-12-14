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

    var AppInit             = brackets.getModule("utils/AppInit"),
        MainViewManager     = brackets.getModule("view/MainViewManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Commands            = brackets.getModule("command/Commands"),
        Menus               = brackets.getModule("command/Menus"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager");
    
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
    
    /*function _checkIfInitialFrame(frame, newFrame) {
        return frame.path === newFrame.path && frame.paneId === newFrame.paneId && frame.cursorPos.line === 0 && frame.cursorPos.ch === 0;
    }*/
    
    /*function _purgeInitialFrame(newFrame) {
        var _indexForInitialFrame = -1;
        $.each(_navigationHistory, function (index, frame) {
            if (_checkIfInitialFrame(frame, newFrame)) {
                _indexForInitialFrame = index;
                return false;
            } else {
                return true;
            }
        });
        
        if (_indexForInitialFrame !== -1) {
            _navigationHistory.splice(_indexForInitialFrame, 1);
        }
    }*/
    
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
    
    EditorManager.on("activeEditorChange", function (event, current, previous) {
        if (!_inTransientState && previous) {
            _addHistoryFrame(previous, null);
        }
        
        if (!_inTransientState && current) {
            _addHistoryFrame(current, null);
        }
        
        if (previous) {
            previous.off("cursorPositionChange", _recordCursorPosChange);
        }
        
        if (current) {
            _currentEditor = current;
            _activePaneId = MainViewManager.getActivePaneId();
            current.on("cursorPositionChange", _recordCursorPosChange);
        }
    });
    
    ProjectManager.on("projectClose", function () {
        _currentFrame = null;
        _inTransientState = false;
        _synchCommands();
    });
    
    
    AppInit.appReady(function () {
        CommandManager.register("Next Context", "Commands.NAVIGATE_NEXT_DOC", _navigateNext);
        CommandManager.register("Previous Context", "Commands.NAVIGATE_PREV_DOC", _navigatePrev);
        var menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);
        menu.addMenuItem("Commands.NAVIGATE_NEXT_DOC", "", Menus.BEFORE, Commands.NAVIGATE_NEXT_DOC);
        menu.addMenuItem("Commands.NAVIGATE_PREV_DOC", "", Menus.BEFORE, Commands.NAVIGATE_NEXT_DOC);

        KeyBindingManager.addBinding("Commands.NAVIGATE_NEXT_DOC", [{key: "Alt-N",   platform: "win"},
                                                                        {key: "Ctrl-Tab",  platform:  "mac"}]);
        KeyBindingManager.addBinding("Commands.NAVIGATE_PREV_DOC", [{key: "Alt-P",   platform: "win"},
                                                                        {key: "Ctrl-Shift-Tab",  platform:  "mac"}]);
        _prevCmd = CommandManager.get("Commands.NAVIGATE_PREV_DOC");
        _nextCmd = CommandManager.get("Commands.NAVIGATE_NEXT_DOC");
        _prevCmd.setEnabled(false);
        _nextCmd.setEnabled(false);
    });
});