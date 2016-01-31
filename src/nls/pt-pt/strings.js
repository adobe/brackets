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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define({
    /**
     * Errors
     */

    // General file io error strings
    "GENERIC_ERROR"                     : "(erro {0})",
    "NOT_FOUND_ERR"                     : "O ficheiro não foi encontrado.",
    "NOT_READABLE_ERR"                  : "O ficheiro não pode ser lido.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "A pasta de destino não pode ser modificado.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "As permissões não permitem modificações.",
    "FILE_EXISTS_ERR"                   : "O ficheiro já existe.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Erro ao carregar o projeto",
    "OPEN_DIALOG_ERROR"                 : "Ocorreu um erro na abertura do ficheiro. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ocorreu um erro ao tentar carregar a pasta <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Ocorreu um erro ao ler o conteúdo da pasta <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Erro ao abrir ficheiro",
    "ERROR_OPENING_FILE"                : "Ocorreu um erro ao tentar abrir o ficheiro <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Ocorreu um erro ao recarregar as mudanças a partir do disco",
    "ERROR_RELOADING_FILE"              : "Ocorreu um erro ao tentar recarregar o ficheiro <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Erro ao guardar ficheiro",
    "ERROR_SAVING_FILE"                 : "Ocorreu um erro ao tentar guardar o ficheiro <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Erro ao renomear ficheiro",
    "ERROR_RENAMING_FILE"               : "Ocorreu um erro ao tentar renomear o ficheiro <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nome do ficheiro inválido",
    "INVALID_FILENAME_MESSAGE"          : "O nome do ficheiro não pode conter os seguintes caracteres: {0}",
    "ERROR_CREATING_FILE_TITLE"         : "Erro ao criar ficheiro.",
    "ERROR_CREATING_FILE"               : "Ocorreu um erro ao tentar criar o ficheiro <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Oops! {APP_NAME} não funciona em navegadores ainda.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} é feito em HTML, e é executado como uma aplicação de desktop para que possa usá-lo para editar ficheiros locais. Por favor, use o shell da aplicação no <b>github.com/adobe/brackets-shell</b> repo para executar {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Erro a indexar Ficheiros",
    "ERROR_MAX_FILES"                   : "O número máximo de ficheiros foi indexado. Acções que procurem ficheiros no index podem não funcionar corretamente.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Erro ao abrir o navegador",
    "ERROR_CANT_FIND_CHROME"            : "O navegador Google Chrome não foi encontrado. Por favor, verifique se está instalado.",
    "ERROR_LAUNCHING_BROWSER"           : "Ocorreu um erro ao iniciar o navegador. (error {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Erro no Live Preview",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "A conectar ao navegador",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Para que a Live Preview funcione, o Google Chrome deve ser aberto com a opção de depuração(debug) remota ativada.<br /><br />Gostaria de reabrir Goggle Chrome e permitir a depuração remota?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Abra um ficheiro HTML de modo a executar o Live Preview.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Bem-vindo ao Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview liga o {APP_NAME} ao seu navegador. Ele faz uma pré-vizualização do seu ficheiro HTML no navegador, e cada vez que editar o código a pré-vizualização é automáticamente actualizada.<br /><br />Nesta versão inicial do {APP_NAME}, o Live Preview só funciona com a edição de <strong>ficheiros CSS</strong> e apenas com <strong>Google Chrome</strong>. Iremos implementá-lo para HTML e JavaScript em breve!<br /><br />(Só vai ver esta mensagem uma vez.)",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: A ligar\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: A iniciar\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Live Preview: Desligar",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview: Clique para desligar (Guarde o ficheiro para atualizar)",

    "SAVE_CLOSE_TITLE"                  : "Guardar alterações",
    "SAVE_CLOSE_MESSAGE"                : "Você quer guardar as alterações feitas no ficheiro <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Você quer guardar as alterações para os seguintes ficheiros?",
    "EXT_MODIFIED_TITLE"                : "Mudanças externas",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> foi modificado no disco, mas também tem alterações não guardadas em {APP_NAME}.<br /><br />Que versão quer manter?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> foi apagado do disco, mas tem alterações não guardadas em {APP_NAME}.<br /><br />Quer manter as suas alterações?",

    // Find, Replace, Find in Files
    "BUTTON_YES"                        : "Sim",
    "BUTTON_NO"                         : "Não",

    "OPEN_FILE"                         : "Abrir ficheiro",
    "CHOOSE_FOLDER"                     : "Escolha uma pasta",

    "RELEASE_NOTES"                     : "Notas de lançamento",
    "NO_UPDATE_TITLE"                   : "Está atualizado!",
    "NO_UPDATE_MESSAGE"                 : "Está a executar a versão mais recente de {APP_NAME}.",

    "FIND_IN_FILES_SCOPED"              : "em <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "no projeto",
    "FIND_IN_FILES_FILE"                : "ficheiro",
    "FIND_IN_FILES_FILES"               : "ficheiros",
    "FIND_IN_FILES_MATCH"               : "resultado",
    "FIND_IN_FILES_MATCHES"             : "resultado",
    "FIND_IN_FILES_MORE_THAN"           : "Mais que ",
    "FIND_IN_FILES_FILE_PATH"           : "Ficheiro: <span class='dialog-filename'>{0}</span>",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Erro ao receber as atualizações",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Houve um problema a receber a atualização mais recente a partir do servidor. Por favor, verifique se você está conectado à Internet e tente novamente.",

    /**
     * ProjectManager
     */

    "UNTITLED" : "Sem título",

    /**
     * Keyboard modifier names
     */

    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Shift",
    "KEYBOARD_SPACE"  : "Space",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Linha {0}, Coluna {1}",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Mudar a indentação para espaços",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Mudar a indentação para tabulação",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Mudar o número de espaços usados ao indentar",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Mudar a largura do caractere de tabulação",
    "STATUSBAR_SPACES"                      : "Espaços",
    "STATUSBAR_TAB_SIZE"                    : "Tamanho da tabulação",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Ficheiro",
    "CMD_FILE_NEW"                        : "Novo",
    "CMD_FILE_NEW_FOLDER"                 : "Nova pasta",
    "CMD_FILE_OPEN"                       : "Abrir\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Adicionar ao conjunto de trabalho",
    "CMD_OPEN_FOLDER"                     : "Abrir pasta\u2026",
    "CMD_FILE_CLOSE"                      : "Fechar",
    "CMD_FILE_CLOSE_ALL"                  : "Fechar tudo",
    "CMD_FILE_SAVE"                       : "Guardar",
    "CMD_FILE_SAVE_ALL"                   : "Guardar tudo",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_PROJECT_SETTINGS"                : "Definições do projeto\u2026",
    "CMD_FILE_RENAME"                     : "Renomear",
    "CMD_QUIT"                            : "Sair",

    // Edit menu commands
    "EDIT_MENU"                           : "Editar",
    "CMD_SELECT_ALL"                      : "Selecionar tudo",
    "CMD_SELECT_LINE"                     : "Selecionar linha",
    "CMD_FIND"                            : "Encontrar",
    "CMD_FIND_IN_FILES"                   : "Encontrar nos ficheiros",
    "CMD_FIND_IN_SUBTREE"                 : "Encontrar em\u2026",
    "CMD_FIND_NEXT"                       : "Encontrar próximo",
    "CMD_FIND_PREVIOUS"                   : "Encontrar anterior",
    "CMD_REPLACE"                         : "Substituir",
    "CMD_INDENT"                          : "Indentar",
    "CMD_UNINDENT"                        : "Recuar indentação",
    "CMD_DUPLICATE"                       : "Duplicar",
    "CMD_DELETE_LINES"                    : "Apagar linha(s) selecionadas",
    "CMD_COMMENT"                         : "Alternar comentário linhas",
    "CMD_BLOCK_COMMENT"                   : "Alternar comentário bloco",
    "CMD_LINE_UP"                         : "Mover linha(s) para cima",
    "CMD_LINE_DOWN"                       : "Mover linha(s) para baixo",

    // View menu commands
    "VIEW_MENU"                           : "Ver",
    "CMD_HIDE_SIDEBAR"                    : "Esconder barra lateral",
    "CMD_SHOW_SIDEBAR"                    : "Mostrar barra lateral",
    "CMD_INCREASE_FONT_SIZE"              : "Aumentar tamanho da fonte",
    "CMD_DECREASE_FONT_SIZE"              : "Diminuir tamanho da fonte",
    "CMD_RESTORE_FONT_SIZE"               : "Restaurar tamanho da fonte",
    "CMD_WORKINGSET_SORT_BY_ADDED"        : "Ordenar por data adicionado",
    "CMD_WORKINGSET_SORT_BY_NAME"         : "Ordenar por nome",
    "CMD_WORKINGSET_SORT_BY_TYPE"         : "Ordenar por tipo",
    "CMD_WORKING_SORT_TOGGLE_AUTO"        : "Ordenação automática",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegar",
    "CMD_QUICK_OPEN"                      : "Abertura rápida",
    "CMD_GOTO_LINE"                       : "Ir para a linha",
    "CMD_GOTO_DEFINITION"                 : "Ir para definição",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edição rápida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Resultado anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Resultado seguinte",
    "CMD_NEXT_DOC"                        : "Ficheiro seguinte",
    "CMD_PREV_DOC"                        : "Ficheiro anterior",
    "CMD_SHOW_IN_TREE"                    : "Mostrar na lista de pastas",

    // Help menu commands
    "HELP_MENU"                           : "Ajuda",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Mostrar pasta de extensões",
    "CMD_CHECK_FOR_UPDATE"                : "Verificar atualizações",
    "CMD_ABOUT"                           : "Sobre",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Versão Experimental",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Não guardar",
    "SAVE"                                 : "Guardar",
    "CANCEL"                               : "Cancelar",
    "RELOAD_FROM_DISK"                     : "Atualizar a partir do disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Manter mudanças no editor",
    "CLOSE_DONT_SAVE"                      : "Fechar (Não guardar)",
    "RELAUNCH_CHROME"                      : "Re-abrir Chrome",
    "ABOUT"                                : "Sobre",
    "CLOSE"                                : "Fechar",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} versão experimental {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Avisos, termos e condições de softwares de terceiros estão localizados em <span class=\"non-clickble-link\">http://www.adobe.com/go/thirdparty/</span> e aqui incorporados por referência.",
    "ABOUT_TEXT_LINE4"                     : "Documentação e fontes <span class=\"non-clickble-link\">https://github.com/adobe/brackets/</span>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Nova versão de {APP_NAME} disponível! Clique aqui para mais detalhes.",
    "UPDATE_AVAILABLE_TITLE"               : "Atualização disponível",
    "UPDATE_MESSAGE"                       : "Hey, {APP_NAME} {VERSION} disponível. Aqui estão alguns dos novos recursos:",
    "GET_IT_NOW"                           : "Obter agora!",
    "PROJECT_SETTINGS_TITLE"               : "Definições do projeto para: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Live Preview URL base",
    "PROJECT_SETTING_BASE_URL_HINT"        : "(deixe em branco para url do ficheiro)",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "O {0} protocolo não é suportado pelo Live Preview&mdash;por favor usar http: or https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "O URL base não pode conter parametros de pesquisa como \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "O URL base não pode conter cardinal como \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Caracteres especiais como '{0}' têm que ser %-codificados.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Erro desconhecido na análise do URL base",


    // extensions/default/DebugCommands
    "DEBUG_MENU"                           : "Debug",
    "CMD_SHOW_DEV_TOOLS"                   : "Mostrar ferramentas de desenvolvimento",
    "CMD_REFRESH_WINDOW"                   : "Recarregar o {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"              : "Nova janela do {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                  : "Mudar linguagem",
    "CMD_RUN_UNIT_TESTS"                   : "Executar testes",
    "CMD_SHOW_PERF_DATA"                   : "Mostrar dados de desempenho",

    "LANGUAGE_TITLE"                       : "Mudar idioma",
    "LANGUAGE_MESSAGE"                     : "Por favor, selecione o idioma desejado na lista abaixo:",
    "LANGUAGE_SUBMIT"                      : "Recarregar {APP_NAME}",
    "LANGUAGE_CANCEL"                      : "Cancelar"
});
