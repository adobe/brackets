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
    "NOT_FOUND_ERR"                     : "Die Datei/der Ordner konnte nicht gefunden werden.",
    "NOT_READABLE_ERR"                  : "Die Datei/der Ordner konnte nicht gelesen werden.",
    "EXCEEDS_MAX_FILE_SIZE"             : "{APP_NAME} kann keine Dateien öffnen, die größer als {0} MB sind.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Der Ziel-Ordner kann nicht verändert werden.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Die Berechtigungen erlauben Ihnen nicht, Veränderungen vorzunehmen.",
    "CONTENTS_MODIFIED_ERR"             : "Die Datei wurde außerhalb von {APP_NAME} verändert.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} unterstützt derzeit nur UTF-8-kodierte Textdateien.",
    "FILE_EXISTS_ERR"                   : "Die Datei existiert bereits.",
    "FILE"                              : "Datei",
    "FILE_TITLE"                        : "Datei",
    "DIRECTORY"                         : "Ordner",
    "DIRECTORY_TITLE"                   : "Ordner",
    "DIRECTORY_NAMES_LEDE"              : "Ordnernamen",
    "FILENAMES_LEDE"                    : "Dateinamen",
    "FILENAME"                          : "Dateiname",
    "DIRECTORY_NAME"                    : "Ordnername",


    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Fehler beim Laden des Projekts",
    "OPEN_DIALOG_ERROR"                 : "Fehler beim Erstellen des Datei-Öffnen-Dialogs. (Fehler {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Fehler beim Lesen des Ordners <span class='dialog-filename'>{0}</span>. (Fehler {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Fehler beim Lesen der Ordnerinhalte von <span class='dialog-filename'>{0}</span>. (Fehler {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Fehler beim Öffnen der Datei",
    "ERROR_OPENING_FILE"                : "Beim Öffnen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_OPENING_FILES"               : "Beim Öffnen folgender Dateien ist ein Fehler aufgetreten:",
    "ERROR_RELOADING_FILE_TITLE"        : "Fehler beim Laden der Änderungen",
    "ERROR_RELOADING_FILE"              : "Beim Laden der Änderungen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Fehler beim Speichern der Datei",
    "ERROR_SAVING_FILE"                 : "Beim Speichern der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Fehler beim Umbenennen von {0}", // TODO: depends on {0} gender
    "ERROR_RENAMING_FILE"               : "Beim Umbenennen von {2} <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}", // TODO: depends on {2} gender
    "ERROR_DELETING_FILE_TITLE"         : "Fehler beim Löschen von {0}", // TODO: depends on {0} gender
    "ERROR_DELETING_FILE"               : "Beim Löschen von {2} <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten. {1}", // TODO: depends on {2} gender
    "INVALID_FILENAME_TITLE"            : "Ungültiger {0}",
    "INVALID_FILENAME_MESSAGE"          : "{0} dürfen keine dem System vorbehaltenen Namen gebrauchen und nicht mit Punkten (.) enden oder die folgenden Zeichen enthalten: <span class='emphasized'>{1}</span>",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "Eine Datei oder ein Ordner mit dem Namen <span class='dialog-filename'>{0}</span> existiert bereits.",
    "ERROR_CREATING_FILE_TITLE"         : "Fehler beim Erstellen von {0}", // TODO: depends on {0} gender
    "ERROR_CREATING_FILE"               : "Beim Erstellen von {0} <span class='dialog-filename'>{1}</span> ist ein Fehler aufgetreten: {2}", // TODO: depends on {0} gender
    "ERROR_MIXED_DRAGDROP"              : "Ein Ordner kann nicht zeitgleich mit anderen Dateien geöffnet werden.",

    // User key map error strings
    "ERROR_KEYMAP_TITLE"                : "Fehler beim Einlesen der benutzerdefinierten Tastenbelegung",
    "ERROR_KEYMAP_CORRUPT"              : "Ihre Tastenbelegungs-Datei enthält kein gültiges JSON. Die Datei wird geöffnet, damit sie das Format korrigieren können.",
    "ERROR_LOADING_KEYMAP"              : "Ihre Tastenbelegungs-Datei ist keine gültige UTF-8-kodierte Textdatei und kann daher nicht geladen werden.",
    "ERROR_RESTRICTED_COMMANDS"         : "Sie können die Tastenkürzel der folgenden Befehle nicht ändern: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"        : "Sie können die folgenden Tastenkürzel nicht ändern: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"          : "Sie ordnen diesen Befehlen mehrere Tastenkürzel zu: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"         : "Sie belegen diese Tastenkürzel mehrfach: {0}",
    "ERROR_INVALID_SHORTCUTS"           : "Diese Tastenkürzel sind ungültig: {0}",
    "ERROR_NONEXISTENT_COMMANDS"        : "Sie ordnen nicht existierenden Befehlen Tastenkürzel zu: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Fehler beim Lesen der Einstellungen",
    "ERROR_PREFS_CORRUPT"               : "Ihre Einstellungsdatei enthält kein gültiges JSON. Die Datei wird geöffnet, damit Sie das Format korrigieren können. Sie müssen {APP_NAME} neu starten, damit die Änderungen wirksam werden.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} kann derzeit leider noch nicht im Browser ausgeführt werden.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} wurde in HTML programmiert, ist derzeit jedoch lediglich als Desktop-Anwendung verfügbar, um damit lokale Dateien zu bearbeiten. Bitte verwenden Sie die Anwendungs-Shell im Repo <b>github.com/adobe/brackets-shell</b>, um {APP_NAME} auszuführen.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Fehler beim Indizieren der Dateien",
    "ERROR_MAX_FILES"                   : "Dieses Projekt besteht aus über 30.000 Dateien. Funktionen, die mit mehreren Dateien interagieren, wurden eventuell deaktiviert oder verhalten sich so, als ob das Projekt keine Dateien hätte. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>Lies mehr über das Arbeiten mit großen Projekten</a>.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Fehler beim Starten des Browsers",
    "ERROR_CANT_FIND_CHROME"            : "Der Browser Google Chrome konnte nicht gefunden werden. Bitte stellen Sie sicher, dass er installiert ist.",
    "ERROR_LAUNCHING_BROWSER"           : "Beim Starten des Browsers ist ein Fehler aufgetreten. (Fehler {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Fehler bei der Live-Vorschau",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Verbinden zum Browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Um die Live-Vorschau zu verwenden, muss Chrome mit aktiviertem Remote-Debugging neu gestartet werden.<br /><br />Soll Chrome neu gestartet werden, um das Remote Debugger Protokoll zu aktivieren?<br /><br />",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Laden der Live-Vorschau nicht möglich.",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Öffnen Sie eine HTML-Datei oder stellen Sie sicher, dass sich eine index.html-Datei im Projekt befindet, um die Live-Vorschau zu starten.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Zum Starten der Live-Vorschau mit einer serverseitigen Datei müssen Sie eine Basis-URL für dieses Projekt angeben.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Ein Fehler ist beim Starten des HTTP-Servers oder der Live-Vorschau-Dateien aufgetreten. Bitte versuchen Sie es später erneut.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Willkommen bei der Live-Vorschau!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Die Live-Vorschau verbindet {APP_NAME} mit Ihrem Browser. Sie startet eine Vorschau Ihrer HTML-Datei im Browser und aktualisiert die Vorschau, sobald Sie Ihren Code bearbeiten.<br /><br />In dieser frühen Version von {APP_NAME} funktioniert die Live-Vorschau nur mit <strong>Google Chrome</strong> und aktualisiert sich live, wenn Sie <strong>CSS- oder HTML-Dateien</strong> bearbeiten. Änderungen an JavaScript-Dateien werden beim Speichern automatisch neu geladen.<br /><br />(Sie sehen diese Meldung nur einmal.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Weitere Informationen finden Sie unter dem Thema <a href='{0}' title='{0}'>Fehlerbehebung bei Verbindungs-Fehlern der Live-Entwicklung</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live-Vorschau",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live-Vorschau: Verbinden\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live-Vorschau: Initialisieren\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Live-Vorschau trennen",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live-Vorschau (Datei speichern zum Aktualisieren)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live-Vorschau (Es wird aufgrund eines Syntax-Fehlers nicht aktualisiert)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Die Live-Vorschau wurde abgebrochen, weil die Entwickler-Tools des Browsers geöffnet wurden",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Die Live-Vorschau wurde abgebrochen, weil die Seite im Browser geschlossen wurde",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Die Live-Vorschau wurde abgebrochen, weil der Browser eine Seite geladen hat, die nicht Teil des aktuellen Projekts ist",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Die Live-Vorschau wurde aus einem unbekannten Grund abgebrochen ({0})",

    "SAVE_CLOSE_TITLE"                  : "Änderungen speichern",
    "SAVE_CLOSE_MESSAGE"                : "Wollen Sie die Änderungen in dem Dokument <span class='dialog-filename'>{0}</span> speichern?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Wollen Sie Ihre Änderungen in den folgenden Dateien speichern?",
    "EXT_MODIFIED_TITLE"                : "Externe Änderungen",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Löschen bestätigen",
    "CONFIRM_FOLDER_DELETE"             : "Sind Sie sich sicher, dass Sie den Ordner <span class='dialog-filename'>{0}</span> löschen wollen?",
    "FILE_DELETED_TITLE"                : "Datei gelöscht",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> wurde extern geändert.<br /><br />Wollen Sie die Datei speichern und die externen Änderungen ersetzen?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> wurde extern geändert und hat ungespeicherte Änderungen in {APP_NAME}.<br /><br />Welche Version wollen Sie weiterverwenden?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> wurde extern gelöscht und hat ungespeicherte Änderungen in {APP_NAME}.<br /><br />Wollen Sie die Änderungen beibehalten?",

    // Generic dialog/button labels
    "DONE"                              : "Fertig",
    "OK"                                : "OK",
    "CANCEL"                            : "Abbrechen",
    "DONT_SAVE"                         : "Nicht speichern",
    "SAVE"                              : "Speichern",
    "SAVE_AS"                           : "Speichern unter\u2026",
    "SAVE_AND_OVERWRITE"                : "Ersetzen",
    "DELETE"                            : "Löschen",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nein",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                  : "{0} von {1}",
    "FIND_NO_RESULTS"                   : "Keine Ergebnisse",
    "FIND_QUERY_PLACEHOLDER"            : "Suchen\u2026",
    "REPLACE_PLACEHOLDER"               : "Ersetzen mit\u2026",
    "BUTTON_REPLACE_ALL"                : "Mehrere\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Ersetzen\u2026",
    "BUTTON_REPLACE"                    : "Ersetzen",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Nächster Treffer",
    "BUTTON_PREV_HINT"                  : "Vorheriger Treffer",
    "BUTTON_CASESENSITIVE_HINT"         : "Groß-/Kleinschreibung beachten",
    "BUTTON_REGEXP_HINT"                : "Regulärer Ausdruck",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Endgültiges Ersetzen",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Da mehr als {0} Dateien geändert werden, wird {APP_NAME} ungeöffnete Dateien auf der Festplatte verändern.<br />Das Ersetzen kann in diesen Dateien nicht mehr rückgängig gemacht werden.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Endgültig ersetzen",

    "OPEN_FILE"                         : "Datei öffnen",
    "SAVE_FILE_AS"                      : "Datei speichern",
    "CHOOSE_FOLDER"                     : "Ordner wählen",

    "RELEASE_NOTES"                     : "Versionshinweise",
    "NO_UPDATE_TITLE"                   : "Sie sind auf dem Laufenden!",
    "NO_UPDATE_MESSAGE"                 : "Sie führen die neuste Version von {APP_NAME} aus.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Ersetze",
    "FIND_REPLACE_TITLE_WITH"           : "mit",
    "FIND_TITLE_LABEL"                  : "Gefunden:",
    "FIND_TITLE_SUMMARY"                : "&ndash; {0} {1} {2} in {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "im Projekt",
    "FIND_IN_FILES_ZERO_FILES"          : "Der Filter schließt alle Dateien {0} aus",
    "FIND_IN_FILES_FILE"                : "Datei",
    "FIND_IN_FILES_FILES"               : "Dateien",
    "FIND_IN_FILES_MATCH"               : "Treffer",
    "FIND_IN_FILES_MATCHES"             : "Treffer",
    "FIND_IN_FILES_MORE_THAN"           : "Über ",
    "FIND_IN_FILES_PAGING"              : "{0}&ndash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Strg/Cmd + Klick, um alle aus-/einzuklappen",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Fehler beim Ersetzen",
    "REPLACE_IN_FILES_ERRORS"           : "Die folgenden Dateien wurden nicht verändert, weil sie nach der Suche geändert wurden oder nicht geschrieben werden konnten.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Fehler beim Abrufen der Update-Info",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Beim Abrufen der neusten Update-Informationen vom Server ist ein Problem aufgetreten. Bitte stellen Sie sicher, dass Sie mit dem Internet verbunden sind, und probieren Sie es erneut.",

    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Neuer Filter\u2026",
    "CLEAR_FILE_FILTER"                 : "Keine Dateien ausschließen",
    "NO_FILE_FILTER"                    : "Keine Dateien werden ausgeschlossen",
    "EXCLUDE_FILE_FILTER"               : "Schließe {0} aus",
    "EDIT_FILE_FILTER"                  : "Bearbeiten\u2026",
    "FILE_FILTER_DIALOG"                : "Filter bearbeiten",
    "FILE_FILTER_INSTRUCTIONS"          : "Schließe Dateien und Ordner aus, auf die einer der folgenden Pfade / Teilpfade oder <a href='{0}' title='{0}'>Platzhalter</a> zutrifft. Nutze für jeden Pfad eine neue Zeile.",
    "FILTER_NAME_PLACEHOLDER"           : "Benenne diesen Filter (optional)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "und {0} weitere",
    "FILTER_COUNTING_FILES"             : "Dateien werden gezählt\u2026",
    "FILTER_FILE_COUNT"                 : "Lässt {0} von {1} Dateien {2} zu",
    "FILTER_FILE_COUNT_ALL"             : "Lässt alle {0} Dateien {1} zu",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Es wurde kein Editor für Schnelles Bearbeiten für die aktuelle Cursorposition gefunden",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "CSS Quick Edit: Setzen Sie den Cursor auf einen einzigen Klassennamen",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "CSS Quick Edit: Unvollständiges Klassenattribut",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "CSS Quick Edit: Unvollständiges ID-Attribut",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "CSS Quick Edit: Setzen Sie den Cursor auf einen Tag, eine Klasse oder eine ID",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "CSS Timing Function Quick Edit: Syntax nicht korrekt",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "JS Quick Edit: Setzen Sie den Cursor auf einen Funktionsnamen",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Die Schnell-Dokumentation ist für die aktuelle Cursorposition nicht verfügbar",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"  : "Lädt\u2026",
    "UNTITLED"         : "Unbenannt",
    "WORKING_FILES"    : "Offene Dateien",

    /**
     * MainViewManager
     */
    "TOP"               : "Oben",
    "BOTTOM"            : "Unten",
    "LEFT"              : "Links",
    "RIGHT"             : "Rechts",

    "CMD_SPLITVIEW_NONE"        : "Nicht geteilt",
    "CMD_SPLITVIEW_VERTICAL"    : "Vertikal geteilt",
    "CMD_SPLITVIEW_HORIZONTAL"  : "Horizontal geteilt",
    "SPLITVIEW_MENU_TOOLTIP"    : "Teilen Sie den Editor vertikal oder horizontal",
    "GEAR_MENU_TOOLTIP"         : "Projektdateien konfigurieren",

    "SPLITVIEW_INFO_TITLE"              : "Bereits geöffnet",
    "SPLITVIEW_MULTIPANE_WARNING"       : "Diese Datei ist bereits in einer anderen Ansicht geöffnet. Das Öffnen einer Datei in mehreren Ansichten wird {APP_NAME} bald unterstützen. Bis dahin wird die Datei in der Ansicht angezeigt, in der sie bereits geöffnet ist.<br /><br />(Sie sehen diese Nachricht nur einmal.)",

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
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} Spalte ausgewählt",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} Spalten ausgewählt",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} Zeile ausgewählt",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} Zeilen ausgewählt",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} Auswahlen",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klicken, um Einrückung auf Leerzeichen umzuschalten",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klicken, um Einrückung auf Tabs umzuschalten",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klicken, um die Anzahl Leerzeichen beim Einrücken zu ändern",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klicken, um die Schrittweite von Tabs zu ändern",
    "STATUSBAR_SPACES"                      : "Leerzeichen:",
    "STATUSBAR_TAB_SIZE"                    : "Tab-Schrittweite:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Zeile",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Zeilen",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Erweiterungen deaktiviert",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Klicken, um zwischen den Cursor-Modi Einfügen (INS) und Überschreiben (OVR) umzuschalten",
    "STATUSBAR_LANG_TOOLTIP"                : "Klicken, um den Dateityp zu ändern",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Klicken, um Übersicht anzuzeigen/auszublenden.",
    "STATUSBAR_DEFAULT_LANG"                : "(Standard)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Als Standard für .{0}-Dateien festlegen",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Probleme",
    "SINGLE_ERROR"                          : "1 {0} Fehler",
    "MULTIPLE_ERRORS"                       : "{1} {0} Fehler",
    "NO_ERRORS"                             : "Keine {0} Fehler - gute Arbeit!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Keine Fehler - gute Arbeit!",
    "LINT_DISABLED"                         : "Das Linten ist nicht aktiviert",
    "NO_LINT_AVAILABLE"                     : "Es ist kein Linter für {0} verfügbar",
    "NOTHING_TO_LINT"                       : "Es gibt nichts zum Linten",
    "LINTER_TIMED_OUT"                      : "{0} hat die Zeitbegrenzung von {1} ms überschritten",
    "LINTER_FAILED"                         : "{0} hat mit einer Fehlermeldung abgebrochen: {1}",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Datei",
    "CMD_FILE_NEW_UNTITLED"               : "Neu",
    "CMD_FILE_NEW"                        : "Neue Datei",
    "CMD_FILE_NEW_FOLDER"                 : "Neuer Ordner",
    "CMD_FILE_OPEN"                       : "Öffnen\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Im Projekt öffnen",
    "CMD_OPEN_DROPPED_FILES"              : "Abgelegte Dateien öffnen",
    "CMD_OPEN_FOLDER"                     : "Ordner öffnen\u2026",
    "CMD_FILE_CLOSE"                      : "Schließen",
    "CMD_FILE_CLOSE_ALL"                  : "Alles schließen",
    "CMD_FILE_CLOSE_LIST"                 : "Liste schließen",
    "CMD_FILE_CLOSE_OTHERS"               : "Alle anderen schließen",
    "CMD_FILE_CLOSE_ABOVE"                : "Alle darüber schließen",
    "CMD_FILE_CLOSE_BELOW"                : "Alle darunter schließen",
    "CMD_FILE_SAVE"                       : "Speichern",
    "CMD_FILE_SAVE_ALL"                   : "Alles speichern",
    "CMD_FILE_SAVE_AS"                    : "Speichern unter\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live-Vorschau",
    "CMD_TOGGLE_LIVE_PREVIEW_MB_MODE"     : "Experimentelle Live-Vorschau aktivieren",
    "CMD_RELOAD_LIVE_PREVIEW"             : "Live-Vorschau neu laden",
    "CMD_PROJECT_SETTINGS"                : "Projekt-Einstellungen\u2026",
    "CMD_FILE_RENAME"                     : "Umbenennen\u2026",
    "CMD_FILE_DELETE"                     : "Löschen",
    "CMD_INSTALL_EXTENSION"               : "Erweiterung installieren\u2026",
    "CMD_EXTENSION_MANAGER"               : "Erweiterungs-Verwaltung\u2026",
    "CMD_FILE_REFRESH"                    : "Dateibaum neu laden",
    "CMD_QUIT"                            : "Beenden",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Beenden",

    // Edit menu commands
    "EDIT_MENU"                           : "Bearbeiten",
    "CMD_UNDO"                            : "Rückgängig",
    "CMD_REDO"                            : "Wiederholen",
    "CMD_CUT"                             : "Ausschneiden",
    "CMD_COPY"                            : "Kopieren",
    "CMD_PASTE"                           : "Einfügen",
    "CMD_SELECT_ALL"                      : "Alles auswählen",
    "CMD_SELECT_LINE"                     : "Zeile auswählen",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Auswahl in Zeilen aufteilen",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Cursor zur nächsten Zeile hinzufügen",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Cursor zur vorherigen Zeile hinzufügen",
    "CMD_INDENT"                          : "Einrücken",
    "CMD_UNINDENT"                        : "Ausrücken",
    "CMD_DUPLICATE"                       : "Duplizieren",
    "CMD_DELETE_LINES"                    : "Zeile löschen",
    "CMD_COMMENT"                         : "Zeile (aus-)kommentieren",
    "CMD_BLOCK_COMMENT"                   : "Block (aus-)kommentieren",
    "CMD_LINE_UP"                         : "Zeile nach oben verschieben",
    "CMD_LINE_DOWN"                       : "Zeile nach unten verschieben",
    "CMD_OPEN_LINE_ABOVE"                 : "Zeile darüber öffnen",
    "CMD_OPEN_LINE_BELOW"                 : "Zeile darunter öffnen",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Klammern automatisch schließen",
    "CMD_SHOW_CODE_HINTS"                 : "Code-Vervollständigung anzeigen",

    // Search menu commands
    "FIND_MENU"                           : "Suchen",
    "CMD_FIND"                            : "Suchen",
    "CMD_FIND_NEXT"                       : "Weitersuchen (vorwärts)",
    "CMD_FIND_PREVIOUS"                   : "Weitersuchen (rückwärts)",
    "CMD_FIND_ALL_AND_SELECT"             : "Alle suchen und auswählen",
    "CMD_ADD_NEXT_MATCH"                  : "Nächsten Treffer zur Auswahl hinzufügen",
    "CMD_SKIP_CURRENT_MATCH"              : "Überspringen und nächsten Treffer hinzufügen",
    "CMD_FIND_IN_FILES"                   : "Im Projekt suchen",
    "CMD_FIND_IN_SELECTED"                : "Suchen in ausgewählter Datei/Ordner",
    "CMD_FIND_IN_SUBTREE"                 : "Suchen in\u2026",
    "CMD_REPLACE"                         : "Ersetzen",
    "CMD_REPLACE_IN_FILES"                : "Im Projekt ersetzen",
    "CMD_REPLACE_IN_SELECTED"             : "Ersetzen in ausgewählter Datei/Ordner",
    "CMD_REPLACE_IN_SUBTREE"              : "Ersetzen in\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Ansicht",
    "CMD_HIDE_SIDEBAR"                    : "Seitenleiste verbergen",
    "CMD_SHOW_SIDEBAR"                    : "Seitenleiste zeigen",
    "CMD_INCREASE_FONT_SIZE"              : "Schrift vergrößern",
    "CMD_DECREASE_FONT_SIZE"              : "Schrift verkleinern",
    "CMD_RESTORE_FONT_SIZE"               : "Schriftgröße zurücksetzen",
    "CMD_SCROLL_LINE_UP"                  : "Zeile hoch scrollen",
    "CMD_SCROLL_LINE_DOWN"                : "Zeile runter scrollen",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Zeilennummern anzeigen",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Aktive Zeile hervorheben",
    "CMD_TOGGLE_WORD_WRAP"                : "Zeilenumbruch aktivieren",
    "CMD_LIVE_HIGHLIGHT"                  : "Live-Vorschau Highlight",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Beim Speichern linten",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Nach Hinzufügen-Datum sortieren",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Nach Name sortieren",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Nach Typ sortieren",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Automatisch sortieren",
    "CMD_THEMES"                          : "Designs\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigation",
    "CMD_QUICK_OPEN"                      : "Schnell öffnen",
    "CMD_GOTO_LINE"                       : "Gehe zur Zeile",
    "CMD_GOTO_DEFINITION"                 : "Definition schnell finden",
    "CMD_GOTO_FIRST_PROBLEM"              : "Zum ersten Problem gehen",
    "CMD_TOGGLE_QUICK_EDIT"               : "Schnell bearbeiten",
    "CMD_TOGGLE_QUICK_DOCS"               : "Schnell-Dokumentation",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Voriger Treffer",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Nächster Treffer",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Neue Regel",
    "CMD_NEXT_DOC"                        : "Nächstes Dokument",
    "CMD_PREV_DOC"                        : "Voriges Dokument",
    "CMD_SHOW_IN_TREE"                    : "Im Dateibaum anzeigen",
    "CMD_SHOW_IN_EXPLORER"                : "Im Explorer anzeigen",
    "CMD_SHOW_IN_FINDER"                  : "Im Finder anzeigen",
    "CMD_SHOW_IN_OS"                      : "Im Dateisystem anzeigen",

    // Help menu commands
    "HELP_MENU"                           : "Hilfe",
    "CMD_CHECK_FOR_UPDATE"                : "Nach Updates suchen",
    "CMD_HOW_TO_USE_BRACKETS"             : "So verwendet man {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME}-Support",
    "CMD_SUGGEST"                         : "Ein Feature vorschlagen",
    "CMD_RELEASE_NOTES"                   : "Versionshinweise",
    "CMD_GET_INVOLVED"                    : "Mach mit",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Erweiterungen-Ordner anzeigen",
    "CMD_HOMEPAGE"                        : "{APP_NAME}-Homepage",
    "CMD_TWITTER"                         : "{TWITTER_NAME} auf Twitter",
    "CMD_ABOUT"                           : "Über {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Einstellungsdatei öffnen",
    "CMD_OPEN_KEYMAP"                     : "Benutzerdefinierte Tastenbelegung öffnen",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Experimenteller Build",
    "RELEASE_BUILD"                        : "Build",
    "DEVELOPMENT_BUILD"                    : "Entwicklungs-Build",
    "RELOAD_FROM_DISK"                     : "Von der Festplatte neu laden",
    "KEEP_CHANGES_IN_EDITOR"               : "Änderungen im Editor behalten",
    "CLOSE_DONT_SAVE"                      : "Schließen (nicht speichern)",
    "RELAUNCH_CHROME"                      : "Chrome neu starten",
    "ABOUT"                                : "Über",
    "CLOSE"                                : "Schließen",
    "ABOUT_TEXT_LINE1"                     : "Release {VERSION_MAJOR}.{VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "Zeitpunkt des Builds: ",
    "ABOUT_TEXT_LINE3"                     : "Hinweise, Bestimmungen und Bedingungen, die sich auf Drittanbieter-Software beziehen, finden sich unter <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> und sind hier durch Bezugnahme eingeschlossen.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentation und Quellcode unter <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Gemacht mit \u2764 und JavaScript von:",
    "ABOUT_TEXT_LINE6"                     : "…vielen Leuten (…leider haben wir aber gerade Probleme, diese Daten zu laden).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform-Dokumente und das grafische Logo von Web Platform sind unter einer Creative-Commons-Namensnennungs-Lizenz lizenziert, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Eine neue Version von {APP_NAME} ist verfügbar! Für Details hier klicken.",
    "UPDATE_AVAILABLE_TITLE"               : "Update verfügbar",
    "UPDATE_MESSAGE"                       : "Hallo! Eine neue Version von {APP_NAME} ist verfügbar. Hier sind einige der neuen Funktionen:",
    "GET_IT_NOW"                           : "Jetzt updaten!",
    "PROJECT_SETTINGS_TITLE"               : "Projekt-Einstellungen",
    "PROJECT_SETTING_BASE_URL"             : "Basis-URL für Live-Vorschau",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(URL angeben, um einen lokalen Server zu verwenden)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Das Protokoll {0} wird von der Live-Vorschau nicht unterstützt &ndash; bitte http: oder https: verwenden.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Die Basis-URL kann keine Such-Parameter wie \"{0}\" enthalten.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Die Basis-URL kann keine Hashes wie \"{0}\" enthalten.",
    "BASEURL_ERROR_INVALID_CHAR"           : "Sonderzeichen wie  \"{0}\" müssen %-kodiert werden.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Unbekannter Fehler beim Verarbeiten der Basis-URL",
    "EMPTY_VIEW_HEADER"                    : "<em>Öffnen Sie eine Datei, während diese Ansicht fokussiert ist</em>",

    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Aktuelles Design",
    "USE_THEME_SCROLLBARS"                 : "Scrollbars vom Design verwenden",
    "FONT_SIZE"                            : "Schriftgröße",
    "FONT_FAMILY"                          : "Schriftart",
    "THEMES_SETTINGS"                      : "Design-Einstellungen",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Neue Regel",

    // Extension Management strings
    "INSTALL"                              : "Installieren",
    "UPDATE"                               : "Updaten",
    "REMOVE"                               : "Entfernen",
    "OVERWRITE"                            : "Überschreiben",
    "CANT_REMOVE_DEV"                      : "Erweiterungen im \"dev\"-Ordner müssen manuell gelöscht werden.",
    "CANT_UPDATE"                          : "Das Update ist nicht kompatibel mit dieser Version von {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Erweiterungen im \"dev\"-Ordner können nicht automatisch aktualisiert werden.",
    "INSTALL_EXTENSION_TITLE"              : "Erweiterung installieren",
    "UPDATE_EXTENSION_TITLE"               : "Erweiterung updaten",
    "INSTALL_EXTENSION_LABEL"              : "Erweiterungs-URL",
    "INSTALL_EXTENSION_HINT"               : "URL der Erweiterungs-ZIP-Datei oder GitHub-Repo",
    "INSTALLING_FROM"                      : "Erweiterung installieren von {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Installation abgeschlossen!",
    "INSTALL_FAILED"                       : "Installation fehlgeschlagen.",
    "CANCELING_INSTALL"                    : "Abgebrochen\u2026",
    "CANCELING_HUNG"                       : "Das Abbrechen der Installation nimmt bereits einige Minuten in Anspruch. Ein interner Fehler könnte aufgetreten sein.",
    "INSTALL_CANCELED"                     : "Installation abgebrochen.",
    "VIEW_COMPLETE_DESCRIPTION"            : "Komplette Beschreibung anzeigen",
    "VIEW_TRUNCATED_DESCRIPTION"           : "Gekürzte Beschreibung anzeigen",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Der heruntergeladene Inhalt ist keine gültige ZIP-Datei.",
    "INVALID_PACKAGE_JSON"                 : "Die JSON-Paketdatei ist ungültig (Fehler: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Die JSON-Paketdatei hat kein definierten Paketnamen.",
    "BAD_PACKAGE_NAME"                     : "{0} ist ein ungültiger Paketname.",
    "MISSING_PACKAGE_VERSION"              : "Die JSON-Paketdatei hat keine definierte Paketversion.",
    "INVALID_VERSION_NUMBER"               : "Die Paket-Versionsnummer ({0}) ist ungültig.",
    "INVALID_BRACKETS_VERSION"             : "Die {APP_NAME}-Kompatibilitäts-Zeichenkette ({0}) ist ungültig.",
    "DISALLOWED_WORDS"                     : "Die Wörter ({1}) sind im Feld {0} nicht erlaubt.",
    "API_NOT_COMPATIBLE"                   : "Die Erweiterung ist nicht mit der aktuellen Version von {APP_NAME} kompatibel. Die Erweiterung wurde in den Ordner für die deaktivierten Erweiterungen installiert.",
    "MISSING_MAIN"                         : "Das Paket hat keine main.js-Datei.",
    "EXTENSION_ALREADY_INSTALLED"          : "Durch die Installation dieses Pakets wird eine zuvor installierte Erweiterung überschrieben. Alte Erweiterung überschreiben?",
    "EXTENSION_SAME_VERSION"               : "Dieses Paket ist die gleiche Version wie die bereits installierte. Bestehende Installation überschreiben?",
    "EXTENSION_OLDER_VERSION"              : "Dieses Paket ist die Version {0}, die älter ist als die aktuell installierte ({1}). Bestehende Installation überschreiben?",
    "DOWNLOAD_ID_IN_USE"                   : "Interner Fehler: Download-ID wird schon verwendet.",
    "NO_SERVER_RESPONSE"                   : "Verbindung konnte nicht hergestellt werden.",
    "BAD_HTTP_STATUS"                      : "Die Datei wurde auf dem Server nicht gefunden (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Konnte den Download nicht in einer temporären Datei speichern.",
    "ERROR_LOADING"                        : "Beim Starten der Erweiterung ist ein Fehler aufgetreten.",
    "MALFORMED_URL"                        : "Die URL ist ungültig. Bitte prüfen Sie, ob es sich um eine gültige URL handelt.",
    "UNSUPPORTED_PROTOCOL"                 : "Bitte geben Sie eine http- oder https-URL an.",
    "UNKNOWN_ERROR"                        : "Unbekannter (interner) Fehler.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Erweiterungs-Verwaltung",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Fehler beim Zugriff auf das Verzeichnis der Erweiterungen. Bitte später erneut versuchen.",
    "INSTALL_EXTENSION_DRAG"               : ".zip hierhin ziehen oder",
    "INSTALL_EXTENSION_DROP"               : ".zip zum Installieren ablegen",
    "INSTALL_EXTENSION_DROP_ERROR"         : "Das Installieren/Aktualisieren schlug fehl, da die folgenden Fehler aufgetreten sind:",
    "INSTALL_FROM_URL"                     : "von URL installieren\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "Überprüfen\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Datum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Diese Erweiterung benötigt eine neuere Version von {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Diese Erweiterung funktioniert momentan nur mit älteren Versionen von {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Die Version {0} dieser Erweiterung benötigt eine neuere Version von {APP_NAME}. Sie können jedoch die ältere Version {1} installieren.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Die Version {0} dieser Erweiterung funktioniert nur mit älteren Versionen von {APP_NAME}. Sie können jedoch die ältere Version {1} installieren.",
    "EXTENSION_NO_DESCRIPTION"             : "Keine Beschreibung",
    "EXTENSION_MORE_INFO"                  : "Mehr Informationen\u2026",
    "EXTENSION_ERROR"                      : "Erweiterungs-Fehler",
    "EXTENSION_KEYWORDS"                   : "Schlüsselwörter",
    "EXTENSION_TRANSLATED_USER_LANG"       : "In {0} Sprachen, inklusive Ihrer, übersetzt",
    "EXTENSION_TRANSLATED_GENERAL"         : "In {0} Sprachen übersetzt",
    "EXTENSION_TRANSLATED_LANGS"           : "Die Erweiterung wurde in diese Sprachen übersetzt: {0}",
    "EXTENSION_INSTALLED"                  : "Installiert",
    "EXTENSION_UPDATE_INSTALLED"           : "Dieses Erweiterungs-Update wurde heruntergeladen und wird installiert, wenn {APP_NAME} neu geladen wird.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Suchen",
    "EXTENSION_MORE_INFO_LINK"             : "Mehr",
    "BROWSE_EXTENSIONS"                    : "Erweiterungen durchsuchen",
    "EXTENSION_MANAGER_REMOVE"             : "Erweiterung entfernen",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Fehler beim Entfernen der Erweiterung: {0}. {APP_NAME} wird trotzdem neu geladen.",
    "EXTENSION_MANAGER_UPDATE"             : "Erweiterung updaten",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Fehler beim Update einer oder mehrerer Erweiterung(en): {0}. {APP_NAME} wird trotzdem neu geladen.",
    "MARKED_FOR_REMOVAL"                   : "Zur Entfernung markiert",
    "UNDO_REMOVE"                          : "Rückgängig",
    "MARKED_FOR_UPDATE"                    : "Zum Update markiert",
    "UNDO_UPDATE"                          : "Rückgängig",
    "CHANGE_AND_RELOAD_TITLE"              : "Erweiterungen ändern",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Um die markierten Erweiterungen zu updaten oder zu entfernen, muss {APP_NAME} neu geladen werden. Sie werden gefragt, ob ungespeicherte Änderungen gespeichert werden sollen.",
    "REMOVE_AND_RELOAD"                    : "Erweiterungen entfernen und neu laden",
    "CHANGE_AND_RELOAD"                    : "Erweiterungen ändern und neu laden",
    "UPDATE_AND_RELOAD"                    : "Erweiterungen updaten und neu laden",
    "PROCESSING_EXTENSIONS"                : "Erweiterungs-Änderungen werden verarbeitet\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Die Erweiterung {0} konnte nicht entfernt werden, weil sie nicht installiert ist.",
    "NO_EXTENSIONS"                        : "Momentan sind keine Erweiterungen installiert.<br>Klicken Sie oben auf den Tab \"Verfügbar\", um zu beginnen.",
    "NO_EXTENSION_MATCHES"                 : "Keine Erweiterungen passen auf Ihre Suchanfrage.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "ACHTUNG: Diese Erweiterungen stammen nicht unbedingt von den Machern von {APP_NAME}. Erweiterungen werden nicht überprüft und haben uneingeschränkte lokale Rechte. Seien Sie vorsichtig, wenn Sie Erweiterungen aus unbekannter Quelle installieren.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Installiert",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Verfügbar",
    "EXTENSIONS_THEMES_TITLE"              : "Designs",
    "EXTENSIONS_UPDATES_TITLE"             : "Updates",

    "INLINE_EDITOR_NO_MATCHES"             : "Keine Ergebnisse verfügbar.",
    "INLINE_EDITOR_HIDDEN_MATCHES"         : "Alle Ergebnisse sind ausglendet. Klicken Sie auf die rechts gelisteten Dateien, um die dazugehörigen Ergebnisse anzuzeigen.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Es gibt keine CSS-Regeln, die zu Ihrer Auswahl passen.<br> Klicken Sie auf \"Neue Regel\", um eine neue Regel zu erstellen.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Es gibt keine Stylesheets in Ihrem Projekt.<br>Erstellen Sie eines, um CSS-Regeln hinzuzufügen.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "größtes",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "Pixel",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "ERRORS"                                    : "Fehler",
    "CMD_SHOW_DEV_TOOLS"                        : "Entwicklungswerkzeuge zeigen",
    "CMD_REFRESH_WINDOW"                        : "Mit Erweiterungen neu laden",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Ohne Erweiterungen neu laden",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Neues {APP_NAME}-Fenster",
    "CMD_SWITCH_LANGUAGE"                       : "Sprache wechseln",
    "CMD_RUN_UNIT_TESTS"                        : "Tests durchführen",
    "CMD_SHOW_PERF_DATA"                        : "Performance-Analyse",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Node-Debugger aktivieren",
    "CMD_LOG_NODE_STATE"                        : "Node-Status in Konsole anzeigen",
    "CMD_RESTART_NODE"                          : "Node neu starten",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Zeige Fehler in der Statusleiste",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Brackets-Quellcode anzeigen",

    "LANGUAGE_TITLE"                            : "Sprache wechseln",
    "LANGUAGE_MESSAGE"                          : "Sprache:",
    "LANGUAGE_SUBMIT"                           : "{APP_NAME} neu starten",
    "LANGUAGE_CANCEL"                           : "Abbrechen",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Systemstandard",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Zeit",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Verlauf",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Ausgewählten Punkt bewegen<br><kbd class='text'>Umschalt</kbd> Um 10 Einheiten bewegen<br><kbd class='text'>Tab</kbd> Zwischen Punkten wechseln",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Stufenzahl vergrößern oder verkleinern<br><kbd>←</kbd><kbd>→</kbd> 'Start' oder 'Ende'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Der Code im Dokument <code>{0}</code> ist nicht korrekt, daher wird die Funktion <code>{1}</code> angezeigt. Die Änderungen werden bei der ersten Bearbeitung ins Dokument übernommen.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Aktuelle Farbe",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Original-Farbe",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa-Format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex-Format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa-Format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} ({1} Mal verwendet)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} ({1} Mal verwendet)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Springe zur Definition",
    "CMD_SHOW_PARAMETER_HINT"                   : "Parameter-Hinweis anzeigen",
    "NO_ARGUMENTS"                              : "<keine Parameter>",
    "DETECTED_EXCLUSION_TITLE"                  : "Problem mit einer JavaScript-Datei",
    "DETECTED_EXCLUSION_INFO"                   : "Brackets hat Probleme damit, <span class='dialog-filename'>{0}</span> zu verarbeiten.<br><br>Code-Vervollständigung, Springen zur Definition und Schnelles Bearbeiten werden für die Datei nicht mehr bereitgestellt. Öffnen Sie <code>.brackets.json</code> in diesem Projekt und entfernen Sie den Dateipfad von <code>jscodehints.detectedExclusions</code>, um diese Datei wieder einzuschließen.<br><br>Das ist wahrscheinlich ein Bug in Brackets. <a href='https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue'>Melden Sie den Fehler</a> bitte, falls Sie eine Kopie dieser Datei bereitstellen können. Verlinken Sie in diesem Fall die oben genannte Datei.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Schnelle Farbansicht",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Zuletzt verwendete Projekte",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Weiterlesen"
});

/* Last translated for c292e896761bc7d451a9e3b95bedd20d6b355d77 */
