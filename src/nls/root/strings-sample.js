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
    TITLE: "GETTING STARTED WITH BRACKETS",
    DESCRIPTION: "An interactive getting started guide for Brackets.",

    // BODY
    GETTING_STARTED: "GETTING STARTED WITH BRACKETS",
    GETTING_STARTED_GUIDE: "This is your guide!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "MADE WITH <3 AND JAVASCRIPT",
    WELCOME:
        "Welcome to Brackets, a modern open-source code editor that understands web design. It's a lightweight,\n" +
        "yet powerful, code editor that blends visual tools into the editor so you get the right amount of help\n" +
        "when you want it.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "WHAT IS BRACKETS?",
    EDITOR: "Brackets is a different type of editor.",
    EDITOR_DESCRIPTION:
        "Brackets has some unique features like Quick Edit, Live Preview and others that you may not find in other\n" +
        "editors. And Brackets is written in JavaScript, HTML and CSS. That means that most of you using Brackets\n" +
        "have the skills necessary to modify and extend the editor. In fact, we use Brackets every day to build\n" +
        "Brackets. To learn more about how to use the key features, read on.",

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
    QUICK_EDIT_COMMENT: "THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT",
    QUICK_EDIT: "Quick Edit for CSS and JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "No more switching between documents and losing your context. When editing HTML, use the\n" +
        "<kbd>Cmd/Ctrl + E</kbd> shortcut to open a quick inline editor that displays all the related CSS.\n" +
        "Make a tweak to your CSS, hit <kbd>ESC</kbd> and you're back to editing HTML, or just leave the\n" +
        "CSS rules open and they'll become part of your HTML editor. If you hit <kbd>ESC</kbd> outside of\n" +
        "a quick inline editor, they'll all collapse. Quick Edit will also find rules defined in LESS and\n" +
        "SCSS files, including nested rules.",
    QUICK_EDIT_SAMP:
        "Want to see it in action? Place your cursor on the <!-- <samp> --> tag above and press\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. You should see a CSS quick editor appear above, showing the CSS rule that\n" +
        "applies to it. Quick Edit works in class and id attributes as well. You can use it with your\n" +
        "LESS and SCSS files also.\n" +
        "\n" +
        "You can create new rules the same way. Click in one of the <!-- <p> --> tags above and press\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. There are no rules for it right now, but you can click the New Rule\n" +
        "button to add a new rule for <!-- <p> -->.",
    QUICK_EDIT_SCREENSHOT: "A screenshot showing CSS Quick Edit",
    QUICK_EDIT_OTHERS:
        "You can use the same shortcut to edit other things as well - like functions in JavaScript,\n" +
        "colors, and animation timing functions - and we're adding more and more all the time.",
    QUICK_EDIT_NOTE:
        "For now inline editors cannot be nested, so you can only use Quick Edit while the cursor\n" +
        "is in a \"full size\" editor.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "LIVE PREVIEW",
    LIVE_PREVIEW: "Preview HTML and CSS changes live in the browser",
    LIVE_PREVIEW_INTRO:
        "You know that \"save/reload dance\" we've been doing for years? The one where you make changes in\n" +
        "your editor, hit save, switch to the browser and then refresh to finally see the result?\n" +
        "With Brackets, you don't have to do that dance.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets will open a <em>live connection</em> to your local browser and push HTML and CSS updates as you\n" +
        "type! You might already be doing something like this today with browser-based tools, but with Brackets\n" +
        "there is no need to copy and paste the final code back into the editor. Your code runs in the\n" +
        "browser, but lives in your editor!",
    LIVE_PREVIEW_HIGHLIGHT: "Live Highlight HTML elements and CSS rules",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets makes it easy to see how your changes in HTML and CSS will affect the page. When your cursor\n" +
        "is on a CSS rule, Brackets will highlight all affected elements in the browser. Similarly, when editing\n" +
        "an HTML file, Brackets will highlight the corresponding HTML elements in the browser.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "If you have Google Chrome installed, you can try this out yourself. Click on the lightning bolt\n" +
        "icon in the top right corner of your Brackets window or hit <kbd>Cmd/Ctrl + Alt + P</kbd>. When\n" +
        "Live Preview is enabled on an HTML document, all linked CSS documents can be edited in real-time.\n" +
        "The icon will change from gray to gold when Brackets establishes a connection to your browser.\n" +
        "\n" +
        "Now, place your cursor on the <!-- <img> --> tag above. Notice the blue highlight that appears\n" +
        "around the image in Chrome. Next, use <kbd>Cmd/Ctrl + E</kbd> to open up the defined CSS rules.\n" +
        "Try changing the size of the border from 10px to 20px or change the background\n" +
        "color from \"transparent\" to \"hotpink\". If you have Brackets and your browser running side-by-side, you\n" +
        "will see your changes instantly reflected in your browser. Cool, right?",
    LIVE_PREVIEW_NOTE:
        "Today, Brackets only supports Live Preview for HTML and CSS. However, in the current version, changes to\n" +
        "JavaScript files are automatically reloaded when you save. We are currently working on Live Preview\n" +
        "support for JavaScript. Live previews are also only possible with Google Chrome, but we hope\n" +
        "to bring this functionality to all major browsers in the future.",

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
    GET_INVOLVED_COMMENT: "LET US KNOW WHAT YOU THINK",
    GET_INVOLVED: "Get involved",
    GET_INVOLVED_DESCRIPTION:
        "Brackets is an open-source project. Web developers from around the world are contributing to build\n" +
        "a better code editor. Many more are building extensions that expand the capabilities of Brackets.\n" +
        "Let us know what you think, share your ideas or contribute directly to the project.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Brackets Team Blog",
    URLNAME_BRACKETS_GITHUB: "Brackets on GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Brackets Extension Registry",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Brackets Developer Mailing List",
    URLNAME_BRACKETS_TWITTER: "@brackets on Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Chat with Brackets developers on IRC in",
    BRACKETS_CHAT_FREENODE: "#brackets on Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});
