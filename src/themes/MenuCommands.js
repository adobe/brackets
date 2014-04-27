/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function(require) {
    "use strict";
    var Commands       = require("command/Commands"),
        CommandManager = require("command/CommandManager"),
        Strings        = require("strings"),
        Settings       = require("themes/SettingsManager");

    CommandManager.register(Strings.CMD_THEMES, Commands.THEMES, Settings.open);
});
