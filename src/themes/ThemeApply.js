/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


define(function() {
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
        $(ExtensionUtils).trigger("Themes.themeChanged", themeManager.getThemes());
    }

    return ThemeApply;
});
