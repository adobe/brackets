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
    "EXCEEDS_MAX_FILE_SIZE"             : "Arquivos maiores que {0} MB não podem ser abertos no {APP_NAME}.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "O diretório de destino não pode ser modificado.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "As permissões não permitem que você faça modificações.",
    "CONTENTS_MODIFIED_ERR"             : "O arquivo foi modificado fora do {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} atualmente suporta apenas arquivos de texto codificados em UTF-8.",
    "FILE_EXISTS_ERR"                   : "Arquivo ou pasta já existe.",
    "FILE"                              : "arquivo",
    "FILE_TITLE"                        : "Arquivo",
    "DIRECTORY"                         : "diretório",
    "DIRECTORY_TITLE"                   : "Diretório",
    "DIRECTORY_NAMES_LEDE"              : "Nomes de diretórios",
    "FILENAMES_LEDE"                    : "Nomes de arquivos",
    "FILENAME"                          : "Nome de arquivo",
    "DIRECTORY_NAME"                    : "Nome de diretório",
    

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
    "INVALID_FILENAME_TITLE"            : "{0} inválido",
    "INVALID_FILENAME_MESSAGE"          : "{0} não podem usar palavras reservadas do sistema, terminar com pontos (.) ou conter qualquer um dos seguintes caracteres: <code class='emphasized'>{1}</code>.",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "Já existe um arquivo ou diretório como o nome <span class='dialog-filename'>{0}</span>.",
    "ERROR_CREATING_FILE_TITLE"         : "Erro ao criar {0}",
    "ERROR_CREATING_FILE"               : "Ocorreu um erro ao tentar criar o {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP"              : "Não é possível abrir uma pasta e outros arquivos ao mesmo tempo.",

    // User key map error strings
    "ERROR_KEYMAP_TITLE"                : "Erro ao ler mapa de teclas do usuário",
    "ERROR_KEYMAP_CORRUPT"              : "Seu arquivo de mapa de teclas não é um JSON válido. O arquivo será aberto para que você possa corrigir o formato.",
    "ERROR_LOADING_KEYMAP"              : "Seu arquivo de mapa de teclas não é um arquivo de texto com codificação UTF-8 válida e não pode ser carregado",
    "ERROR_RESTRICTED_COMMANDS"         : "Você não pode reatribuir atalhos para estes comandos: {0}",
    "ERROR_RESTRICTED_SHORTCUTS"        : "Você não pode reatribuir estes atalhos: {0}",
    "ERROR_MULTIPLE_SHORTCUTS"          : "Você está reatribuindo múltiplos atalhos para estes comandos: {0}",
    "ERROR_DUPLICATE_SHORTCUTS"         : "Você tem múltiplos vínculos para estes atalhos: {0}",
    "ERROR_INVALID_SHORTCUTS"           : "Estes atalhos são inválidos: {0}",
    "ERROR_NONEXISTENT_COMMANDS"        : "Você está atribuindo atalhos para comandos não existentes: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Erro ao ler as preferências",
    "ERROR_PREFS_CORRUPT"               : "Seu arquivo de preferências não é um JSON válido. O arquivo será aberto para que você possa corrigir o formato. Você deverá reiniciar o {APP_NAME} para as alterações terem efeito.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Opa! O {APP_NAME} não funciona em navegadores ainda.",
    "ERROR_IN_BROWSER"                  : "O {APP_NAME} é criado em HTML, mas no momento ele é executado como um aplicativo de desktop para que você possa usá-lo para editar arquivos locais. Por favor, use o shell da aplicação do repositório <b>github.com/adobe/brackets-shell</b> para executar {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Erro ao indexar arquivos",
    "ERROR_MAX_FILES"                   : "Este projeto contém mais de 30.000 arquivos. Funcionalidades que operam em múltiplos arquivos podem ser desabilitadas ou se comportarem como se o projeto estivesse vazio. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>Leia mais sobre como trabalhar com grandes projetos</a>.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Erro ao abrir o navegador",
    "ERROR_CANT_FIND_CHROME"            : "O navegador Google Chrome não pôde ser encontrado. Por favor, verifique se ele está instalado.",
    "ERROR_LAUNCHING_BROWSER"           : "Ocorreu um erro ao iniciar o navegador. (erro {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Erro no Live Preview",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Conectando-se ao navegador",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Para que o Live Preview conecte-se, o Chrome deve ser reiniciado com a opção de depuração remota ativada.<br /><br />Gostaria de abrir o Chrome novamente e permitir a depuração remota?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Não foi possível carregar a página de Live Preview",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Abra um arquivo HTML para iniciar Live Preview.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Para iniciar um live preview com um arquivo server-side, é preciso especificar uma URL Base para este projeto.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Erro ao iniciar o servidor HTTP para os arquivos do desenvolvimento em tempo real. Por favor, tente novamente.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Bem-vindo à Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "O Live Preview conecta o {APP_NAME} ao seu navegador. Ele abre uma prévia do seu arquivo HTML no navegador e atualiza a visualização em tempo real, enquanto você edita o código.<br /><br />Nesta versão inicial do {APP_NAME}, o Live Preview só funciona com o <strong>Google Chrome</strong> e atualiza em tempo real enquanto você edita <strong>arquivos CSS</strong>. Alterações em arquivos HTML ou JavaScript são automaticamente recarregados ao salvar.<br /><br />(Você só verá esta mensagem uma vez.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Para mais informações, veja <a href='{0}' title='{0}'>Solucionando erros de conexão com Live Development</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Live Preview: Conectando\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Live Preview: Inicializando\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Desconectar Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Live Preview (salve o arquivo para recarregar)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Live Preview (atualização interrompida devido a erro de sintaxe)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "O Live Preview foi cancelado pois as ferramentas de desenvolvedor do navegador foram abertas",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "O Live Preview foi cancelado pois a página foi fechada no navegador",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "O Live Preview foi cancelado pois o navegador foi para uma página que não pertence a este projeto atual",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "O Live Preview foi cancelado por uma razão desconhecida ({0})",

    "SAVE_CLOSE_TITLE"                  : "Salvar alterações",
    "SAVE_CLOSE_MESSAGE"                : "Você quer salvar as alterações feitas no documento <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Você quer salvar as alterações feitas aos seguintes arquivos?",
    "EXT_MODIFIED_TITLE"                : "Alterações externas",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Confirmar exclusão",
    "CONFIRM_FOLDER_DELETE"             : "Tem certeza que deseja excluir a pasta <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Arquivo excluído",
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> foi modificado no disco.<br /><br />Deseja salvar o arquivo e sobrescrever essas alterações?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> foi modificado no disco, mas também tem alterações não salvas em {APP_NAME}.<br /><br />Qual versão você quer manter?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> foi excluído no disco, mas tem alterações não salvas em {APP_NAME}.<br /><br />Deseja manter suas alterações?",

    // Generic dialog/button labels
    "DONE"                              : "Concluído",
    "OK"                                : "OK",
    "CANCEL"                            : "Cancelar",
    "DONT_SAVE"                         : "Não salvar",
    "SAVE"                              : "Salvar",
    "SAVE_AS"                           : "Salvar como\u2026",
    "SAVE_AND_OVERWRITE"                : "Sobrescrever",
    "DELETE"                            : "Excluir",
    "BUTTON_YES"                        : "Sim",
    "BUTTON_NO"                         : "Não",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                  : "{0} de {1}",
    "FIND_NO_RESULTS"                   : "Nenhum resultado",
    "FIND_QUERY_PLACEHOLDER"            : "Localizar\u2026",
    "REPLACE_PLACEHOLDER"               : "Substituir por\u2026",
    "BUTTON_REPLACE_ALL"                : "Tudo\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Substituir\u2026",
    "BUTTON_REPLACE"                    : "Substituir",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Resultado seguinte",
    "BUTTON_PREV_HINT"                  : "Resultado anterior",
    "BUTTON_CASESENSITIVE_HINT"         : "Diferenciar maiúsculas/minúsculas",
    "BUTTON_REGEXP_HINT"                : "Expressão regular",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Substituir sem desfazer",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Porque mais de {0} arquivos precisam ser alterados, {APP_NAME} irá modificar arquivos não abertos no disco.<br />Não será possível desfazer as modificações nestes arquivos.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Substituir sem desfazer",

    "OPEN_FILE"                         : "Abrir arquivo",
    "SAVE_FILE_AS"                      : "Salvar arquivo",
    "CHOOSE_FOLDER"                     : "Escolha uma pasta",

    "RELEASE_NOTES"                     : "Notas da versão",
    "NO_UPDATE_TITLE"                   : "Você está atualizado!",
    "NO_UPDATE_MESSAGE"                 : "Você está executando a versão mais recente do {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Substituir",
    "FIND_REPLACE_TITLE_WITH"           : "por",
    "FIND_TITLE_LABEL"                  : "Encontrados",
    "FIND_TITLE_SUMMARY"                : "&mdash; {0} {1} {2} em {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "em <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "no projeto",
    "FIND_IN_FILES_ZERO_FILES"          : "Filtro exclui todos os arquivos {0}",
    "FIND_IN_FILES_FILE"                : "arquivo",
    "FIND_IN_FILES_FILES"               : "arquivos",
    "FIND_IN_FILES_MATCH"               : "resultado",
    "FIND_IN_FILES_MATCHES"             : "resultados",
    "FIND_IN_FILES_MORE_THAN"           : "Mais de ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Ctrl/Cmd + clique para expandir/comprimir tudo",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Erro na substituição",
    "REPLACE_IN_FILES_ERRORS"           : "Os seguintes arquivos não foram modificados porque eles foram alterados antes da busca ou não puderam ser escritos.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Erro ao receber informações de atualização",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Houve um problema ao obter informações sobre a última atualização do servidor. Por favor, certifique-se de estar conectado à Internet e tente novamente.",
    
    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Adicionar filtro\u2026",
    "CLEAR_FILE_FILTER"                 : "Limpar filtro de arquivos",
    "NO_FILE_FILTER"                    : "Nenhum filtro de arquivos",
    "EXCLUDE_FILE_FILTER"               : "Excetua {0}",
    "EDIT_FILE_FILTER"                  : "Editar\u2026",
    "FILE_FILTER_DIALOG"                : "Editar filtro",
    "FILE_FILTER_INSTRUCTIONS"          : "Exclui dos resultados os arquivos e pastas que correspondam a qualquer das strings, substrings ou <a href='{0}' title='{0}'>wildcards</a> abaixo. Insira cada string em uma linha separada.",
    "FILTER_NAME_PLACEHOLDER"           : "Nome desta configuração de filtro (opcional)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "e outros {0}",
    "FILTER_COUNTING_FILES"             : "Contando arquivos\u2026",
    "FILTER_FILE_COUNT"                 : "Permite {0} de {1} arquivos {2}",
    "FILTER_FILE_COUNT_ALL"             : "Permite todos os {0} arquivos {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Quick Edit não disponível para posição atual do cursor",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "Quick Edit CSS: posicione o cursor no nome de uma única classe",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "Quick Edit CSS: atributo class incompleto",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "Quick Edit CSS: atributo id incompleto",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "Quick Edit CSS: posicione cursor em tag, class ou id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "Quick Edit Função Timing de CSS: sintaxe inválida",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "Quick Edit JS: posicione cursor no nome de uma função",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Quick Docs não disponível para a posição atual do cursor",
    
    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Carregando\u2026",
    "UNTITLED"          : "Sem título",
    "WORKING_FILES"     : "Arquivos abertos",

    /**
     * MainViewManager
     */
    "TOP"               : "Início",
    "BOTTOM"            : "Fim",
    "LEFT"              : "Esquerda",
    "RIGHT"             : "Direita",

    "CMD_SPLITVIEW_NONE"        : "Sem divisão",
    "CMD_SPLITVIEW_VERTICAL"    : "Divisão vertical",
    "CMD_SPLITVIEW_HORIZONTAL"  : "Divisão horizontal",
    "SPLITVIEW_MENU_TOOLTIP"    : "Divida o editor verticalmente ou horizontalmente",
    "GEAR_MENU_TOOLTIP"         : "Configurar conjunto de trabalho",

    "SPLITVIEW_INFO_TITLE"              : "Já está aberto",
    "SPLITVIEW_MULTIPANE_WARNING"       : "O arquivo já está aberto em outro painel. {APP_NAME} em breve irá suportar a abertura de um mesmo arquivo em mais de um painel. Até lá, o arquivo será mostrado no painel onde já está aberto.<br /><br />(Você irá ver esta mensagem apenas uma vez.)",

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
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} seleções",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Clique para alterar a indentação para espaços",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Clique para alterar a indentação para tabulação",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Clique para alterar o número de espaços usados ao indentar",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Clique para alterar a largura do caractere de tabulação",
    "STATUSBAR_SPACES"                      : "Espaços:",
    "STATUSBAR_TAB_SIZE"                    : "Tamanho da tabulação:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} linha",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} linhas",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Extensões desativadas",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Clique para alternar o cursor entre os modos Insert (INS) e Overwrite (OVR)",
    "STATUSBAR_LANG_TOOLTIP"                : "Clique para alterar o tipo de arquivo",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Clique para abrir/fechar o painel de relatórios.",
    "STATUSBAR_DEFAULT_LANG"                : "(padrão)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Definir como padrão para arquivos .{0}.",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "Problemas de {0}",
    "SINGLE_ERROR"                          : "Um problema de {0}",
    "MULTIPLE_ERRORS"                       : "{1} problemas de {0}",
    "NO_ERRORS"                             : "Nenhum problema de {0} encontrado - bom trabalho!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Nenhum problema encontrado - bom trabalho!",
    "LINT_DISABLED"                         : "A análise de código está desativada",
    "NO_LINT_AVAILABLE"                     : "Nenhum analisador de código disponível para {0}",
    "NOTHING_TO_LINT"                       : "Nada para analisar",
    "LINTER_TIMED_OUT"                      : "{0} expirou após esperar durante {1} ms",
    "LINTER_FAILED"                         : "{0} terminou com o erro: {1}",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Arquivo",
    "CMD_FILE_NEW_UNTITLED"               : "Novo",
    "CMD_FILE_NEW"                        : "Novo arquivo",
    "CMD_FILE_NEW_FOLDER"                 : "Nova pasta",
    "CMD_FILE_OPEN"                       : "Abrir\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Adicionar ao conjunto de trabalho",
    "CMD_OPEN_DROPPED_FILES"              : "Abrir arquivos largados",
    "CMD_OPEN_FOLDER"                     : "Abrir pasta\u2026",
    "CMD_FILE_CLOSE"                      : "Fechar",
    "CMD_FILE_CLOSE_ALL"                  : "Fechar todos",
    "CMD_FILE_CLOSE_LIST"                 : "Fechar lista",
    "CMD_FILE_CLOSE_OTHERS"               : "Fechar outros",
    "CMD_FILE_CLOSE_ABOVE"                : "Fechar outros acima",
    "CMD_FILE_CLOSE_BELOW"                : "Fechar outros abaixo",
    "CMD_FILE_SAVE"                       : "Salvar",
    "CMD_FILE_SAVE_ALL"                   : "Salvar todos",
    "CMD_FILE_SAVE_AS"                    : "Salvar como\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Live Preview",
    "CMD_RELOAD_LIVE_PREVIEW"             : "Forçar recarregamento do Live Preview",
    "CMD_PROJECT_SETTINGS"                : "Configurações do projeto\u2026",
    "CMD_FILE_RENAME"                     : "Renomear",
    "CMD_FILE_DELETE"                     : "Excluir",
    "CMD_INSTALL_EXTENSION"               : "Instalar extensão\u2026",
    "CMD_EXTENSION_MANAGER"               : "Gerenciador de extensões\u2026",
    "CMD_FILE_REFRESH"                    : "Atualizar árvore de arquivos",
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
    "CMD_SPLIT_SEL_INTO_LINES"            : "Dividir seleção em linhas",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Adicionar cursor à linha seguinte",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Adicionar cursor à linha anterior",
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

    // Search menu commands
    "FIND_MENU"                           : "Localizar",
    "CMD_FIND"                            : "Localizar",
    "CMD_FIND_NEXT"                       : "Localizar próximo",
    "CMD_FIND_PREVIOUS"                   : "Localizar anterior",
    "CMD_FIND_ALL_AND_SELECT"             : "Localizar tudo e selecionar",
    "CMD_ADD_NEXT_MATCH"                  : "Adicionar próximo resultado à seleção",
    "CMD_SKIP_CURRENT_MATCH"              : "Pular e adicionar próximo resultado",
    "CMD_FIND_IN_FILES"                   : "Localizar em arquivos",
    "CMD_FIND_IN_SELECTED"                : "Localizar no arquivo/diretório selecionado",
    "CMD_FIND_IN_SUBTREE"                 : "Localizar em\u2026",
    "CMD_REPLACE"                         : "Substituir",
    "CMD_REPLACE_IN_FILES"                : "Substituir em arquivos",
    "CMD_REPLACE_IN_SELECTED"             : "Substituir no arquivo/diretório selecionado",
    "CMD_REPLACE_IN_SUBTREE"              : "Substituir em\u2026",

    // View menu commands
    "VIEW_MENU"                           : "Visualizar",
    "CMD_HIDE_SIDEBAR"                    : "Esconder barra lateral",
    "CMD_SHOW_SIDEBAR"                    : "Mostrar barra lateral",
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
    "CMD_THEMES"                          : "Temas\u2026",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Navegar",
    "CMD_QUICK_OPEN"                      : "Abertura rápida",
    "CMD_GOTO_LINE"                       : "Ir para linha",
    "CMD_GOTO_DEFINITION"                 : "Encontrar definição",
    "CMD_GOTO_FIRST_PROBLEM"              : "Ir ao primeiro erro/aviso",
    "CMD_TOGGLE_QUICK_EDIT"               : "Edição rápida",
    "CMD_TOGGLE_QUICK_DOCS"               : "Documentação rápida",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Resultado anterior",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Resultado seguinte",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Nova regra",
    "CMD_NEXT_DOC"                        : "Documento seguinte",
    "CMD_PREV_DOC"                        : "Documento anterior",
    "CMD_SHOW_IN_TREE"                    : "Mostrar na árvore de arquivos",
    "CMD_SHOW_IN_EXPLORER"                : "Mostrar no Explorer",
    "CMD_SHOW_IN_FINDER"                  : "Mostrar no Finder",
    "CMD_SHOW_IN_OS"                      : "Mostrar no sistema operacional",

    // Help menu commands
    "HELP_MENU"                           : "Ajuda",
    "CMD_CHECK_FOR_UPDATE"                : "Verificar atualizações",
    "CMD_HOW_TO_USE_BRACKETS"             : "Como usar o {APP_NAME}",
    "CMD_SUPPORT"                         : "Ajuda do {APP_NAME}",
    "CMD_SUGGEST"                         : "Sugira um recurso",
    "CMD_RELEASE_NOTES"                   : "Notas da versão",
    "CMD_GET_INVOLVED"                    : "Envolva-se",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Mostrar pasta de extensões",
    "CMD_HOMEPAGE"                        : "Página do {APP_TITLE}",
    "CMD_TWITTER"                         : "{TWITTER_NAME} no Twitter",
    "CMD_ABOUT"                           : "Sobre o {APP_TITLE}",
    "CMD_OPEN_PREFERENCES"                : "Abrir arquivo de configurações",
    "CMD_OPEN_KEYMAP"                     : "Abrir mapa de teclas do usuário",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "versão experimental",
    "DEVELOPMENT_BUILD"                    : "versão de desenvolvimento",
    "RELOAD_FROM_DISK"                     : "Recarregar do disco",
    "KEEP_CHANGES_IN_EDITOR"               : "Manter alterações no editor",
    "CLOSE_DONT_SAVE"                      : "Fechar (não salvar)",
    "RELAUNCH_CHROME"                      : "Abrir Chrome novamente",
    "ABOUT"                                : "Sobre",
    "CLOSE"                                : "Fechar",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "timestamp da versão: ",
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
    "PROJECT_SETTING_BASE_URL_HINT"        : "Para usar um servidor local, insira uma URL como http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "O protocolo {0} não é suportado pelo Live Preview&mdash;por favor, use http: ou https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "A URL base não pode conter parâmetros de busca como \"{0}\".",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "A URL base não pode conter hashes como \"{0}\".",
    "BASEURL_ERROR_INVALID_CHAR"           : "Caracteres especiais como '{0}' devem ser codificados para URL encoding.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Erro desconhecido ao parsear URL base",
    "EMPTY_VIEW_HEADER"                    : "<em>Abra um arquivo enquanto este painel possui o foco</em>",
    
    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Tema atual",
    "USE_THEME_SCROLLBARS"                 : "Usar barra de rolagens do tema",
    "FONT_SIZE"                            : "Tamanho da fonte",
    "FONT_FAMILY"                          : "Família da fonte",
    "THEMES_SETTINGS"                      : "Configurações de temas",
    
    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Nova regra",
    
    // Extension Management strings
    "INSTALL"                              : "Instalar",
    "UPDATE"                               : "Atualizar",
    "REMOVE"                               : "Remover",
    "OVERWRITE"                            : "Sobrescrever",
    "CANT_REMOVE_DEV"                      : "Extensões na pasta \"dev\" devem ser excluídas manualmente.",
    "CANT_UPDATE"                          : "A atualização não é compatível com esta versão do {APP_NAME}.",
    "CANT_UPDATE_DEV"                      : "Extensões na pasta \"dev\" não podem ser atualizadas automaticamente.",
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
    "VIEW_COMPLETE_DESCRIPTION"            : "Ver descrição completa",
    "VIEW_TRUNCATED_DESCRIPTION"           : "Ver descrição reduzida",
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
    "INSTALL_EXTENSION_DRAG"               : "Arraste o .zip aqui ou",
    "INSTALL_EXTENSION_DROP"               : "Solte o .zip aqui ou",
    "INSTALL_EXTENSION_DROP_ERROR"         : "Instalação/atualização cancelada devido aos seguintes erros:",
    "INSTALL_FROM_URL"                     : "Instalar a partir de URL\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "Validando\u2026",
    "EXTENSION_AUTHOR"                     : "Autor",
    "EXTENSION_DATE"                       : "Data",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Esta extensão requer uma versão mais recente do {APP_NAME}.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Esta extensão atualmente só funciona com versões mais antigas do {APP_NAME}.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "A versão {0} desta extensão exige uma versão mais recente do {APP_NAME}. Mas você pode instalar a versão {1} mais antiga.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "A versão {0} desta extensão funciona apenas com versões mais antigas do {APP_NAME}. Mas você pode instalar a versão {1} mais recente.",
    "EXTENSION_NO_DESCRIPTION"             : "Sem descrição",
    "EXTENSION_MORE_INFO"                  : "Mais informações...",
    "EXTENSION_ERROR"                      : "Erro na extensão",
    "EXTENSION_KEYWORDS"                   : "Palavras-chave",
    "EXTENSION_TRANSLATED_USER_LANG"       : "Traduzido para {0} idiomas, incluindo o seu",
    "EXTENSION_TRANSLATED_GENERAL"         : "Traduzido para {0} idiomas",
    "EXTENSION_TRANSLATED_LANGS"           : "Essa extensão foi traduzida para os seguintes idiomas: {0}",
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
    "CHANGE_AND_RELOAD_TITLE"              : "Alterar extensões",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Para atualizar ou remover as extensões marcadas, o {APP_NAME} precisa ser recarregado. Você será solicitado a salvar suas alterações.",
    "REMOVE_AND_RELOAD"                    : "Remover extensões e recarregar",
    "CHANGE_AND_RELOAD"                    : "Alterar extensões e recarregar",
    "UPDATE_AND_RELOAD"                    : "Atualizar extensões e recarregar",
    "PROCESSING_EXTENSIONS"                : "Processando alterações nas extensões\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Não foi possível remover a extensão {0} porque ela não estava instalada.",
    "NO_EXTENSIONS"                        : "Nenhuma extensão instalada ainda.<br>Clique na aba Disponíveis acima para começar.",
    "NO_EXTENSION_MATCHES"                 : "Nenhuma extensão corresponde à sua pesquisa.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "NOTA: Estas extensões podem vir de diferentes autores e não do próprio {APP_NAME}. Extensões não são revisadas e tem prilégios locais totais. Tenha cuidado ao instalar extensões de fontes desconhecidas.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Instaladas",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Disponíveis",
    "EXTENSIONS_THEMES_TITLE"              : "Temas",
    "EXTENSIONS_UPDATES_TITLE"             : "Atualizações",
    
    "INLINE_EDITOR_NO_MATCHES"             : "Nenhum resultado.",
    "INLINE_EDITOR_HIDDEN_MATCHES"         : "Todas as correspondências foram ocultadas. Expanda os arquivos listados na direita para ver os resultados.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Nenhuma regra CSS corresponde à sua seleção.<br> Clique em \"Nova regra\" para criar uma.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Seu projeto não tem uma folha de estilos.<br>Crie uma para adicionar regras CSS.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "maior",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pixels",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Depurar",
    "ERRORS"                                    : "Erros",
    "CMD_SHOW_DEV_TOOLS"                        : "Mostrar ferramentas do desenvolvedor",
    "CMD_REFRESH_WINDOW"                        : "Recarregar com extensões",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Recarregar sem extensões",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Nova janela do {APP_NAME}",
    "CMD_SWITCH_LANGUAGE"                       : "Alterar idioma\u2026",
    "CMD_RUN_UNIT_TESTS"                        : "Executar testes",
    "CMD_SHOW_PERF_DATA"                        : "Mostrar dados de desempenho",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Habilitar depurador do Node",
    "CMD_LOG_NODE_STATE"                        : "Registrar estado do Node no console",
    "CMD_RESTART_NODE"                          : "Reiniciar Node",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Mostrar erros na barra de status",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Abrir local do Brackets",
    
    "LANGUAGE_TITLE"                            : "Alterar idioma",
    "LANGUAGE_MESSAGE"                          : "Idioma:",
    "LANGUAGE_SUBMIT"                           : "Reiniciar {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Cancelar",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Padrão do sistema",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Tempo",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Progresso",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Move o ponto selecionado<br><kbd class='text'>Shift</kbd> Move dez unidades<br><kbd class='text'>Tab</kbd> Troca pontos",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Aumenta ou diminui passos<br><kbd>←</kbd><kbd>→</kbd> 'Start' ou 'End'",
    "INLINE_TIMING_EDITOR_INVALID"              : "O valor antigo <code>{0}</code> não é válido, então a função exibida foi alterada para <code>{1}</code>. O documento será atualizado com a primeira edição.",

    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Cor atual",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Cor original",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "Formato RGBa",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Formato Hex",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "Formato HSLa",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (usada {1} vez)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (usada {1} vezes)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Pular para definição",
    "CMD_SHOW_PARAMETER_HINT"                   : "Mostrar dicas de parâmetro",
    "NO_ARGUMENTS"                              : "<nenhum parâmetro>",
    "DETECTED_EXCLUSION_TITLE"                  : "Problema de inferência de arquivo JavaScript",
    "DETECTED_EXCLUSION_INFO"                   : "Brackets enfrentou um problema ao processar: <span class='dialog-filename'>{0}</span>.<br><br>Este arquivo não será mais processado para dicas de código, definições ou edição rápida. Para reverter, abra <code>.brackets.json</code> em seu projeto e edite <code>jscodehints.detectedExclusions</code>.<br><br>Este provavelmente é um bug do Brackets. Se você pode fornecer uma cópia deste arquivo, por favor <a href='https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue'>registre um bug</a> com um link para o arquivo mencionado aqui.",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Quick View ao passar o mouse",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Projetos Recentes",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Leia mais"
});
/* Last translated for 0b949dd02b87866d54f38631715a4353a8f927e5 */
