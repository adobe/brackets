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
    DESCRIPTION: "An interactive getting started guide for Brackets.",

    // BODY
    GETTING_STARTED: "PRIMEIROS PASSOS COM BRACKETS",
    GETTING_STARTED_GUIDE: "Este é o teu guia!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "FEITO COM <3 E JAVASCRIPT",
    WELCOME:
        "Bem vindo a esta pré-vizualização do Brackets, um novo editor open-source para a proxima geração web.\n" +
        "Somos grandes fãs de padrões e queremos construir uma melhor ferramenta para JavaScript, HTML e CSS e relacionadas\n" +
        "com tecnologias web abertas. Este é o nosso humilde começo.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "O QUE É O BRACKETS?",
    EDITOR: "Estás a olhar para uma versão antecipada of Brackets",
    EDITOR_DESCRIPTION:
        "Em muitas formas, Brackets é um tipo de editor diferente. Uma grande diferença é que este editor é escrito em JavaScript.\n" +
        "Embora o Brackets possa não estar pronto para o use dia-a-dia por enquanto, estamos a usa-lo todos os dias para construir o Brackets.",

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
    QUICK_EDIT: "Edição Rápida para CSS e JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Ao editar HTML, use as teclas de atalho <kbd>Cmd/Ctrl + E</kbd> para abrir um rapidamente o editor de linha que mostra todo o CSS relacionado.\n" +
        "Faça uma pequena alteração no seu CSS, pressione <kbd>ESC</kbd> e está de volta a editar HTML.\n" +
        "Ou simplesmente deixe as regras de CSS abertas e elas tornam-se parte do seu editor de HTML.\n" +
        "Se pressionar a tecla <kbd>ESC</kbd> fora do Editor Rápido, todas elas fecham. Sem mais trocas de ficheiros e perdar o fio à meada.",
    QUICK_EDIT_SAMP:
        "Queres ver isto em acção? Posiciona o teu cursor sobre a tag <!-- <samp> --> e pressiona\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Deves ver o Editor Rápido de CSS aparecer.\n" +
        "Na direita vais ver uma lista de regras CSS relacionadas com essa tag.\n" +
        "Simplesmente navegue pela list de regras com <kbd>Alt + Up/Down</kbd> para encontrar aquela que queres editar.",
    QUICK_EDIT_SCREENSHOT: "Um screenshot a mostrar a Edição Rápida de CSS",
    QUICK_EDIT_OTHERS:
        "You can use the same shortcut to edit other things as well - like functions in JavaScript,\n" +
        "colors, and animation timing functions - and we're adding more and more all the time.",
    QUICK_EDIT_NOTE:
        "For now inline editors cannot be nested, so you can only use Quick Edit while the cursor\n" +
        "is in a \"full size\" editor.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "LIVE PREVIEW",
    LIVE_PREVIEW: "Pré-Vizualizar mudança no CSS ao vivo no navegador",
    LIVE_PREVIEW_INTRO:
        "Sabes que a \"dança guardar/recarregar\" que fizemos por anos? Aquela que fazes uma mudança no editor,\n" +
        "pressionas guardar, mudas para o navegador e precionas recarregar para ver o resultado?\n" +
        "Com o Brackets, não precisas de fazer essa dança.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets abre uma <em>live connection</em> para o teu navegador e envia actualizações do CSS assim que escreves!\n" +
        "Probavelmente já fazias uma coisa parecida com ferramentas de navegador, mas com o Brackets\n" +
        "não é preciso copiar e colar o código CSS final de novo no editor. O teu código corre no navegador, e vive no teu editor!",
    LIVE_PREVIEW_HIGHLIGHT: "Live Highlight HTML elements and CSS rules",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets makes it easy to see how your changes in HTML and CSS will affect the page. When your cursor\n" +
        "is on a CSS rule, Brackets will highlight all affected elements in the browser. Similarly, when editing\n" +
        "an HTML file, Brackets will highlight the corresponding HTML elements in the browser.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Se tens o Google Chrome instalado, podes tentar isto por ti próprio. Clica no icone do relampago no canto superior direito\n" +
        "ou pressiona <kbd>Cmd/Ctrl + Alt + P</kbd>. Quando o Live Preview está ligado a um documento HTML,\n" +
        "todo o css ligado a ele pode ser editado em temo real.\n" +
        "O icone muda de cinzento para dourado quando o Brackets estabelece a ligação ao navegador.\n" +
        "\n" +
        "Agora, ponha o seu curso na tag <!-- <img> --> em cima (linha 56) e pressione <kbd>Cmd/Ctrl + E</kbd> Para abrir as regras CSS para aquela tag.\n" +
        "Tenta mudar o tamanho da borda de 10px par 20px ou muda a cor de fundo de \"transparent\"(nome da cor) para \"hotpink\"(nome da cor).\n" +
        "Se o Brackets e o teu navegador estão a correr lado-a-lado, vais ver que as mudanças são instantaneas no teu navegador.\n" +
        "Altamente, certo?",
    LIVE_PREVIEW_NOTE:
        "Hoje, o Brackets só suporta Live Preview para CSS. Estamos de momento a trabalhar no Live Preview para HTML e JavaScript.\n" +
        "Na versãp actual, não vai ver mudanças no seu ficheiro HTML até guardar o documento.\n" +
        "Live previews são só possiveis com Google Chrome. Nós queremos trazer esta funcionalidade para todos os navegadores mais conhecidos,\n" +
        "e estamos ansiosos por trabalhar com esses fornecedores.",

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
    GET_INVOLVED_COMMENT: "DEIXA-NOS SABER O QUE PENSAS",
    GET_INVOLVED: "Envolva-se",
    GET_INVOLVED_DESCRIPTION:
        "Brackets é um projeto open-source. Desenvolvedores Web de todo o mundo estão a contribuir para construir um melhor editor de código.\n" +
        "Diz-nos o que pensas, partilha as tuas ideias or contribui diretamente para o projeto.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Brackets Blog da Equipa",
    URLNAME_BRACKETS_GITHUB: "Brackets no GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Brackets Extension Registry",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Brackets Lista de Mails Desenvolvedores",
    URLNAME_BRACKETS_TWITTER: "@Brackets no Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Fala com os desenvolvedores do Brackets no IRC em",
    BRACKETS_CHAT_FREENODE: "#brackets no Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});
