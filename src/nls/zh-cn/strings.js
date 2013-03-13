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
    "ERROR_RENAMING_FILE_TITLE"         : "重命名文件失败",
    "ERROR_RENAMING_FILE"               : "为该文件重命名时出现异常,文件: <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "无效文件名",
    "INVALID_FILENAME_MESSAGE"          : "文件名不得包含: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "该文件 <span class='dialog-filename'>{0}</span> 已经存在.",
    "ERROR_CREATING_FILE_TITLE"         : "新建文件异常",
    "ERROR_CREATING_FILE"               : "试图创建该文件时出现错误,文件: <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "囧! {APP_NAME} 尝试在浏览器中运行失败.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} 是内置HTML, 现在作为一个桌面程序运行你可以用它修改本地文件. 可以前往此处下载系统对应的版本<b>github.com/adobe/brackets-shell</b>,然后重新运行 {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "索引文件错误",
    "ERROR_MAX_FILES"                   : "索引的文件过多,请减少索引的文件.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "启动浏览器失败",
    "ERROR_CANT_FIND_CHROME"            : "Chrome浏览器离家出走了,没有找到Google Chrome浏览器,请确定安装了?",
    "ERROR_LAUNCHING_BROWSER"           : "启动浏览器的时候出现一个错误. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "实时预览异常",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "连接至浏览器",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "为了应用实时预览,Chrome需要重启开始启用远程调试功能.<br /><br />你确定重新启动Chrome浏览器,并且启用远程调试?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "打开并实时预览一个HTML文件.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "实时预览需要指定一个预览用的URL地址.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "尝试启动HTTP服务器时出现错误,请再试一次.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "欢迎来到实时预览!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "{APP_NAME}已通过实时预览连接至你的浏览器. It launches a preview of your HTML file in the browser, then updates the preview instantly as you edit your code.<br /><br />In this early version of {APP_NAME}, Live Preview only works with <strong>Google Chrome</strong> and updates live as you edit <strong>CSS files</strong>. Changes to HTML or JavaScript files are automatically reloaded when you save.<br /><br />(You'll only see this message once.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "For more information, see <a class=\"clickable-link\" data-href=\"{0}\">Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "实时预览",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "实时预览: 连接中...\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "实时预览: 初始化...\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "断开实时预览",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "实时预览: 点击断开 (保存文件)",
    
    "SAVE_CLOSE_TITLE"                  : "保存选择",
    "SAVE_CLOSE_MESSAGE"                : "保存文件中所做的修改 <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "是否保存以下文件的修改?",
    "EXT_MODIFIED_TITLE"                : "外部文件发生变化",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> 已产生了外部修改,但是你有未保存的内容 {APP_NAME}.<br /><br />你准备选哪一个?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> 已被删除,但是你有未保存的内容 {APP_NAME}.<br /><br />是否保存你的修改?",
    
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
    
    
    "FIND_IN_FILES_TITLE"               : "于 \"{4}\" {5} - {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "在 <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "在项目",
    "FIND_IN_FILES_FILE"                : "文件",
    "FIND_IN_FILES_FILES"               : "多个文件",
    "FIND_IN_FILES_MATCH"               : "匹配一个",
    "FIND_IN_FILES_MATCHES"             : "匹配多个",
    "FIND_IN_FILES_MORE_THAN"           : "以上 ",
    "FIND_IN_FILES_MAX"                 : " (共计 {0} 个匹配)",
    "FIND_IN_FILES_FILE_PATH"           : "文件: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "行:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "获取更新信息失败",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "无法从服务器获取最新的信息.请确认你的电脑已经连接互联网,然后再次尝试重新获取!",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "选择语言",
    "LANGUAGE_MESSAGE"                  : "请从列表中选择所需的语言:",
    "LANGUAGE_SUBMIT"                   : "重新加载 {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "取消",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING" : "载入\u2026",
    "UNTITLED" : "无标题",
    
    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Control",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "空格",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "行 {0}, 列 {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "选择缩进为空格",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "选择缩进为TAB",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "修改缩进空格长度",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "修改TAB长度",
    "STATUSBAR_SPACES"                      : "空格长度",
    "STATUSBAR_TAB_SIZE"                    : "Tab长度",
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
    "CMD_SCROLL_LINE_UP"                  : "向上滚动",
    "CMD_SCROLL_LINE_DOWN"                : "向下滚动",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "根据添加时间排序",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "根据名称排序",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "根据类型排序",
    "CMD_SORT_WORKINGSET_AUTO"            : "自动排序",

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
    "JSLINT_ERRORS"                        : "JSLint错误",
    "JSLINT_ERROR_INFORMATION"             : "1个JSLint错误",
    "JSLINT_ERRORS_INFORMATION"            : "{0}个JSLint错误",
    "JSLINT_NO_ERRORS"                     : "成功 - 骚年加油!",
    "JSLINT_DISABLED"                      : "JSLint已被禁用或者无法工作在此文件.",
    "SEARCH_RESULTS"                       : "查询结果",
    "OK"                                   : "确定",
    "DONT_SAVE"                            : "放弃保存",
    "SAVE"                                 : "保存",
    "CANCEL"                               : "取消",
    "RELOAD_FROM_DISK"                     : "重新从硬盘中加载",
    "KEEP_CHANGES_IN_EDITOR"               : "选择编辑器中修改的内容",
    "CLOSE_DONT_SAVE"                      : "放弃保存并关闭",
    "RELAUNCH_CHROME"                      : "重新运行Chrome",
    "ABOUT"                                : "关于",
    "APP_NAME"                             : "Brackets",
    "CLOSE"                                : "关闭",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "关于第三方软件的条款,条例,声明<a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a>以此作为参考.",
    "ABOUT_TEXT_LINE4"                     : "文档与源码在 <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "参与设计的有很多人是把 \u2764 跟 JavaScript by:",
    "ABOUT_TEXT_LINE6"                     : "有很多很多相当多的人,我这里就不给你看了,可以去Github上看吧.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "有一个新的 {APP_NAME}!点此查看详情.",
    "UPDATE_AVAILABLE_TITLE"               : "可以更新",
    "UPDATE_MESSAGE"                       : "有一个新的 {APP_NAME} .增加了一些功能:",
    "GET_IT_NOW"                           : "现在获取!",
    "PROJECT_SETTINGS_TITLE"               : "项目设置: {0}",
    "PROJECT_SETTING_BASE_URL"             : "在线预览基本地址",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(使用本地服务器,并且指定一个URL)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "实时预览不支持此协议 {0} &mdash;请使用 http: 或 https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "地址不能包含搜索参数如 \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "地址不能包含哈希如 \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "特殊字符 '{0}' 必须 %-encoded.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "解析地址错误,请确认地址格式",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "当前颜色",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "之前的颜色",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa格式",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex格式",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa格式",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (耗时: {1} )",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (耗时: {1} )"
});
