/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, window, navigator */

define(function (require, exports, module) {
    "use strict";

    function quit() {
        // unsupported
    }

    function abortQuit() {
        // unsupported
    }

    function showDeveloperTools() {
        // nothing (Chrome does this automatically)
    }

    function getElapsedMilliseconds() {
        return new Date().getTime();
    }

    function openLiveBrowser(url, enableRemoteDebugging, callback) {
        callback(undefined);
    }

    function closeLiveBrowser(callback) {
        callback(undefined);
    }

    function openURLInDefaultBrowser(callback, url) {
        window.open("url", "_blank");
        if (callback) {
            callback();
        }
    }

    function showExtensionsFolder() {
        console.log("PROXY: app.showExtensionsFolder()", arguments);
    }

    exports.language = window.localStorage.getItem("locale") || navigator.language;

    exports.quit = quit;
    exports.abortQuit = abortQuit;
    exports.showDeveloperTools = showDeveloperTools;
    exports.getElapsedMilliseconds = getElapsedMilliseconds;
    exports.openLiveBrowser = openLiveBrowser;
    exports.closeLiveBrowser = closeLiveBrowser;
    exports.openURLInDefaultBrowser = openURLInDefaultBrowser;
    exports.showExtensionsFolder = showExtensionsFolder;
});
