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
    "NOT_FOUND_ERR"                     : "No se pudo encontrar el archivo.",
    "NOT_READABLE_ERR"                  : "No se pudo leer el archivo.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "El directorio de destino no se puede modificar.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Los permisos no permiten hacer modificaciones.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Error abriendo el proyecto",
    "OPEN_DIALOG_ERROR"                 : "Ha ocurrido un error al mostrar el aviso de apertura de archivo. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ha ocurrido un error al intentar abrir el directorio <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Ha ocurrido un error al leer los contenidos del directorio <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Error abriendo archivo",
    "ERROR_OPENING_FILE"                : "Ha ocurrido un error al intentar abrir el archivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Error recargando cambios desde disco",
    "ERROR_RELOADING_FILE"              : "Ha ocurrido un error al intentar recargar el archivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Error guardando archivo",
    "ERROR_SAVING_FILE"                 : "Ha ocurrido un error al intentar guardar el archivo <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nombre de archivo inv\u00E1lido",
    "INVALID_FILENAME_MESSAGE"          : "Los nombres de archivo no pueden contener los siguientes caracteres: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "El archivo <span class='dialog-filename'>{0}</span> ya existe.",
    "ERROR_CREATING_FILE_TITLE"         : "Error creando archivo",
    "ERROR_CREATING_FILE"               : "Ha ocurrido un error al intentar crear el archivo <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_BRACKETS_IN_BROWSER_TITLE"   : "Vaya\u2026 parece que Brackets todav\u00EDa no funciona en navegadores.",
    "ERROR_BRACKETS_IN_BROWSER"         : "Brackets est\u00E1 desarrollado en HTML, pero por ahora funciona como una aplicaci\u00F3n de escritorio para que puedas editar archivos en local. Por favor, utiliza la aplicaci\u00F3n del repositorio <b>github.com/adobe/brackets-app</b> para ejecutar Brackets.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Error indexando archivos",
    "ERROR_MAX_FILES"                   : "Se ha alcanzado el n\u00FAmero m\u00E1ximo de archivos indexables. Puede que algunas de las acciones que utilizan archivos del \u00EDndice no funcionen correctamente.",
    
    // CSSManager error strings
    "ERROR_PARSE_TITLE"                 : "Error parseando fichero(s) CSS:",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Error iniciando navegador",
    "ERROR_CANT_FIND_CHROME"            : "No se pudo encontrar el navegador Google Chrome. Por favor, aseg\u00FArate de que est\u00E9 instalado correctamente.",
    "ERROR_LAUNCHING_BROWSER"           : "Ha ocurrido un error al iniciar el navegador. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Error en desarrollo en directo",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "No se pudo establecer una conexi\u00F3n en vivo con Chrome. Para poder desarrollar en vivo, Chrome debe ser iniciado depuraci\u00F3n remota habilitada.<br /><br />¿Quieres reiniciar Chrome habilitar la depuraci\u00F3n remota?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Abre un archivo HTML para poder ejecutar la funcionalidad de desarrollo en directo.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Desarrollo en directo",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Desarrollo en directo: Conectando...",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Desarrollo en directo: Inicializando...",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Terminar desarrollo en directo",
    
    "SAVE_CLOSE_TITLE"                  : "Guardar cambios",
    "SAVE_CLOSE_MESSAGE"                : "¿Quieres guardar los cambios existentes en el documento <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "¿Quieres guardar tus cambios en los siguientes documentos?",
    "EXT_MODIFIED_TITLE"                : "Cambios externos",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> ha sido modificado, pero tambi\u00E9n tiene cambios en Brackets.<br /><br />¿Qu\u00E9 versi\u00F3n quieres conservar?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> ha sido eliminado, pero tiene cambios sin guardar en Brackets.<br /><br />¿Quieres conservar tus cambios?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Utiliza /re/ para b\u00FAsquedas con expresiones regulares",
    "WITH"                              : "Con",
    "BUTTON_YES"                        : "S\u00ED",
    "BUTTON_NO"                         : "No",
    "BUTTON_STOP"                       : "Parar",

    "OPEN_FILE"                         : "Abrir archivo",

    "RELEASE_NOTES"                     : "Notas de versi\u00F3n",
    "NO_UPDATE_TITLE"                   : "¡Est\u00E1s actualizado!",
    "NO_UPDATE_MESSAGE"                 : "Est\u00E1s utilizando la \u00FAltima versi\u00F3n de Brackets.",

    // Switch language
    "LANGUAGE_TITLE"                    : "Cambiar idioma",
    "LANGUAGE_MESSAGE"                  : "Por favor, elige el idioma deseado de la siguiente lista:",
    "LANGUAGE_SUBMIT"                   : "Reiniciar Brackets",
    "LANGUAGE_CANCEL"                   : "Cancelar",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Sin titulo",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Archivo",
    "CMD_FILE_NEW"                        : "Nuevo",
    "CMD_FILE_OPEN"                       : "Abrir\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "A\u00F1adir a espacio de trabajo",
    "CMD_OPEN_FOLDER"                     : "Abrir carpeta\u2026",
    "CMD_FILE_CLOSE"                      : "Cerrar",
    "CMD_FILE_CLOSE_ALL"                  : "Cerrar todo",
    "CMD_FILE_SAVE"                       : "Guardar",
    "CMD_FILE_SAVE_ALL"                   : "Guardar todo",
    "CMD_LIVE_FILE_PREVIEW"               : "Desarrollo en vivo",
    "CMD_QUIT"                            : "Salir",

    // Edit menu commands
    "EDIT_MENU"                           : "Editar",
    "CMD_SELECT_ALL"                      : "Seleccionar todo",
    "CMD_FIND"                            : "Buscar",
    "CMD_FIND_IN_FILES"                   : "Buscar en archivos",
    "CMD_FIND_NEXT"                       : "Buscar siguiente",
    "CMD_FIND_PREVIOUS"                   : "Buscar anterior",
    "CMD_REPLACE"                         : "Reemplazar",
    "CMD_INDENT"                          : "Aumentar indentaci\u00F3n",
    "CMD_UNINDENT"                        : "Disminuir indentaci\u00F3n",
    "CMD_DUPLICATE"                       : "Duplicar",
    "CMD_COMMENT"                         : "Comentar/Descomentar l\u00EDneas",
    "CMD_LINE_UP"                         : "Subir l\u00EDnea(s)",
    "CMD_LINE_DOWN"                       : "Bajar l\u00EDnea(s)",
     
    // View menu commands
    "VIEW_MENU"                           : "Ver",
    "CMD_HIDE_SIDEBAR"                    : "Ocultar men\u00FA lateral",
    "CMD_SHOW_SIDEBAR"                    : "Mostrar men\u00FA lateral",
    "CMD_INCREASE_FONT_SIZE"              : "Aumentar tama\u00F1o de fuente",
    "CMD_DECREASE_FONT_SIZE"              : "Disminuir tama\u00F1o de fuente",
    "CMD_RESTORE_FONT_SIZE"               : "Restablecer tama\u00F1o de fuente",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegar",
    "CMD_QUICK_OPEN"                      : "Apertura r\u00E1pida",
    "CMD_GOTO_LINE"                       : "Ir a l\u00EDnea",
    "CMD_GOTO_DEFINITION"                 : "Ir a definici\u00F3n",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edici\u00F3n r\u00E1pida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Coincidencia anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Coincidencia siguiente",
    "CMD_NEXT_DOC"                        : "Documento siguiente",
    "CMD_PREV_DOC"                        : "Documento anterior",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Desarrollo",
    "CMD_REFRESH_WINDOW"                  : "Reiniciar Brackets",
    "CMD_SHOW_DEV_TOOLS"                  : "Mostrar herramientas para desarrolladores",
    "CMD_RUN_UNIT_TESTS"                  : "Ejecutar tests",
    "CMD_JSLINT"                          : "Habilitar JSLint",
    "CMD_SHOW_PERF_DATA"                  : "Mostrar informaci\u00F3n de rendimiento",
    "CMD_NEW_BRACKETS_WINDOW"             : "Nueva ventana de Brackets",
    "CMD_USE_TAB_CHARS"                   : "Usar tabulaciones",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Abrir carpeta de extensiones",
    "CMD_SWITCH_LANGUAGE"                 : "Cambiar idioma",
    "CMD_CHECK_FOR_UPDATE"                : "Buscar actualizaciones",

    // Help menu commands
    "CMD_ABOUT"                           : "Acerca de\u2026",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Cerrar ventana",
    "CMD_ABORT_QUIT"                      : "Cancelar salida",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Versi\u00F3n experimental",
    "JSLINT_ERRORS"                        : "Errores de JSLint",
    "SEARCH_RESULTS"                       : "Resultados de b\u00FAsqueda",
    "OK"                                   : "Aceptar",
    "DONT_SAVE"                            : "No guardar",
    "SAVE"                                 : "Guardar",
    "CANCEL"                               : "Cancelar",
    "RELOAD_FROM_DISK"                     : "Volver a cargar desde disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Conservar los cambios del editor",
    "CLOSE_DONT_SAVE"                      : "Cerrar (No guardar)",
    "RELAUNCH_CHROME"                      : "Reiniciar Chrome",
    "ABOUT"                                : "Acerca de",
    "BRACKETS"                             : "Brackets",
    "CLOSE"                                : "Cerrar",
    "ABOUT_TEXT_LINE1"                     : "sprint 13 versi\u00F3n experimental ",
    "ABOUT_TEXT_LINE2"                     : "Copyright 2012 Adobe Systems Incorporated and its licensors. All rights reserved.",
    "ABOUT_TEXT_LINE3"                     : "Notices; terms and conditions pertaining to third party software are located at ",
    "ABOUT_TEXT_LINE4"                     : " and incorporated by reference herein.",
    "ABOUT_TEXT_LINE5"                     : "Documentation and source at ",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "¡Hay una nueva versi\u00F3n de Brackets disponible! Haz click aqu\u00ED para m\u00E1s detalles.",
    "UPDATE_AVAILABLE_TITLE"               : "Actualizaci\u00F3n disponible",
    "UPDATE_MESSAGE"                       : "Oye, hay una nueva versi\u00F3n de Brackets disponible. \u00C9stas son algunas de las nuevas caracter\u00EDsticas:",
    "GET_IT_NOW"                           : "Get it now!"
});
