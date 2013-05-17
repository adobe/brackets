"use strict"; // run code in ES5 strict mode

/**
 * Configures webpack so it can be used with rewire. Make sure that the options aren't modified
 * after calling this function. It's important that the rewire()-postLoader is the last loader called on a module.
 *
 * @see https://github.com/webpack/webpack
 *
 * @param {Object} options a webpack option object
 */
function configureWebpack(options) {
    console.log("(DEPRECATED) rewire itself doesn't support webpack anymore. Please use rewire-webpack (https://github.com/jhnns/rewire-webpack)");

    options.resolve = options.resolve || {};
    options.postLoaders = options.postLoaders || [];
    options.resolve.postprocess = options.resolve.postprocess || {};
    options.resolve.postprocess.normal = options.resolve.postprocess.normal || [];

    // Registering the postLoader for injecting the special rewire code
    options.postLoaders.push(require("./webpackPostLoader.js"));

    // Registering the postProcessor for resolving paths
    options.resolve.postprocess.normal.push(require("./webpackPostProcessor.js"));
}

module.exports = configureWebpack;