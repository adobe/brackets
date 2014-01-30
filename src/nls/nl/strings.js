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
    "GENERIC_ERROR"                     : "(fout {0})",
    "NOT_FOUND_ERR"                     : "Het bestand kon niet worden gevonden.",
    "NOT_READABLE_ERR"                  : "Het bestand kon niet worden ingelezen.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "De doelmap kan niet gewijzigd worden.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "De bevoegdheden laten u niet toe enige wijzigingen aan te brengen.",
    "FILE_EXISTS_ERR"                   : "Het bestand of de map bestaat al.",
    "FILE"                              : "bestand",
    "DIRECTORY"                         : "map",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Probleem tijdens het laden van het project",
    "OPEN_DIALOG_ERROR"                 : "Er is een fout opgetreden bij het tonen van het dialoogvenster om een bestand te openen. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Er is een fout opgetreden bij het laden van map <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Er is een fout opgetreden bij het lezen van de inhoud van map <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Probleem bij het openen van een bestand",
    "ERROR_OPENING_FILE"                : "Er is een fout opgetreden bij het openen van het bestand <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Er is een fout opgetreden bij het openen van de volgende bestanden:",
    "ERROR_RELOADING_FILE_TITLE"        : "Probleem bij het herladen van wijzigingen op de schijf",
    "ERROR_RELOADING_FILE"              : "Er is een fout opgetreden bij het herladen van het bestand <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Probleem bij het opslaan van een bestand",
    "ERROR_SAVING_FILE"                 : "Er is een fout opgetreden bij het opslaan van het bestand <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Probleem bij het hernoemen van een bestand",
    "ERROR_RENAMING_FILE"               : "Er is een fout opgetreden bij het hernoemen van het bestand <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Probleem bij het verwijderen van een bestand",
    "ERROR_DELETING_FILE"               : "Er is een fout opgetreden bij het verwijderen van het bestand <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Ongeldige {0} naam",
    "INVALID_FILENAME_MESSAGE"          : "Bestandsnamen kunnen de volgende karakters niet bevatten: {0} of gebruik maken van woorden die door het systeem zijn gereserveerd.",
    "FILE_ALREADY_EXISTS"               : "Het {0} <span class='dialog-filename'>{1}</span> bestaat al.",
    "ERROR_CREATING_FILE_TITLE"         : "Probleem bij het aanmaken van een {0}",
    "ERROR_CREATING_FILE"               : "Er is een fout opgetreden bij het aanmaken van het {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oeps! {APP_NAME} werkt nog niet in browsers.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} is gebouwd in HTML, maar op dit moment werkt het als desktop applicatie zodat je het kan gebruiken om lokale bestanden te bewerken. Gebruik graag de applicatie omgeving op <b>github.com/adobe/brackets-shell</b> om {APP_NAME} te starten.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Probleem bij het indexeren van bestanden",
    "ERROR_MAX_FILES"                   : "Het maximum aantal bestanden is geïndexeerd. Het kan zijn dat acties om bestanden op te zoeken in de index niet correct verlopen.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Probleem bij het starten in de browser",
    "ERROR_CANT_FIND_CHROME"            : "De Google Chrome browser kon niet gevonden worden. Zorg ervoor dat deze geïnstalleerd is.",
    "ERROR_LAUNCHING_BROWSER"           : "Er is een fout opgetreden bij het starten van de browser. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Probleem met Live Voorbeeld",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Bezig met verbinden met de browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Om met Live Voorbeeld te verbinden, moet Chrome opnieuw gestart worden met debugging op afstand ingeschakeld.<br /><br />Wil je Chrome herstarten en debugging op afstand inschakelen?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Onmogelijk om de Live Ontwikkeling pagina te laden",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Open een HTML bestand om Live Voorbeeld te starten.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Om live voorbeeld te starten met een server-side bestand, moet je een Start URL voor dit project definiëren.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Er is een fout opgetreden bij het opstarten van de HTTP server voor live ontwikkeling bestanden. Probeer alsjeblieft opnieuw.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Welkom bij Live Voorbeeld!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Voorbeeld verbindt {APP_NAME} met je browser. Het toont een voorbeeld van je HTML bestand in de browser, vervolgens updatet het voorbeeld onmiddelijk bij het wijzigen van je code.<br /><br />In deze vroege versie van {APP_NAME}, werkt Live Voorbeeld enkel met <strong>Google Chrome</strong> en updatet live bij het wijzigen van <strong>CSS of HTML bestanden</strong>. Wijzigingen aan JavaScript bestanden worden automatisch herladen wanneer je bewaart.<br /><br />(Je zal dit bericht slechts eenmaal zien.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Voor meer informatie zie, see <a href='{0}' title='{0}'>Oplossen van Live Ontwikkeling verbindingsproblemen</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Voorbeeld",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Voorbeeld: Bezig met verbinden\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Voorbeeld: Initialiseren\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Verbreek verbinding met Live Voorbeeld",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Voorbeeld (sla bestand op om te verversen)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Voorbeeld (niet bezig met updaten door een verkeerde syntax)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Live Voorbeeld is geannuleerd omdat de developer tools in de browser zijn geopend",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Live Voorbeeld is geannuleerd omdat de pagina gesloten werd in de browser",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Live Voorbeeld is geannuleerd omdat de browser navigeerde naar een pagina die geen deel uit maakt van het huidige project",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Live Voorbeeld is geannuleerd om een onbekende reden ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Opslaan van wijzigingen",
    "SAVE_CLOSE_MESSAGE"                : "Wil je de wijzigingen opslaan die je maakte in het document <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Wil je je wijzigingen van de volgende bestanden opslaan?",
    "EXT_MODIFIED_TITLE"                : "Externe Wijzigingen",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Bevestig Verwijdering",
    "CONFIRM_FOLDER_DELETE"             : "Ben je zeker dat je de map <span class='dialog-filename'>{0}</span> wil verwijderen?",
    "FILE_DELETED_TITLE"                : "Bestand Verwijderd",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> is gewijzigd op de schijf, maar heeft ook onbewaarde wijzigingen in {APP_NAME}.<br /><br />Welke versie wil je behouden?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> is verwijderd op de schijf, maar heeft onbewaarde wijzigingen in {APP_NAME}.<br /><br />Wil je je wijzigingen behouden?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Gebruik de /re/ syntax voor een regexp zoekopdracht",
    "FIND_RESULT_COUNT"                 : "{0} resultaten",
    "FIND_RESULT_COUNT_SINGLE"          : "1 resultaat",
    "FIND_NO_RESULTS"                   : "Geen resultaten",
    "WITH"                              : "Met",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nee",
    "BUTTON_REPLACE_ALL"                : "Alle\u2026",
    "BUTTON_STOP"                       : "Stop",
    "BUTTON_REPLACE"                    : "Vervang",
            
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Volgende Overeenkomst",
    "BUTTON_PREV_HINT"                  : "Vorige Overeenkomst",

    "OPEN_FILE"                         : "Open Bestand",
    "SAVE_FILE_AS"                      : "Bewaar Bestand",
    "CHOOSE_FOLDER"                     : "Kies een map",

    "RELEASE_NOTES"                     : "Release Notes",
    "NO_UPDATE_TITLE"                   : "Je bent up to date!",
    "NO_UPDATE_MESSAGE"                 : "Je werkt met de laatste versie van {APP_NAME}.",

    "FIND_REPLACE_TITLE_PART1"          : "Vervang \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" met \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" gevonden",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} in {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "in project",
    "FIND_IN_FILES_FILE"                : "bestand",
    "FIND_IN_FILES_FILES"               : "bestanden",
    "FIND_IN_FILES_MATCH"               : "overeenkomst",
    "FIND_IN_FILES_MATCHES"             : "overeenkomsten",
    "FIND_IN_FILES_MORE_THAN"           : "Meer dan ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Probleem bij het ophalen van update informatie",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Er is een fout opgetreden bij het ophalen van de laatste update informatie van de server. Zorg ervoor dat je verbonden bent met het internet en probeer opnieuw.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Laden\u2026",
    "UNTITLED"          : "Naamloos",
    "WORKING_FILES"     : "Werkbestanden",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Regel {0}, Kolom {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} kolom geselecteerd",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} kolommen geselecteerd",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} regel geselecteerd",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} regels geselecteerd",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klik om de indentatie te veranderen naar spaties",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klik om de indentatie te veranderen naar tabs",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klik om het aantal spaties bij indentatie te veranderen",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klik om de breedte van het tab karakter te veranderen",
    "STATUSBAR_SPACES"                      : "Spaties:",
    "STATUSBAR_TAB_SIZE"                    : "Tab Grootte:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Regel",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Regels",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE"                    : "{0} Fouten",
    "SINGLE_ERROR"                          : "1 {0} Fout",
    "MULTIPLE_ERRORS"                       : "{1} {0} Fouten",
    "NO_ERRORS"                             : "Geen {0} fouten - goed zo!",
    "LINT_DISABLED"                         : "Linting is uitgeschakeld",
    "NO_LINT_AVAILABLE"                     : "Er is geen linter beschikbaar voor {0}",
    "NOTHING_TO_LINT"                       : "Niets om te linten",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Bestand",
    "CMD_FILE_NEW_UNTITLED"               : "Nieuw",
    "CMD_FILE_NEW"                        : "Nieuw Bestand",
    "CMD_FILE_NEW_FOLDER"                 : "Nieuwe Map",
    "CMD_FILE_OPEN"                       : "Open\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Voeg Toe Aan Werkset",
    "CMD_OPEN_FOLDER"                     : "Open Map\u2026",
    "CMD_FILE_CLOSE"                      : "Sluit",
    "CMD_FILE_CLOSE_ALL"                  : "Sluit alles",
    "CMD_FILE_SAVE"                       : "Bewaar",
    "CMD_FILE_SAVE_ALL"                   : "Bewaar Alles",
    "CMD_FILE_SAVE_AS"                    : "Bewaar Als\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Voorbeeld",
    "CMD_PROJECT_SETTINGS"                : "Project Instellingen\u2026",
    "CMD_FILE_RENAME"                     : "Hernoem",
    "CMD_FILE_DELETE"                     : "Verwijder",
    "CMD_INSTALL_EXTENSION"               : "Installeer Uitbreiding\u2026",
    "CMD_EXTENSION_MANAGER"               : "Uitbreidingbeheer\u2026",
    "CMD_FILE_REFRESH"                    : "Ververs Bestandsboom",
    "CMD_QUIT"                            : "Stop",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Exit",

    // Edit menu commands
    "EDIT_MENU"                           : "Wijzig",
    "CMD_UNDO"                            : "Herstel",
    "CMD_REDO"                            : "Opnieuw",
    "CMD_CUT"                             : "Knip",
    "CMD_COPY"                            : "Kopieer",
    "CMD_PASTE"                           : "Plak",
    "CMD_SELECT_ALL"                      : "Selecteer Alles",
    "CMD_SELECT_LINE"                     : "Selecteer Regel",
    "CMD_FIND"                            : "Zoek",
    "CMD_FIND_IN_FILES"                   : "Zoek in Mappen",
    "CMD_FIND_IN_SUBTREE"                 : "Zoek in\u2026",
    "CMD_FIND_NEXT"                       : "Zoek Volgende",
    "CMD_FIND_PREVIOUS"                   : "Zoek Vorige",
    "CMD_REPLACE"                         : "Vervang",
    "CMD_INDENT"                          : "Inspringen",
    "CMD_UNINDENT"                        : "Insprong Verwijderen",
    "CMD_DUPLICATE"                       : "Dupliceer",
    "CMD_DELETE_LINES"                    : "Verwijder Regel",
    "CMD_COMMENT"                         : "Zet Regel Commentaar Aan/Uit",
    "CMD_BLOCK_COMMENT"                   : "Zet Blok Commentaar Aan/Uit",
    "CMD_LINE_UP"                         : "Verplaats Regel naar Boven",
    "CMD_LINE_DOWN"                       : "Verplaats Regel naar Beneden",
    "CMD_OPEN_LINE_ABOVE"                 : "Open Regel Boven",
    "CMD_OPEN_LINE_BELOW"                 : "Open Regel Beneden",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Automatisch Accolades Sluiten",
    "CMD_SHOW_CODE_HINTS"                 : "Toon Code Hints",
    
    // View menu commands
    "VIEW_MENU"                           : "Weergave",
    "CMD_HIDE_SIDEBAR"                    : "Verberg Zijbalk",
    "CMD_SHOW_SIDEBAR"                    : "Toon Zijbalk",
    "CMD_INCREASE_FONT_SIZE"              : "Vergroot Lettertype",
    "CMD_DECREASE_FONT_SIZE"              : "Verklein Lettertype",
    "CMD_RESTORE_FONT_SIZE"               : "Herstel Lettertype",
    "CMD_SCROLL_LINE_UP"                  : "Scroll Regel naar Boven",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll Regel naar Beneden",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Regelnummers",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Markeer Actieve Regel",
    "CMD_TOGGLE_WORD_WRAP"                : "Word Wrap",
    "CMD_LIVE_HIGHLIGHT"                  : "Live Voorbeeld Markeren",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint Bestanden bij Opslaan",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Sorteer op Toegevoegd",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Sorteer op Naam",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Sorteer op Type",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatisch Sorteren",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigeer",
    "CMD_QUICK_OPEN"                      : "Open Snel",
    "CMD_GOTO_LINE"                       : "Ga naar Regel",
    "CMD_GOTO_DEFINITION"                 : "Definitie Snel Zoeken",
    "CMD_GOTO_FIRST_PROBLEM"              : "Ga naar de eerstvolgende Fout/Waarschuwing",
    "CMD_TOGGLE_QUICK_EDIT"               : "Wijzig snel",
    "CMD_TOGGLE_QUICK_DOCS"               : "Snel naar Documentatie",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Vorige Overeenkomst",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Volgende Overeenkomst",
    "CMD_NEXT_DOC"                        : "Volgend Document",
    "CMD_PREV_DOC"                        : "Vorig Document",
    "CMD_SHOW_IN_TREE"                    : "Toon in Bestandsboom",
    "CMD_SHOW_IN_OS"                      : "Toon in Besturingssysteem",
    
    // Help menu commands
    "HELP_MENU"                           : "Help",
    "CMD_CHECK_FOR_UPDATE"                : "Controleer op Updates",
    "CMD_HOW_TO_USE_BRACKETS"             : "Hoe gebruik je {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} Forum",
    "CMD_RELEASE_NOTES"                   : "Release Notes",
    "CMD_REPORT_AN_ISSUE"                 : "Rapporteer een probleem",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Toon de Map met Uitbreidingen",
    "CMD_TWITTER"                         : "{TWITTER_NAME} op Twitter",
    "CMD_ABOUT"                           : "Over {APP_TITLE}",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimentele build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Niet opslaan",
    "SAVE"                                 : "Opslaan",
    "CANCEL"                               : "Annuleer",
    "DELETE"                               : "Verwijder",
    "RELOAD_FROM_DISK"                     : "Laad opnieuw van Schijf",
    "KEEP_CHANGES_IN_EDITOR"               : "Behoud veranderingen in Editor",
    "CLOSE_DONT_SAVE"                      : "Sluit (Bewaar Niet)",
    "RELAUNCH_CHROME"                      : "Herstart Chrome",
    "ABOUT"                                : "Over",
    "CLOSE"                                : "Sluit",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Kennisgevingen, voorwaarden en bepalingen met betrekking tot software van derden bevinden zich op <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> en op de pagina's, hierin door verwijzing opgenomen.",
    "ABOUT_TEXT_LINE4"                     : "Documentatie en broncode op <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Gemaakt met \u2764 en JavaScript door:",
    "ABOUT_TEXT_LINE6"                     : "Veel mensen (maar we hebben problemen met het laden van die data op dit moment).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs en het Web Platform grafisch logo zijn gelicentieerd onder een Creative Commons Attribution licentie, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Er is een nieuwe build van {APP_NAME} beschikbaar! Klik hier voor details.",
    "UPDATE_AVAILABLE_TITLE"               : "Update Beschikbaar",
    "UPDATE_MESSAGE"                       : "Hey, er is een nieuwe build van {APP_NAME} beschikbaar. Hier zijn een aantal van de nieuwe functies:",
    "GET_IT_NOW"                           : "Haal het nu!",
    "PROJECT_SETTINGS_TITLE"               : "Project Instellingen voor: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Live Voorbeeld Start URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Om een locale server te gebruiken, voor een url in zoals http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Het {0} protocol wordt niet ondersteund door Live Voorbeeld&mdash;gebruik http: of https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "De start URL kan geen zoekparameters bevatten zoals \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "De start URL kan geen hashes bevatten zoals \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Speciale karakters zoals '{0}' moeten %-geëncodeerd zijn.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Onbekende fout bij het parsen van de Start URL",
    
    // Extension Management strings
    "INSTALL"                              : "Installeer",
    "UPDATE"                               : "Update",
    "REMOVE"                               : "Verwijder",
    "OVERWRITE"                            : "Overschrijf",
    "CANT_REMOVE_DEV"                      : "Uitbreidings in de \"dev\" map moeten manueel verwijderd worden.",
    "CANT_UPDATE"                          : "De update is niet compatibel met deze versie van {APP_NAME}.",
    "INSTALL_EXTENSION_TITLE"              : "Installeer Uitbreiding",
    "UPDATE_EXTENSION_TITLE"               : "Update Uitbreiding",
    "INSTALL_EXTENSION_LABEL"              : "Uitbreiding URL",
    "INSTALL_EXTENSION_HINT"               : "URL van het zip bestand of de GitHup repo van de uitbreiding",
    "INSTALLING_FROM"                      : "Bezig met installeren van uitbreiding van {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Installatie succesvol!",
    "INSTALL_FAILED"                       : "Installatie gefaald.",
    "CANCELING_INSTALL"                    : "Bezig met annuleren\u2026",
    "CANCELING_HUNG"                       : "Het annuleren van de installatie duurt lang. Een intern probleem kan zijn opgetreden.",
    "INSTALL_CANCELED"                     : "Installatie geannuleerd.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "De gedownloade inhoud is geen geldig zip bestand.",
    "INVALID_PACKAGE_JSON"                 : "Het package.json bestand is niet geldig (fout was: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Het package.json specifieert geen pakket naam.",
    "BAD_PACKAGE_NAME"                     : "{0} is een ongeldige pakket naam.",
    "MISSING_PACKAGE_VERSION"              : "Het package.json bestand specifieert geen geldige pakket versie.",
    "INVALID_VERSION_NUMBER"               : "Het pakket versienummer ({0}) is ongeldig.",
    "INVALID_BRACKETS_VERSION"             : "De {APP_NAME} compatibiliteit string ({0}) is ongeldig.",
    "DISALLOWED_WORDS"                     : "De woorden ({1}) zijn niet toegelaten in het {0} veld.",
    "API_NOT_COMPATIBLE"                   : "De uitbreiding is niet compatibel met deze versie van {APP_NAME}. Het werd geïnstalleerd in de map met uitgeschakelde uitbreidingen.",
    "MISSING_MAIN"                         : "Het pakket heeft geen main.js bestand.",
    "EXTENSION_ALREADY_INSTALLED"          : "Het installeren van dit pakket zal een vroeger geïnstalleerde uitbreiding overschrijven. Overschrijf de oudere uitbreiding?",
    "EXTENSION_SAME_VERSION"               : "Dit pakket is dezelfde versie als degene die op dit moment is geïnstalleerd. Overschrijf de bestaande installatie?",
    "EXTENSION_OLDER_VERSION"              : "Dit pakket is versie {0} dewelke ouder is dan de op dit moment geïnstalleerde ({1}). Overschrijf de bestaande installatie?",
    "DOWNLOAD_ID_IN_USE"                   : "Interne fout: download ID is reeds in gebruik.",
    "NO_SERVER_RESPONSE"                   : "Kan niet verbinden met de server.",
    "BAD_HTTP_STATUS"                      : "Bestand niet gevonden op server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Onmogelijk om download op te slaan naar tijdelijk bestand.",
    "ERROR_LOADING"                        : "De uitbreiding ondervond een probleem bij het opstarten.",
    "MALFORMED_URL"                        : "De URL is ongeldig. Controleer of ze correct werd ingevoerd.",
    "UNSUPPORTED_PROTOCOL"                 : "De URL moet een http of https URL zijn.",
    "UNKNOWN_ERROR"                        : "Onbekende interne fout.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Uitbreidingbeheer",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Onmogelijk om toegang te verkrijgen tot het uitbreidingen register. Probeer later opnieuw.",
    "INSTALL_FROM_URL"                     : "Installeer van URL\u2026",
    "EXTENSION_AUTHOR"                     : "Auteur",
    "EXTENSION_DATE"                       : "Datum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Deze uitbreiding vereist een nieuwere versie van {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Deze uitbreiding werkt momenteel enkel met oudere versies van {APP_NAME}.",
    "EXTENSION_NO_DESCRIPTION"             : "Geen beschrijving",
    "EXTENSION_MORE_INFO"                  : "Meer info...",
    "EXTENSION_ERROR"                      : "Uitbreiding fout",
    "EXTENSION_KEYWORDS"                   : "Sleutelwoorden",
    "EXTENSION_INSTALLED"                  : "Geïnstalleerd",
    "EXTENSION_UPDATE_INSTALLED"           : "Deze uitbreiding is gedownload en zal geïnstalleerd worden wanneer je {APP_NAME} stopt.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Zoek",
    "EXTENSION_MORE_INFO_LINK"             : "Meer",
    "BROWSE_EXTENSIONS"                    : "Blader door Uitbreidingen",
    "EXTENSION_MANAGER_REMOVE"             : "Verwijder Uitbreiding",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Onmogelijk om een of meerdere uitbreidingen te verwijderen: {0}. {APP_NAME} zal nog steeds stoppen.",
    "EXTENSION_MANAGER_UPDATE"             : "Update Uitbreiding",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Onmogelijk om een of meerdere uitbreidingen te updaten: {0}. {APP_NAME} zal nog steeds stoppen.",
    "MARKED_FOR_REMOVAL"                   : "Aangeduid voor verwijdering",
    "UNDO_REMOVE"                          : "Herstel",
    "MARKED_FOR_UPDATE"                    : "Aangeduid voor update",
    "UNDO_UPDATE"                          : "Herstel",
    "CHANGE_AND_QUIT_TITLE"                : "Wijzig Uitbreidingen",
    "CHANGE_AND_QUIT_MESSAGE"              : "Om de aangeduidde uitbreiding te updaten of te verwijderen, moet je {APP_NAME} stoppen en herstarten. Je zal gevraagd worden alle onbewaarde wijzigingen op te slaan.",
    "REMOVE_AND_QUIT"                      : "Verwijder Uitbreidingen en stop",
    "CHANGE_AND_QUIT"                      : "Wijzig Uitbreidingen en Stop",
    "UPDATE_AND_QUIT"                      : "Update Uitbreidingen en Stop",
    "EXTENSION_NOT_INSTALLED"              : "Kon de uitbreiding {0} niet verwijderen omdat ze niet was geïnstalleerd",
    "NO_EXTENSIONS"                        : "Nog geen uitbreidingen geïnstalleerd.<br>Klik op de Beschikbaar tab hierboven om te starten.",
    "NO_EXTENSION_MATCHES"                 : "Geen uitbreidingen komen overeen met je zoekopdracht.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Wees voorzichtig bij het installeren van uitbreidingen van een onbekende bron.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Geïnstalleerd",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Beschikbaar",
    "EXTENSIONS_UPDATES_TITLE"             : "Updates",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixels",
    
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "CMD_SHOW_DEV_TOOLS"                        : "Toon Developer Tools",
    "CMD_REFRESH_WINDOW"                        : "Herlaad {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nieuw {APP_NAME} Venster",
    "CMD_SWITCH_LANGUAGE"                       : "Wijzig Taal",
    "CMD_RUN_UNIT_TESTS"                        : "Start Testen",
    "CMD_SHOW_PERF_DATA"                        : "Toon Performantie Data",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Schakel Node Debugger in",
    "CMD_LOG_NODE_STATE"                        : "Log Node Status naar Console",
    "CMD_RESTART_NODE"                          : "Herstart Node",
    
    "LANGUAGE_TITLE"                            : "Wijzig Taal",
    "LANGUAGE_MESSAGE"                          : "Taal:",
    "LANGUAGE_SUBMIT"                           : "Herlaad {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Annuleer",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Systeem Standaard",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "Tsjechisch",
    "LOCALE_DE"                                 : "Duits",
    "LOCALE_EN"                                 : "Engels",
    "LOCALE_ES"                                 : "Spaans",
    "LOCALE_FI"                                 : "Fins",
    "LOCALE_FR"                                 : "Frans",
    "LOCALE_IT"                                 : "Italiaans",
    "LOCALE_JA"                                 : "Japans",
    "LOCALE_NB"                                 : "Noors",
    "LOCALE_NL"                                 : "Nederlands",
    "LOCALE_PL"                                 : "Pools",
    "LOCALE_PT_BR"                              : "Portugees, Brazilië",
    "LOCALE_PT_PT"                              : "Portugees",
    "LOCALE_RU"                                 : "Russisch",
    "LOCALE_SK"                                 : "Slovaaks",
    "LOCALE_SV"                                 : "Zweeds",
    "LOCALE_TR"                                 : "Turks",
    "LOCALE_ZH_CN"                              : "Chinees, simpel",
    "LOCALE_HU"                                 : "Hongaars",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Huidige Kleur",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Originele Kleur",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa Formaat",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex Formaat",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa Formaat",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} ({1} keer gebruikt)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} ({1} keren gebruikt)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Ga naar Definitie",
    "CMD_SHOW_PARAMETER_HINT"                   : "Toon Parameter Hint",
    "NO_ARGUMENTS"                              : "<geen parameters>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Snel bekijken bij Muis Over",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Recente Projecten",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Lees meer"
});
