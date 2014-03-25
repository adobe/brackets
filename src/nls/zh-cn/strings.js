/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR"                     : "(错误 {0})",
    "NOT_FOUND_ERR"                     : "无法找到该文件。",
    "NOT_READABLE_ERR"                  : "无法读取该文件。",
    "NO_MODIFICATION_ALLOWED_ERR"       : "无法修改此目录。",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "你没有做出修改的权限。",
    "CONTENTS_MODIFIED_ERR"             : "该文件已在 {APP_NAME} 外被修改。",
    "FILE_EXISTS_ERR"                   : "文件/目录名已存在。",
    "FILE"                              : "文件",
    "DIRECTORY"                         : "目录",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "加载项目时出现错误",
    "OPEN_DIALOG_ERROR"                 : "显示[打开文件]对话框出现错误。(错误 {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "打开目录 <span class='dialog-filename'>{0}</span> 时出现错误。 (错误 {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "读取目录 <span class='dialog-filename'>{0}</span> 的内容时出现错误。 (错误 {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "打开文件时出现错误",
    "ERROR_OPENING_FILE"                : "试图打开该文件 <span class='dialog-filename'>{0}</span> 时出现了一个错误。 {1}",
    "ERROR_OPENING_FILES"               : "试图打开以下文件时出现错误：",
    "ERROR_RELOADING_FILE_TITLE"        : "从磁盘重新加载文件时出现错误",
    "ERROR_RELOADING_FILE"              : "试图重新加载该文件 <span class='dialog-filename'>{0}</span> 时出现了错误。 {1}",
    "ERROR_SAVING_FILE_TITLE"           : "保存文件时出现错误",
    "ERROR_SAVING_FILE"                 : "试图保存该文件 <span class='dialog-filename'>{0}</span> 时出现了错误。 {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "重命名文件时出现错误",
    "ERROR_RENAMING_FILE"               : "为该文件 <span class='dialog-filename'>{0}</span> 重命名时出现了错误。 {1}",
    "ERROR_DELETING_FILE_TITLE"         : "删除文件时出现错误",
    "ERROR_DELETING_FILE"               : "试图删除该文件 <span class='dialog-filename'>{0}</span> 时出现了错误。 {1}",
    "INVALID_FILENAME_TITLE"            : "无效文件名: {0}",
    "INVALID_FILENAME_MESSAGE"          : "文件名不得包含以下字符及使用系统保留字: {0} ",
    "FILE_ALREADY_EXISTS"               : "该文件 {0} <span class='dialog-filename'>{1}</span> 已经存在。",
    "ERROR_CREATING_FILE_TITLE"         : "创建文件 {0} 时出现错误",
    "ERROR_CREATING_FILE"               : "试图创建 {0} <span class='dialog-filename'>{1}</span> 时出现错误。 {2}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "读取配置文件时出现错误",
    "ERROR_PREFS_CORRUPT"               : "你的配置文件不是合法的 JSON 格式，将打开此文件方便你修正格式错误。你需要重新启动 {APP_NAME} 让改动生效。",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "囧! {APP_NAME} 暂时无法运行在浏览器窗口中。",
    "ERROR_IN_BROWSER"                  : "虽然 {APP_NAME} 使用 HTML 构建，但是它需要作为桌面程序运行，以便修改本地文件。请前往 <b>github.com/adobe/brackets-shell</b> 下载对应系统的应用程序外壳来运行 {APP_NAME}。",
    
    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "索引文件时出现错误",
    "ERROR_MAX_FILES"                   : "已达到最大索引文件数，在索引中查看文件的功能可能不会正常工作。",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "启动浏览器时出现错误",
    "ERROR_CANT_FIND_CHROME"            : "没有找到 Google Chrome 浏览器, 请确定您已安装了该浏览器。",
    "ERROR_LAUNCHING_BROWSER"           : "启动浏览器时出现一个错误。 (错误 {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "实时预览出现错误",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "正在连接浏览器",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "要使用实时预览功能，需要重启 Chrome 浏览器并打开远程调试功能。<br /><br />你确定重新启动 Chrome 浏览器，并且打开远程调试功能吗？",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "无法加载实时预览页面。",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "请打开一个 HTML 文件，或者确认项目中包含 index.html 文件以启动实时预览。",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "要使用服务端文件开启实时预览, 您需要为此项目指定一个根 URL。",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "启动实时预览的 HTTP 服务器时出现错误, 请重试。",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "欢迎使用实时预览！",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "实时预览功能将 {APP_NAME} 连接到你的浏览器上。它将会在浏览器中生成 HTML 文件预览, 并在你修改代码后，实时更新浏览器中的预览页面。<br /><br /> 在早期版本的 {APP_NAME} 中，实时预览只能运行于 <strong>Google Chrome</strong> 浏览器中，在你编辑 <strong>CSS 和 HTML 文件</strong> 时实时更新。如果你保存了 JavaScript 文件, 本功能将在浏览器中帮你重新载入。<br /><br />(此消息只会出现一次。)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "更多信息, 请参考<a href='{0}' title='{0}'>Troubleshooting Live Preview connection errors（实时预览连接错误的疑难解答）</a>。",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "实时预览",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "实时预览: 正在连接\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "实时预览: 正在初始化\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "断开实时预览",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "实时预览 (保存文件并刷新)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "实时预览 (出现语法错误，暂未更新)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "由于已在浏览器中打开开发人员工具, 实时预览已关闭",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "由于浏览器中的相应页面已关闭, 实时预览已关闭",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "由于浏览器打开了一个不属于本项目的页面, 实时预览已关闭",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "未知原因 ({0}) 导致实时预览关闭",
    
    "SAVE_CLOSE_TITLE"                  : "保存改动",
    "SAVE_CLOSE_MESSAGE"                : "保存文件 <span class='dialog-filename'>{0}</span> 中所做的改动吗？",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "是否保存以下文件的改动？",
    "EXT_MODIFIED_TITLE"                : "文件在外部发生变化",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "删除确认",
    "CONFIRM_FOLDER_DELETE"             : "确认要删除文件夹 <span class='dialog-filename'>{0}</span> 吗？",
    "FILE_DELETED_TITLE"                : "文件已删除",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> 已在程序外部被修改，<br /><br /> 需要保存并覆盖这些改动吗？",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> 已在程序外部被修改, 但是 {APP_NAME} 中还有尚未保存的内容。<br /><br />你需要保留哪个版本？",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> 已被删除, 但是 {APP_NAME} 还有尚未保存的内容。<br /><br />是否保存你的修改？",

    // Generic dialog/button labels
    "OK"                                : "确认",
    "CANCEL"                            : "取消",
    "DONT_SAVE"                         : "不要保存",
    "SAVE"                              : "保存",
    "SAVE_AS"                           : "另存为\u2026",
    "SAVE_AND_OVERWRITE"                : "保存并覆盖",
    "DELETE"                            : "删除",
    "BUTTON_YES"                        : "是",
    "BUTTON_NO"                         : "否",
    
    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} 个匹配项",
    "FIND_RESULT_COUNT_SINGLE"          : "1 个匹配项",
    "FIND_NO_RESULTS"                   : "未找到匹配项",
    "REPLACE_PLACEHOLDER"               : "替换为\u2026",
    "BUTTON_REPLACE_ALL"                : "全部\u2026",
    "BUTTON_REPLACE"                    : "替换",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "下一个匹配项",
    "BUTTON_PREV_HINT"                  : "上一个匹配项",
    "BUTTON_CASESENSITIVE_HINT"         : "区分大小写",
    "BUTTON_REGEXP_HINT"                : "正则表达式",

    "OPEN_FILE"                         : "打开文件",
    "SAVE_FILE_AS"                      : "保存文件",
    "CHOOSE_FOLDER"                     : "请选择一个文件夹",

    "RELEASE_NOTES"                     : "发布说明",
    "NO_UPDATE_TITLE"                   : "已经是最新版本！",
    "NO_UPDATE_MESSAGE"                 : "你所使用的是最新版本的 {APP_NAME}。",

    // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1"          : "替换 \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" 为 \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    // Find in Files
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" 已找到",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} 于 {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "在 <span class='dialog-filename'>{0}</span> 中",
    "FIND_IN_FILES_NO_SCOPE"            : "在项目中",
    "FIND_IN_FILES_FILE"                : "个文件",
    "FIND_IN_FILES_FILES"               : "个文件",
    "FIND_IN_FILES_MATCH"               : "个匹配",
    "FIND_IN_FILES_MATCHES"             : "个匹配",
    "FIND_IN_FILES_MORE_THAN"           : "超过 ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "按下 Ctrl/Cmd 键并点击，以展开/折叠全部结果",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "获取更新信息失败",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "无法从服务器获取最新的更新信息。请确认你的电脑已经连接互联网, 然后再次尝试！",
    
    // File exclusion filters
    "NO_FILE_FILTER"                    : "排除搜索文件\u2026",
    "EDIT_FILE_FILTER"                  : "编辑\u2026",
    "FILE_FILTER_DIALOG"                : "编辑过滤规则",
    "FILE_FILTER_INSTRUCTIONS"          : "根据下列匹配规则排除文件或文件夹, 匹配规则可以是文件名或其子串, 或使用 <a href='{0}' title='{0}'>globs（通配符）</a>，每行输入一条规则。",
    "FILE_FILTER_LIST_PREFIX"           : "除了",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "及另外 {0} 类",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "当前光标位置没有提供快速编辑功能",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "CSS 快速编辑：请将光标放在 class 名上",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "CSS 快速编辑: 请将光标放在 id 名上",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "CSS 快速编辑: 请将光标放在标签名、class 名或者 id 名上",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "CSS 时间函数快速编辑：语法错误",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "JS 快速编辑: 请将光标放在函数名上",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "当前光标位置没有提供快速文档功能",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "加载中\u2026",
    "UNTITLED"          : "无标题",
    "WORKING_FILES"     : "工作区文件",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "空格",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "行 {0}, 列 {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 已选中 {0} 列",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 已选中 {0} 列",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 已选中 {0} 行",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 已选中 {0} 行",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 已选中 {0} 块区域",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "点击将缩进切换为空格键",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "点击将缩进切换为 Tab 键",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "点击修改空格键缩进的长度",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "点击修改 Tab 键缩进的长度",
    "STATUSBAR_SPACES"                      : "空格长度:",
    "STATUSBAR_TAB_SIZE"                    : "Tab 长度:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} 行",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} 行",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "已禁用扩展",
    "STATUSBAR_INSERT"                      : "插入",
    "STATUSBAR_OVERWRITE"                   : "改写",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} 个问题",
    "SINGLE_ERROR"                          : "1 个 {0} 问题",
    "MULTIPLE_ERRORS"                       : "{1} 个 {0} 问题",
    "NO_ERRORS"                             : "未发现 {0} 问题 - 干的漂亮!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "未发现问题 - 干的漂亮!",
    "LINT_DISABLED"                         : "JJSLint 已禁用或者无法在此文件上工作",
    "NO_LINT_AVAILABLE"                     : "{0} 没有可用检查器",
    "NOTHING_TO_LINT"                       : "没有可检查的文件",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "文件",
    "CMD_FILE_NEW_UNTITLED"               : "新建",
    "CMD_FILE_NEW"                        : "新建文件",
    "CMD_FILE_NEW_FOLDER"                 : "新建文件夹",
    "CMD_FILE_OPEN"                       : "打开\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "添加至工作集",
    "CMD_OPEN_DROPPED_FILES"              : "打开拖放的文件",
    "CMD_OPEN_FOLDER"                     : "打开目录\u2026",
    "CMD_FILE_CLOSE"                      : "关闭",
    "CMD_FILE_CLOSE_ALL"                  : "全部关闭",
    "CMD_FILE_CLOSE_LIST"                 : "关闭列表中的文件",
    "CMD_FILE_CLOSE_OTHERS"               : "关闭其他文件",
    "CMD_FILE_CLOSE_ABOVE"                : "关闭上面的其他文件",
    "CMD_FILE_CLOSE_BELOW"                : "关闭下面的其他文件",
    "CMD_FILE_SAVE"                       : "保存",
    "CMD_FILE_SAVE_ALL"                   : "全部保存",
    "CMD_FILE_SAVE_AS"                    : "另存为\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "实时预览",
    "CMD_PROJECT_SETTINGS"                : "项目设置\u2026",
    "CMD_FILE_RENAME"                     : "重命名",
    "CMD_FILE_DELETE"                     : "删除",
    "CMD_INSTALL_EXTENSION"               : "安装扩展\u2026",
    "CMD_EXTENSION_MANAGER"               : "扩展管理器\u2026",
    "CMD_FILE_REFRESH"                    : "刷新文件树",
    "CMD_QUIT"                            : "退出",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "退出",

    // Edit menu commands
    "EDIT_MENU"                           : "编辑",
    "CMD_UNDO"                            : "撤销",
    "CMD_REDO"                            : "重做",
    "CMD_CUT"                             : "剪切",
    "CMD_COPY"                            : "复制",
    "CMD_PASTE"                           : "粘贴",
    "CMD_SELECT_ALL"                      : "全选",
    "CMD_SELECT_LINE"                     : "选中当前行",
    "CMD_SPLIT_SEL_INTO_LINES"            : "将选中内容拆分至多行",
    "CMD_ADD_NEXT_LINE_TO_SEL"            : "将下一行添加至选中区域",
    "CMD_ADD_PREV_LINE_TO_SEL"            : "将上一行添加至选中区域",
    "CMD_FIND"                            : "查找",
    "CMD_FIND_FIELD_PLACEHOLDER"          : "查找\u2026",
    "CMD_FIND_IN_FILES"                   : "在文件中查找",
    "CMD_FIND_IN_SUBTREE"                 : "在该位置查找\u2026",
    "CMD_FIND_NEXT"                       : "查找下一个",
    "CMD_FIND_PREVIOUS"                   : "查找上一个",
    "CMD_FIND_ALL_AND_SELECT"             : "查找全部并选中",
    "CMD_ADD_NEXT_MATCH"                  : "将下一项匹配添加至选中区域",
    "CMD_SKIP_CURRENT_MATCH"              : "跳过并添加下一项匹配",
    "CMD_REPLACE"                         : "替换",
    "CMD_INDENT"                          : "增加缩进",
    "CMD_UNINDENT"                        : "减少缩进",
    "CMD_DUPLICATE"                       : "创建副本",
    "CMD_DELETE_LINES"                    : "删除当前行",
    "CMD_COMMENT"                         : "打开/关闭行注释",
    "CMD_BLOCK_COMMENT"                   : "打开/关闭块注释",
    "CMD_LINE_UP"                         : "向上移一行",
    "CMD_LINE_DOWN"                       : "向下移一行",
    "CMD_OPEN_LINE_ABOVE"                 : "在上方插入新行",
    "CMD_OPEN_LINE_BELOW"                 : "在下方插入新行",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "自动补全括号",
    "CMD_SHOW_CODE_HINTS"                 : "显示代码提示",
    
    // View menu commands
    "VIEW_MENU"                           : "查看",
    "CMD_HIDE_SIDEBAR"                    : "隐藏侧边栏",
    "CMD_SHOW_SIDEBAR"                    : "显示侧边栏",
    "CMD_INCREASE_FONT_SIZE"              : "增大字号",
    "CMD_DECREASE_FONT_SIZE"              : "缩小字号",
    "CMD_RESTORE_FONT_SIZE"               : "恢复字体默认大小",
    "CMD_SCROLL_LINE_UP"                  : "向上滚动",
    "CMD_SCROLL_LINE_DOWN"                : "向下滚动",
    "CMD_TOGGLE_LINE_NUMBERS"             : "显示行号",
    "CMD_TOGGLE_ACTIVE_LINE"              : "高亮当前行",
    "CMD_TOGGLE_WORD_WRAP"                : "自动换行",
    "CMD_LIVE_HIGHLIGHT"                  : "实时预览高亮",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "保存时检查文件",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "根据添加时间排序",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "根据名称排序",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "根据类型排序",
    "CMD_SORT_WORKINGSET_AUTO"            : "自动排序",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "导航",
    "CMD_QUICK_OPEN"                      : "打开快速导航",
    "CMD_GOTO_LINE"                       : "转到某行",
    "CMD_GOTO_DEFINITION"                 : "转到定义",
    "CMD_GOTO_FIRST_PROBLEM"              : "转到第一个错误/警告",
    "CMD_TOGGLE_QUICK_EDIT"               : "快速编辑",
    "CMD_TOGGLE_QUICK_DOCS"               : "快速文档",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "上一个匹配项",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "下一个匹配项",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "新建 CSS 规则",
    "CMD_NEXT_DOC"                        : "下一个文件",
    "CMD_PREV_DOC"                        : "上一个文件",
    "CMD_SHOW_IN_TREE"                    : "在侧边栏显示",
    "CMD_SHOW_IN_EXPLORER"                : "在资源管理器中显示",
    "CMD_SHOW_IN_FINDER"                  : "在 Finder 中显示",
    "CMD_SHOW_IN_OS"                      : "打开文件所在目录",
    
    // Help menu commands
    "HELP_MENU"                           : "帮助",
    "CMD_CHECK_FOR_UPDATE"                : "检查更新",
    "CMD_HOW_TO_USE_BRACKETS"             : "如何使用 {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME} 的支持",
    "CMD_RELEASE_NOTES"                   : "发布说明",
    "CMD_GET_INVOLVED"                    : "参与 Brackets 开发",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "显示扩展目录",
    "CMD_TWITTER"                         : "{TWITTER_NAME} 的 Twitter (推特需要翻墙)",
    "CMD_ABOUT"                           : "关于 {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "打开配置文件",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "体验版",
    "DEVELOPMENT_BUILD"                    : "开发版",
    "RELOAD_FROM_DISK"                     : "从磁盘中重新加载",
    "KEEP_CHANGES_IN_EDITOR"               : "保留编辑器中的修改",
    "CLOSE_DONT_SAVE"                      : "关闭（不保存）",
    "RELAUNCH_CHROME"                      : "重新运行 Chrome",
    "ABOUT"                                : "关于",
    "CLOSE"                                : "关闭",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "关于第三方软件的条款，条例和声明，请参考 <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a>。",
    "ABOUT_TEXT_LINE4"                     : "文档与源码位于 <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "由 \u2764 和 JavaScript 打造，并有以下用户的贡献和参与：",
    "ABOUT_TEXT_LINE6"                     : "有相当多的人参与其中，但现在有一些问题导致无法加载，你可以在GitHub上看到。",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "有一个新版本的 {APP_NAME}！点此查看详情。",
    "UPDATE_AVAILABLE_TITLE"               : "可用的更新",
    "UPDATE_MESSAGE"                       : "有一个新版本的 {APP_NAME}。增加了一些功能：",
    "GET_IT_NOW"                           : "马上获取！",
    "PROJECT_SETTINGS_TITLE"               : "项目设置：{0}",
    "PROJECT_SETTING_BASE_URL"             : "实时预览的根 URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "使用本地服务器需要指定一个 URL。例如: http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "实时预览不支持此协议 {0} &mdash; 请使用 http: 或 https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "地址不能包含查询参数，如 \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "地址不能包含#（hash）符号，如 \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "特殊字符 '{0}' 必须是以 % 开头编码的字符。",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "根 URL 解析时出现未知错误",
    
    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "新 CSS 规则",
    
    // Extension Management strings
    "INSTALL"                              : "安装",
    "UPDATE"                               : "升级",
    "REMOVE"                               : "移除",
    "OVERWRITE"                            : "覆盖",
    "CANT_REMOVE_DEV"                      : "\"dev\" 文件夹中的扩展必须手动删除。",
    "CANT_UPDATE"                          : "升级后的版本与当前版本的 {APP_NAME} 不兼容。",
    "CANT_UPDATE_DEV"                      : " \"dev\" 文件夹中的扩展无法自动更新。",
    "INSTALL_EXTENSION_TITLE"              : "安装扩展",
    "UPDATE_EXTENSION_TITLE"               : "升级扩展",
    "INSTALL_EXTENSION_LABEL"              : "扩展包的 URL",
    "INSTALL_EXTENSION_HINT"               : "填写扩展包的 zip 文件或 GitHub 仓库的链接地址",
    "INSTALLING_FROM"                      : "正在从 {0} 安装扩展\u2026",
    "INSTALL_SUCCEEDED"                    : "安装成功！",
    "INSTALL_FAILED"                       : "安装失败。",
    "CANCELING_INSTALL"                    : "正在取消\u2026",
    "CANCELING_HUNG"                       : "取消安装耗时较长，可能出现了内部错误。",
    "INSTALL_CANCELED"                     : "安装已取消。",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "下载的内容不是一个有效的 ZIP 文件。",
    "INVALID_PACKAGE_JSON"                 : "扩展包中的 package.json 文件无效。 (错误: {0})",
    "MISSING_PACKAGE_NAME"                 : "扩展包中的 package.json 文件未指定扩展包名称。",
    "BAD_PACKAGE_NAME"                     : "扩展包名 {0} 无效。",
    "MISSING_PACKAGE_VERSION"              : "扩展包中的 package.json 文件未指定扩展包版本。",
    "INVALID_VERSION_NUMBER"               : "扩展包版本号 ({0}) 无效。",
    "INVALID_BRACKETS_VERSION"             : "{APP_NAME} 兼容性字串 ({0}) 无效。",
    "DISALLOWED_WORDS"                     : "不允许在 {0} 中出现 ({1}) 。",
    "API_NOT_COMPATIBLE"                   : "这个扩展包不兼容当前版本的 {APP_NAME}。将安装至已禁用的扩展文件夹中。",
    "MISSING_MAIN"                         : "扩展包中没有 main.js 文件。",
    "EXTENSION_ALREADY_INSTALLED"          : "安装这个扩展将会覆盖先前的版本, 要覆盖旧版本吗？",
    "EXTENSION_SAME_VERSION"               : "已安装相同版本的扩展。要覆盖已安装的版本吗？",
    "EXTENSION_OLDER_VERSION"              : "扩展包版本 {0} 低于已安装版本 ({1}). 要覆盖已安装的版本吗？",
    "DOWNLOAD_ID_IN_USE"                   : "内部错误: 该下载 ID 已被占用。",
    "NO_SERVER_RESPONSE"                   : "无法连接到服务器。",
    "BAD_HTTP_STATUS"                      : "在服务器上没有发现该文件 (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "无法将下载文件保存到临时文件夹。",
    "ERROR_LOADING"                        : "扩展程序启动时遇到一个错误。",
    "MALFORMED_URL"                        : "链接地址无效，请检查输入是否有误",
    "UNSUPPORTED_PROTOCOL"                 : "需要一个 http 或 https 协议的 URL。",
    "UNKNOWN_ERROR"                        : "未知内部错误。",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "扩展管理器",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "无法连接到扩展库，请稍后重试。",
    "INSTALL_FROM_URL"                     : "从 URL 安装\u2026",
    "EXTENSION_AUTHOR"                     : "作者",
    "EXTENSION_DATE"                       : "日期",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "这个扩展需要新版本的 {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "这个扩展目前只能在旧版本的 {APP_NAME} 上运行.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "扩展版本为 {0} 需要一个新版本的 {APP_NAME}. 但你可以安装先前版本的扩展 {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "扩展版本为 {0} 需要一个旧版本的 {APP_NAME}. 但你可以安装先前版本的扩展 {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "没有描述",
    "EXTENSION_MORE_INFO"                  : "更多信息...",
    "EXTENSION_ERROR"                      : "扩展错误",
    "EXTENSION_KEYWORDS"                   : "关键词",
    "EXTENSION_INSTALLED"                  : "已安装",
    "EXTENSION_UPDATE_INSTALLED"           : "此扩展的更新已下载，将在退出 {APP_NAME} 时安装。",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "搜索",
    "EXTENSION_MORE_INFO_LINK"             : "更多",
    "BROWSE_EXTENSIONS"                    : "浏览扩展",
    "EXTENSION_MANAGER_REMOVE"             : "移除扩展",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "无法移除一个或多个扩展：{0}，{APP_NAME} 仍会退出。",
    "EXTENSION_MANAGER_UPDATE"             : "升级扩展",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "无法升级一个或多个扩展：{0}，{APP_NAME} 仍会退出。",
    "MARKED_FOR_REMOVAL"                   : "标记为删除",
    "UNDO_REMOVE"                          : "撤销",
    "MARKED_FOR_UPDATE"                    : "标记为升级",
    "UNDO_UPDATE"                          : "撤销",
    "CHANGE_AND_QUIT_TITLE"                : "扩展更改",
    "CHANGE_AND_QUIT_MESSAGE"              : "安装或移除已标记的扩展，需要退出并重启 {APP_NAME}，请保存尚未保存的改动。",
    "REMOVE_AND_RELOAD"                    : "移除扩展并重启",
    "CHANGE_AND_RELOAD"                    : "改动扩展并重启",
    "UPDATE_AND_RELOAD"                    : "更新扩展并重启",
    "PROCESSING_EXTENSIONS"                : "正在处理扩展改动\u2026",
    "EXTENSION_NOT_INSTALLED"              : "无法移除扩展 {0} ，该扩展尚未安装。",
    "NO_EXTENSIONS"                        : "没有安装任何扩展。<br>可以从点击上面的“可获取”标签项开始。",
    "NO_EXTENSION_MATCHES"                 : "没有找到符合搜索条件的扩展。",
    "REGISTRY_SANITY_CHECK_WARNING"        : "安装来自未知源的扩展时请当心。",
    "EXTENSIONS_INSTALLED_TITLE"           : "已安装",
    "EXTENSIONS_AVAILABLE_TITLE"           : "可获取",
    "EXTENSIONS_UPDATES_TITLE"             : "升级",
    
    "INLINE_EDITOR_NO_MATCHES"             : "未找到匹配项。",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "目前不存在符合选择区域的 CSS 规则。<br> 请点击 \"新建 CSS 规则\" 创建。",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "您的项目中没有样式表文件。<br>请至少建立一个这样的文件用于添加 CSS 规则。",
    
    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "最大",
    
    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "最大化",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "像素",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "调试",
    "CMD_SHOW_DEV_TOOLS"                        : "显示开发人员工具",
    "CMD_REFRESH_WINDOW"                        : "以带扩展模式重启",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "以无扩展模式重启",
    "CMD_REFRESH_WINDOW"                        : "重新载入程序并加载插件",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "重新载入程序而不加载插件",
    "CMD_NEW_BRACKETS_WINDOW"                   : "新建一个 {APP_NAME} 窗口",
    "CMD_SWITCH_LANGUAGE"                       : "切换语言",
    "CMD_RUN_UNIT_TESTS"                        : "运行测试",
    "CMD_SHOW_PERF_DATA"                        : "显示性能数据",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "启用 Node.js 调试",
    "CMD_LOG_NODE_STATE"                        : "将 Node.js 日志显示在控制台中",
    "CMD_RESTART_NODE"                          : "重启 Node.js",
    
    "LANGUAGE_TITLE"                            : "切换语言",
    "LANGUAGE_MESSAGE"                          : "请从下拉列表中选择语言:",
    "LANGUAGE_SUBMIT"                           : "重新加载 {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "取消",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "使用系统默认语言",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "时间",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "进度",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd>移动选中点<br><kbd class='text'>Shift</kbd>一次移动十个单位<br><kbd class='text'>Tab</kbd>切换点",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd>增加或减少步进<br><kbd>←</kbd><kbd>→</kbd> 切换 '开始' 或 '结束' 点",
    "INLINE_TIMING_EDITOR_INVALID"              : "原值 <code>{0}</code> 无效，当前显示函数已变为 <code>{1}</code>。文档会在首次编辑时更新。",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "当前颜色",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "原来的颜色",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa 格式",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "十六进制格式",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa 格式",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (使用 {1} 次)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (使用 {1} 次)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "跳转到源代码定义处",
    "CMD_SHOW_PARAMETER_HINT"                   : "显示参数提示",
    "NO_ARGUMENTS"                              : "<无相应参数>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "鼠标悬停时启用快速查看",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "最近的项目",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "更多信息"
});

/* Last translated for cd86e0f9f9edddef58f88e921388902570783fd8 */
