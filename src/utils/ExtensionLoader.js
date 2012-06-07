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
/*global define, $, CodeMirror, brackets */

/**
 * ExtensionLoader searches the filesystem for extensions, then creates a new context for each one and loads it
 */

define(function (require, exports, module) {
    'use strict';

    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils           = require("file/FileUtils"),
        Async               = require("utils/Async"),
        contexts            = {};
    /**
     * Returns the require.js require context used to load an extension
     *
     * @param {!string} name, used to identify the extension
     * @return {!Object} A require.js require object used to load the extension, or undefined if 
     * there is no require object ith that name
     */
    function getRequireContextForExtension(name) {
        return contexts[name];
    }

    
    /**
     * Loads the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} name, used to identify the extension
     * @param {!string} baseUrl, URL path relative to index.html, where the main JS file can be found
     * @param {!string} entryPoint, name of the main js file to load
     * @return {!$.Promise} A promise object that is resolved when the extension is loaded.
     */
    function loadExtension(name, baseUrl, entryPoint) {
        var result = new $.Deferred(),
            extensionRequire = brackets.libRequire.config({
                context: name,
                baseUrl: baseUrl
            });
        contexts[name] = extensionRequire;

        console.log("[Extension] starting to load " + baseUrl);
        
        extensionRequire([entryPoint], function () {
            console.log("[Extension] finished loading " + baseUrl);
            result.resolve();
        });
        
        return result.promise();
    }

    /**
     * Runs unit tests for the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} name, used to identify the extension
     * @param {!string} baseUrl, URL path relative to index.html, where the main JS file can be found
     * @param {!string} entryPoint, name of the main js file to load
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function testExtension(name, baseUrl, entryPoint) {
        var result = new $.Deferred(),
            extensionPath = FileUtils.getNativeBracketsDirectoryPath();
        
        // Assumes the caller's window.location context is /test/SpecRunner.html
        extensionPath = extensionPath.replace("brackets/test", "brackets/src"); // convert from "test" to "src"
        extensionPath += "/" + baseUrl + "/" + entryPoint + ".js";

        var fileExists = false, statComplete = false;
        brackets.fs.stat(extensionPath, function (err, stat) {
            statComplete = true;
            if (err === brackets.fs.NO_ERROR && stat.isFile()) {
                // unit test file exists
                var extensionRequire = brackets.libRequire.config({
                    context: name,
                    baseUrl: "../src/" + baseUrl
                });
    
                console.log("[Extension] loading unit test " + baseUrl);
                extensionRequire([entryPoint], function () {
                    console.log("[Extension] loaded unit tests " + baseUrl);
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
     * @param {!string} baseUrl, URL path relative to index.html that maps to the same place as directory
     * @param {!string} entryPoint Module name to load (without .js suffix)
     * @param {function} processExtension 
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function _loadAll(directory, baseUrl, entryPoint, processExtension) {
        var result = new $.Deferred();
        
        NativeFileSystem.requestNativeFileSystem(directory,
            function (rootEntry) {
                rootEntry.createReader().readEntries(
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
                        
                        Async.doInParallel(extensions, function (item) {
                            return processExtension(item, baseUrl + "/" + item, entryPoint);
                        }).done(function () {
                            result.resolve();
                        }).fail(function () {
                            result.reject();
                        });
                    },
                    function (error) {
                        console.log("[Extension] Error -- could not read native directory: " + directory);
                    }
                );
            },
            function (error) {
                console.log("[Extension] Error -- could not open native directory: " + directory);
            });
        
        return result.promise();
    }
    
    /**
     * Loads the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} directory, an absolute native path that contains a directory of extensions.
     *                  each subdirectory is interpreted as an independent extension
     * @param {!string} baseUrl, URL path relative to index.html that maps to the same place as directory
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function loadAllExtensionsInNativeDirectory(directory, baseUrl) {
        return _loadAll(directory, baseUrl, "main", loadExtension);
    }
    
    /**
     * Runs unit test for the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} directory, an absolute native path that contains a directory of extensions.
     *                  each subdirectory is interpreted as an independent extension
     * @param {!string} baseUrl, URL path relative to index.html that maps to the same place as directory
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function testAllExtensionsInNativeDirectory(directory, baseUrl) {
        return _loadAll(directory, baseUrl, "unittests", testExtension);
    }
    
    exports.getRequireContextForExtension = getRequireContextForExtension;
    exports.loadExtension = loadExtension;
    exports.testExtension = testExtension;
    exports.loadAllExtensionsInNativeDirectory = loadAllExtensionsInNativeDirectory;
    exports.testAllExtensionsInNativeDirectory = testAllExtensionsInNativeDirectory;
});
