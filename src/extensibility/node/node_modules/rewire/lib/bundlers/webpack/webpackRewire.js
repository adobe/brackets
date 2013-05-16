"use strict"; // run code in ES5 strict mode

var registry = {},
    getImportGlobalsSrc = require("../../getImportGlobalsSrc.js");

var requireInDisguise;

eval("requireInDisguise = require");

function getModuleId(exports) {
    var cache = require.cache,
        id;

    for (id in cache) {
        if (cache.hasOwnProperty(id)) {
            if (cache[id].exports === exports) {
                return Number(id);
            }
        }
    }

    return null;
}

function webpackRewire(path, moduleExports) {
    var id = getModuleId(moduleExports),
        previousRegistryEntry,
        cachedModule,
        rewiredModule,
        setter,
        getter;

    if (typeof id !== "number") {
        throw new Error("(rewire) Sorry, rewiring '" + path + "' is currently not supported.");
    }

    previousRegistryEntry = registry[id];

    cachedModule = require.cache[id];
    delete require.cache[id];
    rewiredModule = requireInDisguise(id);
    require.cache[id] = cachedModule;

    setter = registry[id].setter;
    getter = registry[id].getter;

    registry[id] = previousRegistryEntry;

    rewiredModule.__set__ = setter;
    rewiredModule.__get__ = getter;

    return rewiredModule;
}

webpackRewire.register = function (module, setter, getter) {
    var id = module.id;

    registry[id] = {
        module: module,
        setter: setter,
        getter: getter
    };
};

/**
 * Scans for global vars and returns an evalable string that declares all globals as a var.
 * This way a global variable can be overridden by __set__ without changing the global instance.
 * It is executed each time again to include global variables that have been added later.
 *
 * @return {String}
 */
webpackRewire.getImportGlobalsSrc = function () {
    return getImportGlobalsSrc(['require','module','exports','__dirname','__filename','process']);
};

module.exports = webpackRewire;