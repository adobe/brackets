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
    TITLE: "KOM GODT I GANG MED BRACKETS",
    DESCRIPTION: "En interaktiv guide til at komme godt i gang med Brackets.",

    // BODY
    GETTING_STARTED: "KOM GODT I GANG MED BRACKETS",
    GETTING_STARTED_GUIDE: "Dette er din guide!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "SKABT MED <3 OG JAVASCRIPT",
    WELCOME:
        "Velkommen til dette tidlige smugkig på Brackets, en ny open-source editor til den næste generation af\n" +
        "nettet. Vi er stærke tilhængere af standarder og ønsker at skabe bedre værktøjer til JavaScript, HTML, CSS\n" +
        "og andre åbne web teknologier. Dette er vores ydmyge begyndelse.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "HVAD ER BRACKETS?",
    EDITOR: "Brackets er en anderledes editor.",
    EDITOR_DESCRIPTION:
        "En nævneværdig forskel er, at denne editor er skrevet i JavaScript, HTML og CSS.\n" +
        "Det betyder, at de fleste af jer der bruger Brackets har de nødvendige færdigheder til at ændre og udvide editoren.\n" +
        "Faktisk bruger vi selv Brackets hver dag for at bygge Brackets. Det har også nogle unikke funktioner såsom Lyn-Redigering,\n" +
        "Live-Forhåndsvisning og andre som du ikke finder i andre editorer.\n" +
        "Hvis du vil vide mere om, hvordan du bruger disse funktioner, så læs videre.",

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
    QUICK_EDIT_COMMENT: "FORHOLDET MELLEM HTML, CSS OG JAVASCRIPT",
    QUICK_EDIT: "Lyn-Redigering til CSS og JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Slut med at skifte mellem dokumenter og miste fokuset. Når du redigerer HTML, kan du trykke\n" +
        "<kbd>Cmd/Ctrl + E</kbd> for at åbne en indlejret editor som viser alt det relevante CSS.\n" +
        "Tilpas dit CSS, tryk <kbd>ESC</kbd> og du ryger tilbage til dit HTML-dokument, eller du kan efterlade\n" +
        "CSS-reglerne åbne så de bliver en del af din HTML-editor. Hvis du trykker <kbd>ESC</kbd> udenfor\n" +
        "en Lyn-Redigerings-editor, bliver de alle klappet sammen.",
    QUICK_EDIT_SAMP:
        "Vil du se hvordan det virker? Placér markøren på <!-- <samp> --> tagget ovenfor og tryk\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Du burde se Lyn-Redigering dukke frem, som viser den CSS-regel som\n" +
        "anvendes på den. Lyn-Redigering virker også med klasse- og id-attributter.\n" +
        "\n" +
        "Du kan oprette nye regler på samme måde. Klik i en af <!-- <p> --> tagsne ovenover og tryk\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Der er ingen regler til den lige nu, men du kan klikke på \"Ny Regel\"\n" +
        "for at oprette en ny regel til <!-- <p> -->.",
    QUICK_EDIT_SCREENSHOT: "Et skærmbillede der viser CSS-Lyn-Redigering",
    QUICK_EDIT_OTHERS:
        "Du kan også bruge den samme genvej til at redigere andre ting--såsom funktioner i JavaScript,\n" +
        "farver, og timing-funktioner til animationer--og vi føjer mere til hele tiden.",
    QUICK_EDIT_NOTE:
        "Indtil videre kan editorerne ikke indlejres i hinanden, så du kan kun bruge Lyn-Redigering så længe markøren\n" +
        "er i det primære redigerings-felt.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "LIVE-FORHÅNDSVISNING",
    LIVE_PREVIEW: "Se ændringer i HTML og CSS live i browseren",
    LIVE_PREVIEW_INTRO:
        "Kender du den \"gem/genindlæs\"-finte vi har lavet i årevis? Den hvor du laver ændringer i\n" +
        "din editor, gemmer, skifter over til browseren og så genindlæser for endeligt at se resultatet?\n" +
        "Med Brackets kan du lægge den finte på hylden.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets åbner en <em>direkte forbindelse</em> til din lokale browser og sender HTML og CSS opdateringer imens du\n" +
        "skriver! Måske gør du allerede noget lignende i dag med browser-baserede værktøjer, men med Brackets\n" +
        "behøver du ikke kopiere den endelige kode tilbage i editoren. Din kode kører i din browser,\n" +
        "men bor i din editor!",
    LIVE_PREVIEW_HIGHLIGHT: "Live fremhævelse af HTML-elementer og CSS-regler",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets gør det nemt at se dine ændringer i HTML og CSS vil påvirke siden. Når markøren\n" +
        "er på en CSS-regel, vil Brackets fremhæve alle påvirkede elementer i browseren. Ligeledes, når en\n" +
        "HTML-fil redigeres, vil Brackets fremhæve de tilsvarende HTML-elementer i browseren.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Hvis du har Google Chrome installeret, kan du prøve det af selv. Klik på lyn-ikonet\n" +
        "i øverste højre hjørne af Brackets vinduet eller tryk <kbd>Cmd/Ctrl + Alt + P</kbd>. Når\n" +
        "Live-Forhåndsvisning slåes til på et HTML-dokument, kan alle tilknyttede CSS-dokumenter redigeres i realtid.\n" +
        "Ikonet skifter fra grå til guld når Brackets har etableret en forbindelse til browseren.\n" +
        "\n" +
        "Placér nu markøren på <!-- <img> --> tagget ovenover. Bemærk den blå fremhævning der dukker op\n" +
        "rundt om billedet i Chrome. Tryk derefter på <kbd>Cmd/Ctrl + E</kbd> for at åbne de definerede CSS-regler.\n" +
        "Prøv at ændre tykkelsen på kanten fra 10px til 20px eller ændre baggrundsfarven\n" +
        "fra \"transparent\" til \"hotpink\". Hvis du har Brackets og browseren til at køre side om side,\n" +
        "kan du med det samme se dine ændringer blive vist i browseren. Er det ikke sejt?",
    LIVE_PREVIEW_NOTE:
        "I dag understøtter Brackets kun Live-Forhåndsvisning for HTML og CSS. Ændringer til JavaScript-filer\n" +
        "bliver dog genindlæst automatisk når du gemmer. Vi arbejder i øjeblikket på at Live-Forhåndsvisning\n" +
        "også understøtter JavaScript. Live-Forhåndsvisning er også kun muligt med Google Chrome, men vi håber på\n" +
        "at bringe denne funktionalitet ud til alle gængse browsere i fremtiden.",

    // QUICK VIEW
    QUICK_VIEW: "Lyn-visning",
    QUICK_VIEW_DESCRIPTION:
        "For dem af os, som endnu ikke kan alle farvers HEX- eller RGB-kode udenad, gør Brackets\n" +
        "det hurtigt og nemt at se nøjagtig hvilken farve der er brugt. I enten CSS eller HTML, peger du ganske enkelt på en\n" +
        "farve-værdi eller gradient og Brackets vil vise et eksempel af den farve/gradient automatisk. Det\n" +
        "samme gælder for billeder: du peger ganske enkelt på billede-adressen i editoren og der vises en\n" +
        "miniature-udgave af det billede.",
    QUICK_VIEW_SAMP:
        "Du kan afprøve Lyn-Visning ved at placére markøren på <!-- <body> --> tagget øverst i dette\n" +
        "dokument og trykke <kbd>Cmd/Ctrl + E</kbd> for at åbne CSS-Lyn-Redigering. Her kan du pege på enhver\n" +
        "farve-værdi i CSS'en og se farven. Du kan også set det i aktion i gradienter ved at åbne Lyn-Redigering\n" +
        "på <!-- <html> --> tagget og pege på en af værdierne for baggrundsbilledet. For at se et smugkig af billeder,\n" +
        "peg på adressen til skærmbilledet, som er indsat tidligere i dette dokument.",

    // EXTENSIONS
    EXTENSIONS: "Har du brug for noget andet? Prøv en udvidelse!",
    EXTENSIONS_DESCRIPTION:
        "Som tilføjelse til alle de gode sager der er indbygget i Brackets, har vores store og voksende samfund af\n" +
        "udviklere skabt over hundrede udvidelser, som tilføjer nyttig funktionalitet. Hvis der er\n" +
        "noget du har brug for, som Brackets ikke tilbyder, er det ret sandsynligt at nogen har lavet en udvidelse til\n" +
        "det. For at gennemse eller søge i listen af tilgængelige udvidelser, vælg <strong>Filer > Udvidelses-håndtering</strong>\n" +
        "og klik på fanen \"Udvalg\". Når du har fundet en udvidelse du kunne tænke dig, klikker du blot på\n" +
        "knappen \"Installér\" ud for den.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "GIV DIN MENING TIL KENDE",
    GET_INVOLVED: "Bliv involveret",
    GET_INVOLVED_DESCRIPTION:
        "Brackets er et open-source projekt. Web-udviklere fra hele verden bidrager til at bygge\n" +
        "en bedre kode-editor. Endnu flere bygger udvidelser der udvider funktionaliteten af Brackets.\n" +
        "Fortæl os hvad du synes, del dine idéer eller bidrag direkte til projektet.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Brackets team-blog",
    URLNAME_BRACKETS_GITHUB: "Brackets på GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Brackets udvidelses-register",
    URLNAME_BRACKETS_WIKI: "Brackets wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Brackets mailingliste for udviklere",
    URLNAME_BRACKETS_TWITTER: "@brackets på Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Chat med Brackets-udviklere på IRC i",
    BRACKETS_CHAT_FREENODE: "#brackets på Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});
