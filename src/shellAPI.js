/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

 /**
  * This is JavaScript API exposed to the native shell when Brackets is run in a native shell rather than a browser.
  * This module is conditionally loaded only when the native shell is present an can be accessed via brackets.shellAPI
  */
define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var CommandManager     = require("CommandManager"),
        Commands           = require("Commands");

	/**
     * TODO comments
     */
    function handleRequestCloseWindow() {
        CommandManager.execute(Commands.FILE_CLOSE_WINDOW);
    }

    /**
     * TODO comments
     */
    function handleRequestQuit() {
        CommandManager.execute(Commands.FILE_QUIT);
    }

    exports.handleRequestCloseWindow = handleRequestCloseWindow;
    exports.handleRequestQuit = handleRequestQuit;
});