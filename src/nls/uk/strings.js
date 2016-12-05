/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

define({

    /**
     * Errors
     */

    // General file io error strings
    "GENERIC_ERROR"                             : "(помилка {0})",
    "NOT_FOUND_ERR"                             : "Файл не знайдено.",
    "NOT_READABLE_ERR"                          : "Не вдається прочитати файл.",
    "EXCEEDS_MAX_FILE_SIZE"                     : "{APP_NAME} не працює з файлами, що перевищують {0} Мб.",
    "NO_MODIFICATION_ALLOWED_ERR"               : "Не вдається внести зміни до цільової теки.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"          : "Ваших повноважень недостатньо, аби вносити змінити.",
    "CONTENTS_MODIFIED_ERR"                     : "Файл змінено за межами {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR"                  : "{APP_NAME} наразі підтримує тільки текстові файли у кодуванні UTF-8.",
    "FILE_EXISTS_ERR"                           : "Файл або така уже існує.",
    "FILE"                                      : "файл",
    "FILE_TITLE"                                : "Файл",
    "DIRECTORY"                                 : "тека",
    "DIRECTORY_TITLE"                           : "Тека",
    "DIRECTORY_NAMES_LEDE"                      : "Назви тек",
    "FILENAMES_LEDE"                            : "Назви файлів",
    "FILENAME"                                  : "Назва файлу",
    "DIRECTORY_NAME"                            : "Назва теки",

    // Project error strings
    "ERROR_LOADING_PROJECT"                     : "Помилка завантаження проекту",
    "OPEN_DIALOG_ERROR"                         : "Під час показу діалогу відкриття файлу виникла помилка. (помилка {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"          : "Виникла помилка під час спроби відкрити теку <span class=\'dialog-filename\'>{0}</span>. (помилка {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"              : "Виникла помилка під час спроби прочитати вміст теки <span class=\'dialog-filename\'>{0}</span>. (помилка {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"                  : "Помилка відкриття файлу",
    "ERROR_OPENING_FILE"                        : "Виникла помилка під час спроби відкрити файл <span class=\'dialog-filename\'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"                       : "Під час відкриття наступних файлів виникли помилки:",
    "ERROR_RELOADING_FILE_TITLE"                : "Помилка перевантаження змін з диску",
    "ERROR_RELOADING_FILE"                      : "Сталась помилка під час спроби перевантаження файлу <span class=\'dialog-filename\'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"                   : "Помилка збереження файлу",
    "ERROR_SAVING_FILE"                         : "Сталась помилка під час спроби збереження файлу <span class=\'dialog-filename\'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"                 : "Помилка під час перейменування {0}",
    "ERROR_RENAMING_FILE"                       : "Сталась помилка під час спроби перейменувати файл {2} <span class=\'dialog-filename\'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"                 : "Помилка видалення {0}",
    "ERROR_DELETING_FILE"                       : "Сталась помилка під час проби видалити {2} <span class=\'dialog-filename\'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"                    : "Невірна {0}",
    "INVALID_FILENAME_MESSAGE"                  : "{0} не може містити зарезервованих слів, закінчуватись крапками (.) та використовувати наступні симовли: <code class=\'emphasized\'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS"               : "Файл або тека з назвою <span class=\'dialog-filename\'>{0}</span> уже існує.",
    "ERROR_CREATING_FILE_TITLE"                 : "Помилка створення {0}",
    "ERROR_CREATING_FILE"                       : "Сталась помилка під час спроби створити файл {0} <span class=\'dialog-filename\'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP"                      : "Не можна відкривати теку одночасно відкриваючи інші файли",

    // User key map error strings
    "ERROR_KEYMAP_TITLE"                        : "Не вдалось прочитати карту прив’язок клавіш",
    "ERROR_KEYMAP_CORRUPT"                      : "У вашому файлі помилкова структура JSON. Файли буде відкрито, аби ви могли її виправити.",
    "ERROR_LOADING_KEYMAP"                      : "Ваш файл не у кодуванні UTF-8 і не може бути завантаженим",
    "ERROR_RESTRICTED_COMMANDS"                 : "Ви не можете переприв’язати клавіатурні скорочення для команд: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"                : "Ви не можете переприв’язати ці клавіатурні скорочення: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"                  : "Ви переприв’язуєте кілька клавіатурних скорочень для команд: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"                 : "У вас кілька прив’язок до цих комбінацій: {0}",
    "ERROR_INVALID_SHORTCUTS"                   : "Це клавіатурне скорочення помилкове: {0}",
    "ERROR_NONEXISTENT_COMMANDS"                : "Ви назначили клавіатурне скорочення для неіснуючій команді: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"                 : "Помилка читання налаштувань",
    "ERROR_PREFS_CORRUPT"                       : "Ваш файл налаштувань не відповідає правилам формату JSON. Файл буде відкрито для виправлення. Після цього потрібно буде перезапустити {APP_NAME}, аби зміни набули чинності.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"                    : "Ой! {APP_NAME} ще не працює у браузерах.",
    "ERROR_IN_BROWSER"                          : "{APP_NAME} створено на базі веб-технологій, але наразі працює як звичайна програма аби мати змогу редагувати локальні файли. Будь ласка, скористайтесь спеціальною оболонкою на <b>github.com/adobe/brackets-shell</b> для запуску {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"                     : "Помилка індексації файлів",
    "ERROR_MAX_FILES"                           : "Цей проект містить більше 30 000 файлів. Функції, що оперують кількома файлам можуть не працювати правильно або вимкнутись. <a href=\'https://github.com/adobe/brackets/wiki/Large-Projects\'>Дізнайтесь більше про роботу програми під час відкриття великих проектів</a>.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"             : "Помилка запуску браузера",
    "ERROR_CANT_FIND_CHROME"                    : "Не знайдено браузер Google Chrome. Переконайтесь, будь ласка, що він встановлений.",
    "ERROR_LAUNCHING_BROWSER"                   : "Під час запуску браузера сталася помилка. (помилка {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"              : "Помилка Live Preview",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"           : "Підключення до броузера",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"            : "Live Preview потребує перезапустити Chrome з увімкненням віддаленого відлагодження.<br /><br />Бажаєте виконати це?<br /><br />",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"            : "Помилка завантаження сторінки Live Preview.",
    "LIVE_DEV_NEED_HTML_MESSAGE"                : "Відкрийте файл HTML або ж переконайтесь, що для запуску live preview у вашому проекті існує файл index.html.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"             : "Аби запустити live preview з серверним файлом, вам варто вказати базову адресу для цього проекту.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE"         : "Помилка запуску HTTP-сервера для live preview. Будь ласка, спробуйте пізніше.",
    "LIVE_DEVELOPMENT_INFO_TITLE"               : "Вітаємо у Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"             : "Live Preview підключає {APP_NAME} до вашого браузера та забезпечує попередній перегляд файлів HTML. Функція оновлює попередній перегляд одразу, як ви вносите зміни в код.<br /><br />У цій ранній збірці {APP_NAME}, Live Preview працює тільки з <strong>Google Chrome</strong> і оновлення в реальному часі відображається тільки для <strong>файлів CSS та HTML</strong>. Зміни до файлів JavaScript вносяться автоматично під час збереження.<br /><br />(Це повідомлення більше не турбуватиме вас.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"          : "Для докладнішої інформації погляньте на <a href=\'{0}\' title=\'{0}\'>пошук та усунення помилок підключення Live Preview</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED"         : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"             : "Live Preview: Підключення\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"             : "Live Preview: Ініціалізація\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"             : "Відключити Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"           : "Live Preview (збережіть файл для оновлення)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"            : "Live Preview (не оновлюється, якщо є помилки)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS"  : "Live Preview зупинено, оскільки в браузері відкрито панель інструментів розробника",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"           : "Live Preview зупинено, оскільки сторінку закрито в браузері",
    "LIVE_DEV_NAVIGATED_AWAY"                   : "Live Preview зупинено, оскільки браузер перенаправлено на сторінку, що не є частиною поточного проекту",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"            : "Live Preview скасовано з невідомих причин ({0})",

    "SAVE_CLOSE_TITLE"                          : "Зберегти зміни",
    "SAVE_CLOSE_MESSAGE"                        : "Чи бажаєте ви зберегти зміни внесені у файл <span class=\'dialog-filename\'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"                  : "Чи бажаєте ви зберегти зміни до наступних файлів?",
    "EXT_MODIFIED_TITLE"                        : "Зовнішні зміни",
    "CONFIRM_DELETE_TITLE"                      : "Підтвердження видалення",
    "CONFIRM_FOLDER_DELETE"                     : "Ви дійсно хочете видалити теку <span class=\'dialog-filename\'>{0}</span>?",
    "FILE_DELETED_TITLE"                        : "Файл видалено",
    "EXT_MODIFIED_WARNING"                      : "<span class=\'dialog-filename\'>{0}</span> змінено на диску.<br /><br />Чи ви хочете зберегти файл і перезаписати ці зміни?",
    "EXT_MODIFIED_MESSAGE"                      : "<span class=\'dialog-filename\'>{0}</span> змінено на диску, проте існують також не збережені зміни у {APP_NAME}.<br /><br />Яку версію ви бажаєте лишити?",
    "EXT_DELETED_MESSAGE"                       : "<span class=\'dialog-filename\'>{0}</span> видалено з диску, але {APP_NAME} містить не збережені в нього зміни.<br /><br />Чи бажаєте ви залишити їх?",

    // Generic dialog/button labels
    "DONE"                                      : "Готово",
    "OK"                                        : "OK",
    "CANCEL"                                    : "Скасувати",
    "DONT_SAVE"                                 : "Не зберігати зміни",
    "SAVE"                                      : "Зберегти",
    "SAVE_AS"                                   : "Зберегти як\u2026",
    "SAVE_AND_OVERWRITE"                        : "Перезаписати",
    "DELETE"                                    : "Видалити",
    "BUTTON_YES"                                : "Так",
    "BUTTON_NO"                                 : "Ні",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                          : "{0} з {1}",
    "FIND_NO_RESULTS"                           : "Жодних результатів",
    "FIND_QUERY_PLACEHOLDER"                    : "Хочу знайти\u2026",
    "REPLACE_PLACEHOLDER"                       : "Замінити на\u2026",
    "BUTTON_REPLACE_ALL"                        : "Усе\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"               : "Замінити\u2026",
    "BUTTON_REPLACE"                            : "Замінити",
    "BUTTON_NEXT"                               : "\u25B6",
    "BUTTON_PREV"                               : "\u25C0",
    "BUTTON_NEXT_HINT"                          : "Наступний збіг",
    "BUTTON_PREV_HINT"                          : "Попередній збіг",
    "BUTTON_CASESENSITIVE_HINT"                 : "Враховувати регістр",
    "BUTTON_REGEXP_HINT"                        : "Регулярний вираз",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE"        : "Замінити без можливості скасування",
    "REPLACE_WITHOUT_UNDO_WARNING"              : "Оскільки більше {0} файлів потрібно змінити, {APP_NAME} виконає заміну невідкритих файлів безпосередньо на диску.<br />Ви не зможете скасувати цю дію.",
    "BUTTON_REPLACE_WITHOUT_UNDO"               : "Замінити без можливості скасування",

    "OPEN_FILE"                                 : "Відкрити файл",
    "SAVE_FILE_AS"                              : "Зберегти файл",
    "CHOOSE_FOLDER"                             : "Оберіть теку",

    "RELEASE_NOTES"                             : "Примітки до випуску",
    "NO_UPDATE_TITLE"                           : "У вас найновіша версія!",
    "NO_UPDATE_MESSAGE"                         : "Ви користуєтесь останньою версією {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"                  : "Заміна",
    "FIND_REPLACE_TITLE_WITH"                   : "на",
    "FIND_TITLE_LABEL"                          : "Знайдене",
    "FIND_TITLE_SUMMARY"                        : "&mdash; {0} {1} {2} у {3}",

    // Find in Files
    "FIND_NUM_FILES"                            : "{0} {1}",
    "FIND_IN_FILES_SCOPED"                      : "у <span class=\'dialog-filename\'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"                    : "у проекті",
    "FIND_IN_FILES_ZERO_FILES"                  : "Фільтр не включає всі файли {0}",
    "FIND_IN_FILES_FILE"                        : "файл",
    "FIND_IN_FILES_FILES"                       : "файлів",
    "FIND_IN_FILES_MATCH"                       : "збіг",
    "FIND_IN_FILES_MATCHES"                     : "збігів",
    "FIND_IN_FILES_MORE_THAN"                   : "Більше ",
    "FIND_IN_FILES_PAGING"                      : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"                   : "<span class=\'dialog-filename\'>{0}</span> {2} <span class=\'dialog-path\'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"             : "Ctrl/Cmd+клік згорнути/розгорнути все",
    "REPLACE_IN_FILES_ERRORS_TITLE"             : "Помилки під час заміни",
    "REPLACE_IN_FILES_ERRORS"                   : "Наступні файли не змінено, оскільки вони змінились після пошуку аби недоступні для запису.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"          : "Сталась помилка під час отримання даних про оновлення",
    "ERROR_FETCHING_UPDATE_INFO_MSG"            : "Помилка отримання з сервера інформації про оновлення. Переконайтесь, що маєте доступ до інтернету та спробуйте знову.",

    // File exclusion filters
    "NEW_FILE_FILTER"                           : "Новий набір виключень\u2026",
    "CLEAR_FILE_FILTER"                         : "Не виключати файли",
    "NO_FILE_FILTER"                            : "Жодного файлу не виключено",
    "EXCLUDE_FILE_FILTER"                       : "Не включати {0}",
    "EDIT_FILE_FILTER"                          : "Змінити\u2026",
    "FILE_FILTER_DIALOG"                        : "Змінити набір виключень",
    "FILE_FILTER_INSTRUCTIONS"                  : "Всі файли та таки, що підпадають під ці рядки, підрядки або <a href=\'{0}\' title=\'{0}\'>шаблони</a> будуть виключені. Вказуйте кожне правило з нового рядка.",
    "FILTER_NAME_PLACEHOLDER"                   : "Назва набору виключень (не обов’язково)",
    "FILE_FILTER_CLIPPED_SUFFIX"                : "і ще {0}",
    "FILTER_COUNTING_FILES"                     : "Підрахунок файлів\u2026",
    "FILTER_FILE_COUNT"                         : "Відбирає {0} з {1} файлів {2}",
    "FILTER_FILE_COUNT_ALL"                     : "Відбирає всі {0} файлів {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"       : "Швидке редагування не доступне для поточного розміщення курсора",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"         : "Швидке редагування CSS: помістіть курсор на один клас",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"          : "Швидке редагування CSS: атрибут класу незавершено",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"             : "Швидке редагування CSS: атрибут ID незавершено",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"        : "Швидке редагування CSS: помістіть курсор на мітку, клас або ID",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"       : "Швидке редагування часової функції CSS: невірний синтаксис",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"        : "Швидке редагування JS: помістіть курсор на назву функції",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"       : "Для поточного розміщення курсора швидка документація відсутня",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"                           : "Завантаження\u2026",
    "UNTITLED"                                  : "Без-назви",
    "WORKING_FILES"                             : "Робочі файли",

    /**
     * MainViewManager
     */
    "TOP"                                       : "Верхня",
    "BOTTOM"                                    : "Нижня",
    "LEFT"                                      : "Ліва",
    "RIGHT"                                     : "Права",

    "CMD_SPLITVIEW_NONE"                        : "Не розділяти",
    "CMD_SPLITVIEW_VERTICAL"                    : "Вертикальне розділення",
    "CMD_SPLITVIEW_HORIZONTAL"                  : "Горизонтальне розділення",
    "SPLITVIEW_MENU_TOOLTIP"                    : "Розділити редактор горизонтально або вертикально",
    "GEAR_MENU_TOOLTIP"                         : "Налаштувати робочий набір",

    "SPLITVIEW_INFO_TITLE"                      : "Уже відкрито",
    "SPLITVIEW_MULTIPANE_WARNING"               : "Цей файл відкрито в іншій панелі. {APP_NAME} незабаром підтримуватиме відкриття файлу в кількох панелях одночасно. А до того часу, файл буде показуватись у тій панелі, у якій уже відкритий.<br /><br />(Ви більше не бачитимете цього повідомлення.)",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"                             : "Ctrl",
    "KEYBOARD_SHIFT"                            : "Shift",
    "KEYBOARD_SPACE"                            : "Пробіл",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"                 : "Рядок {0}, Стовпець {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"           : "\u2014 Обрано {0} стовпець",
    "STATUSBAR_SELECTION_CH_PLURAL"             : "\u2014 Обрано {0} стовпців",
    "STATUSBAR_SELECTION_LINE_SINGULAR"         : "\u2014 Обрано {0} рядок",
    "STATUSBAR_SELECTION_LINE_PLURAL"           : "\u2014 Обрано {0} рядків",
    "STATUSBAR_SELECTION_MULTIPLE"              : "\u2014 обрано {0}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"           : "Натисніть, аби перемкнути відступи а пробіли",
    "STATUSBAR_INDENT_TOOLTIP_TABS"             : "Натисніть, аби перемкнути відступи а ьаби",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"      : "Натисніть, аби змінити кількість пробілів для відступів",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"        : "Натисніть, аби змінити ширину символа вкладки",
    "STATUSBAR_SPACES"                          : "Пробіли:",
    "STATUSBAR_TAB_SIZE"                        : "Розмір вкладки:",
    "STATUSBAR_LINE_COUNT_SINGULAR"             : "\u2014 {0} Рядок",
    "STATUSBAR_LINE_COUNT_PLURAL"               : "\u2014 {0} Рядків",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"        : "Розширення вимкнено",
    "STATUSBAR_INSERT"                          : "ВСТ",
    "STATUSBAR_OVERWRITE"                       : "ПРЗ",
    "STATUSBAR_INSOVR_TOOLTIP"                  : "Натисніть, аби перемкнути режим курсору між вставкою (ВСТ) та перезаписом (ПРЗ)",
    "STATUSBAR_LANG_TOOLTIP"                    : "Натисніть, аби змінити тип файлу",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"         : "{0}. Натисніть, аби перемкнути панель повідомлень.",
    "STATUSBAR_DEFAULT_LANG"                    : "(типово)",
    "STATUSBAR_SET_DEFAULT_LANG"                : "Встановити типовим для файлів .{0}",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"               : "{0} Помилок",
    "SINGLE_ERROR"                              : "1 помилка {0}",
    "MULTIPLE_ERRORS"                           : "{0} помилок {1}",
    "NO_ERRORS"                                 : "Не знайдено жодної помилки {0} – гарна робота!",
    "NO_ERRORS_MULTIPLE_PROVIDER"               : "Не знайдено жодної помилки – гарна робота!",
    "LINT_DISABLED"                             : "Аналіз вимкнено",
    "NO_LINT_AVAILABLE"                         : "Для {0} відсутній аналізатор",
    "NOTHING_TO_LINT"                           : "Нічого аналізувати",
    "LINTER_TIMED_OUT"                          : "Аналізатором {0} перевищено час очікування у {1} мс",
    "LINTER_FAILED"                             : "Аналізатор {0} завершився з помилкою: {1}",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                                 : "Файл",
    "CMD_FILE_NEW_UNTITLED"                     : "Новий",
    "CMD_FILE_NEW"                              : "Новий файл",
    "CMD_FILE_NEW_FOLDER"                       : "Нова тека",
    "CMD_FILE_OPEN"                             : "Відкрити\u2026",
    "CMD_ADD_TO_WORKING_SET"                    : "Відкрити у робочому наборі",
    "CMD_OPEN_DROPPED_FILES"                    : "Відкрити вкинуті файли",
    "CMD_OPEN_FOLDER"                           : "Відкрити теку\u2026",
    "CMD_FILE_CLOSE"                            : "Закрити",
    "CMD_FILE_CLOSE_ALL"                        : "Закрити все",
    "CMD_FILE_CLOSE_LIST"                       : "Закрити список",
    "CMD_FILE_CLOSE_OTHERS"                     : "Закрити інші",
    "CMD_FILE_CLOSE_ABOVE"                      : "Закрити інші ті що вище",
    "CMD_FILE_CLOSE_BELOW"                      : "Закрити інші ті що нижче",
    "CMD_FILE_SAVE"                             : "Зберегти",
    "CMD_FILE_SAVE_ALL"                         : "Зберегти все",
    "CMD_FILE_SAVE_AS"                          : "Зберегти як\u2026",
    "CMD_LIVE_FILE_PREVIEW"                     : "Live Preview",
    "CMD_RELOAD_LIVE_PREVIEW"                   : "Примусово перезапустити Live Preview",
    "CMD_PROJECT_SETTINGS"                      : "Налаштування проекту\u2026",
    "CMD_FILE_RENAME"                           : "Перейменувати",
    "CMD_FILE_DELETE"                           : "Видалити",
    "CMD_INSTALL_EXTENSION"                     : "Встановити розширення\u2026",
    "CMD_EXTENSION_MANAGER"                     : "Менеджер розширень\u2026",
    "CMD_FILE_REFRESH"                          : "Оновити дерево файлів",
    "CMD_QUIT"                                  : "Покинути програму",
    // Used in native File menu on Windows
    "CMD_EXIT"                                  : "Вийти",

    // Edit menu commands
    "EDIT_MENU"                                 : "Змінити",
    "CMD_UNDO"                                  : "Відмінити",
    "CMD_REDO"                                  : "Повторити",
    "CMD_CUT"                                   : "Вирізати",
    "CMD_COPY"                                  : "Копіювати",
    "CMD_PASTE"                                 : "Вставити",
    "CMD_SELECT_ALL"                            : "Обрати все",
    "CMD_SELECT_LINE"                           : "Обрати рядок",
    "CMD_SPLIT_SEL_INTO_LINES"                  : "Розбити виділене на рядки",
    "CMD_ADD_CUR_TO_NEXT_LINE"                  : "Додати курсор на наступний рядок",
    "CMD_ADD_CUR_TO_PREV_LINE"                  : "Додати курсор на попередній рядок рядок",
    "CMD_INDENT"                                : "Зробити відступ",
    "CMD_UNINDENT"                              : "Забрати відступ",
    "CMD_DUPLICATE"                             : "Дублювати",
    "CMD_DELETE_LINES"                          : "Вилучити рядок",
    "CMD_COMMENT"                               : "Перемкнути рядковий коментар",
    "CMD_BLOCK_COMMENT"                         : "Перемкнути блочний коментар",
    "CMD_LINE_UP"                               : "Перемістити рядок угору",
    "CMD_LINE_DOWN"                             : "Перемісти рядок униз",
    "CMD_OPEN_LINE_ABOVE"                       : "Відкрити рядок вище",
    "CMD_OPEN_LINE_BELOW"                       : "Відкрити рядок нижче",
    "CMD_TOGGLE_CLOSE_BRACKETS"                 : "Автозакривання дужок",
    "CMD_SHOW_CODE_HINTS"                       : "Показувати поради до коду",

    // Search menu commands
    "FIND_MENU"                                 : "Пошук",
    "CMD_FIND"                                  : "Знайти",
    "CMD_FIND_NEXT"                             : "Знайти наступний",
    "CMD_FIND_PREVIOUS"                         : "Знайти попередній",
    "CMD_FIND_ALL_AND_SELECT"                   : "Знайти все та виділити",
    "CMD_ADD_NEXT_MATCH"                        : "Додати наступний збіг до виділення",
    "CMD_SKIP_CURRENT_MATCH"                    : "Пропустити поточний збіг",
    "CMD_FIND_IN_FILES"                         : "Знайти у файлах",
    "CMD_FIND_IN_SUBTREE"                       : "Знайти у\u2026",
    "CMD_REPLACE"                               : "Замінити",
    "CMD_REPLACE_IN_FILES"                      : "Замінити у файлах",
    "CMD_REPLACE_IN_SUBTREE"                    : "Замінити\u2026",

    // View menu commands
    "VIEW_MENU"                                 : "Вигляд",
    "CMD_HIDE_SIDEBAR"                          : "Приховати бокову панель",
    "CMD_SHOW_SIDEBAR"                          : "Показати бокову панель",
    "CMD_INCREASE_FONT_SIZE"                    : "Збільшити розмір шрифту",
    "CMD_DECREASE_FONT_SIZE"                    : "Зменшити розмір шрифту",
    "CMD_RESTORE_FONT_SIZE"                     : "Відновити типовий шрифт",
    "CMD_SCROLL_LINE_UP"                        : "Прокрутити на рядок вгору",
    "CMD_SCROLL_LINE_DOWN"                      : "Прокрутити на рядок вниз",
    "CMD_TOGGLE_LINE_NUMBERS"                   : "Номери рядків",
    "CMD_TOGGLE_ACTIVE_LINE"                    : "Підсвічувати активний рядок",
    "CMD_TOGGLE_WORD_WRAP"                      : "Перенесення слів",
    "CMD_LIVE_HIGHLIGHT"                        : "Виділяти у Live Preview",
    "CMD_VIEW_TOGGLE_INSPECTION"                : "Аналізувати файли під час збереження",
    "CMD_WORKINGSET_SORT_BY_ADDED"              : "Впорядкувати за додаванням",
    "CMD_WORKINGSET_SORT_BY_NAME"               : "Впорядкувати за назвою",
    "CMD_WORKINGSET_SORT_BY_TYPE"               : "Впорядкувати за типом",
    "CMD_WORKING_SORT_TOGGLE_AUTO"              : "Автоматичне впорядкування",
    "CMD_THEMES"                                : "Теми\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                             : "Навігація",
    "CMD_QUICK_OPEN"                            : "Швидке відкриття",
    "CMD_GOTO_LINE"                             : "Перейти до рядка",
    "CMD_GOTO_DEFINITION"                       : "Швидкий пошук оголошення",
    "CMD_GOTO_FIRST_PROBLEM"                    : "Перейти до найближчої помилки",
    "CMD_TOGGLE_QUICK_EDIT"                     : "Швидке редагування",
    "CMD_TOGGLE_QUICK_DOCS"                     : "Швидка документація",
    "CMD_QUICK_EDIT_PREV_MATCH"                 : "Попередній збіг",
    "CMD_QUICK_EDIT_NEXT_MATCH"                 : "Наступний збіг",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"               : "Нове правило",
    "CMD_NEXT_DOC"                              : "Наступний документ",
    "CMD_PREV_DOC"                              : "Попередній документ",
    "CMD_SHOW_IN_TREE"                          : "Показати у дереві файлів",
    "CMD_SHOW_IN_EXPLORER"                      : "Показати у провіднику",
    "CMD_SHOW_IN_FINDER"                        : "Показати у Finder",
    "CMD_SHOW_IN_OS"                            : "Показати у ОС",

    // Help menu commands
    "HELP_MENU"                                 : "Допомога",
    "CMD_CHECK_FOR_UPDATE"                      : "Перевірити наявність оновлень",
    "CMD_HOW_TO_USE_BRACKETS"                   : "Як використовувати {APP_NAME}",
    "CMD_SUPPORT"                               : "Підтримка {APP_NAME}",
    "CMD_SUGGEST"                               : "Запропонувати ідею",
    "CMD_RELEASE_NOTES"                         : "Примітки до випуску",
    "CMD_GET_INVOLVED"                          : "Прийняти участь в розробці",
    "CMD_SHOW_EXTENSIONS_FOLDER"                : "Показати теку розширень",
    "CMD_HOMEPAGE"                              : "Домівка {APP_TITLE}",
    "CMD_TWITTER"                               : "{TWITTER_NAME} у Twitter",
    "CMD_ABOUT"                                 : "Про {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                      : "Відкрити файл налаштувань",
    "CMD_OPEN_KEYMAP"                           : "Відкрити карту клавіатурних скорочень",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                        : "експериментальна збірка",
    "RELEASE_BUILD"                             : "збірка",
    "DEVELOPMENT_BUILD"                         : "тестова збірка",
    "RELOAD_FROM_DISK"                          : "Завантажити з диска",
    "KEEP_CHANGES_IN_EDITOR"                    : "Залишити зміни в редакторі",
    "CLOSE_DONT_SAVE"                           : "Закрити (без збереження)",
    "RELAUNCH_CHROME"                           : "Перезапустити Chrome",
    "ABOUT"                                     : "Про програму",
    "CLOSE"                                     : "Закрити",
    "ABOUT_TEXT_LINE1"                          : "Версія {VERSION_MAJOR}.{VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"                : "часова мітка збирання:",
    "ABOUT_TEXT_LINE3"                          : "Зауважте, що правила та умови використання комерційного програмного забезпечення розміщенні на <a href=\'{ADOBE_THIRD_PARTY}\'>{ADOBE_THIRD_PARTY}</a> і наводяться тут в якості посилання.",
    "ABOUT_TEXT_LINE4"                          : "Документація та сирці доступні на <a href=\'https://github.com/adobe/brackets/\'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                          : "Створено з \u2764 та JavaScript авторами:",
    "ABOUT_TEXT_LINE6"                          : "Значна кількість людей (але наразі існують проблеми із завантаженням даних про них).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"              : "Документація та логотип Web Platform Docs поширюється на умовах ліцензії Creative Commons Attribution, <a href=\'{WEB_PLATFORM_DOCS_LICENSE}\'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"               : "Доступна нова збірка {APP_NAME}! Натисніть тут аби дізнатись деталі.",
    "UPDATE_AVAILABLE_TITLE"                    : "Доступне оновлення",
    "UPDATE_MESSAGE"                            : "Агов! Доступна нова збірка {APP_NAME}. Ось кілька функцій, що з’явилися:",
    "GET_IT_NOW"                                : "Забрати негайно!",
    "PROJECT_SETTINGS_TITLE"                    : "Налаштування проекту для: {0}",
    "PROJECT_SETTING_BASE_URL"                  : "Базова адреса Live Preview",
    "PROJECT_SETTING_BASE_URL_HINT"             : "Уведіть URL кшталту http://localhost:8000/, аби користуватись локальним сервером",
    "BASEURL_ERROR_INVALID_PROTOCOL"            : "Протокол {0} не підтримується Preview&mdash;будь ласка, використовуйте http: або https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"           : "Базова адреса не може містити параметри пошуку, кшталту \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"             : "Базова адреса не може містити хеші кшталту \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"                : "Спеціальні символи, кшталту \'{0}\', мають бути з обох боків заключені у %.",
    "BASEURL_ERROR_UNKNOWN_ERROR"               : "Неочікувана помилка розбору базової адреси",
    "EMPTY_VIEW_HEADER"                         : "<em>Відкрийте файл, поки ця панель у фокусі</em>",

    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                             : "Поточна тема",
    "USE_THEME_SCROLLBARS"                      : "Брати панель прокрутки з теми",
    "FONT_SIZE"                                 : "Розмір шрифту",
    "FONT_FAMILY"                               : "Сімейство шрифтів",
    "THEMES_SETTINGS"                           : "Налаштування тем",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                           : "Нове правило",

    // Extension Management strings
    "INSTALL"                                   : "Встановити",
    "UPDATE"                                    : "Оновити",
    "REMOVE"                                    : "Вилучити",
    "OVERWRITE"                                 : "Перезаписати",
    "CANT_REMOVE_DEV"                           : "Розширення у теці \"dev\" потрібно видалити власноруч.",
    "CANT_UPDATE"                               : "Оновлення не сумісне з цією версією {APP_NAME}.",
    "CANT_UPDATE_DEV"                           : "Розширення у теці \"dev\" не можуть автоматично оновлюватись.",
    "INSTALL_EXTENSION_TITLE"                   : "Встановлення розширень",
    "UPDATE_EXTENSION_TITLE"                    : "Оновити розширення",
    "INSTALL_EXTENSION_LABEL"                   : "URL розширення",
    "INSTALL_EXTENSION_HINT"                    : "Посилання на zip-файл розширення або репозитарій GitHub",
    "INSTALLING_FROM"                           : "Встановлення розширення з {0}\u2026",
    "INSTALL_SUCCEEDED"                         : "Встановлення вдалося!",
    "INSTALL_FAILED"                            : "Встановлення не вдалося.",
    "CANCELING_INSTALL"                         : "Скасування\u2026",
    "CANCELING_HUNG"                            : "Скасування встановлення займає багато часу. Схоже, на виникнення внутрішньої помилки.",
    "INSTALL_CANCELED"                          : "Встановлення скасовано.",
    "VIEW_COMPLETE_DESCRIPTION"                 : "Переглянути весь опис",
    "VIEW_TRUNCATED_DESCRIPTION"                : "Переглянути короткий опис",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                          : "Завантажені дані не є zip-архівом.",
    "INVALID_PACKAGE_JSON"                      : "Файл package.json – помилковий (помилка: {0}).",
    "MISSING_PACKAGE_NAME"                      : "Файл package.json не містить назви пакунку.",
    "BAD_PACKAGE_NAME"                          : "{0} – помилкова назва пакунку.",
    "MISSING_PACKAGE_VERSION"                   : "Файл package.json не містить версії пакунку.",
    "INVALID_VERSION_NUMBER"                    : "Номер версії пакунку ({0}) – помилковий.",
    "INVALID_BRACKETS_VERSION"                  : "У {APP_NAME} рядок сумісності ({0}) – помилковий.",
    "DISALLOWED_WORDS"                          : "Слова ({1}) недозволені у полі {0}.",
    "API_NOT_COMPATIBLE"                        : "Розширення не сумісне з цією версією {APP_NAME}. Його встановлено до теки disabled.",
    "MISSING_MAIN"                              : "Пакунок не містить файлу main.js.",
    "EXTENSION_ALREADY_INSTALLED"               : "Встановлення цього пакунка перезапише попередньо встановлене розширення. Ви впевнені?",
    "EXTENSION_SAME_VERSION"                    : "Пакунок має ту ж версію що й наразі встановлена. Перезаписати?",
    "EXTENSION_OLDER_VERSION"                   : "Версія пакунка {0} старіша ніж наразі встановлена ({1}). Перезаписати?",
    "DOWNLOAD_ID_IN_USE"                        : "Внутрішня помилка: ID завантаження уже використовується.",
    "NO_SERVER_RESPONSE"                        : "Не вдалось приєднатися до сервера.",
    "BAD_HTTP_STATUS"                           : "Файл відсутній на сервері (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                         : "Помилка запису тимчасового файлу.",
    "ERROR_LOADING"                             : "Розширення несподівано викликало помилку під час запуску.",
    "MALFORMED_URL"                             : "Адреса недійсна. Перевірте, будь ласка, чи ви все вказали вірно.",
    "UNSUPPORTED_PROTOCOL"                      : "Адреса має бути на протоколі http або https.",
    "UNKNOWN_ERROR"                             : "Невідома внутрішня помилка.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"                   : "Менеджер розширень",
    "EXTENSION_MANAGER_ERROR_LOAD"              : "Помилка отримання доступу до реєстру розширення. Будь ласка, спробуйте пізніше.",
    "INSTALL_EXTENSION_DRAG"                    : "Перетягніть сюди .zip або",
    "INSTALL_EXTENSION_DROP"                    : "Перетягніть .zip для встановлення",
    "INSTALL_EXTENSION_DROP_ERROR"              : "Встановлення/оновлення скасовано через наступні помилки:",
    "INSTALL_FROM_URL"                          : "встановіть з URL\u2026",
    "INSTALL_EXTENSION_VALIDATING"              : "Перевірка\u2026",
    "EXTENSION_AUTHOR"                          : "Автор",
    "EXTENSION_DATE"                            : "Дата",
    "EXTENSION_INCOMPATIBLE_NEWER"              : "Це розширення потребує новішої версії {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"              : "Наразі це розширення працює зі старішими версіями {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"       : "Версія {0} цього розширення потребує новішої версії {APP_NAME}. Як варіант, ви можете встановити новішу версію {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"       : "Версія {0} цього розширення працює тільки зі старішими версіями {APP_NAME}. Як варіант, ви можете встановити новішу версію {1}.",
    "EXTENSION_NO_DESCRIPTION"                  : "Опис відсутній",
    "EXTENSION_MORE_INFO"                       : "Докладніше...",
    "EXTENSION_ERROR"                           : "Помилка розширення",
    "EXTENSION_KEYWORDS"                        : "Ключові слова",
    "EXTENSION_TRANSLATED_USER_LANG"            : "Перекладено {0} мовами, включаючи вашу",
    "EXTENSION_TRANSLATED_GENERAL"              : "Перекладено {0} мовами",
    "EXTENSION_TRANSLATED_LANGS"                : "Це розширення перекладено наступними мовами: {0}",
    "EXTENSION_INSTALLED"                       : "Встановлено",
    "EXTENSION_UPDATE_INSTALLED"                : "Оновлення розширення завантажено і буде встановлено після перевантаження {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"              : "Пошук",
    "EXTENSION_MORE_INFO_LINK"                  : "Більше",
    "BROWSE_EXTENSIONS"                         : "Переглянути розширення",
    "EXTENSION_MANAGER_REMOVE"                  : "Вилучити розшмрення",
    "EXTENSION_MANAGER_REMOVE_ERROR"            : "Не вдалось вилучити одне або кілька розширень: {0}. {APP_NAME} продовжить перезапуск.",
    "EXTENSION_MANAGER_UPDATE"                  : "Оновити розширення",
    "EXTENSION_MANAGER_UPDATE_ERROR"            : "Не вдалось оновити одне або кілька розширень: {0}. {APP_NAME} продовжить перезапуск.",
    "MARKED_FOR_REMOVAL"                        : "Помічено для вилучення",
    "UNDO_REMOVE"                               : "Відмінити",
    "MARKED_FOR_UPDATE"                         : "Помічено для оновлення",
    "UNDO_UPDATE"                               : "Відмінити",
    "CHANGE_AND_RELOAD_TITLE"                   : "Змінити розширення",
    "CHANGE_AND_RELOAD_MESSAGE"                 : "Аби оновити або вилучити помічені розширення, потрібно перезапустити {APP_NAME}. Вам буде запропоновано зберегти незбережені зміни.",
    "REMOVE_AND_RELOAD"                         : "Вилучити розширення і перезапустити",
    "CHANGE_AND_RELOAD"                         : "Змінити розширення і перезапустити",
    "UPDATE_AND_RELOAD"                         : "Оновити розширення і перезапустити",
    "PROCESSING_EXTENSIONS"                     : "Обробка змін розширення\u2026",
    "EXTENSION_NOT_INSTALLED"                   : "Не вдалось вилучити розширення {0} оскільки воно не встановлене.",
    "NO_EXTENSIONS"                             : "Ви ще не маєте жодного розширення.<br>Натисніть на вкладку Доступні вище, аби щось встановити.",
    "NO_EXTENSION_MATCHES"                      : "Жодне розширення не відповідає вашому запиту.",
    "REGISTRY_SANITY_CHECK_WARNING"             : "ЗАУВАЖТЕ: Ці розширення поширюються різними авторами і не тільки від {APP_NAME}. Вони не перевіряються і мають повні локальні права. Будьте обережні під час встановлення розширень з невідомих джерел",
    "EXTENSIONS_INSTALLED_TITLE"                : "Встановлені",
    "EXTENSIONS_AVAILABLE_TITLE"                : "Доступні",
    "EXTENSIONS_THEMES_TITLE"                   : "Теми",
    "EXTENSIONS_UPDATES_TITLE"                  : "Оновлення",

    "INLINE_EDITOR_NO_MATCHES"                  : "Нічого не знайдено.",
    "INLINE_EDITOR_HIDDEN_MATCHES"              : "Всі збіги згорнуто. Розгортайте файли наведені справа, аби переглянути збіги.",
    "CSS_QUICK_EDIT_NO_MATCHES"                 : "Жодне правило CSS, що відповідає виділенню.<br> Натисніть \'Нове правило\' для створення. ",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"             : "У вашому проекті відсутні таблиці стилів.<br>Створіть хоча б одну аби мати можливість додавати CSS-правила.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"                 : "найбільша",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                               : "пікселі",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Відлагодження",
    "ERRORS"                                    : "Помилки",
    "CMD_SHOW_DEV_TOOLS"                        : "Показати інструменти розробника",
    "CMD_REFRESH_WINDOW"                        : "Перезапустити з розширеннями",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Перезапустити без розширень",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Нове вікно {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Змінити мову",
    "CMD_RUN_UNIT_TESTS"                        : "Запустити тестування",
    "CMD_SHOW_PERF_DATA"                        : "Показати дані продуктивності",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Увімкнути відлагоджувач Node",
    "CMD_LOG_NODE_STATE"                        : "Логувати статус Node до консолі",
    "CMD_RESTART_NODE"                          : "Перезапустити Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Показати помилки у рядку стану",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Відкрити код Brackets",

    "LANGUAGE_TITLE"                            : "Змінити мову",
    "LANGUAGE_MESSAGE"                          : "Мова:",
    "LANGUAGE_SUBMIT"                           : "Перезапустити {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Скасувати",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Типова в системі",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Час",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Просування",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Переміщення обраної точки<br><kbd class=\'text\'>Shift</kbd> Переміщення на 10 одиниць<br><kbd class=\'text\'>Tab</kbd> Навігація точками",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Збільшення та зменшення кроку<br><kbd>←</kbd><kbd>→</kbd> \'Початок\' та \'кінець\'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Старе значення <code>{0}</code> – невірне, тому функцію змінено на <code>{1}</code>. Документ буде оновлено після першого редагування.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Поточний колір",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Початковий колір",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Формат RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Формат Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Формат HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (використано {1} раз)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (використано {1} разів)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Перейти до оголошення",
    "CMD_SHOW_PARAMETER_HINT"                   : "Показувати підсвічування параметрів функції",
    "NO_ARGUMENTS"                              : "<параметри відсутні>",
    "DETECTED_EXCLUSION_TITLE"                  : "Помилка виведення файлу JavaScript",
    "DETECTED_EXCLUSION_INFO"                   : "Brackets зіткнувся з проблемою під час обробки <span class=\'dialog-filename\'>{0}</span>.<br><br>Для цього файлу більше не працюватиме аналіз, перехід до оголошень та швидке редагування. Аби повернути їх, відкрийте <code>.brackets.json</code> у теці свого проекту та відредагуйте параметр <code>jscodehints.detectedExclusions</code>. <br><br> Це схоже на ваду у Brackets. Якщо ви можете надати копію цього файлу, будь ласка, <a href=\'https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue\'>сповістіть про ваду</a> та вкажіть посилання на нього.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Швидкий перегляд під час наведення",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Останні проекти",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Докладніше"
});
/* Last translated for ed1b597f2c0e72fc11c9ec42d88d35f57cd6798b */
