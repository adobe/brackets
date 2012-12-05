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
    "FILE_EXISTS_ERR"                   : "El archivo ya existe.",
    
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
    "ERROR_RENAMING_FILE_TITLE"         : "Error renombrando archivo",
    "ERROR_RENAMING_FILE"               : "Ha ocurrido un error al intentar renombrar el archivo <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nombre de archivo inválido",
    "INVALID_FILENAME_MESSAGE"          : "Los nombres de archivo no pueden contener los siguientes caracteres: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "El archivo <span class='dialog-filename'>{0}</span> ya existe.",
    "ERROR_CREATING_FILE_TITLE"         : "Error creando archivo",
    "ERROR_CREATING_FILE"               : "Ha ocurrido un error al intentar crear el archivo <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Vaya... parece que {APP_NAME} todavía no funciona en navegadores.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} está desarrollado en HTML, pero por ahora funciona como una aplicación de escritorio para que puedas editar archivos en local. Por favor, utiliza la aplicación del repositorio <b>github.com/adobe/brackets-shell</b> para ejecutar {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Error indexando archivos",
    "ERROR_MAX_FILES"                   : "Se ha alcanzado el número máximo de archivos indexables. Puede que las acciones que buscan archivos en el índice funcionen de manera incorrecta.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Error iniciando navegador",
    "ERROR_CANT_FIND_CHROME"            : "No se pudo encontrar el navegador Google Chrome. Por favor, asegúrate de que esté instalado correctamente.",
    "ERROR_LAUNCHING_BROWSER"           : "Ha ocurrido un error al iniciar el navegador. (error {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Error en Desarrollo en Vivo",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Conectando con el navegador",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Para poder iniciar el modo de Desarrollo en Vivo, Chrome debe ser iniciado habilitando la depuración remota.<br /><br />¿Quieres reiniciar Chrome y habilitar la depuración remota?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Abre un archivo HTML para poder iniciar el modo de Desarrollo en Vivo.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Necesitas especificar una URL base en este proyecto para poder iniciar Desarrollo en Vivo con archivos de servidor.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "¡Bienvenido a Desarrollo en Vivo!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Desarrollo en Vivo conecta {APP_NAME} con tu navegador. Lanza una vista previa de tu archivo HTML en el navegador y la actualiza a medida que modificas tu código.<br /><br />En esta versión preliminar de {APP_NAME}, Desarollo en Vivo sólo funciona para cambios de <strong>archivos CSS</strong> y únicamente con <strong>Google Chrome</strong>. ¡Pronto estará disponible también para HTML y JavaScript!<br /><br />(No volverás a ver este mensaje.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Consulta <a class=\"clickable-link\" data-href=\"{0}\">Resolución de Problemas de conexión en Desarrollo en Vivo</a> para más información.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Desarrollo en Vivo",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Desarrollo en Vivo: Conectando\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Desarrollo en Vivo: Inicializando\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Terminar Desarrollo en Vivo",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Desarrollo en Vivo: Haz click para desconectar (Guarda el archivo para actualizar)",
    
    "SAVE_CLOSE_TITLE"                  : "Guardar cambios",
    "SAVE_CLOSE_MESSAGE"                : "¿Quieres guardar los cambios existentes en el documento <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "¿Quieres guardar tus cambios en los siguientes documentos?",
    "EXT_MODIFIED_TITLE"                : "Cambios externos",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> ha sido modificado, pero también tiene cambios en {APP_NAME}.<br /><br />¿Qué versión quieres conservar?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> ha sido eliminado, pero tiene cambios sin guardar en {APP_NAME}.<br /><br />¿Quieres conservar tus cambios?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Utiliza /re/ para búsquedas con expresiones regulares",
    "WITH"                              : "Con",
    "BUTTON_YES"                        : "Sí",
    "BUTTON_NO"                         : "No",
    "BUTTON_STOP"                       : "Parar",

    "OPEN_FILE"                         : "Abrir archivo",
    "CHOOSE_FOLDER"                     : "Elige una carpeta",

    "RELEASE_NOTES"                     : "Notas de versión",
    "NO_UPDATE_TITLE"                   : "¡Estás actualizado!",
    "NO_UPDATE_MESSAGE"                 : "Estás utilizando la última versión de {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "- {0} {1} in {2} {3}",
    "FIND_IN_FILES_FILE"                : "archivo",
    "FIND_IN_FILES_FILES"               : "archivos",
    "FIND_IN_FILES_MATCH"               : "coincidencia",
    "FIND_IN_FILES_MATCHES"             : "coincidencias",
    "FIND_IN_FILES_MORE_THAN"           : "Más de ",
    "FIND_IN_FILES_MAX"                 : " (mostrando las primeras {0} coincidencias)",
    "FIND_IN_FILES_FILE_PATH"           : "Archivo: <b>{0}</b>",
    "FIND_IN_FILES_LINE"                : "línea:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Error obteniendo información sobre actualizaciones",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Ocurrió un problema al obtener la información sobre las últimas actualizaciones desde el servidor. Por favor, asegúrate de estar conectado a internet y vuelve a intentarlo.",
    
    // Switch language
    "LANGUAGE_TITLE"                    : "Cambiar idioma",
    "LANGUAGE_MESSAGE"                  : "Por favor, elige el idioma deseado de la siguiente lista:",
    "LANGUAGE_SUBMIT"                   : "Reiniciar {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "Cancelar",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Sin título",
    
    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Control",
    "KEYBOARD_SHIFT"  : "Mayúsculas",
    "KEYBOARD_SPACE"  : "Espacio",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Línea {0}, Columna {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Haz click para usar espacios en la sangría",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Haz click para usar tabulaciones en la sangría",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Haz click para cambiar el número de espacios usados en la sangría",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Haz click para cambiar el ancho de las tabulaciones",
    "STATUSBAR_SPACES"                      : "Espacios",
    "STATUSBAR_TAB_SIZE"                    : "Tamaño de tabulador",
    "STATUSBAR_LINE_COUNT"                  : "{0} Líneas",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Archivo",
    "CMD_FILE_NEW"                        : "Nuevo",
    "CMD_FILE_NEW_FOLDER"                 : "Nueva carpeta",
    "CMD_FILE_OPEN"                       : "Abrir\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Añadir a espacio de trabajo",
    "CMD_OPEN_FOLDER"                     : "Abrir carpeta\u2026",
    "CMD_FILE_CLOSE"                      : "Cerrar",
    "CMD_FILE_CLOSE_ALL"                  : "Cerrar todo",
    "CMD_FILE_SAVE"                       : "Guardar",
    "CMD_FILE_SAVE_ALL"                   : "Guardar todo",
    "CMD_LIVE_FILE_PREVIEW"               : "Desarrollo en Vivo",
    "CMD_PROJECT_SETTINGS"                : "Configuración del proyecto\u2026",
    "CMD_FILE_RENAME"                     : "Renombrar",
    "CMD_QUIT"                            : "Salir",

    // Edit menu commands
    "EDIT_MENU"                           : "Edición",
    "CMD_SELECT_ALL"                      : "Seleccionar todo",
    "CMD_SELECT_LINE"                     : "Seleccionar línea",
    "CMD_FIND"                            : "Buscar",
    "CMD_FIND_IN_FILES"                   : "Buscar en archivos",
    "CMD_FIND_NEXT"                       : "Buscar siguiente",
    "CMD_FIND_PREVIOUS"                   : "Buscar anterior",
    "CMD_REPLACE"                         : "Reemplazar",
    "CMD_INDENT"                          : "Aumentar sangría",
    "CMD_UNINDENT"                        : "Disminuir sangría",
    "CMD_DUPLICATE"                       : "Duplicar",
    "CMD_DELETE_LINES"                    : "Eliminar línea",
    "CMD_COMMENT"                         : "Comentar/Descomentar línea",
    "CMD_BLOCK_COMMENT"                   : "Comentar/Descomentar bloque",
    "CMD_LINE_UP"                         : "Subir línea",
    "CMD_LINE_DOWN"                       : "Bajar línea",
     
    // View menu commands
    "VIEW_MENU"                           : "Visualización",
    "CMD_HIDE_SIDEBAR"                    : "Ocultar menú lateral",
    "CMD_SHOW_SIDEBAR"                    : "Mostrar menú lateral",
    "CMD_INCREASE_FONT_SIZE"              : "Aumentar tamaño de fuente",
    "CMD_DECREASE_FONT_SIZE"              : "Disminuir tamaño de fuente",
    "CMD_RESTORE_FONT_SIZE"               : "Restablecer tamaño de fuente",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Ordenar por Añadido",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Ordenar por Nombre",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Ordenar por Tipo",
    "CMD_SORT_WORKINGSET_AUTO"            : "Ordenación automática",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegación",
    "CMD_QUICK_OPEN"                      : "Apertura rápida",
    "CMD_GOTO_LINE"                       : "Ir a línea",
    "CMD_GOTO_DEFINITION"                 : "Ir a definición",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edición rápida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Coincidencia anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Coincidencia siguiente",
    "CMD_NEXT_DOC"                        : "Documento siguiente",
    "CMD_PREV_DOC"                        : "Documento anterior",
    "CMD_SHOW_IN_TREE"                    : "Mostrar en el árbol de directorios",
    
    // Debug menu commands
    "DEBUG_MENU"                          : "Desarrollo",
    "CMD_REFRESH_WINDOW"                  : "Reiniciar {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "Mostrar herramientas para desarrolladores",
    "CMD_RUN_UNIT_TESTS"                  : "Ejecutar tests",
    "CMD_JSLINT"                          : "Habilitar JSLint",
    "CMD_SHOW_PERF_DATA"                  : "Mostrar información de rendimiento",
    "CMD_NEW_BRACKETS_WINDOW"             : "Nueva ventana de {APP_NAME}",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Abrir carpeta de extensiones",
    "CMD_SWITCH_LANGUAGE"                 : "Cambiar idioma",
    "CMD_CHECK_FOR_UPDATE"                : "Buscar actualizaciones",

    // Help menu commands
    "HELP_MENU"                           : "Ayuda",
    "CMD_ABOUT"                           : "Acerca de {APP_TITLE}",
    "CMD_FORUM"                           : "Foro de {APP_NAME}",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Cerrar ventana",
    "CMD_ABORT_QUIT"                      : "Cancelar salida",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Versión Experimental",
    "JSLINT_ERRORS"                        : "Errores de JSLint",
    "JSLINT_ERROR_INFORMATION"             : "1 Error de JSLint",
    "JSLINT_ERRORS_INFORMATION"            : "{0} Errores de JSLint",
    "JSLINT_NO_ERRORS"                     : "No hay errores de JSLint. ¡Buen trabajo!",
    "JSLINT_DISABLED"                      : "JSLint está deshabilitado o no soporta el archivo actual",
    "SEARCH_RESULTS"                       : "Resultados de búsqueda",
    "OK"                                   : "Aceptar",
    "DONT_SAVE"                            : "No guardar",
    "SAVE"                                 : "Guardar",
    "CANCEL"                               : "Cancelar",
    "RELOAD_FROM_DISK"                     : "Volver a cargar desde disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Conservar los cambios del editor",
    "CLOSE_DONT_SAVE"                      : "Cerrar (No guardar)",
    "RELAUNCH_CHROME"                      : "Reiniciar Chrome",
    "ABOUT"                                : "Acerca de...",
    "APP_NAME"                             : "{APP_NAME}",
    "CLOSE"                                : "Cerrar",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} versión experimental {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Los avisos, términos y condiciones pertenecientes a software de terceros se encuentran en <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> y se incluyen aquí como referencia.",
    "ABOUT_TEXT_LINE4"                     : "Puedes encontrar la documentación y código fuente en <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "¡Hay una nueva versión de {APP_NAME} disponible! Haz click aquí para más detalles.",
    "UPDATE_AVAILABLE_TITLE"               : "Actualización disponible",
    "UPDATE_MESSAGE"                       : "¡Hay una nueva versión de {APP_NAME} disponible! Éstas son algunas de las nuevas características:",
    "GET_IT_NOW"                           : "¡Consíguelo ahora!",
    "PROJECT_SETTINGS_TITLE"               : "Configuración del proyecto para: {0}",
    "PROJECT_SETTING_BASE_URL"             : "URL base para Desarrollo en Vivo",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(deja en blanco para urls de tipo \"file\")",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Desarrollo en Vivo no soporta el protocolo {0}. Por favor, utiliza http: o https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "La URL base no puede contener parámetros de búsqueda como \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "La URL base no puede contener hashes como \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Los caracteres especiales como '{0}' deben codificarse en formato %.",
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Error desconocido analizando la URL base"
});
