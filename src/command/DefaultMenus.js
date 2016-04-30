/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, brackets, window */

/**
 * Initializes the default brackets menu items.
 */
define(function (require, exports, module) {
    "use strict";

    var AppInit         = require("utils/AppInit"),
        Commands        = require("command/Commands"),
        Menus           = require("command/Menus"),
        Strings         = require("strings");

    AppInit.htmlReady(function () {
        /*
         * File menu
         */
        var menu;
        menu = Menus.addMenu(Strings.FILE_MENU, Menus.AppMenuBar.FILE_MENU);
        menu.addMenuItem(Commands.FILE_NEW_UNTITLED);
        menu.addMenuItem(Commands.FILE_OPEN);
        menu.addMenuItem(Commands.FILE_OPEN_FOLDER);
        menu.addMenuItem(Commands.FILE_CLOSE);
        menu.addMenuItem(Commands.FILE_CLOSE_ALL);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.FILE_SAVE);
        menu.addMenuItem(Commands.FILE_SAVE_ALL);
        menu.addMenuItem(Commands.FILE_SAVE_AS);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.FILE_LIVE_FILE_PREVIEW);
        menu.addMenuItem(Commands.TOGGLE_LIVE_PREVIEW_MB_MODE);
        menu.addMenuItem(Commands.FILE_PROJECT_SETTINGS);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.FILE_EXTENSION_MANAGER);

        // suppress redundant quit menu item on mac
        if (brackets.platform !== "mac" || !brackets.nativeMenus) {
            menu.addMenuDivider();
            menu.addMenuItem(Commands.FILE_QUIT);
        }

        /*
         * Edit  menu
         */
        menu = Menus.addMenu(Strings.EDIT_MENU, Menus.AppMenuBar.EDIT_MENU);
        menu.addMenuItem(Commands.EDIT_UNDO);
        menu.addMenuItem(Commands.EDIT_REDO);
        menu.addMenuDivider();
        if (brackets.nativeMenus) {
            // Native-only - can't programmatically trigger clipboard actions from JS menus
            menu.addMenuItem(Commands.EDIT_CUT);
            menu.addMenuItem(Commands.EDIT_COPY);
            menu.addMenuItem(Commands.EDIT_PASTE);
            menu.addMenuDivider();
        }
        menu.addMenuItem(Commands.EDIT_SELECT_ALL);
        menu.addMenuItem(Commands.EDIT_SELECT_LINE);
        menu.addMenuItem(Commands.EDIT_SPLIT_SEL_INTO_LINES);
        menu.addMenuItem(Commands.EDIT_ADD_CUR_TO_PREV_LINE);
        menu.addMenuItem(Commands.EDIT_ADD_CUR_TO_NEXT_LINE);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.EDIT_INDENT);
        menu.addMenuItem(Commands.EDIT_UNINDENT);
        menu.addMenuItem(Commands.EDIT_DUPLICATE);
        menu.addMenuItem(Commands.EDIT_DELETE_LINES);
        menu.addMenuItem(Commands.EDIT_LINE_UP);
        menu.addMenuItem(Commands.EDIT_LINE_DOWN);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.EDIT_LINE_COMMENT);
        menu.addMenuItem(Commands.EDIT_BLOCK_COMMENT);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.SHOW_CODE_HINTS);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.TOGGLE_CLOSE_BRACKETS);

        /*
         * Find menu
         */
        menu = Menus.addMenu(Strings.FIND_MENU, Menus.AppMenuBar.FIND_MENU);
        menu.addMenuItem(Commands.CMD_FIND);
        menu.addMenuItem(Commands.CMD_FIND_NEXT);
        menu.addMenuItem(Commands.CMD_FIND_PREVIOUS);
        menu.addMenuItem(Commands.CMD_FIND_ALL_AND_SELECT);
        menu.addMenuItem(Commands.CMD_ADD_NEXT_MATCH);
        menu.addMenuItem(Commands.CMD_SKIP_CURRENT_MATCH);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.CMD_FIND_IN_FILES);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.CMD_REPLACE);
        menu.addMenuItem(Commands.CMD_REPLACE_IN_FILES);

        /*
         * View menu
         */
        menu = Menus.addMenu(Strings.VIEW_MENU, Menus.AppMenuBar.VIEW_MENU);
        menu.addMenuItem(Commands.CMD_THEMES_OPEN_SETTINGS);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.CMD_SPLITVIEW_NONE);
        menu.addMenuItem(Commands.CMD_SPLITVIEW_VERTICAL);
        menu.addMenuItem(Commands.CMD_SPLITVIEW_HORIZONTAL);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.VIEW_HIDE_SIDEBAR);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.VIEW_INCREASE_FONT_SIZE);
        menu.addMenuItem(Commands.VIEW_DECREASE_FONT_SIZE);
        menu.addMenuItem(Commands.VIEW_RESTORE_FONT_SIZE);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.TOGGLE_ACTIVE_LINE);
        menu.addMenuItem(Commands.TOGGLE_LINE_NUMBERS);
        menu.addMenuItem(Commands.TOGGLE_WORD_WRAP);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.FILE_LIVE_HIGHLIGHT);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.VIEW_TOGGLE_INSPECTION);

        /*
         * Navigate menu
         */
        menu = Menus.addMenu(Strings.NAVIGATE_MENU, Menus.AppMenuBar.NAVIGATE_MENU);
        menu.addMenuItem(Commands.NAVIGATE_QUICK_OPEN);
        menu.addMenuItem(Commands.NAVIGATE_GOTO_LINE);
        menu.addMenuItem(Commands.NAVIGATE_GOTO_DEFINITION);
        menu.addMenuItem(Commands.NAVIGATE_JUMPTO_DEFINITION);
        menu.addMenuItem(Commands.NAVIGATE_GOTO_FIRST_PROBLEM);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.NAVIGATE_NEXT_DOC);
        menu.addMenuItem(Commands.NAVIGATE_PREV_DOC);
        menu.addMenuItem(Commands.NAVIGATE_NEXT_DOC_LIST_ORDER);
        menu.addMenuItem(Commands.NAVIGATE_PREV_DOC_LIST_ORDER);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.NAVIGATE_SHOW_IN_FILE_TREE);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.TOGGLE_QUICK_EDIT);
        menu.addMenuItem(Commands.QUICK_EDIT_PREV_MATCH);
        menu.addMenuItem(Commands.QUICK_EDIT_NEXT_MATCH);
        menu.addMenuItem(Commands.CSS_QUICK_EDIT_NEW_RULE);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.TOGGLE_QUICK_DOCS);

        /*
         * Help menu
         */
        menu = Menus.addMenu(Strings.HELP_MENU, Menus.AppMenuBar.HELP_MENU);
        menu.addMenuItem(Commands.HELP_CHECK_FOR_UPDATE);

        menu.addMenuDivider();
        if (brackets.config.how_to_use_url) {
            menu.addMenuItem(Commands.HELP_HOW_TO_USE_BRACKETS);
        }
        if (brackets.config.support_url) {
            menu.addMenuItem(Commands.HELP_SUPPORT);
        }
        if (brackets.config.suggest_feature_url) {
            menu.addMenuItem(Commands.HELP_SUGGEST);
        }
        if (brackets.config.release_notes_url) {
            menu.addMenuItem(Commands.HELP_RELEASE_NOTES);
        }
        if (brackets.config.get_involved_url) {
            menu.addMenuItem(Commands.HELP_GET_INVOLVED);
        }

        menu.addMenuDivider();
        menu.addMenuItem(Commands.HELP_SHOW_EXT_FOLDER);

        var hasAboutItem = (brackets.platform !== "mac" || !brackets.nativeMenus);

        // Add final divider only if we have a homepage URL or twitter URL or about item
        if (hasAboutItem || brackets.config.homepage_url || brackets.config.twitter_url) {
            menu.addMenuDivider();
        }

        if (brackets.config.homepage_url) {
            menu.addMenuItem(Commands.HELP_HOMEPAGE);
        }

        if (brackets.config.twitter_url) {
            menu.addMenuItem(Commands.HELP_TWITTER);
        }
        // supress redundant about menu item in mac shell
        if (hasAboutItem) {
            menu.addMenuItem(Commands.HELP_ABOUT);
        }


        /*
         * Context Menus
         */

        // WorkingSet context menu - Unlike most context menus, we can't attach
        // listeners here because the DOM nodes for each pane's working set are
        // created dynamically. Each WorkingSetView attaches its own listeners.
        var workingset_cmenu = Menus.registerContextMenu(Menus.ContextMenuIds.WORKING_SET_CONTEXT_MENU);
        workingset_cmenu.addMenuItem(Commands.FILE_SAVE);
        workingset_cmenu.addMenuItem(Commands.FILE_SAVE_AS);
        workingset_cmenu.addMenuItem(Commands.FILE_RENAME);
        workingset_cmenu.addMenuItem(Commands.NAVIGATE_SHOW_IN_FILE_TREE);
        workingset_cmenu.addMenuItem(Commands.NAVIGATE_SHOW_IN_OS);
        workingset_cmenu.addMenuDivider();
        workingset_cmenu.addMenuItem(Commands.CMD_FIND_IN_SUBTREE);
        workingset_cmenu.addMenuItem(Commands.CMD_REPLACE_IN_SUBTREE);
        workingset_cmenu.addMenuDivider();
        workingset_cmenu.addMenuItem(Commands.FILE_CLOSE);

        var workingset_configuration_menu = Menus.registerContextMenu(Menus.ContextMenuIds.WORKING_SET_CONFIG_MENU);
        workingset_configuration_menu.addMenuItem(Commands.CMD_WORKINGSET_SORT_BY_ADDED);
        workingset_configuration_menu.addMenuItem(Commands.CMD_WORKINGSET_SORT_BY_NAME);
        workingset_configuration_menu.addMenuItem(Commands.CMD_WORKINGSET_SORT_BY_TYPE);
        workingset_configuration_menu.addMenuDivider();
        workingset_configuration_menu.addMenuItem(Commands.CMD_WORKING_SORT_TOGGLE_AUTO);

        var splitview_menu = Menus.registerContextMenu(Menus.ContextMenuIds.SPLITVIEW_MENU);
        splitview_menu.addMenuItem(Commands.CMD_SPLITVIEW_NONE);
        splitview_menu.addMenuItem(Commands.CMD_SPLITVIEW_VERTICAL);
        splitview_menu.addMenuItem(Commands.CMD_SPLITVIEW_HORIZONTAL);

        var project_cmenu = Menus.registerContextMenu(Menus.ContextMenuIds.PROJECT_MENU);
        project_cmenu.addMenuItem(Commands.FILE_NEW);
        project_cmenu.addMenuItem(Commands.FILE_NEW_FOLDER);
        project_cmenu.addMenuItem(Commands.FILE_RENAME);
        project_cmenu.addMenuItem(Commands.FILE_DELETE);
        project_cmenu.addMenuItem(Commands.NAVIGATE_SHOW_IN_OS);
        project_cmenu.addMenuDivider();
        project_cmenu.addMenuItem(Commands.CMD_FIND_IN_SUBTREE);
        project_cmenu.addMenuItem(Commands.CMD_REPLACE_IN_SUBTREE);
        project_cmenu.addMenuDivider();
        project_cmenu.addMenuItem(Commands.FILE_REFRESH);

        var editor_cmenu = Menus.registerContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
        // editor_cmenu.addMenuItem(Commands.NAVIGATE_JUMPTO_DEFINITION);
        editor_cmenu.addMenuItem(Commands.TOGGLE_QUICK_EDIT);
        editor_cmenu.addMenuItem(Commands.TOGGLE_QUICK_DOCS);
        editor_cmenu.addMenuItem(Commands.EDIT_SELECT_ALL);

        var inline_editor_cmenu = Menus.registerContextMenu(Menus.ContextMenuIds.INLINE_EDITOR_MENU);
        inline_editor_cmenu.addMenuItem(Commands.TOGGLE_QUICK_EDIT);
        inline_editor_cmenu.addMenuItem(Commands.EDIT_SELECT_ALL);
        inline_editor_cmenu.addMenuDivider();
        inline_editor_cmenu.addMenuItem(Commands.QUICK_EDIT_PREV_MATCH);
        inline_editor_cmenu.addMenuItem(Commands.QUICK_EDIT_NEXT_MATCH);

        /**
         * Context menu for code editors (both full-size and inline)
         * Auto selects the word the user clicks if the click does not occur over
         * an existing selection
         */
        $("#editor-holder").on("contextmenu", function (e) {
            require(["editor/EditorManager"], function (EditorManager) {
                if ($(e.target).parents(".CodeMirror-gutter").length !== 0) {
                    return;
                }

                // Note: on mousedown before this event, CodeMirror automatically checks mouse pos, and
                // if not clicking on a selection moves the cursor to click location. When triggered
                // from keyboard, no pre-processing occurs and the cursor/selection is left as is.

                var editor = EditorManager.getFocusedEditor(),
                    inlineWidget = EditorManager.getFocusedInlineWidget();

                if (editor) {
                    // If there's just an insertion point select the word token at the cursor pos so
                    // it's more clear what the context menu applies to.
                    if (!editor.hasSelection()) {
                        editor.selectWordAt(editor.getCursorPos());

                        // Prevent menu from overlapping text by moving it down a little
                        // Temporarily backout this change for now to help mitigate issue #1111,
                        // which only happens if mouse is not over context menu. Better fix
                        // requires change to bootstrap, which is too risky for now.
                        //e.pageY += 6;
                    }

                    // Inline text editors have a different context menu (safe to assume it's not some other
                    // type of inline widget since we already know an Editor has focus)
                    if (inlineWidget) {
                        inline_editor_cmenu.open(e);
                    } else {
                        editor_cmenu.open(e);
                    }
                }
            });
        });

        /**
         * Context menu for folder tree
         */
        $("#project-files-container").on("contextmenu", function (e) {
            project_cmenu.open(e);
        });

        // Dropdown menu for workspace sorting
        Menus.ContextMenu.assignContextMenuToSelector(".working-set-option-btn", workingset_configuration_menu);

        // Dropdown menu for view splitting
        Menus.ContextMenu.assignContextMenuToSelector(".working-set-splitview-btn", splitview_menu);

        // Prevent the browser context menu since Brackets creates a custom context menu
        $(window).contextmenu(function (e) {
            e.preventDefault();
        });

        /*
         * General menu event processing
         */
        // Prevent clicks on top level menus and menu items from taking focus
        $(window.document).on("mousedown", ".dropdown", function (e) {
            e.preventDefault();
        });

        // Switch menus when the mouse enters an adjacent menu
        // Only open the menu if another one has already been opened
        // by clicking
        $(window.document).on("mouseenter", "#titlebar .dropdown", function (e) {
            var open = $(this).siblings(".open");
            if (open.length > 0) {
                open.removeClass("open");
                $(this).addClass("open");
            }
        });
    });
});
