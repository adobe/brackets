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
    "GENERIC_ERROR" : "(feil {0})",
    "NOT_FOUND_ERR" : "Kunne ikke finne filen.",
    "NOT_READABLE_ERR" : "Filen kunne ikke bli lest.",
    "NO_MODIFICATION_ALLOWED_ERR" : "Målkatalogen kunnet ikke bli modifisert.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE" : "Rettighetene tillater ikke modifikasjoner.",

    // Project error strings
    "ERROR_LOADING_PROJECT" : "Feil ved lasting av prosjektet",
    "OPEN_DIALOG_ERROR" : "Det oppstod en feil ved forsøk på å åpne fildialog. (feil {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR" : "Det oppstod en feil ved forsøk på å laste katalogen <span class='dialog-filename'>{0}</span>. (feil {1})",
    "READ_DIRECTORY_ENTRIES_ERROR" : "Det oppstod en feil ved lesing av innholdet i katalogen <span class='dialog-filename'>{0}</span>. (feil {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE" : "Feil ved åpning av filen",
    "ERROR_OPENING_FILE" : "Det oppstod en feil ved forsøk på å åpne filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE" : "Feil ved oppfriskning av endringer fra disk",
    "ERROR_RELOADING_FILE" : "Det oppstod en feil ved forsøk på å oppfriske filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE" : "Feil ved lagring av fil",
    "ERROR_SAVING_FILE" : "Det oppstod en feil ved forsøk på å lagre filen <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE" : "Ugyldig filnavn",
    "INVALID_FILENAME_MESSAGE" : "Filnavn kan ikke inneholde følgende tegn: {0}",
    "FILE_ALREADY_EXISTS" : "Filen <span class='dialog-filename'>{0}</span> eksisterer allerede.",
    "ERROR_CREATING_FILE_TITLE" : "Feil ved oppretting av fil",
    "ERROR_CREATING_FILE" : "Det oppstod en feil ved forsøk på å opprette filen <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE" : "Oops! {APP_NAME} kjører ikke i nettlesere ennå.",
    "ERROR_IN_BROWSER" : "{APP_NAME} er bygd med HTML, men akkurat nå kjører den som en skrivebords-app slik at du kan bruke den til å redigere lokale filer. Vennligst bruk applikasjonsskallet <b>github.com/adobe/brackets-app</b> repo'et for å kjøre {APP_NAME}",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE" : "Feil ved indeksering av filer",
    "ERROR_MAX_FILES" : "Maksimalt antall filer har blitt indeksert. Handlinger som slår opp filer i indeksen kan feile.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE" : "Feil ved åpning av nettleser",
    "ERROR_CANT_FIND_CHROME" : "Nettleseren Google Chrome ble ikke funnet. Vennligst sørg for at den er installert.",
    "ERROR_LAUNCHING_BROWSER" : "En feil skjedde ved åpning av Nettleseren. (feil {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE" : "Live Preview feil",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE" : "Kobler til nettleser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE" : "En Live Preview kobling til Chrome kunne ikke bli etablert. For at Live Preview skal fungere må Chrome startes med remote debugging på.<br /><br />Ønsker du å start Chrome på nytt med remote debugging slått på?",
    "LIVE_DEV_NEED_HTML_MESSAGE" : "Åpne en HTML-fil for å åpne live Preview.",
    "LIVE_DEVELOPMENT_INFO_TITLE" : "Velkommen til Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE" : "Live Preview kobler {APP_NAME} til din nettleser. Den åpner en forhåndsvisning av HTML-filen i nettleseren. Forhåndsvisningen oppdateres umiddelbart når du redigerer koden.<br /><br />I denne tidlige versjonen av {APP_NAME} fungerer Live Preview bare for endringer av <strong>CSS-filer</strong> og bare med <strong>Google Chrome</strong>. Vi ønsker å implementere det for HTML og JavaScript også snart!<br /><br /> (Du ser bare denne meldingen en gang).",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1" : "Live Preview: Kobler til\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2" : "Live Preview: Initaliserer\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED" : "Koble fra Live Preview",

    "SAVE_CLOSE_TITLE" : "Lagre endringer",
    "SAVE_CLOSE_MESSAGE" : "Ønsker du å lagre enderinger i dokumentet <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE" : "Ønsker du å lagre enderinger i følgende filer?",
    "EXT_MODIFIED_TITLE" : "Eksterne endringer",
    "EXT_MODIFIED_MESSAGE" : "<span class='dialog-filename'>{0}</span> er blitt endret på disk, men har samtidig ulagrede endringer i {APP_NAME}.<br /><br />Hvilken versjon ønsker du å beholde?",
    "EXT_DELETED_MESSAGE" : "<span class='dialog-filename'>{0}</span> er blitt slettet på disken, men har ulagrede endringer i {APP_NAME}.<br /><br />Ønsker du å beholde endringene?",

    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO" : "Bruk /re/ syntaks for søk med regulære utrykk",
    "WITH" : "Med",
    "BUTTON_YES" : "Ja",
    "BUTTON_NO" : "Nei",
    "BUTTON_STOP" : "Stop",

    "OPEN_FILE" : "Åpne fil",
    "CHOOSE_FOLDER" : "Velg katalog",

    "RELEASE_NOTES" : "Versjonsmerknader",
    "NO_UPDATE_TITLE" : "Du er oppdatert!",
    "NO_UPDATE_MESSAGE" : "Du kjører den nyeste versjonen av {APP_NAME}.",

    "FIND_IN_FILES_TITLE" : "- {0} {1} i {2} {3}",
    "FIND_IN_FILES_FILE" : "fil",
    "FIND_IN_FILES_FILES" : "filer",
    "FIND_IN_FILES_MATCH" : "treff",
    "FIND_IN_FILES_MATCHES" : "treff",
    "FIND_IN_FILES_MAX" : " (viser kun første {0} treff)",
    "FIND_IN_FILES_FILE_PATH" : "Fil: <b>{0}</b>",
    "FIND_IN_FILES_LINE" : "linje:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE" : "Feil ved henting av oppdatering info",
    "ERROR_FETCHING_UPDATE_INFO_MSG" : "Det oppstod et problem ved å få informasjon fra serveren. Vennligst sørg for at du er koblet til internett og prøv på nytt.",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Uten Tittel",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU" : "Fil",
    "CMD_FILE_NEW" : "Ny",
    "CMD_FILE_OPEN" : "Åpne\u2026",
    "CMD_ADD_TO_WORKING_SET" : "Add To Working Set",
    "CMD_OPEN_FOLDER" : "Åpne mappe\u2026",
    "CMD_FILE_CLOSE" : "Lukk",
    "CMD_FILE_CLOSE_ALL" : "Lukk alle",
    "CMD_FILE_SAVE" : "Lagre",
    "CMD_FILE_SAVE_ALL" : "Lagre alle",
    "CMD_LIVE_FILE_PREVIEW" : "Live Preview",
    "CMD_QUIT" : "Avslutt",

    // Edit menu commands
    "EDIT_MENU" : "Rediger",
    "CMD_SELECT_ALL" : "Velg alt",
    "CMD_FIND" : "Finn",
    "CMD_FIND_IN_FILES" : "Finn i filer",
    "CMD_FIND_NEXT" : "Finn neste",
    "CMD_FIND_PREVIOUS" : "Finn forrige",
    "CMD_REPLACE" : "Erstatt",
    "CMD_INDENT" : "Øk innrykk",
    "CMD_UNINDENT" : "Reduser innrykk",
    "CMD_DUPLICATE" : "Dupliker",
    "CMD_COMMENT" : "Kommenter/utkommenter linjer",
    "CMD_LINE_UP" : "Flytt linje(r) opp",
    "CMD_LINE_DOWN" : "Flytt linje(r) ned",

    // View menu commands
    "VIEW_MENU" : "Vis",
    "CMD_HIDE_SIDEBAR" : "Gjem sidestolpe",
    "CMD_SHOW_SIDEBAR" : "Vis sidestolpe",
    "CMD_INCREASE_FONT_SIZE" : "Større skrift",
    "CMD_DECREASE_FONT_SIZE" : "Mindre skrift",
    "CMD_RESTORE_FONT_SIZE" : "Tilbakestill skriftstørrelse",

    // Navigate menu Commands
    "NAVIGATE_MENU" : "Naviger",
    "CMD_QUICK_OPEN" : "Hurtigåpne",
    "CMD_GOTO_LINE" : "Gå til linje",
    "CMD_GOTO_DEFINITION" : "Gå til definisjon",
    "CMD_TOGGLE_QUICK_EDIT" : "Hurtigrediger",
    "CMD_QUICK_EDIT_PREV_MATCH" : "Forrige match",
    "CMD_QUICK_EDIT_NEXT_MATCH" : "Neste match",
    "CMD_NEXT_DOC" : "Neste dokument",
    "CMD_PREV_DOC" : "Forrige dokument",

    // Help menu commands
    "HELP_MENU" : "Hjelp",
    "CMD_CHECK_FOR_UPDATE" : "Se etter oppdateringer",
    "CMD_SHOW_EXTENSIONS_FOLDER" : "Vis ekstensjoner",
    "CMD_FORUM" : "{APP_NAME} forum",
    "CMD_ABOUT" : "Om {APP_TITLE}",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW" : "Lukk vindu",
    "CMD_ABORT_QUIT" : "Abort lukk",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD" : "Experimental build",
    "SEARCH_RESULTS" : "Søkeresultater",
    "OK" : "OK",
    "DONT_SAVE" : "Ikke lagre",
    "SAVE" : "Lagre",
    "CANCEL" : "Avbryt",
    "RELOAD_FROM_DISK" : "Oppdater fra disk",
    "KEEP_CHANGES_IN_EDITOR" : "Behold endringer i editor",
    "CLOSE_DONT_SAVE" : "Lukk (ikke lagre)",
    "RELAUNCH_CHROME" : "Start Chrome på nytt",
    "ABOUT" : "About",
    "CLOSE" : "Lukk",
    "ABOUT_TEXT_LINE1" : "sprint {VERSION_MINOR} experimental build {VERSION}",
    "ABOUT_TEXT_LINE3" : "Notices, terms and conditions pertaining to third party software are located at <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> and incorporated by reference herein.",
    "ABOUT_TEXT_LINE4" : "Documentation and source at <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP" : "En ny for {APP_NAME} er tilgjengelig! Klikk her for mer informasjon.",
    "UPDATE_AVAILABLE_TITLE" : "Oppdatering er tilgjengelig",
    "UPDATE_MESSAGE" : "Hei, en ny bygg for {APP_NAME} er tilgjengelig. Her er noen av de nye funksjonene:",
    "GET_IT_NOW" : "Hent den nå!",
    
    
    // extensions/default/DebugCommands
    "DEBUG_MENU" : "Debug",
    "CMD_SHOW_DEV_TOOLS" : "Vis utviklerverktøy",
    "CMD_REFRESH_WINDOW" : "Oppdater {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW" : "Nytt {APP_NAME} vindu",
    "CMD_SWITCH_LANGUAGE" : "Bytt språk",
    "CMD_RUN_UNIT_TESTS" : "Kjør tester",
    "CMD_SHOW_PERF_DATA" : "Vis ytelsesdata",
    
    "LANGUAGE_TITLE" : "Bytt språk",
    "LANGUAGE_MESSAGE" : "Velg ønsket språk fra listen under:",
    "LANGUAGE_SUBMIT" : "Gjenåpne {APP_NAME}",
    "LANGUAGE_CANCEL" : "Avbryt",
    
    // extensions/default/JSLint
    "CMD_JSLINT" : "Aktiver JSLint",
    "JSLINT_ERRORS" : "JSLint feil"
});
