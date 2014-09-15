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
 * The view that controls the showing and hiding of the sidebar.
 * 
 * Although the sidebar view doesn't dispatch any events directly, it is a
 * resizable element (../utils/Resizer.js), which means it can dispatch Resizer
 * events.  For example, if you want to listen for the sidebar showing
 * or hiding itself, set up listeners for the corresponding Resizer events,
 * panelCollapsed and panelExpanded:
 * 
 *      $("#sidebar").on("panelCollapsed", ...);
 *      $("#sidebar").on("panelExpanded", ...);
 */
define(function (require, exports, module) {
    "use strict";
    
    var AppInit             = require("utils/AppInit"),
        ProjectManager      = require("project/ProjectManager"),
        WorkingSetView      = require("project/WorkingSetView"),
        MainViewManager     = require("view/MainViewManager"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        Menus               = require("command/Menus"),
        Strings             = require("strings"),
        EditorManager       = require("editor/EditorManager"),
        Global              = require("utils/Global"),
        Resizer             = require("utils/Resizer"),
        _                   = require("thirdparty/lodash");

    // These vars are initialized by the htmlReady handler
    // below since they refer to DOM elements
    var $sidebar,
        $gearMenu,
        $sidebarMenuText,
        $openFilesContainers,
        $projectTitle,
        $projectFilesContainer,
        $workingSetViewsContainer;
    
    /**
     * Context Menu
     * @private
     * @type {Menu}
     */
    var _workingset_cmenu;
    
    /**
     * Context Menu
     * @private
     * @type {Menu}
     */
    var _workingset_configuration_menu;
    
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
        
        $projectTitle.html(_.escape(displayName));
        $projectTitle.attr("title", fullPath);
        
        // Trigger a scroll on the project files container to 
        // reposition the scroller shadows and avoid issue #2255
        $projectFilesContainer.trigger("scroll");
    }
    
    /**
     * Toggle sidebar visibility.
     */
    function toggle() {
        Resizer.toggle($sidebar);
    }

    /**
     * Show the sidebar.
     */
    function show() {
        Resizer.show($sidebar);
    }
    
    /**
     * Hide the sidebar.
     */
    function hide() {
        Resizer.hide($sidebar);
    }
    
    /**
     * Returns the visibility state of the sidebar.
     * @return {boolean} true if element is visible, false if it is not visible
     */
    function isVisible() {
        return Resizer.isVisible($sidebar);
    }
    
    /**
     * Determines if context menus are registered
     * @private
     * @return {boolean} true if the menus are registered, false if not
     */
    function _areContextMenusRegistered() {
        return _workingset_cmenu && _workingset_configuration_menu;
    }
    
    /**
     * Determines if context menus are registered
     * @private
     * @return {boolean} true if the menus are registered, false if not
     */
    function _registerContextMenus() {
        if (!_areContextMenusRegistered()) {
            _workingset_cmenu = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_CONTEXT_MENU);
            _workingset_configuration_menu = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_CONFIG_MENU);
        }
    }
    
    /**
     * Update context menu handlers
     * @private
     */
    function _updateContextMenuHandlers() {
        $openFilesContainers.off(".sidebarView");
        $openFilesContainers = $sidebar.find(".open-files-container");
        $openFilesContainers.on("contextmenu.sidebarView", function (e) {
            _registerContextMenus();
            _workingset_cmenu.open(e);
        });
    }
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        $sidebar                  = $("#sidebar");
        $gearMenu                 = $sidebar.find(".working-set-option-btn");
        $projectTitle             = $sidebar.find("#project-title");
        $projectFilesContainer    = $sidebar.find("#project-files-container");
        $workingSetViewsContainer = $sidebar.find("#working-set-list-container");
    
        function _resizeSidebarSelection() {
            var $element;
            $sidebar.find(".sidebar-selection").each(function (index, element) {
                $element = $(element);
                $element.width($element.parent()[0].scrollWidth);
            });
        }

        // init
        $sidebar.on("panelResizeStart", function (evt, width) {
            $sidebar.find(".sidebar-selection-triangle").css("display", "none");
            $sidebar.find(".scroller-shadow").css("display", "none");
        });
        
        $sidebar.on("panelResizeUpdate", function (evt, width) {
            $sidebar.find(".sidebar-selection").width(width);
        });
        
        $sidebar.on("panelResizeEnd", function (evt, width) {
            _resizeSidebarSelection();
            $sidebar.find(".sidebar-selection-triangle").css("display", "block").css("left", width);
            $sidebar.find(".scroller-shadow").css("display", "block");
            $projectFilesContainer.triggerHandler("scroll");
            $openFilesContainers.triggerHandler("scroll");
        });
		
        $sidebar.on("panelCollapsed", function (evt, width) {
            CommandManager.get(Commands.VIEW_HIDE_SIDEBAR).setName(Strings.CMD_SHOW_SIDEBAR);
        });
        
        $sidebar.on("panelExpanded", function (evt, width) {
            WorkingSetView.refresh();
            _resizeSidebarSelection();
            $sidebar.find(".scroller-shadow").css("display", "block");
            $sidebar.find(".sidebar-selection-triangle").css("left", width);
            $projectFilesContainer.triggerHandler("scroll");
            $openFilesContainers.triggerHandler("scroll");
            CommandManager.get(Commands.VIEW_HIDE_SIDEBAR).setName(Strings.CMD_HIDE_SIDEBAR);
        });
        
        $gearMenu.on("click", function (e) {
            var buttonOffset,
                buttonHeight;

            e.stopPropagation();
            _registerContextMenus();
            
            if (_workingset_configuration_menu.isOpen()) {
                _workingset_configuration_menu.close();
            } else {
                buttonOffset = $gearMenu.offset();
                buttonHeight = $gearMenu.outerHeight();
                _workingset_configuration_menu.open({
                    pageX: buttonOffset.left,
                    pageY: buttonOffset.top + buttonHeight
                });
            }
        });
        
        // AppInit.htmlReady in utils/Resizer executes before, so it's possible that the sidebar
        // is collapsed before we add the event. Check here initially
        if (!$sidebar.is(":visible")) {
            $sidebar.trigger("panelCollapsed");
        }
        
        // wire up event handlers to monitor when panes are created or destroyed
        $(MainViewManager).on("paneCreate", function (evt, paneId) {
            WorkingSetView.createWorkingSetViewForPane($workingSetViewsContainer, paneId);
            _updateContextMenuHandlers();
        });
        $(MainViewManager).on("paneDestroy", function (evt, paneId) {
            _updateContextMenuHandlers();
        });
        
        // create WorkingSetViews for each pane already created
        _.forEach(MainViewManager.getPaneIdList(), function (paneId) {
            WorkingSetView.createWorkingSetViewForPane($workingSetViewsContainer, paneId);
        });
        
        $openFilesContainers = $sidebar.find(".open-files-container");
    });
    
    $(ProjectManager).on("projectOpen", _updateProjectTitle);
    CommandManager.register(Strings.CMD_HIDE_SIDEBAR, Commands.VIEW_HIDE_SIDEBAR, toggle);
    
    
    // Define public API
    exports.toggle      = toggle;
    exports.show        = show;
    exports.hide        = hide;
    exports.isVisible   = isVisible;
});
