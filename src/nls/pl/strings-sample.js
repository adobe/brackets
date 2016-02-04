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
    TITLE: "SZYBKI START Z BRACKETS",
    DESCRIPTION: "Interaktywny poradnik szybkiego startu dla Brackets.",

    // BODY
    GETTING_STARTED: "SZYBKI START Z BRACKETS",
    GETTING_STARTED_GUIDE: "Oto Twój przewodnik!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "WYKONANO PRZY UŻYCIU <3 I JAVASCRIPTU",
    WELCOME:
        "Witaj we wczesnej wersji Brackets, edytorze open-source dla sieci nowej generacji. Jesteśmy\n" +
        "wielkimi fanami standardów i chcemy budować lepsze narzędzia dla takich języków jak JavaScript,\n" +
        "HTML i CSS oraz powiązanych z nimi technologii sieciowych. Taki był nasz skromny początek.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "CZYM JEST BRACKETS?",
    EDITOR: "Patrzysz na wczesną wersję Brackets.",
    EDITOR_DESCRIPTION:
        "Na wiele sposobów Brackets jest inny niż typowy edytor. Jedną z różnic jest to, że edytor ten\n" +
        "został napisany w języku JavaScript. Tak więc, mimo iż może on nie być jeszcze gotowy do\n" +
        "codziennego użytku, my używamy go codziennie, by budować Brackets.",

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
    QUICK_EDIT_COMMENT: "POWIĄZANIE POMIĘDZY HTML, CSS i JAVASCRIPT",
    QUICK_EDIT: "Szybka edycja CSS i JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Podczas edycji HTMLa użyj skrótu <kbd>Cmd/Ctrl + E</kbd> aby otworzyć szybki wbudowany edytor,\n" +
        "który wyświetli wszystkie powiązane style CSS. Wykonaj modyfikacje w kodzie CSS, wciśnij <kbd>ESC</kbd>\n" +
        "i wróć do edycji HTML. Możesz również pozostawić wbudowany edytor otwarty, tak aby stał się częścią\n" +
        "edytora HTML. Jeśli wciśniesz <kbd>ESC</kbd> poza obszarem szybkiego edytora, jego wszystkie okna\n" +
        "zostaną zamknięte. Koniec z przełączaniem się pomiędzy dokumentami i byciem wyrwanym z kontekstu.",
    QUICK_EDIT_SAMP:
        "Chcesz go zobaczyć w akcji? Umieść kursor w tagu <!-- <samp> --> i naciśnij <kbd>Cmd/Ctrl + E</kbd>.\n" +
        "Szybki edytor CSS pojawi się nad tym tagiem. Po prawej stronie zobaczysz listę wszystkich reguł,\n" +
        "które są powiązane z tym tagiem. Przełączaj się pomiędzy regułami używając skrótu <kbd>Alt + Góra/Dół</kbd>\n" +
        "aby znaleźć ten, który chcesz edytować.",
    QUICK_EDIT_SCREENSHOT: "Zrzut ekranu pokazujący szybką edycję CSS",
    QUICK_EDIT_OTHERS:
        "Możesz użyć tego samego skrótu w kodzie JavaScript, aby zobaczyć kod funkcji, którą przywołujesz,\n" +
        "poprzez umieszczenie kursora na nazwie funkcji. W ten sam sposób możesz również otworzyć narzędzie\n" +
        "wybierania koloru. Po prostu umieść kursor na dowolnym kolorze zapisanym w formacie hex, rgb lub hsl.",
    QUICK_EDIT_NOTE:
        "Na razie wbudowany szybki edytor nie może być niezagnieżdżony, więc możesz używać go jedynie w \"pełnowymiarowym\"\n" +
        "edytorze.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "BŁYSKAWICZNY PODGLĄD",
    LIVE_PREVIEW: "Zmiany w kodzie CSS widoczne na żywo w przeglądarce",
    LIVE_PREVIEW_INTRO:
        "Zapewne znany Ci jest taniec w stylu \"zapisz/przeładuj\", który wykonywaliśmy przez ostatnie lata.\n" +
        "Dokonujesz zmian w edytorze, zapisujesz zmiany, przełączasz się do przeglądarki i odświeżasz stronę,\n" +
        "by w końcu zobaczyć rezultat Twojej pracy. Z Brackets taki taniec nie jest konieczny.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets utworzy <em>połączenie na żywo</em> z Twoją lokalną przeglądarką i będzie jej przekazywał\n" +
        "wszelkie zmiany w CSS. Być może już dzisiaj korzystasz z podobnego rozwiązania przy użyciu narzędzi\n" +
        "w przeglądarce, jednak z Brackets nie ma potrzeby wklejania kodu CSS z powrotem do edytora. Twój kod\n" +
        "działa w przeglądarce, ale żyje w edytorze.",
    LIVE_PREVIEW_HIGHLIGHT: "Live Highlight HTML elements and CSS rules",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets makes it easy to see how your changes in HTML and CSS will affect the page. When your cursor\n" +
        "is on a CSS rule, Brackets will highlight all affected elements in the browser. Similarly, when editing\n" +
        "an HTML file, Brackets will highlight the corresponding HTML elements in the browser.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Jeśli posiadasz zainstalowaną przeglądarkę Google Chrome, możesz wypróbować to już teraz. Kliknij\n" +
        "ikonkę błyskawicy (stąd nazwa: Błyskawiczny Podgląd) w prawym górnym rogu lub naciśnij skrót\n" +
        "<kbd>Cmd/Ctrl + Alt + P</kbd>. Kiedy Błyskawiczny Podgląd zostanie włączony w dokumencie HTML,\n" +
        "wszystkie połączone z nim pliki CSS mogą być edytowane w czasie rzeczywistym. Ikona zmieni kolor\n" +
        "z szarej na złotą gdy Błyskawiczny Podgląd nawiąże połączenie z Twoją przeglądarką.\n" +
        "\n" +
        "Teraz umieść kursor na tagu <!-- <img> --> i wciśnij <kbd>Cmd/Ctrl + E</kbd> aby otworzyć zdefiniowane\n" +
        "style CSS dla tego tagu. Spróbuj zmienić rozmiar obramowania z 10px do 20px lub zmienić kolor tła\n" +
        "z \"transparent\" na \"hotpink\". Jeśli masz umieszczone okna przeglądarki i Brackets obok siebie\n" +
        "zobaczysz, że zmiany są natychmiast uwzględniane w przeglądarce. Nieźle, co?",
    LIVE_PREVIEW_NOTE:
        "Na dzień dzisiejszy Błyskawiczny Podgląd działa jedynie dla plików CSS. Aktualnie pracujemy nad tym,\n" +
        "aby dodać obsługę plików HTML i JavaScript. W aktualnej wersji zmiany w plikach HTML lub JavaScript\n" +
        "są automatycznie uwzględniane w momencie zapisu. Błyskawiczny Podgląd działa jedynie z Google Chrome.\n" +
        "Pragniemy wprowadzić tą funkcję we wszystkich najważniejszych przeglądarkach i mamy nadzieję na\n" +
        "współpracę ze strony autorów tych przeglądarek, by stało się to faktem.",

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
    GET_INVOLVED_COMMENT: "DAJ ZNAĆ CO O TYM SĄDZISZ",
    GET_INVOLVED: "Zaangażuj się",
    GET_INVOLVED_DESCRIPTION:
        "Brackets jest projektem open-source. Web developerzy z całego świata angażują się, by budować coraz\n" +
        "to lepszy edytor kodu. Daj nam znać co o nim sądzisz, podziel się swoimi pomysłami lub dodaj coś\n" +
        "bezpośrednio do projektu.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Blog Zespołu Brackets",
    URLNAME_BRACKETS_GITHUB: "Brackets na GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Brackets Extension Registry",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Developerska Lista Mailingowa Brackets",
    URLNAME_BRACKETS_TWITTER: "@Brackets na Twitterze",
    BRACKETS_CHAT_INFO_BEFORE: "Czatuj z developerami Brackets na IRCu w kanale",
    BRACKETS_CHAT_FREENODE: "#brackets na Freenode",
    BRACKETS_CHAT_INFO_AFTER: "."
});
