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
    "CONTENTS_MODIFIED_ERR"             : "Il file è stato modificato fuori {APP_NAME}.",
    "FILE_EXISTS_ERR"                   : "Il file è già presente.",
    "FILE"                              : "file",
    "DIRECTORY"                         : "cartella",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Errore durante il caricamento del progetto",
    "OPEN_DIALOG_ERROR"                 : "Errore durante il caricamento della finestra di dialogo per l'apertura del file. (errore {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Errore durante il tentativo di caricare la cartella <span class='dialog-filename'>{0}</span>. (errore {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Errore durante la lettura del contenuto della cartella <span class='dialog-filename'>{0}</span>. (errore {1})",
    
    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Errore durante l'apertura del file",
    "ERROR_OPENING_FILE"                : "Errore durante il tentativo di apertura del file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Errore durante il tentativo di apertura dei seguenti file:",
    "ERROR_RELOADING_FILE_TITLE"        : "Errore durante il caricamento delle modifiche dal disco",
    "ERROR_RELOADING_FILE"              : "Errore durante il tentativo di ricaricare il file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Errore durante il salvataggio del file",
    "ERROR_SAVING_FILE"                 : "Errore durante il tentativo di salvare il file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Errore durante il tentativo di rinominare il file",
    "ERROR_RENAMING_FILE"               : "Errore durante il tentativo di rinominare il file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Errore durante il tentativo di eliminazione del file",
    "ERROR_DELETING_FILE"               : "Errore durante il tentativo di eliminazione del file <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Il nome del file non è valido",
    "INVALID_FILENAME_MESSAGE"          : "Il nome del file non può contenere i seguenti caratteri: {0}",
    "FILE_ALREADY_EXISTS"               : "Il file <span class='dialog-filename'>{0}</span> esiste già.",
    "ERROR_CREATING_FILE_TITLE"         : "Errore durante la creazione del file",
    "ERROR_CREATING_FILE"               : "Errore durante il tentativo di creare il file <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} non può essere ancora eseguita nel browser.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} è scritta in HTML, ma al momento viene eseguita come applicazione desktop per avere la possibilità di modificare file locali. Puoi usare la shell dell'applicazione Puoi usare la shell sul <b>github.com/adobe/brackets-shell</b> repository per eseguire {APP_NAME}.",
    
    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Errore durante l'indicizzazione dei file",
    "ERROR_MAX_FILES"                   : "E' stato raggiunto il massimo numero di file indicizzati. Le azioni che controllano file presenti nell'indice posso funzionare in modo non corretto.",
    
    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Errore durante l'avvio del browser",
    "ERROR_CANT_FIND_CHROME"            : "Non è stato possibile trovare il browser Google Chrome. Assicurarsi che sia correttamente installato.",
    "ERROR_LAUNCHING_BROWSER"           : "Errore durante l'avvio del browser. (errore {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Errore durante l'Anteprima Live",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Connessione al Browser in corso",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Per effettuare una connessione con Anteprima Live, Chrome deve essere rilanciato con il debugging remoto abilitato.<br /><br />Vuoi rilanciare Chrome e abilitare il debugging remoto?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Impossibile caricare Sviluppo Live",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Apri un file HTML per lanciare l'Anteprima Live.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "To launch live preview with a server-side file, you need to specify a Base URL for this project.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Errore durante l'avvio del server HTTP server per i file di sviluppo in tempo reale. Riprova ancora.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Benvenuto nell'Anteprima Live!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Anteprima Live connette {APP_NAME} al tuo browser. Lancia una anteprima del tuo file HTML nel browser e dopo ogni tua modifica l'anteprima verrà aggiornata istantaneamente per riflettere le modifiche del tuo codice.<br /><br />In questa versione preliminare di {APP_NAME}, Anteprima Live funziona solo per le modifiche su <strong>file CSS</strong> e solo con <strong>Google Chrome</strong>. Verrà implementata presto anche per HTML e JavaScript!<br /><br />(Vedrai questo messaggio una sola volta.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Per magiorni informazioni leggi <a href='{0}' title='{0}'>Risoluzione dei problemi di connessione a Anteprima Live</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Anteprima Live",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Anteprima Live: Connessione\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Anteprima Live: Inizializzazione\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Disconnetti Anteprima Live",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Anteprima Live: clicca per disconnettere (Salva il file per aggiornare)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Anteprima Live (non aggiorna a causa di un errore di sintassi)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "L'Anteprima Live è stata cancellata perché uno strumento di sviluppo è stato aperto nel browser",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "L'Anteprima Live è stata cancellata perché è stato chiuso il browser",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "L'Anteprima Live è stata cancellata perché il browser ha caricato una pagina che non fa parte del progetto corrente",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "L'Anteprima Live è stata cancellata a causa di un errore sconosciuto ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Salva le modifiche",
    "SAVE_CLOSE_MESSAGE"                : "Vuoi cambiare le modifiche apportate al file <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Vuoi cambiare le modifiche apportate ai seguenti file?",
    "EXT_MODIFIED_TITLE"                : "Modifiche esterne",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Confirm Delete",
    "CONFIRM_FOLDER_DELETE"             : "Sei sicuro di eliminare la cartella <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "File Eliminato",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> è stato modificato sul disco.<br /><br />Vuoi salvare il file e sovrascrivere le modifiche?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> è stato modificato sul disco ma ha delle modifiche non ancora salvate in {APP_NAME}.<br /><br />Quale versione vuoi tenere?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> è stato eliminato sul disco ma ha delle modifiche non ancora salvate in {APP_NAME}.<br /><br />Vuoi mantenere le tue modifiche?",

    // Generic dialog/button labels
    "OK"                                : "OK",
    "CANCEL"                            : "Cancella",
    "DONT_SAVE"                         : "Non salvare",
    "SAVE"                              : "Salva",
    "SAVE_AS"                           : "Salva come\u2026",
    "SAVE_AND_OVERWRITE"                : "Sovrascrivi",
    "DELETE"                            : "Cancella",
    "BUTTON_YES"                        : "Si",
    "BUTTON_NO"                         : "No",
        
    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} risultati",
    "FIND_RESULT_COUNT_SINGLE"          : "1 risultato",
    "FIND_NO_RESULTS"                   : "Nessun risultato",
    "REPLACE_PLACEHOLDER"               : "Sostituisci con\u2026",
    "BUTTON_REPLACE_ALL"                : "Tutti\u2026",
    "BUTTON_REPLACE"                    : "Sostituisci",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Corrispondenza successiva",
    "BUTTON_PREV_HINT"                  : "Corrispondenza precedente",
    "BUTTON_CASESENSITIVE_HINT"         : "Rispetta maiuscole/minuscole",
    "BUTTON_REGEXP_HINT"                : "Espressione regolare",

    "OPEN_FILE"                         : "Apri File",
    "SAVE_FILE_AS"                      : "Salva File",
    "CHOOSE_FOLDER"                     : "Scegli una cartella",

    "RELEASE_NOTES"                     : "Note di rilascio",
    "NO_UPDATE_TITLE"                   : "Sei aggiornato!",
    "NO_UPDATE_MESSAGE"                 : "Stai utilizzando l'ultima versione di {APP_NAME}.",

    // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1"          : "Sostituisci \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" con \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    // Find in Files
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" trovato",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} in {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "nel progetto",
    "FIND_IN_FILES_FILE"                : "file",
    "FIND_IN_FILES_FILES"               : "file",
    "FIND_IN_FILES_MATCH"               : "corrispondenza",
    "FIND_IN_FILES_MATCHES"             : "corrispondenze",
    "FIND_IN_FILES_MORE_THAN"           : "Più ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Si è verificato un errore nel recuperare le informazioni aggiornate",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Si è verificato un errore nel recuperare le informazioni aggiornate dal server. Assicurati di essere connesso a internet e riprova.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Caricamento\u2026",
    "UNTITLED"          : "Senza titolo",
    "WORKING_FILES"     : "File attivi",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Maiuscolo",
    "KEYBOARD_SPACE"  : "Spazio",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Linea {0}, Colonna {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Selected {0} column",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Selected {0} columns",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Selected {0} line",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Selected {0} lines",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Clicca per passare alla indentazione a spazi",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Clicca per passare alla indentazione a tabulazione",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Clicca per cambiare il numero di spazi usati per l'indentazione",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Clicca per cambiare la ampiezza della tabulazione",
    "STATUSBAR_SPACES"                      : "Spazi",
    "STATUSBAR_TAB_SIZE"                    : "Ampiezza tabulazione",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Linea",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Linee",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Estensioni disabilitate",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0} Problemi",
    "SINGLE_ERROR"                          : "1 {0} Problema",
    "MULTIPLE_ERRORS"                       : "{1} {0} Problemi",
    "NO_ERRORS"                             : "Nessun {0} problema trovato - ottimo lavoro!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Nessun problema trovato - ottimo lavoro!",
    "LINT_DISABLED"                         : "Linting disabilitato",
    "NO_LINT_AVAILABLE"                     : "Linter disponibile {0}",
    "NOTHING_TO_LINT"                       : "Nothing to lint",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "File",
    "CMD_FILE_NEW_UNTITLED"               : "Nuovo",
    "CMD_FILE_NEW"                        : "Nuovo File",
    "CMD_FILE_NEW_FOLDER"                 : "Nuova cartella",
    "CMD_FILE_OPEN"                       : "Apri\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Aggiungi uno spazio di lavoro",
    "CMD_OPEN_DROPPED_FILES"              : "Apri un file abbandonato",
    "CMD_OPEN_FOLDER"                     : "Apri cartella\u2026",
    "CMD_FILE_CLOSE"                      : "Chiudi",
    "CMD_FILE_CLOSE_ALL"                  : "Chiudi tutto",
    "CMD_FILE_CLOSE_LIST"                 : "Chiudi lista",
    "CMD_FILE_CLOSE_OTHERS"               : "Chiudi tutto il resto",
    "CMD_FILE_CLOSE_ABOVE"                : "Chiudi tutto al di sopra",
    "CMD_FILE_CLOSE_BELOW"                : "Chiudi tutto al di sotto",
    "CMD_FILE_SAVE"                       : "Salva",
    "CMD_FILE_SAVE_ALL"                   : "Salva tutto",
    "CMD_FILE_SAVE_AS"                    : "Salva come\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Anteprima Live",
    "CMD_PROJECT_SETTINGS"                : "Impostazioni del progetto\u2026",
    "CMD_FILE_RENAME"                     : "Rinomina",
    "CMD_FILE_DELETE"                     : "Elimina",
    "CMD_INSTALL_EXTENSION"               : "Installa Estensioni\u2026",
    "CMD_EXTENSION_MANAGER"               : "Manager delle Estensioni\u2026",
    "CMD_FILE_REFRESH"                    : "Ricarica il percorso file",
    "CMD_QUIT"                            : "Abbandona",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Esci",

    // Edit menu commands
    "EDIT_MENU"                         : "Modifica",
    "CMD_UNDO"                          : "Annulla",
    "CMD_REDO"                          : "Ripristina",
    "CMD_CUT"                           : "Taglia",
    "CMD_COPY"                          : "Copia",
    "CMD_PASTE"                         : "Incolla",
    "CMD_SELECT_ALL"                    : "Seleziona tutto",
    "CMD_SELECT_LINE"                   : "Seleziona riga",
    "CMD_FIND"                          : "Cerca",
    "CMD_FIND_FIELD_PLACEHOLDER"        : "Trova\u2026",
    "CMD_FIND_IN_FILES"                 : "Cerca nei file",
    "CMD_FIND_IN_SUBTREE"               : "Cerca in\u2026",
    "CMD_FIND_NEXT"                     : "Cerca il successivo",
    "CMD_FIND_PREVIOUS"                 : "Cerca il precedente",
    "CMD_REPLACE"                       : "Sostituisci",
    "CMD_INDENT"                        : "Aumenta indentazione",
    "CMD_UNINDENT"                      : "Riduci indentazione",
    "CMD_DUPLICATE"                     : "Duplica",
    "CMD_DELETE_LINES"                  : "Elimina linea",
    "CMD_COMMENT"                       : "Commenta/De-commenta linee",
    "CMD_BLOCK_COMMENT"                 : "Commenta/De-commenta blocco",
    "CMD_LINE_UP"                       : "Sposta la riga in alto",
    "CMD_LINE_DOWN"                     : "Sposta la riga in basso",
    "CMD_OPEN_LINE_ABOVE"               : "Apri linea sopra",
    "CMD_OPEN_LINE_BELOW"               : "Apri linea sotto",
    "CMD_TOGGLE_CLOSE_BRACKETS"         : "Chiudi Brackets automaticamente",
    "CMD_SHOW_CODE_HINTS"               : "Mostra suggerimenti",
    
    // View menu commands
    "VIEW_MENU"                         : "Vista",
    "CMD_HIDE_SIDEBAR"                  : "Nascondi barra laterale",
    "CMD_SHOW_SIDEBAR"                  : "Mostra barra laterale",
    "CMD_INCREASE_FONT_SIZE"            : "Aumenta la dimensione del testo",
    "CMD_DECREASE_FONT_SIZE"            : "Diminuisci la dimensione del testo",
    "CMD_RESTORE_FONT_SIZE"             : "Ripristina la dimensione del testo",
    "CMD_SCROLL_LINE_UP"                : "Scorri verso l'alto",
    "CMD_SCROLL_LINE_DOWN"              : "Scorri verso il basso",
    "CMD_TOGGLE_LINE_NUMBERS"           : "Numeri linea",
    "CMD_TOGGLE_ACTIVE_LINE"            : "Evidenzia linea attiva",
    "CMD_TOGGLE_WORD_WRAP"              : "Word Wrap",
    "CMD_LIVE_HIGHLIGHT"                : "Ispezione Anteprima Live",
    "CMD_VIEW_TOGGLE_INSPECTION"        : "Lint Files on Save",
    "CMD_SORT_WORKINGSET_BY_ADDED"      : "Ordina per data di aggiunta",
    "CMD_SORT_WORKINGSET_BY_NAME"       : "Ordina per nome",
    "CMD_SORT_WORKINGSET_BY_TYPE"       : "Ordina per tipo",
    "CMD_SORT_WORKINGSET_AUTO"          : "Ordinamento automatico",

    // Navigate menu Commands
    "NAVIGATE_MENU"                     : "Naviga",
    "CMD_QUICK_OPEN"                    : "Apri velocemente",
    "CMD_GOTO_LINE"                     : "Vai alla linea",
    "CMD_GOTO_DEFINITION"               : "Vai alla definizione",
    "CMD_GOTO_FIRST_PROBLEM"            : "Vai al primo errore/avviso",
    "CMD_TOGGLE_QUICK_EDIT"             : "Modifica veloce",
    "CMD_TOGGLE_QUICK_DOCS"             : "Documentazione veloce",
    "CMD_QUICK_EDIT_PREV_MATCH"         : "Corrispondenza precedente",
    "CMD_QUICK_EDIT_NEXT_MATCH"         : "Corrispondenza successiva",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"       : "Nuova regola",
    "CMD_NEXT_DOC"                      : "Documento successivo",
    "CMD_PREV_DOC"                      : "Documento precedente",
    "CMD_SHOW_IN_TREE"                  : "Mostra nell'albero dei file",
    "CMD_SHOW_IN_OS"                    : "Mostra in OS",
    
    // Help menu commands
    "HELP_MENU"                         : "Aiuto",
    "CMD_CHECK_FOR_UPDATE"              : "Controlla aggiornamenti",
    "CMD_HOW_TO_USE_BRACKETS"           : "Come usare {APP_NAME}",
    "CMD_FORUM"                         : "Forum di{APP_NAME}",
    "CMD_RELEASE_NOTES"                 : "Note del lancio",
    "CMD_REPORT_AN_ISSUE"               : "Segnala un problema",
    "CMD_SHOW_EXTENSIONS_FOLDER"        : "Mostra cartella estensioni",
    "CMD_TWITTER"                       : "{TWITTER_NAME} su Twitter",
    "CMD_ABOUT"                         : "Informazioni su {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"              : "Apri il file delle preferenze",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                : "Build sperimentale",
    "DEVELOPMENT_BUILD"                 : "Build di sviluppo",
    "RELOAD_FROM_DISK"                  : "Ricarica dal disco",
    "KEEP_CHANGES_IN_EDITOR"            : "Conserva le modifiche nell'editor",
    "CLOSE_DONT_SAVE"                   : "Chiudi (non salvare)",
    "RELAUNCH_CHROME"                   : "Riavvia Chrome",
    "ABOUT"                             : "About",
    "CLOSE"                             : "Chiudi",
    "ABOUT_TEXT_LINE1"                  : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                  : "Avvisi, termini e condizioni circa i software di terze parti raggiungibili all'indirizzo <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> incorporati come riferimento.",
    "ABOUT_TEXT_LINE4"                  : "Documentazione e codice sorgente sono disponibili all'indirizzo <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Fatto con \u2764 e JavaScript da:",
    "ABOUT_TEXT_LINE6"                     : "Molta gente (abbiamo qualche difficoltà a caricare questi dati ora).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "I loghi di 'Web Platform Docs'e 'Web Platform' sono sotto licenza Creative Common Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"       : "E' disponibile una nuova versione di {APP_NAME}! Clicca qui per i dettagli.",
    "UPDATE_AVAILABLE_TITLE"            : "Aggiornamento disponibile",
    "UPDATE_MESSAGE"                    : "Hey, è disponibile una nuova versione di {APP_NAME}. Nuove caratteristiche:",
    "GET_IT_NOW"                        : "Installalo ora!",
    "PROJECT_SETTINGS_TITLE"            : "Impostazioni del progetto per: {0}",
    "PROJECT_SETTING_BASE_URL"          : "URL di base per Anteprima Live",
    "PROJECT_SETTING_BASE_URL_HINT"     : "(lasciare vuoto per utilizzare l'URL del file)",
    "BASEURL_ERROR_INVALID_PROTOCOL"    : "Il protocollo {0} non è supportato da Anteprima Lice&mdash;utilizzare http: o https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"   : "L'URL di base non può contenere parametri di ricerca come \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"     : "L'URL di base non può contenere hash come \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"        : "I caratteri speciali come '{0}' devono essere %-encodate.",
    "BASEURL_ERROR_UNKNOWN_ERROR"       : "Trovato un carattere sconosciuto durante il parsing della URL di base",
    
    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Nuova regola",
    
    // Extension Management strings
    "INSTALL"                              : "Installa",
    "UPDATE"                               : "Aggiorna",
    "REMOVE"                               : "Rimuovi",
    "OVERWRITE"                            : "Sovrascrivi",
    "CANT_REMOVE_DEV"                      : "Le estensioni nella cartella \"dev\" devono essere eliminate manualmente.",
    "CANT_UPDATE"                          : "L'aggiornamento non è compatibile con questa versione di {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Le estensioni nella cartella \"dev\" non possono essere aggiornate automaticamente.",
    "INSTALL_EXTENSION_TITLE"              : "Installa Estensione",
    "UPDATE_EXTENSION_TITLE"               : "Aggiorna Estensione",
    "INSTALL_EXTENSION_LABEL"              : "Indirizzo URL dell'estensione",
    "INSTALL_EXTENSION_HINT"               : "Indirizzo URL dell'archivio contenente l'estensione o del repo GitHub",
    "INSTALLING_FROM"                      : "Installazione dell'estensione da {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Installazione andata a buon fine!",
    "INSTALL_FAILED"                       : "Installazione fallita.",
    "CANCELING_INSTALL"                    : "Cancellazione\u2026",
    "CANCELING_HUNG"                       : "L'arresto dell'installazione sta prendendo molto tempo. Potrebbe essersi verificato un errore interno.",
    "INSTALL_CANCELED"                     : "Installazione cancellata.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Il contenuto scaricato non è un file zip valido.",
    "INVALID_PACKAGE_JSON"                 : "Il file package.json non è valido (errore: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Il file package.json non specifica un nome per il pacchetto.",
    "BAD_PACKAGE_NAME"                     : "{0} è un nome non valido per il pacchetto.",
    "MISSING_PACKAGE_VERSION"              : "Il file package.json non specifica una versione.",
    "INVALID_VERSION_NUMBER"               : "Il numero di versione ({0}) del pacchetto non è valida.",
    "INVALID_BRACKETS_VERSION"             : "La compatibilità di {APP_NAME} string ({0}) è invalida.",
    "DISALLOWED_WORDS"                     : "Le parole ({1}) non sono ammesse nel campo {0}.",
    "API_NOT_COMPATIBLE"                   : "L'estensione non è compatibile con questa versione di {APP_NAME}. Verrà installata nella cartella delle estensioni disabilitate.",
    "MISSING_MAIN"                         : "Il pacchetto non contiene il file main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "L'installazione di questo pacchetto sovrascriverà una versione installata in precedenza. Sovrascrivere la vecchia versione?",
    "EXTENSION_SAME_VERSION"               : "Questo pacchetto è la stessa versione di quello già installato. Sovrascrivere l'installazione esistente?",
    "EXTENSION_OLDER_VERSION"              : "Questo pacchetto è alla versione {0}, che è più vecchia di quella installata ({1}). Sovrascrivere l'installazione esistente?",
    "DOWNLOAD_ID_IN_USE"                   : "Errore interno: ID di download già in uso.",
    "NO_SERVER_RESPONSE"                   : "Impossibile connettersi al server.",
    "BAD_HTTP_STATUS"                      : "File non trovato sul server (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Impossibile salvare il file scaricato nei file temporanei.",
    "ERROR_LOADING"                        : "Questa estensione ha incontrato un errore durante l'avvio.",
    "MALFORMED_URL"                        : "L'indirizzo URL è invalido. Controlla di averlo inserito correttamente.",
    "UNSUPPORTED_PROTOCOL"                 : "L'indirizzo URL dev'essere di tipo http o https.",
    "UNKNOWN_ERROR"                        : "Errore interno sconosciuto.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Manager delle Estensioni",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Impossibile accedere al registro delle estensioni. Riprova più tardi.",
    "INSTALL_FROM_URL"                     : "Installo dall'indirizzo URL\u2026",
    "EXTENSION_AUTHOR"                     : "Autore",
    "EXTENSION_DATE"                       : "Data",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Questa estensione richiede una versione di {APP_NAME} più recente.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Questa estensione al momento può funzionare solo con versioni di {APP_NAME} più vecchie.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "La versione {0} di questa estensione richiede una versione di {APP_NAME} più recente.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "La versione {0} di questa estensione richiede una versione di {APP_NAME} più vecchia. Ma puoi comunque installare una versione più recente {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Nessuna descrizione",
    "EXTENSION_MORE_INFO"                  : "Più info...",
    "EXTENSION_ERROR"                      : "Errore di estensione",
    "EXTENSION_KEYWORDS"                   : "Parole chiave",
    "EXTENSION_INSTALLED"                  : "Installata",
    "EXTENSION_UPDATE_INSTALLED"           : "Questo aggiornamento dell'estensione è stato scaricato e sarà installato dopo il riavvio di {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Cerca",
    "EXTENSION_MORE_INFO_LINK"             : "Altro",
    "BROWSE_EXTENSIONS"                    : "Naviga le Estensioni",
    "EXTENSION_MANAGER_REMOVE"             : "Rimuovi Estensione",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Impossibile rimuovere una o più estensioni: {0}. {APP_NAME} si riavvierà comunque.",
    "EXTENSION_MANAGER_UPDATE"             : "Aggiorna Estensioni",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Impossibile aggiornare una o più estensioni: {0}. {APP_NAME} si riavvierà comunque.",
    "MARKED_FOR_REMOVAL"                   : "Marcato per la rimozione",
    "UNDO_REMOVE"                          : "Annulla",
    "MARKED_FOR_UPDATE"                    : "Marcato per l'aggiornamento",
    "UNDO_UPDATE"                          : "Annulla",
    "CHANGE_AND_RELOAD_TITLE"              : "Cambia Estensioni",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Per aggiornare o rimuovere le estensioni marcate, {APP_NAME} dovrà riavviarsi. Ti verrà chiesto di salvare le modifiche apportate.",
    "REMOVE_AND_RELOAD"                    : "Rimuovi le estensioni e riavvia",
    "CHANGE_AND_RELOAD"                    : "Modifica le estensioni e riavvia",
    "UPDATE_AND_RELOAD"                    : "Aggiorna Rimuovi le estensioni e riavvia",
    "PROCESSING_EXTENSIONS"                : "Processo le modifiche alle estensioni\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Impossibile rimuovere l'estensione {0}. Non era installata.",
    "NO_EXTENSIONS"                        : "Nessuna estensione ancora installata.<br />Clicca nel tab delle Disponibili per iniziare.",
    "NO_EXTENSION_MATCHES"                 : "Nessuna estensione soddisfa la tua ricerca.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Fai attenzione quando installi le estensioni da sorgenti sconosciute.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Installata",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Disponibili",
    "EXTENSIONS_UPDATES_TITLE"             : "Aggiornamenti",
    
    "INLINE_EDITOR_NO_MATCHES"             : "Nessuna corrispondenza disponibile.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Non ci sono regole CSS esistenti che corrispondano alla tua selezione.<br />Clicca \"Nuova Regola\" per crearne una.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Non ci sono fogli di stile nel tuo progetto.<br />Creane uno per aggiungere regole CSS.",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixel",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Debug",
    "CMD_SHOW_DEV_TOOLS"                        : "Mostra strumenti per gli sviluppatori",
    "CMD_REFRESH_WINDOW"                        : "Riavvia con le Estensioni",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Riavvia senza Estensioni",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nuova finestra di {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Passa alla lingua",
    "CMD_RUN_UNIT_TESTS"                        : "Esegui i test",
    "CMD_SHOW_PERF_DATA"                        : "Mostra dati sulla performance",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Abilita Node Debugger",
    "CMD_LOG_NODE_STATE"                        : "Registra i Log Node State nella Console",
    "CMD_RESTART_NODE"                          : "Riavvia Node",
    
    "LANGUAGE_TITLE"                            : "Passa alla lingua",
    "LANGUAGE_MESSAGE"                          : "Lingua:",
    "LANGUAGE_SUBMIT"                           : "Riavvia {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Annulla",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Default di sistema",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "Ceco",
    "LOCALE_DE"                                 : "Tedesco",
    "LOCALE_EL"                                 : "Greco",
    "LOCALE_EN"                                 : "Inglese",
    "LOCALE_ES"                                 : "Spagnolo",
    "LOCALE_FI"                                 : "Finlandese",
    "LOCALE_FR"                                 : "Francese",
    "LOCALE_IT"                                 : "Italiano",
    "LOCALE_JA"                                 : "Giapponese",
    "LOCALE_NB"                                 : "Norvegese",
    "LOCALE_NL"                                 : "Olandese",
    "LOCALE_FA_IR"                              : "Persiano",
    "LOCALE_PL"                                 : "Polacco",
    "LOCALE_PT_BR"                              : "Portoghese, Brasiliano",
    "LOCALE_PT_PT"                              : "Portoghese",
    "LOCALE_RO"                                 : "Romeno",
    "LOCALE_RU"                                 : "Russo",
    "LOCALE_SK"                                 : "Slovacco",
    "LOCALE_SR"                                 : "Serbo",
    "LOCALE_SV"                                 : "Svedese",
    "LOCALE_TR"                                 : "Turco",
    "LOCALE_ZH_CN"                              : "Cinese, semplificato",
    "LOCALE_HU"                                 : "Ungherese",
    "LOCALE_KO"                                 : "Coreano",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Tempo",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progresso",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Sposta punto selezionato<br><kbd class='text'>Maiuscola</kbd> Muovi di dieci unità",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Aumenta o diminuisci<br><kbd>←</kbd><kbd>→</kbd> 'Inizio' o 'Fine'",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Colore corrente",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Colore originale",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Formato RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Formato Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Formato HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Usato {1} volta)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Usato {1} volte)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Passa alla definizione",
    "CMD_SHOW_PARAMETER_HINT"                   : "Mostra suggerimenti sul parametro",
    "NO_ARGUMENTS"                              : "<nessun parametro>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Vista Veloce al passaggio del mouse",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Progetti recenti",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Leggi tutto"
});
