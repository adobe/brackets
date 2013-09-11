/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR"                     : "(błąd {0})",
    "NOT_FOUND_ERR"                     : "Nie znaleziono pliku.",
    "NOT_READABLE_ERR"                  : "Nie można odczytać pliku.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Nie można zmienić folderu docelowego.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Brak pozwolenia na modyfikację.",
    "FILE_EXISTS_ERR"                   : "Plik już istnieje.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Wystąpił błąd podczas ładowania projektu.",
    "OPEN_DIALOG_ERROR"                 : "Wystąpił błąd podczas wyświetlania okna otwierania pliku. (błąd {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Wystąpił błąd przy próbie otwarcia katalogu <span class='dialog-filename'>{0}</span>. (błąd {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Wystąpił błąd podczas odczytu zawartości katalogu <span class='dialog-filename'>{0}</span>. (błąd {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Błąd podczas otwierania pliku",
    "ERROR_OPENING_FILE"                : "Wystąpił błąd podczas próby otwarcia pliku <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Błąd przy próbie ponownego załadowania pliku z dysku",
    "ERROR_RELOADING_FILE"              : "Wystąpił błąd podczas próby ponownego załadowania pliku. <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Nie można zapisać pliku",
    "ERROR_SAVING_FILE"                 : "Wystąpił błąd podczas próby zapisu pliku <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Nie można zmienić nazwy",
    "ERROR_RENAMING_FILE"               : "Wystąpił błąd podczas próby zmiany nazwy pliku <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Niewłaściwa nazwa pliku",
    "INVALID_FILENAME_MESSAGE"          : "Nazwa pliku nie może zawierać następujących znaków: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "Plik <span class='dialog-filename'>{0}</span> już istnieje.",
    "ERROR_CREATING_FILE_TITLE"         : "Nie można utworzyć pliku",
    "ERROR_CREATING_FILE"               : "Wystąpił błąd podczas próby utworzenia pliku <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} jeszcze nie działa w przeglądarce",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} został zbudowany przy pomocy HTML, jednak na razie działa jedynie jako samodzielna aplikacja. Możesz użyć jej do edycji plików na dysku. Aby uruchomić {APP_NAME} użyj aplikacji dostępnej w tym repozytorium <b>github.com/adobe/brackets-shell</b>.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Nie można zindeksować plików",
    "ERROR_MAX_FILES"                   : "Maksymalna liczba plików została zindeksowana. Aplikacja indeksująca może pracować nieprawidłowo.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Nie można otworzyć przeglądarki",
    "ERROR_CANT_FIND_CHROME"            : "Przeglądarka Google Chrome nie została znaleziona. Upewnij się, że jest zainstalowana.",
    "ERROR_LAUNCHING_BROWSER"           : "Wystąpił błąd przy próbie otwarcia przeglądarki. (błąd {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Błąd Błyskawicznego Podgląd",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Łączenie z przeglądarką",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "W celu włączenia Błyskawicznego Podglądu, Chrome musi zostać zrestartowany z włączonym zdalnym debugowaniem.<br /><br />Czy chcesz włączyć zdalne debugowanie i zrestartować Chrome?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Nie można wczytać strony Podglądu Błyskawicznego.",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "W celu użycia Podglądu Błyskawicznego otwórz plik HTML.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Aby uruchomić Podgląd Błyskawiczny na plikach serwerowych (np. plikach PHP) musisz podać adres dla tego projektu.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Błąd przy próbie zainicjowania serwera HTTP dla Podglądu błyskawicznego. Spróbuj ponownie.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Witaj w Podglądzie Błyskawicznym!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Podgląd Błyskawiczny podłączył {APP_NAME} do twojej przeglądarki. Pokazuje on twoją stronę HTML bezpośrednio w przeglądarce, oraz aktualizuje ją natychmiast po wprowadzeniu zmian w kodzie.<br /><br />W aktualnej wersji {APP_NAME}, Podgląd Błyskawiczny działa wyłącznie z <strong>Google Chrome</strong> i aktualizuje w czasie rzeczywistym <strong>pliki CSS</strong>. Zmiany w plikach HTML lub JavaScript są ładowane automatycznie po zapisaniu pliku.<br /><br />(Ta wiadomość wyświetla się tylko raz.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Więcej informacji znajdziesz w tym dokumencie <a href='{0}' title='{0}'>Rozwiązywanie problemów z Podglądem Błyskawicznym</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Podgląd Błyskawiczny",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Podgląd Błyskawiczny: Łączenie\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Podgląd Błyskawiczny: Inicjalizacja\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Rozłącz Podgląd Błyskawiczny",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Podgląd Błyskawiczny: Kliknij aby rozłączyć (Zapisz plik by zaktualizować)",
    
    "SAVE_CLOSE_TITLE"                  : "Zapisz zmiany",
    "SAVE_CLOSE_MESSAGE"                : "Czy chcesz zapisać zmiany w dokumencie <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Czy chcesz zapisać zmiany w następujących plikach?",
    "EXT_MODIFIED_TITLE"                : "Zmiany zewnętrzne",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> został zmodyfikowany na dysku, jednak zawiera też niezapisane zmiany w {APP_NAME}.<br /><br />Którą wersję chcesz zachować?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> został usunięty z dysku, jednak zawiera niezapisane zmiany w {APP_NAME}.<br /><br />Czy chcesz zachować zmiany?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Użyj składni /re/ dla wyszukiwania regexp",
    "FIND_RESULT_COUNT"                 : "{0} wyników",
    "WITH"                              : "Z",
    "BUTTON_YES"                        : "Tak",
    "BUTTON_NO"                         : "Nie",
    "BUTTON_STOP"                       : "Stop",

    "OPEN_FILE"                         : "Otwórz Plik",
    "CHOOSE_FOLDER"                     : "Wybierz Folder",

    "RELEASE_NOTES"                     : "Informacje o Wydaniu",
    "NO_UPDATE_TITLE"                   : "{APP_NAME} jest aktualny!",
    "NO_UPDATE_MESSAGE"                 : "Aktualnie używasz najnowszej wersji {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "dla \"{4}\" {5} - {0} {1} w {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "w <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "w projekcie",
    "FIND_IN_FILES_FILE"                : "plik",
    "FIND_IN_FILES_FILES"               : "pliki",
    "FIND_IN_FILES_MATCH"               : "dopasowanie",
    "FIND_IN_FILES_MATCHES"             : "dopasowania",
    "FIND_IN_FILES_MORE_THAN"           : "Więcej niż ",
    "FIND_IN_FILES_MAX"                 : " (pokaż pierwsze {0} wyników)",
    "FIND_IN_FILES_FILE_PATH"           : "Plik: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "linia:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Błąd pobierania wersji.",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Wystąpił problem podczas pobierania informacji o najnowszej wersji aplikacji. Upewnij się, że jeste podłączony do Internetu i spróbuj ponownie.",
    
    /**
     * ProjectManager
     */
    "PROJECT_LOADING" : "Ładowanie\u2026",
    "UNTITLED" : "Bez_nazwy",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Spacja",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Linia {0}, Kolumna {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Kliknij by zmienić wcięcia na spacje.",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Kliknij by zmienić wcięcia na tabulacje.",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Kliknij by zmienić ilość spacji we wcięciach",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Kliknij by zmienić szerokość tabulacji.",
    "STATUSBAR_SPACES"                      : "Spacje",
    "STATUSBAR_TAB_SIZE"                    : "Rozmiar Tabulacji",
    "STATUSBAR_LINE_COUNT"                  : "{0} Linii(e)",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Plik",
    "CMD_FILE_NEW"                        : "Nowy Plik",
    "CMD_FILE_NEW_FOLDER"                 : "Nowy Folder",
    "CMD_FILE_OPEN"                       : "Otwórz\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Dodaj do Folderu Roboczego",
    "CMD_OPEN_FOLDER"                     : "Otwórz Folder\u2026",
    "CMD_FILE_CLOSE"                      : "Zamknij",
    "CMD_FILE_CLOSE_ALL"                  : "Zamknij Wszystko",
    "CMD_FILE_SAVE"                       : "Zapisz",
    "CMD_FILE_SAVE_ALL"                   : "Zapisz Wszystko",
    "CMD_LIVE_FILE_PREVIEW"               : "Błyskawiczny podgląd",
    "CMD_LIVE_HIGHLIGHT"                  : "Błyskawiczne podwietlanie",
    "CMD_PROJECT_SETTINGS"                : "Ustawienia Projektu\u2026",
    "CMD_FILE_RENAME"                     : "Zmień nazwę",
    "CMD_INSTALL_EXTENSION"               : "Zainstaluj Rozszerzenie\u2026",
    "CMD_QUIT"                            : "Wyjdź",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Wyjdź",

    // Edit menu commands
    "EDIT_MENU"                           : "Edytuj",
    "CMD_UNDO"                            : "Cofnij",
    "CMD_REDO"                            : "Ponów",
    "CMD_CUT"                             : "Wytnij",
    "CMD_COPY"                            : "Kopiuj",
    "CMD_PASTE"                           : "Wklej",
    "CMD_SELECT_ALL"                      : "Zaznacz Wszystko",
    "CMD_SELECT_LINE"                     : "Zaznacz Linię",
    "CMD_FIND"                            : "Znajdź",
    "CMD_FIND_IN_FILES"                   : "Znajdź w Plikach",
    "CMD_FIND_IN_SUBTREE"                 : "Znajdź w\u2026",
    "CMD_FIND_NEXT"                       : "Znajdź Następny",
    "CMD_FIND_PREVIOUS"                   : "Znajdź Poprzedni",
    "CMD_REPLACE"                         : "Zamień",
    "CMD_INDENT"                          : "Wcięcie",
    "CMD_UNINDENT"                        : "Wsunięcie",
    "CMD_DUPLICATE"                       : "Powiel",
    "CMD_DELETE_LINES"                    : "Usuń Linię",
    "CMD_COMMENT"                         : "Utwórz Komentarz",
    "CMD_BLOCK_COMMENT"                   : "Utwórz Komentarz Blokowy",
    "CMD_LINE_UP"                         : "Przejdź Linię Wyżej",
    "CMD_LINE_DOWN"                       : "Przejdź Linię Niżej",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Zamykaj Nawiasy Automatycznie",
     
    // View menu commands
    "VIEW_MENU"                           : "Widok",
    "CMD_HIDE_SIDEBAR"                    : "Ukryj Pasek Boczny",
    "CMD_SHOW_SIDEBAR"                    : "Pokaż Pasek Boczny",
    "CMD_INCREASE_FONT_SIZE"              : "Zwiększ Czcionkę",
    "CMD_DECREASE_FONT_SIZE"              : "Zmniejsz Czcionkę",
    "CMD_RESTORE_FONT_SIZE"               : "Przywróć Domyślny Rozmiar Czcionki",
    "CMD_SCROLL_LINE_UP"                  : "Przewiń Linię Wyżej",
    "CMD_SCROLL_LINE_DOWN"                : "Przewiń Linię Niżej",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Numery Linii",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Podświetl Aktywną Linię",
    "CMD_TOGGLE_WORD_WRAP"                : "Zawijaj Wiersze",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Sortuj według Dodanych",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Sortuj według Nazwy",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Sortuj według Typu",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatyczne Sortowanie",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Nawigacja",
    "CMD_QUICK_OPEN"                      : "Szybkie Otwarcie",
    "CMD_GOTO_LINE"                       : "Skocz do Linii",
    "CMD_GOTO_DEFINITION"                 : "Skocz do Definicji",
    "CMD_TOGGLE_QUICK_EDIT"               : "Szybka Edycja",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Poprzedni Wynik",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Następny Wynik",
    "CMD_NEXT_DOC"                        : "Następny Dokument",
    "CMD_PREV_DOC"                        : "Poprzedni Dokument",
    "CMD_SHOW_IN_TREE"                    : "Pokaż w Drzewie Pliku",
    
    // Help menu commands
    "HELP_MENU"                           : "Pomoc",
    "CMD_CHECK_FOR_UPDATE"                : "Sprawdź dostępność aktualizacji",
    "CMD_HOW_TO_USE_BRACKETS"             : "Jak używać {APP_NAME}",
    "CMD_FORUM"                           : "Forum {APP_NAME}",
    "CMD_RELEASE_NOTES"                   : "Informacje o wydaniu",
    "CMD_REPORT_AN_ISSUE"                 : "Zgłoś Problem",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Pokaż Folder Rozszerzeń",
    "CMD_TWITTER"                         : "{TWITTER_NAME} na Twitterze",
    "CMD_ABOUT"                           : "O programie {APP_TITLE}",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Zamknij Okno",
    "CMD_ABORT_QUIT"                      : "Przerwij i Wyjdź",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "build eksperymentalny",
    "DEVELOPMENT_BUILD"                    : "build rozwojowy",
    "SEARCH_RESULTS"                       : "Wyniki Wyszukiwania",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Nie Zapisuj",
    "SAVE"                                 : "Zapisz",
    "CANCEL"                               : "Anuluj",
    "RELOAD_FROM_DISK"                     : "Załaduj Ponownie z Dysku",
    "KEEP_CHANGES_IN_EDITOR"               : "Zachowaj Zmiany w Edytorze",
    "CLOSE_DONT_SAVE"                      : "Zamknij (Nie Zapisuj)",
    "RELAUNCH_CHROME"                      : "Przeładuj Chrome",
    "INSTALL"                              : "Zainstaluj",
    "ABOUT"                                : "O programie",
    "CLOSE"                                : "Zamknij",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Adnotacje dotyczące warunków używania aplikacji firm trzecich znajdują się tutaj: <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> i zostały załączone jako odnośnik.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentacja i pliki żródłowe dostępne po adresem: <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Wykonano przy użyciu \u2764 i JavaScriptu przez:",
    "ABOUT_TEXT_LINE6"                     : "Mnóstwo ludzi (niestety mamy problem z załadowaniem pełnej listy w tym momencie).",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Dostępna jest nowa wersja aplikacji {APP_NAME}! Kliknij by dowiedzieć się więcej.",
    "UPDATE_AVAILABLE_TITLE"               : "Dostępna jest nowa wersja programu",
    "UPDATE_MESSAGE"                       : "Dostępna jest nowa wersja aplikacji {APP_NAME}. Oto kilka nowości w tej wersji:",
    "GET_IT_NOW"                           : "Ściągnij ją teraz!",
    "PROJECT_SETTINGS_TITLE"               : "Ustawienia Projektu: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Bazowy Adres URL Podglądu Błyskawicznego",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(aby użyć serwera lokalnego, podaj adres url)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Protokół {0} nie jest wspierany przez Podgląd Błyskawiczny&mdash;proszę użyć http: lub https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Adres URL nie może zawierać parametrów wyszukiwania takich jak \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Adres URL nie może zawierać znaku hash: \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Znaki specjalne takie jak '{0}' muszą zostać %-zakodowane.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Nieznany błąd podczas parsowania adresu URL.",
    
    // Extension Management strings
    "INSTALL_EXTENSION_TITLE"              : "Zainstaluj Rozszerzenie",
    "INSTALL_EXTENSION_LABEL"              : "Adres URL Rozszerzenia",
    "INSTALL_EXTENSION_HINT"               : "Adres URL do pliku zip lub repozytorium na GitHub dla rozszerzenia",
    "INSTALLING_FROM"                      : "Zainstaluj Rozszerzenie z {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Instalacja zakończona sukcesem.",
    "INSTALL_FAILED"                       : "Instalacja nie powiodła się.",
    "CANCELING_INSTALL"                    : "Anulowanie\u2026",
    "CANCELING_HUNG"                       : "Anulowanie instalacji trwa zbyt długo. Możliwe, że wystąpił błąd wewnętrzny.",
    "INSTALL_CANCELED"                     : "Instalacja anulowana.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Ściągnięty plik nie jest poprawnym plikiem zip.",
    "INVALID_PACKAGE_JSON"                 : "Niepoprawny plik package.json (Wystąpił błąd: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Plik package.json nie zawiera nazwy pakietu.",
    "BAD_PACKAGE_NAME"                     : "{0} jest niepoprawną nazwą pakietu.",
    "MISSING_PACKAGE_VERSION"              : "Plik package.json nie zawiera numeru wersji pakietu.",
    "INVALID_VERSION_NUMBER"               : "Numer wersji pakietu ({0}) jest niepoprawny.",
    "API_NOT_COMPATIBLE"                   : "Rozszerzenie nie jest kompatybilne z tą wersją {APP_NAME}. Rozszerzenie zostanie zainstalowane w folderze rozszerzeń nieaktywnych.",
    "MISSING_MAIN"                         : "Pakiet nie zawiera pliku main.js.",
    "ALREADY_INSTALLED"                    : "Rozszerzenie z taką samą nazwą jest już zainstalowane. Nowe rozszerzenie zostanie zainstalowane w folderze rozszerzeń nieaktywnych.",
    "DOWNLOAD_ID_IN_USE"                   : "Błąd wewnętrzny: nazwa ściąganego pliku już istnieje.",
    "NO_SERVER_RESPONSE"                   : "Nie można połączyć z serwerem.",
    "BAD_HTTP_STATUS"                      : "Nie znaleziono pliku na serwerze (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Nie można zapisać ściagniętego pliku w folderze tymczasowym.",
    "ERROR_LOADING"                        : "Rozszerzenie napotkało błąd podczas startu.",
    "MALFORMED_URL"                        : "Niepoprawny adres URL. Proszę sprawdzić czy został wprowadzony poprawny adres.",
    "UNSUPPORTED_PROTOCOL"                 : "Adres URL musi zaczynać się od http lub https.",
    "UNKNOWN_ERROR"                        : "Nieznany błąd wewnętrzny.",
    // For NOT_FOUND_ERR, see generic strings above
    
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debuguj",
    "CMD_SHOW_DEV_TOOLS"                        : "Pokaż Narzędzia Developera",
    "CMD_REFRESH_WINDOW"                        : "Przeładuj {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nowe Okno {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Zmień Język",
    "CMD_RUN_UNIT_TESTS"                        : "Uruchom Test",
    "CMD_SHOW_PERF_DATA"                        : "Pokaż Informacje o Wydajności",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Włącz Debugger Node",
    "CMD_LOG_NODE_STATE"                        : "Loguj Stan Node do Konsoli",
    "CMD_RESTART_NODE"                          : "Zrestartuj Node",
    
    "LANGUAGE_TITLE"                            : "Zmień Język",
    "LANGUAGE_MESSAGE"                          : "Wybierz język z poniższej listy:",
    "LANGUAGE_SUBMIT"                           : "Zrestartuj {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Anuluj",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Aktualny Kolor",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Kolor Oryginalny",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Format RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Format Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Format HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Użyto {1} raz)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Użyto {1} razy)",
    
    // extensions/default/JSLint
    "CMD_JSLINT"                                : "Włącz JSLint",
    "CMD_JSLINT_FIRST_ERROR"                    : "Skocz do Pierwszego Błędu JSLint",
    "JSLINT_ERRORS"                             : "Błędy JSLint",
    "JSLINT_ERROR_INFORMATION"                  : "1 Błąd JSLint",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} Błędy(ów) JSLint",
    "JSLINT_NO_ERRORS"                          : "Dobra robota! Brak błędów JSLint",
    "JSLINT_DISABLED"                           : "JSLint wyłączony lub nie działa dla aktualnego pliku"
});
