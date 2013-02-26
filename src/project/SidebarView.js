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
/*global define, $, document, window, brackets  */

/**
 * The view that controls the showing and hiding of the sidebar. Dispatches the following events:
 *    hide -- when the sidebar is hidden
 *    show -- when the sidebar is shown
 */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit             = require("utils/AppInit"),
        ProjectManager      = require("project/ProjectManager"),
        WorkingSetView      = require("project/WorkingSetView"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        Strings             = require("strings"),
        EditorManager       = require("editor/EditorManager"),
        Global              = require("utils/Global"),
        Resizer             = require("utils/Resizer");

    // These vars are initialized by the htmlReady handler
    // below since they refer to DOM elements
    var $sidebar,
        $sidebarMenuText,
        $openFilesContainer,
        $projectTitle,
        $projectFilesContainer;
    
    /**
     * @private
     * Update project title when the project root changes
     */
    function _updateProjectTitle() {
        var displayName = ProjectManager.getProjectRoot().name;
        var fullPath = ProjectManager.getProjectRoot().fullPath;
        
        if (displayName === "" && fullPath === "/") {
            displayName = "/";
        }
        
        $projectTitle.html(displayName);
        $projectTitle.attr("title", fullPath);
        
        // Trigger a scroll on the project files container to 
        // reposition the scroller shadows and avoid issue #2255
        $projectFilesContainer.trigger("scroll");
    }
    
    /**
     * Toggle sidebar visibility.
     */
    function toggleSidebar(width) {
        Resizer.toggle($sidebar);
    }

    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        $sidebar                = $("#sidebar");
        $sidebarMenuText        = $("#menu-view-hide-sidebar span");
        $openFilesContainer     = $("#open-files-container");
        $projectTitle           = $("#project-title");
        $projectFilesContainer  = $("#project-files-container");

        // init
        WorkingSetView.create($openFilesContainer);
        
        $sidebar.on("panelResizeStart", function (evt, width) {
            $sidebar.find(".sidebar-selection-triangle").css("display", "none");
            $sidebar.find(".scroller-shadow").css("display", "none");
        });
        
        $sidebar.on("panelResizeUpdate", function (evt, width) {
            $sidebar.find(".sidebar-selection").width(width);
        });
        
        $sidebar.on("panelResizeEnd", function (evt, width) {
            $sidebar.find(".sidebar-selection").width(width);
            $sidebar.find(".sidebar-selection-triangle").css("display", "block").css("left", width);
            $sidebar.find(".scroller-shadow").css("display", "block");
            $projectFilesContainer.triggerHandler("scroll");
            $openFilesContainer.triggerHandler("scroll");
        });
		
        $sidebar.on("panelCollapsed", function (evt, width) {
            CommandManager.get(Commands.VIEW_HIDE_SIDEBAR).setName(Strings.CMD_SHOW_SIDEBAR);
        });
        
        $sidebar.on("panelExpanded", function (evt, width) {
            $sidebar.find(".sidebar-selection").width(width);
            $sidebar.find(".scroller-shadow").css("display", "block");
            $sidebar.find(".sidebar-selection-triangle").css("left", width);
            $projectFilesContainer.triggerHandler("scroll");
            $openFilesContainer.triggerHandler("scroll");
            CommandManager.get(Commands.VIEW_HIDE_SIDEBAR).setName(Strings.CMD_HIDE_SIDEBAR);
        });
        
        // AppInit.htmlReady in utils/Resizer executes before, so it's possible that the sidebar
        // is collapsed before we add the event. Check here initially
        if (!$sidebar.is(":visible")) {
            $sidebar.trigger("panelCollapsed");
        }
    });
    
    $(ProjectManager).on("projectOpen", _updateProjectTitle);
    CommandManager.register(Strings.CMD_HIDE_SIDEBAR,       Commands.VIEW_HIDE_SIDEBAR,     toggleSidebar);
    
    // Define public API
    exports.toggleSidebar = toggleSidebar;
});