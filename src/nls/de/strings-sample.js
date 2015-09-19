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
    TITLE: "ERSTE SCHRITTE MIT BRACKETS",
    DESCRIPTION: "Ein interaktiver Wegweiser für die ersten Schritte mit Brackets.",

    // BODY
    GETTING_STARTED: "ERSTE SCHRITTE MIT BRACKETS",
    GETTING_STARTED_GUIDE: "Dies ist Ihre Anleitung!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "GEMACHT MIT <3 UND JAVASCRIPT",
    WELCOME:
        "Willkommen zu Brackets, einem modernen, quelloffenen Code-Editor, der Webdesign versteht. Es ist ein\n" +
        "einfacher, aber dennoch leistungsfähiger Editor, der Ihnen immer die richtigen Tools einblendet, sodass\n" +
        "Sie die genau richtige Menge an Hilfestellung haben, wann immer Sie diese brauchen.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "WAS IST BRACKETS?",
    EDITOR: "Brackets ist eine andere Art Editor.",
    EDITOR_DESCRIPTION:
        "Brackets hat ein paar einzigartige Features wie Schnelles Bearbeiten, Live-Vorschau und zahlreiche\n" +
        "weitere, die Sie in anderen Editoren vergeblich suchen werden. Zudem ist Brackets in JavaScript, HTML\n" +
        "und CSS geschrieben. Das heißt, dass die meisten Brackets-Nutzer dazu in der Lage sind, den Editor selbst\n" +
        "zu verändern und zu erweitern. Tatsächlich nutzen wir Brackets täglich, um Brackets zu verbessern.\n" +
        "Lesen Sie weiter, um mehr über die Nutzung der Hauptfeatures zu erfahren.",

    // GET STARTED WITH YOUR OWN FILES
    PROJECTS_COMMENT: "BEGINNEN SIE, IHRE EIGENEN DATEIEN ZU NUTZEN",
    PROJECTS: "Projekte in Brackets",
    PROJECTS_DESCRIPTION:
        "Um Ihren eigenen Code in Brackets zu bearbeiten, können Sie einfach den Ordner öffnen, der Ihre\n" +
        "Dateien enthält.\n" +
        "Brackets sieht den geöffneten Ordner als \"Projekt\"; Features wie Code-Vervollständigung, Live-Vorschau\n" +
        "und Schnelles Bearbeiten nutzen nur Dateien im aktuell geöffneten Ordner.",
    PROJECTS_SAMP:
        "Sobald Sie bereit sind, dieses Beispielprojekt zu verlassen und Ihren eigenen Code zu editieren, können\n" +
        "Sie die Drop-Down-Liste auf der linken Seite nutzen, um einen Ordner auszuwählen. Die Drop-Down-Liste\n" +
        "heißt zurzeit \"Erste Schritte\" - das ist der Ordner, der die aktuell geöffnete Datei enthält. Klicken\n" +
        "Sie darauf und wählen Sie daraufhin \"Ordner öffnen…\", um Ihren eigenen Ordner zu öffnen.\n" +
        "Sie können auf diese Weise auch später wieder zu zuvor geöffneten Ordnern, wie diesem Beispielprojekt,\n" +
        "zurückkehren.",

    // THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT
    QUICK_EDIT_COMMENT: "DIE BEZIEHUNG VON HTML, CSS UND JAVASCRIPT",
    QUICK_EDIT: "Schnelles Bearbeiten von CSS und JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Kein Wechsel zwischen Dokumenten mehr - so verlieren Sie nie den Überblick. Wenn Sie HTML editieren,\n" +
        "können Sie die Tastenkombination <kbd>Cmd/Strg + E</kbd> verwenden, um einen Inline-Editor anzuzeigen,\n" +
        "der Ihnen alle relevanten CSS-Regeln zum Schnellen Bearbeiten anzeigt.\n" +
        "Ändern Sie etwas im CSS, drücken Sie <kbd>ESC</kbd> und schon sind Sie zurück im HTML-Code. Oder lassen\n" +
        "Sie die CSS-Regeln einfach offen und sie werden Teil ihres HTML-Editors. Sobald Sie <kbd>ESC</kbd>\n" +
        "außerhalb eines solchen Editors drücken, schließen sich alle zusammen. Ein Inline-Editor zeigt Ihnen\n" +
        "auch Regeln in LESS- und SCSS-Dateien, inklusive geschachtelter Regeln.",
    QUICK_EDIT_SAMP:
        "Sie wollen das in Aktion sehen? Setzen Sie Ihren Cursor auf den <!-- <samp> -->-Tag oben und drücken\n" +
        "Sie <kbd>Cmd/Strg + E</kbd>. Sie sollten einen Editor zum Schnellen Bearbeiten von CSS erscheinen sehen,\n" +
        "der die geltenden CSS-Regeln anzeigt. Das Schnelle Bearbeiten funktioniert genauso in Klassen- und\n" +
        "ID-Attributen. Sie können es zudem in LESS- und SCSS-Dateien nutzen.\n" +
        "\n" +
        "Sie können auf die selbe Weise neue Regeln erstellen. Klicken Sie in einen der <!-- <p> -->-Tags weiter\n" +
        "oben und drücken Sie <kbd>Cmd/Strg + E</kbd>. Es gibt noch keine Regeln dafür, aber Sie können den\n" +
        "\"Neue Regel\"-Button nutzen, um eine neue Regel für <!-- <p> --> hinzuzufügen.",
    QUICK_EDIT_SCREENSHOT: "Ein Screenshot, der Schnelles Bearbeiten von CSS zeigt",
    QUICK_EDIT_OTHERS:
        "Sie können die selbe Tastenkombination nutzen, um andere Dinge auf die selbe Weise zu bearbeiten - wie\n" +
        "JavaScript-Funktionen, Farben und Animations-Timing-Funktionen - und wir fügen ständig mehr hinzu.",
    QUICK_EDIT_NOTE:
        "Im Augenblick können solche Editoren allerdings nicht verschachtelt werden. Sie können das\n" +
        "Schnelle Bearbeiten also nur nutzen, während der Cursor sich im Haupteditor befindet.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "LIVE-VORSCHAU",
    LIVE_PREVIEW: "Vorschau auf HTML- und CSS-Änderungen live im Browser anzeigen",
    LIVE_PREVIEW_INTRO:
        "Sie kennen den \"Speichern/Neu laden-Tanz\", den wir seit Jahren aufführen? Der, in dem Sie\n" +
        "Änderungen in Ihrem Editor machen, Speichern drücken, zum Browser schalten und dann neu laden,\n" +
        "um schließlich das Ergebnis zu sehen? Mit Brackets müssen Sie diesen Tanz nicht aufführen.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets öffnet eine <em>Live-Verbindung</em> zu Ihrem lokalen Browser und sendet HTML- und CSS-Updates,\n" +
        "während Sie tippen! Eventuell tun Sie etwas Ähnliches bereits heute mit browserbasierten Tools,\n" +
        "doch mit Brackets ist kein Kopieren und Einfügen des endgültigen Codes im Editor mehr nötig.\n" +
        "Ihr Code läuft im Browser, aber lebt in Ihrem Editor!",
    LIVE_PREVIEW_HIGHLIGHT: "Hervorheben von HTML-Elementen und CSS-Regeln - live!",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets macht es Ihnen leicht, zu sehen, welche Auswirkungen Ihre Änderungen in HTML und CSS auf die\n" +
        "Seite haben werden. Wenn Ihr Cursor auf einer CSS-Regel platziert ist, hebt Brackets alle zugehörigen\n" +
        "Elemente im Browser hervor. Genauso wird Brackets beim Editieren einer HTML-Datei die entsprechenden\n" +
        "HTML-Elemente im Browser markieren.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Falls Sie Google Chrome installiert haben, können Sie das selbst ausprobieren. Klicken Sie auf\n" +
        "das Blitz-Symbol oben rechts oder drücken Sie <kbd>Cmd/Strg + Alt + P</kbd>. Wenn die Live-Vorschau\n" +
        "für ein HTML-Dokument aktiviert ist, können alle verknüpften CSS-Dokumente in Echtzeit bearbeitet\n" +
        "werden. Das Symbol ändert die Farbe von grau nach gold, sobald Brackets eine Verbindung zu Ihrem\n" +
        "Browser hergestellt hat.\n" +
        "\n" +
        "Platzieren Sie Ihren Cursor jetzt auf dem <!-- <img> -->-Tag oben. Sie sehen in Chrome eine blaue\n" +
        "Markierung, die um das Bild herum erscheint. Nutzen Sie nun <kbd>Cmd/Strg + E</kbd>, um die\n" +
        "definierten CSS-Regeln anzuzeigen.\n" +
        "Probieren Sie, die Stärke des Rahmens von 10px auf 20px zu ändern, oder ändern Sie die\n" +
        "Hintergrundfarbe von \"transparent\" zu \"hotpink\". Falls Sie Brackets und Ihren Browser nebeneinander\n" +
        "laufen haben, können Sie die Änderungen sofort in Ihrem Browser erkennen. Cool, was?",
    LIVE_PREVIEW_NOTE:
        "Derzeit unterstützt Brackets die Live-Vorschau nur für HTML und CSS. Allerdings werden in der aktuellen\n" +
        "Version Änderungen an JavaScript-Dateien automatisch neu geladen, wenn Sie diese speichern. Wir arbeiten\n" +
        "momentan an der Unterstützung der Live-Vorschau für JavaScript.\n" +
        "Die Live-Vorschau ist außerdem nur mit Google Chrome möglich, doch wir hoffen, diese Funktionalität\n" +
        "zukünftig zu allen wichtigen Browsern hinzuzufügen.",

    // QUICK VIEW
    QUICK_VIEW: "Schnelle Farbansicht",
    QUICK_VIEW_DESCRIPTION:
        "Für die unter uns, die immer noch nicht die Farb-Äquivalente von HEX- und RGB-Werten kennen, macht es\n" +
        "Brackets einfach und schnell, exakt zu sehen, welche Farbe genutzt wird. Fahren Sie in HTML oder CSS\n" +
        "einfach über einen Farbwert oder -verlauf und Brackets wird Ihnen automatisch eine Vorschau davon\n" +
        "anzeigen. Das selbe gilt für Bilder: Platzieren Sie den Cursor im Brackets-Editor über einem Link zu\n" +
        "einem Bild und er wird ein Miniaturansicht von diesem Bild zeigen.",
    QUICK_VIEW_SAMP:
        "Um die Schnelle Farbansicht selbst auszuprobieren, können Sie Ihren Cursor auf dem\n" +
        "<!-- <body> -->-Tag am Anfang dieses Dokuments platzieren und <kbd>Cmd/Strg + E</kbd> drücken, um einen\n" +
        "CSS-Schnell-Editor zu öffnen. Fahren Sie nun einfach mit dem Cursor über einen der Farbwerte im\n" +
        "CSS-Code. Sie können das auch mit Farbverläufen sehen, wenn Sie einen Schnell-Editor für den\n" +
        "<!-- <html> -->-Tag anzeigen lassen und über irgendeinen der \"background-image\"-Farbwerte fahren. Um\n" +
        "die Bildvorschau auszuprobieren, können Sie Ihren Cursor auf dem Screenshot-Link platzieren, den Sie\n" +
        "weiter oben in diesem Dokument finden.",

    // EXTENSIONS
    EXTENSIONS: "Sie benötigen etwas anderes? Probieren Sie es mit einer Erweiterung!",
    EXTENSIONS_DESCRIPTION:
        "Zusätzlich zu all dem, was in Brackets eingebaut ist, hat unsere große und wachsende Community der\n" +
        "Erweiterungs-Entwickler hunderte Erweiterungen erstellt, die nützliche Funktionen bringen. Wenn\n" +
        "Sie etwas brauchen, was es nicht in Brackets gibt, ist es sehr wahrscheinlich, dass bereits jemand\n" +
        "eine Erweiterung dafür geschrieben hat. Um die Liste der verfügbaren Erweiterungen zu durchstöbern\n" +
        "oder zu durchsuchen nutzen Sie <strong>Datei > Erweiterungs-Verwaltung</strong> und klicken auf\n" +
        "den Tab \"Verfügbar\". Wenn Sie eine Erweiterung finden, die Sie nutzen wollen, klicken Sie einfach\n" +
        "auf den \"Installieren\"-Button daneben.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "LASSEN SIE UNS WISSEN, WAS SIE DENKEN",
    GET_INVOLVED: "Machen Sie mit",
    GET_INVOLVED_DESCRIPTION:
        "Brackets ist ein Open-Source-Projekt. Web-Entwickler rund um die Welt helfen mit, einen besseren\n" +
        "Code-Editor zu bauen. Noch mehr erstellen Erweiterungen, die die Möglichkeiten von Brackets erweitern.\n" +
        "Lassen Sie uns wissen, was Sie denken, teilen Sie Ihre Ideen oder tragen\n" +
        "Sie direkt zu dem Projekt bei.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Brackets Team-Blog",
    URLNAME_BRACKETS_GITHUB: "Brackets auf GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Brackets Erweiterungs-Verzeichnis",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Brackets Developer-Mailingliste",
    URLNAME_BRACKETS_TWITTER: "@brackets auf Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Mit Brackets-Entwicklern via IRC in",
    BRACKETS_CHAT_FREENODE: "#brackets auf Freenode",
    BRACKETS_CHAT_INFO_AFTER: "chatten"
});
