/**
 * Returns a regular expression that matches all rewire() statements.
 *
 * Captures:
 *
 * 1. the character before rewire
 * 2. the path between the parenthesis without quotation marks
 *
 * @return {RegExp}
 */
function getRewireRegExp() {
    return /([^a-zA-Z0-9_])rewire\(["'](.+?)["']\)/g;
}

module.exports = getRewireRegExp;