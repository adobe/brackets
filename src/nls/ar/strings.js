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
    "GENERIC_ERROR"                     : "(خطأ {0})",
    "NOT_FOUND_ERR"                     : "لا يمكن العثور على الملف",
    "NOT_READABLE_ERR"                  : "لا يمكن قراءة الملف",
    "NO_MODIFICATION_ALLOWED_ERR"       : "لا يمكن أن يتم تعديل المجلد",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "لم يكن لديك إذن لإجراء تعديلات",
    "FILE_EXISTS_ERR"                   : "الملف موجود مسبقا",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "يمكن الخطأ لا يتم تحميل الملف",
    "OPEN_DIALOG_ERROR"                 : "خطأ (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "يمكن الخطأ لا يتم تحميل المل <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "يمكن الخطأ لا يتم تحميل المل <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "لا يمكن فتح ملف خطأ",
    "ERROR_OPENING_FILE"                : "لا يمكن فتح ملف خطأ <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "لا يمكن تحميل التغييرات من محرك الأقراص",
    "ERROR_RELOADING_FILE"              : "لا يمكن تحميل التغييرات من محرك الأقراص <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "لا يمكن حفظ الملف",
    "ERROR_SAVING_FILE"                 : "لا يمكن حفظ الملف <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "لا يمكن إعادة تسمية الملف",
    "ERROR_RENAMING_FILE"               : "لا يمكن إعادة تسمية الملف <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "اسم الملف سيئ",
    "INVALID_FILENAME_MESSAGE"          : "يمكن اسم الملف لم يكن لديك ما يلي: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "الملف موجود مسبقا <span class='dialog-filename'>{0}</span>",
    "ERROR_CREATING_FILE_TITLE"         : "يمكن إنشاء ملف خطأ لا",
    "ERROR_CREATING_FILE"               : "يمكن إنشاء ملف خطأ لا <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} doesn't run in browsers yet.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} is built in HTML, but right now it runs as a desktop app so you can use it to edit local files. Please use the application shell in the <b>github.com/adobe/brackets-shell</b> repo to run {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "لا يمكن قراءة الملفات",
    "ERROR_MAX_FILES"                   : "The maximum number of files have been indexed. Actions that look up files in the index may function incorrectly.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "لا يمكن فتح الإنترنت",
    "ERROR_CANT_FIND_CHROME"            : "لا يمكن تشغيل كروم google chrome ",
    "ERROR_LAUNCHING_BROWSER"           : "لا يمكن فتح الإنترنت (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Live Preview Error",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "الاتصال بالإنترنت",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "In order for Live Preview to connect, Chrome needs to be relaunched with remote debugging enabled.<br /><br />Would you like to relaunch Chrome and enable remote debugging?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Open an HTML file in order to launch live preview.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "To launch live preview with a server-side file, you need to specify a Base URL for this project.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Welcome to Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview connects {APP_NAME} to your browser. It launches a preview of your HTML file in the browser, then updates the preview instantly as you edit your code.<br /><br />In this early version of {APP_NAME}, Live Preview only works with <strong>Google Chrome</strong> and updates live as you edit <strong>CSS files</strong>. Changes to HTML or JavaScript files are automatically reloaded when you save.<br /><br />(You'll only see this message once.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "For more information, see <a class=\"clickable-link\" data-href=\"{0}\">Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Connecting\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Initializing\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Disconnect Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview: Click to disconnect (Save file to update)",
    
    "SAVE_CLOSE_TITLE"                  : "حفظ التغييرات",
    "SAVE_CLOSE_MESSAGE"                : "هل تريد حفظ الملف <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "هل تريد حفظ الملف?",
    "EXT_MODIFIED_TITLE"                : "التغييرات الخارجية",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> has been modified on disk, but also has unsaved changes in {APP_NAME}.<br /><br />Which version do you want to keep?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> has been deleted on disk, but has unsaved changes in {APP_NAME}.<br /><br />Do you want to keep your changes?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Use /re/ syntax for regexp search",
    "WITH"                              : "مع",
    "BUTTON_YES"                        : "نعم",
    "BUTTON_NO"                         : "لا",
    "BUTTON_STOP"                       : "توقف",

    "OPEN_FILE"                         : "فتح ملف",
    "CHOOSE_FOLDER"                     : "اختيار مجلد",

    "RELEASE_NOTES"                     : "Release Notes",
    "NO_UPDATE_TITLE"                   : "كنت حتى الآن!",
    "NO_UPDATE_MESSAGE"                 : "كنت تقوم بتشغيل الإصدار الأحدث{APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "for \"{4}\" {5} - {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "في <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "في المشروع",
    "FIND_IN_FILES_FILE"                : "ملف",
    "FIND_IN_FILES_FILES"               : "ملفات",
    "FIND_IN_FILES_MATCH"               : "مباراة",
    "FIND_IN_FILES_MATCHES"             : "مباريات",
    "FIND_IN_FILES_MORE_THAN"           : "أكثر من ",
    "FIND_IN_FILES_MAX"                 : " (showing the first {0} matches)",
    "FIND_IN_FILES_FILE_PATH"           : "ملف: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "line:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Error getting update info",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "There was a problem getting the latest update information from the server. Please make sure you are connected to the internet and try again.",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "تغيير اللغة",
    "LANGUAGE_MESSAGE"                  : "حدد اللغة:",
    "LANGUAGE_SUBMIT"                   : "تحديث {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "إلغاء",

    /**
     * ProjectManager
     */

    "UNTITLED" : "لا يوجد اسم",

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
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Click to switch indentation to spaces",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Click to switch indentation to tabs",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Click to change number of spaces used when indenting",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Click to change tab character width",
    "STATUSBAR_SPACES"                      : "المساحات",
    "STATUSBAR_TAB_SIZE"                    : "Tab Size",
    "STATUSBAR_LINE_COUNT"                  : "{0} Lines",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "File",
    "CMD_FILE_NEW"                        : "New File",
    "CMD_FILE_NEW_FOLDER"                 : "New Folder",
    "CMD_FILE_OPEN"                       : "Open\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Add To Working Set",
    "CMD_OPEN_FOLDER"                     : "Open Folder\u2026",
    "CMD_FILE_CLOSE"                      : "Close",
    "CMD_FILE_CLOSE_ALL"                  : "Close All",
    "CMD_FILE_SAVE"                       : "Save",
    "CMD_FILE_SAVE_ALL"                   : "Save All",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_LIVE_HIGHLIGHT"                  : "Live Highlight",
    "CMD_PROJECT_SETTINGS"                : "Project Settings\u2026",
    "CMD_FILE_RENAME"                     : "Rename",
    "CMD_QUIT"                            : "Quit",

    // Edit menu commands
    "EDIT_MENU"                           : "Edit",
    "CMD_SELECT_ALL"                      : "Select All",
    "CMD_SELECT_LINE"                     : "Select Line",
    "CMD_FIND"                            : "Find",
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
     
    // View menu commands
    "VIEW_MENU"                           : "View",
    "CMD_HIDE_SIDEBAR"                    : "Hide Sidebar",
    "CMD_SHOW_SIDEBAR"                    : "Show Sidebar",
    "CMD_INCREASE_FONT_SIZE"              : "Increase Font Size",
    "CMD_DECREASE_FONT_SIZE"              : "Decrease Font Size",
    "CMD_RESTORE_FONT_SIZE"               : "Restore Font Size",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Sort by Added",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Sort by Name",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Sort by Type",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatic Sort",

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
    "CMD_SHOW_IN_TREE"                    : "Show in File Tree",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Debug",
    "CMD_REFRESH_WINDOW"                  : "Reload {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "Show Developer Tools",
    "CMD_RUN_UNIT_TESTS"                  : "Run Tests",
    "CMD_JSLINT"                          : "Enable JSLint",
    "CMD_SHOW_PERF_DATA"                  : "Show Performance Data",
    "CMD_NEW_BRACKETS_WINDOW"             : "New {APP_NAME} Window",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Show Extensions Folder",
    "CMD_SWITCH_LANGUAGE"                 : "Switch Language",

    // Help menu commands
    "HELP_MENU"                           : "Help",
    "CMD_CHECK_FOR_UPDATE"                : "Check for Updates",
    "CMD_HOW_TO_USE_BRACKETS"             : "How to Use {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} Forum",
    "CMD_RELEASE_NOTES"                   : "Release Notes",
    "CMD_REPORT_AN_ISSUE"                 : "Report an Issue",
    "CMD_TWITTER"                         : "{TWITTER_NAME} on Twitter",
    "CMD_ABOUT"                           : "About {APP_TITLE}",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Close Window",
    "CMD_ABORT_QUIT"                      : "Abort Quit",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimental build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "JSLINT_ERRORS"                        : "JSLint Errors",
    "JSLINT_ERROR_INFORMATION"             : "1 JSLint Error",
    "JSLINT_ERRORS_INFORMATION"            : "{0} JSLint Errors",
    "JSLINT_NO_ERRORS"                     : "No JSLint errors - good job!",
    "JSLINT_DISABLED"                      : "JSLint disabled or not working for the current file",
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
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Notices, terms and conditions pertaining to third party software are located at <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> and incorporated by reference herein.",
    "ABOUT_TEXT_LINE4"                     : "Documentation and source at <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "There's a new build of {APP_NAME} available! Click here for details.",
    "UPDATE_AVAILABLE_TITLE"               : "Update Available",
    "UPDATE_MESSAGE"                       : "Hey, there's a new build of {APP_NAME} available. Here are some of the new features:",
    "GET_IT_NOW"                           : "Get it now!",
    "PROJECT_SETTINGS_TITLE"               : "Project Settings for: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Live Preview Base URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(leave blank for file url)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "The {0} protocol isn't supported by Live Preview&mdash;please use http: or https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "The base URL can't contain search parameters like \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "The base URL can't contain hashes like \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Special characters like '{0}' must be %-encoded.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Unknown error parsing Base URL",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Current Color",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Original Color",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa Format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex Format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa Format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Used {1} time)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Used {1} times)"
});
