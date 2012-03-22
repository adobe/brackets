/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false, brackets: false, require: false */

/**
 * ExtensionLoader searches the filesystem for extensions, then creates a new context for each one and loads it
 *
 * Note: this file *cannot* be an AMD-wrapped module, because AMD-wrapped modules can only load statically-named modules
 */

define(function (coreRequire, exports, module) {
    'use strict';

    // Store require.js context that loads brackets core modules for use by extensions
    brackets.coreRequire = coreRequire;

    // Also store global require object so that extensions don't have to do weird things to get the global
    // Note: the variable 'require' is actually referring to the global 'require' object, since
    // the local one is named 'coreRequire'
    brackets.libRequire = require;

    function loadExtensions(extensionDirs) {
        var i;
		var extensionRequire = null;
		var createLoadLogger = function (name) { return function () { console.log("finished loading " + name); }; };

        for (i = 0; i < extensionDirs.length; i++) {
			// load extensions
			extensionRequire = brackets.libRequire.config({
			    context: extensionDirs[i],
			    baseUrl: "extensions/" + extensionDirs[i]
			});

			console.log("starting to load " + extensionDirs[i]);

			// TODO: instead of requiring this to be called "main", read package.json
			extensionRequire(["main"], createLoadLogger(extensionDirs[i]));
		}
    }

	// TODO: get the directories from the filesystem
	var extensionPath = window.location.pathname.substr(0, window.location.pathname.lastIndexOf("/")) + "/extensions";
	console.log("the extension path is: " + extensionPath);

	brackets.fs.readdir(extensionPath, function (err, data) {
		if (err) {
			console.log("Couldn't load extensions: " + err);
		} else {
			console.log("Loading the following extensions: " +  JSON.stringify(data));
			loadExtensions(data);
		}
	});

});
