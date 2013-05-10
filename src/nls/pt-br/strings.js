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
    "NOT_FOUND_ERR"                     : "O arquivo não pôde ser encontrado.",
    "NOT_READABLE_ERR"                  : "O arquivo não pôde ser lido.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "O diretório de destino não pode ser modificado.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "As permissões não permitem que você faça modificações.",
    "FILE_EXISTS_ERR"                   : "O arquivo já existe.",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Erro ao carregar o projeto",
    "OPEN_DIALOG_ERROR"                 : "Ocorreu um erro ao mostrar o diálogo de abertura de arquivo. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ocorreu um erro ao tentar carregar a pasta <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Ocorreu um erro ao ler o conteúdo da pasta <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Erro ao abrir arquivo",
    "ERROR_OPENING_FILE"                : "Ocorreu um erro ao tentar abrir o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RELOADING_FILE_TITLE"        : "Erro recarregando as mudanças a partir do disco",
    "ERROR_RELOADING_FILE"              : "Ocorreu um erro ao tentar recarregar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Erro ao salvar arquivo",
    "ERROR_SAVING_FILE"                 : "Ocorreu um erro ao tentar salvar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Erro ao renomear arquivo",
    "ERROR_RENAMING_FILE"               : "Ocorreu um erro ao tentar renomear o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nome de arquivo inválido",
    "INVALID_FILENAME_MESSAGE"          : "Nomes de arquivos não podem conter os seguintes caracteres: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "O arquivo <span class='dialog-filename'>{0}</span> já existe.",
    "ERROR_CREATING_FILE_TITLE"         : "Erro ao criar arquivo",
    "ERROR_CREATING_FILE"               : "Ocorreu um erro ao tentar criar o arquivo <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Opa! {APP_NAME} não funciona em navegadores ainda.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} é criado em HTML, mas agora mesmo ele é executado como um aplicativo de desktop para que você possa usá-lo para editar arquivos locais. Por favor, use o shell da aplicação no <b>github.com/adobe/brackets-shell</b> repo para executar {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Erro indexando Arquivos",
    "ERROR_MAX_FILES"                   : "O número máximo de arquivos foi indexado. Ações que procuram no índice de arquivos podem funcionar incorretamente.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Erro abrindo o navegador",
    "ERROR_CANT_FIND_CHROME"            : "O navegador Google Chrome não pôde ser encontrado. Por favor, verifique se ele está instalado.",
    "ERROR_LAUNCHING_BROWSER"           : "Ocorreu um erro ao iniciar o navegador. (error {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Erro de Live Preview",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Conectando ao navegador",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Para que a Live Preview conecte, Chrome deve ser aberto com a opção de depuração remota ativada.<br /><br />Gostaria de reabrir Chrome e permitir a depuração remota?",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Abra um arquivo HTML a fim de lançar Live Preview.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Bem-vindo à Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview se conecta {APP_NAME} ao seu navegador. Ele lança uma prévia do seu arquivo HTML no navegador, em seguida atualiza a visualização de imediato, quando você editar o código.<br /><br />Nesta versão inicial de {APP_NAME}, Live Preview só funciona para as edições de <strong>arquivos CSS</strong> e apenas com <strong>Google Chrome</strong>. Nós iremos implementá-lo para HTML e JavaScript em breve!<br /><br />(Você só vai ver esta mensagem uma vez.)",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Connectando\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Inicializando\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Desconectando do Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview: Clique para desconectar (Salve o arquivo para atualizar)",

    "SAVE_CLOSE_TITLE"                  : "Salvar alterações",
    "SAVE_CLOSE_MESSAGE"                : "Você quer salvar as alterações feitas no documento <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Você quer salvar as alterações para os seguintes arquivos?",
    "EXT_MODIFIED_TITLE"                : "Mudanças externas",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> foi modificado no disco, mas também tem alterações não salvadas em {APP_NAME}.<br /><br />Qual versão você quer manter?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> foi deletado no disco, mas tem alterações não salvadas em {APP_NAME}.<br /><br />Você quer manter as suas alterações?",

    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Use /re/ sintaxe para usar regexp na pesquisa",
    "WITH"                              : "Com",
    "BUTTON_YES"                        : "Sim",
    "BUTTON_NO"                         : "Não",
    "BUTTON_STOP"                       : "Pare",

    "OPEN_FILE"                         : "Abrir Arquivo",
    "CHOOSE_FOLDER"                     : "Escolha uma pasta",

    "RELEASE_NOTES"                     : "Notas de Lançamento",
    "NO_UPDATE_TITLE"                   : "Você está atualizado!",
    "NO_UPDATE_MESSAGE"                 : "Você está executando a versão mais recente de {APP_NAME}.",

    "FIND_IN_FILES_TITLE"               : "- {0} {1} em {2} {3}",
    "FIND_IN_FILES_FILE"                : "arquivo",
    "FIND_IN_FILES_FILES"               : "arquivos",
    "FIND_IN_FILES_MATCH"               : "resultado",
    "FIND_IN_FILES_MATCHES"             : "resultados",
    "FIND_IN_FILES_MAX"                 : " (Mostrando os primeiros {0} resultados)",
    "FIND_IN_FILES_FILE_PATH"           : "Arquivo: <b>{0}</b>",
    "FIND_IN_FILES_LINE"                : "linha:&nbsp;{0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Erro recebendo informações atualizadas",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Houve um problema obtendo a informação de atualização mais recente a partir do servidor. Por favor, verifique se você está conectado à Internet e tente novamente.",

    // Switch language
    "LANGUAGE_TITLE"                    : "Comutar Idioma",
    "LANGUAGE_MESSAGE"                  : "Por favor, selecione o idioma desejado na lista abaixo:",
    "LANGUAGE_SUBMIT"                   : "Recarregar {APP_NAME}",
    "LANGUAGE_CANCEL"                   : "Cancelar",

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
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Clique para alterar a indentação para espaços",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Clique para alterar a indentação para tabulação",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Clique para alterar o número de espaços usados ao indentar",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Clique para alterar a largura do caractere de tabulação",
    "STATUSBAR_SPACES"                      : "Espaços",
    "STATUSBAR_TAB_SIZE"                    : "Tamanho da Tabulação",
    "STATUSBAR_LINE_COUNT"                  : "{0} Linhas",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Arquivo",
    "CMD_FILE_NEW"                        : "Novo",
    "CMD_FILE_NEW_FOLDER"                 : "Nova Pasta",
    "CMD_FILE_OPEN"                       : "Abrir\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Adicionar Para Conjunto de Trabalho",
    "CMD_OPEN_FOLDER"                     : "Abrir pasta\u2026",
    "CMD_FILE_CLOSE"                      : "Fechar",
    "CMD_FILE_CLOSE_ALL"                  : "Fechar Tudo",
    "CMD_FILE_SAVE"                       : "Salvar",
    "CMD_FILE_SAVE_ALL"                   : "Salvar Tudo",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_FILE_RENAME"                     : "Renomear",
    "CMD_QUIT"                            : "Sair",

    // Edit menu commands
    "EDIT_MENU"                           : "Editar",
    "CMD_SELECT_ALL"                      : "Selecionar Tudo",
    "CMD_FIND"                            : "Encontrar",
    "CMD_FIND_IN_FILES"                   : "Encontrar em Arquivos",
    "CMD_FIND_NEXT"                       : "Encontrar Próximo",
    "CMD_FIND_PREVIOUS"                   : "Encontrar Anterior",
    "CMD_REPLACE"                         : "Substituir",
    "CMD_INDENT"                          : "Recuar",
    "CMD_UNINDENT"                        : "Desfazer Recuo",
    "CMD_DUPLICATE"                       : "Duplicar",
    "CMD_DELETE_LINES"                    : "Deletar Linha(s) Selecionadas",
    "CMD_COMMENT"                         : "Comentar/Descomentar Linhas",
    "CMD_LINE_UP"                         : "Mover Linha(s) para Cima",
    "CMD_LINE_DOWN"                       : "Mover Linha(s) para Baixo",

    // View menu commands
    "VIEW_MENU"                           : "Ver",
    "CMD_HIDE_SIDEBAR"                    : "Esconder Barra Lateral",
    "CMD_SHOW_SIDEBAR"                    : "Mostrar Barra Lateral",
    "CMD_INCREASE_FONT_SIZE"              : "Aumentar Tamanho da Fonte",
    "CMD_DECREASE_FONT_SIZE"              : "Diminuir Tamanho da Fonte",
    "CMD_RESTORE_FONT_SIZE"               : "Restaurar Tamanho da Fonte",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegar",
    "CMD_QUICK_OPEN"                      : "Abertura Rápida",
    "CMD_GOTO_LINE"                       : "Ir para a Linha",
    "CMD_GOTO_DEFINITION"                 : "Ir para Definição",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edição Rápida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Resultado Anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Resultado Seguinte",
    "CMD_NEXT_DOC"                        : "Documento Seguinte",
    "CMD_PREV_DOC"                        : "Documento Anterior",

    // Debug menu commands
    "DEBUG_MENU"                          : "Depurar",
    "CMD_REFRESH_WINDOW"                  : "Recarregar {APP_NAME}",
    "CMD_SHOW_DEV_TOOLS"                  : "Mostrar Ferramentas de Desenvolvimento",
    "CMD_RUN_UNIT_TESTS"                  : "Executar Testes",
    "CMD_JSLINT"                          : "Habilitar JSLint",
    "CMD_SHOW_PERF_DATA"                  : "Mostrar Dados de Desempenho",
    "CMD_NEW_BRACKETS_WINDOW"             : "Nova Janela {APP_NAME}",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Mostrar Pasta de Extensões",
    "CMD_USE_TAB_CHARS"                   : "Usar Caracteres de Tabulação",
    "CMD_SWITCH_LANGUAGE"                 : "Trocar Linguagem",
    "CMD_CHECK_FOR_UPDATE"                : "Verificar Atualizações",

    // Help menu commands
    "HELP_MENU"                           : "Ajuda",
    "CMD_ABOUT"                           : "Sobre",
    "CMD_FORUM"                           : "{APP_NAME} Forum",

    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Fechar Janela",
    "CMD_ABORT_QUIT"                      : "Abortar Saída",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Versão Experimental",
    "JSLINT_ERRORS"                        : "Erros JSLint",
    "JSLINT_ERROR_INFORMATION"             : "1 Erro JSLint",
    "JSLINT_ERRORS_INFORMATION"            : "{0} Erros JSLint",
    "JSLINT_NO_ERRORS"                     : "Sem erros JSLint - bom trabalho!",
    "JSLINT_DISABLED"                      : "JSLint desabilitado ou não funcionando para o arquivo atual",
    "SEARCH_RESULTS"                       : "Resultados da Pesquisa",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Não Salvar",
    "SAVE"                                 : "Salvar",
    "CANCEL"                               : "Cancelar",
    "RELOAD_FROM_DISK"                     : "Atualizar a Partir do Disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Manter Mudanças no Editor",
    "CLOSE_DONT_SAVE"                      : "Fechar (Não Salvar)",
    "RELAUNCH_CHROME"                      : "Relançar Chrome",
    "ABOUT"                                : "Sobre",
    "CLOSE"                                : "Fechar",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} versão experimental {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Avisos, termos e condições de softwares de terceiros estão localizados em <span class=\"non-clickble-link\">http://www.adobe.com/go/thirdparty/</span> e aqui incorporados por referência.",
    "ABOUT_TEXT_LINE4"                     : "Documentação e fontes <span class=\"non-clickble-link\">https://github.com/adobe/brackets/</span>",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Há uma nova versão de {APP_NAME} disponível! Clique aqui para mais detalhes.",
    "UPDATE_AVAILABLE_TITLE"               : "Atualização Disponível",
    "UPDATE_MESSAGE"                       : "Opa, há uma nova versão de {APP_NAME} disponível. Aqui estão alguns dos novos recursos:",
    "GET_IT_NOW"                           : "Obtenha agora!"
});
