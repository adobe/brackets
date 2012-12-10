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
    "NOT_FOUND_ERR"                     : "لا يمكن إيجاد الملف.",
    "NOT_READABLE_ERR"                  : "لا يمكن قراءة الملف.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "المجلد المستهدف لا يمكن تغييره.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "ليس لك الإذن بالقيام بتغييرات.",
    "FILE_EXISTS_ERR"                   : "الملف موجود أصلا.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "خطأ أثناء فتح المشروع",
    "OPEN_DIALOG_ERROR"                 : "حدث خطأ أثناء فتح نافذة الملفات. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "حدث خطأ أثناء محاولة فتح المجلد <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "حدث خطأ أثناء قراءة المعطيات من المجلد <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "خطأ أثناء فتح الملف",
    "ERROR_OPENING_FILE"                : "حدث خطأ أثناء فتح الملف <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "حدث خطأ أثناء إعادة فتح الملف من القرص.",
    "ERROR_RELOADING_FILE"              : "حدث خطأ أثناء إعادة فتح الملف <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "خطأ أثناء حفظ الملف",
    "ERROR_SAVING_FILE"                 : "حدث خطأ أثناء حفظ الملف <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "خطأ أثناء تسمية الملف",
    "ERROR_RENAMING_FILE"               : "حدث خطأ أثناء تسمية الملف <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "إسم الملف ليس مسموح",
    "INVALID_FILENAME_MESSAGE"          : "أسماء الملفات لا يجب أن تحتوي على هاته الاحرف: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "موجود أصلا. <span class='dialog-filename'>{0}</span> الملف",
    "ERROR_CREATING_FILE_TITLE"         : "خطأ أثناء إحداث الملف",
    "ERROR_CREATING_FILE"               : "حدث خطأ أثناء إحداث الملف <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} doesn't run in browsers yet.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} is built in HTML, but right now it runs as a desktop app so you can use it to edit local files. Please use the application shell in the <b>github.com/adobe/brackets-shell</b> repo to run {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "خطأ أثناء فهرسة الملفات",
    "ERROR_MAX_FILES"                   : "العدد الاقصى للملفات قد تم فهرسته. إجراءات البحث عن الملفات في الفهرس قد لا تشتغل عاديا.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "خطأ أثناء فتح المتصفح",
    "ERROR_CANT_FIND_CHROME"            : "المتصفح جوجل كروم لا يمكن إيجاده. المرجو التأكد من تنصيبه.",
    "ERROR_LAUNCHING_BROWSER"           : "حدث خطأ أثناء فتح المتصفح (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "خطأ أثناء المعاينة المباشرة",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "جاري ربط الإتصال بالمتصفح",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "لأجل إستخدام المعاينة المباشرة, يجب على كروم أن يشتغل مع التصحيح عن بعد.<br /><br />هل تريد إعادة تشغيل كروم مع خاصية التشغيل عن بعد؟.",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "إفتح ملف HTML لأجل بدأ المعاينة المباشرة.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "لأجل بدأ معاينة مباشرة لملف على الخادم, يجب عليك تحديد الرابط الاساسي للمشروع.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "مرحبا في المعاينة المباشرة!",
	""
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "المعاينة المباشرة تربط اتصال {APP_NAME} مع متصفحك. ستقوم بتشغيل معاينة ملف HTML في المتصفح, ثم تقوم بتحديث المعاينة مباشرة أثناء كتابة المصدر.<br /><br />في هذه النسخة الابتدائية لـ {APP_NAME}, المعاينة المباشرة تشتغل فقط مع <strong>Google Chrome</strong> و تقوم بالتحديث <strong>CSS files</strong>. التغييرات في ملفات HTML أو Javascript تضاف أوتوماتيكيا عند الحفظ.<br /><br />(سترى هذه الرسالة مرة واحدة.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "للمزيد من المعلومات <a class=\"clickable-link\" data-href=\"{0}\">Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "المعاينة المباشرة",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "المعاينة المباشرة: ربط الاتصال\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "المعاينة المباشرة: تهيئة\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "قطع الاتصال بالمعاينة المباشرة",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "المعاينة المباشرة: أنقر لقطع الاتصال (إحفظ الملف للتحديث)",
    
    "SAVE_CLOSE_TITLE"                  : "حفظ التغييرات",
    "SAVE_CLOSE_MESSAGE"                : "هل تريدون حفظ التغييرات الموجودة في الملف <span class='dialog-filename'>{0}</span> ؟",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "هل تريدون حفظ التغييرات لهاته الملفات ؟",
    "EXT_MODIFIED_TITLE"                : "تغييرات خارجية",
	
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> قد تم تغييره على القرص, لكن لديه تغييرات لم تحفظ بعد {APP_NAME}.<br /><br />أي نسخة تريدون الإحتفاظ بها?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> تم حذفه من القرص, لكن لديه تغييرات لم تحفظ بعد {APP_NAME}.<br /><br />هل تريد الاحتفاظ بتغييراتك?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Use /re/ syntax for regexp search",
    "WITH"                              : "مع",
    "BUTTON_YES"                        : "نعم",
    "BUTTON_NO"                         : "لا",
    "BUTTON_STOP"                       : "توقف",

    "OPEN_FILE"                         : "إفتح ملف",
    "CHOOSE_FOLDER"                     : "إختر مجلد",

    "RELEASE_NOTES"                     : "التغييرات",
    "NO_UPDATE_TITLE"                   : "لديك النسخة الأخيرة !",
    "NO_UPDATE_MESSAGE"                 : "أنت تستعمل النسخة الاخيرة من {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "من \"{4}\" {5} - {0} {1} في {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "في <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "في المشروع",
    "FIND_IN_FILES_FILE"                : "ملف",
    "FIND_IN_FILES_FILES"               : "ملفات",
    "FIND_IN_FILES_MATCH"               : "تطابق",
    "FIND_IN_FILES_MATCHES"             : "تطابقات",
    "FIND_IN_FILES_MORE_THAN"           : "أكثر من ",
    "FIND_IN_FILES_MAX"                 : " (إظهار أول {0} تطابقات)",
    "FIND_IN_FILES_FILE_PATH"           : "الملف: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "سطر:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "خطأ أثناء تحديث النسخة الأخيرة",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "حدث خطأ أثناء تحديث النسخة الأخيرة من الخادم. المرجو التأكد من أنكم متصلون بالانترنت و المحاولة مرة أخرى",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "تغيير اللغة",
    "LANGUAGE_MESSAGE"                  : "المرجو إختيار اللغة من القائمة الموجودة أسفله:",
    "LANGUAGE_SUBMIT"                   : "إعادة تشغيل {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "إلغاء",

    /**
     * ProjectManager
     */

    "UNTITLED" : "بلا عنوان",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "سطر {0}, خانة {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "إنقر لتغيير التسنن إلى فراغات",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "أنقر لتغيير التسنن إلى علامات التبويب",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "أنقر لتغيير عدد الفراغات للتسنن",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "أنقر هنا لتغيير عرض علامات التسنن",
    "STATUSBAR_SPACES"                      : "الفراغات",
    "STATUSBAR_TAB_SIZE"                    : "حجم علامة التبويب",
    "STATUSBAR_LINE_COUNT"                  : "{0} أسطر",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "الملف",
    "CMD_FILE_NEW"                        : "ملف جديد",
    "CMD_FILE_NEW_FOLDER"                 : "مجلد جديد",
    "CMD_FILE_OPEN"                       : "فتح\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "إضافة إلى ورشة العمل",
    "CMD_OPEN_FOLDER"                     : "فتح مجلد\u2026",
    "CMD_FILE_CLOSE"                      : "إغلاق",
    "CMD_FILE_CLOSE_ALL"                  : "إغلاق الكل",
    "CMD_FILE_SAVE"                       : "حفظ",
    "CMD_FILE_SAVE_ALL"                   : "حفظ الكل",
    "CMD_LIVE_FILE_PREVIEW"               : "معاينة مباشرة",
    "CMD_LIVE_HIGHLIGHT"                  : "تسليط الضوء مباشر",
    "CMD_PROJECT_SETTINGS"                : "خيارات المشروع\u2026",
    "CMD_FILE_RENAME"                     : "تسمية",
    "CMD_QUIT"                            : "خروج",

    // Edit menu commands
    "EDIT_MENU"                           : "تحرير",
    "CMD_SELECT_ALL"                      : "تحديد الكل",
    "CMD_SELECT_LINE"                     : "تحديد سطر",
    "CMD_FIND"                            : "بحث",
    "CMD_FIND_IN_FILES"                   : "البحث في الملفات",
    "CMD_FIND_IN_SUBTREE"                 : "البحث في\u2026",
    "CMD_FIND_NEXT"                       : "البحث التالي",
    "CMD_FIND_PREVIOUS"                   : "البحث السابق",
    "CMD_REPLACE"                         : "إستبدال",
    "CMD_INDENT"                          : "التسنين",
    "CMD_UNINDENT"                        : "حذف التسنين",
    "CMD_DUPLICATE"                       : "تكرار",
    "CMD_DELETE_LINES"                    : "حذف سطر",
    "CMD_COMMENT"                         : "Toggle Line Comment", //No equivalent for the word "Toggle" in Arabic
    "CMD_BLOCK_COMMENT"                   : "Toggle Block Comment",
    "CMD_LINE_UP"                         : "تحريك السطر للأعلى",
    "CMD_LINE_DOWN"                       : "تحريك السطر للاسفل",
     
    // View menu commands
    "VIEW_MENU"                           : "المظهر",
    "CMD_HIDE_SIDEBAR"                    : "إظهار اللوحة الجانبية",
    "CMD_SHOW_SIDEBAR"                    : "إخفاء اللوحة الجانبية",
    "CMD_INCREASE_FONT_SIZE"              : "زيادة حجم الخط",
    "CMD_DECREASE_FONT_SIZE"              : "نقصان حجم الخط",
    "CMD_RESTORE_FONT_SIZE"               : "إعادة حجم الخط",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "نرنيب حسب التاريخ",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "ترتيب حسب الاسم",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "ترتيب حسب النوع",
    "CMD_SORT_WORKINGSET_AUTO"            : "ترتيب أوتوماتيكي",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "التصفح",
    "CMD_QUICK_OPEN"                      : "فتح سريع",
    "CMD_GOTO_LINE"                       : "الذهاب إلى السطر",
    "CMD_GOTO_DEFINITION"                 : "الذهاب إلى التعريف",
    "CMD_TOGGLE_QUICK_EDIT"               : "تحرير سريع",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "التطابق السابق",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "التطابق التالي",
    "CMD_NEXT_DOC"                        : "الملف التالي",
    "CMD_PREV_DOC"                        : "الملف السابق",
    "CMD_SHOW_IN_TREE"                    : "إظهار على شجرة الملفات",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "المعالجة",
    "CMD_REFRESH_WINDOW"                  : "إعادة تحميل {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "إظهار أدوات المطورين",
    "CMD_RUN_UNIT_TESTS"                  : "بدأ التجارب",
    "CMD_JSLINT"                          : "تفعيل JSLint",
    "CMD_SHOW_PERF_DATA"                  : "إظهار معطيات الاداء",
    "CMD_NEW_BRACKETS_WINDOW"             : "نافذة {APP_NAME} جديدة",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "إظهار مجلد الملحقات",
    "CMD_SWITCH_LANGUAGE"                 : "تغيير اللغة",
    "CMD_CHECK_FOR_UPDATE"                : "البحث عن تحديثات",

    // Help menu commands
    "HELP_MENU"                           : "المساعدة",
    "CMD_ABOUT"                           : "عن {APP_TITLE}",
    "CMD_FORUM"                           : "{APP_NAME} منتدى",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "إغلاق النافذة",
    "CMD_ABORT_QUIT"                      : "عدم الإغلاق",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimental build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "JSLINT_ERRORS"                        : "JSLint Errors",
    "JSLINT_ERROR_INFORMATION"             : "1 JSLint Error",
    "JSLINT_ERRORS_INFORMATION"            : "{0} JSLint Errors",
    "JSLINT_NO_ERRORS"                     : "No JSLint errors - good job!",
    "JSLINT_DISABLED"                      : "JSLint disabled or not working for the current file",
    "SEARCH_RESULTS"                       : "نتيجة البحث",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "بدون حفظ",
    "SAVE"                                 : "حفظ",
    "CANCEL"                               : "إلغاء",
    "RELOAD_FROM_DISK"                     : "إعادة القراءة من القرص",
    "KEEP_CHANGES_IN_EDITOR"               : "إترك التغييرات في المحرر",
    "CLOSE_DONT_SAVE"                      : "إغلاق (بدون حفظ)",
    "RELAUNCH_CHROME"                      : "إعادة تشغيل كروم",
    "ABOUT"                                : "عن",
    "APP_NAME"                             : "Brackets",
    "CLOSE"                                : "إغلاق",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "الإشعارات, الشروط والأحكام متعلقة بطرف ثالث في البرمجيات موجودة في <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> و مندمجة مرجعيا هنا.",
	
    "ABOUT_TEXT_LINE4"                     : "دليل الاستخدام و المصدر موجودان في <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "هناك بناء جديد للبرنامج {APP_NAME} ! أنقر هنا للمزيد من التفاصيل.",
    "UPDATE_AVAILABLE_TITLE"               : "يوجد تحديث",
    "UPDATE_MESSAGE"                       : "يوجد بناء جديد {APP_NAME}. هذه بعض خصائصه:",
    "GET_IT_NOW"                           : "حمله الان!",
    "PROJECT_SETTINGS_TITLE"               : "خصائص المشروع ل: {0}",
    "PROJECT_SETTING_BASE_URL"             : "الرابط الاساسي للمعاينة المباشرة",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(إتركه فارغا إذا أردت إستعمال الملف مباشرة)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0} البروتوكول غير متوافق مع المعاينة المباشرة&mdash;المرجو إستعمال http: or https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "لا يمكن للرابط الاساسي أن يحتوي على روابط للبحث مثل \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "لا يمكن للرابط الاساسي أن يحتوي على هاشات مثل \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "الأحرف الخاصة مثل '{0}' must be %-encoded.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "خطأ غير معروف أثناء تحليل الرابط الاساسي",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "اللون الحالي",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "اللون الأصلي",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa Format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex Format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa Format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (إستعمل {1} مرة)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (إستعمل {1} مرات)"
});
