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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, window, $ */

// TODO: remember working set for each project

define(function (require, exports, module) {
    'use strict';
    
    var PREFERENCES_KEY = "com.adobe.brackets.brackets-recent-projects";
    
    // Brackets modules
    var DocumentManager         = brackets.getModule("document/DocumentManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        strings                 = brackets.getModule("strings");
    
    var $dropdownToggle;
    
    function add() {
        var root = ProjectManager.getProjectRoot().fullPath,
            prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_KEY),
            recentProjects = prefs.getValue("recentProjects") || [],
            index = recentProjects.indexOf(root);
        if (index !== -1) {
            recentProjects.splice(index, 1);
        }
        recentProjects.unshift(root);
        if (recentProjects.length > 20) {
            recentProjects = recentProjects.slice(0, 20);
        }
        prefs.setValue("recentProjects", recentProjects);
    }
    
    function renderPath(path) {
        if (path.length && path[path.length - 1] === "/") {
            path = path.slice(0, path.length - 1);
        }
        
        var lastSlash = path.lastIndexOf("/"), folder, rest;
        if (lastSlash === path.length - 1) {
            lastSlash = path.slice(0, path.length - 1).lastIndexOf("/");
        }
        if (lastSlash >= 0) {
            rest = path.slice(0, lastSlash);
            folder = path.slice(lastSlash + 1);
        } else {
            rest = "";
            folder = path;
        }
        
        var folderSpan = $("<span></span>").addClass("recent-folder").text(folder),
            restSpan = $("<span></span>").addClass("recent-folder-path").text(" in " + rest);
        return $("<a></a>").addClass("recent-folder-link").append(folderSpan).append(restSpan);
    }
    
    function toggle(e) {
        // If the dropdown is already visible, just return (so the root click handler on html
        // will close it).
        if ($("#project-dropdown").length) {
            return;
        }
        
        // TODO: Can't just use Bootstrap 1.4 dropdowns for this since they're hard-coded to <li>s.
        // Have to do this stopProp to avoid the html click handler from firing when this returns.
        e.stopPropagation();
        
        var prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_KEY),
            recentProjects = prefs.getValue("recentProjects") || [],
            $dropdown = $("<ul id='project-dropdown' class='dropdown-menu'></ul>"),
            toggleOffset = $dropdownToggle.offset();
        
        function closeDropdown() {
            $("html").off("click", closeDropdown);
            $("#project-files-container").off("scroll", closeDropdown);
            $dropdown.remove();
        }
        
        var currentProject = ProjectManager.getProjectRoot().fullPath,
            hasProject = false;
        recentProjects.forEach(function (root) {
            if (root !== currentProject) {
                var $link = renderPath(root)
                    .click(function () {
                        ProjectManager.openProject(root);
                        closeDropdown();
                    });
                $("<li></li>")
                    .append($link)
                    .appendTo($dropdown);
                hasProject = true;
            }
        });
        if (hasProject) {
            $("<li class='divider'>").appendTo($dropdown);
        }
        $("<li><a id='open-folder-link'>" + strings.CMD_OPEN_FOLDER + "</a></li>")
            .click(function () {
                CommandManager.execute(Commands.FILE_OPEN_FOLDER);
            })
            .appendTo($dropdown);
        
        $dropdown.css({
            left: toggleOffset.left,
            top: toggleOffset.top + $dropdownToggle.outerHeight()
        })
            .appendTo($("body"));
        
        // TODO: should use capture, otherwise clicking on the menus doesn't close it. More fallout
        // from the fact that we can't use the Boostrap (1.4) dropdowns.
        $("html").on("click", closeDropdown);
        
        // Hide the menu if the user scrolls in the project tree. Otherwise the Lion scrollbar
        // overlaps it.
        $("#project-files-container").on("scroll", closeDropdown);
    }
    
    // Initialize extension
    ExtensionUtils.loadStyleSheet(module, "styles.css");
    
    $(ProjectManager).on("projectOpen", add);
    $(ProjectManager).on("beforeProjectClose", add);

    AppInit.htmlReady(function () {
        $("#project-title")
            .wrap("<div id='project-dropdown-toggle'></div>")
            .after("<span class='dropdown-arrow'></span>");
        $dropdownToggle = $("#project-dropdown-toggle").click(toggle);
    });
});
