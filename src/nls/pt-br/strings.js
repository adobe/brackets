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
    "FILE_EXISTS_ERR"                   : "Arquivo ou pasta já existe.",
    "FILE"                              : "arquivo",
    "DIRECTORY"                         : "diretório",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Erro ao carregar o projeto",
    "OPEN_DIALOG_ERROR"                 : "Ocorreu um erro ao mostrar o diálogo de abertura de arquivo. (erro {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Ocorreu um erro ao tentar carregar a pasta <span class='dialog-filename'>{0}</span>. (erro {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Ocorreu um erro ao ler o conteúdo da pasta <span class='dialog-filename'>{0}</span>. (erro {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Erro ao abrir arquivo",
    "ERROR_OPENING_FILE"                : "Ocorreu um erro ao tentar abrir o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Ocorreu um erro ao tentar abrir os seguintes arquivos:",
    "ERROR_RELOADING_FILE_TITLE"        : "Erro ao recarregar as mudanças a partir do disco",
    "ERROR_RELOADING_FILE"              : "Ocorreu um erro ao tentar recarregar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Erro ao salvar arquivo",
    "ERROR_SAVING_FILE"                 : "Ocorreu um erro ao tentar salvar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Erro ao renomear arquivo",
    "ERROR_RENAMING_FILE"               : "Ocorreu um erro ao tentar renomear o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Erro ao excluir arquivo",
    "ERROR_DELETING_FILE"               : "Ocorreu um erro ao tentar excluir o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Nome de {0} inválido",
    "INVALID_FILENAME_MESSAGE"          : "Nomes de arquivos não podem conter os seguintes caracteres: {0} nem usar palavras reservadas do sistema.",
    "FILE_ALREADY_EXISTS"               : "Já existe um {0} chamado <span class='dialog-filename'>{1}</span>.",
    "ERROR_CREATING_FILE_TITLE"         : "Erro ao criar {0}",
    "ERROR_CREATING_FILE"               : "Ocorreu um erro ao tentar criar o {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Opa! O {APP_NAME} não funciona em navegadores ainda.",
    "ERROR_IN_BROWSER"                  : "O {APP_NAME} é criado em HTML, mas no momento ele é executado como um aplicativo de desktop para que você possa usá-lo para editar arquivos locais. Por favor, use o shell da aplicação do repositório <b>github.com/adobe/brackets-shell</b> para executar {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Erro ao indexar arquivos",
    "ERROR_MAX_FILES"                   : "O número máximo de arquivos foi indexado. Ações que procuram no índice de arquivos podem funcionar incorretamente.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Erro ao abrir o navegador",
    "ERROR_CANT_FIND_CHROME"            : "O navegador Google Chrome não pôde ser encontrado. Por favor, verifique se ele está instalado.",
    "ERROR_LAUNCHING_BROWSER"           : "Ocorreu um erro ao iniciar o navegador. (erro {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Erro no Live Preview",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Conectando-se ao navegador",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Para que o Live Preview conecte-se, o Chrome deve ser reiniciado com a opção de depuração remota ativada.<br /><br />Gostaria de abrir o Chrome novamente e permitir a depuração remota?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Não foi possível carregar a página de Live Development",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Abra um arquivo HTML para iniciar Live Preview.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Para iniciar um live preview com um arquivo server-side, é preciso especificar uma URL Base para este projeto.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Erro ao iniciar o servidor HTTP para os arquivos do desenvolvimento em tempo real. Por favor, tente novamente.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Bem-vindo à Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "O Live Preview conecta o {APP_NAME} ao seu navegador. Ele abre uma prévia do seu arquivo HTML no navegador e atualiza a visualização em tempo real, enquanto você edita o código.<br /><br />Nesta versão inicial do {APP_NAME}, o Live Preview só funciona com o <strong>Google Chrome</strong> e atualiza em tempo real enquanto você edita <strong>arquivos CSS</strong>. Alterações em arquivos HTML ou JavaScript são automaticamente recarregados ao salvar.<br /><br />(Você só verá esta mensagem uma vez.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Para mais informações, veja <a href='{0}' title='{0}'>Solucionando erros de conexão com Live Development</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Connectando\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Inicializando\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Desconectar Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview: Clique para desconectar (Salve o arquivo para atualizar)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "O Live Preview foi cancelado pois as ferramentas de desenvolvedor do navegador foram abertas",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "O Live Preview foi cancelado pois a página foi fechada no navegador",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "O Live Preview foi cancelado pois o navegador foi para uma página que não pertence a este projeto atual",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "O Live Preview foi cancelado por uma razão desconhecida ({0})",

    "SAVE_CLOSE_TITLE"                  : "Salvar alterações",
    "SAVE_CLOSE_MESSAGE"                : "Você quer salvar as alterações feitas no documento <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Você quer salvar as alterações feitas aos seguintes arquivos?",
    "EXT_MODIFIED_TITLE"                : "Mudanças externas",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Confirmar exclusão",
    "CONFIRM_FOLDER_DELETE"             : "Tem certeza que deseja excluir a pasta <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Arquivo excluído",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> foi modificado no disco, mas também tem alterações não salvas em {APP_NAME}.<br /><br />Qual versão você quer manter?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> foi excluído no disco, mas tem alterações não salvas em {APP_NAME}.<br /><br />Deseja manter suas alterações?",

    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Use a sintaxe /re/ para pesquisas com regexp",
    "FIND_RESULT_COUNT"                 : "{0} resultados",
    "FIND_RESULT_COUNT_SINGLE"          : "1 resultado",
    "FIND_NO_RESULTS"                   : "Nenhum resultado",
    "WITH"                              : "Com",
    "BUTTON_YES"                        : "Sim",
    "BUTTON_NO"                         : "Não",
    "BUTTON_REPLACE_ALL"                : "Todos\u2026",
    "BUTTON_STOP"                       : "Pare",
    "BUTTON_REPLACE"                    : "Substituir",
            
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Resultado seguinte",
    "BUTTON_PREV_HINT"                  : "Resultado ",

    "OPEN_FILE"                         : "Abrir arquivo",
    "SAVE_FILE_AS"                      : "Salvar arquivo",
    "CHOOSE_FOLDER"                     : "Escolha uma pasta",

    "RELEASE_NOTES"                     : "Notas da Versão",
    "NO_UPDATE_TITLE"                   : "Você está atualizado!",
    "NO_UPDATE_MESSAGE"                 : "Você está executando a versão mais recente do {APP_NAME}.",

    "FIND_REPLACE_TITLE_PART1"          : "Substituir \"",
    "FIND_REPLACE_TITLE_PART2"          : "\" por \"",
    "FIND_REPLACE_TITLE_PART3"          : "\" &mdash; {2} {0} {1}",

    "FIND_IN_FILES_TITLE_PART1"         : "\"",
    "FIND_IN_FILES_TITLE_PART2"         : "\" encontrado(s)",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} em {2} {3}",
    "FIND_IN_FILES_SCOPED"              : "em <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "no projeto",
    "FIND_IN_FILES_FILE"                : "arquivo",
    "FIND_IN_FILES_FILES"               : "arquivos",
    "FIND_IN_FILES_MATCH"               : "resultado",
    "FIND_IN_FILES_MATCHES"             : "resultados",
    "FIND_IN_FILES_MORE_THAN"           : "Mais de ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_LINE"                : "linha: {0}",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Erro ao receber informações de atualização",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Houve um problema ao obter informações sobre a última atualização do servidor. Por favor, certifique-se de estar conectado à Internet e tente novamente.",

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
    "KEYBOARD_SPACE"  : "Espaço",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Linha {0}, Coluna {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 {0} coluna selecionada",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 {0} colunas selecionadas",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 {0} linha selecionada",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 {0} linhas selecionadas",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Clique para alterar a indentação para espaços",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Clique para alterar a indentação para tabulação",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Clique para alterar o número de espaços usados ao indentar",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Clique para alterar a largura do caractere de tabulação",
    "STATUSBAR_SPACES"                      : "Espaços:",
    "STATUSBAR_TAB_SIZE"                    : "Tamanho da tabulação:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} linha",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} linhas",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE"                    : "Erros {0}",
    "SINGLE_ERROR"                          : "1 erro {0}",
    "MULTIPLE_ERRORS"                       : "{1} erros {0}",
    "NO_ERRORS"                             : "Nenhum erro {0} - bom trabalho!",
    "LINT_DISABLED"                         : "A análise de código está desativada",
    "NO_LINT_AVAILABLE"                     : "Nenhum analisador de código disponível para {0}",
    "NOTHING_TO_LINT"                       : "Nada para analisar",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Arquivo",
    "CMD_FILE_NEW_UNTITLED"               : "Novo",
    "CMD_FILE_NEW"                        : "Novo arquivo",
    "CMD_FILE_NEW_FOLDER"                 : "Nova pasta",
    "CMD_FILE_OPEN"                       : "Abrir\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Adicionar ao Conjunto de Trabalho",
    "CMD_OPEN_FOLDER"                     : "Abrir pasta\u2026",
    "CMD_FILE_CLOSE"                      : "Fechar",
    "CMD_FILE_CLOSE_ALL"                  : "Fechar todos",
    "CMD_FILE_SAVE"                       : "Salvar",
    "CMD_FILE_SAVE_ALL"                   : "Salvar todos",
    "CMD_FILE_SAVE_AS"                    : "Salvar como\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_PROJECT_SETTINGS"                : "Configurações do projeto\u2026",
    "CMD_FILE_RENAME"                     : "Renomear",
    "CMD_FILE_DELETE"                     : "Excluir",
    "CMD_INSTALL_EXTENSION"               : "Instalar extensão\u2026",
    "CMD_EXTENSION_MANAGER"               : "Gerenciador de extensões\u2026",
    "CMD_FILE_REFRESH"                    : "Recarregar árvore de arquivos",
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
    "CMD_SELECT_ALL"                      : "Selecionar tudo",
    "CMD_SELECT_LINE"                     : "Selecionar linha",
    "CMD_FIND"                            : "Localizar",
    "CMD_FIND_IN_FILES"                   : "Localizar em arquivos",
    "CMD_FIND_IN_SUBTREE"                 : "Localizar em \u2026",
    "CMD_FIND_NEXT"                       : "Localizar Próximo",
    "CMD_FIND_PREVIOUS"                   : "Localizar Anterior",
    "CMD_REPLACE"                         : "Substituir",
    "CMD_INDENT"                          : "Indentar",
    "CMD_UNINDENT"                        : "Diminuir indentação",
    "CMD_DUPLICATE"                       : "Duplicar",
    "CMD_DELETE_LINES"                    : "Excluir linha",
    "CMD_COMMENT"                         : "Alternar comentário de linha",
    "CMD_BLOCK_COMMENT"                   : "Alternar comentário de bloco",
    "CMD_LINE_UP"                         : "Mover linha para cima",
    "CMD_LINE_DOWN"                       : "Mover linha para baixo",
    "CMD_OPEN_LINE_ABOVE"                 : "Abrir linha acima",
    "CMD_OPEN_LINE_BELOW"                 : "Abrir linha abaixo",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Fechar chaves automaticamente",
    "CMD_SHOW_CODE_HINTS"                 : "Mostrar dicas de código",

    // View menu commands
    "VIEW_MENU"                           : "Ver",
    "CMD_HIDE_SIDEBAR"                    : "Esconder Barra Lateral",
    "CMD_SHOW_SIDEBAR"                    : "Mostrar Barra Lateral",
    "CMD_INCREASE_FONT_SIZE"              : "Aumentar tamanho da fonte",
    "CMD_DECREASE_FONT_SIZE"              : "Diminuir tamanho da fonte",
    "CMD_RESTORE_FONT_SIZE"               : "Restaurar tamanho da fonte",
    "CMD_SCROLL_LINE_UP"                  : "Rolar linha para cima",
    "CMD_SCROLL_LINE_DOWN"                : "Rolar linha para baixo",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Números de linha",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Destacar linha ativa",
    "CMD_TOGGLE_WORD_WRAP"                : "Quebra automática de linha",
    "CMD_LIVE_HIGHLIGHT"                  : "Destacar Live Preview",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Analisar arquivos ao salvar",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Ordenar por Data de Adição",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Ordenar por Nome",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Ordenar por Tipo",
    "CMD_SORT_WORKINGSET_AUTO"            : "Ordenação automática",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegar",
    "CMD_QUICK_OPEN"                      : "Abertura rápida",
    "CMD_GOTO_LINE"                       : "Ir para linha",
    "CMD_GOTO_DEFINITION"                 : "Encontrar definição",
    "CMD_GOTO_FIRST_PROBLEM"              : "Ir ao primeiro Erro/Aviso",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edição rápida",
    "CMD_TOGGLE_QUICK_DOCS"               : "Documentação rápida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Resultado anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Resultado seguinte",
    "CMD_NEXT_DOC"                        : "Documento seguinte",
    "CMD_PREV_DOC"                        : "Documento anterior",
    "CMD_SHOW_IN_TREE"                    : "Mostrar na árvore de arquivos",
    "CMD_SHOW_IN_OS"                      : "Mostrar no sistema operacional",

    // Help menu commands
    "HELP_MENU"                           : "Ajuda",
    "CMD_CHECK_FOR_UPDATE"                : "Verificar atualizações",
    "CMD_HOW_TO_USE_BRACKETS"             : "Como usar o {APP_NAME}",
    "CMD_FORUM"                           : "Fórum do {APP_NAME}",
    "CMD_RELEASE_NOTES"                   : "Notas da versão",
    "CMD_REPORT_AN_ISSUE"                 : "Relatar um problema",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Mostrar pasta de extensões",
    "CMD_TWITTER"                         : "{TWITTER_NAME} no Twitter",
    "CMD_ABOUT"                           : "Sobre o {APP_TITLE}",


    // Special commands invoked by the native shell
    "CMD_CLOSE_WINDOW"                    : "Fechar janela",
    "CMD_ABORT_QUIT"                      : "Abortar saída",
    "CMD_BEFORE_MENUPOPUP"                : "Antes do popup do menu",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "versão experimental",
    "DEVELOPMENT_BUILD"                    : "versão de desenvolvimento",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Não salvar",
    "SAVE"                                 : "Salvar",
    "CANCEL"                               : "Cancelar",
    "DELETE"                               : "Excluir",
    "RELOAD_FROM_DISK"                     : "Recarregar do disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Manter alterações no editor",
    "CLOSE_DONT_SAVE"                      : "Fechar (não salvar)",
    "RELAUNCH_CHROME"                      : "Abrir Chrome novamente",
    "ABOUT"                                : "Sobre",
    "CLOSE"                                : "Fechar",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Avisos, termos e condições de softwares de terceiros estão localizados em <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> e aqui incorporados por referência.",
    "ABOUT_TEXT_LINE4"                     : "Documentação e código-fonte em <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "Feito com \u2764 e JavaScript por:",
    "ABOUT_TEXT_LINE6"                     : "Várias pessoas (mas não estamos conseguindo carregar estes dados no momento).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform Docs e logo gráfico Web Platform são licenciados sob a licença Creative Commons Attribution, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "Há uma nova versão do {APP_NAME} disponível! Clique aqui para mais detalhes.",
    "UPDATE_AVAILABLE_TITLE"               : "Atualização Disponível",
    "UPDATE_MESSAGE"                       : "Ei, há uma nova versão do {APP_NAME} disponível. Aqui estão alguns dos novos recursos:",
    "GET_IT_NOW"                           : "Obtenha agora!",
    "PROJECT_SETTINGS_TITLE"               : "Configurações do projeto para: {0}",
    "PROJECT_SETTING_BASE_URL"             : "URL base do Live Preview",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Para usar um servidor local, insira uma url como http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "O protocolo {0} não é suportado pelo Live Preview&mdash;por favor, use http: ou https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "A URL base não pode conter parâmetros de busca como \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "A URL base não pode conter hashes como \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Caracteres especiais como '{0}' devem ser codificados para URL encoding.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Erro desconhecido ao parsear URL base",
    
    // Extension Management strings
    "INSTALL"                              : "Instalar",
    "UPDATE"                               : "Atualizar",
    "REMOVE"                               : "Remover",
    "OVERWRITE"                            : "Sobrescrever",
    "CANT_REMOVE_DEV"                      : "Extensões na pasta \"dev\" devem ser excluídas manualmente.",
    "CANT_UPDATE"                          : "A atualização não é compatível com esta versão do {APP_NAME}.",
    "INSTALL_EXTENSION_TITLE"              : "Instalar extensão",
    "UPDATE_EXTENSION_TITLE"               : "Atualizar extensão",
    "INSTALL_EXTENSION_LABEL"              : "URL da extensão",
    "INSTALL_EXTENSION_HINT"               : "URL do zip ou repositório GitHub da extensão",
    "INSTALLING_FROM"                      : "Instalando extensão de {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Instalada com sucesso!",
    "INSTALL_FAILED"                       : "Falha na instalação.",
    "CANCELING_INSTALL"                    : "Cancelando\u2026",
    "CANCELING_HUNG"                       : "Cancelar a instalação está demorando muito. Um erro interno deve ter ocorrido.",
    "INSTALL_CANCELED"                     : "Instalação cancelada.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "O conteúdo baixado não é um arquivo zip válido.",
    "INVALID_PACKAGE_JSON"                 : "O arquivo package.json não é válido (o erro foi: {0}).",
    "MISSING_PACKAGE_NAME"                 : "O arquivo package.json não especifica um nome de pacote.",
    "BAD_PACKAGE_NAME"                     : "{0} é um nome de pacote inválido.",
    "MISSING_PACKAGE_VERSION"              : "O arquivo package.json não especifica uma versão de pacote.",
    "INVALID_VERSION_NUMBER"               : "O número da versão do pacote ({0}) é inválido.",
    "INVALID_BRACKETS_VERSION"             : "A string de compatibilidade com o {APP_NAME} ({0}) é inválida.",
    "DISALLOWED_WORDS"                     : "As palavras ({1}) não são permitidas no campo {0}.",
    "API_NOT_COMPATIBLE"                   : "A extensão não é compatível com esta versão do {APP_NAME}. Está instalada na sua pasta de extensões desativadas.",
    "MISSING_MAIN"                         : "O pacote não tem um arquivo main.js.",
    "EXTENSION_ALREADY_INSTALLED"          : "Instalar este pacote irá substituir uma extensão instalada anteriormente. Sobrescrever a exensão antiga?",
    "EXTENSION_SAME_VERSION"               : "Este pacote está na mesma versão que o instalado atualmente. Sobrescrever a instalação existente?",
    "EXTENSION_OLDER_VERSION"              : "Este pacote está na versão {0}, que é mais antiga que a instalada atualmente ({1}). Sobrescrever a instalação existente?",
    "DOWNLOAD_ID_IN_USE"                   : "Erro interno: ID de download já em uso.",
    "NO_SERVER_RESPONSE"                   : "Não foi possível conectar-se ao servidor.",
    "BAD_HTTP_STATUS"                      : "Aquivo não encontrado no servidor (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Não foi possível salvar o download em um arquivo temporário.",
    "ERROR_LOADING"                        : "A extensão encontrou um erro ao inicializar.",
    "MALFORMED_URL"                        : "A URL é inválida. Por favor, verifique se você a inseriu corretamente.",
    "UNSUPPORTED_PROTOCOL"                 : "A URL precisa ser um endereço http ou https.",
    "UNKNOWN_ERROR"                        : "Erro interno desconhecido.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Gerenciador de Extensões",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Não foi possível acessar o registro de extensões. Por favor,tente novamente mais tarde.",
    "INSTALL_FROM_URL"                     : "Instalar a partir de URL\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Data",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Esta extensão requer uma versão mais recente do {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Esta extensão atualmente só funciona com versões antigas do {APP_NAME}.",
    "EXTENSION_NO_DESCRIPTION"             : "Sem descrição",
    "EXTENSION_MORE_INFO"                  : "Mais informações...",
    "EXTENSION_ERROR"                      : "Erro na extensão",
    "EXTENSION_KEYWORDS"                   : "Palavras-chave",
    "EXTENSION_INSTALLED"                  : "Instalada",
    "EXTENSION_UPDATE_INSTALLED"           : "Esta atualização foi baixada e será instalada quando você sair do {APP_NAME}.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Pesquisar",
    "EXTENSION_MORE_INFO_LINK"             : "Mais",
    "BROWSE_EXTENSIONS"                    : "Procurar extensões",
    "EXTENSION_MANAGER_REMOVE"             : "Remover extensão",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Não foi possível remover uma ou mais extensões: {0}. O {APP_NAME} será encerrado mesmo assim.",
    "EXTENSION_MANAGER_UPDATE"             : "Atualizar extensão",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Não foi possível atualizar uma ou mais extensões: {0}. O {APP_NAME} será encerrado mesmo assim.",
    "MARKED_FOR_REMOVAL"                   : "Marcada para remoção",
    "UNDO_REMOVE"                          : "Desfazer",
    "MARKED_FOR_UPDATE"                    : "Marcada para atualização",
    "UNDO_UPDATE"                          : "Desfazer",
    "CHANGE_AND_QUIT_TITLE"                : "Alterar extensões",
    "CHANGE_AND_QUIT_MESSAGE"              : "Para atualizar ou remover as extensões marcadas, você deve sair e reiniciar o {APP_NAME}. Você será solicitado a salvar alterações.",
    "REMOVE_AND_QUIT"                      : "Remover extensões e sair",
    "CHANGE_AND_QUIT"                      : "Alterar extensões e sair",
    "UPDATE_AND_QUIT"                      : "Atualizar extensões e sair",
    "EXTENSION_NOT_INSTALLED"              : "Não foi possível remover a extensão {0} porque não estava instalada.",
    "NO_EXTENSIONS"                        : "Nenhuma extensão instalada ainda.<br>Clique na aba Disponíveis acima para começar.",
    "NO_EXTENSION_MATCHES"                 : "Nenhuma extensão corresponde à sua pesquisa.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Tenha cuidado ao instalar extensões de fontes desconhecidas.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Instaladas",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Disponíveis",
    "EXTENSIONS_UPDATES_TITLE"             : "Atualizações",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixels",
    
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Depurar",
    "CMD_SHOW_DEV_TOOLS"                        : "Mostrar Ferramentas do Desenvolvedor",
    "CMD_REFRESH_WINDOW"                        : "Recarregar {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nova janela do {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Trocar idioma",
    "CMD_RUN_UNIT_TESTS"                        : "Executar testes",
    "CMD_SHOW_PERF_DATA"                        : "Mostrar dados de desempenho",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Habilitar Depurador Node",
    "CMD_LOG_NODE_STATE"                        : "Registrar estado do Node no Console",
    "CMD_RESTART_NODE"                          : "Reiniciar Node",
    
    "LANGUAGE_TITLE"                            : "Trocar idioma",
    "LANGUAGE_MESSAGE"                          : "Idioma:",
    "LANGUAGE_SUBMIT"                           : "Recarregar {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Cancelar",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Padrão do sistema",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "Tcheco",
    "LOCALE_DE"                                 : "Alemão",
    "LOCALE_EN"                                 : "Inglês",
    "LOCALE_ES"                                 : "Espanhol",
    "LOCALE_FI"                                 : "Finlandês",
    "LOCALE_FR"                                 : "Francês",
    "LOCALE_IT"                                 : "Italiano",
    "LOCALE_JA"                                 : "Japonês",
    "LOCALE_NB"                                 : "Norueguês",
    "LOCALE_PL"                                 : "Polonês",
    "LOCALE_PT_BR"                              : "Português do Brasil",
    "LOCALE_PT_PT"                              : "Português",
    "LOCALE_RU"                                 : "Russo",
    "LOCALE_SV"                                 : "Sueco",
    "LOCALE_TR"                                 : "Turco",
    "LOCALE_ZH_CN"                              : "Chinês Simplificado",
    "LOCALE_HU"                                 : "Húngaro",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Cor atual",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Cor original",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Formato RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Formato Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Formato HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (Usada {1} vez)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (Usada {1} vezes)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Pular para definição",
    "CMD_SHOW_PARAMETER_HINT"                   : "Mostrar dica de parâmetro",
    "NO_ARGUMENTS"                              : "<nenhum parâmetro>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Quick View ao passar o mouse",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Projetos Recentes",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Leia mais"
});
