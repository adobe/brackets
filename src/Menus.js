/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var Commands                = require("Commands"),
        CommandManager          = require("CommandManager");
    
    function init() {
        // Implements the File menu items
        $("#menu-file-new").click(function () {
            CommandManager.execute(Commands.FILE_NEW);
        });
        $("#menu-file-open").click(function () {
            CommandManager.execute(Commands.FILE_OPEN);
        });
        $("#menu-file-close").click(function () {
            CommandManager.execute(Commands.FILE_CLOSE);
        });
        $("#menu-file-save").click(function () {
            CommandManager.execute(Commands.FILE_SAVE);
        });
        $("#menu-file-quit").click(function () {
            CommandManager.execute(Commands.FILE_QUIT);
        });

        $("#menu-debug-runtests").click(function () {
            CommandManager.execute(Commands.DEBUG_RUN_UNIT_TESTS);
        });
        
        // Other debug menu items
//            $("#menu-debug-wordwrap").click(function() {
//                editor.setOption("lineWrapping", !(editor.getOption("lineWrapping")));
//            });     
        
        $("#menu-debug-jslint").click(function () {
            CommandManager.execute(Commands.DEBUG_JSLINT);
        });
        
        $("#menu-debug-show-perf").click(function () {
            CommandManager.execute(Commands.DEBUG_SHOW_PERF_DATA);
        });
        
        $("#menu-debug-new-brackets-window").click(function () {
            CommandManager.execute(Commands.DEBUG_NEW_BRACKETS_WINDOW);
        });
    }

    // Define public API
    exports.init = init;
});
