/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false*/

define(function (require, exports, module) {
    'use strict';
    
    var Commands                = require("Commands"),
        CommandManager          = require("CommandManager"),
        JSLint                  = require("JSLint");
    
    function _handleEnableJSLint() {
        JSLint.setEnabled(!JSLint.getEnabled());
        JSLint.run();
        $("#jslint-enabled-checkbox").css("display", JSLint.getEnabled() ? "" : "none");
    }
    
    CommandManager.register(Commands.DEBUG_JSLINT, _handleEnableJSLint);
});
