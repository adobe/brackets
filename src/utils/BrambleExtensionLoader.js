/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

/**
 * BrambleExtensionLoader allows optional enabling/disabling of extensions
 * based on query string params.
 */

define(function (require, exports, module) {
    "use strict";

    var basePath = PathUtils.directory(window.location.href);

    /**
     * We have a set of defaults we load if not instructed to do otherwise
     * via the disableExtensions query param. These live in src/extensions/default/*
     */
    var brambleDefaultExtensions = [
        "CSSCodeHints",
        "HTMLCodeHints",
        "JavaScriptCodeHints",
        "InlineColorEditor",
        "JavaScriptQuickEdit",
        "QuickOpenCSS",
        "QuickOpenHTML",
        "QuickOpenJavaScript",
        "QuickView",
        "UrlCodeHints",

        // Custom extensions we want loaded by default
        // "HTMLHinter",
        "brackets-browser-livedev",
        "brackets-paste-and-indent"
    ];

    /**
     * There are some Brackets default extensions that we don't load
     * but which a user might want to enable (note: not all the defaults
     * they ship will work in a browser, so they aren't all here). We
     * support loading these below via the enableExtensions param.
     */
    var bracketsDefaultExtensions = [
        "SVGCodeHints",
        "HtmlEntityCodeHints",
        "LESSSupport",
        "CloseOthers",
        "InlineTimingFunctionEditor",
        "WebPlatformDocs",
        "CodeFolding",
        "JSLint",
        "QuickOpenCSS",
        "RecentProjects"
    ];

    /**
     * Other extensions we've tested and deemed useful in the Bramble context.
     * These live in src/extensions/extra/* and are usually submodules.  If you
     * add a new extension there, update this array also.  You can have this load
     * by adding the extension name to the enableExtensions query param.
     */
    var extraExtensions = [
        "brackets-cdn-suggestions",    // https://github.com/szdc/brackets-cdn-suggestions
        "selfie-taker"
    ];

    // Disable any extensions we found on the query string's disableExtensions param
    function _processDefaults(disableExtensions) {
        if(disableExtensions) {
            disableExtensions.split(",").forEach(function (ext) {
                ext = ext.trim();
                var idx = brambleDefaultExtensions.indexOf(ext);
                if (idx > -1) {
                    console.log('[Brackets] Disabling default extension `' + ext + '`');
                    brambleDefaultExtensions.splice(idx, 1);
                }
            });
        }

        return brambleDefaultExtensions.map(function (ext) {
            return {
                name: ext,
                path: basePath + "extensions/default/" + ext
            };
        });
    }

    // Add any extra extensions we found on the query string's enableExtensions param
    function _processExtras(enableExtensions) {
        var extras = [];

        if(enableExtensions) {
            enableExtensions.split(",").forEach(function (ext) {
                ext = ext.trim();

                // Extension is in src/extensions/extra/*
                if (extraExtensions.indexOf(ext) > -1) {
                    console.log('[Brackets] Loading additional extension `' + ext + '`');
                    extras.push({
                        name: ext,
                        path: basePath + "extensions/extra/" + ext
                    });
                }

                // Extension is in src/extensions/default/* (we don't enable all Brackets exts)
                if (bracketsDefaultExtensions.indexOf(ext) > -1) {
                    console.log('[Brackets] Loading additional extension `' + ext + '`');
                    extras.push({
                        name: ext,
                        path: basePath + "extensions/default/" + ext
                    });
                }
            });
        }

        return extras;
    }

    exports.getExtensionList = function(params) {
        return []
            .concat(_processDefaults(params.get("disableExtensions")))
            .concat(_processExtras(params.get("enableExtensions")));
    };
});
