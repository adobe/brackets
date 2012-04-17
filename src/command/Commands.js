/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
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
    exports.FILE_CLOSE_WINDOW   = "file.close_window";
    exports.FILE_ADD_TO_WORKING_SET = "file.addToWorkingSet";
    exports.FILE_LIVE_FILE_PREVIEW = "file.liveFilePreview";
    exports.FILE_QUIT           = "file.quit";

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
    exports.DEBUG_HIDE_SIDEBAR  = "view.hideSidebar";

    // Navigate
    exports.NAVIGATE_QUICK_OPEN = "navigate.quickOpen";

    exports.VIEW_REFRESH_WINDOW = "debug.refreshWindow";
    exports.DEBUG_SHOW_DEVELOPER_TOOLS = "debug.showDeveloperTools";
    exports.DEBUG_RUN_UNIT_TESTS = "debug.runUnitTests";
    exports.DEBUG_JSLINT        = "debug.jslint";
    exports.DEBUG_SHOW_PERF_DATA = "debug.showPerfData";
    exports.DEBUG_NEW_BRACKETS_WINDOW = "debug.newBracketsWindow";

    exports.DEBUG_CLOSE_ALL_LIVE_BROWSERS = "debug.closeAllLiveBrowsers";


});

