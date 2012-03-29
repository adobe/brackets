/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false, brackets: false, require: false */

/**
 * ExtensionLoader searches the filesystem for extensions, then creates a new context for each one and loads it
 */

define(function (coreRequire, exports, module) {
    'use strict';

    // Store require.js context that loads brackets core modules for use by extensions
    brackets.coreRequire = coreRequire;

    // Also store global require object so that extensions don't have to do weird things to get the global
    // Note: the variable 'require' is actually referring to the global 'require' object, since
    // the local one is named 'coreRequire'
    brackets.libRequire = require;

    function loadExtension(baseUrl, entryPoint) {
        var i;
		var extensionRequire = brackets.libRequire.config({
			context: extensionDirs[i],
			baseUrl: baseUrl
		});

		console.log("[Extension] starting to load " + baseUrl);

		extensionRequire([entryPoint], function () { console.log("[Extension] finished loading " + baseUrl) });
    }


    function loadAllExtensionsInDirectory(directory, baseUrl) {
        brackets.fs.readdir(directory, function (err, subdirs) {
            var i;
            if (err) {
                console.log("Couldn't load extensions: " + err);
            } else {
                console.log("Loading the following extensions: " +  JSON.stringify(subdirs));
                for (i = 0; i < subdirs.length; i++) {
                    // FUTURE (JRB): instead of requiring this to be called "main", read package.json
                    loadExtension(baseUrl + "/" + subdirs[i], "main");
                }
            }
        });
    }
    
    exports.loadExtension = loadExtension;
    exports.loadAllExtensionsInDirectory = loadAllExtensionsInDirectory;
});
