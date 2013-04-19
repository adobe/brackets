var getRewireRegExp = require("./getRewireRegExp.js");

/**
 * Searches for rewire(); statements and returns all strings that are between the brackets.
 *
 * @param {!String} src
 * @return {Array}
 */
function getRewireRequires(src) {
    var result = [],
        regExp = getRewireRegExp(),
        match;

    src = " " + src;    // ensure that rewire() is not at index 0 otherwise the regexp won't work in this case
    match = regExp.exec(src);
    while (match !== null) {
        result.push(match[2]);
        match = regExp.exec(src);
    }

    return result;
}

module.exports = getRewireRequires;