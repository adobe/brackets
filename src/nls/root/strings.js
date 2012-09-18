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
/*global define */

define({
    /**
     * Errors
     */

    // General file io error strings
    "GENERIC_ERROR"                     : "(error {0})",
    "NOT_FOUND_ERR"                     : "The file could not be found.",
    "NOT_READABLE_ERR"                  : "The file could not be read.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "The target directory cannot be modified.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "The permissions do not allow you to make modifications.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Error loading project",
    "OPEN_DIALOG_ERROR"                 : "An error occurred when showing the open file dialog. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "An error occurred when trying to load the directory <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "An error occurred when reading the contents of the directory <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Error opening file",
    "ERROR_OPENING_FILE"                : "An error occurred when trying to open the file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Error reloading changes from disk",
    "ERROR_RELOADING_FILE"              : "An error occurred when trying to reload the file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Error saving file",
    "ERROR_SAVING_FILE"                 : "An error occurred when trying to save the file <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Invalid file name",
    "INVALID_FILENAME_MESSAGE"          : "Filenames cannot contain the following characters: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "The file <span class='dialog-filename'>{0}</span> already exists.",
    "ERROR_CREATING_FILE_TITLE"         : "Error creating file",
    "ERROR_CREATING_FILE"               : "An error occurred when trying to create the file <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} doesn't run in browsers yet.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} is built in HTML, but right now it runs as a desktop app so you can use it to edit local files. Please use the application shell in the <b>github.com/adobe/brackets-shell</b> repo to run {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Error Indexing Files",
    "ERROR_MAX_FILES"                   : "The maximum number of files have been indexed. Actions that look up files in the index may function incorrectly.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Error launching browser",
    "ERROR_CANT_FIND_CHROME"            : "The Google Chrome browser could not be found. Please make sure it is installed.",
    "ERROR_LAUNCHING_BROWSER"           : "An error occurred when launching the browser. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Live Preview Error",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Connecting to Browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "In order for Live Preview to connect, Chrome needs to be relaunched with remote debugging enabled.<br /><br />Would you like to relaunch Chrome and enable remote debugging?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Open an HTML file in order to launch live preview.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Welcome to Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview connects {APP_NAME} to your browser. It launches a preview of your HTML file in the browser, then updates the preview instantly as you edit your code.<br /><br />In this early version of {APP_NAME}, Live Preview only works for edits to <strong>CSS files</strong> and only with <strong>Google Chrome</strong>. We'll be implementing it for HTML and JavaScript soon!<br /><br />(You'll only see this message once.)",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Connecting...",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Initializing...",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Disconnect Live Preview",
    
    "SAVE_CLOSE_TITLE"                  : "Save Changes",
    "SAVE_CLOSE_MESSAGE"                : "Do you want to save the changes you made in the document <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Do you want to save your changes to the following files?",
    "EXT_MODIFIED_TITLE"                : "External Changes",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> has been modified on disk, but also has unsaved changes in {APP_NAME}.<br /><br />Which version do you want to keep?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> has been deleted on disk, but has unsaved changes in {APP_NAME}.<br /><br />Do you want to keep your changes?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Use /re/ syntax for regexp search",
    "WITH"                              : "With",
    "BUTTON_YES"                        : "Yes",
    "BUTTON_NO"                         : "No",
    "BUTTON_STOP"                       : "Stop",

    "OPEN_FILE"                         : "Open File",
    "CHOOSE_FOLDER"                     : "Choose a folder",

    "RELEASE_NOTES"                     : "Release Notes",
    "NO_UPDATE_TITLE"                   : "You're up to date!",
    "NO_UPDATE_MESSAGE"                 : "You are running the latest version of {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "- {0} {1} in {2} {3}",
    "FIND_IN_FILES_FILE"                : "file",
    "FIND_IN_FILES_FILES"               : "files",
    "FIND_IN_FILES_MATCH"               : "match",
    "FIND_IN_FILES_MATCHES"             : "matches",
    "FIND_IN_FILES_MAX"                 : " (showing the first {0} matches)",
    "FIND_IN_FILES_FILE_PATH"           : "File: <b>{0}</b>",
    "FIND_IN_FILES_LINE"                : "line:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Error getting update info",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "There was a problem getting the latest update information from the server. Please make sure you are connected to the internet and try again.",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "Switch Language",
    "LANGUAGE_MESSAGE"                  : "Please select the desired language from the list below:",
    "LANGUAGE_SUBMIT"                   : "Reload {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "Cancel",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Untitled",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "File",
    "CMD_FILE_NEW"                        : "New",
    "CMD_FILE_OPEN"                       : "Open\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Add To Working Set",
    "CMD_OPEN_FOLDER"                     : "Open Folder\u2026",
    "CMD_FILE_CLOSE"                      : "Close",
    "CMD_FILE_CLOSE_ALL"                  : "Close All",
    "CMD_FILE_SAVE"                       : "Save",
    "CMD_FILE_SAVE_ALL"                   : "Save All",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_QUIT"                            : "Quit",

    // Edit menu commands
    "EDIT_MENU"                           : "Edit",
    "CMD_SELECT_ALL"                      : "Select All",
    "CMD_FIND"                            : "Find",
    "CMD_FIND_IN_FILES"                   : "Find in Files",
    "CMD_FIND_NEXT"                       : "Find Next",
    "CMD_FIND_PREVIOUS"                   : "Find Previous",
    "CMD_REPLACE"                         : "Replace",
    "CMD_INDENT"                          : "Indent",
    "CMD_UNINDENT"                        : "Unindent",
    "CMD_DUPLICATE"                       : "Duplicate",
    "CMD_COMMENT"                         : "Comment/Uncomment Lines",
    "CMD_LINE_UP"                         : "Move Line(s) Up",
    "CMD_LINE_DOWN"                       : "Move Line(s) Down",
     
    // View menu commands
    "VIEW_MENU"                           : "View",
    "CMD_HIDE_SIDEBAR"                    : "Hide Sidebar",
    "CMD_SHOW_SIDEBAR"                    : "Show Sidebar",
    "CMD_INCREASE_FONT_SIZE"              : "Increase Font Size",
    "CMD_DECREASE_FONT_SIZE"              : "Decrease Font Size",
    "CMD_RESTORE_FONT_SIZE"               : "Restore Font Size",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigate",
    "CMD_QUICK_OPEN"                      : "Quick Open",
    "CMD_GOTO_LINE"                       : "Go to Line",
    "CMD_GOTO_DEFINITION"                 : "Go to Definition",
    "CMD_TOGGLE_QUICK_EDIT"               : "Quick Edit",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Previous Match",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Next Match",
    "CMD_NEXT_DOC"                        : "Next Document",
    "CMD_PREV_DOC"                        : "Previous Document",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Debug",
    "CMD_REFRESH_WINDOW"                  : "Reload {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "Show Developer Tools",
    "CMD_RUN_UNIT_TESTS"                  : "Run Tests",
    "CMD_JSLINT"                          : "Enable JSLint",
    "CMD_SHOW_PERF_DATA"                  : "Show Performance Data",
    "CMD_NEW_BRACKETS_WINDOW"             : "New {APP_NAME} Window",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Show Extensions Folder",
    "CMD_USE_TAB_CHARS"                   : "Use Tab Characters",
    "CMD_SWITCH_LANGUAGE"                 : "Switch Language",
    "CMD_CHECK_FOR_UPDATE"                : "Check for Updates",

    // Help menu commands
    "HELP_MENU"                           : "Help",
    "CMD_ABOUT"                           : "About {APP_TITLE}",
    "CMD_FORUM"                           : "{APP_NAME} Forum",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Close Window",
    "CMD_ABORT_QUIT"                      : "Abort Quit",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Experimental Build",
    "JSLINT_ERRORS"                        : "JSLint Errors",
    "JSLINT_NO_ERRORS"                     : "No JSLint errors - good job!",
    "SEARCH_RESULTS"                       : "Search Results",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Don't Save",
    "SAVE"                                 : "Save",
    "CANCEL"                               : "Cancel",
    "RELOAD_FROM_DISK"                     : "Reload from Disk",
    "KEEP_CHANGES_IN_EDITOR"               : "Keep Changes in Editor",
    "CLOSE_DONT_SAVE"                      : "Close (Don't Save)",
    "RELAUNCH_CHROME"                      : "Relaunch Chrome",
    "ABOUT"                                : "About",
    "APP_NAME"                             : "Brackets",
    "CLOSE"                                : "Close",
    "ABOUT_TEXT_LINE1"                     : "sprint 14 experimental build ",
    "ABOUT_TEXT_LINE3"                     : "Notices, terms and conditions pertaining to third party software are located at <span class=\"non-clickble-link\">http://www.adobe.com/go/thirdparty/</span> and incorporated by reference herein.",
    "ABOUT_TEXT_LINE4"                     : "Documentation and source at <span class=\"non-clickble-link\">https://github.com/adobe/brackets/</span>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "There's a new build of {APP_NAME} available! Click here for details.",
    "UPDATE_AVAILABLE_TITLE"               : "Update Available",
    "UPDATE_MESSAGE"                       : "Hey, there's a new build of {APP_NAME} available. Here are some of the new features:",
    "GET_IT_NOW"                           : "Get it now!"
});
