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
    TITLE: "BRACKETSIN KÄYTÖN ALOITUS",
    DESCRIPTION: "Vuorovaikutteinen aloitusopas Bracketsille.",

    // BODY
    GETTING_STARTED: "BRACKETSIN KÄYTÖN ALOITUS",
    GETTING_STARTED_GUIDE: "Tämä on oppaasi!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "TEHTY <3:LLA JA JAVASCRIPTILLÄ",
    WELCOME:
        "Tervetuloa käyttämään Bracketsia, nykyaikaista, avoimen lähdekoodin koodieditoria, joka ymmärtää\n" +
        "web-suunnittelun. Se on kevyt mutta silti tehokas: koodieditori, joka sulauttaa visuaaliset työkalut suoraan\n" +
        "editoriin, niin että saat oikean määrän apua silloin, kun haluat sitä.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "MIKÄ BRACKETS ON?",
    EDITOR: "Brackets on erityyppinen editori.",
    EDITOR_DESCRIPTION:
        "Bracketsissa on joitakin ainutlaatuisia ominaisuuksia, kuten pikamuokkaus, reaaliaikainen esikatselu ja\n" +
        "muita, joita et voi löytää muista editoreista. Lisäksi Brackets on kirjoitettu JavaSciptillä, HTML:llä ja\n" +
        "CSS:llä. Se tarkoittaa, että useimmilla Bracketsin käyttäjistä on riittävät taidot muokata ja laajentaa\n" +
        "editoria. Itse asiassa käytämme Bracketsia joka päivä sen itsensä kehitykseen. Oppiaksesi lisää siitä,\n" +
        "kuinka käyttää avainominaisuuksia, jatka lukemista.",

    // GET STARTED WITH YOUR OWN FILES
    PROJECTS_COMMENT: "ALOITUS OMIEN TIEDOSTOJESI KANSSA",
    PROJECTS: "Projektit Bracketsissa",
    PROJECTS_DESCRIPTION:
        "Muokataksesi omaa koodiasi Bracketsia käyttäen voit vain avata tiedostosi sisältävän kansion. Brackets pitää\n" +
        "nykyistä avointa kansiota ”projektina”; ominaisuudet, kuten koodivihjeet, esikatselu ja pikamuokkaus,\n" +
        "käyttävät vain parhaillaan avoinna olevan kansion tiedostoja.",
    PROJECTS_SAMP:
        "Heti kun olet valmis luopumaan tästä näyteprojektista ja muokkaamaan omaa koodiasi, voit käyttää vasemman\n" +
        "sivupalkin pudotusvalikkoa kansioiden vaihtamiseen. Juuri nyt pudotusvalikossa lukee ”Aloitus”. Tämä on\n" +
        "kansio, joka sisältää tiedoston, jota tarkastelet juuri nyt. Avaa oma kansiosi napsauttamalla\n" +
        "pudotusvalikkoa ja valitsemalla ”Avaa kansio…”.\n" +
        "Voit käyttää pudotusvalikkoa myös myöhemmin vaihtaaksesi takaisin kansioihin, jotka olet avannut aiemmin,\n" +
        "sisältäen tämän näyteprojektin.",

    // THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT
    QUICK_EDIT_COMMENT: "YHTEYS HTML:N, CSS:N JA JAVASCRIPTIN VÄLILLÄ",
    QUICK_EDIT: "Pikamuokkaus CSS:lle ja JavaScriptille",
    QUICK_EDIT_DESCRIPTION:
        "Ei lisää dokumenttien välillä vaihtamista tai asiayhteyden hukkaamista. Muokatessasi HTML:ää käytä\n" +
        "näppäinyhdistelmää <kbd>Cmd/Ctrl + E</kbd> avataksesi upotetun pikaeditorin, joka näyttää kaiken tiedostoon\n" +
        "liittyvän CSS:n. Muokkaa CSS:ääsi, paina <kbd>ESC</kbd>-näppäintä ja olet taas muokkaamassa HTML:ää, tai\n" +
        "yksinkertaisesti jätä CSS-säännöt auki, ja niistä tulee osa HTML-editoriasi. Jos painat\n" +
        "<kbd>ESC</kbd>-näppäintä pikaeditorin ulkopuolella, ne kaikki sulkeutuvat. Pikaeditori löytää myös LESS- ja\n" +
        "SCSS-tiedostoissa määritellyt säännöt, sisältäen sisäkkäiset sellaiset.",
    QUICK_EDIT_SAMP:
        "Haluatko nähdä sen toiminnassa? Aseta kohdistin alla olevaan <!-- <samp> --> -tägiin ja paina\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Sinun pitäisi nähdä, kun CSS-pikaeditori ilmestyy alapuolelle näyttäen CSS-säännön,\n" +
        "joka pätee siihen. Pikamuokkaus toimii toki myös class- ja id-attribuuttien kanssa. Voit käyttää sitä myös\n" +
        "LESS- ja SCSS-tiedostojesi kanssa.\n" +
        "\n" +
        "Voit luoda uusia sääntöjä samalla tavalla. Napsauta yhtä alaosan <!-- <p> --> -tägeistä ja paina\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Sille ei ole sääntöjä juuri nyt, mutta voit napsauttaa Uusi sääntö -painiketta\n" +
        "lisätäksesi uuden säännön <!-- <p> --> -tägeille.",
    QUICK_EDIT_SCREENSHOT: "Kuvankaappaus, jossa näkyy CSS:n pikamuokkaus",
    QUICK_EDIT_OTHERS:
        "Voit käyttää samaa näppäinyhdistelmää muokataksesi myös muita asioita - kuten JavaScriptin funktioita,\n" +
        "värejä ja animaatioiden ajoitusfunktioita - ja me lisäämme koko ajan yhä enemmän ominaisuuksia.",
    QUICK_EDIT_NOTE:
        "Toistaiseksi sisäeditorit eivät voi olla sisäkkäin, joten voit käyttää pikamuokkausta vain silloin, kun\n" +
        "kohdistin on täyskokoisessa editorissa.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "ESIKATSELU",
    LIVE_PREVIEW: "Esikatsele HTML:n ja CSS:n muutoksia reaaliaikaisesti selaimessa",
    LIVE_PREVIEW_INTRO:
        "Tiedäthän sen ”tallenna ja päivitä -tanssin”, jota olemme harrastaneet vuosia? Se, jossa tehdään muutoksia\n" +
        "editorissa, painetaan tallenna, vaihdetaan selaimeen ja sitten päivitetään, jotta tulos tulee viimein\n" +
        "näkyville? Bracketsissa sinun ei tarvitse harrastaa tätä tanssia.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets avaa <em>reaaliaikaisen yhteyden</em> paikalliseen selaimeesi ja vie HTML:n CSS:n päivitykset\n" +
        "samalla kun kirjoitat! Saatat olla jo tehnyt jotakin tämän kaltaista selainpohjaisilla työkaluilla, mutta\n" +
        "Bracketsin kanssa ei tarvitse kopioida ja liittää lopullista koodia takaisin editoriin. Koodisi suoritetaan\n" +
        "selaimessasi, mutta se sijaitsee editorissasi!",
    LIVE_PREVIEW_HIGHLIGHT: "Korosta HTML-elementtejä ja CSS-sääntöjä reaaliaikaisesti",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets tekee helpoksi nähdä, kuinka muutoksesi HTML:ssä ja CSS:ssä vaikuttavat sivuun. Kun kohdistin on\n" +
        "CSS-säännöllä, Brackets korostaa kaikki siihen liittyvät elementit selaimessa. Samalla tavoin muokattaessa\n" +
        "HTML-tiedostoa Brackets korostaa vastaavat HTML-elementit selaimessa.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Jos sinulla on Google Chrome asennettuna, voit kokeilla tätä itse. Napsauta Brackets-ikkunan oikeassa\n" +
        "yläkulmassa sijaitsevaa salamakuvaketta tai paina <kbd>Cmd/Ctrl + Alt + P</kbd>. Kun esikatselu on käytössä\n" +
        "HTML-dokumentissa, kaikkia linkitettyjä CSS-dokumentteja voi muokata reaaliajassa. Kuvake muuttuu harmaasta\n" +
        "kultaiseksi, kun Brackets muodostaa yhteyden selaimeesi.\n" +
        "\n" +
        "Aseta kohdistin nyt yläpuolella olevaan <!-- <img> --> -tägiin. Huomaa sininen korostus, joka ilmestyy kuvan\n" +
        "ympärille Chromessa. Käytä seuraavaksi <kbd>Cmd/Ctrl + E</kbd> -näppäinyhdistelmää avataksesi määritellyt\n" +
        "CSS-säännöt. Yritä muuttaa reunaviivan kokoa arvosta 10px arvoon 20px tai vaihtaa taustaväriä arvosta\n" +
        "”transparent” arvoon ”hotpink”. Jos Brackets ja selain ovat näytölläsi vierekkäin, näet muutosten\n" +
        "heijastuvan välittömästi selaimeesi. Siistiä, eikö?",
    LIVE_PREVIEW_NOTE:
        "Nykyisellään Brackets tukee esikatselua vain HTML:lle ja CSS:lle. Kuitenkin jo nykyisessä versiossa\n" +
        "muutokset JavaScript-tiedostoihin päivitetään automaattisesti tallentaessasi tiedoston. Työskentelemme\n" +
        "parhaillaan esikatselun tuomiseksi JavaScriptille. Esikatselu on myös mahdollista vain Google Chromella,\n" +
        "mutta toivomme pystyvämme tuomaan tämän toiminnon kaikille pääselaimille tulevaisuudessa.",

    // QUICK VIEW
    QUICK_VIEW: "Pikanäkymä",
    QUICK_VIEW_DESCRIPTION:
        "Niille meistä, jotka eivät vielä osaa ulkoa värien vastineita HEX- tai RGB-arvoille, Brackets tekee nopeaksi\n" +
        "ja helpoksi nähdä täsmälleen, mitä väriä on käyttämässä. Kerta kaikkiaan osoita mitä tahansa väriarvoa tai\n" +
        "liukuväriä joko CSS:ssä tai HTML:ssä, ja Brackets näyttää esikatselun tästä väristä tai liukuväristä\n" +
        "automaattisesti. Sama tulee kuviin: osoita yksinkertaisesti kuvalinkkiä Brackets-editorissa ja se näyttää\n" +
        "pienen esikatselukuvan tästä kuvasta.",
    QUICK_VIEW_SAMP:
        "Kokeile pikanäkymää itse asettamalla kohdistimesi tämän dokumentin yläosassa sijaitsevaan <!-- <body> -->\n" +
        "-tägiin ja painalla <kbd>Cmd/Ctrl + E</kbd> avataksesi CSS-pikaeditorin. Nyt yksinkertaisesti osoita mitä\n" +
        "tahansa CSS:n väriarvoista. Voit myös nähdä sen toiminnassa liukuväreissä avaamalla CSS-pikaeditorin\n" +
        "<!-- <html> --> -tägille ja osoittamalla mitä tahansa taustakuva-arvoista. Kokeile kuvan esikatselua\n" +
        "asettamalla osoittimesi tässä dokumentissa aiemmin esiintyneen kuvankaappauskuvan päälle.",

    // EXTENSIONS
    EXTENSIONS: "Tarvitsetko jotakin muuta? Kokeile laajennusta!",
    EXTENSIONS_DESCRIPTION:
        "Sen kaiken hyvän lisäksi, jota Bracketsiin on rakennettu, on suuri ja kasvava laajennuskehittäjien\n" +
        "yhteisömme tehnyt satoja laajennuksia, jotka lisäävät hyödyllisiä toimintoja. Jos on jotakin, jota tarvitset\n" +
        "ja jota Brackets ei tarjoa, enemmän kuin todennäköisesti joku on tehnyt laajennuksen siihen. Selaa\n" +
        "saatavilla olevien laajennusten luetteloa tai hae siitä valitsemalla <strong>Tiedosto &gt; Laajennusten\n" +
        "hallinta</strong> ja napsauttamalla ”Saatavilla”-välilehteä. Kun löydät haluamasi laajennuksen, napsauta\n" +
        "vain ”Asenna”-painiketta sen vierestä.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "KERRO MEILLE, MITÄ AJATTELET",
    GET_INVOLVED: "Lähde mukaan",
    GET_INVOLVED_DESCRIPTION:
        "Brackets on avoimen lähdekoodin projekti. Web-kehittäjät ympäri maailmaa osallistuvat paremman koodieditorin\n" +
        "kehittämiseen. Vieläkin enemmän kehitetään laajennuksia, jotka laajentavat Bracketsin kykyjä. Kerro meille,\n" +
        "mitä ajattelet. Jaa ideasi tai osallistu suoraan projektiin.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Brackets-tiimin blogi",
    URLNAME_BRACKETS_GITHUB: "Brackets GitHubissa",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Brackets-laajennusten rekisteri",
    URLNAME_BRACKETS_WIKI: "Brackets-wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Brackets-kehittäjien postituslista",
    URLNAME_BRACKETS_TWITTER: "@brackets Twitterissä",
    BRACKETS_CHAT_INFO_BEFORE: "Rupattele Brackets-kehittäjien kanssa IRC:ssä:",
    BRACKETS_CHAT_FREENODE: "#brackets Freenodessa",
    BRACKETS_CHAT_INFO_AFTER: ""
});
