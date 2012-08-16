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
    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Fehler beim Laden des Projekts",
    "OPEN_DIALOG_ERROR"                 : "Fehler beim Erstellen des Öffnen Dialogs. (Fehler {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Fehler beim Lesen des Verzeichnisses <span class='dialog-filename'>{0}</span>. (Fehler {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Fehler beim Lesen der Verzeichnisinhalte von <span class='dialog-filename'>{0}</span>. (Fehler {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Fehler beim Öffnen der Datei",
    "ERROR_OPENING_FILE"                : "Beim Öffnen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Fehler beim Laden der Änderungen",
    "ERROR_RELOADING_FILE"              : "Beim Laden der Änderungen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Fehler beim Speichern der Datei",
    "ERROR_SAVING_FILE"                 : "Beim Speichern der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "INVALID_FILENAME_TITLE"            : "Ungültiger Dateiname",
    "INVALID_FILENAME_MESSAGE"          : "Dateinamen dürfen folgenden Zeichen nicht enthalten: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "Die Datei <span class='dialog-filename'>{0}</span> existiert bereits.",
    "ERROR_CREATING_FILE_TITLE"         : "Fehler beim Erstellen der Datei",
    "ERROR_CREATING_FILE"               : "Beim Erstellen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",

    // Application error strings
    "ERROR_BRACKETS_IN_BROWSER_TITLE"   : "Ups! Brackets läuft derzeit leider nocht nicht im Browser.",
    "ERROR_BRACKETS_IN_BROWSER"         : "Brackets wurde in HTML programmiert aber derzeite läuft es nur als Desktop Anwendung um damit lokale Dateien zu bearbeiten. Bitte benutzen Sie die Anwendung von <b>github.com/adobe/brackets-app</b>.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Fehler beim Indizieren der Dateien",
    "ERROR_MAX_FILES"                   : "Die maximal mögliche Anzahl inidizierbarer Datein wurde überschritten. Funktionen die auf dem Index beruhen werden möglicherweise nicht korrekt funktionieren.",
    
    // CSSManager error strings
    "ERROR_PARSE_TITLE"                 : "Fehler beim interpretieren der CSS Datei(en):",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Fehler beim Starten des Webbrowsers",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome konnte nicht gefunden werden. Bitte laden Sie den Browser unter <b>google.de/chrome</b>.",
    "ERROR_LAUNCHING_BROWSER"           : "Beim Starten des Webbrowsers ist ein Fehler aufgetreten: (Fehler {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Fehler bei der Live Entwicklung",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Beim Aufbauen einer Live Verbindung zu Chrome ist ein Fehler aufgetreten. "
                                                + "Für die Live Entwicklung muss das Remote Debugger Protokoll von Chrome aktiviert sein."
                                                + "<br /><br />Soll Chrome neu gestartet werden um das Remote Debugger Protokoll zu aktivieren?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Öffnen Sie erst eine HTML Datei und aktivieren Sie dann die Live Verbindung.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Entwicklung",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Entwicklung: Verbinden...",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Entwicklung: Initialisieren...",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Trennen der Live Verbindung",
    
    "SAVE_CLOSE_TITLE"                  : "Ungespeicherte Änderungen",
    "SAVE_CLOSE_MESSAGE"                : "Wollen Sie die Änderungen in dem Dokument <span class='dialog-filename'>{0}</span> speichern?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Wollen Sie die Änderungen in den folgenden Dateien speichern?",
    "EXT_MODIFIED_TITLE"                : "Externe Änderungen",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> wurde extern geändert und hat ungespeicherte Änderungen in Brackets."
                                                + "<br /><br />"
                                                + "Welche Version wollen Sie erhalten?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> wurde extern gelöscht und hat ungespeicherte Änderungen in Brackets."
                                                + "<br /><br />"
                                                + "Wollen Sie die Änderungen erhalten?",
    
    "OPEN_FILE"                         : "Datei Öffnen",

    // Switch language
    "LANGUAGE_TITLE"                    : "Sprache Wechseln",
    "LANGUAGE_MESSAGE"                  : "Bitte wählen Sie die gewünschte Sprache aus der folgenden Liste aus:",
    "LANGUAGE_SUBMIT"                   : "Brackets neu starten",
    "LANGUAGE_CANCEL"                   : "Abbrechen",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Datei",
    "CMD_FILE_NEW"                        : "Neu",
    "CMD_FILE_OPEN"                       : "Öffnen\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Zum Projekt hinzufügen",
    "CMD_OPEN_FOLDER"                     : "Ordner öffnen\u2026",
    "CMD_FILE_CLOSE"                      : "Schließen",
    "CMD_FILE_CLOSE_ALL"                  : "Alles schlieen",
    "CMD_FILE_SAVE"                       : "Speichern",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Entwicklung",
    "CMD_QUIT"                            : "Beenden",

    // Edit menu commands
    "EDIT_MENU"                           : "Bearbeiten",
    "CMD_SELECT_ALL"                      : "Alles auswählen",
    "CMD_FIND"                            : "Suchen",
    "CMD_FIND_IN_FILES"                   : "Im Projekt suchen",
    "CMD_FIND_NEXT"                       : "Weitersuchen (vorwärts)",
    "CMD_FIND_PREVIOUS"                   : "Weitersuchen (rückwärts)",
    "CMD_REPLACE"                         : "Ersetzen",
    "CMD_INDENT"                          : "Einrücken",
    "CMD_UNINDENT"                        : "Ausrücken",
    "CMD_DUPLICATE"                       : "Duplizieren",
    "CMD_COMMENT"                         : "Zeilen (aus-)kommentieren",
    "CMD_LINE_UP"                         : "Zeilen nach oben verschieben",
    "CMD_LINE_DOWN"                       : "Zeilen nach unten verschieben",
     
    // View menu commands
    "VIEW_MENU"                           : "Ansicht",
    "CMD_HIDE_SIDEBAR"                    : "Seitenleiste verbergen",
    "CMD_SHOW_SIDEBAR"                    : "Seitenleiste zeigen",
    "CMD_INCREASE_FONT_SIZE"              : "Schriftart vergrößern",
    "CMD_DECREASE_FONT_SIZE"              : "Schriftart verkleinern",
    "CMD_RESTORE_FONT_SIZE"               : "Schriftart zurücksetzen",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigation",
    "CMD_QUICK_OPEN"                      : "Schnell Öffnen",
    "CMD_GOTO_LINE"                       : "Gehe zu Zeile",
    "CMD_GOTO_DEFINITION"                 : "Gehe zu Definition",
    "CMD_TOGGLE_QUICK_EDIT"               : "Schnell Bearbeiten",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Voriger Treffer",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Nächster Treffer",
    "CMD_NEXT_DOC"                        : "Nächstes Dokument",
    "CMD_PREV_DOC"                        : "Voriges Dokument",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Debug",
    "CMD_REFRESH_WINDOW"                  : "Brackets neu laden",
    "CMD_SHOW_DEV_TOOLS"                  : "Entwicklungswerkzeuge zeigen",
    "CMD_RUN_UNIT_TESTS"                  : "Tests durchführen",
    "CMD_JSLINT"                          : "JSLint aktivieren",
    "CMD_SHOW_PERF_DATA"                  : "Performance Analyse",
    "CMD_NEW_BRACKETS_WINDOW"             : "Neues Brackets Fenster",
    "CMD_USE_TAB_CHARS"                   : "Mit Tabs einrücken",
    "CMD_SWITCH_LANGUAGE"                 : "Sprache wechseln",

    // Help menu commands
    "CMD_ABOUT"                           : "Über",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Fenster schließen"

});
