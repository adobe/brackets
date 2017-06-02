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

define(function (require, exports, module) {
    "use strict";

    var Strings                 = brackets.getModule("strings"),
        MainViewManager         = brackets.getModule("view/MainViewManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        DocumentCommandHandlers = brackets.getModule("document/DocumentCommandHandlers"),
        EditorManager           = brackets.getModule("editor/EditorManager"),
        Editor                  = brackets.getModule("editor/Editor"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Commands                = brackets.getModule("command/Commands"),
        Menus                   = brackets.getModule("command/Menus"),
        KeyBindingManager       = brackets.getModule("command/KeyBindingManager");

    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));
    
    // Command constants for navigation history
    var NAVIGATION_JUMP_BACK      = "navigation.jump.back",
        NAVIGATION_JUMP_FWD       = "navigation.jump.fwd";
        
    var NAV_FRAME_CAPTURE_LATENCY = 3000;
        
    
    /*
    * Contains list of most recently opened files and their last known cursor position
    * @private
    * @type {Array.<Object>}
    */
    var jumpToPosStack = [],
        jumpedPosStack = [],
        captureTimer,
        activePosNotSynched = false,
        jumpInProgress,
        command_JumpBack,
        command_JumpFwd,
        cmMarkers = {};
        
    
    function NavigationFrame(editor, selectionObj) {
        this.cm = editor._codeMirror;
        this.file = editor.document.file._path;
        this.paneId = editor._paneId;
        this.uId = (new Date()).getTime() + "";
        this.selections = [];
        this.bookMarkIds = [];
        this._createMarkers(selectionObj.ranges);
        this._bindEditor(editor);
    }
    
    NavigationFrame.prototype._bindEditor = function (editor) {
        var self = this;
        editor.on("beforeDestroy", function () {
            self._backupSelectionRanges();
            self.cm = null;
            self.bookMarkIds = null;
        });
    }
    
    NavigationFrame.prototype._createMarkers = function (ranges) {
        var range, index, bookMark;
        this.bookMarkIds = [];
        for (index in ranges) {
            range = ranges[index];
            if (range.anchor.line === range.head.line && range.anchor.ch === range.head.ch) {
                bookMark = this.cm.setBookmark(range.anchor, range.head);
                this.bookMarkIds.push(bookMark.id);
            } else {
                this.cm.markText(range.anchor, range.head, {className: (this.uId + "")});
            }
        }
    };
    
    NavigationFrame.prototype._backupSelectionRanges = function () {
        if (!this.cm) {
            return;
        }
        
        this.selections = [];
        var marker, selection, index;
        var self = this;
        var markers = this.cm.getAllMarks().filter(function (entry) {
            if (entry.className === self.uId || self.bookMarkIds.indexOf(entry.id) !== -1) {
                return entry;
            }
        })
        for (index in markers) {
            marker = markers[index];
            selection = marker.find();
            if (marker.type === "bookmark") {
                this.selections.push({start: selection, end: selection});
            } else {
                this.selections.push({start: selection.from, end: selection.to});
            }
        }
    };

    NavigationFrame.prototype.goTo = function () {
        var self = this;
        this._backupSelectionRanges();
        jumpInProgress = true;
        CommandManager.execute(Commands.FILE_OPEN, {fullPath: this.file, paneId: this.paneId}).done(function () {
            EditorManager.getCurrentFullEditor().setSelections(self.selections, true);
            command_JumpFwd.setEnabled(true);
        }).always(function () {
            jumpInProgress = false;
        });
    };
    
    function _recordJumpDef(event, selectionObj) {
        if (jumpInProgress) {
            return;
        }
        jumpedPosStack = [];
        if (selectionObj.origin !== "+move" && (window.event && window.event.type !== "input")) {
            if (captureTimer) {
                window.clearTimeout(captureTimer);
                captureTimer = null;
            }
            captureTimer = window.setTimeout(function () {
                jumpToPosStack.push(new NavigationFrame(event.target, selectionObj));
                command_JumpFwd.setEnabled(false);
                if (jumpToPosStack.length > 1) {
                    command_JumpBack.setEnabled(true);
                }
                activePosNotSynched = false;
            }, NAV_FRAME_CAPTURE_LATENCY);
        } else {
            activePosNotSynched = true;
        }
    }
    
    function _jumpToPosBack() {
        if (!jumpedPosStack.length) {
            if (activePosNotSynched) {
                jumpToPosStack.push(new NavigationFrame(EditorManager.getCurrentFullEditor(), {ranges: EditorManager.getCurrentFullEditor()._codeMirror.listSelections()}));
            } else {
                jumpedPosStack.push(jumpToPosStack.pop());
            }
        }
        var navFrame = jumpToPosStack.pop();
        if (navFrame) {
            jumpedPosStack.push(navFrame);
            navFrame.goTo();
        }
    }
    
    function _jumpToPosFwd() {
        var navFrame = jumpedPosStack.pop();
        if (navFrame) {
            jumpToPosStack.push(navFrame);
            navFrame.goTo();
        }
    }
    
    /**
     * Handle Active Editor change to update navigation information
     * @private
     */
    function _handleActiveEditorChange(event, current, previous) {
        if (current && current._paneId) { // Handle only full editors
            current.on("beforeSelectionChange", _recordJumpDef);
        }

        if (previous && previous._paneId) { 
            previous.off("beforeSelectionChange", _recordJumpDef);
        }
    }
    
    function _handleProjectOpen() {
        jumpToPosStack = [];
        jumpedPosStack = [];
    }

    function init() {
        CommandManager.register(Strings.CMD_NAVIGATE_BACKWARD, NAVIGATION_JUMP_BACK, _jumpToPosBack);
        CommandManager.register(Strings.CMD_NAVIGATE_FORWARD, NAVIGATION_JUMP_FWD, _jumpToPosFwd);
        command_JumpBack = CommandManager.get(NAVIGATION_JUMP_BACK);
        command_JumpFwd = CommandManager.get(NAVIGATION_JUMP_FWD);
        command_JumpBack.setEnabled(false);
        command_JumpFwd.setEnabled(false);
        KeyBindingManager.addBinding(NAVIGATION_JUMP_BACK, KeyboardPrefs[NAVIGATION_JUMP_BACK]);
        KeyBindingManager.addBinding(NAVIGATION_JUMP_FWD, KeyboardPrefs[NAVIGATION_JUMP_FWD]);
        var menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);
        menu.addMenuItem(NAVIGATION_JUMP_BACK, "", Menus.AFTER, Commands.NAVIGATE_PREV_DOC);
        menu.addMenuItem(NAVIGATION_JUMP_FWD, "", Menus.AFTER, NAVIGATION_JUMP_BACK);
        EditorManager.on("activeEditorChange", _handleActiveEditorChange);
        ProjectManager.on("projectOpen", _handleProjectOpen);
    }
    
    exports.init = init;
});
