/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var ProjectManager          = brackets.getModule("project/ProjectManager"),
        SidebarView             = brackets.getModule("project/SidebarView"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        KeyBindingManager       = brackets.getModule("command/KeyBindingManager"),
        Menus                   = brackets.getModule("command/Menus"),
        MainViewManager         = brackets.getModule("view/MainViewManager"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        FileSystem              = brackets.getModule("filesystem/FileSystem"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        KeyEvent                = brackets.getModule("utils/KeyEvent"),
        FileUtils               = brackets.getModule("file/FileUtils"),
        PopUpManager            = brackets.getModule("widgets/PopUpManager"),
        Strings                 = brackets.getModule("strings"),
        Mustache                = brackets.getModule("thirdparty/mustache/mustache"),
        ProjectsMenuTemplate    = require("text!htmlContent/projects-menu.html");

    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));


    /** @const {string} Recent Projects commands ID */
    var TOGGLE_DROPDOWN = "recentProjects.toggle";

    /** @const {number} Maximum number of displayed recent projects */
    var MAX_PROJECTS = 20;

    /** @type {$.Element} jQuery elements used for the dropdown menu */
    var $dropdownItem,
        $dropdown,
        $links;

    /**
     * Get the stored list of recent projects, fixing up paths as appropriate.
     * Warning: unlike most paths in Brackets, these lack a trailing "/"
     */
    function getRecentProjects() {
        var recentProjects = PreferencesManager.getViewState("recentProjects") || [],
            i;

        for (i = 0; i < recentProjects.length; i++) {
            // We have to canonicalize & then de-canonicalize the path here, since our pref format uses no trailing "/"
            recentProjects[i] = FileUtils.stripTrailingSlash(ProjectManager.updateWelcomeProjectPath(recentProjects[i] + "/"));
        }
        return recentProjects;
    }

    /**
     * Add a project to the stored list of recent projects, up to MAX_PROJECTS.
     */
    function add() {
        var root = FileUtils.stripTrailingSlash(ProjectManager.getProjectRoot().fullPath),
            recentProjects = getRecentProjects(),
            index = recentProjects.indexOf(root);

        if (index !== -1) {
            recentProjects.splice(index, 1);
        }
        recentProjects.unshift(root);
        if (recentProjects.length > MAX_PROJECTS) {
            recentProjects = recentProjects.slice(0, MAX_PROJECTS);
        }
        PreferencesManager.setViewState("recentProjects", recentProjects);
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
        return $("<div id='recent-folder-delete' class='trash-icon'>&times;</div>")
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
                PreferencesManager.setViewState("recentProjects", newProjects);
                $(this).closest("li").remove();
                checkHovers(e.pageX, e.pageY);

                if (newProjects.length === 1) {
                    $dropdown.find(".divider").remove();
                }
            });
    }

    /**
     * Hide the delete button.
     */
    function removeDeleteButton() {
        $("#recent-folder-delete").remove();
    }

    /**
     * Show the delete button over a given target.
     */
    function addDeleteButton($target) {
        removeDeleteButton();
        renderDelete()
            .css("top", $target.position().top + 6)
            .appendTo($target);
    }


    /**
     * Selects the next or previous item in the list
     * @param {number} direction  +1 for next, -1 for prev
     */
    function selectNextItem(direction) {
        var $links   = $dropdown.find("a"),
            index    = $dropdownItem ? $links.index($dropdownItem) : (direction > 0 ? -1 : 0),
            $newItem = $links.eq((index + direction) % $links.length);

        if ($dropdownItem) {
            $dropdownItem.removeClass("selected");
        }
        $newItem.addClass("selected");

        $dropdownItem = $newItem;
        removeDeleteButton();
    }

    /**
     * Deletes the selected item and
     * move the focus to next item in list.
     *
     * @return {boolean} TRUE if project is removed
     */
    function removeSelectedItem(e) {
        var recentProjects = getRecentProjects(),
            $cacheItem = $dropdownItem,
            index = recentProjects.indexOf($cacheItem.data("path"));

        // When focus is not on project item
        if (index === -1) {
            return false;
        }

        // remove project
        recentProjects.splice(index, 1);
        PreferencesManager.setViewState("recentProjects", recentProjects);
        checkHovers(e.pageX, e.pageY);

        if (recentProjects.length === 1) {
            $dropdown.find(".divider").remove();
        }
        selectNextItem(+1);
        $cacheItem.closest("li").remove();
        return true;
    }

    /**
     * Handles the Key Down events
     * @param {KeyboardEvent} event
     * @return {boolean} True if the key was handled
     */
    function keydownHook(event) {
        var keyHandled = false;

        switch (event.keyCode) {
        case KeyEvent.DOM_VK_UP:
            selectNextItem(-1);
            keyHandled = true;
            break;
        case KeyEvent.DOM_VK_DOWN:
            selectNextItem(+1);
            keyHandled = true;
            break;
        case KeyEvent.DOM_VK_ENTER:
        case KeyEvent.DOM_VK_RETURN:
            if ($dropdownItem) {
                $dropdownItem.trigger("click");
            }
            keyHandled = true;
            break;
        case KeyEvent.DOM_VK_BACK_SPACE:
        case KeyEvent.DOM_VK_DELETE:
            if ($dropdownItem) {
                removeSelectedItem(event);
                keyHandled = true;
            }
            break;
        }

        if (keyHandled) {
            event.stopImmediatePropagation();
            event.preventDefault();
        }
        return keyHandled;
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
        $("#titlebar .nav").off("click", closeDropdown);
        $dropdown = null;

        MainViewManager.focusActivePane();

        $(window).off("keydown", keydownHook);
    }


    /**
     * Adds the click and mouse enter/leave events to the dropdown
     */
    function _handleListEvents() {
        $dropdown
            .on("click", "a", function () {
                var $link = $(this),
                    id    = $link.attr("id"),
                    path  = $link.data("path");

                if (path) {
                    ProjectManager.openProject(path)
                        .fail(function () {
                            // Remove the project from the list only if it does not exist on disk
                            var recentProjects = getRecentProjects(),
                                index = recentProjects.indexOf(path);
                            if (index !== -1) {
                                FileSystem.resolve(path, function (err, item) {
                                    if (err) {
                                        recentProjects.splice(index, 1);
                                    }
                                });
                            }
                        });
                    closeDropdown();

                } else if (id === "open-folder-link") {
                    CommandManager.execute(Commands.FILE_OPEN_FOLDER);
                }

            })
            .on("mouseenter", "a", function () {
                if ($dropdownItem) {
                    $dropdownItem.removeClass("selected");
                }
                $dropdownItem = $(this).addClass("selected");

                if ($dropdownItem.hasClass("recent-folder-link")) {
                    // Note: we can't depend on the event here because this can be triggered
                    // manually from checkHovers().
                    addDeleteButton($(this));
                }
            })
            .on("mouseleave", "a", function () {
                var $link = $(this).removeClass("selected");

                if ($link.get(0) === $dropdownItem.get(0)) {
                    $dropdownItem = null;
                }
                if ($link.hasClass("recent-folder-link")) {
                    removeDeleteButton();
                }
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
            currentProject = FileUtils.stripTrailingSlash(ProjectManager.getProjectRoot().fullPath),
            templateVars   = {
                projectList : [],
                Strings     : Strings
            };

        recentProjects.forEach(function (root) {
            if (root !== currentProject) {
                templateVars.projectList.push(parsePath(root));
            }
        });

        return Mustache.render(ProjectsMenuTemplate, templateVars);
    }

    /**
     * Show or hide the recent projects dropdown.
     *
     * @param {{pageX:number, pageY:number}} position - the absolute position where to open the dropdown
     */
    function showDropdown(position) {
        // If the dropdown is already visible, just return (so the root click handler on html
        // will close it).
        if ($dropdown) {
            return;
        }

        Menus.closeAll();

        $dropdown = $(renderList())
            .css({
                left: position.pageX,
                top: position.pageY
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

        // Note: PopUpManager will automatically hide the sidebar in other cases, such as when a
        // command is run, Esc is pressed, or the menu is focused.

        // Hacky: if we detect a click in the menubar, close ourselves.
        // TODO: again, we should have centralized popup management.
        $("#titlebar .nav").on("click", closeDropdown);

        _handleListEvents();
        $(window).on("keydown", keydownHook);
    }


    /**
     * Show or hide the recent projects dropdown from the toogle command.
     */
    function handleKeyEvent() {
        if (!$dropdown) {
            if (!SidebarView.isVisible()) {
                SidebarView.show();
            }

            $("#project-dropdown-toggle").trigger("click");

            $dropdown.focus();
            $links = $dropdown.find("a");
            // By default, select the most recent project (which is at the top of the list underneath Open Folder),
            // but if there are none, select Open Folder instead.
            $dropdownItem = $links.eq($links.length > 1 ? 1 : 0);
            $dropdownItem.addClass("selected");

            // If focusing the dropdown caused a modal bar to close, we need to refocus the dropdown
            window.setTimeout(function () {
                $dropdown.focus();
            }, 0);
        }
    }

    // Register command handlers
    CommandManager.register(Strings.CMD_TOGGLE_RECENT_PROJECTS, TOGGLE_DROPDOWN, handleKeyEvent);
    KeyBindingManager.addBinding(TOGGLE_DROPDOWN, KeyboardPrefs.recentProjects);

    // Initialize extension
    AppInit.appReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/styles.less");

        ProjectManager.on("projectOpen", add);
        ProjectManager.on("beforeProjectClose", add);
    });

    AppInit.htmlReady(function () {
        $("#project-title")
            .wrap("<div id='project-dropdown-toggle' class='btn-alt-quiet'></div>")
            .after("<span class='dropdown-arrow'></span>");

        var cmenuAdapter = {
            open: showDropdown,
            close: closeDropdown,
            isOpen: function () {
                return !!$dropdown;
            }
        };
        Menus.ContextMenu.assignContextMenuToSelector("#project-dropdown-toggle", cmenuAdapter);
    });
});
