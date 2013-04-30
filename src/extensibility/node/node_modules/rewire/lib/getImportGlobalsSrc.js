/**
 * Declares all globals with a var and assigns the global object. Thus you're able to
 * override globals without changing the global object itself.
 *
 * Returns something like
 * "var console = global.console; var process = global.process; ..."
 *
 * @return {String}
 */
function getImportGlobalsSrc(ignore) {
    var key,
        value,
        src = "",
        globalObj = typeof global === "undefined"? window: global;

    ignore = ignore || [];

    for (key in globalObj) {
        if (key !== "global" && ignore.indexOf(key) === -1) {   // we don't use hasOwnProperty here because in some browsers not all global objects will be enumerated
            value = globalObj[key];
            src += "var " + key + " = global." + key + "; ";
        }
    }


    return src;
}

module.exports = getImportGlobalsSrc;