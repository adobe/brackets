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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false, brackets: false */

/**
 * ExtensionLoader searches the filesystem for extensions, then creates a new context for each one and loads it
 */

define(function (require, exports, module) {
    'use strict';

    var NativeFileSystem = require("file/NativeFileSystem").NativeFileSystem;
    
    /**
     * Loads the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} name, used to identify the extension
     * @param {!string} baseUrl, URL path relative to index.html, where the main JS file can be found
     * @param {!string} entryPoint, name of the main js file to load
     */
    function loadExtension(name, baseUrl, entryPoint) {
        var i;
        var extensionRequire = brackets.libRequire.config({
            context: name,
            baseUrl: baseUrl
        });

        console.log("[Extension] starting to load " + baseUrl);
        
        extensionRequire([entryPoint], function () { console.log("[Extension] finished loading " + baseUrl); });
    }

    /**
     * Loads the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} directory, an absolute native path that contains a directory of extensions.
                        each subdirectory is interpreted as an independent extension
     * @param {!string} baseUrl, URL path relative to index.html that maps to the same place as directory
     */
    function loadAllExtensionsInNativeDirectory(directory, baseUrl) {
        NativeFileSystem.requestNativeFileSystem(directory,
            function (rootEntry) {
                rootEntry.createReader().readEntries(
                    function (entries) {
                        var i;
                        for (i = 0; i < entries.length; i++) {
                            if (entries[i].isDirectory) {
                                // FUTURE (JRB): read package.json instead of just using the entrypoint "main".
                                // Also, load sub-extensions defined in package.json.
                                loadExtension(entries[i].name, baseUrl + "/" + entries[i].name, "main");
                            }
                        }
                    },
                    function (error) {
                        console.log("[Extension] Error -- could not read native directory: " + directory);
                    }
                );
            },
            function (error) {
                console.log("[Extension] Error -- could not open native directory: " + directory);
            });
    }
    
    exports.loadExtension = loadExtension;
    exports.loadAllExtensionsInNativeDirectory = loadAllExtensionsInNativeDirectory;
});
