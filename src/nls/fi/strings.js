/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
    
    /**
     * Errors
     */

    // General file io error strings
    "GENERIC_ERROR"                     : "(virhe {0})",
    "NOT_FOUND_ERR"                     : "Tiedostoa ei löytynyt.",
    "NOT_READABLE_ERR"                  : "Tiedostoa ei voitu lukea.",
    "NO_MODIFICATION_ALLOWED_ERR"       : "Kohdehakemistoa ei voitu muuttaa.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE"  : "Sinulla ei ole oikeuksia tehdä muutoksia.",
    "FILE_EXISTS_ERR"                   : "Tiedosto tai hakemisto on jo olemassa.",
    "FILE"                              : "tiedosto",
    "DIRECTORY"                         : "hakemisto",

    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Virhe ladattaessa projektia",
    "OPEN_DIALOG_ERROR"                 : "Tapahtui virhe avattaessa tiedostovalintaikkunaa. (virhe {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Tapahtui virhe yrittäessä avata hakemistoa <span class='dialog-filename'>{0}</span>. (virhe {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Tapahtui virhe luettaessa hakemiston <span class='dialog-filename'>{0}</span> sisältöä. (virhe {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Virhe avattaessa tiedostoa",
    "ERROR_OPENING_FILE"                : "Tapahtui virhe yrittäessä avata tiedosto <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Tapahtui virhe yrittäessä avata seuraavat tiedostot:",
    "ERROR_RELOADING_FILE_TITLE"        : "Virhe päivittäessä muutoksia levyltä",
    "ERROR_RELOADING_FILE"              : "Tapahtui virhe yrittäessä päivittää tiedosto <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Virhe tallennettaessa tiedostoa",
    "ERROR_SAVING_FILE"                 : "Tapahtui virhe yrittäessä tallentaa tiedostoa <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Virhe nimettäessä tiedosto uudelleen",
    "ERROR_RENAMING_FILE"               : "Tapahtui virhe yrittäessä nimetä uudelleen tiedostoa <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Virhe poistettaessa tiedostoa",
    "ERROR_DELETING_FILE"               : "Tapahtui virhe yrittäessä poistaa tiedosto <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Kelpaamaton {0}nimi",
    "INVALID_FILENAME_MESSAGE"          : "Tiedostonimi ei voi sisältää seuraavia merkkejä: {0} tai mitään järjestelmän varaamia sanoja.",
    "FILE_ALREADY_EXISTS"               : "{0} <span class='dialog-filename'>{1}</span> on jo olemassa.",
    "ERROR_CREATING_FILE_TITLE"         : "Virhe luodessa {0}a",
    "ERROR_CREATING_FILE"               : "Virhe yrittäessä luoda {0}a <span class='dialog-filename'>{1}</span>. {2}",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME}-sovellusta ei voi suorittaa vielä selaimissa.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} on rakennettu HTML:llä, mutta nyt se toimii kuten työpöydän sovellus, jotta voit käyttää sitä muokataksesi paikallisia tiedostoja. Käytäthän sovellus-shelliä osoitteen <b>github.com/adobe/brackets-shell</b> repo:ssa suorittaaksesi {APP_NAME}-sovelluksen.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE"             : "Virhe indeksoidessa tiedostoja",
    "ERROR_MAX_FILES"                   : "Suurin sallittu määrä tiedostoja on indeksoitu. Toiminnot, jotka tarkistavat tiedostoja indeksistä, voivat toimia virheellisesti.",

    // Live Development error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Virhe avattaessa selainta",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome -selainta ei löydy. Varmista, että se on asennettu.",
    "ERROR_LAUNCHING_BROWSER"           : "Tapahtui virhe avattaessa selainta. (virhe {0})",
    
    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Esikatselun virhe",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Yhdistetään selaimeen",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Jotta esikatselu voi yhdistää, Chromen tarvitsee käynnistyä uudelleen etävirheenjäljitys käytössä.<br /><br />Haluatko käynnistää Chromen uudelleen ja aktivoida etävirheenjäljityksen?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Ei kyetty lataamaan reaaliaikaisen kehityksen sivua",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Avaa HTML-tiedosto käyttääksesi esikatselua.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Käynnistääksesi reaaliaikaisen esikatselun palvelimen puoleisella tiedostolla, tämän projektin URL-osoite on määritettävä.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Virhe käynnistäessä HTTP-palvelinta reaaliaikaisen kehityksen tiedostoja varten. Yritäthän uudelleen.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Tervetuloa reaaliaikaiseen esikatseluun!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Esikatselu yhdistää {APP_NAME}-sovelluksen verkkoselaimeesi. Se avaa HTML-tiedostosi esikatselun selaimessa ja päivittyy sitten välittömästi tehdässäsi muutoksia koodiin.<br /><br />Tässä aikaisessa {APP_NAME}-sovelluksen versioissa esikatselu toimii vain <strong>Google Chrome -selaimella</strong> ja päivittää reaaliaikaisesti muokatessasi CSS-tiedostoja. Muutokset HTML- tai JavaScript-tiedostolle päivittyvät automaattisesi, kun tallennat sen.<br /><br />(Näet tämän viestin vain kerran.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Saadaksesi lisätietoja katso <a href='{0}' title='{0}'>Troubleshooting Live Development connection errors</a>.",
    
    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Esikatselu",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Esikatselu: Yhdistetään\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Esikatselu: Valmistellaan\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Katkaise esikatselun yhteys",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Esikatselu: Napsauta katkaistaksesi yhteys (Tallenna tiedosto päivittääksesi)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Esikatselu (ei päivity johtuen syntaksivirheestä)",
    
    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS" : "Esikatselu peruutettiin, koska selaimen kehitystyökalut avattiin",
    "LIVE_DEV_DETACHED_TARGET_CLOSED"          : "Esikatselu peruutettiin, koska sivu suljettiin selaimessa",
    "LIVE_DEV_NAVIGATED_AWAY"                  : "Esikatselu peruutettiin, koska selain siirtyi sivulle, joka ei ole osa nykyistä projektia",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON"           : "Esikatselu peruutettiin tuntemattomasta syystä ({0})",
    
    "SAVE_CLOSE_TITLE"                  : "Tallenna muutokset",
    "SAVE_CLOSE_MESSAGE"                : "Haluatko tallentaa tekemäsi muutokset dokumenttiin <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE"          : "Haluatko tallentaa muutokset seuraaviin tiedostoihin?",
    "EXT_MODIFIED_TITLE"                : "Ulkoiset muutokset",
    "CONFIRM_FOLDER_DELETE_TITLE"       : "Vahvista poisto",
    "CONFIRM_FOLDER_DELETE"             : "Oletko varma, että haluat poistaa kansion <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE"                : "Tiedosto poistettu",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> on muuttunut levyllä, mutta on myös tallentamattomia muutoksia {APP_NAME}-sovelluksessa.<br /><br />Kumman version haluat säilyttää?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> on poistettu levyltä, mutta on tallentamattomia muutoksia {APP_NAME}-sovelluksessa.<br /><br />Haluatko säilyttää muutoksesi?",
    
    // Find, Replace, Find in Files
    "SEARCH_REGEXP_INFO"                : "Käytä /re/-syntaksia hakeaksesi säännöllisellä lausekkeella",
    "FIND_RESULT_COUNT"                 : "{0} tulosta",
    "FIND_RESULT_COUNT_SINGLE"          : "1 tulos",
    "FIND_NO_RESULTS"                   : "Ei tuloksia",
    "WITH"                              : "merkkijonolla",
    "BUTTON_YES"                        : "Kyllä",
    "BUTTON_NO"                         : "Ei",
    "BUTTON_REPLACE_ALL"                : "Kaikki\u2026",
    "BUTTON_STOP"                       : "Lopeta",
    "BUTTON_REPLACE"                    : "Korvaa",
    
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Seuraava vastaavuus",
    "BUTTON_PREV_HINT"                  : "Edellinen vastaavuus",

    "OPEN_FILE"                         : "Avaa tiedosto",
    "SAVE_FILE_AS"                      : "Tallenna tiedosto",
    "CHOOSE_FOLDER"                     : "Valitse kansio",

    "RELEASE_NOTES"                     : "Julkaisutiedot",
    "NO_UPDATE_TITLE"                   : "Olet ajantasalla!",
    "NO_UPDATE_MESSAGE"                 : "Käytät uusinta versiota sovelluksesta {APP_NAME}.",
    
    "FIND_REPLACE_TITLE_PART1"          : "Korvaa ”",
    "FIND_REPLACE_TITLE_PART2"          : "” merkkijonolla ”",
    "FIND_REPLACE_TITLE_PART3"          : "” &mdash; {2} {0} {1}",

    "FIND_IN_FILES_TITLE_PART1"         : "”",
    "FIND_IN_FILES_TITLE_PART2"         : "” löytyi",
    "FIND_IN_FILES_TITLE_PART3"         : "&mdash; {0} {1} {2} {3} {4}",
    "FIND_IN_FILES_SCOPED"              : "kohteesta <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "projektissa",
    "FIND_IN_FILES_FILE"                : "tiedostossa",
    "FIND_IN_FILES_FILES"               : "tiedostossa",
    "FIND_IN_FILES_MATCH"               : "vastaavuus",
    "FIND_IN_FILES_MATCHES"             : "vastaavuutta",
    "FIND_IN_FILES_MORE_THAN"           : "Yli ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We shoudl use normal dashes on Windows instead of em dash eventually
    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Virhe noudettaessa päivitystietoja",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Viimeisimpien päivitystietojen noutamisessa palvelimelta oli ongelma. Varmista olevasi yhteydessä verkkoon ja yritä uudelleen.",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Ladataan\u2026",
    "UNTITLED"          : "nimetön",
    "WORKING_FILES"     : "Työtiedostot",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL"   : "Ctrl",
    "KEYBOARD_SHIFT"  : "Vaihto",
    "KEYBOARD_SPACE"  : "Välilyönti",
    
    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION"             : "Rivi {0}, Merkki {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Valittu {0} merkki",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Valittu {0} merkkiä",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Valittu {0} rivi",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Valittu {0} riviä",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Napsauta muuttaaksesi sisennys välilyönneiksi",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Napsauta muuttaaksesi sisennys sarkainmerkeiksi",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Napsauta muuttaaksesi sisennyksenä käytettävien välilyöntien määrää",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Napsauta muuttaaksesi sarkainmerkin leveyttä",
    "STATUSBAR_SPACES"                      : "Välilyönnit:",
    "STATUSBAR_TAB_SIZE"                    : "Sarkaimen koko:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} rivi",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} riviä",
    
    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE"                    : "{0}-virheet",
    "SINGLE_ERROR"                          : "1 {0}-virhe",
    "MULTIPLE_ERRORS"                       : "{1} {0}-virhettä",
    "NO_ERRORS"                             : "Ei {0}-virheitä – hyvää työtä!",
    "LINT_DISABLED"                         : "Tarkistus on pois käytöstä",
    "NO_LINT_AVAILABLE"                     : "Tarkistinta ei saatavilla kohteelle {0}",
    "NOTHING_TO_LINT"                       : "Ei mitään tarkistettavaa",
    
    
    /**
     * Command Name Constants
     */

    // File menu commands
    "FILE_MENU"                           : "Tiedosto",
    "CMD_FILE_NEW_UNTITLED"               : "Uusi",
    "CMD_FILE_NEW"                        : "Uusi tiedosto",
    "CMD_FILE_NEW_FOLDER"                 : "Uusi kansio",
    "CMD_FILE_OPEN"                       : "Avaa\u2026",
    "CMD_ADD_TO_WORKING_SET"              : "Lisää työtilaan",
    "CMD_OPEN_DROPPED_FILES"              : "Avaa pudotetut tiedostot",
    "CMD_OPEN_FOLDER"                     : "Avaa kansio\u2026",
    "CMD_FILE_CLOSE"                      : "Sulje",
    "CMD_FILE_CLOSE_ALL"                  : "Sulje kaikki",
    "CMD_FILE_CLOSE_LIST"                 : "Sulje luettelo",
    "CMD_FILE_CLOSE_OTHERS"               : "Sulje muut",
    "CMD_FILE_CLOSE_ABOVE"                : "Sulje muut alapuolelta",
    "CMD_FILE_CLOSE_BELOW"                : "Sulje muut yläpuolelta",
    "CMD_FILE_SAVE"                       : "Tallenna",
    "CMD_FILE_SAVE_ALL"                   : "Tallenna kaikki",
    "CMD_FILE_SAVE_AS"                    : "Tallenna nimellä\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Esikatselu",
    "CMD_PROJECT_SETTINGS"                : "Projektin asetukset\u2026",
    "CMD_FILE_RENAME"                     : "Nimeä uudelleen",
    "CMD_FILE_DELETE"                     : "Poista",
    "CMD_INSTALL_EXTENSION"               : "Asenna laajennus\u2026",
    "CMD_EXTENSION_MANAGER"               : "Laajennusten hallinta\u2026",
    "CMD_FILE_REFRESH"                    : "Päivitä",
    "CMD_QUIT"                            : "Lopeta",
    // Used in native File menu on Windows
    "CMD_EXIT"                            : "Poistu",

    // Edit menu commands
    "EDIT_MENU"                           : "Muokkaa",
    "CMD_UNDO"                            : "Kumoa",
    "CMD_REDO"                            : "Tee uudelleen",
    "CMD_CUT"                             : "Leikkaa",
    "CMD_COPY"                            : "Kopioi",
    "CMD_PASTE"                           : "Liitä",
    "CMD_SELECT_ALL"                      : "Valitse kaikki",
    "CMD_SELECT_LINE"                     : "Valitse rivi",
    "CMD_FIND"                            : "Etsi",
    "CMD_FIND_IN_FILES"                   : "Etsi tiedostoista",
    "CMD_FIND_IN_SUBTREE"                 : "Etsi kohteesta\u2026",
    "CMD_FIND_NEXT"                       : "Etsi seuraava",
    "CMD_FIND_PREVIOUS"                   : "Etsi edellinen",
    "CMD_REPLACE"                         : "Korvaa",
    "CMD_INDENT"                          : "Sisennä",
    "CMD_UNINDENT"                        : "Poista sisennys",
    "CMD_DUPLICATE"                       : "Kahdenna",
    "CMD_DELETE_LINES"                    : "Poista rivi",
    "CMD_COMMENT"                         : "Muuta kommenttiriviksi",
    "CMD_BLOCK_COMMENT"                   : "Muuta kommenttilohkoksi",
    "CMD_LINE_UP"                         : "Siirrä rivi ylemmäs",
    "CMD_LINE_DOWN"                       : "Siirrä rivi alemmas",
    "CMD_OPEN_LINE_ABOVE"                 : "Avaa rivi yllä",
    "CMD_OPEN_LINE_BELOW"                 : "Avaa rivi alla",
    "CMD_TOGGLE_CLOSE_BRACKETS"           : "Sulje sulkeet automaattisesti",
    "CMD_SHOW_CODE_HINTS"                 : "Näytä koodivihjeet",
     
    // View menu commands
    "VIEW_MENU"                           : "Näytä",
    "CMD_HIDE_SIDEBAR"                    : "Piilota sivupalkki",
    "CMD_SHOW_SIDEBAR"                    : "Näytä sivupalkki",
    "CMD_INCREASE_FONT_SIZE"              : "Suurenna tekstikokoa",
    "CMD_DECREASE_FONT_SIZE"              : "Pienennä tekstikokoa",
    "CMD_RESTORE_FONT_SIZE"               : "Palauta tekstikoko",
    "CMD_SCROLL_LINE_UP"                  : "Vieritä rivi ylös",
    "CMD_SCROLL_LINE_DOWN"                : "Vieritä rivi alas",
    "CMD_TOGGLE_LINE_NUMBERS"             : "Rivinumerot",
    "CMD_TOGGLE_ACTIVE_LINE"              : "Korosta aktiivinen rivi",
    "CMD_TOGGLE_WORD_WRAP"                : "Tekstin rivitys",
    "CMD_LIVE_HIGHLIGHT"                  : "Esikatselun korostus",
    "CMD_VIEW_TOGGLE_INSPECTION"          : "Tarkista tiedostot tallennettaessa",
    "CMD_SORT_WORKINGSET_BY_ADDED"        : "Järjestä lisäysajan mukaan",
    "CMD_SORT_WORKINGSET_BY_NAME"         : "Järjestä nimen mukaan",
    "CMD_SORT_WORKINGSET_BY_TYPE"         : "Järjestä tyypin mukaan",
    "CMD_SORT_WORKINGSET_AUTO"            : "Automaattinen järjestys",

    // Navigate menu Commands
    "NAVIGATE_MENU"                       : "Siirry",
    "CMD_QUICK_OPEN"                      : "Pika-avaus",
    "CMD_GOTO_LINE"                       : "Siirry riville",
    "CMD_GOTO_DEFINITION"                 : "Etsi määrittely nopeasti",
    "CMD_GOTO_FIRST_PROBLEM"              : "Siirry ensimmäiseen virheeseen/varoitukseen",
    "CMD_TOGGLE_QUICK_EDIT"               : "Pikamuokkaus",
    "CMD_TOGGLE_QUICK_DOCS"               : "Pikadokumentaatio",
    "CMD_QUICK_EDIT_PREV_MATCH"           : "Edellinen vastaavuus",
    "CMD_QUICK_EDIT_NEXT_MATCH"           : "Seuraava vastaavuus",
    "CMD_CSS_QUICK_EDIT_NEW_RULE"         : "Uusi sääntö",
    "CMD_NEXT_DOC"                        : "Seuraava dokumentti",
    "CMD_PREV_DOC"                        : "Edellinen dokumentti",
    "CMD_SHOW_IN_TREE"                    : "Näytä tiedostopuussa",
    "CMD_SHOW_IN_OS"                      : "Näytä käyttöjärjestelmässä",
    
    // Help menu commands
    "HELP_MENU"                           : "Ohje",
    "CMD_CHECK_FOR_UPDATE"                : "Tarkista päivitykset",
    "CMD_HOW_TO_USE_BRACKETS"             : "Miten käyttää {APP_NAME}-sovellusta",
    "CMD_FORUM"                           : "{APP_NAME}-keskustelupalsta",
    "CMD_RELEASE_NOTES"                   : "Julkaisutiedot",
    "CMD_REPORT_AN_ISSUE"                 : "Ilmoita ongelmasta",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Näytä laajennusten kansio",
    "CMD_TWITTER"                         : "{TWITTER_NAME} Twitterissä",
    "CMD_ABOUT"                           : "Tietoja {APP_TITLE}-sovelluksesta",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "kokeellinen koontiversio",
    "DEVELOPMENT_BUILD"                    : "kehityskoontiversio",
    "OK"                                   : "OK",
    "DONT_SAVE"                            : "Älä tallenna",
    "SAVE"                                 : "Tallenna",
    "CANCEL"                               : "Peruuta",
    "DELETE"                               : "Poista",
    "RELOAD_FROM_DISK"                     : "Lataa uudelleen levyltä",
    "KEEP_CHANGES_IN_EDITOR"               : "Pidä muutokset editorissa",
    "CLOSE_DONT_SAVE"                      : "Sulje (älä tallenna)",
    "RELAUNCH_CHROME"                      : "Käynnistä Chrome uudelleen",
    "ABOUT"                                : "Tietoja",
    "CLOSE"                                : "Sulje",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_LINE3"                     : "Ilmoitukset ja ehdot liittyen kolmannen osapuolen ohjelmistoihin sijaitsevat osoitteessa <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> ja yhdistetty viitteisiin täällä.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentaatio ja lähdekoodi osoitteessa <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "He tekivät \u2764lla ja JavaScriptilla:",
    "ABOUT_TEXT_LINE6"                     : "Monet ihmiset (mutta meillä on ongelmia ladata näitä tietoja nyt).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Sovellusalustan dokumentaatiot ja sovellusalustan graafinen logo on lisensoitu Creative Commons Attribution -lisenssin alla, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "{APP_NAME}-sovelluksesta on saatavilla uusi versio! Napsauta tästä saadaksesi lisätietoja.",
    "UPDATE_AVAILABLE_TITLE"               : "Päivitys saatavilla",
    "UPDATE_MESSAGE"                       : "Hei! {APP_NAME}-sovelluksesta on saatavilla uusi versio. Tässä on joitakin uusista ominaisuuksista:",
    "GET_IT_NOW"                           : "Hae nyt!",
    "PROJECT_SETTINGS_TITLE"               : "Projektin asetukset kohteelle: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Esikatselun URL-osoite",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Käyttääksesi paikallista palvelinta anna URL, kuten http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Esikatselu ei tue {0}-protokollaa. Käytä joko http: tai https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL-osoite ei saa sisältää hakuparametreja, kuten ”{0}”.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL-osoite ei saa sisältää ristikkomerkkejä, kuten ”{0}”.",
    "BASEURL_ERROR_INVALID_CHAR"           : "Erikoismerkit, kuten '{0}', täytyy olla %-koodattu.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Tuntematon virhe URL-osoitteen jäsentämisessä",
    
    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Uusi sääntö",
    
    // Extension Management strings
    "INSTALL"                              : "Asenna",
    "UPDATE"                               : "Päivitä",
    "REMOVE"                               : "Poista",
    "OVERWRITE"                            : "Ylikirjoita",
    "CANT_REMOVE_DEV"                      : "Laajennukset ”dev”-kansiossa on poistettava käsin.",
    "CANT_UPDATE"                          : "Laajennus ei ole yhteensopiva tämän {APP_NAME}-version kanssa.",
    "INSTALL_EXTENSION_TITLE"              : "Asenna laajennus",
    "UPDATE_EXTENSION_TITLE"               : "Päivitä laajennus",
    "INSTALL_EXTENSION_LABEL"              : "Laajennuksen URL-osoite",
    "INSTALL_EXTENSION_HINT"               : "Laajennuksen zip-tiedoston URL-osoite tai GitHub repo",
    "INSTALLING_FROM"                      : "Asennetaan laajennus kohteesta {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Asennus on valmis!",
    "INSTALL_FAILED"                       : "Asennus epäonnistui.",
    "CANCELING_INSTALL"                    : "Peruutetaan\u2026",
    "CANCELING_HUNG"                       : "Asennuksen peruutus on kestänyt pitkään. On voinut tapahtua sisäinen virhe.",
    "INSTALL_CANCELED"                     : "Asennus peruutettu.",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Ladattu sisältö ei ole kelvollinen zip-tiedosto.",
    "INVALID_PACKAGE_JSON"                 : "Tiedosto package.json ei ole kelvollinen. (Virhe: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Tiedostolle package.json ei ole määritelty paketin nimeä.",
    "BAD_PACKAGE_NAME"                     : "{0} on virheellinen paketin nimi.",
    "MISSING_PACKAGE_VERSION"              : "Tiedostolle package.json ei ole määritelty paketin versiota.",
    "INVALID_VERSION_NUMBER"               : "Paketin versionumero ({0}) on virheellinen.",
    "INVALID_BRACKETS_VERSION"             : "{APP_NAME}-sovelluksen yhteensopivuuden merkkijono ({0}) on virheellinen.",
    "DISALLOWED_WORDS"                     : "Sanat ({1}) eivät ole sallittuja {0} kentässä.",
    "API_NOT_COMPATIBLE"                   : "Laajennus ei ole yhteensopiva tämän {APP_NAME}-version kanssa. Se on asennettu kelpaamattomien laajennusten kansioon.",
    "MISSING_MAIN"                         : "Paketissa ei ole main.js-tiedostoa.",
    "EXTENSION_ALREADY_INSTALLED"          : "Tämän paketin asennus korvaa aiemmin asennetun laajennuksen. Korvataanko vanha laajennus?",
    "EXTENSION_SAME_VERSION"               : "Tämä paketti on sama kuin jo asennettu versio. Korvataanko nykyinen asennus?",
    "EXTENSION_OLDER_VERSION"              : "Tämän paketin versio on {0}, joka on vanhempi kuin nykyinen asennettu ({1}). Korvataanko nykyinen asennus?",
    "DOWNLOAD_ID_IN_USE"                   : "Sisäinen virhe: Lataustunnus on jo käytössä.",
    "NO_SERVER_RESPONSE"                   : "Palvelimeen ei voida yhdistää.",
    "BAD_HTTP_STATUS"                      : "Tiedostoa ei löydy palvelimelta (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Latausta ei kyetty tallentamaan väliaikaiseen tiedostoon.",
    "ERROR_LOADING"                        : "Laajennus kohtasi virheen käynnistyessä.",
    "MALFORMED_URL"                        : "URL-osoite on virheellinen. Tarkista, että annoit sen oikein.",
    "UNSUPPORTED_PROTOCOL"                 : "URL-osoitteen on oltava protokollaltaan joko http tai https.",
    "UNKNOWN_ERROR"                        : "Tuntematon (sisäinen) virhe.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Laajennusten hallinta",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Virhe käytettäessä laajennusten rekisteriä. Yritä myöhemmin uudelleen.",
    "INSTALL_FROM_URL"                     : "Asenna URL-osoitteesta\u2026",
    "EXTENSION_AUTHOR"                     : "Tekijä",
    "EXTENSION_DATE"                       : "Päivämäärä",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Tämä laajennus vaatii uudemman {APP_NAME}-version.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Tämä laajennus toimii tällä hetkellä vain vanhemmilla {APP_NAME}-versioilla.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Tämän laajennuksen versio {0} vaatii uudemman {APP_NAME}-version, mutta voit asentaa aikaisemman version {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Tämän laajennuksen versio {0} toimii vain vanhemmilla {APP_NAME}-versioilla, mutta voit asentaa aikaisemman version {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Ei kuvausta",
    "EXTENSION_MORE_INFO"                  : "Lisätietoja...",
    "EXTENSION_ERROR"                      : "Laajennusvirhe",
    "EXTENSION_KEYWORDS"                   : "Avainsanat",
    "EXTENSION_INSTALLED"                  : "Asennettu",
    "EXTENSION_UPDATE_INSTALLED"           : "Tämä laajennuksen päivitys on ladattu ja asennetaan, kun poistut {APP_NAME}-sovelluksesta.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Haku",
    "EXTENSION_MORE_INFO_LINK"             : "Lisää",
    "BROWSE_EXTENSIONS"                    : "Selaa laajennuksia",
    "EXTENSION_MANAGER_REMOVE"             : "Poista laajennus",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Virhe poistettaessa yhtä tai useampaa laajennusta: {0}. {APP_NAME} haluaa yhä sulkeutua.",
    "EXTENSION_MANAGER_UPDATE"             : "Päivitä laajennus",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Virhe päivittäessä yhtä tai useampaa laajennusta: {0}. {APP_NAME} haluaa yhä sulkeutua.",
    "MARKED_FOR_REMOVAL"                   : "Merkitty poistettavaksi",
    "UNDO_REMOVE"                          : "Kumoa",
    "MARKED_FOR_UPDATE"                    : "Merkitty päivitettäväksi",
    "UNDO_UPDATE"                          : "Kumoa",
    "CHANGE_AND_QUIT_TITLE"                : "Muuta laajennuksia",
    "CHANGE_AND_QUIT_MESSAGE"              : "Päivittääksesi tai poistaaksesi valitut laajennukset sinun tarvitsee sulkea ja käynnistää {APP_NAME} uudelleen. Sinulta kysytään tallentamattomien muutosten tallentamista.",
    "REMOVE_AND_QUIT"                      : "Poista laajennukset ja poistu",
    "CHANGE_AND_QUIT"                      : "Muuta laajennuksia ja poistu",
    "UPDATE_AND_QUIT"                      : "Päivitä laajennukset ja poistu",
    "EXTENSION_NOT_INSTALLED"              : "Ei voida poistaa laajennusta {0}, koska sitä ei ole asennettu.",
    "NO_EXTENSIONS"                        : "Laajennuksia ei ole vielä asennettu.<br>Napsauta ”Asenna URL-osoitteesta” -painiketta alhaalta aloittaaksesi.",
    "NO_EXTENSION_MATCHES"                 : "Mikään laajennus ei vastannut hakuasi.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "Ole varovainen asentaessasi laajennuksia tuntemattomasta lähteestä.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Asennettu",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Saatavilla",
    "EXTENSIONS_UPDATES_TITLE"             : "Päivitykset",
    
    "INLINE_EDITOR_NO_MATCHES"             : "Vastaavuuksia ei saatavilla.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Valintaasi vastaavia CSS-sääntöjä ei ole.<br> Napsauta ”Uusi sääntö” luodaksesi uuden.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Projektissasi ei ole tyylitiedostoja.<br>Luo sellainen lisätäksesi CSS-sääntöjä.",
    
    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pikseliä",
    
    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Kehitys",
    "CMD_SHOW_DEV_TOOLS"                        : "Näytä kehitystyökalut",
    "CMD_REFRESH_WINDOW"                        : "Päivitä {APP_NAME}",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Uusi {APP_NAME}-ikkuna",
    "CMD_SWITCH_LANGUAGE"                       : "Vaihda kieltä",
    "CMD_RUN_UNIT_TESTS"                        : "Suorita testejä",
    "CMD_SHOW_PERF_DATA"                        : "Näytä suorituskyvyn tiedot",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Ota Noden virheenjäljitin käyttöön",
    "CMD_LOG_NODE_STATE"                        : "Kirjaa Noden tila konsoliin",
    "CMD_RESTART_NODE"                          : "Käynnistä Node uudelleen",
    
    "LANGUAGE_TITLE"                            : "Vaihda kieltä",
    "LANGUAGE_MESSAGE"                          : "Kieli:",
    "LANGUAGE_SUBMIT"                           : "Päivitä {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Peruuta",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Järjestelmän oletus",
    
    // Locales (used by Debug > Switch Language)
    "LOCALE_CS"                                 : "tšekki",
    "LOCALE_DE"                                 : "saksa",
    "LOCALE_EN"                                 : "englanti",
    "LOCALE_ES"                                 : "espanja",
    "LOCALE_FI"                                 : "suomi",
    "LOCALE_FR"                                 : "ranska",
    "LOCALE_IT"                                 : "italia",
    "LOCALE_JA"                                 : "japani",
    "LOCALE_NB"                                 : "norja",
    "LOCALE_PL"                                 : "puola",
    "LOCALE_PT_BR"                              : "portugali, Brasilia",
    "LOCALE_PT_PT"                              : "portugali",
    "LOCALE_RU"                                 : "venäjä",
    "LOCALE_SK"                                 : "slovakia",
    "LOCALE_SR"                                 : "serbia",
    "LOCALE_SV"                                 : "ruotsi",
    "LOCALE_TR"                                 : "turkki",
    "LOCALE_ZH_CN"                              : "kiina, yksinkertaistettu",
    "LOCALE_HU"                                 : "unkari",
    
    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Aika",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Edistyminen",
    
    // extensions/default/InlineColorEditor
    "COLOR_EDITOR_CURRENT_COLOR_SWATCH_TIP"     : "Nykyinen väri",
    "COLOR_EDITOR_ORIGINAL_COLOR_SWATCH_TIP"    : "Alkuperäinen väri",
    "COLOR_EDITOR_RGBA_BUTTON_TIP"              : "RGBa-muoto",
    "COLOR_EDITOR_HEX_BUTTON_TIP"               : "Hex-muoto",
    "COLOR_EDITOR_HSLA_BUTTON_TIP"              : "HSLa-muoto",
    "COLOR_EDITOR_USED_COLOR_TIP_SINGULAR"      : "{0} (käytetty {1} kerran)",
    "COLOR_EDITOR_USED_COLOR_TIP_PLURAL"        : "{0} (käytetty {1} kertaa)",
    
    // extensions/default/JavaScriptCodeHints
    "CMD_JUMPTO_DEFINITION"                     : "Hyppää määrittelyyn",
    "CMD_SHOW_PARAMETER_HINT"                   : "Näytä parametrivihje",
    "NO_ARGUMENTS"                              : "<ei parametreja>",
    
    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",
    
    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Pikanäkymä osoittaessa",
    
    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Viimeisimmät projektit",
    
    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Lue lisää"
});
