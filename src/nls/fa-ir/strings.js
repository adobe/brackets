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
    "APP_NAME"                          : "براکتس",
    "GENERIC_ERROR"                     : "(خطا {0})",
    "NOT_FOUND_ERR"                     : "پرونده پیدا نشد.",
    "NOT_READABLE_ERR"                  : "پرونده قابل خواندن نیست.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "دایرکتوری هدف قابل ویرایش نیست.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "دسترسی های تعریف شده برای شما اجازه تغییرات را نمی دهند.",
    "CONTENTS_MODIFIED_ERR"             : "این پرونده قبل خارج از محیط این نرم افزار ویرایش شده است.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} فعلا تنها از پرونده ها با ساختار یونیکدی UTF-8 پشتیبانی می کند.",
    "FILE_EXISTS_ERR"                   : "پرونده یا پوشه مد نظر موجود می باشد.",
    "FILE"                              : "پرونده",
    "DIRECTORY"                         : "پوشه",
    "DIRECTORY_NAMES_LEDE"              : "نام های پوشه",
    "FILENAMES_LEDE"                    : "نام های پرونده",
    "FILENAME"                          : "نام پرونده",
    "DIRECTORY_NAME"                    : "نام پوشه",

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
    "INVALID_FILENAME_MESSAGE"          : "نام پرونده نمی تواند شامل مقادیر زیر باشد: {0} و همچنین نمی توانید از عبارات مورد استفاده نرم افزار استفاده نمایید.",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "پوشه یا پروندهی با نام <span class='dialog-filename'>{0}</span> هم اکنون موجود است.",
    "ERROR_CREATING_FILE_TITLE"         : "خطا در ایجاد {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE" : "خطا در خواندن تنظیمات",
    "ERROR_PREFS_CORRUPT" : "پرونده تنظیمات شما از نوع پرونده JSON معتبر نیست. از آنجایی که پرونده قابل دسترسی و خواندن است، میتواند بصورت دستی توسط شما تصحیح گردد. البته جهت اعمال تغییرات می بایست {APP_NAME} بارگذاری مجدد گردد.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "!!! براکتس در مرورگرها اجرا نمی شود.",
    "ERROR_IN_BROWSER"                  : "براکتس با HTML ساخته شده, ولی هم اکنون بعنوان یک برنامه رومیزی(desktop) اجرا می شود و شما می توانید از آن جهت ویرایش پرونده های خود استفاده نمایید.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "خطا در فهرست بندی پرونده ها",
    "ERROR_MAX_FILES"                   : "مقدار پرونده های قابل فهرست بندی به حداکثر رسیده بهمین علیت عملگر بهنگام فهرست بندی با خطا مواجه می شود.",

    // Live Preview error strings 
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
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "پیش نمایش زنده(به دلیل خطا در نحو بروزرسانی نشده است)",
    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "پیش نمایش زنده لغو شد زیرا از برخی از ابزارهای توسعه مختص مرورگرتان استفاده کرده اید.",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "پیش نمایش زنده لغو شد زیرا پنجره یا زبانه مربوط به صفحه در مرورگر بسته شده.",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "پیش نمایش زنده لغو شد زیرا پنجره یا زبانه موجود در مرورگر آدرس دیگری را پیمایش کرده است.",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "پیش نمایش زنده به دلیل نامشخصی لغو شد ({0})",
    "SAVE_CLOSE_TITLE"                  : "ذخیره تغییرات",
    "SAVE_CLOSE_MESSAGE"                : "آیا مایلید تغییرات داده شده در سند ذخیره گردند <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "آیا مایلید تغییرات داده شده در پرونده های زیر، ذخیره گردند?",
    "EXT_MODIFIED_TITLE"                : "تغییرات خارجی",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "تائید حذف",
    "CONFIRM_FOLDER_DELETE"             : "آیا مطمئنید می خواهید این پوشه حذف گردد <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "پرونده حذف گردید",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> خارج از براکتس ویرایش شده.<br /><br />آیا می خواهید پرونده را ذخیره و و تغییراتی را که دادید دوباره بر روی پرونده ویرایش شده اعمال نمایید؟",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> تغییراتی بر روی دیسک انجام شده, ولی تغییرات بر روی براکتس ذخیره نگردیده.<br /><br />کدام نسخه را می خواهید نگه دارید?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> برخی مقادیر از دیسک حذف شده, ولی تغییرات بر روی براکتس اعمال/ذخیره نشده.<br /><br />آیا می خواهید تغییرات را حفظ کنید?",


    // Generic dialog/button labels
    "OK"                                : "تائید",
    "CANCEL"                            : "لغو",
    "DONT_SAVE"                         : "ذخیره نکن",
    "SAVE"                              : "ذخیره",
    "SAVE_AS"                           : "ذخیره بعنوان\u2026",
    "SAVE_AND_OVERWRITE"                : "ذخیره/دوباره نویسی پرونده",
    "DELETE"                            : "حذف",
    "BUTTON_YES"                        : "بله",
    "BUTTON_NO"                         : "خیر",

    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} نتیجه",
    "FIND_RESULT_COUNT_SINGLE"          : "1 نتیجه",
    "FIND_NO_RESULTS"                   : "بدون نتیجه",
    "REPLACE_PLACEHOLDER"               : "جایگزینی با\u2026",
    "BUTTON_REPLACE_ALL"                : "همه\u2026",
    "BUTTON_REPLACE"                    : "جایگزینی",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "مورد بعدی",
    "BUTTON_PREV_HINT"                  : "مورد قبلی",
    "BUTTON_CASESENSITIVE_HINT"         : "مورد تطبیق یافته",
    "BUTTON_REGEXP_HINT"                : "عبارت منظم",
    "OPEN_FILE"                         : "باز کردن پرونده",
    "SAVE_FILE_AS"                      : "ذخیره پرونده",
    "CHOOSE_FOLDER"                     : "انتخاب پوشه",
    "RELEASE_NOTES"                     : "نکات و یادداشت های انتشار",
    "NO_UPDATE_TITLE"                   : "بروز هستید!",
    "NO_UPDATE_MESSAGE"                 : "شما درحال استفاده از آخرین نسخه براکتس هستید.",

   // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1"          : "جایگزینی \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" با \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    // Find in Files
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" پیدا شد",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} در {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "در <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "در پروژ]",
    "FIND_IN_FILES_ZERO_FILES"          : "فیلترسازی تمامی پرونده های منع شده {0}",
    "FIND_IN_FILES_FILE"                : "پرونده",
    "FIND_IN_FILES_FILES"               : "پرونده ها",
    "FIND_IN_FILES_MATCH"               : "تطبیق",
    "FIND_IN_FILES_MATCHES"             : "تطبیق ها",
    "FIND_IN_FILES_MORE_THAN"           : "بیش تر از ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "پرونده: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "جهت بازکردن/بستن منوها کلید Ctrl/Cmd را گرفته و کلیک کنید.",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "درحال بروزرسانی اطلاعات خطا",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "بروز خطا در هنگام دستیابی به آخرین اطلاعات بروزرسانی از سرویس دهنده. اطمینان حاصل کنید که به اینترنت متصل بوده و دوباره تلاش نمایید.",

    // File exclusion filters
    "NO_FILE_FILTER"                    : "این پرونده ها محروم شده نیستند",
    "EXCLUDE_FILE_FILTER"                : "منع {0}",
    "EDIT_FILE_FILTER"                    : "ویرایش\u2026",
    "FILE_FILTER_DIALOG"                : "ویرایش محرومیت(منعیت پرونده)",
    "FILE_FILTER_INSTRUCTIONS"            : "محروم سازی پرونده ها و پوشه های منطبق با عبارات زیر یا برخی <a href='{0}' title='{0}'>نویسه های عام</a>. هر عبارت را در یک سطر جدید وارد کنید.",
    "FILE_FILTER_LIST_PREFIX"            : "جز",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "و {0} بیشتر",
    "FILTER_COUNTING_FILES"            : "شمارش پرونده ها\u2026",
    "FILTER_FILE_COUNT"                : "همیشه {0} از {1} پرونده {2}",
    "FILTER_FILE_COUNT_ALL"            : "تائید {0} پرونده {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND" : "امکان ویرایش سریع برای مکان فعلی نشانگر موجود نمی باشد",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES" : "ویرایشگر سریع CSS: نشان گر را روی یک کلاس قرار دهید",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND" : "ویرایشگر سریع CSS: صفات/خصوصیات این کلاس کامل نیست",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND" : "ویرایشگر سریع CSS: صفات/خصوصیات این id کامل نیست",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR" : "ویرایشگر سریع CSS: نشانگر را بر روی یک تگ، کلاس یا id قرار دهید",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX" : "تابع زمانبندی ویرایشگر سریع CSS: خطا در نحو",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND" : "ویرایشگر سریع JS: نشانگر را روی نام تابع قرار دهید",

     // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "سند سریع برای مکان فعلی نمایشگر مکان موجود نمی باشد",
     
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
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} انتخاب شده ها",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "کلیک کنید تا به این فضاها منتقل شوید",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "کلیک کنید تا به این زبانه ها منتقل شوید",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "جهت تغییر تعداد فضاهای خالی استفاده شده در هنگام فاصله دهی خطوط از چپ، کلیک کنید",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "کلیک کنید تا طول زبانه کاراکتر ها تغییر کند",
    "STATUSBAR_SPACES"                      : "فاصله",
    "STATUSBAR_TAB_SIZE"                    : "اندازه زبانه",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} خط",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} خط ها",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "غیرفعال سازی افزونه ها",
    "STATUSBAR_INSERT"                        : "واردسازی",
    "STATUSBAR_OVERWRITE"                    : "دوباره نویسی",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} خطا",
    "SINGLE_ERROR"                          : "1 {0} خطا",
    "MULTIPLE_ERRORS"                       : "{1} {0} خطا",
    "NO_ERRORS"                             : "هیچ خطایی یافت نشد {0} - کارت درسته!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "خطایی پیدا نشد - کارت درسته!",
    "LINT_DISABLED"                         : "Linting غیرفعال شد",
    "NO_LINT_AVAILABLE"                     : "linter برای {0} دردسترس نیست",
    "NOTHING_TO_LINT"                       : "احتیاج به lint وجود ندارد",
    "LINTER_TIMED_OUT"                        : "فعالیت{0} پس از انتظار بمدت{1} ثانیه خاتمه یافت",
    "LINTER_FAILED"                            : "{0} با خطای زیر پایان یافته: {1}",

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
    "CMD_OPEN_DROPPED_FILES"              : "بازکردن پرونده های درنظر گرفته نشده",
    "CMD_OPEN_FOLDER"                     : "باز کردن پوشه\u2026",
    "CMD_FILE_CLOSE"                      : "بستن",
    "CMD_FILE_CLOSE_ALL"                  : "بستن همه",
    "CMD_FILE_CLOSE_LIST"                 : "بستن لیست",
    "CMD_FILE_CLOSE_OTHERS"               : "بستن سایر موارد",
    "CMD_FILE_CLOSE_ABOVE"                : "بستن موارد بالایی",
    "CMD_FILE_CLOSE_BELOW"                : "بستن موارد پایینی",
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
    "CMD_QUIT"                            : "خروج",

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
    "CMD_SPLIT_SEL_INTO_LINES"            : "تقسیم انتخاب شده به چند سطر",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "افزودن نشانگر به سطر بعدی",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "افزودن نشانگر به سطر بعدی",
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

    // Search menu commands
    "FIND_MENU"                           : "جستجو",
    "CMD_FIND"                            : "جستجو",
    "CMD_FIND_FIELD_PLACEHOLDER"          : "جستجو\u2026",
    "CMD_FIND_NEXT"                       : "بعدی",
    "CMD_FIND_PREVIOUS"                   : "قبلی",
    "CMD_FIND_ALL_AND_SELECT"             : "جستجو برای تمامی موارد و انتخاب آن ها",
    "CMD_ADD_NEXT_MATCH"                  : "عبارت انطباق یافته بعدی را به انتخاب شده ها اضافه کن",
    "CMD_SKIP_CURRENT_MATCH"              : "پرش از این مورد و افزودن مورد انطباق یافته بعدی",
    "CMD_FIND_IN_FILES"                   : "جستجو در پرونده ها",
    "CMD_FIND_IN_SELECTED"                : "جستجو در پرونده/پوشه انتخاب شده",
    "CMD_FIND_IN_SUBTREE"                 : "جستجو در\u2026",
    "CMD_REPLACE"                         : "جستجو و جایگزینی",

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
    "CMD_VIEW_TOGGLE_INSPECTION"          : "نشانه گذاری پرونده های تغییر یافته برای ذخیره سازی",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "مرتب سازی بر اساس ترتیب افزودن",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "مرتب سازی بر اساس نام",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "مرتب سازی بر اساس نوع",
    "CMD_SORT_WORKINGSET_AUTO"            : "مرتب سازی خودکار",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "انتقال",
    "CMD_QUICK_OPEN"                      : "باز کردن سریع",
    "CMD_GOTO_LINE"                       : "برو به خط",
    "CMD_GOTO_DEFINITION"                 : "تعریف جستجوی سریع",
    "CMD_GOTO_FIRST_PROBLEM"              : "رجوء با اولین خطا/اخطار",
    "CMD_TOGGLE_QUICK_EDIT"               : "ویرایش سریع",
    "CMD_TOGGLE_QUICK_DOCS"               : "مستند گزاری سریع",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "تطبیق یافته قبلی",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "تطبیق یافته بعدی",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "قاعده جدید",
    "CMD_NEXT_DOC"                        : "سند بعدی",
    "CMD_PREV_DOC"                        : "سند قبلی",
    "CMD_SHOW_IN_TREE"                    : "نمایش پرونده در میان پرونده های کاری",
    "CMD_SHOW_IN_EXPLORER"                : "نمایش در مرورگر",
    "CMD_SHOW_IN_FINDER"                  : "نمایش در جستجوگر",
    "CMD_SHOW_IN_OS"                      : "نمایش در OS",

    // Help menu commands
    "HELP_MENU"                           : "راهنما",
    "CMD_CHECK_FOR_UPDATE"                : "بررسی برای بروزرسانی",
    "CMD_HOW_TO_USE_BRACKETS"             : "چگونه از {APP_NAME} استفاده کنیم",
    "CMD_SUPPORT"                         : "پشتیبانی {APP_NAME}",
    "CMD_SUGGEST"                         : "پیشنهاد یک امکان جدید",
    "CMD_RELEASE_NOTES"                   : "نکات انتشار",
    "CMD_GET_INVOLVED"                    : "درگیرش شوید",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "نمایش پوشه افزونه ها",
    "CMD_HOMEPAGE"                        : "صفحه خانگی {APP_TITLE} در وب",
    "CMD_TWITTER"                         : "{TWITTER_NAME} در تویتر",
    "CMD_ABOUT"                           : "پیرامون براکتس",
    "CMD_OPEN_PREFERENCES"                : "بازکردن پرونده تنظیمات",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimental build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "RELOAD_FROM_DISK"                     : "دوباره بارگذاری کن از دیسک",
    "KEEP_CHANGES_IN_EDITOR"               : "تغییرات در ویرایشگر را نگه دار",
    "CLOSE_DONT_SAVE"                      : "بستن(بدون ذخیره سازی)",
    "RELAUNCH_CHROME"                      : "اجرای دوباره Chrome",
    "ABOUT"                                : "پیرامون",
    "CLOSE"                                : "بستن",
    "ABOUT_TEXT_LINE1"                     : "پیش روی {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
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
    "BASEURL_ERROR_UNKNOWN_ERROR"           : "خطای ناشناخته در URL اصلی/پایه",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "قائده جدید",

    // Extension Management strings
    "INSTALL"                              : "نصب",
    "UPDATE"                               : "بروزرسانی",
    "REMOVE"                               : "حذف",
    "OVERWRITE"                            : "دوباره نویسی",
    "CANT_REMOVE_DEV"                      : "افزونه های موجود در پوشه \"dev\" می بایست بصورت دستی حذف گردند.",
    "CANT_UPDATE"                          : "بروز رسانی سازگار با این نسخه از براکتس نیست.",
    "CANT_UPDATE_DEV"                      : "افزونه موجود در پوشه \"dev\" قادر به بروزرسانی خودکار نیست.",
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
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "نسخه {0} از این افزونه نیازمند نسخه جدیدی از {APP_NAME} می باشد. ولی شما می توانید یک نسخه پایین تر از {1} را نصب کنید.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "نسخه {0} از این افزونه تنها با نسخه های قدیمی {APP_NAME} سازگار است. با این وجود شما می توانید از نسخه های پایین تر {1} استفاده کنید.",
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
    "CHANGE_AND_RELOAD_TITLE"              : "تغییر افزونه ها و بارگذاری مجدد",
    "CHANGE_AND_RELOAD_MESSAGE"            : "جهت بروزرسانی یا حذف افزونه های انتخاب شده براکتس احتیاج به بارگذاری مجدد دارد. تغییرات ذخیره نشده شما ذخیره خواهد شد.",
    "REMOVE_AND_RELOAD"                    : "حذف افزونه ها و بارگذاری مجدد",
    "CHANGE_AND_RELOAD"                    : "تغییر افزونه ها و بارگذاری مجدد",
    "UPDATE_AND_RELOAD"                    : "بروزرسانی افزونه ها و بارگذاری مجدد",
    "PROCESSING_EXTENSIONS"                : "درحال پردازش تغییرات\u2026",
    "EXTENSION_NOT_INSTALLED"              : "ناتوان در حذف افزونه {0} زیرا این افزونه بدرستی نصب نشده.",
    "NO_EXTENSIONS"                        : "هیچ افزونه ای نصب نشده.<br>جهت شروع بر روی زبانه در درسترس بالا کلیک کنید.",
    "NO_EXTENSION_MATCHES"                 : "هیچ افزونه ای منطبق با جستجوی شما پیدا نشد.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "بموقع نصب افزونه ها احتیاط جهت نصب افزونه های با منبع نا مشخص ضروری است.",

    "EXTENSIONS_INSTALLED_TITLE"           : "نصب شده",
    "EXTENSIONS_AVAILABLE_TITLE"           : "در دسترس",
    "EXTENSIONS_UPDATES_TITLE"             : "بروزرسانی ها",
    "INLINE_EDITOR_NO_MATCHES"             : "هیچ مورد سازگاری دردسترس نیست.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "هیچ قائده منطبقی برای CSSها نسبت به موردی که انتخاب کردید وجود ندارد.<br> از گزینه \"قائده جدید\" برای تغریف یک قائده جدید استفاده کنید.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "هیچ شیوه نامه ای-پرونده CSS- در پروژه شما وجود ندارد.<br>جهت تعریف قوائد CSS ابتدا یک پرونده شیوه نامه ایجاد کنید.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON" : "بزرگ تر",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "پیکسل",


    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "خطا یابی",
    "ERRORS"                                    : "خطاها",
    "CMD_SHOW_DEV_TOOLS"                        : "نمایش ابزار های توسعه دهندگان",
    "CMD_REFRESH_WINDOW"                        : "بارگذاری مجدد براکتس",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "بارگذاری مجدد براکتس بدون بارگذاری افزونه های کاربر",
    "CMD_NEW_BRACKETS_WINDOW"                   : "یک پنجره جدید از براکتس باز کنید",
    "CMD_SWITCH_LANGUAGE"                       : "انتخاب زبان",
    "CMD_RUN_UNIT_TESTS"                        : "برسی برای اجرا",
    "CMD_SHOW_PERF_DATA"                        : "نمایش داده های عملکردی",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "فعال سازی اشکال زدای گرهی",
    "CMD_LOG_NODE_STATE"                        : "ورود گره به حالت کنسول",
    "CMD_RESTART_NODE"                          : "شروع دوباره گره",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "نمایش خطاها در نوار وظیفه",
    "LANGUAGE_TITLE"                            : "انتخاب زبان",
    "LANGUAGE_MESSAGE"                          : "زبان:",
    "LANGUAGE_SUBMIT"                           : "بارگذاری مجدد براکتس",
    "LANGUAGE_CANCEL"                           : "لغو",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "زبان پیش فرض",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "زمان",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "پیشرفت",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Move selected point<br><kbd class='text'>Shift</kbd> Move by ten units<br><kbd class='text'>Tab</kbd> Switch points",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Increase or decrease steps<br><kbd>←</kbd><kbd>→</kbd> 'Start' or 'End'",
    "INLINE_TIMING_EDITOR_INVALID"              : "مقدار سابق <code>{0}</code> دیگر معتبر نمی باشد,زیرا تابع نمایش به مقدار <code>{1}</code> تغییر یافته. سند در اولین ویرایش بروزرسانی خواهد شد.",


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
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "مشاهده سریع بهنگام اشاره با ماوس",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "پروژه های اخیر",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "بیشتر"

});
/* Last translated for fda91311bc233c9ffe7c0053101e9aec00f7a920 */
