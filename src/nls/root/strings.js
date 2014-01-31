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
    "CONTENTS_MODIFIED_ERR"             : "The file has been modified outside of {APP_NAME}.",
    "FILE_EXISTS_ERR"                   : "The file or directory already exists.",
    "FILE"                              : "file",
    "DIRECTORY"                         : "directory",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Error loading project",
    "OPEN_DIALOG_ERROR"                 : "An error occurred when showing the open file dialog. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "An error occurred when trying to load the directory <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "An error occurred when reading the contents of the directory <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Error opening file",
    "ERROR_OPENING_FILE"                : "An error occurred when trying to open the file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "An error occurred when trying to open the following files:",
    "ERROR_RELOADING_FILE_TITLE"        : "Error reloading changes from disk",
    "ERROR_RELOADING_FILE"              : "An error occurred when trying to reload the file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Error saving file",
    "ERROR_SAVING_FILE"                 : "An error occurred when trying to save the file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Error renaming file",
    "ERROR_RENAMING_FILE"               : "An error occurred when trying to rename the file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Error deleting file",
    "ERROR_DELETING_FILE"               : "An error occurred when trying to delete the file <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Invalid {0} name",
    "INVALID_FILENAME_MESSAGE"          : "Filenames cannot contain the following characters: {0} or use any system reserved words.",
    "FILE_ALREADY_EXISTS"               : "The {0} <span class='dialog-filename'>{1}</span> already exists.",
    "ERROR_CREATING_FILE_TITLE"         : "Error creating {0}",
    "ERROR_CREATING_FILE"               : "An error occurred when trying to create the {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} doesn't run in browsers yet.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} is built in HTML, but right now it runs as a desktop app so you can use it to edit local files. Please use the application shell in the <b>github.com/adobe/brackets-shell</b> repo to run {APP_NAME}.",
    
    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Error Indexing Files",
    "ERROR_MAX_FILES"                   : "The maximum number of files have been indexed. Actions that look up files in the index may function incorrectly.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Error launching browser",
    "ERROR_CANT_FIND_CHROME"            : "The Google Chrome browser could not be found. Please make sure it is installed.",
    "ERROR_LAUNCHING_BROWSER"           : "An error occurred when launching the browser. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Live Preview Error",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Connecting to Browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "In order for Live Preview to connect, Chrome needs to be relaunched with remote debugging enabled.<br /><br />Would you like to relaunch Chrome and enable remote debugging?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Unable to load Live Development page",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Open an HTML file or make sure there is an index.html file in your project in order to launch live preview.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "To launch live preview with a server-side file, you need to specify a Base URL for this project.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Error starting up the HTTP server for live development files. Please try again.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Welcome to Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview connects {APP_NAME} to your browser. It launches a preview of your HTML file in the browser, then updates the preview instantly as you edit your code.<br /><br />In this early version of {APP_NAME}, Live Preview only works with <strong>Google Chrome</strong> and updates live as you edit <strong>CSS or HTML files</strong>. Changes to JavaScript files are automatically reloaded when you save.<br /><br />(You'll only see this message once.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "For more information, see <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Connecting\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Initializing\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Disconnect Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview (save file to refresh)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Preview (not updating due to syntax error)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Live Preview was cancelled because the browser's developer tools were opened",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Live Preview was cancelled because the page was closed in the browser",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Live Preview was cancelled because the browser navigated to a page that is not part of the current project",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Live Preview was cancelled for an unknown reason ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Save Changes",
    "SAVE_CLOSE_MESSAGE"                : "Do you want to save the changes you made in the document <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Do you want to save your changes to the following files?",
    "EXT_MODIFIED_TITLE"                : "External Changes",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Confirm Delete",
    "CONFIRM_FOLDER_DELETE"             : "Are you sure you want to delete the folder <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "File Deleted",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> has been modified on disk.<br /><br />Do you want to save the file and overwrite those changes?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> has been modified on disk, but also has unsaved changes in {APP_NAME}.<br /><br />Which version do you want to keep?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> has been deleted on disk, but has unsaved changes in {APP_NAME}.<br /><br />Do you want to keep your changes?",
    
    // Generic dialog/button labels
    "OK"                                : "OK",
    "CANCEL"                            : "Cancel",
    "DONT_SAVE"                         : "Don't Save",
    "SAVE"                              : "Save",
    "SAVE_AS"                           : "Save As\u2026",
    "SAVE_AND_OVERWRITE"                : "Overwrite",
    "DELETE"                            : "Delete",
    "BUTTON_YES"                        : "Yes",
    "BUTTON_NO"                         : "No",
        
    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} results",
    "FIND_RESULT_COUNT_SINGLE"          : "1 result",
    "FIND_NO_RESULTS"                   : "No results",
    "REPLACE_PLACEHOLDER"               : "Replace with\u2026",
    "BUTTON_REPLACE_ALL"                : "All\u2026",
    "BUTTON_REPLACE"                    : "Replace",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Next Match",
    "BUTTON_PREV_HINT"                  : "Previous Match",
    "BUTTON_CASESENSITIVE_HINT"         : "Match Case",
    "BUTTON_REGEXP_HINT"                : "Regular Expression",

    "OPEN_FILE"                         : "Open File",
    "SAVE_FILE_AS"                      : "Save File",
    "CHOOSE_FOLDER"                     : "Choose a folder",

    "RELEASE_NOTES"                     : "Release Notes",
    "NO_UPDATE_TITLE"                   : "You're up to date!",
    "NO_UPDATE_MESSAGE"                 : "You are running the latest version of {APP_NAME}.",

    // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1"          : "Replace \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" with \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    // Find in Files
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" found",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} in {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "in project",
    "FIND_IN_FILES_FILE"                : "file",
    "FIND_IN_FILES_FILES"               : "files",
    "FIND_IN_FILES_MATCH"               : "match",
    "FIND_IN_FILES_MATCHES"             : "matches",
    "FIND_IN_FILES_MORE_THAN"           : "Over ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd click to expand/collapse all",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Error getting update info",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "There was a problem getting the latest update information from the server. Please make sure you are connected to the internet and try again.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Loading\u2026",
    "UNTITLED"          : "Untitled",
    "WORKING_FILES"     : "Working Files",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Line {0}, Column {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Selected {0} column",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Selected {0} columns",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Selected {0} line",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Selected {0} lines",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} selections",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Click to switch indentation to spaces",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Click to switch indentation to tabs",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Click to change number of spaces used when indenting",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Click to change tab character width",
    "STATUSBAR_SPACES"                      : "Spaces:",
    "STATUSBAR_TAB_SIZE"                    : "Tab Size:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Line",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Lines",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Extensions Disabled",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Problems",
    "SINGLE_ERROR"                          : "1 {0} Problem",
    "MULTIPLE_ERRORS"                       : "{1} {0} Problems",
    "NO_ERRORS"                             : "No {0} problems found - good job!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "No problems found - good job!",
    "LINT_DISABLED"                         : "Linting is disabled",
    "NO_LINT_AVAILABLE"                     : "No linter available for {0}",
    "NOTHING_TO_LINT"                       : "Nothing to lint",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "File",
    "CMD_FILE_NEW_UNTITLED"               : "New",
    "CMD_FILE_NEW"                        : "New File",
    "CMD_FILE_NEW_FOLDER"                 : "New Folder",
    "CMD_FILE_OPEN"                       : "Open\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Add To Working Set",
    "CMD_OPEN_DROPPED_FILES"              : "Open Dropped Files",
    "CMD_OPEN_FOLDER"                     : "Open Folder\u2026",
    "CMD_FILE_CLOSE"                      : "Close",
    "CMD_FILE_CLOSE_ALL"                  : "Close All",
    "CMD_FILE_CLOSE_LIST"                 : "Close List",
    "CMD_FILE_CLOSE_OTHERS"               : "Close Others",
    "CMD_FILE_CLOSE_ABOVE"                : "Close Others Above",
    "CMD_FILE_CLOSE_BELOW"                : "Close Others Below",
    "CMD_FILE_SAVE"                       : "Save",
    "CMD_FILE_SAVE_ALL"                   : "Save All",
    "CMD_FILE_SAVE_AS"                    : "Save As\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_PROJECT_SETTINGS"                : "Project Settings\u2026",
    "CMD_FILE_RENAME"                     : "Rename",
    "CMD_FILE_DELETE"                     : "Delete",
    "CMD_INSTALL_EXTENSION"               : "Install Extension\u2026",
    "CMD_EXTENSION_MANAGER"               : "Extension Manager\u2026",
    "CMD_FILE_REFRESH"                    : "Refresh File Tree",
    "CMD_QUIT"                            : "Quit",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Exit",

    // Edit menu commands
    "EDIT_MENU"                           : "Edit",
    "CMD_UNDO"                            : "Undo",
    "CMD_REDO"                            : "Redo",
    "CMD_CUT"                             : "Cut",
    "CMD_COPY"                            : "Copy",
    "CMD_PASTE"                           : "Paste",
    "CMD_SELECT_ALL"                      : "Select All",
    "CMD_SELECT_LINE"                     : "Select Line",
    "CMD_FIND"                            : "Find",
    "CMD_FIND_FIELD_PLACEHOLDER"          : "Find\u2026",
    "CMD_FIND_IN_FILES"                   : "Find in Files",
    "CMD_FIND_IN_SUBTREE"                 : "Find in\u2026",
    "CMD_FIND_NEXT"                       : "Find Next",
    "CMD_FIND_PREVIOUS"                   : "Find Previous",
    "CMD_REPLACE"                         : "Replace",
    "CMD_INDENT"                          : "Indent",
    "CMD_UNINDENT"                        : "Unindent",
    "CMD_DUPLICATE"                       : "Duplicate",
    "CMD_DELETE_LINES"                    : "Delete Line",
    "CMD_COMMENT"                         : "Toggle Line Comment",
    "CMD_BLOCK_COMMENT"                   : "Toggle Block Comment",
    "CMD_LINE_UP"                         : "Move Line Up",
    "CMD_LINE_DOWN"                       : "Move Line Down",
    "CMD_OPEN_LINE_ABOVE"                 : "Open Line Above",
    "CMD_OPEN_LINE_BELOW"                 : "Open Line Below",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Auto Close Braces",
    "CMD_SHOW_CODE_HINTS"                 : "Show Code Hints",
    
    // View menu commands
    "VIEW_MENU"                           : "View",
    "CMD_HIDE_SIDEBAR"                    : "Hide Sidebar",
    "CMD_SHOW_SIDEBAR"                    : "Show Sidebar",
    "CMD_INCREASE_FONT_SIZE"              : "Increase Font Size",
    "CMD_DECREASE_FONT_SIZE"              : "Decrease Font Size",
    "CMD_RESTORE_FONT_SIZE"               : "Restore Font Size",
    "CMD_SCROLL_LINE_UP"                  : "Scroll Line Up",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll Line Down",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Line Numbers",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Highlight Active Line",
    "CMD_TOGGLE_WORD_WRAP"                : "Word Wrap",
    "CMD_LIVE_HIGHLIGHT"                  : "Live Preview Highlight",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint Files on Save",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Sort by Added",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Sort by Name",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Sort by Type",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatic Sort",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigate",
    "CMD_QUICK_OPEN"                      : "Quick Open",
    "CMD_GOTO_LINE"                       : "Go to Line",
    "CMD_GOTO_DEFINITION"                 : "Quick Find Definition",
    "CMD_GOTO_FIRST_PROBLEM"              : "Go to First Error/Warning",
    "CMD_TOGGLE_QUICK_EDIT"               : "Quick Edit",
    "CMD_TOGGLE_QUICK_DOCS"               : "Quick Docs",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Previous Match",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Next Match",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "New Rule",
    "CMD_NEXT_DOC"                        : "Next Document",
    "CMD_PREV_DOC"                        : "Previous Document",
    "CMD_SHOW_IN_TREE"                    : "Show in File Tree",
    "CMD_SHOW_IN_OS"                      : "Show in OS",
    
    // Help menu commands
    "HELP_MENU"                           : "Help",
    "CMD_CHECK_FOR_UPDATE"                : "Check for Updates",
    "CMD_HOW_TO_USE_BRACKETS"             : "How to Use {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} Forum",
    "CMD_RELEASE_NOTES"                   : "Release Notes",
    "CMD_REPORT_AN_ISSUE"                 : "Report an Issue",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Show Extensions Folder",
    "CMD_TWITTER"                         : "{TWITTER_NAME} on Twitter",
    "CMD_ABOUT"                           : "About {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Open Preferences File",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimental build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "RELOAD_FROM_DISK"                     : "Reload from Disk",
    "KEEP_CHANGES_IN_EDITOR"               : "Keep Changes in Editor",
    "CLOSE_DONT_SAVE"                      : "Close (Don't Save)",
    "RELAUNCH_CHROME"                      : "Relaunch Chrome",
    "ABOUT"                                : "About",
    "CLOSE"                                : "Close",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Notices, terms and conditions pertaining to third party software are located at <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> and incorporated by reference herein.",
    "ABOUT_TEXT_LINE4"                     : "Documentation and source at <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Made with \u2764 and JavaScript by:",
    "ABOUT_TEXT_LINE6"                     : "Lots of people (but we're having trouble loading that data right now).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "There's a new build of {APP_NAME} available! Click here for details.",
    "UPDATE_AVAILABLE_TITLE"               : "Update Available",
    "UPDATE_MESSAGE"                       : "Hey, there's a new build of {APP_NAME} available. Here are some of the new features:",
    "GET_IT_NOW"                           : "Get it now!",
    "PROJECT_SETTINGS_TITLE"               : "Project Settings for: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Live Preview Base URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "To use a local server, enter a url like http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "The {0} protocol isn't supported by Live Preview&mdash;please use http: or https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "The base URL can't contain search parameters like \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "The base URL can't contain hashes like \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Special characters like '{0}' must be %-encoded.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Unknown error parsing Base URL",
    
    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "New Rule",
    
    // Extension Management strings
    "INSTALL"                              : "Install",
    "UPDATE"                               : "Update",
    "REMOVE"                               : "Remove",
    "OVERWRITE"                            : "Overwrite",
    "CANT_REMOVE_DEV"                      : "Extensions in the \"dev\" folder must be manually deleted.",
    "CANT_UPDATE"                          : "The update isn't compatible with this version of {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Extensions in the \"dev\" folder can't be updated automatically.",
    "INSTALL_EXTENSION_TITLE"              : "Install Extension",
    "UPDATE_EXTENSION_TITLE"               : "Update Extension",
    "INSTALL_EXTENSION_LABEL"              : "Extension URL",
    "INSTALL_EXTENSION_HINT"               : "URL of the extension's zip file or GitHub repo",
    "INSTALLING_FROM"                      : "Installing extension from {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Installation successful!",
    "INSTALL_FAILED"                       : "Installation failed.",
    "CANCELING_INSTALL"                    : "Canceling\u2026",
    "CANCELING_HUNG"                       : "Canceling the install is taking a long time. An internal error may have occurred.",
    "INSTALL_CANCELED"                     : "Installation canceled.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "The downloaded content is not a valid zip file.",
    "INVALID_PACKAGE_JSON"                 : "The package.json file is not valid (error was: {0}).",
    "MISSING_PACKAGE_NAME"                 : "The package.json file doesn't specify a package name.",
    "BAD_PACKAGE_NAME"                     : "{0} is an invalid package name.",
    "MISSING_PACKAGE_VERSION"              : "The package.json file doesn't specify a package version.",
    "INVALID_VERSION_NUMBER"               : "The package version number ({0}) is invalid.",
    "INVALID_BRACKETS_VERSION"             : "The {APP_NAME} compatibility string ({0}) is invalid.",
    "DISALLOWED_WORDS"                     : "The words ({1}) are not allowed in the {0} field.",
    "API_NOT_COMPATIBLE"                   : "The extension isn't compatible with this version of {APP_NAME}. It's installed in your disabled extensions folder.",
    "MISSING_MAIN"                         : "The package has no main.js file.",
    "EXTENSION_ALREADY_INSTALLED"          : "Installing this package will overwrite a previously installed extension. Overwrite the old extension?",
    "EXTENSION_SAME_VERSION"               : "This package is the same version as the one that is currently installed. Overwrite the existing installation?",
    "EXTENSION_OLDER_VERSION"              : "This package is version {0} which is older than the currently installed ({1}). Overwrite the existing installation?",
    "DOWNLOAD_ID_IN_USE"                   : "Internal error: download ID already in use.",
    "NO_SERVER_RESPONSE"                   : "Cannot connect to server.",
    "BAD_HTTP_STATUS"                      : "File not found on server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Unable to save download to temp file.",
    "ERROR_LOADING"                        : "The extension encountered an error while starting up.",
    "MALFORMED_URL"                        : "The URL is invalid. Please check that you entered it correctly.",
    "UNSUPPORTED_PROTOCOL"                 : "The URL must be an http or https URL.",
    "UNKNOWN_ERROR"                        : "Unknown internal error.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Extension Manager",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Unable to access the extension registry. Please try again later.",
    "INSTALL_FROM_URL"                     : "Install from URL\u2026",
    "EXTENSION_AUTHOR"                     : "Author",
    "EXTENSION_DATE"                       : "Date",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "This extension requires a newer version of {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "This extension currently only works with older versions of {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Version {0} of this extension requires a newer version of {APP_NAME}. But you can install the earlier version {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Version {0} of this extension only works with older versions of {APP_NAME}. But you can install the earlier version {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "No description",
    "EXTENSION_MORE_INFO"                  : "More info...",
    "EXTENSION_ERROR"                      : "Extension error",
    "EXTENSION_KEYWORDS"                   : "Keywords",
    "EXTENSION_INSTALLED"                  : "Installed",
    "EXTENSION_UPDATE_INSTALLED"           : "This extension update has been downloaded and will be installed after {APP_NAME} reloads.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Search",
    "EXTENSION_MORE_INFO_LINK"             : "More",
    "BROWSE_EXTENSIONS"                    : "Browse Extensions",
    "EXTENSION_MANAGER_REMOVE"             : "Remove Extension",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Unable to remove one or more extensions: {0}. {APP_NAME} will still reload.",
    "EXTENSION_MANAGER_UPDATE"             : "Update Extension",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Unable to update one or more extensions: {0}. {APP_NAME} will still reload.",
    "MARKED_FOR_REMOVAL"                   : "Marked for removal",
    "UNDO_REMOVE"                          : "Undo",
    "MARKED_FOR_UPDATE"                    : "Marked for update",
    "UNDO_UPDATE"                          : "Undo",
    "CHANGE_AND_RELOAD_TITLE"              : "Change Extensions",
    "CHANGE_AND_RELOAD_MESSAGE"            : "To update or remove the marked extensions, {APP_NAME} will need to reload. You'll be prompted to save unsaved changes.",
    "REMOVE_AND_RELOAD"                    : "Remove Extensions and Reload",
    "CHANGE_AND_RELOAD"                    : "Change Extensions and Reload",
    "UPDATE_AND_RELOAD"                    : "Update Extensions and Reload",
    "PROCESSING_EXTENSIONS"                : "Processing extension changes\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Couldn't remove extension {0} because it wasn't installed.",
    "NO_EXTENSIONS"                        : "No extensions installed yet.<br>Click on the Available tab above to get started.",
    "NO_EXTENSION_MATCHES"                 : "No extensions match your search.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Be cautious when installing extensions from an unknown source.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Installed",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Available",
    "EXTENSIONS_UPDATES_TITLE"             : "Updates",
    
    "INLINE_EDITOR_NO_MATCHES"             : "No matches available.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "There are no existing CSS rules that match your selection.<br> Click \"New Rule\" to create one.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "There are no stylesheets in your project.<br>Create one to add CSS rules.",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixels",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "CMD_SHOW_DEV_TOOLS"                        : "Show Developer Tools",
    "CMD_REFRESH_WINDOW"                        : "Reload With Extensions",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Reload Without Extensions",
    "CMD_NEW_BRACKETS_WINDOW"                   : "New {APP_NAME} Window",
    "CMD_SWITCH_LANGUAGE"                       : "Switch Language",
    "CMD_RUN_UNIT_TESTS"                        : "Run Tests",
    "CMD_SHOW_PERF_DATA"                        : "Show Performance Data",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Enable Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Log Node State to Console",
    "CMD_RESTART_NODE"                          : "Restart Node",
    
    "LANGUAGE_TITLE"                            : "Switch Language",
    "LANGUAGE_MESSAGE"                          : "Language:",
    "LANGUAGE_SUBMIT"                           : "Reload {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Cancel",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "System Default",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "Czech",
    "LOCALE_DE"                                 : "German",
    "LOCALE_EL"                                 : "Greek",
    "LOCALE_EN"                                 : "English",
    "LOCALE_ES"                                 : "Spanish",
    "LOCALE_FI"                                 : "Finnish",
    "LOCALE_FR"                                 : "French",
    "LOCALE_IT"                                 : "Italian",
    "LOCALE_JA"                                 : "Japanese",
    "LOCALE_NB"                                 : "Norwegian",
    "LOCALE_NL"                                 : "Dutch",
    "LOCALE_FA_IR"                              : "Persian-Farsi",
    "LOCALE_PL"                                 : "Polish",
    "LOCALE_PT_BR"                              : "Portuguese, Brazil",
    "LOCALE_PT_PT"                              : "Portuguese",
    "LOCALE_RO"                                 : "Romanian",
    "LOCALE_RU"                                 : "Russian",
    "LOCALE_SK"                                 : "Slovak",
    "LOCALE_SR"                                 : "Serbian",
    "LOCALE_SV"                                 : "Swedish",
    "LOCALE_TR"                                 : "Turkish",
    "LOCALE_ZH_CN"                              : "Chinese, simplified",
    "LOCALE_HU"                                 : "Hungarian",
    "LOCALE_KO"                                 : "Korean",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Time",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progression",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Move selected point<br><kbd class='text'>Shift</kbd> Move by ten units<br><kbd class='text'>Tab</kbd> Switch points",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Increase or decrease steps<br><kbd>←</kbd><kbd>→</kbd> 'Start' or 'End'",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Current Color",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Original Color",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa Format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex Format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa Format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Used {1} time)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Used {1} times)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Jump to Definition",
    "CMD_SHOW_PARAMETER_HINT"                   : "Show Parameter Hint",
    "NO_ARGUMENTS"                              : "<no parameters>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Quick View on Hover",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Recent Projects",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Read more"
});
