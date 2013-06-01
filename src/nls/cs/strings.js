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
    "GENERIC_ERROR"                     : "(chyba {0})",
    "NOT_FOUND_ERR"                     : "Soubor nenalezen.",
    "NOT_READABLE_ERR"                  : "Soubor nelze číst.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Cílová složka nemůže být změněna.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Oprávnění neumožní provádět změny.",
    "FILE_EXISTS_ERR"                   : "Soubor již existuje.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Chyba při otevírání projektu",
    "OPEN_DIALOG_ERROR"                 : "Došlo k chybě při zobrazování dialogu Otevřít soubor. (chyba {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Došlo k chybě při načítání adresáře <span class='dialog-filename'>{0}</span>. (chyba {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Došlo k chybě při načítání obsahu složky <span class='dialog-filename'>{0}</span>. (chyba {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Chyba při otevírání souboru",
    "ERROR_OPENING_FILE"                : "Došlo k chybě při otevírání souboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Chyba při načítání změn z disku",
    "ERROR_RELOADING_FILE"              : "Došlo k chybě při načítání souboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Chyba při ukládání souboru",
    "ERROR_SAVING_FILE"                 : "Došlo k chybě při ukládání souboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Chyba při přejmenování souboru",
    "ERROR_RENAMING_FILE"               : "Došlo k chybě při přejmenování souboru <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Špatné jméno souboru",
    "INVALID_FILENAME_MESSAGE"          : "Jméno souboru nemůže obsahovat znaky: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "Soubor <span class='dialog-filename'>{0}</span> již existuje.",
    "ERROR_CREATING_FILE_TITLE"         : "Chyba při tvorbě souboru",
    "ERROR_CREATING_FILE"               : "Došlo k chybě při vytváření souboru <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ouha! {APP_NAME} ještě neběží v prohlížeči.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} je vytvořen v HTML, ale nyní pracuje jako desktopová aplikace, takže ji můžete použít pro úpravu lokálních souborů. Prosím, použijte shell aplikace v <b>github.com/adobe/brackets-shell</b> repo pro spuštění {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Chyba při indexování souborů",
    "ERROR_MAX_FILES"                   : "Maximální počet souborů byl indexován. Funkce pro vyhledávání v indexovaných souborech nemusí fungovat správně.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Chyba při spouštění prohlížeče",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome prohlížeč nebyl nalezen. Je nainstalován?",
    "ERROR_LAUNCHING_BROWSER"           : "Došlo k chybě při spouštění prohlížeče. (chyba {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Živý náhled - chyba",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Připojování k prohlížeči",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Aby se mohl živý náhled připojit, je třeba restartovat Chrome s povolenou možností vzdálené ladění. <br /><br /> Chcete restartovat Chrome a povolit vzdálené ladění?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Nelze načíst stránku s živým náhledem",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Otevřete HTML soubor pro zobrazení v živém náhledu.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Pro spuštění živého náhledu se server-side souborem, musíte specifikovat URL pro tento projekt.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Chyba při spouštění HTTP serveru pro soubory živého náhledu. Prosím, zkuste to znovu.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Vítejte v živém náhledu!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Živý náhled připojí {APP_NAME} k vašemu prohlížeči. Spustí náhled HTML souboru, který se aktualizuje pokaždé, kdy editujete svůj kód.<br /><br />V této verzi {APP_NAME}, živý náhled funguje pouze v <strong>Google Chrome</strong> a aktualizuje změny v <strong>CSS souborech</strong>. Změny v HTML nebo JavaScript souborech jsou automaticky načteny, když soubor uložíte.<br /><br />(Tato zpráva se zobrazí pouze jednou.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Pro více informací navštivte <a class=\"clickable-link\" data-href=\"{0}\">Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Živý náhled",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Živý náhled: Připojování\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Živý náhled: Spouštění\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Zrušit živý náhled",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Živý náhled: Klikněte pro odpojení (uložte soubor)",
    
    "SAVE_CLOSE_TITLE"                  : "Uložit změny",
    "SAVE_CLOSE_MESSAGE"                : "Chcete uložit změny v souboru <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Chcete uložit změny v následujících souborech?",
    "EXT_MODIFIED_TITLE"                : "Externí změny",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> byl změněn, ale neuložené změny se nachází také v {APP_NAME}.<br /><br /> Kterou verzi chcete zachovat?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> byl smazán z disku, ale změny nebyly uloženy v {APP_NAME}.<br /><br />Chcete uložit změny?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Použijte /re/ syntax pro regexp hledání",
    "FIND_RESULT_COUNT"                 : "{0} výsledků",
    "WITH"                              : "S",
    "BUTTON_YES"                        : "Ano",
    "BUTTON_NO"                         : "Ne",
    "BUTTON_STOP"                       : "Stop",
    
    "OPEN_FILE"                         : "Otevřít soubor",
    "CHOOSE_FOLDER"                     : "Vybrat složku",

    "RELEASE_NOTES"                     : "Poznámky k verzi",
    "NO_UPDATE_TITLE"                   : "Vše je aktuální!",
    "NO_UPDATE_MESSAGE"                 : "Verze {APP_NAME} je aktuální.",
    
    "FIND_IN_FILES_TITLE"               : "pro \"{4}\" {5} - {0} {1} v {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "v <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "v projektu",
    "FIND_IN_FILES_FILE"                : "soubor",
    "FIND_IN_FILES_FILES"               : "soubory",
    "FIND_IN_FILES_MATCH"               : "výsledek",
    "FIND_IN_FILES_MATCHES"             : "výsledky",
    "FIND_IN_FILES_MORE_THAN"           : "Více než ",
    "FIND_IN_FILES_MAX"                 : " (zobrazuji prvních {0} záznamů)",
    "FIND_IN_FILES_FILE_PATH"           : "Soubor: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "řádek:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Chyba při získávání informací o aktualizaci",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Nelze získat aktualizace. Ujistěte se, že máte připojení na internet a zkuste to znovu.",

    /**
     * ProjectManager
     */

    "PROJECT_LOADING" : "Načítání\u2026",
    "UNTITLED" : "Nový",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Řádek {0}, Sloupec {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Přepnout odsazení na mezery",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Přepnout odsazení na tabulátory",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Změnit počet mezer použitých pro odsazení",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Změnit šířku tabulátoru",
    "STATUSBAR_SPACES"                      : "mezery",
    "STATUSBAR_TAB_SIZE"                    : "Velikost tabulátoru",
    "STATUSBAR_LINE_COUNT"                  : "Řádky: {0}",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Soubor",
    "CMD_FILE_NEW"                        : "Nový soubor",
    "CMD_FILE_NEW_FOLDER"                 : "Nová složka",
    "CMD_FILE_OPEN"                       : "Otevřít\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Přidat k pracovní sadě",
    "CMD_OPEN_FOLDER"                     : "Otevřít složku\u2026",
    "CMD_FILE_CLOSE"                      : "Zavřít",
    "CMD_FILE_CLOSE_ALL"                  : "Zavřít vše",
    "CMD_FILE_SAVE"                       : "Uložit",
    "CMD_FILE_SAVE_ALL"                   : "Uložit vše",
    "CMD_LIVE_FILE_PREVIEW"               : "Živý náhled",
    "CMD_LIVE_HIGHLIGHT"                  : "Živé zvýraznění",
    "CMD_PROJECT_SETTINGS"                : "Nastavení projektu\u2026",
    "CMD_FILE_RENAME"                     : "Přejmenovat",
    "CMD_INSTALL_EXTENSION"               : "Instalovat doplňky\u2026",
    "CMD_QUIT"                            : "Konec",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Konec",

    // Edit menu commands
    "EDIT_MENU"                           : "Úpravy",
    "CMD_UNDO"                            : "Zpět",
    "CMD_REDO"                            : "Znovu",
    "CMD_CUT"                             : "Vyjmout",
    "CMD_COPY"                            : "Kopírovat",
    "CMD_PASTE"                           : "Vložit",
    "CMD_SELECT_ALL"                      : "Vybrat vše",
    "CMD_SELECT_LINE"                     : "Vybrat řádek",
    "CMD_FIND"                            : "Najít",
    "CMD_FIND_IN_FILES"                   : "Najít v souborech",
    "CMD_FIND_IN_SUBTREE"                 : "Najít v\u2026",
    "CMD_FIND_NEXT"                       : "Najít další",
    "CMD_FIND_PREVIOUS"                   : "Najít předchozí",
    "CMD_REPLACE"                         : "Nahradit",
    "CMD_INDENT"                          : "Odsadit",
    "CMD_UNINDENT"                        : "Vrátit odsazení",
    "CMD_DUPLICATE"                       : "Duplikovat",
    "CMD_DELETE_LINES"                    : "Smazat řádek",
    "CMD_COMMENT"                         : "Řádkový komentář",
    "CMD_BLOCK_COMMENT"                   : "Blokový komentář",
    "CMD_LINE_UP"                         : "Posunout řádek nahoru",
    "CMD_LINE_DOWN"                       : "Posunout řádek dolů",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Uzavírat závorky",
     
    // View menu commands
    "VIEW_MENU"                           : "Zobrazit",
    "CMD_HIDE_SIDEBAR"                    : "Skrýt boční menu",
    "CMD_SHOW_SIDEBAR"                    : "Zobrazit boční menu",
    "CMD_INCREASE_FONT_SIZE"              : "Zvětšit velikost písma",
    "CMD_DECREASE_FONT_SIZE"              : "Zmenšit velikost písma",
    "CMD_RESTORE_FONT_SIZE"               : "Obnovit velikost písma",
    "CMD_SCROLL_LINE_UP"                  : "Posunout o řádek nahoru",
    "CMD_SCROLL_LINE_DOWN"                : "Posunout o řádek dolů",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Čísla řádků",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Zvýraznit aktivní řádek",
    "CMD_TOGGLE_WORD_WRAP"                : "Zalomit řádky",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Řadit podle data",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Řadit podle jména",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Řadit podle typu",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatické řazení",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigace",
    "CMD_QUICK_OPEN"                      : "Rychle otevřít",
    "CMD_GOTO_LINE"                       : "Přejít na řádek",
    "CMD_GOTO_DEFINITION"                 : "Přejít na funkci",
    "CMD_TOGGLE_QUICK_EDIT"               : "Rychlá úprava",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Předchozí shoda",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Další shoda",
    "CMD_NEXT_DOC"                        : "Další dokument",
    "CMD_PREV_DOC"                        : "Předchozí dokument",
    "CMD_SHOW_IN_TREE"                    : "Zobrazit stromovou strukturu",
    
    // Help menu commands
    "HELP_MENU"                           : "Nápověda",
    "CMD_CHECK_FOR_UPDATE"                : "Zkontrolovat aktualizace",
    "CMD_HOW_TO_USE_BRACKETS"             : "Jak používat {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} fórum",
    "CMD_RELEASE_NOTES"                   : "Poznámky k verzi",
    "CMD_REPORT_AN_ISSUE"                 : "Nahlásit problém",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Zobrazit složku s doplňky",
    "CMD_TWITTER"                         : "{TWITTER_NAME} - Twitter",
    "CMD_ABOUT"                           : "O aplikaci {APP_TITLE}",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Zavřít okno",
    "CMD_ABORT_QUIT"                      : "Zrušit",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimentální verze",
    "DEVELOPMENT_BUILD"                    : "vývojová verze",
    "SEARCH_RESULTS"                       : "Výsledky hledání",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Neukládat",
    "SAVE"                                 : "Uložit",
    "CANCEL"                               : "Zrušit",
    "RELOAD_FROM_DISK"                     : "Načíst z disku",
    "KEEP_CHANGES_IN_EDITOR"               : "Ponechat změny v editoru",
    "CLOSE_DONT_SAVE"                      : "Zavřít (neukládat)",
    "RELAUNCH_CHROME"                      : "Restartovat Chrome",
    "INSTALL"                              : "Install",
    "ABOUT"                                : "O aplikaci",
    "CLOSE"                                : "Zavřít",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Oznámení, podmínky týkající se software třetích stran jsou umístěny na <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> a začleněny prostřednictvím odkazu zde.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentace a zdrojový kód na <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>.",
    "ABOUT_TEXT_LINE5"                     : "Vytvořeno s \u2764 a pomocí JavaScript těmito lidmi:",
    "ABOUT_TEXT_LINE6"                     : "Mnoho lidí (ale momentálně máme problém s načítáním dat).",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Je dostupná nová verze {APP_NAME} ! Klikněte zde pro více informací.",
    "UPDATE_AVAILABLE_TITLE"               : "Dostupná aktualizace",
    "UPDATE_MESSAGE"                       : "Nová verze {APP_NAME} je dostupná. Seznam některých vylepšení:",
    "GET_IT_NOW"                           : "Stáhnout!",
    "PROJECT_SETTINGS_TITLE"               : "Nastavení projektu: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Živý náhled URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(nechte prázdné pro URL souboru)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "{0} protokol není podporován živým náhledem&mdash;prosím, použijte http: nebo https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL nemůže obsahovat výrazy pro hledání jako \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL nemůže obsahovat znaky jako \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Zvláštní znaky jako '{0}' musí být %-enkódovány.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Neznámá chyba při zpracování URL",
    
    // Extension Management strings
    "INSTALL_EXTENSION_TITLE"              : "Instalovat doplněk",
    "INSTALL_EXTENSION_LABEL"              : "URL adresa doplňku",
    "INSTALL_EXTENSION_HINT"               : "URL adresa zip archivu nebo GitHub repozitáře",
    "INSTALLING_FROM"                      : "Instalace doplňku z {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Instalace byla úspěšná!",
    "INSTALL_FAILED"                       : "Instalace se nezdařila.",
    "CANCELING_INSTALL"                    : "Rušení instalace\u2026",
    "CANCELING_HUNG"                       : "Rušení instalace trvá dlouho. Mohlo dojít k interní chybě.",
    "INSTALL_CANCELED"                     : "Instalace zrušena.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Stažený soubor není platný zip soubor.",
    "INVALID_PACKAGE_JSON"                 : "Package.json balíček není platný (chyba byla: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Package.json balíček nespecifikuje jméno souboru.",
    "BAD_PACKAGE_NAME"                     : "{0} je neplatné jméno balíčku.",
    "MISSING_PACKAGE_VERSION"              : "Package.json balíček nespecifikuje verzi souboru.",
    "INVALID_VERSION_NUMBER"               : "Balíček verze ({0}) je neplatný.",
    "API_NOT_COMPATIBLE"                   : "Doplněk není kompatibilní s touto verzi {APP_NAME}. Naleznete jej ve složce disabled extensions.",
    "MISSING_MAIN"                         : "Balíček neobsahuje soubor main.js.",
    "ALREADY_INSTALLED"                    : "Doplněk s tímto jménem je již nainstalován. Nový doplněk je nainstalován ve složce disabled extensions.",
    "DOWNLOAD_ID_IN_USE"                   : "Interní chyba: ID stahování se již používá.",
    "NO_SERVER_RESPONSE"                   : "Nelze se přípojit na server.",
    "BAD_HTTP_STATUS"                      : "Soubor nebyl nalezen (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Nelze uložit do dočasných souborů.",
    "ERROR_LOADING"                        : "Při spuštění doplňku došlo k chybě.",
    "MALFORMED_URL"                        : "URL adresa je neplatná. Ujistěte se, že jste adresu zadali správně.",
    "UNSUPPORTED_PROTOCOL"                 : "URL adresa musí být http nebo https.",
    "UNKNOWN_ERROR"                        : "Neznámá chyba.",
    // For NOT_FOUND_ERR, see generic strings above
    
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Nástroje",
    "CMD_SHOW_DEV_TOOLS"                        : "Zobrazit nástroje pro vývojáře",
    "CMD_REFRESH_WINDOW"                        : "Restartovat {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nové okno {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Změnit jazyk",
    "CMD_RUN_UNIT_TESTS"                        : "Spustit testy",
    "CMD_SHOW_PERF_DATA"                        : "Zobrazit údaje o výkonnosti",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Povolit Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Uložit stav Node do konzole",
    "CMD_RESTART_NODE"                          : "Restartovat Node",
    
    "LANGUAGE_TITLE"                            : "Změnit jazyk",
    "LANGUAGE_MESSAGE"                          : "Prosím, vyberte jazyk ze seznamu:",
    "LANGUAGE_SUBMIT"                           : "Restartovat {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Zrušit",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Současná barva",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Původní barva",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa formát",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex formát",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa formát",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (použito {1} krát)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (použito {1} krát)",
    
    // extensions/default/JSLint
    "CMD_JSLINT"                                : "Povolit JSLint",
    "CMD_JSLINT_FIRST_ERROR"                    : "Přejít na první JSLint chybu",
    "JSLINT_ERRORS"                             : "JSLint chyby",
    "JSLINT_ERROR_INFORMATION"                  : "1 JSLint chyba",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} JSLint chyb",
    "JSLINT_NO_ERRORS"                          : "Žádné JSLint chyby - výborně!",
    "JSLINT_DISABLED"                           : "JSLint je vypnut nebo nefunguje s tímto souborem."
});
