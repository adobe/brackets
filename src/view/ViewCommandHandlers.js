/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false*/

define(function (require, exports, module) {
    'use strict';
    
    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager");
    
    /* TODO: Support arbitrary widths with grabber
        When the new theme lands with the CSS, potentially
        adjust how this is done. */
    function _handleHideSidebar() {
        var currentWidth = $(".sidebar").width();
        if (currentWidth > 0) {
            $(".sidebar").width(0);
            $("#menu-view-hide-sidebar span").first().text("Show Sidebar");
        } else {
            $(".sidebar").width(200);
            $("#menu-view-hide-sidebar span").first().text("Hide Sidebar");
        }
        
    }
    
    CommandManager.register(Commands.VIEW_HIDE_SIDEBAR, _handleHideSidebar);
});
