/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false, brackets: false, require: false */

/**
 * ExtensionLoader searches the filesystem for extensions, then creates a new context for each one and loads it
 */

define(function (require, exports, module) {
    'use strict';

    var NativeFileSystem = require("file/NativeFileSystem").NativeFileSystem;
    

    function loadExtension(name, baseUrl, entryPoint) {
        var i;
		var extensionRequire = brackets.libRequire.config({
			context: name,
			baseUrl: baseUrl
		});

		console.log("[Extension] starting to load " + baseUrl);

		extensionRequire([entryPoint], function () { console.log("[Extension] finished loading " + baseUrl); });
    }

    function loadAllExtensionsInNativeDirectory(directory, baseUrl) {
        NativeFileSystem.requestNativeFileSystem(directory,
            function (rootEntry) {
                rootEntry.createReader().readEntries(
                    function (entries) {
                        var i;
                        for (i = 0; i < entries.length; i++) {
                            if (entries[i].isDirectory) {
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
