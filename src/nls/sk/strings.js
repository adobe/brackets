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
     * Chyby
     */

    // Všeobecné chyby súboru
    "GENERIC_ERROR"                     : "(chyba {0})",
    "NOT_FOUND_ERR"                     : "Súbor nenájdený.",
    "NOT_READABLE_ERR"                  : "Súbor sa nedá čítať.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Cieľový adresár nemôže byť zmenený.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Práva vám neumožňujú robiť zmeny.",
    "FILE_EXISTS_ERR"                   : "Súbor alebo adresár už existuje.",
    "FILE"                              : "súbor",
    "DIRECTORY"                         : "adresár",

    // Reťazce chyby projektu
    "ERROR_LOADING_PROJECT"             : "Chyba pri otváraní projektu",
    "OPEN_DIALOG_ERROR"                 : "Nastala chyba pri zobrazení dialógu otvorenia súboru. (chyba {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Nastala chyba pri načítaní adresára <span class='dialog-filename'>{0}</span>. (chyba {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Nastala chyba pri načítaní obsahu adresára <span class='dialog-filename'>{0}</span>. (chyba {1})",

    // Reťazce chýb pri otváraní/ukladaní súboru
    "ERROR_OPENING_FILE_TITLE"          : "Chyba pri otváraní súboru",
    "ERROR_OPENING_FILE"                : "Nastala chyba pri otváraní súboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Nastala chyba pri otváraní nasledujúcich súborov:",
    "ERROR_RELOADING_FILE_TITLE"        : "Chyba pri načítaní zmien z disku",
    "ERROR_RELOADING_FILE"              : "Nastala chyba pri načítaní súboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Chyba pri ukladaní súboru",
    "ERROR_SAVING_FILE"                 : "Nastala chyba pri ukladaní súboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Chyba pri premenovaní súboru",
    "ERROR_RENAMING_FILE"               : "Nastala chyba pri premenovaní súboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Chyba pri zmazaní súboru",
    "ERROR_DELETING_FILE"               : "Nastala chyba pri zmazaní súboru <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Neplatný {0} názov",
    "INVALID_FILENAME_MESSAGE"          : "Názvy súboru nesmú obsahovať nasledujúce znaky: /?*:;{}<>\\| alebo používať rezervované systémové slová.",
    "FILE_ALREADY_EXISTS"               : "Súbor {0} <span class='dialog-filename'>{1}</span> už existuje.",
    "ERROR_CREATING_FILE_TITLE"         : "Chyba pri vytváraní súboru {0}",
    "ERROR_CREATING_FILE"               : "Nastala chyba pri vytváraní súboru {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Reťazce chýb aplikácie
    "ERROR_IN_BROWSER_TITLE"            : "Hopa! {APP_NAME} zatiaľ nejde spustiť v prehliadači.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} je vytvorený HTML, ale teraz pracuje ako desktopová aplikácia, takže ho môžete využiť na úpravu lokálnych súborov. Prosím, používajte shell aplikácie v <b>github.com/adobe/brackets-shell</b> repozitári pre spustenie {APP_NAME}.",

    // Reťazce chýb indexovaní súboru
    "ERROR_MAX_FILES_TITLE"             : "Chyba pri indexovaní súborov",
    "ERROR_MAX_FILES"                   : "Bol indexovaný maximálny počet súborov. Akcie pre vyhľadávanie súborov podľa indexu nemusia fungovať správne.",

    // Reťazce chýb pri živom náhlade
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Chyba pri spúšťaní prehliadača",
    "ERROR_CANT_FIND_CHROME"            : "Prehliadač Google Chrome nebol nájdený. Prosím uistite sa, že je nainštalovaný.",
    "ERROR_LAUNCHING_BROWSER"           : "Nastala chyba pri spúšťaní prehliadača. (chyba {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Chyba pri živom náhľade",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Pripojovanie k prehliadaču",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "V prípade využitia živého náhľadu je treba reštarovať Chrome zo zapnutým vzdialeným ladením.<br /><br />Chceli by ste reštartovať Chrome a zapnúť vzdialené ladenie?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Nie je možné načítať stránku zo živým náhľadom",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Otvorte HTML súbor pre spustenie živého náhľadu.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Pre spustenie živého náhľadu zo súborom na serveri, musíte špecifikovať URL pre tento projekt.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Chyba pri spúšťaní HTTP severa pre súbory živého náhľadu. Prosím, skúste to znovu.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Vitajte v živom náhľade!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Živý náhľad pripája {APP_NAME} k vášmu prehliadaču. Spustí náhľad vášho HTML súboru v prehliadači, potom aktualizuje náhľad okamžite, vždy keď upravíte svoj kód.<br /><br />V tejto verzii {APP_NAME}, živý náhľad funguje iba s <strong>Google Chrome</strong> a aktualizuje keď upravíte <strong>CSS súbory</strong>. Zmeny pre HTML alebo JavaScript súbory sú automaticky načítané, keď súbor uložíte.<br /><br />(Túto správu uvidíte iba jeden krát.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Pre viac informácií pozrite <a class=\"clickable-link\" data-href=\"{0}\">Riešenie chýb pri pripojení do živého náhľadu</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Živý náhľad",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Živý náhľad: Pripájanie\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Živý náhľad: Inicializácia\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Odpojenie živého náhľadu",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Živý náhľad: Kliknite pre odpojenie (Uložte súbor)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Live Preview was cancelled because the browser's developer tools were opened",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Live Preview was cancelled because the page was closed in the browser",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Live Preview was cancelled because the browser navigated to a page that is not part of the current project",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Live Preview was cancelled for an unknown reason ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Save Changes",
    "SAVE_CLOSE_MESSAGE"                : "Do you want to save the changes you made in the document <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Do you want to save your changes to the following files?",
    "EXT_MODIFIED_TITLE"                : "External Changes",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Confirm Delete",
    "CONFIRM_FOLDER_DELETE"             : "Are you sure you want to delete the folder <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "File Deleted",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> has been modified on disk, but also has unsaved changes in {APP_NAME}.<br /><br />Which version do you want to keep?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> has been deleted on disk, but has unsaved changes in {APP_NAME}.<br /><br />Do you want to keep your changes?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Use /re/ syntax for regexp search",
    "FIND_RESULT_COUNT"                 : "{0} results",
    "WITH"                              : "With",
    "BUTTON_YES"                        : "Yes",
    "BUTTON_NO"                         : "No",
    "BUTTON_ALL"                        : "All",
    "BUTTON_STOP"                       : "Stop",
    "BUTTON_REPLACE"                    : "Replace",

    "OPEN_FILE"                         : "Open File",
    "SAVE_FILE_AS"                      : "Save File",
    "CHOOSE_FOLDER"                     : "Choose a folder",

    "RELEASE_NOTES"                     : "Release Notes",
    "NO_UPDATE_TITLE"                   : "You're up to date!",
    "NO_UPDATE_MESSAGE"                 : "You are running the latest version of {APP_NAME}.",

    "FIND_REPLACE_TITLE"                : "Replace \"{0}\" with \"{1}\" &mdash; {3} {2} matches",

    "FIND_IN_FILES_TITLE"               : "\"{4}\" found {5} &mdash; {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "in project",
    "FIND_IN_FILES_FILE"                : "file",
    "FIND_IN_FILES_FILES"               : "files",
    "FIND_IN_FILES_MATCH"               : "match",
    "FIND_IN_FILES_MATCHES"             : "matches",
    "FIND_IN_FILES_MORE_THAN"           : "Over ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_LESS"                : " <a href='#' class='find-less'>Less</a>",
    "FIND_IN_FILES_MORE"                : " <a href='#' class='find-more'>More</a>",
    "FIND_IN_FILES_FILE_PATH"           : "File: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "line: {0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Error getting update info",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "There was a problem getting the latest update information from the server. Please make sure you are connected to the internet and try again.",

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
    "STATUSBAR_CURSOR_POSITION"             : "Line {0}, Column {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Selected {0} column",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Selected {0} columns",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Selected {0} line",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Selected {0} lines",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Click to switch indentation to spaces",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Click to switch indentation to tabs",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Click to change number of spaces used when indenting",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Click to change tab character width",
    "STATUSBAR_SPACES"                      : "Spaces",
    "STATUSBAR_TAB_SIZE"                    : "Tab Size",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Line",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Lines",

    /**
     * Command Name Constants
     */

    // Príkazy v menu Súbor
    "FILE_MENU"                           : "Súbor",
    "CMD_FILE_NEW_UNTITLED"               : "Nový",
    "CMD_FILE_NEW"                        : "Nový súbor",
    "CMD_FILE_NEW_FOLDER"                 : "Nový adresár",
    "CMD_FILE_OPEN"                       : "Otvoriť\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Pridať do pracovnej sady",
    "CMD_OPEN_FOLDER"                     : "Otvoriť adresár\u2026",
    "CMD_FILE_CLOSE"                      : "Zatvoriť",
    "CMD_FILE_CLOSE_ALL"                  : "Zatvoriť všetko",
    "CMD_FILE_SAVE"                       : "Uložiť",
    "CMD_FILE_SAVE_ALL"                   : "Uložiť všetko",
    "CMD_FILE_SAVE_AS"                    : "Uložiť ako\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Živý náhľad",
    "CMD_LIVE_HIGHLIGHT"                  : "Zvýraznenie živého náhľadu",
    "CMD_PROJECT_SETTINGS"                : "Nastavenia projektu\u2026",
    "CMD_FILE_RENAME"                     : "Premenovať",
    "CMD_FILE_DELETE"                     : "Zmazať",
    "CMD_INSTALL_EXTENSION"               : "Inštalovať rozšírenia\u2026",
    "CMD_EXTENSION_MANAGER"               : "Správca rozšírení\u2026",
    "CMD_FILE_REFRESH"                    : "Obnoviť strom súborov",
    "CMD_QUIT"                            : "Koniec",
    // Použité v natívnom menu Súborov na Windows 
    "CMD_EXIT"                            : "Koniec",

    // Edit menu commands
    "EDIT_MENU"                           : "Upraviť",
    "CMD_UNDO"                            : "Späť",
    "CMD_REDO"                            : "Znovu",
    "CMD_CUT"                             : "Vystrihnúť",
    "CMD_COPY"                            : "Kopírovať",
    "CMD_PASTE"                           : "Vložiť",
    "CMD_SELECT_ALL"                      : "Vybrať všetko",
    "CMD_SELECT_LINE"                     : "Vybrať riadok",
    "CMD_FIND"                            : "Vyhľadať",
    "CMD_FIND_IN_FILES"                   : "Vyhľadať v súboroch",
    "CMD_FIND_IN_SUBTREE"                 : "Vyhľadať v\u2026",
    "CMD_FIND_NEXT"                       : "Vyhľadať nasledujúci",
    "CMD_FIND_PREVIOUS"                   : "Vyhľadať predchádzajúci",
    "CMD_REPLACE"                         : "Nahradiť",
    "CMD_INDENT"                          : "Odsadiť",
    "CMD_UNINDENT"                        : "Vrátiť odsadenie",
    "CMD_DUPLICATE"                       : "Duplikovať",
    "CMD_DELETE_LINES"                    : "Zmazať riadok",
    "CMD_COMMENT"                         : "Riadkový komentár",
    "CMD_BLOCK_COMMENT"                   : "Blokový komentár",
    "CMD_LINE_UP"                         : "Posunúť riadok hore",
    "CMD_LINE_DOWN"                       : "Posunúť riadok dole",
    "CMD_OPEN_LINE_ABOVE"                 : "O riadok vyššie",
    "CMD_OPEN_LINE_BELOW"                 : "O riadok nižšie",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Uzatvárať zátvorky",
    "CMD_SHOW_CODE_HINTS"                 : "Zobraziť tipy",
    
    // View menu commands
    "VIEW_MENU"                           : "View",
    "CMD_HIDE_SIDEBAR"                    : "Hide Sidebar",
    "CMD_SHOW_SIDEBAR"                    : "Show Sidebar",
    "CMD_INCREASE_FONT_SIZE"              : "Increase Font Size",
    "CMD_DECREASE_FONT_SIZE"              : "Decrease Font Size",
    "CMD_RESTORE_FONT_SIZE"               : "Restore Font Size",
    "CMD_SCROLL_LINE_UP"                  : "Scroll Line Up",
    "CMD_SCROLL_LINE_DOWN"                : "Scroll Line Down",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Line Numbers",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Highlight Active Line",
    "CMD_TOGGLE_WORD_WRAP"                : "Word Wrap",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Sort by Added",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Sort by Name",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Sort by Type",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatic Sort",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigate",
    "CMD_QUICK_OPEN"                      : "Quick Open",
    "CMD_GOTO_LINE"                       : "Go to Line",
    "CMD_GOTO_DEFINITION"                 : "Quick Find Definition",
    "CMD_TOGGLE_QUICK_EDIT"               : "Quick Edit",
    "CMD_TOGGLE_QUICK_DOCS"               : "Quick Docs",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Previous Match",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Next Match",
    "CMD_NEXT_DOC"                        : "Next Document",
    "CMD_PREV_DOC"                        : "Previous Document",
    "CMD_SHOW_IN_TREE"                    : "Show in File Tree",
    "CMD_SHOW_IN_OS"                      : "Show in OS",
    
    // Help menu commands
    "HELP_MENU"                           : "Help",
    "CMD_CHECK_FOR_UPDATE"                : "Check for Updates",
    "CMD_HOW_TO_USE_BRACKETS"             : "How to Use {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} Forum",
    "CMD_RELEASE_NOTES"                   : "Release Notes",
    "CMD_REPORT_AN_ISSUE"                 : "Report an Issue",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Show Extensions Folder",
    "CMD_TWITTER"                         : "{TWITTER_NAME} on Twitter",
    "CMD_ABOUT"                           : "About {APP_TITLE}",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Close Window",
    "CMD_ABORT_QUIT"                      : "Abort Quit",
    "CMD_BEFORE_MENUPOPUP"                : "Before Menu Popup",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimental build",
    "DEVELOPMENT_BUILD"                    : "development build",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Don't Save",
    "SAVE"                                 : "Save",
    "CANCEL"                               : "Cancel",
    "DELETE"                               : "Delete",
    "RELOAD_FROM_DISK"                     : "Reload from Disk",
    "KEEP_CHANGES_IN_EDITOR"               : "Keep Changes in Editor",
    "CLOSE_DONT_SAVE"                      : "Close (Don't Save)",
    "RELAUNCH_CHROME"                      : "Relaunch Chrome",
    "ABOUT"                                : "About",
    "CLOSE"                                : "Close",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Notices, terms and conditions pertaining to third party software are located at <a class=\"clickable-link\" data-href=\"{ADOBE_THIRD_PARTY}\">{ADOBE_THIRD_PARTY}</a> and incorporated by reference herein.",
    "ABOUT_TEXT_LINE4"                     : "Documentation and source at <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Made with \u2764 and JavaScript by:",
    "ABOUT_TEXT_LINE6"                     : "Lots of people (but we're having trouble loading that data right now).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs and the Web Platform graphical logo are licensed under a Creative Commons Attribution license, <a class=\"clickable-link\" data-href=\"{WEB_PLATFORM_DOCS_LICENSE}\">CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "There's a new build of {APP_NAME} available! Click here for details.",
    "UPDATE_AVAILABLE_TITLE"               : "Update Available",
    "UPDATE_MESSAGE"                       : "Hey, there's a new build of {APP_NAME} available. Here are some of the new features:",
    "GET_IT_NOW"                           : "Get it now!",
    "PROJECT_SETTINGS_TITLE"               : "Project Settings for: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Live Preview Base URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "To use a local server, enter a url like http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "The {0} protocol isn't supported by Live Preview&mdash;please use http: or https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "The base URL can't contain search parameters like \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "The base URL can't contain hashes like \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Special characters like '{0}' must be %-encoded.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Unknown error parsing Base URL",
    
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

    "UNIT_PIXELS"                          : "pixels",
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "CMD_SHOW_DEV_TOOLS"                        : "Show Developer Tools",
    "CMD_REFRESH_WINDOW"                        : "Reload {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "New {APP_NAME} Window",
    "CMD_SWITCH_LANGUAGE"                       : "Switch Language",
    "CMD_RUN_UNIT_TESTS"                        : "Run Tests",
    "CMD_SHOW_PERF_DATA"                        : "Show Performance Data",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Enable Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Log Node State to Console",
    "CMD_RESTART_NODE"                          : "Restart Node",
    
    "LANGUAGE_TITLE"                            : "Switch Language",
    "LANGUAGE_MESSAGE"                          : "Language:",
    "LANGUAGE_SUBMIT"                           : "Reload {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Cancel",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "System Default",
    
    /**
     * Jazyky
     */
    "LOCALE_CS"                                 : "Český",
    "LOCALE_DE"                                 : "Nemecký",
    "LOCALE_EN"                                 : "Anglický",
    "LOCALE_ES"                                 : "Španielsky",
    "LOCALE_FI"                                 : "Fínsky",
    "LOCALE_FR"                                 : "Francúzky",
    "LOCALE_IT"                                 : "Talianský",
    "LOCALE_JA"                                 : "Japonský",
    "LOCALE_NB"                                 : "Nórsky",
    "LOCALE_PL"                                 : "Poľský",
    "LOCALE_PT_BR"                              : "Portugalský, Brazília",
    "LOCALE_PT_PT"                              : "Portugalský",
    "LOCALE_RU"                                 : "Ruský",
    "LOCALE_SV"                                 : "Švédsky",
    "LOCALE_TR"                                 : "Turecký",
    "LOCALE_ZH_CN"                              : "Čínsky, zjednodušený",
    "LOCALE_HU"                                 : "Maďarský",
    "LOCALE_SK"                                 : "Slovenský",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Current Color",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Original Color",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa Format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex Format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa Format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Used {1} time)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Used {1} times)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Jump to Definition",
    "CMD_SHOW_PARAMETER_HINT"                   : "Show Parameter Hint",
    "NO_ARGUMENTS"                              : "<no parameters>",

    // extensions/default/JSLint
    "CMD_JSLINT"                                : "Enable JSLint",
    "CMD_JSLINT_FIRST_ERROR"                    : "Go to First JSLint Error",
    "JSLINT_ERRORS"                             : "JSLint Errors",
    "JSLINT_ERROR_INFORMATION"                  : "1 JSLint Error",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} JSLint Errors",
    "JSLINT_NO_ERRORS"                          : "No JSLint errors - good job!",
    "JSLINT_DISABLED"                           : "JSLint disabled or not working for the current file",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Quick View on Hover",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Read more"
});
