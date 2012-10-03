/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {

    function quit() {
        console.log("PROXY: app.quit()", arguments);
    }

    function abortQuit() {
        console.log("PROXY: app.abortQuit()", arguments);
    }

    function showDeveloperTools() {
        console.log("PROXY: app.showDeveloperTools()", arguments);
    }

    function getElapsedMilliseconds() {
        console.log("PROXY: app.getElapsedMilliseconds()", arguments);
    }

    function openLiveBrowser(url, enableRemoteDebugging, callback) {
        console.log("PROXY: app.openLiveBrowser()", arguments);
    }

    function closeLiveBrowser(callback) {
        console.log("PROXY: app.closeLiveBrowser()", arguments);
    }

    function openURLInDefaultBrowser(callback, url) {
        console.log("PROXY: app.openURLInDefaultBrowser()", arguments);
    }

    function showExtensionsFolder() {
        console.log("PROXY: app.showExtensionsFolder()", arguments);
    }

    exports.language = navigator.language;

    exports.quit = quit;
    exports.abortQuit = abortQuit;
    exports.showDeveloperTools = showDeveloperTools;
    exports.getElapsedMilliseconds = getElapsedMilliseconds;
    exports.openLiveBrowser = openLiveBrowser;
    exports.closeLiveBrowser = closeLiveBrowser;
    exports.openURLInDefaultBrowser = openURLInDefaultBrowser;
    exports.showExtensionsFolder = showExtensionsFolder;
});
