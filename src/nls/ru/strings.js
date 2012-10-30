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
    "GENERIC_ERROR"                     : "(ошибка {0})",
    "NOT_FOUND_ERR"                     : "Файл не найден.",
    "NOT_READABLE_ERR"                  : "Файл не может быть прочтен.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Содержимое данной папки не может быть изменено.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "У Вас недостаточно привилегий для изменений.",
    "FILE_EXISTS_ERR"                   : "Данный файл уже существует.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Ошибка загрузки проекта",
    "OPEN_DIALOG_ERROR"                 : "Произошла ошибка во время открытия диалога. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Произошла ошибка во время загрузки папки <span class='dialog-filename'>{0}</span>. (ошибка {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Произошла ошибка во время чтения папки <span class='dialog-filename'>{0}</span>. (ошибка {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Ошибка открытия файла",
    "ERROR_OPENING_FILE"                : "Произошла ошибка во время открытия файла <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Ошибка чтения изменений файла",
    "ERROR_RELOADING_FILE"              : "Произошла ошибка во время перезагрузки файла <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Ошибка сохраниния файла",
    "ERROR_SAVING_FILE"                 : "Произошла ошибка во время сохраниния файла <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Ошибка Переименования Файла",
    "ERROR_RENAMING_FILE"               : "Произошла ошибка во время переименования файла <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Неверное имя файла",
    "INVALID_FILENAME_MESSAGE"          : "В имени файла не может быть следующих символов: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "Файл с именем <span class='dialog-filename'>{0}</span> уже существует.",
    "ERROR_CREATING_FILE_TITLE"         : "Ошибка создания файла",
    "ERROR_CREATING_FILE"               : "Произошла ошибка во время создания файла <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Внимание! Приложение {APP_NAME} не работает в браузере.",
    "ERROR_IN_BROWSER"                  : "Приложений {APP_NAME} написано на HTML, но использует специальную оболочку, чтобы получить доступ к файлам операционной системы. Код оболочки приложения {APP_NAME} можно скачать здесь <b>github.com/adobe/brackets-shell</b>.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Ошибка Индексации Файлов",
    "ERROR_MAX_FILES"                   : "Индексировано максимально разрешенное количество файлов. Возможны ошибки в операциях по поиску файлов.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Ошибка Во Время Запуска Браузера",
    "ERROR_CANT_FIND_CHROME"            : "Браузер Гугл Хром (Google Chrome) не найлен. Убедитесь, что браузер установлен.",
    "ERROR_LAUNCHING_BROWSER"           : "Произошла ошибка во время запуска браузера. (ошибка {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Ошибка Динамического Просмотра",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Подсоединение к браузеру",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Требуется перегрузить браузер Хром в режиме удаленной отладки, чтобы включить Динамический Просмотр.<br /><br />Перегрузить Хром?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Откройте HTML файл, чтобы запустить динамический просмотр.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Добро Пожаловать в Динамический Просмотр!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Приложение {APP_NAME} открывает HTML файл в браузере и динамически обновляет браузер после каждого изменения в редакторе. <br /><br />В данный момент Динамический Просмотр в {APP_NAME}, работает только с <strong>файлами стилей CSS</strong> и только в браузере <strong>Гугл Хром (Google Chrome)</strong>. Поддержка HTML и JavaScript файлов в настоящее время находится в разработке!<br /><br />(Данное сообщение больше показываться не будет.)",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Динамический Просмотр",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Динамический Просмотр: Подсоединение...",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Динамический Просмотр: Инициализация...",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Отсоединение Динамического Просмотра",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Динамический Просмотр: Отключится (Сохраните файл для просмотра)",
    
    "SAVE_CLOSE_TITLE"                  : "Сохранить Изменения",
    "SAVE_CLOSE_MESSAGE"                : "Сохранить изменения в документе <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Сохранить все измененные файлы?",
    "EXT_MODIFIED_TITLE"                : "Внешние Изменения",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> был изменен в другом приложении, но также был изменен в {APP_NAME}.<br /><br />Какую версию вы хотите сохранить?",
    "EXT_DELETED_MESSAGE"               : "Файл <span class='dialog-filename'>{0}</span> был удален с диска до сохранения изменений в приложении {APP_NAME}.<br /><br />Сохранить изменения?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Используйте /re/ для regexp запросов в поиске",
    "WITH"                              : "На",
    "BUTTON_YES"                        : "Да",
    "BUTTON_NO"                         : "Нет",
    "BUTTON_STOP"                       : "Остановить",

    "OPEN_FILE"                         : "Открыть Файл",
    "CHOOSE_FOLDER"                     : "Выбрать Папку",

    "RELEASE_NOTES"                     : "Список Изменений",
    "NO_UPDATE_TITLE"                   : "Нет доступных обновлений!",
    "NO_UPDATE_MESSAGE"                 : "У Вас последняя версия приложения {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "запрос \"{4}\" - {0} {1} в {2} {3}",
    "FIND_IN_FILES_FILE"                : "файле",
    "FIND_IN_FILES_FILES"               : "файлах",
    "FIND_IN_FILES_MATCH"               : "совпадение",
    "FIND_IN_FILES_MATCHES"             : "совпадений",
    "FIND_IN_FILES_MORE_THAN"           : "Более чем ",
    "FIND_IN_FILES_MAX"                 : " (первые {0} совпадений)",
    "FIND_IN_FILES_FILE_PATH"           : "Файл: <b>{0}</b>",
    "FIND_IN_FILES_LINE"                : "строка:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Ошибка проверки обновлений",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Информация об обновлениях с сервера недоступна. Убедитесь, что вы подключены к интернету и попробуйте еще раз.",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "Изменить Язык",
    "LANGUAGE_MESSAGE"                  : "Выберите язык из списка:",
    "LANGUAGE_SUBMIT"                   : "Перегрузить {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "Отмена",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Безымянный",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Пробел",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Строка {0}, Столбец {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Включить отступ с пробелами",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Включить отступ с табуляцией",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Изменить количество пробелов в отступе",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Изменить ширину табуляции",
    "STATUSBAR_SPACES"                      : "Пробелов",
    "STATUSBAR_TAB_SIZE"                    : "Размер табуляции",
    "STATUSBAR_LINE_COUNT"                  : "{0} Строк",
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Файл",
    "CMD_FILE_NEW"                        : "Новый Файл",
    "CMD_FILE_NEW_FOLDER"                 : "Новая Папка",
    "CMD_FILE_OPEN"                       : "Открыть\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Добавить в Рабочий Набор Файлов",
    "CMD_OPEN_FOLDER"                     : "Открыть Папку\u2026",
    "CMD_FILE_CLOSE"                      : "Закрыть",
    "CMD_FILE_CLOSE_ALL"                  : "Закрыть Все",
    "CMD_FILE_SAVE"                       : "Сохранить",
    "CMD_FILE_SAVE_ALL"                   : "Сохранить Все",
    "CMD_LIVE_FILE_PREVIEW"               : "Динамический Просмотр",
    "CMD_FILE_RENAME"                     : "Переименовать",
    "CMD_QUIT"                            : "Выход",

    // Edit menu commands
    "EDIT_MENU"                           : "Редактировать",
    "CMD_SELECT_ALL"                      : "Выделить Все",
    "CMD_FIND"                            : "Поиск",
    "CMD_FIND_IN_FILES"                   : "Поиск Файлов",
    "CMD_FIND_NEXT"                       : "Найти Следующий",
    "CMD_FIND_PREVIOUS"                   : "Найти Предыдущий",
    "CMD_REPLACE"                         : "Заменить",
    "CMD_INDENT"                          : "Увеличить Отступ",
    "CMD_UNINDENT"                        : "Уменьшить Отступ",
    "CMD_DUPLICATE"                       : "Дублировать",
    "CMD_DELETE_LINES"                    : "Удалить Строку(и)",
    "CMD_COMMENT"                         : "Комментарий / Убрать Комментарий",
    "CMD_LINE_UP"                         : "Перенести Строку(и) Вверх",
    "CMD_LINE_DOWN"                       : "Перенести Строку(и) Вниз",
     
    // View menu commands
    "VIEW_MENU"                           : "Вид",
    "CMD_HIDE_SIDEBAR"                    : "Спрятать Рабочую Панель",
    "CMD_SHOW_SIDEBAR"                    : "Показать Рабочую Панель",
    "CMD_INCREASE_FONT_SIZE"              : "Увеличить Размер Шрифта",
    "CMD_DECREASE_FONT_SIZE"              : "Уменьшить Размер Шрифта",
    "CMD_RESTORE_FONT_SIZE"               : "Восстановить Размер Шрифта",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Навигация",
    "CMD_QUICK_OPEN"                      : "Открыть (экспресс режим)",
    "CMD_GOTO_LINE"                       : "Перейти на Строку",
    "CMD_GOTO_DEFINITION"                 : "Перейти к Определению",
    "CMD_TOGGLE_QUICK_EDIT"               : "Редактировать (экспресс режим)",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Предыдущее Совпадение",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Следующее Совпадение",
    "CMD_NEXT_DOC"                        : "Следующий Документ",
    "CMD_PREV_DOC"                        : "Предыдущий Документ",
    "CMD_SHOW_IN_TREE"                    : "Показать в Файловом Дереве",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Отладка",
    "CMD_REFRESH_WINDOW"                  : "Перегрузить {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "Запустить Панель Разработчика",
    "CMD_RUN_UNIT_TESTS"                  : "Запуск Тестов",
    "CMD_JSLINT"                          : "Включить поддержку JSLint",
    "CMD_SHOW_PERF_DATA"                  : "Статистика Производительности Приложения",
    "CMD_NEW_BRACKETS_WINDOW"             : "Новое Окно {APP_NAME}",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Открыть папку с дополнениями",
    "CMD_SWITCH_LANGUAGE"                 : "Изменить Язык",
    "CMD_CHECK_FOR_UPDATE"                : "Проверка обновлений",

    // Help menu commands
    "HELP_MENU"                           : "Помощь",
    "CMD_ABOUT"                           : "О программе {APP_TITLE}",
    "CMD_FORUM"                           : "Форум {APP_NAME}",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Закрыть Окно",
    "CMD_ABORT_QUIT"                      : "Не выходить",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Экспериментальная Сборка",
    "JSLINT_ERRORS"                        : "Ошибки JSLint",
    "JSLINT_ERROR_INFORMATION"             : "1 Ошибка JSLint",
    "JSLINT_ERRORS_INFORMATION"            : "{0} Ошибки JSLint",
    "JSLINT_NO_ERRORS"                     : "JSLint не нашел ошибок - отличная работа!",
    "JSLINT_DISABLED"                      : "JSLint не включен или не работает с данным файлом",
    "SEARCH_RESULTS"                       : "Результаты поиска",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Не Сохранять",
    "SAVE"                                 : "Сохранить",
    "CANCEL"                               : "Отмена",
    "RELOAD_FROM_DISK"                     : "Перезагрузить с Диска",
    "KEEP_CHANGES_IN_EDITOR"               : "Сохранить Изменения в Редакторе",
    "CLOSE_DONT_SAVE"                      : "Закрыть (Не Сохранять)",
    "RELAUNCH_CHROME"                      : "Перегрузить Хром (Chrome)",
    "ABOUT"                                : "О приложении",
    "APP_NAME"                             : "Brackets (Скобки)",
    "CLOSE"                                : "Закрыть",
    "ABOUT_TEXT_LINE1"                     : "номер спринта {VERSION_MINOR} экспериментальная сборка {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Заметки и условия пользования, касающиеся програмного обеспечения от третьих лиц находятся на сайте <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> и включены посредством ссылки.",
    "ABOUT_TEXT_LINE4"                     : "Документация и код <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Достпупна новая сборка приложения {APP_NAME}! Продолжить?",
    "UPDATE_AVAILABLE_TITLE"               : "Доступные Обновления",
    "UPDATE_MESSAGE"                       : "Доступна новая сборка приложения {APP_NAME}. Вот, что мы поменяли:",
    "GET_IT_NOW"                           : "Скачать!"
});
