/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, brackets, window */

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

    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils           = require("file/FileUtils"),
        Async               = require("utils/Async");
    
    var _init       = false,
        /** @type {Object<string, Object>}  Stores require.js contexts of extensions */
        contexts    = {},
        srcPath     = FileUtils.getNativeBracketsDirectoryPath();
    
    // The native directory path ends with either "test" or "src". We need "src" to
    // load the text and i18n modules.
    srcPath = srcPath.replace(/\/test$/, "/src"); // convert from "test" to "src"

    var globalConfig = {
            "text" : srcPath + "/thirdparty/text",
            "i18n" : srcPath + "/thirdparty/i18n"
        };
    
    /**
     * Returns the full path of the default user extensions directory. This is in the users
     * application support directory, which is typically
     * /Users/<user>/Application Support/Brackets/extensions/user on the mac, and
     * C:\Users\<user>\AppData\Roaming\Brackets\extensions\user on windows.
     */
    function getUserExtensionPath() {
        return brackets.app.getApplicationSupportDirectory() + "/extensions/user";
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
        var result = new $.Deferred(),
            extensionRequire = brackets.libRequire.config({
                context: name,
                baseUrl: config.baseUrl,
                /* FIXME (issue #1087): can we pass this from the global require context instead of hardcoding twice? */
                paths: globalConfig,
                locale: brackets.getLocale()
            });
        contexts[name] = extensionRequire;

        // console.log("[Extension] starting to load " + config.baseUrl);
        
        extensionRequire([entryPoint],
            function () {
                // console.log("[Extension] finished loading " + config.baseUrl);
                result.resolve();
                $(exports).triggerHandler("load", config.baseUrl);
            },
            function errback(err) {
                console.error("[Extension] failed to load " + config.baseUrl, err);
                if (err.requireType === "define") {
                    // This type has a useful stack (exception thrown by ext code or info on bad getModule() call)
                    console.log(err.stack);
                }
                result.reject();
                $(exports).triggerHandler("loadFailed", config.baseUrl);
            });
        
        return result.promise();
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

        var fileExists = false, statComplete = false;
        brackets.fs.stat(extensionPath, function (err, stat) {
            statComplete = true;
            if (err === brackets.fs.NO_ERROR && stat.isFile()) {
                // unit test file exists
                var extensionRequire = brackets.libRequire.config({
                    context: name,
                    baseUrl: config.baseUrl,
                    paths: $.extend({}, config.paths, globalConfig)
                });
    
                // console.log("[Extension] loading unit test " + config.baseUrl);
                extensionRequire([entryPoint], function () {
                    // console.log("[Extension] loaded unit tests " + config.baseUrl);
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
        
        NativeFileSystem.requestNativeFileSystem(directory,
            function (fs) {
                fs.root.createReader().readEntries(
                    function (entries) {
                        var i,
                            extensions = [];
                        
                        for (i = 0; i < entries.length; i++) {
                            if (entries[i].isDirectory) {
                                // FUTURE (JRB): read package.json instead of just using the entrypoint "main".
                                // Also, load sub-extensions defined in package.json.
                                extensions.push(entries[i].name);
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
                    },
                    function (error) {
                        console.error("[Extension] Error -- could not read native directory: " + directory);
                        result.reject();
                    }
                );
            },
            function (error) {
                console.error("[Extension] Error -- could not open native directory: " + directory);
                result.reject();
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
     * @param {?string} A list containing references to extension source
     *      location. A source location may be either (a) a folder path
     *      relative to src/extensions or (b) an absolute path.
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function init(paths) {
        if (_init) {
            // Only init once. Return a resolved promise.
            return new $.Deferred().resolve().promise();
        }
        
        if (!paths) {
            paths = "default,dev," + getUserExtensionPath();
        }

        // Load extensions before restoring the project
        
        // Create a new DirectoryEntry and call getDirectory() on the user extension
        // directory. If the directory doesn't exist, it will be created.
        // Note that this is an async call and there are no success or failure functions passed
        // in. If the directory *doesn't* exist, it will be created. Extension loading may happen
        // before the directory is finished being created, but that is okay, since the extension
        // loading will work correctly without this directory.
        // If the directory *does* exist, nothing else needs to be done. It will be scanned normally
        // during extension loading.
        var extensionPath = getUserExtensionPath();
        new NativeFileSystem.DirectoryEntry().getDirectory(extensionPath,
                                                           {create: true});
        
        // Create the extensions/disabled directory, too.
        var disabledExtensionPath = extensionPath.replace(/\/user$/, "/disabled");
        new NativeFileSystem.DirectoryEntry().getDirectory(disabledExtensionPath,
                                                           {create: true});
        
        var promise = Async.doInParallel(paths.split(","), function (item) {
            var extensionPath = item;
            
            // If the item has "/" in it, assume it is a full path. Otherwise, load
            // from our source path + "/extensions/".
            if (item.indexOf("/") === -1) {
                extensionPath = FileUtils.getNativeBracketsDirectoryPath() + "/extensions/" + item;
            }
            
            return loadAllExtensionsInNativeDirectory(extensionPath);
        });
        
        promise.always(function () {
            _init = true;
        });
        
        return promise;
    }
    
    exports.init = init;
    exports.getUserExtensionPath = getUserExtensionPath;
    exports.getRequireContextForExtension = getRequireContextForExtension;
    exports.loadExtension = loadExtension;
    exports.testExtension = testExtension;
    exports.loadAllExtensionsInNativeDirectory = loadAllExtensionsInNativeDirectory;
    exports.testAllExtensionsInNativeDirectory = testAllExtensionsInNativeDirectory;
});
