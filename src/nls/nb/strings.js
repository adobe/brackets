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
    "GENERIC_ERROR"                     : "(feil {0})",
    "NOT_FOUND_ERR"                     : "Kunne ikke finne filen.",
    "NOT_READABLE_ERR"                  : "Filen kunne ikke bli lest.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Målkatalogen kunnet ikke bli modifisert.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Rettighetene tillater ikke modifikasjoner.",
    "CONTENTS_MODIFIED_ERR"             : "Filen har blitt modifisert utenfor  {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR"          : "Filen er ikke UTF-8 kodet tekst.",
    "FILE_EXISTS_ERR"                   : "Filen eller katalogen eksisterer allerede.",
    "FILE"                              : "fil",
    "DIRECTORY"                         : "katalog",
    "DIRECTORY_NAMES_LEDE"              : "Katalognavn",
    "FILENAMES_LEDE"                    : "Filnavn",
    "FILENAME"                          : "filnavn",
    "DIRECTORY_NAME"                    : "katalognavn",


    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Feil ved lasting av prosjektet",
    "OPEN_DIALOG_ERROR"                 : "Det oppstod en feil ved forsøk på å åpne fildialog. (feil {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Det oppstod en feil ved forsøk på å laste katalogen <span class='dialog-filename'>{0}</span>. (feil {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Det oppstod en feil ved lesing av innholdet i katalogen <span class='dialog-filename'>{0}</span>. (feil {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Feil ved åpning av filen",
    "ERROR_OPENING_FILE"                : "Det oppstod en feil ved forsøk på å åpne filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Det oppstod en feil ved forsøk på å åpne følgende filer:",
    "ERROR_RELOADING_FILE_TITLE"        : "Feil ved oppfriskning av endringer fra disk",
    "ERROR_RELOADING_FILE"              : "Det oppstod en feil ved forsøk på å oppfriske filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Feil ved lagring av fil",
    "ERROR_SAVING_FILE"                 : "Det oppstod en feil ved forsøk på å lagre filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Det oppstod en feil ved forsøk på å gi nytt navn til filen",
    "ERROR_RENAMING_FILE"               : "Det oppstod en feil ved forsøk på å gi nytt navn til filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Det oppstod en feil ved forsøk på å slette filen",
    "ERROR_DELETING_FILE"               : "Det oppstod en feil ved forsøk på å slette filen <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Ugyldig filnavn {0}",
    "INVALID_FILENAME_MESSAGE"          : "Filnavn kan ikke inneholde følgende tegn: {0}",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "En fil eller katalog med navnet <span class='dialog-filename'>{0}</span> eksisterer allerede.",
    "ERROR_CREATING_FILE_TITLE"         : "Feil ved oppretting av fil {0}",
    "ERROR_CREATING_FILE"               : "Det oppstod en feil ved forsøk på å opprette filen  {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Feil ved lesing av preferanser",
    "ERROR_PREFS_CORRUPT"               : "Din preferansefil er ikke gyldig JSON. Filen vil bli åpnet slik at du kan korrigere formatet. Du trenger å starte {APP_NAME} på nytt for at endringene skal ha effekt.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} kjører ikke i nettlesere ennå.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} er bygd med HTML, men akkurat nå kjører den som en skrivebords-app slik at du kan bruke den til å redigere lokale filer. Vennligst bruk applikasjonsskallet <b>github.com/adobe/brackets-app</b> repo'et for å kjøre {APP_NAME}",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Feil ved indeksering av filer",
    "ERROR_MAX_FILES"                   : "Maksimalt antall filer har blitt indeksert. Handlinger som slår opp filer i indeksen kan feile.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Feil ved åpning av nettleser",
    "ERROR_CANT_FIND_CHROME"            : "Nettleseren Google Chrome ble ikke funnet. Vennligst sørg for at den er installert.",
    "ERROR_LAUNCHING_BROWSER"           : "En feil skjedde ved åpning av nettleseren. (feil {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Live Preview feil",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Kobler til nettleser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "En Live Preview kobling til Chrome kunne ikke bli etablert. For at Live Preview skal fungere må Chrome startes med remote debugging på.<br /><br />Ønsker du å start Chrome på nytt med remote debugging slått på?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Kan ikke laste Live Preview siden",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Åpne en HTML-fil for å åpne live Preview.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "For å starte Live Preview med en server-side fil må du spesifisere en base-url for dette prosjektet.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Feil ved starting av HTTP serveren for Live Preview filer. Vennligst prøv igjen.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Velkommen til Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview kobler {APP_NAME} til din nettleser. Den åpner en forhåndsvisning av HTML-filen i nettleseren. Forhåndsvisningen oppdateres umiddelbart når du redigerer koden.<br /><br />I denne tidlige versjonen av {APP_NAME} fungerer Live Preview bare for endringer av <strong>CSS-filer</strong> og bare med <strong>Google Chrome</strong>. Vi ønsker å implementere det for HTML og JavaScript også snart!<br /><br /> (Du ser bare denne meldingen en gang).",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "For mer informasjon, se <a href='{0}' title='{0}'>Troubleshooting Live Preview connection errors</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Kobler til\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Initaliserer\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Koble fra Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview (lagre fil for oppfriskning)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Preview (kan ikke oppdatere p.g.a. syntax error)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Live Preview ble kansellert fordi nettleserens utviklerverktøy ble åpnet",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Live Preview ble kansellert fordi siden ble stengt i nettleseren",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Live Preview ble kansellert fordi nettleseren navigerte til en side som ikke er en del av prosjektet",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Live Preview ble kansellert for en ukjent årsak ({0})",

    "SAVE_CLOSE_TITLE"                  : "Lagre endringer",
    "SAVE_CLOSE_MESSAGE"                : "Ønsker du å lagre enderinger i dokumentet <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Ønsker du å lagre enderinger i følgende filer?",
    "EXT_MODIFIED_TITLE"                : "Eksterne endringer",
    "CONFIRM_DELETE_TITLE"              : "Bekreft sletting",
    "CONFIRM_FOLDER_DELETE"             : "Er du sikker på at du vil slette katalogen <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Fil slettet",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> har blitt modifisert på disk.<br /><br />Vil du lagre filen og overskrive de endringene?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> er blitt endret på disk, men har samtidig ulagrede endringer i {APP_NAME}.<br /><br />Hvilken versjon ønsker du å beholde?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> er blitt slettet på disken, men har ulagrede endringer i {APP_NAME}.<br /><br />Ønsker du å beholde endringene?",

    // Generic dialog/button labels
    "OK"                                : "Ok",
    "CANCEL"                            : "Avbryt",
    "DONT_SAVE"                         : "Ikke lagre",
    "SAVE"                              : "Lagre",
    "SAVE_AS"                           : "Lagre som\u2026",
    "SAVE_AND_OVERWRITE"                : "Overskriv",
    "DELETE"                            : "Slett",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nei",

    // Find, Replace, Find in Files
    "FIND_NO_RESULTS"                   : "Ingen resultater",
    "FIND_QUERY_PLACEHOLDER"            : "Finn\u2026",
    "REPLACE_PLACEHOLDER"               : "Erstatt med\u2026",
    "BUTTON_REPLACE_ALL"                : "Alle\u2026",
    "BUTTON_REPLACE"                    : "Erstatt",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Neste treff",
    "BUTTON_PREV_HINT"                  : "Forrige treff",
    "BUTTON_CASESENSITIVE_HINT"         : "Skill mellom store og små (bokstaver)",
    "BUTTON_REGEXP_HINT"                : "Regulært uttrykk",

    "OPEN_FILE"                         : "Åpne fil",
    "SAVE_FILE_AS"                      : "Lagre fil",
    "CHOOSE_FOLDER"                     : "Velg katalog",

    "RELEASE_NOTES"                     : "Versjonsmerknader",
    "NO_UPDATE_TITLE"                   : "Du er oppdatert!",
    "NO_UPDATE_MESSAGE"                 : "Du kjører den nyeste versjonen av {APP_NAME}.",

    // Find in Files
    "FIND_IN_FILES_SCOPED"              : "i <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "i prosjekt",
    "FIND_IN_FILES_ZERO_FILES"          : "Filter ekskluderer alle filer {0}",
    "FIND_IN_FILES_FILE"                : "fil",
    "FIND_IN_FILES_FILES"               : "filer",
    "FIND_IN_FILES_MATCH"               : "treff",
    "FIND_IN_FILES_MATCHES"             : "treff",
    "FIND_IN_FILES_MORE_THAN"           : "Over ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd klikk for å ekspandere/kollapse alle",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Feil ved henting av oppdateringinfo",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Det var et problem å hente siste oppdateringsinformasjon fra serveren. Vennligst kontroller at du er tilkoblet internett og prøv på nytt.",

    // File exclusion filters
    "NO_FILE_FILTER"                    : "Ekskluder filer\u2026",
    "EDIT_FILE_FILTER"                  : "Rediger\u2026",
    "FILE_FILTER_DIALOG"                : "Rediger filter",
    "FILE_FILTER_INSTRUCTIONS"          : "Ekskluder filer og kataloger som er lik følgende strenger / understrenger eller <a href='{0}' title='{0}'>jokertegn</a>. Skriv inn hver streng på egen linje.",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "og {0} mere",
    "FILTER_COUNTING_FILES"             : "Teller filer\u2026",
    "FILTER_FILE_COUNT"                 : "Tillater {0} av {1} filer {2}",
    "FILTER_FILE_COUNT_ALL"             : "Tillater alle {0} filer {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Ingen Quick Edit tilgjengelig for denne markørposisjonen.",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "CSS Quick Edit: plassér markøren på et enkelt klassenavn",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "CSS Quick Edit: ufullstendig klasse attributt",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "CSS Quick Edit: ufullstendig id attributt",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "CSS Quick Edit: plassér markøren i tag, class eller id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "CSS Timing Function Quick Edit: ugyldig syntax",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "JS Quick Edit: plassér markøren i funksjonsnavnet",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Ingen Quick Docs tilgjengelig for denne markørposisjonen",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Laster\u2026",
    "UNTITLED"          : "Uten tittel",
    "WORKING_FILES"     : "Arbeidsfiler",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Linje {0}, Kolonne {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Valgt {0} kolonne",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Valgt {0} kolonner",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Valgt {0} linje",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Valgt {0} linjer",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} valg",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klikk for å bytte indentering til mellomrom",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klikk for å bytte indentering til tabulator",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klikk for å bytte antall mellomrom som brukes til indentering",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klikk for å bytte antall tabulatorer som brukes til indentering",
    "STATUSBAR_SPACES"                      : "Mellomrom:",
    "STATUSBAR_TAB_SIZE"                    : "Tabulatorbredde:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Linje",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Linjer",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Utvidelser deaktivert",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Problemer",
    "SINGLE_ERROR"                          : "1 {0} Problem",
    "MULTIPLE_ERRORS"                       : "{1} {0} Problemer",
    "NO_ERRORS"                             : "Ingen {0} problemer funnet - godt jobbet!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Ingen problemer funnet - godt jobbet!",
    "LINT_DISABLED"                         : "Linting er deaktivert",
    "NO_LINT_AVAILABLE"                     : "Ingen linter tilgjengelig for {0}",
    "NOTHING_TO_LINT"                       : "Ingenting å linte",
    "LINTER_TIMED_OUT"                      : "{0} tidsavbrudd etter å ha ventet i {1} ms",
    "LINTER_FAILED"                         : "{0} terminerte med feil: {1}",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Fil",
    "CMD_FILE_NEW_UNTITLED"               : "Ny",
    "CMD_FILE_NEW"                        : "Ny",
    "CMD_FILE_NEW_FOLDER"                 : "Ny katalog",
    "CMD_FILE_OPEN"                       : "Åpne\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Tilføye til arbeidsset",
    "CMD_OPEN_DROPPED_FILES"              : "Åpne droppete filer",
    "CMD_OPEN_FOLDER"                     : "Åpne katalogen\u2026",
    "CMD_FILE_CLOSE"                      : "Lukk",
    "CMD_FILE_CLOSE_ALL"                  : "Lukk alle",
    "CMD_FILE_CLOSE_LIST"                 : "Lukk liste",
    "CMD_FILE_CLOSE_OTHERS"               : "Lukk andre",
    "CMD_FILE_CLOSE_ABOVE"                : "Lukke andre over",
    "CMD_FILE_CLOSE_BELOW"                : "Lukk andre under",
    "CMD_FILE_SAVE"                       : "Lagre",
    "CMD_FILE_SAVE_ALL"                   : "Lagre alle",
    "CMD_FILE_SAVE_AS"                    : "Lagre som\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_PROJECT_SETTINGS"                : "Prosjektinstillinger\u2026",
    "CMD_FILE_RENAME"                     : "Gi nytt navn",
    "CMD_FILE_DELETE"                     : "Slett",
    "CMD_INSTALL_EXTENSION"               : "Installer utvidelser\u2026",
    "CMD_EXTENSION_MANAGER"               : "Utvidelsebehandleren\u2026",
    "CMD_FILE_REFRESH"                    : "Oppdater filtre",
    "CMD_QUIT"                            : "Avslutt",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Avslutt",

    // Edit menu commands
    "EDIT_MENU"                           : "Rediger",
    "CMD_UNDO"                            : "Angre",
    "CMD_REDO"                            : "Gjenta",
    "CMD_CUT"                             : "Klipp",
    "CMD_COPY"                            : "Kopier",
    "CMD_PASTE"                           : "Lim inn",
    "CMD_SELECT_ALL"                      : "Velg alt",
    "CMD_SELECT_LINE"                     : "Velg linje",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Splitt utvalg til linjer",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Legg til markør på neste linje",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Legg til markør på forrige linje",
    "CMD_INDENT"                          : "Øk innrykk",
    "CMD_UNINDENT"                        : "Reduser innrykk",
    "CMD_DUPLICATE"                       : "Dupliser",
    "CMD_DELETE_LINES"                    : "Slett linje",
    "CMD_COMMENT"                         : "Kommenter/utkommenter linjer",
    "CMD_BLOCK_COMMENT"                   : "Veksle blokkommentar",
    "CMD_LINE_UP"                         : "Flytt linje(r) opp",
    "CMD_LINE_DOWN"                       : "Flytt linje(r) ned",
    "CMD_OPEN_LINE_ABOVE"                 : "Åpne linje over",
    "CMD_OPEN_LINE_BELOW"                 : "Åpne linje under",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Automatisk avslutt krøllparenteser",
    "CMD_SHOW_CODE_HINTS"                 : "Vis kodehint",

    // Search menu commands
    "FIND_MENU"                           : "Finn",
    "CMD_FIND"                            : "Finn",
    "CMD_FIND_NEXT"                       : "Finn neste",
    "CMD_FIND_PREVIOUS"                   : "Finn forrige",
    "CMD_FIND_ALL_AND_SELECT"             : "Finn alle og velg",
    "CMD_ADD_NEXT_MATCH"                  : "Legg til neste treff til utvalg",
    "CMD_SKIP_CURRENT_MATCH"              : "Hopp over og legg til neste treff",
    "CMD_FIND_IN_FILES"                   : "Finn i filer",
    "CMD_FIND_IN_SUBTREE"                 : "Finn i\u2026",
    "CMD_REPLACE"                         : "Erstatt",

    // View menu commands
    "VIEW_MENU"                           : "Vis",
    "CMD_HIDE_SIDEBAR"                    : "Gjem sidestolpe",
    "CMD_SHOW_SIDEBAR"                    : "Vis sidestolpe",
    "CMD_INCREASE_FONT_SIZE"              : "Større skrift",
    "CMD_DECREASE_FONT_SIZE"              : "Mindre skrift",
    "CMD_RESTORE_FONT_SIZE"               : "Tilbakestill skriftstørrelse",
    "CMD_SCROLL_LINE_UP"                  : "Rull linje opp",
    "CMD_SCROLL_LINE_DOWN"                : "Rull linje ned",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Linjenummer",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Uthev aktiv linje",
    "CMD_TOGGLE_WORD_WRAP"                : "Tekstbryting",
    "CMD_LIVE_HIGHLIGHT"                  : "Live Preview Highlight",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint filer ved lagring",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Sorter på tilføyd",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Sorter på navn",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Sorter på type",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Automatisk sortering",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Naviger",
    "CMD_QUICK_OPEN"                      : "Hurtigåpne",
    "CMD_GOTO_LINE"                       : "Gå til linje",
    "CMD_GOTO_DEFINITION"                 : "Gå til definisjon",
    "CMD_GOTO_FIRST_PROBLEM"              : "Gå til første feil/advarsel",
    "CMD_TOGGLE_QUICK_EDIT"               : "Hurtigrediger",
    "CMD_TOGGLE_QUICK_DOCS"               : "Quick Docs",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Forrige treff",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Neste treff",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Ny regel",
    "CMD_NEXT_DOC"                        : "Neste dokument",
    "CMD_PREV_DOC"                        : "Forrige dokument",
    "CMD_SHOW_IN_TREE"                    : "Vis i filtre",
    "CMD_SHOW_IN_EXPLORER"                : "Vis i utforsker",
    "CMD_SHOW_IN_FINDER"                  : "Show in Finder",
    "CMD_SHOW_IN_OS"                      : "Vis i OS",

    // Help menu commands
    "HELP_MENU"                           : "Hjelp",
    "CMD_CHECK_FOR_UPDATE"                : "Se etter oppdateringer",
    "CMD_HOW_TO_USE_BRACKETS"             : "Hvordan bruke {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME} support",
    "CMD_SUGGEST"                         : "Foreslå en funksjonalitet",
    "CMD_RELEASE_NOTES"                   : "Utgivelsesnotat",
    "CMD_GET_INVOLVED"                    : "Bli involvert",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Vis utvidelser",
    "CMD_HOMEPAGE"                        : "{APP_TITLE} hjemmeside",
    "CMD_TWITTER"                         : "{TWITTER_NAME} på Twitter",
    "CMD_ABOUT"                           : "Om {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Åpne preferansefilen",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "eksperimentell bygg",
    "DEVELOPMENT_BUILD"                    : "utvikler bygg",
    "RELOAD_FROM_DISK"                     : "Oppdater fra disk",
    "KEEP_CHANGES_IN_EDITOR"               : "Behold endringer i editor",
    "CLOSE_DONT_SAVE"                      : "Lukk (ikke lagre)",
    "RELAUNCH_CHROME"                      : "Start Chrome på nytt",
    "ABOUT"                                : "Om",
    "CLOSE"                                : "Lukk",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Notices, terms and conditions pertaining to third party software are located at <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> and incorporated by reference herein.",
    "ABOUT_TEXT_LINE4"                     : "Documentation and source at <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Made with \u2764 and JavaScript by:",
    "ABOUT_TEXT_LINE6"                     : "Lots of people (but we're having trouble loading that data right now).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "En ny for {APP_NAME} er tilgjengelig! Klikk her for mer informasjon.",
    "UPDATE_AVAILABLE_TITLE"               : "Oppdatering er tilgjengelig",
    "UPDATE_MESSAGE"                       : "Hei, en ny bygg for {APP_NAME} er tilgjengelig. Her er noen av de nye funksjonene:",
    "GET_IT_NOW"                           : "Hent den nå!",
    "PROJECT_SETTINGS_TITLE"               : "Prosjektinstillinger for: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Live Preview base URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "For å bruke en lokal server, skriv inn en url lingnende http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Protokollen {0} er ikke støttet av Live Preview&mdash;vennligst bruk http: eller https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Base URL kan ikke inneholde søkeparametere som \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Base URL kan ikke inneholde hashes som \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Spesialtegn som '{0}' må bli %-kodet.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Ukjent feil ved tolking av base URL",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Ny regel",

    // Extension Management strings
    "INSTALL"                              : "Installer",
    "UPDATE"                               : "Oppdater",
    "REMOVE"                               : "Slett",
    "OVERWRITE"                            : "Overskriv",
    "CANT_REMOVE_DEV"                      : "Utvidelser i \"dev\" katalogen må slettes manuelt.",
    "CANT_UPDATE"                          : "Oppdatering er ikke kompatibel med denne versjonen av {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Utvidelser i \"dev\" katalogen kan ikke oppdateres automatisk.",
    "INSTALL_EXTENSION_TITLE"              : "Installer utvidelse",
    "UPDATE_EXTENSION_TITLE"               : "Oppdater utvidelse",
    "INSTALL_EXTENSION_LABEL"              : "Utvidelse URL",
    "INSTALL_EXTENSION_HINT"               : "URL for utvidelsens zipfil eller GitHub repo",
    "INSTALLING_FROM"                      : "Installerer utvidelse fra {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Installasjon var suksessfull!",
    "INSTALL_FAILED"                       : "Installasjonen feilet.",
    "CANCELING_INSTALL"                    : "Kansellerer\u2026",
    "CANCELING_HUNG"                       : "Kansellering av installasjonen tar lang tid. En intern feil kan ha oppstått.",
    "INSTALL_CANCELED"                     : "Installasjonen kansellert.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Nedlastet innhold er ikke en gyldig zipfil",
    "INVALID_PACKAGE_JSON"                 : "Filen package.json er ikke gyldig (error: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Filen package.json spesifiserer ikke pakkenavn.",
    "BAD_PACKAGE_NAME"                     : "{0} er et ugyldig pakkenavn.",
    "MISSING_PACKAGE_VERSION"              : "Filen package.json spesifiserer ikke en pakkeversjon.",
    "INVALID_VERSION_NUMBER"               : "Pakkens versjonsnummer {0} er ugyldig.",
    "INVALID_BRACKETS_VERSION"             : "{APP_NAME} kompatiblitetstreng ({0}) er ugyldig.",
    "DISALLOWED_WORDS"                     : "Ordene ({1}) er ikke tillatt i {0} feltet.",
    "API_NOT_COMPATIBLE"                   : "Utvidelsen er ikke kompatibel med denne versjonen av {APP_NAME}. Den er installert i katalogen for deaktiverte utvidelser.",
    "MISSING_MAIN"                         : "Pakken har ingen main.js fil.",
    "EXTENSION_ALREADY_INSTALLED"          : "Installasjon av denne pakken vil overskrive en tidligere installert utvidelse. Overskrive den gamle utvidelsen?",
    "EXTENSION_SAME_VERSION"               : "Denne pakken er den samme versjonen som er allerede installert. Overskrive den eksisterende utvidelsen?",
    "EXTENSION_OLDER_VERSION"              : "Denne pakken er versjon {0} som er eldre enn den installerte versjonen ({1}). Overskrive den eksisterende installasjonen?",
    "DOWNLOAD_ID_IN_USE"                   : "Intern feil: nedlastingsid er allerede i bruk.",
    "NO_SERVER_RESPONSE"                   : "Kan ikke koble til server.",
    "BAD_HTTP_STATUS"                      : "Fil ikke funnet på server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Kan ikke lagre nedlastingen til temporær fil.",
    "ERROR_LOADING"                        : "Det oppstod en feil ved oppstart av utvidelsen.",
    "MALFORMED_URL"                        : "URL er ugyldig. Vennligst kontroller at du tastet inn korrekt.",
    "UNSUPPORTED_PROTOCOL"                 : "URL må være en http eller https URL.",
    "UNKNOWN_ERROR"                        : "Ukjent intern feil.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Utvidelsesbehandler",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Kan ikke aksessere utvidelsesregisteret. Vennligst prøv igjen senere.",
    "INSTALL_FROM_URL"                     : "Installerer fra URL\u2026",
    "EXTENSION_AUTHOR"                     : "Forfatter",
    "EXTENSION_DATE"                       : "Dato",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Denne utvidelsen krever en nyere versjon av {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Denne utvidelsen virker bare med en eldre versjon av {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Versjon {0} av denne utvidelsen krever en nyere versjon av {APP_NAME}. Men du kan installere tidligere versjon {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Versjon {0} av denne utvidelsen krever en eldre versjon av {APP_NAME}. Men du kan installere tidligere versjon {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Ingen beskrivelse",
    "EXTENSION_MORE_INFO"                  : "Mer info...",
    "EXTENSION_ERROR"                      : "Utvidelsesfeil",
    "EXTENSION_KEYWORDS"                   : "Nøkkelord",
    "EXTENSION_INSTALLED"                  : "Installert",
    "EXTENSION_UPDATE_INSTALLED"           : "Denne utvidelsen har blitt lastet ned og vil bli installert etter omstart av {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Søk",
    "EXTENSION_MORE_INFO_LINK"             : "Mer",
    "BROWSE_EXTENSIONS"                    : "Bla gjennom utvidelser",
    "EXTENSION_MANAGER_REMOVE"             : "Slett utvidelse",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Klarte ikkke å fjerne en eller flere utvidelser: {0}. {APP_NAME} vil uansett starte på nytt.",
    "EXTENSION_MANAGER_UPDATE"             : "Oppdater utvidelse",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Klarte ikke å oppdatere en eller flere utvidelser: {0}. {APP_NAME} will uansett starte på nytt.",
    "MARKED_FOR_REMOVAL"                   : "Markert for sletting",
    "UNDO_REMOVE"                          : "Angre",
    "MARKED_FOR_UPDATE"                    : "Markert for oppdatering",
    "UNDO_UPDATE"                          : "Angre",
    "CHANGE_AND_RELOAD_TITLE"              : "Endre utvidelser",
    "CHANGE_AND_RELOAD_MESSAGE"            : "For å oppdatere eller slette markerte utvidelser, må {APP_NAME} starte på nytt. Du vil bli spurt om å lagre You'll be prompted to save unsaved changes.",
    "REMOVE_AND_RELOAD"                    : "Fjern utvidelse og start på nytt",
    "CHANGE_AND_RELOAD"                    : "Endre utvidelse og start på nytt",
    "UPDATE_AND_RELOAD"                    : "Oppdater utvidelse og start på nytt",
    "PROCESSING_EXTENSIONS"                : "Prosesserer utvidelseendringer\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Kunne ikke fjerne utvidelsen {0} ettersom den ikke var installert.",
    "NO_EXTENSIONS"                        : "Ingen utvidelser installert ennå.<br>Klikk på Tilgjengelig-fanen over for å komme i gang.",
    "NO_EXTENSION_MATCHES"                 : "Fant ingen utvidelser for ditt søk.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Vær forsiktig når du installerer utvidelser fra ukjent kilde.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Installert",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Tilgjengelig",
    "EXTENSIONS_UPDATES_TITLE"             : "Oppdateringer",

    "INLINE_EDITOR_NO_MATCHES"             : "Ingen treff.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Ingen eksisterende CSS regler passer ditt utvalg.<br> Klikk \"Ny regel\" for å lage en.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Det er ingen stilark i prosjektet ditt.<br>Lag ett for å legge til CSS regler.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "største",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "piksler",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "ERRORS"                                    : "Feil",
    "CMD_SHOW_DEV_TOOLS"                        : "Vis utviklerverktøy",
    "CMD_REFRESH_WINDOW"                        : "Gjenåpne med utvidelser",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Gjenåpne uten utvidelser",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nytt {APP_NAME} vindu",
    "CMD_SWITCH_LANGUAGE"                       : "Bytt språk",
    "CMD_RUN_UNIT_TESTS"                        : "Kjør tester",
    "CMD_SHOW_PERF_DATA"                        : "Vis ytelsesdata",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Aktiver Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Logg Nodestatus til konsoll",
    "CMD_RESTART_NODE"                          : "Omstart Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Vis feil i statuslinjen",

    "LANGUAGE_TITLE"                            : "Bytt språk",
    "LANGUAGE_MESSAGE"                          : "Velg ønsket språk fra listen under:",
    "LANGUAGE_SUBMIT"                           : "Gjenåpne {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Avbryt",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Sett systemforvalg",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Tid",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progresjon",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Flytt valgt punkt<br><kbd class='text'>Shift</kbd> Flytt med ti enheter<br><kbd class='text'>Tab</kbd> Bytt punkter",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Øk eller mink trinn<br><kbd>←</kbd><kbd>→</kbd> 'Start' eller 'Slutt'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Den gamle verdien <code>{0}</code> er ikke gyldig, den viste funksjonen ble endret til <code>{1}</code>. Dokumentet vil bli oppdatert ved første redigering.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Gjeldende farge",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Original farge",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa Format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex Format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa Format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Brukt {1} gang)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Brukt {1} ganger)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Hopp til definisjonen",
    "CMD_SHOW_PARAMETER_HINT"                   : "Vis parameter hint",
    "NO_ARGUMENTS"                              : "<ingen parametere>",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Quick View ved hovring",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Siste prosjekter",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Les mer"
});

/* Last translated for 36fd23e311b2bb7f64c37e56c00006d8795050da */
