/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function (require) {
    "use strict";

    var Settings = require("themes/SettingsManager");
    var $scrollbars = $("<style id='scrollbars'>").appendTo("head");
    var theme;


    function scrollbarsApply(themeManager) {
        scrollbarsApply.update(themeManager);
    }


    scrollbarsApply.update = function(themeManager) {
        theme = themeManager ? themeManager.getThemes()[0] : (theme || {});
        if ( Settings.getValue("customScrollbars") ) {
            var scrollbar = (theme.scrollbar || []).join(" ");
            $scrollbars.text(scrollbar || "");
        }
        else {
            $scrollbars.text("");
        }
    };


    scrollbarsApply.enable = function(themeManager) {
        Settings.setValue("customScrollbars", true);
        scrollbarsApply.update(themeManager);
    };


    scrollbarsApply.disable = function(themeManager) {
        Settings.setValue("customScrollbars", true);
        scrollbarsApply.update(themeManager);
    };


    $(Settings).on("change:customScrollbars", function() {
        scrollbarsApply.update();
    });


    return scrollbarsApply;
});

