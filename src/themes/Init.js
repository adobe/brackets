/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


define(function (require, exports, module) {
    "use strict";

    require("themes/String");
    require("themes/MenuCommands");

    var ExtensionUtils   = require("utils/ExtensionUtils"),
        ThemeManager     = require("themes/ThemeManager"),
        CodeMirrorAddons = require("themes/CodeMirrorAddons");

    // Load up reset.css to override brackground settings from brackets because
    // they make the themes look really bad.
    ExtensionUtils.loadStyleSheet(module, "reset.css");
    ExtensionUtils.loadStyleSheet(module, "views/settings.css");

	function init() {
		CodeMirrorAddons.ready(ThemeManager);
	}
	
	exports.init = init;
});

