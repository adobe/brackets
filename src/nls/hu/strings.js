/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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
    "ERROR_RELOADING_FILE_TITLE"        : "Hiba történt a változások merevlemezről való újratöltése közben.",
    "ERROR_RELOADING_FILE"              : "Hiba történt a fájl újratöltése közben: <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Hiba történt a fájl mentése közben",
    "ERROR_SAVING_FILE"                 : "Hiba történt a fájl mentése közben: <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Hiba történt a fájl átnevezése közben",
    "ERROR_RENAMING_FILE"               : "Hiba történt a fájl átnevezése közben: <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Hiba történt a fájl törlése közben",
    "ERROR_DELETING_FILE"               : "Hiba történt a fájl törlése közben: <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Helytelen fájlnév",
    "INVALID_FILENAME_MESSAGE"          : "A fájl neve nem tartalmazhatja a következő karaktereket: {0} és foglalt rendszer neveket.",
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
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Üdv az Élő Előnézetben!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Az Élő Előnézet összeköti a {APP_NAME}-et a böngésződdel. Megnyitja a HTML fájl előnézetét a Böngészőben, majd rögtön frissül amikor szerkeszted a kódodat.<br /><br />Ebben a kezdetleges {APP_NAME} verzióban, az Élő Előnézet csak a <strong>Google Chrome</strong>-ban működik és élőben változik<strong>CSS fájlok</strong> szerkesztésekor. A HTML vagy JavaScript változások automatikusan frissülnek mentéskor.<br /><br />(Ezt az üzenetet csak egyszer fogod látni.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "További információért lásd: <a href='{0}' title='{0}'>Élő Előnézet csatlakozási hibák kiküszöbölése</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Élő Előnézet",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Élő Előnézet: Csatlakozás\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Élő Előnézet: Inicializálás\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Élő Előnézet lecsatlakozása",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Élő Előnézet: Kattints a lecsatlakozáshoz (Mentsd el a fájlt a frissítéshez)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Az Élő Előnézet lecsatlakozott mert a bongésző fejlesztő eszközei meg lettek nyitva",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Az Élő Előnézet lecsatlakozott mert az oldal be lett zárva a böngészőben",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Az Élő Előnézet lecsatlakozott mert a böngésző olyan oldalra lépett amely nem része a jelenlegi projektnek",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Az Élő Előnézet lecsatlakozott ismeretlen ok miatt ({0})",

    "SAVE_CLOSE_TITLE"                  : "Változtatások mentése",
    "SAVE_CLOSE_MESSAGE"                : "El szeretnéd menteni a változtatásokat itt: <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "El szeretnéd menteni a változtatásokat a következő fájlokban?",
    "EXT_MODIFIED_TITLE"                : "Külső Változtatások",
    "FILE_DELETED_TITLE"                : "Fájl törölve",
    "EXT_MODIFIED_MESSAGE"              : "A/az <span class='dialog-filename'>{0}</span> meg lett változtatva a lemezen, de tartalmaz nem mentet változtatásokat is a {APP_NAME}-ben.<br /><br />Melyik verziót szeretnéd megtartani?",
    "EXT_DELETED_MESSAGE"               : "A/az <span class='dialog-filename'>{0}</span> törölve lett a lemezen, de tartalmaz nem mentet változtatásokat is a {APP_NAME}-ben.<br /><br />Meg szeretnéd tartani a változtatásokat?",

    // Find, Replace, Find in Files
    "BUTTON_YES"                        : "Igen",
    "BUTTON_NO"                         : "Nem",

    "OPEN_FILE"                         : "Fájl megnyitása",
    "SAVE_FILE_AS"                      : "Fájl mentése",
    "CHOOSE_FOLDER"                     : "Válassz mappát",

    "RELEASE_NOTES"                     : "Kiadási megjegyzések",
    "NO_UPDATE_TITLE"                   : "A legfrissebb verziót használod!",
    "NO_UPDATE_MESSAGE"                 : "A legfrissebb {APP_NAME} fut.",

    "FIND_IN_FILES_SCOPED"              : "a <span class='dialog-filename'>{0}</span>-ban",
    "FIND_IN_FILES_NO_SCOPE"            : "a projektben",
    "FIND_IN_FILES_FILE"                : "fájl",
    "FIND_IN_FILES_FILES"               : "fájlok",
    "FIND_IN_FILES_MATCH"               : "találat",
    "FIND_IN_FILES_MATCHES"             : "találatok",
    "FIND_IN_FILES_MORE_THAN"           : "Több mint ",
    "FIND_IN_FILES_FILE_PATH"           : "Fájl: <span class='dialog-filename'>{0}</span>",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Hiba a frissítési infó lekérdezése közben",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Hiba történt a legfrissebb frissítési infó lekérdezése közben. Győződj meg arról hogy van internet kapcsolatod, majd próbáld meg újra.",

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
    "CMD_OPEN_FOLDER"                     : "Mappa Megnyitása\u2026",
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
    "CMD_FILE_REFRESH"                    : "Újratöltés",
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
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Rendezés Hozzáadás Szerint",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Rendezés Név Szerint",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Rendezés Típus Szerint",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Automatikus Rendezés",

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
    "CMD_RELEASE_NOTES"                   : "Kiadási megjegyzések",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Bővítmények mappa megjelenítése",
    "CMD_TWITTER"                         : "{TWITTER_NAME} a Twitter-en",
    "CMD_ABOUT"                           : "A {APP_TITLE}-ről",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "kísérleti verzió",
    "DEVELOPMENT_BUILD"                    : "fejlesztési verzió",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Ne Mentse",
    "SAVE"                                 : "Mentés",
    "CANCEL"                               : "Mégse",
    "RELOAD_FROM_DISK"                     : "Újratöltés a lemezről",
    "KEEP_CHANGES_IN_EDITOR"               : "Változtatások megtartása a szerkesztőben",
    "CLOSE_DONT_SAVE"                      : "Bezárás (Ne Mentse)",
    "RELAUNCH_CHROME"                      : "Chrome Újraindítása",
    "ABOUT"                                : "Rólunk",
    "CLOSE"                                : "Bezárás",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Harmadik féltől származó szoftverekre vonatkozó közlemények, felhasználási feltételek megtalálhatók a következő linken <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a>.",
    "ABOUT_TEXT_LINE4"                     : "Documentation and source at <a 'https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Készítve \u2764 és JavaScript-el a következők által:",
    "ABOUT_TEXT_LINE6"                     : "Sok ember (de ezt az adatot nem tudjuk megjeleníteni jelenleg).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "A Web Platform Dokumentáció és a  Web Platform grafikai logó a Creative Commons Attribution license alatt vannak licencelve, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
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
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Ismeretlen hiba az alap URL beolvasásakor",

    // Extension Management strings
    "INSTALL"                              : "Telepítés",
    "REMOVE"                               : "Eltávolítás",
    "OVERWRITE"                            : "Felülírás",
    "CANT_REMOVE_DEV"                      : "Bővítmények a \"dev\" mappában csak manuálisan távolíthatóak el.",
    "INSTALL_EXTENSION_TITLE"              : "Bővítmény telepítése",
    "INSTALL_EXTENSION_LABEL"              : "Bővítmény URL",
    "INSTALL_EXTENSION_HINT"               : "A Bővítmény GitHub repo-jának ZIP URL-je",
    "INSTALLING_FROM"                      : "Bővítmény telepítése: {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Sikeres telepítés!",
    "INSTALL_FAILED"                       : "Sikertelen telepítés.",
    "CANCELING_INSTALL"                    : "Telepítés lemondása\u2026",
    "CANCELING_HUNG"                       : "A Telepítés lemondása sokáig tart. Lehetséges hogy belső hiba történt.",
    "INSTALL_CANCELED"                     : "Telepítés lemondva.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "A letöltött tartalom nem érvényes ZIP fájl.",
    "INVALID_PACKAGE_JSON"                 : "A package.json fájl nem érvényes (hiba: {0}).",
    "MISSING_PACKAGE_NAME"                 : "A package.json fájl nem határoz meg csomagnevet.",
    "BAD_PACKAGE_NAME"                     : "A {0} nem érvényes csomagnév.",
    "MISSING_PACKAGE_VERSION"              : "A package.json fájl nem határoz meg csomagverziót.",
    "INVALID_VERSION_NUMBER"               : "A csomagverzió ({0}) nem érvényes.",
    "INVALID_BRACKETS_VERSION"             : "A {APP_NAME} kompatibilitási sor ({0}) nem érvényes.",
    "DISALLOWED_WORDS"                     : "A ({1}) szavak nem engedélyezettek a {0} mezőben.",
    "API_NOT_COMPATIBLE"                   : "A Bővítmény nem kompatibilis a jelenlegi {APP_NAME} verzióval. A letiltott bővítmények közé lett telepítve.",
    "MISSING_MAIN"                         : "A csomag nem tartalmaz main.js fájlt.",
    "EXTENSION_ALREADY_INSTALLED"          : "A csomag telepítésével felülíródik egy előzőleg telepített bővítmény. Folytatod?",
    "EXTENSION_SAME_VERSION"               : "A csomag verziója megegyezik a jelenleg telepítettével. Felülírod?",
    "EXTENSION_OLDER_VERSION"              : "A csomag verziója {0} ami régebbi mint a jelenlegi ({1}). Felülírod a jelenlegit?",
    "DOWNLOAD_ID_IN_USE"                   : "Belső hiba: letöltő ID már használatban van.",
    "NO_SERVER_RESPONSE"                   : "Nem lehet csatlakozni a szerverhez.",
    "BAD_HTTP_STATUS"                      : "A fájl nem található a szerveren (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Nem lehet ideiglenes fájlba menteni a letöltést.",
    "ERROR_LOADING"                        : "A bővítmény hibába ütközött indításkor.",
    "MALFORMED_URL"                        : "Az URL helytelen. Nézd meg hogy jól írtad be.",
    "UNSUPPORTED_PROTOCOL"                 : "Az URL muszáj http vagy https URL legyen.",
    "UNKNOWN_ERROR"                        : "Ismeretlen belső hiba.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Bővítménykezelő",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Nem lehet elérni a bővítmény adatbázist. Kérlek próbáld meg később.",
    "INSTALL_FROM_URL"                     : "Telepítés URL-ről\u2026",
    "EXTENSION_AUTHOR"                     : "Szerző",
    "EXTENSION_DATE"                       : "Dátum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Ez a bővítmény csak a {APP_NAME} újabb verziójához jó.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Ez a bővítmény csak a {APP_NAME} régebbi verziójához jó",
    "EXTENSION_NO_DESCRIPTION"             : "Nincs leírás",
    "EXTENSION_MORE_INFO"                  : "További infó...",
    "EXTENSION_ERROR"                      : "Bővítmény hiba",
    "EXTENSION_KEYWORDS"                   : "Kulcsszavak",
    "EXTENSION_INSTALLED"                  : "Telepítve",
    "EXTENSION_UPDATE_INSTALLED"           : "A bővítményfrissítés letöltve és telepítve lessz amikor kilépsz a {APP_NAME}-ből.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Keresés",
    "EXTENSION_MORE_INFO_LINK"             : "Több",
    "BROWSE_EXTENSIONS"                    : "Bővítmények tallózása",
    "EXTENSION_MANAGER_REMOVE"             : "Bővítmény Eltávolítása",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Nem lehet eltávolítani egy vagy több bővítményt: {0}. A {APP_NAME} ki fog lépni.",
    "EXTENSION_MANAGER_UPDATE"             : "Bővítmény frissítése",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Nem lehet frissíteni egy vagy több bővítményt: {0}. A {APP_NAME} ki fog lépni.",
    "MARKED_FOR_REMOVAL"                   : "Eltávolításhoz megjelölve",
    "UNDO_REMOVE"                          : "Mégsem",
    "MARKED_FOR_UPDATE"                    : "Frissítéshez megjelölve",
    "UNDO_UPDATE"                          : "Mégsem",
    "EXTENSION_NOT_INSTALLED"              : "A {0} bővítményt nem lehet eltávolítani, mert nincs telepítve.",
    "NO_EXTENSIONS"                        : "Nincs még telepített bővítmény.<br>Kattints a Telepítés URL-ről gombra a kezdéshez.",
    "NO_EXTENSION_MATCHES"                 : "Nincs bővítmény a keresett szavakra.",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixelek",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Hibakeresés",
    "CMD_SHOW_DEV_TOOLS"                        : "Fejlesztői Eszközök megjelenítése",
    "CMD_REFRESH_WINDOW"                        : "A {APP_NAME} újratöltése",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Új {APP_NAME} Ablak",
    "CMD_SWITCH_LANGUAGE"                       : "Nyelv változtatása",
    "CMD_RUN_UNIT_TESTS"                        : "Tesztek Futtatása",
    "CMD_SHOW_PERF_DATA"                        : "Teljesítmény adatok megjelenítése",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Node Hibakereső engedélyezése",
    "CMD_LOG_NODE_STATE"                        : "Node naplózása a konzolban",
    "CMD_RESTART_NODE"                          : "Node újraindítása",

    "LANGUAGE_TITLE"                            : "Nyelv változtatása",
    "LANGUAGE_MESSAGE"                          : "Nyelv:",
    "LANGUAGE_SUBMIT"                           : "{APP_NAME} újratöltése",
    "LANGUAGE_CANCEL"                           : "Mégsem",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Rendszer Alapértelmezett",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Jelenlegi szín",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Eredeti szín",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa Formátum",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex Formátum",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa Formátum",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} ({1}-szer használva)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} ({1}-szer használva)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Ugrás a Definícióhoz",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Gyors Nézet rámutatáskor",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Olvasd tovább"
});
