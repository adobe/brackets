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

/*
 * Adapted from https://github.com/mozilla/donate.mozilla.org/blob/master/scripts/properties2json.js
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/* global process */

var Promise = require("bluebird");
var requireJS = require("requirejs");
var path = require("path");
var Nunjucks = require("nunjucks");
var properties = Promise.promisifyAll(require("properties-parser"));
var fs = Promise.promisifyAll(require("fs"));
var mkdirp = Promise.promisify(require("mkdirp"));

// Unchanging values
var EN_US_DIR = "root";
var L10N_DIR = "nls";
var L10N_PROP_FILE = "editor.properties";
var L10N_STR_FILE = "strings.js";
var L10N_TEMPLATE_FILE = "strings.template";
var LOCALE_LIST_TEMPLATE_FILE = "locale-list.template";
var CONCURRENCY = { concurrency: 3 };

var root = process.cwd();
var src = path.join(root, "locales");
var dest = path.join(root, process.argv.length > 2 ? process.argv[2] : "src", L10N_DIR);
var templates = new Nunjucks.Environment(new Nunjucks.FileSystemLoader(path.join(root, "templates")));
var destLocalizedStrings = {};
var locales;
var destLocales;

function getDestLocaleDir(locale) {
    "use strict";

    return locale === "en-US" ? EN_US_DIR : locale.toLowerCase();
}

function updateLocaleList() {
    "use strict";

    var localeList = templates.render(LOCALE_LIST_TEMPLATE_FILE, { locales: destLocales });
    var localeListFile = path.join(dest, L10N_STR_FILE);

    return fs.writeFileAsync(localeListFile, localeList)
    .then(function() {
        console.log("Updated locale list in `", localeListFile, "`");
        return Promise.resolve();
    })
    .catch(function(err) {
        console.error("Failed to update locale list in `", localeListFile, "`");
        return Promise.reject(err);
    });
}

function localizeBrackets(locale) {
    "use strict";

    var localeDir = getDestLocaleDir(locale);
    var strings = destLocalizedStrings[locale];
    var isNewLocale = !(Object.keys(strings).length);

    function combineAndWriteStrings(newStrings) {
        if(newStrings) {
            Object.assign(strings, newStrings);
        }

        if(!(Object.keys(strings).length)) {
            // Our string file is empty and Brackets does not have any strings
            console.log("No strings to write for `", localeDir, "`");
            return Promise.resolve();
        }

        if(isNewLocale) {
            destLocales.push(localeDir);
        }

        var localizedFileContents = templates.render(L10N_TEMPLATE_FILE, { localizedStrings: strings });
        var destLocaleDir = path.join(dest, localeDir);

        return mkdirp(destLocaleDir)
        .then(function() {
            return fs.writeFileAsync(path.join(destLocaleDir, L10N_STR_FILE), localizedFileContents);
        })
        .then(function() {
            console.log("Updated l10n file for `", localeDir, "`");
            return Promise.resolve();
        })
        .catch(function(err) {
            console.error("Failed to update l10n file for `", localeDir, "`");
            return Promise.reject(err);
        });
    }

    return properties.readAsync(path.join(src, locale, L10N_PROP_FILE))
    .then(combineAndWriteStrings)
    .catch(function(err) {
        if(err.code !== "ENOENT") {
            console.error("Failed to update l10n file for `", localeDir, "`");
            return Promise.reject(err);
        }

        if(!isNewLocale) {
            // We need to write the strings that brackets provides
            return combineAndWriteStrings();
        }

        // Our string file nor their's have any strings
        console.log("No strings to write for `", localeDir, "`");
        return Promise.resolve();
    });
}

function getLocalizedFile(file, locale) {
    "use strict";

    return new Promise(function(resolve, reject) {
        try {
            requireJS([ file ], function(destLocaleStrings) {
                destLocalizedStrings[locale] = destLocaleStrings;
                resolve();
            });
        } catch(err) {
            reject(err);
        }
    });
}

function getExistingLocalizedContent(locale) {
    "use strict";

    var destLocaleFile = path.join(dest, getDestLocaleDir(locale), L10N_STR_FILE);

    return fs.statAsync(destLocaleFile)
    .then(getLocalizedFile.bind(null, destLocaleFile, locale))
    .catch(function(err) {
        if(err.code !== "ENOENT") {
            return Promise.reject(err);
        }

        destLocalizedStrings[locale] = {};
        return Promise.resolve();
    });
}

function run() {
    "use strict";

    return fs.readdirAsync(src)
    .then(function(folders) {
        var DSStoreIndex = folders.indexOf(".DS_Store");
        if(DSStoreIndex > -1) {
            folders.splice(DSStoreIndex, 1);
        }
        locales = folders;
        return Promise.map(locales, getExistingLocalizedContent, CONCURRENCY);
    })
    .then(function() {
        return Promise.map(locales, localizeBrackets, CONCURRENCY);
    })
    .then(updateLocaleList)
    .catch(console.error.bind(console, "Failed to convert properties l10n to js l10n with: "));
}

requireJS([ path.join(dest, L10N_STR_FILE) ], function(destLocaleList) {
    "use strict";

    destLocales = Object.keys(destLocaleList);
    destLocales.splice(destLocales.indexOf(EN_US_DIR), 1);

    run();
});
