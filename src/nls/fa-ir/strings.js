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
    
    /*
     * Errors
     */

    // General file io error strings
    "APP_NAME"                          : "براکتس",
    "GENERIC_ERROR"                     : "(خطا {0})",
    "NOT_FOUND_ERR"                     : "پرونده پیدا نشد.",
    "NOT_READABLE_ERR"                  : "فایل قابل خواندن نیست.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "دایرکتوری هدف قابل ویرایش نیست.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "دسترسی های تعریف شده برای شما اجازه تغییرات را نمی دهند.",
    "FILE_EXISTS_ERR"                   : "پرونده یا پوشه مد نظر موجود می باشد.",
    "FILE"                              : "پرونده",
    "DIRECTORY"                         : "پوشه",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "خطا در بارگذاری پروژه",
    "OPEN_DIALOG_ERROR"                 : "خطا در بازکردن پرونده خوان. (خطا {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "خطا بهنگام بارگذاری پوشه <span class='dialog-filename'>{0}</span>. (خطا {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "بروز خطا در خواندن اطلاعات پوشه <span class='dialog-filename'>{0}</span>. (خطا {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "خطا در بازکردن پرونده",
    "ERROR_OPENING_FILE"                : "خطا بهنگام تلاش برای باز کردن پرونده <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "خطا بهنگام بارگذاری پرونده های زیر:",
    "ERROR_RELOADING_FILE_TITLE"        : "خطا در بارگذاری تغییرات از حافظه",
    "ERROR_RELOADING_FILE"              : "بروز خطا بهنگام تلاش برای بارگذاری پرونده <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "خطا در ذخیره سازی پرونده",
    "ERROR_SAVING_FILE"                 : "بروز خطا بهنگام تلاش جهت ذخیره پرونده <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "خطا در تغییر نام پرونده",
    "ERROR_RENAMING_FILE"               : "بروز خطا بهنگام تلاش برای تغییر نام پرونده <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "خطا در حذف پرونده",
    "ERROR_DELETING_FILE"               : "بروز خطا بهنگام تلاش برای جذف پرونده <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "مقدار وارد شده {0} معتبر نمی باشد",
    "INVALID_FILENAME_MESSAGE"          : "نام پرونده نمی تواند شامل مقادیر زیر باشد: {0} or use any system reserved words.",
    "FILE_ALREADY_EXISTS"               : "پرونده ای با نام {0} <span class='dialog-filename'>{1}</span> وجود دارد.",
    "ERROR_CREATING_FILE_TITLE"         : "خطا در ایجاد {0}",
    "ERROR_CREATING_FILE"               : "بروز خطا بهنگام ایجاد {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "!!! براکتس در مرورگرها اجرا نمی شود.",
    "ERROR_IN_BROWSER"                  : "براکتس با HTML ساخته شده, ولی هم اکنون بعنوان یک برنامه رومیزی(desktop) اجرا می شود و شما می توانید از آن جهت ویرایش پرونده های خود استفاده نمایید.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "خطا در فهرست بندی پرونده ها",
    "ERROR_MAX_FILES"                   : "مقدار پرونده های قابل فهرست بندی به حداکثر رسیده بهمین علیت عملگر بهنگام فهرست بندی با خطا مواجه می شود.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "خطا در اجرای مرورگر",
    "ERROR_CANT_FIND_CHROME"            : "مرورگر Google Chrome پیدا نشد. لطفا از نصب بودن آن اطمینان حاصل کنید.",
    "ERROR_LAUNCHING_BROWSER"           : "بروز خطا بهنگام اجرای مرورگر. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "خطا در پیشنمایش زنده",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "درحال اتصال به مرورگر",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "به هر صورت بهنگام اتصال به حالت پیش نمایش, مرورگر Chrome احتیاج دارد به فعال بودن اشکال زدای راه دور(خطایابی راه دور).<br /><br />آیا تمایل دارید به اجرای دوباره Chrome و فعال سازی اشکال زدای راه دور(remote debugging)?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "ناتوان در بارگذاری صفحه توسعه زنده",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "باز کردن پرونده HTML به منظور راه اندازی پیش نمایش زنده.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "جهت اجرای پیش نمایش زنده بصورت پرونده در سمت سرور(server-side), می بایست یک URL پایه برای پروژه تعریف نمایید.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "خطا در اجرای سرویس دهنده HTTP برای توسعه زنده پرونده ها. لطفا دوباره تلاش کنید.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "به بخش پیش نمایش زنده خوش آمدید!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "پیش نمایش زنده براکتس به مرورگر متصل شده و یک پیش نمایش از پرونده HTML شما در مرورگرتان نشان خواهد داد, و هرگونه تغییری در کدهایتان را فورا در پیش نمایش اعمال خواهد نمود.<br /><br />در این نسخه موجود براکتس, پیش نمایش تنها با مرورگر <strong>Google Chrome</strong> برای اعمال فوری مقادیر <strong>CSS files</strong> برای حالت پیش نمایش کار خواهد کرد. هرگونه تغییری در پرونده های HTML یا JavaScript بصورت خودکار بعد از ذخیر بارگذاری خواهد شد.<br /><br />(شما این پیغام را برای بار دیگر مشاهده نخواهید کرد.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "برای اطلاع بیشتر, به پیوند روبرو مراجعه کنید <a href='#' class='clickable-link' data-href='{0}'>Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "پیش نمایش زنده",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "پیش نمایش زنده: درحال اتصال\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "پیش نمایش زنده: درحال مقدار دهی اولیه\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "قطع اتصال از پیش نمایش زنده",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "پیش نمایش زنده: جهت قطع اتصال کلیک کنید (ذخیره پرونده ها جهت بروز رسانی)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "پیش نمایش زنده لغو شد زیرا از برخی از ابزارهای توسعه مختص مرورگرتان استفاده کرده اید.",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "پیش نمایش زنده لغو شد زیرا پنجره یا زبانه مربوط به صفحه در مرورگر بسته شده.",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "پیش نمایش زنده لغو شد زیرا پنجره یا زبانه موجود در مرورگر آدرس دیگری را پیمایش کرده است.",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "پیش نمایش زنده بدلیل نامشخصی لغو شد ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "ذخیره تغییرات",
    "SAVE_CLOSE_MESSAGE"                : "آیا مایلید تغییرات داده شده در سند ذخیره گردند <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "آیا مایلید تغییرات داده شده در پرونده های زیر، ذخیره گردند?",
    "EXT_MODIFIED_TITLE"                : "تغییرات خارجی",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "تائید حذف",
    "CONFIRM_FOLDER_DELETE"             : "آیا مطمئنید می خواهید این پوشه حذف گردد <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "پرونده حذف گردید",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> تغییراتی بر روی دیسک انجام شده, ولی تغییرات بر روی براکتس ذخیره نگردیده.<br /><br />کدام نسخه را می خواهید نگه دارید?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> برخی مقادیر از دیسک حذف شده, ولی تغییرات بر روی براکتس اعمال/ذخیره نشده.<br /><br />آیا می خواهید تغییرات را حفظ کنید?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "برای جستجوی regexp از /re/ استفاده کنید",
    "FIND_RESULT_COUNT"                 : "{0} نتایج",
    "FIND_RESULT_COUNT_SINGLE"          : "1 نتیجه",
    "FIND_NO_RESULTS"                   : "بی نتیجه",
    "WITH"                              : "با",
    "BUTTON_YES"                        : "بله",
    "BUTTON_NO"                         : "خیر",
    "BUTTON_REPLACE_ALL"                : "همه موارد\u2026",
    "BUTTON_STOP"                       : "ایست",
    "BUTTON_REPLACE"                    : "جایگزینی",

    "OPEN_FILE"                         : "باز کردن پرونده",
    "SAVE_FILE_AS"                      : "ذخیره پرونده",
    "CHOOSE_FOLDER"                     : "انتخاب پوشه",

    "RELEASE_NOTES"                     : "نکات و یادداشت های انتشار",
    "NO_UPDATE_TITLE"                   : "بروز هستید!",
    "NO_UPDATE_MESSAGE"                 : "شما درحال استفاده از آخرین نسخه براکتس هستید.",

    "FIND_REPLACE_TITLE_PART1"          : "جستجو و جایگزینی \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" با \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" پیدا شد",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "در <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "در پروژ]",
    "FIND_IN_FILES_FILE"                : "پرونده",
    "FIND_IN_FILES_FILES"               : "پرونده ها",
    "FIND_IN_FILES_MATCH"               : "تطبیق",
    "FIND_IN_FILES_MATCHES"             : "تطبیق ها",
    "FIND_IN_FILES_MORE_THAN"           : "بیش تر از ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "پرونده: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "خط: {0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "خطا در دریافت اطلاعات بروز رسانی",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "خطا بهنگام دریافت آخرین اطلاعات بروزرسانی از سرویس دهنده رخ داده. اطمینان حاصل کنید که به اینترنت متصلید و سپس دوباره تلاش کنید.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "درحال بارگذاری\u2026",
    "UNTITLED"          : "عنوان گذاری نشده",
    "WORKING_FILES"     : "پرونده های کاری",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "خط {0}, ستون {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} ستون انتخاب شده",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} ستون انتخاب شده",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} خط انتخاب شده",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} خط انتخاب شده",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "کلیک کنید تا به این فضاها منتقل شوید",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "کلیک کنید تا به این زبانه ها منتقل شوید",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Click to change number of spaces used when indenting",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "کلیک کنید تا طول زبانه کاراکتر ها تغییر کند",
    "STATUSBAR_SPACES"                      : "فاصله",
    "STATUSBAR_TAB_SIZE"                    : "اندازه زبانه",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} خط",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} خط ها",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "پرونده",
    "CMD_FILE_NEW_UNTITLED"               : "جدید",
    "CMD_FILE_NEW"                        : "پرونده جدید",
    "CMD_FILE_NEW_FOLDER"                 : "پوشه جدید",
    "CMD_FILE_OPEN"                       : "باز کردن\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "افزودن به محیط کاری",
    "CMD_OPEN_FOLDER"                     : "باز کردن پوشه\u2026",
    "CMD_FILE_CLOSE"                      : "بستن",
    "CMD_FILE_CLOSE_ALL"                  : "بستن همه",
    "CMD_FILE_SAVE"                       : "ذخیره",
    "CMD_FILE_SAVE_ALL"                   : "ذخیره همه",
    "CMD_FILE_SAVE_AS"                    : "ذخیره همه\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "پیش نمایش زنده",
    "CMD_PROJECT_SETTINGS"                : "تنظیمات پروژه\u2026",
    "CMD_FILE_RENAME"                     : "تغییر نام",
    "CMD_FILE_DELETE"                     : "حذف",
    "CMD_INSTALL_EXTENSION"               : "نصب افزونه ها\u2026",
    "CMD_EXTENSION_MANAGER"               : "مدیریت افزونه ها\u2026",
    "CMD_FILE_REFRESH"                    : "تازه سازی درختی پرونده",
    "CMD_QUIT"                            : "رها سازی",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "خروج",

    // Edit menu commands
    "EDIT_MENU"                           : "ویرایش",
    "CMD_UNDO"                            : "Undo",
    "CMD_REDO"                            : "Redo",
    "CMD_CUT"                             : "بریدن",
    "CMD_COPY"                            : "رونوشت",
    "CMD_PASTE"                           : "چسباندن رو نوشت",
    "CMD_SELECT_ALL"                      : "انتخاب همه",
    "CMD_SELECT_LINE"                     : "انتخاب خط",
    "CMD_FIND"                            : "جستجو",
    "CMD_FIND_IN_FILES"                   : "جستجو در پرونده ها",
    "CMD_FIND_IN_SUBTREE"                 : "جستجو در\u2026",
    "CMD_FIND_NEXT"                       : "بعدی",
    "CMD_FIND_PREVIOUS"                   : "قبلی",
    "CMD_REPLACE"                         : "جستجو و جایگزینی",
    "CMD_INDENT"                          : "یک فاصله از چپ",
    "CMD_UNINDENT"                        : "حذف یک فاصله از جپ",
    "CMD_DUPLICATE"                       : "دونسخه کردن خط",
    "CMD_DELETE_LINES"                    : "حذف خط",
    "CMD_COMMENT"                         : "تعویض خط به نظر",
    "CMD_BLOCK_COMMENT"                   : "تعویض نظر به خط",
    "CMD_LINE_UP"                         : "خط را یکی به بالا ببر",
    "CMD_LINE_DOWN"                       : "خط را یکی به پایین ببر",
    "CMD_OPEN_LINE_ABOVE"                 : "باز کردن خط بالا",
    "CMD_OPEN_LINE_BELOW"                 : "باز کردن خط زیرین",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "پرانتزها را خودکار ببند",
    "CMD_SHOW_CODE_HINTS"                 : "نمایش نکات کد",
    
    // View menu commands
    "VIEW_MENU"                           : "نمایش",
    "CMD_HIDE_SIDEBAR"                    : "پنهان کردن نوار کاری",
    "CMD_SHOW_SIDEBAR"                    : "نمایش نوار",
    "CMD_INCREASE_FONT_SIZE"              : "افزایش سایز نوشته ها",
    "CMD_DECREASE_FONT_SIZE"              : "کاهش سایز نوشته ها",
    "CMD_RESTORE_FONT_SIZE"               : "پیشفرض سایز نوشته ها",
    "CMD_SCROLL_LINE_UP"                  : "حرکت به بالا",
    "CMD_SCROLL_LINE_DOWN"                : "حرکت به پایین",
    "CMD_TOGGLE_LINE_NUMBERS"             : "شماره گذاری خط ها",
    "CMD_TOGGLE_ACTIVE_LINE"              : "نشانه گذاری خط فعال",
    "CMD_TOGGLE_WORD_WRAP"                : "شکستن عبارات طولانی",
	"CMD_LIVE_HIGHLIGHT"                  : "نشانه گذاری پیش نمایش",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "نشانه گذاری فایل های تغییر یافته برای ذخیره سازی",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "مرتب سازی بر اساس ترتیب افزودن",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "مرتب سازی بر اساس نام",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "مرتب سازی بر اساس نوع",
    "CMD_SORT_WORKINGSET_AUTO"            : "مرتب سازی خودکار",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "انتقال",
    "CMD_QUICK_OPEN"                      : "باز کردن سریع",
    "CMD_GOTO_LINE"                       : "برو به خط",
    "CMD_GOTO_DEFINITION"                 : "تعریف جستجوی سریع",
    "CMD_TOGGLE_QUICK_EDIT"               : "ویرایش سریع",
    "CMD_TOGGLE_QUICK_DOCS"               : "مستند گزاری سریع",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "تطبیق یافته قبلی",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "تطبیق یافته بعدی",
    "CMD_NEXT_DOC"                        : "سند بعدی",
    "CMD_PREV_DOC"                        : "سند قبلی",
    "CMD_SHOW_IN_TREE"                    : "نمایش پرونده در میان پرونده های کاری",
    "CMD_SHOW_IN_OS"                      : "نمایش در OS",
    
    // Help menu commands
    "HELP_MENU"                           : "راهنما",
    "CMD_CHECK_FOR_UPDATE"                : "برسی برای بروزرسانی",
    "CMD_HOW_TO_USE_BRACKETS"             : "چگونه از براکتس استفاده کنم",
    "CMD_FORUM"                           : "انجمن گفتگوی براکتس",
    "CMD_RELEASE_NOTES"                   : "نکات انتشار",
    "CMD_REPORT_AN_ISSUE"                 : "گزارش یک مورد اشکال",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "نمایش پوشه افزونه ها",
    "CMD_TWITTER"                         : "{TWITTER_NAME} در تویتر",
    "CMD_ABOUT"                           : "پیرامون براکتس",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "بستن پنجره",
    "CMD_ABORT_QUIT"                      : "لغو ترک",
    "CMD_BEFORE_MENUPOPUP"                : "قبل از منوی Popup",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimental build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "OK"                                   : "تائید",
    "DONT_SAVE"                            : "ذخیره نکن",
    "SAVE"                                 : "ذخیره",
    "CANCEL"                               : "لغو",
    "DELETE"                               : "حذف",
    "RELOAD_FROM_DISK"                     : "دوباره بارگذاری کن از دیسک",
    "KEEP_CHANGES_IN_EDITOR"               : "تغییرات در ویرایشگر را نگه دار",
    "CLOSE_DONT_SAVE"                      : "بستن(بدون ذخیره سازی)",
    "RELAUNCH_CHROME"                      : "اجرای دوباره Chrome",
    "ABOUT"                                : "پیرامون",
    "CLOSE"                                : "بستن",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "<div style='direction:rtl;margin-right:3px;'>یادداشتهای ها، شرایط و ضوابط مربوط به نرم افزار و حقوق شخص ثالث در آدرس<a href='#' class='clickable-link' data-href='http://www.adobe.com/go/thirdparty/'>http://www.adobe.com/go/thirdparty/</a> جهت تلفیق و بعنوان مرجع قرار داده شده.",
    "ABOUT_TEXT_LINE4"                     : "اسناد، نکات و منابع نرم افزار در پیوند <a href='#' class='clickable-link' data-href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a> در دسترس می باشد. می توانید جهت مشاهده سریع بروزرسانی های قبل از انتشار نرم افزار بهمین لینک مراجعه فرمایید.<br><b>ترجمه توسط محمد یعقوبی<b>",
    "ABOUT_TEXT_LINE5"                     : "ساخته شده با \u2764 و JavaScript و بدست:",
    "ABOUT_TEXT_LINE6"                     : "بسیاری از مردم",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='#' class='clickable-link' data-href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Build جدیدی ازبراکتس هم اکنون در دسترس است! جهت مشاهده جزئیات کلیک کنید.",
    "UPDATE_AVAILABLE_TITLE"               : "بروزرسانی جدید در دسترس است",
    "UPDATE_MESSAGE"                       : "نسخه جدیدی از براکتس هم اکنون در دسترس است. برخی از مشخصه های آن:",
    "GET_IT_NOW"                           : "هم اکنون دانلود کنید!",
    "PROJECT_SETTINGS_TITLE"               : "تنظیمات پروژه برای: {0}",
    "PROJECT_SETTING_BASE_URL"             : "پیش نمایش URL اصلی/پایه",
    "PROJECT_SETTING_BASE_URL_HINT"        : "جهت استفاده از سرویس دهنده داخلی, از url بمانند http://localhost:8000/ استفاده کنید.",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "پروتکول {0} با پیش نمایش زنده پشتیبانی نمی شود&mdash;لطفا از http: یا https: استفاده نمایید.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL اصلی نمی تواند شامل پارامترهای جستجو بمانند \"{0}\" باشد.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL اصلی نمی تواند hashes مشابه \"{0}\" داشته باشد.",
    "BASEURL_ERROR_INVALID_CHAR"           : "برخی کاراکتر های خاص شبیه '{0}' می بایست %-encoded.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "خطای ناشناخته در URL اصلی/پایه",
    
    // Extension Management strings
    "INSTALL"                              : "نصب",
    "UPDATE"                               : "بروزرسانی",
    "REMOVE"                               : "حذف",
    "OVERWRITE"                            : "دوباره نویسی",
    "CANT_REMOVE_DEV"                      : "افزونه های موجود در پوشه \"dev\" می بایست بصورت دستی حذف گردند.",
    "CANT_UPDATE"                          : "بروز رسانی سازگار با این نسخه از براکتس نیست.",
    "INSTALL_EXTENSION_TITLE"              : "نصب افزونه",
    "UPDATE_EXTENSION_TITLE"               : "بروز رسانی افزونه",
    "INSTALL_EXTENSION_LABEL"              : "URL افزونه",
    "INSTALL_EXTENSION_HINT"               : "URL افزونه های دارای پرونده zip یا مخازن Github",
    "INSTALLING_FROM"                      : "نصب افزونه ها از {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "نصب با موفقیت به اتمام رسید!",
    "INSTALL_FAILED"                       : "نصب نا موفق.",
    "CANCELING_INSTALL"                    : "درحال لغو\u2026",
    "CANCELING_HUNG"                       : "عملیات لغو نصب زمان طولانیی به طول خواهد کشید. خطا یا خطا های داخلی ممکن است رخ دهد.",
    "INSTALL_CANCELED"                     : "فرایند نصب لفو گردید.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "محتوای دانلود شده دارای پرونده zip معتبر نمی باشد.",
    "INVALID_PACKAGE_JSON"                 : "پرونده package.json معتبر نمی باشد (error was: {0}).",
    "MISSING_PACKAGE_NAME"                 : "پرونده package.json دارای خطا در نام می باشد.",
    "BAD_PACKAGE_NAME"                     : "نام بسته {0} نامعتبر می باشد.",
    "MISSING_PACKAGE_VERSION"              : "پرونده package.json دارای خطا در نسخه می باشد.",
    "INVALID_VERSION_NUMBER"               : "عدد نسخه این بسته ({0}) نا معتبر می باشد.",
    "INVALID_BRACKETS_VERSION"             : "خطا در سازگاری براکتس با رشته نامعتبر({0}).",
    "DISALLOWED_WORDS"                     : "عبارت ({1}) اجازه وارد سازی در این فیلد را ندارد {0}.",
    "API_NOT_COMPATIBLE"                   : "افزونه با این نسخه از برنامه براکتس سازگار نیست. در پوشه افزونه های قابل نمایش نصب نشد.",
    "MISSING_MAIN"                         : "بسته حاوی پرونده main.js نیست.",
    "EXTENSION_ALREADY_INSTALLED"          : "نصب این بسته سبب دوباره نویسی پرونده های افزونه قبلی می شود. دوباره نویسی صورت گیرد?",
    "EXTENSION_SAME_VERSION"               : "نسخه این بسته با نسخه بسته ای که هم اکنون نصب می باشد برابر است. آیا افزونه دوباره نویسی گردد?",
    "EXTENSION_OLDER_VERSION"              : "این بسته نسخه {0} هست قبل تر نصب شده({1}). آیا این افزونه دوباره نویسی گردد?",
    "DOWNLOAD_ID_IN_USE"                   : "خطای داخلی: این ID دانلود هم اکنون درحال استفاده است.",
    "NO_SERVER_RESPONSE"                   : "ناتوان در اتصال به سرویس دهنده.",
    "BAD_HTTP_STATUS"                      : "پرونده در سرویس دهنده یافت نشد (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "ناتوان در ذخیره دانلود در یک پرونده خالی.",
    "ERROR_LOADING"                        : "این افزونه بهنگام شروع با خطا مواجه می شود.",
    "MALFORMED_URL"                        : "آدرس URL نا معتبر است. لطفا آن را برسی کرده و آدرس معتبر وارد سازید.",
    "UNSUPPORTED_PROTOCOL"                 : "آدرس URL می بایست http یا https باشد.",
    "UNKNOWN_ERROR"                        : "خطای داخلی نامشخص.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "مدیریت افزونه ها",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "ناتوان در دسترسی به افزونه های ثبت شده. لطفا بعدا تلاش کنید.",
    "INSTALL_FROM_URL"                     : "نصب از URL\u2026",
    "EXTENSION_AUTHOR"                     : "مولف",
    "EXTENSION_DATE"                       : "تاریخ",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "این افزونه احتیاج به نسخه جدیدی از براکتس دارد.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "نسخه فعلی این افزونه فقط با نسخه های قبلی براکتس سازگار است.",
    "EXTENSION_NO_DESCRIPTION"             : "بدون شرح",
    "EXTENSION_MORE_INFO"                  : "اطلاعات بیشتر...",
    "EXTENSION_ERROR"                      : "خطای افزونه",
    "EXTENSION_KEYWORDS"                   : "کلمات کلیدی",
    "EXTENSION_INSTALLED"                  : "نصب شده",
    "EXTENSION_UPDATE_INSTALLED"           : "این افزونه دریافت شده و بعد از ترک براکتس نصب خواهد شد.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "جستجو",
    "EXTENSION_MORE_INFO_LINK"             : "بیشتر",
    "BROWSE_EXTENSIONS"                    : "پیمایش افزونه ها",
    "EXTENSION_MANAGER_REMOVE"             : "حذف افزونه",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "ناتوان در حذف یک یا برخی از افزونه ها: {0}. براکتس درحال ترک.",
    "EXTENSION_MANAGER_UPDATE"             : "بروزرسانی افزونه",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "ناتوان در بروزرسانی یک یا برخی از افزونه ها: {0}. براکتس درحال ترک.",
    "MARKED_FOR_REMOVAL"                   : "نشانه گذاری جهت حذف",
    "UNDO_REMOVE"                          : "Undo",
    "MARKED_FOR_UPDATE"                    : "انتخاب شده برای بروزرسانی",
    "UNDO_UPDATE"                          : "Undo",
    "CHANGE_AND_QUIT_TITLE"                : "تغییر در افزونه ها",
    "CHANGE_AND_QUIT_MESSAGE"              : "جهت بروزرسانی یا حذف افزونه ها می بایست براکتس را ترک و دوباره اجرا کنید. شما می بایست تغییرات ذخیره نشده را ذخیره نمایید.",
    "REMOVE_AND_QUIT"                      : "حذف افزونه ها و ترک(خروج)",
    "CHANGE_AND_QUIT"                      : "تغییر افزونه ها و ترک",
    "UPDATE_AND_QUIT"                      : "بروزرسانی افزونه ها و ترک",
    "EXTENSION_NOT_INSTALLED"              : "ناتوان در حذف افزونه {0} زیرا این افزونه بدرستی نصب نشده.",
    "NO_EXTENSIONS"                        : "هیچ افزونه ای نصب نشده.<br>جهت شروع بر روی زبانه در درسترس بالا کلیک کنید.",
    "NO_EXTENSION_MATCHES"                 : "هیچ افزونه ای منطبق با جستجوی شما پیدا نشد.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "بموقع نصب افزونه ها احتیاط جهت نصب افزونه های با منبع نا مشخص ضروری است.",
    "EXTENSIONS_INSTALLED_TITLE"           : "نصب شده",
    "EXTENSIONS_AVAILABLE_TITLE"           : "در دسترس",
    "EXTENSIONS_UPDATES_TITLE"             : "بروزرسانی ها",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixels",
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "خطا یابی",
    "CMD_SHOW_DEV_TOOLS"                        : "نمایش ابزار های توسعه دهندگان",
    "CMD_REFRESH_WINDOW"                        : "بارگذاری مجدد براکتس",
    "CMD_NEW_BRACKETS_WINDOW"                   : "یک پنجره جدید از براکتس باز کنید",
    "CMD_SWITCH_LANGUAGE"                       : "انتخاب زبان",
    "CMD_RUN_UNIT_TESTS"                        : "برسی برای اجرا",
    "CMD_SHOW_PERF_DATA"                        : "نمایش داده های عملکردی",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "فعال سازی اشکال زدای گرهی",
    "CMD_LOG_NODE_STATE"                        : "ورود گره به حالت کنسول",
    "CMD_RESTART_NODE"                          : "شروع دوباره گره",
    
    "LANGUAGE_TITLE"                            : "انتخاب زبان",
    "LANGUAGE_MESSAGE"                          : "زبان:",
    "LANGUAGE_SUBMIT"                           : "بارگذاری مجدد براکتس",
    "LANGUAGE_CANCEL"                           : "لغو",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "زبان پیش فرض",
    
    /**
     * Locales
     */
    "LOCALE_CS"                                 : "Czech",
    "LOCALE_DE"                                 : "German",
    "LOCALE_EN"                                 : "English",
    "LOCALE_ES"                                 : "Spanish",
    "LOCALE_FI"                                 : "Finnish",
    "LOCALE_FR"                                 : "French",
    "LOCALE_IT"                                 : "Italian",
    "LOCALE_JA"                                 : "Japanese",
    "LOCALE_NB"                                 : "Norwegian",
    "LOCALE_FA_IR"                              : "Persian-پارسی",
    "LOCALE_PL"                                 : "Polish",
    "LOCALE_PT_BR"                              : "Portuguese, Brazil",
    "LOCALE_PT_PT"                              : "Portuguese",
    "LOCALE_RU"                                 : "Russian",
    "LOCALE_SV"                                 : "Swedish",
    "LOCALE_TR"                                 : "Turkish",
    "LOCALE_ZH_CN"                              : "Chinese, simplified",
    "LOCALE_HU"                                 : "Hungarian",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "رنگ فعلی",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "رنگ اصلی",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa قالب",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex قالب",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa قالب",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} ({1} بار استفاده شده)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} ({1} بار استفاده شده)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "پرش جهت تعریف",
    "CMD_SHOW_PARAMETER_HINT"                   : "نمایش پارامتر",
    "NO_ARGUMENTS"                              : "<بدون پارامتر>",

    // extensions/default/JSLint
    "CMD_JSLINT"                                : "فعال سازی JSLint",
    "CMD_JSLINT_FIRST_ERROR"                    : "رجوء به اولی خطای JSLint",
    "JSLINT_ERRORS"                             : "خطاهای JSLint",
    "JSLINT_ERROR_INFORMATION"                  : "یک خطای JSLint",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} خطای JSLint",
    "JSLINT_NO_ERRORS"                          : "JSLint بدون خطای - ایول!",
    "JSLINT_DISABLED"                           : "JSLint یا نافعال است و یا برای پرونده فعلی کار نمی کند",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "نمایش سریع با اشاره",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "بیشتر بخوانید"
});