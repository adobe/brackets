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
    "INVALID_FILENAME_MESSAGE" : "Filnavn kan ikke inneholde følgende tegn: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS" : "Filen <span class='dialog-filename'>{0}</span> eksisterer allerede.",
    "ERROR_CREATING_FILE_TITLE" : "Feil ved oppretting av fil",
    "ERROR_CREATING_FILE" : "Det oppstod en feil ved forsøk på å opprette filen <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_BRACKETS_IN_BROWSER_TITLE" : "Oops! Brackets kjører ikke i nettlesere ennå.",
    "ERROR_BRACKETS_IN_BROWSER" : "Brackets er bygd med HTML, men akkurat nå kjører den som en skrivebords-app slik at du kan bruke den til å redigere lokale filer. Vennligst bruk applikasjonsskallet <b>github.com/adobe/brackets-app</b> repo'et for å kjøre Brackets",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE" : "Feil ved indeksering av filer",
    "ERROR_MAX_FILES" : "Maksimalt antall filer har blitt indeksert. Handlinger som slår opp filer i indeksen kan feile.",

    // CSSManager error strings
    "ERROR_PARSE_TITLE" : "Feil ved analysering av fil(er):",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE" : "Feil ved åpning av nettleser",
    "ERROR_CANT_FIND_CHROME" : "Nettleseren Google Chrome ble ikke funnet. Vennligst sørg for at den er installert.",
    "ERROR_LAUNCHING_BROWSER" : "En feil skjedde ved åpning av Nettleseren. (feil {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE" : "Live development Feil",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE" : "En live development kobling til Chrome kunne ikke bli etablert. For at live development ska fungere må Chrome startes med remote debugging på.<br /><br />Ønsker du å start Chrome på nytt med remote debugging slått på?",
    "LIVE_DEV_NEED_HTML_MESSAGE" : "Åpne en HTML-fil for å åpne live forhåndsvisning.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live File forhåndsvisning",
    "LIVE_DEV_STATUS_TIP_PROGRESS1" : "Live File forhåndsvisning: Kobler...",
    "LIVE_DEV_STATUS_TIP_PROGRESS2" : "Live File forhåndsvisning: Initaliserer...",
    "LIVE_DEV_STATUS_TIP_CONNECTED" : "Koble fra Live File forhåndsvisning",

    "SAVE_CLOSE_TITLE" : "Lagre endringer",
    "SAVE_CLOSE_MESSAGE" : "Ønsker du å lagre enderinger i dokumentet <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE" : "Ønsker du å lagre enderinger i følgende filer?",
    "EXT_MODIFIED_TITLE" : "Eksterne endringer",
    "EXT_MODIFIED_MESSAGE" : "<span class='dialog-filename'>{0}</span> er blitt endret på disk, men har samtidig ulagrede endringer i Brackets.<br /><br />Hvilken versjon ønsker du å beholde?",
    "EXT_DELETED_MESSAGE" : "<span class='dialog-filename'>{0}</span> er blitt slettet på disken, men har ulagrede endringer i Brackets.<br /><br />Ønsker du å beholde endringene?",

    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO" : "Bruk /re/ syntak for søk med regulære utrykk",
    "WITH" : "Med",
    "BUTTON_YES" : "Ja",
    "BUTTON_NO" : "Nei",
    "BUTTON_STOP" : "Stop",

    "OPEN_FILE" : "Åpne fil",

    "RELEASE_NOTES" : "Release Notes",
    "NO_UPDATE_TITLE" : "You're up to date!",
    "NO_UPDATE_MESSAGE" : "You are running the latest version of Brackets.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE" : "Error getting update info",
    "ERROR_FETCHING_UPDATE_INFO_MSG" : "There was a problem getting the latest update information from the server. Please make sure you are connected to the internet and try again.",

    // Switch language
    "LANGUAGE_TITLE" : "Bytt språk",
    "LANGUAGE_MESSAGE" : "Vennligst velg ønsket språk fra listen under:",
    "LANGUAGE_SUBMIT" : "Gjenåpne Brackets",
    "LANGUAGE_CANCEL" : "Avbryt",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Uten Tittel",

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
    "CMD_LIVE_FILE_PREVIEW" : "Live File forhåndsvisning",
    "CMD_QUIT" : "Avslutt",

    // Edit menu commands
    "EDIT_MENU" : "Rediger",
    "CMD_SELECT_ALL" : "Velg alt",
    "CMD_FIND" : "Finn",
    "CMD_FIND_IN_FILES" : "Finn i filer",
    "CMD_FIND_NEXT" : "Finn neste",
    "CMD_FIND_PREVIOUS" : "Finn forige",
    "CMD_REPLACE" : "Erstatt",
    "CMD_INDENT" : "Lag innrykk",
    "CMD_UNINDENT" : "Ta bort innrykk",
    "CMD_DUPLICATE" : "Duplikat",
    "CMD_COMMENT" : "Kommenter/Utkommenter Linjer",
    "CMD_LINE_UP" : "Flytt Linje(ne) Opp",
    "CMD_LINE_DOWN" : "Move Linje(ne) Ned",

    // View menu commands
    "VIEW_MENU" : "View",
    "CMD_HIDE_SIDEBAR" : "Gjem sidestolpe",
    "CMD_SHOW_SIDEBAR" : "Vis sidestolpe",
    "CMD_INCREASE_FONT_SIZE" : "Øk skriftstørrelse",
    "CMD_DECREASE_FONT_SIZE" : "Minsk skriftstørrelse",
    "CMD_RESTORE_FONT_SIZE" : "Tilbakestill skriftstørrelse",

    // Navigate menu Commands
    "NAVIGATE_MENU" : "Naviger",
    "CMD_QUICK_OPEN" : "Hurigåpne",
    "CMD_GOTO_LINE" : "Gå til linje",
    "CMD_GOTO_DEFINITION" : "Gå til definisjon",
    "CMD_TOGGLE_QUICK_EDIT" : "Hurigrediger",
    "CMD_QUICK_EDIT_PREV_MATCH" : "Forige match",
    "CMD_QUICK_EDIT_NEXT_MATCH" : "Neste match",
    "CMD_NEXT_DOC" : "Neste dokument",
    "CMD_PREV_DOC" : "Forige dokument",

    // Debug menu commands
    "DEBUG_MENU" : "Debug",
    "CMD_REFRESH_WINDOW" : "Oppdater Brackets",
    "CMD_SHOW_DEV_TOOLS" : "Vis utviklerverktøy",
    "CMD_RUN_UNIT_TESTS" : "Kjør tester",
    "CMD_JSLINT" : "Aktiver JSLint",
    "CMD_SHOW_PERF_DATA" : "Vis ytelsesdata",
    "CMD_NEW_BRACKETS_WINDOW" : "Nytt Brackets vindu",
    "CMD_USE_TAB_CHARS" : "Bruk tab karakterer",
    "CMD_SWITCH_LANGUAGE" : "Bytt språk",

    // Help menu commands
    "CMD_ABOUT" : "Om",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW" : "Lukk vindu",
    "CMD_ABORT_QUIT" : "Abort lukk",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD" : "Eksperimentell bygg",
    "JSLINT_ERRORS" : "JSLint feil",
    "SEARCH_RESULTS" : "Søkeresultater",
    "OK" : "OK",
    "DONT_SAVE" : "Ikke lagre",
    "SAVE" : "Lagre",
    "CANCEL" : "Avbryt",
    "RELOAD_FROM_DISK" : "Oppdater fra disk",
    "KEEP_CHANGES_IN_EDITOR" : "Behold endringer i editor",
    "CLOSE_DONT_SAVE" : "Lukk (ikke lagre)",
    "RELAUNCH_CHROME" : "Start Chrome på nytt",
    "ABOUT" : "Om",
    "BRACKETS" : "Brackets",
    "CLOSE" : "Lukk",
    "ABOUT_TEXT_LINE1" : "sprint 13 experimental build ",
    "ABOUT_TEXT_LINE2" : "Copyright 2012 Adobe Systems Incorporated and its licensors. All rights reserved.",
    "ABOUT_TEXT_LINE3" : "Notices; terms and conditions pertaining to third party software are located at ",
    "ABOUT_TEXT_LINE4" : " and incorporated by reference herein.",
    "ABOUT_TEXT_LINE5" : "Documentation and source at ",
    "UPDATE_NOTIFICATION_TOOLTIP" : "En ny for Brackets er tilgjengelig! Klikk her for mer informasjon.",
    "UPDATE_AVAILABLE_TITLE" : "Oppdatering er tilgjengelig",
    "UPDATE_MESSAGE" : "Hei, en ny bygg for Brackets er tilgjengelig. Her er noen av de nye funksjonene:",
    "GET_IT_NOW" : "Hent den nå!"

});