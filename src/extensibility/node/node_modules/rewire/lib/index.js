var rewireModule = require("./rewire.js");

/**
 * Adds a special setter and getter to the module located at filename. After the module has been rewired, you can
 * call myModule.__set__(name, value) and myModule.__get__(name) to manipulate private variables.
 *
 * @param {!String} filename Path to the module that shall be rewired. Use it exactly like require().
 * @return {*} the rewired module
 */
function rewire(filename) {
    return rewireModule(module.parent, filename);
}

module.exports = rewire;

delete require.cache[__filename];   // deleting self from module cache so the parent module is always up to date