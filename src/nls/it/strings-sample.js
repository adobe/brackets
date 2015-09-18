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
    TITLE: "PRIMI PASSI CON BRACKETS!",
    DESCRIPTION: "Una guida interattiva per muovere i primi passi su Brackets.",

    // BODY
    GETTING_STARTED: "PRIMI PASSI CON BRACKETS!",
    GETTING_STARTED_GUIDE: "Questa è la tua guida!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "FATTO CON <3 E JAVASCRIPT",
    WELCOME:
        "Benvenuto in questa versione preliminare di Brackets, un nuovo editor open-source per la nuova\n" +
        "generazione del web. Noi siamo grandi fan degli standard e vogliamo realizzare degli strumenti\n" +
        "migliori per lavorare in JavaScript, HTML, CSS e altre tecnologie aperte del web. Questo è il\n" +
        "nostro umile inizio.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "COS'È BRACKETS?",
    EDITOR: "Brackets è un editor differente.",
    EDITOR_DESCRIPTION:
        "Un importante differenza è che questo editor è scritto in JavaScript, HTML e CSS.\n" +
        "Questo significa che la maggior parte di coloro che utilizzano Brackets, sono in grado di modificare\n" +
        "e ampliare l'editor. Infatti, noi usiamo Brackets ogni giorno per costruire Brackets.\n" +
        "Brackets è inoltre dotato di caratteristiche uniche come Modifica Rapida, Anteprima Live e altre\n" +
        "caratteristiche che non trovereste altrove.",

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
    QUICK_EDIT_COMMENT: "LA RELAZIONE TRA HTML, CSS E JAVASCRIPT",
    QUICK_EDIT: "Modifica rapida per CSS e JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Non c'è più bisogno di spostarsi continuamente da un documento all'altro. Quando si lavora al codice\n" +
        "HTML, è possibile digitare <kbd>Cmd/Ctrl + E</kbd> per aprire un'area di modifica rapida che mostra\n" +
        "il CSS corrispondente. Una volta effettuata una modifica al codice CSS, basta premere <kdb>ESC</kdb>\n" +
        "e si ritorna sull'HTML chiudendo l'area di modifica rapida, o è possibile lasciare aperta tale area\n" +
        "continuando a lavorare sull'HTML. Premendo invece <kbd>ESC</kbd> al di fuori di tale area, tutte le\n" +
        "aree di modifica rapida verranno chiuse.",
    QUICK_EDIT_SAMP:
        "Vuoi vederlo in azione? Posiziona il cursore nel tag <!-- <samp> --> sopra e premi\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Dovresti vedere un'area di modifica rapida del CSS apparire sopra.\n" +
        "Sulla destra vedrai la lista delle regole CSS corrispondenti a questo tag. Scorri\n" +
        "semplicemente le regole con <kbd>Alt + Up/Down</kbd> per trovare quella che intendi modificare.",
    QUICK_EDIT_SCREENSHOT: "Uno screenshot che mostra una finestra di modifica rapida CSS",
    QUICK_EDIT_OTHERS:
        "Puoi usare la stessa combinazione di tasti per il codice JavaScript e vedere il corpo di una funzione\n" +
        "posizionando il cursore nel nome della funzione chiamata.",
    QUICK_EDIT_NOTE:
        "Per il momento gli editor in linea non possono essere nidificati, quindi è possibile usare la\n" +
        "modifica rapida solo quando il cursore è posizionato nell'editor generale.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "ANTEPRIMA LIVE",
    LIVE_PREVIEW: "L'anteprima del CSS cambia in tempo reale nel browser",
    LIVE_PREVIEW_INTRO:
        "Conosci la solita procedura \"salva/ricarica\" che abbiamo fatto per anni? Fai una modifica tramite editor,\n" +
        "premi \"salva\", passi alla finestra del browser e aggiorni la pagina per vedere il risultato?\n" +
        "Con Brackets non avrai più bisogno di questo procedimento.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets aprirà una <em>connessione in tempo reale</em> con il tuo browser e gli manderà tutte le modifiche\n" +
        "del CSS non appena tu le avrai digitate! Forse oggi stai già facendo qualcosa di simile con qualche\n" +
        "strumento browser-based, ma con Brackets non avrai bisogno di copiare e incollare il codice CSS definitivo\n" +
        "nel tuo editor. Il tuo codice gira nel browser, ma risiede già nell'editor!",
    LIVE_PREVIEW_HIGHLIGHT: "L'anteprima mette in risalto gli elementi HTML e le regole CSS.",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets rende semplice vedere come le proprie modifiche all'HTML e al CSS hanno effetto sulla pagina.\n" +
        "Quando il cursore è su una regola CSS, nel browser verranno messi in risalto tutti gli elementi che\n" +
        "vengono influenzati da quella regola. Similmente, quando stai modificando un file HTML, Brackets metterà\n" +
        "in risalto nel browser gli elementi HTML corrispondenti.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Se hai Google Chrome installato, puoi provare da te. Clicca nell'icona con il fulmine nell'angolo\n" +
        "in alto a destra della finestra di Brackets oppure premi <kbd>Cmd/Ctrl + Alt + P</kbd>. Quando\n" +
        "Anteprima Live è abilitata in un documento HTML, tutti i documenti CSS collegati possono essere\n" +
        "modificati in tempo reale. L'icona cambierà colore, dal grigio al dorato, quando Brackets stabilisce\n" +
        "una connessione con il tuo browser.\n" +
        "\n" +
        "Adesso, posiziona il cursore sul tag <!-- <img> --> sopra. Noterai un highlight blu apparire attorno\n" +
        "all'imagine su Chrome. Successivamente, usa <kdb>Cmd/Ctrl + E</kdb> per aprire le regole CSS.\n" +
        "Prova a cambiare la grandezza del bordo da 10px a 20px o cambia il colore di sfondo da \"transparent\" a\n" +
        "\"hotpink\". Se Brackets e il tuo browser sono posizionati fianco a fianco, noterai istantaneamente\n" +
        "i cambiamenti anche nel tuo browser. Bello, vero?",
    LIVE_PREVIEW_NOTE:
        "Oggi, Brackets supporta solo l'Anteprima Live per il CSS. Comunque, nella versione corrente, i\n" +
        "cambiamenti ai file HTML e JavaScript sono automaticamente ricaricati quando si salva. Al momento\n" +
        "stiamo lavorando al supporto di HTML e JavaScript nell'Anteprima Live. Inoltre le anteprime live sono\n" +
        "supportate solo su Google Chrome, ma per il futuro speriamo di portare questa funzionalità anche\n" +
        "sugli altri browser più comuni.",

    // QUICK VIEW
    QUICK_VIEW: "Visualizzazione Rapida",
    QUICK_VIEW_DESCRIPTION:
        "Per coloro che non hanno ancora memorizzato i colori associati ai valori HEX o RGB, Brackets rende\n" +
        "facile e veloce vedere esattamente qual è il colore corrispondente. Nei documenti CSS e HTML basta\n" +
        "semplicemente posizionare il mouse sopra il valore di ogni colore e Brackets mostrerà automaticamente\n" +
        "un'anteprima di quel colore. La stessa cosa vale per le immagini: basta spostare il mouse sopra il\n" +
        "link dell'immagine all'interno dell'editor Brackets ed esso mostrerà una miniatura di quell'immagine.",
    QUICK_VIEW_SAMP:
        "Prova la Visualizzazione Rapida, posiziona il cursore sopra il tag <!-- <body> --> nella parte\n" +
        "superiore di questo documento e premi <kbd>Cmd/Ctrl + E</kbd> per una modifica rapida del CSS.\n" +
        "Adesso posiziona il mouse sopra un valore di qualche colore. Inoltre puoi vederla in azione sui\n" +
        "gradienti aprendo una modifica veloce CSS sopra il tag <!-- <html> --> e posizionando il mouse\n" +
        "sopra qualche valore corrispondente all'immagine di sfondo. Prova l'anteprima dell'immagine,\n" +
        "posiziona il cursore sopra lo screenshot presente all'inizio di questo documento.",

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
    GET_INVOLVED_COMMENT: "DICCI COSA NE PENSI",
    GET_INVOLVED: "Partecipa",
    GET_INVOLVED_DESCRIPTION:
        "Brackets è un progetto open source. Sviluppatori web da ogni parte del mondo stanno contribuendo\n" +
        "per realizzare un editor migliore. Altri ancora stanno realizzando estensioni che espandono le\n" +
        "funzionalità di Brackets. Dicci cosa ne pensi, condividi le tue idee o contribuisci direttamente\n" +
        "al progetto.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Brackets Team Blog",
    URLNAME_BRACKETS_GITHUB: ">Brackets su GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Brackets Extensions",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Brackets Developer Mailing List",
    URLNAME_BRACKETS_TWITTER: "@Brackets su Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Chatta con gli sviluppatori di Brackets nel canale IRC",
    BRACKETS_CHAT_FREENODE: "#brackets su Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});
