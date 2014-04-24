/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


define(function(require) {
    "use strict";
    var Commands       = require("command/Commands"),
        CommandManager = require("command/CommandManager"),
        Settings       = require("themes/Settings");

    CommandManager.register("Themes", Commands.THEMES, Settings.open);
});
