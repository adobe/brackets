/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR"                     : "(錯誤 {0})",
    "NOT_FOUND_ERR"                     : "找不到檔案。",
    "NOT_READABLE_ERR"                  : "無法讀取檔案。",
    "NO_MODIFICATION_ALLOWED_ERR"       : "無法異動目標目錄。",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "您的權限不足，無法修改。",
    "CONTENTS_MODIFIED_ERR"             : "檔案已被 {APP_NAME} 以外的程式修改。",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} 目前只支援 UTF-8 編碼的文字檔。",
    "FILE_EXISTS_ERR"                   : "檔案或目錄已經存在。",
    "FILE"                              : "檔案",
    "DIRECTORY"                         : "目錄",
    "DIRECTORY_NAMES_LEDE"              : "目錄名稱",
    "FILENAMES_LEDE"                    : "檔案名稱",
    "FILENAME"                          : "檔案名稱",
    "DIRECTORY_NAME"                    : "目錄名稱",
    

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "無法載入專案",
    "OPEN_DIALOG_ERROR"                 : "顯示開啟檔案對話框時發生錯誤。 (錯誤 {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "載入 <span class='dialog-filename'>{0}</span> 目錄時發生錯誤。 (錯誤 {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "讀取 <span class='dialog-filename'>{0}</span> 目錄中的內容時發生錯誤。 (錯誤 {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "無法開啟檔案",
    "ERROR_OPENING_FILE"                : "開啟 <span class='dialog-filename'>{0}</span> 檔案時發生錯誤。 {1}",
    "ERROR_OPENING_FILES"               : "開啟下列檔案時發生錯誤:",
    "ERROR_RELOADING_FILE_TITLE"        : "無法從磁碟重新載入變更",
    "ERROR_RELOADING_FILE"              : "重新載入 <span class='dialog-filename'>{0}</span> 檔案時發生錯誤。 {1}",
    "ERROR_SAVING_FILE_TITLE"           : "無法儲存檔案",
    "ERROR_SAVING_FILE"                 : "儲存 <span class='dialog-filename'>{0}</span> 檔案時發生錯誤。 {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "無法將檔案重新命名",
    "ERROR_RENAMING_FILE"               : "重新命名 <span class='dialog-filename'>{0}</span> 檔案時發生錯誤。 {1}",
    "ERROR_DELETING_FILE_TITLE"         : "無法刪除檔案",
    "ERROR_DELETING_FILE"               : "刪除 <span class='dialog-filename'>{0}</span> 檔案時發生錯誤。 {1}",
    "INVALID_FILENAME_TITLE"            : "{0}無效",
    "INVALID_FILENAME_MESSAGE"          : "{0}當中不能包含任何的系統保留字、結尾不能是半型句點 (.)，也不能使用下列字元: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "已經有叫做 <span class='dialog-filename'>{0}</span> 的檔案或目錄了。",
    "ERROR_CREATING_FILE_TITLE"         : "無法建立{0}",
    "ERROR_CREATING_FILE"               : "建立{0} <span class='dialog-filename'>{1}</span> 時發生錯誤。 {2}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "讀取喜好設定時發生錯誤",
    "ERROR_PREFS_CORRUPT"               : "您的喜好設定檔內容不是有效的 JSON 格式。將開啟該檔以便您修正格式問題。 重新啟動 {APP_NAME} 後異動才會生效。",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "不妙! {APP_NAME} 還不能在瀏覽器裡跑。",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} 是以 HTML 打造，不過要以應用程式的方式執行才能編輯電腦上的檔案。請透過 <b>github.com/adobe/brackets-shell</b> 儲存庫中的應用程式介面來執行 {APP_NAME}。",
    
    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "無法建立檔案索引",
    "ERROR_MAX_FILES"                   : "建立索引的檔案數已達上限。會透過索引尋找檔案內容的功能可能會不太正常。",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "無法啟動瀏覽器",
    "ERROR_CANT_FIND_CHROME"            : "找不到 Google Chrome 瀏覽器。請確定您有安裝。",
    "ERROR_LAUNCHING_BROWSER"           : "啟動瀏覽器時發生錯誤。 (錯誤 {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "即時預覽錯誤",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "正在連到瀏覽器",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "為了讓即時預覽功能順利連線，需要重新啟動 Chrome 並開啟遠端除錯功能。<br /><br />您是否要重新啟動 Chrome 並啟用遠端除錯功能?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "無法載入即時預覽頁",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "請開啟 HTML 檔，或是確定專案中有 index.html 檔才能啟動即時預覽功能。",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "您需要指定專案的 URL 根位址，才能啟動包含伺服器端資源的即時預覽功能。",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "無法啟動即時預覽用的 HTTP 伺服器。請再試一次。",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "歡迎使用即時預覽!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "即時預覽將 {APP_NAME} 與您的瀏覽器連線。讓您在瀏覽器中預覽 HTML 檔案，編輯的內容也會即時反應在預覽畫面上。<br /><br />因為 {APP_NAME} 才剛起步，即時預覽目前只能在 <strong>Google Chrome</strong> 上面執行，<strong>CSS 或 HTML 檔案</strong>的異動會即時反應。修改 JavaScript 檔案並儲存後會重新載入頁面。<br /><br />(您只會看到一次這段訊息。)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "想了解更多，請參考<a href='{0}' title='{0}'>即時預覽連結錯誤排解</a>。",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "即時預覽",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "即時預覽: 連線中\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "即時預覽: 初始化中\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "關閉即時預覽",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "即時預覽 (檔案儲存後重新載入)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "即時預覽 (語法錯誤，不更新)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "已取消即時預覽，因為開發者工具被打開了",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "已取消即時預覽，因為頁面被關掉了",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "已取消即時預覽，因為您連到專案外的頁面了",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "即時預覽因為不明的錯誤而取消 ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "儲存變更",
    "SAVE_CLOSE_MESSAGE"                : "您想要儲存 <span class='dialog-filename'>{0}</span> 檔案的變更嗎?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "您想要儲存下列檔案的變更嗎?",
    "EXT_MODIFIED_TITLE"                : "外部變更",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "確定刪除",
    "CONFIRM_FOLDER_DELETE"             : "您確定要刪除 <span class='dialog-filename'>{0}</span> 資料夾嗎?",
    "FILE_DELETED_TITLE"                : "檔案已刪除",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> 被修改過了。<br /><br />您想要儲存檔案並覆寫蓋掉外部的變更嗎?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> 被修改過了，但在 {APP_NAME} 中也有還沒儲存的變更。<br /><br />您想保留哪個版本呢?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> 被刪除了，但在 {APP_NAME} 中還有沒儲存的變更。<br /><br />想要保留您變更的內容嗎?",
    
    // Generic dialog/button labels
    "DONE"                              : "完成",
    "OK"                                : "確定",
    "CANCEL"                            : "取消",
    "DONT_SAVE"                         : "不要儲存",
    "SAVE"                              : "儲存",
    "SAVE_AS"                           : "另存新檔\u2026",
    "SAVE_AND_OVERWRITE"                : "覆寫",
    "DELETE"                            : "刪除",
    "BUTTON_YES"                        : "是",
    "BUTTON_NO"                         : "否",
    
    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} 筆結果",
    "FIND_RESULT_COUNT_SINGLE"          : "1 筆結果",
    "FIND_NO_RESULTS"                   : "沒有結果",
    "FIND_QUERY_PLACEHOLDER"            : "尋找\u2026",
    "REPLACE_PLACEHOLDER"               : "取代成\u2026",
    "BUTTON_REPLACE_ALL"                : "批次\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "取代\u2026",
    "BUTTON_REPLACE"                    : "取代",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "下一筆符合的",
    "BUTTON_PREV_HINT"                  : "上一筆符合的",
    "BUTTON_CASESENSITIVE_HINT"         : "大小寫須相符",
    "BUTTON_REGEXP_HINT"                : "正規表示式",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "取代後無法復原",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "有超過 {0} 個檔案會被變更，{APP_NAME} 會修改到磁碟上沒被開啟的檔案。<br />這些檔案內容取代後無法再復原。",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "直接取代，不用復原",

    "OPEN_FILE"                         : "開啟檔案",
    "SAVE_FILE_AS"                      : "儲存檔案",
    "CHOOSE_FOLDER"                     : "選取資料夾",

    "RELEASE_NOTES"                     : "版本資訊",
    "NO_UPDATE_TITLE"                   : "已經是最新版!",
    "NO_UPDATE_MESSAGE"                 : "您的 {APP_NAME} 已經是最新版。",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "將",
    "FIND_REPLACE_TITLE_WITH"           : "取代成",
    "FIND_TITLE_LABEL"                  : "找到",
    "FIND_TITLE_SUMMARY"                : "&mdash; {3}中共有{0} {1} 筆{2}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} 個{1}",
    "FIND_IN_FILES_SCOPED"              : "在 <span class='dialog-filename'>{0}</span> 中",
    "FIND_IN_FILES_NO_SCOPE"            : "在專案中",
    "FIND_IN_FILES_ZERO_FILES"          : "篩選條件排除了{0}的所有檔案",
    "FIND_IN_FILES_FILE"                : "檔案",
    "FIND_IN_FILES_FILES"               : "檔案",
    "FIND_IN_FILES_MATCH"               : "符合",
    "FIND_IN_FILES_MATCHES"             : "符合",
    "FIND_IN_FILES_MORE_THAN"           : "超過",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "按住 Ctrl/Cmd 再用滑鼠點一下可以全部展開/收合",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "取代錯誤",
    "REPLACE_IN_FILES_ERRORS"           : "下列檔案沒有被修改，可能是搜尋後又被變更或是無法寫入。",
    
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "無法取得更新資訊",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "由伺服器取得更新資訊時發生錯誤。請確定您已連線到 Internet 後再重試一次。",
    
    // File exclusion filters
    "NEW_FILE_FILTER"                   : "新增排除集\u2026",
    "CLEAR_FILE_FILTER"                 : "不要排除檔案",
    "NO_FILE_FILTER"                    : "沒有檔案被排除",
    "EXCLUDE_FILE_FILTER"               : "排除 {0}",
    "EDIT_FILE_FILTER"                  : "編輯\u2026",
    "FILE_FILTER_DIALOG"                : "編輯排除集",
    "FILE_FILTER_INSTRUCTIONS"          : "排除名稱完全或部分符合下列字串的檔案及資料夾，也可以使用<a href='{0}' title='{0}'>萬用字元</a>。 多組條件請分行輸入，一行一個。",
    "FILTER_NAME_PLACEHOLDER"           : "排除集名稱 (選填)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "及其他 {0} 個",
    "FILTER_COUNTING_FILES"             : "計算檔案數目中\u2026",
    "FILTER_FILE_COUNT"                 : "包含{2}全部 {1} 個檔案中的 {0} 個",
    "FILTER_FILE_COUNT_ALL"             : "包含{1}的全部 {0} 個檔案",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "游標所在位置沒有相關的快速編輯功能",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "CSS 快速編輯: 將游標放在單一 class 名稱上",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "CSS 快速編輯: class 屬性不完整",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "CSS 快速編輯: id 屬性不完整",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "CSS 快速編輯: 將游標放在標籤名稱、class 或 id 上",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "CSS 計時函式快速編輯: 語法無效",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "JS 快速編輯: 將游標放在函式名稱上",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "游標所在位置沒有相關的快速文件",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "載入中\u2026",
    "UNTITLED"          : "未命名",
    "WORKING_FILES"     : "工作檔案",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "空白鍵",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "第 {0} 行，第 {1} 個字元",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 選了 {0} 個字元",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 選了 {0} 個字元",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 選了 {0} 行",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 選了 {0} 行",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 選了 {0} 段",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "點一下切換成使用空白字元縮排",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "點一下切換成使用 Tab 縮排",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "點一下變更縮排用的空白字元數",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "點一下變更 Tab 字元所代表的長度",
    "STATUSBAR_SPACES"                      : "空白字元:",
    "STATUSBAR_TAB_SIZE"                    : "Tab 長度:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} 行",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} 行",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "已停用擴充功能",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",
    "STATUSBAR_DEFAULT_LANG"                : "(預設)",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} 項問題",
    "SINGLE_ERROR"                          : "1 項 {0} 問題",
    "MULTIPLE_ERRORS"                       : "{1} 項 {0} 問題",
    "NO_ERRORS"                             : "沒發現任何 {0} 問題，幹得好!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "沒發現任何問題，幹得好!",
    "LINT_DISABLED"                         : "已停用 Lint 功能",
    "NO_LINT_AVAILABLE"                     : "沒有 {0} 適用的 Linter",
    "NOTHING_TO_LINT"                       : "沒有東西好 Lint",
    "LINTER_TIMED_OUT"                      : "{0} 等了 {1} 毫秒後逾時",
    "LINTER_FAILED"                         : "{0} 已終止，錯誤: {1}",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "檔案",
    "CMD_FILE_NEW_UNTITLED"               : "新增",
    "CMD_FILE_NEW"                        : "新增檔案",
    "CMD_FILE_NEW_FOLDER"                 : "新增資料夾",
    "CMD_FILE_OPEN"                       : "開啟\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "加進工作集",
    "CMD_OPEN_DROPPED_FILES"              : "開啟拖放的檔案",
    "CMD_OPEN_FOLDER"                     : "開啟資料夾\u2026",
    "CMD_FILE_CLOSE"                      : "關閉",
    "CMD_FILE_CLOSE_ALL"                  : "全部關閉",
    "CMD_FILE_CLOSE_LIST"                 : "關閉清單",
    "CMD_FILE_CLOSE_OTHERS"               : "關閉其他檔案",
    "CMD_FILE_CLOSE_ABOVE"                : "關閉上列檔案",
    "CMD_FILE_CLOSE_BELOW"                : "關閉下列檔案",
    "CMD_FILE_SAVE"                       : "儲存",
    "CMD_FILE_SAVE_ALL"                   : "全部儲存",
    "CMD_FILE_SAVE_AS"                    : "另存新檔\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "即時預覽",
    "CMD_RELOAD_LIVE_PREVIEW"             : "強制重新載入即時預覽",
    "CMD_PROJECT_SETTINGS"                : "專案設定\u2026",
    "CMD_FILE_RENAME"                     : "重新命名",
    "CMD_FILE_DELETE"                     : "刪除",
    "CMD_INSTALL_EXTENSION"               : "安裝擴充功能\u2026",
    "CMD_EXTENSION_MANAGER"               : "擴充功能管理員\u2026",
    "CMD_FILE_REFRESH"                    : "重新整理檔案樹",
    "CMD_QUIT"                            : "結束",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "結束",

    // Edit menu commands
    "EDIT_MENU"                           : "編輯",
    "CMD_UNDO"                            : "復原",
    "CMD_REDO"                            : "取消復原",
    "CMD_CUT"                             : "剪下",
    "CMD_COPY"                            : "複製",
    "CMD_PASTE"                           : "貼上",
    "CMD_SELECT_ALL"                      : "全部選取",
    "CMD_SELECT_LINE"                     : "整行選取",
    "CMD_SPLIT_SEL_INTO_LINES"            : "逐行切成多段選取區塊",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "在下一行加入游標",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "在上一行加入游標",
    "CMD_INDENT"                          : "縮排",
    "CMD_UNINDENT"                        : "取消縮排",
    "CMD_DUPLICATE"                       : "整行複製",
    "CMD_DELETE_LINES"                    : "整行刪除",
    "CMD_COMMENT"                         : "加入或取消行註解",
    "CMD_BLOCK_COMMENT"                   : "加入或取消區塊註解",
    "CMD_LINE_UP"                         : "整行上移",
    "CMD_LINE_DOWN"                       : "整行下移",
    "CMD_OPEN_LINE_ABOVE"                 : "往上新增一行",
    "CMD_OPEN_LINE_BELOW"                 : "往下新增一行",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "自動插入右括號",
    "CMD_SHOW_CODE_HINTS"                 : "顯示程式提示",
    
    // Search menu commands
    "FIND_MENU"                           : "尋找",
    "CMD_FIND"                            : "尋找",
    "CMD_FIND_NEXT"                       : "找下一個",
    "CMD_FIND_PREVIOUS"                   : "找上一個",
    "CMD_FIND_ALL_AND_SELECT"             : "找出並全部選取",
    "CMD_ADD_NEXT_MATCH"                  : "一併選取下一筆符合的",
    "CMD_SKIP_CURRENT_MATCH"              : "跳過並選取下一筆符合的",
    "CMD_FIND_IN_FILES"                   : "在檔案中尋找",
    "CMD_FIND_IN_SELECTED"                : "在選取的檔案或資料夾中尋找",
    "CMD_FIND_IN_SUBTREE"                 : "尋找\u2026",
    "CMD_REPLACE"                         : "取代",
    "CMD_REPLACE_IN_FILES"                : "在檔案中取代",
    "CMD_REPLACE_IN_SELECTED"             : "在選取的檔案或資料夾中取代",
    "CMD_REPLACE_IN_SUBTREE"              : "取代\u2026",
    
    // View menu commands
    "VIEW_MENU"                           : "檢視",
    "CMD_HIDE_SIDEBAR"                    : "隱藏側欄",
    "CMD_SHOW_SIDEBAR"                    : "顯示側欄",
    "CMD_INCREASE_FONT_SIZE"              : "放大字體",
    "CMD_DECREASE_FONT_SIZE"              : "縮小字體",
    "CMD_RESTORE_FONT_SIZE"               : "還原字體大小",
    "CMD_SCROLL_LINE_UP"                  : "向上捲動一行",
    "CMD_SCROLL_LINE_DOWN"                : "向下捲動一行",
    "CMD_TOGGLE_LINE_NUMBERS"             : "行號",
    "CMD_TOGGLE_ACTIVE_LINE"              : "強調游標所在行",
    "CMD_TOGGLE_WORD_WRAP"                : "自動換行",
    "CMD_LIVE_HIGHLIGHT"                  : "即時預覽強調顯示",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "存檔時執行 Lint",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "依加入先後排序",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "依檔名排序",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "依類型排序",
    "CMD_SORT_WORKINGSET_AUTO"            : "自動排序",
    "CMD_THEMES"                          : "佈景主題\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "瀏覽",
    "CMD_QUICK_OPEN"                      : "快速開啟",
    "CMD_GOTO_LINE"                       : "到指定行",
    "CMD_GOTO_DEFINITION"                 : "快速尋找定義",
    "CMD_GOTO_FIRST_PROBLEM"              : "到第一筆錯誤或警告",
    "CMD_TOGGLE_QUICK_EDIT"               : "快速編輯",
    "CMD_TOGGLE_QUICK_DOCS"               : "快速文件",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "上一筆符合",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "下一筆符合",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "新增規則",
    "CMD_NEXT_DOC"                        : "下一個檔案",
    "CMD_PREV_DOC"                        : "上一個檔案",
    "CMD_SHOW_IN_TREE"                    : "在檔案樹中顯示",
    "CMD_SHOW_IN_EXPLORER"                : "在檔案總管中顯示",
    "CMD_SHOW_IN_FINDER"                  : "在 Finder 中顯示",
    "CMD_SHOW_IN_OS"                      : "在作業系統中顯示",
    
    // Help menu commands
    "HELP_MENU"                           : "說明",
    "CMD_CHECK_FOR_UPDATE"                : "檢查是否有更新",
    "CMD_HOW_TO_USE_BRACKETS"             : "如何使用 {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME} 支援",
    "CMD_SUGGEST"                         : "功能建議",
    "CMD_RELEASE_NOTES"                   : "版本資訊",
    "CMD_GET_INVOLVED"                    : "參與",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "顯示擴充功能資料夾",
    "CMD_HOMEPAGE"                        : "{APP_TITLE} 首頁",
    "CMD_TWITTER"                         : "Twitter {TWITTER_NAME} 專頁",
    "CMD_ABOUT"                           : "關於 {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "開啟喜好設定檔",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "實驗建置",
    "DEVELOPMENT_BUILD"                    : "開發建置",
    "RELOAD_FROM_DISK"                     : "從磁碟重新載入",
    "KEEP_CHANGES_IN_EDITOR"               : "在編輯器中保留變更",
    "CLOSE_DONT_SAVE"                      : "關閉 (不要儲存)",
    "RELAUNCH_CHROME"                      : "重新啟動 Chrome",
    "ABOUT"                                : "關於",
    "CLOSE"                                : "關閉",
    "ABOUT_TEXT_LINE1"                     : "第 {VERSION_MINOR} 回 Sprint {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "建置時間: ",
    "ABOUT_TEXT_LINE3"                     : "第三方軟體的注意事項、使用條款及條件公佈在 <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a>，於此引用納入。",
    "ABOUT_TEXT_LINE4"                     : "說明文件及原始碼都在 <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a> 上。",
    "ABOUT_TEXT_LINE5"                     : "用 \u2764 跟 JavaScript 打造。工匠名錄:",
    "ABOUT_TEXT_LINE6"                     : "一大票人馬 (只可惜我們現在沒辦法正常載入名單)。",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform 文件及 Web Platform 圖示皆以 Creative Commons Attribution 授權條款 <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a> 授權。",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "有新版的 {APP_NAME}! 點這裡了解詳情。",
    "UPDATE_AVAILABLE_TITLE"               : "有新版",
    "UPDATE_MESSAGE"                       : "嗨! 新版的 {APP_NAME} 已經可以下載。新功能有:",
    "GET_IT_NOW"                           : "馬上取得!",
    "PROJECT_SETTINGS_TITLE"               : "專案設定: {0}",
    "PROJECT_SETTING_BASE_URL"             : "即時預覽 URL 根位址",
    "PROJECT_SETTING_BASE_URL_HINT"        : "如果要用本機伺服器，可以輸入 http://localhost:8000/ 這類 URL",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "即時預覽功能不支援 {0} 協定&mdash;請使用 http: 或 https: 。",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL 根位址不能有 \"{0}\" 這類搜尋參數。",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL 根位址不能有半型井號 (#)，例如 \"{0}\"。",
    "BASEURL_ERROR_INVALID_CHAR"           : "'{0}' 這類特殊字元一定要用 % 格式編碼過。",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "解析 URL 根位址時發生不明錯誤",
    
    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "目前的佈景主題",
    "CUSTOM_SCROLLBARS"                    : "自訂捲軸",
    "FONT_SIZE"                            : "字體大小",
    "FONT_FAMILY"                          : "字體",
    "LINE_HEIGHT"                          : "行高",
    "GENERAL"                              : "一般",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "新增規則",
    
    // Extension Management strings
    "INSTALL"                              : "安裝",
    "UPDATE"                               : "更新",
    "REMOVE"                               : "移除",
    "OVERWRITE"                            : "覆寫",
    "CANT_REMOVE_DEV"                      : "在 \"dev\" 資料夾中的擴充功能必需手動刪除。",
    "CANT_UPDATE"                          : "這項更新不相容於這一版的 {APP_NAME}。",
    "CANT_UPDATE_DEV"                      : "在 \"dev\" 資料夾中的擴充功能無法自動更新。",
    "INSTALL_EXTENSION_TITLE"              : "安裝擴充功能",
    "UPDATE_EXTENSION_TITLE"               : "更新擴充功能",
    "INSTALL_EXTENSION_LABEL"              : "擴充功能 URL",
    "INSTALL_EXTENSION_HINT"               : "擴充功能 zip 壓縮檔或是 GitHub 儲存庫的 URL",
    "INSTALLING_FROM"                      : "由 {0} 安裝擴充功能中\u2026",
    "INSTALL_SUCCEEDED"                    : "安裝成功!",
    "INSTALL_FAILED"                       : "安裝失敗。",
    "CANCELING_INSTALL"                    : "取消中\u2026",
    "CANCELING_HUNG"                       : "取消安裝花太多時間。可能發生了內部錯誤。",
    "INSTALL_CANCELED"                     : "安裝已取消。",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "下載的內容不是有效的 zip 壓縮檔。",
    "INVALID_PACKAGE_JSON"                 : "package.json 檔案無效 (錯誤: {0}).",
    "MISSING_PACKAGE_NAME"                 : "package.json 檔案中沒有指定套件名稱。",
    "BAD_PACKAGE_NAME"                     : "{0} 不是有效的套件名稱。",
    "MISSING_PACKAGE_VERSION"              : "package.json 檔案中沒有指定套件版本。",
    "INVALID_VERSION_NUMBER"               : "套件版號 ({0}) 無效。",
    "INVALID_BRACKETS_VERSION"             : "{APP_NAME} 相容性字串 ({0}) 無效。",
    "DISALLOWED_WORDS"                     : "{0} 欄位中不能有 ({1}) 這些字。",
    "API_NOT_COMPATIBLE"                   : "這個擴充功能不相容於本版 {APP_NAME}。已將其安裝在 \"disabled\" 已停用擴充功能資料夾中。",
    "MISSING_MAIN"                         : "套件中沒有 main.js 檔案。",
    "EXTENSION_ALREADY_INSTALLED"          : "安裝這個套件將會蓋掉先前安裝的擴充功能。 是否要覆寫?",
    "EXTENSION_SAME_VERSION"               : "已經安裝過這個版本的套件了。 是否要覆寫已安裝的版本?",
    "EXTENSION_OLDER_VERSION"              : "{0} 版的套件比已安裝的版本 ({1}) 還要舊。 是否要覆寫已經安裝的版本?",
    "DOWNLOAD_ID_IN_USE"                   : "內部錯誤: 下載識別碼正在使用中。",
    "NO_SERVER_RESPONSE"                   : "無法連到伺服器。",
    "BAD_HTTP_STATUS"                      : "伺服器 (HTTP {0}) 回應找不到檔案。",
    "CANNOT_WRITE_TEMP"                    : "無法下載存成暫存檔。",
    "ERROR_LOADING"                        : "擴充功能啟動時發生錯誤。",
    "MALFORMED_URL"                        : "URL 無效。請檢查您是否輸入正確。",
    "UNSUPPORTED_PROTOCOL"                 : "只支援 http 或 https 協定的 URL。",
    "UNKNOWN_ERROR"                        : "不明的內部錯誤。",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "擴充功能管理員",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "無法存取擴充功能登錄庫。請稍後再試。",
    "INSTALL_FROM_URL"                     : "由 URL 安裝\u2026",
    "EXTENSION_AUTHOR"                     : "作者",
    "EXTENSION_DATE"                       : "日期",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "這個擴充功能需要較新版的 {APP_NAME} 才能使用。",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "這個擴充功能目前只能在舊版 {APP_NAME} 中使用。",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "這個擴充功能 {0} 版只能在新版 {APP_NAME} 中使用。不過您可以選擇安裝較舊的 {1} 版。",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "這個擴充功能 {0} 版只能在舊版 {APP_NAME} 中使用。不過您可以選擇安裝較舊的 {1} 版。",
    "EXTENSION_NO_DESCRIPTION"             : "沒有描述資訊",
    "EXTENSION_MORE_INFO"                  : "更多資訊...",
    "EXTENSION_ERROR"                      : "擴充功能錯誤",
    "EXTENSION_KEYWORDS"                   : "關鍵字",
    "EXTENSION_INSTALLED"                  : "已安裝",
    "EXTENSION_UPDATE_INSTALLED"           : "這個擴充功能的更新已經下載完成，會在重新載入 {APP_NAME} 時安裝。",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "搜尋",
    "EXTENSION_MORE_INFO_LINK"             : "更多",
    "BROWSE_EXTENSIONS"                    : "瀏覽擴充功能",
    "EXTENSION_MANAGER_REMOVE"             : "移除擴充功能",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "無法移除擴充功能: {0}。 {APP_NAME} 還是會重新載入。",
    "EXTENSION_MANAGER_UPDATE"             : "更新擴充功能",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "無法更新擴充功能: {0}。 {APP_NAME} 還是會重新載入。",
    "MARKED_FOR_REMOVAL"                   : "標為待移除",
    "UNDO_REMOVE"                          : "復原",
    "MARKED_FOR_UPDATE"                    : "標為待更新",
    "UNDO_UPDATE"                          : "復原",
    "CHANGE_AND_RELOAD_TITLE"              : "變更擴充功能",
    "CHANGE_AND_RELOAD_MESSAGE"            : "要更新或移除標記的擴充功能，需要重新載入 {APP_NAME}。 會再提示您儲存所做的變更。",
    "REMOVE_AND_RELOAD"                    : "移除擴充功能並重新載入",
    "CHANGE_AND_RELOAD"                    : "變更擴充功能並重新載入",
    "UPDATE_AND_RELOAD"                    : "更新擴充功能並重新載入",
    "PROCESSING_EXTENSIONS"                : "正在變更擴充功能\u2026",
    "EXTENSION_NOT_INSTALLED"              : "無法移除還沒安裝的擴充功能 {0}。",
    "NO_EXTENSIONS"                        : "還沒安裝任何擴充功能。<br>請點一下上方的「可使用」頁籤開始。",
    "NO_EXTENSION_MATCHES"                 : "找不到符合您搜尋條件的擴充功能。",
    "REGISTRY_SANITY_CHECK_WARNING"        : "由不明來源安裝擴充功能時請特別小心，保持警覺。",
    "EXTENSIONS_INSTALLED_TITLE"           : "已安裝",
    "EXTENSIONS_AVAILABLE_TITLE"           : "可使用",
    "EXTENSIONS_UPDATES_TITLE"             : "更新",
    
    "INLINE_EDITOR_NO_MATCHES"             : "找不到符合的。",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "既有 CSS 中沒有符合您選取內容的規則。<br> 按一下「新增規則」 建立一組。",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "您的專案中沒有 Stylesheet 樣式表檔案。<br>建立一個來新增 CSS 規則。",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "最大",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "像素",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "除錯",
    "ERRORS"                                    : "錯誤",
    "CMD_SHOW_DEV_TOOLS"                        : "顯示開發者工具",
    "CMD_REFRESH_WINDOW"                        : "重新載入並啟用擴充功能",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "重新載入並停用擴充功能",
    "CMD_NEW_BRACKETS_WINDOW"                   : "開新 {APP_NAME} 視窗",
    "CMD_SWITCH_LANGUAGE"                       : "切換語言",
    "CMD_RUN_UNIT_TESTS"                        : "執行測試",
    "CMD_SHOW_PERF_DATA"                        : "顯示效能資料",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "啟用 Node 除錯工具",
    "CMD_LOG_NODE_STATE"                        : "將 Node 狀態寫到 Console",
    "CMD_RESTART_NODE"                          : "重新啟動 Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "在狀態列顯示錯誤訊息",
    
    "LANGUAGE_TITLE"                            : "切換語言",
    "LANGUAGE_MESSAGE"                          : "語言:",
    "LANGUAGE_SUBMIT"                           : "重新載入 {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "取消",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "系統預設",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "時間",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "進度",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> 移動選取的控制點<br><kbd class='text'>Shift</kbd> 移動 10 個單位<br><kbd class='text'>Tab</kbd> 切換控制點",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> 增加或減少 Step 數<br><kbd>←</kbd><kbd>→</kbd> 'Start' 或 'End'",
    "INLINE_TIMING_EDITOR_INVALID"              : "原始值 <code>{0}</code> 無效，因此改以 <code>{1}</code> 函式顯示。 檔案在第一次編輯後將被更新。",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "目前的色彩",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "原來的色彩",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa 格式",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "16 進位格式",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa 格式",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (用了 {1} 次)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (用了 {1} 次)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "跳到定義位置",
    "CMD_SHOW_PARAMETER_HINT"                   : "顯示參數提示",
    "NO_ARGUMENTS"                              : "<沒有參數>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "游標停留時快速檢視",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "最近開啟的專案",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "更多資訊"
});

/* Last translated for 99e8df52a90ae33e96878e0cda273fcdc0610e0d */
