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
    "INVALID_FILENAME_MESSAGE"          : "Názvy súboru nesmú obsahovať nasledujúce znaky: {0} alebo používať rezervované systémové slová.",
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

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Živý náhľad bol zrušený kvôli tomu, že boli otvorené vývojárske nástroje v prehliadači",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Živý náhľad bol zrušený kvôli tomu, že stránka bola zatvorená v prehliadači",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Živý náhľad bol zrušený kvôli tomu, že prehliadač odkazoval na stránku, ktorá nie je súčasťou aktuálneho projektu",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Živý náhľad bol zrušený pre neznámy dôvod ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Uložiť zmeny",
    "SAVE_CLOSE_MESSAGE"                : "Chcete uložiť zmeny, ktoré ste spravili v dokumente <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Chcete uložiť zmeny v následujúcich súboroch?",
    "EXT_MODIFIED_TITLE"                : "Externé zmeny",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Potvrdte odstránenie",
    "CONFIRM_FOLDER_DELETE"             : "Ste si istý zmazaním priečinku <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Súbor odstránený",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> bol upravený na disku, ale tiež ma neuložené zmeny in {APP_NAME}.<br /><br />Ktorú verziu chcete ponechať?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> bol zmazaný z disku, ale zmeny sa neuložili v {APP_NAME}.<br /><br />Chcete uložiť zmeny?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Použite /re/ syntax pre regexp vyhľadávanie",
    "FIND_RESULT_COUNT"                 : "{0} výsledkov",
    "WITH"                              : "S",
    "BUTTON_YES"                        : "Áno",
    "BUTTON_NO"                         : "Nie",
    "BUTTON_ALL"                        : "Všetko",
    "BUTTON_STOP"                       : "Stop",
    "BUTTON_REPLACE"                    : "Nahradiť",

    "OPEN_FILE"                         : "Otvoriť súbor",
    "SAVE_FILE_AS"                      : "Uložiť súbor",
    "CHOOSE_FOLDER"                     : "Vybrať adresár",

    "RELEASE_NOTES"                     : "Poznámky k verzii",
    "NO_UPDATE_TITLE"                   : "Všetko je aktuálne!",
    "NO_UPDATE_MESSAGE"                 : "Máte najnovšiu verziu {APP_NAME}.",

    "FIND_REPLACE_TITLE"                : "Nahradiť \"{0}\" s \"{1}\" &mdash; {3} {2} zhodami",

    "FIND_IN_FILES_TITLE"               : "\"{4}\" nájdený {5} &mdash; {0} {1} v {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "v <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "v projekte",
    "FIND_IN_FILES_FILE"                : "súbor",
    "FIND_IN_FILES_FILES"               : "súbory",
    "FIND_IN_FILES_MATCH"               : "zhoda",
    "FIND_IN_FILES_MATCHES"             : "zhody",
    "FIND_IN_FILES_MORE_THAN"           : "Cez ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_LESS"                : " <a href='#' class='find-less'>Menej</a>",
    "FIND_IN_FILES_MORE"                : " <a href='#' class='find-more'>Viac</a>",
    "FIND_IN_FILES_FILE_PATH"           : "Súbor: <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_LINE"                : "riadok: {0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Problém pri získavaní informácií o aktualizácii",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Nastal problém pri získavaní aktuálnych informácií zo servera. Prosím uistite sa, že ste pripojený do internetu a skúste znovu.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Načítavanie\u2026",
    "UNTITLED"          : "bez názvu",
    "WORKING_FILES"     : "Otvorené súbory",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Medzerník",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Riadok {0}, Stĺpec {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Vybraný {0} stĺpec",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Vybraných {0} stĺpcov",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Vybraný {0} riadok",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Vybraných {0} riadkov",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Kliknite pre zmenu osadenia na medzery",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Kliknite pre zmenu odsadenia na tabulátory",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Kliknite pre zmenu počet medzier použitých pre odsadenie",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Kliknite pre zmenu šírky tabulátora",
    "STATUSBAR_SPACES"                      : "Medzery",
    "STATUSBAR_TAB_SIZE"                    : "Velkosť tabulátora",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "Riadok: \u2014 {0}",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "Riadky: \u2014 {0}",

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
    "VIEW_MENU"                           : "Zobraziť",
    "CMD_HIDE_SIDEBAR"                    : "Skryť bočný panel",
    "CMD_SHOW_SIDEBAR"                    : "Zobraziť bočný panel",
    "CMD_INCREASE_FONT_SIZE"              : "Zväčšiť veľkosť písma",
    "CMD_DECREASE_FONT_SIZE"              : "Zmenšiť veľkosť písma",
    "CMD_RESTORE_FONT_SIZE"               : "Obnoviť veľkosť písma",
    "CMD_SCROLL_LINE_UP"                  : "Posunúť o riadok hore",
    "CMD_SCROLL_LINE_DOWN"                : "Posunúť o riadok dole",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Čísla riadkov",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Zvýrazniť aktívny riadok",
    "CMD_TOGGLE_WORD_WRAP"                : "Zalomenie riadkov",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Usporiadať podľa dátumu",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Usporiadať podľa mena",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Usporiadať podľa typu",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automatické usporiadanie",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigácia",
    "CMD_QUICK_OPEN"                      : "Rýchle otvorenie",
    "CMD_GOTO_LINE"                       : "Prejsť na riadok",
    "CMD_GOTO_DEFINITION"                 : "Prejsť na definíciu",
    "CMD_TOGGLE_QUICK_EDIT"               : "Rýchla úprava",
    "CMD_TOGGLE_QUICK_DOCS"               : "Rýchla dokumentácia",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Predchádzajúca zhoda",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Ďalšia zhoda",
    "CMD_NEXT_DOC"                        : "Následujúci dokument",
    "CMD_PREV_DOC"                        : "Predchádzajúci dokument",
    "CMD_SHOW_IN_TREE"                    : "Zobraziť stromovú štruktúru",
    "CMD_SHOW_IN_OS"                      : "Zobraziť v OS",
    
    // Help menu commands
    "HELP_MENU"                           : "Nápoveda",
    "CMD_CHECK_FOR_UPDATE"                : "Skontrolovať aktualizácie",
    "CMD_HOW_TO_USE_BRACKETS"             : "Ako používať {APP_NAME}",
    "CMD_FORUM"                           : "{APP_NAME} fórum",
    "CMD_RELEASE_NOTES"                   : "Poznámky o verzii",
    "CMD_REPORT_AN_ISSUE"                 : "Nahlásiť problém",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Zobraziť priečinok s doplnkami",
    "CMD_TWITTER"                         : "{TWITTER_NAME} na Twitteri",
    "CMD_ABOUT"                           : "O {APP_TITLE}",


    // Špeciálne príkazy spúšťané pomocou natívneho shellu
    "CMD_CLOSE_WINDOW"                    : "Zatvoriť okno",
    "CMD_ABORT_QUIT"                      : "Zrusiť ukončenie",
    "CMD_BEFORE_MENUPOPUP"                : "Before Menu Popup",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimentálna verzia",
    "DEVELOPMENT_BUILD"                    : "vývojová verzia",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Neukladať",
    "SAVE"                                 : "Uložiť",
    "CANCEL"                               : "Zrusiť",
    "DELETE"                               : "Odstrániť",
    "RELOAD_FROM_DISK"                     : "Načítať z disku",
    "KEEP_CHANGES_IN_EDITOR"               : "Ponechať zmeny v editore",
    "CLOSE_DONT_SAVE"                      : "Zatvoriť (neukladať)",
    "RELAUNCH_CHROME"                      : "Reštartovať Chrome",
    "ABOUT"                                : "O aplikácii",
    "CLOSE"                                : "Zatvoriť",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Oznámenia, podmienky týkajúce sa software tretích strán sú umiestnené na <a class=\"clickable-link\" data-href=\"{ADOBE_THIRD_PARTY}\">{ADOBE_THIRD_PARTY}</a> za začlenené prostredníctvom odkazu tu.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentácia a zdrojový kód na <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Vytvorené s \u2764 a JavaScript týmito ľuďmi:",
    "ABOUT_TEXT_LINE6"                     : "Veľa ľudí (ale práve máme problém s načítaním údajov).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs a the Web Platform grafické logo sú licencované pod Creative Commons Attribution license, <a class=\"clickable-link\" data-href=\"{WEB_PLATFORM_DOCS_LICENSE}\">CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Je dostupná nová verzia {APP_NAME}! Kliknite sem pre viac detailov.",
    "UPDATE_AVAILABLE_TITLE"               : "Dostupná aktualizácia",
    "UPDATE_MESSAGE"                       : "Hey, je dostupná nová verzia {APP_NAME}. Zoznam niektorých nových vylepšení:",
    "GET_IT_NOW"                           : "Stiahnuť!",
    "PROJECT_SETTINGS_TITLE"               : "Nastavenia projketu pre: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Živý náhľad URL",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Pre použitie lokálneho servera, vložte URL v tvare http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Protokol {0} nie je podporovaný Živým náhľadom&mdash;prosím použite http: alebo https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL adresa nemôže obsahovať výrazy pre hľadanie ako \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL adresa nemôže obsahovať znaky ako \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Zvláštné znaky ako '{0}' musia byť %-enkódované.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Neznáma chyba pri spracovávaní URL",
    
    // Extension Management strings
    "INSTALL"                              : "Inštalovať",
    "UPDATE"                               : "Aktualizovať",
    "REMOVE"                               : "Odstrániť",
    "OVERWRITE"                            : "Prepísať",
    "CANT_REMOVE_DEV"                      : "Doplnky v \"dev\" priečinku musia byť manuálne odstránené.",
    "CANT_UPDATE"                          : "Aktualizácia nie je kompatibilná s touto verziou {APP_NAME}.",
    "INSTALL_EXTENSION_TITLE"              : "Inštalovať doplnok",
    "UPDATE_EXTENSION_TITLE"               : "Aktualizovať doplnok",
    "INSTALL_EXTENSION_LABEL"              : "URL adresa doplnku",
    "INSTALL_EXTENSION_HINT"               : "URL adresa zip súboru doplnku alebo Git repozitár",
    "INSTALLING_FROM"                      : "Inštalovanie doplnku z {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Inštalácia bola úspešná!",
    "INSTALL_FAILED"                       : "Inštalácia sa nepodarila.",
    "CANCELING_INSTALL"                    : "Rušenie\u2026",
    "CANCELING_HUNG"                       : "Zrušenie inštalácie trvá dlho. Mohlo prísť k internej chybe.",
    "INSTALL_CANCELED"                     : "Inštalácia zrušená.",
    // Tieto musia odpovedať chybovým hláseniam v ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Stiahnutý obsah nie je platný zip súbor.",
    "INVALID_PACKAGE_JSON"                 : "Súbor package.json nie je platný (chyba bola: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Súbor package.json nešpecifikuje názov balíku.",
    "BAD_PACKAGE_NAME"                     : "{0} je neplatný názov balíka.",
    "MISSING_PACKAGE_VERSION"              : "Súbor package.json nešpecifikuje verziu súboru.",
    "INVALID_VERSION_NUMBER"               : "Balík verzie ({0}) je neplatný.",
    "INVALID_BRACKETS_VERSION"             : "Reťazec kompatibility ({0}) pre {APP_NAME} je neplatný.",
    "DISALLOWED_WORDS"                     : "Slová ({1}) nie sú povolené v {0} poli.",
    "API_NOT_COMPATIBLE"                   : "Balík nie je kompatibilný s verziou {APP_NAME}. Nájdete ho v zložke vypnuté doplnky.",
    "MISSING_MAIN"                         : "Balík nemá žiadny súbor main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Inštalácia tohto balíku prepíše nainštalovaný doplnok. Prepísať starý doplnok?",
    "EXTENSION_SAME_VERSION"               : "Tento balík je rovnakej verzie ako aktuálne nainštalovaný. Prepísať existujúci doplnok?",
    "EXTENSION_OLDER_VERSION"              : "Tento balík je verzie {0}, ktorá je staršia ako aktuálne nainštalovaná ({1}). Prepísať existujúci doplnok?",
    "DOWNLOAD_ID_IN_USE"                   : "Interná chyba: ID sťahovania sa už používa.",
    "NO_SERVER_RESPONSE"                   : "Nie je možné pripojiť sa k serveru.",
    "BAD_HTTP_STATUS"                      : "Súbor nebol nájdený na serveri (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Nie je možné uložiť do dočasného súboru.",
    "ERROR_LOADING"                        : "Pri spúšťaní doplnku prišlo k chybe.",
    "MALFORMED_URL"                        : "URL adresa je chybná. Prosím skontrolujte ju, či je zadaná správne.",
    "UNSUPPORTED_PROTOCOL"                 : "URL adresa musí byť http alebo https.",
    "UNKNOWN_ERROR"                        : "Neznáma chyba",
    // Pre NOT_FOUND_ERR, pozri všeobecné reťazce vyššie
    "EXTENSION_MANAGER_TITLE"              : "Správca doplnkov",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Nie je možné získať prístup k registrom doplnkov. Prosím, skúste to znovu neskôr.",
    "INSTALL_FROM_URL"                     : "Inštalovať z URL\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Dátum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Tento doplnok vyžaduje novšiu verziu {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Tento doplnok momentálne funguje iba zo staršími verziami {APP_NAME}.",
    "EXTENSION_NO_DESCRIPTION"             : "Bez popisu",
    "EXTENSION_MORE_INFO"                  : "Viac informácií...",
    "EXTENSION_ERROR"                      : "Chyba doplnku",
    "EXTENSION_KEYWORDS"                   : "Kľúčové slová",
    "EXTENSION_INSTALLED"                  : "Nainštalované",
    "EXTENSION_UPDATE_INSTALLED"           : "Aktualizácia tohto doplnku bola stiahnutá a bude nainštalovaná keď ukončíte {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Hľadať",
    "EXTENSION_MORE_INFO_LINK"             : "Viac",
    "BROWSE_EXTENSIONS"                    : "Prechádzať doplnky",
    "EXTENSION_MANAGER_REMOVE"             : "Odstrániť doplnok",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Nie je možné odstrániť jeden alebo viac doplnkov: {0}. {APP_NAME} bude ukončená.",
    "EXTENSION_MANAGER_UPDATE"             : "Aktualizovať doplnok",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Nie je možné aktualizovať jeden alebo viac doplnkov: {0}. {APP_NAME} bude ukončená.",
    "MARKED_FOR_REMOVAL"                   : "Označené pre odstránenie",
    "UNDO_REMOVE"                          : "Späť",
    "MARKED_FOR_UPDATE"                    : "Označené pre aktualizáciu",
    "UNDO_UPDATE"                          : "Späť",
    "CHANGE_AND_QUIT_TITLE"                : "Zmeniť doplnky",
    "CHANGE_AND_QUIT_MESSAGE"              : "Pre aktualizáciu alebo odstránenie označených doplnkov musíte ukončiť a reštartovať {APP_NAME}. Budete vyzvaný k uloženiu zmien.",
    "REMOVE_AND_QUIT"                      : "Odstrániť doplnky a skončiť",
    "CHANGE_AND_QUIT"                      : "Zmeniť doplnky a skončiť",
    "UPDATE_AND_QUIT"                      : "Aktualizovať doplnky a skončiť",
    "EXTENSION_NOT_INSTALLED"              : "Nie je možné odstrániť doplnok {0}, pretože nebol nainštalovaný",
    "NO_EXTENSIONS"                        : "Nie sú nainštalované žiadne doplnky.<br>Click on the Available tab above to get started.",
    "NO_EXTENSION_MATCHES"                 : "Nenašiel sa žiadny doplnok.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Buďte opatrní pri inštalácií doplnkov z neznámeho zdroja.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Nainštalované",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Dostupné",
    "EXTENSIONS_UPDATES_TITLE"             : "Aktualizácie",
    
    /**
     * Mená jednotiek
     */

    "UNIT_PIXELS"                          : "pixely",
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Ladenie",
    "CMD_SHOW_DEV_TOOLS"                        : "Zobraziť vývojárske nástroje",
    "CMD_REFRESH_WINDOW"                        : "Reštartovať {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nové {APP_NAME} okno",
    "CMD_SWITCH_LANGUAGE"                       : "Zmeniť jazyk",
    "CMD_RUN_UNIT_TESTS"                        : "Spustiť testy",
    "CMD_SHOW_PERF_DATA"                        : "Zobraziť údaje o výkone",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Zapnúť Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Uložiť stav Node do konzole",
    "CMD_RESTART_NODE"                          : "Reštartovať Node",
    
    "LANGUAGE_TITLE"                            : "Zmeniť jazyk",
    "LANGUAGE_MESSAGE"                          : "Jazyk:",
    "LANGUAGE_SUBMIT"                           : "Reštartovať {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Zrušiť",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Predvolený v systéme",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Aktuálna farba",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Pôvodná farba",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa formát",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex formát",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa formát",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Použité {1} krát)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Použité {1} krát)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Prejsť na definíciu",
    "CMD_SHOW_PARAMETER_HINT"                   : "Ukázať pomôcku parametra",
    "NO_ARGUMENTS"                              : "<žiadne parametre>",

    // extensions/default/JSLint
    "CMD_JSLINT"                                : "Povoliť JSLint",
    "CMD_JSLINT_FIRST_ERROR"                    : "Prejsť na prvú JSLint chybu",
    "JSLINT_ERRORS"                             : "JSLint chyby",
    "JSLINT_ERROR_INFORMATION"                  : "1 JSLint chyba",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} JSLint chýb",
    "JSLINT_NO_ERRORS"                          : "Žiadne JSLint chyby - dobrá práca!",
    "JSLINT_DISABLED"                           : "JSLint je vypnutý, alebo nefunguje s týmto súborom.",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Rýchly náhľad",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Viac"
});
