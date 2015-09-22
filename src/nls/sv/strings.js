/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
    "EXCEEDS_MAX_FILE_SIZE"             : "Filer större än {0} MB kan inte öppnas i {APP_NAME}.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Målmappen kunde inte ändras.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Du har inte behörighet att modifiera filen.",
    "CONTENTS_MODIFIED_ERR"             : "Filen har ändrats utanför {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} stöder just nu bara textfiler kodade i UTF-8.",
    "FILE_EXISTS_ERR"                   : "Filen eller mappen existerar redan.",
    "FILE"                              : "fil",
    "FILE_TITLE"                        : "Fil",
    "DIRECTORY"                         : "mapp",
    "DIRECTORY_TITLE"                   : "Mapp",
    "DIRECTORY_NAMES_LEDE"              : "Mappnamn",
    "FILENAMES_LEDE"                    : "Filnamn",
    "FILENAME"                          : "filnamn",
    "DIRECTORY_NAME"                    : "mappnamn",
    

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Projektet kunde inte öppnas",
    "OPEN_DIALOG_ERROR"                 : "Ett fel inträffade när öppningsdialogen skulle visas. (fel {0})",
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
    "ERROR_RENAMING_FILE"               : "Ett fel uppstod när {2}-filen <span class='dialog-filename'>{0}</span> skulle döpas om. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Filen kunde inte raderas",
    "ERROR_DELETING_FILE"               : "Ett fel uppstod när {2}-filen <span class='dialog-filename'>{0}</span> skulle tas bort. {1}",
    "INVALID_FILENAME_TITLE"            : "Ogiltigt {0}",
    "INVALID_FILENAME_MESSAGE"          : "{0} får inte innehålla ord som reserverats av systemet, sluta med punkt (.) eller använda något av följande tecken: <code class='emphasized'>{1}</code>.",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "En fil eller mapp med namnet <span class='dialog-filename'>{0}</span> existerar redan.",
    "ERROR_CREATING_FILE_TITLE"         : "Kunde inte skapa {0}",
    "ERROR_CREATING_FILE"               : "Ett fel uppstod när en {0} med namnet <span class='dialog-filename'>{1}</span> skulle skapas. {2}",
    "ERROR_MIXED_DRAGDROP"              : "Kan inte öppna en mapp samtidigt som andra filer öppnas.",

    // User key map error strings
    "ERROR_KEYMAP_TITLE"                : "Fel uppstod när användarens tangentuppsättning lästes in",
    "ERROR_KEYMAP_CORRUPT"              : "Din tangentuppsättningsfil är inte korrekt formaterad JSON. Filen kommer att öppnas så att du kan åtgärda formateringsfelet.",
    "ERROR_LOADING_KEYMAP"              : "Din tangentuppsättningsfil är inte en UTF-8-kodad textfil och kan inte läsas",
    "ERROR_RESTRICTED_COMMANDS"         : "Du kan inte ändra kortkommandot för följande kommandon: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"        : "Du kan inte ändra följande kortkommandon: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"          : "Du håller på att koppla flera kortkommandon till följande kommandon: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"         : "Du har flera kopplingar till följande kommandon: {0}",
    "ERROR_INVALID_SHORTCUTS"           : "Följande kortkommandon är felaktiga: {0}",
    "ERROR_NONEXISTENT_COMMANDS"        : "Du håller på att skapa kortkommandon till följande icke-existerande kommandon: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Kunde inte läsa inställningar",
    "ERROR_PREFS_CORRUPT"               : "Din inställningsfil är inte korrekt formaterad JSON. Filen kommer att öppnas så att du kan korrigera felet. Du kommer att behöva starta om {APP_NAME} för att ändringarna ska träda i kraft.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ajdå! {APP_NAME} körs inte i webbläsaren ännu.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} är byggd i HTML, men körs just nu som en skrivbordsapplikation så att du kan använda den för att redigera lokala filer. Vänligen använd skalapplikationen <b>github.com/adobe/brackets-shell</b> för att köra {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Fel vid indexering av filer",
    "ERROR_MAX_FILES"                   : "Det maximala antalet filer har indexerats. Funktioner som använder sig av indexet kanske inte kommer att fungera som förväntat.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Webbläsaren kunde inte öppnas.",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome kunde inte hittas. Kontrollera att den är installerad.",
    "ERROR_LAUNCHING_BROWSER"           : "Ett fel inträffade då webbläsaren skulle startas. (fel {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Förhandsvisning misslyckades",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Ansluter till webbläsaren",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "För att förhandsvisningen ska lyckas måste Chrome startas om med fjärrfelsökning aktiverad.<br /><br />Vill du starta om Chrome och aktivera fjärrfelsökning?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Lyckades inte ladda förhandsvisningssidan.",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Öppna en HTML-fil eller kontrollera att det finns en fil med namnet index.html i din projektmapp för att kunna starta förhandsvisningen.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "För att starta förhandsvisningen med en fil innehållande serverkod måste du ange en bas-URL för detta projekt.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Ett fel uppstod när webbsevern för förhandsvisningen skulle startas. Vänligen försök igen.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Välkommen till förhandsvisningen!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Förhandsvisningen ansluter {APP_NAME} till din webbläsare. Den öppnar en förhandsvisning av din HTML-fil i webbläsaren och uppdaterar förhandsvisningen så fort ändringar skett i koden.<br /><br />I denna tidiga version av {APP_NAME} fungerar förhandsvisningen endast för redigering av <strong>CSS- och HTML-filer</strong> och endast med <strong>Google Chrome</strong>. Vid ändringar i JavaScript-kod laddas webbläsaren om när du sparar filen.<br /><br />(Du kommer bara se detta meddelande en gång.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "För mer information se <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Förhandsvisning",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Förhandsvisning: Ansluter\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Förhandsvisning: Initierar\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Koppla från förhandsvisningen",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Förhandsvisning (spara filen för att uppdatera)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Förhandsvisning (uppdateras inte på grund av syntaxfel)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Förhandsvisningen avbröts eftersom webbläsarens utvecklarverktyg öppnades.",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Förhandsvisningen avbröts eftersom sidan stängdes i webbläsaren.",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Förhandsvisningen avbröts eftersom webbläsaren navigerades till en sida som inte är del av det nuvarande projektet.",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Förhandsvisningen avbröts på grund av ett okänt fel. ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Spara ändringar?",
    "SAVE_CLOSE_MESSAGE"                : "Vill du spara de ändringar i dokumentet <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Vill du spara ändringarna du gjort följande filer?",
    "EXT_MODIFIED_TITLE"                : "Externa ändringar",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Bekräfta borttagning",
    "CONFIRM_FOLDER_DELETE"             : "Är du säker att du vill radera mappen <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Filen raderades",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> har ändrats.<br /><br />Vill du spara filen och skriva över dessa ändringar?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> har ändrats men har också osparade ändringar i {APP_NAME}.<br /><br />Vilken version vill du behålla?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> har raderats man har också osparade ändringar i {APP_NAME}.<br /><br />Vill du behålla dina ändringar?",
    
    // Generic dialog/button labels
    "DONE"                              : "Klar",
    "OK"                                : "OK",
    "CANCEL"                            : "Avbryt",
    "DONT_SAVE"                         : "Spara inte",
    "SAVE"                              : "Spara",
    "SAVE_AS"                           : "Spara som\u2026",
    "SAVE_AND_OVERWRITE"                : "Spara och skriv över",
    "DELETE"                            : "Radera",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nej",
    
    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                  : "{0} av {1}",
    "FIND_NO_RESULTS"                   : "Inga träffar",
    "FIND_QUERY_PLACEHOLDER"            : "Sök\u2026",
    "REPLACE_PLACEHOLDER"               : "Ersätt med\u2026",
    "BUTTON_REPLACE_ALL"                : "Alla\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Ersätt\u2026",
    "BUTTON_REPLACE"                    : "Ersätt",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Nästa träff",
    "BUTTON_PREV_HINT"                  : "Föregående träff",
    "BUTTON_CASESENSITIVE_HINT"         : "Skiftlägeskänslig",
    "BUTTON_REGEXP_HINT"                : "Regular Expression",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Ersätt utan att ångra",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Eftersom mer än {0} filer ändras kommer {APP_NAME} ändra dessa utan att de öppnas.<br />Du kommer inte att kunna ånga ändringarna i dessa filer.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Ersätt utan att ångra",

    "OPEN_FILE"                         : "Öppna fil",
    "SAVE_FILE_AS"                      : "Spara fil som",
    "CHOOSE_FOLDER"                     : "Välj mapp",

    "RELEASE_NOTES"                     : "Versionsinformation",
    "NO_UPDATE_TITLE"                   : "Du är uppdaterad!",
    "NO_UPDATE_MESSAGE"                 : "Du använder den senaste versionen av {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Ersätt",
    "FIND_REPLACE_TITLE_WITH"           : "med",
    "FIND_TITLE_LABEL"                  : "Hittades",
    "FIND_TITLE_SUMMARY"                : "&mdash; {0} {1} {2} i {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "i <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "i projekt",
    "FIND_IN_FILES_ZERO_FILES"          : "Filter exkluderar alla filer {0}",
    "FIND_IN_FILES_FILE"                : "fil",
    "FIND_IN_FILES_FILES"               : "filer",
    "FIND_IN_FILES_MATCH"               : "träff",
    "FIND_IN_FILES_MATCHES"             : "träffar",
    "FIND_IN_FILES_MORE_THAN"           : "Mer än ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd-klicka för att expandera/minimera alla",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Ersättningsfel",
    "REPLACE_IN_FILES_ERRORS"           : "Följande filer ändrades inte eftersom de förändrats efter sökningen eller inte kunde skrivas till.",
    
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Fel vid hämtning av versioninformation",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Det gick inte att hämta versionsinformation från servern. Kontrollera din internetuppkoppling och försök igen.",
    
    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Nytt exkluderingsset\u2026",
    "CLEAR_FILE_FILTER"                 : "Exkludera inte filer",
    "NO_FILE_FILTER"                    : "Exkludera filer\u2026",
    "EXCLUDE_FILE_FILTER"               : "Exkludera {0}",
    "EDIT_FILE_FILTER"                  : "Redigera\u2026",
    "FILE_FILTER_DIALOG"                : "Redigera filter",
    "FILE_FILTER_INSTRUCTIONS"          : "Exkludera filer och mappar som matchar någon av följande strängar, substrängar eller <a href='{0}' title='{0}'>wildcards</a>. Ange varje sträng på en ny rad.",
    "FILTER_NAME_PLACEHOLDER"           : "Namnge detta exkluderingsset (frivilligt)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "och {0} till",
    "FILTER_COUNTING_FILES"             : "Räknar filer\u2026",
    "FILTER_FILE_COUNT"                 : "Tillåter {0} av {1} filer {2}",
    "FILTER_FILE_COUNT_ALL"             : "Tillåter alla {0} filer {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Ingen Quick Edit är tillgänglig vid markörens nuvarande position",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "CSS Quick Edit: placera markören på ett klassnamn",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "CSS Quick Edit: ofullständigt klassattribut",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "CSS Quick Edit: ofullständigt ID-attribut",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "CSS Quick Edit: placera markören inom en tagg, klass eller ID",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "CSS tidsfunktion Quick Edit: felaktigt syntax",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "JS Quick Edit: placera markören på ett funktionsnamn",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Inga Quick Docs är tillgängliga vid markörens nuvarande position",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Öppnar\u2026",
    "UNTITLED"          : "Namnlös",
    "WORKING_FILES"     : "Öppna filer",

    /**
     * MainViewManager
     */
    "TOP"               : "Övre",
    "BOTTOM"            : "Undre",
    "LEFT"              : "Vänster",
    "RIGHT"             : "Höger",

    "CMD_SPLITVIEW_NONE"        : "Ingen delning",
    "CMD_SPLITVIEW_VERTICAL"    : "Vertikal delning",
    "CMD_SPLITVIEW_HORIZONTAL"  : "Horisontell delning",
    "SPLITVIEW_MENU_TOOLTIP"    : "Dela editorn vertikalt eller horisontellt",
    "GEAR_MENU_TOOLTIP"         : "Konfigurera arbetsyta",

    "SPLITVIEW_INFO_TITLE"              : "Redan öppen",
    "SPLITVIEW_MULTIPANE_WARNING"       : "Filen är redan öppen i en annan panel. {APP_NAME} kommer inom kort att stödja möjligheten att öppna samma fil i flera paneler. Filen kommer att visas i nuvarande panel tills dess.<br /><br />(Detta meddelande kommer bara att visas en gång.)",

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
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} markeringar",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klicka för att använda mellanslag för indrag",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klicka för att använda tabbar för indrag",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klicka för att ändra antalet mellanslag som används för indrag",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klicka för att ändra bredden på tabbtecken",
    "STATUSBAR_SPACES"                      : "Mellanslag:",
    "STATUSBAR_TAB_SIZE"                    : "Tabbstorlek:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} rad",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} rader",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Tillägg har avaktiverats",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "ÖVR",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Klicka för att växla mellan Insert (INS)- och Overwrite (OVR)-läge.",
    "STATUSBAR_LANG_TOOLTIP"                : "Klicka för att byta filtyp",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Klicka för att visa rapportpanel.",
    "STATUSBAR_DEFAULT_LANG"                : "(standard)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Ställ in som standard för .{0}-filer",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} fel",
    "SINGLE_ERROR"                          : "1 {0} fel",
    "MULTIPLE_ERRORS"                       : "{1} {0} fel",
    "NO_ERRORS"                             : "Inga {0} fel funna - bra jobbat!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Inga fel funna - bra jobbat!",
    "LINT_DISABLED"                         : "Linting är avaktiverat.",
    "NO_LINT_AVAILABLE"                     : "Ingen linter är tillgänglig för {0}",
    "NOTHING_TO_LINT"                       : "Ingenting att linta",
    "LINTER_TIMED_OUT"                      : "{0} har avbrutits efter att ha väntat {1} ms",
    "LINTER_FAILED"                         : "{0} avbröts efter ett fel: {1}",
    
    
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
    "CMD_OPEN_DROPPED_FILES"              : "Öppna släppta filer",
    "CMD_OPEN_FOLDER"                     : "Öppna mapp\u2026",
    "CMD_FILE_CLOSE"                      : "Stäng",
    "CMD_FILE_CLOSE_ALL"                  : "Stäng alla",
    "CMD_FILE_CLOSE_LIST"                 : "Stäng lista",
    "CMD_FILE_CLOSE_OTHERS"               : "Stäng andra",
    "CMD_FILE_CLOSE_ABOVE"                : "Stäng andra ovanför",
    "CMD_FILE_CLOSE_BELOW"                : "Stäng andra nedanför",
    "CMD_FILE_SAVE"                       : "Spara",
    "CMD_FILE_SAVE_ALL"                   : "Spara alla",
    "CMD_FILE_SAVE_AS"                    : "Spara som\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Förhandsvisning",
    "CMD_RELOAD_LIVE_PREVIEW"             : "Tvinga uppdatering av förhandsvisningen",
    "CMD_PROJECT_SETTINGS"                : "Projektinställningar\u2026",
    "CMD_FILE_RENAME"                     : "Byt namn",
    "CMD_FILE_DELETE"                     : "Radera",
    "CMD_INSTALL_EXTENSION"               : "Installera tillägg\u2026",
    "CMD_EXTENSION_MANAGER"               : "Tilläggshanteraren\u2026",
    "CMD_FILE_REFRESH"                    : "Uppdatera filträd",
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
    "CMD_SPLIT_SEL_INTO_LINES"            : "Dela markering i rader",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Lägg till markör på nästa rad",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Lägg till markör på föregående rad",
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
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Stäng parenteser automatiskt",
    "CMD_SHOW_CODE_HINTS"                 : "Visa kodförslag",
    
    // Search menu commands
    "FIND_MENU"                           : "Sök",
    "CMD_FIND"                            : "Sök",
    "CMD_FIND_NEXT"                       : "Sök nästa",
    "CMD_FIND_PREVIOUS"                   : "Sök föregående",
    "CMD_FIND_ALL_AND_SELECT"             : "Sök och markera alla",
    "CMD_ADD_NEXT_MATCH"                  : "Lägg nästa träff till markering",
    "CMD_SKIP_CURRENT_MATCH"              : "Hoppa över och lägg till nästa träff",
    "CMD_FIND_IN_FILES"                   : "Sök i filer",
    "CMD_FIND_IN_SUBTREE"                 : "Sök i\u2026",
    "CMD_REPLACE"                         : "Ersätt",
    "CMD_REPLACE_IN_FILES"                : "Ersätt i filer",
    "CMD_REPLACE_IN_SUBTREE"              : "Ersätt i\u2026",
    
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
    "CMD_LIVE_HIGHLIGHT"                  : "Markera förhandsvisning",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Linta filer vid spara",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Sortera efter senast tillagd",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Sortera efter namn",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Sortera efter typ",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Automatisk sortering",
    "CMD_THEMES"                          : "Teman\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigera",
    "CMD_QUICK_OPEN"                      : "Snabböppna",
    "CMD_GOTO_LINE"                       : "Gå till rad",
    "CMD_GOTO_DEFINITION"                 : "Gå till definition",
    "CMD_GOTO_FIRST_PROBLEM"              : "Gå till första fel/varning",
    "CMD_TOGGLE_QUICK_EDIT"               : "Snabbredigering",
    "CMD_TOGGLE_QUICK_DOCS"               : "Quick Docs",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Föregående träff",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Nästa träff",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Ny regel",
    "CMD_NEXT_DOC"                        : "Nästa dokument",
    "CMD_PREV_DOC"                        : "Föregående dokument",
    "CMD_SHOW_IN_TREE"                    : "Visa i filträdet",
    "CMD_SHOW_IN_EXPLORER"                : "Visa i Utforskaren",
    "CMD_SHOW_IN_FINDER"                  : "Visa i Finder",
    "CMD_SHOW_IN_OS"                      : "Visa i operativsystemet",
    
    // Help menu commands
    "HELP_MENU"                           : "Hjälp",
    "CMD_CHECK_FOR_UPDATE"                : "Sök efter uppdateringar",
    "CMD_HOW_TO_USE_BRACKETS"             : "Hur du använder {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME}-forum",
    "CMD_SUGGEST"                         : "Föreslå en funktion",
    "CMD_RELEASE_NOTES"                   : "Versionsinformation",
    "CMD_GET_INVOLVED"                    : "Engagera dig",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Visa tilläggsmapp",
    "CMD_HOMEPAGE"                        : "Webbplats för {APP_TITLE}",
    "CMD_TWITTER"                         : "{TWITTER_NAME} på Twitter",
    "CMD_ABOUT"                           : "Om {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Öppna inställningsfil",
    "CMD_OPEN_KEYMAP"                     : "Öppna användarens tangentuppsättning",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimental build",
    "RELEASE_BUILD"                        : "build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "RELOAD_FROM_DISK"                     : "Ladda om",
    "KEEP_CHANGES_IN_EDITOR"               : "Behåll ändringar i editorn",
    "CLOSE_DONT_SAVE"                      : "Stäng (spara inte)",
    "RELAUNCH_CHROME"                      : "Starta om Chrome",
    "ABOUT"                                : "Om",
    "CLOSE"                                : "Stäng",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "tidsstämpel för build: ",
    "ABOUT_TEXT_LINE3"                     : "Meddelanden och villkor gällande program från tredje part finns på <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> och inkluderas här som referens.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentation och källkod återfinns på <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Skapat med \u2764 och JavaScript av:",
    "ABOUT_TEXT_LINE6"                     : "Massor av människor (men vi har lite problem att visa dessa data just nu).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs och dess logotyp är licenserad under en Creative Commons Attribution-licens, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "En ny version av {APP_NAME} är tillgänglig! Klicka här för fler detaljer.",
    "UPDATE_AVAILABLE_TITLE"               : "Uppdatering tillgänglig!",
    "UPDATE_MESSAGE"                       : "Hallå! En ny version av {APP_NAME} är tillgänglig. Här är några av de nya funktionerna:",
    "GET_IT_NOW"                           : "Installera nu!",
    "PROJECT_SETTINGS_TITLE"               : "Projektinställningar för: {0}",
    "PROJECT_SETTING_BASE_URL"             : "URL till förhandsvisning",
    "PROJECT_SETTING_BASE_URL_HINT"        : "För att använda en lokal server anger du en adress liknande: http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0}-protokollet stöder inte förhandsvisning &mdash; vänligen använd http: eller https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Adressen kan inte innehålla sökparametrar som \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Adressen kan inte innehålla hashar som \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Specialtecken som '{0}' måste vara %-kodade.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Okänt fel när adressen skulle läsas!",
    "EMPTY_VIEW_HEADER"                    : "<em>Öppna en fil medan denna panel är i fokus</em>",
    
    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Nuvarande tema",
    "USE_THEME_SCROLLBARS"                 : "Använd temats scrollbars",
    "FONT_SIZE"                            : "Teckenstorlek",
    "FONT_FAMILY"                          : "Typsnitt",
    "THEMES_SETTINGS"                      : "Temainställningar",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Ny regel",
    
    // Extension Management strings
    "INSTALL"                              : "Installera",
    "UPDATE"                               : "Uppdatera",
    "REMOVE"                               : "Radera",
    "OVERWRITE"                            : "Skriv över",
    "CANT_REMOVE_DEV"                      : "Tillägg i mappen \"dev\" måste raderas manuellt.",
    "CANT_UPDATE"                          : "Uppdateringen är inte kompatibel med denna version av {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Tilläggen i mappen \"dev\" kan inte uppdateras automatiskt.",
    "INSTALL_EXTENSION_TITLE"              : "Installera tillägg",
    "UPDATE_EXTENSION_TITLE"               : "Uppdatera tillägg",
    "INSTALL_EXTENSION_LABEL"              : "Tilläggets URL",
    "INSTALL_EXTENSION_HINT"               : "URL till tilläggets zip-fil eller GitHub-repository",
    "INSTALLING_FROM"                      : "Installerar tillägg från {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Tillägget installerades!",
    "INSTALL_FAILED"                       : "Installationen misslyckades.",
    "CANCELING_INSTALL"                    : "Avbryter\u2026",
    "CANCELING_HUNG"                       : "Installationen avbröts då den tog för lång tid. Ett internt fel kan ha inträffat.",
    "INSTALL_CANCELED"                     : "Installationen avbröts.",
    "VIEW_COMPLETE_DESCRIPTION"            : "Visa hela beskrivningen",
    "VIEW_TRUNCATED_DESCRIPTION"           : "Visa förkortad beskrivning",
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
    "EXTENSION_ALREADY_INSTALLED"          : "Installationen av detta tillägg kommer att skriva över ett tidigare installerat tillägg. Vill du skriva över det befintliga tillägget?",
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
    "INSTALL_EXTENSION_DRAG"               : "Dra .zip hit eller",
    "INSTALL_EXTENSION_DROP"               : "Släpp .zip här för att installera",
    "INSTALL_EXTENSION_DROP_ERROR"         : "Installation/Uppdatering avbröts på grund av följande fel:",
    "INSTALL_FROM_URL"                     : "Installera från URL\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "Validerar\u2026",
    "EXTENSION_AUTHOR"                     : "Författare",
    "EXTENSION_DATE"                       : "Datum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Detta tillägg kräver en nyare version av {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Detta tillägg fungerar för närvarande bara med äldre versioner av {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Version {0} av detta tillägg kräver en nyare version av {APP_NAME} men du kan installera den äldre versionen {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Version {0} av detta tillägg fungerar endast med äldre versioner av {APP_NAME} men du kan installera den äldre versionen {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Ingen beskrivning",
    "EXTENSION_MORE_INFO"                  : "Mer information...",
    "EXTENSION_ERROR"                      : "Tilläggsfel",
    "EXTENSION_KEYWORDS"                   : "Nyckelord",
    "EXTENSION_TRANSLATED_USER_LANG"       : "Översatt till {0} språk, inklusive ditt",
    "EXTENSION_TRANSLATED_GENERAL"         : "Översatt till {0} språk",
    "EXTENSION_TRANSLATED_LANGS"           : "Detta tillägg har översatts till dessa språk: {0}",
    "EXTENSION_INSTALLED"                  : "Installerade",
    "EXTENSION_UPDATE_INSTALLED"           : "Uppdateringen av detta tillägg har laddats ner och kommer att installeras när {APP_NAME} startas om.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Sök",
    "EXTENSION_MORE_INFO_LINK"             : "Mer",
    "BROWSE_EXTENSIONS"                    : "Bläddra bland tillägg",
    "EXTENSION_MANAGER_REMOVE"             : "Ta bort tillägg",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Kunde inte ta bort ett eller flera tillägg: {0}. {APP_NAME} kommer fortfarande att startas om.",
    "EXTENSION_MANAGER_UPDATE"             : "Uppdatera tillägg",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Kunde inte uppdatera ett eller flera tillägg: {0}. {APP_NAME} kommer fortfarande att startas om.",
    "MARKED_FOR_REMOVAL"                   : "Markerad för borttagning",
    "UNDO_REMOVE"                          : "Ångra",
    "MARKED_FOR_UPDATE"                    : "Markerad för uppdatering",
    "UNDO_UPDATE"                          : "Ångra",
    "CHANGE_AND_RELOAD_TITLE"              : "Ändra tillägg",
    "CHANGE_AND_RELOAD_MESSAGE"            : "{APP_NAME} måste startas om för att uppdatera eller ta bort markerade tillägg. Du kommer att få en fråga om att spara eventuella osparade ändringar.",
    "REMOVE_AND_RELOAD"                    : "Ta bort tillägg och starta om",
    "CHANGE_AND_RELOAD"                    : "Ta bort tillägg och starta om",
    "UPDATE_AND_RELOAD"                    : "Ändra tillägg och starta om",
    "PROCESSING_EXTENSIONS"                : "Genomför förändringar av tillägg\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Kunde inte radera tillägget {0} då det inte är installerat.",
    "NO_EXTENSIONS"                        : "Inga tillägg har installerats ännu.<br>Klicka på fliken Tillgängliga för att komma igång.",
    "NO_EXTENSION_MATCHES"                 : "Inga tillägg matchade din sökning.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Var försiktig när du installerar tillägg från okända källor.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Installerade",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Tillgängliga",
    "EXTENSIONS_THEMES_TITLE"              : "Teman",
    "EXTENSIONS_UPDATES_TITLE"             : "Uppdateringar",
    
    "INLINE_EDITOR_NO_MATCHES"             : "Inga träffar tillgängliga.",
    "INLINE_EDITOR_HIDDEN_MATCHES"         : "Alla träffar är minimerade. Expandera filerna listade till höger för att visa träffar.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Det finns inga CSS-regler som matchar din markering.<br> Klicka på \"Ny regel\" för att skapa en.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Det finns inga stilmallar i ditt projekt.<br>Skapa en flr att lägga till CSS-regler.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "största",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixlar",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "ERRORS"                                    : "Fel",
    "CMD_SHOW_DEV_TOOLS"                        : "Visa utvecklarverktyg",
    "CMD_REFRESH_WINDOW"                        : "Starta om med tillägg",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Starta om utan tillägg",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nytt {APP_NAME}-fönster",
    "CMD_SWITCH_LANGUAGE"                       : "Byt språk",
    "CMD_RUN_UNIT_TESTS"                        : "Kör tester",
    "CMD_SHOW_PERF_DATA"                        : "Visa prestandadata",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Aktivera Node-debugger",
    "CMD_LOG_NODE_STATE"                        : "Skriv ut Node-status till konsollen",
    "CMD_RESTART_NODE"                          : "Starta om Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Visa fel i statusraden",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Öppna Brackets källkod",
    
    "LANGUAGE_TITLE"                            : "Byt språk",
    "LANGUAGE_MESSAGE"                          : "Språk:",
    "LANGUAGE_SUBMIT"                           : "Uppdatera {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Avbryt",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Systemstandard",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Tid",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progression",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Flytta markerad punkt<br><kbd class='text'>Shift</kbd> Flytta tio enheter",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Öka eller minska antal steg<br><kbd>←</kbd><kbd>→</kbd> 'Start' eller 'Slut'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Det tidigare värdet <code>{0}</code> är inte korrekt så den visade funktionen har ändrats till <code>{1}</code>. Dokumentet kommer att uppdateras med det första värdet.",
    
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
    "DETECTED_EXCLUSION_TITLE"                  : "Problem att slutleda JavaScript-fil",
    "DETECTED_EXCLUSION_INFO"                   : "Brackets stötte på processeringsfel:<br><br>{0}<br><br>Denna fil kommer inte längre genomsökas efter kodförslag eller definitioner. Öppna <code>.brackets.json</code> och ta bort filen från jscodehints.detectedExclusions för att återställa detta.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView 
    "CMD_ENABLE_QUICK_VIEW"                     : "Quick View vid hover",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Senaste projekt",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Läs mer"
});

/* Last translated for fd3ef2bf9041fc067c47d600df1372725f6f5f04 */
