"use strict";

/**
 * This function will be stringified and then injected into every rewired module.
 *
 * Calling myModule.__with__("myPrivateVar", newValue) returns a function where
 * you can place your tests. As long as the returned function is executed variables
 * will be set to the given value, after that all changed variables are reset back to normal.
 *
 * @param {String|Object} varName name of the variable to set
 * @param {String} varValue new value
 * @return {Function}
 */
function __with__() {
    var args = arguments;

    return function (callback) {
        var undo,
            returned,
            isPromise;

        if (typeof callback !== "function") {
            throw new TypeError("__with__ expects a callback function");
        }

        undo = module.exports.__set__.apply(null, args);

        try {
            returned = callback();
            isPromise = returned && typeof returned.then === "function";
            if (isPromise) {
                returned.then(undo, undo);
                return returned;
            }
        } finally {
            if (!isPromise) {
                undo();
            }
        }
    };
}

module.exports = __with__;