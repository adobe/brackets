"use strict"; // run code in ES5 strict mode

var setterSrc = require("../../__set__.js").toString(),
    getterSrc = require("../../__get__.js").toString(),
    path = require("path"),
    injectRewire = require("../injectRewire.js"),
    getRewireRegExp = require("../getRewireRegExp.js"),

    rewireLib = path.resolve(__dirname, "../../"),
    projectBasePath = path.resolve(__dirname, "../../../../../"),
    nodeModulesPath = path.join(projectBasePath, "node_modules"),
    webpackPath = path.join("node_modules", "webpack"),
    settersAndGettersSrc;

/**
 * Injects special code so rewire gains access to the module's private scope.
 *
 * Furthermore it changes all calls of rewire("some/path") to rewire("some/path", require("some/path")) so webpack
 * recognizes the additional dependency. This also enables rewire to resolve the module because webpack replaces all
 * paths to numeric ids.
 *
 * @param {!String} src
 * @return {String} src
 */
function webpackPostLoader(src) {
    var filename = this.request.split("!").pop(),
        rewireRegExp = getRewireRegExp();

    if (isRewireableModule(filename)) {
        // replaces rewire("some/path") into rewire("some/path", require("some/path"))
        src = src.replace(rewireRegExp, '$1rewire("$2", require("$2"))');

        // Inject special code
        src = injectRewire(src, settersAndGettersSrc);
    }

    return src;
}

webpackPostLoader.loader = __filename;
webpackPostLoader.test = /\.js$/;

/**
 * Returns true if the module is rewireable. Rewireable are all modules of the project.
 *
 * Example:
 * Imagine rewire lies under "~/myProject/node_modules/rewire". All files in "~/myProject" are rewireable except
 * the "~/myProject/node_modules"-path.
 *
 * @param {!String} path
 * @return {Boolean}
 */
function isRewireableModule(path) {
    return path.indexOf(projectBasePath) !== -1 &&
        path.indexOf(nodeModulesPath) === -1 &&

        // "rewire/lib" and "node_modules/webpack" are explicitly excluded to make the tests work
        path.indexOf(rewireLib) === -1 &&
        path.indexOf(webpackPath) === -1;
}

/**
 * This string gets injected at the beginning of every module. Its purpose is to
 * - register the setters and getters according to the module's filename
 *
 * @private
 * @type {String}
 */
settersAndGettersSrc = (
    'var rewire = require("rewire"); ' +

    // Registers the setters and getters of every module according to their filename. The setters and getters must be
    // injected as string here to gain access to the private scope of the module.
    'rewire.register(module, ' + setterSrc + ', ' + getterSrc + '); ' +

    // Cleaning up
    'rewire = undefined;'
).replace(/\s+/g, " ");   // strip out unnecessary spaces to be unobtrusive in the debug view

module.exports = webpackPostLoader;