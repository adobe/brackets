/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
    "CONTENTS_MODIFIED_ERR"             : "Tiedostoa on muokattu {APP_NAME}in ulkopuolella.",
    "UNSUPPORTED_ENCODING_ERR"          : "{APP_NAME} tukee tällä hetkellä vain UTF-8-koodattuja tekstitiedostoja.",
    "FILE_EXISTS_ERR"                   : "Tiedosto tai hakemisto on jo olemassa.",
    "FILE"                              : "tiedosto",
    "FILE_TITLE"                        : "tiedosto",
    "DIRECTORY"                         : "hakemisto",
    "DIRECTORY_TITLE"                   : "hakemisto",
    "DIRECTORY_NAMES_LEDE"              : "Hakemistojen nimet",
    "FILENAMES_LEDE"                    : "Tiedostonimet",
    "FILENAME"                          : "tiedostonimi",
    "DIRECTORY_NAME"                    : "hakemiston nimi",


    // Project error strings
    "ERROR_LOADING_PROJECT"             : "Virhe ladattaessa projektia",
    "OPEN_DIALOG_ERROR"                 : "Tapahtui virhe avattaessa tiedostovalintaikkunaa. (virhe {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR"  : "Tapahtui virhe yritettäessä avata hakemistoa <span class='dialog-filename'>{0}</span>. (virhe {1})",
    "READ_DIRECTORY_ENTRIES_ERROR"      : "Tapahtui virhe luettaessa hakemiston <span class='dialog-filename'>{0}</span> sisältöä. (virhe {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE"          : "Virhe avattaessa tiedostoa",
    "ERROR_OPENING_FILE"                : "Tapahtui virhe yritettäessä avata tiedostoa <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES"               : "Tapahtui virhe yritettäessä avata seuraavia tiedostoja:",
    "ERROR_RELOADING_FILE_TITLE"        : "Virhe päivitettäessä muutoksia levyltä",
    "ERROR_RELOADING_FILE"              : "Tapahtui virhe yritettäessä päivittää tiedostoa <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE"           : "Virhe tallennettaessa tiedostoa",
    "ERROR_SAVING_FILE"                 : "Tapahtui virhe yritettäessä tallentaa tiedostoa <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE"         : "Virhe nimettäessä {0}a uudelleen",
    "ERROR_RENAMING_FILE"               : "Tapahtui virhe yritettäessä nimetä uudelleen {2}a <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE"         : "Virhe poistettaessa {0}a",
    "ERROR_DELETING_FILE"               : "Tapahtui virhe yritettäessä poistaa {2} <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE"            : "Virheellinen {0}",
    "INVALID_FILENAME_MESSAGE"          : "{0} ei voi käyttää mitään järjestelmän varaamia sanoja, päättyä pisteeseen (.) tai käyttää mitään seuraavista merkeistä: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS"       : "Tiedosto tai hakemisto nimellä <span class='dialog-filename'>{0}</span> on jo olemassa.",
    "ERROR_CREATING_FILE_TITLE"         : "Virhe luotaessa {0}a",
    "ERROR_CREATING_FILE"               : "Virhe yritettäessä luoda {0}a <span class='dialog-filename'>{1}</span>. {2}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE"         : "Virhe luettaessa asetuksia",
    "ERROR_PREFS_CORRUPT"               : "Asetustiedosto on virheellistä JSON-koodia. Tiedosto avataan, jotta voit korjata sen muodon. Sinun tulee käynnistää {APP_NAME} uudelleen saadaksesi muutokset voimaan.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE"            : "Ups! {APP_NAME} ei toimi vielä selaimissa.",
    "ERROR_IN_BROWSER"                  : "{APP_NAME} on rakennettu HTML:llä, mutta juuri nyt se toimii kuten työpöydän sovellus, jotta voit käyttää sitä paikallisten tiedostojen muokkaamiseen. Käytäthän osoitteen <b>github.com/adobe/brackets-shell</b> arkiston sovellusliittymää suorittaaksesi {APP_NAME}in.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE"             : "Virhe tiedostojen indeksoinnissa",
    "ERROR_MAX_FILES"                   : "Tämä projekti sisältää yli 30&nbsp;000 tiedostoa. Useiden tiedostojen välillä toimivat ominaisuudet poistetaan käytöstä, tai ne toimivat niin kuin projekti olisi tyhjä. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>Lue lisää suurten projektien kanssa työskentelemisestä</a>.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE"     : "Virhe käynnistettäessä selainta",
    "ERROR_CANT_FIND_CHROME"            : "Google Chrome -selainta ei löydy. Varmista, että se on asennettu.",
    "ERROR_LAUNCHING_BROWSER"           : "Tapahtui virhe käynnistettäessä selainta. (virhe {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE"      : "Esikatselun virhe",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE"   : "Yhdistetään selaimeen",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE"    : "Jotta esikatselu voi yhdistää, Chromen on käynnistyttävä uudelleen etävirheenjäljitys käytössä.<br /><br />Haluatko käynnistää Chromen uudelleen ja aktivoida etävirheenjäljityksen?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE"    : "Ei kyetty lataamaan esikatselun sivua",
    "LIVE_DEV_NEED_HTML_MESSAGE"        : "Avaa HTML-tiedosto tai varmista, että projektissasi on index.html-tiedosto käynnistääksesi esikatselun.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE"     : "Käynnistääksesi esikatselun palvelimella sijaitsevalla tiedostolla on tämän projektin URL-osoite määritettävä.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE" : "Virhe käynnistettäessä HTTP-palvelinta esikatselun tiedostoille. Yritäthän uudelleen.",
    "LIVE_DEVELOPMENT_INFO_TITLE"       : "Tervetuloa esikatseluun!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE"     : "Esikatselu yhdistää {APP_NAME}in selaimeesi. Se avaa HTML-tiedostosi esikatselun selaimessa ja päivittyy sitten välittömästi muokatessasi koodia.<br /><br />Tässä varhaisessa {APP_NAME}-versiossa esikatselu toimii vain <strong>Google Chrome</strong>-selaimella ja päivittyy reaaliaikaisesti muokatessasi <strong>CSS- tai HTML-tiedostoja</strong>. Muutokset JavaScript-tiedostoihin päivittyvät tallentaessasi ne.<br /><br />(Näet tämän viestin vain kerran.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING"  : "Saadaksesi lisätietoja katso <a href='{0}' title='{0}'>Troubleshooting Live Preview connection errors</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED" : "Esikatselu",
    "LIVE_DEV_STATUS_TIP_PROGRESS1"     : "Esikatselu: Yhdistetään\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2"     : "Esikatselu: Valmistellaan\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED"     : "Katkaise esikatselun yhteys",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC"   : "Esikatselu (tallenna tiedosto päivittämiseksi)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR"    : "Esikatselu (ei päivity syntaksivirheen takia)",

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
    "EXT_MODIFIED_WARNING"              : "<span class='dialog-filename'>{0}</span> on muuttunut levyllä.<br /><br />Haluatko tallentaa tiedoston ja korvata nuo muutokset?",
    "EXT_MODIFIED_MESSAGE"              : "<span class='dialog-filename'>{0}</span> on muuttunut levyllä, mutta sillä on myös tallentamattomia muutoksia {APP_NAME}issa.<br /><br />Kumman version haluat säilyttää?",
    "EXT_DELETED_MESSAGE"               : "<span class='dialog-filename'>{0}</span> on poistettu levyltä, mutta sillä on tallentamattomia muutoksia {APP_NAME}issa.<br /><br />Haluatko säilyttää muutoksesi?",

    // Generic dialog/button labels
    "DONE"                              : "Valmis",
    "OK"                                : "OK",
    "CANCEL"                            : "Peruuta",
    "DONT_SAVE"                         : "Älä tallenna",
    "SAVE"                              : "Tallenna",
    "SAVE_AS"                           : "Tallenna nimellä\u2026",
    "SAVE_AND_OVERWRITE"                : "Korvaa",
    "DELETE"                            : "Poista",
    "BUTTON_YES"                        : "Kyllä",
    "BUTTON_NO"                         : "Ei",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX"                  : "{0} / {1}",
    "FIND_NO_RESULTS"                   : "Ei tuloksia",
    "FIND_QUERY_PLACEHOLDER"            : "Etsi\u2026",
    "REPLACE_PLACEHOLDER"               : "Korvaa merkkijonolla\u2026",
    "BUTTON_REPLACE_ALL"                : "Kaikki\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES"       : "Korvaa\u2026",
    "BUTTON_REPLACE"                    : "Korvaa",
    "BUTTON_NEXT"                       : "\u25B6",
    "BUTTON_PREV"                       : "\u25C0",
    "BUTTON_NEXT_HINT"                  : "Seuraava vastaavuus",
    "BUTTON_PREV_HINT"                  : "Edellinen vastaavuus",
    "BUTTON_CASESENSITIVE_HINT"         : "Huomioi kirjainkoko",
    "BUTTON_REGEXP_HINT"                : "Säännöllinen lauseke",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Korvaa kumoamatta",
    "REPLACE_WITHOUT_UNDO_WARNING"      : "Koska yli {0} tiedoston on muututtava, {APP_NAME} muokkaa avaamattomia tiedostoja levyllä.<br />Et voi perua korvauksia näissä tiedostoissa.",
    "BUTTON_REPLACE_WITHOUT_UNDO"       : "Korvaa kumoamatta",

    "OPEN_FILE"                         : "Avaa tiedosto",
    "SAVE_FILE_AS"                      : "Tallenna tiedosto",
    "CHOOSE_FOLDER"                     : "Valitse kansio",

    "RELEASE_NOTES"                     : "Julkaisutiedot",
    "NO_UPDATE_TITLE"                   : "Olet ajan tasalla!",
    "NO_UPDATE_MESSAGE"                 : "Käytät uusinta {APP_NAME}-versiota.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL"          : "Korvaa",
    "FIND_REPLACE_TITLE_WITH"           : "merkkijonolla",
    "FIND_TITLE_LABEL"                  : "löytyi",
    "FIND_TITLE_SUMMARY"                : "&mdash; {0} {1} {2} kohteessa {3}",

    // Find in Files
    "FIND_NUM_FILES"                    : "{0} {1}",
    "FIND_IN_FILES_SCOPED"              : "kohteesta <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE"            : "projektissa",
    "FIND_IN_FILES_ZERO_FILES"          : "Suodatin ohittaa kaikki tiedostot {0}",
    "FIND_IN_FILES_FILE"                : "tiedosto",
    "FIND_IN_FILES_FILES"               : "tiedostoa",
    "FIND_IN_FILES_MATCH"               : "vastaavuus",
    "FIND_IN_FILES_MATCHES"             : "vastaavuutta",
    "FIND_IN_FILES_MORE_THAN"           : "Yli ",
    "FIND_IN_FILES_PAGING"              : "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH"           : "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE"     : "Paina Ctrl/Cmd laajentaaksesi tai pienentääksesi kaikki",
    "REPLACE_IN_FILES_ERRORS_TITLE"     : "Korvausvirheet",
    "REPLACE_IN_FILES_ERRORS"           : "Seuraavia tiedostoja ei muokattu, koska ne muuttuivat haun jälkeen tai niihin ei voitu kirjoittaa.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE"  : "Virhe noudettaessa päivitystietoja",
    "ERROR_FETCHING_UPDATE_INFO_MSG"    : "Viimeisimpien päivitystietojen noutamisessa palvelimelta oli ongelma. Varmista olevasi yhteydessä verkkoon ja yritä uudelleen.",

    // File exclusion filters
    "NEW_FILE_FILTER"                   : "Uusi ohitusjoukko\u2026",
    "CLEAR_FILE_FILTER"                 : "Älä ohita tiedostoja",
    "NO_FILE_FILTER"                    : "Tiedostoja ei ohitettu",
    "EXCLUDE_FILE_FILTER"               : "Ohita {0}",
    "EDIT_FILE_FILTER"                  : "Muokkaa\u2026",
    "FILE_FILTER_DIALOG"                : "Muokkaa ohitusjoukkoa",
    "FILE_FILTER_INSTRUCTIONS"          : "Ohita tiedostoja ja kansioita sovittamalla yhteen mikä tahansa seuraavista merkkijonoista / alimerkkijonoista tai <a href='{0}' title='{0}'>jokerimerkeistä</a>. Syötä jokainen merkkijono uudelle riville.",
    "FILTER_NAME_PLACEHOLDER"           : "Tämän ohitusjoukon nimi (valinnainen)",
    "FILE_FILTER_CLIPPED_SUFFIX"        : "ja {0} lisää",
    "FILTER_COUNTING_FILES"             : "Lasketaan tiedostoja\u2026",
    "FILTER_FILE_COUNT"                 : "Sallii {0} tiedostoa {1} tiedostosta {2}",
    "FILTER_FILE_COUNT_ALL"             : "Sallii kaikki {0} tiedostoa {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND"   : "Pikamuokkaus ei ole saatavilla osoittimen nykyiselle sijainnille",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES"     : "CSS-pikamuokkaus: sijoita osoitin yksittäisen class-nimen päälle",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND"      : "CSS-pikamuokkaus: puutteellinen class-attribuutti",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND"         : "CSS-pikamuokkaus: puutteellinen id-attribuutti",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR"    : "CSS-pikamuokkaus: sijoita osoitin tagin, class- tai id-attribuutin sisälle",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX"   : "CSS:n aikafunktion pikamuokkaus: virheellinen syntaksi",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND"    : "JS-pikamuokkaus: sijoita osoitin funktion nimen sisälle",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND"   : "Pikadokumentaatio ei ole saatavilla osoittimen nykyiselle sijainnille",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING"   : "Ladataan\u2026",
    "UNTITLED"          : "Nimetön",
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
    "STATUSBAR_CURSOR_POSITION"             : "Rivi {0}, sarake {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR"       : " \u2014 Valittu {0} merkki",
    "STATUSBAR_SELECTION_CH_PLURAL"         : " \u2014 Valittu {0} merkkiä",
    "STATUSBAR_SELECTION_LINE_SINGULAR"     : " \u2014 Valittu {0} rivi",
    "STATUSBAR_SELECTION_LINE_PLURAL"       : " \u2014 Valittu {0} riviä",
    "STATUSBAR_SELECTION_MULTIPLE"          : " \u2014 {0} valintaa",
    "STATUSBAR_INDENT_TOOLTIP_SPACES"       : "Napsauta muuttaaksesi sisennys välilyönneiksi",
    "STATUSBAR_INDENT_TOOLTIP_TABS"         : "Napsauta muuttaaksesi sisennys sarkainmerkeiksi",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES"  : "Napsauta muuttaaksesi sisennyksenä käytettävien välilyöntien määrää",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS"    : "Napsauta muuttaaksesi sarkainmerkin leveyttä",
    "STATUSBAR_SPACES"                      : "Välilyönnit:",
    "STATUSBAR_TAB_SIZE"                    : "Sarkaimen koko:",
    "STATUSBAR_LINE_COUNT_SINGULAR"         : "\u2014 {0} rivi",
    "STATUSBAR_LINE_COUNT_PLURAL"           : "\u2014 {0} riviä",
    "STATUSBAR_USER_EXTENSIONS_DISABLED"    : "Laajennukset poistettu käytöstä",
    "STATUSBAR_INSERT"                      : "INS",
    "STATUSBAR_OVERWRITE"                   : "OVR",
    "STATUSBAR_INSOVR_TOOLTIP"              : "Vaihda kohdistimen sijoitus- (INS) ja korvaus (OVR) -tilojen välillä napsauttamalla",
    "STATUSBAR_LANG_TOOLTIP"                : "Vaihda tiedostotyyppiä napsauttamalla",
    "STATUSBAR_CODE_INSPECTION_TOOLTIP"     : "{0}. Näytä tai piilota raporttipaneeli napsauttamalla.",
    "STATUSBAR_DEFAULT_LANG"                : "(oletus)",
    "STATUSBAR_SET_DEFAULT_LANG"            : "Aseta oletukseksi .{0}-tiedostoille",

    // CodeInspection: errors/warnings
    "ERRORS_PANEL_TITLE_MULTIPLE"           : "{0}-ongelmat",
    "SINGLE_ERROR"                          : "1 {0}-ongelma",
    "MULTIPLE_ERRORS"                       : "{1} {0}-ongelmaa",
    "NO_ERRORS"                             : "{0}-ongelmia ei löytynyt – hyvää työtä!",
    "NO_ERRORS_MULTIPLE_PROVIDER"           : "Ongelmia ei löytynyt – hyvää työtä!",
    "LINT_DISABLED"                         : "Tarkistus on pois käytöstä",
    "NO_LINT_AVAILABLE"                     : "Tarkistinta ei saatavilla kohteelle {0}",
    "NOTHING_TO_LINT"                       : "Ei mitään tarkistettavaa",
    "LINTER_TIMED_OUT"                      : "{0} on aikakatkaistu {1} ms:n odotuksen jälkeen",
    "LINTER_FAILED"                         : "{0} keskeytyi virheeseen: {1}",


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
    "CMD_FILE_CLOSE_ABOVE"                : "Sulje muut yläpuolelta",
    "CMD_FILE_CLOSE_BELOW"                : "Sulje muut alapuolelta",
    "CMD_FILE_SAVE"                       : "Tallenna",
    "CMD_FILE_SAVE_ALL"                   : "Tallenna kaikki",
    "CMD_FILE_SAVE_AS"                    : "Tallenna nimellä\u2026",
    "CMD_LIVE_FILE_PREVIEW"               : "Esikatselu",
    "CMD_RELOAD_LIVE_PREVIEW"             : "Pakota esikatselun päivitys",
    "CMD_PROJECT_SETTINGS"                : "Projektin asetukset\u2026",
    "CMD_FILE_RENAME"                     : "Nimeä uudelleen",
    "CMD_FILE_DELETE"                     : "Poista",
    "CMD_INSTALL_EXTENSION"               : "Asenna laajennus\u2026",
    "CMD_EXTENSION_MANAGER"               : "Laajennusten hallinta\u2026",
    "CMD_FILE_REFRESH"                    : "Päivitä tiedostopuu",
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
    "CMD_SPLIT_SEL_INTO_LINES"            : "Jaa valinta riveihin",
    "CMD_ADD_CUR_TO_NEXT_LINE"            : "Lisää osoitin seuraavalle riville",
    "CMD_ADD_CUR_TO_PREV_LINE"            : "Lisää osoitin edelliselle riville",
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

    // Search menu commands
    "FIND_MENU"                           : "Etsi",
    "CMD_FIND"                            : "Etsi",
    "CMD_FIND_NEXT"                       : "Etsi seuraava",
    "CMD_FIND_PREVIOUS"                   : "Etsi edellinen",
    "CMD_FIND_ALL_AND_SELECT"             : "Etsi kaikki ja valitse",
    "CMD_ADD_NEXT_MATCH"                  : "Lisää seuraava vastaavuus valintaan",
    "CMD_SKIP_CURRENT_MATCH"              : "Ohita ja lisää seuraava vastavuus",
    "CMD_FIND_IN_FILES"                   : "Etsi tiedostoista",
    "CMD_FIND_IN_SELECTED"                : "Etsi valitusta tiedostosta/kansiosta",
    "CMD_FIND_IN_SUBTREE"                 : "Etsi kohteesta\u2026",
    "CMD_REPLACE"                         : "Korvaa",
    "CMD_REPLACE_IN_FILES"                : "Korvaa tiedostoissa",
    "CMD_REPLACE_IN_SELECTED"             : "Korvaa valitussa tiedostossa/kansiossa",
    "CMD_REPLACE_IN_SUBTREE"              : "Korvaa kohteessa\u2026",

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
    "CMD_THEMES"                          : "Teemat\u2026",

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
    "CMD_SHOW_IN_EXPLORER"                : "Näytä Resurssienhallinnassa",
    "CMD_SHOW_IN_FINDER"                  : "Näytä Finderissä",
    "CMD_SHOW_IN_OS"                      : "Näytä käyttöjärjestelmässä",

    // Help menu commands
    "HELP_MENU"                           : "Ohje",
    "CMD_CHECK_FOR_UPDATE"                : "Tarkista päivitykset",
    "CMD_HOW_TO_USE_BRACKETS"             : "Miten käyttää {APP_NAME}ia",
    "CMD_SUPPORT"                         : "{APP_NAME}-tuki",
    "CMD_SUGGEST"                         : "Ehdota ominaisuutta",
    "CMD_RELEASE_NOTES"                   : "Julkaisutiedot",
    "CMD_GET_INVOLVED"                    : "Lähde mukaan",
    "CMD_SHOW_EXTENSIONS_FOLDER"          : "Näytä laajennusten kansio",
    "CMD_HOMEPAGE"                        : "{APP_TITLE}in kotisivut",
    "CMD_TWITTER"                         : "{TWITTER_NAME} Twitterissä",
    "CMD_ABOUT"                           : "Tietoja {APP_TITLE}-sovelluksesta",
    "CMD_OPEN_PREFERENCES"                : "Avaa asetustiedosto",

    // Strings for main-view.html
    "EXPERIMENTAL_BUILD"                   : "kokeellinen koontiversio",
    "DEVELOPMENT_BUILD"                    : "kehityskoontiversio",
    "RELOAD_FROM_DISK"                     : "Lataa uudelleen levyltä",
    "KEEP_CHANGES_IN_EDITOR"               : "Pidä muutokset editorissa",
    "CLOSE_DONT_SAVE"                      : "Sulje (Älä tallenna)",
    "RELAUNCH_CHROME"                      : "Käynnistä Chrome uudelleen",
    "ABOUT"                                : "Tietoja",
    "CLOSE"                                : "Sulje",
    "ABOUT_TEXT_LINE1"                     : "sprint {VERSION_MINOR} {BUILD_TYPE} {VERSION}",
    "ABOUT_TEXT_BUILD_TIMESTAMP"           : "koontiversion aikaleima: ",
    "ABOUT_TEXT_LINE3"                     : "Kolmannen osapuolen ohjelmistoihin liittyvät ilmoitukset ja ehdot sijaitsevat osoitteessa <a href='{ADOBE_THIRD_PARTY}'>{ADOBE_THIRD_PARTY}</a> ja yhdistetään viitteisiin tässä.",
    "ABOUT_TEXT_LINE4"                     : "Dokumentaatio ja lähdekoodi osoitteessa <a href='https://github.com/adobe/brackets/'>https://github.com/adobe/brackets/</a>",
    "ABOUT_TEXT_LINE5"                     : "He tekivät tämän \u2764:lla ja JavaScriptillä:",
    "ABOUT_TEXT_LINE6"                     : "Monet ihmiset (mutta meillä on ongelmia ladata näitä tietoja nyt).",
    "ABOUT_TEXT_WEB_PLATFORM_DOCS"         : "Web Platform -dokumentit ja graafinen Web Platform -logo on lisensoitu Creative Commons Attribution -lisenssillä, <a href='{WEB_PLATFORM_DOCS_LICENSE}'>CC-BY 3.0 Unported</a>.",
    "UPDATE_NOTIFICATION_TOOLTIP"          : "{APP_NAME}ista on saatavilla uusi versio! Napsauta tästä saadaksesi lisätietoja.",
    "UPDATE_AVAILABLE_TITLE"               : "Päivitys saatavilla",
    "UPDATE_MESSAGE"                       : "Hei, {APP_NAME}ista on saatavilla uusi versio. Tässä on joitakin uusista ominaisuuksista:",
    "GET_IT_NOW"                           : "Hae nyt!",
    "PROJECT_SETTINGS_TITLE"               : "Projektin asetukset kohteelle: {0}",
    "PROJECT_SETTING_BASE_URL"             : "Esikatselun URL-osoite",
    "PROJECT_SETTING_BASE_URL_HINT"        : "Käyttääksesi paikallista palvelinta anna url, kuten http://localhost:8000/",
    "BASEURL_ERROR_INVALID_PROTOCOL"       : "Esikatselu ei tue {0}-protokollaa. Käytä joko http: tai https: .",
    "BASEURL_ERROR_SEARCH_DISALLOWED"      : "URL-osoite ei voi sisältää hakuparametreja, kuten ”{0}”.",
    "BASEURL_ERROR_HASH_DISALLOWED"        : "URL-osoite ei voi sisältää ristikkomerkkejä, kuten ”{0}”.",
    "BASEURL_ERROR_INVALID_CHAR"           : "Erikoismerkkkien, kuten ’{0}’, täytyy olla %-koodattu.",
    "BASEURL_ERROR_UNKNOWN_ERROR"          : "Tuntematon virhe URL-osoitteen jäsentämisessä",

    // Strings for themes-settings.html and themes-general.html
    "CURRENT_THEME"                        : "Nykyinen teema",
    "USE_THEME_SCROLLBARS"                 : "Käytä teeman vierityspalkkeja",
    "FONT_SIZE"                            : "Kirjasimen koko",
    "FONT_FAMILY"                          : "Kirjasinperhe",
    "THEMES_SETTINGS"                      : "Teemojen asetukset",

    // CSS Quick Edit
    "BUTTON_NEW_RULE"                      : "Uusi sääntö",

    // Extension Management strings
    "INSTALL"                              : "Asenna",
    "UPDATE"                               : "Päivitä",
    "REMOVE"                               : "Poista",
    "OVERWRITE"                            : "Korvaa",
    "CANT_REMOVE_DEV"                      : "Kansion ”dev” laajennukset on poistettava käsin.",
    "CANT_UPDATE"                          : "Laajennus ei ole yhteensopiva tämän {APP_NAME}-version kanssa.",
    "CANT_UPDATE_DEV"                      : "Kansion ”dev” laajennuksia ei voida päivittää automaattisesti.",
    "INSTALL_EXTENSION_TITLE"              : "Asenna laajennus",
    "UPDATE_EXTENSION_TITLE"               : "Päivitä laajennus",
    "INSTALL_EXTENSION_LABEL"              : "Laajennuksen URL-osoite",
    "INSTALL_EXTENSION_HINT"               : "Laajennuksen zip-tiedoston URL-osoite tai GitHub-varasto",
    "INSTALLING_FROM"                      : "Asennetaan laajennus kohteesta {0}\u2026",
    "INSTALL_SUCCEEDED"                    : "Asennus on valmis!",
    "INSTALL_FAILED"                       : "Asennus epäonnistui.",
    "CANCELING_INSTALL"                    : "Peruutetaan\u2026",
    "CANCELING_HUNG"                       : "Asennuksen peruutus kestää pitkään. On saattanut tapahtua sisäinen virhe.",
    "INSTALL_CANCELED"                     : "Asennus on peruutettu.",
    "VIEW_COMPLETE_DESCRIPTION"            : "Näytä täysi kuvaus",
    "VIEW_TRUNCATED_DESCRIPTION"           : "Näytä katkaistu kuvaus",
    // These must match the error codes in ExtensionsDomain.Errors.* :
    "INVALID_ZIP_FILE"                     : "Ladattu sisältö ei ole kelvollinen zip-tiedosto.",
    "INVALID_PACKAGE_JSON"                 : "Tiedosto package.json on virheellinen. (virhe: {0}).",
    "MISSING_PACKAGE_NAME"                 : "Tiedostolle package.json ei ole määritelty paketin nimeä.",
    "BAD_PACKAGE_NAME"                     : "{0} on virheellinen paketin nimi.",
    "MISSING_PACKAGE_VERSION"              : "Tiedostolle package.json ei ole määritelty paketin versiota.",
    "INVALID_VERSION_NUMBER"               : "Paketin versionumero ({0}) on virheellinen.",
    "INVALID_BRACKETS_VERSION"             : "{APP_NAME}in yhteensopivuuden merkkijono ({0}) on virheellinen.",
    "DISALLOWED_WORDS"                     : "Sanat ({1}) eivät ole sallittuja {0} kentässä.",
    "API_NOT_COMPATIBLE"                   : "Laajennus ei ole yhteensopiva tämän {APP_NAME}-version kanssa. Se on asennettu kelpaamattomien laajennusten kansioon.",
    "MISSING_MAIN"                         : "Paketissa ei ole main.js-tiedostoa.",
    "EXTENSION_ALREADY_INSTALLED"          : "Tämän paketin asennus korvaa aiemmin asennetun laajennuksen. Korvataanko vanha laajennus?",
    "EXTENSION_SAME_VERSION"               : "Tämä paketti on sama kuin jo asennettu versio. Korvataanko nykyinen asennus?",
    "EXTENSION_OLDER_VERSION"              : "Tämän paketin versio on {0}, joka on vanhempi kuin nykyinen asennettu ({1}). Korvataanko nykyinen asennus?",
    "DOWNLOAD_ID_IN_USE"                   : "Sisäinen virhe: Lataustunnus on jo käytössä.",
    "NO_SERVER_RESPONSE"                   : "Palvelimeen ei voida yhdistää.",
    "BAD_HTTP_STATUS"                      : "Tiedostoa ei löydy palvelimelta (HTTP {0}).",
    "CANNOT_WRITE_TEMP"                    : "Latausta ei kyetty tallentamaan väliaistiedostoon.",
    "ERROR_LOADING"                        : "Laajennus kohtasi virheen käynnistyessä.",
    "MALFORMED_URL"                        : "URL-osoite on virheellinen. Tarkista, että annoit sen oikein.",
    "UNSUPPORTED_PROTOCOL"                 : "URL-osoitteen on oltava http- tai https-URL.",
    "UNKNOWN_ERROR"                        : "Tuntematon sisäinen virhe.",
    // For NOT_FOUND_ERR, see generic strings above
    "EXTENSION_MANAGER_TITLE"              : "Laajennusten hallinta",
    "EXTENSION_MANAGER_ERROR_LOAD"         : "Virhe käytettäessä laajennusten rekisteriä. Yritä myöhemmin uudelleen.",
    "INSTALL_EXTENSION_DRAG"               : "Vedä .zip-paketti tähän tai",
    "INSTALL_EXTENSION_DROP"               : "Asenna pudottamalla .zip-paketti",
    "INSTALL_EXTENSION_DROP_ERROR"         : "Asennus tai päivitys keskeytyi seuraaviin virheisiin:",
    "INSTALL_FROM_URL"                     : "asenna URL-osoitteesta\u2026",
    "INSTALL_EXTENSION_VALIDATING"         : "Vahvistetaan\u2026",
    "EXTENSION_AUTHOR"                     : "Tekijä",
    "EXTENSION_DATE"                       : "Päivämäärä",
    "EXTENSION_INCOMPATIBLE_NEWER"         : "Tämä laajennus vaatii uudemman {APP_NAME}-version.",
    "EXTENSION_INCOMPATIBLE_OLDER"         : "Tämä laajennus toimii tällä hetkellä vain vanhemmilla {APP_NAME}-versioilla.",
    "EXTENSION_LATEST_INCOMPATIBLE_NEWER"  : "Tämän laajennuksen versio {0} vaatii uudemman {APP_NAME}-version, mutta voit asentaa aikaisemman version {1}.",
    "EXTENSION_LATEST_INCOMPATIBLE_OLDER"  : "Tämän laajennuksen versio {0} toimii vain vanhemmilla {APP_NAME}-versioilla, mutta voit asentaa aikaisemman version {1}.",
    "EXTENSION_NO_DESCRIPTION"             : "Ei kuvausta",
    "EXTENSION_MORE_INFO"                  : "Lisätietoja\u2026",
    "EXTENSION_ERROR"                      : "Laajennusvirhe",
    "EXTENSION_KEYWORDS"                   : "Avainsanat",
    "EXTENSION_TRANSLATED_USER_LANG"       : "Käännetty {0} kielelle, sisältäen kielesi",
    "EXTENSION_TRANSLATED_GENERAL"         : "Käännetty {0} kielelle",
    "EXTENSION_TRANSLATED_LANGS"           : "Tämä laajennus on käännetty näille kielille: {0}",
    "EXTENSION_INSTALLED"                  : "Asennettu",
    "EXTENSION_UPDATE_INSTALLED"           : "Tämä laajennuksen päivitys on ladattu ja asennetaan {APP_NAME}in latauduttua uudelleen.",
    "EXTENSION_SEARCH_PLACEHOLDER"         : "Haku",
    "EXTENSION_MORE_INFO_LINK"             : "Lisää",
    "BROWSE_EXTENSIONS"                    : "Selaa laajennuksia",
    "EXTENSION_MANAGER_REMOVE"             : "Poista laajennus",
    "EXTENSION_MANAGER_REMOVE_ERROR"       : "Yhden tai useamman laajennuksen poistaminen epäonnistui: {0}. {APP_NAME} latautuu silti uudelleen.",
    "EXTENSION_MANAGER_UPDATE"             : "Päivitä laajennus",
    "EXTENSION_MANAGER_UPDATE_ERROR"       : "Yhden tai useamman laajennuksen päivittäminen epäonnistui: {0}. {APP_NAME} latautuu silti uudelleen.",
    "MARKED_FOR_REMOVAL"                   : "Merkitty poistettavaksi",
    "UNDO_REMOVE"                          : "Kumoa",
    "MARKED_FOR_UPDATE"                    : "Merkitty päivitettäväksi",
    "UNDO_UPDATE"                          : "Kumoa",
    "CHANGE_AND_RELOAD_TITLE"              : "Muuta laajennuksia",
    "CHANGE_AND_RELOAD_MESSAGE"            : "Päivittääksesi tai poistaaksesi merkityt laajennukset {APP_NAME}in pitää latautua uudelleen. Sinua muistutetaan tallentamattomien muutosten tallentamisesta.",
    "REMOVE_AND_RELOAD"                    : "Poista laajennukset ja lataa uudelleen",
    "CHANGE_AND_RELOAD"                    : "Muuta laajennuksia ja lataa uudelleen",
    "UPDATE_AND_RELOAD"                    : "Päivitä laajennukset ja lataa uudelleen",
    "PROCESSING_EXTENSIONS"                : "Käsitellään laajennusten muutoksia\u2026",
    "EXTENSION_NOT_INSTALLED"              : "Laajennusta {0} ei voida poistaa, koska sitä ei ole asennettu.",
    "NO_EXTENSIONS"                        : "Laajennuksia ei ole vielä asennettu.<br>Napsauta Saatavilla-välilehteä yläpuolelta aloittaaksesi.",
    "NO_EXTENSION_MATCHES"                 : "Ei hakuasi vastaavia laajennuksia.",
    "REGISTRY_SANITY_CHECK_WARNING"        : "HUOMAUTUS: Nämä laajennukset voivat olla peräisin eri lähteistä kuin {APP_NAME} itse. Laajennuksia ei ole tarkastettu, ja niillä on täydet paikalliset oikeudet. Ole varovainen asentaessasi laajennuksia tuntemattomasta lähteestä.",
    "EXTENSIONS_INSTALLED_TITLE"           : "Asennettu",
    "EXTENSIONS_AVAILABLE_TITLE"           : "Saatavilla",
    "EXTENSIONS_THEMES_TITLE"              : "Teemat",
    "EXTENSIONS_UPDATES_TITLE"             : "Päivitykset",

    "INLINE_EDITOR_NO_MATCHES"             : "Vastaavuuksia ei saatavilla.",
    "CSS_QUICK_EDIT_NO_MATCHES"            : "Valintaasi vastaavia CSS-sääntöjä ei ole.<br> Napsauta ”Uusi sääntö” luodaksesi sellaisen.",
    "CSS_QUICK_EDIT_NO_STYLESHEETS"        : "Projektissasi ei ole tyylitiedostoja.<br>Luo sellainen lisätäksesi CSS-sääntöjä.",

    // Custom Viewers
    "IMAGE_VIEWER_LARGEST_ICON"            : "suurin",

    /**
     * Unit names
     */

    "UNIT_PIXELS"                          : "pikseliä",

    // extensions/default/DebugCommands
    "DEBUG_MENU"                                : "Kehitys",
    "ERRORS"                                    : "Virheet",
    "CMD_SHOW_DEV_TOOLS"                        : "Näytä kehitystyökalut",
    "CMD_REFRESH_WINDOW"                        : "Lataa uudelleen laajennuksineen",
    "CMD_RELOAD_WITHOUT_USER_EXTS"              : "Lataa uudelleen laajennuksitta",
    "CMD_NEW_BRACKETS_WINDOW"                   : "Uusi {APP_NAME}-ikkuna",
    "CMD_SWITCH_LANGUAGE"                       : "Vaihda kieltä",
    "CMD_RUN_UNIT_TESTS"                        : "Suorita testejä",
    "CMD_SHOW_PERF_DATA"                        : "Näytä suorituskyvyn tiedot",
    "CMD_ENABLE_NODE_DEBUGGER"                  : "Ota Noden virheenjäljitin käyttöön",
    "CMD_LOG_NODE_STATE"                        : "Kirjaa Noden tila konsoliin",
    "CMD_RESTART_NODE"                          : "Käynnistä Node uudelleen",
    "CMD_SHOW_ERRORS_IN_STATUS_BAR"             : "Näytä virheet tilapalkissa",
    "CMD_OPEN_BRACKETS_SOURCE"                  : "Avaa {APP_NAME}in lähdekoodi",

    "LANGUAGE_TITLE"                            : "Vaihda kieltä",
    "LANGUAGE_MESSAGE"                          : "Kieli:",
    "LANGUAGE_SUBMIT"                           : "Päivitä {APP_NAME}",
    "LANGUAGE_CANCEL"                           : "Peruuta",
    "LANGUAGE_SYSTEM_DEFAULT"                   : "Järjestelmän oletus",

    // extensions/default/InlineTimingFunctionEditor
    "INLINE_TIMING_EDITOR_TIME"                 : "Aika",
    "INLINE_TIMING_EDITOR_PROGRESSION"          : "Edistyminen",
    "BEZIER_EDITOR_INFO"                        : "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Siirrä valittua pistettä<br><kbd class='text'>Vaihto</kbd> Siirrä kymmenen yksikköä<br><kbd class='text'>Tab</kbd> Vaihda pistettä",
    "STEPS_EDITOR_INFO"                         : "<kbd>↑</kbd><kbd>↓</kbd> Lisää tai vähennä askelmia<br><kbd>←</kbd><kbd>→</kbd> ”Start” tai ”end”",
    "INLINE_TIMING_EDITOR_INVALID"              : "Vanha arvo <code>{0}</code> on virheellinen, joten näytetty funktio muutettiin muotoon <code>{1}</code>. Dokumentti päivitetään ensimmäisellä muokkauksella.",

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
    "DETECTED_EXCLUSION_TITLE"                  : "JavaScript-tiedoston päättelyongelma",
    "DETECTED_EXCLUSION_INFO"                   : "Brackets ajautui vaikeuksiin käsittelyssä:<br><br>{0}<br><br>Tätä tiedostoa ei enää käsitellä koodivihjeet- ja hypää määritelyyn -toimintoja varten. Ottaaksesi tämän takaisin käyttöön avaa <code>.brackets.json</code> projektissasi ja poista tiedosto kohdasta jscodehints.detectedExclusions.",

    // extensions/default/JSLint
    "JSLINT_NAME"                               : "JSLint",

    // extensions/default/QuickView
    "CMD_ENABLE_QUICK_VIEW"                     : "Pikanäkymä osoitettaessa",

    // extensions/default/RecentProjects
    "CMD_TOGGLE_RECENT_PROJECTS"                : "Viimeisimmät projektit",

    // extensions/default/WebPlatformDocs
    "DOCS_MORE_LINK"                            : "Lue lisää"
});

/* Last translated for 8712385a6bf12277e6d0788d408e630a40c95a14 */
