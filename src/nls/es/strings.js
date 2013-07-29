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
    "ERROR_DELETING_FILE_TITLE"         : "Error eliminando archivo",
    "ERROR_DELETING_FILE"               : "Ha ocurrido un error al intentar eliminar el archivo <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nombre de archivo inválido",
    "INVALID_FILENAME_MESSAGE"          : "Los nombres de archivo no pueden contener los siguientes caracteres: /?*:;{}<>\\| o usar palabras reservadas del sistema",
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
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "No se pudo cargar la página para Desarrollo en Vivo",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Abre un archivo HTML para poder iniciar el modo de Desarrollo en Vivo.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Necesitas especificar una URL base en este proyecto para poder iniciar Desarrollo en Vivo con archivos de servidor.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Error iniciando el servidor HTTP para Desarrollo en Vivo. Vuelve a intentarlo, por favor.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "¡Bienvenido a Desarrollo en Vivo!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Desarrollo en Vivo conecta {APP_NAME} con tu navegador. Lanza una vista previa de tu archivo HTML en el navegador y la actualiza a medida que modificas tu código.<br /><br />En esta versión preliminar de {APP_NAME}, Desarollo en Vivo sólo funciona para cambios de <strong>archivos CSS</strong> y únicamente con <strong>Google Chrome</strong>. ¡Pronto estará disponible también para HTML y JavaScript!<br /><br />(No volverás a ver este mensaje.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Consulta <a class=\"clickable-link\" data-href=\"{0}\">Resolución de Problemas de conexión en Desarrollo en Vivo</a> para más información.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Desarrollo en Vivo",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Desarrollo en Vivo: Conectando\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Desarrollo en Vivo: Inicializando\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Terminar Desarrollo en Vivo",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Desarrollo en Vivo: Haz click para desconectar (Guarda el archivo para actualizar)",
    
    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Desarrollo en Vivo se ha detenido porque se han abierto las herramientas de desarrollo",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Desarrollo en Vivo se ha detenido porque se ha cerrado la página en el navegador",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Desarrollo en Vivo se ha detenido porque se ha accedido a una página que no es parte del proyecto actual",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Desarrollo en Vivo se ha detenido por motivos desconocidos ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Guardar cambios",
    "SAVE_CLOSE_MESSAGE"                : "¿Quieres guardar los cambios existentes en el documento <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "¿Quieres guardar tus cambios en los siguientes documentos?",
    "EXT_MODIFIED_TITLE"                : "Cambios externos",
    "FILE_DELETED_TITLE"                : "Archivo eliminado",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> ha sido modificado, pero también tiene cambios en {APP_NAME}.<br /><br />¿Qué versión quieres conservar?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> ha sido eliminado, pero tiene cambios sin guardar en {APP_NAME}.<br /><br />¿Quieres conservar tus cambios?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Utiliza /re/ para búsquedas con expresiones regulares",
    "FIND_RESULT_COUNT"                 : "{0} resultados",
    "WITH"                              : "Con",
    "BUTTON_YES"                        : "Sí",
    "BUTTON_NO"                         : "No",
    "BUTTON_STOP"                       : "Parar",

    "OPEN_FILE"                         : "Abrir archivo",
    "SAVE_FILE_AS"                      : "Guardar archivo",
    "CHOOSE_FOLDER"                     : "Elige una carpeta",

    "RELEASE_NOTES"                     : "Notas de versión",
    "NO_UPDATE_TITLE"                   : "¡Estás actualizado!",
    "NO_UPDATE_MESSAGE"                 : "Estás utilizando la última versión de {APP_NAME}.",
    
    "FIND_IN_FILES_TITLE"               : "- {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "en <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "en el proyecto",
    "FIND_IN_FILES_FILE"                : "archivo",
    "FIND_IN_FILES_FILES"               : "archivos",
    "FIND_IN_FILES_MATCH"               : "coincidencia",
    "FIND_IN_FILES_MATCHES"             : "coincidencias",
    "FIND_IN_FILES_MORE_THAN"           : "Más de ",
    "FIND_IN_FILES_MAX"                 : " (mostrando las primeras {0} coincidencias)",
    "FIND_IN_FILES_FILE_PATH"           : "Archivo: <b>{0}</b>",
    "FIND_IN_FILES_LINE"                : "línea: {0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Error obteniendo información sobre actualizaciones",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Ocurrió un problema al obtener la información sobre las últimas actualizaciones desde el servidor. Por favor, asegúrate de estar conectado a internet y vuelve a intentarlo.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Cargando\u2026",
    "UNTITLED"          : "Sin título",
    "WORKING_FILES"     : "Área de trabajo",
    
    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "May",
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
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} Línea",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} Líneas",
    
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
    "CMD_FILE_SAVE_AS"                    : "Guardar como\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Desarrollo en Vivo",
    "CMD_LIVE_HIGHLIGHT"                  : "Resaltado en Vivo",
    "CMD_PROJECT_SETTINGS"                : "Configuración del proyecto\u2026",
    "CMD_FILE_RENAME"                     : "Renombrar",
    "CMD_FILE_DELETE"                     : "Eliminar",
    "CMD_INSTALL_EXTENSION"               : "Instalar extensión\u2026",
    "CMD_EXTENSION_MANAGER"               : "Gestionar extensiones\u2026",
    "CMD_FILE_REFRESH"                    : "Actualizar",
    "CMD_QUIT"                            : "Salir",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Salir",
    
    // Edit menu commands
    "EDIT_MENU"                           : "Edición",
    "CMD_UNDO"                            : "Deshacer",
    "CMD_REDO"                            : "Rehacer",
    "CMD_CUT"                             : "Cortar",
    "CMD_COPY"                            : "Copiar",
    "CMD_PASTE"                           : "Pegar",
    "CMD_SELECT_ALL"                      : "Seleccionar todo",
    "CMD_SELECT_LINE"                     : "Seleccionar línea",
    "CMD_FIND"                            : "Buscar",
    "CMD_FIND_IN_FILES"                   : "Buscar en archivos",
    "CMD_FIND_IN_SUBTREE"                 : "Buscar en\u2026",
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
    "CMD_OPEN_LINE_ABOVE"                 : "Crear línea arriba",
    "CMD_OPEN_LINE_BELOW"                 : "Crear línea abajo",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Completar paréntesis automáticamente",
    "CMD_SHOW_CODE_HINTS"                 : "Mostrar sugerencias de código",
    
    // View menu commands
    "VIEW_MENU"                           : "Visualización",
    "CMD_HIDE_SIDEBAR"                    : "Ocultar menú lateral",
    "CMD_SHOW_SIDEBAR"                    : "Mostrar menú lateral",
    "CMD_INCREASE_FONT_SIZE"              : "Aumentar tamaño de fuente",
    "CMD_DECREASE_FONT_SIZE"              : "Disminuir tamaño de fuente",
    "CMD_RESTORE_FONT_SIZE"               : "Restablecer tamaño de fuente",
    "CMD_SCROLL_LINE_UP"                  : "Desplazar hacia arriba",
    "CMD_SCROLL_LINE_DOWN"                : "Desplazar hacia abajo",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Mostrar números de línea",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Resaltar línea actual",
    "CMD_TOGGLE_WORD_WRAP"                : "Habilitar ajuste de línea",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Ordenar por Añadido",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Ordenar por Nombre",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Ordenar por Tipo",
    "CMD_SORT_WORKINGSET_AUTO"            : "Ordenación automática",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegación",
    "CMD_QUICK_OPEN"                      : "Apertura rápida",
    "CMD_GOTO_LINE"                       : "Ir a la línea",
    "CMD_GOTO_DEFINITION"                 : "Búsqueda rápida de definición",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edición rápida",
    "CMD_TOGGLE_QUICK_DOCS"               : "Documentación rápida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Coincidencia anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Coincidencia siguiente",
    "CMD_NEXT_DOC"                        : "Documento siguiente",
    "CMD_PREV_DOC"                        : "Documento anterior",
    "CMD_SHOW_IN_TREE"                    : "Mostrar en el árbol de directorios",
    "CMD_SHOW_IN_OS"                      : "Mostrar en el Sistema Operativo",
    
    // Help menu commands
    "HELP_MENU"                           : "Ayuda",
    "CMD_CHECK_FOR_UPDATE"                : "Buscar actualizaciones",
    "CMD_HOW_TO_USE_BRACKETS"             : "Cómo utilizar {APP_NAME}",
    "CMD_FORUM"                           : "Foro de {APP_NAME}",
    "CMD_RELEASE_NOTES"                   : "Notas de la versión",
    "CMD_REPORT_AN_ISSUE"                 : "Informar de un error",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Abrir carpeta de extensiones",
    "CMD_TWITTER"                         : "{TWITTER_NAME} en Twitter",
    "CMD_ABOUT"                           : "Acerca de {APP_TITLE}",
    
    
    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Cerrar ventana",
    "CMD_ABORT_QUIT"                      : "Cancelar salida",
    "CMD_BEFORE_MENUPOPUP"                : "Antes del Menu Emergente",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "versión experimental",
    "DEVELOPMENT_BUILD"                    : "versión de desarrollo",
    "SEARCH_RESULTS"                       : "Resultados de búsqueda",
    "OK"                                   : "Aceptar",
    "DONT_SAVE"                            : "No guardar",
    "SAVE"                                 : "Guardar",
    "CANCEL"                               : "Cancelar",
    "RELOAD_FROM_DISK"                     : "Volver a cargar desde disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Conservar los cambios del editor",
    "CLOSE_DONT_SAVE"                      : "Cerrar (No guardar)",
    "RELAUNCH_CHROME"                      : "Reiniciar Chrome",
    "ABOUT"                                : "Acerca de\u2026",
    "CLOSE"                                : "Cerrar",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Los avisos, términos y condiciones pertenecientes a software de terceros se encuentran en <a class=\"clickable-link\" data-href=\"http://www.adobe.com/go/thirdparty/\">http://www.adobe.com/go/thirdparty/</a> y se incluyen aquí como referencia.",
    "ABOUT_TEXT_LINE4"                     : "Puedes encontrar la documentación y código fuente en <a class=\"clickable-link\" data-href=\"https://github.com/adobe/brackets/\">https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Hecho con \u2764 y JavaScript por:",
    "ABOUT_TEXT_LINE6"                     : "Mucha gente (pero ahora mismo estamos teniendo problemas para cargar esos datos).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "El contenido de Web Platform Docs y el logo de Web Platform están disponibles bajo una Licencia de Reconocimiento de Creative Commons, <a class=\"clickable-link\" data-href=\"http://creativecommons.org/licenses/by/3.0/\">CC-BY 3.0 Unported</a>.",
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
    "BASEURL_ERROR_UNKOWN_ERROR"           : "Error desconocido analizando la URL base",
    
    // Extension Management strings
    "INSTALL"                              : "Instalar",
    "REMOVE"                               : "Eliminar",
    "OVERWRITE"                            : "Sobreescribir",
    "CANT_REMOVE_DEV"                      : "Las extensiones en la carpeta \"dev\" se deben eliminar manualmente.",
    "INSTALL_EXTENSION_TITLE"              : "Instalar extensión",
    "INSTALL_EXTENSION_LABEL"              : "URL de la extensión",
    "INSTALL_EXTENSION_HINT"               : "URL del archivo zip de la extensión o del repositorio de Github",
    "INSTALLING_FROM"                      : "Instalando extensión desde {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "¡Instalación completada!",
    "INSTALL_FAILED"                       : "Error en la instalación.",
    "CANCELING_INSTALL"                    : "Cancelando\u2026",
    "CANCELING_HUNG"                       : "La instalación está tardando demasiado; cancelando. Puede que se haya producido un error interno.",
    "INSTALL_CANCELED"                     : "Instalación cancelada.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "El contenido descargado no es un archivo zip válido.",
    "INVALID_PACKAGE_JSON"                 : "El archivo package.json no es válido (error: {0}).",
    "MISSING_PACKAGE_NAME"                 : "El archivo package.json no especifica un nombre de paquete.",
    "BAD_PACKAGE_NAME"                     : "{0} no es un nombre de paquete válido.",
    "MISSING_PACKAGE_VERSION"              : "El archivo package.json no especifica la versión del paquete.",
    "INVALID_VERSION_NUMBER"               : "El número de paquete de la versión ({0}) no es válido.",
    "INVALID_BRACKETS_VERSION"             : "El código de compatibilidad de {APP_NAME} {{0}} no es válido.",
    "DISALLOWED_WORDS"                     : "Las palabras {{1}} no están permitidas en el campo {{0}}.",
    "API_NOT_COMPATIBLE"                   : "La extensión no es compatible con esta versión de {APP_NAME}. Está en la carpeta de extensiones deshabilitadas.",
    "MISSING_MAIN"                         : "El paquete no contiene el archivo main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Instalar este paquete sobreescribirá una extensión instalada previamente. ¿Deseas sobreescribir la antigua extensión?",
    "EXTENSION_SAME_VERSION"               : "La versión de este paquete es la misma que el que está instalado actualmente. ¿Deseas sobreescribir la instalación actual?",
    "EXTENSION_OLDER_VERSION"              : "La versión {0} de este paquete es más antigua que la instalada actualmente ({1}). ¿Deseas sobreescribir la instalación actual?",
    "DOWNLOAD_ID_IN_USE"                   : "Error interno: el ID de descarga ya está siendo utilizado.",
    "NO_SERVER_RESPONSE"                   : "No se puede conectar con el servidor.",
    "BAD_HTTP_STATUS"                      : "Archivo no encontrado en el servidor (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "No se pudo guardar la descarga en un archivo temporal.",
    "ERROR_LOADING"                        : "La extensión ha encontrado un error al arrancar.",
    "MALFORMED_URL"                        : "La URL no es válida. Por favor, comprueba que la has escrito correctamente.",
    "UNSUPPORTED_PROTOCOL"                 : "La URL debe ser una dirección http o https.",
    "UNKNOWN_ERROR"                        : "Error interno desconocido.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Gestor de extensiones",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "No se pudo acceder al registro de extensiones. Vuelve a intentarlo más tarde, por favor.",
    "INSTALL_FROM_URL"                     : "Instalar desde URL\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Fecha",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Esta extensión necesita una versión más actualizada de {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "En estos momentos esta extensión sólo funciona con versiones anteriores de {APP_NAME}.",
    "EXTENSION_NO_DESCRIPTION"             : "Sin descripción",
    "EXTENSION_MORE_INFO"                  : "Más información...",
    "EXTENSION_ERROR"                      : "Error en la extensión",
    "EXTENSION_KEYWORDS"                   : "Palabras clave",
    "EXTENSION_INSTALLED"                  : "Instalada",
    "EXTENSION_UPDATE_INSTALLED"           : "La actualización de esta extensión se ha descargado y se instalará cuando cierres {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Buscar",
    "EXTENSION_MORE_INFO_LINK"             : "Más",
    "BROWSE_EXTENSIONS"                    : "Explorar extensiones",
    "EXTENSION_MANAGER_REMOVE"             : "Eliminar extensión",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "No se pudo eliminar una o más extensiones: {{0}}. {APP_NAME} se cerrará igualmente.",
    "EXTENSION_MANAGER_UPDATE"             : "Actualizar extensión",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "No se pudo actualizar una o más extensiones: {{0}}. {APP_NAME} se cerrará igualmente.",
    "MARKED_FOR_REMOVAL"                   : "Marcada para eliminar",
    "UNDO_REMOVE"                          : "Deshacer",
    "MARKED_FOR_UPDATE"                    : "Marcada para actualizar",
    "UNDO_UPDATE"                          : "Deshacer",
    "CHANGE_AND_QUIT_TITLE"                : "Cambiar extensiones",
    "CHANGE_AND_QUIT_MESSAGE"              : "Para actualizar o eliminar las extensiones marcadas, necesitas cerrar y reiniciar {APP_NAME}. Se solicitará confirmación para guardar los cambios pendientes.",
    "REMOVE_AND_QUIT"                      : "Eliminar extensiones y salir",
    "CHANGE_AND_QUIT"                      : "Cambiar extensiones y salir",
    "UPDATE_AND_QUIT"                      : "Actualizar extensiones y salir",
    "EXTENSION_NOT_INSTALLED"              : "No se pudo eliminar la extensión {{0}} porque no se encuentra instalada.",
    "NO_EXTENSIONS"                        : "Todavía no hay ninguna extensión instalada.<br />Haz click en el botón Instalar desde URL para empezar.",
    "NO_EXTENSION_MATCHES"                 : "No hay extensiones que coincidan con tu búsqueda.",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "píxeles",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Desarrollo",
    "CMD_SHOW_DEV_TOOLS"                        : "Mostrar herramientas para desarrolladores",
    "CMD_REFRESH_WINDOW"                        : "Reiniciar {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nueva ventana de {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Cambiar idioma",
    "CMD_RUN_UNIT_TESTS"                        : "Ejecutar tests",
    "CMD_SHOW_PERF_DATA"                        : "Mostrar información de rendimiento",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Habilitar depuración de Node",
    "CMD_LOG_NODE_STATE"                        : "Mostrar estado de Node en Consola",
    "CMD_RESTART_NODE"                          : "Reiniciar Node",
    
    "LANGUAGE_TITLE"                            : "Cambiar idioma",
    "LANGUAGE_MESSAGE"                          : "Idioma:",
    "LANGUAGE_SUBMIT"                           : "Reiniciar {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Cancelar",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Idioma predeterminado",
    
    /**
     * Locales
     */
    "LOCALE_CS"                                 : "Checo",
    "LOCALE_DE"                                 : "Alemán",
    "LOCALE_EN"                                 : "Inglés",
    "LOCALE_ES"                                 : "Español",
    "LOCALE_FR"                                 : "Francés",
    "LOCALE_IT"                                 : "Italiano",
    "LOCALE_JA"                                 : "Japonés",
    "LOCALE_NB"                                 : "Noruego",
    "LOCALE_PL"                                 : "Polaco",
    "LOCALE_PT_BR"                              : "Portugués, Brasil",
    "LOCALE_PT_PT"                              : "Portugués",
    "LOCALE_RU"                                 : "Ruso",
    "LOCALE_SV"                                 : "Sueco",
    "LOCALE_TR"                                 : "Turco",
    "LOCALE_ZH_CN"                              : "Chino, simplificado",
    "LOCALE_HU"                                 : "Húngaro",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Color actual",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Color original",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Formato RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Formato Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Formato HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Utilizado {1} vez)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Utilizado {1} veces)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Saltar a la definición",
    
    // extensions/default/JSLint
    "CMD_JSLINT"                                : "Habilitar JSLint",
    "CMD_JSLINT_FIRST_ERROR"                    : "Ir al primer error de JSLint",
    "JSLINT_ERRORS"                             : "Errores de JSLint",
    "JSLINT_ERROR_INFORMATION"                  : "1 Error de JSLint",
    "JSLINT_ERRORS_INFORMATION"                 : "{0} Errores de JSLint",
    "JSLINT_NO_ERRORS"                          : "No hay errores de JSLint. ¡Buen trabajo!",
    "JSLINT_DISABLED"                           : "JSLint está deshabilitado o no soporta el archivo actual",
    
    // extensions/default/QuickView 
    "CMD_ENABLE_QUICK_VIEW"                     : "Vista rápida con cursor",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Más"
});
