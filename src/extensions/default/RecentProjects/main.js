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

define(function (require, exports, module) {
    "use strict";
    
    var PREFERENCES_KEY = "com.adobe.brackets.brackets-recent-projects";
    
    // Brackets modules
    var ProjectManager          = brackets.getModule("project/ProjectManager"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        Strings                 = brackets.getModule("strings"),
        SidebarView             = brackets.getModule("project/SidebarView"),
        Menus                   = brackets.getModule("command/Menus"),
        PopUpManager            = brackets.getModule("widgets/PopUpManager"),
        FileUtils               = brackets.getModule("file/FileUtils");
    
    var $dropdownToggle;
    var MAX_PROJECTS = 20;

    /**
     * Get the stored list of recent projects, canonicalizing and updating paths as appropriate.
     */
    function getRecentProjects() {
        var prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_KEY),
            recentProjects = prefs.getValue("recentProjects") || [],
            i;
        for (i = 0; i < recentProjects.length; i++) {
            recentProjects[i] = FileUtils.canonicalizeFolderPath(ProjectManager.updateWelcomeProjectPath(recentProjects[i]));
        }
        return recentProjects;
    }
    
    /**
     * Add a project to the stored list of recent projects, up to MAX_PROJECTS.
     */
    function add() {
        var root = FileUtils.canonicalizeFolderPath(ProjectManager.getProjectRoot().fullPath),
            prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_KEY),
            recentProjects = getRecentProjects(),
            index = recentProjects.indexOf(root);
        if (index !== -1) {
            recentProjects.splice(index, 1);
        }
        recentProjects.unshift(root);
        if (recentProjects.length > MAX_PROJECTS) {
            recentProjects = recentProjects.slice(0, MAX_PROJECTS);
        }
        prefs.setValue("recentProjects", recentProjects);
    }
    
    /**
     * Create the DOM node for a single recent folder path in the dropdown menu.
     * @param {string} path The full path to the folder.
     */
    function renderPath(path) {
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
            restSpan = $("<span></span>").addClass("recent-folder-path").text(" - " + rest);
        return $("<a></a>").addClass("recent-folder-link").append(folderSpan).append(restSpan);
    }
    
    /**
     * Show or hide the recent projects dropdown.
     * @param {object} e The event object that triggered the toggling.
     */
    function toggle(e) {
        // If the dropdown is already visible, just return (so the root click handler on html
        // will close it).
        if ($("#project-dropdown").length) {
            return;
        }
        
        Menus.closeAll();
        
        // TODO: Can't just use Bootstrap 1.4 dropdowns for this since they're hard-coded to
        // assume that the dropdown is inside a top-level menubar created using <li>s.
        // Have to do this stopProp to avoid the html click handler from firing when this returns.
        e.stopPropagation();
        
        var recentProjects = getRecentProjects(),
            $dropdown = $("<ul id='project-dropdown' class='dropdown-menu'></ul>"),
            toggleOffset = $dropdownToggle.offset();

        function closeDropdown() {
            // Since we passed "true" for autoRemove to addPopUp(), this will
            // automatically remove the dropdown from the DOM.
            PopUpManager.removePopUp($dropdown);
        }
        
        function cleanupDropdown() {
            $("html").off("click", closeDropdown);
            $("#project-files-container").off("scroll", closeDropdown);
            $(SidebarView).off("hide", closeDropdown);
            $("#main-toolbar .nav").off("click", closeDropdown);
        }
        
        var currentProject = FileUtils.canonicalizeFolderPath(ProjectManager.getProjectRoot().fullPath),
            hasProject = false;
        recentProjects.forEach(function (root) {
            if (root !== currentProject) {
                var $link = renderPath(root)
                    .click(function () {
                        ProjectManager.openProject(root)
                            .fail(function () {
                                // Remove the project from the list.
                                var index = recentProjects.indexOf(root);
                                if (index !== -1) {
                                    recentProjects.splice(index, 1);
                                }
                            });
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
        $("<li><a id='open-folder-link'>" + Strings.CMD_OPEN_FOLDER + "</a></li>")
            .click(function () {
                CommandManager.execute(Commands.FILE_OPEN_FOLDER);
            })
            .appendTo($dropdown);
        
        $dropdown.css({
            left: toggleOffset.left,
            top: toggleOffset.top + $dropdownToggle.outerHeight()
        })
            .appendTo($("body"));
        PopUpManager.addPopUp($dropdown, cleanupDropdown, true);
        
        // TODO: should use capture, otherwise clicking on the menus doesn't close it. More fallout
        // from the fact that we can't use the Boostrap (1.4) dropdowns.
        $("html").on("click", closeDropdown);
        
        // Hide the menu if the user scrolls in the project tree. Otherwise the Lion scrollbar
        // overlaps it.
        // TODO: This duplicates logic that's already in ProjectManager (which calls Menus.close()).
        // We should fix this when the popup handling is centralized in PopupManager, as well
        // as making Esc close the dropdown. See issue #1381.
        $("#project-files-container").on("scroll", closeDropdown);
        
        // Hide the menu if the sidebar is hidden.
        // TODO: Is there some more general way we could handle this for dropdowns?
        $(SidebarView).on("hide", closeDropdown);
        
        // Hacky: if we detect a click in the menubar, close ourselves.
        // TODO: again, we should have centralized popup management.
        $("#main-toolbar .nav").on("click", closeDropdown);
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
