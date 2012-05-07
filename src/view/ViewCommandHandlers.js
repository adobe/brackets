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
/*global define, $ */

define(function (require, exports, module) {
    'use strict';
    
    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        ProjectManager          = require("project/ProjectManager");
    
    /* TODO: Support arbitrary widths with grabber
        When the new theme lands with the CSS, potentially
        adjust how this is done. */
    function _handleHideSidebar(sidebarWidth) {
        var $sidebar = $(".sidebar");
        var $sidebarResizer = $("#sidebar-resizer");
        
        // if we specify a width with the handler call, use that. Otherwise use
        // the greater of the current width or 200 (200 is the minimum width we'd snap back to)
        sidebarWidth = sidebarWidth || Math.max(parseInt($sidebar.width(), 10), 200);
        
        if (ProjectManager.getSidebarState() === ProjectManager.SIDEBAR_CLOSED) {
            $sidebar.width(sidebarWidth);
            
            $sidebarResizer.css("left", sidebarWidth - 1);
            
            ProjectManager.setSidebarState(ProjectManager.SIDEBAR_OPEN);
            $sidebar.show();
            
            // the following three lines help resize things when the sidebar shows
            // but ultimately these should go into ProjectManager.js with a "notify" 
            // event that we can just call from anywhere instead of hard-coding it.
            // waiting on a ProjectManager refactor to add that. 
            $(".sidebarSelection").width(sidebarWidth);
            $("#project-files-container").trigger("scroll");
            $("#open-files-container").trigger("scroll");

            // reset the menu text
            $("#menu-view-hide-sidebar span").first().text("Hide Sidebar");
        } else {
            $sidebarResizer.css("left", 0);
            ProjectManager.setSidebarState(ProjectManager.SIDEBAR_CLOSED);
            $sidebar.hide();
            
            // reset the menu text
            $("#menu-view-hide-sidebar span").first().text("Show Sidebar");
        }
        
    }
    
    CommandManager.register(Commands.VIEW_HIDE_SIDEBAR, _handleHideSidebar);
});
