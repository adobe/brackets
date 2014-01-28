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

    // Obecné chyby souboru
    "GENERIC_ERROR"                     : "(chyba {0})",
    "NOT_FOUND_ERR"                     : "Soubor nenalezen.",
    "NOT_READABLE_ERR"                  : "Soubor nelze číst.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Cílová složka nemůže být změněna.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Oprávnění neumožní provádět změny.",
    "FILE_EXISTS_ERR"                   : "Soubor již existuje.",
    "FILE"                              : "Soubor",
    "DIRECTORY"                         : "Složka",

    // Řetězce chyb projektu
    "ERROR_LOADING_PROJECT"             : "Chyba při otevírání projektu",
    "OPEN_DIALOG_ERROR"                 : "Došlo k chybě při zobrazování dialogu Otevřít soubor. (chyba {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Došlo k chybě při načítání adresáře <span class='dialog-filename'>{0}</span>. (chyba {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Došlo k chybě při načítání obsahu složky <span class='dialog-filename'>{0}</span>. (chyba {1})",

    // Řetězce chyb otevírání/ukládání souboru
    "ERROR_OPENING_FILE_TITLE"          : "Chyba při otevírání souboru",
    "ERROR_OPENING_FILE"                : "Došlo k chybě při otevírání souboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Došlo k chybě při otevírání následujících souborů:",
    "ERROR_RELOADING_FILE_TITLE"        : "Chyba při načítání změn z disku",
    "ERROR_RELOADING_FILE"              : "Došlo k chybě při načítání souboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Chyba při ukládání souboru",
    "ERROR_SAVING_FILE"                 : "Došlo k chybě při ukládání souboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Chyba při přejmenování souboru",
    "ERROR_RENAMING_FILE"               : "Došlo k chybě při přejmenování souboru <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Chyba při mazání souboru",
    "ERROR_DELETING_FILE"               : "Došlo k chybě při mazání souboru <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Špatné jméno souboru",
    "INVALID_FILENAME_MESSAGE"          : "Jméno souboru nemůže obsahovat znaky: {0}",
    "FILE_ALREADY_EXISTS"               : "Soubor <span class='dialog-filename'>{0}</span> již existuje.",
    "ERROR_CREATING_FILE_TITLE"         : "Chyba při tvorbě souboru",
    "ERROR_CREATING_FILE"               : "Došlo k chybě při vytváření souboru <span class='dialog-filename'>{0}</span>. {1}",

    // Řetězce chyb aplikace
    "ERROR_IN_BROWSER_TITLE"            : "Ouha! {APP_NAME} ještě neběží v prohlížeči.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} je vytvořen v HTML, ale nyní pracuje jako desktopová aplikace, takže ji můžete použít pro úpravu lokálních souborů. Prosím, použijte shell aplikace v <b>github.com/adobe/brackets-shell</b> repo pro spuštění {APP_NAME}.",

    // Řetězce chyb indexování souboru
    "ERROR_MAX_FILES_TITLE"             : "Chyba při indexování souborů",
    "ERROR_MAX_FILES"                   : "Maximální počet souborů byl indexován. Funkce pro vyhledávání v indexovaných souborech nemusí fungovat správně.",

    // Řetezce chyb - živý náhled
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
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Pro více informací navštivte <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Živý náhled",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Živý náhled: Připojování\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Živý náhled: Spouštění\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Zrušit živý náhled",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Živý náhled (uložte soubor)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Živý náhled (neaktualizováno kvůli chybě v syntaxi)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Živý náhled byl zrušen, protože byly otevřeny vývojářské nástroje prohlížeče",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Živý náhled byl zrušen, protože dokument byl zavřen v prohlížeči",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Živý náhled byl zrušen, protože prohlížeč přešel na stránku, která není součástí projektu",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Živý náhled byl zrušen z neznámého důvodu ({0})",

    "SAVE_CLOSE_TITLE"                  : "Uložit změny",
    "SAVE_CLOSE_MESSAGE"                : "Chcete uložit změny v souboru <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Chcete uložit změny v následujících souborech?",
    "EXT_MODIFIED_TITLE"                : "Externí změny",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Potvrdit smazání",
    "CONFIRM_FOLDER_DELETE"             : "Opravdu chcete smazat složku <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Soubor smazán",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> byl změněn, ale neuložené změny se nachází také v {APP_NAME}.<br /><br /> Kterou verzi chcete zachovat?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> byl smazán z disku, ale změny nebyly uloženy v {APP_NAME}.<br /><br />Chcete uložit změny?",

    // Najít, Nahradit, Nahradit v souborech
    "FIND_RESULT_COUNT"                 : "{0} výsledků",
    "FIND_RESULT_COUNT_SINGLE"          : "1 výsledek",
    "FIND_NO_RESULTS"                   : "Žádné výsledky",
    "REPLACE_PLACEHOLDER"               : "Nahradit s\u2026",
    "BUTTON_YES"                        : "Ano",
    "BUTTON_NO"                         : "Ne",
    "BUTTON_REPLACE_ALL"                : "Vše\u2026",
    "BUTTON_REPLACE"                    : "Nahradit",

    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Další shoda",
    "BUTTON_PREV_HINT"                  : "Předchozí shoda",
    "BUTTON_CASESENSITIVE_HINT"         : "Rozlišovat velká a malá písmena",
    "BUTTON_REGEXP_HINT"                : "Regulární výraz",

    "OPEN_FILE"                         : "Otevřít soubor",
    "SAVE_FILE_AS"                      : "Uložit soubor",
    "CHOOSE_FOLDER"                     : "Vybrat složku",

    "RELEASE_NOTES"                     : "Poznámky k verzi",
    "NO_UPDATE_TITLE"                   : "Vše je aktuální!",
    "NO_UPDATE_MESSAGE"                 : "Verze {APP_NAME} je aktuální.",

    "FIND_REPLACE_TITLE_PART1"          : "Nahradit \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" s \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" nalezen",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} v {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "v <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "v projektu",
    "FIND_IN_FILES_FILE"                : "souboru",
    "FIND_IN_FILES_FILES"               : "souborech",
    "FIND_IN_FILES_MATCH"               : "výsledek",
    "FIND_IN_FILES_MATCHES"             : "výsledků",
    "FIND_IN_FILES_MORE_THAN"           : "více než ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "Soubor: <span class='dialog-filename'>{0}</span>",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Chyba při získávání informací o aktualizaci",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Nelze získat aktualizace. Ujistěte se, že máte připojení na internet a zkuste to znovu.",

    /**
     * Správce projektu
     */
    "PROJECT_LOADING" : "Načítání\u2026",
    "UNTITLED" : "Nový",
    "WORKING_FILES"     : "Pracovní soubory",

    /**
     * Jména kláves
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

    /**
     * Řetezce příkazového řádku
     */
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Vybrán {0} sloupec",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Vybrány {0} sloupce",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Vybrán {0} řádek",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Vybrány {0} řádky",
    "STATUSBAR_CURSOR_POSITION"             : "Řádek {0}, Sloupec {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Přepnout odsazení na mezery",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Přepnout odsazení na tabulátory",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Změnit počet mezer použitých pro odsazení",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Změnit šířku tabulátoru",
    "STATUSBAR_SPACES"                      : "Mezery:",
    "STATUSBAR_TAB_SIZE"                    : "Velikost tabulátoru:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "Řádek: {0}",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "Řádky: {0}",

    // CodeInspection: chyby/varování
    "ERRORS_PANEL_TITLE"                    : "{0} chyby",
    "ERRORS_PANEL_TITLE_SINGLE"             : "{0} chyby",
    "ERRORS_PANEL_TITLE_MULTI"              : "Lint problémy",
    "SINGLE_ERROR"                          : "1 {0} chyba",
    "MULTIPLE_ERRORS"                       : "{1} {0} chyby",
    "NO_ERRORS"                             : "Žádné {0} chyby - dobrá práce!",
    "LINT_DISABLED"                         : "Lintování je vypnuto",
    "NO_LINT_AVAILABLE"                     : "Žádný linter není dostupný pro {0}",
    "NOTHING_TO_LINT"                       : "Nic k lintování",


    /**
     * Příkazy
     */

    // Příkazy menu Soubor
    "FILE_MENU"                           : "Soubor",
    "CMD_FILE_NEW_UNTITLED"               : "Nový",
    "CMD_FILE_NEW"                        : "Nový soubor",
    "CMD_FILE_NEW_FOLDER"                 : "Nová složka",
    "CMD_FILE_OPEN"                       : "Otevřít\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Přidat k pracovní sadě",
    "CMD_OPEN_DROPPED_FILES"              : "Otevřít opuštěné soubory",
    "CMD_OPEN_FOLDER"                     : "Otevřít složku\u2026",
    "CMD_FILE_CLOSE"                      : "Zavřít",
    "CMD_FILE_CLOSE_ALL"                  : "Zavřít vše",
    "CMD_FILE_CLOSE_LIST"                 : "Zavřít seznam",
    "CMD_FILE_CLOSE_OTHERS"               : "Zavřít ostatní",
    "CMD_FILE_CLOSE_ABOVE"                : "Zavřít ostatní výše",
    "CMD_FILE_CLOSE_BELOW"                : "Zavřít ostatní níže",
    "CMD_FILE_SAVE"                       : "Uložit",
    "CMD_FILE_SAVE_ALL"                   : "Uložit vše",
    "CMD_FILE_SAVE_AS"                    : "Uložit jako\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Živý náhled",
    "CMD_LIVE_HIGHLIGHT"                  : "Živé zvýraznění",
    "CMD_PROJECT_SETTINGS"                : "Nastavení projektu\u2026",
    "CMD_FILE_RENAME"                     : "Přejmenovat",
    "CMD_FILE_DELETE"                     : "Smazat",
    "CMD_INSTALL_EXTENSION"               : "Instalovat doplňky\u2026",
    "CMD_EXTENSION_MANAGER"               : "Správce doplňků\u2026",
    "CMD_FILE_REFRESH"                    : "Obnovit",
    "CMD_QUIT"                            : "Konec",
    // Použito v souborovém menu Windows
    "CMD_EXIT"                            : "Konec",

    // Příkazy menu Edit
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
    "CMD_OPEN_LINE_ABOVE"                 : "O řádek výše",
    "CMD_OPEN_LINE_BELOW"                 : "O řádek níže",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Uzavírat závorky",
    "CMD_SHOW_CODE_HINTS"                 : "Zobrazit nápovědu",

    // Příkazy menu Zobrazit
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
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Lint soubory při uložení",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Řadit podle data",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Řadit podle jména",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Řadit podle typu",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatické řazení",

    // Příkazy menu Navigace
    "NAVIGATE_MENU"                       : "Navigace",
    "CMD_QUICK_OPEN"                      : "Rychle otevřít",
    "CMD_GOTO_LINE"                       : "Přejít na řádek",
    "CMD_GOTO_DEFINITION"                 : "Přejít na funkci",
    "CMD_GOTO_FIRST_PROBLEM"              : "Přejít na první chybu/varování",
    "CMD_TOGGLE_QUICK_EDIT"               : "Rychlá úprava",
    "CMD_TOGGLE_QUICK_DOCS"               : "Rychlá dokumentace",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Předchozí shoda",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Další shoda",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Nové pravidlo",
    "CMD_NEXT_DOC"                        : "Další dokument",
    "CMD_PREV_DOC"                        : "Předchozí dokument",
    "CMD_SHOW_IN_TREE"                    : "Zobrazit stromovou strukturu",
    "CMD_SHOW_IN_OS"                      : "Zobrazit v OS",

    // Příkazy menu nápověda
    "HELP_MENU"                           : "Nápověda",
    "CMD_CHECK_FOR_UPDATE"                : "Zkontrolovat aktualizace",
    "CMD_HOW_TO_USE_BRACKETS"             : "Jak používat {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} fórum",
    "CMD_RELEASE_NOTES"                   : "Poznámky k verzi",
    "CMD_REPORT_AN_ISSUE"                 : "Nahlásit problém",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Zobrazit složku s doplňky",
    "CMD_TWITTER"                         : "{TWITTER_NAME} - Twitter",
    "CMD_ABOUT"                           : "O aplikaci {APP_TITLE}",

    // Řetězce pro main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimentální verze",
    "DEVELOPMENT_BUILD"                    : "vývojová verze",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Neukládat",
    "SAVE"                                 : "Uložit",
    "CANCEL"                               : "Zrušit",
    "DELETE"                               : "Smazat",
    "RELOAD_FROM_DISK"                     : "Načíst z disku",
    "KEEP_CHANGES_IN_EDITOR"               : "Ponechat změny v editoru",
    "CLOSE_DONT_SAVE"                      : "Zavřít (neukládat)",
    "RELAUNCH_CHROME"                      : "Restartovat Chrome",
    "ABOUT"                                : "O aplikaci",
    "CLOSE"                                : "Zavřít",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Oznámení, podmínky týkající se software třetích stran jsou umístěny na <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> a začleněny prostřednictvím odkazu zde.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentace a zdrojový kód na <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>.",
    "ABOUT_TEXT_LINE5"                     : "Vytvořeno s \u2764 a pomocí JavaScript těmito lidmi:",
    "ABOUT_TEXT_LINE6"                     : "Mnoho lidí (ale momentálně máme problém s načítáním dat).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs a Web Platform logo využívají licenci Creative Commons Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
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
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Neznámá chyba při zpracování URL",

      // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Nové pravidlo",

    // Řetězce pro správce doplňků
    "INSTALL"                              : "Instalovat",
    "UPDATE"                               : "Aktualizovat",
    "REMOVE"                               : "Odstranit",
    "OVERWRITE"                            : "Přepsat",
    "CANT_REMOVE_DEV"                      : "Doplněk v \"dev\" složce musí být smazán manuálně.",
    "CANT_UPDATE"                          : "Aktualizace není kompatibilní s touto verzí {APP_NAME}.",
    "INSTALL_EXTENSION_TITLE"              : "Instalovat doplněk",
    "UPDATE_EXTENSION_TITLE"               : "Aktualizovat doplněk",
    "INSTALL_EXTENSION_LABEL"              : "URL adresa doplňku",
    "INSTALL_EXTENSION_HINT"               : "URL adresa zip archivu nebo GitHub repozitáře",
    "INSTALLING_FROM"                      : "Instalace doplňku z {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Instalace byla úspěšná!",
    "INSTALL_FAILED"                       : "Instalace se nezdařila.",
    "CANCELING_INSTALL"                    : "Rušení instalace\u2026",
    "CANCELING_HUNG"                       : "Rušení instalace trvá dlouho. Mohlo dojít k interní chybě.",
    "INSTALL_CANCELED"                     : "Instalace zrušena.",
    // Tyto musí odpovídat chybovým hlášením v ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Stažený soubor není platný zip soubor.",
    "INVALID_PACKAGE_JSON"                 : "Package.json balíček není platný (chyba byla: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Package.json balíček nespecifikuje jméno souboru.",
    "BAD_PACKAGE_NAME"                     : "{0} je neplatné jméno balíčku.",
    "MISSING_PACKAGE_VERSION"              : "Package.json balíček nespecifikuje verzi souboru.",
    "INVALID_VERSION_NUMBER"               : "Balíček verze ({0}) je neplatný.",
    "INVALID_BRACKETS_VERSION"             : "Řetězec kompatibility {{0}} pro Brackets je neplatný.",
    "DISALLOWED_WORDS"                     : "Slova {{1}} nejsou povolena v {{0}} poli.",
    "API_NOT_COMPATIBLE"                   : "Doplněk není kompatibilní s touto verzi Brackets. Naleznete jej ve složce disabled extensions.",
    "MISSING_MAIN"                         : "Balíček neobsahuje soubor main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Instalace tohoto balíčku přepíše již nainstalovaný doplněk. Chcete přepsat starý doplněk?",
    "EXTENSION_SAME_VERSION"               : "Tento balíček je stejná verze jako ta, kterou již máte nainstalovanou. Chcete přepsat existující doplněk?",
    "EXTENSION_OLDER_VERSION"              : "Tento balíček je verze {0}, která je starší než současně nainstalovaná verze ({1}). Chcete přepsat existující doplněk?",
    "DOWNLOAD_ID_IN_USE"                   : "Interní chyba: ID stahování se již používá.",
    "NO_SERVER_RESPONSE"                   : "Nelze se připojit na server.",
    "BAD_HTTP_STATUS"                      : "Soubor nebyl nalezen (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Nelze uložit do dočasných souborů.",
    "ERROR_LOADING"                        : "Při spuštění doplňku došlo k chybě.",
    "MALFORMED_URL"                        : "URL adresa je neplatná. Ujistěte se, že jste adresu zadali správně.",
    "UNSUPPORTED_PROTOCOL"                 : "URL adresa musí být http nebo https.",
    "UNKNOWN_ERROR"                        : "Neznámá chyba.",
    // Pro NOT_FOUND_ERR, vyhledejte obecné řetězce výše
    "EXTENSION_MANAGER_TITLE"              : "Správce doplňků",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Nelze získat přístup k registru doplňků. Prosím, zkuste to znovu později.",
    "INSTALL_FROM_URL"                     : "Instalovat z URL\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Datum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Tento doplněk požaduje novější verzi {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Tento doplněk funguje pouze ve starší verzi {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Verze {0} tohoto doplňku vyžaduje novější verzi {APP_NAME}. Můžete si ale nainstalovat dřívější verzi {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Verze {0} tohoto doplňku funguje pouze se starší verzí {APP_NAME}. Můžete si ale nainstalovat dřívější verzi {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Bez popisu",
    "EXTENSION_MORE_INFO"                  : "Více informací...",
    "EXTENSION_ERROR"                      : "Chyba doplňku",
    "EXTENSION_KEYWORDS"                   : "Klíčová slova",
    "EXTENSION_INSTALLED"                  : "Nainstalováno",
    "EXTENSION_UPDATE_INSTALLED"           : "Aktualizace doplňku byla stažena a bude nainstalována při ukončení aplikace {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Hledat",
    "EXTENSION_MORE_INFO_LINK"             : "Více",
    "BROWSE_EXTENSIONS"                    : "Procházet doplňky",
    "EXTENSION_MANAGER_REMOVE"             : "Odstranit doplněk",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Chyba při odstraňování jednoho nebo více doplňků: {{0}}. {APP_NAME} bude stále ukončen.",
    "EXTENSION_MANAGER_UPDATE"             : "Aktualizovat doplněk",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Nelze aktualizovat jeden nebo více doplňků: {0}. Aplikace {APP_NAME} bude ukončena.",
    "MARKED_FOR_REMOVAL"                   : "Označeno pro odstranění",
    "UNDO_REMOVE"                          : "Zpět",
    "MARKED_FOR_UPDATE"                    : "Označeno pro aktualizaci",
    "UNDO_UPDATE"                          : "Zpět",
    "CHANGE_AND_QUIT_TITLE"                : "Změnit doplněk",
    "CHANGE_AND_QUIT_MESSAGE"              : "Pro aktualizaci nebo odstranění označených doplňků musíte ukončit a restartovat aplikaci {APP_NAME}. Budete vyzváni k uložení změn.",
    "REMOVE_AND_QUIT"                      : "Odstranit doplňky a ukončit program",
    "CHANGE_AND_QUIT"                      : "Změnit doplňky a ukončit program",
    "UPDATE_AND_QUIT"                      : "Aktualizovat doplňky a ukončit program",
    "EXTENSION_NOT_INSTALLED"              : "Doplněk {{0}} nemohl být odstraněn, protože nebyl nainstalován.",
    "NO_EXTENSIONS"                        : "Žádný doplněk ještě nebyl nainstalován.<br />Klikněte na tlačítko Instalovat z URL pro zahájení instalace.",
    "NO_EXTENSION_MATCHES"                 : "Žádný doplněk neodpovídá hledání.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Buďte opatrní při instalaci doplňků z neznámých zdrojů.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Nainstalované",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Dostupné",
    "EXTENSIONS_UPDATES_TITLE"             : "Aktualizace",

    "INLINE_EDITOR_NO_MATCHES"             : "Žádné dostupné shody.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Neexistují žádná CSS pravidla odpovídající vašemu výběru.<br> Pro vytvoření pravidla klikněte na \"Nové pravidlo\".",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Neexistují žádné soubory s kaskádovými styly ve vašem projektu.<br>Vytvořte nový soubor pro přidání CSS pravidel.",

    /**
     * Jména jednotek
     */

    "UNIT_PIXELS"                          : "pixely",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                          : "Nástroje",
    "CMD_SHOW_DEV_TOOLS"                  : "Zobrazit nástroje pro vývojáře",
    "CMD_REFRESH_WINDOW"                  : "Restartovat {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"             : "Nové okno {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                 : "Změnit jazyk",
    "CMD_RUN_UNIT_TESTS"                  : "Spustit testy",
    "CMD_SHOW_PERF_DATA"                  : "Zobrazit údaje o výkonnosti",
    "CMD_ENABLE_NODE_DEBUGGER"            : "Povolit Node Debugger",
    "CMD_LOG_NODE_STATE"                  : "Uložit stav Node do konzole",
    "CMD_RESTART_NODE"                    : "Restartovat Node",

    "LANGUAGE_TITLE"                    : "Změnit jazyk",
    "LANGUAGE_MESSAGE"                  : "Prosím, vyberte jazyk ze seznamu:",
    "LANGUAGE_SUBMIT"                   : "Restartovat {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "Zrušit",
    "LANGUAGE_SYSTEM_DEFAULT"           : "Výchozí",

    /**
     * Jazyky
     */
    "LOCALE_CS"                                 : "Česky",
    "LOCALE_DE"                                 : "Německy",
    "LOCALE_EN"                                 : "Anglicky",
    "LOCALE_ES"                                 : "Španělsky",
    "LOCALE_FR"                                 : "Francouzsky",
    "LOCALE_IT"                                 : "Italsky",
    "LOCALE_JA"                                 : "Japonsky",
    "LOCALE_NB"                                 : "Norsky",
    "LOCALE_NL"                                 : "Holandsky",
    "LOCALE_FA_IR"                              : "Persky-perština",
    "LOCALE_PL"                                 : "Polsky",
    "LOCALE_PT_BR"                              : "Portugalsky, Brazílie",
    "LOCALE_PT_PT"                              : "Portugalsky",
    "LOCALE_RO"                                 : "Rumunsky",
    "LOCALE_RU"                                 : "Rusky",
    "LOCALE_SK"                                 : "Slovensky",
	"LOCALE_SR"									: "Srbština",
    "LOCALE_SV"                                 : "Švédsky",
    "LOCALE_TR"                                 : "Turecky",
    "LOCALE_FI"                                 : "Finsky",
    "LOCALE_ZH_CN"                              : "Čínsky",
    "LOCALE_HU"                                 : "Maďarsky",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Doba",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Postup",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Současná barva",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Původní barva",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa formát",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex formát",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa formát",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (použito {1} krát)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (použito {1} krát)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Přejít na definici",
    "CMD_SHOW_PARAMETER_HINT"                   : "Zobrazit nápovědu parametru",
    "NO_ARGUMENTS"                              : "<žádné parametry>",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Rychlý náhled",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Nedávné projekty",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Více"
});
