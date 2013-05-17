"use strict"; // run code in ES5 strict mode

var path = require("path"),
    getRewireRequires = require("./getRewireRequires.js"),
    detectStrictMode = require("../detectStrictMode.js");

/**
 * Gets called by the bundler for every module. Injects special code so rewire is able to access private variables.
 * This module doesn't contain bundler specific code. All bundler specific stuff should be done in the settersAndGettersSrc.
 *
 * @param {!String} src the module's src
 * @param {!String} settersAndGettersSrc source that injects the setters and getters into the module scope
 * @return {String}
 */
function injectRewire(src, settersAndGettersSrc) {

    src =
        // Trying to hide the injected line in the debug view with extra whitespaces.
        '                                                                                                                                                ' +
        '/* this line was injected by rewire() */ ' +   // Comment for the curious developer

        // Now all global variables are declared with a var statement so they can be changed via __set__()
        // without influencing global objects.
        'var global = window; ' +   // window is our new global object
        'eval(require("rewire").getImportGlobalsSrc()); ' +

        // The module src is wrapped inside a self-executing function.
        // This is necessary to separate the module src from the preceding eval(importGlobalsSrc),
        // because the module src can be in strict mode.
        // In strict mode eval() can only declare vars in the current scope. In this case our setters
        // and getters won't work.
        // @see https://developer.mozilla.org/en/JavaScript/Strict_mode#Making_eval_and_arguments_simpler
        "(function () { " +

        // If the module uses strict mode we must ensure that "use strict" stays at the beginning of the function.
        (detectStrictMode(src)? ' "use strict"; ': ' ') +

        settersAndGettersSrc + "\n" +
        src + "\n" +

        " })();";

    return src;
}

module.exports = injectRewire;