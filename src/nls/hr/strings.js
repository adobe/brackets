/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR"                     : "(greška {0})",
    "NOT_FOUND_ERR"                     : "Nepostojeća datoteka.",
    "NOT_READABLE_ERR"                  : "Datoteka ne može biti učitana.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Ciljana mapa ne može biti izmijenjena.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Trenutne ovlasti vam ne dozvoljavaju da radite izmjene.",
    "CONTENTS_MODIFIED_ERR"             : "Datoteka je bila izmjenjena izvan {APP_NAME}.",
    "FILE_EXISTS_ERR"                   : "Datoteka ili mapa već postoji.",
    "FILE"                              : "datoteka",
    "DIRECTORY"                         : "direktorij",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Greška pri učitavanju projekta",
    "OPEN_DIALOG_ERROR"                 : "Došlo je do greške prilikom prikazivanja dijaloga za otvaranje datoteke. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Došlo je do greške prilikom pokušaja da se učita direktorij <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Došlo je do greške prilikom iščitavanja sadržaja direktorija <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Greška pri otvaranju datoteke",
    "ERROR_OPENING_FILE"                : "Došlo je do greške prilikom pokušaja da se otvori datoteka <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Došlo je do greške prilikom pokušaja da se otvore sljedeće datoteke:",
    "ERROR_RELOADING_FILE_TITLE"        : "Greška pri ponovom učitavanju izmjena sa diska",
    "ERROR_RELOADING_FILE"              : "Došlo je do greške prilikom pokušaja da se ponovo učita datoteka <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Greška pri spremanju datoteke",
    "ERROR_SAVING_FILE"                 : "Došlo je do greške prilikom pokušaja da se sačuva datoteka <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Greška pri preimenovanju datoteke",
    "ERROR_RENAMING_FILE"               : "Došlo je do greške prilikom pokušaja da se preimenuje datoteka <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Greška pri brisanju datoteke",
    "ERROR_DELETING_FILE"               : "Došlo je do greške prilikom pokušaja da se obriše datoteka <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Ime {0} nije valjano",
    "INVALID_FILENAME_MESSAGE"          : "Imena datoteka ne smiju sadržavati sljedeće znakove: {0} ili riječi rezervirane za sistem.",
    "ERROR_CREATING_FILE_TITLE"         : "Greška pri kreiranju {0}",
    "ERROR_CREATING_FILE"               : "Došlo je do greške prilikom pokušaja da se kreira {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Greška kod čitanja preferencija",
    "ERROR_PREFS_CORRUPT"               : "Vaša datoteka preferencije nije valjana u JSON. Datoteka će biti otvorena tako da možete ispraviti format. Da biste vidjeli promjene, ponovo pokrenite {APP_NAME}.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} još uvijek ne radi u pregledniku.",
    "ERROR_IN_BROWSER"                  : "Aplikacija \"{APP_NAME}\" je napravljena pomoću HTML-a, ali trenutno radi kao \"desktop\" aplikacija pa je možete koristiti za izmjenu lokalnih datoteka. Molimo Vas koristite \"application shell\" na <b>github.com/adobe/brackets-shell</b> repozitorij za pokretanje \"{APP_NAME}\" aplikacije.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Greška prilikom indeksiranja datoteka",
    "ERROR_MAX_FILES"                   : "Indeksiran je maksimalni broj datoteka. Akcije koje pretražuju datoteke u indeksu mogu pogrešno funkcionirati.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Greška prilikom pokretanja web preglednika",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome preglednik nije pronađen. Molimo potvrdite da je instaliran.",
    "ERROR_LAUNCHING_BROWSER"           : "Greška prilikom pokretanja web preglednika. (error {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Greška u živom prikazivanju",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Povezivanje sa preglednikom",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Da bi se Prikaz Uživo povezao, potrebno je ponovo pokrenuti Chrome sa uključenim podešavanjima za remote debugging.<br /><br />Da li želite ponovo pokrenuti Chrome i omogućiti remote debugging?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Nije moguće učitati živi prikaz stranice",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Otvorite HTML datoteku ili budite sigurni da postoji index.html datoteka u vašem projektu kako bi se pokrenuo živi prikaz.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Za pokretanje prikaza uživo sa datotekom koja je na serveru, morate navesti osnovnu URL adresu za ovaj projekt.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Greška prilikom pokretanja HTTP servera za prikaz datoteka uživo. Pokušajte ponovo.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Dobro došli u Prikaz Uživo!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Prikaz uživo spaja {APP_NAME} sa vašim preglednikom. On pokreće prikaz vaše HTML datoteke u pregledniku, te potom trenutno ažurira prikaz, kako Vi mijenjate vaš kôd.<br /><br />U ovoj ranoj verziji aplikacije {APP_NAME}, Prikaz uživo radi samo sa <strong>Google Chrome</strong> preglednikom i ažurira prikaz dok mijenjate <strong>CSS ili HTML datoteke</strong>. Izmjene načinjene u JavaScript datotekama su automatski ponovo učitane kada ih spremite.<br /><br />(Ova poruka će biti prikazana samo jednom.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Za više informacija, pogledajte <a href='{0}' title='{0}'>Rješavanje grešaka u povezivanju prilikom Prikaza uživo.</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Prikaz uživo",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Prikaz uživo: Povezivanje\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Prikaz uživo: Inicijalizacija\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Napusti Prikaz Uživo",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Prikaz uživo (sačuvaj datoteku za osvježavanje)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Prikaz uživo (ne osvježava se zbog greške u sintaksi)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Prikaz uživo je otkazan jer su u pregledniku bili otvoreni razvojni alati",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Prikaz uživo je otkazan jer je stranica zatvorena u pregledniku",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Prikaz uživo je otkazan jer je preglednik otišao na stranicu koja nije dio trenutnog projekta.",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Prikaz uživo je otkazan iz nepoznatog razloga ({0})",

    "SAVE_CLOSE_TITLE"                  : "Sačuvaj promjene",
    "SAVE_CLOSE_MESSAGE"                : "Želite li sačuvati izmjene koje ste napravili u dokumentu <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Želite li sačuvati izmjene sljedećih datoteka?",
    "EXT_MODIFIED_TITLE"                : "Vanjske izmjene",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Potvrdi brisanje",
    "CONFIRM_FOLDER_DELETE"             : "Da li ste sigurni da želite obrisati mapu <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Datoteka Obrisana",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> je bio izmjenjen na disku.<br /><br />Da li želite sačuvati datoteku i spremiti preko tih izmjena?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> je bila izmjenjena na disku, ali isto tako sadrži nesačuvane promjene u {APP_NAME}.<br /><br />Koju verziju želite sačuvati?",
    "EXT_DELETED_MESSAGE"               : "Datoteka <span class='dialog-filename'>{0}</span> je izbrisana na disku, ali postoje njene nesačuvane promjene u {APP_NAME}.<br /><br />Želite li sačuvati te promjene?",

    // Generic dialog/button labels
    "OK"                                : "OK",
    "CANCEL"                            : "Otkaži",
    "DONT_SAVE"                         : "Nemoj sačuvati",
    "SAVE"                              : "Sačuvaj",
    "SAVE_AS"                           : "Sačuvaj kao\u2026",
    "SAVE_AND_OVERWRITE"                : "Piši preko",
    "DELETE"                            : "Izbriši",
    "BUTTON_YES"                        : "Da",
    "BUTTON_NO"                         : "Ne",

    // Find, Replace, Find in Files
    "FIND_NO_RESULTS"                   : "Nema rezultata",
    "FIND_QUERY_PLACEHOLDER"            : "Nađi\u2026",
    "REPLACE_PLACEHOLDER"               : "Zamijeni sa\u2026",
    "BUTTON_REPLACE_ALL"                : "Sve\u2026",
    "BUTTON_REPLACE"                    : "Zamijeni",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Sljedeće poklapanje",
    "BUTTON_PREV_HINT"                  : "Prethodno poklapanje",
    "BUTTON_CASESENSITIVE_HINT"         : "Poklapanje samo sa specificiranim/određenim velikim ili malim slovom",
    "BUTTON_REGEXP_HINT"                : "Regularni Izraz",

    "OPEN_FILE"                         : "Otvori datoteku",
    "SAVE_FILE_AS"                      : "Sačuvaj datoteku",
    "CHOOSE_FOLDER"                     : "Izaberi mapu",

    "RELEASE_NOTES"                     : "Obavijesti o izmjenama",
    "NO_UPDATE_TITLE"                   : "Imate aktualnu verziju!",
    "NO_UPDATE_MESSAGE"                 : "Trenutno koristite aktualnu verziju aplikacije {APP_NAME}.",

    // Find in Files
    "FIND_IN_FILES_SCOPED"              : "u <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "u projektu",
    "FIND_IN_FILES_FILE"                : "datoteci",
    "FIND_IN_FILES_FILES"               : "datoteka",
    "FIND_IN_FILES_MATCH"               : "poklapanje",
    "FIND_IN_FILES_MATCHES"             : "poklapanja",
    "FIND_IN_FILES_MORE_THAN"           : "Preko ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
    // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd klikni da proširiš/skupiš sve",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Greška prilikom učitavanja informacija o novoj verziji",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Došlo je do problema prilikom preuzimanja posljednjih informacija o novoj verziji sa servera. Molimo provjerite da li ste povezani na internet i pokušajte ponovo",

    // File exclusion filters
    "NO_FILE_FILTER"                    : "Isključi datoteke\u2026",
    "EDIT_FILE_FILTER"                  : "Uredi\u2026",
    "FILE_FILTER_DIALOG"                : "Uređivački filter",
    "FILE_FILTER_INSTRUCTIONS"          : "Isključi datoteke i direktorije koji se slažu sa ijednom od sljedećih nizova / podnizova riječi ili <a href='{0}' title='{0}'>globs</a>. Unesi svaki niz u novi red.",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "i {0} više",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Brzo uređivanje nije dostupno za trenutnu poziciju kursora",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "Brzo CSS uređivanje: postavi kursor na pojedinačno ime klase",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "Brzo CSS uređivanje: nepotpuno svojstvo klase",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "Brzo CSS uređivanje: nepotpuno id svojstvo",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "Brzo CSS uređivanje: postavi kursor na tag, klasu(class), ili id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "Brzo CSS uređivanje vremenskog raspoređivanja: nevažeća sintaksa",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "Brzo JS uređivanje: postavi kursor na ime funkcije",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Nema dostupnih brzih dokumenata za trenutnu poziciju kursora",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Učitavanje\u2026",
    "UNTITLED"          : "Neimenovan",
    "WORKING_FILES"     : "Radne datoteke",

    /**
     * MainViewManager
     */
    "TOP"               : "Vrh",
    "BOTTOM"            : "Dno",
    "LEFT"              : "Lijevo",
    "RIGHT"             : "Desno",

    "CMD_SPLITVIEW_NONE"        : "Bez prepolavljanja",
    "CMD_SPLITVIEW_VERTICAL"    : "Prepolovi okomito",
    "CMD_SPLITVIEW_HORIZONTAL"  : "Prepolovi vodoravno",
    "SPLITVIEW_MENU_TOOLTIP"    : "Prepolovi editor okomito ili vodoravno",
    "GEAR_MENU_TOOLTIP"         : "Definiraj radni skup",

    "SPLITVIEW_INFO_TITLE"              : "Već otvoreno",
    "SPLITVIEW_MULTIPANE_WARNING"       : "Datoteka je već otvorena u drugom panelu. {APP_NAME} će uskoro podržavati otvaranje iste datoteke u više od jednog panela. Do tada, datoteka će biti prikazana u panelu u kojem je već otvorena.<br /><br />(Ovu ćeš poruku vidjeti samo jednom.)",


    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Red {0}, Stupac {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 izabran {0} stupac",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 izabrano {0} stupaca",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 izabrano {0} redova",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 izabrano {0} redova",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Klikni za korištenje razmaka prilikom uvlačenja kôda",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Klikni za korištenje tabova prilikom uvlačenja kôda*",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Klikni da promjeniš broj razmaka prilikom uvlačenja kôda",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Klikni da promjeniš širinu karaktera na kartici",
    "STATUSBAR_SPACES"                      : "Razmaci:",
    "STATUSBAR_TAB_SIZE"                    : "Veličina kartice:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} red",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} redova",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Extenzije onemogućene",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} grešaka",
    "SINGLE_ERROR"                          : "1 {0} greška",
    "MULTIPLE_ERRORS"                       : "{1} {0} grešaka",
    "NO_ERRORS"                             : "Nema {0} nađenih grešaka - svaka čast!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Nema nađenih grešaka - bravo!",
    "LINT_DISABLED"                         : "Detektiranje sumnjivog kôda isključeno",
    "NO_LINT_AVAILABLE"                     : "Nijedan detektor sumnjivog kôda nije dostupan za {0}",
    "NOTHING_TO_LINT"                       : "Nije pronađen sumnjivi kôd",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Datoteka",
    "CMD_FILE_NEW_UNTITLED"               : "Nova",
    "CMD_FILE_NEW"                        : "Nova datoteka",
    "CMD_FILE_NEW_FOLDER"                 : "Nova mapa",
    "CMD_FILE_OPEN"                       : "Otvori\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Dodaj u radni set",
    "CMD_OPEN_DROPPED_FILES"              : "Open Dropped Files",
    "CMD_OPEN_FOLDER"                     : "Otvori Mapu\u2026",
    "CMD_FILE_CLOSE"                      : "Zatvori",
    "CMD_FILE_CLOSE_ALL"                  : "Zatvori sve",
    "CMD_FILE_CLOSE_LIST"                 : "Zatvori listu",
    "CMD_FILE_CLOSE_OTHERS"               : "Zatvori druge",
    "CMD_FILE_CLOSE_ABOVE"                : "Zatvori druge iznad",
    "CMD_FILE_CLOSE_BELOW"                : "Zatvori druge ispod",
    "CMD_FILE_SAVE"                       : "Sačuvaj",
    "CMD_FILE_SAVE_ALL"                   : "Sačuvaj sve",
    "CMD_FILE_SAVE_AS"                    : "Sačuvaj kao\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Prikaz uživo",
    "CMD_TOGGLE_LIVE_PREVIEW_MB_MODE"     : "Omogući Experimentalni Prikaz Uživo",
    "CMD_PROJECT_SETTINGS"                : "Postavke Projekta\u2026",
    "CMD_FILE_RENAME"                     : "Preimenuj",
    "CMD_FILE_DELETE"                     : "Obriši",
    "CMD_INSTALL_EXTENSION"               : "Instaliraj Extenziju\u2026",
    "CMD_EXTENSION_MANAGER"               : "Manager Extenzija\u2026",
    "CMD_FILE_REFRESH"                    : "Osvježi stablo datoteka",
    "CMD_QUIT"                            : "Prekini",
    // Used in native File menu on Windows
    "CMD_EXIT" : "Izađi",

    // Edit menu commands
    "EDIT_MENU"                           : "Uredi",
    "CMD_UNDO"                            : "Poništi",
    "CMD_REDO"                            : "Ponovi",
    "CMD_CUT"                             : "Izreži",
    "CMD_COPY"                            : "Kopiraj",
    "CMD_PASTE"                           : "Zalijepi",
    "CMD_SELECT_ALL"                      : "Odaberi sve",
    "CMD_SELECT_LINE"                     : "Odaberi red",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Razdvoji odabrano u redove",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Dodaj kursor u sljedeći red",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Dodaj kursor u prošli red",
    "CMD_INDENT"                          : "Pomakni udesno",
    "CMD_UNINDENT"                        : "Pomakni ulijevo",
    "CMD_DUPLICATE"                       : "Udvostruči",
    "CMD_DELETE_LINES"                    : "Obriši red",
    "CMD_COMMENT"                         : "// Komentar reda",
    "CMD_BLOCK_COMMENT"                   : "Blok komentar /*..*/",
    "CMD_LINE_UP"                         : "Pomakni red gore",
    "CMD_LINE_DOWN"                       : "Pomakni red dolje",
    "CMD_OPEN_LINE_ABOVE"                 : "Otvori red iznad",
    "CMD_OPEN_LINE_BELOW"                 : "Otvori red ispod",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Automatski zatvori zagrade",
    "CMD_SHOW_CODE_HINTS"                 : "Prikaži naznake (hintove) kôda",

    // Search menu commands
    "FIND_MENU"                           : "Nađi",
    "CMD_FIND"                            : "Nađi",
    "CMD_FIND_IN_FILES"                   : "Nađi u datotekama",
    "CMD_FIND_IN_SUBTREE"                 : "Nađi u\u2026",
    "CMD_FIND_NEXT"                       : "Nađi sljedeće",
    "CMD_FIND_PREVIOUS"                   : "Nađi prethodno",
    "CMD_FIND_ALL_AND_SELECT"             : "Nađi sve i odaberi",
    "CMD_ADD_NEXT_MATCH"                  : "Dodaj sljedeće slaganje u odabir",
    "CMD_SKIP_CURRENT_MATCH"              : "Preskoči i dodaj sljedeće slaganje",
    "CMD_REPLACE"                         : "Zamijeni",
    "CMD_REPLACE_IN_FILES"                : "Zamijeni u datotekama",
    "CMD_REPLACE_IN_SUBTREE"              : "Zamijeni u\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Prikaz",
    "CMD_HIDE_SIDEBAR"                    : "Sakrij bočnu traku",
    "CMD_SHOW_SIDEBAR"                    : "Prikaži bočnu traku",
    "CMD_INCREASE_FONT_SIZE"              : "Povećaj veličinu fonta",
    "CMD_DECREASE_FONT_SIZE"              : "Smanji veličinu fonta",
    "CMD_RESTORE_FONT_SIZE"               : "Vrati veličinu fonta",
    "CMD_SCROLL_LINE_UP"                  : "Pomakni red gore",
    "CMD_SCROLL_LINE_DOWN"                : "Pomakni red dolje",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Brojevi redova",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Označi aktivni red",
    "CMD_TOGGLE_WORD_WRAP"                : "Prijelom teksta",
    "CMD_LIVE_HIGHLIGHT"                  : "Obilježi prikaz uživo",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Prekontroliraj datoteke prilikom spremanja",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Sortiraj po datumu",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Sortiraj po imenu",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Sortiraj po tipu",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Automatsko sortiranje",
    "CMD_THEMES"                          : "Teme\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigacija",
    "CMD_QUICK_OPEN"                      : "Brzo otvori",
    "CMD_GOTO_LINE"                       : "Idi na red",
    "CMD_GOTO_DEFINITION"                 : "Brzo nađi definiciju",
    "CMD_GOTO_FIRST_PROBLEM"              : "Idi na prvu grešku/upozorenje",
    "CMD_TOGGLE_QUICK_EDIT"               : "Brzo izmjeni",
    "CMD_TOGGLE_QUICK_DOCS"               : "Brzi dokumenti",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Prethodno poklapanje",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Sljedeće poklapanje",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Novo pravilo",
    "CMD_NEXT_DOC"                        : "Sljedeći dokument",
    "CMD_PREV_DOC"                        : "Prethodni dokument",
    "CMD_SHOW_IN_TREE"                    : "Prikaži u stablu datoteka",
    "CMD_SHOW_IN_EXPLORER"                : "Prikaži u Exploreru",
    "CMD_SHOW_IN_FINDER"                  : "Prikaži u Finderu",
    "CMD_SHOW_IN_OS"                      : "Prikaži u OS-u",

    // Help menu commands
    "HELP_MENU"                           : "Pomoć",
    "CMD_CHECK_FOR_UPDATE"                : "Provjeri postoji li novija verzija",
    "CMD_HOW_TO_USE_BRACKETS"             : "Kako koristiti {APP_NAME}",
    "CMD_SUPPORT"                         : "{APP_NAME} Podrška (na engleskom)",
    "CMD_SUGGEST"                         : "Predloži mogućnost / značajku",
    "CMD_RELEASE_NOTES"                   : "Bilješke o trenutnoj verziji",
    "CMD_GET_INVOLVED"                    : "Uključi se",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Prikaži direktorij sa ekstenzijama",
    "CMD_TWITTER"                         : "{TWITTER_NAME} na Twitteru",
    "CMD_ABOUT"                           : "O programu {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Otvori Preferencije",
    "CMD_OPEN_KEYMAP"                     : "Otvori Svoje Postavke Tipki*",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "experimentalna verzija",
    "DEVELOPMENT_BUILD"                    : "razvojna verzija",
    "RELOAD_FROM_DISK"                     : "Ponovo učitaj sa diska",
    "KEEP_CHANGES_IN_EDITOR"               : "Sačuvaj izmjene u Editoru",
    "CLOSE_DONT_SAVE"                      : "Zatvori (Nemoj sačuvati)",
    "RELAUNCH_CHROME"                      : "Ponovo pokreni Chrome",
    "ABOUT"                                : "O aplikaciji",
    "CLOSE"                                : "Zatvori",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Obavijesti, obaveze i uvjeti korištenja koji se odnose na third party softver su locirani na <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> i uključeni su ovdje putem linka.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentacija i izvorni kôd na <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Napravili sa \u2764 i JavaScriptom:",
    "ABOUT_TEXT_LINE6"                     : "Mnogo ljudi (ali trenutno imamo poteškoća sa učitavanjem tih podataka).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs i Web Platform graphical logo su zaštićeni pod Creative Commons Attribution licencom, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Dostupna je nova verzija aplikacije {APP_NAME}! Kliknite ovdje za detalje.",
    "UPDATE_AVAILABLE_TITLE"               : "Novija verzija je dostupna",
    "UPDATE_MESSAGE"                       : "Nova verzija aplikacije {APP_NAME} je dostupna. Ovo su neke od najnovijih izmjena:",
    "GET_IT_NOW"                           : "Preuzmi sada!",
    "PROJECT_SETTINGS_TITLE"               : "Postavke projekta za: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Osnovna URL adresa za prikaz uživo",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Da biste koristili lokalni server unesite adresu (url) kao http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Prikaz uživo ne podržava protokol {0} &mdash; koristite http: or https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "Osnovna URL adresa ne smije sadržavati parametre za traženje poput \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "Osnovna URL adresa ne smije sadržavati hasheve (hashes) poput \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Posebni znakovi kao '{0}' moraju biti %-enkodirani.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Nepoznata greška prilikom parsiranja osnovne URL adrese",
    "EMPTY_VIEW_HEADER"                    : "<em>Otvori datoteku dok je ovaj panel u fokusu</em>",

    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Trenutna Tema",
    "USE_THEME_SCROLLBARS"                 : "Koristi scrollbarove teme",
    "FONT_SIZE"                            : "Veličina Fonta",
    "FONT_FAMILY"                          : "Obitelj Fonta",
    "THEMES_SETTINGS"                      : "Postavke Teme",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Novo Pravilo",

    // Extension Management strings
    "INSTALL"                              : "Instaliraj",
    "UPDATE"                               : "Obnovi",
    "REMOVE"                               : "Makni",
    "DISABLE"                              : "Onemogući",
    "ENABLE"                               : "Omogući",
    "OVERWRITE"                            : "Piši preko",
    "CANT_REMOVE_DEV"                      : "Extenzije u \"dev\" mapi moraju biti ručno obrisane.",
    "CANT_UPDATE"                          : "Novija verzija nije kompatibilna sa trenutnom verzijom aplikacije {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Extenzije u \"dev\" mapi ne mogu biti automatski ažurirane.",
    "INSTALL_EXTENSION_TITLE"              : "Instaliraj Extenziju",
    "UPDATE_EXTENSION_TITLE"               : "Ažuriraj Extenziju",
    "INSTALL_EXTENSION_LABEL"              : "Link Extenzije",
    "INSTALL_EXTENSION_HINT"               : "Link zip arhive extenzije ili GitHub repozitorija",
    "INSTALLING_FROM"                      : "Instaliranje extenzije sa {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Instalacija je uspjela!",
    "INSTALL_FAILED"                       : "Instalacija nije uspjela.",
    "CANCELING_INSTALL"                    : "Otkazivanje\u2026",
    "CANCELING_HUNG"                       : "Otkazivanje instalacije traje predugo. Vjerojatno je došlo do unutarnje greške.",
    "INSTALL_CANCELED"                     : "Instalacija je otkazana.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Preuzeti sadržaj nije valjana zip arhiva.",
    "INVALID_PACKAGE_JSON"                 : "package.json datoteka nije valjana (greška je bila: {0}).",
    "MISSING_PACKAGE_NAME"                 : "package.json datoteka nije navela ime paketa.",
    "BAD_PACKAGE_NAME"                     : "{0} nije valjano ime za paket.",
    "MISSING_PACKAGE_VERSION"              : "package.json datoteka nije navela verziju paketa.",
    "INVALID_VERSION_NUMBER"               : "Verzija paketa broj ({0}) nije valjana.",
    "INVALID_BRACKETS_VERSION"             : "Niz o kompatibilnosti ({0}) aplikacije {APP_NAME} nije valjan.",
    "DISALLOWED_WORDS"                     : "Riječi ({1}) nisu dozvoljene u polju {0}.",
    "API_NOT_COMPATIBLE"                   : "Ova extenzija nije kompatibilna sa ovom verzijom aplikacije {APP_NAME}. Instalirana je u vašu mapu onemogućenih extenzija.",
    "MISSING_MAIN"                         : "Paket nema main.js datoteku.",
    "EXTENSION_ALREADY_INSTALLED"          : "Instaliranjem ovog paketa ćete presnimiti prethodno instaliranu verziju. Da li želite presnimiti staru extenziju?",
    "EXTENSION_SAME_VERSION"               : "Verzija ovog paketa je ista kao verzija koja je trenutno instalirana. Da li želite presnimiti postojeću instalaciju?",
    "EXTENSION_OLDER_VERSION"              : "Ovaj paket je verzija {0} što je starije od trenutno instalirane verzije ({1}). Želite li presnimiti postojeću instalaciju?",
    "DOWNLOAD_ID_IN_USE"                   : "Unutarnja greška: ID preuzimanja je već u upotrebi.",
    "NO_SERVER_RESPONSE"                   : "Povezivanje sa serverom nije moguće.",
    "BAD_HTTP_STATUS"                      : "Datoteka nije pronađena na serveru (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Nije moguće sačuvati preuzete podatke u privremenu datoteku.",
    "ERROR_LOADING"                        : "Extenzija je naišla na grešku prilikom pokretanja.",
    "MALFORMED_URL"                        : "URL nije valjan. Molimo provjerite da li ste ga unjeli točno.",
    "UNSUPPORTED_PROTOCOL"                 : "URL mora biti http ili https URL.",
    "UNKNOWN_ERROR"                        : "Nepoznata unutarnja greška.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Manager extenzija",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Pristupanje registru extenzije nije moguće. Pokušajte kasnije.",
    "INSTALL_EXTENSION_DRAG"               : "Dovuci .zip ovdje ili",
    "INSTALL_EXTENSION_DROP"               : "Ispusti .zip da instaliraš",
    "INSTALL_FROM_URL"                     : "Instaliraj sa URL linka\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Datum",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Ova extenzija zahtjeva noviju verziju aplikacije {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Ova extenzija trenutno radi samo sa starijom verzijom aplikacije {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Verzija {0} ove extenzije traži noviju verziju aplikacije {APP_NAME}. Ali možete instalirati raniju verziju {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Verzija {0} ove extenzije radi samo sa starijim verzijama aplikacije {APP_NAME}. Ali možete instalirati raniju verziju {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Nema opisa",
    "EXTENSION_MORE_INFO"                  : "Više informacija...",
    "EXTENSION_ERROR"                      : "Greška u extenziji",
    "EXTENSION_KEYWORDS"                   : "Ključne riječi",
    "EXTENSION_INSTALLED"                  : "Instalirano",
    "EXTENSION_UPDATE_INSTALLED"           : "Ova verzija extenzije već je preuzeta i bit će instalirana nakon što se {APP_NAME} ponovo učita.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Traži",
    "EXTENSION_MORE_INFO_LINK"             : "Više",
    "BROWSE_EXTENSIONS"                    : "Pretraži Extenzije",
    "EXTENSION_MANAGER_REMOVE"             : "Ukloni Extenziju",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Nemoguće je ukloniti jednu ili više extenzija: {0}. {APP_NAME} će se svejedno ponovo učitati.",
    "EXTENSION_MANAGER_UPDATE"             : "Obnovi extenziju",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Nije moguće obnoviti jednu ili više extenzija: {0}. {APP_NAME} će se svejedno ponovno učitati.",
    "MARKED_FOR_REMOVAL"                   : "Označeno za uklanjanje",
    "UNDO_REMOVE"                          : "Poništi",
    "MARKED_FOR_UPDATE"                    : "Označeno za ažuriranje",
    "UNDO_UPDATE"                          : "Poništi",
    "CHANGE_AND_RELOAD_TITLE"              : "Promjeni extenzije",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Da biste obnovili ili uklonili označene extenzije, {APP_NAME} će se trebati ponovo učitati. Bit ćete zatraženi da sačuvate nesačuvane promjene.",
    "REMOVE_AND_RELOAD"                    : "Ukloni extenzije i ponovno učitaj",
    "CHANGE_AND_RELOAD"                    : "Promjeni extenzije i ponovo učitaj",
    "UPDATE_AND_RELOAD"                    : "Obnovi extenzije i ponovo učitaj",
    "PROCESSING_EXTENSIONS"                : "Obrađivanje promjene extenzije\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Nemoguće je ukloniti extenziju {0} jer nije bila instalirana.",
    "NO_EXTENSIONS"                        : "Trenutno nema instaliranih extenzija.<br>Kliknite iznad na karticu Dostupno da dodate extenziju.",
    "NO_EXTENSION_MATCHES"                 : "Nijedna extenzija se ne poklapa sa unesenim parametrima pretrage.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Budite oprezni prilikom instalacije extenzija koje potječu iz nepoznatih izvora.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Instalirano",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Dostupno",
    "EXTENSIONS_THEMES_TITLE"              : "Teme",
    "EXTENSIONS_UPDATES_TITLE"             : "Obnovljene verzije",

    "INLINE_EDITOR_NO_MATCHES"             : "Poklapanja nisu nađena.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Nema postojećih CSS pravila koji odgovaraju vašem odabiru.<br> Kliknite \"New Rule\" da biste ih stvorili.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Ne postoje stilovi u vašem projektu.<br>Stvorite jedan da dodate CSS pravila.",


    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON" : "najveća",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixela",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Otklanjanje grešaka",
    "CMD_SHOW_DEV_TOOLS"                        : "Prikaži razvojne alate",
    "CMD_REFRESH_WINDOW"                        : "Ponovo učitaj sa ekstenzijama",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Ponovo učitaj bez ekstenzija",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Novi {APP_NAME} Prozor",
    "CMD_SWITCH_LANGUAGE"                       : "Promjeni jezik",
    "CMD_RUN_UNIT_TESTS"                        : "Testiraj",
    "CMD_SHOW_PERF_DATA"                        : "Prikaži podatke o performansama",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Uključi Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Zapiši u konzolu stanje Node-a",
    "CMD_RESTART_NODE"                          : "Ponovo pokreni Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Prikaži greške u statusnoj traci",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Otvori Brackets Izvor",

    "LANGUAGE_TITLE"                            : "Promjeni Jezik",
    "LANGUAGE_MESSAGE"                          : "Jezik:",
    "LANGUAGE_SUBMIT"                           : "Ponovo učitaj {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Otkaži",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Zadani jezik",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Vrijeme",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Napredak",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Pomakni odabranu točku<br><kbd class='text'>Shift</kbd> Pomakni za 10 jedinica<br><kbd class='text'>Tab</kbd> Zamijeni točke.",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Povećaj ili smanji korake<br><kbd>←</kbd><kbd>→</kbd> 'Početak' ili 'Kraj'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Stara vrijednost <code>{0}</code> nije valjana, tako da je prikazana funkcija promjenjena u <code>{1}</code>. Dokument će biti ažuriran kod prvog uređivanja.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Trenutna boja",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Originalna boja",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa Format",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex Format",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa Format",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Korištena {1} put)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Korištena {1} puta)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Skoči na definiciju",
    "CMD_SHOW_PARAMETER_HINT"                   : "Pokaži naznake (hintove) parametara",
    "NO_ARGUMENTS"                              : "<bez parametara>",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Brzi 'lebdeći' (hover) prikaz",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Nedavni projekti",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Pročitaj više",

    // extensions/default/CodeFolding
    "COLLAPSE_ALL"                  : "Skupi Sve",
    "EXPAND_ALL"                    : "Proširi Sve",
    "COLLAPSE_CURRENT"              : "Skupi Trenutno",
    "EXPAND_CURRENT"                : "Proširi Trenutno",
});

/* Last translated for a57bd8888da0b44f382e591c64b394b065178277 */
