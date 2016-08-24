/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

define({

    /**
     * Errors
     */

    // General file io error strings
    "GENERIC_ERROR"                     : "(fout {0})",
    "NOT_FOUND_ERR"                     : "Het bestand kan niet worden gevonden.",
    "NOT_READABLE_ERR"                  : "Het bestand kan niet worden ingelezen.",
    "EXCEEDS_MAX_FILE_SIZE"             : "Bestanden groter dan {0} MB kunnen niet worden geopend in {APP_NAME}.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "De doelmap kan niet gewijzigd worden.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "De bevoegdheden laten u niet toe enige wijzigingen aan te brengen.",
    "CONTENTS_MODIFIED_ERR"             : "Het bestand is bijgewerkt buiten {APP_NAME} om.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} ondersteunt momenteel alleen bestanden in UTF-8 tekstcodering.",
    "FILE_EXISTS_ERR"                   : "Het bestand of map bestaat al.",
    "FILE"                              : "bestand",
    "FILE_TITLE"                        : "Bestand",
    "DIRECTORY"                         : "map",
    "DIRECTORY_TITLE"                   : "Map",
    "DIRECTORY_NAMES_LEDE"              : "Mapnamen",
    "FILENAMES_LEDE"                    : "Bestandsnamen",
    "FILENAME"                          : "Bestandsnaam",
    "DIRECTORY_NAME"                    : "Mapnaam",

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
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "Een bestand of map met de naam <span class='dialog-filename'>{0}</span> bestaat al.",
    "ERROR_CREATING_FILE_TITLE"         : "Probleem bij het aanmaken van een {0}",
    "ERROR_CREATING_FILE"               : "Er is een fout opgetreden bij het aanmaken van het {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP"              : "Het is niet mogelijk een map te openen en tegelijkertijd andere bestanden.",

    // User key map error strings
    "ERROR_KEYMAP_TITLE"                : "Fout tijdens lezen van het configuratiebestand \u0028keymap.json\u0029.",
    "ERROR_KEYMAP_CORRUPT"              : "De JSON-code in het configuratiebestand \u0028keymap.json\u0029 is niet correct. Het bestand wordt geopend zodat je het kan corrigeren.",
    "ERROR_LOADING_KEYMAP"              : "Het configuratiebestand \u0028keymap.json\u0029 is niet opgeslagen in UTF-8 tekstcodering en kan zodoende niet worden geopend.",
    "ERROR_RESTRICTED_COMMANDS"         : "Je kan deze sneltoetsen niet toewijzen aan deze commando\u0027s: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"        : "Je kan deze sneltoetsen niet opnieuw toewijzen: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"          : "Je wijst meerdere sneltoetsen toe aan deze commando\u0027s: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"         : "Je hebt meerdere acties aan dezelfde sneltoetsen toegewezen: {0}",
    "ERROR_INVALID_SHORTCUTS"           : "Deze sneltoetsen zijn niet toegestaan: {0}",
    "ERROR_NONEXISTENT_COMMANDS"        : "Je wijst sneltoetsen toe aan niet-bestaande commando\u0027s: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Fout tijdens lezen instellingen",
    "ERROR_PREFS_CORRUPT"               : "De JSON-code van het configuratiebestand is niet correct. Het bestand wordt geopend zodat je het kan corrigeren. {APP_NAME} moet hierna herstart worden om de wijzigingen toe te passen.",
    "ERROR_PROJ_PREFS_CORRUPT"          : "De JSON-code van het project-configuratiebestand is niet correct. Het bestand wordt geopend zodat je het kan corrigeren. Je moet het project opnieuw laden om de wijzigingen toe te passen.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oeps! {APP_NAME} werkt nog niet in browsers.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} is gebouwd in HTML, maar op dit moment werkt het als desktop applicatie zodat je het kan gebruiken om lokale bestanden te bewerken. Gebruik graag de applicatie-omgeving op <b>github.com/adobe/brackets-shell</b> om {APP_NAME} te starten.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Probleem bij het indexeren van bestanden",
    "ERROR_MAX_FILES"                   : "Het maximum aantal bestanden is geïndexeerd. Het kan zijn dat acties om bestanden op te zoeken in de index niet correct verlopen.",

    // Live Preview error strings
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
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Voor meer informatie, zie <a href='{0}' title='{0}'>oplossen van Live Voorbeeld verbindingsproblemen</a>.",

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
    "EXT_MODIFIED_TITLE"                : "Externe wijzigingen",
    "CONFIRM_DELETE_TITLE"              : "Bevestig verwijderen",
    "CONFIRM_FOLDER_DELETE"             : "Ben je zeker dat je de map <span class='dialog-filename'>{0}</span> wil verwijderen?",
    "FILE_DELETED_TITLE"                : "Bestand verwijderd",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> is gewijzigd op de schijf buiten {APP_NAME}.<br /><br />Wil je het bestand overschrijven evenals de wijzigingen buiten {APP_NAME} om?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> is gewijzigd op de schijf, maar heeft ook onbewaarde wijzigingen in {APP_NAME}.<br /><br />Welke versie wil je behouden?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> is verwijderd op de schijf, maar heeft onbewaarde wijzigingen in {APP_NAME}.<br /><br />Wil je je wijzigingen behouden?",

    // Generic dialog/button labels
    "DONE"                              : "Gedaan",
    "OK"                                : "OK",
    "CANCEL"                            : "Annuleer",
    "DONT_SAVE"                         : "Niet opslaan",
    "SAVE"                              : "Opslaan",
    "SAVE_AS"                           : "Opslaan als\u2026",
    "SAVE_AND_OVERWRITE"                : "Overschrijven",
    "DELETE"                            : "Verwijder",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nee",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                  : "{0} van {1}",
    "FIND_NO_RESULTS"                   : "Geen resultaten",
    "FIND_QUERY_PLACEHOLDER"            : "Zoek\u2026",
    "REPLACE_PLACEHOLDER"               : "Vervang met\u2026",
    "BUTTON_REPLACE_ALL"                : "Alle\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Vervang\u2026",
    "BUTTON_REPLACE"                    : "Vervang",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Volgende overeenkomst",
    "BUTTON_PREV_HINT"                  : "Vorige overeenkomst",
    "BUTTON_CASESENSITIVE_HINT"         : "Hoofdlettergevoelig",
    "BUTTON_REGEXP_HINT"                : "Reguliere expressie",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Vervang zonder herstellen",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Omdat meer dan {0} bestanden moeten worden veranderd, {APP_NAME} zal ongeopende bestanden op de schijf aanpassen.<br /> Wijzigingen kunnen niet meer ongedaan worden gemaakt in die bestanden.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Vervang zonder herstellen",

    "OPEN_FILE"                         : "Bestand openen",
    "SAVE_FILE_AS"                      : "Bestand opslaan",
    "CHOOSE_FOLDER"                     : "Kies een map",

    "RELEASE_NOTES"                     : "Nieuw in deze versie",
    "NO_UPDATE_TITLE"                   : "Je bent up to date!",
    "NO_UPDATE_MESSAGE"                 : "Je werkt met de laatste versie van {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Vervang",
    "FIND_REPLACE_TITLE_WITH"           : "met",
    "FIND_TITLE_LABEL"                  : "Gevonden",
    "FIND_TITLE_SUMMARY"                : "&mdash; {0} {1} {2} in {3}",

    //Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "in project",
    "FIND_IN_FILES_ZERO_FILES"          : "Filter sluit alle bestanden uit {0}",
    "FIND_IN_FILES_FILE"                : "bestand",
    "FIND_IN_FILES_FILES"               : "bestanden",
    "FIND_IN_FILES_MATCH"               : "overeenkomst",
    "FIND_IN_FILES_MATCHES"             : "overeenkomsten",
    "FIND_IN_FILES_MORE_THAN"           : "Meer dan ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Klik Ctrl/Cmd om alles in/uit te vouwen",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Vervang fouten",
    "REPLACE_IN_FILES_ERRORS"           : "De volgende bestanden zijn niet aangepast omdat deze na het zoeken zijn aangepast of niet bewerkt kunnen worden.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Probleem bij het ophalen van update-informatie",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Er is een fout opgetreden bij het ophalen van de laatste update-informatie van de server. Zorg ervoor dat je verbonden bent met het internet en probeer opnieuw.",

    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Nieuwe set uitgesloten bestanden\u2026",
    "CLEAR_FILE_FILTER"                 : "Sluit geen bestanden uit",
    "NO_FILE_FILTER"                    : "Geen uitgesloten bestanden",
    "EXCLUDE_FILE_FILTER"               : "Sluit {0} uit",
    "EDIT_FILE_FILTER"                  : "Bewerk\u2026",
    "FILE_FILTER_DIALOG"                : "Bewerk set uitgesloten bestanden",
    "FILE_FILTER_INSTRUCTIONS"          : "Sluit bestanden en mappen uit met de volgende teksten/deelteksten of <a href='{0}' title='{0}'>wildcards</a>. Plaats elke tekst op een nieuwe regel.",
    "FILTER_NAME_PLACEHOLDER"           : "Geef deze set een naam (optioneel)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "en {0} meer",
    "FILTER_COUNTING_FILES"             : "Bestanden tellen\u2026",
    "FILTER_FILE_COUNT"                 : "Sta {0} toe van {1} bestanden {2}",
    "FILTER_FILE_COUNT_ALL"             : "Sta alle {0} bestanden toe {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Quick Edit is niet beschikbaar voor huidige cursorpositie.",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "CSS Quick Edit: plaats cursor op een enkele class naam.",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "CSS Quick Edit: class attribuut is incompleet.",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "CSS Quick Edit: id attribuut is incompleet.",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "CSS Quick Edit: plaats cursor in tag, class of id.",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "CSS Timing Function Quick Edit: syntax onjuist",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "JS Quick Edit: plaats cursor in functienaam.",

     // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Geen snelle documentatie beschikbaar voor huidige cursorpositie.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Laden\u2026",
    "UNTITLED"          : "Naamloos",
    "WORKING_FILES"     : "Geopend",

    /**
     * MainViewManager
     */
    "TOP"               : "Boven",
    "BOTTOM"            : "Beneden",
    "LEFT"              : "Links",
    "RIGHT"             : "Rechts",

    "CMD_SPLITVIEW_NONE"        : "Niet splitsen",
    "CMD_SPLITVIEW_VERTICAL"    : "Verticaal splitsen",
    "CMD_SPLITVIEW_HORIZONTAL"  : "Horizontaal splitsen",
    "SPLITVIEW_MENU_TOOLTIP"    : "Splits de editor verticaal of horizontaal",
    "GEAR_MENU_TOOLTIP"         : "Configureer bestanden",

    "SPLITVIEW_INFO_TITLE"             : "Al geopend",
    "SPLITVIEW_MULTIPANE_WARNING"      : "Dit bestand is al geopend in een ander paneel. {APP_NAME} zal spoedig ondersteuning bieden aan het openen van hetzelfde bestand in meerdere panelen. Voor nu wordt het bestand weergegeven in het paneel waarin het al geopend is.<br /><br />(Dit is een eenmalige melding.)",

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
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} selecties",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klik om de indentatie te veranderen naar spaties",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klik om de indentatie te veranderen naar tabs",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klik om het aantal spaties bij indentatie te veranderen",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klik om de breedte van het tab karakter te veranderen",
    "STATUSBAR_SPACES"                      : "Spaties:",
    "STATUSBAR_TAB_SIZE"                    : "Tab Grootte:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Regel",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Regels",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Extensies uitgeschakeld",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Klik om de cursor te wisselen tussen Insert (INS) en Overwrite (OVR) mode.",
    "STATUSBAR_LANG_TOOLTIP"                : "Klik om bestandstype te veranderen.",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Klik om foutenpaneel te openen.",
    "STATUSBAR_DEFAULT_LANG"                : "(default)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Standaard voor .{0} bestanden",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Fouten",
    "SINGLE_ERROR"                          : "1 {0} Fout",
    "MULTIPLE_ERRORS"                       : "{1} {0} Fouten",
    "NO_ERRORS"                             : "Geen {0} fouten - goed zo!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Geen fouten gevonden - goed zo!",
    "LINT_DISABLED"                         : "Linting is uitgeschakeld",
    "NO_LINT_AVAILABLE"                     : "Er is geen linter beschikbaar voor {0}",
    "NOTHING_TO_LINT"                       : "Niets om te linten",
    "LINTER_TIMED_OUT"                      : "{0} is gestopt na wachten voor {1} ms",
    "LINTER_FAILED"                         : "{0} is gestopt met fout: {1}",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Bestand",
    "CMD_FILE_NEW_UNTITLED"               : "Nieuw",
    "CMD_FILE_NEW"                        : "Nieuw bestand",
    "CMD_FILE_NEW_FOLDER"                 : "Nieuwe map",
    "CMD_FILE_OPEN"                       : "Bestand openen\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Voeg toe aan werkset",
    "CMD_OPEN_DROPPED_FILES"              : "Open gesloten bestanden",
    "CMD_OPEN_FOLDER"                     : "Open map\u2026",
    "CMD_FILE_CLOSE"                      : "Sluit",
    "CMD_FILE_CLOSE_ALL"                  : "Alles sluiten",
    "CMD_FILE_CLOSE_LIST"                 : "Sluit lijsten",
    "CMD_FILE_CLOSE_OTHERS"               : "Sluit anderen",
    "CMD_FILE_CLOSE_ABOVE"                : "Sluit bestanden boven",
    "CMD_FILE_CLOSE_BELOW"                : "Sluit bestanden onder",
    "CMD_FILE_SAVE"                       : "Opslaan",
    "CMD_FILE_SAVE_ALL"                   : "Alles opslaan",
    "CMD_FILE_SAVE_AS"                    : "Opslaan als\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Voorbeeld",
    "CMD_TOGGLE_LIVE_PREVIEW_MB_MODE"     : "Experimentele versie Live Voorbeeld",
    "CMD_RELOAD_LIVE_PREVIEW"             : "Forceer herladen Live Voorbeeld",
    "CMD_PROJECT_SETTINGS"                : "Projectinstellingen\u2026",
    "CMD_FILE_RENAME"                     : "Bestand hernoemen",
    "CMD_FILE_DELETE"                     : "Verwijder",
    "CMD_INSTALL_EXTENSION"               : "Installeer extensie\u2026",
    "CMD_EXTENSION_MANAGER"               : "Extensiebeheer\u2026",
    "CMD_FILE_REFRESH"                    : "Ververs bestandsboom",
    "CMD_QUIT"                            : "Stoppen",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Afsluiten",

    // Edit menu commands
    "EDIT_MENU"                           : "Bewerken",
    "CMD_UNDO"                            : "Herstel",
    "CMD_REDO"                            : "Opnieuw",
    "CMD_CUT"                             : "Knippen",
    "CMD_COPY"                            : "Kopierën",
    "CMD_PASTE"                           : "Plakken",
    "CMD_SELECT_ALL"                      : "Alles selecteren",
    "CMD_SELECT_LINE"                     : "Regel selecteren",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Splits selectie in regels",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Voeg cursor toe aan volgende regel",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Voeg cursor toe aan vorige regel",
    "CMD_INDENT"                          : "Inspringen",
    "CMD_UNINDENT"                        : "Inspringen verwijderen",
    "CMD_DUPLICATE"                       : "Dupliceer",
    "CMD_DELETE_LINES"                    : "Verwijder regel",
    "CMD_COMMENT"                         : "Zet regel commentaar aan/uit",
    "CMD_BLOCK_COMMENT"                   : "Zet blok commentaar aan/uit",
    "CMD_LINE_UP"                         : "Verplaats regel naar boven",
    "CMD_LINE_DOWN"                       : "Verplaats regel naar beneden",
    "CMD_OPEN_LINE_ABOVE"                 : "Open regel boven",
    "CMD_OPEN_LINE_BELOW"                 : "Open regel beneden",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Automatisch accolades sluiten",
    "CMD_SHOW_CODE_HINTS"                 : "Toon code hints",

    // Search menu commands
    "FIND_MENU"                           : "Zoek",
    "CMD_FIND"                            : "Zoek",
    "CMD_FIND_NEXT"                       : "Zoek volgende",
    "CMD_FIND_PREVIOUS"                   : "Zoek vorige",
    "CMD_FIND_ALL_AND_SELECT"             : "Zoek alles en selecteer",
    "CMD_ADD_NEXT_MATCH"                  : "Voeg eerstvolgende overeenkomst toe aan selectie",
    "CMD_SKIP_CURRENT_MATCH"              : "Sla-over en selecteer volgende overeenkomst",
    "CMD_FIND_IN_FILES"                   : "Zoek in bestanden",
    "CMD_FIND_IN_SUBTREE"                 : "Zoek in\u2026",
    "CMD_REPLACE"                         : "Vervang",
    "CMD_REPLACE_IN_FILES"                : "Vervang in bestanden",
    "CMD_REPLACE_IN_SUBTREE"              : "Vervang in\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Beeld",
    "CMD_HIDE_SIDEBAR"                    : "Verberg zijbalk",
    "CMD_SHOW_SIDEBAR"                    : "Toon zijbalk",
    "CMD_INCREASE_FONT_SIZE"              : "Vergroot lettertype",
    "CMD_DECREASE_FONT_SIZE"              : "Verklein lettertype",
    "CMD_RESTORE_FONT_SIZE"               : "Herstel lettertype",
    "CMD_SCROLL_LINE_UP"                  : "Scroll regel naar Boven",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll regel naar Beneden",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Regelnummers",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Markeer actieve regel",
    "CMD_TOGGLE_WORD_WRAP"                : "Word wrap",
    "CMD_LIVE_HIGHLIGHT"                  : "Live voorbeeld markeren",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint bestanden bij opslaan",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Sorteren op toegevoegd",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Sorteren op naam",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Sorteren op type",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Automatisch sorteren",
    "CMD_THEMES"                          : "Thema\u0027s\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigeer",
    "CMD_QUICK_OPEN"                      : "Snel openen",
    "CMD_GOTO_LINE"                       : "Ga naar regel\u2026",
    "CMD_GOTO_DEFINITION"                 : "Definitie snel zoeken",
    "CMD_GOTO_FIRST_PROBLEM"              : "Ga naar de eerstvolgende fout/waarschuwing",
    "CMD_TOGGLE_QUICK_EDIT"               : "Snel wijzigen",
    "CMD_TOGGLE_QUICK_DOCS"               : "Snel naar documentatie",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Vorige overeenkomst",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Volgende overeenkomst",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Nieuwe regel",
    "CMD_NEXT_DOC"                        : "Volgend document",
    "CMD_PREV_DOC"                        : "Vorig document",
    "CMD_SHOW_IN_TREE"                    : "Toon in bestandsboom",
    "CMD_SHOW_IN_EXPLORER"                : "Toon in Verkenner",
    "CMD_SHOW_IN_FINDER"                  : "Toon in Finder",
    "CMD_SHOW_IN_OS"                      : "Toon in besturingssysteem",

    // Help menu commands
    "HELP_MENU"                           : "Help",
    "CMD_CHECK_FOR_UPDATE"                : "Controleer op updates",
    "CMD_HOW_TO_USE_BRACKETS"             : "Hoe gebruik je {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME} ondersteuning",
    "CMD_SUGGEST"                         : "Stel een nieuwe functie voor",
    "CMD_RELEASE_NOTES"                   : "Nieuw in deze versie",
    "CMD_GET_INVOLVED"                    : "Doe mee",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Toon de map met extensies",
    "CMD_HEALTH_DATA_STATISTICS"          : "Statusrapport",
    "CMD_HOMEPAGE"                        : "{APP_TITLE} homepage",
    "CMD_TWITTER"                         : "{TWITTER_NAME} op Twitter",
    "CMD_ABOUT"                           : "Over {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Open configuratiebestand",
    "CMD_OPEN_KEYMAP"                     : "Open gebruiker toetsenbordinstellingen",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimentele build",
    "RELEASE_BUILD"                        : "build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "RELOAD_FROM_DISK"                     : "Opnieuw laden van schijf",
    "KEEP_CHANGES_IN_EDITOR"               : "Behoud veranderingen in editor",
    "CLOSE_DONT_SAVE"                      : "Sluit (niet bewaren)",
    "RELAUNCH_CHROME"                      : "Herstart Chrome",
    "ABOUT"                                : "Over",
    "CLOSE"                                : "Sluiten",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "build timestamp: ",
    "ABOUT_TEXT_LINE3"                     : "Kennisgevingen, voorwaarden en bepalingen met betrekking tot software van derden bevinden zich op <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> en op de pagina's, hierin door verwijzing opgenomen.",
    "ABOUT_TEXT_LINE4"                     : "Documentatie en broncode op <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Gemaakt met \u2764 en JavaScript door:",
    "ABOUT_TEXT_LINE6"                     : "Veel mensen (maar we hebben problemen met het laden van die data op dit moment).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs en het Web Platform logo zijn gelicentieerd onder een Creative Commons Attribution licentie, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Er is een nieuwe versie van {APP_NAME} beschikbaar! Klik hier voor details.",
    "UPDATE_AVAILABLE_TITLE"               : "Update beschikbaar",
    "UPDATE_MESSAGE"                       : "Hey, er is een nieuwe versie van {APP_NAME} beschikbaar. Hier zijn een aantal van de nieuwe functies:",
    "GET_IT_NOW"                           : "Download het nu!",
    "PROJECT_SETTINGS_TITLE"               : "Projectinstellingen voor: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Live voorbeeld begin URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Gebruik url als http://localhost:8000/ om als lokale server te gebruiken.",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Het {0} protocol wordt niet ondersteund door Live Voorbeeld&mdash;gebruik http: of https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "De start URL kan geen zoekparameters bevatten zoals \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "De start URL kan geen hashes bevatten zoals \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Speciale karakters zoals '{0}' moeten %-geëncodeerd zijn.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Onbekende fout bij het parsen van de begin URL",
    "EMPTY_VIEW_HEADER"                    : "<em>Open een bestand wanneer dit paneel actief is</em>",

    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Huidig thema",
    "USE_THEME_SCROLLBARS"                 : "Scrollbalken van thema",
    "FONT_SIZE"                            : "Lettergrootte",
    "FONT_FAMILY"                          : "Lettertype\u0028s\u0029",
    "THEMES_SETTINGS"                      : "Thema-instellingen",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Nieuwe regel",

    // Extension Management strings
    "INSTALL"                              : "Installeren",
    "UPDATE"                               : "Update",
    "REMOVE"                               : "Verwijder",
    "OVERWRITE"                            : "Overschrijf",
    "CANT_REMOVE_DEV"                      : "Extensies in de \"dev\" map moeten met de hand verwijderd worden.",
    "CANT_UPDATE"                          : "De update is niet compatibel met deze versie van {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Extensies in de \"dev\" map kunnen niet automatisch geupdate worden.",
    "INSTALL_EXTENSION_TITLE"              : "Installeer extensie",
    "UPDATE_EXTENSION_TITLE"               : "Update extensie",
    "INSTALL_EXTENSION_LABEL"              : "Extensie URL",
    "INSTALL_EXTENSION_HINT"               : "URL van het zip bestand of de GitHub repo van de extensie",
    "INSTALLING_FROM"                      : "Bezig met installeren van {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Installatie succesvol!",
    "INSTALL_FAILED"                       : "Installatie mislukt.",
    "CANCELING_INSTALL"                    : "Bezig met annuleren\u2026",
    "CANCELING_HUNG"                       : "Het annuleren van de installatie duurt lang. Een intern probleem kan zijn opgetreden.",
    "INSTALL_CANCELED"                     : "Installatie geannuleerd.",
    "VIEW_COMPLETE_DESCRIPTION"            : "Laat volledige beschrijving zien",
    "VIEW_TRUNCATED_DESCRIPTION"           : "Laat afgekorte beschrijving zien",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "De gedownloade inhoud is geen geldig zip bestand.",
    "INVALID_PACKAGE_JSON"                 : "Het package.json bestand is niet geldig (Fout: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Het package.json specifieert geen pakket naam.",
    "BAD_PACKAGE_NAME"                     : "{0} is een ongeldige pakket naam.",
    "MISSING_PACKAGE_VERSION"              : "Het package.json bestand specifieert geen geldige pakket versie.",
    "INVALID_VERSION_NUMBER"               : "Het pakket versienummer ({0}) is ongeldig.",
    "INVALID_BRACKETS_VERSION"             : "De {APP_NAME} compatibiliteit string ({0}) is ongeldig.",
    "DISALLOWED_WORDS"                     : "De woorden ({1}) zijn niet toegelaten in het {0} veld.",
    "API_NOT_COMPATIBLE"                   : "De extensie is niet compatibel met deze versie van {APP_NAME}. Het werd geïnstalleerd in de map met uitgeschakelde extensies.",
    "MISSING_MAIN"                         : "Het pakket heeft geen main.js bestand.",
    "EXTENSION_ALREADY_INSTALLED"          : "Het installeren van dit pakket zal een vroeger geïnstalleerde extensie overschrijven. Overschrijf de oudere extensie?",
    "EXTENSION_SAME_VERSION"               : "Dit pakket is dezelfde versie als degene die op dit moment is geïnstalleerd. Overschrijf de bestaande installatie?",
    "EXTENSION_OLDER_VERSION"              : "Dit pakket is versie {0} welke ouder is dan de op dit moment geïnstalleerde ({1}). Overschrijf de bestaande installatie?",
    "DOWNLOAD_ID_IN_USE"                   : "Interne fout: download ID is reeds in gebruik.",
    "NO_SERVER_RESPONSE"                   : "Kan niet verbinden met de server.",
    "BAD_HTTP_STATUS"                      : "Bestand niet worden gevonden op server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Onmogelijk om het gedownloade bestand op te slaan naar een tijdelijk bestand.",
    "ERROR_LOADING"                        : "De extensie ondervond een probleem bij het opstarten.",
    "MALFORMED_URL"                        : "De URL is ongeldig. Controleer of deze correct is ingevoerd.",
    "UNSUPPORTED_PROTOCOL"                 : "De URL moet een http of https URL zijn.",
    "UNKNOWN_ERROR"                        : "Onbekende interne fout.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Extensiebeheer",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Er is momenteel geen toegang mogelijk tot het extensieregister. Probeer later opnieuw.",
    "INSTALL_EXTENSION_DRAG"               : "Sleep .zip hier of",
    "INSTALL_EXTENSION_DROP"               : "Sleep .zip hier voor installatie",
    "INSTALL_EXTENSION_DROP_ERROR"         : "Installatie/update afgebroken vanwege de volgende fouten:",
    "INSTALL_FROM_URL"                     : "installeer van URL\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "Validating\u2026",
    "EXTENSION_AUTHOR"                     : "Auteur",
    "EXTENSION_DATE"                       : "Datum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Deze extensie vereist een nieuwere versie van {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Deze extensie werkt momenteel enkel met oudere versies van {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Versie {0} van deze extensie vereist een nieuwere versie van {APP_NAME}. Je kan wel de oudere versie {1} installeren.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Versie {0} van deze extensie werkt alleen met oudere versies van {APP_NAME}. Je kan wel de oudere versie {1} installeren.",
    "EXTENSION_NO_DESCRIPTION"             : "Geen beschrijving",
    "EXTENSION_MORE_INFO"                  : "Meer info...",
    "EXTENSION_ERROR"                      : "Extensie fout",
    "EXTENSION_KEYWORDS"                   : "Sleutelwoorden",
    "EXTENSION_TRANSLATED_USER_LANG"       : "Vertaalt in {0} talen, inclusief de jouwe",
    "EXTENSION_TRANSLATED_GENERAL"         : "Vertaalt in {0} talen",
    "EXTENSION_TRANSLATED_LANGS"           : "Deze extensie is vertaald in de volgende talen: {0}",
    "EXTENSION_INSTALLED"                  : "Geïnstalleerd",
    "EXTENSION_UPDATE_INSTALLED"           : "Deze extensie is gedownload en zal geïnstalleerd worden wanneer je {APP_NAME} stopt.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Zoek",
    "EXTENSION_MORE_INFO_LINK"             : "Meer",
    "BROWSE_EXTENSIONS"                    : "Blader door extensies",
    "EXTENSION_MANAGER_REMOVE"             : "Verwijder extensie",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Onmogelijk om een of meerdere extensies te verwijderen: {0}. {APP_NAME} zal nog steeds stoppen.",
    "EXTENSION_MANAGER_UPDATE"             : "Update extensie",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Onmogelijk om een of meerdere extensies te updaten: {0}. {APP_NAME} zal nog steeds stoppen.",
    "MARKED_FOR_REMOVAL"                   : "Aangeduid voor verwijder",
    "UNDO_REMOVE"                          : "Herstel",
    "MARKED_FOR_UPDATE"                    : "Aangeduid voor update",
    "UNDO_UPDATE"                          : "Herstel",
    "CHANGE_AND_RELOAD_TITLE"              : "Wijzig extensies",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Om de aangeduidde extensie te updaten of te verwijderen, moet je {APP_NAME} stoppen en herstarten. Er zal gevraagd worden alle onbewaarde wijzigingen op te slaan.",
    "REMOVE_AND_RELOAD"                    : "Verwijder extensies en herladen",
    "CHANGE_AND_RELOAD"                    : "Wijzig extensies en herladen",
    "UPDATE_AND_RELOAD"                    : "Update extensies en herladen",
    "PROCESSING_EXTENSIONS"                : "Verwerken van wijzigingen aan extensie\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Kon de extensie {0} niet verwijderen omdat deze niet is geïnstalleerd",
    "NO_EXTENSIONS"                        : "Geen extensies geïnstalleerd.<br>Klik op de Beschikbaar tab hierboven om te starten.",
    "NO_EXTENSION_MATCHES"                 : "Geen extensies komen overeen met je zoekopdracht.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Wees voorzichtig bij het installeren van extensies van een onbekende bron.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Geïnstalleerd",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Beschikbaar",
    "EXTENSIONS_THEMES_TITLE"              : "Thema\u0027s",
    "EXTENSIONS_UPDATES_TITLE"             : "Updates",

    "INLINE_EDITOR_NO_MATCHES"             : "Geen overeenkomsten beschikbaar.",
    "INLINE_EDITOR_HIDDEN_MATCHES"         : "Alle overeenkomsten zijn samengevouwen. Vouw alle bestanden uit in het overzicht rechts om overeenkomsten te zien.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Er zijn geen bestaande CSS regels die overeenkomsten met jouw selectie.<br> Klik \"Nieuwe regel\" om te maken.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Er zijn geen stylesheets in je project.<br>Maak er een om CSS regels toe te voegen.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "meest grote",

    /**
     * Unit names
     */
    "UNIT_PIXELS"                          : "pixels",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "ERRORS"                                    : "fouten",
    "CMD_SHOW_DEV_TOOLS"                        : "Tools voor ontwikkelaars weergeven",
    "CMD_REFRESH_WINDOW"                        : "Laad {APP_NAME} opnieuw",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Laad opnieuw zonder extensies",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nieuw {APP_NAME} venster",
    "CMD_LAUNCH_SCRIPT_MAC"                     : "Installeer {APP_NAME} in de opdrachtprompt",
    "CMD_SWITCH_LANGUAGE"                       : "Wijzig taal \u0028change language\u0029",
    "CMD_RUN_UNIT_TESTS"                        : "Start testen",
    "CMD_SHOW_PERF_DATA"                        : "Toon prestatiedata",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Schakel Node Debugger in",
    "CMD_LOG_NODE_STATE"                        : "Log Node status naar console",
    "CMD_RESTART_NODE"                          : "Herstart Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Laad fouten zien in statusbalk",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Open broncode van {APP_NAME}",

    "CREATING_LAUNCH_SCRIPT_TITLE"              : "{APP_NAME} Command Line Shortcut",
    "ERROR_CREATING_LAUNCH_SCRIPT"              : "Er is een fout opgetreden bij het installeren van de opdrachtprompt snelkoppeling. Kijk op <a href='https://github.com/adobe/brackets/wiki/Command-Line-Arguments#troubleshooting'>deze pagina</a> voor mogelijke foutoplossing.<br/><br/>Reden: {0}",
    "ERROR_CLTOOLS_RMFAILED"                    : "Niet mogelijk om bestaande symlink <code>/usr/local/bin/brackets</code> te verwijderen.",
    "ERROR_CLTOOLS_MKDIRFAILED"                 : "Niet mogelijk om map <code>/usr/local/bin</code> te maken.",
    "ERROR_CLTOOLS_LNFAILED"                    : "Niet mogelijk om symlink <code>/usr/local/bin/brackets</code> te maken.",
    "ERROR_CLTOOLS_SERVFAILED"                  : "Interne fout.",
    "ERROR_CLTOOLS_NOTSUPPORTED"                : "Koppeling met opdrachtprompt is niet beschikbaar op dit OS.",
    "LAUNCH_SCRIPT_CREATE_SUCCESS"              : "Gelukt! Je kunt {APP_NAME} nu makkelijk starten vanaf de opdrachtprompt. Type <code>brackets myFile.txt</code> om een bestand te openen of <code>brackets myFolder</code> om van project te wisselen. <br/><br/><a href='https://github.com/adobe/brackets/wiki/Command-Line-Arguments'>Klik hier</a> voor meer informatie over het gebruik van {APP_NAME} via de opdrachtprompt \u0028in het Engels\u0029.",

    "LANGUAGE_TITLE"                            : "Wijzig taal",
    "LANGUAGE_MESSAGE"                          : "Taal:",
    "LANGUAGE_SUBMIT"                           : "{APP_NAME} opnieuw laden",
    "LANGUAGE_CANCEL"                           : "Annuleren",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Systeemvoorkeuren",

    // extensions/default/HealthData
    "HEALTH_DATA_NOTIFICATION"                  : "Statusrapport instellingen",
    "HEALTH_FIRST_POPUP_TITLE"                  : "{APP_NAME} statusrapport",
    "HEALTH_DATA_DO_TRACK"                      : "Deel anoniem informatie over hoe je {APP_NAME} gebruikt.",
    "HEALTH_DATA_NOTIFICATION_MESSAGE"          : "Om {APP_NAME} te verbeteren, wordt er periodiek <strong>(anoniem)</strong> beperkt aantal statistieken verzonden naar Adobe over hoe je {APP_NAME} gebruikt. Deze informatie helpt ons prioriteit te geven aan bepaalde functies, het vinden van fouten in de software en problemen in het gebruik zichtbaar te maken.<br><br>Je kan de data bekijken of ervoor kiezen om geen data te delen via <strong>Help > Statusrapport</strong>. <br><br><a href='https://github.com/adobe/brackets/wiki/Health-Data'>Lees meer over het {APP_NAME} statusrapport (Engels)</a>",
    "HEALTH_DATA_PREVIEW"                       : "{APP_NAME} statusrapport",
    "HEALTH_DATA_PREVIEW_INTRO"                 : "<p>Om {APP_NAME} te verbeteren, wordt er periodiek <strong>(anoniem)</strong> beperkt aantal statistieken verzonden naar Adobe over hoe je {APP_NAME} gebruikt. Deze informatie helpt ons prioriteit te geven aan bepaalde functies, het vinden van fouten in de software en problemen in het gebruik zichtbaar te maken. <a href='https://github.com/adobe/brackets/wiki/Health-Data'>Lees meer over het {APP_NAME} statusrapport (Engels)</a> en hoe het bijdraagt aan de {APP_NAME} gemeenschap terwijl je privacy beschermd blijft.</p><p>Onder zie je een voorbeeld van de data die wordt verzonden bij het volgende statusrapport, <em>als</em> het is ingeschakeld.</p>",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Tijd",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Voortgang",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Verplaats geselecteerde punt<br><kbd class='text'>Shift</kbd> Verplaats met 10 units<br><kbd class='text'>Tab</kbd> Verwissel punten",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Vergroot of verklein stappen<br><kbd>←</kbd><kbd>→</kbd> 'Start' of 'Einde'",
    "INLINE_TIMING_EDITOR_INVALID"              : "De oude waarde <code>{0}</code> is niet geldig, de weergegeven functie is veranderd naar <code>{1}</code>. Het bestand wordt bijgewerkt met de eerste aanpassing.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Huidige kleur",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Originele kleur",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa formaat",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex formaat",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa formaat",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} ({1} keer gebruikt)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} ({1} keer gebruikt)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Ga naar definitie",
    "CMD_SHOW_PARAMETER_HINT"                   : "Toon parameter hint",
    "NO_ARGUMENTS"                              : "<geen parameters>",
    "DETECTED_EXCLUSION_TITLE"                  : "JavaScript File Inference Problem",
    "DETECTED_EXCLUSION_INFO"                   : "{APP_NAME} kwam in de problemen met het verwerken van <span class='dialog-filename'>{0}</span>.<br><br>Dit bestand wordt niet verder verwerkt voor \"code hints\", \"Jump to Definition\" of \"Quick Edit\". Om het bestand weer te activeren, open <code>brackets.json</code> in je project en bewerkt <code>jscodehints.detectedExclusions</code>.<br><br>Dit is vermoedelijk een bug in {APP_NAME}. Indien mogelijk kun je een kopie van het bestand sturen naar <a href='https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue'>\"rapporteer een bug\"</a> met een link naar het bestand.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Snel bekijken bij muis over",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Recente projecten",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Lees meer",

    //extensions/default/CodeFolding
    "COLLAPSE_ALL"                  : "Alles inklappen",
    "EXPAND_ALL"                    : "Alles uitklappen",
    "COLLAPSE_CURRENT"              : "Huidige inklappen",
    "EXPAND_CURRENT"                : "Huidige uitklappen"
});
/* Last translated for 50cbe1b8848786c6be27d4788e4b6a367244abc2 */
