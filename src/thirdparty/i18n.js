/**
 * @license RequireJS i18n 1.0.0 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint regexp: false, nomen: false, plusplus: false, strict: false */
/*global require: false, navigator: false, define: false */

/**
 * This plugin handles i18n! prefixed modules. It does the following:
 *
 * 1) A regular module can have a dependency on an i18n bundle, but the regular
 * module does not want to specify what locale to load. So it just specifies
 * the top-level bundle, like "i18n!nls/colors".
 *
 * This plugin will load the i18n bundle at nls/colors, see that it is a root/master
 * bundle since it does not have a locale in its name. It will then try to find
 * the best match locale available in that master bundle, then request all the
 * locale pieces for that best match locale. For instance, if the locale is "en-us",
 * then the plugin will ask for the "en-us", "en" and "root" bundles to be loaded
 * (but only if they are specified on the master bundle).
 *
 * Once all the bundles for the locale pieces load, then it mixes in all those
 * locale pieces into each other, then finally sets the context.defined value
 * for the nls/colors bundle to be that mixed in locale.
 *
 * 2) A regular module specifies a specific locale to load. For instance,
 * i18n!nls/fr-fr/colors. In this case, the plugin needs to load the master bundle
 * first, at nls/colors, then figure out what the best match locale is for fr-fr,
 * since maybe only fr or just root is defined for that locale. Once that best
 * fit is found, all of its locale pieces need to have their bundles loaded.
 *
 * Once all the bundles for the locale pieces load, then it mixes in all those
 * locale pieces into each other, then finally sets the context.defined value
 * for the nls/fr-fr/colors bundle to be that mixed in locale.
 */
(function () {
    //regexp for reconstructing the master bundle name from parts of the regexp match
    //nlsRegExp.exec("foo/bar/baz/nls/en-ca/foo") gives:
    //["foo/bar/baz/nls/en-ca/foo", "foo/bar/baz/nls/", "/", "/", "en-ca", "foo"]
    //nlsRegExp.exec("foo/bar/baz/nls/foo") gives:
    //["foo/bar/baz/nls/foo", "foo/bar/baz/nls/", "/", "/", "foo", ""]
    //so, if match[5] is blank, it means this is the top bundle definition.
    var nlsRegExp = /(^.*(^|\/)nls(\/|$))([^\/]*)\/?([^\/]*)/,
        empty = {};

    //Helper function to avoid repeating code. Lots of arguments in the
    //desire to stay functional and support RequireJS contexts without having
    //to know about the RequireJS contexts.
    function addPart(locale, master, needed, toLoad, prefix, suffix) {
        if (master[locale]) {
            needed.push(locale);
            if (master[locale] === true || master[locale] === 1) {
                toLoad.push(prefix + locale + '/' + suffix);
            }
        }
    }

    function addIfExists(req, locale, toLoad, prefix, suffix) {
        var fullName = prefix + locale + '/' + suffix;
        if (require._fileExists(req.toUrl(fullName))) {
            toLoad.push(fullName);
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     * This is not robust in IE for transferring methods that match
     * Object.prototype names, but the uses of mixin here seem unlikely to
     * trigger a problem related to that.
     */
    function mixin(target, source, force) {
        for (var prop in source) {
            if (!(prop in empty) && (!(prop in target) || force)) {
                target[prop] = source[prop];
            }
        }
    }

    define({
        version: '1.0.0',
        /**
         * Called when a dependency needs to be loaded.
         */
        load: function (name, req, onLoad, config) {
            config = config || {};

            var masterName,
                match = nlsRegExp.exec(name),
                prefix = match[1],
                locale = match[4],
                suffix = match[5],
                parts = locale.split("-"),
                toLoad = [],
                value = {},
                i, part, current = "";

            //If match[5] is blank, it means this is the top bundle definition,
            //so it does not have to be handled. Locale-specific requests
            //will have a match[4] value but no match[5]
            if (match[5]) {
                //locale-specific bundle
                prefix = match[1];
                masterName = prefix + suffix;
            } else {
                //Top-level bundle.
                masterName = name;
                suffix = match[4];
                locale = config.locale || (config.locale =
                        typeof navigator === "undefined" ? "root" :
                        (navigator.language ||
                         navigator.userLanguage || "root").toLowerCase());
                parts = locale.split("-");
            }

            if (config.isBuild) {
                //Check for existence of all locale possible files and
                //require them if exist.
                toLoad.push(masterName);
                addIfExists(req, "root", toLoad, prefix, suffix);
                for (i = 0; (part = parts[i]); i++) {
                    current += (current ? "-" : "") + part;
                    addIfExists(req, current, toLoad, prefix, suffix);
                }

                req(toLoad, function () {
                    onLoad();
                });
            } else {
                //First, fetch the master bundle, it knows what locales are available.
                req([masterName], function (master) {
                    //Figure out the best fit
                    var needed = [];

                    //Always allow for root, then do the rest of the locale parts.
                    addPart("root", master, needed, toLoad, prefix, suffix);
                    for (i = 0; (part = parts[i]); i++) {
                        current += (current ? "-" : "") + part;
                        addPart(current, master, needed, toLoad, prefix, suffix);
                    }

                    //Load all the parts missing.
                    req(toLoad, function () {
                        var i, partBundle;
                        for (i = needed.length - 1; i > -1 && (part = needed[i]); i--) {
                            partBundle = master[part];
                            if (partBundle === true || partBundle === 1) {
                                partBundle = req(prefix + part + '/' + suffix);
                            }
                            mixin(value, partBundle);
                        }

                        //All done, notify the loader.
                        onLoad(value);
                    });
                });
            }
        }
    });
}());
