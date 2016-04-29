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
    "GENERIC_ERROR"                     : "(erro {0})",
    "NOT_FOUND_ERR"                     : "Non se puido atopar o arquivo.",
    "NOT_READABLE_ERR"                  : "Non se puido ler o arquivo.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "O directorio de destino non se pode modificar.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Os permisos non permiten facer modificacións.",
    "CONTENTS_MODIFIED_ERR"             : "O arquivo foi modificado fóra de {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} actualmente só soporta arquivos codificados como UTF-8.",
    "FILE_EXISTS_ERR"                   : "O arquivo xa existe.",
    "FILE"                              : "arquivo",
    "FILE_TITLE"                        : "Arquivo",
    "DIRECTORY"                         : "directorio",
    "DIRECTORY_TITLE"                   : "Directorio",
    "DIRECTORY_NAMES_LEDE"              : "nomes de directorios",
    "FILENAMES_LEDE"                    : "nomes de arquivos",
    "FILENAME"                          : "Nome de arquivo",
    "DIRECTORY_NAME"                    : "Nome de directorio",


    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Erro abrindo o proxecto",
    "OPEN_DIALOG_ERROR"                 : "Houbo un erro ó amosar o aviso de apertura de arquivo. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Houbo un erro ó intentar abrir o directorio <span class='dialog-filename'>{0}</span>. (erro {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Houbo un erro ó ler os contidos do directorio <span class='dialog-filename'>{0}</span>. (erro {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Erro abrindo arquivo",
    "ERROR_OPENING_FILE"                : "Houbo un erro ó intentar abrir o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Houbo un erro ó intentar abrir os seguintes arquivos:",
    "ERROR_RELOADING_FILE_TITLE"        : "Erro recargando cambios dende disco",
    "ERROR_RELOADING_FILE"              : "Houbo un erro ó intentar recargar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Erro gardando arquivo",
    "ERROR_SAVING_FILE"                 : "Houbo un erro ó intentar gardar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Erro renomeando arquivo",
    "ERROR_RENAMING_FILE"               : "Houbo un erro ó intentar renomear o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Erro eliminando arquivo",
    "ERROR_DELETING_FILE"               : "Houbo un erro ó intentar eliminar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "{0} inválido",
    "INVALID_FILENAME_MESSAGE"          : "Os {0} non poden utilizar ningunha palabra reservada polo sistema, rematar con puntos (.) ou utilizar calquera dos seguintes caracteres: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "Xa existe un arquivo ou directorio co nome <span class='dialog-filename'>{0}</span>.",
    "ERROR_CREATING_FILE_TITLE"         : "Erro creando {0}",
    "ERROR_CREATING_FILE"               : "Houbo un erro ó intentar crear o {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP"              : "Non se pode abrir o cartafol ó mesmo tempo que hai abertos outros arquivos.",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Erro lendo os axustes",
    "ERROR_PREFS_CORRUPT"               : "O arquivo de axustes non ten o formato JSON válido. O arquivo abrirase para que poida correxir o formato. Despois deberá reiniciar {APP_NAME} para que os cambios surtan efecto.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Vaia... parece que {APP_NAME} aínda non funciona en navegadores.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} está desenvolvido en HTML, pero por agora funciona como unha aplicación de escritorio para que poidas editar arquivos en local. Por favor, utiliza a aplicación do repositorio <b>github.com/adobe/brackets-shell</b> para executar {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Erro indexando arquivos",
    "ERROR_MAX_FILES"                   : "Este proxecto contén máis de 30.000 arquivos. Funcións que operan sobre múltiples arquivos poden estar deshabilitadas ou funcionar igual que si o proxecto estivese baleiro. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>Ler máis acerca de cómo traballar con proxectos grandes</a>.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Erro iniciando navegador",
    "ERROR_CANT_FIND_CHROME"            : "No se puido atopar o navegador Google Chrome. Por favor, asegúrate de que está instalado correctamente.",
    "ERROR_LAUNCHING_BROWSER"           : "Houbo un erro ó iniciar o navegador. (erro {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Erro na Vista Previa en Vivo",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Conectando co navegador",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Para poder iniciar o modo de Vista Previa en Vivo, Chrome debe ser iniciado habilitando a depuración remota.<br /><br />¿Queres reiniciar Chrome e habilitar a depuración remota?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Non se puido cargar a páxina para Vista Previa en Vivo",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Abre un arquivo HTML ou asegúrate de que hai un index.html no teu proxecto para poder iniciar o modo de Vista Previa en Vivo.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Necesitas especificar unha URL base neste proxecto para poder iniciar Vista Previa en Vivo con arquivos de servidor.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Erro iniciando o servidor HTTP para Vista Previa en Vivo. Volve a intentalo, por favor.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "¡Benvido á Vista Previa en Vivo!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Vista Previa en Vivo conecta {APP_NAME} co teu navegador. Lanza unha vista previa do teu arquivo HTML no navegador e actualízaa a medida que modificas o teu código.<br /><br />Nesta versión preliminar de {APP_NAME}, Desenvolvemento en Vivo só funciona para cambios de <strong>arquivos CSS ou HTML</strong> e únicamente con <strong>Google Chrome</strong>. Os cambios nos arquivos Javascript son recargados automáticamente cando se gardan.<br /><br />(Non volverás a ver ésta mensaxe.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Para máis información, consulta <a href='{0}' title='{0}'>Resolución de Problemas de conexión en Vista Previa en Vivo</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Vista Previa en Vivo",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Vista Previa en Vivo: Conectando\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Vista Previa en Vivo: Inicializando\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Rematar Vista Previa en Vivo",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Vista Previa en Vivo (garda o arquivo para actualizar)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Vista Previa en Vivo (non se está actualizando debido a un erro de sintaxis)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Vista Previa en Vivo detiuse porque abríronse as ferramentas de desenvolvemento",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Vista Previa en Vivo detiuse porque cerrouse a páxina no navegador",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Vista Previa en Vivo detiuse porque accediuse a unha páxina que non é parte do proxecto actual",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Vista Previa en Vivo detiuse por motivos descoñecidos ({0})",

    "SAVE_CLOSE_TITLE"                  : "Gardar cambios",
    "SAVE_CLOSE_MESSAGE"                : "¿Queres gardar os cambios existentes no documento <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "¿Queres gardar os teus cambios nos seguintes documentos?",
    "EXT_MODIFIED_TITLE"                : "Cambios externos",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Confirmar eliminación",
    "CONFIRM_FOLDER_DELETE"             : "¿Está seguro de que desexa eliminar o directorio <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Arquivo eliminado",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> foi modificado no disco.<br /><br />¿Desexa gardar o arquivo e sobrescribir eses cambios?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> foi modificado, pero tamén ten cambios en {APP_NAME}.<br /><br />¿Qué versión queres conservar?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> foi eliminado, pero ten cambios sen gardar en {APP_NAME}.<br /><br />¿Qieres conservar os teus cambios?",

    // Generic dialog/button labels
    "DONE"                              : "Aceptar",
    "OK"                                : "Aceptar",
    "CANCEL"                            : "Cancelar",
    "DONT_SAVE"                         : "Non gardar",
    "SAVE"                              : "Gardar",
    "DELETE"                            : "Eliminar",
    "SAVE_AS"                           : "Gardar como\u2026",
    "SAVE_AND_OVERWRITE"                : "Sobrescribir",
    "BUTTON_YES"                        : "Sí",
    "BUTTON_NO"                         : "Non",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                  : "{0} de {1}",
    "FIND_NO_RESULTS"                   : "Non hai resultados",
    "FIND_QUERY_PLACEHOLDER"            : "Atopado\u2026",
    "REPLACE_PLACEHOLDER"               : "Reemplazar con\u2026",
    "BUTTON_REPLACE_ALL"                : "Todo\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Reemplazar\u2026",
    "BUTTON_REPLACE"                    : "Reemplazar",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Seguinte coincidencia",
    "BUTTON_PREV_HINT"                  : "Anterior coincidencia",
    "BUTTON_CASESENSITIVE_HINT"         : "Sensible a maiúsculas",
    "BUTTON_REGEXP_HINT"                : "Expresión regular",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Reemplazar sen volta atrás",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Debido a que máis de {0} arquivos precisan ser cambiados, {APP_NAME} modificará arquivos non abertos.<br />Non poderás desfacer estes cambios.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Reemplazar sen volta atrás",

    "OPEN_FILE"                         : "Abrir arquivo",
    "SAVE_FILE_AS"                      : "Gardar arquivo",
    "CHOOSE_FOLDER"                     : "Elixe unha carpeta",

    "RELEASE_NOTES"                     : "Notas sobre a versión",
    "NO_UPDATE_TITLE"                   : "¡Estás actualizado!",
    "NO_UPDATE_MESSAGE"                 : "Estás utilizando a última versión de {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Reemprazar",
    "FIND_REPLACE_TITLE_WITH"           : "con",
    "FIND_TITLE_LABEL"                  : "Atopado",
    "FIND_TITLE_SUMMARY"                : "&mdash; {0} {1} {2} en {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "en <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "no proxecto",
    "FIND_IN_FILES_ZERO_FILES"          : "O filtro exclúe tódolos arquivos {0}",
    "FIND_IN_FILES_FILE"                : "arquivo",
    "FIND_IN_FILES_FILES"               : "arquivos",
    "FIND_IN_FILES_MATCH"               : "coincidencia",
    "FIND_IN_FILES_MATCHES"             : "coincidencias",
    "FIND_IN_FILES_MORE_THAN"           : "Máis de ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",  // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd click para expandir/colapsar todo",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Reemprazar Erros",
    "REPLACE_IN_FILES_ERRORS"           : "Os seguintes arquivos non se modificaron porque se cambiaron despois da búsqueda ou non poden ser modificados.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Erro obtendo información sobre actualizacións",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Houbo un problema ó obter a información sobre as últimas actualizacións dende o servidor. Por favor, asegúrate de estar conectado a internet e volve a intentalo.",

    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Novo conxunto de filtros\u2026",
    "CLEAR_FILE_FILTER"                 : "Non excluir arquivos",
    "NO_FILE_FILTER"                    : "Non hai arquivos excluidos",
    "EXCLUDE_FILE_FILTER"               : "Excluir {0}",
    "EDIT_FILE_FILTER"                  : "Editar\u2026",
    "FILE_FILTER_DIALOG"                : "Editar conxunto de filtros",
    "FILE_FILTER_INSTRUCTIONS"          : "Excluir arquivos e carpetas que coincidan con algunha das seguintes cadeas / subcadeas ou <a href='{0}' title='{0}'>comodines</a>. Ingrese unha cadea por liña.",
    "FILTER_NAME_PLACEHOLDER"           : "Nomear este conxunto de filtros (opcional)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "e {0} máis",
    "FILTER_COUNTING_FILES"             : "Contando arquivos\u2026",
    "FILTER_FILE_COUNT"                 : "Permite {0} de {1} arquivos {2}",
    "FILTER_FILE_COUNT_ALL"             : "Permite tódolos {0} arquivos {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "A Edición Rápida non está dispoñible para a posición actual do cursor",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "Edición Rápida para CSS: ubique o cursor sobre o nome de unha clase",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "Edición Rápida para CSS: atributo de clase incompleto",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "Edición Rápida para CSS: atributo de identificación incompleto",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "Edición Rápida para CSS: ubique o cursor sobre unha etiqueta, clase ou id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "Edición Rápida para Funcións de Temporización de CSS: sintaxis inválida",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "Edición Rápida para JS: ubique o cursor sobre o nome de unha función",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "A Documentación Rápida non está dispoñible para a posición actual do cursor",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Cargando\u2026",
    "UNTITLED"          : "Sen título",
    "WORKING_FILES"     : "Área de traballo",

    /**
     * MainViewManager
     */
    "TOP"               : "Arriba",
    "BOTTOM"            : "Abaixo",
    "LEFT"              : "Esquerda",
    "RIGHT"             : "Dereita",

    "CMD_SPLITVIEW_NONE"        : "Non Dividir",
    "CMD_SPLITVIEW_VERTICAL"    : "División Vertical",
    "CMD_SPLITVIEW_HORIZONTAL"  : "División Horizontal",
    "SPLITVIEW_MENU_TOOLTIP"    : "Dividir o editor vertical ou horizontalmente",
    "GEAR_MENU_TOOLTIP"         : "Configurar espacio de traballo",

    "SPLITVIEW_INFO_TITLE"              : "Xa está aberto",
    "SPLITVIEW_MULTIPANE_WARNING"       : "O arquivo xa está aberto noutro panel. {APP_NAME} pronto soportará abrir o mesmo arquivo noutro panel. Ata entón, o arquivo amosarase no panel que xa está aberto en.<br /><br />(Só verás esta mensaxe unha vez.)",


    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "May",
    "KEYBOARD_SPACE"  : "Espacio",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Liña {0}, Columna {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} columna seleccionada",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} columnas seleccionadas",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} liña seleccionada",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} liñas seleccionadas",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} seleccións",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Fai click para usar espacios na sangría",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Fai click para usar tabulacións na sangría",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Fai click para cambiar o número de espacios usados na sangría",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Fai click para cambiar o ancho das tabulacións",
    "STATUSBAR_SPACES"                      : "Espacios:",
    "STATUSBAR_TAB_SIZE"                    : "Tamaño de tabulador:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} liña",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} liñas",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Extensións deshabilitadas",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "SOB",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Fai click para intercambiar entre o modo insertar (INS) e o modo sobrescribir (SOB)",
    "STATUSBAR_LANG_TOOLTIP"                : "Fai click para cambiar o tipo de arquivo",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Fai click para amosar/ocultar o panel de reportes.",
    "STATUSBAR_DEFAULT_LANG"                : "(por defecto)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Marcar como predeterminado para os arquivos .{0}",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "Problemas de {0}",
    "SINGLE_ERROR"                          : "1 problema de {0}",
    "MULTIPLE_ERRORS"                       : "{1} problemas de {0}",
    "NO_ERRORS"                             : "Non se atoparon problemas de {0} - ¡Bo traballo!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Non se atoparon problemas - ¡Bo traballo!",
    "LINT_DISABLED"                         : "A inspección de código está deshabilitada",
    "NO_LINT_AVAILABLE"                     : "Non hai inspección de código dispoñible para {0}",
    "NOTHING_TO_LINT"                       : "Non hai nada para inspeccionar",
    "LINTER_TIMED_OUT"                      : "{0} esgotou o tempo despois de esperar {1} ms",
    "LINTER_FAILED"                         : "{0} rematou con erro: {1}",


    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Arquivo",
    "CMD_FILE_NEW_UNTITLED"               : "Novo",
    "CMD_FILE_NEW"                        : "Novo arquivo",
    "CMD_FILE_NEW_FOLDER"                 : "Novo cartafol",
    "CMD_FILE_OPEN"                       : "Abrir\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Añadir ó espacio de traballo",
    "CMD_OPEN_DROPPED_FILES"              : "Abrir arquivos caídos",
    "CMD_OPEN_FOLDER"                     : "Abrir cartafol\u2026",
    "CMD_FILE_CLOSE"                      : "Pechar",
    "CMD_FILE_CLOSE_ALL"                  : "Pechar todo",
    "CMD_FILE_CLOSE_LIST"                 : "Pechar lista",
    "CMD_FILE_CLOSE_OTHERS"               : "Pechar outros",
    "CMD_FILE_CLOSE_ABOVE"                : "Pechar outros por encima",
    "CMD_FILE_CLOSE_BELOW"                : "Pechar outros por debaixo",
    "CMD_FILE_SAVE"                       : "Gardar",
    "CMD_FILE_SAVE_ALL"                   : "Gardar todo",
    "CMD_FILE_SAVE_AS"                    : "Gardar como\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Vista Previa en Vivo",
    "CMD_RELOAD_LIVE_PREVIEW"             : "Forzar Recargar a Vista Previa en Vivo",
    "CMD_PROJECT_SETTINGS"                : "Configuración do proxecto\u2026",
    "CMD_FILE_RENAME"                     : "Renomear",
    "CMD_FILE_DELETE"                     : "Eliminar",
    "CMD_INSTALL_EXTENSION"               : "Instalar extensión\u2026",
    "CMD_EXTENSION_MANAGER"               : "Xestionar extensións\u2026",
    "CMD_FILE_REFRESH"                    : "Actualizar árbol de arquivos",
    "CMD_QUIT"                            : "Saír",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Saír",

    // Edit menu commands
    "EDIT_MENU"                           : "Edición",
    "CMD_UNDO"                            : "Desfacer",
    "CMD_REDO"                            : "Refacer",
    "CMD_CUT"                             : "Cortar",
    "CMD_COPY"                            : "Copiar",
    "CMD_PASTE"                           : "Pegar",
    "CMD_SELECT_ALL"                      : "Seleccionar todo",
    "CMD_SELECT_LINE"                     : "Seleccionar liña",
    "CMD_SPLIT_SEL_INTO_LINES"            : "Dividir selección en liñas",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Engadir cursor á seguinte líña",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Engadir cursor á liña anterior",
    "CMD_INDENT"                          : "Aumentar sangría",
    "CMD_UNINDENT"                        : "Diminuír sangría",
    "CMD_DUPLICATE"                       : "Duplicar",
    "CMD_DELETE_LINES"                    : "Eliminar liña",
    "CMD_COMMENT"                         : "Comentar/Descomentar liña",
    "CMD_BLOCK_COMMENT"                   : "Comentar/Descomentar bloque",
    "CMD_LINE_UP"                         : "Subir liña",
    "CMD_LINE_DOWN"                       : "Baixar liña",
    "CMD_OPEN_LINE_ABOVE"                 : "Crear liña arriba",
    "CMD_OPEN_LINE_BELOW"                 : "Crear liña abaixo",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Completar paréntesis automáticamente",
    "CMD_SHOW_CODE_HINTS"                 : "Amosar suxerencias de código",

    // Search menu commands
    "FIND_MENU"                           : "Buscar",
    "CMD_FIND"                            : "Buscar",
    "CMD_FIND_NEXT"                       : "Buscar seguinte",
    "CMD_FIND_PREVIOUS"                   : "Buscar anterior",
    "CMD_FIND_ALL_AND_SELECT"             : "Buscar todo e seleccionar",
    "CMD_ADD_NEXT_MATCH"                  : "Agregar a seguinte coincidencia á selección",
    "CMD_SKIP_CURRENT_MATCH"              : "Omitir e agregar a seguinte coincidencia",
    "CMD_FIND_IN_FILES"                   : "Buscar en arquivos",
    "CMD_FIND_IN_SUBTREE"                 : "Buscar en\u2026",
    "CMD_REPLACE"                         : "Reemplazar",
    "CMD_REPLACE_IN_FILES"                : "Reemplazar en Arquivos",
    "CMD_REPLACE_IN_SUBTREE"              : "Reemplazar en\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Ver",
    "CMD_HIDE_SIDEBAR"                    : "Ocultar menú lateral",
    "CMD_SHOW_SIDEBAR"                    : "Amosar menú lateral",
    "CMD_INCREASE_FONT_SIZE"              : "Aumentar tamaño de fuente",
    "CMD_DECREASE_FONT_SIZE"              : "Diminuír tamaño de fuente",
    "CMD_RESTORE_FONT_SIZE"               : "Restablecer tamaño de fuente",
    "CMD_SCROLL_LINE_UP"                  : "Desplazar cara arriba",
    "CMD_SCROLL_LINE_DOWN"                : "Desplazar cara abaixo",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Amosar números de liña",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Resaltar liña actual",
    "CMD_TOGGLE_WORD_WRAP"                : "Habilitar axuste de liña",
    "CMD_LIVE_HIGHLIGHT"                  : "Resaltado en Vista Previa en Vivo",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Inspeccionar o código ó gardar",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Ordenar por Añadido",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Ordenar por Nome",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Ordenar por Tipo",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Ordenación automática",
    "CMD_THEMES"                          : "Temas\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegación",
    "CMD_QUICK_OPEN"                      : "Apertura rápida",
    "CMD_GOTO_LINE"                       : "Ir á liña",
    "CMD_GOTO_DEFINITION"                 : "Búsqueda rápida de definición",
    "CMD_GOTO_FIRST_PROBLEM"              : "Ir ó primeiro Erro/Advertencia",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edición rápida",
    "CMD_TOGGLE_QUICK_DOCS"               : "Documentación rápida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Coincidencia anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Coincidencia seguinte",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Nova norma",
    "CMD_NEXT_DOC"                        : "Documento seguinte",
    "CMD_PREV_DOC"                        : "Documento anterior",
    "CMD_SHOW_IN_TREE"                    : "Amosar na árbore de directorios",
    "CMD_SHOW_IN_EXPLORER"                : "Amosar no Explorador",
    "CMD_SHOW_IN_FINDER"                  : "Amosar en Finder",
    "CMD_SHOW_IN_OS"                      : "Amosar no Sistema Operativo",

    // Help menu commands
    "HELP_MENU"                           : "Axuda",
    "CMD_CHECK_FOR_UPDATE"                : "Buscar actualizacións",
    "CMD_HOW_TO_USE_BRACKETS"             : "Cómo utilizar {APP_NAME}",
    "CMD_SUPPORT"                         : "Soporte de {APP_NAME}",
    "CMD_SUGGEST"                         : "Suxerir unha mellora",
    "CMD_RELEASE_NOTES"                   : "Notas da versión",
    "CMD_GET_INVOLVED"                    : "Involúcrate",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Abrir cartafol de extensións",
    "CMD_HOMEPAGE"                        : "Páxina principal de {APP_TITLE}",
    "CMD_TWITTER"                         : "{TWITTER_NAME} en Twitter",
    "CMD_ABOUT"                           : "Acerca de {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Abrir arquivo de axustes",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "versión experimental",
    "DEVELOPMENT_BUILD"                    : "versión de desenvolvemento",
    "RELOAD_FROM_DISK"                     : "Volver a cargar dende disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Conservar os cambios do editor",
    "CLOSE_DONT_SAVE"                      : "Pechar (Non gardar)",
    "RELAUNCH_CHROME"                      : "Reiniciar Chrome",
    "ABOUT"                                : "Acerca de\u2026",
    "CLOSE"                                : "Pechar",
    "ABOUT_TEXT_LINE1"                     : "Versión {VERSION_MAJOR}.{VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "construír marca de tempo: ",
    "ABOUT_TEXT_LINE3"                     : "Os avisos, termos e condicións pertencentes a software de terceiros atópanse en <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> e inclúense aquí como referencia.",
    "ABOUT_TEXT_LINE4"                     : "Podes atopar a documentación e código fonte en <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Feito con \u2764 e JavaScript por:",
    "ABOUT_TEXT_LINE6"                     : "Moita xente (pero agora mesmo estamos tendo problemas para cargar eses datos).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "O contido de Web Platform Docs e o logo de Web Platform están dispoñibles baixo unha Licencia de Recoñecemento de Creative Commons, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "¡Hai unha nova versión de {APP_NAME} dispoñible! Fai click aquí para máis detalles.",
    "UPDATE_AVAILABLE_TITLE"               : "Actualización dispoñible",
    "UPDATE_MESSAGE"                       : "¡Hai unha nova versión de {APP_NAME} dispoñible! Éstas son algunas das novas características:",
    "GET_IT_NOW"                           : "¡Conségueo agora!",
    "PROJECT_SETTINGS_TITLE"               : "Configuración do proxecto para: {0}",
    "PROJECT_SETTING_BASE_URL"             : "URL base para Vista Previa en Vivo",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(deixa en branco para urls de tipo \"file\")",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Vista Previa en Vivo non soporta o protocolo {0}. Por favor, utiliza http: ou https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "A URL base non pode conter parámetros de búsqueda como \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "A URL base non pode conter hashes como \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Os caracteres especiais como '{0}' deben codificarse en formato %.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Erro descoñecido analizando a URL base",
    "EMPTY_VIEW_HEADER"                    : "<em>Selecciona un arquivo mentres esta vista está activa</em>",

    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Tema actual",
    "USE_THEME_SCROLLBARS"                 : "Usar scrollbars do tema",
    "FONT_SIZE"                            : "Tamaño de letra",
    "FONT_FAMILY"                          : "Tipo de letra",
    "THEMES_SETTINGS"                      : "Preferencias dos temas",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Nova regra",

    // Extension Management strings
    "INSTALL"                              : "Instalar",
    "UPDATE"                               : "Actualizar",
    "REMOVE"                               : "Eliminar",
    "OVERWRITE"                            : "Sobrescribir",
    "CANT_REMOVE_DEV"                      : "As extensións na carpeta \"dev\" débense eliminar manualmente.",
    "CANT_UPDATE"                          : "A actualización non é compatible con ésta versión de {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "As extensións na carpeta \"dev\" non se poden actualizar automáticamente.",
    "INSTALL_EXTENSION_TITLE"              : "Instalar extensión",
    "UPDATE_EXTENSION_TITLE"               : "Actualizar extensión",
    "INSTALL_EXTENSION_LABEL"              : "URL da extensión",
    "INSTALL_EXTENSION_HINT"               : "URL do arquivo zip da extensión ou do repositorio de Github",
    "INSTALLING_FROM"                      : "Instalando extensión dende {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "¡Instalación completada!",
    "INSTALL_FAILED"                       : "Erro na instalación.",
    "CANCELING_INSTALL"                    : "Cancelando\u2026",
    "CANCELING_HUNG"                       : "A instalación está tardando demasiado; cancelando. Pode que se producira un erro interno.",
    "INSTALL_CANCELED"                     : "Instalación cancelada.",
    "VIEW_COMPLETE_DESCRIPTION"            : "Ver descripción completa",
    "VIEW_TRUNCATED_DESCRIPTION"           : "Ver descripción corta",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "O contido descargado non é un arquivo zip válido.",
    "INVALID_PACKAGE_JSON"                 : "O arquivo package.json non é válido (error: {0}).",
    "MISSING_PACKAGE_NAME"                 : "O arquivo package.json non especifica un nome de paquete.",
    "BAD_PACKAGE_NAME"                     : "{0} non é un nome de paquete válido.",
    "MISSING_PACKAGE_VERSION"              : "O arquivo package.json non especifica a versión do paquete.",
    "INVALID_VERSION_NUMBER"               : "O número de paquete da versión ({0}) non é válido.",
    "INVALID_BRACKETS_VERSION"             : "O código de compatibilidade de {APP_NAME} {{0}} non é válido.",
    "DISALLOWED_WORDS"                     : "As palabras {{1}} non están permitidas no campo {{0}}.",
    "API_NOT_COMPATIBLE"                   : "A extensión non é compatible con esta versión de {APP_NAME}. Está no cartafol de extensións deshabilitadas.",
    "MISSING_MAIN"                         : "O paquete non contén o arquivo main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Instalar este paquete sobrescribirá unha extensión instalada previamente. ¿Deseas sobrescribir a antiga extensión?",
    "EXTENSION_SAME_VERSION"               : "A versión de este paquete é a misma que a instalada actualmente. ¿Desexas sobrescribir a instalación actual?",
    "EXTENSION_OLDER_VERSION"              : "A versión {0} de este paquete é máis antiga que a instalada actualmente ({1}). ¿Desexas sobrescribir a instalación actual?",
    "DOWNLOAD_ID_IN_USE"                   : "Erro interno: o ID de descarga xa está sendo utilizado.",
    "NO_SERVER_RESPONSE"                   : "Non se pode conectar co servidor.",
    "BAD_HTTP_STATUS"                      : "Arquivo non atopado no servidor (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Non se puido gardar a descarga en un arquivo temporal.",
    "ERROR_LOADING"                        : "A extensión atopou un erro ó arrancar.",
    "MALFORMED_URL"                        : "A URL non é válida. Por favor, comproba que as escribiches correctamente.",
    "UNSUPPORTED_PROTOCOL"                 : "A URL ten que ser unha dirección http ou https.",
    "UNKNOWN_ERROR"                        : "Erro interno descoñecido.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Xestor de extensións",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Non se puido acceder o rexistro de extensións. Volve a intentalo máis tarde, por favor.",
    "INSTALL_EXTENSION_DRAG"               : "Arrastra .zip aquí ou",
    "INSTALL_EXTENSION_DROP"               : "Solta .zip para instalar",
    "INSTALL_EXTENSION_DROP_ERROR"         : "A Instalación/Actualizacións foi abortada polos seguintes erros:",
    "INSTALL_FROM_URL"                     : "Instalar dende URL\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "Validando\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Data",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Esta extensión necesita unha versión máis actualizada de {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Nestes momentos esta extensión só funciona con versións anteriores de {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "A versión {0} de esta extensión precisa unha versión superior de {APP_NAME}. Podes instalar a versión anterior {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "A versión {0} de esta extensión só funciona con versións anteriores de {APP_NAME}. Podes instalar a versión anterior {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Sen descripción",
    "EXTENSION_MORE_INFO"                  : "Máis información...",
    "EXTENSION_ERROR"                      : "Erro na extensión",
    "EXTENSION_KEYWORDS"                   : "Palabras clave",
    "EXTENSION_TRANSLATED_USER_LANG"       : "Traducido a {0} linguas, incluída a túa",
    "EXTENSION_TRANSLATED_GENERAL"         : "Traducido a {0} linguas",
    "EXTENSION_TRANSLATED_LANGS"           : "Esta extensión foi traducida ás seguintes linguas: {0}",
    "EXTENSION_INSTALLED"                  : "Instalada",
    "EXTENSION_UPDATE_INSTALLED"           : "A actualización de esta extensión descargouse e instalarase despois de recargar {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Buscar",
    "EXTENSION_MORE_INFO_LINK"             : "Máis",
    "BROWSE_EXTENSIONS"                    : "Explorar extensións",
    "EXTENSION_MANAGER_REMOVE"             : "Eliminar extensión",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Non se puido eliminar unha ou máis extensións: {{0}}. {APP_NAME} recargarase igualmente.",
    "EXTENSION_MANAGER_UPDATE"             : "Actualizar extensión",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Non se puido actualizar unha ou máis extensións: {{0}}. {APP_NAME} recargarase igualmente.",
    "MARKED_FOR_REMOVAL"                   : "Marcada para eliminar",
    "UNDO_REMOVE"                          : "Desfacer",
    "MARKED_FOR_UPDATE"                    : "Marcada para actualizar",
    "UNDO_UPDATE"                          : "Desfacer",
    "CHANGE_AND_RELOAD_TITLE"              : "Cambiar extensións",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Para actualizar ou eliminar as extensións marcadas, precisas recargar {APP_NAME}. Solicitarase confirmación para gardar os cambios pendentes.",
    "REMOVE_AND_RELOAD"                    : "Eliminar extensións e recargar",
    "CHANGE_AND_RELOAD"                    : "Cambiar extensións e recargar",
    "UPDATE_AND_RELOAD"                    : "Actualizar extensións e recargar",
    "PROCESSING_EXTENSIONS"                : "Procesando os cambios nas extensións\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Non se puido eliminar a extensión {{0}} porque no se atopa instalada.",
    "NO_EXTENSIONS"                        : "Aínda non hai ningunha extensión instalada.<br />Fai click na pestana Dispoñibles para comenzar.",
    "NO_EXTENSION_MATCHES"                 : "Non hai extensións que coincidan coa túa busca.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "NOTA: Estas extensións poden provir de diferentes autores a {APP_NAME}. As extensións non son revisadas e teñen todos os privilexios locais. Ten coidado cando instales extensións de unha fonte descoñecida.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Instaladas",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Dispoñibles",
    "EXTENSIONS_THEMES_TITLE"              : "Temas",
    "EXTENSIONS_UPDATES_TITLE"             : "Actualizacións",

    "INLINE_EDITOR_NO_MATCHES"             : "Non hai coincidencias dispoñibles.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Non hai reglas CSS existentes que coincidan cua túa selección.<br> Fai click en \"Nova regra\" para crear unha.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Non hai follas de estilos no teu proxecto.<br>Crea unha para añadir regras CSS.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "máis grande",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "píxeles",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Desenvolvemento",
    "ERRORS"                                    : "Erros",
    "CMD_SHOW_DEV_TOOLS"                        : "Amosar ferramentas para desenvolvedores",
    "CMD_REFRESH_WINDOW"                        : "Recargar con extensións",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Recargar sin extensións",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nova ventá de {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Cambiar idioma",
    "CMD_RUN_UNIT_TESTS"                        : "Executar tests",
    "CMD_SHOW_PERF_DATA"                        : "Amosar información de rendemento",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Habilitar depuración de Node",
    "CMD_LOG_NODE_STATE"                        : "Amosar estado de Node en Consola",
    "CMD_RESTART_NODE"                          : "Reiniciar Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Amosar erros na barra de estado",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Abrir código de Brackets",

    "LANGUAGE_TITLE"                            : "Cambiar idioma",
    "LANGUAGE_MESSAGE"                          : "Idioma:",
    "LANGUAGE_SUBMIT"                           : "Reiniciar {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Cancelar",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Idioma predeterminado",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Tempo",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progresión",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Moven o punto seleccionado<br><kbd class='text'>Shift</kbd> Move de a dez unidades<br><kbd class='text'>Tab</kbd> Cambia o punto seleccionado",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Incrementa ou decrementa os pasos<br><kbd>←</kbd><kbd>→</kbd> 'Start' ou 'End'",
    "INLINE_TIMING_EDITOR_INVALID"              : "O valor vello <code>{0}</code> non é válido, polo tanto, foi modificado a <code>{1}</code>. O documento será actualizado despois da primeira edición.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Color actual",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Color orixinal",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Formato RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Formato Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Formato HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Utilizado {1} vez)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Utilizado {1} veces)",

    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Saltar á definición",
    "CMD_SHOW_PARAMETER_HINT"                   : "Amosar suxerencias de parámetros",
    "NO_ARGUMENTS"                              : "<non hay parámetros>",
    "DETECTED_EXCLUSION_TITLE"                  : "Problema de inferencia con un arquivo JavaScript",
    "DETECTED_EXCLUSION_INFO"                   : "Brackets atopouse con problemas procesando:<br><br>{0}<br><br>Este arquivo non volverá a ser procesado para as suxerencias de código e saltar á definición. Para reactivarlo, abre <code>.brackets.json</code> no seu proxecto e elimina o arquivo de jscodehints.detectedExclusions.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Vista rápida co cursor",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Proxectos recentes",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Máis"
});

/* Last translated for a4e9a06605cfca5dff5ab5dbacfb1d97c604b6f0 */
