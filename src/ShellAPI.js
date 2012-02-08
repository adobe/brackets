/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

 /**
  * This is JavaScript API exposed to the native shell when Brackets is run in a native shell rather than a browser.
  */
define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var CommandManager     = require("CommandManager");

    /**
     * The native function BracketsShellAPI::DispatchBracketsJSCommand calls this function in order to enable
     * calling Brackets commands from the native shell.
     */
    function executeCommand(eventName) {
        var evt = document.createEvent("Event");
        evt.initEvent(eventName, false, true);
        
        CommandManager.execute(eventName, {evt: evt});
        
        //return if default was prevented
        return evt.defaultPrevented;
    }

    exports.executeCommand = executeCommand;
});