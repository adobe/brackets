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
     * 异常
     */

    // 文件IO相关
    "GENERIC_ERROR"                     : "(异常 {0})",
    "NOT_FOUND_ERR"                     : "未能发现该文件.",
    "NOT_READABLE_ERR"                  : "无法读取该文件.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "无法修改此目录.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "你没有权限做此次修改.",
    "FILE_EXISTS_ERR"                   : "当前文件已存在.",
    
    // 项目相关
    "ERROR_LOADING_PROJECT"             : "无法加载此项目.",
    "OPEN_DIALOG_ERROR"                 : "显示[打开文件]对话框出现异常. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "打开此文件夹出现异常 <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "加载目录内容出现异常 <span class='dialog-filename'>{0}</span>. (error {1})",

    // 文件打开保存 error string
    "ERROR_OPENING_FILE_TITLE"          : "打开文件时出现异常",
    "ERROR_OPENING_FILE"                : "程序尝试打开该文件时出现了一个异常,文件:<span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "重新加载文件时出现异常",
    "ERROR_RELOADING_FILE"              : "程序尝试重新加载该文件时出现了一个异常,文件:<span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "保存文件时出现异常",
    "ERROR_SAVING_FILE"                 : "程序尝试保存该文件时出现了一个异常,文件: <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Error renaming file",
    "ERROR_RENAMING_FILE"               : "An error occurred when trying to rename the file <span class='dialog-filename'>{0}</span>. {1}",
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
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "To launch live preview with a server-side file, you need to specify a Base URL for this project.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Error starting up the HTTP server for live development files. Please try again.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Welcome to Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview connects {APP_NAME} to your browser. It launches a preview of your HTML file in the browser, then updates the preview instantly as you edit your code.<br /><br />In this early version of {APP_NAME}, Live Preview only works with <strong>Google Chrome</strong> and updates live as you edit <strong>CSS files</strong>. Changes to HTML or JavaScript files are automatically reloaded when you save.<br /><br />(You'll only see this message once.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "For more information, see <a class=\"clickable-link\" data-href=\"{0}\">Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Connecting\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Initializing\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Disconnect Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview: Click to disconnect (Save file to update)",
    
    "SAVE_CLOSE_TITLE"                  : "Save Changes",
    "SAVE_CLOSE_MESSAGE"                : "Do you want to save the changes you made in the document <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Do you want to save your changes to the following files?",
    "EXT_MODIFIED_TITLE"                : "External Changes",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> has been modified on disk, but also has unsaved changes in {APP_NAME}.<br /><br />Which version do you want to keep?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> has been deleted on disk, but has unsaved changes in {APP_NAME}.<br /><br />Do you want to keep your changes?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "使用正则表达式进行搜索,范例:/re/",
    "WITH"                              : "Con",
    "BUTTON_YES"                        : "Sí",
    "BUTTON_NO"                         : "No",
    "BUTTON_STOP"                       : "停止",

    "OPEN_FILE"                         : "打开文件",
    "CHOOSE_FOLDER"                     : "请选择一个文件夹",

    "RELEASE_NOTES"                     : "发行说明",
    "NO_UPDATE_TITLE"                   : "更新!",
    "NO_UPDATE_MESSAGE"                 : "正在使用最新版本的 {APP_NAME}.",
    
    
    "FIND_IN_FILES_TITLE"               : "for \"{4}\" {5} - {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "in project",
    "FIND_IN_FILES_FILE"                : "file",
    "FIND_IN_FILES_FILES"               : "files",
    "FIND_IN_FILES_MATCH"               : "match",
    "FIND_IN_FILES_MATCHES"             : "matches",
    "FIND_IN_FILES_MORE_THAN"           : "More than ",
    "FIND_IN_FILES_MAX"                 : " (showing the first {0} matches)",
    "FIND_IN_FILES_FILE_PATH"           : "File: <span class='dialog-filename'>{0}</span>",
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
    "PROJECT_LOADING" : "Loading\u2026",
    "UNTITLED" : "Untitled",
    
    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Control",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "空格",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Line {0}, Column {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Click to switch indentation to spaces",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Click to switch indentation to tabs",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Click to change number of spaces used when indenting",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Click to change tab character width",
    "STATUSBAR_SPACES"                      : "Spaces",
    "STATUSBAR_TAB_SIZE"                    : "Tab Size",
    "STATUSBAR_LINE_COUNT"                  : "{0} Lines",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "文件",
    "CMD_FILE_NEW"                        : "新建",
    "CMD_FILE_NEW_FOLDER"                 : "新建目录",
    "CMD_FILE_OPEN"                       : "打开\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "添加一个工作目录",
    "CMD_OPEN_FOLDER"                     : "打开文件夹\u2026",
    "CMD_FILE_CLOSE"                      : "关闭",
    "CMD_FILE_CLOSE_ALL"                  : "关闭所有",
    "CMD_FILE_SAVE"                       : "保存",
    "CMD_FILE_SAVE_ALL"                   : "全部保存",
    "CMD_LIVE_FILE_PREVIEW"               : "在线预览",
    "CMD_LIVE_HIGHLIGHT"                  : "在线高亮代码",
    "CMD_PROJECT_SETTINGS"                : "项目设置\u2026",
    "CMD_FILE_RENAME"                     : "重命名",
    "CMD_QUIT"                            : "退出",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "退出",

    // Edit menu commands
    "EDIT_MENU"                           : "编辑",
    "CMD_UNDO"                            : "撤销",
    "CMD_REDO"                            : "重做",
    "CMD_CUT"                             : "剪切",
    "CMD_COPY"                            : "复制",
    "CMD_PASTE"                           : "粘帖",
    "CMD_SELECT_ALL"                      : "选择全部",
    "CMD_SELECT_LINE"                     : "选中当前行",
    "CMD_FIND"                            : "查找",
    "CMD_FIND_IN_FILES"                   : "在文件中查找",
    "CMD_FIND_IN_SUBTREE"                 : "查找中\u2026",
    "CMD_FIND_NEXT"                       : "查找下一个",
    "CMD_FIND_PREVIOUS"                   : "查找上一个",
    "CMD_REPLACE"                         : "替换",
    "CMD_INDENT"                          : "增加行缩进",
    "CMD_UNINDENT"                        : "减少行缩进",
    "CMD_DUPLICATE"                       : "创建一个副本",
    "CMD_DELETE_LINES"                    : "删除当前行",
    "CMD_COMMENT"                         : "注释当前行",
    "CMD_BLOCK_COMMENT"                   : "注释选中内容",
    "CMD_LINE_UP"                         : "移到下一行",
    "CMD_LINE_DOWN"                       : "移到上一行",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Enable Close Brackets",
    
    // View menu commands
    "VIEW_MENU"                           : "视图",
    "CMD_HIDE_SIDEBAR"                    : "隐藏边栏",
    "CMD_SHOW_SIDEBAR"                    : "显示边栏",
    "CMD_INCREASE_FONT_SIZE"              : "放大编辑器字体",
    "CMD_DECREASE_FONT_SIZE"              : "缩小编辑器字体",
    "CMD_RESTORE_FONT_SIZE"               : "恢复编辑器默认字体",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Sort by Added",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Sort by Name",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Sort by Type",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatic Sort",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "导航",
    "CMD_QUICK_OPEN"                      : "打开快速导航",
    "CMD_GOTO_LINE"                       : "转到某行",
    "CMD_GOTO_DEFINITION"                 : "转到定义",
    "CMD_JSLINT_FIRST_ERROR"              : "转到第一个JSLint错误",
    "CMD_TOGGLE_QUICK_EDIT"               : "快速编辑",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "上一个匹配项",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "下一个匹配项",
    "CMD_NEXT_DOC"                        : "下一个文件",
    "CMD_PREV_DOC"                        : "上一个文件",
    "CMD_SHOW_IN_TREE"                    : "显示文件树",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "调试",
    "CMD_REFRESH_WINDOW"                  : "重新载入 {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "显示开发工具",
    "CMD_RUN_UNIT_TESTS"                  : "运行测试",
    "CMD_JSLINT"                          : "启用JSLint",
    "CMD_SHOW_PERF_DATA"                  : "显示性能数据",
    "CMD_NEW_BRACKETS_WINDOW"             : "新建一个 {APP_NAME} 窗口",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "显示扩展文件夹",
    "CMD_SWITCH_LANGUAGE"                 : "选择语言",
    "CMD_ENABLE_NODE_DEBUGGER"            : "启用Node.JS调试",
    "CMD_LOG_NODE_STATE"                  : "将Node.JS日食显示在控制台中",
    "CMD_RESTART_NODE"                    : "重启Node.JS",

    // Help menu commands
    "HELP_MENU"                           : "帮助",
    "CMD_CHECK_FOR_UPDATE"                : "检查更新",
    "CMD_HOW_TO_USE_BRACKETS"             : "如何使用 {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} 论坛",
    "CMD_RELEASE_NOTES"                   : "发行说明",
    "CMD_REPORT_AN_ISSUE"                 : "报告问题",
    "CMD_TWITTER"                         : "{TWITTER_NAME}的Twitter(推特需要翻墙)",
    "CMD_ABOUT"                           : "关于 {APP_TITLE}",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "关闭窗口",
    "CMD_ABORT_QUIT"                      : "强行退出",

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
    "ABOUT_TEXT_LINE5"                     : "Made with \u2764 and JavaScript by:",
    "ABOUT_TEXT_LINE6"                     : "Lots of people (but we're having trouble loading that data right now).",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "There's a new build of {APP_NAME} available! Click here for details.",
    "UPDATE_AVAILABLE_TITLE"               : "Update Available",
    "UPDATE_MESSAGE"                       : "Hey, there's a new build of {APP_NAME} available. Here are some of the new features:",
    "GET_IT_NOW"                           : "Get it now!",
    "PROJECT_SETTINGS_TITLE"               : "Project Settings for: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Live Preview Base URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(to use a local server, specify url)",
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
