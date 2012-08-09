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

define(function (require, exports, module) {
    
    'use strict';

    // General file io error strings
    // TODO TRANSLATE
    // exports.GENERIC_ERROR                     = "(error {0})";
    // exports.NOT_FOUND_ERR                     = "The file could not be found.";
    // exports.NOT_READABLE_ERR                  = "The file could not be read.";
    // exports.NO_MODIFICATION_ALLOWED_ERR       = "The target directory cannot be modified.";
    // exports.NO_MODIFICATION_ALLOWED_ERR_FILE  = "The permissions do not allow you to make modifications.";

    // // Project error strings
    // exports.ERROR_LOADING_PROJECT             = "Error loading project";
    // exports.OPEN_DIALOG_ERROR                 = "An error occurred when showing the open file dialog. (error {0})";
    // exports.REQUEST_NATIVE_FILE_SYSTEM_ERROR  = "An error occurred when trying to load the directory <span class='dialog-filename'>{0}</span>. (error {1})";
    // exports.READ_DIRECTORY_ENTRIES_ERROR      = "An error occurred when reading the contents of the directory <span class='dialog-filename'>{0}</span>. (error {1})";

        
    // Project error strings
    exports.ERROR_LOADING_PROJECT             = "Fehler beim Laden des Projekts";
    exports.OPEN_DIALOG_ERROR                 = "Fehler beim Erstellen des Öffnen Dialogs. (Fehler {0})";
    exports.REQUEST_NATIVE_FILE_SYSTEM_ERROR  = "Fehler beim Lesen des Verzeichnisses <span class='dialog-filename'>{0}</span>. (Fehler {1})";
    exports.READ_DIRECTORY_ENTRIES_ERROR      = "Fehler beim Lesen der Verzeichnisinhalte von <span class='dialog-filename'>{0}</span>. (Fehler {1})";

    // File open/save error string
    exports.ERROR_OPENING_FILE_TITLE          = "Fehler beim Öffnen der Datei";
    exports.ERROR_OPENING_FILE                = "Beim Öffnen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}";
    exports.ERROR_RELOADING_FILE_TITLE        = "Fehler beim Laden der Änderungen";
    exports.ERROR_RELOADING_FILE              = "Beim Laden der Änderungen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}";
    exports.ERROR_SAVING_FILE_TITLE           = "Fehler beim Speichern der Datei";
    exports.ERROR_SAVING_FILE                 = "Beim Speichern der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}";
    exports.INVALID_FILENAME_TITLE            = "Ungültiger Dateiname";
    exports.INVALID_FILENAME_MESSAGE          = "Dateinamen dürfen folgenden Zeichen nicht enthalten: /?*:;{}<>\\|";
    exports.FILE_ALREADY_EXISTS               = "Die Datei <span class='dialog-filename'>{0}</span> existiert bereits.";
    exports.ERROR_CREATING_FILE_TITLE         = "Fehler beim Erstellen der Datei";
    exports.ERROR_CREATING_FILE               = "Beim Erstellen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}";

    // Application error strings
    exports.ERROR_BRACKETS_IN_BROWSER_TITLE   = "Ups! Brackets läuft derzeit leider nocht nicht im Browser.";
    exports.ERROR_BRACKETS_IN_BROWSER         = "Brackets wurde in HTML programmiert aber derzeite läuft es nur als Desktop Anwendung um damit lokale Dateien zu bearbeiten. Bitte benutzen Sie die Anwendung von <b>github.com/adobe/brackets-app</b>.";

    // FileIndexManager error string
    exports.ERROR_MAX_FILES_TITLE             = "Fehler beim Indizieren der Dateien";
    exports.ERROR_MAX_FILES                   = "Die maximal mögliche Anzahl inidizierbarer Datein wurde überschritten. Funktionen die auf dem Index beruhen werden möglicherweise nicht korrekt funktionieren.";
    
    // CSSManager error strings
    exports.ERROR_PARSE_TITLE                 = "Fehler beim interpretieren der CSS Datei(en):";

    // Live Development error strings
    exports.ERROR_LAUNCHING_BROWSER_TITLE     = "Fehler beim Starten des Webbrowsers";
    exports.ERROR_CANT_FIND_CHROME            = "Google Chrome konnte nicht gefunden werden. Bitte laden Sie den Browser unter <b>google.de/chrome</b>.";
    exports.ERROR_LAUNCHING_BROWSER           = "Beim Starten des Webbrowsers ist ein Fehler aufgetreten: (Fehler {0})";
    
    exports.LIVE_DEVELOPMENT_ERROR_TITLE      = "Fehler bei der Live Entwicklung";
    exports.LIVE_DEVELOPMENT_ERROR_MESSAGE    = "Beim Aufbauen einer Live Verbindung zu Chrome ist ein Fehler aufgetreten. "
                                                + "Für die Live Entwicklung muss das Remote Debugger Protokoll von Chrome aktiviert sein."
                                                + "<br /><br />Soll Chrome neu gestartet werden um das Remote Debugger Protokoll zu aktivieren?";
    exports.LIVE_DEV_NEED_HTML_MESSAGE        = "Öffnen Sie erst eine HTML Datei und aktivieren Sie dann die Live Verbindung.";
    
    exports.LIVE_DEV_STATUS_TIP_NOT_CONNECTED = "Live Entwicklung";
    exports.LIVE_DEV_STATUS_TIP_PROGRESS1     = "Live Entwicklung: Verbinden...";
    exports.LIVE_DEV_STATUS_TIP_PROGRESS2     = "Live Entwicklung: Initialisieren...";
    exports.LIVE_DEV_STATUS_TIP_CONNECTED     = "Trennen der Live Verbindung";
    
    exports.SAVE_CLOSE_TITLE                  = "Ungespeicherte Änderungen";
    exports.SAVE_CLOSE_MESSAGE                = "Wollen Sie die Änderungen in dem Dokument <span class='dialog-filename'>{0}</span> speichern?";
    exports.SAVE_CLOSE_MULTI_MESSAGE          = "Wollen Sie die Änderungen in den folgenden Dateien speichern?";
    exports.EXT_MODIFIED_TITLE                = "Externe Änderungen";
    exports.EXT_MODIFIED_MESSAGE              = "<span class='dialog-filename'>{0}</span> wurde extern geändert und hat ungespeicherte Änderungen in Brackets."
                                                + "<br /><br />"
                                                + "Welche Version wollen Sie erhalten?";
    exports.EXT_DELETED_MESSAGE               = "<span class='dialog-filename'>{0}</span> wurde extern gelöscht und hat ungespeicherte Änderungen in Brackets."
                                                + "<br /><br />"
                                                + "Wollen Sie die Änderungen erhalten?";
    
    exports.OPEN_FILE                         = "Datei Öffnen";

    // Switch language
    exports.LANGUAGE_TITLE                    = "Sprache Wechseln";
    exports.LANGUAGE_MESSAGE                  = "Bitte wählen Sie die gewünschte Sprache aus der folgenden Liste aus:";
    exports.LANGUAGE_SUBMIT                   = "Brackets neu starten";
    exports.LANGUAGE_CANCEL                   = "Abbrechen";


    /**
     * Command Name Constants
     */

    // File menu commands
    exports.FILE_MENU                           = "Datei";
    exports.CMD_FILE_NEW                        = "Neu";
    exports.CMD_FILE_OPEN                       = "Öffnen\u2026";
    exports.CMD_ADD_TO_WORKING_SET              = "Zum Projekt hinzufügen";
    exports.CMD_OPEN_FOLDER                     = "Ordner öffnen\u2026";
    exports.CMD_FILE_CLOSE                      = "Schließen";
    exports.CMD_FILE_CLOSE_ALL                  = "Alles schlieen";
    exports.CMD_FILE_SAVE                       = "Speichern";
    exports.CMD_LIVE_FILE_PREVIEW               = "Live Entwicklung";
    exports.CMD_QUIT                            = "Beenden";

    // Edit menu commands
    exports.EDIT_MENU                           = "Bearbeiten";
    exports.CMD_SELECT_ALL                      = "Alles auswählen";
    exports.CMD_FIND                            = "Suchen";
    exports.CMD_FIND_IN_FILES                   = "Im Projekt suchen";
    exports.CMD_FIND_NEXT                       = "Weitersuchen (vorwärts)";
    exports.CMD_FIND_PREVIOUS                   = "Weitersuchen (rückwärts)";
    exports.CMD_REPLACE                         = "Ersetzen";
    exports.CMD_INDENT                          = "Einrücken";
    exports.CMD_UNINDENT                        = "Ausrücken";
    exports.CMD_DUPLICATE                       = "Duplizieren";
    exports.CMD_COMMENT                         = "Zeilen (aus-)kommentieren";
    exports.CMD_LINE_UP                         = "Zeilen nach oben verschieben";
    exports.CMD_LINE_DOWN                       = "Zeilen nach unten verschieben";
     
    // View menu commands
    exports.VIEW_MENU                           = "Ansicht";
    exports.CMD_HIDE_SIDEBAR                    = "Seitenleiste verbergen";
    exports.CMD_SHOW_SIDEBAR                    = "Seitenleiste zeigen";
    exports.CMD_INCREASE_FONT_SIZE              = "Schriftart vergrößern";
    exports.CMD_DECREASE_FONT_SIZE              = "Schriftart verkleinern";
    exports.CMD_RESTORE_FONT_SIZE               = "Schriftart zurücksetzen";

    // Navigate menu Commands
    exports.NAVIGATE_MENU                       = "Navigation";
    exports.CMD_QUICK_OPEN                      = "Schnell Öffnen";
    exports.CMD_GOTO_LINE                       = "Gehe zu Zeile";
    exports.CMD_GOTO_DEFINITION                 = "Gehe zu Definition";
    exports.CMD_TOGGLE_QUICK_EDIT               = "Schnell Bearbeiten";
    exports.CMD_QUICK_EDIT_PREV_MATCH           = "Voriger Treffer";
    exports.CMD_QUICK_EDIT_NEXT_MATCH           = "Nächster Treffer";
    exports.CMD_NEXT_DOC                        = "Nächstes Dokument";
    exports.CMD_PREV_DOC                        = "Voriges Dokument";
    
    // Debug menu commands
    exports.DEBUG_MENU                          = "Debug";
    exports.CMD_REFRESH_WINDOW                  = "Brackets neu laden";
    exports.CMD_SHOW_DEV_TOOLS                  = "Entwicklungswerkzeuge zeigen";
    exports.CMD_RUN_UNIT_TESTS                  = "Tests durchführen";
    exports.CMD_JSLINT                          = "JSLint aktivieren";
    exports.CMD_SHOW_PERF_DATA                  = "Performance Analyse";
    exports.CMD_NEW_BRACKETS_WINDOW             = "Neues Brackets Fenster";
    exports.CMD_USE_TAB_CHARS                   = "Mit Tabs einrücken";
    exports.CMD_SWITCH_LANGUAGE                 = "Sprache wechseln";

    // Help menu commands
    exports.CMD_ABOUT                           = "Über";

    // Special commands invoked by the native shell
    exports.CMD_CLOSE_WINDOW                    = "Fenster schließen";

    // TODO TRANSLATE
    // exports.EXPERIMENTAL_BUILD                   = "Experimental Build";
    // exports.JSLINT_ERRORS                        = "JSLint Errors";
    // exports.SEARCH_RESULTS                       = "Search Results";
    // exports.OK                                   = "OK";
    // exports.DONT_SAVE                            = "Don't Save";
    // exports.SAVE                                 = "Save";
    // exports.CANCEL                               = "Cancel";
    // exports.RELOAD_FROM_DISK                     = "Reload from Disk";
    // exports.KEEP_CHANGES_IN_EDITOR               = "Keep Changes in Editor";
    // exports.CLOSE_DONT_SAVE                      = "Close (Don't Save)";
    // exports.KEEP_CHANGES_IN_EDITOR               = "Keep Changes in Editor";
    // exports.RELAUNCH_CHROME                      = "Relaunch Chrome";
    // exports.ABOUT                                = "About";
    // exports.BRACKETS                             = "Brackets";
    // exports.CLOSE                                = "Close";
    // exports.ABOUT_TEXT_LINE1                     = "sprint 12 experimental build ";
    // exports.ABOUT_TEXT_LINE2                     = "Copyright 2012 Adobe Systems Incorporated and its licensors. All rights reserved.";
    // exports.ABOUT_TEXT_LINE3                     = "Notices; terms and conditions pertaining to third party software are located at ";
    // exports.ABOUT_TEXT_LINE4                     = " and incorporated by reference herein.";
    // exports.ABOUT_TEXT_LINE5                     = "Documentation and source at ";
});
