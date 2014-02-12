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
    "NO_MODIFICATION_ALLOWED_ERR"       : "Циљани директоријум не може бити измењен.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Тренутна овлашћења Вам не дозвољавају да правите измене.",
    "FILE_EXISTS_ERR"                   : "Датотека или директоријум већ постоји.",
    "FILE"                              : "датотека",
    "DIRECTORY"                         : "директоријум",

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
    "ERROR_RENAMING_FILE_TITLE"         : "Грешка при преименовању датотеке",
    "ERROR_RENAMING_FILE"               : "Дошло је до грешке приликом покушаја да се преименује датотека <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Грешка при брисању датотеке",
    "ERROR_DELETING_FILE"               : "Дошло је до грешке приликом покушаја да се обрише датотека <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Име {0} није валидно",
    "INVALID_FILENAME_MESSAGE"          : "Имена датотека не смеју садржати следеће карактере: {0} или системски резервисане речи.",
    "FILE_ALREADY_EXISTS"               : "{0} <span class='dialog-filename'>{1}</span> већ постоји.",
    "ERROR_CREATING_FILE_TITLE"         : "Грешка при креирању {0}",
    "ERROR_CREATING_FILE"               : "Дошло је до грешке приликом покушаја да се креира {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Упс! \"{APP_NAME}\" још увек не ради у претраживачу.",
    "ERROR_IN_BROWSER"                  : "Апликација \"{APP_NAME}\" је направљена помоћу HTML-а, али тренутно ради као \"desktop\" апликација па је можете користити за измену локалних датотека. Молимо Вас користите \"application shell\" на <b>github.com/adobe/brackets-shell</b> репозиторијум за покретање \"{APP_NAME}\" апликације.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Грешка приликом индексирања датотека",
    "ERROR_MAX_FILES"                   : "Индексиран је максимални број датотека. Акције које претражују датотеке у индексу могу погрешно функционисати.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Грешка при покретању претраживача",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome претраживач није пронађен. Молимо потврдите да је инсталиран.",
    "ERROR_LAUNCHING_BROWSER"           : "Грешка приликом покретања претраживача. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Грешка у живом приказу",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Повезивање са претраживачем",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Да би се живи приказ повезао, потребно је да поново покренете Chrome са укљученим подешавањима за \"remote debugging\".<br /><br />Да ли желите поново да покренете Chrome са укљученим подешавањима за \"remote debugging\"?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Није могуће учитати живу развојну страницу",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Отворите HTML датотеку како бисте покренули живи приказ.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "За покретање живог приказа са датотеком која је \"server-side\", морате навести основну URL адресу за овај пројекат.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Грешка приликом покретања HTTP сервера за \"живе\" развојне датотеке. Молимо покушајте поново.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Добро дошли у живи приказ!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Живи приказ повезује \"{APP_NAME}\" са Вашим претраживачем. Он покреће Вашу \"HTML\" датотеку у претраживачу, а потом ажурира приказ тренутно док Ви мењате Ваш кôд.<br /><br />У овој раној верзији апликације \"{APP_NAME}\", живи приказ ради једино у <strong>Google Chrome</strong> претраживачу и ажурира приказ док мењате <strong>CSS или HTML датотеке</strong>. За освежавање приказа приликом измена у JavaScript датотекама потребно је да сачувате Ваше измене.<br /><br />(Ова порука ће само једном бити приказана.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "За више информација, погледајте <a href='{0}' title='{0}'>Решавање грешака у конекцији приликом развоја уживо</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Живи приказ",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Живи приказ: Успостављање конекције\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Живи приказ: Иницијализација\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Напусти живи приказ",
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
    "EXT_MODIFIED_MESSAGE"              : "Датотека <span class='dialog-filename'>{0}</span> је измењена на диску, али садржи и измене начињене у апликацији \"{APP_NAME}\".<br /><br />Коју верзију желите да сачувате?",
    "EXT_DELETED_MESSAGE"               : "Датотека <span class='dialog-filename'>{0}</span> је измењена на диску, али садржи и измене начињене у апликацији \"{APP_NAME}\".<br /><br />Да ли желите да сачувате ове измене?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Користите /re/ синтаксу за regexp претрагу",
    "FIND_RESULT_COUNT"                 : "{0} резултата",
    "FIND_RESULT_COUNT_SINGLE"          : "1 резултат",
    "FIND_NO_RESULTS"                   : "Нема резултата",
    "WITH"                              : "Са",
    "BUTTON_YES"                        : "Да",
    "BUTTON_NO"                         : "Не",
    "BUTTON_REPLACE_ALL"                : "Све\u2026",
    "BUTTON_STOP"                       : "Стопирај",
    "BUTTON_REPLACE"                    : "Замени",
            
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Следеће поклапање",
    "BUTTON_PREV_HINT"                  : "Претходно поклапање",

    "OPEN_FILE"                         : "Отвори датотеку",
    "SAVE_FILE_AS"                      : "Сачувај датотеку",
    "CHOOSE_FOLDER"                     : "Изабери директоријум",

    "RELEASE_NOTES"                     : "Обавештење о изменама",
    "NO_UPDATE_TITLE"                   : "Имате актуелну верзију!",
    "NO_UPDATE_MESSAGE"                 : "Тренутно поседујете актуелну верзију апликације {APP_NAME}.",

    "FIND_REPLACE_TITLE_PART1"          : "Замени \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" са \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" пронађен",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} in {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "у <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "у пројекту",
    "FIND_IN_FILES_FILE"                : "датотеци",
    "FIND_IN_FILES_FILES"               : "датотека",
    "FIND_IN_FILES_MATCH"               : "поклапање",
    "FIND_IN_FILES_MATCHES"             : "поклапања",
    "FIND_IN_FILES_MORE_THAN"           : "Преко ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Грешка приликом учитавања информација о новој верзији",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Дошло је до проблема приликом преузимања последњих информација о новој верзији са сервера. Молимо проверите да ли сте повезани на интернет и покушајте поново.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Учитавање\u2026",
    "UNTITLED"          : "Неименовани документ",
    "WORKING_FILES"     : "Радне датотеке",

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
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Кликни за коришћење размака приликом увлачења кôда",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Кликни за коришћење таб-ова приликом увлачења кôда",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Кликни за промену броја размака приликом увлачења кôда",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Кликни за промену ширине карактера на картици",
    "STATUSBAR_SPACES"                      : "Размаци:",
    "STATUSBAR_TAB_SIZE"                    : "Величина картице:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} линија",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} линија",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE"                    : "{0} грешака",
    "SINGLE_ERROR"                          : "1 {0} грешка",
    "MULTIPLE_ERRORS"                       : "{1} {0} грешака",
    "NO_ERRORS"                             : "Нема {0} грешака - свака част!",
    "LINT_DISABLED"                         : "Детектовање сумњивог кôда искључено",
    "NO_LINT_AVAILABLE"                     : "Ниједан детектор сумњивог кôда није доступан за {0}",
    "NOTHING_TO_LINT"                       : "Није пронађен сумњив кôд",
    
    
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
    "CMD_OPEN_FOLDER"                     : "Отвори директоријум\u2026",
    "CMD_FILE_CLOSE"                      : "Затвори",
    "CMD_FILE_CLOSE_ALL"                  : "Затвори све",
    "CMD_FILE_SAVE"                       : "Сачувај",
    "CMD_FILE_SAVE_ALL"                   : "Сачувај све",
    "CMD_FILE_SAVE_AS"                    : "Сачувај као\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Живи приказ",
    "CMD_PROJECT_SETTINGS"                : "Подешавања за пројекат\u2026",
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
    "CMD_FIND"                            : "Пронађи",
    "CMD_FIND_IN_FILES"                   : "Пронађи међу датотекама",
    "CMD_FIND_IN_SUBTREE"                 : "Пронађи у\u2026",
    "CMD_FIND_NEXT"                       : "Пронађи следеће",
    "CMD_FIND_PREVIOUS"                   : "Пронађи претходно",
    "CMD_REPLACE"                         : "Замени",
    "CMD_INDENT"                          : "Помери удесно",
    "CMD_UNINDENT"                        : "Помери улево",
    "CMD_DUPLICATE"                       : "Удвостручи",
    "CMD_DELETE_LINES"                    : "Обриши линију",
    "CMD_COMMENT"                         : "Закоментариши линију",
    "CMD_BLOCK_COMMENT"                   : "Закоментариши блок",
    "CMD_LINE_UP"                         : "Помери линију горе",
    "CMD_LINE_DOWN"                       : "Помери линију доле",
    "CMD_OPEN_LINE_ABOVE"                 : "Отвори линију изнад",
    "CMD_OPEN_LINE_BELOW"                 : "Отвори линију испод",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Аутоматски затвори заграде",
    "CMD_SHOW_CODE_HINTS"                 : "Пружи малу помоћ око кôда",
    
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
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Сортирај по датуму додавања",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Сортирај по имену",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Сортирај по типу",
    "CMD_SORT_WORKINGSET_AUTO"            : "Аутоматско сортирање",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Навигација",
    "CMD_QUICK_OPEN"                      : "Отвори на брзину",
    "CMD_GOTO_LINE"                       : "Иди на линију",
    "CMD_GOTO_DEFINITION"                 : "Брзо пронађи дефиницију",
    "CMD_GOTO_FIRST_PROBLEM"              : "Иди на прву грешку/упозорење",
    "CMD_TOGGLE_QUICK_EDIT"               : "Измени на брзину",
    "CMD_TOGGLE_QUICK_DOCS"               : "Брзи документи",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Претходно поклапање",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Следеће поклапање",
    "CMD_NEXT_DOC"                        : "Следећи документ",
    "CMD_PREV_DOC"                        : "Претходни документ",
    "CMD_SHOW_IN_TREE"                    : "Прикажи у стаблу датотека",
    "CMD_SHOW_IN_OS"                      : "Прикажи у оперативном систему",
    
    // Help menu commands
    "HELP_MENU"                           : "Помоћ",
    "CMD_CHECK_FOR_UPDATE"                : "Провери да ли постоји новијa верзија",
    "CMD_HOW_TO_USE_BRACKETS"             : "Корисничко упутство за \"{APP_NAME}\"",
    "CMD_FORUM"                           : "\"{APP_NAME}\" форум",
    "CMD_RELEASE_NOTES"                   : "Белешке о тренутној верзији",
    "CMD_REPORT_AN_ISSUE"                 : "Пријавите грешку",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Прикажи директоријум са екстензијама",
    "CMD_TWITTER"                         : "{TWITTER_NAME} на Твитеру (Twitter)",
    "CMD_ABOUT"                           : "О апликацији \"{APP_TITLE}\"",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "експериментална верзија",
    "DEVELOPMENT_BUILD"                    : "развојна верзија",
    "OK"                                   : "У реду",
    "DONT_SAVE"                            : "Немој сачувати",
    "SAVE"                                 : "Сачувај",
    "CANCEL"                               : "Откажи",
    "DELETE"                               : "Обриши",
    "RELOAD_FROM_DISK"                     : "Поново учитај са диска",
    "KEEP_CHANGES_IN_EDITOR"               : "Сачувај измене у едитору",
    "CLOSE_DONT_SAVE"                      : "Затвори (без чувања измена)",
    "RELAUNCH_CHROME"                      : "Поново покрени Chrome",
    "ABOUT"                                : "О апликацији",
    "CLOSE"                                : "Затвори",
    "ABOUT_TEXT_LINE1"                     : "итерација {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Обавештења, обавезе и услови коришћења који се односе на \"third party\" софтвер су лоцирани на <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> и укључени су овде путем референце.",
    "ABOUT_TEXT_LINE4"                     : "Документација и изворни кôд на <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "За израду апликације је коришћено \u2764 и \"JavaScript\" од стране следећих људи:",
    "ABOUT_TEXT_LINE6"                     : "Много људи (али тренутно имамо потешкоћа да учитамо те податке).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "\"Web Platform Docs\" и \"Web Platform\" логотип су заштићени \"Creative Commons Attribution\" лиценцом, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Објављена је нова верзија апликације \"{APP_NAME}\"! Кликните овде за више информација.",
    "UPDATE_AVAILABLE_TITLE"               : "Нова верзија доступна",
    "UPDATE_MESSAGE"                       : "Хеј, нова верзија апликације \"{APP_NAME}\" је доступна. Ово су нека од најновијих унапређења:",
    "GET_IT_NOW"                           : "Преузми сада!",
    "PROJECT_SETTINGS_TITLE"               : "Подешавања пројекта за: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Основна URL адреса за живи приказ",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Да бисте користили локални сервер, унесите адресу (url) попут http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Живи приказ не подржава протокол {0}&mdash;Молимо Вас користите http: или https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Основна URL адреса не сме садржати параметре попут \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Основна URL адреса не сме садржати хешеве (hashes) попут \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Специјални карактери попут '{0}' морају бити %-енкодирани.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Непозната грешка приликом парсирања основне URL адресе",
    
    // Extension Management strings
    "INSTALL"                              : "Инсталирај",
    "UPDATE"                               : "Ажурирај",
    "REMOVE"                               : "Уклони",
    "OVERWRITE"                            : "Пресними",
    "CANT_REMOVE_DEV"                      : "Екстензије у \"dev\" директоријуму морају бити ручно обрисане.",
    "CANT_UPDATE"                          : "Нова верзија није компатибилна са тренутном верзијом апликације \"{APP_NAME}\".",
    "INSTALL_EXTENSION_TITLE"              : "Инсталирај екстензију",
    "UPDATE_EXTENSION_TITLE"               : "Ажурирај екстензију",
    "INSTALL_EXTENSION_LABEL"              : "Интернет адреса (URL) екстензије",
    "INSTALL_EXTENSION_HINT"               : "Интернет адреса (URL) zip архиве екстензије на GitHub репозиторијуму",
    "INSTALLING_FROM"                      : "Инсталирање екстензије са {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Инсталација успешна!",
    "INSTALL_FAILED"                       : "Инсталација неуспешна.",
    "CANCELING_INSTALL"                    : "Отказујем\u2026",
    "CANCELING_HUNG"                       : "Отказивање инсталације траје предуго. Могуће да је дошло до интерне грешке.",
    "INSTALL_CANCELED"                     : "Инсталација отказана.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Преузети садржај није валидна zip архива.",
    "INVALID_PACKAGE_JSON"                 : "Датотека \"package.json\" није валидна (грешка која се десила: {0}).",
    "MISSING_PACKAGE_NAME"                 : "У датотеци \"package.json\" није наведено име пакета.",
    "BAD_PACKAGE_NAME"                     : "{0} није валидно име за пакет.",
    "MISSING_PACKAGE_VERSION"              : "У датотеци \"package.json\" није наведена верзија пакета.",
    "INVALID_VERSION_NUMBER"               : "Верзија пакета број ({0}) није валидна.",
    "INVALID_BRACKETS_VERSION"             : "Низ о компатибилности ({0}) апликације \"{APP_NAME}\" није валидан.",
    "DISALLOWED_WORDS"                     : "Речи ({1}) нису дозвољене у пољу {0}.",
    "API_NOT_COMPATIBLE"                   : "Ова екстензија није компатибилна са тренутном верзијом апликације \"{APP_NAME}\". Инсталирана је у Ваш \"disabled extensions\" директоријум.",
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
    "INSTALL_FROM_URL"                     : "Инсталирај са интернет локације (URL-а)\u2026",
    "EXTENSION_AUTHOR"                     : "Аутор",
    "EXTENSION_DATE"                       : "Датум",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Ова екстензија захтева новиу верзију апликације \"{APP_NAME}\".",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Ова екстензија тренутно ради само у старијим верзијама апликације \"{APP_NAME}\".",
    "EXTENSION_NO_DESCRIPTION"             : "Не постоји опис",
    "EXTENSION_MORE_INFO"                  : "Више информација...",
    "EXTENSION_ERROR"                      : "Грешка у екстензији",
    "EXTENSION_KEYWORDS"                   : "Кључне речи",
    "EXTENSION_INSTALLED"                  : "Инсталирано",
    "EXTENSION_UPDATE_INSTALLED"           : "Ова верзија екстензије је већ преузета и биће инсталирана након изласка из апликације \"{APP_NAME}\".",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Пронађи",
    "EXTENSION_MORE_INFO_LINK"             : "Још",
    "BROWSE_EXTENSIONS"                    : "Претражи екстензије",
    "EXTENSION_MANAGER_REMOVE"             : "Уклони екстензију",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Није могуће уклонити једну или више екстензија: {0}. {APP_NAME} ће се ипак затворити.",
    "EXTENSION_MANAGER_UPDATE"             : "Ажурирај екстензију",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Није могуће ажурирати једну или више екстензија: {0}. {APP_NAME} ће се ипак затворити.",
    "MARKED_FOR_REMOVAL"                   : "Означено за уклањање",
    "UNDO_REMOVE"                          : "Опозови",
    "MARKED_FOR_UPDATE"                    : "Означено за ажурирање",
    "UNDO_UPDATE"                          : "Опозови",
    "CHANGE_AND_QUIT_TITLE"                : "Промени екстензије",
    "CHANGE_AND_QUIT_MESSAGE"              : "Да бисте ажурирали или уклонили означене екстензије, морате угасити и поново покренути \"{APP_NAME}\". Од Вас ће бити затражено да сачувате измене.",
    "REMOVE_AND_QUIT"                      : "Уклони екстензије и изађи",
    "CHANGE_AND_QUIT"                      : "Промени екстензије и изађи",
    "UPDATE_AND_QUIT"                      : "Ажурирај екстензије и изађи",
    "EXTENSION_NOT_INSTALLED"              : "Екстензија {0} није могла бити уклоњена јер није била инсталирана.",
    "NO_EXTENSIONS"                        : "Тренутно нема инсталираних екстензија.<br>Кликните изнад на картицу Доступно да додате екстензију.",
    "NO_EXTENSION_MATCHES"                 : "Ниједна екстензија се не поклапа са унетим параметрима претраге.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Будите обазриви приликом инсталације екстензија које потичу од непознатих извора.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Инсталирано",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Доступно",
    "EXTENSIONS_UPDATES_TITLE"             : "Ажурирање",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixels",
    
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Отклањање грешака",
    "CMD_SHOW_DEV_TOOLS"                        : "Прикажи развојне алате",
    "CMD_REFRESH_WINDOW"                        : "Поново учитај \"{APP_NAME}\"",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Нови \"{APP_NAME}\" прозор",
    "CMD_SWITCH_LANGUAGE"                       : "Промени језик",
    "CMD_RUN_UNIT_TESTS"                        : "Покрени тестове",
    "CMD_SHOW_PERF_DATA"                        : "Прикажи податке о перформансама",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Укључи \"Node Debugger\"",
    "CMD_LOG_NODE_STATE"                        : "Забележи у конзолу стање Node-а",
    "CMD_RESTART_NODE"                          : "Поново покрени Node",
    
    "LANGUAGE_TITLE"                            : "Промени језик",
    "LANGUAGE_MESSAGE"                          : "Језик:",
    "LANGUAGE_SUBMIT"                           : "Поново учитај \"{APP_NAME}\"",
    "LANGUAGE_CANCEL"                           : "Откажи",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "језик система",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "чешки",
    "LOCALE_DE"                                 : "немачки",
    "LOCALE_EN"                                 : "енглески",
    "LOCALE_ES"                                 : "шпански",
    "LOCALE_FI"                                 : "фински",
    "LOCALE_FR"                                 : "француски",
    "LOCALE_IT"                                 : "италијански",
    "LOCALE_JA"                                 : "јапански",
    "LOCALE_NB"                                 : "норвешки",
    "LOCALE_PL"                                 : "пољски",
    "LOCALE_PT_BR"                              : "португалски, Бразил",
    "LOCALE_PT_PT"                              : "португалски",
    "LOCALE_RU"                                 : "руски",
    "LOCALE_SK"                                 : "словачки",
	"LOCALE_SR"									: "српски",
    "LOCALE_SV"                                 : "шведски",
    "LOCALE_TR"                                 : "турски",
    "LOCALE_ZH_CN"                              : "кинески, поједностављен",
    "LOCALE_HU"                                 : "мађарски",
    
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
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Брзи приказ након задржавања миша",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Недавни пројекти",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Прочитај више"
});
