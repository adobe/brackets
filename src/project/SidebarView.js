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
        PreferencesManager  = require("preferences/PreferencesManager"),
        EditorManager       = require("editor/EditorManager"),
        Global              = require("utils/Global"),
        Resizer             = require("utils/Resizer");

    var isSidebarClosed         = false;

    var PREFERENCES_CLIENT_ID = "com.adobe.brackets.SidebarView",
        defaultPrefs = { sidebarWidth: 200, sidebarClosed: false };

    // These vars are initialized by the htmlReady handler
    // below since they refer to DOM elements
    var $sidebar,
        $sidebarMenuText,
        $sidebarResizer,
        $openFilesContainer,
        $projectTitle,
        $projectFilesContainer;
    
    /**
     * @private
     * Update project title when the project root changes
     */
    function _updateProjectTitle() {
        $projectTitle.html(ProjectManager.getProjectRoot().name);
        $projectTitle.attr("title", ProjectManager.getProjectRoot().fullPath);
    }
    
    /**
     * Toggle sidebar visibility.
     */
    function toggleSidebar(width) {
        Resizer.toggleVisibility($sidebar);
    }
    
    /**
     * @private
     * Install sidebar resize handling.
     */
    function _initSidebarResizer() {
        var prefs                   = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs),
            sidebarWidth            = prefs.getValue("sidebarWidth");
        
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
            
            prefs.setValue("sidebarWidth", width);
        });
        
        $sidebar.on("panelCollapsed", function () {
            prefs.setValue("sidebarClosed", true);
            CommandManager.get(Commands.VIEW_HIDE_SIDEBAR).setName(Strings.CMD_SHOW_SIDEBAR);
        });
        
        $sidebar.on("panelExpanded", function () {
            prefs.setValue("sidebarClosed", false);
            CommandManager.get(Commands.VIEW_HIDE_SIDEBAR).setName(Strings.CMD_HIDE_SIDEBAR);
        });
        
        // Set initial state
        $sidebar.width(sidebarWidth);
        if (prefs.getValue("sidebarClosed")) {
            Resizer.toggleVisibility($sidebar);
        } else {
            $sidebar.trigger("resize");
        }
    }

    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        var prefs           = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs),
            sidebarWidth    = prefs.getValue("sidebarWidth");
            
        $sidebar                = $("#sidebar");
        $sidebarMenuText        = $("#menu-view-hide-sidebar span");
        $sidebarResizer         = $("#sidebar-resizer");
        $openFilesContainer     = $("#open-files-container");
        $projectTitle           = $("#project-title");
        $projectFilesContainer  = $("#project-files-container");

        // init
        WorkingSetView.create($openFilesContainer);
        _initSidebarResizer();
        
    });
    
    $(ProjectManager).on("projectOpen", _updateProjectTitle);
    CommandManager.register(Strings.CMD_HIDE_SIDEBAR, Commands.VIEW_HIDE_SIDEBAR, toggleSidebar);
    
    // Define public API
    exports.toggleSidebar = toggleSidebar;
});