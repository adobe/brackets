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
    "GENERIC_ERROR"                     : "(Fehler {0})",
    "NOT_FOUND_ERR"                     : "Die Datei konnte nicht gefunden werden.",
    "NOT_READABLE_ERR"                  : "Die Datei konnte nicht gelesen werden.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Das Ziel-Verzeichnis kann nicht verändert werden.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Die Berechtigungen erlauben Ihnen nicht, Veränderungen vorzunehmen.",
    "FILE_EXISTS_ERR"                   : "Die Datei existiert bereits.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Fehler beim Laden des Projekts",
    "OPEN_DIALOG_ERROR"                 : "Fehler beim Erstellen des Datei-Öffnen-Dialogs. (Fehler {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Fehler beim Lesen des Verzeichnisses <span class='dialog-filename'>{0}</span>. (Fehler {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Fehler beim Lesen der Verzeichnisinhalte von <span class='dialog-filename'>{0}</span>. (Fehler {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Fehler beim Öffnen der Datei",
    "ERROR_OPENING_FILE"                : "Beim Öffnen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Fehler beim Laden der Änderungen",
    "ERROR_RELOADING_FILE"              : "Beim Laden der Änderungen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Fehler beim Speichern der Datei",
    "ERROR_SAVING_FILE"                 : "Beim Speichern der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Fehler beim Umbenennen der Datei",
    "ERROR_RENAMING_FILE"               : "Beim Umbenennen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "INVALID_FILENAME_TITLE"            : "Ungültiger Dateiname",
    "INVALID_FILENAME_MESSAGE"          : "Dateinamen dürfen folgende Zeichen nicht enthalten: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "Die Datei <span class='dialog-filename'>{0}</span> existiert bereits.",
    "ERROR_CREATING_FILE_TITLE"         : "Fehler beim Erstellen der Datei",
    "ERROR_CREATING_FILE"               : "Beim Erstellen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} kann derzeit leider noch nicht im Browser ausgeführt werden.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} wurde in HTML programmiert, ist derzeit jedoch lediglich als Desktop-Anwendung verfügbar, um damit lokale Dateien zu bearbeiten. Bitte verwenden Sie die Anwendungs-Shell im Repo <b>github.com/adobe/brackets-shell</b>, um {APP_NAME} auszuführen.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Fehler beim Indizieren der Dateien",
    "ERROR_MAX_FILES"                   : "Die maximal mögliche Anzahl indizierbarer Dateien wurde überschritten. Funktionen, die auf dem Index beruhen, werden möglicherweise nicht korrekt ausgeführt.",
    
    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Fehler beim Starten des Browsers",
    "ERROR_CANT_FIND_CHROME"            : "Der Browser Google Chrome konnte nicht gefunden werden. Bitte stellen Sie sicher, dass er installiert ist.",
    "ERROR_LAUNCHING_BROWSER"           : "Beim Starten des Browsers ist ein Fehler aufgetreten. (Fehler {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Fehler bei der Live-Vorschau",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Verbinden zum Browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Um die Live-Vorschau zu verwenden, muss Chrome mit aktiviertem Remote-Debugging neu gestartet werden.<br /><br />Soll Chrome neu gestartet werden, um das Remote Debugger Protokoll zu aktivieren?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Öffnen Sie eine HTML-Datei, um die Live-Vorschau zu starten.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Zum Starten der Live-Vorschau mit einer serverseitigen Datei müssen Sie eine Basis-URL für dieses Projekt angeben..",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Willkommen bei der Live-Vorschau!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Die Live-Vorschau verbindet {APP_NAME} mit Ihrem Browser. Sie startet eine Vorschau Ihrer HTML-Datei im Browser, und aktualisiert die Vorschau dann sofort, wenn Sie Ihren Code bearbeiten.<br /><br />In dieser frühen Version von {APP_NAME} funktioniert die Live-Vorschau nur beim Bearbeiten von <strong>CSS-Dateien</strong> und nur mit <strong>Google Chrome</strong>. Wir werden sie bald für HTML und JavaScript implementieren!<br /><br />(Sie sehen diese Meldung nur einmal.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Weitere Informationen finden Sie unter dem Thema <a class=\"clickable-link\" data-href=\"{0}\">Fehlerbehebung bei Verbindungs-Fehlern der Live-Entwicklung</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live-Vorschau",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live-Vorschau: Verbinden\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live-Vorschau: Initialisieren\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Live-Vorschau trennen",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live-Vorschau: Klicken, um Verbindung zu trennen (Zum Aktualisieren Datei speichern)",
    
    "SAVE_CLOSE_TITLE"                  : "Änderungen speichern",
    "SAVE_CLOSE_MESSAGE"                : "Wollen Sie die Änderungen in dem Dokument <span class='dialog-filename'>{0}</span> speichern?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Wollen Sie Ihre Änderungen in den folgenden Dateien speichern?",
    "EXT_MODIFIED_TITLE"                : "Externe Änderungen",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> wurde extern geändert und hat ungespeicherte Änderungen in {APP_NAME}."
                                                + "<br /><br />"
                                                + "Welche Version wollen Sie weiter verwenden?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> wurde extern gelöscht und hat ungespeicherte Änderungen in {APP_NAME}."
                                                + "<br /><br />"
                                                + "Wollen Sie die Änderungen beibehalten?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "/re/-Syntax zum Suchen mit regulären Ausdrücken verwenden",
    "WITH"                              : "Mit",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nein",
    "BUTTON_STOP"                       : "Stopp",

    "OPEN_FILE"                         : "Datei öffnen",
    "CHOOSE_FOLDER"                     : "Ordner wählen",

    "RELEASE_NOTES"                     : "Release-Notes",
    "NO_UPDATE_TITLE"                   : "Sie sind auf dem Laufenden!",
    "NO_UPDATE_MESSAGE"                 : "Sie führen die neuste Version von {APP_NAME} aus.",
    
    "FIND_IN_FILES_TITLE"               : "für \"{4}\" {5} - {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "in Projekt",
    "FIND_IN_FILES_FILE"                : "Datei",
    "FIND_IN_FILES_FILES"               : "Dateien",
    "FIND_IN_FILES_MATCH"               : "Treffer",
    "FIND_IN_FILES_MATCHES"             : "Treffer",
    "FIND_IN_FILES_MORE_THAN"           : "Mehr als ",
    "FIND_IN_FILES_MAX"                 : " (die ersten {0} Treffer werden angezeigt)",
    "FIND_IN_FILES_FILE_PATH"           : "Datei: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "Zeile:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Fehler beim Abrufen der Update-Info",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Beim Abrufen der neusten Update-Informationen vom Server ist ein Problem aufgetreten. Bitte stellen Sie sicher, dass Sie mit dem Internet verbunden sind, und probieren Sie es erneut.",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "Sprache wechseln",
    "LANGUAGE_MESSAGE"                  : "Bitte wählen Sie die gewünschte Sprache aus der folgenden Liste aus:",
    "LANGUAGE_SUBMIT"                   : "{APP_NAME} neu starten",
    "LANGUAGE_CANCEL"                   : "Abbrechen",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Unbenannt",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Strg",
    "KEYBOARD_SHIFT"  : "Umschalt",
    "KEYBOARD_SPACE"  : "Leer",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Zeile {0}, Spalte {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klicken, um Einrückung auf Leerzeichen umzuschalten",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klicken, um Einrückung auf Tabs umzuschalten",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klicken, um die Anzahl Leerzeichen beim Einrücken zu ändern",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klicken, um die Schrittweite von Tabs zu ändern",
    "STATUSBAR_SPACES"                      : "Leerzeichen",
    "STATUSBAR_TAB_SIZE"                    : "Tab-Schrittweite",
    "STATUSBAR_LINE_COUNT"                  : "{0} Zeilen",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Datei",
    "CMD_FILE_NEW"                        : "Neu",
    "CMD_FILE_NEW_FOLDER"                 : "Neuer Ordner",
    "CMD_FILE_OPEN"                       : "Öffnen\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Zum Projekt hinzufügen",
    "CMD_OPEN_FOLDER"                     : "Ordner öffnen\u2026",
    "CMD_FILE_CLOSE"                      : "Schließen",
    "CMD_FILE_CLOSE_ALL"                  : "Alles schließen",
    "CMD_FILE_SAVE"                       : "Speichern",
    "CMD_FILE_SAVE_AS"                    : "Speichern unter\u2026",
    "CMD_FILE_SAVE_ALL"                   : "Alles speichern",
    "CMD_LIVE_FILE_PREVIEW"               : "Live-Vorschau",
    "CMD_FILE_RENAME"                     : "Umbenennen\u2026",
    "CMD_PROJECT_SETTINGS"                : "Projekt-Einstellungen\u2026",
    "CMD_QUIT"                            : "Beenden",

    // Edit menu commands
    "EDIT_MENU"                           : "Bearbeiten",
    "CMD_SELECT_ALL"                      : "Alles auswählen",
    "CMD_SELECT_LINE"                     : "Zeile auswählen",
    "CMD_FIND"                            : "Suchen",
    "CMD_FIND_IN_FILES"                   : "Im Projekt suchen",
    "CMD_FIND_IN_SUBTREE"                 : "Suchen in\u2026",
    "CMD_FIND_NEXT"                       : "Weitersuchen (vorwärts)",
    "CMD_FIND_PREVIOUS"                   : "Weitersuchen (rückwärts)",
    "CMD_REPLACE"                         : "Ersetzen",
    "CMD_INDENT"                          : "Einrücken",
    "CMD_UNINDENT"                        : "Ausrücken",
    "CMD_DUPLICATE"                       : "Duplizieren",
    "CMD_DELETE_LINES"                    : "Zeile löschen",
    "CMD_COMMENT"                         : "Zeile (aus-)kommentieren",
    "CMD_BLOCK_COMMENT"                   : "Block (aus-)kommentieren",
    "CMD_LINE_UP"                         : "Zeile nach oben verschieben",
    "CMD_LINE_DOWN"                       : "Zeile nach unten verschieben",
     
    // View menu commands
    "VIEW_MENU"                           : "Ansicht",
    "CMD_HIDE_SIDEBAR"                    : "Seitenleiste verbergen",
    "CMD_SHOW_SIDEBAR"                    : "Seitenleiste zeigen",
    "CMD_INCREASE_FONT_SIZE"              : "Schriftart vergrößern",
    "CMD_DECREASE_FONT_SIZE"              : "Schriftart verkleinern",
    "CMD_RESTORE_FONT_SIZE"               : "Schriftart zurücksetzen",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Nach Hinzufügen-Datum sortieren",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Nach Name sortieren",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Nach Typ sortieren",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatisch sortieren",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigation",
    "CMD_QUICK_OPEN"                      : "Schnell öffnen",
    "CMD_GOTO_LINE"                       : "Gehe zu Zeile",
    "CMD_GOTO_DEFINITION"                 : "Gehe zu Definition",
    "CMD_TOGGLE_QUICK_EDIT"               : "Schnell bearbeiten",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Voriger Treffer",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Nächster Treffer",
    "CMD_NEXT_DOC"                        : "Nächstes Dokument",
    "CMD_PREV_DOC"                        : "Voriges Dokument",
    "CMD_SHOW_IN_TREE"                    : "Im Dateibaum anzeigen",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Debug",
    "CMD_REFRESH_WINDOW"                  : "{APP_NAME} neu laden",
    "CMD_SHOW_DEV_TOOLS"                  : "Entwicklungswerkzeuge zeigen",
    "CMD_RUN_UNIT_TESTS"                  : "Tests durchführen",
    "CMD_JSLINT"                          : "JSLint aktivieren",
    "CMD_SHOW_PERF_DATA"                  : "Performance-Analyse",
    "CMD_NEW_BRACKETS_WINDOW"             : "Neues {APP_NAME}-Fenster",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Ordner Erweiterungen anzeigen",
    "CMD_SWITCH_LANGUAGE"                 : "Sprache wechseln",
    "CMD_CHECK_FOR_UPDATE"                : "Nach Updates suchen",

    // Help menu commands
    "HELP_MENU"                           : "Hilfe",
    "CMD_ABOUT"                           : "Über {APP_TITLE}",
    "CMD_FORUM"                           : "{APP_NAME}-Forum",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Fenster schließen",
    "CMD_ABORT_QUIT"                      : "Beenden abbrechen",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Experimenteller Build",
    "JSLINT_ERRORS"                        : "JSLint-Fehler",
    "JSLINT_ERROR_INFORMATION"             : "1 JSLint-Fehler",
    "JSLINT_ERRORS_INFORMATION"            : "{0} JSLint-Fehler",
    "JSLINT_NO_ERRORS"                     : "Keine JSLint-Fehler – gute Arbeit!",
    "JSLINT_DISABLED"                      : "JSLint ist deaktiviert oder funktioniert nicht für die aktuelle Datei",
    "SEARCH_RESULTS"                       : "Suchergebnisse",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Nicht speichern",
    "SAVE"                                 : "Speichern",
    "CANCEL"                               : "Abbrechen",
    "RELOAD_FROM_DISK"                     : "Von der Festplatte neu laden",
    "KEEP_CHANGES_IN_EDITOR"               : "Änderungen im Editor behalten",
    "CLOSE_DONT_SAVE"                      : "Schließen (nicht speichern)",
    "RELAUNCH_CHROME"                      : "Chrome neu starten",
    "ABOUT"                                : "Über",
    "APP_NAME"                             : "Brackets",
    "CLOSE"                                : "Schließen",
    "ABOUT_TEXT_LINE1"                     : "Sprint {VERSION_MINOR} experimenteller Build {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Hinweise, Bestimmungen und Bedingungen, die sich auf Drittanbieter-Software beziehen, finden sich unter <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> und sind hier durch Bezugnahme eingeschlossen.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentation und Quellcode unter <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Eine neue Version von {APP_NAME} ist verfügbar! Für Details hier klicken.",
    "UPDATE_AVAILABLE_TITLE"               : "Update verfügbar",
    "UPDATE_MESSAGE"                       : "Hallo! Eine neue Version von {APP_NAME} ist verfügbar. Hier einige der neuen Funktionen:",
    "GET_IT_NOW"                           : "Jetzt updaten!",
    "PROJECT_SETTINGS_TITLE"               : "Projekt-Einstellungen",
    "PROJECT_SETTING_BASE_URL"             : "Basis-URL für Live-Vorschau",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(leer lassen für Datei-URL)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Das Protokoll {0} wird von der Live-Vorschau nicht unterstützt &ndash; bitte http: oder https: verwenden.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Die Basis-URL kann keine Such-Parameter wie \"{0}\" enthalten.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Die Basis-URL kann keine Hashes wie \"{0}\" enthalten.",
    "BASEURL_ERROR_INVALID_CHAR"           : "Sonderzeichen wie  \"{0}\" müssen %-kodiert werden.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Unbekannter Fehler beim Verarbeiten der Basis-URL"
});
