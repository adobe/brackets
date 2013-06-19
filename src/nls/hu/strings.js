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
    "GENERIC_ERROR"                     : "(hiba {0})",
    "NOT_FOUND_ERR"                     : "A fájl nem található.",
    "NOT_READABLE_ERR"                  : "A fájl nem olvasható.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "A célkönyvtárat nem lehet módosítani.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Nincs engedélyed a módosításhoz.",
    "FILE_EXISTS_ERR"                   : "A fájl vagy a könyvtár már létezik.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Hiba a projekt betöltése közben",
    "OPEN_DIALOG_ERROR"                 : "Hiba történt a \"fájl megnyitása\" ablak megjelenítésekor. (hiba {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Hiba történt a <span class='dialog-filename'>{0}</span> könyvtár megnyitása közben. (hiba {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Hiba történt a könyvtár tartalmának beolvasása közben. <span class='dialog-filename'>{0}</span>. (hiba {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Hiba történt a fájl megnyitása közben.",
    "ERROR_OPENING_FILE"                : "Hiba történt a fájl megnyitása közben: <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Hiba történt a változások merevlemezről való ujratöltése közben.",
    "ERROR_RELOADING_FILE"              : "Hiba történt a fájl ujratöltése közben: <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Hiba történt a fájl mentése közben",
    "ERROR_SAVING_FILE"                 : "Hiba történt a fájl mentése közben: <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Hiba történt a fájl átnevezése közben",
    "ERROR_RENAMING_FILE"               : "Hiba történt a fájl átnevezése közben: <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Hiba történt a fájl törlése közben",
    "ERROR_DELETING_FILE"               : "Hiba történt a fájl törlése közben: <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Helytelen fájlnév",
    "INVALID_FILENAME_MESSAGE"          : "A fájl neve nem tartalmazhatja a következő karaktereket: /?*:;{}<>\\| és foglalt rendszer neveket.",
    "FILE_ALREADY_EXISTS"               : "A fájl <span class='dialog-filename'>{0}</span> már létezik.",
    "ERROR_CREATING_FILE_TITLE"         : "Hiba történt a fájl létrehozása közben.",
    "ERROR_CREATING_FILE"               : "Hiba történt a fájl létrehozása közben: <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! A {APP_NAME} még nem fut böngészőben.",
    "ERROR_IN_BROWSER"                  : "A {APP_NAME} HTML-ben épült, de jelenleg asztali alkalmazásként fut, ezért helyi fájlokat is tudsz vele szerkeszteni. Kérlek használd az alkalmazás \"burkot\" a {APP_NAME} futtatásához: <b>github.com/adobe/brackets-shell</b>.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Hiba a fájlok Indexszelése közben",
    "ERROR_MAX_FILES"                   : "A maximális fájlszám indexelésre került. Folyamatok amelyek a fájlokat az indexben keresik esélyes hogy nem fognak rendesen működni.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Hiba a böngésző megnyitása közben",
    "ERROR_CANT_FIND_CHROME"            : "A Google Chrome böngésző nem található. Bizonyosodj meg hogy telepítve van.",
    "ERROR_LAUNCHING_BROWSER"           : "Hiba a böngésző megnyitása közben: (hiba {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Élő Előnézet hiba",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Csatlakozás a Böngészőhöz",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Az Élő Előnézet használatához muszály újraindítani a Chrome-ot a megfelelő beállításokkal.<br /><br />Szeretnéd most újraindítani a Chrome-ot ezekkel a beállításokkal?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Nem lehet betölteni az Élő Fejlesztő oldalt",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Nyiss meg egy HTML fájlt az Élő Előnézet indításához.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Az Élő Előnézet használatához szerver-oldali fájlokkal meg kell adni az alap URL-t a projekthez.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Hiba a HTTP szerver indításakor az Élő Fejlesztéshez. Kérlek próbáld újra később.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Üdv az Élő Előnézet-ben!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Az Élő Előnézet összeköti a {APP_NAME}-et a böngésződdel. Megnyitja a HTML fájl előnézetét a Böngészőben, majd rögtön frissül amikor szerkeszted a kódodat.<br /><br />Ebben a kezdetleges {APP_NAME} verzióban, az Élő Előnézet csak a <strong>Google Chrome</strong>-ban működik és élőben változik<strong>CSS fájlok</strong> szerkesztésekor. A HTML vagy JavaScript változások automatikusan frissülnek mentéskor.<br /><br />(Ezt az üzenetet csak egyszer fogod látni.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "További információért lásd: <a class=\"clickable-link\" data-href=\"{0}\">Élő Előnézet csatlakozási hibák kiküszöbölése</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Élő Előnézet",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Élő Előnézet: Csatlakozás\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Élő Előnézet: Inicializálás\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Élő Előnézet lecsatlakozása",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Élő Előnézet: Kattints a lecsatlakozáshoz (Mentsd el a fájlt a frissítéshez)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Az Élő Előnézet lecsatlakozott mert a bongésző fejlesztő eszközei meg lettek nyitva",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Az Élő Előnézet lecsatlakozott mert az oldal be lett zárva a böngészőben",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Az Élő Előnézet lecsatlakozott mert a böngésző olyan oldalra lépett amely nem része a jelenlegi projeknek",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Az Élő Előnézet lecsatlakozott ismeretlen ok miatt ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Változtatások mentése",
    "SAVE_CLOSE_MESSAGE"                : "El szeretnéd menteni a változtatásokat itt: <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "El szeretnéd menteni a változtatásokat a következő fájlokban?",
    "EXT_MODIFIED_TITLE"                : "Külső Változtatások",
    "FILE_DELETED_TITLE"                : "Fájl törölve",
    "EXT_MODIFIED_MESSAGE"              : "A/az <span class='dialog-filename'>{0}</span> meg lett változtatva a lemezen, de tartalmaz nem mentet változtatásokat is a {APP_NAME}-ben.<br /><br />Melyik verziót szeretnéd megtartani?",
    "EXT_DELETED_MESSAGE"               : "A/az <span class='dialog-filename'>{0}</span> törölve lett a lemezen, de tartalmaz nem mentet változtatásokat is a {APP_NAME}-ben.<br /><br />Meg szeretnéd tartani a változtatásokat?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Használd a  /re/ szintaxis-t a regexp kereséshez",
    "FIND_RESULT_COUNT"                 : "{0} találat",
    "WITH"                              : "",
    "BUTTON_YES"                        : "Igen",
    "BUTTON_NO"                         : "Neb",
    "BUTTON_STOP"                       : "Leállítás",

    "OPEN_FILE"                         : "Fájl megnyitása",
    "SAVE_FILE_AS"                      : "Fájl mentése",
    "CHOOSE_FOLDER"                     : "Válassz mappát",

    "RELEASE_NOTES"                     : "Kiadási megjegyzések",
    "NO_UPDATE_TITLE"                   : "A legfrisseb verziót használod!",
    "NO_UPDATE_MESSAGE"                 : "A legfrisseb {APP_NAME} fut.",
    
    "FIND_IN_FILES_TITLE"               : "a \"{4}\" {5} - {0} {1} a {2} {3}-ban",
    "FIND_IN_FILES_SCOPED"              : "a <span class='dialog-filename'>{0}</span>-ban",
    "FIND_IN_FILES_NO_SCOPE"            : "a projektben",
    "FIND_IN_FILES_FILE"                : "fájl",
    "FIND_IN_FILES_FILES"               : "fájlok",
    "FIND_IN_FILES_MATCH"               : "találat",
    "FIND_IN_FILES_MATCHES"             : "találatok",
    "FIND_IN_FILES_MORE_THAN"           : "Több mint ",
    "FIND_IN_FILES_MAX"                 : " (az első {0} találat megjelenítése)",
    "FIND_IN_FILES_FILE_PATH"           : "Fájl: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "sor:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Hiba a frissítési infó lekérdezése közben",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Hiba történt a legfrisseb frissítési infó lekérdezése közben. Győződj meg arról hogy van internet kapcsolatod, majd próbáld meg újra.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Betöltés\u2026",
    "UNTITLED"          : "Névtelen",
    "WORKING_FILES"     : "Munka fájlok",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Szóköz",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Sor {0}, Oszlop {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Kattints hogy átváltsd a behúzást space-re",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Kattints hogy átváltsd a behúzást tabokra",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Kattints hogy átváltsd a behúzás space-ek számát",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Kattints hogy átváltsd a tab szélességét",
    "STATUSBAR_SPACES"                      : "Szóközök",
    "STATUSBAR_TAB_SIZE"                    : "Tab Mérete",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Sor",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Sor",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Fájl",
    "CMD_FILE_NEW"                        : "Új Fájl",
    "CMD_FILE_NEW_FOLDER"                 : "Új Mappa",
    "CMD_FILE_OPEN"                       : "Megnyitás\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Hozzáadás a Munkakészlethez",
    "CMD_OPEN_FOLDER"                     : "Mappa Megynitása\u2026",
    "CMD_FILE_CLOSE"                      : "Bezárás",
    "CMD_FILE_CLOSE_ALL"                  : "Összes Bezárása",
    "CMD_FILE_SAVE"                       : "Mentés",
    "CMD_FILE_SAVE_ALL"                   : "Összes Mentése",
    "CMD_FILE_SAVE_AS"                    : "Mentés másként\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Élő Előnézet",
    "CMD_LIVE_HIGHLIGHT"                  : "Élő Kijelölés",
    "CMD_PROJECT_SETTINGS"                : "Projekt Beállítások\u2026",
    "CMD_FILE_RENAME"                     : "Átnevez",
    "CMD_FILE_DELETE"                     : "Töröl",
    "CMD_INSTALL_EXTENSION"               : "Bővítmény Telepítése\u2026",
    "CMD_EXTENSION_MANAGER"               : "Bővítménykezelő\u2026",
    "CMD_FILE_REFRESH"                    : "Ujratöltés",
    "CMD_QUIT"                            : "Bezár",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Kilépés",

    // Edit menu commands
    "EDIT_MENU"                           : "Szerkesztés",
    "CMD_UNDO"                            : "Visszavonás",
    "CMD_REDO"                            : "Újra",
    "CMD_CUT"                             : "Kivágás",
    "CMD_COPY"                            : "Másolás",
    "CMD_PASTE"                           : "Beillesztés",
    "CMD_SELECT_ALL"                      : "Összes kijelölése",
    "CMD_SELECT_LINE"                     : "Sor kijelölése",
    "CMD_FIND"                            : "Keres",
    "CMD_FIND_IN_FILES"                   : "Keresés a Fájlokban",
    "CMD_FIND_IN_SUBTREE"                 : "Keresés a\u2026",
    "CMD_FIND_NEXT"                       : "Következő találat",
    "CMD_FIND_PREVIOUS"                   : "Előző találat",
    "CMD_REPLACE"                         : "Csere",
    "CMD_INDENT"                          : "Behúzás",
    "CMD_UNINDENT"                        : "Behúzás visszavonása",
    "CMD_DUPLICATE"                       : "Duplikálás",
    "CMD_DELETE_LINES"                    : "Sor törlése",
    "CMD_COMMENT"                         : "Sor komment bekapcsolása",
    "CMD_BLOCK_COMMENT"                   : "Blokk komment bekapcsolása",
    "CMD_LINE_UP"                         : "Sor Mozgatása Fel",
    "CMD_LINE_DOWN"                       : "Sor Mozgatása le",
    "CMD_OPEN_LINE_ABOVE"                 : "Sor Nyitása Felül",
    "CMD_OPEN_LINE_BELOW"                 : "Sor Nyitása Alul",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Zárójelek Automatikus Bezárása",
    "CMD_SHOW_CODE_HINTS"                 : "Kód Súgó megjelenítése",
    
    // View menu commands
    "VIEW_MENU"                           : "Nézet",
    "CMD_HIDE_SIDEBAR"                    : "Oldalsáv Elrejtése",
    "CMD_SHOW_SIDEBAR"                    : "Oldalsáv Mutatása",
    "CMD_INCREASE_FONT_SIZE"              : "Font Méretének Nagyítása",
    "CMD_DECREASE_FONT_SIZE"              : "Font Méretének Kicsinyítése",
    "CMD_RESTORE_FONT_SIZE"               : "Font Méretének Visszaállítása",
    "CMD_SCROLL_LINE_UP"                  : "Sor Lapozása Felfele",
    "CMD_SCROLL_LINE_DOWN"                : "Sor Lapozása Lefele",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Sorok száma",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Aktív sor megjelölése",
    "CMD_TOGGLE_WORD_WRAP"                : "Sortörés",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Rendezés Hozzáadás Szerint",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Rendezés Név Szerint",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Rendezés Típus Szerint",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatikus Rendezés",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigálás",
    "CMD_QUICK_OPEN"                      : "Gyors megnyitás",
    "CMD_GOTO_LINE"                       : "Ugrás Sorhoz",
    "CMD_GOTO_DEFINITION"                 : "Gyors Definíció keresés",
    "CMD_TOGGLE_QUICK_EDIT"               : "Gyors Szerkesztés",
    "CMD_TOGGLE_QUICK_DOCS"               : "Gyors Dokumentáció",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Előző Találat",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Következő Találat",
    "CMD_NEXT_DOC"                        : "Következő Dokumentum",
    "CMD_PREV_DOC"                        : "Előző Dokumentum",
    "CMD_SHOW_IN_TREE"                    : "Megjelenítés a Fastruktúrában",
    "CMD_SHOW_IN_OS"                      : "Megjelenítés Intézőben",
    
    // Help menu commands
    "HELP_MENU"                           : "Súgó",
    "CMD_CHECK_FOR_UPDATE"                : "Frissítések keresése",
    "CMD_HOW_TO_USE_BRACKETS"             : "{APP_NAME} használata",
    "CMD_FORUM"                           : "{APP_NAME} Fórum",
    "CMD_RELEASE_NOTES"                   : "Kiadási megjegyzések",
    "CMD_REPORT_AN_ISSUE"                 : "Probléma bejelentése",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Bővítmények mappa megjelenítése",
    "CMD_TWITTER"                         : "{TWITTER_NAME} a Twitter-en",
    "CMD_ABOUT"                           : "A {APP_TITLE}-ről",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Ablak bezárása",
    "CMD_ABORT_QUIT"                      : "Kilépés Megakadályozása",
    "CMD_BEFORE_MENUPOPUP"                : "A Felugró Menüablak Elött",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "kísérleti verzió",
    "DEVELOPMENT_BUILD"                    : "fejlesztési verzió",
    "SEARCH_RESULTS"                       : "Keresési Találatok",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Ne Mentse",
    "SAVE"                                 : "Mentés",
    "CANCEL"                               : "Mégse",
    "RELOAD_FROM_DISK"                     : "Ujratöltés a lemezről",
    "KEEP_CHANGES_IN_EDITOR"               : "Változtatások megtartása a szerkesztőben",
    "CLOSE_DONT_SAVE"                      : "Bezárás (Ne Mentse)",
    "RELAUNCH_CHROME"                      : "Chrome Ujraindítása",
    "ABOUT"                                : "Rólunk",
    "CLOSE"                                : "Bezárás",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Harmadik féltől származó szoftverekre vonatkozó közlemények, felhasználási feltételek megtalálhatók a következő linken <a class=\"clickable-link\" data-href=\"{ADOBE_THIRD_PARTY}\">{ADOBE_THIRD_PARTY}</a>.",
    "ABOUT_TEXT_LINE4"                     : "Documentation and source at <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Készítve \u2764 és JavaScript-el a következők által:",
    "ABOUT_TEXT_LINE6"                     : "Sok ember (de ezt az adatot nem tudjuk megjeleníteni jelenleg).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "A Web Platform Dokumentáció és a  Web Platform grafikai logó a Creative Commons Attribution license alatt vannak licenszelve, <a class=\"clickable-link\" data-href=\"{WEB_PLATFORM_DOCS_LICENSE}\">CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Új {APP_NAME} verzió elérhető! Kattints ide a részletekért.",
    "UPDATE_AVAILABLE_TITLE"               : "Új verzió elérhető",
    "UPDATE_MESSAGE"                       : "Hé, új {APP_NAME} verzió elérhető. Íme néhány kulcsfontosságú frissítés:",
    "GET_IT_NOW"                           : "Szerezd meg most!",
    "PROJECT_SETTINGS_TITLE"               : "Projekt Beállítások a következőhöz: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Élő Előnézet alap URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Helyi szerver használatához, írd be a címet pl.: http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "A {0} protokol nem támogatott az Élő Előnézetben&mdash;kérlek használj http:-t vagy https:-t.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Az alap URL nem tartalmazhat paramétereket mint: \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Az alap URL nem tartalmazhat hash-okat mint: \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Speciális karakterek mint: '{0}' muszáj enkódolni %-be.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Ismeretlen hiba az alap URL beolvasásakor",
    
    // Extension Management strings
    "INSTALL"                              : "Telepítés",
    "REMOVE"                               : "Eltávolítás",
    "OVERWRITE"                            : "Felülírás",
    "CANT_REMOVE_DEV"                      : "Extensions in the \"dev\" folder must be manually deleted.",
    "INSTALL_EXTENSION_TITLE"              : "Install Extension",
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
    "NO_EXTENSIONS"                        : "No extensions installed yet.<br>Click the Install from URL button below to get started.",
    "NO_EXTENSION_MATCHES"                 : "No extensions match your search.",
    
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
