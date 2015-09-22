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
    "GENERIC_ERROR"                     : "(грешка {0})",
    "NOT_FOUND_ERR"                     : "Непостојећа датотека.",
    "NOT_READABLE_ERR"                  : "Датотека не може бити учитана.",
    "EXCEEDS_MAX_FILE_SIZE"             : "Датотеке веће од {0} MB се не могу отворити у {APP_NAME}-у.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Циљани директоријум не може бити измењен.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Тренутна овлашћења Вам не дозвољавају да правите измене.",
    "CONTENTS_MODIFIED_ERR"             : "Ова датотека је била измењена ван {APP_NAME}-а.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} тренутно подржава искључиво текстуалне датотеке које су енкодиране у UTF-8 формату.",
    "FILE_EXISTS_ERR"                   : "Датотека или директоријум већ постоји.",
    "FILE"                              : "датотека",
    "FILE_TITLE"                        : "Датотека",
    "DIRECTORY"                         : "директоријум",
    "DIRECTORY_TITLE"                   : "Директоријум",
    "DIRECTORY_NAMES_LEDE"              : "Имена директоријума",
    "FILENAMES_LEDE"                    : "Имена датотека",
    "FILENAME"                          : "Име датотеке",
    "DIRECTORY_NAME"                    : "Име директоријума",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Грешка приликом учитавања пројекта",
    "OPEN_DIALOG_ERROR"                 : "Дошло је до грешке приликом приказивања дијалога за отварање датотеке. (грешка {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Дошло је до грешке приликом покушаја да се учита директоријум <span class='dialog-filename'>{0}</span>. (грешка {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Дошло је до грешке приликом ишчитавања садржаја директоријума <span class='dialog-filename'>{0}</span>. (грешка {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Грешка при отварању датотеке",
    "ERROR_OPENING_FILE"                : "Дошло је до грешке приликом покушаја да се отвори датотека <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Дошло је до грешке приликом покушаја да се отворе следеће датотеке:",
    "ERROR_RELOADING_FILE_TITLE"        : "Грешка при поновном учитавању измена са диска",
    "ERROR_RELOADING_FILE"              : "Дошло је до грешке приликом покушаја да се поново учита датотека <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Грешка при чувању датотеке",
    "ERROR_SAVING_FILE"                 : "Дошло је до грешке приликом покушаја да се сачува датотека <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Грешка приликом преименовања датотеке {0}",
    "ERROR_RENAMING_FILE"               : "Дошло је до грешке приликом покушаја да се преименује датотека {2} <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Грешка при брисању датотеке {0}",
    "ERROR_DELETING_FILE"               : "Дошло је до грешке приликом покушаја да се обрише датотека {2} <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Име {0} није валидно",
    "INVALID_FILENAME_MESSAGE"          : "Име {0} не сме садржати системски резервисане речи, не сме се завршити тачком (.) или користити неки од следећих карактера: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "Датотека или директоријум са именом <span class='dialog-filename'>{0}</span> већ постоји.",
    "ERROR_CREATING_FILE_TITLE"         : "Грешка при креирању {0}",
    "ERROR_CREATING_FILE"               : "Дошло је до грешке приликом покушаја да се креира {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP"              : "Директоријум се не може учитавати у исто време када и остале датотеке.",

    // User key map error strings
    "ERROR_KEYMAP_TITLE"                : "Грешка приликом ишчитавања корисничке мапе пречица на тастатури",
    "ERROR_KEYMAP_CORRUPT"              : "Ваша мапа пречица на тастатури није валидан JSON. Датотека ће бити отворена како бисте исправили формат.",
    "ERROR_LOADING_KEYMAP"              : "Ваша мапа пречица на тастатури није валидна UTF-8 енкодирана текстуална датотека и не може се учитати",
    "ERROR_RESTRICTED_COMMANDS"         : "Не можете поново доделити пречице овим командама: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"        : "Не можете доделити ове пречице: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"          : "Додајете више пречица на тастатури за ове команде: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"         : "Имате више комбинација за ове пречице: {0}",
    "ERROR_INVALID_SHORTCUTS"           : "Ове пречице нису валидне: {0}",
    "ERROR_NONEXISTENT_COMMANDS"        : "Додајете пречице на тастатури непостојећим командама: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Грешка приликом ишчитавања подешавања",
    "ERROR_PREFS_CORRUPT"               : "Ваша датотека са подешавањима није валидан JSON. Датотека ће бити отворена како бисте исправили формат. Биће неопходно да поново покренете {APP_NAME} како би измене биле примењене.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Упс! {APP_NAME} још увек не ради у веб претраживачу.",
    "ERROR_IN_BROWSER"                  : "Апликација {APP_NAME} је направљена помоћу HTML-а, али тренутно ради као \"desktop\" апликација па је можете користити за измену локалних датотека. Молимо Вас користите \"application shell\" на <b>github.com/adobe/brackets-shell</b> репозиторијуму за покретање {APP_NAME}-а.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Грешка приликом индексирања датотека",
    "ERROR_MAX_FILES"                   : "Пројекат садржи више од 30.000 датотека. Делови апликације који врше обраду над више датотека могу постати неактивни или се понашати као да је пројекат празан. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>Прочитајте више о раду са великим пројектима</a>.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Грешка при покретању претраживача",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome претраживач није пронађен. Молимо потврдите да је инсталиран.",
    "ERROR_LAUNCHING_BROWSER"           : "Грешка приликом покретања претраживача. (error {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Грешка у живом приказу",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Повезивање са веб претраживачем",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Да би се живи приказ повезао, потребно је да поново покренете Chrome са укљученим подешавањима за \"remote debugging\".<br /><br />Да ли желите поново да покренете Chrome са укљученим подешавањима за \"remote debugging\"?<br /><br />",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Није могуће учитати страницу са живим приказом.",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Отворите HTML датотеку како бисте били сигурни да постоји index.html датотека у Вашем пројекту како бисте покренули живи приказ.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "За покретање живог приказа са датотеком која је \"server-side\", морате навести основну URL адресу за овај пројекат.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Грешка приликом покретања HTTP сервера за \"живе\" развојне датотеке. Молимо покушајте поново.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Добро дошли у живи приказ!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Живи приказ повезује {APP_NAME} са Вашим веб претраживачем. Он покреће Вашу HTML датотеку у претраживачу, а потом ажурира приказ тренутно док Ви мењате Ваш кôд.<br /><br />У овој раној верзији {APP_NAME}-a, живи приказ ради једино у <strong>Google Chrome</strong> претраживачу и ажурира приказ док мењате <strong>CSS или HTML датотеке</strong>. За освежавање приказа приликом измена у JavaScript датотекама потребно је да сачувате Ваше измене.<br /><br />(Ова порука ће се приказати само једном.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "За више информација, погледајте <a href='{0}' title='{0}'>Отклањање грешака у конекцији приликом развоја уживо</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Живи приказ",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Живи приказ: Успостављање конекције\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Живи приказ: Иницијализација\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Прекини конекцију са живим приказом",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Живи приказ (сачувај датотеку за освежавање)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Живи приказ (не освежава се због грешке у синтакси)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Живи приказ је отказан јер су развојни алати били отворени у претраживачу",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Живи приказ је отказан јер је страница затворена у претраживачу",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Живи приказ је отказан јер је претраживач отишао на страницу која није део тренутног пројекта",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Живи приказ је отказан из непознатог разлога ({0})",

    "SAVE_CLOSE_TITLE"                  : "Сачувај измене",
    "SAVE_CLOSE_MESSAGE"                : "Да ли желите да сачувате измене које сте направили у документу <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Да ли желите да сачувате Ваше измене над следећим датотекама?",
    "EXT_MODIFIED_TITLE"                : "Екстерне измене",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Потврди брисање",
    "CONFIRM_FOLDER_DELETE"             : "Да ли сте сигурни да желите обрисати директоријум <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Датотека обрисана",
    "EXT_MODIFIED_WARNING"              : "Датотека <span class='dialog-filename'>{0}</span> је измењена на диску.<br /><br />Да ли желите да сачувате датотеку и преснимите те измене?",
    "EXT_MODIFIED_MESSAGE"              : "Датотека <span class='dialog-filename'>{0}</span> је измењена на диску, али садржи и измене начињене у {APP_NAME}-у.<br /><br />Коју верзију желите да сачувате?",
    "EXT_DELETED_MESSAGE"               : "Датотека <span class='dialog-filename'>{0}</span> је обрисана са диска, али садржи несачуване измене начињене у {APP_NAME}-у.<br /><br />Да ли желите да сачувате Ваше измене?",

    // Generic dialog/button labels
    "DONE"                              : "Завршено",
    "OK"                                : "OK",
    "CANCEL"                            : "Откажи",
    "DONT_SAVE"                         : "Немој сачувати",
    "SAVE"                              : "Сачувај",
    "SAVE_AS"                           : "Сачувај као\u2026",
    "SAVE_AND_OVERWRITE"                : "Сачувај и препиши",
    "DELETE"                            : "Обриши",
    "BUTTON_YES"                        : "Да",
    "BUTTON_NO"                         : "Не",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                  : "{0} од {1}",
    "FIND_NO_RESULTS"                   : "Нема резултата",
    "FIND_QUERY_PLACEHOLDER"            : "Пронађи\u2026",
    "REPLACE_PLACEHOLDER"               : "Замени са\u2026",
    "BUTTON_REPLACE_ALL"                : "Комплет\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Замени\u2026",
    "BUTTON_REPLACE"                    : "Замени",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Следеће поклапање",
    "BUTTON_PREV_HINT"                  : "Претходно поклапање",
    "BUTTON_CASESENSITIVE_HINT"         : "Иста величина",
    "BUTTON_REGEXP_HINT"                : "Регуларни израз",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Замени без опозива",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Зато што је потребно променити више од {0} датотека, {APP_NAME} ће изменити неотворене датотеке на диску.<br />Нећете бити у могућности да опозовете измене у овим датотекама.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Замени без опозива",

    "OPEN_FILE"                         : "Отвори датотеку",
    "SAVE_FILE_AS"                      : "Сачувај датотеку",
    "CHOOSE_FOLDER"                     : "Изабери директоријум",

    "RELEASE_NOTES"                     : "Обавештење о изменама",
    "NO_UPDATE_TITLE"                   : "Имате актуелну верзију!",
    "NO_UPDATE_MESSAGE"                 : "Тренутно поседујете актуелну верзију апликације {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Замени",
    "FIND_REPLACE_TITLE_WITH"           : "са",
    "FIND_TITLE_LABEL"                  : "Пронађено",
    "FIND_TITLE_SUMMARY"                : "&mdash; {0} {1} {2} у {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "у <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "у пројекту",
    "FIND_IN_FILES_ZERO_FILES"          : "Филтер искључује све датотеке {0}",
    "FIND_IN_FILES_FILE"                : "датотеци",
    "FIND_IN_FILES_FILES"               : "датотека",
    "FIND_IN_FILES_MATCH"               : "поклапање",
    "FIND_IN_FILES_MATCHES"             : "поклапања",
    "FIND_IN_FILES_MORE_THAN"           : "Преко ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Притисните Ctrl/Cmd и кликните како бисте раширили/скупили све",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Замени грешке",
    "REPLACE_IN_FILES_ERRORS"           : "Следеће датотеке нису модификоване зато што су измењене након претраге или у њих није било могуће уписивати.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Грешка приликом учитавања информација о новој верзији",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Дошло је до проблема приликом преузимања последњих информација о новој верзији са сервера. Молимо проверите да ли сте повезани на интернет и покушајте поново.",

    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Нови сет искључења\u2026",
    "CLEAR_FILE_FILTER"                 : "Немој исључити датотеке",
    "NO_FILE_FILTER"                    : "Ниједна датотека није искључена",
    "EXCLUDE_FILE_FILTER"               : "Искључи {0}",
    "EDIT_FILE_FILTER"                  : "Измени\u2026",
    "FILE_FILTER_DIALOG"                : "Измени сет искључења",
    "FILE_FILTER_INSTRUCTIONS"          : "Искључи све датотеке и директоријуме који се поклапају са било којим од следећих низова / поднизова или <a href='{0}' title='{0}'>џокер знакова</a>. Enter each string on a new line.",
    "FILTER_NAME_PLACEHOLDER"           : "Дај име овом сету искључења (опционо)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "и још {0}",
    "FILTER_COUNTING_FILES"             : "Пребројавам датотеке\u2026",
    "FILTER_FILE_COUNT"                 : "Дозвољава {0} од {1} датотека {2}",
    "FILTER_FILE_COUNT_ALL"             : "Дозвољава свих {0} датотека {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Брза измена није доступна на тренутној позицији курсора",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "CSS Брза измена: позиционирајте курсор на једно име класе",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "CSS Брза измена: непотпун атрибут класе",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "CSS Брза измена: непотпун атрибут идентификатора",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "CSS Брза измена: позиционирајте курсор на таг, класу, или идентификатор",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "CSS Времендска функција Брза измена: синтакса није валидна",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "JS Брза измена: позиционирајте курсор на име функције",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Брзи документи нису доступни за тренутну позицију курсора",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Учитавам\u2026",
    "UNTITLED"          : "Неименовано",
    "WORKING_FILES"     : "Радне датотеке",

    /**
     * MainViewManager
     */
    "TOP"               : "Горе",
    "BOTTOM"            : "Доле",
    "LEFT"              : "Лево",
    "RIGHT"             : "Десно",

    "CMD_SPLITVIEW_NONE"        : "Без поделе",
    "CMD_SPLITVIEW_VERTICAL"    : "Вертикална подела",
    "CMD_SPLITVIEW_HORIZONTAL"  : "Хоризонтална подела",
    "SPLITVIEW_MENU_TOOLTIP"    : "Подели едитор вертикално или хоризонтално",
    "GEAR_MENU_TOOLTIP"         : "Конфигуриши радни сет",

    "SPLITVIEW_INFO_TITLE"              : "Већ отворена",
    "SPLITVIEW_MULTIPANE_WARNING"       : "Датотека је већ отворена у другом панелу. {APP_NAME} ће ускоро подржавати отварање исте датотеке у више панела. До тада, датотека ће бити приказана у панелу у коме је већ отворена.<br /><br />(Ова порука ће се приказати само једном.)",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Линија {0}, колона {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Изабрана {0} колона",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Изабрано {0} колона",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Изабрана {0} линија",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Изабрано {0} линија",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} селекција",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Кликни за коришћење размака приликом увлачења кôда",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Кликни за коришћење таб-ова приликом увлачења кôда",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Кликни за промену броја размака приликом увлачења кôда",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Кликни за промену величине таб-а приликом увлачења кôда",
    "STATUSBAR_SPACES"                      : "Размаци:",
    "STATUSBAR_TAB_SIZE"                    : "Величина таб-а:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} линија",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} линија",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Екстензије деактивиране",
    "STATUSBAR_INSERT"                      : "УБ",
    "STATUSBAR_OVERWRITE"                   : "ПРЕ",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Кликни да промениш мôд курсора из Убаци (УБ) у Препиши (ПРЕ) и обрнуто",
    "STATUSBAR_LANG_TOOLTIP"                : "Кликни за измену типа датотеке",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Кликни за приказ/скривање панела са извештајима.",
    "STATUSBAR_DEFAULT_LANG"                : "(подразумевано)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Подеси као \"подразумевано\" за .{0} датотеке",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} грешака",
    "SINGLE_ERROR"                          : "1 {0} грешка",
    "MULTIPLE_ERRORS"                       : "{1} {0} грешака",
    "NO_ERRORS"                             : "Нема {0} грешака - свака част!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Нема пронађених грешака - свака част!",
    "LINT_DISABLED"                         : "Детектовање сумњивог кôда искључено",
    "NO_LINT_AVAILABLE"                     : "Ниједан детектор сумњивог кôда није доступан за {0}",
    "NOTHING_TO_LINT"                       : "Није пронађен сумњив кôд",
    "LINTER_TIMED_OUT"                      : "Прекинуто је извршавање {0} након чекања од {1} ms",
    "LINTER_FAILED"                         : "Прекинуто је извршавање {0} уз грешку: {1}",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Датотека",
    "CMD_FILE_NEW_UNTITLED"               : "Нова",
    "CMD_FILE_NEW"                        : "Нова датотека",
    "CMD_FILE_NEW_FOLDER"                 : "Нови директоријум",
    "CMD_FILE_OPEN"                       : "Отвори\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Додај у радни сет",
    "CMD_OPEN_DROPPED_FILES"              : "Open Dropped Files",
    "CMD_OPEN_FOLDER"                     : "Отвори директоријум\u2026",
    "CMD_FILE_CLOSE"                      : "Затвори",
    "CMD_FILE_CLOSE_ALL"                  : "Затвори све",
    "CMD_FILE_CLOSE_LIST"                 : "Затвори листу",
    "CMD_FILE_CLOSE_OTHERS"               : "Затвори остале",
    "CMD_FILE_CLOSE_ABOVE"                : "Затвори остале изнад",
    "CMD_FILE_CLOSE_BELOW"                : "Затвори остале испод",
    "CMD_FILE_SAVE"                       : "Сачувај",
    "CMD_FILE_SAVE_ALL"                   : "Сачувај све",
    "CMD_FILE_SAVE_AS"                    : "Сачувај као\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Живи приказ",
    "CMD_RELOAD_LIVE_PREVIEW"             : "На силу обнови Живи приказ",
    "CMD_PROJECT_SETTINGS"                : "Подешавање пројекта\u2026",
    "CMD_FILE_RENAME"                     : "Преименуј",
    "CMD_FILE_DELETE"                     : "Обриши",
    "CMD_INSTALL_EXTENSION"               : "Инсталирај екстензију\u2026",
    "CMD_EXTENSION_MANAGER"               : "Менаџер екстензија\u2026",
    "CMD_FILE_REFRESH"                    : "Освежи стабло датотека",
    "CMD_QUIT"                            : "Прекини",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Излаз",

    // Edit menu commands
    "EDIT_MENU"                           : "Уреди",
    "CMD_UNDO"                            : "Опозови",
    "CMD_REDO"                            : "Понови",
    "CMD_CUT"                             : "Исеци",
    "CMD_COPY"                            : "Копирај",
    "CMD_PASTE"                           : "Налепи",
    "CMD_SELECT_ALL"                      : "Изабери све",
    "CMD_SELECT_LINE"                     : "Изабери линију",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Подели селекцију на линије",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Додај курсор следећој линији",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Додај курсор претходној линији",
    "CMD_INDENT"                          : "Помери удесно",
    "CMD_UNINDENT"                        : "Помери улево",
    "CMD_DUPLICATE"                       : "Удвостручи",
    "CMD_DELETE_LINES"                    : "Обриши линију",
    "CMD_COMMENT"                         : "Додај/уклони линијски коментар",
    "CMD_BLOCK_COMMENT"                   : "Додај/уклони блок коментар",
    "CMD_LINE_UP"                         : "Помери линију горе",
    "CMD_LINE_DOWN"                       : "Помери линију доле",
    "CMD_OPEN_LINE_ABOVE"                 : "Отвори линију изнад",
    "CMD_OPEN_LINE_BELOW"                 : "Отвори линију испод",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Аутоматски затвори заграде",
    "CMD_SHOW_CODE_HINTS"                 : "Пружи малу помоћ око кôда",

    // Search menu commands
    "FIND_MENU"                           : "Пронађи",
    "CMD_FIND"                            : "Пронађи",
    "CMD_FIND_NEXT"                       : "Пронађи следеће",
    "CMD_FIND_PREVIOUS"                   : "Пронађи претходно",
    "CMD_FIND_ALL_AND_SELECT"             : "Пронађи све и изабери",
    "CMD_ADD_NEXT_MATCH"                  : "Додај следеће поклапање у селекцију",
    "CMD_SKIP_CURRENT_MATCH"              : "Прескочи и додај следеће поклапање",
    "CMD_FIND_IN_FILES"                   : "Пронађи међу датотекама",
    "CMD_FIND_IN_SUBTREE"                 : "Пронађи у\u2026",
    "CMD_REPLACE"                         : "Замени",
    "CMD_REPLACE_IN_FILES"                : "Замени у датотекама",
    "CMD_REPLACE_IN_SUBTREE"              : "Замени у\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Приказ",
    "CMD_HIDE_SIDEBAR"                    : "Сакриј споредну траку",
    "CMD_SHOW_SIDEBAR"                    : "Прикажи споредну траку",
    "CMD_INCREASE_FONT_SIZE"              : "Повећај величину фонта",
    "CMD_DECREASE_FONT_SIZE"              : "Смањи величину фонта",
    "CMD_RESTORE_FONT_SIZE"               : "Поврати величину фонта",
    "CMD_SCROLL_LINE_UP"                  : "Помакни једну линију горе",
    "CMD_SCROLL_LINE_DOWN"                : "Помакни једну линију доле",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Бројеви редова",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Означи активну линију",
    "CMD_TOGGLE_WORD_WRAP"                : "Прелом текста",
    "CMD_LIVE_HIGHLIGHT"                  : "Обележи живи приказ",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Преконтролиши датотеке приликом чувања",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Сортирај по датуму додавања",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Сортирај по имену",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Сортирај по типу",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Аутоматско сортирање",
    "CMD_THEMES"                          : "Теме\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Навигација",
    "CMD_QUICK_OPEN"                      : "Отвори на брзину",
    "CMD_GOTO_LINE"                       : "Иди на линију",
    "CMD_GOTO_DEFINITION"                 : "Брзо пронађи дефиницију",
    "CMD_GOTO_FIRST_PROBLEM"              : "Иди на први проблем",
    "CMD_TOGGLE_QUICK_EDIT"               : "Измени на брзину",
    "CMD_TOGGLE_QUICK_DOCS"               : "Брзи документи",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Претходно поклапање",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Следеће поклапање",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Ново правило",
    "CMD_NEXT_DOC"                        : "Следећи документ",
    "CMD_PREV_DOC"                        : "Претходни документ",
    "CMD_SHOW_IN_TREE"                    : "Прикажи у стаблу датотека",
    "CMD_SHOW_IN_EXPLORER"                : "Прикажи у Explorer-у",
    "CMD_SHOW_IN_FINDER"                  : "Прикажи у Проналазачу",
    "CMD_SHOW_IN_OS"                      : "Прикажи у оперативном систему",

    // Help menu commands
    "HELP_MENU"                           : "Помоћ",
    "CMD_CHECK_FOR_UPDATE"                : "Провери да ли постоји новијa верзија",
    "CMD_HOW_TO_USE_BRACKETS"             : "Корисничко упутство за {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME} подршка",
    "CMD_SUGGEST"                         : "Предложи нову функционалност",
    "CMD_RELEASE_NOTES"                   : "Белешке о тренутној верзији",
    "CMD_GET_INVOLVED"                    : "Прикључи се развоју апликације",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Прикажи директоријум са екстензијама",
    "CMD_HOMEPAGE"                        : "{APP_TITLE} веб страница",
    "CMD_TWITTER"                         : "{TWITTER_NAME} на Твитеру",
    "CMD_ABOUT"                           : "О апликацији {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Отвори датотеку са подешавањима",
    "CMD_OPEN_KEYMAP"                     : "Отвори мапу корисничких пречица на тастатури",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "експериментална верзија",
    "RELEASE_BUILD"                        : "билд",
    "DEVELOPMENT_BUILD"                    : "развојна верзија",
    "RELOAD_FROM_DISK"                     : "Поново учитај са диска",
    "KEEP_CHANGES_IN_EDITOR"               : "Сачувај измене у едитору",
    "CLOSE_DONT_SAVE"                      : "Затвори (без чувања измена)",
    "RELAUNCH_CHROME"                      : "Поново покрени Chrome",
    "ABOUT"                                : "О апликацији",
    "CLOSE"                                : "Затвори",
    "ABOUT_TEXT_LINE1"                     : "Итерација {VERSION_MAJOR}.{VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "временска ознака билда: ",
    "ABOUT_TEXT_LINE3"                     : "Обавештења, обавезе и услови коришћења који се односе на \"third party\" софтвер су лоцирани на <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> и укључени су овде путем референце.",
    "ABOUT_TEXT_LINE4"                     : "Документација и изворни кôд на <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Направили са \u2764 и JavaScript-ом:",
    "ABOUT_TEXT_LINE6"                     : "Много људи (али тренутно имамо потешкоћа да учитамо те податке).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "\"Web Platform Docs\" и \"Web Platform\" логотип су заштићени \"Creative Commons Attribution\" лиценцом, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Објављена је нова верзија {APP_NAME}-а! Кликните овде за више информација.",
    "UPDATE_AVAILABLE_TITLE"               : "Нова верзија доступна",
    "UPDATE_MESSAGE"                       : "Хеј, нова верзија {APP_NAME}-а је доступна. Ово су нека од најновијих унапређења:",
    "GET_IT_NOW"                           : "Преузми сада!",
    "PROJECT_SETTINGS_TITLE"               : "Подешавања пројекта за: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Основна URL адреса за живи приказ",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Да бисте користили локални сервер, унесите адресу (url) попут http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Живи приказ не подржава протокол {0}&mdash;Молимо Вас користите http: или https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Основна URL адреса не сме садржати параметре попут \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Основна URL адреса не сме садржати хешеве (hashes) попут \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Специјални карактери попут '{0}' морају бити %-енкодирани.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Непозната грешка приликом парсирања основне URL адресе",
    "EMPTY_VIEW_HEADER"                    : "<em>Отвори датотеку док је овај панел у фокусу</em>",

    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Тренутна тема",
    "USE_THEME_SCROLLBARS"                 : "Користи клизаче из теме",
    "FONT_SIZE"                            : "Величина фонта",
    "FONT_FAMILY"                          : "Породица фонта",
    "THEMES_SETTINGS"                      : "Подешавања теме",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Ново правило",

    // Extension Management strings
    "INSTALL"                              : "Инсталирај",
    "UPDATE"                               : "Ажурирај",
    "REMOVE"                               : "Уклони",
    "OVERWRITE"                            : "Пресними",
    "CANT_REMOVE_DEV"                      : "Екстензије у \"dev\" директоријуму морају бити ручно обрисане.",
    "CANT_UPDATE"                          : "Нова верзија није компатибилна са тренутном верзијом {APP_NAME}-а.",
    "CANT_UPDATE_DEV"                      : "Extensions in the \"dev\" folder can't be updated automatically.",
    "INSTALL_EXTENSION_TITLE"              : "Инсталирај екстензију",
    "UPDATE_EXTENSION_TITLE"               : "Ажурирај екстензију",
    "INSTALL_EXTENSION_LABEL"              : "URL екстензије",
    "INSTALL_EXTENSION_HINT"               : "Интернет адреса (URL) zip архиве екстензије или GitHub репозиторијума",
    "INSTALLING_FROM"                      : "Инсталирам екстензију са {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Инсталација успешна!",
    "INSTALL_FAILED"                       : "Инсталација неуспешна.",
    "CANCELING_INSTALL"                    : "Отказујем\u2026",
    "CANCELING_HUNG"                       : "Отказивање инсталације траје предуго. Могуће да је дошло до интерне грешке.",
    "INSTALL_CANCELED"                     : "Инсталација отказана.",
    "VIEW_COMPLETE_DESCRIPTION"            : "Прикажи комплетан опис",
    "VIEW_TRUNCATED_DESCRIPTION"           : "Прикажи сажет опис",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Преузети садржај није валидна zip архива.",
    "INVALID_PACKAGE_JSON"                 : "Датотека \"package.json\" није валидна (грешка: {0}).",
    "MISSING_PACKAGE_NAME"                 : "У датотеци \"package.json\" није наведено име пакета.",
    "BAD_PACKAGE_NAME"                     : "{0} није валидно име за пакет.",
    "MISSING_PACKAGE_VERSION"              : "У датотеци \"package.json\" није наведена верзија пакета.",
    "INVALID_VERSION_NUMBER"               : "Верзија пакета број ({0}) није валидна.",
    "INVALID_BRACKETS_VERSION"             : "{APP_NAME}-ов низ о компатибилности ({0}) није валидан.",
    "DISALLOWED_WORDS"                     : "Речи ({1}) нису дозвољене у пољу {0}.",
    "API_NOT_COMPATIBLE"                   : "Ова екстензија није компатибилна са тренутном верзијом апликације \"{APP_NAME}\". Инсталирана је у Ваш директоријум са неактивним екстензијама.",
    "MISSING_MAIN"                         : "Овај пакет нема \"main.js\" датотеку.",
    "EXTENSION_ALREADY_INSTALLED"          : "Инсталирањем овог пакета ћете преснимити претходно инсталирану екстензију. Да ли желите да преснимите стару инсталацију?",
    "EXTENSION_SAME_VERSION"               : "Верзија овог пакета је иста као верзија која је тренутно инсталирана. Да ли желите да преснимите постојећу инсталацију?",
    "EXTENSION_OLDER_VERSION"              : "Овај пакет је у верзији {0} што је старије од тренутно инсталиране верзије ({1}). Да ли желите да преснимите постојећу инсталацију?",
    "DOWNLOAD_ID_IN_USE"                   : "Интерна грешка: ID преузимања је већ у употреби.",
    "NO_SERVER_RESPONSE"                   : "Повезивање са сервером није могуће.",
    "BAD_HTTP_STATUS"                      : "Датотека није пронађена на серверу (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Није могуће сачувати преузете податке у привремену датотеку.",
    "ERROR_LOADING"                        : "Дошло је до грешке у екстензији приликом њеног покретања.",
    "MALFORMED_URL"                        : "URL није валидан. Молимо проверите да ли је Ваш унос тачан.",
    "UNSUPPORTED_PROTOCOL"                 : "URL мора бити http или https.",
    "UNKNOWN_ERROR"                        : "Непозната интерна грешка.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Менаџер екстензија",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Приступање регистру екстензије није могуће. Молимо покушајте касније.",
    "INSTALL_EXTENSION_DRAG"               : "Превуци .zip овде или",
    "INSTALL_EXTENSION_DROP"               : "Пусти .zip за инсталирање",
    "INSTALL_EXTENSION_DROP_ERROR"         : "Инсталирање/Ажурирање прекинуто услед следећих грешака:",
    "INSTALL_FROM_URL"                     : "Инсталирај са URL адресе\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "Валидирам\u2026",
    "EXTENSION_AUTHOR"                     : "Аутор",
    "EXTENSION_DATE"                       : "Датум",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Ова екстензија захтева новиу верзију {APP_NAME}-а.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Ова екстензија тренутно ради само у старијим верзијама {APP_NAME}-а.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Верзија {0} ове екстензије захтева новију верзију апликације {APP_NAME}. Али можете инсталирати ранију верзију {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Верзија {0} ове екстензије ради искључиво са старијим верзијама апликације {APP_NAME}. Али можете инсталирати ранију верзију {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Не постоји опис",
    "EXTENSION_MORE_INFO"                  : "Више информација...",
    "EXTENSION_ERROR"                      : "Грешка у екстензији",
    "EXTENSION_KEYWORDS"                   : "Кључне речи",
    "EXTENSION_TRANSLATED_USER_LANG"       : "Преведено на {0} језика, укључујући Ваш",
    "EXTENSION_TRANSLATED_GENERAL"         : "Преведено на {0} језика",
    "EXTENSION_TRANSLATED_LANGS"           : "Ова екстензија је преведена на ове језике: {0}",
    "EXTENSION_INSTALLED"                  : "Инсталирано",
    "EXTENSION_UPDATE_INSTALLED"           : "Ова верзија екстензије је већ преузета и биће инсталирана приликом поновног покретања {APP_NAME}-а.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Пронађи",
    "EXTENSION_MORE_INFO_LINK"             : "Још",
    "BROWSE_EXTENSIONS"                    : "Претражи екстензије",
    "EXTENSION_MANAGER_REMOVE"             : "Уклони екстензију",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Није могуће уклонити једну или више екстензија: {0}. {APP_NAME} ће се ипак поново покренути.",
    "EXTENSION_MANAGER_UPDATE"             : "Ажурирај екстензију",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Није могуће ажурирати једну или више екстензија: {0}. {APP_NAME} ће се ипак поново покренути.",
    "MARKED_FOR_REMOVAL"                   : "Означено за уклањање",
    "UNDO_REMOVE"                          : "Опозови",
    "MARKED_FOR_UPDATE"                    : "Означено за ажурирање",
    "UNDO_UPDATE"                          : "Опозови",
    "CHANGE_AND_RELOAD_TITLE"              : "Промени екстензије",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Да би се означене екстензије ажурирале или уклониле \"{APP_NAME}\" ће морати поново да се покрене. Од Вас ће бити затражено да сачувате измене.",
    "REMOVE_AND_RELOAD"                    : "Уклони екстензије и изађи",
    "CHANGE_AND_RELOAD"                    : "Промени екстензије и изађи",
    "UPDATE_AND_RELOAD"                    : "Ажурирај екстензије и изађи",
    "PROCESSING_EXTENSIONS"                : "Процесуирам измене у екстензијама\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Екстензија {0} није могла бити уклоњена јер није била инсталирана.",
    "NO_EXTENSIONS"                        : "Тренутно нема инсталираних екстензија.<br>Кликните изнад на картицу Доступно да додате екстензију.",
    "NO_EXTENSION_MATCHES"                 : "Ниједна екстензија се не поклапа са унетим параметрима претраге.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "ОПРЕЗ: Ове екстензије можда потичу од непознатих извора. Екстензије нису проверене и поседују пуне локалне привилегије. Будите обазриви приликом инсталације екстензија које потичу од непознатих извора.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Инсталирано",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Доступно",
    "EXTENSIONS_THEMES_TITLE"              : "Теме",
    "EXTENSIONS_UPDATES_TITLE"             : "Ажурирања",

    "INLINE_EDITOR_NO_MATCHES"             : "Нема поклапања.",
    "INLINE_EDITOR_HIDDEN_MATCHES"         : "Сва поклапања су скривена. Раширите датотеке излистане на десној страни како бисте видели поклапања.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Не постоје CSS правила која се поклапају са Вашом селекцијом.<br> Кликните \"Ново правило\" како бисте креирали ново.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Не постоје стилови у вашем пројекту.<br>Креирајте један или додајте CSS правила.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "највећа",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "пиксели",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Отклањање грешака",
    "ERRORS"                                    : "Грешке",
    "CMD_SHOW_DEV_TOOLS"                        : "Прикажи развојне алате",
    "CMD_REFRESH_WINDOW"                        : "Поново учитај са екстензијама",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Поново учитај без екстензија",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Нови {APP_NAME} прозор",
    "CMD_SWITCH_LANGUAGE"                       : "Промени језик",
    "CMD_RUN_UNIT_TESTS"                        : "Изврши тестове",
    "CMD_SHOW_PERF_DATA"                        : "Прикажи податке о перформансама",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Укључи Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Прикажи стање Node-а у конзоли",
    "CMD_RESTART_NODE"                          : "Поново покрени Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Прикажи грешке у статусној линији",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Отвори изворни кôд Brackets-а",

    "LANGUAGE_TITLE"                            : "Промени језик",
    "LANGUAGE_MESSAGE"                          : "Језик:",
    "LANGUAGE_SUBMIT"                           : "Поново учитај {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Откажи",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "језик система",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Време",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Напредак",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Помери изабрану тачку<br><kbd class='text'>Shift</kbd> Помери за десет јединица<br><kbd class='text'>Tab</kbd> Замени тачке",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Повећај или смањи кораке<br><kbd>←</kbd><kbd>→</kbd> 'Почни' или 'Заврши'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Стара вредност <code>{0}</code> није валидна, па је приказана функција промењена у <code>{1}</code>. Овај документ ће се ажурирати приликом прве измене.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Тренутна боја",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Оригинална боја",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa формат",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex формат",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa формат",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Коришћена {1} пут)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Коришћена {1} пута)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Скочи на дефиницију",
    "CMD_SHOW_PARAMETER_HINT"                   : "Пружи малу помоћ око параметра",
    "NO_ARGUMENTS"                              : "<без параметара>",
    "DETECTED_EXCLUSION_TITLE"                  : "Проблем у обради JavaScript датотеке",
    "DETECTED_EXCLUSION_INFO"                   : "Brackets није успео да процесуира <span class='dialog-filename'>{0}</span>.<br><br>Ова датотека више неће бити процесуирана за приказивање малих помоћи у кôду, Скочи на дефиницију или Брза измена. Како бисте активирали ову датотеку, отворите <code>.brackets.json</code> у Вашем пројекту и измените <code>jscodehints.detectedExclusions</code>.<br><br>Ово је вероватно баг у апликацији Brackets. Ако можете приложити копију ове датотеке, молимо Вас <a href='https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue'>пријавите баг</a> који садржи линк до овде наведене датотеке.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Брзи приказ приликом задржавања миша",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Недавни пројекти",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Прочитај више"
});

/* Last translated for c292e896761bc7d451a9e3b95bedd20d6b355d77 */
