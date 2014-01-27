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
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Ограничение прав не позволяет сделать изменения.",
    "CONTENTS_MODIFIED_ERR"             : "Файл был изменен другим приложением.",
    "FILE_EXISTS_ERR"                   : "Файл уже существует.",
    "FILE"                              : "файл",
    "DIRECTORY"                         : "директория",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Ошибка при загрузке проекта",
    "OPEN_DIALOG_ERROR"                 : "Произошла ошибка при показе диалога открытия файлов. (ошибка {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Произошла ошибка при загрузке директории <span class='dialog-filename'>{0}</span>. (ошибка {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Произошла ошибка при чтении содержимого директории <span class='dialog-filename'>{0}</span>. (ошибка {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Ошибка открытия файла",
    "ERROR_OPENING_FILE"                : "Произошла ошибка при попытке открыть файл <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Произошла ошибка при попытке открыть файлы: ",
    "ERROR_RELOADING_FILE_TITLE"        : "Ошибка перезагрузки изменений с диска",
    "ERROR_RELOADING_FILE"              : "Произошла ошибка при попытке перезагрузить файл <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Ошибка сохранения файла",
    "ERROR_SAVING_FILE"                 : "Произошла ошибка при попытке сохранить файл <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Ошибка переименования файла",
    "ERROR_RENAMING_FILE"               : "Произошла ошибка при попытке переименовать файл <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Ошибка удаления файла",
    "ERROR_DELETING_FILE"               : "Произошла ошибка при попытке удалить файл <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Неверное имя файла",
    "INVALID_FILENAME_MESSAGE"          : "Имена файлов не могут содержать следующие символы: {0}",
    "FILE_ALREADY_EXISTS"               : "Файл <span class='dialog-filename'>{0}</span> уже существует.",
    "ERROR_CREATING_FILE_TITLE"         : "Ошибка создания файла",
    "ERROR_CREATING_FILE"               : "Произошла ошибка при попытке создать файл <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "К сожалению, запуск {APP_NAME} в браузере пока что не поддерживается.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} разработан на HTML, но пока что может работать только как настольное приложение, чтобы вы могли редактировать локальные файлы. Пожалуйста, используйте специальную оболочку (проект <b>github.com/adobe/brackets-shell</b>) для запуска {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Ошибка индексирования файлов",
    "ERROR_MAX_FILES"                   : "Количество файлов превышает предельно допустимое. Команды использующие индекс файлов могут работать некорректно.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Ошибка запуска браузера.",
    "ERROR_CANT_FIND_CHROME"            : "Браузер Google Chrome не найден. Пожалуйста, убедитесь, что он установлен.",
    "ERROR_LAUNCHING_BROWSER"           : "Произошла ошибка при запуске браузера. (ошибка {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Ошибка функции Live Preview",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Соединение с браузером",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Функция Live Preview требует перезапуска Chrome с включенной функцией удаленной отладки. <br /><br />Перезапустить Chrome с удаленной отладкой?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Невозможно загрузить страницу Live Preview",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Откройте HTML файл для того чтобы запустить интерактивную разработку.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Для запуска Live Preview с серверным файлом, вы должны указать базовый URL проекта.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Ошибка запуска HTTP сервера для Live Preview. Попытайтесь снова.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Добро пожаловать в Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview, функция синхронного предпросмотра, подключает браузер к среде разработки {APP_NAME}. Эта функция загружает HTML файл для предварительного просмотра в браузере  и мгновенно отображает все изменения при редактировании кода.<br /><br />В данной версии {APP_NAME}, функция Live Preview пока что работает только с <strong>Google Chrome</strong> и обновления в реальном времени отображаются только при редактировании <strong>CSS или HTML файлов</strong>. Изменения в JavaScript файлах автоматически перезагружают страницу при сохранении.<br /><br />(Это сообщение будет показано только один раз.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Для дополнительной информации, смотрите <a href='{0}' title='{0}'>Поиск и устранение неисправностей ошибок подключения Live Preview</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview: Синхронный предпросмотр",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Подключение\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Инициализация\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Отсоединить Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview (Для отображения изменений сохраните их)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Preview (Не обновляется из-за синтактической ошибки)",
    
    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Функция Live Preview была отключена при открытии инструментов разработки в браузере",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Функция Live Preview была отключена при закрытия страницы в браузере",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Функция Live Preview была отключена при переходе на страницу не принадлежащую проекту",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Функция Live Preview была отменена по неизвестной причине ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Сохранить изменения",
    "SAVE_CLOSE_MESSAGE"                : "Вы хотите сохранить изменения, которые вы сделали в документе <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Вы хотите сохранить изменения для следующих файлов?",
    "EXT_MODIFIED_TITLE"                : "Внешние изменения",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Подтвердить удаление",
    "CONFIRM_FOLDER_DELETE"             : "Вы уверены что вы хотите удалить директорию <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Файл удален",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> был изменен на диске.<br /><br />Вы хотите сохранить ваши изменения и перезаписать внешние?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> был изменен на диске, но так же имеются несохраненные изменения в {APP_NAME}.<br /><br />Какую версию вы хотите оставить?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> был удален на диске, но имеются несохраненные изменения в {APP_NAME}.<br /><br />Вы хотите оставить ваши изменения?",
    
    // Generic dialog/button labels
    "OK"                                : "ОК",
    "CANCEL"                            : "Отменить",
    "DONT_SAVE"                         : "Не сохранять",
    "SAVE"                              : "Сохранить",
    "SAVE_AS"                           : "Сохранить как\u2026",
    "SAVE_AND_OVERWRITE"                : "Перезаписать",
    "DELETE"                            : "Удалить",
    "BUTTON_YES"                        : "Да",
    "BUTTON_NO"                         : "Нет",
        
    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} результатов",
    "FIND_RESULT_COUNT_SINGLE"          : "1 результат",
    "FIND_NO_RESULTS"                   : "Не найдено",
    "REPLACE_PLACEHOLDER"               : "Заменить\u2026",
    "BUTTON_REPLACE_ALL"                : "Все\u2026",
    "BUTTON_REPLACE"                    : "Заменить",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Следующее совпадение",
    "BUTTON_PREV_HINT"                  : "Предыдущее совпадение",
    "BUTTON_CASESENSITIVE_HINT"         : "С учетом регистра",
    "BUTTON_REGEXP_HINT"                : "Регулярное выражение",

    "OPEN_FILE"                         : "Открыть файл",
    "SAVE_FILE_AS"                      : "Сохранить файл",
    "CHOOSE_FOLDER"                     : "Выбрать директорию",

    "RELEASE_NOTES"                     : "Примечания к выпуску",
    "NO_UPDATE_TITLE"                   : "Обновления отсутствуют",
    "NO_UPDATE_MESSAGE"                 : "Вы используете последнюю версию {APP_NAME}.",

    // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1"          : "Заменить \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" на \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    // Find in Files
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" найдено",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} в {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "в <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "в проекте",
    "FIND_IN_FILES_FILE"                : "файле",
    "FIND_IN_FILES_FILES"               : "файлах",
    "FIND_IN_FILES_MATCH"               : "совпадение",
    "FIND_IN_FILES_MATCHES"             : "совпадений",
    "FIND_IN_FILES_MORE_THAN"           : "Более ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Ошибка при получении информации об обновлениях",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Ошибка при получении информации о последних обновлениях с сервера. Пожалуйста, убедитесь, что вы подключены к интернету и попробуйте снова. ",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Загрузка\u2026",
    "UNTITLED"          : "Без названия",
    "WORKING_FILES"     : "Рабочие файлы",

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
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Выделен {0} столбец",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Выделено {0} столбцов",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Выделена {0} строка",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Выделено {0} строк",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Нажмите чтобы использовать пробелы для отступа",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Нажмите чтобы использовать табуляцию для отступа",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Нажмите чтобы изменить количества пробелов для отступа",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Нажмите чтобы изменить ширину табуляции в столбцах",
    "STATUSBAR_SPACES"                      : "Пробелы:",
    "STATUSBAR_TAB_SIZE"                    : "Табуляция:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} строка",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} строк",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Расширения отключены",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} ошибок",
    "SINGLE_ERROR"                          : "1 ошибка {0}",
    "MULTIPLE_ERRORS"                       : "{1} ошибок {0}",
    "NO_ERRORS"                             : "{0} не нашел ошибок &mdash; отлично!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Ошибок не найдено &mdash; отлично!",
    "LINT_DISABLED"                         : "Статический анализ отключен",
    "NO_LINT_AVAILABLE"                     : "Нет статического анализатора для {0}",
    "NOTHING_TO_LINT"                       : "Не подлежит статическому анализу",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Файл",
    "CMD_FILE_NEW_UNTITLED"               : "Новый",
    "CMD_FILE_NEW"                        : "Новый файл",
    "CMD_FILE_NEW_FOLDER"                 : "Новая директория",
    "CMD_FILE_OPEN"                       : "Открыть\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Добавить в рабочий набор",

    "CMD_OPEN_FOLDER"                     : "Открыть директорию\u2026",
    "CMD_FILE_CLOSE"                      : "Закрыть",
    "CMD_FILE_CLOSE_ALL"                  : "Закрыть все",
    "CMD_FILE_CLOSE_LIST"                 : "Закрыть список",
    "CMD_FILE_CLOSE_OTHERS"               : "Закрыть остальные",
    "CMD_FILE_CLOSE_ABOVE"                : "Закрыть остальные сверху",
    "CMD_FILE_CLOSE_BELOW"                : "Закрыть остальные снизу",
    "CMD_FILE_SAVE"                       : "Сохранить",
    "CMD_FILE_SAVE_ALL"                   : "Сохранить все",
    "CMD_FILE_SAVE_AS"                    : "Сохранить как\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_PROJECT_SETTINGS"                : "Настройки проекта\u2026",
    "CMD_FILE_RENAME"                     : "Переименовать",
    "CMD_FILE_DELETE"                     : "Удалить",
    "CMD_INSTALL_EXTENSION"               : "Установить расширение\u2026",
    "CMD_EXTENSION_MANAGER"               : "Менеджер расширений\u2026",
    "CMD_FILE_REFRESH"                    : "Обновить дерево проекта",
    "CMD_QUIT"                            : "Выход",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Выход",

    // Edit menu commands
    "EDIT_MENU"                           : "Правка",
    "CMD_UNDO"                            : "Отменить",
    "CMD_REDO"                            : "Повторить",
    "CMD_CUT"                             : "Вырезать",
    "CMD_COPY"                            : "Копировать",
    "CMD_PASTE"                           : "Вставить",
    "CMD_SELECT_ALL"                      : "Выделить все",
    "CMD_SELECT_LINE"                     : "Выделить строку",
    "CMD_FIND"                            : "Найти",
    "CMD_FIND_FIELD_PLACEHOLDER"          : "Найти\u2026",
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
    "CMD_OPEN_LINE_ABOVE"                 : "Встравить строку сверху",
    "CMD_OPEN_LINE_BELOW"                 : "Вставить строку снизу",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Автоматически закрывать скобкуи",
    "CMD_SHOW_CODE_HINTS"                 : "Показывать подсказки в коде",
    
    // View menu commands
    "VIEW_MENU"                           : "Вид",
    "CMD_HIDE_SIDEBAR"                    : "Скрыть боковую панель",
    "CMD_SHOW_SIDEBAR"                    : "Показать боковую панель",
    "CMD_INCREASE_FONT_SIZE"              : "Увеличить размер шрифта",
    "CMD_DECREASE_FONT_SIZE"              : "Уменьшить размер шрифта",
    "CMD_RESTORE_FONT_SIZE"               : "Восстановить размер шрифта",
    "CMD_SCROLL_LINE_UP"                  : "Прокрутить на строку вверх",
    "CMD_SCROLL_LINE_DOWN"                : "Прокрутить на строку вниз",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Номера строк",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Подсвечивать активную строку",
    "CMD_TOGGLE_WORD_WRAP"                : "Заворачивать строки",
    "CMD_LIVE_HIGHLIGHT"                  : "Подсвечивать в Live Preview",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Анализировать при сохранении",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Сортировать по порядку добавления",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Сортировать по имени",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Сортировать по типу",
    "CMD_SORT_WORKINGSET_AUTO"            : "Автоматическая сортировка",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Навигация",
    "CMD_QUICK_OPEN"                      : "Быстрое открытие",
    "CMD_GOTO_LINE"                       : "Перейти к строке",
    "CMD_GOTO_DEFINITION"                 : "Найти определение",
    "CMD_GOTO_FIRST_PROBLEM"              : "Перейти к первой ошибке",
    "CMD_TOGGLE_QUICK_EDIT"               : "Быстрое редактирование",
    "CMD_TOGGLE_QUICK_DOCS"               : "Быстрая документация",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Предыдущее совпадение",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Следующее совпадение",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Новое правило",
    "CMD_NEXT_DOC"                        : "Следующий документ",
    "CMD_PREV_DOC"                        : "Предыдущий документ",
    "CMD_SHOW_IN_TREE"                    : "Показать в дереве проекта",
    "CMD_SHOW_IN_OS"                      : "Показать в оперативной системе",
    
    // Help menu commands
    "HELP_MENU"                           : "Помощь",
    "CMD_CHECK_FOR_UPDATE"                : "Проверить на обновления",
    "CMD_HOW_TO_USE_BRACKETS"             : "Как использовать {APP_NAME}",
    "CMD_FORUM"                           : "Форум {APP_NAME}",
    "CMD_RELEASE_NOTES"                   : "Примечания к выпуску",
    "CMD_REPORT_AN_ISSUE"                 : "Сообщить о проблеме",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Показать директорию расширений",
    "CMD_TWITTER"                         : "{TWITTER_NAME} в Twitter",
    "CMD_ABOUT"                           : "О {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Открыть файл настроек",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Экспериментальная сборка",
    "DEVELOPMENT_BUILD"                    : "Сборка для разработчиков",
    "RELOAD_FROM_DISK"                     : "Перезагрузить с диска",
    "KEEP_CHANGES_IN_EDITOR"               : "Оставить изменения в редакторе",
    "CLOSE_DONT_SAVE"                      : "Закрыть (Не сохранять)",
    "RELAUNCH_CHROME"                      : "Перезапустить Chrome",
    "ABOUT"                                : "О программе",
    "CLOSE"                                : "Закрыть",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Внимание, правила и условия, относящиеся к стороннему программному обеспечению находятся на <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> и включены здесь в качестве ссылки.",
    "ABOUT_TEXT_LINE4"                     : "Документация и исходные коды находятся на <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Разработчики, сделавшие этот редактор с \u2764 и на JavaScript:",
    "ABOUT_TEXT_LINE6"                     : "Длинный список инженеров, но, к сожалению, в данный момент мы не можем его показать.",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Новая сборка {APP_NAME} доступна! Нажмите здесь для подробностей.",
    "UPDATE_AVAILABLE_TITLE"               : "Доступно обновление",
    "UPDATE_MESSAGE"                       : "Эй, новая версия {APP_NAME} доступна. Вот некоторые из новых функций:",
    "GET_IT_NOW"                           : "Установить немедленно!",
    "PROJECT_SETTINGS_TITLE"               : "Настройки проекта для: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Базовый URL для Live Preview",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(оставьте пустым для просмотра локальных файлов)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Протокол {0} не поддерживается Live Preview &mdash; пожалуйста, используйте http: или https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Базовый URL не может содержать такие параметры поиска как \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Базовый URL не может содержать такие хеши как \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Специальные символы как '{0}' должны быть %-экранированы.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Неизвестная ошибка при синтаксическом разборе основного URL",
    
    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Новое правило",
    
    // Extension Management strings
    "INSTALL"                              : "Установить",
    "UPDATE"                               : "Обновить",
    "REMOVE"                               : "Удалить",
    "OVERWRITE"                            : "Переустановить",
    "CANT_REMOVE_DEV"                      : "Расширения, установленные в директории \"dev\", должны удаляться вручную.",
    "CANT_UPDATE"                          : "Это обновление не совместимо с данной версией {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Расширения, установленные в директории \"dev\", не могут быть автоматически обновлены.",
    "INSTALL_EXTENSION_TITLE"              : "Установка расширения",
    "UPDATE_EXTENSION_TITLE"               : "Обновление расширения",
    "INSTALL_EXTENSION_LABEL"              : "URL расширения",
    "INSTALL_EXTENSION_HINT"               : "URL zip-файла расширения или репозитория GitHub",
    "INSTALLING_FROM"                      : "Установка расщирения с {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Установка завершена успешно!",
    "INSTALL_FAILED"                       : "Не удалось установить.",
    "CANCELING_INSTALL"                    : "Отмена\u2026",
    "CANCELING_HUNG"                       : "Отмена установки занимает продложительное время. Возможно по причине внутренней ошибки.",
    "INSTALL_CANCELED"                     : "Установка отменена.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Скачанный файл не является zip-файлом.",
    "INVALID_PACKAGE_JSON"                 : "Файл package.json не корректен (ошибка: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Файл package.json не содержит имени пакета.",
    "BAD_PACKAGE_NAME"                     : "{0} не является корректным именем пакета.",
    "MISSING_PACKAGE_VERSION"              : "Файл package.json не содержит версии пакета.",
    "INVALID_VERSION_NUMBER"               : "Версия пакета ({0}) некорректна.",
    "INVALID_BRACKETS_VERSION"             : "Стока совместимости с {APP_NAME} ({0}) некорректна.",
    "DISALLOWED_WORDS"                     : "Слова ({1}) недопустимы в поле {0}.",
    "API_NOT_COMPATIBLE"                   : "Расширение несовместимо с данной версией {APP_NAME}. Расширение установлено в директории disabled.",
    "MISSING_MAIN"                         : "Пакет не содержит файл main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Установка этого пакета перезапишет установленное расширение. Перезаписать существующее расширение?",
    "EXTENSION_SAME_VERSION"               : "Версия данного пакета совпадает с версией установленного расширения. Перезаписать существующее расширение?",
    "EXTENSION_OLDER_VERSION"              : "Версия данного пакета ({0}) старее версии уставновленного расширения ({1}). Перезаписать существующее расширение?",
    "DOWNLOAD_ID_IN_USE"                   : "Внутренняя ошибка: идентификатор закачки уже используется.",
    "NO_SERVER_RESPONSE"                   : "Невозможно присоединиться к серверу.",
    "BAD_HTTP_STATUS"                      : "Файл не найден на сервере (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Невозможно сохранить закачку во временный файл.",
    "ERROR_LOADING"                        : "Ошибка при запуске расширения.",
    "MALFORMED_URL"                        : "Некорректный URL. Пожалуйста, убедитесь в его правильности.",
    "UNSUPPORTED_PROTOCOL"                 : "URL должен использовать протокол http or https.",
    "UNKNOWN_ERROR"                        : "Неизвестная внутрення ошибка.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Менеджер расширений",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Невозможно подсоединиться к каталогу расширений. Пожалуйста, попытайтесь еще раз.",
    "INSTALL_FROM_URL"                     : "Установить с URL\u2026",
    "EXTENSION_AUTHOR"                     : "Автор",
    "EXTENSION_DATE"                       : "Дата",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Это расширение требует новой версии {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Это расширение работает только с предыдущими версиями {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Версия {0} данного расширения требует новой версии {APP_NAME}. Вы можете установить предыдущую версию расширения{1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Версия {0} данного расширения требует предыдущей версии {APP_NAME}. Вы можете установить предыдущую версию {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Описание отсутвует",
    "EXTENSION_MORE_INFO"                  : "Подробнее\u2026",
    "EXTENSION_ERROR"                      : "Ошибка расширения",
    "EXTENSION_KEYWORDS"                   : "Ключевые слова",
    "EXTENSION_INSTALLED"                  : "Установлено",
    "EXTENSION_UPDATE_INSTALLED"           : "Данное расширение было скачано и будет установлено после перегрузки {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Поиск",
    "EXTENSION_MORE_INFO_LINK"             : "Подробнее",
    "BROWSE_EXTENSIONS"                    : "Просмотреть расширения",
    "EXTENSION_MANAGER_REMOVE"             : "Удалить расширение",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Невозможно удалить одно или более расширений: {0}. {APP_NAME} продолжит перезагрузку.",
    "EXTENSION_MANAGER_UPDATE"             : "Обновить расширение",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Невозможно обновить одно или более расширений: {0}. {APP_NAME} продолжит перезагрузку.",
    "MARKED_FOR_REMOVAL"                   : "Отмечено для удаления",
    "UNDO_REMOVE"                          : "Не удалять",
    "MARKED_FOR_UPDATE"                    : "Отмечено для обновления",
    "UNDO_UPDATE"                          : "Не обновлять",
    "CHANGE_AND_RELOAD_TITLE"              : "Измененные расширения",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Для обновления или удаления расширений, {APP_NAME} будет перезагружен. Вам будет предложено сохранить несохраненные изменения.",
    "REMOVE_AND_RELOAD"                    : "Удалить расширения и перегрузиться",
    "CHANGE_AND_RELOAD"                    : "Изменить расширения и перегрузиться",
    "UPDATE_AND_RELOAD"                    : "Обновить расширения и перегрузиться",
    "PROCESSING_EXTENSIONS"                : "Обработка изменений в расширениях\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Невозможно удалить расширение {0}, оно не было установлено.",
    "NO_EXTENSIONS"                        : "Нет установленных расширений.<br>Перейдите на закладку Доступные чтобы начать работу с расширениями.",
    "NO_EXTENSION_MATCHES"                 : "Не найдено расширений по критерию поиска.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Будеть осторожны при установке расширений из неизвестных источников.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Установленные",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Доступные",
    "EXTENSIONS_UPDATES_TITLE"             : "Обновления",
    
    "INLINE_EDITOR_NO_MATCHES"             : "Нет найдено совпадений.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Существующих правил CSS соответвующих выделенному тексту не определено. <br> Выберите \"Новое правило\" чтобы создать новое.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Ваш проект не содержит таблиц стилей (stylesheets).<br>Создайте его чтобы добавить правило CSS.",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "пикселей",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Отладка",
    "CMD_SHOW_DEV_TOOLS"                        : "Показать инструменты разработчика",
    "CMD_REFRESH_WINDOW"                        : "Перезагрузить {APP_NAME}",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Перегрузить без расширений",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Новое окно {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Переключить язык",
    "CMD_RUN_UNIT_TESTS"                        : "Запустить тесты",
    "CMD_SHOW_PERF_DATA"                        : "Показать данные о производительности",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Включить отладчик node",
    "CMD_LOG_NODE_STATE"                        : "Отображать состояние node в консоли",
    "CMD_RESTART_NODE"                          : "Перезапустить node",
    
    "LANGUAGE_TITLE"                            : "Изменить язык",
    "LANGUAGE_MESSAGE"                          : "Пожалуйста, выберите желаемый язык из списка ниже:",
    "LANGUAGE_SUBMIT"                           : "Перезагрузить {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Отмена",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "По умолчанию",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "Czech",
    "LOCALE_DE"                                 : "German",
    "LOCALE_EL"                                 : "Greek",
    "LOCALE_EN"                                 : "English",
    "LOCALE_ES"                                 : "Spanish",
    "LOCALE_FI"                                 : "Finnish",
    "LOCALE_FR"                                 : "French",
    "LOCALE_IT"                                 : "Italian",
    "LOCALE_JA"                                 : "Japanese",
    "LOCALE_NB"                                 : "Norwegian",
    "LOCALE_NL"                                 : "Dutch",
    "LOCALE_FA_IR"                              : "Persian-Farsi",
    "LOCALE_PL"                                 : "Polish",
    "LOCALE_PT_BR"                              : "Portuguese, Brazil",
    "LOCALE_PT_PT"                              : "Portuguese",
    "LOCALE_RO"                                 : "Romanian",
    "LOCALE_RU"                                 : "Russian",
    "LOCALE_SK"                                 : "Slovak",
    "LOCALE_SR"                                 : "Serbian",
    "LOCALE_SV"                                 : "Swedish",
    "LOCALE_TR"                                 : "Turkish",
    "LOCALE_ZH_CN"                              : "Chinese, simplified",
    "LOCALE_HU"                                 : "Hungarian",
    "LOCALE_KO"                                 : "Korean",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Время",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Прогрессия",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Передвинуть выделенную точку<br><kbd class='text'>Shift</kbd> Передвигать на десять единиц",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Увеличить или уменьшить шаги<br><kbd>←</kbd><kbd>→</kbd> 'Начало' or 'Конец'",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Текущий цвет",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Оригинальный цвет",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa формат",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex формат",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa формат",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Использовано {1} раз)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Использовано {1} раза)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Перейти к определению",
    "CMD_SHOW_PARAMETER_HINT"                   : "Показывать подсказки по аргументам функции",
    "NO_ARGUMENTS"                              : "<нет аргументов>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Быстрый просмотр при наведении",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Предыдущие проекты",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Подробнее\u2026"
});
