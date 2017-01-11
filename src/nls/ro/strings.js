/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR"                     : "(eroare {0})",
    "NOT_FOUND_ERR"                     : "Fișierul nu a fost găsit.",
    "NOT_READABLE_ERR"                  : "Fișierul nu poate fi citit.",
    "EXCEEDS_MAX_FILE_SIZE"             : "Fișierele mai mari de {0} MO nu pot fi deschise în {APP_NAME}.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Nu sunt permise modificări în directoriul curent.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Nu aveți destule drepturi pentru a face modificări.",
    "CONTENTS_MODIFIED_ERR"             : "Fișierul a fost modificat din afara la {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} suportă, pentru moment, doar fișierele textuale codificate cu UTF-8.",
    "FILE_EXISTS_ERR"                   : "Fișierul sau directoriul există deja.",
    "FILE"                              : "fișier",
    "FILE_TITLE"                        : "Fișier",
    "DIRECTORY"                         : "directoriu",
    "DIRECTORY_TITLE"                   : "Directoriu",
    "DIRECTORY_NAMES_LEDE"              : "Denumirile directoriilor",
    "FILENAMES_LEDE"                    : "Denumirile fișierelor",
    "FILENAME"                          : "nume fișier",
    "DIRECTORY_NAME"                    : "nume directoriu",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Eroare la încărcarea proiectului",
    "OPEN_DIALOG_ERROR"                 : "S-a produs o eroare la afișarea dialogului de deschidere a fișierelor. (eroare {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "S-a produs o eroare la încărcarea directoriului <span class='dialog-filename'>{0}</span>. (eroare {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "S-a produs o eroare la citirea conținutului directoriului <span class='dialog-filename'>{0}</span>. (eroare {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Eroare la deschiderea fișierului",
    "ERROR_OPENING_FILE"                : "S-a produs o eroare la încercarea de a deschide fișierul <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "S-a produs o eroare la încercarea de a deschide următoarele fișiere:",
    "ERROR_RELOADING_FILE_TITLE"        : "Eroare la reîncărcarea schimbărilor de pe disc",
    "ERROR_RELOADING_FILE"              : "S-a produs o eroare la încercarea reîncărcării fișierului <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Eroare la salvarea fișierului",
    "ERROR_SAVING_FILE"                 : "S-a produs o eroare la încercarea de a salva fișierul <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Eroare la redenumirea fișierului",
    "ERROR_RENAMING_FILE"               : "S-a produs o eroare la încercarea de a redenumi fișierul <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Eroare la ștergerea fișierului",
    "ERROR_DELETING_FILE"               : "S-a produs o eroare la încercarea de a șterge fișierul <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Numele {0} e invalid",
    "INVALID_FILENAME_MESSAGE"          : "Numele fișierului nu poate conține următoarele caractere: {0} sau să fie un cuvânt rezervat de sistemul de operare.",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "Un fișier sau un directoriu cu numele <span class='dialog-filename'>{0}</span> există deja.",
    "ERROR_CREATING_FILE_TITLE"         : "Eroare la crearea fișierului {0}",
    "ERROR_CREATING_FILE"               : "S-a produs o eroare la încercarea de a crea fișierul {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP"              : "Imposibil de a deschide un directoriu dacă sunt fișiere deschise.",

    // User key map error strings
    "ERROR_KEYMAP_TITLE"                : "Eroare la citirea tastelor definite de utilizator",
    "ERROR_KEYMAP_CORRUPT"              : "Conținutul fișierului pentru maparea tastelor nu e un JSON valid. Fișierul va fi deschis pentru a corecta conținutul lui.",
    "ERROR_LOADING_KEYMAP"              : "Fișierul pentru maparea tastelor nu poate fi încărcat deoarece nu este codificat în formatul UTF-8.",
    "ERROR_RESTRICTED_COMMANDS"         : "Tastele rapide pentru următoarele comenzi nu pot fi realocate: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"        : "Imposibil de realocat următoarele taste rapide: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"          : "Au fost realocate prea multe taste rapide pentru următoarele comenzi: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"         : "Au fost realocate mai multe taste rapide pentru următoarele comenzi: {0}",
    "ERROR_INVALID_SHORTCUTS"           : "Următoarele taste rapide nu sunt valide: {0}",
    "ERROR_NONEXISTENT_COMMANDS"        : "Au fost alocate taste rapide pentru comenzi inexistente: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Eroare la citirea preferințelor",
    "ERROR_PREFS_CORRUPT"               : "Fișierul cu preferințe nu e un JSON valid. Fișierul va fi deschis pentru a corecta formatul. Pentru ca schimbările să aibă loc {APP_NAME} va trebui relansat.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} nu a fost lansat pentru browser încă.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} e construit în HTML, dar acum rulează ca o aplicație desktop și poate fi folosit pentru a edita fișierele locale. Lansați interpretatorul de comenzi al aplicației din repozitoriul <b>github.com/adobe/brackets-shell</b> pentru a rula {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Eroare la indexarea fișierelor",
    "ERROR_MAX_FILES"                   : "Ați atins numărul maxim de fișiere indexate. Acțiunile pentru căutarea fișierelor în index ar putea lucra incorect.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Eroare la lansarea browser-ului",
    "ERROR_CANT_FIND_CHROME"            : "Browser-ul Google Chrome nu a putut fi găsit. Asigurați-vă că el este instalat.",
    "ERROR_LAUNCHING_BROWSER"           : "S-a produs o eroare la lansarea browser-ului. (eroare {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Eroare la lansarea Live Preview",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Conectare la browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Pentru a lansa Live Preview Google Chrome trebuie să fie relansat cu opțiunea de depanarea la distanță activată.<br /><br />Doriți ca Google Chrome să fie relansat cu opțiunea de depanare la distanță activată?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Imposibil de a încărca pagina Live Development",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Deschideți un fișier HTML sau asigurați-vă că există un fișier index.html în proiect pentru a lansa Live Preview.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Pentru a lansa Live Preview cu un fișier server-side, e necesar de a specifica un URL de bază pentru acest proiect.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Eroare la lansarea serverului HTTP pentru editarea în direct a fișierelor. Mai încercați o dată.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Bun venit la Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview conectează {APP_NAME} la browser-ul tău. El lansează o previzualizare a fișierului HTML, apoi, imediat, la editare codului actualizează previzualizarea.<br /><br />În această versiune timpurie {APP_NAME}, Live Preview funcționează doar cu <strong>Google Chrome</strong> și actualizează imediat <strong>fișierele CSS sau HTML</strong>. Schimbările în fișierele JavaScript sunt reîncărcate automat la salvare.<br /><br />(Veți vedea acest mesaj o singură dată.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Pentru mai multe informații, vezi <a href='{0}' title='{0}'>Depanarea erorilor de conexiune în Live Development</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Conectare\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Inițializare\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Deconectare Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview (salvează fișierul pentru actualizare)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Preview (nu poate fi reînnoit din cauza unei erori de sintaxă)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Live Preview a fost revocat din cauza că în browser au fost deschise uneltele pentru dezvoltatori",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Live Preview a fost revocat din cauza că pagina a fost închisă în browser",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Live Preview a fost revocat din cauza că browser-ul a navigat spre o pagină care nu face parte din proiectul curent",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Live Preview a fost revocat dintr-un motiv necunoscut ({0})",

    "SAVE_CLOSE_TITLE"                  : "Salvare modificări",
    "SAVE_CLOSE_MESSAGE"                : "Doriți să salvați modificările făcute în documentul <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Doriți să salvați modificările din următoarele fișiere?",
    "EXT_MODIFIED_TITLE"                : "Modificări externe",
    "CONFIRM_DELETE_TITLE"              : "Confirmare ștergere dosar",
    "CONFIRM_FOLDER_DELETE"             : "Sunteți sigur că doriți să ștergeți dosarul <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Fișier șters",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> a fost modificat pe disc.<br /><br />Doriți să salvați fișierul și să suprascrieți aceste modificări?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> a fost modificat pe disc, dar, deasemenea, are modificări nesalvate în {APP_NAME}.<br /><br />Care versiune doriți să o păstrați?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> a fost șters de pe disc, dar are modificări nesalvate în {APP_NAME}.<br /><br />Doriți să păstrați modificările?",

    // Generic dialog/button labels
    "DONE"                              : "Terminat",
    "OK"                                : "OK",
    "CANCEL"                            : "Revocare",
    "DONT_SAVE"                         : "Nu salva",
    "SAVE"                              : "Salvează",
    "SAVE_AS"                           : "Salvează ca\u2026",
    "SAVE_AND_OVERWRITE"                : "Suprascrie",
    "DELETE"                            : "Șterge",
    "BUTTON_YES"                        : "Da",
    "BUTTON_NO"                         : "Nu",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                  : "{0} din {1}",
    "FIND_NO_RESULTS"                   : "Niciun rezultat",
    "FIND_QUERY_PLACEHOLDER"            : "Găsește\u2026",
    "REPLACE_PLACEHOLDER"               : "Înlocuiește cu\u2026",
    "BUTTON_REPLACE_ALL"                : "Tot\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Înlocuiește\u2026",
    "BUTTON_REPLACE"                    : "Înlocuiește",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Potrivirea următoare",
    "BUTTON_PREV_HINT"                  : "Potrivirea precedentă",
    "BUTTON_CASESENSITIVE_HINT"         : "Potrivire litere",
    "BUTTON_REGEXP_HINT"                : "Expresie regulată",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Înlocuiește fără întoarcere",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Dat fiind faptul că mai mult de {0} fișiere trebuie să fie modificate, {APP_NAME} va modifica fișierele non deschise pe disc.<br />Înlocuirile în aceste fișiere nu vor putea fi anulate.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Înlocuiește fără întoarcere",

    "OPEN_FILE"                         : "Deschide un fișier",
    "SAVE_FILE_AS"                      : "Salvează fișierul",
    "CHOOSE_FOLDER"                     : "Alege un dosar",

    "RELEASE_NOTES"                     : "Notele ediției",
    "NO_UPDATE_TITLE"                   : "Aplicația e la zi!",
    "NO_UPDATE_MESSAGE"                 : "Utilizați ultima versiune {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Înlocuiește",
    "FIND_REPLACE_TITLE_WITH"           : "cu",
    "FIND_TITLE_LABEL"                  : "S-a găsit",
    "FIND_TITLE_SUMMARY"                : ": {0} {1} {2} în {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "în <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "în proiect",
    "FIND_IN_FILES_ZERO_FILES"          : "Filtrul exclude toate {0} fișiere",
    "FIND_IN_FILES_FILE"                : "fișier",
    "FIND_IN_FILES_FILES"               : "fișiere",
    "FIND_IN_FILES_MATCH"               : "potrivire",
    "FIND_IN_FILES_MATCHES"             : "potriviri",
    "FIND_IN_FILES_MORE_THAN"           : "Peste ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd clic pentru a extinde/restrânge toate",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Erori la înlocuire",
    "REPLACE_IN_FILES_ERRORS"           : "Următoarele fișiere nu au fost modificate pentru că acestea au fost modificate după căutare sau nu pot fi rescrise.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Eroare la primirea informațiilor despre actualizare",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "S-a produs o eroare la primirea informațiilor despre actualizare de la server. Asigurați-vă că sunteți conectat la internet și să mai încercați o dată.",

    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Set nou de excludere\u2026",
    "CLEAR_FILE_FILTER"                 : "Nu exclude fișierele",
    "NO_FILE_FILTER"                    : "Niciun fișier exclus",
    "EXCLUDE_FILE_FILTER"               : "Exclude {0}",
    "EDIT_FILE_FILTER"                  : "Editează\u2026",
    "FILE_FILTER_DIALOG"                : "Editare set de excludere",
    "FILE_FILTER_INSTRUCTIONS"          : "Exclude fișierele și directoriile care se potrivesc șirurilor / subșirurilor sau <a href='{0}' title='{0}'>metacaracterelor</a> următoare. Introduceți fiecare șir într-o linie nouă.",
    "FILTER_NAME_PLACEHOLDER"           : "Denumește acest set de excludere (opțional)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "și {0} încă",
    "FILTER_COUNTING_FILES"             : "Numărul fișierelor\u2026",
    "FILTER_FILE_COUNT"                 : "Permite {0} din {1} fișiere {2}",
    "FILTER_FILE_COUNT_ALL"             : "Permite toate {0} fișiere {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Funcția de editare rapidă nu e disponibilă pe poziția curentă a cursorului",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "Editare rapidă CSS: plasează cursorul pe un singur nume de clasă",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "Editare rapidă CSS: atributul \"class\" e incomplet",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "Editare rapidă CSS: atributul \"id\" e incomplet",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "Editare rapidă CSS: plasează cursorul în tag, class, sau id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "Funcția de ediare rapidă a întîrzierii CSS: sintaxă invalidă",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "Editare rapidă JS: plasează cursorul în numele funcției",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Funcția de documentare rapidă nu e disponibilă pe poziția curentă a cursorului",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Încărcare\u2026",
    "UNTITLED"          : "Neintitulat",
    "WORKING_FILES"     : "Fișierele active",

    /**
     * MainViewManager
     */
    "TOP"               : "Sus",
    "BOTTOM"            : "Jos",
    "LEFT"              : "Stânga",
    "RIGHT"             : "Dreapta",

    "CMD_SPLITVIEW_NONE"        : "Fără divizare",
    "CMD_SPLITVIEW_VERTICAL"    : "Divizare verticală",
    "CMD_SPLITVIEW_HORIZONTAL"  : "Divizare orizontală",
    "SPLITVIEW_MENU_TOOLTIP"    : "Divizare verticală și orizontală",
    "GEAR_MENU_TOOLTIP"         : "Configurează setul de lucru",

    "SPLITVIEW_INFO_TITLE"              : "Deja deschis",
    "SPLITVIEW_MULTIPANE_WARNING"       : "Fișierul este deja deschis în alt panou. {APP_NAME} va suporta în curând dechiderea unui fișier în mai multe panouri. Până atunci, fișierul va fi arătat doar în panoul în care a fost deschis.<br /><br />(Acest mesaj va fi afișat o singură dată.)",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Spațiu",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Rândul {0}, Coloana {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} coloană selectată",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} coloane selectate",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} rând selectat",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} rânduri selectate",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} selecții",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Comută la indentarea prin spații",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Comută la indentarea prin tab-uri",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Modifica numărul de spații folosit pentru indentare",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Modifica lățimea caracterului tab",
    "STATUSBAR_SPACES"                      : "Spații:",
    "STATUSBAR_TAB_SIZE"                    : "Tab-uri:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} rând",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} rânduri",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Extensii dezactivate",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "RSC",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Clic pentru a modifica cursorul între modul de Inserare(INS) și modul de Rescriere(RSC)",
    "STATUSBAR_LANG_TOOLTIP"                : "Clic pentru a modifica tipul fișierului",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Clic pentru a arăta / ascunde panoul de rapoarte.",
    "STATUSBAR_DEFAULT_LANG"                : "(implicit)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Setează ca implicit pentru fișierele .{0}",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} probleme",
    "SINGLE_ERROR"                          : "1 eroare {0}",
    "MULTIPLE_ERRORS"                       : "{1} erori {0}",
    "NO_ERRORS"                             : "Nicio eroare {0} - bine lucrat!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Nicio eroare găsită - bine lucrat!",
    "LINT_DISABLED"                         : "Verificarea codului e dezactivată",
    "NO_LINT_AVAILABLE"                     : "Verificarea codului e indisponibilă pentru {0}",
    "NOTHING_TO_LINT"                       : "Nimic de verificat",
    "LINTER_TIMED_OUT"                      : "Timp de așteptare depășit pentru {0} după o întârziere de {1} ms",
    "LINTER_FAILED"                         : "{0} finisat cu eroarea: {1}",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Fișier",
    "CMD_FILE_NEW_UNTITLED"               : "Nou",
    "CMD_FILE_NEW"                        : "Fișier nou",
    "CMD_FILE_NEW_FOLDER"                 : "Dosar nou",
    "CMD_FILE_OPEN"                       : "Deschide\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Adaugă la setul de lucru și deschide",
    "CMD_OPEN_DROPPED_FILES"              : "Deschide fișierele depuse",
    "CMD_OPEN_FOLDER"                     : "Deshide un dosar\u2026",
    "CMD_FILE_CLOSE"                      : "Închide",
    "CMD_FILE_CLOSE_ALL"                  : "Închide tot",
    "CMD_FILE_CLOSE_LIST"                 : "Închide lista",
    "CMD_FILE_CLOSE_OTHERS"               : "Închide celelalte",
    "CMD_FILE_CLOSE_ABOVE"                : "Închide cele de mai sus",
    "CMD_FILE_CLOSE_BELOW"                : "Închide cele de mai jos",
    "CMD_FILE_SAVE"                       : "Salvează",
    "CMD_FILE_SAVE_ALL"                   : "Salvează tot",
    "CMD_FILE_SAVE_AS"                    : "Salvează ca\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Previzualizare interactivă",
    "CMD_RELOAD_LIVE_PREVIEW"             : "Forțează relansarea previzualizării interactive",
    "CMD_PROJECT_SETTINGS"                : "Setările proiectului\u2026",
    "CMD_FILE_RENAME"                     : "Redenumește",
    "CMD_FILE_DELETE"                     : "Șterge",
    "CMD_INSTALL_EXTENSION"               : "Instalează extensia\u2026",
    "CMD_EXTENSION_MANAGER"               : "Managerul de extensii\u2026",
    "CMD_FILE_REFRESH"                    : "Actualizează arborele de fișiere",
    "CMD_QUIT"                            : "Ieșire",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Ieșire",

    // Edit menu commands
    "EDIT_MENU"                           : "Editare",
    "CMD_UNDO"                            : "Anulează",
    "CMD_REDO"                            : "Refă",
    "CMD_CUT"                             : "Taie",
    "CMD_COPY"                            : "Copiază",
    "CMD_PASTE"                           : "Lipește",
    "CMD_SELECT_ALL"                      : "Selectează tot",
    "CMD_SELECT_LINE"                     : "Selectează rând",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Împarte selecția în linii",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Adaugă cursor la linia următoare",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Adaugă cursor la linia precedentă",
    "CMD_INDENT"                          : "Indentează",
    "CMD_UNINDENT"                        : "Deindentează",
    "CMD_DUPLICATE"                       : "Dublează",
    "CMD_DELETE_LINES"                    : "Șterge rândurile",
    "CMD_COMMENT"                         : "Comută comentariul pentru rând",
    "CMD_BLOCK_COMMENT"                   : "Comută comentariul pentru bloc",
    "CMD_LINE_UP"                         : "Mută pe rândul de mai sus",
    "CMD_LINE_DOWN"                       : "Mută pe rândul de mai jos",
    "CMD_OPEN_LINE_ABOVE"                 : "Deschide rândul de mai sus",
    "CMD_OPEN_LINE_BELOW"                 : "Deschide rândul de mai jos",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Închide automat perechile de caractere",
    "CMD_SHOW_CODE_HINTS"                 : "Arată sugestiile de cod",

    // Search menu commands
    "FIND_MENU"                           : "Căutare",
    "CMD_FIND"                            : "Caută",
    "CMD_FIND_NEXT"                       : "Caută următorul",
    "CMD_FIND_PREVIOUS"                   : "Caută precedentul",
    "CMD_FIND_ALL_AND_SELECT"             : "Caută tot și selectează",
    "CMD_ADD_NEXT_MATCH"                  : "Adaugă următoarea potrivire la selecție",
    "CMD_SKIP_CURRENT_MATCH"              : "Omite și adaugă următoarea potrivire",
    "CMD_FIND_IN_FILES"                   : "Caută în fișiere",
    "CMD_FIND_IN_SUBTREE"                 : "Caută în\u2026",
    "CMD_REPLACE"                         : "Înlocuiește",
    "CMD_REPLACE_IN_FILES"                : "Înlocuiește în fișiere",
    "CMD_REPLACE_IN_SUBTREE"              : "Înlocuiește în\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Vizualizare",
    "CMD_HIDE_SIDEBAR"                    : "Ascunde bara laterală",
    "CMD_SHOW_SIDEBAR"                    : "Arată bara laterală",
    "CMD_INCREASE_FONT_SIZE"              : "Mărește dimensiunea font-ului",
    "CMD_DECREASE_FONT_SIZE"              : "Micșorează dimensiunea font-ului",
    "CMD_RESTORE_FONT_SIZE"               : "Resetează dimensiunea font-ului",
    "CMD_SCROLL_LINE_UP"                  : "Rulează o linie în sus",
    "CMD_SCROLL_LINE_DOWN"                : "Rulează o linie în jos",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Numerotează rândurile",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Evidențiază rândul activ",
    "CMD_TOGGLE_WORD_WRAP"                : "Potrivește cuvintele în rând",
    "CMD_LIVE_HIGHLIGHT"                  : "Evidențiere Live Preview",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Verifică codul din fișiere la salvare",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Sortare după adăugare",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Sortare după nume",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Sortare după tip",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Sortare automată",
    "CMD_THEMES"                          : "Teme\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navigare",
    "CMD_QUICK_OPEN"                      : "Deshidere rapidă",
    "CMD_GOTO_LINE"                       : "Mergi la rândul",
    "CMD_GOTO_DEFINITION"                 : "Acces rapid la definiție",
    "CMD_GOTO_FIRST_PROBLEM"              : "Mergi la prima eroare/primul avertisment",
    "CMD_TOGGLE_QUICK_EDIT"               : "Editare rapidă",
    "CMD_TOGGLE_QUICK_DOCS"               : "Documentație rapidă",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Potrivirea precedentă",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Potrivirea următoare",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Regulă nouă",
    "CMD_NEXT_DOC"                        : "Documentul următor",
    "CMD_PREV_DOC"                        : "Documentul precedent",
    "CMD_SHOW_IN_TREE"                    : "Arată în arborele de fișiere",
    "CMD_SHOW_IN_EXPLORER"                : "Arată în Explorer",
    "CMD_SHOW_IN_FINDER"                  : "Arată în Finder",
    "CMD_SHOW_IN_OS"                      : "Arată în sistemul de operare",

    // Help menu commands
    "HELP_MENU"                           : "Ajutor",
    "CMD_CHECK_FOR_UPDATE"                : "Verifică pentru actualizări",
    "CMD_HOW_TO_USE_BRACKETS"             : "Cum să folosești {APP_NAME}",
    "CMD_SUPPORT"                         : "Suport {APP_NAME}",
    "CMD_SUGGEST"                         : "Sugerează o funcționalitate",
    "CMD_RELEASE_NOTES"                   : "Notele ediției",
    "CMD_GET_INVOLVED"                    : "Participă la proiect",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Deschide dosarul cu extensii",
    "CMD_HOMEPAGE"                        : "Pagina de start {APP_TITLE}",
    "CMD_TWITTER"                         : "{TWITTER_NAME} în Twitter",
    "CMD_ABOUT"                           : "Despre {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Deschide fișierul cu preferințe",
    "CMD_OPEN_KEYMAP"                     : "Deschide maparea tastelor",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "versiune experimentală",
    "RELEASE_BUILD"                        : "versiune",
    "DEVELOPMENT_BUILD"                    : "versiune în dezvoltare",
    "RELOAD_FROM_DISK"                     : "Reîncarcă de pe disc",
    "KEEP_CHANGES_IN_EDITOR"               : "Păstrează modificările în editor",
    "CLOSE_DONT_SAVE"                      : "Închide (Nu salva)",
    "RELAUNCH_CHROME"                      : "Relansează Google Chrome",
    "ABOUT"                                : "Despre",
    "CLOSE"                                : "Închide",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "amprenta de timp a versiunii: ",
    "ABOUT_TEXT_LINE3"                     : "Notițele, termenii și condițiile ce țin de părțile software terțe sunt localizate la <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> și sunt adăugate aici ca referință.",
    "ABOUT_TEXT_LINE4"                     : "Documentația și sursa se găsesc la <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Creat cu \u2764 și JavaScript de:",
    "ABOUT_TEXT_LINE6"                     : "O mulțime de oameni (dar avem dificultăți la încărcarea datelor despre ei acum).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs și logotipul Web Platform sunt licențiați sub licența Creative Commons Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Există o versiune nouă {APP_NAME} disponibilă! Clic aici pentru detalii.",
    "UPDATE_AVAILABLE_TITLE"               : "Înnoire disponibilă",
    "UPDATE_MESSAGE"                       : "Hei, o nouă versiune {APP_NAME} disponibilă. Aici sunt o parte din noile posibilități:",
    "GET_IT_NOW"                           : "Descarcă acum!",
    "PROJECT_SETTINGS_TITLE"               : "Setările pentru proiectul \"{0}\"",
    "PROJECT_SETTING_BASE_URL"             : "URL-ul de bază pentru Live Preview",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Server local, exemplu: \"http://localhost:8000/\"",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Protocolul {0} nu e suportat de Live Preview &mdash; folosiți HTTP sau HTTPS.",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL-ul de bază nu poate conține parametri pentru căutare ca \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL-ul de bază nu poate conține caracterul diez ca \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Caracterele speciale ca '{0}' trebuie să fie codificate cu %.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Eroare necunoscută la analiza URL-ului de bază",
    "EMPTY_VIEW_HEADER"                    : "<em>Selectați un fișier cât această vedere e activă</em>",

    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Tema curentă",
    "USE_THEME_SCROLLBARS"                 : "Folosește barele de derulare ale temei",
    "FONT_SIZE"                            : "Mărimea fontului",
    "FONT_FAMILY"                          : "Familia fontului",
    "THEMES_SETTINGS"                      : "Setările temei",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Regulă nouă",

    // Extension Management strings
    "INSTALL"                              : "Instalare",
    "UPDATE"                               : "Actualizare",
    "REMOVE"                               : "Dezinstalare",
    "OVERWRITE"                            : "Rescriere",
    "CANT_REMOVE_DEV"                      : "Extensiile din dosarul \"dev\" trebuie să fie șterse manual.",
    "CANT_UPDATE"                          : "Înnoirea nu e compatibilă cu versiunea curentă {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Extensiile din mapa \"dev\" nu pot fi înnoite automat.",
    "INSTALL_EXTENSION_TITLE"              : "Instalare extensie",
    "UPDATE_EXTENSION_TITLE"               : "Actualizare extensie",
    "INSTALL_EXTENSION_LABEL"              : "URL-ul extensiei",
    "INSTALL_EXTENSION_HINT"               : "URL-ul arhivei zip a extensiei sau a repozitoriului GitHub",
    "INSTALLING_FROM"                      : "Instalarea extensiei din {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Instalare cu succes!",
    "INSTALL_FAILED"                       : "Instalarea a eșuat.",
    "CANCELING_INSTALL"                    : "În curs de revocare\u2026",
    "CANCELING_HUNG"                       : "Revocarea instalării durează prea mult. E posibil ca o eroare internă să fi avut loc.",
    "INSTALL_CANCELED"                     : "Instalarea a fost revocată.",
    "VIEW_COMPLETE_DESCRIPTION"            : "Afișare descriere completă",
    "VIEW_TRUNCATED_DESCRIPTION"           : "Afișare descriere parțială",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Conținutul descărcat nu e un fișier zip valid.",
    "INVALID_PACKAGE_JSON"                 : "Fișierul \"package.json\" nu e valid (eroarea e: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Fișierul \"package.json\" nu specifică un nume pentru pachet.",
    "BAD_PACKAGE_NAME"                     : "{0} e un nume invalid pentru pachet.",
    "MISSING_PACKAGE_VERSION"              : "Fișierul \"package.json\" nu specifică o versiune pentru pachet.",
    "INVALID_VERSION_NUMBER"               : "Versiunea pachetului ({0}) e invalidă.",
    "INVALID_BRACKETS_VERSION"             : "Valoarea parametrului de compatibilitate {APP_NAME} ({0}) e invalid.",
    "DISALLOWED_WORDS"                     : "Cuvintele ({1}) nu sunt permise în câmpul {0}.",
    "API_NOT_COMPATIBLE"                   : "Extensia nu e compatibilă cu versiuea curentă {APP_NAME}. E instalată în dosarul cu extensii dezactivate.",
    "MISSING_MAIN"                         : "Pachetul nu are fișierul \"main.js.\"",
    "EXTENSION_ALREADY_INSTALLED"          : "Instalând acest pachet veți rescrie o extensie instalată anterior. Doriți să rescrieți extensia?",
    "EXTENSION_SAME_VERSION"               : "Acest pachet are aceeași versiune ca și extensia instalată curent. Doriți să rescrieți extensia?",
    "EXTENSION_OLDER_VERSION"              : "Acest pachet are versiunea {0} care e mai veche decât vesiunea instalată curent ({1}). Doriți să rescrieți extensia?",
    "DOWNLOAD_ID_IN_USE"                   : "Eroare internă: identificatorul descărcării e utilizat deja.",
    "NO_SERVER_RESPONSE"                   : "Imposibil de conectat la server.",
    "BAD_HTTP_STATUS"                      : "Fișierul nu a fost găsit pe server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Imposibil de salvat descărcarea într-un fișier temporar.",
    "ERROR_LOADING"                        : "Extensia a întîlnit o eroare la lansare.",
    "MALFORMED_URL"                        : "URL-ul e invalid. Verificați corectitudinea URL-ului introdus.",
    "UNSUPPORTED_PROTOCOL"                 : "URL-ul trebuie să fie un URL HTTP sau HTTPS.",
    "UNKNOWN_ERROR"                        : "Eroare internă necunoscută.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Manager de extensii",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "La moment este imposibil de accesat registrul extensiilor. Încercați mai târziu.",
    "INSTALL_EXTENSION_DRAG"               : "Glisați .zip aici sau",
    "INSTALL_EXTENSION_DROP"               : "Plasați .zip pentru a instala",
    "INSTALL_EXTENSION_DROP_ERROR"         : "Instalare/Actualizare întreruptă din cauza următoarelor erori:",
    "INSTALL_FROM_URL"                     : "Instalare din URL\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "În curs de validare\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Dată",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Această extensie necesită o vesiune mai nouă {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Această extensie funcționează doar cu versiunile mai vechi {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Versiunea {0} a acestei extensii necesită o vesiune mai nouă {APP_NAME}. Dar puteți instala versiunea {1} a extensiei.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Versiunea {0} a acestei extensii funcționează doar cu versiunile vechi {APP_NAME}. Dar puteți instala versiunea {1} a extensiei.",
    "EXTENSION_NO_DESCRIPTION"             : "Nicio descriere",
    "EXTENSION_MORE_INFO"                  : "Mai multe informații...",
    "EXTENSION_ERROR"                      : "Eroare de extensie",
    "EXTENSION_KEYWORDS"                   : "Cuvinte cheie",
    "EXTENSION_TRANSLATED_USER_LANG"       : "Tradus în {0} limbi, incluzând Româna",
    "EXTENSION_TRANSLATED_GENERAL"         : "Tradus în {0} limbi",
    "EXTENSION_TRANSLATED_LANGS"           : "Această extensie a fost tradusă în următoarele limbi: {0}",
    "EXTENSION_INSTALLED"                  : "Instalat",
    "EXTENSION_UPDATE_INSTALLED"           : "Actualizarea extensiei curente a fost descărcată și va fi instalată când veți ieși din {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Caută",
    "EXTENSION_MORE_INFO_LINK"             : "Mai mult",
    "BROWSE_EXTENSIONS"                    : "Parcurge extensiile",
    "EXTENSION_MANAGER_REMOVE"             : "Șterge extensia",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Imposibil de șters una sau mai multe extensii: {0}. {APP_NAME} va fi închis oricum.",
    "EXTENSION_MANAGER_UPDATE"             : "Actualizează extensia",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Imposibil de actualizat una sau mai multe extensii: {0}. {APP_NAME} va fi închis oricum.",
    "MARKED_FOR_REMOVAL"                   : "Marcată pentru ștergere",
    "UNDO_REMOVE"                          : "Anulează",
    "MARKED_FOR_UPDATE"                    : "Marcată pentru actualizare",
    "UNDO_UPDATE"                          : "Refă",
    "CHANGE_AND_RELOAD_TITLE"              : "Modificare extensii",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Pentru a actualiza sau șterge extensiile marcate {APP_NAME} trebuie relansat. Veți fi solicitat pentru a salva schimbările.",
    "REMOVE_AND_RELOAD"                    : "Șterge extensiile și repornește",
    "CHANGE_AND_RELOAD"                    : "Modifică extensiile și repornește",
    "UPDATE_AND_RELOAD"                    : "Actualizează extensiile și repornește",
    "PROCESSING_EXTENSIONS"                : "Procesează modificările extensiilor\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Extensia {0} nu a putut fi ștearsă pentru că nu e instalată.",
    "NO_EXTENSIONS"                        : "Nicio extensie instalată.<br>Clic pe fila extensiilor disponibile pentru a instala una.",
    "NO_EXTENSION_MATCHES"                 : "Nicio extensie nu se potrivește căutării.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Fiți precaut la instalarea extensiilor din surse necunoscute.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Instalate",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Disponibile",
    "EXTENSIONS_THEMES_TITLE"              : "Teme",
    "EXTENSIONS_UPDATES_TITLE"             : "Actualizări",

    "INLINE_EDITOR_NO_MATCHES"             : "Nicio potrivire disponibilă.",
    "INLINE_EDITOR_HIDDEN_MATCHES"         : "Toate potrivirile sunt reduse. Extinde fișierele afișate pe dreapta pentru a vedea potrivirile.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Nu există nicio regulă CSS care să se potrivească selecției.<br>Clic pe \"Regulă nouă\" pentru a crea una.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Proiectul nu conține nicio foaie de stiluri.<br>Creați una pentru a adăuga reguli CSS.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "maxim",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixeli",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Depanare",
    "ERRORS"                                    : "Erori",
    "CMD_SHOW_DEV_TOOLS"                        : "Arată uneltele pentru dezvoltatori",
    "CMD_REFRESH_WINDOW"                        : "Reîncarcă {APP_NAME}",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Reîncarcă fără extensii",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Deschide o fereastră nouă {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Modifică limba",
    "CMD_RUN_UNIT_TESTS"                        : "Rulează testele",
    "CMD_SHOW_PERF_DATA"                        : "Arată datele despre performanță",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Activează opțiunea de depanare pentru Node",
    "CMD_LOG_NODE_STATE"                        : "Înregistrează statutul Node în consolă",
    "CMD_RESTART_NODE"                          : "Repornește Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Arată erorile în bara de stare",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Deschide sursa Brackets",

    "LANGUAGE_TITLE"                            : "Modificare Limbă",
    "LANGUAGE_MESSAGE"                          : "Limba:",
    "LANGUAGE_SUBMIT"                           : "Reîncarcă {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Revocare",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Limba implicită a sistemului",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Timp",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progres",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Mută punctul selectat<br><kbd class='text'>Shift</kbd> Mută cu zece unități<br><kbd class='text'>Tab</kbd> Comută punctele",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Incrementează sau decrementează pașii<br><kbd>←</kbd><kbd>→</kbd> 'Început' or 'Sfâșit'",
    "INLINE_TIMING_EDITOR_INVALID"              : "Valoarea veche <code>{0}</code> nu e validă, astfel funcția afișată a fost modificată în <code>{1}</code>. Documentul va fi actualizat cu prima editare.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Culoarea curentă",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Culoarea originală",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Format RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Format Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Format HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (folosită {1} dată)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (folosită {1} ori)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Sari la definiție",
    "CMD_SHOW_PARAMETER_HINT"                   : "Arată sugestia parametrului",
    "NO_ARGUMENTS"                              : "<niciun parametru>",
    "DETECTED_EXCLUSION_TITLE"                  : "Problemă de inferență a fișierelu JavaScript",
    "DETECTED_EXCLUSION_INFO"                   : "Brackets a întâlnit probleme la procesarea:<br><br>{0}<br><br>Acest fișier nu va mai fi procesat pentru indicii de cod și definiții. Pentru a reactiva acest funcțional, deschideți <code>.brackets.json</code> din proiect și eliminați fișierul din jscodehints.detectedExclusions.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Activare Quick View",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Proiecte recente",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Vezi mai mult"
});

/* Last translated for 2caf4f2e5745a87d482246b2aa57cdd5aab1e13d */
