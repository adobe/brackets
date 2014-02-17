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
    "GENERIC_ERROR"                     : "(error {0})",
    "NOT_FOUND_ERR"                     : "No s'ha trobat l'arxiu.",
    "NOT_READABLE_ERR"                  : "No es pot llegir l'arxiu.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "El directori de destí no es pot modificar.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Els permisos no permeten fer modificacions.",
    "CONTENTS_MODIFIED_ERR"             : "L'arxiu s'ha modificat fora de {APP_NAME}.",
    "FILE_EXISTS_ERR"                   : "L'arxiu ja existeix",
    "FILE"                              : "Arxiu",
    "DIRECTORY"                         : "Directori",
    
    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Error obrint el projecte",
    "OPEN_DIALOG_ERROR"                 : "Hi ha hagut un error en mostrar l'avís d'obertura d'arxiu. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Hi ha hagut un error en intentar obrir el directori <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Hi ha hagut un error en llegir els continguts del directori <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Error obrint l'arxiu",
    "ERROR_OPENING_FILE"                : "Hi ha hagut un error en intentar obrir l'arxiu <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Hi ha hagut un error en intentar obrir els següents arxius:",
    "ERROR_RELOADING_FILE_TITLE"        : "Error recarregant canvis des del disc",
    "ERROR_RELOADING_FILE"              : "Hi ha hagut un error en intentar recarregar l'arxiu <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Error guardant l'arxiu",
    "ERROR_SAVING_FILE"                 : "Hi ha hagut un error en intentar guardar l'arxiu <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Error canviant el nom de l'arxiu",
    "ERROR_RENAMING_FILE"               : "Hi ha hagut un error en intentar canviar el nom de l'arxiu <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Error eliminant l'arxiu",
    "ERROR_DELETING_FILE"               : "Hi ha hagut un error en intentar eliminar l'arxiu <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nom de {0} invàlid",
    "INVALID_FILENAME_MESSAGE"          : "Els noms d'arxiu no poden contenir els següents caracters: /?*:;{}<>\\| o fer servir paraules reservades del sistema",
    "FILE_ALREADY_EXISTS"               : "El {0} <span class='dialog-filename'>{0}</span> ja existeix.",
    "ERROR_CREATING_FILE_TITLE"         : "Error en crear {0}",
    "ERROR_CREATING_FILE"               : "Hi ha hagut un error en intentar crear el {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Vaja, sembla que {APP_NAME} encara no funciona en navegadors.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} està desenvolupat en HTML, però ara mateix funciona com una aplicació d'escriptori per a poder editar arxius en local. Si us plau, utilitza l'aplicació del repositori <b>github.com/adobe/brackets-shell</b> per a executar {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Error al indexar arxius",
    "ERROR_MAX_FILES"                   : "S'ha arribat al màxim d'arxius indexables. Pot ser que les accions que busquen arxius a l'índex funcionin de manera incorrecta.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Error al iniciar el navegador",
    "ERROR_CANT_FIND_CHROME"            : "No s'ha trobat el navegador Google Chrome. Si us plau, mira si aquest esta instalat correctament.",
    "ERROR_LAUNCHING_BROWSER"           : "Hi ha hagut un error al iniciar el navegador. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Error durant el Desenvolupament a Temps Real",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Connectant amb el navegador...",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Per a poder iniciar el mode de Desenvolupament a Temps Real, Chrome s'ha d'iniciar habilitant la depuracio remota.<br /><br />Vols reiniciar Google Chrome y habilitar la depuració remota?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "No es pot carregar la pàgina per al Desenvolupament a Temps Real",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Obre un arxiu HTML o assegura't de que hi hagi un index.html en el teu projecte per a poder iniciar el mode de Desenvolupament a Temps Real.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Necessites especificar una URL base en aquest projecte per a poder iniciar Desenvolupament a Temps Real amb arxius de servidor.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Error al iniciar el servidor HTTP per a Desenvolupament a Temps Real. Torna-ho a intentar, Si us plau.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Benvingut al Desenvolupament a Temps Real!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "El Desenvolupament a Temps Real es connecta {APP_NAME} amb el teu navegador. Fa una vista prèvia del teu arxiu HTML amb el navegador i l'actualitza a mesura que modifiques el teu codi.<br /><br />En aquesta versió preliminar de {APP_NAME}, Desenvolupament a Temps Real només funciona per a canvis d'<strong>arxius CSS o HTML</strong> i únicament amb <strong>Google Chrome</strong>. Els canvis en els arxius Javascript són recarregats automàticament quan es guarden.<br /><br />(No tornarás a veure aquest missatge.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Per a més informació, consulta <a href='{0}' title='{0}'>Resolució de Problemes de connexio en Desenvolupament a Temps Real</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Desenvolupament a Temps Real",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Desenvolupament a Temps Real: Conectant\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Desenvolupament a Temps Real: Inicializant\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Tancar el Desenvolupament a Temps Real",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Desenvolupament a Temps Real (guarda l'arxiu per a actualitzar)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Desenvolupament a Temps Real (no s'esta actualizant degut a un error de sintaxi)",
    
    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Desenvolupament a Temps Real s'ha detingut perquè s'han obert les eines de desenvolupament",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Desenvolupament a Temps Real s'ha detingut perquè s'ha tancat la pàgina al navegador",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Desenvolupament a Temps Real s'ha detingut perquè s'ha accedit a una pàgina que no forma part del projecte actual",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Desenvolupament a Temps Real s'ha detingut per motius desconeguts ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Guardar canvis",
    "SAVE_CLOSE_MESSAGE"                : "Vols guardar els canvis existents en el document <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Vols guardar els teus canvis en els següents documents?",
    "EXT_MODIFIED_TITLE"                : "Canvis externs",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Confirmar eliminació",
    "CONFIRM_FOLDER_DELETE"             : "¿Estàs segur de que vols eliminar el directori <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "arxiu eliminat",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> s'ha modificat en el disc.<br /><br />Vols guardar l'arxiu i sobreescriure aquests canvis?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> s'ha modificat, pero també te canvis en {APP_NAME}.<br /><br />¿Quina versió vols conservar?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> s'ha eliminat, pero té canvis sense guardar en {APP_NAME}.<br /><br />¿Vols conservar els canvis?",
    
    // Generic dialog/button labels
    "OK"                                : "Acceptar",
    "CANCEL"                            : "Cancel·lar",
    "DONT_SAVE"                         : "No guardar",
    "SAVE"                              : "Guardar",
    "SAVE_AS"                           : "Guardar com\u2026",
    "SAVE_AND_OVERWRITE"                : "Guardar i reemplaçar",
    "DELETE"                            : "Eliminar",
    "BUTTON_YES"                        : "Si",
    "BUTTON_NO"                         : "No",
    
    // Find, Replace, Find in Files
    "FIND_RESULT_COUNT"                 : "{0} resultats",
    "FIND_RESULT_COUNT_SINGLE"          : "1 resultat",
    "FIND_NO_RESULTS"                   : "No hi ha resultats",
    "REPLACE_PLACEHOLDER"               : "Reemplaçar amb\u2026",
    "BUTTON_REPLACE_ALL"                : "Tot\u2026",
    "BUTTON_REPLACE"                    : "Reemplaçar",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "següent coincidència",
    "BUTTON_PREV_HINT"                  : "Anterior coincidència",
    "BUTTON_CASESENSITIVE_HINT"         : "Sensible a majúscules",
    "BUTTON_REGEXP_HINT"                : "Expressió regular",
    
    "OPEN_FILE"                         : "Obrir arxiu",
    "SAVE_FILE_AS"                      : "Guardar arxiu",
    "CHOOSE_FOLDER"                     : "Escull una carpeta",

    "RELEASE_NOTES"                     : "Notes sobre la versió",
    "NO_UPDATE_TITLE"                   : "¡Estás actualitzat!",
    "NO_UPDATE_MESSAGE"                 : "Estàs fent servir la última versió de {APP_NAME}.",
    
    // Replace All (in single file)
    "FIND_REPLACE_TITLE_PART1"          : "Reemplaçar \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" amb \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",
    
    // Find in Files
    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" trobat",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} en {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "en <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "en el projecte",
    "FIND_IN_FILES_FILE"                : "arxiu",
    "FIND_IN_FILES_FILES"               : "arxius",
    "FIND_IN_FILES_MATCH"               : "coincidència",
    "FIND_IN_FILES_MATCHES"             : "coincidències",
    "FIND_IN_FILES_MORE_THAN"           : "més de ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd click per a expandir/contreure tot",
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Error obtenint informació sobre les actualitzacions",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Hi ha hagut un problema al obtenir la informació sobre les últimes actualitzacions des del servidor. Si us plau, assegura't d'estar connectat a internet i torna-ho a intentar.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Carregant\u2026",
    "UNTITLED"          : "Sense títol",
    "WORKING_FILES"     : "Àrea de treball",
    
    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Maj",
    "KEYBOARD_SPACE"  : "Espai",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "línia {0}, Columna {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} columna seleccionada",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} columnes seleccionades",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} línia seleccionada",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} línies seleccionades",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Fes click per a usar espais en la sagna",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Fes click per a usar tabulacions en la sagna",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Fes click per a canviar el nombre d'espais usats en la sagna",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Fes click per a canviar l'amplada de les tabulacions",
    "STATUSBAR_SPACES"                      : "Espais:",
    "STATUSBAR_TAB_SIZE"                    : "Mida de tabulador:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} línia",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} línies",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Extensions desactivades",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",
    
    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_SINGLE"             : "{0} Problemes",
    "ERRORS_PANEL_TITLE_MULTI"              : "Problemes de sintaxi",
    "SINGLE_ERROR"                          : "1 Error de {0}",
    "MULTIPLE_ERRORS"                       : "{1} Errores de {0}",
    "NO_ERRORS"                             : "No hi ha errors de {0}. ¡Bona feina!",
    "LINT_DISABLED"                         : "La inspecció de codi es troba deshabilitada",
    "NO_LINT_AVAILABLE"                     : "No hi ha inspecció de codi disponible per a {0}",
    "NOTHING_TO_LINT"                       : "No hi ha res per a inspeccionar",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Arxiu",
    "CMD_FILE_NEW_UNTITLED"               : "Nou",
    "CMD_FILE_NEW"                        : "Nou arxiu",
    "CMD_FILE_NEW_FOLDER"                 : "Nova carpeta",
    "CMD_FILE_OPEN"                       : "Obrir\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Afegir a l'espai de treball",
    "CMD_OPEN_DROPPED_FILES"              : "Obrir arxius deixats anar",
    "CMD_OPEN_FOLDER"                     : "Obrir carpeta\u2026",
    "CMD_FILE_CLOSE"                      : "Tancar",
    "CMD_FILE_CLOSE_ALL"                  : "Tancar tot",
    "CMD_FILE_CLOSE_LIST"                 : "Tancar llista",
    "CMD_FILE_CLOSE_OTHERS"               : "Tancar altres",
    "CMD_FILE_CLOSE_ABOVE"                : "Tancar altres per sobre",
    "CMD_FILE_CLOSE_BELOW"                : "Tancar altres per sota",
    "CMD_FILE_SAVE"                       : "Guardar",
    "CMD_FILE_SAVE_ALL"                   : "Guardar tot",
    "CMD_FILE_SAVE_AS"                    : "Guardar com a\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Desenvolupament a Temps Real",
    "CMD_PROJECT_SETTINGS"                : "Configuració del projecte\u2026",
    "CMD_FILE_RENAME"                     : "Canviar el nom",
    "CMD_FILE_DELETE"                     : "Eliminar",
    "CMD_INSTALL_EXTENSION"               : "instal·lar extensió\u2026",
    "CMD_EXTENSION_MANAGER"               : "Gestionar extensions\u2026",
    "CMD_FILE_REFRESH"                    : "Actualitzar arbre d'arxius",
    "CMD_QUIT"                            : "Sortir",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Sortir",
    
    // Edit menu commands
    "EDIT_MENU"                           : "Edició",
    "CMD_UNDO"                            : "Desfer",
    "CMD_REDO"                            : "Refer",
    "CMD_CUT"                             : "Tallar",
    "CMD_COPY"                            : "Copiar",
    "CMD_PASTE"                           : "Enganxar",
    "CMD_SELECT_ALL"                      : "Seleccionar tot",
    "CMD_SELECT_LINE"                     : "Seleccionar línia",
    "CMD_FIND"                            : "Cercar",
    "CMD_FIND_FIELD_PLACEHOLDER"          : "Cercar\u2026",
    "CMD_FIND_IN_FILES"                   : "Cercar en arxius",
    "CMD_FIND_IN_SUBTREE"                 : "Cercar en\u2026",
    "CMD_FIND_NEXT"                       : "Cercar següent",
    "CMD_FIND_PREVIOUS"                   : "Cercar anterior",
    "CMD_REPLACE"                         : "Reemplaçar",
    "CMD_INDENT"                          : "Augmentar sagna",
    "CMD_UNINDENT"                        : "disminuir sagna",
    "CMD_DUPLICATE"                       : "Duplicar",
    "CMD_DELETE_LINES"                    : "Eliminar línia",
    "CMD_COMMENT"                         : "Comentar/Descomentar línia",
    "CMD_BLOCK_COMMENT"                   : "Comentar/Descomentar bloc",
    "CMD_LINE_UP"                         : "Pujar línia",
    "CMD_LINE_DOWN"                       : "Baixar línia",
    "CMD_OPEN_LINE_ABOVE"                 : "Crear línia amunt",
    "CMD_OPEN_LINE_BELOW"                 : "Crear línia avall",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Completar parèntesi automàticament",
    "CMD_SHOW_CODE_HINTS"                 : "Mostrar suggeriments de codi",
    
    // View menu commands
    "VIEW_MENU"                           : "Veure",
    "CMD_HIDE_SIDEBAR"                    : "Ocultar menú lateral",
    "CMD_SHOW_SIDEBAR"                    : "Mostrar menú lateral",
    "CMD_INCREASE_FONT_SIZE"              : "Augmentar mida de font",
    "CMD_DECREASE_FONT_SIZE"              : "Disminuir mida de font",
    "CMD_RESTORE_FONT_SIZE"               : "Restablir mida de font",
    "CMD_SCROLL_LINE_UP"                  : "Desplaçar cap amunt",
    "CMD_SCROLL_LINE_DOWN"                : "Desplaçar cap avall",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Mostrar números de línia",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Resaltar línia actual",
    "CMD_TOGGLE_WORD_WRAP"                : "Habilitar ajustos de línia",
    "CMD_LIVE_HIGHLIGHT"                  : "Destacat en Desenvolupament a Temps Real",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Inspeccionar el codi quan guardis",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Ordenar per Afegit",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Ordenar per Nom",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Ordenar per Tipus",
    "CMD_SORT_WORKINGSET_AUTO"            : "Ordenació automàtica",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegació",
    "CMD_QUICK_OPEN"                      : "Obertura ràpida",
    "CMD_GOTO_LINE"                       : "Anar a la línia",
    "CMD_GOTO_DEFINITION"                 : "Cerca ràpida de definició",
    "CMD_GOTO_FIRST_PROBLEM"              : "Anar al primer Error/Advertència",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edició ràpida",
    "CMD_TOGGLE_QUICK_DOCS"               : "Documentació ràpida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Coincidència anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Coincidència següent",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Nova regla",
    "CMD_NEXT_DOC"                        : "Document següent",
    "CMD_PREV_DOC"                        : "Document anterior",
    "CMD_SHOW_IN_TREE"                    : "Mostrar en l'arbre de directoris",
    "CMD_SHOW_IN_OS"                      : "Mostrar en el Sistema Operatiu",
    
    // Help menu commands
    "HELP_MENU"                           : "Ajuda",
    "CMD_CHECK_FOR_UPDATE"                : "Cercar actualitzacions",
    "CMD_HOW_TO_USE_BRACKETS"             : "Com utilitzar {APP_NAME}",
    "CMD_FORUM"                           : "Forum de {APP_NAME}",
    "CMD_RELEASE_NOTES"                   : "Notes de la versió",
    "CMD_REPORT_AN_ISSUE"                 : "Informar sobre un error",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "obrir carpeta d'extensions",
    "CMD_TWITTER"                         : "{TWITTER_NAME} a Twitter",
    "CMD_ABOUT"                           : "Quant a {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Preferències",
    
    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Versió experimental",
    "DEVELOPMENT_BUILD"                    : "Versió de desenvolupament",
    "RELOAD_FROM_DISK"                     : "Tornar a carregar des del disc",
    "KEEP_CHANGES_IN_EDITOR"               : "Conservar els canvis de l'editor",
    "CLOSE_DONT_SAVE"                      : "Tancar (No guardar)",
    "RELAUNCH_CHROME"                      : "Reiniciar Chrome",
    "ABOUT"                                : "Quant a\u2026",
    "CLOSE"                                : "tancar",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Els avisos, termes y condicions pertanyents a software de tercers es troben a <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> i s'inclouen aquí com a referència.",
    "ABOUT_TEXT_LINE4"                     : "pots trobar la documentació i codi font a <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Fet amb \u2764 i JavaScript per:",
    "ABOUT_TEXT_LINE6"                     : "Molta gent (però ara mateix estem tenint problemes per a carregar aquestes dades).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "El contingut de Web Platform Docs i el logo de Web Platform están disponibles sota una Llicencia de Reconeixement de Creative Commons, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Hi ha una nova versió de {APP_NAME} disponible! Fes clic aquí per a més detalls.",
    "UPDATE_AVAILABLE_TITLE"               : "actualització disponible",
    "UPDATE_MESSAGE"                       : "Hi ha una nova versió de {APP_NAME} disponible! Aquestes son algunes de les noves característiques:",
    "GET_IT_NOW"                           : "Aconsegueix-ho ara!",
    "PROJECT_SETTINGS_TITLE"               : "Configuració del projecte per a: {0}",
    "PROJECT_SETTING_BASE_URL"             : "URL base per a Desenvolupament a Temps Real",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(deixa en blanc per a urls de tipus \"file\")",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Desenvolupament a Temps Real no suporta el protocol {0}. Si us plau, utilitza http: o https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "La URL base no pot contenir paràmetres de cerca com \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "La URL base no pot contenir hashes como \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Els caràcters especials com '{0}' han de codificar-se en format %.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Error desconegut analitzant la URL base",
    
    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Nova norma",
    
    // Extension Management strings
    "INSTALL"                              : "instal·lar",
    "UPDATE"                               : "actualitzar",
    "REMOVE"                               : "Eliminar",
    "OVERWRITE"                            : "sobreescriure",
    "CANT_REMOVE_DEV"                      : "Les extensions en la carpeta \"dev\" s'han d'eliminar manualment.",
    "CANT_UPDATE"                          : "L'actualització no és compatible amb aquesta versió de {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Les extensions situades a la carpeta \"dev\" no es poden actualitzar automáticament.",
    "INSTALL_EXTENSION_TITLE"              : "instal·lar extensió",
    "UPDATE_EXTENSION_TITLE"               : "actualitzar extensió",
    "INSTALL_EXTENSION_LABEL"              : "URL de l'extensió",
    "INSTALL_EXTENSION_HINT"               : "URL de l'arxiu zip de l'extensió o del repositori de Github",
    "INSTALLING_FROM"                      : "Instal·lant extensió des de {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "¡Instal·lació completa!",
    "INSTALL_FAILED"                       : "Error en la instal·lació.",
    "CANCELING_INSTALL"                    : "cancel·lant\u2026",
    "CANCELING_HUNG"                       : "La Instal·lació està trigant massa; cancel·lant... Pot ser que s'hagi produït un error intern.",
    "INSTALL_CANCELED"                     : "Instalació cancel·lada.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "El contingut descarregat no es un arxiu zip vàlid.",
    "INVALID_PACKAGE_JSON"                 : "l'arxiu package.json no es vàlid (error: {0}).",
    "MISSING_PACKAGE_NAME"                 : "l'arxiu package.json no especifica un nom de paquet.",
    "BAD_PACKAGE_NAME"                     : "{0} no és un nom de paquet vàlid.",
    "MISSING_PACKAGE_VERSION"              : "l'arxiu package.json no especifica la versió del paquet.",
    "INVALID_VERSION_NUMBER"               : "El número de paquet de la versió ({0}) no és vàlid.",
    "INVALID_BRACKETS_VERSION"             : "El codi de compatibilitat de {APP_NAME} {{0}} no és vàlid.",
    "DISALLOWED_WORDS"                     : "Les paraules {{1}} no estan permeses en el camp {{0}}.",
    "API_NOT_COMPATIBLE"                   : "L'extensió no és compatible amb aquesta versió de {APP_NAME}. Es troba a la carpeta d'extensions deshabilitades.",
    "MISSING_MAIN"                         : "El paquet no conté l'arxiu main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "instal·lar aquest paquet sobreescriurà una extensió instal·lada prèviament. ¿Vols sobreescriure l'antiga extensió?",
    "EXTENSION_SAME_VERSION"               : "La versió de aquest paquet es la mateixa que la instal·lada actualment. ¿Vols sobreescriure la instal·lació actual?",
    "EXTENSION_OLDER_VERSION"              : "La versió {0} d'aquest paquet és més antiga que la instal·lada actualment ({1}). ¿Vols sobreescriure la instalació actual?",
    "DOWNLOAD_ID_IN_USE"                   : "Error intern: la ID de descàrrega ja s'està utilitzant.",
    "NO_SERVER_RESPONSE"                   : "No es pot connectar amb el servidor.",
    "BAD_HTTP_STATUS"                      : "Arxiu no trobat en el servidor (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "No es pot guardar la descàrrega en un arxiu temporal.",
    "ERROR_LOADING"                        : "L'extensió ha trobat un error al iniciar-se.",
    "MALFORMED_URL"                        : "La URL no és vàlida. Si us plau, comprova que l'has escrit correctament.",
    "UNSUPPORTED_PROTOCOL"                 : "La URL ha de ser una direcció http o https.",
    "UNKNOWN_ERROR"                        : "Error intern desconegut.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Gestor d'extensions",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "No es pot accedir al registre d'extensions. Torna a intentar-ho més tard, Si us plau.",
    "INSTALL_FROM_URL"                     : "instal·lar des de URL\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Data",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Aquesta extensió necessita una versió més actualitzada de {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "En aquests moments aquesta extensió només funciona amb versions anteriors de {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "La versió {0} d'aquesta extensió necessita una versió superior de {APP_NAME}. Pots instal·lar la versió anterior {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "La versió {0} d'aquesta extensió només funciona amb versions anteriors de {APP_NAME}. Pots instal·lar la versió anterior {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Sense descripció",
    "EXTENSION_MORE_INFO"                  : "més informació...",
    "EXTENSION_ERROR"                      : "Error en l'extensió",
    "EXTENSION_KEYWORDS"                   : "paraula clau",
    "EXTENSION_INSTALLED"                  : "Instal·lada",
    "EXTENSION_UPDATE_INSTALLED"           : "L'actualització d'aquesta extensió s'ha descarregat y s'instal·lará quan tanquis {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Cercar",
    "EXTENSION_MORE_INFO_LINK"             : "Més",
    "BROWSE_EXTENSIONS"                    : "Explorar extensions",
    "EXTENSION_MANAGER_REMOVE"             : "Eliminar extensió",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "No es pot eliminar una o més extensions: {{0}}. {APP_NAME} es tancará de totes maneres.",
    "EXTENSION_MANAGER_UPDATE"             : "actualitzar extensió",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "No es pot actualitzar una o més extensions: {{0}}. {APP_NAME} es tancará de totes maneres.",
    "MARKED_FOR_REMOVAL"                   : "Marcada per a eliminar",
    "UNDO_REMOVE"                          : "Desfer",
    "MARKED_FOR_UPDATE"                    : "Marcada per a actualitzar",
    "UNDO_UPDATE"                          : "Desfer",
    "CHANGE_AND_RELOAD_TITLE"                : "Canviar extensions",
    "CHANGE_AND_RELOAD_MESSAGE"              : "Per a actualitzar o eliminar les extensions marcades, necessites reiniciar {APP_NAME}. Es demanarà confirmació Per a guardar els canvis pendents.",
    "REMOVE_AND_RELOAD"                      : "Eliminar extensions i reiniciar",
    "CHANGE_AND_RELOAD"                      : "Canviar extensions i reiniciar",
    "UPDATE_AND_RELOAD"                      : "Actualitzar extensions i reiniciar",
    "PROCESSING_EXTENSIONS"                : "Procesant els canvis en l'extensió\u2026",
    "EXTENSION_NOT_INSTALLED"              : "No es pot eliminar l'extensió {{0}} perquè no es troba instal·lada.",
    "NO_EXTENSIONS"                        : "Encara no hi ha cap extensió instal·lada.<br />Fes click a la pestanya Disponibles per a  començar.",
    "NO_EXTENSION_MATCHES"                 : "No hi ha extensions que coincideixin amb la teva cerca.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Ves amb compte quan instal·lis extensions des d'una font desconeguda.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Instal·lades",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Disponibles",
    "EXTENSIONS_UPDATES_TITLE"             : "Actualitzacions",
    
    "INLINE_EDITOR_NO_MATCHES"             : "No hi ha coincidències disponibles.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "No hi ha normes CSS existents que coincideixin amb la teva selecció.<br> Fes click en el botò \"Nova norma\" per a crear-ne una.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "No hi ha fulles d'estils en el teu projecte.<br>Crea'n una per a afegir normes CSS.",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "píxels",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Desenvolupament",
    "CMD_SHOW_DEV_TOOLS"                        : "Mostrar eines per a desenvolupadors",
    "CMD_REFRESH_WINDOW"                        : "Reiniciar {APP_NAME}",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Reiniciar sense extensions",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nova finestra de {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Canviar d'idioma",
    "CMD_RUN_UNIT_TESTS"                        : "Executar tests",
    "CMD_SHOW_PERF_DATA"                        : "Mostrar informació de rendiment",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Habilitar la depuració de Node",
    "CMD_LOG_NODE_STATE"                        : "Mostrar l'estat de Node en la Consola",
    "CMD_RESTART_NODE"                          : "Reiniciar Node",
    
    "LANGUAGE_TITLE"                            : "Canviar d'idioma",
    "LANGUAGE_MESSAGE"                          : "Idioma:",
    "LANGUAGE_SUBMIT"                           : "Reiniciar {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Cancel·lar",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Idioma predeterminat",
    
    // Locals (used by Debug > Switch Language)
    "LOCALE_CA"                                 : "Català",
    "LOCALE_CS"                                 : "Txec",
    "LOCALE_DE"                                 : "Alemany",
    "LOCALE_EL"                                 : "Grec",
    "LOCALE_EN"                                 : "Anglès",
    "LOCALE_ES"                                 : "Castellà",
    "LOCALE_FI"                                 : "Finès",
    "LOCALE_FR"                                 : "Francès",
    "LOCALE_IT"                                 : "Italià",
    "LOCALE_JA"                                 : "Japonès",
    "LOCALE_NB"                                 : "Noruec",
    "LOCALE_NL"                                 : "Holandès",
    "LOCALE_FA_IR"                              : "Persa-Farsi",
    "LOCALE_PL"                                 : "Polonès",
    "LOCALE_PT_BR"                              : "Portuguès, Brasil",
    "LOCALE_PT_PT"                              : "Portuguès",
    "LOCALE_RO"                                 : "Romanès",
    "LOCALE_RU"                                 : "Rus",
    "LOCALE_SK"                                 : "Eslovac",
    "LOCALE_SR"                                 : "Serbi",
    "LOCALE_SV"                                 : "Suec",
    "LOCALE_TR"                                 : "Turc",
    "LOCALE_ZH_CN"                              : "Xinès, simplificat",
    "LOCALE_HU"                                 : "Hongarès",
    "LOCALE_KO"                                 : "Coreà",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Temps",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progressió",
    "BEZIER_EDITOR_INFO" : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Moure el punt seleccionat<br><kbd class='text'>Shift</kbd> Moure de 10 en 10<br><kbd class='text'>Tab</kbd> Canviar els punts",
    "STEPS_EDITOR_INFO" : "<kbd>↑</kbd><kbd>↓</kbd> Incrementar o decrementar els pasos<br><kbd>←</kbd><kbd>→</kbd> 'Començar' o 'Finalitzar'",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Color actual",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Color original",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Format RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Format Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Format HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Utilitzat {1} vegada)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Utilitzat {1} vegades)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Saltar a la definició",
    "CMD_SHOW_PARAMETER_HINT"                   : "Mostrar suggeriments de paràmetres",
    "NO_ARGUMENTS"                              : "<no hi ha paràmetres>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Vista ràpida amb el cursor",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Projectes recents",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Més"
});