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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

define(function (require, exports, module) {
    'use strict';
    
    /**
     * List of constants for global command IDs.
     */

    // FILE
    exports.FILE_NEW             = "file.new";
    exports.FILE_OPEN           = "file.open";
    exports.FILE_OPEN_FOLDER    = "file.openFolder";
    exports.FILE_SAVE           = "file.save";
    exports.FILE_CLOSE          = "file.close";
    exports.FILE_CLOSE_ALL      = "file.close_all";
    exports.FILE_CLOSE_WINDOW   = "file.close_window"; // string must MATCH string in native code (brackets_extensions)
    exports.FILE_ADD_TO_WORKING_SET = "file.addToWorkingSet";
    exports.FILE_LIVE_FILE_PREVIEW = "file.liveFilePreview";
    exports.FILE_QUIT           = "file.quit"; // string must MATCH string in native code (brackets_extensions)

    // EDIT
    exports.EDIT_UNDO           = "edit.undo";
    exports.EDIT_REDO           = "edit.redo";
    exports.EDIT_CUT            = "edit.cut";
    exports.EDIT_COPY           = "edit.copy";
    exports.EDIT_PASTE          = "edit.paste";
    exports.EDIT_SELECT_ALL     = "edit.selectAll";
    exports.EDIT_FIND           = "edit.find";
    exports.EDIT_FIND_IN_FILES  = "edit.findInFiles";
    exports.EDIT_FIND_NEXT      = "edit.findNext";
    exports.EDIT_FIND_PREVIOUS  = "edit.findPrevious";
    exports.EDIT_REPLACE        = "edit.replace";
    exports.EDIT_INDENT         = "edit.indent";
    exports.EDIT_UNINDENT       = "edit.unindent";

    // VIEW
    exports.VIEW_HIDE_SIDEBAR  = "view.hideSidebar";
    
    // Navigate
    exports.NAVIGATE_QUICK_OPEN = "navigate.quickOpen";
    exports.SHOW_INLINE_EDITOR  = "navigate.showInlineEditor";
    exports.NEXT_CSS_RULE       = "navigate.nextCssRule";
    exports.PREVIOUS_CSS_RULE   = "navigate.previousCssRule";

    exports.DEBUG_REFRESH_WINDOW = "debug.refreshWindow"; // string must MATCH string in native code (brackets_extensions)
    exports.DEBUG_SHOW_DEVELOPER_TOOLS = "debug.showDeveloperTools";
    exports.DEBUG_RUN_UNIT_TESTS = "debug.runUnitTests";
    exports.DEBUG_JSLINT        = "debug.jslint";
    exports.DEBUG_SHOW_PERF_DATA = "debug.showPerfData";
    exports.DEBUG_NEW_BRACKETS_WINDOW = "debug.newBracketsWindow";
    exports.DEBUG_CLOSE_ALL_LIVE_BROWSERS = "debug.closeAllLiveBrowsers";
    exports.DEBUG_USE_TAB_CHARS = "debug.useTabChars";

    exports.HELP_ABOUT = "help.about";
});

