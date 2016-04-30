/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR"                     : "(خطا {0})",
    "NOT_FOUND_ERR"                     : "پرونده پیدا نشد.",
    "NOT_READABLE_ERR"                  : "پرونده قابل خواندن نیست.",
    "EXCEEDS_MAX_FILE_SIZE"             : "فایل های بزرگتر از {0} MB قابل ویرایش در {APP_NAME} نیست.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "دایرکتوری هدف قابل ویرایش نیست.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "دسترسی های تعریف شده برای شما اجازه تغییرات را نمی دهند.",
    "CONTENTS_MODIFIED_ERR"             : "فایل خارج از محیط {APP_NAME} تغییر یافته است.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} فعلا تنها از پرونده ها با ساختار یونیکدی UTF-8 پشتیبانی می کند.",
    "FILE_EXISTS_ERR"                   : "پرونده یا پوشه مد نظر موجود می باشد.",
    "FILE"                              : "پرونده",
    "FILE_TITLE"                        : "پرونده",
    "DIRECTORY"                         : "پوشه",
    "DIRECTORY_TITLE"                   : "پوشه",
    "DIRECTORY_NAMES_LEDE"              : "نام های پوشه",
    "FILENAMES_LEDE"                    : "نام های پرونده",
    "FILENAME"                          : "نام پرونده",
    "DIRECTORY_NAME"                    : "نام پوشه",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "خطا در بارگذاری پروژه",
    "OPEN_DIALOG_ERROR"                 : "خطا در باز کردن پرونده خوان. (خطا {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "خطا بهنگام بارگذاری پوشه <span class='dialog-filename'>{0}</span>. (خطا {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "بروز خطا در خواندن اطلاعات پوشه <span class='dialog-filename'>{0}</span>. (خطا {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "خطا در باز کردن پرونده",
    "ERROR_OPENING_FILE"                : "خطا بهنگام تلاش برای باز کردن پرونده <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "خطا بهنگام بارگذاری پرونده های زیر:",
    "ERROR_RELOADING_FILE_TITLE"        : "خطا در بارگذاری تغییرات از حافظه",
    "ERROR_RELOADING_FILE"              : "بروز خطا بهنگام تلاش برای بارگذاری پرونده <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "خطا در ذخیره سازی پرونده",
    "ERROR_SAVING_FILE"                 : "بروز خطا بهنگام تلاش جهت ذخیره پرونده <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "خطا در تغییر نام پرونده {0}",
    "ERROR_RENAMING_FILE"               : "بروز خطا بهنگام تلاش برای تغییر نام پرونده {2} <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "خطا در حذف پرونده {0}",
    "ERROR_DELETING_FILE"               : "بروز خطا بهنگام تلاش برای تغییر نام پرونده {2} <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "غیر مجاز {0}",
    "INVALID_FILENAME_MESSAGE"          : "{0} نمیتوانید از عبارات مورد استفاده نرم افزار, نقطه ها پایانی (.) یا کاراکترهای شامل موارد زیر استفاده کنید: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "پوشه یا پرونده ی با نام  <span class='dialog-filename'>{0}</span> هم اکنون موجود است.",
    "ERROR_CREATING_FILE_TITLE"         : "خطا در ایجاد {0}",
    "ERROR_CREATING_FILE"               : "خطا بهنگام ایجاد {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP"              : "نمی توان یک پوشه را همزمان به عنوان سایر فایل ها باز شده در نظر گرفت",

    // User key map error strings
    "ERROR_KEYMAP_TITLE"                : "خطا در خواندن نقشه ی کلید مورد استفاده",
    "ERROR_KEYMAP_CORRUPT"              : "فایل نقشه کلید شما در  JSON نامعتبر میباشد. زمانی فایل باز خواهد شده که شما آن را به شکل صحیح بنویسید.",
    "ERROR_LOADING_KEYMAP"              : "فایل نقشه کلید شما هست یک فایل متنی غیر معتبر با کدگذاری UTF-8 .و نمی توان بارگذاری شود",
    "ERROR_RESTRICTED_COMMANDS"         : "شما نمی توان با این دستور کلیدهای میانبر را اختصاص دهید: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"        : "شما این میانبرها را نمیتوانید اختصاص دهید: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"          : "شما با این دستور کلید میانبر چندگانه ایجاد کرده اید: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"         : "شما مقادیر متعددی برای این میانبر دارید: {0}",
    "ERROR_INVALID_SHORTCUTS"           : "این میانبر نامعتبر میباشد: {0}",
    "ERROR_NONEXISTENT_COMMANDS"        : "شما در حال اختصاص کلید میانبر برای دستوراتی که وجود ندارند هستید: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "خطا در خواندن تنظیمات",
    "ERROR_PREFS_CORRUPT"               :   "پرونده تنظیمات شما از نوع پرونده JSON معتبر نیست. از آنجایی که پرونده قابل دسترسی و خواندن است، میتواند بصورت دستی توسط شما تصحیح گردد. البته جهت اعمال تغییرات می بایست {APP_NAME} بارگذاری مجدد گردد.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : " متاسفم! {APP_NAME}اکنون در این مرورگر اجرا نمیشود .",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} در اچ تی ام ال ساخته شده است, اما در حال حاضر آن به عنوان یک نرم افزار در دسکتاپ اجرا میشود بنابراین شما میتوانید جهت ویرایش فایل ها از آن استفاده کنید. لطفا از اپلیکیشن shell در <b>github.com/adobe/brackets-shell</b> جهت اجرای مخازن  {APP_NAME} استفاده کنید.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "خطا در فهرست بندی پرونده ها",
    "ERROR_MAX_FILES"                   : "این پروژه شامل بیش از 30000 فایل است. امکانات که در فایل های چندگانه کار می کنند ممکن است غیرفعال و یا به عنوان پروژه خالی در نظر گرفته شوند. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>اطلاعات بیشتر در مورد کار با پروژه های بزرگ</a>.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "خطا در اجرای مرورگر",
    "ERROR_CANT_FIND_CHROME"            : "مرورگر گوگل کروم پیدا نشد. لطفا از نصب بودن آن اطمینان حاصل کنید.",
    "ERROR_LAUNCHING_BROWSER"           : "بروز خطا بهنگام اجرای مرورگر. (error {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "خطا در پیش نمایش زنده",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "در حال اتصال به مرورگر",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "به هر صورت بهنگام اتصال به حالت پیش نمایش, مرورگر کروم احتیاج دارد به فعال بودن اشکال زدای راه دور (خطایابی راه دور).<br /><br />آیا تمایل دارید به اجرای دوباره کروم و فعال سازی اشکال زدای راه دور(اشکال زدایی از راه دور)?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "ناتوان در بارگذاری صفحه توسعه زنده.",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "باز کنید یک فایل اچ تی ام ال و یا مطمئن شوید که یک فایل index.html در پروژه شما جهت راه اندازی پیش نمایش زنده وجود دارد.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "جهت اجرای پیش نمایش زنده بصورت پرونده در سمت سرور(server-side), می بایست یک URL پایه برای پروژه تعریف نمایید.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "خطا در اجرای سرویس دهنده HTTP برای توسعه زنده پرونده ها. لطفا دوباره تلاش کنید",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "به پیش نمایش زنده خوش آمدید!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     :  "پیش نمایش زنده براکتس به مرورگر متصل شده و یک پیش نمایش از پرونده اچ تی ام ال شما در مرورگرتان نشان خواهد داد, و هرگونه تغییری در کدهایتان را فورا در پیش نمایش اعمال خواهد نمود.<br /><br />در این نسخه موجود براکتس, پیش نمایش تنها با مرورگر <strong>گوگل کروم</strong> برای اعمال فوری مقادیر <strong>فایل های سی اس اس </strong> برای حالت پیش نمایش کار خواهد کرد. هرگونه تغییری در پرونده های اچ تی ام ال یا جاوا اسکریپت بصورت خودکار بعد از ذخیر بارگذاری خواهد شد.<br /><br />(شما این پیغام را برای بار دیگر مشاهده نخواهید کرد.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "برای اطلاعات بیشتر, ببینید <a href='{0}' title='{0}'>عیب یابی خطاهای اتصال پیش نمایش زنده</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "پیش نمایش زنده",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "پیش نمایش زنده: درحال اتصال\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "پیش نمایش زنده: درحال مقداردهی اولیه\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "قطع اتصال از پیش نمایش زنده",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "پیش نمایش زنده (ذخیره فایل ها جهت نوسازی)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "پیش نمایش زنده (به دلیل خطا در سینتکس، بروزرسانی نشده است)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" :  "پیش نمایش زنده لغو شد زیرا از برخی از ابزارهای توسعه مختص مرورگرتان استفاده کرده اید.",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "پیش نمایش زنده لغو شد زیرا پنجره یا زبانه مربوط به صفحه در مرورگر بسته شده.",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "پیش نمایش زنده لغو شد زیرا پنجره یا زبانه موجود در مرورگر آدرس دیگری را پیمایش کرده است.",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "پیش نمایش زنده به دلیل نامشخصی لغو شد ({0})",

    "SAVE_CLOSE_TITLE"                      : "ذخیره تغییرات",
    "SAVE_CLOSE_MESSAGE"                    : "آیا مایلید تغییرات داده شده در سند ذخیره گردند <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"              : "آیا مایلید تغییرات داده شده در پرونده های زیر، ذخیره گردند?    ",
    "EXT_MODIFIED_TITLE"                    : "تغییرات خارجی",
    "CONFIRM_FOLDER_DELETE_TITLE"           : "تایید حذف",
    "CONFIRM_FOLDER_DELETE"                 : "آیا مطمئنید می خواهید این پوشه حذف گردد <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                    : "پرونده حذف گردید",
    "EXT_MODIFIED_WARNING"                  : "<span class='dialog-filename'>{0}</span> خارج از براکتس ویرایش شده.<br /><br />آیا می خواهید پرونده را ذخیره و تغییراتی را که داده اید دوباره بر روی پرونده ویرایش شده اعمال نمایید؟",
    "EXT_MODIFIED_MESSAGE"                  :   "<span class='dialog-filename'>{0}</span> تغییراتی بر روی دیسک انجام شده, ولی تغییرات بر روی براکتس ذخیره نگردیده.<br /><br />کدام نسخه را می خواهید نگه دارید?",
    "EXT_DELETED_MESSAGE"                   : "<span class='dialog-filename'>{0}</span> برخی مقادیر از دیسک حذف شده, ولی تغییرات بر روی براکتس اعمال/ذخیره نشده.<br /><br />آیا می خواهید تغییرات را حفظ کنید?",

    // Generic dialog/button labels
    "DONE"                                  : "انجام",
    "OK"                                    : "تائید",
    "CANCEL"                                : "لغو",
    "DONT_SAVE"                             : "ذخیره نکن",
    "SAVE"                                  : "ذخیره",
    "SAVE_AS"                               : "ذخیر با نام\u2026",
    "SAVE_AND_OVERWRITE"                    : "بازنویسی",
    "DELETE"                                : "حذف",
    "BUTTON_YES"                            : "بله",
    "BUTTON_NO"                             : "خیر",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                      : "{0} از {1}",
    "FIND_NO_RESULTS"                       : "بدون نتیجه",
    "FIND_QUERY_PLACEHOLDER"                : "جستجو\u2026",
    "REPLACE_PLACEHOLDER"                   : "جایگزینی با\u2026",
    "BUTTON_REPLACE_ALL"                    : "همه\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"           : "جایگزینی\u2026",
    "BUTTON_REPLACE"                        : "جایگزینی",
    "BUTTON_NEXT"                           : "\u25B6",
    "BUTTON_PREV"                           : "\u25C0",
    "BUTTON_NEXT_HINT"                      : "مورد بعدی",
    "BUTTON_PREV_HINT"                      : "مورد قبلی",
    "BUTTON_CASESENSITIVE_HINT"             : "مورد تطبیق یافته",
    "BUTTON_REGEXP_HINT"                    : "عبارت منظم",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE"    : "جایگزینی بدون امکان بازگشت به قبل",
    "REPLACE_WITHOUT_UNDO_WARNING"          : "بدلیل اعمال تغییر در تعداد {0} پرونده, {APP_NAME} پرونده های باز نشده را نیز ویرایش و تغییر خواهد داد. به همین جهت مقادیر تغییر یافته (جایگزین شده) غیر قابل بازگشت خواهند بود.",
    "BUTTON_REPLACE_WITHOUT_UNDO"           : "جایگزینی بدون بازگشت",

    "OPEN_FILE"                             : "باز کردن پرونده",
    "SAVE_FILE_AS"                          : "ذخیره پرونده",
    "CHOOSE_FOLDER"                         : "انتخاب یک پوشه",

    "RELEASE_NOTES"                         : "نکات و یادداشت های انتشار",
    "NO_UPDATE_TITLE"                       : "شما بروز هستید!!",
    "NO_UPDATE_MESSAGE"                     : "شما درحال استفاده از آخرین نسخه  {APP_NAME} هستید.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"              : "جایگزینی",
    "FIND_REPLACE_TITLE_WITH"               : "با",
    "FIND_TITLE_LABEL"                      : "جستجو",
    "FIND_TITLE_SUMMARY"                    : "&mdash; {0} {1} {2} با {3}",

    // Find in Files
    "FIND_NUM_FILES"                        : "{0} {1}",
    "FIND_IN_FILES_SCOPED"                  : "در <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"                : "در پروژه",
    "FIND_IN_FILES_ZERO_FILES"              : "فیلترسازی تمامی پرونده های منع شده {0}",
    "FIND_IN_FILES_FILE"                    : "پرونده",
    "FIND_IN_FILES_FILES"                   : "پرونده ها",
    "FIND_IN_FILES_MATCH"                   : "تطبیق",
    "FIND_IN_FILES_MATCHES"                 : "تطبیق ها",
    "FIND_IN_FILES_MORE_THAN"               : "بیش تر از ",
    "FIND_IN_FILES_PAGING"                  : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"               : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"         : "جهت بازکردن/بستن منوها کلید Ctrl/Cmd را گرفته و کلیک کنید.",
    "REPLACE_IN_FILES_ERRORS_TITLE"         : "خطاهای جایگزینی مقادیر",
    "REPLACE_IN_FILES_ERRORS"               : "پرونده های زیر قابل ویرایش نبودن. علت می تواند از قابل نوشتن نبودن پرونده های و یا تغییر آن های بعد از جستجو باشد.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"      : "درحال بروزرسانی اطلاعات خطا",
    "ERROR_FETCHING_UPDATE_INFO_MSG"        :  "بروز خطا در هنگام دستیابی به آخرین اطلاعات بروزرسانی از سرویس دهنده. اطمینان حاصل کنید که به اینترنت متصل بوده و دوباره تلاش نمایید.",

    // File exclusion filters
    "NEW_FILE_FILTER"                       : "اعمال یک تصویه(فیلتر) جدید\u2026",
    "CLEAR_FILE_FILTER"                     : "رفع نادیده گیری پرونده ها",
    "NO_FILE_FILTER"                        : "این پرونده ها از پرونده های نادیده گرفته شده نیستند",
    "EXCLUDE_FILE_FILTER"                   : "نادیده گیری {0}",
    "EDIT_FILE_FILTER"                      : "ویرایش\u2026",
    "FILE_FILTER_DIALOG"                    : "ویرایش نادیده گرفته شده ها",
    "FILE_FILTER_INSTRUCTIONS"              : "نادیده گیری پرونده ها و پوشه های منطبق با عبارات زیر یا برخی / substrings or <a href='{0}' title='{0}'>نویسه های عام</a>. هر عبارت را در یک سطر جدید وارد کنید.",
    "FILTER_NAME_PLACEHOLDER"               : "منع نام (اختیاری)",
    "FILE_FILTER_CLIPPED_SUFFIX"            : "و {0} بیشتر",
    "FILTER_COUNTING_FILES"                 : "شمارش پرونده ها\u2026",
    "FILTER_FILE_COUNT"                     : "همیشه {0} از {1} پرونده {2}",
    "FILTER_FILE_COUNT_ALL"                 : "تایید {0} پرونده {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "امکان ویرایش سریع برای مکان فعلی نشانگر موجود نمی باشد",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "ویرایشگر سریع CSS: نشانگر را روی یک کلاس قرار دهید",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "ویرایشگر سریع CSS: صفات/خصوصیات این کلاس کامل نیست",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "ویرایشگر سریع CSS: صفات/خصوصیات این id کامل نیست",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "ویرایشگر سریع CSS: نشانگر را بر روی یک تگ، کلاس یا id قرار دهید",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "تابع زمانبندی ویرایشگر سریع CSS: خطا در نحو",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "ویرایشگر سریع JS: نشانگر را روی نام تابع قرار دهید",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "سند سریع برای مکان فعلی نمایشگر مکان موجود نمی باشد",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"                       : "درحال بارگذاری\u2026",
    "UNTITLED"                              : "عنوان گذاری نشده",
    "WORKING_FILES"                         : "پرونده های کاری",

    /**
     * MainViewManager
     */
    "TOP"                                   : "بالا",
    "BOTTOM"                                : "پایین",
    "LEFT"                                  : "چپ",
    "RIGHT"                                 : "راست",

    "CMD_SPLITVIEW_NONE"                    : "بدون دو بخشی کردن",
    "CMD_SPLITVIEW_VERTICAL"                : "دو بخشی کردن عمودی",
    "CMD_SPLITVIEW_HORIZONTAL"              : "دو بخشی کردن افقی",
    "SPLITVIEW_MENU_TOOLTIP"                : "دو بخشی کردن ویرایشگر به صورت عمودی یا افقی",
    "GEAR_MENU_TOOLTIP"                     : "پیکربندی پرونده های کاری",

    "SPLITVIEW_INFO_TITLE"                  : "هم اکنون باز است",
    "SPLITVIEW_MULTIPANE_WARNING"           :  "این پرونده هم اکنون در پنجره ای دیگر باز شده است. {APP_NAME} بزودی باز کردن همان پرونده در سایر پنجره ها را پشتیبانی خواهد نمود. تا آن زمان پرونده ها تنها در پنجره ای که باز شده اند نمایش داده خواند شد.<br /><br />(این پیغام تنها یک بار مشاهده خواهد شد.)",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"                         : "Ctrl",
    "KEYBOARD_SHIFT"                        : "Shift",
    "KEYBOARD_SPACE"                        : "Space",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "خط {0}, ستون {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} ستون انتخاب شده",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} ستون های انتخاب شده",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} خط انتخاب شده",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} خط های انتخاب شده",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} انتخاب شده ها",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "کلیک کنید تا به این فضاها منتقل شوید",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "کلیک کنید تا به این زبانه ها منتقل شوید",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "جهت تغییر تعداد فضاهای خالی استفاده شده در هنگام فاصله دهی خطوط از چپ، کلیک کنید",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "کلیک کنید تا طول زبانه کاراکتر ها تغییر کند",
    "STATUSBAR_SPACES"                      : "فاصله ها:",
    "STATUSBAR_TAB_SIZE"                    : "اندازه زبانه:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} خط",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} خط ها",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "غیرفعال سازی افزونه ها",
    "STATUSBAR_INSERT"                      : "واردسازی",
    "STATUSBAR_OVERWRITE"                   : "دوباره نویسی",
    "STATUSBAR_INSOVR_TOOLTIP"              : "جهت تغییر حالت از وارد سازی (INS) به بازنویسی (OVR) یا برعکس، کلیک کنید",
    "STATUSBAR_LANG_TOOLTIP"                : "جهت تغییر نوع پرونده، کلیک کنید.",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. باز و بسته کردن پنل گزارشات.",
    "STATUSBAR_DEFAULT_LANG"                : "(پیش فرض)",
    "STATUSBAR_SET_DEFAULT_LANG"            : " اعمال بعنوان پیش فرض برای .{0} پرونده ها",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : " {0} خطا",
    "SINGLE_ERROR"                          : " 1 {0} خطا",
    "MULTIPLE_ERRORS"                       : " {1} {0} خطا",
    "NO_ERRORS"                             : "هیچ خطایی یافت نشد {0} - کارت خوبه!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "خطایی پیدا نشد - کارت خوبه!",
    "LINT_DISABLED"                         : "Linting غیرفعال شد",
    "NO_LINT_AVAILABLE"                     : "linter برای {0} دردسترس نیست",
    "NOTHING_TO_LINT"                       : "linter برای {0} دردسترس نیست",
    "LINTER_TIMED_OUT"                      : "فعالیت{0} پس از انتظار بمدت{1} میلی ثانیه خاتمه یافت",
    "LINTER_FAILED"                         : "{0} با خطای زیر پایان یافته: {1}",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "فایل",
    "CMD_FILE_NEW_UNTITLED"               : "جدید",
    "CMD_FILE_NEW"                        : "فایل جدید",
    "CMD_FILE_NEW_FOLDER"                 : "پوشه جدید",
    "CMD_FILE_OPEN"                       : "باز کردن\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "افزودن به محیط کاری و باز کردن آن",
    "CMD_OPEN_DROPPED_FILES"              : "باز کردن پرونده های در نظر گرفته نشده",
    "CMD_OPEN_FOLDER"                     : "باز کردن پوشه\u2026",
    "CMD_FILE_CLOSE"                      : "بستن",
    "CMD_FILE_CLOSE_ALL"                  : "بستن همه",
    "CMD_FILE_CLOSE_LIST"                 : "بستن لیست",
    "CMD_FILE_CLOSE_OTHERS"               : "بستن سایر موارد",
    "CMD_FILE_CLOSE_ABOVE"                : "بستن موارد بالایی",
    "CMD_FILE_CLOSE_BELOW"                : "بستن موارد پایینی",
    "CMD_FILE_SAVE"                       : "ذخیره",
    "CMD_FILE_SAVE_ALL"                   : "ذخیره همه",
    "CMD_FILE_SAVE_AS"                    : "ذخیره با نام\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "پیش نمایش زنده",
    "CMD_TOGGLE_LIVE_PREVIEW_MB_MODE"     : "فعال کردن پیش نمایش تجربی",
    "CMD_RELOAD_LIVE_PREVIEW"             : "بارگذاری مجدد پیش نمایش زنده (با فشار)",
    "CMD_PROJECT_SETTINGS"                : "تنظیمات پروژه\u2026",
    "CMD_FILE_RENAME"                     : "تغییر نام",
    "CMD_FILE_DELETE"                     : "حذف",
    "CMD_INSTALL_EXTENSION"               : "نصب افزونه \u2026",
    "CMD_EXTENSION_MANAGER"               : "مدیریت افزونه\u2026",
    "CMD_FILE_REFRESH"                    : "نوسازی درختی پرونده",
    "CMD_QUIT"                            : "ترک کردن",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "خروج",

    // Edit menu commands
    "EDIT_MENU"                           : "ویرایش",
    "CMD_UNDO"                            : "یک مرحله به قبل",
    "CMD_REDO"                            : "یک مرحله به بعد",
    "CMD_CUT"                             : "بریدن",
    "CMD_COPY"                            : "رونوشت",
    "CMD_PASTE"                           : "چسباندن رو نوشت",
    "CMD_SELECT_ALL"                      : "انتخاب همه",
    "CMD_SELECT_LINE"                     : "انتخاب خط",
    "CMD_SPLIT_SEL_INTO_LINES"            : "تقسیم انتخاب شده به چند سطر",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "افزودن نشانگر به سطر بعدی",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "افزودن نشانگر به سطر قبلی",
    "CMD_INDENT"                          : "یک فاصله از چپ",
    "CMD_UNINDENT"                        : "حذف یک فاصله از چپ",
    "CMD_DUPLICATE"                       : "دو نسخه کردن خط",
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
    "CMD_FIND"                            : "یافتن",
    "CMD_FIND_NEXT"                       : "یافتن بعدی",
    "CMD_FIND_PREVIOUS"                   : "یافتن قبلی",
    "CMD_FIND_ALL_AND_SELECT"             : "جستجو برای تمامی موارد و انتخاب آن ها",
    "CMD_ADD_NEXT_MATCH"                  : "عبارت انطباق یافته بعدی را به انتخاب شده ها اضافه کن",
    "CMD_SKIP_CURRENT_MATCH"              : "پرش از این مورد و افزودن مورد انطباق یافته بعدی",
    "CMD_FIND_IN_FILES"                   : "جستجو در پرونده ها",
    "CMD_FIND_IN_SUBTREE"                 : "جستجو در\u2026",
    "CMD_REPLACE"                         : "جایگزینی",
    "CMD_REPLACE_IN_FILES"                : "جایگزینی در پرونده ها",
    "CMD_REPLACE_IN_SUBTREE"              : "جایگزینی در\u2026",

    // View menu commands
    "VIEW_MENU"                           : "نمایش",
    "CMD_HIDE_SIDEBAR"                    : "پنهان کردن نوار کناری",
    "CMD_SHOW_SIDEBAR"                    : "نمایش نوار کناری",
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
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "مرتب سازی بر اساس ترتیب اضافه شدن",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "مرتب سازی بر اساس نام",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "مرتب سازی بر اساس نوع",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "مرتب سازی خودکار",
    "CMD_THEMES"                          : "پوسته ها\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "انتقال",
    "CMD_QUICK_OPEN"                      : "باز کردن سریع",
    "CMD_GOTO_LINE"                       : "برو به خط",
    "CMD_GOTO_DEFINITION"                 : "تعریف جستجوی سریع",
    "CMD_GOTO_FIRST_PROBLEM"              : "رجوع به اولین خطا/اخطار",
    "CMD_TOGGLE_QUICK_EDIT"               : "ویرایش سریع",
    "CMD_TOGGLE_QUICK_DOCS"               : "مستند گزاری سریع",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "تطبیق یافته قبلی",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "تطبیق یافته بعدی",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "قاعده جدید",
    "CMD_NEXT_DOC"                        : "سند بعدی",
    "CMD_PREV_DOC"                        : "سند قبلی",
    "CMD_SHOW_IN_TREE"                    : "نمایش در پرونده ها به صورت درختی",
    "CMD_SHOW_IN_EXPLORER"                : "نمایش در پیمایشگر",
    "CMD_SHOW_IN_FINDER"                  : "نمایش در جستجوگر",
    "CMD_SHOW_IN_OS"                      : "نمایش در OS",

    // Help menu commands
    "HELP_MENU"                           : "راهنما",
    "CMD_CHECK_FOR_UPDATE"                : "بررسی بروزرسانی ها",
    "CMD_HOW_TO_USE_BRACKETS"             : "چگونگی استفاده از {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME} پشتیبانی",
    "CMD_SUGGEST"                         : "پیشنهاد یک امکان جدید",
    "CMD_RELEASE_NOTES"                   : "نکات انتشار",
    "CMD_GET_INVOLVED"                    : "درگیرش شوید",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "نمایش پوشه افزونه ها",
    "CMD_HOMEPAGE"                        : "{APP_TITLE} صفحه اصلی سایت",
    "CMD_TWITTER"                         : "{TWITTER_NAME} در توییتر",
    "CMD_ABOUT"                           : "درباره {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "تنظیمات باز کردن فایل",
    "CMD_OPEN_KEYMAP"                     : "باز کردن نقشه کلیدهای کاربردی",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "ساخت آزمایشی",
    "RELEASE_BUILD"                        : "ساختن و انتشار",
    "DEVELOPMENT_BUILD"                    : "ایجاد توسعه",
    "RELOAD_FROM_DISK"                     : "بارگذاری مجدد از دیسک",
    "KEEP_CHANGES_IN_EDITOR"               : "نگه داشتن تغییرات در ویرایشگر",
    "CLOSE_DONT_SAVE"                      : "بستن (بدون ذخیره سازی)",
    "RELAUNCH_CHROME"                      : "اجرای دوباره کروم",
    "ABOUT"                                : "پیرامون",
    "CLOSE"                                : "بستن",
    "ABOUT_TEXT_LINE1"                     : "انتشار {VERSION_MAJOR}.{VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "ایجاد برچسب زمان: ",
    "ABOUT_TEXT_LINE3"                     : "<div style='direction:rtl;margin-right:3px;'>یادداشت ها، شرایط و ضوابط مربوط به نرم افزار و حقوق شخص ثالث در آدرس<a href='#' class='clickable-link' data-href='http://www.adobe.com/go/thirdparty/'>http://www.adobe.com/go/thirdparty/</a> جهت تلفیق و بعنوان مرجع قرار داده شده.",
    "ABOUT_TEXT_LINE4"                     : "اسناد و منابع در <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "ساخته شده با \u2764 و جاوا اسکریپت توسط:",
    "ABOUT_TEXT_LINE6"                     : "بسیاری از مردم (اما اکنون در بارگذاری داده ها ما مشکل داریم ).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "اسناد و مدارک صفحات وب و آرم اصلی گرافیکی تحت مجوز , <a href='#' class='clickable-link' data-href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 .پایه ریزی شده است</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "ساخته ی جدیدی از {APP_NAME} هم اکنون در دسترس است! جهت مشاهده جزئیات کلیک کنید.",
    "UPDATE_AVAILABLE_TITLE"               : "بروزرسانی جدید در دسترس است",
    "UPDATE_MESSAGE"                       : "نسخه جدیدی از {APP_NAME} هم اکنون در دسترس است. برخی از مشخصه های آن:",
    "GET_IT_NOW"                           : "اکنون برو به!",
    "PROJECT_SETTINGS_TITLE"               : "تنظیمات پروژه برای: {0}",
    "PROJECT_SETTING_BASE_URL"             : "پیش نمایش URL اصلی/پایه",
    "PROJECT_SETTING_BASE_URL_HINT"        : "جهت استفاده از سرویس دهنده داخلی, از url بمانند http://localhost:8000/ استفاده کنید.",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "پروتکول {0} با پیش نمایش زنده پشتیبانی نمی شود&mdash;لطفا از http: یا https: استفاده نمایید.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL اصلی نمی تواند شامل پارامترهای جستجو بمانند \"{0}\" باشد.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL اصلی نمی تواند hashes مشابه \"{0}\" داشته باشد.",
    "BASEURL_ERROR_INVALID_CHAR"           : "برخی کاراکترهای خاص شبیه '{0}' می بایست %-encoded.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "خطای ناشناخته در URL اصلی/پایه",
    "EMPTY_VIEW_HEADER"                    : "<em>انتخاب کنید یک فایلی را در حالی که بر روی این قسمت تمرکز شده است</em>",

    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "پوسته فعلی",
    "USE_THEME_SCROLLBARS"                 : "استفاده از نوار شناور پوسته",
    "FONT_SIZE"                            : "اندازه قلم",
    "FONT_FAMILY"                          : "نوع قلم",
    "THEMES_SETTINGS"                      : "تنظیمات پوسته ها",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "قائده جدید",

    // Extension Management strings
    "INSTALL"                              : "نصب",
    "UPDATE"                               : "بروزرسانی",
    "REMOVE"                               : "حذف",
    "OVERWRITE"                            : "دوباره نویسی",
    "CANT_REMOVE_DEV"                      : "افزونه های موجود در پوشه \"dev\" می بایست بصورت دستی حذف گردند.",
    "CANT_UPDATE"                          : "بروزرسانی سازگار با این نسخه از {APP_NAME} نیست.",
    "CANT_UPDATE_DEV"                      : "افزونه موجود در پوشه \"dev\" قادر به بروزرسانی خودکار نیست",
    "INSTALL_EXTENSION_TITLE"              : "نصب افزونه",
    "UPDATE_EXTENSION_TITLE"               : "بروزرسانی افزونه",
    "INSTALL_EXTENSION_LABEL"              : "URL افزونه",
    "INSTALL_EXTENSION_HINT"               : "URL افزونه های دارای پرونده zip یا مخازن Github",
    "INSTALLING_FROM"                      : "نصب افزونه ها از {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "نصب با موفقیت به اتمام رسید!",
    "INSTALL_FAILED"                       : "نصب ناموفق.",
    "CANCELING_INSTALL"                    : "درحال لغو\u2026",
    "CANCELING_HUNG"                       : "عملیات لغو نصب زمان طولانی ای به طول خواهد کشید. خطا یا خطاهای داخلی ممکن است رخ دهد.",
    "INSTALL_CANCELED"                     : "فرایند نصب لغو گردید.",
    "VIEW_COMPLETE_DESCRIPTION"            : "مشاهده توضیح کامل",
    "VIEW_TRUNCATED_DESCRIPTION"           : "مشاهده توضیح مختصر",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "محتوای دانلود شده دارای پرونده zip معتبر نمی باشد.",
    "INVALID_PACKAGE_JSON"                 : "پرونده package.json معتبر نمی باشد (error was: {0}).",
    "MISSING_PACKAGE_NAME"                 : "پرونده package.json دارای خطا در نام می باشد.",
    "BAD_PACKAGE_NAME"                     : "نام بسته {0} نامعتبر می باشد.",
    "MISSING_PACKAGE_VERSION"              : "پرونده package.json دارای خطا در نسخه می باشد.",
    "INVALID_VERSION_NUMBER"               : "عدد نسخه این بسته ({0}) نامعتبر می باشد.",
    "INVALID_BRACKETS_VERSION"             : "خطا در سازگاری {APP_NAME} با رشته نامعتبر({0}).",
    "DISALLOWED_WORDS"                     : "عبارت ({1}) اجازه وارد سازی در این فیلد را ندارد {0}",
    "API_NOT_COMPATIBLE"                   : "افزونه با این نسخه از برنامه {APP_NAME} سازگار نیست. در پوشه افزونه های قابل نمایش نصب نشد.",
    "MISSING_MAIN"                         : "بسته حاوی پرونده main.js نیست.",
    "EXTENSION_ALREADY_INSTALLED"          : "نصب این بسته سبب دوباره نویسی پرونده های افزونه قبلی می شود. دوباره نویسی صورت گیرد?",
    "EXTENSION_SAME_VERSION"               : "نسخه این بسته با نسخه بسته ای که هم اکنون نصب می باشد برابر است. آیا افزونه دوباره نویسی گردد?",
    "EXTENSION_OLDER_VERSION"              : "این بسته نسخه {0} هست قبل تر نصب شده({1}). آیا این افزونه دوباره نویسی گردد?",
    "DOWNLOAD_ID_IN_USE"                   : "خطای داخلی: این ID دانلود هم اکنون درحال استفاده است.",
    "NO_SERVER_RESPONSE"                   : "ناتوان در اتصال به سرویس دهنده.",
    "BAD_HTTP_STATUS"                      : "پرونده در سرویس دهنده یافت نشد (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "ناتوان در ذخیره دانلود در یک پرونده خالی.",
    "ERROR_LOADING"                        : "این افزونه بهنگام شروع با خطا مواجه می شود.",
    "MALFORMED_URL"                        : "آدرس URL نامعتبر است. لطفا آن را بررسی کرده و آدرس معتبر وارد سازید.",
    "UNSUPPORTED_PROTOCOL"                 : "آدرس URL می بایست http یا https باشد.",
    "UNKNOWN_ERROR"                        : "خطای داخلی نامشخص.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "مدیریت افزونه ها",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "ناتوان در دسترسی به افزونه های ثبت شده. لطفا بعدا تلاش کنید.",
    "INSTALL_EXTENSION_DRAG"               : "پرونده زیپ را اینجا بکشید و یا",
    "INSTALL_EXTENSION_DROP"               : "پرونده زیپ را رها کنید تا نصب شود",
    "INSTALL_EXTENSION_DROP_ERROR"         : "نصب/بروزرسانی لغو شد، لطفا خطاهای زیر را بررسی کنید:",
    "INSTALL_FROM_URL"                     : "نصب کنید از آدرس اینترنتی\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "بررسی صحت پرونده\u2026",
    "EXTENSION_AUTHOR"                     : "نویسنده",
    "EXTENSION_DATE"                       : "تاریخ",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "این افزونه نیاز به نسخه جدیدی از {APP_NAME} دارد.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : " نسخه فعلی این افزونه فقط با نسخه های قبلی {APP_NAME} سازگار است.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "نسخه {0} از این افزونه نیازمند نسخه جدیدی از {APP_NAME} می باشد. ولی شما می توانید یک نسخه پایین تر از {1} را نصب کنید.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "نسخه {0} از این افزونه فقط با نسخه قدیمی از {APP_NAME} کار می کند. اما شما به راحتی می توانید نصب کنید نسخه {1} را ",


    "EXTENSION_NO_DESCRIPTION"             : "بدون شرح",
    "EXTENSION_MORE_INFO"                  : "اطلاعات بیشتر...",
    "EXTENSION_ERROR"                      : "خطای افزونه",
    "EXTENSION_KEYWORDS"                   : "کلمات کلیدی",
    "EXTENSION_TRANSLATED_USER_LANG"       : "ترجمه شده به زبان های {0} که زبان شما را نیز در بر دارد",
    "EXTENSION_TRANSLATED_GENERAL"         : "ترجمه شده به زبان های {0}",
    "EXTENSION_TRANSLATED_LANGS"           : " این افزونه تنها برای زبان های زیر ترجمه شده است: {0}",
    "EXTENSION_INSTALLED"                  : "نصب شده",
    "EXTENSION_UPDATE_INSTALLED"           : "بروزرسانی این افزونه دانلود و بعد از بارگذاری مجدد  {APP_NAME} نصب می شود.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "جستجو",
    "EXTENSION_MORE_INFO_LINK"             : "بیشتر",
    "BROWSE_EXTENSIONS"                    : "پیمایش افزونه ها",
    "EXTENSION_MANAGER_REMOVE"             : "حذف براکتس",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "ناتوان در حذف یک یا بیشتر از یک افزونه : {0}. {APP_NAME} در حال بارگذاری مجدد.",
    "EXTENSION_MANAGER_UPDATE"             : "بروزرسانی افزونه",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "ناتوان در بروزرسانی یک افزونه یا بیشتر: {0}. {APP_NAME} در حال برگذاری مجدد.",
    "MARKED_FOR_REMOVAL"                   : "نشانه گذاری جهت حذف",
    "UNDO_REMOVE"                          : "مرحله قبل",
    "MARKED_FOR_UPDATE"                    : "انتخاب شده برای بروزرسانی",
    "UNDO_UPDATE"                          : "مرحله قبل",
    "CHANGE_AND_RELOAD_TITLE"              : "تغییر افزونه ها و بارگذاری مجدد",
    "CHANGE_AND_RELOAD_MESSAGE"            : "جهت بروزرسانی یا حذف افزونه ها, {APP_NAME} براکتس احتیاج به بارگذاری مجدد دارد. تغییرات ذخیره نشده شما ذخیره خواهد شد.",
    "REMOVE_AND_RELOAD"                    : "حذف افزونه ها و بارگذاری مجدد",
    "CHANGE_AND_RELOAD"                    : "تغییر افزونه ها و بارگذاری مجدد",
    "UPDATE_AND_RELOAD"                    : "بروزرسانی افزونه ها و بارگذاری مجدد",
    "PROCESSING_EXTENSIONS"                : "درحال پردازش تغییرات\u2026",
    "EXTENSION_NOT_INSTALLED"              : "ناتوان در حذف افزونه {0} زیرا این افزونه به درستی نصب نشده.",
    "NO_EXTENSIONS"                        : "هیچ افزونه ای نصب نشده.<br>جهت شروع بر روی زبانه در دسترس بالا کلیک کنید.",
    "NO_EXTENSION_MATCHES"                 : "هیچ افزونه ای منطبق با جستجوی شما پیدا نشد",
    "REGISTRY_SANITY_CHECK_WARNING"        : "نکته: این افزونه ها ممکن است از نویسندگان مختلفی که براکتس را خودشان توسعه داده اند و متعلق به خوشان است باشند. افزونه ها بررسی نشده اند و امتیازات کاملا محلی هستند. احتیاط کنید در هنگام نصب افزونه هایی که منبع مشخصی ندارند.",
    "EXTENSIONS_INSTALLED_TITLE"           : "نصب شده",
    "EXTENSIONS_AVAILABLE_TITLE"           : "در دسترس",
    "EXTENSIONS_THEMES_TITLE"              : "پوسته ها",
    "EXTENSIONS_UPDATES_TITLE"             : "بروزرسانی ها",

    "INLINE_EDITOR_NO_MATCHES"             : "هیچ مورد سازگاری در دسترس نیست.",
    "INLINE_EDITOR_HIDDEN_MATCHES"         : "تمام سازگاری ها فرو ریخته هستند. گسترش فایل های ذکر شده در سمت راست جهت نمایش سازگاری.",
    "CSS_QUICK_EDIT_NO_MATCHES"            :  "هیچ قائده منطبقی برای CSSها نسبت به موردی که انتخاب کرده اید وجود ندارد.<br> از گزینه \"قائده جدید\" برای تعریف یک قائده جدید استفاده کنید.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "هیچ شیوه نامه ای-پرونده CSS- در پروژه شما وجود ندارد.<br>جهت تعریف قوائد CSS ابتدا یک پرونده شیوه نامه ایجاد کنید.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "بزرگتر",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "پیکسل",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "خطایابی",
    "ERRORS"                                    : "خطاها",
    "CMD_SHOW_DEV_TOOLS"                        : "نمایش ابزار توسعه",
    "CMD_REFRESH_WINDOW"                        : "بارگذاری مجدد با افزونه ها",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "بارگذاری مجدد بدون افزونه ها",
    "CMD_NEW_BRACKETS_WINDOW"                   : "پنجره جدید از {APP_NAME} باز کنید.",
    "CMD_SWITCH_LANGUAGE"                       : "تغییر زبان",
    "CMD_RUN_UNIT_TESTS"                        : "بررسی برای اجرا",
    "CMD_SHOW_PERF_DATA"                        : "نمایش داده های عملکردی",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "فعال سازی اشکال زدای گره ای",
    "CMD_LOG_NODE_STATE"                        : "ورود گره به حالت کنسول",
    "CMD_RESTART_NODE"                          : "شروع دوباره گره",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "نمایش خطاها در نوار وظیفه",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "باز کردن منبع براکتس",

    "LANGUAGE_TITLE"                            : "تغییر زبان",
    "LANGUAGE_MESSAGE"                          : "زبان:",
    "LANGUAGE_SUBMIT"                           : "بارگذاری مجدد {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "لغو",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "پیشفرض سیستم",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "زمان",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "پیشرفت",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> انتخاب حرکت نشانگر<br><kbd class='text'>شیفت</kbd>حرکت با ده واحد<br><kbd class='text'>تب</kbd> نقاط تغییر",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd>افزایش و یا کاهش گام<br><kbd>←</kbd><kbd>→</kbd> 'شروع' or 'پایان'",
    "INLINE_TIMING_EDITOR_INVALID"              :"مقدار سابق <code>{0}</code> دیگر معتبر نمی باشد, زیرا تابع نمایش به مقدار <code>{1}</code> تغییر یافته. سند در اولین ویرایش بروزرسانی خواهد شد.",

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
    "CMD_SHOW_PARAMETER_HINT"                   : "نمایش نکات پارامتر",
    "NO_ARGUMENTS"                              : "<بدون پارامترها>",
    "DETECTED_EXCLUSION_TITLE"                  : "خطای منطقی در پرونده جاوا اسکریپت",
    "DETECTED_EXCLUSION_INFO"                   : "براکتس در حال انجام یک پردازش مشکل دار با پرونده <span class='dialog-filename'>{0}</span> است.<br><br>این پرونده اشاره گرهای کدها را بطور کامل نشان نخواهد داد, برای این منظور میتوانید از حالت تعریف یا ویرایش سریع استفاده نمایید. جهت فعال سازی دوباره این پرونده, <code>.brackets.json</code> را در پروژه خود باز کنید و <code>jscodehints.detectedExclusions</code> را ویرایش نمایید.<br><br>این مشکل میتواند یک Bug در براکتس باشد. اگر مشکلی در ارائه این پرونده به ما ندارید, لطفا گزارش <a href='https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue'>پرونده دارای اشکال</a> را با یک لینک به پرونده جهت بررسی ثبت نمایید.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "مشاهده سریع بهنگام اشاره با ماوس",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "پروژه های اخیر",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "بیشتر بخوانید"
});
/* Last translated for eef9c68a1fdff372b9ea6352cacb5e2506e55be9 */
