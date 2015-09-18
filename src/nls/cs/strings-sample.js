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
    TITLE:                   "ZAČÍNÁME S BRACKETS",
    DESCRIPTION:             "Interaktivní průvodce začátečníka v Brackets.",

    // BODY
    GETTING_STARTED:         "ZAČÍNÁME S BRACKETS",
    GETTING_STARTED_GUIDE:   "Tohle je váš průvodce!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "VYTVOŘENO S <3 A S JAVASCRIPTEM",
    WELCOME:
        "Vítejte v Brackets, moderním open-source editoru kódu, který rozumí webdesignu. Odlehčeném,\n" +
        "a přesto výkonném editoru kódu, který prolíná textový editor s vizuálními nástroji, takže dostanete\n" +
        "správné množství pomoci, kdy budete chtít.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "CO JE BRACKETS?",
    EDITOR:                  "Brackets je jiný druh editoru.",
    EDITOR_DESCRIPTION:
        "Brackets obsahuje některé unikátní prvky, jako rychlou úpravu, živý náhled a další, které v jiných\n" +
        "editorech pravděpodobně nenajdete. Navíc je Brackets napsán v JavaScriptu, HTML a CSS. To znamená,\n" +
        "že mnoho z nás používajících Brackets má znalosti potřebné k úpravě nebo rozšíření editoru. My sami\n" +
        "používáme Brackets neustále k vývoji Brackets. Čtěte dál, pokud se chcete dozvědět více o tom,\n" +
        "jak používat některé klíčové funkce editoru.",

    // GET STARTED WITH YOUR OWN FILES
    PROJECTS_COMMENT: "ZAČNĚTE S VAŠIMI VLASTNÍMI SOUBORY",
    PROJECTS: "Projekty v Brackets",
    PROJECTS_DESCRIPTION:
        "Abyste mohli editovat vlastní kód pomocí Brackets, stačí jenom otevřít složku obsahující vaše soubory.\n" +
        "Brackets považuje aktuálně otevřenou složku za „projekt“; funkce, jako např. nápovědy kódu, živý náhled\n" +
        "nebo rychlou úpravu, pak používá jenom u souborů uvnitř aktuálně otevřené složky.",
    PROJECTS_SAMP:
        "Jakmile budete připraveni odejít z tohoto ukázkového projektu a editovat vlastní kód, můžete použít\n" +
        "rozbalovací nabídku v levém bočním panelu ke změně složek. Rozbalovací nabídka právě teď ukazuje\n" +
        "„Getting Started“ - to je složka obsahující soubor, který právě teď prohlížíte. Klikněte na rozbalovací\n" +
        "nabídku a vyberte „Otevřít složku…“ k otevření vaší vlastní složky.\n" +
        "Rozbalovací nabídku můžete použít také později k přechodu zpátky do složek, které jste otevřeli dříve,\n" +
        "včetně tohoto ukázkového projektu.",

    // THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT
    QUICK_EDIT_COMMENT: "VZTAH MEZI HTML, CSS A JAVASCRIPTEM",
    QUICK_EDIT: "Rychlá úprava pro CSS a JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Žádné další přepínání mezi dokumenty a ztrácení souvislostí. Když editujete HTML, použijte klávesovou\n" +
        "zkratku <kbd>Cmd/Ctrl + E</kbd> k otevření rychle vloženého editoru, který zobrazí veškeré související\n" +
        "CSS. Proveďte drobnou úpravu ve vašem CSS, stiskněte <kbd>ESC</kbd> a jste zpátky v editaci HTML,\n" +
        "nebo prostě nechte CSS předpisy otevřené, čímž se stanou součástí vašeho HTML editoru. Pokud stisknete\n" +
        "<kbd>ESC</kbd> mimo rychle vložený editor, skryjí se tyto editory všechny. Rychlá úprava najde také\n" +
        "předpisy definované v LESS a SCSS souborech, včetně těch vnořených.",
    QUICK_EDIT_SAMP:
        "Chcete to vidět v akci? Umístěte kurzor na značku <!-- <samp> --> výše a stiskněte\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Pod danou značkou by se měla objevit rychlá úprava CSS, zobrazující související\n" +
        "CSS předpis. Rychlá úprava funguje také v atributech class a id. Stejně tak ji můžete využít ve vašich\n" +
        "LESS a SCSS souborech.\n" +
        "\n" +
        "Stejným způsobem můžete vytvořit i předpisy nové. Klikněte na jednu ze značek <!-- <p> --> výše\n" +
        "a stiskněte <kbd>Cmd/Ctrl + E</kbd>. Zatím tu žádné předpisy nejsou, ale můžete kliknout na tlačítko\n" +
        "Nový předpis, čímž přidáte nový předpis pro <!-- <p> -->.",
    QUICK_EDIT_SCREENSHOT: "Snímek obrazovky zobrazující rychlou úpravu CSS",
    QUICK_EDIT_OTHERS:
        "Stejnou klávesovou zkratku můžete použít i k editaci jiných věcí - např. funkcí v JavaScriptu, barev\n" +
        "nebo funkcí pro načasování animací - a pořád přidáváme další a další.",
    QUICK_EDIT_NOTE:
        "Vložené editory prozatím nemohou být vnořené, rychlou úpravu tedy můžete použít pouze pokud je kurzor\n" +
        "uvnitř „plnohodnotného“ editoru.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "ŽIVÝ NÁHLED",
    LIVE_PREVIEW: "Zobrazte změny v HTML a CSS živě v prohlížeči",
    LIVE_PREVIEW_INTRO:
        "Znáte ten tanec „uložitaobnovit“, který předvádíme řadu let? Takový ten, kdy provedete změny ve vašem\n" +
        "editoru, uložíte je, přepnete na prohlížeč a obnovíte stránku, abyste nakonec viděli výsledek? S Brackets\n" +
        "se tomuhle tanci můžete vyhnout.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets otevře <em>živé spojení</em> s vaším prohlížečem a posílá změny v HTML a CSS během psaní! Možná\n" +
        "už dnes děláte něco podobného s nástroji v prohlížečích, ale s Brackets není potřeba kopírovat výsledný\n" +
        "kód a vkládat jej zpátky do editoru. Váš kód běží uvnitř prohlížeče, ale žije ve vašem editoru!",
    LIVE_PREVIEW_HIGHLIGHT: "Živé zvýraznění HTML prvků a CSS předpisů",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Díky Brackets jednoduše uvidíte, jak vaše změny v HTML a CSS ovlivní stránku. Pokud umístíte kurzor\n" +
        "na CSS předpis, Brackets zvýrazní všechny zasažené prvky v prohlížeči. Podobně i při editaci HTML souboru\n" +
        "Brackets zvýrazní odpovídající HTML prvky v prohlížeči.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Pokud máte nainstalovaný Google Chrome, můžete si to vyzkoušet sami. Klikněte na ikonu blesku v pravém\n" +
        "horním rohu vašeho okna Brackets nebo stiskněte <kbd>Cmd/Ctrl + Alt + P</kbd>. Pokud je pro HTML\n" +
        "dokumenty povolen živý náhled, veškeré připojené CSS dokumenty mohou být editovány v reálném čase. Ikona\n" +
        "se změní z šedé na zlatou pokud Brackets naváže spojení s vaším prohlížečem.\n" +
        "\n" +
        "Nyní umístěte kurzor na značku <!-- <img> --> výše. Všimněte si modrého zvýraznění, které se objeví\n" +
        "v Google Chrome kolem obrázku. Dále použijte <kbd>Cmd/Ctrl + E</kbd> k otevření definovaných CSS\n" +
        "předpisů. Zkuste změnit šířku rámečku z 10px na 20px nebo změnit barvu pozadí z „transparent“\n" +
        "na „hotpink“. Pokud běží Brackets a váš prohlížeč vedle sebe, uvidíte, jak se vaše změny okamžitě projeví\n" +
        "ve vašem prohlížeči. Úžasné, že?",
    LIVE_PREVIEW_NOTE:
        "Brackets v současnosti podporuje živý náhled pouze pro HTML a CSS. V aktuální verzi jsou změny\n" +
        "v JavaScriptových souborech alespoň automaticky načteny, jakmile je uložíte. Aktuálně pracujeme právě\n" +
        "na podpoře živého náhledu pro JavaScript. Živé náhledy jsou také možné jenom s prohlížečem Google Chrome,\n" +
        "ale doufáme, že tuto funkci v budoucnu přineseme do všech hlavních prohlížečů.",

    // QUICK VIEW
    QUICK_VIEW: "Rychlý náhled",
    QUICK_VIEW_DESCRIPTION:
        "Pro ty z vás, kteří si ještě nezapamatovali ekvivalenty barev pro HEX nebo RGB hodnoty, Brackets rychle\n" +
        "a jednoduše zobrazí, jaká barva je právě používána. Jak v CSS, tak v HTML prostě najeďte na jakoukoliv\n" +
        "barevnou hodnotu nebo barevný přechod a Brackets automaticky zobrazí náhled dané barvy nebo daného\n" +
        "barevného přechodu. To samé platí pro obrázky: jednoduše najeďte na odkaz obrázku v editoru Brackets\n" +
        "a ten zobrazí malý náhled daného obrázku.",
    QUICK_VIEW_SAMP:
        "Pokud si rychlý náhled chcete vyzkoušet sami, umístěte kurzor na značku <!-- <body> --> výše v tomto\n" +
        "dokumentu a stiskněte <kbd>Cmd/Ctrl + E</kbd> k otevření rychlého editoru CSS. Nyní jednoduše najeďte\n" +
        "na kteroukoliv barevnou hodnotu v CSS. Také náhled barevných přechodů můžete vidět v akci otevřením\n" +
        "rychlého editoru CSS na značce <!-- <html> --> a najetím na kteroukoliv hodnotu background-image.\n" +
        "K vyzkoušení náhledu obrázku umístěte kurzor na snímek obrazovky vložený výše v tomto dokumentu.",

    // EXTENSIONS
    EXTENSIONS: "Potřebujete něco jiného? Zkuste doplněk!",
    EXTENSIONS_DESCRIPTION:
        "Navíc ke všemu skvělému, co je zabudované do Brackets, ještě naše rozsáhlá a rostoucí komunita vývojářů\n" +
        "doplňků vyvinula stovky doplňků přidávající další užitečné funkce. Pokud je tu něco, co potřebujete,\n" +
        "ale Brackets to nenabízí, s největší pravděpodobností už pro to někdo vytvořil doplněk. K procházení\n" +
        "nebo prohledání seznamu dostupných doplňků vyberte <strong>Soubor > Správce doplňků…</strong> a klikněte\n" +
        "na záložku „Dostupné“. Až naleznete doplněk, který hledáte, prostě klikněte na tlačítko „Instalovat“\n" +
        "vedle něj.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "DEJTE NÁM VĚDĚT, CO SI MYSLÍTE",
    GET_INVOLVED: "Zapojte se",
    GET_INVOLVED_DESCRIPTION:
        "Brackets je open-source projekt. Weboví vývojáři z celého světa se podílejí na vývoji a vylepšování\n" +
        "editoru. Mnoho dalších vyvíjí doplňky, které rozšiřují možnosti Brackets. Dejte nám vědět, co si myslíte,\n" +
        "sdílejte své nápady nebo se přímo podílejte na projektu.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Blog týmu Brackets",
    URLNAME_BRACKETS_GITHUB: "Brackets na GitHubu",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Registr doplňků Brackets",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Diskutujte s vývojáři Brackets na Skupinách Google",
    URLNAME_BRACKETS_TWITTER: "@brackets na Twitteru",
    BRACKETS_CHAT_INFO_BEFORE: "Chatujte s vývojáři Brackets na IRC kanálu",
    BRACKETS_CHAT_FREENODE: "Freenode/#Brackets",
    BRACKETS_CHAT_INFO_AFTER: "",
});

// Last translated for e3ecc9e7ac7b94f1107a8e3ca7064ac39b345280
