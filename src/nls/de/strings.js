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
    "ERROR_DELETING_FILE_TITLE"         : "Fehler beim Löschen der Datei",
    "ERROR_DELETING_FILE"               : "Beim Löschen der Datei <span class='dialog-filename'>{0}</span> ist ein Fehler aufgetreten. {1}",
    "INVALID_FILENAME_TITLE"            : "Ungültiger Dateiname",
    "INVALID_FILENAME_MESSAGE"          : "Dateinamen dürfen folgende Zeichen nicht enthalten: /?*:;{}<>\\| Auch dürfen keine vom System reservierten Wörter vorkommen.",
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
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Laden der Live-Vorschau nicht möglich",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Öffnen Sie eine HTML-Datei, um die Live-Vorschau zu starten.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Zum Starten der Live-Vorschau mit einer serverseitigen Datei müssen Sie eine Basis-URL für dieses Projekt angeben.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Ein Fehler ist beim Starten des HTTP-Servers oder der Live-Vorschau-Dateien aufgetreten. Bitte versuchen Sie es später erneut.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Willkommen bei der Live-Vorschau!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Die Live-Vorschau verbindet {APP_NAME} mit Ihrem Browser. Sie startet eine Vorschau Ihrer HTML-Datei im Browser, und aktualisiert die Vorschau dann sofort, wenn Sie Ihren Code bearbeiten.<br /><br />In dieser frühen Version von {APP_NAME} funktioniert die Live-Vorschau nur beim Bearbeiten von <strong>CSS-Dateien</strong> und nur mit <strong>Google Chrome</strong>. Wir werden sie bald für HTML und JavaScript implementieren!<br /><br />(Sie sehen diese Meldung nur einmal.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Weitere Informationen finden Sie unter dem Thema <a class=\"clickable-link\" data-href=\"{0}\">Fehlerbehebung bei Verbindungs-Fehlern der Live-Entwicklung</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live-Vorschau",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live-Vorschau: Verbinden\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live-Vorschau: Initialisieren\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Live-Vorschau trennen",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live-Vorschau: Klicken, um Verbindung zu trennen (Zum Aktualisieren Datei speichern)",
    
    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Die Live-Vorschau wurde abgebrochen, weil die Entwickler-Tools des Browsers geöffnet wurden",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Die Live-Vorschau wurde abgebrochen, die Seite im Browser geschlossen wurde",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Die Live-Vorschau wurde abgebrochen, weil der Browser eine Seite geladen hat, die nicht Teil des aktuellen Projekts ist",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Die Live-Vorschau wurde aus einem unbekannten Grund abgebrochen ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Änderungen speichern",
    "SAVE_CLOSE_MESSAGE"                : "Wollen Sie die Änderungen in dem Dokument <span class='dialog-filename'>{0}</span> speichern?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Wollen Sie Ihre Änderungen in den folgenden Dateien speichern?",
    "EXT_MODIFIED_TITLE"                : "Externe Änderungen",
    "FILE_DELETED_TITLE"                : "Datei gelöscht",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> wurde extern geändert und hat ungespeicherte Änderungen in {APP_NAME}." +
                                                "<br /><br />" +
                                                "Welche Version wollen Sie weiter verwenden?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> wurde extern gelöscht und hat ungespeicherte Änderungen in {APP_NAME}." +
                                                "<br /><br />" +
                                                "Wollen Sie die Änderungen beibehalten?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "/re/-Syntax zum Suchen mit regulären Ausdrücken verwenden",
    "FIND_RESULT_COUNT"                 : "{0} Ergebnisse",
    "WITH"                              : "Mit",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nein",
    "BUTTON_STOP"                       : "Stopp",

    "OPEN_FILE"                         : "Datei öffnen",
    "SAVE_FILE_AS"                      : "Datei speichern",
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
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klicken, um Einrückung auf Leerzeichen umzuschalten",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klicken, um Einrückung auf Tabs umzuschalten",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klicken, um die Anzahl Leerzeichen beim Einrücken zu ändern",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klicken, um die Schrittweite von Tabs zu ändern",
    "STATUSBAR_SPACES"                      : "Leerzeichen",
    "STATUSBAR_TAB_SIZE"                    : "Tab-Schrittweite",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Zeile",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Zeilen",

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
    "CMD_FILE_SAVE_ALL"                   : "Alles speichern",
    "CMD_FILE_SAVE_AS"                    : "Speichern unter\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live-Vorschau",
    "CMD_LIVE_HIGHLIGHT"                  : "Live-Highlight",
    "CMD_PROJECT_SETTINGS"                : "Projekt-Einstellungen\u2026",
    "CMD_FILE_RENAME"                     : "Umbenennen\u2026",
    "CMD_FILE_DELETE"                     : "Löschen",
    "CMD_INSTALL_EXTENSION"               : "Erweiterung installieren\u2026",
    "CMD_EXTENSION_MANAGER"               : "Erweiterungs-Verwaltung\u2026",
    "CMD_FILE_REFRESH"                    : "Aktualisieren",
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
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Nach Hinzufügen-Datum sortieren",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Nach Name sortieren",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Nach Typ sortieren",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatisch sortieren",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigation",
    "CMD_QUICK_OPEN"                      : "Schnell öffnen",
    "CMD_GOTO_LINE"                       : "Gehe zur Zeile",
    "CMD_GOTO_DEFINITION"                 : "Definition schnell finden",
    "CMD_TOGGLE_QUICK_EDIT"               : "Schnell bearbeiten",
    "CMD_TOGGLE_QUICK_DOCS"               : "Schnell-Dokumentation",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Voriger Treffer",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Nächster Treffer",
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

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Fenster schließen",
    "CMD_ABORT_QUIT"                      : "Beenden abbrechen",
    "CMD_BEFORE_MENUPOPUP"                : "Vor Menü-Popup",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Experimenteller Build",
    "DEVELOPMENT_BUILD"                    : "Entwicklungs-Build",
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
    "CLOSE"                                : "Schließen",
    "ABOUT_TEXT_LINE1"                     : "Sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Hinweise, Bestimmungen und Bedingungen, die sich auf Drittanbieter-Software beziehen, finden sich unter <a class=\"clickable-link\" data-href=\"{ADOBE_THIRD_PARTY}\">{ADOBE_THIRD_PARTY}</a> und sind hier durch Bezugnahme eingeschlossen.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentation und Quellcode unter <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Gemacht mit \u2764 und JavaScript von:",
    "ABOUT_TEXT_LINE6"                     : "…vielen Leuten (…leider haben wir aber gerade Probleme, diese Daten zu laden).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform-Dokumente und das grafische Logo von Web Platform sind unter einer Creative-Commons-Namensnennungs-Lizenz lizenziert, <a class=\"clickable-link\" data-href=\"{WEB_PLATFORM_DOCS_LICENSE}\">CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Eine neue Version von {APP_NAME} ist verfügbar! Für Details hier klicken.",
    "UPDATE_AVAILABLE_TITLE"               : "Update verfügbar",
    "UPDATE_MESSAGE"                       : "Hallo! Eine neue Version von {APP_NAME} ist verfügbar. Hier einige der neuen Funktionen:",
    "GET_IT_NOW"                           : "Jetzt updaten!",
    "PROJECT_SETTINGS_TITLE"               : "Projekt-Einstellungen",
    "PROJECT_SETTING_BASE_URL"             : "Basis-URL für Live-Vorschau",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(um einen lokalen Server zu verwenden, URL angeben)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Das Protokoll {0} wird von der Live-Vorschau nicht unterstützt &ndash; bitte http: oder https: verwenden.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Die Basis-URL kann keine Such-Parameter wie \"{0}\" enthalten.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Die Basis-URL kann keine Hashes wie \"{0}\" enthalten.",
    "BASEURL_ERROR_INVALID_CHAR"           : "Sonderzeichen wie  \"{0}\" müssen %-kodiert werden.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Unbekannter Fehler beim Verarbeiten der Basis-URL",

    // Extension Management strings
    "INSTALL"                              : "Installieren",
    "REMOVE"                               : "Entfernen",
    "OVERWRITE"                            : "Überschreiben",
    "CANT_REMOVE_DEV"                      : "Erweiterungen im \"dev\"-Ordner müssen manuell gelöscht werden.",
    "INSTALL_EXTENSION_TITLE"              : "Erweiterung installieren",
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
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Fehler beim Zugriff auf die Registrierung für Erweiterungen. Bitte später erneut versuchen.",
    "INSTALL_FROM_URL"                     : "Von URL installieren\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Datum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Diese Erweiterung benötigt eine neuere Version von {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Diese Erweiterung funktioniert momentan nur mit älteren Versionen von {APP_NAME}.",
    "EXTENSION_NO_DESCRIPTION"             : "Keine Beschreibung",
    "EXTENSION_MORE_INFO"                  : "Mehr Informationen\u2026",
    "EXTENSION_ERROR"                      : "Erweiterungs-Fehler",
    "EXTENSION_KEYWORDS"                   : "Schlüsselwörter",
    "EXTENSION_INSTALLED"                  : "Installiert",
    "EXTENSION_UPDATE_INSTALLED"           : "Dieses Erweiterungs-Update wurde heruntergeladen und wird installiert, wenn Sie {APP_NAME} beenden.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Suchen",
    "EXTENSION_MORE_INFO_LINK"             : "Mehr",
    "BROWSE_EXTENSIONS"                    : "Erweiterungen durchsuchen",
    "EXTENSION_MANAGER_REMOVE"             : "Erweiterung entfernen",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Fehler beim Entfernen der Erweiterung: {0}. {APP_NAME} wird trotzdem beendet.",
    "EXTENSION_MANAGER_UPDATE"             : "Erweiterung aktualisieren",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Fehler beim Aktualisieren von einer oder mehreren Erweiterung(en): {0}. {APP_NAME} wird trotzdem beendet.",
    "MARKED_FOR_REMOVAL"                   : "Zur Entfernung markiert",
    "UNDO_REMOVE"                          : "Rückgängig",
    "MARKED_FOR_UPDATE"                    : "Zur Aktualisierung markiert",
    "UNDO_UPDATE"                          : "Rückgängig",
    "CHANGE_AND_QUIT_TITLE"                : "Erweiterungen ändern",
    "CHANGE_AND_QUIT_MESSAGE"              : "Um die markierten Erweiterungen zu aktualisieren oder zu entfernen, müssen Sie {APP_NAME} beenden und neu starten. Sie werden gefragt, ob ungespeicherte Änderungen gespeichert werden sollen.",
    "REMOVE_AND_QUIT"                      : "Erweiterungen entfernen und beenden",
    "CHANGE_AND_QUIT"                      : "Erweiterungen ändern und beenden",
    "UPDATE_AND_QUIT"                      : "Erweiterungen aktualisieren und beenden",
    "EXTENSION_NOT_INSTALLED"              : "Die Erweiterung {0} konnte nicht entfernt werden, weil sie nicht installiert ist.",
    "NO_EXTENSIONS"                        : "Momentan sind keine Erweiterungen installiert.<br>Klicken Sie unten auf \"Von URL installieren\", um zu beginnen.",
    "NO_EXTENSION_MATCHES"                 : "Keine Erweiterungen passen auf Ihre Suchanfrage.",
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "Pixel",
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "CMD_SHOW_DEV_TOOLS"                        : "Entwicklungswerkzeuge zeigen",
    "CMD_REFRESH_WINDOW"                        : "{APP_NAME} neu laden",
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
    
    /**
     * Locales
     */
    "LOCALE_DE"                                 : "Deutsch",
    "LOCALE_EN"                                 : "Englisch",
    "LOCALE_FR"                                 : "Französisch",
    "LOCALE_CS"                                 : "Tschechisch",
    "LOCALE_ES"                                 : "Spanisch",
    "LOCALE_IT"                                 : "Italienisch",
    "LOCALE_JA"                                 : "Japanisch",
    "LOCALE_NB"                                 : "Norwegisch",
    "LOCALE_PL"                                 : "Polnisch",
    "LOCALE_PT_BR"                              : "Portugiesisch, Brasilien",
    "LOCALE_PT_PT"                              : "Portugiesisch",
    "LOCALE_RU"                                 : "Russisch",
    "LOCALE_SV"                                 : "Schwedisch",
    "LOCALE_TR"                                 : "Türkisch",
    "LOCALE_ZH_CN"                              : "Chinesisch, vereinfacht",
    
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
    
    // extensions/default/JSLint
    "CMD_JSLINT"                                : "JSLint aktivieren",
    "CMD_JSLINT_FIRST_ERROR"                    : "Gehe zu erstem JSLint-Fehler",
    "JSLINT_ERRORS"                             : "JSLint-Fehler",
    "JSLINT_ERROR_INFORMATION"                  : "1 JSLint-Fehler",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} JSLint-Fehler",
    "JSLINT_NO_ERRORS"                          : "Keine JSLint-Fehler – gute Arbeit!",
    "JSLINT_DISABLED"                           : "JSLint ist deaktiviert oder funktioniert nicht für die aktuelle Datei",

    // extensions/default/QuickView 
    "CMD_ENABLE_QUICK_VIEW"                : "Schnellansicht bei Hover",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Weiterlesen"
});
