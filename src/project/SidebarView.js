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
        ProjectView             = require("project/ProjectView"),
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
    
    function setWidth(width, updateMenu) {
        // if we specify a width with the handler call, use that. Otherwise use
        // the greater of the current width or 200 (200 is the minimum width we'd snap back to)
        width = width || Math.max($sidebar.width(), 200);
        
        if (isSidebarClosed) {
            $sidebar.width(width);
            $sidebarResizer.css("left", width - 1);
            
            isSidebarClosed = false;
            
            // the following three lines help resize things when the sidebar shows
            // but ultimately these should go into ProjectManager.js with a "notify" 
            // event that we can just call from anywhere instead of hard-coding it.
            // waiting on a ProjectManager refactor to add that. 
            $sidebar.find(".sidebarSelection").width(width);
            $projectFilesContainer.trigger("scroll");
            $openFilesContainer.trigger("scroll");
        } else {
            $sidebarResizer.css("left", 0);
            isSidebarClosed = true;
        }
        
        if (updateMenu) {
            var text;
            
            if (isSidebarClosed) {
                text = "Show Sidebar";
                $sidebar.hide();
            } else {
                text = "Hide Sidebar";
                $sidebar.show();
            }
            
            $sidebarMenuText.first().text(text);
        }
        
        EditorManager.resizeEditor();
    }
    
    /**
     * @private
     * Install sidebar resize handling.
     */
    function _initSidebarResizer() {
        var $mainView               = $(".main-view"),
            sidebarWidth            = $sidebar.width(),
            isSidebarHidden         = false,
            sidebarSnappedClosed    = false,
            startingSidebarPosition = sidebarWidth;
        
        $sidebarResizer.css("left", sidebarWidth - 1);
        $sidebarResizer.on("mousedown.sidebar", function (e) {
            // check to see if we're currently in hidden mode
            if (isSidebarClosed) {
                // when we click, start modifying the sidebar size and then
                // modify the variables to set the sidebar state correctly. 
                setWidth(1, true);

                // this makes sure we don't snap back when we drag from a hidden position
                sidebarSnappedClosed = true;
                
                // this keeps the triangle from jumping around
                $sidebar.find(".triangleVisible").css("display", "none");
            }
            
            $mainView.on("mousemove.sidebar", function (e) {
                // if we've gone below 10 pixels on a mouse move, and the
                // sidebar has not been snapped close, hide the sidebar 
                // automatically an unbind the mouse event. 
                if (e.clientX < 10 && !sidebarSnappedClosed) {
                    setWidth(startingSidebarPosition, true);
                    $mainView.off("mousemove.sidebar");
                } else {
                    // if we've moving past 10 pixels, make the triangle visible again
                    // and register that the sidebar is no longer snapped closed. 
                    if (e.clientX > 10) {
                        sidebarSnappedClosed = false;
                        $sidebar.find(".triangleVisible").css("display", "block");
                    }
                    
                    setWidth(e.clientX, false);
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
        ProjectView.create($projectFilesContainer);
        
        $(ProjectManager).on("projectRootChanged", _updateProjectTitle);
        
        _initSidebarResizer();
    }());
    
    exports.setWidth = setWidth;
});
