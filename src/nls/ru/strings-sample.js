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
    TITLE: "НАЧАЛО РАБОТЫ С BRACKETS",
    DESCRIPTION: "Интерактивное руководство по началу работы в Brackets.",

    // BODY
    GETTING_STARTED: "НАЧАЛО РАБОТЫ С BRACKETS",
    GETTING_STARTED_GUIDE: "Ваше личное руководство!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "СДЕЛАНО С <3 И JAVASCRIPT",
    WELCOME:
        "Добро пожаловать в раннюю версию Brackets, нового редактора с открытым исходным\n" +
        "кодом для веба следующего поколения. Мы большие фанаты стандартов и хотим построить лучший\n" +
        "инструмент для JavaScript, HTML и CSS и связанных с ними открытых веб-технологий. Это наше\n" +
        "скромное начало.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "ЧТО ТАКОЕ BRACKETS?",
    EDITOR: "Во многих отношениях, Brackets необычный редактор.",
    EDITOR_DESCRIPTION:
        "Одна примечательная особенность в том, что этот редактор написан на JavaScript,\n" +
        "HTML and CSS. Это означает, что большинство пользователей Brackets имеют навыки\n" +
        "необходимые для доработки и расширения редактора. На самом деле, мы используем Brackets\n" +
        "каждый день для того, чтобы улучшать Brackets. Он так же имеет несколько особенностей\n" +
        "вроде Быстрого Редактирования, Интерактивного Просмотра и других, которые вы не сможете\n" +
        "найти в других редакторах.\n" +
        "Читайте далее для того чтобы узнать, как использовать эти особенности редактора.",

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
    QUICK_EDIT_COMMENT: "ОТНОШЕНИЯ МЕЖДУ HTML, CSS И JAVASCRIPT",
    QUICK_EDIT: "Быстрое редактирование CSS и JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Теперь никакого переключения между документами и потери контекста. Во время редактирования HTML\n" +
        "используйте сочетание клавиш <kbd>Cmd/Ctrl + E</kbd> для открытия быстрого редактора, который показывает\n" +
        "все связанное с этой строкой CSS. Сделайте изменение CSS-стилей, нажмите <kbd>ESC</kbd> и вернитесь обратно\n" +
        "к редактированию HTML. Или просто оставьте блок с CSS-правилами открытым, и они станут частью вашего\n" +
        "HTML-редактора. Если вы нажмете <kbd>ESC</kbd> вне быстрого редактора, все CSS-правила закроются.",
    QUICK_EDIT_SAMP:
        "Хотите увидеть это в действии? Поставьте курсор на теге <!-- <samp> --> выше и нажмите\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Вы должны увидеть, как выше появится быстрый редактор CSS. Справа вы\n" +
        "увидите список CSS-правил, которые относятся к этому тегу. Просто прокрутите правила вниз, используя\n" +
        "<kbd>Alt + Up/Down</kbd>, чтобы найти то, которое вы хотите отредактировать.",
    QUICK_EDIT_SCREENSHOT: "A screenshot showing CSS Quick Edit",
    QUICK_EDIT_OTHERS:
        "Вы так же можете использовать эти горячие клавиши при работе с кодом JavaScript,\n" +
        "для того, чтобы увидеть содержание функции, просто наведите курсор на её название.",
    QUICK_EDIT_NOTE:
        "На данный момент внутри встроенного редактора нельзя открыть еще один, поэтому вы можете\n" +
        "использовать только Быстрое Редактирование, когда курсор находится в \"полноэкранном\" редакторе.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "ИНТЕРАКТИВНЫЙ ПРОСМОТР",
    LIVE_PREVIEW: "Просматривайте изменения CSS вживую в браузере!",
    LIVE_PREVIEW_INTRO:
        "Вы знаете эти пляски с \"сохранить/перезагрузить\", которые мы делаем годами? Когда вы делаете\n" +
        "изменения в вашем редакторе, нажимаете сохранить, переключаетесь в браузер и затем нажимаете\n" +
        "перезагрузить, чтобы наконец увидеть результат? Вместе с Brackets этого больше не придется делать.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets откроет <em>прямое соединение</em> с вашим локальным браузером и направит ваши изменения CSS, как\n" +
        "только вы их напечатаете! Вы, возможно, уже делали что-то подобное с инструментами, встроенными в браузер,\n" +
        "но с Brackets больше нет нужды копировать и вставлять финальный CSS обратно в редактор.\n" +
        "Ваш код запускается в браузере, но живет в вашем редакторе!",
    LIVE_PREVIEW_HIGHLIGHT: "Подсвечивание HTML-элементов и CSS-правил в реальном времени",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "С Brackets стало проще понять, как изменения в HTML и CSS отразятся на странице. Когда ваш курсор находится на\n" +
        "CSS-правиле, Brackets подсветит все затронутые элементы в браузере. То же самое и с редактированием HTML-файла,\n" +
        "Brackets будет подсвечивать соответсвующие HTML-элементы в браузере.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Если у вас есть установленный Google Chrome, вы можете попробовать это сами. Нажмите на иконку\n" +
        "молнии в правом верхнем углу или нажмите <kbd>Cmd/Ctrl + Alt + P</kbd>. Когда Интерактивный Просмотр\n" +
        "включен в HTML-документе, все подключенные CSS-документы могут редактироваться в реальном\n" +
        "времени. Иконка изменится с серой на золотую, когда Brackets установит соединение с вашим браузером.\n" +
        "\n" +
        "Теперь, поставьте курсор на теге <!-- <img> --> выше и используйте <kbd>Cmd/Ctrl + E</kbd>, чтобы\n" +
        "открыть записанные CSS-правила. Попробуйте изменить размер границы с 10 пикселя до 20 или изменить\n" +
        "цвет фона с \"transparent\" на \"hotpink\". Если Brackets и ваш браузер работают вместе, вы увидите, как ваши\n" +
        "изменения мгновенно отразятся в вашем браузере. Круто, правда?",
    LIVE_PREVIEW_NOTE:
        "Сегодня, Brackets поддерживает Интерактивный Просмотр только для CSS. Сейчас мы работаем над поддержкой\n" +
        "Интерактивного Просмотра для HTML и JavaScript. В текущей версии вы не увидите изменений в вашем HTML-\n" +
        "или JavaScript-файле до тех пор, пока не сохраните документ. Интерактивный Просмотр работает только с\n" +
        "Google Chrome. Но в будушем мы планируем добавить эту возможность для всех основных браузеров.",

    // QUICK VIEW
    QUICK_VIEW: "Быстрый просмотр",
    QUICK_VIEW_DESCRIPTION:
        "Для тех из нас, кто до сих пор не запомнил значения цветов для HEX или RGB, Brackets позволяет быстро и просто\n" +
        "посмотреть напрямую, какой цвет используется. В любом CSS- или HTML-файле, просто наведите курсор на значение\n" +
        "цвета или градиента и Brackets автоматически отобразит этот цвет/градиент. То же самое и с изображениями:\n" +
        "просто наведите курсор на ссылку с изображением в редакторе и Brackets выведет миниатюру этого изображения.",
    QUICK_VIEW_SAMP:
        "Попробуйте быстрый просмотр сами, поместите курсор на тэг <!-- <body> --> вверху этого документа и нажмите\n" +
        "<kbd>Cmd/Ctrl + E</kbd> для того, чтобы открыть быстрый редактор CSS. Сейчас просто наведите курсор на любое\n" +
        "значение цвета в CSS. Вы так же можете увидеть это в действии с градиентом, открыв быстрый редактор CSS на\n" +
        "тэге <!-- <html> --> и наведя курсор на любое значение фонового рисунка. Попробуйте быстрый просмотр изображений,\n" +
        "поместите ваш курсор на любой скриншот в этом документе.",

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
    GET_INVOLVED_COMMENT: "РАССКАЖИТЕ, ЧТО ВЫ ДУМАЕТЕ",
    GET_INVOLVED: "Принимайте участие",
    GET_INVOLVED_DESCRIPTION:
        "Brackets &mdash; проект с открытым исходным кодом. Веб-разработчики со всех уголков мира способствуют\n" +
        "созданию лучшего редактора кода. Многие разрабатывают дополнения, которые расширяют возможности\n" +
        "Brackets. Расскажите нам, что вы думаете, поделитесь идеями или непосредственно поддержите проект.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Блог команды Brackets",
    URLNAME_BRACKETS_GITHUB: "Brackets на GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Brackets Extension Registry",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Почтовая рассылка разработчиков Brackets",
    URLNAME_BRACKETS_TWITTER: "@Brackets в Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Общайтесь с разработчиками Brackets в IRC в",
    BRACKETS_CHAT_FREENODE: "#brackets на Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});
