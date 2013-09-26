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
    "GENERIC_ERROR"                     : "(erro {0})",
    "NOT_FOUND_ERR"                     : "O arquivo não pôde ser encontrado.",
    "NOT_READABLE_ERR"                  : "O arquivo não pôde ser lido.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "O diretório de destino não pode ser modificado.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "As permissões não permitem que você faça modificações.",
    "FILE_EXISTS_ERR"                   : "O arquivo já existe.",
    "FILE"                              : "arquivo",
    "DIRECTORY"                         : "diretório",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Erro ao carregar o projeto",
    "OPEN_DIALOG_ERROR"                 : "Ocorreu um erro ao mostrar o diálogo de abertura de arquivo. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ocorreu um erro ao tentar carregar a pasta <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Ocorreu um erro ao ler o conteúdo da pasta <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Erro ao abrir arquivo",
    "ERROR_OPENING_FILE"                : "Ocorreu um erro ao tentar abrir o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Ocorreu um erro ao tentar abrir os seguintes arquivos:",
    "ERROR_RELOADING_FILE_TITLE"        : "Erro recarregando as mudanças a partir do disco",
    "ERROR_RELOADING_FILE"              : "Ocorreu um erro ao tentar recarregar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Erro ao salvar arquivo",
    "ERROR_SAVING_FILE"                 : "Ocorreu um erro ao tentar salvar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Erro ao renomear arquivo",
    "ERROR_RENAMING_FILE"               : "Ocorreu um erro ao tentar renomear o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Erro ao excluir o arquivo",
    "ERROR_DELETING_FILE"               : "Ocorreu um erro ao tentar excluir o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nome de arquivo inválido",
    "INVALID_FILENAME_MESSAGE"          : "Nomes de arquivos não podem conter os seguintes caracteres: /?*:;{}<>\\|",
    "FILE_ALREADY_EXISTS"               : "O arquivo <span class='dialog-filename'>{0}</span> já existe.",
    "ERROR_CREATING_FILE_TITLE"         : "Erro ao criar arquivo",
    "ERROR_CREATING_FILE"               : "Ocorreu um erro ao tentar criar o arquivo <span class='dialog-filename'>{0}</span>. {1}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Opa! {APP_NAME} não funciona em navegadores ainda.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} é criado em HTML, mas no momento ele é executado como um aplicativo de desktop para que você possa usá-lo para editar arquivos locais. Por favor, use o shell da aplicação no <b>github.com/adobe/brackets-shell</b> repo para executar {APP_NAME}.",

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
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Não foi possível carregar a página do Live Development",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Abra um arquivo HTML a fim de lançar Live o Preview.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Para lançar o Live Preview com um arquivo server-side, você precisa especificar uma URL de base para este projeto.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Erro ao iniciar o servidor HTTP para os arquivos do Live Development. Por favor, tente novamente",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Bem-vindo à Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Live Preview se conecta {APP_NAME} ao seu navegador. Ele lança uma prévia do seu arquivo HTML no navegador, em seguida atualiza a visualização de imediato, quando você editar o código.<br /><br />Nesta versão inicial de {APP_NAME}, Live Preview só funciona para as edições de <strong>arquivos CSS</strong> e apenas com <strong>Google Chrome</strong>. Nós iremos implementá-lo para HTML e JavaScript em breve!<br /><br />(Você só vai ver esta mensagem uma vez.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Para mais informações, acesse <a href='{0}' title='{0}'>Solucionando erros de conexão do Live Development</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Connectando\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Inicializando\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Desconectando do Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview: Clique para desconectar (Salve o arquivo para atualizar)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Preview (ataulização desativada devido a erros de sintaxe)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "O Live Preview foi interrompido porque a janela de Ferramentas do Desenvolvedor foi aberta no navegador",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "O Live Preview foi interrompido porque a janela do navegador foi fechada",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "O Live Preview foi interrompido porque o navegador foi redirecionado para uma página que não pertence ao projeto",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Live Preview was cancelled for an unknown reason ({0})",
	
    "SAVE_CLOSE_TITLE"                  : "Salvar alterações",
    "SAVE_CLOSE_MESSAGE"                : "Você quer salvar as alterações feitas no documento <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Você quer salvar as alterações para os seguintes arquivos?",
    "EXT_MODIFIED_TITLE"                : "Mudanças externas",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Confirmar exclusão",
    "CONFIRM_FOLDER_DELETE"             : "Você tem certeza que deseja excluir a pasta <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Arquivo excluído",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> foi modificado no disco, mas também tem alterações não salvadas em {APP_NAME}.<br /><br />Qual versão você quer manter?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> foi deletado no disco, mas tem alterações não salvadas em {APP_NAME}.<br /><br />Você quer manter as suas alterações?",

    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Use /re/ sintaxe para usar regexp na pesquisa",
    "FIND_RESULT_COUNT"                 : "{0} ocorrências",
    "FIND_RESULT_COUNT_SINGLE"          : "1 ocorrência",
    "FIND_NO_RESULTS"                   : "Não encontrado",
    "WITH"                              : "Com",
    "BUTTON_YES"                        : "Sim",
    "BUTTON_NO"                         : "Não",
    "BUTTON_REPLACE_ALL"                : "Todos\u2026",
    "BUTTON_STOP"                       : "Pare",
    "BUTTON_REPLACE"                    : "Substituir",
            
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Próximo",
    "BUTTON_PREV_HINT"                  : "Anterior",

    "OPEN_FILE"                         : "Abrir Arquivo",
    "SAVE_FILE_AS"                      : "Salvar como\u2026",
    "CHOOSE_FOLDER"                     : "Escolha uma pasta",

    "RELEASE_NOTES"                     : "Notas de Lançamento",
    "NO_UPDATE_TITLE"                   : "Você está atualizado!",
    "NO_UPDATE_MESSAGE"                 : "Você está executando a versão mais recente de {APP_NAME}.",

    "FIND_REPLACE_TITLE_PART1"          : "Substituir \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" por \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" encontrado",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} in {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "em <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "no projeto",

    "FIND_IN_FILES_FILE"                : "arquivo",
    "FIND_IN_FILES_FILES"               : "arquivos",
    "FIND_IN_FILES_MATCH"               : "resultado",
    "FIND_IN_FILES_MATCHES"             : "resultados",
    "FIND_IN_FILES_MORE_THAN"           : "Mais de ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "Arquivo: <b>{0}</b>",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Erro recebendo informações atualizadas",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Houve um problema obtendo a informação de atualização mais recente a partir do servidor. Por favor, verifique se você está conectado à Internet e tente novamente.",

    /**
     * ProjectManager
     */

    "PROJECT_LOADING"   : "Carregando\u2026",
    "UNTITLED"          : "Sem título",
    "WORKING_FILES"     : "Arquivos abertos",

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
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} caractere selecionado",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} caracteres selecionados",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} linha selecionada",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} linhas selecionadas",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Clique para alterar a indentação para espaços",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Clique para alterar a indentação para tabulação",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Clique para alterar o número de espaços usados ao indentar",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Clique para alterar a largura do caractere de tabulação",
    "STATUSBAR_SPACES"                      : "Espaços",
    "STATUSBAR_TAB_SIZE"                    : "Tamanho da Tabulação",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} linha",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} linhas",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE"                    : "{0} erros",
    "SINGLE_ERROR"                          : "1 {0} erro",
    "MULTIPLE_ERRORS"                       : "{1} {0} erros",
    "NO_ERRORS"                             : "Nenhum erro {0} - bom trabalho!",
    "LINT_DISABLED"                         : "Análise de código desativada",
    "NO_LINT_AVAILABLE"                     : "Nenhum analisador disponível para {0}",
    "NOTHING_TO_LINT"                       : "Nada para analisar",

    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Arquivo",
    "CMD_FILE_NEW_UNTITLED"               : "Novo",
    "CMD_FILE_NEW"                        : "Novo",
    "CMD_FILE_NEW_FOLDER"                 : "Nova Pasta",
    "CMD_FILE_OPEN"                       : "Abrir\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Adicionar Para Conjunto de Trabalho",
    "CMD_OPEN_FOLDER"                     : "Abrir pasta\u2026",
    "CMD_FILE_CLOSE"                      : "Fechar",
    "CMD_FILE_CLOSE_ALL"                  : "Fechar Tudo",
    "CMD_FILE_SAVE"                       : "Salvar",
    "CMD_FILE_SAVE_ALL"                   : "Salvar Tudo",
    "CMD_FILE_SAVE_AS"                    : "Salvar Como\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_PROJECT_SETTINGS"                : "Configurações do projeto\u2026",
    "CMD_FILE_RENAME"                     : "Renomear",
    "CMD_FILE_DELETE"                     : "Excluir",
    "CMD_INSTALL_EXTENSION"               : "Instalar Extensão\u2026",
    "CMD_EXTENSION_MANAGER"               : "Gerenciador de Extensões\u2026",
    "CMD_FILE_REFRESH"                    : "Atualizar",
    "CMD_QUIT"                            : "Sair",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Sair",

    // Edit menu commands
    "EDIT_MENU"                           : "Editar",
    "CMD_UNDO"                            : "Desfazer",
    "CMD_REDO"                            : "Refazer",
    "CMD_CUT"                             : "Recortar",
    "CMD_COPY"                            : "Copiar",
    "CMD_PASTE"                           : "Colar",
    "CMD_SELECT_ALL"                      : "Selecionar Tudo",
    "CMD_SELECT_LINE"                     : "Selecionar Linha",
    "CMD_FIND"                            : "Encontrar",
    "CMD_FIND_IN_FILES"                   : "Encontrar em Arquivos",
    "CMD_FIND_IN_SUBTREE"                 : "Encontrar em\u2026",
    "CMD_FIND_NEXT"                       : "Encontrar Próximo",
    "CMD_FIND_PREVIOUS"                   : "Encontrar Anterior",
    "CMD_REPLACE"                         : "Substituir",
    "CMD_INDENT"                          : "Recuar",
    "CMD_UNINDENT"                        : "Desfazer Recuo",
    "CMD_DUPLICATE"                       : "Duplicar",
    "CMD_DELETE_LINES"                    : "Deletar Linha(s) Selecionadas",
    "CMD_COMMENT"                         : "Comentar/Descomentar Linhas",
    "CMD_BLOCK_COMMENT"                   : "Comentar/Descomentar Bloco",
    "CMD_LINE_UP"                         : "Mover Linha(s) para Cima",
    "CMD_LINE_DOWN"                       : "Mover Linha(s) para Baixo",
    "CMD_OPEN_LINE_ABOVE"                 : "Abrir Linha Acima",
    "CMD_OPEN_LINE_BELOW"                 : "Abrir Linha Abaixo",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Fechar Parênteses Automaticamente",
    "CMD_SHOW_CODE_HINTS"                 : "Exibir Dicas de Código",

    // View menu commands
    "VIEW_MENU"                           : "Ver",
    "CMD_HIDE_SIDEBAR"                    : "Esconder Barra Lateral",
    "CMD_SHOW_SIDEBAR"                    : "Mostrar Barra Lateral",
    "CMD_INCREASE_FONT_SIZE"              : "Aumentar Tamanho da Fonte",
    "CMD_DECREASE_FONT_SIZE"              : "Diminuir Tamanho da Fonte",
    "CMD_RESTORE_FONT_SIZE"               : "Restaurar Tamanho da Fonte",
    "CMD_SCROLL_LINE_UP"                  : "Rolar Linha para Cima",
    "CMD_SCROLL_LINE_DOWN"                : "Rolar Linha para Baixo",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Números das Linhas",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Destacar Linha Atual",
    "CMD_TOGGLE_WORD_WRAP"                : "Quebra Automática de Linha",
    "CMD_LIVE_HIGHLIGHT"                  : "Destacar o Live Preview",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Analisar Arquivos ao Salvar",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Organizar por Data",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Organizar por Nome",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Organizar por Tipo",
    "CMD_SORT_WORKINGSET_AUTO"            : "Organizar Automaticamente",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegar",
    "CMD_QUICK_OPEN"                      : "Abertura Rápida",
    "CMD_GOTO_LINE"                       : "Ir para a Linha",
    "CMD_GOTO_DEFINITION"                 : "Ir para Definição",
    "CMD_GOTO_FIRST_PROBLEM"              : "Ir para o Primeiro Erro/Aviso",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edição Rápida",
    "CMD_TOGGLE_QUICK_DOCS"               : "Documentação Rápida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Resultado Anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Resultado Seguinte",
    "CMD_NEXT_DOC"                        : "Documento Seguinte",
    "CMD_PREV_DOC"                        : "Documento Anterior",
    "CMD_SHOW_IN_TREE"                    : "Exibir na Árvore de Arquivos",
    "CMD_SHOW_IN_OS"                      : "Exibir no SO",

    // Help menu commands
    "HELP_MENU"                           : "Ajuda",
    "CMD_CHECK_FOR_UPDATE"                : "Verificar Atualizações",
    "CMD_HOW_TO_USE_BRACKETS"             : "Como Usar {APP_NAME}",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Mostrar Pasta de Extensões",
    "CMD_FORUM"                           : "{APP_NAME} Forum",
    "CMD_RELEASE_NOTES"                   : "Notas de Publicação",
    "CMD_REPORT_AN_ISSUE"                 : "Reportar um Erro",
    "CMD_ABOUT"                           : "Sobre",
    "CMD_TWITTER"                         : "{TWITTER_NAME} no Twitter",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "Versão Experimental",
    "DEVELOPMENT_BUILD"                    : "Versão de Desenvolvimento",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Não Salvar",
    "SAVE"                                 : "Salvar",
    "CANCEL"                               : "Cancelar",
    "DELETE"                               : "Excluir",
    "RELOAD_FROM_DISK"                     : "Atualizar a Partir do Disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Manter Mudanças no Editor",
    "CLOSE_DONT_SAVE"                      : "Fechar (Não Salvar)",
    "RELAUNCH_CHROME"                      : "Abrir Chrome Novamente",
    "ABOUT"                                : "Sobre",
    "CLOSE"                                : "Fechar",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} versão experimental {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Avisos, termos e condições de softwares de terceiros estão localizados em <span class=\"non-clickble-link\">http://www.adobe.com/go/thirdparty/</span> e aqui incorporados por referência.",
    "ABOUT_TEXT_LINE4"                     : "Documentação e fontes <span class=\"non-clickble-link\">https://github.com/adobe/brackets/</span>",
    "ABOUT_TEXT_LINE5"                     : "Feito com \u2764 and JavaScript por:",
    "ABOUT_TEXT_LINE6"                     : "Muitas pessoas (mas nós estamos tendo problemas para exibi-las agora).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "O Web Platform Docs e o logo gráfico do Web Platform são licenciados sob uma licensa Creative Commons Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Há uma nova versão de {APP_NAME} disponível! Clique aqui para mais detalhes.",
    "UPDATE_AVAILABLE_TITLE"               : "Atualização Disponível",
    "UPDATE_MESSAGE"                       : "Opa, há uma nova versão de {APP_NAME} disponível. Aqui estão alguns dos novos recursos:",
    "GET_IT_NOW"                           : "Obtenha agora!",
    "PROJECT_SETTINGS_TITLE"               : "Configuraçõs do Projeto: {0}",
    "PROJECT_SETTING_BASE_URL"             : "URL de base do Live Preview",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Para usar um servidor local, insira uma URL como http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "O protocolo {0} não é suportado pelo Live Preview&mdash;por favor, use http: ou https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "A URL de base não pode conter parâmetros de consulta como \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "A URL de base não pode conter hashes como \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Caracteres especiais, como '{0}', precisam ser codificados com %.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Erro ao analisar a URL de base",
    
    
    // extensions/default/DebugCommands
    "INSTALL"                              : "Instalar",
    "UPDATE"                               : "Atualizar",
    "REMOVE"                               : "Remvoer",
    "OVERWRITE"                            : "Sobrescrever",
    "CANT_REMOVE_DEV"                      : "Extensões na pastar \"dev\" devem ser manualmente excluídas.",
    "CANT_UPDATE"                          : "A atualização não é compatível com esta versão de {APP_NAME}.",
    "INSTALL_EXTENSION_TITLE"              : "Instalar Extensão",
    "UPDATE_EXTENSION_TITLE"               : "Atualizar Extensão",
    "INSTALL_EXTENSION_LABEL"              : "Endereço URL da extensão",
    "INSTALL_EXTENSION_HINT"               : "Endereço URL do arquivo zip ou do repositório do GitHub da extensão",
    "INSTALLING_FROM"                      : "Instalar extensão de {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Instalado com sucesso!",
    "INSTALL_FAILED"                       : "Erro ao instalar.",
    "CANCELING_INSTALL"                    : "Cancelando\u2026",
    "CANCELING_HUNG"                       : "O cancelamento da instalação está demorando muito. Pode ter ocorrido um erro interno.",
    "INSTALL_CANCELED"                     : "Instalação cancelada.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "O conteúdo baixado não é um arquivo zip válido.",
    "INVALID_PACKAGE_JSON"                 : "O arquivo package.json é inválido (erro: {0}).",
    "MISSING_PACKAGE_NAME"                 : "O arquivo package.json não especifica o nome do pacote.",
    "BAD_PACKAGE_NAME"                     : "{0} é um nome de pacote inválido.",
    "MISSING_PACKAGE_VERSION"              : "O arquivo package.json não especifica a versão do pacote.",
    "INVALID_VERSION_NUMBER"               : "O número de versão do pacote ({0}) é inválido.",
    "INVALID_BRACKETS_VERSION"             : "A string de compatibilidade de {APP_NAME} ({0}) é inválida.",
    "DISALLOWED_WORDS"                     : "As palavras ({1}) não são permitidas no campo {0}.",
    "API_NOT_COMPATIBLE"                   : "A extensão não é compatível com esta versão do {APP_NAME}. Foi instalada na pasta de extensões desativadas.",
    "MISSING_MAIN"                         : "O pacote não possui um arquivo \"main.js\".",
    "EXTENSION_ALREADY_INSTALLED"          : "Instalar este pacote irá sobrescrever uma extensão anteriormente instalada. Deseja sobrescrevê-la?",
    "EXTENSION_SAME_VERSION"               : "Este pacote possui a mesma versão de outro que já está instalado. Deseja sobrescrevê-lo?",
    "EXTENSION_OLDER_VERSION"              : "A versão deste pacote ({0}) é mais antiga que a versão do pacote já instalado ({1}). Deseja sobrescrevê-lo?",
    "DOWNLOAD_ID_IN_USE"                   : "Erro interno: ID de download em uso.",
    "NO_SERVER_RESPONSE"                   : "Não foi possível se conectar ao servidor.",
    "BAD_HTTP_STATUS"                      : "Arquivo não encontrado no servidor (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Não foi possível baixar o arquivo em um arquivo temporário.",
    "ERROR_LOADING"                        : "A extensão encontrou um erro ao iniciar.",
    "MALFORMED_URL"                        : "A URL é inválida. Por favor, verifique se você a digitou corretamente.",
    "UNSUPPORTED_PROTOCOL"                 : "A URL deve ser http: ou https:.",
    "UNKNOWN_ERROR"                        : "Erro interno desconhecido.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Gerenciador de Extensões",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Não foi possível acessar o registro de extensões. Por favor, tente novamente mais tarde.",
    "INSTALL_FROM_URL"                     : "Instalar a partir da URL\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Data",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Esta extensão precisa de uma versão mais recente do {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Esta extensão só funciona em versões antigas do {APP_NAME}.",
    "EXTENSION_NO_DESCRIPTION"             : "Nenhuma descrição",
    "EXTENSION_MORE_INFO"                  : "Mais informações...",
    "EXTENSION_ERROR"                      : "Erro na extensão",
    "EXTENSION_KEYWORDS"                   : "Palavras-chave",
    "EXTENSION_INSTALLED"                  : "Instaladas",
    "EXTENSION_UPDATE_INSTALLED"           : "A atualização para esta extensão foi baixada e será instalada quando você fechar o {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Procurar",
    "EXTENSION_MORE_INFO_LINK"             : "Mais",
    "BROWSE_EXTENSIONS"                    : "Visualizar Extensões",
    "EXTENSION_MANAGER_REMOVE"             : "Remover Extensão",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Não foi possível remover uma ou mais extensões: {0}. {APP_NAME} irá fechar.",
    "EXTENSION_MANAGER_UPDATE"             : "Atualizar Extensão",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Não foi possível atualizar uma ou mais extensões: {0}. {APP_NAME} irá fechar.",
    "MARKED_FOR_REMOVAL"                   : "Selecionada para remoção",
    "UNDO_REMOVE"                          : "Desfazer",
    "MARKED_FOR_UPDATE"                    : "Selecionada para atualização",
    "UNDO_UPDATE"                          : "Refazer",
    "CHANGE_AND_QUIT_TITLE"                : "Alterar Extensões",
    "CHANGE_AND_QUIT_MESSAGE"              : "Para atualizar ou remover as extensões selecionadas, você precisa reiniciar o {APP_NAME}. Você será alertado a salvar as alterações.",
    "REMOVE_AND_QUIT"                      : "Remover Extensões e Sair",
    "CHANGE_AND_QUIT"                      : "Alterar Remover e Sair",
    "UPDATE_AND_QUIT"                      : "Atualizar Remover e Sair",
    "EXTENSION_NOT_INSTALLED"              : "Não foi possível remover a extensão {0} porque ela não foi instalada.",
    "NO_EXTENSIONS"                        : "Nenhuma extensão instalada.<br>Clique na aba \"Disponíveis\" acima para iniciar.",
    "NO_EXTENSION_MATCHES"                 : "Nenhuma extensão encontrada.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Seja cuidadoso ao instalar extensões de fontes desconhecidas.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Instaladas",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Disponíveis",
    "EXTENSIONS_UPDATES_TITLE"             : "Atualizações",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixels",
    
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                           : "Depurar",
    "CMD_SHOW_DEV_TOOLS"                   : "Mostrar Ferramentas de Desenvolvimento",
    "CMD_REFRESH_WINDOW"                   : "Recarregar {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"              : "Nova Janela {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                  : "Trocar Linguagem",
    "CMD_RUN_UNIT_TESTS"                   : "Executar Testes",
    "CMD_SHOW_PERF_DATA"                   : "Mostrar Dados de Desempenho",
    "CMD_ENABLE_NODE_DEBUGGER"             : "Ativar o Depurador do Node",
    "CMD_LOG_NODE_STATE"                   : "Enviar Estatísticas do Node para o Console",
    "CMD_RESTART_NODE"                     : "Reiniciar o Node",
    
    "LANGUAGE_TITLE"                       : "Trocar Idioma",
    "LANGUAGE_MESSAGE"                     : "Por favor, selecione o idioma desejado na lista abaixo:",
    "LANGUAGE_SUBMIT"                      : "Recarregar {APP_NAME}",
    "LANGUAGE_CANCEL"                      : "Cancelar",
    "LANGUAGE_SYSTEM_DEFAULT"              : "Padrão do Sistema",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "Tcheco",
    "LOCALE_DE"                                 : "Alemão",
    "LOCALE_EN"                                 : "InglÊs",
    "LOCALE_ES"                                 : "Espanhol",
    "LOCALE_FI"                                 : "FinlandÊs",
    "LOCALE_FR"                                 : "Francês",
    "LOCALE_IT"                                 : "Italiano",
    "LOCALE_JA"                                 : "Japonês",
    "LOCALE_NB"                                 : "Norueguês",
    "LOCALE_PL"                                 : "Po0lonês",
    "LOCALE_PT_BR"                              : "Português do Brasil",
    "LOCALE_PT_PT"                              : "Português",
    "LOCALE_RU"                                 : "Russo",
    "LOCALE_SK"                                 : "Eslovaco",
    "LOCALE_SV"                                 : "Sueco",
    "LOCALE_TR"                                 : "Turko",
    "LOCALE_ZH_CN"                              : "Chinês simplificado",
    "LOCALE_HU"                                 : "Húngaro",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Cor Atual",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Cor Original",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Formato RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Formato Hexadecimal",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Formato HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Utilizada {1} vez)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Utilizada {1} vez)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Ir para Definição",
    "CMD_SHOW_PARAMETER_HINT"                   : "Exibir Sugestão de Parâmetro",
    "NO_ARGUMENTS"                              : "<sem parâmetros>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Ativar Visualização Rápida ao Passar o Mouse",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Projetos Recentes",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Ler mais"
});
