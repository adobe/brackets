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
    TITLE: "KOM IGÅNG MED BRACKETS",
    DESCRIPTION: "En interaktiv genomgång av Brackets.",

    // BODY
    GETTING_STARTED: "KOM IGÅNG MED BRACKETS",
    GETTING_STARTED_GUIDE: "Detta är din guide!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "SKAPAD MED <3 OCH JAVASCRIPT",
    WELCOME:
        "Välkommen till en tidig version av Brackets, en ny open-source editor för nästa generation av webben.\n" +
        "Vi är hängivna anhängare av webbstandarder och vill bygga bättre verktyg för JavaScript, HTML och CSS\n" +
        "samt relaterade öppna webbteknologier. Detta är vårt första ödmjuka steg.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "VAD ÄR BRACKETS?",
    EDITOR: "Brackets är en annan typ av editor.",
    EDITOR_DESCRIPTION:
        "En anmärkningsvärd skillnad är att denna editor är skriven i JavaScript, HTML och CSS.\n" +
        "Detta innebär att de flesta som använder Brackets har kunskapen som krävs för att förändra och förbättra editorn.\n" +
        "Faktum är att vi använder Brackets varje dag, för att bygga Brackets. Det har också ett antal unika funktioner som Quick Edit,\n" +
        "Live Preview och och ytterligare några som du inte hittar i andra editorer.\n" +
        "Läs vidare för att lära dig mer om dessa funktioner.",

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
    QUICK_EDIT_COMMENT: "FÖRHÅLLANDET MELLAN HTML, CSS OCH JAVASCRIPT",
    QUICK_EDIT: "Quick Edit för CSS och JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Du behöver inte längre tappa sammanhanget när du flyttar mellan olika dokument. När du redigerar HTML kan du\n" +
        "använda kortkommandot <kbd>Cmd/Ctrl + E</kbd> för att öppna en inline-editor som visar all relaterad CSS.\n" +
        "Gör förändringen i din CSS, tryck på <kbd>ESC</kbd> och du är tillbaka i HTML. Du kan också lämna CSS-reglerna\n" +
        "öppna och göra dem till en del av din HTML-editor. Om du trycker på <kbd>ESC</kbd> utanför en inline-editor\n" +
        "döljs samtliga.",
    QUICK_EDIT_SAMP:
        "Vill du se hur det fungerar? Placera markören på <!-- <samp> -->-elementet ovan och tryck <kbd>Cmd/Ctrl + E</kbd>.\n" +
        "Då visas CSS quick editorn ovan. Till höger kan du se en lista över alla CSS-regler som är relaterade\n" +
        "till detta element. Det fungerar även på klass och ID-attribut.\n" +
        "\n" +
        "Du kan skapa nya regler på samma sätt. Klicka på en av <!-- <p> -->-taggarna ovan och tryck <kbd>Cmd/Ctrl + E</kbd>.\n" +
        "Just nu finns det inga regler men genom att klicka på knappen Ny regel skapar du en ny stilregel för <!-- <p> -->-taggar.",
    QUICK_EDIT_SCREENSHOT: "En skärmdump som visas CSS Quick Edit",
    QUICK_EDIT_OTHERS:
        "Samma kortkommandon kan användas även på andra saker, till exempel funktioner i JavaScript för att ändra<br>\n" +
        "färger, tidsfunktioner för animering och nya saker läggs till hela tiden!",
    QUICK_EDIT_NOTE:
        "Just nu kan inte inline-editorer nästlas så du kan bara använda Quick Edit från den \"fullstora\" editorn.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "REALTIDSFÖRHANDSVISNING",
    LIVE_PREVIEW: "Förhandsvisa CSS-ändringar direkt i webbläsaren",
    LIVE_PREVIEW_INTRO:
        "Du vet den där \"spara och ladda om\"-proceduren vi använt oss av i flera år? Den där du gör\n" +
        "en ändring i din editor, sparar, går till webbläsaren och laddar om för att se resultatet?\n" +
        "Med Brackets behöver du inte göra det.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets öppnar en <em>direktlänk</em> till din lokala webbläsare och skjuter ut dina HTML- och CSS-ändringar\n" +
        "medan du skriver! Du kanske redan använder något liknande webbläsarverktyg men med Brackets\n" +
        "behöver du inte kopiera och klistra in koden fram och tillbaka mellan webbläsare och editor. Din kod\n" +
        "körs i webbläsaren men skrivs i din editor!",
    LIVE_PREVIEW_HIGHLIGHT: "Markera HTML-element och CSS-regler i realtid",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets gör det enkelt att se hur dina HTML- och CSS-ändringar kommer att påverka sidan. När din markör\n" +
        "står på en CSS-regel markerar Brackets samtliga berörda element i webbläsaren. På samma sätt markerar\n" +
        "Brackets respektive element i webbläsaren när du redigerar HTML-koden.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Om du har Google Chrome installerat kan du prova denna funktion själv. Klicka på blixtikonen\n" +
        "i det övre högra hörnet i ditt Brackets-fönster eller använd kortkommandot <kbd>Cmd/Ctrl + Alt + P</kbd>.\n" +
        "När Live Preview är aktiverat i ett HTML-dokument kommer alla länkade CSS-dokument att kunna redigeras\n" +
        "i realtid. Ikonens färg kommer att byta färg från grå till guld när Brackets lyckats skapa en länk\n" +
        "till din webbläsare.\n" +
        "\n" +
        "Om du sedan placerar markören på <!-- <img> -->-taggen ovan ser du hur en blå markeringen visas runt\n" +
        "bilden i Chrome. Du kan sedan använda <kbd>Cmd/Ctrl + E</kbd> för att visa de relaterade CSS-reglerna.\n" +
        "Prova att ändra tjockleken på border-egenskapen från 10px till 20px eller att ändra backgrundsfärgen\n" +
        "från \"transparent\" till \"hotpink\". Om Brackets och din webbläsare körs sida vid sida kommer du att se\n" +
        "dina ändringar genomföras direkt i webbläsaren. Coolt va?",
    LIVE_PREVIEW_NOTE:
        "För tillfället stöder Brackets bara Live Preview för HTML och CSS. Dock laddas webbläsaren automatiskt när du\n" +
        "sparar HTML- eller JavaScript-dokument. Vi jobbar för fullt med att utveckla stöd för Live Preview\n" +
        "även för JavaScript. Live preview fungerar just nu bara i Google Chrome men med tiden hoppas\n" +
        "vi kunna erbjuda denna funktionalitet i alla vanligt förekommande webbläsare.",

    // QUICK VIEW
    QUICK_VIEW: "Quick View",
    QUICK_VIEW_DESCRIPTION:
        "För de av oss som fortfarande inte memorerat färgkoderna för HEX eller RGB gör Brackets det snabbt och\n" +
        "enkelt att se vilken färg som används. När du pekar på ett färgvärde eller gradient, i antingen\n" +
        "HTML eller CSS, visas en förhandsgranskning av färgen/gradienten automatiskt. Detsamma gäller bilder:\n" +
        "peka på bildens sökväg i Brackets så visas en tumnagelversion av bilden.",
    QUICK_VIEW_SAMP:
        "Du kan prova Quick View själv genom att placera markören på <!-- <body> -->-taggen i början av detta\n" +
        "dokument och trycka <kbd>Cmd/Ctrl + E</kbd> för att öppna snabbeditorn för CSS. När du pekar över ett\n" +
        "färgvärde i CSS-koden visas motsvarande färg. Du kan utnyttja samma funktion med gradients i snabbeditorn -\n" +
        "placera markören på <!-- <html> -->-taggen och peka på dess background-image-egenskap. Du kan också prova\n" +
        "förhandvisningen av bilder genom att placera markören vid skärmdumpen tidigare i detta dokument.",

    // EXTENSIONS
    EXTENSIONS: "Behöver du någonting annat? Prova ett tillägg!",
    EXTENSIONS_DESCRIPTION:
        "Utöver alla bra funktioner som är inbyggda i Brackets har vårt stora, och växande, community av\n" +
        "tilläggsutvecklare tagit fram mer än hundra tillägg som ger mer användar funktionalitet. Om du saknar\n" +
        "någonting i Brackets är det stor chans att att någon redan byggt ett tillägg för att lösa det.\n" +
        "För att bläddra eller söka i listan över tillgängliga tillägg går du till <strong>Arkiv > Tilläggshanteraren</strong>\n" +
        "och klickar på fliken \"Tillgängliga\". När du hittat ett tillägg du vill ha klickar du bara på knappen \"Installera\"\n" +
        "intill det.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "BERÄTTA FÖR OSS VAD DU TYCKER",
    GET_INVOLVED: "ENGAGERA DIG",
    GET_INVOLVED_DESCRIPTION:
        "Brackets är ett open-source-projekt. Webbutvecklare från hela världen bidrar för att göra Brackets till\n" +
        "en bättre kodeditor. Många andra bygger tillägg som ökar Brackets funktionalitet.\n" +
        "Berätta för oss vad du tycker, dina åsiker och idéer eller bidra med kod direkt till projektet.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Brackets utvecklingsblogg",
    URLNAME_BRACKETS_GITHUB: "Brackets på GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Register över Brackets-tillägg",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Brackets Developer Mailing List",
    URLNAME_BRACKETS_TWITTER: "@Brackets på Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Chatta med Brackets-utvecklare via IRC i",
    BRACKETS_CHAT_FREENODE: "#brackets på Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});
