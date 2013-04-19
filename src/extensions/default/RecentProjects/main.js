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
/*global define, brackets, window, $, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var ProjectManager          = brackets.getModule("project/ProjectManager"),
        PreferencesDialogs      = brackets.getModule("preferences/PreferencesDialogs"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        Strings                 = brackets.getModule("strings"),
        SidebarView             = brackets.getModule("project/SidebarView"),
        Menus                   = brackets.getModule("command/Menus"),
        PopUpManager            = brackets.getModule("widgets/PopUpManager"),
        FileUtils               = brackets.getModule("file/FileUtils"),
        NativeFileSystem        = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        ProjectsMenuTemplate    = require("text!htmlContent/projects-menu.html");
    
    
    var $dropdownToggle,
        $dropdown;
    
    var prefs = PreferencesManager.getPreferenceStorage(module);
    //TODO: Remove preferences migration code
    PreferencesManager.handleClientIdChange(prefs, "com.adobe.brackets.brackets-recent-projects");
    
    var MAX_PROJECTS = 20;

    /**
     * Get the stored list of recent projects, canonicalizing and updating paths as appropriate.
     */
    function getRecentProjects() {
        var recentProjects = prefs.getValue("recentProjects") || [],
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
     * Check the list of items to see if any of them are hovered, and if so trigger a mouseenter.
     * Normally the mouseenter event handles this, but when a previous item is deleted and the next
     * item moves up to be underneath the mouse, we don't get a mouseenter event for that item.
     */
    function checkHovers(pageX, pageY) {
        $dropdown.children().each(function () {
            var offset = $(this).offset(),
                width  = $(this).outerWidth(),
                height = $(this).outerHeight();
            
            if (pageX >= offset.left && pageX <= offset.left + width &&
                    pageY >= offset.top && pageY <= offset.top + height) {
                $(".recent-folder-link", this).triggerHandler("mouseenter");
            }
        });
    }
    
    /**
     * Create the "delete" button that shows up when you hover over a project.
     */
    function renderDelete() {
        return $("<div id='recent-folder-delete' class='trash-icon'></div>")
            .mouseup(function (e) {
                // Don't let the click bubble upward.
                e.stopPropagation();
                
                // Remove the project from the preferences.
                var recentProjects = getRecentProjects(),
                    index = recentProjects.indexOf($(this).parent().data("path")),
                    newProjects = [],
                    i;
                for (i = 0; i < recentProjects.length; i++) {
                    if (i !== index) {
                        newProjects.push(recentProjects[i]);
                    }
                }
                prefs.setValue("recentProjects", newProjects);
                $(this).closest("li").remove();
                checkHovers(e.pageX, e.pageY);
                
                if (newProjects.length === 1) {
                    $dropdown.find(".divider").remove();
                }
            });
    }
    
    /**
     * Close the dropdown.
     */
    function closeDropdown() {
        // Since we passed "true" for autoRemove to addPopUp(), this will
        // automatically remove the dropdown from the DOM. Also, PopUpManager
        // will call cleanupDropdown().
        if ($dropdown) {
            PopUpManager.removePopUp($dropdown);
        }
    }
    
    /**
     * Remove the various event handlers that close the dropdown. This is called by the
     * PopUpManager when the dropdown is closed.
     */
    function cleanupDropdown() {
        $("html").off("click", closeDropdown);
        $("#project-files-container").off("scroll", closeDropdown);
        $(SidebarView).off("hide", closeDropdown);
        $("#titlebar .nav").off("click", closeDropdown);
        $dropdown = null;
    }
    
    /**
     * Hide the delete button.
     */
    function hideDeleteButton() {
        $("#recent-folder-delete").remove();
    }
    
    /**
     * Show the delete button over a given target.
     */
    function showDeleteButton($target) {
        hideDeleteButton();
        renderDelete()
            .css("top", $target.position().top + 6)
            .appendTo($target);
    }
    
    /**
     * Adds the click and mouse enter/leave events to the dropdown
     */
    function _handleListEvents() {
        $dropdown.click(function (e) {
            var $link = $(e.target).closest("a"),
                id    = $link.attr("id"),
                path  = $link.data("path");
            
            if (path) {
                ProjectManager.openProject(path)
                    .fail(function () {
                        // Remove the project from the list only if it does not exist on disk
                        var recentProjects = getRecentProjects(),
                            index = recentProjects.indexOf(path);
                        if (index !== -1) {
                            NativeFileSystem.requestNativeFileSystem(path,
                                function () {},
                                function () {
                                    recentProjects.splice(index, 1);
                                });
                        }
                    });
                closeDropdown();
            
            } else if (id === "open-folder-link") {
                CommandManager.execute(Commands.FILE_OPEN_FOLDER);
            }
            
        });
        
        $dropdown.find(".recent-folder-link")
            .mouseenter(function () {
                // Note: we can't depend on the event here because this can be triggered
                // manually from checkHovers().
                showDeleteButton($(this));
            })
            .mouseleave(function () {
                hideDeleteButton();
            });
    }
    
    /**
     * Parses the path and returns an object with the full path, the folder name and the path without the folder.
     * @param {string} path The full path to the folder.
     * @return {{path: string, folder: string, rest: string}}
     */
    function parsePath(path) {
        var lastSlash = path.lastIndexOf("/"), folder, rest;
        if (lastSlash === path.length - 1) {
            lastSlash = path.slice(0, path.length - 1).lastIndexOf("/");
        }
        if (lastSlash >= 0) {
            rest = " - " + (lastSlash ? path.slice(0, lastSlash) : "/");
            folder = path.slice(lastSlash + 1);
        } else {
            rest = "/";
            folder = path;
        }
        
        return {path: path, folder: folder, rest: rest};
    }

    /**
     * Create the list of projects in the dropdown menu.
     * @return {string} The html content
     */
    function renderList() {
        var recentProjects = getRecentProjects(),
            currentProject = FileUtils.canonicalizeFolderPath(ProjectManager.getProjectRoot().fullPath),
            projectList    = [];
        
        recentProjects.forEach(function (root) {
            if (root !== currentProject) {
                projectList.push(parsePath(root));
            }
        });
        var templateVars = {projectList: projectList, hasProject: projectList.length};
        
        return Mustache.render(ProjectsMenuTemplate, $.extend(templateVars, Strings));
    }
    
    /**
     * Show or hide the recent projects dropdown.
     * @param {$.Event} e The event object that triggered the toggling.
     */
    function toggle(e) {
        // If the dropdown is already visible, just return (so the root click handler on html
        // will close it).
        if ($dropdown) {
            return;
        }
        
        Menus.closeAll();
        
        // TODO: Can't just use Bootstrap 1.4 dropdowns for this since they're hard-coded to
        // assume that the dropdown is inside a top-level menubar created using <li>s.
        // Have to do this stopProp to avoid the html click handler from firing when this returns.
        e.stopPropagation();
        
        $dropdown = $(renderList());
        
        var toggleOffset = $dropdownToggle.offset();
        $dropdown
            .css({
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
        $("#titlebar .nav").on("click", closeDropdown);
        
        _handleListEvents();
    }
    
    // Initialize extension
    AppInit.appReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/styles.css");
        
        $(ProjectManager).on("projectOpen", add);
        $(ProjectManager).on("beforeProjectClose", add);
    });

    AppInit.htmlReady(function () {
        $("#project-title")
            .wrap("<div id='project-dropdown-toggle'></div>")
            .after("<span class='dropdown-arrow'></span>");
        
        $dropdownToggle = $("#project-dropdown-toggle").click(toggle);
    });
});
