/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global exports: true */

// this is currently unused - provided for sake of completeness

function quit() {
    "use strict";
    console.log("PROXY: app.quit()", arguments);
}

function abortQuit() {
    "use strict";
    console.log("PROXY: app.abortQuit()", arguments);
}

function showDeveloperTools() {
    "use strict";
    console.log("PROXY: app.showDeveloperTools()", arguments);
}

function getElapsedMilliseconds() {
    "use strict";
    console.log("PROXY: app.getElapsedMilliseconds()", arguments);
}

function openLiveBrowser(url, enableRemoteDebugging, callback) {
    "use strict";
    console.log("PROXY: app.openLiveBrowser()", arguments);
}

function closeLiveBrowser(callback) {
    "use strict";
    console.log("PROXY: app.closeLiveBrowser()", arguments);
}

function openURLInDefaultBrowser(callback, url) {
    "use strict";
    console.log("PROXY: openURLInDefaultBrowser()", arguments);
}

function showExtensionsFolder() {
    "use strict";
    console.log("PROXY: app.showExtensionsFolder()", arguments);
}

// export functions
exports.quit = quit;
exports.abortQuit = abortQuit;
exports.showDeveloperTools = showDeveloperTools;
exports.getElapsedMilliseconds = getElapsedMilliseconds;
exports.openLiveBrowser = openLiveBrowser;
exports.closeLiveBrowser = closeLiveBrowser;
exports.openURLInDefaultBrowser = openURLInDefaultBrowser;
exports.showExtensionsFolder = showExtensionsFolder;
