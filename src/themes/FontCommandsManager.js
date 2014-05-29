/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 * @author Brad Gearon
 *
 * Licensed under MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function (require, exports, module) {
    "use strict";

    var ThemeSettings       = require("view/ThemeSettings"),
        ViewCommandHandlers = require("view/ViewCommandHandlers"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        prefs               = PreferencesManager.getExtensionPrefs("brackets-themes");

    function updateThemeFontSize (evt, adjustment, fontSize /*, lineHeight*/) {
        prefs.set("fontSize", fontSize);
    }

    function updateBracketsFontSize() {
        var fontSize        = prefs.get("fontSize"),
            fontSizeNumeric = Number(fontSize.replace(/px|em/, "")),
            fontSizeOffset  = fontSizeNumeric - ThemeSettings.defaults.fontSize;

        if(!isNaN(fontSizeOffset)) {
            PreferencesManager.setViewState("fontSizeAdjustment", fontSizeOffset);
            PreferencesManager.setViewState("fontSizeStyle", fontSize);
        }
    }

    $(ViewCommandHandlers).on("fontSizeChange", updateThemeFontSize);
    prefs.on("change", "fontSize", updateBracketsFontSize);
    updateBracketsFontSize();
});
