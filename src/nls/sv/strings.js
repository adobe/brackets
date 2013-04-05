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
    "GENERIC_ERROR"                     : "(error {0})",
    "NOT_FOUND_ERR"                     : "Filen kunde inte hittas.",
    "NOT_READABLE_ERR"                  : "Filen kunde inte läsas.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Målmappen kunde inte ändras.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Du har inte rättigheter till modifieringar.",
    "FILE_EXISTS_ERR"                   : "Filen existerar redan.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Projektet kunde ej läsas",
    "OPEN_DIALOG_ERROR"                 : "Ett fel inträffade när Fil-dialogen skulle visas. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ett fel inträffade när mappen skulle öppnas <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Ett fel inträffade när mappens innehåll skulle läsas <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Fel vid öppning utav fil",
    "ERROR_OPENING_FILE"                : "Ett fel inträffade när filen skulle öppnas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Fel vid uppdatering utav ändringar från hårddisken",
    "ERROR_RELOADING_FILE"              : "Ett fel inträffade när filen skulle läsas om <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Filen kunde inte sparas",
    "ERROR_SAVING_FILE"                 : "Ett fel inträffade när filen skulle sparas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Filen kunde ej döpas om",
    "ERROR_RENAMING_FILE"               : "Ett fel uppstod vid försök att byta namn på filen <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Ogiltigt filnamn",
    "INVALID_FILENAME_MESSAGE"          : "Filnamn kan ej innehålla följande: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "Filen <span class='dialog-filename'>{0}</span> existerar redan.",
    "ERROR_CREATING_FILE_TITLE"         : "Fel vid skapande av fil",
    "ERROR_CREATING_FILE"               : "Ett fel uppstod vid försök att skapa filen <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ajdå! {APP_NAME} körs ej i webbläsaren ännu.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} är byggt i HTML, men just nu körs det som en skrivbordsapplikation så att du kan använda den för att redigera lokala filer. Vänligen använd applikationens skal hos <b>github.com/adobe/brackets-shell</b> förvaringsplats för att köra {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Fel vid indexering utav filer",
    "ERROR_MAX_FILES"                   : "Det maximala antalet filer har indexerats. Åtgärder som ser filer i indexet kan fungera felaktigt.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Webbläsaren kan inte öppnas.",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome kunde ej hittas. Se till att den är installerad.",
    "ERROR_LAUNCHING_BROWSER"           : "Ett fel inträffade vid lansering av webbläsare. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Förhandsvisning misslyckades",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Ansluter till webbläsare",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "För att förhandsvisningen ska lyckas, så behöver Chrome startas om med fjärrfelsökning aktiverad.<br /><br />Vill du starta om Chrome och aktivera fjärrfelsökning?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Öppna en HTML-fil för att kunna förhandsvisa.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "För att starta realtids förhandsgranskning med en fjärrfil så behöver du ange en URL för detta projekt.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Välkommen till realtids förhandsgranskning!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Förhandsvisningen ansluter {APP_NAME} till din webbläsare. Den öppnar en förhandsvisning utav din HTML fil i webbläsaren, sen uppdateras förhandsgranskningen så fort ändringar skett i koden.<br /><br />I en föregående version {APP_NAME}, förhandsgranskning funkar bara vid redigering utav <strong>CSS filer</strong> och endast med <strong>Google Chrome</strong>. Vi kommer att genomföra detta för HTML och JavaScript snart!<br /><br />(Du kommer bara se detta meddelande en gång.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "För mer information, se <a class=\"clickable-link\" data-href=\"{0}\">Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Förhandsvisning",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Förhandsvisning: Ansluter\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Förhandsvisning: Initierar\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Koppla från förhandsvisningen",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Förhandsvisning: Klicka för att koppla från (Spara filen för att uppdatera)",
    
    "SAVE_CLOSE_TITLE"                  : "Spara ändringar",
    "SAVE_CLOSE_MESSAGE"                : "Vill du spara ändringar du gjort i detta dokument <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Vill du spara ändringar du gjort i dessa dokument?",
    "EXT_MODIFIED_TITLE"                : "Externa ändringar",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> har ändrats, men har också osparade ändringar i {APP_NAME}.<br /><br />Vilken version vill du behålla?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> har raderats, man har också osparade ändringar i {APP_NAME}.<br /><br />Vill du behålla dina ändringar?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Använd /re/ syntax för regexp sökning",
    "WITH"                              : "Med",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nej",
    "BUTTON_STOP"                       : "Avbryt",

    "OPEN_FILE"                         : "Öppna fil",
    "CHOOSE_FOLDER"                     : "Välj mapp",

    "RELEASE_NOTES"                     : "Versionsinformation",
    "NO_UPDATE_TITLE"                   : "Du är uppdaterad!",
    "NO_UPDATE_MESSAGE"                 : "Du använder den senaste versionen utav {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "för \"{4}\" {5} - {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "i <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "i projekt",
    "FIND_IN_FILES_FILE"                : "fil",
    "FIND_IN_FILES_FILES"               : "filer",
    "FIND_IN_FILES_MATCH"               : "matchning",
    "FIND_IN_FILES_MATCHES"             : "matchningar",
    "FIND_IN_FILES_MORE_THAN"           : "Mer än ",
    "FIND_IN_FILES_MAX"                 : " (visar de första {0} matchningar)",
    "FIND_IN_FILES_FILE_PATH"           : "Fil: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "rad:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Fel vid hämtning av uppdatering info",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Det gick inte att få information från servern. Kolla din internetuppkoppling och försök igen.",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "Byt språk",
    "LANGUAGE_MESSAGE"                  : "Välj önskat språk i listan nedan:",
    "LANGUAGE_SUBMIT"                   : "Uppdatera {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "Avbryt",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Namnlös",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Rad {0}, Kolumn {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klicka för att byta indrag till mellanslag",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klicka för att byta indrag till tabbar",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klicka för att ändra antalet mellanslag som används vid indrag",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klicka för att ändra bredden på tabbtecken",
    "STATUSBAR_SPACES"                      : "Mellanslag",
    "STATUSBAR_TAB_SIZE"                    : "Tabb Storlek",
    "STATUSBAR_LINE_COUNT"                  : "{0} Rader",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Fil",
    "CMD_FILE_NEW"                        : "Ny Fil",
    "CMD_FILE_NEW_FOLDER"                 : "Ny Mapp",
    "CMD_FILE_OPEN"                       : "Öppna\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Lägg till i arbetsyta",
    "CMD_OPEN_FOLDER"                     : "Öppna mapp\u2026",
    "CMD_FILE_CLOSE"                      : "Stäng",
    "CMD_FILE_CLOSE_ALL"                  : "Stäng Alla",
    "CMD_FILE_SAVE"                       : "Spara",
    "CMD_FILE_SAVE_ALL"                   : "Spara Allt",
    "CMD_LIVE_FILE_PREVIEW"               : "Förhandsvisning",
    "CMD_PROJECT_SETTINGS"                : "Projektinställningar\u2026",
    "CMD_FILE_RENAME"                     : "Byt Namn",
    "CMD_QUIT"                            : "Avsluta",

    // Edit menu commands
    "EDIT_MENU"                           : "Redigera",
    "CMD_SELECT_ALL"                      : "Markera alla",
    "CMD_SELECT_LINE"                     : "Välj rad",
    "CMD_FIND"                            : "Hitta",
    "CMD_FIND_IN_FILES"                   : "Hitta i filer",
    "CMD_FIND_IN_SUBTREE"                 : "Hitta i\u2026",
    "CMD_FIND_NEXT"                       : "Hitta nästa",
    "CMD_FIND_PREVIOUS"                   : "Hitta föregående",
    "CMD_REPLACE"                         : "Ersätt",
    "CMD_INDENT"                          : "Indrag",
    "CMD_UNINDENT"                        : "Utdrag",
    "CMD_DUPLICATE"                       : "Duplicera",
    "CMD_DELETE_LINES"                    : "Radera rad",
    "CMD_COMMENT"                         : "Växla kommentarsrad",
    "CMD_BLOCK_COMMENT"                   : "Växla block kommentar",
    "CMD_LINE_UP"                         : "Flytta rad uppåt",
    "CMD_LINE_DOWN"                       : "Flytta rad neråt",
     
    // View menu commands
    "VIEW_MENU"                           : "Visa",
    "CMD_HIDE_SIDEBAR"                    : "Dölj sidomeny",
    "CMD_SHOW_SIDEBAR"                    : "Visa sidomeny",
    "CMD_INCREASE_FONT_SIZE"              : "Öka textstorlek",
    "CMD_DECREASE_FONT_SIZE"              : "Minska teckenstorlek",
    "CMD_RESTORE_FONT_SIZE"               : "Återställ teckenstorlek",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Sortera efter tillagd",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Sortera efter namn",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Sortera efter typ",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatisk sortering",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigera",
    "CMD_QUICK_OPEN"                      : "Snabb öppning",
    "CMD_GOTO_LINE"                       : "Gå till rad",
    "CMD_GOTO_DEFINITION"                 : "Gå till definition",
    "CMD_TOGGLE_QUICK_EDIT"               : "Snabb redigering",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Föregående matchning",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Nästa matchning",
    "CMD_NEXT_DOC"                        : "Nästa dokument",
    "CMD_PREV_DOC"                        : "Föregående dokument",
    "CMD_SHOW_IN_TREE"                    : "Visa i Fil-träd",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Debug",
    "CMD_REFRESH_WINDOW"                  : "Ladda om {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "Visa Utvecklarverktyg",
    "CMD_RUN_UNIT_TESTS"                  : "Kör tester",
    "CMD_JSLINT"                          : "Aktivera JSLint",
    "CMD_SHOW_PERF_DATA"                  : "Visa prestandadata",
    "CMD_NEW_BRACKETS_WINDOW"             : "Nytt {APP_NAME} Fönster",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Visa Tilläggs mappen",
    "CMD_SWITCH_LANGUAGE"                 : "Byt Språk",
    "CMD_CHECK_FOR_UPDATE"                : "Sök efter uppdateringar",

    // Help menu commands
    "HELP_MENU"                           : "Hjälp",
    "CMD_ABOUT"                           : "Om {APP_TITLE}",
    "CMD_FORUM"                           : "{APP_NAME} Forum",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Stäng Fönster",
    "CMD_ABORT_QUIT"                      : "Avbryt Avstängning",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Experimental Build",
    "JSLINT_ERRORS"                        : "JSLint Felmeddelanden",
    "JSLINT_ERROR_INFORMATION"             : "1 JSLint Fel",
    "JSLINT_ERRORS_INFORMATION"            : "{0} JSLint Fel",
    "JSLINT_NO_ERRORS"                     : "Inga JSLint fel - Bra jobbat!",
    "JSLINT_DISABLED"                      : "JSLint inaktiverat eller inte kompatibelt med denna fil",
    "SEARCH_RESULTS"                       : "Sökresultat",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Spara Inte",
    "SAVE"                                 : "Spara",
    "CANCEL"                               : "Avbryt",
    "RELOAD_FROM_DISK"                     : "Ladda Om",
    "KEEP_CHANGES_IN_EDITOR"               : "Behåll ändringar i redigeraren",
    "CLOSE_DONT_SAVE"                      : "Stäng (Spara inte)",
    "RELAUNCH_CHROME"                      : "Starta om Chrome",
    "ABOUT"                                : "Om",
    "APP_NAME"                             : "Brackets",
    "CLOSE"                                : "Stäng",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} experimental build {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Meddelanden och villkor som gäller program från tredje part finns på <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> och införlivas häri som referens.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentation och källa här <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Det finns en ny version av {APP_NAME} tillgänglig! Klicka här för flera detaljer.",
    "UPDATE_AVAILABLE_TITLE"               : "Uppdatering tillgänglig!",
    "UPDATE_MESSAGE"                       : "Hallå!, det finns en ny version utav {APP_NAME} tillgänglig. Här är några nya funktioner:",
    "GET_IT_NOW"                           : "Installera nu!",
    "PROJECT_SETTINGS_TOOLTIP"             : "Projekt Inställningar",
    "PROJECT_SETTINGS_TITLE"               : "Projekt Inställningar för: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Förhandsvisnings URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(lämna för fil adress)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0} protokollet stödjer ej förhandsvisning—använd http: eller https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Adressen kan inte innehålla sökparametrar som \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Adressen kan inte innehålla hashar som \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Specialtecken som '{0}' måste vara %-kodade.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Okänt fel!"
});