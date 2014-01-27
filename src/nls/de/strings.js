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
    "CONTENTS_MODIFIED_ERR"             : "Die Datei wurde außerhalb von {APP_NAME} verändert.",
    "FILE_EXISTS_ERR"                   : "Die Datei existiert bereits.",
    "FILE"                              : "Datei",
    "DIRECTORY"                         : "Verzeichnis",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Fehler beim Laden des Projekts",
    "OPEN_DIALOG_ERROR"                 : "Fehler beim Erstellen des Datei-Öffnen-Dialogs. (Fehler {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Fehler beim Lesen des Verzeichnisses <span class='dialog-filename'>{0}</span>. (Fehler {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Fehler beim Lesen der Verzeichnisinhalte von <span class='dialog-filename'>{0}</span>. (Fehler {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Fehler beim Öffnen der Datei",
    "ERROR_OPENING_FILE"                : "Beim Öffnen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_OPENING_FILES"               : "Beim Öffnen folgender Dateien ist ein Fehler aufgetreten:",
    "ERROR_RELOADING_FILE_TITLE"        : "Fehler beim Laden der Änderungen",
    "ERROR_RELOADING_FILE"              : "Beim Laden der Änderungen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Fehler beim Speichern der Datei",
    "ERROR_SAVING_FILE"                 : "Beim Speichern der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Fehler beim Umbenennen der Datei",
    "ERROR_RENAMING_FILE"               : "Beim Umbenennen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten: {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Fehler beim Löschen der Datei",
    "ERROR_DELETING_FILE"               : "Beim Löschen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten. {1}",
    "INVALID_FILENAME_TITLE"            : "Ungültiger {0}name",
    "INVALID_FILENAME_MESSAGE"          : "Dateinamen dürfen folgende Zeichen nicht enthalten: {0} Auch dürfen keine vom System reservierten Wörter vorkommen.",
    "FILE_ALREADY_EXISTS"               : "{0} <span class='dialog-filename'>{1}</span> existiert bereits.", // TODO: depends on {0} gender
    "ERROR_CREATING_FILE_TITLE"         : "Fehler beim Erstellen von {0}", // TODO: depends on {0} gender
    "ERROR_CREATING_FILE"               : "Beim Erstellen von {0} <span class='dialog-filename'>{1}</span> ist ein Fehler aufgetreten: {2}", // TODO: depends on {0} gender

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} kann derzeit leider noch nicht im Browser ausgeführt werden.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} wurde in HTML programmiert, ist derzeit jedoch lediglich als Desktop-Anwendung verfügbar, um damit lokale Dateien zu bearbeiten. Bitte verwenden Sie die Anwendungs-Shell im Repo <b>github.com/adobe/brackets-shell</b>, um {APP_NAME} auszuführen.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Fehler beim Indizieren der Dateien",
    "ERROR_MAX_FILES"                   : "Die maximal mögliche Anzahl indizierbarer Dateien wurde überschritten. Funktionen, die auf dem Index beruhen, werden möglicherweise nicht korrekt ausgeführt.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Fehler beim Starten des Browsers",
    "ERROR_CANT_FIND_CHROME"            : "Der Browser Google Chrome konnte nicht gefunden werden. Bitte stellen Sie sicher, dass er installiert ist.",
    "ERROR_LAUNCHING_BROWSER"           : "Beim Starten des Browsers ist ein Fehler aufgetreten. (Fehler {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Fehler bei der Live-Vorschau",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Verbinden zum Browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Um die Live-Vorschau zu verwenden, muss Chrome mit aktiviertem Remote-Debugging neu gestartet werden.<br /><br />Soll Chrome neu gestartet werden, um das Remote Debugger Protokoll zu aktivieren?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Laden der Live-Vorschau nicht möglich",
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
    "FIND_RESULT_COUNT"                 : "{0} Ergebnisse",
    "FIND_RESULT_COUNT_SINGLE"          : "1 Ergebnis",
    "FIND_NO_RESULTS"                   : "Keine Ergebnisse",
    "REPLACE_PLACEHOLDER"               : "Ersetzen mit\u2026",
    "BUTTON_REPLACE_ALL"                : "Alle\u2026",
    "BUTTON_REPLACE"                    : "Ersetzen",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Nächster Treffer",
    "BUTTON_PREV_HINT"                  : "Vorheriger Treffer",
    "BUTTON_CASESENSITIVE_HINT"         : "Groß-/Kleinschreibung beachten",
    "BUTTON_REGEXP_HINT"                : "Regulärer Ausdruck",

    "OPEN_FILE"                         : "Datei öffnen",
    "SAVE_FILE_AS"                      : "Datei speichern",
    "CHOOSE_FOLDER"                     : "Ordner wählen",

    "RELEASE_NOTES"                     : "Release-Notes",
    "NO_UPDATE_TITLE"                   : "Sie sind auf dem Laufenden!",
    "NO_UPDATE_MESSAGE"                 : "Sie führen die neuste Version von {APP_NAME} aus.",

    // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1"          : "\"",
    "FIND_REPLACE_TITLE_PART2"          : "\" durch \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" ersetzen &mdash; {2} {0} {1}",

    // Find in Files
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" gefunden",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} in {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "in Projekt",
    "FIND_IN_FILES_FILE"                : "Datei",
    "FIND_IN_FILES_FILES"               : "Dateien",
    "FIND_IN_FILES_MATCH"               : "Treffer",
    "FIND_IN_FILES_MATCHES"             : "Treffer",
    "FIND_IN_FILES_MORE_THAN"           : "Über ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Fehler beim Abrufen der Update-Info",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Beim Abrufen der neusten Update-Informationen vom Server ist ein Problem aufgetreten. Bitte stellen Sie sicher, dass Sie mit dem Internet verbunden sind, und probieren Sie es erneut.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"  : "Lädt\u2026",
    "UNTITLED"         : "Unbenannt",
    "WORKING_FILES"    : "Offene Dateien",

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
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klicken, um Einrückung auf Leerzeichen umzuschalten",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klicken, um Einrückung auf Tabs umzuschalten",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klicken, um die Anzahl Leerzeichen beim Einrücken zu ändern",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klicken, um die Schrittweite von Tabs zu ändern",
    "STATUSBAR_SPACES"                      : "Leerzeichen:",
    "STATUSBAR_TAB_SIZE"                    : "Tab-Schrittweite:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Zeile",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Zeilen",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Erweiterungen deaktiviert",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Probleme",
    "SINGLE_ERROR"                          : "1 {0} Fehler",
    "MULTIPLE_ERRORS"                       : "{1} {0} Fehler",
    "NO_ERRORS"                             : "Keine {0} Fehler - gute Arbeit!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Keine Fehler - gute Arbeit!",
    "LINT_DISABLED"                         : "Das Linten ist nicht aktiviert",
    "NO_LINT_AVAILABLE"                     : "Es ist kein Linter für {0} verfügbar",
    "NOTHING_TO_LINT"                       : "Es gibt nichts zum Linten",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Datei",
    "CMD_FILE_NEW_UNTITLED"               : "Neu",
    "CMD_FILE_NEW"                        : "Neue Datei",
    "CMD_FILE_NEW_FOLDER"                 : "Neuer Ordner",
    "CMD_FILE_OPEN"                       : "Öffnen\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Zum Projekt hinzufügen",
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
    "CMD_FIND"                            : "Suchen",
    "CMD_FIND_FIELD_PLACEHOLDER"          : "Suchen\u2026",
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
    "CMD_OPEN_LINE_ABOVE"                 : "Zeile darüber öffnen",
    "CMD_OPEN_LINE_BELOW"                 : "Zeile darunter öffnen",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Klammern automatisch schließen",
    "CMD_SHOW_CODE_HINTS"                 : "Code-Vervollständigung anzeigen",

    // View menu commands
    "VIEW_MENU"                           : "Ansicht",
    "CMD_HIDE_SIDEBAR"                    : "Seitenleiste verbergen",
    "CMD_SHOW_SIDEBAR"                    : "Seitenleiste zeigen",
    "CMD_INCREASE_FONT_SIZE"              : "Schriftart vergrößern",
    "CMD_DECREASE_FONT_SIZE"              : "Schriftart verkleinern",
    "CMD_RESTORE_FONT_SIZE"               : "Schriftart zurücksetzen",
    "CMD_SCROLL_LINE_UP"                  : "Zeile hoch scrollen",
    "CMD_SCROLL_LINE_DOWN"                : "Zeile runter scrollen",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Zeilennummern anzeigen",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Aktive Zeile hervorheben",
    "CMD_TOGGLE_WORD_WRAP"                : "Zeilenumbruch aktivieren",
    "CMD_LIVE_HIGHLIGHT"                  : "Live-Vorschau Highlight",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Beim Speichern linten",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Nach Hinzufügen-Datum sortieren",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Nach Name sortieren",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Nach Typ sortieren",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatisch sortieren",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigation",
    "CMD_QUICK_OPEN"                      : "Schnell öffnen",
    "CMD_GOTO_LINE"                       : "Gehe zur Zeile",
    "CMD_GOTO_DEFINITION"                 : "Definition schnell finden",
    "CMD_GOTO_FIRST_PROBLEM"              : "Zum ersten Fehler/zur ersten Warnung gehen",
    "CMD_TOGGLE_QUICK_EDIT"               : "Schnell bearbeiten",
    "CMD_TOGGLE_QUICK_DOCS"               : "Schnell-Dokumentation",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Voriger Treffer",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Nächster Treffer",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Neue Regel",
    "CMD_NEXT_DOC"                        : "Nächstes Dokument",
    "CMD_PREV_DOC"                        : "Voriges Dokument",
    "CMD_SHOW_IN_TREE"                    : "Im Dateibaum anzeigen",
    "CMD_SHOW_IN_OS"                      : "Im Dateisystem anzeigen",

    // Help menu commands
    "HELP_MENU"                           : "Hilfe",
    "CMD_CHECK_FOR_UPDATE"                : "Nach Updates suchen",
    "CMD_HOW_TO_USE_BRACKETS"             : "So verwendet man {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME}-Forum",
    "CMD_RELEASE_NOTES"                   : "Versionshinweise",
    "CMD_REPORT_AN_ISSUE"                 : "Ein Problem melden",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Erweiterungen-Ordner anzeigen",
    "CMD_TWITTER"                         : "{TWITTER_NAME} auf Twitter",
    "CMD_ABOUT"                           : "Über {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Einstellungsdatei öffnen",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Experimenteller Build",
    "DEVELOPMENT_BUILD"                    : "Entwicklungs-Build",
    "RELOAD_FROM_DISK"                     : "Von der Festplatte neu laden",
    "KEEP_CHANGES_IN_EDITOR"               : "Änderungen im Editor behalten",
    "CLOSE_DONT_SAVE"                      : "Schließen (nicht speichern)",
    "RELAUNCH_CHROME"                      : "Chrome neu starten",
    "ABOUT"                                : "Über",
    "CLOSE"                                : "Schließen",
    "ABOUT_TEXT_LINE1"                     : "Sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
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
    "PROJECT_SETTING_BASE_URL_HINT"        : "(um einen lokalen Server zu verwenden, URL angeben)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Das Protokoll {0} wird von der Live-Vorschau nicht unterstützt &ndash; bitte http: oder https: verwenden.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Die Basis-URL kann keine Such-Parameter wie \"{0}\" enthalten.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Die Basis-URL kann keine Hashes wie \"{0}\" enthalten.",
    "BASEURL_ERROR_INVALID_CHAR"           : "Sonderzeichen wie  \"{0}\" müssen %-kodiert werden.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Unbekannter Fehler beim Verarbeiten der Basis-URL",

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
    "INSTALL_FROM_URL"                     : "Von URL installieren\u2026",
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
    "REGISTRY_SANITY_CHECK_WARNING"        : "Seien Sie vorsichtig, wenn sie Erweiterungen von einer unbekannten Quelle installieren.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Installiert",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Verfügbar",
    "EXTENSIONS_UPDATES_TITLE"             : "Updates",

    "INLINE_EDITOR_NO_MATCHES"             : "Keine Ergebnisse verfügbar.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Es gibt keine CSS-Regeln, die zu Ihrer Auswahl passen.<br> Klicken Sie auf \"Neue Regel\", um eine neue Regel zu erstellen.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Es gibt keine Stylesheets in Ihrem Projekt.<br>Erstellen Sie eines, um CSS-Regeln hinzuzufügen.",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "Pixel",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
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

    "LANGUAGE_TITLE"                            : "Sprache wechseln",
    "LANGUAGE_MESSAGE"                          : "Sprache:",
    "LANGUAGE_SUBMIT"                           : "{APP_NAME} neu starten",
    "LANGUAGE_CANCEL"                           : "Abbrechen",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Systemstandard",

    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "Tschechisch",
    "LOCALE_DE"                                 : "Deutsch",
    "LOCALE_EL"                                 : "Griechisch",
    "LOCALE_EN"                                 : "Englisch",
    "LOCALE_ES"                                 : "Spanisch",
    "LOCALE_FA_IR"                              : "Persisch (Farsi)",
    "LOCALE_FI"                                 : "Finnisch",
    "LOCALE_FR"                                 : "Französisch",
    "LOCALE_IT"                                 : "Italienisch",
    "LOCALE_JA"                                 : "Japanisch",
    "LOCALE_NB"                                 : "Norwegisch",
    "LOCALE_NL"                                 : "Niederländisch",
    "LOCALE_PL"                                 : "Polnisch",
    "LOCALE_PT_BR"                              : "Portugiesisch, Brasilien",
    "LOCALE_PT_PT"                              : "Portugiesisch",
    "LOCALE_RO"                                 : "Rumänisch",
    "LOCALE_RU"                                 : "Russisch",
    "LOCALE_SK"                                 : "Slowakisch",
    "LOCALE_SR"                                 : "Serbisch",
    "LOCALE_SV"                                 : "Schwedisch",
    "LOCALE_TR"                                 : "Türkisch",
    "LOCALE_ZH_CN"                              : "Chinesisch, vereinfacht",
    "LOCALE_HU"                                 : "Ungarisch",
    "LOCALE_KO"                                 : "Koreanisch",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Zeit",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Verlauf",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Ausgewählten Punkt bewegen<br><kbd class='text'>Umschalt</kbd> Um 10 Einheiten bewegen<br><kbd class='text'>Tab</kbd> Zwischen Punkten wechseln",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Stufenzahl vergrößern oder verkleinern<br><kbd>←</kbd><kbd>→</kbd> 'Start' oder 'Ende'",

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

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                : "Schnelle Farbansicht",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Zuletzt verwendete Projekte",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Weiterlesen"
});
