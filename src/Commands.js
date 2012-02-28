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
    exports.FILE_OPEN   = "file.open";
    exports.FILE_NEW    = "file.new";
    exports.FILE_SAVE   = "file.save";
    exports.FILE_CLOSE  = "file.close";
    exports.FILE_CLOSE_ALL = "file.close_all";
    exports.FILE_CLOSE_WINDOW = "file.close_window";
    exports.FILE_ADD_TO_WORKING_SET = "file.addToWorkingSet";
    exports.FILE_RELOAD = "file.reload";
    exports.FILE_QUIT = "file.quit";
    exports.DEBUG_RUN_UNIT_TESTS = "debug.runUnitTests";
    exports.DEBUG_JSLINT = "debug.jslint";
    exports.DEBUG_SHOW_PERF_DATA = "debug.showPerfData";
});

