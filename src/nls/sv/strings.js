/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR"                     : "(fel {0})",
    "NOT_FOUND_ERR"                     : "Filen kunde inte hittas.",
    "NOT_READABLE_ERR"                  : "Filen kunde inte läsas.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Målmappen kunde inte ändras.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Du har inte behörighet att modifiera filen.",
    "FILE_EXISTS_ERR"                   : "Filen existerar redan.",
    "FILE"                              : "fil",
    "DIRECTORY"                         : "mapp",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Projektet kunde inte läsas",
    "OPEN_DIALOG_ERROR"                 : "Ett fel inträffade när öppna-dialogen skulle visas. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ett fel inträffade när mappen skulle öppnas <span class='dialog-filename'>{0}</span>. (fel {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Ett fel inträffade när mappens innehåll skulle läsas <span class='dialog-filename'>{0}</span>. (fel {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Filen kunde inte öppnas",
    "ERROR_OPENING_FILE"                : "Ett fel inträffade när filen <span class='dialog-filename'>{0}</span> skulle öppnas. {1}",
    "ERROR_OPENING_FILES"               : "Ett fel inträffade när följande filer skulle öppnas:",
    "ERROR_RELOADING_FILE_TITLE"        : "Filen kunde inte laddas om",
    "ERROR_RELOADING_FILE"              : "Ett fel inträffade när filen <span class='dialog-filename'>{0}</span> skulle läsas om. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Filen kunde inte sparas",
    "ERROR_SAVING_FILE"                 : "Ett fel inträffade när filen <span class='dialog-filename'>{0}</span> skulle sparas. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Filen kunde inte döpas om",
    "ERROR_RENAMING_FILE"               : "Ett fel uppstod när filen <span class='dialog-filename'>{0}</span> skulle döpas om. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Filen kunde inte raderas",
    "ERROR_DELETING_FILE"               : "Ett fel uppstod när filen <span class='dialog-filename'>{0}</span> skulle tas bort. {1}",
    "INVALID_FILENAME_TITLE"            : "Ogiltigt filnamn",
    "INVALID_FILENAME_MESSAGE"          : "Filnamn får inte innehålla följande tecken: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "En fil med namnet <span class='dialog-filename'>{0}</span> existerar redan.",
    "ERROR_CREATING_FILE_TITLE"         : "Filen kunde inte skapas",
    "ERROR_CREATING_FILE"               : "Ett fel uppstod filen <span class='dialog-filename'>{0}</span> skulle skapas. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ajdå! {APP_NAME} körs inte i webbläsaren ännu.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} är byggd i HTML, men körs just nu som en skrivbordsapplikation så att du kan använda den för att redigera lokala filer. Vänligen använd skalapplikationen <b>github.com/adobe/brackets-shell</b> för att köra {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Fel vid indexering av filer",
    "ERROR_MAX_FILES"                   : "Det maximala antalet filer har indexerats. Funktioner som använder sig av indexet kanske inte kommer att fungera som förväntat.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Webbläsaren kunde inte öppnas.",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome kunde inte hittas. Kontrollera att den är installerad.",
    "ERROR_LAUNCHING_BROWSER"           : "Ett fel inträffade då webbläsare skulle startas. (fel {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Förhandsvisning misslyckades",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Ansluter till webbläsare",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "För att förhandsvisningen ska lyckas måste Chrome startas om med fjärrfelsökning aktiverad.<br /><br />Vill du starta om Chrome och aktivera fjärrfelsökning?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Lyckades inte ladda förhandsvisningssidan.",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Öppna en HTML-fil för att kunna förhandsvisa.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "För att starta realtidsförhandsgranskning med en fjärrfil måste du ange en URL för detta projekt.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Ett fel uppstod när webbsevern för förhandsgranskningen skulle startas. Vänligen försök igen.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Välkommen till realtidsförhandsgranskning!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Förhandsvisningen ansluter {APP_NAME} till din webbläsare. Den öppnar en förhandsvisning av din HTML-fil i webbläsaren och uppdaterar förhandsgranskningen så fort ändringar skett i koden.<br /><br />I denna tidiga version av {APP_NAME} fungerar förhandsgranskningen endast för redigering av <strong>CSS-filer</strong> och endast med <strong>Google Chrome</strong>. Vid ändringar i HTML- eller JavaScript-kod laddas webbläsaren om när du sparar filen.<br /><br />(Du kommer bara se detta meddelande en gång.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "För mer information se <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Förhandsvisning",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Förhandsvisning: Ansluter\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Förhandsvisning: Initierar\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Koppla från förhandsvisningen",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Förhandsvisning: Klicka för att koppla från (Spara filen för att uppdatera)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Förhandsgranskningen avbröts eftersom webbläsarens utvecklarverktyg öppnades.",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Förhandsgranskningen avbröst eftersom sidan stängdes i webbläsaren.",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Förhandsgranskningen avbröts eftersom webbläsaren navigerades till en sida som inte är del av det nuvarande projektet.",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Förhandsgranskningen avbröts på grund av ett okänt fel. ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Spara ändringar?",
    "SAVE_CLOSE_MESSAGE"                : "Vill du spara de ändringar i dokumentet <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Vill du spara ändringarna du gjort i dessa dokument?",
    "EXT_MODIFIED_TITLE"                : "Externa ändringar",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Bekräfta borttagning",
    "CONFIRM_FOLDER_DELETE"             : "Är du säker att du vill radera katalogen <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Filen raderades",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> har ändrats men har också osparade ändringar i {APP_NAME}.<br /><br />Vilken version vill du behålla?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> har raderats man har också osparade ändringar i {APP_NAME}.<br /><br />Vill du behålla dina ändringar?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Använd /re/ syntax för regexp-sökning",
    "FIND_RESULT_COUNT"                 : "{0} resultat",
    "FIND_RESULT_COUNT_SINGLE"          : "1 resultat",
    "FIND_NO_RESULTS"                   : "Inga resultat",
    "WITH"                              : "med",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nej",
    "BUTTON_REPLACE_ALL"                : "Alla\u2026",
    "BUTTON_STOP"                       : "Avbryt",
    "BUTTON_REPLACE"                    : "Ersätt",

    "OPEN_FILE"                         : "Öppna fil",
    "SAVE_FILE_AS"                      : "Spara fil som",
    "CHOOSE_FOLDER"                     : "Välj mapp",

    "RELEASE_NOTES"                     : "Versionsinformation",
    "NO_UPDATE_TITLE"                   : "Du är uppdaterad!",
    "NO_UPDATE_MESSAGE"                 : "Du använder den senaste versionen av {APP_NAME}.",

    "FIND_REPLACE_TITLE_PART1"          : "Ersätt \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" med \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" hittades",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} i {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "i <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "i projekt",
    "FIND_IN_FILES_FILE"                : "fil",
    "FIND_IN_FILES_FILES"               : "filer",
    "FIND_IN_FILES_MATCH"               : "träff",
    "FIND_IN_FILES_MATCHES"             : "träffar",
    "FIND_IN_FILES_MORE_THAN"           : "Mer än ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "Fil: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "rad:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Fel vid hämtning av versioninformation",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Det gick inte att få information från servern. Kontrollera din internetuppkoppling och försök igen.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Öppnar\u2026",
    "UNTITLED"          : "Namnlös",
    "WORKING_FILES"     : "Öppna filer",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Rad {0}, kolumn {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Markerade {0} kolumn",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Markerade {0} kolumner",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Markerade {0} rad",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Markerade {0} rader",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klicka för att använda mellanslag för indrag",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klicka för att använda tabbar för indrag",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klicka för att ändra antalet mellanslag som används för indrag",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klicka för att ändra bredden på tabbtecken",
    "STATUSBAR_SPACES"                      : "Mellanslag",
    "STATUSBAR_TAB_SIZE"                    : "Tabbstorlek",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} rad",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} rader",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Arkiv",
    "CMD_FILE_NEW_UNTITLED"               : "Ny",
    "CMD_FILE_NEW"                        : "Ny fil",
    "CMD_FILE_NEW_FOLDER"                 : "Ny mapp",
    "CMD_FILE_OPEN"                       : "Öppna\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Lägg till i arbetsyta",
    "CMD_OPEN_FOLDER"                     : "Öppna mapp\u2026",
    "CMD_FILE_CLOSE"                      : "Stäng",
    "CMD_FILE_CLOSE_ALL"                  : "Stäng alla",
    "CMD_FILE_SAVE"                       : "Spara",
    "CMD_FILE_SAVE_ALL"                   : "Spara alla",
    "CMD_FILE_SAVE_AS"                    : "Spara som\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Förhandsvisning",
    "CMD_LIVE_HIGHLIGHT"                  : "Live Preview Highlight",
    "CMD_PROJECT_SETTINGS"                : "Projektinställningar\u2026",
    "CMD_FILE_RENAME"                     : "Byt namn",
    "CMD_FILE_DELETE"                     : "Radera",
    "CMD_INSTALL_EXTENSION"               : "Installera tillägg\u2026",
    "CMD_EXTENSION_MANAGER"               : "Tilläggshanteraren\u2026",
    "CMD_FILE_REFRESH"                    : "Uppdatera",
    "CMD_QUIT"                            : "Avsluta",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Avsluta",

    // Edit menu commands
    "EDIT_MENU"                           : "Redigera",
    "CMD_UNDO"                            : "Ångra",
    "CMD_REDO"                            : "Gör om",
    "CMD_CUT"                             : "Klipp ut",
    "CMD_COPY"                            : "Kopiera",
    "CMD_PASTE"                           : "Klistra in",
    "CMD_SELECT_ALL"                      : "Markera alla",
    "CMD_SELECT_LINE"                     : "Markera rad",
    "CMD_FIND"                            : "Hitta",
    "CMD_FIND_IN_FILES"                   : "Hitta i filer",
    "CMD_FIND_IN_SUBTREE"                 : "Hitta i\u2026",
    "CMD_FIND_NEXT"                       : "Hitta nästa",
    "CMD_FIND_PREVIOUS"                   : "Hitta föregående",
    "CMD_REPLACE"                         : "Ersätt",
    "CMD_INDENT"                          : "Öka indrag",
    "CMD_UNINDENT"                        : "Minska indrag",
    "CMD_DUPLICATE"                       : "Duplicera",
    "CMD_DELETE_LINES"                    : "Radera rad",
    "CMD_COMMENT"                         : "Växla kommentarsrad",
    "CMD_BLOCK_COMMENT"                   : "Växla blockkommentar",
    "CMD_LINE_UP"                         : "Flytta rad uppåt",
    "CMD_LINE_DOWN"                       : "Flytta rad nedåt",
    "CMD_OPEN_LINE_ABOVE"                 : "Öppna rad ovanför",
    "CMD_OPEN_LINE_BELOW"                 : "Öppna rad nedanför",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Stäng paranteser automatiskt",
    "CMD_SHOW_CODE_HINTS"                 : "Visa kodförslag",
    
    // View menu commands
    "VIEW_MENU"                           : "Visa",
    "CMD_HIDE_SIDEBAR"                    : "Dölj sidomeny",
    "CMD_SHOW_SIDEBAR"                    : "Visa sidomeny",
    "CMD_INCREASE_FONT_SIZE"              : "Öka textstorlek",
    "CMD_DECREASE_FONT_SIZE"              : "Minska teckenstorlek",
    "CMD_RESTORE_FONT_SIZE"               : "Återställ teckenstorlek",
    "CMD_SCROLL_LINE_UP"                  : "Skrolla rad uppåt",
    "CMD_SCROLL_LINE_DOWN"                : "Skrolla rad nedåt",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Radnummer",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Markera aktiv rad",
    "CMD_TOGGLE_WORD_WRAP"                : "Automatisk radbrytning",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Sortera efter senast tillagd",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Sortera efter namn",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Sortera efter typ",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatisk sortering",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigera",
    "CMD_QUICK_OPEN"                      : "Snabböppna",
    "CMD_GOTO_LINE"                       : "Gå till rad",
    "CMD_GOTO_DEFINITION"                 : "Gå till definition",
    "CMD_TOGGLE_QUICK_EDIT"               : "Snabbredigering",
    "CMD_TOGGLE_QUICK_DOCS"               : "Quick Docs",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Föregående träff",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Nästa träff",
    "CMD_NEXT_DOC"                        : "Nästa dokument",
    "CMD_PREV_DOC"                        : "Föregående dokument",
    "CMD_SHOW_IN_TREE"                    : "Visa i filträd",
    "CMD_SHOW_IN_OS"                      : "Visa i operativsystemet",
    
    // Help menu commands
    "HELP_MENU"                           : "Hjälp",
    "CMD_CHECK_FOR_UPDATE"                : "Sök efter uppdateringar",
    "CMD_HOW_TO_USE_BRACKETS"             : "Hur du använder {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME}-forum",
    "CMD_RELEASE_NOTES"                   : "Versionsinformation",
    "CMD_REPORT_AN_ISSUE"                 : "Rapportera en bugg",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Visa tilläggsmapp",
    "CMD_TWITTER"                         : "{TWITTER_NAME} på Twitter",
    "CMD_ABOUT"                           : "Om {APP_TITLE}",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Stäng fönster",
    "CMD_ABORT_QUIT"                      : "Avbryt avstängning",
    "CMD_BEFORE_MENUPOPUP"                : "Before Menu Popup",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Experimental Build",
    "DEVELOPMENT_BUILD"                    : "Development Build",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Spara inte",
    "SAVE"                                 : "Spara",
    "CANCEL"                               : "Avbryt",
    "DELETE"                               : "Radera",
    "RELOAD_FROM_DISK"                     : "Ladda om",
    "KEEP_CHANGES_IN_EDITOR"               : "Behåll ändringar i redigeraren",
    "CLOSE_DONT_SAVE"                      : "Stäng (Spara inte)",
    "RELAUNCH_CHROME"                      : "Starta om Chrome",
    "ABOUT"                                : "Om",
    "CLOSE"                                : "Stäng",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} experimental build {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Meddelanden och villkor gällande program från tredje part finns på <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> och inkluderas här som referens.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentation och källkod återfinns på <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Skapat med \u2764 och JavaScript av:",
    "ABOUT_TEXT_LINE6"                     : "Massor av människor (men vi har lite problem att visa dessa data just nu).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs och dess logotyp är licenserad under en Creative Commons Attribution-licens, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "En ny version av {APP_NAME} är tillgänglig! Klicka här för flera detaljer.",
    "UPDATE_AVAILABLE_TITLE"               : "Uppdatering tillgänglig!",
    "UPDATE_MESSAGE"                       : "Hallå! En ny version av {APP_NAME} är tillgänglig. Här är några av de nya funktionerna:",
    "GET_IT_NOW"                           : "Installera nu!",
    "PROJECT_SETTINGS_TITLE"               : "Projektinställningar för: {0}",
    "PROJECT_SETTING_BASE_URL"             : "URL till förhandsvisning",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(lämna tom för filadress)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0}-protokollet stöder inte förhandsvisning — använd http: eller https:.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Adressen kan inte innehålla sökparametrar som \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Adressen kan inte innehålla hashar som \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Specialtecken som '{0}' måste vara %-kodade.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Okänt fel!",
    
    // Extension Management strings
    "INSTALL"                              : "Installera",
    "UPDATE"                               : "Uppdatera",
    "REMOVE"                               : "Radera",
    "OVERWRITE"                            : "Skriv över",
    "CANT_REMOVE_DEV"                      : "Till i mappen \"dev\" raderas manuellt.",
    "CANT_UPDATE"                          : "Uppdateringen är inte kompatibel med denna version av {APP_NAME}.",
    "INSTALL_EXTENSION_TITLE"              : "Inställera tillägg",
    "UPDATE_EXTENSION_TITLE"               : "Uppdatera tillägg",
    "INSTALL_EXTENSION_LABEL"              : "Tilläggets URL",
    "INSTALL_EXTENSION_HINT"               : "URL till tilläggets zip-fil eller GitHub-repository",
    "INSTALLING_FROM"                      : "Installerar tillägg från {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Tillägget installerades!",
    "INSTALL_FAILED"                       : "Installationen misslyckades.",
    "CANCELING_INSTALL"                    : "Avbryter\u2026",
    "CANCELING_HUNG"                       : "Installationen avbröts då den tog för lång tid. Ett internt fel kan ha inträffat.",
    "INSTALL_CANCELED"                     : "Installationen avbröts.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Det nedladdade innehållet är inte en fungerande zip-fil.",
    "INVALID_PACKAGE_JSON"                 : "Filen package.json är inte korrekt (felet var: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Filen package.json innehåller inte tilläggets namn.",
    "BAD_PACKAGE_NAME"                     : "{0} är inte ett godkänt namn.",
    "MISSING_PACKAGE_VERSION"              : "Filen package.json innehåller inte tilläggets versionsnummer.",
    "INVALID_VERSION_NUMBER"               : "Tilläggets versionsnummer ({0}) är felaktigt.",
    "INVALID_BRACKETS_VERSION"             : "Kompabilitetssträngen ({0}) för {APP_NAME} är felaktig.",
    "DISALLOWED_WORDS"                     : "Orden ({1}) är inte tillåtna i {0}-fältet.",
    "API_NOT_COMPATIBLE"                   : "Tillägget är inte kompatibelt med denna version av {APP_NAME}. Det har installerats i din mapp med inaktiverade tillägg.",
    "MISSING_MAIN"                         : "Tillägget har ingen fil med namnet main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Installationen av detta tillägg kommer att skriva över ett tidigare installerat tillägg. Vill du skriva över det äldre tillägget?",
    "EXTENSION_SAME_VERSION"               : "Tillägget har samma versionsnummer som ett redan installerat tillägg. Vill du skriva över den befintliga installationen?",
    "EXTENSION_OLDER_VERSION"              : "Detta tillägg har versionsnummer {0} och är äldre än den nuvarade versionen ({1}). Vill du skriva över den befintliga installationen?",
    "DOWNLOAD_ID_IN_USE"                   : "Internt fel: nedladdnings-ID används redan.",
    "NO_SERVER_RESPONSE"                   : "Kunde inte ansluta till servern.",
    "BAD_HTTP_STATUS"                      : "Filen kunde inte hittas på servern (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Kunde inte spara filen temporärt.",
    "ERROR_LOADING"                        : "Tillägget stötte på ett fel under uppstart.",
    "MALFORMED_URL"                        : "Adressen är felaktig. Vänligen kontrollera att du angett den korrekt.",
    "UNSUPPORTED_PROTOCOL"                 : "Adressen måste använda http eller https.",
    "UNKNOWN_ERROR"                        : "Okänt internt fel.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Tilläggshanteraren",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Kunde inte nå tilläggsregistret. Vänligen försök igen senare.",
    "INSTALL_FROM_URL"                     : "Installera från URL\u2026",
    "EXTENSION_AUTHOR"                     : "Författare",
    "EXTENSION_DATE"                       : "Datum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Detta tillägg kräver en nyare version av {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Detta tillägg fungerar för närvarande bara med äldre versioner av {APP_NAME}.",
    "EXTENSION_NO_DESCRIPTION"             : "Ingen beskrivning",
    "EXTENSION_MORE_INFO"                  : "Mer information...",
    "EXTENSION_ERROR"                      : "Fel med tillägg",
    "EXTENSION_KEYWORDS"                   : "Nyckelord",
    "EXTENSION_INSTALLED"                  : "Installerade",
    "EXTENSION_UPDATE_INSTALLED"           : "Uppdateringen av detta tillägg har laddats ner och kommer att installeras när du avslutar {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Sök",
    "EXTENSION_MORE_INFO_LINK"             : "Mer",
    "BROWSE_EXTENSIONS"                    : "Bläddra bland tillägg",
    "EXTENSION_MANAGER_REMOVE"             : "Ta bort tillägg",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Kunde inte ta bort ett eller flera tillägg: {0}. {APP_NAME} kommer fortfarande att avslutas.",
    "EXTENSION_MANAGER_UPDATE"             : "Uppdatera tillägg",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Kunde inte uppdatera ett eller flera tillägg: {0}. {APP_NAME} kommer fortfarande att avslutas.",
    "MARKED_FOR_REMOVAL"                   : "Markerad för borttagning",
    "UNDO_REMOVE"                          : "Ångra",
    "MARKED_FOR_UPDATE"                    : "Markerad för uppdatering",
    "UNDO_UPDATE"                          : "Ångra",
    "CHANGE_AND_QUIT_TITLE"                : "Ändra tillägg",
    "CHANGE_AND_QUIT_MESSAGE"              : "Du måste avsluta och starta om {APP_NAME} för att uppdatera eller ta bort markerade tillägg. Du kommer att få en fråga om eventuella osparade ändringar.",
    "REMOVE_AND_QUIT"                      : "Ta bort tillägg och avsluta",
    "CHANGE_AND_QUIT"                      : "Ändra tillägg och avsluta",
    "UPDATE_AND_QUIT"                      : "Uppdatera tillägg och avsluta",
    "EXTENSION_NOT_INSTALLED"              : "Kunde inte radera tillägget {0} då det inte är installerat.",
    "NO_EXTENSIONS"                        : "Inga tillägg har installerats ännu.<br>Klicka på fliken Tillgängliga för attkomma igång.",
    "NO_EXTENSION_MATCHES"                 : "Inga tillägg matchade din sökning.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Var försiktig när du installerar tillägg från okända källor.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Installerade",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Tillgängliga",
    "EXTENSIONS_UPDATES_TITLE"             : "Uppdateringar",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                               : "pixlar",
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "CMD_SHOW_DEV_TOOLS"                        : "Visa utvecklarverktyg",
    "CMD_REFRESH_WINDOW"                        : "Ladda om {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nytt {APP_NAME}-fönster",
    "CMD_SWITCH_LANGUAGE"                       : "Byt språk",
    "CMD_RUN_UNIT_TESTS"                        : "Kör tester",
    "CMD_SHOW_PERF_DATA"                        : "Visa prestandadata",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Aktivera noddebugger",
    "CMD_LOG_NODE_STATE"                        : "Skriv ut nodstatus till konsollen",
    "CMD_RESTART_NODE"                          : "Starta om nod",
    
    "LANGUAGE_TITLE"                            : "Byt språk",
    "LANGUAGE_MESSAGE"                          : "Välj önskat språk i listan nedan:",
    "LANGUAGE_SUBMIT"                           : "Uppdatera {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Avbryt",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Systemstandard",
    
    /**
     * Locales
     */
    "LOCALE_CS"                                 : "Tjeckiska",
    "LOCALE_DE"                                 : "Tyska",
    "LOCALE_EN"                                 : "Engelska",
    "LOCALE_ES"                                 : "Spanska",
    "LOCALE_FI"                                 : "Finska",
    "LOCALE_FR"                                 : "Franska",
    "LOCALE_IT"                                 : "Italienska",
    "LOCALE_JA"                                 : "Japanska",
    "LOCALE_NB"                                 : "Norska",
    "LOCALE_PL"                                 : "Polska",
    "LOCALE_PT_BR"                              : "Portugisiska, Brasilien",
    "LOCALE_PT_PT"                              : "Portugisiska",
    "LOCALE_RU"                                 : "Ryska",
    "LOCALE_SV"                                 : "Svenska",
    "LOCALE_TR"                                 : "Turkiska",
    "LOCALE_ZH_CN"                              : "Kinesiska, förenklad",
    "LOCALE_HU"                                 : "Ungerska",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Nuvarande färg",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Originalfärg",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa-format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex-format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa-format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (använd {1} gång)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (använd {1} gånger)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Gå till definition",
    "CMD_SHOW_PARAMETER_HINT"                   : "Visa parameterförslag",
    "NO_ARGUMENTS"                              : "<inga parametrar>",

    // extensions/default/JSLint
    "CMD_JSLINT"                                : "Aktivera JSLint",
    "CMD_JSLINT_FIRST_ERROR"                    : "Gå till första JSLint-felet",
    "JSLINT_ERRORS"                             : "JSLint-felmeddelanden",
    "JSLINT_ERROR_INFORMATION"                  : "1 JSLint-fel",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} JSLint-fel",
    "JSLINT_NO_ERRORS"                          : "Inga JSLint-fel - Bra jobbat!",
    "JSLINT_DISABLED"                           : "JSLint är inaktiverat eller inte kompatibelt med denna fil",
    
    // extensions/default/QuickView 
    "CMD_ENABLE_QUICK_VIEW"                     : "Quick View vid hover",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Läs mer"
});
