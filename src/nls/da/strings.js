/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR"                     : "(fejl {0})",
    "NOT_FOUND_ERR"                     : "Filen kunne ikke findes.",
    "NOT_READABLE_ERR"                  : "Filen kunne ikke læses.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Den pågældende mappe kan ikke ændres.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Du har ikke tilladelse til at lave ændringer.",
    "CONTENTS_MODIFIED_ERR"             : "Filen er blevet ændret udenfor {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} understøtter i øjeblikket kun tekstfiler kodet i UTF-8.",
    "FILE_EXISTS_ERR"                   : "Filen eller mappen eksisterer allerede.",
    "FILE"                              : "filen",
    "DIRECTORY"                         : "mappen",
    "DIRECTORY_NAMES_LEDE"              : "Mappe navne",
    "FILENAMES_LEDE"                    : "Filnavne",
    "FILENAME"                          : "filnavn",
    "DIRECTORY_NAME"                    : "mappenavn",


    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Fejl ved indlæsning af projekt",
    "OPEN_DIALOG_ERROR"                 : "Der skete en fejl ved visning af \"Åbn fil\"-dialogboksen. (fejl {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Der skete en fejl i forsøget på at læse mappen <span class='dialog-filename'>{0}</span>. (fejl {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Der skete en fejl ved læsning af indholdet i mappen <span class='dialog-filename'>{0}</span>. (fejl {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Fejl ved åbning af fil",
    "ERROR_OPENING_FILE"                : "Der skete en fejl i forsøget på at åbne filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Der skete en fejl i forsøget på at åbne følgende filer:",
    "ERROR_RELOADING_FILE_TITLE"        : "Fejl ved genindlæsning af ændringer fra disk",
    "ERROR_RELOADING_FILE"              : "Der skete en fejl i forsøget på at genindlæse filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Fejl ved gemning af fil",
    "ERROR_SAVING_FILE"                 : "Der skete en fejl i forsøget på at gemme filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Fejl ved omdøbning af fil",
    "ERROR_RENAMING_FILE"               : "Der skete en fejl i forsøget på at omdøbe filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Fejl ved sletning af fil",
    "ERROR_DELETING_FILE"               : "Der skete en fejl i forsøget på at slette filen <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Ugyldigt {0}",
    "INVALID_FILENAME_MESSAGE"          : "{0} må ikke gøre brug af system-reserverede ord, ende med punktum (.) eller indeholde nogen af følgende tegn: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "En fil eller mappe med navnet <span class='dialog-filename'>{0}</span> eksisterer allerede.",
    "ERROR_CREATING_FILE_TITLE"         : "Fejl ved oprettelse af {0}",
    "ERROR_CREATING_FILE"               : "Der skete en fejl i forsøget på at oprette {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Fejl ved indlæsning af indstillinger",
    "ERROR_PREFS_CORRUPT"               : "Din konfigurationsfil er ikke gyldig JSON. Filen vil blive åbnet, så du kan rette formateringen. Du bliver nødt til at genindlæse {APP_NAME} for at anvende ændringerne.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} virker ikke i browsere endnu.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} er lavet i HTML, men lige nu fungerer det som et almindeligt computerprogram, så du kan bruge det til at redigere lokale filer. Brug venligst programskallen fra <b>github.com/adobe/brackets-shell</b> til at køre {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Fejl ved indeksering af filer",
    "ERROR_MAX_FILES"                   : "Det maksimale antal filer er blevet indekseret. Handlinger som tilgår filindekset fungerer måske ikke korrekt.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Fejl ved start af browser",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome browseren kunne ikke findes. Undersøg venligst om det er installeret korrekt.",
    "ERROR_LAUNCHING_BROWSER"           : "Der skete en fejl ved start af browseren. (fejl {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Fejl ved Live-Forhåndsvisning",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Forbinder til browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "For at Live-Forhåndsvisning kan forbinde, bliver Chrome nødt til at blive genstartet med fjern-fejlsøgning slået til.<br /><br />Ønsker du at genstarte Chrome med fjern-fejlsøgning slået til?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Kan ikke indlæse siden for Live-Forhåndsvisning",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Åbn en HTML-fil, eller sørg for at der er en fil ved navn <span class='dialog-filename'>index.html</span> i dit projekt, før du starter Live-Forhåndsvisning.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "For at bruge Live-Forhåndsvisning på en server-side fil, bliver du nødt til at angive en basis-URL for dette projekt.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Fejl ved opstart af HTTP-serveren for Live-Forhåndsvisning. Prøv igen.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Velkommen til Live-Forhåndsvisning!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live-Forhåndsvisning forbinder {APP_NAME} til din browser. Der åbnes en forhåndsvisning af din HTML-fil i browseren, som opdateres samtidig med at du redigerer i koden.<br /><br />I denne tidlige version af {APP_NAME}, virker Live-Forhåndsvisning kun med <strong>Google Chrome</strong> og opdaterer direkte imens du redigerer i <strong>CSS- eller HTML-filer</strong>. Ændringer i JavaScript-filer bliver automatisk genindlæst når du gemmer.<br /><br />(Denne besked bliver ikke vist igen.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "For yderligere information, se <a href='{0}' title='{0}'>Løsningsforslag til forbindelsesfejl vedrørende Live-Forhåndsvisning</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live-Forhåndsvisning",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live-Forhåndsvisning: Forbinder\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live-Forhåndsvisning: Starter op\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Afbryd Live-Forhåndsvisning",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live-Forhåndsvisning (gem fil for at genindlæse)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live-Forhåndsvisning (opdatering standset grundet syntaksfejl)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Live-Forhåndsvisning blev afbrudt fordi udviklerværktøjer blev åbnet i browseren",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Live-Forhåndsvisning blev afbrudt fordi siden blev lukket i browseren",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Live-Forhåndsvisning blev afbrudt fordi browseren navigerede til en side udenfor projektet",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Live-Forhåndsvisning blev afbrudt af ukendte årsager ({0})",

    "SAVE_CLOSE_TITLE"                  : "Gem ændringer",
    "SAVE_CLOSE_MESSAGE"                : "Ønsker du at gemme ændringerne i dokumentet <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Ønsker du at gemme ændringerne i følgende filer?",
    "EXT_MODIFIED_TITLE"                : "Eksterne ændringer",
    "CONFIRM_DELETE_TITLE"              : "Bekræft sletning",
    "CONFIRM_FOLDER_DELETE"             : "Er du sikker på at du vil slette mappen <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Fil slettet",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> er blevet ændret på disken.<br /><br />Ønsker du at gemme filen og overskrive disse ændringer?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> er blevet ændret på disken, men har også ikke-gemte ændringer i {APP_NAME}.<br /><br />Hvilken version ønsker du at beholde?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> er blevet slettet på disken, men har ikke-gemte ændringer i {APP_NAME}.<br /><br />Ønsker du at beholde disse ændringer?",

    // Generic dialog/button labels
    "DONE"                              : "Færdig",
    "OK"                                : "OK",
    "CANCEL"                            : "Annuller",
    "DONT_SAVE"                         : "Gem ikke",
    "SAVE"                              : "Gem",
    "SAVE_AS"                           : "Gem som\u2026",
    "SAVE_AND_OVERWRITE"                : "Overskriv",
    "DELETE"                            : "Slet",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nej",

    // Find, Replace, Find in Files
    "FIND_NO_RESULTS"                   : "Ingen resultater",
    "FIND_QUERY_PLACEHOLDER"            : "Søg\u2026",
    "REPLACE_PLACEHOLDER"               : "Erstat med\u2026",
    "BUTTON_REPLACE_ALL"                : "Alle\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Erstat\u2026",
    "BUTTON_REPLACE"                    : "Erstat",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Næste forekomst",
    "BUTTON_PREV_HINT"                  : "Forrige forekomst",
    "BUTTON_CASESENSITIVE_HINT"         : "Match store og små bogstaver",
    "BUTTON_REGEXP_HINT"                : "Regulært udtryk",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Erstat uden fortrydelse",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Da mere end {0} filer skal ændres, vil {APP_NAME} ændre uåbnede filer på disk.<br />Du vil ikke kunne fortryde ændringerne i disse filer.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Erstat uden fortrydelse",

    "OPEN_FILE"                         : "Åbn fil",
    "SAVE_FILE_AS"                      : "Gem fil",
    "CHOOSE_FOLDER"                     : "Vælg en mappe",

    "RELEASE_NOTES"                     : "Udgivelsesnoter",
    "NO_UPDATE_TITLE"                   : "Du er fuldt opdateret!",
    "NO_UPDATE_MESSAGE"                 : "Du bruger den seneste version af {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Erstat",
    "FIND_REPLACE_TITLE_WITH"           : "med",
    "FIND_TITLE_LABEL"                  : "Fundet",
    "FIND_TITLE_SUMMARY"                : "&mdash; {0} {1} {2} i {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "i <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "i projektet",
    "FIND_IN_FILES_ZERO_FILES"          : "Filtret udelukker alle filer {0}",
    "FIND_IN_FILES_FILE"                : "fil",
    "FIND_IN_FILES_FILES"               : "filer",
    "FIND_IN_FILES_MATCH"               : "forekomst",
    "FIND_IN_FILES_MATCHES"             : "forekomster",
    "FIND_IN_FILES_MORE_THAN"           : "Mere end ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl-/Cmd-klik for at udfolde/sammenfolde alt",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Fejl ved erstatning",
    "REPLACE_IN_FILES_ERRORS"           : "Følgende filer blev ikke behandlet, da de har ændret sig siden søgningen eller ikke kunne gemmes.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Fejl ved hentning af opdateringsinformation",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Der opstod en fejl ved hentning af seneste opdateringsinformationer fra serveren. Sørg venligst for at du er forbundet til internettet og prøv igen.",

    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Nyt udelukkelsessæt\u2026",
    "CLEAR_FILE_FILTER"                 : "Udeluk ingen filer",
    "NO_FILE_FILTER"                    : "Ingen filer udelukket",
    "EXCLUDE_FILE_FILTER"               : "Udeluk {0}",
    "EDIT_FILE_FILTER"                  : "Redigér\u2026",
    "FILE_FILTER_DIALOG"                : "Redigér udelukkelsessæt",
    "FILE_FILTER_INSTRUCTIONS"          : "Udeluk filer og mapper der matcher en eller flere af følgende (del)strenge eller <a href='{0}' title='{0}'>jokertegn</a>. Indtast hver streng på hver sin linje.",
    "FILTER_NAME_PLACEHOLDER"           : "Navngiv dette udelukkelsessæt (valgfrit)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "og {0} flere",
    "FILTER_COUNTING_FILES"             : "Tæller filer\u2026",
    "FILTER_FILE_COUNT"                 : "Tillader {0} af {1} filer {2}",
    "FILTER_FILE_COUNT_ALL"             : "Tillader alle {0} filer {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Ingen Lyn-Redigering tilgængelig for denne markørposition",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "CSS-Lyn-Redigering: placér markøren på et enkelt klassenavn",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "CSS-Lyn-Redigering: ukomplet klasse-attribut",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "CSS-Lyn-Redigering: ukomplet id-attribut",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "CSS-Lyn-Redigering: placér markøren i et tag, en klasse eller et id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "CSS-Timing-Funktion Lyn-Redigering: ugyldig syntaks",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "JS-Lyn-Redigering: placér markøren i et funktionsnavn",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Ingen Lyn-Dokumentation tilgængelig for denne markørposition",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Indlæser\u2026",
    "UNTITLED"          : "Unavngivet",
    "WORKING_FILES"     : "Arbejdsfiler",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Skift",
    "KEYBOARD_SPACE"  : "Mellemrum",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Linje {0}, kolonne {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} kolonne markeret",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} kolonner markeret",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} linje markeret",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} linjer markeret",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} markeringer",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klik for at skifte indrykning til mellemrum",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klik for at skifte indrykning til tabulatorstop",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klik for at ændre antallet af mellemrum ved indrykning",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klik for at ændre bredde af tabulatorstop",
    "STATUSBAR_SPACES"                      : "Mellemrum:",
    "STATUSBAR_TAB_SIZE"                    : "Tabulatorbredde:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} linje",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} linjer",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Udvidelser slået fra",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} problemer",
    "SINGLE_ERROR"                          : "1 {0}-problem",
    "MULTIPLE_ERRORS"                       : "{1} {0}-problemer",
    "NO_ERRORS"                             : "Ingen {0}-problemer fundet - godt gået!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Ingen problemer fundet - godt gået!",
    "LINT_DISABLED"                         : "Lintning er slået fra",
    "NO_LINT_AVAILABLE"                     : "Ingen linter tilgængelig for {0}",
    "NOTHING_TO_LINT"                       : "Intet at linte",
    "LINTER_TIMED_OUT"                      : "{0} har opgivet at vente efter {1} ms",
    "LINTER_FAILED"                         : "{0} afsluttede med fejl: {1}",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Filer",
    "CMD_FILE_NEW_UNTITLED"               : "Ny",
    "CMD_FILE_NEW"                        : "Ny fil",
    "CMD_FILE_NEW_FOLDER"                 : "Ny mappe",
    "CMD_FILE_OPEN"                       : "Åbn\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Tilføj til arbejdsfiler",
    "CMD_OPEN_DROPPED_FILES"              : "Åbn droppede filer",
    "CMD_OPEN_FOLDER"                     : "Åbn mappe\u2026",
    "CMD_FILE_CLOSE"                      : "Luk",
    "CMD_FILE_CLOSE_ALL"                  : "Luk alle",
    "CMD_FILE_CLOSE_LIST"                 : "Luk liste",
    "CMD_FILE_CLOSE_OTHERS"               : "Luk øvrige",
    "CMD_FILE_CLOSE_ABOVE"                : "Luk ovenstående",
    "CMD_FILE_CLOSE_BELOW"                : "Luk nedenstående",
    "CMD_FILE_SAVE"                       : "Gem",
    "CMD_FILE_SAVE_ALL"                   : "Gem alle",
    "CMD_FILE_SAVE_AS"                    : "Gem som\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live-Forhåndsvisning",
    "CMD_PROJECT_SETTINGS"                : "Projektindstillinger\u2026",
    "CMD_FILE_RENAME"                     : "Omdøb",
    "CMD_FILE_DELETE"                     : "Slet",
    "CMD_INSTALL_EXTENSION"               : "Installér udvidelse\u2026",
    "CMD_EXTENSION_MANAGER"               : "Udvidelseshåndtering\u2026",
    "CMD_FILE_REFRESH"                    : "Genindlæs filtræ",
    "CMD_QUIT"                            : "Afslut",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Afslut",

    // Edit menu commands
    "EDIT_MENU"                           : "Redigér",
    "CMD_UNDO"                            : "Fortryd",
    "CMD_REDO"                            : "Gentag",
    "CMD_CUT"                             : "Klip",
    "CMD_COPY"                            : "Kopiér",
    "CMD_PASTE"                           : "Sæt ind",
    "CMD_SELECT_ALL"                      : "Markér alt",
    "CMD_SELECT_LINE"                     : "Markér linje",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Opdel markering i linjer",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Tilføj markør til næste linje",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Tilføj markør til forrige linje",
    "CMD_INDENT"                          : "Indryk",
    "CMD_UNINDENT"                        : "Udryk",
    "CMD_DUPLICATE"                       : "Duplikér",
    "CMD_DELETE_LINES"                    : "Slet linje",
    "CMD_COMMENT"                         : "Slå linje-kommentar til/fra",
    "CMD_BLOCK_COMMENT"                   : "Slå blok-kommentar til/fra",
    "CMD_LINE_UP"                         : "Flyt linje op",
    "CMD_LINE_DOWN"                       : "Flyt linje ned",
    "CMD_OPEN_LINE_ABOVE"                 : "Åbn linjen ovenover",
    "CMD_OPEN_LINE_BELOW"                 : "Åbn linjen nedenunder",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Luk parenteser automatisk",
    "CMD_SHOW_CODE_HINTS"                 : "Vis kodehjælp",

    // Search menu commands
    "FIND_MENU"                           : "Søg",
    "CMD_FIND"                            : "Søg",
    "CMD_FIND_NEXT"                       : "Find næste",
    "CMD_FIND_PREVIOUS"                   : "Find forrige",
    "CMD_FIND_ALL_AND_SELECT"             : "Find alle og markér",
    "CMD_ADD_NEXT_MATCH"                  : "Tilføj næste forekomst til markeringer",
    "CMD_SKIP_CURRENT_MATCH"              : "Spring over og tilføj næste forekomst",
    "CMD_FIND_IN_FILES"                   : "Søg i filer",
    "CMD_FIND_IN_SUBTREE"                 : "Søg i\u2026",
    "CMD_REPLACE"                         : "Erstat",
    "CMD_REPLACE_IN_FILES"                : "Erstat i filer",
    "CMD_REPLACE_IN_SUBTREE"              : "Erstat i\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Vis",
    "CMD_HIDE_SIDEBAR"                    : "Skjul sidepanel",
    "CMD_SHOW_SIDEBAR"                    : "Vis sidepanel",
    "CMD_INCREASE_FONT_SIZE"              : "Forøg skriftstørrelse",
    "CMD_DECREASE_FONT_SIZE"              : "Formindsk skriftstørrelse",
    "CMD_RESTORE_FONT_SIZE"               : "Nulstil skriftstørrelse",
    "CMD_SCROLL_LINE_UP"                  : "Rul en linje op",
    "CMD_SCROLL_LINE_DOWN"                : "Rul en linje ned",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Linjenumre",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Fremhæv aktiv linje",
    "CMD_TOGGLE_WORD_WRAP"                : "Tekstombrydning",
    "CMD_LIVE_HIGHLIGHT"                  : "Fremhæv i Live-Forhåndsvisning",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint filer når de gemmes",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Sortér efter tilføjelse",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Sortér efter navn",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Sortér efter type",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Automatisk sortering",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigér",
    "CMD_QUICK_OPEN"                      : "Lyn-åbn",
    "CMD_GOTO_LINE"                       : "Gå til linje",
    "CMD_GOTO_DEFINITION"                 : "Lyn-søg efter definition",
    "CMD_GOTO_FIRST_PROBLEM"              : "Gå til første fejl/advarsel",
    "CMD_TOGGLE_QUICK_EDIT"               : "Lyn-Redigering",
    "CMD_TOGGLE_QUICK_DOCS"               : "Lyn-Dokumentation",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Forrige forekomst",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Næste forekomst",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Ny regel",
    "CMD_NEXT_DOC"                        : "Næste dokument",
    "CMD_PREV_DOC"                        : "Forrige dokument",
    "CMD_SHOW_IN_TREE"                    : "Vis i filtræ",
    "CMD_SHOW_IN_EXPLORER"                : "Vis i Stifinder",
    "CMD_SHOW_IN_FINDER"                  : "Vis i Finder",
    "CMD_SHOW_IN_OS"                      : "Vis i OS",

    // Help menu commands
    "HELP_MENU"                           : "Hjælp",
    "CMD_CHECK_FOR_UPDATE"                : "Kontrollér for opdateringer",
    "CMD_HOW_TO_USE_BRACKETS"             : "Sådan bruger du {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME} support",
    "CMD_SUGGEST"                         : "Foreslå en funktion",
    "CMD_RELEASE_NOTES"                   : "Udgivelsesnoter",
    "CMD_GET_INVOLVED"                    : "Bliv involveret",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Vis udvidelsesmappe",
    "CMD_HOMEPAGE"                        : "{APP_TITLE} hjemmeside",
    "CMD_TWITTER"                         : "{TWITTER_NAME} på Twitter",
    "CMD_ABOUT"                           : "Om {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Åbn konfigurationsfil",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "eksperimentiel version",
    "DEVELOPMENT_BUILD"                    : "udviklerversion",
    "RELOAD_FROM_DISK"                     : "Genindlæs fra disk",
    "KEEP_CHANGES_IN_EDITOR"               : "Behold ændringer i editor",
    "CLOSE_DONT_SAVE"                      : "Luk (uden at gemme)",
    "RELAUNCH_CHROME"                      : "Genstart Chrome",
    "ABOUT"                                : "Om",
    "CLOSE"                                : "Luk",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "fabrikationstidspunkt: ",
    "ABOUT_TEXT_LINE3"                     : "Bemærkninger om og/eller yderligere betingelser og vilkår for tredjeparts software kan findes på <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> og medtaget heri som reference.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentation og kildekode på <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Skabt med \u2764 og JavaScript af:",
    "ABOUT_TEXT_LINE6"                     : "En masse mennesker (men vi har problemer med at hente det data i øjeblikket).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Dokumentationen og det grafiske logo fra Web Platform er udgivet under en Creative Commons Attribution licens, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Der ligger en ny version af {APP_NAME} klar! Klik her for at læse mere.",
    "UPDATE_AVAILABLE_TITLE"               : "Opdatering klar",
    "UPDATE_MESSAGE"                       : "Hey! Der er en ny version af {APP_NAME} tilgængelig. Her er nogen af de nye funktioner:",
    "GET_IT_NOW"                           : "Hent den nu!",
    "PROJECT_SETTINGS_TITLE"               : "Projektindstillinger for: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Basis-URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "For at bruge en lokal server, indtast en URL såsom http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0}-protokollen er ikke understøttet af Live-Forhåndsvisning&mdash;Brug venligst http: eller https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Basis-URL'en kan ikke indeholde søgeparametre såsom \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Basis-URL'en kan ikke indeholde interne henvisninger såsom \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Specielle tegn såsom '{0}' skal kodes med %.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Ukendt fejl ved tolkning af Basis-URL",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Ny regel",

    // Extension Management strings
    "INSTALL"                              : "Installér",
    "UPDATE"                               : "Opdatér",
    "REMOVE"                               : "Fjern",
    "OVERWRITE"                            : "Overskriv",
    "CANT_REMOVE_DEV"                      : "Udvidelser i \"dev\"-mappen skal slettes manuelt.",
    "CANT_UPDATE"                          : "Opdateringen er ikke kompatibel med denne version af {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Udvidelser i \"dev\"-mappen kan ikke opdateres automatisk.",
    "INSTALL_EXTENSION_TITLE"              : "Installér udvidelse",
    "UPDATE_EXTENSION_TITLE"               : "Opdatér udvidelse",
    "INSTALL_EXTENSION_LABEL"              : "Udvidelses-URL",
    "INSTALL_EXTENSION_HINT"               : "URL til udvidelsens zip-fil eller GitHub-repo",
    "INSTALLING_FROM"                      : "Installerer udvidelse fra {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Installation lykkedes!",
    "INSTALL_FAILED"                       : "Installation mislykkedes.",
    "CANCELING_INSTALL"                    : "Afbryder\u2026",
    "CANCELING_HUNG"                       : "Afbrydelsen af installationen tager lang tid. En intern fejl er måske opstået.",
    "INSTALL_CANCELED"                     : "Installation afbrudt.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Det modtagede indhold er ikke en gyldig zip-fil.",
    "INVALID_PACKAGE_JSON"                 : "Filen <span class='dialog-filename'>package.json</span> er ugyldig (fejl: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Filen <span class='dialog-filename'>package.json</span> angiver ikke et pakkenavn.",
    "BAD_PACKAGE_NAME"                     : "{0} er et ugyldigt pakkenavn.",
    "MISSING_PACKAGE_VERSION"              : "Filen <span class='dialog-filename'>package.json</span> angiver ikke en pakkeversion.",
    "INVALID_VERSION_NUMBER"               : "Pakkeversionsnummeret ({0}) er ugyldigt.",
    "INVALID_BRACKETS_VERSION"             : "Kompatibilitets-strengen for {APP_NAME} ({0}) er ugyldig.",
    "DISALLOWED_WORDS"                     : "Ordene ({1}) er ikke tilladt i {0}-feltet.",
    "API_NOT_COMPATIBLE"                   : "Udvidelsen er ikke kompatibel med denne version af {APP_NAME}. Den er installeret i mappen for deaktiverede udvidelser.",
    "MISSING_MAIN"                         : "Pakken har ingen fil ved navn <span class='dialog-filename'>main.js</span>.",
    "EXTENSION_ALREADY_INSTALLED"          : "Denne pakke vil overskrive en tidligere installation. Overskriv den gamle udvidelse?",
    "EXTENSION_SAME_VERSION"               : "Denne pakke er samme version som den installerede. Overskriv den eksisterende installation?",
    "EXTENSION_OLDER_VERSION"              : "Denne pakke er version {0}, som er ældre end den nuværende installation ({1}). Overskriv den eksisterende installation?",
    "DOWNLOAD_ID_IN_USE"                   : "Intern fejl: download-ID er allerede i brug.",
    "NO_SERVER_RESPONSE"                   : "Kan ikke forbinde til server.",
    "BAD_HTTP_STATUS"                      : "Filen kunne ikke findes på serveren (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Ikke i stand til at gemme nedhentede data til en midlertidig fil.",
    "ERROR_LOADING"                        : "Udvidelsen stødte på en fejl imens den startede op.",
    "MALFORMED_URL"                        : "URL'en er ugyldig. Sørg for at du har indtastet den korrekt.",
    "UNSUPPORTED_PROTOCOL"                 : "URL'en skal være en http- eller https-URL.",
    "UNKNOWN_ERROR"                        : "Ukendt intern fejl.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Udvidelseshåndtering",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Ikke i stand til at tilgå udvidelsesregistret. Prøv igen senere.",
    "INSTALL_FROM_URL"                     : "Installér fra URL\u2026",
    "EXTENSION_AUTHOR"                     : "Forfatter",
    "EXTENSION_DATE"                       : "Dato",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Denne udvidelse kræver en nyere version af {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Denne udvidelse virker i øjeblikket kun med ældre versioner af {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Version {0} af denne udvidelse kræver en nyere version af {APP_NAME}. Men du kan installere den tidligere version {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Version {0} af denne udvidelse virker kun med en ældre version af {APP_NAME}. Men du kan installere den tidligere version {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Ingen beskrivelse",
    "EXTENSION_MORE_INFO"                  : "Mere information...",
    "EXTENSION_ERROR"                      : "Udvidelsesfejl",
    "EXTENSION_KEYWORDS"                   : "Nøgleord",
    "EXTENSION_INSTALLED"                  : "Installeret",
    "EXTENSION_UPDATE_INSTALLED"           : "Opdatering til denne udvidelse er blevet hentet og vil blive installeret efter at {APP_NAME} er genindlæst.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Søg",
    "EXTENSION_MORE_INFO_LINK"             : "Mere",
    "BROWSE_EXTENSIONS"                    : "Gennemse udvidelser",
    "EXTENSION_MANAGER_REMOVE"             : "Fjern udvidelse",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Ikke i stand til at fjerne en eller flere udvidelser: {0}. {APP_NAME} vil stadig blive genindlæst.",
    "EXTENSION_MANAGER_UPDATE"             : "Opdatér udvidelse",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Ikke i stand til at opdatere en eller flere udvidelser: {0}. {APP_NAME} vil stadig blive genindlæst.",
    "MARKED_FOR_REMOVAL"                   : "Markeret til fjernelse",
    "UNDO_REMOVE"                          : "Fortryd",
    "MARKED_FOR_UPDATE"                    : "Markeret til opdatering",
    "UNDO_UPDATE"                          : "Fortryd",
    "CHANGE_AND_RELOAD_TITLE"              : "Gennemfør ændringer på udvidelser",
    "CHANGE_AND_RELOAD_MESSAGE"            : "For at opdatere eller fjerne de valgte udvidelser bliver {APP_NAME} nødt til at blive genindlæst. Du vil blive bedt om at gemme ikke-gemte ændringer.",
    "REMOVE_AND_RELOAD"                    : "Fjern udvidelser og genindlæs",
    "CHANGE_AND_RELOAD"                    : "Gennemfør ændringer og genindlæs",
    "UPDATE_AND_RELOAD"                    : "Opdatér udvidelser og genindlæs",
    "PROCESSING_EXTENSIONS"                : "Behandler udvidelsesændringer\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Kunne ikke fjerne udvidelsen {0} da den ikke er installeret.",
    "NO_EXTENSIONS"                        : "Ingen udvidelser er installeret endnu.<br>Klik på \"Udvalg\" foroven for at komme i gang.",
    "NO_EXTENSION_MATCHES"                 : "Ingen udvidelser matcher din søgning.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Vær forsigtig med at installere udvidelser fra en ukendt kilde.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Installeret",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Udvalg",
    "EXTENSIONS_UPDATES_TITLE"             : "Opdateringer",

    "INLINE_EDITOR_NO_MATCHES"             : "Ingen forekomster.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Der eksisterer ingen CSS-regler, som matcher det markerede element.<br> Klik \"Ny regel\" for at oprette en.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Der er ingen stylesheets i dit projekt.<br>Opret et for at tilføje CSS-regler.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "største",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixler",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Fejlsøgning",
    "ERRORS"                                    : "Fejl",
    "CMD_SHOW_DEV_TOOLS"                        : "Vis udviklerværktøjer",
    "CMD_REFRESH_WINDOW"                        : "Genindlæs med udvidelser",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Genindlæs uden udvidelser",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nyt {APP_NAME} vindue",
    "CMD_SWITCH_LANGUAGE"                       : "Skift sprog",
    "CMD_RUN_UNIT_TESTS"                        : "Kør enhedstest",
    "CMD_SHOW_PERF_DATA"                        : "Vis ydelsesdata",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Slå Node-debugger til",
    "CMD_LOG_NODE_STATE"                        : "Log Node tilstand til konsol",
    "CMD_RESTART_NODE"                          : "Genstart Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Vis fejl i statuslinjen",

    "LANGUAGE_TITLE"                            : "Skift sprog",
    "LANGUAGE_MESSAGE"                          : "Sprog:",
    "LANGUAGE_SUBMIT"                           : "Genindlæs {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Annuller",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Systemets sprog",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Tid",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Forløb",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Flyt valgte punkt<br><kbd class='text'>Skift</kbd> Flyt ti enheder af gangen<br><kbd class='text'>Tab</kbd> Skift punkter",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Forøg eller formindsk antal trin<br><kbd>←</kbd><kbd>→</kbd> 'Start' eller 'End'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Den gamle værdi <code>{0}</code> er ikke gyldig, så den viste funktion blev ændret til <code>{1}</code>. Dokumentet vil blive opdateret ved første redigering.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Nuværende farve",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Oprindelig farve",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa-format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex-format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa-format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Brugt {1} gang)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Brugt {1} gange)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Hop til definition",
    "CMD_SHOW_PARAMETER_HINT"                   : "Vis parameterhjælp",
    "NO_ARGUMENTS"                              : "<ingen parametre>",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Lyn-visning af det du peger på",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Seneste projekter",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Læs mere"
});

/* Last translated for 3a762c3cf91d6f65a5bb19aeb2056afacd777c71 */
