/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 * @author Brad Gearon
 *
 * Licensed under MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function (require) {
    "use strict";

    var Settings            = require("themes/SettingsManager"),
        DefaultSettings     = require("themes/DefaultSettings"),
        ViewCommandHandlers = require("view/ViewCommandHandlers"),
        PreferencesManager  = require("preferences/PreferencesManager");


    function updateThemeFontSize (evt, adjustment, fontSize /*, lineHeight*/) {
        Settings.setValue("fontSize", fontSize);
    }


    function updateBracketsFontSize() {
        var fontSize = Settings.getValue("fontSize"),
            fontSizeNumeric = Number(fontSize.replace(/px|em/, "")),
            fontSizeOffset = fontSizeNumeric - DefaultSettings.fontSize;

        if(!isNaN(fontSizeOffset)) {
            PreferencesManager.setViewState("fontSizeAdjustment", fontSizeOffset);
            PreferencesManager.setViewState("fontSizeStyle", fontSize);
        }
    }


    $(ViewCommandHandlers).on("fontSizeChange", updateThemeFontSize);
    $(Settings).on("change:fontSize", updateBracketsFontSize);
    updateBracketsFontSize();
});
