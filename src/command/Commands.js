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
/*global define */

define(function (require, exports, module) {
    "use strict";
    
    /**
     * List of constants for global command IDs.
     */

    // FILE
    exports.FILE_NEW                    = "file.new";
    exports.FILE_NEW_FOLDER             = "file.newFolder";
    exports.FILE_OPEN                   = "file.open";
    exports.FILE_OPEN_FOLDER            = "file.openFolder";
    exports.FILE_SAVE                   = "file.save";
    exports.FILE_SAVE_ALL               = "file.saveAll";
    exports.FILE_CLOSE                  = "file.close";
    exports.FILE_CLOSE_ALL              = "file.close_all";
    exports.FILE_CLOSE_WINDOW           = "file.close_window"; // string must MATCH string in native code (brackets_extensions)
    exports.FILE_ADD_TO_WORKING_SET     = "file.addToWorkingSet";
    exports.FILE_LIVE_FILE_PREVIEW      = "file.liveFilePreview";
    exports.FILE_LIVE_HIGHLIGHT         = "file.previewHighlight";
    exports.FILE_PROJECT_SETTINGS       = "file.projectSettings";
    exports.FILE_RENAME                 = "file.rename";
    exports.FILE_QUIT                   = "file.quit"; // string must MATCH string in native code (brackets_extensions)

    // EDIT
    exports.EDIT_UNDO                   = "edit.undo";
    exports.EDIT_REDO                   = "edit.redo";
    exports.EDIT_CUT                    = "edit.cut";
    exports.EDIT_COPY                   = "edit.copy";
    exports.EDIT_PASTE                  = "edit.paste";
    exports.EDIT_SELECT_ALL             = "edit.selectAll";
    exports.EDIT_SELECT_LINE            = "edit.selectLine";
    exports.EDIT_FIND                   = "edit.find";
    exports.EDIT_FIND_IN_FILES          = "edit.findInFiles";
    exports.EDIT_FIND_IN_SUBTREE        = "edit.findInSubtree";
    exports.EDIT_FIND_NEXT              = "edit.findNext";
    exports.EDIT_FIND_PREVIOUS          = "edit.findPrevious";
    exports.EDIT_REPLACE                = "edit.replace";
    exports.EDIT_INDENT                 = "edit.indent";
    exports.EDIT_UNINDENT               = "edit.unindent";
    exports.EDIT_DUPLICATE              = "edit.duplicate";
    exports.EDIT_DELETE_LINES           = "edit.deletelines";
    exports.EDIT_LINE_COMMENT           = "edit.lineComment";
    exports.EDIT_BLOCK_COMMENT          = "edit.blockComment";
    exports.EDIT_LINE_UP                = "edit.lineUp";
    exports.EDIT_LINE_DOWN              = "edit.lineDown";

    // VIEW
    exports.VIEW_HIDE_SIDEBAR           = "view.hideSidebar";
    exports.VIEW_INCREASE_FONT_SIZE     = "view.increaseFontSize";
    exports.VIEW_DECREASE_FONT_SIZE     = "view.decreaseFontSize";
    exports.VIEW_RESTORE_FONT_SIZE      = "view.restoreFontSize";
    exports.TOGGLE_JSLINT               = "debug.jslint";
    exports.SORT_WORKINGSET_BY_ADDED    = "view.sortWorkingSetByAdded";
    exports.SORT_WORKINGSET_BY_NAME     = "view.sortWorkingSetByName";
    exports.SORT_WORKINGSET_BY_TYPE     = "view.sortWorkingSetByType";
    exports.SORT_WORKINGSET_AUTO        = "view.sortWorkingSetAuto";
    
    // Navigate
    exports.NAVIGATE_NEXT_DOC           = "navigate.nextDoc";
    exports.NAVIGATE_PREV_DOC           = "navigate.prevDoc";
    exports.NAVIGATE_SHOW_IN_FILE_TREE  = "navigate.showInFileTree";
    exports.NAVIGATE_QUICK_OPEN         = "navigate.quickOpen";
    exports.NAVIGATE_GOTO_DEFINITION    = "navigate.gotoDefinition";
    exports.NAVIGATE_GOTO_LINE          = "navigate.gotoLine";
    exports.TOGGLE_QUICK_EDIT           = "navigate.toggleQuickEdit";
    exports.QUICK_EDIT_NEXT_MATCH       = "navigate.nextMatch";
    exports.QUICK_EDIT_PREV_MATCH       = "navigate.previousMatch";

    // Debug
    exports.DEBUG_REFRESH_WINDOW        = "debug.refreshWindow"; // string must MATCH string in native code (brackets_extensions)
    exports.DEBUG_SHOW_DEVELOPER_TOOLS  = "debug.showDeveloperTools";
    exports.DEBUG_RUN_UNIT_TESTS        = "debug.runUnitTests";
    exports.DEBUG_SHOW_PERF_DATA        = "debug.showPerfData";
    exports.DEBUG_NEW_BRACKETS_WINDOW   = "debug.newBracketsWindow";
    exports.DEBUG_SWITCH_LANGUAGE       = "debug.switchLanguage";

    // Help
    exports.HELP_SHOW_EXT_FOLDER        = "help.showExtensionsFolder";
    exports.HELP_CHECK_FOR_UPDATE       = "help.checkForUpdate";
    exports.HELP_FORUM                  = "help.forum";
    exports.HELP_ABOUT                  = "help.about";

    // File shell callbacks
    exports.APP_ABORT_QUIT              = "app.abort_quit"; // string must MATCH string in native code (appshell_extensions)
});

