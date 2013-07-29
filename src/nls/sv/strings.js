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
    "FILE"                              : "fil",
    "DIRECTORY"                         : "mapp",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Projektet kunde ej läsas",
    "OPEN_DIALOG_ERROR"                 : "Ett fel inträffade när Fil-dialogen skulle visas. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ett fel inträffade när mappen skulle öppnas <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Ett fel inträffade när mappens innehåll skulle läsas <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Fel vid öppning utav fil",
    "ERROR_OPENING_FILE"                : "Ett fel inträffade när filen skulle öppnas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "An error occurred when trying to open the following files:",
    "ERROR_RELOADING_FILE_TITLE"        : "Fel vid uppdatering utav ändringar från hårddisken",
    "ERROR_RELOADING_FILE"              : "Ett fel inträffade när filen skulle läsas om <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Filen kunde inte sparas",
    "ERROR_SAVING_FILE"                 : "Ett fel inträffade när filen skulle sparas <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Filen kunde ej döpas om",
    "ERROR_RENAMING_FILE"               : "Ett fel uppstod vid försök att byta namn på filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Error deleting file",
    "ERROR_DELETING_FILE"               : "An error occurred when trying to delete the file <span class='dialog-filename'>{0}</span>. {1}",
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
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Unable to load Live Development page",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Öppna en HTML-fil för att kunna förhandsvisa.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "För att starta realtids förhandsgranskning med en fjärrfil så behöver du ange en URL för detta projekt.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Error starting up the HTTP server for live development files. Please try again.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Välkommen till realtids förhandsgranskning!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Förhandsvisningen ansluter {APP_NAME} till din webbläsare. Den öppnar en förhandsvisning utav din HTML fil i webbläsaren, sen uppdateras förhandsgranskningen så fort ändringar skett i koden.<br /><br />I en föregående version {APP_NAME}, förhandsgranskning funkar bara vid redigering utav <strong>CSS filer</strong> och endast med <strong>Google Chrome</strong>. Vi kommer att genomföra detta för HTML och JavaScript snart!<br /><br />(Du kommer bara se detta meddelande en gång.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "För mer information, se <a class=\"clickable-link\" data-href=\"{0}\">Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Förhandsvisning",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Förhandsvisning: Ansluter\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Förhandsvisning: Initierar\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Koppla från förhandsvisningen",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Förhandsvisning: Klicka för att koppla från (Spara filen för att uppdatera)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Live Preview was cancelled because the browser's developer tools were opened",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Live Preview was cancelled because the page was closed in the browser",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Live Preview was cancelled because the browser navigated to a page that is not part of the current project",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Live Preview was cancelled for an unknown reason ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Spara ändringar",
    "SAVE_CLOSE_MESSAGE"                : "Vill du spara ändringar du gjort i detta dokument <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Vill du spara ändringar du gjort i dessa dokument?",
    "EXT_MODIFIED_TITLE"                : "Externa ändringar",
    "FILE_DELETED_TITLE"                : "File Deleted",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> har ändrats, men har också osparade ändringar i {APP_NAME}.<br /><br />Vilken version vill du behålla?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> har raderats, man har också osparade ändringar i {APP_NAME}.<br /><br />Vill du behålla dina ändringar?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Använd /re/ syntax för regexp sökning",
    "FIND_RESULT_COUNT"                 : "{0} results",
    "WITH"                              : "Med",
    "BUTTON_YES"                        : "Ja",
    "BUTTON_NO"                         : "Nej",
    "BUTTON_STOP"                       : "Avbryt",

    "OPEN_FILE"                         : "Öppna fil",
    "SAVE_FILE_AS"                      : "Save File",
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

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Loading\u2026",
    "UNTITLED"          : "Untitled",
    "WORKING_FILES"     : "Working Files",

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
    "STATUSBAR_TAB_SIZE"                    : "Tabbstorlek",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} rad",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} rader",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Arkiv",
    "CMD_FILE_NEW_UNTITLED"               : "New",
    "CMD_FILE_NEW"                        : "Ny fil",
    "CMD_FILE_NEW_FOLDER"                 : "Ny mapp",
    "CMD_FILE_OPEN"                       : "Öppna\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Lägg till i arbetsyta",
    "CMD_OPEN_FOLDER"                     : "Öppna mapp\u2026",
    "CMD_FILE_CLOSE"                      : "Stäng",
    "CMD_FILE_CLOSE_ALL"                  : "Stäng alla",
    "CMD_FILE_SAVE"                       : "Spara",
    "CMD_FILE_SAVE_ALL"                   : "Spara alla",
    "CMD_FILE_SAVE_AS"                    : "Save As\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Förhandsvisning",
    "CMD_LIVE_HIGHLIGHT"                  : "Live Preview Highlight",
    "CMD_PROJECT_SETTINGS"                : "Projektinställningar\u2026",
    "CMD_FILE_RENAME"                     : "Byt Namn",
    "CMD_FILE_DELETE"                     : "Delete",
    "CMD_INSTALL_EXTENSION"               : "Install Extension\u2026",
    "CMD_EXTENSION_MANAGER"               : "Extension Manager\u2026",
    "CMD_FILE_REFRESH"                    : "Refresh",
    "CMD_QUIT"                            : "Avsluta",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Exit",

    // Edit menu commands
    "EDIT_MENU"                           : "Redigera",
    "CMD_UNDO"                            : "Undo",
    "CMD_REDO"                            : "Redo",
    "CMD_CUT"                             : "Cut",
    "CMD_COPY"                            : "Copy",
    "CMD_PASTE"                           : "Paste",
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
    "CMD_OPEN_LINE_ABOVE"                 : "Open Line Above",
    "CMD_OPEN_LINE_BELOW"                 : "Open Line Below",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Auto Close Braces",
    "CMD_SHOW_CODE_HINTS"                 : "Show Code Hints",
     
    // View menu commands
    "VIEW_MENU"                           : "Visa",
    "CMD_HIDE_SIDEBAR"                    : "Dölj sidomeny",
    "CMD_SHOW_SIDEBAR"                    : "Visa sidomeny",
    "CMD_INCREASE_FONT_SIZE"              : "Öka textstorlek",
    "CMD_DECREASE_FONT_SIZE"              : "Minska teckenstorlek",
    "CMD_RESTORE_FONT_SIZE"               : "Återställ teckenstorlek",
    "CMD_SCROLL_LINE_UP"                  : "Scroll Line Up",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll Line Down",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Line Numbers",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Highlight Active Line",
    "CMD_TOGGLE_WORD_WRAP"                : "Word Wrap",
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
    "CMD_TOGGLE_QUICK_DOCS"               : "Quick Docs",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Föregående matchning",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Nästa matchning",
    "CMD_NEXT_DOC"                        : "Nästa dokument",
    "CMD_PREV_DOC"                        : "Föregående dokument",
    "CMD_SHOW_IN_TREE"                    : "Visa i Fil-träd",
    "CMD_SHOW_IN_OS"                      : "Show in OS",
    
    // Help menu commands
    "HELP_MENU"                           : "Hjälp",
    "CMD_CHECK_FOR_UPDATE"                : "Sök efter uppdateringar",
    "CMD_HOW_TO_USE_BRACKETS"             : "How to Use {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} Forum",
    "CMD_RELEASE_NOTES"                   : "Release Notes",
    "CMD_REPORT_AN_ISSUE"                 : "Report an Issue",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Show Extensions Folder",
    "CMD_TWITTER"                         : "{TWITTER_NAME} on Twitter",
    "CMD_ABOUT"                           : "About {APP_TITLE}",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Stäng Fönster",
    "CMD_ABORT_QUIT"                      : "Avbryt Avstängning",
    "CMD_BEFORE_MENUPOPUP"                : "Before Menu Popup",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Experimental Build",
    "DEVELOPMENT_BUILD"                    : "development build",
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
    "CLOSE"                                : "Stäng",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} experimental build {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Meddelanden och villkor som gäller program från tredje part finns på <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> och införlivas häri som referens.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentation och källa här <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Made with \u2764 and JavaScript by:",
    "ABOUT_TEXT_LINE6"                     : "Lots of people (but we're having trouble loading that data right now).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a class=\"clickable-link\" data-href=\"{WEB_PLATFORM_DOCS_LICENSE}\">CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Det finns en ny version av {APP_NAME} tillgänglig! Klicka här för flera detaljer.",
    "UPDATE_AVAILABLE_TITLE"               : "Uppdatering tillgänglig!",
    "UPDATE_MESSAGE"                       : "Hallå!, det finns en ny version utav {APP_NAME} tillgänglig. Här är några nya funktioner:",
    "GET_IT_NOW"                           : "Installera nu!",
    "PROJECT_SETTINGS_TITLE"               : "Projekt Inställningar för: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Förhandsvisnings URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(lämna för fil adress)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0} protokollet stödjer ej förhandsvisning—använd http: eller https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Adressen kan inte innehålla sökparametrar som \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Adressen kan inte innehålla hashar som \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Specialtecken som '{0}' måste vara %-kodade.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Okänt fel!",
    
    // Extension Management strings
    "INSTALL"                              : "Install",
    "UPDATE"                               : "Update",
    "REMOVE"                               : "Remove",
    "OVERWRITE"                            : "Overwrite",
    "CANT_REMOVE_DEV"                      : "Extensions in the \"dev\" folder must be manually deleted.",
    "CANT_UPDATE"                          : "The update isn't compatible with this version of {APP_NAME}.",
    "INSTALL_EXTENSION_TITLE"              : "Install Extension",
    "UPDATE_EXTENSION_TITLE"               : "Update Extension",
    "INSTALL_EXTENSION_LABEL"              : "Extension URL",
    "INSTALL_EXTENSION_HINT"               : "URL of the extension's zip file or GitHub repo",
    "INSTALLING_FROM"                      : "Installing extension from {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Installation successful!",
    "INSTALL_FAILED"                       : "Installation failed.",
    "CANCELING_INSTALL"                    : "Canceling\u2026",
    "CANCELING_HUNG"                       : "Canceling the install is taking a long time. An internal error may have occurred.",
    "INSTALL_CANCELED"                     : "Installation canceled.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "The downloaded content is not a valid zip file.",
    "INVALID_PACKAGE_JSON"                 : "The package.json file is not valid (error was: {0}).",
    "MISSING_PACKAGE_NAME"                 : "The package.json file doesn't specify a package name.",
    "BAD_PACKAGE_NAME"                     : "{0} is an invalid package name.",
    "MISSING_PACKAGE_VERSION"              : "The package.json file doesn't specify a package version.",
    "INVALID_VERSION_NUMBER"               : "The package version number ({0}) is invalid.",
    "INVALID_BRACKETS_VERSION"             : "The {APP_NAME} compatibility string ({0}) is invalid.",
    "DISALLOWED_WORDS"                     : "The words ({1}) are not allowed in the {0} field.",
    "API_NOT_COMPATIBLE"                   : "The extension isn't compatible with this version of {APP_NAME}. It's installed in your disabled extensions folder.",
    "MISSING_MAIN"                         : "The package has no main.js file.",
    "EXTENSION_ALREADY_INSTALLED"          : "Installing this package will overwrite a previously installed extension. Overwrite the old extension?",
    "EXTENSION_SAME_VERSION"               : "This package is the same version as the one that is currently installed. Overwrite the existing installation?",
    "EXTENSION_OLDER_VERSION"              : "This package is version {0} which is older than the currently installed ({1}). Overwrite the existing installation?",
    "DOWNLOAD_ID_IN_USE"                   : "Internal error: download ID already in use.",
    "NO_SERVER_RESPONSE"                   : "Cannot connect to server.",
    "BAD_HTTP_STATUS"                      : "File not found on server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Unable to save download to temp file.",
    "ERROR_LOADING"                        : "The extension encountered an error while starting up.",
    "MALFORMED_URL"                        : "The URL is invalid. Please check that you entered it correctly.",
    "UNSUPPORTED_PROTOCOL"                 : "The URL must be an http or https URL.",
    "UNKNOWN_ERROR"                        : "Unknown internal error.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Extension Manager",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Unable to access the extension registry. Please try again later.",
    "INSTALL_FROM_URL"                     : "Install from URL\u2026",
    "EXTENSION_AUTHOR"                     : "Author",
    "EXTENSION_DATE"                       : "Date",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "This extension requires a newer version of {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "This extension currently only works with older versions of {APP_NAME}.",
    "EXTENSION_NO_DESCRIPTION"             : "No description",
    "EXTENSION_MORE_INFO"                  : "More info...",
    "EXTENSION_ERROR"                      : "Extension error",
    "EXTENSION_KEYWORDS"                   : "Keywords",
    "EXTENSION_INSTALLED"                  : "Installed",
    "EXTENSION_UPDATE_INSTALLED"           : "This extension update has been downloaded and will be installed when you quit {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Search",
    "EXTENSION_MORE_INFO_LINK"             : "More",
    "BROWSE_EXTENSIONS"                    : "Browse Extensions",
    "EXTENSION_MANAGER_REMOVE"             : "Remove Extension",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Unable to remove one or more extensions: {0}. {APP_NAME} will still quit.",
    "EXTENSION_MANAGER_UPDATE"             : "Update Extension",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Unable to update one or more extensions: {0}. {APP_NAME} will still quit.",
    "MARKED_FOR_REMOVAL"                   : "Marked for removal",
    "UNDO_REMOVE"                          : "Undo",
    "MARKED_FOR_UPDATE"                    : "Marked for update",
    "UNDO_UPDATE"                          : "Undo",
    "CHANGE_AND_QUIT_TITLE"                : "Change Extensions",
    "CHANGE_AND_QUIT_MESSAGE"              : "To update or remove the marked extensions, you need to quit and restart {APP_NAME}. You'll be prompted to save unsaved changes.",
    "REMOVE_AND_QUIT"                      : "Remove Extensions and Quit",
    "CHANGE_AND_QUIT"                      : "Change Extensions and Quit",
    "UPDATE_AND_QUIT"                      : "Update Extensions and Quit",
    "EXTENSION_NOT_INSTALLED"              : "Couldn't remove extension {0} because it wasn't installed.",
    "NO_EXTENSIONS"                        : "No extensions installed yet.<br>Click on the Available tab above to get started.",
    "NO_EXTENSION_MATCHES"                 : "No extensions match your search.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Be cautious when installing extensions from an unknown source.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Installed",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Available",
    "EXTENSIONS_UPDATES_TITLE"             : "Updates",
    
    /**
     * Unit names
     */
    "UNIT_PIXELS"                               : "pixels",
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "CMD_SHOW_DEV_TOOLS"                        : "Visa Utvecklarverktyg",
    "CMD_REFRESH_WINDOW"                        : "Ladda om {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nytt {APP_NAME} Fönster",
    "CMD_SWITCH_LANGUAGE"                       : "Byt Språk",
    "CMD_RUN_UNIT_TESTS"                        : "Kör tester",
    "CMD_SHOW_PERF_DATA"                        : "Visa prestandadata",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Enable Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Log Node State to Console",
    "CMD_RESTART_NODE"                          : "Restart Node",
    
    "LANGUAGE_TITLE"                            : "Byt språk",
    "LANGUAGE_MESSAGE"                          : "Välj önskat språk i listan nedan:",
    "LANGUAGE_SUBMIT"                           : "Uppdatera {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Avbryt",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "System Default",
    
    /**
     * Locales
     */
    "LOCALE_CS"                                 : "Czech",
    "LOCALE_DE"                                 : "German",
    "LOCALE_EN"                                 : "English",
    "LOCALE_ES"                                 : "Spanish",
    "LOCALE_FR"                                 : "French",
    "LOCALE_IT"                                 : "Italian",
    "LOCALE_JA"                                 : "Japanese",
    "LOCALE_NB"                                 : "Norwegian",
    "LOCALE_PL"                                 : "Polish",
    "LOCALE_PT_BR"                              : "Portuguese, Brazil",
    "LOCALE_PT_PT"                              : "Portuguese",
    "LOCALE_RU"                                 : "Russian",
    "LOCALE_SV"                                 : "Swedish",
    "LOCALE_TR"                                 : "Turkish",
    "LOCALE_ZH_CN"                              : "Chinese, simplified",
    "LOCALE_HU"                                 : "Hungarian",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Nuvarande färg",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Originalfärg",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa-format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex-format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa-format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (använd {1} gång)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (använd {1} gånger)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Jump to Definition",
    
    // extensions/default/JSLint
    "CMD_JSLINT"                                : "Aktivera JSLint",
    "CMD_JSLINT_FIRST_ERROR"                    : "Gå till första JSLint-felet",
    "JSLINT_ERRORS"                             : "JSLint-felmeddelanden",
    "JSLINT_ERROR_INFORMATION"                  : "1 JSLint-fel",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} JSLint-fel",
    "JSLINT_NO_ERRORS"                          : "Inga JSLint-fel - Bra jobbat!",
    "JSLINT_DISABLED"                           : "JSLint är inaktiverat eller inte kompatibelt med denna fil",
    
    // extensions/default/QuickView 
    "CMD_ENABLE_QUICK_VIEW"                     : "Quick View on Hover",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Läs mer"
});
