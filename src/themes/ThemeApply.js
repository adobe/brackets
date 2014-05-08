/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require, CodeMirror */

define(function(require) {
    "use strict";

    var ExtensionUtils = require("utils/ExtensionUtils");

    /**
    *  Handles updating codemirror with the current selection of themes.
    */
    function ThemeApply (themeManager, cm) {
        var newThemes     = themeManager.selected.join(" "),
            currentThemes = cm.getOption("theme");

        // Check if the editor already has the theme applied...
        if (currentThemes === newThemes) {
            return;
        }

        // Setup current and further documents to get the new theme...
        CodeMirror.defaults.theme = newThemes;
        cm.setOption("theme", newThemes);
    }

    return ThemeApply;
});
