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
    "NOT_READABLE_ERR"                  : "Filen kunde inte l�sas.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "M�lmappen kunde inte �ndras.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Du har inte r�ttigheter till modifieringar.",
    "FILE_EXISTS_ERR"                   : "Filen existerar redan.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Projektet kunde ej l�sas",
    "OPEN_DIALOG_ERROR"                 : "Ett fel intr�ffade n�r Fil-dialogen skulle visas. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ett fel intr�ffade n�r mappen skulle �ppnas <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Ett fel intr�ffade n�r mappens inneh�ll skulle l�sas <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Fel vid �ppning utav fil",
    "ERROR_OPENING_FILE"                : "Ett fel intr�ffade n�r filen skulle �ppnas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Fel vid uppdatering utav �ndringar fr�n h�rddisken",
    "ERROR_RELOADING_FILE"              : "Ett fel intr�ffade n�r filen skulle l�sas om <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Filen kunde inte sparas",
    "ERROR_SAVING_FILE"                 : "Ett fel intr�ffade n�r filen skulle sparas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Filen kunde ej d�pas om",
    "ERROR_RENAMING_FILE"               : "Ett fel uppstod vid f�rs�k att byta namn p� filen <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Ogiltigt filnamn",
    "INVALID_FILENAME_MESSAGE"          : "Filnamn kan ej inneh�lla f�ljande: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "Filen <span class='dialog-filename'>{0}</span> existerar redan.",
    "ERROR_CREATING_FILE_TITLE"         : "Fel vid skapande av fil",
    "ERROR_CREATING_FILE"               : "Ett fel uppstod vid f�rs�k att skapa filen <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ajd�! {APP_NAME} k�rs ej i webbl�saren �nnu.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} �r byggt i HTML, men just nu k�rs det som en skrivbordsapplikation s� att du kan anv�nda den f�r att redigera lokala filer. V�nligen anv�nd applikationens skal hos <b>github.com/adobe/brackets-shell</b> f�rvaringsplats f�r att k�ra {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Fel vid indexering utav filer",
    "ERROR_MAX_FILES"                   : "Det maximala antalet filer har indexerats. �tg�rder som ser filer i indexet kan fungera felaktigt.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Webbl�saren kan inte �ppnas.",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome kunde ej hittas. Se till att den �r installerad.",
    "ERROR_LAUNCHING_BROWSER"           : "Ett fel intr�ffade vid lansering av webbl�sare. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "F�rhandsvisning misslyckades",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Ansluter till webbl�sare",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "F�r att f�rhandsvisningen ska lyckas, s� beh�ver Chrome startas om med fj�rrfels�kning aktiverad.<br /><br />Vill du starta om Chrome och aktivera fj�rrfels�kning?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "�ppna en HTML-fil f�r att kunna f�rhandsvisa.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "F�r att starta realtids f�rhandsgranskning med en fj�rrfil s� beh�ver du ange en URL f�r detta projekt.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "V�lkommen till realtids f�rhandsgranskning!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "F�rhandsvisningen ansluter {APP_NAME} till din webbl�sare. Den �ppnar en f�rhandsvisning utav din HTML fil i webbl�saren, sen uppdateras f�rhandsgranskningen s� fort �ndringar skett i koden.<br /><br />I en f�reg�ende version {APP_NAME}, f�rhandsgranskning funkar bara vid redigering utav <strong>CSS filer</strong> och endast med <strong>Google Chrome</strong>. Vi kommer att genomf�ra detta f�r HTML och JavaScript snart!<br /><br />(Du kommer bara se detta meddelande en g�ng.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "F�r mer information, se <a class=\"clickable-link\" data-href=\"{0}\">Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "F�rhandsvisning",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "F�rhandsvisning: Ansluter\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "F�rhandsvisning: Initierar\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Koppla fr�n f�rhandsvisningen",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "F�rhandsvisning: Klicka f�r att koppla fr�n (Spara filen f�r att uppdatera)",
    
    "SAVE_CLOSE_TITLE"                  : "Spara �ndringar",
    "SAVE_CLOSE_MESSAGE"                : "Vill du spara �ndringar du gjort i detta dokument <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Vill du spara �ndringar du gjort i dessa dokument?",
    "EXT_MODIFIED_TITLE"                : "Externa �ndringar",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> har �ndrats, men har ocks� osparade �ndringar i {APP_NAME}.<br /><br />Vilken version vill du beh�lla?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> har raderats, man har ocks� osparade �ndringar i {APP_NAME}.<br /><br />Vill du beh�lla dina �ndringar?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Anv�nd /re/ syntax f�r regexp s�kning",
    "WITH"                              : "Med",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nej",
    "BUTTON_STOP"                       : "Avbryt",

    "OPEN_FILE"                         : "�ppna fil",
    "CHOOSE_FOLDER"                     : "V�lj mapp",

    "RELEASE_NOTES"                     : "Versionsinformation",
    "NO_UPDATE_TITLE"                   : "Du �r uppdaterad!",
    "NO_UPDATE_MESSAGE"                 : "Du anv�nder den senaste versionen utav {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "f�r \"{4}\" {5} - {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "i <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "i projekt",
    "FIND_IN_FILES_FILE"                : "fil",
    "FIND_IN_FILES_FILES"               : "filer",
    "FIND_IN_FILES_MATCH"               : "matchning",
    "FIND_IN_FILES_MATCHES"             : "matchningar",
    "FIND_IN_FILES_MORE_THAN"           : "Mer �n ",
    "FIND_IN_FILES_MAX"                 : " (visar de f�rsta {0} matchningar)",
    "FIND_IN_FILES_FILE_PATH"           : "Fil: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "rad:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Fel vid h�mtning av uppdatering info",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Det gick inte att f� information fr�n servern. Kolla din internetuppkoppling och f�rs�k igen.",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "Byt spr�k",
    "LANGUAGE_MESSAGE"                  : "V�lj �nskat spr�k i listan nedan:",
    "LANGUAGE_SUBMIT"                   : "Uppdatera {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "Avbryt",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Namnl�s",

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
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klicka f�r att byta indrag till mellanslag",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klicka f�r att byta indrag till tabbar",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klicka f�r att �ndra antalet mellanslag som anv�nds vid indrag",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klicka f�r att �ndra bredden p� tabbtecken",
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
    "CMD_FILE_OPEN"                       : "�ppna\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "L�gg till i arbetsyta",
    "CMD_OPEN_FOLDER"                     : "�ppna mapp\u2026",
    "CMD_FILE_CLOSE"                      : "St�ng",
    "CMD_FILE_CLOSE_ALL"                  : "St�ng Alla",
    "CMD_FILE_SAVE"                       : "Spara",
    "CMD_FILE_SAVE_ALL"                   : "Spara Allt",
    "CMD_LIVE_FILE_PREVIEW"               : "F�rhandsvisning",
    "CMD_PROJECT_SETTINGS"                : "Projekt Inst�llningar\u2026",
    "CMD_FILE_RENAME"                     : "Byt Namn",
    "CMD_QUIT"                            : "Avsluta",

    // Edit menu commands
    "EDIT_MENU"                           : "Redigera",
    "CMD_SELECT_ALL"                      : "Markera Alla",
    "CMD_SELECT_LINE"                     : "V�lj rad",
    "CMD_FIND"                            : "Hitta",
    "CMD_FIND_IN_FILES"                   : "Hitta i filer",
    "CMD_FIND_IN_SUBTREE"                 : "Hitta i...",
    "CMD_FIND_NEXT"                       : "Hitta n�sta",
    "CMD_FIND_PREVIOUS"                   : "Hitta f�reg�ende",
    "CMD_REPLACE"                         : "Ers�tt",
    "CMD_INDENT"                          : "Indrag",
    "CMD_UNINDENT"                        : "Utdrag",
    "CMD_DUPLICATE"                       : "Duplicera",
    "CMD_DELETE_LINES"                    : "Radera rad",
    "CMD_COMMENT"                         : "V�xla kommentarsrad",
    "CMD_BLOCK_COMMENT"                   : "V�xla block kommentar",
    "CMD_LINE_UP"                         : "Flytta rad upp�t",
    "CMD_LINE_DOWN"                       : "Flytta rad ner�t",
     
    // View menu commands
    "VIEW_MENU"                           : "Visa",
    "CMD_HIDE_SIDEBAR"                    : "D�lj sidomeny",
    "CMD_SHOW_SIDEBAR"                    : "Visa sidomeny",
    "CMD_INCREASE_FONT_SIZE"              : "�ka textstorlek",
    "CMD_DECREASE_FONT_SIZE"              : "Minska teckenstorlek",
    "CMD_RESTORE_FONT_SIZE"               : "�terst�ll teckenstorlek",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Sortera efter tillagd",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Sortera efter namn",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Sortera efter typ",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatisk sortering",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigera",
    "CMD_QUICK_OPEN"                      : "Snabb �ppning",
    "CMD_GOTO_LINE"                       : "G� till rad",
    "CMD_GOTO_DEFINITION"                 : "G� till definition",
    "CMD_TOGGLE_QUICK_EDIT"               : "Snabb redigering",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "F�reg�ende matchning",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "N�sta matchning",
    "CMD_NEXT_DOC"                        : "N�sta dokument",
    "CMD_PREV_DOC"                        : "F�reg�ende dokument",
    "CMD_SHOW_IN_TREE"                    : "Visa i Fil-tr�d",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Debug",
    "CMD_REFRESH_WINDOW"                  : "Ladda om {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "Visa Utvecklarverktyg",
    "CMD_RUN_UNIT_TESTS"                  : "K�r tester",
    "CMD_JSLINT"                          : "Aktivera JSLint",
    "CMD_SHOW_PERF_DATA"                  : "Visa prestandadata",
    "CMD_NEW_BRACKETS_WINDOW"             : "Nytt {APP_NAME} F�nster",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Visa Till�ggs mappen",
    "CMD_SWITCH_LANGUAGE"                 : "Byt Spr�k",
    "CMD_CHECK_FOR_UPDATE"                : "S�k efter uppdateringar",

    // Help menu commands
    "HELP_MENU"                           : "Hj�lp",
    "CMD_ABOUT"                           : "Om {APP_TITLE}",
    "CMD_FORUM"                           : "{APP_NAME} Forum",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "St�ng F�nster",
    "CMD_ABORT_QUIT"                      : "Avbryt Avst�ngning",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Experimental Build",
    "JSLINT_ERRORS"                        : "JSLint Felmeddelanden",
    "JSLINT_ERROR_INFORMATION"             : "1 JSLint Fel",
    "JSLINT_ERRORS_INFORMATION"            : "{0} JSLint Fel",
    "JSLINT_NO_ERRORS"                     : "Inga JSLint fel - Bra jobbat!",
    "JSLINT_DISABLED"                      : "JSLint inaktiverat eller inte kompitabelt med denna fil",
    "SEARCH_RESULTS"                       : "S�kresultat",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Spara Inte",
    "SAVE"                                 : "Spara",
    "CANCEL"                               : "Avbryt",
    "RELOAD_FROM_DISK"                     : "Ladda Om",
    "KEEP_CHANGES_IN_EDITOR"               : "Beh�ll �ndringar i redigeraren",
    "CLOSE_DONT_SAVE"                      : "St�ng (Spara inte)",
    "RELAUNCH_CHROME"                      : "Starta om Chrome",
    "ABOUT"                                : "Om",
    "APP_NAME"                             : "Brackets",
    "CLOSE"                                : "St�ng",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} experimental build {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Meddelanden och villkor som g�ller program fr�n tredje part finns p� <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> och inf�rlivas h�ri som referens.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentation och k�lla h�r <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Det finns en ny version av {APP_NAME} tillg�nglig! Klicka h�r f�r flera detaljer.",
    "UPDATE_AVAILABLE_TITLE"               : "Uppdatering tillg�nglig!",
    "UPDATE_MESSAGE"                       : "Hall�!, det finns en ny version utav {APP_NAME} tillg�nglig. H�r �r n�gra nya funktioner:",
    "GET_IT_NOW"                           : "Installera nu!",
    "PROJECT_SETTINGS_TOOLTIP"             : "Projekt Inst�llningar",
    "PROJECT_SETTINGS_TITLE"               : "Projekt Inst�llningar f�r: {0}",
    "PROJECT_SETTING_BASE_URL"             : "F�rhandsvisnings URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(l�mna f�r fil adress)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0} protokollet st�djer ej f�rhandsvisning&mdash;anv�nd http: eller https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Adressen kan inte inneh�lla s�kparametrar som \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Adressen kan inte inneh�lla hashar som \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Specialtecken som '{0}' m�ste vara %-kodade.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Ok�nt fel!"
});
