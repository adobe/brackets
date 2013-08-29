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
    "NOT_FOUND_ERR"                     : "Файл не найден",
    "NOT_READABLE_ERR"                  : "Файл не может быть прочитан",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Целевая директория не может быть изменена.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Разрешения не позволяют делать изменения.",
    "FILE_EXISTS_ERR"                   : "Файл уже существует.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Ошибка при загрузке проекта",
    "OPEN_DIALOG_ERROR"                 : "Произошла ошибка при показе диалога открытия файлов. (ошибка {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Произошла ошибка при загрузке директории <span class='dialog-filename'>{0}</span>. (ошибка {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Произошла ошибка при чтении содержимого директории <span class='dialog-filename'>{0}</span>. (ошибка {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Ошибка открытия файла",
    "ERROR_OPENING_FILE"                : "Произошла ошибка при попытке открыть файл <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Ошибка перезагрузки изменений с диска",
    "ERROR_RELOADING_FILE"              : "Произошла ошибка при попытке перезагрузить файл <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Ошибка сохранения файла",
    "ERROR_SAVING_FILE"                 : "Произошла ошибка при попытке сохранить файл <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Ошибка переименования файла",
    "ERROR_RENAMING_FILE"               : "Произошла ошибка при попытке переименовать файл <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Неверное имя файла",
    "INVALID_FILENAME_MESSAGE"          : "Имена файлов не могут содержать следующие символы: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "Файл <span class='dialog-filename'>{0}</span> уже существует.",
    "ERROR_CREATING_FILE_TITLE"         : "Ошибка создания файла",
    "ERROR_CREATING_FILE"               : "Произошла ошибка при попытке создать файл <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Упс! {APP_NAME} ещё не запустился в браузере.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} построен на HTML, но сейчас запущен как настольное приложение и может быть использован для редактирования локальных файлов. Пожалуйста, используйте консоль приложения из репозитория <b>github.com/adobe/brackets-shell</b> для запуска {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Ошибка индексирования файлов",
    "ERROR_MAX_FILES"                   : "Максимальное количество файлов было проиндексировано. Действия, которые ищут файлы в индексе, могут работать неправильно.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Ошибка запуска браузера.",
    "ERROR_CANT_FIND_CHROME"            : "Браузер Google Chrome не найден. Пожалуйста, убедитесь, что он установлен.",
    "ERROR_LAUNCHING_BROWSER"           : "Произошла ошибка при запуске браузера. (ошибка {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Ошибка Интерактивного Предпросмотра",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Соединение с браузером",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Для того чтобы подключить Интерактивный Предпросмотр, нужно перезапустить Chrome с включенной удаленной отладкой. <br /><br />Вы хотите перезапустить Chrome и включить удаленную отладку?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Откройте HTML файл для того чтобы запустить Интерактивный Предпросмотр.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Для запуска Интерактивного Предпросмотра с серверным файлом, вы должны указать основной URL для этого проекта.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Добро пожаловать в Интерактивный Предпросмотр!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Интерактивный Предпросмотр подключает {APP_NAME} к вашему браузеру. Он запускает предпросмотр HTML файла в вашем браузере и к тому же мгновенно обновляет предпросмотр при редактировании кода.<br /><br />В этой ранней версии {APP_NAME}, Интерактивный Предпросмотр работает только с <strong>Google Chrome</strong> и обновляется в реальном времени при редактировании <strong>CSS файлов</strong>. Изменения в HTML или Javascript файлах автоматически перезагружаются при сохранении.<br /><br />(Вы увидите это сообщение только один раз.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Для дополнительной информации, смотрите <a href='#' class='clickable-link' data-href=\"{0}''>Поиск и устранение неисправностей ошибок подключения Live Development</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Интерактивный Предпросмотр",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Интерактивный Предпросмотр: Подключение\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Интерактивный Предпросмотр: Инициализация\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Отсоединить Интерактивный Предпросмотр",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Интерактивный Предпросмотр: Нажмите чтобы отсоединиться (Сохранить файлы для обновления)",
    
    "SAVE_CLOSE_TITLE"                  : "Сохранить изменения",
    "SAVE_CLOSE_MESSAGE"                : "Вы хотите сохранить изменения, которые вы сделали в документе <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Вы хотите сохранить изменения для следующих файлов?",
    "EXT_MODIFIED_TITLE"                : "Внешние изменения",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> был изменен на диске, но так же имеются несохраненные изменения в {APP_NAME}.<br /><br />Какую версию вы хотите оставить?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> был удален на диске, но имеются несохраненные изменения в {APP_NAME}.<br /><br />Вы хотите оставить ваши изменения?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Используйте /re/ для поиска с регулярными выражениями",
    "WITH"                              : "Вместе",
    "BUTTON_YES"                        : "Да",
    "BUTTON_NO"                         : "Нет",
    "BUTTON_STOP"                       : "Остановить",

    "OPEN_FILE"                         : "Открыть файл",
    "CHOOSE_FOLDER"                     : "Выбрать папку",

    "RELEASE_NOTES"                     : "Примечания к выпуску",
    "NO_UPDATE_TITLE"                   : "Обновления отсутствуют",
    "NO_UPDATE_MESSAGE"                 : "Вы используете последнюю версию {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "Для \"{4}\" {5} - {0} {1} в {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "в <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "в проекте",
    "FIND_IN_FILES_FILE"                : "файл",
    "FIND_IN_FILES_FILES"               : "файлы",
    "FIND_IN_FILES_MATCH"               : "совпадение",
    "FIND_IN_FILES_MATCHES"             : "совпадения",
    "FIND_IN_FILES_MORE_THAN"           : "Больше чем ",
    "FIND_IN_FILES_MAX"                 : " (показываются первые {0} совпадений)",
    "FIND_IN_FILES_FILE_PATH"           : "Файл: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "Строка:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Ошибка при получении информации об обновлениях",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Была проблема при получении информации о последних обновлениях с сервера. Пожалуйста, убедитесь, что вы подключены к интернету и попробуйте снова. ",
    
    /**
     * ProjectManager
     */

    "UNTITLED" : "Без названия",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Строка {0}, Столбец {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Нажмите для включения отступов как пробелы",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Нажмите для включения отступов как табуляции",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Нажмите для изменения количества пробелов для отступов",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Нажмите для изменения длины символа табуляции",
    "STATUSBAR_SPACES"                      : "Пробелы",
    "STATUSBAR_TAB_SIZE"                    : "Размер табуляции",
    "STATUSBAR_LINE_COUNT"                  : "{0} Строк",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Файл",
    "CMD_FILE_NEW"                        : "Новый файл",
    "CMD_FILE_NEW_FOLDER"                 : "Новая папка",
    "CMD_FILE_OPEN"                       : "Открыть\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Добавить в рабочий набор",
    "CMD_OPEN_FOLDER"                     : "Открыть папку\u2026",
    "CMD_FILE_CLOSE"                      : "Закрыть",
    "CMD_FILE_CLOSE_ALL"                  : "Закрыть все",
    "CMD_FILE_SAVE"                       : "Сохранить",
    "CMD_FILE_SAVE_ALL"                   : "Сохранить все",
    "CMD_LIVE_FILE_PREVIEW"               : "Интерактивный Предпросмотр",
    "CMD_LIVE_HIGHLIGHT"                  : "Интерактивная Подсветка",
    "CMD_PROJECT_SETTINGS"                : "Настройки проекта\u2026",
    "CMD_FILE_RENAME"                     : "Переименовать",
    "CMD_QUIT"                            : "Выход",

    // Edit menu commands
    "EDIT_MENU"                           : "Правка",
    "CMD_SELECT_ALL"                      : "Выделить все",
    "CMD_SELECT_LINE"                     : "Выделить строку",
    "CMD_FIND"                            : "Найти",
    "CMD_FIND_IN_FILES"                   : "Найти в файлах",
    "CMD_FIND_IN_SUBTREE"                 : "Найти в\u2026",
    "CMD_FIND_NEXT"                       : "Найти след.",
    "CMD_FIND_PREVIOUS"                   : "Найти пред.",
    "CMD_REPLACE"                         : "Заменить",
    "CMD_INDENT"                          : "Сделать отступ",
    "CMD_UNINDENT"                        : "Убрать отступ",
    "CMD_DUPLICATE"                       : "Дублировать",
    "CMD_DELETE_LINES"                    : "Удалить строку",
    "CMD_COMMENT"                         : "Вкл./выкл. строчный комментарий",
    "CMD_BLOCK_COMMENT"                   : "Вкл./выкл. блочный комментарий",
    "CMD_LINE_UP"                         : "Переместить строку вверх",
    "CMD_LINE_DOWN"                       : "Переместить строку вниз",
     
    // View menu commands
    "VIEW_MENU"                           : "Вид",
    "CMD_HIDE_SIDEBAR"                    : "Скрыть боковую панель",
    "CMD_SHOW_SIDEBAR"                    : "Показать боковую панель",
    "CMD_INCREASE_FONT_SIZE"              : "Увеличить размер шрифта",
    "CMD_DECREASE_FONT_SIZE"              : "Уменьшить размер шрифта",
    "CMD_RESTORE_FONT_SIZE"               : "Восстановить размер шрифта",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Сортировать по дате добавления",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Сортировать по имени",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Сортировать по типу",
    "CMD_SORT_WORKINGSET_AUTO"            : "Сортировать автоматически",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Навигация",
    "CMD_QUICK_OPEN"                      : "Быстрое открытие",
    "CMD_GOTO_LINE"                       : "Перейти к строке",
    "CMD_GOTO_DEFINITION"                 : "Перейти к определению",
    "CMD_TOGGLE_QUICK_EDIT"               : "Быстрое редактирование",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Предыдущее совпадение",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Следующее совпадение",
    "CMD_NEXT_DOC"                        : "Следующий документ",
    "CMD_PREV_DOC"                        : "Предыдущий документ",
    "CMD_SHOW_IN_TREE"                    : "Показать в дереве файлов",
    
    // Help menu commands
    "HELP_MENU"                           : "Помощь",
    "CMD_CHECK_FOR_UPDATE"                : "Проверить на обновления",
    "CMD_HOW_TO_USE_BRACKETS"             : "Как использовать {APP_NAME}",
    "CMD_FORUM"                           : "Форум {APP_NAME}",
    "CMD_RELEASE_NOTES"                   : "Примечания к выпуску",
    "CMD_REPORT_AN_ISSUE"                 : "Сообщить о проблеме",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Показать папку расширений",
    "CMD_TWITTER"                         : "{TWITTER_NAME} в Twitter",
    "CMD_ABOUT"                           : "О {APP_TITLE}",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Закрыть окно",
    "CMD_ABORT_QUIT"                      : "Прервать выход",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Экспериментальная сборка",
    "DEVELOPMENT_BUILD"                    : "Сборка для разработчиков",
    "SEARCH_RESULTS"                       : "Результаты поиска",
    "OK"                                   : "ОК",
    "DONT_SAVE"                            : "Не сохранять",
    "SAVE"                                 : "Сохранить",
    "CANCEL"                               : "Отмена",
    "RELOAD_FROM_DISK"                     : "Перезагрузить с диска",
    "KEEP_CHANGES_IN_EDITOR"               : "Оставить изменения в редакторе",
    "CLOSE_DONT_SAVE"                      : "Закрыть (Не сохранять)",
    "RELAUNCH_CHROME"                      : "Перезапустить Chrome",
    "ABOUT"                                : "О программе",
    "CLOSE"                                : "Закрыть",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Внимание, правила и условия, относящиеся к стороннему программному обеспечению находятся на <a class='clickable-link' data-href='http://www.adobe.com/go/thirdparty/'>http://www.adobe.com/go/thirdparty/</a> и включены здесь в качестве ссылки.",
    "ABOUT_TEXT_LINE4"                     : "Документация и исходные коды находятся на <a class='clickable-link' data-href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Новая сборка {APP_NAME} доступна! Нажмите здесь для подробностей.",
    "UPDATE_AVAILABLE_TITLE"               : "Доступно обновление",
    "UPDATE_MESSAGE"                       : "Эй, новая сборка {APP_NAME} доступна. Вот некоторые из новых функций:",
    "GET_IT_NOW"                           : "Получить сейчас!",
    "PROJECT_SETTINGS_TOOLTIP"             : "Настройки проекта",
    "PROJECT_SETTINGS_TITLE"               : "Настройки проекта для: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Основной URL Интерактивного Предпросмотра",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(оставьте пустым для url файла)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Протокол {0} не поддерживается Интерактивным Предпросмотром&mdash;пожалуйста, используйте http: или https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Основной URL не может содержать такие параметры поиска как \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Основной URL не может содержать такие хеши как \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Специальные символы как '{0}' должны быть %-экранированы.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Неизвестная ошибка при парсинге основного URL",
    
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Отладка",
    "CMD_SHOW_DEV_TOOLS"                        : "Показать инструменты разработчика",
    "CMD_REFRESH_WINDOW"                        : "Перезагрузить {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Новое окно {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Переключить язык",
    "CMD_RUN_UNIT_TESTS"                        : "Запустить тесты",
    "CMD_SHOW_PERF_DATA"                        : "Показать данные о производительности",
    
    "LANGUAGE_TITLE"                            : "Изменить язык",
    "LANGUAGE_MESSAGE"                          : "Пожалуйста, выберите желаемый язык из списка ниже:",
    "LANGUAGE_SUBMIT"                           : "Перезагрузить {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Отмена",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_SELECTION_FIELD_TIP"          : "Насыщенность (х) и яркость (y)",
    "COLOR_EDITOR_HUE_SLIDER_TIP"               : "Цвет",
    "COLOR_EDITOR_OPACITY_SLIDER_TIP"           : "Непрозрачность",
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Текущий цвет",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Оригинальный цвет",
    "COLOR_EDITOR_COLOR_INPUT_TIP"              : "Значение цвета",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa формат",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex формат",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa формат",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Использовано {1} раз)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Использовано {1} раза)",
    
    // extensions/default/JSLint
    "CMD_JSLINT"                                : "Включить JSLint",
    "JSLINT_ERRORS"                             : "Ошибки JSLint",
    "JSLINT_ERROR_INFORMATION"                  : "1 Ошибка JSLint",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} Ошибок JSLint",
    "JSLINT_NO_ERRORS"                          : "Нет ошибок JSLint - хорошая работа!",
    "JSLINT_DISABLED"                           : "JSLint отключен или не работает для текущего файла"
});
