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
/*global define, $, document, window  */

define(function (require, exports, module) {
    'use strict';
    
    var ProjectManager          = require("project/ProjectManager"),
        WorkingSetView          = require("project/WorkingSetView"),
        CommandManager          = require("command/CommandManager"),
        Commands                = require("command/Commands"),
        PreferencesManager      = require("preferences/PreferencesManager"),
        EditorManager           = require("editor/EditorManager");

    var $sidebar                = $("#sidebar"),
        $sidebarMenuText        = $("#menu-view-hide-sidebar span"),
        $sidebarResizer         = $("#sidebar-resizer"),
        $openFilesContainer     = $("#open-files-container"),
        $projectTitle           = $("#project-title"),
        $projectFilesContainer  = $("#project-files-container"),
        isSidebarClosed         = false;
    
    var PREFERENCES_CLIENT_ID = "com.adobe.brackets.SidebarView",
        defaultPrefs = { sidebarWidth: 200, sidebarClosed: false };
    
    
    /**
     * @private
     * Update project title when the project root changes
     */
    function _updateProjectTitle() {
        $projectTitle.html(ProjectManager.getProjectRoot().name);
        $projectTitle.attr("title", ProjectManager.getProjectRoot().fullPath);
    }
    
    /**
     * @private
     * Sets sidebar width and resizes editor. Does not change internal sidebar open/closed state.
     * @param {number} width Optional width in pixels. If null or undefined, the default width is used.
     * @param {!boolean} updateMenu Updates "View" menu label to indicate current sidebar state.
     * @param {!boolean} displayTriangle Display selection marker triangle in the active view.
     */
    function _setWidth(width, updateMenu, displayTriangle) {
        // if we specify a width with the handler call, use that. Otherwise use
        // the greater of the current width or 200 (200 is the minimum width we'd snap back to)
        
        var prefs                   = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs),
            sidebarWidth            = Math.max(prefs.getValue("sidebarWidth"), 10);
        
        width = width || Math.max($sidebar.width(), sidebarWidth);
        
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
            
            if (width > 10) {
                prefs.setValue("sidebarWidth", width);
            }
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
        
        var prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs);
        prefs.setValue("sidebarClosed", isSidebarClosed);
        
        _setWidth(width, true, !isSidebarClosed);
    }
    
    /**
     * @private
     * Install sidebar resize handling.
     */
    function _initSidebarResizer() {
        var $mainView               = $(".main-view"),
            $body                   = $(document.body),
            prefs                   = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs),
            sidebarWidth            = prefs.getValue("sidebarWidth"),
            startingSidebarPosition = sidebarWidth,
            animationRequest        = null,
            isMouseDown             = false;
        
        $sidebarResizer.css("left", sidebarWidth - 1);
        
        if (prefs.getValue("sidebarClosed")) {
            toggleSidebar(sidebarWidth);
        } else {
            _setWidth(sidebarWidth, true, true);
        }
        
        $sidebarResizer.on("dblclick", function () {
            if ($sidebar.width() === 1) {
                // mousedown is fired first. Sidebar is already toggeled open to 1px.
                _setWidth(null, true, true);
            } else {
                toggleSidebar();
            }
        });
        $sidebarResizer.on("mousedown.sidebar", function (e) {
            var startX = e.clientX,
                newWidth = Math.max(startX, 0),
                doResize = true;
            
            isMouseDown = true;
            
            // take away the shadows (for performance reasons during sidebarmovement)
            $sidebar.find(".scroller-shadow").css("display", "none");
            
            $body.toggleClass("resizing");
            // check to see if we're currently in hidden mode
            if (isSidebarClosed) {
                toggleSidebar(1);
            }
            
            animationRequest = window.webkitRequestAnimationFrame(function doRedraw() {
                console.log('rAF');
                // only run this if the mouse is down so we don't constantly loop even 
                // after we're done resizing.
                if (isMouseDown) {
                    // if we've gone below 10 pixels on a mouse move, and the
                    // sidebar is shrinking, hide the sidebar automatically an
                    // unbind the mouse event. 
                    if ((startX > 10) && (newWidth < 10)) {
                        console.log('beginning startX: ' + startX);
                        toggleSidebar(startingSidebarPosition);
                        $mainView.off("mousemove.sidebar");
                        $body.toggleClass("resizing");
                        doResize = false;
                        startX = 0;
                        console.log('ending startX: ' + startX);
                        window.webkitCancelRequestAnimationFrame(this);
                        return;
                        
                    } else if (startX < 10) {
                        // reset startX if we're going from a snapped closed position to open
                        startX = startingSidebarPosition;
                    }
                
                    if (doResize) {
                        // if we've moving past 10 pixels, make the triangle visible again
                        // and register that the sidebar is no longer snapped closed. 
                        var forceTriangle = null;
                    
                        if (newWidth > 10) {
                            forceTriangle = true;
                        }
                        // for right now, displayTriangle is always going to be false for _setWidth
                        // because we want to hide it when we move, and _setWidth only gets called
                        // on mousemove now.
                        _setWidth(newWidth, false, false);
                    }
                
                    if (newWidth === 0) {
                        $mainView.off("mousemove.sidebar");
                        $("body").toggleClass("resizing");
                    }
                    animationRequest = window.webkitRequestAnimationFrame(doRedraw);
                }
            });
            
            $mainView.on("mousemove.sidebar", function (e) {
                newWidth = Math.max(e.clientX, 0);
                    
                e.preventDefault();
            });
                
            $mainView.one("mouseup.sidebar", function (e) {
                isMouseDown = false;
                
                // replace shadows and triangle
                $sidebar.find(".triangle-visible").css("display", "block");
                $sidebar.find(".scroller-shadow").css("display", "block");
                
                $projectFilesContainer.triggerHandler("scroll");
                $openFilesContainer.triggerHandler("scroll");
                $mainView.off("mousemove.sidebar");
                $body.toggleClass("resizing");
                startingSidebarPosition = $sidebar.width();
            });
            
            e.preventDefault();
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