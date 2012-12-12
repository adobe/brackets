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
    "GENERIC_ERROR"                     : "(errore {0})",
    "NOT_FOUND_ERR"                     : "Impossibile trovare il file.",
    "NOT_READABLE_ERR"                  : "Il file non può essere letto.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "La cartella selezionata non può essere modificata.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Non hai i permessi necessari per effettuare la modifica.",
    "FILE_EXISTS_ERR"                   : "Il file è già presente.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Errore durante il caricamento del progetto",
    "OPEN_DIALOG_ERROR"                 : "Errore durante il caricamento della finestra di dialogo per l'apertura del file. (errore {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Errore durante il tentativo di caricare la cartella <span class='dialog-filename'>{0}</span>. (errore {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Errore durante la lettura del contenuto della cartella <span class='dialog-filename'>{0}</span>. (errore {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Errore durante l'apertura del file",
    "ERROR_OPENING_FILE"                : "Errore durante il tentativo di apertura del file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Errore durante il caricamento delle modifiche dal disco",
    "ERROR_RELOADING_FILE"              : "Errore durante il tentativo di ricaricare il file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Errore durante il salvataggio del file",
    "ERROR_SAVING_FILE"                 : "Errore durante il tentativo di salvare il file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Errore durante il tentativo di rinominare il file",
    "ERROR_RENAMING_FILE"               : "Errore durante il tentativo di rinominare il file <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Il nome del file non è valido",
    "INVALID_FILENAME_MESSAGE"          : "Il nome del file non può contenere i seguenti caratteri: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "Il file <span class='dialog-filename'>{0}</span> esiste già.",
    "ERROR_CREATING_FILE_TITLE"         : "Errore durante la creazione del file",
    "ERROR_CREATING_FILE"               : "Errore durante il tentativo di creare il file <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} non può essere ancora eseguita nel browser.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} è scritta in HTML, ma al momento viene eseguita come applicazione desktop per avere la possibilità di modificare file locali. Puoi usare la shell dell'applicazione Puoi usare la shell sul <b>github.com/adobe/brackets-shell</b> repository per eseguire {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Errore durante l'indicizzazione dei file",
    "ERROR_MAX_FILES"                   : "E' stato raggiunto il massimo numero di file indicizzati. Le azioni che controllano file presenti nell'indice posso funzionare in modo non corretto.",
    
    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Errore durante l'avvio del browser",
    "ERROR_CANT_FIND_CHROME"            : "Non è stato possibile trovare il browser Google Chrome. Assicurarsi che sia correttamente installato.",
    "ERROR_LAUNCHING_BROWSER"           : "Errore durante l'avvio del browser. (errore {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Errore durante l'Anteprima Live",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Connessione al Browser in corso",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Per effettuare una connessione con Anteprima Live, Chrome deve essere rilanciato con il debugging remoto abilitato.<br /><br />Vuoi rilanciare Chrome e abilitare il debugging remoto?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Apri un file HTML per lanciare l'Anteprima Live.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "To launch live preview with a server-side file, you need to specify a Base URL for this project.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Benvenuto nell'Anteprima Live!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Anteprima Live connette {APP_NAME} al tuo browser. Lancia una anteprima del tuo file HTML nel browser e dopo ogni tua modifica l'anteprima verrà aggiornata istantaneamente per riflettere le modifiche del tuo codice.<br /><br />In questa versione preliminare di {APP_NAME}, Anteprima Live funziona solo per le modifiche su <strong>file CSS</strong> e solo con <strong>Google Chrome</strong>. Verrà implementata presto anche per HTML e JavaScript!<br /><br />(Vedrai questo messaggio una sola volta.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Per magiorni informazioni leggi <a class=\"clickable-link\" data-href=\"{0}\">Risoluzione dei problemi di connessione a Anteprima Live</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Anteprima Live",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Anteprima Live: Connessione\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Anteprima Live: Inizializzazione\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Disconnetti Anteprima Live",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Anteprima Live: clicca per disconnettere (Salva il file per aggiornare)",
    
    "SAVE_CLOSE_TITLE"                  : "Salva le modifiche",
    "SAVE_CLOSE_MESSAGE"                : "Vuoi cambiare le modifiche apportate al file <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Vuoi cambiare le modifiche apportate ai seguenti file?",
    "EXT_MODIFIED_TITLE"                : "Modifiche esterne",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> è stato modificato sul disco ma ha delle modifiche non ancora salvate in {APP_NAME}.<br /><br />Quale versione vuoi tenere?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> è stato eliminato sul disco ma ha delle modifiche non ancora salvate in {APP_NAME}.<br /><br />Vuoi mantenere le tue modifiche?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Usa la sintassi /re/ per ricerche con regexp",
    "WITH"                              : "Con",
    "BUTTON_YES"                        : "Si",
    "BUTTON_NO"                         : "No",
    "BUTTON_STOP"                       : "Stop",

    "OPEN_FILE"                         : "Apri File",
    "CHOOSE_FOLDER"                     : "Scegli una cartella",

    "RELEASE_NOTES"                     : "Note di rilascio",
    "NO_UPDATE_TITLE"                   : "Aggiornato!",
    "NO_UPDATE_MESSAGE"                 : "Hai installata l'ultima versione di {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "- {0} {1} in {2} {3}",
    "FIND_IN_FILES_FILE"                : "file",
    "FIND_IN_FILES_FILES"               : "file",
    "FIND_IN_FILES_MATCH"               : "corrispondenza",
    "FIND_IN_FILES_MATCHES"             : "corrispondenze",
    "FIND_IN_FILES_MORE_THAN"           : "Più di  ",
    "FIND_IN_FILES_MAX"                 : " (mostra le prime {0} corrispondenze)",
    "FIND_IN_FILES_FILE_PATH"           : "File: <b>{0}</b>",
    "FIND_IN_FILES_LINE"                : "linea:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Errore durante l'aggiornamento delle informazioni",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Si è verificato un problema durante l'aggiornamento delle informazioni dal server. Controlla di essere collegato a internet e riprova ancora.",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "Cambia lingua",
    "LANGUAGE_MESSAGE"                  : "Scegli una lingua dlla lista sottostante:",
    "LANGUAGE_SUBMIT"                   : "Ricarica {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "Annulla",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Senza nome",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Linea {0}, Colonna {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Clicca per passare alla indentazione a spazi",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Clicca per passare alla indentazione a tabulazione",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Clicca per cambiare il numero di spazi usati per l'indentazione",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Clicca per cambiare la ampiezza della tabulazione",
    "STATUSBAR_SPACES"                      : "Spazi",
    "STATUSBAR_TAB_SIZE"                    : "Ampiezza tabulazione",
    "STATUSBAR_LINE_COUNT"                  : "{0} Linee",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "File",
    "CMD_FILE_NEW"                        : "Nuovo file",
    "CMD_FILE_NEW_FOLDER"                 : "Nuova cartella",
    "CMD_FILE_OPEN"                       : "Apri\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Aggiungi all'area di lavoro",
    "CMD_OPEN_FOLDER"                     : "Apri cartella\u2026",
    "CMD_FILE_CLOSE"                      : "Chiudi",
    "CMD_FILE_CLOSE_ALL"                  : "Chiudi tutto",
    "CMD_FILE_SAVE"                       : "Salva",
    "CMD_FILE_SAVE_ALL"                   : "Salva tutto",
    "CMD_LIVE_FILE_PREVIEW"               : "Anteprima Live",
    "CMD_PROJECT_SETTINGS"                : "Impostazioni del progetto\u2026",
    "CMD_FILE_RENAME"                     : "Rinomina",
    "CMD_QUIT"                            : "Esci",

    // Edit menu commands
    "EDIT_MENU"                           : "Modifica",
    "CMD_SELECT_ALL"                      : "Seleziona tutto",
    "CMD_SELECT_LINE"                     : "Select Line",
    "CMD_FIND"                            : "Cerca",
    "CMD_FIND_IN_FILES"                   : "Cerca nei file",
    "CMD_FIND_NEXT"                       : "Cerca il successivo",
    "CMD_FIND_PREVIOUS"                   : "Cerca il precedente",
    "CMD_REPLACE"                         : "Sostituisci",
    "CMD_INDENT"                          : "Aumenta indentazione",
    "CMD_UNINDENT"                        : "Riduci indentazione",
    "CMD_DUPLICATE"                       : "Duplica",
    "CMD_DELETE_LINES"                    : "Elimina linea",
    "CMD_COMMENT"                         : "Commenta/De-commenta linee",
    "CMD_LINE_UP"                         : "Sposta la linea in alto",
    "CMD_LINE_DOWN"                       : "Sposta la linea in basso",
     
    // View menu commands
    "VIEW_MENU"                           : "Vista",
    "CMD_HIDE_SIDEBAR"                    : "Nascondi barra laterale",
    "CMD_SHOW_SIDEBAR"                    : "Mostra barra laterale",
    "CMD_INCREASE_FONT_SIZE"              : "Aumenta la dimensione del testo",
    "CMD_DECREASE_FONT_SIZE"              : "Diminuisci la dimensione del testo",
    "CMD_RESTORE_FONT_SIZE"               : "Ripristina la dimensione del testo",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Ordina per data di aggiunta",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Ordina per nome",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Ordina per tipo",
    "CMD_SORT_WORKINGSET_AUTO"            : "Ordinamento automatico",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Naviga",
    "CMD_QUICK_OPEN"                      : "Apri velocemente",
    "CMD_GOTO_LINE"                       : "Vai alla linea",
    "CMD_GOTO_DEFINITION"                 : "Vai alla definizione",
    "CMD_TOGGLE_QUICK_EDIT"               : "Modifica veloce",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Corrispondenza precedente",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Corrispondenza successiva",
    "CMD_NEXT_DOC"                        : "Documenti successivo",
    "CMD_PREV_DOC"                        : "Documento precedente",
    "CMD_SHOW_IN_TREE"                    : "Mostra nell'albero dei file",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Debug",
    "CMD_REFRESH_WINDOW"                  : "Ricarica {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "Mostra strumenti di sviluppo",
    "CMD_RUN_UNIT_TESTS"                  : "Esegui i test",
    "CMD_JSLINT"                          : "Abilita JSLint",
    "CMD_SHOW_PERF_DATA"                  : "Mostra dati sulle prestazioni",
    "CMD_NEW_BRACKETS_WINDOW"             : "Nuova finestra {APP_NAME}",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Mostra cartella estensioni",
    "CMD_SWITCH_LANGUAGE"                 : "Cambia lingua",
    "CMD_CHECK_FOR_UPDATE"                : "Controlla aggiornamenti",

    // Help menu commands
    "HELP_MENU"                           : "Aiuto",
    "CMD_ABOUT"                           : "About",
    "CMD_FORUM"                           : "{APP_NAME} Forum",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Chiudi la finestra",
    "CMD_ABORT_QUIT"                      : "Annulla la chiusura",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Build sperimentale",
    "JSLINT_ERRORS"                        : "Errori di JSLint",
    "JSLINT_ERROR_INFORMATION"             : "JSLint: 1 errore",
    "JSLINT_ERRORS_INFORMATION"            : "JSLint: {0} errori",
    "JSLINT_NO_ERRORS"                     : "JSLint: Nessun errore - complimenti!",
    "JSLINT_DISABLED"                      : "JSLint disabilitato o non funzionante per il file corrente",
    "SEARCH_RESULTS"                       : "Risultati della ricerca",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Non salvare",
    "SAVE"                                 : "Salva",
    "CANCEL"                               : "Annulla",
    "RELOAD_FROM_DISK"                     : "Ricarica dal disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Conserva le modifiche nell'editor",
    "CLOSE_DONT_SAVE"                      : "Chiudi (non salvare)",
    "RELAUNCH_CHROME"                      : "Riavvia Chrome",
    "ABOUT"                                : "About",
    "APP_NAME"                             : "Brackets",
    "CLOSE"                                : "Chiudi",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} build sperimentale {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Avvisi, termini e condizioni pertinenti software di terze parti sono disponibili all'indirizzo <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> e incorporati per riferimento in questo documento.",
    "ABOUT_TEXT_LINE4"                     : "Documentazione e codice sorgente sono disponibili all'indirizzo <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "E' disponibile una nuova versione di {APP_NAME}! Clicca qui per i dettagli.",
    "UPDATE_AVAILABLE_TITLE"               : "Aggiornamento disponibile",
    "UPDATE_MESSAGE"                       : "Hey, è disponibile una nuova versione di {APP_NAME}. Nuove caratteristiche:",
    "GET_IT_NOW"                           : "Installalo ora!",
    "PROJECT_SETTINGS_TITLE"               : "Impostazioni del progetto per: {0}",
    "PROJECT_SETTING_BASE_URL"             : "URL di base per Anteprima Live",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(lasciare vuoto per utilizzare l'URL del file)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Il protocollo {0} non è supportato da Anteprima Lice&mdash;utilizzare http: o https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "L'URL di base non può contenere parametri di ricerca come \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "L'URL di base non può contenere hash come \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "I caratteri speciali come '{0}' devono essere %-encodate.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Trovato un carattere sconosciuto durante il parsing della URL di base"
});
