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
/*global define, $  */

define(function (require, exports, module) {
    'use strict';
    
    var ProjectManager          = require("project/ProjectManager"),
        WorkingSetView          = require("project/WorkingSetView"),
        CommandManager          = require("command/CommandManager"),
        Commands                = require("command/Commands"),
        EditorManager           = require("editor/EditorManager");

    var $sidebar                = $("#sidebar"),
        $sidebarMenuText        = $("#menu-view-hide-sidebar span"),
        $sidebarResizer         = $("#sidebar-resizer"),
        $openFilesContainer     = $("#open-files-container"),
        $projectTitle           = $("#project-title"),
        $projectFilesContainer  = $("#project-files-container"),
        isSidebarClosed         = false;
    
    /**
     * @private
     * Update project title when the project root changes
     */
    function _updateProjectTitle() {
        $projectTitle.html(ProjectManager.getProjectRoot().name);
    }
    
    /**
     * @private
     * Sets sidebar width and resizes editor. Does not manage 
     * @param {number} width Optional width in pixels. If null or undefined, the default width is used.
     * @param {!boolean} updateMenu Updates "View" menu label to indicate current sidebar state.
     * @param {!boolean} displayTriangle Display selection marker triangle in the active view.
     */
    function _setWidth(width, updateMenu, displayTriangle) {
        // if we specify a width with the handler call, use that. Otherwise use
        // the greater of the current width or 200 (200 is the minimum width we'd snap back to)
        width = width || Math.max($sidebar.width(), 200);
        
        if (typeof displayTriangle === "boolean") {
            var display = (displayTriangle) ? "block" : "none";
            $sidebar.find(".triangle-visible").css("display", display);
        }
        
        if (isSidebarClosed) {
            $sidebarResizer.css("left", 0);
        } else {
            $sidebar.width(width);
            $sidebarResizer.css("left", width - 1);
            
            // the following three lines help resize things when the sidebar shows
            // but ultimately these should go into ProjectManager.js with a "notify" 
            // event that we can just call from anywhere instead of hard-coding it.
            // waiting on a ProjectManager refactor to add that. 
            $sidebar.find(".sidebar-selection").width(width);
            $projectFilesContainer.triggerHandler("scroll");
            $openFilesContainer.triggerHandler("scroll");
        }
        
        if (updateMenu) {
            var text = (isSidebarClosed) ? "Show Sidebar" : "Hide Sidebar";
            $sidebarMenuText.first().text(text);
        }
        
        EditorManager.resizeEditor();
    }
    
    /**
     * Toggle sidebar visibility.
     */
    function toggleSidebar(width) {
        if (isSidebarClosed) {
            $sidebar.show();
        } else {
            $sidebar.hide();
        }
        
        isSidebarClosed = !isSidebarClosed;
        
        _setWidth(width, true, !isSidebarClosed);
    }
    
    /**
     * @private
     * Install sidebar resize handling.
     */
    function _initSidebarResizer() {
        var $mainView               = $(".main-view"),
            sidebarWidth            = $sidebar.width(),
            isSidebarHidden         = false,
            startingSidebarPosition = sidebarWidth,
            sidebarSnappedClosed    = false;
        
        $sidebarResizer.css("left", sidebarWidth - 1);
        $sidebarResizer.on("dblclick", function () {
            if (sidebarSnappedClosed) {
                sidebarSnappedClosed = false;
                _setWidth(null, true, true);
            } else {
                toggleSidebar();
            }
        });
        $sidebarResizer.on("mousedown.sidebar", function (e) {
            // check to see if we're currently in hidden mode
            if (isSidebarClosed) {
                toggleSidebar(1);
                sidebarSnappedClosed = true;
            }
            
            $mainView.on("mousemove.sidebar", function (e) {
                // if we've gone below 10 pixels on a mouse move, and the
                // sidebar has not been snapped close, hide the sidebar 
                // automatically an unbind the mouse event. 
                if (!sidebarSnappedClosed && (e.clientX < 10)) {
                    toggleSidebar(startingSidebarPosition);
                    $mainView.off("mousemove.sidebar");
                } else {
                    sidebarSnappedClosed = false;
                    
                    // if we've moving past 10 pixels, make the triangle visible again
                    // and register that the sidebar is no longer snapped closed. 
                    var forceTriangle = null;
                    
                    if (isSidebarClosed && (e.clientX > 10)) {
                        isSidebarClosed = false;
                        forceTriangle = true;
                    }
                    
                    _setWidth(e.clientX, false, forceTriangle);
                }
                e.preventDefault();
            });
                
            e.preventDefault();
        });
        $sidebarResizer.on("mouseup.sidebar", function (e) {
            $mainView.off("mousemove.sidebar");
            startingSidebarPosition = $sidebar.width();
        });
    }
    
    // init
    (function () {
        WorkingSetView.create($openFilesContainer);
        
        $(ProjectManager).on("projectRootChanged", _updateProjectTitle);
        
        _initSidebarResizer();
    }());
    
    exports.toggleSidebar = toggleSidebar;
});
