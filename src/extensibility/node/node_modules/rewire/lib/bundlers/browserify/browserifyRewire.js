var pathUtil = require("path"),
    getImportGlobalsSrc = require("./getImportGlobalsSrc.js"); // must be relative to lib/index.js because of forwardBrowserifyRewire()

/**
 * Clones an object deeply. Used to clone the module-object that is
 * stored in the cache. Because browserify doesn't create the module-
 * object newly if the module is executed again we can't modify the
 * exports object directly. Instead of we have to make an independent copy.
 *
 * @param {!Object} obj
 * @return {Object}
 */
function clone(obj) {
    var target = {},
        value,
        key;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            value = obj[key];
            if (Array.isArray(value)) {
                target[key] = value.slice(0);
            } else if (typeof value === "object" && value !== null) {
                target[key] = clone(value);
            } else {
                target[key] = value;
            }

        }
    }

    return target;
}

// Saves all setters and getters for every module according to its filename
var registry = {};

/**
 * Executes the given module and adds a special setter and getter that allow you to set and get private variables.
 * The parentModulePath is usually set by the requireProxy.
 *
 * @param {!String} parentModulePath __filename of the module, that wants to rewire() another module.
 * @param {!String} path path to the module that shall be rewired
 * @return {Object} the rewired module
 */
function browserifyRewire(parentModulePath, path) {
    var cached,
        originalModule,
        originalExports,
        absPath,
        rewiredExports = {},
        registryEntry,
        _require = require; // hide it from browserify to avoid annoying console warnings

    // Normalize path with file extensions
    absPath = pathUtil.resolve(parentModulePath, path);

    // Retrieve original module from cache
    cached = originalModule = require.cache[absPath];

    if (cached) {
        // If there is already a module instance in the cache we have to store the original exports-object
        // manually so it won't be overwritten by the next execution. This is all necessary due to browserify's
        // odd way of module creation.
        originalExports = originalModule.exports;
        originalModule.exports = rewiredExports;

        // Delete the original module from the cache so the next call to _require()
        // executes the module
        delete require.cache[absPath];
    }

    // Require module to trigger rewire.register().
    _require(absPath);

    originalModule = require.cache[absPath];

    // Now we're cloning the exports-obj so later modifications of the rewired module won't influence the
    // cached, original version of this module.
    rewiredExports = clone(originalModule.exports);

    if (cached) {
        // Restore original exports
        originalModule.exports = originalExports;
    }

    // Get registry entry of the target module
    registryEntry = registry[absPath];

    // Apply setter and getters
    rewiredExports.__set__ = registryEntry.setter;
    rewiredExports.__get__ = registryEntry.getter;

    return rewiredExports;
}

/**
 * Registers the setter and getter of every module according to its filename
 *
 * @param {!String} filename the absolute path to the module (module id)
 * @param {!Function} setter
 * @param {!Function} getter
 */
browserifyRewire.register = function (filename, module, setter, getter) {
    registry[filename] = {
        module: module,
        setter: setter,
        getter: getter
    };
};

/**
 * Provides a special require-proxy. Every module calls require("rewire").getProxy(require, __filename) at the
 * beginning and overrides its own require with this proxy.
 *
 * This is necessary to call rewire() with the original __filename. Thus you can use rewire() like require().
 *
 * @param {!Function} internalRequire the module's own require
 * @param {String} dirname the __dirname of the module
 * @return {Function} requireProxy
 */
browserifyRewire.getProxy = function (internalRequire, dirname) {
    var rewire = internalRequire("rewire"),
        rewireProxyInit = false;

    function copyProperties(from, to) {
        var key;

        for (key in from) {
            if (from.hasOwnProperty(key)) {
                to[key] = from[key];
            }
        }
    }

    function rewireProxy(path, cache) {
        return rewire(dirname, path, cache);
    }

    function requireProxy(path) {
        if (path === "rewire") {
            if (rewireProxyInit === false) {
                copyProperties(rewire, rewireProxy); // lazy copy
                rewireProxyInit = true;
            }
            return rewireProxy;
        } else {
            return internalRequire(path);
        }
    }

    copyProperties(internalRequire, requireProxy);

    return requireProxy;
};

/**
 * Scans for global vars and returns an evalable string that declares all globals as a var.
 * This way a global variable can be overridden by __set__ without changing the global instance.
 * It is executed each time again to include global variables that have been added later.
 *
 * @return {String}
 */
browserifyRewire.getImportGlobalsSrc = function () {
    return getImportGlobalsSrc(['require','module','exports','__dirname','__filename','process']);
};

/**
 * Returns a new object that inherits from the original module via prototype inheritance.
 *
 * Any changes to the module, e.g. assigning another exports-object will now modify the object
 * instead of original module.
 *
 * @param {Object} originalModule
 * @return {Object} the independent module
 */
browserifyRewire.getIndependentModule = function (originalModule) {
    var independentModule;

    function IndependentModule() {}
    IndependentModule.prototype = originalModule;

    independentModule = new IndependentModule();
    independentModule.exports = originalModule.exports;

    return independentModule;
};

module.exports = browserifyRewire;