/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * ExtensionLoader searches the filesystem for extensions, then creates a new context for each one and loads it.
 * This module dispatches the following events:
 *      "load" - when an extension is successfully loaded. The second argument is the file path to the
 *          extension root.
 *      "loadFailed" - when an extension load is unsuccessful. The second argument is the file path to the
 *          extension root.
 */

define(function (require, exports, module) {
    "use strict";

    require("utils/Global");

    var _              = require("thirdparty/lodash"),
        EventDispatcher = require("utils/EventDispatcher"),
        FileSystem     = require("filesystem/FileSystem"),
        FileUtils      = require("file/FileUtils"),
        Async          = require("utils/Async"),
        ExtensionUtils = require("utils/ExtensionUtils"),
        UrlParams      = require("utils/UrlParams").UrlParams,
        PathUtils      = require("thirdparty/path-utils/path-utils");

    // default async initExtension timeout
    var INIT_EXTENSION_TIMEOUT = 10000;

    var _init       = false,
        _extensions = {},
        _initExtensionTimeout = INIT_EXTENSION_TIMEOUT,
        srcPath     = FileUtils.getNativeBracketsDirectoryPath();

    /**
     * Stores require.js contexts of extensions
     * @type {Object.<string, Object>}
     */
    var contexts    = {};

    // The native directory path ends with either "test" or "src". We need "src" to
    // load the text and i18n modules.
    srcPath = srcPath.replace(/\/test$/, "/src"); // convert from "test" to "src"


    // Retrieve the global paths
    var globalPaths = brackets._getGlobalRequireJSConfig().paths;

    // Convert the relative paths to absolute
    Object.keys(globalPaths).forEach(function (key) {
        globalPaths[key] = PathUtils.makePathAbsolute(srcPath + "/" + globalPaths[key]);
    });

    /**
     * Returns the full path of the default user extensions directory. This is in the users
     * application support directory, which is typically
     * /Users/<user>/Application Support/Brackets/extensions/user on the mac, and
     * C:\Users\<user>\AppData\Roaming\Brackets\extensions\user on windows.
     */
    function getUserExtensionPath() {
        if (brackets.app.getApplicationSupportDirectory) {
            return brackets.app.getApplicationSupportDirectory() + "/extensions/user";
        }

        return null;
    }

    /**
     * Returns the require.js require context used to load an extension
     *
     * @param {!string} name, used to identify the extension
     * @return {!Object} A require.js require object used to load the extension, or undefined if
     * there is no require object with that name
     */
    function getRequireContextForExtension(name) {
        return contexts[name];
    }

    /**
     * @private
     * Get timeout value for rejecting an extension's async initExtension promise.
     * @return {number} Timeout in milliseconds
     */
    function _getInitExtensionTimeout() {
        return _initExtensionTimeout;
    }

    /**
     * @private
     * Set timeout for rejecting an extension's async initExtension promise.
     * @param {number} value Timeout in milliseconds
     */
    function _setInitExtensionTimeout(value) {
        _initExtensionTimeout = value;
    }

    /**
     * @private
     * Loads optional requirejs-config.json file for an extension
     * @param {Object} baseConfig
     * @return {$.Promise}
     */
    function _mergeConfig(baseConfig) {
        var deferred = new $.Deferred(),
            extensionConfigFile = FileSystem.getFileForPath(baseConfig.baseUrl + "/requirejs-config.json");

        // Optional JSON config for require.js
        FileUtils.readAsText(extensionConfigFile).done(function (text) {
            try {
                var extensionConfig = JSON.parse(text);

                // baseConfig.paths properties will override any extension config paths
                _.extend(extensionConfig.paths, baseConfig.paths);

                // Overwrite baseUrl, context, locale (paths is already merged above)
                _.extend(extensionConfig, _.omit(baseConfig, "paths"));

                deferred.resolve(extensionConfig);
            } catch (err) {
                // Failed to parse requirejs-config.json
                deferred.reject("failed to parse requirejs-config.json");
            }
        }).fail(function () {
            // If requirejs-config.json isn't specified, resolve with the baseConfig only
            deferred.resolve(baseConfig);
        });

        return deferred.promise();
    }

    /**
     * Loads the extension module that lives at baseUrl into its own Require.js context
     *
     * @param {!string} name, used to identify the extension
     * @param {!{baseUrl: string}} config object with baseUrl property containing absolute path of extension
     * @param {!string} entryPoint, name of the main js file to load
     * @return {!$.Promise} A promise object that is resolved when the extension is loaded, or rejected
     *              if the extension fails to load or throws an exception immediately when loaded.
     *              (Note: if extension contains a JS syntax error, promise is resolved not rejected).
     */
    function loadExtensionModule(name, config, entryPoint) {
        var extensionConfig = {
            context: name,
            baseUrl: config.baseUrl,
            paths: globalPaths,
            locale: brackets.getLocale()
        };

        // Read optional requirejs-config.json
        var promise = _mergeConfig(extensionConfig).then(function (mergedConfig) {
            // Create new RequireJS context and load extension entry point
            var extensionRequire = brackets.libRequire.config(mergedConfig),
                extensionRequireDeferred = new $.Deferred();

            contexts[name] = extensionRequire;
            extensionRequire([entryPoint], extensionRequireDeferred.resolve, extensionRequireDeferred.reject);

            return extensionRequireDeferred.promise();
        }).then(function (module) {
            // Extension loaded normally
            var initPromise;

            _extensions[name] = module;

            // Optional sync/async initExtension
            if (module && module.initExtension && (typeof module.initExtension === "function")) {
                // optional async extension init
                try {
                    initPromise = Async.withTimeout(module.initExtension(), _getInitExtensionTimeout());
                } catch (err) {
                    // Synchronous error while initializing extension
                    console.error("[Extension] Error -- error thrown during initExtension for " + name + ": " + err);
                    return new $.Deferred().reject(err).promise();
                }

                // initExtension may be synchronous and may not return a promise
                if (initPromise) {
                    // WARNING: These calls to initPromise.fail() and initPromise.then(),
                    // could also result in a runtime error if initPromise is not a valid
                    // promise. Currently, the promise is wrapped via Async.withTimeout(),
                    // so the call is safe as-is.
                    initPromise.fail(function (err) {
                        if (err === Async.ERROR_TIMEOUT) {
                            console.error("[Extension] Error -- timeout during initExtension for " + name);
                        } else {
                            console.error("[Extension] Error -- failed initExtension for " + name + (err ? ": " + err : ""));
                        }
                    });

                    return initPromise;
                }
            }
        }, function errback(err) {
            // Extension failed to load during the initial require() call
            var additionalInfo = String(err);
            if (err.requireType === "scripterror" && err.originalError) {
                // This type has a misleading error message - replace it with something clearer (URL of require() call that got a 404 result)
                additionalInfo = "Module does not exist: " + err.originalError.target.src;
            }
            console.error("[Extension] failed to load " + config.baseUrl + " - " + additionalInfo);

            if (err.requireType === "define") {
                // This type has a useful stack (exception thrown by ext code or info on bad getModule() call)
                console.log(err.stack);
            }
        });

        return promise;
    }

    /**
     * Loads the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} name, used to identify the extension
     * @param {!{baseUrl: string}} config object with baseUrl property containing absolute path of extension
     * @param {!string} entryPoint, name of the main js file to load
     * @return {!$.Promise} A promise object that is resolved when the extension is loaded, or rejected
     *              if the extension fails to load or throws an exception immediately when loaded.
     *              (Note: if extension contains a JS syntax error, promise is resolved not rejected).
     */
    function loadExtension(name, config, entryPoint) {
        var promise = new $.Deferred();

        // Try to load the package.json to figure out if we are loading a theme.
        ExtensionUtils.loadMetadata(config.baseUrl).always(promise.resolve);

        return promise
            .then(function (metadata) {
                // No special handling for themes... Let the promise propagate into the ExtensionManager
                if (metadata && metadata.theme) {
                    return;
                }

                if (!metadata.disabled) {
                    return loadExtensionModule(name, config, entryPoint);
                } else {
                    return new $.Deferred().reject("disabled").promise();
                }
            })
            .then(function () {
                exports.trigger("load", config.baseUrl);
            }, function (err) {
                if (err === "disabled") {
                    exports.trigger("disabled", config.baseUrl);
                } else {
                    exports.trigger("loadFailed", config.baseUrl);
                }
            });
    }

    /**
     * Runs unit tests for the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} name, used to identify the extension
     * @param {!{baseUrl: string}} config object with baseUrl property containing absolute path of extension
     * @param {!string} entryPoint, name of the main js file to load
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function testExtension(name, config, entryPoint) {
        var result = new $.Deferred(),
            extensionPath = config.baseUrl + "/" + entryPoint + ".js";

        FileSystem.resolve(extensionPath, function (err, entry) {
            if (!err && entry.isFile) {
                // unit test file exists
                var extensionRequire = brackets.libRequire.config({
                    context: name,
                    baseUrl: config.baseUrl,
                    paths: $.extend({}, config.paths, globalPaths)
                });

                extensionRequire([entryPoint], function () {
                    result.resolve();
                });
            } else {
                result.reject();
            }
        });

        return result.promise();
    }

    /**
     * @private
     * Loads a file entryPoint from each extension folder within the baseUrl into its own Require.js context
     *
     * @param {!string} directory, an absolute native path that contains a directory of extensions.
     *                  each subdirectory is interpreted as an independent extension
     * @param {!{baseUrl: string}} config object with baseUrl property containing absolute path of extension folder
     * @param {!string} entryPoint Module name to load (without .js suffix)
     * @param {function} processExtension
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function _loadAll(directory, config, entryPoint, processExtension) {
        var result = new $.Deferred();

        FileSystem.getDirectoryForPath(directory).getContents(function (err, contents) {
            if (!err) {
                var i,
                    extensions = [];

                for (i = 0; i < contents.length; i++) {
                    if (contents[i].isDirectory) {
                        // FUTURE (JRB): read package.json instead of just using the entrypoint "main".
                        // Also, load sub-extensions defined in package.json.
                        extensions.push(contents[i].name);
                    }
                }

                if (extensions.length === 0) {
                    result.resolve();
                    return;
                }

                Async.doInParallel(extensions, function (item) {
                    var extConfig = {
                        baseUrl: config.baseUrl + "/" + item,
                        paths: config.paths
                    };
                    return processExtension(item, extConfig, entryPoint);
                }).always(function () {
                    // Always resolve the promise even if some extensions had errors
                    result.resolve();
                });
            } else {
                console.error("[Extension] Error -- could not read native directory: " + directory);
                result.reject();
            }
        });

        return result.promise();
    }

    /**
     * Loads the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} directory, an absolute native path that contains a directory of extensions.
     *                  each subdirectory is interpreted as an independent extension
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function loadAllExtensionsInNativeDirectory(directory) {
        return _loadAll(directory, {baseUrl: directory}, "main", loadExtension);
    }

    /**
     * Runs unit test for the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} directory, an absolute native path that contains a directory of extensions.
     *                  each subdirectory is interpreted as an independent extension
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function testAllExtensionsInNativeDirectory(directory) {
        var bracketsPath = FileUtils.getNativeBracketsDirectoryPath(),
            config = {
                baseUrl: directory
            };

        config.paths = {
            "perf": bracketsPath + "/perf",
            "spec": bracketsPath + "/spec"
        };

        return _loadAll(directory, config, "unittests", testExtension);
    }

    /**
     * Load extensions.
     *
     * @param {?Array.<string>} A list containing references to extension source
     *      location. A source location may be either (a) a folder name inside
     *      src/extensions or (b) an absolute path.
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function init(paths) {
        var params = new UrlParams();

        if (_init) {
            // Only init once. Return a resolved promise.
            return new $.Deferred().resolve().promise();
        }

        if (!paths) {
            params.parse();

            if (params.get("reloadWithoutUserExts") === "true") {
                paths = ["default"];
            } else {
                paths = ["default", "dev", getUserExtensionPath()];
            }
        }

        // Load extensions before restoring the project

        // Get a Directory for the user extension directory and create it if it doesn't exist.
        // Note that this is an async call and there are no success or failure functions passed
        // in. If the directory *doesn't* exist, it will be created. Extension loading may happen
        // before the directory is finished being created, but that is okay, since the extension
        // loading will work correctly without this directory.
        // If the directory *does* exist, nothing else needs to be done. It will be scanned normally
        // during extension loading.
        var extensionPath = getUserExtensionPath();
        FileSystem.getDirectoryForPath(extensionPath).create();

        // Create the extensions/disabled directory, too.
        var disabledExtensionPath = extensionPath.replace(/\/user$/, "/disabled");
        FileSystem.getDirectoryForPath(disabledExtensionPath).create();

        var promise = Async.doSequentially(paths, function (item) {
            var extensionPath = item;

            // If the item has "/" in it, assume it is a full path. Otherwise, load
            // from our source path + "/extensions/".
            if (item.indexOf("/") === -1) {
                extensionPath = FileUtils.getNativeBracketsDirectoryPath() + "/extensions/" + item;
            }

            return loadAllExtensionsInNativeDirectory(extensionPath);
        }, false);

        promise.always(function () {
            _init = true;
        });

        return promise;
    }


    EventDispatcher.makeEventDispatcher(exports);

    // unit tests
    exports._setInitExtensionTimeout = _setInitExtensionTimeout;
    exports._getInitExtensionTimeout = _getInitExtensionTimeout;

    // public API
    exports.init = init;
    exports.getUserExtensionPath = getUserExtensionPath;
    exports.getRequireContextForExtension = getRequireContextForExtension;
    exports.loadExtension = loadExtension;
    exports.testExtension = testExtension;
    exports.loadAllExtensionsInNativeDirectory = loadAllExtensionsInNativeDirectory;
    exports.testAllExtensionsInNativeDirectory = testAllExtensionsInNativeDirectory;
});
