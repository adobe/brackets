"use strict"; // run code in ES5 strict mode

var path = require("path"),

    rewireLibIndex = path.join("rewire", "lib", "index.js");

/**
 * Gets called before each module is loaded.
 * This function ensures that lib/bundlers/webpack/webpackRewire.js is returned instead of lib/index.js.
 *
 * The callback gets called with (null, filename)
 *
 * @param {!String} filename
 * @param {!Function} callback
 */
function webpackPostProcessor(filename, callback) {
    if (filename.indexOf(rewireLibIndex) !== -1) {
        filename = __dirname + "/webpackRewire.js";
    }

    callback(null, filename);
}

module.exports = webpackPostProcessor;