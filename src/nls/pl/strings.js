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
    "GENERIC_ERROR"                     : "(błąd {0})",
    "NOT_FOUND_ERR"                     : "Nie znaleziono pliku.",
    "NOT_READABLE_ERR"                  : "Nie można odczytać pliku.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Nie można zmienić folderu docelowego.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Brak pozwolenia na modyfikację.",
    "CONTENTS_MODIFIED_ERR"             : "Plik został zmodyfikowany z zewnątrz.",
    "UNSUPPORTED_ENCODING_ERR"          : "Ten plik nie jest w stronie kodowej UTF-8.",
    "FILE_EXISTS_ERR"                   : "Plik już istnieje.",
    "FILE"                              : "plik",
    "DIRECTORY"                         : "folder",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Wystąpił błąd podczas ładowania projektu.",
    "OPEN_DIALOG_ERROR"                 : "Wystąpił błąd podczas wyświetlania okna otwierania pliku. (błąd {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Wystąpił błąd przy próbie otwarcia katalogu <span class='dialog-filename'>{0}</span>. (błąd {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Wystąpił błąd podczas odczytu zawartości katalogu <span class='dialog-filename'>{0}</span>. (błąd {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Błąd podczas otwierania pliku",
    "ERROR_OPENING_FILE"                : "Wystąpił błąd podczas próby otwarcia pliku <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Podczas otwierania plików wystąpił błąd:",
    "ERROR_RELOADING_FILE_TITLE"        : "Błąd przy próbie ponownego załadowania pliku z dysku",
    "ERROR_RELOADING_FILE"              : "Wystąpił błąd podczas próby ponownego załadowania pliku. <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Nie można zapisać pliku",
    "ERROR_SAVING_FILE"                 : "Wystąpił błąd podczas próby zapisu pliku <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Nie można zmienić nazwy",
    "ERROR_RENAMING_FILE"               : "Wystąpił błąd podczas próby zmiany nazwy pliku <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Błąd przy usuwaniu pliku",
    "ERROR_DELETING_FILE"               : "Podczas usuwania pliku <span class='dialog-filename'>{0}</span> wystąpił błąd: {1}",
    "INVALID_FILENAME_TITLE"            : "Niewłaściwa nazwa pliku",
    "INVALID_FILENAME_MESSAGE"          : "Nazwa pliku nie może zawierać następujących znaków: {0}",
    "ERROR_CREATING_FILE_TITLE"         : "Nie można utworzyć pliku",
    "ERROR_CREATING_FILE"               : "Wystąpił błąd podczas próby utworzenia pliku <span class='dialog-filename'>{0}</span>. {1}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Błąd odczytu ustawień",
    "ERROR_PREFS_CORRUPT"               : "Twój plik ustawień nie jest poprawnym plikiem JSON. Zostanie on teraz otwarty w edytorze celem poprawienia błędów. Po poprawkach uruchom ponownie {APP_NAME}, aby zastosować zmiany.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} jeszcze nie działa w przeglądarce",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} został zbudowany przy pomocy HTML, jednak na razie działa jedynie jako samodzielna aplikacja. Możesz użyć jej do edycji plików na dysku. Aby uruchomić {APP_NAME} użyj aplikacji dostępnej w tym repozytorium <b>github.com/adobe/brackets-shell</b>.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Nie można zindeksować plików",
    "ERROR_MAX_FILES"                   : "Maksymalna liczba plików została zindeksowana. Aplikacja indeksująca może pracować nieprawidłowo.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Nie można otworzyć przeglądarki",
    "ERROR_CANT_FIND_CHROME"            : "Nie znaleziono przeglądarki Chrome. Upewnij się, że jest zainstalowana.",
    "ERROR_LAUNCHING_BROWSER"           : "Wystąpił błąd przy próbie otwarcia przeglądarki. (błąd {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Błąd",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Łączenie z przeglądarką",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "W celu włączenia błyskawicznego podglądu, Chrome musi zostać zrestartowany z włączonym zdalnym debugowaniem.<br /><br />Czy chcesz włączyć zdalne debugowanie i zrestartować Chrome?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Nie można wczytać strony podglądu błyskawicznego.",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "W celu użycia podglądu błyskawicznego otwórz plik HTML.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Aby uruchomić podgląd błyskawiczny na plikach serwerowych (np. plikach PHP) musisz podać adres dla tego projektu.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Błąd przy próbie uruchomienia serwera HTTP dla podglądu błyskawicznego. Spróbuj ponownie.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Witaj w podglądzie błyskawicznym!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Podgląd błyskawiczny podłączył {APP_NAME} do twojej przeglądarki. Pokazuje on twoją stronę HTML bezpośrednio w&nbsp;przeglądarce, oraz aktualizuje ją natychmiast po wprowadzeniu zmian w&nbsp;kodzie.<br /><br />W aktualnej wersji {APP_NAME}, podgląd błyskawiczny działa wyłącznie z&nbsp;<strong>Google Chrome</strong> i&nbsp;aktualizuje w czasie rzeczywistym <strong>pliki CSS</strong>. Zmiany w plikach HTML lub JavaScript są ładowane automatycznie po zapisaniu pliku.<br /><br />(Ta wiadomość wyświetla się tylko raz)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Więcej informacji znajdziesz w tym dokumencie <a href='{0}' title='{0}'>Rozwiązywanie problemów z podglądem błyskawicznym</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Podgląd błyskawiczny",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Podgląd błyskawiczny: łączenie\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Podgląd błyskawiczny: uruchamianie\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Rozłącz podgląd błyskawiczny",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Podgląd błyskawiczny: Kliknij aby rozłączyć (Zapisz plik by zaktualizować)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Podgląd błyskawiczny (nieaktualizowany z powodu błędów składniowych)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Błyskawiczny podgląd został anulowany, ponieważ narzędzia deweloperskie przeglądarki były uruchomione",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Błyskawiczny podgląd został anulowany, ponieważ strona w przeglądarce została zamknięta",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Błyskawiczny podgląd został anulowany, ponieważ przeglądarka odwiedziłą link, który nie należy do aktualnego projektu",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Błyskawiczny podgląd został anulowany ({0})",

    "SAVE_CLOSE_TITLE"                  : "Zapisz zmiany",
    "SAVE_CLOSE_MESSAGE"                : "Czy chcesz zapisać zmiany w dokumencie <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Czy chcesz zapisać zmiany w następujących plikach?",
    "EXT_MODIFIED_TITLE"                : "Zmiany zewnętrzne",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Potwierdź usunięcie",
    "CONFIRM_FOLDER_DELETE"             : "Czy na pewno usunąć folder <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Usunięto",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> został zmodyfikowany na dysku.<br /><br />Czy chcesz nadpisać plik obecnie otwartą wersją?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> został zmodyfikowany na dysku, jednak zawiera też niezapisane zmiany w {APP_NAME}.<br /><br />Którą wersję chcesz zachować?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> został usunięty z dysku, jednak zawiera niezapisane zmiany w {APP_NAME}.<br /><br />Czy chcesz zachować zmiany?",

    // Generic dialog/button labels
    "OK"                                : "OK",
    "CANCEL"                            : "Anuluj",
    "DONT_SAVE"                         : "Nie zapisuj",
    "SAVE"                              : "Zapisz",
    "SAVE_AS"                           : "Zapisz jako…",
    "SAVE_AND_OVERWRITE"                : "Nadpisz",
    "DELETE"                            : "Usuń",
    "BUTTON_YES"                        : "Tak",
    "BUTTON_NO"                         : "Nie",

    // Find, Replace, Find in Files
    "FIND_NO_RESULTS"                   : "Brak wyników",
    "FIND_QUERY_PLACEHOLDER"            : "Znajdź\u2026",
    "REPLACE_PLACEHOLDER"               : "Zamień na\u2026",
    "BUTTON_REPLACE_ALL"                : "Wszystko\u2026",
    "BUTTON_REPLACE"                    : "Zamień",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Następny",
    "BUTTON_PREV_HINT"                  : "Poprzedni",
    "BUTTON_CASESENSITIVE_HINT"         : "Rozróżniaj wielkie i małe litery",
    "BUTTON_REGEXP_HINT"                : "Wyrażenie regularne",

    "OPEN_FILE"                         : "Otwórz plik",
    "SAVE_FILE_AS"                      : "Zapisz plik",
    "CHOOSE_FOLDER"                     : "Wybierz folder",

    "RELEASE_NOTES"                     : "Informacje o wydaniu",
    "NO_UPDATE_TITLE"                   : "{APP_NAME} jest aktualny!",
    "NO_UPDATE_MESSAGE"                 : "Aktualnie używasz najnowszej wersji {APP_NAME}.",

    // Find in Files
    "FIND_IN_FILES_SCOPED"              : "w <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "w projekcie",
    "FIND_IN_FILES_ZERO_FILES"                  : "Filtr wyklucza wszystkie pliki {0}",
    "FIND_IN_FILES_FILE"                : "plik",
    "FIND_IN_FILES_FILES"               : "pliki",
    "FIND_IN_FILES_MATCH"               : "dopasowanie",
    "FIND_IN_FILES_MATCHES"             : "dopasowania",
    "FIND_IN_FILES_MORE_THAN"           : "Więcej niż ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "Plik: <span class='dialog-filename'>{0}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Kliknij w Ctrl/Cmd aby (ro)zwinąć wszystkie",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Błąd pobierania wersji.",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Wystąpił problem podczas pobierania informacji o najnowszej wersji aplikacji. Upewnij się, że jesteś podłączony do Internetu i spróbuj ponownie.",

    // File exclusion filters
    "NO_FILE_FILTER"                    : "Filtruj…",
    "EDIT_FILE_FILTER"                  : "Edytuj…",
    "FILE_FILTER_DIALOG"                : "Edytuj filtr",
    "FILE_FILTER_INSTRUCTIONS"          : "Możesz odrzucić pliki o nazwach pasujących do poniższych wzorów lub <a href='{0}' title='{0}'>masek</a>. Każdą regułę umieść w osobnej linii.",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "i {0} więcej",
    "FILTER_COUNTING_FILES"             : "Kalkulowanie…",
    "FILTER_FILE_COUNT"                 : "Przeszukane zostanie {0} z {1} plików {2}",
    "FILTER_FILE_COUNT_ALL"             : "Przeszukane zostanie wszystkie {0} plików {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"       : "Nie można użyć Szybkiej edycji w tym miejscu",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"         : "Szybka edycja CSS: umieść kursor na nazwie klasy",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"          : "Szybka edycja CSS: nieprawidłowa klasa",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"             : "Szybka edycja CSS: nieprawidłowy identyfikator",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"        : "Szybka edycja CSS: umieść kursor na nazwie znacznika, klasy lub identyfikatora",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"       : "Szybka edycja CSS: nieprawidłowa składnia funkcji czasu",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"        : "Szybka edycja JS: umieść kursor na nazwie funkcji",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"       : "Nie znaleziono dokumentacji dla bieżącego miejsca.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"                   : "Ładowanie\u2026",
    "UNTITLED"                          : "Bez_nazwy",
    "WORKING_FILES"                     : "Otwarte pliki",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Spacja",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "linia {0}, kolumna {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Zaznaczono {0} kolumnę",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Zaznaczono {0} kolumn",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Zaznaczono {0} linię",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Zaznaczono {0} linii",
    "STATUSBAR_SELECTION_MULTIPLE"          : " — {0} zaznaczeń",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Kliknij, by zmienić wcięcia na spacje.",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Kliknij, by zmienić wcięcia na tabulacje.",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Kliknij, by zmienić ilość spacji we wcięciach",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Kliknij, by zmienić szerokość tabulacji.",
    "STATUSBAR_SPACES"                      : "Spacje",
    "STATUSBAR_TAB_SIZE"                    : "Tabulacje",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} linia",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} linii",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Rozszerzenia wyłączone",
    "STATUSBAR_INSERT"                      : "WST",
    "STATUSBAR_OVERWRITE"                   : "ZAS",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} problemów",
    "SINGLE_ERROR"                          : "1 błąd {0}",
    "MULTIPLE_ERRORS"                       : "{1} błędów {0} ",
    "NO_ERRORS"                             : "Brak błędów – dobra robota!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Brak problemów!",
    "LINT_DISABLED"                         : "Sprawdzanie poprawności jest wyłączone.",
    "NO_LINT_AVAILABLE"                     : "Nie wiem czym sprawdzić poprawność {0}",
    "NOTHING_TO_LINT"                       : "Brak plików do sprawdzenia.",
    "LINTER_TIMED_OUT"                      : "{0} kminił za długo: {1} ms",
    "LINTER_FAILED"                         : "{0} rzucił błędem: {1}",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Plik",
    "CMD_FILE_NEW_UNTITLED"               : "Nowy",
    "CMD_FILE_NEW"                        : "Nowy plik",
    "CMD_FILE_NEW_FOLDER"                 : "Nowy folder",
    "CMD_FILE_OPEN"                       : "Otwórz\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Dodaj do folderu robocze",
    "CMD_OPEN_DROPPED_FILES"              : "Otwórz przeciągnięte pliki",
    "CMD_OPEN_FOLDER"                     : "Otwórz folder\u2026",
    "CMD_FILE_CLOSE"                      : "Zamknij",
    "CMD_FILE_CLOSE_ALL"                  : "Zamknij wszystko",
    "CMD_FILE_CLOSE_LIST"                 : "Zamknij listę",
    "CMD_FILE_CLOSE_OTHERS"               : "Zamknij inne",
    "CMD_FILE_CLOSE_ABOVE"                : "Zamknij pliki powyżej",
    "CMD_FILE_CLOSE_BELOW"                : "Zamknij pliki poniżej",
    "CMD_FILE_SAVE"                       : "Zapisz",
    "CMD_FILE_SAVE_ALL"                   : "Zapisz wszystko",
    "CMD_FILE_SAVE_AS"                    : "Zapisz jako\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Błyskawiczny podgląd",
    "CMD_PROJECT_SETTINGS"                : "Ustawienia projektu\u2026",
    "CMD_FILE_RENAME"                     : "Zmień nazwę",
    "CMD_FILE_DELETE"                     : "Usuń",
    "CMD_INSTALL_EXTENSION"               : "Zainstaluj rozszerzenie\u2026",
    "CMD_EXTENSION_MANAGER"               : "Menedżer rozszerzeń\u2026",
    "CMD_FILE_REFRESH"                    : "Odśwież",
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
    "CMD_SELECT_ALL"                      : "Zaznacz wszystko",
    "CMD_SELECT_LINE"                     : "Zaznacz linię",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Podziel zaznaczenie na linie",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Rozszerz kursor na linię niżej",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Rozszerz kursor na linię wyżej",
    "CMD_INDENT"                          : "Zwiększ wcięcie",
    "CMD_UNINDENT"                        : "Zmniejsz wcięcie",
    "CMD_DUPLICATE"                       : "Powiel",
    "CMD_DELETE_LINES"                    : "Usuń linię",
    "CMD_COMMENT"                         : "Utwórz komentarz",
    "CMD_BLOCK_COMMENT"                   : "Utwórz komentarz blokowy",
    "CMD_LINE_UP"                         : "Przejdź linię wyżej",
    "CMD_LINE_DOWN"                       : "Przejdź linię niżej",
    "CMD_OPEN_LINE_ABOVE"                 : "Otwórz linię wyżej",
    "CMD_OPEN_LINE_BELOW"                 : "Otwórz linię niżej",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Automatycznie zamykaj nawiasy",
    "CMD_SHOW_CODE_HINTS"                 : "Pokaż podpowiedzi",

    // Search menu commands
    "FIND_MENU"                           : "Find",
    "CMD_FIND"                            : "Znajdź",
    "CMD_FIND_NEXT"                       : "Znajdź następny",
    "CMD_FIND_PREVIOUS"                   : "Znajdź poprzedni",
    "CMD_FIND_ALL_AND_SELECT"             : "Zaznacz wszystkie wystapienia",
    "CMD_ADD_NEXT_MATCH"                  : "Dodaj nastepny do zaznaczenia",
    "CMD_SKIP_CURRENT_MATCH"              : "Pomiń i dodaj następny",
    "CMD_FIND_IN_FILES"                   : "Znajdź w plikach",
    "CMD_FIND_IN_SUBTREE"                 : "Znajdź\u2026",
    "CMD_REPLACE"                         : "Zamień",

    // View menu commands
    "VIEW_MENU"                           : "Widok",
    "CMD_HIDE_SIDEBAR"                    : "Ukryj pasek boczny",
    "CMD_SHOW_SIDEBAR"                    : "Pokaż pasek boczny",
    "CMD_INCREASE_FONT_SIZE"              : "Zwiększ czcionkę",
    "CMD_DECREASE_FONT_SIZE"              : "Zmniejsz czcionkę",
    "CMD_RESTORE_FONT_SIZE"               : "Przywróć domyślny rozmiar czcionki",
    "CMD_SCROLL_LINE_UP"                  : "Przewiń linię wyżej",
    "CMD_SCROLL_LINE_DOWN"                : "Przewiń linię niżej",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Numery linii",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Podświetl bieżącą linię",
    "CMD_TOGGLE_WORD_WRAP"                : "Zawijaj wiersze",
    "CMD_LIVE_HIGHLIGHT"                  : "Podświetlanie przy podglądzie błyskawicznym",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Sprawdzaj poprawność przy zapisywaniu",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Sortuj według dodanych",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Sortuj według nazwy",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Sortuj według typu",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Automatyczne sortowanie",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Nawigacja",
    "CMD_QUICK_OPEN"                      : "Szybkie otwarcie",
    "CMD_GOTO_LINE"                       : "Idź do linii",
    "CMD_GOTO_DEFINITION"                 : "Idź do definicji",
    "CMD_GOTO_FIRST_PROBLEM"              : "Idź do pierwszego błędu",
    "CMD_TOGGLE_QUICK_EDIT"               : "Szybka edycja",
    "CMD_TOGGLE_QUICK_DOCS"               : "Szybka dokumentacja",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Poprzedni wynik",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Następny wynik",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Nowa reguła",
    "CMD_NEXT_DOC"                        : "Następny dokument",
    "CMD_PREV_DOC"                        : "Poprzedni dokument",
    "CMD_SHOW_IN_TREE"                    : "Pokaż w drzewie katalogów",
    "CMD_SHOW_IN_EXPLORER"                : "Pokaż w Eksploratorze",
    "CMD_SHOW_IN_FINDER"                  : "Pokaż w Finderze",
    "CMD_SHOW_IN_OS"                      : "Pokaż w systemie plików",

    // Help menu commands
    "HELP_MENU"                           : "Pomoc",
    "CMD_CHECK_FOR_UPDATE"                : "Sprawdź aktualizacje",
    "CMD_HOW_TO_USE_BRACKETS"             : "Jak używać {APP_NAME}",
    "CMD_SUPPORT"                         : "Wsparcie {APP_NAME}",
    "CMD_SUGGEST"                         : "Zarzuć pomysłem",
    "CMD_RELEASE_NOTES"                   : "Informacje o wydaniu",
    "CMD_GET_INVOLVED"                    : "Zaangażuj się…",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Pokaż folder rozszerzeń",
    "CMD_TWITTER"                         : "{TWITTER_NAME} na Twitterze",
    "CMD_ABOUT"                           : "O programie {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Otwórz plik ustawień",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "build eksperymentalny",
    "DEVELOPMENT_BUILD"                    : "build rozwojowy",
    "RELOAD_FROM_DISK"                     : "Załaduj ponownie z dysku",
    "KEEP_CHANGES_IN_EDITOR"               : "Zachowaj zmiany w edytorze",
    "CLOSE_DONT_SAVE"                      : "Zamknij (Nie Zapisuj)",
    "RELAUNCH_CHROME"                      : "Zrestartuj Chrome",
    "ABOUT"                                : "O programie",
    "CLOSE"                                : "Zamknij",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Adnotacje dotyczące warunków używania aplikacji firm trzecich znajdują się tutaj: <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> i zostały załączone jako odnośnik.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentacja i pliki żródłowe dostępne po adresem: <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Wykonali z \u2764 i JavaScript:",
    "ABOUT_TEXT_LINE6"                     : "Mnóstwo ludzi (niestety mamy problem z załadowaniem pełnej listy w tym momencie).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Dokumentacja Web Platform oraz logo Web Platform są rozpowszechniane na zasadach licencji Creative Commons Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Dostępna jest nowa wersja aplikacji {APP_NAME}! Kliknij by dowiedzieć się więcej.",
    "UPDATE_AVAILABLE_TITLE"               : "Dostępna jest nowa wersja programu",
    "UPDATE_MESSAGE"                       : "Dostępna jest nowa wersja aplikacji {APP_NAME}. Oto kilka nowości w tej wersji:",
    "GET_IT_NOW"                           : "Ściągnij ją teraz!",
    "PROJECT_SETTINGS_TITLE"               : "Ustawienia projektu {0}",
    "PROJECT_SETTING_BASE_URL"             : "Adres podglądu",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(aby użyć serwera lokalnego, podaj URL)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Protokół {0} nie jest wspierany przez podgląd błyskawiczny&mdash;proszę użyć http: lub https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Adres URL nie może zawierać parametrów wyszukiwania takich jak \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Adres URL nie może zawierać znaku hash: \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Znaki specjalne takie jak '{0}' muszą zostać %-zakodowane.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Nieznany błąd podczas parsowania adresu URL.",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Nowa reguła",

    // Extension Management strings
    "INSTALL"                              : "Zainstaluj",
    "UPDATE"                               : "Aktualizuj",
    "REMOVE"                               : "Usuń",
    "OVERWRITE"                            : "Nadpisz",
    "CANT_REMOVE_DEV"                      : "Rozszerzenia w folderze „dev” muszą być usunięte ręcznie.",
    "CANT_UPDATE"                          : "Ta aktualizacja nie jest kompatybilna z tą wersją {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Rozszerzenia w folderze \"dev\" nie są automatycznie aktualizowane.",
    "INSTALL_EXTENSION_TITLE"              : "Zainstaluj rozszerzenie",
    "UPDATE_EXTENSION_TITLE"               : "Aktualizuj rozszerzenie",
    "INSTALL_EXTENSION_LABEL"              : "Adres URL rozszerzenia",
    "INSTALL_EXTENSION_HINT"               : "Adres URL do pliku ZIP lub repozytorium na GitHub dla rozszerzenia",
    "INSTALLING_FROM"                      : "Zainstaluj rozszerzenie z {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Instalacja zakończona sukcesem.",
    "INSTALL_FAILED"                       : "Instalacja nie powiodła się.",
    "CANCELING_INSTALL"                    : "Anulowanie\u2026",
    "CANCELING_HUNG"                       : "Anulowanie instalacji trwa zbyt długo. Możliwe, że wystąpił błąd wewnętrzny.",
    "INSTALL_CANCELED"                     : "Instalacja anulowana.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Ściągnięty plik nie jest poprawnym plikiem ZIP.",
    "INVALID_PACKAGE_JSON"                 : "Niepoprawny plik package.json (Wystąpił błąd: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Plik package.json nie zawiera nazwy pakietu.",
    "BAD_PACKAGE_NAME"                     : "{0} jest niepoprawną nazwą pakietu.",
    "MISSING_PACKAGE_VERSION"              : "Plik package.json nie zawiera numeru wersji pakietu.",
    "INVALID_VERSION_NUMBER"               : "Numer wersji pakietu ({0}) jest niepoprawny.",
    "INVALID_BRACKETS_VERSION"             : "Ciąg kompatybilności z {APP_NAME} ({0}) jest nieprawidłowy.",
    "DISALLOWED_WORDS"                     : "Słowo „{1}” jest niedozwolony w polu {0}.",
    "API_NOT_COMPATIBLE"                   : "Rozszerzenie nie jest kompatybilne z tą wersją {APP_NAME}. Rozszerzenie zostanie zainstalowane w folderze rozszerzeń nieaktywnych.",
    "MISSING_MAIN"                         : "Pakiet nie zawiera pliku main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Instalowanie tego rozszerzenia nadpisze poprzednio zainstalowany pakiet - kontynuować?",
    "EXTENSION_SAME_VERSION"               : "To rozszerzenie jest w tej samej wersji jak obecnie zainstalowane – nadpisać?",
    "EXTENSION_OLDER_VERSION"              : "To rozszerzenie jest w starszej wersji {0} – ({1}) - zaktualizować?",
    "DOWNLOAD_ID_IN_USE"                   : "Błąd wewnętrzny: taki plik już istnieje.",
    "NO_SERVER_RESPONSE"                   : "Nie można połączyć z serwerem.",
    "BAD_HTTP_STATUS"                      : "Nie znaleziono pliku na serwerze (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Nie można zapisać ściagniętego pliku w folderze tymczasowym.",
    "ERROR_LOADING"                        : "Rozszerzenie napotkało błąd podczas startu.",
    "MALFORMED_URL"                        : "Niepoprawny adres URL, sprawdź to.",
    "UNSUPPORTED_PROTOCOL"                 : "Adres URL musi zaczynać się od http lub https.",
    "UNKNOWN_ERROR"                        : "Nieznany błąd wewnętrzny.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Menedżer rozszerzeń",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Nie udało się dostać do rejestru wtyczek.",
    "INSTALL_FROM_URL"                     : "Zainstaluj z adresu\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Data",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "To rozszerzenie wymaga nowszej wersji {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "To rozszerzenie działa tylko ze starszą wersją {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Wersja {0} wymaga nowszej wersji {APP_NAME}, ale możesz zainstalować starszą wersję rozszerzenia - {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Wersja {0} wymaga starszej wersji {APP_NAME}, ale możesz zainstalować wcześniejszą wersję - {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Brak opisu",
    "EXTENSION_MORE_INFO"                  : "Więcej...",
    "EXTENSION_ERROR"                      : "Błąd rozszerzenia",
    "EXTENSION_KEYWORDS"                   : "Słowa kluczowe",
    "EXTENSION_INSTALLED"                  : "Zainstalowane",
    "EXTENSION_UPDATE_INSTALLED"           : "Aktualizacja jest pobrana i zostanie zainstalowana po wyłączeniu {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Szukaj",
    "EXTENSION_MORE_INFO_LINK"             : "Więcej",
    "BROWSE_EXTENSIONS"                    : "Przeglądaj rozszerzenia",
    "EXTENSION_MANAGER_REMOVE"             : "Usuń rozszerzenie",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Nie udało się usunąć rozszerzeń: {0}. {APP_NAME} zamknie się.",
    "EXTENSION_MANAGER_UPDATE"             : "Zaktualizuj rozszerzenie",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Nie udało się zaktualizować rozszerzeń: {0}. {APP_NAME} zamknie się.",
    "MARKED_FOR_REMOVAL"                   : "Zaznaczono do usunięcia",
    "UNDO_REMOVE"                          : "Cofnij",
    "MARKED_FOR_UPDATE"                    : "Zaznaczono do aktualizacji",
    "UNDO_UPDATE"                          : "Cofnij",
    "CHANGE_AND_RELOAD_TITLE"              : "Rozszerzenia",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Aby Słowo stało się ciałem, {APP_NAME} musi zostać ponownie uruchomiony. Czy chcesz tego dokonać teraz?",
    "REMOVE_AND_RELOAD"                    : "Usuń i zrestartuj",
    "CHANGE_AND_RELOAD"                    : "OK",
    "UPDATE_AND_RELOAD"                    : "Zaktualizuj i zrestartuj",
    "PROCESSING_EXTENSIONS"                : "Przetwarzanie…",
    "EXTENSION_NOT_INSTALLED"              : "Nie można było usunąć rozszerzenia {0}, ponieważ nie było zainstalowane.",
    "NO_EXTENSIONS"                        : "Żadne rozszerzenia nie są jeszcze zainstalowane.<br>Przejdź na kartę „Dostępne”, aby zobaczyć listę dostępnych rozszerzeń.",
    "NO_EXTENSION_MATCHES"                 : "Nie znaleziono żadnych wyników.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Bądź ostrożny, instalując rozszerzenia z nieznanych źródeł.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Zainstalowane",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Dostępne",
    "EXTENSIONS_UPDATES_TITLE"             : "Aktualizacja",

    "INLINE_EDITOR_NO_MATCHES"             : "Brak wyników.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Brak reguł.<br> Kliknij „New Rule”, aby utworzyć regułę.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Nie ma w tym projekcie arkuszy stylów.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"                 : "największy",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pikseli",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                           : "Debuguj",
    "ERRORS"                               : "Errors",
    "CMD_SHOW_DEV_TOOLS"                   : "Pokaż narzędzia dewelopera",
    "CMD_REFRESH_WINDOW"                   : "Uruchom ponownie {APP_NAME}",
    "CMD_RELOAD_WITHOUT_USER_EXTS"         : "Uruchom ponownie (bez rozszerzeń)    ",
    "CMD_NEW_BRACKETS_WINDOW"              : "Nowe okno",
    "CMD_SWITCH_LANGUAGE"                  : "Zmień język",
    "CMD_RUN_UNIT_TESTS"                   : "Uruchom test",
    "CMD_SHOW_PERF_DATA"                   : "Pokaż informacje o wydajności",
    "CMD_ENABLE_NODE_DEBUGGER"             : "Włącz debugger Node",
    "CMD_LOG_NODE_STATE"                   : "Zapisz stan Node do Konsoli",
    "CMD_RESTART_NODE"                     : "Zrestartuj Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"        : "Show Errors in Status Bar",

    "LANGUAGE_TITLE"                       : "Zmień język",
    "LANGUAGE_MESSAGE"                     : "Wybierz język z poniższej listy:",
    "LANGUAGE_SUBMIT"                      : "Zrestartuj {APP_NAME}",
    "LANGUAGE_CANCEL"                      : "Anuluj",
    "LANGUAGE_SYSTEM_DEFAULT"              : "domyślny",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Czas",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Postęp",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Przenieś zaznaczony punkt<br><kbd class='text'>Shift</kbd> Przenieś zaznaczony punkt o 10 jednostek<br><kbd class='text'>Tab</kbd> Zmień punkt",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Increase or decrease steps<br><kbd>←</kbd><kbd>→</kbd> 'Start' or 'End'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Obecna wartość <code>{0}</code> jest niepoprawna, więc została zamieniona na <code>{1}</code>.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Obecny kolor",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Kolor oryginalny",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Format RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Format Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Format HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Użyto {1} raz)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Użyto {1} razy)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Idź do definicji",
    "CMD_SHOW_PARAMETER_HINT"                   : "Podpowiedz paramety",
    "NO_ARGUMENTS"                              : "<brak parametrów>",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Podgląd po najechaniu",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Ostatnie projekty",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Czytaj więcej"
});

/* Last translated 143aac5dc44a3e285bb708870b41d1cd0e2b1a64 */
