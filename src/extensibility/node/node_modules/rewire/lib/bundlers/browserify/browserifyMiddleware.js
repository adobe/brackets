var setterSrc = require("../../__set__.js").toString(),
    getterSrc = require("../../__get__.js").toString(),
    path = require("path"),
    injectRewire = require("../injectRewire.js"),
    getRewireRequires = require("../getRewireRequires.js"),

    rewireIndex = path.resolve(__dirname, "../../index.js"),
    rewireLib = path.join("rewire", "lib"),
    settersAndGettersSrc;

/**
 * This function can be added to browserify via b.use().
 * @see https://github.com/substack/node-browserify/blob/master/doc/methods.markdown#methods
 *
 * It injects special code before every module in order to gain access to the private scope
 * of the module. Additionally it forwards all calls of require("rewire") to the module
 * browserifyRewire.js. Thus we don't need any cumbersome client/server-switches in the index.js.
 *
 * @param {browserify} b the bundle returned by browserify()
 * @return {browserify} b
 */
function browserifyMiddleware(b) {

    console.log("(DEPRECATED) rewire won't support browserify anymore. Please let me know if you're relying on this feature (https://github.com/jhnns/rewire/issues/13)");

    /**
     * Does actually the injecting of the special code. It is called by browserify for every
     * js-module.
     *
     * @param {String} src
     * @param {String} filename
     * @return {String} src
     */
    function doInjectRewire(src, filename) {
        var rewireRequires;

        // We don't want to inject this code at the beginning of a rewire/lib-module. Otherwise
        // it would cause a black hole that devours our universe.
        if (filename.indexOf(rewireLib) === -1) {
            // Search for all rewire() statements an return the required path.
            rewireRequires = getRewireRequires(src);

            // Add all modules that are loaded by rewire() manually to browserify because browserify's
            // require-sniffing doesn't work here.
            rewireRequires.forEach(function forEachRewireRequire(requirePath) {

                // Resolve to absolute paths
                if (requirePath.charAt(0) === ".") {
                    requirePath = path.resolve(path.dirname(filename), requirePath);
                }
                b.require(requirePath);

            });

            // Injects the special code
            src = injectRewire(src, settersAndGettersSrc);

            // Because browserify doesn't create a new, independent module instance each time the module is
            // executed we have to make it fake-independent. Thus the rewired module doesn't influence the original module.
            // This is a crazy hack, but: hey don't blame me! Make a pull-request to browserify :)
            src += ' module = require("rewire").getIndependentModule(module);';
        }

        return src;
    }

    /**
     * Gets called before each module is loaded.
     * This function ensures that lib/bundlers/browserify/browserifyRewire.js  is returned instead of lib/index.js
     *
     * @param {String} filename
     * @return {String} filename
     */
    function forwardBrowserifyRewire(filename) {
        if (filename === rewireIndex) {
            filename = __dirname + "/browserifyRewire.js";
        }

        return filename;
    }

    // Register file handler
    b.register(".js", doInjectRewire);
    b.register("path", forwardBrowserifyRewire);

    return b;
}

/**
 * This string gets injected at the beginning of every module. Its purpose is to
 * - register the setters and getters according to the module's filename
 * - override the internal require with a require proxy.
 *
 * @private
 * @type {String}
 */
settersAndGettersSrc = (
    'var rewire = require("rewire"); ' +

    // Registers the setters and getters of every module according to their filename. These setter and getter
    // allow us to gain access to the private scope of the module.
    'rewire.register(__filename, module, ' + setterSrc + ', ' + getterSrc + '); ' +

    // Overrides the module internal require with a require proxy. This proxy is necessary to call rewire with the
    // module's filename at the first parameter to resolve the path. This way rewire() works exactly like require().
    'require = rewire.getProxy(require, __dirname); ' +

    // Cleaning up
    'rewire = undefined;'

).replace(/\s+/g, " ");   // strip out unnecessary spaces to be unobtrusive in the debug view

module.exports = browserifyMiddleware;