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
    // HEAD
    TITLE: "PRIMEIROS PASSOS COM BRACKETS",
    DESCRIPTION: "Um guia interativo de primeiros passos para Brackets.",

    // BODY
    GETTING_STARTED: "PRIMEIROS PASSOS COM BRACKETS",
    GETTING_STARTED_GUIDE: "Este é o seu guia!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "MADE WITH <3 AND JAVASCRIPT",
    WELCOME:
        "Bem-vindo a uma superprecoce pré-visualização de Brackets, um novo editor open-source para a próxima geração da web. Nós somos grandes fãs dos padrões e queremos construir melhores ferramentas para JavaScript, HTML e CSS\n" +
        "e relacionadas tecnologias abertas da web. Este é o nosso humilde começo.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "O QUE É BRACKETS?",
    EDITOR: "Você está olhando para uma versão precoce de Brackets.",
    EDITOR_DESCRIPTION:
        "De muitas maneiras, Brackets é um tipo diferente de editor. Uma diferença notável é que este editor é escrito em JavaScript. Assim, enquanto Brackets poderia não estar pronto para seu uso no dia-a-dia ainda, estamos usando-o todos os dias para criar Brackets.",

    // GET STARTED WITH YOUR OWN FILES
    PROJECTS_COMMENT: "GET STARTED WITH YOUR OWN FILES",
    PROJECTS: "Projects in Brackets",
    PROJECTS_DESCRIPTION:
        "In order to edit your own code using Brackets, you can just open the folder containing your files.\n" +
        "Brackets treats the currently open folder as a \"project\"; features like Code Hints, Live Preview and\n" +
        "Quick Edit only use files within the currently open folder.",
    PROJECTS_SAMP:
        "Once you're ready to get out of this sample project and edit your own code, you can use the dropdown\n" +
        "in the left sidebar to switch folders. Right now, the dropdown says \"Getting Started\" - that's the\n" +
        "folder containing the file you're looking at right now. Click on the dropdown and choose \"Open Folder…\"\n" +
        "to open your own folder.\n" +
        "You can also use the dropdown later to switch back to folders you've opened previously, including this\n" +
        "sample project.",

    // THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT
    QUICK_EDIT_COMMENT: "A RELAÇÃO ENTRE HTML, CSS E JAVASCRIPT",
    QUICK_EDIT: "Edição Rápida de CSS e JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Ao editar HTML, use o atalho <kbd>Cmd/Ctrl + E</kbd> para abrir um editor rápido embutido que exibe todos os CSS relacionados. Faça um ajuste ao seu CSS, pressione <kbd>ESC</kbd> e você estará de volta editando HTML. Ou simplesmente deixe as regras CSS abertas e elas se tornarão parte de seu editor HTML.\n" +
        "Se você pressionar <kbd>ESC</kbd> fora de um editor rápido, todos eles vão recolher. Sem mais comutação entre documentos perdendo seu contexto.",
    QUICK_EDIT_SAMP:
        "Quer vê-lo em ação? Coloque o cursor sobre o tag <!-- <samp> --> acima e pressione <kbd>Cmd/Ctrl + E</kbd>. Você deverá ver um editor rápido de CSS aparecer acima. À direita, você verá uma lista de regras CSS que estão relacionadas com esta tag.Simplesmente role as regras com <kbd>Alt + Up/Down</kbd> para encontrar o que deseja editar.",
    QUICK_EDIT_SCREENSHOT: "Um screenshot mostrando o editor rápido de CSS",
    QUICK_EDIT_OTHERS:
        "You can use the same shortcut to edit other things as well - like functions in JavaScript,\n" +
        "colors, and animation timing functions - and we're adding more and more all the time.",
    QUICK_EDIT_NOTE:
        "For now inline editors cannot be nested, so you can only use Quick Edit while the cursor\n" +
        "is in a \"full size\" editor.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "VISUALIZAÇÃO AO VIVO (LIVE PREVIEW)",
    LIVE_PREVIEW: "Visualizar as alterações CSS ao vivo no navegador",
    LIVE_PREVIEW_INTRO:
        "Você sabe aquela \"dança salvar/recarregar\" que temos feito há anos? Aquela onde você faz mudanças no seu editor, clica em salvar, alterna para o navegador e então recarrega a pagina para finalmente ver o resultado Com Brackets, você não precisa fazer essa dança.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets vai abrir uma <em>conexão ao vivo</em> com o seu navegador local e vai empurrar atualizações CSS enquanto você digita! Você já deve estar fazendo alguma coisa como esta hoje com ferramentas baseadas em navegador, mas com Brackets\n" +
        "não há necessidade de copiar e colar o CSS final de volta para o editor. Seu código é executado no navegador, mas vive em seu editor!",
    LIVE_PREVIEW_HIGHLIGHT: "Live Highlight HTML elements and CSS rules",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets makes it easy to see how your changes in HTML and CSS will affect the page. When your cursor\n" +
        "is on a CSS rule, Brackets will highlight all affected elements in the browser. Similarly, when editing\n" +
        "an HTML file, Brackets will highlight the corresponding HTML elements in the browser.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Se você tem o Google Chrome instalado, você pode tentar fazer isso sozinho. Clique no ícone em forma de raio no canto superior direito ou pressione <kbd>Cmd/Ctrl + Alt + P</kbd>. Quando a Visualização ao Vivo (Live Preview) é habilitada em um documento HTML, todos os documentos CSS vinculados podem ser editados em tempo real. O ícone vai mudar de cinza para ouro quando Brackets estabelecer uma conexão com o seu navegador.\n" +
        "\n" +
        "Agora, coloque o cursor sobre o tag <!-- <img> --> acima e use <kbd>Cmd/Ctrl + E</kbd> para abrir as regras CSS definidas. Tente mudar o tamanho da borda de 10px para 20px ou alterar a cor de fundo de \"transparent\" para \"hotpink\". Se você tem Brackets e seu navegador rodando lado a lado, você vai ver as alterações refletidas instantaneamente no seu navegador. Legal, certo?",
    LIVE_PREVIEW_NOTE:
        "Atualmente, Brackets suporta Visualização ao Vivo (Live Preview) apenas para CSS. Iremos adicionar suporte à Visualização ao Vivo (Live Preview) para HTML e JavaScript em uma versão futura. Visualizações ao vivo atualmente só são possíveis com Google Chrome. Nós queremos trazer esta funcionalidade para todos os principais navegadores, e estamos ansiosos para trabalhar com os fornecedores.",

    // QUICK VIEW
    QUICK_VIEW: "Quick View",
    QUICK_VIEW_DESCRIPTION:
        "For those of us who haven't yet memorized the color equivalents for HEX or RGB values, Brackets makes\n" +
        "it quick and easy to see exactly what color is being used. In either CSS or HTML, simply hover over any\n" +
        "color value or gradient and Brackets will display a preview of that color/gradient automatically. The\n" +
        "same goes for images: simply hover over the image link in the Brackets editor and it will display a\n" +
        "thumbnail preview of that image.",
    QUICK_VIEW_SAMP:
        "To try out Quick View for yourself, place your cursor on the <!-- <body> --> tag at the top of this\n" +
        "document and press <kbd>Cmd/Ctrl + E</kbd> to open a CSS quick editor. Now simply hover over any of the\n" +
        "color values within the CSS. You can also see it in action on gradients by opening a CSS quick editor\n" +
        "on the <!-- <html> --> tag and hovering over any of the background image values. To try out the image\n" +
        "preview, place your cursor over the screenshot image included earlier in this document.",

    // EXTENSIONS
    EXTENSIONS: "Need something else? Try an extension!",
    EXTENSIONS_DESCRIPTION:
        "In addition to all the goodness that's built into Brackets, our large and growing community of\n" +
        "extension developers has built hundreds of extensions that add useful functionality. If there's\n" +
        "something you need that Brackets doesn't offer, more than likely someone has built an extension for\n" +
        "it. To browse or search the list of available extensions, choose <strong>File > Extension\n" +
        "Manager…</strong> and click on the \"Available\" tab. When you find an extension you want, just click\n" +
        "the \"Install\" button next to it.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "DEIXE-NOS CONHECER O QUE VOCÊ PENSA",
    GET_INVOLVED: "Envolva-se",
    GET_INVOLVED_DESCRIPTION:
        "Brackets é um projeto open-source. Desenvolvedores web de todo o mundo estão a contribuir para criar um editor de código melhor. Diga-nos o que você pensa, partilhe as suas ideias ou contribua diretamente para o projeto.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Blog da Equipe Brackets",
    URLNAME_BRACKETS_GITHUB: "Brackets no GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Brackets Extension Registry",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Mailing List Desenvolvedores Brackets",
    URLNAME_BRACKETS_TWITTER: "@Brackets no Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Fale com os desenvolvedores no canal IRC",
    BRACKETS_CHAT_FREENODE: "#brackets no Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});

